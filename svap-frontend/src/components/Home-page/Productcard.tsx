import { useNavigate } from "react-router-dom";
import { FiBookmark } from "react-icons/fi";
import { useState, useEffect } from "react";
import { api } from "../../services/api";
import type { Product } from "./data/product";

// Local Request Image Icon for SVAP Button
const SvapBtnIcon = () => (
  <img
    src="/request.png"
    alt="Svap"
    className="w-4 h-4 object-contain brightness-0 invert"
  />
);

interface ProductCardProps {
  product: Product;
  initialSaved?: boolean;
}

const ProductCard = ({ product, initialSaved = false }: ProductCardProps) => {
  const navigate = useNavigate();
  const [saved, setSaved] = useState(initialSaved);
  const [saving, setSaving] = useState(false);

  const userId = (() => {
    try {
      return JSON.parse(localStorage.getItem("sz_user") || "{}").id;
    } catch {
      return null;
    }
  })();

  useEffect(() => {
    setSaved(initialSaved);
  }, [initialSaved]);

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!userId) {
      navigate("/login");
      return;
    }
    if (saving) return;
    setSaving(true);
    try {
      if (saved) {
        await api.unsaveProduct(userId, product.id);
        setSaved(false);
      } else {
        await api.saveProduct(userId, product.id);
        setSaved(true);
      }
    } catch (err) {
      console.error("Save toggle failed:", err);
    } finally {
      setSaving(false);
    }
  };

  const go = () => navigate(`/product/${product.id}`);

  return (
    <div
      style={{
        background: "var(--card-bg)",
        borderColor: "var(--border-light)",
      }}
      className="product-card flex flex-col overflow-hidden rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 shadow-md hover:shadow-xl"
    >
      {/* USER HEADER */}
      <div
        className="flex items-center px-3.5 py-3 cursor-pointer"
        onClick={go}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <img
            src={product.user.avatar}
            alt={product.user.name}
            style={{ borderColor: "var(--border-light)" }}
            className="w-8 h-8 rounded-full object-cover border flex-shrink-0"
          />
          <p
            style={{ color: "var(--text-dark)" }}
            className="m-0 font-semibold text-xs sm:text-sm truncate"
          >
            @{product.user.name}
          </p>
        </div>
      </div>

      {/* IMAGE CONTAINER */}
      <div
        className="cursor-pointer relative"
        onClick={go}
      >
        <div className="pc-image-container overflow-hidden aspect-[4/3] relative">
          {/* CONDITION BADGE */}
          {product.condition && (
            <div
              style={{ background: "var(--btn-swap)", color: "var(--text-on-orange)" }}
              className="absolute top-2.5 left-2.5 z-10 text-[0.68rem] font-bold px-2.5 py-0.5 rounded-full shadow-md lowercase"
            >
              {product.condition}
            </div>
          )}

          <img
            src={product.image}
            alt={product.title}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          />
        </div>
      </div>

      {/* BOTTOM CONTENT AREA */}
      <div
        style={{ background: "var(--card-bg)" }}
        className="p-3.5 pt-3 flex flex-col gap-2.5"
      >
        <div className="cursor-pointer" onClick={go}>
          <h3
            style={{ color: "var(--text-dark)" }}
            className="m-0 mb-1.5 font-bold text-sm line-clamp-1 leading-snug"
          >
            {product.title}
          </h3>

          <div
            style={{ color: "var(--text-muted)" }}
            className="flex items-center gap-3 text-xs flex-wrap font-medium"
          >
            {product.location && (
              <div className="flex items-center gap-1">
                <img
                  src="/ICONS/Location.png"
                  alt="Loc"
                  className="w-3 h-3 object-contain pc-loc-icon"
                />
                <span>{product.location}</span>
              </div>
            )}

            {/* <div className="flex items-center gap-1">
              <span className="text-emerald-500">⚡</span>
              <span>Value: up to you</span>
            </div> */}
          </div>
        </div>

        {/* ACTIONS BUTTONS */}
        <div className="flex items-center gap-2.5 mt-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              go();
            }}
            style={{
              background: "var(--btn-swap)",
              color: "var(--text-on-orange)",
            }}
            className="flex items-center justify-center gap-2 flex-1 py-2.5 px-3.5 rounded-full text-xs font-bold transition-transform active:scale-95 hover:opacity-95 cursor-pointer border-0"
          >
            <SvapBtnIcon /> SVAP
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            title={saved ? "Remove from saved" : "Save listing"}
            style={{
              borderColor: "var(--border-light)",
              color: saved ? "var(--btn-swap)" : "var(--text-dark)",
            }}
            className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all flex-shrink-0 ${
              saving ? "cursor-wait" : "cursor-pointer"
            }`}
          >
            <FiBookmark
              size={18}
              fill={saved ? "var(--btn-swap)" : "none"}
            />
          </button>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .pc-image-container {
            aspect-ratio: 1/1 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ProductCard;