const buildHTML = ({
  leftContent, leftLink, rightContent, rightLink,
}) => `
    <div id="pdp-flexible-payments-ready">
        <div class="pdp-flexible-payments">
            <div class="pdp-fp-call">
                <p>${leftContent}</p>
            </div>
            <div class="pdp-fp-number">
                <a href="tel:${leftLink}">${leftLink}</a>
            </div>
        </div>
        <div class="pdp-ready-choose">
            <div class="pdp-ready-cta">
                <p>${rightContent}</p>
            </div>
            <div class="pdp-choose-button">
                <a class="button secondary" href="${rightLink}">${rightLink}</a>
            </div>
        </div>
    </div>`;

export default async function decorate(block) {
  // console.info('payment-cta', block);
  const firstRow = block.children[0];
  const firstCell = firstRow?.children[0];
  const [left, right] = firstCell?.children || [];

  if (!left || !right || !left.childNodes[0] || !right.childNodes[0]) {
    console.warn('flexible-payment-cta: Expected DOM structure not found');
    block.innerHTML = buildHTML({
      leftContent: '',
      leftLink: '',
      rightContent: '',
      rightLink: '',
    });
    return;
  }

  const leftContent = left.childNodes[0]?.textContent || '';
  const leftLink = left.childNodes[1]?.textContent || '';
  const rightContent = right.childNodes[0]?.textContent || '';
  const rightLink = right.childNodes[1]?.textContent || '';

  // console.info(leftContent, leftLink, rightLink);

  block.innerHTML = buildHTML({
    leftContent,
    leftLink,
    rightContent,
    rightLink,
  });

  // Add sticky behavior
  const wrapper = block.closest('.flexible-payment-cta-wrapper');
  if (wrapper) {
    let initialTop = 0;
    let isSticky = false;
    let placeholder = null;

    const updateInitialPosition = () => {
      if (!isSticky) {
        const rect = wrapper.getBoundingClientRect();
        initialTop = window.pageYOffset + rect.top;
      }
    };

    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

      if (scrollTop > initialTop && !isSticky) {
        // Create placeholder to prevent content jump
        if (!placeholder) {
          placeholder = document.createElement('div');
          placeholder.style.height = `${wrapper.offsetHeight}px`;
          wrapper.parentNode.insertBefore(placeholder, wrapper.nextSibling);
        }
        wrapper.classList.add('is-sticky');
        isSticky = true;
      } else if (scrollTop <= initialTop && isSticky) {
        wrapper.classList.remove('is-sticky');
        isSticky = false;
        // Remove placeholder
        if (placeholder) {
          placeholder.remove();
          placeholder = null;
        }
      }
    };

    // Initial position calculation
    setTimeout(updateInitialPosition, 100);

    // Add scroll listener
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', updateInitialPosition);
    // Initial check
    handleScroll();
  }
}
