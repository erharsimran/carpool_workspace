
from datetime import timedelta
from typing import List, Optional
from django.contrib.auth import get_user_model
from django.contrib.gis.geos import Point
from django.contrib.gis.measure import D
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

    # GeoDjango Point format: (Longitude, Latitude)
    origin_point = Point(
        payload.origin_coords.longitude,
        payload.origin_coords.latitude,
        srid=4326,
    )
    destination_point = Point(
        payload.destination_coords.longitude,
        payload.destination_coords.latitude,
        srid=4326,
    )

    # Assemble waypoints in order: Origin -> Intermediate Stops -> Destination
    sorted_stops = sorted(payload.stops or [], key=lambda s: s.stop_order)
    waypoint_coords = [(payload.origin_coords.longitude, payload.origin_coords.latitude)]
    for stop in sorted_stops:
        # Handles both object or dict coordinate representations
        lng = getattr(stop, "longitude", None) or getattr(getattr(stop, "coords", None), "longitude", 0.0)
        lat = getattr(stop, "latitude", None) or getattr(getattr(stop, "coords", None), "latitude", 0.0)
        waypoint_coords.append((lng, lat))
    waypoint_coords.append((payload.destination_coords.longitude, payload.destination_coords.latitude))

    # Fetch real highway routing geometry from local OSRM
    route_line = fetch_route_geometry(waypoint_coords)

    trip = Trip.objects.create(
        driver=driver,
        origin_name=payload.origin_name,
        origin_coords=origin_point,
        destination_name=payload.destination_name,
        destination_coords=destination_point,
        route_geometry=route_line,
        departure_time=payload.departure_time,
        available_seats=payload.available_seats,
        price_per_seat=payload.price_per_seat,
        notes=payload.notes or "",
        status="scheduled",
    )

    for stop_data in sorted_stops:
        lng = getattr(stop_data, "longitude", None) or getattr(getattr(stop_data, "coords", None), "longitude", 0.0)
        lat = getattr(stop_data, "latitude", None) or getattr(getattr(stop_data, "coords", None), "latitude", 0.0)
        stop_point = Point(lng, lat, srid=4326)

        TripStop.objects.create(
            trip=trip,
            stop_name=stop_data.stop_name,
            location=stop_point,
            stop_order=stop_data.stop_order,
            price_from_origin=getattr(stop_data, "price_from_origin", None),
        )

    return 201, trip


@router.get("/", response=List[TripOutSchema])
def list_trips(request):
    return Trip.objects.filter(status="scheduled").order_by("departure_time")


@router.get("/search", response=List[TripOutSchema])
def search_trips(
    request,
    origin_lat: Optional[float] = None,
    origin_lng: Optional[float] = None,
    dest_lat: Optional[float] = None,
    dest_lng: Optional[float] = None,
    radius_km: float = 15.0,
):
    matched_trips = Trip.objects.filter(
        status="scheduled",
        available_seats__gt=0,
    )

    search_distance = D(km=radius_km)

    # 1. Filter by Origin (pickup stop or trip origin within radius)
    if origin_lat is not None and origin_lng is not None:
        rider_origin = Point(origin_lng, origin_lat, srid=4326)
        matched_trips = matched_trips.filter(
            Q(origin_coords__dwithin=(rider_origin, search_distance))
            | Q(stops__location__dwithin=(rider_origin, search_distance))
        )

    # 2. Filter by Destination (dropoff stop or trip destination within radius)
    if dest_lat is not None and dest_lng is not None:
        rider_destination = Point(dest_lng, dest_lat, srid=4326)
        matched_trips = matched_trips.filter(
            Q(destination_coords__dwithin=(rider_destination, search_distance))
            | Q(stops__location__dwithin=(rider_destination, search_distance))
        )

    return matched_trips.distinct().order_by("departure_time")


@router.get("/my-posted", response=List[TripOutSchema], auth=GlobalAuth())
def get_my_posted_trips(request):
    driver = _get_authenticated_driver(request)
    return Trip.objects.filter(driver=driver).order_by("-departure_time")


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

    # Cancel any confirmed bookings and release reservations
    if hasattr(trip, "bookings"):
        trip.bookings.filter(status="confirmed").update(status="cancelled")

    return trip