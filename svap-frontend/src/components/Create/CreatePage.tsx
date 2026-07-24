// import { useNavigate } from "react-router-dom";
// import {
//   FiArrowLeft,

//   FiFilm,
//   FiCamera,
//   FiBox,
//   FiChevronRight,
//   FiTrendingUp,
// } from "react-icons/fi";

// const OPTIONS = [
//   {
//     icon: <FiFilm size={22} />,
//     iconBg: "#7C5CFC",
//     label: "Upload Reel",
//     desc: "Short product video — appears on Reels, Home & Browse",
//     route: "/create-reel",
//   },
//   {
//     icon: <FiCamera size={22} />,
//     iconBg: "#E45821",
//     label: "Upload Story",
//     desc: "24-hour story — shows at the top of Home",
//     route: "/create-story",
//   },
//   {
//     icon: <FiBox size={22} />,
//     iconBg: "#2E2E33",
//     label: "List an Item",
//     desc: "Add a product you want to swap",
//     route: "/list-product",
//   },
// ];

// const CreatePage = () => {
//   const navigate = useNavigate();

//   return (
//     <div className="cp-page">
//       <div className="cp-inner">

//         {/* HEADER */}
//         <div className="cp-topbar">
//           <button className="cp-icon-btn" onClick={() => navigate(-1)} aria-label="Back">
//             <FiArrowLeft size={20} />
//           </button>
//           <h1 className="cp-title">Create</h1>
        
//         </div>

//         <p className="cp-sub">What would you like to share?</p>

//         {/* OPTIONS */}
//         <div className="cp-options">
//           {OPTIONS.map((opt) => (
//             <button
//               key={opt.label}
//               className="cp-card"
//               onClick={() => navigate(opt.route)}
//             >
//               <div className="cp-icon" style={{ background: opt.iconBg }}>
//                 {opt.icon}
//               </div>
//               <div className="cp-card-text">
//                 <span className="cp-card-label">{opt.label}</span>
//                 <span className="cp-card-desc">{opt.desc}</span>
//               </div>
//               <FiChevronRight size={18} className="cp-chevron" />
//             </button>
//           ))}
//         </div>

//         {/* TIP */}
//         <div className="cp-tip">
//           <div className="cp-tip-icon">
//             <FiTrendingUp size={18} />
//           </div>
//           <div className="cp-tip-text">
//             <span className="cp-tip-title">Reels boost discovery</span>
//             <span className="cp-tip-desc">
//               Your reels auto-publish to the Reels page and surface in Home & Browse feeds.
//             </span>
//           </div>
//         </div>
//       </div>

//       <style>{`
//         .cp-page {
//           min-height: 100vh;
//           background: var(--bg);
//           padding: 18px 18px 40px;
//           font-family: 'Poppins', sans-serif;
//           color: var(--text-dark);
//           transition: background-color 0.3s ease, color 0.3s ease;
//         }

//         .cp-inner {
//           width: 100%;
//           max-width: 480px;
//           margin: 0 auto;
//         }

//         /* TOPBAR */
//         .cp-topbar {
//           display: flex;
//           align-items: center;
//           gap: 10px;
//           margin-bottom: 18px;
//         }

//         .cp-title {
//           flex: 1;
//           font-size: 1.5rem;
//           font-weight: 800;
//           margin: 0;
//           color: var(--text-dark);
//           letter-spacing: -0.02em;
//         }

//         .cp-topbar-actions {
//           display: flex;
//           gap: 8px;
//         }

//         .cp-icon-btn {
//           width: 38px;
//           height: 38px;
//           border-radius: 999px;
//           border: none;
//           background: rgba(0, 0, 0, 0.05);
//           color: var(--text-dark);
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           cursor: pointer;
//           transition: background 0.15s;
//           flex-shrink: 0;
//         }

//         .cp-icon-btn:hover {
//           background: rgba(0, 0, 0, 0.1);
//         }

