// Video embed functions (adapted from hero-video block)
function embedYoutube(url, autoplay, background) {
  const usp = new URLSearchParams(url.search);
  let suffix = '';
  if (background || autoplay) {
    const suffixParams = {
      autoplay: autoplay ? '1' : '0',
      mute: background ? '1' : '0',
      controls: background ? '0' : '1',
      disablekb: background ? '1' : '0',
      loop: background ? '1' : '0',
      playsinline: background ? '1' : '0',
    };
    suffix = `&${Object.entries(suffixParams).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&')}`;
  }
  let vid = usp.get('v') ? encodeURIComponent(usp.get('v')) : '';
  const embed = url.pathname;
  if (url.origin.includes('youtu.be')) {
    [, vid] = url.pathname.split('/');
  }

  const temp = document.createElement('div');
  temp.innerHTML = `<div style="left: 0; width: 100%; height: 0; position: relative; padding-bottom: 56.25%;">
      <iframe src="https://www.youtube.com${vid ? `/embed/${vid}?rel=0&v=${vid}${suffix}` : embed}" style="border: 0; top: 0; left: 0; width: 100%; height: 100%; position: absolute;" 
      allow="autoplay; fullscreen; picture-in-picture; encrypted-media; accelerometer; gyroscope; picture-in-picture" allowfullscreen="" scrolling="no" title="Content from Youtube" loading="lazy"></iframe>
    </div>`;
  return temp.children.item(0);
}

function embedVimeo(url, autoplay, background) {
  const [, video] = url.pathname.split('/');
  let suffix = '';
  if (background || autoplay) {
    const suffixParams = {
      autoplay: autoplay ? '1' : '0',
      background: background ? '1' : '0',
    };
    suffix = `?${Object.entries(suffixParams).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&')}`;
  }
  const temp = document.createElement('div');
  temp.innerHTML = `<div style="left: 0; width: 100%; height: 0; position: relative; padding-bottom: 56.25%;">
      <iframe src="https://player.vimeo.com/video/${video}${suffix}" 
      style="border: 0; top: 0; left: 0; width: 100%; height: 100%; position: absolute;" 
      frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen  
      title="Content from Vimeo" loading="lazy"></iframe>
    </div>`;
  return temp.children.item(0);
}

const loadVideoEmbed = (container, link, autoplay, background) => {
  if (container.dataset.embedLoaded === 'true') {
    return;
  }
  const url = new URL(link);

  const isYoutube = link.includes('youtube') || link.includes('youtu.be');
  const isVimeo = link.includes('vimeo');

  if (isYoutube) {
    const embedWrapper = embedYoutube(url, autoplay, background);
    container.append(embedWrapper);
    embedWrapper.querySelector('iframe').addEventListener('load', () => {
      container.dataset.embedLoaded = true;
    });
  } else if (isVimeo) {
    const embedWrapper = embedVimeo(url, autoplay, background);
    container.append(embedWrapper);
    embedWrapper.querySelector('iframe').addEventListener('load', () => {
      container.dataset.embedLoaded = true;
    });
  }
};

