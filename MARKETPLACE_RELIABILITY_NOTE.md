# Web App Documentation Update: Marketplace Reliability

## Important Note for Users

### Current Marketplace Limitation

⚠️ **The marketplace server currently stores package files in ephemeral container storage.** This means:

- Package files may disappear when the marketplace server redeploys
- Import functionality may be temporarily unavailable
- This is a known architectural issue being addressed

### Workarounds

Until the marketplace architecture is improved:

1. **Download Instead of Import:**
   - Click "Download YAML" button
   - Save the file locally
   - Go to Library > Imported
   - Import from your saved file

2. **Re-import if Needed:**
   - If a package disappears from your library
   - Download it again from marketplace
   - Import from the downloaded file

3. **Local Backup:**
   - Keep local copies of important packages
   - Export packages you've customized
   - Version control your package files

### What's Being Fixed

The marketplace is transitioning to use **database storage** for package files, which will:

- ✅ Persist across server deployments
- ✅ Improve reliability
- ✅ Enable horizontal scaling
- ✅ Provide better data integrity

This architectural improvement is being implemented in the marketplace repository.

### Impact on This Web App

The web app (prompt-gen-web) already handles these scenarios gracefully:

- ✅ Clear error messages when packages are unavailable
- ✅ Download option as alternative to import
- ✅ Import from local files functionality
- ✅ Proper error logging for troubleshooting

---

**Last Updated:** 2025 M12 28  
**Status:** Marketplace architectural fix in progress  
**Web App:** Fully functional with workarounds available
