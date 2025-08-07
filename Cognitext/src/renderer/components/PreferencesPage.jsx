import React, { useState } from "react";

function PreferencesPage({ preferences, onPreferencesChange, onBack }) {
  const [localPreferences, setLocalPreferences] = useState(preferences);

  const handleGradeLevelChange = (e) => {
    const newPrefs = {
      ...localPreferences,
      gradeLevel: parseInt(e.target.value),
    };
    setLocalPreferences(newPrefs);
    onPreferencesChange(newPrefs);
  };

  const handleOcrThresholdChange = (e) => {
    const newPrefs = {
      ...localPreferences,
      ocrConfidenceThreshold: parseInt(e.target.value),
    };
    setLocalPreferences(newPrefs);
    onPreferencesChange(newPrefs);
  };

  const handleFontSizeChange = (e) => {
    const newPrefs = { ...localPreferences, fontSize: e.target.value };
    setLocalPreferences(newPrefs);
    onPreferencesChange(newPrefs);
  };

  const handleThemeChange = (e) => {
    const newPrefs = { ...localPreferences, theme: e.target.value };
    setLocalPreferences(newPrefs);
    onPreferencesChange(newPrefs);
  };

  const handleOverlayPositionChange = (e) => {
    const newPrefs = { ...localPreferences, overlayPosition: e.target.value };
    setLocalPreferences(newPrefs);
    onPreferencesChange(newPrefs);
  };

  const getGradeLevelText = (level) => {
    if (level === 13) return "College Level";
    const ordinals = [
      "",
      "1st",
      "2nd",
      "3rd",
      "4th",
      "5th",
      "6th",
      "7th",
      "8th",
      "9th",
      "10th",
      "11th",
      "12th",
    ];
    return `${ordinals[level]} Grade`;
  };

  const getReadingDescription = (level) => {
    const descriptions = {
      1: "Very simple sentences, basic vocabulary",
      2: "Short sentences, common words",
      3: "Simple paragraphs, everyday language",
      4: "Clear sentences, familiar concepts",
      5: "Standard paragraphs, general vocabulary",
      6: "Detailed explanations, varied vocabulary",
      7: "Complex sentences, academic terms",
      8: "Advanced vocabulary, detailed concepts",
      9: "Sophisticated language, abstract ideas",
      10: "Complex paragraphs, specialized terms",
      11: "Advanced academic writing",
      12: "Pre-college level complexity",
      13: "University-level academic text",
    };
    return descriptions[level] || "Simplified text";
  };

  const getPositionDescription = (position) => {
    const descriptions = {
      smart:
        "Automatically places overlay in the best available position (right → left → below → above)",
      right: "Simplified text always appears to the right of captured text",
      left: "Simplified text always appears to the left of captured text",
      below: "Simplified text always appears below captured text",
      above: "Simplified text always appears above captured text",
    };
    return descriptions[position] || "Smart positioning";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl p-8 max-w-lg w-full">
        <div className="mb-6">
          <button
            onClick={onBack}
            className="flex items-center text-blue-600 hover:text-blue-700 mb-4 transition-colors"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Main
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Preferences</h1>
          <p className="text-gray-600">
            Customize your text simplification experience
          </p>
        </div>

        <div className="space-y-6">
          {/* Reading Level Setting */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Reading Level
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comprehension Level:{" "}
                {getGradeLevelText(localPreferences.gradeLevel)}
              </label>
              <input
                type="range"
                min="1"
                max="13"
                value={localPreferences.gradeLevel}
                onChange={handleGradeLevelChange}
                className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>1st Grade</span>
                <span>6th Grade</span>
                <span>12th Grade</span>
                <span>College</span>
              </div>
            </div>
            <p className="text-sm text-gray-600 bg-white p-3 rounded border-l-4 border-blue-400">
              <strong>Effect:</strong>{" "}
              {getReadingDescription(localPreferences.gradeLevel)}
            </p>
          </div>

          {/* OCR Settings */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              OCR Settings
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confidence Threshold: {localPreferences.ocrConfidenceThreshold}%
              </label>
              <input
                type="range"
                min="50"
                max="95"
                value={localPreferences.ocrConfidenceThreshold}
                onChange={handleOcrThresholdChange}
                className="w-full h-2 bg-green-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>50% (Lenient)</span>
                <span>95% (Strict)</span>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Higher values require more confident text recognition but may miss
              some text.
            </p>
          </div>

          {/* Overlay Positioning */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Overlay Positioning
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Where should the simplified text appear?
              </label>
              <select
                value={localPreferences.overlayPosition || "smart"}
                onChange={handleOverlayPositionChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="smart">
                  Smart (Automatically choose best position)
                </option>
                <option value="right">Always to the right</option>
                <option value="left">Always to the left</option>
                <option value="below">Always below</option>
                <option value="above">Always above</option>
              </select>
            </div>
            <div className="bg-white p-4 rounded border-l-4 border-purple-400">
              <p className="text-sm text-gray-600 mb-2">
                <strong>Current:</strong>{" "}
                {getPositionDescription(
                  localPreferences.overlayPosition || "smart"
                )}
              </p>
              <div className="flex items-center space-x-4 text-xs text-gray-500">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-200 border border-blue-400 rounded mr-1"></div>
                  <span>Text Region</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-200 border border-green-400 rounded mr-1"></div>
                  <span>Simplified Text</span>
                </div>
              </div>
            </div>
          </div>

          {/* Display Settings */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Display Settings
            </h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Font Size
              </label>
              <select
                value={localPreferences.fontSize}
                onChange={handleFontSizeChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
                <option value="extra-large">Extra Large</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Theme
              </label>
              <select
                value={localPreferences.theme}
                onChange={handleThemeChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="auto">Auto (System)</option>
              </select>
            </div>
          </div>

          {/* Test Area */}
          <div className="bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Preview
            </h3>
            <div
              className={`p-4 rounded border ${
                localPreferences.fontSize === "small"
                  ? "text-sm"
                  : localPreferences.fontSize === "medium"
                  ? "text-base"
                  : localPreferences.fontSize === "large"
                  ? "text-lg"
                  : "text-xl"
              } ${
                localPreferences.theme === "dark"
                  ? "bg-gray-800 text-white"
                  : "bg-white text-gray-800"
              }`}
            >
              This is how your simplified text will appear in the overlay
              window.
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Settings are automatically saved and will be applied to your next
            text capture.
          </p>
        </div>
      </div>
    </div>
  );
}

export default PreferencesPage;
