# AMChart Block Documentation

## Overview

The AMChart block provides interactive data visualization capabilities using the amCharts 5 library. It supports multiple chart types including column, pie, donut, and line charts with extensive customization options.

## Features

- **Multiple Chart Types**: Column, pie, donut, and line charts
- **Interactive Elements**: Tooltips, hover effects, and zoom capabilities
- **Customizable Styling**: Custom colors, dimensions, and theming
- **Animation Support**: Smooth chart animations on load
- **Responsive Design**: Automatic resizing based on container
- **JSON Data Integration**: Flexible data format support

## Implementation Details

### Files Structure
```
blocks/amchart/
├── amchart.js          # Main block implementation
├── amchart.css         # Styling
└── _amchart.json       # AEM authoring configuration
```

### Technical Architecture

#### Library Loading
- **Core Library**: amCharts 5 core (`index.js`)
- **Chart Modules**: XY charts (`xy.js`) or Percent charts (`percent.js`)
- **Themes**: Animated theme for smooth transitions
- **License**: Commercial license configured (`AM5C439335662`)

#### Chart Creation Process
1. Parse block configuration from AEM authoring
2. Load required amCharts libraries dynamically
3. Create root element and apply themes
4. Initialize chart based on type
5. Configure data, styling, and interactions
6. Set up responsive behavior

## Usage

### Basic Configuration

| Field | Type | Description | Default |
|-------|------|-------------|---------|
| **Chart Type** | Select | Column, Pie, Donut, Line | `column` |
| **Chart Title** | Text | Optional title above chart | Empty |
| **Chart Data** | JSON | Data array with category/value pairs | Sample data |
| **Width** | Text | CSS width value | Auto |
| **Height** | Text | CSS height value | `400px` |
| **Custom Colors** | Text | Comma-separated hex colors | Default palette |
| **Show Legend** | Boolean | Display legend (pie/donut) | `false` |
| **Show Labels** | Boolean | Display data labels | `true` |
| **Enable Animation** | Boolean | Animate on load | `true` |

### Data Format

Charts expect JSON data in the following format:

```json
[
  { "category": "Q1 2024", "value": 150 },
  { "category": "Q2 2024", "value": 200 },
  { "category": "Q3 2024", "value": 175 },
  { "category": "Q4 2024", "value": 225 }
]
```

#### Advanced Data Options
- **Custom Colors**: Include `"color": "#ff0000"` in data objects
- **Field Mapping**: Configure `categoryField` and `valueField` in settings
- **Multiple Series**: Support for complex data structures

### Chart Types

#### Column Charts
- **Use Case**: Comparing categories, time series data
- **Features**: Rounded corners, hover tooltips, grid lines
- **Customization**: Colors, spacing, axis labels

#### Pie Charts
- **Use Case**: Part-to-whole relationships, composition
- **Features**: Interactive slices, optional legend
- **Customization**: Colors, labels, legend position

#### Donut Charts
- **Use Case**: Similar to pie with center space for content
- **Features**: 90% inner radius by default
- **Customization**: Inner radius, colors, center content

#### Line Charts
- **Status**: Configured but implementation pending
- **Planned Features**: Time series, trends, multiple lines

### Styling Options

#### CSS Classes
- `.amchart-container`: Main chart wrapper
- `.amchart-title`: Chart title styling
- `.full-width`: Extends chart to container width

#### Custom Colors
```
#123257, #e8f557, #66bfc7, #ff6b6b, #4ecdc4
```

#### Responsive Behavior
- Automatic resize on container changes
- ResizeObserver implementation
- Mobile-friendly touch interactions

## Examples

### Simple Column Chart
```
| Type | column |
| Title | Quarterly Revenue |
| Data | [{"category": "Q1", "value": 1000}, {"category": "Q2", "value": 1200}] |
| Height | 300px |
| Colors | #2196f3, #4caf50 |
```

### Pie Chart with Legend
```
| Type | pie |
| Title | Market Share |
| Data | [{"category": "Product A", "value": 45}, {"category": "Product B", "value": 30}] |
| Show Legend | true |
| Colors | #ff9800, #9c27b0, #3f51b5 |
```

### Donut Chart
```
| Type | donut |
| Data | [{"category": "Desktop", "value": 60}, {"category": "Mobile", "value": 40}] |
| Show Labels | false |
| Show Legend | true |
```

## Best Practices

### Performance
- Charts load libraries dynamically to reduce initial page weight
- Libraries are cached after first load
- ResizeObserver for efficient responsive updates

### Accessibility
- Semantic HTML structure with chart containers
- Alt text support through title configuration
- Keyboard navigation support (built into amCharts)

### Data Management
- Validate JSON format before rendering
- Handle parsing errors gracefully
- Support for empty or missing data

### Visual Design
- Use consistent color palettes across charts
- Maintain readable font sizes
- Consider color contrast for accessibility
- Test on various screen sizes

## Error Handling

### Common Issues
1. **Invalid JSON Data**: Displays error message, logs to console
2. **Library Load Failure**: Fallback error display
3. **Unsupported Chart Type**: Console error, no chart render
4. **Malformed Configuration**: Uses defaults where possible

### Debugging
- Check browser console for amCharts library errors
- Verify JSON data format validity
- Test chart configuration in isolation
- Monitor network requests for library loading

## Integration Notes

### AEM Authoring
- Fully integrated with Universal Editor
- Real-time preview capabilities
- Form validation for required fields
- Block template inheritance

### Commerce Integration
- Compatible with product analytics data
- Can integrate with Adobe Analytics
- Supports dynamic data from APIs
- Works with commerce event tracking

### Future Enhancements
- Line chart implementation
- Multiple data series support
- Export functionality (PNG, SVG, PDF)
- Real-time data updates
- Advanced chart types (scatter, area, etc.)

## License

Uses amCharts 5 with commercial license: `AM5C439335662`