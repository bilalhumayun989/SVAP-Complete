type NotificationLike = {
  type?: string | null;
  title?: string | null;
  body?: string | null;
};

const containsUrduScript = (value: string) => /[\u0600-\u06FF\u0750-\u077F]/.test(value);
const romanUrduHints = /\b(aapki|apki|aapka|apka|aapke|apke|hai|hain|ho gaya|ho gayi|kar di|kardi|mil gaya|bhej di|wapas|raha hai|rhi hai|nahi|nahin|karein|karen)\b/i;

const copyByType: Record<string, { title: string; body: string }> = {
  svap_request: { title: "New Swap Request", body: "You received a new swap request." },
  swap_request: { title: "New Swap Request", body: "You received a new swap request." },
  svap_accepted: { title: "Swap Request Accepted", body: "Your swap request was accepted." },
  swap_accepted: { title: "Swap Request Accepted", body: "Your swap request was accepted." },
  svap_rejected: { title: "Request Rejected", body: "Your swap request was rejected." },
  swap_rejected: { title: "Request Rejected", body: "Your swap request was rejected." },
  swap_cancelled: { title: "Swap Cancelled", body: "This swap has been cancelled." },
  svap_unavailable: { title: "Product Unavailable", body: "This product is no longer available for swapping." },
  swap_unavailable: { title: "Product Unavailable", body: "This product is no longer available for swapping." },
  swap_partner_checkout_completed: {
    title: "Swap Partner Checked Out",
    body: "Your swap partner has completed checkout. Complete your own checkout to continue.",
  },
  swap_timeout: { title: "Swap Cancelled - Timeout", body: "Your swap was cancelled because checkout was not completed within 48 hours." },
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
