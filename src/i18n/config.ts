
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslations from './locales/en.json';
import hiTranslations from './locales/hi.json';
import knTranslations from './locales/kn.json';

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
    saveMissing: false,
    missingKeyHandler: (lng, ns, key, fallbackValue) => {
      if (debugMode) {
        console.log(`Missing translation key: [${lng}] ${ns}:${key} => fallback: "${fallbackValue}"`);
      }
      return fallbackValue || key;
    },
    returnNull: false,
    returnEmptyString: false,
    returnObjects: true,
    keySeparator: '.',
    nsSeparator: ':',
    parseMissingKeyHandler: (key) => {
      // Return the original key as a reasonable fallback
      return key;
    }
  });

// Log current language on initialization
console.log('i18n initialized with language:', i18n.language);

export default i18n;
