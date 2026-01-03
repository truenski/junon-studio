import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink, AlertCircle } from "lucide-react";

interface JunonExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function JunonExportDialog({ open, onOpenChange }: JunonExportDialogProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateZip = async () => {
    setIsGenerating(true);
    try {
      // Dynamically import JSZip to avoid ES module issues
      let JSZip;
      try {
        const JSZipModule = await import('jszip');
        // Handle both default export and named export
        if (JSZipModule.default) {
          JSZip = JSZipModule.default;
        } else if (JSZipModule.JSZip) {
          JSZip = JSZipModule.JSZip;
        } else {
          JSZip = JSZipModule;
        }
        
        if (!JSZip) {
          throw new Error('JSZip module is undefined');
        }
      } catch (importError) {
        console.error('Failed to import JSZip:', importError);
        const errorMessage = importError instanceof Error ? importError.message : 'Unknown error';
        throw new Error(`Failed to load ZIP library: ${errorMessage}. Please refresh the page and try again.`);
      }
      
      // Fetch list of files
      const listResponse = await fetch('/api/chrome-extension-files');
      if (!listResponse.ok) {
        throw new Error('Failed to fetch file list');
      }
      const { files } = await listResponse.json();

      // Create ZIP
      const zip = new JSZip();
      
      // CRITICAL: Add manifest.json FIRST and ensure it's in the root
      const manifestIndex = files.indexOf('manifest.json');
      if (manifestIndex === -1) {
        throw new Error('manifest.json not found in extension files');
      }
      
      // Fetch and validate manifest.json first
      const manifestResponse = await fetch('/api/chrome-extension-files?file=manifest.json');
      if (!manifestResponse.ok) {
        throw new Error('Failed to fetch manifest.json');
      }
      const manifestText = await manifestResponse.text();
      
      // Validate JSON
      let manifestJson;
      try {
        manifestJson = JSON.parse(manifestText);
      } catch (e) {
        console.error('Invalid JSON in manifest.json:', e);
        throw new Error(`manifest.json is invalid JSON: ${e instanceof Error ? e.message : 'Unknown error'}`);
      }
      
      // Ensure manifest_version exists
      if (!manifestJson.manifest_version) {
        throw new Error('manifest.json is missing manifest_version field');
      }
      
      // Add manifest.json to root of ZIP (no subdirectory)
      zip.file('manifest.json', manifestText);
      console.log('✓ manifest.json added to ZIP root');
      
      // Add all other files to ZIP (excluding manifest.json as we already added it)
      const otherFiles = files.filter(f => f !== 'manifest.json');
      for (const file of otherFiles) {
        try {
          const fileResponse = await fetch(`/api/chrome-extension-files?file=${encodeURIComponent(file)}`);
          if (!fileResponse.ok) {
            console.warn(`Failed to fetch file ${file}: ${fileResponse.status}`);
            continue;
          }
          
          if (file.endsWith('.png') || file.endsWith('.ico')) {
            const blob = await fileResponse.blob();
            zip.file(file, blob);
          } else {
            const text = await fileResponse.text();
            zip.file(file, text);
          }
        } catch (error) {
          console.warn(`Failed to add file ${file}:`, error);
        }
      }

      // Add README.md
      const readmeResponse = await fetch('/api/chrome-extension-files?file=README.md');
      if (readmeResponse.ok) {
        const readmeText = await readmeResponse.text();
        zip.file('README.md', readmeText);
      }

      // Verify manifest.json is in ZIP before generating
      const zipFiles = Object.keys(zip.files);
      if (!zipFiles.includes('manifest.json')) {
        throw new Error('manifest.json was not included in ZIP file');
      }
      
      // Check that manifest.json is in root (not in a subdirectory)
      const manifestInZip = zip.files['manifest.json'];
      if (!manifestInZip || manifestInZip.dir) {
        throw new Error('manifest.json is not in ZIP root or is a directory');
      }
      
      console.log('✓ ZIP prepared with', zipFiles.length, 'files');
      console.log('✓ manifest.json verified in ZIP root');
      
      // Generate ZIP file with explicit options for better compatibility
      const blob = await zip.generateAsync({ 
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });
      
      console.log('✓ ZIP generated successfully, size:', (blob.size / 1024).toFixed(2), 'KB');
      
      // Download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'junon-chrome-extension.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating ZIP:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Error generating ZIP file: ${errorMessage}. Please check the console for more details.`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <ExternalLink className="w-6 h-6" />
            Import/Export to Junon.io
          </DialogTitle>
          <DialogDescription className="text-base">
            Export your editor code to junon.io using our Chrome extension.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
         

          {/* Explanation */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">How It Works</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                The Chrome extension allows you to import and export code between the Junon Code Editor and junon.io automatically.
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li><strong>Import:</strong> Convert your code to JSON and import it directly into junon.io</li>
                <li><strong>Export:</strong> Extract existing triggers and actions from junon.io</li>
                <li><strong>Automation:</strong> The extension creates the command blocks automatically</li>
              </ul>
            </div>
          </div>

          {/* Tutorial Preview */}
          <div className="space-y-3 border-t pt-4">
            <h3 className="font-semibold text-sm">Quick Install</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Download the ZIP file using the button below</li>
              <li>Extract the files to a folder</li>
              <li>Open <code className="bg-muted px-1.5 py-0.5 rounded">chrome://extensions/</code></li>
              <li>Enable "Developer mode"</li>
              <li>Click "Load unpacked" and select the extracted folder</li>
            </ol>
            <p className="text-xs text-muted-foreground italic">
              Complete instructions are included in the README.md file inside the ZIP.
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isGenerating}
          >
            Close
          </Button>
          <Button
            onClick={generateZip}
            disabled={isGenerating}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isGenerating ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Generating...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Download Extension (ZIP)
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

