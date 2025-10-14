import { addProductsToCart } from '@dropins/storefront-cart/api.js';
import { ProgressSpinner, provider as UI } from '@dropins/tools/components.js';
import { getConfigValue } from '../../scripts/configs.js';
import { CART_PATH } from '../../scripts/constants.js';
import { getSignInToken } from '../../scripts/commerce.js';

function parseUrlParameters(url) {
  const urlParams = new URLSearchParams(url.split('?')[1]);
  return {
    userId: urlParams.get('user_id'),
    entityType: urlParams.get('entity_type'),
    entityId: urlParams.get('entity_id'),
    products: urlParams.get('products'),
    rpid: urlParams.get('rpid'),
  };
}

function storeError(errors) {
  const { products } = parseUrlParameters(window.location.href);
  const productsWithErrors = [];
  if (errors && errors.indexOf(products) !== -1) {
    productsWithErrors.push(products);
  }
  sessionStorage.setItem('showErrorInCartPage', JSON.stringify(productsWithErrors));
}

async function setCustomAttributesOnCartItem(cartId, cartItemId, customAttributes) {
  const mutation = `
    mutation SetCustomAttributesOnCartItem($cartId: String!, $cartItemId: String!, $customAttributes: [CustomAttributeInput!]!) {
      setCustomAttributesOnCartItem(
        input: {
          cart_id: $cartId,
          cart_item_id: $cartItemId,
          custom_attributes: $customAttributes
        }
      ) {
        cart {
          email,
          gift_receipt_included,
          id,
          is_virtual,
          printed_card_included,
          total_quantity
        }
      }
    }
  `;

  const variables = {
    cartId,
    cartItemId,
    customAttributes,
  };

  try {
    const commerceGraphQLEndpoint = getConfigValue('commerce-endpoint');
    const headers = {
      'Content-Type': 'application/json',
    };
    const token = getSignInToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(commerceGraphQLEndpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query: mutation,
        variables,
      }),
    });

    const result = await response.json();

    if (result.errors) {
      throw new Error(result.errors[0].message);
    }

    return result.data.setCustomAttributesOnCartItem;
  } catch (error) {
    console.error('GraphQL mutation error:', error);
    throw error;
  }
}

async function processRecertificationOperations(products, userId, entityType, entityId, rpid) {
  try {
    if (products) {
      const productToAdd = {
        sku: products.trim(),
        quantity: 1,
      };

      const addResult = await addProductsToCart([productToAdd]);

      if (addResult && addResult.id && addResult.items) {
        const cartItem = addResult.items[0];
        const cartId = addResult.id;
        const cartItemId = cartItem.uid;

        const recertificationData = {};
        if (userId) recertificationData.user_id = userId;
        if (entityType) recertificationData.entity_type = entityType;
        if (entityId) recertificationData.entity_id = entityId;
        if (rpid) recertificationData.rpid = rpid;
        if (products) recertificationData.products = products;

        const customAttributes = [
          {
            attribute_code: 'recertificationCartAndPay',
            value: JSON.stringify(recertificationData),
          },
        ];

        await setCustomAttributesOnCartItem(cartId, cartItemId, customAttributes);
      }

      return { success: true };
    }
    return { success: true };
  } catch (error) {
    console.error('Error processing recertification operations:', error);
    storeError(error?.message);
    return { success: false };
  }
}

export default async function decorate(block) {
  const data = [...block.children].map((row) => [...row.children]
    .map((cell) => cell.textContent.trim()));

  const loadingMessage = data.find((row) => row[0] === 'loadingMessage')?.[1];
  const successMessage = data.find((row) => row[0] === 'successMessage')?.[1];
  const errorMessage = data.find((row) => row[0] === 'errorMessage')?.[1];
  const noParamsMessage = data.find((row) => row[0] === 'noParamsMessage')?.[1];

  const config = {
    loadingMessage: loadingMessage || 'Processing recertification...',
    successMessage: successMessage || 'Recertification added to cart successfully!',
    errorMessage: errorMessage || 'Error processing recertification. Please try again.',
    noParamsMessage: noParamsMessage || 'No recertification parameters found in URL. Redirecting to cart...',
  };

  const {
    userId, entityType, entityId, products, rpid,
  } = parseUrlParameters(window.location.href);

  const addToCartFragment = document.createRange().createContextualFragment(`
    <div class="add-to-cart-wrapper">
      <div class="add-to-cart-loading"></div>  
      <div class="add-to-cart-message">${config.loadingMessage}</div>
    </div>
  `);

  block.replaceChildren(addToCartFragment);
  const $addToCartSpinner = block.querySelector('.add-to-cart-loading');

  await UI.render(ProgressSpinner, {
    className: '.checkout__overlay-spinner',
  })($addToCartSpinner);

  await processRecertificationOperations(products, userId, entityType, entityId, rpid);

  window.location.href = CART_PATH;
}
