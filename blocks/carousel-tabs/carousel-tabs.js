import { loadCSS, loadScript } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

export default async function decorate(block) {
  // Load Swiper CSS if not already loaded
  await loadCSS('https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css');

  // Ensure Swiper is loaded - try CDN version first
  if (!window.Swiper) {
    try {
      // Try loading from CDN
      await loadScript('https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js');
      // Wait a moment for the script to execute
      await new Promise((resolve) => { setTimeout(resolve, 100); });
    } catch (cdnError) {
      // eslint-disable-next-line no-console
      console.warn('Failed to load Swiper from CDN, trying local file:', cdnError);
      // Fallback to local file
      await new Promise((resolve) => { setTimeout(resolve, 100); });
    }
  }

  // Get the data from the block
  const data = [...block.children].map((row) => [...row.children]
    .map((cell) => cell.textContent.trim()));

  const autoplay = data.find((row) => row[0] === 'autoplay')?.[1] || true;
  const loop = data.find((row) => row[0] === 'loop')?.[1] || true;

  // Get all card rows
  const cards = [...block.children];

  // Group cards by their tags
  const cardsByTag = groupCardsByTag(cards);

  // Create the new structure
  const section = document.createElement('section');
  section.id = 'nasm-carousel-tabs';

  // Create main container
  const container = document.createElement('div');
  container.className = 'nasm-carousel-tabs-container';

  // Create tabs navigation if there are multiple tags
  const tagNames = Object.keys(cardsByTag);
  if (tagNames.length > 1) {
    const tabsNav = createTabsNavigation(tagNames);
    container.appendChild(tabsNav);
  }

  // Create tab content containers
  const tabsContent = document.createElement('div');
  tabsContent.className = 'carousel-tabs-content';

  tagNames.forEach((tagName, tabIndex) => {
    const tabContent = createTabContent(
      cardsByTag[tagName],
      tagName,
      tabIndex,
      autoplay,
      loop,
      tagNames.length === 1, // isOnlyTab
    );
    tabsContent.appendChild(tabContent);
  });

  container.appendChild(tabsContent);
  section.appendChild(container);

  // Replace the block content
  block.textContent = '';
  block.appendChild(section);

  // Move instrumentation
  moveInstrumentation(block, section);

  // Initialize tabs functionality and swipers
  initializeTabsAndSwipers(section, tagNames.length > 1);
}

/**
 * Group cards by their tag field
 */
