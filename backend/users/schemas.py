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
    email: str
    username: str
    phone_number: Optional[str] = None
    is_phone_verified: bool
    is_email_verified: bool
    avatar_url: Optional[str] = None