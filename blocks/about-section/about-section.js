/**
 * aboutSection.js
 * ES module (no HTML required). Creates and manages an .about-section
 * - Lazy-loads responsive images with IntersectionObserver
 * - Generates srcset from a base CDN URL + width presets (edge-friendly)
 * - Exposes updateContent(), attachTracker(), destroy()
 *
 * Usage:
 * import { createAboutSection } from './aboutSection.js';
 * const widget = createAboutSection('#target', {
 *   title: 'Hello world',
 *   subtitle: 'We deliver at the edge.',
 *   img: { baseUrl: 'https://cdn.example.com/image.jpg', alt: 'Team' },
 *   aemProps: { cqPath: '/content/site/en/about' }
 * }, { imageWidths: [400,800,1200], preconnect: 'https://cdn.example.com' });
 *
 * // update:
 * widget.updateContent({ title: 'New title' });
 * // tracking:
 * widget.attachTracker((eventName, payload) => console.log(eventName, payload));
 * // destroy:
 * widget.destroy();
 */

const DEFAULT_IMAGE_WIDTHS = [360, 640, 960, 1280, 1600];

function createSrcSet(baseUrl, widths = DEFAULT_IMAGE_WIDTHS, params = {}) {
  // baseUrl should be CDN endpoint that accepts width param (e.g. ?w=... or /w_...).
  // We assume `?w=` style by default; allow params to customize query key and additional query.
  const widthKey = params.widthKey || 'w';
  const extraQuery = params.extraQuery || '';
  // If baseUrl already has query params, append with & else ?
  const hasQuery = baseUrl.includes('?');
  return widths
    .map((w) => {
      const sep = hasQuery ? '&' : '?';
      const url = `${baseUrl}${sep}${widthKey}=${w}${extraQuery}`;
      return `${url} ${w}w`;
    })
    .join(', ');
}

function createSizes(breakpoints = [{ mq: 900, size: '50vw' }, { mq: 0, size: '100vw' }]) {
  // produce sizes attribute like: (max-width:900px) 100vw, 50vw
  // We want largest-first in media queries
  return breakpoints
    .map((b) => (b.mq > 0 ? `(max-width: ${b.mq}px) ${b.size}` : `${b.size}`))
    .join(', ');
}

