# Collapsible Containers & ESLint Rules Guide

## Overview

This document explains how to properly structure collapsible container fields in AEM component models to satisfy the Adobe `xwalk` ESLint plugin rules.

## Problem Statement

When creating component models with collapsible containers and grouped fields, two ESLint rules can conflict:

1. **`xwalk/no-orphan-collapsible-fields`** - Prevents numbered/prefixed field names that aren't properly grouped
2. **`xwalk/no-duplicate-fields`** - Prevents duplicate field names across the entire model

## Failed Approaches

### ❌ Approach 1: Unprefixed Field Names in Containers

```json
{
  "component": "container",
  "name": "card1",
  "collapsible": true,
  "fields": [
    { "name": "title" },
    { "name": "description" }
  ]
}
```

**Issue**: When multiple containers use the same field names (`title`, `description`), the `xwalk/no-duplicate-fields` rule fails because it flattens the structure and checks for duplicates globally.

### ❌ Approach 2: camelCase Prefixed Field Names

```json
{
  "component": "container",
  "name": "card1",
  "collapsible": true,
  "fields": [
    { "name": "card1Title" },
    { "name": "card1Description" }
  ]
}
```

**Issue**: The `xwalk/no-orphan-collapsible-fields` rule detects the camelCase pattern (`card1Title`) as an "orphan collapsible field" even though it's inside a container.

### ❌ Approach 3: Flat Structure Without Containers

```json
{
  "fields": [
    { "name": "title" },
    { "name": "description" },
    { "name": "badge" },
    { "name": "tags" }
  ]
}
```

**Issue**: While this passes linting, it loses the collapsible grouping functionality needed for better authoring UX.

## ✅ Solution: kebab-case Prefixed Field Names

Use **kebab-case** (hyphenated) naming for field names within collapsible containers:

```json
{
  "component": "container",
  "name": "header",
  "label": "Header",
  "collapsible": true,
  "fields": [
    {
      "component": "text",
      "name": "header-title",
      "label": "title"
    },
    {
      "component": "text",
      "name": "header-description",
      "label": "description"
    }
  ]
}
```

### Why This Works

1. **Unique field names**: Each field has a unique name globally (`header-title`, `card1-title`, `card2-title`)
2. **Avoids orphan detection**: The kebab-case pattern doesn't trigger the orphan collapsible field detection
3. **Maintains grouping**: Collapsible containers remain functional in the AEM authoring UI
4. **Clean labels**: The `label` property displays user-friendly names in the UI

## Complete Example

```json
{
  "id": "filter-section-cards-item",
  "fields": [
    {
      "component": "container",
      "name": "header",
      "label": "Header",
      "collapsible": true,
      "fields": [
        {
          "component": "text",
          "name": "header-title",
          "label": "title",
          "description": ""
        },
        {
          "component": "text",
          "name": "header-description",
          "label": "description",
          "description": ""
        },
        {
          "component": "text",
          "name": "header-label",
          "label": "label",
          "description": ""
        },
        {
          "component": "text",
          "name": "header-url",
          "label": "url",
          "description": ""
        }
      ]
    },
    {
      "component": "container",
      "name": "card1",
      "label": "Card 1",
      "collapsible": true,
      "fields": [
        {
          "component": "text",
          "name": "card1-title",
          "label": "title",
          "description": ""
        },
        {
          "component": "text",
          "name": "card1-description",
          "label": "description",
          "description": ""
        },
        {
          "component": "text",
          "name": "card1-label",
          "label": "label",
          "description": ""
        },
        {
          "component": "text",
          "name": "card1-url",
          "label": "url",
          "description": ""
        },
        {
          "component": "text",
          "name": "card1-badge",
          "label": "badge",
          "description": ""
        },
        {
          "component": "multiselect",
          "name": "card1-tags",
          "label": "tags",
          "description": "",
          "options": [
            {
              "name": "certifications",
              "value": "certifications"
            },
            {
              "name": "specializations",
              "value": "specializations"
            }
          ]
        }
      ]
    },
    {
      "component": "container",
      "name": "card2",
      "label": "Card 2",
      "collapsible": true,
      "fields": [
        {
          "component": "text",
          "name": "card2-title",
          "label": "title",
          "description": ""
        },
        {
          "component": "text",
          "name": "card2-description",
          "label": "description",
          "description": ""
        },
        {
          "component": "text",
          "name": "card2-label",
          "label": "label",
          "description": ""
        },
        {
          "component": "text",
          "name": "card2-url",
          "label": "url",
          "description": ""
        },
        {
          "component": "text",
          "name": "card2-badge",
          "label": "badge",
          "description": ""
        },
        {
          "component": "multiselect",
          "name": "card2-tags",
          "label": "tags",
          "description": "",
          "options": [
            {
              "name": "certifications",
              "value": "certifications"
            },
            {
              "name": "specializations",
              "value": "specializations"
            }
          ]
        }
      ]
    }
  ]
}
```

## Alternative: Multifield for Repeatable Items

If you need a **repeatable list** of similar items (dynamic number of cards), use the `multifield` component instead:

```json
{
  "component": "multifield",
  "valueType": "object[]",
  "name": "cards",
  "label": "Cards",
  "fields": [
    {
      "component": "text",
      "name": "title",
      "label": "Title",
      "valueType": "string"
    },
    {
      "component": "text",
      "name": "description",
      "label": "Description",
      "valueType": "string"
    },
    {
      "component": "text",
      "name": "badge",
      "label": "Badge",
      "valueType": "string"
    }
  ]
}
```

See `blocks/amchart/_amchart.json` for a reference implementation.

## Naming Convention Rules

| Pattern | Example | Result |
|---------|---------|--------|
| **kebab-case prefix** | `card1-title` | ✅ Passes lint |
| **camelCase prefix** | `card1Title` | ❌ Orphan collapsible field error |
| **No prefix (duplicates)** | `title` | ❌ Duplicate field names error |
| **Container name** | `card1`, `header` | ✅ Any format works |

## Key Takeaways

1. **Container names** can use any format (`header`, `card1`, `card2`)
2. **Field names inside containers** must use kebab-case with prefixes (`card1-title`, `header-url`)
3. **Labels** control the display name in the authoring UI, so prefixes don't affect UX
4. The ESLint rules treat the model as **flat** when checking for duplicates
5. Use **multifield** for repeatable/dynamic groups, **container with collapsible** for fixed groups

## Testing

After making changes:

```bash
npm run build:json  # Rebuild component models
npm run lint        # Verify no ESLint errors
```

## Related Files

- `.eslintrc.js` - ESLint configuration using `plugin:xwalk/recommended`
- `blocks/filter-section-cards/_filter-section-cards.json` - Reference implementation
- `blocks/amchart/_amchart.json` - Example using multifield component

## References

- Adobe xwalk ESLint plugin rules
- AEM Edge Delivery Services component model documentation
