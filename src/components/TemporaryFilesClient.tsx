import { useState, useEffect } from "react";
import { Plus, FileText, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getAllFiles,
  saveFile,
  deleteFile,
  getCurrentFileId,
  setCurrentFileId,
  createNewFile,
  type TemporaryFile,
} from "@/lib/fileStorage";

export function TemporaryFilesClient() {
  const [files, setFiles] = useState<TemporaryFile[]>([]);
  const [currentFileId, setCurrentFileIdState] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newFileName, setNewFileName] = useState("");

  useEffect(() => {
    loadFiles();
  }, []);

  useEffect(() => {
    // Listen for file rename events from CodeEditor
    const handleFileRename = (e: CustomEvent<TemporaryFile>) => {
      // Reload files to get updated names
      const allFiles = getAllFiles();
      setFiles(allFiles);
      // Update current file if it's the renamed one
      if (e.detail.id === currentFileId) {
        setCurrentFileIdState(e.detail.id);
      }
    };

    window.addEventListener('fileRenamed', handleFileRename as EventListener);
    return () => window.removeEventListener('fileRenamed', handleFileRename as EventListener);
  }, [currentFileId]);

  const loadFiles = () => {
    const allFiles = getAllFiles();
    setFiles(allFiles);
    
    // If no current file is set, select the first one or create default
    const savedCurrentId = getCurrentFileId();
    if (savedCurrentId && allFiles.find(f => f.id === savedCurrentId)) {
      setCurrentFileIdState(savedCurrentId);
      const fileToSelect = allFiles.find(f => f.id === savedCurrentId)!;
      window.dispatchEvent(new CustomEvent('fileSelect', { detail: fileToSelect }));
    } else if (allFiles.length > 0) {
      const fileToSelect = allFiles[0];
      setCurrentFileIdState(fileToSelect.id);
      setCurrentFileId(fileToSelect.id);
      window.dispatchEvent(new CustomEvent('fileSelect', { detail: fileToSelect }));
    } else {
      // Create default file if none exist
      const defaultFile = createNewFile("main", `@trigger PlayerJoined
    @commands
        /chat Welcome to the game!
        /give sword 1
    @if player.health == 100
        then /chat Player is at full health
        elseif player.health != 100
        then /heal player
    @timer 5000
        /chat 5 seconds passed`);
      setFiles([defaultFile]);
      setCurrentFileIdState(defaultFile.id);
      setCurrentFileId(defaultFile.id);
      window.dispatchEvent(new CustomEvent('fileSelect', { detail: defaultFile }));
    }
  };

  const handleCreateFile = () => {
    if (!newFileName.trim()) return;
    
    const newFile = createNewFile(newFileName.trim());
    setFiles([...files, newFile]);
    setCurrentFileIdState(newFile.id);
    setCurrentFileId(newFile.id);
    window.dispatchEvent(new CustomEvent('fileSelect', { detail: newFile }));
    setNewFileName("");
    setIsCreating(false);
  };

  const handleDeleteFile = (e: React.MouseEvent, fileId: string) => {
    e.stopPropagation();
    if (files.length <= 1) {
      alert("Cannot delete the last file. Create a new file first.");
      return;
    }
    
    if (confirm("Are you sure you want to delete this file?")) {
      deleteFile(fileId);
      const updatedFiles = files.filter(f => f.id !== fileId);
      setFiles(updatedFiles);
      
      if (fileId === currentFileId && updatedFiles.length > 0) {
        const nextFile = updatedFiles[0];
        setCurrentFileIdState(nextFile.id);
        setCurrentFileId(nextFile.id);
        window.dispatchEvent(new CustomEvent('fileSelect', { detail: nextFile }));
      }
    }
  };

  const handleFileClick = (file: TemporaryFile) => {
    setCurrentFileIdState(file.id);
    setCurrentFileId(file.id);
    window.dispatchEvent(new CustomEvent('fileSelect', { detail: file }));
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header with Create Button */}
      <div className="p-2 border-b border-border/30 flex items-center justify-between">
        <span className="text-xs font-ui text-muted-foreground">Files</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCreating(true)}
          className="h-6 w-6 p-0 text-muted-foreground hover:text-primary"
          title="Create new file"
        >
          <Plus className="w-3 h-3" />
        </Button>
      </div>

      {/* Create File Input */}
      {isCreating && (
        <div className="p-2 border-b border-border/30 flex items-center gap-2">
          <input
            type="text"
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleCreateFile();
              } else if (e.key === "Escape") {
                setIsCreating(false);
                setNewFileName("");
              }
            }}
            placeholder="File name..."
            className="flex-1 text-xs px-2 py-1 bg-input border border-border rounded focus:outline-none focus:border-primary"
            autoFocus
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCreateFile}
            className="h-6 px-2 text-xs"
          >
            Create
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsCreating(false);
              setNewFileName("");
            }}
            className="h-6 w-6 p-0"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      )}

      {/* Files List */}
      <div className="flex-1 overflow-auto p-2 space-y-1">
        {files.map((file) => (
          <div
            key={file.id}
            onClick={() => handleFileClick(file)}
            className={`group flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
              currentFileId === file.id
                ? "bg-primary/10 border border-primary/30"
                : "bg-muted/30 hover:bg-muted/50"
            }`}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <FileText className="w-3 h-3 text-muted-foreground shrink-0" />
              <span className="text-xs font-ui text-foreground truncate">
                {file.name}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => handleDeleteFile(e, file.id)}
              className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity shrink-0"
              title="Delete file"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

