import os
from supabase import Client, create_client


def get_supabase_client(use_service_role=False) -> Client:
    url = os.environ.get("SUPABASE_URL", "")
    key = os.environ.get(
        "SUPABASE_SERVICE_ROLE_KEY" if use_service_role else "SUPABASE_ANON_KEY",
        "",
    )

    if not url or not key:
        raise RuntimeError("Supabase environment variables are missing.")

    return create_client(url, key)
