import { events } from '@dropins/tools/event-bus.js';
import { setEndpoint, setFetchGraphQlHeader } from '@dropins/tools/fetch-graphql.js';
import { loadCSS } from '../../scripts/aem.js';
import { rootLink } from '../../scripts/scripts.js';
import { getConfigValue } from '../../scripts/configs.js';
import { getProductUrlByType } from '../../scripts/commerce.js';

// Load the searchbar CSS
loadCSS('/blocks/header/searchbar.css');

// Track initialization to prevent duplicate setup per instance
const initializationState = new Map();

/**
 * Unified searchbar using @dropins/storefront-product-discovery
 * Works for both desktop and mobile navigation
 *
 * Features:
 * - Real-time product search with debounced input
 * - Proper URL routing using pdp_type attributes
 * - Supports all 5 NASM product types
 * - Responsive design (desktop: 4 products, mobile: 3 products)
 * - Configurable input and container elements
 *
 * @param {Object} config - Configuration object
 * @param {string} config.searchInputId - ID of the search input element (default: 'search')
 * @param {string} config.autocompleteContainerId - ID of the autocomplete container
 * @param {boolean} config.isMobile - Whether this is for mobile view (default: false)
 * @param {number} config.pageSize - Number of products to show (default: 4 or 3 for mobile)
 * @returns {Function|undefined} Cleanup function for removing event listeners
 */
