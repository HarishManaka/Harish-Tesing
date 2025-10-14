/* global am5, am5map, am5geodata_usaLow, am5themes_Animated */
import { loadScript } from '../../scripts/aem.js';

export default async function decorate(block) {
  // Load AmCharts dependencies
  await loadScript('https://cdn.amcharts.com/lib/5/index.js');
  await loadScript('https://cdn.amcharts.com/lib/5/map.js');
  await loadScript('https://cdn.amcharts.com/lib/5/geodata/usaLow.js');
  await loadScript('https://cdn.amcharts.com/lib/5/themes/Animated.js');

  // Extract configuration from block
  const config = {};

  // The fields come in a specific order based on the model definition
  const fieldOrder = [
    'title',
    'searchPlaceholder',
    'instructionHeading',
    'instructionLabel',
    'shareStoryLabel',
    'shareStoryLink',
    'dataSource',
  ];

  const rows = [...block.children];

  // Extract values from each row based on position
  rows.forEach((row, index) => {
    if (index < fieldOrder.length) {
      const fieldName = fieldOrder[index];

      // Try different selectors to find the content
      let value = '';

      // Check for text in paragraphs
      const paragraph = row.querySelector('p');
      if (paragraph && !paragraph.classList.contains('button-container')) {
        value = paragraph.textContent.trim();
      }

      // Check for links (especially for dataSource and shareStoryLink)
      const link = row.querySelector('a');
      if (link && (fieldName === 'dataSource' || fieldName === 'shareStoryLink')) {
        value = link.getAttribute('href');
      }

      // If no specific element found and no value yet, try getting all text content
      if (!value && !link) {
        const text = row.textContent.trim();
        if (text) {
          value = text;
        }
      }

      if (value) {
        config[fieldName] = value;
      }
    }
  });

  // console.log('Extracted config:', config);

  // Create the block structure
  const container = document.createElement('div');
  container.className = 'salary-map-container';

  // Create header with search and view controls
  const header = document.createElement('div');
  header.className = 'salary-map-header';

  // Create search section
  const searchSection = document.createElement('div');
  searchSection.className = 'salary-map-search';
  searchSection.innerHTML = `
    <h2>${config.title || 'NASM PROS ACROSS THE USA'}</h2>
    <div class="view-mode-toggle">
      <button type="button" id="salary-mode-btn" class="mode-btn active" aria-pressed="true">
        Salary Statistics
      </button>
      <button type="button" id="profile-mode-btn" class="mode-btn" aria-pressed="false">
        Trainer Profiles
      </button>
    </div>
    <div class="state-search-container">
      <input type="text" 
             id="state-search-input" 
             placeholder="${config.searchPlaceholder || 'Search By State'}" 
             aria-label="${config.searchPlaceholder || 'Search By State'}" 
             autocomplete="off" />
      <ul id="state-suggestions" 
          role="listbox" 
          aria-label="State suggestions"
          class="state-suggestions"></ul>
      <button type="button" 
              aria-label="Search" 
              id="search-button"
              class="search-button">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.35-4.35"></path>
        </svg>
      </button>
    </div>
  `;

  header.appendChild(searchSection);
  container.appendChild(header);

  // Create content area
  const content = document.createElement('div');
  content.className = 'salary-map-content';

  // Create description area
  const description = document.createElement('div');
  description.className = 'salary-map-description';
  description.innerHTML = `
    <div class="map-instruction" id="default-instruction">
      <h3>${config.instructionHeading || 'CLICK ON A STATE TO VIEW SALARY DATA'}</h3>
      <p>${config.instructionLabel || 'Explore NASM certification salary statistics across the United States. Click on any state to see detailed compensation information and career growth data.'}</p>
    </div>
  `;

  // Create visualization container
  const visualization = document.createElement('div');
  visualization.className = 'salary-map-visualization';
  visualization.innerHTML = `
    <div id="map-view" class="view-content active">
      <div id="am-map-container" style="width: 100%; height: 500px;"></div>
      <div class="map-zoom-controls">
        <button class="zoom-in" aria-label="Zoom in">+</button>
        <button class="zoom-out" aria-label="Zoom out">-</button>
      </div>
    </div>
  `;

  content.appendChild(description);
  content.appendChild(visualization);
  container.appendChild(content);

  // Clear the block and add our container
  block.textContent = '';
  block.appendChild(container);

  // Fetch state data
  try {
    const dataSource = config.dataSource || '/salary-map-data.json';
    // console.log('Fetching data from:', dataSource);

    const response = await fetch(dataSource);
    // console.log('Response status:', response.status);
    // console.log('Response headers:', response.headers.get('content-type'));

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseText = await response.text();
    // console.log('Response text length:', responseText.length);
    // console.log('First 200 chars:', responseText.substring(0, 200));

    let jsonResponse;
    try {
      jsonResponse = JSON.parse(responseText);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      // console.log('Full response text:', responseText);
      throw parseError;
    }

    // Handle both old format (direct array) and new AEM format (wrapped object)
    const rawData = jsonResponse.data || jsonResponse;
    // console.log('Processed data length:', rawData.length);

    const stateData = processStateData(rawData);
    // console.log('Final state data:', stateData.length, 'states');

    // Initialize the map after DOM is ready
    setTimeout(() => {
      initializeMap(stateData);
      initializeSearch(stateData);
      initializeModeToggle(config);
    }, 100);
  } catch (error) {
    console.error('Error loading state data:', error);
    visualization.innerHTML = '<p class="error-message">Unable to load map data. Please try again later.</p>';
  }
}

