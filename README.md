# Histole

Histole is a history-based guessing game built with React Native and Expo. Each round asks you to identify a historical event in 15 guesses or fewer. Every guess provides feedback about its year, state, historical era, scale, and tag.

The app loads its event catalog and persists game sessions and guesses through the Django API. Accounts, statistics, and streaks are planned for later development.

## Run the app

### Requirements

- Node.js 22 or newer
- npm
- Expo Go, an Android emulator, an iOS simulator, or a web browser

Install dependencies:

```bash
npm install
```

The project is local-only. The Django API runs on the same computer as Expo;
Railway or another public host is not required.

### Complete local startup

From the repository root, run the database setup once:

```powershell
cd C:\Users\sydro\Histole
backend\venv\Scripts\python.exe backend\manage.py migrate
backend\venv\Scripts\python.exe backend\manage.py seed_game
```

Start the API in **Terminal 1** and leave it running:

```powershell
cd C:\Users\sydro\Histole
backend\venv\Scripts\python.exe backend\manage.py runserver 127.0.0.1:8000
```

Start Expo in **Terminal 2**:

```powershell
cd C:\Users\sydro\Histole
npm install
npx expo start -c
```

The default local API setting is documented in [.env.example](./.env.example).
If `.env.local` exists, it overrides that value; `.env.local` is ignored by
Git and should not be committed.

### Web launch: step by step

Use this process when opening Histole in a desktop browser:

1. Open PowerShell and go to the repository root:

```powershell
cd C:\Users\sydro\Histole
```

2. Apply migrations and seed the local database:

```powershell
backend\venv\Scripts\python.exe backend\manage.py migrate
backend\venv\Scripts\python.exe backend\manage.py seed_game
```

3. Start Django and leave this terminal running:

```powershell
backend\venv\Scripts\python.exe backend\manage.py runserver 127.0.0.1:8000
```

4. Open a second PowerShell window and go to the repository root:

```powershell
cd C:\Users\sydro\Histole
```

5. Confirm `.env.local` contains the web API URL:

```text
EXPO_PUBLIC_API_URL=http://localhost:8000/api
```

6. Start Expo for web:

```powershell
npx expo start --web
```

7. Open the URL Expo prints, or press `w` in the Expo terminal.

8. Confirm the API works if the app displays `Failed to fetch`:

```text
http://localhost:8000/api/events
```

The browser should display JSON beginning with `{"events":`.

### Android with Expo Go

The following steps are for running Histole on a physical Android phone. The
phone and development computer must be connected to the same Wi-Fi network.
The phone does not need the repository or Python installed.

1. Install **Expo Go** from the [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent).
   Use Expo Go 58, which matches this project.
2. Run migrations and seed the database if you have not already:

```powershell
cd C:\Users\sydro\Histole
backend\venv\Scripts\python.exe backend\manage.py migrate
backend\venv\Scripts\python.exe backend\manage.py seed_game
```

3. Start Django so other devices on the local network can reach it:

```powershell
backend\venv\Scripts\python.exe backend\manage.py runserver 0.0.0.0:8000
```

4. Find the computer's private IPv4 address:

```powershell
ipconfig
```

Use the IPv4 Address for the active Wi-Fi adapter. This is a local network
address, not a public GitHub address.

5. Create or update `.env.local` in the repository root. This file is
ignored by Git, so the address will not be committed or published:

```text
EXPO_PUBLIC_API_URL=http://YOUR_COMPUTER_IP:8000/api
```

Replace `YOUR_COMPUTER_IP` with the address from `ipconfig`.

6. In a second terminal, start Expo:

```powershell
npx expo start -c
```

7. Open **Expo Go** on Android, choose **Scan QR code**, and scan the QR code
shown in the terminal or in the Expo developer page. Expo Go will download the
JavaScript bundle from the computer.

8. Histole should display `Loading Histole...` briefly, then load the event
catalog from Django. Enter an event, choose a suggestion, and submit it.

If Android cannot connect:

- Confirm both devices are on the same Wi-Fi network, not a guest network.
- Keep Django running on `0.0.0.0:8000`, not only `127.0.0.1`.
- Allow Python through Windows Firewall on **Private networks**.
- Confirm the API is reachable from the phone's browser at
  `http://YOUR_COMPUTER_IP:8000/api/events`.
- Restart Expo after changing `.env.local`; environment values are read when
  Expo starts.
- `npx expo start --tunnel` can help the phone load the Expo JavaScript bundle
  when LAN discovery fails, but the Django API still needs to be reachable at
  the address in `.env.local`.

### Android Studio emulator: step by step

Use this process when opening Histole in an Android Studio virtual device:

1. Start an Android Virtual Device from Android Studio's **Device Manager**.
2. Make sure Expo Go is installed in the emulator.
3. Open PowerShell and go to the repository root:

```powershell
cd C:\Users\sydro\Histole
```

4. Apply migrations and seed the local database:

```powershell
backend\venv\Scripts\python.exe backend\manage.py migrate
backend\venv\Scripts\python.exe backend\manage.py seed_game
```

