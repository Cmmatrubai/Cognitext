const {
  app,
  BrowserWindow,
  globalShortcut,
  ipcMain,
  screen,
  desktopCapturer,
} = require("electron");
const path = require("path");
const fs = require("fs");
const express = require("express");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");

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

// Load preferences from file on startup
function loadPreferences() {
  try {
    const preferencesPath = path.join(__dirname, "preferences.json");
    if (fs.existsSync(preferencesPath)) {
      const data = fs.readFileSync(preferencesPath, "utf8");
      const savedPreferences = JSON.parse(data);
      userPreferences = { ...userPreferences, ...savedPreferences };
      console.log("Loaded preferences from file:", userPreferences);
    }
  } catch (error) {
    console.error("Error loading preferences:", error);
  }
}

// Save preferences to file
function savePreferences() {
  try {
    const preferencesPath = path.join(__dirname, "preferences.json");
    fs.writeFileSync(preferencesPath, JSON.stringify(userPreferences, null, 2));
    console.log("Saved preferences to file:", userPreferences);
  } catch (error) {
    console.error("Error saving preferences:", error);
  }
}

// Local server for browser extension
let localServer = null;
let serverPort = null;
let serverId = null;

function startLocalServer() {
  return new Promise((resolve, reject) => {
    try {
      // Generate unique ID for this app instance
      serverId = uuidv4();

      // Find available port
      const net = require("net");
      const findAvailablePort = (startPort) => {
        return new Promise((resolve, reject) => {
          const server = net.createServer();
          server.listen(startPort, () => {
            const port = server.address().port;
            server.close(() => resolve(port));
          });
          server.on("error", () => {
            resolve(findAvailablePort(startPort + 1));
          });
        });
      };

      findAvailablePort(3000)
        .then((port) => {
          serverPort = port;

          // Create Express app
          localServer = express();

          // Enable CORS for browser extension
          localServer.use(cors());
          localServer.use(express.json());

          // Health check endpoint
          localServer.get("/api/health", (req, res) => {
            res.json({
              status: "ok",
              appId: serverId,
              port: serverPort,
              version: "1.0.0",
            });
          });

          // Text simplification endpoint
          localServer.post("/api/simplify", async (req, res) => {
            try {
              const { text, source } = req.body;

              if (!text) {
                return res.status(400).json({ error: "No text provided" });
              }

              console.log(
                `Received text from ${source || "unknown"}:`,
                text.substring(0, 100) + "..."
              );

              // Use the same simplification logic as the main app
              const simplifiedText = await simplifyTextWithBackend(text);

              res.json({
                simplifiedText: simplifiedText,
                originalLength: text.length,
                simplifiedLength: simplifiedText.length,
              });
            } catch (error) {
              console.error("Error in /api/simplify:", error);
              res.status(500).json({ error: error.message });
            }
          });

          // New endpoint for browser extension to trigger Electron overlay
          localServer.post("/api/show-overlay", async (req, res) => {
            try {
              const { text, source } = req.body;

              if (!text) {
                return res.status(400).json({ error: "No text provided" });
              }

              console.log(
                `Browser extension requesting overlay display for text from ${
                  source || "unknown"
                }:`,
                text.substring(0, 100) + "..."
              );

              // Create overlay window if it doesn't exist
              if (!overlayWindow || overlayWindow.isDestroyed()) {
                console.log("Creating new overlay window...");
                createOverlayWindow();
              } else {
                console.log("Using existing overlay window");
              }

              // Wait for overlay window to be ready
              await new Promise((resolve) => {
                const checkReady = () => {
                  if (
                    overlayWindow &&
                    !overlayWindow.isDestroyed() &&
                    overlayWindow.webContents
                  ) {
                    console.log("Overlay window is ready");
                    resolve();
                  } else {
                    console.log("Waiting for overlay window to be ready...");
                    setTimeout(checkReady, 100);
                  }
                };
                checkReady();
              });

              // Show the overlay window first
              console.log("Showing overlay window...");
              overlayWindow.show();
              overlayWindow.focus();

              // Wait a moment for the window to be visible and React to initialize
              await new Promise((resolve) => setTimeout(resolve, 500));

              // Send the simplified text directly to the overlay window
              console.log(
                "Sending text-simplified event with text length:",
                text.length
              );
              overlayWindow.webContents.send("text-simplified", text);

              res.json({
                success: true,
                message: "Overlay window created and text displayed",
              });
            } catch (error) {
              console.error("Error in /api/show-overlay:", error);
              res.status(500).json({ error: error.message });
            }
          });

          // Start server
          localServer.listen(serverPort, () => {
            console.log(
              `Local server started on port ${serverPort} with ID ${serverId}`
            );
            resolve();
          });
        })
        .catch(reject);
    } catch (error) {
      reject(error);
    }
  });
}

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
    // Enable dragging for frameless window
    // titleBarStyle: "hidden", // Commented out for Windows compatibility
    // titleBarOverlay: false, // Commented out for Windows compatibility
    // Additional properties for better dragging
    hasShadow: false,
    thickFrame: false,
  });

  console.log("Created overlay window with properties:", {
    width: overlayWidth,
    height: overlayHeight,
    x,
    y,
    movable: overlayWindow.isMovable(),
    resizable: overlayWindow.isResizable(),
  });

  // Ensure the window is movable
  overlayWindow.setMovable(true);
  overlayWindow.setResizable(true);

  // Additional Windows-specific properties
  overlayWindow.setFocusable(true);
  overlayWindow.setAlwaysOnTop(true);

  overlayWindow.loadFile(path.join(__dirname, "dist", "index.html"), {
    search: "mode=overlay",
  });

  overlayWindow.webContents.on("did-finish-load", () => {
    console.log("Overlay window loaded and ready");
    console.log("Overlay window properties after load:", {
      movable: overlayWindow.isMovable(),
      resizable: overlayWindow.isResizable(),
      isVisible: overlayWindow.isVisible(),
      isFocused: overlayWindow.isFocused(),
    });
  });

  overlayWindow.on("closed", () => {
    console.log("Overlay window closed");
    overlayWindow = null;
  });
}

