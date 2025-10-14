import { events } from '@dropins/tools/event-bus.js';
import * as authApi from '@dropins/storefront-auth/api.js';
import {
  checkIsAuthenticated,
  getCookie,
  trackGTMEvent,
  getEnvironment,
} from '../../scripts/configs.js';
import { rootLink } from '../../scripts/scripts.js';
import { fetchPlaceholders } from '../../scripts/commerce.js';
import { cacheLoggedInUserCart, PostLogoutHandler } from '../../utils/cart-checkout.js';
import {
  loadLoginAssets,
  renderLoginWidget,
  sendTokenToServer,
  showLoader,
  hideLoader,
  addPlaceholdertoInputFields,
  attachMFEEventListeners,
} from '../../services/mfe-auth-service.js';
import {
  CART_PATH,
  CHECKOUT_PATH,
} from '../../scripts/constants.js';

let loaderContainer = null;

// Learning Portal URLs configuration by environment
const LEARNING_PORTAL_URLS = {
  dev: 'https://portal.qa.nasm.org',
  qa: 'https://portal.qa.nasm.org',
  stage: 'https://stg-portal.nasm.org',
  prod: 'https://portal.nasm.org',
};

export default async function decorate(block) {
  // Determine Learning Portal URL based on environment
  const environment = getEnvironment();
  // Use the environment-specific URL, fallback to staging URL for unknown environments
  const learningPortalUrl = LEARNING_PORTAL_URLS[environment];

  const navLoginContainer = document.createElement('div');
  navLoginContainer.className = 'login-nav-container';

  const loginHeader = document.createElement('div');
  loginHeader.className = 'login-nav-header';

  const widgetContainer = document.createElement('div');
  widgetContainer.className = 'login-nav-widget-container';
  widgetContainer.innerHTML = renderLoginWidget();

  loaderContainer = document.createElement('div');
  loaderContainer.className = 'login-nav-loader-container';

  // Check if user is authenticated and if we're on cart or checkout pages
  const isUserAuthenticated = checkIsAuthenticated();
  const isCartOrCheckoutPage = window.location.pathname.includes(CART_PATH)
  || window.location.pathname.includes(CHECKOUT_PATH);

  // Only load assets if user is not authenticated or not on cart/checkout pages
  if (!isUserAuthenticated || !isCartOrCheckoutPage) {
    try {
      await loadLoginAssets();
    } catch (e) {
      console.error(`Loading Assets failed with the following error: ${e}`);
    }
  }

  block.innerHTML = '';
  block.appendChild(loaderContainer);
  block.appendChild(navLoginContainer);
  navLoginContainer.appendChild(loginHeader);
  navLoginContainer.appendChild(widgetContainer);

  addPlaceholdertoInputFields();

  // Add welcome state HTML (hidden by default)
  const welcomeHTML = `
    <div class="ua-welcome-container">
      <div class="ua-welcome-card">
        <h3 class="ua-welcome-title">WELCOME, <span class="user-name">GUEST</span></h3>
        <p class="ua-welcome-message">Thank you for logging in. What would you like to do now?</p>
        
        <div class="ua-welcome-actions">
          <a href="${learningPortalUrl}" target="_blank" rel="noopener noreferrer" class="ua-btn ua-btn-primary ua-btn-learning-portal">
            Go To My Learning Portal
          </a>
          
          <button class="ua-btn ua-btn-outline ua-btn-shopping">
            Start Shopping
          </button>
        </div>
      </div>
    </div>
  `;

  // Add logged in state HTML based on Figma design (hidden by default)
  const loggedInHTML = `
    <div class="ua-loggedin-container">
      <div class="ua-loggedin-card">
        <div class="ua-loggedin-header">
          <h3 class="ua-loggedin-name"><span class="user-name">JANE DOE</span></h3>
        </div>
        
        <div class="ua-loggedin-actions">
          <a href="${learningPortalUrl}" target="_blank" rel="noopener noreferrer" class="ua-loggedin-link ua-link-learning-portal">
            Learning Portal
          </a>
          
          <div class="ua-loggedin-divider"></div>
          
          <button class="ua-loggedin-link ua-link-logout">
            Log out
          </button>
        </div>
      </div>
    </div>
  `;

  // Insert both welcome and logged in state HTML
  block.insertAdjacentHTML('beforeend', welcomeHTML);
  block.insertAdjacentHTML('beforeend', loggedInHTML);

  if (checkIsAuthenticated()) {
    block.classList.add('login-success');
    const firstName = getCookie('auth_dropin_firstname') || 'Guest';
    // Update user name in both welcome and logged-in states
    const userNameElements = block.querySelectorAll('.user-name');
    userNameElements.forEach((element) => {
      element.textContent = firstName.toUpperCase();
    });
    // window.location.href = rootLink('/');
  }

  // Listen for authentication events to update the user name

  events.on('authenticated', (isAuthenticated) => {
    if (isAuthenticated) {
      block.classList.add('login-success');

      // Update the user's first name in both welcome and logged-in states
      const firstName = getCookie('auth_dropin_firstname') || 'Guest';
      const userNameElements = block.querySelectorAll('.user-name');
      userNameElements.forEach((element) => {
        element.textContent = firstName.toUpperCase();
      });
    } else {
      // User logged out - remove login success class to show login form again
      block.classList.remove('login-success');

      // Clear any error messages
      const errorContainer = block.querySelector('.error-message');
      if (errorContainer) {
        errorContainer.remove();
      }

      // Re-render the login widget to ensure fresh state
      const existingWidgetContainer = block.querySelector('.login-nav-widget-container');
      if (existingWidgetContainer) {
        existingWidgetContainer.innerHTML = renderLoginWidget();
        addPlaceholdertoInputFields();
      }
    }
  });

  // Add click handlers for welcome state buttons
  // Learning Portal button is now an anchor element with href, no click handler needed
  const shoppingBtn = block.querySelector('.ua-btn-shopping');

  if (shoppingBtn) {
    shoppingBtn.addEventListener('click', () => {
      window.location.href = '/nasm';
    });
  }

  // Add click handlers for logged-in state elements
  const loggedInLogoutBtn = block.querySelector('.ua-link-logout');
  // Logout button in logged-in state - same functionality as welcome state logout
  if (loggedInLogoutBtn) {
    loggedInLogoutBtn.addEventListener('click', async () => {
      try {
        showLoader(loaderContainer);
        block.classList.add('logout-spinner');
        block.classList.remove('login-success');
        // Step 1: Cache the logged-in user's cart for potential guest session restoration
        cacheLoggedInUserCart();

        // Step 2: Revoke the customer token via GraphQL API
        await authApi.revokeCustomerToken();

        // Step 3: Execute post-logout cleanup (removes XSRF-TOKEN and session data)
        PostLogoutHandler();

        trackGTMEvent({
          login_status: 'logged_out',
        });

        // Step 4: Redirect to homepage
        window.location.href = rootLink('/');
      } catch (error) {
        console.error('Logout failed:', error);
        block.classList.remove('logout-spinner');
        // Even if the API call fails, perform local cleanup
        PostLogoutHandler();
        window.location.href = rootLink('/');
      } finally {
        hideLoader(loaderContainer);
      }
    });
  }

  // requestAnimationFrame(() => {
  attachMFEEventListeners({
    block,
    loaderContainer,
    onLogin: async () => {
      // Show loader
      showLoader(loaderContainer);

      try {
        // Call sendTokenToServer and wait for the result
        const userData = await sendTokenToServer();

        if (userData) {
          // Hide loader on success
          hideLoader(loaderContainer);

          // Check if we're on cart page and reload if so
          if (window.location.pathname.includes(CART_PATH)) {
            window.location.reload();
            return;
          }

          // Show welcome state after successful login
          block.classList.add('login-success');
          block.classList.add('show-welcome');

          // The authenticated event was already emitted by sendTokenToServer
          // so the welcome message will be updated automatically
        }
      } catch (error) {
        // Hide loader on error
        hideLoader(loaderContainer);

        // Show error message
        const errorContainer = block.querySelector('.login-nav-widget-container');
        if (errorContainer) {
          const errorLabels = await fetchPlaceholders();
          errorContainer.innerHTML = `
              <div class="error-message">
                <p>${error.message || errorLabels?.mfe?.login?.errorMessage || 'Authentication failed. Please try again later.'}</p>
              </div>
            `;
        }

        console.error('Authentication failed:', error);
      }
    },
    // onRegister: () => sendTokenToServer(),
  });
  // });
}
