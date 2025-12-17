import { Dimensions, StyleSheet, Text } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useEffect } from "react";

const { height, width } = Dimensions.get("window");

type Props = {
  startX: number;
  drift: number;
  duration: number;
};

export default function Bubble({ startX, drift, duration }: Props) {
  const translateY = useSharedValue(height + 120);
  const translateX = useSharedValue(startX);
  const opacity = useSharedValue(0.9);
  const scale = useSharedValue(1);

  useEffect(() => {
    translateY.value = withTiming(-100, {
      duration,
      easing: Easing.out(Easing.cubic),
    });

    translateX.value = withTiming(startX + drift, {
      duration,
      easing: Easing.out(Easing.quad),
    });

    opacity.value = withTiming(0, { duration: duration * 0.85 });
    scale.value = withTiming(1.25, { duration });
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.bubble, style]}>
      <Text style={styles.check}>✓</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    position: "absolute",
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#28a745",
    justifyContent: "center",
    alignItems: "center",
  },
  check: {
    color: "white",
    fontSize: 30,
    fontWeight: "bold",
  },
});
