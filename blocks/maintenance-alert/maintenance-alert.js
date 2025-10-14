export default function decorate(block) {
  const data = [...block.children].map((row) => [...row.children]
    .map((cell) => cell.textContent.trim()));

  const isEnabled = data.find((row) => row[0] === 'enabled')?.[1] === 'true';
  const message = data.find((row) => row[0] === 'message')?.[1] || '';
  const backgroundColor = data.find((row) => row[0] === 'backgroundColor')?.[1] || 'midnight-sky';

  // Check if alert should be displayed
  if (!isEnabled || !message) {
    block.style.display = 'none';
    return;
  }

  // Create the alert structure
  const alert = document.createElement('div');
  alert.className = `maintenance-alert-container bg-${backgroundColor}`;

  const content = document.createElement('div');
  content.className = 'maintenance-alert-content';

  const textElement = document.createElement('div');
  textElement.className = 'maintenance-alert-text';
  textElement.innerHTML = message;

  content.appendChild(textElement);
  alert.appendChild(content);

  // Replace block content
  block.textContent = '';
  block.appendChild(alert);
}
