/**
 * Shipping Details Step - Renders Addresses dropin with Avalara integration
 */
import { h } from '@dropins/tools/preact.js';
import { useState, useEffect, useRef } from '@dropins/tools/preact-hooks.js';
import Addresses from '@dropins/storefront-account/containers/Addresses.js';
import { render as AccountProvider } from '@dropins/storefront-account/render.js';
import * as cartApi from '@dropins/storefront-cart/api.js';
import * as checkoutApi from '@dropins/storefront-checkout/api.js';
import { getCustomer } from '@dropins/storefront-account/api.js';
import {
  avalaraAddressVerification,
  initAutocomplete,
  observeAndCleanAddressForm,
  regenrateInputField,
} from '../../../../utils/cart-checkout.js';
import {
  estimateShippingCost,
  setAddressOnCart,
} from '../../../../scripts/checkout.js';
import htm from '../../../../scripts/htm.js';
import ProgressBar from '../../../../custom-blocks/progress-bar/progress-bar.js';
import useStepFocus, { scrollToStep } from '../hooks/useStepFocus.js';
import { SHIPPING_ADDRESS_ID } from '../../../../scripts/constants.js';

const html = htm.bind(h);

export default function ShippingDetails({
  stepId,
  nextStepTitle,
  ctaTitle,
  isCompleted,
  isEditing,
  onComplete,
  onEdit,
  totalSteps,
  stepNum,
  labels,
}) {
  const [addressData, setAddressData] = useState(null);
  const [isAddressEditing, setIsAddressEditing] = useState(false);
  const [updatedFields, setUpdatedFields] = useState({});

  const isShippingAddressExistsRef = useRef(true);
  const addressValidationContainerRef = useRef(null);
  const isFirstRenderShippingRef = useRef(true);
  const avalaraStatusRef = useRef(false);
  const containerRef = useRef(null);
  const headerRef = useRef(null);
  const isAddressUpdatedRef = useRef(false);

  const stepTitleRef = useStepFocus(isCompleted, isEditing, stepNum, totalSteps);

  // Render Addresses component when component mounts or when editing
  useEffect(() => {
    async function setEmail() {
      try {
        const customer = await getCustomer();
        const email = customer?.email || '';
        const userEmailEl = document.querySelector('.shipping-content__useremail');
        userEmailEl.textContent = email;
      } catch (error) {
        // Handle error silently or log to monitoring service
      }
    }
    setEmail();

    const renderAddresses = async () => {
      try {
        const container = document.getElementById(`address-form-container-${stepId}`);
        if (!addressData) container?.setAttribute('data-form-type', 'addForm');
        container?.setAttribute('data-form-name', labels?.checkout.shipping.details.addressTitle);

        const userName = document.querySelector('.shipping-content__username');
        const userTel = document.querySelector('.shipping-content__usertel');

        if (container && !isCompleted && !isEditing) {
          containerRef.current = container;

          // Clear container first
          container.innerHTML = '';

          // Create address validation container
          const addressValidationContainer = document.querySelector('.checkout__address-validation-message');
          addressValidationContainerRef.current = addressValidationContainer;

          const cartData = cartApi.getCartDataFromCache();
          const hasCartShippingAddress = Boolean(cartData?.addresses?.shipping?.[0]);

          const setShippingAddressOnCart = setAddressOnCart({
            api: checkoutApi.setShippingAddress,
            debounceMs: 1000,
            placeOrderBtn: null,
          });

          const estimateShippingCostOnCart = estimateShippingCost({
            api: checkoutApi.estimateShippingMethods,
            debounceMs: 1000,
          });

          let defaultSelectAddressId = sessionStorage.getItem(SHIPPING_ADDRESS_ID) || undefined;
          if (defaultSelectAddressId) {
            defaultSelectAddressId = parseInt(defaultSelectAddressId, 10);
          }
          // Render the Addresses component
          await AccountProvider.render(Addresses, {
            addressFormTitle: labels?.checkout.shipping.details.addressFormTitle,
            title: labels?.checkout.shipping.details.addressTitle,
            withHeader: false,
            minifiedView: false,
            selectable: false,
            defaultSelectAddressId,
            forwardFormRef: containerRef,
            showSaveCheckBox: true,
            shippingCheckBoxValue: true,
            billingCheckBoxValue: false,
            onAddressData: async (values) => {
              if (!values?.data?.defaultShipping) return;
              if (values?.data) setAddressData(values.data);
              scrollToStep(headerRef.current);
              const canSetShippingAddressOnCart = !isFirstRenderShippingRef.current
                                                  || !hasCartShippingAddress
                                                  || !avalaraStatusRef.current;
              if (canSetShippingAddressOnCart) setShippingAddressOnCart(values);
              if (!hasCartShippingAddress) estimateShippingCostOnCart(values);

              if (!isShippingAddressExistsRef.current && values?.data?.defaultShipping) {
                isShippingAddressExistsRef.current = true;
              }

              if (!isFirstRenderShippingRef.current
                && !isAddressUpdatedRef.current
                && hasCartShippingAddress) {
                await avalaraAddressVerification(values?.data, 'onupdate', addressValidationContainer);
                setUpdatedFields({});
              }

              // Only call Avalara 'onload' for new address or first load
              const isNewAddress = !avalaraStatusRef.current || isFirstRenderShippingRef.current;
              if (isNewAddress) {
                const newUpdatedFields = await avalaraAddressVerification(values?.data, 'onload', addressValidationContainer);
                if (newUpdatedFields) {
                  setUpdatedFields(newUpdatedFields);
                  isAddressUpdatedRef.current = true;
                  setIsAddressEditing(true);
                }
                avalaraStatusRef.current = true;
                isFirstRenderShippingRef.current = false;
              } else if (isAddressUpdatedRef.current) {
                isAddressUpdatedRef.current = false;
              }
            },

            slots: {
              AddressFormInput_firstname: async (ctx) => {
                regenrateInputField(ctx);
                ctx.dictionary.Account.AddressForm.formText.primaryButton = 'Update';
              },
              AddressFormInput_lastname: async (ctx) => {
                regenrateInputField(ctx);
              },
              AddressFormInput_street: async (ctx) => {
                const markupElements = await regenrateInputField(ctx);
                initAutocomplete(markupElements.inputElement, 'shipping');
              },
              AddressFormInput_city: async (ctx) => {
                regenrateInputField(ctx);
              },
              AddressFormInput_postcode: async (ctx) => {
                regenrateInputField(ctx);
              },
              AddressFormInput_telephone: async (ctx) => {
                const markupElements = await regenrateInputField(ctx);
                markupElements.inputElement.addEventListener('input', (e) => {
                  const { value } = e.target;
                  const valid = /^[0-9()+\- ]*$/.test(value);
                  if (!valid) {
                    // TOD : Move to placeholders
                    e.target.setCustomValidity('Invalid Phone Number. Please use digits (0-9), +, -, (, ) and spaces only.');
                  } else {
                    e.target.setCustomValidity('');
                  }
                });
              },
              AddressCard: (ctx, elem) => {
                container.setAttribute('data-form-type', 'editForm');
                const elems = elem.parentElement.parentElement.querySelectorAll('.dropin-tag-container__label');
                if (elems?.length === 1) {
                  if (elems?.[0].textContent.toLowerCase() === 'billing') {
                    elems?.[0].closest('.account-address-card').remove();
                    return;
                  }
                }
                const cardAddressData = ctx.addressData.reduce((acc, { name, value }) => {
                  acc[name] = value;
                  return acc;
                }, {});
                elem.innerHTML = `
                  <div class="address-card__label">${labels?.checkout.shipping.details.addressCardLabel}</div>
                  <div class="shipping-address-card address-card__description">
                    <p data-testid="street_2">${cardAddressData?.street}</p>
                  </div>
                  <div class="shipping-address-card address-card__description">
                    <p data-testid="city_6">${cardAddressData?.city},</p>
                    <p data-testid="region_5">${cardAddressData?.region}</p>
                    <p data-testid="postcode_7">${cardAddressData?.postcode}</p>
                    <p data-testid="countryCode_4">${cardAddressData?.countryCode}</p>
                  </div>
                `;

                userName.textContent = `${cardAddressData?.firstname || ''} ${cardAddressData?.lastname || ''}`;
                userTel.textContent = cardAddressData?.telephone || '';
              },
            },
            inputsDefaultValueSet: {
              countryCode: 'US',
            },
          })(container);

          // Setup form observation for cleanup
          observeAndCleanAddressForm(container, 'shippingForm', updatedFields);
        }
      } catch (error) {
        console.error('shipping address error', error);
      }
    };

    renderAddresses();
  }, [
    stepId,
    isCompleted,
    isEditing,
    isAddressEditing,
  ]);

  const handleSave = () => {
    const form = document.querySelector('.address-form-container form') || document.querySelector('.address-form-container');
    if (form) {
      form.dataset.submitted = 'true';
    }
    const inputs = document.querySelectorAll('.address-form-container input[required]');
    inputs.forEach((input) => {
      const event = new Event('input', { bubbles: true });
      input.dispatchEvent(event);
    });

    // eslint-disable-next-line no-console
    console.log('shipping addressData', addressData);
    onComplete(stepId, addressData);
  };

  const handleEdit = () => {
    onEdit(stepId);
  };

  return html`
    <div class="checkout-step ${isCompleted && !isEditing ? 'checkout-step--completed' : 'checkout-step--editing'}">
            <div class="checkout-step__header" ref=${headerRef}>
        <h3 
          class=${`checkout-step__title ${!isCompleted ? 'confirm-shipping-title' : ''}`}
          ref=${stepTitleRef}
          tabindex="-1"
          aria-label="Step ${stepNum} of ${totalSteps}: ${labels?.checkout.shipping.details.infoConfirmLabel}"
        >
          ${isCompleted && !isEditing ? labels?.checkout.shipping.details.infoLabel : labels?.checkout.shipping.details.infoConfirmLabel}
          ${!isCompleted ? html`<p class="next-step-indicator">${labels?.checkout.nextLabel}: ${nextStepTitle}</p>` : ''}
        </h3>

        ${isCompleted && !isEditing ? html`
          <button class="checkout-step__edit-btn" onClick=${handleEdit}>
            ${labels?.checkout.editLabel}
          </button>
        ` : html`
      <${ProgressBar}
        current=${stepNum}
        total=${totalSteps}
      />`}
      </div>
      <div class="checkout-step__content">
        <div class="addresses-container">
          <div class="shipping-content-wrapper">
            <div class="checkout__address-validation-message"></div>
            <div class="shipping-content">
              <p>${labels?.checkout.shipping.details.nameLabel}</p>
              <p class="shipping-content__username"></p>
            </div>
            <div class="shipping-content">
              <p>${labels?.checkout.shipping.details.emailLabel}</p>
              <p class="shipping-content__useremail"></p>
            </div>
            <div class="shipping-content">
              <p>${labels?.checkout.shipping.details.phoneLabel}</p>
              <p class="shipping-content__usertel"></p>
            </div>
          </div>
          <div class="address-form-wrapper">
            <div class="address-form-container" id="address-form-container-${stepId}"></div>
        
          </div>
 
        </div>
      </div>
      ${(!isCompleted || isEditing) ? html`
              <div class="form-actions">
                <button class="checkout-step__save-btn" onClick=${handleSave}>
                  ${ctaTitle}
                </button>
              </div>
            ` : ''}
    </div>
  `;
}
