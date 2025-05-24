import React from "react";
import { View, Text, StyleSheet, TextInput } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { TaskRepeat, TaskFrequency } from "../types/Task";

interface Props {
  value: TaskRepeat | null;
  onChange: (repeat: TaskRepeat | null) => void;
}

export default function RepeatSelector({ value, onChange }: Props) {
  const frequency: TaskFrequency = value?.frequency ?? "once";
  const interval: number = value?.interval ?? 1;

  const handleFrequencyChange = (newFrequency: TaskFrequency) => {
    if (newFrequency === "once") {
      onChange(null);
    } else {
      onChange({ frequency: newFrequency, interval: interval || 1 });
    }
  };

  const handleIntervalChange = (text: string) => {
    const parsed = parseInt(text);
    if (!isNaN(parsed)) {
      onChange({ frequency, interval: parsed });
    }
  };

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>Repeat</Text>
      <Picker
        selectedValue={frequency}
        onValueChange={handleFrequencyChange}
        style={styles.picker}
      >
        <Picker.Item label="Once" value="once" />
        <Picker.Item label="Daily" value="daily" />
        <Picker.Item label="Weekly" value="weekly" />
        <Picker.Item label="Monthly" value="monthly" />
      </Picker>

      {frequency !== "once" && (
        <View style={styles.intervalContainer}>
          <Text style={styles.label}>Every</Text>
          <TextInput
            keyboardType="numeric"
            style={styles.input}
            value={String(interval)}
            onChangeText={handleIntervalChange}
          />
          <Text style={styles.label}>
            {" "}
            {frequency === "daily"
              ? "day(s)"
              : frequency === "weekly"
              ? "week(s)"
              : "month(s)"}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: 10,
  },
  label: {
    fontWeight: "bold",
    marginBottom: 4,
  },
  intervalContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  input: {
    backgroundColor: "#f0f0f0",
    padding: 10,
    borderRadius: 10,
    width: 60,
    marginHorizontal: 8,
  },
  picker: {
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
  },
});
