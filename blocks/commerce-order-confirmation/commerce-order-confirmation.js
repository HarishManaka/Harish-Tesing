/* eslint-disable import/no-unresolved */
/* eslint-disable no-unused-vars */
/* eslint-disable no-shadow */
/* eslint-disable no-use-before-define */
/* eslint-disable prefer-const */

import { initializers } from '@dropins/tools/initializer.js';
import * as orderApi from '@dropins/storefront-order/api.js';
import CustomerDetails from '@dropins/storefront-order/containers/CustomerDetails.js';
import OrderProductList from '@dropins/storefront-order/containers/OrderProductList.js';
import { render as OrderProvider } from '@dropins/storefront-order/render.js';
import {
  OPTIMIZELY_SCRIPT_PATH, RECENT_ORDER_DETAILS, CART_PATH, CART_SELECTED_PAYMENT_PLAN,
} from '../../scripts/constants.js';
import { fetchPlaceholders } from '../../scripts/commerce.js';
import { loadScript } from '../../scripts/aem.js';
import { formatOrderDate, getThumbnailImage } from '../../utils/cart-checkout.js';
import CustomOrderSummary from '../../custom-blocks/order-summary/order-summary.js';
import CheckoutOtherItemButton from '../commerce-checkout/multi-step-checkout/hooks/checkoutOtherCartItems.js';

try {
  await loadScript(OPTIMIZELY_SCRIPT_PATH);
} catch (error) {
  console.error('Error loading Optimizely script:', error);
}

