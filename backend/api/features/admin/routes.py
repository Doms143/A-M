from flask import Blueprint, request

from ..._lib.auth import require_admin
from ..._lib.response import json_response
from ..._lib.supabase_client import get_supabase_client, is_supabase_configured

admin_bp = Blueprint("admin", __name__)


def _clean_text(value):
    if value is None:
        return ""
    return str(value).strip()


def _require_supabase():
    if not is_supabase_configured(use_service_role=True):
        raise RuntimeError("Supabase service role configuration is missing.")
    return get_supabase_client(use_service_role=True)


def _validate_product(payload):
    name = _clean_text(payload.get("name"))
    category = _clean_text(payload.get("category")).lower()
    description = _clean_text(payload.get("description"))
    raw_price = payload.get("price")

    if not name:
        raise ValueError("Product name is required.")
    if not category:
        raise ValueError("Category is required.")
    if not description:
        raise ValueError("Description is required.")

    try:
        price = round(float(raw_price), 2)
    except (TypeError, ValueError):
        raise ValueError("Price must be a valid number.") from None

    if price <= 0:
        raise ValueError("Price must be greater than zero.")

    slug = "-".join(name.lower().split())
    return {
        "id": slug,
        "name": name,
        "category": category,
        "description": description,
        "price": price,
        "is_active": True,
    }


@admin_bp.route("/api/admin/orders", methods=["GET", "OPTIONS"])
@require_admin
def admin_orders(_user):
    if request.method == "OPTIONS":
        return json_response({})

    try:
        supabase = _require_supabase()
        result = (
            supabase.table("orders")
            .select("*")
            .order("created_at", desc=True)
            .limit(50)
            .execute()
        )
        return json_response({"orders": result.data})
    except Exception as error:
        return json_response({"error": str(error)}, 500)


@admin_bp.route("/api/admin/orders/<order_id>", methods=["PATCH", "OPTIONS"])
@require_admin
def update_admin_order(_user, order_id):
    if request.method == "OPTIONS":
        return json_response({})

    payload = request.get_json(silent=True) or {}
    next_status = _clean_text(payload.get("status")).lower()
    allowed_statuses = {"pending", "confirmed", "fulfilled", "cancelled"}

    if next_status not in allowed_statuses:
        return json_response({"error": "A valid order status is required."}, 400)

    try:
        supabase = _require_supabase()
        result = (
            supabase.table("orders")
            .update({"status": next_status})
            .eq("id", order_id)
            .execute()
        )
        if not result.data:
            return json_response({"error": "Order not found."}, 404)
        return json_response({"order": result.data[0]})
    except Exception as error:
        return json_response({"error": str(error)}, 500)


@admin_bp.route("/api/admin/account", methods=["GET", "OPTIONS"])
@require_admin
def admin_account(user):
    if request.method == "OPTIONS":
        return json_response({})

    return json_response(
        {
            "account": {
                "email": user.get("email"),
                "id": user.get("sub"),
                "is_anonymous": user.get("is_anonymous", False),
            }
        }
    )


@admin_bp.route("/api/admin/products", methods=["GET", "POST", "OPTIONS"])
@require_admin
def admin_products(_user):
    if request.method == "OPTIONS":
        return json_response({})

    try:
        supabase = _require_supabase()
    except Exception as error:
        return json_response({"error": str(error)}, 500)

    if request.method == "GET":
        try:
            result = (
                supabase.table("products")
                .select("*")
                .order("created_at", desc=False)
                .execute()
            )
            return json_response({"products": result.data})
        except Exception as error:
            return json_response({"error": str(error)}, 500)

    payload = request.get_json(silent=True) or {}

    try:
        product = _validate_product(payload)
        result = (
            supabase.table("products")
            .upsert(product, on_conflict="id")
            .execute()
        )
        return json_response({"product": result.data[0]}, 201)
    except ValueError as error:
        return json_response({"error": str(error)}, 400)
    except Exception as error:
        return json_response({"error": str(error)}, 500)
