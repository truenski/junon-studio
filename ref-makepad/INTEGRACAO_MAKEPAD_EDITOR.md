# Integração do Editor WASM Makepad com Linguagem .junon

## Visão Geral

Este documento descreve como integrar o editor WASM do Makepad no projeto ref-readonly, substituindo o editor React atual e adicionando suporte completo para a linguagem `.junon` com highlighting profissional, validação em tempo real, e integração com File System Access API.

## Arquitetura

```
React Component (MakepadEditor.tsx)
    ↓
WASM Module (makepad-editor-wasm)
    ↓
Rust Code Editor (code_editor)
    ├── JunonTokenizer (highlighting)
    ├── JunonValidation (validação)
    └── LSP Integration (diagnostics)
    ↓
File System Access API
    ↓
TemporaryFilesClient (compatibilidade)
```

## Instalação

### 1. Compilar o Módulo WASM

Primeiro, compile o módulo WASM do editor:

```bash
cd /path/to/makepad/makepad-editor-wasm

# Instalar wasm-pack se necessário
cargo install wasm-pack

# Compilar para WASM
wasm-pack build --target web --out-dir pkg
```

Isso gerará os arquivos em `makepad-editor-wasm/pkg/`:
- `makepad_editor_wasm.js` - Bindings JavaScript
- `makepad_editor_wasm_bg.wasm` - Módulo WASM
- `makepad_editor_wasm.d.ts` - TypeScript definitions

### 2. Copiar Arquivos para o Projeto

Copie os arquivos gerados para o projeto ref-readonly:

```bash
# Criar diretório para WASM
mkdir -p ref-readonly/public/wasm

# Copiar arquivos
cp makepad-editor-wasm/pkg/*.js ref-readonly/public/wasm/
cp makepad-editor-wasm/pkg/*.wasm ref-readonly/public/wasm/
cp makepad-editor-wasm/pkg/*.d.ts ref-readonly/src/lib/
```

## Inicialização

### Carregar o Módulo WASM

```typescript
// src/lib/makepadEditor.ts
import init, { WasmEditor, FileSystemAccess, LspClient, AutocompleteManager } from '/wasm/makepad_editor_wasm.js';

let wasmInitialized = false;

export async function initMakepadEditor(): Promise<void> {
  if (!wasmInitialized) {
    await init('/wasm/makepad_editor_wasm_bg.wasm');
    wasmInitialized = true;
  }
}
```

### Criar Instância do Editor

```typescript
import { initMakepadEditor } from '@/lib/makepadEditor';

// Inicializar WASM
await initMakepadEditor();

// Criar editor com configuração .junon
const editor = WasmEditor.new_junon();

// Ou criar com configuração customizada
const configJson = JSON.stringify({
  highlighting: { language: "junon" },
  lsp: { enabled: false },
  theme: { colors: { /* ... */ } },
  settings: { tab_column_count: 4 }
});
const editor = WasmEditor.new(configJson);

// Inicializar com conteúdo
editor.initialize(initialCode, 'file:///main.junon');
```

## Configuração .junon

### Configuração Padrão

O editor já vem com configuração padrão para .junon:

```json
{
  "highlighting": {
    "language": "junon",
    "tree_sitter_grammar_url": null
  },
  "lsp": {
    "enabled": false
  },
  "theme": {
    "colors": {
      "other_keyword": "#C485BE",      // @trigger, @commands
      "function": "#5B9BD3",            // /chat, /give
      "identifier": "#fffcc9",          // $getHealth
      "constant": "#D4D4D4",             // $player
      "punctuator": "#D4D4D4",          // ==, !=
      "number": "#B6CEAA",              // 100, 5000
      "string": "#56C9B1",               // player.health
      "comment": "#638D54"              // // comments
    }
  },
  "settings": {
    "tab_column_count": 4
  }
}
```

### Usar Configuração Customizada

```typescript
const customConfig = {
  highlighting: { language: "junon" },
  theme: {
    colors: {
      other_keyword: "#FF0000",  // Customizar cores
      function: "#00FF00",
      // ...
    }
  },
  settings: {
    tab_column_count: 4
  }
};

editor.update_config(JSON.stringify(customConfig));
```

## Eventos

