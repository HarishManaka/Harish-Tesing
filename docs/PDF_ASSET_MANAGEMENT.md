# PDF Asset Management in Edge Delivery Services

## Overview

This guide covers the proper management of PDF assets in the Edge Delivery Services (EDS) environment, including publishing configuration, link transformation, and troubleshooting common issues.

## Architecture Overview

### EDS Storage Model
EDS uses three distinct "buses" for content delivery:
- **Code Bus**: Front-end code (CSS, JavaScript, HTML templates)
- **Content Bus**: Structured content (HTML pages, JSON data)
- **Media Bus**: Binary assets (images, videos, PDFs)

### Asset Publishing Flow
1. PDF assets stored in AEM DAM (`/content/dam/nasm/documents/`)
2. Publishing service copies assets to EDS Media Bus
3. Assets become accessible at public URLs (`/documents/`)
4. Client-side script transforms internal paths to public URLs

## Configuration

### paths.json Setup
The `paths.json` file controls asset publishing scope and URL mapping:

```json
{
  "mappings": [
    "/content/nasm/:/",
    "/content/dam/nasm/documents/:/documents/"
  ],
  "includes": [
    "/content/nasm/",
    "/content/dam/nasm/"
  ]
}
```

**Key Points:**
- `mappings` defines URL transformation rules
- `includes` defines publishing scope
- Both are required for proper asset delivery

### Technical Account Permissions
Ensure the EDS technical account has read access to DAM assets:
- User format: `<hash>@techacct.adobe.com`
- Required permission: `jcr:read` on `/content/dam/nasm/`
- Check in AEM: Tools > Security > Users

## Authoring Workflows

### Option A: Dynamic Media (Recommended)
If Dynamic Media license is available:

1. **Open Universal Editor** for the target page
2. **Activate Sidekick** browser extension
3. **Click "Assets"** button in Sidekick
4. **Search and select** desired PDF file
5. **Copy reference URL** (Dynamic Media delivery URL)
6. **Paste URL** into button/link field
7. **Save and publish** page

**Benefits:**
- Uses official Adobe architecture
- Public URLs from the start
- No client-side transformation needed
- Future-proof solution

### Option B: Standard AEM Path Picker
If Dynamic Media is not available:

1. **Open Universal Editor** for the target page
2. **Use standard AEM path picker** to select PDF
3. **Select internal path** (e.g., `/content/dam/nasm/documents/dummy.pdf`)
4. **Save and publish** page
5. **Client-side script** automatically transforms paths

**Benefits:**
- Familiar authoring experience
- Works with existing AEM workflows
- Automatic path transformation

## Link Transformation

### Client-Side Rewriting
The `rewriteDamLinks()` function automatically transforms internal paths:

```javascript
// Internal AEM path
/content/dam/nasm/documents/dummy.pdf

// Transformed to public EDS path
/documents/dummy.pdf
```

### Manual URL Construction
For direct access, use the public URL pattern:
```
https://[site].aem.page/documents/[filename].pdf
```

## Troubleshooting

### 404 Errors on PDF Access

**Check Publishing Configuration:**
1. Verify `paths.json` has correct DAM mapping
2. Confirm technical account permissions
3. Re-publish content after configuration changes

**Check Asset Availability:**
```bash
curl -I https://[site].aem.page/documents/[filename].pdf
```

**Expected Response:**
```
HTTP/2 200
content-type: application/pdf
```

### Link Transformation Issues

**Check Browser Console:**
- Look for "DAM link rewritten" messages
- Check for transformation errors

**Verify Function Execution:**
- Ensure `rewriteDamLinks()` runs after page decoration
- Check for JavaScript errors

### Publishing Failures

**Common Causes:**
1. Insufficient technical account permissions
2. Incorrect paths.json configuration
3. Asset not found in specified DAM path
4. Network connectivity issues

**Debugging Steps:**
1. Check AEM publishing logs
2. Verify asset exists in DAM
3. Test technical account access
4. Validate paths.json syntax

## Best Practices

### Asset Organization
- Use consistent folder structure in DAM
- Group related assets together
- Use descriptive filenames
- Maintain version control for important documents

### URL Management
- Always use relative paths when possible
- Test links in both preview and live environments
- Monitor for broken links regularly
- Document any custom URL patterns

### Performance Optimization
- Compress PDFs before upload
- Use appropriate file sizes for web delivery
- Consider lazy loading for large documents
- Monitor Media Bus usage

### Security Considerations
- Only publish assets that should be publicly accessible
- Review DAM permissions regularly
- Use secure file naming conventions
- Monitor access logs for unusual patterns

## Monitoring and Maintenance

### Regular Checks
- [ ] Verify PDF accessibility on live site
- [ ] Test link transformation functionality
- [ ] Review publishing logs for errors
- [ ] Check technical account permissions
- [ ] Validate paths.json configuration

### Performance Monitoring
- [ ] Monitor Media Bus storage usage
- [ ] Track PDF download metrics
- [ ] Review page load times
- [ ] Check for broken links

### Documentation Updates
- [ ] Update authoring guidelines as needed
- [ ] Document any configuration changes
- [ ] Maintain troubleshooting procedures
- [ ] Keep asset inventory current

## Support Resources

### Official Documentation
- [AEM Edge Delivery Services](https://www.aem.live/docs/)
- [Path Mapping Guide](https://www.aem.live/developer/authoring-path-mapping)
- [Universal Editor Assets](https://www.aem.live/docs/universal-editor-assets)

### Community Resources
- Adobe Experience League Community
- AEM Edge Delivery Services forums
- GitHub repositories and examples

### Internal Contacts
- Technical team for configuration issues
- Content team for authoring questions
- Adobe support for licensing and platform issues 