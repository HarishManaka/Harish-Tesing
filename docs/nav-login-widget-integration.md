# Navigation Login Widget Integration

## Overview
The navigation components now integrate the `login-nav` block's decorate function to render the login widget inside the auth panels.

## Implementation Details

### Desktop Navigation (`desktop-nav-root.js`)

#### Integration Method
```javascript
async initializeLoginWidget() {
  try {
    // Find the auth container
    const authContainer = this.querySelector('#nav-auth-dropin-container');
    if (!authContainer) return;

    // Dynamically import the login-nav decorate function
    const { default: decorateLoginNav } = await import('../login-nav/login-nav.js');

    // Call the decorate function with the container element
    await decorateLoginNav(authContainer);

    // Remove any header elements that might have been added
    const loginHeader = authContainer.querySelector('.login-nav-header');
    if (loginHeader) {
      loginHeader.style.display = 'none';
    }

    // Adjust styles for panel context
    authContainer.classList.add('nav-auth-login-widget');
  } catch (error) {
    console.error('Failed to initialize login widget:', error);
  }
}
```

### Mobile Navigation (`nav-mobile-header.js`)
- Same implementation as desktop
- Uses `#mobile-nav-auth-dropin-container` as the target
- Adds `mobile-nav-auth-login-widget` class for styling

## Key Changes

### 1. Dynamic Import
- Uses dynamic import to load `login-nav` decorate function
- Prevents unnecessary bundle size increase
- Lazy loads only when needed

### 2. Direct Element Passing
- Passes the container element directly to `decorate(block)`
- The login-nav widget renders inside the provided element
- No need for separate fragment loading

### 3. Style Adjustments
- Hides the login header (`.login-nav-header`) in panel context
- Adds specific classes for targeted styling
- Maintains consistent padding and spacing

### 4. Simplified Architecture
- Removed separate auth dropin initialization
- Removed authenticated user menu (handled by login-nav)
- Cleaned up nav-dropins.js to focus only on mini cart

## CSS Customizations

### Desktop Panel Styles
```css
.nav-auth-login-widget .login-nav-container {
  padding: 20px;
}

.nav-auth-login-widget .login-nav-header {
  display: none !important;
}
```

### Mobile Panel Styles
```css
.mobile-nav-auth-login-widget .login-nav-container {
  padding: 16px;
}

.mobile-nav-auth-login-widget .login-nav-header {
  display: none !important;
}
```

## Benefits

1. **Reusability**: Uses existing login-nav widget without duplication
2. **Consistency**: Same login experience across all touchpoints
3. **Maintainability**: Single source of truth for login functionality
4. **Performance**: Lazy loading with dynamic imports
5. **Simplicity**: No complex auth dropin setup needed

## Usage Flow

1. User clicks auth button in navigation
2. Auth panel opens (show/hide functionality)
3. Login widget is initialized (first time only)
4. User interacts with login-nav widget
5. Widget handles all authentication logic
6. On success, welcome state is shown (handled by login-nav)

## Files Modified

- `blocks/nav/desktop-nav-root.js` - Added `initializeLoginWidget()` method
- `blocks/nav/nav-mobile-header.js` - Added `initializeLoginWidget()` method
- `blocks/nav/nav-dropins.js` - Removed auth initialization, simplified
- `blocks/nav/nav.css` - Added styling for login widget in panels

## Testing Checklist

- [ ] Auth panel opens/closes correctly
- [ ] Login widget renders inside panel
- [ ] Login header is hidden in panel context
- [ ] Login functionality works as expected
- [ ] Welcome state displays after login
- [ ] Mobile and desktop both work correctly
- [ ] Panel coordination (only one open at a time)
- [ ] Click outside closes panel