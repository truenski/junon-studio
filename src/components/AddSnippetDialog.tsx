import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { createSnippet } from "@/lib/snippetService";
import { useToast } from "@/hooks/use-toast";

interface AddSnippetDialogProps {
  onSnippetAdded?: () => void;
}

export function AddSnippetDialog({ onSnippetAdded }: AddSnippetDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [code, setCode] = useState("");
  const [tags, setTags] = useState("");
  const [suggestedBy, setSuggestedBy] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !code.trim()) {
      toast({
        title: "Validation Error",
        description: "Title and code are required",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const tagArray = tags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      await createSnippet(
        title.trim(),
        description.trim(),
        code.trim(),
        tagArray,
        'User',
        suggestedBy.trim() || undefined
      );

      toast({
        title: "Snippet Added",
        description: "Your snippet has been saved successfully",
      });

      // Reset form
      setTitle("");
      setDescription("");
      setCode("");
      setTags("");
      setSuggestedBy("");
      setOpen(false);

      onSnippetAdded?.();
    } catch (error) {
      console.error("Error creating snippet:", error);
      toast({
        title: "Error",
        description: "Failed to create snippet. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isSubmitting) {
      setOpen(newOpen);
      if (!newOpen) {
        // Reset form when closing
        setTitle("");
        setDescription("");
        setCode("");
        setTags("");
        setSuggestedBy("");
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Snippet
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Snippet</DialogTitle>
          <DialogDescription>
            Create a new code snippet that will be saved and synced across all your devices.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Player Welcome System"
              required
              disabled={isSubmitting}
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of what this snippet does"
              rows={2}
              disabled={isSubmitting}
            />
          </div>

          <div>
            <Label htmlFor="code">Code *</Label>
            <Textarea
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="@trigger PlayerJoined&#10;    @commands&#10;        /chat Welcome!"
              className="font-mono text-sm"
              rows={10}
              required
              disabled={isSubmitting}
            />
          </div>

          <div>
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g., welcome, beginner, items"
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Separate multiple tags with commas
            </p>
          </div>

          <div>
            <Label htmlFor="suggested-by">Suggested By (nickname)</Label>
            <Input
              id="suggested-by"
              value={suggestedBy}
              onChange={(e) => setSuggestedBy(e.target.value)}
              placeholder="e.g., @username or your nickname"
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Optional: Who suggested this snippet?
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Snippet"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

