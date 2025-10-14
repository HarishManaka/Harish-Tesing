/**

* three-cards.js

* EDS Block - Three Card Layout

*/
 
export default function decorate(block) {

  const rows = Array.from(block.children);
 
  const container = document.createElement('div');

  container.classList.add('three-cards-container');
 
  rows.forEach((row) => {

    const [imgCol, titleCol, descCol, linkCol] = Array.from(row.children);
 
    const card = document.createElement('div');

    card.classList.add('three-card');
 
    // Image

    const img = imgCol.querySelector('img');

    if (img) {

      const imageWrapper = document.createElement('div');

      imageWrapper.classList.add('three-card-image');

      imageWrapper.append(img);

      card.append(imageWrapper);

    }
 
    // Title

    if (titleCol?.textContent.trim()) {

      const title = document.createElement('h3');

      title.classList.add('three-card-title');

      title.textContent = titleCol.textContent.trim();

      card.append(title);

    }
 
    // Description

    if (descCol?.textContent.trim()) {

      const desc = document.createElement('p');

      desc.classList.add('three-card-description');

      desc.textContent = descCol.textContent.trim();

      card.append(desc);

    }
 
    // Link

    if (linkCol?.textContent.trim()) {

      const link = document.createElement('a');

      link.classList.add('three-card-link');

      link.href = linkCol.textContent.trim();

      link.textContent = 'Learn More';

      card.append(link);

    }
 
    container.append(card);

  });
 
  block.textContent = '';

  block.append(container);

}

 