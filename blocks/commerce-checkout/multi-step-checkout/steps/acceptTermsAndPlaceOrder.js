import { h } from '@dropins/tools/preact.js';
import {
  useState,
  useEffect,
  useRef,
  useCallback,
} from '@dropins/tools/preact-hooks.js';
import { render as CheckoutProvider } from '@dropins/storefront-checkout/render.js';
import PlaceOrderComponent from '@dropins/storefront-checkout/containers/PlaceOrder.js';
import * as orderApi from '@dropins/storefront-order/api.js';
import { ProgressSpinner, provider as UI } from '@dropins/tools/components.js';
import * as cartApi from '@dropins/storefront-cart/api.js';
import Modal from '../../../../custom-blocks/modal/modal.js';
import { rootLink } from '../../../../scripts/scripts.js';
import {
  CART_HAS_REGULAR_PRODUCTS,
  RECENT_ORDER_DETAILS,
  ORDERPLACE_ERROR_MODAL_HEADING,
  ORDERPLACE_ERROR_MODAL_DESCRIPTION,
  ORDERPLACE_ERROR_MODAL_CTA_LABEL,
  CHECKOUT_PATH,
} from '../../../../scripts/constants.js';

import htm from '../../../../scripts/htm.js';
import ProgressBar from '../../../../custom-blocks/progress-bar/progress-bar.js';
import useStepFocus from '../hooks/useStepFocus.js';
import { transformCartDataForGA4 } from '../../../../utils/cart-checkout.js';
import { trackGTMEvent } from '../../../../scripts/configs.js';

const html = htm.bind(h);

