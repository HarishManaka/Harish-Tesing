// eslint-disable-next-line import/no-extraneous-dependencies
import {
  describe, it, expect, beforeEach, vi, afterEach,
} from 'vitest';
import {
  mockAEMEnvironment,
} from '../../tests/utils/test-helpers.js';

// Mock the data extractor
const mockGetDesktopNavigationData = vi.fn();
vi.mock('./nav-data-extractor.js', () => ({
  getDesktopNavigationData: mockGetDesktopNavigationData,
}));

// Mock URL search params
const mockURLSearchParams = vi.fn();
Object.defineProperty(global, 'URLSearchParams', {
  value: mockURLSearchParams,
  writable: true,
});

// Import after mocking
await import('./desktop-nav-root.js');

describe('DesktopNavRoot Component', () => {
  let component;
  let container;
  const mockNavigationData = [
    {
      id: 'get-certified',
      title: 'Get Certified',
      url: '/get-certified',
      highlight: false,
      hasChildren: true,
    },
    {
      id: 'about',
      title: 'About',
      url: '/about',
      highlight: false,
      hasChildren: false,
    },
  ];

  beforeEach(() => {
    document.body.innerHTML = '';
    document.head.innerHTML = '';
    mockAEMEnvironment();
    vi.clearAllMocks();

    // Mock console methods
    vi.spyOn(console, 'error').mockImplementation(() => {});

    // Setup mock data
    mockGetDesktopNavigationData.mockReturnValue(mockNavigationData);

    // Mock URLSearchParams
    mockURLSearchParams.mockImplementation(() => ({
      get: vi.fn().mockReturnValue(null),
    }));

    // Create component
    component = document.createElement('desktop-nav-root');
    container = document.createElement('div');
    container.appendChild(component);
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  describe('Component Creation and Initialization', () => {
    it('should create desktop-nav-root element', () => {
      expect(component).toBeInstanceOf(HTMLElement);
      expect(component.tagName).toBe('DESKTOP-NAV-ROOT');
    });

    it('should be registered as custom element', () => {
      const testElement = document.createElement('desktop-nav-root');
      expect(testElement).toBeInstanceOf(HTMLElement);
    });

    it('should initialize with default properties', () => {
      expect(component.activeDropdown).toBe(null);
      expect(component.closeTimeout).toBe(null);
      expect(component.mainNavItems).toEqual([]);
    });

    it('should load navigation data on connection', () => {
      component.connectedCallback();
      expect(mockGetDesktopNavigationData).toHaveBeenCalled();
    });
  });

  describe('Component Rendering', () => {
    beforeEach(() => {
      component.connectedCallback();
    });

    it('should render desktop navigation structure', () => {
      const desktopNav = component.querySelector('.desktop-nav');
      expect(desktopNav).toBeTruthy();

      const header = component.querySelector('.desktop-nav__header');
      expect(header).toBeTruthy();

      const navContainer = component.querySelector('.desktop-nav__container');
      expect(navContainer).toBeTruthy();
    });

    it('should render logo', () => {
      const logo = component.querySelector('.desktop-nav__logo');
      expect(logo).toBeTruthy();

      const svg = logo.querySelector('svg');
      expect(svg).toBeTruthy();
      expect(svg.getAttribute('width')).toBe('117');
      expect(svg.getAttribute('height')).toBe('48');
    });

    it('should render navigation items', () => {
      const navList = component.querySelector('.desktop-nav__nav-list');
      expect(navList).toBeTruthy();

      const navItems = component.querySelectorAll('.desktop-nav__nav-item');
      expect(navItems).toHaveLength(2);

      const firstItem = navItems[0];
      const firstLink = firstItem.querySelector('.desktop-nav__nav-link');
      expect(firstLink.href).toBe('http://localhost:3000/get-certified');
      expect(firstLink.textContent.trim()).toBe('Get Certified');
      expect(firstLink.dataset.itemId).toBe('get-certified');
    });

    it('should render action buttons', () => {
      const actions = component.querySelector('.desktop-nav__actions');
      expect(actions).toBeTruthy();

      const phoneSection = component.querySelector('.desktop-nav__phone');
      expect(phoneSection).toBeTruthy();
      expect(phoneSection.textContent).toContain('800-460-6276');

      const searchBtn = component.querySelector('.desktop-nav__action-btn[aria-label="Search"]');
      expect(searchBtn).toBeTruthy();

      const cartBtn = component.querySelector('.desktop-nav__cart');
      expect(cartBtn).toBeTruthy();

      const signInBtn = component.querySelector('.desktop-nav__sign-in-btn');
      expect(signInBtn).toBeTruthy();
      expect(signInBtn.textContent).toBe('Sign in');
    });

    it('should render dropdown component', () => {
      const dropdown = component.querySelector('desktop-nav-dropdown');
      expect(dropdown).toBeTruthy();
    });
  });

  describe('Debug Mode Functionality', () => {
    it('should handle debug mode enabled', () => {
      mockURLSearchParams.mockImplementation(() => ({
        get: vi.fn().mockImplementation((param) => {
          if (param === 'debug') return 'true';
          return null;
        }),
      }));

      component.connectedCallback();

      expect(component.debugMode).toBe(true);
    });

    it('should handle force dropdown mode', () => {
      mockURLSearchParams.mockImplementation(() => ({
        get: vi.fn().mockImplementation((param) => {
          if (param === 'dropdown') return 'show';
          return null;
        }),
      }));

      component.connectedCallback();

      expect(component.forceDropdown).toBe(true);
    });

    it('should auto-activate first dropdown item in force mode', () => {
      mockURLSearchParams.mockImplementation(() => ({
        get: vi.fn().mockImplementation((param) => {
          if (param === 'dropdown') return 'show';
          return null;
        }),
      }));

      const setActiveDropdownSpy = vi.spyOn(component, 'setActiveDropdown');

      component.connectedCallback();

      expect(setActiveDropdownSpy).toHaveBeenCalledWith('get-certified');
    });
  });

  describe('Mouse Interaction Handling', () => {
    beforeEach(() => {
      component.connectedCallback();
      vi.spyOn(component, 'setActiveDropdown');
    });

    it('should handle mouse enter on dropdown item', () => {
      component.handleMouseEnter('get-certified');

      expect(component.setActiveDropdown).toHaveBeenCalledWith('get-certified');
    });

    it('should handle mouse enter on non-dropdown item', () => {
      component.handleMouseEnter('about');

      expect(component.setActiveDropdown).toHaveBeenCalledWith(null);
    });

    it('should handle mouse leave with delay', () => {
      vi.useFakeTimers();
      component.handleMouseLeave();

      expect(component.closeTimeout).toBeTruthy();

      vi.advanceTimersByTime(100);
      expect(component.setActiveDropdown).toHaveBeenCalledWith(null);

      vi.useRealTimers();
    });

    it('should not close on mouse leave in force dropdown mode', () => {
      component.forceDropdown = true;
      component.handleMouseLeave();

      expect(component.closeTimeout).toBe(null);
    });

    it('should clear timeout on mouse enter', () => {
      vi.useFakeTimers();

      // Start leave timeout
      component.handleMouseLeave();
      const initialTimeout = component.closeTimeout;
      expect(initialTimeout).toBeTruthy();

      // Enter should clear timeout
      component.handleMouseEnter('get-certified');
      expect(component.closeTimeout).toBe(null);

      vi.useRealTimers();
    });
  });

  describe('Dropdown State Management', () => {
    beforeEach(() => {
      component.connectedCallback();
    });

    it('should set active dropdown', () => {
      const updateDropdownStateSpy = vi.spyOn(component, 'updateDropdownState');
      const updateNavItemStatesSpy = vi.spyOn(component, 'updateNavItemStates');

      component.setActiveDropdown('get-certified');

      expect(component.activeDropdown).toBe('get-certified');
      expect(updateDropdownStateSpy).toHaveBeenCalled();
      expect(updateNavItemStatesSpy).toHaveBeenCalled();
    });

    it('should update nav item states', () => {
      component.setActiveDropdown('get-certified');

      const navItems = component.querySelectorAll('.desktop-nav__nav-item');
      const activeItem = navItems[0];
      const inactiveItem = navItems[1];

      expect(activeItem.dataset.active).toBe('true');
      expect(inactiveItem.dataset.active).toBe('false');

      const activeLink = activeItem.querySelector('.desktop-nav__nav-link');
      const inactiveLink = inactiveItem.querySelector('.desktop-nav__nav-link');

      expect(activeLink.classList.contains('desktop-nav__nav-link--active')).toBe(true);
      expect(inactiveLink.classList.contains('desktop-nav__nav-link--active')).toBe(false);
    });

    it('should update active indicator', () => {
      component.setActiveDropdown('get-certified');

      const indicator = component.querySelector('.desktop-nav__active-indicator');
      expect(indicator).toBeTruthy();

      // Should be attached to active nav item
      const activeNavItem = component.querySelector('[data-item-id="get-certified"]')?.closest('.desktop-nav__nav-item');
      expect(activeNavItem.contains(indicator)).toBe(true);
    });

    it('should remove existing indicators before adding new one', () => {
      // Set first dropdown active
      component.setActiveDropdown('get-certified');
      expect(component.querySelectorAll('.desktop-nav__active-indicator')).toHaveLength(1);

      // Switch to different dropdown
      component.setActiveDropdown('about');
      expect(component.querySelectorAll('.desktop-nav__active-indicator')).toHaveLength(0);
    });

    it('should dispatch dropdown state change event', () => {
      const dropdown = component.querySelector('desktop-nav-dropdown');
      const eventSpy = vi.fn();
      dropdown.addEventListener('dropdown-state-change', eventSpy);

      component.setActiveDropdown('get-certified');

      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: expect.objectContaining({
            activeDropdown: 'get-certified',
            onMouseEnter: component.handleDropdownMouseEnter,
            onMouseLeave: component.handleDropdownMouseLeave,
          }),
        }),
      );
    });
  });

  describe('Dropdown Mouse Handlers', () => {
    beforeEach(() => {
      component.connectedCallback();
    });

    it('should clear timeout on dropdown mouse enter', () => {
      vi.useFakeTimers();

      component.handleMouseLeave();
      const timeout = component.closeTimeout;

      component.handleDropdownMouseEnter();
      expect(component.closeTimeout).toBe(null);
      expect(timeout).not.toBe(null);

      vi.useRealTimers();
    });

    it('should close immediately on dropdown mouse leave', () => {
      const updateDropdownStateSpy = vi.spyOn(component, 'updateDropdownState');

      component.handleDropdownMouseLeave();

      expect(component.activeDropdown).toBe(null);
      expect(updateDropdownStateSpy).toHaveBeenCalled();
    });

    it('should not close on dropdown mouse leave in force mode', () => {
      component.forceDropdown = true;
      component.activeDropdown = 'get-certified';

      component.handleDropdownMouseLeave();

      expect(component.activeDropdown).toBe('get-certified');
    });
  });

  describe('Event Listeners', () => {
    beforeEach(() => {
      component.connectedCallback();
    });

    it('should add event listeners to navigation items', () => {
      const navItems = component.querySelectorAll('.desktop-nav__nav-item');

      expect(navItems).toHaveLength(2);

      // Test mouse events don't throw errors
      navItems.forEach((item) => {
        expect(() => {
          item.dispatchEvent(new MouseEvent('mouseenter'));
          item.dispatchEvent(new MouseEvent('mouseleave'));
        }).not.toThrow();
      });
    });

    it('should handle missing item ID gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Create a nav item without data-item-id
      const badItem = document.createElement('li');
      badItem.className = 'desktop-nav__nav-item';
      badItem.innerHTML = '<a class="desktop-nav__nav-link">Bad Link</a>';
      component.querySelector('.desktop-nav__nav-list').appendChild(badItem);

      // Should log error but not crash
      component.addEventListeners();

      expect(consoleSpy).toHaveBeenCalledWith('DesktopNavRoot addEventListeners: missing itemId');
      consoleSpy.mockRestore();
    });
  });

  describe('Component Lifecycle', () => {
    it('should clean up on disconnection', () => {
      vi.useFakeTimers();

      component.connectedCallback();
      component.handleMouseLeave();

      expect(component.closeTimeout).toBeTruthy();

      component.disconnectedCallback();

      expect(component.closeTimeout).toBe(null);

      vi.useRealTimers();
    });

    it('should handle initialization errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockGetDesktopNavigationData.mockImplementationOnce(() => {
        throw new Error('Data loading failed');
      });

      expect(() => component.connectedCallback()).not.toThrow();
      expect(consoleSpy).toHaveBeenCalledWith('DesktopNavRoot initializeComponent error:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle missing dropdown element gracefully', () => {
      component.connectedCallback();

      // Remove dropdown element
      const dropdown = component.querySelector('desktop-nav-dropdown');
      dropdown.remove();

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      component.updateDropdownState();

      expect(consoleSpy).toHaveBeenCalledWith('DesktopNavRoot updateDropdownState: dropdown element not found');
      consoleSpy.mockRestore();
    });

    it('should handle empty navigation data', () => {
      mockGetDesktopNavigationData.mockReturnValue([]);

      component.connectedCallback();

      const navItems = component.querySelectorAll('.desktop-nav__nav-item');
      expect(navItems).toHaveLength(0);
    });

    it('should handle null navigation data', () => {
      mockGetDesktopNavigationData.mockReturnValue(null);

      expect(() => component.connectedCallback()).not.toThrow();
    });

    it('should cleanup timeout properly', () => {
      vi.useFakeTimers();

      component.closeTimeout = setTimeout(() => {}, 1000);
      // Keep a reference to ensure timeout is created before cleanup
      const timeoutRef = component.closeTimeout; // eslint-disable-line no-unused-vars

      component.cleanup();

      expect(component.closeTimeout).toBe(null);
      // Timeout should be cleared

      vi.useRealTimers();
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      component.connectedCallback();
    });

    it('should have proper ARIA labels on action buttons', () => {
      const searchBtn = component.querySelector('[aria-label="Search"]');
      const cartBtn = component.querySelector('[aria-label="Shopping cart"]');

      expect(searchBtn).toBeTruthy();
      expect(cartBtn).toBeTruthy();
    });

    it('should have focusable navigation links', () => {
      const navLinks = component.querySelectorAll('.desktop-nav__nav-link');

      navLinks.forEach((link) => {
        expect(link.tabIndex).not.toBe(-1);
        expect(link.href).toBeTruthy();
      });
    });

    it('should have focusable action buttons', () => {
      const buttons = component.querySelectorAll('button');

      buttons.forEach((button) => {
        expect(button.tabIndex).not.toBe(-1);
      });
    });
  });
});
