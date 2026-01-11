import type { ICommand, CommandContext } from './ICommand';

export class CommandRegistry {
  private commands: Map<string, ICommand> = new Map();

  register(command: ICommand): void {
    if (this.commands.has(command.id)) {
      console.warn(`Command ${command.id} is already registered`);
      return;
    }
    this.commands.set(command.id, command);
  }

  unregister(id: string): void {
    this.commands.delete(id);
  }

  get(id: string): ICommand | undefined {
    return this.commands.get(id);
  }

  getAll(): ICommand[] {
    return Array.from(this.commands.values());
  }

  execute(id: string, context: CommandContext, ...args: any[]): Promise<any> | any {
    const command = this.commands.get(id);
    if (!command) {
      throw new Error(`Command ${id} not found`);
    }

    if (command.enabled && !command.enabled(context)) {
      return;
    }

    return command.execute(...args);
  }

  has(id: string): boolean {
    return this.commands.has(id);
  }
}

