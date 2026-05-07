import os

from flask import request
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

from .response import json_response


def _rate_limit_key():
    forwarded_for = request.headers.get("X-Forwarded-For", "")
    if forwarded_for:
        return forwarded_for.split(",", 1)[0].strip()
    return get_remote_address()


limiter = Limiter(
    key_func=_rate_limit_key,
    default_limits=["120 per minute"],
    storage_uri=os.environ.get("RATELIMIT_STORAGE_URI", "memory://"),
    enabled=os.environ.get("RATELIMIT_ENABLED", "true").lower() != "false",
)


@limiter.request_filter
def _skip_preflight_requests():
    return request.method == "OPTIONS"


def init_rate_limiter(app):
    limiter.init_app(app)
    app.register_error_handler(429, _rate_limit_exceeded)


def _rate_limit_exceeded(error):
    return json_response(
        {
            "error": "Too many requests. Please wait a moment and try again.",
            "limit": getattr(error, "description", "Rate limit exceeded."),
        },
        429,
    )
