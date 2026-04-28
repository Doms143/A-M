from functools import wraps

from flask import request

from .supabase_client import get_supabase_client, is_supabase_configured
from .response import json_response


def optional_user():
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None

    token = auth_header.split(" ", 1)[1]
    if not is_supabase_configured():
        return None

    try:
        response = get_supabase_client().auth.get_user(token)
        user = getattr(response, "user", None)
        if not user:
            return None

        return {
            "sub": user.id,
            "email": getattr(user, "email", None),
            "is_anonymous": getattr(user, "is_anonymous", False),
        }
    except Exception:
        return None


def require_auth(handler):
    @wraps(handler)
    def wrapper(*args, **kwargs):
        user = optional_user()
        if not user:
            return json_response({"error": "Unauthorized"}, 401)
        return handler(user, *args, **kwargs)

    return wrapper


def is_admin_user(user):
    user_email = (user or {}).get("email") or ""
    if not user_email:
        return False

    if not is_supabase_configured(use_service_role=True):
        return False

    try:
        supabase = get_supabase_client(use_service_role=True)
        result = (
            supabase.table("admin_accounts")
            .select("email")
            .eq("email", user_email.lower())
            .eq("is_active", True)
            .limit(1)
            .execute()
        )
        return bool(result.data)
    except Exception:
        return False


def require_admin(handler):
    @wraps(handler)
    def wrapper(*args, **kwargs):
        if request.method == "OPTIONS":
            return json_response({})
        user = optional_user()
        if not user:
            return json_response({"error": "Unauthorized"}, 401)
        if not is_admin_user(user):
            return json_response({"error": "Forbidden"}, 403)
        return handler(user, *args, **kwargs)

    return wrapper
