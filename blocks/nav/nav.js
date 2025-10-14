/**
 * Navigation Block Entry Point
 * Coordinates all navigation components and data extraction
 */

// Import navigation root component
import './nav-root.js';

// Import data extraction functions
import { provider as UI, ProgressSpinner } from '@dropins/tools/components.js';
import {
  extractMainNavigation,
  extractLevel3Data,
  getMobileNavigationData,
} from './nav-data-extractor.js';

// Import desktop navigation components
import './desktop-nav-root.js';
import './desktop-nav-dropdown.js';
import './desktop-nav-third-level-content.js';

// Import navigation dropins integration
import { initializeNavDropins } from './nav-dropins.js';

// Import critical cart and auth utilities
import {
  restoreCartForGuestSession,
  restoreRemainingItemsToCart,
  getXSRFCookieAge,
  startAuthDropinTokenTimer,
} from '../../utils/cart-checkout.js';
import { checkIsAuthenticated, IsXSRFTokenPresent } from '../../scripts/configs.js';
import { sendTokenToServer } from '../../services/mfe-auth-service.js';

// Export mobile navigation data adapter for other components
export { getMobileNavigationData };

/**
 * Main navigation block decorator
 * Extracts data and sets up navigation components
 */
export default async function decorate(block) {
  const isXSRFTokenPresent = IsXSRFTokenPresent();
  const isAccsLoggedIn = checkIsAuthenticated();

  // Handle SSO login if user has token but not authenticated
  if (!isAccsLoggedIn && isXSRFTokenPresent) {
    const xsrfTokenAge = getXSRFCookieAge();

    // Only proceed with SSO login if token is still valid (less than 1 hour old)
    if (xsrfTokenAge && xsrfTokenAge < 3600) {
      const spinnerContainer = document.createElement('div');
      spinnerContainer.className = 'sso-login__overlay-container';
      document.body.appendChild(spinnerContainer);

      await UI.render(ProgressSpinner, {
        className: '.sso-login__overlay-spinner',
      })(spinnerContainer);

      try {
        await sendTokenToServer();
        setTimeout(() => {
          spinnerContainer.remove();
        }, 2000);
      } catch (error) {
        spinnerContainer.remove();
      }
    }
  }
  // Step 1: Extract main navigation data from HTML
  extractMainNavigation(block);

  // Step 2: Extract and link third level data from all .nav-level-3 containers
  Array.from(document.querySelectorAll('.nav-level-3')).forEach((el) => {
    extractLevel3Data(el);
  });

  // Step 3: Set up navigation components in header

  // eslint-disable-next-line no-unused-vars
  const desktopNavRoot = document.createElement('desktop-nav-root');
  // eslint-disable-next-line no-unused-vars
  const mobileNavRoot = document.createElement('nav-root');
  const header = document.querySelector('header');

  // Remove all existing children from header
  while (header.firstChild) {
    header.removeChild(header.firstChild);
  }

  // Add mobile navigation root to header
  header.appendChild(desktopNavRoot);
  header.appendChild(mobileNavRoot);

  // Initialize navigation dropins (mini cart and auth)
  initializeNavDropins();

  // Step 4: Critical cart and authentication initialization
  // These are essential for proper cart restoration and auth handling

  // Restore cart for guest session (handles logged-in user cart items)
  restoreCartForGuestSession();

  // Restore remaining items to cart (handles incomplete purchases)
  restoreRemainingItemsToCart({ initiator: 'header' });

  // Start the auth dropin token timer
  await startAuthDropinTokenTimer();
}
