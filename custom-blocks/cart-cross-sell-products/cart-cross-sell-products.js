/* eslint-disable no-underscore-dangle */
import { addProductsToCart } from '@dropins/storefront-cart/api.js';
import { Button, provider as UI } from '@dropins/tools/components.js';
import { events } from '@dropins/tools/event-bus.js';
import { fetchPlaceholders } from '../../scripts/commerce.js';
import { rootLink } from '../../scripts/scripts.js';
import { formatCurrency, getProductPath } from '../../utils/cart-checkout.js';

const labels = await fetchPlaceholders();

function renderPlaceholder(block) {
  block.innerHTML = `<h4></h4>
  <div class="scrollable">
    <div class="product-grid">
      ${[...Array(4)].map(() => `
        <div class="placeholder">
          <picture><img width="300" height="375" src="" /></picture>
        </div>
      `).join('')}
    </div>
  </div>`;
}

function renderItem(product) {
  let image = product?.image?.url;
  if (image) {
    image = image.replace('http://', '//');
  }

  const addToCartHandler = async () => {
    if (product.__typename !== 'ConfigurableProduct') {
      // Only add simple products directly to cart (no options selections needed)
      try {
        await addProductsToCart([{
          sku: product.sku,
          quantity: 1,
        }]);
      } catch (error) {
        console.error('Error adding products to cart', error);
      }
    } else {
      // Navigate to page for non-simple products
      window.location.href = rootLink(`${getProductPath(product)}`);
    }
  };

  const ctaText = product.__typename === 'ConfigurableProduct' ? 'Select Options' : 'Add';

  // Handle different price formats that might come from cart cross-sell products

  let priceDisplay = '';
  if (product?.custom_attributesV2?.items) {
    const plpPrice = product.custom_attributesV2.items.find((attr) => attr.code === 'plp_price');
    if (plpPrice && plpPrice.value) {
      priceDisplay = formatCurrency(plpPrice.value);
    }
  }

  const isDisplayPrice = product.__typename !== 'ConfigurableProduct';

  const item = document.createRange().createContextualFragment(`
  <div class="product-grid-item">
    <a href="${getProductPath(product)}">
      <div class="product-grid-image-wrapper">
        <picture>
          <source type="image/webp" srcset="${image}/as/thumbnail.webp?width=300&quality=80&format=webp" />
          <img loading="lazy" alt="Image of ${product.name}" width="300" src="${image}/as/thumbnail.webp?width=300&quality=80&format=webp" />
        </picture>
        <div class="product-details-button">
          <span class="details-icon"></span>
          <span class="details-text">${labels?.product?.recommendations?.detail || 'Details'}</span>
        </div>
      </div>
      <span class="product-grid-name">${product.name}</span>
      ${isDisplayPrice ? `<span class="product-grid-price">${priceDisplay}</span>` : ''}
    </a>
    ${isDisplayPrice ? `<span class="product-grid-cta">${ctaText}</span>` : `<span class="product-grid-cta">${ctaText}</span>`}

  </div>
`);

  const buttonEl = item.querySelector('.product-grid-cta');
  UI.render(Button, {
    children: ctaText,
    onClick: addToCartHandler,
  })(buttonEl);
  return item;
}

function renderItems(block, crossSellProducts) {
  if (!crossSellProducts || crossSellProducts.length === 0) {
    // Hide block content if no cross-sell products are available
    block.style.display = 'none';
    return;
  }

  // Show the block if it was hidden
  block.style.display = 'block';

  // Title
  const titleElement = block.querySelector('h4');
  if (titleElement) {
    titleElement.textContent = labels?.cart?.crossSell?.title || 'You may also like';
  }

  // Grid
  const grid = block.querySelector('.product-grid');
  if (grid) {
    grid.innerHTML = '';

    crossSellProducts.forEach((product) => {
      grid.appendChild(renderItem(product));
    });
  }
}

export default async function decorate(block) {
  renderPlaceholder(block);
  block.style.display = 'none';
  function handleCrossSellProducts({ crossSellProducts }) {
    if (crossSellProducts && Array.isArray(crossSellProducts)) {
      renderItems(block, crossSellProducts);
    } else {
      block.style.display = 'none';
    }
  }
  events.on('cart/cross-sell-products', handleCrossSellProducts);
}
