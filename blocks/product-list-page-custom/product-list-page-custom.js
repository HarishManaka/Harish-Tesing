import {
  h, Component, Fragment, render, createRef,
} from '@dropins/tools/preact.js';
import htm from './htm.js';
import ProductList from './ProductList.js';
import FacetList from './FacetList.js';
import { readBlockConfig, sampleRUM } from '../../scripts/aem.js';
import { priceFieldsFragment, performCatalogServiceQuery } from '../../scripts/commerce.js';
import { rootLink } from '../../scripts/scripts.js';

const html = htm.bind(h);

// You can get this list dynamically via attributeMetadata query
export const ALLOWED_FILTER_PARAMETERS = ['page', 'pageSize', 'sort', 'sortDirection', 'q', 'price', 'plp_price', 'size', 'color_family', 'activity', 'color', 'gender', 'categories', 'course_type', 'focus', 'no_of_nasm_ceus'];

const INITIAL_PAGE_SIZE = 12;
const DEFAULT_PARAMS = {
  page: 1,
  pageSize: INITIAL_PAGE_SIZE,
  sort: 'position',
  sortDirection: 'asc',
};

export const productSearchQuery = (addCategory = false) => `query ProductSearch(
  $currentPage: Int = 1
  $pageSize: Int = 20
  $phrase: String = ""
  $sort: [ProductSearchSortInput!] = []
  $filter: [SearchClauseInput!] = []
  ${addCategory ? '$categoryId: String!' : ''}
) {
  ${addCategory ? `categories(ids: [$categoryId]) {
      name
      urlKey
      urlPath
  }` : ''}
  productSearch(
      current_page: $currentPage
      page_size: $pageSize
      phrase: $phrase
      sort: $sort
      filter: $filter
  ) {
      facets {
          title
          type
          attribute
          buckets {
              title
              __typename
              ... on RangeBucket {
                  count
                  from
                  to
              }
              ... on ScalarBucket {
                  count
                  id
              }
              ... on StatsBucket {
                  max
                  min
              }
          }
      }
      items {
          productView {
              id
              name
              sku
              urlKey
              images(roles: "thumbnail") {
                url
              }
              attributes(roles: []) {
                name
                label
                value
                roles
              }
              __typename
              ... on SimpleProductView {
                  price {
                      ...priceFields
                  }
                  nasm_price {
                      monthly_price
                      strike_out_monthly_price
                      down_payment
                      instalment_type
                      instalment_number
                  }
              }
              ... on ComplexProductView {
                  attributes(roles: []) {
                    name
                    label
                    value
                    roles
                  }
                  nasm_price {
                      monthly_price
                      strike_out_monthly_price
                      down_payment
                      instalment_type
                      instalment_number
                  }
                  priceRange {
                      minimum {
                          ...priceFields
                      }
                      maximum {
                          ...priceFields
                      }
                  }
              }
          }
      }
      page_info {
          current_page
          total_pages
          page_size
      }
      total_count
  }
}
${priceFieldsFragment}`;

