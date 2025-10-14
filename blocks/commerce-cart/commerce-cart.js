import { events } from '@dropins/tools/event-bus.js';
import { render as provider } from '@dropins/storefront-cart/render.js';
import * as Cart from '@dropins/storefront-cart/api.js';
// Dropin Containers
import CartSummaryList from '@dropins/storefront-cart/containers/CartSummaryList.js';
import OrderSummary from '@dropins/storefront-cart/containers/OrderSummary.js';
import EmptyCart from '@dropins/storefront-cart/containers/EmptyCart.js';
import GiftOptions from '@dropins/storefront-cart/containers/GiftOptions.js';
import { publishShoppingCartViewEvent } from '@dropins/storefront-cart/api.js';
import { Button, provider as UI } from '@dropins/tools/components.js';
import {
  CROSS_SELL_PRODUCTS_LIMIT,
  AFAA_PATH, NASM_PATH, LOGIN_REDIRECT_TO_CHECKOUT, SECURE_BADGE, OPTIMIZELY_SCRIPT_PATH,
} from '../../scripts/constants.js';
import CartCrossSellProducts from '../../custom-blocks/cart-cross-sell-products/cart-cross-sell-products.js';
import { fetchPlaceholders } from '../../scripts/commerce.js';
import { loadCSS, loadScript, readBlockConfig } from '../../scripts/aem.js';
import {
  isPayTodayEligible,
  createEl,
  getFilteredCrossSellProducts,
  transformCartDataForGA4,
  getThumbnailImage,
  restoreRemainingItemsToCart,
  getProductPath,
} from '../../utils/cart-checkout.js';
import renderCouponCodeBlock, { toggleContainer } from './coupon-code.js';
import { loadFragment } from '../fragment/fragment.js';
import { showRemoveItemModal } from '../cart-remove-modal/cart-remove-modal.js';

// Initializers
import '../../scripts/initializers/cart.js';

import { rootLink } from '../../scripts/scripts.js';

// custom components
import { renderPayToday } from '../../shared-components/cart-checkout/index.js';
import {
  checkIsAuthenticated, formatNumber, trackGTMEvent, IsXSRFTokenPresent,
} from '../../scripts/configs.js';

// load Optimizely script
try {
  await loadScript(OPTIMIZELY_SCRIPT_PATH);
} catch (error) {
  console.error('Error loading Optimizely script:', error);
}

