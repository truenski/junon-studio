// Runtime loader for MDX data from Astro content collections

export interface MDXCommand {
  id: string;
  name: string;
  description: string;
  syntax: string[];
  args: Array<{
    name: string;
    type: string;
    required: boolean;
    description: string;
  }>;
  examples: Array<{
    code: string;
    description: string;
  }>;
  category: string;
}

export interface MDXTrigger {
  id: string;
  name: string;
  description: string;
  variables: Array<{
    name: string;
    type: string;
    description: string;
  }>;
  examples: Array<{
    code: string;
    description: string;
  }>;
}

export interface MDXAction {
  id: string;
  name: string;
  description: string;
  syntax?: string[];
  examples?: Array<{
    code: string;
    description: string;
  }>;
}

export interface MDXFunction {
  id: string;
  name: string;
  description: string;
  syntax: string;
  parameters?: Array<{
    name: string;
    type: string;
    required: boolean;
    description: string;
  }>;
  returns?: string;
  examples?: Array<{
    code: string;
    description: string;
  }>;
}

export interface MDXVariable {
  id: string;
  name: string;
  description: string;
  type: string;
  examples?: Array<{
    code: string;
    description: string;
  }>;
}

export interface MDXMob {
  id: string;
  name: string;
  description: string;
  properties?: Array<{
    name: string;
    value: string;
  }>;
  examples?: Array<{
    code: string;
    description: string;
  }>;
}

export interface MDXEntity {
  id: string;
  name: string;
  description: string;
  type: string;
  properties?: Array<{
    name: string;
    value: string;
  }>;
  examples?: Array<{
    code: string;
    description: string;
  }>;
}

export interface MDXData {
  commands: MDXCommand[];
  triggers: MDXTrigger[];
  actions: MDXAction[];
  functions: MDXFunction[];
  variables: MDXVariable[];
  mobs: MDXMob[];
  entities: MDXEntity[];
}

let cachedData: MDXData | null = null;
let loadingPromise: Promise<MDXData> | null = null;

export async function loadMDXData(): Promise<MDXData> {
  // Return cached data if available
  if (cachedData) {
    return cachedData;
  }

  // Return existing loading promise if already loading
  if (loadingPromise) {
    return loadingPromise;
  }

  // Start loading
  loadingPromise = fetch('/api/mdx-data')
    .then(response => {
      if (!response.ok) {
        throw new Error(`Failed to load MDX data: ${response.statusText}`);
      }
      return response.json();
    })
    .then(data => {
      cachedData = data as MDXData;
      return cachedData;
    })
    .catch(error => {
      console.error('Error loading MDX data:', error);
      // Return empty data structure on error
      cachedData = {
        commands: [],
        triggers: [],
        actions: [],
        functions: [],
        variables: [],
        mobs: [],
        entities: [],
      };
      return cachedData;
    })
    .finally(() => {
      loadingPromise = null;
    });

  return loadingPromise;
}

export function getCommands(): Promise<MDXCommand[]> {
  return loadMDXData().then(data => data.commands);
}

export function getTriggers(): Promise<MDXTrigger[]> {
  return loadMDXData().then(data => data.triggers);
}

export function getActions(): Promise<MDXAction[]> {
  return loadMDXData().then(data => data.actions);
}

export function getFunctions(): Promise<MDXFunction[]> {
  return loadMDXData().then(data => data.functions);
}

export function getVariables(): Promise<MDXVariable[]> {
  return loadMDXData().then(data => data.variables);
}

export function getMobs(): Promise<MDXMob[]> {
  return loadMDXData().then(data => data.mobs);
}

export function getEntities(): Promise<MDXEntity[]> {
  return loadMDXData().then(data => data.entities);
}

// Transform functions for autocomplete
export function getCommandNames(): Promise<string[]> {
  return getCommands().then(commands => commands.map(cmd => cmd.name));
}

export function getTriggerNames(): Promise<string[]> {
  return getTriggers().then(triggers => triggers.map(trigger => trigger.name));
}

export function getFunctionNames(): Promise<string[]> {
  return getFunctions().then(functions => functions.map(func => func.name));
}

