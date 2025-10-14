/* eslint-disable import/no-unresolved */

import {
  Button,
  provider as UI,
} from '@dropins/tools/components.js';
import { events } from '@dropins/tools/event-bus.js';
import * as pdpApi from '@dropins/storefront-pdp/api.js';
import { setupAddToCartDataLayer, trackAddToCartGA4, scrollToCartIcon } from '../../scripts/commerce.js';
import { showErrorToast, showSuccessToast } from '../../scripts/toast.js';

// Video embed functions (copied from video block)
function embedYoutube(url, autoplay, background) {
  const usp = new URLSearchParams(url.search);
  let suffix = '';
  if (background || autoplay) {
    const suffixParams = {
      autoplay: autoplay ? '1' : '0',
      mute: background ? '1' : '0',
      controls: background ? '0' : '1',
      disablekb: background ? '1' : '0',
      loop: background ? '1' : '0',
      playsinline: background ? '1' : '0',
    };
    suffix = `&${Object.entries(suffixParams).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&')}`;
  }
  let vid = usp.get('v') ? encodeURIComponent(usp.get('v')) : '';
  const embed = url.pathname;
  if (url.origin.includes('youtu.be')) {
    [, vid] = url.pathname.split('/');
  }

  const temp = document.createElement('div');
  temp.innerHTML = `<div style="left: 0; width: 100%; height: 0; position: relative; padding-bottom: 56.25%;">
      <iframe src="https://www.youtube.com${vid ? `/embed/${vid}?rel=0&v=${vid}${suffix}` : embed}" style="border: 0; top: 0; left: 0; width: 100%; height: 100%; position: absolute;" 
      allow="autoplay; fullscreen; picture-in-picture; encrypted-media; accelerometer; gyroscope; picture-in-picture" allowfullscreen="" scrolling="no" title="Content from Youtube" loading="lazy"></iframe>
    </div>`;
  return temp.children.item(0);
}

function embedVimeo(url, autoplay, background) {
  let video;
  let existingParams = '';

  // Handle both vimeo.com/123456 and player.vimeo.com/video/123456 formats
  if (url.hostname === 'player.vimeo.com' && url.pathname.includes('/video/')) {
    // Extract video ID from player URL: /video/123456
    const match = url.pathname.match(/\/video\/(\d+)/);
    if (match) {
      [, video] = match;
    }
    // Preserve existing query parameters (like app_id)
    existingParams = url.search;
  } else {
    // Standard vimeo.com format
    [, video] = url.pathname.split('/');
  }

  let suffix = existingParams;
  if (background || autoplay) {
    const suffixParams = {
      autoplay: autoplay ? '1' : '0',
      background: background ? '1' : '0',
    };
    const newParams = Object.entries(suffixParams)
      .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
      .join('&');
    // Append new params to existing ones
    suffix = existingParams ? `${existingParams}&${newParams}` : `?${newParams}`;
  }

  const temp = document.createElement('div');
  temp.innerHTML = `<div>
      <iframe src="https://player.vimeo.com/video/${video}${suffix}" 
      style="border: 0; top: 0; left: 0; width: 100%; height: 100%; position: absolute;" 
      allow="autoplay; fullscreen; picture-in-picture" allowfullscreen  
      title="Content from Vimeo" loading="lazy"></iframe>
    </div>`;
  return temp.children.item(0);
}

function getVideoElement(source, autoplay, background, title) {
  const video = document.createElement('video');
  video.setAttribute('controls', '');
  if (autoplay) video.setAttribute('autoplay', '');
  if (background) video.setAttribute('muted', '');
  if (title) video.setAttribute('title', title);
  if (background) {
    video.setAttribute('loop', '');
    video.setAttribute('playsinline', '');
    video.removeAttribute('controls');
    video.addEventListener('canplay', () => {
      video.muted = true;
      if (autoplay) video.play();
    });
  }

  const sourceEl = document.createElement('source');
  sourceEl.setAttribute('src', source);
  sourceEl.setAttribute('type', `video/${source.split('.').pop()}`);
  video.append(sourceEl);

  return video;
}

