/**
 * Builds the filter title section
 * @param {string} title - Filter title text
 * @returns {HTMLElement|null} - Filter title element or null if no title
 */
import { moveInstrumentation } from '../../scripts/scripts.js';
import './filter-section-cards.css';

export default function decorate(block) {
  if (!block) return;

  block.classList.add('filter-section-cards');

  // Move instrumentation from original block
  moveInstrumentation(block);

  // --- 1️⃣ Extract rows and filter title ---
  const rows = Array.from(block.children);
  const filterTitleRow = rows[0];
  const filterTitle = filterTitleRow?.textContent.trim() || '';

  // Create main wrapper
  const mainWrapper = document.createElement('div');
  mainWrapper.className = 'filter-section-cards-main-wrapper';

  // Filter title element
  if (filterTitle) {
    const titleEl = document.createElement('div');
    titleEl.className = 'filter-section-cards-filter-title';
    const h2 = document.createElement('h2');
    h2.textContent = filterTitle;
    titleEl.appendChild(h2);
    mainWrapper.appendChild(titleEl);
  }

  // --- 2️⃣ Build card sections ---
  const sections = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const cols = Array.from(row.children);

    if (!cols.length) continue;

    const sectionWrapper = document.createElement('div');
    sectionWrapper.className = 'filter-section-cards-wrapper';

    // Optional: assign data-card-count based on number of cards
    const cardCount = cols.length;
    sectionWrapper.dataset.cardCount = cardCount;

    // For each column → build a card
    cols.forEach((col) => {
      const cardLink = document.createElement('a');
      cardLink.className = 'filter-section-cards-item-link';

      // Extract image
      const img = col.querySelector('img');
      if (img) {
        const imgWrapper = document.createElement('div');
        imgWrapper.className = 'filter-section-cards-item-img';
        imgWrapper.appendChild(img);
        cardLink.appendChild(imgWrapper);
      }

      // Extract content
      const contentWrapper = document.createElement('div');
      contentWrapper.className = 'filter-section-cards-item-content';

      const cardTitle = col.querySelector('h3,h4,h2');
      if (cardTitle) contentWrapper.appendChild(cardTitle);

      const cardDesc = col.querySelector('p');
      if (cardDesc) contentWrapper.appendChild(cardDesc);

      // Meta: CTA / badge
      const meta = document.createElement('div');
      meta.className = 'filter-section-cards-item-meta';

      const cta = col.querySelector('a');
      if (cta) {
        cta.classList.add('filter-section-cards-link');
        meta.appendChild(cta);
      }

      contentWrapper.appendChild(meta);
      cardLink.appendChild(contentWrapper);

      // Assign tag from data attribute or fallback text
      const tagText = col.dataset.tag || col.getAttribute('data-tag') || '';
      if (tagText) cardLink.dataset.tag = tagText.toLowerCase().replace(/\s+/g, '-');

      sectionWrapper.appendChild(cardLink);
    });

    sections.push(sectionWrapper);
    mainWrapper.appendChild(sectionWrapper);
  }

  // --- 3️⃣ Append main wrapper ---
  block.textContent = '';
  block.appendChild(mainWrapper);

  // --- 4️⃣ Add no results message ---
  const noResults = document.createElement('div');
  noResults.className = 'filter-section-cards-no-results';
  noResults.innerHTML = `<p>No categories match your selection. Please adjust your filters.</p>`;
  block.appendChild(noResults);

  // --- 5️⃣ Initialize filtering ---
  initializeFiltering(block, filterTitle, sections);
}

/**
 * Initializes filtering (GenericFilter style)
 */
function initializeFiltering(block, filterLabelText, sections) {
  // Extract unique tags
  const uniqueTags = [...new Set(sections.flatMap((s) => {
    return Array.from(s.querySelectorAll('[data-tag]')).map((el) => el.dataset.tag);
  }).filter(Boolean))];

  if (!uniqueTags.length) return; // no filters needed

  // Sidebar
  const sidebar = document.createElement('div');
  sidebar.className = 'gf-sidebar';

  const sidebarHeader = document.createElement('div');
  sidebarHeader.className = 'gf-sidebar-header';
  const headerTitle = document.createElement('h5');
  headerTitle.textContent = filterLabelText || 'Filter by category';
  sidebarHeader.appendChild(headerTitle);
  sidebar.appendChild(sidebarHeader);

  const filterGroup = document.createElement('div');
  filterGroup.className = 'gf-filter-group';

  uniqueTags.forEach((tag) => {
    const label = document.createElement('label');
    label.className = 'gf-filter-option';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = tag;

    const span = document.createElement('span');
    span.textContent = tag;

    label.appendChild(checkbox);
    label.appendChild(span);
    filterGroup.appendChild(label);
  });

  sidebar.appendChild(filterGroup);

  // Footer buttons
  const footer = document.createElement('div');
  footer.className = 'gf-sidebar-footer';

  const clearBtn = document.createElement('button');
  clearBtn.className = 'gf-clear-btn';
  clearBtn.textContent = 'Clear All';
  footer.appendChild(clearBtn);

  const viewBtn = document.createElement('button');
  viewBtn.className = 'gf-apply-btn';
  viewBtn.textContent = `View Results (${sections.length})`;
  footer.appendChild(viewBtn);

  sidebar.appendChild(footer);

  // Mobile toggle + overlay
  const mobileToggle = document.createElement('button');
  mobileToggle.className = 'gf-mobile-toggle';
  mobileToggle.innerText = 'Filter Categories';

  const overlay = document.createElement('div');
  overlay.className = 'gf-overlay';

  block.insertBefore(mobileToggle, block.firstChild);
  block.insertBefore(overlay, block.firstChild);
  block.insertBefore(sidebar, block.firstChild);

  // --- 6️⃣ Event handlers ---
  const checkboxes = sidebar.querySelectorAll('input[type="checkbox"]');

  const updateSections = () => {
    const selected = [...checkboxes].filter(cb => cb.checked).map(cb => cb.value);
    let visibleCount = 0;
    sections.forEach((section) => {
      const cards = section.querySelectorAll('[data-tag]');
      const hasVisible = Array.from(cards).some(c => selected.includes(c.dataset.tag));
      if (!selected.length || hasVisible) {
        section.style.display = '';
        visibleCount++;
      } else {
        section.style.display = 'none';
      }
    });

    noResults.style.display = visibleCount ? 'none' : 'block';
    viewBtn.textContent = `View Results (${visibleCount})`;
  };

  checkboxes.forEach(cb => cb.addEventListener('change', updateSections));

  clearBtn.addEventListener('click', () => {
    checkboxes.forEach(cb => cb.checked = false);
    updateSections();
  });

  mobileToggle.addEventListener('click', () => {
    sidebar.classList.toggle('gf-sidebar-open');
    overlay.classList.toggle('gf-overlay-open');
    document.body.style.overflow = sidebar.classList.contains('gf-sidebar-open') ? 'hidden' : '';
  });

  overlay.addEventListener('click', () => {
    sidebar.classList.remove('gf-sidebar-open');
    overlay.classList.remove('gf-overlay-open');
    document.body.style.overflow = '';
  });

  viewBtn.addEventListener('click', () => {
    sidebar.classList.remove('gf-sidebar-open');
    overlay.classList.remove('gf-overlay-open');
    document.body.style.overflow = '';
  });
}
