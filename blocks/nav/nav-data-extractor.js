/**
 * Navigation Data Extractor
 * Extracts navigation data from HTML and processes it for use by components
 */

import navigationStore from './nav-store.js';

/**
 * Extracts main navigation structure from HTML .nav container
 * Creates navigation data with logoElement and firstLevelElements
 */
export function buildNavData(block) {
  const getFirstTextBeforeBr = (listItem) => {
    const initial = { done: false, text: '' };
    const result = Array.from(listItem.childNodes).reduce((acc, node) => {
      if (acc.done) return acc;
      if (node.nodeName === 'BR') return { done: true, text: acc.text };
      if (node.nodeType === Node.TEXT_NODE) {
        return { done: false, text: acc.text + (node.textContent || '') };
      }
      return acc;
    }, initial);
    return result.text.trim();
  };

  const mainList = block.querySelector('ul');
  if (!mainList) {
    return {
      logoElement: block.querySelector('picture'),
      firstLevelElements: [],
    };
  }

  const selectTopLis = (ul) => Array.from(ul.querySelectorAll(':scope > li'));
  const hasNestedUl = (li) => Boolean(li.querySelector(':scope > ul'));
  const getTopAnchor = (el) => el.querySelector(':scope > a') || null;
  const getFirstAnchor = (el) => el.querySelector(':scope  a') || null;

  const computeLabel = (li) => {
    const paragraph = li.querySelector(':scope > p');
    const anchor = getTopAnchor(li);
    if (paragraph && paragraph.textContent) return paragraph.textContent.trim();
    if (li.querySelector('br')) return getFirstTextBeforeBr(li);
    if (anchor) return anchor.textContent.trim();
    return (li.textContent || '').trim();
  };

  const extractThirdLevel = (li) => {
    const innerNestedUl = li.querySelector(':scope > ul');
    if (!innerNestedUl) return undefined;
    const thirdLis = Array.from(innerNestedUl.querySelectorAll(':scope > li'));
    return thirdLis.map((tli) => (tli.textContent || '').trim());
  };

  const toInnerItem = (innerLi) => {
    const a = getTopAnchor(innerLi);

    // Handle both anchor elements and text-only content
    if (!a) {
      // Check if there's text content directly in the li
      const textContent = innerLi.childNodes[0]?.nodeType === Node.TEXT_NODE
        ? innerLi.childNodes[0].textContent.trim()
        : innerLi.textContent.trim();

      if (!textContent) return null;

      // Create item from text content
      const item = {
        element: innerLi,
        title: textContent,
        href: '', // No href for text-only items
      };
      const third = extractThirdLevel(innerLi);
      if (third && third.length > 0) item.thirdLevel = third;
      return item;
    }

    // Handle anchor elements as before
    const item = {
      element: a,
      title: a.getAttribute('title') || a.textContent.trim(),
      href: a.getAttribute('href') || '',
    };
    const third = extractThirdLevel(innerLi);
    if (third && third.length > 0) item.thirdLevel = third;
    return item;
  };

  const toNestedEntry = (li) => {
    const nestedUl = li.querySelector(':scope > ul');
    const innerLis = nestedUl
      ? Array.from(nestedUl.querySelectorAll(':scope > li'))
      : [];
    const items = innerLis.map(toInnerItem).filter(Boolean);
    return { element: li, label: computeLabel(li), items };
  };

  const toAnchorEntry = (li) => {
    const a = getFirstAnchor(li);
    const label = computeLabel(li);
    const href = a ? a.getAttribute('href') || '' : '';
    const element = a || li;
    return { element, label, href };
  };

  const firstLevelElements = selectTopLis(mainList)
    .map((li) => (hasNestedUl(li) ? toNestedEntry(li) : toAnchorEntry(li)))
    .filter(Boolean);

  return { logoElement: block.querySelector('picture'), firstLevelElements };
}

/**
 * Processes and stores main navigation data
 */
export function extractMainNavigation(block) {
  const navData = buildNavData(block);
  navigationStore.setNavData(navData);
}

/**
 * Extracts third level data from .nav-level-3 containers
 */
