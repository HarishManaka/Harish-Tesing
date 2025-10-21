function buildCard(data, cells = {}, sharedTagCell = null) {
  const cardLink = document.createElement('a');
  cardLink.href = data.ctaUrl || '#';
  cardLink.className = 'filter-section-cards-item-link';
  cardLink.target = '_blank';
  cardLink.rel = 'noopener noreferrer';

  const card = document.createElement('div');
  card.className = 'filter-section-cards-item';

  // Add data attributes for filtering
  if (data.tag) {
    card.dataset.tags = data.tag;

    // Add id at card level (instead of wrapper)
    card.id = data.tag.toLowerCase().replace(/\s+/g, '-');
  }

  // Image container
  const imageContainer = document.createElement('div');
  imageContainer.className = 'filter-section-cards-item-img';
  const img = document.createElement('img');
  img.src = data.imageSrc || 'https://via.placeholder.com/400x200?text=Placeholder+Image';
  img.alt = data.title || 'Card image';
  imageContainer.appendChild(img);
  card.appendChild(imageContainer);

  // Content
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

  // Meta
  const meta = document.createElement('div');
  meta.className = 'filter-section-cards-item-meta';

  if (data.ctaLabel) {
    const ctaText = document.createElement('span');
    ctaText.textContent = data.ctaLabel;
    ctaText.className = 'filter-section-cards-link';
    meta.appendChild(ctaText);
  }

  if (data.badgeOverride || data.tag) {
    const badge = document.createElement('span');
    badge.className = 'filter-section-cards-badge';
    badge.textContent = data.badgeOverride || data.tag;
    meta.appendChild(badge);
  }

  content.appendChild(meta);
  card.appendChild(content);
  cardLink.appendChild(card);

  return cardLink;
}

function buildContainer(filterTitle, header, card1, card2, card3, originalCells = {}) {
  const wrapper = document.createElement('div');
  wrapper.className = 'filter-section-cards-wrapper';

  // Count number of cards
  const cardCount = [card1.title, card2.title, card3 && card3.title].filter(Boolean).length;
  if (cardCount === 3) wrapper.dataset.cardCount = '3';

  // Filter title (optional)
  const filterTitleElement = buildFilterTitle(filterTitle);
  if (filterTitleElement) wrapper.appendChild(filterTitleElement);

  // Header
  const headerSection = buildHeader(header, originalCells.header || {});
  wrapper.appendChild(headerSection);

  // Build cards (each card gets its id)
  if (card1.title) wrapper.appendChild(buildCard(card1, originalCells.card1 || {}, originalCells.tagCell));
  if (card2.title) wrapper.appendChild(buildCard(card2, originalCells.card2 || {}, originalCells.tagCell));
  if (card3 && card3.title) wrapper.appendChild(buildCard(card3, originalCells.card3 || {}, originalCells.tagCell));

  return wrapper;
}


