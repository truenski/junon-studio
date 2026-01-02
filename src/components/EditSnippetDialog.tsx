import { useState, useEffect } from "react";
import { Pencil } from "lucide-react";
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
import { updateSnippet, type SnippetWithSource, isDefaultSnippet } from "@/lib/snippetService";
import { useToast } from "@/hooks/use-toast";

interface EditSnippetDialogProps {
  snippet: SnippetWithSource;
  onSnippetUpdated?: () => void;
}

export function EditSnippetDialog({ snippet, onSnippetUpdated }: EditSnippetDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [code, setCode] = useState("");
  const [tags, setTags] = useState("");
  const [suggestedBy, setSuggestedBy] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Check if snippet can be edited (only user snippets, not default ones)
  const canEdit = !isDefaultSnippet(snippet);

  // Initialize form with snippet data
  useEffect(() => {
    if (open && snippet) {
      setTitle(snippet.title);
      setDescription(snippet.description || "");
      setCode(snippet.code);
      setTags(snippet.tags?.join(", ") || "");
      setSuggestedBy(snippet.suggested_by || "");
    }
  }, [open, snippet]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canEdit) {
      toast({
        title: "Cannot Edit",
        description: "Default snippets cannot be edited. Create your own snippet to customize it.",
        variant: "destructive",
      });
      return;
    }

    if (!title.trim() || !code.trim()) {
      toast({
        title: "Validation Error",
        description: "Title and code are required",
        variant: "destructive",
      });
      return;
    }

    if (typeof snippet.id !== "string") {
      toast({
        title: "Error",
        description: "Invalid snippet ID",
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

      await updateSnippet(snippet.id, {
        title: title.trim(),
        description: description.trim(),
        code: code.trim(),
        tags: tagArray,
        suggested_by: suggestedBy.trim() || undefined,
      });

      toast({
        title: "Snippet Updated",
        description: "Your snippet has been updated successfully",
      });

      setOpen(false);
      onSnippetUpdated?.();
    } catch (error) {
      console.error("Error updating snippet:", error);
      toast({
        title: "Error",
        description: "Failed to update snippet. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isSubmitting) {
      setOpen(newOpen);
    }
  };

  if (!canEdit) {
    return null; // Don't show edit button for default snippets
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
          <Pencil className="w-3 h-3 mr-1.5" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Snippet</DialogTitle>
          <DialogDescription>
            Update your code snippet. Changes will be synced across all your devices.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="edit-title">Title *</Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Player Welcome System"
              required
              disabled={isSubmitting}
            />
          </div>

          <div>
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of what this snippet does"
              rows={2}
              disabled={isSubmitting}
            />
          </div>

          <div>
            <Label htmlFor="edit-code">Code *</Label>
            <Textarea
              id="edit-code"
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
            <Label htmlFor="edit-tags">Tags (comma-separated)</Label>
            <Input
              id="edit-tags"
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
            <Label htmlFor="edit-suggested-by">Suggested By (nickname)</Label>
            <Input
              id="edit-suggested-by"
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
              {isSubmitting ? "Updating..." : "Update Snippet"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

