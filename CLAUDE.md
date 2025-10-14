# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
This is an Adobe Edge Delivery Services (EDS) e-commerce project with AEM authoring integration for the National Academy of Sports Medicine (NASM) website. It integrates with Adobe Commerce (Magento) for product catalog, cart, and checkout functionality.

## Key Commands

### Development
- `npm start` - Start the AEM development server on http://localhost:3000
- `npm run lint` - Run ESLint and Stylelint to check code quality
- `npm run build:json` - Manually build/merge component JSON files (also runs automatically on commit)

### Testing
- `npm run test:cy` - Run Cypress E2E tests locally
- `npm run test:cy:ui` - Run Cypress tests with UI
- `npm run test:cy:debug` - Debug Cypress tests

### Commerce Dropins
- `npm run install:dropins` - Install/update dropin commerce components
- `npx --yes update-dropins@latest` - Update dropins to latest version

## Architecture

### Core Structure
- **blocks/** - Custom block components (e.g., commerce-cart, commerce-checkout, product-details)
- **scripts/** - Core JavaScript including dropins integration and commerce services
- **models/** - Component model definitions (JSON files starting with _)
- **styles/** - Global CSS files and theming

### Commerce Integration
The project uses Adobe Commerce dropins for key e-commerce functionality:
- Cart operations via `@dropins/storefront-cart`
- Checkout flow via `@dropins/storefront-checkout`
- Account management via `@dropins/storefront-account`
- Product display via `@dropins/storefront-pdp`
- **Live Search** via `@dropins/storefront-product-discovery` (searchbar-dropin.js)

### Block Development Pattern
1. Create block folder under `blocks/`
2. Add block.js file exporting default decorator function
3. Define component model in `models/_blockname.json`
4. Add block name to `models/_common-blocks.json` array
5. Add block reference to `models/_component-definition.json` in the "Blocks" section:
   ```json
   {
     "...": "../blocks/your-block-name/_*.json#/definitions"
   }
   ```
6. When you commit, a pre-commit hook automatically:
   - Detects changes to any `_*.json` files
   - Runs `npm run build:json` to merge all partial JSON files
   - Generates/updates `component-models.json`, `component-definition.json`, and `component-filters.json`
   - Adds these generated files to your commit

### Important Files
- `scripts/dropins.js` - Initializes all commerce dropin components
- `scripts/commerce.js` - Commerce API integration and services
- `scripts/scripts.js` - Core EDS functionality and initialization
- `config.json` - Commerce endpoint configuration

## Code Standards
- ESLint with Airbnb base configuration
- No console.log statements (use console.warn, console.error, console.info, or console.debug)
- Always include .js extension in imports
- Unix line endings (LF) required
- Stylelint for CSS files

### Storybook Viewport Configuration
When creating Storybook stories, configure viewport using globals to ensure proper responsive testing:
- **Available viewports**: desktop, tablet, mobile1 (small mobile 375px), mobile2 (large mobile 428px)
- **URL parameter**: The viewport is controlled via globals in the URL (e.g., `?globals=viewport.value:desktop;viewport.isRotated:!undefined`)
- **Story configuration**: Use `globals` property to set viewport for each story
- **Multiple mobile variants**: Always create both SmallMobileView (mobile1) and LargeMobileView (mobile2) story variants
- **Documentation**: Include the URL globals format in story descriptions for clarity

Example story configuration:
```javascript
export const Default = Template.bind({});
Default.storyName = 'Default View';
Default.globals = {
  viewport: {
    value: 'desktop',  // Sets viewport size
    isRotated: false,  // Portrait/landscape orientation
  },
};
Default.parameters = {
  docs: {
    description: {
      story: 'Description. URL: globals=viewport.value:desktop',
    },
  },
};

// Mobile variants
export const SmallMobileView = Template.bind({});
SmallMobileView.globals = {
  viewport: { value: 'mobile1', isRotated: false },
};

export const LargeMobileView = Template.bind({});
LargeMobileView.globals = {
  viewport: { value: 'mobile2', isRotated: false },
};
```

### CSS Nesting Standards
Native CSS nesting is now fully supported across all major browsers with production-ready status:
- **Browser Support**: Chrome 120+, Safari 17.2+, Firefox 117+, Edge 120+ (relaxed syntax)
- **Cascade-correct Support**: Chrome 130+, Safari 18.2+, Firefox 132+, Edge 130+ (CSSNestedDeclarations)
- **Preferred Style**: Use native CSS nesting for all new CSS code and refactoring
- **Best Practices**:
  - Limit nesting to 2-3 levels maximum to avoid specificity issues
  - Use `&` ampersand selector explicitly for clarity even when not required
  - Prefer nested syntax over repetitive selectors for better maintainability
  - **NEVER use BEM-style abbreviations** like `&__element` or `&--modifier` - always write out full class names for better readability and maintainability
  
Example of preferred nested style:
```css
.card {
  border: 1px solid #ccc;
  border-radius: 8px;
  
  & h2 {
    color: navy;
    font-size: 1.5rem;
  }
  
  &:hover {
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  }
  
  &.featured {
    border-color: gold;
  }
  
  /* Use full class names, not BEM abbreviations */
  & .card-header {  /* Good - explicit class name */
    padding: 1rem;
  }
  
  /* NOT: &__header { } - Avoid BEM abbreviations */
}
```

## Commerce Services
The project exposes global commerce services via `window.adobeCommerce`:
- `getCart()` - Retrieve current cart
- `addToCart()` - Add products to cart
- `updateCart()` - Update cart items
- `removeFromCart()` - Remove cart items
- Event emitters for cart/checkout state changes

## Multi-store Configuration
Store views are configured in config.json:
- B2C: Consumer store (default)
- B2B: Business/affiliate store
Store view affects pricing, catalog, and checkout options

## Live Search Implementation

### Overview
The live search functionality uses Adobe Commerce's Edge API and the `@dropins/storefront-product-discovery` package to provide real-time product search results in a dropdown.

### Key Files
- **`blocks/header/searchbar-dropin.js`** - Main search implementation using dropins
- **`blocks/nav/desktop-nav-root.js`** - Desktop navigation that initializes search
- **`config.json`** - Contains API endpoints and headers configuration

### Configuration
The search uses two different endpoints defined in `config.json`:
- **`commerce-core-endpoint`** - Adobe Commerce GraphQL API (not used for search)
- **`commerce-endpoint`** - Edge API endpoint (used for search to match search page)

Required headers are configured in:
- **`headers.cs`** - Commerce-specific headers (Magento-Store-Code, etc.)
- **`headers.all`** - General headers (Store header)

### Features
- **Minimum 3 characters** required to trigger search
- **Debounced input** (300ms delay) to reduce API calls
- **Product cards** display with images, names, and price ranges
- **"No results" message** when search returns empty
- **Clear button** (X) clears both input and results
- **Click outside** to close dropdown
- **View all link** navigates to search page with query

### Implementation Details

#### Initialization
```javascript
// In desktop-nav-root.js, search is initialized when panel opens
await import('../header/searchbar-dropin.js').then((module) => {
  if (module.default) {
    module.default();
  }
});
```

#### Clear Functionality
The clear button dispatches an input event to ensure results are cleared:
```javascript
// In desktop-nav-root.js
this.searchInput.dispatchEvent(new Event('input', { bubbles: true }));
```

#### API Configuration
```javascript
// Uses Edge API endpoint for consistency with search page
setEndpoint(getConfigValue('commerce-endpoint'));

// Sets all required headers
const csHeaders = getConfigValue('headers.cs');
const allHeaders = getConfigValue('headers.all');
```

### Troubleshooting

#### Search not returning results
1. **Check endpoint configuration** - Ensure using `commerce-endpoint` (Edge API)
2. **Verify headers** - Both `headers.cs` and `headers.all` must be set
3. **Check network tab** - Look for GraphQL requests to Edge API

#### Duplicate search requests
- Ensure `initSearchDropin()` is only called once (initialization flag prevents duplicates)
- Check that search panel isn't being opened multiple times

#### Clear button not working
- Verify the input event is being dispatched after clearing value
- Check that `clearSearchResults()` function is being called

#### Results not displaying
1. Check browser console for GraphQL errors
2. Verify the autocomplete container element exists
3. Ensure CSS is loaded (`/blocks/header/searchbar.css`)

### Search Events
The implementation uses Adobe's event bus for search state:
- `search/loading` - Triggered when search starts
- `search/result` - Triggered when results are received
- `popover/search/result` - Popover-specific search results

### Product URL Structure
Product links follow the pattern: `/products/{urlKey}/{sku}`
Example: `/products/exclusive-bundle/exclusive-bundle`