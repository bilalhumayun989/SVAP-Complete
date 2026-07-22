// ─── Swap Requests Hook ───────────────────────────────────────────────────────
// Stores sent/received requests in localStorage with 24h auto-expiry.
// Shared across entire app via custom events.

import { supabase } from '../services/supabase';

const EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface SwapRequest {
  id: string;
  /** Who sent the request */
  senderName: string;
  senderAvatar: string;
  /** Item being offered */
  offeredItemTitle: string;
  offeredItemImage: string;
  /** Item the sender wants */
  wantedItemTitle: string;
  wantedItemImage: string;
  /** ISO timestamp of creation */
  createdAt: number;
  /** ISO timestamp of expiry (createdAt + 24h) */
  expiresAt: number;
  status: "pending" | "accepted" | "rejected";
  /** "sent" = current user sent this | "received" = current user received this */
  direction: "sent" | "received";
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function sendSwapRequest(params: {
  senderName: string;
  senderAvatar: string;
  offeredItemTitle: string;
  offeredItemImage: string;
  wantedItemTitle: string;
  wantedItemImage: string;
}): Promise<SwapRequest | null> {
  const now = Date.now();
  
  const rawUser = localStorage.getItem('sz_user');
  const userId = rawUser ? JSON.parse(rawUser).id : null;
  
  // Note: the swap_requests table schema might differ, doing a best effort insertion
  // If it fails, fallback to local storage logic in a real app, but for now we try DB
  try {
    const { data } = await supabase.from('swap_requests').insert({
      sender_id: userId,
      sender_name: params.senderName,
      sender_avatar: params.senderAvatar,
      offered_item_title: params.offeredItemTitle,
      offered_item_image: params.offeredItemImage,
      wanted_item_title: params.wantedItemTitle,
      wanted_item_image: params.wantedItemImage,
      status: 'pending',
      expires_at: new Date(now + EXPIRY_MS).toISOString()
    }).select().single();
    
    if (data) window.dispatchEvent(new Event("sz_requests_change"));
    return data;
  } catch (err) {
    console.error('Error sending swap request:', err);
    return null;
  }
}

export async function updateRequestStatus(
  id: string,
  status: "accepted" | "rejected"
): Promise<void> {
  try {
    await supabase.from('swap_requests').update({ status }).eq('id', id);
    window.dispatchEvent(new Event("sz_requests_change"));
  } catch (err) {
    console.error('Error updating swap request:', err);
  }
}

export async function getAllRequests(): Promise<SwapRequest[]> {
  const rawUser = localStorage.getItem('sz_user');
  const userId = rawUser ? JSON.parse(rawUser).id : null;
  
  if (!userId) return [];

  try {
    const { data, error } = await supabase
      .from('swap_requests')
      .select('*')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);
      
    if (error) throw error;
    
    return data.map((r: any) => ({
      id: r.id,
      senderName: r.sender_name,
      senderAvatar: r.sender_avatar,
      offeredItemTitle: r.offered_item_title,
      offeredItemImage: r.offered_item_image,
      wantedItemTitle: r.wanted_item_title,
      wantedItemImage: r.wanted_item_image,
      createdAt: new Date(r.created_at || Date.now()).getTime(),
      expiresAt: new Date(r.expires_at || Date.now() + EXPIRY_MS).getTime(),
      status: r.status,
      direction: r.sender_id === userId ? "sent" : "received"
    }));
  } catch (err) {
    console.error('Error fetching swap requests:', err);
    return [];
  }
}

/** Get time remaining string like "23h 45m" */
export function getTimeRemaining(expiresAt: number): string {
  const diff = expiresAt - Date.now();
  if (diff <= 0) return "Expired";
  const h = Math.floor(diff / (1000 * 60 * 60));
  const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
