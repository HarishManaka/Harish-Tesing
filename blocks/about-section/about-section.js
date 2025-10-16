/**
 * about-section.js — Universal Editor / Edge Delivery version
 * Dynamically builds .maintext and .subtext while keeping content editable
 */

export default function decorate(block) {
  if (!(block instanceof HTMLElement)) return;

  block.classList.add('about-section');

  // --- STEP 1: Extract heading & text (work with nested divs too) ---
  const findFirst = (selector) => block.querySelector(selector);

  // Headings in authored content (may be inside div)
  const heading = findFirst('h1, h2, h3, h4');
  // Paragraphs or text blocks
  const paragraphs = Array.from(block.querySelectorAll('p'));

  // --- STEP 2: Ensure structure containers exist ---
  let textContent = block.querySelector('.text-content');
  if (!textContent) {
    textContent = document.createElement('div');
    textContent.className = 'text-content';
    block.append(textContent);
  }

  let main = textContent.querySelector('.maintext');
  if (!main) {
    main = document.createElement('div');
    main.className = 'maintext';
    textContent.append(main);
  }

  let sub = textContent.querySelector('.subtext');
  if (!sub) {
    sub = document.createElement('div');
    sub.className = 'subtext';
    textContent.append(sub);
  }

  // --- STEP 3: Fill in content (but do NOT delete authored nodes — important for Universal Editor) ---
  if (heading && !main.innerHTML.trim()) {
    main.innerHTML = heading.outerHTML; // preserve editability
  } else if (!heading && paragraphs[0] && !main.innerHTML.trim()) {
    main.innerHTML = `<p>${paragraphs[0].innerHTML}</p>`;
  }

  // Use remaining paragraphs for subtext
  const subParas = paragraphs.slice(heading ? 0 : 1);
  if (subParas.length && !sub.innerHTML.trim()) {
    sub.innerHTML = subParas.map((p) => `<p>${p.innerHTML}</p>`).join('');
  }

  // --- STEP 4: Handle image container ---
  let imageContainer = block.querySelector('.image-container');
  if (!imageContainer) {
    imageContainer = document.createElement('div');
    imageContainer.className = 'image-container';
    block.append(imageContainer);
  }

  const img = block.querySelector('img');
  if (img && !imageContainer.contains(img)) {
    imageContainer.append(img);
  }

  // --- STEP 5: Keep correct order (text first by default) ---
  const imageFirst = block.dataset.imageFirst === 'true' || block.classList.contains('image-first');
  block.replaceChildren(imageFirst ? imageContainer : textContent, imageFirst ? textContent : imageContainer);

  // --- STEP 6: Accessibility ---
  if (!block.hasAttribute('role')) block.setAttribute('role', 'region');
  if (!block.hasAttribute('aria-labelledby')) {
    const id = `about-${Math.random().toString(36).slice(2, 9)}`;
    main.id = id;
    block.setAttribute('aria-labelledby', id);
  }

  // --- STEP 7: Add a hook for JS enhancement ---
  block.classList.add('about-section--ready');

  // --- STEP 8: Live update API (used by editor or dynamic content) ---
  block._update = (data = {}) => {
    if (data.title) main.innerHTML = data.title;
    if (data.body) sub.innerHTML = data.body;
    if (data.image) {
      let imgTag = imageContainer.querySelector('img') || document.createElement('img');
      imgTag.loading = 'lazy';
      imgTag.src = data.image;
      if (data.alt) imgTag.alt = data.alt;
      imageContainer.replaceChildren(imgTag);
    }
  };

  return block;
}
