import {
  getCustomer,
  getCustomerAddress,
} from '@dropins/storefront-account/api.js';

import {
  formatCartDataForRIC,
  getXSRFToken,
  makeGraphQLCall,
  HASH_GENERATOR_MUTATION,
  showErrorMessage,
  RIC_ENV_CONFIG,
  getBillingAddress,
  getShippingAddress,
  displayOverlaySpinner,
  removeOverlaySpinner,
} from '../../utils/cart-checkout.js';
import { getConfigValue, getEnvironment } from '../../scripts/configs.js';

const endpoint = getConfigValue('commerce-endpoint');

// Get cart hash from hash generator API
async function getCartHash({
  container,
  cartData,
  labels,
  loaderContainer,
  emailAddress,
  phoneNumber,
  purchaserName,
  billingAddress,
  ppId,
  shipping,
  tax,
}) {
  try {
    const xsrfToken = getXSRFToken();

    if (!xsrfToken) return { cartHash: null, cartDetails: null };

    const cartDetails = formatCartDataForRIC({
      ...cartData,
      emailAddress,
      phoneNumber,
      purchaserName,
      billingAddress,
      ppId,
      shipping,
      tax,
    });
    // Add customer information to cartDetails

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

    const result = {
      cartHash: response.data.hashGenerator.cart_hash,
      cartDetails,
    };
    return result;
  } catch (error) {
    showErrorMessage(container, labels);
    return { cartHash: null, cartDetails: null };
  }
}

// Create RIC Certification MFE element
function createRICCertificationMFEElement({
  cartHash,
  cartDetails,
  emailAddress,
  phoneNumber,
  purchaserName,
  billingAddress,
  ppId,
}) {
  const mfeElement = document.createElement('payment-plan-ric-mfe');
  const environment = getEnvironment();
  const config = RIC_ENV_CONFIG[environment];

  if (!config || !config.apiUrl) {
    return null;
  }

  mfeElement.setAttribute('api-url', config.apiUrl);
  mfeElement.setAttribute('pp-id', ppId);
  mfeElement.setAttribute('cart', JSON.stringify(cartDetails?.cart));
  mfeElement.setAttribute('key-generated', cartHash);
  mfeElement.setAttribute('view-only', 'false');
  mfeElement.setAttribute('phone-number', phoneNumber);
  mfeElement.setAttribute('email-address', emailAddress);
  mfeElement.setAttribute('source', 'GFW-Magento');
  mfeElement.setAttribute('billing-address', JSON.stringify(billingAddress));
  mfeElement.setAttribute('purchaser-name', purchaserName);

  return mfeElement;
}

// Main function to render RIC certification MFE
export default async function renderRICCertificationMFE({
  container,
  cartData,
  labels = {},
  loaderContainer,
  billToShipping,
  handleUpdateRICCertification,
  ppId,
  shipping,
  tax,
}) {
  try {
    if (container) {
      container.innerHTML = '';
    }

    if (loaderContainer) {
      displayOverlaySpinner(loaderContainer);
    }

    const customer = await getCustomer();
    const customerAddresses = await getCustomerAddress();
    let address = getBillingAddress(customerAddresses);
    if (billToShipping) {
      address = getShippingAddress(customerAddresses);
    }

    if (loaderContainer) {
      removeOverlaySpinner(loaderContainer);
    }

    const RicBillingAddress = {
      line1: address?.street,
      line2: `${address?.city}, ${address?.region?.region}, ${address?.postcode}`,
    };

    const { cartHash, cartDetails } = await getCartHash({
      container,
      cartData,
      labels,
      loaderContainer,
      emailAddress: customer?.email,
      phoneNumber: address?.telephone,
      purchaserName: `${address?.firstname} ${address?.lastname}`,
      billingAddress: RicBillingAddress,
      ppId,
      shipping,
      tax,
    });

    const mfeElement = createRICCertificationMFEElement({
      cartHash,
      cartDetails,
      emailAddress: customer?.email,
      phoneNumber: address?.telephone,
      purchaserName: `${address?.firstname} ${address?.lastname}`,
      billingAddress: RicBillingAddress,
      ppId,
    });

    if (loaderContainer) {
      removeOverlaySpinner(loaderContainer);
    }
    container.appendChild(mfeElement);
    mfeElement.addEventListener('paymentPlanRicEvent', (event) => {
      handleUpdateRICCertification(event);
    });
  } catch (error) {
    console.error('RIC certification MFE', error);
    if (loaderContainer) {
      removeOverlaySpinner(loaderContainer);
    }
  }
}
