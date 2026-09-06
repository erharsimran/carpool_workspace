# backend/trips/api.py
from typing import List
from django.contrib.auth import get_user_model
from django.contrib.gis.geos import Point
from django.contrib.gis.measure import D
from django.db.models import Q
from ninja import Router
from typing import List, Optional
from .models import Trip, TripStop
from .schemas import TripCreateSchema, TripOutSchema
from .services.osrm import fetch_route_geometry
from users.auth import GlobalAuth
router = Router(tags=["Trips"])
User = get_user_model()


@router.post("/", response={201: TripOutSchema}, auth=GlobalAuth())
def create_trip(request, payload: TripCreateSchema):
    driver = User.objects.filter(is_active=True).first()
    if not driver:
        driver = User.objects.create_user(
            username="testdriver", email="driver@example.com"
        )

    # Standard GeoDjango (Longitude, Latitude)
    origin_point = Point(payload.origin_coords.longitude, payload.origin_coords.latitude, srid=4326)
    destination_point = Point(payload.destination_coords.longitude, payload.destination_coords.latitude, srid=4326)

    # Assemble waypoints in order: Origin -> Stops -> Destination
    sorted_stops = sorted(payload.stops or [], key=lambda s: s.stop_order)
    waypoint_coords = [(payload.origin_coords.longitude, payload.origin_coords.latitude)]
    for stop in sorted_stops:
        waypoint_coords.append((stop.longitude, stop.latitude))
    waypoint_coords.append((payload.destination_coords.longitude, payload.destination_coords.latitude))

    # Fetch highway route geometry from OSRM
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
    )

    for stop_data in sorted_stops:
        stop_point = Point(stop_data.longitude, stop_data.latitude, srid=4326)
        TripStop.objects.create(
            trip=trip,
            stop_name=stop_data.stop_name,
            location=stop_point,
            stop_order=stop_data.stop_order,
            price_from_origin=stop_data.price_from_origin,
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