import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Vite PWA setup handles service worker registration internally.
// Remove manual registration if you plan to use Vite PWA plugin.
// No need to manually register service worker, Vite PWA will handle it automatically.
