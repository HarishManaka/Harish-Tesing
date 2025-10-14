/*
 * Table Block
 * Recreate a table from list structure
 * Adapted from https://www.hlx.live/developer/block-collection/table
 */

function buildCell(rowIndex) {
  const cell = rowIndex ? document.createElement('td') : document.createElement('th');
  if (!rowIndex) cell.setAttribute('scope', 'col');
  return cell;
}

function getLiElements(el) {
  const ul = el.querySelector('ul');
  return ul?.children || [];
}

export default function decorate(block) {
  // Check if block already contains a table (richtext content)
  const existingTable = block.querySelector('table');
  if (existingTable) {
    // Handle richtext table
    existingTable.classList.add('table-block-table');
    const wrapper = document.createElement('div');
    wrapper.className = 'table-content-wrapper';
    existingTable.parentNode.insertBefore(wrapper, existingTable);
    wrapper.appendChild(existingTable);
    return;
  }

  // Check for divs with divs (EDS standard structure)
  const rows = [...block.children];
  if (rows.length > 0 && rows[0].tagName === 'DIV') {
    // Check if the content is HTML-encoded list
    const firstCell = rows[0].querySelector('div');
    if (firstCell && firstCell.textContent.includes('<ul>')) {
      // Get the inner HTML which contains the encoded content
      const encodedContent = firstCell.innerHTML;

      // Create a temporary div to decode HTML entities
      const tempDiv = document.createElement('div');
      // First decode the content by setting it as innerHTML (this decodes entities like &lt; to <)
      tempDiv.innerHTML = encodedContent;

      // Get the decoded text (which now contains actual HTML tags)
      const decodedHTML = tempDiv.textContent;

      // Now parse the decoded HTML by setting it as innerHTML again
      tempDiv.innerHTML = decodedHTML;

      // Now process the list structure
      const ul = tempDiv.querySelector('ul');

      if (ul) {
        const table = document.createElement('table');
        table.classList.add('table-block-table');

        const thead = document.createElement('thead');
        const tbody = document.createElement('tbody');

        const header = !block.classList.contains('no-header');
        if (header) table.append(thead);
        table.append(tbody);

        const listItems = [...ul.children].filter((item) => item.tagName === 'LI');

        listItems.forEach((li, i) => {
          const tr = document.createElement('tr');
          const nestedList = li.querySelector('ul');

          if (nestedList) {
            const cells = [...nestedList.children];
            cells.forEach((cell) => {
              const cellElement = (header && i === 0) ? document.createElement('th') : document.createElement('td');
              if (header && i === 0) cellElement.setAttribute('scope', 'col');
              cellElement.textContent = cell.textContent.trim();
              tr.append(cellElement);
            });
          }

          if (tr.children.length > 0) {
            if (header && i === 0) {
              thead.append(tr);
            } else {
              tbody.append(tr);
            }
          }
        });

        if (thead.children.length > 0 || tbody.children.length > 0) {
          block.innerHTML = '';
          const wrapper = document.createElement('div');
          wrapper.className = 'table-content-wrapper';
          wrapper.append(table);
          block.append(wrapper);
          return;
        }
      }
    }

    // Standard EDS div structure (not encoded)
    const table = document.createElement('table');
    table.classList.add('table-block-table');

    const thead = document.createElement('thead');
    const tbody = document.createElement('tbody');

    const header = !block.classList.contains('no-header');
    if (header) table.append(thead);
    table.append(tbody);

    rows.forEach((row, i) => {
      const tr = document.createElement('tr');
      const cells = [...row.children];

      cells.forEach((cell) => {
        const cellElement = (header && i === 0) ? document.createElement('th') : document.createElement('td');
        if (header && i === 0) cellElement.setAttribute('scope', 'col');
        cellElement.innerHTML = cell.innerHTML;
        tr.append(cellElement);
      });

      if (header && i === 0) {
        thead.append(tr);
      } else {
        tbody.append(tr);
      }
    });

    block.innerHTML = '';
    const wrapper = document.createElement('div');
    wrapper.className = 'table-content-wrapper';
    wrapper.append(table);
    block.append(wrapper);
    return;
  }

  // Handle list-based table (fallback)
  const table = document.createElement('table');
  const div = document.createElement('div');
  const thead = document.createElement('thead');
  const tbody = document.createElement('tbody');

  const header = !block.classList.contains('no-header');
  if (header) table.append(thead);
  table.append(tbody);

  const liElements = getLiElements(block);
  if (liElements.length === 0) {
    // No list elements found, might be richtext content
    return;
  }

  [...liElements].forEach((child, i) => {
    const row = document.createElement('tr');
    if (i) tbody.append(row);
    else thead.append(row);

    [...getLiElements(child)].forEach((col) => {
      const cell = buildCell(header ? i : i + 1);
      if (col.innerHTML.includes('img') && col.textContent.trim()) {
        col.remove();
        const p = document.createElement('p');
        const span = document.createElement('span');
        span.append(col.textContent.trim());
        p.append(col.querySelector('img'));
        p.append(span);
        cell.append(p);
      } else if (col.innerHTML.includes('img')) {
        col.remove();
        cell.append(col.querySelector('img'));
      } else {
        cell.innerHTML = col.innerHTML;
      }
      row.append(cell);
    });
  });

  block.innerHTML = '';
  div.classList.add('table-content-wrapper');
  div.append(table);
  block.append(div);

  // Add class to table for styling
  table.classList.add('table-block-table');
}
