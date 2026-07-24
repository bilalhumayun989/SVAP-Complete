import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import StoryViewer from "../../Profile/StoryViewer";
import { api } from "../../../services/api";

interface StoryProduct {
  id: string;
  title: string;
  description?: string;
  image: string;
  user: {
    name: string;
    avatar: string;
  };
}

const StoriesRow = () => {
  const navigate = useNavigate();
  const [stories, setStories] = useState<StoryProduct[]>([]);
  const [selectedStory, setSelectedStory] = useState<StoryProduct | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStories = async () => {
      try {
        const response = await api.getStories();
        if (response?.error) throw new Error(response.error);

        const mappedStories = (response.data || []).map((product: any) => ({
          id: product.id,
          title: product.title,
          description: product.description || "Fresh listing from the community.",
          image: product.image_urls?.[0] || "https://placehold.co/600x400?text=No+Image",
          user: {
            name: product.profiles?.username || product.profiles?.full_name || "Unknown",
            avatar: product.profiles?.avatar_url || "https://ui-avatars.com/api/?name=U&background=random",
          },
        }));

        setStories(mappedStories);
      } catch (error: any) {
        console.error("Error fetching stories:", error.message);
        setStories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStories();
  }, []);

  const handleStoryClick = (story: StoryProduct) => {
    setSelectedStory(story);
  };

  const handleViewListing = () => {
    if (selectedStory) {
      navigate(`/product/${selectedStory.id}`);
    }
  };

  const selectedStoryData = selectedStory ? [{ id: selectedStory.id, url: selectedStory.image, duration: 5000 }] : [];

  return (
    <section className="stories-section">
      {selectedStory && (
        <div className="story-viewer-portal">
          <StoryViewer
            stories={selectedStoryData}
            username={selectedStory.user.name}
            avatar={selectedStory.user.avatar}
            onClose={() => setSelectedStory(null)}
            title={selectedStory.title}
            description={selectedStory.description}
            ctaLabel="View Listing"
            onCtaClick={handleViewListing}
          />
        </div>
      )}

      <div className="stories-head">
        <h2 className="stories-title">Stories</h2>
      </div>

      <div className="stories-row" aria-label="Product stories row">
        {loading && Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="story-item">
            <div className="story-ring story-skeleton-ring">
              <div className="story-skeleton-circle" />
            </div>
            <div className="story-skeleton-line" />
            <div className="story-skeleton-line story-skeleton-line--xs" />
          </div>
        ))}

        {!loading && stories.length === 0 && (
          <div className="stories-empty">No recent active listings yet.</div>
        )}

        {!loading && stories.map((story) => (
          <button
            key={story.id}
            type="button"
            className="story-item"
            onClick={() => handleStoryClick(story)}
          >
            <div className="story-ring">
              <div className="story-avatar-wrap">
                <img src={story.image} alt={story.title} className="story-avatar" />
              </div>
            </div>
            <span className="story-name">{story.title}</span>
            <span className="story-seller">{story.user.name}</span>
          </button>
        ))}
      </div>

      <style>{`
        .stories-section {
          width: 100%;
          background: var(--bg);
          border-bottom: 1px solid var(--border);
          padding: 12px 0 4px;
        }

        .stories-head {
          padding: 0 16px 4px;
        }

        .stories-title {
          margin: 0;
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--text-dark);
        }

        .stories-row {
          display: flex;
          gap: 14px;
          overflow-x: auto;
          padding: 8px 16px 14px;
          scrollbar-width: none;
          scroll-snap-type: x proximity;
        }

        .stories-row::-webkit-scrollbar {
          display: none;
        }

        .story-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          min-width: 82px;
          flex-shrink: 0;
          border: none;
          background: transparent;
          cursor: pointer;
          padding: 0;
          scroll-snap-align: start;
        }

        .story-ring {
          background: linear-gradient(135deg, #E45821, #ffb67f);
          border-radius: 50%;
          padding: 2px;
          display: inline-flex;
          transition: transform 0.18s ease;
        }

        .story-item:hover .story-ring {
          transform: scale(1.05);
        }

        .story-avatar-wrap {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          overflow: hidden;
          background: var(--card-bg);
          border: 2px solid var(--card-bg);
        }

        .story-avatar {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .story-name {
          font-size: 0.66rem;
          font-weight: 700;
          color: var(--text-dark);
          max-width: 82px;
          text-align: center;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .story-seller {
          font-size: 0.58rem;
          color: var(--muted-text, #6b7280);
          max-width: 82px;
          text-align: center;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .stories-loading,
        .stories-empty {
          font-size: 0.82rem;
          color: var(--muted-text, #6b7280);
          padding: 8px 0;
        }

        /* ── Skeleton ── */
        @keyframes stories-shimmer {
          0%   { background-position: -300px 0; }
          100% { background-position: 300px 0; }
        }
        .story-skeleton-ring {
          background: transparent !important;
          padding: 2px;
        }
        .story-skeleton-circle {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 300px 100%;
          animation: stories-shimmer 1.4s infinite linear;
        }
        html[data-theme='dark'] .story-skeleton-circle {
          background: linear-gradient(90deg, #1a1a1a 25%, #2a2a2a 50%, #1a1a1a 75%);
          background-size: 300px 100%;
        }
        .story-skeleton-line {
          height: 9px;
          width: 60px;
          border-radius: 6px;
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 300px 100%;
          animation: stories-shimmer 1.4s infinite linear;
          animation-delay: 0.1s;
        }
        html[data-theme='dark'] .story-skeleton-line {
          background: linear-gradient(90deg, #1a1a1a 25%, #2a2a2a 50%, #1a1a1a 75%);
          background-size: 300px 100%;
        }
        .story-skeleton-line--xs { width: 40px; height: 7px; animation-delay: 0.2s; }

        @media (min-width: 768px) {
          .stories-section {
            padding-top: 16px;
          }

          .story-avatar-wrap {
            width: 82px;
            height: 82px;
          }

          .story-name {
            max-width: 94px;
          }

          .story-seller {
            max-width: 94px;
          }
        }
      `}</style>
    </section>
  );
};

export default StoriesRow;
