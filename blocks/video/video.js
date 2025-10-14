/*
 * Video Block
 * Show a video referenced by a link
 * Based on: https://www.hlx.live/developer/block-collection/video
 */

// eslint-disable-next-line import/no-unresolved
import { DotLottie } from 'https://cdn.jsdelivr.net/npm/@lottiefiles/dotlottie-web/+esm';

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

// Device detection utility
function getDeviceType() {
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

// Responsive video URL selection
function getResponsiveVideoUrl(block) {
  const deviceType = getDeviceType();
  const videoUrl = block.dataset.videoUrl || '';
  const videoUrlTablet = block.dataset.videoUrlTablet || '';
  const videoUrlMobile = block.dataset.videoUrlMobile || '';

  // Return device-specific URL if available, otherwise fall back to default
  switch (deviceType) {
    case 'mobile':
      block.dataset.deviceType = 'mobile';
      return videoUrlMobile || videoUrl;
    case 'tablet':
      block.dataset.deviceType = 'tablet';
      return videoUrlTablet || videoUrl;
    case 'desktop':
    default:
      block.dataset.deviceType = 'desktop';
      return videoUrl;
  }
}

// Responsive poster image selection
function getResponsivePosterImg(rows) {
  const deviceType = getDeviceType();

  // Extract poster image from second row
  const posterImg = rows[3]?.querySelector('img');
  const posterImgTablet = rows[4]?.querySelector('img');
  const posterImgMobile = rows[5]?.querySelector('img');

  switch (deviceType) {
    case 'mobile':
      return posterImgMobile || posterImg;
    case 'tablet':
      return posterImgTablet || posterImg;
    case 'desktop':
    default:
      return posterImg;
  }
}

// Create and initialize DotLottie animation
function createDotLottieAnimation(container, lottieData) {
  const dotLottieWrapper = document.createElement('canvas');
  dotLottieWrapper.className = 'dotlottie-canvas';

  // Determine if lottieData is a JSON object or a file path
  const isJsonObject = typeof lottieData === 'object' && lottieData !== null;

  const dotLottie = new DotLottie({
    autoplay: false,
    loop: true,
    canvas: dotLottieWrapper,
    ...(isJsonObject ? { data: lottieData } : { load: lottieData }),
  });

  // Initialize DotLottie by playing and immediately pausing to make it ready
  dotLottie.addEventListener('ready', () => {
    // Start and immediately pause to initialize the animation
    dotLottie.play();
    setTimeout(() => {
      dotLottie.pause();
    }, 100);
  });

  container.append(dotLottieWrapper);
  return dotLottie;
}

function embedYoutube(url, autoplay, background, _dotLottie = null) {
  const usp = new URLSearchParams(url.search);
  let vid = usp.get('v') ? encodeURIComponent(usp.get('v')) : '';

  if (url.origin.includes('youtu.be')) {
    [, vid] = url.pathname.split('/');
  }

  if (!vid) {
    console.error('No YouTube video ID found');
    return null;
  }

  // Create container for YouTube player
  const container = document.createElement('div');
  container.className = 'embed-container';

  // Load YouTube API if not already loaded
  if (typeof window.YT === 'undefined') {
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    document.head.appendChild(script);
  }

  // Create iframe directly
  const createIframe = () => {
    // Clear any existing content in container
    container.innerHTML = '';

    // Build YouTube embed URL
    const embedUrl = new URL(`https://www.youtube.com/embed/${vid}`);
    embedUrl.searchParams.set('rel', '0');
    embedUrl.searchParams.set('autoplay', autoplay ? '1' : '0');
    embedUrl.searchParams.set('mute', background ? '1' : '0');
    embedUrl.searchParams.set('controls', background ? '0' : '1');
    embedUrl.searchParams.set('disablekb', background ? '1' : '0');
    embedUrl.searchParams.set('loop', background ? '1' : '0');
    embedUrl.searchParams.set('playsinline', background ? '1' : '0');
    embedUrl.searchParams.set('modestbranding', '1');
    embedUrl.searchParams.set('fs', '1');
    embedUrl.searchParams.set('cc_load_policy', '0');
    embedUrl.searchParams.set('iv_load_policy', '3');
    embedUrl.searchParams.set('enablejsapi', '1');
    embedUrl.searchParams.set('origin', window.location.origin);
    embedUrl.searchParams.set('widgetid', '1');
    embedUrl.searchParams.set('forigin', window.location.origin + window.location.pathname);
    embedUrl.searchParams.set('aoriginsup', '1');
    embedUrl.searchParams.set('gporigin', window.location.origin + window.location.pathname);
    embedUrl.searchParams.set('vf', '1');

    // Create iframe element
    const iframe = document.createElement('iframe');
    iframe.id = `youtube-player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    iframe.src = embedUrl.toString();
    iframe.width = '100%';
    iframe.height = '100%';
    iframe.frameBorder = '0';
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    iframe.title = 'YouTube video player';
    iframe.style.border = '0px';
    iframe.style.top = '0px';
    iframe.style.left = '0px';
    iframe.style.width = '100%';
    iframe.style.position = 'absolute';

    // Add iframe directly to container
    container.appendChild(iframe);
  };

  // Create iframe directly
  createIframe();

  return container;
}

function embedVimeo(url, autoplay, background, _dotLottie = null) {
  const [, video] = url.pathname.split('/');

  if (!video) {
    console.error('No Vimeo video ID found');
    return null;
  }

  // Create container for Vimeo player
  const container = document.createElement('div');
  container.className = 'embed-container';

  const playerDiv = document.createElement('div');
  playerDiv.id = `vimeo-player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  playerDiv.style.cssText = 'border: 0; top: 0; left: 0; width: 100%; position: absolute;';

  container.appendChild(playerDiv);

  // Load Vimeo API if not already loaded
  if (typeof window.Vimeo === 'undefined') {
    const script = document.createElement('script');
    script.src = 'https://player.vimeo.com/api/player.js';
    script.async = true;
    document.head.appendChild(script);
  }

  // Wait for Vimeo API to be ready
  const initPlayer = () => {
    if (typeof window.Vimeo === 'undefined' || typeof window.Vimeo.Player === 'undefined') {
      setTimeout(initPlayer, 100);
      return;
    }

    const playerOptions = {
      id: parseInt(video, 10),
      width: '100%',
      height: '100%',
      autoplay,
      background,
      loop: background,
      muted: background,
      controls: !background,
      responsive: true,
      title: false,
      byline: false,
      portrait: false,
    };

    const player = new window.Vimeo.Player(playerDiv, playerOptions);

    // Set up event listeners
    player.on('play', () => {
      if (_dotLottie && (_dotLottie.isPaused || !_dotLottie.isPlaying)) {
        _dotLottie.play();
      }
    });

    player.on('pause', () => {
      if (_dotLottie && _dotLottie.isPlaying) {
        _dotLottie.pause();
      }
    });

    player.on('ended', () => {
      if (_dotLottie && _dotLottie.isPlaying) {
        _dotLottie.pause();
      }
    });

    player.on('error', (error) => {
      console.error('Vimeo player error:', error);
    });
  };

  // Initialize player when API is ready
  if (typeof window.Vimeo !== 'undefined' && typeof window.Vimeo.Player !== 'undefined') {
    initPlayer();
  } else {
    // Wait for API to load
    const checkVimeoAPI = setInterval(() => {
      if (typeof window.Vimeo !== 'undefined' && typeof window.Vimeo.Player !== 'undefined') {
        clearInterval(checkVimeoAPI);
        initPlayer();
      }
    }, 100);
  }

  return container;
}

function getVideoElement(source, autoplay, background, title) {
  const video = document.createElement('video');
  video.setAttribute('controls', '');
  if (autoplay) video.setAttribute('autoplay', '');
  if (background) video.setAttribute('muted', '');
  if (title) video.setAttribute('title', title);
  if (background) {
    video.setAttribute('loop', '');
    video.setAttribute('playsinline', '');
    video.removeAttribute('controls');
    video.addEventListener('canplay', () => {
      video.muted = true;
      if (autoplay) video.play();
    });
  }

  const sourceEl = document.createElement('source');
  sourceEl.setAttribute('src', source);
  sourceEl.setAttribute('type', `video/${source.split('.').pop()}`);
  video.append(sourceEl);

  return video;
}

const loadVideoEmbed = (block, link, autoplay, background, title, dotLottie = null) => {
  if (block.dataset.embedLoaded === 'true') {
    return;
  }
  const url = new URL(link);

  const isYoutube = link.includes('youtube') || link.includes('youtu.be');
  const isVimeo = link.includes('vimeo');

  if (isYoutube) {
    const embedWrapper = embedYoutube(url, autoplay, background, dotLottie);
    if (embedWrapper) {
      block.append(embedWrapper);
      block.dataset.embedLoaded = 'true';
    }
  } else if (isVimeo) {
    const embedWrapper = embedVimeo(url, autoplay, background, dotLottie);
    if (embedWrapper) {
      block.append(embedWrapper);
      block.dataset.embedLoaded = 'true';
    }
  } else {
    const videoEl = getVideoElement(link, autoplay, background, title);
    block.append(videoEl);
    videoEl.addEventListener('canplay', () => {
      block.dataset.embedLoaded = 'true';
    });
  }
};

export default async function decorate(block) {
  // Check if video is already loaded before doing anything
  if (block.dataset.embedLoaded === 'true') {
    return;
  }

  // Check if this block has already been decorated
  if (block.dataset.decorated === 'true') {
    return;
  }

  const rows = [...block.children];

  // Extract video URL from first row's link
  const videoLink = rows[0]?.querySelector('a');
  const videoLinkTablet = rows[1]?.querySelector('a');
  const videoLinkMobile = rows[2]?.querySelector('a');

  const videoUrl = videoLink?.href || '';
  const videoUrlTablet = videoLinkTablet?.href || '';
  const videoUrlMobile = videoLinkMobile?.href || '';

  const posterImg = getResponsivePosterImg(rows);

  // Store URLs in dataset for responsive selection
  block.dataset.videoUrl = videoUrl;
  block.dataset.videoUrlTablet = videoUrlTablet;
  block.dataset.videoUrlMobile = videoUrlMobile;

  if (videoUrl) {
    block.dataset.videoUrl = videoUrl;
  }

  if (videoUrlTablet) {
    block.dataset.videoUrlTablet = videoUrlTablet;
  }

  if (videoUrlMobile) {
    block.dataset.videoUrlMobile = videoUrlMobile;
  }

  // Extract lottie overlay from sixth row
  const lottieOverlay = rows[6]?.textContent.trim() || '';

  // Try to parse lottieOverlay as JSON if it's not empty
  let lottieData = null;
  if (lottieOverlay) {
    try {
      lottieData = JSON.parse(lottieOverlay);
    } catch (error) {
      // If parsing fails, treat it as a file path
      lottieData = lottieOverlay;
    }
  }

  // Extract title from fourth row (if exists)
  const title = rows[7]?.textContent.trim() || '';

  // Default settings - can be made configurable later
  const autoplay = rows[7]?.textContent.trim() === 'true';
  const background = rows[8]?.textContent.trim() === 'true';

  // Get the appropriate video URL for current device
  const responsiveVideoUrl = getResponsiveVideoUrl(block);

  if (!responsiveVideoUrl) {
    block.innerHTML = '<p>No video URL provided</p>';
    return;
  }

  // Clear the block content
  block.textContent = '';
  block.dataset.embedLoaded = 'false';

  // Set video classes based on configuration
  if (autoplay) block.classList.add('autoplay');

  if (posterImg) {
    block.classList.add('placeholder');
    const wrapper = document.createElement('div');
    wrapper.className = 'video-placeholder';

    // Create picture element with the poster image
    const picture = document.createElement('picture');
    const placeholder = posterImg.cloneNode(true);
    picture.append(placeholder);
    wrapper.append(picture);

    if (!autoplay) {
      const playButton = document.createElement('div');
      playButton.className = 'video-placeholder-play';
      playButton.innerHTML = '<button type="button" title="Play"></button>';

      wrapper.append(playButton);
      wrapper.addEventListener('click', () => {
        wrapper.remove();
        // Create DotLottie animation after click
        let dotLottie = null;
        if (lottieData) {
          dotLottie = createDotLottieAnimation(block, lottieData);
        }
        loadVideoEmbed(block, responsiveVideoUrl, true, false, title, dotLottie);
      });
    }
    block.append(wrapper);
  }

  if (!posterImg || autoplay) {
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        // Only load if not already loaded
        if (block.dataset.embedLoaded !== 'true') {
          const playOnLoad = autoplay && !prefersReducedMotion.matches;

          // Create DotLottie animation
          let dotLottie = null;
          if (lottieData) {
            dotLottie = createDotLottieAnimation(block, lottieData);
          }

          // Load video embed with DotLottie instance for sync
          loadVideoEmbed(block, responsiveVideoUrl, playOnLoad, background, title, dotLottie);

          // Disconnect observer immediately after starting the load process
          observer.disconnect();
        } else {
          // Video already loaded, disconnect observer
          observer.disconnect();
        }
      }
    }, {
      rootMargin: '50px 0px 50px 0px', // Start loading 50px before entering viewport
      threshold: 0.1, // Trigger when 10% of the element is visible
    });
    observer.observe(block);
  }

  // Mark block as decorated to prevent duplicate processing
  block.dataset.decorated = 'true';
}