// Process and normalize state data from AEM format
function processStateData(rawData) {
  const stateMap = new Map();

  // Group data by state and collect community profiles
  rawData.forEach((row) => {
    const stateName = row.state;

    if (!stateMap.has(stateName)) {
      // Create state entry with converted numeric values
      stateMap.set(stateName, {
        state: row.state,
        stateCode: row.stateCode,
        id: row.id,
        value: parseInt(row.value, 10),
        minWage: parseInt(row.minWage, 10),
        avgSalary: parseInt(row.avgSalary, 10),
        avgSalaryHourly: row.avgSalaryHourly,
        medianSalary: row.medianSalary,
        leftTitle: row.leftTitle,
        leftDescription: row.leftDescription,
        rightTitle: row.rightTitle.replace('[SVG_ICON]', ''),
        rightDescription: row.rightDescription,
        detailsTitle: row.detailsTitle,
        detailsDescription: row.detailsDescription,
        communityProfiles: [],
      });
    }

    // Add community profile if it exists
    if (row.communityProfileName) {
      const profile = {
        communityProfileState: row.communityProfileState,
        communityProfileCity: row.communityProfileCity,
        communityProfileImg: row.communityProfileImg,
        communityProfileName: row.communityProfileName,
        communityProfileSubtitle: row.communityProfileSubtitle,
        communityProfileSocials: row.communityProfileSocials
          ? row.communityProfileSocials.split('|').filter((url) => url.trim())
          : [],
        communityProfileBio: row.communityProfileBio,
      };

      stateMap.get(stateName).communityProfiles.push(profile);
    }
  });

  return Array.from(stateMap.values());
}

