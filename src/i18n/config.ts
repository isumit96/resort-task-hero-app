
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslations from './locales/en.json';
import hiTranslations from './locales/hi.json';
import knTranslations from './locales/kn.json';

// Add more detailed logging for development
const debugMode = false; // Set to false to reduce console warnings

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslations },
      hi: { translation: hiTranslations },
      kn: { translation: knTranslations }
    },
    fallbackLng: 'en',
    debug: debugMode,
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    },
    saveMissing: false, // Don't log missing keys
    parseMissingKeyHandler: (key) => {
      // For dynamic keys (like task.{id}.title), return empty string to use default value
      const segments = key.split('.');
      if (segments.length >= 3) {
        return ''; // Return empty string to use defaultValue
      }
      return key;
    },
    nsSeparator: false, // Allow colons in keys without treating them as namespace separators
    keySeparator: false, // Allow dots in keys without treating them as key separators
  });

// Force reload when language changes to ensure all components update correctly
i18n.on('languageChanged', (lng) => {
  console.log(`Language changed to: ${lng}`);
  
  // Invalidate all task-related queries to refresh translations
  const queryClient = window.queryClient;
  if (queryClient) {
    queryClient.invalidateQueries({ queryKey: ["tasks"] });
    queryClient.invalidateQueries({ queryKey: ["task"] });
  }
});

// Make queryClient available globally for language change handler
declare global {
  interface Window {
    queryClient: any;
  }
}

export default i18n;
