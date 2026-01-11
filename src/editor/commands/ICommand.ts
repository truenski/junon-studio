import type { IEditor } from '../core/types';

export interface CommandContext {
  editor: IEditor;
  selection: {
    start: { line: number; column: number };
    end: { line: number; column: number };
    isEmpty: boolean;
  };
  position: { line: number; column: number };
}

export interface ICommand {
  id: string;
  title: string;
  category?: string;
  execute(...args: any[]): Promise<any> | any;
  enabled?: (context: CommandContext) => boolean;
}

