import { addProductsToCart } from '@dropins/storefront-cart/api.js';
import {
  ProgressSpinner,
  Input,
  provider as UI,
} from '@dropins/tools/components.js';
import { debounce } from '@dropins/tools/lib.js';
import { createElement, h, render } from '@dropins/tools/preact.js';
import {
  getRegions,
  updateCustomerAddress,
} from '@dropins/storefront-account/api.js';
import * as authApi from '@dropins/storefront-auth/api.js';
import Notification from '../custom-blocks/notification/notification.js';
// eslint-disable-next-line import/no-cycle
import { getSignInToken, fetchPlaceholders, getProductUrlByType } from '../scripts/commerce.js';
import {
  deleteCookie,
  getConfigValue,
  getCookie,
  trackGTMEvent,
} from '../scripts/configs.js';
import Modal from '../custom-blocks/modal/modal.js';

import {
  CART_PATH,
  CHECKOUT_PATH,
  LOGIN_PATH,
  ORDER_CONFIRMATION_PATH,
  CART_HAS_REGULAR_PRODUCTS,
  QUOTE_MASKED_ID,
  SELECTED_PAYMENT_PLAN,
  CART_TYPE,
  CART_SKU_LIST,
  LOGIN_SESSION_MODAL_HEADING,
  LOGIN_SESSION_MODAL_DESC,
  LOGIN_SESSION_MODAL_CTA_LABEL,
} from '../scripts/constants.js';
import { rootLink } from '../scripts/scripts.js';

const labels = await fetchPlaceholders();

export const SessionStorage = {
  setItem(key, value) {
    try {
      const jsonString = JSON.stringify(value);
      sessionStorage.setItem(key, jsonString);
    } catch (error) {
      console.error(`SessionStorage setItem failed for key "${key}":`, error);
    }
  },

  getItem(key) {
    try {
      const jsonString = sessionStorage.getItem(key);
      return jsonString ? JSON.parse(jsonString) : null;
    } catch (error) {
      console.error(`SessionStorage getItem failed for key "${key}":`, error);
      return null;
    }
  },
};

export function cacheLoggedInUserCart() {
  const sessionData = SessionStorage.getItem('DROPIN__CART__CART__DATA');

  const cartItems = Array.isArray(sessionData?.items)
    ? Array.from(
      new Map(
        sessionData.items.map((item) => [
          item.sku,
          item.itemType === 'ConfigurableCartItem'
            ? {
              sku: item.topLevelSku || item.sku,
              quantity: 1,
              ...(item.selectedOptionsUIDs?.['Renewal Period'] && {
                selectedOptionsUIDs: [
                  item.selectedOptionsUIDs['Renewal Period'],
                ],
              }),
            }
            : { sku: item.sku, quantity: 1 },
        ]),
      ).values(),
    )
    : [];

  SessionStorage.setItem('LOGGEDIN_USER_CART_ITEMS', { items: cartItems });
}

export function restoreCartForGuestSession() {
  const cartData = SessionStorage.getItem('LOGGEDIN_USER_CART_ITEMS');
  if (cartData?.items?.length) {
    addProductsToCart(cartData.items)
      .then((data) => {
        if (!data.errors) {
          sessionStorage.removeItem('LOGGEDIN_USER_CART_ITEMS');
        }
      })
      .catch((error) => {
        console.error(
          'Failed to restore product in cart for guest user',
          error,
        );
      });
  }
}

export function isPayTodayEligible(cartData, configs) {
  const skuString = configs?.cart?.excludedProducts?.sku;
  const cartTotal = cartData?.total?.includingTax?.value || 0;
  const items = cartData?.items || [];

  // excluded products skus condfigured through AEM
  const excludedProductSKUs = typeof skuString === 'string' && skuString.trim()
    ? skuString
      .trim()
      .split(',')
      .map((s) => s.trim())
    : [];

  // subscribed products
  const subscribeProductSKUs = items
    .filter(
      (item) => Array.isArray(item?.productAttributes)
        && item.productAttributes.some(
          (attr) => attr.code === 'Is Subscription' && attr.value === '1',
        ),
    )
    .map((item) => item.sku);

  // calcluate total price of all excluded products
  const excludedProductsTotal = items.reduce((sum, item) => {
    const itemSku = item?.sku?.trim();
    const isExcluded = [
      ...excludedProductSKUs,
      ...subscribeProductSKUs,
    ].includes(itemSku);

    if (isExcluded) {
      const price = item?.price?.value || 0;
      const discount = item?.discount?.value || 0;
      return sum + (price - discount);
    }

    return sum;
  }, 0);

  // Subtract excluded total from the cart total
  const adjustedTotal = cartTotal - excludedProductsTotal;

  return adjustedTotal > 200 && adjustedTotal < 5999;
}

export const displayOverlaySpinner = async (container, className) => {
  if (container && UI && ProgressSpinner) {
    try {
      container.classList.add('loader-active');
      await UI.render(ProgressSpinner, {
        className: `.${className}`,
      })(container);
    } catch (error) {
      console.error('Error rendering ProgressSpinner:', error);
      // Fallback to simple loading text if UI.render fails
      container.innerHTML = '<div class="loading-text">Loading...</div>';
    }
  } else if (container) {
    // Fallback if UI or ProgressSpinner are not available
    container.classList.add('loader-active');
    container.innerHTML = '<div class="loading-text">Loading...</div>';
  }
};

export const removeOverlaySpinner = (loader) => {
  if (loader) {
    loader.classList.remove('loader-active');
    loader.innerHTML = '';
  }
};

