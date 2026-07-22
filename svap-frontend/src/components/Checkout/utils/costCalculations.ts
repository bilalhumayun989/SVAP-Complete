import type { CheckoutItem, DeliveryMethod, CostBreakdown } from '../types/checkout.types';
import { COST_CONSTANTS } from './constants';

export class CostCalculator {
  /**
   * Calculate delivery fee based on selected method
   */
  static calculateDeliveryFee(method: DeliveryMethod | null): number {
    if (!method) return 0;
    return method.cost;
  }

  /**
   * Calculate service fee (3% of transaction value, minimum Rs 50)
   */
  static calculateServiceFee(transactionValue: number): number {
    const calculatedFee = transactionValue * COST_CONSTANTS.SERVICE_FEE_PERCENTAGE;
    return Math.max(calculatedFee, COST_CONSTANTS.MINIMUM_SERVICE_FEE);
  }

  /**
   * Calculate total value of items
   */
  static calculateItemsTotal(items: CheckoutItem[]): number {
    return items.reduce((total, item) => {
      // Extract numeric value from price string (e.g., "Rs 15,000" -> 15000)
      if (item.price) {
        const numericPrice = parseFloat(item.price.replace(/[^\d.]/g, ''));
        return total + (numericPrice || COST_CONSTANTS.DEFAULT_ITEM_VALUE);
      }
      return total + (item.swapValue || COST_CONSTANTS.DEFAULT_ITEM_VALUE);
    }, 0);
  }

  /**
   * Calculate cash difference for swap transactions
   * This would typically compare market values of swapped items
   */
  static calculateSwapDifference(
    userItems: CheckoutItem[], 
    targetItems: CheckoutItem[]
  ): number {
    const userValue = this.calculateItemsTotal(userItems);
    const targetValue = this.calculateItemsTotal(targetItems);
    return Math.abs(targetValue - userValue);
  }

  /**
   * Calculate complete cost breakdown
   */
  static calculateTotal(
    items: CheckoutItem[],
    deliveryMethod: DeliveryMethod | null,
    transactionType: 'purchase' | 'svap' = 'purchase',
    cashDifference?: number
  ): CostBreakdown {
    const itemsTotal = this.calculateItemsTotal(items);
    const deliveryFee = this.calculateDeliveryFee(deliveryMethod);
    
    // For swaps, base service fee on the higher value item
    const serviceFeeBase = transactionType === 'svap' && cashDifference
      ? Math.max(itemsTotal, cashDifference)
      : itemsTotal;
    
    const serviceFee = this.calculateServiceFee(serviceFeeBase);
    
    // Total calculation differs for purchase vs swap
    let totalAmount: number;
    if (transactionType === 'svap') {
      // For swaps: cash difference + delivery + service fee
      totalAmount = (cashDifference || 0) + deliveryFee + serviceFee;
    } else {
      // For purchases: item total + delivery + service fee  
      totalAmount = itemsTotal + deliveryFee + serviceFee;
    }

    return {
      itemsTotal,
      cashDifference: transactionType === 'svap' ? cashDifference : undefined,
      deliveryFee,
      serviceFee,
      totalAmount,
    };
  }

  /**
   * Format currency for display
   */
  static formatCurrency(amount: number): string {
    return `PKR ${amount.toLocaleString()}`;
  }

  /**
   * Parse price string to number
   */
  static parsePriceString(priceStr: string): number {
    const cleaned = priceStr.replace(/[^\d.]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }
}