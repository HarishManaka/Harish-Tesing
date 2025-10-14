/* eslint-disable import/no-unresolved */

import {
  Icon,
  Button,
  provider as UI,
} from '@dropins/tools/components.js';
import { events } from '@dropins/tools/event-bus.js';
import * as pdpApi from '@dropins/storefront-pdp/api.js';
import { render as pdpRendered } from '@dropins/storefront-pdp/render.js';

// Containers
import ProductHeader from '@dropins/storefront-pdp/containers/ProductHeader.js';
import ProductPrice from '@dropins/storefront-pdp/containers/ProductPrice.js';
import ProductShortDescription from '@dropins/storefront-pdp/containers/ProductShortDescription.js';
import ProductOptions from '@dropins/storefront-pdp/containers/ProductOptions.js';
import ProductQuantity from '@dropins/storefront-pdp/containers/ProductQuantity.js';
import ProductDescription from '@dropins/storefront-pdp/containers/ProductDescription.js';
import ProductAttributes from '@dropins/storefront-pdp/containers/ProductAttributes.js';
import ProductGallery from '@dropins/storefront-pdp/containers/ProductGallery.js';

// Libs
import {
  fetchPlaceholders,
  setJsonLd,
  getProductUrlByType,
  setupAddToCartDataLayer,
  trackAddToCartGA4,
  scrollToCartIcon,
} from '../../scripts/commerce.js';
import { showErrorToast, showSuccessToast } from '../../scripts/toast.js';
import { loadCSS } from '../../scripts/aem.js';

// Initializers
import { IMAGES_SIZES } from '../../scripts/initializers/pdp.js';
import '../../scripts/initializers/cart.js';
import { rootLink } from '../../scripts/scripts.js';
/**
 * Fetch product data for multiple SKUs using the same GraphQL query structure
 * @param {string[]} skuArray - Array of product SKUs to fetch
 * @returns {Promise<Array>} Array of product data
 */
async function fetchMappedProductsData(skuArray) {
  try {
    // Use the same GraphQL query structure as the main product query with proper inline fragments
    const query = `
      query GET_PRODUCT_DATA($skus: [String!]!) {
        products(skus: $skus) {
          __typename
          id
          sku
          name
          shortDescription
          metaDescription  
          metaKeyword
          metaTitle
          description
          inStock
          addToCartAllowed
          url
          urlKey
          externalId
          images {
            url
            label
            roles
          }
          videos {
            url
          }
          attributes {
            name
            label
            value
            roles
          }
          ... on SimpleProductView {
            price {
              roles
              regular {
                amount {
                  value
                  currency
                }
              }
              final {
                amount {
                  value
                  currency
                }
              }
            }
            nasm_price {
              monthly_price
              strike_out_monthly_price
              down_payment
              instalment_type
              instalment_number
              instalment_number_display
            }
          }
          ... on ComplexProductView {
            nasm_price {
              monthly_price
              strike_out_monthly_price
              down_payment
              instalment_type
              instalment_number
              instalment_number_display
            }
            options {
              id
              title
              required
              values {
                id
                title
                ... on ProductViewOptionValueProduct {
                  __typename
                  isDefault
                  product {
                    sku
                    name
                    shortDescription
                    metaDescription
                    price {
                      final { amount { currency value } }
                    }
                  }
                }
              }
            }
            priceRange {
              minimum {
                final { amount { currency value } }
              }
              maximum {  
                final { amount { currency value } }
              }
            }
          }
        }
      }
    `;

    const result = await pdpApi.fetchGraphQl(query, {
      method: 'GET',
      variables: { skus: skuArray },
    });

    return result?.data?.products || [];
  } catch (error) {
    console.error('Error fetching mapped products data:', error);
    return [];
  }
}

