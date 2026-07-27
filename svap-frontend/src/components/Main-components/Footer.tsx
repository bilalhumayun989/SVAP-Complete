import { QRCodeSVG } from "qrcode.react";
import { Link } from "react-router-dom";
import { FaGooglePlay, FaApple, FaTwitter, FaInstagram, FaFacebookF, FaLinkedinIn } from "react-icons/fa";
import { FiMail } from "react-icons/fi";

const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.swapzone";
const APP_STORE_URL  = "https://apps.apple.com/app/swapzone/id000000000";
const QR_URL         = PLAY_STORE_URL;

const footerLinks = [
    {
      heading: "Explore",
      links: [
        { label: "Electronics", href: "/category/Electronics" },
        { label: "Fashion",     href: "/category/Fashion" },
        { label: "Gaming",      href: "/category/Gaming" },
        { label: "Vehicles",    href: "/category/Vehicles" },
        { label: "Books",       href: "/category/Books" },
        { label: "Home",        href: "/category/Home" },
      ],
    },
    {
      heading: "Company",
      links: [
        { label: "About Us",    href: "/about" },
        { label: "Categories",  href: "/categories" },
        { label: "My Orders",   href: "/orders" },
      ],
    },
    {
      heading: "Support",
      links: [
        { label: "Help Center",      href: "/help-center" },
        { label: "Safety Tips",      href: "/safety-tips" },
        { label: "Report a Problem", href: "/report-a-problem" },
        { label: "Contact Us",       href: "/contact-us" },
      ],
    },
];

const socials = [
  { icon: <FaTwitter />,   href: "https://twitter.com/svap_app" },
  { icon: <FaInstagram />, href: "https://instagram.com/svap.app" },
  { icon: <FaFacebookF />, href: "https://facebook.com/svap.app" },
  { icon: <FaLinkedinIn />, href: "https://linkedin.com/company/svap-app" },
];

const legalLinks = [
  { label: "Privacy Policy",     href: "/privacy-policy" },
  { label: "Terms of Service",   href: "/terms-of-service" },
  { label: "Cookie Policy",      href: "/cookie-policy" },
];


