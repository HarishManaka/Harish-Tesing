# GraphQL Search Endpoint Documentation

## Overview
This document provides comprehensive information about the Adobe Edge Delivery Services GraphQL search endpoint used by the NASM e-commerce site. The introspection was performed on the sandbox environment to understand the available search queries, types, and structure.

## Endpoint Information

### Base URL
```
https://edge-sandbox-graph.adobe.io/api/3d2860c0-5c38-4b03-b6ba-38fe974f3f99/graphql
```

### Required Headers
When making requests to the GraphQL endpoint, the following headers are typically required:
- `Content-Type: application/json`
- `Magento-Store-View-Code: default`
- `Magento-Store-Code: main_website_store`
- `Magento-Website-Code: base`
- `Magento-Customer-Group: <customer-group-code>`
- `x-api-key: <api-key>`

## Available Search Queries

### Primary Search Query: `productSearch`
The main search query available in the schema. There is **NO `quickSearch` query** available on the GraphQL server endpoint.

### About `quickSearch` 
**Important:** `quickSearch` is NOT a server-side GraphQL query. It's a **client-side query name** used by the LiveSearch widget (`SearchAsYouType.js`) that internally calls the `productSearch` query. This is simply a naming convention used by the widget to differentiate between different search contexts, but ultimately all search requests go through the `productSearch` endpoint.

#### How the Widget Uses quickSearch
The LiveSearch widget defines a query like this:
```graphql
query quickSearch($phrase: String!, $pageSize: Int) {
    productSearch(phrase: $phrase, page_size: $pageSize) {  # <-- Calls productSearch
        items {
            productView {
                sku
                name
                urlKey
                # ... other fields
            }
        }
    }
}
```

This naming pattern (`quickSearch`) is purely client-side and helps the widget:
- Differentiate between different types of searches (quick autocomplete vs full search)
- Apply different caching strategies
- Handle results differently in the UI

But on the server, there is only `productSearch`.

#### Query Signature
```graphql
productSearch(
  phrase: String!           # Required search term
  page_size: Int           # Number of results per page
  current_page: Int        # Page number (1-based)
  filter: [ProductAttributeFilterInput]  # Filtering options
  sort: [ProductAttributeSortInput]      # Sorting options
  context: QueryContextInput              # Context information
): ProductSearchResponse
```

#### Context Input Type
```graphql
type QueryContextInput {
  customerGroup: String!   # Customer group code (currently reserved, no impact)
  userViewHistory: [UserViewHistoryInput]  # User's view history with timestamps
}
```

## Response Structure

### ProductSearchResponse
The main response type containing search results and metadata.

```graphql
type ProductSearchResponse {
  total_count: Int              # Total number of matching products
  suggestions: [String]         # Suggested search terms
  related_terms: [String]       # Related/synonym terms
  page_info: SearchResultPageInfo  # Pagination information
  facets: [Aggregation]         # Available filters/facets
  items: [ProductSearchItem]    # Array of product results
}
```

### ProductSearchItem
Individual search result item structure:

```graphql
type ProductSearchItem {
  highlights: [Highlight]       # Highlighted matching text
  productView: ProductView      # Product information
  applied_query_rule: AppliedQueryRule  # Query rules (preview mode only)
}
```

### Highlight
Highlighted text for search matches:

```graphql
type Highlight {
  attribute: String  # Field that matched (e.g., "name", "sku")
  value: String     # Value with <em> tags around matched terms
}
```

## Product Types

### ProductView Interface
Base interface for all product types with two implementations:

1. **SimpleProductView** - Products with a single price
2. **ComplexProductView** - Configurable products with price ranges

### Common ProductView Fields
```graphql
interface ProductView {
  __typename: String
  id: ID!
  sku: String
  name: String
  url: String
  urlKey: String
  description: String
  shortDescription: String
  metaTitle: String
  metaDescription: String
  metaKeyword: String
  images: [ProductViewImage]
  videos: [ProductViewVideo]
  attributes: [ProductViewAttribute]
  lastModifiedAt: DateTime
  visibility: String
  queryType: String  # Indicates primary or backup query source
}
```

### SimpleProductView Specific Fields
```graphql
type SimpleProductView {
  # All ProductView fields plus:
  price: ProductViewPrice {
    final: {
      amount: {
        value: Float
        currency: String
      }
    }
    regular: {
      amount: {
        value: Float
        currency: String
      }
    }
  }
}
```

### ComplexProductView Specific Fields
```graphql
type ComplexProductView {
  # All ProductView fields plus:
  priceRange: ProductViewPriceRange {
    minimum: {
      final: {
        amount: {
          value: Float
          currency: String
        }
      }
      regular: {
        amount: {
          value: Float
          currency: String
        }
      }
    }
    maximum: {
      final: {
        amount: {
          value: Float
          currency: String
        }
      }
      regular: {
        amount: {
          value: Float
          currency: String
        }
      }
    }
  }
  options: [ProductViewOption]  # Configurable options
  links: [ProductViewLink]      # Related product links
  nasm_price: [NasmPrice]       # Custom NASM pricing
}
```

