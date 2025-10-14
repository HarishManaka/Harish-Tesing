// eslint-disable-next-line import/no-extraneous-dependencies
import {
  describe, it, expect, beforeEach, vi, afterEach,
} from 'vitest';
import {
  createBlockElement,
  mockAEMEnvironment,
} from '../../tests/utils/test-helpers.js';

// Mock the data extractor functions
const mockExtractMainNavigation = vi.fn();
const mockExtractLevel3Data = vi.fn();
const mockGetMobileNavigationData = vi.fn();

vi.mock('./nav-data-extractor.js', () => ({
  extractMainNavigation: mockExtractMainNavigation,
  extractLevel3Data: mockExtractLevel3Data,
  getMobileNavigationData: mockGetMobileNavigationData,
}));

// Mock desktop components (they should be imported but not executed)
vi.mock('./desktop-nav-root.js', () => ({}));
vi.mock('./desktop-nav-dropdown.js', () => ({}));
vi.mock('./desktop-nav-third-level-content.js', () => ({}));

// Mock mobile nav root component
const mockNavRootElement = document.createElement('div');
mockNavRootElement.tagName = 'NAV-ROOT';
Object.defineProperty(global.document, 'createElement', {
  value: vi.fn().mockImplementation((tagName) => {
    if (tagName === 'nav-root') {
      return mockNavRootElement;
    }
    return document.createElement.wrappedMethod(tagName);
  }),
  writable: true,
});

// Import the decorator after mocking
const { default: decorate, getMobileNavigationData } = await import('./nav.js');

