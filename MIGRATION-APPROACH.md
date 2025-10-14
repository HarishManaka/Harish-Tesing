# NASM Content Migration Approach

**Ticket**: [NAS-260](https://ascend-learning.atlassian.net/browse/NAS-260)

## Overview

This document outlines the repeatable approach for migrating legacy NASM layout HTML, CSS, and JavaScript into EDS-compatible blocks using AEM with Universal Editor. The migration will focus on two high-priority pages (Homepage and CPT page) as a proof of concept to validate the broader migration strategy.

## Migration Assets and Structure

### Legacy Site Reference
- **Location**: `legacy/` folder (gitignored)
- **Purpose**: Complete existing website snapshot for reference during migration
- **Usage**: Developers should analyze legacy page structure, identify reusable components, and extract patterns

### CSS Migration Strategy
- **Legacy Styles**: All existing NASM CSS has been consolidated into `styles/legacy-styles.css`. We've also addressed any linter warnings to allow git workflows to pass.
- **Migration Process**:
  1. Identify CSS classes used in the legacy component
  2. Extract relevant styles from `legacy-styles.css`
  3. Move styles to the appropriate `blocks/<block-name>/<block-name>.css` file
  4. Refactor styles to follow EDS patterns where necessary
  5. Remove migrated styles from `legacy-styles.css` once confirmed working
- **Goal**: Progressively reduce `legacy-styles.css` size until it contains no legacy NASM classes

### JavaScript Migration Strategy
- **Legacy Scripts**: All existing JavaScript code is stored in `scripts/nasmlibraries/`
  - `atlas/atlas.js` - Atlas framework utilities
  - `hermes.js` - Messaging/communication library
  - `nasm-*.js` - NASM-specific functionality
  - `slick-min.js`, `swiper-bundle.min.js` - Third-party libraries
- **Migration Decision Tree**:
  1. **Reuse**: If code is EDS-compatible, integrate directly
  2. **Modify**: Refactor code to work with EDS patterns
  3. **Rebuild**: Create new implementation if legacy code is incompatible
  4. **Document**: Note any functionality that cannot be migrated with recommended alternatives

## Block Development Process

### 1. Analyze Legacy Component
- Review legacy HTML structure in `legacy/` folder
- Identify CSS classes and JavaScript dependencies
- Document component behavior and interactions

### 2. Create EDS Block Structure
```
blocks/
└── <block-name>/
    ├── <block-name>.js      # Block decorator function
    ├── <block-name>.css     # Block-specific styles
    └── _<block-name>.json   # Component model definition
```

### 3. Update Component Registry
1. Add block name to `models/_common-blocks.json` array
2. Add block reference to `models/_component-definition.json`:
   ```json
   {
     "...": "../blocks/<block-name>/_*.json#/definitions"
   }
   ```

### 4. Migrate Styles
- Extract relevant CSS from `legacy-styles.css`
- Adapt styles to EDS patterns
- Ensure responsive behavior
- Test cross-browser compatibility

### 5. Migrate Functionality
- Review JavaScript in `scripts/nasmlibraries/`
- Determine migration approach (reuse/modify/rebuild)
- Implement using EDS patterns and APIs
- Leverage Adobe Commerce dropins where applicable

### 6. Test and Validate
- Test block in local development environment
- Verify in staging/authoring environment
- Ensure AEM Universal Editor compatibility

## Content Migration Process

Once UI blocks are developed:

1. **Author Content in AEM**
   - Use Universal Editor to recreate page structure
   - Apply migrated blocks to match legacy layout
   - This is a manual process requiring dev and content team involvement

2. **Validate Migration**
   - Compare rendered output with legacy site
   - Verify all functionality works as expected
   - Check responsive behavior and accessibility

3. **Document in Migration Map**
   - Track which pages have been migrated
   - Note any issues or deviations
   - Record content authoring decisions

## Migration Tracking

### Migration Map Document
The migration map is tracked separately as part of ticket NAS-256. It includes:
- List of all legacy URLS to migrate
- Status of each page (Not Started, In Progress, Completed)
- Content authoring notes

### Progress Metrics
- Number of blocks migrated
- Lines of CSS removed from `legacy-styles.css`
- JavaScript libraries successfully integrated
- Pages fully migrated and validated