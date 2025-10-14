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

  // Get all story rows
  const stories = [...block.children];

  // Create the new structure
  const section = document.createElement('section');
  section.id = 'nasm-story-carousel';

  // Create stories container
  const container = document.createElement('div');
  container.className = 'nasm-story-carousel-container';

  // Create swiper structure
  const swiper = document.createElement('div');
  swiper.className = 'swiper story-carousel-swiper';

  const swiperWrapper = document.createElement('div');
  swiperWrapper.className = 'swiper-wrapper';

  // Process each story
  stories.forEach((story) => {
    const slide = document.createElement('div');
    slide.className = 'swiper-slide story-card';

    // Get the data from the story row
    const cells = [...story.children];
    let image;
    let imageAlt = '';
    let quote = '';
    let personName = '';
    let personRole = '';

    // Extract data based on the structure
    // (assuming image, imageAlt, quote, personName, personRole)
    if (cells[0]) {
      image = cells[0].querySelector('img');
      if (image) {
        imageAlt = image.alt || '';
      }
    }
    if (cells[1]) {
      quote = cells[1].innerHTML || cells[2].textContent;
    }
    if (cells[2]) {
      personName = cells[2].textContent.trim();
    }
    if (cells[3]) {
      personRole = cells[3].textContent.trim();
    }

    // Create story card container with background image
    const storyContainer = document.createElement('div');
    storyContainer.className = 'story-container';

    if (image) {
      // Set the image as background
      storyContainer.style.backgroundImage = `url('${image.src}')`;
      storyContainer.style.backgroundSize = 'cover';
      storyContainer.style.backgroundPosition = 'center';
      storyContainer.style.backgroundRepeat = 'no-repeat';
      storyContainer.setAttribute('aria-label', imageAlt || '');
    }

    // Create overlay for text content
    const overlay = document.createElement('div');
    overlay.className = 'story-overlay';

    // Create person info section
    if (personName || personRole) {
      const personInfo = document.createElement('div');
      personInfo.className = 'story-person-info';

      if (personName) {
        const nameElement = document.createElement('div');
        nameElement.className = 'story-person-name';
        nameElement.textContent = personName;
        personInfo.appendChild(nameElement);
      }

      if (personRole) {
        const titleElement = document.createElement('div');
        titleElement.className = 'story-person-title';
        titleElement.textContent = personRole;
        personInfo.appendChild(titleElement);
      }

      overlay.appendChild(personInfo);
    }

    // Create quote content
    if (quote) {
      const quoteElement = document.createElement('div');
      quoteElement.className = 'story-quote';
      quoteElement.innerHTML = quote;
      overlay.appendChild(quoteElement);
    }

    storyContainer.appendChild(overlay);
    slide.appendChild(storyContainer);
    swiperWrapper.appendChild(slide);
  });

  swiper.appendChild(swiperWrapper);
  container.appendChild(swiper);

  // Create unified navigation container with prev, pagination, next
  const navigationContainer = document.createElement('div');
  navigationContainer.className = 'story-carousel-navigation';

  // Add pagination dots
  const pagination = document.createElement('div');
  pagination.className = 'swiper-pagination story-carousel-pagination';

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
    const swiperContainer = block.querySelector('.story-carousel-swiper');
    const paginationEl = block.querySelector('.story-carousel-pagination');

    // Check for Swiper availability
    const SwiperConstructor = window.Swiper;

    if (swiperContainer && SwiperConstructor) {
      try {
        // Initialize the story carousel swiper
        const storySwiper = new SwiperConstructor(swiperContainer, {
          slidesPerView: 1,
          spaceBetween: 15,
          loop: false,
          // autoplay: {
          //   delay: 5000,
          //   disableOnInteraction: false,
          //   pauseOnMouseEnter: true,
          // },
          pagination: {
            el: paginationEl,
            clickable: true,
            dynamicBullets: false,
          },
          navigation: false,
          breakpoints: {
            640: {
              slidesPerView: 1,
              spaceBetween: 15,
            },
            768: {
              slidesPerView: 2,
              spaceBetween: 20,
            },
            1024: {
              slidesPerView: 3.6,
              spaceBetween: 24,
              slidesOffsetBefore: 10,
              slidesOffsetAfter: 24,
            },
          },
          // Ensure proper initialization
          observer: true,
          observeParents: true,
        });

        storySwiper.on('slideChange', () => {});
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error initializing Story Carousel Swiper:', error);
      }
    } else {
      // eslint-disable-next-line no-console
      console.error('Story Carousel Swiper initialization failed', {
        windowSwiper: !!window.Swiper,
        swiperConstructor: !!SwiperConstructor,
        container: !!swiperContainer,
        pagination: !!paginationEl,
      });
    }
  }, 250); // Give enough time for Swiper internals to initialize
}
