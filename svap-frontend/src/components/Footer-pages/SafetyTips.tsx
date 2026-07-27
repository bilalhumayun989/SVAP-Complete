import FooterPageLayout from "./FooterPageLayout";

const SafetyTips = () => {
  return (
    <FooterPageLayout
      title="Safety Tips"
      subtitle="Guidelines to help you buy and sell safely on SVAP."
    >
      <p>
        Your safety is our priority. Whether you're buying or selling, following
        these simple tips will help you have a smooth, secure experience on SVAP.
      </p>

      <h2>For Buyers</h2>
      <ul>
        <li>
          <strong>Meet in public:</strong> Always arrange to meet in a well-lit,
          public place like a café, mall, or market. Never go to a private
          residence.
        </li>
        <li>
          <strong>Bring a friend:</strong> Let someone know where you're going
          and who you're meeting. Better yet, bring a friend along.
        </li>
        <li>
          <strong>Inspect before you pay:</strong> Check the item thoroughly
          before handing over any money. Test electronics, check for damage,
          verify authenticity.
        </li>
        <li>
          <strong>Avoid advance payments:</strong> Never send money before seeing
          the item in person. SVAP does not offer escrow or payment protection —
          all transactions are peer-to-peer.
        </li>
        <li>
          <strong>Trust your instincts:</strong> If something feels off, walk
          away. There are always more listings.
        </li>
      </ul>

      <h2>For Sellers</h2>
      <ul>
        <li>
          <strong>Be honest in your listing:</strong> Take clear photos and
          describe any flaws. Misrepresenting an item can lead to disputes and
          account suspension.
        </li>
        <li>
          <strong>Meet in public:</strong> Same rule applies — public places
          only. Never invite buyers to your home.
        </li>
        <li>
          <strong>Verify the buyer:</strong> Check their profile, reviews, and
          how long they've been on SVAP. Be cautious of new accounts with no
          activity.
        </li>
        <li>
          <strong>Count cash carefully:</strong> Count money in front of the
          buyer before handing over the item. Use exact change when possible.
        </li>
        <li>
          <strong>Keep records:</strong> Take a photo of the transaction (with
          the buyer's consent) as a record of the sale.
        </li>
      </ul>

      <h2>Red Flags — Walk Away If You See These</h2>
      <ul>
        <li>Buyers who insist on shipping (SVAP is local-only).</li>
        <li>Sellers who won't meet in person or show the item.</li>
        <li>Requests to use external payment platforms (JazzCash, Easypaisa, bank transfer to unknown accounts).</li>
        <li>Unusually high prices for common items.</li>
        <li>Pressure to act immediately ("cash only," "first offer accepted").</li>
        <li>Accounts created very recently with no profile picture or activity.</li>
      </ul>

      <div className="fp-highlight">
        <p style={{ margin: 0, fontSize: "0.82rem" }}>
          <strong>Report suspicious activity:</strong> If you encounter a user
          who violates our safety guidelines, report them immediately using the
          "Report" button on their profile or listing. Your report helps keep
          SVAP safe for everyone.
        </p>
      </div>

      <h2>Additional Resources</h2>
      <ul>
        <li><a href="/help-center">Help Center — Full FAQ</a></li>
        <li><a href="/contact-us">Contact Support — 24/7 assistance</a></li>
      </ul>
    </FooterPageLayout>
  );
};

export default SafetyTips;
