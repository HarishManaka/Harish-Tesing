export default async function decorate(block) {
  // Get the data from the block
  const data = [...block.children].map((row) => [...row.children]
    .map((cell) => cell.textContent.trim()));

  // Debug: Log the data structure
  console.debug('Hero USP data structure:', data);

  // Extract the configuration data - handle case where first row has key, second has value
  let contentType;
  let backgroundColor;

  if (data.length >= 2 && data[0].length === 1 && data[1].length === 1) {
    // First row is content_type value, second row is backgroundColor value
    contentType = data[0][0] === 'true';
    backgroundColor = data[1][0] || 'white';
  } else {
    // Key-value pairs in same row
    contentType = data.find((row) => row[0] === 'content_type')?.[1] === 'true';
    backgroundColor = data.find((row) => row[0] === 'backgroundColor')?.[1] || 'white';
  }

  // Debug: Log extracted values
  console.debug('Content type:', contentType, 'Background color:', backgroundColor);

  // Apply background color class to the block
  if (backgroundColor && backgroundColor !== 'white') {
    block.classList.add(`bg-${backgroundColor}`);
  }

  const heroUspContent = block.children;
  const isPromo = contentType;

  // Add promo class to parent if needed
  if (isPromo) {
    block.parentNode.classList.add('promo');
  }

  for (let i = 0; i < heroUspContent.length; i += 1) {
    // Skip configuration rows (first two rows are now config data)
    if (i < 2) {
      heroUspContent.item(i).className = 'hidden';
      // eslint-disable-next-line no-continue
      continue;
    }
    const el = heroUspContent.item(i);
    const ps = el.querySelectorAll('p');
    // if (ps.length < 3) return;
    const title = ps[0].textContent.trim();
    // Group subsequent p tags (p[1], p[2], etc.) in hero-usp-subtitle div
    // Exclude any p tags with class "button-container"
    const subtitlePs = Array.from(ps).slice(1).filter((p) => !p.classList.contains('button-container'));
    let subtitle = '';
    if (subtitlePs.length > 0) {
      const subtitleDiv = document.createElement('div');
      subtitleDiv.className = 'hero-usp-subtitle';
      // Move all subtitle p tags into the subtitle div
      subtitlePs.forEach((p) => {
        subtitleDiv.appendChild(p.cloneNode(true));
      });
      subtitle = subtitleDiv.outerHTML;
    }
    el.className = 'hero-usp-column';
    const hasLink = el.querySelector('p.button-container') !== null;
    if (!hasLink) {
      // Has no link
      if (isPromo) {
        el.innerHTML = `
          <p>${title}</p>
          ${subtitle.replace(/<p>/g, '<h4>').replace(/<\/p>/g, '</h4>')}
        `;
      } else {
        el.innerHTML = `
          <h4>${title}</h4>
          ${subtitle}
        `;
      }
    } else {
      // Find the p tag with class="button-container" and get its href
      const buttonP = Array.from(ps).find((p) => p.classList.contains('button-container'));
      const link = buttonP ? buttonP.querySelector('a') : null;
      if (!link) return;
      const href = link.getAttribute('href');
      el.className = 'hero-usp-column';
      if (isPromo) {
        el.innerHTML = `
          <a href="${href}">
            <p>${title}</p>
            ${subtitle.replace(/<p>/g, '<h4>').replace(/<\/p>/g, '</h4>')}
          </a>
        `;
      } else {
        el.innerHTML = `
          <a href="${href}">
            <h4>${title}</h4>
            ${subtitle}
          </a>
        `;
      }
    }
  }

  const columns = block.querySelectorAll('.hero-usp-column');
  columns.forEach((column, idx) => {
    if (idx === columns.length - 1) return;
    const divider = document.createElement('div');
    divider.className = 'usp-divider';
    divider.innerHTML = '&nbsp;';
    column.parentNode.insertBefore(divider, column.nextSibling);
  });

  // Background color has already been applied to the block element
}
