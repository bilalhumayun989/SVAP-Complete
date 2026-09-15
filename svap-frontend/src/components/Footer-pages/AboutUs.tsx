import FooterPageLayout from "./FooterPageLayout";

const AboutUs = () => {
  return (
    <FooterPageLayout
      title="About Us"
      subtitle="A smarter way to exchange."
    >
      <p>
        Svap is an exchange platform designed to make it easier for people to exchange items they own for items they want. Users can discover, list, and exchange products within a simple and convenient marketplace.
      </p>
      <p>
        When the value of two items differs, Svap enables users to pay the applicable difference, making exchanges more flexible and accessible.
      </p>
      <p>
        Our goal is to create a seamless exchange experience while giving pre-owned items greater value and extending their lifecycle.
      </p>

      <div className="fp-highlight">
        <p style={{ margin: 0, fontSize: "0.82rem" }}>
          <strong>Skip the Spend. Svap Instead.</strong>
        </p>
      </div>

      <h2>How Svap Works</h2>
      <ul>
        <li>
          <strong>List your item:</strong> Create a listing with clear photographs and accurate information about your item, including its condition and relevant details.
        </li>
        <li>
          <strong>Find what you want:</strong> Browse Svap and discover items listed by other users. When you find something you are interested in, you can make an exchange offer.
        </li>
        <li>
          <strong>Agree on the exchange:</strong> Once both users agree to an exchange, each item is sent to Svap for inspection.
        </li>
        <li>
          <strong>Svap inspects both items:</strong> Our team receives and reviews both items to verify that they correspond with their respective listings and descriptions.
        </li>
        <li>
          <strong>Both items must pass inspection:</strong> The exchange only proceeds once both items have been received and verified. If an item does not match its listing, the exchange may be placed on hold while the issue is reviewed.
        </li>
        <li>
          <strong>Items are shipped to their new owners:</strong> Once both items have successfully passed inspection, they are shipped to the respective recipients.
        </li>
      </ul>
    </FooterPageLayout>
  );
};

export default AboutUs;