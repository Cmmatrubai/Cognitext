# Cognitext Browser Extension

A browser extension that works with your local Cognitext app to automatically simplify text from any webpage.

## Features

- **One-click text simplification**: Click the extension icon to simplify the current page
- **Smart text extraction**: Automatically finds and extracts the main content from web pages
- **Electron overlay display**: Shows simplified text in the beautiful Electron app overlay
- **Auto-simplify**: Option to automatically simplify article pages on load
- **Keyboard shortcut**: Use Ctrl+Shift+S to quickly simplify any page

## Installation

### Prerequisites

- Cognitext desktop app must be installed and running
- Chrome, Edge, or other Chromium-based browser

### Manual Installation

1. **Download the extension**:

   - Download the extension files from the Cognitext website
   - Extract the ZIP file to a folder on your computer

2. **Install in Chrome**:

   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the folder containing the extension files

3. **Connect to Cognitext app**:
   - Start your Cognitext desktop app
   - The extension will automatically detect and connect to the app
   - You should see a green checkmark in the extension icon when connected

## Usage

### Basic Usage

1. Navigate to any webpage with text content
2. Click the Cognitext extension icon in your browser toolbar
3. Click "Simplify This Page" to extract and simplify the text
4. The simplified text will appear in the Electron app overlay window

### Keyboard Shortcut

- Press `Ctrl+Shift+S` (or `Cmd+Shift+S` on Mac) to quickly simplify the current page

### Auto-simplify

- Enable "Auto-simplify on page load" in the extension settings
- The extension will automatically simplify article pages when you visit them

## Settings

### Extension Preferences

- **Auto-simplify on page load**: Automatically simplify article pages

### Connection Status

The extension shows your connection status to the Cognitext app:

- **Green checkmark**: Connected and ready to use
- **Red exclamation**: Not connected - start the Cognitext app first

## Troubleshooting

### Extension not connecting to app

1. Make sure the Cognitext desktop app is running
2. Check that the app is listening on a local port (usually 3000-3009)
3. Try refreshing the extension page (`chrome://extensions/`)
4. Restart both the app and the browser

### Text not being extracted properly

- The extension tries to find the main content area of the page
- Some websites may have unusual layouts that prevent proper extraction
- Try manually selecting the text you want to simplify

### Extension not working on certain sites

- Some sites may block content scripts for security reasons
- Try refreshing the page or disabling other extensions that might interfere

### Electron overlay not appearing

- Make sure the Cognitext desktop app is running and visible
- Check that the app has permission to create overlay windows
- Try restarting the Cognitext app

## Development

### File Structure

```
cognitext-extension/
├── manifest.json      # Extension configuration
├── popup.html         # Extension popup interface
├── popup.js           # Popup functionality
├── content.js         # Content script for web pages
├── background.js      # Background script
├── icons/             # Extension icons
└── README.md          # This file
```

### Local Development

1. Make changes to the extension files
2. Go to `chrome://extensions/`
3. Click the refresh icon on the Cognitext extension
4. Test your changes

## Support

For issues or questions:

- Check the troubleshooting section above
- Visit the Cognitext website for support
- Report bugs through the official channels

## Version History

- **v1.0.0**: Initial release with Electron overlay integration
