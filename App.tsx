// App.tsx
import "text-encoding-polyfill";

import React from "react";
import * as Notifications from "expo-notifications";
import { AuthProvider } from "./src/context/AuthContext";
import AppNavigator from "./src/navigation/AppNavigator";

// ✅ Updated for Expo SDK 50+ (iOS 15+ support)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true, // NEW: for iOS banners
    shouldShowList: true, // NEW: for iOS notification center
  }),
});

export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}
