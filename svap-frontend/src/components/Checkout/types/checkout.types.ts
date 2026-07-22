// Core checkout data types
export interface CheckoutItem {
  id: string;
  name: string;
  image: string;
  price?: string;
  swapValue?: number;
  condition: string;
  seller: string;
}

export interface DeliveryAddress {
  id?: string;
  fullName: string;
  streetAddress: string;
  city: string;
  province: string;
  postalCode: string;
  phone: string;
  isDefault?: boolean;
}

export interface DeliveryMethod {
  id: string;
  name: string;
  description: string;
  estimatedDays: string;
  cost: number;
  isRecommended?: boolean;
}

export interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  icon: string;
  isRecommended?: boolean;
  processingFee?: number;
}

export interface CostBreakdown {
  itemsTotal: number;
  cashDifference?: number; // For swap transactions
  deliveryFee: number;
  serviceFee: number;
  totalAmount: number;
}

export interface CheckoutState {
  // Entry data
  transactionType: 'purchase' | 'svap';
  items: CheckoutItem[];
  entrySource: 'product' | 'svap' | 'cart';
  
  // Form state
  deliveryAddress: DeliveryAddress | null;
  deliveryMethod: DeliveryMethod | null;
  paymentMethod: PaymentMethod | null;
  
  // Calculated values
  costBreakdown: CostBreakdown;
  
  // UI state
  isLoading: boolean;
  errors: Record<string, string>;
  isValid: boolean;
}

export interface NavigationData {
  entrySource: 'product' | 'svap' | 'cart';
  productId?: string;
  swapRequestId?: string;
  cartItems?: any[]; // Cart item type from cart system
}

export interface TransactionData {
  id: string;
  userId: string;
  type: 'purchase' | 'svap';
  items: CheckoutItem[];
  deliveryAddress: DeliveryAddress;
  deliveryMethod: DeliveryMethod;
  paymentMethod: PaymentMethod;
  costBreakdown: CostBreakdown;
  status: 'pending' | 'confirmed' | 'failed';
  createdAt: Date;
}

export interface CheckoutError {
  field?: string;
  type: 'validation' | 'network' | 'server' | 'payment';
  message: string;
  actionable?: boolean;
}