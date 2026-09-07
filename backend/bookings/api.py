# backend/bookings/api.py
from decimal import Decimal
from typing import List
from django.db import transaction
from django.shortcuts import get_object_or_404
from ninja import Router
from ninja.errors import HttpError

from trips.models import Trip, TripStop
from users.auth import GlobalAuth
from .models import Booking
from .schemas import BookingCreateSchema, BookingOutSchema

router = Router(tags=["Bookings"], auth=GlobalAuth())


@router.post("/", response={201: BookingOutSchema})
def create_booking(request, payload: BookingCreateSchema):
    rider = request.auth

    if payload.seats_booked <= 0:
        raise HttpError(400, "You must book at least 1 seat.")

    # Atomic transaction with row locking
    with transaction.atomic():
        try:
            trip = Trip.objects.select_for_update().get(id=payload.trip_id)
        except Trip.DoesNotExist:
            raise HttpError(404, "Trip not found.")

        if trip.driver_id == rider.id:
            raise HttpError(400, "Drivers cannot book seats on their own trip.")

        if trip.status != "scheduled":
            raise HttpError(400, f"Cannot book a trip that is {trip.status}.")

        if trip.available_seats < payload.seats_booked:
            raise HttpError(400, f"Only {trip.available_seats} seat(s) remaining.")

        pickup_stop = None
        dropoff_stop = None
        unit_price = trip.price_per_seat

        if payload.pickup_stop_id:
            pickup_stop = get_object_or_404(TripStop, id=payload.pickup_stop_id, trip=trip)
            if pickup_stop.price_from_origin:
                unit_price = pickup_stop.price_from_origin

        if payload.dropoff_stop_id:
            dropoff_stop = get_object_or_404(TripStop, id=payload.dropoff_stop_id, trip=trip)

        total_price = Decimal(unit_price) * payload.seats_booked

        # Deduct available seats
        trip.available_seats -= payload.seats_booked
        trip.save(update_fields=["available_seats"])

        booking = Booking.objects.create(
            trip=trip,
            rider=rider,
            pickup_stop=pickup_stop,
            dropoff_stop=dropoff_stop,
            seats_booked=payload.seats_booked,
            total_price=total_price,
            status="confirmed",
        )

    return 201, booking


@router.get("/my", response=List[BookingOutSchema])
def list_my_bookings(request):
    return Booking.objects.filter(rider=request.auth).select_related("trip", "trip__driver").order_by("-created_at")


@router.post("/{booking_id}/cancel", response=BookingOutSchema)
def cancel_booking(request, booking_id: int):
    with transaction.atomic():
        booking = get_object_or_404(
            Booking.objects.select_for_update(),
            id=booking_id,
            rider=request.auth,
        )

        if booking.status == "cancelled":
            raise HttpError(400, "Booking is already cancelled.")

        # Reclaim available seats
        trip = Trip.objects.select_for_update().get(id=booking.trip_id)
        trip.available_seats += booking.seats_booked
        trip.save(update_fields=["available_seats"])

        booking.status = "cancelled"
        booking.save(update_fields=["status"])

    return booking