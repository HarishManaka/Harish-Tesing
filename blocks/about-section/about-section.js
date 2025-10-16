export default function decorate(block) {

  // Extract data from the block rows (Edge Delivery reads content as table cells)

  const rows = [...block.children];
 
  // Create container elements

  const aboutSection = document.createElement('div');

  aboutSection.className = 'about-section';
 
  const textContent = document.createElement('div');

  textContent.className = 'text-content';
 
  const imageContainer = document.createElement('div');

  imageContainer.className = 'image-container';
 
  // Read block data (assumes author added: title | description | image)

  const [titleCell, descriptionCell, imageCell] = rows[0].children;
 
  // Title

  const title = document.createElement('div');

  title.className = 'maintext';

  title.textContent = titleCell ? titleCell.textContent.trim() : 'About Title';
 
  // Description

  const description = document.createElement('div');

  description.className = 'subtext';

  description.textContent = descriptionCell ? descriptionCell.textContent.trim() : 'About description goes here.';
 
  // Image

  const img = imageCell?.querySelector('img');

  if (img) {

    const image = document.createElement('img');

    image.src = img.src;

    image.alt = img.alt || 'About Image';

    imageContainer.appendChild(image);

  }
 
  // Assemble structure

  textContent.appendChild(title);

  textContent.appendChild(description);

  aboutSection.appendChild(textContent);

  aboutSection.appendChild(imageContainer);
 
  // Replace the original block content with new structure

  block.textContent = '';

  block.appendChild(aboutSection);

}

 
