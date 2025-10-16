// about-section.js
export default function decorate(block) {
  // Get fields by data-field attribute (Edge Delivery standard)
  const mainText = block.querySelector('[data-field="maintext"]')?.textContent?.trim() || '';
  const subText = block.querySelector('[data-field="subtext"]')?.innerHTML?.trim() || '';
  const imgEl = block.querySelector('[data-field="img"] img')?.cloneNode(true) || null;

  // Create main container
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

  // Append text and image to main section
  aboutSection.append(textDiv, imageContainer);

  // Replace original block content
  block.innerHTML = '';
  block.append(aboutSection);

  // Optional GA4 check
  const martechConfig = window.martechConfig || {};
  if (!martechConfig?.tags?.length) {
    console.warn('⚠️ No GA4 tag provided. Analytics events may not be tracked.');
  }
}

