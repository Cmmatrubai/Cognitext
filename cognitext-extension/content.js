// Content script for Cognitext extension
console.log("Cognitext content script loading...");

class CognitextContent {
  constructor() {
    console.log("CognitextContent constructor called");
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
