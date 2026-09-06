# backend/users/api.py
from typing import Optional
from django.contrib.auth import get_user_model
from ninja import Router, Schema
from ninja.errors import HttpError

from .auth import GlobalAuth, generate_token
from .schemas import LoginSchema, RegisterSchema, TokenOutSchema, UserOutSchema

router = Router(tags=["Authentication"])
User = get_user_model()


class ProfileUpdateSchema(Schema):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone_number: Optional[str] = None
    bio: Optional[str] = None
    vehicle_make_model: Optional[str] = None
    vehicle_color: Optional[str] = None
    vehicle_plate: Optional[str] = None


@router.post("/register", response={201: TokenOutSchema})
def register(request, payload: RegisterSchema):
    if User.objects.filter(email=payload.email).exists():
        raise HttpError(400, "A user with this email already exists.")

    if User.objects.filter(username=payload.username).exists():
        raise HttpError(400, "This username is already taken.")

    user = User.objects.create_user(
        username=payload.username,
        email=payload.email,
        password=payload.password,
        phone_number=payload.phone_number,
    )

    token = generate_token(user.id)
    return 201, {
        "access_token": token,
        "token_type": "bearer",
        "user_id": user.id,
        "email": user.email,
    }


@router.post("/login", response=TokenOutSchema)
def login(request, payload: LoginSchema):
    user = User.objects.filter(email=payload.email).first()
    if not user or not user.check_password(payload.password):
        raise HttpError(401, "Invalid email or password.")

    token = generate_token(user.id)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": user.id,
        "email": user.email,
    }


@router.get("/me", response=UserOutSchema, auth=GlobalAuth())
def get_current_user(request):
    return request.auth


@router.put("/me", response=UserOutSchema, auth=GlobalAuth())
def update_profile(request, payload: ProfileUpdateSchema):
    user = request.auth

    for field, value in payload.dict(exclude_unset=True).items():
        if hasattr(user, field) and value is not None:
            setattr(user, field, value)

    user.save()
    return user