# backend/users/models.py
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    # Ensure email is unique for Google authentication
    email = models.EmailField(unique=True)

    # Canadian / E.164 phone number support (+1XXXXXXXXXX)
    phone_number = models.CharField(
        max_length=20, unique=True, null=True, blank=True
    )
    is_phone_verified = models.BooleanField(default=False)
    is_email_verified = models.BooleanField(default=False)

    avatar_url = models.URLField(max_length=500, blank=True, null=True)

    # Driver profile & vehicle info
    bio = models.TextField(blank=True, default="")
    vehicle_make_model = models.CharField(max_length=100, blank=True, default="")
    vehicle_color = models.CharField(max_length=50, blank=True, default="")
    vehicle_plate = models.CharField(max_length=20, blank=True, default="")

    # Primary login field configuration
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    def __str__(self):
        return self.email