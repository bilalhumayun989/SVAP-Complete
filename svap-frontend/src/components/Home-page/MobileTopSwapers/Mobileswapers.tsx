import { useNavigate } from "react-router-dom";

// -----------------------------------------------------------------------------
// MobileSwapers
// Horizontal "Top Swappers" row for mobile & screens up to 800px.
// Desktop version (TopSwapersRow) already hides itself below 800px via
// `@media (max-width: 800px) { .tsr-section { display: none; } }` — this
// component is the mobile/tablet counterpart and hides itself ABOVE 800px.
//
// Light mode: avatar ring is blue (#313C5C).
// Dark mode: avatar ring is orange (#E45821).
// Assumes a `.dark` class toggled on <html>/<body> (same convention as the
// rest of the project's dark mode). Swap the `.dark &` selectors below if
// your project uses a different theme-switch strategy.
//
// Rank badge (small orange circle with a number) only shows for the top 3.
// -----------------------------------------------------------------------------

interface Swaper {
  id: string;
  name: string;
  avatar: string;
  rank?: number; // only top 3 get a visible rank badge
}

const TOP_SWAPERS: Swaper[] = [
  { id: "1", name: "Aiman", avatar: "https://i.pravatar.cc/150?img=1", rank: 1 },
  { id: "2", name: "Hamza", avatar: "https://i.pravatar.cc/150?img=7", rank: 3 },
  { id: "3", name: "Ali", avatar: "https://i.pravatar.cc/150?img=3", rank: 2 },
  { id: "4", name: "Bilal", avatar: "https://i.pravatar.cc/150?img=4" },
  { id: "5", name: "hira", avatar: "https://i.pravatar.cc/150?img=6" },
];

const MobileSwapers = () => {
  const navigate = useNavigate();

  return (
    <>
      <section className="msw-section">
        {/* Header */}
        <div className="msw-header">
          <h2 className="msw-title">Top Swappers</h2>
          <span className="msw-subtitle">This week</span>
        </div>

        {/* Horizontal scrollable row */}
        <div className="msw-row">
          {TOP_SWAPERS.map((swaper) => (
            <div
              key={swaper.id}
              className="msw-item"
              onClick={() => navigate(`/user/${swaper.id}`)}
            >
              <div className="msw-avatar-wrap">
                <img src={swaper.avatar} alt={swaper.name} className="msw-avatar" />
                {swaper.rank && <span className="msw-rank">{swaper.rank}</span>}
              </div>
              <p className="msw-name">{swaper.name}</p>
            </div>
          ))}
        </div>
      </section>

      <style>{`
        .msw-section {
          display: none;
          width: 100%;
          background: var(--bg);
          padding: 16px 16px 20px;
          box-sizing: border-box;
        }

        @media (max-width: 800px) {
          .msw-section {
            display: block;
          }
        }

        .msw-header {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          margin-bottom: 14px;
        }

        .msw-title {
          font-size: 1.1rem;
          font-weight: 800;
          color: var(--text-dark);
          margin: 0;
          letter-spacing: -0.01em;
        }

        .msw-subtitle {
          font-size: 0.82rem;
          font-weight: 500;
          color: var(--text-muted);
        }

        .msw-row {
          display: flex;
          gap: 18px;
          overflow-x: auto;
          scrollbar-width: none;
          -webkit-overflow-scrolling: touch;
        }

        .msw-row::-webkit-scrollbar {
          display: none;
        }

        .msw-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
          cursor: pointer;
        }

        .msw-avatar-wrap {
          position: relative;
        }

        .msw-avatar {
          width: 58px;
          height: 58px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid #313C5C;
          background: var(--card-bg);
        }

        .dark .msw-avatar {
          border-color: #E45821;
        }

        .msw-rank {
          position: absolute;
          bottom: -2px;
          right: -2px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #E45821;
          color: var(--text-on-orange);
          font-size: 0.68rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid var(--bg);
        }

        .msw-name {
          font-size: 0.78rem;
          font-weight: 600;
          color: var(--text-dark);
          margin: 0;
          max-width: 64px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          text-align: center;
        }

        @media (max-width: 480px) {
          .msw-row {
            gap: 14px;
          }
          .msw-avatar {
            width: 52px;
            height: 52px;
          }
        }
      `}</style>
    </>
  );
};

export default MobileSwapers;