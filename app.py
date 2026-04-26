from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import inspect, text
import os

basedir = os.path.abspath(os.path.dirname(__file__))
app = Flask(__name__)
app.config['SECRET_KEY'] = 'your_secret_key_here'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'app.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

from models import db
db.init_app(app)

# Import routes after app and db are defined to avoid circular imports
from routes import *

def ensure_profile_columns():
    inspector = inspect(db.engine)
    if 'users' not in inspector.get_table_names():
        return
    columns = [column['name'] for column in inspector.get_columns('users')]
    if 'good_at' not in columns:
        db.session.execute(text('ALTER TABLE users ADD COLUMN good_at TEXT DEFAULT ""'))
    if 'need_help' not in columns:
        db.session.execute(text('ALTER TABLE users ADD COLUMN need_help TEXT DEFAULT ""'))
    db.session.commit()

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        ensure_profile_columns()
    app.run(debug=True)