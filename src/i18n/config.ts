
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslations from './locales/en.json';
import hiTranslations from './locales/hi.json';
import knTranslations from './locales/kn.json';

// Add more detailed logging for development
const debugMode = true;

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
    // Add these options for better debugging and smoother language switching
    saveMissing: debugMode,
    missingKeyHandler: (lng, ns, key, fallbackValue) => {
      console.log(`Missing translation key: [${lng}] ${ns}:${key} => fallback: "${fallbackValue}"`);
    },
    parseMissingKeyHandler: (key) => {
      // Return the last segment after the last period as a reasonable fallback
      const segments = key.split('.');
      const lastSegment = segments[segments.length - 1];
      return lastSegment || key;
    }
  });

// Force reload when language changes to ensure all components update correctly
i18n.on('languageChanged', (lng) => {
  console.log(`Language changed to: ${lng}`);
  // Explicitly log translation availability
  if (debugMode) {
    // Fix the TypeScript error by checking if resources and translation exist
    // and using type assertion to access tasks property safely
    const resources = i18n.options.resources?.[lng];
    const translation = resources?.translation as Record<string, any> | undefined;
    const taskKeys = translation && typeof translation === 'object' && 'tasks' in translation ? 
      Object.keys(translation.tasks || {}).filter(k => k.includes('-')) : 
      [];
    
    console.log(`Available task-specific translations: ${taskKeys.length}`, taskKeys);
  }
});

// Log current language on initialization
console.log('i18n initialized with language:', i18n.language);

export default i18n;