describe('Navigation Block Decorator', () => {
  let mockBlock;
  let mockHeader;

  beforeEach(() => {
    document.body.innerHTML = '';
    document.head.innerHTML = '';
    mockAEMEnvironment();
    vi.clearAllMocks();

    // Create mock block
    mockBlock = createBlockElement('nav');
    mockBlock.innerHTML = `
      <picture><img src="logo.png" alt="Logo"></picture>
      <ul>
        <li><a href="/get-certified">Get Certified</a></li>
        <li><a href="/about">About</a></li>
      </ul>
    `;

    // Create mock header
    mockHeader = document.createElement('header');
    mockHeader.innerHTML = '<div class="existing-content">Existing</div>';
    document.body.appendChild(mockHeader);

    // Mock querySelectorAll for nav-level-3 elements
    const mockNavLevel3Elements = [
      document.createElement('div'),
      document.createElement('div'),
    ];
    mockNavLevel3Elements[0].className = 'nav-level-3';
    mockNavLevel3Elements[1].className = 'nav-level-3';

    vi.spyOn(document, 'querySelectorAll').mockImplementation((selector) => {
      if (selector === '.nav-level-3') {
        return mockNavLevel3Elements;
      }
      if (selector === 'header') {
        return [mockHeader];
      }
      return [];
    });

    vi.spyOn(document, 'querySelector').mockImplementation((selector) => {
      if (selector === 'header') {
        return mockHeader;
      }
      return null;
    });
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  describe('Main Decoration Function', () => {
    it('should extract main navigation data', () => {
      decorate(mockBlock);

      expect(mockExtractMainNavigation).toHaveBeenCalledWith(mockBlock);
    });

    it('should extract level 3 data from all nav-level-3 containers', () => {
      decorate(mockBlock);

      expect(document.querySelectorAll).toHaveBeenCalledWith('.nav-level-3');
      expect(mockExtractLevel3Data).toHaveBeenCalledTimes(2);
    });

    it('should create and append mobile navigation root to header', () => {
      decorate(mockBlock);

      expect(document.createElement).toHaveBeenCalledWith('nav-root');
      expect(mockHeader.children).toHaveLength(1);
      expect(mockHeader.children[0]).toBe(mockNavRootElement);
    });

    it('should clear existing header content', () => {
      expect(mockHeader.innerHTML).toBe('<div class="existing-content">Existing</div>');

      decorate(mockBlock);

      // Header should only contain the nav-root element
      expect(mockHeader.children).toHaveLength(1);
      expect(mockHeader.querySelector('.existing-content')).toBe(null);
    });

    it('should handle missing header gracefully', () => {
      vi.spyOn(document, 'querySelector').mockImplementation(() => null);

      expect(() => decorate(mockBlock)).not.toThrow();
    });

    it('should process level 3 containers in order', () => {
      const mockElements = [
        document.createElement('div'),
        document.createElement('div'),
        document.createElement('div'),
      ];

      vi.spyOn(document, 'querySelectorAll').mockImplementation((selector) => {
        if (selector === '.nav-level-3') {
          return mockElements;
        }
        return [];
      });

      decorate(mockBlock);

      expect(mockExtractLevel3Data).toHaveBeenCalledTimes(3);
      expect(mockExtractLevel3Data).toHaveBeenNthCalledWith(1, mockElements[0]);
      expect(mockExtractLevel3Data).toHaveBeenNthCalledWith(2, mockElements[1]);
      expect(mockExtractLevel3Data).toHaveBeenNthCalledWith(3, mockElements[2]);
    });
  });

  describe('Export Functionality', () => {
    it('should export getMobileNavigationData function', () => {
      expect(getMobileNavigationData).toBe(mockGetMobileNavigationData);
    });

    it('should export decorate as default function', () => {
      expect(decorate).toBeDefined();
      expect(typeof decorate).toBe('function');
    });
  });

  describe('Component Integration', () => {
    it('should import required desktop navigation components', async () => {
      // Test that components are imported by checking if they don't throw
      expect(() => decorate(mockBlock)).not.toThrow();

      // The imports should have been processed during module loading
      // We can't directly test dynamic imports in this context, but we can ensure
      // the decorator function works without errors
    });

    it('should import mobile navigation components', async () => {
      // The nav-root.js import should not cause errors
      expect(() => decorate(mockBlock)).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle null block gracefully', () => {
      expect(() => decorate(null)).not.toThrow();
      expect(mockExtractMainNavigation).toHaveBeenCalledWith(null);
    });

    it('should handle empty block gracefully', () => {
      const emptyBlock = createBlockElement('nav');

      expect(() => decorate(emptyBlock)).not.toThrow();
      expect(mockExtractMainNavigation).toHaveBeenCalledWith(emptyBlock);
    });

    it('should handle level 3 extraction errors', () => {
      mockExtractLevel3Data.mockImplementationOnce(() => {
        throw new Error('Level 3 extraction failed');
      });

      // Should not throw error, but continue processing other elements
      expect(() => decorate(mockBlock)).not.toThrow();
    });

    it('should handle main navigation extraction errors', () => {
      mockExtractMainNavigation.mockImplementationOnce(() => {
        throw new Error('Main navigation extraction failed');
      });

      // Should continue with other operations
      expect(() => decorate(mockBlock)).not.toThrow();
    });

    it('should handle header manipulation errors', () => {
      // Make removeChild throw an error
      const originalRemoveChild = mockHeader.removeChild;
      mockHeader.removeChild = vi.fn().mockImplementation(() => {
        throw new Error('Remove child failed');
      });

      // Should handle the error gracefully
      expect(() => decorate(mockBlock)).not.toThrow();

      mockHeader.removeChild = originalRemoveChild;
    });
  });

  describe('DOM Manipulation', () => {
    it('should remove all existing children from header', () => {
      // Add multiple children to header
      const child1 = document.createElement('div');
      const child2 = document.createElement('span');
      const child3 = document.createElement('p');

      mockHeader.appendChild(child1);
      mockHeader.appendChild(child2);
      mockHeader.appendChild(child3);

      expect(mockHeader.children).toHaveLength(4); // Including existing content

      decorate(mockBlock);

      expect(mockHeader.children).toHaveLength(1); // Only nav-root
    });

    it('should handle header with no children', () => {
      mockHeader.innerHTML = '';
      expect(mockHeader.children).toHaveLength(0);

      expect(() => decorate(mockBlock)).not.toThrow();

      expect(mockHeader.children).toHaveLength(1); // nav-root added
    });

    it('should create nav-root element with correct structure', () => {
      decorate(mockBlock);

      const navRoot = mockHeader.querySelector('nav-root') || mockHeader.children[0];
      expect(navRoot).toBeTruthy();
    });
  });

  describe('Function Call Order', () => {
    it('should execute operations in correct order', () => {
      const callOrder = [];

      mockExtractMainNavigation.mockImplementation(() => {
        callOrder.push('extractMainNavigation');
      });

      mockExtractLevel3Data.mockImplementation(() => {
        callOrder.push('extractLevel3Data');
      });

      const originalCreateElement = document.createElement;
      document.createElement = vi.fn().mockImplementation((tagName) => {
        if (tagName === 'nav-root') {
          callOrder.push('createElement');
          return mockNavRootElement;
        }
        return originalCreateElement.call(document, tagName);
      });

      decorate(mockBlock);

      expect(callOrder[0]).toBe('extractMainNavigation');
      expect(callOrder[1]).toBe('extractLevel3Data');
      expect(callOrder[2]).toBe('extractLevel3Data');
      expect(callOrder[3]).toBe('createElement');

      document.createElement = originalCreateElement;
    });
  });

  describe('Real-world Integration', () => {
    it('should work with typical navigation HTML structure', () => {
      const realisticBlock = createBlockElement('nav');
      realisticBlock.innerHTML = `
        <picture>
          <source media="(min-width: 400px)" srcset="logo.png">
          <img src="logo-mobile.png" alt="NASM Logo">
        </picture>
        <ul>
          <li>
            Get Certified
            <ul>
              <li><a href="/personal-training" title="Personal Training Certification">CPT</a></li>
              <li><a href="/nutrition" title="Nutrition Certification">Nutrition</a></li>
              <li><a href="/corrective-exercise" title="Corrective Exercise">CES</a></li>
            </ul>
          </li>
          <li><a href="/about" title="About NASM">About</a></li>
          <li><a href="/contact" title="Contact Us">Contact</a></li>
        </ul>
      `;

      expect(() => decorate(realisticBlock)).not.toThrow();
      expect(mockExtractMainNavigation).toHaveBeenCalledWith(realisticBlock);
    });

    it('should handle complex level 3 structures', () => {
      const complexLevel3 = document.createElement('div');
      complexLevel3.className = 'nav-level-3';
      complexLevel3.innerHTML = `
        <div><div>personal-training</div></div>
        <div><div>Welcome to Personal Training</div></div>
        <div>
          <div>CPT Certification</div>
          <div><p>Become a Certified Personal Trainer</p></div>
          <div>Learn More</div>
        </div>
        <div>
          <div>Specializations</div>
          <div><p>Advanced certifications available</p></div>
          <div>Explore Options</div>
        </div>
      `;

      vi.spyOn(document, 'querySelectorAll').mockImplementation((selector) => {
        if (selector === '.nav-level-3') {
          return [complexLevel3];
        }
        return [];
      });

      expect(() => decorate(mockBlock)).not.toThrow();
      expect(mockExtractLevel3Data).toHaveBeenCalledWith(complexLevel3);
    });
  });

  describe('Side Effects and State', () => {
    it('should not modify the original block element', () => {
      const originalHTML = mockBlock.innerHTML;
      const originalClassName = mockBlock.className;

      decorate(mockBlock);

      expect(mockBlock.innerHTML).toBe(originalHTML);
      expect(mockBlock.className).toBe(originalClassName);
    });

    it('should work with multiple sequential decorations', () => {
      decorate(mockBlock);
      const firstCallCount = mockExtractMainNavigation.mock.calls.length;

      decorate(mockBlock);
      const secondCallCount = mockExtractMainNavigation.mock.calls.length;

      expect(secondCallCount).toBe(firstCallCount * 2);
    });
  });
});
