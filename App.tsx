import React from "react";
import * as Notifications from "expo-notifications";
import { AuthProvider } from "./src/context/AuthContext";
import AppNavigator from "./src/navigation/AppNavigator";
import { LanguageProvider } from "./src/context/LanguageContext";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <AppNavigator />
      </LanguageProvider>
    </AuthProvider>
  );
}
