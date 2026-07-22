import { FiLoader } from 'react-icons/fi';
import { CostCalculator } from './utils/costCalculations';

// Custom Shopping Bag Icon
const ShoppingBagIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <path d="M16 10a4 4 0 0 1-8 0" />
  </svg>
);

interface CheckoutButtonProps {
  isValid: boolean;
  isLoading: boolean;
  totalAmount: number;
  onCheckout: () => void;
  disabled?: boolean;
}

export const CheckoutButton = ({
  isValid,
  isLoading,
  totalAmount,
  onCheckout,
  disabled = false,
}: CheckoutButtonProps) => {
  
  const getButtonText = () => {
    if (isLoading) {
      return 'Processing...';
    }
    
    if (!isValid) {
      return 'Complete Required Fields';
    }
    
    return `Complete Checkout • ${CostCalculator.formatCurrency(totalAmount)}`;
  };

  const getButtonIcon = () => {
    if (isLoading) {
      return <FiLoader size={18} className="spinning" />;
    }
    
    return <ShoppingBagIcon size={18} />;
  };

  return (
    <div className="checkout-button-section">
      <button
        type="button"
        className={`checkout-button ${isValid ? 'enabled' : 'disabled'} ${isLoading ? 'loading' : ''}`}
        onClick={onCheckout}
        disabled={disabled || !isValid || isLoading}
      >
        <span className="button-icon">
          {getButtonIcon()}
        </span>
        <span className="button-text">
          {getButtonText()}
        </span>
      </button>

      {!isValid && !isLoading && (
        <div className="validation-hint">
          Please complete all required fields to proceed with checkout
        </div>
      )}

      <div className="security-note">
        <span>🔒 Your payment information is secure and encrypted</span>
      </div>

      <style>{`
        .checkout-button-section {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .checkout-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          width: 100%;
          padding: 16px 24px;
          border: none;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
          overflow: hidden;
        }

        .checkout-button.enabled {
          background: #E45821;
          color: white;
          box-shadow: 0 4px 12px rgba(228, 88, 33, 0.3);
        }

        .checkout-button.enabled:hover:not(:disabled) {
          background: #d84f1b;
          box-shadow: 0 6px 16px rgba(228, 88, 33, 0.4);
          transform: translateY(-1px);
        }

        .checkout-button.disabled {
          background: #f0f0f0;
          color: #888888;
          cursor: not-allowed;
        }

        .checkout-button.loading {
          background: #E45821;
          color: white;
          cursor: wait;
        }

        .checkout-button:disabled {
          cursor: not-allowed;
          transform: none !important;
          box-shadow: none !important;
        }

        .button-icon {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .button-text {
          font-weight: 700;
        }

        .spinning {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .validation-hint {
          font-size: 0.875rem;
          color: var(--text-mid);
          text-align: center;
          padding: 8px 16px;
          background: var(--bg-section);
          border-radius: 8px;
          border: 1px solid var(--border);
        }

        .security-note {
          font-size: 0.8rem;
          color: var(--text-mid);
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }

        /* Mobile responsiveness */
        @media (max-width: 768px) {
          .checkout-button {
            padding: 14px 20px;
            font-size: 0.9rem;
          }

          .button-icon {
            display: none; /* Hide icon on mobile for more text space */
          }

          .security-note {
            font-size: 0.75rem;
          }
        }

        /* Large screens */
        @media (min-width: 1200px) {
          .checkout-button {
            padding: 18px 28px;
            font-size: 1.1rem;
          }
        }

        /* Accessibility */
        @media (prefers-reduced-motion: reduce) {
          .checkout-button {
            transition: none;
          }
          
          .checkout-button:hover:not(:disabled) {
            transform: none;
          }
          
          .spinning {
            animation: none;
          }
        }

        /* High contrast mode */
        @media (prefers-contrast: high) {
          .checkout-button.enabled {
            border: 2px solid white;
          }
          
          .checkout-button.disabled {
            border: 2px solid var(--text-muted);
          }
        }
      `}</style>
    </div>
  );
};