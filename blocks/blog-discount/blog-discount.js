import { loadScript } from '../../scripts/aem.js';

export default async function decorate(block) {
  // Helper function to get text content from a row
  const getTextContent = (rowKey) => {
    const row = [...block.children].find((r) => r.children[0]?.textContent.trim() === rowKey);
    return row?.children[1]?.textContent.trim() || '';
  };

  // Extract configuration
  const preText = getTextContent('preLabel') || 'ENTER YOUR EMAIL';
  const mainText = getTextContent('mainLabel') || 'ACCESS EXCLUSIVE MYSTERY OFFER!';
  const buttonText = getTextContent('buttonLabel') || 'Reveal My Discount';
  const portalId = getTextContent('portalId') || '2494739';
  const formId = getTextContent('formId') || '26081daa-81ba-4c86-aea4-1853f976eefd';
  const region = 'na1'; // Fixed region for NASM
  const redirectUrl = getTextContent('redirectUrl');
  const successMessage = getTextContent('successMessage') || 'Thank you! Your exclusive offer is on its way!';

  // Clear the block and create the layout
  block.innerHTML = '';
  block.className = 'blog-discount';

  // Create main container
  const container = document.createElement('div');
  container.className = 'blog-discount-content-container';

  // Create text section
  const textSection = document.createElement('div');
  textSection.className = 'blog-discount-text';

  // Add pre-text
  if (preText) {
    const preTextElement = document.createElement('p');
    preTextElement.className = 'blog-discount-pretext';
    preTextElement.textContent = preText;
    textSection.appendChild(preTextElement);
  }

  // Add main text
  if (mainText) {
    const mainTextElement = document.createElement('h3');
    mainTextElement.className = 'blog-discount-maintext';
    mainTextElement.textContent = mainText;
    textSection.appendChild(mainTextElement);
  }

  // Create form section
  const formSection = document.createElement('div');
  formSection.className = 'blog-discount-form';
  formSection.innerHTML = '<p class="hubspot-form-loading">Loading form...</p>';

  // Assemble layout
  container.appendChild(textSection);
  container.appendChild(formSection);
  block.appendChild(container);

  // Generate unique form target
  const target = `blog-discount-form-${Date.now()}`;
  formSection.id = target;

  try {
    // Load HubSpot forms script
    await loadScript('//js.hsforms.net/forms/embed/v2.js', {
      charset: 'utf-8',
    });

    // Wait for hbspt to be available
    let attempts = 0;
    const maxAttempts = 50; // 5 seconds maximum wait

    const waitForHubSpot = () => new Promise((resolve, reject) => {
      const checkHubSpot = () => {
        attempts += 1;
        if (window.hbspt && window.hbspt.forms) {
          resolve();
        } else if (attempts >= maxAttempts) {
          reject(new Error('HubSpot forms script failed to load'));
        } else {
          setTimeout(checkHubSpot, 100);
        }
      };
      checkHubSpot();
    });

    await waitForHubSpot();

    // Clear loading state
    formSection.innerHTML = '';

    // Configure form options (don't specify target, let HubSpot render to body)
    const formConfig = {
      portalId,
      formId,
      region,
    };

    // Add optional configurations
    if (redirectUrl) {
      formConfig.redirectUrl = redirectUrl;
    } else {
      formConfig.inlineMessage = successMessage;
    }

    // Add form submission callback for analytics/tracking
    formConfig.onFormSubmit = ($form) => {
      // Track form submission
      if (window.gtag) {
        window.gtag('event', 'form_submit', {
          form_id: formId,
          form_name: 'blog_discount_form',
        });
      }

      // Dispatch custom event for other tracking
      const event = new CustomEvent('blog-discount-form-submit', {
        detail: { formId, portalId, form: $form },
      });
      document.dispatchEvent(event);
    };

    // Add form submission success callback
    formConfig.onFormSubmitted = ($form) => {
      // Wait a moment for HubSpot to render the inline message
      setTimeout(() => {
        const formElement = $form.closest('.hbspt-form');
        const inlineMessage = formElement.querySelector('.submitted-message');

        if (inlineMessage) {
          // Replace the form section with the success message
          formSection.innerHTML = '';
          const clonedMessage = inlineMessage.cloneNode(true);

          // Apply our custom styling to the HubSpot message
          clonedMessage.classList.add('blog-discount-hubspot-success');

          formSection.appendChild(clonedMessage);
          formSection.classList.add('blog-discount-success');
        } else {
          // Use our configured success message
          formSection.innerHTML = `
            <div class="blog-discount-success-fallback">
              <div class="success-content">${successMessage}</div>
            </div>
          `;
          formSection.classList.add('blog-discount-success');
        }

        // Dispatch success event
        const event = new CustomEvent('blog-discount-form-success', {
          detail: { formId, portalId },
        });
        document.dispatchEvent(event);
      }, 100);
    };

    formConfig.onFormReady = ($form) => {
      // Move the form from wherever HubSpot rendered it to our form section
      const formElement = $form.closest('.hbspt-form');

      if (formElement) {
        // Move form to our form section
        formSection.appendChild(formElement);

        // Customize the submit button text
        const submitButton = formElement.querySelector('input[type="submit"]');
        if (submitButton && buttonText) {
          submitButton.value = buttonText;
        }

        // Add custom classes for styling
        formElement.classList.add('blog-discount-hubspot-form');
      }

      // Add loaded class for styling
      block.classList.add('blog-discount-loaded');

      // Dispatch ready event
      const event = new CustomEvent('blog-discount-form-ready', {
        detail: { formId, portalId },
      });
      document.dispatchEvent(event);
    };

    // Create the HubSpot form
    await new Promise((resolve) => {
      setTimeout(resolve, 100);
    });

    if (formSection && formSection.parentNode) {
      window.hbspt.forms.create(formConfig);
    } else {
      throw new Error('Form section not found or not attached to DOM');
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error loading HubSpot form:', error);

    // Show error state
    formSection.innerHTML = `
      <div class="blog-discount-form-error">
        <p>Unable to load form. Please try refreshing the page.</p>
      </div>
    `;

    // Dispatch error event
    const event = new CustomEvent('blog-discount-form-error', {
      detail: { formId, portalId, error },
    });
    document.dispatchEvent(event);
  }

  // Add sticky behavior
  setupStickyBehavior(block);
}

function setupStickyBehavior(block) {
  let isSticky = false;
  let hasScrolledToBlock = false;
  const originalBlockTop = block.offsetTop;

  // Create a placeholder to maintain layout when block becomes fixed
  const placeholder = document.createElement('div');
  placeholder.className = 'blog-discount-placeholder';
  placeholder.style.height = `${block.offsetHeight}px`;
  placeholder.style.display = 'none';
  block.parentNode.insertBefore(placeholder, block);

  function handleScroll() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const blockTop = isSticky ? placeholder.offsetTop : block.offsetTop;

    // Track if we've scrolled down to the block at least once
    if (!hasScrolledToBlock && scrollTop >= originalBlockTop) {
      hasScrolledToBlock = true;
    }

    // Only activate sticky behavior after we've scrolled down to the block
    if (hasScrolledToBlock) {
      // Check if we should make it sticky (when block reaches top of viewport)
      if (scrollTop >= blockTop && !isSticky) {
        isSticky = true;
        block.classList.add('sticky');
        placeholder.style.display = 'block';
        placeholder.style.height = `${block.offsetHeight}px`;
      } else if (scrollTop <= placeholder.offsetTop && isSticky) {
        isSticky = false;
        hasScrolledToBlock = false; // Reset flag when scrolling back up
        block.classList.remove('sticky');
        placeholder.style.display = 'none';
      }
    }
  }

  // Throttle scroll events for better performance
  let ticking = false;
  function throttledScroll() {
    if (!ticking) {
      requestAnimationFrame(() => {
        handleScroll();
        ticking = false;
      });
      ticking = true;
    }
  }

  window.addEventListener('scroll', throttledScroll);

  // Update placeholder height when block content changes (e.g., form loads)
  const observer = new ResizeObserver(() => {
    if (isSticky) {
      placeholder.style.height = `${block.offsetHeight}px`;
    }
  });
  observer.observe(block);
}
