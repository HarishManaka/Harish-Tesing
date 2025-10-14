export default async function decorate(block) {
  try {
    // Debug logging to understand the structure
    // eslint-disable-next-line no-console
    // console.log('Block structure:', block);
    // eslint-disable-next-line no-console
    // console.log('Block children:', block.children);

    // Find the cell containing content
    let contentCell = null;
    if (block.children && block.children[0] && block.children[0].children) {
      [contentCell] = block.children[0].children;
    }

    if (!contentCell) {
      // eslint-disable-next-line no-console
      console.error('Contact-rep block: Invalid block structure');
      return;
    }

    // Check if content is wrapped in a richtext div (Universal Editor)
    let content = contentCell;
    const richtextWrapper = contentCell.querySelector('[data-aue-type="richtext"]');
    if (richtextWrapper) {
      content = richtextWrapper;
      // eslint-disable-next-line no-console
      // console.log('Found richtext wrapper in Universal Editor');
    }

    // eslint-disable-next-line no-console
    // console.log('Content element:', content);
    // eslint-disable-next-line no-console
    // console.log('Content children count:', content.children.length);
    // eslint-disable-next-line no-console
    // console.log('Content children:', Array.from(content.children));

    // Collect all text elements (h3, h4, p) and buttons
    const elements = Array.from(content.children);
    const h3 = elements.find((el) => el.tagName === 'H3');
    const h4 = elements.find((el) => el.tagName === 'H4');
    const p1 = elements.find((el) => el.tagName === 'P' && !el.classList.contains('button-container'));
    const buttonContainer = elements.find((el) => el.classList.contains('button-container'));

    // Validate that we found all required elements
    if (!h3 || !h4 || !p1 || !buttonContainer) {
      // eslint-disable-next-line no-console
      console.error('Contact-rep block: Missing required elements', {
        h3: !!h3, h4: !!h4, p1: !!p1, buttonContainer: !!buttonContainer,
      });
      return;
    }

    // Create left column with h3
    const leftColumn = document.createElement('div');
    leftColumn.appendChild(h3.cloneNode(true)); // Clone to avoid issues with moving nodes

    // Create right column with h4, p, and button
    const rightColumn = document.createElement('div');
    rightColumn.appendChild(h4.cloneNode(true));
    rightColumn.appendChild(p1.cloneNode(true));
    rightColumn.appendChild(buttonContainer.cloneNode(true));

    // Clear and restructure the content cell directly
    contentCell.innerHTML = '';
    contentCell.appendChild(leftColumn);
    contentCell.appendChild(rightColumn);

    // Format h3 with spans and line breaks between words
    const newH3 = leftColumn.querySelector('h3');
    if (newH3 && newH3.textContent) {
      const words = newH3.textContent.trim().split(' ');
      newH3.innerHTML = words.map((word) => `<span>${word}</span>`).join('<br>');
    }

    // Wrap button text in span for fill-right effect
    const button = rightColumn.querySelector('a');
    if (button && !button.querySelector('span')) {
      const buttonText = button.textContent;
      button.innerHTML = `<span>${buttonText}</span>`;
    }

    // eslint-disable-next-line no-console
    // console.log('Contact-rep block: Successfully decorated');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Contact-rep block: Error during decoration', error);
    // eslint-disable-next-line no-console
    console.error('Error stack:', error.stack);
  }
}
