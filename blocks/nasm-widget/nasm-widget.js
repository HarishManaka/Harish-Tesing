import { loadScript } from '../../scripts/aem.js';

export default async function decorate(block) {
  // Check if this block has already been processed (contains widget content)
  const existingWidget = block.querySelector('.nasm-widget-container');
  if (existingWidget) {
    console.warn('Block already processed, skipping decoration');
    return;
  }

  try {
    // Parse block content - Universal Editor creates mixed structure
    const launchUrlElement = block.querySelector('[data-aue-prop="launchUrl"]');
    const containerIdElement = block.querySelector('[data-aue-prop="containerId"]');
    const elementNameElement = block.querySelector('[data-aue-prop="elementName"]');
    const attributesElement = block.querySelector('[data-aue-prop="attributes"]');
    const stylesElement = block.querySelector('[data-aue-prop="styles"]');

    let launchUrl = '';
    let containerId = 'bwp-node';
    let elementName = '';
    let attributes = '';
    let styles = '';

    // Universal Editor creates data-aue-prop elements only for filled fields
    // and URL fields become links instead of data-aue-prop elements

    // Parse data-aue-prop elements (only exist if field has content)
    if (launchUrlElement) launchUrl = launchUrlElement.textContent.trim();
    if (containerIdElement) containerId = containerIdElement.textContent.trim() || 'bwp-node';
    if (elementNameElement) elementName = elementNameElement.textContent.trim();
    if (attributesElement) attributes = attributesElement.textContent.trim();
    if (stylesElement) styles = stylesElement.textContent.trim();

    // Handle URL fields that become links instead of data-aue-prop
    if (!launchUrl) {
      const firstLink = block.querySelector('a[href]');
      if (firstLink) {
        launchUrl = firstLink.href;
      }
    }

    // Handle missing fields by checking row structure for empty fields
    // Universal Editor creates one row per model field, even if empty
    const rows = block.querySelectorAll(':scope > div');
    if (rows.length >= 5) {
      // Row 0: Launch URL (handled above as link)
      // Row 1: Container ID (if empty, no data-aue-prop element)
      if (!containerIdElement && rows[1]) {
        const containerText = rows[1].textContent.trim();
        if (containerText && containerText !== 'bwp-node') containerId = containerText;
      }

      // Row 2: Element Name (should have data-aue-prop if filled)
      // Row 3: Attributes (should have data-aue-prop if filled)
      // Row 4: CSS Styles (if empty, no data-aue-prop element)
      if (!stylesElement && rows[4]) {
        const stylesText = rows[4].textContent.trim();
        if (stylesText) styles = stylesText;
      }
    }

    // For published pages (no data-aue-prop), parse from row structure
    // Each row contains one field value
    if (rows.length >= 3 && !elementNameElement) {
      // Published page structure: each row is a separate field
      const rowTexts = Array.from(rows).map((r) => r.textContent.trim());

      // Row 0: Launch URL (already extracted as link above)
      // Row 1: Container ID, Row 2: Element Name, Row 3: Attributes, Row 4: Styles
      [, containerId = 'bwp-node', elementName, attributes, styles] = rowTexts;
    }

    // Validate required launch URL
    if (!launchUrl) {
      block.innerHTML = '<p style="color: red; border: 1px solid red; padding: 10px;">Error: Launch URL is required. Please specify the full URL to the widget script.</p>';
      return;
    }

    // Clear the block content
    block.innerHTML = '';

    // Create container for the widget with specified ID
    const widgetContainer = document.createElement('div');
    widgetContainer.className = 'nasm-widget-container';
    widgetContainer.id = containerId;

    // Add container to block BEFORE loading script (widget might expect it to exist)
    block.appendChild(widgetContainer);

    // Apply custom styles if provided
    if (styles) {
      applyCustomStyles(styles, widgetContainer);
    }

    // Try to prevent alive5 chat from initializing by pre-creating the script element
    if (!document.getElementById('a5widget')) {
      const dummyScript = document.createElement('script');
      dummyScript.id = 'a5widget';
      dummyScript.setAttribute('data-widget_code_id', 'disabled');
      document.head.appendChild(dummyScript);
    }

    // Load widget script using EDS loadScript utility
    try {
      console.info('NASM Widget: Loading script from:', launchUrl);
      await loadScript(launchUrl, { async: true });
      console.info('NASM Widget: Script loaded successfully');

      // Wait a moment for the script to fully initialize, then create widget element
      await new Promise((resolve) => { setTimeout(resolve, 500); });

      if (elementName) {
        console.info('NASM Widget: Creating element:', elementName);
        const widgetElement = document.createElement(elementName);

        // Parse and set attributes if provided
        if (attributes) {
          // Parse attributes from string format: key="value" key2="value2"
          const attrPairs = attributes.match(/(\w+(-\w+)*)="([^"]*)"/g) || [];
          attrPairs.forEach((attr) => {
            const match = attr.match(/(\w+(-\w+)*)="([^"]*)"/);
            if (match) {
              const [, name, , value] = match;
              widgetElement.setAttribute(name, value);
            }
          });
        }

        // IMPORTANT: Ensure data-lead-gen is false to prevent lead capture
        if (!widgetElement.hasAttribute('data-lead-gen')) {
          widgetElement.setAttribute('data-lead-gen', 'false');
        }

        widgetContainer.appendChild(widgetElement);
        console.info('NASM Widget: Element created and appended');
      } else {
        console.warn('NASM Widget: No element name provided');
      }
    } catch (error) {
      console.error('NASM Widget: Failed to load', error);
      widgetContainer.innerHTML = `<p>Failed to load widget from: ${launchUrl}. Error: ${error.message}</p>`;
    }
  } catch (error) {
    console.error('Error in NASM widget decoration:', error);
    block.innerHTML = `<p style="color: red; padding: 10px;">Widget initialization failed: ${error.message}</p>`;
  }
}

// Helper function to apply custom styles to the widget container
function applyCustomStyles(styleString, container) {
  const styleId = 'nasm-widget-styles';

  // Remove existing styles if they exist
  const existingStyle = document.getElementById(styleId);
  if (existingStyle) {
    existingStyle.remove();
  }

  // Apply the styles as CSS
  const styleElement = document.createElement('style');
  styleElement.id = styleId;

  // Decode URL-encoded CSS and inject directly
  const decodedCSS = decodeURIComponent(styleString);
  const css = `
/* User styles */
${decodedCSS}

/* Essential container styling */
#${container.id} {
  display: block;
  width: 100%;
  overflow: visible;
}
`;

  styleElement.textContent = css;
  document.head.appendChild(styleElement);
}