async function loadCategory(state) {
  try {
    // Be careful if query exceeds GET size limits, then switch to POST
    const variables = {
      pageSize: state.currentPageSize,
      currentPage: state.currentPage,
      sort: [{
        attribute: state.sort,
        direction: state.sortDirection === 'desc' ? 'DESC' : 'ASC',
      }],
    };

    variables.phrase = state.type === 'search' ? state.searchTerm : '';

    // Always filter for in-stock products
    variables.filter = [{ attribute: 'inStock', eq: 'true' }];

    if (Object.keys(state.filters).length > 0) {
      Object.keys(state.filters).forEach((key) => {
        if (key === 'price' || key === 'plp_price' || key === 'no_of_nasm_ceus') {
          const [from, to] = state.filters[key];
          if (from && to) {
            variables.filter.push({ attribute: key, range: { from, to } });
          }
        } else if (key === 'categories') {
          // For categories, use the 'in' operator with category IDs
          if (state.filters[key] && state.filters[key].length > 0) {
            variables.filter.push({ attribute: 'categoryIds', in: state.filters[key] });
          }
        } else if (state.filters[key].length > 1) {
          variables.filter.push({ attribute: key, in: state.filters[key] });
        } else if (state.filters[key].length === 1) {
          variables.filter.push({ attribute: key, eq: state.filters[key][0] });
        }
      });
    }

    if (state.type === 'category' && state.category.id) {
      variables.categoryId = state.category.id;
      variables.filter = variables.filter || [];
      if (state.category.urlPath) {
        variables.filter.push({ attribute: 'categoryPath', eq: state.category.urlPath });
      } else if (state.category.id) {
        variables.filter.push({ attribute: 'categoryIds', eq: state.category.id });
      }
    }

    window.adobeDataLayer.push((dl) => {
      const requestId = crypto.randomUUID();
      window.sessionStorage.setItem('searchRequestId', requestId);
      const searchInputContext = dl.getState('searchInputContext') ?? { units: [] };
      const searchUnitId = 'livesearch-plp';
      const unit = {
        searchUnitId,
        searchRequestId: requestId,
        queryTypes: ['products', 'suggestions'],
        ...variables,
      };
      const index = searchInputContext.units.findIndex((u) => u.searchUnitId === searchUnitId);
      if (index < 0) {
        searchInputContext.units.push(unit);
      } else {
        searchInputContext.units[index] = unit;
      }
      dl.push({ searchInputContext });
      // TODO: Remove eventInfo once collector is updated
      dl.push({ event: 'search-request-sent', eventInfo: { ...dl.getState(), searchUnitId } });
    });

    const response = await performCatalogServiceQuery(productSearchQuery(state.type === 'category'), variables);

    // Parse response into state
    return {
      pages: Math.max(response.productSearch.page_info.total_pages, 1),
      products: {
        items: response.productSearch.items
          .map((product) => ({ ...product.productView, ...product.product }))
          .filter((product) => product !== null),
        total: response.productSearch.total_count,
      },
      category: { ...state.category, ...response.categories?.[0] ?? {} },
      facets: response.productSearch.facets,
    };
  } catch (e) {
    console.error('Error loading products', e);
    return {
      pages: 1,
      products: {
        items: [],
        total: 0,
      },
      facets: [],
    };
  }
}

function parseQueryParams() {
  const params = new URLSearchParams(window.location.search);
  const newState = {
    filters: {},
  };
  params.forEach((value, key) => {
    if (!ALLOWED_FILTER_PARAMETERS.includes(key)) {
      return;
    }

    if (key === 'page') {
      newState.currentPage = parseInt(value, 10) || 1;
    } else if (key === 'pageSize') {
      newState.currentPageSize = parseInt(value, 10) || INITIAL_PAGE_SIZE;
    } else if (key === 'sort') {
      // Migrate 'price' sort to 'plp_price'
      newState.sort = value === 'price' ? 'plp_price' : value;
    } else if (key === 'sortDirection') {
      newState.sortDirection = value === 'desc' ? 'desc' : 'asc';
    } else if (key === 'q') {
      newState.searchTerm = value;
    } else if (key === 'price' || key === 'plp_price' || key === 'no_of_nasm_ceus') {
      // Migrate 'price' filter to 'plp_price'
      const filterKey = key === 'price' ? 'plp_price' : key;
      newState.filters[filterKey] = value.split(',').map((v) => parseInt(v, 10) || 0);
    } else if (key === 'categories') {
      // For categories, store the IDs directly from the URL
      newState.filters[key] = value.split(',');
    } else {
      newState.filters[key] = value.split(',');
    }
  });
  return newState;
}

export async function preloadCategory(category) {
  const queryParams = parseQueryParams();
  window.loadCategoryPromise = loadCategory({
    pages: DEFAULT_PARAMS.page,
    currentPage: DEFAULT_PARAMS.page,
    category,
    currentPageSize: DEFAULT_PARAMS.pageSize,
    locale: 'en-US',
    currency: 'USD',
    type: 'category',
    sort: DEFAULT_PARAMS.sort,
    sortDirection: DEFAULT_PARAMS.sortDirection,
    ...queryParams,
  }, []); // Pass empty facets array for initial load
}

function LoadMoreIndicator(props) {
  if (props.loading) {
    return html`<div class="load-more-indicator loading">
      <div class="spinner"></div>
      <span>Loading more products...</span>
    </div>`;
  }

  if (!props.hasMore) {
    return html`<div class="load-more-indicator complete">
      <span>All products loaded</span>
    </div>`;
  }

  return null;
}

