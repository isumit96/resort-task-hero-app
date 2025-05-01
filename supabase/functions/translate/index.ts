
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple translation API using Google Translate API (free tier)
async function translateText(text: string, targetLang: string, sourceLang: string = 'en') {
  try {
    // Free Google Translate API endpoint
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Translation API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Extract the translated text from the response
    // The response is a nested array where the first element contains translations
    if (data && data[0] && Array.isArray(data[0])) {
      // Combine all translated parts
      return data[0].map((item: any[]) => item[0]).join(' ');
    }
    
    throw new Error('Unexpected response format from translation API');
  } catch (error) {
    console.error('Translation error:', error);
    throw error;
  }
}

// Process a batch of translations
async function processBatch(items: Array<{
  text: string;
  contentType: string;
  contentId: string;
  sourceLang: string;
  targetLang: string;
}>, supabaseClient: any) {
  const results = [];
  const errors = [];
  
  // Process each item in the batch
  for (const item of items) {
    try {
      const { text, contentType, contentId, targetLang, sourceLang } = item;
      
      // Skip empty text
      if (!text || text.trim() === '') {
        continue;
      }
      
      // Get translation
      const translatedText = await translateText(text, targetLang, sourceLang);
      
      // Store in database
      const { data, error } = await supabaseClient
        .from('translations')
        .upsert({
          content_type: contentType,
          content_id: contentId,
          source_lang: sourceLang,
          target_lang: targetLang,
          source_text: text,
          translated_text: translatedText,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'content_type,content_id,target_lang' });
        
      if (error) throw error;
      
      results.push({
        contentType,
        contentId,
        targetLang,
        originalText: text,
        translatedText,
        success: true
      });
    } catch (error) {
      console.error(`Error processing item:`, error);
      errors.push({
        ...item,
        error: error.message,
        success: false
      });
    }
    
    // Add a small delay between API calls to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return { results, errors };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Get Supabase client with admin privileges for database operations
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? '',
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? '',
    );
    
    // Handle job processing request
    if (req.method === 'GET' && new URL(req.url).pathname.endsWith('/process-jobs')) {
      // Find pending jobs
      const { data: jobs, error: jobsError } = await supabaseClient
        .from('translation_jobs')
        .select('*')
        .eq('status', 'pending')
        .limit(5);
        
      if (jobsError) throw jobsError;
      
      if (!jobs || jobs.length === 0) {
        return new Response(
          JSON.stringify({ message: 'No pending jobs found' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Process each job
      const results = [];
      
      for (const job of jobs) {
        try {
          // Mark job as in progress by updating status
          await supabaseClient
            .from('translation_jobs')
            .update({ status: 'pending' })
            .eq('id', job.id);
          
          // Process all items in this job for all target languages
          const items = [];
          
          // Prepare items for translation
          for (const item of job.content_items) {
            for (const lang of job.target_langs) {
              items.push({
                text: item.text,
                contentType: item.content_type,
                contentId: item.content_id,
                sourceLang: 'en', // Default source language
                targetLang: lang
              });
            }
          }
          
          // Process the batch
          const batchResult = await processBatch(items, supabaseClient);
          
          // Mark job as completed
          await supabaseClient
            .from('translation_jobs')
            .update({
              status: 'completed',
              completed_at: new Date().toISOString()
            })
            .eq('id', job.id);
          
          results.push({
            jobId: job.id,
            ...batchResult
          });
        } catch (error) {
          console.error(`Error processing job ${job.id}:`, error);
          
          // Mark job as failed
          await supabaseClient
            .from('translation_jobs')
            .update({
              status: 'failed',
              error_message: error.message,
              completed_at: new Date().toISOString()
            })
            .eq('id', job.id);
          
          results.push({
            jobId: job.id,
            error: error.message,
            success: false
          });
        }
      }
      
      return new Response(
        JSON.stringify({ results }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Parse request body
    const { items = [], targetLanguages = ['hi', 'kn'] } = await req.json();
    
    if (!items || items.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No items provided for translation' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Option 1: Process translations directly (for small batches)
    if (items.length <= 5) {
      const translationItems = items.flatMap(item => 
        targetLanguages.map(lang => ({
          text: item.text,
          contentType: item.contentType,
          contentId: item.contentId,
          sourceLang: item.sourceLang || 'en',
          targetLang: lang
        }))
      );
      
      const result = await processBatch(translationItems, supabaseClient);
      
      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Option 2: Create a job for background processing (for larger batches)
    const { data: job, error: jobError } = await supabaseClient
      .from('translation_jobs')
      .insert({
        status: 'pending',
        content_items: items.map(item => ({
          content_type: item.contentType,
          content_id: item.contentId,
          text: item.text
        })),
        target_langs: targetLanguages
      })
      .select()
      .single();
      
    if (jobError) throw jobError;
    
    return new Response(
      JSON.stringify({ 
        message: 'Translation job created successfully',
        jobId: job.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in translate function:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
