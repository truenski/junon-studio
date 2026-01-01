import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const GET: APIRoute = async () => {
  try {
    const [commands, triggers, actions, functions, variables, mobs, entities] = await Promise.all([
      getCollection('commands'),
      getCollection('triggers'),
      getCollection('actions'),
      getCollection('functions'),
      getCollection('variables'),
      getCollection('mobs'),
      getCollection('entities'),
    ]);

    // Transform collections to JSON-serializable format
    const data = {
      commands: commands.map(cmd => ({
        id: cmd.id,
        name: cmd.data.name,
        description: cmd.data.description,
        syntax: cmd.data.syntax || [],
        args: cmd.data.args || [],
        examples: cmd.data.examples || [],
        category: cmd.data.category,
      })),
      triggers: triggers.map(trigger => ({
        id: trigger.id,
        name: trigger.data.name,
        description: trigger.data.description,
        variables: trigger.data.variables || [],
        examples: trigger.data.examples || [],
      })),
      actions: actions.map(action => ({
        id: action.id,
        name: action.data.name,
        description: action.data.description,
        syntax: action.data.syntax || [],
        examples: action.data.examples || [],
      })),
      functions: functions.map(func => ({
        id: func.id,
        name: func.data.name,
        description: func.data.description,
        syntax: func.data.syntax || '',
        parameters: func.data.parameters || [],
        returns: func.data.returns || '',
        examples: func.data.examples || [],
      })),
      variables: variables.map(variable => ({
        id: variable.id,
        name: variable.data.name,
        description: variable.data.description,
        type: variable.data.type,
        examples: variable.data.examples || [],
      })),
      mobs: mobs.map(mob => ({
        id: mob.id,
        name: mob.data.name,
        description: mob.data.description,
        properties: mob.data.properties || [],
        examples: mob.data.examples || [],
      })),
      entities: entities.map(entity => ({
        id: entity.id,
        name: entity.data.name,
        description: entity.data.description,
        type: entity.data.type,
        properties: entity.data.properties || [],
        examples: entity.data.examples || [],
      })),
    };

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error loading MDX data:', error);
    return new Response(JSON.stringify({ error: 'Failed to load MDX data' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};

