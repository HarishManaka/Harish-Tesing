import { h } from '@dropins/tools/preact.js';
import { useState, useEffect, useRef } from '@dropins/tools/preact-hooks.js';
import { render as CheckoutProvider } from '@dropins/storefront-checkout/render.js';
import ShippingMethodsComponent from '@dropins/storefront-checkout/containers/ShippingMethods.js';
import { setShippingMethodsOnCart } from '@dropins/storefront-checkout/api.js';
import { transformCartDataForGA4 } from '../../../../utils/cart-checkout.js';
import { trackGTMEvent } from '../../../../scripts/configs.js';
import htm from '../../../../scripts/htm.js';
import ProgressBar from '../../../../custom-blocks/progress-bar/progress-bar.js';
import useStepFocus from '../hooks/useStepFocus.js';

const html = htm.bind(h);

const activeSelectedMethod = (initialShippingMethod) => {
  const targetValue = initialShippingMethod?.value;
  const selecedRadio = document.getElementById(targetValue);
  if (targetValue && selecedRadio) {
    document.getElementById(targetValue).click();
  }
};

export default function ShippingMethods({
  stepId,
  nextStepTitle,
  ctaTitle,
  isCompleted,
  isEditing,
  onComplete,
  onEdit,
  stepNum,
  totalSteps,
  labels,
  shippingMethod,
  cartData,
}) {
  const stepTitleRef = useStepFocus(isCompleted, isEditing, stepNum, totalSteps);
  const shippingMethodContainerRef = useRef(null);
  const [selectedMethod, setSelectedMethod] = useState(shippingMethod || '');
  const [showError, setShowError] = useState(false);
  const [isInProgress, setIsInProgress] = useState(false);

  // Function to manually update shipping method in cart
  const updateShippingMethodInCart = async (method) => {
    setIsInProgress(true);
    const shippingMethods = [
      {
        method_code: method.code,
        carrier_code: method.carrier.code,
      },
    ];

    await setShippingMethodsOnCart(shippingMethods);
    setIsInProgress(false);
  };

  useEffect(() => {
    if (shippingMethod) {
      setSelectedMethod(shippingMethod);
      setTimeout(() => {
        activeSelectedMethod(shippingMethod);
      }, 1000);
    }
  }, [shippingMethod, isEditing]);

  // Render ShippingMethods component when component mounts or when editing
  useEffect(() => {
    const renderShippingMethods = async () => {
      try {
        const container = shippingMethodContainerRef.current;
        if (container && (!isCompleted || isEditing)) {
          // Clear container first
          container.innerHTML = '';

          // Render the ShippingMethods component
          await CheckoutProvider.render(ShippingMethodsComponent, {
            autoSync: false,
            displayTitle: false,
            onSelectionChange: async (method) => {
              setSelectedMethod(method);
              setShowError(false);

              await updateShippingMethodInCart(method);
            },
          })(container);
        }
      } catch (error) {
        // Handle error silently or log to monitoring service
      }
    };
    // Only render when we need to (not completed, or editing)
    if (!isCompleted || isEditing) {
      renderShippingMethods();
    }
  }, [stepId, isCompleted, isEditing]);

  const handleSave = () => {
    if (isInProgress) return;

    if (selectedMethod && !showError) {
      const additionalTrackingData = {
        shipping_tier: selectedMethod?.value,
      };

      const ga4Data = transformCartDataForGA4(cartData, 'add_shipping_info', additionalTrackingData);
      if (ga4Data) {
        trackGTMEvent({ ecommerce: null });
        trackGTMEvent(ga4Data);
      }

      onComplete(stepId, { selectedMethod });

      setShowError(false);
    } else if (!selectedMethod) {
      setShowError(true);
    }
  };

  const handleEdit = () => {
    onEdit(stepId);
  };

  if (isCompleted && !isEditing) {
    return html`
      <div class="checkout-step checkout-step--completed">
        <div class="checkout-step__header">
          <h3 class="checkout-step__title">${labels?.checkout.shipping.method.infoLabel}</h3>
          <button class="checkout-step__edit-btn" onClick=${handleEdit}>
            ${labels?.checkout.editLabel}
          </button>
        </div>
        <div class="checkout-step__content">
          <div class="checkout-step__completed-data">
            <div class="shipping-method-summary">
              <div class="value-price">
                <span>${selectedMethod?.value}</span>
                <span>$${selectedMethod?.amountInclTax?.value}</span>
              </div>
              <p class="title">${selectedMethod?.title}</p>
            </div>
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
          aria-label="Step ${stepNum} of ${totalSteps}: ${labels?.checkout.shipping.method.chooseInfo}"
        >
          ${labels?.checkout.shipping.method.chooseInfo}
          <p class="next-step-indicator">${labels?.checkout.nextLabel}: ${nextStepTitle}</p>
        </h3>
${html`
          <${ProgressBar}
            current=${stepNum}
            total=${totalSteps}
          />`
}
          </div>
          <div class="checkout-step__content">
              <div
                class="shipping-methods-container"
                ref=${shippingMethodContainerRef}
              ></div>
              <div class="step-info-text">Orders placed after 5pm EST begin processing the next business day.</div>
          </div>
           ${showError ? html` <div class="checkout-step-incomplete-error">${labels?.checkout.shipping.method.selectToContinue}</div>` : ''}
          <div class="form-actions">
            <button class="checkout-step__continue-btn" onClick=${handleSave}>
              ${ctaTitle}
            </button>
          </div>
        </div>
  `;
}
