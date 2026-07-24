import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  X, User, Lock, MapPin, Sun, Moon, Monitor,
  LogOut, Trash2, ChevronRight,
} from "lucide-react";
import { api } from "../../services/api";

type Theme = "light" | "dark" | "auto";

interface SettingsDrawerProps {
  open: boolean;
  onClose: () => void;
}

/* ── small sub-pages ── */
type SubPage = null | "username" | "password" | "address";

export default function SettingsDrawer({ open, onClose }: SettingsDrawerProps) {
  const navigate = useNavigate();
  const [sub, setSub] = useState<SubPage>(null);

  // theme
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem("sz_theme") as Theme | null;
    if (stored === "dark" || stored === "light") return stored;
    return "auto";
  });

  // username form
  const raw = localStorage.getItem("sz_user");
  const saved = raw ? JSON.parse(raw) : {};
  const [newUsername, setNewUsername] = useState((saved.username || "").replace(/^@/, ""));
  const [uSaving, setUSaving] = useState(false);
  const [uError, setUError] = useState("");
  const [uSuccess, setUSuccess] = useState(false);

  // password form
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [pSaving, setPSaving] = useState(false);
  const [pError, setPError] = useState("");
  const [pSuccess, setPSuccess] = useState(false);

  // address form
  const [address, setAddress] = useState(saved.address || "");
  const [city, setCity] = useState(saved.city || "");
  const [aSaving, setASaving] = useState(false);
  const [aError, setAError] = useState("");
  const [aSuccess, setASuccess] = useState(false);

  // delete confirm
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // reset sub-page on close
  useEffect(() => {
    if (!open) { setSub(null); setDeleteConfirm(false); }
  }, [open]);

  // apply theme
  const applyTheme = (t: Theme) => {
    setTheme(t);
    localStorage.setItem("sz_theme", t);
    if (t === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
    } else if (t === "light") {
      document.documentElement.removeAttribute("data-theme");
    } else {
      // auto: follow system
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      prefersDark
        ? document.documentElement.setAttribute("data-theme", "dark")
        : document.documentElement.removeAttribute("data-theme");
    }
    window.dispatchEvent(new Event("sz_theme_change"));
  };

  // handlers
  const handleUsernameSubmit = async () => {
    const clean = newUsername.replace(/^@/, "").trim();
    if (!clean) { setUError("Username cannot be empty"); return; }
    if (!saved.id) { setUError("Not logged in"); return; }
    setUError(""); setUSaving(true); setUSuccess(false);
    try {
      const res = await api.updateProfile(saved.id, { username: clean });
      if (res.error) throw new Error(res.error);
      const updated = { ...saved, username: `@${clean}` };
      localStorage.setItem("sz_user", JSON.stringify(updated));
      window.dispatchEvent(new Event("sz_auth_change"));
      setUSuccess(true);
    } catch (e: any) {
      setUError(e.message || "Failed");
    } finally {
      setUSaving(false);
    }
  };

  const handlePasswordSubmit = async () => {
    if (!newPwd) { setPError("Enter a new password"); return; }
    if (newPwd.length < 8) { setPError("Password must be at least 8 characters"); return; }
    if (newPwd !== confirmPwd) { setPError("Passwords do not match"); return; }
    setPError(""); setPSaving(true); setPSuccess(false);
    try {
      const { supabase } = await import("../../services/supabase");
      const { error } = await supabase.auth.updateUser({ password: newPwd });
      if (error) throw new Error(error.message);
      setPSuccess(true);
      setNewPwd(""); setConfirmPwd("");
    } catch (e: any) {
      setPError(e.message || "Failed");
    } finally {
      setPSaving(false);
    }
  };

  const handleAddressSubmit = async () => {
    if (!saved.id) { setAError("Not logged in"); return; }
    setAError(""); setASaving(true); setASuccess(false);
    try {
      const res = await api.updateProfile(saved.id, { city, address });
      if (res.error) throw new Error(res.error);
      const updated = { ...saved, address, city };
      localStorage.setItem("sz_user", JSON.stringify(updated));
      window.dispatchEvent(new Event("sz_auth_change"));
      setASuccess(true);
    } catch (e: any) {
      setAError(e.message || "Failed");
    } finally {
      setASaving(false);
    }
  };

  const handleLogout = async () => {
    const { supabase } = await import("../../services/supabase");
    await supabase.auth.signOut();
    localStorage.removeItem("sz_user");
    window.dispatchEvent(new Event("sz_auth_change"));
    onClose();
    navigate("/login");
  };

  const handleDeleteAccount = async () => {
    if (!saved.id) return;
    setDeleting(true);
    try {
      await api.deleteProduct && console.log("delete account");
      // Just clear local + navigate for now; real deletion needs backend endpoint
      localStorage.removeItem("sz_user");
      window.dispatchEvent(new Event("sz_auth_change"));
      onClose();
      navigate("/signup");
    } catch {
      /* ignore */
    } finally {
      setDeleting(false);
    }
  };

  if (!open) return null;

  /* ─── Sub-page: Username ─── */
  const SubUsername = () => (
    <div className="sd-sub">
      <button className="sd-sub-back" onClick={() => { setSub(null); setUError(""); setUSuccess(false); }}>
        ← Back
      </button>
      <h3 className="sd-sub-title">Change Username</h3>
      <div className="sd-field">
        <label className="sd-label">New Username</label>
        <div className="sd-input-wrap">
          <span className="sd-input-prefix">@</span>
          <input
            className="sd-input"
            value={newUsername}
            onChange={e => setNewUsername(e.target.value.replace(/\s/g, "").toLowerCase())}
            placeholder="username"
            autoFocus
          />
        </div>
      </div>
      {uError && <p className="sd-error">{uError}</p>}
      {uSuccess && <p className="sd-success">Username updated!</p>}
      <button className="sd-btn-primary" onClick={handleUsernameSubmit} disabled={uSaving}>
        {uSaving ? <span className="sd-spinner" /> : "Save Username"}
      </button>
    </div>
  );

  /* ─── Sub-page: Password ─── */
  const SubPassword = () => (
    <div className="sd-sub">
      <button className="sd-sub-back" onClick={() => { setSub(null); setPError(""); setPSuccess(false); }}>
        ← Back
      </button>
      <h3 className="sd-sub-title">Change Password</h3>
      <div className="sd-field">
        <label className="sd-label">New Password</label>
        <input
          className="sd-input sd-input--full"
          type="password"
          value={newPwd}
          onChange={e => setNewPwd(e.target.value)}
          placeholder="Min 8 characters"
          autoFocus
        />
      </div>
      <div className="sd-field">
        <label className="sd-label">Confirm Password</label>
        <input
          className="sd-input sd-input--full"
          type="password"
          value={confirmPwd}
          onChange={e => setConfirmPwd(e.target.value)}
          placeholder="Re-enter password"
        />
      </div>
      {pError && <p className="sd-error">{pError}</p>}
      {pSuccess && <p className="sd-success">Password changed!</p>}
      <button className="sd-btn-primary" onClick={handlePasswordSubmit} disabled={pSaving}>
        {pSaving ? <span className="sd-spinner" /> : "Update Password"}
      </button>
    </div>
  );

  /* ─── Sub-page: Delivery Address ─── */
  const SubAddress = () => (
    <div className="sd-sub">
      <button className="sd-sub-back" onClick={() => { setSub(null); setAError(""); setASuccess(false); }}>
        ← Back
      </button>
      <h3 className="sd-sub-title">Delivery Address</h3>
      <div className="sd-field">
        <label className="sd-label">City</label>
        <input
          className="sd-input sd-input--full"
          value={city}
          onChange={e => setCity(e.target.value)}
          placeholder="e.g. Karachi"
          autoFocus
        />
      </div>
      <div className="sd-field">
        <label className="sd-label">Full Address</label>
        <textarea
          className="sd-input sd-input--full sd-textarea"
          value={address}
          onChange={e => setAddress(e.target.value)}
          placeholder="Street, area, postal code..."
          rows={3}
        />
      </div>
      {aError && <p className="sd-error">{aError}</p>}
      {aSuccess && <p className="sd-success">Address saved!</p>}
      <button className="sd-btn-primary" onClick={handleAddressSubmit} disabled={aSaving}>
        {aSaving ? <span className="sd-spinner" /> : "Save Address"}
      </button>
    </div>
  );

  /* ─── Main drawer render ─── */
  return (
    <>
      {/* Backdrop */}
      <div className="sd-backdrop" onClick={onClose} aria-hidden="true" />

      {/* Drawer */}
      <div className="sd-drawer" role="dialog" aria-modal="true" aria-label="Settings">
        {/* Handle bar */}
        <div className="sd-handle" />

        {/* Header */}
        <div className="sd-header">
          <span className="sd-header-title">
            {sub === "username" ? "Change Username"
             : sub === "password" ? "Change Password"
             : sub === "address" ? "Delivery Address"
             : "Settings"}
          </span>
          <button className="sd-close" onClick={onClose} aria-label="Close settings">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="sd-body">
          {sub === "username" && <SubUsername />}
          {sub === "password" && <SubPassword />}
          {sub === "address" && <SubAddress />}

          {sub === null && (
            <>
              {/* Account section */}
              <div className="sd-section-label">Account</div>

              <button className="sd-row" onClick={() => { setUSuccess(false); setUError(""); setSub("username"); }}>
                <span className="sd-row-icon"><User size={16} /></span>
                <span className="sd-row-text">Change Username</span>
                <ChevronRight size={15} className="sd-row-arrow" />
              </button>

              <button className="sd-row" onClick={() => { setPSuccess(false); setPError(""); setSub("password"); }}>
                <span className="sd-row-icon"><Lock size={16} /></span>
                <span className="sd-row-text">Change Password</span>
                <ChevronRight size={15} className="sd-row-arrow" />
              </button>

              <button className="sd-row" onClick={() => { setASuccess(false); setAError(""); setSub("address"); }}>
                <span className="sd-row-icon"><MapPin size={16} /></span>
                <span className="sd-row-text">Delivery Address</span>
                <ChevronRight size={15} className="sd-row-arrow" />
              </button>

              <div className="sd-divider" />

              {/* Appearance section */}
              <div className="sd-section-label">Appearance</div>
              <div className="sd-theme-group">
                {(["light", "dark", "auto"] as Theme[]).map((t) => (
                  <button
                    key={t}
                    className={`sd-theme-btn${theme === t ? " sd-theme-btn--active" : ""}`}
                    onClick={() => applyTheme(t)}
                  >
                    {t === "light" && <Sun size={15} />}
                    {t === "dark" && <Moon size={15} />}
                    {t === "auto" && <Monitor size={15} />}
                    <span>{t.charAt(0).toUpperCase() + t.slice(1)}</span>
                  </button>
                ))}
              </div>

              <div className="sd-divider" />

              {/* Logout */}
              <button className="sd-row sd-row--logout" onClick={handleLogout}>
                <span className="sd-row-icon sd-row-icon--logout"><LogOut size={16} /></span>
                <span className="sd-row-text">Logout</span>
              </button>

              {/* Delete account */}
              {!deleteConfirm ? (
                <button className="sd-row sd-row--danger" onClick={() => setDeleteConfirm(true)}>
                  <span className="sd-row-icon sd-row-icon--danger"><Trash2 size={16} /></span>
                  <span className="sd-row-text">Delete Account</span>
                </button>
              ) : (
                <div className="sd-delete-confirm">
                  <p className="sd-delete-msg">Are you sure? This cannot be undone.</p>
                  <div className="sd-delete-btns">
                    <button className="sd-btn-ghost" onClick={() => setDeleteConfirm(false)} disabled={deleting}>
                      Cancel
                    </button>
                    <button className="sd-btn-danger" onClick={handleDeleteAccount} disabled={deleting}>
                      {deleting ? <span className="sd-spinner" /> : "Yes, Delete"}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <style>{`
        .sd-backdrop {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.45);
          backdrop-filter: blur(3px);
          z-index: 998;
          animation: sd-fade-in 0.22s ease;
        }
        @keyframes sd-fade-in { from { opacity: 0; } to { opacity: 1; } }

        .sd-drawer {
          position: fixed;
          bottom: 0; left: 0; right: 0;
          z-index: 999;
          background: var(--bg, #fff);
          border-radius: 24px 24px 0 0;
          box-shadow: 0 -8px 40px rgba(0,0,0,0.22);
          max-height: 88vh;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          animation: sd-slide-up 0.28s cubic-bezier(0.34,1.56,0.64,1);
          font-family: 'Poppins', sans-serif;
        }
        @keyframes sd-slide-up {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        html[data-theme='dark'] .sd-drawer { background: #111; border-top: 1px solid #222; }

        .sd-handle {
          width: 40px; height: 4px;
          border-radius: 2px;
          background: rgba(0,0,0,0.15);
          margin: 12px auto 0;
        }
        html[data-theme='dark'] .sd-handle { background: rgba(255,255,255,0.18); }

        .sd-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 20px 10px;
          border-bottom: 1px solid rgba(0,0,0,0.07);
        }
        html[data-theme='dark'] .sd-header { border-bottom-color: rgba(255,255,255,0.07); }

        .sd-header-title {
          font-size: 1.05rem; font-weight: 700;
          color: var(--text-dark, #111);
        }
        html[data-theme='dark'] .sd-header-title { color: #fff; }

        .sd-close {
          width: 32px; height: 32px; border-radius: 50%;
          border: 1px solid rgba(0,0,0,0.1);
          background: transparent;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: var(--text-dark, #111);
          transition: background 0.15s;
        }
        .sd-close:hover { background: rgba(0,0,0,0.07); }
        html[data-theme='dark'] .sd-close { border-color: rgba(255,255,255,0.12); color: #fff; }
        html[data-theme='dark'] .sd-close:hover { background: rgba(255,255,255,0.08); }

        .sd-body { padding: 12px 0 32px; }

        .sd-section-label {
          font-size: 0.65rem; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.1em;
          color: #aaa; padding: 8px 20px 4px;
        }

        .sd-row {
          display: flex; align-items: center; gap: 14px;
          width: 100%; padding: 14px 20px;
          background: none; border: none; cursor: pointer;
          font-family: inherit; text-align: left;
          transition: background 0.12s;
        }
        .sd-row:hover { background: rgba(0,0,0,0.04); }
        html[data-theme='dark'] .sd-row:hover { background: rgba(255,255,255,0.05); }

        .sd-row-icon {
          width: 36px; height: 36px; border-radius: 10px;
          background: rgba(228,88,33,0.1);
          border: 1px solid rgba(228,88,33,0.2);
          display: flex; align-items: center; justify-content: center;
          color: #E45821; flex-shrink: 0;
        }
        .sd-row-icon--logout { background: rgba(99,102,241,0.1); border-color: rgba(99,102,241,0.25); color: #6366f1; }
        .sd-row-icon--danger { background: rgba(239,68,68,0.1); border-color: rgba(239,68,68,0.2); color: #ef4444; }

        .sd-row-text {
          flex: 1; font-size: 0.9rem; font-weight: 500;
          color: var(--text-dark, #111);
        }
        html[data-theme='dark'] .sd-row-text { color: #fff; }
        .sd-row--logout .sd-row-text { color: #6366f1; }
        .sd-row--danger .sd-row-text { color: #ef4444; }

        .sd-row-arrow { color: #ccc; flex-shrink: 0; }
        html[data-theme='dark'] .sd-row-arrow { color: #555; }

        .sd-divider { height: 1px; background: rgba(0,0,0,0.07); margin: 8px 20px; }
        html[data-theme='dark'] .sd-divider { background: rgba(255,255,255,0.07); }

        /* Theme picker */
        .sd-theme-group {
          display: flex; gap: 10px; padding: 10px 20px;
        }
        .sd-theme-btn {
          flex: 1; display: flex; flex-direction: column;
          align-items: center; gap: 6px;
          padding: 12px 8px; border-radius: 14px;
          border: 1.5px solid rgba(0,0,0,0.1);
          background: rgba(0,0,0,0.03);
          cursor: pointer; font-family: inherit;
          color: #888; font-size: 0.72rem; font-weight: 600;
          transition: all 0.18s;
        }
        .sd-theme-btn:hover { border-color: #E45821; color: #E45821; }
        .sd-theme-btn--active {
          border-color: #E45821; background: rgba(228,88,33,0.1);
          color: #E45821;
        }
        html[data-theme='dark'] .sd-theme-btn { border-color: rgba(255,255,255,0.1); background: rgba(255,255,255,0.05); color: #888; }
        html[data-theme='dark'] .sd-theme-btn:hover { border-color: #E45821; color: #E45821; }
        html[data-theme='dark'] .sd-theme-btn--active { border-color: #E45821; background: rgba(228,88,33,0.15); color: #E45821; }

        /* Delete confirm */
        .sd-delete-confirm { padding: 12px 20px; }
        .sd-delete-msg { font-size: 0.82rem; color: #ef4444; margin: 0 0 12px; }
        .sd-delete-btns { display: flex; gap: 10px; }
        .sd-btn-ghost {
          flex: 1; padding: 11px; border-radius: 12px;
          background: rgba(0,0,0,0.05); border: 1px solid rgba(0,0,0,0.1);
          font-family: inherit; font-size: 0.85rem; font-weight: 600;
          cursor: pointer; color: #555; transition: background 0.15s;
        }
        .sd-btn-ghost:hover { background: rgba(0,0,0,0.09); }
        html[data-theme='dark'] .sd-btn-ghost { background: #1e1e1e; border-color: #333; color: #aaa; }
        .sd-btn-danger {
          flex: 1; padding: 11px; border-radius: 12px;
          background: #ef4444; border: none;
          font-family: inherit; font-size: 0.85rem; font-weight: 700;
          cursor: pointer; color: #fff;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.15s;
        }
        .sd-btn-danger:hover:not(:disabled) { background: #dc2626; }
        .sd-btn-danger:disabled { opacity: 0.65; cursor: not-allowed; }

        /* Sub-page */
        .sd-sub { padding: 4px 20px 20px; }
        .sd-sub-back {
          background: none; border: none; cursor: pointer;
          font-family: inherit; font-size: 0.82rem; font-weight: 600;
          color: #E45821; padding: 0; margin-bottom: 16px;
          display: inline-flex; align-items: center; gap: 4px;
        }
        .sd-sub-title {
          font-size: 1rem; font-weight: 700; margin: 0 0 20px;
          color: var(--text-dark, #111);
        }
        html[data-theme='dark'] .sd-sub-title { color: #fff; }

        .sd-field { margin-bottom: 16px; }
        .sd-label {
          display: block; font-size: 0.68rem; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.08em;
          color: #aaa; margin-bottom: 6px;
        }

        .sd-input-wrap {
          display: flex; align-items: center;
          border: 1.5px solid rgba(0,0,0,0.12); border-radius: 12px;
          background: rgba(0,0,0,0.02); overflow: hidden;
          transition: border-color 0.15s;
        }
        .sd-input-wrap:focus-within { border-color: #E45821; }
        .sd-input-prefix {
          padding: 0 8px 0 14px; font-size: 1rem; font-weight: 700; color: #aaa;
        }
        html[data-theme='dark'] .sd-input-wrap { border-color: rgba(255,255,255,0.1); background: rgba(255,255,255,0.04); }

        .sd-input {
          flex: 1; padding: 12px 14px; border: none; outline: none;
          background: transparent; font-family: inherit;
          font-size: 0.92rem; color: var(--text-dark, #111);
        }
        html[data-theme='dark'] .sd-input { color: #fff; }
        .sd-input::placeholder { color: #ccc; }
        .sd-input--full {
          width: 100%; padding: 12px 14px;
          border: 1.5px solid rgba(0,0,0,0.12); border-radius: 12px;
          background: rgba(0,0,0,0.02); outline: none;
          font-family: inherit; font-size: 0.92rem;
          color: var(--text-dark, #111); transition: border-color 0.15s;
        }
        .sd-input--full:focus { border-color: #E45821; }
        html[data-theme='dark'] .sd-input--full { border-color: rgba(255,255,255,0.1); background: rgba(255,255,255,0.04); color: #fff; }
        .sd-textarea { resize: none; }

        .sd-btn-primary {
          width: 100%; padding: 13px;
          background: #E45821; border: none; border-radius: 14px;
          color: #fff; font-family: inherit; font-size: 0.9rem; font-weight: 700;
          cursor: pointer; transition: background 0.15s, transform 0.15s;
          display: flex; align-items: center; justify-content: center;
          margin-top: 4px;
        }
        .sd-btn-primary:hover:not(:disabled) { background: #c94d1c; transform: translateY(-1px); }
        .sd-btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }

        .sd-error {
          font-size: 0.8rem; color: #ef4444;
          background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2);
          border-radius: 10px; padding: 9px 13px; margin-bottom: 12px;
        }
        .sd-success {
          font-size: 0.8rem; color: #16a34a;
          background: rgba(22,163,74,0.08); border: 1px solid rgba(22,163,74,0.2);
          border-radius: 10px; padding: 9px 13px; margin-bottom: 12px;
        }

        .sd-spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,0.4);
          border-top-color: #fff; border-radius: 50%;
          animation: sd-spin 0.7s linear infinite; display: inline-block;
        }
        @keyframes sd-spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}
