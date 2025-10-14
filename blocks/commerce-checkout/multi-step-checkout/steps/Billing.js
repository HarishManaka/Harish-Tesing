import { h } from '@dropins/tools/preact.js';
import { useState, useEffect, useRef } from '@dropins/tools/preact-hooks.js';
import { render as CheckoutProvider } from '@dropins/storefront-checkout/render.js';
import { render as AccountProvider } from '@dropins/storefront-account/render.js';
import BillToShippingAddress from '@dropins/storefront-checkout/containers/BillToShippingAddress.js';
import PaymentMethods from '@dropins/storefront-checkout/containers/PaymentMethods.js';
import Addresses from '@dropins/storefront-account/containers/Addresses.js';
import * as checkoutApi from '@dropins/storefront-checkout/api.js';
import { events } from '@dropins/tools/event-bus.js';
import {
  initAutocomplete,
  observeAndCleanAddressForm,
  regenrateInputField,
  isShowVaultedCreditCard,
  transformCartDataForGA4,
} from '../../../../utils/cart-checkout.js';
import htm from '../../../../scripts/htm.js';
import useStepFocus, { scrollToStep } from '../hooks/useStepFocus.js';
import Notification from '../../../../custom-blocks/notification/notification.js';

import {
  setAddressOnCart,
} from '../../../../scripts/checkout.js';

// eslint-disable-next-line import/no-unresolved
import 'https://js.braintreegateway.com/web/dropin/1.43.0/js/dropin.min.js';
// eslint-disable-next-line import/no-unresolved
import 'https://js.braintreegateway.com/web/3.129.0/js/apple-pay.min.js';

import { braintreeDropinData } from '../config.js';
import {
  getConfigValue, getCookie, trackGTMEvent,
} from '../../../../scripts/configs.js';
import ProgressBar from '../../../../custom-blocks/progress-bar/progress-bar.js';
import { BILLING_ADDRESS_ID } from '../../../../scripts/constants.js';

let cardBraintreeInstance;
let paypalBraintreeInstance;
let applePayBraintreeInstance;
let defaultSelectAddressId;

const html = htm.bind(h);

async function fetchBraintreeClientToken() {
  const isVaultCardDisplayed = isShowVaultedCreditCard();
  try {
    const commerceGraphQLEndpoint = getConfigValue('commerce-endpoint');
    const response = await fetch(commerceGraphQLEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        token: `${getCookie('auth_dropin_user_token')}`,
      },
      body: JSON.stringify({
        query: `
          mutation GetBraintreeCustomerToken {
            getBraintreeCustomerToken(input: { isVaultCardDisplayed: ${isVaultCardDisplayed} }) {
              clientToken
            }
          }
        `,
      }),
    });
    const result = await response.json();
    return result?.data?.getBraintreeCustomerToken?.clientToken;
  } catch (error) {
    console.error('Error fetching Braintree token:', error);
    return null;
  }
}

