import React, { useState } from "react";
import { Text, View, Button } from "react-native";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import LoginScreen from "./src/screens/LoginScreen";
import SignupScreen from "./src/screens/SignupScreen";

const Main = () => {
  const { user, logout } = useAuth();
  const [showSignup, setShowSignup] = useState(false);

  if (!user) {
    return showSignup ? (
      <SignupScreen onSwitch={() => setShowSignup(false)} />
    ) : (
      <LoginScreen onSwitch={() => setShowSignup(true)} />
    );
  }

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Welcome, {user.email}</Text>
      <Button title="Logout" onPress={logout} />
    </View>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <Main />
    </AuthProvider>
  );
}
