import { readBlockConfig } from '../../scripts/aem.js';

export default function decorate(block) {
  // Extract data using both methods - config for simple fields and HTML for richtext
  const config = readBlockConfig(block);

  // Get HTML content for richtext fields (like banner block does)
  const dataHTML = [...block.children].map((row) => [
    row.children[0]?.textContent.trim() || '',
    row.children[1]?.innerHTML.trim() || '',
  ]);

  // Clear the block
  block.innerHTML = '';

  // Create main container
  const container = document.createElement('div');
  container.className = 'blog-intro-content-container';

  // Create content section (left side)
  const contentSection = document.createElement('div');
  contentSection.className = 'blog-intro-content';

  // Create image section (right side)
  const imageSection = document.createElement('div');
  imageSection.className = 'blog-intro-image';

  // Get data - use config for simple fields, dataHTML for richtext and aem-content
  const title = config.title || '';
  const description = dataHTML.find((row) => row[0] === 'description')?.[1] || '';
  const authorLinkHTML = dataHTML.find((row) => row[0] === 'authorLink')?.[1] || '';
  const image = config.image || '';
  const imageAlt = config.imagealt || '';
  const authorImage = config.authorimage || '';
  const authorImageAlt = config.authorimagealt || '';
  const authorName = config.authorname || '';
  const authorRole = config.authorrole || '';

  // Extract author link URL from aem-content HTML
  let authorLink = '';
  if (authorLinkHTML) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = authorLinkHTML;
    const linkElement = tempDiv.querySelector('a');
    if (linkElement) {
      authorLink = linkElement.href;
    }
  }

  // Add title
  if (title) {
    const titleElement = document.createElement('h1');
    titleElement.className = 'blog-intro-title';
    titleElement.textContent = title;
    contentSection.appendChild(titleElement);
  }

  // Add description
  if (description) {
    const descElement = document.createElement('div');
    descElement.className = 'blog-intro-description';
    descElement.innerHTML = description;

    // Make all links in description open in new tab
    const links = descElement.querySelectorAll('a');
    links.forEach((link) => {
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    });

    contentSection.appendChild(descElement);
  }

  // Add author section
  if (authorName || authorRole || authorImage) {
    const authorSection = document.createElement('div');
    authorSection.className = 'blog-intro-author';

    // Author image
    if (authorImage) {
      const authorImageWrapper = document.createElement('div');
      authorImageWrapper.className = 'blog-intro-author-image';

      const img = document.createElement('img');
      img.src = authorImage;
      img.alt = authorImageAlt || authorName || '';
      img.loading = 'lazy';

      authorImageWrapper.appendChild(img);
      authorSection.appendChild(authorImageWrapper);
    }

    // Author info
    const authorInfo = document.createElement('div');
    authorInfo.className = 'blog-intro-author-info';

    if (authorName) {
      if (authorLink) {
        // Create clickable link if author link is provided
        const nameElement = document.createElement('a');
        nameElement.className = 'blog-intro-author-name';
        nameElement.textContent = authorName;
        nameElement.href = authorLink;
        nameElement.target = '_blank';
        nameElement.rel = 'noopener noreferrer';
        authorInfo.appendChild(nameElement);
      } else {
        // Create non-clickable text if no link is provided
        const nameElement = document.createElement('p');
        nameElement.className = 'blog-intro-author-name';
        nameElement.textContent = authorName;
        authorInfo.appendChild(nameElement);
      }
    }

    if (authorRole) {
      const roleElement = document.createElement('p');
      roleElement.className = 'blog-intro-author-role';
      roleElement.textContent = authorRole;
      authorInfo.appendChild(roleElement);
    }

    authorSection.appendChild(authorInfo);
    contentSection.appendChild(authorSection);
  }

  // Add hero image
  if (image) {
    const img = document.createElement('img');
    img.src = image;
    img.alt = imageAlt || title || '';
    img.loading = 'lazy';
    img.className = 'blog-intro-hero-image';

    imageSection.appendChild(img);
  }

  // Assemble the layout
  container.appendChild(contentSection);
  container.appendChild(imageSection);
  block.appendChild(container);
}
