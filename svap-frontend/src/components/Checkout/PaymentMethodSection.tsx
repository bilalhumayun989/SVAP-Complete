import type { PaymentMethod } from './types/checkout.types';
import { PAYMENT_METHODS } from './utils/constants';

interface PaymentMethodSectionProps {
  selectedMethod: PaymentMethod | null;
  onMethodChange: (method: PaymentMethod) => void;
  error?: string;
  disabled?: boolean;
}

// Custom Card Icon
const CardIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <line x1="2" y1="10" x2="22" y2="10" />
  </svg>
);

// Custom Smartphone Icon
const PhoneIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="2" width="14" height="20" rx="2" />
    <line x1="12" y1="18" x2="12.01" y2="18" strokeWidth="3" />
  </svg>
);

// Custom Cash/Dollar Icon
const CashIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 8v8M9 10h6M9 14h6" />
  </svg>
);

export const PaymentMethodSection = ({
  selectedMethod,
  onMethodChange,
  error,
  disabled = false,
}: PaymentMethodSectionProps) => {
  
  const getMethodIcon = (iconType: string) => {
    switch (iconType) {
      case 'card':
        return <CardIcon size={18} />;
      case 'jazzcash':
      case 'easypaisa':
        return <PhoneIcon size={18} />;
      case 'cod':
        return <CashIcon size={18} />;
      default:
        return <CardIcon size={18} />;
    }
  };

  const getMethodColor = (methodId: string, isSelected: boolean) => {
    if (isSelected) return '#E45821';
    
    switch (methodId) {
      case 'jazzcash':
        return '#00A651'; // JazzCash green
      case 'easypaisa':
        return '#FF6B35'; // EasyPaisa orange
      case 'card':
        return '#E45821';
      case 'cod':
        return '#666666';
      default:
        return '#666666';
    }
  };

  return (
    <div className={`payment-method-section ${error ? 'has-error' : ''}`}>
      <div className="section-header">
        <h2 className="section-title">Payment method</h2>
      </div>

      <div className="payment-methods">
        {PAYMENT_METHODS.map((method) => {
          const isSelected = selectedMethod?.id === method.id;
          
          return (
            <button
              key={method.id}
              type="button"
              className={`payment-option ${isSelected ? 'selected' : ''} ${method.isRecommended ? 'recommended' : ''}`}
              onClick={() => onMethodChange(method)}
              disabled={disabled}
            >
              <div 
                className="option-icon"
                style={{
                  backgroundColor: isSelected ? getMethodColor(method.id, true) : 'var(--bg-section)',
                  color: isSelected ? 'white' : getMethodColor(method.id, false)
                }}
              >
                {getMethodIcon(method.icon)}
              </div>
              
              <div className="option-content">
                <div className="option-name">
                  {method.name}
                  {method.isRecommended && (
                    <span className="recommended-badge">Popular</span>
                  )}
                </div>
                <div className="option-description">
                  {method.description}
                </div>
              </div>

              {isSelected && (
                <div className="selection-indicator">
                  <div className="selection-dot" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="error-message">{error}</div>
      )}

      <style>{`
        .payment-method-section {
          background: var(--card-bg);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 24px;
          transition: border-color 0.2s;
        }

        .payment-method-section.has-error {
          border-color: #ef4444;
        }

        .section-header {
          margin-bottom: 20px;
        }

        .section-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--text-dark);
          margin: 0;
        }

        .payment-methods {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .payment-option {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 20px 16px;
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
          text-align: center;
          position: relative;
        }

        .payment-option:hover:not(:disabled) {
          border-color: #E45821;
          background: var(--bg-section);
        }

        .payment-option.selected {
          border-color: #E45821;
          background: var(--bg-section);
          box-shadow: 0 0 0 1px #E45821;
        }

        .payment-option.recommended {
          border-color: var(--svap-lime);
        }

        .payment-option.recommended.selected {
          border-color: #E45821;
        }

        .payment-option:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .option-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          border-radius: 12px;
          transition: all 0.2s;
        }

        .option-content {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .option-name {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--text-dark);
        }

        .recommended-badge {
          font-size: 0.7rem;
          font-weight: 600;
          color: var(--svap-vivid-lime);
          background: rgba(173, 220, 90, 0.1);
          padding: 2px 6px;
          border-radius: 10px;
          border: 1px solid rgba(173, 220, 90, 0.3);
        }

        .option-description {
          font-size: 0.8rem;
          color: var(--text-mid);
        }

        .selection-indicator {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .selection-dot {
          width: 8px;
          height: 8px;
          background: var(--svap-blue);
          border-radius: 50%;
        }

        .error-message {
          margin-top: 12px;
          padding: 8px 12px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 6px;
          color: #dc2626;
          font-size: 0.875rem;
        }

        /* Mobile responsiveness */
        @media (max-width: 768px) {
          .payment-methods {
            grid-template-columns: 1fr;
          }

          .payment-option {
            flex-direction: row;
            text-align: left;
            padding: 16px;
          }

          .option-icon {
            width: 40px;
            height: 40px;
          }

          .option-content {
            flex: 1;
            align-items: flex-start;
          }

          .option-name {
            flex-direction: row;
            align-items: center;
          }
        }

        /* Large screens */
        @media (min-width: 1200px) {
          .payment-methods {
            gap: 16px;
          }

          .payment-option {
            padding: 24px 20px;
          }

          .option-icon {
            width: 52px;
            height: 52px;
          }
        }
      `}</style>
    </div>
  );
};