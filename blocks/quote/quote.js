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

  // Extract field values
  const sectionTitle = getFieldValue('sectionLabel') || 'WHAT EXPERTS ARE SAYING';
  const quoteText = getFieldHTML('quote');
  const authorName = getFieldValue('authorName');
  const authorTitle = getFieldValue('authorFirm');
  const authorCredentials = getFieldValue('authorCredentials');
  const media = getFieldValue('media'); // Can be image or video
  const mediaAlt = getImageAlt('media');
  const videoUrl = getFieldValue('videoUrl'); // If media is a video thumbnail
  const showQuoteIcon = getFieldValue('showQuoteIcon') !== 'false'; // Default to true

  // Clear the block content
  block.innerHTML = '';

  // Create section title if present
  if (sectionTitle) {
    const titleEl = document.createElement('h2');
    titleEl.className = 'quote-section-title';
    titleEl.textContent = sectionTitle;
    block.appendChild(titleEl);
  }

  // Create main container
  const container = document.createElement('div');
  container.className = 'quote-content-container';

  // Create quote content section
  const quoteContent = document.createElement('div');
  quoteContent.className = 'quote-content';

  // Add quote icon if enabled
  if (showQuoteIcon) {
    const quoteIcon = document.createElement('div');
    quoteIcon.className = 'quote-icon';
    quoteIcon.setAttribute('aria-hidden', 'true');
    quoteIcon.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" aria-hidden="true">
        <path d="M15 45c0-15 10-25 25-25v-5c-20 0-35 15-35 35v40h35V45H15zm50 0c0-15 10-25 25-25v-5c-20 0-35 15-35 35v40h35V45H65z" fill="#fff" opacity="0.7"/>
      </svg>
    `;
    quoteContent.appendChild(quoteIcon);
  }

  // Add quote text
  if (quoteText) {
    const quoteTextEl = document.createElement('blockquote');
    quoteTextEl.className = 'quote-text';
    quoteTextEl.innerHTML = quoteText;
    quoteContent.appendChild(quoteTextEl);
  }

  // Add author attribution
  if (authorName || authorTitle || authorCredentials) {
    const attribution = document.createElement('div');
    attribution.className = 'quote-attribution';

    if (authorName) {
      const nameEl = document.createElement('p');
      nameEl.className = 'quote-author-name';
      nameEl.textContent = authorName;
      if (authorTitle) nameEl.textContent += ` | ${authorTitle}`;
      attribution.appendChild(nameEl);
    }

    if (authorTitle || authorCredentials) {
      const titleEl = document.createElement('p');
      titleEl.className = 'quote-author-title';
      let titleText = '';
      if (authorCredentials) titleText += authorCredentials;

      titleEl.textContent = titleText;
      attribution.appendChild(titleEl);
    }

    quoteContent.appendChild(attribution);
  }

  // Create media section
  const mediaSection = document.createElement('div');
  mediaSection.className = 'quote-media';

  if (media) {
    const mediaWrapper = document.createElement('div');
    mediaWrapper.className = 'quote-media-wrapper';

    if (videoUrl) {
      // Check if it's a Vimeo URL
      const vimeoMatch = videoUrl.match(/vimeo\.com\/(?:.*#|.*\/)?(\d+)/);
      if (vimeoMatch) {
        // Embed Vimeo video directly
        const vimeoId = vimeoMatch[1];
        const iframe = document.createElement('iframe');
        iframe.src = `https://player.vimeo.com/video/${vimeoId}?autoplay=0&title=0&byline=0&portrait=0`;
        iframe.width = '100%';
        iframe.height = '450';
        iframe.style.aspectRatio = '3/4';
        iframe.style.border = 'none';
        iframe.allowFullscreen = true;
        iframe.allow = 'autoplay; fullscreen; picture-in-picture';
        iframe.setAttribute('aria-label', 'Embedded video');
        mediaWrapper.appendChild(iframe);
      } else {
        // For non-Vimeo videos, create thumbnail with play button
        const videoThumbnail = document.createElement('div');
        videoThumbnail.className = 'quote-video-thumbnail';
        const img = document.createElement('img');
        img.src = media;
        img.alt = mediaAlt || 'Video thumbnail';
        img.loading = 'lazy';
        videoThumbnail.appendChild(img);

        // Add play button overlay
        const playButton = document.createElement('button');
        playButton.className = 'quote-play-button';
        playButton.setAttribute('aria-label', 'Play video');
        playButton.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 68 48" aria-hidden="true">
            <path d="M66.52 7.74c-.78-2.93-2.49-5.41-5.42-6.19C55.79.13 34 0 34 0S12.21.13 6.9 1.55c-2.93.78-4.63 3.26-5.42 6.19C.06 13.05 0 24 0 24s.06 10.95 1.48 16.26c.78 2.93 2.49 5.41 5.42 6.19C12.21 47.87 34 48 34 48s21.79-.13 27.1-1.55c2.93-.78 4.64-3.26 5.42-6.19C67.94 34.95 68 24 68 24s-.06-10.95-1.48-16.26z" fill="#f00"/>
            <path d="M45 24L27 14v20" fill="#fff"/>
          </svg>
        `;
        videoThumbnail.appendChild(playButton);
        mediaWrapper.appendChild(videoThumbnail);

        // Add click handler for video
        videoThumbnail.addEventListener('click', () => {
          window.open(videoUrl, '_blank');
        });
      }
    } else {
      // Regular image
      const img = document.createElement('img');
      img.src = media;
      img.alt = mediaAlt || 'Quote media';
      img.loading = 'lazy';
      mediaWrapper.appendChild(img);
    }

    mediaSection.appendChild(mediaWrapper);
  }

  // Assemble the container
  container.appendChild(quoteContent);
  container.appendChild(mediaSection);

  block.appendChild(container);

  // Add carousel functionality if multiple quotes
  // This would be implemented based on specific requirements
}
