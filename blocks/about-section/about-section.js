export default function decorate(block) {
  const rows = [...block.children];

  // Create structure containers
  const textContainer = document.createElement('div');
  textContainer.classList.add('text-content');

  const imageContainer = document.createElement('div');
  imageContainer.classList.add('image-container');

  // Iterate through authored rows and cells
  rows.forEach((row) => {
    const cells = [...row.children];
    cells.forEach((cell) => {
      const imgRef = cell.querySelector('a[href]');
      const text = cell.querySelector('.text');
      const richtext = cell.querySelector('.richtext');

      // Handle image reference (AEM Edge Delivery style)
      if (imgRef && imgRef.href.match(/\.(jpg|jpeg|png|webp|gif)$/i)) {
        const img = document.createElement('img');
        img.src = imgRef.href;
        img.alt = imgRef.title || 'About image';
        imageContainer.append(img);
      }
      // Handle text (title)
      else if (text) {
        const textEl = document.createElement('div');
        textEl.classList.add('text');
        textEl.innerHTML = text.innerHTML;
        textContainer.append(textEl);
      }
      // Handle rich text (description or flexible content)
      else if (richtext) {
        const richEl = document.createElement('div');
        richEl.classList.add('richtext');
        richEl.innerHTML = richtext.innerHTML;
        textContainer.append(richEl);
      }
    });
  });

  // Build final block structure
  block.textContent = '';
  block.classList.add('about-section');
  block.append(textContainer, imageContainer);
}
