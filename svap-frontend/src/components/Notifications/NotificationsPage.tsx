import { useState, useEffect } from "react";
import { FiHeart, FiMessageCircle, FiRepeat, FiShoppingBag, FiBell, FiCheck, FiTag } from "react-icons/fi";
import { supabase } from "../../services/supabase";

type NotifType = "like" | "comment" | "swap" | "order" | "offer" | "system";

interface Notif {
  id: string;
  type: NotifType;
  user?: { name: string; avatar: string };
  message: string;
  time: string;
  read: boolean;
  image?: string;
}

const NOTIFS: Notif[] = [
  { id: "n1", type: "like",    user: { name: "ahmad_tech", avatar: "https://i.pravatar.cc/150?img=11" }, message: "liked your listing <b>iPhone 15 Pro Max</b>", time: "2m ago", read: false, image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=80&q=80" },
  { id: "n2", type: "swap",   user: { name: "sara_fashion", avatar: "https://i.pravatar.cc/150?img=12" }, message: "sent you a swap request for <b>MacBook Air M2</b>", time: "15m ago", read: false, image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=80&q=80" },
  { id: "n3", type: "comment", user: { name: "gaming_pro99", avatar: "https://i.pravatar.cc/150?img=13" }, message: "commented: <i>\"Is it still available?\"</i>", time: "1h ago", read: false, image: "https://images.unsplash.com/photo-1607853202273-797f1c22a38e?w=80&q=80" },
  { id: "n4", type: "order",  user: { name: "buyer_ali", avatar: "https://i.pravatar.cc/150?img=14" }, message: "placed an order for your <b>PS5 Bundle</b>", time: "3h ago", read: true, image: "https://images.unsplash.com/photo-1607853202273-797f1c22a38e?w=80&q=80" },
  { id: "n5", type: "offer",  user: { name: "deals_wala", avatar: "https://i.pravatar.cc/150?img=15" }, message: "made an offer of <b>Rs 60,000</b> on your laptop", time: "5h ago", read: true, image: "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=80&q=80" },
  { id: "n6", type: "system", message: "Your listing <b>Canon EOS R6</b> has been approved and is now live!", time: "1d ago", read: true },
  { id: "n7", type: "like",   user: { name: "photo_lover", avatar: "https://i.pravatar.cc/150?img=16" }, message: "liked your listing <b>Canon Camera Kit</b>", time: "1d ago", read: true, image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=80&q=80" },
  { id: "n8", type: "swap",   user: { name: "exchange_hub", avatar: "https://i.pravatar.cc/150?img=17" }, message: "accepted your swap request for <b>Samsung Galaxy S24</b>", time: "2d ago", read: true, image: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=80&q=80" },
  { id: "n9", type: "system", message: "Flash sale! Electronics up to 30% off today only 🔥", time: "2d ago", read: true },
  { id: "n10", type: "comment", user: { name: "curious_buyer", avatar: "https://i.pravatar.cc/150?img=18" }, message: "commented: <i>\"Can you do home delivery?\"</i>", time: "3d ago", read: true },
];

const iconMap: Record<NotifType, React.ReactNode> = {
  like:    <FiHeart size={14} />,
  comment: <FiMessageCircle size={14} />,
  swap:    <FiRepeat size={14} />,
  order:   <FiShoppingBag size={14} />,
  offer:   <FiTag size={14} />,
  system:  <FiBell size={14} />,
};

const colorMap: Record<NotifType, string> = {
  like:    "#E45821",
  comment: "#6079FF",
  swap:    "#8DC63F",
  order:   "#E45821",
  offer:   "#f59e0b",
  system:  "#8b5cf6",
};

const NotificationsPage = () => {
  const [notifs, setNotifs] = useState(NOTIFS);

  useEffect(() => {
    const fetchNotifs = async () => {
      const rawUser = localStorage.getItem('sz_user');
      const userId = rawUser ? JSON.parse(rawUser).id : null;
      if (!userId) return;

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (data && !error && data.length > 0) {
        setNotifs(data.map((n: any) => ({
          id: n.id,
          type: (n.type as NotifType) || 'system',
          user: n.sender_name ? { name: n.sender_name, avatar: n.sender_avatar || 'https://placehold.co/150' } : undefined,
          message: n.message || '',
          time: n.created_at ? new Date(n.created_at).toLocaleDateString() : 'N/A',
          read: n.is_read || false,
          image: n.image_url || undefined
        })));
      }
    };
    fetchNotifs();
  }, []);

  const unreadCount = notifs.filter((n) => !n.read).length;

  const markAllRead = () => setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
  const markRead = (id: string) => setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));

  return (
    <div className="np-page">
      {/* Header */}
      <div className="np-header">
        <div>
          <h1 className="np-title">Notifications</h1>
          {unreadCount > 0 && <span className="np-badge">{unreadCount} new</span>}
        </div>
        {unreadCount > 0 && (
          <button className="np-mark-all" onClick={markAllRead}>
            <FiCheck size={13} /> Mark all read
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="np-tabs">
        {["All", "Unread", "Swaps", "Orders"].map((tab) => (
          <button key={tab} className={`np-tab ${tab === "All" ? "np-tab--active" : ""}`}>
            {tab}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="np-list">
        {notifs.map((n) => (
          <div
            key={n.id}
            className={`np-item ${!n.read ? "np-item--unread" : ""}`}
            onClick={() => markRead(n.id)}
          >
            {/* Icon badge over avatar or system icon */}
            <div className="np-avatar-wrap">
              {n.user ? (
                <>
                  <img src={n.user.avatar} alt={n.user.name} className="np-avatar" />
                  <div className="np-type-badge" style={{ background: colorMap[n.type] }}>
                    {iconMap[n.type]}
                  </div>
                </>
              ) : (
                <div className="np-system-icon" style={{ background: colorMap[n.type] }}>
                  {iconMap[n.type]}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="np-content">
              <p className="np-msg">
                {n.user && <span className="np-username">{n.user.name} </span>}
                <span dangerouslySetInnerHTML={{ __html: n.message }} />
              </p>
              <span className="np-time">{n.time}</span>
            </div>

            {/* Product thumbnail */}
            {n.image && (
              <img src={n.image} alt="" className="np-product-thumb" />
            )}

            {/* Unread dot */}
            {!n.read && <div className="np-unread-dot" />}
          </div>
        ))}
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
          background: var(--btn-swap);
          color: var(--text-on-orange);
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
          border: 1.5px solid var(--border-light);
          border-radius: 999px;
          padding: 6px 14px;
          font-size: 0.78rem;
          font-weight: 600;
          color: var(--text-muted);
          cursor: pointer;
          font-family: inherit;
          transition: all 0.18s;
        }
        .np-mark-all:hover { border-color: var(--btn-swap); color: var(--btn-swap); }

        .np-tabs {
          display: flex;
          gap: 6px;
          padding: 0 16px 16px;
          overflow-x: auto;
          scrollbar-width: none;
        }
        .np-tabs::-webkit-scrollbar { display: none; }

        .np-tab {
          background: var(--card-bg);
          border: 1.5px solid var(--border-light);
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
        .np-tab:hover { border-color: var(--btn-swap); color: var(--btn-swap); }
        .np-tab--active {
          background: var(--btn-swap);
          border-color: var(--btn-swap);
          color: var(--text-on-orange);
        }

        .np-list {
          display: flex;
          flex-direction: column;
        }

        .np-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 14px 16px;
          background: var(--card-bg);
          border-bottom: 1px solid var(--border-light);
          cursor: pointer;
          transition: background 0.15s;
          position: relative;
        }
        .np-item:hover { background: var(--bg-alt); }
        .np-item--unread { background: rgba(228, 88, 33, 0.08); }
        .np-item--unread:hover { background: rgba(228, 88, 33, 0.12); }

        .np-avatar-wrap {
          position: relative;
          flex-shrink: 0;
        }

        .np-avatar {
          width: 46px;
          height: 46px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid var(--border-light);
        }

        .np-type-badge {
          position: absolute;
          bottom: -2px;
          right: -2px;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          border: 2px solid var(--card-bg);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-on-orange);
        }

        .np-system-icon {
          width: 46px;
          height: 46px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-on-orange);
          font-size: 1.1rem;
        }

        .np-content {
          flex: 1;
          min-width: 0;
        }

        .np-msg {
          font-size: 0.85rem;
          color: var(--text-mid);
          line-height: 1.45;
          margin: 0 0 4px;
        }
        .np-msg b { color: var(--text-dark); font-weight: 700; }
        .np-msg i { color: var(--text-muted); font-style: italic; }

        .np-username {
          font-weight: 700;
          color: var(--text-dark);
        }

        .np-time {
          font-size: 0.72rem;
          color: var(--text-muted);
        }

        .np-product-thumb {
          width: 48px;
          height: 48px;
          border-radius: 8px;
          object-fit: cover;
          flex-shrink: 0;
          border: 1px solid var(--border-light);
        }

        .np-unread-dot {
          position: absolute;
          top: 18px;
          right: 14px;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--btn-swap);
        }
      `}</style>
    </div>
  );
};

export default NotificationsPage;
