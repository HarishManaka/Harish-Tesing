export default function decorate(block) {
  // Clear any existing content
  block.textContent = '';

  // Create main container
  const aboutSection = document.createElement('div');
  aboutSection.className = 'about-section';

  // Create text container
  const textContent = document.createElement('div');
  textContent.className = 'text-content';

  // Dynamically select fields from the block
  const titleField = block.querySelector('[data-field="title"]');
  const descField = block.querySelector('[data-field="about-description"]');
  const imgField = block.querySelector('[data-field="img"] img');

  // Only create title if it exists
  if (titleField) {
    const title = document.createElement('div');
    title.className = 'maintext';
    title.textContent = titleField.textContent.trim();
    textContent.appendChild(title);
  }

  // Only create description if it exists
  if (descField) {
    const description = document.createElement('div');
    description.className = 'subtext';
    description.textContent = descField.textContent.trim();
    textContent.appendChild(description);
  }

  // Create image container
  const imageContainer = document.createElement('div');
  imageContainer.className = 'image-container';

  if (imgField) {
    const img = document.createElement('img');
    img.src = imgField.src;
    img.alt = imgField.alt || '';
    imageContainer.appendChild(img);
  }

  // Append text and image containers to main section
  aboutSection.appendChild(textContent);
  aboutSection.appendChild(imageContainer);

  // Append the fully constructed section to the block
  block.appendChild(aboutSection);
}