//         html[data-theme='dark'] .cp-icon-btn {
//           background: rgba(255, 255, 255, 0.08);
//           color: #fff;
//         }

//         html[data-theme='dark'] .cp-icon-btn:hover {
//           background: rgba(255, 255, 255, 0.14);
//         }

//         .cp-sub {
//           font-size: 0.9rem;
//           color: var(--text-muted);
//           margin: 0 0 20px;
//         }

//         /* OPTIONS */
//         .cp-options {
//           display: flex;
//           flex-direction: column;
//           gap: 12px;
//           margin-bottom: 18px;
//         }

//         .cp-card {
//           display: flex;
//           align-items: center;
//           gap: 14px;
//           width: 100%;
//           border: none;
//           border-radius: 18px;
//           padding: 16px;
//           cursor: pointer;
//           text-align: left;
//           font-family: inherit;
//           background: var(--card-bg);
//           color: var(--text-dark);
//           box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
//           transition: transform 0.15s, box-shadow 0.15s;
//         }

//         html[data-theme='dark'] .cp-card {
//           background: #1a1a1a;
//           box-shadow: none;
//           border: 1px solid #2a2a2a;
//         }

//         .cp-card:hover {
//           transform: translateY(-1px);
//           box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
//         }

//         html[data-theme='dark'] .cp-card:hover {
//           border-color: rgba(228, 88, 33, 0.35);
//         }

//         .cp-card:active {
//           transform: translateY(0);
//         }

//         .cp-icon {
//           width: 46px;
//           height: 46px;
//           min-width: 46px;
//           border-radius: 14px;
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           color: #fff;
//         }

//         .cp-card-text {
//           flex: 1;
//           min-width: 0;
//           display: flex;
//           flex-direction: column;
//           gap: 3px;
//         }

//         .cp-card-label {
//           font-size: 0.96rem;
//           font-weight: 700;
//           color: var(--text-dark);
//         }

//         html[data-theme='dark'] .cp-card-label {
//           color: #fff;
//         }

//         .cp-card-desc {
//           font-size: 0.78rem;
//           color: var(--text-muted);
//           line-height: 1.4;
//         }

//         .cp-chevron {
//           color: var(--text-muted);
//           flex-shrink: 0;
//         }

//         /* TIP */
//         .cp-tip {
//           display: flex;
//           gap: 12px;
//           align-items: flex-start;
//           background: rgba(228, 88, 33, 0.08);
//           border: 1px solid rgba(228, 88, 33, 0.18);
//           border-radius: 16px;
//           padding: 14px 16px;
//         }

//         html[data-theme='dark'] .cp-tip {
//           background: rgba(228, 88, 33, 0.1);
//           border-color: rgba(228, 88, 33, 0.22);
//         }

//         .cp-tip-icon {
//           width: 32px;
//           height: 32px;
//           min-width: 32px;
//           border-radius: 999px;
//           background: #E45821;
//           color: #fff;
//           display: flex;
//           align-items: center;
//           justify-content: center;
//         }

//         .cp-tip-text {
//           display: flex;
//           flex-direction: column;
//           gap: 3px;
//         }

//         .cp-tip-title {
//           font-size: 0.88rem;
//           font-weight: 700;
//           color: var(--text-dark);
//         }

//         html[data-theme='dark'] .cp-tip-title {
//           color: #fff;
//         }

//         .cp-tip-desc {
//           font-size: 0.78rem;
//           line-height: 1.4;
//           color: var(--text-muted);
//         }
//       `}</style>
//     </div>
//   );
// };

// export default CreatePage;




import { useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiFilm,
  FiCamera,
  FiBox,
  FiChevronRight,
  FiArrowUpRight,
} from "react-icons/fi";

