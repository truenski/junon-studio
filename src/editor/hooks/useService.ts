import { useEditorContext } from '../providers/EditorProvider';
import type { IService } from '../services/base/IService';

export function useService<T extends IService = IService>(id: string): T | undefined {
  const { services } = useEditorContext();
  return services.get<T>(id);
}

