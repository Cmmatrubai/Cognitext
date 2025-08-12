// Popup script for Cognitext extension
class CognitextPopup {
  constructor() {
    this.serverPort = null;
    this.serverId = null;
    this.isConnected = false;

    this.init();
  }

  async init() {
    await this.loadSettings();
    await this.checkConnection();
    this.setupEventListeners();
    this.updateUI();
  }

  async loadSettings() {
    // Load server connection info from storage
    const result = await chrome.storage.local.get([
      "cognitext-port",
      "cognitext-app-id",
    ]);
    this.serverPort = result["cognitext-port"];
    this.serverId = result["cognitext-app-id"];

    // Load user preferences
    const prefs = await chrome.storage.sync.get({
      autoSimplify: false,
      showOverlay: true,
    });

    this.autoSimplify = prefs.autoSimplify;
    this.showOverlay = prefs.showOverlay;
  }

  async checkConnection() {
    console.log("Popup: Checking connection...");
    if (!this.serverPort) {
      console.log("Popup: No server port found, trying to discover...");
      this.isConnected = false;
      // Try to discover server
      await this.discoverServer();
      return;
    }

    try {
      console.log(`Popup: Trying to connect to port ${this.serverPort}...`);
      const response = await fetch(
        `http://localhost:${this.serverPort}/api/health`,
        {
          method: "GET",
          timeout: 2000,
        }
      );

      this.isConnected = response.ok;
      console.log(`Popup: Connection result - ${this.isConnected}`);
    } catch (error) {
      console.log("Popup: Connection check failed:", error);
      this.isConnected = false;
    }
  }

  async discoverServer() {
    console.log("Popup: Starting server discovery...");
    const commonPorts = [
      3000, 3001, 3002, 3003, 3004, 3005, 3006, 3007, 3008, 3009, 8080,
    ];

    console.log("Popup: Will try these ports:", commonPorts);

    for (const port of commonPorts) {
      console.log(`Popup: Trying port ${port}...`);
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);

        const response = await fetch(`http://localhost:${port}/api/health`, {
          method: "GET",
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        console.log(`Popup: Port ${port} response status:`, response.status);
        console.log(`Popup: Port ${port} response ok:`, response.ok);

        if (response.ok) {
          this.serverPort = port;
          await chrome.storage.local.set({ "cognitext-port": port });
          this.isConnected = true;
          console.log(`Popup: Found Cognitext server on port ${port}`);
          return;
        }
      } catch (error) {
        console.log(`Popup: Port ${port} failed:`, error.message);
        if (error.name === "AbortError") {
          console.log(`Popup: Port ${port} timed out`);
        }
        continue;
      }
    }

    console.log("Popup: No Cognitext server found on common ports");
  }

  setupEventListeners() {
    // Simplify button
    document.getElementById("simplifyBtn").addEventListener("click", () => {
      this.simplifyCurrentPage();
    });

    // Retry connection button
    document.getElementById("retryBtn").addEventListener("click", async () => {
      console.log("Popup: Retry button clicked");
      await this.discoverServer();
      this.updateUI();
    });

    // Settings button
    document.getElementById("settingsBtn").addEventListener("click", () => {
      this.openSettings();
    });

    // Toggle switches
    document.getElementById("autoSimplify").addEventListener("click", () => {
      this.toggleAutoSimplify();
    });

    document.getElementById("showOverlay").addEventListener("click", () => {
      this.toggleShowOverlay();
    });
  }

  updateUI() {
    const statusEl = document.getElementById("status");
    const statusTextEl = document.getElementById("statusText");
    const simplifyBtn = document.getElementById("simplifyBtn");
    const autoSimplifyToggle = document.getElementById("autoSimplify");
    const showOverlayToggle = document.getElementById("showOverlay");

    // Update connection status
    if (this.isConnected) {
      statusEl.className = "status connected";
      statusTextEl.textContent = "Connected to Cognitext";
      simplifyBtn.disabled = false;
    } else {
      statusEl.className = "status disconnected";
      statusTextEl.textContent =
        "Cognitext app not found. Please start the app first.";
      simplifyBtn.disabled = true;
    }

    // Update toggle states
    autoSimplifyToggle.className = this.autoSimplify
      ? "toggle active"
      : "toggle";
    showOverlayToggle.className = this.showOverlay ? "toggle active" : "toggle";
  }

  async simplifyCurrentPage() {
    if (!this.isConnected) {
      alert("Please start the Cognitext app first.");
      return;
    }

    try {
      // Get the active tab
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      console.log("Popup: Got active tab:", tab.url);

      // Check if we can inject content script
      if (!tab.url.startsWith("http")) {
        alert(
          "Cannot simplify this page. Please navigate to a web page first."
        );
        return;
      }

      // Try to inject content script if not already present
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ["content.js"],
        });
        console.log("Popup: Content script injected");
      } catch (injectError) {
        console.log(
          "Popup: Content script already present or injection failed:",
          injectError
        );
      }

      // Wait a moment for content script to initialize
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Send message to content script to extract text
      console.log("Popup: Sending extractText message to content script");
      const response = await chrome.tabs.sendMessage(tab.id, {
        action: "extractText",
      });

      console.log("Popup: Got response from content script:", response);

      if (response && response.text) {
        console.log("Popup: Extracted text length:", response.text.length);
        // Send text to local server for simplification
        const simplifiedText = await this.sendToServer(response.text);

        if (simplifiedText) {
          console.log("Popup: Got simplified text, showing overlay");
          // Show simplified text in overlay
          await chrome.tabs.sendMessage(tab.id, {
            action: "showSimplifiedText",
            text: simplifiedText,
          });
        }
      } else {
        alert("No text found on this page to simplify.");
      }
    } catch (error) {
      console.error("Error simplifying page:", error);
      if (error.message.includes("Receiving end does not exist")) {
        alert("Cannot access this page. Please try on a different website.");
      } else {
        alert("Error simplifying page. Please try again.");
      }
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
            source: "browser-extension",
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

  async toggleAutoSimplify() {
    this.autoSimplify = !this.autoSimplify;
    await chrome.storage.sync.set({ autoSimplify: this.autoSimplify });
    this.updateUI();
  }

  async toggleShowOverlay() {
    this.showOverlay = !this.showOverlay;
    await chrome.storage.sync.set({ showOverlay: this.showOverlay });
    this.updateUI();
  }

  openSettings() {
    // Open settings page or show settings modal
    chrome.tabs.create({
      url: chrome.runtime.getURL("settings.html"),
    });
  }
}

// Initialize popup when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new CognitextPopup();
});
