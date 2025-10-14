export default function decorate(block) {
  if (window.location.pathname.endsWith('/nav.html')) return;
  block.style.display = 'none';
  document.body.appendChild(block);
}
