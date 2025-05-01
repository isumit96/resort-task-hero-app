
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslations from './locales/en.json';
import hiTranslations from './locales/hi.json';
import knTranslations from './locales/kn.json';

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
    debug: true, // Enable debug mode to see more logs
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    }
  });

// Log current language on initialization
console.log('i18n initialized with language:', i18n.language);

export default i18n;
