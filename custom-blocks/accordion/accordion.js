import { h } from '@dropins/tools/preact.js';
import { useState } from '@dropins/tools/preact-hooks.js';
import htm from '../../scripts/htm.js';
import { loadCSS } from '../../scripts/aem.js';

const html = htm.bind(h);

export default function Accordion({
  title,
  isExpanded = true,
  children,
  className = '',
  onToggle = null,
  AccordionFooter = null,
  variation = 'default', // 'default' or 'bottom-button'
}) {
  const [isOpen, setIsOpen] = useState(isExpanded);

  const handleToggle = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    if (onToggle) {
      onToggle(newState);
    }
  };

  loadCSS(`${window.hlx.codeBasePath}/custom-blocks/accordion/accordion.css`);

  if (variation === 'sticky') {
    return html`
    <div class="nasm-accordion ${className}">
      <div 
        id="sticky-accordion-content"
        class="nasm-accordion__content ${isOpen ? 'nasm-accordion__content--expanded' : ''}"
        aria-labelledby="sticky-accordian-header"
        role="region"
      >
        <div class="sticky-nasm-accordion__content__title">
          <h3 class="nasm-accordion__title-only" id="sticky-accordian-header">
            ${title}
          </h3>
          <div class="toggle-expand-collapsible">
            <button
              class="nasm-accordion__header ${isOpen ? 'opened' : 'closed'}"
              onClick=${handleToggle}
              aria-expanded=${isOpen}
              aria-controls="sticky-accordion-content"
              aria-label="${isOpen ? 'Collapse' : 'Expand'} ${title}"
            >
            </button>
          </div>
        </div>
        ${children}
      </div>
      <button 
        class="nasm-accordion__footer-button ${isOpen ? 'arrow-up' : 'arrow-down'}"
        onClick=${handleToggle}
        aria-expanded=${isOpen}
        aria-controls="sticky-accordion-content"
        aria-label="${isOpen ? 'Collapse' : 'Expand'} ${title}"
      >
        <span class="nasm-accordion__icon">
            ${isOpen ? '' : html`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <path d="M16.332 13.5415C16.1237 13.3332 15.832 13.3332 15.6237 13.5415L9.45703 19.6248C9.2487 19.8332 9.2487 20.1665 9.45703 20.3332L10.2904 21.1665C10.4987 21.3748 10.7904 21.3748 10.9987 21.1665L15.9987 16.2498L20.957 21.1665C21.1654 21.3748 21.4987 21.3748 21.6654 21.1665L22.4987 20.3332C22.707 20.1665 22.707 19.8332 22.4987 19.6248L16.332 13.5415Z" fill="#333333"/>
                </svg>`}
          </span>
      </button>
      ${AccordionFooter}
    </div>
  `;
  }

  return html`
      <div class="nasm-accordion common-aside__container ${className}">
        <div class="common-aside__header">
          <h3 class="common-aside__title" id="accordion-header-${title.replace(/\s+/g, '-').toLowerCase()}">
            ${title}
          </h3>
          <div class="toggle-expand-collapsible">
            <button
              class="nasm-accordion__header ${isOpen ? 'opened' : 'closed'}"
              onClick=${handleToggle}
              aria-expanded=${isOpen}
              aria-controls="accordion-content-${title.replace(/\s+/g, '-').toLowerCase()}"
              aria-label="${isOpen ? 'Collapse' : 'Expand'} ${title}"
            >
            </button>
          </div>
        </div>
        <div 
          id="accordion-content-${title.replace(/\s+/g, '-').toLowerCase()}"
          class="nasm-accordion__content common-aside__content--inner ${isOpen ? 'nasm-accordion__content--expanded' : ''}"
          aria-labelledby="accordion-header-${title.replace(/\s+/g, '-').toLowerCase()}"
        >
          <div class="common-aside__content">
            ${children}
          </div>
        </div>
      </div>
    `;
}
