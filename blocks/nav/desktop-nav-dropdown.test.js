// eslint-disable-next-line import/no-extraneous-dependencies
import {
  describe, it, expect, beforeEach, vi, afterEach,
} from 'vitest';
import {
  mockAEMEnvironment,
} from '../../tests/utils/test-helpers.js';

// Mock the data extractor
const mockExtractCategoriesFromNavData = vi.fn();
vi.mock('./nav-data-extractor.js', () => ({
  extractCategoriesFromNavData: mockExtractCategoriesFromNavData,
}));

// Mock URL search params
const mockURLSearchParams = vi.fn();
Object.defineProperty(global, 'URLSearchParams', {
  value: mockURLSearchParams,
  writable: true,
});

// Import after mocking
await import('./desktop-nav-dropdown.js');

describe('DesktopNavDropdown Component', () => {
  let component;
  let container;
  const mockCategories = [
    {
      id: 'personal-training',
      title: 'Personal Training',
      href: '/personal-training',
    },
    {
      id: 'nutrition',
      title: 'Nutrition',
      href: '/nutrition',
    },
  ];

  beforeEach(() => {
    document.body.innerHTML = '';
    document.head.innerHTML = '';
    mockAEMEnvironment();
    vi.clearAllMocks();

    // Setup mock data
    mockExtractCategoriesFromNavData.mockReturnValue(mockCategories);

    // Mock URLSearchParams
    mockURLSearchParams.mockImplementation(() => ({
      get: vi.fn().mockReturnValue(null),
    }));

    // Create component
    component = document.createElement('desktop-nav-dropdown');
    container = document.createElement('div');
    container.appendChild(component);
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  describe('Component Creation and Initialization', () => {
    it('should create desktop-nav-dropdown element', () => {
      expect(component).toBeInstanceOf(HTMLElement);
      expect(component.tagName).toBe('DESKTOP-NAV-DROPDOWN');
    });

    it('should initialize with default properties', () => {
      expect(component.isVisible).toBe(false);
      expect(component.activeCategory).toBe('personal-training');
      expect(component.categories).toEqual([]);
      expect(component.rootId).toBe('get-certified');
      expect(component.onMouseEnter).toBe(null);
      expect(component.onMouseLeave).toBe(null);
    });

    it('should load categories on connection', () => {
      component.connectedCallback();
      expect(mockExtractCategoriesFromNavData).toHaveBeenCalledWith('get-certified');
    });
  });

  describe('Debug Mode Functionality', () => {
    it('should be visible in debug mode', () => {
      mockURLSearchParams.mockImplementation(() => ({
        get: vi.fn().mockImplementation((param) => {
          if (param === 'debug') return 'true';
          return null;
        }),
      }));

      component.connectedCallback();

      expect(component.debugMode).toBe(true);
      expect(component.isVisible).toBe(true);
    });

    it('should be visible in force dropdown mode', () => {
      mockURLSearchParams.mockImplementation(() => ({
        get: vi.fn().mockImplementation((param) => {
          if (param === 'dropdown') return 'show';
          return null;
        }),
      }));

      component.connectedCallback();

      expect(component.forceDropdown).toBe(true);
      expect(component.isVisible).toBe(true);
    });

    it('should set default active category in force mode', () => {
      mockURLSearchParams.mockImplementation(() => ({
        get: vi.fn().mockImplementation((param) => {
          if (param === 'dropdown') return 'show';
          return null;
        }),
      }));

      component.connectedCallback();

      expect(component.activeCategory).toBe('personal-training');
    });
  });

  describe('Component Rendering', () => {
    beforeEach(() => {
      component.connectedCallback();
    });

    it('should render dropdown structure', () => {
      const dropdown = component.querySelector('.desktop-nav__dropdown');
      expect(dropdown).toBeTruthy();

      const dropdownContainer = component.querySelector('.desktop-nav__dropdown-container');
      // reference to avoid unused var lint error
      expect(dropdownContainer).toBeTruthy();
      expect(component).toBeTruthy();

      const sidebar = component.querySelector('.desktop-nav__dropdown-sidebar');
      expect(sidebar).toBeTruthy();

      const content = component.querySelector('.desktop-nav__dropdown-content');
      expect(content).toBeTruthy();
    });

    it('should render category buttons', () => {
      const categoryButtons = component.querySelectorAll('.desktop-nav__category-btn');
      expect(categoryButtons).toHaveLength(2);

      const firstButton = categoryButtons[0];
      expect(firstButton.href).toBe('http://localhost:3000/personal-training');
      expect(firstButton.textContent.trim()).toBe('Personal Training');
      expect(firstButton.dataset.categoryId).toBe('personal-training');
      expect(firstButton.dataset.active).toBe('true');

      const secondButton = categoryButtons[1];
      expect(secondButton.href).toBe('http://localhost:3000/nutrition');
      expect(secondButton.textContent.trim()).toBe('Nutrition');
      expect(secondButton.dataset.categoryId).toBe('nutrition');
      expect(secondButton.dataset.active).toBe('false');
    });

    it('should render third level content component', () => {
      const thirdLevelContent = component.querySelector('desktop-nav-third-level-content');
      expect(thirdLevelContent).toBeTruthy();
      expect(thirdLevelContent.getAttribute('root-id')).toBe('get-certified');
      expect(thirdLevelContent.getAttribute('category-id')).toBe('personal-training');
    });

    it('should apply visibility class when visible', () => {
      component.isVisible = true;
      component.render();

      const dropdown = component.querySelector('.desktop-nav__dropdown');
      expect(dropdown.classList.contains('is-visible')).toBe(true);
    });

    it('should not apply visibility class when hidden', () => {
      component.isVisible = false;
      component.render();

      const dropdown = component.querySelector('.desktop-nav__dropdown');
      expect(dropdown.classList.contains('is-visible')).toBe(false);
    });
  });

  describe('Dropdown State Management', () => {
    beforeEach(() => {
      component.connectedCallback();
    });

    it('should handle dropdown state change events', () => {
      const eventDetail = {
        activeDropdown: 'services',
        onMouseEnter: vi.fn(),
        onMouseLeave: vi.fn(),
      };

      const event = new CustomEvent('dropdown-state-change', {
        detail: eventDetail,
      });

      component.dispatchEvent(event);

      expect(component.isVisible).toBe(true);
      expect(component.onMouseEnter).toBe(eventDetail.onMouseEnter);
      expect(component.onMouseLeave).toBe(eventDetail.onMouseLeave);
      expect(component.rootId).toBe('services');
    });

    it('should stay visible in debug mode regardless of event', () => {
      component.debugMode = true;

      const event = new CustomEvent('dropdown-state-change', {
        detail: { activeDropdown: null },
      });

      component.dispatchEvent(event);

      expect(component.isVisible).toBe(true);
    });

    it('should reload categories when root changes', () => {
      const newCategories = [{ id: 'new-cat', title: 'New Category', href: '/new' }];
      mockExtractCategoriesFromNavData.mockReturnValueOnce(newCategories);

      const event = new CustomEvent('dropdown-state-change', {
        detail: { activeDropdown: 'new-root' },
      });

      component.dispatchEvent(event);

      // Should be called with new root
      expect(mockExtractCategoriesFromNavData).toHaveBeenCalledWith('new-root');
    });
  });

  describe('Category Interaction', () => {
    beforeEach(() => {
      component.connectedCallback();
    });

    it('should handle category hover', () => {
      const updateCategoryStateSpy = vi.spyOn(component, 'updateCategoryState');
      const eventSpy = vi.fn();
      component.addEventListener('category-change', eventSpy);

      component.handleCategoryHover('nutrition');

      expect(component.activeCategory).toBe('nutrition');
      expect(updateCategoryStateSpy).toHaveBeenCalled();
      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: { activeCategory: 'nutrition' },
        }),
      );
    });

    it('should update category button states', () => {
      component.handleCategoryHover('nutrition');

      const categoryButtons = component.querySelectorAll('.desktop-nav__category-btn');
      const firstButton = categoryButtons[0]; // personal-training
      const secondButton = categoryButtons[1]; // nutrition

      expect(firstButton.dataset.active).toBe('false');
      expect(firstButton.classList.contains('desktop-nav__category-btn--active')).toBe(false);

      expect(secondButton.dataset.active).toBe('true');
      expect(secondButton.classList.contains('desktop-nav__category-btn--active')).toBe(true);
    });

    it('should update third level content category', () => {
      component.handleCategoryHover('nutrition');

      const thirdLevelContent = component.querySelector('desktop-nav-third-level-content');
      expect(thirdLevelContent.getAttribute('category-id')).toBe('nutrition');
    });

    it('should add event listeners to category buttons', () => {
      const handleCategoryHoverSpy = vi.spyOn(component, 'handleCategoryHover');

      const categoryButtons = component.querySelectorAll('.desktop-nav__category-btn');
      const firstButton = categoryButtons[0];

      firstButton.dispatchEvent(new MouseEvent('mouseenter'));

      expect(handleCategoryHoverSpy).toHaveBeenCalledWith('personal-training');
    });
  });

  describe('Mouse Event Handling', () => {
    beforeEach(() => {
      component.connectedCallback();
    });

    it('should call onMouseEnter callback when dropdown is entered', () => {
      const mockOnMouseEnter = vi.fn();
      component.onMouseEnter = mockOnMouseEnter;

      component.handleDropdownMouseEnter();

      expect(mockOnMouseEnter).toHaveBeenCalled();
    });

    it('should call onMouseLeave callback when dropdown is left', () => {
      const mockOnMouseLeave = vi.fn();
      component.onMouseLeave = mockOnMouseLeave;

      component.handleDropdownMouseLeave();

      expect(mockOnMouseLeave).toHaveBeenCalled();
    });

    it('should handle null mouse callbacks gracefully', () => {
      component.onMouseEnter = null;
      component.onMouseLeave = null;

      expect(() => {
        component.handleDropdownMouseEnter();
        component.handleDropdownMouseLeave();
      }).not.toThrow();
    });

    it('should add mouse event listeners to dropdown', () => {
      const dropdown = component.querySelector('.desktop-nav__dropdown');

      // Should not throw when mouse events are dispatched
      expect(() => {
        dropdown.dispatchEvent(new MouseEvent('mouseenter'));
        dropdown.dispatchEvent(new MouseEvent('mouseleave'));
      }).not.toThrow();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle empty categories gracefully', () => {
      mockExtractCategoriesFromNavData.mockReturnValue([]);

      component.connectedCallback();

      const categoryButtons = component.querySelectorAll('.desktop-nav__category-btn');
      expect(categoryButtons).toHaveLength(0);

      const thirdLevelContent = component.querySelector('desktop-nav-third-level-content');
      expect(thirdLevelContent).toBeTruthy();
    });

    it('should handle missing category data gracefully', () => {
      mockExtractCategoriesFromNavData.mockReturnValue(null);

      expect(() => component.connectedCallback()).not.toThrow();
    });

    it('should handle missing third level content element', () => {
      component.connectedCallback();

      // Remove third level content
      const thirdLevelContent = component.querySelector('desktop-nav-third-level-content');
      thirdLevelContent.remove();

      expect(() => component.updateCategoryState()).not.toThrow();
    });

    it('should handle category buttons without category ID', () => {
      component.connectedCallback();

      // Add malformed button
      const badButton = document.createElement('a');
      badButton.className = 'desktop-nav__category-btn';
      // No data-category-id attribute
      component.querySelector('.desktop-nav__dropdown-sidebar').appendChild(badButton);

      expect(() => component.updateCategoryState()).not.toThrow();
    });

    it('should default to get-certified root when activeDropdown is null', () => {
      const event = new CustomEvent('dropdown-state-change', {
        detail: { activeDropdown: null },
      });

      component.dispatchEvent(event);

      expect(component.rootId).toBe('get-certified');
    });
  });

  describe('Promise Handling in State Changes', () => {
    beforeEach(() => {
      component.connectedCallback();
    });

    it('should handle successful category loading', async () => {
      const newCategories = [
        { id: 'new-cat', title: 'New Category', href: '/new' },
      ];

      mockExtractCategoriesFromNavData.mockResolvedValueOnce(newCategories);

      const event = new CustomEvent('dropdown-state-change', {
        detail: { activeDropdown: 'new-root' },
      });

      component.dispatchEvent(event);

      // Wait for promise resolution
      await new Promise((resolve) => { setTimeout(resolve, 0); });

      expect(component.categories).toEqual(newCategories);
      expect(component.activeCategory).toBe('new-cat');
    });

    it('should handle category loading with empty results', async () => {
      mockExtractCategoriesFromNavData.mockResolvedValueOnce([]);

      const event = new CustomEvent('dropdown-state-change', {
        detail: { activeDropdown: 'empty-root' },
      });

      component.dispatchEvent(event);

      // Wait for promise resolution
      await new Promise((resolve) => { setTimeout(resolve, 0); });

      expect(component.categories).toEqual([]);
      // activeCategory should remain unchanged when no categories
      expect(component.activeCategory).toBe('personal-training');
    });
  });

  describe('Component Lifecycle', () => {
    it('should set up dropdown state listener on connection', () => {
      const addEventListenerSpy = vi.spyOn(component, 'addEventListener');

      component.connectedCallback();

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'dropdown-state-change',
        expect.any(Function),
      );
    });

    it('should render immediately after connection', () => {
      const renderSpy = vi.spyOn(component, 'render');

      component.connectedCallback();

      expect(renderSpy).toHaveBeenCalled();
    });

    it('should apply debug settings before rendering', () => {
      mockURLSearchParams.mockImplementation(() => ({
        get: vi.fn().mockImplementation((param) => {
          if (param === 'debug') return 'true';
          return null;
        }),
      }));

      component.connectedCallback();

      expect(component.debugMode).toBe(true);
      expect(component.isVisible).toBe(true);

      const dropdown = component.querySelector('.desktop-nav__dropdown');
      expect(dropdown.classList.contains('is-visible')).toBe(true);
    });
  });

  describe('Category URL Generation', () => {
    it('should use provided href for categories', () => {
      component.connectedCallback();

      const categoryButtons = component.querySelectorAll('.desktop-nav__category-btn');
      expect(categoryButtons[0].href).toBe('http://localhost:3000/personal-training');
      expect(categoryButtons[1].href).toBe('http://localhost:3000/nutrition');
    });

    it('should generate default href for categories without href', () => {
      const categoriesWithoutHref = [
        { id: 'no-href', title: 'No Href Category' },
      ];

      mockExtractCategoriesFromNavData.mockReturnValue(categoriesWithoutHref);

      component.connectedCallback();

      const categoryButton = component.querySelector('.desktop-nav__category-btn');
      expect(categoryButton.href).toBe('http://localhost:3000/#');
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      component.connectedCallback();
    });

    it('should have focusable category buttons', () => {
      const categoryButtons = component.querySelectorAll('.desktop-nav__category-btn');

      categoryButtons.forEach((button) => {
        expect(button.tabIndex).not.toBe(-1);
        expect(button.href).toBeTruthy();
      });
    });

    it('should indicate active category state', () => {
      const activeButton = component.querySelector('.desktop-nav__category-btn--active');
      expect(activeButton).toBeTruthy();
      expect(activeButton.dataset.active).toBe('true');
    });

    it('should maintain keyboard navigation', () => {
      const categoryButtons = component.querySelectorAll('.desktop-nav__category-btn');

      categoryButtons.forEach((button) => {
        // Should be keyboard accessible
        expect(button.tagName).toBe('A');
        expect(button.href).toBeTruthy();
      });
    });
  });
});
