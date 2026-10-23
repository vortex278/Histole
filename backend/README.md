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
safe to run repeatedly and currently loads 60 historical events, including the
five events used by the prototype: California Gold Rush, Declaration of
Independence, Battle of Gettysburg, Moon Landing, and Louisiana Purchase.

## Verify the database

```powershell
.\venv\Scripts\python.exe manage.py check
.\venv\Scripts\python.exe manage.py test game
```

The tests verify the event/tag relationship, duplicate association protection,
session/guess persistence, and unique attempt numbers within a session.
