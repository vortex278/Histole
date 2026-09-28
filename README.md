# Histole

Histole is a history-based guessing game built with React Native and Expo. Each round asks you to identify a historical event in 15 guesses or fewer. Every guess provides feedback about its year, state, historical era, scale, and tag.

The current app is a playable prototype using an in-memory mock event catalog. Database-backed event storage, accounts, statistics, and streaks are planned for later development.

## Run the app

### Requirements

- Node.js 22 or newer
- npm
- Expo Go, an Android emulator, an iOS simulator, or a web browser

Install dependencies:

```bash
npm install
```

Start the Expo development server:

```bash
npm start
```

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

The prototype currently uses five mock events defined in `src/game/mock-events.ts`. Gameplay rules and attribute comparisons live in `src/game/event-logic.ts`, while target and event lookup behavior lives in `src/game/event-repository.ts`.

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

- [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/)
- [Expo Router](https://docs.expo.dev/router/introduction/)
- [React Native](https://reactnative.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Jest](https://jestjs.io/)