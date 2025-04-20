
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Initialize dark mode from localStorage or system preference on app load
const initializeDarkMode = () => {
  // Get value directly from localStorage instead of checking repeatedly
  const darkModeValue = localStorage.getItem('darkMode');
  
  if (darkModeValue === 'true' || 
     (!darkModeValue && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
  }
};

// Check if the app is running in a mobile environment
const isMobileApp = () => {
  return window.navigator.userAgent.includes('Android') || 
         document.URL.includes('android-app://');
};

// Handle back button for Android
const setupAndroidBackButton = () => {
  if (isMobileApp()) {
    document.addEventListener('backbutton', (e) => {
      e.preventDefault();
      // Let React Router handle navigation
      window.history.back();
    });
  }
};

// Initialize dark mode before rendering
initializeDarkMode();

// Setup mobile-specific handlers
setupAndroidBackButton();

// Prevent pull-to-refresh behavior in mobile wrapper
document.body.addEventListener('touchmove', (e) => {
  if (isMobileApp() && document.documentElement.scrollTop === 0) {
    e.preventDefault();
  }
}, { passive: false });

// Create root once and store in a variable - optimize render process
const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(<App />);
} else {
  console.error("Root element not found!");
}