export default async function decorate(block) {
  // eslint-disable-next-line no-underscore-dangle
  const product = events._lastEvent?.['pdp/data']?.payload ?? null;
  const labels = await fetchPlaceholders();

  // Layout
  const fragment = document.createRange().createContextualFragment(`
    <div class="product-details__wrapper">
      <div class="product-details__alert"></div>
      <div class="product-details__left-column">
        <div class="product-details__gallery"></div>
      </div>
      <div class="product-details__right-column">
        <div class="product-details__header"></div>
        <div class="product-details__price"></div>
        <div class="product-details__gallery"></div>
        <div class="product-details__short-description"></div>
        <div class="product-details__configuration">
          <div class="product-details__options"></div>
          <div class="product-details__quantity"></div>
          <div class="product-details__buttons">
            <div class="product-details__buttons__add-to-cart"></div>
            <div class="product-details__buttons__add-to-wishlist"></div>
          </div>
        </div>
        <div class="product-details__description"></div>
        <div class="product-details__attributes"></div>
      </div>
    </div>
  `);

  const $gallery = fragment.querySelector('.product-details__gallery');
  const $header = fragment.querySelector('.product-details__header');
  const $price = fragment.querySelector('.product-details__price');
  const $galleryMobile = fragment.querySelector('.product-details__right-column .product-details__gallery');
  const $shortDescription = fragment.querySelector('.product-details__short-description');
  const $options = fragment.querySelector('.product-details__options');
  const $quantity = fragment.querySelector('.product-details__quantity');
  const $addToCart = fragment.querySelector('.product-details__buttons__add-to-cart');
  const $addToWishlist = fragment.querySelector('.product-details__buttons__add-to-wishlist');
  const $description = fragment.querySelector('.product-details__description');
  const $attributes = fragment.querySelector('.product-details__attributes');

  block.appendChild(fragment);

  // Create and add Countdown Promo section above product details section (if API data available)
  const promotionCountdownLabel = product?.promotionCountdownLabel || '';
  const promotionEndDate = product?.promotionEndDate || '';

  if (promotionCountdownLabel && promotionEndDate) {
    try {
      // Create a new section for the countdown promo
      const promoSection = document.createElement('div');
      promoSection.classList.add('section', 'full-width', 'countdown-promo-section');
      promoSection.dataset.sectionStatus = 'loaded';
      promoSection.style.display = null; // Make sure it's visible

      // Create countdown promo block wrapper
      const promoWrapper = document.createElement('div');
      promoWrapper.classList.add('countdown-promo-wrapper');

      // Create countdown promo block structure
      const promoBlock = document.createElement('div');
      promoBlock.classList.add('countdown-promo', 'block');
      promoBlock.dataset.blockName = 'countdown-promo';
      promoBlock.dataset.blockStatus = 'initialized';

      // Create the data structure that countdown-promo expects using API data
      promoBlock.innerHTML = `
        <div>
          <div>promoLabel</div>
          <div>${promotionCountdownLabel}</div>
        </div>
        <div>
          <div>textColor</div>
          <div>dark-blue</div>
        </div>
        <div>
          <div>backgroundColor</div>
          <div>teal</div>
        </div>
        <div>
          <div>countdownEndDate</div>
          <div>${promotionEndDate}</div>
        </div>
        <div>
          <div>showCountdown</div>
          <div>true</div>
        </div>
      `;

      // Load countdown promo CSS
      await loadCSS(`${window.hlx.codeBasePath}/blocks/countdown-promo/countdown-promo.css`);

      // Import and use countdown promo decorator directly
      const { default: promoDecorator } = await import('../countdown-promo/countdown-promo.js');
      promoDecorator(promoBlock);

      // Assemble the promo section structure
      promoWrapper.appendChild(promoBlock);
      promoSection.appendChild(promoWrapper);

      // Insert promo section before the current product details section
      const currentSection = block.closest('.section');
      if (currentSection && currentSection.parentNode) {
        currentSection.parentNode.insertBefore(promoSection, currentSection);
      }
    } catch (error) {
      // Silently handle promo creation errors
    }
  }

  // Create and add Hero Video section below countdown-promo section
  try {
    // Create a new section for the hero video
    const heroSection = document.createElement('div');
    heroSection.classList.add('section', 'hero-video-section');
    heroSection.dataset.sectionStatus = 'loaded';
    heroSection.style.display = null; // Make sure it's visible
    // Add full-width class for bundle and subscription products
    const isBundle = product?.pdpType === 'Bundle' || product?.pdpType === '3' || product?.pdpType === 3;
    const isSubscription = product?.pdpType === 'Subscription' || product?.pdpType === 5 || product?.pdpType === '5';
    if (isBundle || isSubscription) {
      heroSection.classList.add('full-width');
    }

    // Create hero video block wrapper
    const heroWrapper = document.createElement('div');
    heroWrapper.classList.add('hero-video-wrapper');

    // Create hero video block structure
    const heroBlock = document.createElement('div');
    heroBlock.classList.add('hero-video', 'block');
    heroBlock.dataset.blockName = 'hero-video';
    heroBlock.dataset.blockStatus = 'initialized';
    heroBlock.dataset.productContext = 'true'; // Mark as product context for add-to-cart functionality

    // Get video URL and custom attributes safely
    // Check for vimeo_video first (from transformer), then fall back to videos array
    const vimeoVideoUrl = product?.vimeo_video;
    const hasVideo = vimeoVideoUrl || product?.videos?.[0]?.url;
    const videoUrl = hasVideo || '';
    const eyebrowLabel = product?.eyebrowSuggestLabel || '';
    const promotionLabel = product?.promotionLabel || '';
    const productTitleLine2 = product?.productTitleLine2 || '';
    const badge = product?.badge || '';

    // Product type is now determined by __typename and options in the transformer
    // Available for future use: product?.productType
    // Examples: 'Simple Product', 'Bundle Product', 'Complex Product'

    // Get product image for fallback when no video
    const productImage = product?.images?.find((img) => img.roles.includes('image'))?.url
                        || product?.images?.[0]?.url || '';

    // Use a placeholder video URL when we want to show just an image
    let finalVideoUrl;
    if (hasVideo) {
      finalVideoUrl = videoUrl;
    } else if (productImage) {
      finalVideoUrl = '#image-only';
    } else {
      finalVideoUrl = '';
    }

    // Create the data structure that hero-video expects (matching EDS table structure)
    heroBlock.innerHTML = `
      <div>
        <div><p>supHeading</p></div>
        <div><p>${eyebrowLabel}</p></div>
      </div>
      <div>
        <div><p>mainHeading</p></div>
        <div><p>${product?.marketing_product_name || product?.name}</p></div>
      </div>
      <div>
        <div><p>mainHeadingType</p></div>
        <div><p>h2</p></div>
      </div>
      <div>
        <div><p>titleLine2</p></div>
        <div><p>${productTitleLine2}</p></div>
      </div>
      <div>
        <div><p>description</p></div>
        <div><p>${product?.shortDescription}</p></div>
      </div>
      <div>
        <div><p>ctaLink</p></div>
        <div><p></p></div>
      </div>
      <div>
        <div><p>strikeOutPrice</p></div>
        <div><p>${(() => {
    // Get nasm_price array and default_instalment
    const nasmPrices = product?.nasm_price;
    const defaultInstalment = product?.default_instalment || product?.attributes?.find((attr) => attr.name === 'default_instalment')?.value;

    // Handle all product types using nasm_price if available
    if (defaultInstalment && nasmPrices && Array.isArray(nasmPrices)) {
      // Find price object matching the default_instalment
      const monthlyPriceData = nasmPrices.find((priceObj) => {
        const numInstalment = priceObj.instalment_number;
        const parsedInstalment = parseInt(numInstalment, 10);
        const parsedDefault = parseInt(defaultInstalment, 10);
        return numInstalment === defaultInstalment || parsedInstalment === parsedDefault;
      });

      if (monthlyPriceData && monthlyPriceData.strike_out_monthly_price) {
        return `$${monthlyPriceData.strike_out_monthly_price}`;
      }
    }

    // Return empty string if no strike-out price available
    return '';
  })()}</p></div>
      </div>
      <div>
        <div><p>price</p></div>
        <div><p>${(() => {
    // All product types (1-5) use nasm_price for pricing
    // 1=Single_Simple, 2=Single_Complex, 3=Bundle, 4=Matrix, 5=Subscription

    // Get nasm_price array and default_instalment
    const nasmPrices = product?.nasm_price;
    const defaultInstalment = product?.default_instalment || product?.attributes?.find((attr) => attr.name === 'default_instalment')?.value;

    // Handle all product types using nasm_price if available
    if (defaultInstalment && nasmPrices && Array.isArray(nasmPrices)) {
      // Find price object matching the default_instalment
      const monthlyPriceData = nasmPrices.find((priceObj) => {
        const numInstalment = priceObj.instalment_number;
        const parsedInstalment = parseInt(numInstalment, 10);
        const parsedDefault = parseInt(defaultInstalment, 10);
        return numInstalment === defaultInstalment || parsedInstalment === parsedDefault;
      });

      if (monthlyPriceData && monthlyPriceData.monthly_price) {
        return `$${monthlyPriceData.monthly_price}`;
      }
    }

    // Fallback to regular price if no nasm_price match found
    return `$${product?.prices?.final?.amount || ''}`;
  })()}</p></div>
      </div>
      <div>
        <div><p>priceLabel</p></div>
        <div><p>${(() => {
    // Get default_instalment to determine the price label
    const defaultInstalment = product?.default_instalment || product?.attributes?.find((attr) => attr.name === 'default_instalment')?.value;

    // If instalment is 1, show "One-time Payment", otherwise show "/month"
    if (defaultInstalment && (defaultInstalment === '1' || defaultInstalment === 1)) {
      return 'One-time Payment';
    } if (defaultInstalment) {
      return '/month';
    }

    // Fallback to "One-time Payment" if no instalment data
    return 'One-time Payment';
  })()}</p></div>
      </div>
      <div>
        <div><p>badge</p></div>
        <div><p>${badge}</p></div>
      </div>
      <div>
        <div><p>promotionLabel</p></div>
        <div><p>${promotionLabel}</p></div>
      </div>
      <div>
        <div><p>videoUrl</p></div>
        <div><p>${finalVideoUrl}</p></div>
      </div>
      <div>
        <div><p>videoPoster</p></div>
        <div><p>${!hasVideo && productImage ? `<img src="${productImage}" alt="${product?.marketing_product_name || product?.name || 'Product Image'}" loading="lazy">` : ''}</p></div>
      </div>
      <div>
        <div><p>theme</p></div>
        <div><p>brandcolordark</p></div>
      </div>
    `;

    // Load hero video CSS
    await loadCSS(`${window.hlx.codeBasePath}/blocks/hero-video/hero-video.css`);

    // Import and use hero video decorator directly
    const { default: heroDecorator } = await import('../hero-video/hero-video.js');
    heroDecorator(heroBlock);

    // Assemble the hero section structure
    heroWrapper.appendChild(heroBlock);
    heroSection.appendChild(heroWrapper);

    // Insert hero section after the countdown promo section (or after current section if no promo)
    const currentSection = block.closest('.section');
    const promoSection = currentSection?.parentNode?.querySelector('.countdown-promo-section');

    if (promoSection && promoSection.parentNode) {
      // Insert after the promo section
      promoSection.parentNode.insertBefore(heroSection, promoSection.nextSibling);
    } else if (currentSection && currentSection.parentNode) {
      // Fallback: insert after the current section if no promo section exists
      currentSection.parentNode.insertBefore(heroSection, currentSection.nextSibling);
    }
  } catch (error) {
    // Handle hero video creation errors
    // eslint-disable-next-line no-console
    console.error('Error creating hero video section:', error);
  }

  // Check if this is a bundle product and has options
  const isBundle = product?.pdpType === 'Bundle' || product?.pdpType === '3' || product?.pdpType === 3;

  if (isBundle && product?.options?.length > 0) {
    try {
      const bundleSection = document.createElement('div');
      bundleSection.classList.add('section', 'bundle-products-section');
      bundleSection.dataset.sectionStatus = 'loaded';
      bundleSection.style.display = null;

      const bundleWrapper = document.createElement('div');
      bundleWrapper.classList.add('bundle-products-wrapper');

      const bundleContent = document.createElement('div');
      bundleContent.classList.add('bundle-products');

      const bundleTitle = document.createElement('h2');
      bundleTitle.classList.add('bundle-products-title');
      bundleTitle.textContent = 'INCLUDED IN THIS BUNDLE';

      const bundleProducts = [];

      if (product.options && Array.isArray(product.options)) {
        product.options.forEach((option) => {
          if (option.items && Array.isArray(option.items)) {
            option.items.forEach((item) => {
              // Extract product info from item
              const rawDescription = item.product?.shortDescription
                                || item.product?.metaDescription;
              let cleanDescription = rawDescription;
              // If description contains HTML tags, extract text content
              if (rawDescription && /<[^>]+>/.test(rawDescription)) {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = rawDescription;
                cleanDescription = tempDiv.textContent || tempDiv.innerText || '';
              }

              const bundleProduct = {
                name: item.label || item.name || item.title || 'Unknown Product',
                shortDescription: cleanDescription,
              };
              bundleProducts.push(bundleProduct);
            });
          } else if (option.values && Array.isArray(option.values)) {
            // Fallback: Check for 'values' array (API payload structure)
            option.values.forEach((value) => {
              // eslint-disable-next-line no-underscore-dangle
              if (value.__typename === 'ProductViewOptionValueProduct' && value.product) {
                const rawDescription = value.product.shortDescription
                                    || value.product.metaDescription;
                let cleanDescription = rawDescription;

                // If description contains HTML tags, extract text content
                if (rawDescription && /<[^>]+>/.test(rawDescription)) {
                  const tempDiv = document.createElement('div');
                  tempDiv.innerHTML = rawDescription;
                  cleanDescription = tempDiv.textContent || tempDiv.innerText || '';
                }

                const bundleProduct = {
                  name: value.product.name || value.title || 'Unknown Product',
                  shortDescription: cleanDescription,
                };
                bundleProducts.push(bundleProduct);
              } else if (value.product) {
                // Fallback for different typename
                const rawDescription = value.product.shortDescription
                                    || value.product.metaDescription;
                let cleanDescription = rawDescription;

                // If description contains HTML tags, extract text content
                if (rawDescription && /<[^>]+>/.test(rawDescription)) {
                  const tempDiv = document.createElement('div');
                  tempDiv.innerHTML = rawDescription;
                  cleanDescription = tempDiv.textContent || tempDiv.innerText || '';
                }

                const bundleProduct = {
                  name: value.product.name || value.title || 'Unknown Product',
                  shortDescription: cleanDescription,
                };
                bundleProducts.push(bundleProduct);
              }
            });
          }
        });
      }

      // Fallback: If no products found, add test products for debugging
      if (bundleProducts.length === 0) {
        bundleProducts.push(
          {
            name: 'Test Product 1',
            shortDescription: 'This is a test product to verify the bundle section is working.',
          },
          {
            name: 'Test Product 2',
            shortDescription: 'This is another test product to check the layout.',
          },
          {
            name: 'Test Product 3',
            shortDescription: 'This is the third test product for grid verification.',
          },
        );
      }

      // Add title first to the flex container
      bundleContent.appendChild(bundleTitle);

      // Add class for many products if more than 3
      if (bundleProducts.length > 3) {
        bundleContent.classList.add('many-products');
      }

      // Create product cards and add them directly to the flex container
      bundleProducts.forEach((bundleProduct) => {
        const productCard = document.createElement('div');
        productCard.classList.add('bundle-product-card');

        const productName = document.createElement('p');
        productName.classList.add('bundle-product-name');
        productName.textContent = bundleProduct.name;

        const productDesc = document.createElement('p');
        productDesc.classList.add('bundle-product-description');
        productDesc.textContent = bundleProduct.shortDescription;

        productCard.appendChild(productName);
        productCard.appendChild(productDesc);
        bundleContent.appendChild(productCard); // Add directly to flex container
      });

      // Assemble the bundle section
      bundleWrapper.appendChild(bundleContent);
      bundleSection.appendChild(bundleWrapper);

      // Insert bundle section after the hero video section
      const currentSection = block.closest('.section');
      const heroSection = currentSection?.parentNode?.querySelector('.hero-video-section');
      if (heroSection && heroSection.parentNode) {
        // Insert after the hero video section
        heroSection.parentNode.insertBefore(bundleSection, heroSection.nextSibling);
      } else if (currentSection && currentSection.parentNode) {
        // Fallback: insert after the current section
        currentSection.parentNode.insertBefore(bundleSection, currentSection.nextSibling);
      }
    } catch (error) {
      console.error('Error creating bundle products section:', error);
    }
  }

  // Check if this is a matrix product and fetch mapped products data
  const pdpTypeAttr = product?.attributes?.find((attr) => attr.name === 'pdp_type');

  // Matrix products have pdpType = 4 (number) or pdpType = '4' (string) or pdpType = 'Matrix'
  const isMatrix = product?.pdpType === 'Matrix' || product?.pdpType === 4 || product?.pdpType === '4' || pdpTypeAttr?.value === '4';

  if (isMatrix) {
    try {
      // First try the transformed field
      let mappedProductsSKUs = product?.mapped_products;

      // Fallback to attributes array if transformed field is not available
      if (!mappedProductsSKUs) {
        const mappedProductsAttr = product?.attributes?.find((attr) => attr.name === 'mapped_products');
        mappedProductsSKUs = mappedProductsAttr?.value;
      }

      if (mappedProductsSKUs) {
        const skuArray = mappedProductsSKUs.split(',').map((sku) => sku.trim());

        // Fetch data for all mapped products
        const mappedProductsData = await fetchMappedProductsData(skuArray);

        // Store mapped products data for later use
        if (mappedProductsData && mappedProductsData.length > 0) {
          // Emit event with mapped products data for other components to use
          events.emit('pdp/matrix-products', {
            originalProduct: product,
            mappedProducts: mappedProductsData,
          });
        }
      }
    } catch (error) {
      console.error('Error processing matrix product:', error);
    }
  }

  // Check if this is a subscription product and fetch variants data
  const isSubscription = product?.pdpType === 'Subscription' || product?.pdpType === 5 || product?.pdpType === '5' || pdpTypeAttr?.value === '5';

  if (isSubscription) {
    try {
      // Fetch variants for subscription products using the same query as setJsonLdProduct
      const { data } = await pdpApi.fetchGraphQl(`
        query GET_PRODUCT_VARIANTS($sku: String!) {
          variants(sku: $sku) {
            variants {
              product {
                sku
                name
                shortDescription
                metaDescription
                metaKeyword
                metaTitle
                description
                inStock
                attributes{
                  label
                  name
                  value
                  roles
                }
                images(roles: ["image"]) {
                  url
                }
                videos {
                  url
                }
                ...on SimpleProductView {
                  price {
                    final { amount { currency value } }
                  }
                }
              }
            }
          }
        }
      `, {
        method: 'GET',
        variables: { sku: product.sku },
      });

      const variants = data?.variants?.variants || [];

      if (variants && variants.length > 0) {
        // Emit event with subscription variants data for payment-plans to use
        events.emit('pdp/subscription-variants', {
          originalProduct: product,
          variants,
        });
      }
    } catch (error) {
      console.error('Error processing subscription product:', error);
    }
  }

  // Create and add Product Description Tabs section at the end
  try {
    if (product) {
      // Create a new section for the product description tabs
      const descriptionSection = document.createElement('div');
      descriptionSection.classList.add('section', 'product-description-section');
      descriptionSection.dataset.sectionStatus = 'loaded';
      descriptionSection.style.display = null; // Make sure it's visible

      // Create description tabs block wrapper
      const descriptionWrapper = document.createElement('div');
      descriptionWrapper.classList.add('product-description-tabs-wrapper');

      // Create product description tabs block structure
      const descriptionBlock = document.createElement('div');
      descriptionBlock.classList.add('product-description-tabs', 'block');
      descriptionBlock.dataset.blockName = 'product-description-tabs';
      descriptionBlock.dataset.blockStatus = 'initialized';

      // Add product context to help determine the title
      descriptionBlock.dataset.productContext = 'true';

      // Check if this is a subscription product and add data attribute
      const subscriptionPdpTypeAttr = product?.attributes?.find((attr) => attr.name === 'pdp_type');
      const isSubscriptionProduct = product?.pdpType === 'Subscription' || product?.pdpType === 5 || product?.pdpType === '5' || subscriptionPdpTypeAttr?.value === '5';
      if (isSubscriptionProduct) {
        descriptionBlock.dataset.productType = 'subscription';
      }

      // Use product description from API or fallback to hardcoded content
      const productDescription = product?.description || '';

      let descriptionContent;

      if (productDescription) {
        // Use API description directly (it already contains the table structure)
        descriptionContent = productDescription;
      } else {
        // No API description available - don't show any description section
        descriptionContent = '';
      }

      // Only create description section if there's content to show
      if (descriptionContent) {
        descriptionBlock.innerHTML = descriptionContent;

        // Load product description tabs CSS
        await loadCSS(`${window.hlx.codeBasePath}/blocks/product-description-tabs/product-description-tabs.css`);

        // Import and use product description tabs decorator directly
        const { default: descriptionDecorator } = await import('../product-description-tabs/product-description-tabs.js');
        descriptionDecorator(descriptionBlock);

        // Assemble the description section structure
        descriptionWrapper.appendChild(descriptionBlock);
        descriptionSection.appendChild(descriptionWrapper);

        // Insert description section at the end (after hero video section)
        const currentSection = block.closest('.section');
        const heroSection = currentSection?.parentNode?.querySelector('.hero-video-section');
        if (heroSection && heroSection.parentNode) {
          // Insert after the hero video section
          heroSection.parentNode.insertBefore(descriptionSection, heroSection.nextSibling);
        } else if (currentSection && currentSection.parentNode) {
          // Fallback: insert after the current section
          currentSection.parentNode.insertBefore(descriptionSection, currentSection.nextSibling);
        }
      }
    }
  } catch (error) {
    // Silently handle product description tabs creation errors
    console.warn('Error creating product description tabs:', error);
  }

  // Alert
  const inlineAlert = null;

  // Render Containers
  const [
    _galleryMobile,
    _gallery,
    _header,
    _price,
    _shortDescription,
    _options,
    _quantity,
    addToCart,
    addToWishlist,
    _description,
    _attributes,
  ] = await Promise.all([
    // Gallery (Mobile)
    pdpRendered.render(ProductGallery, {
      controls: 'dots',
      arrows: true,
      peak: false,
      gap: 'small',
      loop: false,
      imageParams: {
        ...IMAGES_SIZES,
      },
    })($galleryMobile),

    // Gallery (Desktop)
    pdpRendered.render(ProductGallery, {
      controls: 'thumbnailsColumn',
      arrows: true,
      peak: true,
      gap: 'small',
      loop: false,
      imageParams: {
        ...IMAGES_SIZES,
      },
    })($gallery),

    // Header
    pdpRendered.render(ProductHeader, {})($header),

    // Price
    pdpRendered.render(ProductPrice, {})($price),

    // Short Description
    pdpRendered.render(ProductShortDescription, {})($shortDescription),

    // Configuration - Swatches
    pdpRendered.render(ProductOptions, { hideSelectedValue: false })($options),

    // Configuration  Quantity
    pdpRendered.render(ProductQuantity, {})($quantity),

    // Configuration – Button - Add to Cart
    UI.render(Button, {
      children: labels.PDP?.Product?.AddToCart?.label,
      icon: Icon({ source: 'Cart' }),
      onClick: async () => {
        try {
          addToCart.setProps((prev) => ({
            ...prev,
            children: labels.Custom?.AddingToCart?.label,
            disabled: true,
          }));

          // get the current selection values
          const values = pdpApi.getProductConfigurationValues();
          const valid = pdpApi.isProductConfigurationValid();

          // add the product to the cart
          if (valid) {
            const { addProductsToCart } = await import('@dropins/storefront-cart/api.js');

            // Setup enhanced data layer with NASM-specific attributes before adding to cart
            if (product) {
              setupAddToCartDataLayer(product, values.quantity || 1, values.optionsUIDs || []);
              // Track add_to_cart event using Commerce team's GA4 approach
              await trackAddToCartGA4(product, values.quantity || 1);
            }

            await addProductsToCart([{ ...values }]);
          }

          // reset any previous alerts if successful
          inlineAlert?.remove();

          // Scroll to cart icon after successful add-to-cart
          scrollToCartIcon();

          // Show success toast at top
          showSuccessToast('Product added to cart successfully!', 'Added to Cart');
        } catch (error) {
          // Show toast error message
          showErrorToast(error.message, 'Add to Cart Failed');
        } finally {
          addToCart.setProps((prev) => ({
            ...prev,
            children: labels.PDP?.Product?.AddToCart?.label,
            disabled: false,
          }));
        }
      },
    })($addToCart),

    // Configuration - Add to Wishlist
    UI.render(Button, {
      icon: Icon({ source: 'Heart' }),
      variant: 'secondary',
      'aria-label': labels.Custom?.AddToWishlist?.label,
      onClick: async () => {
        try {
          addToWishlist.setProps((prev) => ({
            ...prev,
            disabled: true,
            'aria-label': labels.Custom?.AddingToWishlist?.label,
          }));

          const values = pdpApi.getProductConfigurationValues();

          if (values?.sku) {
            const wishlist = await import('../../scripts/wishlist/api.js');
            await wishlist.addToWishlist(values.sku);
          }
        } catch (error) {
          console.error(error);
        } finally {
          addToWishlist.setProps((prev) => ({
            ...prev,
            disabled: false,
            'aria-label': labels.Custom?.AddToWishlist?.label,
          }));
        }
      },
    })($addToWishlist),

    // Description
    pdpRendered.render(ProductDescription, {})($description),

    // Attributes
    pdpRendered.render(ProductAttributes, {})($attributes),
  ]);

  // Lifecycle Events
  events.on('pdp/valid', (valid) => {
    // update add to cart button disabled state based on product selection validity
    addToCart.setProps((prev) => ({ ...prev, disabled: !valid }));
  }, { eager: true });

  // Set JSON-LD and Meta Tags
  events.on('aem/lcp', () => {
    if (product) {
      setJsonLdProduct(product);
      setMetaTags(product);
      document.title = product.marketing_product_name || product.name;
    }
  }, { eager: true });

  // Update hero video price when product data is available
  /* events.on('pdp/data', (productData) => {
    const priceElement = document.querySelector('.hero-video-price');
    if (priceElement && productData) {
      const amount = productData.prices?.final?.amount;
      if (amount) {
        priceElement.textContent = `$${amount}`;
      }
    }
  }, { eager: true }); */

  // Move hero-usp block to appear after hero-video section if it exists
  try {
    const heroUspBlock = document.querySelector('.hero-usp');
    if (heroUspBlock) {
      const currentSection = block.closest('.section');
      if (currentSection && currentSection.parentNode) {
        // Find the hero-video section that was created earlier
        const heroVideoSection = currentSection.parentNode.querySelector('.hero-video-section');
        const heroUspSection = heroUspBlock.closest('.section');
        if (heroUspSection && heroVideoSection) {
          // Remove the hero-usp section from its current position
          heroUspSection.remove();
          // Insert it after the hero-video section
          heroVideoSection.parentNode.insertBefore(heroUspSection, heroVideoSection.nextSibling);
        }
      }
    }
  } catch (error) {
    // Silently handle hero-usp relocation errors
  }

  return Promise.resolve();
}

