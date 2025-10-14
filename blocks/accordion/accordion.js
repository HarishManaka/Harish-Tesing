import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  // Get all direct children divs
  const items = [...block.children];

  // Look for h2 title and content description
  let titleElement = null;
  let descriptionElement = null;
  let accordionItems = items;

  // Check if first item contains h2 (title)
  if (items.length > 0 && items[0].querySelector('h2')) {
    [titleElement] = items;
    accordionItems = items.slice(1);

    // Check if second item contains description (no h3)
    if (accordionItems.length > 0 && !accordionItems[0].querySelector('h3')) {
      [descriptionElement] = accordionItems;
      accordionItems = accordionItems.slice(1);
    }
  }

  // Create wrapper for accordion content
  const accordionWrapper = document.createElement('div');
  accordionWrapper.className = 'accordion-wrapper';

  // Process remaining items as accordion items
  accordionItems.forEach((item) => {
    // Each item should have a div containing the content
    const contentDiv = item.querySelector(':scope > div');
    if (!contentDiv) return;

    // Find the h3 element (accordion header)
    const header = contentDiv.querySelector('h3');
    if (!header) return;

    // Create accordion structure
    const accordionItem = document.createElement('div');
    accordionItem.className = 'accordion-item';

    // Create header button
    const button = document.createElement('button');
    button.className = 'accordion-header';
    button.setAttribute('aria-expanded', 'false');

    // Move h3 content to button
    button.innerHTML = header.innerHTML;
    button.id = header.id || `accordion-header-${Math.random().toString(36).substring(2, 11)}`;

    // Create content panel
    const panel = document.createElement('div');
    panel.className = 'accordion-panel';
    panel.setAttribute('aria-labelledby', button.id);
    panel.id = `accordion-panel-${Math.random().toString(36).substring(2, 11)}`;
    button.setAttribute('aria-controls', panel.id);

    // Move all content after h3 to panel
    const allElements = [...contentDiv.children];
    const h3Index = allElements.indexOf(header);

    // Get all elements after the h3
    const contentElements = allElements.slice(h3Index + 1);

    // Move each element to the panel
    contentElements.forEach((element) => {
      panel.appendChild(element);
    });

    // Remove original h3
    header.remove();

    // Build new structure
    accordionItem.appendChild(button);
    accordionItem.appendChild(panel);

    // Add to wrapper instead of replacing item
    accordionWrapper.appendChild(accordionItem);

    // Add click handler
    button.addEventListener('click', () => {
      const isExpanded = button.getAttribute('aria-expanded') === 'true';

      // Close all other accordion items
      if (!isExpanded) {
        accordionWrapper.querySelectorAll('.accordion-item').forEach((otherItem) => {
          if (otherItem !== accordionItem) {
            otherItem.classList.remove('active');
            otherItem.querySelector('.accordion-header').setAttribute('aria-expanded', 'false');
          }
        });
      }

      // Toggle current item
      button.setAttribute('aria-expanded', !isExpanded);
      accordionItem.classList.toggle('active');
    });
  });

  // Rebuild the block structure
  block.innerHTML = '';
  // Add title if exists
  if (titleElement) {
    block.appendChild(titleElement);
  }

  // Add accordion wrapper
  block.appendChild(accordionWrapper);

  // Add description after accordion if exists
  if (descriptionElement) {
    descriptionElement.classList.add('accordion-footer');
    block.appendChild(descriptionElement);
  }

  // Move instrumentation if needed
  moveInstrumentation(block, accordionWrapper);
}
