# AEM Universal Editor Instrumentation Guide

## Table of Contents
1. [Overview](#overview)
2. [Core Concepts](#core-concepts)
3. [Data Attribute Reference](#data-attribute-reference)
4. [Three HTML States](#three-html-states)
5. [JSON to HTML Mapping](#json-to-html-mapping)
6. [Complete Example: filter-section-cards](#complete-example-filter-section-cards)
7. [Developer Workflows](#developer-workflows)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

---

## Overview

### What is AEM Universal Editor Instrumentation?

The **AEM Universal Editor** is Adobe's in-context content authoring tool that allows content authors to edit web content directly on the page without switching between authoring and preview modes. To enable this functionality, HTML elements must be "instrumented" with special `data-aue-*` attributes that create connections between:

1. **JSON Component Models** - Define editable fields and their properties
2. **Instrumented HTML** - Rendered HTML with `data-aue-*` attributes for the editor
3. **Clean HTML** - Production HTML without instrumentation for end users

### The Instrumentation Flow

```
JSON Model (_blockname.json)
    ↓
    Defines: component structure, field names, field types
    ↓
AEM Authoring (creates content)
    ↓
    Stores: content values in AEM repository
    ↓
Instrumented HTML (instrumented-block.html)
    ↓
    Contains: data-aue-* attributes linking to JSON model
    ↓
    Rendered in: AEM Universal Editor (authoring mode)
    ↓
Clean HTML (updated-block.html / block.html)
    ↓
    Same structure WITHOUT data-aue-* attributes
    ↓
    Served to: End users (production)
    ↓
JavaScript Decorator (blockname.js)
    ↓
    Transforms: Clean HTML into rich UI components
    ↓
Final Rendered Output
```

### Key Benefits

- ✅ **In-Context Editing** - Authors edit content directly on the page
- ✅ **Visual Feedback** - See changes immediately without switching modes
- ✅ **Type Safety** - JSON models enforce field types and validation
- ✅ **Component Reusability** - Same models work across multiple pages
- ✅ **Clean Production HTML** - No instrumentation overhead for end users

---

## Core Concepts

### 1. Component Models (JSON)

Component models define the structure and editability of blocks:

```json
{
  "models": [
    {
      "id": "my-block",
      "fields": [
        {
          "component": "text",
          "name": "title",
          "label": "Title"
        }
      ]
    }
  ]
}
```

**Key Properties:**
- **`id`** - Unique identifier matching `data-aue-model`
- **`fields`** - Array of editable fields
- **`component`** - Field type (text, richtext, image, etc.)
- **`name`** - Field identifier matching `data-aue-prop`
- **`label`** - Display name in editor UI

### 2. Instrumentation Attributes

Instrumentation connects HTML to JSON models through `data-aue-*` attributes:

| Attribute | Purpose | Example |
|-----------|---------|---------|
| `data-aue-resource` | Unique content identifier in AEM | `urn:aemconnection:/content/...` |
| `data-aue-type` | Element role (component/container/text) | `component`, `text`, `richtext` |
| `data-aue-model` | Links to JSON model ID | `my-block` |
| `data-aue-prop` | Links to JSON field name | `title` |
| `data-aue-label` | Display label in editor | `Title` |
| `data-aue-behavior` | Component behavior type | `component` |
| `data-aue-filter` | Filter identifier | `my-block` |

### 3. Three HTML Versions

Every block exists in three HTML states:

#### Version 1: Instrumented HTML
**File**: `instrumented-block.html`
**Purpose**: Rendered inside AEM Universal Editor
**Contains**: Full `data-aue-*` instrumentation

```html
<div data-aue-resource="urn:aemconnection:..."
     data-aue-type="component"
     data-aue-model="my-block">
  <div data-aue-prop="title" data-aue-type="text">Hello World</div>
</div>
```

#### Version 2: Clean HTML
**File**: `updated-block.html` or `block.html`
**Purpose**: Served to end users
**Contains**: NO `data-aue-*` attributes

```html
<div class="my-block">
  <div>Hello World</div>
</div>
```

#### Version 3: Transformed HTML
**Created by**: JavaScript decorator function
**Purpose**: Rich UI for production
**Contains**: Semantic HTML + CSS classes

```html
<div class="my-block">
  <h1 class="my-block-title">Hello World</h1>
</div>
```

---

## Data Attribute Reference

### `data-aue-resource`

**Purpose**: Uniquely identifies a content resource in AEM's content repository (JCR).

**Format**:
```
urn:aemconnection:/content/{site}/{path}/jcr:content/{component-path}
```

**Example**:
```html
data-aue-resource="urn:aemconnection:/content/nasm/drafts/blocks/filter-cards/jcr:content/root/section/block"
```

**Usage**:
- Applied to container elements (block root, items)
- Tells AEM where to save content changes
- Required for any editable component

---

### `data-aue-type`

**Purpose**: Defines the type of editable element.

**Values**:
- **`component`** - A complete component (block, item)
- **`container`** - A container holding child components
- **`text`** - Plain text field
- **`richtext`** - Rich text with formatting
- **`reference`** - Reference to another component

**Examples**:
```html
<!-- Component (block level) -->
<div data-aue-type="component" data-aue-model="filter-section-cards">

<!-- Container (repeatable items) -->
<div data-aue-type="container" data-aue-behavior="component">

<!-- Text field -->
<div data-aue-type="text" data-aue-prop="title">
```

---

### `data-aue-model`

**Purpose**: Links HTML to a specific JSON model definition.

**Format**: String matching the `id` in JSON model's `models` array

**JSON Model**:
```json
{
  "models": [
    {
      "id": "filter-section-cards-item",
      "fields": [...]
    }
  ]
}
```

**HTML**:
```html
<div data-aue-model="filter-section-cards-item">
```

**Key Points**:
- Must exactly match JSON model `id`
- Case-sensitive
- Tells editor which fields are editable

---

### `data-aue-prop`

**Purpose**: Maps HTML element to a specific field in the JSON model.

**Format**: String matching the `name` in JSON model's `fields` array

**JSON Model**:
```json
{
  "fields": [
    {
      "component": "text",
      "name": "header-title",
      "label": "title"
    }
  ]
}
```

**HTML**:
```html
<div data-aue-prop="header-title" data-aue-label="title" data-aue-type="text">
  New Certifications
</div>
```

**Key Points**:
- Must exactly match JSON field `name`
- Case-sensitive (use kebab-case for collapsible containers)
- Required for every editable field

---

### `data-aue-label`

**Purpose**: Display-friendly name shown in the editor UI.

**Format**: String (typically matches JSON field's `label` property)

**JSON Model**:
```json
{
  "component": "text",
  "name": "header-title",
  "label": "title"  // ← This becomes data-aue-label
}
```

**HTML**:
```html
<div data-aue-prop="header-title"
     data-aue-label="title"  // ← Displayed in editor
     data-aue-type="text">
```

**Key Points**:
- Purely for UI/UX in the editor
- Can be more readable than `data-aue-prop`
- Not used in production

---

### `data-aue-behavior`

**Purpose**: Defines how the component behaves in the editor.

**Values**:
- **`component`** - Behaves as a standard component

**Example**:
```html
<div data-aue-type="container"
     data-aue-behavior="component"
     data-aue-model="filter-section-cards">
```

**Key Points**:
- Typically used with `data-aue-type="container"`
- Tells editor this container has component-like behavior

---

### `data-aue-filter`

**Purpose**: Associates component with a filter definition for filtering/categorization.

**Format**: String matching filter `id` in JSON model's `filters` array

**JSON Model**:
```json
{
  "filters": [
    {
      "id": "filter-section-cards",
      "components": ["filter-section-cards-item"]
    }
  ]
}
```

**HTML**:
```html
<div data-aue-filter="filter-section-cards" class="filter-section-cards">
```

**Key Points**:
- Optional attribute
- Enables filtering in AEM UI
- Helps organize components by category

---

## Three HTML States

### State 1: Instrumented HTML (AEM Editor)

**File Location**: `blocks/{blockname}/instrumented-block.html`

**Purpose**:
- Rendered inside AEM Universal Editor
- Enables in-context editing
- Connects UI to content repository

**Characteristics**:
- ✅ Contains all `data-aue-*` attributes
- ✅ Matches JSON model structure exactly
- ✅ Every editable field has instrumentation
- ✅ Uses flat `<div>` structure from AEM

**Example** (`instrumented-block.html`):
```html
<div data-aue-resource="urn:aemconnection:/content/nasm/drafts/blocks/filter-cards/jcr:content/root/section/block"
  data-aue-type="container"
  data-aue-behavior="component"
  data-aue-model="filter-section-cards"
  data-aue-label="Filter Section Cards"
  data-aue-filter="filter-section-cards"
  class="filter-section-cards">

  <div>
    <!-- Block-level field -->
    <div data-aue-prop="filters-title"
         data-aue-label="filters title"
         data-aue-type="text">
      Filter Categories
    </div>
  </div>

  <!-- Repeatable item -->
  <div data-aue-resource="urn:aemconnection:/content/nasm/drafts/blocks/filter-cards/jcr:content/root/section/block/item"
    data-aue-type="component"
    data-aue-model="filter-section-cards-item"
    data-aue-label="Filter Section Cards Item">

    <!-- Header fields -->
    <div data-aue-prop="header-title"
         data-aue-label="title"
         data-aue-type="text">
      New Certifications
    </div>

    <div data-aue-prop="header-description"
         data-aue-label="description"
         data-aue-type="text">
      Unleash your unlimited potential with our latest certifications.
    </div>

    <div data-aue-prop="header-label"
         data-aue-label="label"
         data-aue-type="text">
      Learn More
    </div>

    <div>
      <a href="/nasm?tag=certifications">/nasm?tag=certifications</a>
    </div>

    <div data-aue-prop="tag"
         data-aue-label="tag"
         data-aue-type="text">
      Certifications
    </div>

    <!-- Card 1 fields -->
    <div data-aue-prop="card1-title"
         data-aue-label="title"
         data-aue-type="text">
      Certified Wellness Coach Self-Study
    </div>

    <div data-aue-prop="card1-description"
         data-aue-label="description"
         data-aue-type="text">
      Take your passion beyond the gym...
    </div>

    <div data-aue-prop="card1-label"
         data-aue-label="label"
         data-aue-type="text">
      view course
    </div>

    <div>
      <a href="/nasm?card=1d1">/nasm?card=1d1</a>
    </div>

    <!-- Card 2 fields -->
    <div data-aue-prop="card2-title"
         data-aue-label="title"
         data-aue-type="text">
      Fitness & Wellness Bundle
    </div>

    <div data-aue-prop="card2-description"
         data-aue-label="description"
         data-aue-type="text">
      Merge personal training with wellness coaching...
    </div>

    <div data-aue-prop="card2-label"
         data-aue-label="label"
         data-aue-type="text">
      view course
    </div>

    <div>
      <a href="/nasm?card=1d2">/nasm?card=1d2</a>
    </div>

  </div>

</div>
```

---

### State 2: Clean HTML (Production)

**File Location**: `blocks/{blockname}/updated-block.html` or `block.html`

**Purpose**:
- Served to end users in production
- No editor overhead
- Same structure, no instrumentation

**Characteristics**:
- ❌ NO `data-aue-*` attributes
- ✅ Identical content to instrumented version
- ✅ Same flat structure
- ✅ Minimal markup for performance

**Example** (`updated-block.html`):
```html
<div class="filter-section-cards">
  <div>
    <!-- filter title -->
    <div>Filter Categories</div>
  </div>

  <div>
    <!--  -->
    <div>New Certifications</div>

    <div>Unleash your unlimited potential with our latest certifications.</div>

    <div>Learn More</div>

    <div><a href="/nasm?tag=certifications">/nasm?tag=certifications</a></div>

    <div>Certifications</div>

    <div>Certified Wellness Coach Self-Study</div>

    <div>Take your passion beyond the gym with evidence-based training designed to help you guide clients on their
      personalized path to wellness.</div>

    <div>view course</div>

    <div><a href="/nasm?card=1d1">/nasm?card=1d1</a></div>

    <div>Fitness &amp; Wellness Bundle</div>

    <div>Merge personal training with wellness coaching for comprehensive client transformation. This bundle provides
      tools to train clients holistically, fostering lasting change.</div>

    <div>view course</div>

    <div><a href="/nasm?card=1d2">/nasm?card=1d2</a></div>

  </div>

</div>
```

**Key Difference**:
```diff
<!-- INSTRUMENTED -->
- <div data-aue-prop="header-title" data-aue-label="title" data-aue-type="text">

<!-- CLEAN -->
+ <div>
```

---

### State 3: Transformed HTML (JavaScript Output)

**Created by**: JavaScript decorator function (`blockname.js`)

**Purpose**:
- Rich, semantic HTML for production
- Optimized user experience
- Styled with CSS classes

**Characteristics**:
- ✅ Semantic HTML (`<h2>`, `<h3>`, `<p>`, etc.)
- ✅ CSS classes for styling
- ✅ Proper structure and accessibility
- ✅ Optimized for performance

**Example** (JavaScript decorator output):
```html
<div class="filter-section-cards">
  <div class="filter-section-cards-wrapper">

    <!-- Header Section -->
    <div class="filter-section-cards-header">
      <h2>New Certifications</h2>
      <p>Unleash your unlimited potential with our latest certifications.</p>
      <a href="/nasm?tag=certifications"
         class="filter-section-cards-cta button primary">
        Learn More
      </a>
    </div>

    <!-- Card 1 -->
    <div class="filter-section-cards-item" data-tags="certifications">
      <div class="filter-section-cards-item-img">
        <img src="https://via.placeholder.com/400x200"
             alt="Certified Wellness Coach Self-Study">
      </div>
      <div class="filter-section-cards-item-content">
        <h3>Certified Wellness Coach Self-Study</h3>
        <p>Take your passion beyond the gym with evidence-based training designed to help you guide clients on their personalized path to wellness.</p>
        <div class="filter-section-cards-item-meta">
          <a href="/nasm?card=1d1" class="filter-section-cards-link">
            view course
          </a>
          <span class="filter-section-cards-badge">Certifications</span>
        </div>
      </div>
    </div>

    <!-- Card 2 -->
    <div class="filter-section-cards-item">
      <div class="filter-section-cards-item-img">
        <img src="https://via.placeholder.com/400x200"
             alt="Fitness & Wellness Bundle">
      </div>
      <div class="filter-section-cards-item-content">
        <h3>Fitness & Wellness Bundle</h3>
        <p>Merge personal training with wellness coaching for comprehensive client transformation. This bundle provides tools to train clients holistically, fostering lasting change.</p>
        <div class="filter-section-cards-item-meta">
          <a href="/nasm?card=1d2" class="filter-section-cards-link">
            view course
          </a>
        </div>
      </div>
    </div>

  </div>
</div>
```

**Key Transformations**:
1. Flat `<div>` → Semantic `<h2>`, `<h3>`, `<p>`
2. No structure → Nested containers with BEM-style classes
3. No images → Placeholder/real images added
4. Raw links → Styled CTAs and buttons

---

## JSON to HTML Mapping

### How JSON Models Connect to HTML

The connection between JSON and HTML follows a strict mapping:

```
JSON Model Field → data-aue-prop → HTML Element Content
```

### Mapping Example

**JSON Model**:
```json
{
  "models": [
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
              "label": "title"
            },
            {
              "component": "text",
              "name": "header-description",
              "label": "description"
            }
          ]
        }
      ]
    }
  ]
}
```

**Instrumented HTML**:
```html
<div data-aue-model="filter-section-cards-item">
  <!-- header-title field -->
  <div data-aue-prop="header-title" data-aue-label="title" data-aue-type="text">
    New Certifications
  </div>

  <!-- header-description field -->
  <div data-aue-prop="header-description" data-aue-label="description" data-aue-type="text">
    Unleash your unlimited potential
  </div>
</div>
```

**Mapping Table**:
| JSON Property | HTML Attribute | Value |
|---------------|----------------|-------|
| `models[].id` | `data-aue-model` | `filter-section-cards-item` |
| `fields[].name` | `data-aue-prop` | `header-title` |
| `fields[].label` | `data-aue-label` | `title` |
| `fields[].component` | `data-aue-type` | `text` |

### Collapsible Container Fields

**JSON Definition**:
```json
{
  "component": "container",
  "name": "card1",
  "label": "Card 1",
  "collapsible": true,
  "fields": [
    {
      "component": "text",
      "name": "card1-title",  // ← Note prefix
      "label": "title"
    }
  ]
}
```

**Key Rules**:
1. **Container name** doesn't appear in HTML (it's logical grouping)
2. **Field names** use kebab-case prefix: `card1-title`, `card1-description`
3. **Labels** remain simple: `title`, `description`

**HTML**:
```html
<!-- Container fields are flat in HTML -->
<div data-aue-prop="card1-title" data-aue-label="title" data-aue-type="text">
  MMA Conditioning Specialization
</div>
```

### Nested Components (Block + Items)

**JSON Structure**:
```json
{
  "definitions": [
    {
      "id": "filter-section-cards",  // ← Parent block
      ...
    },
    {
      "id": "filter-section-cards-item",  // ← Child item
      ...
    }
  ],
  "filters": [
    {
      "id": "filter-section-cards",
      "components": ["filter-section-cards-item"]  // ← Relationship
    }
  ]
}
```

**HTML Structure**:
```html
<!-- Parent block -->
<div data-aue-model="filter-section-cards"
     data-aue-filter="filter-section-cards"
     class="filter-section-cards">

  <!-- FIRST CHILD: Block-level fields container -->
  <div>
    <div data-aue-prop="filters-title">Filter Categories</div>
  </div>

  <!-- SECOND CHILD: Complete item with ALL fields as flat siblings -->
  <div data-aue-model="filter-section-cards-item">
    <!-- All header, card1, and card2 fields are siblings at the same level -->
    <div data-aue-prop="header-title">New Certifications</div>
    <div data-aue-prop="header-description">Unleash your unlimited potential...</div>
    <div data-aue-prop="header-label">Learn More</div>
    <div><a href="/nasm?tag=certifications">/nasm?tag=certifications</a></div>
    <div data-aue-prop="tag">Certifications</div>

    <div data-aue-prop="card1-title">Certified Wellness Coach Self-Study</div>
    <div data-aue-prop="card1-description">Take your passion beyond the gym...</div>
    <div data-aue-prop="card1-label">view course</div>
    <div><a href="/nasm?card=1d1">/nasm?card=1d1</a></div>

    <div data-aue-prop="card2-title">Fitness & Wellness Bundle</div>
    <div data-aue-prop="card2-description">Merge personal training...</div>
    <div data-aue-prop="card2-label">view course</div>
    <div><a href="/nasm?card=1d2">/nasm?card=1d2</a></div>
  </div>

  <!-- Additional items would be additional <div> children -->
</div>
```

**⚠️ Key Structure Points**:
1. **First `<div>` child** = Block-level fields ONLY (filters-title)
2. **Second `<div>` child** = Complete item with ALL item fields as flat siblings
3. **Item fields are NOT nested** - header, card1, and card2 fields are all at the same level
4. **Collapsible containers** (header, card1, card2) exist in JSON but NOT in HTML structure
5. **Each item** is a single `<div>` containing all its fields as direct children

**Relationship**:
- Parent: `data-aue-filter="filter-section-cards"`
- Children: `data-aue-model="filter-section-cards-item"`
- Filter defines which items can be added
- Each item contains all its data fields flattened

---

## Complete Example: filter-section-cards

### JSON Model

**File**: `blocks/filter-section-cards/_filter-section-cards.json`

```json
{
  "definitions": [
    {
      "title": "Filter Section Cards",
      "id": "filter-section-cards",
      "plugins": {
        "xwalk": {
          "page": {
            "resourceType": "core/franklin/components/block/v1/block",
            "template": {
              "name": "Filter Section Cards",
              "model": "filter-section-cards",
              "filter": "filter-section-cards"
            }
          }
        }
      }
    },
    {
      "title": "Filter Section Cards Item",
      "id": "filter-section-cards-item",
      "plugins": {
        "xwalk": {
          "page": {
            "resourceType": "core/franklin/components/block/v1/block/item",
            "template": {
              "name": "Filter Section Cards Item",
              "model": "filter-section-cards-item"
            }
          }
        }
      }
    }
  ],
  "models": [
    {
      "id": "filter-section-cards",
      "fields": [
        {
          "component": "text",
          "name": "filters-title",
          "label": "filters title"
        }
      ]
    },
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
              "label": "title"
            },
            {
              "component": "text",
              "name": "header-description",
              "label": "description"
            },
            {
              "component": "text",
              "name": "header-label",
              "label": "label"
            },
            {
              "component": "text",
              "name": "header-url",
              "label": "url"
            },
            {
              "component": "text",
              "name": "tag",
              "label": "tag"
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
              "label": "title"
            },
            {
              "component": "text",
              "name": "card1-description",
              "label": "description"
            },
            {
              "component": "text",
              "name": "card1-label",
              "label": "label"
            },
            {
              "component": "text",
              "name": "card1-url",
              "label": "url"
            },
            {
              "component": "text",
              "name": "card1-badge",
              "label": "badge"
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
              "label": "title"
            },
            {
              "component": "text",
              "name": "card2-description",
              "label": "description"
            },
            {
              "component": "text",
              "name": "card2-label",
              "label": "label"
            },
            {
              "component": "text",
              "name": "card2-url",
              "label": "url"
            },
            {
              "component": "text",
              "name": "card2-badge",
              "label": "badge"
            }
          ]
        }
      ]
    }
  ],
  "filters": [
    {
      "id": "filter-section-cards",
      "components": ["filter-section-cards-item"]
    }
  ]
}
```

### Field Mapping Table

| JSON Field Name | data-aue-prop | data-aue-label | Purpose |
|----------------|---------------|----------------|---------|
| `filters-title` | `filters-title` | `filters title` | Block-level title |
| `header-title` | `header-title` | `title` | Section heading |
| `header-description` | `header-description` | `description` | Section description |
| `header-label` | `header-label` | `label` | CTA button text |
| `header-url` | *(in link)* | - | CTA button URL |
| `tag` | `tag` | `tag` | Category tag |
| `card1-title` | `card1-title` | `title` | Card 1 heading |
| `card1-description` | `card1-description` | `description` | Card 1 description |
| `card1-label` | `card1-label` | `label` | Card 1 CTA text |
| `card1-url` | *(in link)* | - | Card 1 CTA URL |
| `card1-badge` | *(not in HTML yet)* | `badge` | Card 1 badge text |
| `card2-title` | `card2-title` | `title` | Card 2 heading |
| `card2-description` | `card2-description` | `description` | Card 2 description |
| `card2-label` | `card2-label` | `label` | Card 2 CTA text |
| `card2-url` | *(in link)* | - | Card 2 CTA URL |
| `card2-badge` | *(not in HTML yet)* | `badge` | Card 2 badge text |

### Instrumented HTML

See [State 1: Instrumented HTML](#state-1-instrumented-html-aem-editor) section above for complete example.

### Clean HTML

See [State 2: Clean HTML](#state-2-clean-html-production) section above for complete example.

### JavaScript Transformation

**File**: `blocks/filter-section-cards/filter-section-cards.js`

The decorator function transforms clean HTML by:

1. **Parsing** the flat structure:
```javascript
const cells = Array.from(row.children);

const headerData = {
  title: getCellText(cells[0]),           // maps to header-title
  description: getCellText(cells[1]),     // maps to header-description
  ctaLabel: getCellText(cells[2]),        // maps to header-label
  ctaUrl: getCellUrl(cells[3]),           // maps to header-url
};
```

2. **Building** semantic HTML:
```javascript
function buildHeader(data) {
  const section = document.createElement('div');
  section.className = 'filter-section-cards-header';

  const h2 = document.createElement('h2');
  h2.textContent = data.title;  // Uses header-title content
  section.appendChild(h2);

  // ... more elements
  return section;
}
```

3. **⚠️ CRITICAL: Preserving Instrumented HTML**:
```javascript
// WRONG: Don't replace - AEM needs the data-aue-* attributes!
// row.replaceWith(container);

// CORRECT: Hide original, append transformed structure
row.style.display = 'none';
row.setAttribute('data-aem-original', 'true');
block.appendChild(container);
```

**Why This Matters**:
- AEM Universal Editor **REQUIRES** the `data-aue-*` attributes to enable editing
- Removing instrumented HTML breaks the authoring experience
- The pattern is: **Hide + Append** (not Replace)

### The Preserve-and-Append Pattern

**CRITICAL RULE**: When transforming blocks, you MUST preserve the original instrumented HTML for AEM editing functionality.

#### The Problem with `replace With()`

```javascript
// ❌ WRONG: This breaks AEM Universal Editor
export default function decorate(block) {
  const rows = Array.from(block.children);
  rows.forEach((row) => {
    const transformed = buildTransformedStructure(row);
    row.replaceWith(transformed);  // ← Removes data-aue-* attributes!
  });
}
```

**Why This Fails**:
1. `replaceWith()` removes the original DOM element
2. Original element contains all `data-aue-*` attributes
3. AEM editor can't find the instrumentation
4. Content becomes uneditable in AEM

#### The Correct Pattern: Hide + Append

```javascript
// ✅ CORRECT: Preserve instrumentation, append transformed structure
export default function decorate(block) {
  const rows = Array.from(block.children);

  rows.forEach((row) => {
    // 1. Parse data from instrumented HTML
    const cells = Array.from(row.children);
    const data = {
      title: getCellText(cells[0]),
      description: getCellText(cells[1]),
      // ... extract all data
    };

    // 2. Build transformed structure
    const transformed = buildTransformedStructure(data);

    // 3. Hide the original (but DON'T remove it!)
    row.style.display = 'none';
    row.setAttribute('data-aem-original', 'true');

    // 4. Append transformed structure to block
    block.appendChild(transformed);
  });
}
```

**Why This Works**:
1. ✅ Original instrumented HTML remains in DOM
2. ✅ AEM editor can find `data-aue-*` attributes
3. ✅ Content is editable in AEM Universal Editor
4. ✅ End users see the transformed structure (original is hidden)

#### CSS Support for Hidden Elements

Add this to your block's CSS file:

```css
/* Hide original instrumented rows (kept for AEM editor) */
.my-block > div[data-aem-original] {
  display: none !important;
}
```

This provides a fallback in case JavaScript doesn't set `display: none` properly.

#### Complete Example

**JavaScript** (`filter-section-cards.js`):
```javascript
export default function decorate(block) {
  const rows = Array.from(block.children);

  rows.forEach((row) => {
    const cells = Array.from(row.children);

    // Extract data
    const headerData = {
      title: getCellText(cells[0]),
      description: getCellText(cells[1]),
      ctaLabel: getCellText(cells[2]),
      ctaUrl: getCellUrl(cells[3]),
    };

    // Build semantic HTML
    const wrapper = document.createElement('div');
    wrapper.className = 'filter-section-cards-wrapper';

    const header = document.createElement('div');
    header.className = 'filter-section-cards-header';

    const h2 = document.createElement('h2');
    h2.textContent = headerData.title;
    header.appendChild(h2);

    wrapper.appendChild(header);

    // CRITICAL: Hide original, append transformed
    row.style.display = 'none';
    row.setAttribute('data-aem-original', 'true');
    block.appendChild(wrapper);
  });
}
```

**CSS** (`filter-section-cards.css`):
```css
.filter-section-cards {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

/* Hide original instrumented rows (kept for AEM editor) */
.filter-section-cards > div[data-aem-original] {
  display: none !important;
}

.filter-section-cards-wrapper {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5%;
}
```

#### Final DOM Structure

After the decorator runs, the DOM looks like this:

```html
<div class="filter-section-cards">
  <!-- Original instrumented HTML (hidden, but present for AEM) -->
  <div data-aem-original="true" style="display: none;"
       data-aue-resource="urn:aemconnection:..."
       data-aue-model="filter-section-cards-item">
    <div data-aue-prop="header-title">New Certifications</div>
    <div data-aue-prop="header-description">Unleash your...</div>
    <!-- ... all instrumented fields ... -->
  </div>

  <!-- Transformed structure (visible to end users) -->
  <div class="filter-section-cards-wrapper">
    <div class="filter-section-cards-header">
      <h2>New Certifications</h2>
      <p>Unleash your unlimited potential...</p>
    </div>
    <!-- ... semantic, styled content ... -->
  </div>
</div>
```

**Benefits**:
- ✅ AEM authors can edit content (instrumentation present)
- ✅ End users see beautiful, semantic HTML (transformed structure)
- ✅ No performance impact (hidden elements don't render)
- ✅ Both authoring and production modes work correctly

#### Testing Both Modes

**AEM Universal Editor** (Authoring):
- Open page in AEM editor
- Click on text fields
- Verify editing controls appear
- Make changes and save
- Confirm changes persist

**Production** (End Users):
- Open page with `npm start`
- Inspect DOM in DevTools
- Verify instrumented HTML is present but hidden
- Verify transformed structure is visible
- Check responsive behavior

---

## Developer Workflows

### Creating Instrumented HTML

**Process**:
1. Author creates content in AEM Universal Editor
2. AEM generates instrumented HTML with `data-aue-*` attributes
3. Instrumented HTML is saved to `instrumented-block.html`

**You don't manually create this file** - it's generated by AEM based on:
- JSON model structure
- Content entered by authors
- AEM's rendering engine

### Creating Clean HTML

**Process**:
1. Copy `instrumented-block.html`
2. Remove all `data-aue-*` attributes
3. Keep structure and content identical
4. Save as `updated-block.html` or `block.html`

**Manual Steps**:
```bash
# Copy instrumented HTML
cp instrumented-block.html updated-block.html

# Remove data-aue-* attributes (manual or script)
# Keep content and structure
```

**Automated Script** (example):
```javascript
// strip-instrumentation.js
const html = fs.readFileSync('instrumented-block.html', 'utf8');
const clean = html.replace(/\s*data-aue-[a-z-]+="[^"]*"/gi, '');
fs.writeFileSync('updated-block.html', clean);
```

### Creating JavaScript Decorator

**Process**:
1. Analyze clean HTML structure
2. Identify data patterns (cell positions)
3. Write transformation logic
4. Build semantic HTML output
5. Test with various content

**Example Pattern Recognition**:
```javascript
// Clean HTML pattern:
// Row → Cells (divs)
// Cell 0 = header-title
// Cell 1 = header-description
// Cell 2 = header-label
// Cell 3 = header-url (link)
// Cell 4 = card1-title
// ... etc

function decorate(block) {
  const rows = Array.from(block.children);
  rows.forEach(row => {
    const cells = Array.from(row.children);
    // Parse based on position
    // Build new structure
    // Replace
  });
}
```

### Testing in AEM vs Production

**AEM Universal Editor**:
- Uses `instrumented-block.html`
- Shows editor controls
- Saves changes to AEM repository
- `data-aue-*` attributes enable editing

**Production (End Users)**:
- Uses `updated-block.html` or `block.html`
- No editor controls
- Clean, fast HTML
- JavaScript decorator transforms to rich UI

**Local Development**:
```bash
npm start  # Serves clean HTML, runs decorator
```

---

## Best Practices

### 1. Maintain Both HTML Versions

✅ **DO**:
- Keep `instrumented-block.html` and `updated-block.html` in sync
- Update both when content changes
- Document any structural differences

❌ **DON'T**:
- Modify one without the other
- Add custom attributes to instrumented HTML
- Change structure in one but not the other

### 2. Use Kebab-Case for Field Names

✅ **DO**:
```json
{
  "name": "header-title",
  "name": "card1-description"
}
```

❌ **DON'T**:
```json
{
  "name": "headerTitle",     // camelCase triggers ESLint errors
  "name": "card1Description"
}
```

**Reason**: Avoids `xwalk/no-orphan-collapsible-fields` ESLint rule violations.

### 3. Match JSON to HTML Exactly

✅ **DO**:
- Every JSON field → one `data-aue-prop` in HTML
- Field names match exactly (case-sensitive)
- Labels match JSON definitions

❌ **DON'T**:
- Skip fields in HTML
- Change field names in HTML
- Use different labels

### 4. Structure Collapsible Containers Properly

✅ **DO**:
```json
{
  "component": "container",
  "name": "card1",
  "collapsible": true,
  "fields": [
    { "name": "card1-title" },    // ← Prefixed
    { "name": "card1-description" }
  ]
}
```

❌ **DON'T**:
```json
{
  "component": "container",
  "name": "card1",
  "fields": [
    { "name": "title" },          // ← No prefix = duplicates
    { "name": "description" }
  ]
}
```

### 5. Document Data Flow

✅ **DO**:
- Comment which cell maps to which field
- Document transformation logic
- Provide mapping tables

Example:
```javascript
// Cell mapping:
// 0: header-title
// 1: header-description
// 2: header-label
// 3: header-url (link)
// 4: card1-title
// 5: card1-description
// ...
```

### 6. Test Both Modes

✅ **DO**:
- Test in AEM Universal Editor (instrumented)
- Test in production (clean + decorator)
- Verify content displays correctly in both

❌ **DON'T**:
- Only test production mode
- Assume decorator works without testing
- Skip AEM editor testing

---

## Troubleshooting

### Issue: Fields Not Editable in AEM

**Symptoms**:
- Can't click to edit text
- No editor controls appear
- Fields appear static

**Causes**:
1. Missing `data-aue-prop` attribute
2. Mismatched field name (JSON vs HTML)
3. Missing `data-aue-type` attribute
4. Incorrect `data-aue-model` value

**Solutions**:
```html
<!-- ❌ WRONG: Missing data-aue-prop -->
<div data-aue-type="text">My Title</div>

<!-- ✅ CORRECT -->
<div data-aue-prop="header-title"
     data-aue-label="title"
     data-aue-type="text">My Title</div>
```

### Issue: Content Not Saving

**Symptoms**:
- Edit text, but changes don't persist
- Refresh page, content reverts

**Causes**:
1. Missing `data-aue-resource` attribute
2. Invalid resource URN
3. Incorrect content path

**Solutions**:
```html
<!-- ❌ WRONG: No resource ID -->
<div data-aue-model="my-block">

<!-- ✅ CORRECT -->
<div data-aue-resource="urn:aemconnection:/content/site/page/jcr:content/..."
     data-aue-model="my-block">
```

### Issue: ESLint Errors on JSON

**Symptoms**:
```
error: Avoid using orphan collapsible field names
error: Do not use duplicate field names
```

**Causes**:
1. Using camelCase in field names (`card1Title`)
2. Duplicate field names across containers
3. Missing container prefix

**Solutions**:
```json
// ❌ WRONG
{
  "name": "card1Title"  // camelCase
}

// ✅ CORRECT
{
  "name": "card1-title"  // kebab-case
}
```

See: `/docs/collapsible-containers-eslint-guide.md`

### Issue: Decorator Not Transforming HTML

**Symptoms**:
- Flat div structure shows in browser
- No semantic HTML
- Styles not applying

**Causes**:
1. Decorator function not exporting correctly
2. Cell parsing logic incorrect
3. Block name mismatch

**Solutions**:

**Check Export**:
```javascript
// ❌ WRONG
function decorate(block) { }

// ✅ CORRECT
export default function decorate(block) { }
```

**Debug Cell Parsing**:
```javascript
export default function decorate(block) {
  const rows = Array.from(block.children);
  console.info('Rows:', rows.length);

  rows.forEach((row, i) => {
    const cells = Array.from(row.children);
    console.info(`Row ${i} cells:`, cells.length);
    cells.forEach((cell, j) => {
      console.info(`  Cell ${j}:`, cell.textContent.substring(0, 50));
    });
  });

  // ... rest of function
}
```

### Issue: Styles Not Loading

**Symptoms**:
- HTML transforms correctly
- No CSS applied
- Elements unstyled

**Causes**:
1. CSS file not loaded
2. Class names mismatch
3. CSS file name doesn't match block name

**Solutions**:

**Check File Naming**:
```
blocks/
  my-block/
    my-block.js     ← Must match
    my-block.css    ← Must match
```

**Check CSS Selectors**:
```css
/* ❌ WRONG: Mismatched class */
.myBlock { }

/* ✅ CORRECT: Matches block name */
.my-block { }
```

---

## Summary Checklist

### For Every Block

- [ ] **JSON Model** (`_blockname.json`)
  - [ ] Unique model IDs
  - [ ] All field names use kebab-case
  - [ ] Collapsible containers have prefixed field names
  - [ ] Filter definitions link parent/child components

- [ ] **Instrumented HTML** (`instrumented-block.html`)
  - [ ] All `data-aue-resource` attributes present
  - [ ] Every field has `data-aue-prop` matching JSON
  - [ ] `data-aue-type` matches field component type
  - [ ] `data-aue-model` matches JSON model ID
  - [ ] `data-aue-label` matches JSON field label

- [ ] **Clean HTML** (`updated-block.html`)
  - [ ] Identical structure to instrumented HTML
  - [ ] NO `data-aue-*` attributes
  - [ ] Same content
  - [ ] Minimal markup

- [ ] **JavaScript Decorator** (`blockname.js`)
  - [ ] Exports default function
  - [ ] Parses clean HTML correctly
  - [ ] Builds semantic HTML
  - [ ] Handles edge cases (empty fields, etc.)
  - [ ] Well-documented

- [ ] **CSS Styles** (`blockname.css`)
  - [ ] File name matches block name
  - [ ] Selectors match class names from decorator
  - [ ] Responsive breakpoints
  - [ ] Accessibility (focus states, etc.)

- [ ] **Testing**
  - [ ] Works in AEM Universal Editor
  - [ ] Works in production (local `npm start`)
  - [ ] Content editable in AEM
  - [ ] Decorator transforms correctly
  - [ ] Styles apply correctly
  - [ ] Responsive design works
  - [ ] No console errors

---

## Additional Resources

- **Project Docs**:
  - `/docs/collapsible-containers-eslint-guide.md` - ESLint rules for JSON models
  - `/docs/filter-section-cards-transformation-plan.md` - Block transformation guide
  - `/docs/filter-section-cards-implementation-summary.md` - Implementation details

- **AEM Documentation**:
  - [AEM Universal Editor](https://experienceleague.adobe.com/docs/experience-manager-cloud-service/content/implementing/developing/universal-editor/introduction.html)
  - [Edge Delivery Services](https://www.aem.live/docs/)

- **Project Files**:
  - `CLAUDE.md` - Project overview and architecture
  - `component-models.json` - Generated from all `_*.json` files
  - `component-definition.json` - Generated component definitions

---

**Document Version**: 1.0
**Last Updated**: 2025-10-11
**Maintainer**: Development Team
