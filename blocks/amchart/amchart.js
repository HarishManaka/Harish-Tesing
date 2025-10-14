import { loadScript } from '../../scripts/aem.js';

/**
 * Parse chart configuration from block content
 * @param {Element} block The amchart block element
 * @returns {Object} Chart configuration
 */
function parseChartConfig(block) {
  const config = {
    type: 'column', // default chart type
    data: [],
    settings: {},
  };

  const rows = [...block.querySelectorAll(':scope > div')];

  // Handle simplified block structure where content is provided directly
  if (rows.length > 0) {
    // Parse based on row position when we have single column data
    const hasKeyValuePairs = rows.some((row) => row.querySelectorAll(':scope > div').length >= 2);

    if (!hasKeyValuePairs && rows.length >= 10) {
      // Parse by position for single column layout
      rows.forEach((row, index) => {
        const text = row.textContent.trim();

        switch (index) {
          case 1: // Layout
            config.layout = text;
            break;
          case 2: // Headline
            config.headline = text;
            break;
          case 3: // Subheadline
            config.subheadline = text;
            break;
          case 4: { // Description (may include bullet points)
            // Parse description and bullet points from the text
            const lines = text.split('\n').map((line) => line.trim()).filter((line) => line);
            if (lines.length > 0) {
              const [firstLine] = lines;
              config.description = firstLine;
              if (lines.length > 1) {
                config.bulletPoints = lines.slice(1).map((line) => ({ text: line }));
              }
            }
            break;
          }
          case 6: // Footnote
            if (text) config.footnote = text;
            break;
          case 7: // Title
            if (text) config.settings.title = text;
            break;
          case 8: // Subtitle
            if (text) config.settings.subtitle = text;
            break;
          case 9: // Data
            if (text.startsWith('[')) {
              try {
                config.data = JSON.parse(text);
              } catch (e) {
                console.error('Failed to parse JSON:', e);
              }
            }
            break;
          case 12: // Colors
            if (text.includes('#')) {
              const decodedText = decodeURIComponent(text);
              const colors = decodedText.match(/#[0-9a-fA-F]{6}/g);
              if (colors) {
                config.settings.colors = colors;
              }
            }
            break;
          case 13: // Show legend
            config.settings.showLegend = text.toLowerCase() === 'true';
            break;
          case 14: // Show labels
            if (text) config.settings.showLabels = text.toLowerCase() === 'true';
            break;
          case 15: // Animation
            if (text) config.settings.animation = text.toLowerCase() === 'true';
            break;
          default:
            // No action needed for other rows
            break;
        }
      });
    } else {
      // Original parsing for other patterns
      rows.forEach((row, index) => {
        const text = row.textContent.trim();

        // Check if this looks like JSON data
        if (text.startsWith('[') && text.includes('category')) {
          try {
            config.data = JSON.parse(text);
          } catch (e) {
            console.error('Failed to parse JSON:', e);
          }
        } else if (text && !text.startsWith('#') && !text.startsWith('[') && index < 3) {
          // Check for title
          config.settings.title = text;
        } else if (text.includes('#')) {
          // Check for colors (hex codes)
          // First decode URL encoded characters
          const decodedText = decodeURIComponent(text);
          const colors = decodedText.match(/#[0-9a-fA-F]{6}/g);
          if (colors) {
            config.settings.colors = colors;
          }
        }
      });
    }
  }

  // Fallback to key-value parsing if available
  rows.forEach((row) => {
    const cells = [...row.querySelectorAll(':scope > div')];
    if (cells.length >= 2) {
      const key = cells[0].textContent.trim().toLowerCase();
      const value = cells[1].textContent.trim();

      if (key && value) {
        switch (key) {
          case 'type':
            config.type = value.toLowerCase();
            break;
          case 'data':
            try {
              config.data = JSON.parse(value);
            } catch (e) {
              console.error('Invalid JSON data for chart:', e);
            }
            break;
          case 'title':
            config.settings.title = value;
            break;
          case 'subtitle':
            config.settings.subtitle = value;
            break;
          case 'width':
            config.settings.width = value;
            break;
          case 'height':
            config.settings.height = value;
            break;
          case 'colors':
            config.settings.colors = value.split(',').map((c) => c.trim());
            break;
          case 'show-legend':
            config.settings.showLegend = value.toLowerCase() === 'true';
            break;
          case 'show-labels':
            config.settings.showLabels = value.toLowerCase() === 'true';
            break;
          case 'animation':
            config.settings.animation = value.toLowerCase() === 'true';
            break;
          case 'layout':
            config.layout = value;
            break;
          case 'headline':
            config.headline = value;
            break;
          case 'subheadline':
            config.subheadline = value;
            break;
          case 'description':
            config.description = value;
            break;
          case 'bullet-points':
            try {
              config.bulletPoints = JSON.parse(value);
            } catch (e) {
              console.error('Invalid JSON for bullet points:', e);
            }
            break;
          case 'footnote':
            config.footnote = value;
            break;
          default:
            config.settings[key] = value;
        }
      }
    }
  });

  return config;
}

/**
 * Create column/bar chart
 * @param {Object} root AM5 root instance
 * @param {Object} config Chart configuration
 * @returns {Object} Chart instance
 */
function createColumnChart(root, config) {
  // Create chart
  const chart = root.container.children.push(
    window.am5xy.XYChart.new(root, {
      panX: false,
      panY: false,
      wheelX: false,
      wheelY: false,
      paddingLeft: 0,
      paddingBottom: 80, // Extra padding for multi-line labels with consistent spacing
    }),
  );

  // Create axes
  const xRenderer = window.am5xy.AxisRendererX.new(root, {
    minGridDistance: 30,
    minorGridEnabled: false,
  });

  xRenderer.labels.template.setAll({
    rotation: 0,
    centerY: window.am5.p50,
    centerX: window.am5.p50,
    paddingTop: 10,
    fontSize: 14,
    fontWeight: '500',
    multiLocation: 0.5,
    textAlign: 'center',
    oversizedBehavior: 'wrap',
    maxWidth: 150,
  });

  // Enable text formatting
  xRenderer.labels.template.set('tooltipText', '{category}');
  xRenderer.labels.template.setup = (label) => {
    label.set('background', window.am5.Rectangle.new(root, {
      fill: window.am5.color(0xffffff),
      fillOpacity: 0,
    }));
  };

  // Create custom label adapter to show category name and value
  xRenderer.labels.template.adapters.add('html', (html, target) => {
    const { dataItem } = target;
    if (dataItem && dataItem.dataContext) {
      const category = dataItem.dataContext.category || '';
      const value = dataItem.dataContext.value || 0;
      return `<div style="text-align: center; display: flex; flex-direction: column; align-items: center; gap: 8px;">
        <div style="font-size: 12px; font-weight: 500; line-height: 1.2; min-height: 36px; display: flex; align-items: flex-end;">${category}</div>
        <div style="font-size: 28px; font-weight: 700; font-style: italic; color: #1a3a5c; line-height: 1;">${value}%</div>
      </div>`;
    }
    return html;
  });

  xRenderer.grid.template.setAll({
    location: 0.5,
    strokeOpacity: 0,
  });

  const xAxis = chart.xAxes.push(
    window.am5xy.CategoryAxis.new(root, {
      categoryField: config.categoryField || 'category',
      renderer: xRenderer,
      tooltip: window.am5.Tooltip.new(root, {}),
    }),
  );

  const yRenderer = window.am5xy.AxisRendererY.new(root, {
    strokeOpacity: 0,
    visible: false,
  });

  const yAxis = chart.yAxes.push(
    window.am5xy.ValueAxis.new(root, {
      maxDeviation: 0.3,
      renderer: yRenderer,
      visible: false,
      min: 0,
      max: 25,
    }),
  );

  // Create series
  const series = chart.series.push(
    window.am5xy.ColumnSeries.new(root, {
      name: 'Series 1',
      xAxis,
      yAxis,
      valueYField: config.valueField || 'value',
      categoryXField: config.categoryField || 'category',
      tooltip: window.am5.Tooltip.new(root, {
        labelText: '{valueY}',
      }),
    }),
  );

  series.columns.template.setAll({
    cornerRadiusTL: 5,
    cornerRadiusTR: 5,
    strokeOpacity: 0,
    width: window.am5.percent(60),
  });

  // Remove value labels from inside columns (we'll add them below the x-axis labels)

  // Set colors if provided
  if (config.colors && config.colors.length > 0) {
    series.columns.template.adapters.add('fill', (fill, target) => {
      const dataContext = target.dataItem?.dataContext;
      if (dataContext && dataContext.color) {
        return window.am5.color(dataContext.color);
      }
      const { dataItems } = series;
      let index = -1;
      for (let i = 0; i < dataItems.length; i += 1) {
        if (dataItems[i] === target.dataItem) {
          index = i;
          break;
        }
      }
      if (index >= 0 && config.colors[index]) {
        return window.am5.color(config.colors[index]);
      }
      return fill;
    });

    series.columns.template.adapters.add('stroke', (stroke, target) => {
      const { dataItems } = series;
      let index = -1;
      for (let i = 0; i < dataItems.length; i += 1) {
        if (dataItems[i] === target.dataItem) {
          index = i;
          break;
        }
      }
      if (index >= 0 && config.colors[index]) {
        return window.am5.color(config.colors[index]);
      }
      return stroke;
    });
  }

  // Set data
  xAxis.data.setAll(config.data);
  series.data.setAll(config.data);

  // Add cursor if interactive
  if (config.interactive !== false) {
    chart.set('cursor', window.am5xy.XYCursor.new(root, {}));
  }

  // Animate on load
  if (config.animation !== false) {
    series.appear(1000);
    chart.appear(1000, 100);
  }

  return chart;
}

/**
 * Create pie/donut chart
 * @param {Object} root AM5 root instance
 * @param {Object} config Chart configuration
 * @returns {Object} Chart instance
 */
function createPieChart(root, config) {
  const chart = root.container.children.push(
    window.am5percent.PieChart.new(root, {
      innerRadius: config.innerRadius ? window.am5.percent(config.innerRadius) : 0,
    }),
  );

  // Create series
  const series = chart.series.push(
    window.am5percent.PieSeries.new(root, {
      valueField: config.valueField || 'value',
      categoryField: config.categoryField || 'category',
      alignLabels: false,
    }),
  );

  series.labels.template.setAll({
    textType: 'circular',
    centerX: 0,
    centerY: 0,
  });

  // Set colors if provided
  if (config.colors) {
    series.slices.template.adapters.add('fill', (fill, target) => {
      const index = series.slices.indexOf(target);
      if (config.colors[index]) {
        return window.am5.color(config.colors[index]);
      }
      return fill;
    });
  }

  // Hide labels if specified
  if (config.showLabels === false) {
    series.labels.template.set('forceHidden', true);
    series.ticks.template.set('forceHidden', true);
  }

  // Set data
  series.data.setAll(config.data);

  // Add legend if specified
  if (config.showLegend) {
    const legend = chart.children.push(
      window.am5.Legend.new(root, {
        centerX: window.am5.percent(50),
        x: window.am5.percent(50),
        marginTop: 15,
        marginBottom: 15,
      }),
    );
    legend.data.setAll(series.dataItems);
  }

  // Animate on load
  if (config.animation !== false) {
    series.appear(1000, 100);
  }

  return chart;
}

/**
 * Initialize amCharts
 * @param {Element} chartContainer The container for the chart
 * @param {Object} config Chart configuration
 */
async function initializeChart(chartContainer, config) {
  // Load amCharts libraries
  await loadScript('https://cdn.amcharts.com/lib/5/index.js');

  // Load required modules based on chart type
  if (config.type === 'pie' || config.type === 'donut') {
    await loadScript('https://cdn.amcharts.com/lib/5/percent.js');
  } else {
    await loadScript('https://cdn.amcharts.com/lib/5/xy.js');
  }

  await loadScript('https://cdn.amcharts.com/lib/5/themes/Animated.js');

  // Wait for libraries to be available
  if (typeof window.am5 === 'undefined') {
    console.error('amCharts library failed to load');
    return undefined;
  }

  // Add license if configured
  if (window.am5 && window.am5.addLicense) {
    window.am5.addLicense('AM5C439335662');
  }

  // Create root element
  const root = window.am5.Root.new(chartContainer);

  // Set themes
  root.setThemes([
    window.am5themes_Animated.new(root),
  ]);

  // Create chart based on type
  let chart;
  const chartType = config.type.toLowerCase();

  switch (chartType) {
    case 'column':
    case 'bar':
      chart = createColumnChart(root, {
        ...config.settings,
        data: config.data,
        colors: config.settings.colors,
        animation: config.settings.animation,
        categoryField: 'category',
        valueField: 'value',
      });
      break;
    case 'pie':
      chart = createPieChart(root, {
        ...config.settings,
        data: config.data,
        colors: config.settings.colors,
        animation: config.settings.animation,
        categoryField: 'category',
        valueField: 'value',
      });
      break;
    case 'donut':
      chart = createPieChart(root, {
        ...config.settings,
        data: config.data,
        colors: config.settings.colors,
        innerRadius: 90,
        animation: config.settings.animation,
        categoryField: 'category',
        valueField: 'value',
      });
      break;
    default:
      console.error(`Unsupported chart type: ${chartType}`);
      return undefined;
  }

  // Store chart instance for potential updates
  chartContainer.chartInstance = chart;
  chartContainer.rootInstance = root;

  // Handle resize
  const resizeObserver = new ResizeObserver(() => {
    if (root && root.resize) {
      root.resize();
    }
  });
  resizeObserver.observe(chartContainer);

  return chart;
}

/**
 * Create text content section
 * @param {Object} config Chart configuration
 * @returns {Element} Text content element
 */
function createTextContent(config) {
  const textContent = document.createElement('div');
  textContent.className = 'amchart-text-content';

  // Add headline
  if (config.headline) {
    const headline = document.createElement('h2');
    headline.className = 'amchart-headline';
    headline.innerHTML = config.headline;
    textContent.appendChild(headline);
  }

  // Add subheadline
  if (config.subheadline) {
    const subheadline = document.createElement('h3');
    subheadline.className = 'amchart-subheadline';
    subheadline.innerHTML = config.subheadline;
    textContent.appendChild(subheadline);
  }

  // Add description
  if (config.description) {
    const description = document.createElement('div');
    description.className = 'amchart-description';
    description.innerHTML = config.description;
    textContent.appendChild(description);
  }

  // Add bullet points
  if (config.bulletPoints && Array.isArray(config.bulletPoints)) {
    const bulletList = document.createElement('ul');
    bulletList.className = 'amchart-bullet-list';

    config.bulletPoints.forEach((point) => {
      if (point.text) {
        const listItem = document.createElement('li');
        listItem.innerHTML = point.text;
        bulletList.appendChild(listItem);
      }
    });

    textContent.appendChild(bulletList);
  }

  // Footnote is now handled separately at the bottom of the chart

  return textContent;
}

/**
 * Decorate the amchart block
 * @param {Element} block The amchart block element
 */
export default async function decorate(block) {
  const config = parseChartConfig(block);

  // Clear the block content
  block.innerHTML = '';

  // Add layout class
  block.classList.add(`amchart-layout-${config.layout || 'chart-only'}`);

  // Create wrapper for text-chart layout
  if (config.layout === 'text-chart') {
    const wrapper = document.createElement('div');
    wrapper.className = 'amchart-content-wrapper';

    // Create text content section
    const textContent = createTextContent(config);
    wrapper.appendChild(textContent);

    // Create chart section
    const chartSection = document.createElement('div');
    chartSection.className = 'amchart-chart-section';

    // Create chart container first
    const chartContainer = document.createElement('div');
    chartContainer.className = 'amchart-container';

    // Set dimensions if specified
    if (config.settings.width) {
      chartContainer.style.width = config.settings.width;
    }
    if (config.settings.height) {
      chartContainer.style.height = config.settings.height;
    } else {
      chartContainer.style.height = '400px'; // default height
    }

    chartSection.appendChild(chartContainer);

    // Add title below the chart
    if (config.settings.title) {
      const title = document.createElement('h3');
      title.className = 'amchart-title';
      title.textContent = config.settings.title;
      chartSection.appendChild(title);
    }

    // Add footnote on the right side below the title
    if (config.footnote) {
      const footnote = document.createElement('p');
      footnote.className = 'amchart-footnote';
      footnote.innerHTML = config.footnote;
      chartSection.appendChild(footnote);
    }

    // Add subtitle below the title (if specified)
    if (config.settings.subtitle) {
      const subtitle = document.createElement('p');
      subtitle.className = 'amchart-subtitle';
      subtitle.textContent = config.settings.subtitle;
      chartSection.appendChild(subtitle);
    }

    wrapper.appendChild(chartSection);
    block.appendChild(wrapper);

    // Initialize chart
    try {
      await initializeChart(chartContainer, config);
    } catch (error) {
      console.error('Failed to initialize amChart:', error);
      chartContainer.innerHTML = '<p>Error loading chart. Please check the configuration.</p>';
    }
  } else {
    // Original chart-only layout
    // Create chart container first
    const chartContainer = document.createElement('div');
    chartContainer.className = 'amchart-container';

    // Set dimensions if specified
    if (config.settings.width) {
      chartContainer.style.width = config.settings.width;
    }
    if (config.settings.height) {
      chartContainer.style.height = config.settings.height;
    } else {
      chartContainer.style.height = '400px'; // default height
    }

    block.appendChild(chartContainer);

    // Add title below the chart
    if (config.settings.title) {
      const title = document.createElement('h3');
      title.className = 'amchart-title';
      title.textContent = config.settings.title;
      block.appendChild(title);
    }

    // Add subtitle below the title
    if (config.settings.subtitle) {
      const subtitle = document.createElement('p');
      subtitle.className = 'amchart-subtitle';
      subtitle.textContent = config.settings.subtitle;
      block.appendChild(subtitle);
    }

    // Add footnote for chart-only layout
    if (config.footnote) {
      const footnote = document.createElement('p');
      footnote.className = 'amchart-footnote';
      footnote.innerHTML = config.footnote;
      block.appendChild(footnote);
    }

    // Initialize chart when libraries are loaded
    try {
      await initializeChart(chartContainer, config);
    } catch (error) {
      console.error('Failed to initialize amChart:', error);
      chartContainer.innerHTML = '<p>Error loading chart. Please check the configuration.</p>';
    }
  }
}
