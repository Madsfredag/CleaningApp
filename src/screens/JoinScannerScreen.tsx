import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Pressable,
  SafeAreaView,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { joinHouseholdSafely } from "../utils/joinHouseholdSafely";
import i18n from "../translations/i18n";

export default function JoinScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const lock = useRef(false);
  const navigation = useNavigation();
  const { user } = useAuth();

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, []);

  const handleScanned = async ({ data }: { data: string }) => {
    if (lock.current || !user) return;

    lock.current = true;
    setScanned(true);

    const match = data.match(/code=([A-Z0-9]+)/i);
    const code = match?.[1];

    if (!code) {
      Alert.alert(i18n.t("invalid_qr"), i18n.t("invalid_qr_msg"), [
        {
          text: i18n.t("ok"),
          onPress: () => {
            lock.current = false;
            setScanned(false);
          },
        },
      ]);
      return;
    }

    try {
      const joined = await joinHouseholdSafely(code.toUpperCase(), user.id);
      if (joined) {
        Alert.alert(i18n.t("success"), i18n.t("joined_successfully"), [
          {
            text: i18n.t("ok"),
            onPress: () => {
              navigation.navigate("ChooseColor" as never);
            },
          },
        ]);
      } else {
        Alert.alert(i18n.t("failed"), i18n.t("join_failed"), [
          {
            text: i18n.t("ok"),
            onPress: () => {
              lock.current = false;
              setScanned(false);
            },
          },
        ]);
      }
    } catch (error) {
      console.error(error);
      Alert.alert(i18n.t("error"), i18n.t("generic_error"), [
        {
          text: i18n.t("ok"),
          onPress: () => {
            lock.current = false;
            setScanned(false);
          },
        },
      ]);
    }
  };

  if (!permission) return <View />;

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.message}>{i18n.t("camera_permission_msg")}</Text>
        <Pressable style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>{i18n.t("grant_permission")}</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.cameraContainer}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        onBarcodeScanned={handleScanned}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
      />
      <SafeAreaView style={styles.uiOverlay}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </Pressable>
        {scanned && (
          <Pressable
            style={styles.scanAgainBtn}
            onPress={() => {
              lock.current = false;
              setScanned(false);
            }}
          >
            <Text style={styles.buttonText}>{i18n.t("scan_again")}</Text>
          </Pressable>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  cameraContainer: {
    flex: 1,
    backgroundColor: "black",
  },
  uiOverlay: {
    flex: 1,
    justifyContent: "space-between",
    padding: 16,
  },
  backBtn: {
    marginTop: 10,
    alignSelf: "flex-start",
    backgroundColor: "#00000080",
    padding: 10,
    borderRadius: 10,
  },
  scanAgainBtn: {
    alignSelf: "center",
    backgroundColor: "#00000099",
    padding: 14,
    borderRadius: 10,
    marginBottom: 24,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  message: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#ff8c42",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
});
