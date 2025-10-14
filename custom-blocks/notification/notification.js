import { h } from '@dropins/tools/preact.js';
import htm from '../../scripts/htm.js';
import { loadCSS } from '../../scripts/aem.js';

const html = htm.bind(h);

loadCSS(`${window.hlx?.codeBasePath || ''}/custom-blocks/notification/notification.css`);

/**
 * Notification component
 * @param {Object} props
 * @param {string} props.type - Type of notification: 'success', 'error', 'warning', 'info'
 * @param {string} props.message - Message to display (can contain anchor tags)
 * @param {boolean} [props.showIcon=true] - Whether to show the icon
 * @param {boolean} [props.showClose=true] - Whether to show the close button
 * @param {Function} [props.onClose] - Callback function when close button is clicked
 */
export default function Notification({
  type = 'info',
  message,
  showIcon = true,
  showClose = false,
  onClose,
}) {
  const types = {
    success: {
      icon: '✓',
    },
    error: {
      iconSrc: '/icons/exclamation-circle.svg',
      alt: 'Error',
    },
    warning: {
      icon: '!',
    },
    info: {
      iconSrc: '/icons/exclamation-circle-blue.svg',
    },
  };

  const cssClasses = `notification notification--${type}`;

  return html`
    <div class="${cssClasses}" role="alert">
      ${showIcon && html`
        <span class="notification__icon" aria-hidden="true">
          ${types[type].iconSrc
    ? html`<img src="${types[type].iconSrc}" alt="${types[type].alt}" width="16" height="16" />`
    : types[type].icon
}
        </span>
      `}
      <span
        class="notification__message"
        dangerouslySetInnerHTML=${{ __html: message }}
      ></span>
      ${showClose && html`
        <button 
          class="notification__close-btn"
          onClick=${onClose}
          aria-label="Close notification"
        >
          ×
        </button>
      `}
    </div>
  `;
}
