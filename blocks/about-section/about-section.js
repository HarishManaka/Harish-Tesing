
export default function decorate(block) {
  if (!(block instanceof HTMLElement)) return;

  block.classList.add('about-section');

  // Step 1: Find headings and paragraphs
  const heading = block.querySelector('h1, h2, h3, h4');
  const paragraphs = Array.from(block.querySelectorAll('p'));

  // Step 2: Create containers if missing
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

  // Step 3: Fill main text
  if (heading && !main.innerHTML.trim()) {
    main.appendChild(heading); // move heading into main
  } else if (!heading && paragraphs.length && !main.innerHTML.trim()) {
    // Move the first paragraph to main
    main.appendChild(paragraphs[0]);
  }

  // Step 4: Fill subtext with remaining paragraphs
  const remainingParas = paragraphs.filter(p => p.parentElement !== main);
  remainingParas.forEach(p => sub.appendChild(p));

  // Step 5: Handle image container
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

  // Step 6: Ensure order
  const imageFirst = block.dataset.imageFirst === 'true' || block.classList.contains('image-first');
  block.replaceChildren(imageFirst ? imageContainer : textContent, imageFirst ? textContent : imageContainer);

  // Step 7: Accessibility
  if (!block.hasAttribute('role')) block.setAttribute('role', 'region');
  if (!block.hasAttribute('aria-labelledby')) {
    const id = `about-${Math.random().toString(36).slice(2, 9)}`;
    main.id = id;
    block.setAttribute('aria-labelledby', id);
  }

  // Step 8: JS hook
  block.classList.add('about-section--ready');

  // Step 9: Live update API
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
