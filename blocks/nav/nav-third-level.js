/**
 * Creates a square item element (product card) with optional URL
 * @param {Object} squareItem - The square item data
 * @returns {HTMLElement} The square item element (anchor or div)
 */
function createSquareItemElement(squareItem) {
  // Use anchor if URL exists, otherwise use div
  const element = squareItem.url ? 'a' : 'div';
  const squareContainer = document.createElement(element);
  squareContainer.className = 'third-level-courses__product-card';

  if (squareItem.url) {
    squareContainer.href = squareItem.url;
  }

  // Add title
  if (squareItem.title) {
    const titleElement = document.createElement('h3');
    titleElement.className = 'third-level-courses__product-title';
    titleElement.textContent = squareItem.title;
    squareContainer.appendChild(titleElement);
  }

  // Add description (handle both element and text)
  if (squareItem.description) {
    const descriptionElement = document.createElement('div');
    descriptionElement.className = 'third-level-courses__product-description';

    if (squareItem.description.outerHTML) {
      descriptionElement.innerHTML = squareItem.description.outerHTML;
    } else if (squareItem.description.textContent) {
      descriptionElement.textContent = squareItem.description.textContent;
    } else {
      descriptionElement.textContent = String(squareItem.description);
    }

    squareContainer.appendChild(descriptionElement);
  }

  // Add footer
  if (squareItem.footer) {
    const footerElement = document.createElement('div');
    footerElement.className = 'third-level-courses__product-footer';
    footerElement.textContent = squareItem.footer;
    squareContainer.appendChild(footerElement);
  }

  return squareContainer;
}

class NavThirdLevel extends HTMLElement {
  constructor() {
    super();
    this.handleBack = this.handleBack.bind(this);
    this.handleClose = this.handleClose.bind(this);
  }

  set data(val) {
    this.dataState = val;
    this.render();
  }

  get data() {
    return this.dataState;
  }

  set breadcrumbs(val) {
    this.breadcrumbsState = val;
    this.render();
  }

  get breadcrumbs() {
    return this.breadcrumbsState || [];
  }

  handleBack() {
    const currentCategory = this.breadcrumbs.length > 0
      ? this.breadcrumbs[this.breadcrumbs.length - 1]
      : null;
    const fromCategory = currentCategory ? currentCategory.id : 'unknown';
    const toCategory = this.breadcrumbs.length > 1
      ? this.breadcrumbs[this.breadcrumbs.length - 2].id
      : 'get-certified';

    // Dispatch back navigation event
    this.dispatchEvent(
      new CustomEvent('nav-third-level-back', {
        bubbles: true,
        detail: { from: fromCategory, to: toCategory, level: 2 },
      }),
    );
  }

  handleClose() {
    // Find the nav-mobile-header element
    const mobileHeader = document.querySelector('nav-mobile-header');
    if (mobileHeader) {
      // Update to level 2 and close
      mobileHeader.setAttribute('level', '2');
      mobileHeader.setAttribute('open', 'false');
    }

    // Also dispatch the toggle-nav event to update nav-root
    this.dispatchEvent(
      new CustomEvent('toggle-nav', {
        bubbles: true,
        detail: { open: false },
      }),
    );
  }

