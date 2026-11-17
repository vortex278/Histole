# Histole Project Documentation

## 1. Project overview

Histole is a history-based guessing game. A player receives a daily historical
event target and has up to 15 guesses to identify it. Each submitted event is
displayed as a game card with feedback for:

- Year
- State
- Historical era
- Geographic scale
- Historical tag

The project has two applications:

1. An Expo/React Native frontend that runs on web, Android, and other Expo
   platforms.
2. A Django backend that stores the normalized event catalog, sessions, and
   guesses in SQLite and exposes the game API.

The project is intentionally local-only. It does not require a public host,
cloud database, login system, or production deployment.

The current playable experience begins at a mode-selection menu. Daily Game
uses a deterministic date-based target, while Free Play chooses a random target
and supports replaying another round.

## 2. Technology stack

### Frontend

- React 19
- React Native
- React Native Web
- Expo SDK 58
- Expo Router
- TypeScript
- `expo-image` for event images
- Jest and `jest-expo` for frontend tests
- ESLint with `eslint-config-expo`

The frontend package configuration is in [package.json](./package.json).
Expo application configuration is in [app.json](./app.json).

### Backend

- Python
- Django 6.1
- SQLite
- Django ORM

Backend dependencies are listed in
[backend/requirements.txt](./backend/requirements.txt).

### Development environment

- Node.js 22 or newer
- npm
- Python virtual environment at `backend\venv`
- Expo Go 58, Android Studio, an iOS simulator, or a web browser

## 3. Repository structure

### Root files

- `README.md`: installation, launch, and troubleshooting instructions.
- `AI_USAGE.md`: how AI assisted with the project.
- `PROJECT_DOCUMENTATION.md`: this document.
- `package.json`: frontend dependencies and scripts.
- `app.json`: Expo application configuration.
- `tsconfig.json`: strict TypeScript configuration and `@/*` path alias.
- `jest.config.js`: Jest and Expo test configuration.
- `eslint.config.js`: frontend lint configuration.
- `.env.example`: example API environment settings.
- `assets/`: application icons, splash images, and static assets.
- `Check Ins/`: project check-in documentation.

### Frontend

- `src/app/_layout.tsx`: Expo Router root layout.
- `src/app/index.tsx`: main menu with Daily Game and Free Play navigation.
- `src/app/game.tsx`: shared gameplay screen for both modes.
- `src/app/daily.tsx`: Daily Game route.
- `src/app/free.tsx`: Free Play route.
- `src/constants/api.ts`: platform-specific API URL selection.
- `src/constants/theme.ts`: shared theme constants.
- `src/game/api.ts`: typed API client.
- `src/game/event-logic.ts`: event feedback rules and event types.
- `src/game/event-repository.ts`: older in-memory repository helpers.
- `src/game/mock-events.ts`: older prototype event data.
- `src/hooks/`: color-scheme and theme hooks.

The running game uses the Django API. The mock repository remains as prototype
code and is not the source of the current playable catalog.

The branded logo is bundled at
[assets/images/histole-logo.png](./assets/images/histole-logo.png). Shared
palette tokens and game-card feedback colors are defined in
[src/constants/theme.ts](./src/constants/theme.ts).

### Backend

- `backend/manage.py`: Django command-line entry point.
- `backend/histole_backend/settings.py`: Django settings.
- `backend/histole_backend/urls.py`: API route registration.
- `backend/histole_backend/cors.py`: local development CORS behavior.
- `backend/game/models.py`: database models.
- `backend/game/views.py`: API views and serialization.
- `backend/game/tests.py`: backend tests.
- `backend/game/management/commands/seed_game.py`: repeatable catalog seeder.
- `backend/game/loc_events.py`: Library of Congress event source data.
- `backend/game/wikipedia_events.py`: United States history event source data.
- `backend/game/kansas_events.py`: Kansas history event source data.
- `backend/game/sports_events.py`: major sports events held in the United States.
- `backend/game/tragedy_events.py`: event names that receive the Tragedy tag.
- `backend/game/event_images.json`: reviewed image manifest.
- `backend/data/histole.sqlite3`: local SQLite database.
- `backend/game/migrations/`: database schema migrations.

