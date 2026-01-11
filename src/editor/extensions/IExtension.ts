import type { EventEmitter } from '../core/EventEmitter';
import type { Disposable, IWorkspace } from '../core/types';
import type { ServiceRegistry, CommandRegistry } from '../services/base/IService';

export interface ExtensionContribution {
  languages?: LanguageContribution[];
  services?: ServiceContribution[];
  commands?: CommandContribution[];
  themes?: ThemeContribution[];
  keybindings?: KeybindingContribution[];
}

export interface LanguageContribution {
  id: string;
  name: string;
  extensions: string[];
  aliases?: string[];
}

export interface ServiceContribution {
  id: string;
  service: any; // IService implementation
}

export interface CommandContribution {
  command: string;
  title: string;
  category?: string;
}

export interface ThemeContribution {
  id: string;
  label: string;
  uiTheme: 'vs' | 'vs-dark' | 'hc-black';
  path: string;
}

export interface KeybindingContribution {
  command: string;
  key: string;
  when?: string;
}

export interface ExtensionContext {
  subscriptions: Disposable[];
  workspace: IWorkspace;
  services: ServiceRegistry;
  commands: CommandRegistry;
  events: EventEmitter;
}

export interface IExtension {
  id: string;
  name: string;
  version: string;
  publisher: string;
  contributes?: ExtensionContribution;
  activate(context: ExtensionContext): Promise<void>;
  deactivate(): Promise<void>;
}

