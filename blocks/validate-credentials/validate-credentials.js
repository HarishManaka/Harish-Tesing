import { fetchGraphQl } from '../../scripts/__dropins__/tools/fetch-graphql.js';

export default function decorate(block) {
  // Clear the block content
  // block.innerHTML = '';

  // Create the HTML markup
  const container = document.createElement('div');
  container.className = 'validate-credentials__container';
  block.appendChild(container);
  createValidateCredentialsMarkup(container);

  // Add event listeners after markup is created
  addEventListeners(container);
}

/**
 * Creates the HTML markup for the validate credentials component
 * @param {HTMLElement} container - The container element to append the markup to
 * @param {Object} apiData - Optional API response data to display
 */
export function createValidateCredentialsMarkup(container, _apiData = null) {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  // Note: apiData parameter reserved for future use

  const markup = `
    <h1 class="validate-credentials__title">Find NASM and AFAA Fitness Professionals</h1>

    <div class="validate-credentials__forms-container">
      <section class="validate-credentials__form-section" aria-labelledby="search-by-name-heading">
        <h2 id="search-by-name-heading" class="validate-credentials__form-title">Search By Name</h2>

        <form class="validate-credentials__form" role="search" aria-describedby="search-by-name-description">
          <div id="search-by-name-description" class="validate-credentials__form-description sr-only">
            Search for fitness professionals by entering their first and last name
          </div>

          <div class="validate-credentials__form-group">
            <label for="first-name" class="validate-credentials__label">First Name</label>
            <input
              type="text"
              id="first-name"
              name="firstName"
              class="validate-credentials__input"
              placeholder="First Name (optional)"
              autocomplete="given-name"
              aria-describedby="first-name-hint"
            >
            <div id="first-name-hint" class="validate-credentials__hint sr-only">
              Enter the professional's first name
            </div>
          </div>

          <div class="validate-credentials__form-group">
            <label for="last-name" class="validate-credentials__label">Last Name</label>
            <input
              type="text"
              id="last-name"
              name="lastName"
              class="validate-credentials__input"
              required
              autocomplete="family-name"
              aria-describedby="last-name-hint"
              placeholder="Last Name"
            >
            <div id="last-name-hint" class="validate-credentials__hint sr-only">
              Enter the professional's last name (required)
            </div>
          </div>

          <button type="submit" class="validate-credentials__submit-button" aria-describedby="name-search-button-description">
            Search <span class="validate-credentials__search-icon" aria-hidden="true"><svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M26.5002 24.875L21.4585 19.8334C21.3335 19.75 21.2085 19.6667 21.0835 19.6667H20.5418C21.8335 18.1667 22.6668 16.1667 22.6668 14C22.6668 9.25004 18.7502 5.33337 14.0002 5.33337C9.2085 5.33337 5.3335 9.25004 5.3335 14C5.3335 18.7917 9.2085 22.6667 14.0002 22.6667C16.1668 22.6667 18.1252 21.875 19.6668 20.5834V21.125C19.6668 21.25 19.7085 21.375 19.7918 21.5L24.8335 26.5417C25.0418 26.75 25.3752 26.75 25.5418 26.5417L26.5002 25.5834C26.7085 25.4167 26.7085 25.0834 26.5002 24.875ZM14.0002 20.6667C10.2918 20.6667 7.3335 17.7084 7.3335 14C7.3335 10.3334 10.2918 7.33337 14.0002 7.33337C17.6668 7.33337 20.6668 10.3334 20.6668 14C20.6668 17.7084 17.6668 20.6667 14.0002 20.6667Z" fill="#123257"></path>
                  </svg></span>
          </button>
          <span id="name-search-button-description" class="sr-only">
            Search for fitness professionals by name
          </span>
        </form>
      </section>

      <section class="validate-credentials__form-section" aria-labelledby="search-by-certificate-heading">
        <h2 id="search-by-certificate-heading" class="validate-credentials__form-title">Search By Certificate ID</h2>

        <form class="validate-credentials__form" role="search" aria-describedby="search-by-certificate-description">
          <div id="search-by-certificate-description" class="validate-credentials__form-description sr-only">
            Search for fitness professionals by entering their certificate ID number
          </div>

          <div class="validate-credentials__form-group">
            <label for="certificate-id" class="validate-credentials__label sr-only">Certificate ID</label>
            <input
              type="text"
              id="certificate-id"
              name="certificateId"
              class="validate-credentials__input"
              required
              aria-describedby="certificate-id-hint"
            >
            <div id="certificate-id-hint" class="validate-credentials__hint sr-only">
              Enter the professional's certificate identification number
            </div>
          </div>

          <button type="submit" class="validate-credentials__submit-button" aria-describedby="certificate-search-button-description">
            Search <span class="validate-credentials__search-icon" aria-hidden="true"><svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M26.5002 24.875L21.4585 19.8334C21.3335 19.75 21.2085 19.6667 21.0835 19.6667H20.5418C21.8335 18.1667 22.6668 16.1667 22.6668 14C22.6668 9.25004 18.7502 5.33337 14.0002 5.33337C9.2085 5.33337 5.3335 9.25004 5.3335 14C5.3335 18.7917 9.2085 22.6667 14.0002 22.6667C16.1668 22.6667 18.1252 21.875 19.6668 20.5834V21.125C19.6668 21.25 19.7085 21.375 19.7918 21.5L24.8335 26.5417C25.0418 26.75 25.3752 26.75 25.5418 26.5417L26.5002 25.5834C26.7085 25.4167 26.7085 25.0834 26.5002 24.875ZM14.0002 20.6667C10.2918 20.6667 7.3335 17.7084 7.3335 14C7.3335 10.3334 10.2918 7.33337 14.0002 7.33337C17.6668 7.33337 20.6668 10.3334 20.6668 14C20.6668 17.7084 17.6668 20.6667 14.0002 20.6667Z" fill="#123257"></path>
                  </svg></span>
          </button>
          <span id="certificate-search-button-description" class="sr-only">
            Search for fitness professionals by certificate ID
          </span>
        </form>
      </section>
    </div>

    <div class="validate-credentials__current-date" role="status" aria-live="polite">
      <strong>Current as of:</strong> ${currentDate}
    </div>

    <div class="validate-credentials__json-display">
      <div class="validate-credentials__json-content"></div>
    </div>
  `;

  container.setHTMLUnsafe(markup);
}

