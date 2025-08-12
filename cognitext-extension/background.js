// Background script for Cognitext extension
console.log("Background script loading...");

// Simple test to verify service worker is working
chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension installed - service worker is working!");
});

class CognitextBackground {
  constructor() {
    console.log("CognitextBackground constructor called");
    this.serverPort = null;
    this.serverId = null;
    this.isConnected = false;

    this.init();
  }

  async init() {
    console.log("Initializing CognitextBackground...");
    await this.loadServerInfo();
    await this.checkConnection();
    this.setupEventListeners();
    this.startConnectionMonitor();
    console.log("CognitextBackground initialization complete");
  }

  async loadServerInfo() {
    try {
      const result = await chrome.storage.local.get([
        "cognitext-port",
        "cognitext-app-id",
      ]);
      this.serverPort = result["cognitext-port"];
      this.serverId = result["cognitext-app-id"];
    } catch (error) {
      console.log("Error loading server info:", error);
    }
  }

  async checkConnection() {
    if (!this.serverPort) {
      this.isConnected = false;
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:${this.serverPort}/api/health`,
        {
          method: "GET",
        }
      );

      this.isConnected = response.ok;

      if (this.isConnected) {
        console.log("Connected to Cognitext server");
      }
    } catch (error) {
      console.log("Connection check failed:", error);
      this.isConnected = false;
    }
  }

  setupEventListeners() {
    // Listen for messages from content scripts
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse);
      return true; // Keep message channel open for async response
    });

    // Listen for extension installation
    chrome.runtime.onInstalled.addListener((details) => {
      this.handleInstallation(details);
    });

    // Listen for extension startup
    chrome.runtime.onStartup.addListener(() => {
      this.handleStartup();
    });
  }

  async handleMessage(request, sender, sendResponse) {
    switch (request.action) {
      case "autoSimplify":
        await this.handleAutoSimplify(request, sender);
        sendResponse({ success: true });
        break;

      case "checkConnection":
        await this.checkConnection();
        sendResponse({ connected: this.isConnected });
        break;

      case "discoverServer":
        await this.discoverLocalServer();
        sendResponse({
          connected: this.isConnected,
          port: this.serverPort,
        });
        break;

      case "getServerInfo":
        sendResponse({
          port: this.serverPort,
          id: this.serverId,
          connected: this.isConnected,
        });
        break;

      default:
        sendResponse({ error: "Unknown action" });
    }
  }

  async handleAutoSimplify(request, sender) {
    if (!this.isConnected) {
      console.log("Cannot auto-simplify: not connected to server");
      return;
    }

    try {
      const simplifiedText = await this.sendToServer(request.text);

      if (simplifiedText) {
        // Send simplified text back to the content script
        await chrome.tabs.sendMessage(sender.tab.id, {
          action: "showSimplifiedText",
          text: simplifiedText,
        });
      }
    } catch (error) {
      console.error("Error in auto-simplify:", error);
    }
  }

  async sendToServer(text) {
    try {
      const response = await fetch(
        `http://localhost:${this.serverPort}/api/simplify`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: text,
            source: "browser-extension-auto",
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        return data.simplifiedText;
      } else {
        throw new Error(`Server responded with ${response.status}`);
      }
    } catch (error) {
      console.error("Error sending to server:", error);
      throw error;
    }
  }

  async handleInstallation(details) {
    console.log("Extension installed:", details);

    // Set default preferences
    await chrome.storage.sync.set({
      autoSimplify: false,
      showOverlay: true,
    });

    // Try to discover local server
    await this.discoverLocalServer();
  }

  async handleStartup() {
    console.log("Extension started");
    await this.checkConnection();

    // If not connected, try to discover server
    if (!this.isConnected) {
      console.log("Not connected, trying to discover server...");
      await this.discoverLocalServer();
    }
  }

  async discoverLocalServer() {
    console.log("Starting server discovery...");
    // Try common ports to find the local server (Electron app first, then backend)
    const commonPorts = [
      3000, 3001, 3002, 3003, 3004, 3005, 3006, 3007, 3008, 3009, 8080,
    ];

    console.log("Will try these ports:", commonPorts);

    for (const port of commonPorts) {
      console.log(`Trying port ${port}...`);
      try {
        // Try Electron app endpoint first
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);

        const response = await fetch(`http://localhost:${port}/api/health`, {
          method: "GET",
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        console.log(`Port ${port} response status:`, response.status);
        console.log(`Port ${port} response ok:`, response.ok);

        if (response.ok) {
          // Found the server!
          this.serverPort = port;
          await chrome.storage.local.set({ "cognitext-port": port });
          this.isConnected = true;
          console.log(`Found Cognitext server on port ${port}`);
          return;
        } else {
          console.log(`Port ${port} responded with status: ${response.status}`);
        }
      } catch (error) {
        console.log(`Port ${port} failed:`, error.message);
        if (error.name === "AbortError") {
          console.log(`Port ${port} timed out`);
        }
        // Continue to next port
        continue;
      }
    }

    console.log("No Cognitext server found on common ports");
  }

  startConnectionMonitor() {
    // Check connection every 30 seconds
    setInterval(async () => {
      await this.checkConnection();
    }, 30000);
  }

  // Update badge to show connection status
  updateBadge() {
    if (this.isConnected) {
      chrome.action.setBadgeText({ text: "✓" });
      chrome.action.setBadgeBackgroundColor({ color: "#4ade80" });
    } else {
      chrome.action.setBadgeText({ text: "!" });
      chrome.action.setBadgeBackgroundColor({ color: "#f87171" });
    }
  }
}

// Initialize background script
console.log("About to create CognitextBackground instance...");
new CognitextBackground();
console.log("CognitextBackground instance created");
