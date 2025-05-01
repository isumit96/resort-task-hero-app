
import { serve } from "https://deno.land/std@0.182.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const API_ENDPOINT = "https://translation.googleapis.com/language/translate/v2";

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
    // Since we're using a simple approach without API keys, we'll use a mock translation
    // In production, you would use a real translation API
    
    if (Array.isArray(text)) {
      // Handle batch translation
      return {
        translations: text.map(item => {
          return {
            translatedText: mockTranslate(item, target),
            detectedSourceLanguage: source
          };
        })
      };
    } else {
      // Handle single translation
      return {
        translations: [{
          translatedText: mockTranslate(text, target),
          detectedSourceLanguage: source
        }]
      };
    }
  } catch (error) {
    console.error('Translation API error:', error);
    throw new Error('Failed to translate text');
  }
}

// Mock translation function - in production, replace with actual Google Translate API call
function mockTranslate(text: string, target: string): string {
  // In a real implementation, this would call the Google Translate API
  // For demo purposes, we'll use a simple prefix to show translation happened
  const prefixes = {
    'hi': 'हिंदी: ',
    'kn': 'ಕನ್ನಡ: ',
  };
  
  return `${prefixes[target] || ''}${text}`;
}
