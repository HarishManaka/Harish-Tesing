// eslint-disable-next-line import/no-extraneous-dependencies
import {
  describe, it, expect, beforeEach, vi, afterEach,
} from 'vitest';
import {
  mockAEMEnvironment,
} from '../../tests/utils/test-helpers.js';

// Mock the data extractor
const mockGetThirdLevelContentData = vi.fn();
vi.mock('./nav-data-extractor.js', () => ({
  getThirdLevelContentData: mockGetThirdLevelContentData,
}));

// Import after mocking
await import('./desktop-nav-third-level-content.js');

describe('DesktopNavThirdLevelContent Component', () => {
  let component;
  let container;

  const mockSquareItem = {
    title: 'CPT Certification',
    description: document.createElement('div'),
    footer: 'Learn More',
    isSquare: true,
  };

  const mockHeaderItem = {
    element: document.createElement('div'),
    isSquare: false,
  };

  const mockThirdLevelData = [mockHeaderItem, mockSquareItem];

  beforeEach(() => {
    document.body.innerHTML = '';
    document.head.innerHTML = '';
    mockAEMEnvironment();
    vi.clearAllMocks();

    // Setup mock description element
    mockSquareItem.description.innerHTML = '<p>Become a certified personal trainer</p>';

    // Setup mock header element
    mockHeaderItem.element.innerHTML = '<h3>Training Programs</h3>';

    // Setup mock data
    mockGetThirdLevelContentData.mockReturnValue(mockThirdLevelData);

    // Create component
    component = document.createElement('desktop-nav-third-level-content');
    container = document.createElement('div');
    container.appendChild(component);
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  describe('Component Creation and Initialization', () => {
    it('should create desktop-nav-third-level-content element', () => {
      expect(component).toBeInstanceOf(HTMLElement);
      expect(component.tagName).toBe('DESKTOP-NAV-THIRD-LEVEL-CONTENT');
    });

    it('should initialize with default properties', () => {
      expect(component.categoryId).toBe('personal-training');
      expect(component.rootId).toBe('get-certified');
      expect(component.allElements).toEqual([]);
    });

    it('should load data on connection', () => {
      component.connectedCallback();

      expect(mockGetThirdLevelContentData).toHaveBeenCalledWith('get-certified', 'personal-training');
      expect(component.allElements).toEqual(mockThirdLevelData);
    });
  });

  describe('Attribute Observation', () => {
    beforeEach(() => {
      component.connectedCallback();
      vi.clearAllMocks();
    });

    it('should observe category-id attribute changes', () => {
      const loadDataSpy = vi.spyOn(component, 'loadData');
      const renderSpy = vi.spyOn(component, 'render');

      component.setAttribute('category-id', 'nutrition');

      expect(loadDataSpy).toHaveBeenCalled();
      expect(renderSpy).toHaveBeenCalled();
      expect(component.categoryId).toBe('nutrition');
    });

    it('should observe root-id attribute changes', () => {
      const loadDataSpy = vi.spyOn(component, 'loadData');
      const renderSpy = vi.spyOn(component, 'render');

      component.setAttribute('root-id', 'services');

      expect(loadDataSpy).toHaveBeenCalled();
      expect(renderSpy).toHaveBeenCalled();
      expect(component.rootId).toBe('services');
    });

    it('should not reload when attribute value is the same', () => {
      const loadDataSpy = vi.spyOn(component, 'loadData');

      component.setAttribute('category-id', 'personal-training'); // Same as current

      expect(loadDataSpy).not.toHaveBeenCalled();
    });

    it('should handle null root-id attribute', () => {
      component.setAttribute('root-id', '');

      expect(component.rootId).toBe('get-certified'); // Should default
    });
  });

  describe('Data Loading', () => {
    it('should load third level content data', () => {
      component.categoryId = 'nutrition';
      component.rootId = 'services';

      component.loadData();

      expect(mockGetThirdLevelContentData).toHaveBeenCalledWith('services', 'nutrition');
      expect(component.allElements).toEqual(mockThirdLevelData);
    });

    it('should clear existing elements before loading new data', () => {
      component.allElements = [{ title: 'Old Data' }];

      component.loadData();

      expect(component.allElements).toEqual(mockThirdLevelData);
    });
  });

  describe('Component Rendering', () => {
    beforeEach(() => {
      component.connectedCallback();
    });

    it('should render third level content container', () => {
      const containerEl = component.querySelector('.desktop-nav__third-level-content');
      expect(containerEl).toBeTruthy();
    });

    it('should render header elements', () => {
      const headerElement = component.querySelector('.desktop-nav__header-element');
      expect(headerElement).toBeTruthy();
      expect(headerElement.innerHTML).toBe('<h3>Training Programs</h3>');
    });

    it('should render square elements in grid', () => {
      const grid = component.querySelector('.desktop-nav__squares-grid');
      expect(grid).toBeTruthy();

      const squareItems = component.querySelectorAll('.desktop-nav__square-item');
      expect(squareItems).toHaveLength(1);

      const squareItem = squareItems[0];
      const title = squareItem.querySelector('.desktop-nav__square-title');
      const description = squareItem.querySelector('.desktop-nav__square-description');
      const footer = squareItem.querySelector('.desktop-nav__square-footer');

      expect(title.textContent).toBe('CPT Certification');
      expect(description.innerHTML).toBe('<p>Become a certified personal trainer</p>');
      expect(footer.textContent).toBe('Learn More');
    });

    it('should group consecutive square items together', () => {
      const multipleSquares = [
        mockHeaderItem,
        {
          title: 'Square 1',
          description: document.createElement('div'),
          footer: 'Footer 1',
          isSquare: true,
        },
        {
          title: 'Square 2',
          description: document.createElement('div'),
          footer: 'Footer 2',
          isSquare: true,
        },
        {
          element: document.createElement('div'),
          isSquare: false,
        },
      ];

      mockGetThirdLevelContentData.mockReturnValue(multipleSquares);
      component.loadData();
      component.render();

      const grids = component.querySelectorAll('.desktop-nav__squares-grid');
      expect(grids).toHaveLength(1); // Should be one grid for consecutive squares

      const squareItems = grids[0].querySelectorAll('.desktop-nav__square-item');
      expect(squareItems).toHaveLength(2); // Two consecutive squares

      const headerElements = component.querySelectorAll('.desktop-nav__header-element');
      expect(headerElements).toHaveLength(2); // Two header elements (first and last)
    });

    it('should clear existing content before rendering', () => {
      // Add some initial content
      component.innerHTML = '<div class="old-content">Old</div>';

      component.render();

      const oldContent = component.querySelector('.old-content');
      expect(oldContent).toBe(null);

      const newContent = component.querySelector('.desktop-nav__third-level-content');
      expect(newContent).toBeTruthy();
    });

    it('should not render when no elements', () => {
      mockGetThirdLevelContentData.mockReturnValue([]);
      component.loadData();
      component.render();

      expect(component.innerHTML).toBe('');
    });
  });

  describe('Square Item Rendering Details', () => {
    // eslint-disable-next-line no-unused-vars
    const createMockSquareItem = (title, description, footer) => ({
      title,
      description: (() => {
        const div = document.createElement('div');
        div.innerHTML = description;
        return div;
      })(),
      footer,
      isSquare: true,
    });

    beforeEach(() => {
      component.connectedCallback();
    });

    it('should handle square items without title', () => {
      const noTitleItem = {
        description: document.createElement('div'),
        footer: 'Footer',
        isSquare: true,
      };

      mockGetThirdLevelContentData.mockReturnValue([noTitleItem]);
      component.loadData();
      component.render();

      const squareItem = component.querySelector('.desktop-nav__square-item');
      const title = squareItem.querySelector('.desktop-nav__square-title');
      expect(title).toBe(null);
    });

    it('should handle square items without description', () => {
      const noDescItem = {
        title: 'Title Only',
        footer: 'Footer',
        isSquare: true,
      };

      mockGetThirdLevelContentData.mockReturnValue([noDescItem]);
      component.loadData();
      component.render();

      const squareItem = component.querySelector('.desktop-nav__square-item');
      const description = squareItem.querySelector('.desktop-nav__square-description');
      expect(description).toBe(null);
    });

    it('should handle square items without footer', () => {
      const noFooterItem = {
        title: 'Title Only',
        description: document.createElement('div'),
        isSquare: true,
      };

      mockGetThirdLevelContentData.mockReturnValue([noFooterItem]);
      component.loadData();
      component.render();

      const squareItem = component.querySelector('.desktop-nav__square-item');
      const footer = squareItem.querySelector('.desktop-nav__square-footer');
      expect(footer).toBe(null);
    });

    it('should handle non-cloneable description objects', () => {
      const nonCloneableItem = {
        title: 'Test',
        description: 'Plain string description',
        footer: 'Footer',
        isSquare: true,
      };

      mockGetThirdLevelContentData.mockReturnValue([nonCloneableItem]);
      component.loadData();
      component.render();

      const description = component.querySelector('.desktop-nav__square-description');
      expect(description.textContent).toBe('Plain string description');
    });

    it('should preserve CSS classes on cloned description elements', () => {
      const descElement = document.createElement('div');
      descElement.className = 'original-class';
      descElement.innerHTML = '<p>Content</p>';

      const itemWithClasses = {
        title: 'Test',
        description: descElement,
        isSquare: true,
      };

      mockGetThirdLevelContentData.mockReturnValue([itemWithClasses]);
      component.loadData();
      component.render();

      const description = component.querySelector('.desktop-nav__square-description');
      expect(description.classList.contains('original-class')).toBe(true);
      expect(description.classList.contains('desktop-nav__square-description')).toBe(true);
    });
  });

  describe('Header Item Rendering', () => {
    it('should clone header elements', () => {
      const originalElement = document.createElement('div');
      originalElement.innerHTML = '<h2>Original Header</h2>';
      originalElement.className = 'original-header';

      const headerItem = {
        element: originalElement,
        isSquare: false,
      };

      mockGetThirdLevelContentData.mockReturnValue([headerItem]);
      component.loadData();
      component.render();

      const clonedElement = component.querySelector('.desktop-nav__header-element');
      expect(clonedElement.innerHTML).toBe('<h2>Original Header</h2>');
      expect(clonedElement.classList.contains('original-header')).toBe(true);
      expect(clonedElement.classList.contains('desktop-nav__header-element')).toBe(true);

      // Should be a different instance
      expect(clonedElement).not.toBe(originalElement);
    });

    it('should handle header items without elements', () => {
      const noElementItem = {
        isSquare: false,
      };

      mockGetThirdLevelContentData.mockReturnValue([noElementItem]);
      component.loadData();
      component.render();

      const headerElement = component.querySelector('.desktop-nav__header-element');
      expect(headerElement).toBe(null);
    });

    it('should preserve empty className on header elements', () => {
      const elementWithoutClass = document.createElement('div');
      elementWithoutClass.innerHTML = 'Content';

      const headerItem = {
        element: elementWithoutClass,
        isSquare: false,
      };

      mockGetThirdLevelContentData.mockReturnValue([headerItem]);
      component.loadData();
      component.render();

      const clonedElement = component.querySelector('.desktop-nav__header-element');
      expect(clonedElement.className).toBe(' desktop-nav__header-element');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    beforeEach(() => {
      // Mock console.warn to track warnings
      vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
      console.warn.mockRestore();
    });

    it('should handle rendering errors gracefully', () => {
      const badItem = {
        title: 'Bad Item',
        // Missing required properties to cause error
        isSquare: true,
      };

      // Mock Object.prototype to cause an error during rendering
      const originalDescriptor = Object.getOwnPropertyDescriptor(Object.prototype, 'hasOwnProperty');
      Object.defineProperty(badItem, 'description', {
        get() {
          throw new Error('Property access error');
        },
      });

      mockGetThirdLevelContentData.mockReturnValue([badItem]);
      component.loadData();

      expect(() => component.render()).not.toThrow();

      // Restore
      if (originalDescriptor) {
        // avoid modifying Object.prototype in tests per lint rule
        expect(typeof originalDescriptor).toBe('object');
      }
    });

    it('should handle unknown item types', () => {
      const unknownItem = {
        title: 'Unknown',
        isSquare: 'maybe', // Neither true nor false
      };

      mockGetThirdLevelContentData.mockReturnValue([unknownItem]);
      component.loadData();

      expect(() => component.render()).not.toThrow();
    });

    it('should handle mixed valid and invalid items', () => {
      const mixedItems = [
        mockHeaderItem, // Valid
        {
          title: 'Bad Item',
          isSquare: 'invalid',
        }, // Invalid
        mockSquareItem, // Valid
      ];

      mockGetThirdLevelContentData.mockReturnValue(mixedItems);
      component.loadData();

      expect(() => component.render()).not.toThrow();

      // Should render valid items
      const headerElement = component.querySelector('.desktop-nav__header-element');
      const squareItem = component.querySelector('.desktop-nav__square-item');

      expect(headerElement).toBeTruthy();
      expect(squareItem).toBeTruthy();
    });

    it('should handle empty or null allElements array', () => {
      mockGetThirdLevelContentData.mockReturnValue(null);
      component.loadData();

      expect(() => component.render()).not.toThrow();
      expect(component.innerHTML).toBe('');
    });
  });

  describe('DOM Structure Validation', () => {
    beforeEach(() => {
      component.connectedCallback();
    });

    it('should maintain proper DOM hierarchy', () => {
      const containerEl2 = component.querySelector('.desktop-nav__third-level-content');
      expect(containerEl2).toBeTruthy();
      expect(component.children).toHaveLength(1);
      expect(component.children[0]).toBe(containerEl2);
    });

    it('should create h4 elements for square titles', () => {
      const squareTitle = component.querySelector('.desktop-nav__square-title');
      expect(squareTitle).toBeTruthy();
      expect(squareTitle.tagName).toBe('H4');
    });

    it('should create div elements for square footers', () => {
      const squareFooter = component.querySelector('.desktop-nav__square-footer');
      expect(squareFooter).toBeTruthy();
      expect(squareFooter.tagName).toBe('DIV');
    });

    it('should maintain grid structure for square items', () => {
      const grid = component.querySelector('.desktop-nav__squares-grid');
      const squareItems = grid.children;

      Array.from(squareItems).forEach((item) => {
        expect(item.classList.contains('desktop-nav__square-item')).toBe(true);
      });
    });
  });

  describe('Attribute Initialization', () => {
    it('should use provided attributes on connection', () => {
      const newComponent = document.createElement('desktop-nav-third-level-content');
      newComponent.setAttribute('category-id', 'nutrition');
      newComponent.setAttribute('root-id', 'services');

      document.body.appendChild(newComponent);
      newComponent.connectedCallback();

      expect(newComponent.categoryId).toBe('nutrition');
      expect(newComponent.rootId).toBe('services');

      document.body.removeChild(newComponent);
    });

    it('should use default values when attributes are missing', () => {
      const newComponent = document.createElement('desktop-nav-third-level-content');

      document.body.appendChild(newComponent);
      newComponent.connectedCallback();

      expect(newComponent.categoryId).toBe('personal-training');
      expect(newComponent.rootId).toBe('get-certified');

      document.body.removeChild(newComponent);
    });
  });

  describe('Performance Considerations', () => {
    it('should not re-render unnecessarily', () => {
      const renderSpy = vi.spyOn(component, 'render');

      component.connectedCallback();
      renderSpy.mockClear();

      // Setting same attribute values should not trigger re-render
      component.setAttribute('category-id', 'personal-training');
      component.setAttribute('root-id', 'get-certified');

      expect(renderSpy).not.toHaveBeenCalled();
    });

    it('should efficiently handle large numbers of items', () => {
      const manyItems = Array.from({ length: 100 }, (_, i) => ({
        title: `Item ${i}`,
        description: document.createElement('div'),
        footer: `Footer ${i}`,
        isSquare: true,
      }));

      mockGetThirdLevelContentData.mockReturnValue(manyItems);
      component.loadData();

      const startTime = performance.now();
      component.render();
      const endTime = performance.now();

      // Rendering should complete in reasonable time (less than 100ms)
      expect(endTime - startTime).toBeLessThan(100);

      const squareItems = component.querySelectorAll('.desktop-nav__square-item');
      expect(squareItems).toHaveLength(100);
    });
  });
});
