/**
 * Header Block
 *
 * IMPORTANT: This is a minimal wrapper that only handles legacy compatibility.
 * The actual navigation implementation is in blocks/nav/
 *
 * Most functionality has been moved to the nav block to avoid duplication.
 * This file remains for:
 * 1. Pages that still reference the header block
 * 2. Shared utilities like searchbar.js
 */
import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

/**
 * Decorates the header block.
 *
 * This function now serves as a compatibility layer that delegates
 * to the nav block for actual navigation functionality.
 *
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  // Clear the block content
  block.textContent = '';

  // Add a placeholder message or minimal structure
  // The actual navigation will be handled by the nav block
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  await loadFragment(navPath);

  const placeholder = document.createElement('div');
  placeholder.className = 'header-placeholder';
  placeholder.innerHTML = `
    <!-- Header functionality has been moved to blocks/nav/ -->
    <!-- This block is maintained for backward compatibility -->
  `;

  block.append(placeholder);

  // Log a deprecation notice for developers
  console.warn(
    'Header block is deprecated. Please use the nav block instead. '
    + 'See blocks/nav/ for the current implementation.',
  );

  // If the nav block is not present on the page, provide a fallback message
  const hasNavBlock = document.querySelector('.nav') || document.querySelector('nav-root') || document.querySelector('desktop-nav-root');

  if (!hasNavBlock) {
    console.error(
      'No navigation block found on the page. '
      + 'Please add a nav block to your content to enable navigation.',
    );

    // Optionally, add a visible message for content authors
    const warningMessage = document.createElement('div');
    warningMessage.style.cssText = 'padding: 20px; background: #ffe6e6; color: #cc0000; text-align: center;';
    warningMessage.textContent = 'Navigation not configured. Please add a nav block to this page.';
    block.append(warningMessage);
  }
}

// Export searchbar path for other components that might need it
export const SEARCHBAR_PATH = './searchbar.js';
