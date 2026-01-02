// Chrome Extension Sync - Exposes data for Chrome extension to read

import { getAllFiles, getCurrentFileId } from './fileStorage';
import { getCombinedSnippets } from './snippetService';

/**
 * Exposes snippets and files to window object for Chrome extension access
 */
export async function exposeDataForExtension() {
  if (typeof window !== 'undefined') {
    // Load snippets from Supabase + defaults
    const snippets = await getCombinedSnippets();
    
    // Expose snippets
    (window as any).__JUNON_SNIPPETS__ = snippets;
    
    // Expose function to get current files
    (window as any).__JUNON_GET_FILES__ = () => {
      return {
        files: getAllFiles(),
        currentFileId: getCurrentFileId()
      };
    };

    // Expose async function to get snippets (always fresh)
    (window as any).__JUNON_GET_SNIPPETS__ = async () => {
      return await getCombinedSnippets();
    };

    // Listen for sync requests from extension
    window.addEventListener('message', async (event) => {
      // Only accept messages from our extension
      if (event.data && event.data.source === 'junon-extension') {
        if (event.data.action === 'getData') {
          const currentSnippets = await getCombinedSnippets();
          const data = {
            temporaryFiles: getAllFiles(),
            snippets: currentSnippets,
            currentFileId: getCurrentFileId()
          };
          
          window.postMessage({
            source: 'junon-editor',
            action: 'dataResponse',
            data: data
          }, '*');
        }
      }
    });

    console.log('[Junon Editor] Extension sync enabled');
  }
}

// Auto-expose on module load
if (typeof window !== 'undefined') {
  exposeDataForExtension();
}
