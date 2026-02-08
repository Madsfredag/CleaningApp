import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import HomeScreen from "../screens/HomeScreen";
import HouseholdScreen from "../screens/HouseholdScreen";
import ProfileScreen from "../screens/ProfileScreen";
import CompletedTasksScreen from "../screens/CompletedTasksScreen";
import { Ionicons } from "@expo/vector-icons";
import i18n from "../translations/i18n";
import { useLanguage } from "../context/LanguageContext";
import ChooseColorScreen from "../screens/ChooseColorScreen";

const Tab = createBottomTabNavigator();

export default function BottomTabs() {
  const { language } = useLanguage();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#030000ff",
        tabBarInactiveTintColor: "#656363ff",
        tabBarStyle: {
          height: 65,
          paddingBottom: 5,
        },
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = "home";
          if (route.name === "Home") iconName = "home";
          else if (route.name === "Household") iconName = "people";
          else if (route.name === "Profile") iconName = "person";
          else if (route.name === "Completed") iconName = "checkmark-done";
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarLabel:
          route.name === "Home"
            ? i18n.t("tab_home")
            : route.name === "Household"
              ? i18n.t("tab_household")
              : route.name === "Completed"
                ? i18n.t("tab_completed")
                : i18n.t("tab_profile"),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Household" component={HouseholdScreen} />
      <Tab.Screen name="Completed" component={CompletedTasksScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
      <Tab.Screen
        name="ChooseColor"
        component={ChooseColorScreen}
        options={{
          tabBarItemStyle: { display: "none" },
        }}
      />
    </Tab.Navigator>
  );
}
