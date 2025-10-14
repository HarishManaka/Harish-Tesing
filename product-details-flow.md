# Product Details Block Flow Analysis

## Overview
The product-details block is a complex component that integrates with Adobe Commerce dropins to display product information, handle user interactions, and manage cart operations.

## Architecture Flow

```
URL (with SKU) → PDP Initializer → GraphQL Queries → Product Data → UI Components
```

## Key GraphQL Queries

### 1. Initial Product Data (`GET_PRODUCT_DATA`)
**Location**: `scripts/__dropins__/storefront-pdp/chunks/isProductConfigurationValid.js:4-11`
```graphql
query GET_PRODUCT_DATA($skus: [String]) {
    products(skus: $skus) {
        ...PRODUCT_FRAGMENT
    }
}
```

### 2. Product Refinement (`REFINE_PRODUCT_QUERY`)
**Location**: `scripts/__dropins__/storefront-pdp/chunks/isProductConfigurationValid.js:12-33`
```graphql
query REFINE_PRODUCT_QUERY(
    $optionIds: [String!]!
    $sku: String!
) {
    # Refined Product
    refineProduct(
        optionIds: $optionIds 
        sku: $sku
    ) {
        ...PRODUCT_FRAGMENT
    }

    # Parent Product
    products(skus: [$sku]) {
        ...PRODUCT_FRAGMENT
    }
}
```

### 3. Product Variants (`GET_PRODUCT_VARIANTS`)
**Location**: `blocks/product-details/product-details.js:537-566`
```graphql
query GET_PRODUCT_VARIANTS($sku: String!) {
    variants(sku: $sku) {
        variants {
            product {
                sku
                name
                type
                shortDescription
                metaDescription
                metaKeyword
                metaTitle
                description
                inStock
                images(roles: ["image"]) {
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
```

### 4. Add to Cart (`addProductsToCart`)
**Location**: `scripts/__dropins__/storefront-cart/chunks/updateProductsFromCart.js`
```graphql
mutation addProductsToCart(
    $cartId: String!
    $cartItems: [CartItemInput!]!
) {
    addProductsToCart(
        cartId: $cartId
        cartItems: $cartItems
    ) {
        cart {
            ...CART_FRAGMENT
        }
        user_errors {
            code
            message
        }
    }
}
```

## Data Flow

### 1. Initialization Phase (`scripts/initializers/pdp.js:27-67`)
```
URL Parse (SKU + optionsUIDs) → fetchProductData() → Initialize Dropins → Emit 'pdp/data' event
```

### 2. Product Data Fragment (`scripts/__dropins__/storefront-pdp/fragments.js:88-148`)
The `PRODUCT_FRAGMENT` includes:
- Basic product info (sku, name, description, images, attributes)
- Price data (SimpleProductView) or price ranges (ComplexProductView)
- Product options with variants for configurable products

### 3. Component Rendering (`blocks/product-details/product-details.js:32-518`)

#### Layout Structure:
```html
<div class="product-details__wrapper">
  <div class="product-details__left-column">
    <div class="product-details__gallery"></div>  <!-- Desktop Gallery -->
  </div>
  <div class="product-details__right-column">
    <div class="product-details__header"></div>    <!-- ProductHeader dropin -->
    <div class="product-details__price"></div>     <!-- ProductPrice dropin -->
    <div class="product-details__gallery"></div>  <!-- Mobile Gallery -->
    <div class="product-details__short-description"></div> <!-- ProductShortDescription -->
    <div class="product-details__configuration">
      <div class="product-details__options"></div>    <!-- ProductOptions dropin -->
      <div class="product-details__quantity"></div>   <!-- ProductQuantity dropin -->
      <div class="product-details__buttons">
        <div class="product-details__buttons__add-to-cart"></div>    <!-- Custom Button -->
        <div class="product-details__buttons__add-to-wishlist"></div> <!-- Custom Button -->
      </div>
    </div>
    <div class="product-details__description"></div>  <!-- ProductDescription dropin -->
    <div class="product-details__attributes"></div>  <!-- ProductAttributes dropin -->
  </div>
</div>
```

