import FooterPageLayout from "./FooterPageLayout";

const ContactUs = () => {
  return (
    <FooterPageLayout
      title="Contact Us"
      subtitle="We're here to help with your questions, feedback, and support needs."
    >
      <p>
        Have questions about Svap, need help with an exchange, or want to provide feedback? Our team is available to assist you.
      </p>

      <h2>Email Us</h2>
      <p>
        For general inquiries, account support, listing assistance, payment questions, or reporting an issue:
      </p>
      <p>
        <a href="mailto:Contactatsvap@gmail.com">Contactatsvap@gmail.com</a>
      </p>

      <h2>What to Include in Your Message</h2>
      <p>
        To help us assist you as quickly as possible, please include:
      </p>
      <ul>
        <li>Your name and account email address</li>
        <li>Relevant order, listing, or transaction IDs</li>
        <li>A detailed description of your question or issue</li>
        <li>Any relevant photographs or screenshots</li>
      </ul>

      <h2>Response Times</h2>
      <p>
        We aim to respond to all inquiries as promptly as possible. Response times may vary depending on inquiry volume and the nature of the request.
      </p>

      <h2>Help & Support Resources</h2>
      <p>
        Before reaching out, you may find quick answers in our other resources:
      </p>
      <ul>
        <li><a href="/help-center">Help Center</a> — Guides on listings, exchanges, payments, and account management</li>
        <li><a href="/safety-tips">Safety Tips</a> — Guidelines for safe exchanges and protecting your account</li>
        <li><a href="/report-problem">Report a Problem</a> — How to report issues with listings, users, or transactions</li>
      </ul>

      <div className="fp-highlight">
        <p style={{ margin: 0, fontSize: "0.82rem" }}>
          <strong>Support Contact:</strong> Email us directly at <a href="mailto:Contactatsvap@gmail.com">Contactatsvap@gmail.com</a> for assistance.
        </p>
      </div>
    </FooterPageLayout>
  );
};

export default ContactUs;