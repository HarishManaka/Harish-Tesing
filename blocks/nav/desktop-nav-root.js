/**
 * Desktop Navigation Root Component
 * Main navigation container and orchestration for desktop navigation
 */
import { events } from '@dropins/tools/event-bus.js';

import { checkIsAuthenticated } from '../../scripts/configs.js';
import { rootLink } from '../../scripts/scripts.js';

import { getDesktopNavigationData } from './nav-data-extractor.js';
import navigationStore from './nav-store.js';
import { renderNasmAfaaLogo } from '../../utils/cart-checkout.js';

class DesktopNavRoot extends HTMLElement {
  constructor() {
    super();

    this.activeDropdown = null;
    this.closeTimeout = null;
    this.mainNavItems = [];
    this.cartPanel = null;
    this.cartButton = null;
    this.authPanel = null;
    this.authButton = null;
    this.searchPanel = null;
    this.searchButton = null;
    this.searchInput = null;
    this.searchForm = null;

    // Bind methods
    this.handleMouseEnter = this.handleMouseEnter.bind(this);
    this.handleMouseLeave = this.handleMouseLeave.bind(this);
    this.handleDropdownMouseEnter = this.handleDropdownMouseEnter.bind(this);
    this.handleDropdownMouseLeave = this.handleDropdownMouseLeave.bind(this);
    this.cleanup = this.cleanup.bind(this);
    this.toggleMiniCart = this.toggleMiniCart.bind(this);
    this.handleCartClick = this.handleCartClick.bind(this);
    this.toggleAuthDropdown = this.toggleAuthDropdown.bind(this);
    this.handleAuthClick = this.handleAuthClick.bind(this);
    this.toggleSearch = this.toggleSearch.bind(this);
    this.handleSearchClick = this.handleSearchClick.bind(this);
    this.handleOutsideClick = this.handleOutsideClick.bind(this);
    this.handleLogoClick = this.handleLogoClick.bind(this);
  }

  async connectedCallback() {
    await this.initializeComponent();
  }

  async initializeComponent() {
    try {
      // Check for debug flags
      const urlParams = new URLSearchParams(window.location.search);
      const debugMode = urlParams.get('debug') === 'true';
      const forceDropdown = urlParams.get('dropdown') === 'show';

      // Store debug flags
      this.debugMode = debugMode;
      this.forceDropdown = forceDropdown;

      // Load navigation data from HTML
      this.mainNavItems = getDesktopNavigationData();

      // Render the component
      this.render();

      // Add event listeners
      this.addEventListeners();

      // Inject logo from extracted navigation data
      this.injectLogo();

      // Initialize login widget in auth panel
      await this.initializeLoginWidget();

      // If forceDropdown is enabled, automatically activate the first dropdown item
      if (forceDropdown && this.mainNavItems.length > 0) {
        const firstDropdownItem = this.mainNavItems.find(
          (item) => item.hasChildren,
        );
        if (firstDropdownItem) {
          this.setActiveDropdown(firstDropdownItem.id);
        }
      }
    } catch (error) {
      console.error('DesktopNavRoot initializeComponent error:', error);
    }
  }

  disconnectedCallback() {
    this.cleanup();
  }

  cleanup() {
    if (this.closeTimeout) {
      clearTimeout(this.closeTimeout);
      this.closeTimeout = null;
    }

    // Remove global event listeners
    document.removeEventListener('click', this.handleOutsideClick);

    // Remove logo click listener
    if (this.logoContainer) {
      this.logoContainer.removeEventListener('click', this.handleLogoClick);
    }

    // Remove cart button listener
    if (this.cartButton) {
      this.cartButton.removeEventListener('click', this.handleCartClick);
    }

    // Remove auth button listener
    if (this.authButton) {
      this.authButton.removeEventListener('click', this.handleAuthClick);
    }

    // Remove search button listener
    if (this.searchButton) {
      this.searchButton.removeEventListener('click', this.handleSearchClick);
    }

    // Remove media query listener for login widget
    if (this.loginWidgetMediaQuery && this.handleLoginWidgetInit) {
      this.loginWidgetMediaQuery.removeEventListener('change', this.handleLoginWidgetInit);
    }
  }

