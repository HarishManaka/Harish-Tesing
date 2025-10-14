import navigationStore from './nav-store.js';
import { renderNasmAfaaLogo } from '../../utils/cart-checkout.js';
import { rootLink } from '../../scripts/scripts.js';

class NavMobileHeader extends HTMLElement {
  constructor() {
    super();
    this.toggle = this.toggle.bind(this);
    this.handleSearch = this.handleSearch.bind(this);
    this.toggleMiniCart = this.toggleMiniCart.bind(this);
    this.handleCartClick = this.handleCartClick.bind(this);
    this.toggleAuthDropdown = this.toggleAuthDropdown.bind(this);
    this.handleAuthClick = this.handleAuthClick.bind(this);
    this.handleOutsideClick = this.handleOutsideClick.bind(this);
    this.handleLogoClick = this.handleLogoClick.bind(this);
    this.cartPanel = null;
    this.cartButton = null;
    this.authPanel = null;
    this.authButton = null;
    this.logoContainer = null;
  }

  async connectedCallback() {
    await this.render();
    // Update the icon after initial render
    this.updateHamburgerIcon();
  }

  disconnectedCallback() {
    // Remove global event listeners
    document.removeEventListener('click', this.handleOutsideClick);

    // Remove cart button listener
    if (this.cartButton) {
      this.cartButton.removeEventListener('click', this.handleCartClick);
    }

    // Remove auth button listener
    if (this.authButton) {
      this.authButton.removeEventListener('click', this.handleAuthClick);
    }

    // Remove logo click listener
    if (this.logoContainer) {
      this.logoContainer.removeEventListener('click', this.handleLogoClick);
    }

    // Remove media query listener for login widget
    if (this.loginWidgetMediaQuery && this.handleLoginWidgetInit) {
      this.loginWidgetMediaQuery.removeEventListener('change', this.handleLoginWidgetInit);
    }
  }

  static get observedAttributes() {
    return ['open', 'level'];
  }

  async attributeChangedCallback(name, oldValue, newValue) {
    // Only update if the value actually changed
    if (oldValue === newValue) return;

    if (name === 'open') {
      // Just update the hamburger icon without re-rendering everything
      // Only update if we're connected to the DOM
      if (this.isConnected) {
        this.updateHamburgerIcon();
      }
    } else if (name === 'level') {
      // Update the data-level attribute for CSS styling
      if (this.isConnected) {
        this.setAttribute('data-level', newValue);
        // Only re-render if it's the first time (component not initialized)
        if (!this.querySelector('.mobile-nav__header-container')) {
          await this.render();
        }
      }
    }
  }

  updateHamburgerIcon() {
    const hamburgerBtn = this.querySelector('.mobile-nav__toggle');
    if (!hamburgerBtn) return;

    const open = this.getAttribute('open') === 'true';

    // Update the SVG icon
    hamburgerBtn.innerHTML = open
      ? `
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      `
      : `
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      `;
  }

  toggle() {
    const open = this.getAttribute('open') === 'true';
    this.setAttribute('open', String(!open));
    this.dispatchEvent(
      new CustomEvent('toggle-nav', { bubbles: true, detail: { open: !open } }),
    );
  }

  handleSearch(e) {
    const query = e.target.value;
    const resultsCount = query ? Math.floor(Math.random() * 5) + 1 : 0; // Mock results count

    // Dispatch search event for navigation filtering
    this.dispatchEvent(
      new CustomEvent('nav-search', {
        bubbles: true,
        detail: { query, resultsCount },
      }),
    );
  }

  toggleMiniCart(state) {
    if (!this.cartPanel) return;

    const show = state ?? !this.cartPanel.classList.contains('nav-tools-panel--show');
    const stateChanged = show !== this.cartPanel.classList.contains('nav-tools-panel--show');

    // Close auth panel if opening cart
    if (show && this.authPanel) {
      this.toggleAuthDropdown(false);
    }

    this.cartPanel.classList.toggle('nav-tools-panel--show', show);
    this.cartPanel.setAttribute('aria-hidden', !show);

    // Publish cart view event if opening
    if (stateChanged && show && window.publishShoppingCartViewEvent) {
      window.publishShoppingCartViewEvent();
    }
  }

  handleCartClick(e) {
    e.stopPropagation();
    // If the mobile nav is open, close it (mimic toggle behavior)
    if (this.getAttribute('open') === 'true') {
      this.toggle();
    }
    this.toggleMiniCart();
  }

