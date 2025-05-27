import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { AppUser } from "../types/User";
import i18n from "../translations/i18n";
interface Props {
  members: AppUser[];
}

export default function MembersCard({ members }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{i18n.t("household_members")}</Text>
      {members.length === 0 ? (
        <Text style={styles.empty}>{i18n.t("no_members_yet")}</Text>
      ) : (
        members.map((m) => (
          <Text key={m.id} style={styles.name}>
            • {m.displayName || m.email}
          </Text>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffffcc",
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 10,
    color: "#2b2d42",
  },
  name: {
    fontSize: 16,
    color: "#333",
    paddingVertical: 2,
  },
  empty: {
    fontStyle: "italic",
    color: "#555",
  },
});
