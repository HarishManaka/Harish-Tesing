function getCell(block, r, c) {
  const row = block.children[r];
  return row ? row.children[c] : undefined;
}

function extractImg(cell) {
  if (!cell) return { src: '', alt: '' };
  const img = cell.querySelector('picture > img') || cell.querySelector('img');
  if (img) return { src: img.getAttribute('src') || '', alt: img.getAttribute('alt') || '' };
  const text = (cell.textContent || '').trim();
  return { src: text, alt: '' };
}

function textOf(cell) {
  return (cell && cell.textContent ? cell.textContent.trim() : '');
}

// Read href from AEM aem-content cell (anchor, input/textarea, or plain text)
function extractHref(cell) {
  if (!cell) return '';
  const a = cell.querySelector('a[href]');
  if (a && a.getAttribute('href')) return a.getAttribute('href').trim();
  const input = cell.querySelector('input[type="text"], textarea');
  if (input && input.value) return input.value.trim();
  return (cell.textContent || '').trim();
}

export default function decorate(block) {
  // Row 1: [Image][Image Alt]
  const imgInfo = extractImg(getCell(block, 0, 0));
  const imgAltField = textOf(getCell(block, 0, 1));

  // Row 2: [Content (rich text)]
  const contentCell = getCell(block, 1, 0);
  const contentNodes = contentCell
    ? Array.from(contentCell.childNodes).map((n) => n.cloneNode(true))
    : [];

  // Row 3: [CTA (aem-content)][CTA Text][CTA Button Type (unused)]
  const ctaHref = extractHref(getCell(block, 2, 0));
  const ctaText = textOf(getCell(block, 2, 0));
  const finalAlt = imgAltField || imgInfo.alt || '';

  // Rebuild DOM
  block.textContent = '';

  const root = document.createElement('div');
  if (imgInfo.src) {
    root.classList.add('nasm-blog-post-cta-theme-a');
  } else {
    root.classList.add('nasm-blog-post-cta-theme-b');
  }

  // TEXT WRAPPER (first) — insert the cloned rich text nodes
  const textWrap = document.createElement('div');
  textWrap.classList.add('nasm-blog-post-cta-content');
  contentNodes.forEach((n) => textWrap.appendChild(n));
  // CTA button (fixed classes)
  if (ctaHref && ctaText) {
    const a = document.createElement('a');
    a.setAttribute('href', ctaHref);
    a.setAttribute('target', '_blank');
    a.setAttribute('rel', 'noopener noreferrer');
    a.className = 'nasm-primary-btn fill-right-btn nasm-blog-post-cta-btn';
    const span = document.createElement('span');
    span.appendChild(document.createTextNode(ctaText));
    a.appendChild(span);
    root.appendChild(textWrap);
    // Conditionally append the CTA button
    if (imgInfo.src) {
      // If image exists (Theme A), append to text wrapper
      textWrap.appendChild(a);
    } else {
      // If NO image (Theme B), append directly to the root
      root.appendChild(a);
    }
  }

  // IMAGE WRAPPER (second)
  const imageWrap = document.createElement('div');
  imageWrap.classList.add('nasm-blog-post-cta-img');

  if (imgInfo.src) {
    const img = document.createElement('img');
    img.setAttribute('src', imgInfo.src);
    if (finalAlt) img.setAttribute('alt', finalAlt);
    img.setAttribute('loading', 'lazy');
    imageWrap.appendChild(img);
    root.appendChild(imageWrap);
  }

  // Append in requested order: text first, image second
  block.appendChild(root);
}
