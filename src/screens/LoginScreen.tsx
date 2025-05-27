import React, { useEffect, useState } from "react";
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
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebase/firebaseConfig";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { StackParamList } from "../types/Navigation";
import { getUserHouseholdId } from "../firestore/HouseholdService";
import * as LocalAuthentication from "expo-local-authentication";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { registerForPushNotificationsAsync } from "../utils/notifications";
import { doc, updateDoc } from "firebase/firestore";
import i18n from "../translations/i18n";

type Props = NativeStackScreenProps<StackParamList, "Login">;

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [hasSavedCredentials, setHasSavedCredentials] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      const isHardwareAvailable = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const savedEmail = await AsyncStorage.getItem("biometricEmail");
      const savedPassword = await AsyncStorage.getItem("biometricPassword");
      setBiometricAvailable(isHardwareAvailable && isEnrolled);
      setHasSavedCredentials(!!savedEmail && !!savedPassword);
    };

    initialize();
  }, []);

  const handleLogin = async () => {
    try {
      setLoading(true);
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const uid = userCredential.user.uid;

      const token = await registerForPushNotificationsAsync();
      if (token) {
        await updateDoc(doc(db, "users", uid), { pushToken: token });
      }

      const householdId = await getUserHouseholdId(uid);
      navigation.replace(householdId ? "MainTabs" : "JoinHousehold");
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : i18n.t("unknown_login_error");
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    try {
      const authResult = await LocalAuthentication.authenticateAsync({
        promptMessage: i18n.t("biometric_prompt"),
      });

      if (!authResult.success) return;

      const savedEmail = await AsyncStorage.getItem("biometricEmail");
      const savedPassword = await AsyncStorage.getItem("biometricPassword");

      if (!savedEmail || !savedPassword) {
        Alert.alert(i18n.t("biometric_error"), i18n.t("no_saved_credentials"));
        return;
      }

      setLoading(true);
      const userCredential = await signInWithEmailAndPassword(
        auth,
        savedEmail,
        savedPassword
      );

      const uid = userCredential.user.uid;

      const token = await registerForPushNotificationsAsync();
      if (token) {
        await updateDoc(doc(db, "users", uid), { pushToken: token });
      }

      const householdId = await getUserHouseholdId(uid);
      navigation.replace(householdId ? "MainTabs" : "JoinHousehold");
    } catch {
      Alert.alert(i18n.t("biometric_failed"), i18n.t("try_again"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={["#a1c4fd", "#c2e9fb"]} style={styles.gradient}>
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>{i18n.t("welcome_back")}</Text>
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
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <TouchableOpacity
          style={styles.button}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{i18n.t("log_in")}</Text>
          )}
        </TouchableOpacity>

        {biometricAvailable && hasSavedCredentials && (
          <TouchableOpacity
            style={[styles.button, styles.biometricButton]}
            onPress={handleBiometricLogin}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {i18n.t("log_in_with_biometrics")}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
          <Text style={styles.link}>{i18n.t("no_account_signup")}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    marginTop: -200, // ⬅️ Pull it up a bit
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
  biometricButton: {
    backgroundColor: "#2b2d42",
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
});