// Environment-specific configurations for Payment Plan MFE
export const ENV_CONFIG = {
  dev: {
    mfeUrl:
      'https://paymentplanselection-externalservice.dev.nasm.org/mfe/paymentplan-selection.js',
    apiUrl: 'https://paymentplanselection-externalservice.dev.nasm.org/api/v1',
  },
  qa: {
    mfeUrl:
      'https://paymentplanselection-externalservice.qa.nasm.org/mfe/paymentplan-selection.js',
    apiUrl: 'https://paymentplanselection-externalservice.qa.nasm.org/api/v1',
  },
  stage: {
    mfeUrl:
      'https://stg-paymentplanselection-externalservice.nasm.org/mfe/paymentplan-selection.js',
    apiUrl: 'https://stg-paymentplanselection-externalservice.nasm.org/api/v1',
  },
  prod: {
    mfeUrl:
      'https://paymentplanselection-externalservice.nasm.org/mfe/paymentplan-selection.js',
    apiUrl: 'https://paymentplanselection-externalservice.nasm.org/api/v1',
  },
};

export const RIC_ENV_CONFIG = {
  dev: {
    mfeUrl:
      'https://paymentplan-ricservice.dev.nasm.org/mfe/paymentplan-ric.js',
    cssUrl:
      'https://paymentplan-ricservice.dev.nasm.org/mfe/paymentplan-ric.css',
    apiUrl: 'https://paymentplan-ricservice.dev.nasm.org/api/v1',
  },
  qa: {
    mfeUrl: 'https://paymentplan-ricservice.qa.nasm.org/mfe/paymentplan-ric.js',
    cssUrl:
      'https://paymentplan-ricservice.qa.nasm.org/mfe/paymentplan-ric.css',
    apiUrl: 'https://paymentplan-ricservice.qa.nasm.org/api/v1',
  },
  stage: {
    mfeUrl:
      'https://stg-paymentplan-ricservice.nasm.org/mfe/paymentplan-ric.js',
    cssUrl:
      'https://stg-paymentplan-ricservice.nasm.org/mfe/paymentplan-ric.css',
    apiUrl: 'https://stg-paymentplan-ricservice.nasm.org/api/v1',
  },
  prod: {
    mfeUrl: 'https://paymentplan-ricservice.qa.nasm.org/mfe/paymentplan-ric.js',
    cssUrl:
      'https://paymentplan-ricservice.qa.nasm.org/mfe/paymentplan-ric.css',
    apiUrl: 'https://paymentplan-ricservice.nasm.org/api/v1',
  },
};

export function fetchWrapper({
  endpoint,
  query,
  variables,
  loaderClass,
  loaderContainer,
  method = 'POST',
  useToken = false,
  isShowLoading = true,
  headers = {},
}) {
  if (isShowLoading) {
    displayOverlaySpinner(loaderContainer, loaderClass);
  }

  const requestOptions = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify({ query, variables }),
  };

  if (useToken) {
    const token = getSignInToken();
    if (token) {
      requestOptions.headers.Authorization = `Bearer ${token}`;
    }
  }

  return fetch(endpoint, requestOptions)
    .then((res) => res.json())
    .catch((error) => {
      console.error(`Error in POST request to ${endpoint}:`, error);
      throw error;
    })
    .finally(() => {
      removeOverlaySpinner(loaderContainer);
    });
}

export function PostLogoutHandler() {
  deleteCookie('XSRF-TOKEN');
  sessionStorage.removeItem('isSuspendedUser');
}

function checkAndRedirect(redirections) {
  Object.entries(redirections).find(([currentPath, redirectPath]) => {
    if (window.location.pathname.includes(currentPath)) {
      window.location.href = redirectPath;
    }
    return false;
  });
}

const redirectToLoginPage = () => {
  checkAndRedirect({
    '/checkout': rootLink(`${LOGIN_PATH}?redirect_url=${CHECKOUT_PATH}`),
    '/checkout/success': rootLink(`${LOGIN_PATH}`),
  });
};

const logoutUser = async () => {
  deleteCookie('XSRF-TOKEN');
  trackGTMEvent({
    login_status: 'logged_out',
  });
  await authApi.revokeCustomerToken();
};

export const getXSRFCookieAge = () => {
  const cookie = getCookie('XSRF-TOKEN');
  const cookieBase64 = cookie?.split('.')?.[1];
  if (!cookieBase64) {
    return 0;
  }
  const cookieJson = atob(cookieBase64);
  const paresCookieJon = JSON.parse(cookieJson);
  const now = Math.floor(Date.now() / 1000);
  const issuedAt = paresCookieJon.iat;
  const age = now - issuedAt;
  return age;
};

export const startAuthDropinTokenTimer = async () => {
  const sessionTime = parseInt(labels?.token?.session?.time, 10) || 3600;
  const timerInterval = parseInt(labels?.token?.session?.setinterval?.timer, 10) || 180000;

  const cookie = getCookie('XSRF-TOKEN');
  const authDropinCookie = getCookie('auth_dropin_user_token');

  if (!authDropinCookie && !cookie) {
    redirectToLoginPage();
    return false;
  }

  if (!authDropinCookie || !cookie) {
    await logoutUser();
    redirectToLoginPage();
    return false;
  }

  let timerId = null;

  const checkTokenExpiration = async () => {
    const currentCookie = getCookie('XSRF-TOKEN');
    const currentAuthDropinCookie = getCookie('auth_dropin_user_token');

    if (!currentCookie || !currentAuthDropinCookie) {
      if (timerId) {
        clearTimeout(timerId);
        timerId = null;
      }
      return;
    }

    const tokenAge = getXSRFCookieAge();
    if (tokenAge >= sessionTime) {
      if (timerId) {
        clearTimeout(timerId);
        timerId = null;
      }

      if (window.location.pathname.includes('/checkout')) {
        await logoutUser();
        const modalContainer = document.createElement('div');
        modalContainer.id = 'session-expired-modal-container';
        document.body.appendChild(modalContainer);

        render(
          h(Modal, {
            title: LOGIN_SESSION_MODAL_HEADING,
            description: LOGIN_SESSION_MODAL_DESC,
            buttonLabel: LOGIN_SESSION_MODAL_CTA_LABEL,
            onClickHandler: () => {
              modalContainer.remove();
              window.location.href = rootLink('/login?redirect_url=/cart');
            },
          }),
          modalContainer,
        );
      } else {
        cacheLoggedInUserCart();
        await logoutUser();
        window.location.reload();
      }
      return;
    }
    timerId = setTimeout(checkTokenExpiration, timerInterval);
  };
  checkTokenExpiration();
  return true;
};

