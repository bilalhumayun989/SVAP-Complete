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
        background: "var(--card-bg)",
        border: "1.5px solid var(--border)",
        borderRadius: 16,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        boxShadow: "0 4px 18px rgba(96,121,255,0.08)",
        transition: "transform 0.2s, box-shadow 0.2s",
      }}
      className="product-card"
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform =
          "translateY(-2px)";
        (e.currentTarget as HTMLDivElement).style.boxShadow =
          "0 8px 28px rgba(96,121,255,0.15)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "";
        (e.currentTarget as HTMLDivElement).style.boxShadow =
          "0 4px 18px rgba(96,121,255,0.08)";
      }}
    >
      {/* USER HEADER */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 14px 10px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            cursor: "pointer",
            minWidth: 0,
          }}
          onClick={go}
        >
          <img
            src={product.user.avatar}
            alt={product.user.name}
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              objectFit: "cover",
              border: "1.5px solid var(--border)",
              flexShrink: 0,
            }}
          />
          <div style={{ minWidth: 0 }}>
            <p
              style={{
                margin: 0,
                color: "var(--text-dark)",
                fontWeight: 600,
                fontSize: "0.83rem",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              @{product.user.name}
            </p>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            padding: "0 10px",
            height: 32,
            borderRadius: 999,
            background: "#E45821",
            border: "1.5px solid var(--border)",
            color: "#fff",
            fontSize: "0.72rem",
          }}
        >
          <FiBookmark size={12} fill="#fff" />
          {product.views}
        </div>
      </div>

      {/* IMAGE CONTAINER WITH CONDITION BADGE */}
      <div
        style={{ cursor: "pointer", position: "relative" }}
        onClick={go}
      >
        <div
          style={{
            overflow: "hidden",
            aspectRatio: "16/12",
            position: "relative",
            borderTop: "1px solid var(--border)",
            borderBottom: "1px solid var(--border)",
          }}
        >
          {/* CONDITION BADGE OVERLAY */}
          {product.condition && (
            <div
              style={{
                position: "absolute",
                top: 10,
                left: 10,
                zIndex: 3,
                background: "#E45821",
                color: "#ffffff",
                fontSize: "0.68rem",
                fontWeight: 700,
                padding: "3px 10px",
                borderRadius: "20px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
                textTransform: "uppercase",
                letterSpacing: "0.4px",
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

          {/* BOTTOM GRADIENT OVERLAY */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to bottom, rgba(0,0,0,0) 50%, rgba(0,0,0,0.85) 100%)",
              pointerEvents: "none",
            }}
          />

          {/* BOTTOM OVERLAY: TITLE & LOCATION */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              padding: "12px 14px",
              zIndex: 2,
            }}
          >
            <h3
              style={{
                margin: "0 0 4px",
                color: "#fff",
                fontSize: "1.1rem",
                fontWeight: 700,
                lineHeight: 1.35,
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
                gap: 4,
                color: "rgba(255,255,255,0.9)",
                fontSize: "0.52rem",
                textShadow: "0 1px 3px rgba(0,0,0,0.9)",
              }}
            >
              <img
                src="/ICONS/Location.png"
                alt="Loc"
                style={{
                  width: 10,
                  height: 10,
                  objectFit: "contain",
                  filter: "brightness(0) invert(1)",
                }}
              />
              {product.location}
            </div>
          </div>
        </div>
      </div>

      {/* ACTIONS */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "12px",
          borderTop: "1.5px solid var(--border)",
        }}
      >
        <button
          onClick={handleSave}
          disabled={saving}
          title={saved ? "Remove from saved" : "Save listing"}
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: saved ? "#E45821" : "transparent",
            border: saved
              ? "1.5px solid #E45821"
              : "1.5px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: saving ? "wait" : "pointer",
            color: saved ? "#fff" : "var(--text-muted)",
            transition: "all 0.2s ease",
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            if (!saved) {
              e.currentTarget.style.background = "rgba(228,88,33,0.1)";
              e.currentTarget.style.borderColor = "#E45821";
              e.currentTarget.style.color = "#E45821";
            }
            e.currentTarget.style.transform = "translateY(-2px) scale(1.08)";
          }}
          onMouseLeave={(e) => {
            if (!saved) {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.borderColor = "var(--border)";
              e.currentTarget.style.color = "var(--text-muted)";
            }
            e.currentTarget.style.transform = "";
          }}
        >
          <FiBookmark size={18} fill={saved ? "#fff" : "none"} />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            go();
          }}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            flex: 1,
            padding: "11px 12px",
            background: "var(--btn-swap)",
            border: "none",
            borderRadius: "20px",
            color: "#fff",
            fontSize: "0.85rem",
            fontWeight: 700,
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow =
              "0 6px 16px rgba(228,88,33,0.5)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "";
            e.currentTarget.style.boxShadow =
              "0 2px 8px rgba(228,88,33,0.3)";
          }}
        >
          <SvapBtnIcon /> SVAP
        </button>
      </div>
    </div>
  );
};

export default ProductCard;