  toggleAuthDropdown(state) {
    if (!this.authPanel) return;

    const show = state ?? !this.authPanel.classList.contains('nav-tools-panel--show');

    // Close cart panel if opening auth
    if (show && this.cartPanel) {
      this.toggleMiniCart(false);
    }

    this.authPanel.classList.toggle('nav-tools-panel--show', show);
    this.authPanel.setAttribute('aria-hidden', !show);
    this.authButton.setAttribute('aria-expanded', show);
  }

  handleAuthClick(e) {
    e.stopPropagation();
    // If the mobile nav is open, close it (mimic toggle behavior)
    if (this.getAttribute('open') === 'true') {
      this.toggle();
    }
    this.toggleAuthDropdown();
  }

  handleOutsideClick(e) {
    // Close mini cart if clicking outside
    if (this.cartPanel && this.cartButton
        && !this.cartPanel.contains(e.target)
        && !this.cartButton.contains(e.target)) {
      this.toggleMiniCart(false);
    }

    // Close auth dropdown if clicking outside, but allow clicks inside auth widget
    if (this.authPanel && this.authButton) {
      const targetEl = e.target;

      // Check if the click is within the auth panel or button
      const isInsideAuthPanel = this.authPanel.contains(targetEl);
      const isInsideAuthButton = this.authButton.contains(targetEl);

      // Check if the click is within the Angular login widget or its children
      const hasClosest = typeof targetEl?.closest === 'function';
      const isInsideAngularWidget = (hasClosest && (
        targetEl.closest('ua-ng-login') !== null
        || targetEl.closest('ua-ng-login-lib') !== null
        || targetEl.closest('ua-user-login') !== null
        || targetEl.closest('ua-account-reset') !== null
        || targetEl.closest('ua-user-tp-modal') !== null
        || targetEl.closest('ua-change-password') !== null
        || targetEl.closest('.ua-login-container') !== null
        || targetEl.closest('.ua-form-signin') !== null
        || targetEl.closest('.ua-form-reset') !== null
        || targetEl.closest('#mobile-nav-auth-dropin-container') !== null
      ));

      // Also check for specific class names that might be on the clicked element
      const hasAuthClass = targetEl?.className && typeof targetEl.className === 'string'
        && (targetEl.className.includes('ua-')
            || targetEl.className.includes('login')
            || targetEl.className.includes('reset')
            || targetEl.className.includes('password'));

      // Only close if the click is truly outside all auth-related elements
      if (!isInsideAuthPanel && !isInsideAuthButton && !isInsideAngularWidget && !hasAuthClass) {
        this.toggleAuthDropdown(false);
      }
    }
  }

  handleLogoClick(e, home) {
    e.stopPropagation();
    if (home) {
      window.location.href = rootLink('/');
      return;
    }

    // Close any open panels when navigating
    if (this.cartPanel) this.toggleMiniCart(false);
    if (this.authPanel) this.toggleAuthDropdown(false);
  }

