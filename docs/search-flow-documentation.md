# NASM Search Flow Documentation

## Overview
The NASM website implements a comprehensive search functionality using Adobe Commerce (Magento) integration with LiveSearch components. This document details the complete search flow from user interaction to results display.

## Search Flow Architecture

### High-Level Flow Diagram

```mermaid
graph TD
    A[User Clicks Search Button] --> B[Toggle Search Panel]
    B --> C[Load searchbar.js Module]
    C --> D[Initialize SearchAsYouType Widget]
    D --> E[User Types Query]
    E --> F{User Action}
    F -->|Autocomplete| G[Display Suggestions]
    F -->|Press Enter| H[Submit Form]
    H --> I[Navigate to /search]
    I --> J[Load Product List Page]
    J --> K[Initialize LiveSearchPLP]
    K --> L[Fetch Results from Commerce API]
    L --> M[Render Search Results]
    M --> N[Display Products with Filters]
```

## Component Interaction Diagram

```mermaid
sequenceDiagram
    participant User
    participant Header
    participant SearchBar
    participant SearchWidget
    participant CommerceAPI
    participant SearchPage
    
    User->>Header: Click .nav-search-button
    Header->>Header: toggleSearch()
    Header->>SearchBar: Dynamic import('./searchbar.js')
    SearchBar->>SearchWidget: Load SearchAsYouType.js
    SearchBar->>SearchWidget: Initialize LiveSearchAutocomplete
    SearchWidget->>SearchBar: Widget Ready
    Header->>User: Focus search input
    
    User->>SearchWidget: Type "one"
    SearchWidget->>CommerceAPI: Fetch autocomplete suggestions
    CommerceAPI->>SearchWidget: Return suggestions
    SearchWidget->>User: Display dropdown
    
    User->>Header: Press Enter
    Header->>SearchPage: Navigate to /search?q=one
    SearchPage->>SearchWidget: Load search.js
    SearchPage->>SearchWidget: Initialize LiveSearchPLP
    SearchWidget->>CommerceAPI: Fetch search results
    CommerceAPI->>SearchWidget: Return products
    SearchWidget->>User: Render results grid
```

## File Structure and Components

### 1. Header Component (`/blocks/header/header.js`)

**Lines 274-317**: Search initialization and toggle functionality

```javascript
// Key functionality:
- Creates search button and input panel
- Manages panel visibility state
- Dynamically imports searchbar.js on first use
- Handles form submission to /search route
```

**Key Functions:**
- `toggleSearch(state)`: Controls search panel visibility
- Event listeners for button click and outside clicks
- Form action routing to `/search` endpoint

### 2. Search Bar Module (`/blocks/header/searchbar.js`)

**Purpose**: Initializes Adobe Commerce search autocomplete

**Configuration Object:**
```javascript
storeDetails = {
  environmentId,      // Commerce environment ID
  apiKey,            // API authentication
  apiUrl,            // Commerce endpoint
  storeCode,         // Store configuration
  config: {
    pageSize: 8,     // Autocomplete results limit
    minQueryLength: 2 // Minimum characters to trigger
  },
  route,            // Product URL pattern
  searchRoute       // Search results page route
}
```

### 3. Search Results Page (`/blocks/product-list-page/product-list-page.js`)

**Purpose**: Renders search results with filtering and sorting

**Key Features:**
- Loads `/scripts/widgets/search.js` widget
- Configures LiveSearchPLP component
- Integrates with cart dropins for add-to-cart
- Handles product routing

## Data Flow Diagram

```mermaid
graph LR
    subgraph "Frontend Layer"
        A[Search Input] --> B[SearchAsYouType Widget]
        B --> C[Form Submission]
    end
    
    subgraph "API Layer"
        D[Commerce GraphQL API]
        E[Product Catalog Service]
        F[Search Index]
    end
    
    subgraph "Results Layer"
        G[LiveSearchPLP]
        H[Product Grid]
        I[Faceted Filters]
        J[Sort Options]
    end
    
    C --> D
    D --> E
    E --> F
    F --> G
    G --> H
    G --> I
    G --> J
```

## Event Flow

