import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiCheck,
  FiX,
  FiPackage,
} from "react-icons/fi";

import { ORDERS as MOCK_ORDERS, type OrderStatus } from "./Order";
import { supabase } from "../../services/supabase";

const TABS: { label: string; value: OrderStatus| "all" }[] = [
  { label: "All Orders", value: "all" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
];

const OrdersPage = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"all" | OrderStatus>("all");
  const [orders, setOrders] = useState(MOCK_ORDERS);

  useEffect(() => {
    const fetchOrders = async () => {
      const rawUser = localStorage.getItem('sz_user');
      const userId = rawUser ? JSON.parse(rawUser).id : null;
      if (!userId) return;

      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', userId);
        
      if (data && !error && data.length > 0) {
        setOrders(data.map((o: any) => ({
          id: o.id,
          itemName: o.item_name || 'Item',
          itemImage: o.item_image || 'https://placehold.co/200',
          swappedWith: o.swapped_with || 'Swapped Item',
          swappedImage: o.swapped_image || 'https://placehold.co/200',
          status: o.status as OrderStatus,
          date: o.created_at ? new Date(o.created_at).toLocaleDateString() : 'N/A',
          location: o.location || 'Unknown'
        })));
      }
    };
    fetchOrders();
  }, []);

  const filtered =
    tab === "all" ? orders : orders.filter((o) => o.status === tab);

  const completedCount = orders.filter((o) => o.status === "completed").length;
  const cancelledCount = orders.filter((o) => o.status === "cancelled").length;

  return (
    <div className="op-page">
      <div className="op-container">

        {/* HEADER */}
        <div className="op-header">
          <button className="op-back" onClick={() => navigate(-1)}>
            <FiArrowLeft size={18} /> Back
          </button>

          <h1 className="op-title">My Orders</h1>
          <p className="op-sub">Track your swaps & transactions</p>
        </div>

        {/* STATS */}
        <div className="op-stats">
          <div className="op-stat">
            <img src="/ICONS/Products.png" alt="Products" style={{ width: 22, height: 22, objectFit: 'contain' }} />
            <div>
              <h2>{orders.length}</h2>
              <p>Total</p>
            </div>
          </div>

          <div className="op-stat">
            <FiCheck size={22} />
            <div>
              <h2>{completedCount}</h2>
              <p>Completed</p>
            </div>
          </div>

          <div className="op-stat">
            <FiX size={22} />
            <div>
              <h2>{cancelledCount}</h2>
              <p>Cancelled</p>
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
            </button>
          ))}
        </div>

        {/* LIST */}
        <div className="op-list">
          {filtered.length === 0 ? (
            <div className="op-empty">
              <FiPackage size={50} />
              <p>No orders found</p>
            </div>
          ) : (
            filtered.map((order) => (
              <div key={order.id} className={`op-card ${order.status}`}>

                {/* TOP */}
                <div className="op-card-top">
                  <span className="op-id">{order.id}</span>
                  <span className="op-date">
                    {order.date}
                  </span>

                  <span className={`op-badge ${order.status}`}>
                    {order.status}
                  </span>
                </div>

                {/* BODY */}
                <div className="op-swap">

                  <div className="op-item">
                    <img src={order.itemImage} />
                    <div>
                      <h4>Your Item</h4>
                      <p>{order.itemName}</p>
                      <span>{order.location}</span>
                    </div>
                  </div>

                  {/* <div className="op-arrow">→</div> */}

                  <div className="op-item right">
                    <img src={order.swappedImage} />
                    <div>
                      <h4>Received</h4>
                      <p>{order.swappedWith}</p>
                    </div>
                  </div>

                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* STYLE */}
      <style>{`
        .op-page {
          min-height: 100vh;
          background: var(--bg);
          padding: 24px 44px 60px;
          color: var(--text-dark);
        }

        html[data-theme='dark'] .op-page {
          background: #0a0a0a;
        }

        html[data-theme='dark'] .op-stat {
          background: #1a1a1a;
          border-color: #2a2a2a;
          box-shadow: 0 18px 40px rgba(0, 0, 0, 0.3);
        }

        html[data-theme='dark'] .op-stat h2 {
          color: #fff;
        }

        html[data-theme='dark'] .op-stat p {
          color: #999;
        }

        html[data-theme='dark'] .op-tab {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #999;
        }

        html[data-theme='dark'] .op-tab:hover {
          background: rgba(255, 255, 255, 0.12);
        }

        html[data-theme='dark'] .op-tab.active {
          background: #E45821;
          color: #fff;
          border-color: rgba(228, 88, 33, 0.5);
        }

        html[data-theme='dark'] .op-card {
          background: #1a1a1a;
          border-color: #2a2a2a;
          box-shadow: 0 22px 60px rgba(0, 0, 0, 0.3);
        }

        html[data-theme='dark'] .op-card:hover {
          border-color: rgba(228, 88, 33, 0.4);
        }

        html[data-theme='dark'] .op-id,
        html[data-theme='dark'] .op-date {
          color: #fff;
        }

        html[data-theme='dark'] .op-item h4 {
          color: #999;
        }

        html[data-theme='dark'] .op-item p,
        html[data-theme='dark'] .op-item span {
          color: #fff;
        }

        html[data-theme='dark'] .op-badge.cancelled {
          background: rgba(255, 102, 102, 0.18);
          color: #ff9d9d;
        }

        html[data-theme='dark'] .op-empty {
          color: #999;
        }

        .op-container {
          max-width: 1800px;
          margin: auto;
        }

        /* HEADER */
        .op-title {
          font-size: clamp(2rem, 4vw, 2.8rem);
          font-weight: 800;
          margin: 10px 0 6px;
          color: var(--text-dark);
        }

        .op-sub {
          opacity: 0.72;
          font-size: 1rem;
          color: var(--text-mid);
        }

        .op-back {
          display: flex;
          gap: 8px;
          align-items: center;
          background: none;
          border: none;
          color: var(--text-mid);
          cursor: pointer;
          font-size: 0.95rem;
        }

        /* STATS */
        .op-stats {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 18px;
          margin: 30px 0;
        }

        .op-stat {
          background: #fff;
          padding: 24px;
          border-radius: 20px;
          display: flex;
          gap: 18px;
          align-items: center;
          border: 1px solid rgba(0, 0, 0, 0.1);
          box-shadow: 0 18px 40px rgba(0, 0, 0, 0.06);
        }

        .op-stat h2 {
          font-size: 1.8rem;
          margin: 0;
          color: var(--text-dark);
        }

        .op-stat p {
          margin: 0;
          opacity: 0.85;
          color: var(--text-secondary);
        }

        .op-stat svg {
          color: #E45821;
          min-width: 28px;
          min-height: 28px;
        }

        /* TABS */
        .op-tabs {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 24px;
        }

        .op-tab {
          padding: 12px 20px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid rgba(0, 0, 0, 0.1);
          color: var(--text-secondary);
          cursor: pointer;
          transition: transform 0.2s, background 0.2s, color 0.2s;
        }

        .op-tab:hover {
          transform: translateY(-1px);
          background: rgba(228, 88, 33, 0.08);
        }

        .op-tab.active {
          background: #E45821;
          color: #fff;
          border-color: rgba(228, 88, 33, 0.3);
        }

        /* CARD */
        .op-card {
          background: rgba(255, 255, 255, 0.95);
          padding: 28px;
          border-radius: 24px;
          margin-bottom: 18px;
          border: 1px solid rgba(0, 0, 0, 0.08);
          box-shadow: 0 22px 60px rgba(0, 0, 0, 0.06);
          transition: border-color 0.2s;
        }

        .op-card:hover {
          border-color: rgba(228, 88, 33, 0.35);
        }

        .op-card-top {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 22px;
          color: var(--text-secondary);
        }

        .op-id,
        .op-date {
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--text-dark);
        }

        .op-badge {
          padding: 6px 12px;
          border-radius: 999px;
          text-transform: capitalize;
          font-size: 0.78rem;
          font-weight: 700;
          color: #ffffff;
        }

        .op-badge.completed {
          background: #000;
        }

        .op-badge.cancelled {
          background: rgba(255, 102, 102, 0.16);
          color: #8f1c1c;
        }

        .op-swap {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
        }

        .op-item {
          display: flex;
          gap: 18px;
          align-items: center;
          min-width: 0;
        }

        .op-item img {
          width: 100px;
          height: 100px;
          border-radius: 18px;
          object-fit: cover;
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.06);
        }

        .op-item h4 {
          margin: 0 0 6px;
          font-size: 0.95rem;
          color: var(--text-secondary);
        }

        .op-item p,
        .op-item span {
          margin: 0;
          color: var(--text-dark);
        }

        .op-empty {
          text-align: center;
          padding: 80px 0;
          color: var(--text-secondary);
        }

        .op-empty svg {
          opacity: 0.5;
          margin-bottom: 18px;
        }

        @media (max-width: 1080px) {
          .op-container {
            max-width: 1000px;
          }

          .op-swap {
            flex-direction: column;
            align-items: flex-start;
          }

          .op-item {
            width: 100%;
          }
        }

        @media (max-width: 768px) {
          .op-page {
            padding: 90px 18px 50px;
          }

          .op-stats {
            grid-template-columns: 1fr;
          }

          .op-tab {
            padding: 10px 16px;
          }

          .op-card {
            padding: 22px;
          }

          .op-item img {
            width: 82px;
            height: 82px;
          }
        }

        @media (min-width: 2400px) {
          .op-page {
            padding: 140px 80px 100px;
          }

          .op-container {
            max-width: 1800px;
          }

          .op-stats {
            gap: 24px;
          }

          .op-card {
            padding: 32px;
            border-radius: 26px;
          }

          .op-item img {
            width: 120px;
            height: 120px;
          }

          .op-title {
            font-size: 3.4rem;
          }
        }
      `}</style>
    </div>
  );
};

export default OrdersPage;