export default async function decorate(block) {
  // Configuration
  const {
    'hide-heading': hideHeading = 'false',
    'max-items': maxItems,
    'hide-attributes': hideAttributes = '',
    'enable-item-quantity-update': enableUpdateItemQuantity = 'false',
    'enable-item-remove': enableRemoveItem = 'true',
    'start-shopping-url': startShoppingURL = '',
    'checkout-url': checkoutURL = '',
  } = readBlockConfig(block);

  await restoreRemainingItemsToCart({
    initiator: 'cart',
  });

  const labels = await fetchPlaceholders();

  let cartData = null;
  try {
    cartData = await Cart.getCartData();
  } catch (error) {
    console.error('Error fetching cart data or empty cart:', error);
  }
  const isEmptyCart = isCartEmpty(cartData);

  const isAuthenticated = checkIsAuthenticated();
  const isXSRFTokenPresent = IsXSRFTokenPresent();

  const loginPath = rootLink(LOGIN_REDIRECT_TO_CHECKOUT);
  const checkoutPath = rootLink(checkoutURL);

  let initialized = false;
  let isRenderPayToday;

  // Layout
  const fragment = document.createRange().createContextualFragment(`
    <div class="cart-error-notification"></div>
    <div class="cart__wrapper">
      <div id="paytodayContainer" class="paytoday-header-container"></div>
      <div class="cart__left-column">
        <div class="cart__list"></div>
        <div class="cart__recommendations"></div>
      </div>
      <div class="cart__right-column">
        <div class="cart-discount__wrapper">
        </div>
        <div class="cart-order-summary__wrapper">
        <div class="cart-order-summary-header collapsible-heading">
         <h3>${labels?.cart.order.summary.container.title}</h3>
         <div class="collapsible-heading__icon"></div>
        </div>
        <div class="cart__order-summary"></div>
        </div>
        <div class="cart-order-summary-clone_wrapper">
        <div class="cart-order-summary-clone"></div>
        <button class="carat-icon" aria-label="Expand Sticky Order Summary"></button>
        </div>
        <div class="secure-badge-wrapper"></div>
     </div>
     </div>
    <div class="cart__empty-cart"></div>
    <div class="checkout__membership-modal"></div>
  `);

  const $wrapper = fragment.querySelector('.cart__wrapper');
  const $errorNotification = fragment.querySelector('.cart-error-notification');
  const $list = fragment.querySelector('.cart__list');
  const $summaryWrapper = fragment.querySelector('.cart-order-summary__wrapper');
  const $summary = fragment.querySelector('.cart__order-summary');
  const $emptyCart = fragment.querySelector('.cart__empty-cart');
  const $discountCode = fragment.querySelector('.cart-discount__wrapper');
  const $orderSummaryIcon = fragment.querySelector('.collapsible-heading__icon');
  const $summaryClone = fragment.querySelector('.cart-order-summary-clone');
  const $caratIcon = fragment.querySelector('.carat-icon');
  const $secureBadgeWrapper = fragment.querySelector('.secure-badge-wrapper');
  const $recommendations = fragment.querySelector('.cart__recommendations');

  block.innerHTML = '';
  block.appendChild(fragment);

  showErrorNotification();

  function toggleEmptyCart(state) {
    if (state) {
      $wrapper.setAttribute('hidden', '');
      $emptyCart.removeAttribute('hidden');
    } else {
      $wrapper.removeAttribute('hidden');
      $emptyCart.setAttribute('hidden', '');
    }
  }

  function showErrorNotification() {
    try {
      const errorData = sessionStorage.getItem('showErrorInCartPage');
      if (errorData) {
        const errors = JSON.parse(errorData);
        if (errors && errors.length > 0) {
          const errorHTML = errors.map((error, index) => `
            <div class="notification notification--error" role="alert" data-error-index="${index}">
              <span class="notification__icon" aria-hidden="true">
                <img src="/icons/exclamation-circle.svg" alt="Error" width="16" height="16" />
              </span>
              <span class="notification__message">
                ${labels.cart.marketing.addtocart.error} ${error} 
              </span>
            </div>
          `).join('');
          $errorNotification.innerHTML = errorHTML;
          setTimeout(() => {
            sessionStorage.removeItem('showErrorInCartPage');
            $errorNotification.innerHTML = '';
          }, 10000);
        }
      }
    } catch (error) {
      console.error('Error displaying cart notification:', error);
    }
  }

  function updateSummaryClone() {
    const isClose = $summaryClone.querySelector('.hidden') !== null;
    const cloneNode = $summaryWrapper.cloneNode(true);
    $summaryClone.innerHTML = '';
    cloneNode.classList.add('cart-order-summary-clone');
    $summaryClone.appendChild(cloneNode);

    const toggleButton = $summaryClone.querySelector('.collapsible-heading__icon');
    toggleButton.addEventListener('click', () => { toggleStickySummary(); });

    if (!initialized || isClose) {
      if (initialized) $caratIcon.classList.remove('visible');
      toggleStickySummary();
      initialized = true;
    }
  }

  toggleEmptyCart(isEmptyCart);
  // Render Containers
  await Promise.all([
    // Cart List
    provider.render(CartSummaryList, {
      hideHeading: hideHeading === 'true',
      attributesToHide: ['price', 'quantity', 'sku', 'total', 'Regular Price']
        .concat(hideAttributes.split(',').map((attr) => attr.trim()))
        .filter((attr) => attr),
      routeProduct: (product) => rootLink(`${getProductPath(product)}`),
      routeEmptyCartCTA: startShoppingURL ? () => rootLink(startShoppingURL) : undefined,
      maxItems: parseInt(maxItems, 10) || undefined,
      enableUpdateItemQuantity: enableUpdateItemQuantity === 'false',
      enableRemoveItem: enableRemoveItem === 'true',
      slots: {
        Thumbnail: (ctx) => {
          const { item, defaultImageProps } = ctx;
          const anchorWrapper = document.createElement('a');
          anchorWrapper.href = getProductPath(item);
          const optimizedImage = getThumbnailImage({
            src: defaultImageProps?.src,
            alt: defaultImageProps.alt || item.name,
            name: item.name,
            width: 88,
            height: 88,
            className: 'dropin-image',
          });
          anchorWrapper.appendChild(optimizedImage);
          ctx.replaceWith(anchorWrapper);
        },
        Heading: (ctx) => {
          const itemCount = cartData?.totalQuantity || 0;

          const headingWrapper = document.createElement('div');
          headingWrapper.className = 'custom-cart-heading-wrapper';

          headingWrapper.innerHTML = `
            <div class="custom-heading-wrapper">
              <span class="custom-cart-heading-text" id="cartHeadingText">${labels?.cart.title}</span>
              <span class="custom-cart-heading-count" id="cartHeadingItemCount">${itemCount} item${itemCount === 1 ? '' : 's'}</span>
            </div>
          `;
          ctx.appendChild(headingWrapper);
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
            <button class="cart-item__remove icon-remove" aria-label="Remove item from cart" data-uid="${ctx.item.uid}"></button>
          `;

          wrapper.querySelector('button')?.addEventListener('click', showRemoveItemModal);

          ctx.appendChild(wrapper);
        },

        Footer: (ctx) => {
          const footerContainer = document.createElement('div');
          footerContainer.className = 'cart-item-footer-container';

          const giftOptions = document.createElement('div');
          provider.render(GiftOptions, {
            item: ctx.item,
            view: 'product',
            dataSource: 'cart',
            handleItemsLoading: ctx.handleItemsLoading,
            handleItemsError: ctx.handleItemsError,
            onItemUpdate: ctx.onItemUpdate,
          })(giftOptions);

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
    })($list),
    (async () => {
      const couponCodeBlock = await renderCouponCodeBlock();
      $discountCode.appendChild(couponCodeBlock);
    })(),
    UI.render(Button, {
      ariaLabel: 'Toggle Order Summary',
      onClick: (e) => {
        const heading = e.target.closest('.collapsible-heading');
        if (!heading) return;
        toggleContainer(e.target, heading);
      },
      onKeyDown: (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const heading = e.target.closest('.collapsible-heading');
          if (!heading) return;
          toggleContainer(e.target, heading);
        }
      },
    })($orderSummaryIcon),
    // Order Summary
    provider.render(OrderSummary, {
      heading: () => createEl('div', {}, createEl('span', {}, 'Your Order Summary')),
      routeProduct: (product) => rootLink(`/products/${product.url.urlKey}/${product.topLevelSku}`),
      routeCheckout: checkoutURL && isAuthenticated ? () => checkoutPath : () => loginPath,
      updateLineItems: (lineItems) => {
        cartData = Cart?.getCartDataFromCache();
        const totalDiscount = formatNumber(cartData?.discount?.value) || 0;
        const subtotalAmount = formatNumber(cartData?.subtotal?.excludingTax?.value) || 0;
        const totalAmount = formatNumber(cartData?.total?.includingTax?.value) || 0;
        const checkoutRedirectLink = checkoutURL && isXSRFTokenPresent ? checkoutPath : loginPath;

        const discountItems = lineItems?.filter((item) => item.key === 'discountsContent');
        const primaryActionItems = lineItems?.filter((item) => item.key === 'primaryActionContent');
        const subTotalContent = lineItems?.find((item) => item.key === 'subTotalContent');

        isRenderPayToday = isPayTodayEligible(cartData, labels);
        const payTodayAmt = cartData?.total?.includingTax?.value;
        subTotalContent.content = createEl('div', {
          className: 'cart-order-summary__subtotal',
        }, [
          createEl('div', {}, [
            createEl('span', { className: 'title' }, labels?.Order.OrderCostSummary.subtotal.title),
            createEl('span', { className: 'subtitle' }, labels?.Order.OrderCostSummary.subtotal.excludingTax.title),
          ]),
          createEl('div', {}, createEl('span', {}, `$${subtotalAmount}`)),
        ]);

        primaryActionItems[0].content = createEl('div', { className: 'pay-today' }, [
          createEl('div', {}, [
            createEl(
              'div',
              { className: 'paytoday-summary-container' },
              [createEl('span', { className: 'payment-plan-label' }, labels?.cart.payment.plan.label),
                createEl('div', { className: 'paytoday-block' }, '')],
            ),
            createEl('div', { className: 'summary-mobile-fields' }, [
              createEl('div', { className: 'total-amt' }, [createEl('div', {}, labels?.cart.summary.total),
                createEl('div', { }, `$${formatNumber(payTodayAmt) || 0}`),
              ]),
              createEl('div', { className: 'mobile-payment-plan-label' }, labels?.cart.paytoday.offer.mobile.desc),
            ]),
          ]),
          createEl('a', {
            className: 'checkout-button',
            href: checkoutRedirectLink,
          }, labels?.Order.OrderCostSummary.checkoutButton.label),
        ]);

        // Add custom total row
        const customTotal = {
          key: 'customTotalContent',
          content: createEl('div', {
            className: 'cart-order-summary__entry cart-order-summary__total',
            'data-custom-total': 'true',
          }, [
            createEl('span', {
              className: 'cart-order-summary__label cart-order-summary__label--bold',
            }, labels?.Order.OrderCostSummary.total?.title || 'Total'),
            createEl('span', {
              className: 'cart-order-summary__price',
            }, `$${totalAmount}`),
          ]),
        };

        const totalContent = lineItems.findIndex((item) => item.key === 'primaryActionContent');
        if (totalContent !== -1) {
          lineItems.splice(totalContent, 0, customTotal);
        }

        if (!discountItems[0].content) {
          return lineItems;
        }

        discountItems[0].content = createEl('div', {
          className: 'discount-summary-container',
        }, [
          createEl('span', {
            className: 'discount-label',
          }, 'Total Discounts applied'),

          createEl('span', {
            className: 'discount-amount',
          }, `-$${totalDiscount}`),
        ]);

        return lineItems;
      },

    })($summary),
    (async () => {
      const badgeFragment = await loadFragment(SECURE_BADGE);
      while (badgeFragment.firstElementChild) {
        $secureBadgeWrapper.append(badgeFragment.firstElementChild);
      }
    })(),
    // Empty Cart
    provider.render(EmptyCart, {
      routeCTA: startShoppingURL ? () => rootLink(startShoppingURL) : undefined,
    })($emptyCart).then(async () => {
      $emptyCart.innerHTML = `
          <div class="cart__empty-header">
            <h2>${labels?.cart.title}</h2>
            <p>${labels?.cart.noitems.label}</p>
          </div>
          <div class="cart__empty-wrapper">
          <div class="cart__empty-image">
            <label class="cart__empty-label">${labels?.cart.emptycart.title}</label>
            <p class="cart__empty-text">${labels?.cart.emptycart.description}</p>
          </div>
          </div>
        `;

      const $buttonPrimary = document.createElement('div');
      UI.render(Button, {
        children: labels?.cart.emptycart.browsenasm.button,
        variant: 'primary',
        className: 'button-primary',
        href: rootLink(NASM_PATH),
      })($buttonPrimary);
      $emptyCart.appendChild($buttonPrimary);

      const $buttonSecondary = document.createElement('div');
      UI.render(Button, {
        children: labels?.cart.emptycart.browseafaa.button,
        variant: 'secondary',
        className: 'button-secondary',
        href: rootLink(AFAA_PATH),
      })($buttonSecondary);
      $emptyCart.appendChild($buttonSecondary);
    }),
  ]);

  block.addEventListener('click', async (e) => {
    if (e.target.closest('[data-testid="cart-item-remove-button"]')) {
      e.stopImmediatePropagation();
      e.preventDefault();

      const itemData = {
      };

      showRemoveItemModal(
        async () => {
          try {
            await Cart.removeItem(itemData.id);
          } catch (error) {
            console.error('Failed to remove item:', error);
          }
        },
        itemData,
      );
    }
  });

  function toggleStickySummary() {
    const cloneHeader = $summaryClone.querySelector('.cart-order-summary-header');
    const cloneChildren = $summaryClone.querySelector('.cart-order-summary__content')?.children;
    const paymentLabel = $summaryClone.querySelector('.payment-plan-label');
    if (!cloneChildren) {
      return;
    }
    const items = [cloneHeader, ...cloneChildren, paymentLabel].filter((item) => item && !item.classList.contains('pay-today'));

    for (let i = 0; i < items.reverse().length; i += 1) {
      const child = items.reverse()[i];
      child.classList.toggle('hidden');
    }

    $caratIcon.classList.toggle('visible');
  }

  $caratIcon.addEventListener('click', () => {
    toggleStickySummary();
  });

  const recBlock = document.createElement('div');
  recBlock.className = 'cart-cross-sell-products';
  $recommendations.appendChild(recBlock);
  CartCrossSellProducts(recBlock);

  let cartViewEventPublished = false;

  /* PayToday initially renders with cached cart data */
  const payTodayHeaderContainer = document.querySelector('.paytoday-header-container');
  const payTodaySummaryContainer = $summary.querySelector('.paytoday-block');

  if (payTodayHeaderContainer && payTodaySummaryContainer) {
    renderPayToday({
      payTodayHeaderContainer,
      payTodaySummaryContainer,
      isRenderPayToday,
      labels,
    });
  }

  // Events
  events.on(
    'cart/data',
    (payload) => {
      toggleEmptyCart(isCartEmpty(payload));

      const { items = null } = payload || {};

      if (payload && items && items.length > 0) {
        const ga4Data = transformCartDataForGA4(payload, 'view_cart');
        if (ga4Data) {
          trackGTMEvent({ ecommerce: null });
          trackGTMEvent(ga4Data);
        }
      }

      if (items) {
        const crossSellProducts = getFilteredCrossSellProducts(items, CROSS_SELL_PRODUCTS_LIMIT);
        events.emit('cart/cross-sell-products', { crossSellProducts });
      }

      // Update custom cart heading item count
      const customHeadingCount = document.querySelector('.custom-cart-heading-count');
      if (customHeadingCount) {
        const itemCount = payload?.totalQuantity || 0;
        customHeadingCount.innerText = ` ${itemCount} item${itemCount === 1 ? '' : 's'}`;
      }

      /* PayToday amount recalculates on cart changes */
      const isRenderPayTodayOnChange = isPayTodayEligible(payload, labels);
      renderPayToday({
        payTodayHeaderContainer,
        payTodaySummaryContainer,
        isRenderPayToday: isRenderPayTodayOnChange,
        labels,
      });

      setTimeout(() => { updateSummaryClone(); }, 0);

      if (!cartViewEventPublished) {
        cartViewEventPublished = true;
        publishShoppingCartViewEvent();
      }
    },
    { eager: true },
  );

  loadCSS(`${window.hlx.codeBasePath}/shared-components/cart-checkout/cart-checkout.css`);
  loadCSS(`${window.hlx.codeBasePath}/custom-blocks/cart-cross-sell-products/cart-cross-sell-products.css`);
  loadCSS(`${window.hlx.codeBasePath}/custom-blocks/notification/notification.css`);

  // emit most recent cart data to ensure all cart blocks are in sync
  events.emit('cart/data', cartData);

  return Promise.resolve();
}

function isCartEmpty(cart) {
  return cart ? cart.totalQuantity < 1 : true;
}
