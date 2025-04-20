
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

// Initialize dark mode before rendering
initializeDarkMode();

// Create root once and store in a variable - optimize render process
const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(<App />);
} else {
  console.error("Root element not found!");
}
