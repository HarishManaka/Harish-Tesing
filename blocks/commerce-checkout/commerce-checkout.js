/* eslint-disable no-unused-vars */
/* eslint-disable no-shadow */
/* eslint-disable no-use-before-define */
/* eslint-disable prefer-const */

import { events } from '@dropins/tools/event-bus.js';
import { Header, ProgressSpinner, provider as UI } from '@dropins/tools/components.js';
import * as cartApi from '@dropins/storefront-cart/api.js';
import CartSummaryList from '@dropins/storefront-cart/containers/CartSummaryList.js';
import EmptyCart from '@dropins/storefront-cart/containers/EmptyCart.js';
import { render as CartProvider } from '@dropins/storefront-cart/render.js';
import MergedCartBanner from '@dropins/storefront-checkout/containers/MergedCartBanner.js';
import OutOfStock from '@dropins/storefront-checkout/containers/OutOfStock.js';
import ServerError from '@dropins/storefront-checkout/containers/ServerError.js';
import { render as CheckoutProvider } from '@dropins/storefront-checkout/render.js';
import { setShippingMethodsOnCart } from '@dropins/storefront-checkout/api.js';
import { initReCaptcha } from '@dropins/tools/recaptcha.js';
import CustomOrderSummary from '../../custom-blocks/order-summary/order-summary.js';
import YourDiscounts from '../../custom-blocks/your-discounts/your-discounts.js';
import MixedCartConflictModal, {
  MembershipLimitConflictModal,
} from '../../custom-blocks/cart-conflict-modals/cart-conflict-modals.js';
import MultiStepCheckout from './multi-step-checkout/index.js';
import { fetchPlaceholders } from '../../scripts/commerce.js';
import { getEnvironment, trackGTMEvent } from '../../scripts/configs.js';
import { loadCSS, loadScript, readBlockConfig } from '../../scripts/aem.js';
import {
  hasMembershipItem,
  hasRenewalPeriodConflict,
  ENV_CONFIG,
  transformCartDataForGA4,
  trackGTMTransactionType,
  setCartIdToCustomAttributes,
  getThumbnailImage,
  startAuthDropinTokenTimer,
} from '../../utils/cart-checkout.js';
import { isCartEmpty, isCheckoutEmpty } from '../../scripts/checkout.js';
import {
  ORDER_HELP_PATH,
  GOOGLE_MAPS_API_URL,
  OPTIMIZELY_SCRIPT_PATH,
  CART_SELECTED_PAYMENT_PLAN,
  SECURE_BADGE,
  CART_PATH,
  SHIPPING_ADDRESS_ID,
  BILLING_ADDRESS_ID,
} from '../../scripts/constants.js';
import { rootLink } from '../../scripts/scripts.js';
import { loadFragment } from '../fragment/fragment.js';
// Initializers
import '../../scripts/initializers/account.js';
import '../../scripts/initializers/checkout.js';
import '../../scripts/initializers/order.js';

try {
  await loadScript(OPTIMIZELY_SCRIPT_PATH);
} catch (error) {
  console.error('Error loading Optimizely script:', error);
}

loadScript(GOOGLE_MAPS_API_URL, { async: true }, 'google');

await loadCSS(`${window.hlx.codeBasePath}/shared-components/cart-checkout/cart-checkout.css`);
await loadCSS(`${window.hlx.codeBasePath}/blocks/commerce-checkout/multi-step-checkout/multi-step-checkout.css`);

function createMetaTag(property, content, type) {
  if (!property || !type) {
    return;
  }
  let meta = document.head.querySelector(`meta[${type}="${property}"]`);
  if (meta) {
    if (!content) {
      meta.remove();
      return;
    }
    meta.setAttribute(type, property);
    meta.setAttribute('content', content);
    return;
  }
  if (!content) {
    return;
  }
  meta = document.createElement('meta');
  meta.setAttribute(type, property);
  meta.setAttribute('content', content);
  document.head.appendChild(meta);
}

function setMetaTags(dropin) {
  createMetaTag('title', dropin);
  createMetaTag('description', dropin);
  createMetaTag('keywords', dropin);

  createMetaTag('og:description', dropin);
  createMetaTag('og:title', dropin);
  createMetaTag('og:url', window.location.href, 'property');
}

