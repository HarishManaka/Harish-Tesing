import { h } from '@dropins/tools/preact.js';
import htm from '../../scripts/htm.js';
import { formatCurrency } from '../../utils/cart-checkout.js';
import { loadCSS } from '../../scripts/aem.js';
import { fetchPlaceholders } from '../../scripts/commerce.js';

const html = htm.bind(h);
const labels = await fetchPlaceholders();
export default function SelectedPaymentOption({
  className = '',
  payTodayData,
}) {
  loadCSS(`${window.hlx.codeBasePath}/custom-blocks/selected-payment-option/selected-payment-option.css`);

  const months = payTodayData?.planDuration || '';

  return html`
    <div class="nasm-selected-payment-option ${className}">
        <div class="nasm-selected-payment-option__row">
          <span class="nasm-selected-payment-option__label">
            ${labels?.checkout.select.payment.label}
          </span>
          <span class="nasm-selected-payment-option__value">
            ${formatCurrency(payTodayData?.scheduledPaymentAmount)}/<span>month</span>
          </span>
        </div>
        <div class="nasm-selected-payment-option__note">
          ${labels?.checkout?.selected?.payment?.option?.text?.replace('{{months}}', months)}
          <span>(${labels?.checkout.selected.payment.option.include.tax.text})</span>
        </div>
    </div>
  `;
}