async function setJsonLdProduct(product) {
  const {
    name,
    inStock,
    description,
    sku,
    urlKey,
    price,
    priceRange,
    images,
    attributes,
  } = product;
  const amount = priceRange?.minimum?.final?.amount || price?.final?.amount;
  const brand = attributes.find((attr) => attr.name === 'brand');
  const pdpType = attributes.find((attr) => attr.name === 'pdp_type')?.value;

  // get variants
  const { data } = await pdpApi.fetchGraphQl(`
    query GET_PRODUCT_VARIANTS($sku: String!) {
      variants(sku: $sku) {
        variants {
          product {
            sku
            name
            shortDescription
            metaDescription
            metaKeyword
            metaTitle
            description
            inStock
            images(roles: ["image"]) {
              url
            }
            videos {
              url
            }
            ...on SimpleProductView {
              price {
                final { amount { currency value } }
              }
            }
          }
        }
      }
    }
  `, {
    method: 'GET',
    variables: { sku },
  });

  const variants = data?.variants?.variants || [];
  const productUrl = getProductUrlByType(urlKey, sku, pdpType);

  const ldJson = {
    '@context': 'http://schema.org',
    '@type': 'Product',
    name,
    description,
    image: images[0]?.url,
    offers: [],
    productID: sku,
    brand: {
      '@type': 'Brand',
      name: brand?.value,
    },
    url: new URL(rootLink(productUrl), window.location),
    sku,
    '@id': new URL(rootLink(productUrl), window.location),
  };

  if (variants.length > 1) {
    ldJson.offers.push(...variants.map((variant) => ({
      '@type': 'Offer',
      name: variant.product.name,
      image: variant.product.images[0]?.url,
      video: variant.product.videos[0]?.url,
      price: variant.product.price.final.amount.value,
      priceCurrency: variant.product.price.final.amount.currency,
      availability: variant.product.inStock ? 'http://schema.org/InStock' : 'http://schema.org/OutOfStock',
      sku: variant.product.sku,
    })));
  } else {
    ldJson.offers.push({
      '@type': 'Offer',
      price: amount?.value,
      priceCurrency: amount?.currency,
      availability: inStock ? 'http://schema.org/InStock' : 'http://schema.org/OutOfStock',
    });
  }

  setJsonLd(ldJson, 'product');
}

