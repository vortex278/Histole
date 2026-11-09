import os

from django.http import HttpResponse


def allowed_origins():
    return {
        origin.strip().rstrip("/")
        for origin in os.environ.get(
            "CORS_ALLOWED_ORIGINS",
            "http://localhost:8081,http://127.0.0.1:8081,"
            "http://localhost:19006,http://127.0.0.1:19006",
        ).split(",")
        if origin.strip()
    }


def is_allowed_origin(origin):
    if not origin:
        return False

    normalized_origin = origin.rstrip("/")
    if normalized_origin in allowed_origins():
        return True

    return (
        normalized_origin.startswith("http://localhost:")
        or normalized_origin.startswith("http://127.0.0.1:")
    )


class DevelopmentCorsMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        origin = request.headers.get("Origin")
        allowed_origin = is_allowed_origin(origin)
        if request.method == "OPTIONS" and allowed_origin:
            response = HttpResponse(status=204)
        else:
            response = self.get_response(request)

        if allowed_origin:
            response["Access-Control-Allow-Origin"] = origin
            response["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
            response["Access-Control-Allow-Headers"] = "Content-Type"
            response["Vary"] = "Origin"

        return response
