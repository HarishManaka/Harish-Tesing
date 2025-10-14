/* eslint-disable import/prefer-default-export, import/no-cycle */
import { getMetadata } from './aem.js';
import {
  getHeaders,
  getConfigValue,
  getCookie,
  getRootPath,
} from './configs.js';
import { getConsent } from './scripts.js';
import { isPayTodayEligible } from '../utils/cart-checkout.js';

/**
 * Gets placeholders object.
 * @param {string} [prefix] Location of placeholders
 * @returns {object} Window placeholders object
 */
// eslint-disable-next-line import/prefer-default-export
export async function fetchPlaceholders(prefix = 'default') {
  const overrides = getMetadata('placeholders') || getRootPath().replace(/\/$/, '/placeholders.json') || '';
  const [fallback, override] = overrides.split('\n');
  window.placeholders = window.placeholders || {};

  if (!window.placeholders[prefix]) {
    window.placeholders[prefix] = new Promise((resolve) => {
      const url = fallback || `${prefix === 'default' ? '' : prefix}/placeholders.json`;
      Promise.all([fetch(url), override ? fetch(override) : Promise.resolve()])
        // get json from sources
        .then(async ([resp, oResp]) => {
          if (resp.ok) {
            if (oResp?.ok) {
              return Promise.all([resp.json(), await oResp.json()]);
            }
            return Promise.all([resp.json(), {}]);
          }
          return [{}];
        })
        // process json from sources
        .then(([json, oJson]) => {
          const placeholders = {};

          const allKeys = new Set([
            ...(json.data?.map(({ Key }) => Key) || []),
            ...(oJson?.data?.map(({ Key }) => Key) || []),
          ]);

          allKeys.forEach((Key) => {
            if (!Key) return;
            const keys = Key.split('.');
            const originalValue = json.data?.find((item) => item.Key === Key)?.Value;
            const overrideValue = oJson?.data?.find((item) => item.Key === Key)?.Value;
            const finalValue = overrideValue ?? originalValue;
            const lastKey = keys.pop();
            const target = keys.reduce((obj, key) => {
              obj[key] = obj[key] || {};
              return obj[key];
            }, placeholders);
            target[lastKey] = finalValue;
          });

          window.placeholders[prefix] = placeholders;
          resolve(placeholders);
        })
        .catch((error) => {
          // eslint-disable-next-line no-console
          console.error('error loading placeholders', error);
          // error loading placeholders
          window.placeholders[prefix] = {};
          resolve(window.placeholders[prefix]);
        });
    });
  }
  return window.placeholders[`${prefix}`];
}

/**
 * Compute Pay Today eligibility and derived values in a shared way.
 * @param {object} cartData - Cart data object (dropins format)
 * @param {object} labels - Placeholders/configs object
 * @returns {{ isRenderPayToday: boolean, payTodayAmount: number, offerAmount: number }}
 */
export function computePayTodayInfo(cartData, labels) {
  try {
    const eligible = isPayTodayEligible(cartData, labels);
    const totalIncludingTax = parseFloat(cartData?.total?.includingTax?.value) || 0;
    const offerAmount = parseFloat((labels?.cart?.paytoday?.offer?.offerAmount || '').toString().replace('$', '')) || 0;
    const payTodayAmount = eligible ? (totalIncludingTax - offerAmount) : totalIncludingTax;
    return {
      isRenderPayToday: eligible,
      payTodayAmount,
      offerAmount,
    };
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('computePayTodayInfo failed:', e);
    const totalIncludingTax = parseFloat(cartData?.total?.includingTax?.value) || 0;
    return { isRenderPayToday: false, payTodayAmount: totalIncludingTax, offerAmount: 0 };
  }
}

/* Common query fragments */
export const priceFieldsFragment = `fragment priceFields on ProductViewPrice {
  roles
  regular {
      amount {
          currency
          value
      }
  }
  final {
      amount {
          currency
          value
      }
  }
}`;

