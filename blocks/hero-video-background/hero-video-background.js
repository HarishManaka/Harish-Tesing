export default function decorate(block) {
  // Helper function to get text content from a row
  const getTextContent = (rowKey) => {
    const row = [...block.children].find((r) => r.children[0]?.textContent.trim() === rowKey);
    return row?.children[1]?.textContent.trim() || '';
  };

  // Helper function to get link href from a row
  const getLinkHref = (rowKey) => {
    const row = [...block.children].find((r) => r.children[0]?.textContent.trim() === rowKey);
    const link = row?.children[1]?.querySelector('a');
    return link?.href || '';
  };

  // Helper function to get link text from a row
  const getLinkText = (rowKey) => {
    const row = [...block.children].find((r) => r.children[0]?.textContent.trim() === rowKey);
    const link = row?.children[1]?.querySelector('a');
    return link?.textContent.trim() || '';
  };

  // Helper function to get image src from a row
  const getImageSrc = (rowKey) => {
    const row = [...block.children].find((r) => r.children[0]?.textContent.trim() === rowKey);
    const img = row?.children[1]?.querySelector('img');
    return img?.src || '';
  };

  // Extract the content
  const mainHeading = getTextContent('mainHeading');
  const mainHeadingType = getTextContent('mainHeadingType') || 'h1';
  const subHeading = getTextContent('subHeading');
  const description = getTextContent('description');
  const ctaLink = getLinkHref('ctaLink');
  const ctaLinkText = getLinkText('ctaLink');
  const ctaLinkType = getTextContent('ctaLinkType') || 'primary';
  const videoUrl = getLinkHref('videoUrl') || getTextContent('videoUrl');
  const videoPoster = getImageSrc('videoPoster');
  const overlayOpacity = getTextContent('overlayOpacity') || 'medium';

  // Create the hero structure
  const heroContainer = document.createElement('div');
  heroContainer.className = 'hero-video-background-container';

  // Create video background
  if (videoUrl) {
    // Check if it's a Vimeo URL
    if (videoUrl.includes('vimeo.com')) {
      // Extract Vimeo video ID
      const vimeoId = videoUrl.split('/').pop();
      const iframe = document.createElement('iframe');
      iframe.className = 'hero-video-background-video';
      iframe.src = `https://player.vimeo.com/video/${vimeoId}?autoplay=1&loop=1&muted=1&controls=0&background=1`;
      iframe.setAttribute('frameborder', '0');
      iframe.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture');
      iframe.setAttribute('allowfullscreen', '');
      heroContainer.appendChild(iframe);
    } else {
      // Handle direct video files (MP4, etc.)
      const videoElement = document.createElement('video');
      videoElement.className = 'hero-video-background-video';
      videoElement.setAttribute('autoplay', '');
      videoElement.setAttribute('muted', '');
      videoElement.setAttribute('loop', '');
      videoElement.setAttribute('playsinline', '');
      if (videoPoster) {
        videoElement.setAttribute('poster', videoPoster);
      }

      const sourceElement = document.createElement('source');
      sourceElement.src = videoUrl;
      sourceElement.type = 'video/mp4';
      videoElement.appendChild(sourceElement);

      heroContainer.appendChild(videoElement);
    }
  }

  // Create overlay
  const overlay = document.createElement('div');
  overlay.className = `hero-video-background-overlay ${overlayOpacity}`;
  heroContainer.appendChild(overlay);

  // Create content container
  const contentContainer = document.createElement('div');
  contentContainer.className = 'hero-video-background-content';

  // Create main heading
  if (mainHeading) {
    const headingElement = document.createElement(mainHeadingType);
    headingElement.className = 'hero-video-background-heading';
    headingElement.textContent = mainHeading;
    contentContainer.appendChild(headingElement);
  }

  // Create sub heading
  if (subHeading) {
    const subHeadingElement = document.createElement('h2');
    subHeadingElement.className = 'hero-video-background-subheading';
    subHeadingElement.textContent = subHeading;
    contentContainer.appendChild(subHeadingElement);
  }

  // Create description
  if (description) {
    const descriptionElement = document.createElement('p');
    descriptionElement.className = 'hero-video-background-description';
    descriptionElement.textContent = description;
    descriptionElement.setAttribute('role', 'heading');
    contentContainer.appendChild(descriptionElement);
  }

  // Create CTA button
  if (ctaLink && ctaLinkText) {
    const ctaContainer = document.createElement('div');
    ctaContainer.className = 'hero-video-background-cta';

    const ctaButton = document.createElement('a');
    ctaButton.href = ctaLink;
    ctaButton.className = `button ${ctaLinkType}`;
    ctaButton.textContent = ctaLinkText;

    ctaContainer.appendChild(ctaButton);
    contentContainer.appendChild(ctaContainer);
  }

  heroContainer.appendChild(contentContainer);

  // Replace block content
  block.textContent = '';
  block.appendChild(heroContainer);

  // Handle video loading and error states
  if (videoUrl) {
    const videoElement = heroContainer.querySelector('.hero-video-background-video');

    if (videoElement && videoElement.tagName === 'VIDEO') {
      // Handle native video elements
      videoElement.addEventListener('loadeddata', () => {
        videoElement.classList.add('loaded');
      });

      videoElement.addEventListener('error', () => {
        // eslint-disable-next-line no-console
        console.warn('Hero video background failed to load:', videoUrl);
        // Fallback to poster image if video fails
        if (videoPoster) {
          heroContainer.style.backgroundImage = `url('${videoPoster}')`;
          heroContainer.classList.add('video-fallback');
        }
      });

      // Respect user's motion preferences
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) {
        videoElement.pause();
        videoElement.removeAttribute('autoplay');
      }
    } else if (videoElement && videoElement.tagName === 'IFRAME') {
      // Handle iframe (Vimeo) elements
      videoElement.addEventListener('load', () => {
        videoElement.classList.add('loaded');
      });

      // Respect user's motion preferences for iframes
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion && videoUrl.includes('vimeo.com')) {
        // Update iframe src to disable autoplay
        const vimeoId = videoUrl.split('/').pop();
        videoElement.src = `https://player.vimeo.com/video/${vimeoId}?loop=1&muted=1&controls=0&background=1`;
      }
    }
  }
}
