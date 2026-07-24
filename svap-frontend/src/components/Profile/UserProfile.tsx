import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiArrowLeft, FiMapPin, FiGrid, FiCalendar } from "react-icons/fi";
import { HiCheckBadge } from "react-icons/hi2";
import { api } from "../../services/api";

interface UserData {
  id: string;
  username: string;
  full_name: string;
  bio?: string;
  city?: string;
  avatar_url?: string;
  created_at?: string;
}

interface Listing {
  id: string;
  title: string;
  image: string;
  swap_for?: string;
}

const UserProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserData | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      setLoading(true);
      try {
        const [profileRes, productsRes] = await Promise.all([
          api.getProfile(userId),
          api.getProductsByUser(userId, true),
        ]);

        if (profileRes.error || !profileRes.data) throw new Error("User not found");
        setUser(profileRes.data);

        if (productsRes.data) {
          setListings(productsRes.data.map((p: any) => ({
            id: p.id,
            title: p.title,
            image: p.image_urls?.[0] || "https://placehold.co/400x400",
            swap_for: p.swap_for,
          })));
        }
      } catch (err: any) {
        setError(err.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId]);

  const joinedYear = user?.created_at
    ? new Date(user.created_at).getFullYear()
    : null;

  const initial = (user?.username || user?.full_name || "U")[0].toUpperCase();

  if (loading) {
    return (
      <div className="up-page">
        <div className="up-back-wrap">
          <button className="up-back" onClick={() => navigate(-1)}>
            <FiArrowLeft size={20} /> Back
          </button>
        </div>
        <div className="up-skeleton-header">
          <div className="up-skel up-skel-avatar" />
          <div className="up-skel-info">
            <div className="up-skel up-skel-name" />
            <div className="up-skel up-skel-line" />
            <div className="up-skel up-skel-line up-skel-line--short" />
          </div>
        </div>
        <div className="up-listings-section">
          <div className="up-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="up-skel up-skel-card" />
            ))}
          </div>
        </div>
        <style>{`
          @keyframes up-shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
          .up-skel { background:linear-gradient(90deg,#f0f0f0 25%,#e4e4e4 50%,#f0f0f0 75%); background-size:400px 100%; animation:up-shimmer 1.4s infinite linear; border-radius:10px; }
          html[data-theme='dark'] .up-skel { background:linear-gradient(90deg,#1a1a1a 25%,#252525 50%,#1a1a1a 75%); background-size:400px 100%; }
          .up-skel-avatar { width:110px; height:110px; border-radius:50%; flex-shrink:0; }
          .up-skel-info { flex:1; display:flex; flex-direction:column; gap:10px; }
          .up-skel-name { height:28px; width:55%; }
          .up-skel-line { height:14px; width:80%; }
          .up-skel-line--short { width:40%; }
          .up-skel-card { aspect-ratio:1; border-radius:12px; }
          .up-skeleton-header { max-width:1200px; margin:0 auto; padding:0 32px 40px; display:flex; gap:28px; align-items:flex-start; }
        `}</style>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="up-page">
        <div className="up-back-wrap">
          <button className="up-back" onClick={() => navigate(-1)}><FiArrowLeft size={20} /> Back</button>
        </div>
        <div className="up-empty"><p>{error || "User not found."}</p></div>
      </div>
    );
  }

  return (
    <div className="up-page">
      <div className="up-back-wrap">
        <button className="up-back" onClick={() => navigate(-1)}>
          <FiArrowLeft size={20} /> Back
        </button>
      </div>

      {/* Profile header */}
      <div className="up-header">
        <div className="up-avatar-wrap">
          {user.avatar_url ? (
            <img src={user.avatar_url} alt={user.username} className="up-avatar" />
          ) : (
            <div className="up-avatar up-avatar-initial">{initial}</div>
          )}
          <div className="up-verified"><HiCheckBadge size={18} /></div>
        </div>

        <div className="up-info">
          <div className="up-name-row">
            <h1 className="up-name">{user.full_name || user.username}</h1>
          </div>
          <p className="up-username">@{user.username}</p>
          {user.bio && <p className="up-bio">{user.bio}</p>}
          <div className="up-meta-row">
            {user.city && (
              <span className="up-meta-item">
                <FiMapPin size={13} /> {user.city}
              </span>
            )}
            {joinedYear && (
              <span className="up-meta-item">
                <FiCalendar size={13} /> Joined {joinedYear}
              </span>
            )}
          </div>

          <div className="up-stats">
            <div className="up-stat">
              <span className="up-stat-val">{listings.length}</span>
              <span className="up-stat-lbl">Listings</span>
            </div>
          </div>
        </div>
      </div>

      {/* Listings */}
      <div className="up-listings-section">
        <h2 className="up-listings-title">
          <FiGrid size={18} />
          Active Listings ({listings.length})
        </h2>
        {listings.length === 0 ? (
          <div className="up-empty-listings">No active listings yet.</div>
        ) : (
          <div className="up-grid">
            {listings.map((item) => (
              <button
                key={item.id}
                className="up-card"
                onClick={() => navigate(`/product/${item.id}`)}
              >
                <div className="up-card-img-wrap">
                  <img src={item.image} alt={item.title} className="up-card-img" />
                </div>
                <div className="up-card-info">
                  <p className="up-card-name">{item.title}</p>
                  {item.swap_for && (
                    <p className="up-card-swap">↔ {item.swap_for}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .up-page { min-height:100vh; background:var(--bg); color:var(--text-dark); font-family:'Poppins',sans-serif; padding-top:20px; padding-bottom:80px; }
        .up-empty { min-height:50vh; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:16px; color:var(--text-muted); font-size:0.95rem; }
        .up-back-wrap { max-width:1200px; margin:0 auto; padding:0 32px 20px; }
        .up-back { display:inline-flex; align-items:center; gap:7px; color:var(--text-muted); font-size:0.88rem; font-weight:600; background:none; border:none; cursor:pointer; transition:color 0.2s; padding:0; }
        .up-back:hover { color:var(--text-dark); }
        .up-header { max-width:1200px; margin:0 auto; padding:0 32px 40px; display:flex; gap:28px; align-items:flex-start; }
        .up-avatar-wrap { position:relative; flex-shrink:0; }
        .up-avatar { width:110px; height:110px; border-radius:50%; object-fit:cover; border:3px solid var(--border); }
        .up-avatar-initial { width:110px; height:110px; border-radius:50%; background:#E45821; border:3px solid var(--border); display:flex; align-items:center; justify-content:center; font-size:2.4rem; font-weight:800; color:#fff; }
        .up-verified { position:absolute; bottom:2px; right:2px; width:28px; height:28px; background:#E45821; border:2px solid var(--bg); border-radius:50%; display:flex; align-items:center; justify-content:center; color:#fff; }
        .up-info { flex:1; min-width:0; }
        .up-name-row { display:flex; align-items:center; gap:8px; margin-bottom:4px; }
        .up-name { font-size:1.7rem; font-weight:700; margin:0; color:var(--text-dark); letter-spacing:-0.02em; }
        .up-username { font-size:0.9rem; color:var(--text-muted); margin:0 0 6px; font-weight:500; }
        .up-bio { font-size:0.9rem; color:var(--text-mid); margin:0 0 8px; line-height:1.5; }
        .up-meta-row { display:flex; align-items:center; gap:16px; flex-wrap:wrap; margin-bottom:14px; }
        .up-meta-item { display:flex; align-items:center; gap:5px; font-size:0.82rem; color:var(--text-muted); }
        .up-stats { display:flex; gap:24px; margin-top:4px; }
        .up-stat { display:flex; flex-direction:column; align-items:flex-start; gap:2px; }
        .up-stat-val { font-size:1.2rem; font-weight:700; color:var(--text-dark); }
        .up-stat-lbl { font-size:0.7rem; color:var(--text-muted); font-weight:600; text-transform:uppercase; letter-spacing:0.05em; }
        .up-listings-section { max-width:1200px; margin:0 auto; padding:0 32px; }
        .up-listings-title { font-size:1.15rem; font-weight:700; color:var(--text-dark); margin:0 0 18px; display:flex; align-items:center; gap:8px; }
        .up-empty-listings { padding:40px 0; text-align:center; color:var(--text-muted); font-size:0.88rem; }
        .up-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; }
        .up-card { border-radius:12px; overflow:hidden; border:1px solid var(--border); background:var(--card-bg); cursor:pointer; transition:all 0.2s; padding:0; font-family:inherit; text-align:left; }
        .up-card:hover { border-color:#E45821; box-shadow:0 4px 12px rgba(228,88,33,0.12); transform:translateY(-2px); }
        .up-card-img-wrap { width:100%; aspect-ratio:1; overflow:hidden; }
        .up-card-img { width:100%; height:100%; object-fit:cover; transition:transform 0.3s; }
        .up-card:hover .up-card-img { transform:scale(1.05); }
        .up-card-info { padding:10px 12px; }
        .up-card-name { font-size:0.8rem; font-weight:600; color:var(--text-dark); margin:0 0 3px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .up-card-swap { font-size:0.72rem; color:#E45821; font-weight:600; margin:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        html[data-theme='dark'] .up-name { color:#fff; }
        html[data-theme='dark'] .up-card-name { color:#fff; }
        html[data-theme='dark'] .up-stat-val { color:#fff; }
        @media (max-width:1024px) { .up-header{flex-direction:column;gap:20px;padding:0 24px 32px;} .up-avatar{width:90px;height:90px;} .up-avatar-initial{width:90px;height:90px;font-size:2rem;} .up-back-wrap{padding:0 24px 16px;} .up-listings-section{padding:0 24px;} .up-grid{grid-template-columns:repeat(3,1fr);gap:12px;} }
        @media (max-width:600px) { .up-header{padding:0 16px 24px;} .up-back-wrap{padding:0 16px 12px;} .up-listings-section{padding:0 16px;} .up-grid{grid-template-columns:repeat(2,1fr);gap:10px;} .up-name{font-size:1.3rem;} }
      `}</style>
    </div>
  );
};

export default UserProfile;
