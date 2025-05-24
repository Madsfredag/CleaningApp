// App.tsx or index.js (at the top!)
import "text-encoding-polyfill"; // ← this makes TextEncoder globally available

import React from "react";
import { AuthProvider } from "./src/context/AuthContext";
import AppNavigator from "./src/navigation/AppNavigator";

export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}
