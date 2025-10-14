# Filter Section Cards Block - Transformation Plan

## Objective
Transform the `filter-section-cards` block to match the structure and styling of the `[data-item="specializations"]` section on https://www.nasm.org/whats-new

## Analysis Summary

### Target Structure (NASM.org)
```html
<div class="crc-resource-list-category" data-item="specializations">
  <!-- Header Section -->
  <div class="crc-resource-list-category-content">
    <h2>New Specializations</h2>
    <p>Maintain your momentum with our latest specializations.</p>
    <a class="nasm-primary-btn-dark" href="/products?product=specializations">Learn More</a>
  </div>

  <!-- Card 1 -->
  <div class="crc-resource-list-item crc-half-width-item">
    <div class="resource-list-item-img">
      <img src="/images/...">
    </div>
    <div class="resource-list-item-content">
      <h3>MMA Conditioning Specialization</h3>
      <p>Add combat sports to your programming...</p>
      <div class="resource-list-item-meta">
        <a href="..." class="download-now-link">View Course</a>
        <span class="resource-item-type">Specialization</span>
      </div>
    </div>
  </div>

  <!-- Card 2 -->
  <div class="crc-resource-list-item crc-half-width-item">
    <!-- Same structure as Card 1 -->
  </div>
</div>
```

### Target Styles
- **Container**: `display: flex`, `flex-direction: row`, `gap: 1.5%`, `width: 900px`
- **Header**: Full width, margin-bottom: 30px
- **Cards**: 49.25% width each (half-width), margin-bottom: 30px

### Current Structure Issues
1. ❌ Flat div structure with nested paragraphs
2. ❌ No semantic HTML structure
3. ❌ No proper container hierarchy
4. ❌ Minimal CSS (only `color: red`)
5. ❌ No JavaScript transformation logic

## Step-by-Step Transformation Plan

### Phase 1: JavaScript Decorator Function ✅ PRIORITY
**File**: `filter-section-cards.js`

Transform the flat HTML structure into semantic, styled components.

**Steps**:
1. Parse the block's rows to extract data
2. Create header section with h2, description, and CTA button
3. Create card containers with proper structure
4. Add placeholder images
5. Apply classes for styling
6. Add data attributes for filtering

**Data Mapping** (based on JSON model):
```
Row structure from block.html:
- header-title → h2
- header-description → p
- header-label → button text
- header-url → button href
- card1-title → h3
- card1-description → p
- card1-label → CTA text
- card1-url → CTA href
- card1-badge → badge text
- card1-tags → data-tags attribute
(Same for card2)
```

### Phase 2: CSS Styling ✅
**File**: `filter-section-cards.css`

Implement responsive flexbox layout matching NASM.org design.

**Key Styles Needed**:
- Container flexbox with gap
- Header full-width section
- Cards 50% width in desktop, 100% in mobile
- Image aspect ratio and styling
- Typography hierarchy
- Button/CTA styling
- Badge/tag styling

### Phase 3: HTML Structure Update (Reference) ✅
**File**: `block.html` (for documentation)

The current HTML is the raw output from AEM. The JavaScript will transform it, but document the expected structure.

### Phase 4: Testing ✅
Test the transformed block:
1. Local development server
2. Responsive breakpoints
3. Content variations
4. Filter functionality (if applicable)

## Detailed Implementation Steps

### Step 1: Update JavaScript Decorator (CURRENT TASK)

**Pseudocode**:
```javascript
export default function decorate(block) {
  // 1. Extract all rows
  const rows = Array.from(block.children);

  // 2. Process each section (each section = 1 item)
  rows.forEach(row => {
    // Extract data from row cells
    const cells = Array.from(row.children);

    // Parse header data (first 4 cells)
    const headerData = {
      title: cells[0]?.textContent,
      description: cells[1]?.textContent,
      ctaLabel: cells[2]?.textContent,
      ctaUrl: cells[3]?.querySelector('a')?.href
    };

    // Parse card1 data (cells 4-9)
    const card1Data = {
      title: cells[4]?.textContent,
      description: cells[5]?.textContent,
      ctaLabel: cells[6]?.textContent,
      ctaUrl: cells[7]?.querySelector('a')?.href,
      badge: cells[8]?.textContent,
      tags: cells[9]?.textContent?.split(',')
    };

    // Parse card2 data (cells 10-15)
    const card2Data = { /* similar */ };

    // Build new structure
    const container = buildContainer(headerData, card1Data, card2Data);
    row.replaceWith(container);
  });
}

function buildContainer(header, card1, card2) {
  // Create wrapper
  const wrapper = document.createElement('div');
  wrapper.className = 'filter-section-cards-wrapper';

  // Build header section
  const headerSection = buildHeader(header);
  wrapper.appendChild(headerSection);

  // Build card 1
  const card1Element = buildCard(card1);
  wrapper.appendChild(card1Element);

  // Build card 2
  const card2Element = buildCard(card2);
  wrapper.appendChild(card2Element);

  return wrapper;
}

function buildHeader(data) {
  const section = document.createElement('div');
  section.className = 'filter-section-cards-header';

  const h2 = document.createElement('h2');
  h2.textContent = data.title;
  section.appendChild(h2);

  const p = document.createElement('p');
  p.textContent = data.description;
  section.appendChild(p);

  const a = document.createElement('a');
  a.href = data.ctaUrl;
  a.textContent = data.ctaLabel;
  a.className = 'filter-section-cards-cta button primary';
  section.appendChild(a);

  return section;
}

function buildCard(data) {
  const card = document.createElement('div');
  card.className = 'filter-section-cards-item';

  // Add data attributes for filtering
  if (data.tags) {
    card.dataset.tags = data.tags.join(',');
  }

  // Image container with placeholder
  const imageContainer = document.createElement('div');
  imageContainer.className = 'filter-section-cards-item-img';
  const img = document.createElement('img');
  img.src = 'https://via.placeholder.com/400x200?text=Placeholder';
  img.alt = data.title;
  imageContainer.appendChild(img);
  card.appendChild(imageContainer);

  // Content container
  const content = document.createElement('div');
  content.className = 'filter-section-cards-item-content';

  const h3 = document.createElement('h3');
  h3.textContent = data.title;
  content.appendChild(h3);

  const p = document.createElement('p');
  p.textContent = data.description;
  content.appendChild(p);

  // Meta section (CTA + Badge)
  const meta = document.createElement('div');
  meta.className = 'filter-section-cards-item-meta';

  const cta = document.createElement('a');
  cta.href = data.ctaUrl;
  cta.textContent = data.ctaLabel;
  cta.className = 'filter-section-cards-link';
  meta.appendChild(cta);

  if (data.badge) {
    const badge = document.createElement('span');
    badge.className = 'filter-section-cards-badge';
    badge.textContent = data.badge;
    meta.appendChild(badge);
  }

  content.appendChild(meta);
  card.appendChild(content);

  return card;
}
```

