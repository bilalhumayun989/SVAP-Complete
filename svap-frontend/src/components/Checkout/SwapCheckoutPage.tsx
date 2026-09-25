import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FiArrowLeft, FiCheck, FiAlertCircle, FiCopy, FiUpload, FiX, FiUser, FiPhone, FiMapPin, FiHome } from 'react-icons/fi';
import { api } from '../../services/api';
import { supabase } from '../../services/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────
interface SwapInfo {
  id: string;
  offered_product_id: string | null;
  requested_product_id: string;
  from_user_id: string;
  to_user_id: string;
  premium_amount: number | null;
  offered: { title: string; image_urls: string[] } | null;
  requested: { title: string; image_urls: string[] } | null;
}

interface FormData {
  fullName: string;
  phone: string;
  city: string;
  area: string;
  streetAddress: string;
  termsAccepted: boolean;
}

type FormErrors = Partial<Record<keyof FormData | 'paymentScreenshot', string>>;

// ─── Meezan Bank Details (static) ─────────────────────────────────────────────
const BANK_DETAILS = {
  bankName: 'Meezan Bank',
  accountTitle: 'SVAP Pvt. Ltd.',
  accountNumber: '0265-0105876956',
  iban: 'PK57MEZN0002650105876956',
  deliveryFee: 500,
};

const WALLET_DETAILS = {
  easypaisa: {
    name: 'EasyPaisa',
    accountTitle: 'Muhammad Noorkhan Mir',
    accountNumber: '033208416',
  },
  jazzcash: {
    name: 'JazzCash',
    accountTitle: 'Noorkhan Noor',
    accountNumber: '033208416',
  },
};

