import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiX, FiAlertCircle, FiCheck, FiCamera,
} from "react-icons/fi";
import { api } from "../../services/api";
import { generateUUID } from "../../utils/uuid";

const CATEGORIES = [
  "Clothing", "Shoes", "Accessories", "Toys",
  "Textiles", "Decor", "Books", "Sports", "Other"
];

const CONDITIONS = ["Mint", "Like New", "Good", "Fair"];

const MAX_PHOTOS = 5;

const ListProductPage = () => {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const reelRef = useRef<HTMLInputElement>(null);

  const [photos, setPhotos] = useState<{ file: File, url: string }[]>([]);
  const [reel, setReel] = useState<{ file: File, url: string } | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [condition, setCondition] = useState("");
  const [swapFor, setSwapFor] = useState("");
  const [estimatedValue, setEstimatedValue] = useState("");

  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handlePhotoAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.slice(0, MAX_PHOTOS - photos.length).forEach((file) => {
      setPhotos((prev) => [...prev, { file, url: URL.createObjectURL(file) }]);
    });
    e.target.value = "";
    setErrors((prev) => ({ ...prev, photos: "" }));
  };

  const handleReelSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("video/")) return;
    setReel({ file, url: URL.createObjectURL(file) });
    setErrors((prev) => ({ ...prev, reel: "" }));
    e.target.value = "";
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!photos.length) e.photos = "Add at least one photo";
    if (!reel) e.reel = "Add a reel video";
    if (!category) e.category = "Select a category";
    if (!title.trim()) e.title = "Enter item title";
    if (!description.trim()) e.description = "Enter description";
    if (!condition) e.condition = "Select condition";
    if (!swapFor.trim()) e.swapFor = "Enter what you want to swap for";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      let userStr = localStorage.getItem("sz_user");
      let user = userStr ? JSON.parse(userStr) : null;

      if (!user?.id) {
        alert("Please login to list a product");
        navigate('/login');
        return;
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
            imageUrls.push('https://placehold.co/600x400?text=Upload+Failed');
          }
        }
      }

      let reelUrl: string | undefined;
      if (reel) {
        const reelFormData = new FormData();
        reelFormData.append('video', reel.file);
        const reelUpload = await api.uploadVideo(reelFormData);
        if (!reelUpload.url) throw new Error(reelUpload.error || 'Reel upload failed');
        reelUrl = reelUpload.url;
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
        ...(reelUrl ? { video_url: reelUrl } : {}),
        status: 'active',
        saved_count: 0
      });

      if (response?.error) throw new Error(response.error);

      const fixedCity = "Karachi";
      if (user.id) {
        try {
          await api.updateProfile(user.id, { city: fixedCity });
        } catch (err) {
          // Ignore
        }
      }

      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        navigate('/');
      }, 2000);

      resetForm();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Error listing product.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setPhotos([]);
    setReel(null);
    setTitle("");
    setCategory("");
    setDescription("");
    setCondition("");
    setSwapFor("");
    setEstimatedValue("");
    setErrors({});
  };

  return (
    <div className="lp-page">
      {showToast && (
        <div className="lp-toast">
          <FiCheck size={16} />
          <span>Listing published successfully!</span>
        </div>
      )}

      <div className="lp-container">
        {/* Header */}
        <div className="lp-header">
          <button className="lp-close" onClick={() => navigate(-1)}>
            <FiX size={24} />
          </button>
          <h1 className="lp-title">List an item</h1>
        </div>

        <form className="lp-form" onSubmit={handleSubmit} noValidate>
          {/* Takes about a minute text */}
          <p className="lp-hint">Takes about a minute. Fill out the details below.</p>

          {/* Photos Section */}
          <div className="lp-section">
            <div className="lp-field-header">
              <span className="lp-label">Photos <span className="lp-req">Required</span></span>
            </div>

            {/* Tips box */}
            <div className="lp-tips-box">
              <div className="lp-tips-header">
                <FiCamera size={14} />
                <span>Tips for great photos</span>
              </div>
              <ul className="lp-tips-list">
                <li>Use natural light avoid dark rooms or harsh flash</li>
                <li>Shoot against a plain background for a clean look</li>
                <li>Include multiple angles: front, back, sides & any defects</li>
                <li>Keep the item in frame no cropping or blurry shots</li>
              </ul>
            </div>

            {/* Photo upload area */}
            <div
              className={`lp-photo-upload ${errors.photos ? 'error' : ''}`}
              onClick={() => fileRef.current?.click()}
            >
              <FiCamera size={32} />
              <div className="lp-photo-upload-text">
                <span>Add photos</span>
                <small>Up to {MAX_PHOTOS} · clear, well-lit</small>
              </div>
            </div>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={handlePhotoAdd}
            />

            {photos.length > 0 && (
              <div className="lp-photo-grid">
                {photos.map((p, i) => (
                  <div key={i} className="lp-photo-item">
                    <img src={p.url} alt="" />
                    <button
                      type="button"
                      className="lp-photo-remove"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPhotos((prev) => prev.filter((_, j) => j !== i));
                      }}
                    >
                      <FiX size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {errors.photos && (
              <p className="lp-error">
                <FiAlertCircle size={12} />
                {errors.photos}
              </p>
            )}
          </div>

          {/* Reel Video Section */}
          <div className="lp-section">
            <div className="lp-field-header">
              <span className="lp-label">Reel Video <span className="lp-req">Required</span></span>
            </div>

            {reel ? (
              <div className="lp-reel-preview">
                <video src={reel.url} controls playsInline />
                <button
                  type="button"
                  className="lp-reel-remove"
                  onClick={() => setReel(null)}
                >
                  <FiX size={14} />
                </button>
              </div>
            ) : (
              <div
                className={`lp-reel-upload ${errors.reel ? 'error' : ''}`}
                onClick={() => reelRef.current?.click()}
              >
                <FiCamera size={24} />
                <div>
                  <span>Add a short reel</span>
                  <small>Up to 60 seconds</small>
                </div>
              </div>
            )}

            <input
              ref={reelRef}
              type="file"
              accept="video/*"
              hidden
              onChange={handleReelSelect}
            />

            {errors.reel && (
              <p className="lp-error">
                <FiAlertCircle size={12} />
                {errors.reel}
              </p>
            )}
          </div>

          {/* Category */}
          <div className="lp-section">
            <div className="lp-field-header">
              <span className="lp-label">Category</span>
            </div>
            <div className="lp-categories">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`lp-category-btn ${category === cat ? 'active' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Category clicked:', cat);
                    setCategory(cat);
                    setErrors((prev) => ({ ...prev, category: "" }));
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Category touched:', cat);
                    setCategory(cat);
                    setErrors((prev) => ({ ...prev, category: "" }));
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
            {errors.category && (
              <p className="lp-error">
                <FiAlertCircle size={12} />
                {errors.category}
              </p>
            )}
          </div>

          {/* What is it? */}
          <div className="lp-section">
            <div className="lp-field-header">
              <span className="lp-label">What is it?</span>
            </div>
            <div className="lp-input-wrap">
              <FiCamera size={16} className="lp-input-icon" />
              <input
                type="text"
                className={`lp-input ${errors.title ? 'error' : ''}`}
                placeholder="e.g. Solid oak side stool"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setErrors((prev) => ({ ...prev, title: "" }));
                }}
                maxLength={80}
              />
            </div>
            <p className="lp-field-hint">A clear, short title gets more swap offers.</p>
            {errors.title && (
              <p className="lp-error">
                <FiAlertCircle size={12} />
                {errors.title}
              </p>
            )}
          </div>

          {/* City */}
          <div className="lp-section">
            <div className="lp-field-header">
              <span className="lp-label">City</span>
            </div>
            <div className="lp-city-wrap">
              <span className="lp-city-icon">🏙️</span>
              <select className="lp-select" value="Karachi" disabled>
                <option value="Karachi">Karachi</option>
              </select>
              <span className="lp-dropdown-icon">▼</span>
            </div>
            <p className="lp-field-hint">More cities coming soon</p>
          </div>

          {/* Condition */}
          <div className="lp-section">
            <div className="lp-field-header">
              <span className="lp-label">Condition</span>
            </div>
            <div className="lp-conditions">
              {CONDITIONS.map((cond) => (
                <button
                  key={cond}
                  type="button"
                  className={`lp-condition-btn ${condition === cond ? 'active' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Condition clicked:', cond);
                    setCondition(cond);
                    setErrors((prev) => ({ ...prev, condition: "" }));
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Condition touched:', cond);
                    setCondition(cond);
                    setErrors((prev) => ({ ...prev, condition: "" }));
                  }}
                >
                  {cond}
                </button>
              ))}
            </div>
            {errors.condition && (
              <p className="lp-error">
                <FiAlertCircle size={12} />
                {errors.condition}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="lp-section">
            <div className="lp-field-header">
              <span className="lp-label">Description</span>
            </div>
            <textarea
              className={`lp-textarea ${errors.description ? 'error' : ''}`}
              placeholder="Condition, dimensions, anything to know..."
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setErrors((prev) => ({ ...prev, description: "" }));
              }}
              maxLength={300}
              rows={4}
            />
            <div className="lp-char-count">{description.length}/300</div>
            {errors.description && (
              <p className="lp-error">
                <FiAlertCircle size={12} />
                {errors.description}
              </p>
            )}
          </div>

          {/* What would you swap for? */}
          <div className="lp-section">
            <div className="lp-field-header">
              <span className="lp-label">What would you swap for?</span>
            </div>
            <div className="lp-input-wrap">
              <FiCamera size={16} className="lp-input-icon" />
              <input
                type="text"
                className={`lp-input ${errors.swapFor ? 'error' : ''}`}
                placeholder="e.g. Vintage lamp, linen throw, books..."
                value={swapFor}
                onChange={(e) => {
                  setSwapFor(e.target.value);
                  setErrors((prev) => ({ ...prev, swapFor: "" }));
                }}
                maxLength={100}
              />
            </div>
            <p className="lp-field-hint">Helps others know what you're looking to swap for.</p>
            {errors.swapFor && (
              <p className="lp-error">
                <FiAlertCircle size={12} />
                {errors.swapFor}
              </p>
            )}
          </div>

          {/* Estimated value */}
          <div className="lp-section">
            <div className="lp-field-header">
              <span className="lp-label">Estimated value (PKR)</span>
            </div>
            <div className="lp-input-wrap">
              <span className="lp-input-icon" style={{ fontSize: '0.875rem' }}>₨</span>
              <input
                type="text"
                className="lp-input"
                placeholder="e.g. 5000"
                value={estimatedValue}
                onChange={(e) => setEstimatedValue(e.target.value.replace(/\D/g, ""))}
              />
            </div>
            <p className="lp-field-hint">Optional — helps match you with similar value items</p>
          </div>

          {/* Submit Button */}
          <button type="submit" className="lp-submit" disabled={loading}>
            {loading ? "Publishing..." : "List My Item"}
          </button>
        </form>
      </div>

      <style>{`
        .lp-page {
          min-height: 100vh;
          background: var(--bg);
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          color: var(--text-dark);
        }

        html[data-theme='dark'] .lp-page {
          background: #000000;
          color: #ffffff;
        }

        .lp-container {
          max-width: 100%;
          margin: 0 auto;
          padding-bottom: 100px;
        }

        /* Desktop container */
        @media (min-width: 768px) {
          .lp-container {
            max-width: 600px;
            padding-bottom: 60px;
          }
        }

        /* Header */
        .lp-header {
          position: sticky;
          top: 0;
          z-index: 100;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          background: var(--bg);
          border-bottom: 1px solid var(--border);
          backdrop-filter: blur(10px);
        }

        html[data-theme='dark'] .lp-header {
          background: rgba(0, 0, 0, 0.95);
          border-bottom-color: #1a1a1a;
        }

        /* Desktop alignment */
        @media (min-width: 768px) {
          .lp-header {
            justify-content: center;
            padding: 16px 20px;
          }
        }

        .lp-close {
          background: none;
          border: 1.5px solid var(--border);
          border-radius: 50%;
          color: var(--text-dark);
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          transition: all 0.2s;
        }

        html[data-theme='dark'] .lp-close {
          color: #ffffff;
          border-color: #2a2a2a;
        }

        .lp-close:hover {
          border-color: #E45821;
          background: rgba(228, 88, 33, 0.1);
        }

        /* Hide close button on desktop */
        @media (min-width: 768px) {
          .lp-close {
            display: none;
          }
        }

        .lp-title {
          font-size: 1.0625rem;
          font-weight: 600;
          margin: 0;
          color: var(--text-dark);
        }

        html[data-theme='dark'] .lp-title {
          color: #ffffff;
        }

        /* Desktop title styling */
        @media (min-width: 768px) {
          .lp-title {
            font-size: 1.375rem;
            font-weight: 700;
          }
        }

        /* Toast */
        .lp-toast {
          position: fixed;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 1000;
          display: flex;
          align-items: center;
          gap: 8px;
          background: #10b981;
          color: #fff;
          padding: 10px 16px;
          border-radius: 8px;
          font-size: 0.8125rem;
          font-weight: 500;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
        }

        /* Form */
        .lp-form {
          padding: 14px;
          pointer-events: auto;
        }

        /* Desktop form padding */
        @media (min-width: 768px) {
          .lp-form {
            padding: 24px 32px;
          }
        }

        .lp-hint {
          font-size: 0.75rem;
          color: var(--text-muted);
          margin: 0 0 16px;
          line-height: 1.4;
        }

        html[data-theme='dark'] .lp-hint {
          color: rgba(255, 255, 255, 0.5);
        }

        /* Section */
        .lp-section {
          margin-bottom: 20px;
          pointer-events: auto;
        }

        .lp-field-header {
          margin-bottom: 8px;
        }

        .lp-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-dark);
          display: block;
        }

        html[data-theme='dark'] .lp-label {
          color: #ffffff;
        }

        .lp-req {
          color: #ef4444;
          margin-left: 4px;
        }

        /* Tips Box */
        .lp-tips-box {
          background: var(--card-bg);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 10px;
          margin-bottom: 10px;
        }

        html[data-theme='dark'] .lp-tips-box {
          background: #1a1a1a;
          border-color: #2a2a2a;
        }

        .lp-tips-header {
          display: flex;
          align-items: center;
          gap: 5px;
          color: #E45821;
          font-size: 0.75rem;
          font-weight: 600;
          margin-bottom: 6px;
        }

        .lp-tips-list {
          margin: 0;
          padding-left: 16px;
          font-size: 0.6875rem;
          color: var(--text-muted);
          line-height: 1.4;
          list-style-type: disc;
          list-style-position: outside;
        }

        html[data-theme='dark'] .lp-tips-list {
          color: rgba(255, 255, 255, 0.6);
        }

        .lp-tips-list li {
          margin-bottom: 3px;
          display: list-item;
        }

        .lp-tips-list li::marker {
          color: #E45821;
        }

        /* Photo Upload */
        .lp-photo-upload {
          background: var(--card-bg);
          border: 2px dashed var(--border);
          border-radius: 8px;
          padding: 28px 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        html[data-theme='dark'] .lp-photo-upload {
          background: #1a1a1a;
          border-color: #2a2a2a;
        }

        .lp-photo-upload:hover {
          border-color: #E45821;
        }

        .lp-photo-upload.error {
          border-color: #ef4444;
        }

        .lp-photo-upload svg {
          color: var(--text-muted);
        }

        html[data-theme='dark'] .lp-photo-upload svg {
          color: rgba(255, 255, 255, 0.4);
        }

        .lp-photo-upload-text {
          text-align: center;
        }

        .lp-photo-upload-text span {
          display: block;
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--text-dark);
          margin-bottom: 2px;
        }

        html[data-theme='dark'] .lp-photo-upload-text span {
          color: #ffffff;
        }

        .lp-photo-upload-text small {
          display: block;
          font-size: 0.625rem;
          color: var(--text-muted);
        }

        html[data-theme='dark'] .lp-photo-upload-text small {
          color: rgba(255, 255, 255, 0.4);
        }

        /* Photo Grid */
        .lp-photo-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          margin-top: 10px;
        }

        .lp-photo-item {
          position: relative;
          aspect-ratio: 1;
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid var(--border);
        }

        html[data-theme='dark'] .lp-photo-item {
          border-color: #2a2a2a;
        }

        .lp-photo-item img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .lp-photo-remove {
          position: absolute;
          top: 5px;
          right: 5px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.6);
          border: none;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        /* Reel Upload */
        .lp-reel-upload {
          background: var(--card-bg);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 12px;
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
        }

        html[data-theme='dark'] .lp-reel-upload {
          background: #1a1a1a;
          border-color: #2a2a2a;
        }

        .lp-reel-upload.error {
          border-color: #ef4444;
        }

        .lp-reel-upload svg {
          color: #E45821;
          flex-shrink: 0;
        }

        .lp-reel-upload div {
          flex: 1;
        }

        .lp-reel-upload span {
          display: block;
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-dark);
          margin-bottom: 2px;
        }

        html[data-theme='dark'] .lp-reel-upload span {
          color: #ffffff;
        }

        .lp-reel-upload small {
          display: block;
          font-size: 0.625rem;
          color: var(--text-muted);
        }

        html[data-theme='dark'] .lp-reel-upload small {
          color: rgba(255, 255, 255, 0.4);
        }

        /* Reel Preview */
        .lp-reel-preview {
          position: relative;
        }

        .lp-reel-preview video {
          width: 100%;
          border-radius: 8px;
          background: #000;
          max-height: 220px;
        }

        .lp-reel-remove {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.7);
          border: none;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        /* Categories */
        .lp-categories {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          position: relative;
          z-index: 1;
        }

        .lp-category-btn {
          background: var(--card-bg);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 8px 14px;
          font-size: 0.75rem;
          font-weight: 500;
          color: var(--text-mid);
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s;
          -webkit-tap-highlight-color: transparent;
          user-select: none;
          pointer-events: auto;
          position: relative;
          z-index: 2;
          touch-action: manipulation;
        }

        html[data-theme='dark'] .lp-category-btn {
          background: #1a1a1a;
          border-color: #2a2a2a;
          color: rgba(255, 255, 255, 0.7);
        }

        .lp-category-btn:active {
          transform: scale(0.97);
        }

        .lp-category-btn.active {
          background: #E45821 !important;
          border-color: #E45821 !important;
          color: #ffffff !important;
          font-weight: 600;
        }

        html[data-theme='dark'] .lp-category-btn.active {
          background: #E45821 !important;
          border-color: #E45821 !important;
          color: #ffffff !important;
          box-shadow: 0 2px 12px rgba(228, 88, 33, 0.5);
        }

        /* Input Wrap */
        .lp-input-wrap {
          position: relative;
        }

        .lp-input-icon {
          position: absolute;
          left: 11px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
          pointer-events: none;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        html[data-theme='dark'] .lp-input-icon {
          color: rgba(255, 255, 255, 0.4);
        }

        /* Input */
        .lp-input {
          width: 100%;
          background: var(--card-bg);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 11px 11px 11px 38px;
          font-size: 0.75rem;
          font-family: inherit;
          color: var(--text-dark);
          outline: none;
          transition: all 0.2s;
        }

        html[data-theme='dark'] .lp-input {
          background: #1a1a1a;
          border-color: #2a2a2a;
          color: #ffffff;
        }

        .lp-input::placeholder {
          color: var(--text-muted);
        }

        html[data-theme='dark'] .lp-input::placeholder {
          color: rgba(255, 255, 255, 0.3);
        }

        .lp-input:focus {
          border-color: #E45821;
        }

        .lp-input.error {
          border-color: #ef4444;
        }

        /* City Wrap */
        .lp-city-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }

        .lp-city-icon {
          position: absolute;
          left: 11px;
          font-size: 0.9375rem;
          pointer-events: none;
        }

        .lp-dropdown-icon {
          position: absolute;
          right: 11px;
          font-size: 0.5rem;
          color: var(--text-muted);
          pointer-events: none;
        }

        html[data-theme='dark'] .lp-dropdown-icon {
          color: rgba(255, 255, 255, 0.4);
        }

        /* Select */
        .lp-select {
          width: 100%;
          background: var(--card-bg);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 11px 38px;
          font-size: 0.75rem;
          font-family: inherit;
          color: var(--text-dark);
          appearance: none;
          cursor: not-allowed;
          outline: none;
        }

        html[data-theme='dark'] .lp-select {
          background: #1a1a1a;
          border-color: #2a2a2a;
          color: #ffffff;
        }

        .lp-select:disabled {
          opacity: 0.7;
        }

        /* Conditions */
        .lp-conditions {
          display: flex;
          gap: 6px;
          position: relative;
          z-index: 1;
        }

        .lp-condition-btn {
          flex: 1;
          background: var(--card-bg);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 9px 6px;
          font-size: 0.75rem;
          font-weight: 500;
          color: var(--text-mid);
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s;
          -webkit-tap-highlight-color: transparent;
          user-select: none;
          pointer-events: auto;
          position: relative;
          z-index: 2;
          touch-action: manipulation;
        }

        html[data-theme='dark'] .lp-condition-btn {
          background: #1a1a1a;
          border-color: #2a2a2a;
          color: rgba(255, 255, 255, 0.7);
        }

        .lp-condition-btn:active {
          transform: scale(0.97);
        }

        .lp-condition-btn.active {
          background: #E45821 !important;
          border-color: #E45821 !important;
          color: #ffffff !important;
          font-weight: 600;
          box-shadow: 0 2px 8px rgba(228, 88, 33, 0.3);
        }

        html[data-theme='dark'] .lp-condition-btn.active {
          background: #E45821 !important;
          border-color: #E45821 !important;
          color: #ffffff !important;
          box-shadow: 0 2px 12px rgba(228, 88, 33, 0.5);
        }

        /* Textarea */
        .lp-textarea {
          width: 100%;
          background: var(--card-bg);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 11px;
          font-size: 0.75rem;
          font-family: inherit;
          color: var(--text-dark);
          resize: vertical;
          min-height: 80px;
          outline: none;
          transition: all 0.2s;
        }

        html[data-theme='dark'] .lp-textarea {
          background: #1a1a1a;
          border-color: #2a2a2a;
          color: #ffffff;
        }

        .lp-textarea::placeholder {
          color: var(--text-muted);
        }

        html[data-theme='dark'] .lp-textarea::placeholder {
          color: rgba(255, 255, 255, 0.3);
        }

        .lp-textarea:focus {
          border-color: #E45821;
        }

        .lp-textarea.error {
          border-color: #ef4444;
        }

        /* Field Hint */
        .lp-field-hint {
          font-size: 0.625rem;
          color: var(--text-muted);
          margin-top: 4px;
          line-height: 1.3;
        }

        html[data-theme='dark'] .lp-field-hint {
          color: rgba(255, 255, 255, 0.4);
        }

        /* Char Count */
        .lp-char-count {
          font-size: 0.625rem;
          color: var(--text-muted);
          text-align: right;
          margin-top: 3px;
          display: block;
        }

        html[data-theme='dark'] .lp-char-count {
          color: rgba(255, 255, 255, 0.4);
        }

        /* Error */
        .lp-error {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.625rem;
          color: #ef4444;
          margin-top: 4px;
        }

        /* Submit */
        .lp-submit {
          width: 100%;
          background: #E45821;
          border: none;
          border-radius: 81px;
          padding: 13px;
          font-size: 0.875rem;
          font-weight: 600;
          color: #fff;
          cursor: pointer;
          font-family: inherit;
          margin-top: 14px;
          transition: all 0.2s;
        }

        .lp-submit:hover:not(:disabled) {
          background: #d14d1c;
        }

        .lp-submit:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Desktop Styles */
        @media (min-width: 769px) {
          .lp-container {
            max-width: 600px;
            padding-top: 40px;
          }

          .lp-header {
            background: transparent;
            border-bottom: none;
            padding: 0 0 20px;
          }

          .lp-close {
            position: absolute;
            top: 40px;
            right: 40px;
          }

          .lp-title {
            font-size: 2rem;
          }

          .lp-photo-grid {
            grid-template-columns: repeat(4, 1fr);
          }

          .lp-form {
            padding: 20px;
          }

          .lp-section {
            margin-bottom: 28px;
          }

          .lp-label {
            font-size: 0.875rem;
          }

          .lp-input {
            font-size: 0.875rem;
            padding: 14px 14px 14px 44px;
          }

          .lp-textarea {
            font-size: 0.875rem;
            padding: 14px;
          }

          .lp-category-btn {
            font-size: 0.875rem;
            padding: 10px 18px;
          }

          .lp-condition-btn {
            font-size: 0.875rem;
            padding: 12px;
          }
        }
      `}</style>
    </div>
  );
};

export default ListProductPage;
