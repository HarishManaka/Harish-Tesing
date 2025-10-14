export default async function decorate(block) {
  // Get the data file path from the block configuration
  const data = [...block.children].map((row) => [...row.children]
    .map((cell) => cell.textContent.trim()));

  // Check if data is in key-value format or simple format
  let dataFile;
  let titleOverride = '';

  // If first row has 'dataFile' as key, use key-value format
  if (data[0] && data[0][0] === 'dataFile') {
    dataFile = data.find((row) => row[0] === 'dataFile')?.[1];
    titleOverride = data.find((row) => row[0] === 'tableHeading')?.[1] || '';
  } else {
    // Otherwise, assume first row is the data file path
    dataFile = data[0]?.[0];
    titleOverride = data[1]?.[0] || '';
  }

  try {
    // Fetch the JSON data
    const response = await fetch(dataFile);
    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.status}`);
    }

    let tableData = await response.json();

    // Check if this is a sheet response format and transform it
    if (tableData[':type'] === 'sheet' && tableData.data && tableData.data.length > 0) {
      // Get column names dynamically from the first row's keys
      const firstRow = tableData.data[0];
      const columnKeys = Object.keys(firstRow);

      // The first column is typically the row label (e.g., 'Item')
      const rowLabelKey = columnKeys[0];
      const valueColumns = columnKeys.slice(1);

      // Transform sheet data into expected format
      const transformedData = {
        title: titleOverride || 'THE VALUE OF MEMBERSHIP',
        columns: valueColumns.map((colName, index) => {
          const column = {
            title: colName.toUpperCase(),
            className: colName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          };

          // Add badge only to the last column
          if (index === valueColumns.length - 1) {
            column.badge = 'Best Value';
          }

          return column;
        }),
        rows: tableData.data.map((sheetRow, index) => {
          // Determine if this is a total row
          const rowLabel = sheetRow[rowLabelKey];
          const isTotal = index === tableData.data.length - 1
                       || rowLabel?.toUpperCase().includes('TOTAL')
                       || rowLabel?.toUpperCase().includes('SUMMARY');

          // Determine if row should have dropdown (can be configured via data attributes)
          const hasDropdown = rowLabel === 'SPECIALIZATION AND ADDITIONAL COURSES'
                           || rowLabel === 'SUPPORT TOOLS/EXTENSIONS';

          return {
            service: rowLabel,
            values: valueColumns.map((col) => sheetRow[col] || ''),
            isTotal,
            ...(hasDropdown && { hasDropdown: true }),
          };
        }),
      };

      // Replace tableData with transformed data
      tableData = transformedData;
    }

    // Validate table data structure
    if (!tableData || !tableData.columns || !tableData.rows) {
      console.error('Missing required properties. Found:', {
        hasColumns: !!tableData?.columns,
        hasRows: !!tableData?.rows,
        hasTitle: !!tableData?.title,
        actualKeys: tableData ? Object.keys(tableData) : 'tableData is null/undefined',
      });
      throw new Error('Invalid table data structure. Expected properties: title, columns, rows');
    }

    // Create the table structure
    const tableContainer = document.createElement('div');
    tableContainer.className = 'membership-value-table-container';

    // Create title
    const title = document.createElement('h2');
    title.className = 'membership-value-table-title';
    title.textContent = titleOverride || tableData.title;
    tableContainer.appendChild(title);

    // Create table
    const table = document.createElement('table');
    table.className = 'membership-value-table';

    // Create header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');

    // Empty cell for service names column
    const emptyHeaderCell = document.createElement('th');
    emptyHeaderCell.className = 'service-header';
    headerRow.appendChild(emptyHeaderCell);

    // Column headers
    tableData.columns.forEach((column) => {
      const th = document.createElement('th');
      th.className = `column-header ${column.className}`;

      // Add badge if specified
      if (column.badge) {
        const badge = document.createElement('span');
        badge.className = 'column-badge';
        badge.textContent = column.badge;
        th.appendChild(badge);
      }

      const titleSpan = document.createElement('span');
      titleSpan.className = 'column-title';
      titleSpan.textContent = column.title;
      th.appendChild(titleSpan);

      headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Create table body
    const tbody = document.createElement('tbody');

    tableData.rows.forEach((row) => {
      const tr = document.createElement('tr');
      tr.className = row.isTotal ? 'total-row' : 'data-row';

      // Service name cell
      const serviceCell = document.createElement('td');
      serviceCell.className = 'service-name';

      const serviceText = document.createElement('span');
      serviceText.textContent = row.service;
      serviceCell.appendChild(serviceText);

      // Add dropdown icon if specified
      /* if (row.hasDropdown) {
        const dropdown = document.createElement('span');
        dropdown.className = 'dropdown-icon';
        dropdown.innerHTML = '▼';
        serviceCell.appendChild(dropdown);
      } */

      tr.appendChild(serviceCell);

      // Value cells
      row.values.forEach((value, index) => {
        const td = document.createElement('td');
        td.className = `value-cell ${tableData.columns[index].className}`;
        td.textContent = value;
        tr.appendChild(td);
      });

      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    tableContainer.appendChild(table);

    // Replace block content
    block.textContent = '';
    block.appendChild(tableContainer);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error loading membership value table data:', error);

    // Show error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'membership-value-table-error';
    errorDiv.innerHTML = `
      <p>Unable to load membership value table data.</p>
      <p style="font-size: 0.9em; color: #666;">Error: ${error.message}</p>
      <p style="font-size: 0.9em; color: #666;">Attempted path: ${dataFile || 'No path specified'}</p>
    `;

    block.textContent = '';
    block.appendChild(errorDiv);
  }
}
