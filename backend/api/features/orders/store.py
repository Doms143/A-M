from ..._lib.supabase_client import get_supabase_client, is_supabase_configured

ORDER_LOOKUP_COLUMNS = (
    "id, reference_code, guest_name, mobile_number, villa_number, "
    "delivery_window, status, total, items, created_at"
)

def list_orders():
    if not is_supabase_configured(use_service_role=True):
        return []

    supabase = get_supabase_client(use_service_role=True)
    result = (
        supabase.table("orders")
        .select("*")
        .order("created_at", desc=True)
        .execute()
    )
    return result.data


def find_order_by_reference(reference, mobile_number):
    if not is_supabase_configured(use_service_role=True):
        return None

    normalized_reference = str(reference or "").strip().lower()
    normalized_mobile_number = str(mobile_number or "").strip()
    if len(normalized_reference) < 8 or not normalized_mobile_number:
        return None

    supabase = get_supabase_client(use_service_role=True)
    normalized_reference_upper = normalized_reference.upper()

    try:
        result = (
            supabase.table("orders")
            .select(ORDER_LOOKUP_COLUMNS)
            .eq("mobile_number", normalized_mobile_number)
            .eq("reference_code", normalized_reference_upper)
            .limit(1)
            .execute()
        )
        if result.data:
            return result.data[0]
    except Exception as error:
        if "schema cache" not in str(error):
            raise

    try:
        result = (
            supabase.table("orders")
            .select(ORDER_LOOKUP_COLUMNS)
            .eq("mobile_number", normalized_mobile_number)
            .order("created_at", desc=True)
            .limit(50)
            .execute()
        )
    except Exception as error:
        if "schema cache" not in str(error):
            raise
        result = (
            supabase.table("orders")
            .select("id, guest_name, mobile_number, villa_number, delivery_window, status, total, items, created_at")
            .eq("mobile_number", normalized_mobile_number)
            .order("created_at", desc=True)
            .limit(50)
            .execute()
        )

    for order in result.data or []:
        reference_code = str(order.get("reference_code") or "").lower()
        if reference_code == normalized_reference:
            return order

        order_id = str(order.get("id", "")).lower()
        if order_id.startswith(normalized_reference):
            return order

    return None
