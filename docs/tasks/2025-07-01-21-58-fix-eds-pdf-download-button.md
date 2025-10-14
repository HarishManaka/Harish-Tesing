# Task: Fix EDS PDF Download Button 404 Error

## Overview
Resolve the 404 error when accessing PDF assets on live Edge Delivery Services (EDS) environment by configuring proper asset publishing and link transformation.

## Root Cause Analysis
The issue stems from two architectural problems:
1. **Publishing Failure**: PDF assets not published to EDS Media Bus due to missing paths.json configuration
2. **Linking Failure**: Internal AEM JCR paths (/content/dam/...) used instead of public EDS URLs

## Non-Code Steps (Documentation)

### Step 1: Verify AEM Technical Account Permissions
**Action**: Check technical account access to DAM assets
**Location**: AEM Author Instance > Tools > Security > Users
**Details**:
- Search for users containing `@techacct.adobe.com`
- Verify user has `jcr:read` access to `/content/dam/nasm` path
- If permissions are restrictive, add user to appropriate group or adjust ACLs

**Verification**: User should have read access to `/content/dam/nasm/documents/` folder

### Step 2: Check Dynamic Media License Status
**Action**: Verify Dynamic Media license availability
**Purpose**: Determines which solution path to implement
**Decision Point**:
- **If available**: Use Solution A (Sidekick Plugin) - recommended
- **If unavailable**: Use Solution B (Client-Side Rewriting)

**Verification**: Confirm license status with Adobe account team

### Step 3: Re-publish Content with Updated Configuration
**Action**: Trigger new publishing job after paths.json update
**Location**: AEM Author Environment > Universal Editor > Sidekick
**Steps**:
1. Open page with "Download PDF" button in Universal Editor
2. Activate Sidekick browser extension
3. Click **Publish** button
4. Wait for publishing job to complete

**Verification**: Check direct PDF access at `https://main--nasm--sprucetechnology.aem.page/documents/dummy.pdf`

### Step 4: Update Content Authoring Process
**Action**: Document new authoring workflow for content team
**Content**: Create authoring guidelines document
**Details**:
- If using Solution A: Document Sidekick Asset Selector workflow
- If using Solution B: Document standard AEM path picker usage
- Include step-by-step instructions with screenshots

**Verification**: Content team can successfully create working PDF download buttons

### Step 5: Final Testing and Validation
**Action**: Comprehensive testing of PDF download functionality
**Steps**:
1. Test in incognito/private browser window
2. Verify PDF loads at public URL
3. Confirm download button works on live site
4. Check browser developer tools for correct href attributes

**Verification**: PDF downloads successfully without 404 errors

---

## Commit 1: fix: update paths.json to include DAM assets [docs/tasks/2025-07-01-21-58-fix-eds-pdf-download-button.md]
**Description:**
Update the paths.json configuration file to include the DAM folder mapping for PDF assets. This enables the publishing service to copy PDF files from AEM DAM to EDS Media Bus, making them publicly accessible.

**Files Modified:**
- `paths.json` - Add DAM folder mapping

**Configuration Change:**
```json
{
  "mappings": [
    "/content/nasm/:/",
    "/content/dam/nasm/documents/:/documents/"
  ]
}
```

**Verification:**
1. **Automated Test(s):**
   * **Command:** `curl -I https://main--nasm--sprucetechnology.aem.page/documents/dummy.pdf`
   * **Expected Outcome:** `HTTP/2 200` response with PDF content-type
2. **Logging Check:**
   * **Action:** Monitor AEM publishing logs during re-publish
   * **Expected Log:** `INFO: Publishing assets from /content/dam/nasm/documents/ to /documents/`
   * **Toggle Mechanism:** AEM Cloud Service logging configuration

---

## Commit 2: feat: add client-side DAM link rewriting [docs/tasks/2025-07-01-21-58-fix-eds-pdf-download-button.md]
**Description:**
Implement client-side JavaScript function to automatically rewrite internal AEM DAM paths to their public EDS equivalents. This provides seamless authoring experience while ensuring correct public URLs.

