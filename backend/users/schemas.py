# backend/users/schemas.py
from ninja import Schema
from typing import Optional


class RegisterSchema(Schema):
    email: str
    username: str
    password: str
    phone_number: Optional[str] = None


class LoginSchema(Schema):
    email: str
    password: str


class TokenOutSchema(Schema):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    email: str


class UserOutSchema(Schema):
    id: int
    username: str
    email: str
    first_name: Optional[str] = ""
    last_name: Optional[str] = ""
    phone_number: Optional[str] = ""
    bio: Optional[str] = ""
    vehicle_make_model: Optional[str] = ""
    vehicle_color: Optional[str] = ""
    vehicle_plate: Optional[str] = ""