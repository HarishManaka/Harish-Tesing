// eslint-disable-next-line import/no-extraneous-dependencies
import {
  describe, it, expect, beforeEach, vi, afterEach,
} from 'vitest';
import {
  createBlockElement,
  mockAEMEnvironment,
  createMockLink,
} from '../../tests/utils/test-helpers.js';

// Mock the navigation store
const mockNavigationStore = {
  setNavData: vi.fn(),
  getNavData: vi.fn(),
  addLevel3Data: vi.fn(),
  linkNavigationData: vi.fn(),
  getLevel3DataList: vi.fn(() => []),
  findLevel3ById: vi.fn(() => null),
};

vi.mock('./nav-store.js', () => ({
  default: mockNavigationStore,
}));

// Import after mocking
const {
  buildNavData,
  extractMainNavigation,
  buildLevel3Data,
  extractLevel3Data,
  getMobileNavigationData,
  getDesktopNavigationData,
  extractCategoriesFromNavData,
  getThirdLevelContentData,
} = await import('./nav-data-extractor.js');

describe('Navigation Data Extractor', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.head.innerHTML = '';
    mockAEMEnvironment();
    vi.clearAllMocks();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('buildNavData', () => {
    it('should extract navigation data from simple list', () => {
      const block = createBlockElement('nav');
      block.innerHTML = `
        <picture><img src="logo.png" alt="Logo"></picture>
        <ul>
          <li><a href="/about">About</a></li>
          <li><a href="/contact">Contact</a></li>
        </ul>
      `;

      const result = buildNavData(block);

      expect(result.logoElement).toBeTruthy();
      expect(result.firstLevelElements).toHaveLength(2);
      expect(result.firstLevelElements[0]).toEqual({
        element: expect.any(HTMLAnchorElement),
        label: 'About',
        href: '/about',
      });
      expect(result.firstLevelElements[1]).toEqual({
        element: expect.any(HTMLAnchorElement),
        label: 'Contact',
        href: '/contact',
      });
    });

    it('should extract nested navigation structure', () => {
      const block = createBlockElement('nav');
      block.innerHTML = `
        <picture><img src="logo.png" alt="Logo"></picture>
        <ul>
          <li>
            Get Certified
            <ul>
              <li><a href="/cpt" title="Personal Training">CPT</a></li>
              <li><a href="/nutrition">Nutrition</a></li>
            </ul>
          </li>
          <li><a href="/about">About</a></li>
        </ul>
      `;

      const result = buildNavData(block);

      expect(result.firstLevelElements).toHaveLength(2);

      // First item should be nested
      const firstItem = result.firstLevelElements[0];
      expect(firstItem.label).toBe('Get Certified');
      expect(firstItem.items).toHaveLength(2);
      expect(firstItem.items[0]).toEqual({
        element: expect.any(HTMLAnchorElement),
        title: 'Personal Training',
        href: '/cpt',
      });
      expect(firstItem.items[1]).toEqual({
        element: expect.any(HTMLAnchorElement),
        title: 'CPT',
        href: '/nutrition',
      });

      // Second item should be simple
      const secondItem = result.firstLevelElements[1];
      expect(secondItem).toEqual({
        element: expect.any(HTMLAnchorElement),
        label: 'About',
        href: '/about',
      });
    });

    it('should handle third level navigation', () => {
      const block = createBlockElement('nav');
      block.innerHTML = `
        <ul>
          <li>
            Get Certified
            <ul>
              <li>
                <a href="/cpt">CPT</a>
                <ul>
                  <li>Certification Process</li>
                  <li>Study Materials</li>
                </ul>
              </li>
            </ul>
          </li>
        </ul>
      `;

      const result = buildNavData(block);
      const cptItem = result.firstLevelElements[0].items[0];

      expect(cptItem.thirdLevel).toEqual([
        'Certification Process',
        'Study Materials',
      ]);
    });

    it('should handle text with line breaks', () => {
      const block = createBlockElement('nav');
      const listItem = document.createElement('li');
      listItem.innerHTML = 'Get Certified<br>Now Available';
      const ul = document.createElement('ul');
      ul.appendChild(listItem);
      block.appendChild(ul);

      const result = buildNavData(block);

      expect(result.firstLevelElements[0].label).toBe('Get Certified');
    });

    it('should handle paragraph labels', () => {
      const block = createBlockElement('nav');
      block.innerHTML = `
        <ul>
          <li><p>Services</p><a href="/services">View All</a></li>
        </ul>
      `;

      const result = buildNavData(block);

      expect(result.firstLevelElements[0].label).toBe('Services');
    });

    it('should handle missing main list', () => {
      const block = createBlockElement('nav');
      block.innerHTML = '<picture><img src="logo.png" alt="Logo"></picture>';

      const result = buildNavData(block);

      expect(result.logoElement).toBeTruthy();
      expect(result.firstLevelElements).toEqual([]);
    });

    it('should handle empty navigation', () => {
      const block = createBlockElement('nav');

      const result = buildNavData(block);

      expect(result.logoElement).toBe(null);
      expect(result.firstLevelElements).toEqual([]);
    });
  });

  describe('extractMainNavigation', () => {
    it('should extract navigation and store in navigation store', () => {
      const block = createBlockElement('nav');
      block.innerHTML = '<ul><li><a href="/test">Test</a></li></ul>';

      extractMainNavigation(block);

      expect(mockNavigationStore.setNavData).toHaveBeenCalledWith(
        expect.objectContaining({
          logoElement: null,
          firstLevelElements: expect.any(Array),
        }),
      );
    });
  });

  describe('buildLevel3Data', () => {
    it('should extract level 3 data from container', () => {
      const container = document.createElement('div');
      container.className = 'nav-level-3';
      container.innerHTML = `
        <div><div>personal-training</div></div>
        <div><div>Header Content</div></div>
        <div>
          <div>CPT Certification</div>
          <div><p>Become a certified personal trainer</p></div>
          <div>Learn More</div>
        </div>
      `;
      document.body.appendChild(container);

      const result = buildLevel3Data(container);

      expect(result.id).toBe('personal-training');
      expect(result.items).toHaveLength(2);

      // First item should be header
      expect(result.items[0]).toEqual({
        element: expect.any(HTMLDivElement),
        isSquare: false,
      });

      // Second item should be square
      expect(result.items[1]).toEqual({
        element: expect.any(HTMLDivElement),
        title: 'CPT Certification',
        description: expect.any(HTMLDivElement),
        footer: 'Learn More',
        isSquare: true,
      });
    });

    it('should handle empty level 3 container', () => {
      const container = document.createElement('div');
      container.className = 'nav-level-3';
      container.innerHTML = '<div><div>test-id</div></div>';

      const result = buildLevel3Data(container);

      expect(result.id).toBe('test-id');
      expect(result.items).toEqual([]);
    });

    it('should handle malformed level 3 sections', () => {
      const container = document.createElement('div');
      container.className = 'nav-level-3';
      container.innerHTML = `
        <div><div>test-id</div></div>
        <div><div>Only One Div</div></div>
        <div><div>Two</div><div>Divs</div></div>
        <div><div>T</div><div>H</div><div>R</div><div>E</div><div>E</div></div>
      `;

      const result = buildLevel3Data(container);

      expect(result.items).toHaveLength(1); // Only the single div should be processed
      expect(result.items[0].isSquare).toBe(false);
    });
  });

  describe('extractLevel3Data', () => {
    it('should extract and store level 3 data', () => {
      const block = document.createElement('div');
      block.innerHTML = `
        <div><div>test-content</div></div>
        <div><div>Header</div></div>
      `;

      extractLevel3Data(block);

      expect(mockNavigationStore.addLevel3Data).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'test-content',
          items: expect.any(Array),
        }),
      );
      expect(mockNavigationStore.linkNavigationData).toHaveBeenCalled();
    });

    it('should handle extraction errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Force an error by making addLevel3Data throw
      mockNavigationStore.addLevel3Data.mockImplementationOnce(() => {
        throw new Error('Storage error');
      });

      const block = document.createElement('div');

      expect(() => extractLevel3Data(block)).not.toThrow();
      expect(consoleSpy).toHaveBeenCalledWith('Error extracting level 3 data:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('getMobileNavigationData', () => {
    it('should return empty array when no navigation data', () => {
      mockNavigationStore.getNavData.mockReturnValue(null);

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const result = getMobileNavigationData();

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('Navigation data not available yet');
      consoleSpy.mockRestore();
    });

    it('should transform navigation data to mobile format', () => {
      const mockNavData = {
        firstLevelElements: [
          {
            label: 'Get Certified',
            href: '/get-certified',
            items: [
              {
                title: 'Personal Training',
                href: '/personal-training',
                thirdLevelData: { items: [{ title: 'CPT' }] },
              },
              {
                title: 'Nutrition',
                href: '/nutrition',
              },
            ],
          },
          {
            label: 'About',
            href: '/about',
          },
        ],
      };

      mockNavigationStore.getNavData.mockReturnValue(mockNavData);

      const result = getMobileNavigationData();

      expect(result).toHaveLength(2);

      // First item with children
      expect(result[0]).toEqual({
        id: 'get-certified',
        title: 'Get Certified',
        url: '/get-certified',
        hasChildren: true,
        children: [
          {
            id: 'personal-training',
            title: 'Personal Training',
            url: '/personal-training',
            hasThirdLevel: true,
            thirdLevelData: { items: [{ title: 'CPT' }] },
          },
          {
            id: 'nutrition',
            title: 'Nutrition',
            url: '/nutrition',
            hasThirdLevel: false,
            thirdLevelData: undefined,
          },
        ],
      });

      // Second item without children
      expect(result[1]).toEqual({
        id: 'about',
        title: 'About',
        url: '/about',
        hasChildren: false,
        children: [],
      });
    });

    it('should handle missing or malformed navigation data', () => {
      mockNavigationStore.getNavData.mockReturnValue({
        firstLevelElements: [
          { label: null }, // Missing label
          { label: 'Valid Item', href: '/valid' },
        ],
      });

      const result = getMobileNavigationData();

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('unknown');
      expect(result[0].title).toBe('Untitled');
      expect(result[1].id).toBe('valid-item');
      expect(result[1].title).toBe('Valid Item');
    });
  });

  describe('getDesktopNavigationData', () => {
    it('should return empty array when no navigation data', () => {
      mockNavigationStore.getNavData.mockReturnValue(null);

      const result = getDesktopNavigationData();

      expect(result).toEqual([]);
    });

    it('should transform navigation data to desktop format', () => {
      const mockNavData = {
        firstLevelElements: [
          {
            label: 'Get Certified',
            href: '/get-certified',
            items: [{ title: 'CPT' }],
          },
          {
            label: 'About',
            href: '/about',
          },
        ],
      };

      mockNavigationStore.getNavData.mockReturnValue(mockNavData);

      const result = getDesktopNavigationData();

      expect(result).toEqual([
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
      ]);
    });
  });

  describe('extractCategoriesFromNavData', () => {
    it('should extract categories for given root ID', () => {
      const mockNavData = {
        firstLevelElements: [
          {
            label: 'Get Certified',
            items: [
              { title: 'Personal Training', href: '/pt' },
              { title: 'Nutrition Coaching', href: '/nutrition' },
            ],
          },
        ],
      };

      mockNavigationStore.getNavData.mockReturnValue(mockNavData);

      const result = extractCategoriesFromNavData('get-certified');

      expect(result).toEqual([
        {
          id: 'personal-training',
          title: 'Personal Training',
          href: '/pt',
        },
        {
          id: 'nutrition-coaching',
          title: 'Nutrition Coaching',
          href: '/nutrition',
        },
      ]);
    });

    it('should return empty array for non-existent root ID', () => {
      mockNavigationStore.getNavData.mockReturnValue({
        firstLevelElements: [{ label: 'Different Item' }],
      });

      const result = extractCategoriesFromNavData('non-existent');

      expect(result).toEqual([]);
    });

    it('should handle root item without children', () => {
      mockNavigationStore.getNavData.mockReturnValue({
        firstLevelElements: [
          { label: 'About', href: '/about' }, // No items property
        ],
      });

      const result = extractCategoriesFromNavData('about');

      expect(result).toEqual([]);
    });

    it('should generate default href for items without href', () => {
      const mockNavData = {
        firstLevelElements: [
          {
            label: 'Services',
            items: [
              { title: 'Personal Training' }, // No href
            ],
          },
        ],
      };

      mockNavigationStore.getNavData.mockReturnValue(mockNavData);

      const result = extractCategoriesFromNavData('services');

      expect(result[0].href).toBe('/personal-training');
    });
  });

  describe('getThirdLevelContentData', () => {
    it('should return third level content for category', () => {
      const mockNavData = {
        firstLevelElements: [
          {
            label: 'Get Certified',
            items: [
              {
                title: 'Personal Training',
                thirdLevelData: {
                  items: [
                    { title: 'CPT', isSquare: true },
                    { title: 'Header', isSquare: false },
                  ],
                },
              },
            ],
          },
        ],
      };

      mockNavigationStore.getNavData.mockReturnValue(mockNavData);

      const result = getThirdLevelContentData('get-certified', 'personal-training');

      expect(result).toEqual([
        { title: 'CPT', isSquare: true },
        { title: 'Header', isSquare: false },
      ]);
    });

    it('should return empty array when no third level data', () => {
      mockNavigationStore.getNavData.mockReturnValue({
        firstLevelElements: [
          {
            label: 'Get Certified',
            items: [
              { title: 'Personal Training' }, // No thirdLevelData
            ],
          },
        ],
      });

      const result = getThirdLevelContentData('get-certified', 'personal-training');

      expect(result).toEqual([]);
    });

    it('should return empty array for non-existent category', () => {
      mockNavigationStore.getNavData.mockReturnValue({
        firstLevelElements: [
          {
            label: 'Get Certified',
            items: [
              { title: 'Different Category' },
            ],
          },
        ],
      });

      const result = getThirdLevelContentData('get-certified', 'non-existent');

      expect(result).toEqual([]);
    });

    it('should handle case variations in IDs', () => {
      const mockNavData = {
        firstLevelElements: [
          {
            label: 'Get Certified',
            items: [
              {
                title: 'Personal Training',
                thirdLevelData: { items: [{ title: 'CPT' }] },
              },
            ],
          },
        ],
      };

      mockNavigationStore.getNavData.mockReturnValue(mockNavData);

      // Should match both kebab-case and original case
      expect(getThirdLevelContentData('get-certified', 'personal-training')).toHaveLength(1);
      expect(getThirdLevelContentData('get-certified', 'Personal Training')).toHaveLength(1);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle null DOM elements gracefully', () => {
      const result = buildNavData(null);

      // Should not throw and return safe defaults
      expect(result.logoElement).toBe(null);
      expect(result.firstLevelElements).toEqual([]);
    });

    it('should handle malformed HTML structure', () => {
      const block = createBlockElement('nav');
      block.innerHTML = `
        <ul>
          <li><!-- Empty anchor --><a></a></li>
          <li>Text only item</li>
          <li><a href="/valid">Valid item</a></li>
        </ul>
      `;

      const result = buildNavData(block);

      // Should process valid items and skip invalid ones
      expect(result.firstLevelElements.length).toBeGreaterThan(0);
    });

    it('should preserve original DOM elements in navigation data', () => {
      const block = createBlockElement('nav');
      const anchor = createMockLink('/test', 'Test Link');
      const listItem = document.createElement('li');
      listItem.appendChild(anchor);
      const ul = document.createElement('ul');
      ul.appendChild(listItem);
      block.appendChild(ul);

      const result = buildNavData(block);

      expect(result.firstLevelElements[0].element).toBe(anchor);
      expect(result.firstLevelElements[0].element.href).toBe('/test');
    });
  });
});
