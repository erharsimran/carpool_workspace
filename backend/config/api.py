from ninja import NinjaAPI
from trips.api import router as trips_router
from users.api import router as auth_router
from bookings.api import router as bookings_router
from locations.api import router as locations_router
api = NinjaAPI(
    title="Carpool Canada API",
    version="1.0.0",
    description="Open-source stop-to-stop carpooling backend",
)

@api.get("/health")
def health_check(request):
    return {"status": "ok", "message": "Carpool API is healthy"}

api.add_router("/auth", auth_router)
api.add_router("/trips", trips_router)
api.add_router("/bookings", bookings_router)
api.add_router("/locations", locations_router)