  render() {
    if (!this.dataState) return;

    // Clear existing content
    this.innerHTML = '';

    // Create main container
    const mainContainer = document.createElement('div');
    mainContainer.className = 'third-level-courses';

    // Create navigation header
    const currentCategory = this.breadcrumbs.length > 0
      ? this.breadcrumbs[this.breadcrumbs.length - 1]
      : null;
    const categoryTitle = currentCategory?.title || 'Navigation';

    const headerDiv = document.createElement('div');
    headerDiv.className = 'third-level-courses__header';
    headerDiv.innerHTML = `
      <button class="third-level-courses__back-btn" aria-label="Go back">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="15,18 9,12 15,6"></polyline>
        </svg>
        ${categoryTitle}
      </button>
      <button class="mobile-nav__toggle third-level-courses__close-btn" aria-label="Close navigation">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    `;
    mainContainer.appendChild(headerDiv);

    // Check if data has thirdLevelData structure (from extracted HTML)
    if (this.dataState.thirdLevelData && this.dataState.thirdLevelData.items) {
      const { items } = this.dataState.thirdLevelData;

      // Group consecutive items and render in order (similar to desktop nav approach)
      let i = 0;
      while (i < items.length) {
        const item = items[i];

        if (item.isSquare === false) {
          // Handle header/non-square elements
          if (item.element) {
            const sectionDiv = document.createElement('div');
            sectionDiv.className = 'third-level-courses__section';

            const sectionHeaderDiv = document.createElement('div');
            sectionHeaderDiv.className = 'third-level-courses__section-header';
            sectionHeaderDiv.innerHTML = item.element.outerHTML || item.element.textContent || '';

            sectionDiv.appendChild(sectionHeaderDiv);
            mainContainer.appendChild(sectionDiv);
          }
          i += 1;
        } else if (item.isSquare === true) {
          // Group consecutive square items
          const squareItems = [];
          let j = i;

          // Collect all consecutive square items
          while (j < items.length && items[j].isSquare === true) {
            squareItems.push(items[j]);
            j += 1;
          }

          // Create section for square items
          const sectionDiv = document.createElement('div');
          sectionDiv.className = 'third-level-courses__section';

          // Create product grid
          const gridDiv = document.createElement('div');
          gridDiv.className = 'third-level-courses__product-grid';

          // Create each square item using the standalone function
          squareItems.forEach((squareItem) => {
            const squareElement = createSquareItemElement(squareItem);
            gridDiv.appendChild(squareElement);
          });

          sectionDiv.appendChild(gridDiv);
          mainContainer.appendChild(sectionDiv);

          // Move index to after all the square items
          i = j;
        } else if (item.isTD === true) {
          // Group consecutive TD (title-description) items
          const tdItems = [];
          let k = i;

          // Collect all consecutive TD items
          while (k < items.length && items[k].isTD === true) {
            tdItems.push(items[k]);
            k += 1;
          }

          // Create section for TD items
          const sectionDiv = document.createElement('div');
          sectionDiv.className = 'third-level-courses__section';

          // Create TD grid
          const tdGridDiv = document.createElement('div');
          tdGridDiv.className = 'third-level-courses__td-grid';

          // Create each TD item
          tdItems.forEach((tdItem) => {
            const tdItemDiv = document.createElement('div');
            tdItemDiv.className = 'third-level-courses__td-item';

            // Add title (wrapped in anchor if URL exists)
            if (tdItem.title) {
              if (tdItem.url) {
                const linkElement = document.createElement('a');
                linkElement.href = tdItem.url;
                linkElement.className = 'third-level-courses__td-link';

                const titleElement = document.createElement('h3');
                titleElement.className = 'third-level-courses__td-title';
                titleElement.textContent = tdItem.title;

                linkElement.appendChild(titleElement);
                tdItemDiv.appendChild(linkElement);
              } else {
                const titleElement = document.createElement('h3');
                titleElement.className = 'third-level-courses__td-title';
                titleElement.textContent = tdItem.title;
                tdItemDiv.appendChild(titleElement);
              }
            }

            // Add description
            if (tdItem.description) {
              const descriptionDiv = document.createElement('div');
              descriptionDiv.className = 'third-level-courses__td-description';
              descriptionDiv.textContent = tdItem.description;
              tdItemDiv.appendChild(descriptionDiv);
            }

            tdGridDiv.appendChild(tdItemDiv);
          });

          sectionDiv.appendChild(tdGridDiv);
          mainContainer.appendChild(sectionDiv);

          // Move index to after all the TD items
          i = k;
        } else {
          // Skip unknown item types
          i += 1;
        }
      }
    } else {
      // If no thirdLevelData is available, show a message or empty state
      const sectionDiv = document.createElement('div');
      sectionDiv.className = 'third-level-courses__section';

      const sectionHeaderDiv = document.createElement('div');
      sectionHeaderDiv.className = 'third-level-courses__section-header';

      const message = document.createElement('p');
      message.textContent = 'No third-level content available. Data must be extracted from HTML structure.';

      sectionHeaderDiv.appendChild(message);
      sectionDiv.appendChild(sectionHeaderDiv);
      mainContainer.appendChild(sectionDiv);
    }

    // Append main container to component
    this.appendChild(mainContainer);

    // Add event listeners for header actions
    const backButton = this.querySelector('.third-level-courses__back-btn');
    if (backButton) {
      backButton.addEventListener('click', this.handleBack);
    }
    const closeButton = this.querySelector('.third-level-courses__close-btn');
    if (closeButton) {
      closeButton.addEventListener('click', this.handleClose);
    }
  }
}
customElements.define('nav-third-level', NavThirdLevel);
