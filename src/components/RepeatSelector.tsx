import React from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { TaskRepeat, TaskFrequency } from "../types/Task";

interface Props {
  value: TaskRepeat | null;
  onChange: (repeat: TaskRepeat | null) => void;
}

const FREQUENCIES: TaskFrequency[] = ["once", "daily", "weekly", "monthly"];

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

  const setIntervalSafe = (newVal: number) => {
    if (newVal < 1) return;
    onChange({ frequency, interval: newVal });
  };

  const increment = () => setIntervalSafe(interval + 1);
  const decrement = () => setIntervalSafe(interval - 1);

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>Repeat</Text>
      <View style={styles.frequencyGroup}>
        {FREQUENCIES.map((option) => (
          <TouchableOpacity
            key={option}
            onPress={() => handleFrequencyChange(option)}
            style={[
              styles.frequencyOption,
              frequency === option && styles.frequencySelected,
            ]}
          >
            <Text
              style={[
                styles.frequencyText,
                frequency === option && styles.frequencyTextSelected,
              ]}
            >
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {frequency !== "once" && (
        <View style={styles.intervalContainer}>
          <Text style={styles.label}>Every</Text>
          <View style={styles.incrementer}>
            <TouchableOpacity onPress={decrement} style={styles.controlButton}>
              <Text style={styles.controlText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.intervalText}>{interval}</Text>
            <TouchableOpacity onPress={increment} style={styles.controlButton}>
              <Text style={styles.controlText}>＋</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.label}>
            {frequency === "daily"
              ? " day(s)"
              : frequency === "weekly"
              ? " week(s)"
              : " month(s)"}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 12,
  },
  label: {
    fontWeight: "600",
    marginBottom: 4,
    color: "#333",
  },
  frequencyGroup: {
    flexDirection: "row",
    gap: 10,
    marginVertical: 8,
  },
  frequencyOption: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    alignItems: "center",
  },
  frequencySelected: {
    backgroundColor: "#2b2d42",
  },
  frequencyText: {
    color: "#333",
    fontWeight: "500",
  },
  frequencyTextSelected: {
    color: "white",
  },
  intervalContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 8,
  },
  incrementer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  controlButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  controlText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#2b2d42",
  },
  intervalText: {
    fontSize: 16,
    fontWeight: "500",
    minWidth: 30,
    textAlign: "center",
    color: "#333",
  },
});
