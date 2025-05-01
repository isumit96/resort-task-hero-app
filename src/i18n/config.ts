
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { supabase } from "@/integrations/supabase/client";

import enTranslations from './locales/en.json';
import hiTranslations from './locales/hi.json';
import knTranslations from './locales/kn.json';

// Create a function to handle dynamic content translation with database backing
const createDynamicContentHandler = () => {
  // In-memory cache of translations to avoid constant DB lookups
  const dynamicContent: Record<string, Record<string, string>> = {
    en: {},
    hi: {},
    kn: {}
  };

  // Track which keys have been requested for translation but not yet available
  const pendingTranslations: Set<string> = new Set();
  
  // Track if a translation job is currently in progress
  let translationJobInProgress = false;
  
  // Loading status for translations
  const loadingStatus: Record<string, boolean> = {};

  // Function to register dynamic content for all supported languages
  const registerContent = async (key: string, content: string, language = 'en') => {
    if (!dynamicContent[language]) dynamicContent[language] = {};
    
    // Store the content in the specified language
    dynamicContent[language][key] = content;
    
    // English is our source language - store it for fallback purposes
    if (language === 'en' && !dynamicContent['en'][key]) {
      dynamicContent['en'][key] = content;
      
      // Extract content type and ID from the key
      const keyParts = key.split('_');
      
      if (keyParts.length >= 3) {
        const contentType = keyParts[0] + '_' + keyParts[1]; // e.g., task_title
        const contentId = keyParts.slice(2).join('_'); // Get everything after the first two parts
        
        // Check if translations already exist in the database
        try {
          const { data: existingTranslations } = await supabase
            .from('translations')
            .select('target_lang, translated_text')
            .eq('content_type', contentType)
            .eq('content_id', contentId)
            .eq('source_text', content);
          
          // If we have translations in the database, add them to our cache
          if (existingTranslations && existingTranslations.length > 0) {
            existingTranslations.forEach(translation => {
              const lang = translation.target_lang;
              if (dynamicContent[lang]) {
                dynamicContent[lang][key] = translation.translated_text;
              }
            });
            console.log(`[Translations] Loaded ${existingTranslations.length} existing translations for ${key}`);
          } else {
            // Queue this content for translation if it's not already in the database
            queueForTranslation(key, contentType, contentId, content);
          }
        } catch (error) {
          console.error('[Translations] Error fetching existing translations:', error);
          // Still queue for translation as a fallback
          queueForTranslation(key, contentType, contentId, content);
        }
      }
    }
  };
  
  // Queue content for translation
  const queueForTranslation = (key: string, contentType: string, contentId: string, text: string) => {
    // Mark this key as pending translation
    pendingTranslations.add(key);
    
    // Set loading status for this key
    loadingStatus[key] = true;
    
    console.log(`[Translations] Queueing translation for ${key}`);
    
    // Debounce translation requests to batch them
    if (!translationJobInProgress) {
      translationJobInProgress = true;
      
      // Wait a short time to collect multiple translation requests
      setTimeout(async () => {
        try {
          // Collect all pending translations
          const translationBatch = Array.from(pendingTranslations).map(pendingKey => {
            const parts = pendingKey.split('_');
            const type = parts[0] + '_' + parts[1];
            const id = parts.slice(2).join('_');
            
            return {
              key: pendingKey,
              contentType: type,
              contentId: id,
              text: dynamicContent['en'][pendingKey] || ''
            };
          }).filter(item => item.text.trim() !== '');
          
          if (translationBatch.length > 0) {
            console.log(`[Translations] Sending batch of ${translationBatch.length} translations`);
            
            // Clear pending translations set as we're processing them
            pendingTranslations.clear();
            
            // Call the translation edge function
            const response = await supabase.functions.invoke('translate', {
              body: {
                items: translationBatch.map(item => ({
                  contentType: item.contentType,
                  contentId: item.contentId,
                  text: item.text,
                  sourceLang: 'en'
                })),
                targetLanguages: ['hi', 'kn']
              }
            });
            
            if (response.error) {
              throw new Error(`Translation API error: ${response.error.message}`);
            }
            
            // Process the results and update our cache
            const data = response.data;
            if (data.results && Array.isArray(data.results)) {
              data.results.forEach(result => {
                const { contentType, contentId, targetLang, translatedText } = result;
                const key = `${contentType}_${contentId}`;
                
                if (dynamicContent[targetLang]) {
                  dynamicContent[targetLang][key] = translatedText;
                }
                
                // Mark this key as loaded
                loadingStatus[key] = false;
              });
              
              console.log(`[Translations] Processed ${data.results.length} translations`);
            } else if (data.jobId) {
              console.log(`[Translations] Created translation job ${data.jobId} for batch processing`);
              
              // Start polling for job completion (simplified version)
              setTimeout(() => {
                pollTranslationJobs();
              }, 5000);
            }
          }
        } catch (error) {
          console.error('[Translations] Error in translation batch processing:', error);
        } finally {
          translationJobInProgress = false;
        }
      }, 1000); // Wait 1 second to batch requests
    }
  };
  
  // Poll for completed translation jobs
  const pollTranslationJobs = async () => {
    try {
      // Fix: Remove the 'path' property and use the correct method syntax
      const response = await supabase.functions.invoke('translate', {
        method: 'GET'
        // Remove the incorrect 'path' parameter
      });
      
      if (response.error) {
        console.error('[Translations] Error processing jobs:', response.error);
        return;
      }
      
      // Check if jobs were processed
      if (response.data?.results?.length > 0) {
        console.log(`[Translations] Processed ${response.data.results.length} translation jobs`);
        
        // Update cache with fresh translations from the database
        loadTranslationsFromDatabase();
      }
    } catch (error) {
      console.error('[Translations] Error polling translation jobs:', error);
    }
  };
  
  // Load translations from the database to the cache
  const loadTranslationsFromDatabase = async () => {
    try {
      const { data: translations, error } = await supabase
        .from('translations')
        .select('content_type, content_id, target_lang, translated_text')
        .order('updated_at', { ascending: false })
        .limit(100); // Fetch the most recent translations
      
      if (error) throw error;
      
      if (translations && translations.length > 0) {
        translations.forEach(translation => {
          const key = `${translation.content_type}_${translation.content_id}`;
          const lang = translation.target_lang;
          
          if (dynamicContent[lang]) {
            dynamicContent[lang][key] = translation.translated_text;
          }
          
          // Mark this key as loaded
          loadingStatus[key] = false;
        });
        
        console.log(`[Translations] Loaded ${translations.length} translations from database`);
      }
    } catch (error) {
      console.error('[Translations] Error loading translations from database:', error);
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

  // Check if a translation is still loading
  const isTranslationLoading = (key: string): boolean => {
    return !!loadingStatus[key];
  };
  
  // Preload translations for a specific type and set of IDs
  const preloadTranslations = async (contentType: string, contentIds: string[]) => {
    try {
      // Skip if no IDs to load
      if (contentIds.length === 0) return;
      
      // Query the database for all translations matching these IDs
      const { data: translations, error } = await supabase
        .from('translations')
        .select('content_type, content_id, source_lang, target_lang, source_text, translated_text')
        .eq('content_type', contentType)
        .in('content_id', contentIds);
      
      if (error) throw error;
      
      if (translations && translations.length > 0) {
        // Group by content ID and language
        const translationMap: Record<string, Record<string, string>> = {};
        
        translations.forEach(translation => {
          // Handle English (source) text
          if (translation.source_lang === 'en') {
            const key = `${contentType}_${translation.content_id}`;
            if (!dynamicContent['en'][key]) {
              dynamicContent['en'][key] = translation.source_text;
            }
          }
          
          // Handle translated text
          const key = `${contentType}_${translation.content_id}`;
          const lang = translation.target_lang;
          
          if (dynamicContent[lang]) {
            dynamicContent[lang][key] = translation.translated_text;
            // Mark as loaded
            loadingStatus[key] = false;
          }
        });
        
        console.log(`[Translations] Preloaded ${translations.length} translations`);
      }
      
      // Identify missing translations that need to be requested
      const missingIds = [];
      
      for (const id of contentIds) {
        const key = `${contentType}_${id}`;
        
        // If we don't have English content, we can't translate
        if (!dynamicContent['en'][key]) {
          continue;
        }
        
        // Check if we're missing any target language
        const needsTranslation = !dynamicContent['hi'][key] || !dynamicContent['kn'][key];
        
        if (needsTranslation) {
          missingIds.push(id);
        }
      }
      
      // Queue missing translations
      if (missingIds.length > 0) {
        console.log(`[Translations] Queueing ${missingIds.length} missing translations`);
        
        for (const id of missingIds) {
          const key = `${contentType}_${id}`;
          const text = dynamicContent['en'][key];
          
          if (text) {
            queueForTranslation(key, contentType, id, text);
          }
        }
      }
    } catch (error) {
      console.error('[Translations] Error preloading translations:', error);
    }
  };

  // Debug function to see all registered content
  const getAllContent = () => {
    return dynamicContent;
  };

  // Initialize by loading translations for the current page
  const initializeTranslations = () => {
    loadTranslationsFromDatabase();
  };

  // Call initialize
  initializeTranslations();

  return { 
    registerContent, 
    getContent, 
    getAllContent, 
    dynamicContent,
    isTranslationLoading,
    preloadTranslations
  };
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