**Files Modified:**
- `scripts/scripts.js` - Add rewriteDamLinks() function

**Implementation:**
```javascript
/**
 * Rewrites internal AEM DAM paths in anchor tags to their public-facing
 * equivalents for the Edge Delivery Services environment.
 */
function rewriteDamLinks() {
  document.querySelectorAll('a[href^="/content/dam/"]').forEach((link) => {
    try {
      const originalPath = new URL(link.href).pathname;
      
      if (originalPath.startsWith('/content/dam/nasm/documents/')) {
        const newPath = originalPath.replace('/content/dam/nasm/documents/', '/documents/');
        link.href = newPath;
        console.log('DAM link rewritten:', originalPath, '->', newPath);
      }
    } catch (e) {
      console.error('Failed to rewrite DAM link:', link.href, e);
    }
  });
}

// Call after page decoration
rewriteDamLinks();
```

**Verification:**
1. **Automated Test(s):**
   * **Command:** `npm test -- --grep scripts.test.js`
   * **Expected Outcome:** Test confirms rewriteDamLinks() transforms /content/dam/nasm/documents/dummy.pdf to /documents/dummy.pdf
2. **Logging Check:**
   * **Action:** Open browser console on page with PDF download button
   * **Expected Log:** `DAM link rewritten: /content/dam/nasm/documents/dummy.pdf -> /documents/dummy.pdf`
   * **Toggle Mechanism:** Browser console logging (always enabled for debugging)

---

## Commit 3: docs: add PDF asset management guidelines [docs/tasks/2025-07-01-21-58-fix-eds-pdf-download-button.md]
**Description:**
Create comprehensive documentation for content authors and developers on proper PDF asset management in EDS environment, including troubleshooting steps and best practices.

**Files Created:**
- `docs/PDF_ASSET_MANAGEMENT.md` - Complete guide for PDF assets
- `docs/AUTHORING_GUIDELINES.md` - Content author workflow documentation

**Content Includes:**
- Step-by-step authoring workflows
- Troubleshooting common issues
- Best practices for asset organization
- Verification checklists

**Verification:**
1. **Automated Test(s):**
   * **Command:** `npm test -- --grep docs.test.js`
   * **Expected Outcome:** Documentation validation passes, all links are valid
2. **Logging Check:**
   * **Action:** Review documentation completeness
   * **Expected Log:** Documentation covers all identified use cases and edge cases
   * **Toggle Mechanism:** Documentation review process

---

## Commit 4: test: add PDF download functionality tests [docs/tasks/2025-07-01-21-58-fix-eds-pdf-download-button.md]
**Description:**
Create comprehensive test suite to verify PDF download functionality works correctly in both AEM preview and live EDS environments, including edge cases and error scenarios.

**Files Created:**
- `tests/unit/pdf-download.test.js` - Unit tests for link rewriting
- `tests/integration/pdf-asset-publishing.test.js` - Integration tests for asset publishing
- `tests/e2e/pdf-download-button.test.js` - End-to-end tests for complete workflow

**Test Coverage:**
- Link rewriting functionality
- Asset publishing verification
- Error handling scenarios
- Cross-browser compatibility

**Verification:**
1. **Automated Test(s):**
   * **Command:** `npm test -- --grep pdf-download`
   * **Expected Outcome:** All tests pass, 100% coverage of PDF download functionality
2. **Logging Check:**
   * **Action:** Run tests with verbose logging
   * **Expected Log:** `INFO: PDF download tests completed successfully`
   * **Toggle Mechanism:** `TEST_LOG_LEVEL=info`

---

## Success Criteria
- [ ] PDF assets publish successfully to EDS Media Bus
- [ ] Download buttons work on live site without 404 errors
- [ ] Content authors can create PDF download buttons using documented workflow
- [ ] All tests pass with comprehensive coverage
- [ ] Documentation is complete and accessible to team

## Rollback Plan
If issues arise:
1. Revert paths.json changes to previous configuration
2. Remove client-side rewriting code
3. Restore original authoring workflow documentation
4. Re-run tests to confirm system stability 