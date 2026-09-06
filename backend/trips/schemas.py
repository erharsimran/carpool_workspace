from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from ninja import Schema


class CoordinateSchema(Schema):
    latitude: float
    longitude: float


class TripStopCreateSchema(Schema):
    stop_name: str
    latitude: float
    longitude: float
    stop_order: int
    price_from_origin: Optional[Decimal] = None


class TripCreateSchema(Schema):
    origin_name: str
    origin_coords: CoordinateSchema
    destination_name: str
    destination_coords: CoordinateSchema
    departure_time: datetime
    available_seats: int
    price_per_seat: Decimal
    notes: Optional[str] = ""
    stops: Optional[List[TripStopCreateSchema]] = []


class TripOutSchema(Schema):
    id: int
    driver_id: int
    origin_name: str
    origin_coords: CoordinateSchema
    destination_name: str
    destination_coords: CoordinateSchema
    departure_time: datetime
    available_seats: int
    price_per_seat: Decimal
    status: str
    notes: str

    @staticmethod
    def resolve_origin_coords(obj):
        return {"latitude": obj.origin_coords.y, "longitude": obj.origin_coords.x}

    @staticmethod
    def resolve_destination_coords(obj):
        return {"latitude": obj.destination_coords.y, "longitude": obj.destination_coords.x}