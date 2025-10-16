export default function decorate(block) {
  block.textContent = '';

  const aboutSection = document.createElement('div');
  aboutSection.className = 'about-section';

  const textContent = document.createElement('div');
  textContent.className = 'text-content';

  // Universal Editor fields
  const mainTextField = block.querySelector('[data-field="maintext"]');
  const subTextField = block.querySelector('[data-field="subtext"]');
  const imgField = block.querySelector('[data-field="img"] img');

  if (mainTextField) {
    const mainText = document.createElement('div');
    mainText.className = 'maintext';
    mainText.textContent = mainTextField.textContent.trim();
    textContent.appendChild(mainText);
  }

  if (subTextField) {
    const subText = document.createElement('div');
    subText.className = 'subtext';
    subText.innerHTML = subTextField.innerHTML;
    textContent.appendChild(subText);
  }

  const imageContainer = document.createElement('div');
  imageContainer.className = 'image-container';
  if (imgField) {
    const img = document.createElement('img');
    img.src = imgField.src;
    img.alt = imgField.alt || '';
    imageContainer.appendChild(img);
  }

  aboutSection.appendChild(textContent);
  aboutSection.appendChild(imageContainer);
  block.appendChild(aboutSection);
}
