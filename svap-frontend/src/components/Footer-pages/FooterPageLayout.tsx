import { Link } from "react-router-dom";

interface FooterPageLayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

/**
 * Shared layout for all footer-related pages (About, Privacy, Terms, etc.)
 * Provides a clean, readable article-style container that respects the
 * site's dark / light theme and stays inside the normal app layout
 * (sidebar + top-navbar).
 */
const FooterPageLayout = ({ title, subtitle, children }: FooterPageLayoutProps) => {
  return (
    <div className="fp-page">
      <div className="fp-container">
        <nav className="fp-breadcrumb">
          <Link to="/" className="fp-breadcrumb-link">Home</Link>
          <span className="fp-breadcrumb-sep">›</span>
          <span className="fp-breadcrumb-current">{title}</span>
        </nav>

        <article className="fp-article">
          <h1 className="fp-title">{title}</h1>
          {subtitle && <p className="fp-subtitle">{subtitle}</p>}
          <div className="fp-content">
            {children}
          </div>
        </article>
      </div>

      <style>{`
        .fp-page {
          min-height: 100vh;
          background: var(--bg);
          color: var(--text-dark);
          font-family: 'Poppins', sans-serif;
          padding: 24px 16px 60px;
          box-sizing: border-box;
        }

        .fp-container {
          max-width: 760px;
          margin: 0 auto;
        }

        /* Breadcrumb */
        .fp-breadcrumb {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.76rem;
          color: var(--text-muted);
          font-weight: 500;
          margin-bottom: 24px;
        }
        .fp-breadcrumb-link {
          color: var(--text-muted);
          text-decoration: none;
          transition: color 0.2s;
        }
        .fp-breadcrumb-link:hover { color: var(--btn-swap); }
        .fp-breadcrumb-sep { color: var(--text-muted); opacity: 0.5; }

        /* Article */
        .fp-article { width: 100%; }

        .fp-title {
          font-size: clamp(1.7rem, 3vw, 2.1rem);
          font-weight: 700;
          line-height: 1.15;
          letter-spacing: -0.02em;
          color: var(--text-dark);
          margin: 0 0 8px;
        }
        html[data-theme='dark'] .fp-title { color: #f5f5f5; }

        .fp-subtitle {
          font-size: 0.92rem;
          color: var(--text-muted);
          line-height: 1.6;
          margin: 0 0 28px;
          max-width: 640px;
        }
        html[data-theme='dark'] .fp-subtitle { color: #999; }

        /* Content */
        .fp-content {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .fp-content h2 {
          font-size: 1.15rem;
          font-weight: 600;
          color: var(--text-dark);
          margin: 18px 0 10px;
          line-height: 1.3;
        }
        html[data-theme='dark'] .fp-content h2 { color: #f5f5f5; }

        .fp-content h3 {
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--text-dark);
          margin: 16px 0 8px;
        }
        html[data-theme='dark'] .fp-content h3 { color: #f5f5f5; }

        .fp-content p {
          font-size: 0.86rem;
          line-height: 1.75;
          color: var(--text-dark);
          margin: 0;
        }
        html[data-theme='dark'] .fp-content p { color: #d0d0d0; }

        .fp-content ul,
        .fp-content ol {
          margin: 8px 0;
          padding-left: 22px;
        }
        .fp-content li {
          font-size: 0.86rem;
          line-height: 1.75;
          color: var(--text-dark);
          margin-bottom: 4px;
        }
        html[data-theme='dark'] .fp-content li { color: #d0d0d0; }

        .fp-content a {
          color: var(--btn-swap);
          text-decoration: none;
          font-weight: 500;
        }
        .fp-content a:hover { text-decoration: underline; }

        .fp-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 12px 0;
          font-size: 0.84rem;
        }
        .fp-content th,
        .fp-content td {
          text-align: left;
          padding: 8px 10px;
          border-bottom: 1px solid var(--border-light);
        }
        .fp-content th {
          font-weight: 600;
          color: var(--text-dark);
        }
        html[data-theme='dark'] .fp-content th { color: #f5f5f5; }
        html[data-theme='dark'] .fp-content td { color: #aaa; }

        .fp-content .fp-highlight {
          background: rgba(228, 88, 33, 0.08);
          border-left: 3px solid var(--btn-swap);
          padding: 14px 18px;
          border-radius: 0 8px 8px 0;
          margin: 16px 0;
        }
        html[data-theme='dark'] .fp-content .fp-highlight {
          background: rgba(228, 88, 33, 0.12);
        }

        /* Responsive */
        @media (max-width: 640px) {
          .fp-page { padding: 16px 12px 50px; }
          .fp-title { font-size: 1.5rem; }
        }
      `}</style>
    </div>
  );
};

export default FooterPageLayout;
