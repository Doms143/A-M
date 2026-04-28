import os
import uuid
from datetime import datetime, timezone

from flask import Flask, request

from api._lib.auth import optional_user
from api._lib.response import json_response
from api._lib.supabase_client import get_supabase_client, is_supabase_configured
from api.data_seed import CATALOG

app = Flask(__name__)
DEMO_ORDERS = []


@app.route("/api/catalog", methods=["GET", "OPTIONS"])
def get_catalog():
    if request.method == "OPTIONS":
        return json_response({})

    return json_response({"products": CATALOG})


@app.route("/api/orders", methods=["GET", "POST", "OPTIONS"])
def orders():
    if request.method == "OPTIONS":
        return json_response({})

    if request.method == "GET":
        return list_orders()

    return create_order()


@app.route("/api/checkout", methods=["POST", "OPTIONS"])
def checkout():
    if request.method == "OPTIONS":
        return json_response({})

    payload = request.get_json(silent=True) or {}
    order_id = payload.get("orderId")
    total = payload.get("total", 0)
    provider_name = os.environ.get("PAYMENT_PROVIDER_NAME", "Stripe")
    public_key = os.environ.get("PAYMENT_PUBLIC_KEY", "pk_test_example")

    # Template behavior: return enough metadata for a real checkout integration
    # while keeping the starter deployable before a payment provider is wired in.
    return json_response(
        {
            "checkoutUrl": f"/checkout/{order_id}",
            "provider": provider_name,
            "publicKey": public_key,
            "message": f"Order reserved. Attach your {provider_name} checkout flow for ${float(total):.2f}.",
        }
    )


def list_orders():
    user = optional_user()

    if not user:
        return json_response({"orders": DEMO_ORDERS})

    if not is_supabase_configured(use_service_role=True):
        return json_response({"orders": DEMO_ORDERS})

    try:
        supabase = get_supabase_client(use_service_role=True)
        result = (
            supabase.table("orders")
            .select("*")
            .eq("user_id", user.get("sub"))
            .order("created_at", desc=True)
            .execute()
        )
        return json_response({"orders": result.data})
    except Exception as error:
        return json_response({"error": str(error)}, 500)


def create_order():
    payload = request.get_json(silent=True) or {}
    guest_details = payload.get("guestDetails", {})
    items = payload.get("items", [])

    if not guest_details.get("guestName") or not guest_details.get("villaNumber"):
        return json_response({"error": "Guest name and villa number are required."}, 400)

    catalog_map = {item["id"]: item for item in CATALOG}
    normalized_items = []
    total = 0

    for item in items:
        product = catalog_map.get(item.get("id"))
        quantity = int(item.get("quantity", 0))

        if not product or quantity <= 0:
            continue

        line_total = product["price"] * quantity
        total += line_total
        normalized_items.append(
            {
                "product_id": product["id"],
                "name": product["name"],
                "quantity": quantity,
                "unit_price": product["price"],
                "line_total": line_total,
            }
        )

    total = round(total * 1.06, 2)
    user = optional_user()
    order = {
        "id": str(uuid.uuid4()),
        "user_id": user.get("sub") if user else None,
        "guest_name": guest_details["guestName"],
        "villa_number": guest_details["villaNumber"],
        "delivery_window": guest_details.get("deliveryWindow", "within 30 minutes"),
        "notes": guest_details.get("notes", ""),
        "status": "pending",
        "total": total,
        "items": normalized_items,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    if not is_supabase_configured(use_service_role=True):
        DEMO_ORDERS.insert(0, order)
        return json_response({"order": order}, 201)

    try:
        supabase = get_supabase_client(use_service_role=True)
        supabase.table("orders").insert(order).execute()
    except Exception as error:
        return json_response({"error": str(error)}, 500)

    return json_response({"order": order}, 201)