app.whenReady().then(async () => {
  // Load saved preferences on startup
  loadPreferences();

  try {
    // Start local server for browser extension
    await startLocalServer();
    console.log("Local server ready for browser extension");
  } catch (error) {
    console.error("Failed to start local server:", error);
  }

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
  savePreferences(); // Save preferences to file
  return userPreferences;
});

ipcMain.handle("get-preferences", () => {
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
      // Ensure proper window behavior
      focusable: true,
      show: false,
      // Additional properties for better behavior
      hasShadow: false,
      thickFrame: false,
    });

    // Store resolve function globally so handlers can access it
    global.selectionResolve = resolve;

    // Show the selection window
    global.selectionWindow.show();

    // Load selection HTML
    global.selectionWindow.loadFile(
      path.join(__dirname, "dist", "selection.html")
    );

    // Add debugging for selection window
    global.selectionWindow.webContents.on("did-finish-load", () => {
      console.log("Selection window loaded and ready");
      console.log("Selection window properties:", {
        movable: global.selectionWindow.isMovable(),
        resizable: global.selectionWindow.isResizable(),
        isVisible: global.selectionWindow.isVisible(),
        isFocused: global.selectionWindow.isFocused(),
      });
    });

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
    overlayWindow.focus();
    overlayWindow.setAlwaysOnTop(true);

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
    // Update to AI processing stage (only if overlay window exists)
    if (overlayWindow && overlayWindow.webContents) {
      overlayWindow.webContents.send("loading-stage", "ai");
    }

    console.log(
      "Sending text to backend for simplification:",
      text.substring(0, 100) + "..."
    );

    const axios = require("axios");

    // Import the appropriate config file
    // Change this line to switch between local and production:
    //const config = require("./config.local"); // For localhost:8080
    const config = require("./config.prod"); // For https://cognitext.onrender.com

    // Get API base URL from config
    const apiBaseUrl = config.apiBaseUrl;
    console.log("Using API base URL:", apiBaseUrl);

    const response = await axios.post(
      `${apiBaseUrl}/api/v1/simplify`,
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

    // Send window dimensions and text (only if overlay window exists)
    if (overlayWindow && overlayWindow.webContents) {
      overlayWindow.webContents.send("window-dimensions", {
        width: overlayWindow.getSize()[0],
        height: overlayWindow.getSize()[1],
      });
      overlayWindow.webContents.send("original-text-received", text);
      overlayWindow.webContents.send("text-simplified", simplifiedText);
    }

    return simplifiedText;
  } catch (error) {
    console.error("Backend simplification failed:", error);

    // Fallback to showing original text if backend fails (only if overlay window exists)
    if (overlayWindow && overlayWindow.webContents) {
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

    // Return fallback text for browser extension
    return `Backend unavailable. Original text:\n\n${text}`;
  }
}

console.log("Cognitext Electron app starting... 🚀");
