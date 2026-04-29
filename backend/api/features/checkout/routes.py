import os

from flask import Blueprint, request

from ..._lib.response import json_response

checkout_bp = Blueprint("checkout", __name__)


@checkout_bp.route("/api/checkout", methods=["POST", "OPTIONS"])
def checkout():
    if request.method == "OPTIONS":
        return json_response({})

    payload = request.get_json(silent=True) or {}
    order_id = payload.get("orderId")
    total = payload.get("total", 0)
    provider_name = os.environ.get("PAYMENT_PROVIDER_NAME", "Stripe")
    public_key = os.environ.get("PAYMENT_PUBLIC_KEY", "pk_test_example")

    return json_response(
        {
            "checkoutUrl": f"/checkout/{order_id}",
            "provider": provider_name,
            "publicKey": public_key,
            "message": f"Order reserved. Attach your {provider_name} checkout flow for ${float(total):.2f}.",
        }
    )
