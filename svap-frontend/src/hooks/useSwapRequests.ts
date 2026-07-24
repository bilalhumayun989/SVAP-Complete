import { api } from '../services/api';

export interface SwapRequest {
  id: string;
  from_user_id: string;
  to_user_id: string;
  offered_product_id: string;
  requested_product_id: string;
  status: "pending" | "accepted" | "rejected" | "completed";
  expires_at: string;
  created_at: string;
  // Joined data
  offered?: { title: string; image_urls: string[] };
  requested?: { title: string; image_urls: string[] };
  from_profile?: { username: string | null; avatar_url: string | null };
  to_profile?: { username: string | null; avatar_url: string | null };
  // UI helpers
  direction?: "sent" | "received";
}

export async function sendSwapRequest(params: {
  from_user_id: string;
  to_user_id: string;
  offered_product_id: string;
  requested_product_id: string;
}): Promise<SwapRequest | null> {
  try {
    const res = await api.createSwapRequest(params);
    if (res.error) throw new Error(res.error);
    window.dispatchEvent(new Event("sz_requests_change"));
    return res.data;
  } catch (err) {
    console.error('[sendSwapRequest]', err);
    return null;
  }
}

export async function updateRequestStatus(
  id: string,
  status: "accepted" | "rejected",
  updated_by?: string
): Promise<void> {
  try {
    const res = await api.updateSwapRequestStatus(id, status, updated_by);
    if (res.error) throw new Error(res.error);
    window.dispatchEvent(new Event("sz_requests_change"));
  } catch (err) {
    console.error('[updateRequestStatus]', err);
  }
}

export async function getAllRequests(userId: string): Promise<SwapRequest[]> {
  if (!userId) return [];
  try {
    const res = await api.getSwapRequestsByUser(userId);
    if (res.error) throw new Error(res.error);
    return (res.data || []).map((r: SwapRequest) => ({
      ...r,
      direction: r.from_user_id === userId ? "sent" : "received",
    }));
  } catch (err) {
    console.error('[getAllRequests]', err);
    return [];
  }
}

export function getTimeRemaining(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const h = Math.floor(diff / (1000 * 60 * 60));
  const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