function groupCardsByTag(cards) {
  const cardsByTag = {};

  cards.forEach((card) => {
    // Extract tag from the card data structure
    // Look for tag in the data rows
    const rows = [...card.children];
    let tag = 'Default'; // Default tag if none specified

    // Find the tag row by searching through all rows for a tag pattern
    // Look for AEM tags that start with namespace: (like "nasm:") or contain tag-like patterns
    for (let i = 0; i < rows.length; i += 1) {
      const rowText = rows[i].textContent.trim();
      if (rowText && (
        rowText.startsWith('nasm:')
        || rowText.match(/^[a-zA-Z]+:[a-zA-Z0-9\-/]+$/)
        || (rowText.includes(':') && rowText.includes('/'))
      )) {
        // This looks like an AEM tag
        tag = rowText;
        break;
      }
    }

    // Clean up tag name for display
    tag = tag.replace(/^[^:]*:/, '').trim(); // Remove namespace if present
    tag = tag.replace(/^tabs\//, ''); // Remove 'tabs/' prefix at start
    tag = tag.replace(/-/g, ' '); // Replace hyphens with spaces
    tag = tag.replace(/\b\w/g, (l) => l.toUpperCase()); // Capitalize first letter of each word
    tag = tag || 'Default';

    if (!cardsByTag[tag]) {
      cardsByTag[tag] = [];
    }
    cardsByTag[tag].push(card);
  });

  return cardsByTag;
}

/**
 * Create tabs navigation
 */
function createTabsNavigation(tagNames) {
  const tabsNav = document.createElement('div');
  tabsNav.className = 'carousel-tabs-nav';

  const tabsList = document.createElement('ul');
  tabsList.className = 'carousel-tabs-list';
  tabsList.setAttribute('role', 'tablist');

  tagNames.forEach((tagName, index) => {
    const tabItem = document.createElement('li');
    tabItem.className = 'carousel-tab-item';

    const tabButton = document.createElement('button');
    tabButton.className = `carousel-tab-button ${index === 0 ? 'active' : ''}`;
    tabButton.textContent = tagName;
    tabButton.setAttribute('role', 'tab');
    tabButton.setAttribute('aria-selected', index === 0 ? 'true' : 'false');
    tabButton.setAttribute('aria-controls', `tab-content-${index}`);
    tabButton.setAttribute('id', `tab-${index}`);
    tabButton.dataset.tabIndex = index;

    tabItem.appendChild(tabButton);
    tabsList.appendChild(tabItem);
  });

  tabsNav.appendChild(tabsList);
  return tabsNav;
}

/**
 * Create tab content with carousel
 */
function createTabContent(cards, tagName, tabIndex, autoplay, loop, isOnlyTab) {
  // eslint-disable-next-line no-unused-vars
  const unused = { tagName, autoplay, loop }; // Acknowledge unused params for future use
  const tabContent = document.createElement('div');
  tabContent.className = `carousel-tab-content ${tabIndex === 0 || isOnlyTab ? 'active' : ''}`;
  tabContent.setAttribute('role', 'tabpanel');
  tabContent.setAttribute('aria-labelledby', `tab-${tabIndex}`);
  tabContent.setAttribute('id', `tab-content-${tabIndex}`);

  // Create swiper structure for this tab
  const swiper = document.createElement('div');
  swiper.className = `swiper carousel-tabs-swiper carousel-tabs-swiper-${tabIndex}`;

  const swiperWrapper = document.createElement('div');
  swiperWrapper.className = 'swiper-wrapper';

  // Process each card in this tab
  cards.forEach((card) => {
    const slide = createCardSlide(card);
    swiperWrapper.appendChild(slide);
  });

  swiper.appendChild(swiperWrapper);

  // Create navigation for this carousel
  const navigationContainer = document.createElement('div');
  navigationContainer.className = 'carousel-tabs-navigation';

  const pagination = document.createElement('div');
  pagination.className = `swiper-pagination carousel-tabs-pagination carousel-tabs-pagination-${tabIndex}`;

  navigationContainer.appendChild(pagination);

  tabContent.appendChild(swiper);
  tabContent.appendChild(navigationContainer);

  return tabContent;
}

/**
 * Create individual card slide
 */
function createCardSlide(card) {
  const slide = document.createElement('div');
  slide.className = 'swiper-slide carousel-tab-card';

  // Get all elements from the card structure
  const image = card.querySelector('img');
  const descriptionElement = card.children[1]; // Second child should be description
  const badgeElement = card.children[2]; // Third child should be badge
  const subtitleElement = card.children[3]; // Fourth child should be subtitle
  const linkElement = card.children[4].querySelector('a'); // Fifth child should be link

  // Create card container with background image
  const cardContainer = document.createElement('div');
  cardContainer.className = 'tab-card-container';

  if (image) {
    // Set the image as background
    cardContainer.style.backgroundImage = `url('${image.src}')`;
    cardContainer.style.backgroundSize = 'cover';
    cardContainer.style.backgroundPosition = 'center';
    cardContainer.style.backgroundRepeat = 'no-repeat';
    cardContainer.setAttribute('aria-label', image.alt || '');
  }

  if (linkElement) {
    const link = linkElement;
    const linkHref = link.href;
    const linkTitle = link.title.trim();

    const linkTag = document.createElement('a');
    linkTag.className = 'tab-card-link';
    linkTag.title = linkTitle;
    linkTag.href = linkHref;
    linkTag.setAttribute('aria-label', linkTitle);
    cardContainer.appendChild(linkTag);
  }

  // Add badge overlay on image (top-left)
  if (badgeElement && badgeElement.textContent.trim()) {
    const badge = document.createElement('div');
    badge.className = 'tab-card-badge';
    badge.textContent = badgeElement.textContent.trim();
    cardContainer.appendChild(badge);
  }

  // Create overlay for text content
  const overlay = document.createElement('div');
  overlay.className = 'tab-card-overlay';

  // Add subtitle (yellow text above description)
  if (subtitleElement && subtitleElement.textContent.trim()) {
    const subtitle = document.createElement('div');
    subtitle.className = 'tab-card-subtitle';
    subtitle.textContent = subtitleElement.textContent.trim();
    overlay.appendChild(subtitle);
  }

  // Create description content
  if (descriptionElement) {
    const description = document.createElement('div');
    description.className = 'tab-card-description';
    // Get the text content from the description element
    const descriptionText = descriptionElement.textContent || descriptionElement.innerHTML;
    description.innerHTML = descriptionText;
    overlay.appendChild(description);
  }

  const cardBackgroundOverlay = document.createElement('div');
  cardBackgroundOverlay.className = 'tab-card-background-overlay';

  cardContainer.appendChild(cardBackgroundOverlay);
  cardContainer.appendChild(overlay);
  slide.appendChild(cardContainer);

  return slide;
}

/**
 * Initialize tabs functionality and all swipers
 */
function initializeTabsAndSwipers(section, hasTabs) {
  // Initialize tab switching functionality if there are tabs
  if (hasTabs) {
    const tabButtons = section.querySelectorAll('.carousel-tab-button');
    const tabContents = section.querySelectorAll('.carousel-tab-content');

    tabButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const tabIndex = parseInt(button.dataset.tabIndex, 10);

        // Update active states
        tabButtons.forEach((btn) => {
          btn.classList.remove('active');
          btn.setAttribute('aria-selected', 'false');
        });
        tabContents.forEach((content) => content.classList.remove('active'));

        // Set active tab
        button.classList.add('active');
        button.setAttribute('aria-selected', 'true');
        section.querySelector(`#tab-content-${tabIndex}`).classList.add('active');
      });
    });
  }

  // Initialize all swipers after DOM is ready
  setTimeout(() => {
    const swiperContainers = section.querySelectorAll('.carousel-tabs-swiper');
    const SwiperConstructor = window.Swiper;

    if (!SwiperConstructor) {
      // eslint-disable-next-line no-console
      console.error('Swiper not available for Carousel Tabs');
      return;
    }

    swiperContainers.forEach((swiperContainer, index) => {
      const paginationEl = section.querySelector(`.carousel-tabs-pagination-${index}`);

      if (swiperContainer && paginationEl) {
        try {
          // Initialize swiper for this tab
          const carouselTabsSwiper = new SwiperConstructor(swiperContainer, {
            slidesPerView: 1.2,
            spaceBetween: 20,
            loop: false, // Disable loop for tab carousels
            autoplay: false, // Disable autoplay for tab carousels
            pagination: {
              el: paginationEl,
              clickable: true,
              dynamicBullets: false,
            },
            navigation: false,
            breakpoints: {
              640: {
                slidesPerView: 1.2,
                spaceBetween: 20,
              },
              768: {
                slidesPerView: 2.2,
                spaceBetween: 30,
                slidesOffsetBefore: 16,
                slidesOffsetAfter: 24,
              },
              1024: {
                slidesPerView: 4.2,
                spaceBetween: 24,
                slidesOffsetBefore: 10,
                slidesOffsetAfter: 24,
              },
            },
            // Ensure proper initialization
            observer: true,
            observeParents: true,
          });

          carouselTabsSwiper.on('slideChange', () => {});
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error(`Error initializing Carousel Tabs Swiper ${index}:`, error);
        }
      }
    });
  }, 250); // Give enough time for Swiper internals to initialize
}
