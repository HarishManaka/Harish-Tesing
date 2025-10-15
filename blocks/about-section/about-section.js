export default function decorate(block) {
  const rows = [...block.children];

  // Create containers
  const textContainer = document.createElement('div');
  textContainer.classList.add('text-content');

  const imageContainer = document.createElement('div');
  imageContainer.classList.add('image-container');

  // Loop through authored cells
  rows.forEach((row) => {
    const cells = [...row.children];
    cells.forEach((cell) => {
      const img = cell.querySelector('img');
      const hasTitle = cell.classList.contains('about-title');
      const hasDesc = cell.classList.contains('about-description');

      if (img) {
        imageContainer.append(img);
      } else if (hasTitle) {
        const titleEl = document.createElement('div');
        titleEl.classList.add('about-title');
        titleEl.innerHTML = cell.innerHTML;
        textContainer.append(titleEl);
      } else if (hasDesc) {
        const descEl = document.createElement('div');
        descEl.classList.add('about-description');
        descEl.innerHTML = cell.innerHTML;
        textContainer.append(descEl);
      } else {
        textContainer.append(cell);
      }
    });
  });

  // Build final structure
  block.textContent = '';
  block.classList.add('about-section');
  block.append(textContainer, imageContainer);
}
