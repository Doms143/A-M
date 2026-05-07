from pathlib import Path

from flask import Flask
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

from ._lib.rate_limit import init_rate_limiter
from .features.admin.routes import admin_bp
from .features.catalog.routes import catalog_bp
from .features.checkout.routes import checkout_bp
from .features.orders.routes import orders_bp

app = Flask(__name__)
init_rate_limiter(app)
app.register_blueprint(admin_bp)
app.register_blueprint(catalog_bp)
app.register_blueprint(orders_bp)
app.register_blueprint(checkout_bp)


@app.get("/")
def root():
    return {
        "service": "a-m-backend",
        "status": "ok",
    }


@app.get("/api/health")
def health():
    return {
        "status": "ok",
    }
