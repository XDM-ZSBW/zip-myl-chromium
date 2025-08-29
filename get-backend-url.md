# Myl.Zip Backend Configuration

## Local Development Setup
The extension is now configured to use the local development backend:
**http://localhost:3000**

## Configuration Files Updated
All configuration files have been updated with the localhost URL:

1. **config.js** - Main configuration
2. **background.js** - Background service worker
3. **settings.js** - Settings page defaults
4. **settings.html** - Settings page placeholder
5. **apiClient.js** - API client fallback
6. **manifest.json** - Host permissions

## Backend Requirements
The backend must support CORS for chrome-extension origins and provide these endpoints:

- **GET /health** - Health check
- **POST /api/v1/auth/login** - Authentication
- **POST /api/v1/thoughts** - Save thoughts
- **GET /api/v1/thoughts** - Retrieve thoughts

## Testing Connection

### Method 1: Extension Popup
1. Open the extension popup
2. Click "Backend" button
3. Click "Test Connection" to verify the backend is accessible

### Method 2: Browser Console
1. Open any webpage
2. Open browser console (F12)
3. Run the test script from `test-backend-connection.js`

### Method 3: Direct API Test
```bash
curl http://localhost:3000/health
```

## Extension Features
- ✅ **Direct API calls** (no chrome.runtime.sendMessage for backend)
- ✅ **Connection status indicator** in popup
- ✅ **Offline handling** with request queuing
- ✅ **Authentication flow** with device-based login
- ✅ **Real-time status updates** every 2 seconds
- ✅ **Context invalidation handling** (graceful extension reload support)
- ✅ **Automatic reinitialization** after extension updates

## Extension ID
The extension ID is: `fdamobdhhbopocjjgkamfdgioogfmmmn`

Make sure your backend CORS configuration includes this extension ID!

## Troubleshooting

### Extension Context Invalidation Error
If you see "Extension context invalidated" errors:

1. **Reload the extension** in Chrome's extension management page
2. **Refresh the webpage** where the extension is active
3. **Check the console** for reinitialization messages

The extension now handles context invalidation gracefully and will automatically reinitialize when possible.

### Connection Issues
If the extension can't connect to the backend:

1. **Verify backend is running**: `curl http://localhost:3000/health`
2. **Check CORS configuration** in your backend
3. **Test with browser console**: Use `test-backend-connection.js`
4. **Check extension permissions** in Chrome settings

### Testing Tools
- **test-backend-connection.js**: Test backend connectivity
- **test-context-validation.js**: Test extension context validation
- **Extension popup**: Use "Backend" → "Test Connection" button
