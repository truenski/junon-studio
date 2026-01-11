# Proposta: Integração com File System Access API

## Visão Geral

Este documento descreve a especificação da integração com File System Access API para salvar e carregar arquivos `.junon` localmente no projeto ref-readonly.

## Objetivos

1. **Salvar arquivos .junon localmente** usando File System Access API
2. **Carregar arquivos .junon** do sistema de arquivos
3. **Listar apenas arquivos .junon** no diretório selecionado
4. **Manter compatibilidade** com sistema de arquivos temporários existente
5. **Gerenciar permissões** de acesso ao sistema de arquivos

## File System Access API

### Visão Geral

A File System Access API permite que aplicações web leiam e escrevam arquivos no sistema de arquivos local do usuário, com permissão explícita.

### Suporte de Browsers

- **Chrome/Edge**: ✅ Suportado
- **Firefox**: ❌ Não suportado (fallback para download)
- **Safari**: ❌ Não suportado (fallback para download)

### Fallback

Quando File System Access API não está disponível:
- **Salvar**: Usa download de arquivo
- **Carregar**: Usa input de arquivo
- **Listar**: Usa sistema de arquivos temporários (localStorage)

## Estrutura de Integração

### Componentes

```
ref-readonly/
├── src/
│   ├── components/
│   │   ├── MakepadEditor.tsx          # Usa File System Access API
│   │   └── TemporaryFilesClient.tsx  # Compatibilidade com localStorage
│   └── lib/
│       └── fileSystemAccess.ts       # Helpers para File System Access API
```

### Fluxo de Dados

```
MakepadEditor
    ↓
fileSystemAccess.ts
    ↓
File System Access API (nativo)
    ↓
Sistema de Arquivos Local
```

## Implementação

### 1. Abrir Diretório

```typescript
async function openDirectory(): Promise<FileSystemDirectoryHandle | null> {
  if ('showDirectoryPicker' in window) {
    try {
      const handle = await window.showDirectoryPicker({
        mode: 'readwrite',
      });
      return handle;
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error opening directory:', error);
      }
      return null;
    }
  }
  return null; // Fallback para browsers sem suporte
}
```

### 2. Listar Arquivos .junon

```typescript
async function listJunonFiles(
  directoryHandle: FileSystemDirectoryHandle
): Promise<string[]> {
  const files: string[] = [];
  
  for await (const [name, handle] of directoryHandle.entries()) {
    if (handle.kind === 'file' && name.endsWith('.junon')) {
      files.push(name);
    }
  }
  
  return files.sort();
}
```

### 3. Ler Arquivo .junon

```typescript
async function readJunonFile(
  directoryHandle: FileSystemDirectoryHandle,
  filename: string
): Promise<string | null> {
  try {
    const fileHandle = await directoryHandle.getFileHandle(filename);
    const file = await fileHandle.getFile();
    const content = await file.text();
    return content;
  } catch (error) {
    console.error('Error reading file:', error);
    return null;
  }
}
```

### 4. Salvar Arquivo .junon

```typescript
async function saveJunonFile(
  directoryHandle: FileSystemDirectoryHandle,
  filename: string,
  content: string
): Promise<boolean> {
  try {
    const fileHandle = await directoryHandle.getFileHandle(filename, {
      create: true,
    });
    const writable = await fileHandle.createWritable();
    await writable.write(content);
    await writable.close();
    return true;
  } catch (error) {
    console.error('Error saving file:', error);
    return false;
  }
}
```

### 5. Criar Arquivo .junon

```typescript
async function createJunonFile(
  directoryHandle: FileSystemDirectoryHandle,
  filename: string,
  content: string = ''
): Promise<boolean> {
  // Garantir que o arquivo tem extensão .junon
  const finalFilename = filename.endsWith('.junon') 
    ? filename 
    : `${filename}.junon`;
  
  return saveJunonFile(directoryHandle, finalFilename, content);
}
```

### 6. Deletar Arquivo .junon

```typescript
async function deleteJunonFile(
  directoryHandle: FileSystemDirectoryHandle,
  filename: string
): Promise<boolean> {
  try {
    await directoryHandle.removeEntry(filename);
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
}
```

## Integração com MakepadEditor

### Estado do Editor

```typescript
interface MakepadEditorState {
  directoryHandle: FileSystemDirectoryHandle | null;
  currentFile: string | null;
  files: string[]; // Lista de arquivos .junon
  content: string;
}
```

### Inicialização

```typescript
useEffect(() => {
  // Tentar restaurar diretório salvo
  const savedDirectory = localStorage.getItem('junonDirectory');
  if (savedDirectory) {
    // Tentar reabrir diretório (pode falhar se permissão expirou)
    // ...
  }
}, []);
```

### Abrir Diretório

