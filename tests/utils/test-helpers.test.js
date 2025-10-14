import {
  describe, it, expect, beforeEach,
} from 'vitest';
import {
  createBlockElement,
  loadBlockCSS,
  mockAEMEnvironment,
  waitForBlockDecoration,
  createMockImage,
  createMockLink,
  validateBlockStructure,
} from './test-helpers.js';

describe('Test Helpers', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.head.innerHTML = '';
  });

  describe('createBlockElement', () => {
    it('creates a basic block element', () => {
      const block = createBlockElement('hero');

      expect(block.className).toBe('hero');
      expect(block.dataset.blockName).toBe('hero');
      expect(block instanceof HTMLElement).toBe(true);
    });

    it('creates block with row data', () => {
      const rows = [
        ['Image', 'Content'],
        ['<h1>Title</h1>', '<p>Description</p>'],
      ];
      const block = createBlockElement('hero', rows);

      expect(block.children).toHaveLength(2);
      expect(block.children[0].children).toHaveLength(2);
      expect(block.children[1].children[0].innerHTML).toBe('<h1>Title</h1>');
    });
  });

  describe('loadBlockCSS', () => {
    it('injects CSS into document head', () => {
      const css = '.test { color: red; }';
      loadBlockCSS(css);

      const styleElements = document.head.querySelectorAll('style');
      expect(styleElements).toHaveLength(1);
      expect(styleElements[0].textContent).toBe(css);
    });
  });

  describe('mockAEMEnvironment', () => {
    it('sets up AEM environment variables', () => {
      mockAEMEnvironment();

      expect(window.hlx).toBeDefined();
      expect(window.hlx.codeBasePath).toBe('/scripts');
      expect(window.hlx.lighthouse).toBe(false);
      expect(window.hlx.rum.isSelected).toBe(false);
    });

    it('creates meta tags', () => {
      mockAEMEnvironment();

      const metaTags = document.head.querySelectorAll('meta');
      expect(metaTags.length).toBeGreaterThan(0);

      const viewport = document.head.querySelector('meta[name="viewport"]');
      expect(viewport.content).toBe('width=device-width, initial-scale=1');
    });
  });

  describe('waitForBlockDecoration', () => {
    it('resolves when block has block class', async () => {
      const block = createBlockElement('test');

      setTimeout(() => {
        block.classList.add('block');
      }, 50);

      const result = await waitForBlockDecoration(block);
      expect(result).toBe(block);
    });

    it('resolves when block has loaded status', async () => {
      const block = createBlockElement('test');

      setTimeout(() => {
        block.dataset.blockStatus = 'loaded';
      }, 50);

      const result = await waitForBlockDecoration(block);
      expect(result).toBe(block);
    });
  });

  describe('createMockImage', () => {
    it('creates image element with src and alt', () => {
      const img = createMockImage('/test.jpg', 'Test image');

      expect(img.src).toBe('http://localhost/test.jpg');
      expect(img.alt).toBe('Test image');
      expect(img instanceof HTMLImageElement).toBe(true);
    });
  });

  describe('createMockLink', () => {
    it('creates link element with href and text', () => {
      const link = createMockLink('/test', 'Test link');

      expect(link.href).toBe('http://localhost/test');
      expect(link.textContent).toBe('Test link');
      expect(link instanceof HTMLAnchorElement).toBe(true);
    });
  });

  describe('validateBlockStructure', () => {
    it('validates valid block structure', () => {
      const block = createBlockElement('test', [['content']]);
      const isValid = validateBlockStructure(block);

      expect(isValid).toBe(true);
    });

    it('invalidates empty block', () => {
      const block = document.createElement('div');
      const isValid = validateBlockStructure(block);

      expect(isValid).toBe(false);
    });
  });
});
