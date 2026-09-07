from datetime import timedelta
from typing import List, Optional
from django.contrib.auth import get_user_model
from django.contrib.gis.geos import Point
from django.contrib.gis.measure import D
from django.db import transaction
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from ninja import Router, Schema
from ninja.errors import HttpError

from users.auth import GlobalAuth
from .models import Trip, TripStop
from .schemas import TripCreateSchema, TripOutSchema
from .services.osrm import fetch_route_geometry

router = Router(tags=["Trips"])
User = get_user_model()


class TripUpdateSchema(Schema):
    available_seats: Optional[int] = None
    price_per_seat: Optional[float] = None
    notes: Optional[str] = None


def _get_authenticated_driver(request):
    """Helper to retrieve authenticated user or fallback to active test driver in dev."""
    user = getattr(request, "auth", None)
    if user and getattr(user, "is_authenticated", False):
        return user

    driver = User.objects.filter(is_active=True).first()
    if not driver:
        driver = User.objects.create_user(
            username="testdriver", email="driver@example.com"
        )
    return driver


@router.post("/", response={201: TripOutSchema}, auth=GlobalAuth())
def create_trip(request, payload: TripCreateSchema):
    driver = _get_authenticated_driver(request)
    vehicle_model = getattr(driver, "vehicle_make_model", None)
    vehicle_plate = getattr(driver, "vehicle_plate", None)
    if not vehicle_model or not vehicle_plate:
        raise HttpError(
            400,
            "You must register your vehicle details (make/model and plate) in your profile before posting a ride.",
        )
    with transaction.atomic():
        trip = Trip.objects.create(
            driver=driver,
            origin_name=payload.origin_name,
            origin_coords=Point(payload.origin_lng, payload.origin_lat, srid=4326),
            destination_name=payload.destination_name,
            destination_coords=Point(payload.destination_lng, payload.destination_lat, srid=4326),
            departure_time=payload.departure_time,
            available_seats=payload.available_seats,
            price_per_seat=payload.price_per_seat,
            notes=payload.notes or "",
        )

        for stop_data in (payload.stops or []):
            TripStop.objects.create(
                trip=trip,
                stop_name=stop_data.stop_name,
                location=Point(stop_data.longitude, stop_data.latitude, srid=4326),
                stop_order=stop_data.stop_order,
                price_from_origin=stop_data.price_from_origin,
            )

    return 201, (
        Trip.objects.select_related("driver")
        .prefetch_related("stops")
        .get(id=trip.id)
    )


@router.get("/", response=List[TripOutSchema])
def list_trips(request):
    return (
        Trip.objects.filter(
            status="scheduled",
            departure_time__gte=timezone.now(),
        )
        .select_related("driver")
        .prefetch_related("stops")
        .order_by("departure_time")
    )


@router.get("/search", response=List[TripOutSchema])
def search_trips(
    request,
    origin_lat: Optional[float] = None,
    origin_lng: Optional[float] = None,
    dest_lat: Optional[float] = None,
    dest_lng: Optional[float] = None,
    radius_km: float = 15.0,
):
    # Only scheduled, future trips with open seats
    matched_trips = Trip.objects.filter(
        status="scheduled",
        available_seats__gt=0,
        departure_time__gte=timezone.now(),
    )

    search_distance = D(km=radius_km)

    # 1. Filter by Origin (trip origin or intermediate pickup stop within radius)
    if origin_lat is not None and origin_lng is not None:
        rider_origin = Point(origin_lng, origin_lat, srid=4326)
        matched_trips = matched_trips.filter(
            Q(origin_coords__dwithin=(rider_origin, search_distance))
            | Q(stops__location__dwithin=(rider_origin, search_distance))
        )

    # 2. Filter by Destination (trip destination or intermediate dropoff stop within radius)
    if dest_lat is not None and dest_lng is not None:
        rider_destination = Point(dest_lng, dest_lat, srid=4326)
        matched_trips = matched_trips.filter(
            Q(destination_coords__dwithin=(rider_destination, search_distance))
            | Q(stops__location__dwithin=(rider_destination, search_distance))
        )

    return (
        matched_trips.distinct()
        .select_related("driver")
        .prefetch_related("stops")
        .order_by("departure_time")
    )


@router.get("/my-posted", response=List[TripOutSchema], auth=GlobalAuth())
def get_my_posted_trips(request):
    driver = _get_authenticated_driver(request)
    return (
        Trip.objects.filter(driver=driver)
        .select_related("driver")
        .prefetch_related("stops")
        .order_by("-departure_time")
    )


@router.put("/{trip_id}", response=TripOutSchema, auth=GlobalAuth())
def update_trip(request, trip_id: int, payload: TripUpdateSchema):
    driver = _get_authenticated_driver(request)
    trip = get_object_or_404(Trip, id=trip_id, driver=driver)

    if trip.status != "scheduled":
        raise HttpError(400, f"Cannot edit a trip that is already {trip.status}.")

    if payload.available_seats is not None:
        if payload.available_seats < 1 or payload.available_seats > 8:
            raise HttpError(400, "Seats must be between 1 and 8.")
        trip.available_seats = payload.available_seats

    if payload.price_per_seat is not None:
        if payload.price_per_seat <= 0:
            raise HttpError(400, "Price must be greater than $0.")
        trip.price_per_seat = payload.price_per_seat

    if payload.notes is not None:
        trip.notes = payload.notes.strip()

    trip.save()
    return trip


@router.post("/{trip_id}/cancel", response=TripOutSchema, auth=GlobalAuth())
def cancel_posted_trip(request, trip_id: int):
    driver = _get_authenticated_driver(request)
    trip = get_object_or_404(Trip, id=trip_id, driver=driver)

    if trip.status == "cancelled":
        raise HttpError(400, "This ride has already been cancelled.")

    # 5-Hour Cutoff Enforcement
    now = timezone.now()
    cancellation_deadline = trip.departure_time - timedelta(hours=5)

    if now >= cancellation_deadline:
        raise HttpError(
            400,
            "Cancellations locked: Drivers cannot cancel trips within 5 hours of departure.",
        )

    trip.status = "cancelled"
    trip.save()

    # Cancel confirmed bookings and release reservations
    if hasattr(trip, "bookings"):
        trip.bookings.filter(status="confirmed").update(status="cancelled")

    return trip