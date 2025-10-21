/**
 * Filter Section Cards - AEM Edge Delivery Service (Universal Editor)
 * Fully dynamic, DOM-driven, card-level tag filtering
 */

import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  // -------------------------------
  // 1️⃣ Initialize Elements
  // -------------------------------
  const overlay = document.createElement('div');
  overlay.className = 'gf-overlay';

  const sidebar = document.createElement('aside');
  sidebar.className = 'gf-sidebar';

  const resultsContainer = document.createElement('div');
  resultsContainer.className = 'gf-results';

  const container = document.createElement('div');
  container.className = 'gf-container';
  container.append(sidebar, resultsContainer);

  block.append(overlay, container);

  // -------------------------------
  // 2️⃣ Read All Cards from DOM (Universal Editor generated)
  // -------------------------------
  const cards = Array.from(block.querySelectorAll('.filter-section-cards-item-link')).map((link) => {
    const item = link.querySelector('.filter-section-cards-item');
    moveInstrumentation(item);

    return {
      el: link,
      tag:
        link.dataset.tag ||
        link.getAttribute('data-tag') ||
        (link.querySelector('[data-tag]')?.dataset.tag || '').trim() ||
        '',
    };
  });

  if (!cards.length) return;

  // -------------------------------
  // 3️⃣ Build Unique Tag List (Card-Level)
  // -------------------------------
  const tags = Array.from(new Set(cards.map((c) => c.tag).filter(Boolean))).sort();

  const sidebarHeader = document.createElement('div');
  sidebarHeader.className = 'gf-sidebar-header';
  const title = document.createElement('h5');
  title.textContent = 'Filter By';
  sidebarHeader.append(title);
  sidebar.append(sidebarHeader);

  const filterList = document.createElement('div');
  filterList.className = 'gf-filter-list';
  tags.forEach((tag) => {
    const label = document.createElement('label');
    label.className = 'gf-filter-option';
    label.innerHTML = `<input type="checkbox" value="${tag}"> <span>${tag}</span>`;
    filterList.append(label);
  });
  sidebar.append(filterList);

  const footer = document.createElement('div');
  footer.className = 'gf-sidebar-footer';
  footer.innerHTML = `
    <button class="gf-apply-btn">Apply</button>
    <button class="gf-clear-btn">Clear</button>
  `;
  sidebar.append(footer);

  // -------------------------------
  // 4️⃣ Render Initial Cards
  // -------------------------------
  const renderCards = (visibleCards) => {
    resultsContainer.innerHTML = '';
    if (!visibleCards.length) {
      const noResults = document.createElement('div');
      noResults.className = 'filter-section-cards-no-results';
      noResults.innerHTML = '<p>No results found.</p>';
      resultsContainer.append(noResults);
      return;
    }

    visibleCards.forEach((c) => {
      resultsContainer.append(c.el);
    });
  };

  renderCards(cards);

  // -------------------------------
  // 5️⃣ Filtering Logic (Card-Level)
  // -------------------------------
  const applyFilters = () => {
    const selected = Array.from(
      sidebar.querySelectorAll('input[type="checkbox"]:checked')
    ).map((i) => i.value);

    if (!selected.length) {
      renderCards(cards);
      return;
    }

    const filtered = cards.filter((c) => selected.includes(c.tag));
    renderCards(filtered);
  };

  const clearFilters = () => {
    sidebar.querySelectorAll('input[type="checkbox"]').forEach((cb) => (cb.checked = false));
    renderCards(cards);
  };

  sidebar.querySelector('.gf-apply-btn').addEventListener('click', applyFilters);
  sidebar.querySelector('.gf-clear-btn').addEventListener('click', clearFilters);

  // -------------------------------
  // 6️⃣ Mobile Overlay Logic
  // -------------------------------
  const toggleBtn = document.createElement('button');
  toggleBtn.className = 'gf-mobile-toggle';
  toggleBtn.textContent = 'Filter Options';

  toggleBtn.addEventListener('click', () => {
    sidebar.classList.toggle('gf-sidebar-open');
    overlay.classList.toggle('gf-overlay-open');
  });

  overlay.addEventListener('click', () => {
    sidebar.classList.remove('gf-sidebar-open');
    overlay.classList.remove('gf-overlay-open');
  });

  block.prepend(toggleBtn);
}
