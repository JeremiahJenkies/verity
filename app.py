import os
import sqlite3
import time
from pathlib import Path
from flask import Flask, jsonify, request, send_file

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = Path(os.environ.get("VERITY_DB_PATH", BASE_DIR / "verity.db"))
app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 8 * 1024
app.config["JSON_SORT_KEYS"] = False

QUOTES = [
    "Stay round. Stay golden.",
    "In a world full of angles, be your own little circle.",
    "Small ball. Big energy.",
    "The aura is non-negotiable.",
    "You do not need to be loud to light up a room.",
    "One tiny sphere. An unreasonable amount of main-character energy."
]
rate_log = {}

def connect_db():
    connection = sqlite3.connect(DB_PATH, timeout=10)
    connection.row_factory = sqlite3.Row
    return connection

def init_db():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with connect_db() as db:
        db.execute("""
            CREATE TABLE IF NOT EXISTS guestbook (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                message TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M UTC', 'now'))
            )
        """)
        db.execute("""
            CREATE TABLE IF NOT EXISTS site_stats (
                key TEXT PRIMARY KEY,
                value INTEGER NOT NULL DEFAULT 0
            )
        """)
        db.execute("INSERT OR IGNORE INTO site_stats (key, value) VALUES ('visits', 0)")

def increment_visits():
    with connect_db() as db:
        db.execute("UPDATE site_stats SET value = value + 1 WHERE key = 'visits'")

def rate_limited(ip, window=30):
    now = time.time()
    recent = [stamp for stamp in rate_log.get(ip, []) if now - stamp < window]
    if len(recent) >= 3:
        rate_log[ip] = recent
        return True
    recent.append(now)
    rate_log[ip] = recent
    return False

@app.get("/")
def home():
    increment_visits()
    return send_file(BASE_DIR / "index.html")

@app.get("/api/health")
def health():
    return jsonify(status="online", service="Verity Flask API", version="1.0.0")

@app.get("/api/stats")
def stats():
    with connect_db() as db:
        visits = db.execute("SELECT value FROM site_stats WHERE key = 'visits'").fetchone()["value"]
        messages = db.execute("SELECT COUNT(*) AS total FROM guestbook").fetchone()["total"]
    return jsonify(visits=visits, messages=messages, status="online")

@app.get("/api/quote")
def quote():
    import random
    return jsonify(quote=random.choice(QUOTES))

@app.get("/api/guestbook")
def get_guestbook():
    with connect_db() as db:
        rows = db.execute(
            "SELECT id, name, message, created_at FROM guestbook ORDER BY id DESC LIMIT 12"
        ).fetchall()
    return jsonify(entries=[dict(row) for row in rows])

@app.post("/api/guestbook")
def post_guestbook():
    ip = request.remote_addr or "unknown"
    if rate_limited(ip):
        return jsonify(error="Give the guestbook a moment before posting again."), 429

    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify(error="Send a valid JSON object."), 400

    name = str(data.get("name", "")).strip()
    message = str(data.get("message", "")).strip()
    if not name or not message:
        return jsonify(error="Both a name and a message are required."), 400
    if len(name) > 24:
        return jsonify(error="Names must be 24 characters or fewer."), 400
    if len(message) > 240:
        return jsonify(error="Messages must be 240 characters or fewer."), 400
    if any(ord(char) < 32 and char not in "\n\t" for char in name + message):
        return jsonify(error="Please remove unusual control characters."), 400

    with connect_db() as db:
        cursor = db.execute(
            "INSERT INTO guestbook (name, message) VALUES (?, ?)", (name, message)
        )
        row = db.execute(
            "SELECT id, name, message, created_at FROM guestbook WHERE id = ?",
            (cursor.lastrowid,)
        ).fetchone()
    return jsonify(entry=dict(row)), 201

@app.errorhandler(413)
def too_large(_error):
    return jsonify(error="That request is too large."), 413

@app.errorhandler(500)
def server_error(_error):
    return jsonify(error="Something went wrong on the Verity server."), 500

init_db()

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=int(os.environ.get("PORT", "5000")), debug=False)
