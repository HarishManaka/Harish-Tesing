// Import the story-carousel decorator and styles
import storyCarouselDecorator from '../story-carousel/story-carousel.js';
import { loadCSS } from '../../scripts/aem.js';

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
 * Check if current page SKU matches any SKU in the list
 */
function matchesSku(skuList, currentSku) {
  if (!skuList || !currentSku) return false;

  // Split comma-separated SKUs and check for match
  const skus = skuList.split(',').map((sku) => sku.trim().toLowerCase());
  return skus.includes(currentSku.toLowerCase());
}

/**
 * Create DOM structure that matches story-carousel format
 */
function createStoryCarouselDOM(testimonials, block) {
  // Clear the block
  block.innerHTML = '';

  // Create rows for each testimonial in story-carousel format
  testimonials.forEach((testimonial) => {
    const row = document.createElement('div');

    // Cell 1: Image - Create actual img element for story-carousel to process
    const imageCell = document.createElement('div');

    if (testimonial.image) {
      // Create actual img element that story-carousel expects
      const img = document.createElement('img');
      img.src = testimonial.image;
      img.alt = testimonial.imageAlt || testimonial.name || 'Testimonial';
      img.loading = 'lazy';
      img.style.width = '100%';
      img.style.height = 'auto';
      img.style.objectFit = 'cover';

      imageCell.appendChild(img);
    } else {
      // Add empty placeholder for no image case
      const placeholder = document.createElement('div');
      placeholder.style.width = '100%';
      placeholder.style.height = '400px';
      placeholder.style.backgroundColor = '#e0e0e0';
      placeholder.style.display = 'flex';
      placeholder.style.alignItems = 'center';
      placeholder.style.justifyContent = 'center';
      placeholder.textContent = 'No Image';
      imageCell.appendChild(placeholder);
    }
    row.appendChild(imageCell);

    // Cell 2: Quote
    const quoteCell = document.createElement('div');
    const quoteParagraph = document.createElement('p');
    quoteParagraph.textContent = testimonial.quote || '';
    quoteCell.appendChild(quoteParagraph);
    row.appendChild(quoteCell);

    // Cell 3: Name
    const nameCell = document.createElement('div');
    const nameParagraph = document.createElement('p');
    nameParagraph.textContent = testimonial.name || '';
    nameCell.appendChild(nameParagraph);
    row.appendChild(nameCell);

    // Cell 4: Title/Credentials
    const titleCell = document.createElement('div');
    const titleParagraph = document.createElement('p');
    titleParagraph.textContent = testimonial.title || '';
    titleCell.appendChild(titleParagraph);
    row.appendChild(titleCell);

    block.appendChild(row);
  });

  // Add story-carousel class and attributes to match the expected format
  block.classList.remove('product-testimonials');
  block.classList.add('story-carousel');
  block.setAttribute('data-block-name', 'story-carousel');
}

export default async function decorate(block) {
  // Load story-carousel CSS
  await loadCSS('/blocks/story-carousel/story-carousel.css');

  // Get the block configuration
  const rows = [...block.children];
  const data = rows.map((row) => [...row.children].map((cell) => cell));

  // Parse configuration - handle empty divs from AEM
  const config = {};

  // Try to extract from row structure, but provide defaults if empty
  if (data.length > 0 && data[0].length > 0) {
    const firstCellText = data[0][0]?.textContent?.trim();

    if (firstCellText === 'dataFile' && data[0].length > 1) {
      // Key-value format
      data.forEach((row) => {
        const key = row[0]?.textContent?.trim();
        const valueCell = row[1];

        if (key && valueCell) {
          config[key] = valueCell.textContent?.trim();
        }
      });
    } else if (firstCellText) {
      // Simple format - first row is data file
      config.dataFile = firstCellText;
    }
  }

  // Set defaults - use default path if no configuration provided
  const { dataFile = '/documents/testimonials.json' } = config;

  // Get current page SKU
  const currentSku = getSkuFromUrl();

  if (!currentSku) {
    // Not on a product page - hide the block
    block.style.display = 'none';
    return;
  }

  // Create loading state
  const loadingMessage = document.createElement('p');
  loadingMessage.className = 'testimonials-loading';
  loadingMessage.textContent = 'Loading testimonials...';
  block.appendChild(loadingMessage);

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
      if (responseText.includes('<!DOCTYPE html>')) {
        throw new Error(`Data file not found: ${dataFile}. The URL returned an HTML page instead of JSON. Please check that the testimonials data file exists at this path.`);
      }
      throw new Error(`Expected JSON but got ${contentType || 'unknown content type'}. Response starts with: ${responseText.substring(0, 100)}`);
    }

    const jsonData = await response.json();

    // Handle EDS sheet format - data is always in the 'data' property
    const rawTestimonialsData = jsonData.data || [];

    // Map the AEM spreadsheet fields to our expected format
    const testimonialsData = rawTestimonialsData.map((item) => {
      const testimonial = {
        name: item['Testimonial Name'] || item.name || '',
        title: item['Testimonial Title/Credentials'] || item.title || '',
        quote: item['Testimonial Quote'] || item.quote || '',
        image: item['Testimonial Photo'] || item.image || '',
        imageAlt: `${item['Testimonial Name'] || 'Testimonial'}, ${item['Testimonial Title/Credentials'] || 'Customer'}`,
        SKU: item['SKUs TAGGED'] || item.SKU || '',
        pdpTagged: item['PDP TAGGED'] || item.pdpTagged || '',
      };

      return testimonial;
    });

    // Find matching testimonials based on SKU
    const matchingTestimonials = testimonialsData.filter(
      (testimonial) => matchesSku(testimonial.SKU, currentSku),
    );

    if (matchingTestimonials.length === 0) {
      // Hide the block if no testimonials
      block.style.display = 'none';
      return;
    }

    // Remove loading message
    loadingMessage.remove();

    // Create the story-carousel DOM structure
    createStoryCarouselDOM(matchingTestimonials, block);

    // Apply the story-carousel decorator
    await storyCarouselDecorator(block);
  } catch (error) {
    // Error loading product testimonials data

    // Remove loading message
    loadingMessage.remove();

    // Show error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'testimonials-error';
    errorDiv.innerHTML = `
      <p>Unable to load testimonials.</p>
      <p style="font-size: 0.9em; color: #666;">Error: ${error.message}</p>
      <p style="font-size: 0.9em; color: #666;">SKU: ${currentSku}</p>
      <p style="font-size: 0.9em; color: #666;">Data file: ${dataFile}</p>
    `;

    block.innerHTML = '';
    block.appendChild(errorDiv);
  }
}
