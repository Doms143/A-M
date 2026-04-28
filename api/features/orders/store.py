from api._lib.supabase_client import get_supabase_client, is_supabase_configured

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
