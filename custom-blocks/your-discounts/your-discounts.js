import { h } from '@dropins/tools/preact.js';
import { useState, useEffect } from '@dropins/tools/preact-hooks.js';
import { events } from '@dropins/tools/event-bus.js';
import * as Cart from '@dropins/storefront-cart/api.js';
import htm from '../../scripts/htm.js';
import { formatCurrency, removeAlias } from '../../utils/cart-checkout.js';
import { loadCSS } from '../../scripts/aem.js';
import Accordion from '../accordion/accordion.js';

const html = htm.bind(h);

export default function YourDiscounts({
  className = '',
  discounts = [],
}) {
  const [cartData, setCartData] = useState(null);
  const [transformedDiscounts, setTransformedDiscounts] = useState([]);

  useEffect(() => {
    loadCSS(`${window.hlx.codeBasePath}/custom-blocks/your-discounts/your-discounts.css`);
  }, []);

  useEffect(() => {
    // Get initial cart data
    const initialCartData = Cart.getCartDataFromCache();
    setCartData(initialCartData);

    // Listen for cart updates
    const handleCartUpdate = (payload) => {
      setCartData(payload);
    };

    const eventSubscription = events.on('cart/data', handleCartUpdate, { eager: true });

    return () => {
      if (eventSubscription && eventSubscription.off) {
        eventSubscription.off();
      }
    };
  }, []);

  // Get discounts from cart data if available
  const getDiscounts = () => {
    if (!cartData || !cartData.appliedDiscounts) {
      return discounts;
    }

    return cartData.appliedDiscounts.map((discount) => ({
      code: discount.coupon?.code || '',
      amount: discount.amount?.value || 0,
      description: discount.label,
      currency: discount.amount?.currency || 'USD',
    }));
  };

  const appliedDiscounts = getDiscounts();

  useEffect(() => {
    if (appliedDiscounts?.length) {
      const updated = appliedDiscounts.map((discount) => ({
        ...discount,
        couponCodeToRender: removeAlias(discount.code) || 'AUTO APPLIED',
      }));
      setTransformedDiscounts(updated);
    } else {
      setTransformedDiscounts([]);
    }
  }, [appliedDiscounts]);

  if (!transformedDiscounts.length) {
    return null;
  }

  const handleEditDiscount = () => {
    window.location.href = '/cart';
  };

  return html`
    <div class="your-discounts ${className}">
     <${Accordion} title="Your Discounts">
      <div class="your-discounts__list">
      ${transformedDiscounts.map((discount, index) => {
    let couponCode = discount.couponCodeToRender;
    let { description } = discount;

    if (couponCode === 'AUTO APPLIED') {
      const parts = (discount.description || '').split('|');
      if (parts.length > 1) {
        couponCode = parts[0].trim();
        description = parts[1].trim();
      }
    }

    return html`
          <div class="your-discounts__item" key=${index}>
            <div class="your-discounts__item-header">
              <div>
                <span class="your-discounts__code">${couponCode}</span>
                <span class="your-discounts__amount">
                  -${formatCurrency(discount.amount)}
                </span>
              </div>
              ${discount.code ? html`<button 
                class="your-discounts__edit-btn"
                onClick=${() => handleEditDiscount(discount.code)}
                aria-label="Edit discount ${couponCode}"
              >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M19.4063 5.78125L18.2188 4.59375C17.8438 4.21875 17.3125 4 16.8125 4C16.3125 4 15.7813 4.21875 15.4063 4.59375L4.37504 15.625L4.00004 19.1875C3.93754 19.625 4.28129 20 4.71879 20C4.75004 20 4.78129 20 4.81254 20L8.37504 19.625L19.4063 8.59375C20.1875 7.8125 20.1875 6.5625 19.4063 5.78125ZM7.68754 18.1875L5.59379 18.4062L5.81254 16.3125L13.0313 9.0625L14 8.09375L15.9063 10L14.9375 10.9688L7.68754 18.1875ZM18.3438 7.53125L16.9688 8.9375L15.0625 7.03125L16.4688 5.65625C16.5938 5.53125 16.75 5.5 16.8125 5.5C16.875 5.5 17.0313 5.53125 17.1563 5.65625L18.3438 6.84375C18.5313 7.03125 18.5313 7.34375 18.3438 7.53125Z" fill="#9F9F9B"/>
                </svg>
              </button>` : ''}
            </div>
            <div class="your-discounts__description">
              ${description}
            </div>
          </div>
        `;
  })}
      </div>
    </${Accordion}>
    </div>
  `;
}
