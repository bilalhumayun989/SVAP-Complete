import { useState, useCallback, useEffect } from 'react';
import type { 
  CheckoutState, 
  CheckoutItem, 
  DeliveryAddress, 
  DeliveryMethod, 
  PaymentMethod,
  NavigationData 
} from '../types/checkout.types';
import { CostCalculator } from '../utils/costCalculations';
import { CheckoutValidator } from '../utils/validation';
import { api } from '../../../services/api';

const initialState: CheckoutState = {
  transactionType: 'purchase',
  items: [],
  entrySource: 'product',
  deliveryAddress: null,
  deliveryMethod: null,
  paymentMethod: null,
  costBreakdown: {
    itemsTotal: 0,
    deliveryFee: 0,
    serviceFee: 0,
    totalAmount: 0,
  },
  isLoading: false,
  errors: {},
  isValid: false,
};

// Default address for development - could be loaded from user profile
const getDefaultAddress = (): DeliveryAddress => ({
  fullName: 'Ali Raza',
  streetAddress: 'House 12-6, DHA Phase 6',
  city: 'Karachi',
  province: 'Sindh',
  postalCode: '75500',
  phone: '+92 300 1234567',
  isDefault: true,
});

const getSavedUserId = () => {
  try {
    return JSON.parse(localStorage.getItem('sz_user') || '{}').id || null;
  } catch {
    return null;
  }
};

export const useCheckoutState = (navigationData?: NavigationData) => {
  const [state, setState] = useState<CheckoutState>(initialState);

  // Initialize checkout state based on navigation data
  useEffect(() => {
    if (navigationData) {
      let cancelled = false;
      let items: CheckoutItem[] = [];
      let transactionType: 'purchase' | 'svap' = 'purchase';
      const entrySource = navigationData.entrySource === 'swap' ? 'svap' : navigationData.entrySource;

      // Convert navigation data to checkout items
      if (navigationData.entrySource === 'product' && navigationData.productId) {
        // Single product - would normally fetch from API
        items = [{
          id: navigationData.productId,
          name: 'Sample Product',
          image: '/1.png',
          price: 'PKR 15,000',
          condition: 'Good',
          seller: 'John Doe',
        }];
      } else if ((navigationData.entrySource === 'svap' || navigationData.entrySource === 'swap') && navigationData.swapRequestId) {
        transactionType = 'svap';
        const userId = getSavedUserId();

        setState(prev => ({
          ...prev,
          transactionType,
          entrySource,
          deliveryAddress: getDefaultAddress(),
          isLoading: true,
        }));

        if (userId) {
          api.getSwapRequestsByUser(userId).then((res) => {
            if (cancelled) return;

            const request = (res.data || []).find((r: any) => r.id === navigationData.swapRequestId);
            if (!request) {
              setState(prev => ({
                ...prev,
                items: [],
                isLoading: false,
              }));
              return;
            }

            const isSender = request.from_user_id === userId;
            const offeredItem: CheckoutItem = {
              id: request.offered_product_id,
              name: request.offered?.title || 'Offered Product',
              image: request.offered?.image_urls?.[0] || '/1.png',
              swapValue: 0,
              condition: 'Swap item',
              seller: isSender ? 'You' : `@${request.from_profile?.username || 'Deleted User'}`,
              role: isSender ? 'giving' : 'receiving',
            };
            const requestedItem: CheckoutItem = {
              id: request.requested_product_id,
              name: request.requested?.title || 'Requested Product',
              image: request.requested?.image_urls?.[0] || '/2.png',
              swapValue: 0,
              condition: 'Swap item',
              seller: isSender ? `@${request.to_profile?.username || 'Deleted User'}` : 'You',
              role: isSender ? 'receiving' : 'giving',
            };

            setState(prev => ({
              ...prev,
              items: isSender ? [offeredItem, requestedItem] : [requestedItem, offeredItem],
              isLoading: false,
            }));
          }).catch((err) => {
            console.error('[checkout-swap-request]', err);
            if (!cancelled) {
              setState(prev => ({ ...prev, isLoading: false }));
            }
          });
        } else {
          setState(prev => ({ ...prev, isLoading: false }));
        }

        return () => { cancelled = true; };
      } else if (navigationData.entrySource === 'cart' && navigationData.cartItems) {
        // Convert cart items to checkout items
        items = navigationData.cartItems.map((cartItem, index) => ({
          id: cartItem.id?.toString() || index.toString(),
          name: cartItem.name || 'Cart Item',
          image: cartItem.image || '/1.png',
          price: cartItem.price,
          condition: 'Good',
          seller: 'Various',
        }));
      }

      setState(prev => ({
        ...prev,
        items,
        transactionType,
        entrySource,
        deliveryAddress: getDefaultAddress(), // Load default address
      }));
    }
  }, [navigationData]);

  // Recalculate costs when relevant state changes
  useEffect(() => {
    const newCostBreakdown = CostCalculator.calculateTotal(
      state.items,
      state.deliveryMethod,
      state.transactionType,
      state.costBreakdown.cashDifference
    );

    setState(prev => ({ ...prev, costBreakdown: newCostBreakdown }));
  }, [state.items, state.deliveryMethod, state.transactionType]);

  // Validate form when relevant fields change
  useEffect(() => {
    const validation = CheckoutValidator.validateCheckoutForm(
      state.deliveryAddress,
      state.deliveryMethod,
      state.paymentMethod
    );

    setState(prev => ({
      ...prev,
      isValid: validation.isValid,
      errors: CheckoutValidator.formatErrorsForDisplay(validation.errors),
    }));
  }, [state.deliveryAddress, state.deliveryMethod, state.paymentMethod]);

  // Action to update delivery address
  const setDeliveryAddress = useCallback((address: DeliveryAddress) => {
    setState(prev => ({ ...prev, deliveryAddress: address }));
  }, []);

  // Action to update delivery method
  const setDeliveryMethod = useCallback((method: DeliveryMethod) => {
    setState(prev => ({ ...prev, deliveryMethod: method }));
  }, []);

  // Action to update payment method
  const setPaymentMethod = useCallback((method: PaymentMethod) => {
    setState(prev => ({ ...prev, paymentMethod: method }));
  }, []);

  // Action to set loading state
  const setLoading = useCallback((isLoading: boolean) => {
    setState(prev => ({ ...prev, isLoading }));
  }, []);

  // Action to set custom errors
  const setErrors = useCallback((errors: Record<string, string>) => {
    setState(prev => ({ ...prev, errors }));
  }, []);

  // Action to clear errors
  const clearErrors = useCallback(() => {
    setState(prev => ({ ...prev, errors: {} }));
  }, []);

  // Get error for specific field
  const getFieldError = useCallback((field: string): string | undefined => {
    return state.errors[field];
  }, [state.errors]);

  // Check if field has error
  const hasFieldError = useCallback((field: string): boolean => {
    return !!state.errors[field];
  }, [state.errors]);

  return {
    // State
    state,
    
    // Actions
    setDeliveryAddress,
    setDeliveryMethod,
    setPaymentMethod,
    setLoading,
    setErrors,
    clearErrors,
    
    // Utilities
    getFieldError,
    hasFieldError,
  };
};
