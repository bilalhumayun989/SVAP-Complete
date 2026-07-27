import FooterPageLayout from "./FooterPageLayout";

const ReportProblem = () => {
  return (
    <FooterPageLayout
      title="Report a Problem"
      subtitle="Let us know what's going on and we'll investigate within 24 hours."
    >
      <p>
        Found something that doesn't look right? Whether it's a suspicious
        listing, a problematic user, a bug in the app, or a question about your
        account — we want to hear from you. Fill out the form below or email us
        directly at <a href="mailto:support@svap.app">support@svap.app</a>.
      </p>

      <h2>Common Issues We Can Help With</h2>
      <ul>
        <li>
          <strong>Suspicious listings:</strong> Fake photos, incorrect
          descriptions, or items that seem too good to be true.
        </li>
        <li>
          <strong>Problematic users:</strong> Harassment, scams, or users who
          don't follow through on agreements.
        </li>
        <li>
          <strong>Account issues:</strong> Locked out, can't log in, or need to
          recover your account.
        </li>
        <li>
          <strong>App bugs:</strong> Crashes, glitches, or features not working
          as expected.
        </li>
        <li>
          <strong>Billing questions:</strong> Though SVAP is free, we can help
          with any payment-related concerns.
        </li>
        <li>
          <strong>Feature requests:</strong> Ideas for improving SVAP — we love
          hearing from our community!
        </li>
      </ul>

      <h2>How to Report</h2>
      <ol>
        <li>
          <strong>On the web:</strong> Use the contact form below. Include as
          much detail as possible — screenshots are very helpful.
        </li>
        <li>
          <strong>In the app:</strong> Tap your Profile → Settings → "Help &
          Support" → "Report a Problem."
        </li>
        <li>
          <strong>By email:</strong> Send your report to{" "}
          <a href="mailto:support@svap.app">support@svap.app</a> with the
          subject line "Problem Report."
        </li>
        <li>
          <strong>On social:</strong> DM us on Instagram{" "}
          <a href="https://instagram.com/svap.app" target="_blank" rel="noopener noreferrer">@svap.app</a>{" "}
          or Twitter{" "}
          <a href="https://twitter.com/svap_app" target="_blank" rel="noopener noreferrer">@svap_app</a>.
        </li>
      </ol>

      <div className="fp-highlight">
        <p style={{ margin: 0, fontSize: "0.82rem" }}>
          <strong>Response time:</strong> We typically respond within 2 business
          hours during weekdays (9 AM – 9 PM PKT) and within 4 hours on weekends
          and holidays. For urgent safety concerns, please call us at +92 300
          SVAP-APP (+92 300 782 7277).
        </p>
      </div>

      <h2>What Happens Next</h2>
      <p>
        Once we receive your report, our support team will review it and take
        appropriate action. This may include:
      </p>
      <ul>
        <li>Contacting you for additional information.</li>
        <li>Investigating the reported listing or user.</li>
        <li>Taking action up to and including account suspension or banning.</li>
        <li>Following up with you once the issue is resolved.</li>
      </ul>

      <h2>Report a Problem Form</h2>
      <p>
        You can submit your report using our online form at{" "}
        <a href="https://svap.app/contact" target="_blank" rel="noopener noreferrer">
          svap.app/contact
        </a>{" "}
        or email us directly at{" "}
        <a href="mailto:support@svap.app">support@svap.app</a>.
      </p>
      <p style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
        <em>
          Note: We do not mediate disputes between buyers and sellers. SVAP is a
          peer-to-peer platform and all transactions are between users. We
          recommend meeting in public places and following our safety tips.
        </em>
      </p>
    </FooterPageLayout>
  );
};

export default ReportProblem;
