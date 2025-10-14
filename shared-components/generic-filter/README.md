# Generic Filter Component

A reusable, customizable filtering component for Adobe EDS projects.

## Usage

```javascript
import FilterComponent from '../../shared-components/generic-filter/index.js';

// Define your filter configuration
const filterConfig = {
  category: {
    label: 'Category',
    options: [
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2' }
    ],
    multiSelect: true, // Allow multiple selections
    matcher: (item, selectedValues) => {
      // Custom matching logic
      return selectedValues.includes(item.category);
    }
  }
};

// Custom card renderer
function renderCard(item) {
  return html`
    <div class="custom-card">
      <h3>${item.title}</h3>
      <p>${item.description}</p>
    </div>
  `;
}

// Use the component
html`
  <${FilterComponent}
    data=${yourDataArray}
    filterConfig=${filterConfig}
    renderCard=${renderCard}
    title="Filter Items"
    mobilePrompt="Want to filter?"
    noResultsMessage="No items match your filters."
    className="my-filter"
    gridColumns=${{ mobile: 1, tablet: 2, desktop: 3 }}
  />
`;
```

## Props

- **data** (Array): The array of items to filter
- **filterConfig** (Object): Configuration for filters
  - Each key is a filter category
  - `label`: Display name for the filter
  - `options`: Array of `{ value, label }` objects
  - `multiSelect`: Boolean for multiple selections
  - `matcher`: Function `(item, selectedValues) => boolean`
- **renderCard** (Function): Custom renderer for each item
- **title** (String): Filter sidebar title
- **mobilePrompt** (String): Mobile toggle text
- **noResultsMessage** (String): No results text
- **className** (String): Additional CSS class
- **gridColumns** (Object): Grid columns by breakpoint
- **showResults** (Boolean): Show/hide results section
- **onFilter** (Function): Callback after filtering

## Styling

The component uses CSS custom properties for theming:

```css
.my-filter {
  --gf-toggle-bg: #f5f5f5;
  --gf-text-primary: #123257;
  --gf-accent-color: #123257;
  /* ... see generic-filter.css for all variables */
}
```

## Example: Exercise Filter

See `blocks/exercise-filter/` for a complete implementation example.