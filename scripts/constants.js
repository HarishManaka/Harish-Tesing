export const SUPPORT_PATH = '/support';
export const PRIVACY_POLICY_PATH = '/privacy-policy';
export const TAX_LABEL = 'Tax';
export const SELECTED_PAYMENT_PLAN = 'selected_payment_plan';
export const BILLING_ADDRESS_ID = 'billingAddressId';
export const SHIPPING_ADDRESS_ID = 'shippingAddressId';
export const CART_HAS_REGULAR_PRODUCTS = 'cartHasRegularProducts';
export const RECENT_ORDER_DETAILS = 'recentlyPlacedOrderDetails';
export const CART_SELECTED_PAYMENT_PLAN = 'cartSelectedPaymentPlan';

export const ORDER_STATUS_PATH = '/order-status';
export const ORDER_DETAILS_PATH = '/order-details';
export const RETURN_DETAILS_PATH = '/return-details';
export const CREATE_RETURN_PATH = '/create-return';
export const SALES_GUEST_VIEW_PATH = '/sales/guest/view/';
export const CHECKOUT_PATH = '/checkout';
export const CART_PATH = '/cart';
export const ORDER_HELP_PATH = '/order-help';
export const LOGIN_PATH = '/login';
export const LOGIN_REDIRECT_TO_CHECKOUT = '/login?redirect_url=/checkout';
export const ORDER_CONFIRMATION_PATH = '/checkout/success';
export const QUOTE_MASKED_ID = 'quote_masked_id';
export const CART_TYPE = 'cart_type';
export const CART_SKU_LIST = 'cart_sku_list'; // Adding a comment to force push this in the build

export const CUSTOMER_PATH = '/customer';
export const CUSTOMER_ORDER_DETAILS_PATH = `${CUSTOMER_PATH}${ORDER_DETAILS_PATH}`;
export const CUSTOMER_RETURN_DETAILS_PATH = `${CUSTOMER_PATH}${RETURN_DETAILS_PATH}`;
export const CUSTOMER_CREATE_RETURN_PATH = `${CUSTOMER_PATH}${CREATE_RETURN_PATH}`;
export const CUSTOMER_ORDERS_PATH = `${CUSTOMER_PATH}/orders`;
export const CUSTOMER_RETURNS_PATH = `${CUSTOMER_PATH}/returns`;
export const CUSTOMER_ADDRESS_PATH = `${CUSTOMER_PATH}/address`;
export const CUSTOMER_LOGIN_PATH = `${CUSTOMER_PATH}/login`;
export const CUSTOMER_ACCOUNT_PATH = `${CUSTOMER_PATH}/account`;
export const CUSTOMER_FORGOTPASSWORD_PATH = `${CUSTOMER_PATH}/forgotpassword`;
export const SALES_ORDER_VIEW_PATH = '/sales/order/view/';

export const ORDER_ERROR_MESSAGE = 'Unable to load order details. Please try again later.';
export const ORDER_NOT_FOUND_MESSAGE = 'Order not found.';
export const FALLBACK_GENERIC_ERROR = 'We are experiencing technical difficulties. Please try again later';
export const GOOGLE_MAPS_API_URL = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyBS38NweYM3yspKtd1QacHF0Wrei14Jjac&libraries=places';
export const OPTIMIZELY_SCRIPT_PATH = 'https://cdn.optimizely.com/js/25023950326.js';
export const CROSS_SELL_PRODUCTS_LIMIT = 3;

export const LOGIN_SESSION_MODAL_DESC = 'Your session has expired. Please login to continue.';
export const LOGIN_SESSION_MODAL_CTA_LABEL = 'Continue';
export const LOGIN_SESSION_MODAL_HEADING = 'SESSION UNAVAILABLE';
export const ORDERPLACE_ERROR_MODAL_HEADING = 'Your cart has been updated';
export const ORDERPLACE_ERROR_MODAL_DESCRIPTION = 'The items in your cart have changed since you started checkout. To continue, please restart checkout again.';
export const ORDERPLACE_ERROR_MODAL_CTA_LABEL = 'Restart Checkout';

// TRACKING
export const UPS_TRACKING_URL = 'https://www.ups.com/track';

// Fragments
export const SECURE_BADGE = '/fragments/secure-badge-fragment';

// PLP Pages
export const NASM_PATH = '/nasm';
export const AFAA_PATH = '/afaa';
// REUSABLE SLOTS
export const authPrivacyPolicyConsentSlot = {
  PrivacyPolicyConsent: async (ctx) => {
    const wrapper = document.createElement('span');
    Object.assign(wrapper.style, {
      color: 'var(--color-neutral-700)',
      font: 'var(--type-details-caption-2-font)',
      display: 'block',
      marginBottom: 'var(--spacing-medium)',
    });

    const link = document.createElement('a');
    link.href = PRIVACY_POLICY_PATH;
    link.target = '_blank';
    link.textContent = 'Privacy Policy';

    wrapper.append(
      'By creating an account, you acknowledge that you have read and agree to our ',
      link,
      ', which outlines how we collect, use, and protect your personal data.',
    );

    ctx.appendChild(wrapper);
  },
};
