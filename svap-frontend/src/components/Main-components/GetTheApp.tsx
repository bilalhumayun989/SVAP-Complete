import { QRCodeSVG } from "qrcode.react";
import { FaGooglePlay, FaApple } from "react-icons/fa";

const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.swapzone";
const APP_STORE_URL  = "https://apps.apple.com/app/swapzone/id000000000";

const GetTheApp = () => {
  return (
    <>
      <div className="gta-card">
        <h4 className="gta-title">Get the App</h4>
        <p className="gta-sub">Download SVAP and start buying, selling & swapping on the go.</p>

        {/* QR */}
        <div className="gta-qr-wrap">
          <QRCodeSVG
            value={PLAY_STORE_URL}
            size={100}
            bgColor="transparent"
            fgColor="#111"
            level="M"
          />
        </div>
        <p className="gta-scan-label">Scan to download</p>

        {/* Store buttons */}
        <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer" className="gta-store-btn">
          <FaGooglePlay size={16} />
          <div>
            <p className="gta-store-sub">Get it on</p>
            <p className="gta-store-name">Google Play</p>
          </div>
        </a>

        <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer" className="gta-store-btn">
          <FaApple size={18} />
          <div>
            <p className="gta-store-sub">Download on the</p>
            <p className="gta-store-name">App Store</p>
          </div>
        </a>

        {/* Stats strip */}
        <div className="gta-stats">
          <div className="gta-stat">
            <span className="gta-stat-val">50K+</span>
            <span className="gta-stat-lbl">Users</span>
          </div>
          <div className="gta-stat-divider" />
          <div className="gta-stat">
            <span className="gta-stat-val">120K+</span>
            <span className="gta-stat-lbl">Listings</span>
          </div>
          <div className="gta-stat-divider" />
          <div className="gta-stat">
            <span className="gta-stat-val">4.8★</span>
            <span className="gta-stat-lbl">Rating</span>
          </div>
        </div>
      </div>

      <style>{`
        .gta-card {
          background: #fff;
          border: 1px solid #efefef;
          border-radius: 16px;
          padding: 20px 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          font-family: 'Poppins', sans-serif;
          box-shadow: 0 2px 12px rgba(0,0,0,0.05);
        }

        .gta-title {
          font-size: 1rem;
          font-weight: 800;
          color: #111;
          margin: 0;
          letter-spacing: -0.01em;
        }

        .gta-sub {
          font-size: 0.75rem;
          color: #888;
          text-align: center;
          line-height: 1.5;
          margin: 0;
        }

        .gta-qr-wrap {
          background: #f9f9f9;
          border: 1px solid #efefef;
          border-radius: 12px;
          padding: 10px;
          margin: 4px 0;
        }

        .gta-scan-label {
          font-size: 0.7rem;
          color: #aaa;
          font-weight: 600;
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .gta-store-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 10px 14px;
          border-radius: 10px;
          border: 1px solid #efefef;
          background: #fafafa;
          text-decoration: none;
          color: #111;
          transition: background 0.18s, box-shadow 0.18s;
        }
        .gta-store-btn:hover {
          background: #fff;
          box-shadow: 0 4px 14px rgba(0,0,0,0.08);
        }

        .gta-store-sub {
          font-size: 0.6rem;
          color: #aaa;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin: 0;
        }
        .gta-store-name {
          font-size: 0.82rem;
          font-weight: 700;
          color: #111;
          margin: 1px 0 0;
        }

        .gta-stats {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0;
          width: 100%;
          margin-top: 6px;
          background: #f9f9f9;
          border-radius: 10px;
          padding: 10px 0;
        }

        .gta-stat {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
        }

        .gta-stat-val {
          font-size: 0.88rem;
          font-weight: 800;
          color: #E45821;
        }

        .gta-stat-lbl {
          font-size: 0.65rem;
          color: #aaa;
          font-weight: 600;
        }

        .gta-stat-divider {
          width: 1px;
          height: 30px;
          background: #e5e5e5;
        }
      `}</style>
    </>
  );
};

export default GetTheApp;
