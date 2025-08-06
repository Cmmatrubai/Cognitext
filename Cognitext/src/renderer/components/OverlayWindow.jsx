import React, { useState, useEffect } from "react";

function OverlayWindow({ text, isLoading, loadingStage, onClose }) {
  const [progress, setProgress] = useState(0);

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
    <div className="overlay-window p-6 max-w-lg w-full mx-auto m-4">
      {/* Draggable header */}
      <div className="draggable flex justify-between items-center mb-4 pb-2 border-b border-gray-200">
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
      <div className="no-drag">
        {isLoading ? (
          <div className="py-8">
            {/* Loading Animation */}
            <div className="flex flex-col items-center justify-center space-y-6">
              {/* Animated Icon */}
              <div className="relative">
                <div className="text-4xl animate-pulse">{getLoadingIcon()}</div>
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
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
              <p className="text-gray-800 leading-relaxed text-base">
                {text || "No text to display. Try capturing some text first!"}
              </p>
            </div>

            {text && (
              <div className="flex gap-2">
                <button
                  onClick={copyToClipboard}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  📋 Copy
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default OverlayWindow;