/**
 * Utility to create an element
 * @param {string} type - The HTML element type e.g. 'div', 'span', 'a'
 * @param {Object} options - Options object for className, style, href, etc.
 * @param {string | Array} content - Text content or array of child elements
 * @returns Preact element
 */
export function createEl(type, options = {}, content = null) {
  const props = { ...options };

  if (typeof content === 'string' || typeof content === 'number') {
    return createElement(type, props, content);
  }

  return createElement(
    type,
    props,
    Array.isArray(content) ? content : [content],
  );
}

export function hasMembershipItem(cartData) {
  const items = cartData?.items || [];
  const hasMembership = items.some(
    (item) => item.itemType === 'ConfigurableCartItem',
  );
  const hasNonMembership = items.some(
    (item) => item.itemType !== 'ConfigurableCartItem',
  );

  return hasMembership && hasNonMembership;
}

export function hasRenewalPeriodConflict(cartData) {
  const value = {};
  return (cartData?.items || [])
    .filter((item) => item.itemType === 'ConfigurableCartItem')
    .some(({ topLevelSku, selectedOptions }) => {
      const renewal = selectedOptions?.['Renewal Period'] || '';
      if (value[topLevelSku] && value[topLevelSku] !== renewal) return true;
      value[topLevelSku] = renewal;
      return false;
    });
}

