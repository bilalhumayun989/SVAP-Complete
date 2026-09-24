import { useNavigate } from "react-router-dom";
import { FiBookmark } from "react-icons/fi";
import { useState, useEffect } from "react";
import { api } from "../../services/api";
import type { Product } from "./data/product";

const SvapBtnIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#fff"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 7h18m0 0l-4-4m4 4l-4 4" />
    <path d="M21 17H3m0 0l4-4M3 17l4 4" />
  </svg>
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
        background: "var(--card-bg, #1a1a1a)",
        border: "1.5px solid var(--border, #2a2a2a)",
        borderRadius: 16,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        boxShadow: "0 4px 18px rgba(0,0,0,0.2)",
        transition: "transform 0.2s, box-shadow 0.2s",
      }}
      className="product-card"
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
        (e.currentTarget as HTMLDivElement).style.boxShadow =
          "0 8px 28px rgba(0,0,0,0.3)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "";
        (e.currentTarget as HTMLDivElement).style.boxShadow =
          "0 4px 18px rgba(0,0,0,0.2)";
      }}
    >
      {/* USER HEADER (Top views badge removed) */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "12px 14px",
          cursor: "pointer",
        }}
        onClick={go}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            minWidth: 0,
          }}
        >
          <img
            src={product.user.avatar}
            alt={product.user.name}
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              objectFit: "cover",
              border: "1.5px solid var(--border)",
              flexShrink: 0,
            }}
          />
          <p
            style={{
              margin: 0,
              color: "#fff",
              fontWeight: 600,
              fontSize: "0.85rem",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            @{product.user.name}
          </p>
        </div>
      </div>

      {/* IMAGE CONTAINER */}
      <div
        style={{ cursor: "pointer", position: "relative" }}
        onClick={go}
      >
        <div
          className="pc-image-container"
          style={{
            overflow: "hidden",
            aspectRatio: "4/3",
            position: "relative",
          }}
        >
          {/* CONDITION BADGE */}
          {product.condition && (
            <div
              style={{
                position: "absolute",
                top: 10,
                left: 10,
                zIndex: 3,
                background: "#d9532f",
                color: "#ffffff",
                fontSize: "0.68rem",
                fontWeight: 700,
                padding: "3px 10px",
                borderRadius: "20px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
                textTransform: "lowercase",
              }}
            >
              {product.condition}
            </div>
          )}

          <img
            src={product.image}
            alt={product.title}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transition: "transform 0.4s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.transform = "scale(1.05)")
            }
            onMouseLeave={(e) => (e.currentTarget.style.transform = "")}
          />
        </div>
      </div>

      {/* BOTTOM CONTENT AREA (With dark background) */}
      <div
        style={{
          background: "var(--card-bg, #1a1a1a)",
          padding: "12px 14px 14px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <div style={{ cursor: "pointer" }} onClick={go}>
          <h3
            style={{
              margin: "0 0 6px",
              color: "#fff",
              fontSize: "0.95rem",
              fontWeight: 700,
              lineHeight: 1.3,
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 1,
              WebkitBoxOrient: "vertical",
            }}
          >
            {product.title}
          </h3>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              color: "#a0a0a0",
              fontSize: "0.75rem",
              flexWrap: "wrap",
            }}
          >
            {product.location && (
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <img
                  src="/ICONS/Location.png"
                  alt="Loc"
                  style={{
                    width: 12,
                    height: 12,
                    objectFit: "contain",
                    filter: "brightness(0) invert(0.7)",
                  }}
                />
                <span>{product.location}</span>
              </div>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ color: "#22c55e" }}>⚡</span>
              <span>Value: up to you</span>
            </div>
          </div>
        </div>

        {/* ACTIONS BUTTONS */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginTop: 4,
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              go();
            }}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              flex: 1,
              padding: "10px 14px",
              background: "#b84525",
              border: "none",
              borderRadius: "24px",
              color: "#fff",
              fontSize: "0.85rem",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.opacity = "0.95";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "";
              e.currentTarget.style.opacity = "1";
            }}
          >
            <SvapBtnIcon /> SVAP
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            title={saved ? "Remove from saved" : "Save listing"}
            style={{
              width: 40,
              height: 40,
              borderRadius: "12px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: saving ? "wait" : "pointer",
              color: saved ? "#b84525" : "#fff",
              transition: "all 0.2s ease",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.05)";
            }}
          >
            <FiBookmark size={18} fill={saved ? "#b84525" : "none"} />
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