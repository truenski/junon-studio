import { useEditorContext } from '../providers/EditorProvider';
import type { CommandContext } from '../commands/ICommand';

export function useCommand() {
  const { commands, services } = useEditorContext();
  
  const execute = (id: string, context: CommandContext, ...args: any[]) => {
    return commands.execute(id, context, ...args);
  };
  
  return {
    execute,
    get: (id: string) => commands.get(id),
    getAll: () => commands.getAll(),
  };
}

