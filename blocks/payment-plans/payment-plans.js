/* eslint-disable no-console */
/* eslint-disable no-unused-vars */
/* eslint-disable class-methods-use-this */
import { events } from '@dropins/tools/event-bus.js';
import { loadSwiper } from '../../scripts/scripts.js';
import { setupAddToCartDataLayer, trackAddToCartGA4, scrollToCartIcon } from '../../scripts/commerce.js';
import { showErrorToast, showSuccessToast } from '../../scripts/toast.js';

class PricingCardsSwiper {
  constructor(container, cardsData = null, productData = null) {
    this.container = container;
    this.globalPaymentOption = '12-months';
    this.cardsData = cardsData || this.getDefaultCardsData();
    this.productData = productData;
    this.swiper = null;

    this.init();

    // If product data is provided during initialization, check for bundle pricing after init
    if (productData) {
      this.checkAndUpdateBundleData(productData);
    }
  }

  /**
   * Get default cards data (reuses existing data structure)
   */
  getDefaultCardsData() {
    // Sample features data
    const selfStudyFeatures = [
      { type: 'basic', text: '100% flexible, fully digital' },
      { type: 'basic', text: 'Learner Orientation' },
      { type: 'basic', text: 'Practice exams, flashcards, study guide' },
      {
        type: 'basic',
        text: 'Best-in-Class Test Prep with NASM\'s Edge Mobile App',
      },
    ];

    const premiumSelfStudyFeatures = [
      {
        type: 'basic',
        text: 'Flexible, learner orientation, fully digital, practice exams, flashcards, study guide, best-in-class test prep',
      },
      {
        type: 'addon',
        text: 'Job Guarantee included**',
        accordion: {
          content: 'Want help getting your first personal training job? With our Job Guarantee program, you\'re guaranteed to get a job within 90 days of passing your NASM CPT exam, or the cost of the Job Guarantee will be refunded to you.',
        },
      },
      { type: 'addon', text: 'Unlimited access to study support coaching' },
    ];

    const cptEssentialsFeatures = [
      {
        type: 'basic',
        text: 'Flexible, learner orientation, fully digital, practice exams, flashcards, study guide, best-in-class test prep, Job Guarantee, unlimited access to study support coaching',
      },
      { type: 'addon', text: 'CPR/AED Cert - required for all CPTs' },
      {
        type: 'addon',
        text: 'Certified Nutrition Coach (CNC) course included',
        accordion: {
          content: 'Expand your earning potential by offering comprehensive nutritional support to your clients, instead of outsourcing their needs.',
        },
      },
      {
        type: 'addon',
        text: 'CPT Practical Skills Workshop',
        accordion: {
          content: 'Led by NASM Master Instructors, this video-based learning experience equips you with the knowledge and skills to confidently assess, design, and administer fitness programming.',
        },
      },
    ];

    const exclusiveBundleFeatures = [
      {
        type: 'basic',
        text: 'Flexible, learner orientation, fully digital, practice exams, flashcards, study guide, best-in-class test prep, Job Guarantee, unlimited access to study support coaching, CPR/AED, Certified Nutrition Course (CNC), CPT Practical Skills Workshop',
      },
      { type: 'basic', text: 'Call 844-902-6487 to Customize Your Bundle' },
      {
        type: 'addon',
        text: 'Corrective Exercise Specialization (CES) course included',
        accordion: {
          content: 'Stretch your earning potential and present your value to clients right out of the gate with movement optimization strategies.',
        },
      },
    ];

    return [
      {
        eyebrow: 'Fastest Completion',
        title: 'SELF-STUDY',
        monthlyPrice: 79,
        downPayment: 49,
        originalPrice: 899,
        badge: null,
        promotionLabel: '', // Will be populated from API when product data is available
        features: selfStudyFeatures,
        paymentOptions: {
          '12-months': { price: 79, originalPrice: 899 },
          '6-months': { price: 149, originalPrice: 899 },
          'full-payment': { price: 799, originalPrice: 899 },
        },
      },
      {
        eyebrow: 'Extra Support',
        title: 'PREMIUM SELF-STUDY',
        monthlyPrice: 99,
        downPayment: 59,
        originalPrice: 1119,
        badge: 'Most Popular',
        promotionLabel: '', // Will be populated from API when product data is available
        features: premiumSelfStudyFeatures,
        paymentOptions: {
          '12-months': { price: 99, originalPrice: 1119 },
          '6-months': { price: 189, originalPrice: 1119 },
          'full-payment': { price: 999, originalPrice: 1119 },
        },
      },
      {
        eyebrow: 'Optimal Value',
        title: 'CPT ESSENTIALS',
        monthlyPrice: 199,
        downPayment: 99,
        originalPrice: 2299,
        badge: null,
        promotionLabel: '', // Will be populated from API when product data is available
        features: cptEssentialsFeatures,
        paymentOptions: {
          '12-months': { price: 199, originalPrice: 2299 },
          '6-months': { price: 389, originalPrice: 2299 },
          'full-payment': { price: 1999, originalPrice: 2299 },
        },
      },
      {
        eyebrow: 'Maximum Value',
        title: 'EXCLUSIVE BUNDLE',
        monthlyPrice: 299,
        downPayment: 149,
        originalPrice: 3499,
        badge: null,
        promotionLabel: '', // Will be populated from API when product data is available
        features: exclusiveBundleFeatures,
        paymentOptions: {
          '12-months': { price: 299, originalPrice: 3499 },
          '6-months': { price: 589, originalPrice: 3499 },
          'full-payment': { price: 2999, originalPrice: 3499 },
        },
      },
    ];
  }

  /**
   * Initialize the Swiper implementation
   */
  init() {
    this.renderCards();
    this.initializeSwiper();
    this.attachEventListeners();
  }

  /**
   * Render all pricing cards in Swiper slides
   */
  renderCards() {
    const swiperWrapper = this.container.querySelector('.pricing-swiper__slider .swiper-wrapper');
    if (!swiperWrapper) return;

    swiperWrapper.innerHTML = '';

    this.cardsData.forEach((card, index) => {
      const slide = document.createElement('div');
      slide.className = 'swiper-slide';
      slide.innerHTML = this.generateCardHTML(card, index);
      swiperWrapper.appendChild(slide);
    });
  }

  /**
   * Generate HTML for a pricing card (reuses existing structure)
   */
  generateCardHTML(card, index) {
    const isPopular = card.badge === 'Most Popular';
    // Check if this specific card is a bundle (for matrix products) or use legacy logic
    const { isBundle } = card;
    const currentPricing = card.paymentOptions[this.globalPaymentOption];

    return `
<div class="pricing-card${isPopular ? ' pricing-card--popular' : ''}${isBundle ? ' pricing-card--bundle' : ''}${!this.shouldShowFeatures(card) ? ' pricing-card--no-features' : ''}" data-card="${index}">
  ${card.badge ? `<div class="pricing-card__badge">${card.badge}</div>` : ''}
  
  <div class="pricing-card__container${isPopular ? ' pricing-card__container--popular' : ''}">
    <div class="pricing-card__header">
      <div class="pricing-card__eyebrow">${card.eyebrow}</div>
      <h3 class="pricing-card__title">${card.title}</h3>
    </div>

    <div class="pricing-card__pricing">
      <div class="pricing-card__price-row">
        <div class="pricing-card__price">
          <span class="pricing-card__amount">$${currentPricing.price}</span>
          <span class="pricing-card__period">${this.getPricePeriodText()}</span>
        </div>
        ${card.promotionLabel ? `<div class="pricing-card__discount">${card.promotionLabel}</div>` : ''}
      </div>
      ${this.globalPaymentOption !== 'full-payment' || this.shouldShowPricingDetails(currentPricing)
    ? `<div class="pricing-card__details">
      ${this.shouldShowPricingDetails(currentPricing) ? `<span class="pricing-card__original-price">$${currentPricing.originalPrice}</span>` : ''}
      ${this.shouldShowPaymentTerms() ? `<div class="pricing-card__terms">*${(currentPricing.instalmentType || 'fixed') === 'percentage' ? `${currentPricing.downPayment || card.downPayment}%` : `$${currentPricing.downPayment || card.downPayment}`} down + ${this.getPaymentTermText()}</div>` : ''}
    </div>`
    : ''}
  </div>

    <div class="pricing-card__payment">
      <div class="pricing-card__dropdown" data-card="${index}">
        <span class="pricing-card__dropdown-text">${this.getPaymentOptionText()}</span>
        <span class="pricing-card__dropdown-icon material-symbols-outlined">expand_more</span>
      </div>
      <div class="pricing-card__options" data-card="${index}">
        ${Object.keys(card.paymentOptions).map((optionKey) => {
    const option = card.paymentOptions[optionKey];
    let optionText;
    if (optionKey === 'full-payment') {
      optionText = 'Pay in Full';
    } else if (option.instalmentNumber) {
      optionText = `${option.instalmentNumber} Monthly Payments`;
    } else {
      optionText = optionKey.replace('-', ' ').replace(/\\b\\w/g, (l) => l.toUpperCase());
    }
    return `<div class="pricing-card__option ${this.globalPaymentOption === optionKey ? 'pricing-card__option--selected' : ''}" data-option="${optionKey}">${optionText}</div>`;
  }).join('')}
      </div>
    </div>

    <button class="pricing-card__enroll-btn" data-card-index="${index}" data-product-sku="${card.productSku || ''}" ${isBundle ? 'data-bundle-cart="true"' : 'data-simple-cart="true"'}>${isBundle || card.isSingleComplex ? 'Buy Now' : 'Enroll Now'}</button>

    ${this.shouldShowFeatures(card) ? `<div class="pricing-card__features">
      <h4 class="pricing-card__features-title">${this.getFeaturesTitle(card)}</h4>
      <div class="pricing-card__features-list">
        ${this.generateFeaturesHTML(card, index)}
      </div>
    </div>` : ''}
  </div>
</div>
    `;
  }

  /**
   * Determine if features section should be shown
   */
  shouldShowFeatures(card) {
    // Show features if we have child_description data in either format:
    // 1. Complex object with mainFeatures (accordion format)
    // 2. Simple array (list format)
    const hasComplexFeatures = card.features && typeof card.features === 'object' && card.features.mainFeatures;
    const hasSimpleFeatures = Array.isArray(card.features) && card.features.length > 0;
    const shouldShow = hasComplexFeatures || hasSimpleFeatures;

    return shouldShow;
  }

