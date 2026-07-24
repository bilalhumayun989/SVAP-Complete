import { useState, useRef, useEffect } from "react";
import { FiVolume2, FiVolumeX, FiArrowLeft, FiBookmark } from "react-icons/fi";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../../services/api";

interface Reel {
  id: string;
  userId: string;
  user: {
    name: string;
    avatar: string;
  };
  title: string;
  product: string;
  price: string;
  thumbnail: string;
  video: string;
}

interface ProductRow {
  id: string;
  user_id?: string | null;
  title?: string | null;
  price?: number | string | null;
  image_urls?: string[] | null;
  video_url?: string | null;
  profiles?: {
    name?: string | null;
    full_name?: string | null;
    username?: string | null;
    avatar_url?: string | null;
  } | null;
}

// White SVAP left-right arrows icon for use on orange button background
const SvapBtnIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    {/* Top Arrow */}
    <path d="M3 7h18m0 0l-4-4m4 4l-4 4" />

    {/* Bottom Arrow */}
    <path d="M21 17H3m0 0l4-4M3 17l4 4" />
  </svg>
);

interface ReelCardProps {
  reel: Reel;
  isActive: boolean;
  index: number;
}




const ReelCard = ({ reel, isActive, index }: ReelCardProps) => {
  const navigate = useNavigate();
  const [muted, setMuted] = useState(true);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = useState(false);

  const userId = (() => { try { return JSON.parse(localStorage.getItem("sz_user") || "{}").id; } catch { return null; } })();

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isActive) {
      if (paused) { video.pause(); }
      else { video.play().catch(() => { }); }
    } else {
      video.pause();
    }
  }, [isActive, paused]);

  const togglePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().then(() => setPaused(false)).catch(() => { });
    } else {
      video.pause();
      setPaused(true);
    }
  };

  // Avatar: real image or first letter of name
  const initial = reel.user.name?.[0]?.toUpperCase() || "U";

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!userId) { navigate("/login"); return; }
    if (saving) return;
    setSaving(true);
    try {
      if (saved) {
        await api.unsaveProduct(userId, reel.id);
        setSaved(false);
      } else {
        await api.saveProduct(userId, reel.id);
        setSaved(true);
      }
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`reel-card ${isActive ? "reel-card--active" : ""}`} data-index={index}>
      <div className="reel-bg">
        <video
          ref={videoRef}
          src={reel.video}
          className="reel-thumb"
          muted={muted}
          loop
          playsInline
          poster={reel.thumbnail}
          onClick={togglePlayPause}
        />
        <div className="reel-overlay" />
        <div className="reel-gradient-bottom" />
      </div>

      {isActive && (
        <div className="reel-playing-bar">
          <div
            key={`progress-${paused}`}
            className="reel-progress"
            style={{ animationPlayState: paused ? 'paused' : 'running' }}
          />
        </div>
      )}

      {/* Right actions — only mute */}
      <div className="reel-actions">
       

        <button className="reel-action-btn" onClick={() => setMuted((m) => !m)}>
          {muted ? <FiVolumeX size={22} /> : <FiVolume2 size={22} />}
        </button>

        <button
          className={`reel-action-btn ${saved ? "reel-action-btn--saved" : ""}`}
          onClick={handleSave}
          disabled={saving}
          title={saved ? "Remove from saved" : "Save listing"}
        >
          <FiBookmark size={22} fill={saved ? "#E45821" : "none"} />
          <span>{saved ? "Saved" : "Save"}</span>
        </button>
      </div>

      {paused && (
        <div className="play-overlay">▶</div>
      )}

      {/* Bottom info */}
      <div className="reel-bottom">
        <div
          className="reel-user"
          onClick={() => navigate(`/user/${reel.userId}`)}
          style={{ cursor: 'pointer' }}
        >
          {reel.user.avatar && reel.user.avatar !== 'https://i.pravatar.cc/150?img=1' ? (
            <img src={reel.user.avatar} alt="" className="reel-user-avatar" />
          ) : (
            <div className="reel-user-avatar reel-user-avatar-initial">{initial}</div>
          )}
          <span className="reel-username">@{reel.user.name}</span>
        </div>
        <p className="reel-title">{reel.title}</p>

        <div className="reel-product-strip" onClick={() => navigate(`/product/${reel.id}`)}>
          <div className="reel-product-img-wrap">
            <img src={reel.thumbnail} alt="" className="reel-product-img" />
          </div>
          <div className="reel-product-info">
            <span className="reel-product-name">{reel.product}</span>
            <span className="reel-product-price">{reel.price}</span>
          </div>
          <button className="reel-buy-btn">
            <SvapBtnIcon size={14} />
            Svap
          </button>
        </div>
      </div>
    </div>
  );
};

