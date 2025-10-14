export default function decorate(block) {
  // Check if block already has the expected structure from authoring
  const existingItems = block.querySelectorAll(':scope > div');
  const mediaItems = [];

  if (existingItems.length > 0) {
    // Process existing authored content
    // Each item always has exactly 4 divs:
    // 1. Image (with alt text embedded)
    // 2. Video URL
    // 3. Video poster (with alt text embedded)
    // 4. Video title
    existingItems.forEach((item) => {
      item.style.display = 'none';
      const children = item.querySelectorAll(':scope > div');

      // We always have exactly 4 divs
      if (children.length === 4) {
        // Check div[1] (second div) for video URL
        const videoUrlDiv = children[1];
        const videoUrl = videoUrlDiv?.textContent.trim();

        if (videoUrl && isVimeoUrl(videoUrl)) {
          // It's a video item - use divs 1-3 (videoUrl, videoPoster, videoTitle)
          const videoId = extractVimeoId(videoUrl);
          if (videoId) {
            const posterImg = children[2]?.querySelector('img');
            const videoTitle = children[3]?.textContent.trim() || '';

            mediaItems.push({
              type: 'video',
              videoId,
              videoUrl,
              src: posterImg ? posterImg.src : `https://vumbnail.com/${videoId}.jpg`,
              alt: posterImg?.alt || 'Video thumbnail',
              title: videoTitle,
            });
          }
        } else {
          // It's an image item - use div 0 (image with alt)
          const imageDiv = children[0];
          const img = imageDiv?.querySelector('img');

          if (img) {
            mediaItems.push({
              type: 'image',
              src: img.src,
              alt: img.alt || '',
            });
          }
        }
      } else {
        console.warn(`Expected exactly 4 divs per mansory item, found ${children.length}`);
      }
    });
  }

  // Create carousel structure
  createCarousel(block, mediaItems);

  function isVimeoUrl(url) {
    return /vimeo\.com\/(\d+)/.test(url);
  }

  function extractVimeoId(url) {
    const match = url.match(/vimeo\.com\/(\d+)/);
    return match ? match[1] : null;
  }

  function createCarousel(container, items) {
    // Create wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'mansory-inner-wrapper';

    const track = document.createElement('div');
    track.className = 'mansory-track';

    // Create two sets of masonry grids for seamless scrolling
    for (let set = 0; set < 2; set += 1) {
      const masonryGrid = document.createElement('div');
      masonryGrid.className = 'mansory-inner-container';
      if (set === 1) {
        masonryGrid.classList.add('mansory-right');
      }

      items.forEach((mediaItem) => {
        const item = createMasonryItem(mediaItem);
        masonryGrid.appendChild(item);
      });

      track.appendChild(masonryGrid);
    }

    wrapper.appendChild(track);
    container.appendChild(wrapper);
  }

  function createMasonryItem(mediaItem) {
    const item = document.createElement('div');
    item.className = 'mansory-item';

    if (mediaItem.type === 'video') {
      item.classList.add('mansory-video-item');
      item.dataset.videoId = mediaItem.videoId;
      item.dataset.videoUrl = mediaItem.videoUrl;

      // Create video placeholder with thumbnail
      const placeholder = document.createElement('div');
      placeholder.className = 'video-placeholder';

      const img = document.createElement('img');
      img.src = mediaItem.src;
      img.alt = mediaItem.alt;
      img.loading = 'lazy';
      placeholder.appendChild(img);

      // Add play button overlay
      const playButton = document.createElement('button');
      playButton.className = 'play-button';
      playButton.setAttribute('aria-label', 'Play video');
      playButton.innerHTML = `
        <svg preserveAspectRatio="none" width="100%" height="100%" viewBox="0 0 92 102" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g filter="url(#mansory-play-shadow)">
            <path d="M76.0417 40.4046L22.875 8.9879C18.4948 6.42019 12 8.9879 12 15.1806V78.0139C12 83.7535 18.0417 87.2275 22.875 84.3577L76.0417 52.941C80.724 50.0712 80.724 43.2744 76.0417 40.4046ZM19.25 76.5035V16.8421C19.25 16.0869 20.0052 15.6337 20.6094 16.0869L71.0573 45.8421C71.6615 46.2952 71.6615 47.0504 71.0573 47.5035L20.6094 77.2587C20.0052 77.5608 19.25 77.2587 19.25 76.5035Z" fill="currentColor"/>
          </g>
          <defs>
            <filter id="mansory-play-shadow" x="0" y="0" width="91.5534" height="101.385" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
              <feFlood flood-opacity="0" result="BackgroundImageFix"/>
              <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
              <feOffset dy="4"/>
              <feGaussianBlur stdDeviation="6"/>
              <feComposite in2="hardAlpha" operator="out"/>
              <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.35 0"/>
              <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow"/>
              <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape"/>
            </filter>
          </defs>
        </svg>
      `;
      playButton.addEventListener('click', (e) => {
        e.stopPropagation();
        loadVimeoVideo(item, mediaItem);
      });

      placeholder.appendChild(playButton);
      item.appendChild(placeholder);
    } else {
      // Regular image
      const img = document.createElement('img');
      img.src = mediaItem.src;
      img.alt = mediaItem.alt;
      img.loading = 'lazy';
      item.appendChild(img);
    }

    return item;
  }

  function loadVimeoVideo(container, mediaItem) {
    // Clear the placeholder
    container.innerHTML = '';
    container.classList.add('video-loading');

    // Create Vimeo iframe
    const iframe = document.createElement('iframe');
    iframe.src = `https://player.vimeo.com/video/${mediaItem.videoId}?autoplay=1&muted=1`;
    iframe.width = '100%';
    iframe.height = '100%';
    iframe.setAttribute('frameborder', '0');
    iframe.allow = 'autoplay; fullscreen; picture-in-picture';
    iframe.allowFullscreen = true;
    iframe.title = mediaItem.title || 'Vimeo video';

    // Add iframe to container
    container.appendChild(iframe);
    container.classList.remove('video-loading');
    container.classList.add('video-playing');

    // Stop the carousel animation when video is playing
    const track = container.closest('.mansory-track');
    if (track) {
      track.style.animationPlayState = 'paused';
    }
  }

  // Setup Intersection Observer for lazy loading videos
  const observerOptions = {
    root: null,
    rootMargin: '50px',
    threshold: 0.1,
  };

  const videoObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const videoItem = entry.target;
        const img = videoItem.querySelector('img');

        // Load high-quality Vimeo thumbnail if needed
        if (videoItem.dataset.videoId && img && !img.dataset.loaded) {
          // Fetch Vimeo thumbnail via their API (optional enhancement)
          fetchVimeoThumbnail(videoItem.dataset.videoId).then((thumbnailUrl) => {
            if (thumbnailUrl) {
              img.src = thumbnailUrl;
              img.dataset.loaded = 'true';
            }
          }).catch(() => {
            // Fallback already in place
          });
        }
      }
    });
  }, observerOptions);

  // Observe all video items
  const videoItems = block.querySelectorAll('.mansory-video-item');
  videoItems.forEach((item) => {
    videoObserver.observe(item);
  });

  // Optional: Fetch high-quality Vimeo thumbnail
  async function fetchVimeoThumbnail(videoId) {
    try {
      const response = await fetch(`https://vimeo.com/api/v2/video/${videoId}.json`);
      const data = await response.json();
      return data[0].thumbnail_large;
    } catch (error) {
      // Use fallback thumbnail
      return null;
    }
  }
}
