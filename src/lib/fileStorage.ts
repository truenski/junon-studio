export interface TemporaryFile {
  id: string;
  name: string;
  content: string;
  lastModified: number;
}

const STORAGE_KEY = 'junon_temporary_files';
const CURRENT_FILE_KEY = 'junon_current_file_id';

export function getAllFiles(): TemporaryFile[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      // Create default file if none exist
      const defaultFile: TemporaryFile = {
        id: 'default',
        name: 'main',
        content: `@trigger PlayerJoined
    @commands
        /chat Welcome to the game!
        /give sword 1
    @if player.health == 100
        then /chat Player is at full health
        elseif player.health != 100
        then /heal player
    @timer 5000
        /chat 5 seconds passed`,
        lastModified: Date.now(),
      };
      saveFile(defaultFile);
      return [defaultFile];
    }
    return JSON.parse(stored);
  } catch (error) {
    console.error('Error loading files:', error);
    return [];
  }
}

export function saveFile(file: TemporaryFile): void {
  try {
    const files = getAllFiles();
    const index = files.findIndex(f => f.id === file.id);
    
    if (index >= 0) {
      files[index] = { ...file, lastModified: Date.now() };
    } else {
      files.push({ ...file, lastModified: Date.now() });
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(files));
  } catch (error) {
    console.error('Error saving file:', error);
  }
}

export function deleteFile(fileId: string): void {
  try {
    const files = getAllFiles();
    const filtered = files.filter(f => f.id !== fileId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting file:', error);
  }
}

export function getCurrentFileId(): string | null {
  try {
    return localStorage.getItem(CURRENT_FILE_KEY);
  } catch {
    return null;
  }
}

export function setCurrentFileId(fileId: string): void {
  try {
    localStorage.setItem(CURRENT_FILE_KEY, fileId);
  } catch (error) {
    console.error('Error setting current file:', error);
  }
}

export function createNewFile(name: string, content: string = ''): TemporaryFile {
  const newFile: TemporaryFile = {
    id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    content,
    lastModified: Date.now(),
  };
  saveFile(newFile);
  return newFile;
}

