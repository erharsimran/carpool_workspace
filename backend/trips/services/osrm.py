# backend/trips/services/osrm.py
from typing import List, Tuple, Optional
import requests
from django.contrib.gis.geos import LineString

OSRM_BASE_URL = "https://router.project-osrm.org"


def fetch_route_geometry(
    coordinates: List[Tuple[float, float]]
) -> Optional[LineString]:
    """
    Fetches the driving route polyline from OSRM for a list of coordinates.
    Expects coordinates in [(longitude, latitude), ...] order.
    Returns a GeoDjango LineString in EPSG:4326.
    """
    if len(coordinates) < 2:
        return None

    # OSRM format: /route/v1/driving/{lon1},{lat1};{lon2},{lat2}?geometries=geojson&overview=full
    coord_string = ";".join([f"{lon},{lat}" for lon, lat in coordinates])
    url = f"{OSRM_BASE_URL}/route/v1/driving/{coord_string}?geometries=geojson&overview=full"

    try:
        response = requests.get(url, timeout=5)
        response.raise_for_status()
        data = response.json()

        if data.get("code") != "Ok" or not data.get("routes"):
            return None

        # GeoJSON coordinates format: [[lon, lat], [lon, lat], ...]
        route_coords = data["routes"][0]["geometry"]["coordinates"]
        return LineString(route_coords, srid=4326)
    except (requests.RequestException, KeyError, ValueError):
        return None