  handleMouseEnter(itemId) {
    // Clear any pending close timeout
    if (this.closeTimeout) {
      clearTimeout(this.closeTimeout);
      this.closeTimeout = null;
    }

    // Check if this navigation item has children
    const navItem = this.mainNavItems.find((item) => item.id === itemId);
    if (navItem && navItem.hasChildren) {
      this.setActiveDropdown(itemId);
    } else {
      // Hovered a non-dropdown item: hide any open dropdown
      this.setActiveDropdown(null);
    }
  }

  handleMouseLeave() {
    // In force dropdown mode, don't close the dropdown on mouse leave
    if (this.forceDropdown) {
      return;
    }

    // Add a small delay before closing to allow moving to dropdown
    this.closeTimeout = setTimeout(() => {
      this.setActiveDropdown(null);
    }, 100);
  }

  // Centralized method to manage dropdown state
  setActiveDropdown(itemId) {
    this.activeDropdown = itemId;
    this.updateDropdownState();
    this.updateNavItemStates();
  }

  // Update navigation item states using CSS classes and data attributes
  updateNavItemStates() {
    const navItems = this.querySelectorAll('.desktop-nav__nav-item');
    navItems.forEach((item) => {
      const link = item.querySelector('.desktop-nav__nav-link');
      const itemId = link?.dataset.itemId;
      const isActive = itemId === this.activeDropdown;

      // Use data attribute for CSS targeting
      item.dataset.active = isActive.toString();

      // Update link state
      if (link) {
        if (isActive) {
          link.classList.add('desktop-nav__nav-link--active');
        } else {
          link.classList.remove('desktop-nav__nav-link--active');
        }
      }
    });
  }

  handleDropdownMouseEnter() {
    // Clear any pending close timeout when entering dropdown
    if (this.closeTimeout) {
      clearTimeout(this.closeTimeout);
      this.closeTimeout = null;
    }
  }

  handleDropdownMouseLeave() {
    // In force dropdown mode, don't close the dropdown on mouse leave
    if (this.forceDropdown) {
      return;
    }

    // Close immediately when leaving dropdown
    if (this.closeTimeout) {
      clearTimeout(this.closeTimeout);
      this.closeTimeout = null;
    }
    this.activeDropdown = null;
    this.updateDropdownState();
  }

  updateDropdownState() {
    // Update active indicator using CSS positioning
    this.updateActiveIndicator();

    // Dispatch dropdown state change event for dropdown component
    const eventDetail = {
      activeDropdown: this.activeDropdown,
      onMouseEnter: this.handleDropdownMouseEnter,
      onMouseLeave: this.handleDropdownMouseLeave,
    };

    // Find the dropdown component and dispatch event directly on it
    const dropdownElement = this.querySelector('desktop-nav-dropdown');
    if (dropdownElement) {
      dropdownElement.dispatchEvent(
        new CustomEvent('dropdown-state-change', {
          detail: eventDetail,
          bubbles: false,
        }),
      );
    } else {
      console.error('DesktopNavRoot updateDropdownState: dropdown element not found');
    }
  }

  updateActiveIndicator() {
    // Remove existing indicators
    const existingIndicators = this.querySelectorAll(
      '.desktop-nav__active-indicator',
    );
    existingIndicators.forEach((indicator) => indicator.remove());

    // Add indicator to active item
    if (this.activeDropdown) {
      const activeNavItem = this.querySelector(
        `[data-item-id="${this.activeDropdown}"]`,
      )?.closest('.desktop-nav__nav-item');
      if (activeNavItem) {
        const indicator = document.createElement('div');
        indicator.className = 'desktop-nav__active-indicator';
        activeNavItem.appendChild(indicator);
      }
    }
  }

