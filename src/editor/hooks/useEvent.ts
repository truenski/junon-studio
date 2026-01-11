import { useEffect } from 'react';
import { useEditorContext } from '../providers/EditorProvider';
import type { Disposable } from '../core/types';

export function useEvent<T = any>(
  event: string,
  handler: (data: T) => void,
  deps: React.DependencyList = []
): void {
  const { events } = useEditorContext();
  
  useEffect(() => {
    const disposable = events.on<T>(event, handler);
    return () => disposable.dispose();
  }, [events, event, ...deps]);
}

