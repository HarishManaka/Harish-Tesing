export default function decorate(block) {
  // Get the data from the block
  const data = [...block.children].map((row) => [...row.children]
    .map((cell) => cell.textContent.trim()));

  // Extract the content
  const title = data.find((row) => row[0] === 'title')?.[1] || 'TALK TO A PROGRAM ADVISOR';
  const subtitle = data.find((row) => row[0] === 'subtitle')?.[1] || 'Fill out the form below and one of our friendly program advisors will get in touch within the next business day.';
  const firstNameLabel = data.find((row) => row[0] === 'firstNameLabel')?.[1] || 'First Name';
  const lastNameLabel = data.find((row) => row[0] === 'lastNameLabel')?.[1] || 'Last Name';
  const emailLabel = data.find((row) => row[0] === 'emailLabel')?.[1] || 'Email';
  const phoneLabel = data.find((row) => row[0] === 'phoneLabel')?.[1] || 'Phone';
  const consentText = data.find((row) => row[0] === 'consentLabel')?.[1] || 'I consent to receive SMS texts from NASM. Msg/Data rates may apply, reply STOP to opt-out.';
  const privacyText = data.find((row) => row[0] === 'privacyLabel')?.[1] || 'By submitting this form you consent to receive recurring marketing emails and agree to our Privacy Policy. You may unsubscribe at any time.';
  const submitButtonText = data.find((row) => row[0] === 'submitButtonLabel')?.[1] || 'Sign Up Now';
  const callToActionText = data.find((row) => row[0] === 'callToActionLabel')?.[1] || 'Don\'t wait? Call now to speak with a program advisor instantly.';
  const phoneNumber = data.find((row) => row[0] === 'phoneNumber')?.[1] || '800-460-6276';
  const backgroundImage = data.find((row) => row[0] === 'backgroundImage')?.[1] || '';

  // Create the form structure
  const formContainer = document.createElement('div');
  formContainer.className = 'user-form-container';

  // Apply background image if provided
  if (backgroundImage) {
    formContainer.style.backgroundImage = `url('${backgroundImage}')`;
    formContainer.classList.add('has-background-image');
  }

  // Create form header
  const header = document.createElement('div');
  header.className = 'user-form-header';

  const titleElement = document.createElement('h2');
  titleElement.className = 'user-form-title';
  titleElement.textContent = title;

  const subtitleElement = document.createElement('p');
  subtitleElement.className = 'user-form-subtitle';
  subtitleElement.textContent = subtitle;

  header.appendChild(titleElement);
  header.appendChild(subtitleElement);

  // Create form
  const form = document.createElement('form');
  form.className = 'user-form';
  form.setAttribute('novalidate', '');

  // Create form fields
  const fields = [
    {
      name: 'firstName', label: firstNameLabel, type: 'text', required: true,
    },
    {
      name: 'lastName', label: lastNameLabel, type: 'text', required: true,
    },
    {
      name: 'email', label: emailLabel, type: 'email', required: true,
    },
    {
      name: 'phone', label: phoneLabel, type: 'tel', required: true,
    },
  ];

  fields.forEach((field) => {
    const fieldContainer = document.createElement('div');
    fieldContainer.className = 'user-form-field';

    const input = document.createElement('input');
    input.type = field.type;
    input.name = field.name;
    input.id = `user-form-${field.name}`;
    input.placeholder = field.label;
    input.className = 'user-form-input';
    if (field.required) {
      input.setAttribute('required', '');
    }

    fieldContainer.appendChild(input);
    form.appendChild(fieldContainer);
  });

  // Create consent checkbox
  const consentContainer = document.createElement('div');
  consentContainer.className = 'user-form-consent';

  const consentWrapper = document.createElement('label');
  consentWrapper.className = 'user-form-checkbox-wrapper';

  const consentCheckbox = document.createElement('input');
  consentCheckbox.type = 'checkbox';
  consentCheckbox.name = 'smsConsent';
  consentCheckbox.id = 'user-form-sms-consent';
  consentCheckbox.className = 'user-form-checkbox';

  const checkboxCustom = document.createElement('span');
  checkboxCustom.className = 'user-form-checkbox-custom';

  const consentLabel = document.createElement('span');
  consentLabel.className = 'user-form-consent-text';
  consentLabel.textContent = consentText;

  consentWrapper.appendChild(consentCheckbox);
  consentWrapper.appendChild(checkboxCustom);
  consentWrapper.appendChild(consentLabel);
  consentContainer.appendChild(consentWrapper);

  // Create privacy text
  const privacyContainer = document.createElement('div');
  privacyContainer.className = 'user-form-privacy';

  const privacyElement = document.createElement('p');
  privacyElement.className = 'user-form-privacy-text';
  privacyElement.textContent = privacyText;

  privacyContainer.appendChild(privacyElement);

  // Create submit button
  const submitContainer = document.createElement('div');
  submitContainer.className = 'user-form-submit';

  const submitButton = document.createElement('button');
  submitButton.type = 'submit';
  submitButton.className = 'user-form-button';
  submitButton.textContent = submitButtonText;

  submitContainer.appendChild(submitButton);

  // Create call to action
  const ctaContainer = document.createElement('div');
  ctaContainer.className = 'user-form-cta';

  const ctaText = document.createElement('p');
  ctaText.className = 'user-form-cta-text';
  ctaText.textContent = callToActionText;

  const phoneLink = document.createElement('a');
  phoneLink.href = `tel:${phoneNumber.replace(/[^0-9]/g, '')}`;
  phoneLink.className = 'user-form-phone';
  phoneLink.textContent = phoneNumber;

  ctaContainer.appendChild(ctaText);
  ctaContainer.appendChild(phoneLink);

  // Assemble form
  form.appendChild(consentContainer);
  form.appendChild(privacyContainer);
  form.appendChild(submitContainer);

  // Assemble container
  formContainer.appendChild(header);
  formContainer.appendChild(form);
  formContainer.appendChild(ctaContainer);

  // Add form validation and submit handler
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    // Basic form validation
    const formData = new FormData(form);
    const firstName = formData.get('firstName');
    const lastName = formData.get('lastName');
    const email = formData.get('email');
    const phone = formData.get('phone');

    // Clear previous errors
    form.querySelectorAll('.error').forEach((el) => el.classList.remove('error'));

    let hasErrors = false;

    // Validate required fields
    if (!firstName?.trim()) {
      form.querySelector('input[name="firstName"]').classList.add('error');
      hasErrors = true;
    }
    if (!lastName?.trim()) {
      form.querySelector('input[name="lastName"]').classList.add('error');
      hasErrors = true;
    }
    if (!email?.trim() || !email.includes('@')) {
      form.querySelector('input[name="email"]').classList.add('error');
      hasErrors = true;
    }
    if (!phone?.trim()) {
      form.querySelector('input[name="phone"]').classList.add('error');
      hasErrors = true;
    }

    if (hasErrors) {
      return;
    }

    // For now, just log the form data (since no backend integration)
    // eslint-disable-next-line no-console
    console.info('Form submitted with data:', {
      firstName,
      lastName,
      email,
      phone,
      smsConsent: formData.get('smsConsent') === 'on',
    });

    // Show success message
    submitButton.textContent = 'Thank You!';
    submitButton.disabled = true;
    setTimeout(() => {
      submitButton.textContent = submitButtonText;
      submitButton.disabled = false;
      form.reset();
    }, 3000);
  });

  // Replace block content
  block.textContent = '';
  block.appendChild(formContainer);
}
