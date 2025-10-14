/**
 * Global Toast Notification System
 * Creates toast messages that appear at the top of the screen
 */

let toastContainer = null;

/**
 * Creates the toast container if it doesn't exist
 */
function createToastContainer() {
  if (toastContainer) return toastContainer;

  toastContainer = document.createElement('div');
  toastContainer.className = 'toast-container';
  toastContainer.setAttribute('aria-live', 'polite');
  toastContainer.setAttribute('aria-atomic', 'true');

  // Add styles
  toastContainer.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 10000;
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-width: 90vw;
    width: 100%;
    max-width: 500px;
    pointer-events: none;
  `;

  document.body.appendChild(toastContainer);
  return toastContainer;
}

/**
 * Creates and shows a toast notification
 * @param {string} message - The message to display
 * @param {string} type - The type of toast ('error', 'success', 'info', 'warning')
 * @param {number} duration - Duration in ms (default: 5000, 0 = no auto-dismiss)
 * @param {string} title - Optional title for the toast
 * @returns {HTMLElement} The toast element
 */
export function showToast(message, type = 'info', duration = 5000, title = null) {
  const container = createToastContainer();

  // Create toast element
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.setAttribute('role', 'alert');
  toast.style.cssText = `
    background: ${getToastColor(type)};
    color: white;
    padding: 16px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    font-family: var(--type-base-font-family), sans-serif;
    font-size: 14px;
    line-height: 1.4;
    margin-bottom: 8px;
    transform: translateY(-100px);
    opacity: 0;
    transition: all 0.3s ease;
    pointer-events: auto;
    position: relative;
    max-width: 100%;
    word-wrap: break-word;
  `;

  // Create content
  const content = document.createElement('div');
  content.style.cssText = 'display: flex; align-items: flex-start; gap: 12px;';

  // Add icon based on type
  const icon = document.createElement('span');
  icon.style.cssText = 'font-size: 18px; line-height: 1; flex-shrink: 0; margin-top: 1px;';
  icon.textContent = getToastIcon(type);
  content.appendChild(icon);

  // Add message content
  const messageContent = document.createElement('div');
  messageContent.style.cssText = 'flex: 1; min-width: 0;';

  if (title) {
    const titleElement = document.createElement('div');
    titleElement.style.cssText = 'font-weight: 600; margin-bottom: 4px; font-size: 15px;';
    titleElement.textContent = title;
    messageContent.appendChild(titleElement);
  }

  const messageElement = document.createElement('div');
  messageElement.textContent = message;
  messageContent.appendChild(messageElement);

  content.appendChild(messageContent);

  // Add close button
  const closeButton = document.createElement('button');
  closeButton.innerHTML = '×';
  closeButton.style.cssText = `
    background: none;
    border: none;
    color: white;
    font-size: 20px;
    line-height: 1;
    cursor: pointer;
    padding: 0;
    margin-left: 12px;
    opacity: 0.8;
    flex-shrink: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
  `;
  closeButton.setAttribute('aria-label', 'Close notification');
  closeButton.addEventListener('click', () => hideToast(toast));
  closeButton.addEventListener('mouseenter', () => {
    closeButton.style.opacity = '1';
  });
  closeButton.addEventListener('mouseleave', () => {
    closeButton.style.opacity = '0.8';
  });

  content.appendChild(closeButton);
  toast.appendChild(content);
  container.appendChild(toast);

  // Animate in
  requestAnimationFrame(() => {
    toast.style.transform = 'translateY(0)';
    toast.style.opacity = '1';
  });

  // Auto-hide after duration
  if (duration > 0) {
    setTimeout(() => hideToast(toast), duration);
  }

  return toast;
}

/**
 * Hides a toast notification
 * @param {HTMLElement} toast - The toast element to hide
 */
function hideToast(toast) {
  if (!toast || !toast.parentElement) return;

  toast.style.transform = 'translateY(-100px)';
  toast.style.opacity = '0';

  setTimeout(() => {
    if (toast.parentElement) {
      toast.parentElement.removeChild(toast);
    }
  }, 300);
}

/**
 * Gets the background color for a toast type
 * @param {string} type - The toast type
 * @returns {string} The CSS color value
 */
function getToastColor(type) {
  switch (type) {
    case 'error':
      return '#CC2929';
    case 'success':
      return 'var(--color-success-800, #2d7d32)';
    case 'warning':
      return 'var(--color-warning-800, #f57c00)';
    case 'info':
    default:
      return 'var(--color-info-800, #1976d2)';
  }
}

/**
 * Gets the icon for a toast type
 * @param {string} type - The toast type
 * @returns {string} The icon character
 */
function getToastIcon(type) {
  switch (type) {
    case 'error':
      return '⚠️';
    case 'success':
      return '✅';
    case 'warning':
      return '⚠️';
    case 'info':
    default:
      return 'ℹ️';
  }
}

/**
 * Shows an error toast
 * @param {string} message - The error message
 * @param {string} title - Optional title (default: "Error")
 * @param {number} duration - Duration in milliseconds (default: 0 - no auto-dismiss)
 */
export function showErrorToast(message, title = 'Error', duration = 0) {
  return showToast(message, 'error', duration, title);
}

/**
 * Shows a success toast
 * @param {string} message - The success message
 * @param {string} title - Optional title (default: "Success")
 * @param {number} duration - Duration in milliseconds (default: 4000)
 */
export function showSuccessToast(message, title = 'Success', duration = 4000) {
  return showToast(message, 'success', duration, title);
}

/**
 * Shows a warning toast
 * @param {string} message - The warning message
 * @param {string} title - Optional title (default: "Warning")
 * @param {number} duration - Duration in milliseconds (default: 5000)
 */
export function showWarningToast(message, title = 'Warning', duration = 5000) {
  return showToast(message, 'warning', duration, title);
}

/**
 * Shows an info toast
 * @param {string} message - The info message
 * @param {string} title - Optional title
 * @param {number} duration - Duration in milliseconds (default: 4000)
 */
export function showInfoToast(message, title = null, duration = 4000) {
  return showToast(message, 'info', duration, title);
}

/**
 * Clears all visible toasts
 */
export function clearAllToasts() {
  if (toastContainer) {
    const toasts = toastContainer.querySelectorAll('.toast');
    toasts.forEach((toast) => hideToast(toast));
  }
}
