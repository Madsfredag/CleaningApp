import * as Notifications from "expo-notifications";

export async function sendPushNotification(expoPushToken: string, title: string, body: string) {
  console.log("📤 Sending push notification to:", expoPushToken);
  console.log("📨 Title:", title);
  console.log("📝 Body:", body);

  const response = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Accept-Encoding": "gzip, deflate",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to: expoPushToken,
      sound: "default",
      title,
      body,
    }),
  });

  const data = await response.json();
  console.log("✅ Expo Push Response:", data);
}
