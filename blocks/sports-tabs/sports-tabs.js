// eslint-disable-next-line import/no-unresolved
import {
  toClassName,
} from '../../scripts/aem.js';

export default async function decorate(block) {
  // build tablist
  const tablist = document.createElement('div');
  tablist.className = 'sports-tabs-list';
  tablist.setAttribute('role', 'tablist');

  // Get the data from the block
  const data = [...block.children].map((row) => [...row.children]
    .map((cell) => cell.textContent.trim()));

  const colorScheme = data.find((row) => row[0] === 'colorScheme')?.[1] || 'light';

  block.classList.add(`${colorScheme}`);

  // Remove configuration rows from the block
  const configRows = block.querySelectorAll(':scope > div');
  configRows.forEach((row) => {
    if (row.children.length === 2
      && row.children[0].textContent.trim()) {
      // This looks like a config row, remove it
      row.remove();
    }
  });

  // decorate tabs and tabpanels
  const tabs = [...block.children].map((child) => child.firstElementChild);

  tabs.forEach((tab, i) => {
    const id = toClassName(tab.textContent);

    // decorate tabpanel
    const tabpanel = block.children[i];
    tabpanel.className = 'sports-tabs-panel';
    tabpanel.id = `sports-tabpanel-${id}`;
    tabpanel.setAttribute('aria-hidden', !!i);
    tabpanel.setAttribute('aria-labelledby', `sports-tab-${id}`);
    tabpanel.setAttribute('role', 'tabpanel');

    // extract tab content (title, image, alt text, description)
    const tabContent = tabpanel.children;
    const title = tab.textContent;

    // Find image, alt text, and description from the tab content
    let image = null;
    let description = null;
    // Process tab content to extract image and description
    Array.from(tabContent).forEach((element, index) => {
      if (element.tagName === 'PICTURE' || element.querySelector('img')) {
        image = element.querySelector('img') || element;
      } else if (index === 2) { // index 2 is description as image and alt are together in index 1
        if (!description) {
          description = element;
        }
      }
    });

    // Clear the tabpanel and rebuild with structured content
    tabpanel.innerHTML = '';

    // Add image if present
    if (image) {
      const imageContainer = document.createElement('div');
      imageContainer.className = 'sports-tab-image';
      imageContainer.appendChild(image.cloneNode(true));
      tabpanel.appendChild(imageContainer);
    }

    // Add description when present
    if (description) {
      const descriptionContainer = document.createElement('div');
      descriptionContainer.className = 'sports-tab-description';
      descriptionContainer.innerHTML = description.innerHTML;
      tabpanel.appendChild(descriptionContainer);
    }

    // build tab button
    const button = document.createElement('button');
    button.className = 'sports-tabs-tab';
    button.id = `sports-tab-${id}`;
    button.innerHTML = title;
    button.setAttribute('aria-controls', `sports-tabpanel-${id}`);
    button.setAttribute('aria-selected', !i);
    button.setAttribute('role', 'tab');
    button.setAttribute('type', 'button');
    button.addEventListener('click', () => {
      block.querySelectorAll('[role=tabpanel]').forEach((panel) => {
        panel.setAttribute('aria-hidden', true);
      });
      tablist.querySelectorAll('button').forEach((btn) => {
        btn.setAttribute('aria-selected', false);
      });
      tabpanel.setAttribute('aria-hidden', false);
      button.setAttribute('aria-selected', true);
    });
    tablist.append(button);
    tab.remove();
  });

  block.prepend(tablist);
}
