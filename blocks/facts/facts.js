import {
  createOptimizedPicture,
} from '../../scripts/aem.js';
import {
  moveInstrumentation,
} from '../../scripts/scripts.js';

export default function decorate(block) {
  /* change to ul, li */
  const factsContainer = document.createElement('div');
  const factsContent = document.createElement('div');

  factsContainer.className = 'facts-container';
  factsContent.className = 'facts-content';

  const ul = document.createElement('ul');

  ul.className = 'facts-grid';

  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    li.className = 'facts-fact-item';
    moveInstrumentation(row, li);
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'facts-fact-image';
      else div.className = 'facts-fact-body';
    });

    // Check if facts-fact-body is empty and remove the li if it is
    const factBody = li.querySelector('.facts-fact-body');
    if (factBody && (!factBody.textContent.trim() && factBody.children.length === 0)) {
      // Skip adding this li to the ul if facts-fact-body is empty
      return;
    }

    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{
      width: '750',
    }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture').replaceWith(optimizedPic);
  });
  factsContent.append(ul);
  factsContainer.append(factsContent);
  block.textContent = '';
  block.append(factsContainer);

  // Set up intersection observer for scroll animation
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.8,
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        // Add animation class when component is in view
        const factsItems = entry.target.querySelectorAll('.facts-fact-item');
        factsItems.forEach((item, index) => {
          setTimeout(() => {
            item.classList.add('animate-in');
          }, index * 300); // Stagger animation by 300ms
        });

        // Stop observing once animation is triggered
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Start observing the hero container
  observer.observe(factsContainer);
}
