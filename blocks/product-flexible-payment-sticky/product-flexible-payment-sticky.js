export default async function decorate(block) {
  // Destructure children in block
  const [stickyText, stickyCTAText, stickyCTAButton] = block.children;
  stickyCTAText.className = 'pdp-flexible-payments-ready';
  // Get all content elements
  const stickyTextField = Array.from(stickyText.children[0].children);
  const stickyCTATextField = Array.from(stickyCTAText.children[0].children);
  const stickyCTAButtonField = Array.from(stickyCTAButton.children[0].children);
  // Rebuild DOM
  block.textContent = '';
  // Build Root
  const root = document.createElement('div');
  root.id = '#pdp-flexible-payments-ready';
  root.classList.add('pdp-flexible-payments-ready');
  // Build pdp-flexible-payments container
  const pdpFlexiblePayments = document.createElement('div');
  pdpFlexiblePayments.classList.add('pdp-flexible-payments');
  // Build pdp-fp-call
  const pdpFpCall = document.createElement('div');
  pdpFpCall.classList.add('pdp-fp-call');
  pdpFpCall.append(stickyTextField[0]);
  pdpFlexiblePayments.append(pdpFpCall);
  // Build pdp-ready-choose & pdp-ready-cta
  const pdpReadyChoose = document.createElement('div');
  pdpReadyChoose.classList.add('pdp-ready-choose');
  const pdpReadyCTA = document.createElement('div');
  pdpReadyCTA.classList.add('pdp-ready-cta');
  pdpReadyCTA.append(stickyCTATextField[0]);
  // Build CTA button
  const stickyCTAChooseButton = document.createElement('a');
  stickyCTAChooseButton.classList.add('nasm-primary-btn');
  stickyCTAChooseButton.innerText = stickyCTAButtonField[0].innerText;
  // Append all elements in order
  pdpReadyChoose.append(pdpReadyCTA);
  pdpReadyChoose.append(stickyCTAChooseButton);
  root.append(pdpFlexiblePayments);
  root.append(pdpReadyChoose);
  block.appendChild(root);
}
