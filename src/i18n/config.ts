
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslations from './locales/en.json';
import hiTranslations from './locales/hi.json';
import knTranslations from './locales/kn.json';

// Add more detailed logging for development
const debugMode = false; // Setting to false to reduce console noise

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
    returnNull: false,
    returnEmptyString: false,
    returnObjects: true,
    saveMissing: false, // Turn off saving missing keys
    missingKeyHandler: (lng, ns, key, fallbackValue) => {
      if (debugMode) {
        console.log(`Missing translation key: [${lng}] ${ns}:${key}`);
      }
    },
    parseMissingKeyHandler: (key) => {
      // For dynamic task IDs, just return the original key
      if (key.includes('.step.')) {
        return null; // Return null to use fallback
      }
      
      // Return the last segment after the last period as a reasonable fallback
      const segments = key.split('.');
      const lastSegment = segments[segments.length - 1];
      return lastSegment || key;
    }
  });

// Simpler language change handler with less logging
i18n.on('languageChanged', (lng) => {
  if (debugMode) {
    console.log(`Language changed to: ${lng}`);
  }
});

export default i18n;
