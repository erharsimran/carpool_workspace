# backend/locations/management/commands/seed_locations.py
from django.core.management.base import BaseCommand
from django.contrib.gis.geos import Point
from locations.models import Country, Province, City

LOCATION_DATA = {
    "country": {"name": "Canada", "code": "CA"},
    "provinces": [
        {
            "name": "Ontario",
            "code": "ON",
            "cities": [
                {"name": "Barrie", "lat": 44.3894, "lng": -79.6903},
                {"name": "Belleville", "lat": 44.1628, "lng": -77.3832},
                {"name": "Brampton", "lat": 43.7315, "lng": -79.7624},
                {"name": "Brant", "lat": 43.1947, "lng": -80.3837},
                {"name": "Brantford", "lat": 43.1394, "lng": -80.2644},
                {"name": "Brockville", "lat": 44.5895, "lng": -75.6843},
                {"name": "Burlington", "lat": 43.3255, "lng": -79.7990},
                {"name": "Cambridge", "lat": 43.3968, "lng": -80.3113},
                {"name": "Clarence-Rockland", "lat": 45.5501, "lng": -75.2910},
                {"name": "Cornwall", "lat": 45.0213, "lng": -74.7303},
                {"name": "Dryden", "lat": 49.7833, "lng": -92.7503},
                {"name": "Elliot Lake", "lat": 46.3833, "lng": -82.6500},
                {"name": "Greater Sudbury", "lat": 46.4917, "lng": -80.9930},
                {"name": "Guelph", "lat": 43.5448, "lng": -80.2482},
                {"name": "Haldimand County", "lat": 42.9333, "lng": -79.8667},
                {"name": "Hamilton", "lat": 43.2557, "lng": -79.8711},
                {"name": "Kawartha Lakes", "lat": 44.3501, "lng": -78.7408},
                {"name": "Kenora", "lat": 49.7670, "lng": -94.4890},
                {"name": "Kingston", "lat": 44.2312, "lng": -76.4860},
                {"name": "Kitchener", "lat": 43.4516, "lng": -80.4925},
                {"name": "London", "lat": 42.9849, "lng": -81.2453},
                {"name": "Markham", "lat": 43.8561, "lng": -79.3370},
                {"name": "Mississauga", "lat": 43.5890, "lng": -79.6441},
                {"name": "Niagara Falls", "lat": 43.0896, "lng": -79.0849},
                {"name": "Norfolk County", "lat": 42.8350, "lng": -80.3820},
                {"name": "North Bay", "lat": 46.3091, "lng": -79.4608},
                {"name": "Orillia", "lat": 44.6082, "lng": -79.4197},
                {"name": "Oshawa", "lat": 43.8975, "lng": -78.8658},
                {"name": "Ottawa", "lat": 45.4215, "lng": -75.6972},
                {"name": "Owen Sound", "lat": 44.5690, "lng": -80.9400},
                {"name": "Pembroke", "lat": 45.8260, "lng": -77.1100},
                {"name": "Peterborough", "lat": 44.3091, "lng": -78.3197},
                {"name": "Pickering", "lat": 43.8384, "lng": -79.0868},
                {"name": "Port Colborne", "lat": 42.9001, "lng": -79.2329},
                {"name": "Prince Edward County", "lat": 44.0000, "lng": -77.2500},
                {"name": "Quinte West", "lat": 44.1833, "lng": -77.5667},
                {"name": "Richmond Hill", "lat": 43.8828, "lng": -79.4403},
                {"name": "Sarnia", "lat": 42.9745, "lng": -82.4066},
                {"name": "Sault Ste. Marie", "lat": 46.5219, "lng": -84.3461},
                {"name": "St. Catharines", "lat": 43.1594, "lng": -79.2469},
                {"name": "St. Thomas", "lat": 42.7777, "lng": -81.1828},
                {"name": "Stratford", "lat": 43.3700, "lng": -80.9822},
                {"name": "Temiskaming Shores", "lat": 47.5090, "lng": -79.6742},
                {"name": "Thorold", "lat": 43.1167, "lng": -79.2000},
                {"name": "Thunder Bay", "lat": 48.3809, "lng": -89.2477},
                {"name": "Timmins", "lat": 48.4758, "lng": -81.3305},
                {"name": "Toronto", "lat": 43.6532, "lng": -79.3832},
                {"name": "Vaughan", "lat": 43.8563, "lng": -79.5085},
                {"name": "Waterloo", "lat": 43.4643, "lng": -80.5204},
                {"name": "Welland", "lat": 42.9922, "lng": -79.2483},
                {"name": "Windsor", "lat": 42.3149, "lng": -83.0364},
                {"name": "Woodstock", "lat": 43.1315, "lng": -80.7467}
            ]
        },
        # Example extension schema for other provinces:
        # {
        #     "name": "Quebec",
        #     "code": "QC",
        #     "cities": [
        #         {"name": "Montreal", "lat": 45.5017, "lng": -73.5673},
        #         {"name": "Gatineau", "lat": 45.4765, "lng": -75.7013},
        #     ]
        # }
    ],
}

class Command(BaseCommand):
    help = "Seed Canadian provinces and cities with PostGIS coordinates"

    def handle(self, *args, **options):
        country_data = LOCATION_DATA["country"]
        country, _ = Country.objects.get_or_create(
            code=country_data["code"],
            defaults={"name": country_data["name"]},
        )
        self.stdout.write(f"Configured Country: {country}")

        total_cities = 0
        for prov_data in LOCATION_DATA["provinces"]:
            province, _ = Province.objects.get_or_create(
                country=country,
                code=prov_data["code"],
                defaults={"name": prov_data["name"]},
            )

            for city_info in prov_data["cities"]:
                # Point takes (longitude, latitude) in GeoDjango
                pt = Point(city_info["lng"], city_info["lat"], srid=4326)
                city, created = City.objects.update_or_create(
                    province=province,
                    name=city_info["name"],
                    defaults={"coords": pt, "is_active": True},
                )
                total_cities += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Successfully seeded {total_cities} cities across {len(LOCATION_DATA['provinces'])} province(s)."
            )
        )