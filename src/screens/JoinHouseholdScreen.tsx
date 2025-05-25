import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import QRCode from "react-native-qrcode-svg";
import { LinearGradient } from "expo-linear-gradient";
import {
  createHousehold,
  joinHouseholdByCode,
} from "../firestore/HouseholdService";

export default function JoinHouseholdScreen({ navigation }: any) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [createdCode, setCreatedCode] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!name.trim()) return setError("Enter a household name");
    try {
      const code = await createHousehold(name.trim(), user!.uid);
      setCreatedCode(code);
    } catch {
      setError("Could not create household");
    }
  };

  const handleJoin = async () => {
    if (!code.trim()) return setError("Enter a code");
    const householdId = await joinHouseholdByCode(
      code.trim().toUpperCase(),
      user!.uid
    );
    if (householdId) {
      navigation.replace("MainTabs");
    } else {
      setError("Household not found");
    }
  };

  if (!user) {
    return (
      <LinearGradient colors={["#a1c4fd", "#c2e9fb"]} style={styles.gradient}>
        <SafeAreaView style={styles.centered}>
          <Text>Loading user...</Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#a1c4fd", "#c2e9fb"]} style={styles.gradient}>
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.card}>
            {!createdCode ? (
              <>
                <Text style={styles.title}>Create Household</Text>
                <TextInput
                  placeholder="Household name"
                  value={name}
                  onChangeText={setName}
                  style={styles.input}
                />
                <TouchableOpacity style={styles.button} onPress={handleCreate}>
                  <Text style={styles.buttonText}>Create</Text>
                </TouchableOpacity>

                <Text style={styles.subtitle}>Or Join by Code</Text>
                <TextInput
                  placeholder="6-character code"
                  value={code}
                  onChangeText={setCode}
                  style={styles.input}
                />
                <TouchableOpacity style={styles.button} onPress={handleJoin}>
                  <Text style={styles.buttonText}>Join</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.outline]}
                  onPress={() => navigation.navigate("JoinScanner")}
                >
                  <Text style={[styles.buttonText, styles.outlineText]}>
                    Scan QR to Join
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.title}>Share this QR Code</Text>
                <Text style={styles.codeText}>Code: {createdCode}</Text>
                <View style={styles.qrContainer}>
                  <QRCode
                    value={`cleanapp://join?code=${createdCode}`}
                    size={200}
                  />
                </View>
                <TouchableOpacity
                  style={styles.button}
                  onPress={() => navigation.navigate("MainTabs")}
                >
                  <Text style={styles.buttonText}>Continue to Home</Text>
                </TouchableOpacity>
              </>
            )}
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  qrContainer: {
    alignItems: "center",
    marginVertical: 20,
  },
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    justifyContent: "center",
    flexGrow: 1,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    backgroundColor: "#ffffffcc",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 20,
    color: "#1a1a2e",
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 20,
    marginBottom: 10,
    textAlign: "center",
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  button: {
    backgroundColor: "#ff8c42",
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    textAlign: "center",
    fontSize: 16,
  },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#ff8c42",
  },
  outlineText: {
    color: "#ff8c42",
  },
  error: {
    color: "red",
    marginTop: 12,
    textAlign: "center",
  },
  codeText: {
    fontSize: 16,
    marginVertical: 12,
    textAlign: "center",
    color: "#2b2d42",
  },
});
