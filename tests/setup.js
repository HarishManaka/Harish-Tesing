/* eslint-disable import/no-extraneous-dependencies */
// Test setup for Vitest
import { beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost',
  pretendToBeVisual: true,
  resources: 'usable',
});

global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.HTMLElement = dom.window.HTMLElement;
global.HTMLAnchorElement = dom.window.HTMLAnchorElement;
global.HTMLButtonElement = dom.window.HTMLButtonElement;
global.HTMLImageElement = dom.window.HTMLImageElement;
global.HTMLDivElement = dom.window.HTMLDivElement;
global.HTMLSpanElement = dom.window.HTMLSpanElement;
global.HTMLParagraphElement = dom.window.HTMLParagraphElement;
global.Event = dom.window.Event;
global.MouseEvent = dom.window.MouseEvent;
global.KeyboardEvent = dom.window.KeyboardEvent;
global.CustomEvent = dom.window.CustomEvent;

// Mock AEM-specific globals
global.window.adobeDataLayer = [];
global.window.alloy = vi.fn();

// Add setHTMLUnsafe polyfill for JSDOM
if (!global.window.HTMLElement.prototype.setHTMLUnsafe) {
  global.window.HTMLElement.prototype.setHTMLUnsafe = function setHTMLUnsafe(html) {
    this.innerHTML = html;
  };
}

// Mock common AEM functions
vi.mock('../scripts/aem.js', () => ({
  decorateBlocks: vi.fn(),
  decorateButtons: vi.fn(),
  decorateIcons: vi.fn(),
  loadHeader: vi.fn(),
  loadFooter: vi.fn(),
  loadCSS: vi.fn(),
  loadScript: vi.fn(),
  toCamelCase: vi.fn((str) => str.replace(/[-_]([a-z])/g, (match, letter) => letter.toUpperCase())),
  toClassName: vi.fn((str) => str.toLowerCase().replace(/[^a-z0-9]/gi, '-')),
  readBlockConfig: vi.fn(),
  sampleRUM: vi.fn(),
  getMetadata: vi.fn(),
}));

// Clean up after each test
beforeEach(() => {
  document.body.innerHTML = '';
  vi.clearAllMocks();
});

afterEach(() => {
  document.body.innerHTML = '';
  vi.clearAllMocks();
});
