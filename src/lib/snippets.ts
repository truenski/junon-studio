export interface Snippet {
  id: number;
  title: string;
  description: string;
  tags: string[];
  code: string;
  author: string;
}

// Default snippets (built-in)
export const defaultSnippets: Snippet[] = [
];

// Legacy export for backwards compatibility
export const snippets = defaultSnippets;

// Function to get all snippets (default + Supabase)
// This is a convenience function that re-exports from snippetService
export async function getSnippets() {
  const { getCombinedSnippets } = await import('./snippetService');
  return getCombinedSnippets();
}

  