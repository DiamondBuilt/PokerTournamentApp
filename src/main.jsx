import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { unlockAudio } from './utils/audioManager';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Browsers block audio until the user interacts with the page. Prime the
// AudioContext on the first gesture so the timer's level/break alerts can play.
['pointerdown', 'keydown', 'touchstart'].forEach((evt) =>
  window.addEventListener(evt, unlockAudio, { once: true })
);

// Register the service worker for offline support (production builds only;
// skipped on http://localhost dev where it isn't needed and can cache stalely).
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`)
      .catch(() => {
        /* offline support is a progressive enhancement; ignore failures */
      });
  });
}
