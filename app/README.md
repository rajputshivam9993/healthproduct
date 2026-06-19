# Doctor360 — Mobile App

React Native (Expo SDK 54) app for patients and doctors.

## Setup

```bash
npm install
npx expo start
```

Then scan the QR code with **Expo Go** (SDK 54) on your phone, or press `a` / `i`
to open an Android emulator / iOS simulator. The app runs in Expo Go — persistent
storage uses `@react-native-async-storage/async-storage`, which is bundled with
Expo Go (no custom dev build required).

> Note: animation libraries (e.g. `react-native-reanimated`) are intentionally not
> included yet; they'll be added with the UI-polish work (Req 18). If a future
> dependency needs native code outside Expo Go, switch to a
> [development build](https://docs.expo.dev/develop/development-builds/introduction/).

## Environment variables

Expo exposes `EXPO_PUBLIC_*` variables to the client at build time:

- `EXPO_PUBLIC_API_BASE_URL` — backend API base (default `http://localhost:3000/api`).
  On Android emulators, use `http://10.0.2.2:3000/api`.

## Folder structure (Req 20.5)

```
src/
  screens/      Grouped by feature: auth/, patient/, doctor/
  components/   Reusable UI elements
  hooks/        Custom React hooks (e.g. use-auth)
  services/     API layer (Axios client + per-domain services)
  navigation/   Root, patient, and doctor navigators
  stores/       Zustand stores (auth, preferences) persisted via AsyncStorage
  types/        Shared TypeScript types
  constants/    Centralized config
  theme/        Design-system tokens (palette, spacing, typography)
  lib/          React Query client
App.tsx         Provider composition + navigation container
```

## Scripts

| Script              | Purpose                      |
| ------------------- | ---------------------------- |
| `npm run start`     | Start the Expo dev server    |
| `npm run android`   | Open on Android              |
| `npm run ios`       | Open on iOS                  |
| `npm run typecheck` | Type-check without emitting  |

> Status: scaffold. Screens render placeholders; navigation switches between the
> Patient and Doctor tab navigators based on the authenticated role.
