import FooterPageLayout from "./FooterPageLayout";

const ReportProblem = () => {
  return (
    <FooterPageLayout
      title="Report a Problem"
      subtitle="We're here to help."
    >
      <p>
        If you experience an issue with an item, exchange, inspection, payment, shipping, account, or another user, contact our support team.
      </p>

      <h2>What Can You Report?</h2>

      <h3>Item Issues</h3>
      <p>
        The item received by Svap does not match the listing, description, photographs, or stated condition.
      </p>

      <h3>Inspection Issues</h3>
      <p>
        You have a concern regarding the inspection or verification of an item.
      </p>

      <h3>Exchange Issues</h3>
      <p>
        There is an issue with an offer, accepted exchange, or exchange process.
      </p>

      <h3>Payment Issues</h3>
      <p>
        You experienced a payment failure, incorrect charge, or another payment-related concern.
      </p>

      <h3>Shipping Issues</h3>
      <p>
        There is an issue with the shipment of an item following successful verification.
      </p>

      <h3>User Concerns</h3>
      <p>
        You have experienced suspicious, misleading, abusive, or inappropriate behaviour from another user.
      </p>

      <h3>Technical Issues</h3>
      <p>
        You are experiencing a problem with the Svap website, application, account, or another platform feature.
      </p>

      <h2>How to Report an Issue</h2>
      <p>
        When contacting our team, please provide:
      </p>
      <ul>
        <li>Your account details</li>
        <li>Relevant order or exchange information</li>
        <li>A clear description of the issue</li>
        <li>Photographs or screenshots where applicable</li>
        <li>Any other information that may help us investigate</li>
      </ul>

      <p>
        Our team will review the matter and may contact you if additional information is required.
      </p>

      <div className="fp-highlight">
        <p style={{ margin: 0, fontSize: "0.82rem" }}>
          <strong>Contact Us:</strong> Email us directly at <a href="mailto:Contactatsvap@gmail.com">Contactatsvap@gmail.com</a>.
        </p>
      </div>

      <h2>Our Approach</h2>
      <p>
        We review reported issues based on the circumstances of each case and the applicable Svap policies.
      </p>
      <p>
        Your feedback helps us maintain a better and more reliable exchange experience for the Svap community.
      </p>
    </FooterPageLayout>
  );
};

export default ReportProblem;