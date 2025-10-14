import { events } from '@dropins/tools/event-bus.js';
import { ProgressSpinner, provider as UI } from '@dropins/tools/components.js';
import { loadCSS, loadScript } from '../scripts/aem.js';
import {
  trackGTMEvent,
  getConfigValue,
  getCookie,
  setCookie,
  deleteCookie,
  getUserIdFromXsrfToken,
  getEnvironment,
} from '../scripts/configs.js';
import { startAuthDropinTokenTimer } from '../utils/cart-checkout.js';
import { fetchPlaceholders } from '../scripts/commerce.js';

export const mfeConfig = {
  script: {
    dev: 'https://dev-auth.nasm.org/ua-ng-login.js',
    prod: 'https://auth.nasm.org/ua-ng-login.js',
    qa: 'https://qa2-auth.nasm.org/ua-ng-login.js',
    stage: 'https://stg2-auth.nasm.org/ua-ng-login.js',
  },
  intlStyle: {
    dev: 'https://dev-auth.nasm.org/login-widget-global.css',
    prod: 'https://auth.nasm.org/login-widget-global.css',
    qa: 'https://qa2-auth.nasm.org/login-widget-global.css',
    stage: 'https://stg2-auth.nasm.org/login-widget-global.css',
  },
  buName: 'NASM',
  buDomain: '.nasm.org',
  casUrl: {
    dev: 'https://dev-auth.nasm.org',
    qa: 'https://qa2-auth.nasm.org',
    stage: 'https://stg2-auth.nasm.org',
    prod: 'https://auth.nasm.org',
  },
  apiUrl: {
    dev: 'https://dev-auth.nasm.org',
    qa: 'https://qa2-auth.nasm.org',
    stage: 'https://stg2-auth.nasm.org',
    prod: 'https://auth.nasm.org',
  },
  serviceUrl: {
    dev: 'https://dev-www.nasm.org/cart',
    qa: 'https://qa-www.nasm.org/cart',
    stage: 'https://stg-www.nasm.org/cart',
    prod: 'https://shop.nasm.org/cart',
  },
  apiVersion: 'v3',
  tosEnabled: 'true',
  resetEnabled: 'true',
  registerEnabled: 'true',
  widgetRoot: 'login',
  dashboardEnabled: 'true',
  landscapeMode: 'false',
  posEnabled: 'true',
  tosPosRegister: 'true',
  tosPosLogin: 'true',
  addressEnabled: 'true',
  authenticationKey: 'username',
  autocompleteAddressEnabled: 'true',
  addressEnabledOnRegistration: 'true',
};

export const handleAuthError = async (loaderContainer, errorMessage) => {
  const labels = await fetchPlaceholders();
  const errorContainer = document.querySelector('.mfe-container');
  if (errorContainer) {
    errorContainer.innerHTML = `
      <div class="error-message">
        <p>${errorMessage || labels?.mfe?.login?.errorMessage || 'Authentication failed. Please try again later.'}</p>
      </div>
    `;
  }

  deleteCookie('XSRF-TOKEN');
};

export const loadLoginAssets = async (environment) => {
  const env = environment || getEnvironment();
  await loadCSS(mfeConfig.intlStyle[env]);
  await loadScript(mfeConfig.script[env]);
};

export const renderLoginWidget = (customConfig = {}) => {
  const env = getEnvironment();
  const config = { ...mfeConfig, ...customConfig };

  return `
    <ua-ng-login
      bu-name="${config.buName}"
      bu-domain="${config.buDomain}"
      cas-url="${config.casUrl[env]}"
      api-url="${config.apiUrl[env]}"
      service-url="${config.serviceUrl[env]}"
      api-version="${config.apiVersion}"
      tos-enabled="${config.tosEnabled}"
      reset-enabled="${config.resetEnabled}"
      register-enabled="${config.registerEnabled}"
      widget-root="${config.widgetRoot}"
      dashboard-enabled="${config.dashboardEnabled}"
      landscape-mode="${config.landscapeMode}"
      pos-enabled="${config.posEnabled}"
      tos-pos-register="${config.tosPosRegister}"
      tos-pos-login="${config.tosPosLogin}"
      address-enabled="${config.addressEnabled}"
      authentication-key="${config.authenticationKey}"
      autocomplete-address-enabled="${config.autocompleteAddressEnabled}"
      address-enabled-on-registration="${config.addressEnabledOnRegistration}"
    ></ua-ng-login>
  `;
};

// Singleton promise to prevent duplicate calls
let pendingTokenRequest = null;

/**
 * Sends the XSRF token to the server and handles authentication
 * This function is focused only on the GraphQL call and setting cookies
 * UI concerns (loaders, redirects) should be handled by the caller
 * @returns {Promise} - Returns user data or throws an error
 */