### Step 2: Create CSS Styles

**Structure**:
```css
/* Container */
.filter-section-cards {
  /* Base styles */
}

.filter-section-cards-wrapper {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5%;
  margin: 30px 0;
}

/* Header Section */
.filter-section-cards-header {
  flex: 0 0 100%;
  margin-bottom: 30px;
}

.filter-section-cards-header h2 {
  /* Typography */
}

.filter-section-cards-header p {
  /* Typography */
}

.filter-section-cards-cta {
  /* Button styles */
}

/* Card Items */
.filter-section-cards-item {
  flex: 0 0 49.25%;
  margin-bottom: 30px;
}

.filter-section-cards-item-img {
  /* Image container */
}

.filter-section-cards-item-img img {
  width: 100%;
  height: auto;
  display: block;
}

.filter-section-cards-item-content {
  /* Content padding/spacing */
}

.filter-section-cards-item-content h3 {
  /* Typography */
}

.filter-section-cards-item-content p {
  /* Typography */
}

.filter-section-cards-item-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-section-cards-link {
  /* CTA link styles */
}

.filter-section-cards-badge {
  /* Badge styles */
}

/* Responsive */
@media (max-width: 768px) {
  .filter-section-cards-item {
    flex: 0 0 100%;
  }
}
```

### Step 3: Testing Checklist

- [ ] Block renders with correct HTML structure
- [ ] Header section displays properly
- [ ] Cards display side-by-side on desktop
- [ ] Cards stack on mobile
- [ ] Placeholder images load
- [ ] CTAs are clickable
- [ ] Badges display correctly
- [ ] Tags data attributes are present
- [ ] Responsive behavior works
- [ ] Multiple block instances work
- [ ] No console errors

## Expected Final Structure

```html
<div class="filter-section-cards block">
  <div class="filter-section-cards-wrapper">
    <!-- Header -->
    <div class="filter-section-cards-header">
      <h2>New Specializations</h2>
      <p>Maintain your momentum with our latest specializations.</p>
      <a href="/products?product=specializations" class="filter-section-cards-cta button primary">Learn More</a>
    </div>

    <!-- Card 1 -->
    <div class="filter-section-cards-item" data-tags="certifications">
      <div class="filter-section-cards-item-img">
        <img src="https://via.placeholder.com/400x200" alt="card 1 t">
      </div>
      <div class="filter-section-cards-item-content">
        <h3>card 1 t</h3>
        <p>card 1 description</p>
        <div class="filter-section-cards-item-meta">
          <a href="/nasm?q=card1" class="filter-section-cards-link">card 1 label</a>
          <span class="filter-section-cards-badge">badge text</span>
        </div>
      </div>
    </div>

    <!-- Card 2 -->
    <div class="filter-section-cards-item" data-tags="certifications,specializations">
      <!-- Same structure -->
    </div>
  </div>
</div>
```

## Implementation Order

1. ✅ **JavaScript** - Transform structure (HIGHEST PRIORITY)
2. ✅ **CSS** - Style the components
3. ✅ **Testing** - Verify functionality
4. ✅ **Documentation** - Update block README if needed

## Notes

- Use placeholder image service: `https://via.placeholder.com/400x200?text=Placeholder`
- Maintain semantic HTML (h2, h3, etc.)
- Ensure accessibility (alt text, proper heading hierarchy)
- Follow project coding standards (ESLint, Stylelint)
- Test with multiple content variations
- Consider adding filter/category functionality later

## References

- Target URL: https://www.nasm.org/whats-new
- Target Element: `[data-item="specializations"]`
- JSON Model: `blocks/filter-section-cards/_filter-section-cards.json`
- Current Files:
  - `blocks/filter-section-cards/block.html`
  - `blocks/filter-section-cards/filter-section-cards.js`
  - `blocks/filter-section-cards/filter-section-cards.css`
