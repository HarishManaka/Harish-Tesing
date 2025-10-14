/**
 * Desktop Navigation Dropdown Component
 * Mega menu dropdown with category sidebar
 */

import { extractCategoriesFromNavData, getDesktopNavigationData } from './nav-data-extractor.js';

class DesktopNavDropdown extends HTMLElement {
  constructor() {
    super();

    this.isVisible = false;
    this.activeCategory = null;
    this.categories = [];
    this.rootId = null;
    this.onMouseEnter = null;
    this.onMouseLeave = null;

    // Bind methods
    this.handleCategoryHover = this.handleCategoryHover.bind(this);
    this.handleDropdownMouseEnter = this.handleDropdownMouseEnter.bind(this);
    this.handleDropdownMouseLeave = this.handleDropdownMouseLeave.bind(this);
  }

  async connectedCallback() {
    this.initializeComponent();
  }

  initializeComponent() {
    // Check for debug mode first
    const urlParams = new URLSearchParams(window.location.search);
    const debugMode = urlParams.get('debug') === 'true';
    const forceDropdown = urlParams.get('dropdown') === 'show';

    // Store debug flags for use throughout the component
    this.debugMode = debugMode;
    this.forceDropdown = forceDropdown;

    // Determine initial rootId from store if not provided
    if (!this.rootId) {
      const main = getDesktopNavigationData();
      this.rootId = (Array.isArray(main) && main[0]?.id) || '';
    }

    // Load dropdown categories for current root from store data
    this.categories = extractCategoriesFromNavData(this.rootId);

    if (debugMode || forceDropdown) {
      this.isVisible = true;

      // When forceDropdown is true, ensure we have a default active category
      if (forceDropdown && this.categories.length > 0) {
        this.activeCategory = this.categories[0].id;
      }
    }

    // Ensure activeCategory is set from data if not set yet
    if (!this.activeCategory && this.categories.length > 0) {
      this.activeCategory = this.categories[0].id;
    }

    this.render();

    // Listen for dropdown state changes from root component
    this.addEventListener('dropdown-state-change', (e) => {
      // In debug mode, keep dropdown visible regardless of hover state
      if (this.debugMode || this.forceDropdown) {
        this.isVisible = true;
      } else {
        this.isVisible = !!e.detail.activeDropdown;
      }

      this.onMouseEnter = e.detail.onMouseEnter;
      this.onMouseLeave = e.detail.onMouseLeave;

      // Set root based on active dropdown and reload categories
      this.rootId = e.detail.activeDropdown || 'get-certified';

      Promise.resolve(extractCategoriesFromNavData(this.rootId))
        .then((cats) => {
          this.categories = cats;
          if (cats && cats.length > 0) {
            this.activeCategory = cats[0].id;
          }
        })
        .finally(() => this.render());
    });
  }

  handleCategoryHover(categoryId) {
    this.activeCategory = categoryId;
    this.updateCategoryState();

    // Dispatch event for sub-components
    this.dispatchEvent(
      new CustomEvent('category-change', {
        detail: { activeCategory: this.activeCategory },
        bubbles: true,
      }),
    );
  }

  updateCategoryState() {
    // Update active category button styling using data attributes for CSS targeting
    const categoryButtons = this.querySelectorAll('.desktop-nav__category-btn');
    categoryButtons.forEach((btn) => {
      const { categoryId } = btn.dataset;
      const isActive = categoryId === this.activeCategory;

      // Use data-active attribute for CSS targeting instead of classes
      btn.dataset.active = isActive.toString();

      // Keep classes for backward compatibility, but prefer data attributes
      if (isActive) {
        btn.classList.add('desktop-nav__category-btn--active');
      } else {
        btn.classList.remove('desktop-nav__category-btn--active');
      }
    });

    // Trigger rendering of third-level content component only
    const thirdLevelContent = this.querySelector(
      'desktop-nav-third-level-content',
    );

    if (thirdLevelContent) {
      thirdLevelContent.setAttribute('category-id', this.activeCategory);
    }
  }

  handleDropdownMouseEnter() {
    if (this.onMouseEnter) {
      this.onMouseEnter();
    }
  }

  handleDropdownMouseLeave() {
    if (this.onMouseLeave) {
      this.onMouseLeave();
    }
  }

  renderCategoryButton(category) {
    const isActive = this.activeCategory === category.id;
    const activeClass = isActive ? 'desktop-nav__category-btn--active' : '';
    const commonAttributes = `
      class="desktop-nav__category-btn ${activeClass}"
      data-category-id="${category.id}"
      data-active="${isActive}"
    `;

    // Check if category has an href - if not, render as span
    if (!category.href) {
      return `
        <span ${commonAttributes}>
          ${category.title}
        </span>
      `;
    }

    // Render as anchor if href exists
    return `
      <a 
        href="${category.href}"
        ${commonAttributes}
      >
        ${category.title}
      </a>
    `;
  }

  renderCategoryButtons() {
    return this.categories
      .map((category) => this.renderCategoryButton(category))
      .join('');
  }

  addEventListeners() {
    // Add category hover listeners
    const categoryLinks = this.querySelectorAll('.desktop-nav__category-btn');
    categoryLinks.forEach((link) => {
      const { categoryId } = link.dataset;

      // Handle mouseenter for showing third-level content
      link.addEventListener('mouseenter', () => this.handleCategoryHover(categoryId));
    });
  }

  render() {
    // Always render the dropdown structure, but control visibility with CSS classes
    const visibilityClass = this.isVisible ? 'is-visible' : '';

    this.innerHTML = `
      <div class="desktop-nav__dropdown ${visibilityClass}">
        <div class="desktop-nav__dropdown-container">
          <!-- Category Sidebar -->
          <div class="desktop-nav__dropdown-sidebar">
            ${this.renderCategoryButtons()}
          </div>

          <!-- Main Content Area -->
          <div class="desktop-nav__dropdown-content">
            <!-- Third Level Content from HTML - EXCLUSIVE RENDERING -->
            <desktop-nav-third-level-content root-id="${
  this.rootId
}" category-id="${
  this.activeCategory
}"></desktop-nav-third-level-content>
          </div>
        </div>
      </div>
    `;

    // Add event listeners after rendering
    this.addEventListeners();
    this.updateCategoryState();

    // Add mouse event listeners for dropdown
    const dropdown = this.querySelector('.desktop-nav__dropdown');
    if (dropdown) {
      dropdown.addEventListener('mouseenter', this.handleDropdownMouseEnter);
      dropdown.addEventListener('mouseleave', this.handleDropdownMouseLeave);
    }
  }
}

// Register custom element
customElements.define('desktop-nav-dropdown', DesktopNavDropdown);

export default DesktopNavDropdown;
