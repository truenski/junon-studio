import { glob } from "astro/loaders";
import { defineCollection, z } from "astro:content";

const commandArgSchema = z.object({
  name: z.string(),
  type: z.string(),
  required: z.boolean(),
  description: z.string(),
});

const exampleSchema = z.object({
  code: z.string(),
  description: z.string(),
});

const commands = defineCollection({
  loader: glob({ base: "./src/content/commands", pattern: "**/*.{md,mdx}" }),
  schema: z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    syntax: z.array(z.string()),
    args: z.array(commandArgSchema).optional(),
    examples: z.array(exampleSchema).optional(),
    category: z.enum(["getter", "toggle", "setter", "with-args"]),
    lang: z.enum(["en", "es"]).default("en"),
  }),
});

const triggerVariableSchema = z.object({
  name: z.string(),
  type: z.string(),
  description: z.string(),
});

const triggers = defineCollection({
  loader: glob({ base: "./src/content/triggers", pattern: "**/*.{md,mdx}" }),
  schema: z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    variables: z.array(triggerVariableSchema).optional(),
    examples: z.array(exampleSchema).optional(),
    lang: z.enum(["en", "es"]).default("en"),
  }),
});

const actions = defineCollection({
  loader: glob({ base: "./src/content/actions", pattern: "**/*.{md,mdx}" }),
  schema: z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    syntax: z.array(z.string()).optional(),
    examples: z.array(exampleSchema).optional(),
    lang: z.enum(["en", "es"]).default("en"),
  }),
});

const functions = defineCollection({
  loader: glob({ base: "./src/content/functions", pattern: "**/*.{md,mdx}" }),
  schema: z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    syntax: z.string(),
    parameters: z.array(commandArgSchema).optional(),
    returns: z.string().optional(),
    examples: z.array(exampleSchema).optional(),
    lang: z.enum(["en", "es"]).default("en"),
  }),
});

const variables = defineCollection({
  loader: glob({ base: "./src/content/variables", pattern: "**/*.{md,mdx}" }),
  schema: z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    type: z.string(),
    examples: z.array(exampleSchema).optional(),
    lang: z.enum(["en", "es"]).default("en"),
  }),
});

const mobs = defineCollection({
  loader: glob({ base: "./src/content/mobs", pattern: "**/*.{md,mdx}" }),
  schema: z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    properties: z.array(z.object({ name: z.string(), value: z.string() })).optional(),
    examples: z.array(exampleSchema).optional(),
    lang: z.enum(["en", "es"]).default("en"),
  }),
});

const entities = defineCollection({
  loader: glob({ base: "./src/content/entities", pattern: "**/*.{md,mdx}" }),
  schema: z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    type: z.string(),
    properties: z.array(z.object({ name: z.string(), value: z.string() })).optional(),
    examples: z.array(exampleSchema).optional(),
    lang: z.enum(["en", "es"]).default("en"),
  }),
});

export const collections = {
  commands,
  triggers,
  actions,
  functions,
  variables,
  mobs,
  entities,
};

