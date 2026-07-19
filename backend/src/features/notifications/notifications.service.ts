import {
  addPushToken,
  allPushTokens,
  insertNotification,
  listNotificationsForMember,
  markRead,
  removePushToken,
  type NotificationPublic,
  type NotificationType,
} from "./notifications.model.js";
import { sendPush } from "./push.service.js";

export interface DispatchResult {
  notificationId: string;
  pushAccepted: number;
  tokenCount: number;
}

/**
 * Create a stored notification for everyone AND fire an Expo push to all
 * registered devices. Used by admin broadcast and automatic event alerts.
 */
export async function dispatchNotification(input: {
  title: string;
  body: string;
  type: NotificationType;
  refId?: string;
}): Promise<DispatchResult> {
  const createdAt = new Date().toISOString();
  const notificationId = await insertNotification({
    title: input.title,
    body: input.body,
    type: input.type,
    refId: input.refId,
    createdAt,
  });

  const tokens = await allPushTokens();
  const pushAccepted = await sendPush(tokens, input.title, input.body, {
    type: input.type,
    refId: input.refId,
    notificationId,
  });

  return { notificationId, pushAccepted, tokenCount: tokens.length };
}

export function getMemberNotifications(
  samajId: string,
): Promise<{ items: NotificationPublic[]; unread: number }> {
  return listNotificationsForMember(samajId);
}

export function markMemberNotificationRead(samajId: string, id?: string): Promise<void> {
  return markRead(samajId, id);
}

export function registerPushToken(samajId: string, token: string): Promise<void> {
  return addPushToken(samajId, token);
}

export function unregisterPushToken(samajId: string, token: string): Promise<void> {
  return removePushToken(samajId, token);
}
