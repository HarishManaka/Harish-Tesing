export default function decorate(block) {
  const items = [...block.querySelectorAll(':scope > div')];
  // Validate item count (3-6 items)
  if (items.length < 3 || items.length > 6) {
    console.warn('Fitness carousel supports 3-6 items. Current count:', items.length);
  }

  // Clear original content
  // block.innerHTML = '';

  // Create carousel structure
  const carousel = document.createElement('div');
  carousel.className = 'carousel';

  const track = document.createElement('div');
  track.className = 'carousel-track';
  track.id = `carousel-track-${Math.random().toString(36).substring(2, 11)}`;

  // Process each item
  items.forEach((item, index) => {
    item.style.display = 'none';
    const carouselItem = document.createElement('div');
    carouselItem.className = 'carousel-item';
    if (index === 0) carouselItem.classList.add('active');
    carouselItem.dataset.index = index;

    // Extract image
    const img = item.querySelector('img');
    if (img) {
      const imgClone = img.cloneNode(true);
      carouselItem.appendChild(imgClone);
    }

    // Create overlay with title and description
    const overlay = document.createElement('div');
    overlay.className = 'carousel-overlay';

    // Find title (usually in h2, h3, or strong tag)
    const titleElement = item.querySelector('h2, h3, strong');
    if (titleElement) {
      const title = document.createElement('div');
      title.className = 'carousel-title';
      title.textContent = titleElement.textContent;
      overlay.appendChild(title);
    }

    // Find description (usually in p tag, excluding the one with image)
    const paragraphs = item.querySelectorAll('p');
    paragraphs.forEach((p, idx) => {
      if (!p.querySelector('img') && p.textContent.trim()) {
        const description = document.createElement('div');
        description.className = idx === 0 ? 'carousel-title' : 'carousel-description';
        description.textContent = p.textContent;
        overlay.appendChild(description);
      }
    });

    if (overlay.children.length > 0) {
      carouselItem.appendChild(overlay);
    }

    track.appendChild(carouselItem);
  });

  // Create dots navigation
  const dotsContainer = document.createElement('div');
  dotsContainer.className = 'carousel-dots';

  items.forEach((_, index) => {
    const dot = document.createElement('div');
    dot.className = 'dot';
    if (index === 0) dot.classList.add('active');
    dot.dataset.index = index;
    dotsContainer.appendChild(dot);
  });

  carousel.appendChild(track);
  carousel.appendChild(dotsContainer);
  block.appendChild(carousel);

  // Initialize carousel functionality
  initializeCarousel(carousel);
}

function initializeCarousel(carousel) {
  const track = carousel.querySelector('.carousel-track');
  const items = carousel.querySelectorAll('.carousel-item');
  const dots = carousel.querySelectorAll('.dot');
  let currentIndex = 0;

  // Update active states
  function updateActiveStates(index) {
    items.forEach((item, i) => {
      item.classList.toggle('active', i === index);
    });
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === index);
    });
    currentIndex = index;
  }

  // Handle dot clicks
  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      if (window.innerWidth < 768) {
        updateActiveStates(index);
      } else if (window.innerWidth < 1024) {
        const item = items[index];
        item.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        updateActiveStates(index);
      }
    });
  });

  // Handle scroll events for tablet
  let isScrolling = false;
  track.addEventListener('scroll', () => {
    if (window.innerWidth >= 1024 || window.innerWidth < 768) return;
    if (!isScrolling) {
      window.requestAnimationFrame(() => {
        const trackRect = track.getBoundingClientRect();
        const trackCenterX = trackRect.left + trackRect.width / 2;
        let closestIndex = 0;
        let smallestDistance = Infinity;
        items.forEach((item, index) => {
          const rect = item.getBoundingClientRect();
          const itemCenterX = rect.left + rect.width / 2;
          const distance = Math.abs(itemCenterX - trackCenterX);
          if (distance < smallestDistance) {
            smallestDistance = distance;
            closestIndex = index;
          }
        });
        if (closestIndex !== currentIndex) {
          updateActiveStates(closestIndex);
        }
        isScrolling = false;
      });
      isScrolling = true;
    }
  });

  // Handle item clicks on mobile/tablet
  items.forEach((item, index) => {
    item.addEventListener('click', () => {
      if (window.innerWidth < 768) {
        updateActiveStates(index);
      } else if (window.innerWidth < 1024) {
        item.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        updateActiveStates(index);
      }
    });
  });

  // Handle touch swipe for mobile
  let touchStartX = 0;
  let touchEndX = 0;

  track.addEventListener('touchstart', (e) => {
    if (window.innerWidth >= 768) return;
    touchStartX = e.changedTouches[0].screenX;
  });

  track.addEventListener('touchend', (e) => {
    if (window.innerWidth >= 768) return;
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
  });

  function handleSwipe() {
    const swipeThreshold = 50;
    const diff = touchStartX - touchEndX;

    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0 && currentIndex < items.length - 1) {
        // Swipe left - next item
        updateActiveStates(currentIndex + 1);
      } else if (diff < 0 && currentIndex > 0) {
        // Swipe right - previous item
        updateActiveStates(currentIndex - 1);
      }
    }
  }

  // Reset on window resize
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (window.innerWidth >= 1024) {
        // Reset for desktop
        items.forEach((item) => item.classList.remove('active'));
        dots.forEach((dot) => dot.classList.remove('active'));
      } else {
        // Maintain active state for tablet/mobile
        updateActiveStates(currentIndex);
      }
    }, 250);
  });
}
