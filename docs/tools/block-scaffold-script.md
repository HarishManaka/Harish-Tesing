# Block Scaffold Script Documentation

## Overview

The Block Scaffold Script (`tooling/create-block.js`) is an interactive CLI tool that automates the creation of new Adobe Edge Delivery Services (EDS) blocks. It generates the complete folder structure, initial files, and handles registration in the project's configuration files.

## Features

- **Interactive Prompts**: Fancy terminal prompts for user-friendly input
- **Validation**: Automatic kebab-case conversion and input validation
- **File Generation**: Creates complete block structure with boilerplate code
- **Auto-Registration**: Updates `_component-definition.json` and optionally `_common-blocks.json`
- **Dry-Run Mode**: Preview changes without writing files
- **Logging**: Configurable log levels for debugging and monitoring
- **CI-Friendly**: Supports non-interactive environments

## Installation

The script uses the following dependencies (already installed in this project):

```bash
npm install enquirer chalk minimist
```

## Usage

### Basic Usage

```bash
node tooling/create-block.js
```

This will start the interactive prompt asking for:
1. **Block name** (e.g., "hero banner" → automatically converted to "hero-banner")
2. **Resource type** (select from dropdown or enter custom)
3. **Common blocks registration** (yes/no confirmation)

### Command Line Flags

| Flag | Description | Example |
|------|-------------|---------|
| `--dry-run` | Preview changes without writing files | `node tooling/create-block.js --dry-run` |
| `--test` | Run in test mode (same as dry-run with additional test output) | `node tooling/create-block.js --test` |

### Environment Variables

| Variable | Values | Default | Description |
|----------|--------|---------|-------------|
| `LOG_LEVEL` | `error`, `info`, `debug` | `info` | Controls logging verbosity |

## Examples

### Example 1: Creating a Simple Content Block

```bash
# Start the script
node tooling/create-block.js

# Interactive prompts will appear:
? Enter the block name (kebab-case recommended): Product Showcase
? Select resourceType: core/franklin/components/block/v1/block
? Register in _common-blocks.json? Yes

# Output:
[INFO] Created blocks/product-showcase/product-showcase.js
[INFO] Created blocks/product-showcase/product-showcase.css
[INFO] Created blocks/product-showcase/_product-showcase.json
[INFO] Registered product-showcase in _component-definition.json
[INFO] Registered product-showcase in _common-blocks.json
```

**Generated Files:**
```
blocks/product-showcase/
├── product-showcase.js        # JavaScript with decorate function
├── product-showcase.css       # Empty CSS file
└── _product-showcase.json     # Universal Editor configuration
```

### Example 2: Creating a Section Component

```bash
node tooling/create-block.js

# Prompts:
? Enter the block name: Special Section
? Select resourceType: core/franklin/components/section/v1/section
? Register in _common-blocks.json? No

# This creates a section-type component instead of a block
```

### Example 3: Using Custom Resource Type

```bash
node tooling/create-block.js

# Prompts:
? Enter the block name: custom widget
? Select resourceType: Custom...
? Enter custom resourceType: myproject/components/widget/v1/widget
? Register in _common-blocks.json? Yes
```

### Example 4: Dry-Run Mode

```bash
# Preview changes without writing files
LOG_LEVEL=debug node tooling/create-block.js --dry-run

# Example output:
[DEBUG] CLI args: { 'dry-run': true }
[DEBUG] Block name entered: hero-banner
[DEBUG] resourceType selected: core/franklin/components/block/v1/block
[DEBUG] Register in _common-blocks.json: true
[INFO] [DRY RUN] No files will be written.
[INFO] Block name: hero-banner
[INFO] resourceType: core/franklin/components/block/v1/block
[INFO] Register in _common-blocks.json: true
```

### Example 5: Different Log Levels

```bash
# Minimal output (errors only)
LOG_LEVEL=error node tooling/create-block.js

# Standard output (default)
LOG_LEVEL=info node tooling/create-block.js

# Verbose output (all details)
LOG_LEVEL=debug node tooling/create-block.js
```

## Generated File Contents

