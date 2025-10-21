/* eslint-disable no-console */
/**
 * filter-section-cards.js
 * - Exports default `decorate(block)` which will:
 *   1. Read AEM rows/cells (instrumented)
 *   2. Build a styled structure (cards + sidebar filter) at runtime
 *   3. Preserve AUE instrumentation via moveInstrumentation import
 *
 * Usage:
 *   import decorate from './filter-section-cards.js';
 *   decorate(blockElement);
 *
 * Note: moveInstrumentation is an external helper that you already used.
 */
import { moveInstrumentation } from '../../scripts/scripts.js';

/* --------------------------
   Utility helpers
   -------------------------- */
function getCellText(cell) {
  if (!cell) return '';
  return cell.textContent.trim();
}

function getCellUrl(cell) {
  if (!cell) return '';
  const link = cell.querySelector('a');
  return link ? link.href : '';
}

function getCellImage(cell) {
  if (!cell) return '';
  const img = cell.querySelector('img');
  return img ? img.src : '';
}

function normalizeTag(tag = '') {
  return tag.toLowerCase().replace(/\s+/g, '-').trim();
}

/* --------------------------
   Build pieces
   -------------------------- */
function buildFilterTitle(title) {
  if (!title) return null;
  const titleDiv = document.createElement('div');
  titleDiv.className = 'filter-section-cards-filter-title';
  const h2 = document.createElement('h2');
  h2.textContent = title;
  titleDiv.appendChild(h2);
  return titleDiv;
}

function buildHeader(data = {}, cells = {}) {
  const section = document.createElement('div');
  section.className = 'filter-section-cards-header';

  if (data.title) {
    const h2 = document.createElement('h2');
    h2.textContent = data.title;
    if (cells.titleCell) {
      const original = cells.titleCell.querySelector('[data-aue-prop]');
      if (original) moveInstrumentation(original, h2);
    }
    section.appendChild(h2);
  }

  if (data.description) {
    const p = document.createElement('p');
    p.textContent = data.description;
    if (cells.descriptionCell) {
      const original = cells.descriptionCell.querySelector('[data-aue-prop]');
      if (original) moveInstrumentation(original, p);
    }
    section.appendChild(p);
  }

  if (data.ctaUrl && data.ctaLabel) {
    const a = document.createElement('a');
    a.href = data.ctaUrl;
    a.textContent = data.ctaLabel;
    a.className = 'filter-section-cards-cta';
    if (cells.labelCell) {
      const original = cells.labelCell.querySelector('[data-aue-prop]');
      if (original) moveInstrumentation(original, a);
    }
    section.appendChild(a);
  }

  return section;
}

/**
 * Builds a single card wrapped by a link. Adds unique id at card level.
 */
