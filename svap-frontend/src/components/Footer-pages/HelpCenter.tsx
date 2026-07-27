import FooterPageLayout from "./FooterPageLayout";

const HelpCenter = () => {
  return (
    <FooterPageLayout
      title="Help Center"
      subtitle="Find answers to common questions about buying, selling, and using SVAP."
    >
      <h2>Getting Started</h2>
      <p><strong>How do I create an account?</strong></p>
      <p>
        You can sign up using your email, Google account, or Apple ID. Just tap
        "Create Account" on the login page and follow the prompts. It takes
        under 30 seconds.
      </p>

      <p><strong>How do I list an item?</strong></p>
      <p>
        Tap the "+" icon in the bottom navigation, snap a photo (or choose from
        your gallery), add a title, description, and pick a category. That's it!
        Your listing goes live immediately.
      </p>

      <h2>Buying</h2>
      <p><strong>How do I buy an item?</strong></p>
      <p>
        Browse listings near you, tap on any item you like, and send a swap
        request or make an offer. The seller will respond within 24 hours.
      </p>

      <p><strong>Is it safe to meet strangers?</strong></p>
      <p>
        We always recommend meeting in public places (like a café or market)
        and letting a friend know where you're going. See our{" "}
        <a href="/safety-tips">Safety Tips</a> for more.
      </p>

      <h2>Selling</h2>
      <p><strong>Can I edit my listing after posting?</strong></p>
      <p>
        Yes! Go to your Profile → Listings, tap the listing, and select "Edit."
        You can update photos, price, description, and more.
      </p>

      <p><strong>How do I delete a listing?</strong></p>
      <p>
        If your item is sold or you no longer want it listed, open the listing
        and tap the trash icon. Deleted listings can't be recovered.
      </p>

      <h2>Account & Billing</h2>
      <p><strong>Is SVAP free to use?</strong></p>
      <p>
        Absolutely. SVAP is 100% free for buyers and sellers. No listing fees,
        no transaction fees, no premium subscriptions.
      </p>

      <p><strong>I forgot my password. What do I do?</strong></p>
      <p>
        On the login screen, tap "Forgot password?" and enter your email. We'll
        send you a reset link immediately.
      </p>

      <div className="fp-highlight">
        <p style={{ margin: 0, fontSize: "0.82rem" }}>
          <strong>Need more help?</strong> Our support team responds within 2
          business hours. Email us at{" "}
          <a href="mailto:support@svap.app">support@svap.app</a> or visit our{" "}
          <a href="/contact-us">Contact Us</a> page.
        </p>
      </div>

      <h2>Popular Articles</h2>
      <ul>
        <li><a href="/safety-tips">Safety Tips for Buyers and Sellers</a></li>
        <li><a href="/report-a-problem">How to Report a Problem User</a></li>
        <li><a href="/privacy-policy">How We Protect Your Data</a></li>
      </ul>
    </FooterPageLayout>
  );
};

export default HelpCenter;
