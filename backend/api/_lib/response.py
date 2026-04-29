import os

from flask import jsonify, make_response

ALLOWED_ORIGIN = os.environ.get("ALLOWED_ORIGIN", "*")


def json_response(payload, status=200):
    response = make_response(jsonify(payload), status)
    response.headers["Access-Control-Allow-Origin"] = ALLOWED_ORIGIN
    response.headers["Access-Control-Allow-Headers"] = "Authorization, Content-Type"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PATCH, DELETE, OPTIONS"
    return response
