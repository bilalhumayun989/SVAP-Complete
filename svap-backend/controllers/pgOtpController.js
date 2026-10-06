const { supabase } = require('../config/supabase');
const profiles = require('./pgProfileController');
const disposableDomains = require('disposable-email-domains');

const extraDisposableDomains = new Set([
  'tempmail.com', 'temp-mail.com', 'throwaway.email', 'throwawaymail.com', 'trashmail.com',
  'fakeinbox.com', 'yopmail.com', 'sharklasers.com', 'grr.la', 'guerrillamailblock.com',
  'spam4.me', 'emailondeck.com', 'tempinbox.com', 'discard.email', 'discardmail.com',
  'spambox.us', 'tempr.email', 'getairmail.com', 'moakt.com', 'mohmal.com', 'mytemp.email',
  'tempsky.com', 'mintemail.com', 'momentics.ru',
]);

function validEmail(email) {
  const domain = email.split('@')[1]?.toLowerCase();
  return domain && !disposableDomains.includes(domain) && !extraDisposableDomains.has(domain);
}

exports.sendOtp = async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  if (!email) return res.status(400).json({ error: 'Email is required' });
  if (!validEmail(email)) return res.status(400).json({ error: 'Please use a valid, non-temporary email address.' });
  try {
    const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
    if (error) throw error;
    res.json({ message: 'OTP sent. Please check your inbox and spam folder.' });
  } catch (error) {
    console.error('[pg send otp]', error.message);
    res.status(500).json({ error: 'Could not send verification email' });
  }
};

exports.verifyOtp = async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const token = String(req.body?.otp || '').trim();
  if (!email || !token) return res.status(400).json({ error: 'Email and OTP are required' });
  try {
    const { data, error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
    if (error || !data?.user || !data?.session) {
      return res.status(400).json({ error: error?.message || 'Invalid or expired OTP' });
    }
    const profile = await profiles.ensureProfile(
      data.user.id, data.user.email,
      data.user.user_metadata?.full_name || data.user.user_metadata?.name,
      data.user.user_metadata?.avatar_url || data.user.user_metadata?.picture
    );
    res.json({ message: 'OTP verified successfully', session: data.session, user: data.user, profile });
  } catch (error) {
    console.error('[pg verify otp]', error.message);
    res.status(500).json({ error: 'Could not verify OTP' });
  }
};
