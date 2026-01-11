import { useState, useEffect } from "react";
import { CodeEditor } from "@/editor/CodeEditor";
import { JunonLanguagePlugin } from "@/languages/junon";
import { DefaultTheme } from "@/themes/default/DefaultTheme";
import { getAllFiles, getCurrentFileId, setCurrentFileId, type TemporaryFile } from "@/lib/fileStorage";

export function CodeEditorWrapperNew() {
  const [currentFile, setCurrentFile] = useState<TemporaryFile | null>(null);
  const [language] = useState(() => new JunonLanguagePlugin());
  const [theme] = useState(() => new DefaultTheme());

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

  const handleCodeChange = (value: string) => {
    if (currentFile) {
      const updatedFile = { ...currentFile, content: value };
      handleFileChange(updatedFile);
    }
  };

  return (
    <CodeEditor
      language={language}
      theme={theme}
      initialValue={currentFile?.content || ''}
      onChange={handleCodeChange}
      className="h-full"
    />
  );
}

