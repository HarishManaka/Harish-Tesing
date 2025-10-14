import './nav-level-container.js';
import './nav-mobile-header.js';
import './nav-support-footer.js';
import './nav-third-level.js';

class NavRoot extends HTMLElement {
  constructor() {
    super();
    this.open = false;
    this.toggle = this.toggle.bind(this);
    this.mobileHeader = null;
    this.contentContainer = null;
    this.supportFooter = null;
    this.searchCleanup = null;
  }

  connectedCallback() {
    this.initializeComponents();
    this.addEventListener('toggle-nav', this.toggle);
  }

  disconnectedCallback() {
    this.removeEventListener('toggle-nav', this.toggle);

    // Cleanup search if it was initialized
    if (this.searchCleanup && typeof this.searchCleanup === 'function') {
      this.searchCleanup();
      this.searchCleanup = null;
    }
  }

  initializeComponents() {
    // Create mobile header once (static component)
    this.mobileHeader = document.createElement('nav-mobile-header');
    this.mobileHeader.setAttribute('level', '1');
    this.mobileHeader.setAttribute('open', this.open ? 'true' : 'false');

    // Create support footer once (static component)
    this.supportFooter = document.createElement('nav-support-footer');
    this.supportFooter.style.display = this.open ? 'block' : 'none';

    // Append static components
    this.appendChild(this.mobileHeader);
    // Content container will be inserted here dynamically
    this.appendChild(this.supportFooter);

    // Create initial content if open
    if (this.open) {
      this.createContentContainer();
    }
  }

  async createContentContainer() {
    // Remove existing content container if it exists
    if (this.contentContainer) {
      this.contentContainer.remove();
      this.contentContainer = null;
    }

    // Cleanup previous search initialization
    if (this.searchCleanup && typeof this.searchCleanup === 'function') {
      this.searchCleanup();
      this.searchCleanup = null;
    }

    // Create fresh content container with new nav-level-container
    this.contentContainer = document.createElement('div');
    this.contentContainer.className = 'nav-root__content';
    requestAnimationFrame(() => {
      setTimeout(() => {
        this.contentContainer.style.height = '100dvh';
      }, 100);
    });

    // Add search form
    const searchForm = NavRoot.createSearchForm();
    this.contentContainer.appendChild(searchForm);

    // Create new level container (this ensures fresh state)
    const levelContainer = document.createElement('nav-level-container');
    this.contentContainer.appendChild(levelContainer);

    // Insert content container between header and footer
    this.insertBefore(this.contentContainer, this.supportFooter);

    // Initialize search dropin with mobile configuration
    try {
      const { default: initSearchDropin } = await import('../header/searchbar-dropin.js');
      // initSearchDropin is async and returns a Promise
      this.searchCleanup = await initSearchDropin({
        searchInputId: 'mobile-search',
        autocompleteContainerId: 'mobile-search-autocomplete',
        isMobile: true,
        pageSize: 3,
      });
    } catch (error) {
      console.error('Failed to initialize mobile search dropin:', error);
    }
  }

  static createSearchForm() {
    const searchFragment = document.createRange().createContextualFragment(`
      <div class="mobile-nav-search-wrapper">
        <form action="/search" method="GET" class="mobile-nav-search-form">
          <div class="mobile-nav-search-input-wrapper">
            <svg class="mobile-nav-search-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M19.0002 18.375L15.4585 14.8334C15.3335 14.75 15.2085 14.6667 15.0835 14.6667H14.5418C15.8335 13.1667 16.6668 11.1667 16.6668 9C16.6668 4.25004 12.7502 0.33337 8.0002 0.33337C3.2085 0.33337 -0.6665 4.25004 -0.6665 9C-0.6665 13.7917 3.2085 17.6667 8.0002 17.6667C10.1668 17.6667 12.1252 16.875 13.6668 15.5834V16.125C13.6668 16.25 13.7085 16.375 13.7918 16.5L17.3335 20.0417C17.5418 20.25 17.8752 20.25 18.0418 20.0417L19.0002 19.0834C19.2085 18.9167 19.2085 18.5834 19.0002 18.375ZM8.0002 15.6667C4.2918 15.6667 1.3335 12.7084 1.3335 9C1.3335 5.3334 4.2918 2.33337 8.0002 2.33337C11.6668 2.33337 14.6668 5.3334 14.6668 9C14.6668 12.7084 11.6668 15.6667 8.0002 15.6667Z" fill="#666666"/>
            </svg>
            <input id="mobile-search" type="search" name="q" placeholder="Search for products, brands..." aria-label="Search products" />
            <button type="button" class="mobile-nav-search-clear" aria-label="Clear search" style="display: none;">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M12.5 3.5L3.5 12.5M3.5 3.5L12.5 12.5" stroke="#666666" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
          <div id="mobile-search-autocomplete" class="search-autocomplete mobile-search-autocomplete"></div>
        </form>
      </div>
    `);

    // Get references to elements for event listeners
    const searchWrapper = searchFragment.querySelector('.mobile-nav-search-wrapper');
    const searchInput = searchFragment.querySelector('#mobile-search');
    const clearButton = searchFragment.querySelector('.mobile-nav-search-clear');

    // Add event listeners for clear button
    searchInput.addEventListener('input', (e) => {
      clearButton.style.display = e.target.value ? 'flex' : 'none';
    });

    clearButton.addEventListener('click', () => {
      searchInput.value = '';
      clearButton.style.display = 'none';
      searchInput.focus();
      // Dispatch input event to trigger search result clearing
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
    });

    return searchWrapper;
  }

  toggle(e) {
    this.open = e.detail.open;
    this.setAttribute('data-open', this.open);
    this.updateVisibility();
  }

  updateVisibility() {
    // Update mobile header attribute without recreating it
    if (this.mobileHeader) {
      this.mobileHeader.setAttribute('open', this.open ? 'true' : 'false');
    }

    if (this.open) {
      // Create fresh content container when opening
      this.createContentContainer();

      // Show footer
      if (this.supportFooter) {
        this.supportFooter.style.display = 'block';
      }
    } else {
      // Clear search input and results before closing
      if (this.contentContainer) {
        const searchInput = this.contentContainer.querySelector('#mobile-search');
        const searchAutocomplete = this.contentContainer.querySelector('#mobile-search-autocomplete');
        const clearButton = this.contentContainer.querySelector('.mobile-nav-search-clear');

        if (searchInput) {
          searchInput.value = '';
          // Dispatch input event to trigger clearing of results
          searchInput.dispatchEvent(new Event('input', { bubbles: true }));
        }

        if (searchAutocomplete) {
          searchAutocomplete.innerHTML = '';
          searchAutocomplete.style.display = 'none';
        }

        if (clearButton) {
          clearButton.style.display = 'none';
        }
      }

      // Cleanup search if it was initialized
      if (this.searchCleanup && typeof this.searchCleanup === 'function') {
        this.searchCleanup();
        this.searchCleanup = null;
      }

      // Remove content container when closing to free memory
      if (this.contentContainer) {
        this.contentContainer.remove();
        this.contentContainer = null;
      }

      // Hide footer
      if (this.supportFooter) {
        this.supportFooter.style.display = 'none';
      }
    }
  }
}
customElements.define('nav-root', NavRoot);