// Initialize the AmCharts map
function initializeMap(stateData) {
  // Check if AmCharts is loaded
  if (typeof am5 === 'undefined') {
    console.error('AmCharts not loaded');
    return;
  }

  // Add license if needed
  // am5.addLicense("AM5C439335662");

  const root = am5.Root.new('am-map-container');

  // Remove amCharts logo
  root._logo.dispose(); // eslint-disable-line no-underscore-dangle

  // Set themes
  root.setThemes([
    am5themes_Animated.new(root), // eslint-disable-line camelcase
  ]);

  // Create the map chart
  const chart = root.container.children.push(am5map.MapChart.new(root, {
    projection: am5map.geoAlbersUsa(),
    panX: 'translateX',
    panY: 'translateY',
    maxZoomLevel: 5,
    minZoomLevel: 1,
  }));

  // Create polygon series for states
  const polygonSeries = chart.series.push(am5map.MapPolygonSeries.new(root, {
    geoJSON: am5geodata_usaLow, // eslint-disable-line camelcase
    valueField: 'value',
    calculateAggregates: true,
  }));

  // Configure the heat rules for coloring states
  polygonSeries.set('heatRules', [{
    target: polygonSeries.mapPolygons.template,
    dataField: 'value',
    min: am5.color('#6FA1DC'),
    max: am5.color('#2C5F8F'),
    key: 'fill',
  }]);

  // Configure polygon template
  polygonSeries.mapPolygons.template.setAll({
    tooltipText: '{name}: $${avgSalaryHourly}/hour', // eslint-disable-line no-template-curly-in-string
    interactive: true,
    stroke: am5.color(0xffffff),
    strokeWidth: 1,
    strokeOpacity: 0.5,
    fillOpacity: 0.8,
    role: 'button',
    ariaLabel: '{name}: $${avgSalaryHourly}/hour', // eslint-disable-line no-template-curly-in-string
    cursorOverStyle: 'pointer',
  });

  // Configure hover state
  polygonSeries.mapPolygons.template.states.create('hover', {
    fillOpacity: 1,
    stroke: am5.color('#E9F250'),
    strokeWidth: 2,
  });

  // Configure active/selected state
  polygonSeries.mapPolygons.template.states.create('active', {
    fill: am5.color('#123257'),
    stroke: am5.color('#E9F250'),
    strokeWidth: 3,
  });

  // Handle polygon click
  polygonSeries.mapPolygons.template.events.on('click', (ev) => {
    const { dataItem } = ev.target;
    const stateInfo = dataItem.dataContext;

    // Toggle active state
    if (ev.target.get('active')) {
      ev.target.set('active', false);
    } else {
      // Deselect all other polygons
      polygonSeries.mapPolygons.each((polygon) => {
        polygon.set('active', false);
      });
      ev.target.set('active', true);
    }

    // Update the description with state information
    updateStateDescription(stateInfo);
  });

  // Set data
  polygonSeries.data.setAll(stateData);

  // Make stuff animate on load
  chart.appear(1000, 100);

  // Handle zoom controls
  const zoomInButton = document.querySelector('.zoom-in');
  const zoomOutButton = document.querySelector('.zoom-out');

  if (zoomInButton) {
    zoomInButton.addEventListener('click', () => {
      chart.zoomIn();
    });
  }

  if (zoomOutButton) {
    zoomOutButton.addEventListener('click', () => {
      chart.zoomOut();
    });
  }

  // Store references for search functionality
  window.salaryMapChart = chart;
  window.salaryMapPolygonSeries = polygonSeries;
}

// Initialize search functionality
function initializeSearch(stateData) {
  const searchInput = document.getElementById('state-search-input');
  const suggestionsList = document.getElementById('state-suggestions');
  const searchButton = document.getElementById('search-button');

  let currentFocus = -1;

  // Handle input changes
  searchInput.addEventListener('input', function handleInput() {
    const query = this.value.toLowerCase().trim();
    suggestionsList.innerHTML = '';
    currentFocus = -1;

    if (query.length === 0) {
      suggestionsList.classList.remove('visible');
      return;
    }

    // Filter states
    const filteredStates = stateData
      .filter((state) => state.state.toLowerCase().startsWith(query))
      .slice(0, 6);

    if (filteredStates.length === 0) {
      suggestionsList.classList.remove('visible');
      return;
    }

    // Display suggestions
    filteredStates.forEach((state, index) => {
      const li = document.createElement('li');
      li.textContent = state.state;
      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', 'false');
      li.setAttribute('data-index', index);

      li.addEventListener('click', () => {
        selectState(state.state, stateData);
        searchInput.value = state.state;
        suggestionsList.innerHTML = '';
        suggestionsList.classList.remove('visible');
      });

      suggestionsList.appendChild(li);
    });

    suggestionsList.classList.add('visible');
  });

  // Handle keyboard navigation
  searchInput.addEventListener('keydown', (e) => {
    const items = suggestionsList.getElementsByTagName('li');

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      currentFocus += 1;
      if (currentFocus >= items.length) currentFocus = 0;
      addActive(items);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      currentFocus -= 1;
      if (currentFocus < 0) currentFocus = items.length - 1;
      addActive(items);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (currentFocus > -1 && items[currentFocus]) {
        items[currentFocus].click();
      } else {
        // Try to find exact match
        const enteredState = searchInput.value;
        const matchedState = stateData.find(
          (state) => state.state.toLowerCase() === enteredState.toLowerCase(),
        );
        if (matchedState) {
          selectState(matchedState.state, stateData);
        }
      }
    } else if (e.key === 'Escape') {
      suggestionsList.innerHTML = '';
      suggestionsList.classList.remove('visible');
      searchInput.blur();
    }
  });

  // Search button click
  searchButton.addEventListener('click', () => {
    const enteredState = searchInput.value;
    const matchedState = stateData.find(
      (state) => state.state.toLowerCase() === enteredState.toLowerCase(),
    );
    if (matchedState) {
      selectState(matchedState.state, stateData);
    }
  });

  // Close suggestions on outside click
  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !suggestionsList.contains(e.target)) {
      suggestionsList.innerHTML = '';
      suggestionsList.classList.remove('visible');
    }
  });

  // Helper function to highlight active suggestion
  function addActive(items) {
    if (!items) return;
    removeActive(items);
    if (currentFocus >= 0 && currentFocus < items.length) {
      items[currentFocus].classList.add('active');
      items[currentFocus].setAttribute('aria-selected', 'true');
    }
  }

  function removeActive(items) {
    for (let i = 0; i < items.length; i += 1) {
      items[i].classList.remove('active');
      items[i].setAttribute('aria-selected', 'false');
    }
  }
}

