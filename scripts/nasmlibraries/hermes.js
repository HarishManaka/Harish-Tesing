function createSlideshow(options) {
  // Slideshow config options (Default Values)
  let {
    selector,
    direction = 'horizontal',
    gap = 0,
    auto = true,
    interval = 5000,
    showDots = true,
    showProgress = false,
    showControls = true,
    speed = 500,
    jsonUrl = null,
    slidesToShow = 1,
    itemsPerSlide = null,
    responsive = null,
    callback,
  } = options;

  // Create slideshow and add attributes for ADA Standard
  const slideshow = document.querySelector(selector);
  slideshow.setAttribute('role', 'region');
  slideshow.setAttribute('aria-label', 'Slideshow');

  // Create a container for the slides and add attributes for ADA Standard
  const slidesDiv = document.createElement('div');
  slidesDiv.classList.add('slides', 'no-select'); // Add no-select class here
  slidesDiv.style.gap = `${gap}px`;
  slidesDiv.setAttribute('role', 'list');

  // Global Variables
  let isSwipe = false;
  let startX; let startY; let distX; let
    distY;
  const threshold = 30; // Minimum swipe distance in pixels
  let currentBreakpoint = null;
  let isBreakpointChangeInProgress = false;

  // Apply responsive settings
  function applyResponsiveSettings() {
    if (responsive) {
      responsive.sort((a, b) => b.breakpoint - a.breakpoint);
      responsive.forEach((breakpoint) => {
        const mediaQuery = window.matchMedia(`(min-width: ${breakpoint.breakpoint}px)`);
        const handleChange = () => handleBreakpointChange(mediaQuery, breakpoint.settings, breakpoint.breakpoint);
        mediaQuery.addEventListener('change', handleChange);
        handleChange();
      });
    }
  }

  // Handle breakpoint changes
  function handleBreakpointChange(mediaQuery, settings, breakpoint) {
    if (mediaQuery.matches && (currentBreakpoint === null || breakpoint >= currentBreakpoint) && !isBreakpointChangeInProgress) {
      isBreakpointChangeInProgress = true;

      Object.assign(options, settings);
      ({
        direction, gap, auto, interval, showDots, showProgress, showControls, speed, slidesToShow, itemsPerSlide,
      } = options);

      currentBreakpoint = breakpoint;
      clearSlideshow(slideshow);
      // wrapExistingContent(slideshow);

      isBreakpointChangeInProgress = false;
    }
  }

  // Clear slideshow
  function clearSlideshow(slideshow) {
    const slidesContainer = slideshow.querySelector('.slides');
    if (slidesContainer) {
      while (slidesContainer.firstChild) {
        slidesContainer.removeChild(slidesContainer.firstChild);
      }
    }
  }

  // Run animation
  function runAnimation(slideshow) {
    // Slideshow Variables
    const slides = slideshow.querySelector('.slides');
    const slideCount = slides.children.length;
    let currentIndex = 1;
    let intervalId;

    // Dots Variables
    const dotsContainer = document.createElement('div');
    dotsContainer.classList.add('dots-container', 'no-select');
    dotsContainer.id = `${slideshow.className}-dots`;
    showProgress ? dotsContainer.classList.add('dots-progress') : '';
    dotsContainer.setAttribute('role', 'tablist');
    slideshow.parentNode.insertBefore(dotsContainer, slideshow.nextSibling);

    // Apply transition speed
    slides.style.transition = `transform ${speed}ms ease-in-out`;
    slides.style.display = 'flex';
    slides.style.flexDirection = direction === 'horizontal' ? 'row' : 'column';
    slides.style.gap = `${gap}px`;
    slideshow.style.position = 'relative';
    slideshow.style.overflow = 'hidden';

    // Get currentIndex of slideshow
    slideshow.getCurrentIndex = () => currentIndex;

    // Update Slide Viewable Window
    slideshow.updateSlidePosition = () => {
      let offset;
      if (direction === 'horizontal') {
        const slideWidth = slides.children[0].offsetWidth + gap;
        offset = (currentIndex - 1) * slideWidth;
        slides.style.transform = `translateX(-${offset}px)`;
      } else {
        const slideHeight = slides.children[0].offsetHeight + gap;
        offset = (currentIndex - 1) * slideHeight;
        slides.style.transform = `translateY(-${offset}px)`;
      }
      slideshow.updateDots();
    };

    // Go To Next Slide
    slideshow.goToNextSlide = () => {
      currentIndex = (currentIndex % slideCount) + 1;
      slideshow.updateSlidePosition();
      slideshow.manageFocus();
      if (auto) slideshow.resetInterval();
      if (typeof goToCard === 'function' && goToCard.call) goToCard(currentIndex);
    };

    // Go To Previous Slide
    slideshow.goToPrevSlide = () => {
      currentIndex = (currentIndex - 2 + slideCount) % slideCount + 1;
      slideshow.updateSlidePosition();
      slideshow.manageFocus();
      if (auto) slideshow.resetInterval();
      if (typeof goToCard === 'function' && goToCard.call) goToCard(currentIndex);
    };

    // Go To Indexed Slide
    slideshow.goToSlide = (index) => {
      if (!slideshow) return;
      const slidesDiv = slideshow.querySelector('.slides');
      let offset;
      if (direction === 'horizontal') {
        const slideWidth = slides.children[0].offsetWidth + gap;
        offset = (index - 1) * slideWidth;
        slidesDiv.style.transform = `translateX(-${offset}px)`;
      } else {
        const slideHeight = slides.children[0].offsetHeight + gap;
        offset = (index - 1) * slideHeight;
        slidesDiv.style.transform = `translateY(-${offset}px)`;
      }
      slideshow.updateDot(slideshow, index);
      slideshow.resetInterval();
    };

    // Update focused slide for ADA Standard
    slideshow.manageFocus = () => {
      const slidesArray = Array.from(slides.children);
      slidesArray.forEach((slide, index) => {
        if (index + 1 === currentIndex) {
          slide.setAttribute('tabindex', '0');
        } else {
          slide.setAttribute('tabindex', '-1');
        }
      });
    };

    // Reset slideshow timer
    slideshow.resetInterval = () => {
      clearInterval(intervalId);
      intervalId = setInterval(slideshow.goToNextSlide, interval);
    };

    // Generate slideshow dots
    slideshow.createDots = () => {
      for (let i = 1; i <= slideCount; i++) {
        const dot = document.createElement('button');
        dot.classList.add('dot', 'no-select');
        showProgress ? dot.classList.add('empty') : '';
        dot.setAttribute('role', 'tab');
        dot.setAttribute('aria-controls', `slide-${i}`);
        dot.setAttribute('aria-selected', i === currentIndex);
        dot.addEventListener('click', (e) => {
          e.preventDefault();
          const dotIndex = i;
          if (currentIndex !== dotIndex) {
            if (typeof goToCard === 'function' && goToCard.call) goToCard(currentIndex);
            currentIndex = dotIndex;
          }
          slideshow.updateSlidePosition();
          slideshow.resetInterval();
        });
        dotsContainer.appendChild(dot);
      }
    };

    // Update slideshow dots
    slideshow.updateDots = () => {
      const dots = dotsContainer.querySelectorAll('.dot');
      if (showProgress) {
        dots.forEach((dot, index) => {
          if (index + 1 === currentIndex) {
            dot.classList.add('active');
            dot.classList.remove('empty');
            dot.setAttribute('aria-selected', 'true');
          } else if (index + 1 < currentIndex) {
            dot.classList.remove('active');
            dot.classList.remove('empty');
            dot.classList.add('filled');
            dot.setAttribute('aria-selected', 'false');
          } else if (index + 1 > currentIndex) {
            dot.classList.remove('active');
            dot.classList.remove('filled');
            dot.classList.add('empty');
            dot.setAttribute('aria-selected', 'false');
          } else {
            dot.classList.remove('active');
            dot.setAttribute('aria-selected', 'false');
          }
        });
      } else {
        dots.forEach((dot, index) => {
          dot.setAttribute('aria-selected', index + 1 === currentIndex);
          dot.classList.toggle('active', index + 1 === currentIndex);
        });
      }
    };

    // Update dot to indexed slideshow
    slideshow.updateDot = (slideshow, currentIndex) => {
      const dotsContainer = slideshow.parentNode.querySelector('.dots-container');
      if (!dotsContainer) return;
      const dots = dotsContainer.querySelectorAll('.dot');
      dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === (currentIndex - 1));
      });
    };

    // Generate Controls for ADA Compliance
    slideshow.createControls = () => {
      const prevButton = document.createElement('button');
      prevButton.classList.add('control', 'prev', 'no-select');
      prevButton.setAttribute('aria-label', 'Previous Slide');
      prevButton.textContent = 'Prev';
      prevButton.addEventListener('click', (e) => {
        e.preventDefault();
        slideshow.goToPrevSlide();
      });
      const nextButton = document.createElement('button');
      nextButton.classList.add('control', 'next', 'no-select');
      nextButton.setAttribute('aria-label', 'Next Slide');
      nextButton.textContent = 'Next';
      nextButton.addEventListener('click', (e) => {
        e.preventDefault();
        slideshow.goToNextSlide();
      });
      slideshow.appendChild(prevButton);
      slideshow.appendChild(nextButton);
    };
    // Handle slide click for swipe and links
    slideshow.handleSlideClick = (e, isSwipe) => {
      // Ignore right-click events
      if (e.button === 2) return;

      // Prevent default action if it's a swipe
      if (isSwipe) {
        e.preventDefault();
        return;
      }

      // Look for the anchor (`a`) tag inside the `.slide` div
      const target = e.target.closest('.ar-single-article');
      const targetLink = target || null; // Select anchor tag within the slide

      if (targetLink) {
        // Get the URL from the anchor's href or data-href attribute
        const url = targetLink.getAttribute('href') || targetLink.getAttribute('data-href');

        if (url) {
          // Open the URL in a new tab
          window.open(url, '_blank');
          e.preventDefault(); // Prevent any default actions after opening the link
        } else {
          console.error('No valid URL found in anchor tag.');
        }
      } else {
        console.error('No anchor tag found inside the slide.');
      }
    };

    // Disable drag-and-drop on anchor tags and images
    const disableDrag = (element) => {
      element.addEventListener('dragstart', (e) => {
        e.preventDefault();
      });
    };

    // Set slide width based on slidesToShow
    const slideSize = () => {
      const containerWidth = slideshow.clientWidth;
      const containerHeight = slideshow.clientHeight;
      return direction === 'horizontal' ? containerWidth / slidesToShow : containerHeight / slidesToShow;
    };
    // const slideSize = () => direction === 'horizontal' ? window.innerWidth / slidesToShow : window.innerHeight / slidesToShow;
    Array.from(slides.children).forEach((slide) => {
      slide.classList.add('no-select');
      slide.style.flex = `0 0 ${slideSize()}px`;
      slide.style.height = 'fit-content';

      const links = slide.querySelectorAll('a');
      const images = slide.querySelectorAll('img');
      links.forEach(disableDrag);
      images.forEach(disableDrag);
    });

    // Set slideshow direction
    if (direction === 'vertical') {
      slideshow.style.height = `${slides.children[0].offsetHeight * slidesToShow}px`;
    }

    // Set slideshow control
    if (showControls) {
      slideshow.createControls();
    }

    // Set slideshow dots
    if (showDots) {
      slideshow.createDots();
      slideshow.updateDots();
    }

    // Pause slideshow on mouse hover
    if (auto) {
      intervalId = setInterval(slideshow.goToNextSlide, interval);
      slideshow.addEventListener('mouseenter', () => clearInterval(intervalId));
      slideshow.addEventListener('mouseleave', () => intervalId = setInterval(slideshow.goToNextSlide, interval));
    }

    slides.addEventListener('click', (e) => {
      if (isSwipe) {
        e.preventDefault();
      } else {
        slideshow.handleSlideClick(e, isSwipe);
      }
    });

    // Swipe and Click functionality
    slides.addEventListener('touchstart', (e) => {
      const touch = e.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;
      distX = 0;
      distY = 0;
      // Prevent vertical scrolling
      e.preventDefault();
    });
    slides.addEventListener('touchmove', (e) => {
      const touch = e.touches[0];
      distX = touch.clientX - startX;
      distY = touch.clientY - startY;
      if (Math.abs(distX) > threshold || Math.abs(distY) > threshold) {
        isSwipe = true;
        // Prevent vertical scrolling
        e.preventDefault();
      }
    });
    slides.addEventListener('touchend', (e) => {
      if (Math.abs(distX) > threshold || Math.abs(distY) > threshold) {
        if (direction === 'horizontal') {
          if (distX > 0) {
            slideshow.goToPrevSlide();
          } else {
            slideshow.goToNextSlide();
          }
          e.preventDefault();
        } else {
          if (distY > 0) {
            slideshow.goToPrevSlide();
          } else {
            slideshow.goToNextSlide();
          }
          e.preventDefault();
        }
      } else {
        // Here we allow the click if there's no swipe or very small swipe.
        isSwipe = false;
        slideshow.handleSlideClick(e, isSwipe);
      }
      startX = null;
      startY = null;
      distX = 0;
      distY = 0;
    });

    slides.addEventListener('mousedown', (e) => {
      startX = e.clientX;
      startY = e.clientY;
      distX = 0;
      distY = 0;
      // isSwipe = false;

      const onMouseMove = (e) => {
        distX = e.clientX - startX;
        distY = e.clientY - startY;
        if (Math.abs(distX) > threshold || Math.abs(distY) > threshold) {
          isSwipe = true;
          // Prevent vertical scrolling
          e.preventDefault();
        }
      };

      const onMouseUp = (e) => {
        if (isSwipe) {
          e.preventDefault();
          if (direction === 'horizontal') {
            if (distX > 0) {
              slideshow.goToPrevSlide();
            } else {
              slideshow.goToNextSlide();
            }
          } else if (distY > 0) {
            slideshow.goToPrevSlide();
          } else {
            slideshow.goToNextSlide();
          }
        } else {
          slideshow.handleSlideClick(e, isSwipe);
        }
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        // Reset start positions
        startX = null;
        startY = null;
        distX = 0;
        distY = 0;
        // isSwipe = false;
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });

    if (typeof callback === 'function') {
      callback();
    }
  }

  // Load slides from JSON
  function loadSlidesFromJson(slideshow, jsonUrl) {
    fetch(jsonUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Could not find JSON');
        }
        return response.json();
      })
      .then((data) => {
        const multiArticles = document.querySelector('#articles-resources.nasm-multi-resources');
        let slideDiv;
        data.forEach((article, index) => {
          // Create a new slide container for every 'n' items, where 'n' is itemsPerSlide
          if (index % itemsPerSlide === 0) {
            slideDiv = document.createElement('div');
            slideDiv.classList.add('slide', 'no-select');
            slideDiv.setAttribute('role', 'listitem');
            slidesDiv.appendChild(slideDiv);
          }

          if (multiArticles) {
            const articleDiv = document.createElement('div');
            articleDiv.className = 'ar-single-article';
            articleDiv.setAttribute('data-href', article.link);
            articleDiv.setAttribute('data-target', '_blank');
            articleDiv.innerHTML = `
                            <img src="${article.image}" alt="${article.alt}" class="no-select">
                        <div class="ar-single-article-text no-select">
                            <span>By ${article.author}</span>
                            <p>${article.title}</p>
                        </div>
                    `;
            slideDiv.appendChild(articleDiv);
          } else {
            // Construct content for each slide
            // const contentDiv = document.createElement('div');
            // contentDiv.innerHTML = `<div><a href="${article.url}" class="no-select">${article.content}</a></div>`;
            // slideDiv.appendChild(contentDiv);

            const articleDiv = document.createElement('div');
            articleDiv.className = 'ar-single-article';
            articleDiv.setAttribute('data-href', article.link);
            articleDiv.setAttribute('data-target', '_blank');
            articleDiv.innerHTML = `
                        <img src="${article.image}" alt="${article.alt}" class="no-select">
                        <div class="ar-single-article-text no-select">
                            <span>By ${article.author}</span>
                            <p>${article.title}</p>
                        </div>
                    `;
            slideDiv.appendChild(articleDiv);
          }

          slideshow.appendChild(slidesDiv);
        });
        runAnimation(slideshow);
      })
      .catch((error) => {
        console.error('Error fetching JSON data:', error);
      });
  }

  // Wrap existing content in slides
  function wrapExistingContent(slideshow) {
    const childElements = Array.from(slideshow.children);
    childElements.forEach((child, index) => {
      const slideDiv = document.createElement('div');
      slideDiv.classList.add('slide', 'no-select');
      slideDiv.setAttribute('role', 'listitem');
      slideDiv.setAttribute('data-index', index + 1);
      slideDiv.appendChild(child);
      slidesDiv.appendChild(slideDiv);
    });
    slideshow.appendChild(slidesDiv);
    runAnimation(slideshow);
  }

  // Initialize slides from JSON or wrap existing content
  if (jsonUrl) {
    loadSlidesFromJson(slideshow, jsonUrl);
  } else {
    wrapExistingContent(slideshow);
  }

  applyResponsiveSettings();
}
