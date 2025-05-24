import React, { useEffect } from "react";
import { View, Text, Button } from "react-native";
import { useAuth } from "../context/AuthContext";
import { getUserHouseholdId } from "../firestore/HouseholdService";

export default function HomeScreen({ navigation }: any) {
  const { user, logout } = useAuth();

  useEffect(() => {
    const check = async () => {
      if (!user) {
        navigation.replace("Login");
        return;
      }
      const householdId = await getUserHouseholdId(user.uid);
      if (!householdId) {
        navigation.replace("Household");
      }
    };
    check();
  }, []);

  return (
    <View>
      <Text>Welcome to the Home screen!</Text>
      <Button onPress={logout} title={"Logout"}></Button>
    </View>
  );
}