// Select a state on the map
function selectState(stateName, stateData) {
  if (!window.salaryMapPolygonSeries) return;

  const polygonSeries = window.salaryMapPolygonSeries;
  const stateInfo = stateData.find((s) => s.state === stateName);

  if (!stateInfo) return;

  // Find and select the polygon
  polygonSeries.mapPolygons.each((polygon) => {
    const data = polygon.dataItem.dataContext;
    if (data.state === stateName) {
      // Deselect all others
      polygonSeries.mapPolygons.each((p) => {
        p.set('active', false);
      });
      // Select this one
      polygon.set('active', true);

      // Update description
      updateStateDescription(stateInfo);

      // Zoom to state
      if (window.salaryMapChart) {
        window.salaryMapChart.zoomToDataItem(polygon.dataItem);
      }
    }
  });
}

// Global variables for mode and profile management
let currentMode = 'salary'; // 'salary' or 'profile'
let currentProfileIndex = 0;
let currentStateInfo = null;

// Initialize mode toggle functionality
function initializeModeToggle(config) {
  const salaryModeBtn = document.getElementById('salary-mode-btn');
  const profileModeBtn = document.getElementById('profile-mode-btn');

  if (!salaryModeBtn || !profileModeBtn) return;

  salaryModeBtn.addEventListener('click', () => {
    switchMode('salary', config);
  });

  profileModeBtn.addEventListener('click', () => {
    switchMode('profile', config);
  });
}

// Switch between salary and profile modes
function switchMode(mode, config = {}) {
  const salaryModeBtn = document.getElementById('salary-mode-btn');
  const profileModeBtn = document.getElementById('profile-mode-btn');
  const defaultInstruction = document.getElementById('default-instruction');

  currentMode = mode;

  // Update button states
  if (mode === 'salary') {
    salaryModeBtn.classList.add('active');
    salaryModeBtn.setAttribute('aria-pressed', 'true');
    profileModeBtn.classList.remove('active');
    profileModeBtn.setAttribute('aria-pressed', 'false');

    // Update default instruction
    defaultInstruction.innerHTML = `
      <h3>${config.instructionHeading || 'CLICK ON A STATE TO VIEW SALARY DATA'}</h3>
      <p>${config.instructionLabel || 'Explore NASM certification salary statistics across the United States. Click on any state to see detailed compensation information and career growth data.'}</p>
    `;
  } else {
    profileModeBtn.classList.add('active');
    profileModeBtn.setAttribute('aria-pressed', 'true');
    salaryModeBtn.classList.remove('active');
    salaryModeBtn.setAttribute('aria-pressed', 'false');

    // Update default instruction
    defaultInstruction.innerHTML = `
      <h3>HOVER OVER STATE TO SEE NASM PROS</h3>
      <p>Are you an NASM-certified professional with a story to tell? Share your journey and join the "NASM in Action" community. Together, we can inspire the next generation of fitness and wellness leaders.</p>
      <a href="${config.shareStoryLink || 'https://forms.gle/BfaTzMKPs9MFeZhDA'}" class="share-story-link">${config.shareStoryLabel || 'Share your story'}</a>
    `;
  }

  // Reset current state if one is selected
  if (currentStateInfo) {
    if (mode === 'salary') {
      updateSalaryDescription(currentStateInfo);
    } else {
      updateProfileDescription(currentStateInfo);
    }
  }
}

// Update state description based on current mode
function updateStateDescription(stateInfo) {
  currentStateInfo = stateInfo;
  currentProfileIndex = 0;

  if (currentMode === 'salary') {
    updateSalaryDescription(stateInfo);
  } else {
    updateProfileDescription(stateInfo);
  }
}

