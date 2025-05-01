
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
  
  // Log translation availability for debugging
  if (debugMode) {
    const resources = i18n.options.resources?.[lng];
    const translation = resources?.translation as Record<string, any> | undefined;
    
    if (translation && typeof translation === 'object') {
      // Check for task translations
      const tasksObject = translation.tasks;
      if (tasksObject && typeof tasksObject === 'object') {
        // Find task IDs (guid format)
        const taskIds = Object.keys(tasksObject).filter(key => 
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(key)
        );
        
        console.log(`Found ${taskIds.length} task translations for language ${lng}:`, taskIds);
        
        // For each task, check if it has steps
        taskIds.forEach(taskId => {
          const taskObj = tasksObject[taskId];
          if (taskObj && typeof taskObj === 'object' && 'step' in taskObj) {
            const stepObj = taskObj.step;
            if (stepObj && typeof stepObj === 'object') {
              const stepIds = Object.keys(stepObj);
              console.log(`Task ${taskId} has ${stepIds.length} step translations:`, stepIds);
            } else {
              console.log(`Task ${taskId} has no valid step translations`);
            }
          } else {
            console.log(`Task ${taskId} found but has no step object`);
          }
        });
      } else {
        console.log(`No task translations found for language ${lng}`);
      }
    }
  }

  // Invalidate all task-related queries to refresh translations
  const queryClient = window.queryClient;
  if (queryClient) {
    queryClient.invalidateQueries({ queryKey: ["tasks"] });
    queryClient.invalidateQueries({ queryKey: ["task"] });
    console.log("Task queries invalidated after language change");
  }
});

// Make queryClient available globally for language change handler
declare global {
  interface Window {
    queryClient: any;
  }
}

// Log current language on initialization
console.log('i18n initialized with language:', i18n.language);

export default i18n;
