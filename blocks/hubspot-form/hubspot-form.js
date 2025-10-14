import { loadScript } from '../../scripts/aem.js';

export default async function decorate(block) {
  // Helper function to get text content from a row
  const getTextContent = (rowKey) => {
    const row = [...block.children].find((r) => r.children[0]?.textContent.trim() === rowKey);
    return row?.children[1]?.textContent.trim() || '';
  };

  // Helper function to get boolean value from a row
  const getBooleanValue = (rowKey, defaultValue = false) => {
    const value = getTextContent(rowKey).toLowerCase();
    if (value === 'true' || value === '1' || value === 'yes') return true;
    if (value === 'false' || value === '0' || value === 'no') return false;
    return defaultValue;
  };

  const getHTMLContent = (rowKey) => {
    const dataHTML = [...block.children].map((row) => [
      row.children[0]?.textContent.trim() || '',
      row.children[1]?.innerHTML.trim() || '',
    ]);
    return dataHTML.find((row) => row[0] === rowKey)?.[1] || '';
  };

  // Extract configuration
  const portalId = getTextContent('portalId') || '2494739';
  const formId = getTextContent('formId') || '26081daa-81ba-4c86-aea4-1853f976eefd';
  const region = 'na1'; // Fixed region for NASM
  const customTarget = getTextContent('target');
  const target = customTarget || `hubspot-form-${Date.now()}`;
  const redirectUrl = getTextContent('redirectUrl');
  const inlineMessage = getBooleanValue('inlineMessage', true);
  const formTemplate = getTextContent('formTemplate') || 'default';
  const textColor = getTextContent('textColor') || 'default';
  const formTitle = getTextContent('formHeading') || '';
  const formTitleLine2 = getTextContent('formHeading-line-2') || '';
  const formSubtitle = getHTMLContent('formSubtitle') || '';
  const formSize = getTextContent('formSize') || 'fluid';
  const transparentBackground = getBooleanValue('transparentBackground', false);
  const transparentBackgroundOpacity = getTextContent('transparentBackgroundOpacity') || '85';
  const formFooter = getHTMLContent('formFooter') || '';
  const formTitleColor = getTextContent('formTitleColor') || 'default';
  const formTitleLine2Color = getTextContent('formTitleLine2Color') || 'default';

  // Use the block itself as the target
  block.innerHTML = '<p class="hubspot-form-loading">Loading form...</p>';
  block.id = target;

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
    block.innerHTML = '';

    // Configure form options (match marketing team's script exactly)
    const formConfig = {
      portalId,
      formId,
      region,
    };

    // Add optional configurations
    if (redirectUrl) {
      formConfig.redirectUrl = redirectUrl;
    }

    if (inlineMessage) {
      formConfig.inlineMessage = 'Thank you for your submission!';
    }

    // Add form submission callback for analytics/tracking
    formConfig.onFormSubmit = ($form) => {
      // Track form submission
      if (window.gtag) {
        window.gtag('event', 'form_submit', {
          form_id: formId,
          form_name: 'hubspot_form',
        });
      }

      // Dispatch custom event for other tracking
      const event = new CustomEvent('hubspot-form-submit', {
        detail: { formId, portalId, form: $form },
      });
      document.dispatchEvent(event);
    };

    formConfig.onFormReady = ($form) => {
      // Move the form from body to our block
      const formElement = $form.closest('.hbspt-form');
      const formHeading = document.createElement('div');
      const formHeadingTitle = document.createElement('h2');
      const formHeadingTitleLine1 = document.createElement('span');
      const formHeadingTitleLine2 = document.createElement('span');
      const formHeadingSubtitle = document.createElement('div');

      if (transparentBackground) {
        block.style.setProperty('--hubspot-background-opacity', `${transparentBackgroundOpacity}%`);
      }

      formHeading.className = 'hubspot-form-heading';

      if (formTitle) {
        formHeadingTitle.className = 'hubspot-form-heading-title';
        formHeadingTitleLine1.className = 'hubspot-form-heading-title-line1';
        formHeadingTitleLine1.textContent = formTitle;

        if (formTitleColor !== 'default') {
          formHeadingTitleLine1.style.color = `var(${formTitleColor})`;
        }

        formHeadingTitle.appendChild(formHeadingTitleLine1);

        if (formTitleLine2) {
          formHeadingTitle.appendChild(document.createElement('br'));
          formHeadingTitleLine2.className = 'hubspot-form-heading-title-line2';
          formHeadingTitleLine2.textContent = formTitleLine2;

          if (formTitleLine2Color !== 'default') {
            formHeadingTitleLine2.style.color = `var(${formTitleLine2Color})`;
          }

          formHeadingTitle.appendChild(formHeadingTitleLine2);
        }

        formHeading.appendChild(formHeadingTitle);
      }

      if (formSubtitle) {
        formHeadingSubtitle.className = 'hubspot-form-heading-subtitle';
        formHeadingSubtitle.innerHTML = formSubtitle;
        formHeading.appendChild(formHeadingSubtitle);
      }

      if (formTitle || formSubtitle) {
        block.appendChild(formHeading);
      }

      if (formElement) {
        block.appendChild(formElement);
      }

      if (formFooter) {
        const formFooterElement = document.createElement('div');
        formFooterElement.className = 'hubspot-form-footer';
        formFooterElement.innerHTML = formFooter;
        block.appendChild(formFooterElement);
      }

      // Add loaded class for styling
      block.classList.add('hubspot-form-loaded');
      block.classList.add(formTemplate);
      block.classList.add(formSize);
      block.classList.add(textColor);
      if (transparentBackground) {
        block.classList.add('transparent-background');
      }

      // Dispatch ready event
      const event = new CustomEvent('hubspot-form-ready', {
        detail: { formId, portalId },
      });
      document.dispatchEvent(event);
    };

    // Create the HubSpot form
    // Add a small delay to ensure DOM is fully updated
    await new Promise((resolve) => {
      setTimeout(resolve, 100);
    });
    // Verify block element exists
    if (block && block.parentNode) {
      window.hbspt.forms.create(formConfig);
    } else {
      throw new Error('Block element not found or not attached to DOM');
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error loading HubSpot form:', error);

    // Show error state
    block.innerHTML = `
      <div class="hubspot-form-error">
        <p>Unable to load form. Please try refreshing the page.</p>
        <p><small>Error: ${error.message}</small></p>
      </div>
    `;

    // Dispatch error event
    const event = new CustomEvent('hubspot-form-error', {
      detail: { formId, portalId, error },
    });
    document.dispatchEvent(event);
  }
}
