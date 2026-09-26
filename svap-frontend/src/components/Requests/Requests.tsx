import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiSend,
  FiRepeat,
  FiCreditCard,
  FiClock,
  FiArrowLeft,
  FiBell,
  FiShoppingBag,
} from "react-icons/fi";
import {
  getAllRequests,
  updateRequestStatus,
  getTimeRemaining,
  type SwapRequest,
} from "../../hooks/useSwapRequests";
import { useNotifications } from "../../context/NotificationContext";
import { api } from "../../services/api";

type Tab = "incoming" | "outgoing" | "checkout";

type CheckoutOrder = {
  id?: string;
  swap_request_id: string | null;
  from_user_id: string;
  status: string;
  is_checkout_pending?: boolean;
};

const getDisplayName = (profile?: { username: string | null }) =>
  profile?.username || "Deleted User";

const Requests = () => {
  const navigate = useNavigate();
  const { refreshCount } = useNotifications();
  const [tab, setTab] = useState<Tab>("incoming");
  const [requests, setRequests] = useState<SwapRequest[]>([]);
  const [checkoutOrders, setCheckoutOrders] = useState<CheckoutOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  const userId = (() => {
    try {
      return JSON.parse(localStorage.getItem("sz_user") || "{}").id;
    } catch {
      return null;
    }
  })();

  if (!userId) return null;

  const refresh = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    const [data, ordersResponse] = await Promise.all([
      getAllRequests(userId),
      api.getOrders(userId),
    ]);
    setRequests(data);
    setCheckoutOrders(
      Array.isArray(ordersResponse)
        ? ordersResponse.filter(
          (order: CheckoutOrder) => order.swap_request_id
        )
        : []
    );
    setLoading(false);
  }, [userId]);

  // Mark swap request notifications as read when page loads
  useEffect(() => {
    const markSwapNotificationsRead = async () => {
      if (!userId) return;
      try {
        const res = await api.getNotifications(userId);
        if (res.data) {
          const unreadSwapNotifs = res.data.filter(
            (n: any) => !n.is_read && n.type?.includes("swap")
          );
          await Promise.all(
            unreadSwapNotifs.map((n: any) => api.markNotificationRead(n.id))
          );
          refreshCount();
        }
      } catch (err) {
        console.error("Failed to mark notifications as read:", err);
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
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    refresh();
  }, [tick, refresh]);

  const checkoutRequestIds = new Set(
    checkoutOrders
      .filter(
        (order) =>
          order.from_user_id === userId &&
          !order.is_checkout_pending &&
          !String(order.id || '').startsWith('checkout-')
      )
      .map((order) => order.swap_request_id)
      .filter((id): id is string => Boolean(id))
  );
  
  console.log('[Requests Debug] userId:', userId);
  console.log('[Requests Debug] All checkoutOrders:', checkoutOrders);
  console.log('[Requests Debug] Filtered checkoutOrders (from_user_id === userId):', 
    checkoutOrders.filter((order) => order.from_user_id === userId)
  );
  console.log('[Requests Debug] checkoutRequestIds Set:', Array.from(checkoutRequestIds));
  console.log('[Requests Debug] All requests:', requests);
  
  const isCheckoutRequest = (request: SwapRequest) => {
    // The other participant's order is also proof that this swap entered
    // checkout, even if the request status was not refreshed/persisted yet.
    const hasRelatedOrder = checkoutOrders.some(
      (order) => order.swap_request_id === request.id
    );
    const hasUserOrder = checkoutRequestIds.has(request.id);
    const isAccepted = request.status === "accepted";
    const isCompleted = request.status === "completed";

    return hasRelatedOrder || hasUserOrder || isAccepted || isCompleted;
  };
  const incoming = requests.filter(
    (r) => r.direction === "received" && !isCheckoutRequest(r) && r.status !== "completed"
  );
  const outgoing = requests.filter(
    (r) => r.direction === "sent" && !isCheckoutRequest(r) && r.status !== "completed"
  );
  const currentUserCheckoutOrders = checkoutOrders.filter(
    (order) => order.from_user_id === userId
  );
  const checkoutOrderByRequest = new Map(
    currentUserCheckoutOrders
      .filter((order: any) => !order.is_checkout_pending && !String(order.id).startsWith('checkout-'))
      .map((order) => [order.swap_request_id, order])
  );
  const checkout = requests.filter((request) => {
    const hasOwnOrder = checkoutRequestIds.has(request.id);
    const hasOtherParticipantOrder = checkoutOrders.some(
      (order) =>
        order.swap_request_id === request.id &&
        order.from_user_id !== userId &&
        !order.is_checkout_pending &&
        !String(order.id || '').startsWith('checkout-')
    );
    const bothParticipantsCheckedOut = hasOwnOrder && hasOtherParticipantOrder;

    // A stale "completed" status must not hide checkout from a participant
    // who has not placed their own order yet.
    return isCheckoutRequest(request) && !bothParticipantsCheckedOut;
  });
  const active =
    tab === "incoming" ? incoming : tab === "outgoing" ? outgoing : checkout;

  const handleAction = async (id: string, action: "accepted" | "rejected") => {
    if (action === "rejected") {
      await updateRequestStatus(id, "rejected", userId || undefined);
      refresh();
    } else {
      await updateRequestStatus(id, "accepted", userId || undefined);
      refresh();
      // Acceptance unlocks checkout for both parties, including cash-only offers.
      navigate(`/checkout/${id}`);
    }
  };

  const pendingIncomingCount = incoming.filter(
    (r) => r.status === "pending"
  ).length;
  const pendingOutgoingCount = outgoing.filter(
    (r) => r.status === "pending"
  ).length;

  return (
    <div className="req-page">
      <div className="req-bg" />
      <div className="req-container">
        {/* TOP HEADER WITH BACK AND NOTIFICATION */}
        <div className="req-header">
          <button className="req-nav-btn" onClick={() => navigate(-1)}>
            <FiArrowLeft size={18} />
          </button>
          <h1 className="req-title">Requests</h1>
          <button
            className="req-nav-btn"
            onClick={() => navigate("/notifications")}
          >
            <FiBell size={18} />
          </button>
        </div>

        {/* TABS */}
        <div className="req-tabs">
          <button
            className={`req-tab ${tab === "incoming" ? "req-tab--active" : ""
              }`}
            onClick={() => setTab("incoming")}
          >
            Incoming
            {pendingIncomingCount > 0 && (
              <span className="req-tab-badge">{pendingIncomingCount}</span>
            )}
          </button>
          <button
            className={`req-tab ${tab === "outgoing" ? "req-tab--active" : ""
              }`}
            onClick={() => setTab("outgoing")}
          >
            Outgoing
            {pendingOutgoingCount > 0 && (
              <span className="req-tab-badge req-tab-badge--blue">
                {pendingOutgoingCount}
              </span>
            )}
          </button>
          <button
            className={`req-tab ${tab === "checkout" ? "req-tab--active" : ""
              }`}
            onClick={() => setTab("checkout")}
          >
            Checkout
            {checkout.length > 0 && (
              <span className="req-tab-badge req-tab-badge--checkout">
                {checkout.length}
              </span>
            )}
          </button>
        </div>

        {/* CONTENT AREA */}
        <div className="req-list">
          {loading ? (
            <div className="req-empty">
              <p>Loading...</p>
            </div>
          ) : active.length === 0 ? (
            <div className="req-empty">
              {tab === "incoming" ? (
                <>
                  <div className="req-empty-circle">
                    <FiShoppingBag size={28} />
                  </div>
                  <p>No incoming swaps</p>
                  <span>
                    When someone sends you a swap request, it will appear here
                  </span>
                </>
              ) : tab === "outgoing" ? (
                <>
                  <div className="req-empty-circle">
                    <FiSend size={28} />
                  </div>
                  <p>No outgoing swaps</p>
                  <span>Browse Items and send svap offers</span>
                </>
              ) : (
                <>
                  <div className="req-empty-circle">
                    <FiCreditCard size={28} />
                  </div>
                  <p>No checkout records yet</p>
                  <span>
                    Svap checkouts will appear here after an order is placed
                  </span>
                </>
              )}
            </div>
          ) : (
            active.map((req) => {
              const isExpired =
                new Date(req.expires_at).getTime() <= Date.now();
              const timeLeft = getTimeRemaining(req.expires_at);
              const isPending = req.status === "pending" && !isExpired;
              const targetProfile =
                req.direction === "received"
                  ? req.from_profile
                  : req.to_profile;
              const displayUserName = getDisplayName(targetProfile);
              const avatarLetter = displayUserName.charAt(0).toUpperCase();

              return (
                <div key={req.id} className="req-card">
                  {/* USER HEADER */}
                  <div className="req-user-header">
                    <div className="req-user-left">
                      <div className="req-user-avatar">{avatarLetter}</div>
                      <span className="req-user-handle">
                        @{displayUserName}
                      </span>
                    </div>
                    <button
                      className="req-visit-store"
                      onClick={() =>
                        navigate(`/profile/${targetProfile?.username || ""}`)
                      }
                    >
                      <FiShoppingBag size={13} /> Visit Store &gt;
                    </button>
                  </div>

                  {/* ITEMS SWAP SECTION */}
                  <div className="req-swap-row">
                    {/* LEFT ITEM */}
                    {((req as any).is_cash_only || !req.offered_product_id) ? (
                      <div className="req-item req-cash-box">
                        
                        <div className="req-item-info">
                          <span className="req-item-label">Cash Offer</span>
                          <span className="req-cash-amount">
                            PKR {Number((req as any).cash_amount || (req as any).premium_amount || 0).toLocaleString()}
                          </span>
                          <span className="req-cash-sub">Direct cash</span>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="req-item"
                        onClick={() =>
                          navigate(`/product/${req.offered_product_id}`)
                        }
                      >
                        <img
                          src={
                            req.offered?.image_urls?.[0] ||
                            "https://placehold.co/80"
                          }
                          alt=""
                          className="req-item-img"
                        />
                        <div className="req-item-info">
                          <span className="req-item-label">
                            {req.direction === "received"
                              ? "Their Offer"
                              : "You Offered"}
                          </span>
                          <span className="req-item-name">
                            {req.offered?.title || "Unknown"}
                          </span>
                          <span className="req-item-link">View details</span>
                        </div>
                      </div>
                    )}

                    {/* SWAP ICON */}
                    <div className="req-swap-arrow">
                      <FiRepeat size={14} />
                    </div>

                    {/* RIGHT ITEM */}
                    <div
                      className="req-item"
                      onClick={() =>
                        navigate(`/product/${req.requested_product_id}`)
                      }
                    >
                      <img
                        src={
                          req.requested?.image_urls?.[0] ||
                          "https://placehold.co/80"
                        }
                        alt=""
                        className="req-item-img"
                      />
                      <div className="req-item-info">
                        <span className="req-item-label">
                          {req.direction === "received"
                            ? "Your Item"
                            : "Requested"}
                        </span>
                        <span className="req-item-name">
                          {req.requested?.title || "Unknown"}
                        </span>
                        <span className="req-item-link">View details</span>
                      </div>
                    </div>
                  </div>

                  {/* CASH TOP-UP SWEETEN DEAL BADGE */}
                  {(req as any).top_up_amount > 0 && (
                    <div className="req-sweeten-box">
                      <span className="req-sweeten-icon">🌐</span>
                      <span>
                        They're adding PKR {(req as any).top_up_amount} cash to
                        sweeten the deal
                      </span>
                    </div>
                  )}

                  {/* TIMER BOX WITH PROGRESS BAR */}
                  <div
                    className={`req-timer-box ${isExpired ? "req-timer-box--expired" : ""
                      }`}
                  >
                    <div className="req-timer-content">
                      <div className="req-timer-left">
                        <FiClock size={14} />
                        <span>
                          {tab === "checkout"
                            ? "Complete checkout before time runs out"
                            : "Accept before time runs out"}
                        </span>
                      </div>
                      <span className="req-timer-time">
                        {isExpired ? "00:00:00" : timeLeft}
                      </span>
                    </div>
                    <div className="req-progress-bar">
                      <div
                        className="req-progress-fill"
                        style={{
                          width: isExpired
                            ? "0%"
                            : (() => {
                                const created = new Date(req.created_at).getTime();
                                const expires = new Date(req.expires_at).getTime();
                                const now = Date.now();
                                if (now <= created) return "100%";
                                const total = expires - created;
                                const remaining = expires - now;
                                const pct = Math.max(0, Math.min(100, (remaining / total) * 100));
                                return `${pct}%`;
                              })(),
                        }}
                      />
                    </div>
                  </div>

                  {/* ACTION BUTTONS */}
                  {tab === "incoming" && isPending && (
                    <div className="req-actions">
                      <button
                        className="req-btn req-btn--reject"
                        onClick={() => handleAction(req.id, "rejected")}
                      >
                        REJECT
                      </button>
                      <button
                        className="req-btn req-btn--accept"
                        onClick={() => handleAction(req.id, "accepted")}
                      >
                        ACCEPT & CHECKOUT
                      </button>
                    </div>
                  )}

                  {tab === "outgoing" && isPending && (
                    <div className="req-pending-label">
                       Waiting for user response…
                    </div>
                  )}

                  {tab === "checkout" && (
                    <button
                      className={`req-btn ${
                        checkoutOrderByRequest.has(req.id)
                          ? "req-btn--order-placed"
                          : "req-btn--accept"
                      }`}
                      onClick={() =>
                        checkoutOrderByRequest.has(req.id)
                          ? navigate("/orders")
                          : navigate(`/checkout/${req.id}`)
                      }
                    >
                      {checkoutOrderByRequest.has(req.id)
                        ? "⏳ Order placed · Waiting for other user"
                        : "PROCEED TO CHECKOUT"}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      <style>{`
        .req-page {
          min-height: 100vh;
          padding: 12px 16px 80px;
          margin: 0;
          background: var(--page-bg);
          color: var(--text-dark);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          box-sizing: border-box;
          transition: background 0.3s ease, color 0.3s ease;
        }
        .req-bg {
          position: fixed;
          inset: 0;
          background: var(--page-bg);
          z-index: 0;
          transition: background 0.3s ease;
        }
        .req-container {
          position: relative;
          z-index: 1;
          max-width: 520px;
          margin: 0 auto;
          padding-top: 0;
        }

        /* HEADER (TOP POSITIONED) */
        .req-header {
          position: static;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 0px;
          padding-bottom: 12px;
          margin-bottom: 14px;
          background: var(--page-bg);
          transition: background 0.3s ease;
        }
        .req-title {
          font-size: 1.3rem;
          font-weight: 800;
          margin: 0;
          color: var(--text-dark);
          letter-spacing: -0.01em;
        }
        .req-nav-btn {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: var(--card-bg);
          border: 1px solid var(--border-light);
          color: var(--text-dark);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.2s, border-color 0.2s;
        }

        /* TABS */
        .req-tabs {
          position: static;
          display: flex;
          align-items: center;
          border-bottom: 1px solid var(--border-light);
          margin-bottom: 16px;
          background: var(--page-bg);
          padding-bottom: 4px;
          transition: background 0.3s ease;
        }
        .req-tab {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 8px 0 10px;
          background: transparent;
          border: none;
          border-bottom: 2px solid transparent;
          color: var(--text-muted);
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: color 0.2s, border-color 0.2s;
        }
        .req-tab--active {
          color: var(--btn-swap);
          border-bottom-color: var(--btn-swap);
        }
        .req-tab-badge {
          background: var(--btn-swap);
          color: var(--text-on-orange);
          font-size: 0.65rem;
          padding: 2px 6px;
          border-radius: 10px;
          font-weight: 700;
        }

        /* LIST & CARDS */
        .req-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .req-card {
          background: var(--card-bg);
          border: 1px solid var(--border-light);
          border-radius: 18px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
          transition: background 0.3s ease, border-color 0.3s ease;
        }

        /* USER HEADER INSIDE CARD */
        .req-user-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .req-user-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .req-user-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--btn-swap);
          color: var(--text-on-orange);
          font-weight: 700;
          font-size: 0.85rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .req-user-handle {
          font-size: 0.9rem;
          font-weight: 700;
          color: var(--text-dark);
        }
        .req-visit-store {
          background: transparent;
          border: none;
          color: var(--btn-swap);
          font-size: 0.75rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 4px;
          cursor: pointer;
        }

        /* SWAP ITEMS ROW */
        .req-swap-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .req-item {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
          cursor: pointer;
        }
        .req-item-img {
          width: 52px;
          height: 52px;
          border-radius: 10px;
          object-fit: cover;
          background: var(--page-bg);
          border: 1px solid var(--border-light);
        }
        .req-item-info {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        .req-item-label {
          font-size: 0.7rem;
          color: var(--text-muted);
        }
        .req-item-name {
          font-size: 0.82rem;
          font-weight: 700;
          color: var(--text-dark);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .req-item-link {
          font-size: 0.7rem;
          color: var(--btn-swap);
          margin-top: 2px;
        }
        .req-swap-arrow {
          color: var(--btn-swap);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* CASH OFFER BOX */
        .req-cash-box {
          background: rgba(34, 197, 94, 0.08);
          border: 1px solid rgba(34, 197, 94, 0.2);
          border-radius: 12px;
          padding: 8px 10px;
        }
        .req-cash-icon {
          width: 42px;
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          text-align: center;
          font-size: 0.72rem;
          font-weight: 800;
          color: #22c55e;
          border: 1px solid rgba(34, 197, 94, 0.35);
          border-radius: 10px;
        }
        .req-cash-amount {
          color: #22c55e;
          font-weight: 700;
          font-size: 0.85rem;
        }
        .req-cash-sub {
          font-size: 0.68rem;
          color: var(--text-muted);
        }

        /* SWEETEN DEAL BOX */
        .req-sweeten-box {
          background: rgba(34, 197, 94, 0.06);
          border: 1px solid rgba(34, 197, 94, 0.25);
          border-radius: 12px;
          padding: 10px 12px;
          font-size: 0.75rem;
          color: #22c55e;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        /* TIMER & PROGRESS */
        .req-timer-box {
          background: rgba(34, 197, 94, 0.05);
          border: 1px solid rgba(34, 197, 94, 0.3);
          border-radius: 12px;
          padding: 10px 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .req-timer-box--expired {
          background: rgba(239, 68, 68, 0.05);
          border-color: rgba(239, 68, 68, 0.3);
        }
        .req-timer-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.75rem;
          color: #22c55e;
        }
        .req-timer-left {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .req-timer-time {
          font-weight: 700;
        }
        .req-progress-bar {
          height: 4px;
          background: var(--border-light);
          border-radius: 4px;
          overflow: hidden;
        }
        .req-progress-fill {
          height: 100%;
          background: #22c55e;
          border-radius: 4px;
        }

        /* ACTION BUTTONS */
       .req-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.req-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem; /* 12px */
  font-weight: 700;
  letter-spacing: 0.05em;
  padding: 12px 20px;
  border-radius: 9999px; /* Pill Shape */
  border: none;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  outline: none;
  text-transform: uppercase;
}

/* REJECT Button (Exact Orange matching screenshot) */
.req-btn--reject {
  background-color: #E55B32;
  color: #ffffff;
}

.req-btn--reject:hover {
  background-color: #d04d26;
  transform: translateY(-1px);
}

.req-btn--reject:active {
  transform: translateY(0);
}

/* ACCEPT & CHECKOUT Button (Dark Slate Navy matching screenshot) */
.req-btn--accept {
  flex: 1;
  background-color: #2C354A;
  color: #ffffff;
}

.req-btn--accept:hover {
  background-color: #38435d;
  transform: translateY(-1px);
}

.req-btn--accept:active {
  transform: translateY(0);
}

/* Light Theme Adaptivity (Agar Light theme mein colors change karne hon) */
html:not([data-theme="dark"]) .req-btn--accept {
  background-color: #1e293b; /* Slightly darker slate for crisp light mode contrast */
  color: #ffffff;
}

        /* EMPTY STATE */
        .req-empty {
          text-align: center;
          padding: 60px 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }
        .req-empty-circle {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: var(--card-bg);
          border: 1px solid var(--border-light);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
          margin-bottom: 8px;
        }
        .req-empty p {
          font-size: 1.05rem;
          font-weight: 700;
          margin: 0;
          color: var(--text-dark);
        }
        .req-empty span {
          font-size: 0.8rem;
          color: var(--text-muted);
        }

        @media (max-width: 600px) {
          .req-page {
            padding: 10px 12px 80px;
          }
          .req-header {
            padding-top: 0px;
            margin-top: 0;
            margin-bottom: 10px;
          }
          .req-tabs {
            margin-bottom: 14px;
          }
        }
      `}</style>
    </div>
  );
};

export default Requests;