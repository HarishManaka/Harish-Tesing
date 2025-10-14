// eslint-disable-next-line import/no-extraneous-dependencies
import {
  describe, it, expect, beforeEach, vi, afterEach,
} from 'vitest';
import navigationStore from './nav-store.js';

describe('NavigationStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    navigationStore.reset();
    vi.clearAllMocks();
  });

  afterEach(() => {
    navigationStore.reset();
  });

  describe('Singleton Pattern', () => {
    it('should export the same instance', async () => {
      const { default: store1 } = await import('./nav-store.js');
      const { default: store2 } = await import('./nav-store.js');

      expect(store1).toBe(store2);
    });
  });

  describe('Initial State', () => {
    it('should have null navData initially', () => {
      expect(navigationStore.getNavData()).toBe(null);
    });

    it('should have empty level3DataList initially', () => {
      expect(navigationStore.getLevel3DataList()).toEqual([]);
    });

    it('should not be ready initially', () => {
      expect(navigationStore.isNavDataReady()).toBe(false);
    });
  });

  describe('Navigation Data Management', () => {
    const mockNavData = {
      logoElement: null,
      firstLevelElements: [
        {
          label: 'Get Certified',
          items: [
            { title: 'Personal Training', href: '/personal-training' },
            { title: 'Nutrition', href: '/nutrition' },
          ],
        },
        {
          label: 'About',
          href: '/about',
        },
      ],
    };

    it('should set and get navigation data', () => {
      navigationStore.setNavData(mockNavData);

      expect(navigationStore.getNavData()).toEqual(mockNavData);
      expect(navigationStore.isNavDataReady()).toBe(true);
    });

    it('should notify subscribers when navigation data changes', () => {
      const mockCallback = vi.fn();
      const unsubscribe = navigationStore.subscribe(mockCallback);

      navigationStore.setNavData(mockNavData);

      expect(mockCallback).toHaveBeenCalledWith({
        type: 'navData',
        data: mockNavData,
      });

      unsubscribe();
    });

    it('should handle null navigation data', () => {
      navigationStore.setNavData(null);

      expect(navigationStore.getNavData()).toBe(null);
      expect(navigationStore.isNavDataReady()).toBe(false);
    });
  });

  describe('Level 3 Data Management', () => {
    const mockLevel3Data = {
      id: 'personal-training',
      items: [
        { title: 'CPT Certification', isSquare: true },
        { title: 'Specializations', isSquare: false },
      ],
    };

    it('should add and get level 3 data', () => {
      navigationStore.addLevel3Data(mockLevel3Data);

      const level3List = navigationStore.getLevel3DataList();
      expect(level3List).toHaveLength(1);
      expect(level3List[0]).toEqual(mockLevel3Data);
    });

    it('should find level 3 data by ID', () => {
      navigationStore.addLevel3Data(mockLevel3Data);

      const found = navigationStore.findLevel3ById('personal-training');
      expect(found).toEqual(mockLevel3Data);
    });

    it('should return null for non-existent level 3 ID', () => {
      const found = navigationStore.findLevel3ById('non-existent');
      expect(found).toBe(null);
    });

    it('should notify subscribers when level 3 data is added', () => {
      const mockCallback = vi.fn();
      const unsubscribe = navigationStore.subscribe(mockCallback);

      navigationStore.addLevel3Data(mockLevel3Data);

      expect(mockCallback).toHaveBeenCalledWith({
        type: 'level3Data',
        data: [mockLevel3Data],
      });

      unsubscribe();
    });

    it('should accumulate multiple level 3 data items', () => {
      const data1 = { id: 'item1', items: [] };
      const data2 = { id: 'item2', items: [] };

      navigationStore.addLevel3Data(data1);
      navigationStore.addLevel3Data(data2);

      const level3List = navigationStore.getLevel3DataList();
      expect(level3List).toHaveLength(2);
      expect(level3List).toContain(data1);
      expect(level3List).toContain(data2);
    });
  });

  describe('Navigation Data Linking', () => {
    const navDataWithThirdLevel = {
      logoElement: null,
      firstLevelElements: [
        {
          label: 'Get Certified',
          items: [
            {
              title: 'Personal Training',
              href: '/personal-training',
              thirdLevel: ['personal-training-content'],
            },
          ],
        },
      ],
    };

    const level3Data = {
      id: 'personal-training-content',
      items: [{ title: 'CPT', isSquare: true }],
    };

    it('should link navigation data with level 3 data', () => {
      navigationStore.setNavData(navDataWithThirdLevel);
      navigationStore.addLevel3Data(level3Data);

      navigationStore.linkNavigationData();

      const linkedData = navigationStore.getNavData();
      const linkedItem = linkedData.firstLevelElements[0].items[0];

      expect(linkedItem.thirdLevelData).toEqual(level3Data);
      expect(linkedItem.thirdLevel).toEqual([]);
    });

    it('should handle navigation data without third level references', () => {
      const simpleNavData = {
        logoElement: null,
        firstLevelElements: [
          {
            label: 'About',
            href: '/about',
          },
        ],
      };

      navigationStore.setNavData(simpleNavData);
      navigationStore.linkNavigationData();

      expect(navigationStore.getNavData()).toEqual(simpleNavData);
    });

    it('should handle missing level 3 data gracefully', () => {
      navigationStore.setNavData(navDataWithThirdLevel);
      // Don't add matching level 3 data

      navigationStore.linkNavigationData();

      const linkedData = navigationStore.getNavData();
      const item = linkedData.firstLevelElements[0].items[0];

      expect(item.thirdLevelData).toBeUndefined();
      expect(item.thirdLevel).toEqual(['personal-training-content']);
    });

    it('should notify subscribers when navigation data is linked', () => {
      const mockCallback = vi.fn();
      const unsubscribe = navigationStore.subscribe(mockCallback);

      navigationStore.setNavData(navDataWithThirdLevel);
      vi.clearAllMocks(); // Clear the setNavData call

      navigationStore.linkNavigationData();

      expect(mockCallback).toHaveBeenCalledWith({
        type: 'navData',
        data: expect.any(Object),
      });

      unsubscribe();
    });
  });

  describe('Subscription Management', () => {
    it('should subscribe and unsubscribe callbacks', () => {
      const mockCallback = vi.fn();
      const unsubscribe = navigationStore.subscribe(mockCallback);

      // Should not be called initially
      expect(mockCallback).not.toHaveBeenCalled();

      // Should be called when data changes
      navigationStore.setNavData({ test: 'data' });
      expect(mockCallback).toHaveBeenCalledTimes(1);

      // Should not be called after unsubscribing
      unsubscribe();
      navigationStore.setNavData({ test: 'data2' });
      expect(mockCallback).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple subscribers', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      navigationStore.subscribe(callback1);
      navigationStore.subscribe(callback2);

      navigationStore.setNavData({ test: 'data' });

      expect(callback1).toHaveBeenCalledWith({
        type: 'navData',
        data: { test: 'data' },
      });
      expect(callback2).toHaveBeenCalledWith({
        type: 'navData',
        data: { test: 'data' },
      });
    });

    it('should handle callback errors gracefully', () => {
      const errorCallback = vi.fn().mockImplementation(() => {
        throw new Error('Callback error');
      });
      const goodCallback = vi.fn();

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      navigationStore.subscribe(errorCallback);
      navigationStore.subscribe(goodCallback);

      navigationStore.setNavData({ test: 'data' });

      expect(consoleSpy).toHaveBeenCalledWith('NavigationStore: Subscriber callback error:', expect.any(Error));
      expect(goodCallback).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('Reset Functionality', () => {
    it('should reset all data to initial state', () => {
      const mockCallback = vi.fn();
      navigationStore.subscribe(mockCallback);

      // Add some data
      navigationStore.setNavData({ test: 'data' });
      navigationStore.addLevel3Data({ id: 'test', items: [] });

      expect(navigationStore.getNavData()).not.toBe(null);
      expect(navigationStore.getLevel3DataList()).not.toEqual([]);

      // Reset
      navigationStore.reset();

      expect(navigationStore.getNavData()).toBe(null);
      expect(navigationStore.getLevel3DataList()).toEqual([]);
      expect(navigationStore.isNavDataReady()).toBe(false);

      // Should notify subscribers of reset
      expect(mockCallback).toHaveBeenLastCalledWith({
        type: 'reset',
        data: null,
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle undefined navigation data gracefully', () => {
      navigationStore.setNavData(undefined);
      expect(navigationStore.getNavData()).toBe(undefined);
      expect(navigationStore.isNavDataReady()).toBe(false);
    });

    it('should handle navigation data without firstLevelElements', () => {
      const incompleteData = { logoElement: null };
      navigationStore.setNavData(incompleteData);
      expect(navigationStore.isNavDataReady()).toBe(false);
    });

    it('should handle navigation data with empty firstLevelElements', () => {
      const emptyData = { logoElement: null, firstLevelElements: [] };
      navigationStore.setNavData(emptyData);
      expect(navigationStore.isNavDataReady()).toBe(false);
    });

    it('should handle level 3 data without id', () => {
      const badData = { items: [] };
      navigationStore.addLevel3Data(badData);

      const found = navigationStore.findLevel3ById('');
      expect(found).toBe(null);
    });

    it('should handle null level 3 data', () => {
      navigationStore.addLevel3Data(null);

      const level3List = navigationStore.getLevel3DataList();
      expect(level3List).toContain(null);
    });
  });

  describe('Data Structure Validation', () => {
    it('should preserve complex navigation data structure', () => {
      const complexNavData = {
        logoElement: { src: 'logo.png' },
        firstLevelElements: [
          {
            label: 'Get Certified',
            element: { tagName: 'LI' },
            items: [
              {
                title: 'Personal Training',
                href: '/personal-training',
                element: { tagName: 'A' },
                thirdLevel: ['pt-content'],
              },
              {
                title: 'Nutrition',
                href: '/nutrition',
                element: { tagName: 'A' },
              },
            ],
          },
        ],
      };

      navigationStore.setNavData(complexNavData);
      const retrieved = navigationStore.getNavData();

      expect(retrieved).toEqual(complexNavData);
      expect(retrieved.logoElement.src).toBe('logo.png');
      expect(retrieved.firstLevelElements[0].items[0].thirdLevel).toEqual(['pt-content']);
    });

    it('should preserve level 3 data structure with mixed item types', () => {
      const complexLevel3Data = {
        id: 'mixed-content',
        items: [
          {
            title: 'Header Content',
            element: { tagName: 'DIV' },
            isSquare: false,
          },
          {
            title: 'Square Content',
            description: { tagName: 'P' },
            footer: 'Learn More',
            isSquare: true,
          },
        ],
      };

      navigationStore.addLevel3Data(complexLevel3Data);
      const found = navigationStore.findLevel3ById('mixed-content');

      expect(found).toEqual(complexLevel3Data);
      expect(found.items[0].isSquare).toBe(false);
      expect(found.items[1].isSquare).toBe(true);
    });
  });
});
