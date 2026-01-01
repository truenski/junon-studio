// Chrome Extension Sync - Exposes data for Chrome extension to read

import { getAllFiles, getCurrentFileId } from './fileStorage';
import { snippets } from './snippets';

/**
 * Exposes snippets and files to window object for Chrome extension access
 */
export function exposeDataForExtension() {
  if (typeof window !== 'undefined') {
    // Expose snippets
    (window as any).__JUNON_SNIPPETS__ = snippets;
    
    // Expose function to get current files
    (window as any).__JUNON_GET_FILES__ = () => {
      return {
        files: getAllFiles(),
        currentFileId: getCurrentFileId()
      };
    };

    // Listen for sync requests from extension
    window.addEventListener('message', (event) => {
      // Only accept messages from our extension
      if (event.data && event.data.source === 'junon-extension') {
        if (event.data.action === 'getData') {
          const data = {
            temporaryFiles: getAllFiles(),
            snippets: snippets,
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