export const formatCurrency = (amount) => {
  if (!amount || amount === 0) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

export async function restoreRemainingItemsToCart({
  initiator = '',
}) {
  try {
    const paths = [CHECKOUT_PATH, LOGIN_PATH, CART_PATH];
    const isNotEligible = paths.some((path) => window.location.href.includes(path));
    const sessionData = localStorage.getItem('remainingItemsToPurchase');

    if (!sessionData) { return Promise.resolve(); }

    if (initiator === 'header' && (!sessionData || isNotEligible)) {
      return Promise.resolve();
    }

    if (sessionStorage.getItem('isDataSyncedAfterPlaceOrder') === 'false' && sessionData) {
      await makeSyncCustomerProfileAPICall();
    }

    const { items } = JSON.parse(sessionData);
    if (Array.isArray(items) && items.length > 0) {
      await addProductsToCart(items);
    }

    localStorage.removeItem('remainingItemsToPurchase');
    sessionStorage.removeItem('isDataSyncedAfterPlaceOrder');
    return Promise.resolve();
  } catch (error) {
    console.error('Error while restoring items to cart :', error);
    return Promise.resolve();
  }
}

function toTitleCase(str) {
  if (!str) return '';
  return str
    .split(' ')
    .map((word) => (/\d/.test(word) // If the word contains any digit, leave as is
      ? word
      : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()))
    .join(' ');
}

// avalara address validation
export async function performAvalaraAddressValidation(shippingAddress, mode) {
  let line1 = '';
  if (Array.isArray(shippingAddress.street)) {
    line1 = shippingAddress.street?.[0] || '';
  } else if (typeof shippingAddress.street === 'string') {
    line1 = shippingAddress.street;
  }

  const city = shippingAddress.city || '';
  const region = shippingAddress.region?.regionCode || '';
  const country = shippingAddress.countryCode || '';
  const postalCode = shippingAddress.postcode || '';

  const endpoint = getConfigValue('commerce-endpoint');

  // GraphQL mutation using variables
  const query = `
    mutation MyMutation(
      $line1: String!, 
      $city: String!, 
      $region: String!, 
      $country: String!, 
      $postalCode: String!
    ) {
      getAddressValidation(
        input: {address: {line1: $line1, city: $city, region: $region, country: $country, postalCode: $postalCode}}
      ) {
        result {
          original_address {
            city
            country
            line1
            postalCode
            region
          }
          valid_address {
            addressType
            city
            country
            latitude
            line1
            line2
            region
            postalCode
            longitude
            line3
          }
        }
      }
    }
  `;

  const variables = {
    line1,
    city,
    region,
    country,
    postalCode,
  };

  try {
    const result = await fetchWrapper({
      endpoint,
      query,
      variables,
      loaderClass: '',
      loaderContainer: '',
      method: 'POST',
      useToken: true,
      isShowLoading: false,
    });

    if (result.errors) {
      return {
        success: false,
        update: '',
        message: labels?.checkout?.avalara?.error?.message,
      };
    }

    const res = result?.data?.getAddressValidation?.result;
    if (
      !res
      || res?.valid_address?.[0] === null
      || res?.valid_address?.[0].addressType === 'UnknownAddressType'
    ) {
      return {
        success: false,
        update: '',
        message: labels?.checkout?.avalara?.error?.message,
      };
    }

    const original = res.original_address || {};
    const valid = Array.isArray(res.valid_address)
      ? res.valid_address[0]
      : res.valid_address;

    const update = {};
    if (valid) {
      if (
        original.line1
        && valid.line1
        && original.line1.trim().toUpperCase() !== valid.line1.trim().toUpperCase()
      ) {
        const originalStreet = Array.isArray(shippingAddress.street)
          ? shippingAddress.street
          : [shippingAddress.street || ''];

        update.street = [
          toTitleCase(valid.line1),
          originalStreet[1] || '',
        ];
      }

      if (
        original.city
        && valid.city
        && original.city.trim().toUpperCase() !== valid.city.trim().toUpperCase()
      ) update.city = toTitleCase(valid.city);

      if (
        original.region
        && valid.region
        && original.region.trim().toUpperCase()
          !== valid.region.trim().toUpperCase()
      ) {
        const regions = (await getRegions(valid.country)) || [];
        const regionObj = regions.find((r) => {
          const [regionCode] = (r.value || '').split(',');
          return regionCode === valid.region;
        });
        if (!regionObj) {
          return {
            success: false,
            update: {},
            message: labels?.checkout.avalara.error.message,
          };
        }

        update.region = {
          region_code: valid.region,
          region_id: regionObj.id,
        };
      }

      if (
        original.country
        && valid.country
        && original.country.trim().toUpperCase()
          !== valid.country.trim().toUpperCase()
      ) update.country = valid.country;

      if (
        original.postalCode
        && valid.postalCode
        && original.postalCode.trim().toUpperCase()
          !== valid.postalCode.trim().toUpperCase()
      ) update.postcode = valid.postalCode;
    }

    if (Object.keys(update).length > 0 && mode === 'onload') {
      return {
        success: false,
        update,
        message: labels?.checkout.avalara.update.message,
      };
    }
    if (Object.keys(update).length > 0 && mode === 'onupdate') {
      return {
        success: false,
        update: {},
        message: labels?.checkout.avalara.error.message,
      };
    }

    return {
      success: true,
      update: {},
      message: '',
    };
  } catch (error) {
    console.error('Error validating address with Avalara:', error);
    return {
      success: false,
      update: '',
      message: labels?.checkout.avalara.error.message,
    };
  }
}

// eslint-disable-next-line consistent-return
export const avalaraAddressVerification = async (
  shippingAddress,
  mode,
  $container,
// eslint-disable-next-line consistent-return
) => {
  let fields;
  const addressValidationResult = await performAvalaraAddressValidation(
    shippingAddress,
    mode,
  );

  if ($container) {
    $container.innerHTML = '';
  }

  if (addressValidationResult && addressValidationResult.success === false) {
    // eslint-disable-next-line max-len
    if (
      addressValidationResult.update
      && Object.keys(addressValidationResult.update).length > 0
    ) {
      try {
        // eslint-disable-next-line no-unused-vars
        const { id, customAttributes, ...addressInput } = {
          ...shippingAddress,
          ...addressValidationResult.update,
        };
        await updateCustomerAddress({
          ...addressInput,
          addressId: Number(shippingAddress.id),
        });

        fields = Object.keys(addressValidationResult.update);
      } catch (err) {
        console.error('Error updating shipping address:', err);
      }
    }

    if ($container && addressValidationResult.message) {
      const messageHtml = addressValidationResult.message.replace(
        '{{edit}}',
        `<button type="button" class="address-edit-btn">${labels?.checkout.edit.btn.text}</button>`,
      );
      await UI.render(Notification, {
        type: 'error',
        message: messageHtml,
        showIcon: true,
        showClose: false,
        onClose: () => {
          if ($container) $container.innerHTML = '';
        },
      })($container);
      // Attach edit button handler after render
      const editBtn = $container.querySelector('.address-edit-btn');
      if (editBtn) {
        editBtn.onclick = () => {
          const firstCard = document.querySelector('.account-address-card');
          if (firstCard) {
            const editButton = firstCard.querySelector(
              '[data-testid="editButton"], button[aria-label*="Edit"]',
            );
            if (editButton) {
              editButton.click();
            }
          }
        };
      }
      return fields;
    }
  }
};

export function observeAndCleanAddressForm($form, formName, updatedFields) {
  const observer = new MutationObserver((mutations, obs) => {
    const footer = $form.querySelector('.account-addresses__footer');
    if (footer) {
      const editBtn = footer.querySelector('button.account-actions-address');
      if (editBtn) editBtn.click();
    }
    const isAccEmpty = $form.querySelector('.account-empty-list');
    const addressCards = $form.querySelectorAll('.account-address-card');
    if (addressCards.length > 0) {
      const firstCard = addressCards[0];

      if (firstCard && !firstCard.querySelector('.dropin-skeleton')) {
        footer?.remove();
        if (formName === 'billingForm') {
          obs.disconnect();
        } else if (formName === 'shippingForm') {
          if (
            updatedFields
            && Array.isArray(updatedFields)
            && updatedFields.length > 0
          ) {
            updatedFields.forEach((field) => {
              const matches = firstCard.querySelectorAll(
                `[data-testid*="${field}"]`,
              );
              matches.forEach((el) => {
                el.classList.add('address-field--highlight');
              });
            });
            obs.disconnect();
          } else {
            obs.disconnect();
          }
        }
      }
    } else if (isAccEmpty) {
      isAccEmpty.remove();
    }
  });
  observer.observe($form, { childList: true, subtree: true });
}

const autocompleteInstances = new Map();
const noResultsTimeouts = new Map();

export const showNoResults = (inputElement) => {
  const noResultsDiv = document.createElement('div');
  noResultsDiv.className = 'no-suggestion-message';
  noResultsDiv.innerHTML = `${labels?.checkout.shipping.billing.suggestion.text}`;

  const inputWrapper = inputElement.closest('.dropin-field') || inputElement.parentElement;
  if (inputWrapper) {
    inputWrapper.style.position = 'relative';
    inputWrapper.appendChild(noResultsDiv);
  }
};

export const hideNoResults = () => {
  const existingMessage = document.querySelector('.no-suggestion-message');
  if (existingMessage) {
    existingMessage.remove();
  }
};

export const initAutocomplete = async (
  inputElement,
  formContext = 'default',
) => {
  const instanceKey = `${formContext}-${inputElement.id || inputElement.name}`;

  if (autocompleteInstances.has(instanceKey)) {
    const existingInstance = autocompleteInstances.get(instanceKey);
    if (document.contains(inputElement)) {
      return existingInstance;
    }
    if (existingInstance.cleanup) {
      existingInstance.cleanup();
    }
    autocompleteInstances.delete(instanceKey);
  }

  if (!window?.google?.maps?.places?.Autocomplete) {
    return false;
  }
  const autocomplete = new window.google.maps.places.Autocomplete(
    inputElement,
    {
      types: ['address'],
      fields: ['address_components', 'formatted_address'],
    },
  );

  // eslint-disable-next-line no-unused-vars
  let lastQuery = '';
  // eslint-disable-next-line no-unused-vars
  let hasReceivedResults = false;

  inputElement.addEventListener('input', (e) => {
    const currentValue = e.target.value.trim();
    hideNoResults(formContext);

    if (currentValue.length > 2) {
      lastQuery = currentValue;
      hasReceivedResults = false;

      // eslint-disable-next-line no-undef
      const service = new google.maps.places.AutocompleteService();
      service.getPlacePredictions(
        {
          input: currentValue,
          types: ['address'],
        },
        (predictions, status) => {
          if (
            // eslint-disable-next-line no-undef
            status === google.maps.places.PlacesServiceStatus.OK
            && predictions?.length > 0
          ) {
            hasReceivedResults = true;
            hideNoResults(formContext);
          } else {
            hasReceivedResults = false;
            showNoResults(inputElement, formContext);
          }
        },
      );
    }
  });

  inputElement.addEventListener('focus', () => {
    hideNoResults(formContext);
  });

  inputElement.addEventListener('blur', () => {
    hideNoResults(formContext);
  });

  const onPlaceChanged = () => {
    hasReceivedResults = true;
    hideNoResults(formContext);
    const place = autocomplete.getPlace();
    if (!place?.address_components) {
      return;
    }

    const addressComponents = place.address_components;
    let street = '';
    let city = '';
    let countryCode = '';
    let state = '';
    let pinCode = '';

    addressComponents.forEach((component) => {
      const { types } = component;
      if (types.includes('street_number')) street = `${component.long_name} `;
      if (types.includes('route')) street += component.long_name;
      if (types.includes('locality')) city = component.long_name;
      if (types.includes('sublocality_level_1') && !city) city = component.long_name;
      if (types.includes('administrative_area_level_1')) state = component.short_name;
      if (types.includes('postal_code')) pinCode = component.long_name;
      if (types.includes('country')) countryCode = component.short_name;
    });

    const updateFieldInForm = (fieldId, value) => {
      const currentForm = inputElement.closest('form');
      let element = null;
      if (currentForm) {
        element = currentForm.querySelector(`#${fieldId}, [name="${fieldId}"]`);
      }

      if (element) {
        const trimmedValue = value.toString().trim();
        element.value = trimmedValue;
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
        element.dispatchEvent(new Event('blur', { bubbles: true }));
      }
    };

    updateFieldInForm('country_code', countryCode);
    updateFieldInForm('street', street);
    updateFieldInForm('city', city);
    const currentForm = inputElement.closest('form');
    if (currentForm) {
      const regionSelect = currentForm.querySelector('#region');
      if (regionSelect) {
        const matchOption = Array.from(regionSelect.options).find((opt) => opt.value.startsWith(`${state},`));
        if (matchOption) {
          regionSelect.value = matchOption.value;
          regionSelect.dispatchEvent(new Event('input', { bubbles: true }));
          regionSelect.dispatchEvent(new Event('change', { bubbles: true }));
          regionSelect.dispatchEvent(new Event('blur', { bubbles: true }));
        }
      }
    }
    updateFieldInForm('postcode', pinCode);
    updateFieldInForm('street_multiline_2', '');
  };

  autocomplete.addListener('place_changed', onPlaceChanged);
  autocompleteInstances.set(instanceKey, autocomplete);

  const cleanup = () => {
    if (noResultsTimeouts.has(instanceKey)) {
      clearTimeout(noResultsTimeouts.get(instanceKey));
      noResultsTimeouts.delete(instanceKey);
    }
    hideNoResults(formContext);
    autocompleteInstances.delete(instanceKey);
  };

  autocomplete.cleanup = cleanup;

  return autocomplete;
};

export const handleStateChange = (
  next,
  { inputElement, inputComponent, errorContainer },
) => {
  const {
    errorMessage, errors, handleOnChange, handleOnBlur,
  } = next;

  const getNextProps = (prev, error) => ({
    ...prev,
    error,
    onChange: (e) => handleOnChange(e, errors),
    onBlur: (e) => handleOnBlur(e, errors),
  });

  // Check if form is being submitted or field has been touched
  const hasBeenTouched = inputElement.dataset.touched === 'true';
  const isFormSubmitted = document.querySelector('form')?.dataset.submitted === 'true';

  let customErrMsg = '';
  const { placeholder, value } = inputElement;

  // Field has been touched by user, OR
  // Form submit button was clicked
  if (value.length === 0 && (hasBeenTouched || isFormSubmitted)) {
    customErrMsg = `${placeholder.charAt(0).toUpperCase() + placeholder.toLowerCase().slice(1)}* is required`;
  }

  if (errorMessage || customErrMsg) {
    errorContainer.innerText = customErrMsg ?? errorMessage;
    inputElement.classList.add('dropin-input--error');
    errorContainer.style.display = 'block';
    inputComponent.setProps((prev) => getNextProps(prev, true));
  } else {
    errorContainer.innerText = '';
    errorContainer.style.display = 'none';
    inputComponent.setProps((prev) => getNextProps(prev, false));
  }

  if (document.activeElement === inputElement) {
    requestAnimationFrame(() => {
      inputElement.focus();
    });
  }
};

export const generateMarkup = async (ctx) => {
  const {
    inputName, handleOnChange, handleOnBlur, handleOnFocus, config,
  } = ctx;

  const wrapper = document.createElement('div');
  const errorContainer = document.createElement('div');
  errorContainer.classList.add(
    'dropin-field__hint',
    'dropin-field__hint--medium',
    'dropin-field__hint--error',
  );
  errorContainer.style.display = 'none';

  const inputComponent = await UI.render(Input, {
    name: inputName,
    onChange: handleOnChange,
    onBlur: handleOnBlur,
    onFocus: handleOnFocus,
    floatingLabel: `${config.label} *`,
    placeholder: config.label,
  })(wrapper);

  wrapper.appendChild(errorContainer);
  ctx.appendChild(wrapper);

  const inputElement = wrapper.querySelector('input');
  inputElement.value = ctx?.config?.defaultValue ?? '';
  inputElement.required = true;

  // Add blur event to mark field as touched
  inputElement.addEventListener('blur', () => {
    inputElement.dataset.touched = 'true';
  });

  const addressFields = ['street', 'address', 'full_address', 'street_address'];
  if (addressFields.includes(inputName.toLowerCase())) {
    initAutocomplete(inputElement).catch(() => {});
  }

  return { inputElement, inputComponent, errorContainer };
};

export const removeAlias = (code) => {
  if (!code) {
    return null;
  }

  if (code.indexOf('ALIAS') === -1) {
    return code;
  }

  return code.replace('ALIAS', '');
};

export function getFilteredCrossSellProducts(cartItems, limit) {
  // Input validation
  if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
    return [];
  }

  // Create a Set of cart item SKUs for O(1) lookup performance
  const cartItemSkus = new Set(
    cartItems.map((item) => item.sku).filter(Boolean),
  );

  // Track seen cross-sell SKUs to prevent duplicates
  const seenCrossSellSkus = new Set();

  // Collect all cross-sell products first
  const allCrossSellProducts = cartItems
    .flatMap((item) => item.crossSellProducts || [])
    .filter((product) => {
      // Skip if no SKU or already seen
      if (!product?.sku || seenCrossSellSkus.has(product.sku)) {
        return false;
      }

      // Skip if SKU exists in cart
      if (cartItemSkus.has(product.sku)) {
        return false;
      }

      // Add to seen set and include in results
      seenCrossSellSkus.add(product.sku);
      return true;
    });

  // Return limited results
  return allCrossSellProducts.slice(0, limit);
}