## 4. Frontend behavior

The main menu loads first and routes to `/daily` or `/free`. Both routes render
the shared game screen.

The game screen loads in this order:

1. `fetchEvents()` requests the playable event catalog.
2. `createSession()` creates a server-side session and receives the daily or
   Free Play target event.
3. The catalog is stored in frontend state for search suggestions.
4. The target is stored in frontend state but is not shown to the player during
   normal play.
5. The player searches for an event by name.
6. Suggestions are filtered case-insensitively from the loaded catalog.
7. The player selects a suggestion and submits it.
8. The client confirms that the selected name exists in the catalog.
9. The client submits the event ID to Django.
10. The returned event is added to the top of the guess list.

The screen displays:

- Loading state while the catalog and session are being created.
- API error state if the backend cannot be reached.
- Search input and event suggestions.
- Guess count out of 15.
- Submitted event cards.
- Green, yellow, or cream attribute cards.
- Up/down year guidance arrows.
- Eight-direction state guidance arrows.
- Era ranges.
- An instruction panel that disappears after the first valid guess.
- A persistent tip panel below the guess cards.
- Tip pages navigated with previous and next arrow buttons.
- A win message and win modal after a correct guess.
- A game-over modal after the fifteenth incorrect guess.

The win and game-over modals can be dismissed with the `×` button so the
player can inspect the completed board. Free Play modals include a **Play
Again** button. Daily modals include a button that opens Free Play.

Each guessed event has an info control that reveals its description. On web the
control can be hovered, and on mobile it is tapped. Missing descriptions use a
visible fallback message.

The catalog also includes major sports events held in the United States.
These records use the event state, an appropriate historical era and scale,
and the Sports tag. Events held outside the United States are excluded so the
state field remains meaningful for gameplay.

The main menu and game screens use the shared cream, brown, and green palette,
with a subtle top-left lighter-brown gradient fading into the primary brown
background.
Game-card feedback intentionally uses green for correct, yellow for close, and
cream for incorrect so the learning feedback remains visually distinct from
the surrounding screen palette.

## 5. Game rules and feedback

### Guess limit

The game allows 15 guesses. The frontend disables further input after a win or
after 15 incorrect guesses. The backend also rejects guesses after the limit,
so the limit is enforced at both layers.

### Year feedback

The API returns years as strings, and the frontend converts them to numbers
when it compares them:

- Equal years: `correct`, shown green.
- Difference of 10 years or less: `close`, shown yellow.
- Difference greater than 10 years: `incorrect`, shown cream.

The year card also shows:

- `↑` when the target year is greater than the guessed year.
- `↓` when the target year is less than the guessed year.
- No arrow when the years match or are invalid.

### State feedback

The state is correct when names match. A bordering state is considered close.
All other states are incorrect.

State cards can display left, right, up, down, or diagonal arrows toward the
target state's approximate geographic center.

### Era feedback

The backend compares the event's era position using the database's
`start_year` ordering. The same era is correct and an adjacent era is close.
The frontend renders the status returned by the API.

The frontend uses the backend's exact era names:

| Era | Range |
|---|---:|
| Colonial Era | 1607-1763 |
| American Revolution | 1765-1783 |
| New Nation | 1783-1815 |
| National Expansion | 1815-1860 |
| Civil War | 1861-1877 |
| Rise of Industrial America | 1878-1900 |
| Progressive Era | 1901-1928 |
| WWII and Great Depression | 1929-1945 |
| Modern Era | 1945-2100 |

### Scale feedback

The backend orders scale values using the database's `display_order`:

1. Local
2. State
3. Regional
4. National
5. International

The same scale is correct and an adjacent scale is close. The frontend renders
the API-provided status and order metadata.

### Tag feedback

Tags require an exact normalized match. The current tags are:

