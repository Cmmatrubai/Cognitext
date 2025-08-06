const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  testCapture: () => ipcRenderer.invoke('test-capture'),
  closeOverlay: () => ipcRenderer.invoke('close-overlay'),
  
  onTextSimplified: (callback) => {
    ipcRenderer.on('text-simplified', (event, text) => callback(text));
  },
  
  onProcessingStarted: (callback) => {
    ipcRenderer.on('processing-started', (event) => callback());
  },

  onLoadingStage: (callback) => {
    ipcRenderer.on('loading-stage', (event, stage) => callback(stage));
  },
  
  // Region selection events
  onRegionSelected: (selection) => ipcRenderer.invoke('region-selected', selection),
  onSelectionCancelled: () => ipcRenderer.invoke('selection-cancelled'),
});