export default function decorate(block) {
  // Retry if block is not ready yet
  if (!block.children || block.children.length === 0) {
    setTimeout(() => decorate(block), 50);
    return;
  }

  const mainText = block.children[0]?.textContent?.trim() || '';
  const subText = block.children[2]?.innerHTML?.trim() || '';

  // Handle image safely
  let imgEl = null;
  const imgField = block.children[1];
  if (imgField) {
    // If there’s already an <img> inside the div
    const existingImg = imgField.querySelector('img');
    if (existingImg) {
      imgEl = existingImg.cloneNode(true);
    } else {
      // If it's a reference div with a background-image (Edge Delivery pattern)
      const bgImage = imgField.style.backgroundImage;
      if (bgImage && bgImage !== 'none') {
        imgEl = document.createElement('img');
        // Extract URL from `url("...")`
        imgEl.src = bgImage.replace(/^url\(["']?/, '').replace(/["']?\)$/, '');
        imgEl.alt = mainText || 'About image';
      }
    }
  }

  // Clear block
  block.innerHTML = '';

  // Build About Section
  const aboutSection = document.createElement('section');
  aboutSection.className = 'about-section';

  // Text container
  const textDiv = document.createElement('div');
  textDiv.className = 'text-content';
  if (mainText) {
    const h2 = document.createElement('h2');
    h2.className = 'maintext';
    h2.textContent = mainText;
    textDiv.append(h2);
  }
  if (subText) {
    const p = document.createElement('p');
    p.className = 'subtext';
    p.innerHTML = subText;
    textDiv.append(p);
  }

  // Image container
  const imageContainer = document.createElement('div');
  imageContainer.className = 'image-container';
  if (imgEl) imageContainer.append(imgEl);

  // Append text and image
  aboutSection.append(textDiv, imageContainer);
  block.append(aboutSection);

  // Optional GA4 validation
  const martechConfig = window.martechConfig || {};
  if (!martechConfig?.tags?.length) {
    console.warn('⚠️ No GA4 tag provided. Analytics events may not be tracked.');
  }
}