const isSuspendedUser = sessionStorage.getItem('isSuspendedUser');
const cartData = await cartApi?.getCartData();
const labels = await fetchPlaceholders();

const CartDetails = (() => {
  let cartData = {
    totalValue: 0,
    itemCount: 0,
  };

  return {
    setCart(data = {}) {
      cartData = { ...cartData, ...data };
      window.nasmCartState = {
        total: cartData.totalValue,
        count: cartData.itemCount,
      };
    },

    getCart() {
      return { ...cartData };
    },
  };
})();

// set the current state of cart
CartDetails.setCart({
  totalValue: cartData?.subtotal?.excludingTax?.value || 0,
  itemCount: cartData?.totalQuantity || 0,
});

export default async function decorate(block) {
  await startAuthDropinTokenTimer();
  sessionStorage.removeItem(CART_SELECTED_PAYMENT_PLAN);
  sessionStorage.removeItem(SHIPPING_ADDRESS_ID);
  sessionStorage.removeItem(BILLING_ADDRESS_ID);

  let isSetShippingMethod = false;
  if (isSuspendedUser) {
    window.location.href = rootLink(ORDER_HELP_PATH);
  }

  setMetaTags('Checkout');
  document.title = 'Checkout';

  const { 'hide-attributes': hideAttributes = '' } = readBlockConfig(block);

  // Define the Layout for the Checkout
  const checkoutFragment = document.createRange().createContextualFragment(`
    <div class="checkout__place-order-spinner hidden"></div>
    <div class="checkout__wrapper" id="checkoutWrapper">
      <div class="checkout__loader"></div>
      <div class="checkout__merged-cart-banner"></div>
      <div class="checkout__content">
        <div class="checkout__main">
          <div class="checkout__block checkout__multi-step-checkout_wrapper">
            <div class="checkout__block checkout__heading"></div>
            <div class="checkout__block checkout__multi-step-checkout">
              <div class="checkoout__multistep-loader"></div>
            </div>
          </div>
          <div class="checkout__payment-plan-mfe"></div>
          <div class="checkout__block checkout__empty-cart"></div>
          <div class="checkout__block checkout__server-error"></div>
          <div class="checkout__block checkout__out-of-stock"></div>
          <div class="checkout__block checkout__login"></div>
          <div class="checkout__block checkout__shipping-form"></div>
          <div class="checkout__block checkout__bill-to-shipping"></div>
          <div class="checkout__block checkout__delivery"></div>
          <div class="checkout__block checkout__payment-methods"></div>
          <div class="checkout__block checkout__billing-form"></div>
          <div class="checkout__block checkout__terms-and-conditions"></div>
          <div class="checkout__block checkout__place-order"></div>
          <div class="checkout__block checkout__cart-summary"></div>
        </div>
        <div class="checkout__aside">
          <div class="checkout__block checkout__your-discounts"></div>
          <div class="checkout__block checkout__custom-order-summary"></div>
          <div class="secure-badge-wrapper"></div>
        </div>
      </div>
      <div class="checkout__sticky-order-summary"></div>
    </div>
    <div class="cart-conflict-modal"></div>
    <div class="cart-value-changed-modal"></div>
    <div class="checkout__steps-loading-spinner"></div>
  `);

  const $content = checkoutFragment.querySelector('.checkout__content');
  const $loader = checkoutFragment.querySelector('.checkout__loader');
  const $mergedCartBanner = checkoutFragment.querySelector(
    '.checkout__merged-cart-banner',
  );
  const $multiStepCheckout = checkoutFragment.querySelector(
    '.checkout__multi-step-checkout',
  );
  const checkoutBlockLoader = document.querySelector('.section[data-id="checkout-block-loader"]');

  const $heading = checkoutFragment.querySelector('.checkout__heading');
  const $emptyCart = checkoutFragment.querySelector('.checkout__empty-cart');
  const $serverError = checkoutFragment.querySelector(
    '.checkout__server-error',
  );
  const $outOfStock = checkoutFragment.querySelector('.checkout__out-of-stock');
  const $cartConflictModal = checkoutFragment.querySelector(
    '.cart-conflict-modal',
  );
  const $billingForm = checkoutFragment.querySelector(
    '.checkout__billing-form',
  );
  const $customOrderSummary = checkoutFragment.querySelector(
    '.checkout__custom-order-summary',
  );
  const $yourDiscounts = checkoutFragment.querySelector(
    '.checkout__your-discounts',
  );
  const $stickyOrderSummary = checkoutFragment.querySelector(
    '.checkout__sticky-order-summary',
  );
  const $cartSummary = checkoutFragment.querySelector(
    '.checkout__cart-summary',
  );
  const $secureBadgeWrapper = checkoutFragment.querySelector('.secure-badge-wrapper');
  const $checkoutMultistepLoader = checkoutFragment.querySelector('.checkoout__multistep-loader');

  block.appendChild(checkoutFragment);

  // Global state
  let initialized = false;
  let isConflictModalShown = false;

  await UI.render(ProgressSpinner, {
    className: '.checkout__overlay-spinner',
  })($checkoutMultistepLoader);

  // Handle cart product conflict modals
  const handleCartModals = (cartItemData) => {
    const hasMembershipAndOtherItems = hasMembershipItem(cartItemData);
    if (hasRenewalPeriodConflict(cartItemData)) {
      CheckoutProvider.render(MembershipLimitConflictModal, {
        cartData: cartItemData,
        labels,
      })($cartConflictModal);
      isConflictModalShown = true;
    } else if (hasMembershipAndOtherItems) {
      CheckoutProvider.render(MixedCartConflictModal, {
        cartData: cartItemData,
        labels,
      })($cartConflictModal);
      isConflictModalShown = true;
    }
    trackGTMTransactionType(hasMembershipAndOtherItems);
  };

  // Render MultiStepCheckout component
  if (!isCartEmpty(cartData)) {
    handleCartModals(cartData);

    CheckoutProvider.render(MultiStepCheckout, {
      cartData,
      labels,
    })($multiStepCheckout);

    const ga4Data = transformCartDataForGA4(cartData, 'begin_checkout');
    if (ga4Data) {
      trackGTMEvent({ ecommerce: null });
      trackGTMEvent(ga4Data);
    }

    await setCartIdToCustomAttributes(cartData);
    if (checkoutBlockLoader) checkoutBlockLoader.setAttribute('hidden', '');
  }

  // Container and component references
  let emptyCart;

  // Render the initial containers
  await Promise.all([
    CheckoutProvider.render(MergedCartBanner)($mergedCartBanner),

    CheckoutProvider.render(ServerError, {
      autoScroll: true,
      onRetry: () => {
        $content.classList.remove('checkout__content--error');
      },
      onServerError: () => {
        $content.classList.add('checkout__content--error');
      },
    })($serverError),

    CheckoutProvider.render(OutOfStock, {
      routeCart: () => rootLink('/cart'),
      onCartProductsUpdate: (items) => {
        cartApi.updateProductsFromCart(items).catch(console.error);
      },
    })($outOfStock),

    // Custom Order Summary right rail
    CartProvider.render(CustomOrderSummary, {
      showAccordionHeading: true,
      className: 'common-aside__wrapper',
    })($customOrderSummary),

    CartProvider.render(YourDiscounts, {
      className: 'your-discounts common-aside__wrapper',
    })($yourDiscounts),

    // Secure Badge
    (async () => {
      const badgeFragment = await loadFragment(SECURE_BADGE);
      while (badgeFragment.firstElementChild) {
        $secureBadgeWrapper.append(badgeFragment.firstElementChild);
      }
    })(),

    // Sticky Order Summary
    CartProvider.render(CustomOrderSummary, {
      showAccordionHeading: true,
      className: 'sticky-order-summary',
      isExpanded: false,
      isSticky: true,
    })($stickyOrderSummary),

    CartProvider.render(CartSummaryList, {
      variant: 'secondary',
      attributesToHide: ['price', 'quantity', 'sku', 'total', 'Regular Price']
        .concat(hideAttributes.split(',').map((attr) => attr.trim()))
        .filter((attr) => attr),
      slots: {
        Thumbnail: (ctx) => {
          const { item, defaultImageProps } = ctx;
          const optimizedImage = getThumbnailImage({
            src: defaultImageProps?.src,
            alt: defaultImageProps.alt || item.name,
            name: item.name,
            width: 88,
            height: 88,
            className: 'dropin-image',
          });
          ctx.replaceWith(optimizedImage);
        },
        Heading: (headingCtx) => {
          const count = headingCtx.count || 0;
          const itemLabel = count === 1
            ? labels?.cart.item.count.text
            : `${labels?.cart.item.count.text}s`;
          const title = `${labels.cart.title} ${
            count ? ` <span>${count} ${itemLabel}</span>` : ''
          }`;

          const headerContainer = document.createElement('div');
          UI.render(Header, {
            title,
            size: 'large',
            divider: true,
          })(headerContainer);

          $heading.innerHTML = '';
          $heading.appendChild(headerContainer);

          headingCtx.onChange((nextCtx) => {
            const nextCount = nextCtx.count || 0;
            const nextItemLabel = nextCount === 1 ? labels?.cart.item.count.text : `${labels?.cart.item.count.text}s`;

            const checkoutTitle = `${labels.checkout.title}${nextCount ? ` <span>${nextCount} ${nextItemLabel}</span>` : ''}`;
            headerContainer.querySelector('.dropin-header-container__title').innerHTML = checkoutTitle;
          });

          const cartSummaryListHeading = document.createElement('div');
          cartSummaryListHeading.classList.add('cart-summary-list__heading');

          const cartSummaryListHeadingText = document.createElement('div');
          cartSummaryListHeadingText.classList.add(
            'cart-summary-list__heading-text',
          );

          // Use innerHTML to render the span
          cartSummaryListHeadingText.innerHTML = title;
          const editCartLink = document.createElement('a');
          editCartLink.classList.add('cart-summary-list__edit');
          editCartLink.href = rootLink('/cart');
          editCartLink.rel = 'noreferrer';
          editCartLink.innerText = labels.checkout.edit.btn.text;

          cartSummaryListHeading.appendChild(cartSummaryListHeadingText);
          cartSummaryListHeading.appendChild(editCartLink);
          headingCtx.appendChild(cartSummaryListHeading);

          headingCtx.onChange((nextHeadingCtx) => {
            const nextCount = nextHeadingCtx.count || 0;
            const nextItemLabel = nextCount === 1
              ? labels?.cart.item.count.text
              : `${labels?.cart.item.count.text}s`;
            cartSummaryListHeadingText.innerHTML = `${labels.cart.title} ${
              nextCount ? ` <span>${nextCount} ${nextItemLabel}</span>` : ''
            }`;
          });
        },
        ProductAttributes: (ctx) => {
          const { rowTotal } = ctx.item || {};

          const wrapper = document.createElement('div');
          wrapper.className = 'product-attributes-wrapper';

          wrapper.innerHTML = `
            <div class="custom-price-line">
              <span class="dropin-price--sale dropin-price--bold dropin-price--small">$${rowTotal?.value}</span>
              <span class="custom-price">${labels?.cart.cartSummaryList.PriceNote}</span>
            </div>
          `;

          ctx.appendChild(wrapper);
        },
        Footer: (ctx) => {
          const footerContainer = document.createElement('div');
          footerContainer.className = 'cart-item-footer-container';

          footerContainer.innerHTML = `
            <div class="product-attributes-badges">
              <div class="badge-container">
                ${ctx.item.itemType === 'SimpleCartItem' ? `
                  <span class="shippable-item-badge">
                    <span>${labels?.cart.cartSummaryList.ShippableText}</span>
                  </span>
                ` : ''}
                ${ctx.item.itemType === 'ConfigurableCartItem' ? `
                  <span class="membership-item-badge">
                    <span>${labels?.cart.cartSummaryList.MembershipText}</span>
                  </span>
                ` : ''}
              </div>
            </div>
          `;
          ctx.appendChild(footerContainer);
        },
      },
    })($cartSummary),
  ]);

  const removeOverlaySpinner = () => {
    $checkoutMultistepLoader.remove();
  };

  const displayEmptyCart = async () => {
    removeOverlaySpinner();
    if (emptyCart) return;

    emptyCart = await CartProvider.render(EmptyCart, {
      routeCTA: () => rootLink('/'),
    })($emptyCart);

    $content.classList.add('checkout__content--empty');
  };

  const removeEmptyCart = () => {
    if (!emptyCart) return;

    emptyCart.remove();
    emptyCart = null;
    $emptyCart.innerHTML = '';

    $content.classList.remove('checkout__content--empty');
  };

  const initializeCheckout = async (data) => {
    if (initialized) return;
    removeEmptyCart();
    removeOverlaySpinner();
    await initReCaptcha(0);
  };

  // Define the event handlers
  const handleCartInitialized = async (data) => {
    if (!isConflictModalShown && !isCartEmpty(data)) {
      handleCartModals(data);
    }

    if (isCartEmpty(data)) {
      window.location.href = rootLink(CART_PATH);
    }
  };

  const handleCartMerged = async (data) => {
    // re-render MultiStepCheckout, if cart is merged
    const newCartData = data.newCart;
    if (!isCartEmpty(newCartData)) {
      CheckoutProvider.render(MultiStepCheckout, {
        cartData: newCartData,
        labels,
      })($multiStepCheckout);

      await setCartIdToCustomAttributes(newCartData);

      CartDetails.setCart({
        totalValue: newCartData?.subtotal?.excludingTax?.value || 0,
        itemCount: newCartData?.totalQuantity || 0,
      });
    } else {
      window.location.href = rootLink(CART_PATH);
    }

    if (!isConflictModalShown && !isCartEmpty(newCartData)) {
      handleCartModals(newCartData);
    }
  };

  const setShippingMethod = async (shippingMethod) => {
    if (!shippingMethod) return;
    const shippingMethods = [
      {
        method_code: shippingMethod.code,
        carrier_code: shippingMethod.carrier.code,
      },
    ];
    if (!isSetShippingMethod) {
      await setShippingMethodsOnCart(shippingMethods);
      isSetShippingMethod = true;
    }
    sessionStorage.setItem('selectedShippingMethod', JSON.stringify(shippingMethod));
  };

  const handleCheckoutInitialized = async (data) => {
    if (!data || isCheckoutEmpty(data)) return;
    await setShippingMethod(data?.shippingAddresses?.[0]?.selectedShippingMethod);

    await initializeCheckout(data);
    initialized = true;
    // store shipping and billing address id in session storage.
    const { shippingAddresses, billingAddress } = data;
    if (shippingAddresses && shippingAddresses?.[0]?.id) {
      sessionStorage.setItem(SHIPPING_ADDRESS_ID, shippingAddresses?.[0]?.id);
      sessionStorage.setItem('checkoutValues', JSON.stringify({ selectedShippingMethod: shippingAddresses[0].selectedShippingMethod }));
    }

    if (billingAddress && billingAddress.id) {
      sessionStorage.setItem(BILLING_ADDRESS_ID, billingAddress.id);
    }
  };

  const handleCheckoutUpdated = async (data) => {
    if (!initialized) {
      await initializeCheckout(data);
    }
  };

  const handleCartData = (data) => {
    const totalValue = data?.total?.includingTax?.value || 0;
    if (totalValue === 0) {
      $billingForm.classList.add('hidden');
    } else {
      $billingForm.classList.remove('hidden');
    }
  };

  const handleCheckoutValues = async (data) => {
    if (!data) return;
    await setShippingMethod(data?.selectedShippingMethod);
  };

  events.on('cart/initialized', handleCartInitialized, { eager: true });
  events.on('checkout/initialized', handleCheckoutInitialized, { eager: true });
  events.on('checkout/updated', handleCheckoutUpdated);
  events.on('checkout/values', handleCheckoutValues, { eager: true });
  events.on('cart/data', handleCartData, { eager: true });
  events.on('cart/merged', handleCartMerged, { eager: true });
}
