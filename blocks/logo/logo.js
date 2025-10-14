// Deployment trigger comment
export default async function decorate(block) {
  const picture = block.querySelector('picture');

  if (picture) {
    // Create a link element
    const link = document.createElement('a');
    link.href = '/';
    link.className = 'logo-link';
    link.setAttribute('aria-label', 'NASM Home');

    // Wrap the picture in the link
    picture.parentNode.insertBefore(link, picture);
    link.appendChild(picture);

    // Add class to the image
    picture.querySelector('img')?.classList.add('logo-image');
  }
}