- Expansion
- Migration
- Military
- Politics
- Science
- Sports
- Tragedy

### Tip pages

The persistent tip panel contains pages for:

1. How to play
2. Feedback colors
3. Year arrows
4. State directions
5. Era and scale ordering
6. Exact tag matching

The first and last pages disable the unavailable navigation arrow. Starting a
new Free Play round resets the tip page to the beginning.

## 6. Backend API

The API base path is `/api`.

### `GET /api/events`

Returns the playable catalog:

```json
{
  "events": [
    {
      "eventId": 1,
      "name": "Pennsylvania Colony Established",
      "year": "1681",
      "state": "Pennsylvania",
      "era": "Colonial Era",
      "eraStartYear": 1607,
      "eraEndYear": 1763,
      "scale": "International",
      "scaleOrder": 5,
      "tag": "Migration",
      "image": "https://...",
      "description": "..."
    }
  ]
}
```

Birth events whose names end in `" was Born"` are excluded from this query.
This same filtered query is used for target selection and guess validation.

### `POST /api/sessions`

Creates a game session. The request body accepts `mode: "daily"` or
`mode: "free"`. Daily mode uses the repeatable date-based target. Free mode
selects a random playable target and accepts `excludeEventId` to avoid the
previous round's target.

Response:

```json
{
  "sessionId": 12,
  "target": {
    "eventId": 1,
    "name": "Pennsylvania Colony Established",
    "year": "1681",
    "state": "Pennsylvania",
    "era": "Colonial Era",
    "scale": "International",
    "tag": "Migration",
    "image": "https://...",
    "description": "..."
  }
}
```

The daily target index is calculated from `YYYYMMDD % catalog_length`. This
creates a repeatable daily target for the current catalog ordering. Free Play
uses a random target from the same filtered catalog.

### `POST /api/sessions/<id>/guesses`

Request:

```json
{
  "guessedEventId": 123
}
```

The endpoint validates:

- JSON input
- Integer event ID
- Existing session
- Existing playable event
- Maximum of 15 guesses
- No duplicate guess in the session

Response:

```json
{
  "guessId": 44,
  "attemptNumber": 3,
  "event": {},
  "statuses": {
    "year": "close",
    "state": "incorrect",
    "era": "correct",
    "scale": "close",
    "tag": "incorrect"
  },
  "solved": false
}
```

The guess row and session counter are written inside one database transaction.
The frontend renders the returned status values directly, while era ranges,
era ordering, and scale ordering come from the normalized API data rather than
duplicated client-side constants.

## 7. Database design

The local database is SQLite at
[backend/data/histole.sqlite3](./backend/data/histole.sqlite3).

### `State`

Stores state names used by historical events.

- `state_name`: unique state name.

### `Era`

Stores historical era names and year boundaries.

- `era_name`: unique name.
- `start_year`
- `end_year`

A database constraint requires the start year to be less than or equal to the
end year.

### `Scale`

Stores geographic scale names and display order.

- `scale_name`: unique scale name.
- `display_order`: unique ordering number.

### `Tag`

Stores event categories.

- `tag_name`: unique tag name.

### `Event`

Stores the playable historical event metadata.

- `event_name`: unique event name.
- `event_year`
- `state`: protected foreign key to `State`.
- `era`: protected foreign key to `Era`.
- `scale`: protected foreign key to `Scale`.
- `description`: text shown in the win modal.
- `image_url`: remote image URL shown on event cards and modals.
- `tag`: required protected foreign key to the event's single `Tag`.

### `GameSession`

Stores one play session.

- `played_on`
- `target_event`: protected foreign key to `Event`.
- `guesses_used`
- `solved`

The database limits `guesses_used` to 0 through 15.

### `Guess`

Stores one submitted guess.

- `session`
- `attempt_number`
- `guessed_event`: protected foreign key to `Event`.
- `year_status`
- `state_status`
- `era_status`
- `scale_status`
- `tag_status`

The database enforces:

