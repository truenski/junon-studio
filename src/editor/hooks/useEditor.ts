import { useEditorContext } from '../providers/EditorProvider';
import type { EditorContextValue } from '../providers/EditorProvider';

export function useEditor(): EditorContextValue {
  return useEditorContext();
}

