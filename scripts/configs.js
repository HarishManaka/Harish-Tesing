/* eslint-disable import/no-cycle */
import { deepmerge } from '@dropins/tools/lib.js';
import { createElement } from '@dropins/tools/preact.js';
import { rootLink } from './scripts.js';
import { LOGIN_PATH } from './constants.js';

// Private state
let config = null;
let rootPath = null;
let rootConfig = null;

/**
 * Builds the URL for the appropriate environment-specific config file
 * based on the current window location.
 *
 * - If the URL contains 'dev--nasm', returns 'config-dev.json'
 * - If the URL contains 'stage--nasm', returns 'config-stage.json'
 * - Otherwise, returns 'config.json'
 *
 * @returns {URL} - The URL for the config file.
 */
function buildConfigURL() {
  let configFile = 'config.json';
  if (window.location.href.includes('stage--nasm') || window.location.href.includes('stg-www.')) {
    configFile = 'config-stage.json';
  }
  if (window.location.href.includes('qa--nasm') || window.location.href.includes('qa-www.')) {
    configFile = 'config-qa.json';
  }
  if (window.location.href.includes('dev--nasm') || window.location.href.includes('dev-www.')) {
    configFile = 'config-dev.json';
  }

  return new URL(`${window.hlx.codeBasePath}/${configFile}`, window.location);
}

/**
 * Retrieves a value from a config object using dot notation.
 *
 * @param {Object} obj - The config object.
 * @param {string} key - The key to retrieve (supports dot notation).
 * @returns {any} - The value of the key.
 */
function getValue(obj, key) {
  return key.split('.').reduce((current, part) => {
    if (!Object.prototype.hasOwnProperty.call(current, part)) {
      console.warn(`Property ${key} does not exist in the object`);
      return undefined;
    }
    return current[part];
  }, obj);
}

/**
 * Get cookie
 * @param {string} cookieName - The name of the cookie to get
 * @returns {string} - The value of the cookie
 */
function getCookie(cookieName) {
  const cookies = document.cookie.split(';');
  let foundValue;

  cookies.forEach((cookie) => {
    const [name, value] = cookie.trim().split('=');
    if (name === cookieName) {
      foundValue = decodeURIComponent(value);
    }
  });

  return foundValue;
}

function setCookie(name, value, maxAge) {
  document.cookie = `${name}=${value}; path=/; Max-Age=${maxAge};`;
}

