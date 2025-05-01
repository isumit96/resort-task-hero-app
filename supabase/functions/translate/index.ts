
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { encode as base64Encode } from 'https://deno.land/std@0.177.0/encoding/base64.ts';

// Access the secrets from environment variables
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const GOOGLE_TRANSLATE_API_KEY = Deno.env.get('GOOGLE_TRANSLATE_API_KEY');

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Set up CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Define the request handler for the Edge Function
serve(async (req: Request) => {
  // Handle OPTIONS requests for CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        ...corsHeaders,
        'Allow': 'OPTIONS, GET, POST'
      }
    });
  }
  
  // For GET requests - process pending translation jobs
  if (req.method === 'GET') {
    try {
      // Get pending translation jobs
      const { data: pendingJobs, error: jobsError } = await supabase
        .from('translation_jobs')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(5);
      
      if (jobsError) throw jobsError;
      
      const results = [];
      
      // Process each pending job
      for (const job of pendingJobs || []) {
        console.log(`Processing job ${job.id} with ${job.content_items.length} items`);
        
        try {
          // Process batch translations for this job
          const translations = await processTranslationItems(
            job.content_items,
            job.target_langs
          );
          
          // Update job status
          await supabase
            .from('translation_jobs')
            .update({
              status: 'completed',
              completed_at: new Date().toISOString()
            })
            .eq('id', job.id);
          
          results.push({
            jobId: job.id,
            itemsProcessed: translations.length
          });
        } catch (error) {
          console.error(`Failed to process job ${job.id}:`, error);
          
          // Mark job as failed
          await supabase
            .from('translation_jobs')
            .update({
              status: 'failed',
              error_message: error.message || 'Unknown error'
            })
            .eq('id', job.id);
            
          results.push({
            jobId: job.id,
            error: error.message || 'Unknown error'
          });
        }
      }
      
      return new Response(
        JSON.stringify({ results }),
        {
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          }
        }
      );
    } catch (error) {
      console.error('Error processing translation jobs:', error);
      return new Response(
        JSON.stringify({ error: error.message || 'Failed to process translation jobs' }),
        {
          status: 500,
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          }
        }
      );
    }
  }
  
  // For POST requests - handle new translation requests
  if (req.method === 'POST') {
    try {
      const { items, targetLanguages } = await req.json();
      
      if (!items || !Array.isArray(items) || items.length === 0) {
        throw new Error('No translation items provided');
      }
      
      if (!targetLanguages || !Array.isArray(targetLanguages) || targetLanguages.length === 0) {
        throw new Error('No target languages provided');
      }
      
      // Check if there are enough items to create a job or process directly
      if (items.length > 10) {
        // Create a translation job for batch processing later
        const { data: jobData, error: jobError } = await supabase
          .from('translation_jobs')
          .insert({
            content_items: items,
            target_langs: targetLanguages,
            status: 'pending'
          })
          .select()
          .single();
          
        if (jobError) throw jobError;
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Translation job created', 
            jobId: jobData.id 
          }),
          {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json' 
            }
          }
        );
      } else {
        // Process translations immediately for small batches
        const translations = await processTranslationItems(items, targetLanguages);
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Translations completed', 
            results: translations
          }),
          {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json' 
            }
          }
        );
      }
    } catch (error) {
      console.error('Error handling translation request:', error);
      return new Response(
        JSON.stringify({ error: error.message || 'Failed to process translation request' }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }
  }
  
  // Return 405 for unsupported HTTP methods
  return new Response(
    JSON.stringify({ error: 'Method not allowed' }),
    {
      status: 405,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Allow': 'OPTIONS, GET, POST'
      }
    }
  );
});

// Process a batch of translation items
async function processTranslationItems(items, targetLanguages) {
  const results = [];
  
  // Process each item in the batch
  for (const item of items) {
    const { contentType, contentId, text, sourceLang = 'en' } = item;
    
    if (!contentType || !contentId || !text) {
      console.warn('Skipping invalid translation item:', item);
      continue;
    }
    
    try {
      // Process translation for each target language
      for (const targetLang of targetLanguages) {
        if (targetLang === sourceLang) {
          continue; // Skip if source and target languages are the same
        }
        
        let translatedText;
        
        // Use Google Translate API if available
        if (GOOGLE_TRANSLATE_API_KEY) {
          translatedText = await translateWithGoogleAPI(text, sourceLang, targetLang);
        } else {
          // Fallback to a simple mock translation for demo/testing
          translatedText = await mockTranslate(text, targetLang);
        }
        
        // Check if translation already exists
        const { data: existingTranslations } = await supabase
          .from('translations')
          .select('id')
          .eq('content_type', contentType)
          .eq('content_id', contentId)
          .eq('target_lang', targetLang)
          .eq('source_text', text);
          
        if (existingTranslations && existingTranslations.length > 0) {
          // Update existing translation
          await supabase
            .from('translations')
            .update({
              translated_text: translatedText,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingTranslations[0].id);
        } else {
          // Insert new translation
          await supabase
            .from('translations')
            .insert({
              content_type: contentType,
              content_id: contentId,
              source_lang: sourceLang,
              target_lang: targetLang,
              source_text: text,
              translated_text: translatedText
            });
        }
        
        // Add to results
        results.push({
          contentType,
          contentId,
          sourceLang,
          targetLang,
          originalText: text,
          translatedText,
          success: true
        });
      }
    } catch (error) {
      console.error(`Translation error for ${contentType}_${contentId}:`, error);
      results.push({
        contentType,
        contentId,
        error: error.message || 'Translation failed',
        success: false
      });
    }
  }
  
  return results;
}

// Translate text using Google Translate API
async function translateWithGoogleAPI(text, sourceLang, targetLang) {
  const url = `https://translation.googleapis.com/language/translate/v2?key=${GOOGLE_TRANSLATE_API_KEY}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      q: text,
      source: sourceLang,
      target: targetLang,
      format: 'text'
    })
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Translate API error (${response.status}): ${errorText}`);
  }
  
  const data = await response.json();
  
  if (!data.data || !data.data.translations || data.data.translations.length === 0) {
    throw new Error('Invalid response from Google Translate API');
  }
  
  return data.data.translations[0].translatedText;
}

// Mock translation function for testing or when API key is not available
async function mockTranslate(text, targetLang) {
  // Simple mock translations to provide some response
  const mockPrefixes = {
    'hi': '[हिंदी] ',
    'kn': '[ಕನ್ನಡ] ',
    'default': '[Translated] '
  };
  
  const prefix = mockPrefixes[targetLang] || mockPrefixes.default;
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  return prefix + text;
}
