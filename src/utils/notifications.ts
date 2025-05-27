import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log("Push notification permission not granted");
    return null;
  }

  const tokenData = await Notifications.getExpoPushTokenAsync();
  console.log("Expo push token:", tokenData.data);
  return tokenData.data;
}
