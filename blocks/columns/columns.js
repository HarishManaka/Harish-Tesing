import { loadBlock, decorateBlock } from '../../scripts/aem.js';

export default async function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-${cols.length}-cols`);

  // Get vertical alignment from block metadata
  const verticalAlignment = block.dataset.verticalAlignment || 'center';
  block.classList.add(`columns-align-${verticalAlignment}`);

  // setup image columns
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const pic = col.querySelector('picture');
      if (pic) {
        const picWrapper = pic.closest('div');
        if (picWrapper && picWrapper.children.length === 1) {
          // picture is only content in column
          picWrapper.classList.add('columns-img-col');
        }
      }
    });
  });

  // Detect and process id-me-badge blocks
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const pTags = [...col.querySelectorAll('p')];

      // Look for id-me-badge block pattern at the beginning
      if (pTags.length >= 2) {
        const badgeFieldsFound = [];

        // Check for badge fields at the start
        for (let i = 0; i < pTags.length; i += 2) {
          if (i + 1 < pTags.length) {
            const fieldName = pTags[i].textContent.trim();
            const fieldValue = pTags[i + 1].textContent.trim();

            if (fieldName === 'badgeColor' || fieldName === 'display') {
              badgeFieldsFound.push({
                fieldName,
                fieldValue,
                pTags: [pTags[i], pTags[i + 1]],
              });
            } else {
              // Stop when we encounter non-badge fields
              break;
            }
          }
        }

        // If we found badge fields, create the badge block
        if (badgeFieldsFound.length > 0) {
          const blockWrapper = document.createElement('div');
          blockWrapper.classList.add('id-me-badge', 'block');
          blockWrapper.dataset.blockName = 'id-me-badge';
          blockWrapper.dataset.blockStatus = 'initialized';

          // Create the block structure
          badgeFieldsFound.forEach((field) => {
            const rowDiv = document.createElement('div');
            field.pTags.forEach((pTag) => {
              const cellDiv = document.createElement('div');
              cellDiv.appendChild(pTag.cloneNode(true));
              rowDiv.appendChild(cellDiv);
            });
            blockWrapper.appendChild(rowDiv);
          });

          // Insert the block wrapper before the first badge field
          const firstField = badgeFieldsFound[0];
          firstField.pTags[0].parentNode.insertBefore(blockWrapper, firstField.pTags[0]);

          // Remove the original badge p tags
          badgeFieldsFound.forEach((field) => {
            field.pTags.forEach((pTag) => {
              if (pTag.parentNode) {
                pTag.parentNode.removeChild(pTag);
              }
            });
          });
        }
      }
    });
  });

  // Handle regular buttons for ID.me verification
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      // Look for buttons that should trigger ID.me verification
      const buttons = col.querySelectorAll('a.button');
      buttons.forEach((button) => {
        const buttonText = button.textContent.toLowerCase();
        // Check if button text suggests ID.me verification
        if (buttonText.includes('id.me')) {
          // Add click handler to open ID.me verification modal
          button.addEventListener('click', (e) => {
            e.preventDefault();
            const verifyUrl = 'https://hosted-pages.id.me/offers/nasm';
            const windowFeatures = 'width=600,height=700,scrollbars=yes,resizable=yes,toolbar=no,menubar=no';

            window.open(verifyUrl, 'id-me-verify', windowFeatures);
          });

          // Add a visual indicator that this opens ID.me
          button.classList.add('id-me-trigger');
        }
      });
    });
  });

  // Now load the properly identified blocks
  const nestedBlocks = [...block.querySelectorAll('.block')];
  await Promise.all(nestedBlocks.map(async (nestedBlock) => {
    decorateBlock(nestedBlock);
    await loadBlock(nestedBlock);
  }));
}
