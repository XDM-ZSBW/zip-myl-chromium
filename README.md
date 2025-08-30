# Myl.Zip Authentication Chrome Extension

A **publicly private authentication service** that provides secure device verification and portal access for the Myl.Zip ecosystem.

## Overview

This Chrome extension serves as a **publicly private authentication service** - it's built on public, transparent infrastructure while keeping your personal data completely private. The extension enables secure device authentication through the Myl.Zip portal without storing sensitive information locally.

## Key Features

- **🔐 Device Authentication**: Secure device ID generation and verification
- **🌐 Portal Integration**: Seamless connection to the Myl.Zip authentication portal
- **🛡️ Privacy-First**: Minimal data storage, no sensitive information retained locally
- **⚡ Lightweight**: Fast, focused authentication without bloat
- **🔍 Transparent**: Public infrastructure, private data

## How It Works

### Public Infrastructure
- Authentication system built on public, verifiable infrastructure
- Open protocols and standards
- Transparent security practices

### Private Data
- Your device information stays on your device
- No personal data transmitted without consent
- Local storage only for essential authentication tokens

## Installation

### Development Installation

1. Clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked" and select this folder
5. The extension will appear in your browser toolbar

### Production Installation

The extension will be available through the Chrome Web Store once published.

## Usage

1. **First Time Setup**: Click the extension icon and follow the device verification process
2. **Portal Access**: Visit `https://myl.zip` to access the authentication portal
3. **Device Management**: Use the popup to manage your device authentication status

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Chrome        │    │   Myl.Zip       │    │   Myl.Zip       │
│   Extension     │◄──►│   Portal        │◄──►│   Backend API   │
│   (Private)     │    │   (Public)      │    │   (Public)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Development

### Project Structure
```
zip-myl-chromium/
├── manifest.json           # Extension configuration
├── background/             # Service worker
│   └── background.js      # Authentication service
├── popup/                  # Extension popup
│   ├── popup.html         # Popup interface
│   ├── popup.js           # Popup logic
│   └── popup.css          # Popup styling
├── content-scripts/       # Portal integration
│   ├── content.js         # Content script
│   └── content.css        # Content styling
└── assets/                # Icons and resources
    └── icons/
```

### Key Components

- **Background Service**: Handles device authentication and API communication
- **Popup Interface**: Provides user-friendly device management
- **Content Script**: Integrates with the Myl.Zip portal
- **Storage**: Manages local device data securely

## Security

- **Local Storage**: Device IDs stored locally only
- **HTTPS Only**: All communication over secure connections
- **Minimal Permissions**: Only requests necessary permissions
- **No Tracking**: No analytics or tracking code

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

---

**Note**: This extension is designed as a lightweight authentication client. For complex administrative features, please use the Myl.Zip portal directly.
