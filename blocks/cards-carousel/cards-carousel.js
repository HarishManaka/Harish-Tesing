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

  const cardsAutoplay = data.find((row) => row[0] === 'autoplay')?.[1] || true;
  const cardsLoop = data.find((row) => row[0] === 'loop')?.[1] || true;

  // Remove configuration rows from the block
  const configRows = block.querySelectorAll(':scope > div');
  configRows.forEach((row) => {
    if (row.children.length === 2
          && row.children[0].textContent.trim()
          && row.children[1].textContent.trim()) {
      // This looks like a config row, remove it
      row.remove();
    }
  });

  // Now process the remaining content as your carousel cards
  const cards = [...block.children];

  // Create the new structure
  const section = document.createElement('section');
  section.id = 'nasm-cards-carousel';

  // Create cards container
  const container = document.createElement('div');
  container.className = 'nasm-cards-carousel-container';

  // Create swiper structure
  const swiper = document.createElement('div');
  swiper.className = 'swiper cards-carousel-swiper';

  const swiperWrapper = document.createElement('div');
  swiperWrapper.className = 'swiper-wrapper';

  // Process each card
  cards.forEach((card) => {
    const slide = document.createElement('div');
    slide.className = 'swiper-slide carousel-card';

    // Get all elements from the card structure
    const image = card.querySelector('img');
    // Second child should be description
    const descriptionElement = card.children.length > 1 ? card.children[1] : null;
    // Third child should be badge
    const badgeElement = card.children.length > 2 ? card.children[2] : null;
    // Fourth child should be subtitle
    const subtitleElement = card.children.length > 3 ? card.children[3] : null;
    // Fifth child should be link
    const linkElement = card.children.length > 4 ? card.children[4].querySelector('a') : null;

    // Create card container with background image
    const cardContainer = document.createElement('div');
    cardContainer.className = 'card-container';

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
      linkTag.className = 'card-link';
      linkTag.title = linkTitle;
      linkTag.href = linkHref;
      linkTag.setAttribute('aria-label', linkTitle);
      cardContainer.appendChild(linkTag);
    }

    // Add badge overlay on image (top-left)
    if (badgeElement && badgeElement.textContent.trim()) {
      const badge = document.createElement('div');
      badge.className = 'card-badge';
      badge.textContent = badgeElement.textContent.trim();
      cardContainer.appendChild(badge);
    }

    // Create overlay for text content
    const overlay = document.createElement('div');
    overlay.className = 'card-overlay';

    // Add subtitle (yellow text above description)
    if (subtitleElement && subtitleElement.textContent.trim()) {
      const subtitle = document.createElement('div');
      subtitle.className = 'card-subtitle';
      subtitle.textContent = subtitleElement.textContent.trim();
      overlay.appendChild(subtitle);
    }

    // Create description content
    if (descriptionElement) {
      const description = document.createElement('div');
      description.className = 'card-description';
      // Get the text content from the description element
      const descriptionText = descriptionElement.textContent || descriptionElement.innerHTML;
      description.innerHTML = descriptionText;
      overlay.appendChild(description);
    }

    const cardBackgroundOverlay = document.createElement('div');
    cardBackgroundOverlay.className = 'card-background-overlay';

    cardContainer.appendChild(cardBackgroundOverlay);
    cardContainer.appendChild(overlay);
    slide.appendChild(cardContainer);
    swiperWrapper.appendChild(slide);
  });

  swiper.appendChild(swiperWrapper);
  container.appendChild(swiper);

  // Create unified navigation container with prev, pagination, next
  const navigationContainer = document.createElement('div');
  navigationContainer.className = 'cards-carousel-navigation';

  // Add pagination dots
  const pagination = document.createElement('div');
  pagination.className = 'swiper-pagination cards-carousel-pagination';

  navigationContainer.appendChild(pagination);
  container.appendChild(navigationContainer);

  section.appendChild(container);

  // Replace the block content
  block.textContent = '';
  block.appendChild(section);

  // Move instrumentation
  moveInstrumentation(block, section);

  // Initialize Swiper after ensuring DOM and scripts are ready
  setTimeout(() => {
    const swiperContainer = block.querySelector('.cards-carousel-swiper');
    const paginationEl = block.querySelector('.cards-carousel-pagination');

    // Check for Swiper availability
    const SwiperConstructor = window.Swiper;
    const autoplay = cardsAutoplay === true || cardsAutoplay === 'true'
      ? { delay: 4000, disableOnInteraction: false, pauseOnMouseEnter: true } : false;

    const loop = !!(cardsLoop === true || cardsLoop === 'true');

    if (swiperContainer && SwiperConstructor) {
      try {
        // Initialize the cards carousel swiper
        const cardsSwiper = new SwiperConstructor(swiperContainer, {
          slidesPerView: 1.2,
          spaceBetween: 20,
          loop,
          autoplay,
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

        cardsSwiper.on('slideChange', () => {});
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error initializing Cards Carousel Swiper:', error);
      }
    } else {
      // eslint-disable-next-line no-console
      console.error('Cards Carousel Swiper initialization failed', {
        windowSwiper: !!window.Swiper,
        swiperConstructor: !!SwiperConstructor,
        container: !!swiperContainer,
        pagination: !!paginationEl,
      });
    }
  }, 250); // Give enough time for Swiper internals to initialize
}
