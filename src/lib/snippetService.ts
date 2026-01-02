import { supabase } from './supabase';
import { defaultSnippets, type Snippet } from './snippets';

// Extended interface to support both default snippets (numeric id) and Supabase snippets (uuid)
export interface SnippetWithSource extends Snippet {
  id: number | string; // number for default, string (uuid) for Supabase
  isDefault?: boolean; // true for default snippets, false/undefined for user snippets
  suggested_by?: string; // nickname of who suggested the snippet
  created_at?: string;
  updated_at?: string;
}

// Database snippet interface (matches Supabase table)
interface DatabaseSnippet {
  id: string; // UUID
  title: string;
  description: string;
  code: string;
  tags: string[];
  author: string;
  suggested_by?: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Convert database snippet to SnippetWithSource
 */
function dbSnippetToSnippet(dbSnippet: DatabaseSnippet): SnippetWithSource {
  return {
    id: dbSnippet.id,
    title: dbSnippet.title,
    description: dbSnippet.description,
    code: dbSnippet.code,
    tags: dbSnippet.tags || [],
    author: dbSnippet.author,
    suggested_by: dbSnippet.suggested_by || undefined,
    isDefault: false,
    created_at: dbSnippet.created_at,
    updated_at: dbSnippet.updated_at,
  };
}

/**
 * Get all snippets from Supabase
 */
export async function getAllSnippets(): Promise<SnippetWithSource[]> {
  try {
    const { data, error } = await supabase
      .from('snippets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching snippets from Supabase:', error);
      return [];
    }

    return (data || []).map(dbSnippetToSnippet);
  } catch (error) {
    console.error('Error fetching snippets:', error);
    return [];
  }
}

/**
 * Create a new snippet in Supabase
 */
export async function createSnippet(
  title: string,
  description: string,
  code: string,
  tags: string[] = [],
  author: string = 'User',
  suggested_by?: string
): Promise<SnippetWithSource | null> {
  try {
    const { data, error } = await supabase
      .from('snippets')
      .insert({
        title,
        description,
        code,
        tags,
        author,
        suggested_by: suggested_by || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating snippet:', error);
      throw error;
    }

    return data ? dbSnippetToSnippet(data) : null;
  } catch (error) {
    console.error('Error creating snippet:', error);
    throw error;
  }
}

/**
 * Update an existing snippet in Supabase
 */
export async function updateSnippet(
  id: string,
  updates: {
    title?: string;
    description?: string;
    code?: string;
    tags?: string[];
    author?: string;
    suggested_by?: string;
  }
): Promise<SnippetWithSource | null> {
  try {
    // Convert empty string to null for suggested_by
    const updateData = {
      ...updates,
      suggested_by: updates.suggested_by === undefined 
        ? undefined 
        : (updates.suggested_by?.trim() || null),
    };

    const { data, error } = await supabase
      .from('snippets')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating snippet:', error);
      throw error;
    }

    return data ? dbSnippetToSnippet(data) : null;
  } catch (error) {
    console.error('Error updating snippet:', error);
    throw error;
  }
}

/**
 * Delete a snippet from Supabase
 */
export async function deleteSnippet(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('snippets')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting snippet:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error deleting snippet:', error);
    throw error;
  }
}

/**
 * Get combined snippets (default + Supabase)
 * Falls back to default snippets only if Supabase fails
 */
export async function getCombinedSnippets(): Promise<SnippetWithSource[]> {
  try {
    const [defaultSnippetsList, userSnippets] = await Promise.all([
      Promise.resolve(defaultSnippets.map(s => ({ ...s, isDefault: true }))),
      getAllSnippets(),
    ]);

    // Combine default snippets with user snippets
    return [...defaultSnippetsList, ...userSnippets];
  } catch (error) {
    console.error('Error getting combined snippets, falling back to defaults:', error);
    // Fallback to default snippets only
    return defaultSnippets.map(s => ({ ...s, isDefault: true }));
  }
}

/**
 * Check if a snippet is a default snippet (by checking if id is a number)
 */
export function isDefaultSnippet(snippet: SnippetWithSource): boolean {
  return typeof snippet.id === 'number' || snippet.isDefault === true;
}

