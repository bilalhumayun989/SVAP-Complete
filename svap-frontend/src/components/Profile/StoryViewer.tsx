import { useEffect, useRef, useState } from "react";
import { FiX, FiChevronLeft, FiChevronRight } from "react-icons/fi";

interface Story {
  id: string;
  url: string; // image URL
  duration: number; // ms
}

interface StoryViewerProps {
  stories: Story[];
  username: string;
  avatar?: string;
  onClose: () => void;
  startAt?: number;
  title?: string;
  description?: string;
  ctaLabel?: string;
  onCtaClick?: () => void;
}

const StoryViewer = ({
  stories,
  username,
  avatar,
  onClose,
  startAt = 0,
  title,
  description,
  ctaLabel,
  onCtaClick,
}: StoryViewerProps) => {
  const [current, setCurrent] = useState(startAt);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const TICK = 50;

  const story = stories[current];

  const startTimer = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setProgress(0);
    intervalRef.current = setInterval(() => {
      setProgress(p => {
        const next = p + (TICK / story.duration) * 100;
        if (next >= 100) {
          clearInterval(intervalRef.current!);
          // advance to next story
          setCurrent(c => {
            if (c + 1 < stories.length) {
              return c + 1;
            } else {
              onClose();
              return c;
            }
          });
          return 0;
        }
        return next;
      });
    }, TICK);
  };

  useEffect(() => {
    startTimer();
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [current]);

  const prev = () => { if (current > 0) setCurrent(c => c - 1); };
  const next = () => {
    if (current + 1 < stories.length) setCurrent(c => c + 1);
    else onClose();
  };

  return (
    <div className="sv-backdrop" onClick={onClose}>
      <div className="sv-container" onClick={e => e.stopPropagation()}>
        {/* Progress bars */}
        <div className="sv-bars">
          {stories.map((s, i) => (
            <div key={s.id} className="sv-bar-bg">
              <div
                className="sv-bar-fill"
                style={{
                  width: i < current ? "100%" : i === current ? `${progress}%` : "0%"
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="sv-header">
          <div className="sv-user">
            <div className="sv-user-avatar">
              {avatar
                ? <img src={avatar} alt={username} className="sv-user-avatar-img" />
                : <span>{username[0]?.toUpperCase()}</span>
              }
            </div>
            <span className="sv-username">{username}</span>
          </div>
          <button className="sv-close" onClick={onClose} aria-label="Close">
            <FiX size={22} />
          </button>
        </div>

        {/* Story image */}
        <img src={story.url} alt={`Story ${current + 1}`} className="sv-img" />

        {(title || description || ctaLabel) && (
          <div className="sv-story-card">
            {title && <div className="sv-story-title">{title}</div>}
            {description && <div className="sv-story-desc">{description}</div>}
            {ctaLabel && onCtaClick && (
              <button className="sv-story-btn" onClick={onCtaClick}>
                {ctaLabel}
              </button>
            )}
          </div>
        )}

        {/* Tap zones */}
        <div className="sv-tap-left" onClick={prev} />
        <div className="sv-tap-right" onClick={next} />

        {/* Nav arrows */}
        {current > 0 && (
          <button className="sv-nav sv-nav-prev" onClick={prev} aria-label="Previous">
            <FiChevronLeft size={22} />
          </button>
        )}
        {current < stories.length - 1 && (
          <button className="sv-nav sv-nav-next" onClick={next} aria-label="Next">
            <FiChevronRight size={22} />
          </button>
        )}
      </div>

      <style>{`
        .sv-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.85);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .sv-container {
          position: relative;
          width: 100%;
          max-width: 350px;
          height: 95vh;
          max-height: 720px;
          background: #000;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 32px 80px rgba(0,0,0,0.6);
        }

        .sv-bars {
          position: absolute;
          top: 12px;
          left: 10px;
          right: 10px;
          display: flex;
          gap: 4px;
          z-index: 20;
        }

        .sv-bar-bg {
          flex: 1;
          height: 3px;
          background: rgba(255,255,255,0.35);
          border-radius: 2px;
          overflow: hidden;
        }

        .sv-bar-fill {
          height: 100%;
          background: #fff;
          border-radius: 2px;
          transition: width 0.05s linear;
        }

        .sv-header {
          position: absolute;
          top: 26px;
          left: 12px;
          right: 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          z-index: 20;
        }

        .sv-user {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .sv-user-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 2px solid #fff;
          overflow: hidden;
          background: linear-gradient(135deg, #E45821, #f09060);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-weight: 700;
          font-size: 0.9rem;
          flex-shrink: 0;
        }

        .sv-user-avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .sv-username {
          color: #fff;
          font-size: 0.88rem;
          font-weight: 700;
          text-shadow: 0 1px 4px rgba(0,0,0,0.5);
          font-family: 'Poppins', sans-serif;
        }

        .sv-close {
          background: rgba(0,0,0,0.3);
          border: none;
          border-radius: 50%;
          width: 34px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          cursor: pointer;
          transition: background 0.15s;
        }
        .sv-close:hover { background: rgba(0,0,0,0.55); }

        .sv-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .sv-story-card {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 18;
          padding: 18px 16px 18px;
          background: linear-gradient(to top, rgba(0,0,0,0.92), rgba(0,0,0,0.45), rgba(0,0,0,0.08));
        }

        .sv-story-title {
          color: #fff;
          font-size: 1rem;
          font-weight: 700;
          margin-bottom: 6px;
          font-family: 'Poppins', sans-serif;
        }

        .sv-story-desc {
          color: rgba(255,255,255,0.88);
          font-size: 0.82rem;
          line-height: 1.45;
          margin-bottom: 12px;
          max-height: 3.2em;
          overflow: hidden;
        }

        .sv-story-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: none;
          border-radius: 999px;
          background: #E45821;
          color: #fff;
          padding: 10px 16px;
          font-weight: 700;
          font-size: 0.82rem;
          cursor: pointer;
        }

        /* Invisible tap zones */
        .sv-tap-left, .sv-tap-right {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 35%;
          z-index: 10;
          cursor: pointer;
        }
        .sv-tap-left { left: 0; }
        .sv-tap-right { right: 0; }

        /* Nav buttons */
        .sv-nav {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(255,255,255,0.2);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,0.3);
          border-radius: 50%;
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          cursor: pointer;
          z-index: 15;
          transition: background 0.15s;
        }
        .sv-nav:hover { background: rgba(255,255,255,0.35); }
        .sv-nav-prev { left: 10px; }
        .sv-nav-next { right: 10px; }

        @media (max-width: 480px) {
          .sv-container {
            max-width: 100vw;
            max-height: 100vh;
            border-radius: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default StoryViewer;
