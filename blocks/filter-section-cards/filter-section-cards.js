/**
 * Filter Section Cards - Grouped & Mixed View
 * Works with Edge Delivery Service (AEM Franklin)
 * Dynamically builds cards and filters by tag
 */

import { moveInstrumentation } from '../../scripts/scripts.js';

const FilterSectionCards = (() => {
  function el(tag, attrs = {}, children = []) {
    const node = document.createElement(tag);
    for (const k in attrs) {
      if (k === 'class') node.className = attrs[k];
      else if (k === 'text') node.textContent = attrs[k];
      else node.setAttribute(k, attrs[k]);
    }
    (Array.isArray(children) ? children : [children]).forEach((c) => {
      if (typeof c === 'string') node.appendChild(document.createTextNode(c));
      else if (c) node.appendChild(c);
    });
    return node;
  }

  /* Collect all card1/card2/card3 data objects */
  function collectCards(items) {
    const cards = [];
    items.forEach((item) => {
      ['card1', 'card2', 'card3'].forEach((key) => {
        if (item[key] && item[key][`${key}-title`]) {
          const card = { ...item[key] };
          card.tag = card.tag || item.tag || item[`${key}-tag`] || '';
          cards.push(card);
        }
      });
    });
    return cards;
  }

  /* Unique tags for filter sidebar */
  function getUniqueTags(cards) {
    const set = new Set();
    cards.forEach((c) => c.tag && c.tag.split(',').forEach((t) => set.add(t.trim())));
    return Array.from(set);
  }

  /* Group by tag */
  function groupByTag(cards) {
    const grouped = {};
    cards.forEach((c) => {
      const tags = c.tag ? c.tag.split(',').map((t) => t.trim()) : ['Other'];
      tags.forEach((t) => {
        if (!grouped[t]) grouped[t] = [];
        grouped[t].push(c);
      });
    });
    return grouped;
  }

  /* Sidebar with filters and toggle button */
  function renderSidebar(root, tags, onChange, onToggleView) {
    const aside = el('aside', { class: 'fsc-sidebar' });
    aside.appendChild(el('div', { class: 'fsc-filters-title', text: 'FILTER CATEGORIES' }));

    const list = el('div', { class: 'fsc-filter-list' });
    tags.forEach((tag) => {
      const id = 'fsc-' + tag.replace(/\s+/g, '-');
      const label = el('label', { for: id, class: 'fsc-filter-item' });
      const input = el('input', { type: 'checkbox', id });
      input.dataset.tag = tag;
      input.addEventListener('change', onChange);
      label.appendChild(input);
      label.appendChild(el('span', { text: tag }));
      list.appendChild(label);
    });
    aside.appendChild(list);

    const toggle = el('button', { class: 'fsc-toggle-view', text: 'Switch to Mixed View' });
    toggle.addEventListener('click', onToggleView);
    aside.appendChild(toggle);

    root.appendChild(aside);
  }

  /* Render cards grouped by tag */
  function renderGrouped(root, cards) {
    const container = root.querySelector('.fsc-card-groups') || el('div', { class: 'fsc-card-groups' });
    container.innerHTML = '';

    const grouped = groupByTag(cards);
    Object.keys(grouped).forEach((tag) => {
      const section = el('div', { class: 'fsc-card-group' });
      section.appendChild(el('h2', { class: 'fsc-group-title', text: tag }));
      const grid = el('div', { class: 'fsc-cards' });
      grouped[tag].forEach((card) => grid.appendChild(createCard(card)));
      section.appendChild(grid);
      container.appendChild(section);
    });

    if (!root.querySelector('.fsc-card-groups')) root.appendChild(container);
  }

  /* Render all cards mixed */
  function renderMixed(root, cards) {
    const container = root.querySelector('.fsc-card-groups') || el('div', { class: 'fsc-card-groups' });
    container.innerHTML = '';
    const grid = el('div', { class: 'fsc-cards' });
    cards.forEach((card) => grid.appendChild(createCard(card)));
    container.appendChild(grid);
    if (!root.querySelector('.fsc-card-groups')) root.appendChild(container);
  }

  /* Create individual card */
  function createCard(card) {
    const cardEl = el('article', { class: 'fsc-card' });

    // moveInstrumentation support (AEM analytics/monitoring)
    moveInstrumentation(cardEl);

    if (card['card1-image'])
      cardEl.appendChild(el('img', { src: card['card1-image'], alt: card['card1-title'] }));

    const body = el('div', { class: 'fsc-card-body' });
    body.appendChild(el('h3', { class: 'fsc-card-title', text: card['card1-title'] }));
    body.appendChild(el('p', { class: 'fsc-card-desc', text: card['card1-description'] }));

    const footer = el('div', { class: 'fsc-card-footer' });
    const link = el('a', {
      class: 'fsc-cta',
      href: card['card1-url'] || '#',
      text: card['card1-label'] || 'Download Now',
    });
    footer.appendChild(link);
    footer.appendChild(el('span', { class: 'fsc-badge', text: card['card1-badge'] || 'PDF' }));
    body.appendChild(footer);

    cardEl.appendChild(body);
    return cardEl;
  }

  /* Initialize Component */
  function init(data, selector) {
    const root = document.querySelector(selector);
    if (!root) throw new Error('Container not found');
    root.classList.add('fsc-wrapper');

    const cards = collectCards(data);
    const tags = getUniqueTags(cards);
    let groupedView = true;

    const onFilterChange = () => {
      const selected = Array.from(root.querySelectorAll('.fsc-filter-list input:checked')).map(
        (i) => i.dataset.tag
      );
      const filtered = !selected.length
        ? cards
        : cards.filter((c) => {
            const ct = c.tag ? c.tag.split(',').map((t) => t.trim()) : [];
            return ct.some((t) => selected.includes(t));
          });
      groupedView ? renderGrouped(root, filtered) : renderMixed(root, filtered);
    };

    const onToggleView = (e) => {
      groupedView = !groupedView;
      e.target.textContent = groupedView ? 'Switch to Mixed View' : 'Switch to Grouped View';
      onFilterChange();
    };

    renderSidebar(root, tags, onFilterChange, onToggleView);
    renderGrouped(root, cards);
  }

  return { init };
})();

/* Global exposure for browser usage */
if (typeof window !== 'undefined') window.FilterSectionCards = FilterSectionCards;

   