#### Dropin Components Used:
1. **ProductGallery** (2 instances: desktop + mobile)
2. **ProductHeader** - Product name and basic info
3. **ProductPrice** - Pricing display with currency
4. **ProductShortDescription** - Brief product description
5. **ProductOptions** - Configurable product options (color, size, etc.)
6. **ProductQuantity** - Quantity selector
7. **ProductDescription** - Full product description
8. **ProductAttributes** - Product specifications/attributes

### 4. User Interactions

#### Add to Cart Flow:
```
User clicks "Add to Cart" → 
getProductConfigurationValues() → 
isProductConfigurationValid() → 
addProductsToCart() GraphQL mutation → 
Cart updated → 
UI feedback
```

#### Option Selection Flow:
```
User selects option → 
pdpApi.getProductConfigurationValues() → 
REFINE_PRODUCT_QUERY → 
Product data updated → 
Price/availability updated
```

### 5. Event System (`blocks/product-details/product-details.js:493-505`)
- **'pdp/valid'** - Fired when product configuration validity changes
- **'pdp/data'** - Fired when product data is loaded/updated
- **'aem/lcp'** - Fired for LCP event, triggers JSON-LD and meta tag updates

### 6. Additional Features
The block also programmatically creates:
- **Countdown Promo section** (lines 78-138)
- **Hero Video section** (lines 140-231) 
- **Product Description Tabs section** (lines 233-344)

## Key Dependencies

### Adobe Dropins:
- `@dropins/storefront-pdp/api.js` - Core PDP API functions
- `@dropins/storefront-pdp/render.js` - Rendering utilities
- `@dropins/storefront-pdp/containers/*` - UI components
- `@dropins/storefront-cart/api.js` - Cart operations
- `@dropins/tools/components.js` - Base UI components
- `@dropins/tools/event-bus.js` - Event management

### Internal Scripts:
- `scripts/commerce.js` - Commerce utilities and placeholders
- `scripts/initializers/pdp.js` - PDP initialization logic
- `scripts/wishlist/api.js` - Wishlist functionality

## Adding Custom Fields to Product Data

When you need to add new fields to the product data (like `videos`, `type`, etc.), follow these steps:

### Step 1: Add Field to GraphQL Fragment
**Location**: `scripts/__dropins__/storefront-pdp/fragments.js`

Add your field to the `PRODUCT_FRAGMENT`:
```javascript
fragment PRODUCT_FRAGMENT on ProductView {
  __typename
  id
  sku
  name
  type          // ← New field added
  // ... existing fields ...
  
  videos {      // ← New field added
    url
    description
    title
  }
  
  // Add more custom fields here
  customFieldName {
    // field structure
  }
}
```

### Step 2: Add Field to Data Transformer
**Location**: `scripts/initializers/pdp.js`

The Adobe dropins filter out unknown fields during data transformation. Add a custom transformer to include your fields:

```javascript
const models = {
  ProductDetails: {
    initialData: { ...product },
    transformer: (rawProduct) => {
      // Add custom fields to the transformed product
      return rawProduct ? {
        videos: rawProduct.videos || [],
        type: rawProduct.type,
        customFieldName: rawProduct.customFieldName || defaultValue,
        // Add more fields as needed
      } : null;
    },
  },
};
```

### Step 3: Use Field in Custom Blocks
**Location**: `blocks/product-details/product-details.js` (or other blocks)

The custom fields will now be available in the product data:
```javascript
const product = events._lastEvent?.['pdp/data']?.payload ?? null;
const videoUrl = product?.videos?.[0]?.url || '';
const productType = product?.type || '';
```

### Why This is Needed:
- Adobe dropins have built-in transformers that only include known fields
- Raw GraphQL responses contain all fields, but transformed data filters them out
- Custom transformer extends the transformed data with additional fields
- This pattern works for any new fields added by the Commerce team

## Error Handling
- Invalid SKU → `loadErrorPage()` (`scripts/initializers/pdp.js:43`)
- Add to cart errors → InLineAlert component with error message
- Configuration validation → Button disabled state management

## SEO & Metadata
- JSON-LD structured data for product (`setJsonLdProduct()` - lines 521-607)
- Meta tags (Open Graph, product pricing) (`setMetaTags()` - lines 632-653)
- Dynamic page title update

This architecture provides a complete product detail page experience with real-time option selection, cart integration, comprehensive SEO support, and extensible data handling for custom fields.