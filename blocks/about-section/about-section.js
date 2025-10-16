export default function decorate(block) {
  // If already decorated, skip
  if (block.querySelector('.about-section')) return;

  // Create main container
  const aboutSection = document.createElement('div');
  aboutSection.className = 'about-section';

  // Wrap text content
  const textContent = document.createElement('div');
  textContent.className = 'text-content';

  const mainTextField = block.querySelector('[data-field="maintext"]');
  const subTextField = block.querySelector('[data-field="subtext"]');

  if (mainTextField) {
    mainTextField.classList.add('maintext');
    textContent.appendChild(mainTextField);
  }

  if (subTextField) {
    subTextField.classList.add('subtext');
    textContent.appendChild(subTextField);
  }

  // Wrap image content
  const imageContainer = document.createElement('div');
  imageContainer.className = 'image-container';

  const imgField = block.querySelector('[data-field="img"] img');
  if (imgField) {
    imageContainer.appendChild(imgField);
  }

  // Build structure
  aboutSection.appendChild(textContent);
  aboutSection.appendChild(imageContainer);

  // Clear original block and append new structure
  block.textContent = '';
  block.appendChild(aboutSection);
}
