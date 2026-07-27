import FooterPageLayout from "./FooterPageLayout";

const CookiePolicy = () => {
  return (
    <FooterPageLayout
      title="Cookie Policy"
      subtitle="How SVAP uses cookies and similar tracking technologies."
    >
      <p>
        <strong>Last updated:</strong> July 2024
      </p>
      <p>
        This Cookie Policy explains how SVAP ("we", "us", "our") uses cookies
        and similar tracking technologies when you use our platform. By using
        SVAP, you consent to the use of cookies as described in this policy.
      </p>

      <h2>What Are Cookies?</h2>
      <p>
        Cookies are small text files that are stored on your device (computer,
        smartphone, tablet) when you visit a website. They help the website
        remember your preferences and improve your browsing experience. We also
        use similar technologies such as web beacons, pixel tags, and local
        storage.
      </p>

      <h2>How We Use Cookies</h2>
      <p>We use cookies for the following purposes:</p>
      <ul>
        <li>
          <strong>Essential cookies:</strong> These are necessary for the
          website to function. Without them, you cannot log in, create listings,
          or use core features.
        </li>
        <li>
          <strong>Performance cookies:</strong> These help us understand how
          visitors interact with our site (which pages are visited, how long
          users stay, where they come from). This helps us improve performance.
        </li>
        <li>
          <strong>Functionality cookies:</strong> These remember your
          preferences (language, region, dark mode setting) to provide a
          personalized experience.
        </li>
        <li>
          <strong>Targeting cookies:</strong> These track your browsing
          behavior to show you relevant listings and ads on and off SVAP.
        </li>
        <li>
          <strong>Social media cookies:</strong> These enable sharing features
          and track your activity across platforms when you interact with our
          social content.
        </li>
      </ul>

      <h2>Cookies We Use</h2>
      <table>
        <thead>
          <tr>
            <th>Cookie Name</th>
            <th>Purpose</th>
            <th>Duration</th>
            <th>Type</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>sz_session</td>
            <td>Keeps you logged in during your visit</td>
            <td>Session</td>
            <td>Essential</td>
          </tr>
          <tr>
            <td>sz_user</td>
            <td>Stores your user profile data</td>
            <td>30 days</td>
            <td>Essential</td>
          </tr>
          <tr>
            <td>sz_theme</td>
            <td>Saves your dark/light mode preference</td>
            <td>365 days</td>
            <td>Functionality</td>
          </tr>
          <tr>
            <td>sz_locale</td>
            <td>Stores your language preference</td>
            <td>90 days</td>
            <td>Functionality</td>
          </tr>
          <tr>
            <td>_ga</td>
            <td>Google Analytics — tracks usage patterns</td>
            <td>2 years</td>
            <td>Performance</td>
          </tr>
          <tr>
            <td>_gid</td>
            <td>Google Analytics — session tracking</td>
            <td>24 hours</td>
            <td>Performance</td>
          </tr>
          <tr>
            <td>sz_referrer</td>
            <td>Tracks which link brought you to SVAP</td>
            <td>30 days</td>
            <td>Performance</td>
          </tr>
        </tbody>
      </table>

      <h2>Third-Party Cookies</h2>
      <p>
        We may allow trusted third parties to set cookies on our site:
      </p>
      <ul>
        <li>
          <strong>Google Analytics:</strong> Helps us understand how users
          interact with our site. You can opt out via the{" "}
          <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer">
            Google Analytics opt-out browser add-on
          </a>.
        </li>
        <li>
          <strong>Meta Pixel:</strong> Used to measure ad performance and
          show relevant ads on Facebook and Instagram.
        </li>
        <li>
          <strong>Twitter Pixel:</strong> Used for conversion tracking and
          retargeting on Twitter.
        </li>
      </ul>

      <div className="fp-highlight">
        <p style={{ margin: 0, fontSize: "0.82rem" }}>
          <strong>Manage your cookies:</strong> You can control and/or delete
          cookies through your browser settings. Most browsers allow you to
          block all cookies, delete existing cookies, or receive a notification
          when a cookie is set. Note that disabling essential cookies may
          prevent you from using certain features of SVAP.
        </p>
      </div>

      <h2>Your Choices</h2>
      <ul>
        <li>
          <strong>Browser settings:</strong> Most browsers let you refuse
          cookies. Check your browser's "Help" section for instructions.
        </li>
        <li>
          <strong>Do Not Track:</strong> SVAP does not currently respond to
          "Do Not Track" signals from browsers.
        </li>
        <li>
          <strong>Mobile apps:</strong> You can reset your device's advertising
          ID or opt out of interest-based ads in your phone's settings.
        </li>
      </ul>

      <h2>Changes to This Cookie Policy</h2>
      <p>
        We may update this Cookie Policy from time to time. Any changes will be
        posted on this page with an updated "Last updated" date.
      </p>

      <h2>Contact Us</h2>
      <p>
        Questions about our use of cookies? Contact us at{" "}
        <a href="mailto:privacy@svap.app">privacy@svap.app</a>.
      </p>
    </FooterPageLayout>
  );
};

export default CookiePolicy;