export function buildLevel3Data(block) {
  const container = block.closest('.nav-level-3') || block;
  const children = Array.from(container.children);

  const id = (children[0]?.querySelector('div')?.textContent || '').trim();

  const toHeader = (divs) => ({ element: divs[0], isSquare: false });

  const toTitleDescription = (section, divs) => {
    const [t, d, u] = divs;

    return {
      element: section,
      title: (t.textContent || '').trim(),
      description: (d.textContent || '').trim(),
      url: (u?.textContent || '').trim(),
      isTD: true,
    };
  };

  const toSquare = (section, divs) => {
    const [t, d, f, u] = divs;
    return {
      element: section,
      title: (t.textContent || '').trim(),
      url: (u?.textContent || '').trim(),
      description: d,
      footer: (f.textContent || '').trim(),
      isSquare: true,
    };
  };

  const items = children
    .slice(1)
    .map((section) => {
      const divs = Array.from(section.querySelectorAll(':scope > div'));
      if (divs.length === 1) return toHeader(divs);
      if (divs.length === 3) return toTitleDescription(section, divs);
      if (divs.length === 4) return toSquare(section, divs);
      return null;
    })
    .filter((entry) => Boolean(entry));

  return { id, items };
}

/**
 * Processes and stores level 3 data
 */
export function extractLevel3Data(block) {
  const data = buildLevel3Data(block);

  try {
    // Add to store
    navigationStore.addLevel3Data(data);

    // Link navigation data with level 3 data
    navigationStore.linkNavigationData();
  } catch (error) {
    console.warn('Error extracting level 3 data:', error);
  }
}

/**
 * Adapts navigation data for mobile navigation format
 */
export function getMobileNavigationData() {
  const navData = navigationStore.getNavData();

  if (!navData?.firstLevelElements) {
    console.warn('Navigation data not available yet');
    return [];
  }

  const mainNavItems = navData.firstLevelElements.map((item) => ({
    id: item.label?.toLowerCase().replace(/\s+/g, '-') || 'unknown',
    title: item.label || 'Untitled',
    url: item.href || `/${item.label?.toLowerCase().replace(/\s+/g, '-') || 'unknown'}`,
    hasChildren: Array.isArray(item.items) && item.items.length > 0,
    children: item.items ? item.items.map((subItem) => ({
      id: subItem.title?.toLowerCase().replace(/\s+/g, '-') || 'unknown',
      title: subItem.title || 'Untitled',
      url: subItem.href || `/${subItem.title?.toLowerCase().replace(/\s+/g, '-') || 'unknown'}`,
      hasThirdLevel: subItem.thirdLevelData && subItem.thirdLevelData.items?.length > 0,
      thirdLevelData: subItem.thirdLevelData,
    })) : [],
  }));

  console.info('Mobile navigation data extracted', { itemCount: mainNavItems.length, mainNavItems });

  return mainNavItems;
}

/**
 * Adapts navigation data for desktop navigation format
 */
export function getDesktopNavigationData() {
  const navData = navigationStore.getNavData();

  if (!navData || !navData.firstLevelElements) {
    return [];
  }

  const mainItems = navData.firstLevelElements.map((item) => ({
    id: item.label.toLowerCase().replace(/\s+/g, '-'),
    title: item.label,
    url: item.href,
    highlight: false,
    hasChildren: Array.isArray(item.items) && item.items.length > 0,
  }));

  return mainItems;
}

/**
 * Extracts categories from navigation data for dropdown
 */
export function extractCategoriesFromNavData(rootId) {
  const navData = navigationStore.getNavData();

  if (!navData || !navData.firstLevelElements) {
    return [];
  }

  // Find the root item
  const rootItem = navData.firstLevelElements.find(
    (item) => item.label.toLowerCase().replace(/\s+/g, '-') === rootId
      || item.label.toLowerCase() === rootId,
  );

  if (!rootItem || !rootItem.items) {
    return [];
  }

  // Extract categories with href for anchor elements or empty href for text-only
  const categories = rootItem.items.map((item) => ({
    id: item.title.toLowerCase().replace(/\s+/g, '-'),
    title: item.title,
    href: item.href !== undefined ? item.href : `/${item.title.toLowerCase().replace(/\s+/g, '-')}`,
  }));

  return categories;
}

/**
 * Gets third level content data for a specific category
 */
export function getThirdLevelContentData(rootId, categoryId) {
  const navData = navigationStore.getNavData();

  if (!navData || !navData.firstLevelElements) {
    return [];
  }

  // Find the current category in the navigation data
  const rootItem = navData.firstLevelElements.find(
    (item) => item.label.toLowerCase().replace(/\s+/g, '-') === rootId
      || item.label.toLowerCase() === rootId,
  );

  if (!rootItem || !rootItem.items) {
    return [];
  }

  const categoryItem = rootItem.items.find(
    (item) => item.title.toLowerCase().replace(/\s+/g, '-') === categoryId
      || item.title.toLowerCase() === categoryId,
  );

  if (
    !categoryItem
    || !categoryItem.thirdLevelData
    || !categoryItem.thirdLevelData.items
  ) {
    return [];
  }

  // Get ALL elements from thirdLevelData.items (both square and non-square)
  return categoryItem.thirdLevelData.items;
}
