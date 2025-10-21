export default async function decorate(block) {
  if (!(block instanceof HTMLElement)) return;

  block.classList.add('filter-section-cards');

  // Placeholder in Author mode
  const isAuthor = window.CQ && window.CQ.WCM && window.CQ.WCM.isEditMode && window.CQ.WCM.isEditMode();
  if (isAuthor) {
    block.textContent = 'Filter Section Cards (Dynamic Preview)';
    return;
  }

  // Fetch Edge Delivery JSON
  const url = block.dataset.endpoint || '/content/delivery/filter-cards.json';
  let data;
  try {
    const resp = await fetch(url);
    data = await resp.json();
  } catch (err) {
    console.error('Failed to fetch cards JSON:', err);
    return;
  }

  // Create wrapper
  const wrapper = document.createElement('div');
  wrapper.className = 'filter-section-cards-wrapper';

  // Create cards dynamically
  data.cards.forEach(card => {
    const link = document.createElement('a');
    link.href = card.url;
    link.className = 'filter-section-cards-item-link';

    const item = document.createElement('div');
    item.className = 'filter-section-cards-item';

    const img = document.createElement('div');
    img.className = 'filter-section-cards-item-img';
    const image = document.createElement('img');
    image.src = card.image;
    image.alt = card.title;
    img.appendChild(image);

    const content = document.createElement('div');
    content.className = 'filter-section-cards-item-content';
    content.innerHTML = `<h3>${card.title}</h3><p>${card.description}</p>`;

    item.appendChild(img);
    item.appendChild(content);
    link.appendChild(item);
    wrapper.appendChild(link);
  });

  block.appendChild(wrapper);
}

