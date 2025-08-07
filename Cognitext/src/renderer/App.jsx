import React, { useState, useEffect } from "react";
import OverlayWindow from "./components/OverlayWindow";
import PreferencesPage from "./components/PreferencesPage";

function App() {
  const [isOverlayMode, setIsOverlayMode] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [simplifiedText, setSimplifiedText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState("capturing");
  const [preferences, setPreferences] = useState({
    gradeLevel: 4,
    ocrConfidenceThreshold: 80,
    fontSize: "medium",
    theme: "light",
    overlayPosition: "smart",
  });

  useEffect(() => {
    console.log("App: Setting up event listeners");

    // Load saved preferences
    try {
      const savedPreferences = localStorage.getItem("cognitext-preferences");
      if (savedPreferences) {
        const parsed = JSON.parse(savedPreferences);
        setPreferences((prevPrefs) => ({ ...prevPrefs, ...parsed }));
      }
    } catch (error) {
      console.error("Error loading preferences:", error);
      // Clear corrupted preferences
      localStorage.removeItem("cognitext-preferences");
    }

    // Listen for messages from main process
    window.electronAPI?.onTextSimplified((text) => {
      console.log("App: Text simplified received:", text);
      setSimplifiedText(text);
      setIsLoading(false);
      setIsOverlayMode(true);
    });

    window.electronAPI?.onProcessingStarted(() => {
      console.log("App: Processing started");
      setIsLoading(true);
      setIsOverlayMode(true);
      setLoadingStage("capturing");
      setSimplifiedText(""); // Clear previous text
    });

    window.electronAPI?.onLoadingStage((stage) => {
      console.log("App: Loading stage changed to:", stage);
      setLoadingStage(stage);
    });

    // Check if this window is in overlay mode
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("mode") === "overlay") {
      console.log("App: Overlay mode detected");
      setIsOverlayMode(true);
    }
  }, []);

  const handlePreferencesChange = (newPreferences) => {
    setPreferences(newPreferences);
    localStorage.setItem(
      "cognitext-preferences",
      JSON.stringify(newPreferences)
    );
    // Send preferences to main process
    window.electronAPI?.updatePreferences?.(newPreferences);
  };

  if (isOverlayMode) {
    return (
      <OverlayWindow
        text={simplifiedText}
        isLoading={isLoading}
        loadingStage={loadingStage}
        preferences={preferences}
        onClose={() => window.electronAPI?.closeOverlay()}
      />
    );
  }

  if (showPreferences) {
    return (
      <PreferencesPage
        preferences={preferences}
        onPreferencesChange={handlePreferencesChange}
        onBack={() => setShowPreferences(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Cognitext</h1>
          <p className="text-gray-600 mb-6">
            AI-powered text simplification tool
          </p>
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-2">How to use:</h3>
              <ol className="text-sm text-gray-600 space-y-1 text-left">
                <li>
                  1. Press{" "}
                  <kbd className="bg-gray-200 px-2 py-1 rounded text-xs">
                    Ctrl + Alt + S
                  </kbd>
                </li>
                <li>2. Click and drag to select text area</li>
                <li>3. View simplified text in overlay</li>
              </ol>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-800 mb-2">
                <strong>Current Settings:</strong>
              </p>
              <p className="text-xs text-blue-600">
                Grade Level: {preferences.gradeLevel}
                {preferences.gradeLevel === 13
                  ? " (College)"
                  : getOrdinalSuffix(preferences.gradeLevel)}
              </p>
              <p className="text-xs text-blue-600">
                Overlay Position:{" "}
                {getPositionDisplayName(preferences.overlayPosition)}
              </p>
            </div>
            <button
              onClick={() => setShowPreferences(true)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Preferences
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function getOrdinalSuffix(num) {
  const suffixes = ["th", "st", "nd", "rd"];
  const v = num % 100;
  return suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0];
}

function getPositionDisplayName(position) {
  if (!position || position === "smart") return "Smart";
  return position.charAt(0).toUpperCase() + position.slice(1);
}

export default App;
