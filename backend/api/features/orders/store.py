from ..._lib.supabase_client import get_supabase_client, is_supabase_configured

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
    result = (
        supabase.table("orders")
        .select("id, guest_name, mobile_number, villa_number, delivery_window, status, total, items, created_at")
        .eq("mobile_number", normalized_mobile_number)
        .order("created_at", desc=True)
        .limit(50)
        .execute()
    )

    for order in result.data or []:
        order_id = str(order.get("id", "")).lower()
        if order_id.startswith(normalized_reference):
            return order

    return None
