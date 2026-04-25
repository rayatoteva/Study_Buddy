# Study Buddy

A Flask web application for connecting students and tutors.

## Requirements

- Python 3.8+
- pip

## Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd Study_Buddy
```

### 2. Create and activate a virtual environment

**Windows:**
```bash
python -m venv venv
venv\Scripts\activate
```

**macOS / Linux:**
```bash
python -m venv venv
source venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

> **Note:** `flask-sqlalchemy` is required but may not be listed in `requirements.txt`. Install it manually if needed:
> ```bash
> pip install flask-sqlalchemy
> ```

### 4. Configure the application

Open `app.py` and update the following settings:

- `SECRET_KEY` — replace `'your_secret_key_here'` with a strong random secret key.
- `SQLALCHEMY_DATABASE_URI` — update the database path to match your local environment, or use a relative path:
  ```python
  app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///study_buddy.db'
  ```

### 5. Run the application

```bash
python app.py
```

The app will be available at `http://127.0.0.1:5000`.

The SQLite database will be created automatically on first run inside the `instance/` folder.

## Project Structure

```
Study_Buddy_NEW/
├── app.py              # Application entry point and configuration
├── models.py           # Database models (SQLAlchemy)
├── routes.py           # URL routes and view functions
├── requirements.txt    # Python dependencies
├── static/
│   ├── scripts.js
│   └── styles.css
└── templates/
    └── index.html
```

## Notes

- The `instance/` folder (containing the database) is excluded from version control via `.gitignore`.
- Never commit your `.env` file or any file containing secret keys.
