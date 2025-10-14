# Logout Process Documentation

## Overview
The NASM e-commerce application implements a comprehensive logout flow that ensures proper cleanup of user authentication, cart preservation, and session management. The logout process is accessible from multiple UI components and handles various edge cases including cart item preservation for guest sessions.

## Key Components

### 1. **renderAuthCombine.js** (`/blocks/header/renderAuthCombine.js:55-58`)
- Handles logout from the authentication combine modal
- Triggers when user clicks the logout button in the success notification panel
- Flow:
  1. Calls `authApi.revokeCustomerToken()` to invalidate authentication
  2. Executes `PostLogoutHandler()` for cleanup
  3. Redirects to homepage

### 2. **renderAuthDropdown.js** (`/blocks/header/renderAuthDropdown.js:80-92`)
- Manages logout from the header dropdown menu
- Additional functionality: preserves logged-in user's cart for guest session
- Flow:
  1. Calls `cacheLoggedInUserCart()` to save cart items
  2. Revokes customer token via `authApi.revokeCustomerToken()`
  3. Executes `PostLogoutHandler()`
  4. Checks and redirects based on current page context

### 3. **PostLogoutHandler** (`/utils/cart-checkout.js:257-260`)
- Central cleanup function called during logout
- Responsibilities:
  - Deletes XSRF-TOKEN cookie
  - Removes suspended user flag from session storage
  - Ensures clean session state

## Core Functions

### `authApi.revokeCustomerToken()`
**Location**: `/scripts/__dropins__/storefront-auth/api.js`

Sends GraphQL mutation to revoke the customer authentication token:
```graphql
mutation REVOKE_CUSTOMER_TOKEN {
  revokeCustomerToken {
    result
  }
}
```

On success:
- Removes authentication cookies (`auth_dropin_user_token`, `auth_dropin_firstname`)
- Emits `authenticated` event with `false` value
- Triggers Adobe Data Layer sign-out event

### `cacheLoggedInUserCart()`
**Location**: `/utils/cart-checkout.js:47-72`

Preserves the logged-in user's cart items for restoration after logout:
- Extracts cart items from session storage
- Formats items with SKU, quantity, and configuration options
- Stores in session under `LOGGEDIN_USER_CART_ITEMS` key

### `restoreCartForGuestSession()`
**Location**: `/utils/cart-checkout.js:74-90`

Restores preserved cart items when user continues as guest:
- Retrieves cached cart items from session storage
- Calls `addProductsToCart()` API to restore items
- Cleans up temporary storage on success

### `deleteCookie()`
**Location**: `/scripts/configs.js:71-73`

Utility function to remove cookies:
- Sets cookie expiration to past date
- Applies to `.nasm.org` domain
- Ensures complete cookie removal

## Logout Triggers

The logout process can be initiated from:

1. **Header Dropdown Menu** - Authenticated user menu with logout button
2. **Authentication Success Modal** - Post-login success notification with logout option
3. **Account Pages** - Various account management pages with logout functionality
4. **Session Timeout** - Automatic logout after XSRF token expiration (1 hour)

## State Management

### Cookies Affected
- `auth_dropin_user_token` - Main authentication token
- `auth_dropin_firstname` - User's first name for display
- `XSRF-TOKEN` - Cross-site request forgery protection token

### Session Storage Items
- `DROPIN__CART__CART__DATA` - Current cart state
- `LOGGEDIN_USER_CART_ITEMS` - Preserved cart for guest session
- `isSuspendedUser` - User suspension flag

### Events Emitted
- `authenticated` event with `false` value - Notifies all components of logout
- Adobe Data Layer `SIGN_OUT` event - For analytics tracking

## Page-Specific Redirects

The logout process includes intelligent redirection based on current page:

| Current Path | Redirect To |
|-------------|------------|
| `/customer/*` | `/customer/login` |
| `/order-details` | Homepage (`/`) |
| `/checkout` | `/customer/login?redirect_url=/checkout` |
| `/order-confirmation` | `/customer/login` |
| All other pages | Reload current page |

## Security Considerations

1. **Token Revocation**: Server-side token invalidation ensures immediate logout
2. **Cookie Cleanup**: All authentication cookies are removed with proper domain scope
3. **Session Cleanup**: Session storage items are cleared to prevent data leakage
4. **XSRF Protection**: XSRF token is deleted to prevent cross-site attacks
5. **Cart Preservation**: Only non-sensitive cart data is preserved, no payment information

## Error Handling

The logout process includes error handling for:
- Failed token revocation (logs error but continues with cleanup)
- Cart preservation failures (silently fails, doesn't block logout)
- Network errors during API calls (user is still logged out locally)

## Best Practices

1. Always call `PostLogoutHandler()` after token revocation
2. Use `cacheLoggedInUserCart()` before logout if cart preservation is needed
3. Check authentication state with `checkIsAuthenticated()` before sensitive operations
4. Handle the `authenticated` event in UI components for real-time updates
5. Ensure proper error handling for all async operations

## Testing Considerations

When testing logout functionality:
1. Verify all cookies are properly removed
2. Check that cart items are preserved when applicable
3. Confirm proper page redirects based on context
4. Test logout from different UI components
5. Verify event emissions for UI updates
6. Test session timeout scenarios
7. Validate cleanup of all session storage items