import { h } from '@dropins/tools/preact.js';
import { useState, useEffect } from '@dropins/tools/preact-hooks.js';
import { events } from '@dropins/tools/event-bus.js';
import * as Cart from '@dropins/storefront-cart/api.js';
import { formatCurrency } from '../../utils/cart-checkout.js';
import htm from '../../scripts/htm.js';
import { loadCSS } from '../../scripts/aem.js';
import Accordion from '../accordion/accordion.js';
import PayToday from '../paytoday/paytoday.js';
import SelectedPaymentOption from '../selected-payment-option/selected-payment-option.js';
import { fetchPlaceholders } from '../../scripts/commerce.js';
import { RECENT_ORDER_DETAILS } from '../../scripts/constants.js';

const html = htm.bind(h);
const labels = await fetchPlaceholders();
let previousTaxValue = 0;

export default function OrderSummary({
  className = '',
  showAccordion = true,
  title = 'Order Summary',
  isSticky = false,
  isExpanded,
  isOrderConfirmation = false,
}) {
  const accordionVariation = isSticky ? 'sticky' : '';
  const [cartData, setCartData] = useState(null);
  const [payTodayData, setPayTodayData] = useState(null);
  const [shippingData, setShippingData] = useState(null);
  const [orderData, setOrderData] = useState(null);

  useEffect(() => {
    loadCSS(`${window.hlx.codeBasePath}/custom-blocks/order-summary/order-summary.css`);
    if (isOrderConfirmation) {
      try {
        const sessionData = sessionStorage.getItem(RECENT_ORDER_DETAILS);
        if (sessionData) {
          setOrderData(JSON.parse(sessionData));
        }
      } catch (e) {
        setOrderData(null);
      }

      sessionStorage.removeItem(RECENT_ORDER_DETAILS);
    }
  }, [isOrderConfirmation]);

  useEffect(() => {
    // Get initial cart data
    const initialCartData = Cart.getCartDataFromCache();
    setCartData(initialCartData);

    const handleCartUpdate = (payload) => {
      const currentTax = payload?.totalTax?.value || 0;
      if (currentTax !== previousTaxValue) {
        events.emit('cart/tax-updated', { previousTax: previousTaxValue, tax: currentTax });
        previousTaxValue = currentTax;
      }
      setCartData(payload);
    };

    const handleCheckoutUpdated = (payload) => {
      // Extract shipping cost from checkout data
      const shipping = payload?.shippingAddresses?.[0]?.selectedShippingMethod;
      if (shipping !== undefined && shipping !== null) {
        setShippingData(shipping);
      } else {
        setShippingData(0);
      }
    };

    // Listen for shipping estimate updates from cart
    const handleShippingEstimate = (payload) => {
      if (payload?.shippingMethod?.amount?.value) {
        setShippingData({ amount: payload.shippingMethod.amount.value });
      }
    };

    // Payment plan selection event handler
    const paymentPlanHandler = (paymentOptions) => {
      setPayTodayData(paymentOptions?.detail);
    };

    // Listen for payment plan MFE ready event
    const handlePaymentPlanMFEReady = () => {
      const uaLogin = document.querySelector('payment-plan-selection-mfe');
      if (uaLogin) {
        uaLogin.addEventListener('paymentPlanSelectionEvent', paymentPlanHandler);
      }
    };

    const checkoutInitializedSubscription = events.on('checkout/initialized', handleCheckoutUpdated, { eager: true });
    const checkoutUpdatedSubscription = events.on('checkout/updated', handleCheckoutUpdated);
    const shippingEstimateSubscription = events.on('shipping/estimate', handleShippingEstimate);
    const cartDataSubscription = events.on('cart/data', handleCartUpdate, { eager: true });

    document.addEventListener('paymentPlanMFEReady', handlePaymentPlanMFEReady);

    return () => {
      checkoutInitializedSubscription?.off();
      checkoutUpdatedSubscription?.off();
      shippingEstimateSubscription?.off();
      cartDataSubscription?.off();
    };
  }, []);

  const [isPaymentPlanSubmitted, setIsPaymentPlanSubmitted] = useState(false);

  useEffect(() => {
    function handlePaymentPlanEvent(e) {
      setIsPaymentPlanSubmitted(Boolean(e.detail));
    }
    document.addEventListener('payment-plan-submitted', handlePaymentPlanEvent);

    return () => {
      // TODO: turn off event listeners
    };
  }, []);

  const getLineItems = () => {
    let subtotal; let discount; let tax; let total; let shipping; let
      shippingTitle;
    if (isOrderConfirmation && orderData) {
      subtotal = orderData?.subtotalExclTax?.value || 0;
      discount = orderData?.discounts?.[0]?.amount?.value || 0;
      tax = orderData?.totalTax?.value || 0;
      total = orderData?.grandTotal?.value || 0;
      shipping = orderData?.totalShipping?.value || 0;
      shippingTitle = orderData?.shipping?.code.split(' - ')[0] || '';
    } else if (cartData) {
      subtotal = cartData.subtotal?.excludingTax?.value || 0;
      discount = cartData.discount?.value || 0;
      tax = cartData.totalTax?.value || 0;
      total = cartData.total?.includingTax?.value || 0;
      shipping = shippingData?.amount?.value || 0;
      shippingTitle = shippingData?.carrier?.title || '';
    } else {
      return [];
    }
    return [
      {
        key: 'subtotal',
        label: labels?.Order?.OrderCostSummary?.subtotal?.title,
        subText: 'excl tax',
        value: subtotal,
        className: 'nasm-order-summary__subtotal',
      },
      {
        key: 'discount',
        label: labels?.order?.summary?.discount?.label?.text,
        value: -discount,
        className: 'nasm-order-summary__discount',
        show: discount > 0,
      },
      {
        key: 'shipping',
        label: labels?.order?.summary?.shipping?.label,
        value: shipping,
        valueText: shippingTitle,
        className: 'nasm-order-summary__shipping',
        show: shipping > 0,
      },
      {
        key: 'tax',
        label: labels?.order?.summary?.tax?.label,
        value: tax,
        className: 'nasm-order-summary__tax',
        show: true,
      },
      {
        key: 'total',
        label: labels?.Cart?.PriceSummary?.total?.estimated,
        value: total,
        className: 'nasm-order-summary__total',
      },
    ];
  };

  const lineItems = getLineItems();

  let cartSummaryTotal = html``;

  const isShowPaymentPlan = payTodayData?.planDuration;

  const orderSummaryContent = html`
    <div class="nasm-order-summary__paytoday">
      ${!isSticky && isShowPaymentPlan ? html`
        <${PayToday} payTodayData=${payTodayData} />
      ` : ''}
      ${isShowPaymentPlan ? html`
        <${SelectedPaymentOption} payTodayData=${payTodayData} />
      ` : ''}
    </div>
    <div class="nasm-order-summary__content">
      <div class="nasm-order-summary__line-items">
        ${lineItems.filter((item) => item.show !== false)
    .map((item) => {
      const ItemHtml = html`
      <div class="nasm-order-summary__line-item ${item.className}" key=${item.key}>
        <span class="nasm-order-summary__label">${item.label}${item?.subText ? html`<span>${item.subText}</span>` : ''}</span>
        <span class="nasm-order-summary__value">${formatCurrency(item.value)}${item.valueText ? html`<span>${item.valueText}</span>` : ''}</span>
      </div>
    `;

      if (item.key === 'total' && isSticky) {
        cartSummaryTotal = ItemHtml;
        if (!isPaymentPlanSubmitted) return null;
      }

      return ItemHtml;
    })}
      </div>
    </div>
  `;

  const AccordionFooter = html`
  <div class="nasm-order-summary__paytoday">
    ${isShowPaymentPlan ? html`
      <${PayToday} payTodayData=${payTodayData} />
    ` : ''}
    ${!isPaymentPlanSubmitted ? html`<div class="nasm-order-summary__sticky-total">
      ${cartSummaryTotal}
      <div class="mobile-payment-plan-label"> ${labels?.cart.paytoday.offer.mobile.desc}</div>
    </div>` : html`<div class="nasm-order-summary__sticky-total">
      ${cartSummaryTotal}
    </div>`}
  </div>
`;

  if (showAccordion) {
    return html`
      <div class="nasm-order-summary ${className}">
        <${Accordion}
          title=${title}
          isExpanded=${isExpanded}
          variation=${accordionVariation}
          className="nasm-order-summary__accordion"
          AccordionFooter=${AccordionFooter}
        >
          ${orderSummaryContent}
        </${Accordion}>
      </div>
    `;
  }

  return html`
    <div class="nasm-order-summary common-aside__wrapper ${className}">
      ${orderSummaryContent}
    </div>
  `;
}
