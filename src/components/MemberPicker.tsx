// components/MemberPicker.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { Household } from "../types/Household";
import { AppUser } from "../types/User";

interface Props {
  household: Household;
  value: string | null;
  onChange: (uid: string | null) => void;
  members: AppUser[];
}

export default function MemberPicker({ value, onChange, members }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Assign To</Text>
      <View style={styles.pickerWrapper}>
        <Picker
          selectedValue={value ?? ""}
          onValueChange={(val) => onChange(val || null)}
        >
          <Picker.Item label="Unassigned" value="" />
          {members.map((user) => (
            <Picker.Item
              key={user.id}
              label={user.displayName}
              value={user.id}
            />
          ))}
        </Picker>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    marginBottom: 4,
    color: "#2b2d42",
  },
  pickerWrapper: {
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    overflow: "hidden",
  },
});