export default async function initSearchDropin(config = {}) {
  // Default configuration
  const {
    searchInputId = 'search',
    autocompleteContainerId = 'search_autocomplete',
    isMobile = false,
    pageSize = isMobile ? 3 : 4,
  } = config;

  // Create unique key for this instance
  const instanceKey = `${searchInputId}-${autocompleteContainerId}`;

  // Prevent duplicate initialization
  if (initializationState.get(instanceKey)) {
    return undefined;
  }
  initializationState.set(instanceKey, true);

  // Initialize the GraphQL endpoint and headers
  // Use Edge API endpoint for product search (same as search page)
  setEndpoint(getConfigValue('commerce-endpoint'));

  // Set required headers for product discovery
  const csHeaders = getConfigValue('headers.cs');
  if (csHeaders) {
    Object.entries(csHeaders).forEach(([key, value]) => {
      setFetchGraphQlHeader(key, value);
    });
  }

  // Add the Store header from headers.all
  const allHeaders = getConfigValue('headers.all');
  if (allHeaders) {
    Object.entries(allHeaders).forEach(([key, value]) => {
      setFetchGraphQlHeader(key, value);
    });
  }

  // Get the search function from the dropin
  const { search } = await import('@dropins/storefront-product-discovery/api.js');

  // Get DOM elements
  const searchInput = document.querySelector(`#${searchInputId}`);
  const autocompleteContainer = document.querySelector(`#${autocompleteContainerId}`);

  if (!searchInput || !autocompleteContainer) {
    console.warn(`Search elements not found - Input: ${searchInputId}, Container: ${autocompleteContainerId}`);
    initializationState.delete(instanceKey);
    return undefined;
  }

  // Add dropin classes to container
  autocompleteContainer.classList.add('search-bar-result', 'dropin-design');
  if (isMobile) {
    autocompleteContainer.classList.add('mobile-search-results');
  }
  autocompleteContainer.setAttribute('data-dropin-container', isMobile ? 'mobile-search-results' : 'search-results');

  // Track current search phrase
  let currentSearchPhrase = '';
  let searchTimeout;

  // Create the search results container structure
  function createSearchResultsStructure() {
    const imageWidth = isMobile ? 80 : 400;
    const imageHeight = isMobile ? 90 : 450;
    const gridClass = isMobile ? 'product-discovery-product-list__grid product-discovery-product-list__grid--mobile' : 'product-discovery-product-list__grid';
    const buttonClass = isMobile ? 'dropin-button dropin-button--medium dropin-button--secondary mobile-view-all' : 'dropin-button dropin-button--medium dropin-button--secondary';
    const containerClass = isMobile ? 'product-discovery-product-list mobile-product-list' : 'product-discovery-product-list';

    return `
      <div class="${containerClass}" style="--imageWidth: ${imageWidth}; --imageHeight: ${imageHeight};">
        <div class="product-discovery-product-list__header">
          <div data-slot="Header"></div>
        </div>
        <div class="${gridClass}"></div>
        <div class="product-discovery-product-list__footer">
          <div data-slot="Footer">
            <div data-slot-html-element="div">
              <a href="${rootLink('/search')}?q=${encodeURIComponent(currentSearchPhrase)}" 
                 class="${buttonClass}">
                <span>${isMobile ? 'View all results' : 'View all'}</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Fetch product attributes for search results to get pdp_type
  async function fetchProductAttributes(skus) {
    try {
      const { fetchGraphQl } = await import('@dropins/tools/fetch-graphql.js');

      const query = `
        query getProductAttributes($skus: [String!]!) {
          productSearch(
            phrase: ""
            filter: [{ attribute: "sku", in: $skus }]
          ) {
            items {
              productView {
                sku
                attributes {
                  name
                  value
                }
              }
            }
          }
        }
      `;

      const response = await fetchGraphQl(query, {
        variables: { skus },
      });

      if (response.errors) {
        console.error('Error fetching product attributes:', response.errors);
        return {};
      }

      // Create a map of sku -> pdp_type
      const attributeMap = {};
      response.data?.productSearch?.items?.forEach((item) => {
        const product = item.productView;
        if (product && product.attributes) {
          const pdpTypeAttr = product.attributes.find((attr) => attr.name === 'pdp_type');
          if (pdpTypeAttr) {
            attributeMap[product.sku] = pdpTypeAttr.value;
          }
        }
      });

      return attributeMap;
    } catch (error) {
      console.error('Failed to fetch product attributes:', error);
      return {};
    }
  }

  // Render product card (responsive for mobile/desktop)
  function renderProductCard(product, pdpTypeMap = {}) {
    const productData = product.productView || product;
    const urlKey = productData.urlKey || productData.url_key || productData.url || '';
    const sku = productData.sku || '';
    const name = productData.name || 'Unnamed Product';

    // Get pdp_type from the fetched attributes or fallback to default
    const pdpType = pdpTypeMap[sku];

    // Generate proper URL using pdp_type routing
    const productUrl = pdpType
      ? rootLink(getProductUrlByType(urlKey, sku, pdpType))
      : rootLink(`/products/${urlKey}/${sku}`);

    // Get primary image
    const images = productData.images || [];
    const primaryImage = images.find((img) => img.roles?.includes('thumbnail')) || images[0];
    const imageUrl = primaryImage?.url || productData.image?.url || '/icons/product-placeholder.svg';

    // Handle price display
    let priceHtml = '';
    if (productData.priceRange) {
      const minPrice = productData.priceRange.minimum?.final?.amount?.value
                       || productData.priceRange.minimum?.regular?.amount?.value;
      const maxPrice = productData.priceRange.maximum?.final?.amount?.value
                       || productData.priceRange.maximum?.regular?.amount?.value;

      if (minPrice && maxPrice && minPrice !== maxPrice) {
        const priceClass = isMobile ? 'dropin-price-range dropin-price-range--mobile' : 'dropin-price-range';
        priceHtml = `
          <div class="${priceClass}">
            <span class="dropin-price-range__from dropin-price-range__from--small">From</span>
            <span class="dropin-price dropin-price--default dropin-price--small dropin-price--bold">$${minPrice.toFixed(2)}</span>
            ${!isMobile ? `
              <span class="dropin-price-range__to dropin-price-range__to--small">To</span>
              <span class="dropin-price dropin-price--default dropin-price--small dropin-price--bold">$${maxPrice.toFixed(2)}</span>
            ` : ''}
          </div>
        `;
      } else if (minPrice) {
        const priceClass = isMobile ? 'dropin-price-range dropin-price-range--mobile' : 'dropin-price-range';
        priceHtml = `
          <div class="${priceClass}">
            <span class="dropin-price dropin-price--default dropin-price--small dropin-price--bold">$${minPrice.toFixed(2)}</span>
          </div>
        `;
      }
    } else if (productData.price) {
      const finalPrice = productData.price.final?.amount?.value
                        || productData.price.regular?.amount?.value;
      if (finalPrice) {
        const priceClass = isMobile ? 'dropin-price-range dropin-price-range--mobile' : 'dropin-price-range';
        priceHtml = `
          <div class="${priceClass}">
            <span class="dropin-price dropin-price--default dropin-price--small dropin-price--bold">$${finalPrice.toFixed(2)}</span>
          </div>
        `;
      }
    }

    // Responsive card layout
    const cardClass = isMobile ? 'dropin-product-item-card dropin-product-item-card--mobile' : 'dropin-product-item-card';
    const imageContainerClass = isMobile ? 'dropin-product-item-card__image-container dropin-product-item-card__image-container--mobile' : 'dropin-product-item-card__image-container';
    const contentClass = isMobile ? 'dropin-product-item-card__content dropin-product-item-card__content--mobile' : 'dropin-product-item-card__content';
    const titleClass = isMobile ? 'dropin-product-item-card__title dropin-product-item-card__title--mobile' : 'dropin-product-item-card__title';
    const imageClass = isMobile ? 'dropin-image dropin-image--loaded dropin-image--mobile' : 'dropin-image dropin-image--loaded';
    const imageWidth = isMobile ? 80 : 400;
    const imageHeight = isMobile ? 90 : 450;

    return `
      <div class="${cardClass}">
        <div class="${imageContainerClass}">
          <div data-slot="ProductImage" class="dropin-product-item-card__image">
            <div data-slot-html-element="a">
              <a href="${productUrl}" class="dropin-design">
                <img alt="${name}" 
                     width="${imageWidth}" 
                     height="${imageHeight}" 
                     loading="eager" 
                     src="${imageUrl}"
                     class="${imageClass}">
              </a>
            </div>
          </div>
        </div>
        <div class="${contentClass}">
          <div data-slot="ProductName" class="${titleClass}">
            <a href="${productUrl}">${name}</a>
          </div>
          <div class="dropin-product-item-card__price">
            <div data-slot="ProductPrice" class="dropin-product-item-card__price">
              <a href="${productUrl}">
                <div>${priceHtml}</div>
              </a>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Handle search loading state
  const handleSearchLoading = (loading) => {
    if (loading) {
      const loadingClass = isMobile ? 'search-loading mobile-search-loading' : 'search-loading';
      autocompleteContainer.innerHTML = `<div class="${loadingClass}">Searching...</div>`;
      autocompleteContainer.style.display = 'block';
    }
  };

  // Handle search results
  const handleSearchResult = async (event) => {
    const data = event.detail || event;
    const result = data.result || data;

    // Check if we have a search request but no results
    if (result && data.request && data.request.phrase
        && (!result.items || result.items.length === 0)) {
      const noResultsClass = isMobile ? 'search-no-results mobile-search-no-results' : 'search-no-results';
      autocompleteContainer.innerHTML = `
        <div class="${noResultsClass}">
          <p>No products found for "<strong>${data.request.phrase}</strong>"</p>
          <p class="search-no-results-suggestion">Try adjusting your search terms</p>
        </div>
      `;
      autocompleteContainer.style.display = 'block';
      return;
    }

    if (!result || !result.items || result.items.length === 0) {
      autocompleteContainer.style.display = 'none';
      return;
    }

    // Create container structure
    autocompleteContainer.innerHTML = createSearchResultsStructure();

    // Get the grid container
    const gridContainer = autocompleteContainer.querySelector('.product-discovery-product-list__grid');

    if (gridContainer) {
      // Render products based on page size
      const productsToShow = result.items.slice(0, pageSize);

      // Show loading state while fetching attributes
      const loadingClass = isMobile ? 'search-loading mobile-search-loading' : 'search-loading';
      gridContainer.innerHTML = `<div class="${loadingClass}">${isMobile ? 'Loading products...' : 'Loading product details...'}</div>`;

      // Fetch product attributes for pdp_type
      const skus = productsToShow.map((product) => product.sku);
      const pdpTypeMap = await fetchProductAttributes(skus);

      // Clear loading and render products with proper URLs
      gridContainer.innerHTML = '';
      productsToShow.forEach((product) => {
        gridContainer.innerHTML += renderProductCard(product, pdpTypeMap);
      });
    }

    // Update view all link
    const viewAllLink = autocompleteContainer.querySelector('a.dropin-button, a.mobile-view-all');
    if (viewAllLink) {
      viewAllLink.href = `${rootLink('/search')}?q=${encodeURIComponent(currentSearchPhrase)}`;
    }

    autocompleteContainer.style.display = 'block';
  };

  // Use 'popover' scope for all search instances
  const scopeId = 'popover';

  // Store event subscriptions for cleanup
  const subscriptions = [];

  // Also listen to non-scoped events for compatibility
  subscriptions.push(
    events.on(`${scopeId}/search/loading`, (loading) => {
      handleSearchLoading(loading);
    }, { eager: true }),
  );
  subscriptions.push(
    events.on(`${scopeId}/search/result`, (data) => {
      handleSearchResult(data);
    }, { eager: true }),
  );

  // Handle search input
  const handleSearchInput = (value) => {
    currentSearchPhrase = value;

    // Clear timeout if exists
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    if (!value) {
      // Clear search when empty
      search(null, { scope: scopeId });
      autocompleteContainer.style.display = 'none';
      return;
    }

    if (value.length < 3) {
      // Don't search for less than 3 characters
      autocompleteContainer.style.display = 'none';
      return;
    }

    // Debounce search to avoid too many requests
    searchTimeout = setTimeout(() => {
      // Perform search
      search({
        phrase: value,
        pageSize,
      }, { scope: scopeId });
    }, 300);
  };

  // Handle clear button click
  const clearSearchResults = () => {
    // Clear the autocomplete container content and hide it
    autocompleteContainer.innerHTML = '';
    autocompleteContainer.style.display = 'none';
    // Clear the search state
    search(null, { scope: scopeId });
    currentSearchPhrase = '';
  };

  // Attach event listeners
  searchInput.addEventListener('input', (e) => {
    handleSearchInput(e.target.value);
    // Also check if input was cleared
    if (e.target.value === '') {
      clearSearchResults();
    }
  });

  // Find clear button for this search input
  const clearButtonSelector = isMobile ? '.mobile-nav-search-clear' : '.nav-search-clear';
  const clearButton = searchInput.parentElement?.querySelector(clearButtonSelector)
                     || document.querySelector(`[data-search-clear="${searchInputId}"]`);
  if (clearButton) {
    clearButton.addEventListener('click', () => {
      clearSearchResults();
    });
  }

  // Hide dropdown when clicking outside
  const handleOutsideClick = (e) => {
    if (!searchInput.contains(e.target) && !autocompleteContainer.contains(e.target)) {
      autocompleteContainer.style.display = 'none';
    }
  };

  document.addEventListener('click', handleOutsideClick);

  // Show dropdown when focusing on search with existing value
  searchInput.addEventListener('focus', (e) => {
    if (e.target.value && e.target.value.length >= 3) {
      handleSearchInput(e.target.value);
    }
  });

  // Return cleanup function
  return () => {
    // Remove event listeners
    document.removeEventListener('click', handleOutsideClick);

    // Clean up event subscriptions
    subscriptions.forEach((subscription) => {
      if (subscription && typeof subscription.off === 'function') {
        subscription.off();
      }
    });

    // Clear initialization state
    initializationState.delete(instanceKey);

    // Clear any pending timeouts
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
  };
}

// Default export is already defined above
