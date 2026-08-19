import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiArrowLeft, FiX,
  FiAlertCircle, FiCheck,
} from "react-icons/fi";
import { api } from "../../services/api";
import { generateUUID } from "../../utils/uuid";

const CATEGORIES = ["Electronics", "Gaming", "Fashion", "Sports", "Books", "Home", "Vehicles", "Toys", "Phones", "Clothing", "Furniture", "Jewelry", "Other"];
const SUB_CATEGORIES: Record<string, string[]> = {
  Electronics: ["Mobile Phones", "Laptops", "Tablets", "Audio", "Cameras", "Smartwatches", "TVs"],
  Gaming: ["Consoles", "Games", "Controllers", "PC Gaming", "Accessories"],
  Fashion: ["Men's", "Women's", "Shoes", "Bags", "Accessories", "Watches"],
  Sports: ["Cricket", "Football", "Fitness", "Cycling", "Boxing", "Tennis"],
  Books: ["Fiction", "Non-Fiction", "Academic", "Comics", "Religion"],
  Home: ["Furniture", "Kitchen", "Decor", "Appliances", "Garden"],
  Vehicles: ["Cars", "Bikes", "Scooters", "Parts & Accessories"],
  Toys: ["Action Figures", "Board Games", "Remote Control", "Educational", "Dolls"],
  Phones: ["Smartphones", "Feature Phones", "Accessories", "Spare Parts"],
  Clothing: ["Men's", "Women's", "Kids", "Traditional", "Sportswear"],
  Furniture: ["Sofa & Chairs", "Beds & Mattresses", "Tables", "Wardrobes", "Office"],
  Jewelry: ["Gold", "Silver", "Artificial", "Watches", "Rings & Bracelets"],
};
const CONDITIONS = ["Brand New", "Like New", "Good", "Fair", "For Parts"];
const CITIES = ["Karachi", "Lahore", "Islamabad", "Rawalpindi", "Faisalabad", "Multan", "Peshawar", "Quetta", "Hyderabad", "Sialkot", "Other"];
const MAX_PHOTOS = 6;

