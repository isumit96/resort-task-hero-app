
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslations from './locales/en.json';
import hiTranslations from './locales/hi.json';
import knTranslations from './locales/kn.json';

// Create a function to handle dynamic content translation
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
    
    // Also store as English version for fallback purposes
    if (language === 'en' && !dynamicContent['en'][key]) {
      dynamicContent['en'][key] = content;
    }
  };

  // Function to retrieve content with proper fallback
  const getContent = (key: string, language: string): string => {
    // Handle the case where key is not a string
    if (typeof key !== 'string') {
      console.warn('Invalid key passed to getContent:', key);
      return String(key);
    }
    
    // First priority: Get content in the requested language if it exists
    if (dynamicContent[language] && dynamicContent[language][key]) {
      return dynamicContent[language][key];
    }
    
    // Second priority: Fallback to English if translation not found
    if (language !== 'en' && dynamicContent['en'] && dynamicContent['en'][key]) {
      return dynamicContent['en'][key];
    }
    
    // If this is a key like task_title_UUID, extract the original content
    const dynamicKeyMatch = key.match(/^(task_title_|task_location_|step_)([0-9a-f-]+)$/);
    if (dynamicKeyMatch) {
      // Return original content from English if available
      const englishContent = dynamicContent['en'] && dynamicContent['en'][key];
      if (englishContent) return englishContent;
      
      // If no content found, return a more readable default
      return "";
    }
    
    // Last resort: return the key itself (should be avoided)
    return key;
  };

  // Debug function to see all registered content
  const getAllContent = () => {
    return dynamicContent;
  };

  return { registerContent, getContent, getAllContent, dynamicContent };
};

export const dynamicTranslations = createDynamicContentHandler();

// Custom interpolation function for dynamic content
const customInterpolator = (value: string, format: string, lng: string): string => {
  // Only process if format is 'dynamic' and value is a string
  if (format === 'dynamic' && typeof value === 'string') {
    // Get translated content with fallback
    const translatedContent = dynamicTranslations.getContent(value, lng);
    
    // Return the translated content if found
    if (translatedContent) {
      return translatedContent;
    }
  }
  
  // Return the original value for other formats
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