// Update salary description (original functionality)
function updateSalaryDescription(stateInfo) {
  const descriptionEl = document.querySelector('.salary-map-description');
  if (!descriptionEl) return;

  const html = `
    <div class="state-detail">
      <h3 class="state-name">${stateInfo.state.toUpperCase()}</h3>
      
      <div class="salary-highlight">
        <div class="salary-amount">$${stateInfo.avgSalaryHourly}/hour</div>
        <div class="salary-label">Median Salary</div>
      </div>
      
      <div class="state-stats">
        <div class="stat-item">
          <div class="stat-value">${stateInfo.leftTitle}</div>
          <div class="stat-description">${stateInfo.leftDescription}</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">
            ${stateInfo.rightTitle}
            ${stateInfo.rightTitle.includes('TRENDING') ? '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="#E9F250" d="M384 160c-17.7 0-32-14.3-32-32s14.3-32 32-32l160 0c17.7 0 32 14.3 32 32l0 160c0 17.7-14.3 32-32 32s-32-14.3-32-32l0-82.7L342.6 374.6c-12.5 12.5-32.8 12.5-45.3 0L192 269.3 54.6 406.6c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3l160-160c12.5-12.5 32.8-12.5 45.3 0L320 306.7 466.7 160 384 160z"/></svg>' : ''}
          </div>
          <div class="stat-description">${stateInfo.rightDescription}</div>
        </div>
      </div>
      
      <div class="success-section">
        <h4>${stateInfo.detailsTitle || 'Success by the Numbers'}</h4>
        <p>${stateInfo.detailsDescription || 'NASM certification opens doors: 74% of those certified find employment within 3 months—88% rate NASM as their top choice for fitness certification. Join the 86% of personal trainers who are very likely to recommend NASM. Elevate your career with industry-leading education.'}</p>
      </div>
      
      <a href="#" class="get-started-btn">Get Started Now</a>
    </div>
  `;

  descriptionEl.innerHTML = html;
}

// Update profile description (new functionality)
function updateProfileDescription(stateInfo) {
  const descriptionEl = document.querySelector('.salary-map-description');
  if (!descriptionEl) return;

  const profiles = stateInfo.communityProfiles || [];

  if (profiles.length === 0) {
    updateNoProfileDescription(stateInfo);
  } else if (profiles.length === 1) {
    updateSingleProfileDescription(stateInfo);
  } else {
    updateMultipleProfileDescription(stateInfo);
  }
}