/**
 * Creates a short hash from an object by sorting its entries and hashing them.
 * @param {Object} obj - The object to hash
 * @param {number} [length=5] - Length of the resulting hash
 * @returns {string} A short hash string
 */
function createHashFromObject(obj, length = 5) {
  // Sort entries by key and create a string of key-value pairs
  const objString = Object.entries(obj)
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
    .map(([key, value]) => `${key}:${value}`)
    .join('|');

  // Create a short hash using a simple string manipulation
  return objString
    .split('')
    .reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) % 2147483647, 0)
    .toString(36)
    .slice(0, length);
}

export async function commerceEndpointWithQueryParams() {
  const urlWithQueryParams = new URL(getConfigValue('commerce-endpoint'));
  const headers = getHeaders('cs');
  const shortHash = createHashFromObject(headers);
  urlWithQueryParams.searchParams.append('cb', shortHash);
  return urlWithQueryParams;
}

/* Common functionality */

export async function performCatalogServiceQuery(query, variables) {
  const headers = {
    ...(getHeaders('cs')),
    'Content-Type': 'application/json',
  };

  const apiCall = await commerceEndpointWithQueryParams();
  apiCall.searchParams.append('query', query.replace(/(?:\r\n|\r|\n|\t|[\s]{4})/g, ' ')
    .replace(/\s\s+/g, ' '));
  apiCall.searchParams.append('variables', variables ? JSON.stringify(variables) : null);

  const response = await fetch(apiCall, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    return null;
  }

  const queryResponse = await response.json();

  return queryResponse.data;
}

export function getSignInToken() {
  return getCookie('auth_dropin_user_token');
}

export async function performMonolithGraphQLQuery(query, variables, GET = true, USE_TOKEN = false) {
  const GRAPHQL_ENDPOINT = getConfigValue('commerce-core-endpoint');

  const headers = {
    'Content-Type': 'application/json',
    Store: getConfigValue('headers.cs.Magento-Store-View-Code'),
  };

  if (USE_TOKEN) {
    if (typeof USE_TOKEN === 'string') {
      headers.Authorization = `Bearer ${USE_TOKEN}`;
    } else {
      const token = getSignInToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }
  }

  let response;
  if (!GET) {
    response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query: query.replace(/(?:\r\n|\r|\n|\t|[\s]{4})/g, ' ').replace(/\s\s+/g, ' '),
        variables,
      }),
    });
  } else {
    const endpoint = new URL(GRAPHQL_ENDPOINT);
    endpoint.searchParams.set('query', query.replace(/(?:\r\n|\r|\n|\t|[\s]{4})/g, ' ').replace(/\s\s+/g, ' '));
    endpoint.searchParams.set('variables', JSON.stringify(variables));
    response = await fetch(
      endpoint.toString(),
      { headers },
    );
  }

  if (!response.ok) {
    return null;
  }

  return response.json();
}

export function renderPrice(product, format, html = (strings, ...values) => strings.reduce((result, string, i) => result + string + (values[i] || ''), '')) {
  // Check for plp_price attribute first - only show plp_price or blank
  const plpPriceAttr = product.attributes?.find((attr) => attr.name === 'plp_price');
  if (plpPriceAttr && plpPriceAttr.value) {
    const plpPrice = parseFloat(plpPriceAttr.value);
    if (!Number.isNaN(plpPrice) && plpPrice > 0) {
      // Check for default_instalment attribute to determine if "/mo" should be shown
      const defaultInstalmentAttr = product.attributes?.find((attr) => attr.name === 'default_instalment');
      const defaultInstalment = defaultInstalmentAttr?.value
        ? parseInt(defaultInstalmentAttr.value, 10) : null;

      // Show "/mo" if:
      // 1. default_instalment exists and > 1, OR
      // 2. no default_instalment (subscription type product)
      const showMonthly = !defaultInstalmentAttr || (defaultInstalment && defaultInstalment > 1);

      return html`<span class="price-final">${format(plpPrice)}${showMonthly ? '/mo' : ''}</span>`;
    }
  }

  // If no valid plp_price, return blank
  return null;
}

