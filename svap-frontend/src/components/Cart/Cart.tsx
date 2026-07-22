import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FiTrash2, FiShoppingCart, FiX, FiArrowRight } from "react-icons/fi";

export type CartItem = {
  id: number;
  name: string;
  image: string;
  price: string;
};

// Simple global cart store using localStorage + events
export const getCart = (): CartItem[] => {
  try { return JSON.parse(localStorage.getItem("sz_cart") || "[]"); } catch { return []; }
};

export const addToCart = (item: CartItem) => {
  const cart = getCart();
  if (!cart.find((c) => c.id === item.id)) {
    localStorage.setItem("sz_cart", JSON.stringify([...cart, item]));
    window.dispatchEvent(new Event("sz_cart_change"));
  }
};

export const removeFromCart = (id: number) => {
  const cart = getCart().filter((c) => c.id !== id);
  localStorage.setItem("sz_cart", JSON.stringify(cart));
  window.dispatchEvent(new Event("sz_cart_change"));
};

// Cart Drawer component (used inside Navbar)
export const CartDrawer = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const [items, setItems] = useState<CartItem[]>(getCart());

  useEffect(() => {
    const sync = () => setItems(getCart());
    window.addEventListener("sz_cart_change", sync);
    return () => window.removeEventListener("sz_cart_change", sync);
  }, []);

  useEffect(() => {
    if (open) setItems(getCart());
  }, [open]);

  if (!open) return null;

  return (
    <>
      <div className="cart-overlay" onClick={onClose} />
      <div className="cart-drawer">
        <div className="cart-drawer-header">
          <div className="cart-drawer-title-row">
            <FiShoppingCart size={18} />
            <span>Cart</span>
            {items.length > 0 && (
              <span className="cart-count-badge">{items.length}</span>
            )}
          </div>
          <button className="cart-close-btn" onClick={onClose} aria-label="Close cart">
            <FiX size={18} />
          </button>
        </div>

        <div className="cart-drawer-body">
          {items.length === 0 ? (
            <div className="cart-empty">
              <FiShoppingCart size={36} />
              <p>Your cart is empty</p>
              <Link to="/" className="cart-browse-link" onClick={onClose}>Browse Items</Link>
            </div>
          ) : (
            <>
              <div className="cart-items-list">
                {items.map((item) => (
                  <div key={item.id} className="cart-item">
                    <div className="cart-item-img-wrap">
                      <img src={item.image} alt={item.name} className="cart-item-img" />
                    </div>
                    <div className="cart-item-info">
                      <span className="cart-item-name">{item.name}</span>
                      <span className="cart-item-price">{item.price}</span>
                    </div>
                    <button
                      className="cart-item-remove"
                      onClick={() => removeFromCart(item.id)}
                      aria-label={`Remove ${item.name}`}
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="cart-footer">
                <div className="cart-footer-summary">
                  <span className="cart-footer-label">Total Items</span>
                  <span className="cart-footer-value">{items.length}</span>
                </div>
                <button id="cart-checkout-btn" className="cart-checkout-btn">
                  <span>Proceed to SVAP</span>
                  <FiArrowRight size={16} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        .cart-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          z-index: 98;
          backdrop-filter: blur(2px);
        }

        .cart-drawer {
          position: fixed;
          top: 0;
          right: 0;
          width: 360px;
          max-width: calc(100vw - 20px);
          height: 100vh;
          background: rgba(15,15,15,0.95);
          backdrop-filter: blur(28px);
          -webkit-backdrop-filter: blur(28px);
          border-left: 1px solid rgba(255,255,255,0.09);
          z-index: 99;
          display: flex;
          flex-direction: column;
          box-shadow: -8px 0 40px rgba(0,0,0,0.5);
        }

        .cart-drawer-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 20px;
          border-bottom: 1px solid rgba(255,255,255,0.07);
        }

        .cart-drawer-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 1rem;
          font-weight: 700;
          color: #fff;
        }

        .cart-count-badge {
          background: rgba(255,122,69,0.15);
          border: 1px solid rgba(255,122,69,0.3);
          color: #FF7A45;
          font-size: 0.7rem;
          font-weight: 700;
          padding: 1px 7px;
          border-radius: 999px;
        }

        .cart-close-btn {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.10);
          border-radius: 8px;
          color: rgba(255,255,255,0.6);
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.2s, color 0.2s;
        }

        .cart-close-btn:hover {
          background: rgba(255,255,255,0.10);
          color: #fff;
        }

        .cart-drawer-body {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
        }

        .cart-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          height: 100%;
          color: rgba(255,255,255,0.25);
          text-align: center;
        }

        .cart-empty p {
          margin: 0;
          font-size: 0.9rem;
        }

        .cart-browse-link {
          color: rgba(255,255,255,0.6);
          text-decoration: none;
          font-size: 0.82rem;
          border: 1px solid rgba(255,255,255,0.15);
          padding: 8px 20px;
          border-radius: 8px;
          transition: color 0.2s, border-color 0.2s;
        }

        .cart-browse-link:hover {
          color: #fff;
          border-color: rgba(255,255,255,0.3);
        }

        .cart-items-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 16px;
        }

        .cart-item {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          padding: 12px;
        }

        .cart-item-img-wrap {
          width: 52px;
          height: 52px;
          border-radius: 8px;
          overflow: hidden;
          background: rgba(255,255,255,0.06);
          flex-shrink: 0;
        }

        .cart-item-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .cart-item-info {
          flex: 1;
          min-width: 0;
        }

        .cart-item-name {
          display: block;
          font-size: 0.84rem;
          font-weight: 600;
          color: #fff;
          margin-bottom: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .cart-item-price {
          display: block;
          font-size: 0.75rem;
          color: rgba(255,255,255,0.4);
        }

        .cart-item-remove {
          background: none;
          border: none;
          color: rgba(255,255,255,0.25);
          cursor: pointer;
          padding: 6px;
          border-radius: 6px;
          transition: color 0.2s, background 0.2s;
          display: flex;
          align-items: center;
          flex-shrink: 0;
        }

        .cart-item-remove:hover {
          color: #f87171;
          background: rgba(248,113,113,0.08);
        }

        .cart-footer {
          border-top: 1px solid rgba(255,255,255,0.07);
          padding-top: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .cart-footer-summary {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .cart-footer-label {
          font-size: 0.82rem;
          color: rgba(255,255,255,0.45);
        }

        .cart-footer-value {
          font-size: 0.9rem;
          font-weight: 700;
          color: #fff;
        }

        .cart-checkout-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 13px 20px;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.18);
          border-radius: 10px;
          color: #fff;
          font-size: 0.88rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s, border-color 0.2s;
        }

        .cart-checkout-btn:hover {
          background: rgba(255,255,255,0.13);
          border-color: rgba(255,255,255,0.28);
        }

        @media (min-width: 2400px) {
          .cart-drawer { width: 440px; }
        }
      `}</style>
    </>
  );
};

// Cart page (full page route)
const CartPage = () => {
  const [items, setItems] = useState<CartItem[]>(getCart());

  useEffect(() => {
    const sync = () => setItems(getCart());
    window.addEventListener("sz_cart_change", sync);
    return () => window.removeEventListener("sz_cart_change", sync);
  }, []);

  return (
    <div className="cartpage-page">
      <div className="cartpage-bg" />
      <div className="cartpage-container">
        <div className="cartpage-header">
          <h1 className="cartpage-title">My Cart</h1>
          <p className="cartpage-subtitle">{items.length} item{items.length !== 1 ? "s" : ""} added</p>
        </div>

        {items.length === 0 ? (
          <div className="cartpage-empty">
            <FiShoppingCart size={48} />
            <p>No items in cart</p>
            <Link to="/" className="cartpage-browse">Browse Items</Link>
          </div>
        ) : (
          <div className="cartpage-grid">
            {items.map((item) => (
              <div key={item.id} className="cartpage-card">
                <div className="cartpage-card-img-wrap">
                  <img src={item.image} alt={item.name} className="cartpage-card-img" />
                </div>
                <div className="cartpage-card-info">
                  <span className="cartpage-card-name">{item.name}</span>
                  <span className="cartpage-card-price">{item.price}</span>
                </div>
                <button
                  className="cartpage-remove-btn"
                  onClick={() => removeFromCart(item.id)}
                  aria-label={`Remove ${item.name}`}
                >
                  <FiTrash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .cartpage-page {
          min-height: 100vh;
          padding: 100px 20px 60px;
          background: #0a0a0a;
          position: relative;
          box-sizing: border-box;
        }
        .cartpage-bg { position: fixed; inset: 0; background: #0a0a0a; z-index: 0; }
        .cartpage-container { position: relative; z-index: 1; max-width: 720px; margin: 0 auto; }
        .cartpage-header { margin-bottom: 28px; }
        .cartpage-title { font-size: clamp(1.6rem,3vw,2rem); font-weight:700; color:#fff; margin:0 0 4px; }
        .cartpage-subtitle { font-size:0.84rem; color:rgba(255,255,255,0.4); margin:0; }
        .cartpage-empty { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:14px; padding:80px 0; color:rgba(255,255,255,0.25); text-align:center; }
        .cartpage-empty p { margin:0; font-size:0.9rem; }
        .cartpage-browse { color:rgba(255,255,255,0.6); text-decoration:none; font-size:0.84rem; border:1px solid rgba(255,255,255,0.15); padding:9px 22px; border-radius:9px; }
        .cartpage-browse:hover { color:#fff; border-color:rgba(255,255,255,0.3); }
        .cartpage-grid { display:flex; flex-direction:column; gap:12px; }
        .cartpage-card { display:flex; align-items:center; gap:14px; background:rgba(255,255,255,0.04); backdrop-filter:blur(18px); -webkit-backdrop-filter:blur(18px); border:1px solid rgba(255,255,255,0.09); border-radius:14px; padding:16px; }
        .cartpage-card-img-wrap { width:64px; height:64px; border-radius:10px; overflow:hidden; background:rgba(255,255,255,0.06); flex-shrink:0; }
        .cartpage-card-img { width:100%; height:100%; object-fit:cover; }
        .cartpage-card-info { flex:1; min-width:0; }
        .cartpage-card-name { display:block; font-size:0.9rem; font-weight:600; color:#fff; margin-bottom:3px; }
        .cartpage-card-price { display:block; font-size:0.8rem; color:rgba(255,255,255,0.4); }
        .cartpage-remove-btn { background:none; border:1px solid rgba(255,255,255,0.10); border-radius:8px; color:rgba(255,255,255,0.3); width:34px; height:34px; display:flex; align-items:center; justify-content:center; cursor:pointer; flex-shrink:0; transition:color 0.2s,border-color 0.2s,background 0.2s; }
        .cartpage-remove-btn:hover { color:#f87171; background:rgba(248,113,113,0.08); border-color:rgba(248,113,113,0.2); }
        @media(max-width:480px) { .cartpage-page { padding:85px 14px 50px; } }
        @media(min-width:2400px) { .cartpage-container { max-width:900px; } .cartpage-title { font-size:2.4rem; } }
      `}</style>
    </div>
  );
};

export default CartPage;