function Sort(props) {
  const {
    type, disabled, sortMenuRef, onSort,
  } = props;
  const options = [
    { label: 'Price: High to Low', value: 'plp_price-desc' },
    { label: 'Price: Low to High', value: 'plp_price-asc' },
    { label: 'Product Name', value: 'name-asc' },
    { label: 'Best Sellers', value: type === 'category' ? 'position-asc' : 'relevance-desc' },
  ];

  const currentSort = options.find((option) => option.value === `${props.currentSort}-${props.sortDirection}`) || options[3];

  return html`<div class="sort" disabled=${disabled}>
    <button disabled=${disabled}>Sort By: ${currentSort.label}</button>
    <div class="overlay" ref=${sortMenuRef}>
      <button class="close" onClick=${() => sortMenuRef.current.classList.toggle('active')}>Close</button>
      <ul>
        ${options.map((option) => html`<li>
          <a href="#" class="${currentSort.value === option.value ? 'active' : ''}" onClick=${(e) => {
  sortMenuRef.current.classList.toggle('active');
  const [sort, direction = 'asc'] = option.value.split('-');
  onSort?.(sort, direction);
  e.preventDefault();
}}>${option.label}</a>
        </li>`)}
      </ul>
    </div>
  </div>`;
}

class ProductListPage extends Component {
  constructor(props) {
    const {
      type = 'category',
      category,
      urlpath,
    } = props;
    super();

    this.facetMenuRef = createRef();
    this.sortMenuRef = createRef();
    this.secondLastProduct = createRef();

    const queryParams = parseQueryParams();

    let headline = 'Search Results';
    let sort = 'relevance';
    let sortDirection = 'desc';
    if (type === 'category') {
      headline = document.querySelector('.default-content-wrapper > h1')?.innerText;
      sort = 'position';
      sortDirection = 'asc';
    }

    if (type === 'search') {
      sampleRUM('search', { source: '.search-input', target: queryParams.searchTerm });
    }

    this.state = {
      productsLoading: true,
      loadingMore: false,
      hasMoreProducts: true,
      currentPage: DEFAULT_PARAMS.page,
      currentPageSize: DEFAULT_PARAMS.pageSize,
      type,
      category: {
        name: headline,
        id: category || null,
        urlPath: urlpath || null,
      },
      sort,
      sortDirection,
      products: {
        items: [],
        total: 0,
      },
      filters: {},
      facets: [],
      ...queryParams,
    };

    // Ensure we always start with initial page size for infinite scroll
    if (!queryParams.currentPageSize) {
      this.state.currentPageSize = INITIAL_PAGE_SIZE;
    }

    this.filterChange = false;
    this.paginationClick = false;
    this.sortChangeInProgress = false;
  }

  setStatePromise(state) {
    return new Promise((resolve) => {
      this.setState(state, resolve);
    });
  }

  static updateQueryParams = (params) => {
    const newParams = new URLSearchParams();
    Object.keys(params).forEach((key) => {
      if (!ALLOWED_FILTER_PARAMETERS.includes(key)) {
        return;
      }

      if (params[key] === DEFAULT_PARAMS[key]
        && !new URLSearchParams(window.location.search).has(key)) {
        return;
      }

      if (Array.isArray(params[key]) && params[key].length > 0) {
        newParams.set(key, params[key].join(','));
      } else if (!Array.isArray(params[key]) && params[key]) {
        newParams.set(key, params[key]);
      }
    });

    // Keep existing params that do not interfere with the search
    const curentParams = new URLSearchParams(window.location.search);
    curentParams.forEach((value, key) => {
      if (!ALLOWED_FILTER_PARAMETERS.includes(key)) {
        newParams.set(key, value);
      }
    });

    if (newParams.toString() !== curentParams.toString()) {
      window.history.pushState({}, '', `${window.location.pathname}?${newParams.toString()}`);
    }
  };