/**
 * Adds event listeners to the forms
 * @param {HTMLElement} container - The container element containing the forms
 */
function addEventListeners(container) {
  const nameForm = container.querySelector('form[aria-describedby="search-by-name-description"]');
  const certificateForm = container.querySelector('form[aria-describedby="search-by-certificate-description"]');

  if (nameForm) {
    nameForm.addEventListener('submit', handleNameFormSubmit);
  }

  if (certificateForm) {
    certificateForm.addEventListener('submit', handleCertificateFormSubmit);
  }
}

/**
 * Makes a GraphQL API call to validate credentials by name
 * @param {string} firstName - The person's first name
 * @param {string} lastName - The person's last name
 * @returns {Promise<Object>} The parsed GraphQL response
 */
async function validateByNameGraphQL(firstName, lastName) {
  const query = `
    query ValidateByName($firstName: String!, $lastName: String!) {
      validateByName(firstName: $firstName, lastName: $lastName) {
        data {
          certName
          certNumber
          country
          expirationDate
          firstName
          lastName
          state
          status
        }
      }
    }
  `;

  const variables = {
    firstName,
    lastName,
  };

  const response = await fetchGraphQl(query, { variables, method: 'GET' });

  return response.data.validateByName;
}

/**
 * Makes a GraphQL API call to validate credentials by certificate number
 * @param {string} certNumber - The certificate number
 * @returns {Promise<Object>} The parsed GraphQL response
 */
async function validateByCertGraphQL(certNumber) {
  const query = `
    query ValidateByCert($certNumber: String!) {
      validateByCert(certNumber: $certNumber) {
        data {
          certName
          certNumber
          country
          expirationDate
          firstName
          lastName
          state
          status
        }
      }
    }
  `;

  const variables = {
    certNumber,
  };

  const response = await fetchGraphQl(query, { variables, method: 'GET' });

  return response.data.validateByCert;
}

// Form submission handlers with GraphQL calls
async function handleNameFormSubmit(event) {
  event.preventDefault();
  const formData = new FormData(event.target);
  const firstName = formData.get('firstName');
  const lastName = formData.get('lastName');

  // Show loading state
  const submitButton = event.target.querySelector('button[type="submit"]');
  const originalText = submitButton.innerHTML;
  submitButton.innerHTML = 'Searching...';
  submitButton.disabled = true;

  try {
    const data = await validateByNameGraphQL(firstName, lastName);

    // Update JSON display with GraphQL response
    updateJsonDisplay(data);
  } catch (error) {
    // Log error
    if (window.LOG_LEVEL === 'info' || window.LOG_LEVEL === 'debug') {
      console.error('ERROR: GraphQL call failed - validateByName:', error);
    }
  } finally {
    // Reset button state
    submitButton.innerHTML = originalText;
    submitButton.disabled = false;
  }
}

async function handleCertificateFormSubmit(event) {
  event.preventDefault();
  const formData = new FormData(event.target);
  const certificateId = formData.get('certificateId');

  // Show loading state
  const submitButton = event.target.querySelector('button[type="submit"]');
  const originalText = submitButton.innerHTML;
  submitButton.innerHTML = 'Searching...';
  submitButton.disabled = true;

  try {
    const data = await validateByCertGraphQL(certificateId);

    // Update JSON display with GraphQL response
    updateJsonDisplay(data);
  } catch (error) {
    // Log error
    if (window.LOG_LEVEL === 'info' || window.LOG_LEVEL === 'debug') {
      console.error('ERROR: GraphQL call failed - validateByCert:', error);
    }
  } finally {
    // Reset button state
    submitButton.innerHTML = originalText;
    submitButton.disabled = false;
  }
}

