const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  testCapture: () => ipcRenderer.invoke("test-capture"),
  closeOverlay: () => ipcRenderer.invoke("close-overlay"),

  onTextSimplified: (callback) => {
    ipcRenderer.on("text-simplified", (event, text) => callback(text));
  },

  onOriginalTextReceived: (callback) => {
    ipcRenderer.on("original-text-received", (event, text) => callback(text));
  },

  onWindowDimensions: (callback) => {
    ipcRenderer.on("window-dimensions", (event, dimensions) =>
      callback(dimensions)
    );
  },

  onProcessingStarted: (callback) => {
    ipcRenderer.on("processing-started", (event) => callback());
  },

  onLoadingStage: (callback) => {
    ipcRenderer.on("loading-stage", (event, stage) => callback(stage));
  },

  // Region selection events
  onRegionSelected: (selection) =>
    ipcRenderer.invoke("region-selected", selection),
  onSelectionCancelled: () => ipcRenderer.invoke("selection-cancelled"),

  // Preferences
  updatePreferences: (preferences) =>
    ipcRenderer.invoke("update-preferences", preferences),
  getPreferences: () => ipcRenderer.invoke("get-preferences"),

  // Window management
  resizeOverlayWindow: (width, height) =>
    ipcRenderer.invoke("resize-overlay-window", width, height),
});