  /**
   * Get the features title based on child_description or fallback
   */
  getFeaturesTitle(card) {
    // Check if features is an object with heading (from child_description accordion format)
    if (card.features && typeof card.features === 'object' && card.features.heading) {
      return card.features.heading;
    }
    // Default fallback for both simple arrays and complex objects without heading
    return 'This Bundle Includes';
  }

  /**
   * Generate features HTML based on the card structure
   */
  generateFeaturesHTML(card, index) {
    let html = '';

    // Check if features is an object with mainFeatures (accordion format from child_description)
    if (card.features && typeof card.features === 'object' && card.features.mainFeatures) {
      // First, render the main features
      html += card.features.mainFeatures
        .map((feature) => this.generateFeatureHTML(feature, index))
        .join('');

      // Then, render additional rows as accordions
      if (card.features.additionalRows && card.features.additionalRows.length > 0) {
        html += card.features.additionalRows
          .map((row, rowIndex) => this.generateAccordionHTML(row, index, rowIndex))
          .join('');
      }

      return html;
    }

    // Simple array format (from single-column child_description or legacy features)
    if (Array.isArray(card.features)) {
      return card.features
        .map((feature) => this.generateFeatureHTML(feature, index))
        .join('');
    }

    return '';
  }

  /**
   * Generate HTML for a feature (reuses existing structure)
   */
  generateFeatureHTML(feature, cardIndex) {
    const hasAccordion = feature.accordion;
    const featureId = `feature-${cardIndex}-${feature.text.replace(/\s+/g, '-').toLowerCase()}`;

    return `
<div class="pricing-card__feature">
  <div class="pricing-card__feature-header">
    <div class="pricing-card__feature-icon-wrapper">
      ${feature.type === 'addon'
    ? '<span class="pricing-card__feature-icon material-symbols-outlined">add</span>'
    : '<span class="pricing-card__feature-bullet">•</span>'
}
    </div>
    <span class="pricing-card__feature-text${feature.type === 'addon' ? ' pricing-card__feature-text--addon' : ''}">${feature.text}</span>
    ${hasAccordion
    ? `<button class="pricing-card__accordion-toggle" data-target="${featureId}" aria-expanded="false">
        <span class="pricing-card__accordion-arrow material-symbols-outlined">expand_more</span>
      </button>`
    : ''
}
  </div>
  ${hasAccordion
    ? `<div class="pricing-card__accordion-content" id="${featureId}">
      <p>${feature.accordion.content}</p>
    </div>`
    : ''
}
</div>
    `;
  }

  /**
   * Generate HTML for an accordion from additional rows
   */
  generateAccordionHTML(row, cardIndex, rowIndex) {
    const accordionId = `accordion-${cardIndex}-row-${rowIndex}`;

    return `
<div class="pricing-card__feature pricing-card__feature--accordion">
  <div class="pricing-card__feature-header pricing-card__accordion-header" data-accordion-target="${accordionId}" aria-expanded="false" role="button" tabindex="0">
    <div class="pricing-card__feature-icon-wrapper">
      <span class="pricing-card__feature-icon material-symbols-outlined">add</span>
    </div>
    <span class="pricing-card__feature-text pricing-card__feature-text--addon">${row.title}</span>
    <span class="pricing-card__accordion-arrow material-symbols-outlined">expand_more</span>
  </div>
  <div class="pricing-card__accordion-content" id="${accordionId}">
    ${this.formatAccordionContent(row.content)}
  </div>
</div>
    `;
  }

  /**
   * Format accordion content - handle bullet points and paragraphs
   */
  formatAccordionContent(content) {
    if (!content) return '';

    // Split content by newlines to handle bullet points
    const lines = content.split('\n').filter((line) => line.trim());

    // Check if all lines are bullet points
    const allBullets = lines.every((line) => line.startsWith('• '));

    if (allBullets) {
      // Format as a list
      const items = lines.map((line) => `<li>${line.substring(2).trim()}</li>`).join('');
      return `<ul>${items}</ul>`;
    }
    // Format as paragraphs
    return lines.map((line) => `<p>${line}</p>`).join('');
  }

  /**
   * Initialize Swiper with responsive configuration
   */
  initializeSwiper() {
    const swiperElement = this.container.querySelector('.pricing-swiper__slider');
    if (!swiperElement) {
      return;
    }

    this.swiper = new window.Swiper(swiperElement, {
      // Basic configuration
      slidesPerView: 1.35,
      spaceBetween: 10,
      centeredSlides: true,
      allowTouchMove: true,

      // Navigation
      navigation: {
        nextEl: this.container.querySelector('.pricing-swiper__slider .swiper-button-next'),
        prevEl: this.container.querySelector('.pricing-swiper__slider .swiper-button-prev'),
      },

      // Pagination
      pagination: {
        el: this.container.querySelector('.pricing-swiper__slider .swiper-pagination'),
        clickable: true,
      },

      // Touch settings - Enable touch for mobile
      grabCursor: true,
      touchRatio: 1,
      touchAngle: 45,
      touchStartPreventDefault: false,
      touchMoveStopPropagation: false,
      simulateTouch: true,

      // Enable touch events
      touchEventsTarget: 'container',
      touchStartForcePreventDefault: false,

      // Resistance settings for better touch feel
      resistance: true,
      resistanceRatio: 0.5,

      // Speed settings
      speed: 300,

      // Responsive breakpoints
      breakpoints: {
        // Mobile with card previews (430px and above)
        // 430: {
        //   slidesPerView: 1.35,
        //   spaceBetween: 10,
        //   centeredSlides: true,
        //   allowTouchMove: true,
        // },
        // Tablet small (600px and above)
        768: {
          slidesPerView: 2,
          spaceBetween: 24,
          allowTouchMove: true,
        },
        // Tablet large (900px and above)
        1024: {
          slidesPerView: 2,
          spaceBetween: 30,
          centeredSlides: this.cardsData.length === 1,
          allowTouchMove: true,
        },
        // Desktop (1200px and above)
        1200: {
          slidesPerView: this.cardsData.length === 1 ? 1 : Math.min(this.cardsData.length, 3),
          spaceBetween: 32,
          centeredSlides: this.cardsData.length === 1,
          allowTouchMove: false, // Disable touch only on desktop
        },
        // Large desktop (1440px and above)
        1440: {
          slidesPerView: this.cardsData.length === 1 ? 1 : Math.min(this.cardsData.length, 3),
          spaceBetween: 40,
          centeredSlides: this.cardsData.length === 1,
          allowTouchMove: false, // Disable touch only on desktop
        },
      },

      // Callbacks
      on: {
        init: () => {
          // Set initial navigation visibility
          const nextBtn = this.container.querySelector('.pricing-swiper__slider .swiper-button-next');
          const prevBtn = this.container.querySelector('.pricing-swiper__slider .swiper-button-prev');
          const pagination = this.container.querySelector('.pricing-swiper__slider .swiper-pagination');

          if (window.innerWidth >= 1200) {
            const showNavigation = this.cardsData.length > 3;
            if (nextBtn) nextBtn.style.display = showNavigation ? 'flex' : 'none';
            if (prevBtn) prevBtn.style.display = showNavigation ? 'flex' : 'none';
            if (pagination) pagination.style.display = showNavigation ? 'block' : 'none';
          }
        },
        breakpoint: () => {
          // Update navigation visibility based on breakpoint
          const nextBtn = this.container.querySelector('.pricing-swiper__slider .swiper-button-next');
          const prevBtn = this.container.querySelector('.pricing-swiper__slider .swiper-button-prev');
          const pagination = this.container.querySelector('.pricing-swiper__slider .swiper-pagination');

          if (window.innerWidth >= 1200) {
            // Show navigation only if there are more than 3 cards on desktop
            const showNavigation = this.cardsData.length > 3;
            if (nextBtn) nextBtn.style.display = showNavigation ? 'flex' : 'none';
            if (prevBtn) prevBtn.style.display = showNavigation ? 'flex' : 'none';
            if (pagination) pagination.style.display = showNavigation ? 'block' : 'none';
          } else {
            if (nextBtn) nextBtn.style.display = 'flex';
            if (prevBtn) prevBtn.style.display = 'flex';
            if (pagination) pagination.style.display = 'block';
          }
        },
      },
    });
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Payment option dropdowns - scoped to this container
    this.container.addEventListener('click', (e) => {
      if (e.target.closest('.pricing-card__dropdown')) {
        this.handleDropdownClick(e);
      }

      if (e.target.closest('.pricing-card__option')) {
        this.handleOptionSelect(e);
      }

      if (e.target.closest('.pricing-card__accordion-toggle')) {
        this.handleAccordionToggle(e);
      }

      if (e.target.closest('.pricing-card__accordion-header')) {
        this.handleAccordionHeaderClick(e);
      }

      if (e.target.matches('.pricing-card__enroll-btn[data-bundle-cart="true"]')) {
        this.handleBundleAddToCart(e);
      }

      if (e.target.matches('.pricing-card__enroll-btn[data-simple-cart="true"]')) {
        this.handleSimpleAddToCart(e);
      }
    });

    // Close dropdowns when clicking outside - scoped to this container
    document.addEventListener('click', (e) => {
      // Only close if click is outside this container or not on dropdown/options
      if (!this.container.contains(e.target)) {
        this.closeAllDropdowns();
      } else if (!e.target.closest('.pricing-card__dropdown') && !e.target.closest('.pricing-card__options')) {
        this.closeAllDropdowns();
      }
    });
  }

  /**
   * Handle dropdown clicks
   */
  handleDropdownClick(e) {
    e.preventDefault();
    const dropdown = e.target.closest('.pricing-card__dropdown');
    const { card: cardIndex } = dropdown.dataset;
    const options = this.container.querySelector(`.pricing-card__options[data-card="${cardIndex}"]`);
    const icon = dropdown.querySelector('.pricing-card__dropdown-icon');

    // Close other dropdowns
    this.closeAllDropdowns(cardIndex);

    // Toggle current dropdown
    const isOpen = options.classList.contains('pricing-card__options--open');
    if (isOpen) {
      options.classList.remove('pricing-card__options--open');
      icon.classList.remove('pricing-card__dropdown-icon--open');
    } else {
      options.classList.add('pricing-card__options--open');
      icon.classList.add('pricing-card__dropdown-icon--open');
    }
  }