  loadState = async (state) => {
    // Fallback if hasMoreProducts is undefined - calculate it from the data
    const hasMoreProducts = state.hasMoreProducts !== undefined
      ? state.hasMoreProducts
      : (this.state?.products?.items?.length || 0) < (state.products?.total || 0);

    const newState = {
      ...state,
      productsLoading: false,
      hasMoreProducts, // Ensure it's always properly defined
    };

    await this.setStatePromise(newState);
    if (this.state && this.state.products) {
      this.filterChange = false;
      this.paginationClick = false;
    }
    this.props.resolve();

    if (this.state.productsLoading === false) {
      window.adobeDataLayer.push((dl) => {
        const searchResultsContext = dl.getState('searchResultsContext') ?? { units: [] };
        const searchRequestId = window.sessionStorage.getItem('searchRequestId');
        const searchUnitId = 'livesearch-plp';
        const searchResultUnit = {
          searchUnitId,
          searchRequestId,
          products: this.state.products.items.map((p, index) => ({
            name: (() => {
              const marketingProductName = p.attributes?.find((attr) => attr.name === 'marketing_product_name')?.value;
              return marketingProductName || p.name;
            })(),
            sku: p.sku,
            url: new URL(rootLink(`/products/${p.urlKey}/${p.sku}`), window.location).toString(),
            imageUrl: p.images?.length ? p.images[0].url : '',
            price: p.price?.final?.amount?.value ?? p.priceRange?.minimum?.final?.amount?.value,
            rank: index,
          })),
          categories: [],
          suggestions: [],
          page: this.state.currentPage,
          perPage: this.state.currentPageSize,
          facets: this.state.facets,
        };
        const index = searchResultsContext.units.findIndex((u) => u.searchUnitId === searchUnitId);
        if (index < 0) {
          searchResultsContext.units.push(searchResultUnit);
        } else {
          searchResultsContext.units[index] = searchResultUnit;
        }
        dl.push({ searchResultsContext });
        dl.push({ event: 'search-response-received', eventInfo: { ...dl.getState(), searchUnitId } });
        if (this.props.type === 'search') {
          dl.push({ event: 'search-results-view', eventInfo: { ...dl.getState(), searchUnitId } });
        } else {
          dl.push({
            categoryContext: {
              name: this.state.category.name,
              urlKey: this.state.category.urlKey,
              urlPath: this.state.category.urlPath,
            },
          });
          dl.push({ event: 'category-results-view', eventInfo: { ...dl.getState(), searchUnitId } });
        }
      });
    }
  };

  loadProducts = async (append = false) => {
    if (append) {
      this.setState({ loadingMore: true });
    } else {
      this.setState({ productsLoading: true, currentPage: 1 });
    }
    const state = await loadCategory(this.state);

    if (append) {
      // Append new products to existing ones
      const combinedProducts = {
        items: [...this.state.products.items, ...state.products.items],
        total: state.products.total,
      };

      // Check if we have more products to load
      const totalLoadedProducts = combinedProducts.items.length;
      const totalAvailableProducts = state.products.total;
      const hasMoreProducts = totalLoadedProducts < totalAvailableProducts;

      await this.loadState({
        ...this.state, // Preserve existing state including facets
        products: combinedProducts,
        pages: state.pages,
        loadingMore: false,
        hasMoreProducts,
        // Don't override facets - keep the existing ones
        facets: this.state.facets.length > 0 ? this.state.facets : state.facets,
      });
    } else {
      // Replace products (initial load or filter change)
      const totalLoadedProducts = state.products.items.length;
      const totalAvailableProducts = state.products.total;
      const hasMoreProducts = totalLoadedProducts < totalAvailableProducts;

      await this.loadState({
        ...state,
        hasMoreProducts,
        currentPage: 1, // Reset to page 1 for new loads
        // Preserve the original category from constructor
        category: this.state.category,
      });
    }
  };

  loadMoreProducts = async () => {
    if (this.state.loadingMore || !this.state.hasMoreProducts) {
      return;
    }

    // Set loading state and increment page
    const newPage = this.state.currentPage + 1;
    await this.setStatePromise({
      loadingMore: true,
      currentPage: newPage,
    });

    // Build the request state with the new page number
    const loadMoreState = {
      ...this.state,
      currentPage: newPage, // Use the incremented page number
      currentPageSize: INITIAL_PAGE_SIZE, // Keep consistent page size
    };

    const state = await loadCategory(loadMoreState);

    // If no products returned, don't continue
    if (!state.products.items || state.products.items.length === 0) {
      await this.loadState({
        ...this.state,
        loadingMore: false,
        hasMoreProducts: false,
      });
      return;
    }

    // Append new products to existing ones
    const combinedProducts = {
      items: [...this.state.products.items, ...state.products.items],
      total: state.products.total,
    };

    // Check if we have more products to load
    const totalLoadedProducts = combinedProducts.items.length;
    const totalAvailableProducts = state.products.total;
    const hasMoreProducts = totalLoadedProducts < totalAvailableProducts;

    await this.loadState({
      ...this.state, // Preserve existing state including facets
      products: combinedProducts,
      pages: state.pages,
      loadingMore: false,
      hasMoreProducts,
      currentPage: newPage, // Ensure the page number is updated
      // Preserve the original category information - don't let API override it
      category: this.state.category,
      // Don't override facets - keep the existing ones
      facets: this.state.facets.length > 0 ? this.state.facets : state.facets,
    });
  };

