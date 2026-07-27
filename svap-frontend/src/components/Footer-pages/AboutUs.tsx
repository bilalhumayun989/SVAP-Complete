import FooterPageLayout from "./FooterPageLayout";

const AboutUs = () => {
  return (
    <FooterPageLayout
      title="About SVAP"
      subtitle="Pakistan's smartest platform to buy, sell & svap products securely with verified users."
    >
      <p>
        SVAP was born out of a simple idea: people in Pakistan should have a
        trusted, fun, and completely free space to give their pre-loved items a
        second life. Whether you're decluttering your home, upgrading your
        gadgets, or hunting for a bargain, SVAP connects you with real people in
        your city — no middlemen, no hidden fees, just honest swaps and sales.
      </p>

      <h2>Mission</h2>
      <p>
        We believe that sustainability starts locally. By making it effortless to
        rehome items that still have value, we reduce waste, save money for
        families, and build stronger communities — one swap at a time.
      </p>

      <h2>Our Values</h2>
      <ul>
        <li><strong>Trust:</strong> Every user is verified, every listing is moderated.</li>
        <li><strong>Simplicity:</strong> List in under 60 seconds with just a photo.</li>
        <li><strong>Community:</strong> We're building neighbourhoods, not marketplaces.</li>
        <li><strong>Sustainability:</strong> Keeping usable items out of landfills.</li>
        <li><strong>Transparency:</strong> No listing fees, no surprise charges.</li>
      </ul>

      <div className="fp-highlight">
        <p style={{ margin: 0, fontSize: "0.82rem" }}>
          <strong>Did you know?</strong> Since launching in 2024, SVAP users have
          given over 150,000 items a second life — saving an estimated 750,000 kg
          from going to waste.
        </p>
      </div>

      <h2>Leadership</h2>
      <p>
        SVAP was founded by a team of Pakistani product designers and engineers
        who met while working on community-focused tech projects in Karachi and
        Lahore. We're backed by local angel investors who share our vision of a
        more sustainable, connected Pakistan.
      </p>

      <h2>Join Us</h2>
      <p>
        We're a small, scrappy team — and we're growing. If you're passionate
        about sustainability, community tech, or just love a good bargain, drop
        us a line at <a href="mailto:hello@svap.app">hello@svap.app</a>.
      </p>
    </FooterPageLayout>
  );
};

export default AboutUs;