  async render() {
    const open = this.getAttribute('open') === 'true';
    const level = parseInt(this.getAttribute('level'), 10) || 1;

    // Set data attribute for level-based CSS styling
    this.setAttribute('data-level', level);

    // Let CSS handle visibility based on level
    // CSS rule: nav-mobile-header[data-level="3"] { display: none; }
    this.innerHTML = `
      <div class="mobile-nav__header-container">
        <div class="mobile-nav__logo">
          <!-- Logo injected from extracted navigation data -->
        </div>
        <div class="mobile-nav__actions">
          <button class="mobile-nav__action-btn" aria-label="Call us">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
            </svg>
          </button>
          <div class="mobile-nav__auth-wrapper nav-tools-wrapper">
            <button class="mobile-nav__action-btn nav-auth-button" aria-label="User account" aria-haspopup="dialog" aria-expanded="false">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </button>
            <div class="mobile-nav-auth-panel login-nav-panel nav-tools-panel" role="dialog" aria-hidden="true">
              <div id="mobile-nav-auth-dropin-container" class="dropin-design">
                <!-- Login widget from login-nav will be placed here -->
              </div>
            </div>
          </div>
          <div class="mobile-nav__cart-wrapper nav-tools-wrapper">
            <button class="mobile-nav__action-btn mobile-nav__cart nav-cart-button" aria-label="Shopping cart" data-count="0">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
              <span class="mobile-nav__cart-badge">0</span>
            </button>
            <div class="mobile-nav-cart-panel nav-tools-panel" aria-hidden="true">
              <div class="mobile-nav-cart-panel__content">
                <div id="mobile-nav-cart-dropin-container" class="dropin-design"></div>
              </div>
            </div>
          </div>
          <button class="mobile-nav__toggle" aria-label="Toggle navigation">
            ${
  open
    ? `
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            `
    : `
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            `
}
          </button>
        </div>
      </div>
      ${open && (level === 1 || level === 2) ? `
      <div class="mobile-nav__search-container">
        <input 
          type="text" 
          class="mobile-nav__search-input" 
          placeholder="Search..."
          aria-label="Search navigation"
        />
        <svg class="mobile-nav__search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.35-4.35"></path>
        </svg>
      </div>
      ` : ''}`;

    const toggleButton = this.querySelector('.mobile-nav__toggle');
    if (toggleButton) {
      toggleButton.addEventListener('click', this.toggle);
    }

    const cartPanel = this.querySelector('.mobile-nav-cart-panel');
    if (cartPanel) {
      cartPanel.addEventListener('click', (e) => {
        if (e.target.classList.contains('custom-cart-heading-button')
          || e.target.closest('.custom-cart-heading-button')) {
          this.handleCartClick(e);
        }
      });
    }

    // Add search event listener if search input exists (only at level 1)
    const searchInput = this.querySelector('.mobile-nav__search-input');
    if (searchInput) {
      searchInput.addEventListener('input', this.handleSearch);
    }

    // Mini cart event listeners
    this.cartButton = this.querySelector('.nav-cart-button');
    this.cartPanel = this.querySelector('.mobile-nav-cart-panel');

    if (this.cartButton) {
      this.cartButton.addEventListener('click', this.handleCartClick);
    }

    // Auth dropdown event listeners
    this.authButton = this.querySelector('.nav-auth-button');
    this.authPanel = this.querySelector('.mobile-nav-auth-panel');

    if (this.authButton) {
      this.authButton.addEventListener('click', this.handleAuthClick);
    }

    // Global click listener for closing panels
    document.addEventListener('click', this.handleOutsideClick);

    // Inject logo from extracted navigation data
    this.injectLogo();

    // Initialize login widget in auth panel
    await this.initializeLoginWidget();
  }

  async initializeLoginWidget() {
    try {
      // Create media query for mobile detection (max-width: 767px)
      const mobileMediaQuery = window.matchMedia('(max-width: 899px)');

      // Store whether login widget has been initialized
      let isInitialized = false;

      // Function to handle initialization based on viewport
      const handleLoginWidgetInit = async (mediaQuery) => {
        const isMobile = mediaQuery.matches;

        const authContainer = this.querySelector('#mobile-nav-auth-dropin-container');
        if (!authContainer) return;

        if (isMobile && !isInitialized) {
          // Initialize login widget only on mobile

          // Dynamically import the login-nav decorate function
          const { default: decorateLoginNav } = await import('../login-nav/login-nav.js');

          // Call the decorate function with the container element
          await decorateLoginNav(authContainer);

          // Remove any header elements that might have been added
          const loginHeader = authContainer.querySelector('.login-nav-header');
          if (loginHeader) {
            loginHeader.style.display = 'none';
          }

          // Adjust styles for panel context
          authContainer.classList.add('mobile-nav-auth-login-widget');

          isInitialized = true;
        }
      };

      // Check initial state and initialize if mobile
      await handleLoginWidgetInit(mobileMediaQuery);

      // Listen for viewport changes
      mobileMediaQuery.addEventListener('change', handleLoginWidgetInit);

      // Store the media query listener for cleanup if needed
      this.loginWidgetMediaQuery = mobileMediaQuery;
      this.handleLoginWidgetInit = handleLoginWidgetInit;
    } catch (error) {
      console.error('Failed to initialize login widget:', error);
    }
  }

  injectLogo() {
    const logoContainer = this.querySelector('.mobile-nav__logo');
    if (!logoContainer) return;

    // Clear any existing content
    logoContainer.innerHTML = '';

    const navData = navigationStore.getNavData();
    const { logoElement } = navData || {};

    if (logoElement && logoElement.cloneNode) {
      const cloned = logoElement.cloneNode(true);
      logoContainer.appendChild(cloned);
    }
    renderNasmAfaaLogo(logoContainer);

    // Set up logo click handler
    this.logoContainer = logoContainer;
    if (this.logoContainer) {
      this.logoContainer.addEventListener('click', (e) => this.handleLogoClick(e, true));
      // Add cursor pointer style to indicate it's clickable
      this.logoContainer.style.cursor = 'pointer';
    }
  }
}
customElements.define('nav-mobile-header', NavMobileHeader);
