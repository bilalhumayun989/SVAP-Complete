const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send OTP email to user
 * @param {string} toEmail
 * @param {string} otp
 */
const sendOtpEmail = async (toEmail, otp) => {
  const mailOptions = {
    from: `"SVAP" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Your SVAP Verification Code',
    html: `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #0a0a0a; border-radius: 16px; overflow: hidden; border: 1px solid #222;">
        
        <!-- Header -->
        <div style="background: #E45821; padding: 28px 32px; text-align: center;">
          <h1 style="color: #fff; margin: 0; font-size: 1.8rem; font-weight: 800; letter-spacing: -0.02em;">SVAP</h1>
          <p style="color: rgba(255,255,255,0.85); margin: 4px 0 0; font-size: 0.85rem;">SwapZone Verification</p>
        </div>

        <!-- Body -->
        <div style="padding: 36px 32px;">
          <p style="color: #f5f5f5; font-size: 1rem; margin: 0 0 8px; font-weight: 600;">Verify your email address</p>
          <p style="color: rgba(255,255,255,0.55); font-size: 0.88rem; margin: 0 0 32px; line-height: 1.6;">
            Use the code below to complete your SVAP account registration. This code expires in <strong style="color:#E45821;">10 minutes</strong>.
          </p>

          <!-- OTP Box -->
          <div style="background: #161616; border: 1px solid #2a2a2a; border-radius: 12px; padding: 28px; text-align: center; margin-bottom: 32px;">
            <p style="color: rgba(255,255,255,0.4); font-size: 0.72rem; letter-spacing: 0.12em; text-transform: uppercase; margin: 0 0 12px;">Verification Code</p>
            <div style="font-size: 2.8rem; font-weight: 800; letter-spacing: 0.22em; color: #E45821; line-height: 1;">${otp}</div>
          </div>

          <p style="color: rgba(255,255,255,0.35); font-size: 0.78rem; margin: 0; line-height: 1.6;">
            If you did not request this, please ignore this email. Do not share this code with anyone.
          </p>
        </div>

        <!-- Footer -->
        <div style="padding: 16px 32px; border-top: 1px solid #1a1a1a; text-align: center;">
          <p style="color: rgba(255,255,255,0.2); font-size: 0.72rem; margin: 0;">© 2025 SVAP · SwapZone Pakistan</p>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendOtpEmail };
