# backend/locations/api.py
from typing import List, Optional
from ninja import Router, Schema
from django.db.models import Q
from .models import City

router = Router(tags=["Locations"])

class CityOutSchema(Schema):
    id: int
    name: str
    display_name: str
    city: str
    province_code: str
    country_code: str
    latitude: float
    longitude: float

    @staticmethod
    def resolve_display_name(obj: City) -> str:
        return f"{obj.name}, {obj.province.code}, {obj.province.country.code}"

    @staticmethod
    def resolve_city(obj: City) -> str:
        return obj.name

    @staticmethod
    def resolve_province_code(obj: City) -> str:
        return obj.province.code

    @staticmethod
    def resolve_country_code(obj: City) -> str:
        return obj.province.country.code

    @staticmethod
    def resolve_latitude(obj: City) -> float:
        return obj.coords.y

    @staticmethod
    def resolve_longitude(obj: City) -> float:
        return obj.coords.x


@router.get("/cities", response=List[CityOutSchema])
def search_cities(
    request,
    q: Optional[str] = None,
    province: Optional[str] = "ON",
    limit: int = 8,
):
    qs = City.objects.filter(is_active=True).select_related("province", "province__country")

    if province:
        qs = qs.filter(province__code__iexact=province)

    if q and q.strip():
        search_term = q.strip()
        qs = qs.filter(
            Q(name__istartswith=search_term) | Q(name__icontains=search_term)
        )

    return qs[:limit]