/* PDP specific functionality */

export function getSkuFromUrl() {
  const path = window.location.pathname;
  // Updated regex to handle new URL structures:
  // /products/subscription/urlkey/sku, /products/bundle/urlkey/sku,
  // /products/single/urlkey/sku, etc.
  const result = path.match(/\/products\/(?:[\w|-]+\/)?[\w|-]+\/([\w|-]+)(\.html)?$/);
  let sku = result?.[1];
  // Xwalk: If in AEM authoring environment, try to get fallback sku from page metadata
  // if url does not resolve to a valid sku
  if (!sku && window.xwalk.previewSku) {
    sku = window.xwalk.previewSku;
  }

  return sku;
}

export function getOptionsUIDsFromUrl() {
  return new URLSearchParams(window.location.search).get('optionsUIDs')?.split(',');
}

export function getProductUrlByType(urlKey, sku, pdpType) {
  // Normalize pdp_type - handle both string and numeric values
  const pdpTypeMap = {
    1: 'Single_Simple',
    2: 'Single_Complex',
    3: 'Bundle',
    4: 'Matrix',
    5: 'Subscription',
  };

  const normalizedPdpType = pdpTypeMap[pdpType] || pdpType;

  // Route based on pdp_type
  switch (normalizedPdpType) {
    case 'Subscription':
      return `/products/subscription/${urlKey}/${sku}`;
    case 'Bundle':
      return `/products/bundle/${urlKey}/${sku}`;
    case 'Matrix':
      return `/products/matrix/${urlKey}/${sku}`;
    case 'Single_Simple':
      return `/products/single-simple/${urlKey}/${sku}`;
    case 'Single_Complex':
      return `/products/single-complex/${urlKey}/${sku}`;
    default:
      // Default route for any unknown types
      return `/products/${urlKey}/${sku}`;
  }
}

export async function trackHistory() {
  if (!getConsent('commerce-recommendations')) {
    return;
  }
  // Store product view history in session storage
  const storeViewCode = getConfigValue('headers.cs.Magento-Store-View-Code');
  window.adobeDataLayer.push((dl) => {
    dl.addEventListener('adobeDataLayer:change', (event) => {
      if (!event.productContext) {
        return;
      }
      const key = `${storeViewCode}:productViewHistory`;
      let viewHistory = JSON.parse(window.localStorage.getItem(key) || '[]');
      viewHistory = viewHistory.filter((item) => item.sku !== event.productContext.sku);
      viewHistory.push({ date: new Date().toISOString(), sku: event.productContext.sku });
      window.localStorage.setItem(key, JSON.stringify(viewHistory.slice(-10)));
    }, { path: 'productContext' });
    dl.addEventListener('place-order', () => {
      const shoppingCartContext = dl.getState('shoppingCartContext');
      if (!shoppingCartContext) {
        return;
      }
      const key = `${storeViewCode}:purchaseHistory`;
      const purchasedProducts = shoppingCartContext.items.map((item) => item.product.sku);
      const purchaseHistory = JSON.parse(window.localStorage.getItem(key) || '[]');
      purchaseHistory.push({ date: new Date().toISOString(), items: purchasedProducts });
      window.localStorage.setItem(key, JSON.stringify(purchaseHistory.slice(-5)));
    });
  });
}

export function setJsonLd(data, name) {
  const existingScript = document.head.querySelector(`script[data-name="${name}"]`);
  if (existingScript) {
    existingScript.innerHTML = JSON.stringify(data);
    return;
  }

  const script = document.createElement('script');
  script.type = 'application/ld+json';

  script.innerHTML = JSON.stringify(data);
  script.dataset.name = name;
  document.head.appendChild(script);
}

