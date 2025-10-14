# Content Authoring Guidelines for PDF Assets

## Quick Start Guide

### For Content Authors
This guide helps you create working PDF download buttons in the Edge Delivery Services environment.

## Prerequisites

### Required Access
- AEM Universal Editor access
- Sidekick browser extension installed
- DAM folder permissions for PDF assets

### Dynamic Media License Check
**Before starting, verify if your organization has a Dynamic Media license:**
- Contact your Adobe account team
- Check with your technical administrator
- This determines which workflow to use

## Workflow Selection

### Option A: Dynamic Media Workflow (Recommended)
**Use this if you have a Dynamic Media license**

**Step-by-Step Instructions:**

1. **Open the Page**
   - Navigate to your page in AEM Universal Editor
   - Click "Edit" to enter editing mode

2. **Add Download Button Block**
   - Click the "+" button to add a new block
   - Search for and select "Download Button" or "Button" block
   - Place it in the desired location on the page

3. **Configure the Button**
   - Click on the button block to open its configuration
   - Fill in the "Text" field (e.g., "Download PDF", "View Document")
   - Leave the "Link" field empty for now

4. **Select PDF Asset**
   - Open the Sidekick browser extension
   - Click the "Assets" button (may be labeled differently)
   - Search for your PDF file in the asset selector
   - Click on the PDF to select it

5. **Copy the Reference URL**
   - The asset selector will copy a reference URL to your clipboard
   - This URL will look like: `https://.../delivery/...?id=...`
   - **Important**: This is a public, Dynamic Media URL

6. **Paste the URL**
   - Return to the Universal Editor
   - Paste the copied URL into the "Link" field of your button
   - Save the button configuration

7. **Publish the Page**
   - Use the Sidekick to publish the page
   - Wait for the publishing process to complete

8. **Test the Button**
   - Navigate to the live page
   - Click the download button
   - Verify the PDF opens or downloads correctly

**Benefits of This Workflow:**
- ✅ Uses official Adobe architecture
- ✅ No technical configuration needed
- ✅ Works immediately after publishing
- ✅ Future-proof solution

### Option B: Standard AEM Workflow
**Use this if you don't have Dynamic Media license**

**Step-by-Step Instructions:**

1. **Open the Page**
   - Navigate to your page in AEM Universal Editor
   - Click "Edit" to enter editing mode

2. **Add Download Button Block**
   - Click the "+" button to add a new block
   - Search for and select "Download Button" or "Button" block
   - Place it in the desired location on the page

3. **Configure the Button**
   - Click on the button block to open its configuration
   - Fill in the "Text" field (e.g., "Download PDF", "View Document")

4. **Select PDF Using Path Picker**
   - In the "Link" field, click the path picker icon
   - Navigate to: `/content/dam/nasm/documents/`
   - Select your PDF file
   - The path will look like: `/content/dam/nasm/documents/your-file.pdf`

5. **Save and Publish**
   - Save the button configuration
   - Use the Sidekick to publish the page
   - Wait for the publishing process to complete

6. **Test the Button**
   - Navigate to the live page
   - Click the download button
   - The client-side script will automatically transform the path
   - Verify the PDF opens or downloads correctly

**Important Notes:**
- The internal path will be automatically converted to a public URL
- This transformation happens on the client side
- The button will work on both preview and live environments

## Common Scenarios

### Adding Multiple PDF Downloads

**For a single page with multiple PDFs:**
1. Follow the workflow above for each PDF
2. Use descriptive button text for each document
3. Consider organizing related PDFs in the same section

**For a document library page:**
1. Create a list or grid layout
2. Add individual download buttons for each document
3. Use consistent naming conventions

### Updating Existing PDF Links

**If a PDF has been replaced:**
1. Upload the new PDF to the same DAM location
2. Use the same filename to maintain existing links
3. Or update the link using the appropriate workflow above

**If a PDF has been moved:**
1. Update the link using the path picker
2. Re-publish the page
3. Test the new link

### Troubleshooting Common Issues

**Button doesn't work on live site:**
- [ ] Verify the page has been published
- [ ] Check if the PDF exists in the DAM
- [ ] Ensure the PDF is in the correct folder (`/content/dam/nasm/documents/`)
- [ ] Test the direct PDF URL: `https://[site].aem.page/documents/[filename].pdf`

**PDF shows 404 error:**
- [ ] Check if the asset was published to EDS Media Bus
- [ ] Verify technical account permissions
- [ ] Contact technical team to check paths.json configuration

**Link transformation not working:**
- [ ] Open browser developer tools
- [ ] Check console for "DAM link rewritten" messages
- [ ] Look for JavaScript errors
- [ ] Verify the page uses the latest scripts

## Best Practices

### File Management
- **Use descriptive filenames**: `product-manual-v2.1.pdf` instead of `doc1.pdf`
- **Organize in folders**: Group related documents together
- **Version control**: Use version numbers in filenames for important documents
- **File size**: Keep PDFs under 10MB for better user experience

### Button Configuration
- **Clear text**: Use descriptive button text like "Download User Manual" instead of "Download"
- **Accessibility**: Include alt text and proper ARIA labels
- **Consistent styling**: Use the same button style across similar downloads
- **Mobile-friendly**: Test buttons on mobile devices

### Content Organization
- **Logical grouping**: Place related downloads together
- **Clear hierarchy**: Use headings to organize download sections
- **Context**: Provide brief descriptions for complex documents
- **Updates**: Keep download links current and remove outdated documents

## Support and Resources

### When to Contact Technical Team
- PDFs returning 404 errors consistently
- Link transformation not working
- Publishing failures
- Configuration changes needed

### When to Contact Content Team
- Workflow questions
- Best practices guidance
- Content organization help
- Training requests

### Self-Service Resources
- [PDF Asset Management Guide](../PDF_ASSET_MANAGEMENT.md)
- [AEM Universal Editor Documentation](https://www.aem.live/docs/universal-editor)
- [Sidekick Extension Guide](https://www.aem.live/docs/aem-assets-sidekick-plugin)

## Quick Reference

### Dynamic Media Workflow
1. Edit page → Add button → Sidekick Assets → Copy URL → Paste → Publish

### Standard AEM Workflow  
1. Edit page → Add button → Path picker → Select PDF → Publish

### Testing Checklist
- [ ] Button appears correctly on page
- [ ] Button works in preview environment
- [ ] Button works on live site
- [ ] PDF opens/downloads correctly
- [ ] No console errors in browser

### Common File Paths
- **DAM Location**: `/content/dam/nasm/documents/`
- **Public URL**: `https://[site].aem.page/documents/[filename].pdf`
- **Internal Path**: `/content/dam/nasm/documents/[filename].pdf` 