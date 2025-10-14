/* eslint-disable import/no-cycle */
import gtmMartech from './gtm-martech.js';
import { getConfigValue, getEnvironment } from './configs.js';
import { getUserTokenCookie } from './initializers/index.js';
import { getConsent } from './scripts.js';
import { loadScript } from './aem.js';

// Logging utility for third-party scripts
const log = {
  start: (name) => console.info(`🔄 [${name}] Starting initialization...`),
  success: (name, duration) => console.info(`✅ [${name}] Loaded successfully in ${duration}ms`),
  skip: (name, reason) => console.warn(`⏭️  [${name}] Skipped: ${reason}`),
  error: (name, error) => console.error(`❌ [${name}] Error:`, error),
};

async function initEnsighten() {
  const startTime = performance.now();
  const name = 'Ensighten';

  try {
    if (document.getElementById('ensighten')) {
      log.skip(name, 'Already loaded');
      return;
    }

    log.start(name);
    const environment = getEnvironment();
    const script = environment === 'prod'
      ? '//nexus.ensighten.com/nasm/nasm_prd/Bootstrap.js'
      : '//nexus.ensighten.com/nasm/nasm_stg/Bootstrap.js';

    console.info(`📍 [${name}] Environment: ${environment}, Script: ${script}`);

    await loadScript(script, {
      id: 'ensighten',
      async: true,
    });

    const duration = Math.round(performance.now() - startTime);
    log.success(name, duration);
  } catch (error) {
    log.error(name, error);
    throw error; // Re-throw to handle in sequence
  }
}

async function initAnalytics() {
  try {
    // Load Commerce events SDK and collector
    // only if "analytics" has been added to the config.
    const config = getConfigValue('analytics');

    if (config && getConsent('commerce-collection')) {
      const csHeaders = getConfigValue('headers.cs');

      window.adobeDataLayer.push(
        {
          storefrontInstanceContext: {
            baseCurrencyCode: config['base-currency-code'],
            environment: config.environment,
            environmentId: csHeaders['Magento-Environment-Id'],
            storeCode: csHeaders['Magento-Store-Code'],
            storefrontTemplate: 'EDS',
            storeId: parseInt(config['store-id'], 10),
            storeName: config['store-name'],
            storeUrl: config['store-url'],
            storeViewCode: csHeaders['Magento-Store-View-Code'],
            storeViewCurrencyCode: config['base-currency-code'],
            storeViewId: parseInt(config['store-view-id'], 10),
            storeViewName: config['store-view-name'],
            websiteCode: csHeaders['Magento-Website-Code'],
            websiteId: parseInt(config['website-id'], 10),
            websiteName: config['website-name'],
          },
        },
        { eventForwardingContext: { commerce: true, aep: false } },
        {
          shopperContext: {
            shopperId: getUserTokenCookie() ? 'logged-in' : 'guest',
          },
        },
      );

      // Load events SDK and collector
      import('./commerce-events-sdk.js');
      import('./commerce-events-collector.js');
    }
  } catch (error) {
    console.warn('Error initializing analytics', error);
  }
}

if (document.prerendering) {
  document.addEventListener('prerenderingchange', initAnalytics, {
    once: true,
  });
} else {
  initAnalytics();
}

// Initialize Optimizely
async function initOptimizely() {
  const startTime = performance.now();
  const name = 'Optimizely';

  try {
    // Check if Optimizely script is already loaded
    if (document.getElementById('optimizely-sdk') || window.optimizely) {
      log.skip(name, 'Already loaded');
      return;
    }

    log.start(name);
    const environment = getEnvironment();
    const optimizelyProjectId = '25023950326'; // Can be made configurable via config.json if needed

    console.info(`📍 [${name}] Environment: ${environment}, Project ID: ${optimizelyProjectId}`);

    // Load Optimizely SDK
    await loadScript(`https://cdn.optimizely.com/js/${optimizelyProjectId}.js`, {
      id: 'optimizely-sdk',
      async: true,
    });

    const duration = Math.round(performance.now() - startTime);
    log.success(name, duration);
  } catch (error) {
    log.error(name, error);
    throw error; // Re-throw to handle in sequence
  }
}

// Import NASM libraries
// import './nasmlibraries/atlas/atlas.js';
// import './nasmlibraries/hermes.js';
// import './nasmlibraries/nasm-community-resource-center.js';
// import './nasmlibraries/nasm-product-details.js';
// import './nasmlibraries/nasm-timers.js';
// import './nasmlibraries/slick-min.js';
// import './nasmlibraries/nasm-continuity-component.js';
// import './nasmlibraries/nasm-hybrid-nav.js';
// import './nasmlibraries/swiper-bundle.min.js';
// import './nasmlibraries/nasm-navigation-animations.js';

