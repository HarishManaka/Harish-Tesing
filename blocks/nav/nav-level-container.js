import { getMobileNavigationData } from './nav-data-extractor.js';

class NavLevelContainer extends HTMLElement {
  constructor() {
    super();
    this.level = 1;
    this.breadcrumbs = [];
    this.navigate = this.navigate.bind(this);
    this.back = this.back.bind(this);
    this.handleThirdLevelBack = this.handleThirdLevelBack.bind(this);
  }

  async connectedCallback() {
    // Wait for navigation data to be extracted and ready
    this.waitForNavigationData();
  }

  waitForNavigationData() {
    const navigationData = getMobileNavigationData();
    if (navigationData && navigationData.length > 0) {
      this.data = navigationData;
      this.render();
      this.addEventListener('nav-third-level-back', this.handleThirdLevelBack);
      this.updateHeaderLevel();
    } else {
      // Check again in 50ms
      setTimeout(() => this.waitForNavigationData(), 50);
    }
  }

  handleThirdLevelBack(_e) {
    // Handle back navigation from third level
    this.back();
  }

  updateHeaderLevel() {
    // Find the mobile header and update its level attribute
    const mobileHeader = this.closest('nav-root')?.querySelector('nav-mobile-header');
    if (mobileHeader) {
      mobileHeader.setAttribute('level', this.level);
    }
  }

  navigate(item) {
    if (item.children && Array.isArray(item.children) && item.children.length > 0) {
      // Navigate to second level (children array)
      this.breadcrumbs.push(item);
      this.data = item.children;
      this.level += 1;
      this.render();
      this.updateHeaderLevel();
      this.dispatchEvent(
        new CustomEvent('nav-forward', {
          bubbles: true,
          detail: { to: item.id, level: this.level },
        }),
      );
    } else if (item.hasThirdLevel && item.thirdLevelData) {
      // Navigate to third level (thirdLevelData object)
      this.breadcrumbs.push(item);
      this.data = item; // Pass the entire item so third-level can access thirdLevelData
      this.level += 1;
      this.render();
      this.updateHeaderLevel();
      this.dispatchEvent(
        new CustomEvent('nav-forward', {
          bubbles: true,
          detail: { to: item.id, level: this.level },
        }),
      );
    } else if (item.url) {
      window.location.href = item.url;
    }
  }

  back() {
    if (this.breadcrumbs.length > 0) {
      this.breadcrumbs.pop();
      let parent;
      if (this.breadcrumbs.length === 0) {
        parent = getMobileNavigationData();
      } else {
        const parentItem = this.breadcrumbs[this.breadcrumbs.length - 1];
        parent = parentItem.children || getMobileNavigationData();
      }
      this.data = parent;
      this.level -= 1;
      this.render();
      this.updateHeaderLevel();
      this.dispatchEvent(
        new CustomEvent('nav-back', {
          bubbles: true,
          detail: { level: this.level },
        }),
      );
    }
  }

  render() {
    if (Array.isArray(this.data)) {
      // Level 1 or 2 list
      const parentCrumb = this.breadcrumbs.length > 0
        ? this.breadcrumbs[this.breadcrumbs.length - 1]
        : null;
      const parentTitle = parentCrumb?.title || '';
      const backButton = this.level > 1
        ? `<div class="multi-nav__back">
             <button class="multi-nav__back-btn" aria-label="Go to ${parentTitle || 'previous level'}" onclick="this.closest('nav-level-container').back()">
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                 <polyline points="15,18 9,12 15,6"></polyline>
               </svg>
               ${parentTitle || 'Back'}
             </button>
           </div>`
        : '';

      const itemsList = this.data
        .map((item) => {
          const hasChildren = (item.children
            && (Array.isArray(item.children)
              ? item.children.length > 0
              : Object.keys(item.children).length > 0))
            || item.hasThirdLevel;
          const highlightClass = item.highlight
            ? ' multi-nav__item--highlight'
            : '';
          return `
            <li class="multi-nav__item${highlightClass}">
              <button class="multi-nav__link" data-has-children="${hasChildren}">
                <span class="multi-nav__text">${item.title}</span>
                ${
  hasChildren
    ? '<svg class="multi-nav__arrow" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9,18 15,12 9,6"></polyline></svg>'
    : ''
}
              </button>
            </li>
          `;
        })
        .join('');

      this.innerHTML = `
        ${backButton}
        <ul class="multi-nav__list">
          ${itemsList}
        </ul>
      `;

      this.querySelectorAll('.multi-nav__link').forEach((btn, idx) => btn.addEventListener('click', () => this.navigate(this.data[idx])));
    } else {
      // Object means third level
      this.innerHTML = '<nav-third-level></nav-third-level>';
      const thirdLevelElement = this.querySelector('nav-third-level');
      thirdLevelElement.data = this.data;
      thirdLevelElement.breadcrumbs = this.breadcrumbs;
    }
  }
}
customElements.define('nav-level-container', NavLevelContainer);
