import type { CheckoutItem, CostBreakdown } from './types/checkout.types';
import { CostCalculator } from './utils/costCalculations';

export interface OrderSummaryProps {
  items: CheckoutItem[];
  costBreakdown: CostBreakdown;
  transactionType: 'purchase' | 'svap';
}

export const OrderSummary = ({
  items,
  costBreakdown,
  transactionType,
}: OrderSummaryProps) => {
  
  const getSummaryTitle = () => {
    if (transactionType === 'svap') {
      return 'Swap Summary';
    }
    return 'Order Summary';
  };

  const getCostItems = () => {
    const costItems = [];
    
    if (transactionType === 'svap' && costBreakdown.cashDifference !== undefined) {
      costItems.push({
        label: 'Cash difference',
        amount: costBreakdown.cashDifference,
        formatted: CostCalculator.formatCurrency(costBreakdown.cashDifference),
        highlight: true,
      });
    } else {
      // For purchases, show items total
      if (costBreakdown.itemsTotal > 0) {
        costItems.push({
          label: 'Items total',
          amount: costBreakdown.itemsTotal,
          formatted: CostCalculator.formatCurrency(costBreakdown.itemsTotal),
        });
      }
    }

    // Always show delivery fee
    costItems.push({
      label: 'Delivery',
      amount: costBreakdown.deliveryFee,
      formatted: costBreakdown.deliveryFee === 0 
        ? 'Free' 
        : CostCalculator.formatCurrency(costBreakdown.deliveryFee),
      isFree: costBreakdown.deliveryFee === 0,
    });

    // Always show service fee
    costItems.push({
      label: 'Service fee',
      amount: costBreakdown.serviceFee,
      formatted: CostCalculator.formatCurrency(costBreakdown.serviceFee),
    });

    return costItems;
  };

  const costItems = getCostItems();

  return (
    <div className="order-summary">
      <div className="summary-header">
        <h2 className="summary-title">{getSummaryTitle()}</h2>
      </div>

      {/* Items List */}
      {items.length > 0 && (
        <div className="items-section">
          <h3 className="items-title">
            {items.length} item{items.length !== 1 ? 's' : ''}
          </h3>
          <div className="items-list">
            {items.map((item, index) => (
              <div key={item.id || index} className="summary-item">
                <div className="item-image">
                  <img src={item.image} alt={item.name} />
                </div>
                <div className="item-details">
                  <div className="item-name">{item.name}</div>
                  <div className="item-meta">
                    <span className="item-condition">{item.condition}</span>
                    {item.seller && (
                      <>
                        <span className="item-separator">•</span>
                        <span className="item-seller">{item.seller}</span>
                      </>
                    )}
                  </div>
                  {item.price && (
                    <div className="item-price">{item.price}</div>
                  )}
                  {item.swapValue && (
                    <div className="item-price">
                      {CostCalculator.formatCurrency(item.swapValue)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cost Breakdown */}
      <div className="cost-section">
        <div className="cost-breakdown">
          {costItems.map((costItem, index) => (
            <div 
              key={index} 
              className={`cost-row ${costItem.highlight ? 'highlight' : ''} ${costItem.isFree ? 'free' : ''}`}
            >
              <span className="cost-label">{costItem.label}</span>
              <span className="cost-amount">{costItem.formatted}</span>
            </div>
          ))}
        </div>

        <div className="total-divider" />

        <div className="total-row">
          <span className="total-label">Total</span>
          <span className="total-amount">
            {CostCalculator.formatCurrency(costBreakdown.totalAmount)}
          </span>
        </div>
        <div className="delivery-coverage-note">
          <p>This covers your delivery, picking up and delivering the item to you.</p>
        </div>
      </div>

      {transactionType === 'svap' && (
        <div className="swap-note">
          <p>💡 You'll pay the cash difference plus delivery and service fees</p>
        </div>
      )}

      <style>{`
        .order-summary {
          background: var(--card-bg);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .summary-header {
          border-bottom: 1px solid var(--border);
          padding-bottom: 16px;
        }

        .summary-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text-dark);
          margin: 0;
        }

        /* Items Section */
        .items-section {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .items-title {
          font-size: 1rem;
          font-weight: 600;
          color: var(--text-dark);
          margin: 0;
        }

        .items-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .summary-item {
          display: flex;
          gap: 12px;
          align-items: flex-start;
        }

        .item-image {
          width: 60px;
          height: 60px;
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid var(--border);
          flex-shrink: 0;
        }

        .item-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .item-details {
          flex: 1;
          min-width: 0;
        }

        .item-name {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-dark);
          margin-bottom: 4px;
          line-height: 1.3;
        }

        .item-meta {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 4px;
        }

        .item-condition,
        .item-seller {
          font-size: 0.75rem;
          color: var(--text-mid);
        }

        .item-separator {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .item-price {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--svap-blue);
        }

        /* Cost Section */
        .cost-section {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .cost-breakdown {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .cost-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 2px 0;
        }

        .cost-row.highlight {
          background: rgba(65, 88, 214, 0.05);
          padding: 8px 12px;
          border-radius: 6px;
          border: 1px solid rgba(65, 88, 214, 0.2);
        }

        .cost-label {
          font-size: 0.875rem;
          color: var(--text-mid);
        }

        .cost-amount {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-dark);
        }

        .cost-row.free .cost-amount {
          color: var(--svap-lime);
          font-weight: 700;
        }

        .cost-row.highlight .cost-label,
        .cost-row.highlight .cost-amount {
          color: var(--svap-blue);
          font-weight: 600;
        }

        .total-divider {
          height: 1px;
          background: var(--border);
          margin: 4px 0;
        }

        .total-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
        }

        .total-label {
          font-size: 1rem;
          font-weight: 700;
          color: var(--text-dark);
        }

        .total-amount {
          font-size: 1.125rem;
          font-weight: 700;
          color: var(--svap-blue);
        }

        /* Swap Note */
        .swap-note {
          background: var(--bg-section);
          border-radius: 8px;
          padding: 12px 16px;
          border: 1px solid rgba(173, 220, 90, 0.3);
        }

        .swap-note p {
          margin: 0;
          font-size: 0.8rem;
          color: var(--text-mid);
          line-height: 1.4;
        }

        .delivery-coverage-note {
          margin-top: 8px;
        }

        .delivery-coverage-note p {
          margin: 0;
          font-size: 0.75rem;
          color: var(--text-muted);
          line-height: 1.4;
          text-align: center;
        }

        /* Mobile responsiveness */
        @media (max-width: 768px) {
          .order-summary {
            padding: 20px;
          }

          .summary-item {
            gap: 10px;
          }

          .item-image {
            width: 50px;
            height: 50px;
          }

          .item-name {
            font-size: 0.8rem;
          }

          .cost-row.highlight {
            padding: 6px 10px;
          }
        }
      `}</style>
    </div>
  );
};