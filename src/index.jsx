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
// If you still need manual registration, keep it simple:
if ('serviceWorker' in navigator) {
	window.addEventListener('load', () => {
		navigator.serviceWorker.register('/sw.js') // Change to `sw.js` if that's your actual service worker file
			.then(registration => {
				console.log('Service Worker registered:', registration);
			})
			.catch(error => {
				console.error('Service Worker registration failed:', error);
			});
	});
}