// Payment Plan Utility Functions (reusable across components)

// GraphQL mutation for payment plans
export const PAYMENT_PLANS_MUTATION = `mutation PaymentPlans($input: Cart_Details_Input!) {
    paymentPlans(input: $input) {
        cart_hash
        is_available
        cart_details {
            cart_id
            shipping
            tax
            items {
                item_discount_total
                item_price_total
                name
                quantity
                sku
            }
        }
    }
}`;

// Utility function to format cart data consistently
export function formatCartData(cartData, includeCartWrapper = false) {
  const cartDetails = {
    'cart-id': String(cartData.id || ''),
    items:
      cartData.items?.map((item) => ({
        sku: String(item.sku || ''),
        name: String(item.name || ''),
        quantity: String((parseFloat(item.quantity) || 1).toFixed(2)),
        'item-price-total': String(
          (parseFloat(item.price?.value) || 0).toFixed(2),
        ),
        'item-discount-total': String(
          (parseFloat(item.discount?.value) || 0).toFixed(2),
        ),
      })) || [],
    tax: String((parseFloat(cartData.totalTax?.value) || 0).toFixed(2)),
    shipping: String((parseFloat(cartData?.shipping?.value) || 0).toFixed(2)),
  };

  return includeCartWrapper ? { cart: cartDetails } : cartDetails;
}

