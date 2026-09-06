from ninja import NinjaAPI

api = NinjaAPI(
    title="Carpool Canada API",
    version="1.0.0",
    description="Open-source stop-to-stop carpooling backend",
)

@api.get("/health")
def health_check(request):
    return {"status": "ok", "message": "Carpool API is healthy"}
