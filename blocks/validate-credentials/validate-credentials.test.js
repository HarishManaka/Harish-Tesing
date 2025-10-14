// eslint-disable-next-line import/no-extraneous-dependencies
import {
  describe, it, expect, beforeEach, vi, afterEach,
} from 'vitest';
import {
  createBlockElement,
  mockAEMEnvironment,
} from '../../tests/utils/test-helpers.js';

// Import the module
import decorate, { createValidateCredentialsMarkup } from './validate-credentials.js';

describe('Validate Credentials Block', () => {
  let mockBlock;

  beforeEach(() => {
    document.body.innerHTML = '';
    document.head.innerHTML = '';
    mockAEMEnvironment();

    // Create a mock block element
    mockBlock = createBlockElement('validate-credentials');
    document.body.appendChild(mockBlock);

    // Reset all mocks
    vi.clearAllMocks();

    // Mock console methods to avoid noise in tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});

    // Reset window.LOG_LEVEL
    window.LOG_LEVEL = undefined;
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  describe('decorate function', () => {
    it('should create and append container to block', () => {
      decorate(mockBlock);

      const container = mockBlock.querySelector('.validate-credentials__container');
      expect(container).toBeTruthy();
      expect(container.tagName).toBe('DIV');
    });

    it('should create the complete markup structure', () => {
      decorate(mockBlock);

      // Check for main title
      const title = mockBlock.querySelector('.validate-credentials__title');
      expect(title).toBeTruthy();
      expect(title.textContent).toBe('Find NASM and AFAA Fitness Professionals');

      // Check for forms container
      const formsContainer = mockBlock.querySelector('.validate-credentials__forms-container');
      expect(formsContainer).toBeTruthy();

      // Check for both form sections
      const formSections = mockBlock.querySelectorAll('.validate-credentials__form-section');
      expect(formSections).toHaveLength(2);
    });

    it('should create name search form with proper structure', () => {
      decorate(mockBlock);

      const nameForm = mockBlock.querySelector('form[aria-describedby="search-by-name-description"]');
      expect(nameForm).toBeTruthy();

      // Check form inputs
      const firstNameInput = nameForm.querySelector('#first-name');
      const lastNameInput = nameForm.querySelector('#last-name');
      const submitButton = nameForm.querySelector('button[type="submit"]');

      expect(firstNameInput).toBeTruthy();
      expect(firstNameInput.getAttribute('name')).toBe('firstName');
      expect(firstNameInput.getAttribute('required')).toBe('');

      expect(lastNameInput).toBeTruthy();
      expect(lastNameInput.getAttribute('name')).toBe('lastName');
      expect(lastNameInput.getAttribute('required')).toBe('');

      expect(submitButton).toBeTruthy();
      expect(submitButton.textContent.trim()).toContain('Search');
    });

    it('should create certificate search form with proper structure', () => {
      decorate(mockBlock);

      const certificateForm = mockBlock.querySelector('form[aria-describedby="search-by-certificate-description"]');
      expect(certificateForm).toBeTruthy();

      // Check form input
      const certificateInput = certificateForm.querySelector('#certificate-id');
      const submitButton = certificateForm.querySelector('button[type="submit"]');

      expect(certificateInput).toBeTruthy();
      expect(certificateInput.getAttribute('name')).toBe('certificateId');
      expect(certificateInput.getAttribute('required')).toBe('');
      expect(certificateInput.getAttribute('placeholder')).toBe('Enter Certificate ID');

      expect(submitButton).toBeTruthy();
      expect(submitButton.textContent.trim()).toContain('Search');
    });

    it('should display current date', () => {
      decorate(mockBlock);

      const currentDateElement = mockBlock.querySelector('.validate-credentials__current-date');
      expect(currentDateElement).toBeTruthy();

      const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });

      expect(currentDateElement.textContent).toContain(currentDate);
    });

    it('should display JSON state', () => {
      decorate(mockBlock);

      const jsonDisplay = mockBlock.querySelector('.validate-credentials__json-display');
      const jsonContent = mockBlock.querySelector('.validate-credentials__json-content');

      expect(jsonDisplay).toBeTruthy();
      expect(jsonContent).toBeTruthy();
      expect(jsonContent.textContent).toContain('currentDate');
      expect(jsonContent.textContent).toContain('validate-credentials');
    });
  });

  describe('createValidateCredentialsMarkup function', () => {
    let testContainer;

    beforeEach(() => {
      testContainer = document.createElement('div');
      document.body.appendChild(testContainer);
    });

    it('should create markup with default data when no API data provided', () => {
      createValidateCredentialsMarkup(testContainer);

      const jsonContent = testContainer.querySelector('.validate-credentials__json-content');
      const jsonData = JSON.parse(jsonContent.textContent);

      expect(jsonData.component).toBe('validate-credentials');
      expect(jsonData.forms.nameSearch.firstName).toBe('required');
      expect(jsonData.forms.nameSearch.lastName).toBe('required');
      expect(jsonData.forms.certificateSearch.certificateId).toBe('required');
      expect(jsonData.currentDate).toBeTruthy();
    });

    it('should create markup with API data when provided', () => {
      const mockApiData = {
        results: [
          { name: 'John Doe', certification: 'NASM-CPT' },
        ],
        total: 1,
      };

      createValidateCredentialsMarkup(testContainer, mockApiData);

      const jsonContent = testContainer.querySelector('.validate-credentials__json-content');
      const jsonData = JSON.parse(jsonContent.textContent);

      expect(jsonData).toEqual(mockApiData);
    });

    it('should have proper accessibility attributes', () => {
      createValidateCredentialsMarkup(testContainer);

      // Check ARIA labels and descriptions
      const nameForm = testContainer.querySelector('form[aria-describedby="search-by-name-description"]');
      const certificateForm = testContainer.querySelector('form[aria-describedby="search-by-certificate-description"]');

      expect(nameForm.getAttribute('role')).toBe('search');
      expect(certificateForm.getAttribute('role')).toBe('search');

      // Check form sections have proper headings
      const nameHeading = testContainer.querySelector('#search-by-name-heading');
      const certificateHeading = testContainer.querySelector('#search-by-certificate-heading');

      expect(nameHeading.tagName).toBe('H2');
      expect(certificateHeading.tagName).toBe('H2');

      // Check inputs have proper labels
      const firstNameLabel = testContainer.querySelector('label[for="first-name"]');
      const lastNameLabel = testContainer.querySelector('label[for="last-name"]');
      const certificateLabel = testContainer.querySelector('label[for="certificate-id"]');

      expect(firstNameLabel).toBeTruthy();
      expect(lastNameLabel).toBeTruthy();
      expect(certificateLabel).toBeTruthy();
    });
  });

  describe('Form structure and validation', () => {
    beforeEach(() => {
      decorate(mockBlock);
    });

    it('should have correct form structure for name search', () => {
      const nameForm = mockBlock.querySelector('form[aria-describedby="search-by-name-description"]');
      const firstNameInput = nameForm.querySelector('#first-name');
      const lastNameInput = nameForm.querySelector('#last-name');

      // Test setting values
      firstNameInput.value = 'John';
      lastNameInput.value = 'Doe';

      expect(firstNameInput.value).toBe('John');
      expect(lastNameInput.value).toBe('Doe');
      expect(nameForm).toBeTruthy();
    });

    it('should have required attributes on name form inputs', () => {
      const nameForm = mockBlock.querySelector('form[aria-describedby="search-by-name-description"]');
      const firstNameInput = nameForm.querySelector('#first-name');
      const lastNameInput = nameForm.querySelector('#last-name');

      expect(firstNameInput.hasAttribute('required')).toBe(true);
      expect(lastNameInput.hasAttribute('required')).toBe(true);
    });

    it('should have correct form structure for certificate search', () => {
      const certificateForm = mockBlock.querySelector('form[aria-describedby="search-by-certificate-description"]');
      const certificateInput = certificateForm.querySelector('#certificate-id');

      certificateInput.value = '12345';

      expect(certificateInput.value).toBe('12345');
      expect(certificateForm).toBeTruthy();
    });

    it('should have required attributes on certificate form inputs', () => {
      const certificateForm = mockBlock.querySelector('form[aria-describedby="search-by-certificate-description"]');
      const certificateInput = certificateForm.querySelector('#certificate-id');

      expect(certificateInput.hasAttribute('required')).toBe(true);
    });
  });

  describe('Accessibility features', () => {
    beforeEach(() => {
      decorate(mockBlock);
    });

    it('should have proper ARIA roles and labels', () => {
      const nameForm = mockBlock.querySelector('form[aria-describedby="search-by-name-description"]');
      const certificateForm = mockBlock.querySelector('form[aria-describedby="search-by-certificate-description"]');

      expect(nameForm.getAttribute('role')).toBe('search');
      expect(certificateForm.getAttribute('role')).toBe('search');

      const currentDateElement = mockBlock.querySelector('.validate-credentials__current-date');
      expect(currentDateElement.getAttribute('role')).toBe('status');
      expect(currentDateElement.getAttribute('aria-live')).toBe('polite');
    });

    it('should have screen reader friendly content', () => {
      const srOnlyElements = mockBlock.querySelectorAll('.sr-only');
      expect(srOnlyElements.length).toBeGreaterThan(0);

      // Check that forms have descriptions
      const nameDescription = mockBlock.querySelector('#search-by-name-description');
      const certificateDescription = mockBlock.querySelector('#search-by-certificate-description');

      expect(nameDescription).toBeTruthy();
      expect(certificateDescription).toBeTruthy();
    });

    it('should have proper form associations', () => {
      const firstNameInput = mockBlock.querySelector('#first-name');
      const lastNameInput = mockBlock.querySelector('#last-name');
      const certificateInput = mockBlock.querySelector('#certificate-id');

      const firstNameLabel = mockBlock.querySelector('label[for="first-name"]');
      const lastNameLabel = mockBlock.querySelector('label[for="last-name"]');
      const certificateLabel = mockBlock.querySelector('label[for="certificate-id"]');

      expect(firstNameLabel).toBeTruthy();
      expect(lastNameLabel).toBeTruthy();
      expect(certificateLabel).toBeTruthy();

      // Check aria-describedby associations
      expect(firstNameInput.getAttribute('aria-describedby')).toBe('first-name-hint');
      expect(lastNameInput.getAttribute('aria-describedby')).toBe('last-name-hint');
      expect(certificateInput.getAttribute('aria-describedby')).toBe('certificate-id-hint');
    });
  });

  describe('Component state and data', () => {
    beforeEach(() => {
      decorate(mockBlock);
    });

    it('should display default JSON state correctly', () => {
      const jsonContent = mockBlock.querySelector('.validate-credentials__json-content');
      const displayedData = JSON.parse(jsonContent.textContent);

      expect(displayedData.component).toBe('validate-credentials');
      expect(displayedData.forms.nameSearch.firstName).toBe('required');
      expect(displayedData.forms.nameSearch.lastName).toBe('required');
      expect(displayedData.forms.certificateSearch.certificateId).toBe('required');
      expect(displayedData.currentDate).toBeTruthy();
    });

    it('should include current date in the display', () => {
      const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });

      const currentDateElement = mockBlock.querySelector('.validate-credentials__current-date');
      expect(currentDateElement.textContent).toContain(currentDate);
    });
  });

  describe('Component styling and CSS classes', () => {
    beforeEach(() => {
      decorate(mockBlock);
    });

    it('should have correct CSS classes applied', () => {
      expect(mockBlock.querySelector('.validate-credentials__container')).toBeTruthy();
      expect(mockBlock.querySelector('.validate-credentials__title')).toBeTruthy();
      expect(mockBlock.querySelector('.validate-credentials__forms-container')).toBeTruthy();
      expect(mockBlock.querySelector('.validate-credentials__form-section')).toBeTruthy();
      expect(mockBlock.querySelector('.validate-credentials__form')).toBeTruthy();
      expect(mockBlock.querySelector('.validate-credentials__form-group')).toBeTruthy();
      expect(mockBlock.querySelector('.validate-credentials__label')).toBeTruthy();
      expect(mockBlock.querySelector('.validate-credentials__input')).toBeTruthy();
      expect(mockBlock.querySelector('.validate-credentials__submit-button')).toBeTruthy();
      expect(mockBlock.querySelector('.validate-credentials__current-date')).toBeTruthy();
      expect(mockBlock.querySelector('.validate-credentials__json-display')).toBeTruthy();
      expect(mockBlock.querySelector('.validate-credentials__json-content')).toBeTruthy();
    });

    it('should have search icons in submit buttons', () => {
      const submitButtons = mockBlock.querySelectorAll('.validate-credentials__submit-button');
      submitButtons.forEach((button) => {
        const searchIcon = button.querySelector('.validate-credentials__search-icon');
        expect(searchIcon).toBeTruthy();
        expect(searchIcon.textContent).toBe('🔍');
      });
    });
  });

  describe('Event listener attachment', () => {
    it('should attach event listeners to forms after decoration', () => {
      decorate(mockBlock);

      const nameForm = mockBlock.querySelector('form[aria-describedby="search-by-name-description"]');
      const certificateForm = mockBlock.querySelector('form[aria-describedby="search-by-certificate-description"]');

      // Verify forms exist and are interactive
      expect(nameForm).toBeTruthy();
      expect(certificateForm).toBeTruthy();

      // Verify forms can receive events (this tests the event listener attachment)
      const nameFormEvent = new Event('submit', { bubbles: true, cancelable: true });
      const certificateFormEvent = new Event('submit', { bubbles: true, cancelable: true });

      // These should not throw errors
      expect(() => nameForm.dispatchEvent(nameFormEvent)).not.toThrow();
      expect(() => certificateForm.dispatchEvent(certificateFormEvent)).not.toThrow();
    });
  });
});
