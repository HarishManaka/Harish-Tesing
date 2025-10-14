# NASM Widget Block

A generic block for embedding any NASM widget with flexible styling options.

## Overview

This block allows you to embed any widget from the NASM widget service (`https://widgets.nasm.org/`) with configurable styling. The block prioritizes the **Custom CSS URL** approach for maximum flexibility while providing basic container styling as a fallback.

## Configuration

### Block Content Structure
Configure the widget using table format:

| Widget Type | Style Theme | Border Radius | Header Color | Button Color | Custom CSS URL |
|-------------|-------------|---------------|--------------|--------------|----------------|
| bmi         | custom-css  | 30           | #FFD700      | #123257      | https://example.com/widget-styles.css |

### Parameters

#### Required
- **Widget Type**: The widget identifier (e.g., `bmi`, `calorie-calculator`)
  - Used to construct the widget URL: `https://widgets.nasm.org/{widgetType}/launch.js`

#### Styling Options
- **Style Theme**: Choose your styling approach
  - `basic` (Recommended) - Basic container styling + CSS variables
  - `custom-css` - Load external CSS file for full control
  - `unstyled` - No additional styling

- **Custom CSS URL**: External stylesheet URL (required when Style Theme = `custom-css`)

#### Basic Styling Parameters (used when Style Theme = `basic`)
- **Border Radius**: Container border radius in pixels (default: `30`)
- **Header Color**: Sets `--brand-color-highlight` CSS variable (default: `#FFD700`)  
- **Button Color**: Sets `--brand-color-dark` CSS variable (default: `#123257`)

## Styling Approach

### 1. Custom CSS URL (Recommended for Production)
When `Style Theme = custom-css`, provide a CSS file that targets the specific widget structure:

```css
/* Example: BMI Calculator Custom Styles */
.bmi-header {
  background-color: #FFD700 !important;
}

.bmi-submit-btn {
  background-color: #123257 !important;
  color: white !important;
}

#bmi-widget-container {
  border-radius: 30px !important;
}
```

### 2. Basic Container Styling (Default)
When `Style Theme = basic`, the block applies:
- Safe container styling (border-radius, max-width, margins)
- CSS variables that widgets might use:
  - `--brand-color-dark`
  - `--brand-color-highlight`  
  - `--nasm-header-color`
  - `--nasm-button-color`
  - `--ui-color-light`

### 3. No Styling
When `Style Theme = unstyled`, only the widget loads with no additional CSS.

## Widget Types

Currently tested widget types:
- `bmi` - BMI Calculator

Other potential widget types (not verified):
- `calorie-calculator`
- `body-fat-calculator`

## Technical Details

### Widget Loading Process
1. Parse block configuration
2. Apply selected styling approach
3. Load widget script from `https://widgets.nasm.org/{widgetType}/launch.js`
4. Create widget element with appropriate attributes
5. Initialize widget using jQuery (if available) or vanilla JS

### Widget Requirements
- Widgets expect a container with ID starting with `bwp-node`
- BMI widget uses `<bmi-calculator>` custom element
- Device detection attributes: `isedge`, `ismobile`, `istablet`

## Example Usage

### Simple BMI Calculator
```
| bmi | basic | 30 | #FFD700 | #123257 | |
```

### Custom Styled Widget  
```
| bmi | custom-css | | | | https://cdn.example.com/nasm-bmi-custom.css |
```

### Minimal Widget
```
bmi
```

## Limitations

- Widget-specific CSS classes are unknown for non-BMI widgets
- Styling relies on CSS variables or custom CSS files
- Each widget type may have different DOM structure and styling requirements
- Cross-origin limitations may apply to custom CSS URLs

## Development Notes

- The block avoids making assumptions about widget DOM structure
- Fallback approach prioritizes safety over specific styling
- Custom CSS URLs provide maximum flexibility for widget-specific styling
- CSS variables allow widgets to self-style if they support the convention