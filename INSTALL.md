# Installation Guide - Myl.Zip Chromium Extension

## Quick Installation

### Method 1: Load Unpacked Extension (Recommended for Development)

1. **Download the Extension**
   - Clone this repository or download the ZIP file
   - Extract to a folder on your computer

2. **Open Chrome Extensions Page**
   - Open Chrome browser
   - Navigate to `chrome://extensions/`
   - Or go to Menu → More Tools → Extensions

3. **Enable Developer Mode**
   - Toggle the "Developer mode" switch in the top-right corner

4. **Load the Extension**
   - Click "Load unpacked" button
   - Select the folder containing the extension files
   - The extension will be installed and ready to use

### Method 2: Generate Icons (Optional)

If you want to generate the PNG icons:

1. **Open Icon Generator**
   - Open `generate-icons.html` in your browser
   - Click "Download" for each icon size (16x16, 32x32, 48x48, 128x128)
   - Save the downloaded PNG files to the `icons/` folder

2. **Replace SVG with PNG**
   - The extension will work with the SVG icon, but PNG icons are recommended for better compatibility

## Verification

After installation, you should see:

1. **Extension Icon** in the Chrome toolbar
2. **Extension Listed** in `chrome://extensions/` with "Enabled" status
3. **Popup Interface** when clicking the extension icon
4. **Context Menu** when right-clicking on web pages

## First Use

1. **Click the Extension Icon** to open the popup
2. **Configure Settings** by clicking the settings button
3. **Start Typing** on any webpage to see the visual feedback
4. **Test Features** like thought tracking and run-on detection

## Troubleshooting

### Extension Not Loading
- Ensure all files are in the same folder
- Check that `manifest.json` is present and valid
- Verify Chrome version is 88.0.0 or higher

### Visual Feedback Not Working
- Check that the extension has permission to access the current page
- Verify visual feedback is enabled in settings
- Try refreshing the webpage

### Settings Not Saving
- Ensure Chrome storage permissions are granted
- Check browser console for errors
- Try disabling and re-enabling the extension

### Icons Not Displaying
- Generate PNG icons using `generate-icons.html`
- Ensure icon files are in the `icons/` folder
- Check file permissions

## Uninstallation

1. Go to `chrome://extensions/`
2. Find "Myl.Zip - Intelligent Thought Assistant"
3. Click "Remove"
4. Confirm removal

## Development Mode

When loaded as an unpacked extension:

- **Auto-reload**: Changes to files will require manual reload
- **Console Logs**: Check browser console for debugging information
- **Permissions**: Extension has full permissions for development

## Production Installation

For production use, the extension should be:

1. **Packaged** as a `.crx` file or published to Chrome Web Store
2. **Signed** with a developer certificate
3. **Tested** across different Chrome versions

## Support

If you encounter issues:

1. Check the [GitHub Issues](https://github.com/XDM-ZSBW/zip-myl-chromium/issues)
2. Review the [README.md](README.md) for feature documentation
3. Enable debug mode in settings for detailed logging

## System Requirements

- **Chrome/Chromium**: Version 88.0.0 or higher
- **Operating System**: Windows, macOS, or Linux
- **Memory**: Minimal impact, ~10MB RAM usage
- **Storage**: ~1MB disk space

## Permissions Explained

The extension requests these permissions:

- **activeTab**: Access current tab for thought tracking
- **storage**: Save settings and thought data
- **contextMenus**: Add right-click menu options
- **tabs**: Monitor tab changes for thought persistence
- **scripting**: Inject content scripts for functionality
- **notifications**: Show system notifications
- **<all_urls>**: Work across all websites

All permissions are used responsibly and no data is sent to external servers without explicit user consent.