/**
 * Updates the JSON display section with API response data as a sortable table
 * @param {Object} apiData - The API response data to display
 */
function updateJsonDisplay(apiData) {
  const jsonDisplay = document.querySelector('.validate-credentials__json-content');
  if (!jsonDisplay) return;

  // Clear existing content
  jsonDisplay.innerHTML = '';

  // Check if there's data to display
  if (!apiData || !apiData.data || apiData.data.length === 0) {
    jsonDisplay.innerHTML = '<p>No data available</p>';
    return;
  }

  // Create table container
  const tableContainer = document.createElement('div');
  tableContainer.className = 'validate-credentials__table-container';

  // Create table
  const table = document.createElement('table');
  table.className = 'validate-credentials__table';

  // Create thead
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');

  // Define columns to match the existing implementation exactly
  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'certName', label: 'Certificate Name' },
    { key: 'certNumber', label: 'Certificate ID' },
    { key: 'expirationDate', label: 'Expire date' },
    { key: 'state', label: 'State' },
    { key: 'status', label: 'Status' },
  ];

  // Create header cells with sorting functionality
  columns.forEach((column) => {
    const th = document.createElement('th');
    th.className = 'sortable';
    th.dataset.column = column.key;
    th.innerHTML = `
      <button type="button" class="sort-button" aria-label="Sort by ${column.label}">
        <span>${column.label}</span>
        <span class="sort-indicator" aria-hidden="true"></span>
      </button>
    `;
    headerRow.appendChild(th);
  });

  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Create tbody
  const tbody = document.createElement('tbody');
  tbody.className = 'table-body';

  // Function to format date to MM/DD/YYYY
  function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return dateString;
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  }

  // Function to render table rows
  function renderTableRows(data) {
    tbody.innerHTML = '';
    data.forEach((item) => {
      const row = document.createElement('tr');
      columns.forEach((column) => {
        const td = document.createElement('td');

        // Special handling for different columns
        if (column.key === 'name') {
          // Combine firstName and lastName
          const firstName = item.firstName || '';
          const lastName = item.lastName || '';
          td.textContent = `${firstName} ${lastName}`.trim() || '-';
        } else if (column.key === 'expirationDate') {
          // Format date as MM/DD/YYYY
          td.textContent = formatDate(item.expirationDate) || '\u00A0'; // nbsp for empty
        } else if (column.key === 'state') {
          // Use nbsp for empty state values
          td.textContent = item[column.key] || '\u00A0';
        } else {
          td.textContent = item[column.key] || '-';
        }

        // Center align Certificate ID column (3rd column, index 2)
        if (column.key === 'certNumber') {
          td.style.textAlign = 'center';
        }

        row.appendChild(td);
      });
      tbody.appendChild(row);
    });
  }

  // Initial render with original data
  renderTableRows(apiData.data);
  table.appendChild(tbody);

  // Add sorting functionality
  let currentSortColumn = null;
  let currentSortDirection = null;

  headerRow.addEventListener('click', (event) => {
    const button = event.target.closest('.sort-button');
    if (!button) return;

    const th = button.closest('th');
    const { column } = th.dataset;

    // Determine sort direction
    let sortDirection = 'asc';
    if (currentSortColumn === column) {
      sortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
    }

    // Update sort state
    currentSortColumn = column;
    currentSortDirection = sortDirection;

    // Update visual indicators
    document.querySelectorAll('.validate-credentials__table th').forEach((header) => {
      header.classList.remove('sort-asc', 'sort-desc');
    });
    th.classList.add(sortDirection === 'asc' ? 'sort-asc' : 'sort-desc');

    // Sort data
    const sortedData = [...apiData.data].sort((a, b) => {
      let aValue;
      let bValue;

      // Special handling for name column (combine firstName and lastName)
      if (column === 'name') {
        aValue = `${a.firstName || ''} ${a.lastName || ''}`.trim();
        bValue = `${b.firstName || ''} ${b.lastName || ''}`.trim();
      } else {
        aValue = a[column] || '';
        bValue = b[column] || '';
      }

      // Handle numeric sorting for certificate numbers
      if (column === 'certNumber') {
        const aNum = parseInt(aValue, 10);
        const bNum = parseInt(bValue, 10);
        if (!Number.isNaN(aNum) && !Number.isNaN(bNum)) {
          return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
        }
      }

      // Handle date sorting
      if (column === 'expirationDate') {
        const aDate = new Date(aValue);
        const bDate = new Date(bValue);
        if (!Number.isNaN(aDate.getTime()) && !Number.isNaN(bDate.getTime())) {
          return sortDirection === 'asc' ? aDate - bDate : bDate - aDate;
        }
      }

      // String sorting (case-insensitive)
      const compareResult = aValue.toString().toLowerCase()
        .localeCompare(bValue.toString().toLowerCase());
      return sortDirection === 'asc' ? compareResult : -compareResult;
    });

    // Re-render table with sorted data
    renderTableRows(sortedData);
  });

  // Add table to container and display
  tableContainer.appendChild(table);
  jsonDisplay.appendChild(tableContainer);
}