export default function AcceptTermsAndPlaceOrder({
  stepId,
  nextStepTitle,
  isCompleted,
  isEditing,
  onComplete,
  stepNum,
  totalSteps,
  labels,
  cartData,
}) {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsError, setTermsError] = useState(false);
  const placeOrderContainerRef = useRef(null);

  const errorHeading = labels?.checkout?.orderplace?.error?.modal?.heading
    || ORDERPLACE_ERROR_MODAL_HEADING;
  const errorDescription = labels?.checkout?.orderplace?.error?.modal?.description
    || ORDERPLACE_ERROR_MODAL_DESCRIPTION;
  const errorCtaLabel = labels?.checkout?.orderplace?.error?.modal?.cta?.label
    || ORDERPLACE_ERROR_MODAL_CTA_LABEL;

  const stepTitleRef = useStepFocus(isCompleted, isEditing, stepNum, totalSteps);

  const handleOrderPlaced = (orderData) => {
    const additionalTrackingData = {
      transaction_id: orderData.number,
      value: orderData.grandTotal?.value,
      tax: orderData.totalTax?.value,
      shipping: orderData.totalShipping?.value,
      coupon: orderData.coupons?.join(',') || '',
    };

    const ga4Data = transformCartDataForGA4(cartData, 'purchase', additionalTrackingData);
    if (ga4Data) {
      trackGTMEvent({ ecommerce: null });
      trackGTMEvent(ga4Data);
    }

    sessionStorage.setItem(RECENT_ORDER_DETAILS, JSON.stringify(orderData));
    // Enable saved cards when cart has both subscription and regular products
    const remainingItemsToPurchase = localStorage.getItem('remainingItemsToPurchase');
    if (remainingItemsToPurchase) {
      sessionStorage.setItem(CART_HAS_REGULAR_PRODUCTS, 'true');
    } else {
      sessionStorage.removeItem(CART_HAS_REGULAR_PRODUCTS);
    }

    document.querySelector('#checkoutWrapper').innerHTML = '';
    const url = rootLink('/checkout/success');
    window.location.href = url;
  };

  const handleOrderSuccess = (orderData) => {
    if (orderData?.number) {
      handleOrderPlaced(orderData);
    }

    onComplete(stepId, { orderPlaced: true, termsAccepted });
  };

  const displayOverlaySpinner = async () => {
    const spinnerContainer = document.createElement('div');
    spinnerContainer.className = 'checkoout__place-order-loader';
    document.body.appendChild(spinnerContainer);

    await UI.render(ProgressSpinner, {
      className: '.checkout__overlay-spinner',
      size: 'large',
    })(spinnerContainer);
  };

  const removeOverlaySpinner = () => {
    const spinnerContainer = document.querySelector(
      '.checkoout__place-order-loader',
    );
    if (spinnerContainer) {
      spinnerContainer.remove();
    }
  };

  const handleValidation = async () => {
    const latestCart = await cartApi.getCartData();
    const isSameTotal = window.nasmCartState?.total === latestCart?.subtotal?.excludingTax?.value;
    const isSameCount = window.nasmCartState?.count === latestCart?.totalQuantity;

    if (!isSameTotal || !isSameCount) {
      removeOverlaySpinner();
      UI.render(Modal, {
        container: document.body,
        title: errorHeading,
        description: errorDescription,
        buttonLabel: errorCtaLabel,
        onClickHandler: () => {
          window.location.href = CHECKOUT_PATH;
        },
      })(document.querySelector('.cart-value-changed-modal'));
      setTimeout(() => {
        window?.scrollTo({
          top: 0,
          behavior: 'smooth',
        });
      }, 100);
      return false;
    }
    return true;
  };

  const handlePlaceOrder = useCallback(async ({ cartId }) => {
    if (!termsAccepted) {
      setTermsError(true);
      return;
    }
    displayOverlaySpinner();
    const isCartValid = await handleValidation();
    if (!isCartValid) {
      return;
    }

    try {
      const orderData = await orderApi.placeOrder(cartId);
      handleOrderSuccess(orderData);
    } catch (error) {
      removeOverlaySpinner();

      console.error(error);
      throw error;
    }
  }, [termsAccepted]);

  useEffect(() => {
    const renderPlaceOrder = async () => {
      try {
        if (!isCompleted && !isEditing && placeOrderContainerRef.current) {
          // Clear container first
          placeOrderContainerRef.current.innerHTML = '';

          // Render the PlaceOrder component
          await CheckoutProvider.render(PlaceOrderComponent, {
            handleValidation: () => true,
            handlePlaceOrder,
            disabled: !termsAccepted,
          })(placeOrderContainerRef.current);
        }
      } catch (error) {
        // Handle error silently or log to monitoring service
      }
    };

    renderPlaceOrder();
  }, [stepId, isCompleted, isEditing, handlePlaceOrder, termsAccepted]);

  const handleTermsAccepted = useCallback((e) => {
    setTermsAccepted(e.target.checked);
    setTermsError(false);
  }, []);

  return html`
    <div class="checkout-step checkout-step--editing">
      <div class="checkout-step__header">
        <h3 
          class="checkout-step__title"
          ref=${stepTitleRef}
          tabindex="-1"
          aria-label="Step ${stepNum} of ${totalSteps}: ${labels?.checkout.acceptAndPlaceOrder.infoLabel}"
        >
          ${labels?.checkout.acceptAndPlaceOrder.infoLabel}
          ${!termsAccepted
          && html`<p class="next-step-indicator">${labels?.checkout.nextLabel}: ${nextStepTitle}</p>`}
        </h3>
        ${isCompleted && !isEditing ? '' : html`
            <${ProgressBar}
              current=${stepNum}
             total=${totalSteps}
        />`}
      </div>
      <div class="checkout-step__content">
        <div class="checkout-step__form">
          <!-- Custom Terms and Conditions Checkbox -->
          <div class="terms-checkbox-container">
            <label class="terms-checkbox-label">
              <input
                type="checkbox"
                checked=${termsAccepted}
                onChange=${handleTermsAccepted}
                class="terms-checkbox"
              />
               <span class="terms-checkbox-text">
                I agree to the <a href="${labels?.checkout?.termsandconditions?.link}" class="terms-link" target="_blank">Terms and Conditions</a>
              </span>
            </label>
          </div>
          ${termsError && html`<p class="checkout-step-incomplete-error">${labels?.checkout?.termsAndConditions?.error}</p>`}
          <div
            class="place-order-container ${!termsAccepted ? 'disabled' : ''}"
            ref=${placeOrderContainerRef}
          ></div>

          <!-- Checkout Steps Loading Spinner -->
          <div class="checkout__steps-loading-spinner"></div>
        </div>
      </div>
    </div>
  `;
}
