from flask import Flask
from dotenv import load_dotenv

from .features.admin.routes import admin_bp
from .features.catalog.routes import catalog_bp
from .features.checkout.routes import checkout_bp
from .features.orders.routes import orders_bp

load_dotenv()

app = Flask(__name__)
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
