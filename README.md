# 🧼 Scrubio

**Scrubio** is a cross-platform cleaning schedule app built with React Native, Expo, and Firebase. Designed for households, roommates, and couples, Scrubio makes it easy to create, assign, and manage cleaning tasks — together.

![Scrubio screenshot](./assets/screenshot.png)

---

## ✨ Features

- 📋 Create one-time or recurring cleaning tasks
- 👥 Assign tasks to household members
- 🧠 Get reminders for upcoming chores
- 📱 Biometric login + Firebase Auth
- 🔔 Push & local notifications
- 📸 Join household via QR code
- 🔄 Real-time updates with Firestore

---

## 📦 Tech Stack

- [React Native](https://reactnative.dev/)
- [Expo + EAS](https://expo.dev/)
- [Firebase Auth + Firestore](https://firebase.google.com/)
- [AsyncStorage](https://github.com/react-native-async-storage/async-storage)
- [expo-notifications](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [i18n localization](https://www.i18next.com/)
- TypeScript everywhere

---

## 🚀 Running the App Locally

```bash
git clone https://github.com/yourusername/scrubio.git
cd scrubio

# Install dependencies
npm install

# Start with dev build (required for Firebase Auth persistence)
npx expo run:ios
# or
npx expo run:android
```
