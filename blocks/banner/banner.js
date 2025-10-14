export default function decorate(block) {
  // Get the data from the block
  const data = [...block.children].map((row) => [...row.children]
    .map((cell) => cell.textContent.trim()));

  const dataHTML = [...block.children].map((row) => [
    row.children[0]?.textContent.trim() || '',
    row.children[1]?.innerHTML.trim() || '',
  ]);

  // Extract the content
  const titleLine1 = data.find((row) => row[0] === 'titleLine1')?.[1] || '';
  const titleLine1Color = data.find((row) => row[0] === 'titleLine1Color')?.[1] || 'white';
  const titleLine2 = data.find((row) => row[0] === 'titleLine2')?.[1] || '';
  const titleLine2Color = data.find((row) => row[0] === 'titleLine2Color')?.[1] || 'teal';
  const description = dataHTML.find((row) => row[0] === 'description')?.[1] || '';
  const backgroundColor = data.find((row) => row[0] === 'backgroundColor')?.[1] || 'white';
  const flexibleLayout = data.find((row) => row[0] === 'flexibleLayout')?.[1] === 'true';
  const titleLine1Size = data.find((row) => row[0] === 'titleLine1Size')?.[1] || 'large';
  const titleLine2Size = data.find((row) => row[0] === 'titleLine2Size')?.[1] || 'large';
  const descriptionSize = data.find((row) => row[0] === 'descriptionSize')?.[1] || 'medium';
  const descriptionWeight = data.find((row) => row[0] === 'descriptionWeight')?.[1] || 'regular';
  const descriptionColor = data.find((row) => row[0] === 'descriptionColor')?.[1] || 'default';
  const descriptionLayout = data.find((row) => row[0] === 'descriptionLayout')?.[1] || 'full-width';
  const contentAlign = data.find((row) => row[0] === 'contentAlign')?.[1] || 'center';
  const textAlign = data.find((row) => row[0] === 'textAlign')?.[1] || 'center';
  const bannerLayout = data.find((row) => row[0] === 'bannerLayout')?.[1] || 'column';

  // Create the banner structure
  const banner = document.createElement('div');

  let bannerClasses = 'banner-container';
  if (backgroundColor) {
    bannerClasses += ` bg-${backgroundColor}`;
  }
  if (flexibleLayout) {
    bannerClasses += ' flexible-layout';
  }
  banner.className = bannerClasses;
  banner.setAttribute('data-content-align', contentAlign);
  banner.setAttribute('data-banner-layout', bannerLayout);
  banner.setAttribute('data-text-align', textAlign);

  banner.style.setProperty('--content-align', contentAlign);
  banner.style.setProperty('--banner-layout', bannerLayout);
  banner.style.setProperty('--text-align', textAlign);

  const content = document.createElement('div');
  content.className = 'banner-content';

  if (contentAlign === 'left') {
    content.style.setProperty('align-items', 'flex-start');
  } else if (contentAlign === 'right') {
    content.style.setProperty('align-items', 'flex-end');
  } else {
    content.style.setProperty('align-items', 'center');
  }

  // Create left section with title
  const mainSection = document.createElement('div');
  mainSection.className = 'banner-main';

  if (titleLine1 || titleLine2) {
    const titleElement = document.createElement('h2');
    titleElement.className = 'banner-title';

    if (titleLine1) {
      const line1 = document.createElement('span');
      line1.className = `banner-title-line1 ${titleLine1Color} ${titleLine1Size}`;
      line1.textContent = titleLine1;
      line1.setAttribute('role', 'heading');
      line1.setAttribute('aria-level', '2');
      titleElement.appendChild(line1);
    }

    if (titleLine2) {
      if (titleLine1) {
        if (flexibleLayout) {
          titleElement.appendChild(document.createElement('br'));
        } else {
          titleElement.appendChild(document.createTextNode(' '));
        }
      }
      const line2 = document.createElement('span');
      line2.className = `banner-title-line2 ${titleLine2Color} ${titleLine2Size}`;
      line2.textContent = titleLine2;
      line2.setAttribute('role', 'heading');
      line2.setAttribute('aria-level', '2');
      titleElement.appendChild(line2);
    }

    mainSection.appendChild(titleElement);
  }

  // Create right section with description
  const descriptionSection = document.createElement('div');
  descriptionSection.className = 'banner-desc-wrapper';

  if (description) {
    const descriptionElement = document.createElement('div');
    descriptionElement.className = `banner-description ${descriptionSize} ${descriptionWeight} ${descriptionColor === 'default' ? '' : descriptionColor} ${descriptionLayout === 'boxed' ? 'boxed' : ''}`;
    descriptionElement.innerHTML = description;
    descriptionSection.appendChild(descriptionElement);
  }

  content.appendChild(mainSection);
  content.appendChild(descriptionSection);
  banner.appendChild(content);

  // Replace block content
  block.textContent = '';
  block.appendChild(banner);
}
