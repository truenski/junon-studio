# Exemplo: Componente React MakepadEditor

Este documento contém um exemplo completo de como criar um componente React que integra o editor WASM do Makepad com suporte para linguagem .junon.

## Componente Completo

```typescript
// src/components/MakepadEditor.tsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { AlertCircle } from 'lucide-react';
import type { TemporaryFile } from '@/lib/fileStorage';
import { getAllFiles, saveFile, getCurrentFileId, setCurrentFileId } from '@/lib/fileStorage';

// Tipos TypeScript (gerados pelo wasm-pack)
interface WasmEditor {
  new_junon(): WasmEditor;
  new(config_json: string): WasmEditor;
  initialize(text: string, uri: string): void;
  set_text(text: string): void;
  get_text(): string;
  set_language(language: string): void;
  validate_junon(code: string): string; // Retorna JSON de diagnostics
  get_diagnostics(): string; // Retorna JSON de diagnostics
}

interface FileSystemAccess {
  new(): FileSystemAccess;
  open_directory(): Promise<void>;
  read_file(filename: string): Promise<string>;
  save_file(filename: string, content: string): Promise<void>;
  is_available(): boolean;
}

interface AutocompleteManager {
  new(): AutocompleteManager;
  load_mdx_index(json_str: string): void;
  get_suggestions(prefix: string, context: string): string; // Retorna JSON array
}

// Importar módulo WASM (ajustar caminho conforme necessário)
let wasmModule: any = null;
let initWasm: (path: string) => Promise<void> = async () => {};

async function loadWasm(): Promise<void> {
  if (!wasmModule) {
    wasmModule = await import('/wasm/makepad_editor_wasm.js');
    initWasm = wasmModule.default;
    await initWasm('/wasm/makepad_editor_wasm_bg.wasm');
  }
}

interface MakepadEditorProps {
  file?: TemporaryFile;
  onFileChange?: (file: TemporaryFile) => void;
  onErrors?: (errors: Array<{ line: number; column: number; message: string }>) => void;
}

export function MakepadEditor({ file, onFileChange, onErrors }: MakepadEditorProps) {
  const editorRef = useRef<WasmEditor | null>(null);
  const fileSystemRef = useRef<FileSystemAccess | null>(null);
  const autocompleteRef = useRef<AutocompleteManager | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState<Array<{ line: number; column: number; message: string }>>([]);
  const [hasFileSystem, setHasFileSystem] = useState(false);

  // Inicializar WASM e editor
  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        // Carregar módulo WASM
        await loadWasm();

        if (!mounted) return;

        // Criar editor .junon
        const editor = wasmModule.WasmEditor.new_junon();
        editorRef.current = editor;

        // Verificar File System Access API
        if (wasmModule.FileSystemAccess.is_available()) {
          const fs = new wasmModule.FileSystemAccess();
          fileSystemRef.current = fs;
          setHasFileSystem(true);
        }

        // Criar autocomplete manager
        const autocomplete = new wasmModule.AutocompleteManager();
        autocompleteRef.current = autocomplete;

        // Carregar índice MDX
        try {
          const mdxResponse = await fetch('/mdx-index.json');
          if (mdxResponse.ok) {
            const mdxJson = await mdxResponse.text();
            autocomplete.load_mdx_index(mdxJson);
          }
        } catch (e) {
          console.warn('Failed to load MDX index:', e);
        }

        // Inicializar editor com conteúdo do arquivo
        if (file) {
          editor.initialize(file.content, `file:///${file.name}`);
        } else {
          editor.initialize('', 'file:///untitled.junon');
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Failed to initialize Makepad editor:', error);
        setIsLoading(false);
      }
    }

    init();

    return () => {
      mounted = false;
    };
  }, []);

  // Atualizar conteúdo quando arquivo mudar
  useEffect(() => {
    if (editorRef.current && file) {
      editorRef.current.set_text(file.content);
      validateCode(file.content);
    }
  }, [file?.id]);

  // Validar código
  const validateCode = useCallback((code: string) => {
    if (!editorRef.current) return;

    try {
      const diagnosticsJson = editorRef.current.validate_junon(code);
      const diagnostics = JSON.parse(diagnosticsJson);
      
      // Filtrar apenas erros (severity === 1)
      const errorDiagnostics = diagnostics.filter((d: any) => d.severity === 1);
      
      // Converter para formato esperado pelo Logger
      const validationErrors = errorDiagnostics.map((d: any) => ({
        line: d.range.start.line,
        column: d.range.start.character,
        length: d.range.end.character - d.range.start.character,
        message: d.message,
      }));

      setErrors(validationErrors);
      onErrors?.(validationErrors);
    } catch (error) {
      console.error('Validation error:', error);
    }
  }, [onErrors]);

  // Debounce para validação
  const validationTimeoutRef = useRef<NodeJS.Timeout>();
  
  const handleTextChange = useCallback(() => {
    if (!editorRef.current) return;

    const newText = editorRef.current.get_text();
    
    // Atualizar arquivo
    if (file && onFileChange) {
      onFileChange({ ...file, content: newText });
    }

    // Debounce validação
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }

    validationTimeoutRef.current = setTimeout(() => {
      validateCode(newText);
    }, 500);
  }, [file, onFileChange, validateCode]);

  // Abrir diretório (File System Access API)
  const handleOpenDirectory = useCallback(async () => {
    if (!fileSystemRef.current) {
      alert('File System Access API not available. Use Chrome or Edge.');
      return;
    }

    try {
      await fileSystemRef.current.open_directory();
      // Listar arquivos .junon (fazer no JavaScript devido ao AsyncIterator)
      // Ver exemplo em INTEGRACAO_MAKEPAD_EDITOR.md
    } catch (error) {
      console.error('Failed to open directory:', error);
    }
  }, []);

  // Salvar arquivo
  const handleSave = useCallback(async () => {
    if (!editorRef.current || !file) return;

    const content = editorRef.current.get_text();

    if (fileSystemRef.current) {
      // Usar File System Access API
      try {
        await fileSystemRef.current.save_file(file.name, content);
        console.log('File saved via File System Access API');
      } catch (error) {
        console.error('Failed to save file:', error);
      }
    } else {
      // Fallback para localStorage
      saveFile({ ...file, content });
    }
  }, [file]);

  // Carregar arquivo
  const handleLoadFile = useCallback(async (filename: string) => {
    if (!editorRef.current) return;

    if (fileSystemRef.current) {
      try {
        const content = await fileSystemRef.current.read_file(filename);
        editorRef.current.set_text(content);
        
        // Atualizar arquivo atual
        if (onFileChange) {
          onFileChange({ id: filename, name: filename, content, lastModified: Date.now() });
        }
      } catch (error) {
        console.error('Failed to load file:', error);
      }
    } else {
      // Fallback para localStorage
      const allFiles = getAllFiles();
      const file = allFiles.find(f => f.name === filename);
      if (file) {
        editorRef.current.set_text(file.content);
        if (onFileChange) {
          onFileChange(file);
        }
      }
    }
  }, [onFileChange]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Loading editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-2 border-b">
        {hasFileSystem && (
          <button
            onClick={handleOpenDirectory}
            className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded"
          >
            Open Directory
          </button>
        )}
        <button
          onClick={handleSave}
          className="px-3 py-1 text-sm bg-secondary text-secondary-foreground rounded"
          disabled={!file}
        >
          Save
        </button>
      </div>

      {/* Editor Canvas */}
      <div className="flex-1 relative">
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          onInput={handleTextChange}
          // Nota: Renderização do editor ainda precisa ser implementada
          // Por enquanto, usar textarea como fallback
        />
        
        {/* Fallback: Textarea temporário */}
        <textarea
          className="w-full h-full font-mono p-4 bg-background text-foreground resize-none"
          value={file?.content || ''}
          onChange={(e) => {
            if (editorRef.current) {
              editorRef.current.set_text(e.target.value);
              handleTextChange();
            }
          }}
          placeholder="@trigger PlayerJoined&#10;    @commands&#10;        /chat Welcome!"
        />
      </div>

      {/* Error Indicator */}
      {errors.length > 0 && (
        <div className="p-2 bg-destructive/10 border-t border-destructive/20">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-destructive" />
            <span className="text-sm text-destructive">
              {errors.length} error{errors.length !== 1 ? 's' : ''} found
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
```

## Explicação Linha por Linha

### Imports e Tipos

```typescript
// Importar tipos do WASM (gerados automaticamente pelo wasm-pack)
interface WasmEditor { ... }
```

Os tipos são gerados automaticamente pelo `wasm-pack` no arquivo `.d.ts`. Você pode importá-los diretamente:

```typescript
import type { WasmEditor, FileSystemAccess } from '/wasm/makepad_editor_wasm';
```

### Carregamento do WASM

```typescript
async function loadWasm(): Promise<void> {
  if (!wasmModule) {
    wasmModule = await import('/wasm/makepad_editor_wasm.js');
    initWasm = wasmModule.default;
    await initWasm('/wasm/makepad_editor_wasm_bg.wasm');
  }
}
```

Esta função carrega o módulo WASM de forma lazy e garante que seja carregado apenas uma vez.

### Inicialização

```typescript
useEffect(() => {
  async function init() {
    await loadWasm();
    const editor = wasmModule.WasmEditor.new_junon();
    editorRef.current = editor;
    // ...
  }
  init();
}, []);
```

O `useEffect` inicializa o editor quando o componente monta.

### Validação

```typescript
const validateCode = useCallback((code: string) => {
  const diagnosticsJson = editorRef.current.validate_junon(code);
  const diagnostics = JSON.parse(diagnosticsJson);
  const errors = diagnostics.filter((d: any) => d.severity === 1);
  // ...
}, [onErrors]);
```

A validação retorna diagnostics no formato LSP. Filtramos apenas erros (severity === 1).

### File System Access API

```typescript
if (wasmModule.FileSystemAccess.is_available()) {
  const fs = new wasmModule.FileSystemAccess();
  fileSystemRef.current = fs;
}
```

Verificamos se a API está disponível antes de usar.

## Integração com TemporaryFilesClient

Para manter compatibilidade com o sistema existente:

```typescript
// No componente que usa MakepadEditor
function CodeEditorWrapper() {
  const [currentFile, setCurrentFile] = useState<TemporaryFile | null>(null);
  const [errors, setErrors] = useState<ValidationError[]>([]);

  return (
    <>
      <TemporaryFilesClient />
      <MakepadEditor
        file={currentFile}
        onFileChange={setCurrentFile}
        onErrors={setErrors}
      />
      <Logger errors={errors} />
    </>
  );
}
```

## Tratamento de Erros

```typescript
try {
  await fileSystemRef.current.save_file(filename, content);
} catch (error) {
  console.error('Failed to save file:', error);
  // Fallback para localStorage
  saveFile({ ...file, content });
}
```

Sempre implemente fallback para quando File System Access API não estiver disponível.

## Performance

### Debounce de Validação

```typescript
const validationTimeoutRef = useRef<NodeJS.Timeout>();

const handleTextChange = useCallback(() => {
  if (validationTimeoutRef.current) {
    clearTimeout(validationTimeoutRef.current);
  }
  validationTimeoutRef.current = setTimeout(() => {
    validateCode(newText);
  }, 500);
}, []);
```

Use debounce para evitar validação excessiva.

### Web Workers (Futuro)

Para melhor performance, mova a validação para um Web Worker:

```typescript
// worker.ts
import init, { WasmEditor } from '/wasm/makepad_editor_wasm.js';

await init('/wasm/makepad_editor_wasm_bg.wasm');

self.onmessage = (e) => {
  const { code } = e.data;
  const editor = WasmEditor.new_junon();
  editor.initialize(code, 'file:///temp.junon');
  const diagnostics = editor.validate_junon(code);
  self.postMessage({ diagnostics });
};
```

## Referências

- [INTEGRACAO_MAKEPAD_EDITOR.md](./INTEGRACAO_MAKEPAD_EDITOR.md) - Documentação completa
- [BUILD_E_DEPLOY.md](./BUILD_E_DEPLOY.md) - Guia de build

