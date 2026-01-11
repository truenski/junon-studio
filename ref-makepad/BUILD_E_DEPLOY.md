# Guia de Build e Deploy: Editor WASM Makepad

Este documento descreve como compilar, construir e fazer deploy do editor WASM Makepad com suporte para linguagem .junon.

## Pré-requisitos

### 1. Instalar Rust

```bash
# Instalar Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Usar nightly (recomendado para WASM)
rustup default nightly

# Adicionar target WASM
rustup target add wasm32-unknown-unknown
```

### 2. Instalar wasm-pack

```bash
# Instalar wasm-pack
cargo install wasm-pack

# Verificar instalação
wasm-pack --version
```

### 3. Verificar Dependências

```bash
cd /path/to/makepad
cargo check -p makepad-editor-wasm
```

## Compilação

### Build Básico

```bash
cd makepad-editor-wasm

# Compilar para web
wasm-pack build --target web --out-dir pkg
```

### Build Otimizado (Produção)

```bash
# Build com otimizações
wasm-pack build --target web --out-dir pkg --release

# Com compressão adicional (opcional)
wasm-pack build --target web --out-dir pkg --release
wasm-opt -Os pkg/makepad_editor_wasm_bg.wasm -o pkg/makepad_editor_wasm_bg.wasm
```

### Build com Features Específicas

```bash
# Se precisar de features específicas do code_editor
wasm-pack build --target web --out-dir pkg -- --features tree-sitter
```

## Estrutura de Arquivos Gerados

Após o build, você terá em `makepad-editor-wasm/pkg/`:

```
pkg/
├── makepad_editor_wasm.js          # Bindings JavaScript
├── makepad_editor_wasm_bg.wasm     # Módulo WASM compilado
├── makepad_editor_wasm.d.ts        # TypeScript definitions
├── package.json                    # Metadados do pacote
└── README.md                       # Documentação gerada
```

## Integração no Projeto Astro

### 1. Copiar Arquivos

```bash
# Criar diretório
mkdir -p ref-readonly/public/wasm

# Copiar arquivos WASM
cp makepad-editor-wasm/pkg/*.js ref-readonly/public/wasm/
cp makepad-editor-wasm/pkg/*.wasm ref-readonly/public/wasm/

# Copiar types para src
cp makepad-editor-wasm/pkg/*.d.ts ref-readonly/src/lib/
```

### 2. Configurar Astro

```javascript
// astro.config.mjs
export default {
  // ...
  vite: {
    optimizeDeps: {
      exclude: ['makepad-editor-wasm']
    },
    server: {
      fs: {
        allow: ['..'] // Permitir acesso a arquivos fora do projeto
      }
    }
  }
};
```

### 3. Configurar TypeScript

```json
// tsconfig.json
{
  "compilerOptions": {
    "types": ["./src/lib/makepad_editor_wasm.d.ts"]
  }
}
```

## Otimizações para Produção

### 1. Code Splitting com Web Workers

```typescript
// Criar worker para validação
// public/workers/validation.worker.ts
import init, { WasmEditor } from '/wasm/makepad_editor_wasm.js';

await init('/wasm/makepad_editor_wasm_bg.wasm');

self.onmessage = async (e) => {
  const { code } = e.data;
  const editor = WasmEditor.new_junon();
  editor.initialize(code, 'file:///temp.junon');
  const diagnostics = editor.validate_junon(code);
  self.postMessage({ diagnostics: JSON.parse(diagnostics) });
};
```

### 2. Lazy Loading do WASM

```typescript
// Carregar WASM apenas quando necessário
let wasmPromise: Promise<void> | null = null;

export async function loadWasmLazy(): Promise<void> {
  if (!wasmPromise) {
    wasmPromise = import('/wasm/makepad_editor_wasm.js').then(m => 
      m.default('/wasm/makepad_editor_wasm_bg.wasm')
    );
  }
  return wasmPromise;
}
```

### 3. Compressão

```bash
# Comprimir WASM com gzip
gzip -k -9 pkg/makepad_editor_wasm_bg.wasm

# Servir com Content-Encoding: gzip no servidor
```

## Scripts de Build

### package.json (ref-readonly)

```json
{
  "scripts": {
    "build:wasm": "cd ../makepad-editor-wasm && wasm-pack build --target web --out-dir pkg --release",
    "copy:wasm": "cp ../makepad-editor-wasm/pkg/*.js public/wasm/ && cp ../makepad-editor-wasm/pkg/*.wasm public/wasm/",
    "build:all": "npm run build:wasm && npm run copy:wasm && npm run build"
  }
}
```

## Deploy

### Vercel/Netlify

1. Adicione os arquivos WASM ao repositório ou use build step
2. Configure headers para servir WASM corretamente:

```json
// vercel.json ou netlify.toml
{
  "headers": [
    {
      "source": "/wasm/*.wasm",
      "headers": [
        {
          "key": "Content-Type",
          "value": "application/wasm"
        }
      ]
    }
  ]
}
```

### Servidor Próprio

```nginx
# nginx.conf
location /wasm/ {
    add_header Content-Type application/wasm;
    add_header Cross-Origin-Embedder-Policy require-corp;
    add_header Cross-Origin-Opener-Policy same-origin;
}
```

## Troubleshooting

### Erro: "Failed to compile to WASM"

**Solução**: Verifique se todas as dependências estão disponíveis para WASM:

```bash
cargo check --target wasm32-unknown-unknown -p makepad-editor-wasm
```

### Erro: "Module not found" no navegador

**Solução**: Verifique os caminhos dos arquivos e se estão sendo servidos corretamente.

### Erro: "SharedArrayBuffer is not defined"

**Solução**: Configure headers CORS corretamente (veja seção Deploy).

### WASM muito grande

**Soluções**:
- Usar `wasm-opt` para otimizar
- Habilitar compressão gzip/brotli
- Code splitting com Web Workers
- Remover features não utilizadas

## Tamanho Esperado

- **Debug build**: ~5-10 MB
- **Release build**: ~1-3 MB
- **Otimizado com wasm-opt**: ~500KB-1MB
- **Com compressão gzip**: ~200-500KB

## Verificação

Após o build, verifique:

```bash
# Verificar tamanho
ls -lh pkg/*.wasm

# Verificar se compila
cargo check --target wasm32-unknown-unknown -p makepad-editor-wasm

# Testar no navegador
# Abrir console e verificar se módulo carrega
```

## Próximos Passos

1. Implementar renderização visual (canvas ou DOM)
2. Adicionar suporte para Tree-sitter (opcional)
3. Otimizar tamanho do bundle
4. Implementar code splitting avançado

## Referências

- [wasm-pack documentation](https://rustwasm.github.io/wasm-pack/)
- [WebAssembly best practices](https://web.dev/webassembly/)
- [INTEGRACAO_MAKEPAD_EDITOR.md](./INTEGRACAO_MAKEPAD_EDITOR.md) - Documentação de integração

