# Navigation Mini Cart & Authentication Implementation Documentation

## Overview
This document describes the implementation of mini cart and authentication dropdown functionality in the NASM navigation components, following the patterns established in the header components.

## Architecture

### Component Structure
```
blocks/nav/
├── nav.js                      # Main entry point
├── nav-dropins.js             # Commerce dropins integration (NEW)
├── desktop-nav-root.js        # Desktop navigation (MODIFIED)
├── nav-mobile-header.js       # Mobile navigation (MODIFIED)
└── nav.css                    # Styles (MODIFIED)
```

## Implementation Details

### 1. Mini Cart Functionality

#### Singleton Mini Cart Implementation
The mini cart implementation uses a **singleton pattern** where only one instance of the mini cart element exists and is moved between desktop and mobile containers based on viewport width.

**Key Features:**
- **Single Instance**: One `miniCartElement` that moves between containers
- **Responsive Movement**: Automatically moves between desktop/mobile containers on resize
- **Breakpoint Management**: Uses `MOBILE_BREAKPOINT = 992` to determine container placement
- **Resize Listener**: Debounced resize handler (150ms) for smooth transitions

```javascript
// Core implementation in nav-dropins.js
let miniCartElement = null;
const MOBILE_BREAKPOINT = 992;

function moveMiniCartToContainer() {
  if (!miniCartElement) return;
  
  const desktopCartContainer = document.querySelector('#nav-cart-dropin-container');
  const mobileCartContainer = document.querySelector('#mobile-nav-cart-dropin-container');
  
  const isMobile = window.innerWidth < MOBILE_BREAKPOINT;
  const targetContainer = isMobile ? mobileCartContainer : desktopCartContainer;
  
  if (targetContainer && miniCartElement.parentElement !== targetContainer) {
    targetContainer.appendChild(miniCartElement);
  }
}

// Resize listener with debouncing
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    moveMiniCartToContainer();
  }, 150);
});
```

#### Container Structure
- **Desktop Container**: `#nav-cart-dropin-container`
- **Mobile Container**: `#mobile-nav-cart-dropin-container`
- **Fragment Loading**: Loads from `/mini-cart` path (configurable via metadata)

### 2. Authentication Dropdown

#### Desktop Navigation
- **Button Structure**: Replaced static sign-in button with dropdown button
- **Panel**: `.nav-auth-panel` containing:
  - Sign-in form container (`#nav-auth-dropin-container`)
  - Authenticated user menu (`.nav-authenticated-user-menu`)
- **Toggle Method**: `toggleAuthDropdown(state)`

```javascript
// Key methods added
toggleAuthDropdown(state) {
  // Manages auth panel visibility
  // Closes cart panel if opening auth
  // Updates ARIA attributes
}

handleAuthClick(e) {
  // Handles auth button click
}
```

#### Mobile Navigation
- Similar structure with mobile-specific classes
- Fixed positioning for mobile panels

### 3. Commerce Dropins Integration (`nav-dropins.js`)

#### Mini Cart Integration
```javascript
export async function initializeMiniCart() {
  // Loads mini cart fragment from configured path
  // Creates singleton miniCartElement instance
  // Moves element between containers based on viewport
  // Sets up resize listener for responsive behavior
}
```

#### Authentication Integration
```javascript
export async function initializeAuth() {
  // Imports auth dropin components
  // Renders SignIn form in containers
  // Configures success callbacks and routing
}
```

#### Event System
```javascript
// Cart events
events.on('cart/data', (data) => {
  // Updates cart button badge with item count
  cartButtons.forEach((button) => {
    if (data?.totalQuantity) {
      button.setAttribute('data-count', data.totalQuantity);
    } else {
      button.setAttribute('data-count', '0');
    }
  });
});

// Auth events (used in login-nav.js)
events.on('authenticated', (isAuthenticated) => {
  // Updates UI based on authentication state
  if (isAuthenticated) {
    const firstName = getCookie('auth_dropin_firstname') || 'Guest';
    const userNameElement = block.querySelector('.user-name');
    if (userNameElement) {
      userNameElement.textContent = firstName.toUpperCase();
    }
  }
});
```

### 4. State Management

#### Panel Coordination
- Only one panel can be open at a time
- Opening one panel closes others
- Click outside closes all panels

#### Authentication State
- Checks cookies for auth tokens
- Updates UI elements:
  - Button text: "Sign in" vs "Hi, {firstname}"
  - Shows/hides appropriate menus
  - Toggles dropin container visibility

### 5. CSS Styling (`nav.css`)

#### Panel Styles
```css
.nav-tools-panel {
  position: absolute;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
}

.nav-tools-panel--show {
  opacity: 1;
  visibility: visible;
}
```

#### Cart Badge
```css
.nav-cart-button[data-count]::after {
  content: attr(data-count);
  /* Badge styling */
}
```

#### Responsive Positioning
- Desktop: Absolute positioning relative to button
- Mobile: Fixed positioning with viewport constraints

## Event Flow

