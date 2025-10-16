export default function decorate(block) {
  // Clear existing content
  block.textContent = '';

  // Create main container
  const aboutSection = document.createElement('div');
  aboutSection.className = 'about-section';

  // Create text container
  const textContent = document.createElement('div');
  textContent.className = 'text-content';

  // Create title
  const title = document.createElement('div');
  title.className = 'maintext';
  // Example title, can replace with dynamic content from block.dataset or CMS
  title.textContent = block.dataset.title || 'About Section Title';

  // Create description
  const description = document.createElement('div');
  description.className = 'subtext';
  // Example description
  description.textContent = block.dataset.description || 'This is the about section description.';

  // Append title and description to text container
  textContent.appendChild(title);
  textContent.appendChild(description);

  // Create image container
  const imageContainer = document.createElement('div');
  imageContainer.className = 'image-container';

  // Create image element
  const img = document.createElement('img');
  // Example image, can replace with dynamic URL
  img.src = block.dataset.img || 'https://via.placeholder.com/700x400';
  img.alt = block.dataset.imgAlt || 'About Section Image';

  imageContainer.appendChild(img);

  // Append text and image to main container
  aboutSection.appendChild(textContent);
  aboutSection.appendChild(imageContainer);

  // Append the constructed about-section to the block
  block.appendChild(aboutSection);
}
