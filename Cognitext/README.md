# Cognitext

An AI-powered text simplification tool that helps make complex text more accessible and easier to understand.

## Features

- **Screen Capture**: Select any text on your screen with a simple drag-and-drop interface
- **OCR Processing**: Automatically extracts text from images using advanced OCR technology
- **AI Simplification**: Uses AI to simplify complex text while maintaining meaning
- **Global Shortcut**: Quick access with `Ctrl+Alt+S` (or `Cmd+Alt+S` on Mac)
- **Overlay Display**: Shows simplified text in a convenient overlay window
- **Copy to Clipboard**: Double-click text to copy it to your clipboard

## How to Use

1. **Start the Application**: Run the executable file
2. **Capture Text**: Press `Ctrl+Alt+S` (or `Cmd+Alt+S` on Mac) to start screen capture
3. **Select Area**: Click and drag to select the text area you want to simplify
4. **Wait for Processing**: The app will process the text through OCR and AI simplification
5. **View Results**: The simplified text will appear in an overlay window
6. **Copy Text**: Double-click the text to copy it to your clipboard

## System Requirements

- **Windows**: Windows 10 or later
- **macOS**: macOS 10.14 or later
- **Linux**: Ubuntu 18.04 or later
- **Memory**: 4GB RAM minimum, 8GB recommended
- **Storage**: 500MB free space

## Installation

### Windows

1. Download the `.exe` installer from the releases page
2. Run the installer and follow the setup wizard
3. The app will be installed and create desktop shortcuts

### macOS

1. Download the `.dmg` file from the releases page
2. Open the `.dmg` file and drag Cognitext to your Applications folder
3. The app will be available in your Applications folder

### Linux

1. Download the `.AppImage` file from the releases page
2. Make the file executable: `chmod +x Cognitext-*.AppImage`
3. Run the AppImage file

## Development

### Prerequisites

- Node.js 18+
- npm or yarn

### Setup

```bash
# Clone the repository
git clone <repository-url>
cd Cognitext

# Install dependencies
npm install

# Start the backend (required for AI features)
cd ../cognitext-backend
mvn spring-boot:run

# In another terminal, start the Electron app
cd ../Cognitext
npm run dev
```

### Building for Distribution

```bash
# Build for Windows
npm run dist:win

# Build for macOS
npm run dist:mac

# Build for Linux
npm run dist:linux

# Build for all platforms
npm run dist
```

## Architecture

- **Frontend**: React with Electron for cross-platform desktop app
- **Backend**: Spring Boot Java application for AI text simplification
- **OCR**: Tesseract.js for text extraction from images
- **UI**: Tailwind CSS for modern, responsive design

## Troubleshooting

### App won't start

- Make sure you have the required system dependencies
- Check that the backend is running (required for AI features)
- Try running as administrator on Windows

### OCR not working

- Ensure the text in the image is clear and readable
- Try selecting a larger area around the text
- Check that the `eng.traineddata` file is present

### Backend connection issues

- Verify the backend is running on `http://localhost:8080`
- Check firewall settings
- Ensure no other application is using port 8080

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and feature requests, please use the GitHub issues page.
