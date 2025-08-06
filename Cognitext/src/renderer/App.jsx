import React, { useState, useEffect } from 'react';
import OverlayWindow from './components/OverlayWindow';

function App() {
  const [isOverlayMode, setIsOverlayMode] = useState(false);
  const [simplifiedText, setSimplifiedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState('capturing');

  useEffect(() => {
    console.log('App: Setting up event listeners');
    
    // Listen for messages from main process
    window.electronAPI?.onTextSimplified((text) => {
      console.log('App: Text simplified received:', text);
      setSimplifiedText(text);
      setIsLoading(false);
      setIsOverlayMode(true);
    });

    window.electronAPI?.onProcessingStarted(() => {
      console.log('App: Processing started');
      setIsLoading(true);
      setIsOverlayMode(true);
      setLoadingStage('capturing');
      setSimplifiedText(''); // Clear previous text
    });

    window.electronAPI?.onLoadingStage((stage) => {
      console.log('App: Loading stage changed to:', stage);
      setLoadingStage(stage);
    });

    // Check if this window is in overlay mode
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('mode') === 'overlay') {
      console.log('App: Overlay mode detected');
      setIsOverlayMode(true);
    }
  }, []);

  if (isOverlayMode) {
    return (
      <OverlayWindow 
        text={simplifiedText}
        isLoading={isLoading}
        loadingStage={loadingStage}
        onClose={() => window.electronAPI?.closeOverlay()}
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
                <li>1. Press <kbd className="bg-gray-200 px-2 py-1 rounded text-xs">Ctrl + Alt + S</kbd></li>
                <li>2. Click and drag to select text area</li>
                <li>3. View simplified text in overlay</li>
              </ol>
            </div>
            <button 
              onClick={() => window.electronAPI?.testCapture()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Test Screen Capture
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;