### Mudanças de Texto

```typescript
// O editor não tem callbacks built-in ainda
// Você precisa verificar mudanças manualmente ou implementar polling

let lastText = editor.get_text();

setInterval(() => {
  const currentText = editor.get_text();
  if (currentText !== lastText) {
    lastText = currentText;
    // Atualizar UI, validar, etc.
    handleTextChange(currentText);
  }
}, 100); // Polling a cada 100ms
```

### Validação em Tempo Real

```typescript
function validateCode(editor: WasmEditor, code: string): void {
  // Validar código .junon
  const diagnosticsJson = editor.validate_junon(code);
  const diagnostics = JSON.parse(diagnosticsJson);
  
  // Filtrar apenas erros (severity === 1)
  const errors = diagnostics.filter((d: any) => d.severity === 1);
  
  // Atualizar Logger component
  updateLogger(errors);
}

// Chamar após mudanças de texto
function handleTextChange(text: string): void {
  validateCode(editor, text);
}
```

## File System Access API

### Abrir Diretório

```typescript
const fileSystem = new FileSystemAccess();

// Verificar se API está disponível
if (!FileSystemAccess.is_available()) {
  console.warn('File System Access API not supported');
  // Fallback para localStorage
  return;
}

// Abrir diretório
await fileSystem.open_directory();
```

### Listar Arquivos .junon

```typescript
// Nota: A iteração de diretórios é melhor feita no JavaScript
// devido à complexidade do AsyncIterator em Rust/WASM

async function listJunonFiles(directoryHandle: FileSystemDirectoryHandle): Promise<string[]> {
  const files: string[] = [];
  
  for await (const [name, handle] of directoryHandle.entries()) {
    if (handle.kind === 'file' && name.endsWith('.junon')) {
      files.push(name);
    }
  }
  
  return files.sort();
}
```

### Ler Arquivo

```typescript
const content = await fileSystem.read_file('main.junon');
editor.set_text(content);
```

### Salvar Arquivo

```typescript
const content = editor.get_text();
await fileSystem.save_file('main.junon', content);
```

## LSP Integration

### Conectar com Servidor LSP via WebSocket

```typescript
const lspClient = new LspClient('ws://localhost:8080/lsp');

// Conectar
lspClient.connect();

// Enviar requisição de inicialização
const initParams = JSON.stringify({
  processId: null,
  rootUri: 'file:///workspace',
  capabilities: {
    textDocument: {
      completion: { dynamicRegistration: true },
      hover: { dynamicRegistration: true }
    }
  }
});

lspClient.send_request('initialize', initParams, (response) => {
  const result = JSON.parse(response);
  console.log('LSP initialized:', result);
  
  // Enviar notificação de inicialização completa
  lspClient.send_notification('initialized', '{}');
});

// Enviar mudanças de documento
function sendDocumentChange(uri: string, text: string): void {
  const params = JSON.stringify({
    textDocument: {
      uri: uri,
      version: 1
    },
    contentChanges: [{
      text: text
    }]
  });
  
  lspClient.send_notification('textDocument/didChange', params);
}
```

### Receber Diagnostics do LSP

```typescript
// Configurar handler para diagnostics
// (Isso requer implementação adicional no lado Rust)

// Por enquanto, usar validação local .junon
const diagnostics = editor.get_diagnostics();
const errors = JSON.parse(diagnostics).filter((d: any) => d.severity === 1);
```

## MDX Autocomplete

### Carregar Índice MDX

```typescript
// No build time do Astro, gerar índice JSON de símbolos MDX
// Exemplo: scripts/generate-mdx-index.ts

const mdxIndex = {
  commands: ['/chat', '/give', '/heal', /* ... */],
  triggers: ['onPlayerJoin', 'onPlayerLeave', /* ... */],
  functions: ['$getHealth', '$getScore', /* ... */],
  variables: ['$player', '$health', /* ... */]
};

// Salvar como public/mdx-index.json

// No componente React
const autocompleteManager = new AutocompleteManager();

// Carregar índice
const mdxIndexResponse = await fetch('/mdx-index.json');
const mdxIndexJson = await mdxIndexResponse.text();
autocompleteManager.load_mdx_index(mdxIndexJson);
```

