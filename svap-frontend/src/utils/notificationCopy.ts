type NotificationLike = {
  type?: string | null;
  title?: string | null;
  body?: string | null;
};

const containsUrduScript = (value: string) => /[\u0600-\u06FF\u0750-\u077F]/.test(value);
const romanUrduHints = /\b(aapki|apki|aapka|apka|aapke|apke|hai|hain|ho gaya|ho gayi|kar di|kardi|mil gaya|bhej di|wapas|raha hai|rhi hai|nahi|nahin|karein|karen)\b/i;

const copyByType: Record<string, { title: string; body: string }> = {
  svap_request: { title: "New SVAP Request", body: "You received a new SVAP request." },
  swap_request: { title: "New SVAP Request", body: "You received a new SVAP request." },
  svap_accepted: { title: "SVAP Request Accepted", body: "Your SVAP request was accepted." },
  swap_accepted: { title: "SVAP Request Accepted", body: "Your SVAP request was accepted." },
  svap_rejected: { title: "Request Rejected", body: "Your SVAP request was rejected." },
  swap_rejected: { title: "Request Rejected", body: "Your SVAP request was rejected." },
  swap_cancelled: { title: "SVAP Cancelled", body: "This SVAP has been cancelled." },
  svap_unavailable: { title: "Product Unavailable", body: "This product is no longer available for SVAP." },
  swap_unavailable: { title: "Product Unavailable", body: "This product is no longer available for SVAP." },
  swap_partner_checkout_completed: {
    title: "SVAP Partner Checked Out",
    body: "Your SVAP partner has completed checkout. Complete your own checkout to continue.",
  },
  swap_timeout: { title: "SVAP Cancelled - Timeout", body: "Your SVAP was cancelled because checkout was not completed within 48 hours." },
  product_question: { title: "New question about your listing", body: "A user asked a question about your listing." },
  product_answer: { title: "Your question was answered", body: "The seller answered your question." },
  order_update: { title: "Order Update", body: "Your order status has been updated." },
  system: { title: "Notification", body: "You have a new notification." },
};

/** Display legacy or trigger-generated Urdu notification text in English. */
export function getEnglishNotificationCopy(notification: NotificationLike) {
  const title = notification.title || "";
  const body = notification.body || "";
  const hasUrdu = (value: string) => containsUrduScript(value) || romanUrduHints.test(value);
  if (!hasUrdu(title) && !hasUrdu(body)) return { title, body };

  const fallback = copyByType[notification.type || ""] || copyByType.system;
  return {
    title: hasUrdu(title) ? fallback.title : title,
    body: hasUrdu(body) ? fallback.body : body,
  };
}