// Social media icons
const socialIcons = {
  instagram: `<svg width="17" height="16" viewBox="0 0 17 16" fill="#F5F5F5" xmlns="http://www.w3.org/2000/svg">
    <g clip-path="url(#clip0_9607_143)">
      <path d="M3.84932 15.9575H12.352C14.3789 15.9575 16.0255 14.3082 16.0255 12.284L16.0247 3.71799C16.0247 1.69108 14.3754 0.0444336 12.3511 0.0444336H3.84934C1.82243 0.0444336 0.175781 1.69375 0.175781 3.71799V12.2849C0.175781 14.3092 1.82507 15.9575 3.84932 15.9575ZM1.50909 3.71799C1.50909 2.42719 2.55772 1.37777 3.84932 1.37777H12.352C13.6428 1.37777 14.6922 2.42639 14.6922 3.71799V12.2849C14.6922 13.5757 13.6436 14.6251 12.352 14.6251L3.84932 14.6242C2.55852 14.6242 1.50909 13.5756 1.50909 12.284V3.71799Z" fill="#F5F5F5"/>
      <path d="M8.10068 11.8977C10.25 11.8977 11.9982 10.1485 11.9982 8.0001C11.9982 5.85078 10.25 4.10254 8.10068 4.10254C5.95139 4.10254 4.20312 5.85081 4.20312 8.0001C4.20312 10.1494 5.95139 11.8977 8.10068 11.8977ZM8.10068 5.43587C9.51388 5.43587 10.6649 6.58692 10.6649 8.0001C10.6649 9.41327 9.51386 10.5643 8.10068 10.5643C6.6875 10.5643 5.53646 9.41327 5.53646 8.0001C5.53646 6.58692 6.6875 5.43587 8.10068 5.43587Z" fill="#F5F5F5"/>
      <path d="M12.6914 2.72045C14.0031 3.26385 13.188 5.23 11.8763 4.68747C10.5656 4.14407 11.3798 2.17702 12.6914 2.72045Z" fill="#F5F5F5"/>
    </g>
    <defs>
      <clipPath id="clip0_9607_143">
        <rect width="16" height="16" fill="white" transform="translate(0.0820312)"/>
      </clipPath>
    </defs>
  </svg>`,
  facebook: `<svg width="14" height="14" viewBox="0 0 14 14" fill="#F5F5F5" xmlns="http://www.w3.org/2000/svg">
    <path d="M12.5 0H1.5C0.65625 0 0 0.6875 0 1.5V12.5C0 13.3438 0.65625 14 1.5 14H5.78125V9.25H3.8125V7H5.78125V5.3125C5.78125 3.375 6.9375 2.28125 8.6875 2.28125C9.5625 2.28125 10.4375 2.4375 10.4375 2.4375V4.34375H9.46875C8.5 4.34375 8.1875 4.9375 8.1875 5.5625V7H10.3438L10 9.25H8.1875V14H12.5C13.3125 14 14 13.3438 14 12.5V1.5C14 0.6875 13.3125 0 12.5 0Z" fill="#F5F5F5"/>
  </svg>`,
  linkedin: `<svg width="14" height="14" viewBox="0 0 14 14" fill="#F5F5F5" xmlns="http://www.w3.org/2000/svg">
    <path d="M13 0H0.96875C0.4375 0 0 0.46875 0 1.03125V13C0 13.5625 0.4375 14 0.96875 14H13C13.5312 14 14 13.5625 14 13V1.03125C14 0.46875 13.5312 0 13 0ZM4.21875 12H2.15625V5.34375H4.21875V12ZM3.1875 4.40625C2.5 4.40625 1.96875 3.875 1.96875 3.21875C1.96875 2.5625 2.5 2 3.1875 2C3.84375 2 4.375 2.5625 4.375 3.21875C4.375 3.875 3.84375 4.40625 3.1875 4.40625ZM12 12H9.90625V8.75C9.90625 8 9.90625 7 8.84375 7C7.75 7 7.59375 7.84375 7.59375 8.71875V12H5.53125V5.34375H7.5V6.25H7.53125C7.8125 5.71875 8.5 5.15625 9.5 5.15625C11.5938 5.15625 12 6.5625 12 8.34375V12Z" fill="#F5F5F5"/>
  </svg>`,
  x: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50" fill="#F5F5F5" width="14px" height="14px">
    <path d="M 11 4 C 7.1456661 4 4 7.1456661 4 11 L 4 39 C 4 42.854334 7.1456661 46 11 46 L 39 46 C 42.854334 46 46 42.854334 46 39 L 46 11 C 46 7.1456661 42.854334 4 39 4 L 11 4 z M 11 6 L 39 6 C 41.773666 6 44 8.2263339 44 11 L 44 39 C 44 41.773666 41.773666 44 39 44 L 11 44 C 8.2263339 44 6 41.773666 6 39 L 6 11 C 6 8.2263339 8.2263339 6 11 6 z M 13.085938 13 L 22.308594 26.103516 L 13 37 L 15.5 37 L 23.4375 27.707031 L 29.976562 37 L 37.914062 37 L 27.789062 22.613281 L 36 13 L 33.5 13 L 26.660156 21.009766 L 21.023438 13 L 13.085938 13 z M 16.914062 15 L 19.978516 15 L 34.085938 35 L 31.021484 35 L 16.914062 15 z"/>
  </svg>`,
};

// Generate social media links HTML
function generateSocialLinks(socials) {
  if (!socials || socials.length === 0) return '';

  return socials.map((social) => {
    let icon = '';
    if (social.includes('instagram.com')) {
      icon = socialIcons.instagram;
    } else if (social.includes('facebook.com')) {
      icon = socialIcons.facebook;
    } else if (social.includes('linkedin.com')) {
      icon = socialIcons.linkedin;
    } else if (social.includes('x.com')) {
      icon = socialIcons.x;
    }

    return icon ? `<a href="${social}" target="_blank" rel="noopener noreferrer">${icon}</a>` : '';
  }).join('');
}

// No profile template
function updateNoProfileDescription(stateInfo) {
  const descriptionEl = document.querySelector('.salary-map-description');
  if (!descriptionEl) return;

  const html = `
    <div class="profile-detail">
      <h3 class="state-name">${stateInfo.state.toUpperCase()}, ${stateInfo.stateCode.toUpperCase()}</h3>
      <div class="profile-divider"></div>
      <h4>Share Your Story. Inspire the Future.</h4>
      <p class="no-profile-desc">Are you an NASM-certified professional with a story to tell? Share your journey and join the "NASM in Action" community. Together, we can inspire the next generation of fitness and wellness leaders.</p>
      <a href="https://forms.gle/BfaTzMKPs9MFeZhDA" class="share-story-link">Share your story</a>
    </div>
  `;

  descriptionEl.innerHTML = html;
}

// Single profile template
function updateSingleProfileDescription(stateInfo) {
  const descriptionEl = document.querySelector('.salary-map-description');
  if (!descriptionEl) return;

  const profile = stateInfo.communityProfiles[0];
  const socialLinks = generateSocialLinks(profile.communityProfileSocials);

  const html = `
    <div class="profile-detail">
      <h3 class="state-name">${profile.communityProfileCity.toUpperCase()}, ${profile.communityProfileState.toUpperCase()}</h3>
      <div class="profile-divider"></div>
      <div class="profile-info">
        <div class="profile-image">
          <img src="${profile.communityProfileImg || '/images/default-profile.jpg'}" alt="${profile.communityProfileName}" />
        </div>
        <div class="profile-details">
          <h4>${profile.communityProfileName || 'Unknown'}</h4>
          <p class="profile-subtitle">${profile.communityProfileSubtitle || ''}</p>
          <div class="profile-socials">${socialLinks}</div>
        </div>
      </div>
      <div class="profile-divider"></div>
      <p class="bio-label">BIO</p>
      <p class="profile-bio">${profile.communityProfileBio || 'No biography available for this profile.'}</p>
    </div>
  `;

  descriptionEl.innerHTML = html;
}

// Multiple profiles template
function updateMultipleProfileDescription(stateInfo) {
  const descriptionEl = document.querySelector('.salary-map-description');
  if (!descriptionEl) return;

  const profile = stateInfo.communityProfiles[currentProfileIndex];
  const socialLinks = generateSocialLinks(profile.communityProfileSocials);
  const totalProfiles = stateInfo.communityProfiles.length;

  const html = `
    <div class="profile-detail">
      <h3 class="state-name">${profile.communityProfileCity.toUpperCase()}, ${profile.communityProfileState.toUpperCase()}</h3>
      <div class="profile-wrapper">
        <div class="profile-info">
          <div class="profile-image">
            <img src="${profile.communityProfileImg || '/images/default-profile.jpg'}" alt="${profile.communityProfileName}" />
          </div>
          <div class="profile-details">
            <h4>${profile.communityProfileName || 'Unknown'}</h4>
            <p class="profile-subtitle">${profile.communityProfileSubtitle || ''}</p>
            <div class="profile-socials">${socialLinks}</div>
          </div>
        </div>
        <div class="profile-divider"></div>
        <p class="bio-label">BIO</p>
        <p class="profile-bio">${profile.communityProfileBio || 'No biography available for this profile.'}</p>
      </div>
      <div class="profile-navigation">
        <button class="nav-btn prev-btn ${currentProfileIndex === 0 ? 'disabled' : ''}" 
                aria-label="Previous profile" 
                ${currentProfileIndex === 0 ? 'disabled' : ''}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
          </svg>
        </button>
        <span class="profile-counter">${currentProfileIndex + 1}/${totalProfiles}</span>
        <button class="nav-btn next-btn ${currentProfileIndex >= totalProfiles - 1 ? 'disabled' : ''}" 
                aria-label="Next profile"
                ${currentProfileIndex >= totalProfiles - 1 ? 'disabled' : ''}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
          </svg>
        </button>
      </div>
    </div>
  `;

  descriptionEl.innerHTML = html;

  // Add event listeners for navigation
  const prevBtn = descriptionEl.querySelector('.prev-btn');
  const nextBtn = descriptionEl.querySelector('.next-btn');

  if (prevBtn && !prevBtn.disabled) {
    prevBtn.addEventListener('click', () => {
      if (currentProfileIndex > 0) {
        currentProfileIndex -= 1;
        updateMultipleProfileDescription(stateInfo);
      }
    });
  }

  if (nextBtn && !nextBtn.disabled) {
    nextBtn.addEventListener('click', () => {
      if (currentProfileIndex < totalProfiles - 1) {
        currentProfileIndex += 1;
        updateMultipleProfileDescription(stateInfo);
      }
    });
  }
}