function buildCard(data = {}, cells = {}, sharedTagCell = null) {
  const cardLink = document.createElement('a');
  cardLink.href = data.ctaUrl || '#';
  cardLink.className = 'filter-section-cards-item-link';
  cardLink.target = '_blank';
  cardLink.rel = 'noopener noreferrer';

  const card = document.createElement('div');
  card.className = 'filter-section-cards-item';

  // Add unique card-level ID based on tag + title (for deep-linking)
  if (data.tag && data.title) {
    const safeTag = normalizeTag(data.tag);
    const safeTitle = data.title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').trim();
    card.id = `${safeTag}-${safeTitle}`;
  }

  if (data.tag) {
    card.dataset.tags = data.tag;
  }

  // Image container
  const imageContainer = document.createElement('div');
  imageContainer.className = 'filter-section-cards-item-img';
  const img = document.createElement('img');
  img.src = data.imageSrc || 'https://via.placeholder.com/400x200?text=Placeholder+Image';
  img.alt = data.title || 'Card image';
  if (cells.imageCell) {
    const originalImg = cells.imageCell.querySelector('img[data-aue-prop]');
    if (originalImg) moveInstrumentation(originalImg, img);
  }
  imageContainer.appendChild(img);
  card.appendChild(imageContainer);

  // Content
  const content = document.createElement('div');
  content.className = 'filter-section-cards-item-content';

  if (data.title) {
    const h3 = document.createElement('h3');
    h3.textContent = data.title;
    if (cells.titleCell) {
      const original = cells.titleCell.querySelector('[data-aue-prop]');
      if (original) moveInstrumentation(original, h3);
    }
    content.appendChild(h3);
  }

  if (data.description) {
    const p = document.createElement('p');
    p.textContent = data.description;
    if (cells.descriptionCell) {
      const original = cells.descriptionCell.querySelector('[data-aue-prop]');
      if (original) moveInstrumentation(original, p);
    }
    content.appendChild(p);
  }

  // Meta row
  const meta = document.createElement('div');
  meta.className = 'filter-section-cards-item-meta';

  if (data.ctaLabel) {
    const ctaText = document.createElement('span');
    ctaText.className = 'filter-section-cards-link';
    ctaText.textContent = data.ctaLabel;
    if (cells.labelCell) {
      const original = cells.labelCell.querySelector('[data-aue-prop]');
      if (original) moveInstrumentation(original, ctaText);
    }
    meta.appendChild(ctaText);
  }

  if (data.badgeOverride || data.tag) {
    const badge = document.createElement('span');
    badge.className = 'filter-section-cards-badge';
    badge.textContent = data.badgeOverride || data.tag;

    // preserve instrumentation from badge cell or shared tag
    if (data.badgeOverride && cells.badgeCell) {
      const original = cells.badgeCell.querySelector('[data-aue-prop]');
      if (original) moveInstrumentation(original, badge);
    } else if (!data.badgeOverride && sharedTagCell) {
      const originalTag = sharedTagCell.querySelector('[data-aue-prop]');
      if (originalTag) {
        [...originalTag.attributes]
          .filter((a) => a.name.startsWith('data-aue-') || a.name.startsWith('data-richtext-'))
          .forEach((attr) => badge.setAttribute(attr.name, attr.value));
      }
    }
    meta.appendChild(badge);
  }

  content.appendChild(meta);
  card.appendChild(content);
  cardLink.appendChild(card);

  return cardLink;
}

/**
 * Build a single container (one section) that may include 1-3 cards.
 * Important: NO id is added to the wrapper level (per your request).
 */
function buildContainer(filterTitle, header, card1, card2, card3, originalCells = {}) {
  const wrapper = document.createElement('div');
  wrapper.className = 'filter-section-cards-wrapper';

  // keep data-tag for the section but DO NOT set wrapper id
  const tag = card1.tag || card2.tag || (card3 && card3.tag);
  if (tag) wrapper.dataset.tag = tag;

  // add internal header and title
  const filterTitleElement = buildFilterTitle(filterTitle);
  if (filterTitleElement) wrapper.appendChild(filterTitleElement);

  const headerSection = buildHeader(header, originalCells.header || {});
  wrapper.appendChild(headerSection);

  // create a row container to lay out cards inside this wrapper
  const cardsRow = document.createElement('div');
  cardsRow.className = 'cards-row';

  if (card1 && card1.title) cardsRow.appendChild(buildCard(card1, originalCells.card1 || {}, originalCells.tagCell));
  if (card2 && card2.title) cardsRow.appendChild(buildCard(card2, originalCells.card2 || {}, originalCells.tagCell));
  if (card3 && card3.title) cardsRow.appendChild(buildCard(card3, originalCells.card3 || {}, originalCells.tagCell));

  wrapper.appendChild(cardsRow);

  // If 3 cards, add attribute to help styling if needed
  const cardCount = [card1 && card1.title, card2 && card2.title, card3 && card3.title].filter(Boolean).length;
  if (cardCount === 3) wrapper.dataset.cardCount = '3';

  return wrapper;
}

/* --------------------------
   Filtering logic
   -------------------------- */
