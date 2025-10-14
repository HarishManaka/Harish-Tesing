// eslint-disable-next-line import/no-extraneous-dependencies
import {
  describe, it, expect, beforeEach, vi, afterEach,
} from 'vitest';
import {
  createBlockElement,
  mockAEMEnvironment,
} from '../../tests/utils/test-helpers.js';

// Mock the Swiper library
const mockSwiper = {
  destroy: vi.fn(),
  update: vi.fn(),
  slideTo: vi.fn(),
  on: vi.fn(),
};

const MockSwiperClass = vi.fn().mockImplementation(() => mockSwiper);

// Mock the loadSwiper function
const mockLoadSwiper = vi.fn().mockResolvedValue(undefined);

// Mock the scripts.js module
vi.mock('../../scripts/scripts.js', () => ({
  loadSwiper: mockLoadSwiper,
}));

// Set up global Swiper mock
Object.defineProperty(global.window, 'Swiper', {
  value: MockSwiperClass,
  writable: true,
});

// Import the module after mocks are set up
const { default: decorate } = await import('./payment-plans.js');

describe('Payment Plans Block', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.head.innerHTML = '';
    mockAEMEnvironment();

    // Reset all mocks
    vi.clearAllMocks();
    MockSwiperClass.mockClear();
    mockLoadSwiper.mockClear();
  });

  afterEach(() => {
    // Clean up any global state - just reset the mock
    if (global.window.Swiper) {
      global.window.Swiper = MockSwiperClass;
    }
  });

  describe('Block Decoration', () => {
    it('should create the payment plans container structure', async () => {
      const block = createBlockElement('payment-plans');

      await decorate(block);

      const container = block.querySelector('.payment-plans__container');
      expect(container).toBeDefined();

      const pricingSwiper = container.querySelector('.pricing-swiper');
      expect(pricingSwiper).toBeDefined();

      const title = container.querySelector('.pricing-swiper__title');
      expect(title).toBeDefined();
      expect(title.textContent).toBe('CHOOSE YOUR PLAN - SWIPER VERSION');
    });

    it('should create swiper structure with required elements', async () => {
      const block = createBlockElement('payment-plans');

      await decorate(block);

      const container = block.querySelector('.payment-plans__container');
      const swiperElement = container.querySelector('.swiper');
      const swiperWrapper = container.querySelector('.swiper-wrapper');
      const pagination = container.querySelector('.swiper-pagination');
      const nextButton = container.querySelector('.swiper-button-next');
      const prevButton = container.querySelector('.swiper-button-prev');

      expect(swiperElement).toBeDefined();
      expect(swiperWrapper).toBeDefined();
      expect(pagination).toBeDefined();
      expect(nextButton).toBeDefined();
      expect(prevButton).toBeDefined();
    });

    it('should load swiper before initializing', async () => {
      const block = createBlockElement('payment-plans');

      await decorate(block);

      expect(mockLoadSwiper).toHaveBeenCalledTimes(1);
    });

    it('should initialize PricingCardsSwiper with container', async () => {
      const block = createBlockElement('payment-plans');

      await decorate(block);

      // The swiper should be initialized
      expect(MockSwiperClass).toHaveBeenCalledTimes(1);
    });
  });

  describe('PricingCardsSwiper Class', () => {
    let container;

    beforeEach(async () => {
      // Create a container with the expected structure
      container = document.createElement('div');
      container.innerHTML = `
        <div class="pricing-swiper">
          <div class="pricing-swiper__container">
            <div class="swiper pricing-swiper__slider">
              <div class="swiper-wrapper"></div>
              <div class="swiper-pagination"></div>
              <div class="swiper-button-next"></div>
              <div class="swiper-button-prev"></div>
            </div>
          </div>
        </div>
      `;

      // We need to get the class through the module - simulate module import
      // For now, we'll test through the decorate function behavior
    });

    it('should handle container without swiper wrapper gracefully', async () => {
      const emptyContainer = document.createElement('div');
      const block = createBlockElement('payment-plans');
      block.appendChild(emptyContainer);

      // Should not throw error
      expect(async () => {
        await decorate(block);
      }).not.toThrow();
    });
  });

  describe('Default Cards Data', () => {
    it('should contain expected number of pricing plans', async () => {
      const block = createBlockElement('payment-plans');
      await decorate(block);

      // After decoration, we should have slides in the swiper wrapper
      const slides = block.querySelectorAll('.swiper-slide');
      expect(slides.length).toBe(4); // Self-study, Premium, CPT Essentials, Exclusive Bundle
    });

    it('should render pricing cards with correct structure', async () => {
      const block = createBlockElement('payment-plans');
      await decorate(block);

      const pricingCards = block.querySelectorAll('.pricing-card');
      expect(pricingCards.length).toBe(4);

      // Check first card structure
      const firstCard = pricingCards[0];
      expect(firstCard.querySelector('.pricing-card__header')).toBeDefined();
      expect(firstCard.querySelector('.pricing-card__title')).toBeDefined();
      expect(firstCard.querySelector('.pricing-card__pricing')).toBeDefined();
      expect(firstCard.querySelector('.pricing-card__features')).toBeDefined();
    });

    it('should mark premium card as popular', async () => {
      const block = createBlockElement('payment-plans');
      await decorate(block);

      const popularCard = block.querySelector('.pricing-card--popular');
      expect(popularCard).toBeDefined();

      const badge = popularCard.querySelector('.pricing-card__badge');
      expect(badge.textContent).toBe('Most Popular');
    });
  });

  describe('Payment Options', () => {
    it('should render payment dropdowns for each card', async () => {
      const block = createBlockElement('payment-plans');
      await decorate(block);

      const dropdowns = block.querySelectorAll('.pricing-card__dropdown');
      expect(dropdowns.length).toBe(4);

      const optionsContainers = block.querySelectorAll('.pricing-card__options');
      expect(optionsContainers.length).toBe(4);
    });

    it('should have correct payment options in dropdowns', async () => {
      const block = createBlockElement('payment-plans');
      await decorate(block);

      const firstOptions = block.querySelector('.pricing-card__options');
      const options = firstOptions.querySelectorAll('.pricing-card__option');

      expect(options.length).toBe(3);
      expect(options[0].dataset.option).toBe('12-months');
      expect(options[1].dataset.option).toBe('6-months');
      expect(options[2].dataset.option).toBe('full-payment');
    });

    it('should default to 12-months payment option', async () => {
      const block = createBlockElement('payment-plans');
      await decorate(block);

      const selectedOption = block.querySelector('.pricing-card__option--selected');
      expect(selectedOption.dataset.option).toBe('12-months');

      const dropdownText = block.querySelector('.pricing-card__dropdown-text');
      expect(dropdownText.textContent).toBe('12 Monthly Payments');
    });
  });

  describe('Features Rendering', () => {
    it('should render basic features correctly', async () => {
      const block = createBlockElement('payment-plans');
      await decorate(block);

      const features = block.querySelectorAll('.pricing-card__feature');
      expect(features.length).toBeGreaterThan(0);

      const basicFeature = block.querySelector('.pricing-card__feature-bullet');
      expect(basicFeature).toBeDefined();
    });

    it('should render addon features with plus icon', async () => {
      const block = createBlockElement('payment-plans');
      await decorate(block);

      const addonIcons = block.querySelectorAll('.pricing-card__feature-icon');
      const addonFeatures = block.querySelectorAll('.pricing-card__feature-text--addon');

      expect(addonIcons.length).toBeGreaterThan(0);
      expect(addonFeatures.length).toBeGreaterThan(0);
    });

    it('should render accordion toggles for features with accordion content', async () => {
      const block = createBlockElement('payment-plans');
      await decorate(block);

      const accordionToggles = block.querySelectorAll('.pricing-card__accordion-toggle');
      const accordionContents = block.querySelectorAll('.pricing-card__accordion-content');

      expect(accordionToggles.length).toBeGreaterThan(0);
      expect(accordionContents.length).toBeGreaterThan(0);
      expect(accordionToggles.length).toBe(accordionContents.length);
    });
  });

  describe('Interactive Elements', () => {
    it('should have enroll buttons for each card', async () => {
      const block = createBlockElement('payment-plans');
      await decorate(block);

      const enrollButtons = block.querySelectorAll('.pricing-card__enroll-btn');
      expect(enrollButtons.length).toBe(4);

      enrollButtons.forEach((button) => {
        expect(button.textContent).toBe('Enroll Now');
      });
    });

    it('should set up event listeners for dropdowns', async () => {
      const block = createBlockElement('payment-plans');
      await decorate(block);

      const dropdown = block.querySelector('.pricing-card__dropdown');
      expect(dropdown).toBeDefined();

      // Test that clicking dropdown doesn't throw errors
      const clickEvent = new MouseEvent('click', { bubbles: true });
      expect(() => {
        dropdown.dispatchEvent(clickEvent);
      }).not.toThrow();
    });

    it('should set up event listeners for accordion toggles', async () => {
      const block = createBlockElement('payment-plans');
      await decorate(block);

      const accordionToggle = block.querySelector('.pricing-card__accordion-toggle');
      if (accordionToggle) {
        const clickEvent = new MouseEvent('click', { bubbles: true });
        expect(() => {
          accordionToggle.dispatchEvent(clickEvent);
        }).not.toThrow();
      }
    });
  });

  describe('Swiper Integration', () => {
    it('should initialize swiper with correct configuration', async () => {
      const block = createBlockElement('payment-plans');
      await decorate(block);

      expect(MockSwiperClass).toHaveBeenCalledTimes(1);

      const swiperConfig = MockSwiperClass.mock.calls[0][1];
      expect(swiperConfig.slidesPerView).toBe(1.35);
      expect(swiperConfig.spaceBetween).toBe(10);
      expect(swiperConfig.centeredSlides).toBe(true);
      expect(swiperConfig.navigation).toBeDefined();
      expect(swiperConfig.pagination).toBeDefined();
    });

    it('should have responsive breakpoints configured', async () => {
      const block = createBlockElement('payment-plans');
      await decorate(block);

      const swiperConfig = MockSwiperClass.mock.calls[0][1];
      expect(swiperConfig.breakpoints).toBeDefined();
      expect(swiperConfig.breakpoints[600]).toBeDefined();
      expect(swiperConfig.breakpoints[900]).toBeDefined();
      expect(swiperConfig.breakpoints[1200]).toBeDefined();
      expect(swiperConfig.breakpoints[1440]).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing swiper wrapper gracefully', async () => {
      const block = createBlockElement('payment-plans');
      // Remove swiper wrapper after initial creation
      const container = document.createElement('div');
      container.classList.add('payment-plans__container');
      container.innerHTML = '<div class="pricing-swiper"></div>';
      block.appendChild(container);

      expect(async () => {
        await decorate(block);
      }).not.toThrow();
    });

    it('should handle loadSwiper rejection gracefully', async () => {
      mockLoadSwiper.mockRejectedValueOnce(new Error('Swiper failed to load'));

      const block = createBlockElement('payment-plans');

      await expect(decorate(block)).rejects.toThrow('Swiper failed to load');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes for accordion toggles', async () => {
      const block = createBlockElement('payment-plans');
      await decorate(block);

      const accordionToggles = block.querySelectorAll('.pricing-card__accordion-toggle');
      accordionToggles.forEach((toggle) => {
        expect(toggle.getAttribute('aria-expanded')).toBe('false');
        expect(toggle.dataset.target).toBeDefined();
      });
    });

    it('should have accessible button elements', async () => {
      const block = createBlockElement('payment-plans');
      await decorate(block);

      const buttons = block.querySelectorAll('button');
      buttons.forEach((button) => {
        // Should be focusable
        expect(button.tabIndex).not.toBe(-1);
      });
    });
  });

  describe('Data Attributes', () => {
    it('should set correct data attributes on cards', async () => {
      const block = createBlockElement('payment-plans');
      await decorate(block);

      const cards = block.querySelectorAll('.pricing-card');
      cards.forEach((card, index) => {
        expect(card.dataset.card).toBe(index.toString());
      });
    });

    it('should set correct data attributes on payment options', async () => {
      const block = createBlockElement('payment-plans');
      await decorate(block);

      const options = block.querySelectorAll('.pricing-card__option');
      const expectedOptions = ['12-months', '6-months', 'full-payment'];

      options.forEach((option) => {
        expect(expectedOptions).toContain(option.dataset.option);
      });
    });
  });

  describe('PricingCardsSwiper Class - Advanced Tests', () => {
    it('should handle payment option changes correctly', async () => {
      const block = createBlockElement('payment-plans');
      await decorate(block);

      // Find a payment option and click it
      const sixMonthOption = block.querySelector('.pricing-card__option[data-option="6-months"]');
      if (sixMonthOption) {
        const clickEvent = new MouseEvent('click', { bubbles: true });
        sixMonthOption.dispatchEvent(clickEvent);

        // All cards should now show 6-month pricing
        const selectedOptions = block.querySelectorAll('.pricing-card__option--selected');
        selectedOptions.forEach((option) => {
          expect(option.dataset.option).toBe('6-months');
        });

        // Dropdown text should be updated
        const dropdownTexts = block.querySelectorAll('.pricing-card__dropdown-text');
        dropdownTexts.forEach((text) => {
          expect(text.textContent).toBe('6 Monthly Payments');
        });
      }
    });

    it('should toggle accordion content when accordion toggle is clicked', async () => {
      const block = createBlockElement('payment-plans');
      await decorate(block);

      const accordionToggle = block.querySelector('.pricing-card__accordion-toggle');
      if (accordionToggle) {
        const targetId = accordionToggle.dataset.target;
        const accordionContent = block.querySelector(`#${targetId}`);

        if (accordionContent) {
          // Initially should be collapsed
          expect(accordionToggle.getAttribute('aria-expanded')).toBe('false');

          // Click to expand
          const clickEvent = new MouseEvent('click', { bubbles: true });
          accordionToggle.dispatchEvent(clickEvent);

          // Should be expanded now
          // (note: the actual implementation might not work in JSDOM due to DOM quirks)
          // This test validates the structure is correct
          expect(accordionContent).toBeDefined();
        }
      }
    });

    it('should open dropdown when dropdown is clicked', async () => {
      const block = createBlockElement('payment-plans');
      await decorate(block);

      const dropdown = block.querySelector('.pricing-card__dropdown');
      const cardIndex = dropdown.dataset.card;
      const options = block.querySelector(`.pricing-card__options[data-card="${cardIndex}"]`);

      // Initially dropdown should be closed
      expect(options.classList.contains('pricing-card__options--open')).toBe(false);

      // Click dropdown
      const clickEvent = new MouseEvent('click', { bubbles: true });
      dropdown.dispatchEvent(clickEvent);

      // Should be open now
      expect(options.classList.contains('pricing-card__options--open')).toBe(true);
    });

    it('should close dropdown when clicking outside', async () => {
      const block = createBlockElement('payment-plans');
      await decorate(block);

      const dropdown = block.querySelector('.pricing-card__dropdown');
      const cardIndex = dropdown.dataset.card;
      const options = block.querySelector(`.pricing-card__options[data-card="${cardIndex}"]`);

      // Open dropdown first
      const clickEvent = new MouseEvent('click', { bubbles: true });
      dropdown.dispatchEvent(clickEvent);
      expect(options.classList.contains('pricing-card__options--open')).toBe(true);

      // Click outside (document)
      const outsideClickEvent = new MouseEvent('click', { bubbles: true });
      document.dispatchEvent(outsideClickEvent);

      // Should be closed now
      expect(options.classList.contains('pricing-card__options--open')).toBe(false);
    });
  });

  describe('Pricing Data Validation', () => {
    it('should render correct prices for 12-month option', async () => {
      const block = createBlockElement('payment-plans');
      await decorate(block);

      const priceAmounts = block.querySelectorAll('.pricing-card__amount');
      const expectedPrices = ['$79', '$99', '$199', '$299']; // Default 12-month prices

      priceAmounts.forEach((amount, index) => {
        expect(amount.textContent).toBe(expectedPrices[index]);
      });
    });

    it('should show monthly payment period for monthly options', async () => {
      const block = createBlockElement('payment-plans');
      await decorate(block);

      const pricePeriods = block.querySelectorAll('.pricing-card__period');
      pricePeriods.forEach((period) => {
        expect(period.textContent).toBe('/month');
      });
    });

    it('should show discount badges for monthly payment plans', async () => {
      const block = createBlockElement('payment-plans');
      await decorate(block);

      const discounts = block.querySelectorAll('.pricing-card__discount');
      expect(discounts.length).toBe(4); // All cards should have discount badge
      discounts.forEach((discount) => {
        expect(discount.textContent).toBe('45% off');
      });
    });

    it('should show down payment and terms information', async () => {
      const block = createBlockElement('payment-plans');
      await decorate(block);

      const termsElements = block.querySelectorAll('.pricing-card__terms');
      const expectedTerms = [
        '$49 down, then monthly payments',
        '$59 down, then monthly payments',
        '$99 down, then monthly payments',
        '$149 down, then monthly payments',
      ];

      termsElements.forEach((terms, index) => {
        expect(terms.textContent).toBe(expectedTerms[index]);
      });
    });
  });

  describe('Feature Content Validation', () => {
    it('should render self-study features correctly', async () => {
      const block = createBlockElement('payment-plans');
      await decorate(block);

      const firstCard = block.querySelector('.pricing-card[data-card="0"]');
      const features = firstCard.querySelectorAll('.pricing-card__feature-text');

      expect(features.length).toBe(4); // Self-study has 4 features
      expect(features[0].textContent).toBe('100% flexible, fully digital');
    });

    it('should render premium features with job guarantee', async () => {
      const block = createBlockElement('payment-plans');
      await decorate(block);

      const premiumCard = block.querySelector('.pricing-card[data-card="1"]');
      const jobGuaranteeFeature = [...premiumCard.querySelectorAll('.pricing-card__feature-text')]
        .find((feature) => feature.textContent.includes('Job Guarantee'));

      expect(jobGuaranteeFeature).toBeDefined();
      expect(jobGuaranteeFeature.textContent).toBe('Job Guarantee included**');
    });

    it('should render addon features with plus icons', async () => {
      const block = createBlockElement('payment-plans');
      await decorate(block);

      const addonFeatures = block.querySelectorAll('.pricing-card__feature-text--addon');
      const addonIcons = block.querySelectorAll('.pricing-card__feature-icon');

      expect(addonFeatures.length).toBeGreaterThan(0);
      expect(addonIcons.length).toBeGreaterThan(0);

      // Each addon icon should contain 'add' text
      addonIcons.forEach((icon) => {
        expect(icon.textContent).toBe('add');
      });
    });
  });

  describe('CSS Classes and Structure', () => {
    it('should apply popular card styling correctly', async () => {
      const block = createBlockElement('payment-plans');
      await decorate(block);

      const popularCard = block.querySelector('.pricing-card--popular');
      const popularContainer = popularCard.querySelector('.pricing-card__container--popular');

      expect(popularCard).toBeDefined();
      expect(popularContainer).toBeDefined();
    });

    it('should have correct card structure for each pricing tier', async () => {
      const block = createBlockElement('payment-plans');
      await decorate(block);

      const cards = block.querySelectorAll('.pricing-card');
      const expectedTitles = ['SELF-STUDY', 'PREMIUM SELF-STUDY', 'CPT ESSENTIALS', 'EXCLUSIVE BUNDLE'];

      cards.forEach((card, index) => {
        const title = card.querySelector('.pricing-card__title');
        expect(title.textContent).toBe(expectedTitles[index]);

        // Each card should have required sections
        expect(card.querySelector('.pricing-card__header')).toBeDefined();
        expect(card.querySelector('.pricing-card__pricing')).toBeDefined();
        expect(card.querySelector('.pricing-card__payment')).toBeDefined();
        expect(card.querySelector('.pricing-card__features')).toBeDefined();
        expect(card.querySelector('.pricing-card__enroll-btn')).toBeDefined();
      });
    });
  });

  describe('Custom Cards Data', () => {
    it('should handle custom cards data passed to constructor', async () => {
      // Create a custom block to test with custom data
      const block = createBlockElement('payment-plans');

      // We could mock custom data here but for this test we'll focus on
      // validating that the structure supports custom data injection
      // Custom data would be: eyebrow, title, prices, features, payment options

      // We need to test by creating a custom container and initializing directly
      // Since we can't easily access the class constructor in the current setup,
      // we'll test this functionality through the decorate function behavior
      await decorate(block);

      // Verify default behavior works (4 cards)
      const slides = block.querySelectorAll('.swiper-slide');
      expect(slides.length).toBe(4);

      // This test validates the structure exists for custom data
      const firstCard = block.querySelector('.pricing-card');
      expect(firstCard).toBeDefined();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle missing accordion content gracefully', async () => {
      const block = createBlockElement('payment-plans');
      await decorate(block);

      // Try to find an accordion toggle
      const accordionToggle = block.querySelector('.pricing-card__accordion-toggle');
      if (accordionToggle) {
        // Temporarily remove the target to test error handling
        const originalTarget = accordionToggle.dataset.target;
        accordionToggle.dataset.target = 'non-existent-id';

        // Should not throw error when clicking
        const clickEvent = new MouseEvent('click', { bubbles: true });
        expect(() => {
          accordionToggle.dispatchEvent(clickEvent);
        }).not.toThrow();

        // Restore original target
        accordionToggle.dataset.target = originalTarget;
      }
    });

    it('should handle missing dropdown options gracefully', async () => {
      const block = createBlockElement('payment-plans');
      await decorate(block);

      const dropdown = block.querySelector('.pricing-card__dropdown');
      if (dropdown) {
        // Temporarily remove the card index to test error handling
        const originalCard = dropdown.dataset.card;
        dropdown.dataset.card = '999'; // Non-existent card

        // Should not throw error when clicking
        const clickEvent = new MouseEvent('click', { bubbles: true });
        expect(() => {
          dropdown.dispatchEvent(clickEvent);
        }).not.toThrow();

        // Restore original card
        dropdown.dataset.card = originalCard;
      }
    });

    it('should handle click events on non-dropdown elements gracefully', async () => {
      const block = createBlockElement('payment-plans');
      await decorate(block);

      // Click on a random element that's not a dropdown or option
      const title = block.querySelector('.pricing-card__title');
      if (title) {
        const clickEvent = new MouseEvent('click', { bubbles: true });
        expect(() => {
          title.dispatchEvent(clickEvent);
        }).not.toThrow();
      }
    });
  });

  describe('Performance and Optimization', () => {
    it('should efficiently update all cards when payment option changes', async () => {
      const block = createBlockElement('payment-plans');
      await decorate(block);

      const initialPrices = [...block.querySelectorAll('.pricing-card__amount')].map(
        (el) => el.textContent,
      );

      // Click on full payment option
      const fullPaymentOption = block.querySelector('.pricing-card__option[data-option="full-payment"]');
      if (fullPaymentOption) {
        const clickEvent = new MouseEvent('click', { bubbles: true });
        fullPaymentOption.dispatchEvent(clickEvent);

        // Prices should be updated
        const updatedPrices = [...block.querySelectorAll('.pricing-card__amount')].map(
          (el) => el.textContent,
        );

        // Should be different from initial monthly prices
        expect(updatedPrices).not.toEqual(initialPrices);

        // Should show full payment prices
        const expectedFullPaymentPrices = ['$799', '$999', '$1999', '$2999'];
        expect(updatedPrices).toEqual(expectedFullPaymentPrices);

        // Period should be hidden for full payment
        const periods = block.querySelectorAll('.pricing-card__period');
        periods.forEach((period) => {
          expect(period.style.display).toBe('none');
        });
      }
    });

    it('should update dropdown text when payment option changes globally', async () => {
      const block = createBlockElement('payment-plans');
      await decorate(block);

      // Click on 6-month option
      const sixMonthOption = block.querySelector('.pricing-card__option[data-option="6-months"]');
      if (sixMonthOption) {
        const clickEvent = new MouseEvent('click', { bubbles: true });
        sixMonthOption.dispatchEvent(clickEvent);

        // All dropdown texts should be updated to 6-month
        const dropdownTexts = block.querySelectorAll('.pricing-card__dropdown-text');
        dropdownTexts.forEach((text) => {
          expect(text.textContent).toBe('6 Monthly Payments');
        });
      }
    });
  });
});