### ProductViewImage
```graphql
type ProductViewImage {
  url: String
  label: String
  roles: [String]  # e.g., ["thumbnail", "small", "base"]
}
```

## Example Queries

### Basic Product Search
```graphql
query BasicSearch {
  productSearch(phrase: "CPT", page_size: 10) {
    total_count
    suggestions
    items {
      productView {
        sku
        name
        urlKey
      }
    }
  }
}
```

### Full Product Search with Details
```graphql
query DetailedSearch($searchTerm: String!, $pageSize: Int) {
  productSearch(phrase: $searchTerm, page_size: $pageSize, current_page: 1) {
    total_count
    suggestions
    related_terms
    page_info {
      current_page
      page_size
      total_pages
    }
    items {
      highlights {
        attribute
        value
      }
      productView {
        __typename
        sku
        name
        url
        urlKey
        description
        shortDescription
        images {
          url
          label
          roles
        }
        ... on ComplexProductView {
          priceRange {
            minimum {
              final {
                amount {
                  value
                  currency
                }
              }
            }
            maximum {
              final {
                amount {
                  value
                  currency
                }
              }
            }
          }
        }
        ... on SimpleProductView {
          price {
            final {
              amount {
                value
                currency
              }
            }
          }
        }
      }
    }
  }
}
```

## Working cURL Examples

### Simple Search Request
```bash
curl -X POST 'https://edge-sandbox-graph.adobe.io/api/3d2860c0-5c38-4b03-b6ba-38fe974f3f99/graphql' \
  -H 'Content-Type: application/json' \
  --data-raw '{"query":"{ productSearch(phrase: \"test\", page_size: 5) { total_count suggestions items { productView { sku name url } } } }"}'
```

### Search with Variables
```bash
curl -X POST 'https://edge-sandbox-graph.adobe.io/api/3d2860c0-5c38-4b03-b6ba-38fe974f3f99/graphql' \
  -H 'Content-Type: application/json' \
  -H 'Magento-Store-View-Code: default' \
  -H 'Magento-Store-Code: main_website_store' \
  -H 'Magento-Website-Code: base' \
  -d '{
    "query": "query SearchProducts($phrase: String!, $pageSize: Int) { productSearch(phrase: $phrase, page_size: $pageSize) { total_count items { productView { sku name urlKey } } } }",
    "variables": {
      "phrase": "CPT",
      "pageSize": 4
    }
  }'
```

## Implementation Notes

### Current Implementation (searchbar.js)
The current implementation in `/blocks/header/searchbar.js` correctly:

1. **Uses productSearch query** - The only available server-side search query
2. **Handles the widget's quickSearch naming** - The LiveSearch widget may use `quickSearch` as a query name, but this gets translated to `productSearch` on the server
3. **Patches GraphQL queries** - Fixes field references:
   - `.product` → `.productView`
   - `image` → `images`
   - Handles duplicate field issues
4. **Handles both product types** - SimpleProductView and ComplexProductView
5. **Intercepts fetch requests** - Modifies queries before sending
6. **Processes search results** - Displays product cards with images and prices

### Key Considerations

1. **Field Naming**: Always use `productView` not `product` when accessing product data
2. **Image Fields**: Use `images` array, not singular `image`, `thumbnail`, or `small_image`
3. **Price Handling**: Check product type (`__typename`) to determine whether to use `price` or `priceRange`
4. **Fragment Usage**: Use inline fragments for type-specific fields
5. **Error Handling**: The endpoint may return partial data with errors; handle gracefully

### Known Issues and Solutions

1. **Field name mismatches**: The LiveSearch widget may use outdated field names. The current patch function intercepts and fixes these.
2. **Image field duplication**: Some queries may have duplicate image field requests. The patch removes duplicates.
3. **Missing URLs**: Product URLs may be empty in the response. Use `urlKey` and `sku` to construct URLs.

## Testing Recommendations

1. **Test with various search terms**: Single words, phrases, SKUs, partial matches
2. **Test pagination**: Verify page_size and current_page parameters work correctly
3. **Test product types**: Ensure both simple and complex products display correctly
4. **Test edge cases**: Empty results, special characters, very long queries
5. **Monitor GraphQL errors**: Check browser console for any GraphQL errors

## Performance Considerations

1. **Page Size**: Keep page_size reasonable (4-10 for autocomplete, 12-24 for search pages)
2. **Field Selection**: Only request fields you need to reduce response size
3. **Caching**: Consider caching search results for common queries
4. **Debouncing**: Implement debouncing for autocomplete to reduce API calls

## Related Files

- `/blocks/header/searchbar.js` - Main search implementation with GraphQL patches
- `/blocks/header/searchbar.css` - Search UI styles
- `/scripts/widgets/SearchAsYouType.js` - LiveSearch widget
- `/scripts/configs.js` - Configuration values for API endpoints

## References

- [Adobe Commerce GraphQL Documentation](https://developer.adobe.com/commerce/webapi/graphql/)
- [Live Search Documentation](https://experienceleague.adobe.com/docs/commerce-merchant-services/live-search/overview.html)
- [Edge Delivery Services Documentation](https://www.aem.live/docs/)