export default async function decorate(block) {
  // Track toggle state for both sections
  const labels = await fetchPlaceholders();
  let isNasmOneToggledByClick = false;
  let isFinishPurchasingToggledByClick = false;

  const cartPaymentPlanData = JSON.parse(sessionStorage.getItem(CART_SELECTED_PAYMENT_PLAN));

  // Click toggle function FOR NASM ONE ACCORDION
  function toggleNasmOneDetails() {
    const element = document.querySelector('.order-confirmation__nasm-one-details');
    if (element) {
      const wasOpen = element.classList.contains('open');
      isNasmOneToggledByClick = true;
      element.classList.toggle('open');
      const rect = element.getBoundingClientRect();
      if (rect.top <= 4 && !wasOpen) {
        element.classList.add('open');
      }
      setTimeout(() => {
        isNasmOneToggledByClick = false;
      }, 300);
    }
  }

  // Click toggle function FOR FINISH PURCHASING ACCORDION
  function toggleFinishPurchasingDetails() {
    const element = document.querySelector('.order-confirmation__finish-purchasing-section');
    if (element) {
      const wasOpen = element.classList.contains('open');
      isFinishPurchasingToggledByClick = true;
      element.classList.toggle('open');
      const rect = element.getBoundingClientRect();
      if (rect.top <= 4 && !wasOpen) {
        element.classList.add('open');
      }
      setTimeout(() => {
        isFinishPurchasingToggledByClick = false;
      }, 300);
    }
  }

  const [
    pageTitle,
    pageSubtitle,
    description,
    nasmOneDetails,
    otherProductsDescription,
    coursesDescription,
    helpLineDescription,
    finishPurchasingDescription,
    receiptLabel,
    printLabel,
    receiptImageLogo,
    payTodayLabel,
    payTodayOfferAmount,
    payTodayInfoText,
    className,
  ] = block.children;
  const config = {
    pageTitle: pageTitle.textContent || '',
    pageSubtitle: pageSubtitle.textContent || '',
    description: description.innerHTML || '',
    nasmOneDetails: nasmOneDetails.innerHTML || '',
    otherProductsDescription: otherProductsDescription.innerHTML || '',
    coursesDescription: coursesDescription.innerHTML || '',
    helpLineDescription: helpLineDescription.innerHTML || '',
    finishPurchasingDescription: finishPurchasingDescription.innerHTML || '',
    receiptLabel: receiptLabel.textContent || '',
    printLabel: printLabel.textContent || '',
    receiptImageLogo: receiptImageLogo.innerHTML || '',
    payTodayLabel: payTodayLabel.textContent || '',
    payTodayOfferAmount: payTodayOfferAmount.textContent || '',
    payTodayInfoText: payTodayInfoText.innerHTML || '',
    className: className?.textContent || '',
  };

  let orderData = null;

  try {
    const sessionData = sessionStorage.getItem(RECENT_ORDER_DETAILS);
    if (sessionData) {
      orderData = JSON.parse(sessionData);
    }
  } catch (error) {
    console.error('Error fetching order data:', error);
    return;
  }

  if (!orderData) {
    window.location.href = CART_PATH;
    return;
  }

  const successOrderNumber = `#${orderData?.number}`;
  const updatedOtherDescription = config?.otherProductsDescription?.replace('{emailAddress}', orderData?.email);
  const updatedDescription = config?.description?.replace('{orderNumber}', successOrderNumber);

  const displayOrderConfirmation = async (orderData) => {
    // Scroll to the top of the page
    window.scrollTo(0, 0);

    const hasConfigurableProduct = Array.isArray(orderData?.items)
    && orderData.items.some((item) => item.type === 'ConfigurableOrderItem');
    const hasShippableItem = orderData?.isVirtual === false;
    const sessionData = localStorage.getItem('remainingItemsToPurchase');
    let hasRemainingItems = false;
    if (sessionData) {
      try {
        const { items } = JSON.parse(sessionData);
        hasRemainingItems = Array.isArray(items) && items.length > 0;
      } catch (e) {
        hasRemainingItems = true;
      }
    }

    if (hasRemainingItems) sessionStorage.setItem('isDataSyncedAfterPlaceOrder', false);

    const orderConfirmationFragment = document.createRange()
      .createContextualFragment(`
      <div class="order-confirmation ${config.className}">
        <div class="order-confirmation__page-header">
        <div class="order-confirmation--container">
        <h1 class="order-confirmation__page-title">${config.pageTitle}</h1>
          <h2 class="order-confirmation__page-subtitle">${config.pageSubtitle}</h2>
          </div>
          
           <div class="order-confirmation--container"> ${hasConfigurableProduct ? `<div class="order-confirmation__description">${updatedDescription}</div>`
    : `<div class="order-confirmation__description with-order-number">${updatedOtherDescription}</div>`}</div>
            ${!hasConfigurableProduct ? `<div class="order-confirmation__nasm-one-details open">
              <div class="order-confirmation--container">
                <button class="order-confirmation__toggle-button" aria-label="Toggle NASM One details">
                  <span class="toggle-icon"></span>
                </button>
                ${config.nasmOneDetails}
              </div>
            </div>`
    : ''}
            ${hasRemainingItems ? `<div class="order-confirmation__finish-purchasing-section open">
              <div class="order-confirmation__finish-purchasing-description">
                <div class="order-confirmation--container">
                  <button class="order-confirmation__toggle-button" aria-label="Toggle finish purchasing details">
                    <span class="toggle-icon"></span>
                  </button>
                  ${config.finishPurchasingDescription}
                  <div class="checkout-other-item-button"></div>
                </div>
              </div>
            </div>`
    : ''}
            ${!hasShippableItem ? `<div class="order-confirmation__courses-section">
              <div class="order-confirmation__courses-description"><div class="order-confirmation--container">${config.coursesDescription}</div></div>
            </div>` : ''}
            <div class="order-confirmation--container">
            <div class="order-confirmation__wrapper-multi">
              <div class="order-confirmation__receipt-section">
              <div class="head-order-confirmation__receipt-section">
                <h3>${config.receiptLabel}</h3>
                <div class="order-confirmation__receipt-actions">
                    <button class="order-confirmation__print-button" onclick="window.print()">
                      ${config.printLabel}
                    </button>
                  </div>
                </div>
              ${config.receiptImageLogo}
                
              </div>
              <div class="order-confirmation__block order-confirmation__customer-details"></div>
              <div class="order-confirmation__order-payment-details">
                <div class="order-confirmation__order-number"><span>${labels?.orderconfirmation?.numberLabel || 'ORDER NUMBER'}: </span> ${orderData.number}</div>
                <div class="order-confirmation__order-placed-date"><span>${labels?.orderconfirmation?.placedLabel || 'PLACED ON'}: </span> ${formatOrderDate(orderData.orderDate)}</div>
                ${cartPaymentPlanData?.planDuration > 0
    ? `<div class="order-confirmation__order-payment-plan"><span>${labels?.orderconfirmation.paymentPlan.label}: </span>${labels?.orderconfirmation.paymentPlan.frequencyInfo} ($${cartPaymentPlanData?.scheduledPaymentAmount})</div>`
    : ''}
              </div>
              ${cartPaymentPlanData?.planDuration > 0
    ? `<div class="order-confirmation__pay-today-section">
                <div class="head-pay__segment">
                  <span class="order-confirmation__pay-today-label">${labels?.orderConfirmation?.paytoday?.offer?.title || 'Paid today'}</span>
                  <span class="order-confirmation__pay-today-amount">$${cartPaymentPlanData?.downPayment}</span>
                </div>
                <div class="order-confirmation__pay-schedule">
                  <span>${labels?.orderconfirmation.paymentSchedule}</span>
                  <span class="order-confirmation__pay-schedule-info">
                    $${cartPaymentPlanData?.scheduledPaymentAmount}/${labels?.orderconfirmation.paymentPlan.frequency}
                    </br>
                    <span>${labels?.orderconfirmation.paymentPlan.schedule.replace('{{planDuration}}', cartPaymentPlanData?.planDuration)}</span>
                    <span>(${labels?.checkout.selected.payment.option.include.tax.text})</span>
                    
                  </span>
                </div>
              </div>`
    : ''}
              <div class="order-confirmation__block order-confirmation__order-cost-summary"></div>
              
              <div class="order-confirmation__block order-confirmation__order-product-list"></div>
           </div>
           </div>

          </div>

          

           <div class="order-confirmation__help-line-section">
           <div class="order-confirmation--container">
              <div class="order-confirmation__help-line-description">${config.helpLineDescription}</div>
            </div>
            </div>
          
        
        <div class="order-confirmation__main">
          <div class="order-confirmation__block order-confirmation__header"></div>
          <div class="order-confirmation__block order-confirmation__shipping-status"></div>
          
        </div>
        <div class="order-confirmation__aside">
          <div class="order-confirmation__block order-confirmation__gift-options"></div>
          <div class="order-confirmation__block order-confirmation__footer"></div>
        </div>
      </div>
  `);

    // Order confirmation elements
    const $customerDetails = orderConfirmationFragment.querySelector(
      '.order-confirmation__customer-details',
    );
    const otherItemsButtonContainer = orderConfirmationFragment.querySelector('.checkout-other-item-button');

    const $orderCostSummary = orderConfirmationFragment.querySelector(
      '.order-confirmation__order-cost-summary',
    );
    const $orderProductList = orderConfirmationFragment.querySelector(
      '.order-confirmation__order-product-list',
    );

    const langDefinitions = {
      default: {
        ...labels,
      },
    };

    await initializers.mountImmediately(orderApi.initialize, { orderData, langDefinitions });

    block.replaceChildren(orderConfirmationFragment);

    OrderProvider.render(CustomerDetails)($customerDetails);
    OrderProvider.render(CustomOrderSummary, {
      showAccordion: false,
      className: 'order-summary__wrapper',
      isOrderConfirmation: true,
    })($orderCostSummary);
    OrderProvider.render(CheckoutOtherItemButton)(otherItemsButtonContainer);
    OrderProvider.render(OrderProductList, {
      slots: {
        CartSummaryItemImage: (ctx) => {
          const { defaultImageProps } = ctx;
          const optimizedImage = getThumbnailImage({
            src: defaultImageProps?.src,
            alt: defaultImageProps.alt || defaultImageProps.title,
            height: 88,
            width: 88,
            name: defaultImageProps.name,
            loading: defaultImageProps?.loading,
            className: 'dropin-image',
          });
          ctx.replaceWith(optimizedImage);
        },
      },
    })($orderProductList);

    const productListItemType = (orderItems) => {
      const productItems = document.querySelectorAll('.dropin-cart-item');

      productItems.forEach((item, index) => {
        if (item.dataset.enhanced) return;
        item.dataset.enhanced = 'true';

        const footerSlot = item.querySelector('[data-slot="Footer"]');
        if (footerSlot && !footerSlot.hasChildNodes()) {
          const footerContainer = document.createElement('div');
          footerContainer.className = 'cart-item-footer-container';

          const item = orderItems[index];
          const type = item?.product?.productType;

          let badgeHTML = '';
          if (type === 'SimpleProduct') {
            badgeHTML = `
              <span class="shippable-item-badge">
                <span>${labels?.cart?.cartSummaryList?.ShippableText}</span>
              </span>
            `;
          } else if (type === 'ConfigurableProduct') {
            badgeHTML = `
              <span class="membership-item-badge">
                <span>${labels?.cart?.cartSummaryList?.MembershipText}</span>
              </span>
            `;
          }

          footerContainer.innerHTML = `
            <div class="product-attributes-badges">
              <div class="badge-container">
                ${badgeHTML}
              </div>
            </div>
          `;

          footerSlot.appendChild(footerContainer);
        }
      });
    };

    const productObserver = new MutationObserver(() => {
      productListItemType(orderData.items);
    });
    productObserver.observe($orderProductList, { childList: true, subtree: true });

    const priceList = document.querySelector('.order-confirmation__order-product-list');
    if (priceList) {
      const observer = new MutationObserver(() => {
        document.querySelectorAll('.dropin-cart-item__price').forEach((priceEl) => {
          if (!priceEl.dataset.customPriceApplied) {
            priceEl.dataset.customPriceApplied = 'true';

            const cartItem = priceEl.closest('.dropin-cart-item');
            const skuElement = cartItem.querySelector('.dropin-cart-item__sku');
            const sku = skuElement ? skuElement.textContent.trim() : null;

            const itemData = orderData?.items?.find((item) => item.product?.sku === sku);

            if (itemData?.itemPrices?.price?.value) {
              const priceValue = itemData.itemPrices.price.value;
              priceEl.innerHTML = `
                <span class="dropin-price--sale dropin-price--bold dropin-price--small">$${priceValue}</span>
                <span class="order-pre-tax-discount">${labels?.cart?.cartSummaryList?.PriceNote}</span>
              `;
            }
          }
        });
      });
      observer.observe(priceList, { childList: true, subtree: true });
    }

    const targetNode = $orderProductList;
    const observer = new MutationObserver(() => {
      const orderHeader = targetNode.querySelector('.dropin-header-container__title');
      if (orderHeader) {
        orderHeader.textContent = labels?.orderConfirmation?.header?.title || 'Product details';
        observer.disconnect();
      }
    });
    observer.observe(targetNode, { childList: true });
  };

  await displayOrderConfirmation(orderData);

  // Add event listeners for both toggle sections
  const nasmOneElement = document.querySelector('.order-confirmation__nasm-one-details');
  if (nasmOneElement) {
    const toggleButton = nasmOneElement.querySelector('.order-confirmation__toggle-button');
    if (toggleButton) {
      toggleButton.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleNasmOneDetails(e);
      });
    }
  }

  const finishPurchasingElement = document.querySelector('.order-confirmation__finish-purchasing-section');
  if (finishPurchasingElement) {
    const toggleButton = finishPurchasingElement.querySelector('.order-confirmation__toggle-button');
    if (toggleButton) {
      toggleButton.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFinishPurchasingDetails(e);
      });
    }
  }

  sessionStorage.removeItem(CART_SELECTED_PAYMENT_PLAN);
}
