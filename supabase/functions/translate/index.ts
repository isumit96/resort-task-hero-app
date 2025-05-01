
import { serve } from "https://deno.land/std@0.182.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Google Translate API constants
const GOOGLE_TRANSLATE_BASE_URL = "https://translate.google.com/translate_a/single";

interface TranslationRequest {
  text: string | string[];
  target: string;
  source?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // For GET requests - used for single translation lookups
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const text = url.searchParams.get('text');
      const target = url.searchParams.get('target') || 'en';
      const source = url.searchParams.get('source') || 'en';
      
      if (!text) {
        return new Response(
          JSON.stringify({ error: 'Missing text parameter' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }
      
      console.log(`Translating: "${text}" from ${source} to ${target}`);
      const result = await translateText(text, target, source);
      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // For POST requests - used for batch translations
    if (req.method === 'POST') {
      const { text, target, source = 'en' } = await req.json() as TranslationRequest;
      
      if (!text || !target) {
        return new Response(
          JSON.stringify({ error: 'Missing text or target language' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }
      
      console.log(`Batch translating to ${target}`);
      const result = await translateText(text, target, source);
      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 405 }
    );
  } catch (error) {
    console.error('Translation error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

async function translateText(text: string | string[], target: string, source: string = 'en'): Promise<any> {
  try {
    if (Array.isArray(text)) {
      // Handle batch translation
      const promises = text.map(item => googleTranslate(item, source, target));
      const translations = await Promise.all(promises);
      
      return {
        translations: translations.map(translatedText => {
          return {
            translatedText,
            detectedSourceLanguage: source
          };
        })
      };
    } else {
      // Handle single translation
      const translatedText = await googleTranslate(text, source, target);
      
      return {
        translations: [{
          translatedText,
          detectedSourceLanguage: source
        }]
      };
    }
  } catch (error) {
    console.error('Translation API error:', error);
    throw new Error('Failed to translate text');
  }
}

// Implementation based on the unofficial Google Translate API
async function googleTranslate(text: string, sourceLang: string, targetLang: string): Promise<string> {
  try {
    // Prepare parameters for the Google Translate API
    const params = new URLSearchParams({
      client: 'gtx',
      sl: sourceLang,
      tl: targetLang,
      dt: 't',
      q: text,
    });

    const url = `${GOOGLE_TRANSLATE_BASE_URL}?${params.toString()}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.81 Safari/537.36',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    
    // Google Translate API returns a nested array structure
    // The translations are in the first element of the first array
    if (data && Array.isArray(data) && data[0] && Array.isArray(data[0])) {
      let translatedText = '';
      
      // Combine all the translated sentences into one string
      for (const translationPart of data[0]) {
        if (translationPart[0]) {
          translatedText += translationPart[0];
        }
      }
      
      return translatedText;
    }
    
    throw new Error('Invalid response format from translation service');
  } catch (error) {
    console.error(`Translation error for text "${text}":`, error);
    // In case of error, return the original text to avoid breaking the app
    return text;
  }
}
