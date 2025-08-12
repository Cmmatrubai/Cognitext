# Installing the Cognitext Browser Extension

## Quick Installation Guide

### Step 1: Install Dependencies

First, install the required dependencies for the Electron app:

```bash
cd Cognitext
npm install
```

### Step 2: Start the Cognitext App

Start your Cognitext desktop application:

```bash
npm start
```

The app will automatically start a local server on a random port (usually 3000-3009).

### Step 3: Install the Browser Extension

#### Chrome/Edge Installation:

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right corner)
3. Click "Load unpacked"
4. Select the `cognitext-extension` folder
5. The extension should appear in your extensions list

#### Firefox Installation:

1. Open Firefox and go to `about:debugging`
2. Click "This Firefox"
3. Click "Load Temporary Add-on"
4. Select the `manifest.json` file from the `cognitext-extension` folder

### Step 4: Verify Connection

1. Look for the Cognitext extension icon in your browser toolbar
2. Click the icon to open the popup
3. You should see "Connected to Cognitext" in green
4. If not connected, make sure the Cognitext app is running

## Testing the Extension

1. Navigate to any article or text-heavy webpage
2. Click the Cognitext extension icon
3. Click "Simplify This Page"
4. The simplified text should appear in an overlay

## Troubleshooting

### Extension shows "Not Connected"

- Make sure the Cognitext desktop app is running
- Check the console for any error messages
- Try refreshing the extension page (`chrome://extensions/`)

### Extension not appearing

- Make sure you selected the correct folder (should contain `manifest.json`)
- Check that Developer mode is enabled
- Try restarting the browser

### Text not being simplified

- Check that the Cognitext app is connected to the internet
- Verify the backend API is working
- Check the browser console for error messages

## Next Steps

Once the extension is working:

1. Test on different types of websites
2. Try the keyboard shortcut (Ctrl+Shift+S)
3. Enable auto-simplify for article pages
4. Customize settings as needed

## Distribution

For production distribution:

1. Create extension icons (16x16, 32x32, 48x48, 128x128)
2. Package the extension for Chrome Web Store
3. Create installation instructions for end users
4. Set up automatic updates