function filterSections(sections) {
  const checkboxes = document.querySelectorAll('.gf-filter-option input[type="checkbox"]');
  const selectedTags = [...checkboxes].filter(cb => cb.checked).map(cb => cb.value);

  let visibleCardCount = 0;

  sections.forEach((section) => {
    const sectionTag = section.dataset.tag || '';
    const sectionTagNormalized = normalizeTag(sectionTag);

    // If no filters selected -> show all
    const shouldShowSection = selectedTags.length === 0 ? true : selectedTags.includes(sectionTagNormalized);

    // We show or hide at card-level: each card has dataset.tags or inherits section tag.
    const cards = section.querySelectorAll('.filter-section-cards-item');
    if (shouldShowSection) {
      // show all cards in section
      cards.forEach((card) => {
        card.style.display = '';
        card.classList.remove('hidden');
        visibleCardCount += 1;
      });
    } else {
      // hide all cards in that section
      cards.forEach((card) => {
        card.style.display = 'none';
        card.classList.add('hidden');
      });
    }
  });

  showNoResultsMessage(visibleCardCount);
}

function showNoResultsMessage(visibleCount) {
  const parent = document.querySelector('.filter-section-cards-main-wrapper');
  if (!parent) return;

  let noResultsEl = parent.querySelector('.filter-section-cards-no-results');

  if (visibleCount === 0) {
    if (!noResultsEl) {
      noResultsEl = document.createElement('div');
      noResultsEl.className = 'filter-section-cards-no-results';
      noResultsEl.innerHTML = '<p>No categories match your selection. Please adjust your filters.</p>';
      parent.appendChild(noResultsEl);
    }
    noResultsEl.style.display = 'block';
  } else if (noResultsEl) {
    noResultsEl.style.display = 'none';
  }
}

/* --------------------------
   Initialize filtering UI and interactions
   -------------------------- */
