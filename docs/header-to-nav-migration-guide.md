# Header to Nav Block Migration Guide

## Overview

The header block (`blocks/header/`) has been deprecated in favor of the nav block (`blocks/nav/`) to eliminate code duplication and improve maintainability. This guide explains the changes and how to migrate.

## What Changed

### Header Block (Deprecated)
The `blocks/header/header.js` file has been reduced to a minimal compatibility wrapper that:
- Logs deprecation warnings
- Provides error messages if nav block is missing
- Maintains backward compatibility for pages still using header block

### Critical Functions Preserved
The following critical cart and authentication functions have been **added to nav.js** to ensure proper functionality:
- `restoreCartForGuestSession()` - Restores cart items for guest sessions
- `restoreRemainingItemsToCart()` - Handles incomplete purchases
- `handleUserAuthentication()` - Manages XSRF token validation

### Files Deprecated
- `blocks/header/header.js` - Now a minimal wrapper with deprecation notice
- `blocks/header/renderAuthDropdown.js` - Authentication handled by nav block
- `blocks/header/renderAuthCombine.js` - Mobile auth handled by nav block

### Files Retained (Shared Utilities)
- `blocks/header/searchbar.js` - Still used by both header and nav blocks
- `blocks/header/header.css` - May still be needed for legacy pages

## Migration Steps

### 1. Update Your Content Pages

Replace header block references with nav block:

**Before:**
```html
<div class="header">
  <!-- header content -->
</div>
```

**After:**
```html
<div class="nav">
  <!-- nav content -->
</div>
```

### 2. Update JavaScript Imports

**Before:**
```javascript
import { renderAuthDropdown } from '../header/renderAuthDropdown.js';
import { renderAuthCombine } from '../header/renderAuthCombine.js';
```

**After:**
```javascript
// Authentication is now handled internally by nav components
// No need to import these functions
```

### 3. Update Search Integration

The searchbar.js is still shared between both implementations:

```javascript
// Nav block already imports searchbar from header
await import('../header/searchbar.js');
```

No changes needed for search functionality.

## Feature Comparison

| Feature | Header Block | Nav Block | Migration Notes |
|---------|-------------|-----------|-----------------|
| **Navigation Menu** | `header.js` | `nav.js` + components | Automatic with nav block |
| **Mini Cart** | Inline implementation | `nav-dropins.js` | Singleton pattern, better performance |
| **Authentication** | `renderAuthDropdown.js` | `login-nav` widget | Handled by login-nav integration |
| **Mobile Auth** | `renderAuthCombine.js` | `nav-mobile-header.js` | Integrated in mobile component |
| **Search** | `searchbar.js` | Same `searchbar.js` | No change needed |
| **Desktop Nav** | Single component | `desktop-nav-root.js` | Web Component architecture |
| **Mobile Nav** | Media queries | `nav-mobile-header.js` | Separate mobile component |

## Benefits of Nav Block

### 1. Better Architecture
- Modular Web Components
- Separation of concerns
- Component-based structure

### 2. Better Performance
- Singleton mini cart (reduced memory usage)
- Responsive container switching
- Optimized event handling

### 3. Better Maintainability
- 18+ specialized files vs 5 monolithic files
- Clear component boundaries
- Easier to test and debug

### 4. Advanced Features
- Third-level navigation support
- Dynamic data extraction
- Component lifecycle management

## Common Issues and Solutions

### Issue: Page Shows "Navigation not configured" Error
**Solution:** Add a nav block to your page content.

### Issue: Authentication Not Working
**Solution:** Ensure login-nav widget is properly configured. Authentication is now handled by the login-nav widget, not the header.

### Issue: Mini Cart Not Appearing
**Solution:** Check that nav-dropins.js is initialized and mini-cart fragment path is configured.

### Issue: Search Not Working
**Solution:** Verify searchbar.js is still present in blocks/header/ as it's shared by both implementations.

## Deprecation Timeline

1. **Current State**: Header block deprecated but functional
2. **Phase 1**: All new pages should use nav block
3. **Phase 2**: Migrate existing pages to nav block
4. **Phase 3**: Remove header block entirely (except searchbar.js)

## Code Examples

### How Nav Block Replaces Header

When nav.js initializes, it completely replaces the header content:

```javascript
// nav.js - lines 44-51
const header = document.querySelector('header');

// Remove all existing children from header
while (header.firstChild) {
  header.removeChild(header.firstChild);
}

// Add navigation components
header.appendChild(desktopNavRoot);
header.appendChild(mobileNavRoot);
```

### Mini Cart Singleton Pattern (Nav Block)

```javascript
// nav-dropins.js - Singleton pattern
let miniCartElement = null;

function moveMiniCartToContainer() {
  const isMobile = window.innerWidth < MOBILE_BREAKPOINT;
  const targetContainer = isMobile ? mobileCartContainer : desktopCartContainer;
  
  if (targetContainer && miniCartElement.parentElement !== targetContainer) {
    targetContainer.appendChild(miniCartElement);
  }
}
```

## Developer Warnings

When using the deprecated header block, you'll see:

```
Console Warning: Header block is deprecated. Please use the nav block instead. See blocks/nav/ for the current implementation.
```

When importing deprecated auth files:

```
Console Warning: renderAuthDropdown.js is deprecated. Authentication is now handled by the nav block with login-nav widget.
```

## Support

For questions about migration:
1. Check the nav block documentation in `blocks/nav/`
2. Review the analysis in `docs/header-vs-nav-analysis.md`
3. Consult the nav component tests for usage examples

## Summary

The migration from header to nav block is straightforward:
1. Update page content to use nav block
2. Remove dependencies on deprecated auth renderers
3. Let nav block handle all navigation functionality

The nav block provides better performance, maintainability, and features while eliminating ~30% of duplicate code from the codebase.