import {
  setCustomAttributesOnCart,
  ENV_CONFIG,
  showErrorMessage,
} from '../../utils/cart-checkout.js';
import { getEnvironment } from '../../scripts/configs.js';
import {
  SELECTED_PAYMENT_PLAN,
} from '../../scripts/constants.js';

// Create MFE element
function createMFEElement({
  cartHash, cartDetails, viewOnly = false, ppId = '',
}) {
  const mfeElement = document.createElement('payment-plan-selection-mfe');
  // Get API URL from imported environment config
  const environment = getEnvironment();
  const config = ENV_CONFIG[environment] || ENV_CONFIG.qa;

  mfeElement.setAttribute('api-url', config.apiUrl);
  mfeElement.setAttribute('pp-id', ppId);
  mfeElement.setAttribute('cart-obj', JSON.stringify(cartDetails?.cart));
  mfeElement.setAttribute('key-generated', cartHash);
  mfeElement.setAttribute('view-only', viewOnly ? 'true' : 'false');
  return mfeElement;
}

// Store payment plan selection data
let selectedPaymentPlanData = null;

// Main function to render payment plan MFE
export default async function renderPaymentPlanMFE({
  container,
  cartData,
  labels,
  loaderContainer,
  handleUpdatePaymentPlan,
  ctaTitle,
  cartHash,
  cartDetails,
  viewOnly = false,
  ppId = '',
}) {
  try {
    container.innerHTML = '';

    if (!cartHash || !cartDetails) {
      console.error('cartHash and cartDetails are required');
      return;
    }

    const mfeElement = createMFEElement({
      cartHash,
      cartDetails,
      viewOnly,
      ppId,
    });

    container.appendChild(mfeElement);

    // Only add CTA button and event listeners if not in view-only mode
    if (!viewOnly) {
      // Create and append CTA button
      const ctaButton = document.createElement('button');
      ctaButton.className = 'payment-plan-cta-button dropin-button dropin-button--medium';
      ctaButton.textContent = ctaTitle || 'Update Payment Schedule';
      ctaButton.disabled = true;

      // Listen for payment plan selection events from the MFE
      mfeElement.addEventListener('paymentPlanSelectionEvent', (event) => {
        selectedPaymentPlanData = event.detail;
        ctaButton.disabled = false;
      });

      ctaButton.addEventListener('click', async () => {
        try {
          // Check if we have selected payment plan data
          if (!selectedPaymentPlanData) {
            console.error('No payment plan selected.');
            return;
          }

          const cartId = cartData.id;
          const customAttributes = [
            {
              attribute_code: SELECTED_PAYMENT_PLAN,
              value: JSON.stringify(selectedPaymentPlanData),
            },
          ];

          // Call the mutation to set custom attributes
          const result = await setCustomAttributesOnCart(
            cartId,
            customAttributes,
            loaderContainer,
          );
          if (result && !result.errors?.length) {
            handleUpdatePaymentPlan(selectedPaymentPlanData);
            container.innerHTML = '';
            document.dispatchEvent(new CustomEvent('payment-plan-submitted', { detail: true }));
          }
        } catch (error) {
          console.error(error);
        }
      });
      container.appendChild(ctaButton);
    }

    // Fire custom event to notify that payment-plan-selection-mfe is ready
    const readyEvent = new CustomEvent('paymentPlanMFEReady', {
      detail: { element: mfeElement },
    });

    document.dispatchEvent(readyEvent);
    document.dispatchEvent(new CustomEvent('payment-plan-submitted', { detail: false }));
  } catch (error) {
    showErrorMessage(container, labels);
  }
}
