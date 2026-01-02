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
    
    const content = readFileSync(fullPath);
    const isBinary = filePath.endsWith('.png') || filePath.endsWith('.ico');
    
    if (isBinary) {
      return new Response(content, {
        status: 200,
        headers: { 'Content-Type': 'application/octet-stream' },
      });
    }
    
    return new Response(content, {
      status: 200,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch (error) {
    console.error('Error serving extension file:', error);
    return new Response('Error reading file', { status: 500 });
  }
};

