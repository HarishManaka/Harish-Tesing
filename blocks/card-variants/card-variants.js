import { loadCSS, loadScript } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

// Helper function to check if URL is external
function isExternalLink(url) {
  try {
    const link = new URL(url, window.location.href);
    return link.hostname !== window.location.hostname;
  } catch {
    return false;
  }
}

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

  const isCarousel = data.find((row) => row[0] === 'carousel')?.[1] === 'true';
  const cardSize = data.find((row) => row[0] === 'cardSize')?.[1] || 'medium';
  const variant = data.find((row) => row[0] === 'variant')?.[1] || 'variant1';
  const cardsAutoplay = data.find((row) => row[0] === 'autoplay')?.[1] || true;
  const cardsLoop = data.find((row) => row[0] === 'loop')?.[1] || true;

  // Parse styles field - can be multiselect with comma-separated values
  const stylesConfig = data.find((row) => row[0] === 'styles')?.[1] || 'default';
  const styles = stylesConfig.split(',').map((style) => style.trim().toLowerCase());

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
  section.id = 'nasm-card-variants';

  // Map style options to CSS classes
  const getSpacingClass = () => {
    if (styles.includes('space between') || styles.includes('space-between')) return 'card-spacing--space-between';
    if (styles.includes('space evenly') || styles.includes('space-evenly')) return 'card-spacing--space-evenly';
    return 'card-spacing--default';
  };

  // Build the class string with all applicable styles
  const spacingClass = getSpacingClass();
  section.className = `card-size--${cardSize} card-variant--${variant} ${spacingClass}`;

  // Create cards container
  const container = document.createElement('div');
  container.className = 'nasm-card-variants-container';

  // Create structure based on carousel mode
  let cardsContainer;
  let swiperWrapper;

  if (isCarousel) {
    // Create swiper structure for carousel mode
    const swiper = document.createElement('div');
    swiper.className = 'swiper card-variants-swiper';

    swiperWrapper = document.createElement('div');
    swiperWrapper.className = 'swiper-wrapper';

    swiper.appendChild(swiperWrapper);
    cardsContainer = swiper;
  } else {
    // Create grid structure for static mode
    cardsContainer = document.createElement('div');
    cardsContainer.className = 'card-variants-grid';
    swiperWrapper = cardsContainer; // Use same variable for card appending
  }

  // Process each card
  cards.forEach((card) => {
    const slide = document.createElement('div');
    slide.className = isCarousel ? 'swiper-slide carousel-card' : 'carousel-card';

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

    // Create card container
    const cardContainer = document.createElement('div');
    cardContainer.className = 'card-container';

    // Build card based on variant
    if (variant === 'variant1') {
      // Variant 1: Image overlay (current implementation)
      if (image) {
        cardContainer.style.backgroundImage = `url('${image.src}')`;
        cardContainer.style.backgroundSize = 'cover';
        cardContainer.style.backgroundPosition = 'center';
        cardContainer.style.backgroundRepeat = 'no-repeat';
        cardContainer.setAttribute('aria-label', image.alt || '');
      }

      if (linkElement) {
        const linkTag = document.createElement('a');
        linkTag.className = 'card-link';
        linkTag.title = linkElement.title.trim();
        linkTag.href = linkElement.href;
        linkTag.setAttribute('aria-label', linkElement.title.trim());

        // Open external links in new tab
        if (isExternalLink(linkElement.href)) {
          linkTag.target = '_blank';
          linkTag.rel = 'noopener noreferrer';
        }

        cardContainer.appendChild(linkTag);
      }

      if (badgeElement && badgeElement.textContent.trim()) {
        const badge = document.createElement('div');
        badge.className = 'card-badge';
        badge.textContent = badgeElement.textContent.trim();
        cardContainer.appendChild(badge);
      }

      const overlay = document.createElement('div');
      overlay.className = 'card-overlay';

      if (subtitleElement && subtitleElement.textContent.trim()) {
        const subtitle = document.createElement('div');
        subtitle.className = 'card-subtitle';
        subtitle.textContent = subtitleElement.textContent.trim();
        overlay.appendChild(subtitle);
      }

      if (descriptionElement) {
        const description = document.createElement('div');
        description.className = 'card-description';
        description.innerHTML = descriptionElement.innerHTML || descriptionElement.textContent;
        overlay.appendChild(description);
      }

      const cardBackgroundOverlay = document.createElement('div');
      cardBackgroundOverlay.className = 'card-background-overlay';
      cardContainer.appendChild(cardBackgroundOverlay);
      cardContainer.appendChild(overlay);
    } else if (variant === 'variant2') {
      // Variant 2: Stacked layout
      if (image) {
        const imageWrapper = document.createElement('div');
        imageWrapper.className = 'card-image-wrapper';

        const img = document.createElement('img');
        img.src = image.src;
        img.alt = image.alt || '';
        img.loading = 'lazy';

        if (linkElement) {
          const imageLink = document.createElement('a');
          imageLink.href = linkElement.href;

          // Open external links in new tab
          if (isExternalLink(linkElement.href)) {
            imageLink.target = '_blank';
            imageLink.rel = 'noopener noreferrer';
          }

          imageLink.appendChild(img);
          imageWrapper.appendChild(imageLink);
        } else {
          imageWrapper.appendChild(img);
        }

        cardContainer.appendChild(imageWrapper);
      }

      const content = document.createElement('div');
      content.className = 'card-content';

      // Add subtitle first (yellow text at top)
      if (subtitleElement && subtitleElement.textContent.trim()) {
        const subtitle = document.createElement('p');
        subtitle.className = 'card-subtitle';
        subtitle.textContent = subtitleElement.textContent.trim();
        content.appendChild(subtitle);
      }

      // Add description second (main content)
      if (descriptionElement && descriptionElement.textContent.trim()) {
        const desc = document.createElement('div');
        desc.className = 'card-text';
        desc.innerHTML = descriptionElement.innerHTML || descriptionElement.textContent;
        content.appendChild(desc);
      }

      // Add link last (CTA at bottom)
      if (linkElement) {
        const cta = document.createElement('a');
        cta.href = linkElement.href;
        cta.className = 'card-cta';
        cta.textContent = 'Learn More';

        // Open external links in new tab
        if (isExternalLink(linkElement.href)) {
          cta.target = '_blank';
          cta.rel = 'noopener noreferrer';
        }

        content.appendChild(cta);
      }

      cardContainer.appendChild(content);
    } else if (variant === 'variant3') {
      // Variant 3: Contact card layout
      if (image) {
        const imageWrapper = document.createElement('div');
        imageWrapper.className = 'card-profile-image';

        const img = document.createElement('img');
        img.src = image.src;
        img.alt = image.alt || '';
        img.loading = 'lazy';
        imageWrapper.appendChild(img);

        cardContainer.appendChild(imageWrapper);
      }

      const info = document.createElement('div');
      info.className = 'card-info';

      // For contact card, use subtitle as name and description as title
      if (subtitleElement && subtitleElement.textContent.trim()) {
        const name = document.createElement('h3');
        name.className = 'card-name';
        name.textContent = subtitleElement.textContent.trim();
        info.appendChild(name);
      }

      if (descriptionElement && descriptionElement.textContent.trim()) {
        const title = document.createElement('p');
        title.className = 'card-role';
        title.textContent = descriptionElement.textContent.trim();
        info.appendChild(title);
      }

      if (linkElement) {
        const contactLink = document.createElement('a');
        contactLink.href = linkElement.href;
        contactLink.className = 'card-contact-link';

        // Open external links in new tab
        if (isExternalLink(linkElement.href)) {
          contactLink.target = '_blank';
          contactLink.rel = 'noopener noreferrer';
        }

        info.appendChild(contactLink);
      }

      cardContainer.appendChild(info);
    }
    slide.appendChild(cardContainer);
    swiperWrapper.appendChild(slide);
  });

  container.appendChild(cardsContainer);

  // Create navigation only if carousel mode is enabled
  if (isCarousel) {
    const navigationContainer = document.createElement('div');
    navigationContainer.className = 'card-variants-navigation';

    // Add pagination dots
    const pagination = document.createElement('div');
    pagination.className = 'swiper-pagination card-variants-pagination';

    navigationContainer.appendChild(pagination);
    container.appendChild(navigationContainer);
  }

  section.appendChild(container);

  // Replace the block content
  block.textContent = '';
  block.appendChild(section);

  // Move instrumentation
  moveInstrumentation(block, section);

  // Initialize Swiper only if carousel mode is enabled
  if (isCarousel) {
    setTimeout(() => {
      const swiperContainer = block.querySelector('.card-variants-swiper');
      const paginationEl = block.querySelector('.card-variants-pagination');

      // Check for Swiper availability
      const SwiperConstructor = window.Swiper;
      const autoplay = cardsAutoplay === true || cardsAutoplay === 'true'
        ? { delay: 4000, disableOnInteraction: false, pauseOnMouseEnter: true } : false;

      const loop = !!(cardsLoop === true || cardsLoop === 'true');

      if (swiperContainer && SwiperConstructor) {
        try {
          // Define slidesPerView based on card size
          const slideConfigs = {
            xsmall: {
              default: 1.5,
              640: 2.6,
              768: 3.2,
              1024: 5.2,
            },
            small: {
              default: 1.5,
              640: 2.2,
              768: 3.2,
              1024: 5.2,
            },
            medium: {
              default: 1.2,
              640: 1.2,
              768: 2.2,
              1024: 4.2,
            },
            large: {
              default: 1,
              640: 1,
              768: 1.5,
              1024: 2.5,
            },
          };

          const config = slideConfigs[cardSize] || slideConfigs.medium;

          // Initialize the card variants swiper
          const cardVariantsSwiper = new SwiperConstructor(swiperContainer, {
            slidesPerView: config.default,
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
                slidesPerView: config[640],
                spaceBetween: 20,
              },
              768: {
                slidesPerView: config[768],
                spaceBetween: 30,
                slidesOffsetBefore: 16,
                slidesOffsetAfter: 24,
              },
              1024: {
                slidesPerView: config[1024],
                spaceBetween: 24,
                slidesOffsetBefore: 10,
                slidesOffsetAfter: 24,
              },
            },
            // Ensure proper initialization
            observer: true,
            observeParents: true,
          });

          cardVariantsSwiper.on('slideChange', () => {});
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Error initializing Card Variants Swiper:', error);
        }
      } else {
        // eslint-disable-next-line no-console
        console.error('Card Variants Swiper initialization failed', {
          windowSwiper: !!window.Swiper,
          swiperConstructor: !!SwiperConstructor,
          container: !!swiperContainer,
          pagination: !!paginationEl,
        });
      }
    }, 250); // Give enough time for Swiper internals to initialize
  }
}
