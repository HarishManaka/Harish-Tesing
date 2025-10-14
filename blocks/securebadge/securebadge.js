export default function decorate(block) {
  const [secureBadgeTitle, ...secureBadgeItems] = block.children;
  if (!secureBadgeTitle || secureBadgeItems.length < 3) {
    console.error('Required elements are missing in the block:', block);
    return;
  }
  const badgeBlock = document.createElement('div');

  const imagesHtml = [...secureBadgeItems].map((item) => {
    const [imgDiv, linkDiv, altDiv] = item.children;
    const img = imgDiv?.querySelector('picture, img');
    const link = linkDiv?.querySelector('a');
    const href = link?.textContent.trim();
    const altText = altDiv?.textContent.trim();
    img?.querySelector('img')?.setAttribute('alt', altText);

    if (!img || !link || !altText || !href) {
      console.error('Required elements are missing in the block:', block);
      return '';
    }

    return `
        <a href="${href}" class="secure-badge-link" target="_blank">
          ${img.outerHTML}
        </a>
    `;
  }).join('');

  if (!imagesHtml) return;

  badgeBlock.innerHTML = `
    <div class="secure-badge-title">${secureBadgeTitle.innerHTML}</div>
    <div class="secure-badge-images">
      ${imagesHtml}
    </div>
  `;

  block.innerHTML = badgeBlock.innerHTML;
}
