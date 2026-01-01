import { useState, useEffect } from "react";
import { CodeEditor } from "./CodeEditor";
import { getAllFiles, getCurrentFileId, setCurrentFileId, type TemporaryFile } from "@/lib/fileStorage";

export function CodeEditorWrapper() {
  const [currentFile, setCurrentFile] = useState<TemporaryFile | null>(null);

  useEffect(() => {
    // Load initial file
    const files = getAllFiles();
    const savedCurrentId = getCurrentFileId();
    const fileToLoad = files.find(f => f.id === savedCurrentId) || files[0] || null;
    
    if (fileToLoad) {
      setCurrentFile(fileToLoad);
      setCurrentFileId(fileToLoad.id);
    }

    // Listen for file selection events from TemporaryFilesClient
    const handleFileSelect = (e: CustomEvent<TemporaryFile>) => {
      setCurrentFile(e.detail);
      setCurrentFileId(e.detail.id);
    };

    window.addEventListener('fileSelect', handleFileSelect as EventListener);
    return () => window.removeEventListener('fileSelect', handleFileSelect as EventListener);
  }, []);

  const handleFileChange = (file: TemporaryFile) => {
    setCurrentFile(file);
    setCurrentFileId(file.id);
  };

  return (
    <CodeEditor 
      currentFile={currentFile} 
      onFileChange={handleFileChange}
    />
  );
}

