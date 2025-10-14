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

  // Helper function to get rich text content (preserves HTML)
  const getRichTextContent = (rowKey) => {
    const row = [...block.children].find((r) => r.children[0]?.textContent.trim() === rowKey);
    return row?.children[1]?.innerHTML || '';
  };

  // Helper function to get image reference
  const getImageReference = (rowKey) => {
    const row = [...block.children].find((r) => r.children[0]?.textContent.trim() === rowKey);
    const img = row?.children[1]?.querySelector('img');
    return img || null;
  };

  // Extract configuration
  const portalId = getTextContent('portalId') || '2494739';
  const formId = getTextContent('formId') || '26081daa-81ba-4c86-aea4-1853f976eefd';
  const region = 'na1'; // Fixed region for NASM
  const customTarget = getTextContent('target');
  const target = customTarget || `academic-form-${Date.now()}`;
  const redirectUrl = getTextContent('redirectUrl');
  const inlineMessage = getBooleanValue('inlineMessage', true);
  const formTemplate = getTextContent('formTemplate') || 'default';
  const formTitle = getTextContent('formHeading') || '';
  const formSubtitle = getTextContent('formSubtitle') || '';
  const formSize = getTextContent('formSize') || 'fluid';
  const transparentBackground = getBooleanValue('transparentBackground', false);
  const transparentBackgroundOpacity = getTextContent('transparentBackgroundOpacity') || '85';

  // Extract new academic-specific fields
  const schoolIntro = getRichTextContent('schoolIntro');
  const schoolName = getTextContent('schoolName');
  const schoolContact = getTextContent('schoolContact');
  const schoolLogo = getImageReference('schoolLogo');
  const schoolLogoAlt = getTextContent('schoolLogoAlt');
  const schoolDescription = getRichTextContent('schoolDescription');

  // Clear the original block content (configuration data)
  block.innerHTML = '';

  // Create the academic layout structure first, before HubSpot creates the form
  if (schoolIntro || schoolLogo || schoolDescription) {
    // Build two-column academic layout
    const academicContainer = document.createElement('div');
    academicContainer.className = 'academic-two-column-container';

    // Left Column - School Introduction Text
    const leftColumn = document.createElement('div');
    leftColumn.className = 'academic-left-column';

    if (schoolIntro) {
      const introDiv = document.createElement('div');
      introDiv.className = 'academic-intro-text';
      introDiv.innerHTML = schoolIntro;
      leftColumn.appendChild(introDiv);
    }

    academicContainer.appendChild(leftColumn);

    // Right Column - Logo, Description, and Form
    const rightColumn = document.createElement('div');
    rightColumn.className = 'academic-right-column';

    // Add school logo at top of right column
    if (schoolLogo) {
      const logoDiv = document.createElement('div');
      logoDiv.className = 'academic-school-logo';

      const logoClone = schoolLogo.cloneNode(true);

      // Set proper alt text for accessibility
      if (schoolLogoAlt) {
        logoClone.alt = schoolLogoAlt;
      } else if (!logoClone.alt || logoClone.alt === '') {
        logoClone.alt = schoolName ? `${schoolName} logo` : 'School logo';
      }

      logoDiv.appendChild(logoClone);
      rightColumn.appendChild(logoDiv);
    }

    // Add school description below logo
    if (schoolDescription) {
      const descriptionDiv = document.createElement('div');
      descriptionDiv.className = 'academic-school-description';
      descriptionDiv.innerHTML = schoolDescription;
      rightColumn.appendChild(descriptionDiv);
    }

    // Create form section where HubSpot will place the form
    const formSection = document.createElement('div');
    formSection.className = 'academic-form-section';

    // Create form heading
    if (formTitle || formSubtitle) {
      const formHeading = document.createElement('div');
      formHeading.className = 'academic-form-heading';

      if (formTitle) {
        const formHeadingTitle = document.createElement('h2');
        formHeadingTitle.className = 'academic-form-heading-title';
        formHeadingTitle.textContent = formTitle;
        formHeading.appendChild(formHeadingTitle);
      }

      if (formSubtitle) {
        const formHeadingSubtitle = document.createElement('p');
        formHeadingSubtitle.className = 'academic-form-heading-subtitle';
        formHeadingSubtitle.textContent = formSubtitle;
        formHeading.appendChild(formHeadingSubtitle);
      }

      formSection.appendChild(formHeading);
    }

    // Create a separate container for the form
    const formContainer = document.createElement('div');
    formContainer.className = 'academic-form-container';
    formContainer.id = target; // This is where HubSpot will create the form

    // Add loading message to form container
    const loadingMsg = document.createElement('p');
    loadingMsg.className = 'academic-form-loading';
    loadingMsg.textContent = 'Loading form...';
    formContainer.appendChild(loadingMsg);

    formSection.appendChild(formContainer);

    rightColumn.appendChild(formSection);
    academicContainer.appendChild(rightColumn);
    block.appendChild(academicContainer);
  } else {
    // Fallback: Simple layout wrapped in form section for consistent styling
    const formSection = document.createElement('div');
    formSection.className = 'academic-form-section';

    // Add form heading with blue background
    if (formTitle || formSubtitle) {
      const formHeading = document.createElement('div');
      formHeading.className = 'academic-form-heading';

      if (formTitle) {
        const formHeadingTitle = document.createElement('h2');
        formHeadingTitle.className = 'academic-form-heading-title';
        formHeadingTitle.textContent = formTitle;
        formHeading.appendChild(formHeadingTitle);
      }

      if (formSubtitle) {
        const formHeadingSubtitle = document.createElement('p');
        formHeadingSubtitle.className = 'academic-form-heading-subtitle';
        formHeadingSubtitle.textContent = formSubtitle;
        formHeading.appendChild(formHeadingSubtitle);
      }

      formSection.appendChild(formHeading);
    }

    // Create a separate container for the form
    const formContainer = document.createElement('div');
    formContainer.className = 'academic-form-container';
    formContainer.id = target; // This is where HubSpot will create the form

    // Add loading message to form container
    const loadingP = document.createElement('p');
    loadingP.className = 'academic-form-loading';
    loadingP.textContent = 'Loading form...';
    formContainer.appendChild(loadingP);
    formSection.appendChild(formContainer);
    block.appendChild(formSection);
  }
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

    // Clear loading state from the target element
    const targetElement = document.getElementById(target);
    const loadingElement = targetElement ? targetElement.querySelector('.academic-form-loading') : null;
    if (loadingElement) {
      loadingElement.remove();
    }

    // Configure form options (match marketing team's script exactly)
    const formConfig = {
      portalId,
      formId,
      region,
      target: `#${target}`, // Specify where to render the form
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
          form_name: 'academic_form',
        });
      }

      // Dispatch custom event for other tracking
      const event = new CustomEvent('academic-form-submit', {
        detail: { formId, portalId, form: $form },
      });
      document.dispatchEvent(event);
    };

    formConfig.onFormReady = ($form) => {
      if (transparentBackground) {
        block.style.setProperty('--academic-background-opacity', `${transparentBackgroundOpacity}%`);
      }

      // Populate hidden fields with school data from our block fields
      // The HubSpot form will have hidden inputs that need to be populated
      // Note: $form is a jQuery object provided by HubSpot

      // Get the form DOM element for querying
      const formDOM = $form.length ? $form[0] : $form;

      // Use a small timeout to ensure form is fully rendered
      setTimeout(() => {
        // Populate school_name hidden field - try multiple selectors
        if (schoolName) {
          let schoolNameField = formDOM.querySelector('.hs_school_name input.hs-input');
          if (!schoolNameField) {
            schoolNameField = formDOM.querySelector('input[name="school_name"]');
          }
          if (!schoolNameField) {
            schoolNameField = document.querySelector(`#school_name-${formConfig.formId}`);
          }

          if (schoolNameField) {
            schoolNameField.value = schoolName;
            schoolNameField.setAttribute('value', schoolName);
            // Trigger multiple events to ensure HubSpot captures the value
            schoolNameField.dispatchEvent(new Event('input', { bubbles: true }));
            schoolNameField.dispatchEvent(new Event('change', { bubbles: true }));
            schoolNameField.dispatchEvent(new Event('blur', { bubbles: true }));
          } else {
            console.warn('School Name field not found');
          }
        }

        // Populate school_contact hidden field - try multiple selectors
        if (schoolContact) {
          let schoolContactField = formDOM.querySelector('.hs_school_contact input.hs-input');
          if (!schoolContactField) {
            schoolContactField = formDOM.querySelector('input[name="school_contact"]');
          }
          if (!schoolContactField) {
            schoolContactField = document.querySelector(`#school_contact-${formConfig.formId}`);
          }

          if (schoolContactField) {
            schoolContactField.value = schoolContact;
            schoolContactField.setAttribute('value', schoolContact);
            // Trigger multiple events to ensure HubSpot captures the value
            schoolContactField.dispatchEvent(new Event('input', { bubbles: true }));
            schoolContactField.dispatchEvent(new Event('change', { bubbles: true }));
            schoolContactField.dispatchEvent(new Event('blur', { bubbles: true }));
          } else {
            console.warn('School Contact field not found');
          }
        }
        // Set landing page ID (current page URL without query params)
        const landingPageId = window.location.href.split('?')[0];
        const landingPageField = formDOM.querySelector('.hs_lead_landing_page_id input.hs-input');
        if (landingPageField) {
          landingPageField.value = landingPageId;
          landingPageField.dispatchEvent(new Event('change', { bubbles: true }));
        }

        // Extract and populate UTM parameters from URL
        const urlParams = new URLSearchParams(window.location.search);

        // Map of URL param to HubSpot field class
        const utmFieldMapping = {
          utm_source: '.hs_lead_web_source input.hs-input',
          utm_medium: '.hs_lead_web_medium input.hs-input',
          utm_campaign: '.hs_lead_campaign_name input.hs-input',
          utm_content: '.hs_lead_campaign_content input.hs-input',
          utm_term: '.hs_lead_campaign_term input.hs-input',
          gclid: '.hs_lead_gclid input.hs-input',
        };

        // Populate each UTM field if the parameter exists in URL
        Object.entries(utmFieldMapping).forEach(([param, selector]) => {
          const value = urlParams.get(param);
          if (value) {
            const field = formDOM.querySelector(selector);
            if (field) {
              field.value = value;
              field.dispatchEvent(new Event('change', { bubbles: true }));
            }
          }
        });
      }, 100); // End of setTimeout

      // Set visitor ID if available (this might be set by other analytics scripts)
      const checkForVisitorId = setInterval(() => {
        if (window.visitorID) {
          clearInterval(checkForVisitorId);
          const visitorIdField = formDOM.querySelector('.hs_lead_client_id input.hs-input');
          if (visitorIdField) {
            visitorIdField.value = window.visitorID;
            visitorIdField.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }
      }, 500);

      // Set a timeout to stop checking for visitor ID after 10 seconds
      setTimeout(() => {
        clearInterval(checkForVisitorId);
      }, 10000);

      // Layout is already created - form will be rendered in the right place
      // Add loaded class for styling
      block.classList.add('academic-form-loaded');
      block.classList.add(formTemplate);
      block.classList.add(formSize);
      if (transparentBackground) {
        block.classList.add('transparent-background');
      }

      // Dispatch ready event
      const event = new CustomEvent('academic-form-ready', {
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
      <div class="academic-form-error">
        <p>Unable to load form. Please try refreshing the page.</p>
        <p><small>Error: ${error.message}</small></p>
      </div>
    `;

    // Dispatch error event
    const event = new CustomEvent('academic-form-error', {
      detail: { formId, portalId, error },
    });
    document.dispatchEvent(event);
  }
}
