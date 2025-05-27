import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { Household } from "../types/Household";
import { useNavigation } from "@react-navigation/native";
import i18n from "../translations/i18n";
interface Props {
  household: Household;
}

export default function QrCodeCard({ household }: Props) {
  const [showQR, setShowQR] = useState(false);
  const navigation = useNavigation();

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{i18n.t("your_household_code")}</Text>
      <Text style={styles.code}>{household.code}</Text>

      {showQR && (
        <View style={styles.qrContainer}>
          <QRCode value={`cleanapp://join?code=${household.code}`} size={180} />
        </View>
      )}

      <TouchableOpacity
        style={styles.qrButton}
        onPress={() => setShowQR(!showQR)}
      >
        <Text style={styles.qrButtonText}>
          {showQR ? i18n.t("hide_qr_code") : i18n.t("show_qr_code")}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.scanButton}
        onPress={() => navigation.navigate("JoinScanner" as never)}
      >
        <Text style={styles.scanButtonText}>
          {i18n.t("scan_qr_to_join_new_household")}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffffcc",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#2b2d42",
    marginBottom: 8,
  },
  code: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    textAlign: "center",
    marginBottom: 10,
  },
  qrContainer: {
    alignItems: "center",
    marginBottom: 12,
  },
  qrButton: {
    backgroundColor: "#ff8c42",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 10,
  },
  qrButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
  scanButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  scanButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
});
