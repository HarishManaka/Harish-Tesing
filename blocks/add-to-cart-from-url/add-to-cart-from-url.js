import { addProductsToCart, applyCouponsToCart } from '@dropins/storefront-cart/api.js';
import { ProgressSpinner, provider as UI } from '@dropins/tools/components.js';
import { CART_PATH } from '../../scripts/constants.js';

function parseUrlParameters(url) {
  const urlParams = new URLSearchParams(url.split('?')[1] || '');
  return {
    products: urlParams.get('products')?.split('|').filter(Boolean) || [],
    coupons: urlParams.get('coupons')?.split('|').filter(Boolean) || [],
  };
}

function storeError(errors) {
  const { products } = parseUrlParameters(window.location.href);
  const productsWithErrors = [];
  products.forEach((product) => {
    if (errors.indexOf(product) !== -1) {
      productsWithErrors.push(product);
    }
  });

  sessionStorage.setItem('showErrorInCartPage', JSON.stringify(productsWithErrors));
}

async function processCartOperations(products, coupons) {
  try {
    // Add products to cart
    if (products.length > 0) {
      const productsToAdd = products.map((sku) => ({
        sku: sku.trim(),
        quantity: 1,
      }));

      try {
        await addProductsToCart(productsToAdd);
      } catch (error) {
        storeError(error?.message);
      }
    }

    // Apply coupons to cart
    if (coupons.length > 0) {
      try {
        await applyCouponsToCart(coupons, 'APPEND');
      } catch (error) {
        return true;
      }
    }
    return true;
  } catch (error) {
    console.error('Error processing cart operations:', error);
    return true;
  }
}

export default async function decorate(block) {
  // Get the data from the block using key-value approach
  const data = [...block.children].map((row) => [...row.children]
    .map((cell) => cell.textContent.trim()));

  const loadingMessage = data.find((row) => row[0] === 'loadingMessage')?.[1];
  const successMessage = data.find((row) => row[0] === 'successMessage')?.[1];
  const errorMessage = data.find((row) => row[0] === 'errorMessage')?.[1];
  const noParamsMessage = data.find((row) => row[0] === 'noParamsMessage')?.[1];

  const config = {
    loadingMessage,
    successMessage,
    errorMessage,
    noParamsMessage,
  };

  const { products, coupons } = parseUrlParameters(window.location.href);

  const addToCartFragment = document.createRange().createContextualFragment(`
    <div class="add-to-cart-wrapper">
    <div class="add-to-cart-loading"></div>  
      <div class="add-to-cart-message">${config.loadingMessage || 'Please wait...'}</div>
    </div>
  `);

  block.replaceChildren(addToCartFragment);
  const $addToCartSpinner = block.querySelector('.add-to-cart-loading');

  if ($addToCartSpinner) {
    await UI.render(ProgressSpinner, {
      className: '.checkout__overlay-spinner',
    })($addToCartSpinner);
  } else {
    console.error('Spinner container not found');
  }

  if (products.length === 0 && coupons.length === 0) {
    const messageElement = block.querySelector('.add-to-cart-message');
    if (messageElement) {
      $addToCartSpinner.innerHTML = '';
      messageElement.textContent = config.noParamsMessage;
    }
    return;
  }

  await processCartOperations(products, coupons);
  window.location.href = CART_PATH;
}