// ─── Main Component ────────────────────────────────────────────────────────────
const SwapCheckoutPage = () => {
  const { swapRequestId: paramId } = useParams<{ swapRequestId: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  // swapRequestId can come from URL param OR from location.state (legacy navigation)
  const stateData = location.state as { swapRequestId?: string; entrySource?: string } | null;
  const swapRequestId = paramId || stateData?.swapRequestId;

  const [swapInfo, setSwapInfo] = useState<SwapInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<FormData>({
    fullName: '',
    phone: '',
    city: '',
    area: '',
    streetAddress: '',
    termsAccepted: false,
  });
  const [errors, setErrors] = useState<FormErrors>({});

  // ── Load user defaults ──────────────────────────────────────────────────────
  useEffect(() => {
    const stored = localStorage.getItem('sz_user');
    if (stored) {
      try {
        const user = JSON.parse(stored);
        setForm(prev => ({
          ...prev,
          fullName: user.name || '',
          phone: user.phone || '',
          city: user.city || '',
        }));
      } catch { /* ignore */ }
    }
  }, []);

  // ── Load swap request info ──────────────────────────────────────────────────
  useEffect(() => {
    const loadSwap = async () => {
      if (!swapRequestId) { setLoading(false); return; }
      const stored = localStorage.getItem('sz_user');
      const userId = stored ? JSON.parse(stored).id : null;
      if (!userId) { setLoading(false); return; }

      try {
        const res = await api.getSwapRequestsByUser(userId);
        const list: SwapInfo[] = res.data || [];
        const found = list.find((r) => r.id === swapRequestId);
        
        // Check if swap request is unavailable (already swapped)
        if (found && (found as any).status === 'unavailable') {
          navigate('/requests', { replace: true });
          return;
        }
        
        setSwapInfo(found || null);
      } catch (e) {
        console.error('[SwapCheckoutPage] load swap', e);
      } finally {
        setLoading(false);
      }
    };
    loadSwap();
  }, [swapRequestId, navigate]);

  // ── Also check if this order already placed ────────────────────────────────
  useEffect(() => {
    const checkExisting = async () => {
      if (!swapRequestId) return;
      const stored = localStorage.getItem('sz_user');
      const userId = stored ? JSON.parse(stored).id : null;
      if (!userId) return;
      try {
        const orders = await api.getOrders(userId);
        if (Array.isArray(orders)) {
          const exists = orders.find(
            (o: any) => 
              o.swap_request_id === swapRequestId && 
              o.from_user_id === userId &&
              !o.is_checkout_pending && 
              !String(o.id).startsWith('checkout-')
          );
          if (exists) {
            // Already submitted — go straight to confirmation
            navigate('/orders', { replace: true });
          }
        }
      } catch { /* ignore */ }
    };
    checkExisting();
  }, [swapRequestId, navigate]);

  // ── Validation ─────────────────────────────────────────────────────────────
  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!form.fullName.trim()) e.fullName = 'Full name is required';
    if (!form.phone.trim()) e.phone = 'Phone number is required';
    else if (!/^(\+92|0)?[0-9]{10,11}$/.test(form.phone.replace(/\s/g, '')))
      e.phone = 'Enter a valid Pakistani mobile number';
    if (!form.city.trim()) e.city = 'City is required';
    if (!form.streetAddress.trim()) e.streetAddress = 'Street address is required';
    if (!paymentScreenshot) e.paymentScreenshot = 'Please upload payment screenshot';
    if (!form.termsAccepted) e.termsAccepted = 'Please accept the terms to continue';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Screenshot Upload Handler ──────────────────────────────────────────────
  const handleScreenshotSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setErrors(prev => ({ ...prev, paymentScreenshot: 'Please select an image file' }));
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, paymentScreenshot: 'Image size must be less than 5MB' }));
      return;
    }

    setPaymentScreenshot(file);
    setErrors(prev => ({ ...prev, paymentScreenshot: undefined }));

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setScreenshotPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveScreenshot = () => {
    setPaymentScreenshot(null);
    setScreenshotPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validate()) return;
    if (!swapRequestId) return;
    const stored = localStorage.getItem('sz_user');
    const userId = stored ? JSON.parse(stored).id : null;
    if (!userId) { navigate('/login'); return; }

    setSubmitting(true);
    setUploadingScreenshot(true);
    
    try {
      // Step 1: Upload payment screenshot to Supabase Storage
      let screenshotUrl = '';
      if (paymentScreenshot) {
        const fileExt = paymentScreenshot.name.split('.').pop();
        const fileName = `${userId}_${Date.now()}.${fileExt}`;
        const filePath = `payment-screenshots/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('payment-screenshots')
          .upload(filePath, paymentScreenshot, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          throw new Error(`Screenshot upload failed: ${uploadError.message}`);
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('payment-screenshots')
          .getPublicUrl(filePath);

        screenshotUrl = urlData.publicUrl;
      }

      setUploadingScreenshot(false);

      // Step 2: Create order with screenshot URL
      // Combine area + street into delivery_address
      const fullAddress = form.area.trim()
        ? `${form.area.trim()}, ${form.streetAddress.trim()}`
        : form.streetAddress.trim();

      // Determine the other party's user ID
      let toUserId = userId;
      if (swapInfo) {
        toUserId = swapInfo.from_user_id === userId
          ? swapInfo.to_user_id
          : swapInfo.from_user_id;
      }

      const orderPayload = {
        swap_request_id: swapRequestId,
        from_user_id: userId,
        to_user_id: toUserId,
        delivery_name: form.fullName.trim(),
        delivery_phone: form.phone.trim(),
        delivery_address: fullAddress,
        delivery_city: form.city.trim(),
        payment_method: 'Bank Transfer',
        shipping_cost: BANK_DETAILS.deliveryFee,
        discount: 0,
        total: BANK_DETAILS.deliveryFee,
        transaction_ref: screenshotUrl, // Save screenshot URL here
        status: 'pending_verification',
      };

      const res = await api.createOrder(orderPayload);
      if (res.error) throw new Error(res.error);

      setSubmitted(true);
    } catch (err: any) {
      console.error('[SwapCheckoutPage] submit error:', err);
      alert(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
      setUploadingScreenshot(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const setField = (key: keyof FormData, value: string | boolean) => {
    setForm(prev => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors(prev => { const e = { ...prev }; delete e[key]; return e; });
  };

  // ─── LOADING ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="scp-page">
        <div className="scp-container">
          <div className="scp-loading">
            <div className="scp-spinner" />
            <p>Loading checkout…</p>
          </div>
        </div>
        <style>{pageStyles}</style>
      </div>
    );
  }

  // ─── NO SWAP ID ─────────────────────────────────────────────────────────────
  if (!swapRequestId) {
    return (
      <div className="scp-page">
        <div className="scp-container">
          <div className="scp-empty">
            <FiAlertCircle size={40} />
            <p>No svap request found.</p>
            <button className="scp-back-btn" onClick={() => navigate('/requests')}>Go to Requests</button>
          </div>
        </div>
        <style>{pageStyles}</style>
      </div>
    );
  }

  // ─── SUCCESS SCREEN ──────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="scp-page">
        <div className="scp-container">
          <div className="scp-success">
            <div className="scp-success-icon">
              <FiCheck size={40} />
            </div>
            <h2 className="scp-success-title">Order Placed!</h2>
            <p className="scp-success-sub">
              Payment Pending Verification
            </p>
            <div className="scp-success-card">
              <div className="scp-success-row">
                <span>Status</span>
                <span className="scp-badge-pv">Pending Verification</span>
              </div>
              <div className="scp-success-row">
                <span>Delivery Fee</span>
                <span>PKR {BANK_DETAILS.deliveryFee.toLocaleString()}</span>
              </div>
              {swapInfo?.premium_amount && swapInfo.premium_amount > 0 && (
                <div className="scp-success-row">
                  <span>{!swapInfo.offered_product_id ? 'Cash Offer' : 'Cash Boost'}</span>
                  <span className="scp-boost-val">PKR {swapInfo.premium_amount.toLocaleString()} {!swapInfo.offered_product_id && '(cash only)'}</span>
                </div>
              )}
            </div>
            <p className="scp-success-note">
              Our team will verify your payment and confirm your order shortly. You'll see the status update in your Orders tab.
            </p>
            <div className="scp-success-actions">
              <button className="scp-btn-primary" onClick={() => navigate('/orders')}>
                View My Orders
              </button>
              <button className="scp-btn-ghost" onClick={() => navigate('/requests')}>
                Back to Requests
              </button>
            </div>
          </div>
        </div>
        <style>{pageStyles}</style>
      </div>
    );
  }

  // ─── MAIN CHECKOUT FORM ──────────────────────────────────────────────────────
  const isSender = swapInfo?.from_user_id === (
    (() => { try { return JSON.parse(localStorage.getItem('sz_user') || '{}').id; } catch { return null; } })()
  );
  const isCashOnlyOffer = !swapInfo?.offered_product_id || !swapInfo.offered;
  const myItem = isCashOnlyOffer ? (isSender ? null : swapInfo?.requested) : (isSender ? swapInfo?.offered : swapInfo?.requested);
  const theirItem = isCashOnlyOffer ? (isSender ? swapInfo?.requested : null) : (isSender ? swapInfo?.requested : swapInfo?.offered);

  return (
    <div className="scp-page">
      <div className="scp-container">

        {/* Header */}
        <div className="scp-header">
          <button className="scp-back" onClick={() => navigate(-1)}>
            <FiArrowLeft size={16} /> Back
          </button>
          <h1 className="scp-title">Svap Checkout</h1>
          <p className="scp-subtitle">Complete your delivery details to finalize the svap</p>
        </div>

        <div className="scp-content">

          {/* LEFT — Form */}
          <div className="scp-left">

            {/* Swap Summary Card */}
            {swapInfo && (
              <div className="scp-swap-summary">
                <p className="scp-section-label">Your Svap</p>
                <div className="scp-swap-row">
                  <div className="scp-swap-item">
                    {isCashOnlyOffer && isSender ? (
                      <div className="scp-cash-offer-box">PKR</div>
                    ) : (
                      <img
                        src={myItem?.image_urls?.[0] || '/1.png'}
                        alt={myItem?.title || 'Your item'}
                        className="scp-swap-img"
                      />
                    )}
                    <div>
                      <span className="scp-swap-tag">You Give</span>
                      <p className={`scp-swap-name ${isCashOnlyOffer && isSender ? 'scp-cash-offer-name' : ''}`}>{isCashOnlyOffer && isSender ? `Cash Offer · PKR ${swapInfo?.premium_amount?.toLocaleString() || 0}` : (myItem?.title || '—')}</p>
                    </div>
                  </div>
                  <div className="scp-swap-arrow">⇄</div>
                  <div className="scp-swap-item scp-swap-item--right">
                    {isCashOnlyOffer && !isSender ? (
                      <div className="scp-cash-offer-box">PKR</div>
                    ) : (
                      <img
                        src={theirItem?.image_urls?.[0] || '/2.png'}
                        alt={theirItem?.title || 'Their item'}
                        className="scp-swap-img"
                      />
                    )}
                    <div>
                      <span className="scp-swap-tag">You Receive</span>
                      <p className={`scp-swap-name ${isCashOnlyOffer && !isSender ? 'scp-cash-offer-name' : ''}`}>{isCashOnlyOffer && !isSender ? `Cash Offer · PKR ${swapInfo?.premium_amount?.toLocaleString() || 0}` : (theirItem?.title || '—')}</p>
                    </div>
                  </div>
                </div>
                {Boolean(swapInfo.premium_amount && swapInfo.premium_amount > 0) && (
                  <div className="scp-boost-banner">
                    {isCashOnlyOffer ? 'Cash Offer' : 'Cash Boost'}: <strong>PKR {swapInfo.premium_amount?.toLocaleString()}</strong>
                    <span>{isCashOnlyOffer ? ' Cash offer amount' : 'Rider will collect this on delivery'}</span>
                  </div>
                )}
              </div>
            )}

            {/* Delivery Details Form */}
            <div className="scp-card">
              <h2 className="scp-card-title">
                <span className="scp-step-badge">1</span>
                Delivery Details
              </h2>

              <div className="scp-form-grid">
                <div className={`scp-field ${errors.fullName ? 'scp-field--error' : ''}`}>
                  <label htmlFor="fullName">Full Name *</label>
                  <div className="scp-input-wrap">
                    <FiUser className="scp-input-icon" />
                    <input id="fullName" type="text" value={form.fullName} onChange={e => setField('fullName', e.target.value)} placeholder="Enter your full name" />
                  </div>
                  {errors.fullName && <span className="scp-err">{errors.fullName}</span>}
                </div>

                <div className={`scp-field ${errors.phone ? 'scp-field--error' : ''}`}>
                  <label htmlFor="phone">Phone Number *</label>
                  <div className="scp-input-wrap">
                    <FiPhone className="scp-input-icon" />
                    <input id="phone" type="tel" value={form.phone} onChange={e => setField('phone', e.target.value)} placeholder="03XX XXXXXXX" />
                  </div>
                  {errors.phone && <span className="scp-err">{errors.phone}</span>}
                </div>

                <div className={`scp-field ${errors.city ? 'scp-field--error' : ''}`}>
                  <label htmlFor="city">City *</label>
                  <div className="scp-input-wrap">
                    <FiMapPin className="scp-input-icon" />
                    <input id="city" type="text" value={form.city} onChange={e => setField('city', e.target.value)} placeholder="Karachi, Lahore, etc." />
                  </div>
                  {errors.city && <span className="scp-err">{errors.city}</span>}
                </div>

                <div className="scp-field">
                  <label htmlFor="area">Area / Locality</label>
                  <div className="scp-input-wrap">
                    <FiMapPin className="scp-input-icon" />
                    <input id="area" type="text" value={form.area} onChange={e => setField('area', e.target.value)} placeholder="e.g. DHA Phase 5, Gulshan-e-Iqbal" />
                  </div>
                </div>

                <div className={`scp-field scp-field--full ${errors.streetAddress ? 'scp-field--error' : ''}`}>
                  <label htmlFor="streetAddress">Street Address *</label>
                  <div className="scp-input-wrap">
                    <FiHome className="scp-input-icon" />
                    <input id="streetAddress" type="text" value={form.streetAddress} onChange={e => setField('streetAddress', e.target.value)} placeholder="House/flat number, street name" />
                  </div>
                  {errors.streetAddress && <span className="scp-err">{errors.streetAddress}</span>}
                </div>
              </div>
            </div>

            {/* Bank Transfer Details */}
            <div className="scp-card scp-card--bank">
              <h2 className="scp-card-title">
                <span className="scp-step-badge">2</span>
                Transfer Delivery Fee
              </h2>

              <div className="scp-fee-box">
                <span className="scp-fee-label">Amount to Transfer</span>
                <span className="scp-fee-amount">PKR {BANK_DETAILS.deliveryFee.toLocaleString()}</span>
              </div>

              <p className="scp-bank-instruction">
                Transfer <strong>PKR {BANK_DETAILS.deliveryFee.toLocaleString()}</strong> to the following bank account and upload your payment screenshot below.
              </p>

              <div className="scp-bank-details">
                <BankRow label="Bank" value={BANK_DETAILS.bankName} />
                <BankRow
                  label="Account Title"
                  value={BANK_DETAILS.accountTitle}
                  copyKey="title"
                  copied={copied}
                  onCopy={copyToClipboard}
                />
                <BankRow
                  label="Account Number"
                  value={BANK_DETAILS.accountNumber}
                  copyKey="account"
                  copied={copied}
                  onCopy={copyToClipboard}
                />
                <BankRow
                  label="IBAN"
                  value={BANK_DETAILS.iban}
                  copyKey="iban"
                  copied={copied}
                  onCopy={copyToClipboard}
                />
              </div>

              <div className="scp-wallet-details">
                {[WALLET_DETAILS.easypaisa, WALLET_DETAILS.jazzcash].map((wallet) => (
                  <div className="scp-wallet-card" key={wallet.name}>
                    <p className="scp-wallet-name">{wallet.name}</p>
                    <BankRow
                      label="Account Name"
                      value={wallet.accountTitle}
                      copyKey={`${wallet.name}-title`}
                      copied={copied}
                      onCopy={copyToClipboard}
                    />
                    <BankRow
                      label="Number"
                      value={wallet.accountNumber}
                      copyKey={`${wallet.name}-number`}
                      copied={copied}
                      onCopy={copyToClipboard}
                    />
                  </div>
                ))}
              </div>

              {swapInfo?.premium_amount && swapInfo.premium_amount > 0 && (
                <div className="scp-boost-note">
                  <p>
                    {!isCashOnlyOffer ? <>Cash Boost of <strong>PKR {swapInfo.premium_amount.toLocaleString()}</strong> is NOT included in the bank transfer. The rider will collect it in cash at the time of delivery.</> : <>Cash offer of <strong>PKR {swapInfo.premium_amount.toLocaleString()}</strong> is separate from the delivery fee.</>}
                  </p>
                </div>
              )}

              {/* Payment Screenshot Upload */}
              <div className={`scp-field scp-field--upload ${errors.paymentScreenshot ? 'scp-field--error' : ''}`}>
                <label htmlFor="paymentScreenshot">Payment Screenshot Upload *</label>
                
                {!screenshotPreview ? (
                  <div className="scp-upload-box" onClick={() => fileInputRef.current?.click()}>
                    <FiUpload size={32} />
                    <p>Click to upload payment screenshot</p>
                    <span>PNG, JPG, JPEG (Max 5MB)</span>
                  </div>
                ) : (
                  <div className="scp-preview-box">
                    <img src={screenshotPreview} alt="Payment Screenshot" className="scp-preview-img" />
                    <button 
                      type="button" 
                      className="scp-remove-btn" 
                      onClick={handleRemoveScreenshot}
                      aria-label="Remove screenshot"
                    >
                      <FiX size={18} />
                    </button>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  id="paymentScreenshot"
                  type="file"
                  accept="image/*"
                  onChange={handleScreenshotSelect}
                  style={{ display: 'none' }}
                />
                
                {errors.paymentScreenshot && <span className="scp-err">{errors.paymentScreenshot}</span>}
              </div>
            </div>

            {/* Terms & Submit */}
            <div className="scp-card">
              <h2 className="scp-card-title">
                <span className="scp-step-badge">3</span>
                Confirm & Submit
              </h2>

              <label className={`scp-terms ${errors.termsAccepted ? 'scp-terms--error' : ''}`}>
                <input
                  type="checkbox"
                  checked={form.termsAccepted}
                  onChange={e => setField('termsAccepted', e.target.checked)}
                  className="scp-checkbox"
                />
                <span>
                  I confirm that I have transferred PKR {BANK_DETAILS.deliveryFee.toLocaleString()} to the above account, and I agree to SVAP's{' '}
                  <button
                    type="button"
                    className="scp-terms-link"
                    onClick={() => navigate('/terms-of-service')}
                  >
                    Terms of Service
                  </button>.
                </span>
              </label>
              {errors.termsAccepted && <span className="scp-err" style={{ marginTop: 6, display: 'block' }}>{errors.termsAccepted}</span>}

              <button
                className="scp-submit-btn"
                onClick={handleSubmit}
                disabled={submitting || uploadingScreenshot}
              >
                {uploadingScreenshot ? (
                  <><div className="scp-btn-spinner" /> Uploading Screenshot…</>
                ) : submitting ? (
                  <><div className="scp-btn-spinner" /> Submitting Order…</>
                ) : (
                  <><FiCheck size={18} /> Submit Order</>
                )}
              </button>

              <p className="scp-submit-note">
                Your order will be reviewed within 48 hours. You'll be notified once payment is verified.
              </p>
            </div>
          </div>

          {/* RIGHT — Summary Sidebar */}
          <div className="scp-right">
            <div className="scp-summary-card">
              <h3 className="scp-summary-title">Order Summary</h3>
              <div className="scp-summary-rows">
                <div className="scp-summary-row">
                  <span>Delivery Fee</span>
                  <span>PKR {BANK_DETAILS.deliveryFee.toLocaleString()}</span>
                </div>
                {swapInfo?.premium_amount && swapInfo.premium_amount > 0 && (
                  <div className="scp-summary-row scp-summary-row--boost">
                    <span>Cash Boost <small>(rider collects)</small></span>
                    <span>PKR {swapInfo.premium_amount.toLocaleString()}</span>
                  </div>
                )}
                <div className="scp-summary-divider" />
                <div className="scp-summary-row scp-summary-row--total">
                  <span>Bank Transfer</span>
                  <span>PKR {BANK_DETAILS.deliveryFee.toLocaleString()}</span>
                </div>
              </div>

              <div className="scp-summary-status">
                <span className="scp-badge-pv-sm">Pending Verification</span>
                <p>after submit</p>
              </div>
            </div>

            <div className="scp-quick-bank">
              <p className="scp-quick-title">Quick Reference</p>
              <p className="scp-quick-bank-name">{BANK_DETAILS.bankName}</p>
              <p className="scp-quick-acc">{BANK_DETAILS.accountNumber}</p>
              <p className="scp-quick-amount">PKR {BANK_DETAILS.deliveryFee.toLocaleString()}</p>
            </div>
          </div>

        </div>{/* /scp-content */}
      </div>
      <style>{pageStyles}</style>
    </div>
  );
};

// ─── BankRow Helper ────────────────────────────────────────────────────────────
const BankRow = ({
  label,
  value,
  copyKey,
  copied,
  onCopy,
}: {
  label: string;
  value: string;
  copyKey?: string;
  copied?: string | null;
  onCopy?: (text: string, key: string) => void;
}) => (
  <div className="scp-bank-row">
    <span className="scp-bank-label">{label}</span>
    <div className="scp-bank-val-wrap">
      <span className="scp-bank-val">{value}</span>
      {copyKey && onCopy && (
        <button
          type="button"
          className={`scp-copy-btn ${copied === copyKey ? 'scp-copy-btn--done' : ''}`}
          onClick={() => onCopy(value, copyKey)}
          aria-label={`Copy ${label}`}
        >
          {copied === copyKey ? <FiCheck size={13} /> : <FiCopy size={13} />}
          {copied === copyKey ? 'Copied!' : 'Copy'}
        </button>
      )}
    </div>
  </div>
);

// ─── Styles ────────────────────────────────────────────────────────────────────
const pageStyles = `
  .scp-page {
    min-height: 100vh;
    background: var(--bg);
    padding: 24px 24px 100px;
    font-family: 'Poppins', sans-serif;
    color: var(--text-dark);
    box-sizing: border-box;
  }
  .scp-container {
    max-width: 1100px;
    margin: 0 auto;
  }

  /* Header */
  .scp-header { margin-bottom: 32px; }
  .scp-back {
    display: inline-flex; align-items: center; gap: 8px;
    background: none; border: 1px solid var(--border);
    border-radius: 8px; color: var(--text-mid); cursor: pointer;
    font-size: 0.875rem; font-weight: 500; padding: 8px 14px;
    margin-bottom: 16px; transition: all 0.2s; font-family: inherit;
  }
  .scp-back:hover { background: var(--bg-section); color: #E45821; border-color: #E45821; }
  .scp-title {
    font-size: clamp(1.6rem, 3vw, 2.2rem); font-weight: 800;
    color: var(--text-dark); margin: 0 0 6px; letter-spacing: -0.02em;
  }
  .scp-subtitle { font-size: 0.9rem; color: var(--text-mid); margin: 0; }

  /* Layout */
  .scp-content {
    display: grid;
    grid-template-columns: 1fr 300px;
    gap: 32px;
    align-items: start;
  }
  .scp-left { display: flex; flex-direction: column; gap: 20px; }
  .scp-right { position: sticky; top: 90px; display: flex; flex-direction: column; gap: 16px; }

  /* Cards */
  .scp-card {
    background: var(--card-bg);
    border: 1px solid var(--border);
    border-radius: 18px;
    padding: 24px;
  }
  .scp-card--bank {
    border-color: rgba(228,88,33,0.2);
    background: linear-gradient(135deg, var(--card-bg) 0%, rgba(228,88,33,0.02) 100%);
  }
  html[data-theme='dark'] .scp-card { background: #1a1a1a; border-color: #2a2a2a; }
  html[data-theme='dark'] .scp-card--bank { background: #1a1a1a; border-color: rgba(228,88,33,0.2); }

  .scp-card-title {
    display: flex; align-items: center; gap: 12px;
    font-size: 1rem; font-weight: 700; color: var(--text-dark);
    margin: 0 0 20px;
  }
  .scp-step-badge {
    width: 28px; height: 28px; border-radius: 50%;
    background: #E45821; color: #fff;
    display: inline-flex; align-items: center; justify-content: center;
    font-size: 0.75rem; font-weight: 800; flex-shrink: 0;
  }
  .scp-section-label {
    font-size: 0.7rem; font-weight: 700; letter-spacing: 0.1em;
    text-transform: uppercase; color: var(--text-muted); margin: 0 0 14px;
  }

  /* Swap Summary */
  .scp-swap-summary {
    background: var(--card-bg);
    border: 1px solid rgba(165,194,111,0.3);
    border-radius: 18px;
    padding: 20px;
  }
  html[data-theme='dark'] .scp-swap-summary { background: #1a1a1a; border-color: #2a2a2a; }
  .scp-swap-row {
    display: flex; align-items: center; gap: 12px;
    flex-wrap: wrap;
  }
  .scp-swap-item {
    flex: 1; display: flex; align-items: center; gap: 12px; min-width: 120px;
  }
  .scp-swap-item--right { flex-direction: row-reverse; text-align: right; }
  .scp-swap-item--right > div { align-items: flex-end; display: flex; flex-direction: column; }
  .scp-swap-img {
    width: 56px; height: 56px; border-radius: 12px; object-fit: cover;
    border: 1px solid rgba(165,194,111,0.3); flex-shrink: 0;
  }
  .scp-cash-offer-box {
    width: 56px; height: 56px; border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    background: rgba(228,88,33,0.12);
    border: 1px solid rgba(228,88,33,0.35);
    font-size: 1.35rem; line-height: 1; text-align: center; flex-shrink: 0;
  }
  .scp-swap-tag {
    display: block; font-size: 0.62rem; font-weight: 700;
    letter-spacing: 0.08em; text-transform: uppercase;
    color: var(--text-muted); margin-bottom: 3px;
  }
  .scp-swap-name {
    font-size: 0.84rem; font-weight: 700; color: var(--text-dark);
    margin: 0; line-height: 1.3; max-width: 140px;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .scp-cash-offer-name {
    max-width: 220px;
    white-space: normal;
    overflow: visible;
    text-overflow: clip;
    overflow-wrap: anywhere;
  }
  .scp-swap-arrow {
    font-size: 1.3rem; color: #E45821; flex-shrink: 0;
    width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
    background: rgba(228,88,33,0.1); border-radius: 50%;
    border: 1px solid rgba(228,88,33,0.25);
  }

  /* Cash Boost Banner */
  .scp-boost-banner {
    margin-top: 14px; padding: 10px 14px;
    background: rgba(228,88,33,0.07); border-radius: 10px;
    border: 1px dashed rgba(228,88,33,0.35);
    font-size: 0.8rem; color: var(--text-dark);
  }
  .scp-boost-banner strong { color: #E45821; }
  .scp-boost-banner span { color: var(--text-muted); }

  /* Form */
  .scp-form-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
  }
  .scp-field {
    display: flex; flex-direction: column; gap: 6px;
  }
  .scp-field--full { grid-column: 1 / -1; }
  .scp-field label {
    font-size: 0.82rem; font-weight: 600; color: var(--text-dark);
  }
  .scp-input-wrap {
    position: relative;
    display: flex;
    align-items: center;
  }
  .scp-input-icon {
    position: absolute;
    left: 12px;
    width: 14px;
    height: 14px;
    color: var(--text-muted);
    pointer-events: none;
  }
  .scp-field input {
    width: 100%; padding: 11px 14px 11px 36px; border: 1.5px solid var(--border);
    border-radius: 10px; font-size: 0.875rem;
    background: var(--bg); color: var(--text-dark);
    transition: border-color 0.2s; font-family: inherit; outline: none;
  }
  .scp-field input:focus { border-color: #E45821; }
  .scp-field--error input { border-color: #ef4444; }
  .scp-err {
    font-size: 0.72rem; color: #ef4444; font-weight: 500;
  }
  html[data-theme='dark'] .scp-field input { background: #111; border-color: #2a2a2a; color: #fff; }
  html[data-theme='dark'] .scp-field input:focus { border-color: #E45821; }

  /* Bank Details */
  .scp-fee-box {
    display: flex; justify-content: space-between; align-items: center;
    padding: 14px 18px; border-radius: 12px;
    background: rgba(228,88,33,0.08); border: 1px solid rgba(228,88,33,0.25);
    margin-bottom: 16px;
  }
  .scp-fee-label { font-size: 0.82rem; font-weight: 600; color: var(--text-mid); }
  .scp-fee-amount { font-size: 1.3rem; font-weight: 800; color: #E45821; }

  .scp-bank-instruction {
    font-size: 0.84rem; color: var(--text-mid); line-height: 1.6; margin: 0 0 16px;
  }

  .scp-bank-details {
    background: var(--bg-section); border-radius: 12px;
    border: 1px solid var(--border); overflow: hidden;
    margin-bottom: 16px;
  }
  html[data-theme='dark'] .scp-bank-details { background: #111; border-color: #2a2a2a; }
  .scp-wallet-details { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 16px; }
  .scp-wallet-card { background: var(--bg-section); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; }
  html[data-theme='dark'] .scp-wallet-card { background: #111; border-color: #2a2a2a; }
  .scp-wallet-name { margin: 0; padding: 10px 12px; color: #E45821; font-size: 0.78rem; font-weight: 800; border-bottom: 1px solid var(--border); }
  .scp-wallet-card .scp-bank-row { padding: 9px 12px; display: block; }
  .scp-wallet-card .scp-bank-label { display: block; margin-bottom: 4px; font-size: 0.62rem; }
  .scp-wallet-card .scp-bank-val-wrap { justify-content: space-between; gap: 5px; }
  .scp-wallet-card .scp-bank-val { font-size: 0.72rem; }
  .scp-bank-row {
    display: flex; justify-content: space-between; align-items: center;
    padding: 12px 16px; gap: 12px;
    border-bottom: 1px solid var(--border);
  }
  .scp-bank-row:last-child { border-bottom: none; }
  html[data-theme='dark'] .scp-bank-row { border-color: #2a2a2a; }
  .scp-bank-label {
    font-size: 0.75rem; font-weight: 600; color: var(--text-muted);
    text-transform: uppercase; letter-spacing: 0.05em; white-space: nowrap;
  }
  .scp-bank-val-wrap { display: flex; align-items: center; gap: 10px; min-width: 0; }
  .scp-bank-val {
    font-size: 0.88rem; font-weight: 700; color: var(--text-dark);
    word-break: break-all;
  }
  .scp-copy-btn {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 4px 10px; border-radius: 7px;
    font-size: 0.7rem; font-weight: 700; cursor: pointer;
    background: var(--bg); border: 1px solid var(--border);
    color: var(--text-muted); transition: all 0.15s; white-space: nowrap;
    font-family: inherit;
  }
  .scp-copy-btn:hover { border-color: #E45821; color: #E45821; background: rgba(228,88,33,0.05); }
  .scp-copy-btn--done { background: rgba(16,185,129,0.1); border-color: #10b981; color: #10b981; }
  html[data-theme='dark'] .scp-copy-btn { background: #1a1a1a; border-color: #3a3a3a; }

  .scp-boost-note {
    display: flex; gap: 10px; align-items: flex-start;
    padding: 12px 14px; border-radius: 10px;
    background: rgba(245,158,11,0.07); border: 1px solid rgba(245,158,11,0.25);
    margin-bottom: 16px;
  }
  .scp-boost-note span { font-size: 1rem; flex-shrink: 0; }
  .scp-boost-note p { margin: 0; font-size: 0.78rem; color: var(--text-mid); line-height: 1.5; }
  .scp-boost-note strong { color: var(--text-dark); }

  .scp-field--ref { margin-top: 4px; }

  /* Terms */
  .scp-terms {
    display: flex; gap: 12px; align-items: flex-start;
    cursor: pointer; padding: 14px; border-radius: 12px;
    border: 1.5px solid var(--border); background: var(--bg-section);
    transition: border-color 0.2s; margin-bottom: 16px;
    font-size: 0.82rem; color: var(--text-mid); line-height: 1.5;
  }
  .scp-terms--error { border-color: #ef4444; background: rgba(239,68,68,0.04); }
  .scp-terms:has(.scp-checkbox:checked) { border-color: rgba(165,194,111,0.5); }
  .scp-checkbox {
    margin-top: 2px; width: 18px; height: 18px;
    accent-color: #E45821; flex-shrink: 0; cursor: pointer;
  }
  .scp-terms-link {
    background: none; border: none; color: #E45821; font-weight: 700;
    cursor: pointer; font-size: inherit; font-family: inherit; padding: 0;
    text-decoration: underline;
  }
  html[data-theme='dark'] .scp-terms { background: #111; border-color: #2a2a2a; }

  /* Submit Button */
  .scp-submit-btn {
    width: 100%; padding: 16px 24px;
    background: #E45821; color: #fff; border: none;
    border-radius: 14px; font-size: 1rem; font-weight: 700;
    cursor: pointer; display: flex; align-items: center;
    justify-content: center; gap: 10px; transition: background 0.2s, transform 0.15s;
    font-family: inherit; letter-spacing: 0.01em;
  }
  .scp-submit-btn:hover:not(:disabled) { background: #c94d1c; transform: translateY(-1px); }
  .scp-submit-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
  .scp-btn-spinner {
    width: 18px; height: 18px;
    border: 2.5px solid rgba(255,255,255,0.3);
    border-top-color: #fff; border-radius: 50%;
    animation: scp-spin 0.7s linear infinite;
  }
  @keyframes scp-spin { to { transform: rotate(360deg); } }

  /* Screenshot Upload Styles */
  .scp-upload-box {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 10px; padding: 40px 20px;
    border: 2px dashed rgba(228, 88, 33, 0.3);
    border-radius: 14px;
    background: var(--bg-section);
    cursor: pointer;
    transition: all 0.2s;
  }
  .scp-upload-box:hover {
    border-color: #E45821;
    background: rgba(228, 88, 33, 0.05);
  }
  .scp-upload-box svg {
    color: #E45821;
    opacity: 0.7;
  }
  .scp-upload-box p {
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--text-dark);
    margin: 0;
  }
  .scp-upload-box span {
    font-size: 0.75rem;
    color: var(--text-muted);
  }
  html[data-theme='dark'] .scp-upload-box {
    background: #1a1a1a;
  }

  .scp-preview-box {
    position: relative;
    border-radius: 14px;
    overflow: hidden;
    border: 2px solid rgba(228, 88, 33, 0.3);
  }
  .scp-preview-img {
    width: 100%;
    height: 300px;
    object-fit: contain;
    background: var(--bg-section);
    display: block;
  }
  html[data-theme='dark'] .scp-preview-img {
    background: #111;
  }
  .scp-remove-btn {
    position: absolute;
    top: 12px;
    right: 12px;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.7);
    border: none;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
  }
  .scp-remove-btn:hover {
    background: #E45821;
    transform: scale(1.1);
  }

  .scp-submit-note {
    margin: 12px 0 0; font-size: 0.75rem; color: var(--text-muted);
    text-align: center; line-height: 1.5;
  }

  /* Right Sidebar */
  .scp-summary-card {
    background: var(--card-bg); border: 1px solid var(--border);
    border-radius: 16px; padding: 20px;
  }
  html[data-theme='dark'] .scp-summary-card { background: #1a1a1a; border-color: #2a2a2a; }
  .scp-summary-title {
    font-size: 0.95rem; font-weight: 700; color: var(--text-dark);
    margin: 0 0 16px;
  }
  .scp-summary-rows { display: flex; flex-direction: column; gap: 10px; }
  .scp-summary-row {
    display: flex; justify-content: space-between; align-items: flex-start;
    font-size: 0.84rem; color: var(--text-mid);
  }
  .scp-summary-row small { font-size: 0.7rem; color: var(--text-muted); margin-left: 4px; }
  .scp-summary-row--boost span:first-child { color: #f59e0b; }
  .scp-summary-row--boost span:last-child { color: #f59e0b; font-weight: 700; }
  .scp-summary-row--total { font-weight: 700; font-size: 0.95rem; color: var(--text-dark); }
  .scp-summary-divider { height: 1px; background: var(--border); margin: 4px 0; }
  .scp-summary-status {
    margin-top: 16px; padding-top: 14px; border-top: 1px solid var(--border);
    display: flex; flex-direction: column; align-items: center; gap: 6px;
  }

  .scp-badge-pv {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 5px 14px; border-radius: 999px;
    font-size: 0.72rem; font-weight: 700;
    background: rgba(245,158,11,0.12); color: #d97706;
    border: 1px solid rgba(245,158,11,0.3);
  }
  .scp-badge-pv-sm {
    display: inline-block; padding: 4px 12px; border-radius: 999px;
    font-size: 0.7rem; font-weight: 700;
    background: rgba(245,158,11,0.12); color: #d97706;
    border: 1px solid rgba(245,158,11,0.3);
  }
  .scp-summary-status p {
    margin: 0; font-size: 0.72rem; color: var(--text-muted);
  }

  .scp-quick-bank {
    background: rgba(228,88,33,0.06); border: 1px solid rgba(228,88,33,0.2);
    border-radius: 14px; padding: 16px; text-align: center;
  }
  .scp-quick-title {
    font-size: 0.68rem; font-weight: 700; letter-spacing: 0.1em;
    text-transform: uppercase; color: var(--text-muted); margin: 0 0 8px;
  }
  .scp-quick-bank-name { font-size: 0.82rem; font-weight: 700; color: var(--text-dark); margin: 0 0 4px; }
  .scp-quick-acc { font-size: 0.88rem; font-weight: 700; color: #E45821; margin: 0 0 6px; letter-spacing: 0.02em; }
  .scp-quick-amount {
    display: inline-block; padding: 4px 14px; border-radius: 999px;
    background: #E45821; color: #fff; font-size: 0.82rem; font-weight: 800;
    margin: 0;
  }

  /* Loading / Empty */
  .scp-loading, .scp-empty {
    min-height: 300px; display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 16px;
    color: var(--text-muted); text-align: center;
  }
  .scp-spinner {
    width: 36px; height: 36px;
    border: 3px solid var(--border); border-top-color: #E45821;
    border-radius: 50%; animation: scp-spin 0.8s linear infinite;
  }
  .scp-back-btn {
    padding: 10px 24px; background: #E45821; color: #fff;
    border: none; border-radius: 10px; font-size: 0.9rem; font-weight: 700;
    cursor: pointer; font-family: inherit; transition: background 0.2s;
  }
  .scp-back-btn:hover { background: #c94d1c; }

  /* Success */
  .scp-success {
    max-width: 480px; margin: 60px auto 0;
    text-align: center; display: flex; flex-direction: column;
    align-items: center; gap: 16px;
  }
  .scp-success-icon {
    width: 80px; height: 80px; border-radius: 50%;
    background: rgba(16,185,129,0.12); border: 2px solid rgba(16,185,129,0.35);
    display: flex; align-items: center; justify-content: center;
    color: #10b981;
  }
  .scp-success-title { font-size: 1.8rem; font-weight: 800; margin: 0; color: var(--text-dark); }
  .scp-success-sub { font-size: 1rem; color: var(--text-mid); margin: 0; }
  .scp-success-card {
    width: 100%; background: var(--card-bg);
    border: 1px solid var(--border); border-radius: 16px; padding: 20px;
    display: flex; flex-direction: column; gap: 12px;
  }
  .scp-success-row {
    display: flex; justify-content: space-between; align-items: center;
    font-size: 0.875rem; color: var(--text-mid);
  }
  .scp-success-row:last-child { border-top: 1px solid var(--border); padding-top: 12px; }
  .scp-boost-val { font-size: 0.78rem; color: #f59e0b; font-weight: 700; }
  .scp-success-note {
    font-size: 0.82rem; color: var(--text-muted); line-height: 1.6;
    max-width: 380px; margin: 0;
  }
  .scp-success-actions { display: flex; flex-direction: column; gap: 10px; width: 100%; }
  .scp-btn-primary {
    width: 100%; padding: 14px; background: #E45821; color: #fff;
    border: none; border-radius: 12px; font-size: 0.9rem; font-weight: 700;
    cursor: pointer; font-family: inherit; transition: background 0.2s;
  }
  .scp-btn-primary:hover { background: #c94d1c; }
  .scp-btn-ghost {
    width: 100%; padding: 14px; background: none; color: var(--text-mid);
    border: 1px solid var(--border); border-radius: 12px; font-size: 0.9rem;
    font-weight: 600; cursor: pointer; font-family: inherit; transition: all 0.2s;
  }
  .scp-btn-ghost:hover { border-color: #E45821; color: #E45821; }

  /* Responsive */
  @media (max-width: 900px) {
    .scp-content { grid-template-columns: 1fr; }
    .scp-right { position: static; }
  }
  @media (max-width: 600px) {
    .scp-page { padding: 16px 12px 80px; }
    .scp-form-grid { grid-template-columns: 1fr; }
    .scp-field--full { grid-column: 1; }
    .scp-swap-row { flex-wrap: wrap; }
    .scp-swap-item { min-width: 100%; }
    .scp-swap-item--right { flex-direction: row; text-align: left; }
    .scp-swap-item--right > div { align-items: flex-start; }
    .scp-swap-arrow { margin: 0 auto; }
    .scp-card { padding: 16px; }
    .scp-card-title { font-size: 0.9rem; margin-bottom: 16px; }
    .scp-form-grid { gap: 12px; }
    .scp-field { gap: 4px; }
    .scp-field label { font-size: 0.68rem; }
    .scp-field input { height: 40px; padding-top: 9px; padding-bottom: 9px; font-size: 0.78rem; border-radius: 9px; }
    .scp-input-icon { left: 11px; width: 13px; height: 13px; }
    .scp-wallet-details { grid-template-columns: 1fr; }
    .scp-bank-row { flex-direction: column; align-items: flex-start; gap: 6px; }
    .scp-bank-val-wrap { width: 100%; justify-content: space-between; }
  }
`;

export default SwapCheckoutPage;
