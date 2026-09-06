# backend/bookings/admin.py
from django.contrib import admin
from .models import Booking


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "trip",
        "rider",
        "seats_booked",
        "total_price",
        "status",
        "created_at",
    ]
    list_filter = ["status", "created_at"]