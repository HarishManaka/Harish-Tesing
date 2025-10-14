function parseMarkdownTable(text) {
  const lines = text.trim().split('\n').map((line) => line.trim());

  if (lines.length < 2) {
    return null;
  }

  const tableData = [];
  let hasHeader = false;

  // Check if second line is a separator (markdown table format)
  const separatorRegex = /^\s*\|?[\s\-:|]+\|?\s*$/;
  if (separatorRegex.test(lines[1])) {
    hasHeader = true;
    // Parse alignment from separator
    const alignments = lines[1].split('|')
      .map((cell) => cell.trim())
      .filter((cell) => cell.length > 0)
      .map((cell) => {
        if (cell.startsWith(':') && cell.endsWith(':')) return 'center';
        if (cell.endsWith(':')) return 'right';
        return 'left';
      });

    // Parse header row
    const headerCells = lines[0].split('|')
      .map((cell) => cell.trim())
      .filter((cell) => cell.length > 0);

    tableData.push({
      cells: headerCells,
      alignments,
      isHeader: true,
    });

    // Parse data rows (skip separator line)
    for (let i = 2; i < lines.length; i += 1) {
      const cells = lines[i].split('|')
        .map((cell) => cell.trim())
        .filter((cell) => cell.length > 0);

      if (cells.length > 0) {
        tableData.push({
          cells,
          alignments,
          isHeader: false,
        });
      }
    }
  } else {
    // Simple table without header separator
    lines.forEach((line, i) => {
      const cells = line.split('|')
        .map((cell) => cell.trim())
        .filter((cell) => cell.length > 0);

      if (cells.length > 0) {
        tableData.push({
          cells,
          alignments: [],
          isHeader: i === 0 && hasHeader,
        });
      }
    });
  }

  return tableData.length > 0 ? tableData : null;
}

function isMarkdownTable(text) {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return false;

  // Check if second line looks like a separator (this is required for markdown tables)
  const hasSeparator = lines.length > 1 && /^\s*\|?[\s\-:|]+\|?\s*$/.test(lines[1]);

  if (hasSeparator) {
    // If there's a separator, check that the first line also has pipes
    return lines[0].includes('|');
  }

  // For tables without separators, be more strict:
  // All lines must have pipes and at least 2 columns
  const pipelines = lines.filter((line) => line.includes('|') && line.split('|').filter((cell) => cell.trim().length > 0).length >= 2);
  return pipelines.length >= lines.length && lines.length >= 2;
}

function createTableFromMarkdown(markdownText) {
  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const tbody = document.createElement('tbody');

  const markdownData = parseMarkdownTable(markdownText);

  if (markdownData) {
    markdownData.forEach((row) => {
      const tableRow = document.createElement('tr');

      row.cells.forEach((cellText, cellIndex) => {
        const tableCell = document.createElement(row.isHeader ? 'th' : 'td');
        tableCell.textContent = cellText;

        // Apply alignment if specified
        const alignment = row.alignments[cellIndex];
        if (alignment) {
          tableCell.style.textAlign = alignment;
        }

        tableRow.appendChild(tableCell);
      });

      if (row.isHeader) {
        thead.appendChild(tableRow);
      } else {
        tbody.appendChild(tableRow);
      }
    });

    if (thead.children.length > 0) {
      table.appendChild(thead);
    }
    if (tbody.children.length > 0) {
      table.appendChild(tbody);
    }
  }

  return table;
}

export default function decorate(block) {
  // Handle Universal Editor structure
  const tableIntroElement = block.querySelector('[data-aue-prop="tableIntro"]');
  const tableContentElement = block.querySelector('[data-aue-prop="tableContent"]');
  const tableOutroElement = block.querySelector('[data-aue-prop="tableOutro"]');
  const variantElement = block.querySelector('[data-aue-prop="variant"]');
  const stylesElement = block.querySelector('[data-aue-prop="styles"]');

  let introContent = '';
  let tableMarkdown = '';
  let outroContent = '';
  let variant = 'default';
  let styles = '';

  if (tableIntroElement || tableContentElement || tableOutroElement) {
    // Universal Editor property-based structure
    if (tableIntroElement) introContent = tableIntroElement.innerHTML || '';
    if (tableContentElement) tableMarkdown = tableContentElement.textContent || '';
    if (tableOutroElement) outroContent = tableOutroElement.innerHTML || '';
    if (variantElement) variant = variantElement.textContent.trim() || 'default';
    if (stylesElement) styles = stylesElement.textContent.trim();
  } else {
    // Fallback to row/cell structure
    const rows = block.querySelectorAll(':scope > div');
    if (rows.length > 0) {
      const cells = rows[0].querySelectorAll('div');
      if (cells.length > 0) introContent = cells[0].innerHTML || '';
      if (cells.length > 1) tableMarkdown = cells[1].textContent || '';
      if (cells.length > 2) outroContent = cells[2].innerHTML || '';
      if (cells.length > 3) variant = cells[3].textContent.trim() || 'default';
      if (cells.length > 4) styles = cells[4].textContent.trim();
    }
  }

  if (!introContent && !tableMarkdown && !outroContent) return;

  // Create the processed content container
  const processedContent = document.createElement('div');
  processedContent.className = `annotated-table-content ${variant}`;

  // Add intro content if it exists
  if (introContent.trim()) {
    const introDiv = document.createElement('div');
    introDiv.innerHTML = introContent;
    Array.from(introDiv.childNodes).forEach((node) => {
      processedContent.appendChild(node.cloneNode(true));
    });
  }

  // Process the table markdown if it exists
  if (tableMarkdown.trim() && isMarkdownTable(tableMarkdown)) {
    const table = createTableFromMarkdown(tableMarkdown);
    processedContent.appendChild(table);
  }

  // Add outro content if it exists
  if (outroContent.trim()) {
    const outroDiv = document.createElement('div');
    outroDiv.innerHTML = outroContent;
    Array.from(outroDiv.childNodes).forEach((node) => {
      processedContent.appendChild(node.cloneNode(true));
    });
  }

  // Replace block content with processed content
  block.innerHTML = '';
  block.appendChild(processedContent);

  // Apply custom styles if provided
  if (styles) {
    applyCustomStyles(styles);
  }
}

// Helper function to apply custom styles
function applyCustomStyles(styleString) {
  const styleId = `annotated-table-styles-${Date.now()}`;

  // Remove existing styles for this block if they exist
  const existingStyle = document.getElementById(styleId);
  if (existingStyle) {
    existingStyle.remove();
  }

  // Apply the styles as CSS
  const styleElement = document.createElement('style');
  styleElement.id = styleId;

  const css = `
/* User styles for annotated-table block */
${styleString}
`;

  styleElement.textContent = css;
  document.head.appendChild(styleElement);
}
