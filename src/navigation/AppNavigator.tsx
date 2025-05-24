import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";
import LoginScreen from "../screens/LoginScreen";
import SignupScreen from "../screens/SignupScreen";
import JoinHouseholdScreen from "../screens/HouseholdScreen";
import HomeScreen from "../screens/HomeScreen";
import JoinScannerScreen from "../screens/JoinScannerScreen";
import { StackParamList } from "../types/Navigation";
import { getUserHouseholdId } from "../firestore/HouseholdService";
import { ActivityIndicator, View } from "react-native";

const Stack = createNativeStackNavigator<StackParamList>();

export default function AppNavigator() {
  const { user } = useAuth();
  const [hasHousehold, setHasHousehold] = useState<boolean | null>(null);

  useEffect(() => {
    const check = async () => {
      if (!user) {
        setHasHousehold(false);
        return;
      }
      const householdId = await getUserHouseholdId(user.uid);
      setHasHousehold(!!householdId);
    };
    check();
  }, [user]);

  if (user === undefined || hasHousehold === null) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen name="Household" component={JoinHouseholdScreen} />
        <Stack.Screen name="JoinScanner" component={JoinScannerScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
