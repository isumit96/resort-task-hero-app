
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslations from './locales/en.json';
import hiTranslations from './locales/hi.json';
import knTranslations from './locales/kn.json';

// Create a function to handle dynamic content translation
// This will allow us to pass dynamic content through i18next
const createDynamicContentHandler = () => {
  const dynamicContent: Record<string, Record<string, string>> = {
    en: {},
    hi: {},
    kn: {}
  };

  // Function to register dynamic content for all supported languages
  const registerContent = (key: string, content: string, language = 'en') => {
    if (!dynamicContent[language]) dynamicContent[language] = {};
    
    // Store the content in the specified language
    dynamicContent[language][key] = content;
    
    // Also store as English version if not explicitly added
    if (language === 'en' && !dynamicContent['en'][key]) {
      dynamicContent['en'][key] = content;
    }
  };

  // Function to retrieve content
  const getContent = (key: string, language: string) => {
    // Check if we have the translation in requested language
    if (dynamicContent[language] && dynamicContent[language][key]) {
      return dynamicContent[language][key];
    }
    
    // Fallback to English if translation not found
    if (language !== 'en' && dynamicContent['en'] && dynamicContent['en'][key]) {
      return dynamicContent['en'][key];
    }
    
    // If it's a placeholder key (like step_UUID or task_title_UUID), extract original content
    if (key.match(/^(task_title_|task_location_|step_)[0-9a-f-]+$/)) {
      // Return a readable version of the placeholder if no translation exists
      return key.replace(/^(task_title_|task_location_|step_)[0-9a-f-]+$/, '');
    }
    
    // If no translation found at all, return the key itself (original content)
    return key;
  };

  return { registerContent, getContent, dynamicContent };
};

export const dynamicTranslations = createDynamicContentHandler();

// Create a custom interpolator to handle dynamic content
const customInterpolator = (value: string, format: string, lng: string) => {
  // If format is 'dynamic', try to find the value in our dynamic content
  if (format === 'dynamic') {
    const translatedContent = dynamicTranslations.getContent(value, lng);
    // Return the translated content or the original value if no translation found
    return translatedContent || value;
  }
  // Otherwise, use the default interpolator behavior
  return value;
};

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
    interpolation: {
      escapeValue: false,
      format: customInterpolator
    }
  });

export default i18n;
