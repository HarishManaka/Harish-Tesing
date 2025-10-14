// Multi-step checkout configuration
// Import utility functions from utils
import {
  formatCartData,
  PAYMENT_PLANS_MUTATION,
  makeGraphQLCall,
} from '../../../utils/cart-checkout.js';
import { getConfigValue } from '../../../scripts/configs.js';

export const STEP_CONFIGS = {
  // Virtual Only - With Payment Plan
  VIRTUAL_ONLY_WITH_PAYMENT_PLAN: {
    steps: [
      {
        id: 'payment-options',
        nextStepTitle: 'Billing Information',
        ctaTitle: 'Submit Payment Schedule',
      },
      { id: 'billing', nextStepTitle: 'User Agreement', ctaTitle: 'Save' },
      {
        id: 'ric-certification',
        nextStepTitle: 'Terms and Conditions',
        ctaTitle: 'View and Sign User Agreement',
      },
      {
        id: 'place-order',
        nextStepTitle: 'Confirm your order',
        ctaTitle: 'Purchase',
      },
    ],
  },

  // Virtual Only - Without Payment Plan
  VIRTUAL_ONLY_WITHOUT_PAYMENT_PLAN: {
    steps: [
      {
        id: 'billing',
        nextStepTitle: 'Terms and Conditions',
        ctaTitle: 'Save',
      },
      {
        id: 'place-order',
        nextStepTitle: 'Confirm your order',
        ctaTitle: 'Purchase',
      },
    ],
  },

  // Shippable Products - With Payment Plan
  SHIPPABLE_PRODUCTS_WITH_PAYMENT_PLAN: {
    steps: [
      {
        id: 'shipping-details',
        nextStepTitle: 'Shipping Method',
        ctaTitle: 'Continue to Shipping Method',
      },
      {
        id: 'shipping-methods',
        nextStepTitle: 'Select Payment Schedule',
        ctaTitle: 'Continue to Payment Schedule',
      },
      {
        id: 'payment-options',
        nextStepTitle: 'Billing Information',
        ctaTitle: 'Submit Payment Schedule',
      },

      { id: 'billing', nextStepTitle: 'User Agreement', ctaTitle: 'Save' },
      {
        id: 'ric-certification',
        nextStepTitle: 'Terms and Conditions',
        ctaTitle: 'View and Sign User Agreement',
      },
      {
        id: 'place-order',
        nextStepTitle: 'Confirm your order',
        ctaTitle: 'Purchase',
      },
    ],
  },

  // Shippable Products - Without Payment Plan
  SHIPPABLE_PRODUCTS_WITHOUT_PAYMENT_PLAN: {
    steps: [
      {
        id: 'shipping-details',
        nextStepTitle: 'Shipping Method',
        ctaTitle: 'Continue to Shipping Method',
      },
      {
        id: 'shipping-methods',
        nextStepTitle: 'Billing Information',
        ctaTitle: 'Continue to Billing',
      },
      {
        id: 'billing',
        nextStepTitle: 'Terms and Conditions',
        ctaTitle: 'Save & Continue',
      },
      {
        id: 'place-order',
        nextStepTitle: 'Confirm your order',
        ctaTitle: 'Place Order',
      },
    ],
  },

  // Membership Product Only
  MEMBERSHIP_PRODUCT_ONLY: {
    steps: [
      {
        id: 'billing',
        nextStepTitle: 'Terms and Conditions',
        ctaTitle: 'Save',
      },
      {
        id: 'place-order',
        nextStepTitle: 'Confirm your order',
        ctaTitle: 'Purchase',
      },
    ],
  },

  // Virtual Only - Zero Dollar
  VIRTUAL_ONLY_WITH_ZERO_DOLLAR: {
    steps: [
      {
        id: 'place-order',
        nextStepTitle: 'Confirm your order',
        ctaTitle: 'Purchase',
      },
    ],
  },

  // Shippable - Zero Dollar
  SHIPPABLE_WITH_ZERO_DOLLAR: {
    steps: [
      {
        id: 'shipping-details',
        nextStepTitle: 'Shipping Method',
        ctaTitle: 'Continue to Shipping Method',
      },
      {
        id: 'shipping-methods',
        nextStepTitle: 'Terms and Conditions',
        ctaTitle: 'Continue',
      },
      {
        id: 'place-order',
        nextStepTitle: 'Confirm your order',
        ctaTitle: 'Purchase',
      },
    ],
  },
};

// Journey determination utilities
export function isCartHasShippableProducts(_cartData) {
  return _cartData?.isVirtual === false;
}

export function isMembershipOnly(_cartData) {
  return (
    Array.isArray(_cartData?.items)
    && _cartData.items.some((item) => item.itemType !== 'ConfigurableCartItem')
      === false
  );
}

export function isVirtualOnly(_cartData) {
  return _cartData?.isVirtual === true;
}

export async function isEligibleForPaymentOptions(_cartData, loaderContainer) {
  // Check if cart is not membership only
  if (isMembershipOnly(_cartData)) {
    return false;
  }

  // Call the API to check payment plan availability
  try {
    const cartDetails = formatCartData(_cartData, false);
    const cartDetailsBase64 = btoa(JSON.stringify(cartDetails));

    // Make the actual API call to check payment plan availability
    const response = await makeGraphQLCall({
      query: PAYMENT_PLANS_MUTATION,
      variables: { input: { cart_details: cartDetailsBase64 } },
      loaderContainer,
      endpoint: getConfigValue('commerce-endpoint'),
    });

    return response?.data?.paymentPlans?.is_available || false;
  } catch (error) {
    console.error('Error checking payment plan eligibility:', error);
    return false;
  }
}

export function isZeroDollarCart(cartData) {
  return cartData?.total?.includingTax?.value === 0;
}

export async function getCheckoutJourneyType(cartData) {
  if (isZeroDollarCart(cartData)) {
    if (isCartHasShippableProducts(cartData)) {
      return 'SHIPPABLE_WITH_ZERO_DOLLAR';
    }
    if (isVirtualOnly(cartData)) {
      return 'VIRTUAL_ONLY_WITH_ZERO_DOLLAR';
    }
  }

  if (isCartHasShippableProducts(cartData)) {
    if (await isEligibleForPaymentOptions(cartData)) {
      return 'SHIPPABLE_PRODUCTS_WITH_PAYMENT_PLAN';
    }
    return 'SHIPPABLE_PRODUCTS_WITHOUT_PAYMENT_PLAN';
  }

  if (isVirtualOnly(cartData)) {
    if (await isEligibleForPaymentOptions(cartData)) {
      return 'VIRTUAL_ONLY_WITH_PAYMENT_PLAN';
    }
    return 'VIRTUAL_ONLY_WITHOUT_PAYMENT_PLAN';
  }

  if (isMembershipOnly(cartData)) {
    return 'MEMBERSHIP_PRODUCT_ONLY';
  }

  return 'SHIPPABLE_PRODUCTS_WITHOUT_PAYMENT_PLAN';
}

// create a shared storage for braintree dropin data
export const braintreeDropinData = {
  instance: null,
  set(value) {
    this.instance = value;
  },
  get() {
    return this.instance;
  },
};
