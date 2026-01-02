import type { APIRoute } from 'astro';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
// From src/pages/api/ to project root
const projectRoot = resolve(__filename, '..', '..', '..', '..');

export const GET: APIRoute = async ({ url }) => {
  try {
    const filePath = url.searchParams.get('file');
    
    if (!filePath) {
      // Return list of files
      const extensionDir = join(projectRoot, 'chrome-extension');
      const files: string[] = [];
      
      const scanDirectory = (dir: string, basePath: string = '') => {
        const entries = readdirSync(dir);
        
        for (const entry of entries) {
          // Skip v2, v3 folders and README.md from root
          if (basePath === '' && (entry === 'v2' || entry === 'v3' || entry === 'README.md')) {
            continue;
          }
          
          const fullPath = join(dir, entry);
          const stat = statSync(fullPath);
          
          if (stat.isDirectory()) {
            scanDirectory(fullPath, join(basePath, entry));
          } else {
            files.push(join(basePath, entry));
          }
        }
      };
      
      scanDirectory(extensionDir);
      
      return new Response(JSON.stringify({ files }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Return specific file content
    const extensionDir = join(projectRoot, 'chrome-extension');
    const fullPath = join(extensionDir, filePath);
    
    // Security: ensure path is within extension directory
    if (!fullPath.startsWith(extensionDir)) {
      return new Response('Invalid path', { status: 400 });
    }
    
    const isBinary = filePath.endsWith('.png') || filePath.endsWith('.ico');
    
    if (isBinary) {
      const content = readFileSync(fullPath);
      return new Response(content, {
        status: 200,
        headers: { 'Content-Type': 'application/octet-stream' },
      });
    }
    
    // Read text files as UTF-8, especially important for manifest.json
    const content = readFileSync(fullPath, 'utf-8');
    const contentType = filePath.endsWith('.json') 
      ? 'application/json; charset=utf-8'
      : filePath.endsWith('.html')
      ? 'text/html; charset=utf-8'
      : filePath.endsWith('.js')
      ? 'application/javascript; charset=utf-8'
      : 'text/plain; charset=utf-8';
    
    return new Response(content, {
      status: 200,
      headers: { 'Content-Type': contentType },
    });
  } catch (error) {
    console.error('Error serving extension file:', error);
    return new Response('Error reading file', { status: 500 });
  }
};

