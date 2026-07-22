import { useState, useEffect, useCallback } from 'react';
import type { CheckoutItem, DeliveryMethod, CostBreakdown } from '../types/checkout.types';
import { CostCalculator } from '../utils/costCalculations';
import { UI_CONSTANTS } from '../utils/constants';

export const useCostCalculation = (
  items: CheckoutItem[],
  deliveryMethod: DeliveryMethod | null,
  transactionType: 'purchase' | 'svap' = 'purchase'
) => {
  const [costBreakdown, setCostBreakdown] = useState<CostBreakdown>({
    itemsTotal: 0,
    deliveryFee: 0,
    serviceFee: 0,
    totalAmount: 0,
  });
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationError, setCalculationError] = useState<string | null>(null);

  // Calculate costs with debounce to avoid excessive calculations
  const calculateCosts = useCallback(() => {
    if (items.length === 0) {
      setCostBreakdown({
        itemsTotal: 0,
        deliveryFee: 0,
        serviceFee: 0,
        totalAmount: 0,
      });
      return;
    }

    setIsCalculating(true);
    setCalculationError(null);

    // Simulate API delay for real-time feel
    const timeoutId = setTimeout(() => {
      try {
        const newBreakdown = CostCalculator.calculateTotal(
          items,
          deliveryMethod,
          transactionType,
          costBreakdown.cashDifference // Preserve existing cash difference for swaps
        );

        setCostBreakdown(newBreakdown);
        setIsCalculating(false);
      } catch (error) {
        console.error('Cost calculation error:', error);
        setCalculationError('Failed to calculate costs. Please try again.');
        setIsCalculating(false);
      }
    }, UI_CONSTANTS.COST_UPDATE_DELAY);

    return () => clearTimeout(timeoutId);
  }, [items, deliveryMethod, transactionType, costBreakdown.cashDifference]);

  // Recalculate when dependencies change
  useEffect(() => {
    const cleanup = calculateCosts();
    return cleanup;
  }, [calculateCosts]);

  // Calculate delivery fee only
  const getDeliveryFee = useCallback((method: DeliveryMethod | null): number => {
    return CostCalculator.calculateDeliveryFee(method);
  }, []);

  // Calculate service fee only
  const getServiceFee = useCallback((transactionValue: number): number => {
    return CostCalculator.calculateServiceFee(transactionValue);
  }, []);

  // Calculate items total only
  const getItemsTotal = useCallback((itemList: CheckoutItem[]): number => {
    return CostCalculator.calculateItemsTotal(itemList);
  }, []);

  // Format currency for display
  const formatCurrency = useCallback((amount: number): string => {
    return CostCalculator.formatCurrency(amount);
  }, []);

  // Set custom cash difference for swap transactions
  const setCashDifference = useCallback((amount: number) => {
    setCostBreakdown(() => {
      const newBreakdown = CostCalculator.calculateTotal(
        items,
        deliveryMethod,
        transactionType,
        amount
      );
      return { ...newBreakdown, cashDifference: amount };
    });
  }, [items, deliveryMethod, transactionType]);

  // Get cost breakdown summary for display
  const getCostSummary = useCallback(() => {
    const summary = [];
    
    if (transactionType === 'svap' && costBreakdown.cashDifference !== undefined) {
      summary.push({
        label: 'Cash difference',
        amount: costBreakdown.cashDifference,
        formatted: formatCurrency(costBreakdown.cashDifference),
      });
    } else {
      summary.push({
        label: 'Items total',
        amount: costBreakdown.itemsTotal,
        formatted: formatCurrency(costBreakdown.itemsTotal),
      });
    }

    summary.push(
      {
        label: 'Delivery',
        amount: costBreakdown.deliveryFee,
        formatted: costBreakdown.deliveryFee === 0 ? 'Free' : formatCurrency(costBreakdown.deliveryFee),
      },
      {
        label: 'Service fee',
        amount: costBreakdown.serviceFee,
        formatted: formatCurrency(costBreakdown.serviceFee),
      }
    );

    return summary;
  }, [costBreakdown, transactionType, formatCurrency]);

  // Check if costs are significant enough to show breakdown
  const shouldShowBreakdown = useCallback((): boolean => {
    return costBreakdown.totalAmount > 0;
  }, [costBreakdown.totalAmount]);

  return {
    // State
    costBreakdown,
    isCalculating,
    calculationError,
    
    // Actions
    setCashDifference,
    
    // Utilities
    getDeliveryFee,
    getServiceFee,
    getItemsTotal,
    formatCurrency,
    getCostSummary,
    shouldShowBreakdown,
    
    // Manual recalculation trigger
    recalculate: calculateCosts,
  };
};