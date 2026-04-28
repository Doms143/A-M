from flask import Blueprint, request

from api._lib.response import json_response
from api._lib.supabase_client import get_supabase_client, is_supabase_configured
from api.data_seed import CATALOG

catalog_bp = Blueprint("catalog", __name__)


@catalog_bp.route("/api/catalog", methods=["GET", "OPTIONS"])
def get_catalog():
    if request.method == "OPTIONS":
        return json_response({})

    if not is_supabase_configured(use_service_role=True):
        return json_response({"products": CATALOG})

    try:
        supabase = get_supabase_client(use_service_role=True)
        result = (
            supabase.table("products")
            .select("*")
            .eq("is_active", True)
            .order("created_at", desc=False)
            .execute()
        )
        products = result.data or CATALOG
        return json_response({"products": products})
    except Exception:
        return json_response({"products": CATALOG})
