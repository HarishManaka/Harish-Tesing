export default function decorate(block) {
  block.textContent = ''; // clear existing content

  // Main container
  const aboutSection = document.createElement('div');
  aboutSection.className = 'about-section';

  // Text container
  const textContent = document.createElement('div');
  textContent.className = 'text-content';

  // Read content from AEM fields
  const titleField = block.querySelector('[data-field="title"]');
  const descField = block.querySelector('[data-field="about-description"]');
  const imgField = block.querySelector('[data-field="img"] img');

  // Title
  if (titleField) {
    const title = document.createElement('div');
    title.className = 'maintext';
    title.textContent = titleField.textContent.trim();
    textContent.appendChild(title);
  }

  // Description
  if (descField) {
    const description = document.createElement('div');
    description.className = 'subtext';
    description.textContent = descField.textContent.trim();
    textContent.appendChild(description);
  }

  // Image container
  const imageContainer = document.createElement('div');
  imageContainer.className = 'image-container';
  if (imgField) {
    const img = document.createElement('img');
    img.src = imgField.src;
    img.alt = imgField.alt || '';
    imageContainer.appendChild(img);
  }

  // Append to main container
  aboutSection.appendChild(textContent);
  aboutSection.appendChild(imageContainer);

  // Add to block
  block.appendChild(aboutSection);
}
