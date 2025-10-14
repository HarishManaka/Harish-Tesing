export default function decorate(block) {
  const data = [...block.children].map((row) => [...row.children]
    .map((cell) => cell.textContent.trim()));

  const badgeColor = data.find((row) => row[0] === 'badgeColor')?.[1] || '';

  // Create the badge structure with ID.me logo
  const badge = document.createElement('div');
  badge.className = `id-me-badge-container${badgeColor ? ` ${badgeColor}` : ''}`;

  const badgeContent = document.createElement('div');
  badgeContent.className = 'id-me-badge-content';

  // Create the logo image
  const logo = document.createElement('img');
  logo.src = '/icons/idme-logo.png';
  logo.alt = 'ID.me';
  logo.className = 'id-me-logo';

  badgeContent.appendChild(logo);
  badge.appendChild(badgeContent);

  // Replace block content
  block.textContent = '';
  block.appendChild(badge);
}