function initializeFiltering(mainWrapper, filterLabelText) {
  const sections = mainWrapper.querySelectorAll('.filter-section-cards-wrapper');

  // collate unique tags (normalized)
  const uniqueTags = [...new Set(
    Array.from(sections)
      .map((s) => s.dataset.tag)
      .filter(Boolean)
      .map((t) => t.trim())
  )];

  // create gf-container
  const gfContainer = document.createElement('div');
  gfContainer.className = 'gf-container';

  // mobile toggle
  const mobileToggle = document.createElement('button');
  mobileToggle.className = 'gf-mobile-toggle';
  mobileToggle.setAttribute('aria-label', 'Open filters');
  mobileToggle.innerHTML = '<div class="gf-mobile-prompt"><p>Filter by category</p></div><div class="gf-mobile-controls"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg><p>Filter Categories</p></div>';

  // sidebar
  const sidebar = document.createElement('div');
  sidebar.className = 'gf-sidebar';

  // sidebar header
  const sidebarHeader = document.createElement('div');
  sidebarHeader.className = 'gf-sidebar-header';
  const headerTitle = document.createElement('h5');
  headerTitle.textContent = filterLabelText || 'Filter Categories';
  sidebarHeader.appendChild(headerTitle);

  const closeBtn = document.createElement('button');
  closeBtn.setAttribute('aria-label', 'Close filters');
  closeBtn.className = 'gf-close-btn';
  // inline svg as string
  closeBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="15" viewBox="0 0 16 15" fill="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M8.3989 6.02085L2.38849 0.0104375L0.974275 1.42465L6.98468 7.43506L0.974275 13.4455L2.38849 14.8597L8.3989 8.84927L14.4093 14.8597L15.8235 13.4455L9.81311 7.43506L15.8235 1.42465L14.4093 0.0104375L8.3989 6.02085Z" fill="currentColor"/></svg>';
  sidebarHeader.appendChild(closeBtn);
  sidebar.appendChild(sidebarHeader);

  // sidebar content & filter group
  const sidebarContent = document.createElement('div');
  sidebarContent.className = 'gf-sidebar-content';
  const filterGroup = document.createElement('div');
  filterGroup.className = 'gf-filter-group';

  uniqueTags.forEach((tag) => {
    const label = document.createElement('label');
    label.className = 'gf-filter-option';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.name = 'category';
    checkbox.value = normalizeTag(tag);
    checkbox.checked = false;

    const span = document.createElement('span');
    span.textContent = tag;

    label.appendChild(checkbox);
    label.appendChild(span);
    filterGroup.appendChild(label);
  });

  sidebarContent.appendChild(filterGroup);
  sidebar.appendChild(sidebarContent);

  // footer
  const sidebarFooter = document.createElement('div');
  sidebarFooter.className = 'gf-sidebar-footer';

  const clearAllBtn = document.createElement('button');
  clearAllBtn.className = 'gf-clear-btn';
  clearAllBtn.textContent = 'Clear All';
  clearAllBtn.style.display = 'none';

  const viewResultsBtn = document.createElement('button');
  viewResultsBtn.className = 'gf-apply-btn';
  const initialCardCount = Array.from(sections).reduce((total, section) => {
    const cards = section.querySelectorAll('.filter-section-cards-item').length;
    return total + cards;
  }, 0);
  viewResultsBtn.textContent = `View Results (${initialCardCount})`;

  sidebarFooter.appendChild(clearAllBtn);
  sidebarFooter.appendChild(viewResultsBtn);
  sidebar.appendChild(sidebarFooter);

  // overlay for mobile drawer
  const overlay = document.createElement('div');
  overlay.className = 'gf-overlay';

  // result area
  const gfResults = document.createElement('div');
  gfResults.className = 'gf-results';

  // Move the existing sections into results
  sections.forEach((s) => gfResults.appendChild(s));

  // assemble container
  gfContainer.appendChild(mobileToggle);
  gfContainer.appendChild(sidebar);
  gfContainer.appendChild(gfResults);
  gfContainer.appendChild(overlay);

  // insert after the filter title if present
  const filterTitleEl = mainWrapper.querySelector('.filter-section-cards-filter-title');
  if (filterTitleEl && filterTitleEl.nextSibling) {
    mainWrapper.insertBefore(gfContainer, filterTitleEl.nextSibling);
  } else {
    mainWrapper.appendChild(gfContainer);
  }

  // interactivity
  const allCheckboxes = filterGroup.querySelectorAll('input[type="checkbox"]');

  function getVisibleCount() {
    let count = 0;
    sections.forEach((section) => {
      const visibleCards = section.querySelectorAll('.filter-section-cards-item:not(.hidden)');
      count += visibleCards.length;
    });
    return count;
  }

  function updateResultsCount() {
    const count = getVisibleCount();
    viewResultsBtn.textContent = `View Results (${count})`;
  }

  function hasActiveFilters() {
    return Array.from(allCheckboxes).some(cb => cb.checked);
  }

  function updateClearAllVisibility() {
    clearAllBtn.style.display = hasActiveFilters() ? 'block' : 'none';
  }

  // checkbox changes
  allCheckboxes.forEach((cb) => {
    cb.addEventListener('change', () => {
      filterSections(sections);
      updateResultsCount();
      updateClearAllVisibility();
    });
  });

  // clear all
  clearAllBtn.addEventListener('click', () => {
    allCheckboxes.forEach((cb) => { cb.checked = false; });
    filterSections(sections);
    updateResultsCount();
    updateClearAllVisibility();
  });

  // mobile open/close
  function openMobileDrawer() {
    sidebar.classList.add('gf-sidebar-open');
    overlay.classList.add('gf-overlay-open');
    document.body.style.overflow = 'hidden';
  }

  function closeMobileDrawer() {
    sidebar.classList.remove('gf-sidebar-open');
    overlay.classList.remove('gf-overlay-open');
    document.body.style.overflow = '';
  }

  mobileToggle.addEventListener('click', openMobileDrawer);
  overlay.addEventListener('click', closeMobileDrawer);
  closeBtn.addEventListener('click', closeMobileDrawer);
  viewResultsBtn.addEventListener('click', closeMobileDrawer);

  // initial state
  filterSections(sections);
  updateResultsCount();
}

/* --------------------------
   Decorator (entry)
   -------------------------- */