export async function loadErrorPage(code = 404) {
  const htmlText = await fetch(`/${code}.html`).then((response) => {
    if (response.ok) {
      return response.text();
    }
    throw new Error(`Error getting ${code} page`);
  });
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlText, 'text/html');
  document.body.innerHTML = doc.body.innerHTML;
  // get dropin styles
  document.head.querySelectorAll('style[data-dropin]').forEach((style) => {
    doc.head.appendChild(style);
  });
  document.head.innerHTML = doc.head.innerHTML;

  // https://developers.google.com/search/docs/crawling-indexing/javascript/fix-search-javascript
  // Point 2. prevent soft 404 errors
  if (code === 404) {
    const metaRobots = document.createElement('meta');
    metaRobots.name = 'robots';
    metaRobots.content = 'noindex';
    document.head.appendChild(metaRobots);
  }

  // When moving script tags via innerHTML, they are not executed. They need to be re-created.
  const notImportMap = (c) => c.textContent && c.type !== 'importmap';
  Array.from(document.head.querySelectorAll('script'))
    .filter(notImportMap)
    .forEach((c) => c.remove());
  Array.from(doc.head.querySelectorAll('script'))
    .filter(notImportMap)
    .forEach((oldScript) => {
      const newScript = document.createElement('script');
      Array.from(oldScript.attributes).forEach(({ name, value }) => {
        newScript.setAttribute(name, value);
      });
      const scriptText = document.createTextNode(oldScript.innerHTML);
      newScript.appendChild(scriptText);
      document.head.appendChild(newScript);
    });
}

export function mapProductAcdl(product) {
  const regularPrice = product?.priceRange?.minimum?.regular?.amount.value
    || product?.price?.regular?.amount.value || 0;
  const specialPrice = product?.priceRange?.minimum?.final?.amount.value
    || product?.price?.final?.amount.value;
  // storefront-events-collector will use storefrontInstanceContext.storeViewCurrencyCode
  // if undefined, no default value is necessary.
  const currencyCode = product?.priceRange?.minimum?.final?.amount.currency
    || product?.price?.final?.amount.currency || undefined;
  const minimalPrice = product?.priceRange ? regularPrice : undefined;
  const maximalPrice = product?.priceRange
    ? product?.priceRange?.maximum?.regular?.amount.value : undefined;

  // Extract NASM-specific attributes
  const nasmPrice = product?.attributes?.find((attr) => attr.name === 'nasm_price')?.value;
  const plpPrice = product?.attributes?.find((attr) => attr.name === 'plp_price')?.value;
  const defaultInstalment = product?.attributes?.find((attr) => attr.name === 'default_instalment')?.value;
  const pdpType = product?.attributes?.find((attr) => attr.name === 'pdp_type')?.value;

  return {
    productId: parseInt(product.externalId, 10) || 0,
    name: product?.name,
    sku: product?.variantSku || product?.sku,
    topLevelSku: product?.sku,
    pricing: {
      regularPrice,
      minimalPrice,
      maximalPrice,
      specialPrice,
      currencyCode,
      // Add NASM-specific pricing
      nasmPrice: nasmPrice ? parseFloat(nasmPrice) : undefined,
      plpPrice: plpPrice ? parseFloat(plpPrice) : undefined,
    },
    canonicalUrl: new URL(`/products/${product.urlKey}/${product.sku}`, window.location.origin).toString(),
    mainImageUrl: product?.images?.[0]?.url,
    // Add NASM-specific attributes
    nasmAttributes: {
      defaultInstalment: defaultInstalment ? parseInt(defaultInstalment, 10) : undefined,
      pdpType,
    },
  };
}

/**
 * Enhanced add-to-cart helper function that ensures proper data layer setup
 * @param {Object} product - Product data
 * @param {number} quantity - Quantity being added
 * @param {Array} selectedOptions - Selected product options
 */
export function setupAddToCartDataLayer(product, quantity = 1, selectedOptions = []) {
  // Ensure Adobe Data Layer exists
  window.adobeDataLayer = window.adobeDataLayer || [];

  // Map product data with NASM enhancements
  const productContext = mapProductAcdl(product);

  // Add quantity and options to context
  const enhancedProductContext = {
    ...productContext,
    quantity,
    selectedOptions: selectedOptions.length > 0 ? selectedOptions : undefined,
  };

  // Push product context to data layer
  window.adobeDataLayer.push({ productContext: enhancedProductContext });

  return enhancedProductContext;
}

