# VERITY® — The Little Yellow Legend

A cinematic, interactive Verity website with a Python Flask backend and SQLite storage.

## Features

- Glossy interactive 3D Verity orb, orbital visuals, animated sections, responsive layout.
- Flask server serving the website.
- SQLite-backed guestbook: entries persist after restarting the app.
- Live site visit and guestbook counts.
- Random Verity quote API and health/status endpoint.
- Basic input validation, request-size limits, and a small guestbook posting cooldown.

## Run locally in VS Code (Windows)

1. Install Python 3.11 or newer from https://www.python.org/downloads/ and enable **Add Python to PATH** during setup.
2. Open this repository folder in VS Code.
3. Open **Terminal → New Terminal** and run:

```powershell
py -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python app.py
```

If PowerShell blocks activation, use the virtual environment without activating it:

```powershell
.venv\Scripts\python.exe -m pip install -r requirements.txt
.venv\Scripts\python.exe app.py
```

4. Open http://127.0.0.1:5000 in your browser. Keep the terminal running while you use the site.
5. Stop the server with **Ctrl+C** in the terminal.

## API routes

- `GET /api/health` — server status.
- `GET /api/stats` — visit and guestbook totals.
- `GET /api/quote` — a random Verity quote.
- `GET /api/guestbook` — the latest 12 public guestbook entries.
- `POST /api/guestbook` — create an entry with JSON `{ "name": "Guest", "message": "Stay golden!" }`.

## Important notes

- The SQLite database (`verity.db`) is created automatically and is intentionally not committed to Git.
- The 3D scene loads Three.js from a CDN, so the orb needs an internet connection. The rest of the page has CSS fallbacks.
- This is a local development setup, not a production-hardened public service. Before making it public, add stronger abuse protection and moderation, configure HTTPS, and choose persistent database storage on your host.
- A static GitHub Pages site cannot execute Flask/Python. Deploy the Python app to a Python-capable host if you want the backend available to everyone.