```mermaid
stateDiagram-v2
    [*] --> Idle
    Idle --> SearchOpen: Click Search Button
    SearchOpen --> Loading: Import searchbar.js
    Loading --> Ready: Widget Initialized
    Ready --> Typing: User Input
    Typing --> Autocomplete: Fetch Suggestions
    Autocomplete --> Typing: Continue Typing
    Typing --> Submitted: Press Enter
    Submitted --> NavigatingToSearch: Form Submit
    NavigatingToSearch --> SearchPageLoading: Load /search
    SearchPageLoading --> ResultsDisplayed: Render Products
    ResultsDisplayed --> Filtering: Apply Filters
    Filtering --> ResultsDisplayed: Update Results
    ResultsDisplayed --> [*]
```

## API Integration Points

### 1. Autocomplete API
- **Endpoint**: Configured via `commerce-endpoint` in config
- **Headers**: 
  - `x-api-key`: API authentication
  - `Magento-Store-View-Code`: Store context
- **Minimum Query Length**: 2 characters
- **Response**: Product suggestions with SKU and URL keys

### 2. Search Results API
- **LiveSearchPLP Integration**
- **Pagination**: 12/24/36 items per page
- **Sorting**: Relevance, price, name
- **Filtering**: Categories, price ranges, attributes

## Configuration Details

### Store Configuration (from `configs.js`)
```javascript
{
  'headers.cs.Magento-Environment-Id': // Environment identifier
  'headers.cs.x-api-key':              // API authentication
  'commerce-endpoint':                 // Base API URL
  'headers.cs.Magento-Website-Code':  // Website context
  'headers.cs.Magento-Store-Code':    // Store context
  'headers.cs.Magento-Store-View-Code': // View context
  'headers.cs.Magento-Customer-Group': // Customer segmentation
}
```

## Search URL Parameters

### Query String Structure
- **Base URL**: `/search`
- **Parameters**:
  - `q`: Search query term
  - `sort`: Sort field (relevance, price, etc.)
  - `sortDirection`: asc/desc
  - `page`: Current page number
  - `page_size`: Items per page

### Example URL
```
/search?sort=relevance&sortDirection=desc&q=one&page=1&page_size=12
```

## Widget Dependencies

```mermaid
graph TD
    A[header.js] --> B[searchbar.js]
    B --> C[SearchAsYouType.js]
    C --> D[LiveSearchAutocomplete]
    
    E[product-list-page.js] --> F[search.js]
    F --> G[LiveSearchPLP]
    
    H[Commerce API] --> D
    H --> G
    
    I[dropins/storefront-cart] --> E
    J[dropins/tools/event-bus] --> A
    J --> E
```

## Event Tracking

### Analytics Events
1. **search-request-sent**: Fired when search is initiated
   - Contexts: pageContext, storefrontInstanceContext, searchInputContext
   - Tracked in Adobe Data Layer

2. **search-results-view**: Fired when results are displayed
   - Includes result count and query terms

3. **product-click**: Fired when product is clicked from results

## Performance Considerations

1. **Lazy Loading**: Search widgets loaded on-demand
2. **Debouncing**: Autocomplete requests debounced
3. **Caching**: Search results cached client-side
4. **Image Optimization**: 
   - `optimizeImages: true`
   - `imageBaseWidth: 200px`

## Error Handling

1. **Network Failures**: Fallback to basic search
2. **API Errors**: Display error messages to user
3. **No Results**: Show "No products found" message
4. **Widget Load Failures**: Polling mechanism with 200ms intervals

## Testing

### Cypress Test Coverage
- **Location**: `/cypress/src/tests/e2eTests/events/`
- **Test Files**:
  - `search-request-sent.spec.js`: Search initiation
  - `search-results-view.spec.js`: Results display

### Test Flow
```javascript
cy.get('.nav-search-button').click();
cy.get('#search').type('cypress');
cy.get('#search').type('{enter}');
// Verify navigation to /search?q=cypress
// Verify results displayed
```

## Mobile Considerations

- Search panel full-width on mobile
- Touch-optimized autocomplete dropdown
- Responsive grid layout for results
- Filter panel as collapsible drawer

## Future Enhancements

1. **Search History**: Store recent searches
2. **Popular Searches**: Display trending queries
3. **Search Suggestions**: AI-powered recommendations
4. **Voice Search**: Audio input capability
5. **Visual Search**: Image-based product search

## Related Documentation

- [Adobe Commerce LiveSearch Documentation](https://experienceleague.adobe.com/docs/commerce-merchant-services/live-search/overview.html)
- [Edge Delivery Services Integration](https://www.aem.live/)
- [Commerce Dropins Documentation](https://experienceleague.adobe.com/docs/commerce-merchant-services/storefront/dropins.html)

---

*Last Updated: January 2025*
*Document Version: 1.0*