### JavaScript File (`<block-name>.js`)

```javascript
export default function decorate(block) {
  // 'block' is the main <div> element of the block.
  // Add DOM manipulation or event listeners here.
}
```

### CSS File (`<block-name>.css`)

An empty CSS file ready for styling.

### JSON Configuration (`_<block-name>.json`)

```json
{
  "definitions": [
    {
      "title": "Product Showcase",
      "id": "product-showcase",
      "resourceType": "core/franklin/components/block/v1/block",
      "template": {
        "name": "product-showcase",
        "model": "product-showcase"
      }
    }
  ],
  "models": [
    {
      "id": "product-showcase",
      "fields": []
    }
  ],
  "filters": []
}
```

## Registration Details

### _component-definition.json

The script automatically adds a reference to your block in the "Blocks" group:

```json
{
  "...": "../blocks/product-showcase/_*.json#/definitions"
}
```

### _common-blocks.json (Optional)

If you choose to register in common blocks, the block name is added to the array in alphabetical order:

```json
[
  "accordion",
  "cards",
  "product-showcase",
  "testimonials"
]
```

## Troubleshooting

### Common Issues

**1. Permission Denied**
```bash
# Make the script executable
chmod +x tooling/create-block.js
```

**2. Module Not Found Errors**
```bash
# Ensure dependencies are installed
npm install enquirer chalk minimist
```

**3. Block Already Exists**
The script will detect existing blocks and log warnings instead of overwriting files.

**4. Non-Interactive Environments**
In CI/CD or non-interactive environments, the script will gracefully handle prompt failures and exit appropriately in dry-run/test mode.

### Debug Mode

For troubleshooting, use debug logging:

```bash
LOG_LEVEL=debug node tooling/create-block.js --dry-run
```

This shows:
- CLI argument parsing
- User input values
- File operations (intended)
- Registration steps

## Best Practices

### Block Naming

- Use descriptive, kebab-case names: `product-carousel`, `testimonial-grid`
- Avoid generic names: `component`, `block`, `widget`
- Be specific: `hero-banner` instead of `hero`

### Resource Types

- **Standard blocks**: Use `core/franklin/components/block/v1/block`
- **Sections**: Use `core/franklin/components/section/v1/section`
- **Custom types**: Only when you have specific AEM component requirements

### Common Blocks Registration

Register in `_common-blocks.json` when:
- ✅ The block is reusable across multiple pages
- ✅ Authors should see it in standard content libraries
- ❌ The block is page-specific or experimental

### Development Workflow

1. **Create the block** using this script
2. **Implement the model** by adding fields to the JSON configuration
3. **Style the block** in the CSS file
4. **Add functionality** in the JavaScript file
5. **Test in Universal Editor** or preview environment

## Integration with Development Tools

### Package.json Scripts

Add shortcuts to your `package.json`:

```json
{
  "scripts": {
    "create-block": "node tooling/create-block.js",
    "create-block:dry": "node tooling/create-block.js --dry-run"
  }
}
```

Usage:
```bash
npm run create-block
npm run create-block:dry
```

### VS Code Tasks

Create `.vscode/tasks.json`:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Create New Block",
      "type": "shell",
      "command": "node tooling/create-block.js",
      "group": "build",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "shared"
      }
    }
  ]
}
```

## Testing

The script includes comprehensive integration tests:

```bash
# Run tests
npm test tooling/__tests__/create-block.test.js

# Run with specific test pattern
npx jest tooling/__tests__/create-block.test.js --testMatch '**/tooling/__tests__/*.js'
```

## Related Documentation

- [Block Development Guide](../blocks/block-developing.md)
- [Universal Editor JSON Configuration Guide](../blocks/Universal%20Editor%20JSON%20Configuration%20Guide%20v3.md)
- [EDS Architecture Overview](../Adobe-EDS-Architecture-Complete.md)

## Contributing

When modifying the script:

1. Update this documentation
2. Add/update tests in `tooling/__tests__/create-block.test.js`
3. Test in both interactive and non-interactive modes
4. Verify dry-run mode works correctly
5. Test with different log levels 