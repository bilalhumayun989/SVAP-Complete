import type { DeliveryMethod, PaymentMethod } from '../types/checkout.types';

// Delivery method constants
export const DELIVERY_METHODS: DeliveryMethod[] = [
  {
    id: 'standard',
    name: 'Standard',
    description: '3-5 days',
    estimatedDays: '3-5 business days',
    cost: 300,
    isRecommended: true,
  },
  {
    id: 'express',
    name: 'Express',
    description: '24h delivery',
    estimatedDays: '1-2 business days',
    cost: 800,
  }
];

// Payment method constants
export const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'card',
    name: 'Card',
    description: 'Credit/Debit cards',
    icon: 'card',
  },
  {
    id: 'jazzcash',
    name: 'JazzCash',
    description: 'Mobile wallet',
    icon: 'jazzcash',
    isRecommended: true,
  },
  {
    id: 'easypaisa',
    name: 'EasyPaisa',
    description: 'Mobile wallet',
    icon: 'easypaisa',
  }
];

// Cost calculation constants
export const COST_CONSTANTS = {
  SERVICE_FEE_PERCENTAGE: 0.03, // 3%
  MINIMUM_SERVICE_FEE: 50, // Rs 50 minimum
  DEFAULT_ITEM_VALUE: 1000, // Default value for items without price
};

// Validation constants
export const VALIDATION_RULES = {
  REQUIRED_ADDRESS_FIELDS: ['fullName', 'streetAddress', 'city', 'phone'] as const,
  PHONE_REGEX: /.*/, // Allow any phone for testing
  POSTAL_CODE_REGEX: /.*/, // Allow any postal code for testing
  MIN_NAME_LENGTH: 2,
  MAX_NAME_LENGTH: 50,
  MIN_ADDRESS_LENGTH: 5,
  MAX_ADDRESS_LENGTH: 100,
};

// UI Constants
export const UI_CONSTANTS = {
  COST_UPDATE_DELAY: 500, // ms delay for cost calculations
  FORM_DEBOUNCE_DELAY: 300, // ms delay for form validation
};