function deleteCookie(name) {
  document.cookie = `${name}=; path=/; domain=.nasm.org; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

/**
 * Get root path
 * @param {Object} [configObj=config] - The config object.
 * @returns {string} - The root path.
 */
function getRootPath(configObj = config) {
  if (!configObj) {
    console.warn('No config found. Please call initializeConfig() first.');
    return '/';
  }

  const value = Object.keys(configObj?.public)
    // Sort by number of non-empty segments to find the deepest path
    .sort((a, b) => {
      const aSegments = a.split('/').filter(Boolean).length;
      const bSegments = b.split('/').filter(Boolean).length;
      return bSegments - aSegments;
    })
    .find((key) => window.location.pathname === key || window.location.pathname.startsWith(key));

  rootPath = value ?? '/';

  if (!rootPath.startsWith('/') || !rootPath.endsWith('/')) {
    throw new Error('Invalid root path');
  }

  return rootPath;
}

/**
 * Get list of root paths from public config
 * @returns {Array} - The list of root paths.
 */
function getListOfRootPaths() {
  if (!config) {
    console.warn('No config found. Please call initializeConfig() first.');
    return [];
  }

  return Object.keys(config?.public).filter((root) => root !== 'default');
}

/**
 * Checks if the public config contains more than "default"
 * @returns {boolean} - true if public config contains more than "default"
 */
function isMultistore() {
  return getListOfRootPaths().length >= 1;
}

/**
 * Retrieves headers from config entries like commerce.headers.pdp.my-header, etc and
 * returns as object of all headers like { my-header: value, ... }
 * @param {string} scope - The scope of the headers to retrieve.
 * @returns {Object} - The headers.
 */
function getHeaders(scope) {
  if (!rootConfig) {
    throw new Error('Configuration not initialized. Call initializeConfig() first.');
  }
  const headers = rootConfig.headers ?? {};
  return {
    ...headers.all ?? {},
    ...headers[scope] ?? {},
  };
}

/**
 * Checks if the user is authenticated
 * @returns {boolean} - true if the user is authenticated
 */
function checkIsAuthenticated() {
  return !!getCookie('auth_dropin_user_token') ?? false;
}

function IsXSRFTokenPresent() {
  return !!getCookie('XSRF-TOKEN') ?? false;
}

/**
 * Applies config overrides from metadata.
 *
 * @param {Object} [configObj=config] - The base config.
 * @param {string} [root=rootPath] - The root path.
 * @returns {Object} - The config with overrides applied.
 */
async function applyConfigOverrides(configObj = config, root = rootPath) {
  if (!configObj) {
    throw new Error('Configuration not initialized. Call initializeConfig() first.');
  }

  const defaultConfig = configObj.public?.default;

  if (!defaultConfig) {
    throw new Error('No "default" config found.');
  }

  const current = deepmerge(
    defaultConfig,
    root === '/' ? defaultConfig : configObj.public[root] || defaultConfig,
  );

  return current;
}

/**
 * Fetches config from remote and saves in session, then returns it, otherwise
 * returns if it already exists.
 *
 * @returns {Promise<Object>} - The config JSON from session storage
 */
async function getConfigFromSession() {
  try {
    const configJSON = window.sessionStorage.getItem('config');
    if (!configJSON) {
      throw new Error('No config in session storage');
    }

    const parsedConfig = JSON.parse(configJSON);
    if (!parsedConfig[':expiry'] || parsedConfig[':expiry'] < Math.round(Date.now() / 1000)) {
      throw new Error('Config expired');
    }
    return parsedConfig;
  } catch (e) {
    let configJSON = await fetch(buildConfigURL());
    if (!configJSON.ok) {
      throw new Error('Failed to fetch config');
    }
    configJSON = await configJSON.json();
    configJSON[':expiry'] = Math.round(Date.now() / 1000) + 7200;
    window.sessionStorage.setItem('config', JSON.stringify(configJSON));
    return configJSON;
  }
}

/**
 * Initializes the configuration system.
 * @returns {Promise<void>}
 */
async function initializeConfig() {
  config = await getConfigFromSession();
  rootPath = getRootPath(config);
  rootConfig = await applyConfigOverrides(config, rootPath);
}

/**
 * Retrieves a configuration value.
 *
 * @param {string} configParam - The configuration parameter to retrieve.
 * @returns {string|undefined} - The value of the configuration parameter, or undefined.
 */
function getConfigValue(configParam) {
  if (!rootConfig) {
    throw new Error('Configuration not initialized. Call initializeConfig() first.');
  }
  return getValue(rootConfig, configParam);
}

function getEnvironment() {
  const { hostname } = window.location;
  if (hostname.includes('dev-www.') || hostname.includes('main--') || hostname.startsWith('localhost')) {
    return 'dev';
  }
  if (hostname.includes('qa-www.') || hostname.includes('qa--')) {
    return 'qa';
  }
  if (hostname.includes('stg-www.') || hostname.includes('stage--')) {
    return 'stage';
  }
  return 'prod';
}

function redirectToLoginPage(redirectPath) {
  window.location.href = rootLink(`${LOGIN_PATH}?redirect_url=${redirectPath}`);
}

function formatNumber(price) {
  if (price % 1 === 0) {
    return price?.toLocaleString('en-US');
  }
  return price?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function createEl(type, options = {}, content = null) {
  const props = { ...options };

  if (typeof content === 'string' || typeof content === 'number') {
    return createElement(type, props, content);
  }

  return createElement(type, props, Array.isArray(content) ? content : [content]);
}

function getUserIdFromXsrfToken() {
  try {
    const xsrfToken = getCookie('XSRF-TOKEN');
    const splitToken = xsrfToken.split('.');
    if (splitToken.length < 2) return '';
    const tokenData = splitToken[1];
    const decoded = JSON.parse(atob(tokenData));
    return decoded.user_id || '';
  } catch (e) {
    return '';
  }
}

function trackGTMEvent(dataLayer) {
  if (window.gtmDataLayer) {
    window.gtmDataLayer.push(dataLayer);
    // eslint-disable-next-line no-console
    console.log('dataLayer-->', dataLayer);
  }
}

export {
  initializeConfig,
  getCookie,
  getEnvironment,
  setCookie,
  deleteCookie,
  getRootPath,
  getListOfRootPaths,
  isMultistore,
  getConfigValue,
  getHeaders,
  checkIsAuthenticated,
  redirectToLoginPage,
  formatNumber,
  createEl,
  trackGTMEvent,
  getUserIdFromXsrfToken,
  IsXSRFTokenPresent,
};