const Footer = () => {
  return (
    <>
      <footer className="ft-root">

        {/* ── Glass card wrapper ── */}
        <div className="ft-glass">
          <div className="ft-inner">

            {/* ══ TOP SECTION ══ */}
            <div className="ft-top">

              {/* Col 1 — Brand + contact */}
              <div className="ft-brand">
                <span className="ft-logo">SVAP</span>
                <p className="ft-tagline">
                  Pakistan's smartest platform to buy, sell &amp; svap products
                  securely with verified users.
                </p>

                <div className="ft-contact-list">
                  <div className="ft-contact-item">
                    <FiMail className="ft-contact-icon" />
                    <span>support@svap.app</span>
                  </div>
                  {/* <div className="ft-contact-item">
                    <FiPhone className="ft-contact-icon" />
                    <span>+92 300 000000</span>
                  </div> */}
                  {/* <div className="ft-contact-item">
                    <FiMapPin className="ft-contact-icon" />
                  </div> */}
                </div>

                {/* Socials */}
                <div className="ft-socials">
                  {socials.map((s, i) => (
                    <a key={i} href={s.href} className="ft-social-btn" aria-label="social" target="_blank" rel="noopener noreferrer">
                      {s.icon}
                    </a>
                  ))}
                </div>
              </div>

              {/* Col 2-4 — Nav link columns */}
              {footerLinks.map((col) => (
                <div key={col.heading} className="ft-linkcol">
                  <h4 className="ft-col-heading">{col.heading}</h4>
                  <ul className="ft-link-list">
                    {col.links.map((link) => (
                      <li key={link.label}>
                        <Link to={link.href} className="ft-link">{link.label}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}


              <div className="ft-app-col">
                <h4 className="ft-col-heading">Get the App</h4>

                {/* Store buttons */}
                <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer" className="ft-store-btn">
                  <FaGooglePlay className="ft-store-icon" />
                  <div>
                    <p className="ft-store-sub">Get it on</p>
                    <p className="ft-store-name">Google Play</p>
                  </div>
                </a>

                <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer" className="ft-store-btn">
                  <FaApple className="ft-store-icon" />
                  <div>
                    <p className="ft-store-sub">Download on the</p>
                    <p className="ft-store-name">App Store</p>
                  </div>
                </a>

                {/* QR */}
                <div className="ft-qr-wrap">
                  <div className="ft-qr-box">
                    <QRCodeSVG
                      value={QR_URL}
                      size={76}
                      bgColor="transparent"
                      fgColor="#111"
                      level="M"
                    />
                  </div>
                  <div>
                    <p className="ft-qr-label">Scan to Download</p>
                    <p className="ft-qr-sub">svap.app</p>
                  </div>
                </div>
              </div>

            </div>

            {/* ── Divider ── */}
            <div className="ft-divider" />

            {/* ══ BOTTOM BAR ══ */}
            <div className="ft-bottom">
              <p className="ft-copy">
                © {new Date().getFullYear()} SVAP. All rights reserved.
              </p>
              <div className="ft-legal">
                {legalLinks.map((link) => (
                  <Link key={link.label} to={link.href} className="ft-legal-link">{link.label}</Link>
                ))}
              </div>


            </div>

          </div>
        </div>
      </footer>

      <style>{`
        /* ── Root ── */
        .ft-root {
          width: 100%;
          background: var(--bg);
          padding: 20px 20px 20px;
          box-sizing: border-box;
        }

        /* ── Glass card ── */
        .ft-glass {
          width: 100%;
          max-width: 2400px;
          margin: 0 auto;
          border-radius: 12px;
          background: rgba(255,255,255,0.95);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          border: 1px solid rgba(165,194,111,0.18);
          box-shadow: 0 16px 40px rgba(0,0,0,0.08);
          overflow: hidden;
        }

        /* Dark mode glassmorphism */
        html[data-theme='dark'] .ft-glass {
          background: rgba(26, 26, 26, 0.45);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.12);
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.5);
        }

        .ft-inner {
          padding: 48px 48px 32px;
          box-sizing: border-box;
        }

        /* ══ TOP ══ */
        .ft-top {
          display: grid;
          grid-template-columns: 1.6fr 1fr 1fr 1fr 1.4fr;
          gap: 40px;
          align-items: start;
        }

        /* Brand col */
        .ft-brand { display: flex; flex-direction: column; gap: 14px; }

        .ft-logo {
          color: var(--text-dark);
          font-size: 1.7rem;
          font-weight: 800;
          letter-spacing: -0.03em;
        }

        .ft-tagline {
          color: var(--text-dark);
          font-size: 0.82rem;
          line-height: 1.65;
          margin: 0;
          max-width: 240px;
        }

        .ft-contact-list { display: flex; flex-direction: column; gap: 8px; }
        .ft-contact-item {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--text-dark);
          font-size: 0.80rem;
        }
        .ft-contact-icon { color: rgba(26,46,10,0.35); flex-shrink: 0; }

        html[data-theme='dark'] .ft-contact-item {
          color: #fff;
        }
        html[data-theme='dark'] .ft-contact-icon {
          color: rgba(255, 255, 255, 0.5);
        }

        .ft-socials { display: flex; gap: 10px; margin-top: 4px; }
        .ft-social-btn {
          width: 34px; height: 34px;
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          color: var(--text-dark);
          font-size: 0.9rem;
          transition: all 0.2s;
          background: rgba(26,46,10,0.06);
          border: 1px solid rgba(26,46,10,0.08);
        }
        .ft-social-btn:hover {
          background: rgba(26,46,10,0.12);
          color: var(--text-dark);
          transform: translateY(-2px);
        }

        html[data-theme='dark'] .ft-social-btn {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.15);
        }
        html[data-theme='dark'] .ft-social-btn:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        /* Link columns */
        .ft-linkcol { display: flex; flex-direction: column; gap: 14px; }

        .ft-col-heading {
          color: var(--text-dark);
          font-size: 0.85rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin: 0;
        }

        .ft-link-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }

        .ft-link {
          color: var(--text-dark);
          font-size: 0.83rem;
          text-decoration: none;
          transition: color 0.2s;
        }
        .ft-link:hover { color: #E45821; }

        /* App col */
        .ft-app-col { display: flex; flex-direction: column; gap: 12px; }

        .ft-store-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          border-radius: 10px;
          text-decoration: none;
          transition: all 0.2s;
          background: rgba(247, 243, 224, 0.95);
          border: 1px solid rgba(165,194,111,0.24);
          backdrop-filter: blur(12px);
        }
        .ft-store-btn:hover {
          transform: translateY(-2px);
        }
        .ft-store-icon { font-size: 1.4rem; color: var(--text-dark); flex-shrink: 0; }
        .ft-store-sub  { color: var(--text-mid); font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.12em; margin: 0; }
        .ft-store-name { color: var(--text-dark); font-size: 0.88rem; font-weight: 600; margin: 2px 0 0; }

        html[data-theme='dark'] .ft-store-btn {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.12);
        }
        html[data-theme='dark'] .ft-store-sub {
          color: rgba(255, 255, 255, 0.6);
        }
        html[data-theme='dark'] .ft-store-name {
          color: #fff;
        }

        /* QR block */
        .ft-qr-wrap {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border-radius: 10px;
          background: rgba(247, 243, 224, 0.95);
          border: 1px solid rgba(165,194,111,0.18);
          margin-top: 4px;
        }
        .ft-qr-box {
          background: #fff;
          border-radius: 8px;
          padding: 6px;
          flex-shrink: 0;
        }
        .ft-qr-label { color: var(--text-dark); font-size: 0.80rem; font-weight: 600; margin: 0; }
        .ft-qr-sub   { color: var(--text-dark); font-size: 0.72rem; margin: 3px 0 0; }

        html[data-theme='dark'] .ft-qr-wrap {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.12);
        }
        html[data-theme='dark'] .ft-qr-box {
          background: rgba(255, 255, 255, 0.1);
        }
        html[data-theme='dark'] .ft-qr-label {
          color: #fff;
        }
        html[data-theme='dark'] .ft-qr-sub {
          color: rgba(255, 255, 255, 0.7);
        }

        /* ── Divider ── */
        .ft-divider {
          width: 100%;
          height: 1px;
          background: rgba(18, 31, 7, 0.1);
          margin: 36px 0 24px;
        }

        html[data-theme='dark'] .ft-divider {
          background: rgba(255, 255, 255, 0.1);
        }

        /* ── Bottom bar ── */
        .ft-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
        }
        .ft-copy {
          color: var(--text-dark);
          font-size: 0.78rem;
          margin: 0;
        }
        .ft-legal { display: flex; gap: 20px; flex-wrap: wrap; }
        .ft-legal-link {
          color: var(--text-dark);
          font-size: 0.78rem;
          text-decoration: none;
          transition: color 0.2s;
        }
        .ft-legal-link:hover { color: #E45821; }

        /* ════════════════════════════
           MEDIA QUERIES
        ════════════════════════════ */

        /* 1280px – 1599px */
        @media (max-width: 1599px) {
          .ft-inner { padding: 40px 36px 28px; }
          .ft-top   { gap: 28px; }
        }

        /* ≤ 1280px — 3 cols */
        @media (max-width: 1280px) {
          .ft-inner { padding: 36px 28px 24px; }
          .ft-top {
            grid-template-columns: 1fr 1fr 1fr;
            gap: 28px;
          }
          .ft-app-col { grid-column: 1 / -1; flex-direction: row; flex-wrap: wrap; align-items: flex-start; gap: 16px; }
          .ft-app-col .ft-col-heading { width: 100%; }
        }

        /* ≤ 900px — 2 cols */
        @media (max-width: 900px) {
          .ft-top {
            grid-template-columns: 1fr 1fr;
            gap: 24px;
          }
          .ft-brand    { grid-column: 1 / -1; }
          .ft-app-col  { grid-column: 1 / -1; }
        }

        /* ≤ 600px — 1 col */
        @media (max-width: 600px) {
          .ft-root  { padding: 2px 12px 12px; }
          .ft-inner { padding: 28px 20px 20px; }
          .ft-glass { border-radius: 8px; }
          .ft-top   { grid-template-columns: 1fr; gap: 24px; }
          .ft-app-col { flex-direction: column; }
          .ft-bottom { flex-direction: column; align-items: flex-start; gap: 10px; }
          .ft-legal  { gap: 14px; }
        }

        /* ≥ 1920px */
        @media (min-width: 1920px) {
          .ft-inner { padding: 56px 60px 40px; }
          .ft-top   { gap: 48px; }
        }
      `}</style>
    </>
  );
};

export default Footer;
