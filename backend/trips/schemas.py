# trips/schemas.py
from ninja import Schema
from typing import List, Optional
from datetime import datetime
from decimal import Decimal

class TripStopInputSchema(Schema):
    stop_name: str
    latitude: float
    longitude: float
    stop_order: int
    price_from_origin: Optional[Decimal] = None

class TripStopOutSchema(Schema):
    id: int
    stop_name: str
    stop_order: int
    price_from_origin: Optional[Decimal] = None

class TripCreateSchema(Schema):
    origin_name: str
    origin_lat: float
    origin_lng: float
    destination_name: str
    destination_lat: float
    destination_lng: float
    departure_time: datetime
    available_seats: int
    price_per_seat: Decimal
    notes: Optional[str] = ""
    stops: List[TripStopInputSchema] = []

class TripOutSchema(Schema):
    id: int
    origin_name: str
    destination_name: str
    departure_time: datetime
    available_seats: int
    price_per_seat: Decimal
    notes: Optional[str] = ""
    stops: List[TripStopOutSchema] = []