// Tipos base do editor

export interface Position {
  line: number;
  column: number;
}

export interface Range {
  start: Position;
  end: Position;
}

export interface Selection {
  start: Position;
  end: Position;
  isEmpty: boolean;
}

export interface Disposable {
  dispose(): void;
}

export interface IEditor {
  getValue(): string;
  setValue(value: string): void;
  getPosition(): Position;
  setPosition(position: Position): void;
  getSelection(): Selection;
  setSelection(selection: Selection): void;
  focus(): void;
  blur(): void;
}

export interface IWorkspace {
  files: Map<string, string>;
  currentFile?: string;
  openFile(path: string): void;
  closeFile(path: string): void;
  saveFile(path: string, content: string): void;
}