export function createAboutSection(target, data = {}, opts = {}) {
  // target: selector string or DOM element
  const container =
    typeof target === 'string' ? document.querySelector(target) : target instanceof Element ? target : null;
  if (!container) throw new Error('createAboutSection: target element not found');

  // Options with sensible defaults
  const {
    imageWidths = DEFAULT_IMAGE_WIDTHS,
    imageParams = { widthKey: 'w', extraQuery: '' }, // used by createSrcSet
    imageSizes = createSizes([{ mq: 900, size: '45vw' }, { mq: 0, size: '100vw' }]),
    lazyOffset = 200, // rootMargin for IntersectionObserver
    imageClass = 'about-image',
    preconnect,
    aemDataAttr = 'data-cq-path',
    ariaLabel = 'About section',
  } = opts;

  // internal state
  let tracker = null;
  let observer = null;
  let mounted = false;

  // Ensure container is clear
  container.innerHTML = '';

  // Add preconnect link for CDN if provided (edge-friendly optimization)
  if (preconnect) {
    const linkId = `about-preconnect-${btoa(preconnect).slice(0, 8)}`.replace(/=/g, '');
    if (!document.getElementById(linkId)) {
      const l = document.createElement('link');
      l.rel = 'preconnect';
      l.href = preconnect;
      l.id = linkId;
      document.head.appendChild(l);
    }
  }

  // Build DOM
  const section = document.createElement('section');
  section.className = 'about-section';
  section.setAttribute('role', 'region');
  section.setAttribute('aria-label', ariaLabel);
  if (data.aemPath || (data.aemProps && data.aemProps.cqPath)) {
    const val = (data.aemPath || (data.aemProps && data.aemProps.cqPath));
    section.setAttribute(aemDataAttr, val);
  }

  // left: text content
  const textContent = document.createElement('div');
  textContent.className = 'text-content';

  const maintext = document.createElement('h2');
  maintext.className = 'maintext';
  maintext.textContent = data.title || '';

  const subtext = document.createElement('p');
  subtext.className = 'subtext';
  subtext.innerHTML = data.subtitle || '';

  textContent.appendChild(maintext);
  textContent.appendChild(subtext);

  // right: image container
  const imageContainer = document.createElement('div');
  imageContainer.className = 'image-container';

  const img = document.createElement('img');
  img.className = imageClass;
  img.alt = (data.img && data.img.alt) || '';
  img.setAttribute('loading', 'lazy'); // fallback; we will lazy-load via observer and set src/srcset
  // accessibility: decorative images should have empty alt; we leave alt from data

  // set data attributes for lazy values
  if (data.img && data.img.baseUrl) {
    img.dataset.baseUrl = data.img.baseUrl;
    img.dataset.srcset = createSrcSet(data.img.baseUrl, imageWidths, imageParams);
    img.dataset.sizes = imageSizes;
  }

  imageContainer.appendChild(img);

  // append into section
  section.appendChild(textContent);
  section.appendChild(imageContainer);
  container.appendChild(section);

  // helper: notify tracker
  function notify(eventName, payload = {}) {
    if (typeof tracker === 'function') {
      try {
        tracker(eventName, Object.assign({ section: 'about-section' }, payload));
      } catch (e) {
        // swallow tracker errors to avoid breaking UI
        // eslint-disable-next-line no-console
        console.warn('Tracker callback threw', e);
      }
    }
  }

  // Lazy-load image using IntersectionObserver
  function initImageObserver() {
    if (!('IntersectionObserver' in window)) {
      // fallback: load immediately
      loadImage();
      return;
    }
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            loadImage();
            if (observer) {
              observer.disconnect();
              observer = null;
            }
          }
        });
      },
      { root: null, rootMargin: `${lazyOffset}px` }
    );
    observer.observe(img);
  }

  function loadImage() {
    const baseUrl = img.dataset.baseUrl;
    if (!baseUrl) return;
    // set src to smallest width (best-effort progressive load)
    const widths = imageWidths.slice().sort((a, b) => a - b);
    const smallest = widths[0];
    // assume same width param logic as createSrcSet (widthKey etc.)
    const src = baseUrl.includes('?') ? `${baseUrl}&${imageParams.widthKey}=${smallest}${imageParams.extraQuery || ''}` : `${baseUrl}?${imageParams.widthKey}=${smallest}${imageParams.extraQuery || ''}`;
    img.src = src;
    // set srcset and sizes
    img.srcset = img.dataset.srcset || createSrcSet(baseUrl, imageWidths, imageParams);
    img.sizes = img.dataset.sizes || imageSizes;
    img.addEventListener('load', () => {
      notify('imageLoaded', { src: img.src });
    }, { once: true });
    notify('imageRequested', { src });
  }

  // Exposed API
  const api = {
    updateContent(updates = {}) {
      // Partial updates: title, subtitle, img: { baseUrl, alt }, aemProps
      if (typeof updates.title === 'string') {
        maintext.textContent = updates.title;
        notify('contentUpdated', { field: 'title', value: updates.title });
      }
      if (typeof updates.subtitle === 'string') {
        subtext.innerHTML = updates.subtitle;
        notify('contentUpdated', { field: 'subtitle' });
      }
      if (updates.img && updates.img.baseUrl) {
        img.dataset.baseUrl = updates.img.baseUrl;
        img.dataset.srcset = createSrcSet(updates.img.baseUrl, imageWidths, imageParams);
        img.dataset.sizes = updates.img.sizes || imageSizes;
        if (typeof updates.img.alt === 'string') img.alt = updates.img.alt;
        // If image already loaded, replace src/srcset to trigger new fetch
        if (img.src) {
          // Reset and re-observe so new image gets loaded lazily
          img.removeAttribute('src');
          img.removeAttribute('srcset');
          if (observer) observer.observe(img);
          else initImageObserver();
        }
        notify('contentUpdated', { field: 'image' });
      }
      if (updates.aemPath || (updates.aemProps && updates.aemProps.cqPath)) {
        const val = updates.aemPath || (updates.aemProps && updates.aemProps.cqPath);
        section.setAttribute(aemDataAttr, val);
      }
    },
    attachTracker(fn) {
      if (typeof fn === 'function') tracker = fn;
    },
    forceLoadImage() {
      // Immediately load image (bypass observer)
      loadImage();
    },
    destroy() {
      if (observer) {
        observer.disconnect();
        observer = null;
      }
      // remove event listeners if any (we only used 'load' once)
      if (section.parentNode) section.parentNode.removeChild(section);
      mounted = false;
      notify('destroyed');
    },
    // expose elements for advanced usage (read-only)
    getElements() {
      return {
        section,
        textContent,
        maintext,
        subtext,
        imageContainer,
        img,
      };
    },
  };

  // Accessibility: if user prefers reduced motion, avoid animated transitions (example)
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    section.style.transition = 'none';
  }

  // Initialize image observer
  initImageObserver();

  mounted = true;
  notify('mounted', { target: container });

  return api;
}
