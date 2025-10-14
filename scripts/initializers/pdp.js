/* eslint-disable import/no-cycle */
/* eslint-disable import/prefer-default-export */

import { initializers } from '@dropins/tools/initializer.js';
import { Image, provider as UI } from '@dropins/tools/components.js';
import {
  initialize,
  setEndpoint,
  setFetchGraphQlHeaders,
  fetchProductData,
} from '@dropins/storefront-pdp/api.js';
import { initializeDropin } from './index.js';
import {
  fetchPlaceholders,
  commerceEndpointWithQueryParams,
  getOptionsUIDsFromUrl,
  getSkuFromUrl,
  loadErrorPage,
} from '../commerce.js';
import { getHeaders } from '../configs.js';

export const IMAGES_SIZES = {
  width: 960,
  height: 1191,
};

await initializeDropin(async () => {
  // Set Fetch Endpoint (Service)
  setEndpoint(await commerceEndpointWithQueryParams());

  // Set Fetch Headers (Service)
  setFetchGraphQlHeaders((prev) => ({
    ...prev,
    ...getHeaders('cs'),
    nasmprice: 'all',
  }));

  const sku = getSkuFromUrl();
  const optionsUIDs = getOptionsUIDsFromUrl();

  const [product, labels] = await Promise.all([
    fetchProductData(sku, { optionsUIDs, skipTransform: true }).then(preloadImageMiddleware),
    fetchPlaceholders(),
  ]);

  if (!product?.sku) {
    return loadErrorPage();
  }

  const langDefinitions = {
    default: {
      ...labels,
    },
  };

  const models = {
    ProductDetails: {
      initialData: { ...product },
      transformer: (rawProduct) => {
        if (!rawProduct) return null;

        // Helper function to get attribute value by name
        const getAttributeValue = (attributeName) => {
          const attr = rawProduct.attributes?.find((a) => a.name === attributeName);
          return attr?.value || '';
        };

        // Add custom fields to the transformed product
        return {
          videos: rawProduct.videos || [],
          vimeo_video: getAttributeValue('vimeo_video'), // Include vimeo video URL
          eyebrowSuggestLabel: getAttributeValue('eyebrow_suggest_label'),
          promotionEndDate: getAttributeValue('promotion_end_date'),
          promotionLabel: getAttributeValue('promotion_label'),
          productTitleLine2: getAttributeValue('product_title_line_2'),
          pdpType: getAttributeValue('pdp_type'),
          badge: getAttributeValue('badge'),
          promotionCountdownLabel: getAttributeValue('promotion_countdown_label'),
          marketing_product_name: getAttributeValue('marketing_product_name'), // Include marketing product name for display
          nasm_price: rawProduct.nasm_price || [], // Include nasm_price data for bundle products
          default_instalment: getAttributeValue('default_instalment'), // Include default_instalment for bundle pricing
          mapped_products: getAttributeValue('mapped_products'), // Include mapped_products for matrix products
          plp_price: getAttributeValue('plp_price'), // Include plp_price for subscription products
        };
      },
    },
  };

  // Initialize Dropins
  return initializers.mountImmediately(initialize, {
    sku,
    optionsUIDs,
    langDefinitions,
    models,
    acdl: true,
    persistURLParams: true,
  });
})();

async function preloadImageMiddleware(data) {
  const image = data?.images?.[0]?.url?.replace(/^https?:/, '');

  if (image) {
    await UI.render(Image, {
      src: image,
      ...IMAGES_SIZES.mobile,
      params: {
        ...IMAGES_SIZES,
      },
      loading: 'eager',
    })(document.createElement('div'));
  }
  return data;
}
