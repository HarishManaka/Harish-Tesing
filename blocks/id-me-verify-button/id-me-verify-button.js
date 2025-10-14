export default function decorate(block) {
  const data = [...block.children].map((row) => [...row.children]
    .map((cell) => cell.textContent.trim()));

  const buttonText = data.find((row) => row[0] === 'label')?.[1] || 'Verify with ID.me';
  const buttonStyle = data.find((row) => row[0] === 'buttonStyle')?.[1] || '';

  // Create the button structure
  const button = document.createElement('button');
  button.className = `id-me-verify-cta${buttonStyle ? ` ${buttonStyle}` : ''}`;
  button.type = 'button';
  button.setAttribute('aria-label', buttonText);

  const buttonContent = document.createElement('div');
  buttonContent.className = 'id-me-verify-content';

  // Create the logo image
  const logo = document.createElement('img');
  logo.src = '/icons/idme-logo.png';
  logo.alt = 'ID.me';
  logo.className = 'id-me-verify-logo';

  // Create the button text
  const text = document.createElement('span');
  text.className = 'id-me-verify-text';
  text.textContent = buttonText;

  buttonContent.appendChild(text);
  button.appendChild(buttonContent);

  // Add click handler to open ID.me verification in new window
  button.addEventListener('click', () => {
    const verifyUrl = 'https://hosted-pages.id.me/offers/nasm';
    const windowFeatures = 'width=600,height=700,scrollbars=yes,resizable=yes,toolbar=no,menubar=no';

    window.open(verifyUrl, 'id-me-verify', windowFeatures);
  });

  // Replace block content
  block.textContent = '';
  block.appendChild(button);
}