export default function decorate(block) {
  if (!block) return;

  // keep a copy of original rows for instrumentation
  const rows = Array.from(block.children);
  if (rows.length < 2) {
    console.warn('filter-section-cards: Expected at least 2 rows (filter title + item rows)');
    return;
  }

  const filterTitleRow = rows[0];
  const filterTitleCell = filterTitleRow.children[0];
  const filterTitle = getCellText(filterTitleCell);

  const mainWrapper = document.createElement('div');
  mainWrapper.className = 'filter-section-cards-main-wrapper';

  // Move instrumentation from block-level title to new title
  const filterTitleElement = buildFilterTitle(filterTitle);
  if (filterTitleElement) {
    moveInstrumentation(filterTitleRow, filterTitleElement);
    mainWrapper.appendChild(filterTitleElement);
  }

  // iterate item rows
  for (let i = 1; i < rows.length; i += 1) {
    const itemRow = rows[i];
    const cells = Array.from(itemRow.children);

    // Expect 17 or 23 cells (per your original design)
    if (cells.length === 17 || cells.length === 23) {
      const sharedTag = getCellText(cells[4]);

      const headerData = {
        title: getCellText(cells[0]),
        description: getCellText(cells[1]),
        ctaLabel: getCellText(cells[2]),
        ctaUrl: getCellUrl(cells[3]),
      };

      const card1Data = {
        title: getCellText(cells[5]),
        description: getCellText(cells[6]),
        ctaLabel: getCellText(cells[7]),
        ctaUrl: getCellUrl(cells[8]),
        imageSrc: getCellImage(cells[9]),
        tag: sharedTag,
        badgeOverride: getCellText(cells[10]),
      };

      const card2Data = {
        title: getCellText(cells[11]),
        description: getCellText(cells[12]),
        ctaLabel: getCellText(cells[13]),
        ctaUrl: getCellUrl(cells[14]),
        imageSrc: getCellImage(cells[15]),
        tag: sharedTag,
        badgeOverride: getCellText(cells[16]),
      };

      const card3Data = cells.length === 23 ? {
        title: getCellText(cells[17]),
        description: getCellText(cells[18]),
        ctaLabel: getCellText(cells[19]),
        ctaUrl: getCellUrl(cells[20]),
        imageSrc: getCellImage(cells[21]),
        tag: sharedTag,
        badgeOverride: getCellText(cells[22]),
      } : null;

      const originalCells = {
        header: {
          titleCell: cells[0],
          descriptionCell: cells[1],
          labelCell: cells[2],
          urlCell: cells[3],
        },
        card1: {
          titleCell: cells[5],
          descriptionCell: cells[6],
          labelCell: cells[7],
          urlCell: cells[8],
          imageCell: cells[9],
          badgeCell: cells[10],
        },
        card2: {
          titleCell: cells[11],
          descriptionCell: cells[12],
          labelCell: cells[13],
          urlCell: cells[14],
          imageCell: cells[15],
          badgeCell: cells[16],
        },
        tagCell: cells[4],
      };

      if (card3Data) {
        originalCells.card3 = {
          titleCell: cells[17],
          descriptionCell: cells[18],
          labelCell: cells[19],
          urlCell: cells[20],
          imageCell: cells[21],
          badgeCell: cells[22],
        };
      }

      const itemContainer = buildContainer(
        null,
        headerData,
        card1Data,
        card2Data,
        card3Data,
        originalCells,
      );

      // move instrumentation from itemRow to this new container
      moveInstrumentation(itemRow, itemContainer);

      mainWrapper.appendChild(itemContainer);
    } else {
      console.warn(`filter-section-cards: Row ${i} has invalid cell count (${cells.length}), expected 17 or 23`);
    }
  }

  // move any remaining instrumentation from the block to the wrapper
  moveInstrumentation(block, mainWrapper);

  // replace block contents with mainWrapper
  block.textContent = '';
  block.appendChild(mainWrapper);

  // initialize filter UI (the filter title text from the first row)
  initializeFiltering(mainWrapper, filterTitle);
}
