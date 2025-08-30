# Myl.Zip Client Extension - Installation Guide

## Quick Start

### For Developers

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd zip-myl-chromium
   ```

2. **Load in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `zip-myl-chromium` folder
   - The extension should now appear in your extensions list

3. **Test the Extension**
   - Click the Myl.Zip Client icon in your browser toolbar
   - You should see the popup with device information
   - Click "Setup Device" to begin the authentication process

### For Users

The extension will be available through the Chrome Web Store once published.

## Requirements

- Chrome 88+ or Chromium-based browser
- Internet connection for portal access
- Myl.Zip account (created during setup)

## Troubleshooting

### Extension Not Loading
- Ensure Developer mode is enabled
- Check that all files are present in the directory
- Try reloading the extension

### Portal Connection Issues
- Verify you're on a supported Myl.Zip domain
- Check your internet connection
- Clear browser cache if needed

### Device Authentication Problems
- Try clicking "Refresh Status"
- Re-run the setup process if needed
- Contact support if issues persist

## Development Notes

- The extension uses Manifest V3
- Background script runs as a service worker
- Content script only activates on Myl.Zip domains
- Minimal permissions for security

## Support

For issues or questions:
- Visit: https://myl.zip/help
- Check the main README.md for detailed documentation