// Utility function to get XSRF token from cookies
export function getXSRFToken() {
  const xsrfToken = document.cookie
    .split('; ')
    .find((row) => row.startsWith('XSRF-TOKEN='))
    ?.split('=')[1];

  if (!xsrfToken) {
    // console.error('XSRF-TOKEN not found in cookies');
    // logoutUser();
    // return null;
  }

  return xsrfToken;
}

export function getBillingAddress(customerAddresses) {
  if (!Array.isArray(customerAddresses) || customerAddresses.length === 0) {
    return null;
  }
  const billingAddress = customerAddresses.find(
    (addr) => addr.defaultBilling === true,
  );

  return billingAddress;
}

export function getShippingAddress(customerAddresses) {
  if (!Array.isArray(customerAddresses) || customerAddresses.length === 0) {
    return null;
  }
  const billingAddress = customerAddresses.find(
    (addr) => addr.defaultShipping === true,
  );

  return billingAddress;
}
export async function makeSyncCustomerProfileAPICall() {
  const query = `
    mutation SyncCustomerAttributes {
      syncCustomerAttributes {
        email
      }
    }
  `;

  const endpoint = getConfigValue('commerce-endpoint');

  const xsrfToken = getCookie('XSRF-TOKEN');
  const customerToken = getSignInToken();

  return fetchWrapper({
    endpoint,
    query,
    variables: {},
    method: 'POST',
    headers: {
      xsrftoken: xsrfToken,
      token: customerToken,
    },
    isShowLoading: false,
  }).catch((error) => {
    console.error('Error syncing customer attributes:', error);
    throw error;
  });
}