- Unique `(session, attempt_number)`.
- Attempt number from 1 through 15.
- Valid status values of `correct`, `close`, or `incorrect`.

### Database transaction demonstration

The backend database behavior can be demonstrated independently of the Expo
frontend.

#### Start the backend

From the repository root, start Django:

```powershell
backend\venv\Scripts\python.exe backend\manage.py runserver 127.0.0.1:8000
```

The local SQLite database is
[backend/data/histole.sqlite3](./backend/data/histole.sqlite3). It can be
opened with DB Browser for SQLite. The main gameplay tables are
`game_event`, `game_gamesession`, and `game_guess`.

#### Transaction 1: create a game session

Send this request with Postman, Insomnia, or PowerShell:

```powershell
$session = Invoke-RestMethod `
  -Method Post `
  -Uri http://127.0.0.1:8000/api/sessions `
  -ContentType "application/json" `
  -Body "{}"

$session
```

This creates one `GameSession` row. The response includes the generated
`sessionId` and the selected target event. The session starts with
`guesses_used = 0` and `solved = false`.

#### Transaction 2: submit a guess

Use the returned session ID and an event ID from the event catalog:

```powershell
$guess = Invoke-RestMethod `
  -Method Post `
  -Uri "http://127.0.0.1:8000/api/sessions/$($session.sessionId)/guesses" `
  -ContentType "application/json" `
  -Body '{"guessedEventId": 2}'

$guess
```

The guess endpoint uses one explicit `transaction.atomic()` block. Inside that
transaction it:

1. Inserts one `Guess` row with the calculated year, state, era, scale, and
   tag statuses.
2. Updates the matching `GameSession` row.
3. Increments `guesses_used`.
4. Sets `solved` if the guessed event matches the target.

Both writes succeed together or roll back together. This prevents a guess row
from being saved without the corresponding session counter update. The
implementation is in
[backend/game/views.py](./backend/game/views.py), and the transaction begins
in the `guesses` view.

#### Verify the database changes

Refresh the tables in DB Browser for SQLite and show:

- `game_gamesession`: the session now has `guesses_used = 1`.
- `game_guess`: a new row exists with `attempt_number = 1`.
- `game_event`: the target and guessed event are referenced by foreign keys.

The API response also exposes the same result through `guessId`,
`attemptNumber`, `statuses`, and `solved`.

#### Demonstrate validation and rollback behavior

Submit the same event again for the same session. The backend rejects the
duplicate before creating another row and returns HTTP 400 with:

```json
{
  "error": "Event has already been guessed."
}
```

Other database protections include:

- A session cannot exceed 15 guesses.
- Attempt numbers must be between 1 and 15.
- Attempt numbers must be unique within a session.
- Feedback statuses must be `correct`, `close`, or `incorrect`.
- Foreign keys prevent references to invalid events or sessions.

For the presentation, show the API request, refresh the three SQLite tables,
and explain that the guess insert and session update are one atomic operation.
The automated integrity checks are in
[backend/game/tests.py](./backend/game/tests.py).

## 8. Event data pipeline

Event data is source-controlled rather than manually entered into SQLite.

### Source files

The seed command combines:

1. Prototype events defined in `seed_game.py`.
2. Library of Congress timeline events in `loc_events.py`.
3. United States history events in `wikipedia_events.py`.
4. Kansas history events in `kansas_events.py`.
5. Major sports events held in the United States in `sports_events.py`.

Each event tuple contains:

```text
name, year, state, era, scale, tag, description
```

The description field is optional for older/prototype records and defaults to
an empty string when absent.

### Seeding behavior

`seed_game`:

1. Creates or updates all states.
2. Creates or updates all eras and their ranges.
3. Creates or updates all scales.
4. Creates or retrieves all tags.
5. Removes obsolete events that are safe to delete.
6. Removes unreferenced obsolete birth events.
7. Combines all event source lists.
8. Skips events whose state is not in the state catalog.
9. Uses `update_or_create` by event name.
10. Updates event year, relationships, description, and approved image URL.
11. Replaces each event's tag association.
12. Prints the resulting event and association counts.