function createMetaTag(property, content, type) {
  if (!property || !type) {
    return;
  }
  let meta = document.head.querySelector(`meta[${type}="${property}"]`);
  if (meta) {
    if (!content) {
      meta.remove();
      return;
    }
    meta.setAttribute(type, property);
    meta.setAttribute('content', content);
    return;
  }
  if (!content) {
    return;
  }
  meta = document.createElement('meta');
  meta.setAttribute(type, property);
  meta.setAttribute('content', content);
  document.head.appendChild(meta);
}

function setMetaTags(product) {
  if (!product) {
    return;
  }

  const price = product.prices.final.minimumAmount ?? product.prices.final.amount;

  createMetaTag('title', product.metaTitle || product.marketing_product_name || product.name, 'name');
  createMetaTag('description', product.metaDescription, 'name');
  createMetaTag('keywords', product.metaKeyword, 'name');

  createMetaTag('og:type', 'product', 'property');
  createMetaTag('og:description', product.shortDescription, 'property');
  createMetaTag('og:title', product.metaTitle || product.marketing_product_name || product.name, 'property');
  createMetaTag('og:url', window.location.href, 'property');
  const mainImage = product?.images?.filter((image) => image.roles.includes('thumbnail'))[0];
  const metaImage = mainImage?.url || product?.images[0]?.url;
  createMetaTag('og:image', metaImage, 'property');
  createMetaTag('og:image:secure_url', metaImage, 'property');
  createMetaTag('product:price:amount', price.value, 'property');
  createMetaTag('product:price:currency', price.currency, 'property');
}
