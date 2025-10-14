/**
 * Builds the filter title section
 * @param {string} title - Filter title text
 * @returns {HTMLElement|null} - Filter title element or null if no title
 */
function buildFilterTitle(title) {
  if (!title) return null;

  const titleDiv = document.createElement('div');
  titleDiv.className = 'filter-section-cards-filter-title';
  const h2 = document.createElement('h2');
  h2.textContent = title;
  titleDiv.appendChild(h2);

  return titleDiv;
}

/**
 * Builds the header section of the filter-section-cards block
 * @param {Object} data - Header data containing title, description, ctaLabel, ctaUrl
 * @returns {HTMLElement} - Header section element
 */
function buildHeader(data) {
  const section = document.createElement('div');
  section.className = 'filter-section-cards-header';

  if (data.title) {
    const h2 = document.createElement('h2');
    h2.textContent = data.title;
    section.appendChild(h2);
  }

  if (data.description) {
    const p = document.createElement('p');
    p.textContent = data.description;
    section.appendChild(p);
  }

  if (data.ctaUrl && data.ctaLabel) {
    const a = document.createElement('a');
    a.href = data.ctaUrl;
    a.textContent = data.ctaLabel;
    a.className = 'filter-section-cards-cta button primary';
    section.appendChild(a);
  }

  return section;
}

/**
 * Builds a card element with image, content, and meta information
 * @param {Object} data - Card data containing title, description, ctaLabel, ctaUrl, tag, imageSrc
 * @returns {HTMLElement} - Card element
 */
function buildCard(data) {
  const card = document.createElement('div');
  card.className = 'filter-section-cards-item';

  // Add data attributes for filtering
  if (data.tag) {
    card.dataset.tags = data.tag;
  }

  // Image container
  const imageContainer = document.createElement('div');
  imageContainer.className = 'filter-section-cards-item-img';
  const img = document.createElement('img');
  // Use provided image src or fall back to placeholder
  img.src = data.imageSrc || 'https://via.placeholder.com/400x200?text=Placeholder+Image';
  img.alt = data.title || 'Card image';
  imageContainer.appendChild(img);
  card.appendChild(imageContainer);

  // Content container
  const content = document.createElement('div');
  content.className = 'filter-section-cards-item-content';

  if (data.title) {
    const h3 = document.createElement('h3');
    h3.textContent = data.title;
    content.appendChild(h3);
  }

  if (data.description) {
    const p = document.createElement('p');
    p.textContent = data.description;
    content.appendChild(p);
  }

  // Meta section (CTA + Tag as badge)
  const meta = document.createElement('div');
  meta.className = 'filter-section-cards-item-meta';

  if (data.ctaUrl && data.ctaLabel) {
    const cta = document.createElement('a');
    cta.href = data.ctaUrl;
    cta.textContent = data.ctaLabel;
    cta.className = 'filter-section-cards-link';
    meta.appendChild(cta);
  }

  if (data.tag) {
    const badge = document.createElement('span');
    badge.className = 'filter-section-cards-badge';
    badge.textContent = data.tag;
    meta.appendChild(badge);
  }

  content.appendChild(meta);
  card.appendChild(content);

  return card;
}

/**
 * Extracts text content from a cell, handling both plain text and links
 * @param {HTMLElement} cell - The cell element to extract text from
 * @returns {string} - The extracted text content
 */
function getCellText(cell) {
  if (!cell) return '';
  return cell.textContent.trim();
}

/**
 * Extracts URL from a cell that might contain a link
 * @param {HTMLElement} cell - The cell element to extract URL from
 * @returns {string} - The extracted URL or empty string
 */
function getCellUrl(cell) {
  if (!cell) return '';
  const link = cell.querySelector('a');
  return link ? link.href : '';
}

/**
 * Extracts image source from a cell that contains a picture/img element
 * @param {HTMLElement} cell - The cell element to extract image from
 * @returns {string} - The extracted image src or empty string
 */
function getCellImage(cell) {
  if (!cell) return '';
  const img = cell.querySelector('img');
  return img ? img.src : '';
}

