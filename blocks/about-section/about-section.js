export default function decorate(block) {
  // Clear existing content
  block.textContent = '';

  // Create main container
  const aboutSection = document.createElement('div');
  aboutSection.className = 'about-section';

  // Create text container
  const textContent = document.createElement('div');
  textContent.className = 'text-content';

  // Read AEM Universal Editor fields dynamically
  // Assuming fields: title, about-description, img
  const titleField = block.querySelector('[data-field="title"]');
  const descField = block.querySelector('[data-field="about-description"]');
  const imgField = block.querySelector('[data-field="img"] img');

  // Create title
  const title = document.createElement('div');
  title.className = 'maintext';
  title.textContent = titleField ? titleField.textContent.trim() : 'About Section Title';

  // Create description
  const description = document.createElement('div');
  description.className = 'subtext';
  description.textContent = descField ? descField.textContent.trim() : 'This is the about section description.';

  // Append title and description to text container
  textContent.appendChild(title);
  textContent.appendChild(description);

  // Create image container
  const imageContainer = document.createElement('div');
  imageContainer.className = 'image-container';

  if (imgField) {
    const img = document.createElement('img');
    img.src = imgField.src;
    img.alt = imgField.alt || 'About Section Image';
    imageContainer.appendChild(img);
  }

  // Append text and image to main container
  aboutSection.appendChild(textContent);
  aboutSection.appendChild(imageContainer);

  // Append the constructed about-section to the block
  block.appendChild(aboutSection);
}
