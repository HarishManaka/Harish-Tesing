/* eslint-disable import/no-cycle */
import { initializers } from '@dropins/tools/initializer.js';
import { initialize, setFetchGraphQlHeaders } from '@dropins/storefront-cart/api.js';
import { initializeDropin } from './index.js';
import { fetchPlaceholders } from '../commerce.js';
import { getHeaders } from '../configs.js';

await initializeDropin(async () => {
  setFetchGraphQlHeaders((prev) => ({ ...prev, ...getHeaders('cart') }));

  const labels = await fetchPlaceholders();
  const langDefinitions = {
    default: {
      ...labels,
    },
  };

  // ✅ Add models with transformer here
  const models = {
    CartModel: {
      transformer: (data) => {
        const {
          itemsV2: { items },
        } = data;

        const cartCrossSellProducts = items.map((item) => {
          const { product: { crosssell_products: crossSellProducts } } = item;

          return { crossSellProducts };
        });

        return { items: cartCrossSellProducts };
      },
    },
  };

  return initializers.mountImmediately(initialize, { langDefinitions, models });
})();