export default function Billing({
  stepId,
  nextStepTitle,
  ctaTitle,
  isCompleted,
  isEditing,
  onComplete,
  onEdit,
  stepNum,
  totalSteps,
  stepData,
  labels,
  billToShipping,
  cartData,
}) {
  const [dropinData, setDropinData] = useState({
    billToShipping: billToShipping || false,
    paymentMethods: null,
    addresses: null,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isReadyToSave, setIsReadyToSave] = useState(false);

  const isFirstRenderingRef = useRef(true);
  const billToShippingContainerRef = useRef(null);
  const paymentMethodsContainerRef = useRef(null);
  const addressesContainerRef = useRef(null);
  const headerRef = useRef(null);

  const stepTitleRef = useStepFocus(isCompleted, isEditing, stepNum, totalSteps);

  const DEBOUNCE_TIME = 1000;
  const setBillingAddressOnCart = setAddressOnCart({
    api: checkoutApi.setBillingAddress,
    debounceMs: DEBOUNCE_TIME,
    placeOrderBtn: null,
  });

  useEffect(() => {
    const handleTaxUpdated = () => {
      sessionStorage.setItem('isTaxUpdated', true);
      onEdit('payment-options');
    };
    const eventSubscription = events.on('cart/tax-updated', handleTaxUpdated);
    return () => {
      if (eventSubscription && eventSubscription.off) {
        eventSubscription.off();
      }
    };
  }, [onEdit]);

  // Render the three dropins when component mounts or when editing
  useEffect(async () => {
    let braintreeClientToken = null;
    if (!isCompleted || isEditing) {
      braintreeClientToken = await fetchBraintreeClientToken();
    }

    const renderDropins = async () => {
      try {
        if (!isCompleted && !isEditing) {
          // Render BillToShippingAddress dropin
          if (billToShippingContainerRef.current) {
            billToShippingContainerRef.current.innerHTML = '';
            await CheckoutProvider.render(BillToShippingAddress, {
              hideOnVirtualCart: true,
              onChange: async (checked) => {
                // On first render, check if checkout level data and dropin is in sync if not return
                if (checked !== dropinData.billToShipping && !billToShippingContainerRef.current) {
                  return;
                }

                setDropinData((prev) => ({ ...prev, billToShipping: checked }));
                // Hide/show the addresses container based on checkbox state
                if (addressesContainerRef.current) {
                  addressesContainerRef.current.style.display = checked
                    ? 'none'
                    : 'block';
                }

                const ShippingDetails = document.querySelector('.shipping-details-container');
                if (ShippingDetails) {
                  ShippingDetails.style.display = checked ? 'block' : 'none';
                }

                try {
                  if (!checked && defaultSelectAddressId) {
                    // When unchecked, clear the same_as_shipping flag
                    await checkoutApi.setBillingAddress({
                      sameAsShipping: false,
                      useForShipping: false,
                      address: {},
                      customerAddressId: defaultSelectAddressId,
                    });
                  }
                } catch (error) {
                  console.error('Error updating billing address:', error);
                }
              },
            })(billToShippingContainerRef.current);
            setTimeout(() => {
              const labelEl = billToShippingContainerRef.current?.querySelector(
                '#checkout-bill-to-shipping-address__checkbox-label',
              );
              if (labelEl) {
                labelEl.textContent = `${labels?.checkout.billingToShipping.label.title}`;
              }
            }, 100);
          }

          const paymentOption = stepData?.['payment-options']?.paymentOption;
          const isPaypalAvailable = !paymentOption || paymentOption?.planDuration === 0;

          if (paymentMethodsContainerRef.current) {
            const isApplePayAvailable = window.ApplePaySession
              && window.ApplePaySession.supportsVersion(3)
              && window.ApplePaySession.canMakePayments();
            if (!isApplePayAvailable) paymentMethodsContainerRef.current.classList.add('applepay--inactive');

            if (!isPaypalAvailable) paymentMethodsContainerRef.current.classList.add('paypal--inactive');

            await CheckoutProvider.render(PaymentMethods, {
              displayTitle: false,
              onSelectionChange: (method) => {
                setDropinData((prev) => ({ ...prev, paymentMethods: method }));
              },
              slots: {
                Methods: {
                  braintree_paypal_oope: {
                    autoSync: false,
                    render: async (ctx) => {
                      const container = document.createElement('div');

                      braintreeClientToken = await fetchBraintreeClientToken();
                      if (!braintreeClientToken) {
                        container.innerHTML = `<p>${labels?.checkout.billing.loadPayment}</p>`;
                        ctx.replaceHTML(container);
                        return;
                      }

                      window.braintree.dropin.create(
                        {
                          authorization: braintreeClientToken,
                          container,
                          card: false,
                          applePay: false,
                          paypal: {
                            flow: 'checkout',
                            amount: cartData?.total?.includingTax?.value || 0,
                            currency: 'USD',
                          },
                          dataCollector: true,
                        },
                        (err, dropinInstance) => {
                          if (err) {
                            // Handle error silently or log to monitoring service
                            return;
                          }
                          paypalBraintreeInstance = dropinInstance;
                          applePayBraintreeInstance = null;
                          cardBraintreeInstance = null;
                          braintreeDropinData.set(dropinInstance, 'paypal');
                        },
                      );

                      setIsReadyToSave(true);
                      ctx.replaceHTML(container);
                    },
                  },
                  braintree_oope: {
                    autoSync: false,
                    render: async (ctx) => {
                      const container = document.createElement('div');

                      if (!braintreeClientToken) {
                        container.innerHTML = `<p>${labels?.checkout.billing.loadPayment}</p>`;
                        ctx.replaceHTML(container);
                        return;
                      }

                      window.braintree.dropin.create(
                        {
                          authorization: braintreeClientToken,
                          container,
                          applePay: false,
                          paypal: false,
                          card: {
                            cardholderName: {
                              required: true,
                            },
                            overrides: {
                              fields: {
                                cardholderName: { placeholder: labels?.checkout.card.holderName },
                                number: { placeholder: labels?.checkout.card.cardNumber },
                                cvv: {
                                  placeholder: labels?.checkout.card.cvv.placeholder,
                                  maskInput: {
                                    character: '*',
                                  },
                                },
                                postalCode: { placeholder: labels?.checkout.card.postalCode },
                              },
                            },
                          },
                          dataCollector: true,
                        },
                        (err, dropinInstance) => {
                          if (err) {
                            // Handle error silently or log to monitoring service
                            return;
                          }

                          const labelMap = {
                            'number-field-group': labels?.checkout.card.cardNumber,
                            'expirationDate-field-group': labels?.checkout.card.expirationDate.label,
                            'cvv-field-group': labels?.checkout.card.cvv.label,
                            'postal-code-field-group': labels?.checkout.card.postalCode,
                          };

                          Object.entries(labelMap).forEach(([fieldId, newLabel]) => {
                            const labelEl = container.querySelector(
                              `[data-braintree-id="${fieldId}"] .braintree-form__label`,
                            );
                            if (labelEl) labelEl.textContent = newLabel;
                          });
                          cardBraintreeInstance = dropinInstance;
                          paypalBraintreeInstance = null;
                          applePayBraintreeInstance = null;
                          braintreeDropinData.set(dropinInstance, 'card');
                        },
                      );

                      setIsReadyToSave(true);
                      ctx.replaceHTML(container);
                    },
                  },
                  braintree_applepay_oope: {
                    autoSync: false,
                    render: async (ctx) => {
                      const container = document.createElement('div');
                      if (!braintreeClientToken) {
                        container.innerHTML = `<p>${labels?.checkout.billing.loadPayment}</p>`;
                        ctx.replaceHTML(container);
                        return;
                      }
                      window.braintree.dropin.create(
                        {
                          authorization: braintreeClientToken,
                          container,
                          card: false,
                          paypal: false,
                          applePay: {
                            displayName: 'NASM',
                            paymentRequest: {
                              total: {
                                label: 'NASM',
                                amount: (cartData?.total?.includingTax?.value ?? 0).toFixed
                                  ? (cartData.total.includingTax.value).toFixed(2)
                                  : `${cartData?.total?.includingTax?.value ?? 0}`,
                              },
                              requiredBillingContactFields: ['postalAddress', 'name', 'email'],
                            },
                          },
                          dataCollector: true,
                        },
                        (err, dropinInstance) => {
                          if (err) return;
                          applePayBraintreeInstance = dropinInstance;
                          cardBraintreeInstance = null;
                          paypalBraintreeInstance = null;
                          braintreeDropinData.set(dropinInstance, 'applepay');
                        },
                      );

                      setIsReadyToSave(true);
                      ctx.replaceHTML(container);
                    },
                  },

                },
              },
            })(paymentMethodsContainerRef.current);
            setTimeout(() => paymentMethodsContainerRef.current?.querySelector('input[type="radio"]')?.click(), 100);
          }

          // Render Addresses dropin
          if (addressesContainerRef.current) {
            if (!addressesContainerRef.current) {
              addressesContainerRef.current.setAttribute(
                'data-form-type',
                'addForm',
              );
            }
            addressesContainerRef.current.setAttribute(
              'data-form-name',
              labels?.checkout.billing.addressTitle,
            );

            defaultSelectAddressId = sessionStorage.getItem(BILLING_ADDRESS_ID) || undefined;
            if (defaultSelectAddressId) {
              defaultSelectAddressId = parseInt(defaultSelectAddressId, 10);
            }

            await AccountProvider.render(Addresses, {
              withHeader: false,
              addressFormTitle: labels?.checkout.billing.addressFormTitle,
              minifiedView: false,
              selectable: false,
              forwardFormRef: addressesContainerRef,
              defaultSelectAddressId,
              showSaveCheckBox: true,
              shippingCheckBoxValue: false,
              billingCheckBoxValue: true,
              selectBilling: true,
              showShippingCheckBox: false,
              title: labels?.checkout.billing.addressTitle,
              onAddressData: (values) => {
                if (values?.data && values?.data?.defaultBilling) {
                  setDropinData((prev) => ({ ...prev, addresses: values.data }));
                  if (!(isFirstRenderingRef.current && dropinData?.billToShipping)) {
                    setBillingAddressOnCart(values);
                  }
                }

                if (isFirstRenderingRef.current) isFirstRenderingRef.current = false;

                if (!defaultSelectAddressId && values?.data?.defaultBilling) {
                  sessionStorage.setItem(BILLING_ADDRESS_ID, values?.data?.id);
                  defaultSelectAddressId = values?.data?.id;
                }

                scrollToStep(headerRef.current);
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
                  initAutocomplete(markupElements.inputElement, 'billing');
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
                  addressesContainerRef.current.setAttribute(
                    'data-form-type',
                    'editForm',
                  );
                  const elems = elem.parentElement.parentElement.querySelectorAll(
                    '.dropin-tag-container__label',
                  );
                  if (elems.length === 1) {
                    if (elems?.[0].textContent.toLowerCase() === 'shipping') {
                      elems?.[0].closest('.account-address-card').remove();
                      return;
                    }
                  }
                  const cardAddressData = ctx.addressData.reduce(
                    (acc, { name, value }) => {
                      acc[name] = value;
                      return acc;
                    },
                    {},
                  );
                  elem.innerHTML = `
                    <div class="address-card__label">${labels?.checkout.billing.addressTitle}</div>
                    <div class="billing-address-card address-card__description">
                      <p data-testid="firstname_0">${cardAddressData?.firstname}</p>
                      <p data-testid="lastname_1">${cardAddressData?.lastname}</p>
                    </div>
                    <div class="billing-address-card address-card__description">
                      <p data-testid="street_2">${cardAddressData?.street}</p>
                    </div>
                    <div class="billing-address-card address-card__description">
                      <p data-testid="city_6">${cardAddressData?.city},</p>
                      <p data-testid="region_5">${cardAddressData?.region}</p>
                      <p data-testid="postcode_7">${cardAddressData?.postcode}</p>
                      <p data-testid="countryCode_4">${cardAddressData?.countryCode}</p>
                    </div>
                    <div class="billing-address-card address-card__description">
                      <p data-testid="telephone_8">${cardAddressData?.telephone}</p>
                    </div>
                  `;
                },
              },
            })(addressesContainerRef.current);
            observeAndCleanAddressForm(
              addressesContainerRef.current,
              'billing',
              {},
            );
          }
        }
      } catch (error) {
        // Handle error silently or log to monitoring service
      }
    };

    renderDropins();
  }, [stepId, isCompleted, isEditing]);

  const handleSave = () => {
    if ((!dropinData?.addresses && !dropinData?.billToShipping) || !isReadyToSave || isSaving) {
      return;
    }

    try {
      // eslint-disable-next-line max-len
      const braintreeInstance = cardBraintreeInstance ?? paypalBraintreeInstance ?? applePayBraintreeInstance;
      let code = cardBraintreeInstance;
      if (paypalBraintreeInstance) {
        code = 'braintree_paypal_oope';
      } else if (applePayBraintreeInstance) {
        code = 'braintree_applepay_oope';
      } else {
        code = 'braintree_oope';
      }
      braintreeInstance?.requestPaymentMethod(async (err, payload) => {
        setIsSaving(true);
        if (err) {
          setIsSaving(false);
          return;
        }

        try {
          await checkoutApi.setPaymentMethod({
            code,
            additional_data: [
              {
                key: 'is_active_payment_token_enabler',
                value: 'false',
              },
              {
                key: 'payment_method_nonce',
                value: payload.nonce,
              },
              {
                key: 'device_data',
                value: payload.deviceData || '',
              },
            ],
          });

          setIsSaving(false);

          const checkoutExpDate = document.querySelector('.card-expiration-date');
          if (checkoutExpDate && code === 'braintree_oope') {
            checkoutExpDate.textContent = `Expiration: ${payload.details.expirationMonth}/${payload.details.expirationYear}`;
          }
        } catch (error) {
          setIsSaving(false);
          console.error('Error setting payment method:', error);
        }

        const additionalTrackingData = {
          payment_type: dropinData?.paymentMethods?.title,
        };
        const ga4Data = transformCartDataForGA4(cartData, 'add_payment_info', additionalTrackingData);
        if (ga4Data) {
          trackGTMEvent({ ecommerce: null });
          trackGTMEvent(ga4Data);
        }
        onComplete(stepId, dropinData);
        setIsSaving(false);
      });
    } catch (error) {
      setIsSaving(false);
    // Handle error silently or log to monitoring service
    }
  };

  const handleEdit = () => {
    onEdit(stepId);
  };

  // Helper to render shipping details from stepData
  const renderShippingDetails = () => {
    if (!stepData || !stepData['shipping-details'] || !isReadyToSave) return null;
    const details = stepData['shipping-details'];
    const street = Array.isArray(details?.street) ? details.street[0] : details?.street;

    return html`
      <div class="shipping-details">
        <div class="shipping-address-card address-card__description">
            <p data-testid="firstname_0">${details?.firstName} </p>
            <p data-testid="lastname_1">${details?.lastName}</p>
        </div>
        <div class="shipping-address-card address-card__description">
            <p data-testid="street_2">${street}</p>
        </div>
        <div class="shipping-address-card address-card__description">
           <p data-testid="city_6">${details?.city},</p>
           <p data-testid="region_5"> ${details?.region}</p>
           <p data-testid="postcode_7"> ${details?.postcode}</p>
           <p data-testid="countryCode_4"> ${details?.countryCode}</p>
        </div>
        <div class="shipping-address-card address-card__description">
          <p data-testid="telephone_8">${details?.telephone}</p>
        </div>
      </div>
    `;
  };

  return html`
    <div class="checkout-step ${isCompleted && !isEditing ? 'checkout-step--completed' : 'checkout-step--editing'}">
      <div class="checkout-step__header" ref=${headerRef}>
        <h3 
          class="checkout-step__title"
          ref=${stepTitleRef}
          tabindex="-1"
          aria-label="Step ${stepNum} of ${totalSteps}: ${labels?.checkout.billing.infoLabel}"
        >
          ${labels?.checkout.billing.infoLabel}
          ${!isCompleted
    ? html`<p class="next-step-indicator">${labels?.checkout.nextLabel}: ${nextStepTitle}</p>`
    : ''}
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
        <div
          class="payment-methods-container"
          ref=${paymentMethodsContainerRef}
        >Loading....</div>
        <div class="card-expiration-date"></div>
        <div
          class="bill-to-shipping-container"
          ref=${billToShippingContainerRef}
        ></div>

        <!-- Addresses Dropin -->

        ${(!isCompleted || isEditing) && html`
          <${Notification}
            type="info"
            message=${labels?.checkout.membership.product.flow.message}
          />
        `}

        <div class="shipping-details-container" style="display:${dropinData.billToShipping ? 'block' : 'none'}">
      ${dropinData.billToShipping
    ? html`<div class="account-address-card">
        <div class="address-card__label billing-label">
          ${labels?.checkout.billing.addressTitle}
        </div>
      </div>`
    : ''}
      ${renderShippingDetails()}
    </div>
       <div class="addresses-container" ref=${addressesContainerRef} style="display:${!dropinData.billToShipping ? 'block' : 'none'}"></div>
        ${!isCompleted ? html`<div class="step-info-text" style="display:block">Billing address should match exactly as it appears on your credit card statement.</div>` : ''}

      </div>
      ${!isCompleted || isEditing
    ? html`
        <button
          class="checkout-step__continue-btn billing-step__continue-btn"
          onClick=${handleSave}
          disabled=${(!dropinData.addresses && !dropinData.billToShipping) || !isReadyToSave}
        >
          ${ctaTitle}
        </button>
      `
    : ''}
    </div>
  `;
}
