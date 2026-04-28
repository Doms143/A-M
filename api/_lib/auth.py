import os
from functools import wraps

import jwt
from flask import request

from .response import json_response


def optional_user():
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None

    token = auth_header.split(" ", 1)[1]
    secret = os.environ.get("SUPABASE_JWT_SECRET")

    if not secret:
        return None

    try:
        payload = jwt.decode(token, secret, algorithms=["HS256"], options={"verify_aud": False})
        return payload
    except jwt.PyJWTError:
        return None


def require_auth(handler):
    @wraps(handler)
    def wrapper(*args, **kwargs):
        user = optional_user()
        if not user:
            return json_response({"error": "Unauthorized"}, 401)
        return handler(user, *args, **kwargs)

    return wrapper
