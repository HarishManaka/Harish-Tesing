import { h } from '@dropins/tools/preact.js';
import { useState, useEffect, useRef } from '@dropins/tools/preact-hooks.js';
import * as cartAPI from '@dropins/storefront-cart/api.js';
import renderPaymentPlanMFE from '../../../../custom-blocks/payment-plan-mfe/payment-plan-mfe.js';
import htm from '../../../../scripts/htm.js';
import ProgressBar from '../../../../custom-blocks/progress-bar/progress-bar.js';
import useStepFocus from '../hooks/useStepFocus.js';
import { CART_SELECTED_PAYMENT_PLAN } from '../../../../scripts/constants.js';
import {
  displayOverlaySpinner,
  removeOverlaySpinner,
  formatCartData,
  getXSRFToken,
  makeGraphQLCall,
  HASH_GENERATOR_MUTATION,
  showErrorMessage,
} from '../../../../utils/cart-checkout.js';
import { getConfigValue, trackGTMEvent } from '../../../../scripts/configs.js';

const html = htm.bind(h);

const endpoint = getConfigValue('commerce-endpoint');

// Get cart hash from hash generator API
async function getCartHash({
  container, cartData, labels, loaderContainer, stepData,
}) {
  try {
    const xsrfToken = getXSRFToken();
    if (!xsrfToken) return { cartHash: null, cartDetails: null };

    const cartObjForHash = {
      ...cartData,
      shipping: stepData['shipping-methods']?.selectedMethod?.amountInclTax,
    };

    const cartDetails = formatCartData(cartObjForHash, true);

    const cartDetailsBase64 = btoa(JSON.stringify(cartDetails));

    const response = await makeGraphQLCall({
      query: HASH_GENERATOR_MUTATION,
      variables: {
        input: {
          cart_details: cartDetailsBase64,
          xsrf_token: xsrfToken,
        },
      },
      loaderContainer,
      errorHandler: () => showErrorMessage(container, labels),
      endpoint,
    });

    if (!response || response?.errors?.length > 0) {
      return {
        cartHash: null,
        cartDetails: null,
      };
    }

    return {
      cartHash: response.data.hashGenerator.cart_hash,
      cartDetails,
    };
  } catch (error) {
    showErrorMessage(container, labels);
    return { cartHash: null, cartDetails: null };
  }
}

