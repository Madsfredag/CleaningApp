// src/navigation/AppNavigator.tsx
import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";
import LoginScreen from "../screens/LoginScreen";
import SignupScreen from "../screens/SignupScreen";
import JoinHouseholdScreen from "../screens/JoinHouseholdScreen";
import JoinScannerScreen from "../screens/JoinScannerScreen";
import { StackParamList } from "../types/Navigation";
import { getUserHouseholdId } from "../firestore/HouseholdService";
import { ActivityIndicator, View } from "react-native";
import BottomTabs from "./BottomTabs";

const Stack = createNativeStackNavigator<StackParamList>();

export default function AppNavigator() {
  const { user } = useAuth();
  const [initialRoute, setInitialRoute] = useState<keyof StackParamList | null>(
    null
  );

  useEffect(() => {
    const checkInitialRoute = async () => {
      if (!user) {
        setInitialRoute("Login");
        return;
      }
      const householdId = await getUserHouseholdId(user.uid);
      if (householdId) {
        setInitialRoute("MainTabs");
      } else {
        setInitialRoute("JoinHousehold");
      }
    };
    checkInitialRoute();
  }, [user]);

  if (!initialRoute) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{ headerShown: false }}
        initialRouteName={initialRoute}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen name="JoinHousehold" component={JoinHouseholdScreen} />
        <Stack.Screen name="JoinScanner" component={JoinScannerScreen} />
        <Stack.Screen name="MainTabs" component={BottomTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
