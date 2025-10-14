import * as cartApi from '@dropins/storefront-cart/api.js';
import { ProgressSpinner, provider as UI } from '@dropins/tools/components.js';
import { loadCSS } from '../../scripts/aem.js';
import { fetchPlaceholders } from '../../scripts/commerce.js';
import { transformCartDataForGA4 } from '../../utils/cart-checkout.js';
import { trackGTMEvent } from '../../scripts/configs.js';

const labels = await fetchPlaceholders();
// eslint-disable-next-line import/prefer-default-export
export function showRemoveItemModal(e) {
  loadCSS(
    `${window.hlx.codeBasePath}/blocks/cart-remove-modal/cart-remove-modal.css`,
  );

  const modalOverlay = document.createElement('div');
  modalOverlay.className = 'cart-remove-modal-overlay';

  modalOverlay.innerHTML = `
        <div class="cart-remove-modal">
          <button class="cart-remove-modal__close"></button>
          
          <div class="cart-remove-modal__content">
          <div class="cart-remove-modal__text">
            <div class="cart-remove-modal__title">
              ${labels?.cart.removeItem.title}
            </div>
            
            <div class="cart-remove-modal__description">
              ${labels?.cart.removeItem.description}
            </div>
          </div>
            
            <div class="cart-remove-modal__actions">
              <button class="cart-remove-modal__keep-btn" type="button" aria-label="Keep item">
                ${labels?.cart.removeItem.keepButton}
              </button>

              <button class="cart-remove-modal__remove-btn" type="button" aria-label="Remove item">
                ${labels?.cart.removeItem.removeButton}
              </button>
            </div>
            <div class="cart-remove-item-spinner"></div>
          </div>
        </div>
      `;

  const closeBtn = modalOverlay.querySelector('.cart-remove-modal__close');
  const keepBtn = modalOverlay.querySelector('.cart-remove-modal__keep-btn');
  const removeBtn = modalOverlay.querySelector(
    '.cart-remove-modal__remove-btn',
  );
  const spinnerContainer = modalOverlay.querySelector('.cart-remove-item-spinner');

  const closeModal = () => {
    modalOverlay.classList.add('cart-remove-modal-overlay--closing');
    document.body.removeChild(modalOverlay);
    document.body.classList.remove('modal-open');
  };

  const handleKeep = () => {
    closeModal();
  };

  const handleRemove = async () => {
    const itemUid = e.target.dataset.uid;

    // Get the item data for tracking before removing
    let itemData = null;
    let cartResponse = null;

    try {
      // Try to get current cart data to find the item being removed
      cartResponse = sessionStorage.getItem('DROPIN__CART__CART__DATA');
      cartResponse = JSON.parse(cartResponse);
      if (cartResponse && cartResponse.items) {
        itemData = cartResponse.items.filter((item) => item.uid === itemUid);
      }
    } catch (error) {
      console.warn('Could not get cart data for tracking:', error);
    }

    if (itemData) {
      const additionalTrackingData = {
        value: itemData[0].price?.value || 0,
      };

      const ga4Data = transformCartDataForGA4(
        { items: itemData },
        'remove_from_cart',
        additionalTrackingData,
      );

      if (ga4Data) {
        trackGTMEvent({ ecommerce: null });
        trackGTMEvent(ga4Data);
      }
    }
    spinnerContainer.classList.add('active');
    spinnerContainer.innerHTML = '';
    await UI.render(ProgressSpinner, {
      className: 'cart-remove-spinner',
    })(spinnerContainer);

    await cartApi.updateProductsFromCart([
      {
        uid: itemUid,
        quantity: 0,
      },
    ]);
    closeModal();
    spinnerContainer.classList.remove('active');
  };

  closeBtn.addEventListener('click', closeModal);
  keepBtn.addEventListener('click', handleKeep);
  removeBtn.addEventListener('click', handleRemove);

  document.body.classList.add('modal-open');

  document.body.appendChild(modalOverlay);
}
