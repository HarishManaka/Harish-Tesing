/**
 * Navigation Dropins Integration
 * Handles commerce dropins for mini cart and authentication in navigation
 */

import { events } from '@dropins/tools/event-bus.js';
import { getMetadata } from '../../scripts/aem.js';
import { fetchPlaceholders, computePayTodayInfo } from '../../scripts/commerce.js';
import { loadFragment } from '../fragment/fragment.js';

let miniCartInitialized = false;
let miniCartElement = null;
let navPlaceholders;
const MOBILE_BREAKPOINT = 900;

/**
 * Move mini cart to appropriate container based on viewport width
 */
function moveMiniCartToContainer() {
  if (!miniCartElement) return;

  const desktopCartContainer = document.querySelector('#nav-cart-dropin-container');
  const mobileCartContainer = document.querySelector('#mobile-nav-cart-dropin-container');

  const isMobile = window.innerWidth < MOBILE_BREAKPOINT;
  const targetContainer = isMobile ? mobileCartContainer : desktopCartContainer;
  const targetType = isMobile ? 'mobile' : 'desktop';

  if (targetContainer && miniCartElement.parentElement !== targetContainer) {
    const previousType = miniCartElement.parentElement === desktopCartContainer ? 'desktop' : 'mobile';
    console.info(`Moving minicart from ${previousType} to ${targetType} container (viewport: ${window.innerWidth}px, breakpoint: ${MOBILE_BREAKPOINT}px)`);
    targetContainer.appendChild(miniCartElement);
  }
}

/**
 * Initialize mini cart dropin for navigation
 */
export async function initializeMiniCart() {
  if (miniCartInitialized) return;

  try {
    // Desktop mini cart container
    const desktopCartContainer = document.querySelector('#nav-cart-dropin-container');
    // Mobile mini cart container
    const mobileCartContainer = document.querySelector('#mobile-nav-cart-dropin-container');

    if (!desktopCartContainer && !mobileCartContainer) return;

    // Load mini cart fragment if configured
    const miniCartMeta = getMetadata('mini-cart');
    const miniCartPath = miniCartMeta ? new URL(miniCartMeta, window.location).pathname : '/mini-cart';

    // Load the fragment properly using loadFragment which handles block decoration
    const miniCartFragment = await loadFragment(miniCartPath);

    if (miniCartFragment && miniCartFragment.firstElementChild) {
      // Store the singleton mini cart element
      miniCartElement = miniCartFragment.firstElementChild;
      console.info(`Minicart initialized. Current viewport: ${window.innerWidth}px`);

      // Move to appropriate container based on current viewport
      moveMiniCartToContainer();

      // Set up resize listener to move cart between containers
      let resizeTimeout;
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          moveMiniCartToContainer();
        }, 150);
      });
    }

    miniCartInitialized = true;
  } catch (error) {
    console.error('Failed to initialize mini cart:', error);
  }
}

// Auth functionality is now handled by the login-nav widget
// No need for separate auth initialization here

/**
 * Setup cart event listeners
 */
function setupCartEvents() {
  // Listen for cart data updates
  events.on(
    'cart/data',
    (data) => {
      // Compute Pay Today eligibility and expose for nav consumers
      const ensurePlaceholders = async () => {
        if (!navPlaceholders) navPlaceholders = await fetchPlaceholders();
        return navPlaceholders;
      };
      ensurePlaceholders().then((labels) => {
        const shopingCartTitle = document.querySelector('header [data-testid="default-cart-heading"]');
        if (shopingCartTitle) {
          shopingCartTitle.innerHTML = `
            <span class="custom-cart-heading-text">${labels?.cart.title}</span>
            <span class="custom-cart-heading-count">${data?.totalQuantity} item${data?.totalQuantity === 1 ? '' : 's'}</span>
            <button class="custom-cart-heading-button">
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7.46875 5L10.8438 1.65625C11.0312 1.46875 11.0312 1.125 10.8438 0.9375L10.0625 0.15625C9.875 -0.03125 9.53125 -0.03125 9.34375 0.15625L6 3.53125L2.625 0.15625C2.4375 -0.03125 2.09375 -0.03125 1.90625 0.15625L1.125 0.9375C0.9375 1.125 0.9375 1.46875 1.125 1.65625L4.5 5L1.125 8.375C0.9375 8.5625 0.9375 8.90625 1.125 9.09375L1.90625 9.875C2.09375 10.0625 2.4375 10.0625 2.625 9.875L6 6.5L9.34375 9.875C9.53125 10.0625 9.875 10.0625 10.0625 9.875L10.8438 9.09375C11.0312 8.90625 11.0312 8.5625 10.8438 8.375L7.46875 5Z" fill="#333333"/>
              </svg>
            </button>
          `;
        }
        const { isRenderPayToday, offerAmount } = computePayTodayInfo(data, labels);

        const preCheckoutSection = document.querySelector('header  [data-slot="PreCheckoutSection"]');

        if (isRenderPayToday) {
          preCheckoutSection.innerHTML = `
          <div class="paytoday-offer ">
            <div class="paytoday-offer-price">$${offerAmount} Pay Today!</div>
              <div class="paytoday-offer-subheader">Choose your payment plan at checkout</div>
            </div>
          `;
        } else {
          preCheckoutSection.innerHTML = '';
        }

        // document.dispatchEvent(new CustomEvent('nav:paytoday', {
        //   detail: { isRenderPayToday, payTodayAmount, offerAmount },
        // }));
      });

      // Update desktop and mobile cart buttons
      const cartButtons = document.querySelectorAll('.nav-cart-button');
      cartButtons.forEach((button) => {
        if (data?.totalQuantity) {
          button.setAttribute('data-count', data.totalQuantity);
        } else {
          button.setAttribute('data-count', '0');
        }
      });
    },
    { eager: true },
  );
}

// Auth event listeners removed - handled by login-nav widget

/**
 * Initialize all navigation dropins
 */
export async function initializeNavDropins() {
  try {
    // Initialize only mini cart (auth is handled by login-nav widget)
    await initializeMiniCart();

    // Setup event listeners
    setupCartEvents();

    // Listen for panels opening to lazy-load dropins
    document.addEventListener('click', (e) => {
      if (e.target.closest('.nav-cart-button')) {
        initializeMiniCart();
      }
    });
  } catch (error) {
    console.error('Failed to initialize navigation dropins:', error);
  }
}
