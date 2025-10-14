import { Button, Input, provider as UI } from '@dropins/tools/components.js';
import * as cartApi from '@dropins/storefront-cart/api.js';
import { events } from '@dropins/tools/event-bus.js';
import { fetchPlaceholders } from '../../scripts/commerce.js';
import { formatNumber } from '../../scripts/configs.js';
import { removeAlias } from '../../utils/cart-checkout.js';

const labels = await fetchPlaceholders();

let $errorEl;
let $inputEl;
let $couponsWrapper;
let latestDiscounts = [];

export function toggleContainer(button, heading) {
  const content = heading.nextElementSibling;
  if (content.hasAttribute('hidden')) {
    content.removeAttribute('hidden');
    button.classList.remove('collapsed');
  } else {
    content.setAttribute('hidden', '');
    button.classList.add('collapsed');
  }
}

const getValidCouponCodes = (discounts = []) => discounts
  .map((d) => d.coupon?.code)
  .filter((code) => !!code);

const renderAppliedCoupons = (discounts = []) => {
  $couponsWrapper.innerHTML = '';

  if (!discounts.length) {
    return false;
  }

  const validCoupons = discounts;
  const couponCodeBlock = document.createElement('div');

  validCoupons.forEach((appliedCode) => {
    const isAutoApplied = !appliedCode?.coupon?.code;
    const couponCode = appliedCode?.coupon?.code || '';
    const block = document.createElement('div');
    block.className = 'applied-code__wrapper';
    block.dataset.code = couponCode;

    // check if auto applied code
    let appliedCouponCode = removeAlias(couponCode);
    let appliedCouponLabel = appliedCode?.label;

    if (isAutoApplied && appliedCode.label?.includes('|')) {
      const [code, desc] = appliedCode.label.split('|').map((s) => s.trim());
      appliedCouponCode = code;
      appliedCouponLabel = desc;
    }

    block.innerHTML = `
      <div class="applied-code__data">
        <div>
          <div class="applied-code__code">${appliedCouponCode}</div>
          <div class="applied-code__price">-$${formatNumber(appliedCode?.amount?.value)}</div>
        </div>
        <div class="${isAutoApplied ? 'is-auto-applied' : ''}">
          <buttton tabindex="0" class="applied-code__remove" data-code="${couponCode}"></button>
        </div>
      </div>
      <div class="applied-code__description">${appliedCouponLabel}</div>
    `;

    const removeButton = block.querySelector('.applied-code__remove');
    ['click', 'keydown'].forEach((event) => {
      removeButton.addEventListener(event, async (e) => {
        if (e.type === 'keydown' && e.key !== 'Enter') return;
        const removeCode = e.target.dataset.code;
        const remainingCodes = getValidCouponCodes(discounts).filter(
          (code) => code !== removeCode,
        );
        await applyCouponCodeToCart(remainingCodes, 'REMOVE');
      });
    });

    couponCodeBlock.appendChild(block);
  });

  $couponsWrapper.appendChild(couponCodeBlock);
  return true;
};

async function applyCouponCodeToCart(couponCodes, mode, inputValue) {
  try {
    if (mode === 'ADD' && !inputValue) {
      throw new Error(labels?.cart.coupon.code.empty.error);
    }

    $errorEl.textContent = '';
    $inputEl.classList.remove('error');

    const response = await cartApi.applyCouponsToCart(couponCodes, 'REPLACE');

    if (!response?.errors) {
      events.emit('cart/updated', response);
      events.emit('cart/data', response);
      renderAppliedCoupons(response?.appliedDiscounts);
      $inputEl.value = '';
    } else {
      console.warn('Coupon application error:', response.errors);
    }
  } catch (error) {
    if ($errorEl) {
      $errorEl.textContent = `${error}`.replace('Error: ', '');
      $inputEl.classList.add('error');
    }
  }
}

export default async function renderCouponCodeBlock() {
  const block = document.createElement('div');

  const fragment = document.createRange().createContextualFragment(`
    <div class="coupon-code_wrapper">
      <div class="coupon-code_header collapsible-heading">
        <h3>${labels?.cart.coupon.code.title}</h3>
        <div class="toggle-coupon-code"></div>
      </div>
      <div class="coupon-code_content">
        <div class="applied-coupons"></div>
        <div class="coupon-code_input-wrapper">
          <div class="coupon-code_input"></div>
          <div class="coupon-code_apply"></div>
        </div>
        <div class="coupon-code_error"></div>
        <div class="coupon-code_description">${labels?.cart.coupon.code.description}</div>
      </div>
    </div>
  `);

  const $toggleButton = fragment.querySelector('.toggle-coupon-code');
  const $codeInput = fragment.querySelector('.coupon-code_input');
  const $applyButton = fragment.querySelector('.coupon-code_apply');
  $errorEl = fragment.querySelector('.coupon-code_error');
  $couponsWrapper = fragment.querySelector('.applied-coupons');

  await Promise.all([
    UI.render(Button, {
      ariaLabel: 'Toggle Coupon Code',
      onClick: (e) => {
        const heading = e.target.closest('.collapsible-heading');
        if (!heading) return;
        toggleContainer(e.target, heading);
      },
      onKeyDown: (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const heading = e.target.closest('.collapsible-heading');
          if (!heading) return;
          toggleContainer(e.target, heading);
        }
      },
    })($toggleButton),
    UI.render(Input, {
      placeholder: labels?.cart.coupon.code.placeholder,
      type: 'text',
      id: 'applyCouponInput',
    })($codeInput),
    UI.render(Button, {
      children: labels?.cart.coupon.code.buttontext,
      variant: 'primary',
      id: 'applyCouponCTA',
      onClick: () => {
        if ($inputEl) {
          const alreadyAdded = getValidCouponCodes(latestDiscounts);
          const coupons = [...alreadyAdded, $inputEl?.value];
          applyCouponCodeToCart(coupons, 'ADD', $inputEl?.value);
        }
      },
    })($applyButton),
  ]);

  $inputEl = $codeInput.querySelector('input');
  block.appendChild(fragment);

  events.on('cart/initialized', (data) => {
    if (data?.appliedDiscounts?.length) {
      latestDiscounts = data.appliedDiscounts;
      renderAppliedCoupons(data.appliedDiscounts);
    }
  });

  events.on('cart/data', (data) => {
    if (data?.appliedDiscounts) {
      latestDiscounts = data.appliedDiscounts;
      renderAppliedCoupons(latestDiscounts);
    }
  });

  return block.firstElementChild;
}