// Utility function to make GraphQL API calls
export async function makeGraphQLCall({
  query,
  variables,
  loaderContainer,
  errorHandler,
  endpoint,
}) {
  try {
    const response = await fetchWrapper({
      endpoint,
      query,
      variables,
      method: 'POST',
      useToken: true,
      isShowLoading: true,
      loaderContainer,
      loaderClass: 'payment-plan-loader', // Use a specific loader class
    });

    if (response.errors && response.errors.length > 0) {
      if (errorHandler) {
        errorHandler(response.errors);
      } else {
        console.error('Payment plan GraphQL errors:', response.errors);
      }
      return null;
    }

    return response;
  } catch (error) {
    if (errorHandler) {
      errorHandler(error);
    } else {
      console.error('Payment plan GraphQL errors:', error);
    }
    return null;
  }
}

// GraphQL mutation for setting custom attributes on cart
export const SET_CUSTOM_ATTRIBUTES_MUTATION = `mutation SetCustomAttributesOnCart($input: CartCustomAttributesInput!) {
    setCustomAttributesOnCart(input: $input) {
        cart {
            id
            custom_attributes {
                attribute_code
                value
            }
        }
    }
}`;

// GraphQL mutation for hash generator
export const HASH_GENERATOR_MUTATION = `mutation Generator($input: hash_generator_Input!) {
    hashGenerator(input: $input) {
        cart_hash
    }
}`;

// Utility function to show generic error message
export function showErrorMessage(container, aemLabels) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'payment-plan-error';
  errorDiv.innerHTML = `
    <div class="error-message">
      ${aemLabels?.checkout?.paymentplan?.generic?.error || 'An error occurred while loading payment options. Please try again.'}
    </div>
  `;
  container.appendChild(errorDiv);
}

export const regenrateInputField = async (ctx) => {
  const markupElements = await generateMarkup(ctx);
  ctx.onChange((nextState) => handleStateChange(nextState, markupElements));
  return markupElements;
};
// Utility function to format cart data for RIC Certification MFE
export function formatCartDataForRIC(cartData) {
  const cartDetails = {
    ppId: cartData.ppId,
    cart: {
      'cart-id': String(cartData.id || ''),
      items:
        cartData.items?.map((item) => ({
          sku: String(item.sku || ''),
          name: String(item.name || ''),
          quantity: String((parseFloat(item.quantity) || 1).toFixed(2)),
          'item-price-total': String(
            (parseFloat(item.price?.value) || 0).toFixed(2),
          ),
          'item-discount-total': String(
            (parseFloat(item.discount?.value) || 0).toFixed(2),
          ),
        })) || [],
      tax: String((parseFloat(cartData.tax) || 0).toFixed(2)),
      shipping: String((parseFloat(cartData?.shipping) || 0).toFixed(2)),
    },
    purchaserName: cartData.purchaserName,
    billingAddress: cartData.billingAddress,
    emailAddress: cartData.emailAddress,
    source: 'GFW-Magento',
  };

  return cartDetails;
}

export const renderNasmAfaaLogo = (container) => {
  const cartCheckoutPath = [CART_PATH, CHECKOUT_PATH, ORDER_CONFIRMATION_PATH];
  // logo render on cart/checkout/order confirm ation pages
  if (!cartCheckoutPath.includes(window.location.pathname)) {
    return;
  }

  // Use innerHTML to directly add <img> tags
  container.innerHTML = `
    <a href="${labels?.header?.nasm?.link}" aria-label="NASM Home" class="logo-link">
      <img src="/icons/nasm-logo.png" width="65" height="48" class="logo-image" alt="NASM Logo" />
    </a>
    <a href="${labels?.header?.afaa?.link}" aria-label="AFAA Home" class="logo-link">
      <img src="/icons/afaa-logo.png" width="65" height="48" class="logo-image" alt="AFAA Logo" />
    </a>
  `;
};

export function isShowVaultedCreditCard() {
  const storedData = sessionStorage.getItem(CART_HAS_REGULAR_PRODUCTS);
  return storedData === 'true' ? 1 : 0;
}

// Transform single item to GA4 format
export function transformItemToGA4(item, index = 0) {
  if (!item) return null;

  let coupon = '';

  if (item.discount?.label?.length > 0 && Array.isArray(item?.discount?.label)) {
    coupon = item.discount.label.join(',');
  }

  return {
    item_id: item.sku,
    item_name: item.name,
    affiliation: 'NASM',
    discount: item.discount?.value || 0,
    index,
    item_brand: 'NASM',
    item_category: item.categories?.[0] || '',
    item_variant: item?.selectedOptions?.['Renewal Period'] || '',
    item_type: item.itemType,
    price: item.price?.value || 0,
    quantity: item.quantity || 1,
    coupon,
  };
}

