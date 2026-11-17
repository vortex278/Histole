# Histole backend

This directory contains the first functional implementation of the normalized
database described in [Check-in 2](../Check%20Ins/checkin_2.md). It uses Django's ORM
with SQLite so the schema can be run locally without a separate database server.
The Expo application is still using its in-memory repository; API integration is
planned for Check-in 3.

## Setup

The repository currently includes a local virtual environment at `backend\venv`.
For a fresh environment, install the pinned dependencies:

```powershell
cd backend
python -m venv venv
.\venv\Scripts\python.exe -m pip install -r requirements.txt
```

## Create and seed the database

Run these commands from the repository root:

```powershell
cd backend
.\venv\Scripts\python.exe manage.py migrate
.\venv\Scripts\python.exe manage.py seed_game
```

The SQLite file is created at `backend\data\histole.sqlite3`. The seed command is
safe to run repeatedly and loads the historical catalog, including the 26
U.S.-based sports events and the five events used by the prototype: California
Gold Rush, Declaration of Independence, Battle of Gettysburg, Moon Landing,
and Louisiana Purchase.

## Verify the database

```powershell
.\venv\Scripts\python.exe manage.py check
.\venv\Scripts\python.exe manage.py test game
```

The tests verify the event/tag relationship, duplicate association protection,
session/guess persistence, and unique attempt numbers within a session.

## Demonstrate API persistence

Keep Django running in one terminal:

```powershell
..\backend\venv\Scripts\python.exe manage.py runserver 127.0.0.1:8000
```

Use a second PowerShell terminal to create a session through the API. Then
submit a guess through `POST /api/sessions/<id>/guesses`. The server terminal
shows the request status, while the SQLite file
`backend\data\histole.sqlite3` shows the persisted changes.

Open the database in a SQLite extension or viewer and run SQL in its query
editor, not at the PowerShell prompt:

```sql
SELECT id, played_on, target_event_id, guesses_used, solved
FROM game_gamesession
ORDER BY id DESC
LIMIT 1;

SELECT
    id,
    session_id,
    attempt_number,
    guessed_event_id,
    year_status,
    state_status,
    era_status,
    scale_status,
    tag_status
FROM game_guess
ORDER BY id DESC
LIMIT 5;
```

After one valid guess, the newest session should have `guesses_used = 1` and
the newest guess should have `attempt_number = 1`. The guess endpoint writes
the `Guess` row and updates the `GameSession` row inside one atomic
transaction. Submitting the same event again demonstrates duplicate
protection: the API returns HTTP 400 and no additional guess row is created.
