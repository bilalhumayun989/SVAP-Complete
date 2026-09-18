import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiPackage, FiClock, FiCheckCircle, FiMapPin,
  FiTruck, FiXCircle, FiAlertCircle, FiRefreshCw,
} from "react-icons/fi";
import { API_URL } from "../../services/api";
import { supabase } from "../../services/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────
type OrderStatus =
  | "pending"
  | "pending_verification"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "completed"
  | "cancelled";

type RealOrder = {
  id: string;
  swap_request_id: string | null;
  from_user_id: string;
  to_user_id: string;
  delivery_name: string;
  delivery_phone: string;
  delivery_address: string;
  delivery_city: string;
  payment_method: string;
  shipping_cost: number;
  discount: number;
  total: number;
  status: OrderStatus;
  tracking_number: string | null;
  transaction_ref: string | null;
  created_at: string;
};

// ─── Status Config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; color: string; bg: string; icon: React.ReactElement }
> = {
  pending: {
    label: "Pending",
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.12)",
    icon: <FiClock size={13} />,
  },
  pending_verification: {
    label: "Pending Verification",
    color: "#8b5cf6",
    bg: "rgba(139,92,246,0.12)",
    icon: <FiAlertCircle size={13} />,
  },
  confirmed: {
    label: "Confirmed",
    color: "#3b82f6",
    bg: "rgba(59,130,246,0.12)",
    icon: <FiCheckCircle size={13} />,
  },
  shipped: {
    label: "Shipped",
    color: "#E45821",
    bg: "rgba(228,88,33,0.12)",
    icon: <FiTruck size={13} />,
  },
  delivered: {
    label: "Delivered",
    color: "#10b981",
    bg: "rgba(16,185,129,0.12)",
    icon: <FiCheckCircle size={13} />,
  },
  completed: {
    label: "Completed",
    color: "#10b981",
    bg: "rgba(16,185,129,0.12)",
    icon: <FiCheckCircle size={13} />,
  },
  cancelled: {
    label: "Cancelled",
    color: "#ef4444",
    bg: "rgba(239,68,68,0.12)",
    icon: <FiXCircle size={13} />,
  },
};

const getStatusCfg = (s: string) =>
  STATUS_CONFIG[s as OrderStatus] ?? {
    label: s,
    color: "#6b7280",
    bg: "rgba(107,114,128,0.12)",
    icon: <FiPackage size={13} />,
  };

// ─── Status Steps for progress tracker ────────────────────────────────────────
const STATUS_STEPS: OrderStatus[] = [
  "pending_verification",
  "confirmed",
  "shipped",
  "delivered",
];

const stepIndex = (s: string): number =>
  STATUS_STEPS.indexOf(s as OrderStatus);

// ─── Tab Definitions ───────────────────────────────────────────────────────────
const TABS = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Shipped", value: "shipped" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
];

