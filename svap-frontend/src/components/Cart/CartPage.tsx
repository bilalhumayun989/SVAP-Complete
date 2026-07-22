import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiShoppingCart, FiTrash2, FiArrowRight, FiArrowLeft,
  FiCheck, FiChevronDown, FiX,
} from "react-icons/fi";
import { getCart, removeFromCart } from "./Cart";
import type { CartItem } from "./Cart";
import { products as homeProducts } from "../Home-page/data/product";

// White SVAP left-right arrows icon for use on orange button background
const SvapBtnIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    {/* Top Arrow */}
    <path d="M3 7h18m0 0l-4-4m4 4l-4 4" />

    {/* Bottom Arrow */}
    <path d="M21 17H3m0 0l4-4M3 17l4 4" />
  </svg>
);

const MY_LISTINGS = homeProducts.slice(0, 8).map((p) => ({
  id: p.id,
  name: p.title,
  image: p.image,
  condition: p.condition ?? "Good",
}));

// Picker rendered inline below card — no z-index stacking issues
const SwapPicker = ({
  cartItemId,
  selected,
  onSelect,
}: {
  cartItemId: number;
  selected: string | undefined;
  onSelect: (cartItemId: number, listingId: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selectedListing = MY_LISTINGS.find((l) => l.id === selected);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="sp-wrap" ref={ref}>
      <button
        type="button"
        className={`sp-btn${selectedListing ? " sp-btn--done" : ""}${open ? " sp-btn--open" : ""}`}
        onClick={() => setOpen((v) => !v)}
      >
        <div className="sp-btn-left">
          {selectedListing ? (
            <>
              <img src={selectedListing.image} alt="" className="sp-btn-thumb" />
              <div className="sp-btn-text">
                <span className="sp-btn-label">Your offer</span>
                <span className="sp-btn-value">{selectedListing.name}</span>
              </div>
            </>
          ) : (
            <div className="sp-btn-text">
              <span className="sp-btn-label">Your offer</span>
              <span className="sp-btn-placeholder">Select an item to offer →</span>
            </div>
          )}
        </div>
        <FiChevronDown
          size={14}
          className="sp-chevron"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
        />
      </button>

      {open && (
        <div className="sp-dropdown">
          <div className="sp-dropdown-header">
            <span className="sp-dropdown-title">What will you offer?</span>
            <button type="button" className="sp-dropdown-close" onClick={() => setOpen(false)}>
              <FiX size={13} />
            </button>
          </div>
          <div className="sp-options">
            {MY_LISTINGS.map((listing) => {
              const active = selected === listing.id;
              return (
                <button
                  key={listing.id}
                  type="button"
                  className={`sp-option${active ? " sp-option--active" : ""}`}
                  onClick={() => { onSelect(cartItemId, listing.id); setOpen(false); }}
                >
                  <img src={listing.image} alt="" className="sp-option-img" />
                  <div className="sp-option-info">
                    <span className="sp-option-name">{listing.name}</span>
                    <span className="sp-option-cond">{listing.condition}</span>
                  </div>
                  {active && <FiCheck size={14} className="sp-option-check" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const CartPage = () => {
  const [items, setItems] = useState<CartItem[]>(getCart());
  const [swapSelections, setSwapSelections] = useState<Record<number, string>>({});
  const navigate = useNavigate();

  useEffect(() => {
    const sync = () => setItems(getCart());
    window.addEventListener("sz_cart_change", sync);
    return () => window.removeEventListener("sz_cart_change", sync);
  }, []);

  const handleRemove = (id: number) => {
    removeFromCart(id);
    setSwapSelections((prev) => { const next = { ...prev }; delete next[id]; return next; });
  };

  const handleClearAll = () => {
    items.forEach((item) => removeFromCart(item.id));
    setSwapSelections({});
  };

  const setSwap = (cartItemId: number, listingId: string) => {
    setSwapSelections((prev) => ({ ...prev, [cartItemId]: listingId }));
  };

  const readyCount = items.filter((it) => swapSelections[it.id]).length;
  const allReady = items.length > 0 && readyCount === items.length;

  return (
    <div className="cp-page">
      <div className="cp-bg" />
      <div className="cp-container">

        {/* ── Header ── */}
        <div className="cp-header">
          <button className="cp-back" onClick={() => navigate(-1)}>
            <FiArrowLeft size={15} /> Back
          </button>
          <div className="cp-header-main">
            <div>
              <h1 className="cp-title">My Cart</h1>
              <p className="cp-sub">
                {items.length} item{items.length !== 1 ? "s" : ""}
                {items.length > 0 && <> · <span className={allReady ? "cp-sub--green" : ""}>{readyCount}/{items.length} offers set</span></>}
              </p>
            </div>
            {items.length > 0 && (
              <button className="cp-clear" onClick={handleClearAll}>Clear All</button>
            )}
          </div>
        </div>

        {/* ── Empty ── */}
        {items.length === 0 ? (
          <div className="cp-empty">
            <div className="cp-empty-icon"><FiShoppingCart size={34} /></div>
            <h2 className="cp-empty-title">Your cart is empty</h2>
            <p className="cp-empty-desc">Add items you want to svap from the listings.</p>
            <Link to="/" className="cp-empty-btn">
              Browse Listings <FiArrowRight size={13} />
            </Link>
          </div>
        ) : (
          <div className="cp-body">

            {/* ── Items ── */}
            <div className="cp-items">
              {items.map((item) => {
                const sel = swapSelections[item.id];
                const ready = !!sel;
                return (
                  <div key={item.id} className={`cp-card${ready ? " cp-card--ready" : ""}`}>

                    {/* Card top row */}
                    <div className="cp-card-top">
                      <div className="cp-card-img-wrap">
                        <img src={item.image} alt={item.name} className="cp-card-img" />
                        {ready && (
                          <div className="cp-card-check">
                            <FiCheck size={10} />
                          </div>
                        )}
                      </div>

                      <div className="cp-card-info">
                        <p className="cp-card-eyebrow">Listing</p>
                        <p className="cp-card-name">{item.name}</p>
                        <p className="cp-card-price">{item.price}</p>
                      </div>

                      <div className="cp-card-arrow">
                        <SvapBtnIcon size={13} />
                      </div>

                      <button
                        className="cp-card-remove"
                        onClick={() => handleRemove(item.id)}
                        aria-label="Remove"
                      >
                        <FiTrash2 size={13} />
                      </button>
                    </div>

                    {/* Swap picker — rendered BELOW the top row, no z-index clash */}
                    <div className="cp-card-picker">
                      <SwapPicker
                        cartItemId={item.id}
                        selected={sel}
                        onSelect={setSwap}
                      />
                    </div>

                  </div>
                );
              })}
            </div>

            {/* ── Summary ── */}
            <div className="cp-summary">
              <div className="cp-summary-box">
                <h2 className="cp-sum-title">Order Summary</h2>

                {/* Avatar stack */}
                <div className="cp-sum-stack">
                  {items.slice(0, 5).map((it, i) => (
                    <img key={it.id} src={it.image} alt="" className="cp-sum-avatar"
                      style={{ zIndex: 10 - i, marginLeft: i === 0 ? 0 : -10 }} />
                  ))}
                  {items.length > 5 && (
                    <div className="cp-sum-avatar-more" style={{ marginLeft: -10 }}>+{items.length - 5}</div>
                  )}
                </div>

                <div className="cp-sum-divider" />

                <div className="cp-sum-row">
                  <span className="cp-sum-label">Items</span>
                  <span className="cp-sum-val">{items.length}</span>
                </div>
                <div className="cp-sum-row">
                  <span className="cp-sum-label">Offers set</span>
                  <span className={`cp-sum-val${allReady ? " cp-sum-val--green" : ""}`}>{readyCount} / {items.length}</span>
                </div>
                <div className="cp-sum-row">
                  <span className="cp-sum-label">Type</span>
                  <span className="cp-sum-val">Direct Svap</span>
                </div>

                <div className="cp-sum-divider" />

                {!allReady && (
                  <p className="cp-sum-hint">Set your swap offer for each item to proceed.</p>
                )}

                <button className={`cp-sum-cta${allReady ? " cp-sum-cta--on" : ""}`} disabled={!allReady}
                  onClick={() => {
                    if (allReady) {
                      navigate('/checkout', {
                        state: {
                          entrySource: 'cart',
                          cartItems: items.map(item => ({
                            id: item.id,
                            name: item.name,
                            image: item.image,
                            price: item.price
                          }))
                        }
                      });
                    }
                  }}
                >
                  <SvapBtnIcon size={15} />
                  {allReady ? 'Proceed to Checkout' : 'Send Svap Requests'}
                  <FiArrowRight size={15} />
                </button>

                <Link to="/" className="cp-sum-browse">Continue Shopping</Link>
              </div>
            </div>

          </div>
        )}
      </div>

      <style>{`
        /* ── Tokens ── */
        .cp-page {
          --bg:#0a0a0a; --fg:#fff; --fg-mid:rgba(255,255,255,0.42);
          --fg-dim:rgba(255,255,255,0.26); --fg-faint:rgba(255,255,255,0.16);
          --line:rgba(255,255,255,0.08); --line-hi:rgba(255,255,255,0.20);
          --card:rgba(255,255,255,0.04); --hover:rgba(255,255,255,0.09);
          --green:#4ade80; --green-bg:rgba(74,222,128,0.09); --green-line:rgba(74,222,128,0.28);
          --red:#f87171; --red-bg:rgba(248,113,113,0.07); --red-line:rgba(248,113,113,0.18);
          min-height:100vh; background:var(--bg);
          padding:24px 24px 72px; box-sizing:border-box;
          font-family:'Poppins','Helvetica Neue',Arial,sans-serif;
          position:relative;
        }
        .cp-bg { position:fixed; inset:0; background:var(--bg); z-index:0; }
        .cp-container {
          position:relative; z-index:1;
          width:100%; max-width: clamp(860px, 74vw, 1440px);
          margin:0 auto;
        }

        /* ── Header ── */
        .cp-back {
          display:inline-flex; align-items:center; gap:6px;
          color:var(--fg-dim); font-size:0.82rem; font-weight:600;
          background:none; border:none; cursor:pointer; padding:0;
          margin-bottom:16px; transition:color .18s;
        }
        .cp-back:hover { color:rgba(255,255,255,.75); }
        .cp-header { margin-bottom:32px; }
        .cp-header-main {
          display:flex; align-items:flex-end;
          justify-content:space-between; flex-wrap:wrap; gap:12px;
        }
        .cp-title {
          font-size:clamp(1.9rem,3vw,2.7rem); font-weight:800;
          color:var(--fg); letter-spacing:-0.02em; margin:0 0 5px; line-height:1.1;
        }
        .cp-sub { font-size:0.87rem; color:var(--fg-mid); margin:0; }
        .cp-sub--green { color:var(--green); font-weight:600; }
        .cp-clear {
          padding:8px 16px;
          background:var(--red-bg); border:1px solid var(--red-line);
          border-radius:8px; color:var(--red);
          font-size:0.8rem; font-weight:600; cursor:pointer;
          transition:background .2s;
        }
        .cp-clear:hover { background:rgba(248,113,113,0.14); }

        /* ── Empty ── */
        .cp-empty {
          display:flex; flex-direction:column; align-items:center;
          justify-content:center; padding:80px 20px; gap:14px; text-align:center;
        }
        .cp-empty-icon {
          width:72px; height:72px; border-radius:50%;
          background:var(--card); border:1px solid var(--line);
          display:flex; align-items:center; justify-content:center;
          color:var(--fg-faint); margin-bottom:6px;
        }
        .cp-empty-title { font-size:1.2rem; font-weight:700; color:var(--fg); margin:0; }
        .cp-empty-desc { font-size:0.84rem; color:var(--fg-dim); margin:0; max-width:260px; }
        .cp-empty-btn {
          display:inline-flex; align-items:center; gap:7px;
          margin-top:6px; padding:10px 22px;
          background:var(--card); border:1px solid var(--line-hi);
          border-radius:10px; color:var(--fg);
          font-size:0.83rem; font-weight:600; text-decoration:none;
          transition:background .2s;
        }
        .cp-empty-btn:hover { background:var(--hover); }

        /* ── Body layout ── */
        .cp-body {
          display:grid;
          grid-template-columns:1fr 300px;
          gap:24px; align-items:start;
        }

        /* ── Items list ── */
        .cp-items { display:flex; flex-direction:column; gap:14px; }

        /* ── Card ── */
        .cp-card {
          background:var(--card);
          backdrop-filter:blur(20px);
          border:1px solid var(--line);
          border-radius:18px;
          padding:18px 20px;
          transition:border-color .2s;
        }
        .cp-card:hover { border-color:var(--line-hi); }
        .cp-card--ready {
          border-color:var(--green-line);
          background:rgba(74,222,128,0.03);
        }

        /* Card top row */
        .cp-card-top {
          display:flex; align-items:center; gap:14px; margin-bottom:14px;
        }
        .cp-card-img-wrap {
          position:relative; width:72px; height:72px;
          border-radius:12px; overflow:hidden;
          border:1px solid var(--line); flex-shrink:0;
        }
        .cp-card-img { width:100%; height:100%; object-fit:cover; }
        .cp-card-check {
          position:absolute; bottom:4px; right:4px;
          width:18px; height:18px; border-radius:50%;
          background:var(--green); color:#000;
          display:flex; align-items:center; justify-content:center;
          font-size:0.6rem;
        }
        .cp-card-info { flex:1; min-width:0; }
        .cp-card-eyebrow {
          font-size:0.64rem; font-weight:700; text-transform:uppercase;
          letter-spacing:0.09em; color:var(--fg-dim); margin:0 0 3px;
        }
        .cp-card-name {
          font-size:0.9rem; font-weight:600; color:var(--fg);
          white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin:0 0 3px;
        }
        .cp-card-price { font-size:0.77rem; color:var(--fg-mid); margin:0; }
        .cp-card-arrow {
          width:32px; height:32px; border-radius:50%;
          background:var(--hover); border:1px solid var(--line);
          display:flex; align-items:center; justify-content:center;
          color:var(--fg-dim); flex-shrink:0;
        }
        .cp-card-remove {
          width:32px; height:32px; border-radius:8px;
          background:none; border:1px solid var(--line);
          color:var(--fg-faint); cursor:pointer; flex-shrink:0;
          display:flex; align-items:center; justify-content:center;
          transition:color .2s, background .2s, border-color .2s;
        }
        .cp-card-remove:hover { color:var(--red); background:var(--red-bg); border-color:var(--red-line); }

        /* Card picker section */
        .cp-card-picker {
          border-top:1px solid var(--line); padding-top:14px;
        }

        /* ════════════════════════
           SWAP PICKER COMPONENT
        ════════════════════════ */
        .sp-wrap { position:relative; }

        .sp-btn {
          display:flex; align-items:center; justify-content:space-between;
          gap:10px; width:100%; padding:11px 14px;
          background:rgba(255,255,255,0.05);
          border:1px dashed rgba(255,255,255,0.18);
          border-radius:12px; cursor:pointer; text-align:left;
          transition:border-color .2s, background .2s;
        }
        .sp-btn:hover { border-color:rgba(255,255,255,0.32); background:rgba(255,255,255,0.08); }
        .sp-btn--done {
          border-style:solid;
          border-color:var(--green-line);
          background:var(--green-bg);
        }
        .sp-btn--open { border-style:solid; border-color:var(--line-hi); }

        .sp-btn-left { display:flex; align-items:center; gap:10px; flex:1; min-width:0; }
        .sp-btn-thumb { width:32px; height:32px; border-radius:7px; object-fit:cover; border:1px solid var(--line); flex-shrink:0; }
        .sp-btn-text { min-width:0; }
        .sp-btn-label { display:block; font-size:0.64rem; font-weight:700; text-transform:uppercase; letter-spacing:0.08em; color:var(--fg-dim); margin-bottom:2px; }
        .sp-btn-value { display:block; font-size:0.82rem; font-weight:600; color:var(--green); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .sp-btn-placeholder { display:block; font-size:0.81rem; color:var(--fg-dim); }
        .sp-chevron { color:var(--fg-dim); flex-shrink:0; }

        /* Dropdown — inline below button, NOT position:absolute
           so it pushes content down and never gets clipped         */
        .sp-dropdown {
          margin-top:8px;
          background:rgba(12,12,12,0.98);
          backdrop-filter:blur(28px);
          border:1px solid rgba(255,255,255,0.13);
          border-radius:16px;
          overflow:hidden;
          box-shadow:0 16px 48px rgba(0,0,0,0.60);
        }
        .sp-dropdown-header {
          display:flex; align-items:center; justify-content:space-between;
          padding:12px 14px 10px;
          border-bottom:1px solid var(--line);
        }
        .sp-dropdown-title { font-size:0.72rem; font-weight:700; text-transform:uppercase; letter-spacing:0.08em; color:var(--fg-dim); }
        .sp-dropdown-close {
          width:24px; height:24px; border-radius:6px;
          background:var(--hover); border:none;
          color:var(--fg-mid); cursor:pointer;
          display:flex; align-items:center; justify-content:center;
          transition:background .18s;
        }
        .sp-dropdown-close:hover { background:rgba(255,255,255,0.14); }

        .sp-options {
          display:flex; flex-direction:column;
          padding:8px; max-height:260px; overflow-y:auto;
          scrollbar-width:thin; scrollbar-color:rgba(255,255,255,0.1) transparent;
        }
        .sp-option {
          display:flex; align-items:center; gap:10px;
          padding:9px 10px; border-radius:10px;
          background:none; border:none; cursor:pointer;
          transition:background .15s; text-align:left;
        }
        .sp-option:hover { background:rgba(255,255,255,0.06); }
        .sp-option--active { background:var(--green-bg); }
        .sp-option-img { width:38px; height:38px; border-radius:8px; object-fit:cover; border:1px solid var(--line); flex-shrink:0; }
        .sp-option-info { flex:1; min-width:0; }
        .sp-option-name { display:block; font-size:0.82rem; font-weight:600; color:var(--fg); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .sp-option-cond { display:block; font-size:0.69rem; color:var(--fg-dim); margin-top:1px; }
        .sp-option-check { color:var(--green); flex-shrink:0; }

        /* ── Summary ── */
        .cp-summary { position:sticky; top:90px; }
        .cp-summary-box {
          background:var(--card); backdrop-filter:blur(20px);
          border:1px solid var(--line); border-radius:20px;
          padding:24px; display:flex; flex-direction:column; gap:14px;
        }
        .cp-sum-title { font-size:1rem; font-weight:700; color:var(--fg); margin:0; }

        .cp-sum-stack { display:flex; align-items:center; }
        .cp-sum-avatar {
          width:36px; height:36px; border-radius:50%;
          object-fit:cover; border:2px solid var(--bg);
          position:relative;
        }
        .cp-sum-avatar-more {
          width:36px; height:36px; border-radius:50%;
          border:2px solid var(--bg); background:var(--hover);
          color:rgba(255,255,255,0.7); font-size:0.64rem; font-weight:700;
          display:flex; align-items:center; justify-content:center;
          position:relative; margin-left:-10px;
        }

        .cp-sum-divider { height:1px; background:var(--line); margin:2px 0; }
        .cp-sum-row { display:flex; align-items:center; justify-content:space-between; }
        .cp-sum-label { font-size:0.8rem; color:var(--fg-mid); }
        .cp-sum-val { font-size:0.84rem; font-weight:600; color:var(--fg); }
        .cp-sum-val--green { color:var(--green); }

        .cp-sum-hint {
          font-size:0.74rem; color:var(--fg-dim); margin:0;
          padding:10px 12px; background:rgba(255,255,255,0.03);
          border:1px solid var(--line); border-radius:9px; line-height:1.5;
        }

        .cp-sum-cta {
          display:flex; align-items:center; justify-content:center; gap:8px;
          width:100%; padding:14px;
          background:var(--hover); border:1px solid var(--line-hi);
          border-radius:12px; color:rgba(255,255,255,0.35);
          font-size:0.88rem; font-weight:700; cursor:not-allowed;
          transition:all .2s;
        }
        .cp-sum-cta--on {
          color:var(--fg); cursor:pointer;
          border-color:rgba(255,255,255,0.35);
          background:rgba(255,255,255,0.13);
        }
        .cp-sum-cta--on:hover {
          background:rgba(255,255,255,0.19);
          border-color:rgba(255,255,255,0.46);
        }
        .cp-sum-browse {
          display:block; text-align:center;
          font-size:0.76rem; color:var(--fg-dim);
          text-decoration:none; transition:color .2s;
        }
        .cp-sum-browse:hover { color:rgba(255,255,255,0.65); }

        /* ── Responsive ── */
        @media (max-width:1024px) {
          .cp-body { grid-template-columns:1fr; }
          .cp-summary { position:static; }
        }
        @media (max-width:600px) {
          .cp-page { padding:14px 14px 52px; }
          .cp-card { padding:14px 16px; }
          .cp-card-img-wrap { width:58px; height:58px; }
        }
        @media (min-width:1920px) {
          .cp-container { max-width:clamp(1300px,62vw,1700px); }
          .cp-body { grid-template-columns:1fr 340px; gap:30px; }
        }
        @media (min-width:2400px) {
          .cp-container { max-width:clamp(1600px,58vw,2100px); }
          .cp-body { grid-template-columns:1fr 380px; gap:40px; }
          .cp-card { padding:22px 24px; border-radius:22px; }
        }
      `}</style>
    </div>
  );
};

export default CartPage;
