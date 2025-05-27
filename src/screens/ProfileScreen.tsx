import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../context/AuthContext";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { AppUser } from "../types/User";
import { useNavigation } from "@react-navigation/native";
import i18n from "../translations/i18n";
import { useLanguage } from "../context/LanguageContext";

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { language, switchLanguage } = useLanguage();
  const navigation = useNavigation();
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [editVisible, setEditVisible] = useState(false);
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const snap = await getDoc(doc(db, "users", user.id));
      if (!snap.exists()) return;
      const data = snap.data();
      setAppUser({
        id: snap.id,
        ...(data as Omit<AppUser, "id" | "createdAt">),
        createdAt: data.createdAt?.toDate?.() || new Date(),
      });
      setDisplayName(data.displayName);
      setLoading(false);
    };
    fetch();
  }, [user]);

  const handleUpdate = async () => {
    if (!user || !displayName.trim()) return;
    try {
      await updateDoc(doc(db, "users", user.id), {
        displayName: displayName.trim(),
      });
      setAppUser((prev) =>
        prev ? { ...prev, displayName: displayName.trim() } : prev
      );
      setEditVisible(false);
    } catch {
      Alert.alert(i18n.t("error"), i18n.t("update_profile_failed"));
    }
  };

  const handleLogout = () => {
    logout();
    navigation.navigate("Login" as never);
  };

  if (!user || loading || !appUser) {
    return (
      <LinearGradient colors={["#a1c4fd", "#c2e9fb"]} style={styles.gradient}>
        <SafeAreaView style={styles.centered}>
          <ActivityIndicator size="large" />
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#a1c4fd", "#c2e9fb"]} style={styles.gradient}>
      <SafeAreaView style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.header}>{i18n.t("your_profile")}</Text>

          <Text style={styles.label}>{i18n.t("name")}</Text>
          <Text style={styles.value}>{appUser.displayName}</Text>

          <Text style={styles.label}>{i18n.t("email")}</Text>
          <Text style={styles.value}>{appUser.email}</Text>

          <Text style={styles.label}>{i18n.t("created")}</Text>
          <Text style={styles.value}>
            {appUser.createdAt.toLocaleDateString("da-DK")}
          </Text>

          <Text style={styles.label}>{i18n.t("household_id")}</Text>
          <Text style={styles.value}>
            {appUser.householdId || i18n.t("not_in_household")}
          </Text>

          <View style={styles.btnRow}>
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => setEditVisible(true)}
            >
              <Text style={styles.btnText}>{i18n.t("edit_profile")}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <Text style={styles.btnText}>{i18n.t("log_out")}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.langBtn}
              onPress={() => {
                const newLang = language === "en" ? "da" : "en";
                switchLanguage(newLang);
                Alert.alert(
                  i18n.t("language_switched"),
                  i18n.t("current_language") + ": " + newLang.toUpperCase()
                );
              }}
            >
              <Text style={styles.btnText}>
                {language === "en"
                  ? i18n.t("switch_to_danish")
                  : i18n.t("switch_to_english")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <Modal visible={editVisible} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {i18n.t("edit_display_name")}
              </Text>
              <TextInput
                style={styles.input}
                value={displayName}
                onChangeText={setDisplayName}
                placeholder={i18n.t("display_name")}
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: "#ccc" }]}
                  onPress={() => setEditVisible(false)}
                >
                  <Text>{i18n.t("cancel")}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: "#ff8c42" }]}
                  onPress={handleUpdate}
                >
                  <Text style={{ color: "#fff", fontWeight: "600" }}>
                    {i18n.t("save")}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
    padding: 16,
    justifyContent: "center",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    backgroundColor: "#ffffffcc",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    marginHorizontal: 8,
  },
  header: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1a1a2e",
    textAlign: "center",
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: "#555",
    marginTop: 10,
    fontWeight: "600",
  },
  value: {
    fontSize: 16,
    color: "#2b2d42",
  },
  btnRow: {
    marginTop: 28,
    gap: 12,
  },
  editBtn: {
    backgroundColor: "#4e89ae",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  logoutBtn: {
    backgroundColor: "#d90429",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  langBtn: {
    backgroundColor: "#2b2d42",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  btnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 16,
    width: "85%",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    color: "#2b2d42",
    textAlign: "center",
  },
  input: {
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
});
