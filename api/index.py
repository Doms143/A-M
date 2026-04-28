from flask import Flask
from dotenv import load_dotenv

from api.features.admin.routes import admin_bp
from api.features.catalog.routes import catalog_bp
from api.features.checkout.routes import checkout_bp
from api.features.orders.routes import orders_bp

load_dotenv()

app = Flask(__name__)
app.register_blueprint(admin_bp)
app.register_blueprint(catalog_bp)
app.register_blueprint(orders_bp)
app.register_blueprint(checkout_bp)