  /**
   * Handle payment option selection
   */
  handleOptionSelect(e) {
    e.preventDefault();
    const option = e.target.closest('.pricing-card__option');
    const selectedOption = option.dataset.option;

    // Update global payment option
    this.globalPaymentOption = selectedOption;

    // Update all cards efficiently without re-rendering
    this.updateAllCardPricing();

    // Close dropdowns
    this.closeAllDropdowns();
  }

  /**
   * Efficiently update pricing display for all cards without re-rendering
   */
  updateAllCardPricing() {
    this.cardsData.forEach((card, index) => {
      this.updateCardPricing(card, index);
    });
  }

  /**
   * Update pricing display for a single card
   */
  updateCardPricing(card, cardIndex) {
    const cardElement = this.container.querySelector(`.pricing-card[data-card="${cardIndex}"]`);
    if (!cardElement) return;

    const currentPricing = card.paymentOptions[this.globalPaymentOption];

    // Update price amount
    const priceAmount = cardElement.querySelector('.pricing-card__amount');
    if (priceAmount) {
      priceAmount.textContent = `$${currentPricing.price}`;
    }

    // Update price period text (dynamic based on payment option)
    const pricePeriod = cardElement.querySelector('.pricing-card__period');
    if (pricePeriod) {
      pricePeriod.textContent = this.getPricePeriodText();
    }

    // Update discount badge (always show if present)
    // Badge is now always shown if it exists (no hiding for full-payment)

    // Update pricing details (show for payment terms or strikeout pricing)
    const pricingDetails = cardElement.querySelector('.pricing-card__details');
    if (pricingDetails) {
      // Show details if it's not full-payment (for terms) OR if there's strikeout pricing
      if (this.globalPaymentOption !== 'full-payment' || this.shouldShowPricingDetails(currentPricing)) {
        pricingDetails.style.display = 'block';

        // Update original price (only show if there's strikeout pricing)
        const originalPrice = pricingDetails.querySelector('.pricing-card__original-price');
        if (originalPrice) {
          if (this.shouldShowPricingDetails(currentPricing)) {
            originalPrice.textContent = `$${currentPricing.originalPrice}`;
            originalPrice.style.display = 'inline';
          } else {
            originalPrice.style.display = 'none';
          }
        }

        // Update down payment terms (only for non-full-payment options)
        const terms = pricingDetails.querySelector('.pricing-card__terms');
        if (terms) {
          if (this.globalPaymentOption !== 'full-payment') {
            const downPayment = currentPricing.downPayment || card.downPayment;
            const paymentTerms = this.getPaymentTermText();
            const instalmentType = currentPricing.instalmentType || 'fixed';
            const downPaymentDisplay = instalmentType === 'percentage' ? `${downPayment}%` : `$${downPayment}`;
            terms.textContent = paymentTerms ? `*${downPaymentDisplay} down + ${paymentTerms}` : `${downPaymentDisplay} down`;
            terms.style.display = 'block';
          } else {
            terms.style.display = 'none';
          }
        }
      } else {
        pricingDetails.style.display = 'none';
      }
    }

    // Update dropdown text
    const dropdownText = cardElement.querySelector('.pricing-card__dropdown-text');
    if (dropdownText) {
      dropdownText.textContent = this.getPaymentOptionText();
    }

    // Update selected option in dropdown
    const allOptions = cardElement.querySelectorAll('.pricing-card__option');
    allOptions.forEach((optionElement) => {
      if (optionElement.dataset.option === this.globalPaymentOption) {
        optionElement.classList.add('pricing-card__option--selected');
      } else {
        optionElement.classList.remove('pricing-card__option--selected');
      }
    });
  }

  /**
   * Handle accordion toggles
   */
  handleAccordionToggle(e) {
    e.preventDefault();
    const toggle = e.target.closest('.pricing-card__accordion-toggle');
    const targetId = toggle.dataset.target;
    const content = this.container.querySelector(`#${targetId}`);
    const arrow = toggle.querySelector('.pricing-card__accordion-arrow');

    const isExpanded = toggle.getAttribute('aria-expanded') === 'true';

    if (isExpanded) {
      content.classList.remove('pricing-card__accordion-content--open');
      arrow.classList.remove('pricing-card__accordion-arrow--expanded');
      toggle.setAttribute('aria-expanded', 'false');
    } else {
      content.classList.add('pricing-card__accordion-content--open');
      arrow.classList.add('pricing-card__accordion-arrow--expanded');
      toggle.setAttribute('aria-expanded', 'true');
    }
  }

  /**
   * Handle accordion header clicks (for new accordions from child_description)
   */
  handleAccordionHeaderClick(e) {
    e.preventDefault();
    const header = e.target.closest('.pricing-card__accordion-header');
    if (!header) return;

    const targetId = header.dataset.accordionTarget;
    const content = this.container.querySelector(`#${targetId}`);
    const arrow = header.querySelector('.pricing-card__accordion-arrow');

    const isExpanded = header.getAttribute('aria-expanded') === 'true';

    if (isExpanded) {
      content.classList.remove('pricing-card__accordion-content--open');
      arrow.classList.remove('pricing-card__accordion-arrow--expanded');
      header.setAttribute('aria-expanded', 'false');
    } else {
      content.classList.add('pricing-card__accordion-content--open');
      arrow.classList.add('pricing-card__accordion-arrow--expanded');
      header.setAttribute('aria-expanded', 'true');
    }
  }

  /**
   * Close all open dropdowns
   */
  closeAllDropdowns(exceptCardIndex = null) {
    const allOptions = this.container.querySelectorAll('.pricing-card__options');
    const allIcons = this.container.querySelectorAll('.pricing-card__dropdown-icon');

    allOptions.forEach((options, index) => {
      if (exceptCardIndex === null || index.toString() !== exceptCardIndex) {
        options.classList.remove('pricing-card__options--open');
      }
    });

    allIcons.forEach((icon, index) => {
      if (exceptCardIndex === null || index.toString() !== exceptCardIndex) {
        icon.classList.remove('pricing-card__dropdown-icon--open');
      }
    });
  }