/**
 * Builds the complete container with filter title, header and cards
 * @param {string} filterTitle - Filter title text
 * @param {Object} header - Header data
 * @param {Object} card1 - Card 1 data
 * @param {Object} card2 - Card 2 data
 * @returns {HTMLElement} - Complete container element
 */
function buildContainer(filterTitle, header, card1, card2) {
  const wrapper = document.createElement('div');
  wrapper.className = 'filter-section-cards-wrapper';

  // Build filter title section if provided
  const filterTitleElement = buildFilterTitle(filterTitle);
  if (filterTitleElement) {
    wrapper.appendChild(filterTitleElement);
  }

  // Build header section
  const headerSection = buildHeader(header);
  wrapper.appendChild(headerSection);

  // Build card 1
  if (card1.title) {
    const card1Element = buildCard(card1);
    wrapper.appendChild(card1Element);
  }

  // Build card 2
  if (card2.title) {
    const card2Element = buildCard(card2);
    wrapper.appendChild(card2Element);
  }

  return wrapper;
}

/**
 * Decorates the filter-section-cards block by extracting data from the
 * instrumented HTML structure and appending a new rendered structure at the end.
 *
 * IMPORTANT: This decorator preserves the original instrumented HTML (with data-aue-* attributes)
 * for AEM Universal Editor functionality, and appends the transformed structure for display.
 *
 * The original rows with data-aue-* attributes are hidden but kept in the DOM so that:
 * - AEM Universal Editor can find and edit the content
 * - Content authors see the editing interface
 * - End users see the transformed, styled version
 *
 * @param {HTMLElement} block - The block element to decorate
 */
export default function decorate(block) {
  // Extract all rows from the block
  const rows = Array.from(block.children);

  // Check if we have at least 2 rows (filter title + item data)
  if (rows.length < 2) {
    console.warn('filter-section-cards: Expected at least 2 rows (filter title + item)');
    return;
  }

  // First row contains only the filter title
  const filterTitleRow = rows[0];
  const filterTitleCell = filterTitleRow.children[0];
  const filterTitle = getCellText(filterTitleCell);

  // Second row contains all item fields as flat siblings
  const itemRow = rows[1];
  const cells = Array.from(itemRow.children);

  // Based on updated structure with images:
  // Cell 0: header-title
  // Cell 1: header-description
  // Cell 2: header-label
  // Cell 3: header-url (link)
  // Cell 4: tag (shared tag for all cards)
  // Cell 5: card1-title
  // Cell 6: card1-description
  // Cell 7: card1-label
  // Cell 8: card1-url (link)
  // Cell 9: card1-image (picture/img)
  // Cell 10: card2-title
  // Cell 11: card2-description
  // Cell 12: card2-label
  // Cell 13: card2-url (link)
  // Cell 14: card2-image (picture/img)

  // Parse header data from cells 0-3
  const headerData = {
    title: getCellText(cells[0]),
    description: getCellText(cells[1]),
    ctaLabel: getCellText(cells[2]),
    ctaUrl: getCellUrl(cells[3]),
  };

  // Get shared tag from cell 4
  const sharedTag = getCellText(cells[4]);

  // Parse card1 data from cells 5-9
  const card1Data = {
    title: getCellText(cells[5]),
    description: getCellText(cells[6]),
    ctaLabel: getCellText(cells[7]),
    ctaUrl: getCellUrl(cells[8]),
    imageSrc: getCellImage(cells[9]), // Extract card1 image
    tag: sharedTag, // Use the shared tag
  };

  // Parse card2 data from cells 10-14
  const card2Data = {
    title: getCellText(cells[10]),
    description: getCellText(cells[11]),
    ctaLabel: getCellText(cells[12]),
    ctaUrl: getCellUrl(cells[13]),
    imageSrc: getCellImage(cells[14]), // Extract card2 image
    tag: sharedTag, // Use the shared tag
  };

  // Build new structured container
  const container = buildContainer(filterTitle, headerData, card1Data, card2Data);

  // IMPORTANT: Hide the original instrumented rows (keep for AEM editor)
  // but don't remove them - AEM needs them for editing
  rows.forEach((row) => {
    row.style.display = 'none';
    row.setAttribute('data-aem-original', 'true');
  });

  // Append the new rendered structure after the original rows
  block.appendChild(container);
}