export default function PaymentOptions({
  stepId,
  nextStepTitle,
  ctaTitle,
  isCompleted,
  isEditing,
  onComplete,
  onEdit,
  stepData,
  stepNum,
  totalSteps,
  labels,
}) {
  const [selectedOption, setSelectedOption] = useState(null);
  const [paymentPlanMFEInitialized, setPaymentPlanMFEInitialized] = useState(false);
  const [isShowTaxChangeMessage, setIsShowTaxChangeMessage] = useState(false);
  const [cartData, setCartData] = useState(null);
  const [cartHashData, setCartHashData] = useState(null);
  const paymentPlanMFEContainerRef = useRef(null);
  const paymentPlanMFEViewOnlyContainerRef = useRef(null);
  const checkoutStepsLoadingSpinnerRef = useRef(null);
  const checkoutStepsLoadingSpinnerViewOnlyRef = useRef(null);

  const stepTitleRef = useStepFocus(isCompleted, isEditing, stepNum, totalSteps);

  // Update selectedOption when handleUpdatePaymentPlan is called
  const handleUpdatePaymentPlan = (paymentOption) => {
    const trackingData = paymentOption.planDuration === 0 ? 'Pay in Full' : `$${paymentOption?.downPayment} down PLUS ${paymentOption?.planDuration} equal payments of ${paymentOption?.scheduledPaymentAmount}`;

    if (paymentOption) {
      setIsShowTaxChangeMessage(false);

      trackGTMEvent({
        payment_type: trackingData,
      });

      setSelectedOption(paymentOption);
      sessionStorage.setItem(CART_SELECTED_PAYMENT_PLAN, JSON.stringify(paymentOption));
      onComplete(stepId, { paymentOption });
    }
  };

  useEffect(() => {
    if (isEditing) {
      setSelectedOption(null);
      setPaymentPlanMFEInitialized(false);
      setCartHashData(null);
      const isCartTaxUpdated = sessionStorage.getItem('isTaxUpdated');
      if (isCartTaxUpdated) {
        setIsShowTaxChangeMessage(true);
        sessionStorage.removeItem('isTaxUpdated');
      }
    }
  }, [isEditing]);

  useEffect(async () => {
    if ((!isCompleted || isEditing) && !paymentPlanMFEInitialized) {
      paymentPlanMFEContainerRef.current.innerHTML = '';

      // TODO - fixing blocker issue will revisit this code again
      displayOverlaySpinner(checkoutStepsLoadingSpinnerRef.current, 'checkout__steps-loading-spinner');
      const fetchedCartData = await cartAPI?.getCartData();
      setCartData(fetchedCartData);

      // Get cart hash locally
      const hashResult = await getCartHash({
        container: paymentPlanMFEContainerRef.current,
        cartData: fetchedCartData,
        labels,
        loaderContainer: checkoutStepsLoadingSpinnerRef.current,
        stepData,
      });

      setCartHashData(hashResult);
      removeOverlaySpinner(checkoutStepsLoadingSpinnerRef.current);

      if (hashResult.cartHash && hashResult.cartDetails) {
        renderPaymentPlanMFE({
          container: paymentPlanMFEContainerRef.current,
          labels,
          loaderContainer: checkoutStepsLoadingSpinnerRef.current,
          handleUpdatePaymentPlan,
          ctaTitle,
          cartData: fetchedCartData,
          stepData,
          cartHash: hashResult.cartHash,
          cartDetails: hashResult.cartDetails,
        });
      }
      setPaymentPlanMFEInitialized(true);
    }
  }, [isCompleted, isEditing, paymentPlanMFEInitialized]);

  const handleEdit = () => {
    onEdit(stepId);
  };
  useEffect(async () => {
    if (isCompleted && !isEditing && cartData && cartHashData
        && paymentPlanMFEViewOnlyContainerRef.current) {
      paymentPlanMFEViewOnlyContainerRef.current.innerHTML = '';

      renderPaymentPlanMFE({
        container: paymentPlanMFEViewOnlyContainerRef.current,
        labels,
        loaderContainer: checkoutStepsLoadingSpinnerViewOnlyRef.current,
        handleUpdatePaymentPlan,
        ctaTitle,
        cartData,
        stepData,
        viewOnly: true,
        cartHash: cartHashData.cartHash,
        cartDetails: cartHashData.cartDetails,
        ppId: selectedOption?.ppId,
      });
    }
  }, [isCompleted, isEditing, cartData, cartHashData]);

  if (isCompleted && !isEditing) {
    return html`
      <div class="checkout-step checkout-step--completed">
        <div class="checkout-step__header">
          <h3 class="checkout-step__title">
            ${labels?.checkout.payment.options.infoLabel}
          </h3>
          <button class="checkout-step__edit-btn" onClick=${handleEdit}>
            ${labels?.checkout.editLabel}
          </button>
        </div>
        <div class="checkout-step__content">
          <div class="checkout-step__completed-data">
            <div
              class="payment-plan-mfe-container payment-plan-mfe-container--view-only"
              ref=${paymentPlanMFEViewOnlyContainerRef}
            ></div>

            <!-- Checkout Steps Loading Spinner for View-Only -->
            <div
              class="checkout__steps-loading-spinner"
              ref=${checkoutStepsLoadingSpinnerViewOnlyRef}
            ></div>
          </div>
        </div>
      </div>
    `;
  }

  return html`
    <div class="checkout-step checkout-step--editing">
      <div class="checkout-step__header">
        <h3 
          class="checkout-step__title"
          ref=${stepTitleRef}
          tabindex="-1"
          aria-label="Step ${stepNum} of ${totalSteps}: ${labels?.checkout.payment.options.infoLabel}"
        >
          ${labels?.checkout.payment.options.edit.infoLabel}
          <p class="next-step-indicator">${labels?.checkout.nextLabel}: ${nextStepTitle}</p>
        </h3>
                 ${html`
              <${ProgressBar}
                current=${stepNum}
                total=${totalSteps}
              />`
}
      </div>
       ${isShowTaxChangeMessage ? html`<div class="checkout-notification--error">
        <p>
          There has been a change to the price for your items. Please review
          your cart and re-enter your payment information or call us at 
           <strong>800.460.6276</strong>
        </p>
      </div>` : ''}
      <div class="checkout-step__content checkout-mfe-container-wrapper">
        <div
          class="payment-plan-mfe-container payment-plan-mfe-container--editable"
          ref=${paymentPlanMFEContainerRef}
        ></div>

        <!-- Checkout Steps Loading Spinner for Editable -->
        <div
          class="checkout__steps-loading-spinner"
          ref=${checkoutStepsLoadingSpinnerRef}
        ></div>
      </div>
    </div>
  `;
}
