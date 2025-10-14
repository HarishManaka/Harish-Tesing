export function payTodayBlock({
  container,
  variation,
  title,
  desc = '',
  promotionLabel = '',
  offerAmount = '',
}) {
  if (container?.querySelector('.paytoday-offer')) return;
  const promotionText = offerAmount ? promotionLabel.replace('{{amount}}', `$${parseInt(offerAmount.replace('$', ''), 10)}`) : '';
  const div = document.createElement('div');
  div.className = `paytoday-offer paytoday-${variation}`;
  let html = `
    <div>
      <h5>${title}</h5>
      <p class="promotion-label">${promotionText}</p>
      <p>${desc}</p>
    </div>
  `;
  if (variation === 'order-summary' && offerAmount) {
    html = `
      <div class="paytoday-title">${title}</div>
      <div class="paytoday-offer-price">${offerAmount}</div>
    `;
  }

  div.innerHTML = html;
  container.appendChild(div);
}

export function renderPayToday({
  payTodayHeaderContainer,
  payTodaySummaryContainer,
  isRenderPayToday,
  labels,
}) {
  if (isRenderPayToday) {
    payTodayBlock({
      container: payTodayHeaderContainer,
      variation: 'header',
      title: labels.cart.paytoday.offer.title,
      desc: labels.cart.paytoday.offer.desc,
      promotionLabel: labels.cart.paytoday.offer.promotion.label,
      offerAmount: labels.cart.paytoday.offer.offerAmount,
    });

    payTodayBlock({
      container: payTodaySummaryContainer,
      variation: 'order-summary',
      title: labels.cart.paytoday.offer.orderSummary.title,
      offerAmount: labels.cart.paytoday.offer.offerAmount,
    });
  } else {
    payTodayHeaderContainer.innerHTML = '';
    if (payTodaySummaryContainer) payTodaySummaryContainer.innerHTML = '';
  }
}
