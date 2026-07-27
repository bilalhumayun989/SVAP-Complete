import FooterPageLayout from "./FooterPageLayout";

const TermsOfService = () => {
  return (
    <FooterPageLayout
      title="Terms of Service"
      subtitle="The rules and guidelines for using the SVAP platform."
    >
      <p>
        <strong>Last updated:</strong> July 2024
      </p>
      <p>
        Welcome to SVAP. These Terms of Service ("Terms") govern your access
        to and use of the SVAP platform, including our website and mobile
        application (collectively, the "Service"). By accessing or using SVAP,
        you agree to be bound by these Terms. If you do not agree, please do
        not use the Service.
      </p>

      <h2>1. About SVAP</h2>
      <p>
        SVAP is a peer-to-peer platform that connects buyers and sellers of
        pre-loved items in Pakistan. SVAP is not a party to any transaction
        between users. We provide the platform; you provide the trust.
      </p>

      <h2>2. Eligibility</h2>
      <p>
        You must be at least 18 years old to use SVAP. By using the Service,
        you represent and warrant that you are 18 or older and have the legal
        capacity to enter into these Terms.
      </p>

      <h2>3. Account Registration</h2>
      <ul>
        <li>
          You must create an account to list items or send swap requests.
        </li>
        <li>
          You are responsible for maintaining the confidentiality of your
          account and password.
        </li>
        <li>
          You must notify us immediately of any unauthorized use of your
          account.
        </li>
        <li>
          You may not create multiple accounts or impersonate others.
        </li>
      </ul>

      <h2>4. User Responsibilities</h2>
      <p>As a user of SVAP, you agree to:</p>
      <ul>
        <li>Provide accurate and truthful information in your listings.</li>
        <li>Only list items you own or have permission to sell.</li>
        <li>Meet buyers and sellers in public, safe places.</li>
        <li>Complete transactions in good faith.</li>
        <li>Respect other users and follow our community guidelines.</li>
        <li>Not use SVAP for illegal purposes or to sell prohibited items.</li>
      </ul>

      <h2>5. Prohibited Items</h2>
      <p>You may NOT list or sell:</p>
      <ul>
        <li>Illegal drugs, alcohol, or tobacco products.</li>
        <li>Weapons, ammunition, or explosives.</li>
        <li>Stolen goods or items without clear ownership.</li>
        <li>Counterfeit or replica branded items.</li>
        <li>Live animals or plants.</li>
        <li>Hazardous materials or chemicals.</li>
        <li>Adult content or sexually explicit items.</li>
        <li>Items requiring a license (e.g., prescription medications).</li>
      </ul>

      <h2>6. Fees and Payments</h2>
      <p>
        SVAP is completely free to use. We do not charge listing fees,
        transaction fees, or subscription fees. All payments between buyers and
        sellers are handled directly between the parties. SVAP is not
        responsible for any payment disputes.
      </p>

      <h2>7. Intellectual Property</h2>
      <p>
        The SVAP name, logo, and design are our property. You may not use,
        copy, or modify them without our permission. Content you post remains
        yours, but you grant us a license to display it on the Service.
      </p>

      <div className="fp-highlight">
        <p style={{ margin: 0, fontSize: "0.82rem" }}>
          <strong>Important:</strong> SVAP is a classified listing platform,
          not an escrow service. All transactions are peer-to-peer. We strongly
          recommend meeting in public places and following our{" "}
          <a href="/safety-tips">Safety Tips</a>.
        </p>
      </div>

      <h2>8. Disclaimers</h2>
      <p>
        THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. WE DO
        NOT ENDORSE OR VERIFY USER LISTINGS, AND WE ARE NOT RESPONSIBLE FOR THE
        ACCURACY, LEGALITY, OR QUALITY OF ITEMS LISTED. WE DO NOT MEDIATE
        DISPUTES BETWEEN USERS.
      </p>

      <h2>9. Limitation of Liability</h2>
      <p>
        TO THE MAXIMUM EXTENT PERMITTED BY LAW, SVAP SHALL NOT BE LIABLE FOR ANY
        INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES, OR ANY LOSS OF
        DATA, PROFITS, OR ITEMS. OUR TOTAL LIABILITY SHALL NOT EXCEED THE
        AMOUNT YOU PAID TO US (WHICH IS ZERO, SINCE SVAP IS FREE).
      </p>

      <h2>10. Indemnification</h2>
      <p>
        You agree to indemnify and hold harmless SVAP from any claims, damages,
        or expenses arising from your use of the Service or violation of these
        Terms.
      </p>

      <h2>11. Termination</h2>
      <p>
        We may suspend or terminate your account at any time, with or without
        cause, with or without notice. You may delete your account at any time
        through Settings → Account → Delete Account.
      </p>

      <h2>12. Governing Law</h2>
      <p>
        These Terms are governed by the laws of Pakistan. Any disputes shall be
        resolved in the courts of Karachi, Pakistan.
      </p>

      <h2>13. Changes to These Terms</h2>
      <p>
        We may update these Terms from time to time. We will notify you of
        significant changes via email or in-app notification. Your continued
        use of the Service after changes constitutes acceptance.
      </p>

      <h2>14. Contact Us</h2>
      <p>
        Questions about these Terms? Contact us at{" "}
        <a href="mailto:legal@svap.app">legal@svap.app</a>.
      </p>
    </FooterPageLayout>
  );
};

export default TermsOfService;
