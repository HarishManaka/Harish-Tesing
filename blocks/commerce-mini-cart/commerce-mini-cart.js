import { render as provider } from '@dropins/storefront-cart/render.js';
import MiniCart from '@dropins/storefront-cart/containers/MiniCart.js';

// Initializers
import '../../scripts/initializers/cart.js';

import { readBlockConfig } from '../../scripts/aem.js';
import { rootLink } from '../../scripts/scripts.js';
import { getThumbnailImage } from '../../utils/cart-checkout.js';
import { getProductUrlByType, fetchPlaceholders } from '../../scripts/commerce.js';

const labels = await fetchPlaceholders();

// Function to ensure footer slots are visible (no longer repositions)
function ensureFooterSlotsVisible(miniCartContainer) {
  // Only target footer slots within the mini-cart container
  const footerSlots = miniCartContainer.querySelectorAll('.dropin-cart-item__wrapper [data-slot="Footer"]');
  footerSlots.forEach((slot) => {
    if (slot) {
      slot.style.visibility = 'visible';
    }
  });
}

export default async function decorate(block) {
  const {
    'start-shopping-url': startShoppingURL = '',
    'cart-url': cartURL = '',
    'checkout-url': checkoutURL = '',
  } = readBlockConfig(block);

  block.innerHTML = '';

  // Product link function with pdp_type support
  const getProductLink = (item) => {
    // First, try to get pdp_type from session storage cache
    try {
      const pdpTypeCache = JSON.parse(sessionStorage.getItem('pdpTypeCache') || '{}');
      const cachedPdpType = pdpTypeCache[item.sku] || pdpTypeCache[item.topLevelSku];

      if (cachedPdpType) {
        const generatedUrl = getProductUrlByType(item.url.urlKey, item.topLevelSku, cachedPdpType);
        return rootLink(generatedUrl);
      }
    } catch (error) {
      console.warn('Error reading pdpTypeCache from sessionStorage:', error);
    }

    // Second, check if we have pdp_type from the enhanced cart item data
    if (item.pdp_type) {
      const generatedUrl = getProductUrlByType(item.url.urlKey, item.topLevelSku, item.pdp_type);
      return rootLink(generatedUrl);
    }

    // Third, try to get pdp_type from productAttributes
    if (item.productAttributes) {
      const pdpTypeAttr = item.productAttributes.find((attr) => attr.code === 'pdp_type');
      if (pdpTypeAttr?.value) {
        const generatedUrl = getProductUrlByType(
          item.url.urlKey,
          item.topLevelSku,
          pdpTypeAttr.value,
        );
        return rootLink(generatedUrl);
      }
    }

    // Fallback to standard URL pattern (matches main cart behavior)
    return rootLink(`/products/${item.url.urlKey}/${item.topLevelSku}`);
  };

  const miniCartPromise = provider.render(MiniCart, {
    routeEmptyCartCTA: startShoppingURL ? () => rootLink(startShoppingURL) : undefined,
    routeCart: cartURL ? () => rootLink(cartURL) : undefined,
    routeCheckout: checkoutURL ? () => rootLink(checkoutURL) : undefined,
    routeProduct: getProductLink,
    slots: {
      Thumbnail: (ctx) => {
        const { item, defaultImageProps } = ctx;
        const anchorWrapper = document.createElement('a');
        anchorWrapper.href = getProductLink(item);
        const optimizedImage = getThumbnailImage({
          src: defaultImageProps?.src,
          alt: defaultImageProps.alt || item.name,
          name: item.name,
          width: 80,
          height: 80,
          className: 'dropin-image',
        });
        anchorWrapper.appendChild(optimizedImage);
        ctx.replaceWith(anchorWrapper);
      },
      Footer: (ctx) => {
        const footerContainer = document.createElement('div');
        footerContainer.className = 'mini-cart-item-footer';

        footerContainer.innerHTML = `
          <div class="product-attributes-badges">
            <div class="badge-container">
              ${ctx.item.itemType === 'SimpleCartItem' ? `
              <span class="shippable-item-badge">
                <span>${labels?.cart?.cartSummaryList?.ShippableText || 'Shippable Item'}</span>
              </span>
            ` : ''}
            ${ctx.item.itemType === 'ConfigurableCartItem' ? `
              <span class="membership-item-badge">
                <span>${labels?.cart?.cartSummaryList?.MembershipText || 'Membership'}</span>
              </span>
            ` : ''}
            </div>
          </div>
        `;

        ctx.appendChild(footerContainer);
      },
    },
  })(block);

  // Wait for mini cart to render, then ensure footer slots are visible
  miniCartPromise.then(() => {
    // Use a small delay to ensure DOM is fully updated
    setTimeout(() => {
      // Find the mini cart container
      const miniCartElement = block.querySelector('[data-dropin="minicart"]');
      if (miniCartElement) {
        ensureFooterSlotsVisible(miniCartElement);

        // Set up MutationObserver to handle dynamic updates
        const observer = new MutationObserver(() => {
          ensureFooterSlotsVisible(miniCartElement);
        });

        // Observe the mini cart for changes
        observer.observe(miniCartElement, {
          childList: true,
          subtree: true,
        });
      }
    }, 100);
  });

  return miniCartPromise;
}
