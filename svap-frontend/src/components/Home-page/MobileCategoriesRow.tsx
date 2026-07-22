import { useNavigate } from "react-router-dom";

// ── Category icons (SVG, brand two-tone: #313C5C body + #E45821 accent) ──────
const ElectronicsIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <rect x="3" y="7" width="26" height="16" rx="2" stroke="#313C5C" strokeWidth="2" strokeLinejoin="round"/>
    <path d="M10 27h12" stroke="#313C5C" strokeWidth="2" strokeLinecap="round"/>
    <path d="M16 23v4" stroke="#313C5C" strokeWidth="2" strokeLinecap="round"/>
    <rect x="7" y="11" width="12" height="8" rx="1" fill="#E45821" fillOpacity="0.15" stroke="#E45821" strokeWidth="1.5"/>
    <circle cx="23" cy="15" r="2" fill="#E45821"/>
  </svg>
);

const GamingIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <rect x="4" y="9" width="24" height="14" rx="5" stroke="#313C5C" strokeWidth="2"/>
    <path d="M11 13v6M8 16h6" stroke="#E45821" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="22" cy="14" r="1.5" fill="#E45821"/>
    <circle cx="25" cy="17" r="1.5" fill="#E45821"/>
    <circle cx="19" cy="17" r="1.5" fill="#313C5C"/>
    <circle cx="22" cy="20" r="1.5" fill="#313C5C"/>
  </svg>
);

const FashionIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <path d="M12 4L8 10l4 2v12h8V12l4-2-4-6" stroke="#313C5C" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>
    <path d="M12 4c0 2.2 1.8 4 4 4s4-1.8 4-4" stroke="#E45821" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const SportsIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <circle cx="16" cy="16" r="11" stroke="#313C5C" strokeWidth="2"/>
    <path d="M16 5c0 0 3 4 3 11s-3 11-3 11" stroke="#E45821" strokeWidth="1.5"/>
    <path d="M5 16h22" stroke="#E45821" strokeWidth="1.5"/>
    <path d="M7 10c3 1 6 2 9 2s6-1 9-2" stroke="#313C5C" strokeWidth="1.2"/>
    <path d="M7 22c3-1 6-2 9-2s6 1 9 2" stroke="#313C5C" strokeWidth="1.2"/>
  </svg>
);

const BooksIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <rect x="6" y="5" width="14" height="22" rx="2" stroke="#313C5C" strokeWidth="2"/>
    <path d="M20 7h4a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2h-4" stroke="#313C5C" strokeWidth="2" strokeLinecap="round"/>
    <path d="M10 10h6M10 14h6M10 18h4" stroke="#E45821" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);

const HomeIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <path d="M5 14L16 5l11 9" stroke="#313C5C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8 12v13a1 1 0 0 0 1 1h5v-6h4v6h5a1 1 0 0 0 1-1V12" stroke="#313C5C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <rect x="13" y="20" width="6" height="6" rx="0.5" stroke="#E45821" strokeWidth="1.8"/>
  </svg>
);

const VehiclesIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <path d="M4 18l2-6h20l2 6" stroke="#313C5C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <rect x="3" y="18" width="26" height="6" rx="2" stroke="#313C5C" strokeWidth="2"/>
    <circle cx="9" cy="26" r="2.5" stroke="#E45821" strokeWidth="2"/>
    <circle cx="23" cy="26" r="2.5" stroke="#E45821" strokeWidth="2"/>
    <path d="M8 18l2-6h12l2 6" stroke="#E45821" strokeWidth="1.2"/>
    <rect x="10" y="13" width="5" height="5" rx="1" fill="#E45821" fillOpacity="0.2"/>
  </svg>
);

const ToysIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <circle cx="16" cy="16" r="9" stroke="#313C5C" strokeWidth="2"/>
    <path d="M16 7v4M16 21v4M7 16h4M21 16h4" stroke="#E45821" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="16" cy="16" r="3" fill="#E45821" fillOpacity="0.25" stroke="#E45821" strokeWidth="1.5"/>
  </svg>
);

const PhonesIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <rect x="9" y="3" width="14" height="26" rx="3" stroke="#313C5C" strokeWidth="2"/>
    <path d="M13 7h6" stroke="#313C5C" strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="16" cy="25" r="1.2" fill="#E45821"/>
    <rect x="11" y="10" width="10" height="12" rx="1" fill="#E45821" fillOpacity="0.12" stroke="#E45821" strokeWidth="1.2"/>
  </svg>
);

const ClothingIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <path d="M11 4l-7 6 4 2v14h16V12l4-2-7-6" stroke="#313C5C" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>
    <path d="M11 4c0 2.8 2.2 5 5 5s5-2.2 5-5" stroke="#E45821" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const FurnitureIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <rect x="4" y="13" width="24" height="8" rx="2" stroke="#313C5C" strokeWidth="2"/>
    <path d="M8 21v5M24 21v5" stroke="#313C5C" strokeWidth="2" strokeLinecap="round"/>
    <rect x="8" y="8" width="16" height="5" rx="1.5" stroke="#E45821" strokeWidth="1.8"/>
    <path d="M4 17V15a2 2 0 0 1 2-2M28 17V15a2 2 0 0 0-2-2" stroke="#E45821" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const JewelryIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <path d="M8 10l-4 4 12 12 12-12-4-4H8z" stroke="#313C5C" strokeWidth="2" strokeLinejoin="round"/>
    <path d="M8 10l4 4M24 10l-4 4M12 14l4-4 4 4" stroke="#E45821" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round"/>
    <path d="M12 14l4 12 4-12" stroke="#313C5C" strokeWidth="1.2" strokeLinejoin="round"/>
  </svg>
);

const MOBILE_CATS = [
  { label: "Electronics", icon: <ElectronicsIcon /> },
  { label: "Gaming",      icon: <GamingIcon /> },
  { label: "Fashion",     icon: <FashionIcon /> },
  { label: "Sports",      icon: <SportsIcon /> },
  { label: "Books",       icon: <BooksIcon /> },
  { label: "Home",        icon: <HomeIcon /> },
  { label: "Vehicles",    icon: <VehiclesIcon /> },
  { label: "Toys",        icon: <ToysIcon /> },
  { label: "Phones",      icon: <PhonesIcon /> },
  { label: "Clothing",    icon: <ClothingIcon /> },
  { label: "Furniture",   icon: <FurnitureIcon /> },
  { label: "Jewelry",     icon: <JewelryIcon /> },
];

const MobileCategoriesRow = () => {
  const navigate = useNavigate();

  return (
    <>
      <section className="mcat-section">
        <div className="mcat-header">
          <h2 className="mcat-title">Categories</h2>
        </div>

        <div className="mcat-scroll">
          {MOBILE_CATS.map((cat) => (
            <button
              key={cat.label}
              className="mcat-item"
              onClick={() => navigate(`/category/${cat.label.toLowerCase()}`)}
            >
              <div className="mcat-icon-wrap">
                {cat.icon}
              </div>
              <span className="mcat-label">{cat.label}</span>
            </button>
          ))}
        </div>
      </section>

      <style>{`
        /* Only visible on mobile/tablet ≤800px */
        .mcat-section { display: none; }

        @media (max-width: 800px) {
          .mcat-section {
            display: block;
            background: var(--bg);
            padding: 16px 0 12px;
            border-top: 6px solid var(--bg-section);
          }

          .mcat-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 16px 12px;
          }

          .mcat-title {
            font-size: 1.1rem;
            font-weight: 800;
            color: var(--text-dark);
            margin: 0;
            letter-spacing: -0.01em;
            font-family: 'Poppins', sans-serif;
          }

          .mcat-viewall {
            background: none;
            border: none;
            color: #E45821;
            font-size: 0.82rem;
            font-weight: 700;
            cursor: pointer;
            font-family: 'Poppins', sans-serif;
            padding: 0;
          }

          .mcat-scroll {
            display: flex;
            gap: 10px;
            overflow-x: auto;
            padding: 4px 16px 8px;
            scrollbar-width: none;
          }
          .mcat-scroll::-webkit-scrollbar { display: none; }

          .mcat-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
            flex-shrink: 0;
            background: none;
            border: none;
            cursor: pointer;
            padding: 0;
            font-family: 'Poppins', sans-serif;
          }

          .mcat-icon-wrap {
            width: 68px;
            height: 68px;
            border-radius: 18px;
            border: 1px solid var(--border-light);
            display: flex;
            align-items: center;
            justify-content: center;
            transition: transform 0.18s, box-shadow 0.18s, border-color 0.18s;
            box-shadow: 0 2px 8px rgba(0,0,0,0.06);
          }

          .mcat-item:active .mcat-icon-wrap,
          .mcat-item:hover .mcat-icon-wrap {
            transform: scale(1.07);
            border-color: #E45821;
            box-shadow: 0 4px 14px rgba(228,88,33,0.18);
          }

          /* Dark mode icon colors */
          html[data-theme='dark'] .mcat-icon-wrap svg path,
          html[data-theme='dark'] .mcat-icon-wrap svg rect,
          html[data-theme='dark'] .mcat-icon-wrap svg circle,
          html[data-theme='dark'] .mcat-icon-wrap svg line {
            stroke: #fff;
          }
          html[data-theme='dark'] .mcat-icon-wrap svg [fill="#313C5C"] {
            fill: #E45821;
          }
          html[data-theme='dark'] .mcat-icon-wrap svg [fill="#E45821"] {
            fill: #ff8c5a;
          }

          .mcat-label {
            font-size: 0.68rem;
            font-weight: 600;
            color: var(--text-dark);
            text-align: center;
            white-space: nowrap;
          }
        }
      `}</style>
    </>
  );
};

export default MobileCategoriesRow;
