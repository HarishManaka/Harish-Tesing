/**
 * Product Description Tabs Block
 * Processes HTML table description data and creates a tabbed interface
 */

/**
 * Parse HTML table string into key-value pairs
 * @param {string} tableHtml - HTML table string from API
 * @returns {Array} Array of {heading, content} objects
 */
function parseDescriptionTable(tableHtml) {
  if (!tableHtml || typeof tableHtml !== 'string') {
    return [];
  }

  try {
    // Create a temporary DOM element to parse the HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = tableHtml;

    const table = tempDiv.querySelector('table');
    if (!table) {
      return [];
    }

    // Only get direct child rows of the main table, not nested table rows
    const mainTableBody = table.querySelector('tbody');
    const rows = mainTableBody
      ? Array.from(mainTableBody.children).filter((child) => child.tagName === 'TR')
      : Array.from(table.children).filter((child) => child.tagName === 'TR');

    const data = [];

    rows.forEach((row) => {
      const cells = Array.from(row.children).filter((child) => child.tagName === 'TD');
      if (cells.length >= 2) {
        const heading = cells[0].textContent.trim();
        let content = cells[1].innerHTML.trim(); // Use innerHTML to preserve formatting

        // Check if the content contains a nested table
        const nestedTable = cells[1].querySelector('table');
        if (nestedTable) {
          // Parse the nested table into accordion data
          const nestedData = parseNestedTable(nestedTable);
          if (nestedData.length > 0) {
            content = {
              type: 'nested-accordion',
              data: nestedData,
            };

            // For rows with nested tables, create a tab with the product name
            // and render the nested table as accordions in the content
            if (heading && content) {
              data.push({ heading, content });
            }
          } else {
            // If no valid nested data found, fall back to regular content
            content = cells[1].innerHTML.trim();
            if (heading && content) {
              data.push({ heading, content });
            }
          }
        } else if (heading && content) {
          // No nested table - this is a regular row, add it as a tab
          data.push({ heading, content });
        }
      }
    });

    return data;
  } catch (error) {
    console.error('Error parsing description table:', error);
    return [];
  }
}

/**
 * Parse nested table into accordion data
 * @param {HTMLTableElement} table - Nested table element
 * @returns {Array} Array of accordion items
 */
function parseNestedTable(table) {
  const accordionData = [];
  // Handle both tbody > tr and direct tr patterns
  const rows = table.querySelectorAll('tbody > tr, tr');

  rows.forEach((row) => {
    // Filter for actual TD cells
    const cells = Array.from(row.children).filter((child) => child.tagName === 'TD');
    if (cells.length >= 2) {
      const title = cells[0].textContent.trim();
      const content = cells[1].innerHTML.trim();

      // Only add if both title and content exist and are not empty
      if (title && content) {
        accordionData.push({ title, content });
      }
    }
  });

  return accordionData;
}

/**
 * Create tab navigation
 * @param {Array} data - Parsed table data
 * @param {HTMLElement} container - Container element
 */
function createTabNavigation(data, container) {
  const tabNav = document.createElement('div');
  tabNav.className = 'tab-navigation';

  data.forEach((item, index) => {
    const tabButton = document.createElement('button');
    tabButton.className = `tab-button ${index === 0 ? 'active' : ''}`;
    tabButton.textContent = item.heading;
    tabButton.setAttribute('data-tab', index);
    tabButton.setAttribute('aria-expanded', index === 0 ? 'true' : 'false');
    tabButton.setAttribute('aria-controls', `tab-content-${index}`);

    tabButton.addEventListener('click', () => {
      // Check if we're in mobile/accordion mode
      const isMobile = window.matchMedia('(max-width: 768px)').matches;

      if (isMobile) {
        // Accordion behavior for mobile
        const wasActive = tabButton.classList.contains('active');

        // If clicking on an already active accordion, close it
        if (wasActive) {
          tabButton.classList.remove('active');
          tabButton.setAttribute('aria-expanded', 'false');
          container.querySelector(`[data-content="${index}"]`).classList.remove('active');
        } else {
          // Open the clicked accordion (allow multiple open)
          tabButton.classList.add('active');
          tabButton.setAttribute('aria-expanded', 'true');
          container.querySelector(`[data-content="${index}"]`).classList.add('active');
        }
      } else {
        // Tab behavior for desktop
        container.querySelectorAll('.tab-button').forEach((btn) => {
          btn.classList.remove('active');
          btn.setAttribute('aria-expanded', 'false');
        });
        container.querySelectorAll('.tab-content').forEach((content) => content.classList.remove('active'));

        // Add active class to clicked button and corresponding content
        tabButton.classList.add('active');
        tabButton.setAttribute('aria-expanded', 'true');
        container.querySelector(`[data-content="${index}"]`).classList.add('active');
      }
    });

    tabNav.appendChild(tabButton);
  });

  return tabNav;
}

