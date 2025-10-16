// about-section.js
// Edge Delivery (Franklin) block for "About Section"

export default function decorate(block) {
  // Expected structure (rows from Universal Editor):
  // Row 1 → maintext
  // Row 2 → img
  // Row 3 → subtext

  const rows = Array.from(block.children);

  const mainText = rows[0]?.textContent?.trim() || '';
  const imgEl = rows[1]?.querySelector('img') || null;
  const subText = rows[2]?.innerHTML?.trim() || '';

  // Create main wrapper
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
    p.innerHTML = subText; // richtext allowed
    textDiv.append(p);
  }

  // Image container
  const imageContainer = document.createElement('div');
  imageContainer.className = 'image-container';
  if (imgEl) imageContainer.append(imgEl);

  // Append text and image
  aboutSection.append(textDiv, imageContainer);

  // Replace original block content
  block.textContent = '';
  block.append(aboutSection);

  // ✅ Optional: GA4 validation
  const martechConfig = window.martechConfig || {};
  if (!martechConfig?.tags?.length) {
    console.warn('⚠️ No GA4 tag provided. Analytics events may not be tracked.');
  }
}
