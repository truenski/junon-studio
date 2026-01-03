// AI Service - Modular service for Gemini API integration

import { getApiKey } from './aiConfig';
import { buildDocumentationContext } from './aiContextBuilder';

// Use gemini-1.5-flash as it's faster and more cost-effective, or gemini-1.5-pro for better quality
// Try v1 first, fallback to v1beta if needed
const GEMINI_MODEL = 'gemini-1.5-flash';
const GEMINI_API_URL_V1 = `https://generativelanguage.googleapis.com/v1/models/${GEMINI_MODEL}:generateContent`;
const GEMINI_API_URL_V1BETA = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export interface GenerateCodeOptions {
  prompt: string;
  existingCode?: string;
  selectedText?: string;
}

export interface GenerateCodeResult {
  success: boolean;
  code?: string;
  error?: string;
}

/**
 * Generate Junon code using Gemini API
 * @param options Configuration for code generation
 * @returns Generated code or error message
 */
export async function generateCode(options: GenerateCodeOptions): Promise<GenerateCodeResult> {
  const apiKey = await getApiKey();
  
  if (!apiKey) {
    return {
      success: false,
      error: 'API key not configured. Please add your Gemini API key in settings.',
    };
  }

  try {
    // Build documentation context
    const documentationContext = await buildDocumentationContext();
    
    // Build the full prompt for Gemini
    const fullPrompt = buildPrompt(options, documentationContext);
    
    // Call Gemini API
    const response = await callGeminiAPI(apiKey, fullPrompt);
    
    if (!response.success) {
      return response;
    }
    
    // Extract and clean the generated code
    const generatedCode = extractCodeFromResponse(response.code || '');
    
    return {
      success: true,
      code: generatedCode,
    };
  } catch (error) {
    console.error('Error generating code:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate code. Please try again.',
    };
  }
}

/**
 * Build the complete prompt for Gemini
 */
function buildPrompt(options: GenerateCodeOptions, documentationContext: string): string {
  let prompt = `You are an expert in Junon Code language. Your task is to generate NEW Junon code based on the user's request.

${documentationContext}

## Current Code Context (for reference only - DO NOT modify this code)

\`\`\`
${options.existingCode || '(no existing code)'}
\`\`\`

${options.selectedText ? `## Selected Text (for context)\n\n\`\`\`\n${options.selectedText}\n\`\`\`\n\n` : ''}

## User Request

${options.prompt}

## Instructions

1. Generate ONLY new Junon code based on the user's request
2. DO NOT modify or edit the existing code above
3. The new code should be added ABOVE the existing code
4. Follow the syntax rules exactly as documented
5. Use proper indentation (4 spaces)
6. Include @trigger blocks when necessary
7. Use @commands for multiple commands
8. Return ONLY the code, without explanations or markdown formatting
9. Ensure the code is valid Junon syntax

Generate the new code now:`;

  return prompt;
}

/**
 * Call Gemini API
 */
async function callGeminiAPI(apiKey: string, prompt: string): Promise<GenerateCodeResult> {
  // Try v1 first, then fallback to v1beta
  const urls = [GEMINI_API_URL_V1, GEMINI_API_URL_V1BETA];
  let lastError: Error | null = null;
  
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    const isLastUrl = i === urls.length - 1;
    
    try {
      const response = await fetch(`${url}?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt,
            }],
          }],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // If 404 and not the last URL, try next URL
        if (response.status === 404 && !isLastUrl) {
          continue;
        }
        
        if (response.status === 400) {
          return {
            success: false,
            error: 'Invalid API key. Please check your Gemini API key and try again.',
          };
        }
        
        if (response.status === 429) {
          return {
            success: false,
            error: 'Rate limit exceeded. Please try again later.',
          };
        }
        
        return {
          success: false,
          error: errorData.error?.message || `API error: ${response.statusText}`,
        };
      }

      const data = await response.json();
      
      // Extract text from Gemini response
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!generatedText) {
        return {
          success: false,
          error: 'No code generated. Please try a different prompt.',
        };
      }

      return {
        success: true,
        code: generatedText,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // If network error and not the last URL, try next URL
      if (error instanceof TypeError && error.message.includes('fetch') && !isLastUrl) {
        continue;
      }
      
      // If this is the last URL, handle the error
      if (isLastUrl) {
        if (error instanceof TypeError && error.message.includes('fetch')) {
          return {
            success: false,
            error: 'Network error. Please check your internet connection.',
          };
        }
        
        return {
          success: false,
          error: lastError.message || 'Failed to connect to Gemini API. Please try again later.',
        };
      }
    }
  }
  
  // If we get here, all URLs failed
  return {
    success: false,
    error: lastError?.message || 'Failed to connect to Gemini API. Please try again later.',
  };
}

/**
 * Extract and clean code from Gemini response
 * Removes markdown code blocks and extra formatting
 */
function extractCodeFromResponse(response: string): string {
  // Remove markdown code blocks if present
  let code = response.replace(/```junon\n?/g, '').replace(/```\n?/g, '');
  
  // Remove leading/trailing whitespace
  code = code.trim();
  
  // Remove any explanatory text before the code (look for @trigger as start marker)
  const triggerIndex = code.indexOf('@trigger');
  if (triggerIndex > 0) {
    code = code.substring(triggerIndex);
  }
  
  return code;
}

