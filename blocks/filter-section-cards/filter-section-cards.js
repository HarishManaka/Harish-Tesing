/**
 * Filter Section Cards – AEM Edge Delivery Service (Universal Editor Compatible)
 * - Fully dynamic (reads DOM from Universal Editor)
 * - Card-level filtering (each .filter-section-cards-item-link)
 * - Auto tag fallback detection (no hardcoded values)
 * - Compatible with moveInstrumentation, gf-sidebar, gf-overlay, etc.
 */

import { moveInstrumentation } from '../../scripts/scripts.js';

export default async function decorate(block) {
  // -------------------------------
  // 1️⃣ Collect All Cards
  // -------------------------------
  const cardLinks = [...block.querySelectorAll('.filter-section-cards-item-link')];
  if (!cardLinks.length) return;

  // Apply AEM instrumentation (for analytics)
  cardLinks.forEach((link) => moveInstrumentation(link));

  // -------------------------------
  // 2️⃣ Detect Tags for Each Card (Auto Fallback)
  // -------------------------------
  const getTag = (link) => {
    // Preferred: data-tag attribute
    const attrTag = link.dataset.tag || link.getAttribute('data-tag');
    if (attrTag && attrTag.trim()) return attrTag.trim();

    // Fallback: look for inner tag element or text (e.g., <span class="tag">Nutrition</span>)
    const tagEl =
      link.querySelector('[data-tag]') ||
      link.querySelector('.filter-section-cards-tag') ||
      link.querySelector('.tag');
    if (tagEl?.textContent?.trim()) return tagEl.textContent.trim();

    // Fallback: try text from meta or badge
    const metaTag =
      link.querySelector('.filter-section-cards-badge')?.textContent?.trim() ||
      link.querySelector('.filter-section-cards-item-content h3')?.textContent?.split(' ')[0] ||
      '';
    return metaTag.trim();
  };

  const cards = cardLinks.map((link) => ({
    el: link,
    tag: getTag(link),
  }));

  // -------------------------------
  // 3️⃣ Build Tag List (Unique)
  // -------------------------------
  const tags = [...new Set(cards.map((c) => c.tag).filter(Boolean))].sort();
  if (!tags.length) return; // no tags, skip filter UI

  // -------------------------------
  // 4️⃣ Build Sidebar + Overlay + Results
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

  // Sidebar Header
  const sidebarHeader = document.createElement('div');
  sidebarHeader.className = 'gf-sidebar-header';
  sidebarHeader.innerHTML = '<h5>Filter By</h5>';
  sidebar.append(sidebarHeader);

  // Sidebar Filter List
  const filterList = document.createElement('div');
  filterList.className = 'gf-filter-list';
  tags.forEach((tag) => {
    const label = document.createElement('label');
    label.className = 'gf-filter-option';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.value = tag;
    const span = document.createElement('span');
    span.textContent = tag;
    label.append(input, span);
    filterList.append(label);
  });
  sidebar.append(filterList);

  // Sidebar Footer (Apply / Clear)
  const footer = document.createElement('div');
  footer.className = 'gf-sidebar-footer';
  footer.innerHTML = `
    <button class="gf-apply-btn" type="button">Apply</button>
    <button class="gf-clear-btn" type="button">Clear</button>
  `;
  sidebar.append(footer);

  // -------------------------------
  // 5️⃣ Render Cards Function
  // -------------------------------
  const renderCards = (cardsToShow) => {
    resultsContainer.innerHTML = '';
    if (!cardsToShow.length) {
      const empty = document.createElement('div');
      empty.className = 'filter-section-cards-no-results';
      empty.innerHTML = '<p>No results found.</p>';
      resultsContainer.append(empty);
      return;
    }

    cardsToShow.forEach((card) => resultsContainer.append(card.el));
  };

  renderCards(cards);

  // -------------------------------
  // 6️⃣ Filter Logic (Card-Level)
  // -------------------------------
  const applyFilters = () => {
    const selectedTags = [...sidebar.querySelectorAll('input:checked')].map((i) => i.value);
    if (!selectedTags.length) {
      renderCards(cards);
      return;
    }

    const filtered = cards.filter((c) => selectedTags.includes(c.tag));
    renderCards(filtered);
  };

  const clearFilters = () => {
    sidebar.querySelectorAll('input').forEach((cb) => (cb.checked = false));
    renderCards(cards);
  };

  sidebar.querySelector('.gf-apply-btn').addEventListener('click', applyFilters);
  sidebar.querySelector('.gf-clear-btn').addEventListener('click', clearFilters);

  // -------------------------------
  // 7️⃣ Mobile Toggle & Overlay Behavior
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

  // -------------------------------
  // 8️⃣ Listen for Universal Editor Live Updates
  // -------------------------------
  document.addEventListener('aem-contentchange', () => {
    // if authors add/remove cards in Universal Editor, re-scan tags and re-render
    const updatedLinks = [...block.querySelectorAll('.filter-section-cards-item-link')];
    const updatedCards = updatedLinks.map((link) => ({
      el: link,
      tag: getTag(link),
    }));
    renderCards(updatedCards);
  });
}
