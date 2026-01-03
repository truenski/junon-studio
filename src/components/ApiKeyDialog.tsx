import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ExternalLink, Key, Check, AlertCircle } from "lucide-react";
import { getApiKey, setApiKey, hasApiKey, validateApiKeyFormat } from "@/lib/aiConfig";
import { useToast } from "@/hooks/use-toast";

interface ApiKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ApiKeyDialog({ open, onOpenChange }: ApiKeyDialogProps) {
  const [apiKey, setApiKeyValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingKey, setExistingKey] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      getApiKey().then(key => {
        setExistingKey(key);
        if (key) {
          // Show masked version
          setApiKeyValue(key.substring(0, 8) + "..." + key.substring(key.length - 4));
        } else {
          setApiKeyValue("");
        }
      });
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!apiKey.trim()) {
      toast({
        title: "API Key Required",
        description: "Please enter your Gemini API key.",
        variant: "destructive",
      });
      return;
    }

    // If showing existing key, don't validate format
    if (existingKey && apiKey.includes("...")) {
      onOpenChange(false);
      return;
    }

    if (!validateApiKeyFormat(apiKey)) {
      toast({
        title: "Invalid API Key Format",
        description: "Please check your API key format and try again.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      await setApiKey(apiKey.trim());
      toast({
        title: "API Key Saved",
        description: "Your Gemini API key has been saved successfully.",
      });
      onOpenChange(false);
      setApiKeyValue("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save API key. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClear = () => {
    setApiKeyValue("");
    setExistingKey(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="w-5 h-5 text-primary" />
            Configure Gemini API Key
          </DialogTitle>
          <DialogDescription>
            {existingKey 
              ? "Your Gemini API key is already configured. You can update it below."
              : "Add your Gemini API key to enable AI code generation. Your key is stored locally and never sent to our servers."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!existingKey && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-primary mt-0.5" />
                <div className="text-sm space-y-1">
                  <p className="font-medium">How to get your API key:</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground ml-2">
                    <li>Visit{" "}
                      <a
                        href="https://makersuite.google.com/app/apikey"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline inline-flex items-center gap-1"
                      >
                        Google AI Studio
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </li>
                    <li>Sign in with your Google account</li>
                    <li>Click "Create API Key"</li>
                    <li>Copy the generated key and paste it below</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {existingKey && (
            <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <Check className="w-4 h-4 text-green-500" />
              <span className="text-sm text-green-500">API key is configured</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="api-key">
                {existingKey ? "Update API Key" : "Gemini API Key"}
              </Label>
              <Input
                id="api-key"
                type={existingKey && apiKey.includes("...") ? "password" : "text"}
                value={apiKey}
                onChange={(e) => {
                  if (!existingKey || !apiKey.includes("...")) {
                    setApiKeyValue(e.target.value);
                  }
                }}
                placeholder="Enter your Gemini API key"
                disabled={isSubmitting || (existingKey && apiKey.includes("..."))}
                className="font-mono text-sm"
              />
              {existingKey && apiKey.includes("...") && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClear}
                  className="w-full"
                >
                  Update API Key
                </Button>
              )}
              <p className="text-xs text-muted-foreground">
                Your API key is stored locally in your browser and never shared with our servers.
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                {existingKey ? "Close" : "Cancel"}
              </Button>
              {(!existingKey || !apiKey.includes("...")) && (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : existingKey ? "Update" : "Save"}
                </Button>
              )}
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