export const sendTokenToServer = async () => {
  // If there's already a pending request, return it
  if (pendingTokenRequest) {
    console.info('Token request already in progress, waiting for existing request...');
    return pendingTokenRequest;
  }

  // Create the promise and store it
  pendingTokenRequest = (async () => {
    try {
      const xsrfToken = await getCookie('XSRF-TOKEN');

      if (!xsrfToken) {
        throw new Error('XSRF-TOKEN not found');
      }

      const endpoint = getConfigValue('commerce-endpoint');

      const query = `
        mutation Sso($token: String!) {
          sso(
            input: {
              jwt_token: $token,
            }
          ) {
            customerToken
            isSuspended
            firstName
          }
        }
      `;

      const data = {
        token: xsrfToken,
      };

      // Make the GraphQL call without UI concerns
      const result = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables: data,
        }),
      });

      const jsonResponse = await result.json();

      if (jsonResponse.errors) {
        console.error('GraphQL Errors:', jsonResponse.errors);
        throw new Error('GraphQL request failed');
      }

      const { customerToken, isSuspended, firstName } = jsonResponse.data.sso;

      if (!customerToken || isSuspended === null || !firstName) {
        throw new Error('Invalid SSO response');
      }

      // Set cookies
      const maxAge = JSON.parse(sessionStorage.getItem('storeConfig'))?.customerAccessTokenLifetime || 3600;
      setCookie('auth_dropin_user_token', customerToken, maxAge);
      setCookie('auth_dropin_firstname', firstName, maxAge);

      // Handle suspended user state
      if (isSuspended) {
        sessionStorage.setItem('isSuspendedUser', true);
      }
      //
      const uid = getUserIdFromXsrfToken();
      trackGTMEvent(
        {
          event: 'user_state_updated',
          uid,
          login_status: 'logged_in',
        },
      );

      await startAuthDropinTokenTimer();
      // Emit authentication event
      events.emit('authenticated', true);

      // Return the user data
      return { customerToken, isSuspended, firstName };
    } catch (error) {
      console.error('Request Failed:', error);
      // Clean up the XSRF token on error
      deleteCookie('XSRF-TOKEN');
      throw error;
    } finally {
      // Clear the pending request after completion
      pendingTokenRequest = null;
    }
  })();

  return pendingTokenRequest;
};

/**
 * Helper function to show a loading spinner
 * @param {HTMLElement} container - Container element to show the spinner in
 * @param {string} className - CSS class for the spinner
 */
export const showLoader = async (container, className = 'login__overlay-spinner') => {
  if (!container) return;

  container.innerHTML = '';

  const spinner = document.createElement('div');
  spinner.className = className;
  spinner.innerHTML = '<div class="spinner"></div>';
  container.appendChild(spinner);
  await UI.render(ProgressSpinner, {
    className: '.checkout__overlay-spinner',
    stroke: '3',
  })(spinner.firstElementChild);
};

/**
 * Helper function to hide a loading spinner
 * @param {HTMLElement} container - Container element containing the spinner
 * @param {string} className - CSS class of the spinner to remove
 */
export const hideLoader = (container, className = 'login__overlay-spinner') => {
  if (!container) return;

  const spinner = container.querySelector(`.${className}`);
  if (spinner) {
    spinner.remove();
  }
};

export const addPlaceholdertoInputFields = () => {
  const inputFields = document.querySelectorAll('.form-control');
  inputFields.forEach((input) => {
    if (input.placeholder) {
      input.setAttribute('placeholder', input.placeholder);
    } else {
      const label = document.querySelector(`label[for=${input.id}]`);
      const labelText = label ? label.textContent.trim() : input.previousElementSibling?.textContent.trim() || '';
      input.setAttribute('placeholder', labelText);
    }
  });
};

export const attachMFEEventListeners = (options = {}) => {
  const {
    block = document,
    onLogin = null,
    onRegister = null,
    onLogout = null,
    onReset = null,
    selector = 'ua-ng-login',
  } = options;

  // TODO: revisit and check if default method is really needed.
  const defaultHandler = () => console.info('Default event');

  const uaLogin = block.querySelector(selector);
  if (!uaLogin) {
    console.warn(`MFE widget not found: ${selector}`);
    return () => {};
  }

  const loginHandler = onLogin || defaultHandler;
  const registerHandler = onRegister || defaultHandler;
  const logoutHandler = onLogout || (() => console.info('Logout event'));
  const resetHandler = onReset || (() => console.info('Reset event'));

  uaLogin.addEventListener('loginEvent', loginHandler);
  uaLogin.addEventListener('registerEvent', registerHandler);
  uaLogin.addEventListener('logoutEvent', logoutHandler);
  uaLogin.addEventListener('resetEvent', resetHandler);

  const clickHandler = (e) => {
    const isCheckBillingasShipping = e.target.tagName === 'INPUT' && e.target.id === 'ua-billing-same-shipping';

    if (isCheckBillingasShipping) {
      setTimeout(() => {
        addPlaceholdertoInputFields();
      }, 10);
    }

    if (e.target.tagName === 'BUTTON' || e.target.tagName === 'A') {
      addPlaceholdertoInputFields();
    }
  };

  document.addEventListener('click', clickHandler);

  return () => {
    uaLogin.removeEventListener('loginEvent', loginHandler);
    uaLogin.removeEventListener('registerEvent', registerHandler);
    uaLogin.removeEventListener('logoutEvent', logoutHandler);
    uaLogin.removeEventListener('resetEvent', resetHandler);
    document.removeEventListener('click', clickHandler);
  };
};

export const initializeMFEAuth = async (options) => {
  const {
    container,
    config = {},
    onLogin = null,
    onRegister = null,
    skipAssets = false,
  } = options;

  if (!container) {
    throw new Error('Container element is required');
  }

  if (!skipAssets) {
    await loadLoginAssets();
  }

  const widgetHTML = renderLoginWidget(config);
  container.innerHTML = widgetHTML;

  addPlaceholdertoInputFields();

  const cleanup = attachMFEEventListeners({
    onLogin,
    onRegister,
  });

  return cleanup;
};

export default {
  mfeConfig,
  loadLoginAssets,
  renderLoginWidget,
  sendTokenToServer,
  handleAuthError,
  showLoader,
  hideLoader,
  addPlaceholdertoInputFields,
  attachMFEEventListeners,
  initializeMFEAuth,
};
