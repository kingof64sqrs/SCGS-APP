import { Expo, type ExpoPushMessage } from "expo-server-sdk";

const expo = new Expo();

/**
 * Send an Expo push notification to a set of tokens. Invalid tokens are
 * ignored. Returns the number of messages accepted for delivery.
 */
export async function sendPush(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, unknown>,
): Promise<number> {
  const valid = [...new Set(tokens)].filter((t) => Expo.isExpoPushToken(t));
  if (valid.length === 0) return 0;

  const messages: ExpoPushMessage[] = valid.map((to) => ({
    to,
    sound: "default",
    title,
    body,
    data: data ?? {},
    priority: "high",
  }));

  const chunks = expo.chunkPushNotifications(messages);
  let accepted = 0;
  for (const chunk of chunks) {
    try {
      const tickets = await expo.sendPushNotificationsAsync(chunk);
      accepted += tickets.filter((t) => t.status === "ok").length;
    } catch (err) {
      console.error("Push send error:", err);
    }
  }
  return accepted;
}
