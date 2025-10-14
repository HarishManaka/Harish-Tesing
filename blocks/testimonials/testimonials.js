// Deployment trigger comment
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
      console.warn('Failed to load Swiper from CDN, trying local file:', cdnError);
      // Fallback to local file
      await new Promise((resolve) => { setTimeout(resolve, 100); });
    }
  }

  // Get all testimonial rows, filtering out the h2 container
  const testimonials = [...block.children].filter((child) => !child.querySelector('h2'));

  // Create the new structure
  const section = document.createElement('section');
  section.id = 'nasm-testimonials';

  // Look for an h2 in the block markup
  const h2Element = block.querySelector('h2');
  // Create title container
  if (h2Element) {
    const titleDiv = document.createElement('div');
    titleDiv.className = 'nasm-testimonials-title';
    // Clone the h2 to preserve its id and content
    const titleH2 = h2Element.cloneNode(true);
    titleDiv.appendChild(titleH2);
    section.appendChild(titleDiv);
  }

  // Create testimonials container
  const container = document.createElement('div');
  container.className = 'nasm-testimonials-container';

  // Create swiper structure
  const swiper = document.createElement('div');
  swiper.className = 'swiper testimonial-swiper';

  const swiperWrapper = document.createElement('div');
  swiperWrapper.className = 'swiper-wrapper';

  // Process each testimonial
  testimonials.forEach((testimonial) => {
    const slide = document.createElement('div');
    slide.className = 'swiper-slide testimonial';

    // Get the image, text, and author from the original structure
    const image = testimonial.querySelector('img');
    const text = testimonial.children[1]?.querySelector('p')?.textContent || '';
    const author = testimonial.children[2]?.querySelector('p')?.textContent || '';

    if (image) {
      // Clone the image to preserve all attributes
      const imgClone = image.cloneNode(true);
      slide.appendChild(imgClone);
    }

    // Create testimonial content
    const content = document.createElement('div');
    content.className = 'testimonial-content';

    // Add quotation mark
    const quotation = document.createElement('div');
    quotation.className = 'testimonial-quotation';
    quotation.innerHTML = '&ldquo;';
    content.appendChild(quotation);

    // Add testimonial text
    const textDiv = document.createElement('div');
    textDiv.className = 'testimonial-text';
    const textP = document.createElement('p');
    textP.textContent = text;
    textDiv.appendChild(textP);
    content.appendChild(textDiv);

    // Add source/author
    const sourceDiv = document.createElement('div');
    sourceDiv.className = 'testimonial-source';
    const sourceP = document.createElement('p');
    sourceP.textContent = author;
    sourceDiv.appendChild(sourceP);
    content.appendChild(sourceDiv);

    slide.appendChild(content);
    swiperWrapper.appendChild(slide);
  });

  swiper.appendChild(swiperWrapper);

  container.appendChild(swiper);

  // Add progress bar outside of swiper
  const progressBar = document.createElement('div');
  progressBar.className = 'testimonial-progress-bar';
  progressBar.innerHTML = '&nbsp;';
  container.appendChild(progressBar);

  section.appendChild(container);

  // Replace the block content
  block.textContent = '';
  block.appendChild(section);

  // Move instrumentation
  moveInstrumentation(block, section);
  // Initialize Swiper after ensuring DOM and scripts are ready
  setTimeout(() => {
    const swiperContainer = block.querySelector('.testimonial-swiper');
    const progressBarEl = block.querySelector('.testimonial-progress-bar');

    // Check for Swiper availability - only use window.Swiper
    const SwiperConstructor = window.Swiper;

    if (swiperContainer && SwiperConstructor) {
      try {
        // Initialize the testimonial swiper
        const testimonialSwiper = new SwiperConstructor(swiperContainer, {
          slidesPerView: 1,
          spaceBetween: 0,
          loop: true,
          autoplay: {
            delay: 5000,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          },
          pagination: {
            el: progressBarEl,
            type: 'bullets',
            clickable: true,
          },
          // Ensure proper initialization
          observer: true,
          observeParents: true,
        });

        testimonialSwiper.on('slideChange', () => {});
      } catch (error) {
        console.error('Error initializing Swiper:', error);
      }
    } else {
      console.error('Swiper initialization failed', {
        windowSwiper: !!window.Swiper,
        swiperConstructor: !!SwiperConstructor,
        container: !!swiperContainer,
        progressBar: !!progressBarEl,
      });
    }
  }, 250); // Give enough time for Swiper internals to initialize
}
