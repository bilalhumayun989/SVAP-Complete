import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiCamera, FiUser, FiMapPin, FiMail, FiPhone, FiCheck, FiLink } from "react-icons/fi";

const EditProfilePage = () => {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const raw = localStorage.getItem("sz_user");
  const saved = raw ? JSON.parse(raw) : {};

  const [avatar, setAvatar] = useState<string>(saved.avatar || "");
  const [name, setName] = useState(saved.name || "");
  const [username, setUsername] = useState(saved.username || "");
  const [bio, setBio] = useState(saved.bio || "");
  const [city, setCity] = useState(saved.city || "");
  const [email, setEmail] = useState(saved.email || "");
  const [phone, setPhone] = useState(saved.phone || "");
  const [website, setWebsite] = useState(saved.website || "");
  const [saved2, setSaved2] = useState(false);

  const handleAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setAvatar(url);
  };

  const handleSave = () => {
    const updated = { ...saved, name, username, bio, city, email, phone, website, avatar };
    localStorage.setItem("sz_user", JSON.stringify(updated));
    window.dispatchEvent(new Event("sz_auth_change"));
    setSaved2(true);
    setTimeout(() => { setSaved2(false); navigate("/profile"); }, 1000);
  };

  return (
    <div className="ep-page">
      {/* Header */}
      <div className="ep-header">
        <button className="ep-back" onClick={() => navigate("/profile")} aria-label="Back">
          <FiArrowLeft size={20} />
        </button>
        <h1 className="ep-title">Edit Profile</h1>
        <button className="ep-save-btn" onClick={handleSave} disabled={saved2}>
          {saved2 ? <FiCheck size={16} /> : "Save"}
        </button>
      </div>

      <div className="ep-body">
        {/* Avatar */}
        <div className="ep-avatar-section">
          <div className="ep-avatar-wrap" onClick={() => fileRef.current?.click()}>
            {avatar ? (
              <img src={avatar} alt="Avatar" className="ep-avatar-img" />
            ) : (
              <div className="ep-avatar-placeholder">
                <span className="ep-avatar-letter">{name?.[0]?.toUpperCase() || "U"}</span>
              </div>
            )}
            <div className="ep-avatar-overlay">
              <FiCamera size={20} color="#fff" />
            </div>
          </div>
          <p className="ep-change-label">Change photo</p>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatar} />
        </div>

        {/* Form */}
        <div className="ep-form">
          <div className="ep-section-label">Personal Info</div>

          <div className="ep-field">
            <div className="ep-field-icon"><FiUser size={16} /></div>
            <div className="ep-field-body">
              <label className="ep-label">Full Name</label>
              <input className="ep-input" value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" />
            </div>
          </div>

          <div className="ep-field">
            <div className="ep-field-icon">@</div>
            <div className="ep-field-body">
              <label className="ep-label">Username</label>
              <input className="ep-input" value={username} onChange={e => setUsername(e.target.value)} placeholder="@username" />
            </div>
          </div>

          <div className="ep-field ep-field--textarea">
            <div className="ep-field-icon"><FiUser size={16} /></div>
            <div className="ep-field-body">
              <label className="ep-label">Bio</label>
              <textarea
                className="ep-textarea"
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="Tell people about yourself..."
                maxLength={150}
                rows={3}
              />
              <span className="ep-char">{bio.length}/150</span>
            </div>
          </div>

          <div className="ep-divider" />
          <div className="ep-section-label">Contact & Location</div>

          <div className="ep-field">
            <div className="ep-field-icon"><FiMapPin size={16} /></div>
            <div className="ep-field-body">
              <label className="ep-label">City</label>
              <input className="ep-input" value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. Karachi" />
            </div>
          </div>

          <div className="ep-field">
            <div className="ep-field-icon"><FiMail size={16} /></div>
            <div className="ep-field-body">
              <label className="ep-label">Email</label>
              <input className="ep-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" />
            </div>
          </div>

          <div className="ep-field">
            <div className="ep-field-icon"><FiPhone size={16} /></div>
            <div className="ep-field-body">
              <label className="ep-label">Phone</label>
              <input className="ep-input" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+92 300 0000000" />
            </div>
          </div>

          <div className="ep-field">
            <div className="ep-field-icon"><FiLink size={16} /></div>
            <div className="ep-field-body">
              <label className="ep-label">Website / Link</label>
              <input className="ep-input" value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://yoursite.com" />
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .ep-page {
          min-height: 100vh;
          background: #fff;
          font-family: 'Poppins', sans-serif;
          color: #111;
        }

        /* Header */
        .ep-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 16px;
          border-bottom: 1px solid #f0f0f0;
          background: #fff;
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .ep-back {
          background: none;
          border: none;
          cursor: pointer;
          color: #111;
          display: flex;
          align-items: center;
          padding: 6px;
          border-radius: 8px;
          transition: background 0.15s;
        }
        .ep-back:hover { background: #f5f5f5; }

        .ep-title {
          font-size: 1rem;
          font-weight: 700;
          margin: 0;
          color: #111;
        }

        .ep-save-btn {
          background: #E45821;
          color: #fff;
          border: none;
          border-radius: 10px;
          padding: 8px 20px;
          font-size: 0.88rem;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
          transition: background 0.18s, transform 0.18s;
          display: flex;
          align-items: center;
          gap: 4px;
          min-width: 64px;
          justify-content: center;
        }
        .ep-save-btn:hover:not(:disabled) { background: #c94d1c; transform: translateY(-1px); }
        .ep-save-btn:disabled { opacity: 0.75; cursor: default; }



        /* ==========================
   Dark Mode
========================== */

html[data-theme='dark'] .ep-page {
  background: var(--bg);
  color: var(--text-dark);
}

html[data-theme='dark'] .ep-header {
  background: var(--bg);
  border-bottom: 1px solid rgba(255,255,255,0.08);
}

html[data-theme='dark'] .ep-back {
  color: var(--text-dark);
}

html[data-theme='dark'] .ep-back:hover {
  background: rgba(255,255,255,0.08);
}

html[data-theme='dark'] .ep-title {
  color: var(--text-dark);
}

html[data-theme='dark'] .ep-divider {
  background: var(--bg-section);
}

html[data-theme='dark'] .ep-section-label {
  color: var(--text-muted);
}

html[data-theme='dark'] .ep-field {
  border-bottom: 1px solid rgba(255,255,255,0.08);
}

html[data-theme='dark'] .ep-field-icon {
  background: rgba(228,88,33,0.12);
  border: 1px solid rgba(228,88,33,0.25);
  color: #E45821;
}

html[data-theme='dark'] .ep-label {
  color: var(--text-muted);
}

html[data-theme='dark'] .ep-input,
html[data-theme='dark'] .ep-textarea {
  color: var(--text-dark);
}

html[data-theme='dark'] .ep-input::placeholder,
html[data-theme='dark'] .ep-textarea::placeholder {
  color: rgba(255,255,255,0.35);
}

html[data-theme='dark'] .ep-char {
  color: rgba(255,255,255,0.45);
}

html[data-theme='dark'] .ep-avatar-overlay {
  background: rgba(0,0,0,0.55);
}

html[data-theme='dark'] .ep-save-btn:hover:not(:disabled) {
  background: #d54f1c;
}

html[data-theme='dark'] .ep-change-label {
  color: #ff7b4a;
}
  
        /* Body */
        .ep-body {
          padding: 24px 16px 80px;
          max-width: 560px;
          margin: 0 auto;
        }

        /* Avatar */
        .ep-avatar-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          margin-bottom: 32px;
        }

        .ep-avatar-wrap {
          position: relative;
          width: 96px;
          height: 96px;
          border-radius: 50%;
          cursor: pointer;
          overflow: hidden;
        }

        .ep-avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 50%;
        }

        .ep-avatar-placeholder {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: linear-gradient(135deg, #E45821, #f09060);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .ep-avatar-letter {
          font-size: 2.2rem;
          font-weight: 800;
          color: #fff;
          line-height: 1;
        }

        .ep-avatar-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.38);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.18s;
          border-radius: 50%;
        }
        .ep-avatar-wrap:hover .ep-avatar-overlay { opacity: 1; }

        .ep-change-label {
          font-size: 0.82rem;
          color: #E45821;
          font-weight: 700;
          margin: 0;
          cursor: pointer;
        }

        /* Form */
        .ep-form {
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .ep-section-label {
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #aaa;
          margin-bottom: 12px;
          margin-top: 4px;
        }

        .ep-divider {
          height: 8px;
          margin: 16px -16px;
          background: #f5f5f5;
        }

        .ep-field {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 14px 0;
          border-bottom: 1px solid #f5f5f5;
        }
        .ep-field--textarea { align-items: flex-start; }

        .ep-field-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: #fff7f4;
          border: 1px solid rgba(228,88,33,0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #E45821;
          font-size: 0.85rem;
          font-weight: 700;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .ep-field-body {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .ep-label {
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #aaa;
        }

        .ep-input {
          background: none;
          border: none;
          outline: none;
          font-size: 0.93rem;
          color: #111;
          font-family: inherit;
          padding: 0;
          width: 100%;
          border-bottom: 1.5px solid transparent;
          transition: border-color 0.18s;
          padding-bottom: 4px;
        }
        .ep-input::placeholder { color: #ccc; }
        .ep-input:focus { border-bottom-color: #E45821; }

        .ep-textarea {
          background: none;
          border: none;
          outline: none;
          font-size: 0.93rem;
          color: #111;
          font-family: inherit;
          padding: 0;
          width: 100%;
          resize: none;
          line-height: 1.5;
          border-bottom: 1.5px solid transparent;
          transition: border-color 0.18s;
          padding-bottom: 4px;
        }
        .ep-textarea::placeholder { color: #ccc; }
        .ep-textarea:focus { border-bottom-color: #E45821; }

        .ep-char {
          font-size: 0.65rem;
          color: #ccc;
          text-align: right;
        }
      `}</style>
    </div>
  );
};

export default EditProfilePage;
