import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Get SKU from current page URL
 * Supports format: /products/subscription/nasm-one/NASM-One
 * Returns the last segment (SKU)
 */
function getSkuFromUrl() {
  const path = window.location.pathname;
  // Match pattern: /products/.../.../SKU
  const segments = path.split('/').filter((segment) => segment);

  // Return the last segment as SKU if it's a product page
  if (segments[0] === 'products' && segments.length >= 2) {
    return segments[segments.length - 1];
  }

  return null;
}

/**
 * Parse FAQ content into individual FAQ items
 * Format: "Heading: question\nDescription: answer\nHeading: next question..."
 */
function parseFaqContent(faqText) {
  if (!faqText || !faqText.trim()) return [];

  const lines = faqText.split('\n').map((line) => line.trim()).filter((line) => line);
  const faqs = [];
  let currentFaq = null;
  let collectingDescription = false;

  lines.forEach((line) => {
    if (line.startsWith('Heading: ')) {
      // Start new FAQ
      if (currentFaq && currentFaq.question) {
        faqs.push(currentFaq);
      }
      currentFaq = {
        question: line.substring(9), // Remove "Heading: "
        answer: '',
      };
      collectingDescription = false;
    } else if (line.startsWith('Description: ') && currentFaq) {
      // Start collecting description
      currentFaq.answer = line.substring(13); // Remove "Description: "
      collectingDescription = true;
    } else if (collectingDescription && currentFaq && !line.startsWith('Heading: ')) {
      // Continue collecting description lines until next heading
      currentFaq.answer += `\n${line}`;
    }
  });

  // Don't forget the last FAQ
  if (currentFaq && currentFaq.question) {
    faqs.push(currentFaq);
  }

  return faqs;
}

/**
 * Check if current page SKU matches any SKU in the list
 */
function matchesSku(skuList, currentSku) {
  if (!skuList || !currentSku) return false;

  // Split comma-separated SKUs and check for match
  const skus = skuList.split(',').map((sku) => sku.trim().toLowerCase());
  return skus.includes(currentSku.toLowerCase());
}

/**
 * Create accordion structure for FAQs
 */
function createAccordion(faqs, title) {
  // Create title element
  const titleElement = document.createElement('div');
  titleElement.innerHTML = `<h2>${title}</h2>`;

  // Create accordion wrapper
  const accordionWrapper = document.createElement('div');
  accordionWrapper.className = 'accordion-wrapper';

  faqs.forEach((faq, index) => {
    // Create accordion item
    const accordionItem = document.createElement('div');
    accordionItem.className = 'accordion-item';

    // Create header button
    const button = document.createElement('button');
    button.className = 'accordion-header';
    button.setAttribute('aria-expanded', 'false');
    button.textContent = faq.question;
    button.id = `faq-header-${index}`;

    // Create content panel
    const panel = document.createElement('div');
    panel.className = 'accordion-panel';
    panel.setAttribute('aria-labelledby', button.id);
    panel.id = `faq-panel-${index}`;
    button.setAttribute('aria-controls', panel.id);

    // Add answer content - handle multiple lines
    const answerDiv = document.createElement('div');
    answerDiv.className = 'accordion-answer';

    // Split answer by newlines and create separate paragraphs
    const answerLines = faq.answer.split('\n').map((line) => line.trim()).filter((line) => line);

    if (answerLines.length === 1) {
      // Single line answer
      const [firstLine] = answerLines;
      const p = document.createElement('p');
      p.textContent = firstLine;
      answerDiv.appendChild(p);
    } else {
      // Multiple lines - create separate paragraphs or list items
      answerLines.forEach((line) => {
        const p = document.createElement('p');
        p.textContent = line;
        answerDiv.appendChild(p);
      });
    }

    panel.appendChild(answerDiv);

    // Build accordion structure
    accordionItem.appendChild(button);
    accordionItem.appendChild(panel);
    accordionWrapper.appendChild(accordionItem);

    // Add click handler
    button.addEventListener('click', () => {
      const isExpanded = button.getAttribute('aria-expanded') === 'true';

      // Close all other accordion items
      if (!isExpanded) {
        accordionWrapper.querySelectorAll('.accordion-item').forEach((otherItem) => {
          if (otherItem !== accordionItem) {
            otherItem.classList.remove('active');
            otherItem.querySelector('.accordion-header').setAttribute('aria-expanded', 'false');
          }
        });
      }

      // Toggle current item
      button.setAttribute('aria-expanded', !isExpanded);
      accordionItem.classList.toggle('active');
    });
  });

  return { titleElement, accordionWrapper };
}

