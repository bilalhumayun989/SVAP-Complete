import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiPackage, FiClock, FiCheckCircle, FiMapPin, FiCreditCard, FiTruck } from "react-icons/fi";

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
  status: string;
  tracking_number: string;
  created_at: string;
};

const TABS = [
  { label: "All Orders", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Completed", value: "completed" },
];

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const OrdersPage = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState("all");
  const [orders, setOrders] = useState<RealOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      const rawUser = localStorage.getItem("sz_user");
      const userId = rawUser ? JSON.parse(rawUser).id : null;
      if (!userId) { setLoading(false); return; }

      try {
        const res = await fetch(`${API_URL}/orders?user_id=${userId}`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setOrders(data);
        }
      } catch (err) {
        console.error("Failed to fetch orders:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const filtered = tab === "all" ? orders : orders.filter((o) => o.status === tab);
  const pendingCount = orders.filter((o) => o.status === "pending").length;
  const completedCount = orders.filter((o) => ["completed", "delivered"].includes(o.status)).length;

  const getStatusColor = (status: string) => {
    if (status === "pending") return "#f59e0b";
    if (status === "completed" || status === "delivered") return "#10b981";
    if (status === "cancelled") return "#ef4444";
    return "#6b7280";
  };

  const getStatusIcon = (status: string) => {
    if (status === "pending") return <FiClock size={13} />;
    if (status === "completed" || status === "delivered") return <FiCheckCircle size={13} />;
    return <FiPackage size={13} />;
  };

  return (
    <div className="op-page">
      <div className="op-container">

        {/* HEADER */}
        <div className="op-header">
          <button className="op-back" onClick={() => navigate(-1)}>
            <FiArrowLeft size={18} /> Back
          </button>
          <h1 className="op-title">My Orders</h1>
          <p className="op-sub">Track your swaps & deliveries</p>
        </div>

        {/* STATS */}
        <div className="op-stats">
          <div className="op-stat">
            <FiPackage size={24} className="op-stat-icon total" />
            <div>
              <h2>{orders.length}</h2>
              <p>Total Orders</p>
            </div>
          </div>
          <div className="op-stat">
            <FiClock size={24} className="op-stat-icon pending" />
            <div>
              <h2>{pendingCount}</h2>
              <p>Pending</p>
            </div>
          </div>
          <div className="op-stat">
            <FiCheckCircle size={24} className="op-stat-icon completed" />
            <div>
              <h2>{completedCount}</h2>
              <p>Completed</p>
            </div>
          </div>
        </div>

        {/* TABS */}
        <div className="op-tabs">
          {TABS.map((t) => (
            <button
              key={t.value}
              className={`op-tab ${tab === t.value ? "active" : ""}`}
              onClick={() => setTab(t.value)}
            >
              {t.label}
              {t.value !== "all" && (
                <span className="op-tab-count">
                  {t.value === "pending" ? pendingCount : completedCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* LIST */}
        <div className="op-list">
          {loading ? (
            <div className="op-empty">
              <div className="op-spinner" />
              <p>Loading orders...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="op-empty">
              <FiPackage size={52} />
              <p>No {tab !== "all" ? tab : ""} orders found</p>
              <span>Orders you place will appear here</span>
            </div>
          ) : (
            filtered.map((order) => (
              <div key={order.id} className="op-card">
                {/* Card Top */}
                <div className="op-card-top">
                  <div className="op-card-left">
                    <span className="op-tracking">{order.tracking_number || `#${order.id.slice(0, 8).toUpperCase()}`}</span>
                    <span className="op-date">
                      {new Date(order.created_at).toLocaleDateString("en-PK", {
                        day: "numeric", month: "short", year: "numeric"
                      })}
                    </span>
                  </div>
                  <span
                    className="op-badge"
                    style={{
                      background: `${getStatusColor(order.status)}20`,
                      color: getStatusColor(order.status),
                      border: `1px solid ${getStatusColor(order.status)}40`,
                    }}
                  >
                    {getStatusIcon(order.status)}
                    {order.status === "delivered" ? "completed" : order.status}
                  </span>
                </div>

                {/* Card Body - Info Grid */}
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
                      {order.discount > 0 && (
                        <span className="op-info-sub">Discount: PKR {order.discount}</span>
                      )}
                    </div>
                  </div>

                  <div className="op-info-item">
                    <FiCreditCard size={14} />
                    <div>
                      <span className="op-info-label">Payment</span>
                      <span className="op-info-val">{order.payment_method}</span>
                    </div>
                  </div>

                  <div className="op-info-item total-col">
                    <div>
                      <span className="op-info-label">Total Amount</span>
                      <span className="op-total-amount">PKR {order.total?.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <style>{`
        .op-page {
          min-height: 100vh;
          background: var(--bg);
          padding: 24px 44px 80px;
          font-family: 'Poppins', sans-serif;
          color: var(--text-dark);
        }

        .op-container {
          max-width: 1000px;
          margin: auto;
        }

        .op-header {
          margin-bottom: 32px;
        }

        .op-back {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: none;
          border: 1px solid var(--border);
          color: var(--text-mid);
          cursor: pointer;
          font-size: 0.9rem;
          padding: 8px 14px;
          border-radius: 8px;
          margin-bottom: 16px;
          transition: all 0.2s;
        }
        .op-back:hover { background: var(--bg-section); color: #E45821; border-color: #E45821; }

        .op-title {
          font-size: clamp(1.8rem, 3.5vw, 2.5rem);
          font-weight: 800;
          margin: 8px 0 4px;
          color: var(--text-dark);
        }

        .op-sub { color: var(--text-mid); font-size: 0.95rem; margin: 0; }

        /* STATS */
        .op-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 28px;
        }

        .op-stat {
          background: var(--card-bg, #fff);
          padding: 20px 24px;
          border-radius: 16px;
          display: flex;
          gap: 16px;
          align-items: center;
          border: 1px solid var(--border);
          box-shadow: 0 4px 16px rgba(0,0,0,0.05);
        }

        .op-stat h2 { font-size: 1.8rem; margin: 0; font-weight: 800; color: var(--text-dark); }
        .op-stat p { margin: 0; font-size: 0.8rem; color: var(--text-mid); }

        .op-stat-icon { flex-shrink: 0; }
        .op-stat-icon.total { color: #6366f1; }
        .op-stat-icon.pending { color: #f59e0b; }
        .op-stat-icon.completed { color: #10b981; }

        /* TABS */
        .op-tabs {
          display: flex;
          gap: 10px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }

        .op-tab {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border-radius: 999px;
          background: var(--bg-section);
          border: 1px solid var(--border);
          color: var(--text-mid);
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 500;
          transition: all 0.2s;
        }

        .op-tab:hover { background: rgba(228,88,33,0.08); border-color: rgba(228,88,33,0.3); color: #E45821; }

        .op-tab.active {
          background: #E45821;
          color: #fff;
          border-color: #E45821;
          font-weight: 700;
        }

        .op-tab-count {
          background: rgba(255,255,255,0.2);
          padding: 2px 7px;
          border-radius: 999px;
          font-size: 0.75rem;
          font-weight: 700;
        }

        .op-tab:not(.active) .op-tab-count {
          background: var(--border);
          color: var(--text-mid);
        }

        /* CARD */
        .op-card {
          background: var(--card-bg, #fff);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 24px;
          margin-bottom: 16px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.05);
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .op-card:hover {
          border-color: rgba(228,88,33,0.3);
          box-shadow: 0 8px 30px rgba(0,0,0,0.09);
        }

        .op-card-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
          gap: 12px;
        }

        .op-card-left {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .op-tracking {
          font-size: 0.875rem;
          font-weight: 700;
          color: var(--text-dark);
          letter-spacing: 0.02em;
        }

        .op-date {
          font-size: 0.8rem;
          color: var(--text-mid);
        }

        .op-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 6px 12px;
          border-radius: 999px;
          font-size: 0.78rem;
          font-weight: 700;
          text-transform: capitalize;
          white-space: nowrap;
        }

        /* INFO GRID */
        .op-info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr 1fr;
          gap: 20px;
          padding-top: 20px;
          border-top: 1px solid var(--border);
        }

        .op-info-item {
          display: flex;
          gap: 10px;
          align-items: flex-start;
          color: #E45821;
        }

        .op-info-item > svg { margin-top: 3px; flex-shrink: 0; }

        .op-info-item > div {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }

        .op-info-label {
          font-size: 0.72rem;
          font-weight: 600;
          color: var(--text-mid);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .op-info-val {
          font-size: 0.875rem;
          font-weight: 700;
          color: var(--text-dark);
        }

        .op-info-sub {
          font-size: 0.78rem;
          color: var(--text-mid);
        }

        .total-col {
          align-items: flex-end;
          text-align: right;
        }

        .total-col > div { align-items: flex-end; }

        .op-total-amount {
          font-size: 1.2rem;
          font-weight: 800;
          color: #E45821;
        }

        /* EMPTY / LOADING */
        .op-empty {
          text-align: center;
          padding: 80px 0;
          color: var(--text-mid);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }

        .op-empty svg { opacity: 0.3; }
        .op-empty p { font-size: 1.1rem; font-weight: 600; margin: 0; color: var(--text-dark); }
        .op-empty span { font-size: 0.85rem; color: var(--text-mid); }

        .op-spinner {
          width: 36px; height: 36px;
          border: 3px solid var(--border);
          border-top-color: #E45821;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        /* DARK MODE */
        html[data-theme='dark'] .op-card { background: #1a1a1a; border-color: #2a2a2a; }
        html[data-theme='dark'] .op-stat { background: #1a1a1a; border-color: #2a2a2a; }
        html[data-theme='dark'] .op-card:hover { border-color: rgba(228,88,33,0.4); }

        /* RESPONSIVE */
        @media (max-width: 768px) {
          .op-page { padding: 80px 16px 60px; }
          .op-stats { grid-template-columns: 1fr; }
          .op-info-grid { grid-template-columns: 1fr 1fr; }
          .total-col { align-items: flex-start; text-align: left; }
          .total-col > div { align-items: flex-start; }
        }

        @media (max-width: 500px) {
          .op-info-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
};

export default OrdersPage;