const loadVideoEmbed = (block, link, autoplay, background, title) => {
  if (block.dataset.embedLoaded === 'true') {
    return;
  }
  const url = new URL(link);

  const isYoutube = link.includes('youtube') || link.includes('youtu.be');
  const isVimeo = link.includes('vimeo.com') || link.includes('player.vimeo.com');

  if (isYoutube) {
    const embedWrapper = embedYoutube(url, autoplay, background);
    block.append(embedWrapper);
    embedWrapper.querySelector('iframe').addEventListener('load', () => {
      block.dataset.embedLoaded = true;
    });
  } else if (isVimeo) {
    const embedWrapper = embedVimeo(url, autoplay, background);
    block.append(embedWrapper);
    embedWrapper.querySelector('iframe').addEventListener('load', () => {
      block.dataset.embedLoaded = true;
    });
  } else {
    const videoEl = getVideoElement(link, autoplay, background, title);
    block.append(videoEl);
    videoEl.addEventListener('canplay', () => {
      block.dataset.embedLoaded = true;
    });
  }
};

export default async function decorate(block) {
  // Get the data from the block
  const data = [...block.children].map((row) => [...row.children]
    .map((cell) => cell.textContent.trim()));

  // Detect if this block is in a product context (created from product-details)
  // Check for product context data attribute set by product-details.js
  const isProductContext = block.dataset.productContext === 'true';

  // Extract the content
  const rating = data.find((row) => row[0] === 'rating')?.[1] || '';
  const ratingLabel = data.find((row) => row[0] === 'ratingLabel')?.[1] || '';
  const supHeading = data.find((row) => row[0] === 'supHeading')?.[1] || '';
  const mainHeading = data.find((row) => row[0] === 'mainHeading')?.[1] || '';
  const mainHeadingType = data.find((row) => row[0] === 'mainHeadingType')?.[1] || 'h1';
  const titleLine2 = data.find((row) => row[0] === 'titleLine2')?.[1] || '';
  const description = data.find((row) => row[0] === 'description')?.[1] || '';
  // CTA data is extracted from EDS markup instead
  const strikeOutPrice = data.find((row) => row[0] === 'strikeOutPrice')?.[1] || '';
  const price = data.find((row) => row[0] === 'price')?.[1] || '';
  const priceLabel = data.find((row) => row[0] === 'priceLabel')?.[1] || '';
  const badge = data.find((row) => row[0] === 'badge')?.[1] || '';
  const promotionLabel = data.find((row) => row[0] === 'promotionLabel')?.[1] || '';
  const videoUrl = data.find((row) => row[0] === 'videoUrl')?.[1] || '';
  const theme = data.find((row) => row[0] === 'theme')?.[1] || '';
  const videoPoster = block.querySelector('img');

  // Create the hero structure
  const heroContainer = document.createElement('div');
  let containerClasses = 'hero-video-content-container';
  if (theme) {
    containerClasses += ` ${theme}`;
  }
  heroContainer.className = containerClasses;

  // Create left column with content
  const leftColumn = document.createElement('div');
  leftColumn.className = 'hero-video-content';

  // Add rating if provided
  if (rating && ratingLabel) {
    const ratingContainer = document.createElement('div');
    ratingContainer.className = 'hero-video-rating';

    const starsContainer = document.createElement('div');
    starsContainer.className = 'hero-video-stars';

    // Create 5 stars based on rating
    const starCount = parseInt(rating, 10) || 5;
    for (let i = 0; i < 5; i += 1) {
      const star = document.createElement('span');
      star.className = i < starCount ? 'star filled' : 'star';
      star.textContent = '★';
      starsContainer.appendChild(star);
    }

    const ratingLabelElement = document.createElement('span');
    ratingLabelElement.className = 'hero-video-rating-text';
    ratingLabelElement.textContent = `(${ratingLabel})`;

    ratingContainer.appendChild(starsContainer);
    ratingContainer.appendChild(ratingLabelElement);
    leftColumn.appendChild(ratingContainer);
  }

  // Add sup heading
  if (supHeading) {
    const supHeadingElement = document.createElement('p');
    supHeadingElement.className = 'hero-video-sup-heading';
    supHeadingElement.textContent = supHeading;
    leftColumn.appendChild(supHeadingElement);
  }

  // Add main heading
  if (mainHeading) {
    const mainHeadingElement = document.createElement(mainHeadingType);
    mainHeadingElement.className = 'hero-video-main-heading';
    mainHeadingElement.textContent = mainHeading;
    leftColumn.appendChild(mainHeadingElement);
  }

  // Add title line 2
  if (titleLine2) {
    const titleLine2Element = document.createElement('p');
    titleLine2Element.className = 'hero-video-title-line-2';
    titleLine2Element.textContent = titleLine2;
    leftColumn.appendChild(titleLine2Element);
  }

  // Add description
  if (description) {
    const descriptionElement = document.createElement('p');
    descriptionElement.className = 'hero-video-description';
    descriptionElement.textContent = description;
    leftColumn.appendChild(descriptionElement);
  }

  // Handle CTA based on context - Extract CTA from EDS structure for standalone blocks
  const rows = [...block.children];
  const ctaRow = rows.find((row) => {
    const cells = [...row.children];
    return cells[1] && cells[1].querySelector('.button-container');
  });

  let originalCtaButton = null;
  if (ctaRow) {
    originalCtaButton = ctaRow.querySelector('a.button');
  }

  // Create CTA container
  const ctaContainer = document.createElement('div');
  ctaContainer.className = 'hero-video-cta-container';

  // Create CTA wrapper for button and pricing
  const ctaWrapper = document.createElement('div');
  ctaWrapper.className = 'hero-video-cta-wrapper';

  if (isProductContext) {
    // Get product data to determine type
    // eslint-disable-next-line no-underscore-dangle
    const product = events._lastEvent?.['pdp/data']?.payload ?? null;
    // Check product type for special CTA behavior
    const directPdpType = product?.pdpType;
    const attrPdpType = product?.attributes?.find((attr) => attr.name === 'pdp_type' || attr.id === 'pdp_type')?.value;
    const isDirectBundle = product?.isBundle;
    const productType = product?.productType;
    const pdpType = directPdpType || attrPdpType;

    const isSpecialType = pdpType === 'Bundle'
                         || pdpType === 'Matrix'
                         || pdpType === 'Subscription'
                         || pdpType === 2 // Single complex products have numeric pdpType = 2
                         || pdpType === '2' // Also check string version
                         || pdpType === 4 // Matrix products have numeric pdpType = 4
                         || pdpType === '4' // Also check string version
                         || isDirectBundle === true
                         || productType === 'complex';

    if (isSpecialType) {
      // Special types (Bundle, Matrix, Subscription, Single Complex): Scroll to payment plans
      const buttonContainer = document.createElement('div');
      buttonContainer.className = 'hero-video-button-container';

      await UI.render(Button, {
        children: 'Get Started',
        className: 'hero-video-cta button',
        onClick: () => {
          // Find the payment plans section and scroll to it
          const paymentPlansSection = document.querySelector('.payment-plans, .payment-plans__container, .pricing-swiper');
          if (paymentPlansSection) {
            paymentPlansSection.scrollIntoView({
              behavior: 'smooth',
              block: 'start',
            });
          }
        },
      })(buttonContainer);

      ctaWrapper.appendChild(buttonContainer);
    } else {
      // Regular products: Use add-to-cart functionality
      // Create alert container for error messages
      const alertContainer = document.createElement('div');
      alertContainer.className = 'hero-video-alert';
      ctaContainer.appendChild(alertContainer);

      // Create add-to-cart button container
      const buttonContainer = document.createElement('div');
      buttonContainer.className = 'hero-video-button-container';

      // Alert for error handling
      const inlineAlert = null;

      // Create add-to-cart button using dropins
      const addToCartButton = await UI.render(Button, {
        children: 'Get Started',
        className: 'hero-video-cta button',
        onClick: async () => {
          try {
            addToCartButton.setProps((prev) => ({
              ...prev,
              children: 'Adding to Cart...',
              disabled: true,
            }));

            // get the current selection values
            const values = pdpApi.getProductConfigurationValues();
            const valid = pdpApi.isProductConfigurationValid();

            // add the product to the cart
            if (valid) {
              const { addProductsToCart } = await import('@dropins/storefront-cart/api.js');

              // Track product for data layer
              // eslint-disable-next-line no-underscore-dangle
              const currentProduct = events._lastEvent?.['pdp/data']?.payload ?? null;
              if (currentProduct) {
                setupAddToCartDataLayer(currentProduct, values.quantity || 1, []);
                await trackAddToCartGA4(currentProduct, values.quantity || 1);
              }

              // Cache pdp_type for mini cart URL routing
              if (currentProduct?.pdpType && values?.sku) {
                const pdpTypeCache = JSON.parse(sessionStorage.getItem('pdpTypeCache') || '{}');
                pdpTypeCache[values.sku] = currentProduct.pdpType;
                sessionStorage.setItem('pdpTypeCache', JSON.stringify(pdpTypeCache));
              }

              await addProductsToCart([{ ...values }]);

              // Scroll to cart icon after successful add-to-cart
              scrollToCartIcon();

              // Show success toast at top
              showSuccessToast('Product added to cart successfully!', 'Added to Cart');
            }

            // reset any previous alerts if successful
            inlineAlert?.remove();
          } catch (error) {
            // Show toast error message
            showErrorToast(error.message, 'Add to Cart Failed');
          } finally {
            addToCartButton.setProps((prev) => ({
              ...prev,
              children: 'Get Started',
              disabled: false,
            }));
          }
        },
      })(buttonContainer);

      ctaWrapper.appendChild(buttonContainer);

      // Update button state based on product configuration validity
      events.on('pdp/valid', (valid) => {
        // update add to cart button disabled state based on product selection validity
        if (addToCartButton?.setProps) {
          addToCartButton.setProps((prev) => ({ ...prev, disabled: !valid }));
        }
      }, { eager: true });
    }
  } else if (originalCtaButton) {
    // Standalone context: Use original CTA button functionality
    // Clone the button and add hero-video specific classes
    const clonedButton = originalCtaButton.cloneNode(true);
    clonedButton.classList.add('hero-video-cta');
    ctaWrapper.appendChild(clonedButton);
  }

  // Add pricing information if provided
  if (price || priceLabel) {
    const pricingContainer = document.createElement('div');
    pricingContainer.className = 'hero-video-pricing';

    if (price) {
      const priceElement = document.createElement('span');
      priceElement.className = 'hero-video-price';

      // Add strike-out price if provided
      if (strikeOutPrice) {
        const strikeOutElement = document.createElement('span');
        strikeOutElement.className = 'hero-video-strike-out-price';
        strikeOutElement.textContent = strikeOutPrice;
        strikeOutElement.style.textDecoration = 'line-through';
        strikeOutElement.style.opacity = '0.7';
        strikeOutElement.style.marginRight = '8px';
        priceElement.appendChild(strikeOutElement);
      }

      // Add current price
      const currentPriceElement = document.createElement('span');
      currentPriceElement.textContent = price;
      priceElement.appendChild(currentPriceElement);

      pricingContainer.appendChild(priceElement);
    }

    if (priceLabel) {
      const priceLabelElement = document.createElement('span');
      priceLabelElement.className = 'hero-video-price-label';
      priceLabelElement.textContent = priceLabel;
      pricingContainer.appendChild(priceLabelElement);
    }

    ctaWrapper.appendChild(pricingContainer);
  }

  // Add promotion label if provided
  if (promotionLabel) {
    const promotionLabelElement = document.createElement('div');
    promotionLabelElement.className = 'hero-video-promotion-label';
    promotionLabelElement.textContent = promotionLabel;
    ctaWrapper.appendChild(promotionLabelElement);
  }

  ctaContainer.appendChild(ctaWrapper);

  // Add badge if provided
  if (badge) {
    const badgeElement = document.createElement('div');
    badgeElement.className = 'hero-video-badge';
    badgeElement.textContent = badge;
    ctaContainer.appendChild(badgeElement);
  }

  leftColumn.appendChild(ctaContainer);

  // Create right column with video
  const rightColumn = document.createElement('div');
  rightColumn.className = 'hero-video-media';

  if (videoUrl) {
    const videoContainer = document.createElement('div');
    videoContainer.className = 'hero-video-player';

    // Handle image-only case (when videoUrl is '#image-only')
    if (videoUrl === '#image-only') {
      if (videoPoster) {
        // Show just the image without play button
        const imageContainer = document.createElement('div');
        imageContainer.className = 'hero-video-image-only';

        const posterImg = videoPoster.cloneNode(true);
        imageContainer.appendChild(posterImg);

        videoContainer.appendChild(imageContainer);
      }
    } else if (videoPoster) {
      // Create video placeholder with poster
      const videoPlaceholder = document.createElement('div');
      videoPlaceholder.className = 'hero-video-placeholder';

      const posterImg = videoPoster.cloneNode(true);
      videoPlaceholder.appendChild(posterImg);

      // Add play button
      const playButton = document.createElement('div');
      playButton.className = 'hero-video-play-button';
      playButton.innerHTML = '<button type="button" title="Play Video" aria-label="Play Video"></button>';
      videoPlaceholder.appendChild(playButton);

      // Add click handler to load video
      videoPlaceholder.addEventListener('click', () => {
        videoPlaceholder.remove();
        loadVideoEmbed(videoContainer, videoUrl, true, false, 'Hero Video');
      });

      videoContainer.appendChild(videoPlaceholder);
    } else {
      // Load video immediately if no poster
      loadVideoEmbed(videoContainer, videoUrl, false, false, 'Hero Video');
    }

    rightColumn.appendChild(videoContainer);
  }

  // Assemble the hero
  heroContainer.appendChild(leftColumn);
  heroContainer.appendChild(rightColumn);

  // Replace block content
  block.textContent = '';
  block.appendChild(heroContainer);

  // For product context, listen for product data and update bundle pricing
  if (isProductContext) {
    events.on('pdp/data', (productData) => {
      // Check product types using consistent pdp_type mapping
      const rawPdpType = productData?.pdpType;
      const isDirectBundle = productData?.isBundle;

      // Map numeric pdp_type to product types
      const isBundleType = rawPdpType === 'Bundle' || rawPdpType === 'bundle' || rawPdpType === '3' || rawPdpType === 3;
      const isSubscriptionType = rawPdpType === 'Subscription' || rawPdpType === 'subscription' || rawPdpType === '5' || rawPdpType === 5;

      const isBundle = isBundleType && isDirectBundle === true;
      const isSubscription = isSubscriptionType;

      // Convert to background image layout for subscription and bundle products
      // (only if image is present)
      if (isSubscription || isBundle) {
        // Get the background image from the right column
        const imageElement = rightColumn.querySelector('img');
        if (imageElement && imageElement.src) {
          // Add background layout class to container only when image is present
          heroContainer.classList.add('hero-video-subscription');

          // Set the background image on the hero container
          heroContainer.style.backgroundImage = `url(${imageElement.src})`;
          heroContainer.style.backgroundSize = 'cover';
          heroContainer.style.backgroundPosition = 'center';
          heroContainer.style.backgroundRepeat = 'no-repeat';

          // Remove the right column since we're using background
          if (rightColumn.parentNode) {
            rightColumn.parentNode.removeChild(rightColumn);
          }

          // Add overlay for better text readability
          const overlay = document.createElement('div');
          overlay.className = 'hero-video-subscription-overlay';
          heroContainer.appendChild(overlay);

          // Move content column to be on top of background
          leftColumn.style.position = 'relative';
          leftColumn.style.zIndex = '2';
        } else {
          // If no image is present for bundle/subscription, add padding
          heroContainer.style.padding = '0 20px';
        }
      }

      // Update pricing for bundle products using nasm_price
      if (isBundle && productData.nasm_price && Array.isArray(productData.nasm_price)) {
        const priceElement = block.querySelector('.hero-video-price');

        if (priceElement) {
          // Get default_instalment from product data (added by PDP transformer)
          const defaultInstalment = productData.default_instalment;

          // Find price object matching the default_instalment
          const monthlyPriceData = productData.nasm_price.find((priceObj) => {
            const numInstalment = priceObj.instalment_number;
            const parsedInstalment = parseInt(numInstalment, 10);
            const parsedDefault = parseInt(defaultInstalment, 10);
            return numInstalment === defaultInstalment || parsedInstalment === parsedDefault;
          });

          if (monthlyPriceData && monthlyPriceData.monthly_price) {
            const newPrice = `$${monthlyPriceData.monthly_price}`;
            priceElement.textContent = newPrice;

            // Update price label to show "/month"
            const priceLabelElement = block.querySelector('.hero-video-price-label');
            if (priceLabelElement) {
              priceLabelElement.textContent = '/month';
            }
          }
        }
      } else if (isSubscription && productData.plp_price) {
        // Update pricing for subscription products using plp_price
        const priceElement = block.querySelector('.hero-video-price');

        if (priceElement) {
          const plpPrice = parseFloat(productData.plp_price);

          if (!Number.isNaN(plpPrice) && plpPrice > 0) {
            const newPrice = `$${plpPrice.toFixed(2)}`;
            priceElement.textContent = newPrice;

            // Update price label to show "/month" for subscriptions
            const priceLabelElement = block.querySelector('.hero-video-price-label');
            if (priceLabelElement) {
              priceLabelElement.textContent = '/month';
            }
          }
        }
      }
    }, { eager: true });
  }
}
