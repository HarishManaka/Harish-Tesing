/**
 * about-section.js (Dynamic Universal Editor version)
 * AEM Edge Delivery / Franklin Decorator
 *
 * - Dynamically structures content into:
 *   .text-content (maintext + subtext)
 *   .image-container (img)
 * - No hardcoded text, colors, or inline styles.
 * - Works in Universal Editor (safe, idempotent).
 */

export default function decorate(block) {
  if (!(block instanceof HTMLElement)) return;

  // Core class
  block.classList.add('about-section');

  // --- STEP 1: Extract useful nodes dynamically ---
  const children = Array.from(block.children);
  const heading = children.find((el) => /^H[1-4]$/.test(el.tagName));
  const imageWrapper = children.find((el) =>
    el.tagName === 'IMG' || (el.querySelector && el.querySelector('img'))
  );
  const paragraphs = children.filter(
    (el) => el.tagName === 'P' && !el.closest('figure')
  );

  // --- STEP 2: Create text-content container ---
  let textContent = block.querySelector('.text-content');
  if (!textContent) {
    textContent = document.createElement('div');
    textContent.className = 'text-content';
  }

  // --- MAIN TEXT ---
  let main = textContent.querySelector('.maintext') || document.createElement('div');
  main.className = 'maintext';
  if (heading) {
    main.textContent = heading.textContent.trim();
    heading.remove();
  } else if (!main.textContent.trim() && paragraphs[0]) {
    main.textContent = paragraphs[0].textContent.trim();
  }

  // --- SUB TEXT ---
  let sub = textContent.querySelector('.subtext') || document.createElement('div');
  sub.className = 'subtext';
  if (paragraphs.length) {
    sub.innerHTML = paragraphs.map((p) => p.innerHTML).join('<br/><br/>');
    paragraphs.forEach((p) => p.remove());
  }

  // Clean and reappend
  textContent.replaceChildren(main, sub);

  // --- STEP 3: Create image-container ---
  let imageContainer = block.querySelector('.image-container');
  if (!imageContainer) {
    imageContainer = document.createElement('div');
    imageContainer.className = 'image-container';
  }

  // Move or create image node
  if (imageWrapper) {
    const imgNode =
      imageWrapper.tagName === 'IMG'
        ? imageWrapper
        : imageWrapper.querySelector('img');

    if (imgNode) {
      imgNode.loading = 'lazy';

      // Apply any data-src / data-srcset if present
      if (imgNode.dataset.src && !imgNode.src) {
        imgNode.src = imgNode.dataset.src;
      }
      if (imgNode.dataset.srcset && !imgNode.srcset) {
        imgNode.srcset = imgNode.dataset.srcset;
      }

      // Fallback alt from content
      if (!imgNode.alt) {
        imgNode.alt = main.textContent || 'About section image';
      }

      imageContainer.replaceChildren(imgNode);
    }
  }

  // --- STEP 4: Clean up block children and re-append structure ---
  Array.from(block.children).forEach((child) => {
    if (![textContent, imageContainer].includes(child)) child.remove();
  });

  const imageFirst = block.dataset.imageFirst === 'true' || block.classList.contains('image-first');
  block.replaceChildren(imageFirst ? imageContainer : textContent, imageFirst ? textContent : imageContainer);

  // --- STEP 5: Accessibility ---
  if (!block.hasAttribute('role')) block.setAttribute('role', 'region');
  if (!block.hasAttribute('aria-labelledby')) {
    if (!main.id) main.id = `about-title-${Math.random().toString(36).slice(2, 9)}`;
    block.setAttribute('aria-labelledby', main.id);
  }

  // --- STEP 6: JS enhancement flag ---
  block.classList.add('about-section--ready');

  // --- STEP 7: Simple update API for editor ---
  block._update = (data = {}) => {
    if (data.title) main.textContent = data.title;
    if (data.body) sub.innerHTML = data.body;
    if (data.image) {
      let img = imageContainer.querySelector('img') || document.createElement('img');
      img.src = data.image;
      if (data.alt) img.alt = data.alt;
      imageContainer.replaceChildren(img);
    }
  };

  return block;
}