export default async function decorate(block) {
  // Create a more flexible data extraction function
  const getFieldValue = (fieldName) => {
    const row = [...block.children].find((r) => r.children[0]?.textContent.trim() === fieldName);
    if (!row) return '';

    // Check if it's an image field
    const img = row.children[1]?.querySelector('img');
    if (img) {
      return img.src;
    }

    // Return text content
    return row.children[1]?.textContent.trim() || '';
  };

  const getFieldHTML = (fieldName) => {
    const row = [...block.children].find((r) => r.children[0]?.textContent.trim() === fieldName);
    return row?.children[1]?.innerHTML.trim() || '';
  };

  const getImageAlt = (fieldName) => {
    const row = [...block.children].find((r) => r.children[0]?.textContent.trim() === fieldName);
    const img = row?.children[1]?.querySelector('img');
    return img?.alt || '';
  };

  // Log all available fields for debugging
  const allFields = [...block.children]
    .map((row) => row.children[0]?.textContent.trim())
    .filter(Boolean);
  console.debug('Available fields:', allFields);

  // Extract field values using flexible approach
  const image = getFieldValue('image');
  const imageAlt = getImageAlt('image');
  const videoUrl = getFieldValue('videoUrl');
  const mediaSelect = getFieldValue('mediaSelect') || 'image';
  const icon = getFieldValue('icon');
  const iconAlt = getImageAlt('icon');

  // Extract text fields using simplified field names
  const supHeading = getFieldValue('supHeading');
  const mainHeading = getFieldValue('mainHeading');
  const mainHeadingType = getFieldValue('mainHeadingType') || 'h2';
  const subHeading = getFieldHTML('subHeading');
  const cta = getFieldHTML('cta');
  const ctaText = getFieldValue('ctaText');
  const ctaType = getFieldValue('ctaType') || 'primary';
  const backgroundColor = getFieldValue('backgroundColor') || 'white';

  // Clear the block content
  block.innerHTML = '';

  // Check block classes to determine layout
  const isImageLeft = block.classList.contains('image-left');
  const isImageRight = block.classList.contains('image-right');
  const isBackgroundImage = block.classList.contains('background-image') || (!isImageLeft && !isImageRight);

  // Apply background color for left/right layouts
  if ((isImageLeft || isImageRight) && backgroundColor && backgroundColor !== 'transparent') {
    block.classList.add(`bg-${backgroundColor}`);
  }

  // Create main media element (image or video)
  const mediaDiv = document.createElement('div');
  mediaDiv.className = mediaSelect === 'video' ? 'featured-card-video' : 'featured-card-image';

  // Determine which media to use - prioritize video if mediaSelect is video and videoUrl exists
  const useVideo = mediaSelect === 'video' && videoUrl;
  const useImage = !useVideo && image;

  if (useVideo) {
    // For embedded videos (YouTube/Vimeo)
    if (isBackgroundImage) {
      // For background video, set autoplay and mute
      loadVideoEmbed(mediaDiv, videoUrl, true, true);
    } else if (image) {
      // For side videos with poster image, create with play button
      const videoPlaceholder = document.createElement('div');
      videoPlaceholder.className = 'featured-card-video-placeholder';

      const posterImg = document.createElement('img');
      posterImg.src = image;
      posterImg.alt = imageAlt || 'Video thumbnail';
      posterImg.loading = 'lazy';
      videoPlaceholder.appendChild(posterImg);

      // Add play button
      const playButton = document.createElement('div');
      playButton.className = 'featured-card-play-button';
      playButton.innerHTML = '<button type="button" title="Play Video" aria-label="Play Video"></button>';
      videoPlaceholder.appendChild(playButton);

      // Add click handler to load video
      videoPlaceholder.addEventListener('click', () => {
        videoPlaceholder.remove();
        loadVideoEmbed(mediaDiv, videoUrl, true, false);
      });

      mediaDiv.appendChild(videoPlaceholder);
    } else {
      // Load video immediately if no poster
      loadVideoEmbed(mediaDiv, videoUrl, false, false);
    }
  } else if (useImage) {
    const img = document.createElement('img');
    img.src = image;
    img.alt = imageAlt;
    img.loading = 'lazy';

    if (isBackgroundImage) {
      // For background image, wrap in picture element
      const picture = document.createElement('picture');
      picture.appendChild(img);
      mediaDiv.appendChild(picture);
    } else {
      // For side images, use img directly
      mediaDiv.appendChild(img);
    }
  }

  // Create content wrapper
  const featuredCardContent = document.createElement('div');
  featuredCardContent.className = 'featured-card-content';

  // Add icon if present
  if (icon) {
    const iconDiv = document.createElement('div');
    iconDiv.className = 'featured-card-icon';

    const iconImg = document.createElement('img');
    iconImg.src = icon;
    iconImg.alt = iconAlt;
    iconImg.loading = 'lazy';

    iconDiv.appendChild(iconImg);
    featuredCardContent.appendChild(iconDiv);
  }

  // Create text wrapper
  const textWrapper = document.createElement('div');
  textWrapper.className = 'featured-card-text-wrapper';

  // Add sup heading if present
  if (supHeading) {
    const supHeadingEl = document.createElement('p');
    supHeadingEl.className = 'featured-card-sup-heading';
    supHeadingEl.textContent = supHeading;
    textWrapper.appendChild(supHeadingEl);
  }

  // Add main heading if present
  if (mainHeading) {
    const mainHeadingEl = document.createElement(mainHeadingType);
    mainHeadingEl.className = 'featured-card-main-heading';
    mainHeadingEl.textContent = mainHeading;
    textWrapper.appendChild(mainHeadingEl);
  }

  // Add sub heading if present (richtext)
  if (subHeading) {
    const subHeadingEl = document.createElement('div');
    subHeadingEl.className = 'featured-card-sub-heading';
    subHeadingEl.innerHTML = subHeading;
    textWrapper.appendChild(subHeadingEl);
  }

  // Add CTA button if present
  if (cta || ctaText) {
    const ctaDiv = document.createElement('div');
    ctaDiv.className = 'featured-card-cta';

    if (cta) {
      // If CTA is a link (aem-content field with HTML)
      ctaDiv.innerHTML = cta;
    } else if (ctaText) {
      // If CTA is just text, create a button
      const button = document.createElement('button');
      button.className = 'button';
      button.classList.add(ctaType.toLowerCase());
      button.textContent = ctaText;
      ctaDiv.appendChild(button);
    }

    textWrapper.appendChild(ctaDiv);
  }

  featuredCardContent.appendChild(textWrapper);

  // Build the final structure based on layout
  if (isImageLeft || isImageRight) {
    // Side-by-side layout
    const container = document.createElement('div');
    container.className = 'featured-card-container';

    if (isImageLeft) {
      container.appendChild(mediaDiv);
      container.appendChild(featuredCardContent);
    } else {
      container.appendChild(featuredCardContent);
      container.appendChild(mediaDiv);
    }

    block.appendChild(container);
  } else {
    // Background media layout (default)
    block.appendChild(mediaDiv);
    block.appendChild(featuredCardContent);
  }
}
