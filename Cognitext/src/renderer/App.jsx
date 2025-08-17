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
      console.log("App: Text length:", text?.length);
      console.log("App: Text preview:", text?.substring(0, 100));
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
    console.log("App: Rendering OverlayWindow with props:", {
      text: simplifiedText,
      textLength: simplifiedText?.length,
      isLoading,
      loadingStage,
    });
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      {/* Hero Section */}
      <div className="text-center py-8 px-2 max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 font-heading">
          Cognitext
        </h1>
        <p className="text-base md:text-lg text-gray-600 mb-6 max-w-xl mx-auto">
          AI-powered text simplification tool that works system-wide, in real
          time, so you can read better anywhere.
        </p>
        <div className="flex flex-col sm:flex-row justify-center items-center space-y-3 sm:space-y-0 sm:space-x-4 mb-8">
          <button
            onClick={() => setShowPreferences(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors shadow-lg hover:shadow-xl text-sm"
          >
            Customize Settings
          </button>
          <div className="bg-gray-100 px-3 py-2 rounded-lg text-sm">
            <span className="text-gray-600">Press </span>
            <kbd className="bg-gray-200 px-1.5 py-0.5 rounded text-xs font-mono">
              Ctrl + Alt + S
            </kbd>
            <span className="text-gray-600"> to start</span>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-5xl mx-auto px-2 pb-8">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6 text-center font-heading">
          Built for accessible reading
        </h2>
        <p className="text-sm md:text-base text-gray-600 mb-8 text-center max-w-2xl mx-auto">
          Cognitext works system-wide, in real time, so you can read better
          anywhere.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Instant Capture */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                <span className="text-lg">📸</span>
              </div>
              <h3 className="text-base font-semibold text-gray-800 font-heading">
                Instant Capture
              </h3>
            </div>
            <p className="text-sm text-gray-600">
              One keystroke captures any text on screen—PDFs, websites, apps,
              even images.
            </p>
          </div>

          {/* AI Simplification */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                <span className="text-lg">✨</span>
              </div>
              <h3 className="text-base font-semibold text-gray-800 font-heading">
                AI Simplification
              </h3>
            </div>
            <p className="text-sm text-gray-600">
              Complex text becomes clear, concise, and tailored to your reading
              level.
            </p>
          </div>

          {/* Dyslexia-Friendly */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                <span className="text-lg font-bold text-green-700">T</span>
              </div>
              <h3 className="text-base font-semibold text-gray-800 font-heading">
                Dyslexia-Friendly
              </h3>
            </div>
            <p className="text-sm text-gray-600">
              Customizable fonts, spacing, and color overlays for optimal
              readability.
            </p>
          </div>

          {/* Audio Readout */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                <span className="text-lg">🔊</span>
              </div>
              <h3 className="text-base font-semibold text-gray-800 font-heading">
                Audio Readout
              </h3>
            </div>
            <p className="text-sm text-gray-600">
              Natural text-to-speech with adjustable speed and voice
              preferences.
            </p>
          </div>

          {/* Smart Translation */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                <span className="text-lg">🌐</span>
              </div>
              <h3 className="text-base font-semibold text-gray-800 font-heading">
                Smart Translation
              </h3>
            </div>
            <p className="text-sm text-gray-600">
              Break language barriers with instant translations and
              explanations.
            </p>
          </div>

          {/* Privacy First */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                <span className="text-lg">🛡️</span>
              </div>
              <h3 className="text-base font-semibold text-gray-800 font-heading">
                Privacy First
              </h3>
            </div>
            <p className="text-sm text-gray-600">
              All processing happens locally—your text never leaves your device.
            </p>
          </div>
        </div>
      </div>

      {/* Current Settings Section */}
      <div className="max-w-3xl mx-auto px-2 pb-8">
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-4 text-center font-heading">
            Current Settings
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-lg p-3">
              <h4 className="font-semibold text-blue-800 mb-1 text-sm">
                Reading Level
              </h4>
              <p className="text-blue-600 text-sm">
                {`${preferences.gradeLevel}${getOrdinalSuffix(
                  preferences.gradeLevel
                )} Grade`}
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <h4 className="font-semibold text-green-800 mb-1 text-sm">
                OCR Confidence
              </h4>
              <p className="text-green-600 text-sm">
                {preferences.ocrConfidenceThreshold}%
              </p>
            </div>
            <div className="bg-purple-50 rounded-lg p-3">
              <h4 className="font-semibold text-purple-800 mb-1 text-sm">
                Font Size
              </h4>
              <p className="text-purple-600 text-sm capitalize">
                {preferences.fontSize}
              </p>
            </div>
            <div className="bg-orange-50 rounded-lg p-3">
              <h4 className="font-semibold text-orange-800 mb-1 text-sm">
                Overlay Position
              </h4>
              <p className="text-orange-600 text-sm">
                {getPositionDisplayName(preferences.overlayPosition)}
              </p>
            </div>
          </div>
          <div className="text-center mt-4">
            <button
              onClick={() => setShowPreferences(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
            >
              Adjust Settings
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