export function transformItemsToGA4(items) {
  if (!items || !Array.isArray(items)) return [];

  return items.map((item, index) => transformItemToGA4(item, index));
}

export function transformCartDataForGA4(cartData, eventType, additionalTrackingData = {}) {
  if (!cartData || !cartData.items) return null;

  const items = transformItemsToGA4(cartData.items);
  const totalValue = cartData.total?.includingTax?.value;
  const couponCodes = getCouponCodes(cartData.appliedCoupons);

  return {
    event: eventType,
    ecommerce: {
      currency: 'USD',
      value: totalValue,
      coupon: couponCodes,
      items,
      ...additionalTrackingData,
    },
  };
}

export function getCouponCodes(appliedCoupons) {
  if (!appliedCoupons || !Array.isArray(appliedCoupons)) return '';

  return appliedCoupons
    .map((coupon) => coupon?.code)
    .join(',');
}

const getTransactionType = (hasMembershipAndOtherItems) => {
  const remainingItemsToPurchase = localStorage.getItem('remainingItemsToPurchase');
  const isOneOfTwoCompleted = sessionStorage.getItem(CART_HAS_REGULAR_PRODUCTS);

  if (hasMembershipAndOtherItems || remainingItemsToPurchase) {
    return {
      transaction_type: 'multi_transaction',
      transaction_order: 'transaction_1of2',
    };
  }

  if (isOneOfTwoCompleted) {
    return {
      transaction_type: 'multi_transaction',
      transaction_order: 'transaction_2of2',
    };
  }

  return {
    transaction_type: 'single_transaction',
    transaction_order: 'transaction_1of1',
  };
};

// Create debounced version with 3 second delay
const debouncedTrackGTMEvent = debounce((transactionType) => {
  trackGTMEvent(transactionType);
}, 3000);

export const trackGTMTransactionType = (hasMembershipAndOtherItems) => {
  const transactionType = getTransactionType(hasMembershipAndOtherItems);
  debouncedTrackGTMEvent(transactionType);
};

export function formatOrderDate(dateString) {
  try {
    const [datePart, timePart] = dateString.split(' ');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hour, minute] = timePart.split(':').map(Number);

    const date = new Date(year, month - 1, day, hour, minute);

    // Format to "MM/DD/YYYY hh:mm"
    const options = {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    };

    let formatted = new Intl.DateTimeFormat('en-US', options).format(date);

    formatted = formatted.replace(',', '');
    return `${formatted} MST`;
  } catch (e) {
    console.error('Date formatting error:', e);
    return dateString;
  }
}

export function getCartType(cartData) {
  const items = cartData?.items || [];
  const hasMembership = items.some(
    (item) => item.itemType === 'ConfigurableCartItem',
  );
  if (hasMembership) {
    return 'membership';
  }

  return 'normal';
}

export async function setCartIdToCustomAttributes(
  cartData,
) {
  try {
    const cartType = getCartType(cartData);
    const customAttributes = [
      {
        attribute_code: SELECTED_PAYMENT_PLAN,
        value: '',
      },
      {
        attribute_code: QUOTE_MASKED_ID,
        value: cartData.id,
      },
      {
        attribute_code: CART_TYPE,
        value: cartType,
      },
      {
        attribute_code: CART_SKU_LIST,
        value: cartData.items.map((item) => item.sku).join(','),
      },
    ];

    const endpoint = getConfigValue('commerce-core-endpoint');
    const response = await makeGraphQLCall({
      query: SET_CUSTOM_ATTRIBUTES_MUTATION,
      variables: {
        input: {
          cart_id: cartData.id,
          custom_attributes: customAttributes,
        },
      },
      isShowLoading: false,
      endpoint,
    });

    if (!response) return null;

    return 'success';
  } catch (error) {
    console.error('Error setting custom attributes on cart:', error);
    return null;
  }
}

export const getThumbnailImage = ({
  src,
  alt,
  name,
  width,
  height,
  loading,
  className = '',
}) => {
  const optimizedUrl = `${src}/as/thumbnail.webp?width=88&height=88&quality=80&format=webp`;
  const img = document.createElement('img');
  img.src = optimizedUrl;
  img.alt = alt || name;
  img.width = width;
  img.height = height;
  img.className = className;
  if (loading) {
    img.loading = loading;
  }

  // Add error handler to fallback to no-image.jpg
  img.onerror = () => {
    img.src = '/icons/no-image.png';
  };

  return img;
};

export async function setCustomAttributesOnCart(
  cartId,
  customAttributes,
  loaderContainer,
) {
  try {
    const endpoint = getConfigValue('commerce-core-endpoint');
    const response = await makeGraphQLCall({
      query: SET_CUSTOM_ATTRIBUTES_MUTATION,
      variables: {
        input: {
          cart_id: cartId,
          custom_attributes: customAttributes,
        },
      },
      loaderContainer,
      endpoint,
    });

    if (!response) return null;

    return response.data.setCustomAttributesOnCart.cart;
  } catch (error) {
    console.error('Error setting custom attributes on cart:', error);
    return null;
  }
}

export function getProductPath(product) {
  if (!product) return '';

  const urlKey = product?.url_key || product?.url?.urlKey || '';

  const sku = product?.topLevelSku || product?.sku || '';

  const attributes = product?.custom_attributesV2?.items || product?.productAttributes || [];

  const pdpTypeItem = attributes.find((attr) => {
    const normalizedCode = attr?.code?.toLowerCase()?.replace(/\s|_/g, '');
    return normalizedCode === 'pdptype';
  });

  const pdpType = pdpTypeItem?.selected_options?.[0]?.label || '';

  return getProductUrlByType(urlKey, sku, pdpType);
}
