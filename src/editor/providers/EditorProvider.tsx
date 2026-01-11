import React, { createContext, useContext, useMemo, useEffect, useState } from 'react';
import { EventEmitter } from '../core/EventEmitter';
import { ServiceRegistry } from '../services/ServiceRegistry';
import { CommandRegistry } from '../commands/CommandRegistry';
import { ExtensionRegistry } from '../extensions/ExtensionRegistry';
import type { ILanguagePlugin } from '../../languages/base/ILanguagePlugin';
import type { ITheme } from '../../themes/base/ITheme';
import type { IService } from '../services/base/IService';

export interface EditorContextValue {
  events: EventEmitter;
  services: ServiceRegistry;
  commands: CommandRegistry;
  extensions: ExtensionRegistry;
  language?: ILanguagePlugin;
  theme?: ITheme;
  initialized: boolean;
}

const EditorContext = createContext<EditorContextValue | null>(null);

export interface EditorProviderProps {
  children: React.ReactNode;
  language?: ILanguagePlugin;
  theme?: ITheme;
  services?: Array<new () => IService>;
}

export function EditorProvider({
  children,
  language,
  theme,
  services: serviceClasses = [],
}: EditorProviderProps) {
  const events = useMemo(() => new EventEmitter(), []);
  const services = useMemo(() => new ServiceRegistry(), []);
  const commands = useMemo(() => new CommandRegistry(), []);
  const extensions = useMemo(() => new ExtensionRegistry(), []);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Initialize language plugin
    const init = async () => {
      if (language) {
        await language.initialize?.();
        
        // Register language services
        const highlightingService = language.getHighlightingService();
        const validationService = language.getValidationService();
        const autocompleteService = language.getAutocompleteService();
        
        services.register(highlightingService);
        services.register(validationService);
        services.register(autocompleteService);
        
        // Activate services
        const serviceContext = {
          editor: {} as any, // Will be set by editor component
          events,
          services,
          commands,
        };
        
        await services.activateAll(serviceContext);
      }
      
      // Register additional services
      for (const ServiceClass of serviceClasses) {
        const service = new ServiceClass();
        services.register(service);
      }
      
      setInitialized(true);
    };
    
    init().catch(console.error);
    
    return () => {
      services.deactivateAll();
      services.dispose();
    };
  }, [language, services, commands, events, serviceClasses]);

  const value: EditorContextValue = useMemo(() => ({
    events,
    services,
    commands,
    extensions,
    language,
    theme,
    initialized,
  }), [events, services, commands, extensions, language, theme, initialized]);

  return (
    <EditorContext.Provider value={value}>
      {children}
    </EditorContext.Provider>
  );
}

export function useEditorContext(): EditorContextValue {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error('useEditorContext must be used within EditorProvider');
  }
  return context;
}

