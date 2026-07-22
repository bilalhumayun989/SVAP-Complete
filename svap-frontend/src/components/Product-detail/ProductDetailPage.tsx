import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import {
  FiArrowLeft,
  FiEye, FiCheck
} from 'react-icons/fi'
import { sendSwapRequest } from '../../hooks/useSwapRequests'
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

interface DetailProduct {
  id: string
  title: string
  description?: string
  image: string
  location: string
  views: number
  condition?: string
  swapFor?: string
  swapForImage?: string
  category?: string
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
            image: data.image_urls?.[0] || 'https://placehold.co/600x400',
            description: data.description,
            location: data.profiles?.city || 'Unknown',
            views: data.saved_count || 0,
            condition: data.condition || '',
            swapFor: data.swap_for || '',
            swapForImage: data.image_urls?.[1] || '',
            category: data.category || '',
            user: {
              name: data.profiles?.username || data.profiles?.full_name || 'Unknown',
              avatar: data.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${data.profiles?.username || 'U'}&background=random`,
              email: data.profiles?.email
            }
          };
          setProduct(mappedProduct);

          // Fetch related products
          if (data.category) {
            const relatedRes = await api.getProducts();
            const allProds = relatedRes.data || [];
            const relatedData = allProds.filter((p: any) => p.category === data.category && p.id !== id).slice(0, 6);
              
            if (relatedData) {
              setRelated(relatedData.map((p: any) => ({
                id: p.id,
                title: p.title,
                image: p.image_urls?.[0] || 'https://placehold.co/600x400',
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

  if (loading) {
    return <div className="pdp-empty"><p>Loading...</p></div>;
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

        {/* LEFT — image */}
        <div className="pdp-left">
          <div className="pdp-img-card">
            <img src={product.image} alt={product.title} className="pdp-img" />

            {/* Condition badge */}
            {/* {product.condition && (
              <span className="pdp-badge">
                <span className="pdp-badge-dot" />
                {product.condition}
              </span>
            )} */}

            {/* <div className="pdp-img-actions">
              <button className="pdp-icon-btn" aria-label="Like"><FiHeart /></button>
              <button className="pdp-icon-btn" aria-label="Share"><FiShare2 /></button>
            </div> */}
          </div>

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
          <div className="pdp-seller">
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
          
          </div>

          <div className="pdp-divider" />

          {/* Swap-for */}
          {product.swapFor && (
            <div className="pdp-swap-for">
              {product.swapForImage && (
                <img src={product.swapForImage} alt={product.swapFor} className="pdp-swap-img" />
              )}
              <div>
                <p className="pdp-swap-label">Looking to swap for</p>
                <p className="pdp-swap-item">{product.swapFor}</p>
              </div>
            </div>
          )}

          <div className="pdp-divider" />

          {/* CTA */}
          <div className="pdp-cta-row">
            <button
              className={`pdp-cta pdp-cta-swap ${requested ? 'pdp-cta-requested' : ''}`}
              onClick={async () => {
                if (requested) { navigate('/requests'); return; }
                const rawUser = localStorage.getItem('sz_user');
                const me = rawUser ? JSON.parse(rawUser) : { name: 'You', username: 'you' };
                await sendSwapRequest({
                  senderName: me.name ?? me.username ?? 'You',
                  senderAvatar: `https://i.pravatar.cc/150?u=${me.username}`,
                  offeredItemTitle: 'My Item',
                  offeredItemImage: 'https://i.pravatar.cc/80',
                  wantedItemTitle: product.title,
                  wantedItemImage: product.image,
                });
                setRequested(true);
                setToast(true);
                setTimeout(() => setToast(false), 3000);
              }}
            >
              {requested ? <><FiCheck /> View Request</> : <><SvapBtnIcon /> Send Swap Request</>}
            </button>
          </div>

          {/* Toast */}
          {toast && (
            <div className="pdp-toast">
              <FiCheck /> Swap request sent! Expires in 24h.
            </div>
          )}

        </div>
      </div>

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
                <img src={p.image} alt={p.title} className="pdp-rel-img" />
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
        }
        @media (max-width: 480px) {
          .pdp-main { padding: 16px 16px 0; }
          .pdp-related-wrap { padding: 24px 16px 32px; }
          .pdp-related-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; }
        }
      `}</style>
    </div>
  )
}

export default ProductDetailPage