
import { serve } from "https://deno.land/std@0.182.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Google Translate API constants
const GOOGLE_TRANSLATE_BASE_URL = "https://translate.google.com/translate_a/single";

const SUPPORTED_LANGUAGES = ['hi', 'kn']; // Hindi and Kannada

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the Admin key (needed for unrestricted access)
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase URL or service role key');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { type } = await req.json();
    let result: any;

    console.log(`Processing translation of all ${type || 'both task templates and template steps'}`);
    
    if (!type || type === 'task_templates') {
      // Fetch and translate all task templates
      const { data: templates, error: templatesError } = await supabase
        .from('task_templates')
        .select('*');
        
      if (templatesError) throw templatesError;
      
      console.log(`Found ${templates.length} templates to translate`);
      
      for (const template of templates) {
        // Skip if translations already exist
        if (template.title_hi && template.title_kn) {
          continue;
        }

        // Translate title, description, and location
        const translations: Record<string, any> = {};
        
        for (const lang of SUPPORTED_LANGUAGES) {
          if (template.title && !template[`title_${lang}`]) {
            translations[`title_${lang}`] = await googleTranslate(template.title, 'en', lang);
          }
          
          if (template.description && !template[`description_${lang}`]) {
            translations[`description_${lang}`] = await googleTranslate(template.description, 'en', lang);
          }
          
          if (template.location && !template[`location_${lang}`]) {
            translations[`location_${lang}`] = await googleTranslate(template.location, 'en', lang);
          }
        }

        // Update the template with translations
        const { error: updateError } = await supabase
          .from('task_templates')
          .update(translations)
          .eq('id', template.id);
        
        if (updateError) throw updateError;
      }
    }
    
    if (!type || type === 'template_steps') {
      // Fetch and translate all template steps
      const { data: steps, error: stepsError } = await supabase
        .from('template_steps')
        .select('*');
        
      if (stepsError) throw stepsError;
      
      console.log(`Found ${steps.length} template steps to translate`);
      
      for (const step of steps) {
        // Skip if translations already exist
        if (step.title_hi && step.title_kn) {
          continue; 
        }

        // Translate title
        const translations: Record<string, any> = {};
        
        for (const lang of SUPPORTED_LANGUAGES) {
          if (step.title && !step[`title_${lang}`]) {
            translations[`title_${lang}`] = await googleTranslate(step.title, 'en', lang);
          }
        }

        // Update the step with translations
        const { error: updateError } = await supabase
          .from('template_steps')
          .update(translations)
          .eq('id', step.id);
        
        if (updateError) throw updateError;
      }
    }

    if (!type || type === 'tasks') {
      // Fetch and translate all tasks
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('*');
        
      if (tasksError) throw tasksError;
      
      console.log(`Found ${tasks.length} tasks to translate`);
      
      for (const task of tasks) {
        // Skip if translations already exist
        if (task.title_hi && task.title_kn) {
          continue;
        }

        // Translate title, description, and location
        const translations: Record<string, any> = {};
        
        for (const lang of SUPPORTED_LANGUAGES) {
          if (task.title && !task[`title_${lang}`]) {
            translations[`title_${lang}`] = await googleTranslate(task.title, 'en', lang);
          }
          
          if (task.description && !task[`description_${lang}`]) {
            translations[`description_${lang}`] = await googleTranslate(task.description, 'en', lang);
          }
          
          if (task.location && !task[`location_${lang}`]) {
            translations[`location_${lang}`] = await googleTranslate(task.location, 'en', lang);
          }
        }

        // Update the task with translations
        const { error: updateError } = await supabase
          .from('tasks')
          .update(translations)
          .eq('id', task.id);
        
        if (updateError) throw updateError;
      }
    }

    if (!type || type === 'task_steps') {
      // Fetch and translate all task steps
      const { data: steps, error: stepsError } = await supabase
        .from('task_steps')
        .select('*');
        
      if (stepsError) throw stepsError;
      
      console.log(`Found ${steps.length} task steps to translate`);
      
      for (const step of steps) {
        // Skip if translations already exist
        if (step.title_hi && step.title_kn) {
          continue; 
        }

        // Translate title and comment
        const translations: Record<string, any> = {};
        
        for (const lang of SUPPORTED_LANGUAGES) {
          if (step.title && !step[`title_${lang}`]) {
            translations[`title_${lang}`] = await googleTranslate(step.title, 'en', lang);
          }
          
          if (step.comment && !step[`comment_${lang}`]) {
            translations[`comment_${lang}`] = await googleTranslate(step.comment, 'en', lang);
          }
        }

        // Update the step with translations
        const { error: updateError } = await supabase
          .from('task_steps')
          .update(translations)
          .eq('id', step.id);
        
        if (updateError) throw updateError;
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Translation of existing data completed successfully' 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error) {
    console.error('Error translating existing data:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        }, 
        status: 500 
      }
    );
  }
});

// Google Translate implementation (same as in the translate function)
async function googleTranslate(text: string, sourceLang: string, targetLang: string): Promise<string> {
  try {
    if (!text) return '';
    
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
