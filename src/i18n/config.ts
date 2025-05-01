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
    // Handle the case where key is not a string (should never happen but just in case)
    if (typeof key !== 'string') {
      console.warn('Invalid key passed to getContent:', key);
      return String(key);
    }
    
    // Check if we have the translation in requested language
    if (dynamicContent[language] && dynamicContent[language][key]) {
      return dynamicContent[language][key];
    }
    
    // Fallback to English if translation not found
    if (language !== 'en' && dynamicContent['en'] && dynamicContent['en'][key]) {
      return dynamicContent['en'][key];
    }
    
    // If we're dealing with a dynamic key like task_title_UUID or step_UUID
    // Extract and return the original content rather than showing the key
    const dynamicKeyMatch = key.match(/^(task_title_|task_location_|step_)([0-9a-f-]+)$/);
    if (dynamicKeyMatch) {
      // For these patterns, return a more readable message instead of the key
      const prefix = dynamicKeyMatch[1];
      if (prefix === 'task_title_') return 'Task';
      if (prefix === 'task_location_') return 'Location';
      if (prefix === 'step_') return 'Step';
      
      // Return the UUID part if all else fails
      return key;
    }
    
    // If no translation found at all, return the key itself
    return key;
  };

  // Debug function to see all registered content
  const getAllContent = () => {
    return dynamicContent;
  };

  return { registerContent, getContent, getAllContent, dynamicContent };
};

export const dynamicTranslations = createDynamicContentHandler();

// Create a custom interpolator to handle dynamic content
const customInterpolator = (value: string, format: string, lng: string) => {
  // If format is 'dynamic', try to find the value in our dynamic content
  if (format === 'dynamic' && typeof value === 'string') {
    // Get translated content or fallback
    const translatedContent = dynamicTranslations.getContent(value, lng);
    
    // Return original value if translation failed and value doesn't look like a UUID key
    if (translatedContent === value && !value.match(/^(task_title_|task_location_|step_)([0-9a-f-]+)$/)) {
      return value;
    }
    
    return translatedContent;
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
    },
    debug: process.env.NODE_ENV === 'development'
  });

export default i18n;
