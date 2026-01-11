# Proposta de Integração: Editor WASM Makepad com Linguagem .junon

## Visão Geral

Esta proposta descreve a integração do editor WASM do Makepad no projeto ref-readonly, substituindo o editor React atual e adicionando suporte completo para a linguagem `.junon` com highlighting profissional, validação em tempo real, e integração com File System Access API.

## Objetivos

1. **Substituir o editor React atual** (`CodeEditor.tsx`) pelo editor WASM do Makepad
2. **Adicionar suporte completo para .junon** com highlighting e validação
3. **Integrar File System Access API** para salvar/carregar arquivos `.junon` localmente
4. **Exibir apenas erros** nos logs de validação
5. **Manter compatibilidade** com o sistema de arquivos temporários existente

## Arquitetura Proposta

### Componentes Principais

```
ref-readonly/
├── src/
│   ├── components/
│   │   ├── MakepadEditor.tsx          # NOVO: Wrapper React/WASM
│   │   └── CodeEditorWrapper.tsx       # MODIFICAR: Usar MakepadEditor
│   └── lib/
│       └── makepadIntegration.ts      # NOVO: Helpers de integração
│
└── PROPOSTA_*.md                      # Documentação das propostas
```

### Fluxo de Dados

```
React Component (MakepadEditor)
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

## Implementação

### Fase 1: Preparação do Editor WASM

✅ **Concluído:**
- Tokenizer para .junon (`code_editor/src/junon_tokenizer.rs`)
- Validação .junon (`code_editor/src/junon_validation.rs`)
- Configuração JSON para .junon (`code_editor/src/junon_config.rs`)

### Fase 2: Compilação WASM

**Próximos Passos:**
1. Compilar `makepad-editor-wasm` com suporte .junon
2. Gerar bindings JavaScript/WASM
3. Otimizar para Workers (code splitting)

### Fase 3: Integração React

**Próximos Passos:**
1. Criar componente `MakepadEditor.tsx`
2. Carregar e inicializar módulo WASM
3. Conectar com File System Access API
4. Integrar com `TemporaryFilesClient`

### Fase 4: Validação e Logs

**Próximos Passos:**
1. Conectar validação .junon com sistema de decorações
2. Filtrar logs para mostrar apenas erros
3. Exibir erros no componente Logger existente

## Configuração JSON para .junon

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

## Benefícios

1. **Performance**: Editor WASM é mais rápido que React para operações de texto
2. **Highlighting Profissional**: Tokenizer específico para .junon
3. **Validação em Tempo Real**: Erros detectados enquanto o usuário digita
4. **Compatibilidade**: Mantém integração com sistema existente
5. **Extensibilidade**: Fácil adicionar novas funcionalidades

## Desafios e Considerações

### Desafios Técnicos

1. **Sincronização de Estado**: Editor WASM ↔ React state
2. **Performance**: Editor responsivo com validação em tempo real
3. **File System Access API**: Gerenciar permissões e diretórios
4. **Compatibilidade de Browsers**: File System Access API não está disponível em todos os browsers

### Decisões de Design

1. **Tokenizer**: Usar regex inicialmente (mais simples), Tree-sitter depois se necessário
2. **Validação**: Portada para Rust para melhor performance
3. **Estado**: Editor WASM gerencia seu próprio estado, React apenas wrapper
4. **Arquivos**: Sempre `.junon`, gerenciados via File System Access API

## Próximos Passos

1. Compilar WASM com suporte .junon
2. Criar componente React wrapper
3. Integrar File System Access API
4. Conectar validação com decorações
5. Testar integração completa

## Referências

- [PROPOSTA_JUNON_TOKENIZER.md](./PROPOSTA_JUNON_TOKENIZER.md) - Especificação do tokenizer
- [PROPOSTA_VALIDACAO.md](./PROPOSTA_VALIDACAO.md) - Especificação da validação
- [PROPOSTA_FILE_SYSTEM.md](./PROPOSTA_FILE_SYSTEM.md) - Especificação do File System Access API

