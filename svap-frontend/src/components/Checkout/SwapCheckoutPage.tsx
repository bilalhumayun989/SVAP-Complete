import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  FiArrowLeft,
  FiCheck, 
  FiCopy, 
  FiUpload, 
  FiUser, 
  FiPhone, 
  FiMapPin, 
  FiHome, 
  FiInfo, 
  FiTruck,
  FiCreditCard,
  FiSmartphone,
  FiGlobe
} from 'react-icons/fi';
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

// ─── Bank & Delivery Config ──────────────────────────────────────────────────
const BANK_DETAILS = {
  deliveryFee: 500,
  bankName: 'Habib Bank (HBL)',
  accountTitle: 'MUHAMMAD NOORH',
  accountNumber: '50227900512303',
  iban: 'PK32HABB0050227900512303'
};

const WALLET_DETAILS = {
  easypaisa: {
    name: 'EasyPaisa',
    accountTitle: 'Muhammad Noorhan Mir',
    accountNumber: '03330208416',
  },
  jazzcash: {
    name: 'JazzCash',
    accountTitle: 'Noorhan Meer',
    accountNumber: '03330208416',
  },
};

export const SwapCheckoutPage = () => {
  const { swapRequestId: paramId } = useParams<{ swapRequestId: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const stateData = location.state as { swapRequestId?: string; entrySource?: string } | null;
  const swapRequestId = paramId || stateData?.swapRequestId;

  const [swapInfo, setSwapInfo] = useState<SwapInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<FormData>({
    fullName: '',
    phone: '',
    city: 'Karachi',
    area: '',
    streetAddress: '',
    termsAccepted: false,
  });
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    const stored = localStorage.getItem('sz_user');
    if (stored) {
      try {
        const user = JSON.parse(stored);
        setForm(prev => ({
          ...prev,
          fullName: user.name || prev.fullName,
          phone: user.phone || prev.phone,
          city: user.city || 'Karachi',
        }));
      } catch { /* ignore */ }
    }
  }, []);

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
            navigate('/orders', { replace: true });
          }
        }
      } catch { /* ignore */ }
    };
    checkExisting();
  }, [swapRequestId, navigate]);

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!form.fullName.trim()) e.fullName = 'Full name is required';
    if (!form.phone.trim()) e.phone = 'Phone number is required';
    else if (!/^(\+92|0)?[0-9]{10,11}$/.test(form.phone.replace(/\s/g, '')))
      e.phone = 'Enter a valid Pakistani mobile number';
    if (!form.city.trim()) e.city = 'City is required';
    if (!form.area.trim()) e.area = 'Please select your area';
    if (!form.streetAddress.trim()) e.streetAddress = 'Street address is required';
    if (!paymentScreenshot) e.paymentScreenshot = 'Please upload payment screenshot';
    if (!form.termsAccepted) e.termsAccepted = 'Please accept terms & conditions';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleScreenshotSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrors(prev => ({ ...prev, paymentScreenshot: 'Please select an image file' }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, paymentScreenshot: 'Image size must be less than 5MB' }));
      return;
    }
    setPaymentScreenshot(file);
    setErrors(prev => ({ ...prev, paymentScreenshot: undefined }));
  };

  const handleSubmit = async () => {
    if (!validate() || !swapRequestId) return;
    const stored = localStorage.getItem('sz_user');
    const userId = stored ? JSON.parse(stored).id : null;
    if (!userId) { navigate('/login'); return; }

    setSubmitting(true);
    setUploadingScreenshot(true);
    try {
      let screenshotUrl = '';
      if (paymentScreenshot) {
        const fileExt = paymentScreenshot.name.split('.').pop();
        const fileName = `${userId}_${Date.now()}.${fileExt}`;
        const filePath = `payment-screenshots/${fileName}`;
        const { error: uploadError } = await supabase.storage
          .from('payment-screenshots')
          .upload(filePath, paymentScreenshot, { cacheControl: '3600', upsert: false });
        if (uploadError) throw new Error(`Screenshot upload failed: ${uploadError.message}`);
        const { data: urlData } = await supabase.storage
          .from('payment-screenshots')
          .getPublicUrl(filePath);
        screenshotUrl = urlData.publicUrl;
      }
      setUploadingScreenshot(false);

      const fullAddress = form.area.trim()
        ? `${form.area.trim()}, ${form.streetAddress.trim()}`
        : form.streetAddress.trim();
      const toUserId = swapInfo
        ? (swapInfo.from_user_id === userId ? swapInfo.to_user_id : swapInfo.from_user_id)
        : userId;
      const orderPayload = {
        swap_request_id: swapRequestId,
        from_user_id: userId,
        to_user_id: toUserId,
        delivery_name: form.fullName.trim(),
        delivery_phone: form.phone.trim(),
        delivery_address: fullAddress,
        delivery_city: form.city.trim(),
        payment_method: 'Bank Transfer / EasyPaisa / JazzCash',
        shipping_cost: BANK_DETAILS.deliveryFee,
        discount: 0,
        total: totalToTransfer,
        transaction_ref: screenshotUrl,
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
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    });
  };

  const setField = (key: keyof FormData, value: string | boolean) => {
    setForm(prev => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors(prev => { const e = { ...prev }; delete e[key]; return e; });
  };

  const currentUserId = (() => { try { return JSON.parse(localStorage.getItem('sz_user') || '{}').id; } catch { return null; } })();
  const isSender = swapInfo?.from_user_id === currentUserId;
  const premiumAmount = (isSender && swapInfo?.premium_amount && swapInfo.premium_amount > 0) ? swapInfo.premium_amount : 0;
  const totalToTransfer = BANK_DETAILS.deliveryFee + premiumAmount;
  const isCashOnlyOffer = !swapInfo?.offered_product_id || !swapInfo.offered;
  const myItem = isCashOnlyOffer ? (isSender ? null : swapInfo?.requested) : (isSender ? swapInfo?.offered : swapInfo?.requested);
  const theirItem = isCashOnlyOffer ? (isSender ? swapInfo?.requested : null) : (isSender ? swapInfo?.requested : swapInfo?.offered);

  if (loading) {
    return (
      <div className="checkout-container text-center py-20">
        <p className="muted-text">Loading checkout details...</p>
      </div>
    );
  }

  if (submitted) {
    const summaryCashAmount = isCashOnlyOffer ? Number(swapInfo?.premium_amount || 0) : premiumAmount;
    return (
      <div className="checkout-container success-view">
        <div className="success-header">
          <div className="success-icon-wrapper">
            <div className="success-icon-bg"><FiCheck size={34} strokeWidth={2.5} /></div>
          </div>
          <h2 className="success-title">Order Placed!</h2>
          <p className="success-subtitle">Payment Pending Verification</p>
        </div>
        <div className="order-status-summary">
          <div className="status-summary-row"><span>Status</span><span className="status-summary-badge">Pending Verification</span></div>
          <div className="status-summary-row"><span>Delivery Fee</span><span>PKR {BANK_DETAILS.deliveryFee.toLocaleString()}</span></div>
          {summaryCashAmount > 0 && (
            <div className="status-summary-row status-summary-row--cash">
              <span>{isCashOnlyOffer ? 'Cash Offer' : 'Cash Top-up'}</span>
              <strong>PKR {summaryCashAmount.toLocaleString()}{isCashOnlyOffer ? ' (cash only)' : ''}</strong>
            </div>
          )}
        </div>
        <p className="status-summary-note">Our team will verify your payment and confirm your order shortly. You’ll see the status update in your Orders tab.</p>
        <div className="success-actions">
          <button className="submit-btn" onClick={() => navigate('/orders')}>View My Orders</button>
          <button className="success-secondary-btn" onClick={() => navigate('/requests')}>Back to Requests</button>
        </div>
        <style>{`
          .success-view {
            box-sizing: border-box;
            width: min(100%, 512px);
            max-width: 512px;
            min-height: calc(100vh - 32px);
            margin: 0 auto;
            padding: 24px 18px 36px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            background: var(--bg);
            color: var(--text-dark);
            font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif;
          }
          .success-view .success-header { text-align: center; padding: 0 0 20px; }
          .success-view .success-icon-wrapper { display: flex; justify-content: center; margin-bottom: 16px; }
          .success-view .success-icon-bg {
            width: 80px; height: 80px; border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            color: #10b981; background: rgba(16, 185, 129, .12);
            border: 2px solid rgba(16, 185, 129, .42);
          }
          .success-view .success-title { margin: 0 0 10px; color: var(--text-dark); font-size: 1.7rem; font-weight: 800; }
          .success-view .success-subtitle { margin: 0; padding: 0; color: var(--text-dark); font-size: .95rem; }
          .order-status-summary {
            width: 100%; box-sizing: border-box; padding: 16px 20px;
            border: 1px solid var(--btn-swap); border-radius: 16px;
            background: var(--card-bg);
          }
          .status-summary-row {
            min-height: 36px; display: flex; align-items: center;
            justify-content: space-between; gap: 12px;
            color: var(--text-dark); font-size: .875rem;
          }
          .status-summary-row + .status-summary-row { margin-top: 4px; }
          .status-summary-badge {
            padding: 6px 14px; border: 1px solid rgba(245, 158, 11, .45);
            border-radius: 999px; background: rgba(245, 158, 11, .1);
            color: #f59e0b; font-size: .75rem; font-weight: 700; white-space: nowrap;
          }
          .status-summary-row--cash { margin-top: 8px !important; padding-top: 10px; border-top: 1px solid var(--btn-swap); }
          .status-summary-row--cash strong { color: #f59e0b; font-size: .82rem; }
          .status-summary-note {
            max-width: 440px; margin: 16px auto 20px; color: var(--text-muted);
            text-align: center; font-size: .83rem; line-height: 1.55;
          }
          .success-actions { display: flex; flex-direction: column; gap: 10px; }
          .success-view .submit-btn {
            width: 100%; min-height: 50px; border: 0; border-radius: 14px;
            background: var(--btn-swap); color: var(--text-on-orange);
            font: inherit; font-weight: 700; cursor: pointer;
          }
          .success-secondary-btn {
            width: 100%; min-height: 50px; border: 1px solid var(--btn-swap);
            border-radius: 14px; background: transparent; color: var(--text-dark);
            font: inherit; font-weight: 700; cursor: pointer;
          }
          .success-secondary-btn:hover { background: rgba(228, 88, 33, .08); }
          @media (max-width: 480px) {
            .success-view { min-height: calc(100vh - 24px); padding: 20px 14px 28px; }
            .success-view .success-title { font-size: 1.5rem; }
            .order-status-summary { padding: 14px 16px; }
          }
        `}</style>
      </div>
    );
  }
  return (
    <div className="checkout-container">
      {/* Top Sticky Header */}
      <div className="checkout-header">
        <button 
          type="button" 
          className="back-btn" 
          onClick={() => navigate(-1)}
          aria-label="Go Back"
        >
          <FiArrowLeft size={18} />
        </button>
        <h1 className="header-title">Checkout</h1>
      </div>

      {/* Swap Header Pill */}
      <div className="swap-info-pill">
        <span className="swap-icon-arrow">⇄</span>
        <span className="highlight-text">
          {myItem?.title || (isCashOnlyOffer && isSender ? `PKR ${swapInfo?.premium_amount}` : 'Your Item')}
          {premiumAmount > 0 && !isCashOnlyOffer ? ` + PKR ${premiumAmount}` : ''}
        </span>
        <span className="swap-icon-app">⇄</span>
        <span className="item-text">
          {theirItem?.title || (isCashOnlyOffer && !isSender ? `PKR ${swapInfo?.premium_amount || 0}` : 'Requested Item')}
        </span>
      </div>

      {/* Form Inputs */}
      <div className="section-title">Delivery Details</div>
      
      <div className="form-group">
        <label>Full Name</label>
        <div className="input-wrapper">
          <FiUser className="input-icon" />
          <input
            type="text"
            value={form.fullName}
            onChange={(e) => setField('fullName', e.target.value)}
            placeholder="Full Name"
          />
        </div>
        {errors.fullName && <span className="err-msg">{errors.fullName}</span>}
      </div>

      <div className="form-group">
        <label>Phone Number</label>
        <div className="input-wrapper">
          <FiPhone className="input-icon" />
          <input
            type="text"
            value={form.phone}
            onChange={(e) => setField('phone', e.target.value)}
            placeholder="03xx-xxxxxxx"
          />
        </div>
        {errors.phone && <span className="err-msg">{errors.phone}</span>}
      </div>

      <div className="form-group">
        <label>City</label>
        <div className="input-wrapper select-wrapper">
          <FiGlobe className="input-icon" />
          <select 
            value={form.city} 
            onChange={(e) => setField('city', e.target.value)}
          >
            <option value="Karachi">Karachi</option>
          </select>
        </div>
        <div className="info-note orange-text">
          <FiInfo size={13} /> Svap currently delivers within Karachi only
        </div>
        {errors.city && <span className="err-msg">{errors.city}</span>}
      </div>

      <div className="form-group">
        <label>Area</label>
        <div className="input-wrapper select-wrapper">
          <FiMapPin className="input-icon" />
          <select 
            value={form.area} 
            onChange={(e) => setField('area', e.target.value)}
          >
            <option value="" disabled>Select your area</option>
            <option value="Clifton">Clifton</option>
            <option value="DHA">DHA</option>
            <option value="Gulshan-e-Iqbal">Gulshan-e-Iqbal</option>
            <option value="PECHS">PECHS</option>
            <option value="North Nazimabad">North Nazimabad</option>
            <option value="Other">Other</option>
          </select>
        </div>
        {errors.area && <span className="err-msg">{errors.area}</span>}
      </div>

      <div className="form-group">
        <label>Street / House No.</label>
        <div className="input-wrapper">
          <FiHome className="input-icon" />
          <input
            type="text"
            value={form.streetAddress}
            onChange={(e) => setField('streetAddress', e.target.value)}
            placeholder="e.g. House 12, Street 4, Block B"
          />
        </div>
        {errors.streetAddress && <span className="err-msg">{errors.streetAddress}</span>}
      </div>

      {/* Delivery Method */}
      <div className="section-title">Delivery method</div>
      <div className="delivery-card selected">
        <div className="delivery-left">
          <FiTruck size={20} className="delivery-icon" />
          <div>
            <div className="delivery-name">Standard</div>
            <div className="delivery-days">3-5 days</div>
          </div>
        </div>
        <div className="delivery-price">PKR {BANK_DETAILS.deliveryFee}</div>
      </div>
      <div className="info-note muted-text">
        <FiInfo size={13} /> PKR {BANK_DETAILS.deliveryFee} covers pickup from your location, delivery of the svaped item to you, and a PKR 100 item inspection fee.
      </div>

      {/* Bank & Wallets */}
      <div className="payment-card">
        {/* Bank Transfer */}
        <div className="payment-row">
          <div className="wallet-type orange-text">
            <FiCreditCard size={18} /> Bank Transfer
          </div>
          <div className="account-meta">
            <div><span className="lbl">Bank</span> <span className="val">{BANK_DETAILS.bankName}</span></div>
            <div><span className="lbl">Account Title</span> <span className="val">{BANK_DETAILS.accountTitle}</span></div>
            <div className="num-row">
              <span className="lbl">Account No.</span>
              <span className="val">{BANK_DETAILS.accountNumber}</span>
              <button type="button" onClick={() => copyToClipboard(BANK_DETAILS.accountNumber, 'acc')} className="copy-btn">
                {copiedKey === 'acc' ? <FiCheck size={14} color="#8DC63F" /> : <FiCopy size={14} />}
              </button>
            </div>
            <div className="num-row">
              <span className="lbl">IBAN</span>
              <span className="val">{BANK_DETAILS.iban}</span>
              <button type="button" onClick={() => copyToClipboard(BANK_DETAILS.iban, 'iban')} className="copy-btn">
                {copiedKey === 'iban' ? <FiCheck size={14} color="#8DC63F" /> : <FiCopy size={14} />}
              </button>
            </div>
          </div>
        </div>

        <div className="payment-divider" />

        {/* EasyPaisa */}
        <div className="payment-row">
          <div className="wallet-type">
            <FiSmartphone size={18} color="var(--svap-vivid-lime)" /> {WALLET_DETAILS.easypaisa.name}
          </div>
          <div className="account-meta">
            <div><span className="lbl">Account Name</span> <span className="val">{WALLET_DETAILS.easypaisa.accountTitle}</span></div>
            <div className="num-row">
              <span className="lbl">Number</span>
              <span className="val">{WALLET_DETAILS.easypaisa.accountNumber}</span>
              <button type="button" onClick={() => copyToClipboard(WALLET_DETAILS.easypaisa.accountNumber, 'ep')} className="copy-btn">
                {copiedKey === 'ep' ? <FiCheck size={14} color="#8DC63F" /> : <FiCopy size={14} />}
              </button>
            </div>
          </div>
        </div>

        <div className="payment-divider" />

        {/* JazzCash */}
        <div className="payment-row">
          <div className="wallet-type red-text">
            <FiSmartphone size={18} color="#E45821" /> {WALLET_DETAILS.jazzcash.name}
          </div>
          <div className="account-meta">
            <div><span className="lbl">Account Name</span> <span className="val">{WALLET_DETAILS.jazzcash.accountTitle}</span></div>
            <div className="num-row">
              <span className="lbl">Number</span>
              <span className="val">{WALLET_DETAILS.jazzcash.accountNumber}</span>
              <button type="button" onClick={() => copyToClipboard(WALLET_DETAILS.jazzcash.accountNumber, 'jc')} className="copy-btn">
                {copiedKey === 'jc' ? <FiCheck size={14} color="#8DC63F" /> : <FiCopy size={14} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Box */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleScreenshotSelect} 
        accept="image/*" 
        style={{ display: 'none' }} 
      />
      <div 
        className={`upload-box ${errors.paymentScreenshot ? 'has-error' : ''}`}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="upload-icon-badge">
          <FiUpload size={18} color="var(--text-on-orange)" />
        </div>
        <div className="upload-title">
          {paymentScreenshot ? paymentScreenshot.name : 'Attach Payment Screenshot'}
        </div>
        <div className="upload-sub">Tap to choose from gallery or camera</div>
      </div>
      {errors.paymentScreenshot && <span className="err-msg" style={{ marginTop: 4, display: 'block' }}>{errors.paymentScreenshot}</span>}

      <div className="info-note muted-text">
        <FiInfo size={13} /> Your order will be held as pending until our team verifies the payment. This usually takes 1-2 hours on business days.
      </div>

      {/* Order Summary */}
      <div className="summary-card">
        <div className="summary-card-title">Order Summary</div>
        
        <div className="summary-row">
          <div>
            <div className="summary-label">Delivery (Standard)</div>
            <div className="summary-sublabel">Includes pickup, delivery & PKR 100 inspection fee.</div>
          </div>
          <div className="summary-val">PKR {BANK_DETAILS.deliveryFee}</div>
        </div>

        {premiumAmount > 0 && (
          <div className="summary-row">
            <div className="summary-label">Cash Top-up</div>
            <div className="summary-val">PKR {premiumAmount}</div>
          </div>
        )}

        <div className="summary-divider" />

        <div className="summary-row total-row">
          <div className="total-label">Total to Transfer</div>
          <div className="total-val">PKR {totalToTransfer}</div>
        </div>
      </div>

      {/* Terms */}
      <label className="checkbox-container">
        <input 
          type="checkbox" 
          checked={form.termsAccepted} 
          onChange={(e) => setField('termsAccepted', e.target.checked)} 
        />
        <span className="terms-text">
          I agree to the <a href="/terms">Terms & Conditions</a> and <a href="/privacy">Privacy Policy</a>
        </span>
      </label>
      {errors.termsAccepted && <span className="err-msg" style={{ marginBottom: 12, display: 'block' }}>{errors.termsAccepted}</span>}

      <button 
        className="submit-btn" 
        onClick={handleSubmit} 
        disabled={submitting || uploadingScreenshot}
      >
        {uploadingScreenshot ? 'Uploading Screenshot...' : submitting ? 'Submitting Order...' : 'Submit Order'}
      </button>

      <style>{`
        .checkout-container {
          background-color: var(--bg);
          color: var(--text-dark);
          max-width: 450px;
          margin: 0 auto;
          padding: 0 16px 20px 16px;
          min-height: 100%;
          transition: background-color 0.2s ease, color 0.2s ease;
        }

        /* Sticky Header */
        .checkout-header {
          position: sticky;
          top: 0;
          z-index: 50;
          background-color: var(--bg);
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px 0;
          margin-bottom: 12px;
          border-bottom: 1px solid var(--border-light);
        }

        .back-btn {
          background-color: var(--bg-alt);
          border: 1px solid var(--border-light);
          color: var(--text-dark);
          width: 38px;
          height: 38px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }

        .back-btn:hover {
          background-color: var(--card-bg);
          border-color: var(--btn-swap);
        }

        .header-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text-dark);
          margin: 0;
        }

        .swap-info-pill {
          background-color: var(--bg-alt);
          border: 1px solid var(--border-light);
          border-radius: 12px;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.85rem;
          margin-bottom: 24px;
        }

        .swap-info-pill .highlight-text { color: var(--btn-swap); font-weight: 600; }
        .swap-info-pill .item-text { color: var(--text-dark); opacity: 0.9; }

        .section-title { font-size: 1.1rem; font-weight: 600; margin: 20px 0 12px; color: var(--text-dark); }

        /* Success Screen Styles */
        .success-header {
          text-align: center;
          padding: 32px 0 24px;
        }

        .success-icon-wrapper {
          display: flex;
          justify-content: center;
          margin-bottom: 20px;
        }

        .success-icon-bg {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: linear-gradient(135deg, #E45821 0%, #ff7e4d 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          box-shadow: 0 8px 24px rgba(228, 88, 33, 0.3);
          animation: success-bounce 0.6s ease-out;
        }

        @keyframes success-bounce {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }

        .success-title {
          font-size: 1.75rem;
          font-weight: 700;
          color: var(--text-dark);
          margin: 0 0 12px;
        }

        .success-subtitle {
          font-size: 0.9375rem;
          color: var(--text-muted);
          line-height: 1.5;
          margin: 0;
          padding: 0 20px;
        }

        .success-view { max-width: 512px; padding-top: 0; }
        .success-view .success-header { padding: 18px 0 16px; }
        .success-view .success-icon-bg { width: 80px; height: 80px; color: #10b981; background: rgba(16, 185, 129, 0.12); border: 2px solid rgba(16, 185, 129, 0.42); box-shadow: none; }
        .success-view .success-title { margin-bottom: 12px; font-weight: 800; }
        .success-view .success-subtitle { color: var(--text-dark); }
        .order-status-summary { border: 1px solid var(--btn-swap); border-radius: 16px; padding: 16px 20px; margin: 0 auto 16px; background: var(--card-bg); }
        .status-summary-row { min-height: 34px; display: flex; align-items: center; justify-content: space-between; gap: 12px; color: var(--text-dark); font-size: 0.875rem; }
        .status-summary-row + .status-summary-row { margin-top: 4px; }
        .status-summary-badge { border: 1px solid rgba(245, 158, 11, 0.45); border-radius: 999px; padding: 6px 14px; color: #d97706; background: rgba(245, 158, 11, 0.1); font-size: 0.75rem; font-weight: 700; white-space: nowrap; }
        .status-summary-row--cash { border-top: 1px solid var(--btn-swap); margin-top: 8px !important; padding-top: 10px; }
        .status-summary-row--cash strong { color: #f59e0b; font-size: 0.82rem; }
        .status-summary-note { max-width: 440px; margin: 14px auto 18px; color: #a88737; text-align: center; font-size: 0.82rem; line-height: 1.55; }
        .success-actions { display: flex; flex-direction: column; gap: 10px; }
        .success-secondary-btn { width: 100%; min-height: 50px; border: 1px solid var(--btn-swap); border-radius: 14px; background: transparent; color: var(--text-dark); font: inherit; font-weight: 700; cursor: pointer; }
        .success-secondary-btn:hover { background: rgba(228, 88, 33, 0.06); }
        .info-box {
          background-color: var(--bg-alt);
          border: 1px solid var(--border-light);
          border-radius: 12px;
          padding: 16px;
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
          font-size: 0.8125rem;
          color: var(--text-mid);
        }

        .info-box svg {
          flex-shrink: 0;
          color: var(--btn-swap);
          margin-top: 2px;
        }

        .info-box ul {
          color: var(--text-mid);
        }

        .info-box ul li {
          margin-bottom: 6px;
        }

        .info-box ul li:last-child {
          margin-bottom: 0;
        }

        .form-group { margin-bottom: 14px; }
        .form-group label { display: block; font-size: 0.78rem; color: var(--text-muted); margin-bottom: 6px; font-weight: 500; }

        .input-wrapper { position: relative; display: flex; align-items: center; }
        .input-wrapper .input-icon { position: absolute; left: 14px; color: var(--text-muted); font-size: 16px; pointer-events: none; }

        .input-wrapper input,
        .input-wrapper select {
          width: 100%;
          background-color: var(--bg-alt);
          border: 1px solid var(--border-light);
          border-radius: 12px;
          padding: 12px 14px 12px 42px;
          color: var(--text-dark);
          font-size: 0.9rem;
          outline: none;
          transition: border-color 0.2s ease, background-color 0.2s ease;
        }

        .input-wrapper input::placeholder {
          color: var(--text-muted);
          opacity: 0.8;
        }

        .input-wrapper input:focus,
        .input-wrapper select:focus {
          border-color: var(--btn-swap);
        }

        .select-wrapper::after { content: '▾'; position: absolute; right: 14px; color: var(--text-muted); pointer-events: none; }
        .input-wrapper select { appearance: none; cursor: pointer; }

        .info-note { display: flex; align-items: flex-start; gap: 6px; font-size: 0.72rem; margin-top: 6px; line-height: 1.35; }
        .orange-text { color: var(--btn-swap); }
        .muted-text { color: var(--text-muted); }

        .delivery-card {
          background: var(--btn-swap);
          border-radius: 14px;
          padding: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          color: var(--text-on-orange);
        }

        .delivery-left { display: flex; align-items: center; gap: 12px; }
        .delivery-name { font-weight: 700; font-size: 0.95rem; }
        .delivery-days { font-size: 0.75rem; opacity: 0.85; }
        .delivery-price { font-weight: 700; font-size: 0.95rem; }

        .payment-card { 
          background-color: var(--card-bg); 
          border: 1px solid var(--border-light); 
          border-radius: 14px; 
          padding: 16px; 
          margin-top: 20px; 
        }
        
        .payment-row { display: flex; flex-direction: column; gap: 8px; }
        .wallet-type { font-size: 0.85rem; font-weight: 600; display: flex; align-items: center; gap: 8px; color: var(--text-dark); }

        .account-meta { font-size: 0.78rem; display: flex; flex-direction: column; gap: 4px; }
        .account-meta .lbl { color: var(--text-muted); width: 100px; display: inline-block; }
        .account-meta .val { color: var(--text-dark); font-weight: 600; word-break: break-all; }

        .num-row { display: flex; align-items: center; }
        .copy-btn { background: transparent; border: none; color: var(--btn-swap); cursor: pointer; margin-left: auto; display: flex; align-items: center; }

        .payment-divider { height: 1px; background-color: var(--border-light); margin: 12px 0; }

        .upload-box { 
          background-color: var(--bg-alt); 
          border: 1px dashed var(--btn-swap); 
          border-radius: 14px; 
          padding: 24px; 
          text-align: center; 
          cursor: pointer; 
          margin-top: 16px; 
        }
        .upload-box.has-error { border-color: #ef4444; }
        .upload-icon-badge { width: 36px; height: 36px; background: var(--btn-swap); border-radius: 8px; display: flex; align-items: center; justify-content: center; margin: 0 auto 10px; }
        .upload-title { font-size: 0.85rem; font-weight: 600; color: var(--btn-swap); }
        .upload-sub { font-size: 0.72rem; color: var(--text-muted); margin-top: 4px; }

        .summary-card { 
          background-color: var(--card-bg); 
          border: 1px solid var(--border-light); 
          border-radius: 14px; 
          padding: 18px; 
          margin-top: 20px; 
        }
        .summary-card-title { font-weight: 600; font-size: 0.95rem; margin-bottom: 14px; color: var(--text-dark); }
        .summary-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
        .summary-label { font-size: 0.82rem; color: var(--text-dark); }
        .summary-sublabel { font-size: 0.7rem; color: var(--text-muted); margin-top: 2px; }
        .summary-val { font-size: 0.82rem; font-weight: 600; color: var(--text-dark); }
        .summary-divider { height: 1px; background-color: var(--border-light); margin: 12px 0; }

        .total-row { margin-bottom: 0; align-items: center; }
        .total-label { font-weight: 700; font-size: 0.95rem; color: var(--text-dark); }
        .total-val { color: var(--btn-swap); font-size: 1.05rem; font-weight: 700; }

        .checkbox-container { display: flex; align-items: center; gap: 10px; font-size: 0.78rem; color: var(--text-dark); margin: 20px 0 6px; cursor: pointer; }
        .checkbox-container input { accent-color: var(--btn-swap); width: 16px; height: 16px; }
        .terms-text a { color: var(--btn-swap); text-decoration: underline; }

        .submit-btn { 
          width: 100%; 
          background: var(--btn-swap); 
          border: none; 
          border-radius: 28px; 
          padding: 14px; 
          color: var(--text-on-orange); 
          font-weight: 700; 
          font-size: 0.95rem; 
          cursor: pointer; 
          transition: opacity 0.2s ease; 
        }
        .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .err-msg { font-size: 0.72rem; color: #ef4444; margin-top: 4px; }
      `}</style>
    </div>
  );
};

export default SwapCheckoutPage;