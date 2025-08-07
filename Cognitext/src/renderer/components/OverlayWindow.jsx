import React, { useState, useEffect, useRef } from "react";

function OverlayWindow({
  text,
  isLoading,
  loadingStage,
  preferences = {},
  onClose,
}) {
  const contentRef = useRef(null);
  const [progress, setProgress] = useState(0);

  // Resize window to content when in minimal mode
  useEffect(() => {
    if (!isLoading && text && contentRef.current) {
      // Wait a bit for the content to render
      setTimeout(() => {
        const rect = contentRef.current.getBoundingClientRect();
        const width = Math.ceil(rect.width) + 10; // Add small padding
        const height = Math.ceil(rect.height) + 10; // Add small padding

        console.log(`Resizing window to content size: ${width}x${height}`);
        window.electronAPI?.resizeOverlayWindow?.(width, height);
      }, 100);
    }
  }, [isLoading, text]);

  // Get font size class based on preferences
  const getFontSizeClass = () => {
    switch (preferences.fontSize) {
      case "small":
        return "text-sm";
      case "large":
        return "text-lg";
      case "extra-large":
        return "text-xl";
      default:
        return "text-base";
    }
  };

  // Get theme classes based on preferences
  const getThemeClasses = () => {
    if (preferences.theme === "dark") {
      return {
        container: "bg-gray-800 border-gray-700",
        text: "text-white",
        textArea: "bg-gray-700 text-white",
        button: "bg-blue-700 hover:bg-blue-800",
        closeButton: "border-gray-600 text-gray-300 hover:bg-gray-700",
      };
    }
    return {
      container: "bg-white border-gray-200",
      text: "text-gray-800",
      textArea: "bg-gray-50 text-gray-800",
      button: "bg-blue-600 hover:bg-blue-700",
      closeButton: "border-gray-300 text-gray-700 hover:bg-gray-50",
    };
  };

  console.log("OverlayWindow render:", { text, isLoading, loadingStage });

  useEffect(() => {
    console.log("OverlayWindow useEffect:", { isLoading, loadingStage });

    if (isLoading) {
      // Calculate progress based on actual loading stage
      let targetProgress = 0;
      switch (loadingStage) {
        case "capturing":
          targetProgress = 33;
          break;
        case "ocr":
          targetProgress = 66;
          break;
        case "ai":
          targetProgress = 90;
          break;
        default:
          targetProgress = 0;
      }

      console.log("Target progress:", targetProgress);

      // Animate progress to target
      const animateProgress = () => {
        setProgress((current) => {
          if (current < targetProgress) {
            return Math.min(current + 2, targetProgress);
          }
          return current;
        });
      };

      const interval = setInterval(animateProgress, 50);
      return () => clearInterval(interval);
    } else {
      setProgress(100);
    }
  }, [isLoading, loadingStage]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(text);
    // Could add a toast notification here
  };

  const getLoadingText = () => {
    switch (loadingStage) {
      case "capturing":
        return "Capturing screen region...";
      case "ocr":
        return "Extracting text with OCR...";
      case "ai":
        return "Simplifying with AI...";
      default:
        return "Processing...";
    }
  };

  const getLoadingIcon = () => {
    switch (loadingStage) {
      case "capturing":
        return "📸";
      case "ocr":
        return "🔍";
      case "ai":
        return "🤖";
      default:
        return "⚡";
    }
  };

  return (
    <div
      className={`overlay-window ${
        !isLoading && text ? "minimal-mode" : "full-mode"
      } ${!isLoading && text ? "" : "w-full mx-auto m-4"}`}
    >
      {!isLoading && text ? (
        // Minimal mode - content positioned at top-left corner, no extra space
        <div className="no-drag absolute top-0 left-0">
          {/* Minimal transparent overlay for final text */}
          <div className="minimal-overlay">
            {/* Transparent background with subtle shadow - exact content size */}
            <div
              ref={contentRef}
              className="relative bg-gray-900 bg-opacity-75 backdrop-blur-sm rounded-lg p-4 shadow-lg border border-gray-300 border-opacity-30 max-w-sm"
            >
              {/* Close button - top right corner */}
              <button
                onClick={onClose}
                className="absolute -top-2 -right-2 w-6 h-6 bg-gray-600 bg-opacity-80 hover:bg-opacity-100 text-white rounded-full text-sm font-bold flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-md"
                title="Close"
              >
                ×
              </button>

              {/* Text content with high contrast for readability */}
              <div
                className="pr-4 cursor-pointer"
                onDoubleClick={copyToClipboard}
                title="Double-click to copy text"
              >
                <p
                  className={`text-white leading-relaxed ${getFontSizeClass()} drop-shadow-sm select-text`}
                  style={{
                    textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
                  }}
                >
                  {text || "No text to display. Try capturing some text first!"}
                </p>
              </div>

              {/* Subtle copy hint */}
              {text && (
                <div
                  className="absolute bottom-2 right-2 text-xs text-gray-300 opacity-60"
                  title="Double-click text to copy"
                >
                  <span className="text-xs">📋</span>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        // Full mode - normal header and loading
        <>
          {/* Draggable header */}
          <div className="draggable flex justify-between items-center mb-4 pb-2 border-b border-gray-200 p-6 max-w-lg">
            <h2 className="text-lg font-semibold text-gray-800">
              {isLoading ? "Processing Text" : "Simplified Text"}
            </h2>
            <button
              onClick={onClose}
              className="no-drag text-gray-500 hover:text-gray-700 text-xl font-bold w-6 h-6 flex items-center justify-center"
            >
              ×
            </button>
          </div>

          {/* Content area */}
          <div className="no-drag p-6 max-w-lg">
            {isLoading ? (
              <div className="py-8">
                {/* Loading Animation */}
                <div className="flex flex-col items-center justify-center space-y-6">
                  {/* Animated Icon */}
                  <div className="relative">
                    <div className="text-4xl animate-pulse">
                      {getLoadingIcon()}
                    </div>
                    <div className="absolute -inset-2 border-2 border-blue-600 rounded-full animate-spin border-t-transparent"></div>
                  </div>

                  {/* Loading Text */}
                  <div className="text-center space-y-2">
                    <p className="text-gray-800 font-medium text-lg">
                      {getLoadingText()}
                    </p>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce"></div>
                      <div
                        className="w-3 h-3 bg-blue-600 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-3 h-3 bg-blue-600 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full max-w-sm">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Progress</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Stage Indicators */}
                  <div className="flex space-x-4 text-sm">
                    <div
                      className={`flex items-center space-x-1 ${
                        loadingStage === "capturing" || progress > 33
                          ? "text-blue-600"
                          : "text-gray-400"
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          progress > 33 ? "bg-blue-600" : "bg-gray-300"
                        }`}
                      ></span>
                      <span>Capture</span>
                    </div>
                    <div
                      className={`flex items-center space-x-1 ${
                        loadingStage === "ocr" || progress > 66
                          ? "text-blue-600"
                          : "text-gray-400"
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          progress > 66 ? "bg-blue-600" : "bg-gray-300"
                        }`}
                      ></span>
                      <span>OCR</span>
                    </div>
                    <div
                      className={`flex items-center space-x-1 ${
                        loadingStage === "ai" || progress === 100
                          ? "text-blue-600"
                          : "text-gray-400"
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          progress === 100 ? "bg-blue-600" : "bg-gray-300"
                        }`}
                      ></span>
                      <span>AI</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Error or empty state
              <div className="text-center text-gray-600">
                {text || "No text to display. Try capturing some text first!"}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default OverlayWindow;
