# Chrome Extension Communication Fix

## Issue
The Chrome extension was showing the error:
```
content.js:46 Error loading device ID: Error: Could not establish connection. Receiving end does not exist.
```

## Root Cause
The content script was sending messages to the background script using incorrect message format. The background script expected messages with a `type` property, but the content script was sending plain strings.

## Fixes Applied

### 1. Message Format Correction
**File:** `content-scripts/content.js`

**Before:**
```javascript
const response = await this.sendMessage('GET_DEVICE_INFO');
```

**After:**
```javascript
const response = await this.sendMessage({ type: 'GET_DEVICE_INFO' });
```

### 2. Retry Logic for Service Worker Initialization
**File:** `content-scripts/content.js`

Added retry logic to handle service worker lifecycle in Manifest V3:
```javascript
const sendWithRetry = (attempt = 1) => {
  chrome.runtime.sendMessage(message, (response) => {
    if (chrome.runtime.lastError) {
      if (attempt < 3 && chrome.runtime.lastError.message.includes('Receiving end does not exist')) {
        // Retry after a short delay for service worker initialization
        setTimeout(() => sendWithRetry(attempt + 1), 500);
      } else {
        reject(new Error(chrome.runtime.lastError.message));
      }
    } else {
      resolve(response);
    }
  });
};
```

### 3. Initialization Delay
**File:** `content-scripts/content.js`

Added a small delay to allow background script to initialize:
```javascript
// Wait a moment for background script to initialize
await new Promise(resolve => setTimeout(resolve, 100));
```

### 4. Fallback Device ID
**File:** `content-scripts/content.js`

Added fallback device ID generation if communication fails:
```javascript
} catch (error) {
  console.error('Error loading device ID:', error);
  // Fallback: generate a temporary device ID
  this.deviceId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}
```

### 5. Updated Host Permissions
**File:** `manifest.json`

Added permissions for the new staging domain:
```json
"host_permissions": [
  "https://myl.zip/*",
  "https://*.myl.zip/*",
  "https://api.myl.zip/*",
  "https://zaido.org/*"
]
```

### 6. Updated Content Script Matches
**File:** `manifest.json`

Added staging domain to content script matches:
```json
"matches": ["https://myl.zip/*", "https://zaido.org/*"]
```

## Testing

### Test Page Created
**File:** `test-extension-communication.html`

A test page has been created to verify:
- Extension installation status
- Device info communication
- Authentication communication
- Error handling

### How to Test
1. Load the extension in Chrome
2. Visit `test-extension-communication.html`
3. Click the test buttons to verify communication
4. Check browser console for any remaining errors

## Expected Behavior After Fix

1. **Content script loads** → Waits for background script initialization
2. **Device ID request** → Sends properly formatted message to background script
3. **Background script responds** → Returns device ID and authentication status
4. **Fallback handling** → If communication fails, generates temporary device ID
5. **Retry logic** → Automatically retries failed connections up to 3 times

## Files Modified
- `content-scripts/content.js` - Message format and retry logic
- `manifest.json` - Host permissions and content script matches
- `test-extension-communication.html` - Test page (new)
- `EXTENSION_COMMUNICATION_FIX.md` - This documentation (new)

## Next Steps
1. Reload the Chrome extension in developer mode
2. Test on both `myl.zip` and `zaido.org`
3. Verify no more "Receiving end does not exist" errors
4. Confirm device ID is properly loaded and displayed
