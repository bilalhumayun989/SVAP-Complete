import { useParams, useNavigate } from "react-router-dom";
import { FiArrowLeft, FiMapPin, FiGrid } from "react-icons/fi";
import { HiCheckBadge } from "react-icons/hi2";

// Mock user data - in real app, fetch from backend
const MOCK_USERS: Record<string, any> = {
  "1": {
    id: "1",
    name: "Ahmed Khan",
    username: "@ahmed_swaps",
    city: "Karachi",
    bio: "Professional swapper | Trusted trader | Fast delivery",
    avatar: "https://i.pravatar.cc/150?img=1",
    verified: true,
    swaps: 287,
    followers: "3.2K",
    ratings: 4.9,
    listings: [
      { id: 1, image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400&q=80", name: "iPhone 15 Pro", price: "Rs 280,000" },
      { id: 2, image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&q=80", name: "MacBook Pro", price: "Rs 520,000" },
      { id: 3, image: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=400&q=80", name: "Sony Headphones", price: "Rs 65,000" },
      { id: 4, image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&q=80", name: "iPad Pro", price: "Rs 180,000" },
      { id: 5, image: "https://images.unsplash.com/photo-1607853202273-797f1c22a38e?w=400&q=80", name: "PS5 Bundle", price: "Rs 120,000" },
      { id: 6, image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80", name: "Nike Air Max", price: "Rs 22,000" },
    ]
  },
  "2": {
    id: "2",
    name: "Fatima Ali",
    username: "@fatima_deals",
    city: "Lahore",
    bio: "Fashion lover | Quality guaranteed | Best prices",
    avatar: "https://i.pravatar.cc/150?img=2",
    verified: true,
    swaps: 245,
    followers: "2.8K",
    ratings: 4.8,
    listings: [
      { id: 7, image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&q=80", name: "Designer Handbag", price: "Rs 45,000" },
      { id: 8, image: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400&q=80", name: "Samsung S24", price: "Rs 240,000" },
    ]
  },
  "3": {
    id: "3",
    name: "Hassan Raza",
    username: "@hassan_swap",
    city: "Islamabad",
    bio: "Tech enthusiast | Latest gadgets | Warranty included",
    avatar: "https://i.pravatar.cc/150?img=3",
    verified: true,
    swaps: 198,
    followers: "2.1K",
    ratings: 4.7,
    listings: [
      { id: 9, image: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=400&q=80", name: "Gaming PC", price: "Rs 185,000" },
      { id: 10, image: "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=400&q=80", name: "Dell XPS", price: "Rs 295,000" },
    ]
  },
  "4": {
    id: "4",
    name: "Ayesha Khan",
    username: "@ayesha_hub",
    city: "Rawalpindi",
    bio: "Home & lifestyle | Fresh inventory | Friendly service",
    avatar: "https://i.pravatar.cc/150?img=4",
    verified: true,
    swaps: 176,
    followers: "1.9K",
    ratings: 4.6,
    listings: [
      { id: 11, image: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=400&q=80", name: "Sofa Set", price: "Rs 85,000" },
    ]
  },
  "5": {
    id: "5",
    name: "Ali Malik",
    username: "@ali_exchange",
    city: "Multan",
    bio: "Automotive dealer | Premium vehicles | Easy swaps",
    avatar: "https://i.pravatar.cc/150?img=5",
    verified: false,
    swaps: 154,
    followers: "1.2K",
    ratings: 4.5,
    listings: [
      { id: 12, image: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400&q=80", name: "Toyota Car", price: "Rs 4,500,000" },
    ]
  },
  "6": {
    id: "6",
    name: "Sara Ahmed",
    username: "@sara_swaps",
    city: "Peshawar",
    bio: "Books & collectibles | Rare finds | Trusted seller",
    avatar: "https://i.pravatar.cc/150?img=6",
    verified: false,
    swaps: 142,
    followers: "980",
    ratings: 4.4,
    listings: [
      { id: 13, image: "https://images.unsplash.com/photo-1507842217343-583f20270819?w=400&q=80", name: "Book Collection", price: "Rs 15,000" },
    ]
  }
};

const UserProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  const user = userId ? MOCK_USERS[userId] : null;

  if (!user) {
    return (
      <div className="up-empty">
        <p>User not found.</p>
        <button onClick={() => navigate(-1)} className="up-back-btn">Go Back</button>
      </div>
    );
  }

  return (
    <div className="up-page">
      {/* Back button */}
      <div className="up-back-wrap">
        <button className="up-back" onClick={() => navigate(-1)}>
          <FiArrowLeft size={20} />
          Back
        </button>
      </div>

      {/* Profile header */}
      <div className="up-header">
        <div className="up-avatar-wrap">
          <img src={user.avatar} alt={user.name} className="up-avatar" />
          {user.verified && <div className="up-verified"><HiCheckBadge size={18} /></div>}
        </div>

        <div className="up-info">
          <div className="up-name-row">
            <h1 className="up-name">{user.name}</h1>
          </div>
          <p className="up-username">{user.username}</p>
          {user.bio && <p className="up-bio">{user.bio}</p>}
          {user.city && <p className="up-city"><FiMapPin size={14} /> {user.city}</p>}

          <div className="up-stats">
            <div className="up-stat">
              <span className="up-stat-val">{user.swaps}</span>
              <span className="up-stat-lbl">Swaps</span>
            </div>
            <div className="up-stat">
              <span className="up-stat-val">{user.followers}</span>
              <span className="up-stat-lbl">Followers</span>
            </div>
            <div className="up-stat">
              <span className="up-stat-val">{user.ratings}⭐</span>
              <span className="up-stat-lbl">Rating</span>
            </div>
          </div>

          {/* <div className="up-btns">
            <button className="up-btn up-btn-swap">Send Swap Request</button>
            <button className="up-btn up-btn-msg">Send Message</button>
          </div> */}
        </div>
      </div>

      {/* Listings */}
      <div className="up-listings-section">
        <h2 className="up-listings-title">
          <FiGrid size={18} />
          Listings ({user.listings.length})
        </h2>
        <div className="up-grid">
          {user.listings.map((item: any) => (
            <button 
              key={item.id} 
              className="up-card"
              onClick={() => navigate(`/product/${item.id}`)}
              title="View product details"
            >
              <div className="up-card-img-wrap">
                <img src={item.image} alt={item.name} className="up-card-img" />
              </div>
              <div className="up-card-info">
                <p className="up-card-name">{item.name}</p>
                <p className="up-card-price">{item.price}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <style>{`
        .up-page {
          min-height: 100vh;
          background: var(--bg);
          color: var(--text-dark);
          font-family: 'Poppins', sans-serif;
          padding-top: 20px;
          padding-bottom: 80px;
        }

        .up-empty {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          color: var(--text-muted);
        }

        .up-back-wrap {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 32px 20px;
        }

        .up-back {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          color: var(--text-muted);
          font-size: 0.88rem;
          font-weight: 600;
          background: none;
          border: none;
          cursor: pointer;
          transition: color 0.2s;
          padding: 0;
        }
        .up-back:hover { color: var(--text-dark); }

        .up-header {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 32px 40px;
          display: flex;
          gap: 32px;
          align-items: flex-start;
        }

        .up-avatar-wrap {
          position: relative;
          flex-shrink: 0;
        }

        .up-avatar {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          object-fit: cover;
          border: 3px solid var(--border);
        }

        .up-verified {
          position: absolute;
          bottom: 0;
          right: 0;
          width: 32px;
          height: 32px;
          background: #E45821;
          border: 2px solid var(--bg);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
        }

        .up-info {
          flex: 1;
          min-width: 0;
        }

        .up-name-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
        }

        .up-name {
          font-size: 1.8rem;
          font-weight: 700;
          margin: 0;
          color: var(--text-dark);
        }

        .up-username {
          font-size: 0.95rem;
          color: var(--text-muted);
          margin: 0 0 8px;
          font-weight: 500;
        }

        .up-bio {
          font-size: 0.95rem;
          color: var(--text-mid);
          margin: 0 0 6px;
          line-height: 1.5;
        }

        .up-city {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.88rem;
          color: var(--text-muted);
          margin: 0 0 16px;
        }

        .up-stats {
          display: flex;
          gap: 24px;
          margin: 16px 0 20px;
        }

        .up-stat {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 2px;
        }

        .up-stat-val {
          font-size: 1.3rem;
          font-weight: 700;
          color: var(--text-dark);
        }

        .up-stat-lbl {
          font-size: 0.75rem;
          color: var(--text-muted);
          font-weight: 600;
          text-transform: uppercase;
        }

        .up-btns {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .up-btn {
          padding: 11px 24px;
          border-radius: 10px;
          font-size: 0.88rem;
          font-weight: 700;
          cursor: pointer;
          border: none;
          font-family: inherit;
          transition: all 0.2s;
        }

        .up-btn-swap {
          background: #E45821;
          color: #fff;
        }
        .up-btn-swap:hover { background: #c94d1c; }

        .up-btn-msg {
          background: var(--card-bg);
          color: var(--text-dark);
          border: 1.5px solid var(--border);
        }
        .up-btn-msg:hover { background: var(--bg-section); }

        .up-listings-section {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 32px;
        }

        .up-listings-title {
          font-size: 1.3rem;
          font-weight: 700;
          color: var(--text-dark);
          margin: 0 0 20px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .up-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 16px;
        }

        .up-card {
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid var(--border);
          background: var(--card-bg);
          cursor: pointer;
          transition: all 0.2s;
          padding: 0;
          font-family: inherit;
          text-align: left;
        }
        .up-card:hover { border-color: #E45821; box-shadow: 0 4px 12px rgba(228, 88, 33, 0.1); }
        .up-card:focus-visible { outline: 2px solid #E45821; outline-offset: 2px; }

        .up-card-img-wrap {
          width: 100%;
          aspect-ratio: 4/3;
          overflow: hidden;
        }

        .up-card-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s;
        }
        .up-card:hover .up-card-img { transform: scale(1.05); }

        .up-card-info {
          padding: 12px;
        }

        .up-card-name {
          font-size: 0.82rem;
          font-weight: 600;
          color: var(--text-dark);
          margin: 0 0 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .up-card-price {
          font-size: 0.78rem;
          color: #E45821;
          font-weight: 700;
          margin: 0;
        }

        /* Dark mode */
        html[data-theme='dark'] .up-name,
        html[data-theme='dark'] .up-listings-title,
        html[data-theme='dark'] .up-stat-val,
        html[data-theme='dark'] .up-card-name {
          color: #fff;
        }

        html[data-theme='dark'] .up-avatar {
          border-color: var(--border);
        }

        html[data-theme='dark'] .up-btn-msg {
          background: var(--card-bg);
          border-color: var(--border);
          color: var(--text-dark);
        }

        html[data-theme='dark'] .up-card {
          border-color: var(--border);
          background: var(--card-bg);
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .up-header { flex-direction: column; gap: 24px; padding: 0 24px 32px; }
          .up-avatar { width: 100px; height: 100px; }
          .up-back-wrap { padding: 0 24px 16px; }
          .up-listings-section { padding: 0 24px; }
          .up-grid { grid-template-columns: repeat(5, 1fr); gap: 12px; }
        }

        @media (max-width: 768px) {
          .up-header { padding: 0 16px 24px; }
          .up-back-wrap { padding: 0 16px 12px; }
          .up-listings-section { padding: 0 16px; }
          .up-grid { grid-template-columns: repeat(4, 1fr); gap: 12px; }
          .up-name { font-size: 1.4rem; }
          .up-btns { gap: 8px; }
          .up-btn { padding: 9px 16px; font-size: 0.8rem; }
        }

        @media (max-width: 480px) {
          .up-header { padding: 0 12px 20px; }
          .up-back-wrap { padding: 0 12px 12px; }
          .up-listings-section { padding: 0 12px; }
          .up-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
          .up-avatar { width: 80px; height: 80px; }
          .up-name { font-size: 1.2rem; }
          .up-stats { gap: 16px; }
        }
      `}</style>
    </div>
  );
};

export default UserProfile;
