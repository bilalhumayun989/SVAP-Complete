import FooterPageLayout from "./FooterPageLayout";

const SafetyTips = () => {
  return (
    <FooterPageLayout
      title="Safety Tips"
      subtitle="Exchange with confidence."
    >
      <p>
        At Svap, we are committed to creating a reliable and secure environment for our community. Our inspection process provides an additional layer of protection, but users should also take reasonable precautions when listing items and interacting with others.
      </p>

      <h2>Provide Accurate Information</h2>
      <p>
        Ensure that your listing accurately represents the item you are offering.
      </p>
      <p>
        Include clear photographs and provide accurate information about:
      </p>
      <ul>
        <li>Condition</li>
        <li>Size</li>
        <li>Brand</li>
        <li>Material</li>
        <li>Age, where relevant</li>
        <li>Any damage or defects</li>
        <li>Any alterations or modifications</li>
        <li>Other characteristics that may affect the item's value</li>
      </ul>

      <h2>Be Transparent About Condition</h2>
      <p>
        Do not conceal damage, defects, wear, or other relevant information.
      </p>
      <p>
        Items are inspected against their listings, and discrepancies may delay or prevent an exchange from proceeding.
      </p>

      <h2>Review Listings Carefully</h2>
      <p>
        Before making an offer, review the photographs, description, condition, and other available information carefully.
      </p>
      <p>
        If you require clarification about an item, ask questions before agreeing to the exchange.
      </p>

      <h2>Use Svap's Transaction Process</h2>
      <p>
        Keep your exchange and applicable payments within Svap's designated process.
      </p>
      <p>
        Do not agree to bypass the platform's inspection, payment, or exchange procedures.
      </p>

      <h2>Protect Your Personal Information</h2>
      <p>
        Never share passwords, verification codes, banking credentials, or other sensitive information with another user.
      </p>

      <h2>Be Cautious With External Payments</h2>
      <p>
        Do not send money directly to another user outside Svap's designated payment process.
      </p>
      <p>
        If someone asks you to make an unofficial payment or provides suspicious payment instructions, report the issue to Svap.
      </p>

      <h2>Report Suspicious Activity</h2>
      <p>
        Contact Svap if you encounter:
      </p>
      <ul>
        <li>Misleading listings</li>
        <li>Suspicious payment requests</li>
        <li>Attempts to bypass the inspection process</li>
        <li>Fraudulent or deceptive behaviour</li>
        <li>Harassment or inappropriate conduct</li>
        <li>Suspicious links or requests for sensitive information</li>
      </ul>

      <div className="fp-highlight">
        <p style={{ margin: 0, fontSize: "0.82rem" }}>
          A safer exchange starts with an accurate listing and responsible communication.
        </p>
      </div>
    </FooterPageLayout>
  );
};

export default SafetyTips;