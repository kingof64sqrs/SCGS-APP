import { env } from "../../config/env.js";

/** Whether WhatsApp Cloud API credentials are configured. */
export function whatsappConfigured(): boolean {
  return !!(env.whatsappToken && env.whatsappPhoneId);
}

/**
 * Send a plain-text WhatsApp message via the WhatsApp Cloud API.
 * NOTE: outside the 24-hour customer-service window, Meta only allows approved
 * message *templates* — free-form text may be rejected. This is best-effort.
 * Returns true if the API accepted the message.
 */
export async function sendWhatsAppText(toPhone: string, body: string): Promise<boolean> {
  if (!whatsappConfigured()) return false;
  // Ensure country code — assume India (+91) when a bare 10-digit number is given.
  const digits = toPhone.replace(/\D/g, "");
  const to = digits.length === 10 ? `91${digits}` : digits;

  try {
    const res = await fetch(
      `https://graph.facebook.com/v20.0/${env.whatsappPhoneId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.whatsappToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "text",
          text: { body },
        }),
      },
    );
    return res.ok;
  } catch (err) {
    console.error("WhatsApp send error:", err);
    return false;
  }
}

/**
 * Fan out a WhatsApp message to many phone numbers (best effort, throttled).
 * Returns how many were accepted by the API.
 */
export async function sendWhatsAppBulk(phones: string[], body: string): Promise<number> {
  if (!whatsappConfigured()) return 0;
  let sent = 0;
  // Sequential with a tiny gap to stay under rate limits.
  for (const phone of phones) {
    if (!phone) continue;
    // eslint-disable-next-line no-await-in-loop
    const ok = await sendWhatsAppText(phone, body);
    if (ok) sent += 1;
  }
  return sent;
}
