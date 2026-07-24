import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FiArrowLeft, FiX,
  FiAlertCircle, FiCheck,
} from "react-icons/fi";
import { api } from "../../services/api";

const CATEGORIES = ["Electronics", "Gaming", "Fashion", "Sports", "Books", "Home", "Vehicles", "Toys", "Phones", "Clothing", "Furniture", "Jewelry", "Other"];
const CONDITIONS = ["Brand New", "Like New", "Good", "Fair", "For Parts"];
const MAX_PHOTOS = 6;

type PhotoSlot = { file?: File; url: string };

const EditProductPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const fileRef = useRef<HTMLInputElement>(null);

  const [fetchLoading, setFetchLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [photos, setPhotos] = useState<PhotoSlot[]>([]);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [condition, setCondition] = useState("");
  const [swapFor, setSwapFor] = useState("");

  // Fetch product on mount and pre-fill form
  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setFetchLoading(true);
      try {
        const res = await api.getProductById(id);
        if (res.error || !res.data) throw new Error(res.error || "Product not found");

        // Security: verify ownership — localStorage only, no Supabase session needed
        const rawUser = localStorage.getItem("sz_user");
        const savedUser = rawUser ? JSON.parse(rawUser) : null;
        const authId = savedUser?.id;

        if (authId && res.data.user_id && res.data.user_id !== authId) {
          setFetchError("You are not authorized to edit this listing.");
          return;
        }

        const p = res.data;
        setTitle(p.title || "");
        setCategory(p.category || "");
        setDescription(p.description || "");
        setCondition(p.condition || "");
        setSwapFor(p.swap_for || "");
        // Existing images as URL-only slots (no file)
        if (Array.isArray(p.image_urls)) {
          setPhotos(p.image_urls.map((url: string) => ({ url })));
        }
      } catch (err: any) {
        setFetchError(err.message || "Failed to load product");
      } finally {
        setFetchLoading(false);
      }
    };
    load();
  }, [id]);

  const handlePhotoAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.slice(0, MAX_PHOTOS - photos.length).forEach((file) => {
      setPhotos((prev) => [...prev, { file, url: URL.createObjectURL(file) }]);
    });
    e.target.value = "";
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = "Title is required";
    if (!category) e.category = "Category is required";
    if (!description.trim()) e.description = "Description is required";
    if (!condition) e.condition = "Condition is required";
    if (!photos.length) e.photos = "Add at least one photo";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;
    if (!id) return;

    setLoading(true);
    try {
      // Auth from localStorage — no Supabase session call needed
      const rawUser = localStorage.getItem("sz_user");
      const savedUser = rawUser ? JSON.parse(rawUser) : null;
      const authId = savedUser?.id;
      if (!authId) throw new Error("Not logged in");

      // Upload any new photos; keep existing URL-only ones
      const imageUrls: string[] = [];
      for (const p of photos) {
        if (p.file) {
          const formData = new FormData();
          formData.append("image", p.file);
          const uploadRes = await api.uploadImage(formData);
          imageUrls.push(uploadRes.url || "https://placehold.co/600x400?text=Upload+Failed");
        } else {
          imageUrls.push(p.url);
        }
      }

      // Only send columns that exist in the products table
      const updates = {
        title,
        category,
        description,
        condition,
        swap_for: swapFor,
        image_urls: imageUrls,
      };

      const res = await api.updateProduct(id, updates);
      if (res.error) throw new Error(res.error);

      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        navigate("/profile");
      }, 1800);
    } catch (err: any) {
      alert(err.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  // ── Loading / Error states ──────────────────────────────
  if (fetchLoading) {
    return (
      <div className="lp-page" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <div className="lp-bg" />
        <span style={{ position: "relative", zIndex: 1, color: "var(--text-muted)", fontSize: "0.9rem" }}>Loading listing...</span>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="lp-page" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 16 }}>
        <div className="lp-bg" />
        <p style={{ position: "relative", zIndex: 1, color: "#E45821", fontSize: "0.95rem", fontWeight: 600 }}>{fetchError}</p>
        <button className="lp-back" style={{ position: "relative", zIndex: 1 }} onClick={() => navigate("/profile")}>← Back to Profile</button>
      </div>
    );
  }

  return (
    <div className="lp-page">
      <div className="lp-bg" />

      {showToast && (
        <div className="lp-toast">
          <FiCheck size={16} />
          <span>Listing update ho gayi! Redirecting...</span>
        </div>
      )}

      <div className="lp-wrap">
        {/* Page header */}
        <div className="lp-page-header">
          <button className="lp-back" onClick={() => navigate("/profile")}>
            <FiArrowLeft size={15} /> Back to Profile
          </button>
          <div>
            <h1 className="lp-title">Edit Listing</h1>
            <p className="lp-sub">Update your listing details below</p>
          </div>
        </div>

        <div className="lp-layout">
          {/* Photos panel */}
          <div className="lp-section">
            <button
              type="button"
              className={`lp-dropzone${errors.photos ? " lp-dropzone--err" : ""}`}
              onClick={() => fileRef.current?.click()}
            >
              <span className="lp-dropzone-icon">
                <img src="/ICONS/Camera.png" alt="Camera" width={28} height={28} style={{ objectFit: "contain" }} />
              </span>
              <span className="lp-dropzone-title">Add / Change Photos</span>
              <span className="lp-dropzone-sub">Tap To Upload · Max {MAX_PHOTOS} Photos · JPG, PNG</span>
            </button>

            <div className="lp-photo-tiles">
              {photos.map((p, i) => (
                <div key={i} className="lp-photo-tile lp-photo-tile--filled">
                  <img src={p.url} alt="" className="lp-photo-img" />
                  {i === 0 && <span className="lp-photo-tile-cover">Cover</span>}
                  <button
                    type="button"
                    className="lp-photo-remove"
                    onClick={() => setPhotos((prev) => prev.filter((_, j) => j !== i))}
                    aria-label="Remove photo"
                  >
                    <FiX size={11} />
                  </button>
                </div>
              ))}
              {Array.from({ length: Math.max(0, MAX_PHOTOS - photos.length) }).map((_, i) => (
                <button
                  key={`empty-${i}`}
                  type="button"
                  className="lp-photo-tile lp-photo-tile--add"
                  onClick={() => fileRef.current?.click()}
                  aria-label="Add photo"
                >
                  +
                </button>
              ))}
            </div>

            <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handlePhotoAdd} />
            {errors.photos && <p className="lp-err"><FiAlertCircle size={11} />{errors.photos}</p>}
          </div>

          {/* Form */}
          <form className="lp-form" onSubmit={handleSubmit} noValidate>

            {/* ── Item Details ── */}
            <div className="lp-section">
              <div className="lp-section-head">
                <img src="/ICONS/Listing.png" alt="Details" className="lp-section-icon-img lp-section-icon-img--filter" />
                <div>
                  <span className="lp-section-title">Item Details</span>
                  <span className="lp-section-desc">Title, category &amp; description</span>
                </div>
              </div>

              <div className="lp-field">
                <label className="lp-label">ITEM TITLE <span className="lp-req">*</span></label>
                <input className={`lp-input${errors.title ? " lp-input--err" : ""}`}
                  placeholder="e.g. iPhone 15 Pro Max 256GB Black"
                  value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} />
                <span className="lp-char-count">{title.length}/80</span>
                {errors.title && <p className="lp-err"><FiAlertCircle size={11} />{errors.title}</p>}
              </div>

              <div className="lp-field">
                <label className="lp-label">CATEGORY <span className="lp-req">*</span></label>
                <select className={`lp-select${errors.category ? " lp-input--err" : ""}`}
                  value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="">Select...</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                {errors.category && <p className="lp-err"><FiAlertCircle size={11} />{errors.category}</p>}
              </div>

              <div className="lp-field">
                <label className="lp-label">DESCRIPTION <span className="lp-req">*</span></label>
                <textarea className={`lp-textarea${errors.description ? " lp-input--err" : ""}`}
                  placeholder="Describe your item..."
                  value={description} onChange={(e) => setDescription(e.target.value)}
                  maxLength={500} rows={4} />
                <span className="lp-char-count">{description.length}/500</span>
                {errors.description && <p className="lp-err"><FiAlertCircle size={11} />{errors.description}</p>}
              </div>
            </div>

            {/* ── Condition & Pricing ── */}
            <div className="lp-section">
              <div className="lp-section-head">
                <img src="/ICONS/Return.png" alt="Condition" className="lp-section-icon-img lp-section-icon-img--filter" />
                <div>
                  <span className="lp-section-title">Condition &amp; Pricing</span>
                  <span className="lp-section-desc">Set your swap or sale terms</span>
                </div>
              </div>

              <div className="lp-field">
                <label className="lp-label">CONDITION <span className="lp-req">*</span></label>
                <div className="lp-pills">
                  {CONDITIONS.map((c) => (
                    <button key={c} type="button"
                      className={`lp-pill${condition === c ? " lp-pill--active" : ""}`}
                      onClick={() => setCondition(c)}>{c}</button>
                  ))}
                </div>
                {errors.condition && <p className="lp-err"><FiAlertCircle size={11} />{errors.condition}</p>}
              </div>

              <div className="lp-field">
                <label className="lp-label">OPEN TO SVAP FOR</label>
                <input className="lp-input" placeholder="e.g. MacBook Air M2"
                  value={swapFor} onChange={(e) => setSwapFor(e.target.value)} />
              </div>
            </div>

            {/* Buttons */}
            <div style={{ display: "flex", gap: "12px" }}>
              <button type="button" className="lp-cancel-btn" onClick={() => navigate("/profile")} disabled={loading}>
                Cancel
              </button>
              <button type="submit" className="lp-submit-btn" disabled={loading} style={{ flex: 1 }}>
                {loading ? "Updating..." : <><FiCheck size={16} /> Update Listing</>}
              </button>
            </div>

          </form>
        </div>
      </div>

      <style>{`
        .lp-page { min-height:100vh; background: radial-gradient(circle at top left,rgba(228,88,33,0.08),transparent 32%), radial-gradient(circle at bottom right,rgba(49,60,92,0.08),transparent 30%), linear-gradient(180deg,#f8f9fc 0%,#ffffff 40%,#f8f9fc 100%); padding:24px 24px 72px; box-sizing:border-box; font-family:'Poppins','Helvetica Neue',Arial,sans-serif; position:relative; color:var(--text-dark); overflow:hidden; }
        html[data-theme='dark'] .lp-page { background:#0a0a0a; color:#f5f5f5; }
        .lp-bg { position:fixed; inset:0; background: radial-gradient(circle at 20% 20%,rgba(174,220,90,0.12),transparent 24%), radial-gradient(circle at 80% 0%,rgba(96,121,255,0.10),transparent 26%), linear-gradient(180deg,rgba(255,255,255,0.72) 0%,rgba(247,255,235,0.55) 100%); z-index:0; pointer-events:none; }
        html[data-theme='dark'] .lp-bg { background:#0a0a0a; }
        .lp-wrap { position:relative; z-index:1; width:100%; max-width:780px; margin:0 auto; }
        .lp-page-header { margin-bottom:32px; }
        .lp-back { display:inline-flex; align-items:center; gap:6px; color:var(--text-muted); font-size:0.82rem; font-weight:600; background:none; border:none; cursor:pointer; padding:0; margin-bottom:14px; transition:color 0.18s; }
        .lp-back:hover { color:var(--text-dark); }
        .lp-title { font-size:clamp(1.9rem,2.8vw,2.8rem); font-weight:800; color:var(--text-dark); letter-spacing:-0.02em; margin:0 0 5px; line-height:1.1; }
        .lp-sub { font-size:0.9rem; color:var(--text-muted); margin:0; }
        .lp-layout { display:flex; flex-direction:column; gap:20px; }
        .lp-section { background:rgba(255,255,255,0.92); backdrop-filter:blur(18px); border:1px solid rgba(165,194,111,0.26); box-shadow:0 18px 40px rgba(26,46,10,0.06); border-radius:18px; padding:22px; display:flex; flex-direction:column; gap:16px; }
        html[data-theme='dark'] .lp-section { background:rgba(26,26,26,0.5); border:1px solid rgba(255,255,255,0.12); box-shadow:0 18px 40px rgba(0,0,0,0.3); }
        .lp-section-head { display:flex; align-items:flex-start; gap:10px; padding-bottom:12px; border-bottom:1px solid rgba(228,88,33,0.12); }
        .lp-section-icon-img { width:18px; height:18px; object-fit:contain; flex-shrink:0; margin-top:1px; }
        html[data-theme='dark'] .lp-section-icon-img--filter { filter:brightness(0) invert(1); }
        .lp-section-title { display:block; font-size:0.9rem; font-weight:700; color:var(--text-dark); }
        .lp-section-desc { display:block; font-size:0.72rem; color:var(--text-muted); margin-top:1px; }
        .lp-dropzone { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px; width:100%; padding:36px 20px; background:linear-gradient(135deg,rgba(228,88,33,0.04),rgba(49,60,92,0.03)); border:2px dashed rgba(228,88,33,0.40); border-radius:16px; cursor:pointer; font-family:inherit; transition:border-color 0.2s,background 0.2s; }
        .lp-dropzone:hover { border-color:rgba(228,88,33,0.72); background:linear-gradient(135deg,rgba(228,88,33,0.08),rgba(49,60,92,0.05)); }
        .lp-dropzone--err { border-color:rgba(248,113,113,0.55); }
        .lp-dropzone-icon { width:58px; height:58px; border-radius:50%; background:rgba(228,88,33,0.10); border:2px solid rgba(228,88,33,0.25); display:flex; align-items:center; justify-content:center; margin-bottom:4px; overflow:hidden; }
        .lp-dropzone-title { font-size:1rem; font-weight:800; color:var(--text-dark); }
        .lp-dropzone-sub { font-size:0.72rem; color:var(--text-muted); text-align:center; }
        .lp-photo-tiles { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; }
        .lp-photo-tile { position:relative; aspect-ratio:1; border-radius:14px; overflow:hidden; border:none; padding:0; }
        .lp-photo-tile--add { background:#ff6a1a; color:#fff; font-size:1.5rem; font-weight:300; line-height:1; display:flex; align-items:center; justify-content:center; cursor:pointer; transition:background 0.2s,transform 0.15s; }
        .lp-photo-tile--add:hover { background:#ea5b0f; transform:translateY(-1px); }
        .lp-photo-tile--filled { border:1px solid rgba(165,194,111,0.24); }
        .lp-photo-img { width:100%; height:100%; object-fit:cover; display:block; }
        .lp-photo-tile-cover { position:absolute; top:6px; left:6px; background:rgba(26,46,10,0.78); color:#fff; font-size:0.56rem; font-weight:700; letter-spacing:0.05em; padding:2px 7px; border-radius:5px; text-transform:uppercase; }
        .lp-photo-remove { position:absolute; top:5px; right:5px; width:20px; height:20px; border-radius:50%; background:rgba(0,0,0,0.55); border:none; color:#fff; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:background 0.18s; }
        .lp-photo-remove:hover { background:rgba(248,113,113,0.9); }
        .lp-toast { position:fixed; top:24px; left:50%; transform:translateX(-50%); z-index:1000; display:flex; align-items:center; gap:8px; background:#1a2e0a; color:#fff; padding:12px 20px; border-radius:10px; font-size:0.85rem; font-weight:600; box-shadow:0 8px 24px rgba(0,0,0,0.25); animation:lp-toast-in 0.25s ease-out; }
        @keyframes lp-toast-in { from{opacity:0;transform:translate(-50%,-12px);}to{opacity:1;transform:translate(-50%,0);} }
        .lp-form { display:flex; flex-direction:column; gap:20px; }
        .lp-field { display:flex; flex-direction:column; gap:5px; }
        .lp-row { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
        .lp-label { font-size:0.67rem; font-weight:700; letter-spacing:0.09em; color:var(--text-muted); text-transform:uppercase; }
        .lp-req { color:#f87171; }
        .lp-input,.lp-select,.lp-textarea { background:#f8fbf2; border:1px solid rgba(165,194,111,0.20); border-radius:10px; padding:11px 14px; color:var(--text-dark); font-size:0.87rem; font-family:inherit; outline:none; width:100%; box-sizing:border-box; transition:border-color 0.2s,background 0.2s; }
        html[data-theme='dark'] .lp-input, html[data-theme='dark'] .lp-select, html[data-theme='dark'] .lp-textarea { background:#1a1a1a; border:1px solid rgba(255,255,255,0.12); color:#fff; }
        .lp-input:focus,.lp-select:focus,.lp-textarea:focus { border-color:rgba(141,198,63,0.65); background:#fff; }
        html[data-theme='dark'] .lp-input:focus, html[data-theme='dark'] .lp-select:focus, html[data-theme='dark'] .lp-textarea:focus { background:#232323; border-color:rgba(228,88,33,0.5); }
        .lp-input--err { border-color:rgba(248,113,113,0.45)!important; background:#fff7f7; }
        .lp-select { appearance:none; -webkit-appearance:none; cursor:pointer; }
        .lp-select:disabled { cursor:not-allowed; opacity:0.72; }
        .lp-textarea { resize:vertical; min-height:110px; }
        .lp-prefix-wrap { position:relative; display:flex; }
        .lp-prefix { position:absolute; left:13px; top:50%; transform:translateY(-50%); font-size:0.8rem; font-weight:600; color:rgba(61,92,26,0.55); pointer-events:none; }
        html[data-theme='dark'] .lp-prefix { color:rgba(255,255,255,0.45); }
        .lp-input--pre { padding-left:34px; }
        .lp-char-count { font-size:0.67rem; color:rgba(61,92,26,0.42); text-align:right; margin-top:-3px; }
        html[data-theme='dark'] .lp-char-count { color:rgba(255,255,255,0.35); }
        .lp-err { display:flex; align-items:center; gap:5px; font-size:0.71rem; color:#f87171; margin:0; }
        .lp-pills { display:flex; flex-wrap:wrap; gap:7px; }
        .lp-pill { padding:6px 15px; border-radius:999px; font-size:0.79rem; font-weight:600; cursor:pointer; background:#f6faef; border:1px solid rgba(165,194,111,0.18); color:var(--text-muted); transition:all 0.2s; }
        .lp-pill:hover { background:#ffffff; color:var(--text-dark); }
        .lp-pill--active { background:rgba(174,220,90,0.22); border-color:rgba(141,198,63,0.42); color:var(--text-dark); }
        html[data-theme='dark'] .lp-pill { background:#1a1a1a; border:1px solid rgba(255,255,255,0.12); color:rgba(255,255,255,0.6); }
        html[data-theme='dark'] .lp-pill--active { background:rgba(228,88,33,0.22); border-color:rgba(228,88,33,0.45); color:#fff; }
        .lp-submit-btn { display:flex; align-items:center; justify-content:center; gap:10px; width:100%; padding:16px 24px; background:linear-gradient(135deg,#E45821,#f07040); border:none; border-radius:14px; color:#fff; font-size:0.96rem; font-weight:800; letter-spacing:0.03em; cursor:pointer; transition:transform 0.2s,box-shadow 0.2s; margin-top:8px; box-shadow:0 4px 20px rgba(228,88,33,0.35); }
        .lp-submit-btn:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 8px 28px rgba(228,88,33,0.50); }
        .lp-submit-btn:disabled { opacity:0.7; cursor:not-allowed; }
        .lp-cancel-btn { display:flex; align-items:center; justify-content:center; padding:16px 24px; background:transparent; border:1px solid rgba(165,194,111,0.35); border-radius:14px; color:var(--text-muted); font-size:0.96rem; font-weight:700; cursor:pointer; transition:all 0.2s; margin-top:8px; min-width:120px; }
        .lp-cancel-btn:hover:not(:disabled) { background:rgba(165,194,111,0.1); color:var(--text-dark); }
        .lp-cancel-btn:disabled { opacity:0.6; cursor:not-allowed; }
        html[data-theme='dark'] .lp-cancel-btn { border-color:rgba(255,255,255,0.15); color:rgba(255,255,255,0.5); }
        @media (max-width:480px) { .lp-page{padding:14px 14px 52px;} .lp-section{padding:18px 16px;} .lp-row{grid-template-columns:1fr;gap:10px;} .lp-title{font-size:clamp(1.65rem,7vw,2.2rem);} }
      `}</style>
    </div>
  );
};

export default EditProductPage;