/**
 * Track add_to_cart event using Commerce team's GA4 approach
 * This function creates a mock cart item for GA4 tracking when a product is added to cart
 * @param {Object} product - Product data
 * @param {number} quantity - Quantity being added
 */
export async function trackAddToCartGA4(product, quantity = 1) {
  // Import the Commerce team's utility functions
  const { transformCartDataForGA4 } = await import('../utils/cart-checkout.js');
  const { trackGTMEvent } = await import('./configs.js');

  // Create a mock cart structure that matches the Commerce team's format
  const mockCartData = {
    items: [{
      sku: product.sku,
      name: product.name,
      quantity,
      price: {
        value: product.price?.final?.amount.value || product.price?.regular?.amount.value || 0,
      },
      discount: {
        value: 0,
        label: [],
      },
      categories: product.categories || [],
      itemType: 'SimpleCartItem',
      selectedOptions: {},
    }],
    total: {
      includingTax: {
        value: (product.price?.final?.amount.value
          || product.price?.regular?.amount.value || 0) * quantity,
      },
    },
    appliedCoupons: [],
  };

  // Use Commerce team's transformation function
  const ga4Data = transformCartDataForGA4(mockCartData, 'add_to_cart');

  if (ga4Data) {
    // Clear previous ecommerce data and push new data (Commerce team's pattern)
    trackGTMEvent({ ecommerce: null });
    trackGTMEvent(ga4Data);
  }
}

/**
 * Scrolls to the cart icon in the header after successful add-to-cart operations
 * This function looks for various cart button selectors and smoothly scrolls to it
 */
export function scrollToCartIcon() {
  // Try multiple selectors to find the cart icon/button
  const cartSelectors = [
    '.nav-cart-button', // Desktop nav cart button
    '[data-cart-button]', // Data attribute selector
    '.commerce-mini-cart-trigger', // Commerce mini cart trigger
    '.header .cart-button', // Generic header cart button
    'button[title*="cart" i]', // Button with "cart" in title (case insensitive)
    '[aria-label*="cart" i]', // Element with "cart" in aria-label
    '.cart-icon', // Generic cart icon class
  ];

  let cartElement = null;

  // Try each selector until we find the cart element
  cartSelectors.some((selector) => {
    cartElement = document.querySelector(selector);
    return cartElement !== null;
  });

  // If cart element found, scroll to it smoothly
  if (cartElement) {
    cartElement.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'nearest',
    });

    // Optional: Add a subtle highlight effect to draw attention
    cartElement.style.transition = 'transform 0.3s ease';
    cartElement.style.transform = 'scale(1.1)';
    setTimeout(() => {
      cartElement.style.transform = 'scale(1)';
    }, 300);
  }
}

/**
 * Initialize cart event listeners for auto-scroll functionality
 * Call this function once when the page loads to set up global cart event handling
 */
export function initializeCartScrollListener() {
  // Only initialize once
  if (window.cartScrollListenerInitialized) return;
  window.cartScrollListenerInitialized = true;

  try {
    // Import cart events from dropins
    import('@dropins/storefront-cart/api.js').then(({ events }) => {
      // Listen for cart update events
      if (events && events.on) {
        events.on('cart/updated', () => {
          // Small delay to ensure DOM and cart icon updates are complete
          setTimeout(() => {
            scrollToCartIcon();
          }, 300);
        });

        events.on('cart/add-to-cart', () => {
          // Also listen for direct add-to-cart events
          setTimeout(() => {
            scrollToCartIcon();
          }, 300);
        });
      }
    }).catch(() => {
      // Fallback: Use custom event approach if dropins events not available
      document.addEventListener('cart:updated', () => {
        setTimeout(() => {
          scrollToCartIcon();
        }, 300);
      });
    });
  } catch (error) {
    // Fallback event listener approach
    document.addEventListener('cart:updated', () => {
      setTimeout(() => {
        scrollToCartIcon();
      }, 300);
    });
  }
}
