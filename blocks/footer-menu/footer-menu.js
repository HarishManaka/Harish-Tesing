// Deployment trigger comment
export default async function decorate(block) {
  const wrapper = document.createElement('div');
  wrapper.className = 'footer-menu-wrapper';
  wrapper.setAttribute('role', 'navigation');
  wrapper.setAttribute('aria-label', 'Footer navigation');

  const ulElements = block.querySelectorAll('ul');
  let menuIndex = 0;

  ulElements.forEach((ulElement) => {
    const heading = ulElement.previousElementSibling;
    const menuId = `footer-menu-${menuIndex}`;
    const contentId = `footer-menu-content-${menuIndex}`;
    menuIndex += 1;

    const menuItem = document.createElement('div');
    menuItem.className = 'footer-menu-item';

    // Create button instead of h3 for better accessibility
    const button = document.createElement('button');
    button.className = 'footer-menu-item-title';
    button.setAttribute('type', 'button');
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-controls', contentId);
    button.setAttribute('id', menuId);

    // Wrap title in span for styling
    const titleSpan = document.createElement('span');
    titleSpan.textContent = heading.textContent;
    button.appendChild(titleSpan);

    // Function to toggle menu
    const toggleMenu = () => {
      // Only toggle on mobile (< 768px)
      if (window.innerWidth < 768) {
        const isExpanded = menuItem.classList.contains('active');
        menuItem.classList.toggle('active');
        button.setAttribute('aria-expanded', !isExpanded);

        // Announce state change to screen readers
        const announcement = !isExpanded ? 'Menu expanded' : 'Menu collapsed';
        const liveRegion = document.getElementById('footer-menu-live-region');
        if (liveRegion) {
          liveRegion.textContent = `${titleSpan.textContent} ${announcement}`;
        }
      }
    };

    // Add click handler
    button.addEventListener('click', toggleMenu);

    // Add keyboard support
    button.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleMenu();
      }
    });

    menuItem.appendChild(button);

    const subitemWrapper = document.createElement('div');
    subitemWrapper.className = 'footer-menu-subitem-wrapper';
    subitemWrapper.setAttribute('id', contentId);
    subitemWrapper.setAttribute('role', 'region');
    subitemWrapper.setAttribute('aria-labelledby', menuId);

    const liElements = ulElement.querySelectorAll('li');
    liElements.forEach((liElement) => {
      const aElement = liElement.querySelector('a');
      if (aElement) {
        const link = document.createElement('a');
        link.href = aElement.href;
        link.className = 'footer-menu-subitem';
        link.textContent = aElement.textContent;

        if (aElement.target) {
          link.target = aElement.target;
        }

        subitemWrapper.appendChild(link);
      } else {
        const link = document.createElement('a');
        link.href = '#';
        link.className = 'footer-menu-subitem';
        link.textContent = liElement.textContent;
        subitemWrapper.appendChild(link);
      }
    });

    menuItem.appendChild(subitemWrapper);
    wrapper.appendChild(menuItem);

    heading.remove();
    ulElement.remove();
  });

  // Add live region for screen reader announcements
  const liveRegion = document.createElement('div');
  liveRegion.setAttribute('id', 'footer-menu-live-region');
  liveRegion.setAttribute('role', 'status');
  liveRegion.setAttribute('aria-live', 'polite');
  liveRegion.setAttribute('aria-atomic', 'true');
  liveRegion.className = 'sr-only';
  wrapper.appendChild(liveRegion);

  // Set initial aria-expanded state based on viewport
  const updateAriaExpanded = () => {
    const buttons = wrapper.querySelectorAll('.footer-menu-item-title');
    buttons.forEach((button) => {
      if (window.innerWidth >= 768) {
        button.setAttribute('aria-expanded', 'true');
      } else {
        const menuItem = button.closest('.footer-menu-item');
        button.setAttribute('aria-expanded', menuItem.classList.contains('active'));
      }
    });
  };

  // Update on resize
  window.addEventListener('resize', updateAriaExpanded);
  updateAriaExpanded();

  block.appendChild(wrapper);
}