  updateInfiniteScrollObserver = () => {
    if (this.infiniteScrollObserver) {
      // Clear all previous observations
      this.infiniteScrollObserver.disconnect();

      // Use longer delay for sort changes, shorter for normal updates
      const delay = this.sortChangeInProgress ? 300 : 100;
      setTimeout(() => {
        if (this.secondLastProduct.current) {
          this.infiniteScrollObserver.observe(this.secondLastProduct.current);
        }
      }, delay);
    }
  };

  componentWillUnmount() {
    if (this.infiniteScrollObserver) {
      this.infiniteScrollObserver.disconnect();
    }
  }

  async componentDidMount() {
    if (window.loadCategoryPromise) {
      const state = await window.loadCategoryPromise;

      // Calculate hasMoreProducts for preloaded state
      const totalLoadedProducts = state.products.items.length;
      const totalAvailableProducts = state.products.total;
      const hasMoreProducts = totalLoadedProducts < totalAvailableProducts;

      await this.loadState({
        ...state,
        hasMoreProducts,
        currentPage: 1, // Ensure we start from page 1
        // Preserve the original category from constructor - don't let API override it
        category: this.state.category,
      });
    } else {
      await this.loadProducts();
    }

    // Infinite scroll observer
    if ('IntersectionObserver' in window) {
      this.infiniteScrollObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (this.state.hasMoreProducts
              && !this.state.loadingMore
              && !this.state.productsLoading) {
              this.loadMoreProducts();
            }
          }
        });
      }, {
        // Start loading when 200px away from the target
        rootMargin: '200px',
        threshold: 0.1,
      });

      // Start observing the trigger element
      setTimeout(() => {
        this.updateInfiniteScrollObserver();
      }, 500);
    }
  }

  componentDidUpdate(_, prevState) {
    // Skip if sort change is in progress to prevent double loading
    if (this.sortChangeInProgress) return;

    // Update URL (remove page parameter for infinite scroll)
    ProductListPage.updateQueryParams({
      pageSize: this.state.currentPageSize,
      sort: this.state.sort,
      sortDirection: this.state.sortDirection,
      q: this.state.searchTerm,
      ...this.state.filters,
    });

    // Load new products if filters or sort have changed (but not currentPage for infinite scroll)
    const diff = Object.keys(Object.keys(prevState).reduce((acc, key) => {
      if (prevState[key] !== this.state[key]) {
        acc[key] = this.state[key];
      }
      return acc;
    }, {}));

    const keysToCheck = ['filters', 'sort', 'sortDirection', 'searchTerm'];
    if (keysToCheck.some((key) => diff.includes(key))) {
      // Reset infinite scroll state when filters change
      this.setState({
        currentPage: 1,
        currentPageSize: INITIAL_PAGE_SIZE, // Reset to initial page size
        hasMoreProducts: true,
      }, () => {
        this.loadProducts(false); // false = replace products, not append
      });
    }

    // Update infinite scroll observer when products change
    if (prevState.products.items.length !== this.state.products.items.length) {
      setTimeout(() => this.updateInfiniteScrollObserver(), 100);
    }
  }

  handleFilterChange = async (filters) => {
    const newState = {
      ...this.state,
      filters,
      currentPage: 1, // Reset to first page when filters change
      currentPageSize: INITIAL_PAGE_SIZE, // Reset to initial page size
      hasMoreProducts: true, // Reset infinite scroll
    };

    // Update URL without page refresh
    const params = new URLSearchParams(window.location.search);
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value.length > 0) {
        params.set(key, value.join(','));
      } else {
        params.delete(key);
      }
    });
    const url = `${window.location.pathname}?${params.toString()}`;
    window.history.pushState({}, '', url);

    // Update state and reload products (replace, not append)
    await this.setStatePromise(newState);
    await this.loadProducts(false);
  };

  handleSortChange = async (sort, direction) => {
    // Set flag to prevent double loading in componentDidUpdate
    this.sortChangeInProgress = true;

    // Update state with new sort parameters
    await this.setStatePromise({
      sort,
      sortDirection: direction,
      currentPage: 1, // Reset to first page when sorting changes
      hasMoreProducts: true, // Explicitly reset infinite scroll state
    });

    // Update URL with new sort parameters
    ProductListPage.updateQueryParams({
      pageSize: this.state.currentPageSize,
      sort: this.state.sort,
      sortDirection: this.state.sortDirection,
      q: this.state.searchTerm,
      ...this.state.filters,
    });

    // Reload products with new sort order (replace, not append)
    await this.loadProducts(false);

    // Explicitly update observer after products load with longer delay for sort changes
    setTimeout(() => {
      this.updateInfiniteScrollObserver();
      this.sortChangeInProgress = false;
    }, 300);
  };

  render(props, state) {
    const { type = 'category' } = props;

    // Calculate actual max price based on product data and facet buckets
    let actualMaxPrice = 0;

    if (state.facets && state.facets.length > 0) {
      const priceFacet = state.facets.find((f) => f.attribute === 'plp_price');
      if (priceFacet && priceFacet.buckets) {
        // Get all buckets that have products
        const bucketsWithProducts = priceFacet.buckets.filter(
          (bucket) => bucket.count && bucket.count > 0,
        );

        if (bucketsWithProducts.length > 0) {
          // Sort buckets by their 'from' value to find the actual range
          bucketsWithProducts.sort((a, b) => (a.from || 0) - (b.from || 0));

          const highestBucket = bucketsWithProducts[bucketsWithProducts.length - 1];

          // For buckets with very few products, use a smart estimation
          const bucketRange = (highestBucket.to || 0) - (highestBucket.from || 0);
          const isSparseBucket = highestBucket.count <= 2; // Very few products in this range
          const isWideRange = bucketRange > 100; // Range is wider than $100

          if (isSparseBucket && isWideRange) {
            // Estimate actual max price as bucket.from + reasonable margin
            // This assumes products are closer to the lower end of sparse, wide ranges
            const estimatedMax = (highestBucket.from || 0) + Math.min(bucketRange * 0.4, 100);
            actualMaxPrice = Math.round(estimatedMax);
          } else {
            // Use the bucket's 'to' value for dense buckets or narrow ranges
            actualMaxPrice = highestBucket.to || 0;
          }
        } else {
          // Fallback to highest bucket 'to' value if no products found
          actualMaxPrice = Math.max(...priceFacet.buckets.map((b) => b.to || 0));
        }
      }
    }

    return html`<${Fragment}>
    <${FacetList}
      facets=${state.facets}
      filters=${state.filters}
      facetMenuRef=${this.facetMenuRef}
      onFilterChange=${this.handleFilterChange}
      loading=${false}
      actualMaxPrice=${actualMaxPrice} />
    <div class="products">
      <div class="title">
        <!--<h2>${state.category.name}</h2>-->
        ${!state.productsLoading && html`<span>${state.products.total} ${state.products.total === 1 ? 'Product' : 'Products'}</span>`}
        <${Sort}
          disabled=${state.productsLoading}
          currentSort=${state.sort}
          sortDirection=${state.sortDirection}
          type=${type}
          onSort=${this.handleSortChange}
          sortMenuRef=${this.sortMenuRef} />
      </div>
      <div class="mobile-menu">
        <button disabled=${state.productsLoading} id="toggle-filters" onClick=${() => {
  this.facetMenuRef.current.classList.toggle('active');
  // Prevent body scrolling when filters sidebar is active
  document.body.classList.toggle('filters-active', this.facetMenuRef.current.classList.contains('active'));
}}>Filters</button>
        <button disabled=${state.productsLoading} id="toggle-sortby" onClick=${() => this.sortMenuRef.current.classList.toggle('active')}>Sort By</button>
      </div>
      <${ProductList}
        products=${state.products}
        secondLastProduct=${this.secondLastProduct}
        loading=${state.productsLoading}
        currentPageSize=${state.currentPageSize} />
      <${LoadMoreIndicator}
        loading=${state.loadingMore}
        hasMore=${state.hasMoreProducts} />
    </div>
  </>`;
  }
}

export default async function decorate(block) {
  const config = readBlockConfig(block);

  block.textContent = '';
  block.dataset.category = config.category;
  block.dataset.urlpath = config.urlpath;

  return new Promise((resolve) => {
    const app = html`<${ProductListPage} ...${config} block=${block} resolve=${resolve} />`;
    render(app, block);
  });
}
