import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import { useCheckoutState } from './hooks/useCheckoutState';
import { DeliveryAddressSection } from './DeliveryAddressSection';
import { DeliveryMethodSection } from './DeliveryMethodSection';
import { PaymentMethodSection } from './PaymentMethodSection';
import { OrderSummary } from './OrderSummary';
import { CheckoutButton } from './CheckoutButton';
import type { NavigationData } from './types/checkout.types';
import { api } from '../../services/api';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Extract navigation data from location state
  const navigationData = location.state as NavigationData | undefined;
  
  const {
    state,
    setDeliveryAddress,
    setDeliveryMethod,
    setPaymentMethod,
    setLoading,
    getFieldError,
    hasFieldError,
  } = useCheckoutState(navigationData);

  // Redirect if no items (shouldn't happen in normal flow)
  useEffect(() => {
    if (!navigationData && state.items.length === 0) {
      navigate('/', { replace: true });
    }
  }, [navigationData, state.items.length, navigate]);

  const handleCheckoutComplete = async () => {
    if (!state.isValid) return;
    
    setLoading(true);
    
    try {
      const userStr = localStorage.getItem('sz_user');
      const user = userStr ? JSON.parse(userStr) : null;
      
      const orderData = {
        swap_request_id: navigationData?.swapRequestId || null,
        from_user_id: user?.id,
        to_user_id: user?.id, // Fallback, could be fetched from item seller
        delivery_name: state.deliveryAddress?.fullName,
        delivery_phone: state.deliveryAddress?.phone,
        delivery_address: state.deliveryAddress?.streetAddress,
        delivery_city: state.deliveryAddress?.city,
        payment_method: state.paymentMethod?.name,
        shipping_cost: state.costBreakdown.deliveryFee,
        discount: 0,
        total: state.costBreakdown.totalAmount,
        tracking_number: `SVAP-${Date.now()}`
      };

      const res = await api.createOrder(orderData);
      if (res.error) {
        throw new Error(res.error);
      }
      
      // Navigate to success page
      navigate('/orders', {
        state: {
          success: true,
          transactionType: state.transactionType,
          totalAmount: state.costBreakdown.totalAmount,
        }
      });
    } catch (error) {
      console.error('Checkout failed:', error);
      alert('Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (state.isLoading && state.items.length === 0) {
    return (
      <div className="checkout-page">
        <div className="checkout-container">
          <div className="loading-state">
            <div className="loading-spinner" />
            <p>Loading checkout...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        {/* Header */}
        <div className="checkout-header">
          <button 
            className="back-button" 
            onClick={() => navigate(-1)}
            disabled={state.isLoading}
          >
            <FiArrowLeft size={16} />
            Back
          </button>
          <h1 className="checkout-title">Checkout</h1>
          <p className="checkout-subtitle">
            {state.items.length} item{state.items.length !== 1 ? 's' : ''} • {' '}
            <span className="transaction-type">
              {state.transactionType === 'svap' ? 'Swap Transaction' : 'Purchase'}
            </span>
          </p>
          {/* If came from swap, show "check requests later" note */}
          {navigationData?.entrySource === 'swap' && (
            <div className="checkout-swap-note">
              ✅ Swap request accepted! Fill in delivery details below, or{' '}
              <button className="checkout-swap-link" onClick={() => navigate('/requests')}>
                go back to requests
              </button>{' '}
              and complete checkout later.
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="checkout-content">
          {/* Left Column - Forms */}
          <div className="checkout-forms">
            <DeliveryAddressSection
              address={state.deliveryAddress}
              onAddressChange={setDeliveryAddress}
              error={getFieldError('address')}
              hasError={hasFieldError('address')}
              disabled={state.isLoading}
            />
            
            <DeliveryMethodSection
              selectedMethod={state.deliveryMethod}
              onMethodChange={setDeliveryMethod}
              error={getFieldError('deliveryMethod')}
              disabled={state.isLoading}
            />
            
            <PaymentMethodSection
              selectedMethod={state.paymentMethod}
              onMethodChange={setPaymentMethod}
              error={getFieldError('paymentMethod')}
              disabled={state.isLoading}
            />
          </div>

          {/* Right Column - Order Summary */}
          <div className="checkout-summary">
            <OrderSummary
              items={state.items}
              costBreakdown={state.costBreakdown}
              transactionType={state.transactionType}
            />
            
            <CheckoutButton
              isValid={state.isValid}
              isLoading={state.isLoading}
              totalAmount={state.costBreakdown.totalAmount}
              onCheckout={handleCheckoutComplete}
              disabled={!state.isValid || state.isLoading}
            />
          </div>
        </div>
      </div>

      {/* Checkout Page Styles */}
      <style>{`
        .checkout-page {
          min-height: 100vh;
          background: var(--bg);
          padding: 24px 24px 80px;
          font-family: 'Poppins', 'Helvetica Neue', Arial, sans-serif;
        }

        .checkout-container {
          max-width: 1200px;
          margin: 0 auto;
        }

        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          gap: 16px;
        }

        .loading-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid var(--border);
          border-top: 3px solid var(--svap-blue);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Header */
        .checkout-header {
          margin-bottom: 40px;
        }

        .back-button {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: none;
          border: 1px solid var(--border);
          border-radius: 8px;
          color: var(--text-mid);
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          margin-bottom: 20px;
        }

        .back-button:hover:not(:disabled) {
          background: var(--bg-section);
          border-color: var(--svap-blue);
          color: var(--svap-blue);
        }

        .back-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .checkout-title {
          font-size: clamp(1.75rem, 4vw, 2.5rem);
          font-weight: 700;
          color: var(--text-dark);
          margin: 0 0 8px 0;
          letter-spacing: -0.02em;
        }

        .checkout-subtitle {
          font-size: 1rem;
          color: var(--text-mid);
          margin: 0;
        }

        .transaction-type {
          color: var(--svap-blue);
          font-weight: 600;
        }

        .checkout-swap-note {
          margin-top: 12px;
          padding: 12px 16px;
          background: rgba(141,198,63,0.12);
          border: 1px solid rgba(141,198,63,0.3);
          border-radius: 10px;
          font-size: 0.85rem;
          color: var(--text-mid);
          line-height: 1.5;
        }

        html[data-theme='dark'] .checkout-swap-note {
          background: rgba(141,198,63,0.08);
          border-color: rgba(141,198,63,0.2);
          color: #aaa;
        }

        .checkout-swap-link {
          background: none;
          border: none;
          color: #E45821;
          font-weight: 700;
          cursor: pointer;
          font-size: inherit;
          font-family: inherit;
          padding: 0;
          text-decoration: underline;
          transition: opacity 0.15s;
        }
        .checkout-swap-link:hover { opacity: 0.75; }

        /* Main Content Layout */
        .checkout-content {
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 40px;
          align-items: start;
        }

        .checkout-forms {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .checkout-summary {
          position: sticky;
          top: 100px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        /* Responsive Design */
        @media (max-width: 1024px) {
          .checkout-content {
            grid-template-columns: 1fr;
            gap: 32px;
          }

          .checkout-summary {
            position: static;
            order: -1;
          }
        }

        @media (max-width: 768px) {
          .checkout-page {
            padding: 16px 16px 60px;
          }

          .checkout-content {
            gap: 24px;
          }

          .checkout-forms {
            gap: 20px;
          }
        }

        /* Large screens */
        @media (min-width: 1920px) {
          .checkout-container {
            max-width: 1400px;
          }

          .checkout-content {
            grid-template-columns: 1fr 420px;
            gap: 60px;
          }
        }
      `}</style>
    </div>
  );
};

export default CheckoutPage;