### Cart Interaction Flow
```
User clicks cart button
  → handleCartClick()
  → toggleMiniCart()
  → Close auth panel if open
  → Add class nav-tools-panel--show
  → Publish cart view event
  → Load mini cart fragment (if first time)
```

### Authentication Flow
```
User clicks auth button
  → handleAuthClick()
  → toggleAuthDropdown()
  → Close cart panel if open
  → Add class nav-tools-panel--show
  → Render SignIn dropin (if first time)
  → Check auth state and update UI
```

## Integration Points

### With Commerce Services
- Uses `window.publishShoppingCartViewEvent()` when opening cart
- Integrates with `@dropins/storefront-cart` for cart functionality
- Integrates with `@dropins/storefront-auth` for authentication

### With Event Bus
- Subscribes to `cart/data` events for badge updates
- Subscribes to `authenticated` events for auth state changes
- Uses eager subscription for immediate updates

### With Fragment Loading
- Loads `/mini-cart` fragment (configurable via metadata)
- Creates singleton instance from fragment
- Moves instance between containers responsively
- Handles loading errors gracefully

## Key Features

### Lazy Loading
- Dropins are initialized only when panels are first opened
- Fragment loading is deferred until needed
- Event listeners attached on demand

### Accessibility
- ARIA attributes: `aria-expanded`, `aria-hidden`, `aria-haspopup`
- Role attributes for panels
- Keyboard navigation support (ESC key handling can be added)

### Responsive Design
- Singleton mini cart moves between desktop/mobile containers
- Viewport-aware positioning with 992px breakpoint
- Resize listener with 150ms debouncing for smooth transitions
- Touch-friendly interaction areas

## Testing Considerations

### Functional Tests
1. **Panel Toggle**
   - Cart panel opens/closes correctly
   - Auth panel opens/closes correctly
   - Only one panel open at a time

2. **Event Integration**
   - Cart badge updates with item count
   - Auth state changes reflected in UI
   - Logout functionality works

3. **Fragment Loading**
   - Mini cart fragment loads correctly
   - Error handling for missing fragments
   - Singleton instance moves correctly between containers
   - Resize events trigger proper container movement

### Visual Tests
1. **Panel Positioning**
   - Desktop panels align correctly
   - Mobile panels respect viewport bounds
   - Z-index layering correct

2. **Transitions**
   - Smooth opacity/transform animations
   - No visual glitches during state changes

### Cross-browser Tests
- Chrome, Firefox, Safari, Edge
- Mobile browsers (iOS Safari, Chrome Mobile)
- Touch vs mouse interactions

## Performance Considerations

### Optimizations
- Lazy loading of dropins
- Event delegation for global clicks
- CSS transitions instead of JavaScript animations
- Fragment caching after first load
- Debounced resize listener (150ms) to prevent excessive DOM manipulation
- Singleton pattern reduces memory footprint

### Memory Management
- Event listener cleanup in `disconnectedCallback`
- Proper reference cleanup
- No memory leaks from repeated toggling

## Future Enhancements

### Potential Improvements
1. **Keyboard Navigation**
   - ESC key to close panels
   - Tab navigation within panels
   - Focus management

2. **Animation Enhancements**
   - Slide animations for mobile
   - Staggered animations for menu items

3. **State Persistence**
   - Remember panel states across navigation
   - Session storage for user preferences

4. **Advanced Features**
   - Quick add to cart from nav
   - User profile preview in auth dropdown
   - Recently viewed items in cart panel

## Migration from Header

### Key Differences
1. **Namespace**: Nav-specific class names to avoid conflicts
2. **Structure**: Integrated with existing nav component architecture
3. **Positioning**: Different panel positioning strategies
4. **Mobile**: Separate mobile component handling

### Shared Patterns
1. **Toggle Logic**: Same panel show/hide mechanism
2. **Event System**: Same commerce event integration
3. **State Management**: Similar auth state handling
4. **Dropin Integration**: Same dropin rendering approach

## Troubleshooting

### Common Issues
1. **Panels not showing**
   - Check CSS is loaded
   - Verify dropin containers exist
   - Check for JavaScript errors

2. **Events not updating**
   - Verify event bus is initialized
   - Check event listener registration
   - Confirm commerce services loaded

3. **Auth state incorrect**
   - Check cookie values
   - Verify auth API responses
   - Confirm dropin initialization

## Code Examples

### Adding Custom Panel Content
```javascript
// In nav-dropins.js
const customContent = document.createElement('div');
customContent.innerHTML = '<p>Custom content</p>';
cartContainer.appendChild(customContent);
```

### Listening to Panel Events
```javascript
// Custom event when panel opens
document.addEventListener('nav-panel-opened', (e) => {
  console.log('Panel opened:', e.detail.panelType);
});
```

### Extending Panel Functionality
```javascript
// Add to DesktopNavRoot class
customPanelMethod() {
  // Custom logic here
  this.toggleMiniCart();
  // Additional actions
}
```

## Conclusion
The navigation mini cart and authentication implementation successfully mirrors the header functionality while integrating seamlessly with the existing navigation architecture. The modular approach allows for easy maintenance and future enhancements while maintaining performance and accessibility standards.