// Initialize chatbot
async function initChatbot() {
  try {
    // Check if chatbot script is already loaded
    if (document.getElementById('a5widget')) {
      return;
    }

    await loadScript('//alive5.com/js/a5app.js', {
      id: 'a5widget',
      async: true,
      'data-widget_code_id': '83252e7f-24ae-4aac-b9d0-83fdbcecd8b6',
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('Error loading chatbot:', error);
  }
}

// Initialize chatbot after page load
if (document.prerendering) {
  document.addEventListener('prerenderingchange', initChatbot, { once: true });
} else {
  initChatbot();
}

/**
 * Initialize Impact Radius tracking for partnership and affiliate marketing
 * Sets up the global 'ire' function queue and loads the tracking script asynchronously
 */
async function initImpactTracking() {
  try {
    // Check if Impact tracking is already loaded
    if (window.ire_o || document.querySelector('script[src*="impactcdn.com"]')) {
      return;
    }

    // Set up the global function name reference
    window.ire_o = 'ire';

    // Create placeholder function with command queue
    // This catches calls to ire() before the full script loads
    window.ire = window.ire || function irePlaceholder(...args) {
      (window.ire.a = window.ire.a || []).push(args);
    };

    // Load the Impact tracking script asynchronously
    const impactScriptUrl = 'https://utt.impactcdn.com/A4892188-4ad9-436c-a3b3-30b7488907d91.js';
    await loadScript(impactScriptUrl, {
      async: true,
    });
    window.ire('identify', {
      customerId: '',
      customerEmail: '',
    });
  } catch (error) {
    console.warn('Error loading Impact tracking:', error);
  }
}

// Initialize Impact tracking after page load
if (document.prerendering) {
  document.addEventListener('prerenderingchange', initImpactTracking, { once: true });
} else {
  initImpactTracking();
}

// ===== SEQUENTIAL LOADING FOR STRICT ORDER =====
/**
 * Load critical marketing scripts in STRICT order
 * GUARANTEED ORDER: Ensighten → Optimizely → GTM
 * Each script waits for the previous one to complete before loading
 */
async function loadScriptsInOrder() {
  const sequenceStart = performance.now();
  console.info('🚀 ======================================');
  console.info('🚀 Starting STRICT SEQUENTIAL script load');
  console.info('🚀 Order: Ensighten → Optimizely → GTM');
  console.info('🚀 ======================================');

  try {
    // STEP 1: Ensighten (Tag Management Foundation)
    console.info('📋 Step 1/3: Loading Ensighten...');
    await initEnsighten();
    console.info('🎯 Step 1/3: Ensighten complete, proceeding to Optimizely');

    // STEP 2: Optimizely (Experimentation Platform)
    console.info('📋 Step 2/3: Loading Optimizely...');
    await initOptimizely();
    console.info('🎯 Step 2/3: Optimizely complete, proceeding to GTM');

    // STEP 3: GTM (Analytics & Marketing Tags)
    console.info('📋 Step 3/3: Loading GTM...');
    const gtmStart = performance.now();
    await gtmMartech.lazy();
    const gtmDuration = Math.round(performance.now() - gtmStart);
    console.info(`✅ [GTM] Loaded successfully in ${gtmDuration}ms`);
    console.info('🎯 Step 3/3: GTM complete');

    // Sequence complete
    const totalDuration = Math.round(performance.now() - sequenceStart);
    console.info('🎉 ======================================');
    console.info('🎉 ALL SCRIPTS LOADED SUCCESSFULLY!');
    console.info(`🎉 Total sequence time: ${totalDuration}ms`);
    console.info('🎉 ======================================');
  } catch (error) {
    const failedDuration = Math.round(performance.now() - sequenceStart);
    console.error('💥 ======================================');
    console.error('💥 SCRIPT LOADING SEQUENCE FAILED');
    console.error(`💥 Failed after ${failedDuration}ms`);
    console.error('💥 Error:', error);
    console.error('💥 ======================================');
  }
}

// Initialize ordered scripts (with prerendering support)
console.info('🔍 Checking prerendering state...');
if (document.prerendering) {
  console.info('⏸️  Page is prerendering, waiting for activation...');
  document.addEventListener('prerenderingchange', () => {
    console.info('▶️  Page activated from prerendering, starting script sequence');
    loadScriptsInOrder();
  }, { once: true });
} else {
  console.info('▶️  Page is active, starting script sequence immediately');
  loadScriptsInOrder();
}

// add delayed functionality here
