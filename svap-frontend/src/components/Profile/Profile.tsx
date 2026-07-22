import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiGrid, FiBookmark, FiRepeat, FiTag,
   FiCamera, FiEdit2, FiTrash2, FiHeart,
  FiPackage,
} from "react-icons/fi";
import { HiCheckBadge } from "react-icons/hi2";
import StoryViewer from "./StoryViewer";
import { api } from "../../services/api";

const MOCK_SAVED = [
  { id: 7, image: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400&q=80", name: "Samsung S24 Ultra", price: "Rs 240,000" },
  { id: 8, image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&q=80", name: "Designer Handbag", price: "Rs 45,000" },
  { id: 9, image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80", name: "Electric Scooter", price: "Rs 45,000" },
];

const MOCK_SWAPS = [
  { id: 10, image: "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=400&q=80", name: "Dell XPS 15", swapFor: "MacBook Air" },
  { id: 11, image: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=400&q=80", name: "Gaming PC RTX", swapFor: "PS5 + Cash" },
];

const INIT_STORIES = [
  { id: "ms1", url: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400&q=80", duration: 5000 },
  { id: "ms2", url: "https://images.unsplash.com/photo-1607853202273-797f1c22a38e?w=400&q=80", duration: 5000 },
  { id: "ms3", url: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&q=80", duration: 5000 },
];

type TabKey = "listings" | "saved" | "swaps" | "reels" | "orders";

const TABS: { key: TabKey; icon: React.ReactNode; label: string }[] = [
  { key: "listings", icon: <FiGrid size={17} />,     label: "Listings" },
  { key: "saved",    icon: <FiBookmark size={17} />, label: "Saved" },
  { key: "swaps",    icon: <FiRepeat size={17} />,   label: "Swaps" },
  { key: "reels",    icon: <FiCamera size={17} />,   label: "Reels" },
  { key: "orders",   icon: <FiPackage size={17} />,  label: "Orders" },
];

/* ── Grid card (shared) ─────────────────────────────────── */
const GridCard = ({ item, badge, onDelete, onEdit }: { item: { id: number; image: string; name: string; price?: string; swapFor?: string }; badge?: "price" | "swap"; onDelete?: (id: number) => void; onEdit?: (id: number) => void }) => (
  <div className="pf-grid-card">
    <div className="pf-grid-img-wrap">
      <img src={item.image} alt={item.name} className="pf-grid-img" />
      <div className={`pf-grid-overlay ${badge === "swap" ? "pf-grid-overlay--swap" : ""}`}>
        {badge === "swap"
          ? <><FiRepeat size={11} /><span>{item.swapFor}</span></>
          : <><FiTag size={11} /><span>{item.price}</span></>
        }
      </div>
      {onDelete && onEdit && (
        <div className="pf-grid-actions">
          <button className="pf-grid-action-btn pf-grid-action-edit" onClick={() => onEdit(item.id)} title="Edit">
            <FiEdit2 size={14} />
          </button>
          <button className="pf-grid-action-btn pf-grid-action-delete" onClick={() => onDelete(item.id)} title="Delete">
            <FiTrash2 size={14} />
          </button>
        </div>
      )}
    </div>
    <div className="pf-grid-info">
      <span className="pf-grid-name">{item.name}</span>
      {badge === "price" && <span className="pf-grid-price">{item.price}</span>}
      {badge === "swap" && <span className="pf-grid-price pf-grid-price--swap">Swap for {item.swapFor}</span>}
    </div>
  </div>
);

/* ── Main component ─────────────────────────────────────── */
const Profile = () => {
  const navigate = useNavigate();
  const storyFileRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<TabKey>("listings");
  const [stories, setStories] = useState(INIT_STORIES);
  const [storyOpen, setStoryOpen] = useState(false);
  const [storyStart, setStoryStart] = useState(0);
  const [listings, setListings] = useState<any[]>([]);
  const [reels, setReels] = useState<any[]>([]);
  const [profileUser, setProfileUser] = useState<any>({
    name: "User",
    username: "@user",
    avatar: "",
    bio: "",
    city: "",
    email: "",
    phone: "",
    website: ""
  });

  useEffect(() => {
    const loadProfileData = async () => {
      try {
        const rawUser = localStorage.getItem("sz_user");
        const savedUser = rawUser ? JSON.parse(rawUser) : null;

        if (!savedUser?.id) {
          console.warn("Profile user id not found in localStorage.");
          return;
        }

        const fallbackProfile = {
          name: savedUser.name || "User",
          username: savedUser.username || "@user",
          avatar: savedUser.avatar || "",
          bio: savedUser.bio || "",
          city: savedUser.city || "",
          email: savedUser.email || "",
          phone: savedUser.phone || "",
          website: savedUser.website || ""
        };

        setProfileUser(fallbackProfile);

        const { data: productData, error: productError } = await api.getProductsByUser(savedUser.id);
        console.log("Profile products response:", { userId: savedUser.id, productData, productError });

        if (!productError && Array.isArray(productData)) {
          const activeListings = productData.filter((p: any) => (p.status || "active") === "active");
          setListings(activeListings.map((p: any) => ({
            id: p.id,
            image: p.image_urls?.[0] || 'https://placehold.co/400x400',
            name: p.title,
            price: 'Swap Only',
            swapFor: p.swap_for
          })));

          // Reels: only products with a video_url
          const reelProducts = productData.filter((p: any) => Boolean(p.video_url));
          setReels(reelProducts.map((p: any) => ({
            id: p.id,
            video: p.video_url,
            thumbnail: p.image_urls?.[0] || 'https://placehold.co/400x700?text=Reel',
            caption: p.title || "Reel",
            likes: p.saved_count || 0,
          })));
        }
      } catch (error) {
        console.error("Error loading profile data:", error);
      }
    };

    loadProfileData();
  }, []);

  const openStory = (idx: number) => { setStoryStart(idx); setStoryOpen(true); };

  const handleStoryFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const newStory = { id: `us-${Date.now()}`, url, duration: 5000 };
    setStories(prev => [newStory, ...prev]);
    e.target.value = "";
    setStoryStart(0);
    setStoryOpen(true);
  };

  const deleteListing = (id: number) => {
    setListings(prev => prev.filter(item => item.id !== id));
  };

  const deleteReel = (id: number) => {
    setReels(prev => prev.filter(r => r.id !== id));
  };

  const displayName = profileUser.name || "User";
  const displayUsername = profileUser.username || "@user";
  const initials = displayName[0]?.toUpperCase() || "U";

  return (
    <div className="pf-page">

      {storyOpen && (
        <StoryViewer
          stories={stories}
          username={displayUsername}
          avatar={profileUser.avatar}
          onClose={() => setStoryOpen(false)}
          key={`sv-${storyStart}`}
        />
      )}

      <input
        ref={storyFileRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleStoryFile}
      />

      <div className="pf-shell">

        {/* ══ LEFT COLUMN (sticky on large screens) ══ */}
        <aside className="pf-aside">
          <div className="pf-header">
            <div className="pf-avatar-area">
              <div
                className={`pf-story-ring ${stories.length > 0 ? "pf-story-ring--has" : ""}`}
                onClick={() => stories.length > 0 ? openStory(0) : storyFileRef.current?.click()}
                title={stories.length > 0 ? "View story" : "Add story"}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === "Enter" && (stories.length > 0 ? openStory(0) : storyFileRef.current?.click())}
              >
                <div className="pf-avatar">
                  {profileUser.avatar
                    ? <img src={profileUser.avatar} alt={displayName} className="pf-avatar-img" />
                    : <span className="pf-avatar-letter">{initials}</span>
                  }
                </div>
              </div>
              <button
                className="pf-cam-btn"
                onClick={() => storyFileRef.current?.click()}
                aria-label="Add story"
                title="Add to story"
              >
                <FiCamera size={13} />
              </button>
            </div>

            <div className="pf-info">
              <div className="pf-name-row">
                <h1 className="pf-name">{displayName}</h1>
                <HiCheckBadge size={18} className="pf-verified" />
              </div>
              <p className="pf-username">{displayUsername}</p>
              {profileUser.bio && <p className="pf-bio">{profileUser.bio}</p>}
              {profileUser.city && <p className="pf-city">{profileUser.city}</p>}

              <div className="pf-stats">
                {[
                  { val: listings.length, lbl: "Posts" },
                  { val: "2.1K", lbl: "Followers" },
                  { val: 0, lbl: "Orders" },
                ].map((s, i, arr) => (
                  <div key={s.lbl} className="pf-stat-block">
                    <div className="pf-stat">
                      <span className="pf-stat-val">{s.val}</span>
                      <span className="pf-stat-lbl">{s.lbl}</span>
                    </div>
                    {i < arr.length - 1 && <div className="pf-stat-sep" />}
                  </div>
                ))}
              </div>

              <div className="pf-btns">
                <button className="pf-btn pf-btn--primary" onClick={() => navigate("/profile/edit")}>
                  Edit profile
                </button>
                <button className="pf-btn pf-btn--ghost">
                  Share
                </button>
              </div>
            </div>
          </div>

          {/* ══ STORY STRIP ══ */}
          {/* <div className="pf-story-strip">
            <div className="pf-sitem" onClick={() => storyFileRef.current?.click()}>
              <div className="pf-scircle pf-scircle--new">
                <FiPlus size={20} />
              </div>
              <span className="pf-sname">New</span>
            </div>

            {stories.map((s, i) => (
              <div key={s.id} className="pf-sitem" onClick={() => openStory(i)}>
                <div className="pf-scircle pf-scircle--has">
                  <img src={s.url} alt="" className="pf-sthumb" />
                </div>
                <span className="pf-sname">Story {i + 1}</span>
              </div>
            ))}
          </div> */}
        </aside>

        {/* ══ RIGHT COLUMN ══ */}
        <main className="pf-main">
          <div className="pf-tabs">
            {TABS.map(tab => (
              <button
                key={tab.key}
                className={`pf-tab ${activeTab === tab.key ? "pf-tab--active" : ""}`}
                onClick={() => setActiveTab(tab.key)}
                title={tab.label}
              >
                {tab.icon}
                <span className="pf-tab-lbl">{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="pf-content">

            {/* REELS TAB */}
            {activeTab === "reels" && (
              <div className="pf-reels-grid">
                {reels.length === 0 && (
                  <div className="pf-empty" style={{ gridColumn: "1/-1" }}>
                    No reels yet. List a product with a video to appear here.
                  </div>
                )}
                {reels.map(reel => (
                  <div key={reel.id} className="pf-reel-card" onClick={() => navigate(`/reels?reel=${encodeURIComponent(reel.id)}`)}>
                    <div className="pf-reel-video-wrap">
                      <img src={reel.thumbnail} alt={reel.caption} className="pf-reel-thumbnail" />
                      <div className="pf-reel-play">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                      <div className="pf-reel-actions-reels">
                        <button
                          className="pf-reel-action-btn pf-reel-delete"
                          onClick={(e) => { e.stopPropagation(); deleteReel(reel.id); }}
                          title="Delete"
                        >
                          <FiTrash2 size={13} />
                        </button>
                      </div>
                    </div>
                    <div className="pf-reel-info">
                      <span className="pf-reel-caption">{reel.caption}</span>
                      <span className="pf-reel-likes"><FiHeart size={11} /> {reel.likes}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* LISTINGS TAB */}
            {activeTab === "listings" && (
              <div className="pf-grid">
                {listings.map(item => (
                  <GridCard
                    key={item.id}
                    item={item}
                    badge="price"
                    onDelete={deleteListing}
                    onEdit={(id: number) => console.log("Edit listing:", id)}
                  />
                ))}
                {listings.length === 0 && (
                  <div className="pf-empty">No active listings yet.</div>
                )}
              </div>
            )}

            {/* SAVED TAB */}
            {activeTab === "saved" && (
              <div className="pf-grid">
                {MOCK_SAVED.map(item => <GridCard key={item.id} item={item} badge="price" />)}
              </div>
            )}

            {/* SWAPS TAB */}
            {activeTab === "swaps" && (
              <div className="pf-grid">
                {MOCK_SWAPS.map(item => <GridCard key={item.id} item={item} badge="swap" />)}
              </div>
            )}

            {activeTab === "orders" && (
              <div className="pf-orders-list">
                <div className="pf-empty">No orders yet.</div>
              </div>
            )}
          </div>
        </main>
      </div>

      <style>{`
        :root {
          --pf-orange: #D9501E;
          --pf-orange-dark: #B23F15;
          --pf-ink: #15140F;
          --pf-ink-soft: #5B574E;
          --pf-line: #E7E3DA;
          --pf-line-soft: #F1EEE6;
          --pf-bg: #FBFAF7;
          --pf-surface: #FFFFFF;
          --pf-muted: #968F80;
        }

        * { box-sizing: border-box; }

        .pf-page {
          min-height: 100vh;
          background: var(--pf-bg);
          font-family: 'Poppins', sans-serif;
          color: var(--pf-ink);
          padding-bottom: 80px;
        }

        .pf-shell {
          max-width: 1080px;
          margin: 0 auto;
          padding: 28px 16px 0;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .pf-header {
          display: flex;
          align-items: flex-start;
          gap: 20px;
          padding-bottom: 18px;
        }

        .pf-avatar-area { position: relative; flex-shrink: 0; }

        .pf-story-ring {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          padding: 3px;
          background: var(--pf-line);
          cursor: pointer;
          transition: opacity 0.15s;
        }
        .pf-story-ring:hover { opacity: 0.85; }
        .pf-story-ring--has { background: var(--pf-orange); }

        .pf-avatar {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: var(--pf-orange);
          border: 3px solid var(--pf-surface);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .pf-avatar-img { width: 100%; height: 100%; object-fit: cover; }
        .pf-avatar-letter { font-size: 1.9rem; font-weight: 700; color: #fff; line-height: 1; }

        .pf-cam-btn {
          position: absolute;
          bottom: 0;
          right: 0;
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: var(--pf-ink);
          border: 2.5px solid var(--pf-surface);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          cursor: pointer;
          transition: background 0.15s;
        }
        .pf-cam-btn:hover { background: var(--pf-orange-dark); }

        .pf-info { flex: 1; min-width: 0; padding-top: 4px; }

        .pf-name-row {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 2px;
          flex-wrap: wrap;
        }
        .pf-name {
          font-size: 1.18rem;
          font-weight: 700;
          color: var(--pf-ink);
          margin: 0;
          letter-spacing: -0.01em;
        }
        .pf-verified { color: var(--pf-orange); flex-shrink: 0; }
        .pf-username { font-size: 0.8rem; color: var(--pf-muted); margin: 0 0 6px; font-weight: 500; }
        .pf-bio { font-size: 0.82rem; color: var(--pf-ink-soft); margin: 0 0 4px; line-height: 1.5; }
        .pf-city { font-size: 0.74rem; color: var(--pf-muted); margin: 0 0 12px; }

        .pf-stats { display: flex; align-items: center; margin-bottom: 14px; flex-wrap: wrap; }
        .pf-stat-block { display: flex; align-items: center; }
        .pf-stat { display: flex; flex-direction: column; align-items: flex-start; padding: 0 12px 0 0; }
        .pf-stat-val { font-size: 1rem; font-weight: 700; color: var(--pf-ink); line-height: 1.2; }
        .pf-stat-lbl { font-size: 0.65rem; color: var(--pf-muted); font-weight: 500; }
        .pf-stat-sep { width: 1px; height: 24px; background: var(--pf-line); margin-right: 12px; }

        .pf-btns { display: flex; gap: 8px; flex-wrap: wrap; }
        .pf-btn {
          padding: 9px 18px;
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.15s;
        }
        .pf-btn--primary { background: var(--pf-orange); color: #fff; border: 1px solid var(--pf-orange); }
        .pf-btn--primary:hover { background: var(--pf-orange-dark); border-color: var(--pf-orange-dark); }
        .pf-btn--ghost { background: var(--pf-surface); color: var(--pf-ink); border: 1px solid var(--pf-line); }
        .pf-btn--ghost:hover { background: var(--pf-line-soft); }

    
        .pf-scircle--has {
          border: 2px solid var(--pf-orange);
          padding: 2px;
          background: var(--pf-surface);
        }

        .pf-sthumb { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }

        .pf-sname {
          font-size: 0.62rem;
          color: var(--pf-ink-soft);
          font-weight: 500;
          max-width: 64px;
          text-align: center;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .pf-tabs {
          display: flex;
          border-bottom: 1px solid var(--pf-line);
          background: var(--pf-bg);
          position: sticky;
          top: 0;
          z-index: 5;
        }

        .pf-tab {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
          padding: 13px 4px 11px;
          background: none;
          border: none;
          cursor: pointer;
          color: var(--pf-muted);
          font-family: inherit;
          border-bottom: 2px solid transparent;
          transition: color 0.15s, border-color 0.15s;
          position: relative;
          bottom: -1px;
        }
        .pf-tab:hover { color: var(--pf-ink-soft); }
        .pf-tab--active { color: var(--pf-orange); border-bottom-color: var(--pf-orange); }

        .pf-tab-lbl { font-size: 0.62rem; font-weight: 600; letter-spacing: 0.01em; }

        .pf-content { padding: 16px 0 12px; }

        .pf-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        .pf-grid-card { display: block; text-decoration: none; }

        .pf-grid-img-wrap {
          position: relative;
          aspect-ratio: 1;
          overflow: hidden;
          background: var(--pf-line-soft);
          border-radius: 10px;
          border: 1px solid var(--pf-line);
        }

        .pf-grid-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.25s;
          display: block;
        }
        .pf-grid-card:hover .pf-grid-img { transform: scale(1.04); }

        .pf-grid-overlay {
          position: absolute;
          top: 8px;
          left: 8px;
          background: rgba(21,20,15,0.78);
          padding: 4px 8px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          gap: 4px;
          color: #fff;
          font-size: 0.64rem;
          font-weight: 600;
          font-family: 'Poppins', sans-serif;
        }
        .pf-grid-overlay--swap { background: rgba(217,80,30,0.92); }

        .pf-grid-actions {
          position: absolute;
          bottom: 8px;
          right: 8px;
          display: flex;
          gap: 6px;
          opacity: 0;
          transition: opacity 0.2s;
        }
        .pf-grid-card:hover .pf-grid-actions { opacity: 1; }

        .pf-grid-action-btn {
          width: 32px;
          height: 32px;
          border-radius: 6px;
          background: rgba(0, 0, 0, 0.7);
          border: none;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.2s;
          font-size: 0.85rem;
        }
        .pf-grid-action-btn:hover { background: rgba(0, 0, 0, 0.9); }
        .pf-grid-action-delete:hover { background: rgba(228, 88, 33, 0.85); }

        .pf-grid-info { padding: 8px 1px 0; display: flex; flex-direction: column; gap: 2px; }
        .pf-grid-name {
          font-size: 0.74rem;
          color: var(--pf-ink);
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          display: block;
        }
        .pf-grid-price { font-size: 0.7rem; color: var(--pf-ink-soft); font-weight: 500; }
        .pf-grid-price--swap { color: var(--pf-orange); }

        /* ════════════════════════════════════════
           REELS SECTION
        ════════════════════════════════════════ */
        .pf-reels-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
          margin-bottom: 0;
        }

        .pf-reel-card {
          display: flex;
          flex-direction: column;
          overflow: hidden;
          border-radius: 10px;
          border: 1px solid var(--pf-line);
          background: var(--pf-surface);
          cursor: pointer;
          transition: transform 0.2s;
        }
        .pf-reel-card:hover { transform: translateY(-2px); }

        .pf-reel-video-wrap {
          position: relative;
          aspect-ratio: 9 / 16;
          overflow: hidden;
          background: var(--pf-line-soft);
        }

        .pf-reel-thumbnail {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .pf-reel-play {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.3);
          opacity: 0;
          transition: opacity 0.2s;
        }
        .pf-reel-card:hover .pf-reel-play { opacity: 1; }

        .pf-reel-actions-reels {
          position: absolute;
          bottom: 8px;
          right: 8px;
          display: flex;
          gap: 6px;
          z-index: 10;
        }

        .pf-reel-action-btn {
          width: 32px;
          height: 32px;
          border-radius: 6px;
          background: rgba(0, 0, 0, 0.7);
          border: none;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.2s;
        }
        .pf-reel-action-btn:hover { background: rgba(0, 0, 0, 0.9); }
        .pf-reel-delete:hover { background: rgba(228, 88, 33, 0.85); }

        .pf-reel-info {
          padding: 10px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .pf-reel-caption {
          font-size: 0.74rem;
          color: var(--pf-ink);
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .pf-reel-likes {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.68rem;
          color: var(--pf-muted);
          font-weight: 500;
        }

        .pf-reviews { display: flex; flex-direction: column; gap: 10px; }

        .pf-rcard {
          background: var(--pf-surface);
          border: 1px solid var(--pf-line);
          border-radius: 12px;
          padding: 16px;
        }

        .pf-rtop { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }

        .pf-ravatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          object-fit: cover;
          border: 1px solid var(--pf-line);
          flex-shrink: 0;
        }

        .pf-rmeta { flex: 1; }
        .pf-rname { font-size: 0.82rem; font-weight: 600; color: var(--pf-ink); display: block; margin-bottom: 2px; }
        .pf-stars { display: flex; gap: 2px; }
        .pf-star-icon { color: var(--pf-orange); fill: var(--pf-orange); }
        .pf-rtime { font-size: 0.68rem; color: var(--pf-muted); flex-shrink: 0; }

        .pf-rtext {
          font-size: 0.82rem;
          color: var(--pf-ink-soft);
          line-height: 1.6;
          margin: 0;
        }

        @media (min-width: 640px) {
          .pf-grid { grid-template-columns: repeat(4, 1fr); gap: 14px; }
          .pf-story-ring { width: 100px; height: 100px; }
          .pf-avatar-letter { font-size: 2.2rem; }
          .pf-name { font-size: 1.4rem; }
        }

        /* ──────────────────────────────────────
           TABLET/MEDIUM SCREENS (780px-1300px)
        ────────────────────────────────────── */
        @media (min-width: 768px) and (max-width: 1300px) {
          .pf-shell {
            max-width: 1100px;
            flex-direction: row;
            align-items: flex-start;
            gap: 32px;
            padding: 32px 24px 0;
          }
          .pf-aside {
            width: 300px;
            flex-shrink: 0;
            position: sticky;
            top: 20px;
            background: #fbfaf7;
            border-radius: 16px;
            padding: 28px 22px 24px;
            display: flex;
            flex-direction: column;
            min-height: 580px;
          }
          html[data-theme='dark'] .pf-aside {
            background: #0f0f0f;
            border: 1px solid #2a2a2a;
          }
          .pf-header { flex-direction: column; align-items: flex-start; padding-bottom: 20px; }
          .pf-story-ring { width: 92px; height: 92px; }
          .pf-avatar-letter { font-size: 2rem; }
          .pf-name { font-size: 1.22rem; }
          .pf-info { padding-top: 14px; width: 100%; }
          .pf-stats { padding: 12px 0; margin: 2px 0 16px; border-top: 1px solid var(--pf-line-soft); border-bottom: 1px solid var(--pf-line-soft); }
          .pf-stat { padding: 0 10px 0 0; }
          .pf-btns { flex-direction: column; gap: 9px; }
          .pf-btn { width: 100%; padding: 10px 16px; text-align: center; font-size: 0.78rem; }
          .pf-story-strip { flex-wrap: wrap; border-bottom: none; padding-top: 18px; margin-top: auto; border-top: 1px solid var(--pf-line-soft); gap: 12px; }
          .pf-sname { max-width: 52px; font-size: 0.6rem; }
          .pf-scircle { width: 54px; height: 54px; }
          .pf-main { flex: 1; min-width: 0; }
          .pf-tabs { position: static; margin-bottom: 12px; }
          .pf-grid { grid-template-columns: repeat(3, 1fr); gap: 13px; }
          .pf-reels-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
          .pf-reel-card { border-radius: 10px; }
          .pf-reel-caption { font-size: 0.72rem; }
          .pf-reel-likes { font-size: 0.66rem; }
        }

        @media (min-width: 1024px) {
          .pf-shell {
            max-width: 1280px;
            flex-direction: row;
            align-items: flex-start;
            gap: 40px;
            padding: 40px 32px 0;
          }
          .pf-aside {
            width: 340px;
            flex-shrink: 0;
            position: sticky;
            top: 24px;
            background: #fbfaf7;
            border-radius: 18px;
            padding: 32px 26px 28px;
            display: flex;
            flex-direction: column;
            min-height: 640px;
          }
          .pf-header { flex-direction: column; align-items: flex-start; padding-bottom: 26px; }
          .pf-story-ring { width: 104px; height: 104px; }
          .pf-info { padding-top: 18px; width: 100%; }
          .pf-name { font-size: 1.32rem; }
          .pf-bio { font-size: 0.85rem; }
          .pf-stats { padding: 16px 0; margin: 4px 0 20px; border-top: 1px solid var(--pf-line-soft); border-bottom: 1px solid var(--pf-line-soft); }
          .pf-btns { flex-direction: column; gap: 10px; }
          .pf-btn { width: 100%; padding: 11px 18px; text-align: center; }
          .pf-story-strip { flex-wrap: wrap; border-bottom: none; padding-top: 22px; margin-top: auto; border-top: 1px solid var(--pf-line-soft); }
          .pf-sname { max-width: 56px; }
          .pf-main { flex: 1; min-width: 0; }
          .pf-tabs { position: static; }
          .pf-grid { grid-template-columns: repeat(3, 1fr); gap: 16px; }
        }

        @media (min-width: 1440px) {
          .pf-shell { max-width: 1480px; gap: 48px; padding: 48px 40px 0; }
          .pf-aside { width: 380px; padding: 36px 30px 32px; min-height: 700px; }
          .pf-grid { grid-template-columns: repeat(4, 1fr); gap: 18px; }
          .pf-name { font-size: 1.5rem; }
          .pf-story-ring { width: 120px; height: 120px; }
        }

        @media (min-width: 1920px) {
          .pf-shell { max-width: 1800px; gap: 56px; padding: 56px 48px 0; }
          .pf-aside { width: 420px; padding: 40px 34px 36px; min-height: 760px; }
          .pf-grid { grid-template-columns: repeat(5, 1fr); gap: 20px; }
          .pf-name { font-size: 1.65rem; }
          .pf-story-ring { width: 132px; height: 132px; }
          .pf-avatar-letter { font-size: 2.7rem; }
          .pf-rtext { font-size: 0.9rem; }
          .pf-bio { font-size: 0.9rem; }
        }

        @media (min-width: 2200px) {
          .pf-shell { max-width: 2200px; padding: 64px 64px 0; }
          .pf-aside { width: 460px; padding: 44px 38px 40px; min-height: 800px; }
          .pf-grid { grid-template-columns: repeat(6, 1fr); gap: 22px; }
        }

        /* ════════════════════════════════════════
           DARK MODE
        ════════════════════════════════════════ */
        html[data-theme='dark'] .pf-page {
          background: #0a0a0a;
          color: #f5f5f5;
        }

        html[data-theme='dark'] .pf-name {
          color: #fff;
        }

        html[data-theme='dark'] .pf-username {
          color: #999;
        }

        html[data-theme='dark'] .pf-bio {
          color: #d0d0d0;
        }

        html[data-theme='dark'] .pf-city {
          color: #999;
        }

        html[data-theme='dark'] .pf-stat-val {
          color: #fff;
        }

        html[data-theme='dark'] .pf-stat-lbl {
          color: #999;
        }

        html[data-theme='dark'] .pf-stat-sep {
          background: #2a2a2a;
        }

        html[data-theme='dark'] .pf-story-strip {
          border-bottom-color: #2a2a2a;
          background: #0a0a0a;
        }

        html[data-theme='dark'] .pf-tabs {
          border-bottom-color: #2a2a2a;
          background: #0a0a0a;
        }

        html[data-theme='dark'] .pf-tab {
          color: #666;
        }

        html[data-theme='dark'] .pf-tab:hover {
          color: #999;
        }

        html[data-theme='dark'] .pf-tab--active {
          color: #E45821;
          border-bottom-color: #E45821;
        }

        html[data-theme='dark'] .pf-btn--ghost {
          background: #1a1a1a;
          color: #fff;
          border-color: #2a2a2a;
        }

        html[data-theme='dark'] .pf-btn--ghost:hover {
          background: #2a2a2a;
          border-color: #3a3a3a;
        }

        html[data-theme='dark'] .pf-grid-img-wrap {
          background: #1a1a1a;
          border-color: #2a2a2a;
        }

        html[data-theme='dark'] .pf-grid-name {
          color: #fff;
        }

        html[data-theme='dark'] .pf-grid-price {
          color: #999;
        }

        html[data-theme='dark'] .pf-rcard {
          background: #1a1a1a;
          border-color: #2a2a2a;
        }

        html[data-theme='dark'] .pf-rname {
          color: #fff;
        }

        html[data-theme='dark'] .pf-rtext {
          color: #d0d0d0;
        }

        html[data-theme='dark'] .pf-rtime {
          color: #666;
        }

        html[data-theme='dark'] .pf-ravatar {
          border-color: #2a2a2a;
        }

        html[data-theme='dark'] .pf-sname {
          color: #999;
        }

        html[data-theme='dark'] .pf-scircle--new {
          background: #1a1a1a;
          border-color: #2a2a2a;
          color: #E45821;
        }

        html[data-theme='dark'] .pf-sthumb {
          border-radius: 50%;
        }

        html[data-theme='dark'] .pf-ink-soft {
          color: #d0d0d0;
        }

        html[data-theme='dark'] .pf-line {
          background: #2a2a2a;
        }

        html[data-theme='dark'] .pf-line-soft {
          background: #1a1a1a;
        }

        html[data-theme='dark'] .pf-reel-likes {
          color: #666;
        }

        html[data-theme='dark'] .pf-reels-header {
          border-bottom-color: #2a2a2a;
        }

        html[data-theme='dark'] .pf-reel-card {
          border-color: #2a2a2a;
          background: #1a1a1a;
        }

        html[data-theme='dark'] .pf-reel-video-wrap {
          background: #0f0f0f;
        }

        html[data-theme='dark'] .pf-reel-caption {
          color: #fff;
        }

        @media (min-width: 1024px) {
          html[data-theme='dark'] .pf-aside {
            background: #0f0f0f;
            border: 1px solid #2a2a2a;
          }
        }
      `}</style>
    </div>
  );
};

export default Profile;