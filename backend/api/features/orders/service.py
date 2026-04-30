import uuid
import re
from datetime import datetime, timezone

from ..._lib.auth import optional_user
from ..._lib.supabase_client import get_supabase_client, is_supabase_configured
from ...data_seed import CATALOG

DELIVERY_WINDOWS = {
    "within 30 minutes",
    "within 1 hour",
    "schedule for later",
}
LEGACY_ORDER_COLUMNS = {
    "contact_email",
    "mobile_number",
    "subtotal",
    "reference_code",
    "status_history",
    "status_updated_at",
}
MAX_ITEM_QUANTITY = 20
MOBILE_NUMBER_PATTERN = re.compile(r"^09\d{9}$")


def _clean_text(value):
    if value is None:
        return ""
    return str(value).strip()


def validate_order_request(customer_details, items):
    customer_name = _clean_text(
        customer_details.get("customerName") or customer_details.get("guestName")
    )
    mobile_number = _clean_text(customer_details.get("mobileNumber"))
    address_note = _clean_text(
        customer_details.get("addressNote") or customer_details.get("villaNumber")
    )
    delivery_window = _clean_text(customer_details.get("deliveryWindow")) or "within 30 minutes"

    if not customer_name:
        raise ValueError("Customer name is required.")

    if not mobile_number:
        raise ValueError("Mobile number is required.")

    if not MOBILE_NUMBER_PATTERN.match(mobile_number):
        raise ValueError("Mobile number must be an 11-digit PH number starting with 09.")

    if not address_note:
        raise ValueError("Address or pickup note is required.")

    if len(address_note) < 8:
        raise ValueError("Address or pickup note must include a clearer location.")

    if delivery_window not in DELIVERY_WINDOWS:
        raise ValueError("Delivery window is invalid.")

    if not isinstance(items, list) or not items:
        raise ValueError("At least one item is required.")

    return {
        "guest_name": customer_name,
        "mobile_number": mobile_number,
        "villa_number": address_note,
        "delivery_window": delivery_window,
        "notes": _clean_text(customer_details.get("notes")),
        "contact_email": _clean_text(customer_details.get("email")) or None,
    }


def _get_catalog():
    if not is_supabase_configured(use_service_role=True):
        return CATALOG

    try:
        supabase = get_supabase_client(use_service_role=True)
        result = (
            supabase.table("products")
            .select("id, name, price, pricing_unit, is_active, stock_quantity")
            .eq("is_active", True)
            .execute()
        )
        products = result.data or []
        return products or CATALOG
    except Exception:
        return CATALOG


def generate_reference_code():
    today = datetime.now(timezone.utc).strftime("%y%m%d")
    suffix = uuid.uuid4().hex[:4].upper()
    return f"AM-{today}-{suffix}"


def build_order(customer_details, items):
    normalized_customer_details = validate_order_request(customer_details, items)
    catalog_map = {item["id"]: item for item in _get_catalog()}
    normalized_items = []
    subtotal = 0

    for item in items:
        product = catalog_map.get(item.get("id"))
        try:
            quantity = int(item.get("quantity", 0))
        except (TypeError, ValueError):
            quantity = 0

        if not product or quantity <= 0:
            continue

        if quantity > MAX_ITEM_QUANTITY:
            raise ValueError(f"Each item is limited to {MAX_ITEM_QUANTITY} per order.")

        stock_quantity = product.get("stock_quantity")
        if stock_quantity is not None and quantity > int(stock_quantity):
            available = max(0, int(stock_quantity))
            raise ValueError(f"{product['name']} only has {available} left in stock.")

        line_total = product["price"] * quantity
        subtotal += line_total
        normalized_items.append(
            {
                "product_id": product["id"],
                "name": product["name"],
                "quantity": quantity,
                "unit_price": product["price"],
                "pricing_unit": product.get("pricing_unit", "piece"),
                "line_total": line_total,
            }
        )

    if not normalized_items:
        raise ValueError("Your cart does not contain any valid items.")

    user = optional_user()
    created_at = datetime.now(timezone.utc).isoformat()
    return {
        "id": str(uuid.uuid4()),
        "reference_code": generate_reference_code(),
        "user_id": user.get("sub") if user else None,
        "guest_name": normalized_customer_details["guest_name"],
        "mobile_number": normalized_customer_details["mobile_number"],
        "villa_number": normalized_customer_details["villa_number"],
        "delivery_window": normalized_customer_details["delivery_window"],
        "notes": normalized_customer_details["notes"],
        "contact_email": normalized_customer_details["contact_email"],
        "status": "pending",
        "status_history": [{"status": "pending", "timestamp": created_at, "label": "Order placed"}],
        "status_updated_at": created_at,
        "subtotal": round(subtotal, 2),
        "total": round(subtotal, 2),
        "items": normalized_items,
        "created_at": created_at,
    }


def decrement_product_stock(items):
    supabase = get_supabase_client(use_service_role=True)

    for item in items:
        product_id = item.get("product_id")
        quantity = int(item.get("quantity", 0))
        if not product_id or quantity <= 0:
            continue

        try:
            product_result = (
                supabase.table("products")
                .select("stock_quantity")
                .eq("id", product_id)
                .limit(1)
                .execute()
            )
        except Exception as error:
            if "schema cache" in str(error):
                return
            raise
        if not product_result.data:
            raise RuntimeError(f"Product {product_id} was not found while updating stock.")

        current_stock = product_result.data[0].get("stock_quantity")
        if current_stock is None:
            continue

        next_stock = int(current_stock) - quantity
        if next_stock < 0:
            raise ValueError(f"Insufficient stock for {item.get('name', 'item')}.")

        supabase.table("products").update({"stock_quantity": next_stock}).eq("id", product_id).execute()


def persist_order(order):
    if not is_supabase_configured(use_service_role=True):
        raise RuntimeError("Supabase service role configuration is missing.")

    supabase = get_supabase_client(use_service_role=True)
    try:
        result = supabase.table("orders").insert(order).execute()
        if result.data:
            decrement_product_stock(order.get("items", []))
            return result.data[0]
    except Exception as error:
        message = str(error)
        if "schema cache" not in message:
            raise

        legacy_order = {
            key: value for key, value in order.items() if key not in LEGACY_ORDER_COLUMNS
        }
        result = supabase.table("orders").insert(legacy_order).execute()
        if result.data:
            decrement_product_stock(order.get("items", []))
            inserted_order = result.data[0]
            inserted_order.setdefault("contact_email", order.get("contact_email"))
            inserted_order.setdefault("mobile_number", order.get("mobile_number"))
            inserted_order.setdefault("subtotal", order.get("subtotal"))
            return inserted_order

    result = (
        supabase.table("orders")
        .select("*")
        .eq("id", order["id"])
        .limit(1)
        .execute()
    )
    if not result.data:
        raise RuntimeError("Order was not persisted to Supabase.")

    persisted_order = result.data[0]
    decrement_product_stock(order.get("items", []))
    persisted_order.setdefault("contact_email", order.get("contact_email"))
    persisted_order.setdefault("mobile_number", order.get("mobile_number"))
    persisted_order.setdefault("subtotal", order.get("subtotal"))
    return persisted_order