export default async function decorate(block) {
  // Get the block configuration
  const rows = [...block.children];
  const data = rows.map((row) => [...row.children]
    .map((cell) => cell));

  // Parse configuration
  const config = {};

  // Check if data is in key-value format
  if (data[0] && data[0][0]?.textContent?.trim() === 'dataFile') {
    // Key-value format
    data.forEach((row) => {
      const key = row[0]?.textContent?.trim();
      const valueCell = row[1];

      if (key && valueCell) {
        if (key === 'footerContent' && valueCell.innerHTML) {
          // Preserve rich text content
          config[key] = valueCell.innerHTML;
        } else {
          config[key] = valueCell.textContent?.trim();
        }
      }
    });
  } else {
    // Simple format - first row is data file
    config.dataFile = data[0]?.[0]?.textContent?.trim();

    // Row 1 could be heading or image
    if (data[1]?.[0]) {
      const firstContent = data[1][0];
      // Check if it's an image
      const pictureEl = firstContent.querySelector('picture');
      const imgEl = firstContent.querySelector('img');

      if (pictureEl || imgEl) {
        // It's an image
        if (pictureEl && imgEl) {
          config.pictureElement = pictureEl.cloneNode(true);
          config.imageAlt = imgEl.alt || 'FAQ illustration';
        } else if (imgEl) {
          config.image = imgEl.src;
          config.imageAlt = imgEl.alt;
        }
      } else {
        // It's likely the heading
        config.heading = firstContent.textContent.trim();
      }
    }

    // Continue parsing remaining rows
    let currentRow = 2;

    // Check if we haven't found an image yet
    if (!config.image && !config.pictureElement && data[currentRow]?.[0]) {
      const content = data[currentRow][0];
      const pictureEl = content.querySelector('picture');
      const imgEl = content.querySelector('img');

      if (pictureEl || imgEl) {
        if (pictureEl && imgEl) {
          config.pictureElement = pictureEl.cloneNode(true);
          config.imageAlt = imgEl.alt || 'FAQ illustration';
        } else if (imgEl) {
          config.image = imgEl.src;
          config.imageAlt = imgEl.alt;
        }
        currentRow += 1;
      }
    }

    // Layout
    if (data[currentRow]?.[0]) {
      const text = data[currentRow][0].textContent.trim();
      if (text.includes('-')) {
        config.layout = text;
        currentRow += 1;
      }
    }

    // Footer content
    if (data[currentRow]?.[0]) {
      const footerContent = data[currentRow][0];
      if (footerContent.innerHTML) {
        config.footerContent = footerContent.innerHTML;
      } else {
        config.footerContent = footerContent.textContent.trim();
      }
    }
  }

  // Set defaults
  const {
    dataFile,
    image: imageUrl,
    pictureElement,
    imageAlt = 'FAQ illustration',
    layout = 'accordion-only',
    heading = 'Frequently Asked Questions',
  } = config;

  // eslint-disable-next-line no-console
  console.info(`Loading FAQ with layout: ${layout}, has image: ${!!(imageUrl || pictureElement)}`);

  // Get current page SKU
  const currentSku = getSkuFromUrl();

  if (!currentSku) {
    // Not on a product page - hide the block
    block.style.display = 'none';
    return;
  }

  try {
    // Fetch the JSON data
    const response = await fetch(dataFile);
    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.status} - ${response.statusText}`);
    }

    // Check if response is actually JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const responseText = await response.text();
      throw new Error(`Expected JSON but got ${contentType || 'unknown content type'}. Response starts with: ${responseText.substring(0, 100)}`);
    }

    const jsonData = await response.json();

    // Handle EDS sheet format - data is always in the 'data' property
    const faqData = jsonData.data || [];

    // Find matching FAQ entry based on SKU
    const matchingEntry = faqData.find((entry) => matchesSku(entry.SKU, currentSku));

    if (!matchingEntry) {
      // eslint-disable-next-line no-console
      console.info(`No FAQ data found for SKU: ${currentSku}`);
      // Hide the block if no FAQ data
      block.style.display = 'none';
      return;
    }

    // Parse FAQ content
    const faqs = parseFaqContent(matchingEntry.FAQ);

    if (faqs.length === 0) {
      // Hide the block if no FAQ content
      block.style.display = 'none';
      return;
    }

    // Create accordion - use custom heading or fallback to title from data
    const accordionHeading = heading || matchingEntry.Title || 'Frequently Asked Questions';
    const { titleElement, accordionWrapper } = createAccordion(faqs, accordionHeading);

    // Replace block content
    block.innerHTML = '';

    // Apply layout class
    block.classList.add(`layout-${layout}`);

    if (layout === 'accordion-only') {
      // Simple layout - just accordion
      block.appendChild(titleElement);
      block.appendChild(accordionWrapper);

      // Add footer if provided
      if (config.footerContent) {
        const footerDiv = document.createElement('div');
        footerDiv.className = 'accordion-footer';
        footerDiv.innerHTML = config.footerContent;
        block.appendChild(footerDiv);
      }
    } else {
      // Two column layout with image
      // Create container
      const container = document.createElement('div');
      container.className = 'product-faq-content-container';

      // Create image wrapper
      if (imageUrl || pictureElement) {
        const imageWrapper = document.createElement('div');
        imageWrapper.className = 'product-faq-image';

        if (pictureElement) {
          // Use the cloned picture element
          imageWrapper.appendChild(pictureElement);
        } else {
          // Create simple img element
          const img = document.createElement('img');
          img.src = imageUrl;
          img.alt = imageAlt;
          img.loading = 'lazy';
          imageWrapper.appendChild(img);
        }

        if (layout === 'image-left') {
          container.appendChild(imageWrapper);
        }
      }

      // Create accordion wrapper
      const accordionContainer = document.createElement('div');
      accordionContainer.className = 'product-faq-content';
      accordionContainer.appendChild(titleElement);
      accordionContainer.appendChild(accordionWrapper);

      // Add footer if provided
      if (config.footerContent) {
        const footerDiv = document.createElement('div');
        footerDiv.className = 'accordion-footer';
        footerDiv.innerHTML = config.footerContent;
        accordionContainer.appendChild(footerDiv);
      }

      container.appendChild(accordionContainer);

      if (layout === 'image-right' && (imageUrl || pictureElement)) {
        const imageWrapper = document.createElement('div');
        imageWrapper.className = 'product-faq-image';

        if (pictureElement) {
          // Use the cloned picture element - need to clone again for right position
          imageWrapper.appendChild(pictureElement.cloneNode(true));
        } else {
          // Create simple img element
          const img = document.createElement('img');
          img.src = imageUrl;
          img.alt = imageAlt;
          img.loading = 'lazy';
          imageWrapper.appendChild(img);
        }

        container.appendChild(imageWrapper);
      }

      block.appendChild(container);
    }

    // Move instrumentation if needed
    moveInstrumentation(block, accordionWrapper);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error loading product FAQ data:', error);

    // Show error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'product-faq-error';
    errorDiv.innerHTML = `
      <p>Unable to load FAQ data.</p>
      <p style="font-size: 0.9em; color: #666;">Error: ${error.message}</p>
      <p style="font-size: 0.9em; color: #666;">SKU: ${currentSku}</p>
      <p style="font-size: 0.9em; color: #666;">Data file: ${dataFile || 'No path specified'}</p>
    `;

    block.innerHTML = '';
    block.appendChild(errorDiv);
  }
}
