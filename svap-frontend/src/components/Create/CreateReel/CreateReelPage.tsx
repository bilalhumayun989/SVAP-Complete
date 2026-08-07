import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiUpload, FiX } from "react-icons/fi";
import { supabase } from "../../../services/supabase";
import { api } from "../../../services/api";

interface ProductOption {
  id: string;
  title: string;
  price?: number | string | null;
  image_urls?: string[] | null;
  video_url?: string | null;
}

const getLocalUserId = () => {
  try {
    const rawUser = localStorage.getItem("sz_user");
    const user = rawUser ? JSON.parse(rawUser) : null;
    return typeof user?.id === "string" ? user.id : "";
  } catch {
    return "";
  }
};

const CreateReelPage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);

  const [products, setProducts] = useState<ProductOption[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [video, setVideo] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === selectedProductId),
    [products, selectedProductId]
  );

  useEffect(() => {
    let ignore = false;

    const loadProducts = async () => {
      setIsLoadingProducts(true);
      setErrorMessage("");

      const localUserId = getLocalUserId();
      const { data: userData } = await supabase.auth.getUser();
      const authUserId = userData?.user?.id || "";
      const userIds = Array.from(new Set([authUserId, localUserId].filter(Boolean)));

      if (userIds.length === 0) {
        if (!ignore) {
          setErrorMessage("Please login before uploading a reel.");
          setProducts([]);
          setIsLoadingProducts(false);
        }
        return;
      }

      const productsById = new Map<string, ProductOption>();

      for (const userId of userIds) {
        try {
          const response = await api.getProductsByUser(userId);
          const userProducts = response?.data || [];
          userProducts.forEach((product: ProductOption) => {
            if (product?.id) productsById.set(product.id, product);
          });
        } catch (apiError) {
          console.error("Backend products fetch failed:", apiError);
        }
      }

      if (productsById.size > 0) {
        if (!ignore) {
          setProducts(Array.from(productsById.values()));
          setIsLoadingProducts(false);
        }
        return;
      }

      let query = supabase.from("products").select("id,title,price,image_urls,video_url");
      query = userIds.length === 1 ? query.eq("user_id", userIds[0]) : query.in("user_id", userIds);
      const { data, error } = await query.order("created_at", { ascending: false });

      if (ignore) return;

      if (error) {
        setErrorMessage(error.message || "Could not load your products.");
        setProducts([]);
      } else {
        setProducts(data || []);
      }

      setIsLoadingProducts(false);
    };

    loadProducts();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      alert("Please select a video file");
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      alert("Video must be less than 100MB");
      return;
    }

    if (preview) URL.revokeObjectURL(preview);
    setVideo(file);
    setPreview(URL.createObjectURL(file));
    setMessage("");
    setErrorMessage("");
  };

  const handleRemoveVideo = () => {
    if (preview) URL.revokeObjectURL(preview);
    setVideo(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProduct) {
      alert("Please select a product");
      return;
    }

    if (!video) {
      alert("Please select a video");
      return;
    }

    if (selectedProduct.video_url) {
      const confirmed = window.confirm(
        "Is product ki purani reel replace ho jayegi, continue karein?"
      );
      if (!confirmed) return;
    }

    setIsUploading(true);
    setMessage("");
    setErrorMessage("");

    try {
      const formData = new FormData();
      formData.append("video", video);
      formData.append("productId", selectedProduct.id);

      const uploadResponse = await api.uploadVideo(formData);
      if (uploadResponse.error || !uploadResponse.url) {
        throw new Error(uploadResponse.error || "Video upload failed.");
      }

      const publicUrl = uploadResponse.url;
      const uploadedAt = new Date().toISOString();

      const response = await api.updateProduct(selectedProduct.id, {
        video_url: publicUrl,
        reel_uploaded_at: uploadedAt,
      });

      if (response.error) throw new Error(response.error);

      setMessage("✅ Reel successfully upload ho gayi!");
      setTimeout(() => {
        setMessage("");
        navigate("/reels");
      }, 2500);
      setSelectedProductId("");
      handleRemoveVideo();
      setProducts((current) =>
        current.map((product) =>
          product.id === selectedProduct.id
            ? { ...product, video_url: publicUrl }
            : product
        )
      );
    } catch (error) {
      console.error("Upload error:", error);
      setErrorMessage(error instanceof Error ? error.message : "Failed to upload reel");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="crp-root">
      <div className="crp-header">
        <button className="crp-back-btn" onClick={() => navigate("/create")}>
          <FiArrowLeft size={20} />
        </button>
        <h1 className="crp-title">Upload a Reel</h1>
        <div style={{ width: 44 }} />
      </div>

      <div className="crp-container">
        <form onSubmit={handleSubmit} className="crp-form">
          <div className="crp-section">
            <label htmlFor="productId" className="crp-label">
              Product *
            </label>
            <select
              id="productId"
              value={selectedProductId}
              onChange={(e) => {
                setSelectedProductId(e.target.value);
                setMessage("");
                setErrorMessage("");
              }}
              className="crp-select"
              disabled={isUploading || isLoadingProducts}
            >
              <option value="">
                {isLoadingProducts ? "Loading your products..." : "Select a product"}
              </option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.title}
                </option>
              ))}
            </select>
            {!isLoadingProducts && products.length === 0 && !errorMessage && (
              <p className="crp-helper crp-helper-left">No active products found for your account.</p>
            )}
          </div>

          <div className="crp-section">
            <label className="crp-section-title">Select Video</label>

            {!preview ? (
              <div
                className="crp-upload-area"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.add("dragging");
                }}
                onDragLeave={(e) => {
                  e.currentTarget.classList.remove("dragging");
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove("dragging");
                  const files = e.dataTransfer.files;
                  if (files?.[0]) {
                    const event = {
                      target: { files },
                    } as React.ChangeEvent<HTMLInputElement>;
                    handleVideoSelect(event);
                  }
                }}
              >
                <div className="crp-upload-icon">
                  <FiUpload size={40} />
                </div>
                <p className="crp-upload-title">Drag video here or click to browse</p>
                <p className="crp-upload-sub">MP4, WebM, or MOV - Max 100MB</p>
              </div>
            ) : (
              <div className="crp-preview-wrap">
                <video
                  ref={videoPreviewRef}
                  className="crp-video-preview"
                  src={preview}
                  controls
                />
                <button
                  type="button"
                  className="crp-remove-video"
                  onClick={handleRemoveVideo}
                  disabled={isUploading}
                >
                  <FiX size={18} />
                </button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleVideoSelect}
              className="crp-file-input"
              disabled={isUploading}
            />
          </div>

          {message && (
            <div className="crp-toast">
              <span className="crp-toast-icon">✅</span>
              <div>
                <p className="crp-toast-title">Reel Upload Successfully.</p>
                <p className="crp-toast-sub">Reels rediect on the page...</p>
              </div>
            </div>
          )}
          {errorMessage && <p className="crp-status crp-status-error">{errorMessage}</p>}

          <div className="crp-button-group">
            <button
              type="button"
              className="crp-btn crp-btn-cancel"
              onClick={() => navigate("/create")}
              disabled={isUploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="crp-btn crp-btn-upload"
              disabled={isUploading || !video || !selectedProductId}
            >
              {isUploading ? "Uploading..." : "Upload Reel"}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .crp-root {
          min-height: 100vh;
          background: var(--bg);
          padding-top: 60px;
          font-family: 'Poppins', sans-serif;
          color: var(--text-dark);
          transition: background-color 0.3s ease, color 0.3s ease;
        }

        .crp-header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 60px;
          background: var(--navbar-bg);
          border-bottom: 1px solid var(--border-light);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 20px;
          z-index: 100;
          box-sizing: border-box;
          transition: background-color 0.3s ease;
        }

        .crp-back-btn {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: 1px solid var(--border-light);
          background: var(--bg-alt);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          color: var(--text-dark);
        }
        .crp-back-btn:hover {
          background: var(--bg-section);
          border-color: var(--border);
        }

        .crp-title {
          font-size: 1.2rem;
          font-weight: 700;
          color: var(--text-dark);
          margin: 0;
        }

        .crp-container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          box-sizing: border-box;
        }

        .crp-form {
          display: flex;
          flex-direction: column;
          gap: 28px;
        }

        .crp-section {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .crp-section-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--text-dark);
        }

        .crp-upload-area {
          border: 2px dashed var(--border-light);
          border-radius: 16px;
          padding: 40px 20px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
          background: var(--bg-alt);
        }
        .crp-upload-area:hover {
          border-color: var(--border);
          background: var(--bg-section);
        }
        .crp-upload-area.dragging {
          border-color: #E45821;
          background: rgba(228, 88, 33, 0.05);
        }

        .crp-upload-icon {
          color: #E45821;
          margin-bottom: 12px;
          display: flex;
          justify-content: center;
        }

        .crp-upload-title {
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--text-dark);
          margin: 0 0 6px;
        }

        .crp-upload-sub {
          font-size: 0.8rem;
          color: var(--text-muted);
          margin: 0;
        }

        .crp-preview-wrap {
          position: relative;
          border-radius: 16px;
          overflow: hidden;
          background: #000;
        }

        .crp-video-preview {
          width: 100%;
          height: auto;
          max-height: 400px;
          display: block;
        }

        .crp-remove-video {
          position: absolute;
          top: 10px;
          right: 10px;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.6);
          border: none;
          color: #fff;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          backdrop-filter: blur(8px);
        }
        .crp-remove-video:hover:not(:disabled) {
          background: rgba(0, 0, 0, 0.8);
        }
        .crp-remove-video:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .crp-label {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-dark);
        }

        .crp-select {
          width: 100%;
          padding: 12px 14px;
          border: 1px solid var(--border-light);
          border-radius: 10px;
          font-family: inherit;
          font-size: 0.9rem;
          color: var(--text-dark);
          background: var(--bg-alt);
          transition: all 0.2s;
          box-sizing: border-box;
        }
        .crp-select:focus {
          outline: none;
          border-color: #E45821;
          background: var(--card-bg);
          box-shadow: 0 0 0 3px rgba(228, 88, 33, 0.1);
        }
        .crp-select:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          background: var(--bg-section);
        }

        .crp-helper {
          font-size: 0.75rem;
          color: var(--text-muted);
          margin: 0;
          text-align: right;
        }
        .crp-helper-left {
          text-align: left;
        }

        .crp-file-input {
          display: none;
        }

        .crp-status {
          border-radius: 10px;
          margin: 0;
          padding: 12px 14px;
          font-size: 0.86rem;
          font-weight: 600;
        }
        .crp-status-success {
          background: rgba(141, 198, 63, 0.12);
          color: #4f811c;
          border: 1px solid rgba(141, 198, 63, 0.25);
        }
        .crp-status-error {
          background: rgba(228, 88, 33, 0.1);
          color: #c94d1c;
          border: 1px solid rgba(228, 88, 33, 0.22);
        }

        /* ── Toast ── */
        .crp-toast {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px 20px;
          background: #1a2e0a;
          border: 1px solid rgba(141,198,63,0.3);
          border-radius: 14px;
          animation: crp-toast-in 0.3s ease-out;
        }
        @keyframes crp-toast-in {
          from { opacity: 0; transform: translateY(8px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .crp-toast-icon {
          font-size: 1.6rem;
          flex-shrink: 0;
        }
        .crp-toast-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: #aee85a;
          margin: 0 0 2px;
        }
        .crp-toast-sub {
          font-size: 0.78rem;
          color: rgba(174,232,90,0.65);
          margin: 0;
        }

        .crp-button-group {
          display: flex;
          gap: 12px;
          margin-top: 12px;
        }

        .crp-btn {
          flex: 1;
          padding: 12px 20px;
          border-radius: 10px;
          border: none;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          font-family: inherit;
        }

        .crp-btn-cancel {
          background: var(--bg-alt);
          color: var(--text-dark);
          border: 1px solid var(--border-light);
        }
        .crp-btn-cancel:hover:not(:disabled) {
          background: var(--bg-section);
          border-color: var(--border);
        }
        .crp-btn-cancel:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .crp-btn-upload {
          background: #E45821;
          color: var(--text-on-orange);
        }
        .crp-btn-upload:hover:not(:disabled) {
          background: #d94817;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(228, 88, 33, 0.3);
        }
        .crp-btn-upload:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        @media (max-width: 600px) {
          .crp-container {
            padding: 16px;
          }
          .crp-form {
            gap: 20px;
          }
          .crp-upload-area {
            padding: 30px 16px;
          }
          .crp-header {
            padding: 0 16px;
          }
        }
      `}</style>
    </div>
  );
};

export default CreateReelPage;