// ─── Main Component ────────────────────────────────────────────────────────────
const OrdersPage = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState("all");
  const [orders, setOrders] = useState<RealOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const userId = (() => {
    try { return JSON.parse(localStorage.getItem("sz_user") || "{}").id; }
    catch { return null; }
  })();

  // ── Fetch orders ─────────────────────────────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/orders?user_id=${userId}`);
      const data = await res.json();
      if (Array.isArray(data)) setOrders(data);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // ── Supabase Realtime subscription ────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`orders-user-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `from_user_id=eq.${userId}`,
        },
        (payload: any) => {
          if (payload.eventType === "UPDATE") {
            setOrders(prev =>
              prev.map(o =>
                o.id === (payload.new as RealOrder).id
                  ? { ...o, ...(payload.new as Partial<RealOrder>) }
                  : o,
              ),
            );
          } else if (payload.eventType === "INSERT") {
            setOrders(prev => [payload.new as RealOrder, ...prev]);
          } else if (payload.eventType === "DELETE") {
            setOrders(prev => prev.filter(o => o.id !== (payload.old as RealOrder).id));
          }
        },
      )
      .subscribe();

    // Also listen for orders where this user is to_user_id
    const channel2 = supabase
      .channel(`orders-to-user-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `to_user_id=eq.${userId}`,
        },
        (payload: any) => {
          setOrders(prev =>
            prev.map(o =>
              o.id === (payload.new as RealOrder).id
                ? { ...o, ...(payload.new as Partial<RealOrder>) }
                : o,
            ),
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(channel2);
    };
  }, [userId]);

  // ── Derived values ────────────────────────────────────────────────────────────
  const pendingCount = orders.filter(o =>
    ["pending", "pending_verification"].includes(o.status)
  ).length;

  const filtered = (() => {
    if (tab === "all") return orders;
    if (tab === "pending") return orders.filter(o => ["pending", "pending_verification"].includes(o.status));
    if (tab === "completed") return orders.filter(o => ["completed", "delivered"].includes(o.status));
    return orders.filter(o => o.status === tab);
  })();

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="op-page">
      <div className="op-container">

        {/* HEADER */}
        <div className="op-header">
          <div className="op-header-top">
            <div>
              <h1 className="op-title">My Orders</h1>
              <p className="op-sub">Track your swaps &amp; deliveries in real time</p>
            </div>
            <button className="op-refresh" onClick={fetchOrders} title="Refresh">
              <FiRefreshCw size={16} />
            </button>
          </div>
        </div>

        {/* STATS ROW */}
        <div className="op-stats">
          <div className="op-stat">
            <FiPackage size={22} className="op-stat-icon total" />
            <div>
              <h2>{orders.length}</h2>
              <p>Total</p>
            </div>
          </div>
          <div className="op-stat">
            <FiAlertCircle size={22} className="op-stat-icon pv" />
            <div>
              <h2>{orders.filter(o => o.status === "pending_verification").length}</h2>
              <p>Verifying</p>
            </div>
          </div>
          <div className="op-stat">
            <FiTruck size={22} className="op-stat-icon shipped" />
            <div>
              <h2>{orders.filter(o => o.status === "shipped").length}</h2>
              <p>Shipped</p>
            </div>
          </div>
          <div className="op-stat">
            <FiCheckCircle size={22} className="op-stat-icon completed" />
            <div>
              <h2>{orders.filter(o => ["completed", "delivered"].includes(o.status)).length}</h2>
              <p>Completed</p>
            </div>
          </div>
        </div>

        {/* TABS */}
        <div className="op-tabs">
          {TABS.map((t) => {
            const count = t.value === "all"
              ? orders.length
              : t.value === "pending"
                ? pendingCount
                : t.value === "completed"
                  ? orders.filter(o => ["completed", "delivered"].includes(o.status)).length
                  : orders.filter(o => o.status === t.value).length;
            return (
              <button
                key={t.value}
                className={`op-tab ${tab === t.value ? "active" : ""}`}
                onClick={() => setTab(t.value)}
              >
                {t.label}
                {count > 0 && <span className="op-tab-count">{count}</span>}
              </button>
            );
          })}
        </div>

        {/* LIST */}
        <div className="op-list">
          {loading ? (
            <div className="op-empty">
              <div className="op-spinner" />
              <p>Loading orders…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="op-empty">
              <FiPackage size={48} style={{ opacity: 0.25 }} />
              <p>No {tab !== "all" ? tab : ""} orders found</p>
              <span>Orders you place will appear here</span>
            </div>
          ) : (
            filtered.map((order) => {
              const cfg = getStatusCfg(order.status);
              const sIdx = stepIndex(order.status);
              const isSwap = !!order.swap_request_id;

              return (
                <div key={order.id} className="op-card">

                  {/* Card Top */}
                  <div className="op-card-top">
                    <div className="op-card-left">
                      <div className="op-card-id">
                        {order.tracking_number
                          ? `#${order.tracking_number}`
                          : `#${order.id.slice(0, 8).toUpperCase()}`}
                        {isSwap && <span className="op-swap-tag">SWAP</span>}
                      </div>
                      <span className="op-date">
                        {new Date(order.created_at).toLocaleDateString("en-PK", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                      </span>
                    </div>
                    <span
                      className="op-badge"
                      style={{
                        background: cfg.bg,
                        color: cfg.color,
                        border: `1px solid ${cfg.color}40`,
                      }}
                    >
                      {cfg.icon}
                      {cfg.label}
                    </span>
                  </div>

                  {/* Progress Stepper — only for swap orders not yet completed/cancelled */}
                  {isSwap && !["completed", "delivered", "cancelled", "pending"].includes(order.status) && (
                    <div className="op-stepper">
                      {STATUS_STEPS.map((step, i) => {
                        const done = i <= sIdx;
                        const current = i === sIdx;
                        const sCfg = STATUS_CONFIG[step];
                        return (
                          <div key={step} className={`op-step ${done ? "done" : ""} ${current ? "current" : ""}`}>
                            <div
                              className="op-step-dot"
                              style={done ? { background: sCfg.color, borderColor: sCfg.color } : undefined}
                            >
                              {done && <FiCheck size={10} />}
                            </div>
                            <span className="op-step-label">{sCfg.label}</span>
                            {i < STATUS_STEPS.length - 1 && (
                              <div className={`op-step-line ${i < sIdx ? "done" : ""}`} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Tracking number pill if shipped */}
                  {order.status === "shipped" && order.tracking_number && (
                    <div className="op-tracking-row">
                      <FiTruck size={14} />
                      <span>Tracking: <strong>{order.tracking_number}</strong></span>
                    </div>
                  )}

                  {/* Card Body */}
                  <div className="op-info-grid">
                    <div className="op-info-item">
                      <FiMapPin size={14} />
                      <div>
                        <span className="op-info-label">Delivery To</span>
                        <span className="op-info-val">{order.delivery_name}</span>
                        <span className="op-info-sub">{order.delivery_address}, {order.delivery_city}</span>
                        <span className="op-info-sub">{order.delivery_phone}</span>
                      </div>
                    </div>

                    <div className="op-info-item">
                      <FiTruck size={14} />
                      <div>
                        <span className="op-info-label">Delivery Cost</span>
                        <span className="op-info-val">PKR {order.shipping_cost?.toLocaleString()}</span>
                        <span className="op-info-sub">{order.payment_method}</span>
                      </div>
                    </div>

                    {order.transaction_ref && (
                      <div className="op-info-item">
                        <FiAlertCircle size={14} />
                        <div>
                          <span className="op-info-label">Transaction Ref</span>
                          <span className="op-info-val op-info-val--mono">{order.transaction_ref}</span>
                        </div>
                      </div>
                    )}

                    <div className="op-info-item op-info-item--total">
                      <div>
                        <span className="op-info-label">Total</span>
                        <span className="op-total-amount">PKR {order.total?.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* View Swap Request link */}
                  {isSwap && (
                    <button
                      className="op-view-swap"
                      onClick={() => navigate("/requests")}
                    >
                      View Swap Request →
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      <style>{`
        /* ─── FiCheck import shim ─── */
        .op-step-dot svg { display:block; }

        .op-page {
          min-height: 100vh;
          background: var(--bg);
          padding: 24px 44px 100px;
          font-family: 'Poppins', sans-serif;
          color: var(--text-dark);
        }
        .op-container { max-width: 1000px; margin: auto; }

        /* Header */
        .op-header { margin-bottom: 28px; }
        .op-header-top { display:flex; justify-content:space-between; align-items:flex-start; }
        .op-title { font-size:clamp(1.6rem,3vw,2.2rem); font-weight:800; margin:0 0 4px; }
        .op-sub { color:var(--text-mid); font-size:0.9rem; margin:0; }
        .op-refresh {
          display:flex; align-items:center; justify-content:center;
          width:38px; height:38px; border-radius:50%;
          background:var(--bg-section); border:1px solid var(--border);
          color:var(--text-mid); cursor:pointer; transition:all 0.2s;
        }
        .op-refresh:hover { color:#E45821; border-color:#E45821; background:rgba(228,88,33,0.06); }

        /* Stats */
        .op-stats {
          display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:24px;
        }
        .op-stat {
          background:var(--card-bg); padding:16px 20px; border-radius:16px;
          display:flex; gap:14px; align-items:center;
          border:1px solid var(--border); box-shadow:0 2px 12px rgba(0,0,0,0.04);
        }
        .op-stat h2 { font-size:1.6rem; margin:0; font-weight:800; color:var(--text-dark); }
        .op-stat p { margin:0; font-size:0.75rem; color:var(--text-mid); }
        .op-stat-icon { flex-shrink:0; }
        .op-stat-icon.total { color:#6366f1; }
        .op-stat-icon.pv    { color:#8b5cf6; }
        .op-stat-icon.shipped { color:#E45821; }
        .op-stat-icon.completed { color:#10b981; }

        /* Tabs */
        .op-tabs { display:flex; gap:8px; margin-bottom:24px; flex-wrap:wrap; }
        .op-tab {
          display:inline-flex; align-items:center; gap:7px;
          padding:8px 16px; border-radius:999px;
          background:var(--bg-section); border:1px solid var(--border);
          color:var(--text-mid); cursor:pointer; font-size:0.82rem;
          font-weight:500; transition:all 0.18s; font-family:inherit;
        }
        .op-tab:hover { border-color:rgba(228,88,33,0.35); color:#E45821; }
        .op-tab.active { background:#E45821; color:#fff; border-color:#E45821; font-weight:700; }
        .op-tab-count {
          background:rgba(255,255,255,0.25); padding:1px 7px;
          border-radius:999px; font-size:0.7rem; font-weight:700;
        }
        .op-tab:not(.active) .op-tab-count { background:var(--border); color:var(--text-mid); }

        /* Card */
        .op-card {
          background:var(--card-bg); border:1px solid var(--border);
          border-radius:20px; padding:22px; margin-bottom:16px;
          box-shadow:0 4px 20px rgba(0,0,0,0.05);
          transition:border-color 0.2s, box-shadow 0.2s;
        }
        .op-card:hover { border-color:rgba(228,88,33,0.28); box-shadow:0 8px 28px rgba(0,0,0,0.08); }
        html[data-theme='dark'] .op-card { background:#1a1a1a; border-color:#2a2a2a; }

        /* Card Top */
        .op-card-top { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:18px; gap:12px; }
        .op-card-left { display:flex; flex-direction:column; gap:4px; }
        .op-card-id {
          display:flex; align-items:center; gap:8px;
          font-size:0.875rem; font-weight:700; color:var(--text-dark);
          letter-spacing:0.02em;
        }
        .op-swap-tag {
          padding:2px 8px; border-radius:6px; font-size:0.62rem; font-weight:800;
          letter-spacing:0.08em; background:rgba(228,88,33,0.1);
          color:#E45821; border:1px solid rgba(228,88,33,0.25);
        }
        .op-date { font-size:0.78rem; color:var(--text-mid); }
        .op-badge {
          display:inline-flex; align-items:center; gap:5px;
          padding:6px 13px; border-radius:999px;
          font-size:0.76rem; font-weight:700; white-space:nowrap;
        }

        /* Progress Stepper */
        .op-stepper {
          display:flex; align-items:flex-start; gap:0;
          margin-bottom:18px; padding:14px 16px;
          background:var(--bg-section); border-radius:12px;
          border:1px solid var(--border); overflow-x:auto;
        }
        html[data-theme='dark'] .op-stepper { background:#111; border-color:#2a2a2a; }
        .op-step {
          display:flex; flex-direction:column; align-items:center; gap:6px;
          flex:1; min-width:70px; position:relative;
        }
        .op-step-dot {
          width:22px; height:22px; border-radius:50%;
          border:2px solid var(--border); background:var(--bg);
          display:flex; align-items:center; justify-content:center;
          font-size:0.7rem; color:#fff; transition:all 0.2s; z-index:1;
          position:relative;
        }
        .op-step.done .op-step-dot { border-color:#10b981; }
        .op-step-label { font-size:0.62rem; font-weight:600; color:var(--text-muted); text-align:center; white-space:nowrap; }
        .op-step.done .op-step-label { color:var(--text-mid); }
        .op-step.current .op-step-label { color:#E45821; font-weight:700; }
        .op-step-line {
          position:absolute; top:11px; left:50%; width:100%;
          height:2px; background:var(--border); z-index:0;
        }
        .op-step-line.done { background:#10b981; }

        /* Tracking Row */
        .op-tracking-row {
          display:flex; align-items:center; gap:8px;
          padding:10px 14px; margin-bottom:14px;
          background:rgba(228,88,33,0.06); border-radius:10px;
          border:1px solid rgba(228,88,33,0.2);
          font-size:0.82rem; color:var(--text-mid);
        }
        .op-tracking-row svg { color:#E45821; flex-shrink:0; }
        .op-tracking-row strong { color:var(--text-dark); }

        /* Info Grid */
        .op-info-grid {
          display:grid; grid-template-columns:1fr 1fr 1fr 1fr;
          gap:18px; padding-top:18px; border-top:1px solid var(--border);
        }
        .op-info-item { display:flex; gap:10px; align-items:flex-start; color:#E45821; }
        .op-info-item > svg { margin-top:3px; flex-shrink:0; }
        .op-info-item > div { display:flex; flex-direction:column; gap:2px; min-width:0; }
        .op-info-label {
          font-size:0.68rem; font-weight:600; color:var(--text-muted);
          text-transform:uppercase; letter-spacing:0.05em;
        }
        .op-info-val { font-size:0.85rem; font-weight:700; color:var(--text-dark); }
        .op-info-val--mono { font-family:monospace; font-size:0.8rem; }
        .op-info-sub { font-size:0.75rem; color:var(--text-mid); word-break:break-word; }
        .op-info-item--total { align-items:flex-end; text-align:right; }
        .op-info-item--total > div { align-items:flex-end; }
        .op-total-amount { font-size:1.15rem; font-weight:800; color:#E45821; }

        /* View Swap Button */
        .op-view-swap {
          margin-top:14px; background:none; border:none;
          color:#E45821; font-size:0.78rem; font-weight:700;
          cursor:pointer; font-family:inherit; padding:0;
          text-decoration:underline; opacity:0.8; transition:opacity 0.15s;
        }
        .op-view-swap:hover { opacity:1; }

        /* Empty / Loading */
        .op-empty {
          text-align:center; padding:72px 0; color:var(--text-mid);
          display:flex; flex-direction:column; align-items:center; gap:12px;
        }
        .op-empty p { font-size:1rem; font-weight:600; margin:0; color:var(--text-dark); }
        .op-empty span { font-size:0.84rem; color:var(--text-mid); }
        .op-spinner {
          width:36px; height:36px;
          border:3px solid var(--border); border-top-color:#E45821;
          border-radius:50%; animation:op-spin 0.8s linear infinite;
        }
        @keyframes op-spin { to { transform:rotate(360deg); } }

        /* Responsive */
        @media (max-width:900px) {
          .op-page { padding:24px 16px 80px; }
          .op-stats { grid-template-columns:1fr 1fr; }
          .op-info-grid { grid-template-columns:1fr 1fr; }
        }
        @media (max-width:600px) {
          .op-stats { grid-template-columns:1fr 1fr; gap:10px; }
          .op-stat { padding:12px 14px; }
          .op-stat h2 { font-size:1.3rem; }
          .op-info-grid { grid-template-columns:1fr; }
          .op-info-item--total { align-items:flex-start; text-align:left; }
          .op-info-item--total > div { align-items:flex-start; }
          .op-stepper { padding:10px 10px; gap:0; }
          .op-step-label { font-size:0.55rem; }
          .op-card { padding:14px; border-radius:14px; }
        }
      `}</style>
    </div>
  );
};

// ─── FiCheck as inline SVG to avoid import issues in style block ───────────────
const FiCheck = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export default OrdersPage;
