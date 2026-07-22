import { HomeHero } from "./HomeHero";
import Categories from "./Categories";
import MobileCategoriesRow from "./MobileCategoriesRow";
// import TopSwapersRow from "./TopSwapers/TopSwapersRow";
import ProductGrid from "./Productgrid";
import Footer from "../Main-components/Footer";

const Homemain = () => {
  return (
    <div style={{ backgroundColor: "#fff", overflowX: "hidden" }}>
      <HomeHero />
      {/* Mobile/tablet categories — only shown ≤800px */}
            {/* <MobileSwapers /> */}

      <MobileCategoriesRow />
      {/* Desktop categories — hidden ≤800px via its own CSS */}
      <Categories />
      {/* <TopSwapersRow /> */}
      <ProductGrid />
      <Footer />
    </div>
  );
};

export default Homemain;
