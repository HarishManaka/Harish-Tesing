export default function decorate(block) {
  // Get the data from the block
  const data = [...block.children].map((row) => [...row.children]
    .map((cell) => cell.textContent.trim()));

  // Extract the content
  const heading = data.find((row) => row[0] === 'heading')?.[1] || '';
  const headingType = data.find((row) => row[0] === 'headingType')?.[1] || 'h2';
  const description = data.find((row) => row[0] === 'description')?.[1] || '';
  const ctaText = data.find((row) => row[0] === 'ctaLinkText')?.[1] || '';
  const ctaStyle = data.find((row) => row[0] === 'ctaLinkStyle')?.[1] || 'primary';
  const imageStyle = data.find((row) => row[0] === 'imageStyle')?.[1] || 'circular';
  const theme = data.find((row) => row[0] === 'theme')?.[1] || 'dark';

  // Find the image element
  const imageElement = block.querySelector('img');

  // Extract CTA from EDS structure - look for button-container or direct link
  const rows = [...block.children];
  const ctaRow = rows.find((row) => {
    const cells = [...row.children];
    return cells[1] && (cells[1].querySelector('.button-container') || cells[1].querySelector('a'));
  });

  let ctaButton = null;
  if (ctaRow) {
    ctaButton = ctaRow.querySelector('a.button') || ctaRow.querySelector('a');
  }

  // Apply theme class to block
  if (theme) {
    block.classList.add(theme);
  }

  // Create the hero card structure
  const heroContainer = document.createElement('div');
  heroContainer.className = 'hero-card-container';

  // Create left column with image
  const imageColumn = document.createElement('div');
  imageColumn.className = `hero-card-image ${imageStyle}`;

  if (imageElement) {
    // Clone the image to preserve attributes
    const clonedImage = imageElement.cloneNode(true);
    imageColumn.appendChild(clonedImage);
  }

  // Create right column with content
  const contentColumn = document.createElement('div');
  contentColumn.className = 'hero-card-content';

  // Add heading
  if (heading) {
    const headingElement = document.createElement(headingType);
    headingElement.className = 'hero-card-heading';
    headingElement.textContent = heading;
    contentColumn.appendChild(headingElement);
  }

  // Add description
  if (description) {
    const descriptionElement = document.createElement('p');
    descriptionElement.className = 'hero-card-description';
    descriptionElement.textContent = description;
    contentColumn.appendChild(descriptionElement);
  }

  // Add CTA button if found
  if (ctaButton) {
    const ctaContainer = document.createElement('div');
    ctaContainer.className = 'hero-card-cta';

    // Clone the button and add hero-card specific classes
    const clonedButton = ctaButton.cloneNode(true);
    clonedButton.classList.add('button');
    if (ctaStyle) {
      clonedButton.classList.add(ctaStyle);
    }

    // Update button text if specified
    if (ctaText) {
      clonedButton.textContent = ctaText;
    }

    ctaContainer.appendChild(clonedButton);
    contentColumn.appendChild(ctaContainer);
  }

  // Assemble the hero card
  heroContainer.appendChild(imageColumn);
  heroContainer.appendChild(contentColumn);

  // Replace block content
  block.textContent = '';
  block.appendChild(heroContainer);
}
