import { useState, useEffect } from '@dropins/tools/preact-hooks.js';
import { h } from '@dropins/tools/preact.js';
import { fetchPlaceholders } from '../../../../scripts/commerce.js';
import htm from '../../../../scripts/htm.js';
import { makeSyncCustomerProfileAPICall } from '../../../../utils/cart-checkout.js';

const html = htm.bind(h);
const labels = await fetchPlaceholders();

const CheckoutOtherItemButton = () => {
  const [isSyncing, setIsSyncing] = useState(true);
  const [isClicked, setIsClicked] = useState(false);

  useEffect(() => {
    const syncData = async () => {
      try {
        // make call to sync the customer data
        await makeSyncCustomerProfileAPICall();
        sessionStorage.setItem('isDataSyncedAfterPlaceOrder', true);
      } catch (err) {
        console.error('Sync failed:', err);
      } finally {
        setIsSyncing(false);
      }
    };

    const timer = parseInt(labels?.success?.appbuilder?.datasync?.timer, 10) || 10000;
    const timerId = setTimeout(syncData, timer);

    return () => clearTimeout(timerId);
  }, []);

  useEffect(() => {
    if (isClicked && !isSyncing) {
      window.location.href = '/cart';
    }
  }, [isClicked, isSyncing]);

  const onClickHandler = () => {
    setIsClicked(true);
    if (!isSyncing) {
      window.location.href = '/cart';
    }
  };
  return html`
  <div class="checkout-other-item-button__wrapper">
    <button class="button ${isClicked ? 'loading' : ''}" onClick=${onClickHandler}>${labels?.order.success.addotheritems.label}</button>

    ${isClicked && html`
      <div class="order-confirmation-overlay">
        <div class="order-confirmation-overlay__content">
          <div class="loader"></div>
          <div>${labels?.order.redirection.addotheritems.loader.label}</div>
        </div>
      </div>
    `}
  </div>
`;
};

export default CheckoutOtherItemButton;
