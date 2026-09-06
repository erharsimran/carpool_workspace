# backend/locations/models.py
from django.contrib.gis.db import models

class Country(models.Model):
    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=2, unique=True) # e.g., "CA"

    class Meta:
        verbose_name_plural = "countries"

    def __str__(self):
        return f"{self.name} ({self.code})"


class Province(models.Model):
    country = models.ForeignKey(Country, on_delete=models.CASCADE, related_name="provinces")
    name = models.CharField(max_length=100) # e.g., "Ontario"
    code = models.CharField(max_length=10, db_index=True) # e.g., "ON"

    class Meta:
        unique_together = ("country", "code")
        ordering = ["name"]

    def __str__(self):
        return f"{self.name}, {self.code}"


class City(models.Model):
    province = models.ForeignKey(Province, on_delete=models.CASCADE, related_name="cities")
    name = models.CharField(max_length=150, db_index=True)
    coords = models.PointField(srid=4326) # (lng, lat) for PostGIS spatial searches
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name_plural = "cities"
        ordering = ["name"]
        indexes = [
            models.Index(fields=["name", "is_active"]),
        ]

    def __str__(self):
        return f"{self.name}, {self.province.code}, {self.province.country.code}"