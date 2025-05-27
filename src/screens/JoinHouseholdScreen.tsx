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
import i18n from "../translations/i18n";

export default function JoinHouseholdScreen({ navigation }: any) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [createdCode, setCreatedCode] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!name.trim()) return setError(i18n.t("enter_household_name"));
    try {
      const code = await createHousehold(name.trim(), user!.id);
      setCreatedCode(code);
    } catch {
      setError(i18n.t("create_household_error"));
    }
  };

  const handleJoin = async () => {
    if (!code.trim()) return setError(i18n.t("enter_code"));
    const householdId = await joinHouseholdByCode(
      code.trim().toUpperCase(),
      user!.id
    );
    if (householdId) {
      navigation.replace("MainTabs");
    } else {
      setError(i18n.t("household_not_found"));
    }
  };

  if (!user) {
    return (
      <LinearGradient colors={["#a1c4fd", "#c2e9fb"]} style={styles.gradient}>
        <SafeAreaView style={styles.centered}>
          <Text>{i18n.t("loading_user")}</Text>
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
                <Text style={styles.title}>{i18n.t("create_household")}</Text>
                <TextInput
                  placeholder={i18n.t("household_name")}
                  value={name}
                  onChangeText={setName}
                  style={styles.input}
                />
                <TouchableOpacity style={styles.button} onPress={handleCreate}>
                  <Text style={styles.buttonText}>{i18n.t("create")}</Text>
                </TouchableOpacity>

                <Text style={styles.subtitle}>{i18n.t("or_join_by_code")}</Text>
                <TextInput
                  placeholder={i18n.t("code_placeholder")}
                  value={code}
                  onChangeText={setCode}
                  style={styles.input}
                />
                <TouchableOpacity style={styles.button} onPress={handleJoin}>
                  <Text style={styles.buttonText}>{i18n.t("join")}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.outline]}
                  onPress={() => navigation.navigate("JoinScanner")}
                >
                  <Text style={[styles.buttonText, styles.outlineText]}>
                    {i18n.t("scan_qr_to_join")}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.title}>{i18n.t("share_qr")}</Text>
                <Text style={styles.codeText}>
                  {i18n.t("code")}: {createdCode}
                </Text>
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
                  <Text style={styles.buttonText}>
                    {i18n.t("continue_to_home")}
                  </Text>
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