  toggleMiniCart(state) {
    if (!this.cartPanel) return;

    const show = state ?? !this.cartPanel.classList.contains('nav-tools-panel--show');
    const stateChanged = show !== this.cartPanel.classList.contains('nav-tools-panel--show');

    // Close other panels if opening cart
    if (show) {
      if (this.authPanel) this.toggleAuthDropdown(false);
      if (this.searchPanel) this.toggleSearch(false);
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
    this.toggleMiniCart();
  }

  toggleAuthDropdown(state) {
    if (!this.authPanel) return;

    const show = state ?? !this.authPanel.classList.contains('nav-tools-panel--show');

    // Close other panels if opening auth
    if (show) {
      if (this.cartPanel) this.toggleMiniCart(false);
      if (this.searchPanel) this.toggleSearch(false);
    }

    this.authPanel.classList.toggle('nav-tools-panel--show', show);
    requestAnimationFrame(() => {
      setTimeout(() => {
        this.authPanel.querySelector('#nav-auth-dropin-container')?.classList?.remove?.('show-welcome');
      }, 150);
    });
    this.authPanel.setAttribute('aria-hidden', !show);
    this.authButton.setAttribute('aria-expanded', show);
  }

  async toggleSearch(state) {
    if (!this.searchPanel) return;

    const show = state ?? !this.searchPanel.classList.contains('nav-tools-panel--show');

    // Close other panels if opening search
    if (show) {
      if (this.cartPanel) this.toggleMiniCart(false);
      if (this.authPanel) this.toggleAuthDropdown(false);
    }

    this.searchPanel.classList.toggle('nav-tools-panel--show', show);
    this.searchPanel.setAttribute('aria-hidden', !show);

    if (show) {
      // Dynamically import searchbar module when first opening search
      // Using the new dropin-based searchbar for better compatibility
      await import('../header/searchbar-dropin.js').then((module) => {
        if (module.default) {
          module.default();
        }
      });
      if (this.searchInput) {
        this.searchInput.focus();
      }
    }
  }

  handleSearchClick(e) {
    e.stopPropagation();
    this.toggleSearch();
  }

  handleAuthClick(e) {
    e.stopPropagation();
    this.toggleAuthDropdown();
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
    if (this.searchPanel) this.toggleSearch(false);
  }

  handleOutsideClick(e) {
    // Close mini cart if clicking outside
    if (this.cartPanel && this.cartButton
        && !this.cartPanel.contains(e.target)
        && !this.cartButton.contains(e.target)) {
      this.toggleMiniCart(false);
    }

    // Close auth dropdown if clicking outside
    if (this.authPanel && this.authButton) {
      // Check if the click is within the auth panel or button
      const isInsideAuthPanel = this.authPanel.contains(e.target);
      const isInsideAuthButton = this.authButton.contains(e.target);

      // Check if the click is within the Angular element or its children
      // This handles clicks on dynamically created elements within ua-ng-login
      const isInsideAngularWidget = e.target.closest('ua-ng-login') !== null
        || e.target.closest('ua-ng-login-lib') !== null
        || e.target.closest('ua-user-login') !== null
        || e.target.closest('ua-account-reset') !== null
        || e.target.closest('ua-user-tp-modal') !== null
        || e.target.closest('ua-change-password') !== null
        || e.target.closest('.ua-login-container') !== null
        || e.target.closest('.ua-form-signin') !== null
        || e.target.closest('.ua-form-reset') !== null
        || e.target.closest('#nav-auth-dropin-container') !== null;

      // Also check for specific class names that might be on the clicked element
      const hasAuthClass = e.target.className && typeof e.target.className === 'string'
        && (e.target.className.includes('ua-')
            || e.target.className.includes('login')
            || e.target.className.includes('reset')
            || e.target.className.includes('password'));

      // Only close if the click is truly outside all auth-related elements
      if (!isInsideAuthPanel && !isInsideAuthButton && !isInsideAngularWidget && !hasAuthClass) {
        this.toggleAuthDropdown(false);
      }
    }

    // Close search panel if clicking outside
    if (this.searchPanel && this.searchButton
        && !this.searchPanel.contains(e.target)
        && !this.searchButton.contains(e.target)) {
      this.toggleSearch(false);
    }
  }

  async initializeLoginWidget() {
    try {
      // Create media query for desktop detection (min-width: 768px)
      const desktopMediaQuery = window.matchMedia('(min-width: 900px)');

      // Store whether login widget has been initialized
      let isInitialized = false;

      // Function to handle initialization based on viewport
      const handleLoginWidgetInit = async (mediaQuery) => {
        const isDesktop = mediaQuery.matches;
        console.info(`Desktop nav: Device is ${isDesktop ? 'desktop' : 'mobile'} (width ${isDesktop ? '>=' : '<'} 900px)`);

        const authContainer = this.querySelector('#nav-auth-dropin-container');
        if (!authContainer) return;

        if (isDesktop && !isInitialized) {
          // Initialize login widget only on desktop
          console.info('Initializing login widget for desktop view');

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
          authContainer.classList.add('nav-auth-login-widget');

          isInitialized = true;
        }
      };

      // Check initial state and initialize if desktop
      await handleLoginWidgetInit(desktopMediaQuery);

      // Listen for viewport changes
      desktopMediaQuery.addEventListener('change', handleLoginWidgetInit);

      // Store the media query listener for cleanup if needed
      this.loginWidgetMediaQuery = desktopMediaQuery;
      this.handleLoginWidgetInit = handleLoginWidgetInit;
    } catch (error) {
      console.error('Failed to initialize login widget:', error);
    }
  }

  addEventListeners() {
    // Add mouse event listeners to navigation items
    const navItems = this.querySelectorAll('.desktop-nav__nav-item');

    navItems.forEach((item) => {
      const link = item.querySelector('.desktop-nav__nav-link');
      const { itemId } = link.dataset;

      if (itemId) {
        item.addEventListener('mouseenter', () => this.handleMouseEnter(itemId));
        item.addEventListener('mouseleave', this.handleMouseLeave);
      } else {
        console.error('DesktopNavRoot addEventListeners: missing itemId');
      }
    });

    // Add logo click event listener
    this.logoContainer = this.querySelector('.desktop-nav__logo');
    if (this.logoContainer) {
      this.logoContainer.addEventListener('click', (e) => this.handleLogoClick(e, true));
      // Add cursor pointer style to indicate it's clickable
      this.logoContainer.style.cursor = 'pointer';
    }

    // Mini cart event listeners
    this.cartButton = this.querySelector('.nav-cart-button');
    this.cartPanel = this.querySelector('.nav-cart-panel');

    if (this.cartButton) {
      this.cartButton.addEventListener('click', this.handleCartClick);
    }

    if (this.cartPanel) {
      this.cartPanel.addEventListener('click', (e) => {
        if (e.target.classList.contains('custom-cart-heading-button')
        || e.target.closest('.custom-cart-heading-button')) {
          this.handleCartClick(e);
        }
      });
    }

    // Auth dropdown event listeners
    this.authButton = this.querySelector('.nav-auth-button');
    this.authPanel = this.querySelector('.nav-auth-panel');

    if (this.authButton) {
      this.authButton.addEventListener('click', this.handleAuthClick);
    }

    // Search panel event listeners
    this.searchButton = this.querySelector('.desktop-nav__search');
    this.searchPanel = this.querySelector('.nav-search-panel');
    this.searchInput = this.querySelector('.nav-search-panel input[type="search"]');
    this.searchForm = this.querySelector('.nav-search-panel form');
    this.searchClearButton = this.querySelector('.nav-search-clear');

    if (this.searchButton) {
      this.searchButton.addEventListener('click', this.handleSearchClick);
    }

    // Set search form action to use rootLink
    if (this.searchForm) {
      this.searchForm.action = rootLink('/search');
    }

    // Handle search input changes for clear button
    if (this.searchInput && this.searchClearButton) {
      this.searchInput.addEventListener('input', (e) => {
        this.searchClearButton.style.display = e.target.value ? 'flex' : 'none';
      });

      this.searchClearButton.addEventListener('click', () => {
        this.searchInput.value = '';
        this.searchClearButton.style.display = 'none';
        this.searchInput.focus();
        // Dispatch input event to trigger search result clearing
        this.searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      });
    }

    // Global click listener for closing panels
    document.addEventListener('click', this.handleOutsideClick);

    if (checkIsAuthenticated()) {
      const authButton = this.querySelector('.desktop-nav__sign-in-btn');

      authButton.classList.add('desktop-nav__sign-in-btn--loggedin');
      // window.location.href = rootLink('/');
    }

    events.on('authenticated', (isAuthenticated) => {
      const authButton = this.querySelector('.desktop-nav__sign-in-btn');
      if (isAuthenticated) {
        authButton.classList.add('desktop-nav__sign-in-btn--loggedin');
      } else {
        authButton.classList.remove('desktop-nav__sign-in-btn--loggedin');
      }
    });
  }

  injectLogo() {
    const logoContainer = this.querySelector('.desktop-nav__logo');
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
  }

  // eslint-disable-next-line class-methods-use-this
  renderNavItem(item) {
    const highlightClass = item.highlight ? 'desktop-nav__nav-link--highlighted' : '';
    const commonClasses = `desktop-nav__nav-link ${highlightClass}`;
    const dataAttribute = `data-item-id="${item.id}"`;

    // Check if item has a URL - if not, render as span
    if (!item.url) {
      return `
        <li class="desktop-nav__nav-item">
          <span 
            class="${commonClasses}"
            ${dataAttribute}
          >
            ${item.title}
          </span>
        </li>
      `;
    }

    // Render as anchor if URL exists
    return `
      <li class="desktop-nav__nav-item">
        <a 
          href="${item.url}" 
          class="${commonClasses}"
          ${dataAttribute}
        >
          ${item.title}
        </a>
      </li>
    `;
  }

  renderNavItems() {
    return this.mainNavItems
      .map((item) => this.renderNavItem(item))
      .join('');
  }

  render() {
    this.innerHTML = `
      <div class="desktop-nav">
        <!-- Main Navigation Header -->
        <div class="desktop-nav__header">
          <div class="desktop-nav__container">
            <!-- Logo -->
            <div class="desktop-nav__logo">
              <!-- Logo injected from extracted navigation data -->
            </div>

            <!-- Main Navigation -->
            <nav class="desktop-nav__nav">
              <ul class="desktop-nav__nav-list">
                ${this.renderNavItems()}
              </ul>
            </nav>

            <!-- Right Side Actions -->
            <div class="desktop-nav__actions">

             
              <!-- Phone Number -->
              <a href="tel:8004606276" class="desktop-nav__phone">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M25.1669 6.2917L21.2502 5.4167C20.3335 5.20837 19.4169 5.6667 19.0835 6.50003L17.2502 10.75C16.9169 11.5 17.1252 12.4167 17.7919 12.9584L19.4585 14.3334C18.2919 16.5 16.4585 18.2917 14.2919 19.5L12.9169 17.8334C12.3752 17.1667 11.4585 16.9584 10.7085 17.2917L6.45853 19.0834C5.6252 19.4584 5.16686 20.375 5.3752 21.2917L6.2502 25.2084C6.45853 26.0834 7.2502 26.6667 8.1252 26.6667C18.3335 26.6667 26.6669 18.4167 26.6669 8.1667C26.6669 7.2917 26.0419 6.50003 25.1669 6.2917ZM8.20853 24.6667L7.33353 20.9167L11.4169 19.1667L13.7502 22C17.8752 20.0417 20.0002 17.9167 21.9585 13.7917L19.1252 11.4584L20.8752 7.37503L24.6669 8.25003C24.6252 17.2917 17.2502 24.625 8.20853 24.6667Z" fill="#123257"/>
                </svg>
                <span class="desktop-nav__phone-number">800-460-6276</span>
              </a>

               <!-- Auth Dropdown -->
              <div class="desktop-nav__auth-wrapper nav-tools-wrapper">
                <button class="desktop-nav__sign-in-btn nav-auth-button" aria-haspopup="dialog" aria-expanded="false" aria-controls="nav-auth-modal">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  <span class="desktop-nav__auth-text">Sign in</span>
                </button>
                <div class="nav-auth-panel login-nav-panel nav-tools-panel" role="dialog" aria-hidden="true" id="nav-auth-modal">
                  <div id="nav-auth-dropin-container" class="dropin-design">
                    <!-- Login widget from login-nav will be placed here -->
                  </div>
                  
                </div>
              </div>

              <!-- Search -->
              <div class="desktop-nav__search-wrapper nav-tools-wrapper">
                <button class="desktop-nav__action-btn desktop-nav__search" aria-label="Search" aria-haspopup="true" aria-expanded="false">
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M26.5002 24.875L21.4585 19.8334C21.3335 19.75 21.2085 19.6667 21.0835 19.6667H20.5418C21.8335 18.1667 22.6668 16.1667 22.6668 14C22.6668 9.25004 18.7502 5.33337 14.0002 5.33337C9.2085 5.33337 5.3335 9.25004 5.3335 14C5.3335 18.7917 9.2085 22.6667 14.0002 22.6667C16.1668 22.6667 18.1252 21.875 19.6668 20.5834V21.125C19.6668 21.25 19.7085 21.375 19.7918 21.5L24.8335 26.5417C25.0418 26.75 25.3752 26.75 25.5418 26.5417L26.5002 25.5834C26.7085 25.4167 26.7085 25.0834 26.5002 24.875ZM14.0002 20.6667C10.2918 20.6667 7.3335 17.7084 7.3335 14C7.3335 10.3334 10.2918 7.33337 14.0002 7.33337C17.6668 7.33337 20.6668 10.3334 20.6668 14C20.6668 17.7084 17.6668 20.6667 14.0002 20.6667Z" fill="#123257"/>
                  </svg>
                </button>
                <div class="nav-search-panel nav-tools-panel" aria-hidden="true">
                  <form action="/search" method="GET" class="nav-search-form">
                    <div class="nav-search-input-wrapper">
                      <svg class="nav-search-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19.0002 18.375L15.4585 14.8334C15.3335 14.75 15.2085 14.6667 15.0835 14.6667H14.5418C15.8335 13.1667 16.6668 11.1667 16.6668 9C16.6668 4.25004 12.7502 0.33337 8.0002 0.33337C3.2085 0.33337 -0.6665 4.25004 -0.6665 9C-0.6665 13.7917 3.2085 17.6667 8.0002 17.6667C10.1668 17.6667 12.1252 16.875 13.6668 15.5834V16.125C13.6668 16.25 13.7085 16.375 13.7918 16.5L17.3335 20.0417C17.5418 20.25 17.8752 20.25 18.0418 20.0417L19.0002 19.0834C19.2085 18.9167 19.2085 18.5834 19.0002 18.375ZM8.0002 15.6667C4.2918 15.6667 1.3335 12.7084 1.3335 9C1.3335 5.3334 4.2918 2.33337 8.0002 2.33337C11.6668 2.33337 14.6668 5.3334 14.6668 9C14.6668 12.7084 11.6668 15.6667 8.0002 15.6667Z" fill="#666666"/>
                      </svg>
                      <input id="search" type="search" name="q" placeholder="Search for products, brands..." aria-label="Search products" />
                      <button type="button" class="nav-search-clear" aria-label="Clear search" style="display: none;">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12.5 3.5L3.5 12.5M3.5 3.5L12.5 12.5" stroke="#666666" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                      </button>
                    </div>
                    <div id="search_autocomplete" class="search-autocomplete"></div>
                  </form>
                </div>
              </div>
              <!-- Cart with Mini Cart Panel -->
              <div class="desktop-nav__cart-wrapper nav-tools-wrapper">
                <button class="desktop-nav__action-btn desktop-nav__cart nav-cart-button" aria-label="Shopping cart" data-count="0">
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M26.9583 7.99992H10L9.625 6.16659C9.54167 5.70825 9.125 5.33325 8.66667 5.33325H4.5C4.20833 5.33325 4 5.58325 4 5.83325V6.83325C4 7.12492 4.20833 7.33325 4.5 7.33325H7.83333L10.7083 22.1666C10.25 22.6666 10 23.2916 10 23.9999C10 25.4999 11.1667 26.6666 12.6667 26.6666C14.125 26.6666 15.3333 25.4999 15.3333 23.9999C15.3333 23.5416 15.1667 23.0833 14.9583 22.6666H21C20.7917 23.0833 20.6667 23.5416 20.6667 23.9999C20.6667 25.4999 21.8333 26.6666 23.3333 26.6666C24.7917 26.6666 26 25.4999 26 23.9999C26 23.2499 25.6667 22.5833 25.1667 22.0833L25.2083 21.9166C25.3333 21.2916 24.875 20.6666 24.2083 20.6666H12.4583L12.0833 18.6666H25.0833C25.5833 18.6666 25.9583 18.3749 26.0833 17.9166L27.9583 9.24992C28.0833 8.62492 27.625 7.99992 26.9583 7.99992ZM12.6667 24.9999C12.0833 24.9999 11.6667 24.5833 11.6667 23.9999C11.6667 23.4583 12.0833 22.9999 12.6667 22.9999C13.2083 22.9999 13.6667 23.4583 13.6667 23.9999C13.6667 24.5833 13.2083 24.9999 12.6667 24.9999ZM23.3333 24.9999C22.75 24.9999 22.3333 24.5833 22.3333 23.9999C22.3333 23.4583 22.75 22.9999 23.3333 22.9999C23.875 22.9999 24.3333 23.4583 24.3333 23.9999C24.3333 24.5833 23.875 24.9999 23.3333 24.9999ZM24.2917 16.6666H11.6667L10.375 9.99992H25.75L24.2917 16.6666Z" fill="#123257"/>
                  </svg>
                </button>
                <div class="nav-cart-panel nav-tools-panel" aria-hidden="true">
                  <div class="nav-cart-panel__content">
                    <div id="nav-cart-dropin-container" class="dropin-design"></div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        <!-- Dropdown component will be inserted here -->
        <desktop-nav-dropdown></desktop-nav-dropdown>
      </div>
    `;
  }
}

// Register custom element
customElements.define('desktop-nav-root', DesktopNavRoot);

export default DesktopNavRoot;