### Obter Sugestões

```typescript
function getSuggestions(prefix: string, context: string): string[] {
  const suggestionsJson = autocompleteManager.get_suggestions(prefix, context);
  return JSON.parse(suggestionsJson);
}

// Exemplo de uso
const suggestions = getSuggestions('/cha', '@trigger PlayerJoined\n    @commands\n        /');
// Retorna: ['/chat', '/change', ...]
```

## Integração com TemporaryFilesClient

### Manter Compatibilidade

```typescript
// Wrapper para manter compatibilidade com sistema existente
class MakepadEditorWrapper {
  private editor: WasmEditor;
  private fileSystem: FileSystemAccess | null = null;
  
  constructor() {
    this.editor = WasmEditor.new_junon();
  }
  
  async openDirectory(): Promise<void> {
    if (FileSystemAccess.is_available()) {
      this.fileSystem = new FileSystemAccess();
      await this.fileSystem.open_directory();
    } else {
      // Fallback para localStorage
      // Usar sistema existente do TemporaryFilesClient
    }
  }
  
  async loadFile(filename: string): Promise<void> {
    if (this.fileSystem) {
      const content = await this.fileSystem.read_file(filename);
      this.editor.set_text(content);
    } else {
      // Usar TemporaryFilesClient
      const file = getAllFiles().find(f => f.name === filename);
      if (file) {
        this.editor.set_text(file.content);
      }
    }
  }
  
  async saveFile(filename: string): Promise<void> {
    const content = this.editor.get_text();
    
    if (this.fileSystem) {
      await this.fileSystem.save_file(filename, content);
    } else {
      // Usar TemporaryFilesClient
      const file = getAllFiles().find(f => f.name === filename);
      if (file) {
        saveFile({ ...file, content });
      }
    }
  }
  
  getErrors(): any[] {
    const diagnostics = this.editor.get_diagnostics();
    const all = JSON.parse(diagnostics);
    return all.filter((d: any) => d.severity === 1); // Apenas erros
  }
}
```

## Exemplos de Código

### Componente React Completo

Veja `EXEMPLO_MakepadEditor.tsx.md` para um exemplo completo de componente React.

### Validação e Logs

```typescript
function setupValidation(editor: WasmEditor, onErrors: (errors: any[]) => void): void {
  let lastText = editor.get_text();
  
  setInterval(() => {
    const currentText = editor.get_text();
    if (currentText !== lastText) {
      lastText = currentText;
      
      // Validar
      const diagnostics = editor.validate_junon(currentText);
      const errors = JSON.parse(diagnostics).filter((d: any) => d.severity === 1);
      
      // Atualizar logs (apenas erros)
      onErrors(errors);
    }
  }, 500); // Validar a cada 500ms
}
```

## Troubleshooting

### Erro: "WASM module not found"

**Solução**: Certifique-se de que os arquivos WASM estão em `public/wasm/` e o caminho está correto no `init()`.

### Erro: "File System Access API not supported"

**Solução**: Use fallback para localStorage ou informe o usuário que precisa de Chrome/Edge.

### Erro: "Editor not initialized"

**Solução**: Chame `editor.initialize()` antes de usar outros métodos.

### Performance: Editor lento

**Soluções**:
- Reduzir frequência de validação (aumentar intervalo de polling)
- Usar Web Workers para validação
- Implementar debounce nas mudanças de texto

### Validação não funciona

**Solução**: Certifique-se de que `editor.set_language("junon")` foi chamado antes de validar.

## Próximos Passos

1. Implementar renderização visual do editor (canvas ou DOM)
2. Adicionar suporte para Tree-sitter (opcional)
3. Implementar fuzzy search avançado com `nucleo`
4. Adicionar suporte para múltiplos arquivos
5. Implementar undo/redo

## Referências

- [EXEMPLO_MakepadEditor.tsx.md](./EXEMPLO_MakepadEditor.tsx.md) - Exemplo completo de wrapper
- [BUILD_E_DEPLOY.md](./BUILD_E_DEPLOY.md) - Guia de build e deploy
- [PROPOSTA_INTEGRACAO.md](./PROPOSTA_INTEGRACAO.md) - Visão geral da proposta

