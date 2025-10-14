export default function decorate(block) {
  // Get the data from the block
  const data = [...block.children].map((row) => [...row.children]
    .map((cell) => cell.textContent.trim()));
  // Extract the content
  const titleLine1 = data.find((row) => row[0] === 'titleLine1')?.[1] || '';
  const titleLine2 = data.find((row) => row[0] === 'titleLine2')?.[1] || '';
  const subtitle = data.find((row) => row[0] === 'subtitle')?.[1] || '';
  const description = data.find((row) => row[0] === 'description')?.[1] || '';
  const ctaText = data.find((row) => row[0] === 'ctaLinkText')?.[1] || '';
  const ctaIcon = data.find((row) => row[0] === 'ctaLinkIcon')?.[1] || '';
  const ctaLink = data.find((row) => row[0] === 'ctaLink')?.[1] || '';
  const backgroundColor = data.find((row) => row[0] === 'backgroundColor')?.[1] || 'white';
  const layout = data.find((row) => row[0] === 'layout')?.[1] || 'full-width';

  // Create the banner structure
  const banner = document.createElement('div');
  let bannerClasses = 'banner-container';
  if (backgroundColor && backgroundColor !== 'white') {
    bannerClasses += ` bg-${backgroundColor}`;
  }

  banner.className = bannerClasses;

  const content = document.createElement('div');
  content.className = 'banner-content';

  if (layout) {
    content.className += ` ${layout}`;
  }

  // Create left section with title and subtitle
  const leftSection = document.createElement('div');
  leftSection.className = 'banner-left';

  if (titleLine1 || titleLine2) {
    const titleElement = document.createElement('h2');
    titleElement.className = 'banner-title';

    if (titleLine1) {
      const line1 = document.createElement('span');
      line1.className = 'banner-title-line1';
      line1.textContent = titleLine1;
      titleElement.appendChild(line1);
    }

    if (titleLine2) {
      if (titleLine1) {
        titleElement.appendChild(document.createElement('br'));
      }
      const line2 = document.createElement('span');
      line2.className = 'banner-title-line2';
      line2.textContent = titleLine2;
      titleElement.appendChild(line2);
    }

    leftSection.appendChild(titleElement);
  }

  // Create right section with subtitle and CTA
  const rightSection = document.createElement('div');
  rightSection.className = 'banner-right';

  if (subtitle) {
    const subtitleElement = document.createElement('p');
    subtitleElement.className = 'banner-subtitle';
    subtitleElement.textContent = subtitle;
    rightSection.appendChild(subtitleElement);
  }

  if (description) {
    const descriptionElement = document.createElement('p');
    descriptionElement.className = 'banner-description';
    descriptionElement.textContent = description;
    rightSection.appendChild(descriptionElement);
  }

  // Create CTA button if text or link is provided
  if (ctaText || ctaLink) {
    const ctaButton = document.createElement('a');
    ctaButton.className = 'banner-cta-button';

    // Set button text - use provided text or the link value itself
    let buttonText = ctaText || ctaLink || 'Click Here';
    let href = ctaLink || '#';

    // Handle phone numbers - if it's all digits, treat as phone number
    if (ctaLink && /^\d+$/.test(ctaLink)) {
      href = `tel:${ctaLink}`;
      // Format phone number for display if no custom text provided
      if (!ctaText && ctaLink.length === 10) {
        buttonText = `(${ctaLink.slice(0, 3)}) ${ctaLink.slice(3, 6)}-${ctaLink.slice(6)}`;
      }
    } else if (ctaLink && ctaLink.startsWith('tel:')) {
      // Extract phone number from tel: link for display
      if (!ctaText) {
        const phoneNum = ctaLink.substring(4);
        if (phoneNum.length === 10) {
          buttonText = `(${phoneNum.slice(0, 3)}) ${phoneNum.slice(3, 6)}-${phoneNum.slice(6)}`;
        } else {
          buttonText = phoneNum;
        }
      }
      href = ctaLink;
    } else if (ctaLink && ctaLink.startsWith('mailto:')) {
      // Extract email from mailto: link for display
      if (!ctaText) {
        buttonText = ctaLink.substring(7);
      }
      href = ctaLink;
    }

    ctaButton.href = href;
    ctaButton.textContent = buttonText;

    // Add icon if specified or auto-detect based on link type
    let iconToUse = ctaIcon;
    if (!iconToUse && ctaLink) {
      if (/^\d+$/.test(ctaLink) || ctaLink.startsWith('tel:')) {
        iconToUse = 'telephone';
      } else if (ctaLink.startsWith('mailto:')) {
        iconToUse = 'email';
      }
    }
    if (iconToUse) {
      const iconElement = document.createElement('span');
      iconElement.className = 'banner-cta-icon';
      let iconSvg = '';
      if (iconToUse === 'telephone') {
        // Phone icon SVG
        iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M3.654 1.328a.678.678 0 0 0-1.015-.063L1.605 2.3c-.483.484-.661 1.169-.45 1.77a17.568 17.568 0 0 0 4.168 6.608 17.569 17.569 0 0 0 6.608 4.168c.601.211 1.286.033 1.77-.45l1.034-1.034a.678.678 0 0 0-.063-1.015l-2.307-1.794a.678.678 0 0 0-.58-.122L9.98 10.654a.678.678 0 0 1-.61-.162L6.29 7.41a.678.678 0 0 1-.162-.61l.223-1.804a.678.678 0 0 0-.122-.58L3.654 1.328z"/>
        </svg>`;
      } else if (iconToUse === 'email') {
        // Email icon SVG
        iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4Zm2-1a1 1 0 0 0-1 1v.217l7 4.2 7-4.2V4a1 1 0 0 0-1-1H2Zm13 2.383-4.708 2.825L15 11.105V5.383Zm-.034 6.876-5.64-3.471L8 9.583l-1.326-.795-5.64 3.47A1 1 0 0 0 2 13h12a1 1 0 0 0 .966-.741ZM1 11.105l4.708-2.897L1 5.383v5.722Z"/>
        </svg>`;
      }
      iconElement.innerHTML = iconSvg;
      ctaButton.insertBefore(iconElement, ctaButton.firstChild);
    }

    rightSection.appendChild(ctaButton);
  }

  content.appendChild(leftSection);
  content.appendChild(rightSection);
  banner.appendChild(content);

  // Replace block content
  block.textContent = '';
  block.appendChild(banner);
}
