# Live Search Implementation

## Overview
This document describes the live search functionality implemented for the NASM e-commerce site using Adobe Commerce dropins and Edge API.

## Architecture

### Components
1. **searchbar-dropin.js** - Main search implementation using `@dropins/storefront-product-discovery`
2. **desktop-nav-root.js** - Desktop navigation component that manages search panel
3. **searchbar.css** - Styles for search dropdown and product cards

### Data Flow
```
User Input → Debounce (300ms) → GraphQL Query → Edge API → Product Results → Render Cards
```

## Key Features

### Search Behavior
- **Minimum Characters**: 3 characters required to trigger search
- **Debouncing**: 300ms delay prevents excessive API calls
- **Max Results**: Displays up to 4 products in dropdown
- **Scope**: Uses 'popover' scope to separate from main search page

### User Interface
- **Product Cards**: Display product image, name, and price range
- **No Results Message**: Shows helpful message when no products found
- **Clear Button**: X button clears both input and results
- **View All Link**: Navigate to search page with current query
- **Click Outside**: Closes dropdown when clicking elsewhere

## Configuration

### Endpoints (config.json)
```json
{
  "commerce-core-endpoint": "https://na1.api.commerce.adobe.com/...",  // Not used for search
  "commerce-endpoint": "https://edge-graph.adobe.io/api/..."           // Used for search
}
```

### Required Headers
```json
{
  "headers": {
    "all": {
      "Store": "default"  // Required for Edge API
    },
    "cs": {
      "Magento-Customer-Group": "...",
      "Magento-Store-Code": "main_website_store",
      "Magento-Store-View-Code": "default",
      "Magento-Website-Code": "base",
      "x-api-key": "not_used",
      "Magento-Environment-Id": "..."
    }
  }
}
```

## Implementation Details

### Initialization Flow
1. User clicks search button in navigation
2. `desktop-nav-root.js` opens search panel
3. Dynamically imports `searchbar-dropin.js`
4. Initializes GraphQL endpoint and headers
5. Sets up event listeners for input and clear button

### Preventing Duplicate Initialization
```javascript
// Track initialization to prevent duplicate setup
let isInitialized = false;

export default async function initSearchDropin() {
  if (isInitialized) {
    return;
  }
  isInitialized = true;
  // ... initialization code
}
```

### Clear Button Implementation
The clear button requires special handling to ensure both input and results are cleared:

```javascript
// In desktop-nav-root.js
this.searchClearButton.addEventListener('click', () => {
  this.searchInput.value = '';
  this.searchClearButton.style.display = 'none';
  this.searchInput.focus();
  // Dispatch input event to trigger search result clearing
  this.searchInput.dispatchEvent(new Event('input', { bubbles: true }));
});

// In searchbar-dropin.js
searchInput.addEventListener('input', (e) => {
  if (e.target.value === '') {
    clearSearchResults();
  }
});
```

## Product Result Structure

### GraphQL Response
```javascript
{
  result: {
    items: [
      {
        productView: {
          sku: "exclusive-bundle",
          name: "Exclusive Bundle",
          urlKey: "exclusive-bundle",
          images: [
            { url: "...", roles: ["thumbnail"] }
          ],
          priceRange: {
            minimum: { final: { amount: { value: 49.99 } } },
            maximum: { final: { amount: { value: 3445.99 } } }
          }
        }
      }
    ]
  }
}
```

### Rendered HTML
```html
<div class="dropin-product-item-card">
  <div class="dropin-product-item-card__image-container">
    <a href="/products/exclusive-bundle/exclusive-bundle">
      <img src="..." alt="Exclusive Bundle" />
    </a>
  </div>
  <div class="dropin-product-item-card__content">
    <div class="dropin-product-item-card__title">
      <a href="/products/exclusive-bundle/exclusive-bundle">Exclusive Bundle</a>
    </div>
    <div class="dropin-product-item-card__price">
      <div class="dropin-price-range">
        <span class="dropin-price-range__from">From</span>
        <span class="dropin-price">$49.99</span>
        <span class="dropin-price-range__to">To</span>
        <span class="dropin-price">$3445.99</span>
      </div>
    </div>
  </div>
</div>
```

## Event System

### Adobe Event Bus
The implementation uses Adobe's event bus for state management:

```javascript
import { events } from '@dropins/tools/event-bus.js';

// Listen for search events
events.on('search/loading', handleSearchLoading);
events.on('search/result', handleSearchResult);
events.on('popover/search/result', handleSearchResult);

// Trigger search
search({ phrase: value, pageSize: 4 }, { scope: 'popover' });
```

## Troubleshooting Guide

### Issue: No Search Results

**Symptoms**: Search returns no products even for valid queries

**Solutions**:
1. Check endpoint configuration - must use `commerce-endpoint` (Edge API)
2. Verify all headers are set (both `headers.cs` and `headers.all`)
3. Check browser Network tab for GraphQL errors
4. Ensure search term has at least 3 characters

### Issue: Duplicate Search Requests

**Symptoms**: Multiple identical GraphQL requests for single search

**Solutions**:
1. Check initialization flag is working
2. Ensure search panel isn't opened multiple times
3. Verify debounce timeout is functioning (300ms)

### Issue: Clear Button Not Working

**Symptoms**: Clicking X clears input but results remain visible

**Solutions**:
1. Ensure input event is dispatched after clearing
2. Check `clearSearchResults()` function is called
3. Verify event listeners are properly attached

### Issue: Search Panel Not Opening

**Symptoms**: Clicking search button doesn't show search panel

**Solutions**:
1. Check if `searchbar-dropin.js` module loads
2. Verify search panel HTML structure exists
3. Check for JavaScript errors in console
4. Ensure CSS is loaded

## Testing

### Manual Testing Checklist
- [ ] Search requires minimum 3 characters
- [ ] Results appear after debounce delay
- [ ] Maximum 4 products displayed
- [ ] Product images load correctly
- [ ] Price ranges display properly
- [ ] Product links navigate correctly
- [ ] "No results" message appears when appropriate
- [ ] Clear button removes input and results
- [ ] Click outside closes dropdown
- [ ] View all link includes search query
- [ ] No duplicate API requests

### Browser Compatibility
- Chrome 120+
- Safari 17.2+
- Firefox 117+
- Edge 120+

## Performance Considerations

### Optimizations
1. **Lazy Loading**: Search module loaded only when needed
2. **Debouncing**: Reduces API calls with 300ms delay
3. **Result Limit**: Shows only 4 products in dropdown
4. **Event Scoping**: Uses 'popover' scope to isolate events
5. **Initialization Flag**: Prevents duplicate setup

### API Response Times
- Target: < 500ms for search results
- Actual: ~200-300ms (Edge API)

## Future Enhancements

### Planned Improvements
1. Search suggestions/autocomplete
2. Recent searches history
3. Popular searches
4. Category filtering in dropdown
5. Keyboard navigation support
6. Mobile-specific optimizations
7. Search analytics integration

## Related Documentation
- [CLAUDE.md](/CLAUDE.md) - Main project documentation
- [Adobe Commerce Dropins](https://github.com/adobe/storefront-product-discovery)
- [Edge API Documentation](https://developer.adobe.com/commerce/webapi/graphql/)