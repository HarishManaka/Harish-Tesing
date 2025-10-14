import { h } from '@dropins/tools/preact.js';
import htm from '../../scripts/htm.js';
import { formatCurrency } from '../../utils/cart-checkout.js';
import { loadCSS } from '../../scripts/aem.js';
import { fetchPlaceholders } from '../../scripts/commerce.js';

const html = htm.bind(h);
const labels = await fetchPlaceholders();

export default function PaymentSummary({
  payTodayData,
}) {
  loadCSS(`${window.hlx.codeBasePath}/custom-blocks/paytoday/paytoday.css`);

  return html`
    <div class="nasm-paytoday__row">
        <span class="nasm-paytoday__label">
          ${labels?.cart.paytoday.offer.orderSummary.title}
        </span>
        <span class="nasm-paytoday__value">
          ${formatCurrency(payTodayData?.downPayment || 49.00)}
        </span>
      </div>
  `;
}
