import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import {
  FiArrowLeft,
  FiEye, FiCheck, FiBookmark
} from 'react-icons/fi'
import { api } from '../../services/api'

// White SVAP left-right arrows icon for use on orange button background
const SvapBtnIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    {/* Top Arrow */}
    <path d="M3 7h18m0 0l-4-4m4 4l-4 4" />

    {/* Bottom Arrow */}
    <path d="M21 17H3m0 0l4-4M3 17l4 4" />
  </svg>
);

const SWAP_COOLDOWN_MESSAGE = 'You have already sent a request for this item in the last 48 hours. Please wait before sending another request.';

interface DetailProduct {
  id: string
  title: string
  description?: string
  images: string[]
  location: string
  views: number
  condition?: string
  swapFor?: string
  category?: string
  reel?: string
  owner_id: string
  user: { name: string; avatar: string; email?: string }
}

const ProductDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [requested, setRequested] = useState(false)
  const [toast, setToast] = useState(false)
  const [product, setProduct] = useState<DetailProduct | null>(null)
  const [related, setRelated] = useState<DetailProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [activeImg, setActiveImg] = useState(0)
  const [showSwapModal, setShowSwapModal] = useState(false)
  const [myProducts, setMyProducts] = useState<any[]>([])
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [cashBoost, setCashBoost] = useState<string>('')
  const [swapLoading, setSwapLoading] = useState(false)
  const [canSendSwap, setCanSendSwap] = useState(true)
  const [, setSwapCooldownMessage] = useState<string | null>(null)
  const [isSaved, setIsSaved] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)

  // Current logged-in user id from localStorage
  const myUserId = (() => { try { return JSON.parse(localStorage.getItem('sz_user') || '{}').id; } catch { return null; } })()

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      if (!id) return;
      
      try {
        const res = await api.getProductById(id);
        const data = res.data;
        
        if (data) {
          const mappedProduct: DetailProduct = {
            id: data.id,
            title: data.title,
            images: data.image_urls?.length ? data.image_urls : ['https://placehold.co/600x400'],
            description: data.description,
            location: data.profiles?.city || 'Unknown',
            views: data.saved_count || 0,
            condition: data.condition || '',
            swapFor: data.swap_for || '',
            category: data.category || '',
            reel: data.video_url || '',
            owner_id: data.user_id || '',
            user: {
              name: data.profiles?.username || data.profiles?.full_name || 'Unknown',
              avatar: data.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${data.profiles?.username || 'U'}&background=random`,
              email: data.profiles?.email
            }
          };
          setProduct(mappedProduct);
          setActiveImg(0);

          // Fetch related products
          if (data.category) {
            const relatedRes = await api.getProducts();
            const allProds = relatedRes.data || [];
            const relatedData = allProds.filter((p: any) => p.category === data.category && p.id !== id).slice(0, 6);
              
            if (relatedData) {
              setRelated(relatedData.map((p: any) => ({
                id: p.id,
                title: p.title,
                images: p.image_urls?.length ? p.image_urls : ['https://placehold.co/600x400'],
                location: p.profiles?.city || 'Unknown',
                views: p.saved_count || 0,
                user: {
                  name: p.profiles?.username || p.profiles?.full_name || 'Unknown',
                  avatar: p.profiles?.avatar_url || ''
                }
              })));
            }
          }
        }
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    
    fetchProduct();
  }, [id]);

  // ── Check 24-hour swap eligibility ──
  useEffect(() => {
    const checkEligibility = async () => {
      if (!myUserId || !id) return;
      try {
        const res = await api.checkSwapEligibility(myUserId, id);
        if (res.canSend === false) {
          setCanSendSwap(false);
          setSwapCooldownMessage(SWAP_COOLDOWN_MESSAGE);
        } else {
          setCanSendSwap(true);
          setSwapCooldownMessage(null);
        }
      } catch (err) {
        console.error('[checkEligibility]', err);
      }
    };
    checkEligibility();
  }, [id, myUserId]);

  useEffect(() => {
    const loadSavedState = async () => {
      if (!myUserId || !id) return;
      const res = await api.getSavedProductIds(myUserId);
      const savedIds = Array.isArray(res.data) ? res.data : Array.isArray(res) ? res : [];
      setIsSaved(savedIds.some((savedId: any) => String(savedId) === String(id)));
    };
    loadSavedState().catch(() => setIsSaved(false));
  }, [id, myUserId]);

  useEffect(() => {
    if (!showSwapModal) return;

    const scrollY = window.scrollY;
    const previousOverflow = document.body.style.overflow;
    const previousPosition = document.body.style.position;
    const previousTop = document.body.style.top;
    const previousWidth = document.body.style.width;
    const previousDocumentOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    document.documentElement.style.overflow = 'hidden';

    const preventBackgroundScroll = (event: WheelEvent | TouchEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target?.closest('.pdp-modal')) {
        event.preventDefault();
      }
    };
    document.addEventListener('wheel', preventBackgroundScroll, { capture: true, passive: false });
    document.addEventListener('touchmove', preventBackgroundScroll, { capture: true, passive: false });

    return () => {
      document.removeEventListener('wheel', preventBackgroundScroll, true);
      document.removeEventListener('touchmove', preventBackgroundScroll, true);
      document.body.style.overflow = previousOverflow;
      document.body.style.position = previousPosition;
      document.body.style.top = previousTop;
      document.body.style.width = previousWidth;
      document.documentElement.style.overflow = previousDocumentOverflow;
      window.scrollTo(0, scrollY);
    };
  }, [showSwapModal]);

  const toggleSaved = async () => {
    if (!myUserId || !id) {
      navigate('/login');
      return;
    }
    setSaveLoading(true);
    try {
      const res = isSaved
        ? await api.unsaveProduct(myUserId, id)
        : await api.saveProduct(myUserId, id);
      if (res.error) throw new Error(res.error);
      setIsSaved(value => !value);
    } catch (error) {
      console.error('[toggleSaved]', error);
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="pdp-root">
        <div className="pdp-back-wrap">
          <div className="pdp-skel pdp-skel-back" />
        </div>
        <div className="pdp-main">
          {/* Left — image skeleton */}
          <div className="pdp-left">
            <div className="pdp-skel pdp-skel-img" />
            <div className="pdp-thumbs" style={{ marginTop: 10 }}>
              {[1,2,3].map(i => <div key={i} className="pdp-skel pdp-skel-thumb" />)}
            </div>
          </div>
          {/* Right — content skeleton */}
          <div className="pdp-right">
            <div className="pdp-skel pdp-skel-title" />
            <div className="pdp-skel pdp-skel-line" />
            <div className="pdp-skel pdp-skel-line pdp-skel-line--short" />
            <div className="pdp-skel pdp-skel-seller" />
            <div className="pdp-skel pdp-skel-line pdp-skel-line--med" />
            <div className="pdp-skel pdp-skel-btn" />
          </div>
        </div>
        <style>{`
          @keyframes pdp-shimmer {
            0%   { background-position: -700px 0; }
            100% { background-position: 700px 0; }
          }
          .pdp-skel {
            background: linear-gradient(90deg, #f0f0f0 25%, #e4e4e4 50%, #f0f0f0 75%);
            background-size: 700px 100%;
            animation: pdp-shimmer 1.4s infinite linear;
            border-radius: 12px;
          }
          html[data-theme='dark'] .pdp-skel {
            background: linear-gradient(90deg, #1a1a1a 25%, #252525 50%, #1a1a1a 75%);
            background-size: 700px 100%;
          }
          .pdp-skel-back  { height: 36px; width: 80px; border-radius: 8px; }
          .pdp-skel-img   { width: 100%; aspect-ratio: 4/3; border-radius: 20px; }
          .pdp-skel-thumb { width: 72px; height: 56px; border-radius: 10px; }
          .pdp-skel-title { height: 38px; width: 75%; margin-bottom: 14px; }
          .pdp-skel-line  { height: 14px; width: 100%; margin-bottom: 10px; }
          .pdp-skel-line--short { width: 45%; }
          .pdp-skel-line--med   { width: 65%; }
          .pdp-skel-seller { height: 72px; width: 100%; border-radius: 18px; margin-bottom: 10px; }
          .pdp-skel-btn   { height: 52px; width: 100%; border-radius: 16px; margin-top: 10px; }
        `}</style>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="pdp-empty">
        <p>Product not found.</p>
      </div>
    )
  }

  return (
    <div className="pdp-root">

      {/* ── Back ── */}
      <div className="pdp-back-wrap">
        <button className="pdp-back" onClick={() => navigate(-1)}>
          <FiArrowLeft />
          Back
        </button>
      </div>

      {/* ══ Main two-column ══ */}
      <div className="pdp-main">

        {/* LEFT — image gallery */}
        <div className="pdp-left">
          {/* Main image */}
          <div className="pdp-img-card">
            <img src={product.images[activeImg]} alt={product.title} className="pdp-img" />
          </div>

          {/* Thumbnails — only show if more than 1 image */}
          {product.images.length > 1 && (
            <div className="pdp-thumbs">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  className={`pdp-thumb ${activeImg === i ? 'pdp-thumb--active' : ''}`}
                  onClick={() => setActiveImg(i)}
                  aria-label={`Image ${i + 1}`}
                >
                  <img src={img} alt={`${product.title} ${i + 1}`} className="pdp-thumb-img" />
                </button>
              ))}
            </div>
          )}

          {/* Views pill */}
          <div className="pdp-views">
            <FiEye />
            <span>{product.views} views</span>
          </div>
        </div>

        {/* RIGHT — content */}
        <div className="pdp-right">

          <h1 className="pdp-title">{product.title}</h1>

          {product.description && (
            <p className="pdp-desc">{product.description}</p>
          )}

          <div className="pdp-divider" />

          {/* Seller */}
          <div
            className="pdp-seller pdp-seller--clickable"
            onClick={() => product.owner_id && navigate(`/user/${product.owner_id}`)}
            title="View seller profile"
          >
            <div className="pdp-seller-info">
              <img
                src={product.user.avatar}
                alt={product.user.name}
                className="pdp-avatar"
              />
              <div>
                <p className="pdp-seller-name">@{product.user.name}</p>
                <p className="pdp-seller-loc">
                  <img src="/ICONS/Location.png" className="pdp-loc-icon" alt="Loc" style={{ width: 14, height: 14, objectFit: 'contain', marginRight: 8 }} />
                  {product.location.toUpperCase()}
                </p>
              </div>
            </div>
            <span className="pdp-seller-arrow">›</span>
          </div>

          {product.swapFor && (
            <>
              <div className="pdp-divider" />
              <div className="pdp-swap-for">
                <div>
                  <p className="pdp-swap-label">Looking to swap for</p>
                  <p className="pdp-swap-item">{product.swapFor}</p>
                </div>
              </div>
            </>
          )}

          {/* CTA — only show Svap button if this is NOT the user's own product */}
          {myUserId !== product.owner_id && (
            <>
              <div className="pdp-cta-row">
                <button
                  className={`pdp-save-btn${isSaved ? ' pdp-save-btn--active' : ''}`}
                  onClick={toggleSaved}
                  disabled={saveLoading}
                  aria-label={isSaved ? 'Remove from saved' : 'Save product'}
                >
                  <FiBookmark size={17} fill={isSaved ? 'currentColor' : 'none'} />
                </button>
                <button
                  className={`pdp-cta pdp-cta-swap ${requested ? 'pdp-cta-requested' : ''} ${!canSendSwap ? 'pdp-cta-disabled' : ''}`}
                  disabled={!canSendSwap && !requested}
                  onClick={async () => {
                    if (requested) { navigate('/requests'); return; }
                    if (!canSendSwap) return;
                    
                    const rawUser = localStorage.getItem('sz_user');
                    const me = rawUser ? JSON.parse(rawUser) : null;
                    if (!me?.id) {
                      alert('Please log in to send swap requests');
                      navigate('/login');
                      return;
                    }

                    // Fetch user's active products for selection
                    const res = await api.getProductsByUser(me.id, true);
                    if (res.data && res.data.length > 0) {
                      setMyProducts(res.data);
                      setShowSwapModal(true);
                    } else {
                      alert('You need to list a product first before sending swap requests');
                      navigate('/list-product');
                    }
                  }}
                >
                  {requested ? <><FiCheck /> View Request</> : <><SvapBtnIcon /> Send Swap Request</>}
                </button>
              </div>
            </>
          )}

          {/* If it's the user's own product — show Edit button instead */}
          {myUserId && myUserId === product.owner_id && (
            <div className="pdp-cta-row">
              <button
                className={`pdp-save-btn${isSaved ? ' pdp-save-btn--active' : ''}`}
                onClick={toggleSaved}
                disabled={saveLoading}
                aria-label={isSaved ? 'Remove from saved' : 'Save product'}
              >
                <FiBookmark size={17} fill={isSaved ? 'currentColor' : 'none'} />
              </button>
              <button
                className="pdp-cta pdp-cta-edit"
                onClick={() => navigate(`/edit-product/${product.id}`)}
              >
                ✏️ Edit Listing
              </button>
            </div>
          )}

          {/* Toast */}
          {toast && (
            <div className="pdp-toast">
              <FiCheck /> Swap request sent! Expires in 24h.
            </div>
          )}

        </div>
      </div>

      {product.reel && (
        <section className="pdp-reel-section">
          <p className="pdp-reel-label">Reel</p>
          <video className="pdp-reel" src={product.reel} controls playsInline preload="metadata" />
        </section>
      )}

      {/* ══ Related products ══ */}
      <div className="pdp-related-wrap">
        <h2 className="pdp-related-title">More Listings</h2>
        <div className="pdp-related-grid">
          {related.map((p) => (
            <button
              key={p.id}
              className="pdp-rel-card"
              onClick={() => navigate(`/product/${p.id}`)}
            >
              <div className="pdp-rel-img-wrap">
                <img src={p.images[0]} alt={p.title} className="pdp-rel-img" />
              </div>
              <div className="pdp-rel-info">
                <p className="pdp-rel-name">{p.title}</p>
                <p className="pdp-rel-loc">
                  <img src="/ICONS/Location.png" className="pdp-rel-loc-icon" alt="Loc" style={{ width: 14, height: 14, objectFit: 'contain', marginRight: 6 }} />
                  {p.location}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ══ Swap Request Modal ══ */}
      {showSwapModal && (
        <div
          className="pdp-modal-overlay"
          onClick={() => setShowSwapModal(false)}
          onWheel={e => e.preventDefault()}
        >
          <div
            className="pdp-modal"
            onClick={e => e.stopPropagation()}
            onWheel={e => {
              e.preventDefault();
              e.currentTarget.scrollTop += e.deltaY;
            }}
          >
            <div className="pdp-modal-header">
              <h3 className="pdp-modal-title">Choose One!!</h3>
              <p className="pdp-modal-sub">Select the product you want to offer in exchange for <strong>{product?.title}</strong></p>
            </div>

            <div className="pdp-modal-grid">
              {myProducts.map((p: any) => (
                <button
                  key={p.id}
                  className={`pdp-modal-card ${selectedProductId === p.id ? 'pdp-modal-card--selected' : ''}`}
                  onClick={() => setSelectedProductId(p.id)}
                >
                  <div className="pdp-modal-img-wrap">
                    <img
                      src={p.image_urls?.[0] || 'https://placehold.co/200'}
                      alt={p.title}
                      className="pdp-modal-img"
                    />
                    {selectedProductId === p.id && (
                      <div className="pdp-modal-check"><FiCheck size={16} /></div>
                    )}
                  </div>
                  <p className="pdp-modal-name">{p.title}</p>
                  <p className="pdp-modal-cat">{p.category}</p>
                </button>
              ))}
            </div>

            {/* Cash Boost (optional) */}
            <div className="pdp-cash-boost-wrap">
              <label className="pdp-cash-boost-label" htmlFor="pdp-cash-boost">
                {` Add Cash Boost`} <span>(Optional)</span>
              </label>
              <div className="pdp-cash-boost-input-row">
                <span className="pdp-cash-boost-prefix">PKR</span>
                <input
                  id="pdp-cash-boost"
                  type="number"
                  min="0"
                  step="50"
                  placeholder="0"
                  value={cashBoost}
                  onChange={e => setCashBoost(e.target.value)}
                  className="pdp-cash-boost-input"
                />
              </div>
              <p className="pdp-cash-boost-hint">
                Sweetening the deal? Extra cash makes your offer more attractive. Rider collects on delivery.
              </p>
            </div>

            <div className="pdp-modal-actions">
              <button
                className="pdp-modal-cancel"
                onClick={() => { setShowSwapModal(false); setSelectedProductId(null); setCashBoost(''); }}
              >
                Cancel
              </button>
              <button
                className="pdp-modal-send"
                disabled={!selectedProductId || swapLoading}
                onClick={async () => {
                  if (!selectedProductId || !product) return;
                  const rawUser = localStorage.getItem('sz_user');
                  const me = rawUser ? JSON.parse(rawUser) : null;
                  if (!me?.id) return;

                  const boostAmount = parseFloat(cashBoost) || 0;

                  setSwapLoading(true);
                  try {
                    const res = await api.createSwapRequest({
                      from_user_id: me.id,
                      to_user_id: product.owner_id,
                      offered_product_id: selectedProductId,
                      requested_product_id: product.id,
                      premium_amount: boostAmount > 0 ? boostAmount : null,
                    });
                    if (res.error) throw new Error(res.error);
                    setShowSwapModal(false);
                    setSelectedProductId(null);
                    setCashBoost('');
                    setRequested(true);
                    setCanSendSwap(false);
                    setSwapCooldownMessage(SWAP_COOLDOWN_MESSAGE);
                    setToast(true);
                    setTimeout(() => setToast(false), 3000);
                  } catch (err: any) {
                    if (err.message === SWAP_COOLDOWN_MESSAGE || err.message?.includes('already')) {
                      setCanSendSwap(false);
                      setSwapCooldownMessage(SWAP_COOLDOWN_MESSAGE);
                      setShowSwapModal(false);
                      setSelectedProductId(null);
                      setCashBoost('');
                    }
                    alert(err.message || 'Failed to send swap request');
                  } finally {
                    setSwapLoading(false);
                  }
                }}
              >
                {swapLoading ? 'Sending...' : <><SvapBtnIcon /> Send Swap Request</>}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .pdp-root {
          width: 100%;
          min-height: 100vh;
          background: var(--bg);
          color: var(--text-dark);
          font-family: inherit;
          padding-top: 20px;
          box-sizing: border-box;
        }

        .pdp-empty {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg);
          color: var(--text-muted);
          font-size: 0.95rem;
        }

        /* ── Back ── */
        .pdp-back-wrap {
          max-width: 2400px;
          margin: 0 auto;
          padding: 24px 32px 0;
        }
        .pdp-back {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          color: var(--text-muted);
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: color 0.18s ease;
          background: none;
          border: none;
          padding: 0;
        }
        .pdp-back:hover { color: var(--text-dark); }
        .pdp-back:focus-visible { outline: 2px solid var(--svap-blue); outline-offset: 4px; }

        /* ══ Main ══ */
        .pdp-main {
          display: grid;
          grid-template-columns: 1fr 1fr;
          align-items: start;
          gap: 40px;
          max-width: 2400px;
          margin: 0 auto;
          padding: 28px 32px 0;
          box-sizing: border-box;
        }

        .pdp-left {
          display: flex;
          flex-direction: column;
          gap: 14px;
          justify-content: flex-start;
        }

        .pdp-img-card {
          position: relative;
          width: 100%;
          border-radius: 20px;
          overflow: hidden;
          aspect-ratio: 4 / 3;
          background: var(--card-bg);
          border: 1px solid rgba(165,194,111,0.28);
          box-shadow: 0 22px 52px rgba(94,126,52,0.08);
        }
        .pdp-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .pdp-badge {
          position: absolute;
          top: 14px;
          left: 14px;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 7px 14px;
          border-radius: 999px;
          font-size: 0.72rem;
          font-weight: 600;
          letter-spacing: 0.03em;
          color: var(--text-dark);
          background: rgba(174,220,90,0.2);
          border: 1px solid rgba(174,220,90,0.35);
        }
        .pdp-badge-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--svap-lime);
          flex-shrink: 0;
        }

        .pdp-img-actions {
          position: absolute;
          top: 12px;
          right: 12px;
          display: flex;
          gap: 8px;
        }
        .pdp-icon-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
          color: var(--text-dark);
          cursor: pointer;
          transition: background 0.18s ease, color 0.18s ease, border-color 0.18s ease;
          background: rgba(255,255,255,0.92);
          border: 1px solid rgba(165,194,111,0.28);
        }
        .pdp-icon-btn:hover {
          background: var(--svap-lime);
          color: #000;
          border-color: rgba(141,198,63,0.4);
        }
        .pdp-icon-btn:focus-visible { outline: 2px solid var(--svap-blue); outline-offset: 2px; }

        .pdp-views {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: var(--text-muted);
          font-size: 0.78rem;
        }

        /* ── Thumbnail strip ── */
        .pdp-thumbs {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .pdp-thumb {
          width: 72px;
          height: 56px;
          border-radius: 10px;
          overflow: hidden;
          border: 2px solid rgba(165,194,111,0.25);
          padding: 0;
          cursor: pointer;
          transition: border-color 0.18s, transform 0.15s;
          background: var(--card-bg);
          flex-shrink: 0;
        }
        .pdp-thumb:hover {
          border-color: rgba(141,198,63,0.55);
          transform: translateY(-1px);
        }
        .pdp-thumb--active {
          border-color: #E45821;
          box-shadow: 0 0 0 2px rgba(228,88,33,0.2);
        }
        .pdp-thumb-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .pdp-right {
          display: flex;
          flex-direction: column;
          gap: 20px;
          min-height: 0;
        }

        .pdp-title {
          color: var(--text-dark);
          font-size: clamp(1.5rem, 2.3vw, 2.1rem);
          font-weight: 700;
          line-height: 1.2;
          letter-spacing: -0.02em;
          margin: 0px 0 0px;
        }

        .pdp-desc {
          color: var(--text-mid);
          font-size: 0.95rem;
          line-height: 1.75;
          margin: 0;
        }

        .pdp-divider {
          width: 100%;
          height: 1px;
          background: rgba(165,194,111,0.24);
          margin: 4px 0;
          flex-shrink: 0;
        }

        .pdp-seller {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          padding: 18px 20px;
          border-radius: 18px;
          background: var(--bg-section);
          border: 1px solid rgba(165,194,111,0.28);
        }
        .pdp-seller--clickable {
          cursor: pointer;
          transition: border-color 0.18s, background 0.18s, transform 0.15s;
        }
        .pdp-seller--clickable:hover {
          border-color: rgba(228,88,33,0.4);
          background: rgba(228,88,33,0.04);
          transform: translateY(-1px);
        }
        .pdp-seller-arrow {
          font-size: 1.4rem;
          color: var(--text-muted);
          flex-shrink: 0;
          transition: color 0.18s, transform 0.18s;
        }
        .pdp-seller--clickable:hover .pdp-seller-arrow {
          color: #E45821;
          transform: translateX(3px);
        }
        .pdp-seller-info {
          display: flex;
          align-items: center;
          gap: 13px;
          min-width: 0;
        }
        .pdp-avatar {
          width: 46px;
          height: 46px;
          border-radius: 50%;
          object-fit: cover;
          border: 1px solid rgba(165,194,111,0.35);
          flex-shrink: 0;
        }
        .pdp-seller-name {
          color: var(--text-dark);
          font-size: 0.92rem;
          font-weight: 600;
          margin: 0 0 3px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .pdp-seller-loc {
          display: flex;
          align-items: center;
          gap: 5px;
          color: var(--text-muted);
          font-size: 0.73rem;
          font-weight: 500;
          letter-spacing: 0.04em;
          margin: 0;
        }
        .pdp-loc-icon {
          color: var(--svap-lime);
          flex-shrink: 0;
        }

        .pdp-chat-btn {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 10px 18px;
          border-radius: 999px;
          font-size: 0.82rem;
          font-weight: 700;
          color: var(--text-dark);
          cursor: pointer;
          transition: border-color 0.18s ease, background 0.18s ease;
          white-space: nowrap;
          background: #ffffff;
          border: 1px solid rgba(165,194,111,0.32);
          flex-shrink: 0;
        }
        .pdp-chat-btn:hover {
          background: rgba(174,220,90,0.16);
          border-color: rgba(141,198,63,0.5);
        }
        .pdp-chat-btn:focus-visible { outline: 2px solid var(--svap-blue); outline-offset: 2px; }

        .pdp-swap-for {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 18px 20px;
          border-radius: 18px;
          background: var(--bg-section);
          border: 1px solid rgba(165,194,111,0.28);
          border-left: 3px solid var(--svap-lime);
        }
        .pdp-swap-img {
          width: 72px;
          height: 52px;
          object-fit: cover;
          border-radius: 12px;
          border: 1px solid rgba(165,194,111,0.28);
          flex-shrink: 0;
        }
        .pdp-swap-label {
          color: var(--text-muted);
          font-size: 0.68rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin: 0 0 5px;
        }
        .pdp-swap-item {
          color: var(--text-dark);
          font-size: 0.95rem;
          font-weight: 700;
          margin: 0;
        }

        .pdp-cta-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          padding-top: 0;
        }
        .pdp-save-btn { display: none; }
        .pdp-cta {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 14px;
          border-radius: 16px;
          font-size: 0.9rem;
          font-weight: 700;
          letter-spacing: 0.01em;
          cursor: pointer;
          transition: background 0.18s ease, border-color 0.18s ease, color 0.18s ease;
          border: 1px solid rgba(165,194,111,0.28);
          background: var(--bg-section);
          color: var(--text-dark);
        }
        .pdp-cta:focus-visible { outline: 2px solid var(--svap-blue); outline-offset: 2px; }
        .pdp-cta-chevron { margin-left: 2px; }

        .pdp-cta-swap {
          background: var(--btn-swap);
          color: white;
          border-color: rgba(141,198,63,0.35);
        }
        .pdp-cta-swap:hover {
          filter: brightness(1.1);
          color: white;
        }
        .pdp-cta-swap.pdp-cta-disabled {
          background: #6b7280;
          border-color: #6b7280;
          opacity: 0.6;
          cursor: not-allowed;
        }
        .pdp-cta-swap.pdp-cta-disabled:hover {
          filter: none;
        }
        .pdp-cooldown-msg {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.25);
          border-radius: 12px;
          padding: 10px 14px;
          font-size: 0.78rem;
          color: #dc2626;
          margin-top: 12px;
        }
        html[data-theme='dark'] .pdp-cooldown-msg {
          background: rgba(239,68,68,0.15);
          border-color: rgba(239,68,68,0.3);
          color: #f87171;
        }
        .pdp-cta-edit {
          background: var(--card-bg);
          color: var(--text-dark);
          border: 1.5px solid var(--border);
          font-size: 0.9rem;
        }
        .pdp-cta-edit:hover {
          background: var(--bg-section);
          border-color: #E45821;
          color: #E45821;
        }
        .pdp-cta-swap.pdp-cta-active {
          background: var(--btn-swap);
          border-color: var(--btn-swap);
          color: #fff;
        }
        .pdp-cta-requested {
          background: #313C5C !important;
          border-color: #313C5C !important;
          color: #fff !important;
        }

        .pdp-toast {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #1e3a1e;
          color: #aee85a;
          border: 1px solid rgba(174,220,90,0.35);
          border-radius: 12px;
          padding: 12px 18px;
          font-size: 0.85rem;
          font-weight: 600;
          animation: pdpToastIn 0.3s ease;
        }
        @keyframes pdpToastIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .pdp-cta-buy {
          background: var(--btn-cart);
          color: #fff;
          border-color: var(--btn-cart);
        }
        .pdp-cta-buy:hover { filter: brightness(0.96); }
        .pdp-cta-buy.pdp-cta-active {
          background: var(--svap-lime);
          border-color: var(--svap-lime);
          color: #000;
        }

        .pdp-related-wrap {
          max-width: 2400px;
          margin: 0 auto;
          padding: 48px 32px 56px;
          box-sizing: border-box;
        }
        .pdp-reel-section {
          max-width: 2400px;
          margin: 28px auto 0;
          padding: 0 32px;
        }
        .pdp-reel-label {
          color: var(--text-dark);
          font-size: 0.82rem;
          font-weight: 600;
          margin: 0 0 10px;
        }
        .pdp-reel {
          display: block;
          width: min(100%, 420px);
          max-height: 620px;
          border-radius: 16px;
          background: #000;
          object-fit: cover;
        }
        .pdp-related-title {
          color: var(--text-dark);
          font-size: clamp(1.1rem, 1.5vw, 1.4rem);
          font-weight: 700;
          letter-spacing: -0.01em;
          margin: 0 0 18px;
        }
        .pdp-related-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 14px;
        }

        .pdp-rel-card {
          display: flex;
          flex-direction: column;
          border-radius: 18px;
          overflow: hidden;
          cursor: pointer;
          transition: border-color 0.2s ease, transform 0.2s ease;
          background: var(--card-bg);
          border: 1px solid rgba(165,194,111,0.22);
          text-align: left;
        }
        .pdp-rel-card:hover {
          border-color: rgba(174,220,90,0.32);
          transform: translateY(-2px);
        }
        .pdp-rel-card:focus-visible { outline: 2px solid var(--svap-blue); outline-offset: 2px; }

        .pdp-rel-img-wrap {
          width: 100%;
          aspect-ratio: 4 / 3;
          overflow: hidden;
        }
        .pdp-rel-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }
        .pdp-rel-card:hover .pdp-rel-img { transform: scale(1.03); }

        .pdp-rel-info {
          padding: 12px 14px 14px;
        }
        .pdp-rel-name {
          color: var(--text-dark);
          font-size: 0.82rem;
          font-weight: 700;
          line-height: 1.35;
          margin: 0 0 6px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .pdp-rel-loc {
          display: flex;
          align-items: center;
          gap: 4px;
          color: var(--text-mid);
          font-size: 0.72rem;
          margin: 0;
        }
        .pdp-rel-loc-icon {
          color: var(--svap-lime);
          flex-shrink: 0;
          font-size: 0.68rem;
        }

        @media (max-width: 1280px) {
          .pdp-related-grid { grid-template-columns: repeat(4, 1fr); }
        }
        
        /* ──────────────────────────────────────
           TABLET/MEDIUM SCREENS (780px-1300px)
        ────────────────────────────────────── */
        @media (min-width: 768px) and (max-width: 1300px) {
          .pdp-main { 
            grid-template-columns: 1fr 1fr; 
            gap: 28px; 
            padding: 22px 20px 0; 
          }
          .pdp-back-wrap { padding: 20px 20px 0; }
          .pdp-right { gap: 16px; }
          .pdp-img-card { aspect-ratio: 4 / 3; }
          .pdp-title { font-size: clamp(1.3rem, 2vw, 1.8rem); }
          .pdp-desc { font-size: 0.9rem; }
          .pdp-seller { padding: 16px 18px; }
          .pdp-avatar { width: 42px; height: 42px; }
          .pdp-seller-name { font-size: 0.88rem; }
          .pdp-seller-loc { font-size: 0.7rem; }
          .pdp-swap-for { padding: 16px 18px; }
          .pdp-swap-img { width: 64px; height: 48px; }
          .pdp-swap-label { font-size: 0.65rem; }
          .pdp-swap-item { font-size: 0.9rem; }
          .pdp-cta { font-size: 0.85rem; padding: 12px; }
          .pdp-related-wrap { padding: 36px 20px 44px; }
          .pdp-related-title { font-size: clamp(1rem, 1.3vw, 1.2rem); margin-bottom: 14px; }
          .pdp-related-grid { grid-template-columns: repeat(3, 1fr); gap: 11px; }
          .pdp-rel-img-wrap { aspect-ratio: 4 / 3; }
          .pdp-rel-name { font-size: 0.78rem; }
          .pdp-rel-loc { font-size: 0.68rem; }
        }
        
        @media (max-width: 1024px) {
          .pdp-main { grid-template-columns: 1fr; gap: 24px; padding: 20px 22px 0; }
          .pdp-right { aspect-ratio: unset; }
          .pdp-back-wrap { padding: 18px 22px 0; }
          .pdp-related-wrap { padding: 32px 22px 40px; }
          .pdp-related-grid { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 768px) {
          .pdp-related-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
          .pdp-cta-row { grid-template-columns: 1fr; }
          .pdp-root { padding-bottom: 82px; }
          .pdp-back-wrap {
            position: absolute;
            top: 12px;
            left: 12px;
            z-index: 2;
            padding: 0;
          }
          .pdp-back { color: #fff; text-shadow: 0 1px 4px rgba(0,0,0,0.65); }
          .pdp-main { padding: 0; gap: 12px; }
          .pdp-img-card {
            border-radius: 0;
            border: none;
            aspect-ratio: 4 / 5;
            box-shadow: none;
          }
          .pdp-thumbs, .pdp-views { margin-left: 16px; margin-right: 16px; }
          .pdp-right { padding: 0 16px; gap: 14px; }
          .pdp-title { font-size: 1.35rem; }
          .pdp-desc { font-size: 0.84rem; line-height: 1.55; }
          .pdp-seller { padding: 12px 14px; border-radius: 14px; }
          .pdp-swap-for { padding: 14px; border-radius: 14px; }
          .pdp-cta-row {
            position: fixed;
            z-index: 40;
            left: 0;
            right: 0;
            bottom: 0;
            display: block;
            padding: 12px 16px;
            background: var(--bg);
            border-top: 1px solid rgba(165,194,111,0.2);
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .pdp-save-btn {
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex: 0 0 40px;
            border: 1px solid rgba(165,194,111,0.35);
            border-radius: 50%;
            background: var(--card-bg);
            color: var(--text-muted);
            cursor: pointer;
          }
          .pdp-save-btn--active { color: #E45821; border-color: #E45821; }
          .pdp-cta { width: auto; flex: 1; min-height: 50px; border-radius: 999px; }
          .pdp-reel-section { margin-top: 12px; padding: 0 16px; }
          .pdp-reel-label { margin-bottom: 8px; }
          .pdp-reel {
            width: 100%;
            max-height: 380px;
            aspect-ratio: 16 / 10;
            object-fit: cover;
            border-radius: 12px;
            background: #000;
          }
        }
        @media (max-width: 480px) {
          .pdp-main { padding: 0; }
          .pdp-related-wrap { padding: 24px 16px 32px; }
          .pdp-related-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; }
        }

        /* ── Swap Request Modal ── */
        .pdp-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.6);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          backdrop-filter: blur(4px);
          overflow: hidden;
          overscroll-behavior: contain;
          touch-action: none;
        }
        .pdp-modal {
          background: #fff;
          border-radius: 22px;
          width: 100%;
          max-width: 500px;
          max-height: min(90vh, 680px);
          display: flex;
          flex-direction: column;
          box-shadow: 0 32px 80px rgba(0,0,0,0.25);
          animation: pdp-modal-in 0.2s ease-out;
          overflow-x: hidden;
          overflow-y: auto;
          overscroll-behavior: contain;
          touch-action: pan-y;
          scrollbar-width: none;
        }
        .pdp-modal::-webkit-scrollbar { display: none; }
        html[data-theme='dark'] .pdp-modal {
          background: #1a1a1a;
          border: 1px solid #2a2a2a;
        }
        @keyframes pdp-modal-in {
          from { opacity: 0; transform: scale(0.94) translateY(10px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        .pdp-modal-header {
          padding: 24px 24px 16px;
          border-bottom: 1px solid rgba(165,194,111,0.2);
          flex-shrink: 0;
        }
        html[data-theme='dark'] .pdp-modal-header { border-bottom-color: #2a2a2a; }
        .pdp-modal-title {
          font-size: 1.05rem;
          font-weight: 800;
          color: var(--text-dark);
          margin: 0 0 6px;
        }
        html[data-theme='dark'] .pdp-modal-title { color: #fff; }
        .pdp-modal-sub {
          font-size: 0.82rem;
          color: var(--text-muted);
          margin: 0;
          line-height: 1.5;
        }
        html[data-theme='dark'] .pdp-modal-sub { color: #888; }
        .pdp-modal-sub strong { color: var(--text-dark); }
        html[data-theme='dark'] .pdp-modal-sub strong { color: #fff; }
        .pdp-modal-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          padding: 16px 24px;
          overflow: visible;
          flex: 0 0 auto;
          grid-auto-rows: max-content;
          align-content: start;
        }
        .pdp-modal-card {
          min-width: 0;
          background: #f8fbf2;
          border: 2px solid rgba(165,194,111,0.2);
          border-radius: 14px;
          overflow: hidden;
          cursor: pointer;
          transition: border-color 0.18s, transform 0.15s;
          text-align: left;
          padding: 0 0 10px;
          font-family: inherit;
        }
        html[data-theme='dark'] .pdp-modal-card { background: #111; border-color: #2a2a2a; }
        .pdp-modal-card:hover { border-color: rgba(228,88,33,0.4); transform: translateY(-1px); }
        .pdp-modal-card--selected {
          border-color: #E45821 !important;
          box-shadow: 0 0 0 3px rgba(228,88,33,0.15);
        }
        .pdp-modal-img-wrap {
          position: relative;
          height: 120px;
          overflow: hidden;
          background: #eee;
          margin-bottom: 8px;
        }
        html[data-theme='dark'] .pdp-modal-img-wrap { background: #222; }
        .pdp-modal-img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .pdp-modal-check {
          position: absolute;
          inset: 0;
          background: rgba(228,88,33,0.75);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
        }
        .pdp-modal-name {
          font-size: 0.78rem;
          font-weight: 700;
          color: var(--text-dark);
          margin: 0 10px 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        html[data-theme='dark'] .pdp-modal-name { color: #fff; }
        .pdp-modal-cat {
          font-size: 0.68rem;
          color: var(--text-muted);
          margin: 0 10px;
        }
        .pdp-modal-actions {
          display: flex;
          gap: 12px;
          padding: 16px 24px;
          border-top: 1px solid rgba(165,194,111,0.2);
          flex-shrink: 0;
        }
        html[data-theme='dark'] .pdp-modal-actions { border-top-color: #2a2a2a; }
        .pdp-modal-cancel {
          flex: 1;
          padding: 12px;
          border-radius: 12px;
          background: transparent;
          border: 1px solid rgba(165,194,111,0.3);
          color: var(--text-muted);
          font-size: 0.88rem;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.15s;
        }
        .pdp-modal-cancel:hover { background: rgba(165,194,111,0.1); color: var(--text-dark); }
        html[data-theme='dark'] .pdp-modal-cancel { border-color: #2a2a2a; color: #aaa; }
        .pdp-modal-send {
          flex: 2;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px;
          border-radius: 12px;
          background: #E45821;
          border: none;
          color: #fff;
          font-size: 0.88rem;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
          transition: background 0.15s, transform 0.15s;
        }
        .pdp-modal-send:hover:not(:disabled) { background: #c94d1c; transform: translateY(-1px); }
        .pdp-modal-send:disabled { opacity: 0.5; cursor: not-allowed; }

        /* Cash Boost */
        .pdp-cash-boost-wrap {
          margin: 0 0 4px;
          padding: 16px 18px;
          border-radius: 14px;
          background: rgba(228,88,33,0.05);
          border: 1px dashed rgba(228,88,33,0.35);
        }
        .pdp-cash-boost-label {
          display: block;
          font-size: 0.82rem;
          font-weight: 700;
          color: var(--text-dark);
          margin-bottom: 10px;
          cursor: default;
        }
        .pdp-cash-boost-label span {
          font-weight: 400;
          color: var(--text-muted);
          font-size: 0.75rem;
        }
        .pdp-cash-boost-input-row {
          display: flex;
          align-items: center;
          border: 1.5px solid rgba(228,88,33,0.4);
          border-radius: 10px;
          overflow: hidden;
          background: var(--card-bg);
        }
        .pdp-cash-boost-prefix {
          padding: 0 12px;
          font-size: 0.82rem;
          font-weight: 700;
          color: #E45821;
          border-right: 1.5px solid rgba(228,88,33,0.3);
          background: rgba(228,88,33,0.07);
          height: 40px;
          display: flex;
          align-items: center;
          white-space: nowrap;
        }
        .pdp-cash-boost-input {
          flex: 1;
          border: none;
          outline: none;
          padding: 0 12px;
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--text-dark);
          background: transparent;
          height: 40px;
          font-family: inherit;
        }
        .pdp-cash-boost-hint {
          margin: 8px 0 0;
          font-size: 0.72rem;
          color: var(--text-muted);
          line-height: 1.5;
        }
        html[data-theme='dark'] .pdp-cash-boost-wrap { background: rgba(228,88,33,0.07); border-color: rgba(228,88,33,0.25); }
        html[data-theme='dark'] .pdp-cash-boost-input-row { background: #1a1a1a; border-color: rgba(228,88,33,0.3); }
        html[data-theme='dark'] .pdp-cash-boost-input { color: #fff; }

        @media (max-width: 520px) {
          .pdp-modal-overlay { padding: 12px; }
          .pdp-modal { max-height: 92vh; border-radius: 18px; }
          .pdp-modal-header { padding: 20px 18px 14px; }
          .pdp-modal-grid { padding: 14px 18px; gap: 10px; max-height: 300px; }
          .pdp-modal-img-wrap { height: 96px; }
          .pdp-modal-actions { padding: 14px 18px; }
        }
      `}</style>
    </div>
  )
}

export default ProductDetailPage
