# Deployment Guide

This guide explains how to package and distribute Cognitext to end users.

## Prerequisites

Before building for distribution, ensure you have:

1. **Backend Running**: The Spring Boot backend must be running for AI features to work
2. **Dependencies Installed**: All npm dependencies must be installed
3. **Build Environment**: Proper build tools for your target platform

## Building for Distribution

### Windows
```bash
npm run dist:win
```
This creates:
- `dist/Cognitext Setup 1.0.0.exe` - Windows installer
- `dist/win-unpacked/` - Unpacked application folder

### macOS
```bash
npm run dist:mac
```
This creates:
- `dist/Cognitext-1.0.0.dmg` - macOS disk image
- `dist/mac/` - Unpacked application folder

### Linux
```bash
npm run dist:linux
```
This creates:
- `dist/Cognitext-1.0.0.AppImage` - Linux AppImage
- `dist/linux-unpacked/` - Unpacked application folder

### All Platforms
```bash
npm run dist
```
This builds for all supported platforms.

## Distribution Options

### 1. Direct File Sharing
- Share the installer files directly via email, cloud storage, or file sharing
- Users download and run the installer
- **Pros**: Simple, no infrastructure needed
- **Cons**: No automatic updates, manual distribution

### 2. GitHub Releases
1. Create a GitHub repository
2. Upload installer files to releases
3. Users download from GitHub releases page
- **Pros**: Free, version control, release notes
- **Cons**: Manual upload process

### 3. Auto-updater Integration
For automatic updates, you can integrate electron-updater:

```bash
npm install electron-updater
```

Then modify `main.js` to include auto-update functionality.

### 4. App Stores
- **Microsoft Store**: For Windows distribution
- **Mac App Store**: For macOS distribution
- **Snap Store**: For Linux distribution
- **Pros**: Discoverability, automatic updates, trust
- **Cons**: Approval process, fees, restrictions

## User Installation Instructions

### Windows Users
1. Download `Cognitext Setup 1.0.0.exe`
2. Run the installer as administrator
3. Follow the installation wizard
4. Launch from Start Menu or Desktop shortcut

### macOS Users
1. Download `Cognitext-1.0.0.dmg`
2. Open the DMG file
3. Drag Cognitext to Applications folder
4. Launch from Applications folder

### Linux Users
1. Download `Cognitext-1.0.0.AppImage`
2. Make executable: `chmod +x Cognitext-1.0.0.AppImage`
3. Run the AppImage file

## Backend Deployment

Since the app requires the backend to be running, you have several options:

### Option 1: Local Backend (Current)
- Users must run the backend locally
- Include backend instructions in README
- **Pros**: Simple setup
- **Cons**: Users need technical knowledge

### Option 2: Cloud Backend
- Deploy backend to cloud service (AWS, Azure, Google Cloud)
- Update app to connect to cloud endpoint
- **Pros**: No user setup required
- **Cons**: Infrastructure costs, maintenance

### Option 3: Bundled Backend
- Package backend with the app
- Start backend automatically when app launches
- **Pros**: No external dependencies
- **Cons**: Larger app size, more complex

## Testing the Distribution

Before distributing:

1. **Test on Clean Machine**: Install on a machine without development tools
2. **Test All Features**: Verify OCR, AI simplification, shortcuts work
3. **Test Backend Connection**: Ensure backend connectivity works
4. **Test Installation/Uninstallation**: Verify clean install/uninstall
5. **Test Different OS Versions**: Test on various OS versions

## File Sizes

Expected file sizes:
- Windows: ~186MB (includes Electron runtime)
- macOS: ~150MB (includes Electron runtime)
- Linux: ~140MB (includes Electron runtime)

## Security Considerations

1. **Code Signing**: Sign your application for trust
2. **Virus Scanning**: Scan installers before distribution
3. **Backend Security**: Secure your backend API
4. **User Permissions**: Request minimal required permissions

## Troubleshooting Distribution Issues

### Common Issues:
1. **App won't start**: Check system requirements, dependencies
2. **Backend connection failed**: Verify backend is running
3. **OCR not working**: Check `eng.traineddata` file is included
4. **Permission denied**: Run as administrator (Windows)

### Support:
- Include troubleshooting section in README
- Provide contact information for support
- Create GitHub issues for bug reports 