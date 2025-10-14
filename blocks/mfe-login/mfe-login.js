import * as cartApi from '@dropins/storefront-cart/api.js';
import { checkIsAuthenticated } from '../../scripts/configs.js';
import { rootLink } from '../../scripts/scripts.js';
import { fetchPlaceholders } from '../../scripts/commerce.js';
import {
  ORDER_HELP_PATH,
  SECURE_BADGE,
} from '../../scripts/constants.js';
import { loadFragment } from '../fragment/fragment.js';
import {
  loadLoginAssets,
  renderLoginWidget,
  sendTokenToServer,
  showLoader,
  hideLoader,
  handleAuthError,
  addPlaceholdertoInputFields,
  attachMFEEventListeners,
} from '../../services/mfe-auth-service.js';

const cartData = await cartApi.getCartDataFromCache();
const labels = await fetchPlaceholders();

let loaderContainer = null;

if (checkIsAuthenticated()) {
  window.location.href = rootLink('/');
}

export default async function decorate(block) {
  const [
    loginIllustrationElement,
    loginBannerElement,
  ] = block.children;

  if (!loginIllustrationElement || !loginBannerElement) {
    console.error('Required elements are missing in the block:', block);
    return;
  }

  const loginWidgetHTML = renderLoginWidget();
  const totalItems = cartData?.totalQuantity || 0;
  const itemLabel = totalItems === 1 ? 'item' : 'items';

  const leftContainer = document.createElement('div');
  leftContainer.className = 'mfe-login-left-container';
  leftContainer.innerHTML = `
    <div class="mfe-login-banner">
      <div class="mfe-login-description">
        ${loginBannerElement.innerHTML}
        <div class="mfe-banner-cart-icon" data-count="${totalItems}">
          <img src="../icons/shopping-cart.svg" alt="Cart Icon"/>
        </div>
      </div>
      <div class="login-to-checkout" id="login-account">
        <span>${labels?.mfe.login.title}</span>
        <span class="arrow"></span>
        <span class="checkout-title">${labels?.mfe.checkout.title}</span>
        <span class="mfe-login-cart-count">${totalItems} ${itemLabel}</span>
      </div>
      <div class="login-to-checkout" id="create-account">
        <span>${labels?.mfe.register.title}</span>
        <span class="arrow"></span>
        <span  class="checkout-title">${labels?.mfe.checkout.title}</span>
        <span class="mfe-login-cart-count">${totalItems} ${itemLabel}</span>
      </div>
    </div>
    <div class="mfe-container">${loginWidgetHTML}</div>
    <div class="mfe-login-badge-container"></div>
  `;

  // Insert securebadge fragment into badge container
  const badgeContainer = leftContainer.querySelector('.mfe-login-badge-container');

  try {
    const secureBadgeFragment = await loadFragment(SECURE_BADGE);
    while (secureBadgeFragment.firstElementChild) {
      badgeContainer.append(secureBadgeFragment.firstElementChild);
    }
  } catch (e) {
    console.error('Failed to load securebadge fragment:', e);
  }

  const rightContainer = document.createElement('div');
  rightContainer.className = 'mfe-login-right-container';
  rightContainer.innerHTML = loginIllustrationElement.outerHTML;

  loaderContainer = document.createElement('div');
  loaderContainer.className = 'mfe-login-loader-container';

  try {
    await loadLoginAssets();
  } catch (e) {
    console.error(`Loading Assets failed with the following error: ${e}`);
  }

  block.innerHTML = '';
  block.appendChild(loaderContainer);
  block.appendChild(leftContainer);
  block.appendChild(rightContainer);

  addPlaceholdertoInputFields();

  attachMFEEventListeners({
    loaderContainer,
    onLogin: async () => {
      // Show loader
      showLoader(loaderContainer);

      try {
        // Call sendTokenToServer and wait for the result
        const userData = await sendTokenToServer();

        if (userData) {
          // Handle successful authentication
          const { isSuspended } = userData;
          const urlParams = new URLSearchParams(window.location.search);
          let redirectUrl = rootLink(urlParams.get('redirect_url')) || rootLink('/');

          if (isSuspended) {
            redirectUrl = rootLink(ORDER_HELP_PATH);
          }

          // Hide loader before redirect
          hideLoader(loaderContainer);

          // Redirect
          window.location.href = redirectUrl;
        }
      } catch (error) {
        // Hide loader on error
        hideLoader(loaderContainer);

        // Handle authentication error
        await handleAuthError(loaderContainer, error.message);

        console.error('Authentication failed:', error);
      }
    },
  });
}
