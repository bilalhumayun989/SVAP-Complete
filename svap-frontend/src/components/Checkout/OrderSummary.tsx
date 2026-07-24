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
  const givingItem = items.find(item => item.role === 'giving');
  const receivingItem = items.find(item => item.role === 'receiving');
  const getOwnerLine = (item: CheckoutItem) =>
    item.seller === 'You' ? 'Owned by You' : `From ${item.seller}`;

  return (
    <div className="order-summary">
      <div className="summary-header">
        <h2 className="summary-title">{getSummaryTitle()}</h2>
      </div>

      {transactionType === 'svap' && givingItem && receivingItem && (
        <div className="swap-route-card">
          <div className="swap-route-title">Swap Route</div>
          <div className="swap-route-grid">
            <div className="swap-route-item">
              <span className="swap-route-label">You Give</span>
              <div className="swap-route-product">
                <img src={givingItem.image} alt={givingItem.name} />
                <div>
                  <p>{givingItem.name}</p>
                  <span>{getOwnerLine(givingItem)}</span>
                </div>
              </div>
            </div>
            <div className="swap-route-divider">to</div>
            <div className="swap-route-item">
              <span className="swap-route-label">You Receive</span>
              <div className="swap-route-product">
                <img src={receivingItem.image} alt={receivingItem.name} />
                <div>
                  <p>{receivingItem.name}</p>
                  <span>{getOwnerLine(receivingItem)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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

        .swap-route-card {
          background: var(--bg-section);
          border: 1px solid rgba(228,88,33,0.22);
          border-radius: 12px;
          padding: 14px;
        }

        .swap-route-title {
          font-size: 0.78rem;
          font-weight: 800;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #E45821;
          margin-bottom: 12px;
        }

        .swap-route-grid {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          gap: 10px;
        }

        .swap-route-label {
          display: block;
          font-size: 0.68rem;
          font-weight: 700;
          color: var(--text-muted);
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .swap-route-product {
          display: flex;
          gap: 9px;
          align-items: center;
          min-width: 0;
        }

        .swap-route-product img {
          width: 42px;
          height: 42px;
          border-radius: 8px;
          object-fit: cover;
          border: 1px solid var(--border);
          flex-shrink: 0;
        }

        .swap-route-product p {
          margin: 0 0 2px;
          color: var(--text-dark);
          font-size: 0.78rem;
          font-weight: 700;
          line-height: 1.25;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .swap-route-product span {
          color: var(--text-muted);
          font-size: 0.68rem;
        }

        .swap-route-divider {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #E45821;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.64rem;
          font-weight: 800;
          text-transform: uppercase;
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

          .swap-route-grid {
            grid-template-columns: 1fr;
          }

          .swap-route-divider {
            transform: rotate(90deg);
            justify-self: center;
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