/**
 * Create nested accordion for bundle products
 * @param {Array} accordionData - Nested accordion data
 * @returns {HTMLElement} Accordion element
 */
function createNestedAccordion(accordionData) {
  const accordion = document.createElement('div');
  accordion.className = 'nested-accordion';

  // Generate unique ID for this accordion instance
  const accordionId = `nested-accordion-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

  accordionData.forEach((item, index) => {
    const accordionItem = document.createElement('div');
    accordionItem.className = 'nested-accordion-item';

    const header = document.createElement('button');
    header.className = 'nested-accordion-header';
    header.setAttribute('aria-expanded', 'false');
    header.setAttribute('aria-controls', `${accordionId}-content-${index}`);

    const headerText = document.createElement('span');
    headerText.textContent = item.title;
    header.appendChild(headerText);

    const icon = document.createElement('span');
    icon.className = 'accordion-icon';
    header.appendChild(icon);

    const content = document.createElement('div');
    content.className = 'nested-accordion-content';
    content.setAttribute('id', `${accordionId}-content-${index}`);
    content.innerHTML = item.content;

    header.addEventListener('click', () => {
      const isExpanded = header.getAttribute('aria-expanded') === 'true';

      if (isExpanded) {
        header.setAttribute('aria-expanded', 'false');
        accordionItem.classList.remove('active');
      } else {
        header.setAttribute('aria-expanded', 'true');
        accordionItem.classList.add('active');
      }
    });

    accordionItem.appendChild(header);
    accordionItem.appendChild(content);
    accordion.appendChild(accordionItem);
  });

  return accordion;
}

/**
 * Create tab content area
 * @param {Array} data - Parsed table data
 */
function createTabContent(data) {
  const contentArea = document.createElement('div');
  contentArea.className = 'tab-content-area';

  data.forEach((item, index) => {
    const contentDiv = document.createElement('div');
    contentDiv.className = `tab-content ${index === 0 ? 'active' : ''}`;
    contentDiv.setAttribute('data-content', index);
    contentDiv.setAttribute('id', `tab-content-${index}`);

    // Create content wrapper with styled background
    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'content-wrapper';

    // Check if content is a nested accordion
    if (typeof item.content === 'object' && item.content.type === 'nested-accordion') {
      const nestedAccordion = createNestedAccordion(item.content.data);
      contentWrapper.appendChild(nestedAccordion);
    } else {
      contentWrapper.innerHTML = item.content;
    }

    contentDiv.appendChild(contentWrapper);
    contentArea.appendChild(contentDiv);
  });

  return contentArea;
}

/**
 * Create accordion structure for mobile
 * @param {Array} data - Parsed table data
 * @param {HTMLElement} container - Container element
 */
function createAccordionStructure(data, container) {
  const accordionContainer = document.createElement('div');
  accordionContainer.className = 'accordion-container';

  data.forEach((item, index) => {
    // Create accordion item
    const accordionItem = document.createElement('div');
    accordionItem.className = `accordion-item ${index === 0 ? 'active' : ''}`;

    // Create accordion header (button)
    const accordionHeader = document.createElement('button');
    accordionHeader.className = `accordion-header ${index === 0 ? 'active' : ''}`;
    accordionHeader.textContent = item.heading;
    accordionHeader.setAttribute('aria-expanded', index === 0 ? 'true' : 'false');
    accordionHeader.setAttribute('aria-controls', `accordion-content-${index}`);

    // Create accordion content
    const accordionContent = document.createElement('div');
    accordionContent.className = `accordion-content ${index === 0 ? 'active' : ''}`;
    accordionContent.setAttribute('id', `accordion-content-${index}`);

    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'content-wrapper';

    // Check if content is a nested accordion
    if (typeof item.content === 'object' && item.content.type === 'nested-accordion') {
      const nestedAccordion = createNestedAccordion(item.content.data);
      contentWrapper.appendChild(nestedAccordion);
    } else {
      contentWrapper.innerHTML = item.content;
    }

    accordionContent.appendChild(contentWrapper);

    // Add click handler
    accordionHeader.addEventListener('click', () => {
      const isActive = accordionItem.classList.contains('active');

      if (isActive) {
        // Close this accordion
        accordionItem.classList.remove('active');
        accordionHeader.classList.remove('active');
        accordionContent.classList.remove('active');
        accordionHeader.setAttribute('aria-expanded', 'false');
      } else {
        // Close all other accordions (optional - remove for multiple open)
        accordionContainer.querySelectorAll('.accordion-item').forEach((otherAccordionItem) => {
          otherAccordionItem.classList.remove('active');
          otherAccordionItem.querySelector('.accordion-header').classList.remove('active');
          otherAccordionItem.querySelector('.accordion-content').classList.remove('active');
          otherAccordionItem.querySelector('.accordion-header').setAttribute('aria-expanded', 'false');
        });

        // Open this accordion
        accordionItem.classList.add('active');
        accordionHeader.classList.add('active');
        accordionContent.classList.add('active');
        accordionHeader.setAttribute('aria-expanded', 'true');
      }
    });

    // Append elements
    accordionItem.appendChild(accordionHeader);
    accordionItem.appendChild(accordionContent);
    accordionContainer.appendChild(accordionItem);
  });

  container.appendChild(accordionContainer);
}

/**
 * Main block decorator function
 * @param {HTMLElement} block - The block element
 */
export default function decorate(block) {
  // Get the HTML table content from the block
  const tableHtml = block.innerHTML;

  // Clear the block
  block.innerHTML = '';

  // Parse the table data
  const data = parseDescriptionTable(tableHtml);

  if (data.length === 0) {
    block.innerHTML = '<p>No course details available.</p>';
    return;
  }

  // Create the main container
  const container = document.createElement('div');
  container.className = 'product-description-container';

  // Check if this block is being used in product context
  const productBlock = block.closest('.product-description-tabs[data-product-context]');
  const isSubscriptionProduct = productBlock?.dataset.productType === 'subscription';

  // Add the title - show "MEMBERSHIP DETAILS" for subscription products
  const title = document.createElement('h2');
  title.className = 'section-title';
  title.textContent = isSubscriptionProduct ? 'MEMBERSHIP DETAILS' : 'COURSE DETAILS';
  container.appendChild(title);

  // Create the tabbed interface
  const tabbedInterface = document.createElement('div');
  tabbedInterface.className = 'tabbed-interface';

  // Check if we should create accordion structure for mobile
  const isMobile = window.matchMedia('(max-width: 768px)').matches;

  if (isMobile) {
    // Create accordion structure for mobile
    createAccordionStructure(data, tabbedInterface);
  } else {
    // Create tab structure for desktop
    const navigation = createTabNavigation(data, container);
    const content = createTabContent(data);
    tabbedInterface.appendChild(navigation);
    tabbedInterface.appendChild(content);
  }

  container.appendChild(tabbedInterface);

  // Add resize listener to switch between layouts
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      const currentlyMobile = window.matchMedia('(max-width: 768px)').matches;
      if (currentlyMobile !== isMobile) {
        // Recreate the interface when switching between mobile and desktop
        window.location.reload();
      }
    }, 250);
  });

  // Append to block
  block.appendChild(container);
}
