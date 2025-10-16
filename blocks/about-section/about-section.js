/**
 * about-section.js
 * Decorator for the "about-section" block used in Edge Delivery / Universal Editor (AEM)
 *
 * Responsibilities:
 * - Ensure block has .about-section class
 * - Normalize internal structure to:
 *     .text-content  (heading + paragraph(s))
 *     .image-container (img or figure)
 * - Add accessibility attributes
 * - Lazy-load images and add basic srcset handling (if data-srcset present)
 * - Provide graceful fallbacks when expected nodes are missing
 *
 * Usage:
 * import decorate from './about-section.js';
 * decorate(blockElement);
 */

export default function decorate(block) {
  if (!(block instanceof HTMLElement)) return;

  // Ensure top-level class
  block.classList.add('about-section');

  // Find existing meaningful children
  // Heuristics:
  //  - heading (h1..h4) -> maintext
  //  - first <p> after heading -> subtext (others appended)
  //  - <img> or <figure> with img -> image-container
  const children = Array.from(block.children);

  // Helper: find first heading element
  const heading = children.find((el) => /^H[1-4]$/.test(el.tagName));
  // Helper: find first image or figure
  const imgEl = children.find((el) => el.tagName === 'IMG' || el.querySelector && el.querySelector('img'));
  // Helper: gather paragraphs excluding ones inside figure
  const paragraphs = children.filter((el) => el.tagName === 'P' && !el.closest('figure'));

  // Build .text-content
  let textContent = block.querySelector('.text-content');
  if (!textContent) {
    textContent = document.createElement('div');
    textContent.className = 'text-content';
  }

  // MAIN TEXT: create or move heading
  let main = textContent.querySelector('.maintext');
  if (!main) {
    main = document.createElement('div');
    main.className = 'maintext';
  }

  if (heading) {
    // Prefer existing heading text and move it in
    // We will wrap heading's innerText into a div.maintext to match CSS (no H tags required)
    main.textContent = heading.textContent.trim();
    // Remove original heading from DOM (in case it's still inside block)
    if (heading.parentElement === block) heading.remove();
  } else if (!main.textContent.trim()) {
    // If no heading found, attempt to use first paragraph's first sentence or give a placeholder
    if (paragraphs.length > 0) {
      main.textContent = paragraphs[0].textContent.split('. ')[0].trim().slice(0, 120) || 'About';
      // Remove used portion from the first paragraph (optional: keep whole paragraph below)
    } else {
      main.textContent = 'About';
    }
  }

  // SUB TEXT: compose from paragraphs (skip the one used as heading fallback only if we want)
  let sub = textContent.querySelector('.subtext');
  if (!sub) {
    sub = document.createElement('div');
    sub.className = 'subtext';
  }

  if (paragraphs.length > 0) {
    // join paragraph content (preserve line breaks)
    sub.innerHTML = paragraphs.map(p => p.innerHTML.trim()).join('<br/><br/>');
    // remove original paragraphs from block to avoid duplication
    paragraphs.forEach(p => {
      if (p.parentElement === block) p.remove();
    });
  } else {
    // If there were no paragraphs, try to extract any remaining text nodes from block
    const leftoverText = Array.from(block.childNodes)
      .filter(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim())
      .map(n => n.textContent.trim())
      .join(' ')
      .trim();
    sub.textContent = leftoverText || 'We help teams ship faster with predictable, reliable delivery.';
  }

  // Append heading and subtext to textContent
  // Clear any previous content and re-append to ensure idempotency
  textContent.innerHTML = '';
  textContent.appendChild(main);
  textContent.appendChild(sub);

  // Build .image-container
  let imageContainer = block.querySelector('.image-container');
  if (!imageContainer) {
    imageContainer = document.createElement('div');
    imageContainer.className = 'image-container';
  }

  // If an image (or figure) existed, move/normalize it into image-container
  if (imgEl) {
    // If imgEl is <img>, move it. If it's <figure>, extract its img (prefer figure.img)
    let imgNode;
    if (imgEl.tagName === 'IMG') {
      imgNode = imgEl;
      if (imgNode.parentElement !== imageContainer) imgNode.remove();
    } else {
      imgNode = imgEl.querySelector('img');
      // remove figure entirely (we'll move the <img>)
      if (imgEl.parentElement === block) imgEl.remove();
    }

    if (imgNode) {
      // normalize attributes for edge delivery
      // - add loading="lazy"
      // - if data-srcset attr present, assign to srcset
      // - if data-src (edge-processed) present, assign to src
      imgNode.setAttribute('loading', 'lazy');

      // Support for passing responsive srcset via a data attribute (optional)
      if (imgNode.dataset.srcset && !imgNode.getAttribute('srcset')) {
        imgNode.setAttribute('srcset', imgNode.dataset.srcset);
      }
      if (imgNode.dataset.src && !imgNode.getAttribute('src')) {
        imgNode.setAttribute('src', imgNode.dataset.src);
      }

      // Ensure alt exists for accessibility
      if (!imgNode.hasAttribute('alt')) {
        imgNode.setAttribute('alt', main.textContent || 'About image');
      }

      // Ensure object-fit behavior via CSS is respected (your CSS uses object-fit)
      imgNode.style.width = imgNode.style.width || '100%';
      imgNode.style.maxWidth = imgNode.style.maxWidth || '700px';
      imgNode.style.borderRadius = imgNode.style.borderRadius || '0';
      imgNode.style.objectFit = imgNode.style.objectFit || 'cover';

      // Append image into container (dedupe if already there)
      if (imgNode.parentElement !== imageContainer) {
        imageContainer.appendChild(imgNode);
      }
    }
  } else {
    // No image found: create a decorative image placeholder only if user wants — but keep minimal
    // We'll avoid injecting large placeholders; instead add aria-hidden empty container
    imageContainer.setAttribute('aria-hidden', 'true');
  }

  // Remove other non-used direct children to keep block clean
  // Keep only textContent and imageContainer in desired order
  // If block previously had many children, remove them (be careful: we already removed headings/paragraphs)
  Array.from(block.children).forEach((child) => {
    if (child === textContent || child === imageContainer) return;
    // but don't remove if child has a data-keep attribute
    if (child.dataset && child.dataset.keep !== undefined) return;
    child.remove();
  });

  // Append textContent and imageContainer in a layout-friendly order.
  // For wide screens CSS expects text first then image; but if block has data-image-first, swap order.
  const imageFirst = block.dataset.imageFirst === 'true' || block.classList.contains('image-first');
  if (imageFirst) {
    if (imageContainer.parentElement !== block) block.appendChild(imageContainer);
    if (textContent.parentElement !== block) block.appendChild(textContent);
  } else {
    if (textContent.parentElement !== block) block.appendChild(textContent);
    if (imageContainer.parentElement !== block) block.appendChild(imageContainer);
  }

  // Accessibility: role and labeling
  // If the block already has aria-label or aria-labelledby, preserve it. Otherwise create an accessible label.
  if (!block.hasAttribute('role')) block.setAttribute('role', 'region');
  if (!block.hasAttribute('aria-labelledby')) {
    // create an id on maintext and reference it
    if (!main.id) main.id = `about-section-title-${Math.random().toString(36).slice(2, 9)}`;
    block.setAttribute('aria-labelledby', main.id);
  }

  // Add a small JS hook class to signal JS ran (useful for editors)
  block.classList.add('about-section--enhanced');

  // Optional: small responsive tweak via inline style if editor wants to override spacing on small screens
  // Only set if user provided data-compact attribute
  if (block.dataset.compact === 'true') {
    block.style.padding = '30px 4%';
  }

  // Expose a simple API on the element for future enhancements (safe to call in editor)
  // e.g., block._update({ title: 'New', body: '...' })
  block._update = function updateAbout(data = {}) {
    if (data.title) main.textContent = data.title;
    if (data.body) sub.innerHTML = typeof data.body === 'string' ? data.body : String(data.body);
    if (data.imageUrl) {
      // replace or create an <img>
      let img = imageContainer.querySelector('img');
      if (!img) {
        img = document.createElement('img');
        imageContainer.appendChild(img);
      }
      img.setAttribute('loading', 'lazy');
      img.setAttribute('src', data.imageUrl);
      if (data.alt !== undefined) img.setAttribute('alt', data.alt);
    }
  };

  // Return the block for convenience (useful if caller wants a reference)
  return block;
}
