// about-section.js
// Edge Delivery Services Block JS (Universal Editor Compatible)

export default async function decorate(block) {
  // Read model data from Franklin block JSON (Edge Delivery automatically maps model fields)
  const mainText = block.dataset.maintext || '';
  const subText = block.dataset.subtext || '';
  const imgSrc = block.dataset.img || '';

  // Create structure for About Section
  const aboutSection = document.createElement('section');
  aboutSection.className = 'about-section';

  // Create text content container
  const textContent = document.createElement('div');
  textContent.className = 'text-content';

  const mainTextEl = document.createElement('h2');
  mainTextEl.className = 'maintext';
  mainTextEl.textContent = mainText;

  const subTextEl = document.createElement('p');
  subTextEl.className = 'subtext';
  subTextEl.innerHTML = subText; // richtext allows markup

  textContent.append(mainTextEl, subTextEl);

  // Create image container
  const imageContainer = document.createElement('div');
  imageContainer.className = 'image-container';

  if (imgSrc) {
    const imgEl = document.createElement('img');
    imgEl.src = imgSrc;
    imgEl.alt = mainText || 'About image';
    imageContainer.append(imgEl);
  }

  // Append text and image to main section
  aboutSection.append(textContent, imageContainer);

  // Replace Franklin block content with built section
  block.textContent = '';
  block.append(aboutSection);

  // Optional: GA4 Config Validation
  const martechConfig = window.martechConfig || {};
  if (!martechConfig?.tags?.length) {
    console.warn('⚠️ No GA4 tag provided. Analytics events may not be tracked.');
  }
}
