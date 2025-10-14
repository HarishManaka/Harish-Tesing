# Navigation Enhancement Plan: Mini Cart & Login Implementation

## Overview
This document outlines the implementation plan for adding mini cart and login dropdown functionality to the NASM navigation blocks, mirroring the behavior from the header components.

## Current State Analysis

### Header Components (Reference Implementation)
- **Mini Cart**: Toggle panel with cart items, event-driven updates
- **Auth Dropdown**: Sign-in form with authenticated state management
- **Panel Management**: Uses `nav-tools-panel--show` class for visibility
- **Event System**: cart/data events for cart updates, authenticated events for auth state

### Navigation Components (To Be Enhanced)
- **Desktop Nav**: Has cart badge and sign-in button placeholders
- **Mobile Nav**: Has cart and user account buttons with badges
- **Classes**: `.desktop-nav__sign-in-btn`, `.desktop-nav__cart`, mobile equivalents

## Implementation Plan

### Commit 1: Add Mini Cart Panel Structure
**Files to modify:**
- `blocks/nav/desktop-nav-root.js`
- `blocks/nav/nav-mobile-header.js`

**Changes:**
1. Add mini cart panel HTML structure to desktop nav
2. Add mini cart panel HTML structure to mobile nav
3. Create toggle functionality for cart panels
4. Add panel visibility management with CSS classes

**Commit message:**
```
feat(nav): add mini cart panel structure for desktop and mobile nav

- Add mini cart panel HTML with dropin container
- Implement toggle functionality for cart visibility
- Add nav-tools-panel classes for consistency with header

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>
```

### Commit 2: Add Authentication Dropdown Structure
**Files to modify:**
- `blocks/nav/desktop-nav-root.js`
- `blocks/nav/nav-mobile-header.js`

**Changes:**
1. Replace sign-in button with dropdown button
2. Add auth panel with sign-in form container
3. Add authenticated user menu structure
4. Implement toggle functionality for auth panels

**Commit message:**
```
feat(nav): add authentication dropdown structure

- Replace static sign-in button with dropdown functionality
- Add auth panel with dropin container for sign-in form
- Include authenticated user menu for logged-in state
- Implement panel toggle logic

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>
```

### Commit 3: Integrate Commerce Dropins with Singleton Pattern
**Files to modify:**
- `blocks/nav/nav-dropins.js` (new file)
- `blocks/nav/desktop-nav-root.js`
- `blocks/nav/nav-mobile-header.js`

**Changes:**
1. Create nav-dropins.js for dropin initialization
2. Implement singleton mini cart pattern with responsive container movement
3. Add resize listener with debouncing (150ms) for smooth transitions
4. Import and render auth sign-in dropin (handled by login-nav widget)
5. Connect to commerce events

**Commit message:**
```
feat(nav): integrate commerce dropins with singleton mini cart

- Create nav-dropins.js for dropin management
- Implement singleton mini cart that moves between desktop/mobile containers
- Add debounced resize listener for responsive behavior
- Auth functionality handled by login-nav widget
- Connect to commerce event system

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>
```

### Commit 4: Add Event Listeners and State Management
**Files to modify:**
- `blocks/nav/desktop-nav-root.js`
- `blocks/nav/nav-mobile-header.js`
- `blocks/nav/nav-dropins.js`

**Changes:**
1. Add cart/data event listener for cart count updates
2. Add authenticated event listener for auth state changes
3. Implement click-outside handling to close panels
4. Add keyboard navigation (Escape key) support

**Commit message:**
```
feat(nav): add event listeners and state management

- Listen to cart/data events for badge updates
- Handle authenticated events for UI state changes
- Add click-outside detection to close panels
- Support keyboard navigation with Escape key

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>
```

### Commit 5: Add CSS Styles for Panels and States
**Files to modify:**
- `blocks/nav/nav.css`

**Changes:**
1. Add panel positioning and visibility styles
2. Add transition animations for smooth show/hide
3. Style authenticated vs unauthenticated states
4. Ensure responsive behavior for mobile/desktop

**Commit message:**
```
style(nav): add CSS for mini cart and auth panels

- Add panel positioning and z-index management
- Include smooth transition animations
- Style authenticated user menu
- Ensure responsive behavior across devices

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>
```

### Commit 6: Add Panel Coordination Logic
**Files to modify:**
- `blocks/nav/desktop-nav-root.js`
- `blocks/nav/nav-mobile-header.js`

**Changes:**
1. Ensure only one panel is open at a time
2. Close panels when navigating dropdown menus
3. Coordinate with existing dropdown behavior
4. Add proper ARIA attributes for accessibility

**Commit message:**
```
feat(nav): add panel coordination and accessibility

- Ensure mutual exclusivity of open panels
- Coordinate with navigation dropdown behavior
- Add ARIA attributes for screen readers
- Improve focus management for keyboard users

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>
```

### Commit 7: Add Fragment Loading with Singleton Support
**Files to modify:**
- `blocks/nav/nav-dropins.js`
- `blocks/nav/desktop-nav-root.js`

**Changes:**
1. Load mini-cart fragment if configured
2. Support metadata-driven cart path
3. Create singleton instance from fragment
4. Handle fragment loading errors gracefully
5. Implement responsive container movement with resize events

**Commit message:**
```
feat(nav): add fragment loading with singleton mini cart support

- Load mini-cart fragment from configured path
- Support metadata-driven configuration
- Create singleton instance that moves between containers
- Add error handling for fragment loading
- Implement responsive behavior with resize listener

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>
```

## Technical Implementation Details

### Key Classes and IDs
- **Panels**: `.nav-tools-panel`, `.nav-tools-panel--show`
- **Cart**: `.nav-cart-panel`, `.nav-cart-button`
- **Auth**: `.nav-auth-panel`, `.nav-auth-button`
- **Containers**: `#nav-cart-dropin`, `#nav-auth-dropin`

### Event System Integration
```javascript
// Cart updates
events.on('cart/data', (data) => {
  updateCartBadge(data.totalQuantity);
});

// Auth state changes
events.on('authenticated', (isAuthenticated) => {
  updateAuthUI(isAuthenticated);
});
```

### Panel State Management
```javascript
function togglePanel(panel, show) {
  const isVisible = panel.classList.contains('nav-tools-panel--show');
  if (show === undefined) show = !isVisible;
  
  // Close other panels
  closeOtherPanels(panel);
  
  // Toggle current panel
  panel.classList.toggle('nav-tools-panel--show', show);
  
  // Update ARIA attributes
  updateAriaAttributes(panel, show);
}
```

## Testing Checklist
- [ ] Cart panel opens/closes on button click
- [ ] Cart badge updates with item count
- [ ] Singleton mini cart moves correctly between desktop/mobile containers
- [ ] Resize events trigger proper container movement with debouncing
- [ ] Auth functionality works via login-nav widget
- [ ] Panels close when clicking outside
- [ ] Only one mini cart instance exists at any time
- [ ] Escape key closes panels
- [ ] Mobile navigation works correctly
- [ ] Desktop navigation maintains dropdown behavior
- [ ] ARIA attributes update correctly
- [ ] Focus management works for keyboard users
- [ ] Resize listener performs smoothly without excessive DOM manipulation

## Success Metrics
- Consistent behavior with header implementation
- Smooth transitions and animations
- Proper event-driven updates
- Accessibility compliance
- Mobile-responsive design
- Performance optimization (no lag on panel toggle)