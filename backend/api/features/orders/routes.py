import os

from flask import Blueprint, request

from ..._lib.rate_limit import limiter
from ..._lib.response import json_response

from .service import build_order, persist_order
from .store import find_order_by_reference, list_orders

orders_bp = Blueprint("orders", __name__)


@orders_bp.route("/api/orders", methods=["GET", "POST", "OPTIONS"])
@limiter.limit(os.environ.get("RATELIMIT_ORDER_LOOKUP_LIMIT", "10 per minute"), methods=["GET"])
@limiter.limit(os.environ.get("RATELIMIT_ORDER_CREATE_LIMIT", "5 per minute"), methods=["POST"])
def orders():
    if request.method == "OPTIONS":
        return json_response({})

    if request.method == "GET":
        try:
            reference = request.args.get("reference") or request.args.get("orderId")
            mobile_number = request.args.get("mobileNumber")
            if reference or mobile_number:
                order = find_order_by_reference(reference, mobile_number)
                if not order:
                    return json_response({"error": "Order not found."}, 404)
                return json_response({"order": order})

            return json_response({"orders": list_orders()})
        except Exception as error:
            return json_response({"error": str(error)}, 500)

    payload = request.get_json(silent=True) or {}
    customer_details = (
        payload.get("customerDetails")
        or payload.get("guestDetails")
        or {}
    )
    items = payload.get("items", [])

    try:
        order = build_order(customer_details, items)
        persisted_order = persist_order(order)
        return json_response({"order": persisted_order}, 201)
    except ValueError as error:
        return json_response({"error": str(error)}, 400)
    except Exception as error:
        return json_response({"error": str(error)}, 500)
