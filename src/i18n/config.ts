
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
    // These settings ensure we always fall back to the original text
    saveMissing: debugMode,
    missingKeyHandler: (lng, ns, key, fallbackValue) => {
      console.log(`Missing translation key: [${lng}] ${ns}:${key} => fallback: "${fallbackValue}"`);
    },
    parseMissingKeyHandler: (key) => {
      // Return the original text as fallback
      return undefined;
    },
    // This ensures the original key is returned instead of the last segment
    returnEmptyString: false,
    returnNull: false
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
    
    // Add more detailed logging for Hindi translations to help diagnose the issue
    if (lng === 'hi' && translation && typeof translation === 'object' && 'tasks' in translation) {
      const tasks = translation.tasks as Record<string, any>;
      console.log('Hindi tasks available:', Object.keys(tasks));
      
      // Check if the specific task ID exists in the Hindi translations
      const taskId = '6af83dbc-b9f4-4e00-a6b6-a4055324a29c';
      if (taskId in tasks) {
        console.log(`Task ${taskId} found in Hindi translations`);
        if ('step' in tasks[taskId]) {
          console.log('Steps found for this task:', Object.keys(tasks[taskId].step));
        } else {
          console.log('No steps found for this task in Hindi translations');
        }
      } else {
        console.log(`Task ${taskId} not found in Hindi translations`);
      }
    }
  }
});

// Log current language on initialization
console.log('i18n initialized with language:', i18n.language);

export default i18n;
