const {
  app,
  BrowserWindow,
  globalShortcut,
  ipcMain,
  screen,
  desktopCapturer,
} = require("electron");
const path = require("path");

let mainWindow;
let overlayWindow;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "src", "preload.js"),
    },
    icon: path.join(__dirname, "assets", "icon.png"), // Add icon later
    show: false,
  });

  // Load the React app
  if (process.env.NODE_ENV === "development") {
    mainWindow.loadFile(path.join(__dirname, "dist", "index.html"));
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "dist", "index.html"));
  }

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });
}

function createOverlayWindow() {
  console.log("Creating overlay window");
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  overlayWindow = new BrowserWindow({
    width: 500,
    height: 400,
    x: Math.floor((width - 500) / 2),
    y: Math.floor((height - 400) / 2),
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: true,
    movable: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "src", "preload.js"),
    },
    show: false,
    transparent: true,
  });

  overlayWindow.loadFile(path.join(__dirname, "dist", "index.html"), {
    search: "mode=overlay",
  });

  overlayWindow.webContents.on("did-finish-load", () => {
    console.log("Overlay window loaded and ready");
  });

  overlayWindow.on("closed", () => {
    console.log("Overlay window closed");
    overlayWindow = null;
  });
}

app.whenReady().then(() => {
  createMainWindow();

  // Register IPC handlers for region selection (once)
  ipcMain.handle("region-selected", async (event, selection) => {
    if (global.selectionWindow) {
      global.selectionWindow.close();
      global.selectionWindow = null;
    }
    await captureRegion(selection);
  });

  ipcMain.handle("selection-cancelled", () => {
    if (global.selectionWindow) {
      global.selectionWindow.close();
      global.selectionWindow = null;
    }
    if (mainWindow) {
      mainWindow.show();
    }
  });

  // Register global shortcut
  const ret = globalShortcut.register("CommandOrControl+Alt+S", () => {
    console.log("Global shortcut triggered!");
    startScreenCapture();
  });

  if (!ret) {
    console.log("Global shortcut registration failed");
  }

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});

// IPC handlers
ipcMain.handle("test-capture", async () => {
  console.log("Test capture triggered");
  startScreenCapture();
});

ipcMain.handle("close-overlay", () => {
  if (overlayWindow) {
    overlayWindow.close();
  }
});

async function startScreenCapture() {
  try {
    // Hide main window and show selection overlay
    if (mainWindow) {
      mainWindow.hide();
    }

    // Create selection overlay that covers the entire screen
    await createSelectionOverlay();
  } catch (error) {
    console.error("Screen capture failed:", error);
    if (overlayWindow) {
      overlayWindow.webContents.send(
        "text-simplified",
        "Failed to capture screen: " + error.message
      );
    }
  }
}

function createSelectionOverlay() {
  return new Promise((resolve) => {
    // Close any existing selection window
    if (global.selectionWindow) {
      global.selectionWindow.close();
      global.selectionWindow = null;
    }

    const { width, height } = screen.getPrimaryDisplay().bounds;

    global.selectionWindow = new BrowserWindow({
      x: 0,
      y: 0,
      width: width,
      height: height,
      frame: false,
      alwaysOnTop: true,
      transparent: true,
      skipTaskbar: true,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, "src", "preload.js"),
      },
    });

    // Store resolve function globally so handlers can access it
    global.selectionResolve = resolve;

    // Load selection HTML
    global.selectionWindow.loadURL(
      `data:text/html;charset=utf-8,${encodeURIComponent(`
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            margin: 0;
            padding: 0;
            background: rgba(0, 0, 0, 0.3);
            cursor: crosshair;
            user-select: none;
            font-family: Arial, sans-serif;
          }
          .selection-box {
            position: absolute;
            border: 2px solid #007acc;
            background: rgba(0, 122, 204, 0.1);
            display: none;
          }
          .instructions {
            position: absolute;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            color: white;
            background: rgba(0, 0, 0, 0.7);
            padding: 10px 20px;
            border-radius: 5px;
            font-size: 16px;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="instructions">
          Click and drag to select the text area you want to simplify<br>
          <small>Press ESC to cancel</small>
        </div>
        <div class="selection-box" id="selectionBox"></div>
        
        <script>
          let isSelecting = false;
          let startX, startY, endX, endY;
          const selectionBox = document.getElementById('selectionBox');
          
          document.addEventListener('mousedown', (e) => {
            isSelecting = true;
            startX = e.clientX;
            startY = e.clientY;
            selectionBox.style.left = startX + 'px';
            selectionBox.style.top = startY + 'px';
            selectionBox.style.width = '0px';
            selectionBox.style.height = '0px';
            selectionBox.style.display = 'block';
          });
          
          document.addEventListener('mousemove', (e) => {
            if (!isSelecting) return;
            
            endX = e.clientX;
            endY = e.clientY;
            
            const left = Math.min(startX, endX);
            const top = Math.min(startY, endY);
            const width = Math.abs(endX - startX);
            const height = Math.abs(endY - startY);
            
            selectionBox.style.left = left + 'px';
            selectionBox.style.top = top + 'px';
            selectionBox.style.width = width + 'px';
            selectionBox.style.height = height + 'px';
          });
          
          document.addEventListener('mouseup', (e) => {
            if (!isSelecting) return;
            isSelecting = false;
            
            endX = e.clientX;
            endY = e.clientY;
            
            const selection = {
              x: Math.min(startX, endX),
              y: Math.min(startY, endY),
              width: Math.abs(endX - startX),
              height: Math.abs(endY - startY)
            };
            
            // Only proceed if selection is large enough
            if (selection.width > 20 && selection.height > 20) {
              window.electronAPI.onRegionSelected(selection);
            }
          });
          
          document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
              window.electronAPI.onSelectionCancelled();
            }
          });
        </script>
      </body>
      </html>
    `)}`
    );

    // Handle window close
    global.selectionWindow.on("closed", () => {
      global.selectionWindow = null;
      if (global.selectionResolve) {
        global.selectionResolve();
        global.selectionResolve = null;
      }
    });
  });
}

