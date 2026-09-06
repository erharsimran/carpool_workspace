from django.contrib import admin
from django.contrib.gis.admin import GISModelAdmin
from .models import Trip, TripStop


class TripStopInline(admin.TabularInline):
    model = TripStop
    extra = 1


@admin.register(Trip)
class TripAdmin(GISModelAdmin):
    list_display = [
        'origin_name',
        'destination_name',
        'driver',
        'departure_time',
        'available_seats',
        'price_per_seat',
        'status',
    ]
    list_filter = ['status', 'departure_time']
    inlines = [TripStopInline]


@admin.register(TripStop)
class TripStopAdmin(GISModelAdmin):
    list_display = ['trip', 'stop_order', 'stop_name', 'price_from_origin']