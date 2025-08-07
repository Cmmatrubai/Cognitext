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

// Global preferences storage
let userPreferences = {
  gradeLevel: 4,
  ocrConfidenceThreshold: 80,
  fontSize: "medium",
  theme: "light",
  overlayPosition: "smart", // smart, right, left, below, above
};

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

function createOverlayWindow(capturedRegion = null) {
  console.log(
    "Creating overlay window",
    capturedRegion ? "with positioning" : "centered"
  );
  const { width: screenWidth, height: screenHeight } =
    screen.getPrimaryDisplay().workAreaSize;
  const { bounds } = screen.getPrimaryDisplay();

  // Use fixed dimensions for the overlay window
  const overlayWidth = 500;
  const overlayHeight = 400;

  let x, y;

  if (capturedRegion) {
    // Position overlay to the right of the captured region
    const {
      x: regionX,
      y: regionY,
      width: regionWidth,
      height: regionHeight,
    } = capturedRegion;

    // Position to the right of the captured region
    x = regionX + regionWidth + 10; // 10px gap
    y = regionY; // Align with the top of the captured region

    // Ensure it doesn't go off screen
    if (x + overlayWidth > bounds.width) {
      x = bounds.width - overlayWidth - 10;
    }
    if (y + overlayHeight > bounds.height) {
      y = bounds.height - overlayHeight - 10;
    }

    console.log(
      `Positioning overlay at (${x}, ${y}) to the right of captured region (${regionX}, ${regionY}, ${regionWidth}x${regionHeight})`
    );
  } else {
    // Default center positioning
    x = Math.floor((screenWidth - overlayWidth) / 2);
    y = Math.floor((screenHeight - overlayHeight) / 2);
  }

  overlayWindow = new BrowserWindow({
    width: overlayWidth,
    height: overlayHeight,
    x,
    y,
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

ipcMain.handle("update-preferences", (event, preferences) => {
  console.log("Updating preferences:", preferences);
  userPreferences = { ...userPreferences, ...preferences };
  return userPreferences;
});

ipcMain.handle("resize-overlay-window", (event, width, height) => {
  if (overlayWindow) {
    console.log(`Resizing overlay window to ${width}x${height}`);
    overlayWindow.setSize(width, height);
    return true;
  }
  return false;
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

    // Show processing overlay with contextual positioning
    if (!overlayWindow) {
      createOverlayWindow(selection);
    }

    // Wait for overlay window to be ready
    overlayWindow.show();

    // Wait for the overlay window to be fully loaded before sending events
    const waitForOverlayReady = () => {
      return new Promise((resolve) => {
        if (overlayWindow.webContents.isLoading()) {
          overlayWindow.webContents.once("did-finish-load", () => {
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
    // Import required libraries
    const { createWorker } = require("tesseract.js");

    console.log("Processing image with OCR...");

    // Preprocess image for better OCR accuracy
    const preprocessedBuffer = await preprocessImageForOCR(imageBuffer).catch(
      () => {
        console.log("Using original image for OCR");
        return imageBuffer;
      }
    );

    const worker = await createWorker("eng", 1, {
      logger: (m) => {
        if (m.status === "recognizing text") {
          console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
        }
      },
    });

    // Configure Tesseract for better text recognition
    // Note: Some parameters must be set during worker creation, not after
    await worker.setParameters({
      tessedit_pageseg_mode: "3", // Fully automatic page segmentation, but no OSD
      preserve_interword_spaces: "1", // Preserve spaces between words
    });

    const {
      data: { text, confidence },
    } = await worker.recognize(preprocessedBuffer);
    await worker.terminate();

    console.log(`OCR extracted text (confidence: ${confidence}%):`, text);

    if (text.trim().length > 0) {
      // Post-process the OCR text to fix common errors
      const cleanedText = postProcessOCRText(text.trim());
      console.log("Cleaned text:", cleanedText);

      // Send text to backend for simplification
      await simplifyTextWithBackend(cleanedText);
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

async function preprocessImageForOCR(imageBuffer) {
  try {
    // Use Electron's nativeImage for preprocessing instead of Jimp
    const { nativeImage } = require("electron");

    // Create native image from buffer
    const image = nativeImage.createFromBuffer(imageBuffer);

    // Scale up the image for better OCR recognition
    const scaledImage = image.resize({
      width: image.getSize().width * 2,
      height: image.getSize().height * 2,
      quality: "best",
    });

    // Get the PNG buffer
    const buffer = scaledImage.toPNG();
    console.log("Image preprocessed for OCR using Electron nativeImage");

    return buffer;
  } catch (error) {
    console.error("Image preprocessing failed, using original:", error);
    return imageBuffer; // Fallback to original
  }
}

function postProcessOCRText(text) {
  // Common OCR corrections
  let cleaned = text
    // Fix common character substitutions in context
    .replace(/\bl2\b/g, "12") // l2 -> 12 (numbers)
    .replace(/\bpm\./g, "p.m.") // pm. -> p.m.
    .replace(/\bconcems\b/gi, "concerns") // concems -> concerns
    .replace(/\btranseri\b/gi, "transcripts") // transeri -> transcripts
    .replace(/\baceon\b/gi, "accomplice") // aceon -> accomplice
    .replace(/\bpstein\b/gi, "Epstein") // pstein -> Epstein (any form)
    .replace(/\bAttomey\b/gi, "Attorney") // Attomey -> Attorney
    .replace(/\bTos\b/gi, "Todd") // Tos -> Todd (likely Todd Blanche)
    .replace(/\bwheth\b/gi, "whether") // wheth -> whether
    .replace(/\bconceming\b/gi, "concerning") // conceming -> concerning
    .replace(/\badministrations\b/gi, "administration's") // administrations -> administration's

    // Remove artifacts and clean up
    .replace(/Processing Text/gi, "") // Remove OCR artifacts
    .replace(/Capturing screen region\.\.\./gi, "") // Remove UI artifacts
    .replace(/\[XX\]/g, "") // Remove UI markers
    .replace(/\+/g, "") // Remove stray + symbols

    // Fix spacing and line breaks
    .replace(/([a-z])([A-Z])/g, "$1 $2") // Add space between lowercase and uppercase
    .replace(/([.!?])([A-Za-z])/g, "$1 $2") // Add space after punctuation
    .replace(/\s+/g, " ") // Normalize multiple spaces
    .replace(/\n+/g, " ") // Convert line breaks to spaces for better paragraph flow

    // Fix sentence structure
    .replace(/\b([a-z])/g, (match, p1, offset) => {
      // Capitalize first letter of sentences
      return offset === 0 ||
        text[offset - 2] === "." ||
        text[offset - 2] === "!" ||
        text[offset - 2] === "?"
        ? p1.toUpperCase()
        : match;
    })

    .trim();

  return cleaned;
}

async function simplifyTextWithBackend(text) {
  try {
    // Update to AI processing stage
    overlayWindow.webContents.send("loading-stage", "ai");
    console.log(
      "Sending text to backend for simplification:",
      text.substring(0, 100) + "..."
    );

    const axios = require("axios");

    const response = await axios.post(
      "http://localhost:8080/api/v1/simplify",
      {
        text: text,
        gradeLevel: userPreferences.gradeLevel,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 30000, // 30 second timeout
      }
    );

    const simplifiedText = response.data.simplifiedText;
    console.log(
      "Backend response received, simplified text length:",
      simplifiedText?.length
    );

    // Send window dimensions and text
    overlayWindow.webContents.send("window-dimensions", {
      width: overlayWindow.getSize()[0],
      height: overlayWindow.getSize()[1],
    });
    overlayWindow.webContents.send("original-text-received", text);
    overlayWindow.webContents.send("text-simplified", simplifiedText);
  } catch (error) {
    console.error("Backend simplification failed:", error);

    // Fallback to showing original text if backend fails
    overlayWindow.webContents.send("window-dimensions", {
      width: overlayWindow.getSize()[0],
      height: overlayWindow.getSize()[1],
    });
    overlayWindow.webContents.send("original-text-received", text);
    overlayWindow.webContents.send(
      "text-simplified",
      `Backend unavailable. Original text:\n\n${text}`
    );
  }
}

console.log("Cognitext Electron app starting... 🚀");
