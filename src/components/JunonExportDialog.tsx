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
      
      // Add all files to ZIP
      for (const file of files) {
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
            // Ensure text files are read as UTF-8, especially important for manifest.json
            const text = await fileResponse.text();
            // For manifest.json, ensure it's valid JSON
            if (file === 'manifest.json') {
              try {
                JSON.parse(text); // Validate JSON
              } catch (e) {
                console.error('Invalid JSON in manifest.json:', e);
                throw new Error('manifest.json is invalid');
              }
            }
            zip.file(file, text);
          }
        } catch (error) {
          console.warn(`Failed to add file ${file}:`, error);
          // Don't skip manifest.json - it's critical
          if (file === 'manifest.json') {
            throw new Error(`Failed to include manifest.json: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      }

      // Add README.md
      const readmeResponse = await fetch('/api/chrome-extension-files?file=README.md');
      if (readmeResponse.ok) {
        const readmeText = await readmeResponse.text();
        zip.file('README.md', readmeText);
      }

      // Generate ZIP file
      const blob = await zip.generateAsync({ type: 'blob' });
      
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

