import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FiRepeat, FiShoppingBag, FiBell, FiCheck } from "react-icons/fi";
import { api } from "../../services/api";
import { useNotifications } from "../../context/NotificationContext";

type NotifType = "swap_request" | "swap_accepted" | "swap_rejected" | "order_update" | "system" | string;

interface Notif {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  route?: string;
  is_read: boolean;
  created_at: string;
}

const iconMap = (type: NotifType) => {
  if (type === "swap_request" || type === "swap_accepted" || type === "swap_rejected")
    return <FiRepeat size={16} />;
  if (type === "order_update") return <FiShoppingBag size={16} />;
  return <FiBell size={16} />;
};

const colorMap = (type: NotifType) => {
  if (type === "swap_request") return "#8DC63F";
  if (type === "swap_accepted") return "#22c55e";
  if (type === "swap_rejected") return "#ef4444";
  if (type === "order_update") return "#E45821";
  return "#8b5cf6";
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

type FilterTab = "all" | "unread" | "swaps" | "orders";

const NotificationsPage = () => {
  const navigate = useNavigate();
  const { refreshCount } = useNotifications();
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  const userId = (() => {
    try { return JSON.parse(localStorage.getItem("sz_user") || "{}").id; } catch { return null; }
  })();

  const fetchNotifs = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    const res = await api.getNotifications(userId);
    if (res.data) setNotifs(res.data);
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetchNotifs(); }, [fetchNotifs]);

  const unreadCount = notifs.filter(n => !n.is_read).length;

  const filtered = notifs.filter(n => {
    if (activeTab === "unread") return !n.is_read;
    if (activeTab === "swaps") return n.type.startsWith("swap");
    if (activeTab === "orders") return n.type === "order_update";
    return true;
  });

  const handleClick = async (n: Notif) => {
    if (!n.is_read) {
      await api.markNotificationRead(n.id);
      setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, is_read: true } : x));
      refreshCount();
    }
    navigate("/requests");
  };

  const handleMarkAllRead = async () => {
    if (!userId) return;
    await api.markAllNotificationsRead(userId);
    setNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
    refreshCount();
  };

  return (
    <div className="np-page">
      {/* Header */}
      <div className="np-header">
        <div>
          <h1 className="np-title">Notifications</h1>
          {unreadCount > 0 && <span className="np-badge">{unreadCount} new</span>}
        </div>
        {unreadCount > 0 && (
          <button className="np-mark-all" onClick={handleMarkAllRead}>
            <FiCheck size={13} /> Mark all read
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="np-tabs">
        {(["all", "unread", "orders", "orders"] as FilterTab[]).map(tab => (
          <button
            key={tab}
            className={`np-tab ${activeTab === tab ? "np-tab--active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {tab === "unread" && unreadCount > 0 && (
              <span className="np-tab-count">{unreadCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="np-list">
        {loading ? (
          <div className="np-empty">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="np-empty">
            <FiBell size={32} style={{ opacity: 0.3 }} />
            <p>No notifications yet</p>
          </div>
        ) : (
          filtered.map(n => (
            <div
              key={n.id}
              className={`np-item ${!n.is_read ? "np-item--unread" : ""}`}
              onClick={() => handleClick(n)}
            >
              <div className="np-icon-wrap" style={{ background: colorMap(n.type) }}>
                {iconMap(n.type)}
              </div>

              <div className="np-content">
                <p className="np-title-text">{n.title}</p>
                <p className="np-body">{n.body}</p>
                <span className="np-time">{timeAgo(n.created_at)}</span>
              </div>

              {!n.is_read && <div className="np-dot" />}
            </div>
          ))
        )}
      </div>

      <style>{`
        .np-page {
          min-height: 100vh;
          background: var(--bg);
          padding: 20px 0 80px;
          font-family: 'Poppins', sans-serif;
        }
        .np-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px 16px;
        }
        .np-title {
          font-size: 1.4rem;
          font-weight: 800;
          color: var(--text-dark);
          margin: 0 0 4px;
          letter-spacing: -0.02em;
        }
        .np-badge {
          display: inline-block;
          background: #E45821;
          color: #fff;
          font-size: 0.7rem;
          font-weight: 700;
          padding: 2px 10px;
          border-radius: 999px;
        }
        .np-mark-all {
          display: flex;
          align-items: center;
          gap: 5px;
          background: none;
          border: 1.5px solid rgba(165,194,111,0.3);
          border-radius: 999px;
          padding: 6px 14px;
          font-size: 0.78rem;
          font-weight: 600;
          color: var(--text-muted);
          cursor: pointer;
          font-family: inherit;
          transition: all 0.18s;
        }
        .np-mark-all:hover { border-color: #E45821; color: #E45821; }
        .np-tabs {
          display: flex;
          gap: 6px;
          padding: 0 16px 16px;
          overflow-x: auto;
          scrollbar-width: none;
        }
        .np-tabs::-webkit-scrollbar { display: none; }
        .np-tab {
          display: flex;
          align-items: center;
          gap: 5px;
          background: var(--card-bg);
          border: 1.5px solid rgba(165,194,111,0.2);
          border-radius: 999px;
          padding: 7px 18px;
          font-size: 0.82rem;
          font-weight: 600;
          color: var(--text-mid);
          cursor: pointer;
          font-family: inherit;
          white-space: nowrap;
          transition: all 0.18s;
        }
        .np-tab:hover { border-color: #E45821; color: #E45821; }
        .np-tab--active { background: #E45821; border-color: #E45821; color: #fff; }
        html[data-theme='dark'] .np-tab { background: #1a1a1a; border-color: #2a2a2a; color: #aaa; }
        html[data-theme='dark'] .np-tab--active { background: #E45821; border-color: #E45821; color: #fff; }
        .np-tab-count {
          background: rgba(255,255,255,0.3);
          font-size: 0.65rem;
          font-weight: 800;
          padding: 1px 6px;
          border-radius: 999px;
          min-width: 16px;
          text-align: center;
        }
        .np-tab--active .np-tab-count { background: rgba(255,255,255,0.35); }
        .np-list { display: flex; flex-direction: column; }
        .np-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 14px 16px;
          border-bottom: 1px solid rgba(165,194,111,0.15);
          cursor: pointer;
          transition: background 0.15s;
          position: relative;
        }
        .np-item:hover { background: rgba(228,88,33,0.04); }
        .np-item--unread { background: rgba(228,88,33,0.07); }
        .np-item--unread:hover { background: rgba(228,88,33,0.11); }
        html[data-theme='dark'] .np-item { border-bottom-color: #1a1a1a; }
        html[data-theme='dark'] .np-item--unread { background: rgba(228,88,33,0.1); }
        .np-icon-wrap {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          flex-shrink: 0;
        }
        .np-content { flex: 1; min-width: 0; }
        .np-title-text {
          font-size: 0.88rem;
          font-weight: 700;
          color: var(--text-dark);
          margin: 0 0 3px;
        }
        html[data-theme='dark'] .np-title-text { color: #fff; }
        .np-body {
          font-size: 0.8rem;
          color: var(--text-muted);
          line-height: 1.45;
          margin: 0 0 4px;
        }
        html[data-theme='dark'] .np-body { color: #888; }
        .np-time { font-size: 0.7rem; color: var(--text-muted); }
        .np-dot {
          position: absolute;
          top: 50%;
          right: 14px;
          transform: translateY(-50%);
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #E45821;
          flex-shrink: 0;
        }
        .np-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          padding: 60px 20px;
          color: var(--text-muted);
          font-size: 0.85rem;
        }
        .np-empty p { margin: 0; font-weight: 600; font-size: 0.9rem; color: var(--text-dark); }
        html[data-theme='dark'] .np-empty p { color: #fff; }
      `}</style>
    </div>
  );
};

export default NotificationsPage;
