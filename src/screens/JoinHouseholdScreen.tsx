import React, { useContext, useState, useEffect } from "react";
import { View, Text, TextInput, Button, StyleSheet } from "react-native";
import { useAuth } from "../context/AuthContext";
import QRCode from "react-native-qrcode-svg";
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

  if (!user) {
    return (
      <View style={styles.container}>
        <Text>Loading user...</Text>
      </View>
    );
  }

  const handleCreate = async () => {
    if (!name.trim()) return setError("Enter a household name");
    try {
      const code = await createHousehold(name.trim(), user.uid);
      setCreatedCode(code);
    } catch (e) {
      console.error(e);
      setError("Could not create household");
    }
  };

  const handleJoin = async () => {
    if (!code.trim()) return setError("Enter a code");
    const householdId = await joinHouseholdByCode(
      code.trim().toUpperCase(),
      user.uid
    );
    if (householdId) {
      navigation.replace("MainTabs");
    } else {
      setError("Household not found");
    }
  };

  return (
    <View style={styles.container}>
      {!createdCode ? (
        <>
          <Text style={styles.title}>Create Household</Text>
          <TextInput
            placeholder="Household name"
            value={name}
            onChangeText={setName}
            style={styles.input}
          />
          <Button title="Create" onPress={handleCreate} />

          <Text style={styles.title}>Or Join by Code</Text>
          <TextInput
            placeholder="6-character code"
            value={code}
            onChangeText={setCode}
            style={styles.input}
          />
          <Button title="Join" onPress={handleJoin} />
          <Button
            title="Scan QR to Join"
            onPress={() => navigation.navigate("JoinScanner")}
          />
        </>
      ) : (
        <>
          <Text style={styles.title}>Share this QR Code</Text>
          <Text style={styles.codeText}>Code: {createdCode}</Text>
          <QRCode value={`cleanapp://join?code=${createdCode}`} size={200} />
          <Button
            title="Continue to Home"
            onPress={() => navigation.navigate("MainTabs")}
          />
        </>
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  title: { fontSize: 18, marginTop: 20 },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    marginVertical: 8,
    padding: 10,
    borderRadius: 5,
  },
  error: { color: "red", marginTop: 10 },
  codeText: { fontSize: 16, marginBottom: 12 },
});
