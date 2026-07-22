// Using local icons from public/ICONS for consistent availability
import type { DeliveryMethod } from './types/checkout.types';
import { DELIVERY_METHODS } from './utils/constants';
import { CostCalculator } from './utils/costCalculations';

interface DeliveryMethodSectionProps {
  selectedMethod: DeliveryMethod | null;
  onMethodChange: (method: DeliveryMethod) => void;
  error?: string;
  disabled?: boolean;
}

export const DeliveryMethodSection = ({
  selectedMethod,
  onMethodChange,
  error,
  disabled = false,
}: DeliveryMethodSectionProps) => {
  
  const getMethodIcon = (methodId: string) => {
    switch (methodId) {
      case 'standard':
        return <img src="/ICONS/Delivery.png" alt="Delivery" style={{ width: 18, height: 18, objectFit: 'contain' }} />;
      case 'express':
        return <img src="/ICONS/Time.png" alt="Express" style={{ width: 18, height: 18, objectFit: 'contain' }} />;
      case 'meetup':
        return <img src="/ICONS/Location.png" alt="Meetup" style={{ width: 18, height: 18, objectFit: 'contain' }} />;
      default:
        return <img src="/ICONS/Delivery.png" alt="Delivery" style={{ width: 30, height: 30, objectFit: 'contain' }} />;
    }
  };

  return (
    <div className={`delivery-method-section ${error ? 'has-error' : ''}`}>
      <div className="section-header">
        <h2 className="section-title">Delivery method</h2>
      </div>

      <div className="delivery-methods">
        {DELIVERY_METHODS.map((method) => {
          const isSelected = selectedMethod?.id === method.id;
          
          return (
            <button
              key={method.id}
              type="button"
              className={`delivery-option ${isSelected ? 'selected' : ''} ${method.isRecommended ? 'recommended' : ''}`}
              onClick={() => onMethodChange(method)}
              disabled={disabled}
            >
              <div className="option-icon">
                {getMethodIcon(method.id)}
              </div>
              
              <div className="option-content">
                <div className="option-header">
                  <div className="option-name">
                    {method.name}
                    {method.isRecommended && (
                      <span className="recommended-badge">Recommended</span>
                    )}
                  </div>
                  <div className="option-price">
                    {method.cost === 0 ? 'Free' : CostCalculator.formatCurrency(method.cost)}
                  </div>
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
        .delivery-method-section {
          background: var(--card-bg);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 24px;
          transition: border-color 0.2s;
        }

        .delivery-method-section.has-error {
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

        .delivery-methods {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .delivery-option {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px 18px;
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
          width: 100%;
          position: relative;
        }

        .delivery-option:hover:not(:disabled) {
          border-color: #E45821;
          background: var(--bg-section);
        }

        .delivery-option.selected {
          border-color: #E45821;
          background: var(--bg-section);
          box-shadow: 0 0 0 1px #E45821;
        }

        .delivery-option.recommended {
          border-color: var(--svap-lime);
        }

        .delivery-option.recommended.selected {
          border-color: #E45821;
        }

        .delivery-option:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .option-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          background: var(--bg-section);
          border-radius: 10px;
          color: var(--text-mid);
          flex-shrink: 0;
        }
             /* Make the icon image invert to white on hover for contrast */
        .option-icon img {
          transition: filter 0.18s ease, opacity 0.18s ease;
          -webkit-transition: -webkit-filter 0.18s ease;
        }

        /* Stronger, cross-browser filter to force icon to white on hover/selected */
        .delivery-option:hover .option-icon img,
        .delivery-option.selected .option-icon img {
          -webkit-filter: grayscale(1) brightness(0) invert(1);
          filter: grayscale(1) brightness(0) invert(1);
        }

        .delivery-option.selected .option-icon {
          background: #E45821;
          color: white;
        }

        .option-content {
          flex: 1;
          min-width: 0;
        }

        .option-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 4px;
        }

        .option-name {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 1rem;
          font-weight: 600;
          color: var(--text-dark);
        }

        .recommended-badge {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--svap-vivid-lime);
          background: rgba(173, 220, 90, 0.1);
          padding: 2px 8px;
          border-radius: 12px;
          border: 1px solid rgba(173, 220, 90, 0.3);
        }

        .option-price {
          font-size: 1rem;
          font-weight: 700;
          color: var(--text-dark);
        }

        .delivery-option.selected .option-price {
          color: #000000;
        }

        .option-description {
          font-size: 0.875rem;
          color: var(--text-mid);
        }

        .selection-indicator {
          position: absolute;
          top: 12px;
          right: 12px;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .selection-dot {
          width: 8px;
          height: 8px;
          background: #E45821;
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
          .delivery-option {
            padding: 14px 16px;
            gap: 14px;
          }

          .option-icon {
            width: 36px;
            height: 36px;
          }

          .option-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 4px;
          }

          .option-price {
            font-size: 0.875rem;
          }
        }
      `}</style>
    </div>
  );
};