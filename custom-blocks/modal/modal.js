import { h } from '@dropins/tools/preact.js';
import { useEffect, useState } from '@dropins/tools/preact-hooks.js';
import htm from '../../scripts/htm.js';
import { loadCSS } from '../../scripts/aem.js';

const html = htm.bind(h);

export default function SessionOut({
  title,
  description,
  buttonLabel,
  onClickHandler,
}) {
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    loadCSS(`${window.hlx.codeBasePath}/custom-blocks/modal/modal.css`);
  }, []);

  if (!isOpen) return null;

  const handleAction = () => {
    if (typeof onClickHandler === 'function') {
      onClickHandler();
    }
    setIsOpen(false);
  };

  return html`
    <div class="nasm-generic-modal-overlay">
      <div class="nasm-generic-modal">
        <div class="nasm-generic-modal__content">
          <div class="nasm-generic-modal__title">${title}</div>
          <div class="nasm-generic-modal__description">${description}</div>
          <div class="nasm-generic-modal__actions">
            <button 
              class="nasm-generic-modal__cta-btn" 
              onClick=${handleAction}
            >
              ${buttonLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}
