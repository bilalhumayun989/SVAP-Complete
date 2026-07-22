import { useRef, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { categories } from "./data/data";


import "swiper/css";

const Categories = () => {
  const swiperRef = useRef<SwiperType | null>(null);
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);
  const [isStart, setIsStart] = useState(true);
  const [isEnd, setIsEnd]     = useState(false);

  const onSlideChange = (swiper: SwiperType) => {
    setIsStart(swiper.isBeginning);
    setIsEnd(swiper.isEnd);
  };

  return (
    <>
      <section className="cat-section">
        <div className="cat-inner">

          {/* ── Header ── */}
          <div className="cat-header">
            <h2 className="cat-title">Browse Categories</h2>
            <button className="cat-viewall" onClick={() => navigate('/categories')}>View All</button>
          </div>

          {/* ── Slider wrapper ── */}
          <div
            className="cat-slider-wrap"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
          >
            {/* Prev arrow */}
            <button
              className={`cat-arrow cat-arrow-prev ${hovered && !isStart ? "cat-arrow-show" : ""}`}
              onClick={() => swiperRef.current?.slidePrev()}
              aria-label="Previous"
            >
              <FiChevronLeft />
            </button>

            <Swiper
              modules={[Navigation]}
              slidesPerView={6}
              spaceBetween={10}
              onSwiper={(swiper) => {
                swiperRef.current = swiper;
                setIsStart(swiper.isBeginning);
                setIsEnd(swiper.isEnd);
              }}
              onSlideChange={onSlideChange}
              breakpoints={{
                0:    { slidesPerView: 2, spaceBetween: 8  },
                480:  { slidesPerView: 3, spaceBetween: 8  },
                768:  { slidesPerView: 4, spaceBetween: 10 },
                1024: { slidesPerView: 5, spaceBetween: 10 },
                1280: { slidesPerView: 6, spaceBetween: 10 },
              }}
              className="cat-swiper"
            >
              {categories.map((item) => (
                <SwiperSlide key={item.label}>
                  <div 
                    className="cat-card" 
                    onClick={() => navigate(`/category/${item.label.toLowerCase()}`)}
                  >
                    <img
                      src={item.image}
                      alt={item.label}
                      className="cat-img"
                      loading="lazy"
                    />
                    <div className="cat-overlay" />
                    <div className="cat-shimmer" />
                    <div className="cat-label-wrap">
                      <span className="cat-label">{item.label}</span>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>

            {/* Next arrow */}
            <button
              className={`cat-arrow cat-arrow-next ${hovered && !isEnd ? "cat-arrow-show" : ""}`}
              onClick={() => swiperRef.current?.slideNext()}
              aria-label="Next"
            >
              <FiChevronRight />
            </button>
          </div>

        </div>
      </section>

      <style>{`
        /* ── Section ── */
        .cat-section {
          width: 100%;
          background: var(--bg);
          box-sizing: border-box;
          border-top: 8px solid var(--bg-section);
        }

        .cat-inner {
          width: 100%;
          max-width: 100%;
          margin: 0 auto;
          padding: 20px 16px 20px;
          box-sizing: border-box;
        }

        /* ── Header ── */
        .cat-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }
        .cat-title {
          color: var(--text-dark);
          font-size: clamp(1.3rem, 2vw, 1.9rem);
          font-weight: 700;
          letter-spacing: -0.02em;
          margin: 0;
        }
        .cat-viewall {
          color: #fff;
          font-size: 0.875rem;
          font-weight: 600;
          padding: 8px 20px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          background: #000;
          border: 1px solid rgba(255,255,255,0.10);
          backdrop-filter: blur(12px);
        }
        .cat-viewall:hover {
          transform: translateY(-1px);
        }
        
        html[data-theme='dark'] .cat-viewall {
          background: #fff;
          color: #000;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        html[data-theme='dark'] .cat-viewall:hover {
          background: #f5f5f5;
        }

        /* ── Slider wrapper — relative for arrows ── */
        .cat-slider-wrap {
          position: relative;
          width: 100%;
        }

        /* ── Swiper ── */
        .cat-swiper {
          width: 100%;
          overflow: visible !important;
        }
        .cat-swiper .swiper-slide {
          height: auto;
        }

        /* ── Card ── */
        .cat-card {
          position: relative;
          overflow: hidden;
          border-radius: 12px;
          cursor: pointer;
          aspect-ratio: 1 / 1;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          backdrop-filter: blur(18px);
          transition: transform 0.3s, border-color 0.3s;
        }
        .cat-card:hover {
          transform: scale(1.03);
          border-color: rgba(255,255,255,0.22);
        }

        .cat-img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s ease;
        }
        .cat-card:hover .cat-img { transform: scale(1.07); }

        .cat-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.40);
          transition: background 0.3s;
        }
        .cat-card:hover .cat-overlay { background: rgba(0,0,0,0.25); }

        .cat-shimmer {
          position: absolute;
          inset: 0;
          opacity: 0;
          transition: opacity 0.3s;
          background: linear-gradient(180deg, rgba(255,255,255,0.07) 0%, transparent 50%);
        }
        .cat-card:hover .cat-shimmer { opacity: 1; }

        .cat-label-wrap {
          position: absolute;
          inset-inline: 0;
          bottom: 0;
          padding: 44px 12px 14px;
          background: linear-gradient(to top, rgba(0,0,0,0.88), transparent);
          display: flex;
          align-items: flex-end;
          justify-content: center;
        }
        .cat-label {
          color: #fff;
          font-size: clamp(0.78rem, 0.9vw, 0.95rem);
          font-weight: 600;
          letter-spacing: 0.02em;
          text-align: center;
        }

        /* ── Arrows ── */
        .cat-arrow {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          z-index: 10;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          color: #fff;
          cursor: pointer;
          border: 1px solid rgba(255,255,255,0.18);
          background: rgba(20,20,20,0.75);
          backdrop-filter: blur(14px);
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.25s ease, transform 0.25s ease, background 0.2s;
        }
        .cat-arrow-prev { left: -10px; }
        .cat-arrow-next { right: -10px; }

        /* show on hover */
        .cat-arrow-show {
          opacity: 1;
          pointer-events: auto;
        }
        .cat-arrow:hover {
          background: rgba(255,255,255,0.15);
          transform: translateY(-50%) scale(1.08);
        }

        /* ─────────────────────────────
           MEDIA QUERIES
        ───────────────────────────── */

        @media (min-width: 2400px) {
          .cat-inner { padding: 36px 28px 36px; }
        }
        @media (min-width: 1920px) and (max-width: 2399px) {
          .cat-inner { padding: 32px 24px 32px; }
        }
        @media (min-width: 1600px) and (max-width: 1919px) {
          .cat-inner { padding: 28px 22px 28px; }
        }
        
        /* ──────────────────────────────────────
           TABLET/MEDIUM SCREENS (780px-1300px)
        ────────────────────────────────────── */
        @media (min-width: 768px) and (max-width: 1300px) {
          .cat-inner { padding: 18px 14px 18px; }
          .cat-title { font-size: clamp(1.1rem, 2vw, 1.5rem); }
          .cat-viewall { padding: 7px 16px; font-size: 0.8rem; }
          .cat-card { border-radius: 10px; }
          .cat-label { font-size: clamp(0.72rem, 0.8vw, 0.85rem); }
          .cat-arrow { width: 32px; height: 32px; font-size: 0.95rem; }
          .cat-arrow-prev { left: -12px; }
          .cat-arrow-next { right: -12px; }
        }
        
        @media (max-width: 1024px) {
          .cat-inner { padding: 22px 16px 22px; }
          .cat-arrow { width: 34px; height: 34px; font-size: 1rem; }
          .cat-arrow-prev { left: -14px; }
          .cat-arrow-next { right: -14px; }
        }
        @media (max-width: 768px) {
          .cat-inner   { padding: 18px 14px 18px; }
          .cat-card    { border-radius: 8px; }
          /* on mobile always show arrows (no hover state) */
          .cat-arrow   { opacity: 1; pointer-events: auto; }
          .cat-arrow-prev { left: -10px; }
          .cat-arrow-next { right: -10px; }
        }
        @media (max-width: 480px) {
          .cat-inner { padding: 14px 12px 14px; }
        }

        /* Hide desktop categories on mobile/tablet — MobileCategoriesRow takes over */
        @media (max-width: 800px) {
          .cat-section { display: none; }
        }
      `}</style>
    </>
  );
};

export default Categories;
