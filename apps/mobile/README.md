# SthirMind Mobile

React Native (Expo) app for SthirMind Wisdom Library.

## Run locally
```bash
cd apps/mobile
npm install
npx expo start
```

## Build APK (Android preview)
```bash
npx eas build --platform android --profile preview
```

## Build for production
```bash
npx eas build --platform all --profile production
```

## Screens
- Wisdom Library Home (search, AI picks, 45 books)
- Book Detail (Summary / Audio / Chat / Notes)
- My Library (progress tracking)
- Daily Wisdom (quote + reflection)
- Knowledge Vault (notes + starred)
- Analytics (score rings + weekly progress)
