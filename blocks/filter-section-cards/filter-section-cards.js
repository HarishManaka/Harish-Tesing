/**
 * Filter Section Cards Block (AEM Edge Delivery Service)
 * Filtering is now at CARD LEVEL (card1, card2, card3 each have their own tag)
 */

import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Builds the Filter Section Cards block
 * @param {HTMLElement} block - The block element
 */
export default async function decorate(block) {
  const allItems = Array.from(block.querySelectorAll(':scope > div'));
  if (!allItems.length) return;

  /* -------------------------------
     1️⃣ Build Containers
  ------------------------------- */
  const wrapper = document.createElement('div');
  wrapper.className = 'filter-section-cards-wrapper';

  const sidebar = document.createElement('aside');
  sidebar.className = 'gf-sidebar';

  const resultsContainer = document.createElement('div');
  resultsContainer.className = 'gf-results';

  const overlay = document.createElement('div');
  overlay.className = 'gf-overlay';
  block.appendChild(overlay);

  /* -------------------------------
     2️⃣ Extract Data (Cards)
  ------------------------------- */
  const cards = [];

  allItems.forEach((item) => {
    const cardData = {};
    const headings = Array.from(item.querySelectorAll('h2, h3, h4'));
    const paragraphs = Array.from(item.querySelectorAll('p'));
    const links = Array.from(item.querySelectorAll('a'));
    const imgs = Array.from(item.querySelectorAll('img'));

    // Try to detect card-level data (card1, card2, card3)
    const cardEls = item.querySelectorAll('.filter-section-cards-item-link, a');
    cardEls.forEach((cardEl, index) => {
      const tag = cardEl.dataset.tag || cardEl.getAttribute('data-tag') || cardEl.getAttribute('tag') || '';
      const card = {
        title: cardEl.querySelector('h3')?.textContent?.trim() || headings[index]?.textContent?.trim() || '',
        description: cardEl.querySelector('p')?.textContent?.trim() || paragraphs[index]?.textContent?.trim() || '',
        label: cardEl.querySelector('.filter-section-cards-link')?.textContent?.trim() || 'Learn More',
        url: cardEl.getAttribute('href') || links[index]?.href || '#',
        image: cardEl.querySelector('img')?.src || imgs[index]?.src || '',
        badge: cardEl.querySelector('.filter-section-cards-badge')?.textContent?.trim() || '',
        tag: tag,
      };
      cards.push(card);
    });
  });

  if (!cards.length) return;

  /* -------------------------------
     3️⃣ Build Filter Sidebar
  ------------------------------- */
  const tags = Array.from(new Set(cards.map((c) => c.tag).filter(Boolean))).sort();

  const sidebarHeader = document.createElement('div');
  sidebarHeader.className = 'gf-sidebar-header';
  const title = document.createElement('h5');
  title.textContent = 'Filter By Category';
  sidebarHeader.appendChild(title);
  sidebar.appendChild(sidebarHeader);

  const filterList = document.createElement('div');
  filterList.className = 'gf-filter-list';
  tags.forEach((tag) => {
    const option = document.createElement('label');
    option.className = 'gf-filter-option';
    option.innerHTML = `<input type="checkbox" value="${tag}"> <span>${tag}</span>`;
    filterList.appendChild(option);
  });
  sidebar.appendChild(filterList);

  const footer = document.createElement('div');
  footer.className = 'gf-sidebar-footer';
  footer.innerHTML = `
    <button class="gf-apply-btn">Apply</button>
    <button class="gf-clear-btn">Clear</button>
  `;
  sidebar.appendChild(footer);

  /* -------------------------------
     4️⃣ Build Cards in DOM
  ------------------------------- */
  const renderCards = (visibleCards) => {
    resultsContainer.innerHTML = '';
    if (!visibleCards.length) {
      const noResults = document.createElement('div');
      noResults.className = 'filter-section-cards-no-results';
      noResults.innerHTML = '<p>No results found.</p>';
      resultsContainer.appendChild(noResults);
      return;
    }

    visibleCards.forEach((card) => {
      const link = document.createElement('a');
      link.className = 'filter-section-cards-item-link';
      link.href = card.url;
      if (card.tag) link.dataset.tag = card.tag;

      const item = document.createElement('div');
      item.className = 'filter-section-cards-item';
      moveInstrumentation(item);

      // image
      const imgContainer = document.createElement('div');
      imgContainer.className = 'filter-section-cards-item-img';
      if (card.image) {
        const img = document.createElement('img');
        img.src = card.image;
        img.alt = card.title || 'Card image';
        imgContainer.appendChild(img);
      }
      item.appendChild(imgContainer);

      // content
      const content = document.createElement('div');
      content.className = 'filter-section-cards-item-content';
      content.innerHTML = `
        <h3>${card.title}</h3>
        <p>${card.description}</p>
      `;

      // meta
      const meta = document.createElement('div');
      meta.className = 'filter-section-cards-item-meta';
      const cta = document.createElement('span');
      cta.className = 'filter-section-cards-link';
      cta.textContent = card.label || 'Read More';
      const badge = document.createElement('span');
      badge.className = 'filter-section-cards-badge';
      badge.textContent = card.badge || 'PDF';
      meta.append(cta, badge);

      content.appendChild(meta);
      item.appendChild(content);
      link.appendChild(item);
      resultsContainer.appendChild(link);
    });
  };

  renderCards(cards);

  /* -------------------------------
     5️⃣ Filter Logic
  ------------------------------- */
  const applyFilters = () => {
    const selected = Array.from(
      sidebar.querySelectorAll('input[type="checkbox"]:checked')
    ).map((el) => el.value);
    if (!selected.length) {
      renderCards(cards);
    } else {
      const filtered = cards.filter((card) =>
        selected.includes(card.tag)
      );
      renderCards(filtered);
    }
  };

  const clearFilters = () => {
    sidebar.querySelectorAll('input[type="checkbox"]').forEach((cb) => (cb.checked = false));
    renderCards(cards);
  };

  sidebar.querySelector('.gf-apply-btn').addEventListener('click', applyFilters);
  sidebar.querySelector('.gf-clear-btn').addEventListener('click', clearFilters);

  /* -------------------------------
     6️⃣ Assemble Block
  ------------------------------- */
  const container = document.createElement('div');
  container.className = 'gf-container';
  container.append(sidebar, resultsContainer);

  block.innerHTML = '';
  block.appendChild(container);

  /* -------------------------------
     7️⃣ Mobile Overlay / Toggle
  ------------------------------- */
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
