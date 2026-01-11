import type { EventEmitter } from '../../core/EventEmitter';
import type { IEditor, IWorkspace } from '../../core/types';

// Interfaces serão definidas aqui, mas precisamos de forward references
export interface ServiceRegistry {
  get<T extends IService>(id: string): T | undefined;
  register(service: IService): void;
  unregister(id: string): void;
  has(id: string): boolean;
}

export interface CommandRegistry {
  register(command: ICommand): void;
  unregister(id: string): void;
  execute(id: string, ...args: any[]): Promise<any> | any;
  get(id: string): ICommand | undefined;
  getAll(): ICommand[];
}

export interface ICommand {
  id: string;
  title: string;
  category?: string;
  execute(...args: any[]): Promise<any> | any;
  enabled?: (context: CommandContext) => boolean;
}

export interface CommandContext {
  editor: IEditor;
  selection: { start: { line: number; column: number }; end: { line: number; column: number }; isEmpty: boolean };
  position: { line: number; column: number };
}

export interface ServiceContext {
  editor: IEditor;
  events: EventEmitter;
  services: ServiceRegistry;
  commands: CommandRegistry;
  workspace?: IWorkspace;
}

export interface IService {
  id: string;
  name: string;
  version: string;
  activate(context: ServiceContext): Promise<void>;
  deactivate(): Promise<void>;
  dispose(): void;
}

