import { h } from '@dropins/tools/preact.js';
import { useState } from '@dropins/tools/preact-hooks.js';
import { updateProductsFromCart, getCartDataFromCache } from '@dropins/storefront-cart/api.js';
import { ProgressSpinner } from '@dropins/tools/components.js';
import htm from '../../scripts/htm.js';
import { loadCSS } from '../../scripts/aem.js';
import { rootLink } from '../../scripts/scripts.js';
import { CART_PATH, CHECKOUT_PATH } from '../../scripts/constants.js';

const html = htm.bind(h);

loadCSS(`${window.hlx.codeBasePath}/custom-blocks/cart-conflict-modals/cart-conflict-modals.css`);

export default function MixedCartConflictModal({ labels, cartData }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isClosed] = useState(false);

  const handleContinue = async () => {
    setIsLoading(true);
    // Get fresh cart data to avoid stale UIDs after cart merge
    const freshCart = getCartDataFromCache();
    const cartItems = freshCart?.items || cartData?.items || [];

    const { regularItems, itemsToRemoveFromCart } = cartItems.reduce(
      (acc, item) => {
        const normalProducts = { sku: item.sku, quantity: item.quantity };
        const productsToRemove = { quantity: 0, uid: item.uid };

        if (item.itemType !== 'ConfigurableCartItem') {
          acc.regularItems.push(normalProducts);
          acc.itemsToRemoveFromCart.push(productsToRemove);
        }
        return acc;
      },
      { regularItems: [], itemsToRemoveFromCart: [] },
    );

    // Store regular items in session
    if (regularItems.length > 0) {
      localStorage.setItem(
        'remainingItemsToPurchase',
        JSON.stringify({
          items: regularItems,
          appliedCoupons: cartData?.appliedCoupons || [],
        }),
      );
    } else {
      localStorage.removeItem('remainingItemsToPurchase');
    }

    // Update cart with configurable items before redirect
    if (itemsToRemoveFromCart.length > 0) {
      await updateProductsFromCart(itemsToRemoveFromCart);
    }

    window.location.href = rootLink(CHECKOUT_PATH);
  };

  const handleGoToCart = () => {
    setIsLoading(true);
    window.location.href = rootLink(CART_PATH);
  };

  // Return null if closed
  if (isClosed) {
    return null;
  }

  // Pre-compute all label values
  const title = labels?.order?.membership?.model?.title;
  const description = labels?.checkout?.membership?.model?.description;
  const para = labels?.checkout?.membership?.model?.para;
  const steptwo = labels?.checkout?.membership?.model?.steptwo;
  const action = labels?.checkout?.membership?.model?.action;
  const returnButton = labels?.checkout?.membership?.model?.returnButton;

  return html`
    <div class="membership-modal-overlay">
      <div class="membership-modal">
        <div class="membership-modal__content">
        ${isLoading && html`
            <div class="membership-modal__loader">
            <${ProgressSpinner} />
            </div>
          `}

          <div class="membership-modal__title">
            ${title}
          </div>
          <div class="membership-modal__details">
            <div class="membership-modal__description">
              ${description}
            </div>
            <p>${para}</p>
            <p>${steptwo}</p>
          </div>
          <div class="membership-modal__actions">
            <button 
              class="membership-modal__checkout-btn" 
              aria-label="Checkout Membership"
              onClick=${handleContinue}
            >
              ${action}
            </button>
            <button
              type="button"
              class="membership-modal__return-btn"
              onClick=${handleGoToCart}
            >
              ${returnButton}
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function MembershipLimitConflictModal({ labels }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoToCart = () => {
    setIsLoading(true);
    window.location.href = rootLink(CART_PATH);
  };

  const title = labels?.checkout?.membership?.renewal?.title;
  const description = labels?.checkout?.membership?.renewal?.description;
  const para = labels?.checkout?.membership?.renewal?.para;
  const returnButton = labels?.checkout?.membership?.renewal?.returnButton;

  return html`
    <div class="membership-modal-overlay">
      <div class="membership-modal membership-modal--renewal">
        <div class="membership-modal__content">
        ${isLoading && html`
            <div class="membership-modal__loader">
            <${ProgressSpinner} />
            </div>
          `}

          <div class="membership-modal__title">${title}</div>
          <div class="membership-modal__details">
            <div class="membership-modal__description">${description}</div>
            <p>${para}</p>
          </div>
          <div class="membership-modal__actions">
            <button
              type="button"
              class="membership-modal__checkout-btn return-btn"
              onClick=${handleGoToCart}
            >
              ${returnButton}
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}
