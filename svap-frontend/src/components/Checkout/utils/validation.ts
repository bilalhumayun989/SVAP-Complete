import type { DeliveryAddress, CheckoutError } from '../types/checkout.types';
import { VALIDATION_RULES } from './constants';

export class CheckoutValidator {
  /**
   * Validate delivery address
   */
  static validateAddress(address: DeliveryAddress | null): CheckoutError[] {
    const errors: CheckoutError[] = [];
    
    if (!address) {
      errors.push({
        field: 'address',
        type: 'validation',
        message: 'Delivery address is required',
        actionable: true,
      });
      return errors;
    }

    // Check required fields
    VALIDATION_RULES.REQUIRED_ADDRESS_FIELDS.forEach(field => {
      if (!address[field] || address[field].trim().length === 0) {
        errors.push({
          field: `address.${field}`,
          type: 'validation',
          message: `${this.getFieldDisplayName(field)} is required`,
          actionable: true,
        });
      }
    });

    // Validate full name
    if (address.fullName) {
      if (address.fullName.length < VALIDATION_RULES.MIN_NAME_LENGTH) {
        errors.push({
          field: 'address.fullName',
          type: 'validation',
          message: `Name must be at least ${VALIDATION_RULES.MIN_NAME_LENGTH} characters`,
          actionable: true,
        });
      }
      if (address.fullName.length > VALIDATION_RULES.MAX_NAME_LENGTH) {
        errors.push({
          field: 'address.fullName',
          type: 'validation',
          message: `Name must not exceed ${VALIDATION_RULES.MAX_NAME_LENGTH} characters`,
          actionable: true,
        });
      }
    }

    // Validate street address
    if (address.streetAddress) {
      if (address.streetAddress.length < VALIDATION_RULES.MIN_ADDRESS_LENGTH) {
        errors.push({
          field: 'address.streetAddress',
          type: 'validation',
          message: `Address must be at least ${VALIDATION_RULES.MIN_ADDRESS_LENGTH} characters`,
          actionable: true,
        });
      }
      if (address.streetAddress.length > VALIDATION_RULES.MAX_ADDRESS_LENGTH) {
        errors.push({
          field: 'address.streetAddress',
          type: 'validation',
          message: `Address must not exceed ${VALIDATION_RULES.MAX_ADDRESS_LENGTH} characters`,
          actionable: true,
        });
      }
    }

    // Validate phone number
    if (address.phone && !VALIDATION_RULES.PHONE_REGEX.test(address.phone)) {
      errors.push({
        field: 'address.phone',
        type: 'validation',
        message: 'Please enter a valid Pakistani phone number',
        actionable: true,
      });
    }

    // Validate postal code if provided
    if (address.postalCode && !VALIDATION_RULES.POSTAL_CODE_REGEX.test(address.postalCode)) {
      errors.push({
        field: 'address.postalCode',
        type: 'validation',
        message: 'Please enter a valid 5-digit postal code',
        actionable: true,
      });
    }

    return errors;
  }

  /**
   * Validate delivery method selection
   */
  static validateDeliveryMethod(method: any): CheckoutError[] {
    const errors: CheckoutError[] = [];
    
    if (!method) {
      errors.push({
        field: 'deliveryMethod',
        type: 'validation',
        message: 'Please select a delivery method',
        actionable: true,
      });
    }

    return errors;
  }

  /**
   * Validate payment method selection
   */
  static validatePaymentMethod(method: any): CheckoutError[] {
    const errors: CheckoutError[] = [];
    
    if (!method) {
      errors.push({
        field: 'paymentMethod',
        type: 'validation',
        message: 'Please select a payment method',
        actionable: true,
      });
    }

    return errors;
  }

  /**
   * Validate complete checkout form
   */
  static validateCheckoutForm(
    address: DeliveryAddress | null,
    deliveryMethod: any,
    paymentMethod: any
  ): { isValid: boolean; errors: CheckoutError[] } {
    const errors: CheckoutError[] = [
      ...this.validateAddress(address),
      ...this.validateDeliveryMethod(deliveryMethod),
      ...this.validatePaymentMethod(paymentMethod),
    ];

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get display name for field
   */
  private static getFieldDisplayName(field: string): string {
    const fieldNames: Record<string, string> = {
      fullName: 'Full name',
      streetAddress: 'Street address',
      city: 'City',
      province: 'Province',
      postalCode: 'Postal code',
      phone: 'Phone number',
    };
    return fieldNames[field] || field;
  }

  /**
   * Format validation errors for display
   */
  static formatErrorsForDisplay(errors: CheckoutError[]): Record<string, string> {
    const formattedErrors: Record<string, string> = {};
    
    errors.forEach(error => {
      if (error.field) {
        formattedErrors[error.field] = error.message;
      }
    });

    return formattedErrors;
  }
}