const OPTIONS = [
  {
    icon: <FiFilm size={22} />,
    iconDesktop: <FiFilm size={26} />,
    iconBg: "#7C5CFC",
    label: "Upload Reel",
    desc: "Short product video — appears on Reels, Home & Browse",
    route: "/reel-upload",
  },
  // {
  //   icon: <FiCamera size={22} />,
  //   iconDesktop: <FiCamera size={26} />,
  //   iconBg: "#E45821",
  //   label: "Upload Story",
  //   desc: "24-hour story — shows at the top of Home",
  //   route: "/create-story",
  // },
  {
    icon: <FiBox size={22} />,
    iconDesktop: <FiBox size={26} />,
    iconBg: "#2E2E33",
    label: "List an Item",
    desc: "Add a product you want to swap",
    route: "/list-product",
  },
];

const CreatePage = () => {
  const navigate = useNavigate();

  return (
    <div className="cp-page">
      <div className="cp-inner">

        {/* HEADER */}
        <div className="cp-topbar">
          <button className="cp-icon-btn" onClick={() => navigate(-1)} aria-label="Back">
            <FiArrowLeft size={20} />
          </button>
          <h1 className="cp-title">Create</h1>

        </div>

        <p className="cp-sub">What would you like to share?</p>

        {/* OPTIONS */}
        <div className="cp-options">
          {OPTIONS.map((opt) => (
            <button
              key={opt.label}
              className="cp-card"
              onClick={() => navigate(opt.route)}
            >
              <div className="cp-card-accent" style={{ background: opt.iconBg }} />
              <div className="cp-icon" style={{ background: opt.iconBg }}>
                {opt.icon}
              </div>
              <div className="cp-icon-desktop" style={{ background: opt.iconBg }}>
                {opt.iconDesktop}
              </div>
              <div className="cp-card-text">
                <span className="cp-card-label">{opt.label}</span>
                <span className="cp-card-desc">{opt.desc}</span>
              </div>
              <FiChevronRight size={18} className="cp-chevron" />
              <span className="cp-card-cta">
                Get started <FiArrowUpRight size={14} />
              </span>
            </button>
          ))}
        </div>

        {/* TIP */}
        
      </div>

      <style>{`
        .cp-page {
          min-height: 100vh;
          background: var(--bg);
          padding: 18px 18px 40px;
          font-family: 'Poppins', sans-serif;
          color: var(--text-dark);
          transition: background-color 0.3s ease, color 0.3s ease;
        }

        .cp-inner {
          width: 100%;
          max-width: 480px;
          margin: 0 auto;
        }

        /* TOPBAR */
        .cp-topbar {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 18px;
        }

        .cp-title {
          flex: 1;
          font-size: 1.5rem;
          font-weight: 800;
          margin: 0;
          color: var(--text-dark);
          letter-spacing: -0.02em;
        }

        .cp-topbar-actions {
          display: flex;
          gap: 8px;
        }

        .cp-icon-btn {
          width: 38px;
          height: 38px;
          border-radius: 999px;
          border: none;
          background: rgba(0, 0, 0, 0.05);
          color: var(--text-dark);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.15s;
          flex-shrink: 0;
        }

        .cp-icon-btn:hover {
          background: rgba(0, 0, 0, 0.1);
        }

        html[data-theme='dark'] .cp-icon-btn {
          background: rgba(255, 255, 255, 0.08);
          color: #fff;
        }

        html[data-theme='dark'] .cp-icon-btn:hover {
          background: rgba(255, 255, 255, 0.14);
        }

        .cp-sub {
          font-size: 0.9rem;
          color: var(--text-muted);
          margin: 0 0 20px;
        }

        /* OPTIONS */
        .cp-options {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 18px;
        }

        .cp-card {
          display: flex;
          align-items: center;
          gap: 14px;
          width: 100%;
          border: none;
          border-radius: 18px;
          padding: 16px;
          cursor: pointer;
          text-align: left;
          font-family: inherit;
          background: var(--card-bg);
          color: var(--text-dark);
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
          transition: transform 0.15s, box-shadow 0.15s;
          position: relative;
        }

        html[data-theme='dark'] .cp-card {
          background: #1a1a1a;
          box-shadow: none;
          border: 1px solid #2a2a2a;
        }

        .cp-card:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
        }

        html[data-theme='dark'] .cp-card:hover {
          border-color: rgba(228, 88, 33, 0.35);
        }

        .cp-card:active {
          transform: translateY(0);
        }

        .cp-card-accent {
          display: none;
        }

        .cp-icon {
          width: 46px;
          height: 46px;
          min-width: 46px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
        }

        .cp-icon-desktop {
          display: none;
        }

        .cp-card-text {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .cp-card-label {
          font-size: 0.96rem;
          font-weight: 700;
          color: var(--text-dark);
        }

        html[data-theme='dark'] .cp-card-label {
          color: #fff;
        }

        .cp-card-desc {
          font-size: 0.78rem;
          color: var(--text-muted);
          line-height: 1.4;
        }

        .cp-chevron {
          color: var(--text-muted);
          flex-shrink: 0;
        }

        .cp-card-cta {
          display: none;
        }

        /* TIP */
        .cp-tip {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          background: rgba(228, 88, 33, 0.08);
          border: 1px solid rgba(228, 88, 33, 0.18);
          border-radius: 16px;
          padding: 14px 16px;
        }

        html[data-theme='dark'] .cp-tip {
          background: rgba(228, 88, 33, 0.1);
          border-color: rgba(228, 88, 33, 0.22);
        }

        .cp-tip-icon {
          width: 32px;
          height: 32px;
          min-width: 32px;
          border-radius: 999px;
          background: #E45821;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .cp-tip-text {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .cp-tip-title {
          font-size: 0.88rem;
          font-weight: 700;
          color: var(--text-dark);
        }

        html[data-theme='dark'] .cp-tip-title {
          color: #fff;
        }

        .cp-tip-desc {
          font-size: 0.78rem;
          line-height: 1.4;
          color: var(--text-muted);
        }

        /* ============================================== */
        /* Desktop / tablet-landscape layout (>800px)      */
        /* Same theme tokens & colors, restructured layout */
        /* ============================================== */
        @media (min-width: 801px) {
          .cp-page {
            padding: 48px 32px 64px;
            display: flex;
            justify-content: center;
          }

          .cp-inner {
            max-width: 880px;
          }

          .cp-topbar {
            margin-bottom: 6px;
          }

          .cp-title {
            font-size: 2rem;
          }

          .cp-icon-btn {
            width: 42px;
            height: 42px;
          }

          .cp-sub {
            font-size: 1rem;
            margin-bottom: 32px;
          }

          .cp-options {
            flex-direction: row;
            gap: 20px;
            margin-bottom: 28px;
            align-items: stretch;
          }

          .cp-card {
            flex: 1;
            flex-direction: column;
            align-items: flex-start;
            gap: 0;
            padding: 0 22px 22px;
            border-radius: 20px;
            overflow: hidden;
          }

          .cp-card-accent {
            display: block;
            width: 100%;
            height: 5px;
            margin: 0 -22px 22px;
            width: calc(100% + 44px);
          }

          .cp-icon {
            display: none;
          }

          .cp-icon-desktop {
            display: flex;
            width: 52px;
            height: 52px;
            border-radius: 15px;
            align-items: center;
            justify-content: center;
            color: #fff;
            margin-bottom: 18px;
          }

          .cp-card-text {
            gap: 6px;
            margin-bottom: 22px;
          }

          .cp-card-label {
            font-size: 1.08rem;
          }

          .cp-card-desc {
            font-size: 0.82rem;
            min-height: 2.6em;
          }

          .cp-chevron {
            display: none;
          }

          .cp-card-cta {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            font-size: 0.8rem;
            font-weight: 700;
            color: #E45821;
            margin-top: auto;
          }

          .cp-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 14px 30px rgba(0, 0, 0, 0.1);
          }

          .cp-tip {
            padding: 18px 22px;
          }

          .cp-tip-desc {
            font-size: 0.82rem;
          }
        }
      `}</style>
    </div>
  );
};

export default CreatePage;
