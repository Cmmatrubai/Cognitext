// Content script for Cognitext extension
console.log("Cognitext content script loading...");

class CognitextContent {
  constructor() {
    console.log("CognitextContent constructor called");
    this.overlay = null;
    this.init();
  }

  init() {
    console.log("CognitextContent init called");
    // Listen for messages from popup and background
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      console.log("CognitextContent received message:", request);
      this.handleMessage(request, sender, sendResponse);
      return true; // Keep message channel open for async response
    });

    // Auto-simplify on page load if enabled
    this.checkAutoSimplify();
    console.log("CognitextContent init complete");
  }

  async handleMessage(request, sender, sendResponse) {
    console.log("CognitextContent handling message:", request.action);
    switch (request.action) {
      case "extractText":
        console.log("CognitextContent extracting text...");
        const text = this.extractPageText();
        console.log("CognitextContent extracted text length:", text.length);
        sendResponse({ text });
        break;

      case "showSimplifiedText":
        console.log("CognitextContent showing simplified text...");
        this.showSimplifiedOverlay(request.text);
        sendResponse({ success: true });
        break;

      case "hideSimplifiedText":
        console.log("CognitextContent hiding simplified text...");
        this.hideSimplifiedOverlay();
        sendResponse({ success: true });
        break;

      default:
        console.log("CognitextContent unknown action:", request.action);
        sendResponse({ error: "Unknown action" });
    }
  }

  extractPageText() {
    // Get the main content of the page
    const content = this.getMainContent();

    // Clean and format the text
    const cleanText = this.cleanText(content);

    return cleanText;
  }

  getMainContent() {
    // Try to find the main content area
    const selectors = [
      "main",
      "article",
      '[role="main"]',
      ".content",
      ".post-content",
      ".entry-content",
      ".article-content",
      "#content",
      "#main",
      ".main",
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        return element.textContent;
      }
    }

    // Fallback to body content, excluding navigation and footer
    const body = document.body;
    const excludedSelectors = [
      "nav",
      "header",
      "footer",
      ".nav",
      ".header",
      ".footer",
      ".sidebar",
      ".menu",
      ".navigation",
    ];

    // Clone body to avoid modifying the original
    const clone = body.cloneNode(true);

    // Remove excluded elements
    excludedSelectors.forEach((selector) => {
      const elements = clone.querySelectorAll(selector);
      elements.forEach((el) => el.remove());
    });

    return clone.textContent;
  }

  cleanText(text) {
    return text
      .replace(/\s+/g, " ") // Replace multiple spaces with single space
      .replace(/\n+/g, "\n") // Replace multiple newlines with single newline
      .trim()
      .substring(0, 10000); // Limit to 10k characters to avoid overwhelming the API
  }

  showSimplifiedOverlay(text) {
    // Remove existing overlay
    this.hideSimplifiedOverlay();

    // Create overlay
    this.overlay = document.createElement("div");
    this.overlay.id = "cognitext-overlay";
    this.overlay.innerHTML = `
      <div class="cognitext-container">
        <div class="cognitext-header">
          <h3>Simplified Text</h3>
          <button class="cognitext-close">×</button>
        </div>
        <div class="cognitext-content">
          <p>${text}</p>
        </div>
        <div class="cognitext-actions">
          <button class="cognitext-copy">Copy Text</button>
          <button class="cognitext-hide">Hide</button>
        </div>
      </div>
    `;

    // Add styles
    this.addOverlayStyles();

    // Add event listeners
    this.overlay
      .querySelector(".cognitext-close")
      .addEventListener("click", () => {
        this.hideSimplifiedOverlay();
      });

    this.overlay
      .querySelector(".cognitext-hide")
      .addEventListener("click", () => {
        this.hideSimplifiedOverlay();
      });

    this.overlay
      .querySelector(".cognitext-copy")
      .addEventListener("click", () => {
        navigator.clipboard.writeText(text);
        this.showToast("Text copied to clipboard!");
      });

    // Add to page
    document.body.appendChild(this.overlay);

    // Animate in
    setTimeout(() => {
      this.overlay.classList.add("visible");
    }, 10);
  }

  hideSimplifiedOverlay() {
    if (this.overlay) {
      this.overlay.classList.remove("visible");
      setTimeout(() => {
        if (this.overlay && this.overlay.parentNode) {
          this.overlay.parentNode.removeChild(this.overlay);
        }
        this.overlay = null;
      }, 300);
    }
  }

  addOverlayStyles() {
    if (document.getElementById("cognitext-styles")) return;

    const styles = document.createElement("style");
    styles.id = "cognitext-styles";
    styles.textContent = `
      #cognitext-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        z-index: 999999;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.3s ease;
      }
      
      #cognitext-overlay.visible {
        opacity: 1;
      }
      
      .cognitext-container {
        background: white;
        border-radius: 12px;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        max-width: 600px;
        max-height: 80vh;
        width: 90%;
        overflow: hidden;
        transform: scale(0.9);
        transition: transform 0.3s ease;
      }
      
      #cognitext-overlay.visible .cognitext-container {
        transform: scale(1);
      }
      
      .cognitext-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 16px 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .cognitext-header h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
      }
      
      .cognitext-close {
        background: none;
        border: none;
        color: white;
        font-size: 24px;
        cursor: pointer;
        padding: 0;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: background 0.2s;
      }
      
      .cognitext-close:hover {
        background: rgba(255, 255, 255, 0.2);
      }
      
      .cognitext-content {
        padding: 20px;
        max-height: 50vh;
        overflow-y: auto;
        line-height: 1.6;
        font-size: 16px;
      }
      
      .cognitext-actions {
        padding: 16px 20px;
        border-top: 1px solid #eee;
        display: flex;
        gap: 12px;
        justify-content: flex-end;
      }
      
      .cognitext-actions button {
        padding: 8px 16px;
        border: 1px solid #ddd;
        background: white;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.2s;
      }
      
      .cognitext-actions button:hover {
        background: #f5f5f5;
        border-color: #ccc;
      }
      
      .cognitext-copy {
        background: #667eea !important;
        color: white !important;
        border-color: #667eea !important;
      }
      
      .cognitext-copy:hover {
        background: #5a6fd8 !important;
      }
      
      .cognitext-toast {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #333;
        color: white;
        padding: 12px 20px;
        border-radius: 6px;
        z-index: 1000000;
        opacity: 0;
        transform: translateY(20px);
        transition: all 0.3s ease;
      }
      
      .cognitext-toast.visible {
        opacity: 1;
        transform: translateY(0);
      }
    `;

    document.head.appendChild(styles);
  }

  showToast(message) {
    const toast = document.createElement("div");
    toast.className = "cognitext-toast";
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add("visible"), 10);
    setTimeout(() => {
      toast.classList.remove("visible");
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 2000);
  }

  async checkAutoSimplify() {
    try {
      const result = await chrome.storage.sync.get({ autoSimplify: false });
      if (result.autoSimplify) {
        // Wait a bit for page to fully load
        setTimeout(() => {
          this.autoSimplifyPage();
        }, 2000);
      }
    } catch (error) {
      console.log("Error checking auto-simplify:", error);
    }
  }

  async autoSimplifyPage() {
    // Only auto-simplify on certain types of pages
    const url = window.location.href;
    const isArticlePage = this.isArticlePage(url);

    if (isArticlePage) {
      const text = this.extractPageText();
      if (text.length > 100) {
        // Only if there's substantial content
        // Send to background script to handle
        chrome.runtime.sendMessage({
          action: "autoSimplify",
          text: text,
          url: url,
        });
      }
    }
  }

  isArticlePage(url) {
    // Simple heuristic to detect article pages
    const articleKeywords = [
      "/article/",
      "/post/",
      "/blog/",
      "/news/",
      "/story/",
    ];
    return articleKeywords.some((keyword) => url.includes(keyword));
  }
}

// Initialize content script
console.log("About to create CognitextContent instance...");
new CognitextContent();
console.log("CognitextContent instance created");
