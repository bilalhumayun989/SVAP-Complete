import { useNavigate } from "react-router-dom";

// ── Custom TrendingUp icon — brand two-tone ───────────────────────────────────
const TrendingIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" stroke="#313C5C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <polyline points="16 7 22 7 22 13" stroke="#E45821" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ── Custom Star icon — solid orange fill ──────────────────────────────────────
const StarIcon = ({ size = 13 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#E45821" stroke="#E45821" strokeWidth="1">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

interface Swaper {
  id: string;
  name: string;
  username: string;
  avatar: string;
  swaps: number;
  rating: number;
  verified: boolean;
}

const TOP_SWAPERS: Swaper[] = [
  { id: "1", name: "Ahmed Khan", username: "ahmed_swaps", avatar: "https://i.pravatar.cc/150?img=1", swaps: 287, rating: 4.9, verified: true },
  { id: "2", name: "Fatima Ali", username: "fatima_deals", avatar: "https://i.pravatar.cc/150?img=2", swaps: 245, rating: 4.8, verified: true },
  { id: "3", name: "Hassan Raza", username: "hassan_swap", avatar: "https://i.pravatar.cc/150?img=3", swaps: 198, rating: 4.7, verified: true },
  { id: "4", name: "Ayesha Khan", username: "ayesha_hub", avatar: "https://i.pravatar.cc/150?img=4", swaps: 176, rating: 4.6, verified: true },
  { id: "5", name: "Ali Malik", username: "ali_exchange", avatar: "https://i.pravatar.cc/150?img=5", swaps: 154, rating: 4.5, verified: false },
  { id: "6", name: "Sara Ahmed", username: "sara_swaps", avatar: "https://i.pravatar.cc/150?img=6", swaps: 142, rating: 4.4, verified: false },
];

const TopSwapersRow = () => {
  const navigate = useNavigate();
  return (
    <>
      <section className="tsr-section">
        <div className="tsr-inner">
          {/* Header */}
          <div className="tsr-header">
            <div className="tsr-title-wrap">
              <TrendingIcon size={24} />
              <h2 className="tsr-title">Top Swapers</h2>
              <span className="tsr-badge">Elite Traders</span>
            </div>
            {/* <button className="tsr-viewall" onClick={() => navigate('/top-swapers')}>
              View All <FiArrowRight size={16} />
            </button> */}
          </div>

          {/* Grid */}
          <div className="tsr-grid">
            {TOP_SWAPERS.map((swaper, idx) => (
              <div key={swaper.id} className="tsr-card">
                {/* Rank Badge */}
                <div className="tsr-rank">#{idx + 1}</div>

                {/* Avatar */}
                <div className="tsr-avatar-wrap">
                  <img src={swaper.avatar} alt={swaper.name} className="tsr-avatar" />
                  {swaper.verified && <div className="tsr-verified">✓</div>}
                </div>

                {/* Info */}
                <div className="tsr-info">
                  <h3 className="tsr-name">{swaper.name}</h3>
                  <p className="tsr-username">@{swaper.username}</p>
                </div>

                {/* Stats */}
                <div className="tsr-stats">
                  <div className="tsr-stat">
                    <span className="tsr-stat-label">Swaps</span>
                    <span className="tsr-stat-value">{swaper.swaps}</span>
                  </div>
                  <div className="tsr-stat">
                    <span className="tsr-stat-label">Rating</span>
                    <span className="tsr-stat-value tsr-rating-val"><StarIcon size={13} /> {swaper.rating}</span>
                  </div>
                </div>

                {/* View Button */}
                <button className="tsr-view-btn" onClick={() => navigate(`/user/${swaper.id}`)}>View Profile</button>
              </div>
            ))}
          </div>

        </div>
      </section>

      <style>{`
        .tsr-section {
          width: 100%;
          background: var(--bg);
          padding: 32px 0 28px;
          box-sizing: border-box;
          border-top: 1px solid var(--border);
          border-bottom: 8px solid var(--bg-section);
        }

        .tsr-inner {
          max-width: 100%;
          margin: 0 auto;
          padding: 0 16px;
          box-sizing: border-box;
        }

        /* Header */
        .tsr-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 12px;
        }

        .tsr-title-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .tsr-icon {
          color: #E45821;
          flex-shrink: 0;
        }

        .tsr-rating-val {
          display: flex;
          align-items: center;
          gap: 3px;
        }

        .tsr-title {
          font-size: clamp(1.2rem, 2vw, 1.8rem);
          font-weight: 800;
          color: var(--text-dark);
          margin: 0;
          letter-spacing: -0.01em;
        }

        .tsr-badge {
          background: linear-gradient(135deg, #E45821, #f09060);
          color: var(--text-on-orange);
          font-size: 0.68rem;
          font-weight: 700;
          padding: 4px 12px;
          border-radius: 999px;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .tsr-viewall {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #000;
          color: #fff;
          border: none;
          padding: 9px 18px;
          border-radius: 8px;
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          font-family: 'Poppins', sans-serif;
        }
        .tsr-viewall:hover {
          background: #1a1a1a;
          transform: translateY(-1px);
        }

        /* Grid */
        .tsr-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 14px;
        }

        /* Card */
        .tsr-card {
          background: var(--card-bg);
          border: 1.5px solid var(--border);
          border-radius: 14px;
          padding: 16px 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          cursor: pointer;
          transition: all 0.25s ease;
          position: relative;
          overflow: hidden;
        }

        .tsr-card:hover {
          border-color: #E45821;
          box-shadow: 0 8px 24px rgba(228, 88, 33, 0.12);
          transform: translateY(-3px);
        }

        /* Rank Badge */
        .tsr-rank {
          position: absolute;
          top: 8px;
          right: 8px;
          background: linear-gradient(135deg, #E45821, #f09060);
          color: var(--text-on-orange);
          font-size: 0.75rem;
          font-weight: 700;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(228, 88, 33, 0.3);
        }

        /* Avatar */
        .tsr-avatar-wrap {
          position: relative;
          margin-bottom: 10px;
        }

        .tsr-avatar {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          object-fit: cover;
          border: 2.5px solid var(--border);
          transition: border-color 0.2s;
        }
@media (max-width: 800px) {
  .tsr-section {
    display: none;
  }
}
        .tsr-card:hover .tsr-avatar {
          border-color: #E45821;
        }

        .tsr-verified {
          position: absolute;
          bottom: -2px;
          right: -2px;
          width: 20px;
          height: 20px;
          background: #E45821;
          border: 2px solid var(--card-bg);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.65rem;
          color: var(--text-on-orange);
          font-weight: 700;
        }

        /* Info */
        .tsr-info {
          margin-bottom: 10px;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .tsr-name {
          font-size: 0.9rem;
          font-weight: 700;
          color: var(--text-dark);
          margin: 0 0 3px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .tsr-username {
          font-size: 0.72rem;
          color: var(--text-muted);
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Stats */
        .tsr-stats {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          width: 100%;
          margin-bottom: 12px;
          padding: 0 4px;
        }

        .tsr-stat {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          padding: 8px 0;
          background: var(--bg-alt);
          border-radius: 8px;
        }

        .tsr-stat-label {
          font-size: 0.65rem;
          color: var(--text-muted);
          font-weight: 600;
          text-transform: uppercase;
        }

        .tsr-stat-value {
          font-size: 0.85rem;
          font-weight: 700;
          color: #E45821;
        }

        /* Button */
        .tsr-view-btn {
          width: 100%;
          padding: 9px 10px;
          background: #E45821;
          color: var(--text-on-orange);
          border: none;
          border-radius: 8px;
          font-size: 0.78rem;
          font-weight: 700;
          cursor: pointer;
          font-family: 'Poppins', sans-serif;
          transition: all 0.2s;
        }

        .tsr-view-btn:hover {
          background: #c94d1c;
          transform: translateY(-1px);
        }

        /* Responsive */
        @media (min-width: 2400px) {
          .tsr-grid { grid-template-columns: repeat(8, 1fr); gap: 16px; }
        }
        
        /* ──────────────────────────────────────
           TABLET/MEDIUM SCREENS (780px-1300px)
        ────────────────────────────────────── */
        @media (min-width: 768px) and (max-width: 1300px) {
          .tsr-grid { grid-template-columns: repeat(4, 1fr); gap: 11px; }
          .tsr-card { padding: 14px 10px; }
          .tsr-avatar { width: 54px; height: 54px; }
          .tsr-name { font-size: 0.87rem; }
          .tsr-username { font-size: 0.68rem; }
          .tsr-stat { padding: 6px 0; }
          .tsr-stat-label { font-size: 0.6rem; }
          .tsr-stat-value { font-size: 0.8rem; }
          .tsr-view-btn { font-size: 0.75rem; padding: 8px 9px; }
          .tsr-inner { padding: 0 14px; }
        }
        
        @media (max-width: 1400px) {
          .tsr-grid { grid-template-columns: repeat(5, 1fr); gap: 12px; }
        }
        @media (max-width: 1024px) {
          .tsr-grid { grid-template-columns: repeat(4, 1fr); gap: 12px; }
        }
        @media (max-width: 768px) {
          .tsr-grid { grid-template-columns: repeat(3, 1fr); gap: 10px; }
          .tsr-card { padding: 14px 10px; }
          .tsr-avatar { width: 50px; height: 50px; }
          .tsr-name { font-size: 0.85rem; }
        }
        @media (max-width: 480px) {
          .tsr-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
          .tsr-inner { padding: 0 12px; }
          .tsr-card { padding: 12px 8px; }
          .tsr-avatar { width: 48px; height: 48px; }
          .tsr-title { font-size: clamp(1rem, 3vw, 1.3rem); }
        }
      `}</style>
    </>
  );
};

export default TopSwapersRow;
