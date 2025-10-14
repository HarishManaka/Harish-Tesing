// eslint-disable-next-line import/no-relative-packages
import GtmMartech from '../plugins/gtm-martech/src/index.js';

// For DA Preview support - disable tracking when martech=off parameter is present
const disabled = window.location.search.includes('martech=off');

/**
 * Check consent status
 * This is a placeholder - integrate with your actual consent management system
 */
async function checkConsent() {
  return new Promise((resolve) => {
    // TODO: Integrate with your actual consent management system
    // For now, we'll grant basic analytics consent
    resolve({
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'granted',
      functionality_storage: 'granted',
      personalization_storage: 'denied',
      security_storage: 'granted',
    });
  });
}

/**
 * Decorate sections and blocks for event tracking
 */
function decorateEvents(el) {
  if (el.classList.contains('block')) {
    // Add event tracking to blocks
    if (el.classList.contains('commerce-cart')) {
      // Track cart interactions
      decorateCartEvents(el);
    } else if (el.classList.contains('commerce-checkout')) {
      // Track checkout interactions
      decorateCheckoutEvents(el);
    } else if (el.classList.contains('product-details')) {
      // Track product page interactions
      decorateProductEvents(el);
    } else if (el.classList.contains('banner-cta') || el.classList.contains('banner')) {
      // Track CTA clicks
      decorateCTAEvents(el);
    }
  } else if (el.classList.contains('section')) {
    // Track section impressions if needed
    // You can add section-level tracking here
  }
}

/**
 * Decorate cart events
 */
function decorateCartEvents(_cartBlock) {
  // NOTE: add_to_cart event tracking is now handled consistently with the
  // approach using transformCartDataForGA4() and trackGTMEvent() functions.
  //
  // Individual blocks (product-details, payment-plans, etc.) call:
  // 1. setupAddToCartDataLayer() - Sets product context in Adobe Data Layer
  // 2. trackAddToCartGA4() - Tracks the event using Commerce team's GA4 format
}

/**
 * Decorate checkout events
 */
function decorateCheckoutEvents(_checkoutBlock) {
  // Track checkout steps, payment selection, etc.
  // Will be enhanced based on your checkout flow
}

/**
 * Decorate product events
 */
function decorateProductEvents(_productBlock) {
  // Track product views, variant selection, etc.
  // Will integrate with product detail events
}

/**
 * Decorate CTA events
 */
function decorateCTAEvents(ctaBlock) {
  const ctaButtons = ctaBlock.querySelectorAll('a, button');
  ctaButtons.forEach((button) => {
    button.addEventListener('click', () => {
      // martech will be available when this function is called
      // eslint-disable-next-line no-use-before-define
      martech.pushToDataLayer({
        event: 'cta_click',
        cta_text: button.textContent.trim(),
        cta_location: ctaBlock.className,
      });
    });
  });
}

// Initialize GTM Martech
const martech = new GtmMartech({
  analytics: !disabled, // Keep analytics enabled
  // GA4 Measurement ID removed - GTM will manage this internally
  tags: [],
  containers: {
    // GTM Container ID - loaded in lazy phase for optimal performance
    lazy: [
      'GTM-MLM8WDHN',
    ],
    delayed: [
      // Add any additional delayed containers here if needed
    ],
  },
  pageMetadata: {
    // Add any default page metadata here
    site_name: 'NASM',
    content_group1: 'NASM Site',
  },
  consent: !disabled,
  consentCallback: checkConsent,
  decorateCallback: decorateEvents,
});

export default martech;
