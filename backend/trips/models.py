# trips/models.py
from django.conf import settings
from django.contrib.gis.db import models


class Trip(models.Model):
    STATUS_CHOICES = [
        ('scheduled', 'Scheduled'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]

    driver = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='driven_trips',
    )

    # Route Origin & Destination using geography=True for metric calculations
    origin_name = models.CharField(max_length=255)
    origin_coords = models.PointField(geography=True)

    destination_name = models.CharField(max_length=255)
    destination_coords = models.PointField(geography=True)

    # Full route polyline from OSRM
    route_geometry = models.LineStringField(geography=True, null=True, blank=True)

    departure_time = models.DateTimeField()
    available_seats = models.PositiveSmallIntegerField(default=3)
    price_per_seat = models.DecimalField(max_digits=6, decimal_places=2)

    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default='scheduled'
    )
    notes = models.TextField(blank=True, default='')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.origin_name} -> {self.destination_name} ({self.departure_time.strftime('%b %d, %H:%M')})"


class TripStop(models.Model):
    trip = models.ForeignKey(
        Trip, on_delete=models.CASCADE, related_name='stops'
    )
    stop_name = models.CharField(max_length=255)
    location = models.PointField(geography=True)
    stop_order = models.PositiveIntegerField(
        help_text="Order in the route: 1 for first pickup, 2 for second, etc."
    )
    price_from_origin = models.DecimalField(
        max_digits=6, decimal_places=2, null=True, blank=True
    )

    class Meta:
        ordering = ['stop_order']
        unique_together = ('trip', 'stop_order')

    def __str__(self):
        return f"Stop {self.stop_order}: {self.stop_name} ({self.trip_id})"