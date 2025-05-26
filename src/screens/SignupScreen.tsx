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
import { doc, setDoc } from "firebase/firestore";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { StackParamList } from "../types/Navigation";
import { AppUser } from "../types/User";
import { getUserHouseholdId } from "../firestore/HouseholdService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";

type Props = NativeStackScreenProps<StackParamList, "Signup">;

export default function SignupScreen({ navigation }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!username.trim()) return setError("Username is required");

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
      };

      await setDoc(doc(db, "users", uid), newUser);

      // ✅ Ask if the user wants to enable biometrics
      const hardware = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();

      if (hardware && enrolled) {
        Alert.alert(
          "Enable Biometric Login?",
          "Would you like to enable biometric login for faster access?",
          [
            {
              text: "No",
              style: "cancel",
            },
            {
              text: "Yes",
              onPress: async () => {
                try {
                  await AsyncStorage.setItem("biometricEmail", email);
                  await AsyncStorage.setItem("biometricPassword", password);
                } catch (storageErr) {
                  console.warn("Failed to save biometrics:", storageErr);
                }
              },
            },
          ]
        );
      }

      const householdId = await getUserHouseholdId(uid);
      navigation.replace(householdId ? "MainTabs" : "JoinHousehold");
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown signup error";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={["#c2e9fb", "#a1c4fd"]} style={styles.gradient}>
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Create Account</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#555"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#555"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <TextInput
          style={styles.input}
          placeholder="Username"
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
            <Text style={styles.buttonText}>Sign Up</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("Login")}>
          <Text style={styles.link}>Already have an account? Log in</Text>
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
});
