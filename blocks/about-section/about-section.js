export default function decorate(block) {
  // Clear any existing content
  block.textContent = '';

  // Create main container
  const aboutSection = document.createElement('div');
  aboutSection.className = 'about-section';

  // Create text container
  const textContent = document.createElement('div');
  textContent.className = 'text-content';

  // Dynamically read fields
  const mainTextField = block.querySelector('[data-field="maintext"]');
  const subTextField = block.querySelector('[data-field="subtext"]');
  const imgField = block.querySelector('[data-field="img"] img');

  // Main text
  if (mainTextField) {
    const mainText = document.createElement('div');
    mainText.className = 'maintext';
    mainText.textContent = mainTextField.textContent.trim();
    textContent.appendChild(mainText);
  }

  // Sub text
  if (subTextField) {
    const subText = document.createElement('div');
    subText.className = 'subtext';
    subText.innerHTML = subTextField.innerHTML; // richtext supports HTML
    textContent.appendChild(subText);
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

  // Append text and image containers
  aboutSection.appendChild(textContent);
  aboutSection.appendChild(imageContainer);

  // Add to block
  block.appendChild(aboutSection);
}
