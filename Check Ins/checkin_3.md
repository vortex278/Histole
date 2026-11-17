# Check In 3: Connecting the App

*Due December 6th*

## Integration

Since the last check-in, I connected the Expo app to the Django API. The app is no longer using the mock event catalog for normal gameplay:

- `GET /api/events` gets the events from the normalized Event, State, Era, Scale, and Tag tables.
- `POST /api/sessions` creates a game session and lets the server choose the target event.
- `POST /api/sessions/<id>/guesses` checks the session, duplicate guesses, and 15-guess limit before saving a Guess row.

The client checks that the player selected an actual catalog event before sending a guess. If the API returns an error, the app displays it instead of pretending the guess worked.

The mobile platform also changed from my original iOS plan to Android. I am using Expo Go and Android Studio, with the web version being useful for development and demonstrating the API. The app now uses the Django API and normalized SQLite database instead of the earlier in-memory event list.

## What I kept from Check-in 2

Check-in 2 was mostly about designing the normalized database. This check-in was about actually making the API and frontend follow that design instead of leaving it as a plan.

- `Event` has one required `tag_id`. I did not add multi-tag support.
- `State` only stores the state name. I removed state abbreviations from the schema, seed data, API, and UI.
- `GameSession` stores the target, guess count, and solved state. `Guess` stores each selected event and its feedback statuses.
- The API returns era ranges (`start_year`, `end_year`) and scale ordering (`display_order`) instead of making the frontend keep another copy of that information.
- The backend calculates the year, state, era, scale, and tag statuses. The frontend displays those statuses instead of calculating them again.
- The 15-guess limit, duplicate guess rule, required foreign keys, and unique attempt numbers are still enforced by the database and API.

The biggest changes from Check-in 2 were keeping the one-tag design, removing the unused state abbreviations, letting the API own the era and scale metadata, and making the saved backend statuses the source of truth for the frontend.

## Event data

The event catalog is kept in Python data files that are part of the project:

- `backend/game/loc_events.py` has Library of Congress timeline events.
- `backend/game/wikipedia_events.py` has different United States history events.
- `backend/game/kansas_events.py` has Kansas history events.
- `backend/game/sports_events.py` has 26 major sports events held in the United States.
- `backend/game/management/commands/seed_game.py` combines these sources and loads them into the database.

Running `seed_game` multiple times is safe. It uses `update_or_create`, so existing events are updated instead of duplicated. It also creates the related State, Era, Scale, and Tag rows as needed. Events removed from the source files are deleted when it is safe to do so. If an old event is still used by a session or guess, it stays in the database for referential integrity, but it is not returned as a playable event.

I also removed obsolete presidential birth events that end in `" was Born"`. They are deleted when nothing refers to them and excluded from the event catalog, target selection, and guess validation. This keeps old rows in a local SQLite database from suddenly showing up again.

The API converts the normalized database records into the shape used by the client: `eventId`, `name`, `year`, `state`, `era`, `eraStartYear`, `eraEndYear`, `scale`, `scaleOrder`, `tag`, and `image`. This means the client uses the same filtered event list as target selection and guess validation instead of keeping a separate list.

The main menu and game screens use the bundled `assets/images/histole-logo.png`. The shared colors are in `src/constants/theme.ts`. The general palette is cream, brown, and green. The game feedback colors are green for correct, yellow for close, and cream for incorrect.

Every event currently has exactly one tag. The backend stores it directly in `Event.tag_id`, so multi-tag associations are not supported by the schema, seeder, or API. The Sports tag now describes 26 major sports events held in the United States. Their states are stored in the catalog, and events outside the country are left out so state feedback still makes sense.

The app also has a separate Free Play mode. Daily sessions still choose a target based on the date. Free Play chooses a random playable target and can avoid choosing the previous target, so the player can start another round without changing the daily game.

Both modes use the same gameplay screen. The mode menu sends the player to separate Daily Game and Free Play pages, and both pages have a styled Main Menu button. Before the first guess, an instruction panel explains the game and disappears after a valid guess. A tip panel stays below the guess cards and explains the arrows and feedback colors. The tip panel has separate pages for how to play, colors, year, state, era and scale, and tag help.

Event images are managed separately in `backend/game/event_images.json`. Each reviewed image includes its provider, display URL, source page, license, credit, and review status. The seed command only uses entries marked `mapped`. Events without a reviewed image stay blank instead of getting an image that has not been verified.

## The abstraction problem and looking at the SQL

The ORM made it easy to create a `Guess`, but it also hid a bug from me. The frontend was showing yellow feedback for bordering states and nearby eras or scales, while the backend's general `_value_status()` function was saving those same guesses as `incorrect`. The app looked right on the screen, but the database was storing the wrong answer.

I first looked at the ORM querysets and then checked the database directly. Django's query logging showed the joins used to load a guess, and SQLite showed the actual status saved in the row:

```powershell
cd backend
..\backend\venv\Scripts\python.exe manage.py shell -c "from django.db import connection; from game.models import Guess; list(Guess.objects.select_related('session', 'guessed_event')); print(connection.queries[-1]['sql'])"
sqlite3 data\histole.sqlite3 "SELECT session_id, guessed_event_id, state_status, era_status, scale_status FROM game_guess ORDER BY id DESC LIMIT 5;"
```

The first command showed that the API uses joined reads to get display data and separate inserts or updates inside one transaction. The second command showed the actual disagreement: a neighboring state could look yellow in the app while `game_guess.state_status` was saved as `incorrect`. That proved this was not just a rendering problem.

I replaced the general comparison with rules for each category. State names use the border map, era IDs are compared by `start_year`, and scale IDs are compared by `display_order`. I checked the generated SQL and the saved row with the API test `test_guess_api_persists_close_statuses` in `backend/game/tests.py`.

This also made the division between the layers clearer. Django owns the normalized database metadata and saved feedback statuses. The frontend owns presentation behavior such as arrows, tip-page navigation, modal visibility, and colors.

## Running the project locally

The project is intentionally local-only. It does not need Railway or another public backend. The API runs from the Django backend in the repository.

### Web browser

From the repository root, run:

```powershell
backend\venv\Scripts\python.exe backend\manage.py migrate
backend\venv\Scripts\python.exe backend\manage.py seed_game
backend\venv\Scripts\python.exe backend\manage.py runserver 127.0.0.1:8000
```

Leave that terminal running. In a second terminal, run:

```powershell
npm install
npx expo start --web
```

The web app uses `http://localhost:8000/api`.

### Android with Expo Go

Install Expo Go 58 from Google Play. Connect the phone and development computer to the same Wi-Fi network, then start Django on the local network:

```powershell
backend\venv\Scripts\python.exe backend\manage.py migrate
backend\venv\Scripts\python.exe backend\manage.py seed_game
backend\venv\Scripts\python.exe backend\manage.py runserver 127.0.0.1:8000
```

Start Expo with `npx expo start -c` and scan the QR code in Expo Go. The private address is only used on the local Wi-Fi network and should not be added to committed source files. Restart Expo after changing `.env.local`.

### Android Studio emulator

1. Start an Android Virtual Device and open Expo Go.
2. Set `.env.local` to `EXPO_PUBLIC_API_URL=http://10.0.2.2:8000/api`.
3. Run the migrations and seed the database.
4. Start Django with `backend\venv\Scripts\python.exe backend\manage.py runserver 0.0.0.0:8000`.
5. Confirm that `http://10.0.2.2:8000/api/events` displays JSON in the emulator.
6. Run `npx expo start -c` in a second terminal and press `a`.