async function captureRegion(selection) {
  try {
    console.log("Capturing region:", selection);

    // Show processing overlay
    if (!overlayWindow) {
      createOverlayWindow();
    }

    // Wait for overlay window to be ready
    overlayWindow.show();

    // Wait for the overlay window to be fully loaded before sending events
    const waitForOverlayReady = () => {
      return new Promise((resolve) => {
        if (overlayWindow.webContents.isLoading()) {
          overlayWindow.webContents.once('did-finish-load', () => {
            console.log("Overlay ready, starting processing");
            resolve();
          });
        } else {
          console.log("Overlay already ready, starting processing");
          resolve();
        }
      });
    };

    // Wait for overlay to be ready, then start processing
    await waitForOverlayReady();
    
    console.log("Sending processing-started event");
    overlayWindow.webContents.send("processing-started");
    overlayWindow.webContents.send("loading-stage", "capturing");

    // Wait a moment for the UI to update
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Capture the selected region
    const sources = await desktopCapturer.getSources({
      types: ["screen"],
      thumbnailSize: {
        width: screen.getPrimaryDisplay().bounds.width,
        height: screen.getPrimaryDisplay().bounds.height,
      },
    });

    if (sources.length > 0) {
      const screenImage = sources[0].thumbnail;

      // Crop the image to the selected region
      const croppedImage = screenImage.crop({
        x: Math.round(selection.x),
        y: Math.round(selection.y),
        width: Math.round(selection.width),
        height: Math.round(selection.height),
      });

      const imageBuffer = croppedImage.toPNG();

      // Update to OCR stage
      overlayWindow.webContents.send("loading-stage", "ocr");

      // Process with OCR
      await processImageWithOCR(imageBuffer);
    } else {
      throw new Error("No screen sources available");
    }

    // Show main window again
    if (mainWindow) {
      mainWindow.show();
    }

    // Resolve the selection overlay promise
    if (global.selectionResolve) {
      global.selectionResolve();
      global.selectionResolve = null;
    }
  } catch (error) {
    console.error("Region capture failed:", error);

    if (!overlayWindow) {
      createOverlayWindow();
    }
    overlayWindow.show();
    overlayWindow.webContents.send(
      "text-simplified",
      "Failed to capture region: " + error.message
    );

    if (mainWindow) {
      mainWindow.show();
    }

    // Resolve the selection overlay promise even on error
    if (global.selectionResolve) {
      global.selectionResolve();
      global.selectionResolve = null;
    }
  }
}

async function processImageWithOCR(imageBuffer) {
  try {
    // Import Tesseract dynamically
    const { createWorker } = require("tesseract.js");

    const worker = await createWorker();
    await worker.loadLanguage("eng");
    await worker.initialize("eng");

    console.log("Processing image with OCR...");

    const {
      data: { text },
    } = await worker.recognize(imageBuffer);
    await worker.terminate();

    console.log("OCR extracted text:", text);

    if (text.trim().length > 0) {
      // Send text to backend for simplification
      await simplifyTextWithBackend(text.trim());
    } else {
      overlayWindow.webContents.send(
        "text-simplified",
        "No text found in the captured image. Try selecting an area with text."
      );
    }
  } catch (error) {
    console.error("OCR processing failed:", error);
    overlayWindow.webContents.send(
      "text-simplified",
      "OCR failed: " + error.message
    );
  }
}

async function simplifyTextWithBackend(text) {
  try {
    // Update to AI processing stage
    overlayWindow.webContents.send("loading-stage", "ai");

    const axios = require("axios");

    const response = await axios.post(
      "http://localhost:8080/api/v1/simplify",
      {
        text: text,
        gradeLevel: 4,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 30000, // 30 second timeout
      }
    );

    const simplifiedText = response.data.simplifiedText;
    overlayWindow.webContents.send("text-simplified", simplifiedText);
  } catch (error) {
    console.error("Backend simplification failed:", error);

    // Fallback to showing original text if backend fails
    overlayWindow.webContents.send(
      "text-simplified",
      `Backend unavailable. Original text:\n\n${text}`
    );
  }
}

console.log("Cognitext Electron app starting... 🚀");
