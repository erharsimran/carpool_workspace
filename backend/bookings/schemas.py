# backend/bookings/schemas.py
from datetime import datetime
from decimal import Decimal
from typing import Optional
from ninja import Schema


class BookingCreateSchema(Schema):
    trip_id: int
    seats_booked: int = 1
    pickup_stop_id: Optional[int] = None
    dropoff_stop_id: Optional[int] = None


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