Referenced obsolete events are retained because sessions and guesses use
protected foreign keys. They are excluded from the playable API catalog.

## 9. Image pipeline

Image metadata is stored in
[backend/game/event_images.json](./backend/game/event_images.json).

The manifest records:

- Event name
- Provider
- Display image URL
- Source page URL
- License
- Credit
- Search query
- Retrieval timestamp
- Review status

The current discovery pass found conservative Wikimedia Commons candidates for
some events and marked unresolved events as `unmapped`. Only entries marked
`mapped` are loaded into `Event.image_url`. Unmapped events remain blank rather
than receiving an unrelated or unverified image.

The frontend already supports blank image URLs with a neutral image background.
Image candidates should be checked for relevance and licensing before being
marked `mapped`.

## 10. Historical source and verification process

Descriptions were added from supplied research notes and checked for material
accuracy. Sources used during review include:

- Library of Congress
- National Archives
- National Park Service
- Kansas Historical Society
- NASA
- NOAA
- FBI
- U.S. Department of State
- Smithsonian Institution
- Wikimedia Commons metadata

Corrections were made where a description had an inaccurate location, date
interpretation, casualty count, legal characterization, or overly broad claim.

## 11. Configuration and networking

API URLs are selected in [src/constants/api.ts](./src/constants/api.ts).

### Web

Default:

```text
EXPO_PUBLIC_WEB_API_URL=http://localhost:8000/api
```

### Android Studio emulator

Set:

```text
EXPO_PUBLIC_ANDROID_API_URL=http://10.0.2.2:8000/api
```

`10.0.2.2` maps from the emulator to the host computer's localhost.

`.env.local` is local-only and must not be committed.

## 12. Installation and launch

From the repository root:

```powershell
npm install
backend\venv\Scripts\python.exe backend\manage.py migrate
backend\venv\Scripts\python.exe backend\manage.py seed_game
```

Start Django:

```powershell
backend\venv\Scripts\python.exe backend\manage.py runserver 127.0.0.1:8000
```

Start Expo for web:

```powershell
npx expo start --web
```

For Android on the local network, run Django on all interfaces:

```powershell
backend\venv\Scripts\python.exe backend\manage.py runserver 0.0.0.0:8000
```

The API can be checked directly at:

```text
http://localhost:8000/api/events
```

## 13. Testing and validation

### Frontend tests

Run the focused event logic tests:

```powershell
npm test -- --runInBand src/game/event-logic.test.ts
```

Run all frontend tests:

```powershell
npm test
```

Run lint:

```powershell
npm run lint
```

Frontend tests cover exact event lookup, year directions, eight-direction state
guidance, unknown and matching states, shared palette values, and preserved
game-card colors.

### Backend tests

```powershell
backend\venv\Scripts\python.exe backend\manage.py test game
```

Backend tests cover:

- Seeded catalog contents
- Event/tag relationships
- Duplicate event/tag protection
- API catalog responses
- CORS behavior
- Session creation
- Guess persistence
- Duplicate guess rejection
- Attempt limits
- Valid feedback statuses
- Image manifest metadata

### Manual API and SQLite transaction test

The manual transaction demonstration verifies the frontend/API/database path
end to end. Start Django and leave it running:

```powershell
backend\venv\Scripts\python.exe backend\manage.py runserver 127.0.0.1:8000
```

Open
[backend/data/histole.sqlite3](./backend/data/histole.sqlite3) in a SQLite
extension or viewer. SQL statements must be run in the extension's query
editor, not at a PowerShell prompt. The PowerShell prompt begins with `PS`;
PowerShell does not interpret SQL syntax.

Create a fresh session from a second PowerShell terminal:

```powershell
$session = Invoke-RestMethod `
  -Method Post `
  -Uri http://127.0.0.1:8000/api/sessions `
  -ContentType "application/json" `
  -Body '{"mode":"free"}'

$session
```

Use the returned `sessionId` in this SQLite query:

```sql
SELECT
    id,
    played_on,
    target_event_id,
    guesses_used,
    solved
FROM game_gamesession
WHERE id = YOUR_SESSION_ID;
```

The new session should have `guesses_used = 0` and `solved = 0`. Submit one
different event as a guess, then refresh SQLite:

```sql
SELECT id, guesses_used, solved
FROM game_gamesession
WHERE id = YOUR_SESSION_ID;

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
WHERE session_id = YOUR_SESSION_ID
ORDER BY attempt_number;
```

The expected result is `guesses_used = 1` and one related `game_guess` row.
This demonstrates that the guess endpoint inserts the guess and updates the
session counter within one `transaction.atomic()` block. The Django terminal
shows the request-level evidence, such as `POST /api/sessions 201` and
`POST /api/sessions/<id>/guesses 201`; SQLite shows the persisted rows.

Submit the same event a second time to demonstrate duplicate protection. The
API should return HTTP 400 with `Event has already been guessed.`, and the
SQLite query should still show only one guess for that event.

For a readable relationship demonstration, join the guess to its guessed and
target events:

```sql
SELECT
    g.attempt_number,
    guessed.event_name AS guessed_event,
    target.event_name AS target_event,
    g.year_status,
    g.state_status,
    g.era_status,
    g.scale_status,
    g.tag_status
FROM game_guess g
JOIN game_event guessed ON guessed.id = g.guessed_event_id
JOIN game_gamesession s ON s.id = g.session_id
JOIN game_event target ON target.id = s.target_event_id
WHERE g.session_id = YOUR_SESSION_ID;
```

The primary tables to show are `game_event`, `game_gamesession`, and
`game_guess`. This manual procedure complements the automated backend tests by
showing the frontend request, server response, and persisted database state.

### Syntax and database checks

```powershell
backend\venv\Scripts\python.exe backend\manage.py check
backend\venv\Scripts\python.exe -m py_compile backend\game\*.py
```

## 14. Error handling

The frontend reports:

- API connection failures
- Non-JSON API responses
- Invalid event selection
- Duplicate guesses
- Backend validation errors

The backend returns JSON errors with HTTP status codes for invalid sessions,
invalid event IDs, duplicate guesses, exhausted sessions, and unavailable
catalogs.

The backend uses database constraints as a final integrity boundary in
addition to application-level validation.

## 15. Current limitations

- No user accounts.
- No persistent player profiles.
- No statistics, streaks, leaderboards, or history.
- One local SQLite database.
- No production deployment.
- Daily target selection is deterministic from the date and catalog length.
- Image coverage is incomplete while image candidates are reviewed.
- Some existing event descriptions or images may be blank.
- Remote image URLs depend on third-party availability.
- The frontend still contains prototype mock-event files that are not used by
  the API-driven game.
- The current API uses focused Django views and `JsonResponse` rather than a
  separate REST framework.
- No automated end-to-end browser or mobile UI test suite currently exists.

## 16. Data integrity and maintenance rules

When adding or changing an event:

1. Update the appropriate source data file.
2. Keep the event name stable unless intentionally renaming it.
3. Verify the state, era, scale, and tag values against the seed catalogs.
4. Add or update the description.
5. Add an image manifest entry only after checking relevance and licensing.
6. Run `seed_game`.
7. Run backend tests.
8. Check the API response.
9. Run frontend lint and relevant frontend tests.

Do not manually edit the SQLite file as the primary data-management method.
The source files and seeding command are the reproducible source of truth.

## 17. Academic/project scope

The project demonstrates:

- Cross-platform React Native development with Expo.
- A typed frontend API client.
- Django JSON API endpoints backed by the Django ORM.
- Relational database modeling and foreign-key constraints.
- A required one-tag foreign key that matches the application's actual rules.
- Transactional gameplay persistence.
- Server-side validation.
- Source-controlled data seeding.
- Historical research and source verification.
- Image licensing and attribution tracking.
- Automated frontend and backend testing.