```typescript
const handleOpenDirectory = async () => {
  const handle = await openDirectory();
  if (handle) {
    setDirectoryHandle(handle);
    localStorage.setItem('junonDirectory', handle.name);
    
    // Listar arquivos .junon
    const files = await listJunonFiles(handle);
    setFiles(files);
    
    // Carregar primeiro arquivo se houver
    if (files.length > 0) {
      await handleLoadFile(files[0]);
    }
  }
};
```

### Carregar Arquivo

```typescript
const handleLoadFile = async (filename: string) => {
  if (!directoryHandle) return;
  
  const content = await readJunonFile(directoryHandle, filename);
  if (content !== null) {
    setContent(content);
    setCurrentFile(filename);
    // Atualizar editor WASM
    editorInstance.setContent(content);
  }
};
```

### Salvar Arquivo

```typescript
const handleSaveFile = async () => {
  if (!directoryHandle || !currentFile) return;
  
  const content = editorInstance.getContent();
  const success = await saveJunonFile(directoryHandle, currentFile, content);
  
  if (success) {
    // Mostrar notificação de sucesso
    showNotification('File saved successfully');
  } else {
    // Mostrar erro
    showError('Failed to save file');
  }
};
```

## Compatibilidade com TemporaryFilesClient

### Estratégia de Fallback

1. **Tentar File System Access API primeiro**
2. **Se não disponível, usar localStorage** (sistema atual)
3. **Manter compatibilidade** com eventos existentes

### Adaptação de Eventos

```typescript
// Eventos existentes do TemporaryFilesClient
window.addEventListener('fileSelect', (e: CustomEvent) => {
  const file = e.detail;
  // Adaptar para File System Access API
  if (directoryHandle) {
    handleLoadFile(file.name);
  } else {
    // Usar sistema antigo
    // ...
  }
});
```

## Gerenciamento de Permissões

### Verificar Permissão

```typescript
async function checkPermission(
  directoryHandle: FileSystemDirectoryHandle
): Promise<'granted' | 'denied' | 'prompt'> {
  return await directoryHandle.queryPermission({ mode: 'readwrite' });
}
```

### Solicitar Permissão

```typescript
async function requestPermission(
  directoryHandle: FileSystemDirectoryHandle
): Promise<boolean> {
  const permission = await directoryHandle.requestPermission({ 
    mode: 'readwrite' 
  });
  return permission === 'granted';
}
```

## Filtragem de Arquivos

### Apenas Arquivos .junon

```typescript
function isJunonFile(filename: string): boolean {
  return filename.endsWith('.junon');
}

// Filtrar ao listar
const junonFiles = files.filter(isJunonFile);
```

### Ignorar Outros Tipos

- **Pastas**: Ignoradas na listagem
- **Outros arquivos**: Ignorados (não .junon)
- **Arquivos ocultos**: Tratados normalmente

## Tratamento de Erros

### Erros Comuns

1. **Permissão negada**: Mostrar mensagem e oferecer fallback
2. **Arquivo não encontrado**: Mostrar erro e manter estado anterior
3. **Erro de escrita**: Mostrar erro e permitir tentar novamente
4. **Diretório fechado**: Solicitar reabertura

### Mensagens de Erro

```typescript
const ERROR_MESSAGES = {
  PERMISSION_DENIED: 'Permission to access directory was denied',
  FILE_NOT_FOUND: 'File not found in directory',
  WRITE_ERROR: 'Failed to write file',
  READ_ERROR: 'Failed to read file',
  DIRECTORY_CLOSED: 'Directory access was closed. Please reopen.',
};
```

## Performance

### Otimizações

1. **Cache de conteúdo**: Manter conteúdo em memória
2. **Lazy loading**: Carregar arquivos apenas quando necessário
3. **Debounce de salvamento**: Salvar automaticamente após pausa na digitação

### Salvamento Automático

```typescript
useEffect(() => {
  const timer = setTimeout(() => {
    if (autoSave && directoryHandle && currentFile) {
      handleSaveFile();
    }
  }, 2000); // Salvar após 2 segundos de inatividade

  return () => clearTimeout(timer);
}, [content, autoSave]);
```

## Testes

### Cenários de Teste

1. **Abrir diretório**: Verificar se lista arquivos .junon
2. **Carregar arquivo**: Verificar se conteúdo é carregado corretamente
3. **Salvar arquivo**: Verificar se arquivo é salvo corretamente
4. **Criar arquivo**: Verificar se novo arquivo é criado
5. **Deletar arquivo**: Verificar se arquivo é deletado
6. **Fallback**: Verificar se funciona sem File System Access API

## Referências

- [PROPOSTA_INTEGRACAO.md](./PROPOSTA_INTEGRACAO.md) - Visão geral da integração
- [MDN: File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API)

