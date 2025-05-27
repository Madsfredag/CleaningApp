import React, { useState } from "react";
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebase/firebaseConfig";
import { doc, setDoc, updateDoc } from "firebase/firestore";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { StackParamList } from "../types/Navigation";
import { AppUser } from "../types/User";
import { getUserHouseholdId } from "../firestore/HouseholdService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";
import * as Notifications from "expo-notifications";
import { registerForPushNotificationsAsync } from "../utils/notifications";
import i18n from "../translations/i18n";
import { useLanguage } from "../context/LanguageContext";

type Props = NativeStackScreenProps<StackParamList, "Signup">;

export default function SignupScreen({ navigation }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { language, switchLanguage } = useLanguage();

  const handleSignup = async () => {
    if (!username.trim()) return setError(i18n.t("username_required"));

    try {
      setLoading(true);
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const uid = userCredential.user.uid;

      const newUser: AppUser = {
        id: uid,
        email,
        displayName: username.trim(),
        createdAt: new Date(),
        householdId: null,
        points: 0,
        pushToken: null,
      };

      await setDoc(doc(db, "users", uid), newUser);

      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (hasHardware && isEnrolled) {
        Alert.alert(
          i18n.t("enable_biometrics_title"),
          i18n.t("enable_biometrics_description"),
          [
            { text: i18n.t("no"), style: "cancel" },
            {
              text: i18n.t("yes"),
              onPress: async () => {
                try {
                  await AsyncStorage.setItem("biometricEmail", email);
                  await AsyncStorage.setItem("biometricPassword", password);
                } catch (err) {
                  console.warn("Failed to save biometrics:", err);
                }
              },
            },
          ]
        );
      }

      const { status } = await Notifications.getPermissionsAsync();
      let finalStatus = status;

      if (status !== "granted") {
        const { status: newStatus } =
          await Notifications.requestPermissionsAsync();
        finalStatus = newStatus;
      }

      if (finalStatus === "granted") {
        const token = await registerForPushNotificationsAsync();
        if (token) {
          await updateDoc(doc(db, "users", uid), { pushToken: token });
        }
      }

      const householdId = await getUserHouseholdId(uid);
      navigation.replace(householdId ? "MainTabs" : "JoinHousehold");
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : i18n.t("signup_error_generic");
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchLang = () => {
    const nextLang = language === "en" ? "da" : "en";
    switchLanguage(nextLang);
    Alert.alert(
      i18n.t("language_switched"),
      `${i18n.t("current_language")}: ${nextLang}`
    );
  };

  return (
    <LinearGradient colors={["#c2e9fb", "#a1c4fd"]} style={styles.gradient}>
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>{i18n.t("create_account")}</Text>

        <TextInput
          style={styles.input}
          placeholder={i18n.t("email")}
          placeholderTextColor="#555"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder={i18n.t("password")}
          placeholderTextColor="#555"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <TextInput
          style={styles.input}
          placeholder={i18n.t("username")}
          placeholderTextColor="#555"
          value={username}
          onChangeText={setUsername}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={styles.button}
          onPress={handleSignup}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{i18n.t("sign_up")}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("Login")}>
          <Text style={styles.link}>{i18n.t("already_have_account")}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.langBtn} onPress={handleSwitchLang}>
          <Text style={styles.langText}>
            {language === "en" ? "Skift til Dansk" : "Switch to English"}
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    marginBottom: 32,
    color: "#2b2d42",
    textAlign: "center",
  },
  input: {
    backgroundColor: "#ffffffcc",
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    fontSize: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    marginHorizontal: 28,
  },
  button: {
    backgroundColor: "#ff8c42",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
    marginHorizontal: 28,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  link: {
    textAlign: "center",
    marginTop: 20,
    color: "#2b2d42",
  },
  error: {
    color: "#d90429",
    marginBottom: 8,
    textAlign: "center",
  },
  langBtn: {
    marginTop: 24,
    alignSelf: "center",
    backgroundColor: "#2b2d42",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  langText: {
    color: "#fff",
    fontWeight: "600",
  },
});
