// Deployment trigger comment
import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  // Create ul container like cards
  const ul = document.createElement('ul');
  ul.className = 'homepage-brands-logo-grid';

  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    li.className = 'logo-grid-cell fade-in-place';
    moveInstrumentation(row, li);

    // Transfer all content from row to li
    while (row.firstElementChild) li.append(row.firstElementChild);

    // Process pictures within the li
    li.querySelectorAll('picture').forEach((picture) => {
      const img = picture.querySelector('img');
      if (img) {
        const optimizedPic = createOptimizedPicture(
          img.src,
          img.alt || 'placeholder',
          false,
          [{ width: '750' }],
        );

        moveInstrumentation(img, optimizedPic.querySelector('img'));

        // Look for an authored link inside this li
        const link = li.querySelector('a');
        if (link) {
          // Clear the extra <p> or <div> around the link
          link.innerHTML = '';
          link.appendChild(optimizedPic);
          // Replace the picture’s parent with the link
          picture.replaceWith(link);
        } else {
          picture.replaceWith(optimizedPic);
        }
      }
    });

    ul.append(li);
  });

  block.textContent = '';
  block.append(ul);
}