5. Set `.env.local` to the emulator address:

```text
EXPO_PUBLIC_API_URL=http://10.0.2.2:8000/api
```

`10.0.2.2` is an Android Studio emulator address that maps to the computer's
`localhost`. Do not put `.env.local` inside the emulator.

6. Start Django so the emulator can reach it, and leave the terminal running:

```powershell
backend\venv\Scripts\python.exe backend\manage.py runserver 0.0.0.0:8000
```

7. Test the API from the emulator's browser:

```text
http://10.0.2.2:8000/api/events
```

The page should show JSON beginning with `{"events":`.

8. In a second PowerShell window, start Expo with a cleared cache:

```powershell
cd C:\Users\sydro\Histole
npx expo start -c
```

9. Press `a` in the Expo terminal, or open Expo Go inside the emulator and
   scan the QR code.

10. If the app still shows an old API error, stop Expo, confirm `.env.local`,
    and run `npx expo start -c` again. Expo reads environment values when it
    starts.

The Django settings allow `10.0.2.2` by default. If a debug page says
`DisallowedHost`, restart Django after confirming the latest project files are
installed.

### Web browser

Web development does not require a phone IP address. Start Django in one
terminal and Expo in another:

```powershell
# Terminal 1
# If your prompt already ends in \Histole\backend, omit the first cd command.
cd C:\Users\sydro\Histole
backend\venv\Scripts\python.exe backend\manage.py migrate
backend\venv\Scripts\python.exe backend\manage.py seed_game
backend\venv\Scripts\python.exe backend\manage.py runserver 127.0.0.1:8000

# Terminal 2, from the repository root
cd C:\Users\sydro\Histole
npx expo start --web
```

The web app uses `http://localhost:8000/api` by default. Keep the Django
terminal running while using the app. The backend includes development CORS
support for Expo's changing local web ports. No computer IP is needed for web
testing.

For the Android Studio emulator, Django allows the emulator host `10.0.2.2`
by default, which maps to the computer running the backend.

Then use the Expo CLI prompts to open Histole on Android, iOS, or the web. The platform-specific shortcuts are also available:

```bash
npm run android
npm run ios
npm run web
```

## Gameplay

1. Enter a historical event and choose a result from the suggestions.
2. Submit the guess to compare its attributes with the daily target.
3. Use the color feedback to narrow down the target event.
4. Solve the round before reaching the 15-guess limit.

The normalized catalog is seeded by `backend/game/management/commands/seed_game.py`.
The current seed list contains named, hand-authored historical events, including
events selected from the [Library of Congress U.S. History Primary Source
Timeline](https://www.loc.gov/classroom-materials/united-states-history-primary-source-timeline/).
The LOC-derived records are stored in `backend/game/loc_events.py`; only events
that occurred in the United States are included. Do not add generated
placeholder records: every catalog entry should identify a real historical
event that fits the application's state-based schema.
Additional distinct U.S.-based events from the [History of the United States
article](https://en.wikipedia.org/wiki/History_of_the_United_States) are stored
in `backend/game/wikipedia_events.py`. Overseas-only events are intentionally
excluded.
Kansas-specific events from the [History of Kansas
article](https://en.wikipedia.org/wiki/History_of_Kansas) are stored in
`backend/game/kansas_events.py`; duplicate events already in the catalog are
not repeated.
The catalog also includes a `Tragedy` tag for significant disasters, attacks,
and other documented tragedies. Its classifications are maintained in
`backend/game/tragedy_events.py`; this label is intentionally broader than a
legal classification such as domestic terrorism.
To add an event, append a tuple to that file's `events` list:

```python
(
    "Event name",
    1900,
    "State",
    "Era name",
    "Scale name",
    "Tag name",
),
```

The state, era, scale, and tag names must already exist in the dictionaries
defined above the list. Then reseed the database:

```powershell
cd backend
..\backend\venv\Scripts\python.exe manage.py seed_game
```

The command uses `update_or_create`, so existing events are updated and new
events are inserted without duplicating them.
Gameplay rules and attribute comparisons live in `src/game/event-logic.ts`; API
requests live in `src/game/api.ts`.

## Development commands

```bash
npm run lint
npm test -- --runInBand
npx tsc --noEmit
npx expo config --type public
```

The same lint, test, type-check, and Expo configuration checks run in CI. Pull requests also run a dependency audit and a TruffleHog secret scan.

## Project structure

| Path | Purpose |
| --- | --- |
| `src/app` | Expo Router screens and layout |
| `src/game` | Event data access and gameplay logic |
| `src/constants` | Shared theme and layout values |
| `src/components` | Reusable React Native components |
| `test` | Jest support files |
| `Check Ins` | Project planning and database design notes |

## Technology

- [Expo SDK 58](https://docs.expo.dev/versions/v58.0.0/)
- [Expo Router](https://docs.expo.dev/router/introduction/)
- [React Native](https://reactnative.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Jest](https://jestjs.io/)