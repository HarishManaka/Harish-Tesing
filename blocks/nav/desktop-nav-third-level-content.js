/**
 * Desktop Navigation Third Level Content Component
 * HTML-based third-level content rendering
 */

import { getThirdLevelContentData } from './nav-data-extractor.js';

class DesktopNavThirdLevelContent extends HTMLElement {
  constructor() {
    super();
    this.categoryId = null;
    this.rootId = null;
    this.allElements = [];
  }

  static get observedAttributes() {
    return ['root-id', 'category-id'];
  }

  async attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'category-id' && newValue !== oldValue) {
      this.categoryId = newValue;
      this.loadData();
      this.render();
    }
    if (name === 'root-id' && newValue !== oldValue) {
      this.rootId = newValue || 'get-certified';
      this.loadData();
      this.render();
    }
  }

  async connectedCallback() {
    this.categoryId = this.getAttribute('category-id');
    this.rootId = this.getAttribute('root-id');
    this.loadData();
    this.render();
  }

  loadData() {
    this.allElements = getThirdLevelContentData(this.rootId, this.categoryId);
  }

  render() {
    // Clear existing content
    this.innerHTML = '';

    if (this.allElements.length === 0) {
      return;
    }

    // Create a container for the third-level content
    const container = document.createElement('div');
    container.className = 'desktop-nav__third-level-content';

    // Group consecutive items and render in order
    let i = 0;
    while (i < this.allElements.length) {
      const item = this.allElements[i];

      try {
        if (item.isSquare === false) {
          // Handle header/non-square elements - clone the actual element
          if (item.element) {
            const clonedElement = item.element.cloneNode(true);

            // Add CSS class for navigation styling
            clonedElement.className = `${
              clonedElement.className || ''
            } desktop-nav__header-element`;

            container.appendChild(clonedElement);
          }
          i += 1;
        } else if (item.isSquare === true) {
          // Group consecutive square items
          const squareItems = [];
          let j = i;

          // Collect all consecutive square items
          while (
            j < this.allElements.length
            && this.allElements[j].isSquare === true
          ) {
            squareItems.push(this.allElements[j]);
            j += 1;
          }

          // Create grid container for square items (static 4-column grid)
          const gridContainer = document.createElement('div');
          gridContainer.className = 'desktop-nav__squares-grid';

          // Create each square item
          squareItems.forEach((squareItem) => {
            const element = squareItem.url ? 'a' : 'div';
            const squareContainer = document.createElement(element);
            squareContainer.className = 'desktop-nav__square-item';

            if (squareItem.url) {
              squareContainer.href = squareItem.url;
            }

            // Add title
            if (squareItem.title) {
              const titleElement = document.createElement('h4');
              titleElement.className = 'desktop-nav__square-title';
              titleElement.textContent = squareItem.title;
              squareContainer.appendChild(titleElement);
            }

            // Add description (clone the actual element if it exists)
            if (squareItem.description) {
              const descriptionElement = squareItem.description.cloneNode
                ? squareItem.description.cloneNode(true)
                : document.createElement('div');

              if (!squareItem.description.cloneNode) {
                descriptionElement.textContent = String(squareItem.description);
              }

              descriptionElement.className = `${
                descriptionElement.className || ''
              } desktop-nav__square-description`;
              squareContainer.appendChild(descriptionElement);
            }

            // Add footer
            if (squareItem.footer) {
              const footerElement = document.createElement('div');
              footerElement.className = 'desktop-nav__square-footer';
              footerElement.textContent = squareItem.footer;
              squareContainer.appendChild(footerElement);
            }

            gridContainer.appendChild(squareContainer);
          });

          container.appendChild(gridContainer);

          // Move index to after all the square items
          i = j;
        } else if (item.isTD === true) {
          // Group consecutive TD (title-description) items
          const tdItems = [];
          let k = i;

          // Collect all consecutive TD items
          while (
            k < this.allElements.length
            && this.allElements[k].isTD === true
          ) {
            tdItems.push(this.allElements[k]);
            k += 1;
          }

          // Create grid container for TD items
          const tdGridContainer = document.createElement('div');
          tdGridContainer.className = 'desktop-nav__td-grid';

          // Create each TD item
          tdItems.forEach((tdItem) => {
            const tdContainer = document.createElement('div');
            tdContainer.className = 'desktop-nav__td-item';

            // Add title (wrapped in anchor if URL exists)
            if (tdItem.title) {
              if (tdItem.url) {
                // Create anchor wrapper for the title
                const linkElement = document.createElement('a');
                linkElement.href = tdItem.url;
                linkElement.className = 'desktop-nav__td-link';

                const titleElement = document.createElement('h4');
                titleElement.className = 'desktop-nav__td-title';
                titleElement.textContent = tdItem.title;

                linkElement.appendChild(titleElement);
                tdContainer.appendChild(linkElement);
              } else {
                // No URL, just add the title
                const titleElement = document.createElement('h4');
                titleElement.className = 'desktop-nav__td-title';
                titleElement.textContent = tdItem.title;
                tdContainer.appendChild(titleElement);
              }
            }

            // Add description
            if (tdItem.description) {
              const descriptionElement = document.createElement('div');
              descriptionElement.className = 'desktop-nav__td-description';
              descriptionElement.textContent = tdItem.description;
              tdContainer.appendChild(descriptionElement);
            }

            tdGridContainer.appendChild(tdContainer);
          });

          container.appendChild(tdGridContainer);

          // Move index to after all the TD items
          i = k;
        } else {
          // Skip unknown item types
          i += 1;
        }
      } catch (error) {
        console.warn('Error rendering third level content item:', error);
        i += 1;
      }
    }

    this.appendChild(container);
  }
}

// Register custom element
customElements.define(
  'desktop-nav-third-level-content',
  DesktopNavThirdLevelContent,
);

export default DesktopNavThirdLevelContent;
