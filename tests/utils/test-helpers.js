/**
 * Creates a mock block element with standard AEM block structure
 * @param {string} blockName - Name of the block
 * @param {Array} rows - Array of row data for the block
 * @returns {HTMLElement} - Mock block element
 */
export function createBlockElement(blockName, rows = []) {
  const block = document.createElement('div');
  block.className = blockName;
  block.dataset.blockName = blockName;

  rows.forEach((row) => {
    const rowElement = document.createElement('div');
    if (Array.isArray(row)) {
      row.forEach((cell) => {
        const cellElement = document.createElement('div');
        if (typeof cell === 'string') {
          cellElement.innerHTML = cell;
        } else if (cell instanceof HTMLElement) {
          cellElement.appendChild(cell);
        }
        rowElement.appendChild(cellElement);
      });
    } else {
      rowElement.innerHTML = row;
    }
    block.appendChild(rowElement);
  });

  if (process.env.DEBUG === 'test') {
    // eslint-disable-next-line no-console
    console.log(`Test helpers: Created block element for ${blockName}`);
  }

  return block;
}

/**
 * Loads CSS for testing by injecting style element
 * @param {string} css - CSS content to inject
 */
export function loadBlockCSS(css) {
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  if (process.env.DEBUG === 'test') {
    // eslint-disable-next-line no-console
    console.log('Test helpers: Block CSS loaded');
  }
}

/**
 * Mocks AEM environment variables and context
 */
export function mockAEMEnvironment() {
  // Mock window globals
  window.hlx = {
    codeBasePath: '/scripts',
    lighthouse: false,
    rum: { isSelected: false },
  };

  // Mock metadata
  const metaTags = [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { name: 'theme-color', content: '#000000' },
    { property: 'og:title', content: 'Test Page' },
  ];

  metaTags.forEach((meta) => {
    const metaElement = document.createElement('meta');
    Object.keys(meta).forEach((key) => {
      metaElement.setAttribute(key, meta[key]);
    });
    document.head.appendChild(metaElement);
  });

  if (process.env.DEBUG === 'test') {
    // eslint-disable-next-line no-console
    console.log('Test helpers: Mock AEM environment created');
  }
}

/**
 * Waits for block decoration to complete
 * @param {HTMLElement} block - Block element to watch
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise} - Resolves when decoration is complete
 */
export function waitForBlockDecoration(block, timeout = 1000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const checkDecoration = () => {
      if (block.classList.contains('block') || block.dataset.blockStatus === 'loaded') {
        if (process.env.DEBUG === 'test') {
          // eslint-disable-next-line no-console
          console.log('Test helpers: Block decoration completed');
        }
        resolve(block);
      } else if (Date.now() - startTime > timeout) {
        reject(new Error('Block decoration timeout'));
      } else {
        setTimeout(checkDecoration, 10);
      }
    };

    checkDecoration();
  });
}

/**
 * Creates a mock image element for testing
 * @param {string} src - Image source URL
 * @param {string} alt - Alt text
 * @returns {HTMLImageElement} - Mock image element
 */
export function createMockImage(src, alt = '') {
  const img = document.createElement('img');
  img.src = src;
  img.alt = alt;

  // Mock image loading
  setTimeout(() => {
    img.dispatchEvent(new Event('load'));
  }, 10);

  return img;
}

/**
 * Creates a mock link element for testing
 * @param {string} href - Link URL
 * @param {string} text - Link text
 * @returns {HTMLAnchorElement} - Mock link element
 */
export function createMockLink(href, text) {
  const link = document.createElement('a');
  link.href = href;
  link.textContent = text;
  return link;
}

/**
 * Validates block element structure
 * @param {HTMLElement} block - Block element to validate
 * @returns {boolean} - True if structure is valid
 */
export function validateBlockStructure(block) {
  const isValid = block instanceof HTMLElement
                  && block.children.length > 0
                  && block.className.length > 0;

  if (process.env.DEBUG === 'test') {
    // eslint-disable-next-line no-console
    console.log(`Test helpers: Block element structure validated: ${isValid}`);
  }

  return isValid;
}