  /**
   * Handle simple product add to cart - adds single product by SKU
   */
  async handleSimpleAddToCart(e) {
    e.preventDefault();
    const button = e.target;
    const { textContent: originalText, dataset: { productSku } } = button;

    try {
      // Update button state
      button.textContent = 'Adding to Cart...';
      button.disabled = true;

      if (!productSku) {
        throw new Error('Product SKU not available');
      }

      // Add single product to cart
      const { addProductsToCart } = await import('@dropins/storefront-cart/api.js');

      // Track single complex product for data layer
      // Use stored product data or card data
      const productData = this.productData || this.cardsData?.[0]?.productData;
      if (productData) {
        setupAddToCartDataLayer(productData, 1, []);
        await trackAddToCartGA4(productData, 1);
      }

      // Cache pdp_type for mini cart URL routing
      if (productData?.pdpType) {
        const pdpTypeCache = JSON.parse(sessionStorage.getItem('pdpTypeCache') || '{}');
        pdpTypeCache[productSku] = productData.pdpType;
        sessionStorage.setItem('pdpTypeCache', JSON.stringify(pdpTypeCache));
      }

      await addProductsToCart([{
        sku: productSku,
        quantity: 1,
      }]);

      // Scroll to cart icon after successful add-to-cart
      scrollToCartIcon();

      // Show success toast at top
      showSuccessToast('Product added to cart successfully!', 'Added to Cart');

      // Success feedback
      button.textContent = 'Added to Cart!';
      setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
      }, 2000);
    } catch (error) {
      // Show toast error message
      showErrorToast(error.message, 'Add to Cart Failed');

      button.textContent = 'Error - Try Again';
      setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
      }, 3000);
    }
  }

  /**
   * Handle bundle add to cart - adds all individual products from bundle
   * Works for both legacy bundle products and matrix bundle products
   */
  async handleBundleAddToCart(e) {
    e.preventDefault();
    const button = e.target;
    const originalText = button.textContent;
    const cardIndex = parseInt(button.dataset.cardIndex, 10);

    try {
      // Update button state
      button.textContent = 'Adding to Cart...';
      button.disabled = true;

      // Get the specific card's product data (for matrix products)
      let productDataToUse;
      if (this.cardsData && this.cardsData[cardIndex] && this.cardsData[cardIndex].productData) {
        // Matrix product: use the specific card's product data
        productDataToUse = this.cardsData[cardIndex].productData;
      } else if (this.productData) {
        // Legacy bundle: use the main product data
        productDataToUse = this.productData;
      } else {
        throw new Error('Product data not available');
      }

      // Extract individual products from bundle options
      const productsToAdd = [];

      if (productDataToUse.options && Array.isArray(productDataToUse.options)) {
        productDataToUse.options.forEach((option) => {
          // Check for 'items' array (PDP structure)
          if (option.items && Array.isArray(option.items)) {
            option.items.forEach((item) => {
              if (item.product && item.product.sku) {
                productsToAdd.push({
                  sku: item.product.sku,
                  quantity: 1,
                });
              }
            });
          } else if (option.values && Array.isArray(option.values)) {
            // Check for 'values' array (API payload structure)
            option.values.forEach((value) => {
              if (value.product && value.product.sku) {
                productsToAdd.push({
                  sku: value.product.sku,
                  quantity: 1,
                });
              }
            });
          }
        });
      }

      if (productsToAdd.length === 0) {
        throw new Error('No products found in bundle');
      }

      // Add all products to cart
      const { addProductsToCart } = await import('@dropins/storefront-cart/api.js');

      // Track bundle parent for data layer (not individual items)
      setupAddToCartDataLayer(productDataToUse, 1, []);
      await trackAddToCartGA4(productDataToUse, 1);

      // Cache pdp_type for mini cart URL routing (bundle products)
      if (productDataToUse?.pdpType) {
        const pdpTypeCache = JSON.parse(sessionStorage.getItem('pdpTypeCache') || '{}');
        productsToAdd.forEach((item) => {
          pdpTypeCache[item.sku] = productDataToUse.pdpType;
        });
        sessionStorage.setItem('pdpTypeCache', JSON.stringify(pdpTypeCache));
      }

      await addProductsToCart(productsToAdd);

      // Scroll to cart icon after successful add-to-cart
      scrollToCartIcon();

      // Show success toast at top
      showSuccessToast('Bundle added to cart successfully!', 'Added to Cart');

      // Success feedback
      button.textContent = 'Added to Cart!';
      setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
      }, 2000);
    } catch (error) {
      // Show toast error message
      showErrorToast(error.message, 'Add to Cart Failed');

      button.textContent = 'Error - Try Again';
      setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
      }, 3000);
    }
  }

  /**
   * Get payment option display text
   */
  getPaymentOptionText() {
    // For bundle products with dynamic options, get text from current card data
    if (this.cardsData && this.cardsData.length > 0) {
      const currentCard = this.cardsData[0];
      const currentOption = currentCard.paymentOptions?.[this.globalPaymentOption];

      if (currentOption) {
        if (this.globalPaymentOption === 'full-payment') {
          return 'Pay in Full';
        }
        if (currentOption.instalmentNumber) {
          return `${currentOption.instalmentNumber} Monthly Payments`;
        }
      }
    }

    // Fallback to hardcoded options for non-bundle products
    const optionTexts = {
      '12-months': '12 Monthly Payments',
      '6-months': '6 Monthly Payments',
      'full-payment': 'Pay in Full',
      '4-months': '4 Monthly Payments',
      '17-months': '17 Monthly Payments',
    };
    return optionTexts[this.globalPaymentOption] || '12 Monthly Payments';
  }

  /**
   * Get payment term text for pricing display (e.g., "12 payments", "4 payments")
   */
  getPaymentTermText() {
    // Don't show payment term for full payment option
    if (this.globalPaymentOption === 'full-payment') {
      return '';
    }
    // For bundle products with dynamic options
    if (this.cardsData && this.cardsData.length > 0) {
      const currentCard = this.cardsData[0];
      const currentOption = currentCard.paymentOptions?.[this.globalPaymentOption];

      if (currentOption?.instalmentNumberDisplay) {
        return `${currentOption.instalmentNumberDisplay} payments`;
      }
    }

    // Extract number from payment option key (e.g., '12-months' -> '12')
    const match = this.globalPaymentOption.match(/^(\d+)-months?$/);
    if (match) {
      const numPayments = match[1];
      return `${numPayments} payments`;
    }

    // Default fallback
    return '12 payments';
  }

  /**
   * Get price period text (e.g., "/month", "one time payment")
   */
  getPricePeriodText() {
    if (this.globalPaymentOption === 'full-payment') {
      return 'one time payment';
    }
    return '/month';
  }

  /**
   * Determine if pricing details (strikeout price) should be shown
   */
  shouldShowPricingDetails(currentPricing) {
    // Show if there's an original price available in the data
    return currentPricing.originalPrice && currentPricing.originalPrice !== '';
  }

  /**
   * Determine if payment terms should be shown
   */
  shouldShowPaymentTerms() {
    // Don't show payment terms for full payment option
    if (this.globalPaymentOption === 'full-payment') {
      return false;
    }

    // For bundle products with dynamic options
    if (this.cardsData && this.cardsData.length > 0) {
      const currentCard = this.cardsData[0];
      const currentOption = currentCard.paymentOptions?.[this.globalPaymentOption];

      // Don't show payment terms if instalment_number_display is 1
      if (currentOption?.instalmentNumberDisplay === '1' || currentOption?.instalmentNumberDisplay === 1) {
        return false;
      }
    }

    return true;
  }

  /**
   * Parse child_description table HTML into structured features
   */
  parseChildDescription(childDescriptionHtml) {
    if (!childDescriptionHtml) return null;
    try {
      // Create a temporary DOM element to parse the HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = childDescriptionHtml;

      const table = tempDiv.querySelector('table');

      if (!table) {
        return null;
      }

      const rows = table.querySelectorAll('tbody tr');

      if (rows.length === 0) {
        return null;
      }

      // Process the first row specially - it contains the heading and main features
      const firstRow = rows[0];
      const firstRowCells = firstRow.querySelectorAll('td');

      let heading = '';
      const mainFeatures = [];

      if (firstRowCells.length >= 2) {
        // Original format: Two-column structure with heading and bullet lists
        // First column is the heading
        heading = firstRowCells[0].textContent.trim();
        // Second column contains the main bullet points
        const mainContentCell = firstRowCells[1];
        const lists = mainContentCell.querySelectorAll('ul, ol');

        lists.forEach((list) => {
          const items = list.querySelectorAll('li');
          items.forEach((item) => {
            const text = item.textContent.trim();
            if (text) {
              mainFeatures.push({
                type: 'basic',
                text,
              });
            }
          });
        });
      } else if (firstRowCells.length === 1) {
        // Alternative format: Single-column structure with features in each row
        // Return simple array format (not accordion format)

        const simpleFeatures = [];

        // Process all rows as features
        rows.forEach((row, rowIndex) => {
          const cells = row.querySelectorAll('td');
          if (cells.length > 0) {
            const text = cells[0].textContent.trim();
            if (text) {
              // First row is basic, all others are addons
              const type = rowIndex === 0 ? 'basic' : 'addon';

              simpleFeatures.push({
                type,
                text,
              });
            }
          }
        });

        // Return simple array instead of complex object structure
        return simpleFeatures;
      }

      // Process additional rows (for future use)
      const additionalRows = [];
      for (let i = 1; i < rows.length; i += 1) {
        const cells = rows[i].querySelectorAll('td');
        if (cells.length >= 2) {
          const title = cells[0].textContent.trim();
          const content = this.extractCellContent(cells[1]);
          if (title && content) {
            additionalRows.push({
              title,
              content,
            });
          }
        }
      }

      return {
        heading,
        mainFeatures,
        additionalRows, // For future use
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Extract and format content from a table cell
   */
  extractCellContent(cell) {
    const content = [];

    // Process different types of content in the cell
    const paragraphs = cell.querySelectorAll('p');
    const lists = cell.querySelectorAll('ul, ol');

    // Add paragraph content
    paragraphs.forEach((p) => {
      const text = p.textContent.trim();
      if (text && !text.startsWith('DESCRIPTION') && !text.startsWith('PREREQUISITES')
          && !text.startsWith('COURSE SECTIONS') && !text.startsWith('FINAL EXAM')) {
        content.push(text);
      }
    });

    // Add list content
    lists.forEach((list) => {
      const items = list.querySelectorAll('li');
      items.forEach((item) => {
        const text = item.textContent.trim();
        if (text) {
          content.push(`• ${text}`);
        }
      });
    });

    // If no structured content found, fall back to text content
    if (content.length === 0) {
      const text = cell.textContent.trim();
      if (text) {
        // Clean up the text and split by common separators
        const cleanText = text.replace(/\s+/g, ' ')
          .replace(/DESCRIPTION|PREREQUISITES|COURSE SECTIONS|FINAL EXAM/g, '')
          .trim();
        if (cleanText) {
          content.push(cleanText);
        }
      }
    }

    return content.join('\n');
  }

  /**
   * Get features from child_description field
   */
  getFeaturesFromChildDescription(productData) {
    // Look for child_description in attributes - handle different attribute structures
    let childDescriptionHtml = null;

    // First check if attributes have label instead of name
    if (productData?.attributes && productData.attributes.length > 0) {
      const childDescAttr = productData.attributes.find((attr) => attr.name === 'child_description'
        || attr.label === 'child_description'
        || attr.label === 'Child Description'
        || attr.code === 'child_description');
      if (childDescAttr) {
        childDescriptionHtml = childDescAttr.value;
      }
    }

    // Check for direct property
    if (!childDescriptionHtml) {
      childDescriptionHtml = productData?.child_description;
    }

    // For bundle/matrix products, check mapped_products if no child_description on parent
    if (!childDescriptionHtml && productData?.mapped_products
        && productData.mapped_products.length > 0) {
      // For now, just use the first mapped product's child_description if available
      const firstMappedProduct = productData.mapped_products[0];
      if (firstMappedProduct) {
        // Check attributes of mapped product
        const mappedChildDescAttr = firstMappedProduct.attributes?.find((attr) => attr.name === 'child_description'
          || attr.label === 'child_description'
          || attr.label === 'Child Description'
          || attr.code === 'child_description');
        if (mappedChildDescAttr) {
          childDescriptionHtml = mappedChildDescAttr.value;
        } else if (firstMappedProduct.child_description) {
          childDescriptionHtml = firstMappedProduct.child_description;
        }
      }
    }

    if (childDescriptionHtml) {
      const parsedData = this.parseChildDescription(childDescriptionHtml);

      // Handle both formats:
      // 1. Complex object with mainFeatures (accordion format)
      // 2. Simple array (list format)
      if (parsedData
          && ((parsedData.mainFeatures && parsedData.mainFeatures.length > 0)
           || (Array.isArray(parsedData) && parsedData.length > 0))) {
        // Return the parsed data
        return parsedData;
      }
    }

    return null; // Return null if no child_description found, so fallback can be used
  }

  /**
   * Check and update bundle data - shared logic for constructor and event handler
   */
  checkAndUpdateBundleData(productData) {
    // First check if this is a matrix product - if so, don't process as bundle
    const pdpTypeAttr = productData?.attributes?.find((attr) => attr.name === 'pdp_type');
    const isMatrix = productData?.pdpType === 'Matrix' || productData?.pdpType === 4 || productData?.pdpType === '4'
      || pdpTypeAttr?.value === '4' || pdpTypeAttr?.value === 4;

    if (isMatrix) {
      // Matrix products should wait for the matrix-products event
      // or be handled in updateWithProductData
      if (this.container) {
        this.container.style.display = 'none';
      }
      return false;
    }

    // Check if this is a bundle product with nasm_price data
    // Try multiple ways to detect bundle products:

    // 1. Check direct pdpType property
    const directPdpType = productData?.pdpType;

    // 2. Check in attributes array
    const attrPdpType = productData?.attributes?.find((attr) => attr.name === 'pdp_type' || attr.id === 'pdp_type')?.value;

    // 3. Check __typename
    // eslint-disable-next-line no-underscore-dangle
    const typename = productData?.__typename;

    // 4. Check isBundle property
    const isDirectBundle = productData?.isBundle;

    // 5. Check productType
    const productType = productData?.productType;

    const nasmPrices = productData?.nasm_price;

    // Determine if this is a bundle product
    const isBundle = directPdpType === 'Bundle'
      || directPdpType === '3'
      || directPdpType === 3
      || attrPdpType === 'Bundle'
      || attrPdpType === '3'
      || attrPdpType === 3
      || typename === 'ComplexProductView'
      || isDirectBundle === true
      || productType === 'complex';

    if (isBundle && nasmPrices && Array.isArray(nasmPrices)) {
      this.updateWithBundlePrice(nasmPrices, productData);
      return true;
    }
    if (isBundle) {
      // For now, we'll create a simple single-option pricing card for bundles without nasm_price
      this.updateWithSimpleBundlePrice(productData);
      return true;
    }

    // Determine if this is a single complex product
    const isSingleComplex = directPdpType === '2' || directPdpType === 2
      || attrPdpType === '2' || attrPdpType === 2;

    if (isSingleComplex && nasmPrices && Array.isArray(nasmPrices)) {
      this.updateWithSingleComplexPrice(nasmPrices, productData);
      return true;
    }
    if (isSingleComplex) {
      this.updateWithSimpleSingleComplexPrice(productData);
      return true;
    }

    return false;
  }

  /**
   * Update pricing cards with actual product data
   */
  updateWithProductData(productData) {
    this.productData = productData;

    // Check if this is a matrix product
    const pdpTypeAttr = productData?.attributes?.find((attr) => attr.name === 'pdp_type');
    const isMatrix = productData?.pdpType === 'Matrix' || productData?.pdpType === 4 || productData?.pdpType === '4'
      || pdpTypeAttr?.value === '4' || pdpTypeAttr?.value === 4;

    if (isMatrix) {
      // For matrix products, check if we have mapped_products directly on the productData
      if (productData?.mapped_products && Array.isArray(productData.mapped_products)
          && productData.mapped_products.length > 0) {
        // Process the matrix products immediately
        this.updateWithMatrixProducts({
          originalProduct: productData,
          mappedProducts: productData.mapped_products,
        });
        return;
      }
      // Matrix product without proper mapped_products array
      // Keep hidden and wait for matrix-products event
      if (this.container) {
        this.container.style.display = 'none';
      }
      return;
    }

    // Show the container since we have valid non-matrix product data
    if (this.container) {
      this.container.style.display = '';
    }

    // Update header title with product name
    const headerTitle = this.container.querySelector('.pricing-swiper__title');
    if (headerTitle && (productData?.marketing_product_name || productData?.name)) {
      const displayName = productData.marketing_product_name || productData.name;
      headerTitle.textContent = `CHOOSE YOUR PLAN FOR ${displayName.toUpperCase()}`;
    }

    // Use shared logic to check and update bundle data
    this.checkAndUpdateBundleData(productData);
  }

  /**
   * Update pricing cards for bundle products using nasm_price data
   */
  updateWithBundlePrice(nasmPrices, productData) {
    // Show the container since we have valid bundle data
    this.container.style.display = '';

    // For bundle products, show only one pricing card with multiple payment options
    const bundleCard = {
      eyebrow: productData?.eyebrowSuggestLabel || 'Bundle Offer',
      title: productData?.marketing_product_name || productData?.name || 'COMPLETE BUNDLE',
      monthlyPrice: 0, // Will be updated based on selected option
      downPayment: 0, // Will be updated based on selected option
      originalPrice: 0, // Will be updated based on selected option
      badge: null, // No badge for bundle type since there's only one card
      promotionLabel: productData?.promotionLabel || '', // Use promotion_label from API
      features: this.getFeaturesFromChildDescription(productData)
        || this.getBundleFeaturesFromOptions(productData?.options || []),
      isBundle: true, // Mark as bundle product for cart handling
      productData, // Store product data for cart operations
      paymentOptions: {},
    };

    // Convert nasm_price data to payment options
    nasmPrices.forEach((priceOption) => {
      const instalmentNumber = priceOption.instalment_number;
      let optionKey;

      // Map instalment numbers to option keys
      if (instalmentNumber === '1') {
        optionKey = 'full-payment';
      } else if (instalmentNumber === '12') {
        optionKey = '12-months';
      } else if (instalmentNumber === '6') {
        optionKey = '6-months';
      } else if (instalmentNumber === '4') {
        optionKey = '4-months';
      } else if (instalmentNumber === '17') {
        optionKey = '17-months';
      } else {
        // Create dynamic option key for other instalments
        optionKey = `${instalmentNumber}-months`;
      }

      bundleCard.paymentOptions[optionKey] = {
        price: parseFloat(priceOption.monthly_price),
        originalPrice: parseFloat(priceOption.strike_out_monthly_price),
        downPayment: parseFloat(priceOption.down_payment || 0),
        instalmentNumber,
        instalmentNumberDisplay: priceOption.instalment_number_display,
        instalmentType: priceOption.instalment_type,
      };
    });

    // Set default pricing to 12-months if available, otherwise first option
    const defaultOption = bundleCard.paymentOptions['12-months'] || Object.values(bundleCard.paymentOptions)[0];
    if (defaultOption) {
      bundleCard.monthlyPrice = defaultOption.price;
      bundleCard.downPayment = defaultOption.downPayment;
      bundleCard.originalPrice = defaultOption.originalPrice;
    }

    this.cardsData = [bundleCard];

    // Update global payment option to available option
    const availableOptions = Object.keys(bundleCard.paymentOptions);
    if (availableOptions.includes('12-months')) {
      this.globalPaymentOption = '12-months';
    } else if (availableOptions.length > 0) {
      [this.globalPaymentOption] = availableOptions;
    }

    // Re-render the cards
    this.renderCards();

    // Destroy and reinitialize swiper with new configuration for single card
    if (this.swiper) {
      this.swiper.destroy(true, true);
    }
    this.initializeSwiper();
  }

  /**
   * Generate features from bundle options
   */
  getBundleFeaturesFromOptions(options) {
    const features = [];

    // Add features based on included products
    if (options && options.length > 0) {
      options.forEach((option) => {
        // Check for 'items' array (PDP structure)
        if (option.items && Array.isArray(option.items)) {
          option.items.forEach((item) => {
            if (item.product && item.product.name) {
              features.push({
                type: 'basic',
                text: item.product.name,
              });
            } else if (item.label) {
              features.push({
                type: 'basic',
                text: item.label,
              });
            }
          });
        } else if (option.values && Array.isArray(option.values)) {
          // Check for 'values' array (API payload structure)
          option.values.forEach((value) => {
            if (value.product && value.product.name) {
              features.push({
                type: 'basic',
                text: value.product.name,
              });
            } else if (value.label) {
              features.push({
                type: 'basic',
                text: value.label,
              });
            }
          });
        }
      });
    }

    // Add general bundle benefits if we have products
    /* if (features.length > 0) {
      features.push(
        { type: 'addon', text: 'Save money with bundle pricing' },
        { type: 'addon', text: 'All courses accessible immediately' },
        { type: 'addon', text: 'Comprehensive certification path' },
      );
    } else {
      // Fallback if no products found
      features.push(
        { type: 'basic', text: 'Complete Bundle Package' },
        { type: 'addon', text: 'Save money with bundle pricing' },
        { type: 'addon', text: 'All courses accessible immediately' },
        { type: 'addon', text: 'Comprehensive certification path' },
      );
    } */

    return features;
  }

  /**
   * Update pricing cards for bundle products without nasm_price data
   * Creates a simple single card with basic pricing from the product data
   */
  updateWithSimpleBundlePrice(productData) {
    // Show the container since we have valid bundle data
    this.container.style.display = '';

    // Extract basic pricing info from the product
    const minPrice = productData?.prices?.final?.minimumAmount || 149;
    const maxPrice = productData?.prices?.final?.maximumAmount || 2547;

    // Create a simple bundle card with basic payment options
    const bundleCard = {
      eyebrow: productData?.eyebrowSuggestLabel || 'Bundle Offer',
      title: productData?.marketing_product_name || productData?.name || 'COMPLETE BUNDLE',
      monthlyPrice: Math.round(minPrice), // Use minimum price as monthly
      downPayment: 49, // Default down payment
      originalPrice: Math.round(maxPrice), // Use maximum as original price
      badge: 'Best Value',
      promotionLabel: productData?.promotionLabel || '', // Use promotion_label from API
      features: this.getFeaturesFromChildDescription(productData)
        || this.getBundleFeaturesFromOptions(productData?.options || []),
      isBundle: true, // Mark as bundle product for cart handling
      productData, // Store product data for cart operations
      paymentOptions: {
        'full-payment': {
          price: maxPrice,
          originalPrice: maxPrice,
          downPayment: 0,
          instalmentNumber: '1',
          instalmentType: 'full',
        },
        '12-months': {
          price: Math.round(minPrice),
          originalPrice: maxPrice,
          downPayment: 49,
          instalmentNumber: '12',
          instalmentType: 'fixed',
        },
      },
    };

    // Set default pricing to 12-months
    this.globalPaymentOption = '12-months';

    // Replace cards with single bundle card
    this.cardsData = [bundleCard];

    // Re-render the cards
    this.renderCards();

    // Destroy and reinitialize swiper with new configuration for single card
    if (this.swiper) {
      this.swiper.destroy(true, true);
    }
    this.initializeSwiper();
  }

  /**
   * Update pricing cards for single complex products with nasm_price data
   * Creates a single card with pricing options from nasm_price
   */
  updateWithSingleComplexPrice(nasmPrices, productData) {
    // Show the container since we have valid single complex data
    this.container.style.display = '';

    // Update header title with product name
    const headerTitle = this.container.querySelector('.pricing-swiper__title');
    if (headerTitle && (productData?.marketing_product_name || productData?.name)) {
      const displayName = productData.marketing_product_name || productData.name;
      headerTitle.textContent = `CHOOSE YOUR PLAN FOR ${displayName.toUpperCase()}`;
    }

    // Create single complex card structure
    const singleComplexCard = {
      eyebrow: productData?.eyebrowSuggestLabel || '',
      title: productData?.marketing_product_name || productData?.name || 'SINGLE COMPLEX PRODUCT',
      monthlyPrice: 0, // Will be updated based on selected option
      downPayment: 0, // Will be updated based on selected option
      originalPrice: 0, // Will be updated based on selected option
      badge: null, // No badge for single complex since there's only one card
      promotionLabel: productData?.promotionLabel || '', // Use promotion_label from API
      features: this.getSingleComplexFeatures(productData),
      paymentOptions: {},
      productSku: productData?.sku || '', // Store SKU for simple cart functionality
      isBundle: false, // Single complex products use simple add-to-cart
      isSingleComplex: true, // Flag to identify single complex products for button text
    };

    // Convert nasm_price data to payment options
    nasmPrices.forEach((priceOption) => {
      const instalmentNumber = priceOption.instalment_number;
      let optionKey;

      // Map instalment numbers to option keys
      if (instalmentNumber === '1') {
        optionKey = 'full-payment';
      } else if (instalmentNumber === '12') {
        optionKey = '12-months';
      } else if (instalmentNumber === '6') {
        optionKey = '6-months';
      } else if (instalmentNumber === '4') {
        optionKey = '4-months';
      } else if (instalmentNumber === '17') {
        optionKey = '17-months';
      } else {
        // Create dynamic option key for other instalments
        optionKey = `${instalmentNumber}-months`;
      }

      singleComplexCard.paymentOptions[optionKey] = {
        price: parseFloat(priceOption.monthly_price),
        originalPrice: parseFloat(priceOption.strike_out_monthly_price),
        downPayment: parseFloat(priceOption.down_payment || 0),
        instalmentNumber,
        instalmentNumberDisplay: priceOption.instalment_number_display,
        instalmentType: priceOption.instalment_type,
      };
    });

    // Set default pricing to 12-months if available, otherwise first option
    const defaultOption = singleComplexCard.paymentOptions['12-months'] || Object.values(singleComplexCard.paymentOptions)[0];
    if (defaultOption) {
      singleComplexCard.monthlyPrice = defaultOption.price;
      singleComplexCard.originalPrice = defaultOption.originalPrice;
      singleComplexCard.downPayment = defaultOption.downPayment;
      this.globalPaymentOption = singleComplexCard.paymentOptions['12-months'] ? '12-months' : Object.keys(singleComplexCard.paymentOptions)[0];
    }

    // Replace cards with single complex card
    this.cardsData = [singleComplexCard];

    // Re-render the cards
    this.renderCards();

    // Destroy and reinitialize swiper with new configuration for single card
    if (this.swiper) {
      this.swiper.destroy(true, true);
    }
    this.initializeSwiper();
  }

  /**
   * Update pricing cards for single complex products without nasm_price data
   * Creates a simple single card with basic pricing from the product data
   */
  updateWithSimpleSingleComplexPrice(productData) {
    // Show the container since we have valid single complex data
    this.container.style.display = '';

    // Extract basic pricing info from the product
    const finalPrice = productData?.prices?.final?.amount;

    // Create a simple single complex card with basic payment options
    const singleComplexCard = {
      eyebrow: productData?.eyebrowSuggestLabel || 'Single Complex',
      title: productData?.marketing_product_name || productData?.name || 'COMPLEX PRODUCT',
      monthlyPrice: Math.round(finalPrice / 12), // Approximate monthly price
      downPayment: 49, // Default down payment
      originalPrice: finalPrice,
      badge: null,
      promotionLabel: productData?.promotionLabel || '', // Use promotion_label from API
      features: this.getSingleComplexFeatures(productData),
      paymentOptions: {
        'full-payment': {
          price: finalPrice,
          originalPrice: finalPrice,
          downPayment: 0,
          instalmentNumber: '1',
          instalmentType: 'full',
        },
        '12-months': {
          price: Math.round(finalPrice / 12),
          originalPrice: finalPrice,
          downPayment: 49,
          instalmentNumber: '12',
          instalmentType: 'fixed',
        },
      },
      productSku: productData?.sku || '', // Store SKU for simple cart functionality
      isBundle: false, // Single complex products use simple add-to-cart
      isSingleComplex: true, // Flag to identify single complex products for button text
    };

    // Set default pricing to 12-months
    this.globalPaymentOption = '12-months';

    // Replace cards with single complex card
    this.cardsData = [singleComplexCard];

    // Re-render the cards
    this.renderCards();

    // Destroy and reinitialize swiper with new configuration for single card
    if (this.swiper) {
      this.swiper.destroy(true, true);
    }
    this.initializeSwiper();
  }

  /**
   * Generate features for single complex products based on product data
   */
  getSingleComplexFeatures(productData) {
    // First try to get features from child_description
    const childDescriptionFeatures = this.getFeaturesFromChildDescription(productData);
    if (childDescriptionFeatures) {
      return childDescriptionFeatures;
    }

    // Fallback to default features for single complex products
    const features = [];

    // Add basic product info as features
    if (productData?.shortDescription) {
      features.push({
        type: 'basic',
        text: productData.shortDescription,
      });
    }

    // Add some default features for single complex products
    features.push(
      { type: 'basic', text: 'Comprehensive single product solution' },
      { type: 'basic', text: 'Professional certification path' },
      { type: 'addon', text: 'Flexible payment options available' },
    );

    return features;
  }

  /**
   * Update pricing cards for matrix products using mapped products data
   * Creates multiple cards, one for each mapped product
   */
  updateWithMatrixProducts(matrixData) {
    const { originalProduct, mappedProducts } = matrixData;

    if (!mappedProducts || !Array.isArray(mappedProducts) || mappedProducts.length === 0) {
      // No mapped products for matrix type - hide the entire payment plans block
      if (this.container) {
        this.container.style.display = 'none';
      }
      return;
    }

    // Ensure the block is visible (in case it was previously hidden)
    if (this.container) {
      this.container.style.display = '';
    }

    // Create cards for each mapped product
    const matrixCards = [];

    mappedProducts.forEach((product, index) => {
      // Extract product name and details
      const productName = product.marketing_product_name || product.name || `Product ${index + 1}`;
      const productSku = product.sku || '';

      // Get pricing data from nasm_price if available
      const nasmPrices = product.nasm_price || [];

      let paymentOptions = {};
      let defaultPrice = 0;
      let defaultOriginalPrice = 0;
      let defaultDownPayment = 0;

      if (nasmPrices && nasmPrices.length > 0) {
        // Convert nasm_price data to payment options (similar to bundle logic)
        nasmPrices.forEach((priceOption) => {
          const instalmentNumber = priceOption.instalment_number;
          let optionKey;

          // Map instalment numbers to option keys
          if (instalmentNumber === '1') {
            optionKey = 'full-payment';
          } else if (instalmentNumber === '12') {
            optionKey = '12-months';
          } else if (instalmentNumber === '6') {
            optionKey = '6-months';
          } else if (instalmentNumber === '4') {
            optionKey = '4-months';
          } else if (instalmentNumber === '17') {
            optionKey = '17-months';
          } else {
            // Create dynamic option key for other instalments
            optionKey = `${instalmentNumber}-months`;
          }

          paymentOptions[optionKey] = {
            price: parseFloat(priceOption.monthly_price),
            originalPrice: parseFloat(priceOption.strike_out_monthly_price),
            downPayment: parseFloat(priceOption.down_payment || 0),
            instalmentNumber,
            instalmentNumberDisplay: priceOption.instalment_number_display,
            instalmentType: priceOption.instalment_type,
          };
        });

        // Set default pricing to 12-months if available, otherwise first option
        const defaultOption = paymentOptions['12-months'] || Object.values(paymentOptions)[0];
        if (defaultOption) {
          defaultPrice = defaultOption.price;
          defaultOriginalPrice = defaultOption.originalPrice;
          defaultDownPayment = defaultOption.downPayment;
        }
      } else {
        // Fallback pricing if no nasm_price data
        const fallbackPrice = product.price?.final?.amount?.value || 299;
        defaultPrice = Math.round(fallbackPrice / 12); // Approximate monthly price
        defaultOriginalPrice = fallbackPrice;
        defaultDownPayment = 49;

        paymentOptions = {
          'full-payment': {
            price: fallbackPrice,
            originalPrice: fallbackPrice,
            downPayment: 0,
            instalmentNumber: '1',
            instalmentNumberDisplay: '1',
            instalmentType: 'full',
          },
          '12-months': {
            price: Math.round(fallbackPrice / 12),
            originalPrice: fallbackPrice,
            downPayment: 49,
            instalmentNumber: '12',
            instalmentNumberDisplay: '12',
            instalmentType: 'fixed',
          },
        };
      }

      // Get eyebrow label from product attributes
      const eyebrowLabel = product.attributes?.find((attr) => attr.name === 'eyebrow_suggest_label')?.value || 'Matrix Product';

      // Use consistent pdp_type mapping like in product-details
      const rawPdpType = product.attributes?.find((attr) => attr.name === 'pdp_type')?.value;

      // Map numeric pdp_type values to string values (consistent with product-details logic)
      let mappedPdpType;
      if (rawPdpType === '3' || rawPdpType === 3) {
        mappedPdpType = 'Bundle';
      } else if (rawPdpType === '4' || rawPdpType === 4) {
        mappedPdpType = 'Matrix';
      } else if (typeof rawPdpType === 'string') {
        mappedPdpType = rawPdpType; // Already a string like 'Bundle'
      } else {
        mappedPdpType = null;
      }

      // Detect bundle using consistent logic
      const isProductBundle = mappedPdpType === 'Bundle' || (product.options && product.options.length > 0);

      // Get promotion label from product attributes
      const promotionLabel = product.attributes?.find((attr) => attr.name === 'promotion_label')?.value || '';

      // Create card for this product
      const matrixCard = {
        eyebrow: eyebrowLabel,
        title: productName.toUpperCase(),
        monthlyPrice: defaultPrice,
        downPayment: defaultDownPayment,
        originalPrice: defaultOriginalPrice,
        badge: index === 1 ? 'Most Popular' : null, // Make middle product popular if 3 products
        promotionLabel, // Use promotion_label from API
        features: this.getMatrixProductFeatures(product),
        paymentOptions,
        productSku, // Store SKU for cart functionality
        productData: product, // Store full product data for cart functionality
        isBundle: isProductBundle, // Flag to determine cart behavior
        pdpType: mappedPdpType, // Store pdp_type for debugging
      };

      matrixCards.push(matrixCard);
    });

    // Update header title with original product name
    const headerTitle = this.container.querySelector('.pricing-swiper__title');
    if (headerTitle && (originalProduct?.marketing_product_name || originalProduct?.name)) {
      const displayName = originalProduct.marketing_product_name || originalProduct.name;
      headerTitle.textContent = `CHOOSE YOUR PLAN FOR ${displayName.toUpperCase()}`;
    }

    // Set default pricing to 12-months if available, otherwise first option
    const availableOptions = matrixCards[0] ? Object.keys(matrixCards[0].paymentOptions) : [];
    if (availableOptions.includes('12-months')) {
      this.globalPaymentOption = '12-months';
    } else if (availableOptions.length > 0) {
      [this.globalPaymentOption] = availableOptions;
    }

    // Replace cards with matrix cards
    this.cardsData = matrixCards;

    // Re-render the cards
    this.renderCards();

    // Destroy and reinitialize swiper with new configuration for multiple cards
    if (this.swiper) {
      this.swiper.destroy(true, true);
    }
    this.initializeSwiper();
  }

  /**
   * Update pricing layout for subscription products using variants data
   * Added New subscription layout with radio buttons for annual/monthly
   */
  updateWithSubscriptionVariants(subscriptionData) {
    const { originalProduct, variants } = subscriptionData;

    if (!variants || !Array.isArray(variants) || variants.length === 0) {
      // Keep the container hidden if no variants
      return;
    }

    // Show the container since we have valid subscription data
    this.container.style.display = '';

    // Create subscription layout
    this.renderSubscriptionLayout(originalProduct, variants);
  }

  /**
   * Render subscription-specific layout with membership details and term selection
   */
  renderSubscriptionLayout(originalProduct, variants) {
    // Clear existing content
    this.container.innerHTML = '';

    // Create subscription container with special styling
    const subscriptionContainer = document.createElement('div');
    subscriptionContainer.className = 'subscription-plans__container';

    // Add eyebrow and title
    const eyebrow = originalProduct?.eyebrowSuggestLabel || 'Annual Membership';
    const title = originalProduct?.marketing_product_name || originalProduct?.name || 'SUBSCRIPTION';

    // Get features from child_description
    const features = this.getFeaturesFromChildDescription(originalProduct);
    const membershipDetailsHTML = this.generateSubscriptionFeaturesHTML(features);

    subscriptionContainer.innerHTML = `
      <div class="subscription-plans__header">
        <p class="subscription-plans__eyebrow">${eyebrow}</p>
        <h2 class="subscription-plans__title">${title.toUpperCase()}</h2>
      </div>
      
      <div class="subscription-plans__content">
        <div class="subscription-plans__details">
          <h3 class="subscription-plans__details-title">MEMBERSHIP DETAILS:</h3>
          <ul class="subscription-plans__details-list">
            ${membershipDetailsHTML}
          </ul>
        </div>
        
        <div class="subscription-plans__terms">
          <h3 class="subscription-plans__terms-title">CHOOSE YOUR TERM LENGTH:</h3>
          <div class="subscription-plans__options">
            ${this.generateSubscriptionOptions(variants)}
          </div>
          <button class="subscription-plans__join-btn" type="button">Join Now</button>
        </div>
      </div>
    `;

    this.container.appendChild(subscriptionContainer);

    // Add event listeners for radio buttons and join button
    this.addSubscriptionEventListeners();
  }

  /**
   * Generate HTML for subscription membership details from child_description features
   */
  generateSubscriptionFeaturesHTML(features) {
    if (!features) {
      // Fallback to default content if no child_description
      return `
        <li>Premium membership benefits</li>
        <li>Access to exclusive content and resources</li>
        <li>Continuous updates and new features</li>
      `;
    }

    // Handle both complex object format and simple array format
    let featuresList = [];

    if (features.mainFeatures && Array.isArray(features.mainFeatures)) {
      // Complex object format (accordion style)
      featuresList = features.mainFeatures;
    } else if (Array.isArray(features)) {
      // Simple array format
      featuresList = features;
    }

    if (featuresList.length === 0) {
      // Fallback if no features found
      return `
        <li>Premium membership benefits</li>
        <li>Access to exclusive content and resources</li>
        <li>Continuous updates and new features</li>
      `;
    }

    // Convert features to simple list items
    return featuresList.map((feature) => `<li>${feature.text}</li>`).join('');
  }

  /**
   * Generate subscription options (radio buttons) from variants
   */
  generateSubscriptionOptions(variants) {
    let selectedVariant = null;

    // Check variant structure only if there might be configuration issues
    if (variants.length > 4 || variants.some((v) => !v.product?.sku)) {
      // Unusual subscription variant configuration detected
    }

    return variants.map((variant, index) => {
      const { product } = variant;
      const price = product.price?.final?.amount?.value || 0;
      const name = product.marketing_product_name || product.name || '';
      const sku = product.sku || '';

      // Extract configurable option UID from the variant data
      // This is critical for adding parent configurable product correctly
      let optionUID = '';

      // Extract renewal_period and promotional_price from product attributes
      const renewalPeriodAttr = product?.attributes?.find((attr) => attr.name === 'renewal_period');
      const renewalPeriod = renewalPeriodAttr?.value || '';
      const promotionalPriceAttr = product?.attributes?.find((attr) => attr.name === 'promotional_price');
      const promotionalPrice = promotionalPriceAttr?.value || '';
      const isAnnual = renewalPeriod.toLowerCase() === 'annual' || name.toLowerCase().includes('yearly') || name.toLowerCase().includes('annual');
      const isMonthly = renewalPeriod.toLowerCase() === 'monthly' || name.toLowerCase().includes('monthly');

      // Method 1: Try to get option UID from original product's configurable options
      if (this.productData?.options) {
        this.productData.options.forEach((option) => {
          if (option.values) {
            option.values.forEach((value) => {
              if (value.product && value.product.sku === sku) {
                optionUID = value.uid || value.id || '';
              }
            });
          }
        });
      }

      // Method 2: Try variant-specific option UID properties
      if (!optionUID) {
        optionUID = variant.optionUID
          || variant.option_uid
          || variant.configurable_product_option_value_uid
          || '';
      }

      // Method 3: Try to extract from variant product's options data
      if (!optionUID && product.optionsUIDs && Array.isArray(product.optionsUIDs)) {
        optionUID = product.optionsUIDs[0] || '';
      }

      // Method 4: Try to match by URL key or other identifiers
      if (!optionUID && this.productData?.options) {
        this.productData.options.forEach((option) => {
          if (option.values) {
            option.values.forEach((value) => {
              if ((value.product && value.product.urlKey === product.urlKey)
                  || (value.label && value.label.toLowerCase().includes(name.toLowerCase()))) {
                optionUID = value.uid || value.id || '';
              }
            });
          }
        });
      }

      // Method 5: Try to get option UID from subscription options with RENEWAL_PERIOD mapping
      if (!optionUID && this.productData?.options?.[0]?.items) {
        const firstOption = this.productData.options[0];

        // Get renewal period from product attributes (provided by commerce team)
        const variantRenewalPeriod = renewalPeriod;

        // RENEWAL_PERIOD APPROACH: Match based on definitive renewal_period field
        let bestMatch = null;
        let bestMatchScore = 0;

        firstOption.items.forEach((item) => {
          const itemLabel = (item.label || '').toLowerCase();
          let matchScore = 0;

          // Primary matching: Use renewal_period if available
          if (variantRenewalPeriod) {
            const renewalPeriodLower = variantRenewalPeriod.toLowerCase();

            // Perfect match for renewal period (only Monthly and Annual supported)
            if ((renewalPeriodLower === 'annual' && (itemLabel.includes('annual') || itemLabel.includes('yearly')))
                || (renewalPeriodLower === 'monthly' && itemLabel.includes('monthly'))) {
              matchScore += 20; // High score for renewal period match
            }
          }
          // Fallback: Legacy semantic matching if renewal_period not available
          if (!variantRenewalPeriod) {
            const variantName = name.toLowerCase();
            const monthlyTerms = ['monthly', 'month', '/month'];
            const yearlyTerms = ['yearly', 'annual', 'year', '/year'];

            // Count matching terms between item label and variant name (only Monthly and Annual)
            [...monthlyTerms, ...yearlyTerms].forEach((term) => {
              if (itemLabel.includes(term) && variantName.includes(term)) {
                matchScore += 10; // Lower score than renewal_period match
              }
            });

            // Additional scoring based on price patterns
            if (price > 200 && (itemLabel.includes('annual') || itemLabel.includes('yearly'))) {
              matchScore += 5;
            } else if (price < 100 && (itemLabel.includes('monthly') || itemLabel.includes('week'))) {
              matchScore += 5;
            }
          }

          // Store the best match
          if (matchScore > bestMatchScore) {
            bestMatch = item;
            bestMatchScore = matchScore;
          }
        });

        // If no good match found, fall back to index-based
        if (!bestMatch || bestMatchScore === 0) {
          if (firstOption.items[index]) {
            bestMatch = firstOption.items[index];
            bestMatchScore = -1; // Indicate fallback
          }
        }

        if (bestMatch) {
          optionUID = bestMatch.id || bestMatch.value || '';
        }
      }

      // Method 6: DISABLED - URL parameters are unreliable for subscription products

      // Method 7: DISABLED - Pre-configured optionsUIDs use index matching which is unreliable

      // Method 8: Try to construct option UID from known patterns
      if (!optionUID && variant.configurableOptions) {
        const configurableOption = variant.configurableOptions?.[0];
        if (configurableOption) {
          optionUID = configurableOption.configurable_product_option_value_uid
            || configurableOption.option_value_uid
            || configurableOption.uid || '';
        }
      }

      // Method 9: Careful index-based fallback - only use if we can validate the SKU matches
      if (!optionUID && this.productData?.options?.[0]?.values) {
        const firstOption = this.productData.options[0];
        if (firstOption.values[index]) {
          const indexValue = firstOption.values[index];
          if (indexValue.product?.sku === sku) {
            optionUID = indexValue.uid || indexValue.id || '';
          }
        }
      }

      // Check if no option UID found
      if (!optionUID) {
        // No option UID found for subscription variant - this may cause cart issues
      }

      // Period detection already done above - use existing variables

      // Set first variant as selected by default, prefer annual if available
      const isSelected = index === 0 || (isAnnual && !selectedVariant);
      if (isSelected) selectedVariant = variant;

      // Calculate display values based on renewal_period
      const displayPrice = `$${price}`;
      let period = '';
      let description = '';
      let badge = '';
      let originalPrice = '';

      // Use definitive renewal_period for display logic (only Monthly and Annual supported)
      const renewalLower = renewalPeriod.toLowerCase();
      if (renewalLower === 'annual' || isAnnual) {
        period = '/year';
        description = 'Auto-renewal';
        badge = '2 Months Free';
        // Use promotional_price from API if available
        if (promotionalPrice && parseFloat(promotionalPrice) > 0) {
          originalPrice = `$${parseFloat(promotionalPrice).toFixed(0)}`;
        }
      } else if (renewalLower === 'monthly' || isMonthly) {
        period = '/month';
        description = 'Auto-renewal, 12-month commitment';
        // Use promotional_price from API if available
        if (promotionalPrice && parseFloat(promotionalPrice) > 0) {
          originalPrice = `$${parseFloat(promotionalPrice).toFixed(0)}`;
        }
      } else {
        // No renewal_period found - fallback to name-based logic
        if (isAnnual) {
          period = '/year';
        } else if (isMonthly) {
          period = '/month';
        } else {
          period = '';
        }
        description = 'Auto-renewal';
      }

      return `
        <div class="subscription-option ${isSelected ? 'subscription-option--selected' : ''}" data-sku="${sku}">
          <input 
            type="radio" 
            id="subscription-${index}" 
            name="subscription-term" 
            value="${sku}"
            data-option-uid="${optionUID}"
            ${isSelected ? 'checked' : ''}
            class="subscription-option__radio"
          >
          <label for="subscription-${index}" class="subscription-option__label">
            <div class="subscription-option__pricing">
              <div class="subscription-option__price-row">
                <span class="subscription-option__price">${displayPrice}</span>
                <span class="subscription-option__period">${period}</span>
                ${originalPrice ? `<span class="subscription-option__original-price">${originalPrice}</span>` : ''}
              </div>
              <div class="subscription-option__description">${description}</div>
              ${badge ? `<div class="subscription-option__badge">${badge}</div>` : ''}
            </div>
          </label>
        </div>
      `;
    }).join('');
  }

  /**
   * Add event listeners for subscription interactions
   */
  addSubscriptionEventListeners() {
    const { container } = this;

    // Handle radio button changes
    container.addEventListener('change', (e) => {
      if (e.target.matches('input[name="subscription-term"]')) {
        // Update selected state
        container.querySelectorAll('.subscription-option').forEach((option) => {
          option.classList.remove('subscription-option--selected');
        });

        const selectedOption = e.target.closest('.subscription-option');
        selectedOption.classList.add('subscription-option--selected');
      }
    });

    // Handle Join Now button
    container.addEventListener('click', async (e) => {
      if (e.target.matches('.subscription-plans__join-btn')) {
        await this.handleSubscriptionJoin(e);
      }
    });
  }

  /**
   * Handle subscription join (add to cart)
   */
  async handleSubscriptionJoin(e) {
    e.preventDefault();
    const button = e.target;
    const { textContent: originalText } = button;

    try {
      // Update button state
      button.textContent = 'Adding to Cart...';
      button.disabled = true;

      // Get selected variant
      const selectedRadio = this.container.querySelector('input[name="subscription-term"]:checked');
      if (!selectedRadio) {
        throw new Error('No subscription term selected');
      }

      const selectedSku = selectedRadio.value;
      const optionUID = selectedRadio.dataset.optionUid;

      // Check essential cart data only if there might be an issue
      if (!selectedSku || !optionUID) {
        // Missing essential subscription cart data
      }

      // Get the original product data
      const originalProduct = this.productData;

      // Validation: Check for missing option UID (critical for cart functionality)
      if (!optionUID) {
        // Missing option UID for selected subscription variant
      }

      // Validation: Check that the selected variant matches what we expect
      const expectedVariant = this.productData?.options?.[0]?.values?.find((v) => (
        v.product?.sku === selectedSku
      ));
      if (expectedVariant && expectedVariant.uid !== optionUID) {
        // MISMATCH: Radio button option UID does not match expected variant UID
      }

      // Import cart API
      const { addProductsToCart } = await import('@dropins/storefront-cart/api.js');

      // Track subscription product for data layer
      if (originalProduct) {
        setupAddToCartDataLayer(originalProduct, 1, []);
        await trackAddToCartGA4(originalProduct, 1);
      }

      // ALWAYS use parent configurable product approach for subscription products
      // This matches how the standard PDP block handles configurable products

      let cartPayload = null;

      // Try to use PDP API if available (like standard PDP block)
      if (window.pdpApi && typeof window.pdpApi.getProductConfigurationValues === 'function') {
        try {
          const pdpValues = window.pdpApi.getProductConfigurationValues();
          if (pdpValues && pdpValues.sku && pdpValues.optionsUIDs) {
            cartPayload = { ...pdpValues };
          }
        } catch (pdpError) {
          // PDP API failed
        }
      }

      // Manual configuration if PDP API not available or failed
      if (!cartPayload) {
        if (originalProduct?.sku && optionUID) {
          cartPayload = {
            sku: originalProduct.sku, // Parent configurable product SKU (NOT variant SKU)
            quantity: 1,
            optionsUIDs: [optionUID], // Selected subscription variant option
          };
        } else if (originalProduct?.sku) {
          cartPayload = {
            sku: originalProduct.sku,
            quantity: 1,
          };
          // Adding subscription without option UID - may not work correctly
        } else {
          cartPayload = {
            sku: selectedSku,
            quantity: 1,
          };
          // Falling back to variant SKU - may cause cart issues
        }
      }

      // Add to cart with the determined payload
      await addProductsToCart([cartPayload]);

      // Scroll to cart icon after successful add-to-cart
      scrollToCartIcon();

      // Show success toast at top
      showSuccessToast('Subscription added to cart successfully!', 'Added to Cart');

      // Success feedback
      button.textContent = 'Added to Cart!';
      setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
      }, 2000);
    } catch (error) {
      // Show toast error message
      showErrorToast(error.message, 'Add to Cart Failed');

      button.textContent = 'Try Again';
      setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
      }, 3000);
    }
  }

  /**
   * Generate features for matrix products based on product data
   */
  getMatrixProductFeatures(product) {
    // First try to get features from child_description
    const childDescriptionFeatures = this.getFeaturesFromChildDescription(product);
    if (childDescriptionFeatures) {
      return childDescriptionFeatures;
    }

    // Fallback to legacy feature generation
    const features = [];

    // Add basic product info as features
    if (product.shortDescription) {
      features.push({
        type: 'basic',
        text: product.shortDescription,
      });
    }

    // Add some generic features based on product attributes
    const courseType = product.attributes?.find((attr) => attr.name === 'course_type')?.value;
    if (courseType) {
      features.push({
        type: 'basic',
        text: `${courseType} Course`,
      });
    }

    const focus = product.attributes?.find((attr) => attr.name === 'focus')?.value;
    if (focus) {
      features.push({
        type: 'basic',
        text: `Focus: ${focus}`,
      });
    }

    const ceus = product.attributes?.find((attr) => attr.name === 'no_of_nasm_ceus')?.value;
    if (ceus) {
      const ceusFormatted = parseFloat(ceus).toFixed(1);
      features.push({
        type: 'addon',
        text: `${ceusFormatted} NASM CEUs`,
      });
    }

    // Add fallback features if none found
    if (features.length === 0) {
      features.push(
        {
          type: 'basic',
          text: 'Comprehensive certification training',
        },
        {
          type: 'basic',
          text: 'Flexible, self-paced learning',
        },
        {
          type: 'addon',
          text: 'Expert instructor support',
        },
      );
    }

    return features;
  }
}