// Fisher-Yates shuffle
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const ReelsPage = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedReelId = searchParams.get("reel") || null;
  const [activeIndex, setActiveIndex] = useState(0);
  const [reels, setReels] = useState<Reel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey] = useState(0);
  const initialScrollDone = useRef(false);

  // Ref-based lock so wheel handler always reads latest index without re-binding
  const activeIndexRef = useRef(0);
  const scrollLockRef = useRef(false);

  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  useEffect(() => {
    let ignore = false;

    const loadReels = async () => {
      setIsLoading(true);
      initialScrollDone.current = false;

      const response = await api.getProducts();

      if (ignore) return;

      if (response.error) {
        console.error("Failed to load reels:", response.error);
        setReels([]);
      } else {
        setReels(
          shuffleArray(
            ((response.data || []) as ProductRow[])
            .filter((product) => Boolean(product.video_url))
            .sort((a: any, b: any) => {
              const aTime = new Date(a.reel_uploaded_at || a.created_at || 0).getTime();
              const bTime = new Date(b.reel_uploaded_at || b.created_at || 0).getTime();
              return bTime - aTime;
            })
            .map((product) => {
              const displayName =
                product.profiles?.username ||
                product.profiles?.name ||
                product.profiles?.full_name ||
                "svap_user";
              const priceNumber = Number(product.price);
              return {
                id: product.id,
                userId: product.user_id || "",
                user: {
                  name: displayName,
                  avatar: product.profiles?.avatar_url || "",
                },
                title: product.title || "Product reel",
                product: product.title || "Product",
                price:
                  product.price !== null && product.price !== undefined && product.price !== ""
                    ? `Rs ${Number.isFinite(priceNumber) ? priceNumber.toLocaleString() : product.price}`
                    : "Price on request",
                thumbnail: product.image_urls?.[0] || "https://placehold.co/600x800?text=SVAP",
                video: product.video_url || "",
              };
            })
          ) // close shuffleArray
        );
      }

      setIsLoading(false);
    };

    loadReels();

    return () => {
      ignore = true;
    };
  }, [refreshKey]);

  useEffect(() => {
    if (!selectedReelId || reels.length === 0) return;
    if (initialScrollDone.current) return;

    const foundIndex = reels.findIndex((reel) => reel.id === selectedReelId);
    if (foundIndex < 0) return;

    initialScrollDone.current = true;
    setActiveIndex(foundIndex);
    activeIndexRef.current = foundIndex;

    // Use requestAnimationFrame to ensure DOM cards are rendered before scrolling
    requestAnimationFrame(() => {
      const cards = containerRef.current?.querySelectorAll(".reel-card");
      const target = cards?.[foundIndex] as HTMLElement | undefined;
      if (target && containerRef.current) {
        // Instant scroll — no animation, so user lands directly on clicked reel
        containerRef.current.scrollTop = target.offsetTop;
      }
    });
  }, [selectedReelId, reels]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number((entry.target as HTMLElement).dataset.index);
            setActiveIndex(idx);
          }
        });
      },
      { threshold: 0.6, root: el }
    );

    el.querySelectorAll(".reel-card").forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, [reels.length]);

  // One-reel-per-scroll (Instagram style): intercept wheel/trackpad scroll,
  // move exactly one card per gesture, lock further input until the
  // transition finishes AND the physical gesture has gone quiet.
  //
  // Trackpads keep firing wheel events for a while after a swipe due to
  // momentum/inertia — much longer than the scroll animation itself. If we
  // only lock for the animation's duration, the tail end of that same
  // physical swipe sneaks in as a *second* navigation. So the lock here is
  // released only once BOTH the animation has finished AND no new wheel
  // event has arrived for a short quiet period (meaning momentum settled).
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const QUIET_PERIOD = 220; // ms of silence required after last wheel event
    let rafId: number | null = null;
    let quietTimer: number | null = null;
    let animating = false;



    // Called on every wheel event while locked (including momentum tail).
    // Keeps pushing the unlock further away until events actually stop.
    const scheduleUnlock = () => {
      if (quietTimer !== null) window.clearTimeout(quietTimer);
      quietTimer = window.setTimeout(() => {
        if (!animating) {
          scrollLockRef.current = false;
        }
      }, QUIET_PERIOD);
    };

    const goTo = (newIndex: number) => {
      const cards = el.querySelectorAll(".reel-card");
      if (!cards.length) return;
      const clamped = Math.min(Math.max(newIndex, 0), cards.length - 1);
      const target = cards[clamped] as HTMLElement | undefined;
      if (!target) return;

      scrollLockRef.current = true;
      setActiveIndex(clamped);

      target.scrollIntoView({ behavior: "smooth", block: "start" });

      window.setTimeout(() => {
        scrollLockRef.current = false;
      }, 600);
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      if (scrollLockRef.current) {
        // Same physical gesture (likely momentum tail) — ignore the
        // navigation but keep pushing the unlock time forward.
        scheduleUnlock();
        return;
      }

      if (Math.abs(e.deltaY) < 2) return;

      const direction = e.deltaY > 0 ? 1 : -1;
      goTo(activeIndexRef.current + direction);
    };

    // Trackpad/mouse wheel
    el.addEventListener("wheel", handleWheel, { passive: false });

    // Keyboard arrows (nice to have, same one-at-a-time behavior)
    const handleKey = (e: KeyboardEvent) => {
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
      e.preventDefault();
      if (scrollLockRef.current) return;
      goTo(activeIndexRef.current + (e.key === "ArrowDown" ? 1 : -1));
    };
    window.addEventListener("keydown", handleKey);

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      if (quietTimer !== null) window.clearTimeout(quietTimer);
      el.removeEventListener("wheel", handleWheel);
      window.removeEventListener("keydown", handleKey);
    };
  }, [reels.length]);

  return (
    <div className="reels-page" ref={containerRef}>
      <button
        className="reels-back-btn"
        onClick={() => navigate(-1)}
        title="Go back"
      >
        <FiArrowLeft size={24} />
      </button>

      {/* Refresh / shuffle button */}
   
      {isLoading && <div className="reels-state">Loading reels...</div>}
      {!isLoading && reels.length === 0 && <div className="reels-state">No reels yet.</div>}
      {reels.map((reel, i) => (
        <ReelCard
          key={reel.id}
          reel={reel}
          isActive={i === activeIndex}
          index={i}
        />
      ))}

      <style>{`
       .reels-page {
  height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
  scroll-snap-type: y mandatory;
  scrollbar-width: none;
  background: var(--bg);
}
.reels-page::-webkit-scrollbar { display: none; }


        .reels-back-btn {
          position: fixed;
          top: 20px;
          left: 20px;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.5);
          border: none;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 100;
          transition: background 0.2s;
          backdrop-filter: blur(8px);
        }
        .reels-back-btn:hover { background: rgba(0, 0, 0, 0.7); }

        .reels-refresh-btn {
          position: fixed;
          top: 20px;
          right: 20px;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.5);
          border: none;
          font-size: 1.1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 100;
          transition: background 0.2s, transform 0.3s;
          backdrop-filter: blur(8px);
        }
        .reels-refresh-btn:hover {
          background: rgba(0, 0, 0, 0.7);
          transform: rotate(180deg);
        }

        .reels-state {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-dark);
          font-family: 'Poppins', sans-serif;
          font-weight: 700;
        }

        .reel-card {
          position: relative;
          width: 100%;
          height: 100vh;
          scroll-snap-align: start;
          scroll-snap-stop: always;
          overflow: hidden;
          display: flex;
          align-items: flex-end;
        }

        .reel-bg {
          position: absolute;
          inset: 0;
        }

        .reel-thumb {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

       .reel-overlay,
.reel-gradient-bottom {
  pointer-events: none;
}
        .reel-gradient-bottom {
          position: absolute;
          inset-inline: 0;
          bottom: 0;
          height: 65%;
          background: linear-gradient(to top, rgba(0,0,0,0.92) 0%, transparent 100%);
        }

        /* Progress bar */
        .reel-playing-bar {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: rgba(255,255,255,0.25);
          z-index: 10;
        }

        .reel-progress {
          height: 100%;
          background: var(--text-on-orange);
          width: 0%;
          animation: reelProgress 15s linear;
          animation-play-state: running;
        }

        .reel-card:has(.reel-progress[data-paused="true"]) .reel-progress {
          animation-play-state: paused;
        }

.play-overlay{
  position:absolute;
  inset:0;
  display:flex;
  align-items:center;
  justify-content:center;
  font-size:70px;
  color:#fff;
  background:rgba(0,0,0,.2);
  pointer-events:none;
  z-index: 20;
}
        @keyframes reelProgress {
          from { width: 0%; }
          to { width: 100%; }
        }

        /* Right actions */
        .reel-actions {
          position: absolute;
          right: 14px;
          bottom: 90px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          z-index: 10;
        }

       
        .reel-user-avatar-initial {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #E45821;
          border: 1.5px solid rgba(255,255,255,0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 700;
          color: #fff;
          font-family: 'Poppins', sans-serif;
        }

        .reel-follow-btn {
          position: absolute;
          bottom: -10px;
          left: 50%;
          transform: translateX(-50%);
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #E45821;
          color: #fff;
          font-size: 1rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          line-height: 1;
        }

        .reel-action-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          background: none;
          border: none;
          color: #fff;
          cursor: pointer;
          font-size: 0.68rem;
          font-family: 'Poppins', sans-serif;
          font-weight: 600;
          text-shadow: 0 1px 4px rgba(0,0,0,0.5);
          transition: transform 0.18s;
          padding: 0;
        }
        .reel-action-btn:hover { transform: scale(1.12); }
        .reel-action-btn--liked { color: #E45821; }
        .reel-action-btn--saved { color: #E45821; }

        /* Bottom info */
        .reel-bottom {
          position: relative;
          z-index: 10;
          padding: 0 14px 24px;
          width: calc(100% - 80px);
        }

        .reel-user {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }

        .reel-user-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          object-fit: cover;
          border: 1.5px solid rgba(255,255,255,0.7);
        }

        .reel-username {
          color: #fff;
          font-size: 0.88rem;
          font-weight: 700;
          text-shadow: 0 1px 4px rgba(0,0,0,0.6);
        }

        .reel-title {
          color: rgba(255,255,255,0.9);
          font-size: 0.85rem;
          line-height: 1.4;
          margin: 0 0 12px;
          text-shadow: 0 1px 4px rgba(0,0,0,0.5);
        }

        /* Product strip */
        .reel-product-strip {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(255,255,255,0.14);
          backdrop-filter: blur(14px);
          border: 1px solid rgba(255,255,255,0.18);
          border-radius: 12px;
          padding: 8px 10px;
          cursor: pointer;
          transition: background 0.2s;
        }
        .reel-product-strip:hover { background: rgba(255,255,255,0.22); }

        .reel-product-img-wrap {
          width: 42px;
          height: 42px;
          border-radius: 8px;
          overflow: hidden;
          flex-shrink: 0;
        }

        .reel-product-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .reel-product-info {
          flex: 1;
          min-width: 0;
        }

        .reel-product-name {
          display: block;
          color: #fff;
          font-size: 0.78rem;
          font-weight: 700;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .reel-product-price {
          color: #8DC63F;
          font-size: 0.72rem;
          font-weight: 600;
        }

        .reel-buy-btn {
          display: flex;
          align-items: center;
          gap: 5px;
          background: #E45821;
          border: none;
          border-radius: 8px;
          color: var(--text-on-orange);
          font-size: 0.78rem;
          font-weight: 700;
          padding: 7px 14px;
          cursor: pointer;
          font-family: 'Poppins', sans-serif;
          transition: background 0.18s;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .reel-buy-btn:hover { background: #c94d1c; }

       .reels-page {
  height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
  scroll-snap-type: y mandatory;
  scrollbar-width: none;
  background: var(--bg);
}

.reels-page::-webkit-scrollbar {
  display: none;
}

.reel-card{
  position: relative;
  width: 100%;
  max-width: 350px;
  height: calc(100vh - 24px);
  margin: 12px auto;
  border-radius: 24px;
  overflow: hidden;
  scroll-snap-align: center;
  scroll-snap-stop: always;
  background: #000;
}

@media (max-width: 800px) {
  .reel-card {
    max-width: 100%;
    width: 100%;
    height: 100vh;
    margin: 0;
    border-radius: 0;
  }
}
      `}</style>
    </div>
  );
};

export default ReelsPage;
