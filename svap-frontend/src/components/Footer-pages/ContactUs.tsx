import FooterPageLayout from "./FooterPageLayout";

const ContactUs = () => {
  return (
    <FooterPageLayout
      title="Contact Us"
      subtitle="We'd love to hear from you. Reach out anytime."
    >
      <p>
        Have a question, suggestion, or just want to say hi? We're here to
        help. Our support team is available 24/7 to assist you.
      </p>

      <h2>Support Hours</h2>
      <table>
        <tbody>
          <tr>
            <th>Monday – Friday</th>
            <td>9:00 AM – 9:00 PM PKT</td>
          </tr>
          <tr>
            <th>Saturday</th>
            <td>10:00 AM – 6:00 PM PKT</td>
          </tr>
          <tr>
            <th>Sunday</th>
            <td>10:00 AM – 4:00 PM PKT</td>
          </tr>
          <tr>
            <th>Holidays</th>
            <td>Limited support — email responses within 24 hours</td>
          </tr>
        </tbody>
      </table>

      <h2>Contact Methods</h2>

      <h3>Email</h3>
      <p>
        <a href="mailto:support@svap.app">support@svap.app</a> — For support
        with your account, listings, or transactions.
      </p>
      <p>
        <a href="mailto:hello@svap.app">hello@svap.app</a> — For press,
        partnerships, and general inquiries.
      </p>
      <p>
        <a href="mailto:safety@svap.app">safety@svap.app</a> — For urgent
        safety concerns and reporting.
      </p>

      <h3>Phone</h3>
      <p>
        <strong>+92 300 SVAP-APP</strong> (+92 300 782 7277) — For urgent
        support during business hours.
      </p>

      <h3>Office</h3>
      <p>
        SVAP Technologies<br />
        Office #304, 3rd Floor, Business Arcade<br />
        Gulshan-e-Iqbal, Karachi 75400<br />
        Pakistan
      </p>

      <h3>Social Media</h3>
      <ul>
        <li>
          <a href="https://instagram.com/svap.app" target="_blank" rel="noopener noreferrer">
            Instagram: @svap.app
          </a>
        </li>
        <li>
          <a href="https://twitter.com/svap_app" target="_blank" rel="noopener noreferrer">
            Twitter: @svap_app
          </a>
        </li>
        <li>
          <a href="https://facebook.com/svap.app" target="_blank" rel="noopener noreferrer">
            Facebook: facebook.com/svap.app
          </a>
        </li>
        <li>
          <a href="https://linkedin.com/company/svap-app" target="_blank" rel="noopener noreferrer">
            LinkedIn: linkedin.com/company/svap-app
          </a>
        </li>
      </ul>

      <div className="fp-highlight">
        <p style={{ margin: 0, fontSize: "0.82rem" }}>
          <strong>Prefer to chat?</strong> Open the SVAP app, go to Profile →
          Settings → Help & Support, and tap "Start Chat." Our team typically
          responds within minutes during business hours.
        </p>
      </div>

      <h2>Press & Media</h2>
      <p>
        For press inquiries, please contact our Head of Communications at{" "}
        <a href="mailto:press@svap.app">press@svap.app</a>. We'll get back to
        you within 1 business day.
      </p>

      <h2>Partnerships</h2>
      <p>
        Interested in partnering with SVAP? Whether it's a brand collaboration,
        community event, or business integration — we'd love to explore
        opportunities. Email us at{" "}
        <a href="mailto:partnerships@svap.app">partnerships@svap.app</a>.
      </p>
    </FooterPageLayout>
  );
};

export default ContactUs;
