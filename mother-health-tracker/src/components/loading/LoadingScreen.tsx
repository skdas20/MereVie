import React, { useState, useEffect } from 'react';
import './LoadingScreen.css';

interface LoadingScreenProps {
  onLoadingComplete: () => void;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ onLoadingComplete }) => {
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prevProgress => {
        const newProgress = prevProgress + Math.random() * 10;
        return newProgress >= 100 ? 100 : newProgress;
      });
    }, 200);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (progress === 100) {
      setTimeout(() => {
        setFadeOut(true);
        setTimeout(() => {
          onLoadingComplete();
        }, 1000);
      }, 500);
    }
  }, [progress, onLoadingComplete]);

  return (
    <div className={`loading-screen ${fadeOut ? 'fade-out' : ''}`}>
      {/* Bubbles */}
      <div className="loading-bubble"></div>
      <div className="loading-bubble"></div>
      <div className="loading-bubble"></div>
      <div className="loading-bubble"></div>
      <div className="loading-bubble"></div>
      <div className="loading-bubble"></div>
      <div className="loading-bubble"></div>
      
      {/* Wave Animation */}
      <div className="liquid-wave"></div>
      <div className="liquid-wave"></div>

      <div className="loading-content">
        <div className="logo-container">
          <div className="logo-circle">
            <div className="logo-water"></div>
            <div className="mother-icon">
              <div className="mother-head"></div>
              <div className="mother-body">
                <div className="baby-bump">
                  <div className="baby-outline"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <h1 className="loading-title">MèreVie</h1>
        <div className="loading-subtitle">Your Maternal Health Companion</div>
        
        <div className="loading-progress-container">
          <div 
            className="loading-progress-bar" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div className="loading-percentage">{Math.round(progress)}%</div>
      </div>
    </div>
  );
};

export default LoadingScreen;