const ListProductPage = () => {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<{ file: File, url: string }[]>([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [description, setDescription] = useState("");
  const [condition, setCondition] = useState("");
  const [price, setPrice] = useState("");
  const [swapFor, setSwapFor] = useState("");
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  // const [submitted, setSubmitted] = useState(false);
  // Remove: const [submitted, setSubmitted] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

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
    if (!city) e.city = "City is required";
    if (!photos.length) e.photos = "Add at least one photo";
    if (!swapFor.trim()) e.swapFor = "Please enter what you want to swap for";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      // --- Temporary Bypass for Auth ---
      let userStr = localStorage.getItem("sz_user");
      let user = userStr ? JSON.parse(userStr) : null;

      // If no user is logged in, we use a dummy user ID so they can still list a product
      if (!user?.id) {
        user = { id: 'dummy-user-id-1234', name: 'Guest User' };
      }

      const productId = generateUUID();
      const imageUrls = [];

      for (const p of photos) {
        if (p.file) {
          const formData = new FormData();
          formData.append('image', p.file);

          const uploadResponse = await api.uploadImage(formData);

          if (uploadResponse.url) {
            imageUrls.push(uploadResponse.url);
          } else {
            console.error("Image upload failed", uploadResponse);
            imageUrls.push('https://placehold.co/600x400?text=Upload+Failed');
          }
        }
      }

      const response = await api.createProduct({
        id: productId,
        user_id: user.id,
        title,
        description,
        category,
        condition,
        swap_for: swapFor,
        image_urls: imageUrls,
        status: 'active',
        saved_count: 0
      });

      if (response.error) throw new Error(response.error);

      // Save city to user profile so it shows up on product cards
      if (user.id && user.id !== 'dummy-user-id-1234' && city) {
        try {
          await api.updateProfile(user.id, { city });
        } catch (err) {
          // Ignore profile update errors
        }
      }

      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      resetForm(); // agar form clear karna ho, warna yeh line hata do
    }
    catch (err: any) {
      console.error(err);
      alert(err.message || "Error listing product.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setPhotos([]); setTitle(""); setCategory("");
    setSubCategory(""); setBrand(""); setModel(""); setDescription("");
    setCondition(""); setPrice(""); setSwapFor(""); setCity(""); setArea("");
    setErrors({});
  };

  return (
    <div className="lp-page">
      <div className="lp-bg" />

      {showToast && (
        <div className="lp-toast">
          <FiCheck size={16} />
          <span>Listing published successfully!</span>
        </div>
      )}

      <div className="lp-wrap">

        {/* Page header */}
        <div className="lp-page-header">
          <button className="lp-back" onClick={() => navigate(-1)}>
            <FiArrowLeft size={15} /> Back
          </button>
          <div>
            <h1 className="lp-title">List an Item</h1>
            <p className="lp-sub">Fill in the details below to publish your listing on SVAP</p>
          </div>
        </div>

        {/* Single-column stacked layout: Photos on top, then the rest of the form */}
        <div className="lp-layout">

          {/* Photos panel — now at the top */}
          <div className="lp-section">
            <button
              type="button"
              className={`lp-dropzone${errors.photos ? " lp-dropzone--err" : ""}`}
              onClick={() => fileRef.current?.click()}
            >
              <span className="lp-dropzone-icon">
                <img src="/ICONS/Camera.png" alt="Camera" width={28} height={28} style={{ objectFit: 'contain' }} />
              </span>
              <span className="lp-dropzone-title">Add Photos</span>
              <span className="lp-dropzone-sub">Tap To Upload · Max {MAX_PHOTOS} Photos · JPG, PNG</span>
            </button>

            {/* Photo tiles: uploaded thumbnails + remaining empty add-slots */}
            <div className="lp-photo-tiles">
              {photos.map((p, i) => (
                <div key={i} className="lp-photo-tile lp-photo-tile--filled">
                  <img src={p.url} alt="" className="lp-photo-img" />
                  {i === 0 && <span className="lp-photo-tile-cover">Cover</span>}
                  <button type="button" className="lp-photo-remove"
                    onClick={() => setPhotos((prev) => prev.filter((_, j) => j !== i))} aria-label="Remove photo">
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

          {/* Form — below photos */}
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

              <div className="lp-row">
                <div className="lp-field">
                  <label className="lp-label">CATEGORY <span className="lp-req">*</span></label>
                  <select className={`lp-select${errors.category ? " lp-input--err" : ""}`}
                    value={category} onChange={(e) => { setCategory(e.target.value); setSubCategory(""); }}>
                    <option value="">Select...</option>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {errors.category && <p className="lp-err"><FiAlertCircle size={11} />{errors.category}</p>}
                </div>
                <div className="lp-field">
                  <label className="lp-label">SUB-CATEGORY</label>
                  {category === "Other" ? (
                    <input
                      className="lp-input"
                      placeholder="Type your sub-category..."
                      value={subCategory}
                      onChange={(e) => setSubCategory(e.target.value)}
                      maxLength={50}
                    />
                  ) : (
                    <select className="lp-select" value={subCategory}
                      onChange={(e) => setSubCategory(e.target.value)} disabled={!category}>
                      <option value="">Select...</option>
                      {(SUB_CATEGORIES[category] || []).map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  )}
                </div>
              </div>

              <div className="lp-row">
                <div className="lp-field">
                  <label className="lp-label">BRAND</label>
                  <input className="lp-input" placeholder="e.g. Apple"
                    value={brand} onChange={(e) => setBrand(e.target.value)} />
                </div>
                <div className="lp-field">
                  <label className="lp-label">MODEL / SKU</label>
                  <input className="lp-input" placeholder="e.g. MQ9G3LL/A"
                    value={model} onChange={(e) => setModel(e.target.value)} />
                </div>
              </div>

              <div className="lp-field">
                <label className="lp-label">DESCRIPTION <span className="lp-req">*</span></label>
                <textarea className={`lp-textarea${errors.description ? " lp-input--err" : ""}`}
                  placeholder="Describe your item — condition details, accessories included, reason for listing, any defects..."
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
                <div className=" lp-pills">
                  {CONDITIONS.map((c) => (
                    <button key={c} type="button"
                      className={`lp-pill${condition === c ? " lp-pill--active" : ""}`}
                      onClick={() => setCondition(c)}>{c}</button>
                  ))}
                </div>
                {errors.condition && <p className="lp-err"><FiAlertCircle size={11} />{errors.condition}</p>}
              </div>

              <div className="lp-row">
                <div className="lp-field">
                  <label className="lp-label">ASKING PRICE (optional)</label>
                  <div className="lp-prefix-wrap">
                    <span className="lp-prefix">Rs</span>
                    <input className="lp-input lp-input--pre" placeholder="e.g. 45,000"
                      value={price} onChange={(e) => setPrice(e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="lp-field">
                <label className="lp-label">THING WANT TO SVAP WITH IT? <span className="lp-req">*</span></label>
                <input
                  className={`lp-input${errors.swapFor ? " lp-input--err" : ""}`}
                  placeholder="e.g. MacBook Air M2, iPhone 15, PS5..."
                  value={swapFor}
                  onChange={(e) => setSwapFor(e.target.value)}
                  maxLength={120}
                />
                <span className="lp-char-count">{swapFor.length}/120</span>
                {errors.swapFor && <p className="lp-err"><FiAlertCircle size={11} />{errors.swapFor}</p>}
              </div>
            </div>

            {/* ── Location ── */}
            <div className="lp-section">
              <div className="lp-section-head">
                <img src="/ICONS/Location.png" alt="Location" className="lp-section-icon-img lp-section-icon-img--filter" />
                <div>
                  <span className="lp-section-title">Location</span>
                  <span className="lp-section-desc">Where the svap will happen</span>
                </div>
              </div>
              <div className="lp-row">
                <div className="lp-field">
                  <label className="lp-label">CITY <span className="lp-req">*</span></label>
                  {city === "Other" ? (
                    <input
                      className={`lp-input${errors.city ? " lp-input--err" : ""}`}
                      placeholder="Type your city..."
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      maxLength={50}
                    />
                  ) : (
                    <select className={`lp-select${errors.city ? " lp-input--err" : ""}`}
                      value={city} onChange={(e) => { setCity(e.target.value); setArea(""); }}>
                      <option value="">Select city...</option>
                      {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  )}
                  {errors.city && <p className="lp-err"><FiAlertCircle size={11} />{errors.city}</p>}
                </div>
                <div className="lp-field">
                  <label className="lp-label">AREA / LOCALITY</label>
                  <input className="lp-input" placeholder="e.g. DHA Phase 5"
                    value={area} onChange={(e) => setArea(e.target.value)} />
                </div>
              </div>
            </div>

            {/* Submit */}
            <button type="submit" className="lp-submit-btn" disabled={loading}>
              {loading ? "Publishing..." : <><FiCheck size={16} /> Publish Listing</>}
            </button>

          </form>
        </div>
      </div>

      <style>{`
        /* ── Base ── */
        .lp-page {
          min-height: 100vh;
          background:
            radial-gradient(circle at top left, rgba(228,88,33,0.08), transparent 32%),
            radial-gradient(circle at bottom right, rgba(49,60,92,0.08), transparent 30%),
            linear-gradient(180deg, #f8f9fc 0%, #ffffff 40%, #f8f9fc 100%);
          padding: 24px 24px 72px;
          box-sizing: border-box;
          font-family: 'Poppins','Helvetica Neue',Arial,sans-serif;
          position: relative;
          color: var(--text-dark);
          overflow: hidden;
        }

        html[data-theme='dark'] .lp-page {
          background: #0a0a0a;
          color: #f5f5f5;
        }
        .lp-bg {
          position: fixed;
          inset: 0;
          background:
            radial-gradient(circle at 20% 20%, rgba(174,220,90,0.12), transparent 24%),
            radial-gradient(circle at 80% 0%, rgba(96,121,255,0.10), transparent 26%),
            linear-gradient(180deg, rgba(255,255,255,0.72) 0%, rgba(247,255,235,0.55) 100%);
          z-index: 0;
          pointer-events: none;
        }

        html[data-theme='dark'] .lp-bg {
          background: #0a0a0a;
        }

        .lp-wrap {
          position: relative; z-index: 1;
          width: 100%;
          max-width: 780px;
          margin: 0 auto;
        }

        /* ── Page header ── */
        .lp-page-header { margin-bottom: 32px; }
        .lp-back {
          display: inline-flex; align-items: center; gap: 6px;
          color: var(--text-muted); font-size: 0.82rem; font-weight: 600;
          background: none; border: none; cursor: pointer; padding: 0;
          margin-bottom: 14px; transition: color 0.18s;
        }
        .lp-back:hover { color: var(--text-dark); }
        .lp-title {
          font-size: clamp(1.9rem, 2.8vw, 2.8rem); font-weight: 800;
          color: var(--text-dark); letter-spacing: -0.02em; margin: 0 0 5px; line-height: 1.1;
        }
        .lp-sub { font-size: 0.9rem; color: var(--text-muted); margin: 0; }

        /* ── Single-column stacked layout ── */
        .lp-layout {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        /* ── Section card ── */
        .lp-section {
          background: rgba(255,255,255,0.92);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          border: 1px solid rgba(165,194,111,0.26);
          box-shadow: 0 18px 40px rgba(26,46,10,0.06);
          border-radius: 18px;
          padding: 22px;
          display: flex; flex-direction: column; gap: 16px;
        }

        html[data-theme='dark'] .lp-section {
          background: rgba(26, 26, 26, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.12);
          box-shadow: 0 18px 40px rgba(0, 0, 0, 0.3);
        }
        .lp-section-head {
          display: flex; align-items: flex-start; gap: 10px;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(228,88,33,0.12);
        }
        .lp-section-icon { color: #E45821; margin-top: 2px; flex-shrink: 0; }
        .lp-section-icon-img {
          width: 18px; height: 18px; object-fit: contain; flex-shrink: 0; margin-top: 1px;
        }
        .lp-section-icon-img--filter {
          filter: none;
        }
        html[data-theme='dark'] .lp-section-icon-img--filter {
          filter: brightness(0) invert(1);
        }
        .lp-section-title { display: block; font-size: 0.9rem; font-weight: 700; color: var(--text-dark); }
        .lp-section-desc  { display: block; font-size: 0.72rem; color: var(--text-muted); margin-top: 1px; }

        .lp-dropzone {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 36px 20px;
          background: linear-gradient(135deg, rgba(228,88,33,0.04), rgba(49,60,92,0.03));
          border: 2px dashed rgba(228,88,33,0.40);
          border-radius: 16px;
          cursor: pointer;
          font-family: inherit;
          transition: border-color 0.2s, background 0.2s;
        }
        .lp-dropzone:hover {
          border-color: rgba(228,88,33,0.72);
          background: linear-gradient(135deg, rgba(228,88,33,0.08), rgba(49,60,92,0.05));
        }
        .lp-dropzone--err { border-color: rgba(248,113,113,0.55); }
        .lp-dropzone-icon {
          width: 58px; height: 58px; border-radius: 50%;
          background: rgba(228,88,33,0.10);
          border: 2px solid rgba(228,88,33,0.25);
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 4px;
          overflow: hidden;
        }
        .lp-dropzone-title { font-size: 1rem; font-weight: 800; color: var(--text-dark); }
        .lp-dropzone-sub { font-size: 0.72rem; color: var(--text-muted); text-align: center; }

        /* ── Photo tiles ── */
        .lp-photo-tiles {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
        }


        .lp-toast {
  position: fixed;
  top: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 8px;
  background: #1a2e0a;
  color: #fff;
  padding: 12px 20px;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 600;
  box-shadow: 0 8px 24px rgba(0,0,0,0.25);
  animation: lp-toast-in 0.25s ease-out;
}

@keyframes lp-toast-in {
  from { opacity: 0; transform: translate(-50%, -12px); }
  to { opacity: 1; transform: translate(-50%, 0); }
}
        .lp-photo-tile {
          position: relative;
          aspect-ratio: 1;
          border-radius: 14px;
          overflow: hidden;
          border: none;
          padding: 0;
        }
        .lp-photo-tile--add {
          background: #ff6a1a;
          color: #fff;
          font-size: 1.5rem;
          font-weight: 300;
          line-height: 1;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: background 0.2s, transform 0.15s;
        }
        .lp-photo-tile--add:hover { background: #ea5b0f; transform: translateY(-1px); }
        .lp-photo-tile--filled { border: 1px solid rgba(165,194,111,0.24); }
        .lp-photo-img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .lp-photo-tile-cover {
          position: absolute; top: 6px; left: 6px;
          background: rgba(26,46,10,0.78); color: #fff;
          font-size: 0.56rem; font-weight: 700; letter-spacing: 0.05em;
          padding: 2px 7px; border-radius: 5px; text-transform: uppercase;
        }
        .lp-photo-remove {
          position: absolute; top: 5px; right: 5px; width: 20px; height: 20px;
          border-radius: 50%; background: rgba(0,0,0,0.55); border: none;
          color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center;
          transition: background 0.18s;
        }
        .lp-photo-remove:hover { background: rgba(248,113,113,0.9); }

        @media (max-width: 480px) {
          .lp-photo-tiles { grid-template-columns: repeat(4, 1fr); gap: 8px; }
          .lp-dropzone { padding: 24px 16px; }
        }

        /* ── Form ── */
        .lp-form { display:flex; flex-direction:column; gap:20px; }
        .lp-field { display:flex; flex-direction:column; gap:5px; }
        .lp-row { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
        .lp-label {
          font-size:0.67rem; font-weight:700; letter-spacing:0.09em;
          color:var(--text-muted); text-transform:uppercase;
        }
        .lp-req { color:#f87171; }

        .lp-input, .lp-select, .lp-textarea {
          background:#f8fbf2;
          border:1px solid rgba(165,194,111,0.20);
          border-radius:10px; padding:11px 14px;
          color:var(--text-dark); font-size:0.87rem; font-family:inherit;
          outline:none; width:100%; box-sizing:border-box;
          transition:border-color 0.2s, background 0.2s;
        }

        html[data-theme='dark'] .lp-input,
        html[data-theme='dark'] .lp-select,
        html[data-theme='dark'] .lp-textarea {
          background: #1a1a1a;
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #fff;
        }

        html[data-theme='dark'] .lp-input::placeholder,
        html[data-theme='dark'] .lp-textarea::placeholder {
          color: rgba(255, 255, 255, 0.3);
        }

        html[data-theme='dark'] .lp-input:focus,
        html[data-theme='dark'] .lp-select:focus,
        html[data-theme='dark'] .lp-textarea:focus {
          border-color: rgba(228, 88, 33, 0.5);
          background: #232323;
        }
        .lp-input::placeholder, .lp-textarea::placeholder { color:rgba(61,92,26,0.40); }
        .lp-input:focus, .lp-select:focus, .lp-textarea:focus {
          border-color:rgba(141,198,63,0.65); background:#fff;
        }
        .lp-input--err { border-color:rgba(248,113,113,0.45) !important; background:#fff7f7; }

        .lp-select {
          appearance: none;
          -webkit-appearance: none;
          -moz-appearance: none;

          background: #f8fbf2;
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);

          color: var(--text-dark);

          border: 1px solid rgba(165,194,111,0.20);
          border-radius: 14px;

          cursor: pointer;

          position: relative;
          z-index: 100;
        }

        .lp-select option {
          background: #ffffff;
          color: var(--text-dark);
          padding: 12px;
        }

        html[data-theme='dark'] .lp-select {
          background: #1a1a1a;
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #fff;
        }

        html[data-theme='dark'] .lp-select option {
          background: #1a1a1a;
          color: #fff;
        }

        .lp-select:disabled {
          cursor: not-allowed;
          opacity: 0.72;
          background: #f3f5ee;
          color: rgba(61,92,26,0.45);
        }

        html[data-theme='dark'] .lp-select:disabled {
          background: #151515;
          color: rgba(255,255,255,0.35);
        }
        .lp-textarea { resize:vertical; min-height:110px; }

        .lp-prefix-wrap { position:relative; display:flex; }
        .lp-prefix {
          position:absolute; left:13px; top:50%; transform:translateY(-50%);
          font-size:0.8rem; font-weight:600; color:rgba(61,92,26,0.55); pointer-events:none;
        }

        html[data-theme='dark'] .lp-prefix {
          color: rgba(255,255,255,0.45);
        }
        .lp-input--pre { padding-left:34px; }

        .lp-char-count { font-size:0.67rem; color:rgba(61,92,26,0.42); text-align:right; margin-top:-3px; }

        html[data-theme='dark'] .lp-char-count {
          color: rgba(255,255,255,0.35);
        }
        .lp-err {
          display:flex; align-items:center; gap:5px;
          font-size:0.71rem; color:#f87171; margin:0;
        }

        /* Pills */
        .lp-pills { display:flex; flex-wrap:wrap; gap:7px; }
        .lp-pill {
          padding:6px 15px; border-radius:999px;
          font-size:0.79rem; font-weight:600; cursor:pointer;
          background:#f6faef;
          border:1px solid rgba(165,194,111,0.18);
          color:var(--text-muted);
          transition:all 0.2s;
        }
        .lp-pill:hover { background:#ffffff; color:var(--text-dark); }
        .lp-pill--active {
          background:rgba(174,220,90,0.22);
          border-color:rgba(141,198,63,0.42);
          color:var(--text-dark);
        }

        html[data-theme='dark'] .lp-pill {
          background: #1a1a1a;
          border: 1px solid rgba(255,255,255,0.12);
          color: rgba(255,255,255,0.6);
        }
        html[data-theme='dark'] .lp-pill:hover {
          background: #232323;
          color: #fff;
        }
        html[data-theme='dark'] .lp-pill--active {
          background: rgba(228,88,33,0.22);
          border-color: rgba(228,88,33,0.45);
          color: #fff;
        }

        /* ── Submit button ── */
        .lp-submit-btn {
          display:flex; align-items:center; justify-content:center; gap:10px;
          width:100%; padding:16px 24px;
          background: linear-gradient(135deg, #E45821, #f07040);
          border: none;
          border-radius:14px;
          color:#fff;
          font-size:0.96rem; font-weight:800; letter-spacing:0.03em;
          cursor:pointer;
          transition:transform 0.2s, box-shadow 0.2s;
          margin-top:8px;
          box-shadow: 0 4px 20px rgba(228,88,33,0.35);
        }
        .lp-submit-btn:hover {
          transform:translateY(-2px);
          box-shadow: 0 8px 28px rgba(228,88,33,0.50);
        }

        /* ── Success ── */
        .lp-success {
          position:relative; z-index:1;
          display:flex; flex-direction:column; align-items:center;
          justify-content:center; min-height:60vh; gap:14px; text-align:center;
          padding:40px 20px;
        }
        .lp-success-icon {
          width:80px; height:80px; border-radius:50%;
          background:rgba(174,220,90,0.18); border:1px solid rgba(141,198,63,0.24);
          display:flex; align-items:center; justify-content:center;
          color:var(--text-dark); margin-bottom:8px;
        }
        .lp-success-title { font-size:1.7rem; font-weight:800; color:var(--text-dark); margin:0; }
        .lp-success-desc { font-size:0.9rem; color:var(--text-muted); margin:0; max-width:360px; }
        .lp-success-desc strong { color:var(--text-dark); }
        .lp-success-btns { display:flex; gap:10px; flex-wrap:wrap; justify-content:center; margin-top:8px; }
        .lp-success-btn { padding:11px 22px; border-radius:10px; font-size:0.87rem; font-weight:700; cursor:pointer; transition:background 0.2s; }
        .lp-success-btn--white { background:var(--svap-lime); border:1px solid rgba(141,198,63,0.3); color:#000; }
        .lp-success-btn--white:hover { background:var(--btn-swap); }
        .lp-success-btn--ghost { background:rgba(255,255,255,0.82); border:1px solid rgba(165,194,111,0.20); color:var(--text-mid); }
        .lp-success-btn--ghost:hover { background:#fff; color:var(--text-dark); }

        /* ── Responsive ── */
        @media (max-width: 480px) {
          .lp-page { padding: 14px 14px 52px; }
          .lp-section { padding: 18px 16px; }
          .lp-row { grid-template-columns: 1fr; gap: 10px; }
          .lp-title { font-size: clamp(1.65rem, 7vw, 2.2rem); }

        }
      `}</style>
    </div>
  );
};

export default ListProductPage;