export default async function decorate(block) {
  // Create and append h1 with block name
  const container = document.createElement('div');
  container.classList.add('payment-plans__container');
  container.setHTMLUnsafe(`
<div class="pricing-swiper">
  <!-- Header -->
  <div class="pricing-swiper__header">
    <h1 class="pricing-swiper__title">CHOOSE YOUR PLAN</h1>
  </div>

  <!-- Swiper Container -->
  <div class="pricing-swiper__container">
    <div class="swiper pricing-swiper__slider">
      <div class="swiper-wrapper">
        <!-- Slides will be dynamically generated by JavaScript -->
      </div>
      
      <!-- Pagination -->
      <div class="swiper-pagination"></div>
      
      <!-- Navigation arrows -->
      <div class="swiper-button-next"></div>
      <div class="swiper-button-prev"></div>
    </div>
  </div>
</div>
  `);
  block.appendChild(container);

  // Hide the payment plans by default - only show when we have real product data
  container.style.display = 'none';

  await loadSwiper();

  // Listen for product data from product-details block
  let swiperInstance = null;

  // eslint-disable-next-line no-underscore-dangle
  const existingProduct = events._lastEvent?.['pdp/data']?.payload ?? null;

  if (existingProduct) {
    // Initialize with existing product data if available
    swiperInstance = new PricingCardsSwiper(container, null, existingProduct);
  } else {
    // Initialize with default data and wait for product data
    swiperInstance = new PricingCardsSwiper(container);
  }

  // Listen for product data updates
  events.on('pdp/data', (eventData) => {
    const productData = eventData?.payload || eventData;
    if (productData && swiperInstance) {
      swiperInstance.updateWithProductData(productData);
    }
  }, { eager: true });

  // Listen for matrix products data
  events.on('pdp/matrix-products', (matrixData) => {
    if (matrixData && swiperInstance) {
      swiperInstance.updateWithMatrixProducts(matrixData);
    }
  }, { eager: true });

  // Listen for subscription variants data
  events.on('pdp/subscription-variants', (subscriptionData) => {
    if (subscriptionData && swiperInstance) {
      swiperInstance.updateWithSubscriptionVariants(subscriptionData);
    }
  }, { eager: true });
}
