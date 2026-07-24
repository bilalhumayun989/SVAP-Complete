import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FiCheck, FiX, FiInbox, FiSend, FiRepeat } from "react-icons/fi";
import {
  getAllRequests,
  updateRequestStatus,
  getTimeRemaining,
  type SwapRequest,
} from "../../hooks/useSwapRequests";
import { useNotifications } from "../../context/NotificationContext";
import { api } from "../../services/api";

type Tab = "received" | "sent";

const getDisplayName = (profile?: { username: string | null }) =>
  profile?.username || "Deleted User";

const Requests = () => {
  const navigate = useNavigate();
  const { refreshCount } = useNotifications();
  const [tab, setTab] = useState<Tab>("received");
  const [requests, setRequests] = useState<SwapRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  const userId = (() => {
    try { return JSON.parse(localStorage.getItem("sz_user") || "{}").id; } catch { return null; }
  })();

  const refresh = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    const data = await getAllRequests(userId);
    setRequests(data);
    setLoading(false);
  }, [userId]);

  // Mark swap request notifications as read when page loads
  useEffect(() => {
    const markSwapNotificationsRead = async () => {
      if (!userId) return;
      try {
        // Get all notifications
        const res = await api.getNotifications(userId);
        if (res.data) {
          // Find unread swap notifications
          const unreadSwapNotifs = res.data.filter(
            (n: any) => !n.is_read && n.type?.includes('swap')
          );
          // Mark each as read
          await Promise.all(
            unreadSwapNotifs.map((n: any) => api.markNotificationRead(n.id))
          );
          // Refresh count
          refreshCount();
        }
      } catch (err) {
        console.error('Failed to mark notifications as read:', err);
      }
    };
    markSwapNotificationsRead();
  }, [userId, refreshCount]);

  useEffect(() => {
    refresh();
    window.addEventListener("sz_requests_change", refresh);
    return () => window.removeEventListener("sz_requests_change", refresh);
  }, [refresh]);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => { refresh(); }, [tick, refresh]);

  const received = requests.filter(r => r.direction === "received");
  const sent = requests.filter(r => r.direction === "sent");
  const active = tab === "received" ? received : sent;

  const handleAction = async (id: string, action: "accepted" | "rejected") => {
    if (action === "rejected") {
      await updateRequestStatus(id, "rejected", userId || undefined);
      refresh();
    } else {
      // Immediately mark as accepted in DB (notification auto-triggers in backend)
      await updateRequestStatus(id, "accepted", userId || undefined);
      refresh();
      // Then navigate to checkout — user can always come back later
      navigate("/checkout", { state: { entrySource: "swap", swapRequestId: id } });
    }
  };

  const pendingReceivedCount = received.filter(r => r.status === "pending").length;

  return (
    <div className="req-page">
      <div className="req-bg" />
      <div className="req-container">

        <div className="req-header">
          <div className="req-header-icon"><FiRepeat size={22} /></div>
          <div>
            <h1 className="req-title">Swap Requests</h1>
            <p className="req-subtitle">
              {pendingReceivedCount > 0
                ? `${pendingReceivedCount} pending request${pendingReceivedCount > 1 ? "s" : ""}`
                : "No pending requests"}
            </p>
          </div>
        </div>

        <div className="req-tabs">
          <button
            className={`req-tab ${tab === "received" ? "req-tab--active" : ""}`}
            onClick={() => setTab("received")}
          >
            <FiInbox size={15} />
            Received
            {pendingReceivedCount > 0 && (
              <span className="req-tab-badge">{pendingReceivedCount}</span>
            )}
          </button>
          <button
            className={`req-tab ${tab === "sent" ? "req-tab--active" : ""}`}
            onClick={() => setTab("sent")}
          >
            <FiSend size={15} />
            Sent
            {sent.filter(r => r.status === "pending").length > 0 && (
              <span className="req-tab-badge req-tab-badge--blue">
                {sent.filter(r => r.status === "pending").length}
              </span>
            )}
          </button>
        </div>

        <div className="req-list">
          {loading ? (
            <div className="req-empty"><p>Loading...</p></div>
          ) : active.length === 0 ? (
            <div className="req-empty">
              {tab === "received" ? (
                <>
                  <FiInbox size={36} />
                  <p>No swap requests received yet</p>
                  <span>When someone sends you a swap request, it will appear here</span>
                </>
              ) : (
                <>
                  <FiSend size={36} />
                  <p>You haven't sent any swap requests yet</p>
                  <span>Browse listings and tap "Send Swap Request"</span>
                  <button className="req-browse-btn" onClick={() => navigate("/")}>
                    Browse Listings
                  </button>
                </>
              )}
            </div>
          ) : (
            active.map(req => {
              const isExpired = new Date(req.expires_at).getTime() <= Date.now();
              const timeLeft = getTimeRemaining(req.expires_at);
              const isPending = req.status === "pending" && !isExpired;

              return (
                <div
                  key={req.id}
                  className={`req-card ${
                    req.status === 'accepted' ? 'req-card--accepted' :
                    req.status === 'rejected' || (isExpired && req.status === 'pending') ? 'req-card--rejected' :
                    !isPending ? 'req-card--resolved' : ''
                  } ${isExpired && req.status === "pending" ? "req-card--expired" : ""}`}
                >
                  <div className="req-card-top">
                    <div className={`req-expires ${isExpired ? "req-expires--red" : ""}`}>
                      <img src="/ICONS/Time.png" alt="Time" style={{ width: 12, height: 12, objectFit: 'contain', marginRight: 6 }} />
                      <span>{isExpired ? "Expired" : `Expires in ${timeLeft}`}</span>
                    </div>
                    {(req.status !== "pending" || isExpired) && (
                      <span className={`req-status-badge req-status-badge--${isExpired && req.status === "pending" ? "expired" : req.status}`}>
                        {isExpired && req.status === "pending" ? "Expired" : req.status === "accepted" ? "Accepted" : req.status === "completed" ? "Completed" : "Rejected"}
                      </span>
                    )}
                  </div>

                  <div className="req-swap-row">
                    <div className="req-item">
                      <div className="req-item-img-wrap">
                        <img
                          src={
                            req.direction === "received"
                              ? req.from_profile?.avatar_url || `https://ui-avatars.com/api/?name=${getDisplayName(req.from_profile)}&background=random`
                              : req.offered?.image_urls?.[0] || "https://placehold.co/80"
                          }
                          alt=""
                          className="req-item-img"
                        />
                      </div>
                      <div className="req-item-info">
                        <span className="req-item-label">
                          {req.direction === "received" ? "Their Offer" : "You Offered"}
                        </span>
                        <span className="req-item-name">
                          {req.direction === "received" 
                            ? getDisplayName(req.from_profile)
                            : req.offered?.title || "Unknown"}
                        </span>
                        {req.direction === "received" && (
                          <span className="req-item-sub">{req.offered?.title || ""}</span>
                        )}
                      </div>
                    </div>

                    <div className="req-swap-arrow">
                      <FiRepeat size={16} />
                    </div>

                    <div className="req-item req-item--right">
                      <div className="req-item-img-wrap">
                        <img
                          src={req.requested?.image_urls?.[0] || "https://placehold.co/80"}
                          alt=""
                          className="req-item-img"
                        />
                      </div>
                      <div className="req-item-info req-item-info--right">
                        <span className="req-item-label">
                          {req.direction === "received" ? "Your Item" : "Requested"}
                        </span>
                        <span className="req-item-name">{req.requested?.title || "Unknown"}</span>
                        {req.direction === "sent" && (
                          <span className="req-item-sub">@{getDisplayName(req.to_profile)}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {tab === "received" && isPending && (
                    <div className="req-actions">
                      <button
                        className="req-btn req-btn--reject"
                        onClick={() => handleAction(req.id, "rejected")}
                      >
                        <FiX size={14} />
                        <span>REJECT</span>
                      </button>
                      <button
                        className="req-btn req-btn--accept"
                        onClick={() => handleAction(req.id, "accepted")}
                      >
                        <FiCheck size={14} />
                        <span>ACCEPT &amp; CHECKOUT</span>
                      </button>
                    </div>
                  )}

                  {/* Already accepted — show continue to checkout */}
                  {tab === "received" && req.status === "accepted" && !isExpired && (
                    <div className="req-actions">
                      <button
                        className="req-btn req-btn--checkout"
                        onClick={() => navigate("/checkout", { state: { entrySource: "swap", swapRequestId: req.id } })}
                      >
                        <FiCheck size={14} />
                        <span>CONTINUE TO CHECKOUT</span>
                      </button>
                    </div>
                  )}

                  {tab === "sent" && isPending && (
                    <div className="req-pending-label">
                      <img src="/ICONS/Time.png" alt="Time" style={{ width: 12, height: 12, objectFit: 'contain', marginRight: 6 }} /> Waiting for response…
                    </div>
                  )}

                  {/* Sent request accepted — sender can also checkout */}
                  {tab === "sent" && req.status === "accepted" && !isExpired && (
                    <div className="req-actions">
                      <button
                        className="req-btn req-btn--checkout"
                        onClick={() => navigate("/checkout", { state: { entrySource: "swap", swapRequestId: req.id } })}
                      >
                        <FiCheck size={14} />
                        <span>PROCEED TO CHECKOUT</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      <style>{`
        .req-page { min-height:100vh; padding:28px 20px 80px; position:relative; background:var(--bg); box-sizing:border-box; font-family:'Poppins',sans-serif; }
        html[data-theme='dark'] .req-page { background:#0a0a0a; }
        .req-bg { position:fixed; inset:0; background:linear-gradient(180deg,rgba(247,255,235,1) 0%,rgba(239,248,220,1) 100%); z-index:0; pointer-events:none; }
        html[data-theme='dark'] .req-bg { background:#0a0a0a; }
        .req-container { position:relative; z-index:1; max-width:780px; margin:0 auto; }
        .req-header { display:flex; align-items:center; gap:16px; margin-bottom:28px; }
        .req-header-icon { width:48px; height:48px; border-radius:14px; background:rgba(228,88,33,0.1); border:1px solid rgba(228,88,33,0.2); color:#E45821; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .req-title { font-size:clamp(1.4rem,2.5vw,1.9rem); font-weight:800; color:var(--text-dark); margin:0 0 2px; letter-spacing:-0.02em; }
        .req-subtitle { font-size:0.83rem; color:var(--text-muted); margin:0; }
        .req-tabs { display:flex; gap:8px; margin-bottom:20px; border-bottom:1px solid rgba(165,194,111,0.2); padding-bottom:0; }
        .req-tab { display:flex; align-items:center; gap:7px; padding:10px 18px 12px; font-size:0.85rem; font-weight:600; color:var(--text-muted); background:none; border:none; border-bottom:2.5px solid transparent; cursor:pointer; transition:color 0.18s,border-color 0.18s; font-family:inherit; position:relative; top:1px; }
        .req-tab:hover { color:var(--text-dark); }
        .req-tab--active { color:#E45821; border-bottom-color:#E45821; font-weight:700; }
        .req-tab-badge { background:#E45821; color:#fff; font-size:0.62rem; font-weight:800; padding:2px 7px; border-radius:999px; min-width:18px; text-align:center; }
        .req-tab-badge--blue { background:#313C5C; }
        .req-list { display:flex; flex-direction:column; gap:14px; }
        .req-card { background:var(--card-bg); border:1px solid rgba(165,194,111,0.28); border-radius:20px; padding:22px; transition:transform 0.2s,box-shadow 0.2s,opacity 0.3s; box-shadow:0 12px 36px rgba(94,126,52,0.07); }
        .req-card:hover { transform:translateY(-2px); box-shadow:0 18px 48px rgba(94,126,52,0.10); }
        .req-card--resolved { opacity:0.75; }
        .req-card--accepted { opacity:1; }
        .req-card--rejected { opacity:0.55; }
        .req-card--expired { border-color:rgba(248,113,113,0.22); opacity:0.55; }
        html[data-theme='dark'] .req-card { background:#1a1a1a; border-color:#2a2a2a; }
        .req-card-top { display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; }
        .req-expires { display:flex; align-items:center; gap:5px; font-size:0.75rem; color:var(--text-muted); }
        .req-expires--red { color:#f87171; }
        .req-status-badge { font-size:0.7rem; font-weight:700; letter-spacing:0.06em; padding:3px 12px; border-radius:999px; }
        .req-status-badge--accepted,.req-status-badge--completed { background:rgba(174,220,90,0.15); color:var(--svap-lime); border:1px solid rgba(174,220,90,0.35); }
        .req-status-badge--rejected { background:rgba(248,113,113,0.12); color:#c04444; border:1px solid rgba(248,113,113,0.25); }
        .req-status-badge--expired { background:rgba(100,100,100,0.1); color:var(--text-muted); border:1px solid rgba(100,100,100,0.2); }
        .req-swap-row { display:flex; align-items:center; gap:12px; margin-bottom:16px; flex-wrap:wrap; }
        .req-item { flex:1; display:flex; align-items:center; gap:12px; min-width:0; }
        .req-item--right { flex-direction:row-reverse; }
        .req-item-img-wrap { width:64px; height:64px; border-radius:14px; overflow:hidden; background:var(--bg-section); border:1px solid rgba(165,194,111,0.26); flex-shrink:0; }
        .req-item-img { width:100%; height:100%; object-fit:cover; }
        .req-item-info { flex:1; min-width:0; }
        .req-item-info--right { text-align:right; }
        .req-item-label { display:block; font-size:0.65rem; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:var(--text-muted); margin-bottom:3px; }
        .req-item-name { display:block; font-size:0.88rem; font-weight:700; color:var(--text-dark); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .req-item-sub { display:block; font-size:0.72rem; color:var(--text-muted); margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .req-swap-arrow { display:flex; align-items:center; justify-content:center; width:34px; height:34px; background:var(--bg-section); border:1px solid rgba(165,194,111,0.28); border-radius:50%; color:#E45821; flex-shrink:0; }
        .req-actions { display:grid; grid-template-columns:1fr 1.8fr; gap:12px; }
        .req-btn { display:flex; align-items:center; justify-content:center; gap:7px; padding:11px 16px; border-radius:12px; font-size:0.76rem; font-weight:700; letter-spacing:0.05em; cursor:pointer; transition:background 0.2s,color 0.2s; font-family:inherit; }
        .req-btn--reject { border:1px solid rgba(192,71,71,0.22); color:#fff; background:#E45821; }
        .req-btn--reject:hover { background:#c94d1c; }
        .req-btn--accept { background:var(--btn-cart); border:1px solid rgba(0,0,0,0.2); color:#fff; }
        .req-btn--accept:hover { filter:brightness(0.95); }
        .req-btn--checkout { background:#313C5C; border:1px solid rgba(49,60,92,0.3); color:#fff; grid-column:1/-1; }
        .req-btn--checkout:hover { background:#252e48; }
        .req-pending-label { display:flex; align-items:center; gap:6px; font-size:0.76rem; color:var(--text-muted); font-style:italic; }
        .req-empty { text-align:center; padding:52px 24px; color:var(--text-muted); background:var(--bg-section); border-radius:20px; border:1px solid rgba(165,194,111,0.2); display:flex; flex-direction:column; align-items:center; gap:10px; }
        .req-empty p { font-size:1rem; font-weight:700; color:var(--text-dark); margin:0; }
        .req-empty span { font-size:0.84rem; max-width:320px; }
        .req-browse-btn { margin-top:10px; padding:10px 24px; background:#E45821; color:#fff; border:none; border-radius:10px; font-size:0.84rem; font-weight:700; cursor:pointer; transition:background 0.2s; font-family:inherit; }
        .req-browse-btn:hover { background:#c94d1c; }
        html[data-theme='dark'] .req-item-img-wrap { border-color:#2a2a2a; background:#111; }
        html[data-theme='dark'] .req-item-name { color:#fff; }
        html[data-theme='dark'] .req-item-sub { color:#666; }
        html[data-theme='dark'] .req-swap-arrow { background:#111; border-color:#2a2a2a; }
        html[data-theme='dark'] .req-empty { background:#111; border-color:#222; }
        @media (max-width:600px) { .req-page{padding:90px 14px 60px;} .req-card{padding:18px 16px;} .req-item-img-wrap{width:52px;height:52px;} .req-item-name{font-size:0.82rem;} .req-actions{grid-template-columns:1fr;} .req-tab{padding:8px 12px 10px;font-size:0.8rem;} }
      `}</style>
    </div>
  );
};

export default Requests;
