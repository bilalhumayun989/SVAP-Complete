import StoriesRow from "./Stories/StoriesRow";
import HomeReelsRow from "./Reels/HomeReelsRow";

export const HomeHero = () => {
  return (
    <div className="homehero-wrap">
      {/* Instagram-style Stories */}
      <StoriesRow />
      {/* Horizontal Reels strip */}
      <HomeReelsRow />
    </div>
  );
};

export default HomeHero;
