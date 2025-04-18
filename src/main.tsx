
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Initialize dark mode from localStorage or system preference on app load
const initializeDarkMode = () => {
  const isDarkMode = localStorage.getItem('darkMode') === 'true' || 
                    (!('darkMode' in localStorage) && 
                     window.matchMedia('(prefers-color-scheme: dark)').matches);
  
  if (isDarkMode) {
    document.documentElement.classList.add('dark');
  }
};

// Initialize dark mode before rendering
initializeDarkMode();

createRoot(document.getElementById("root")!).render(<App />);
