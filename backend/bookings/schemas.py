from datetime import datetime
from decimal import Decimal
from typing import Optional
from ninja import Schema


class BookingCreateSchema(Schema):
    trip_id: int
    seats_booked: int = 1
    pickup_stop_id: Optional[int] = None
    dropoff_stop_id: Optional[int] = None
class DriverSummarySchema(Schema):
    id: int
    username: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    vehicle_make_model: Optional[str] = None
class TripSummarySchema(Schema):
    id: int
    origin_name: str
    destination_name: str
    departure_time: datetime
    available_seats: int
    price_per_seat: Decimal
    driver: Optional[DriverSummarySchema] = None
class BookingOutSchema(Schema):
    id: int
    trip_id: int
    rider_id: int
    seats_booked: int
    total_price: Decimal
    status: str
    pickup_stop_id: Optional[int] = None
    dropoff_stop_id: Optional[int] = None
    created_at: datetime
    trip: TripSummarySchema