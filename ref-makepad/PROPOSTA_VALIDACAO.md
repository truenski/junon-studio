# Proposta: Validação para Linguagem .junon

## Visão Geral

Este documento descreve a especificação do sistema de validação para a linguagem `.junon` implementado em Rust no editor Makepad.

## Objetivos da Validação

1. **Detectar erros de sintaxe** em tempo real
2. **Validar estrutura de blocos** (@trigger, @commands, @if, etc.)
3. **Verificar parênteses** e funções
4. **Validar variáveis** e funções
5. **Exibir apenas erros** (não avisos ou informações)

## Tipos de Erros Validados

### 1. Parênteses Não Correspondentes

**Erro**: Parênteses de abertura sem fechamento ou vice-versa

**Exemplo:**
```junon
@trigger Test
    /chat $func(hello  // Erro: parêntese não fechado
```

**Mensagem**: `"Unmatched opening parenthesis"` ou `"Unmatched closing parenthesis"`

### 2. Parênteses sem Função

**Erro**: Parêntese de abertura que não está associado a uma função

**Exemplo:**
```junon
@trigger Test
    /chat (hello)  // Erro: parêntese sem função
```

**Mensagem**: `"Parenthesis without function. Use $functionName(...) format."`

### 3. Ações Fora de @trigger

**Erro**: Comandos, @commands, @if, ou @timer fora de um bloco @trigger

**Exemplo:**
```junon
@commands  // Erro: @commands fora de @trigger
    /chat Hello
```

**Mensagem**: `"Actions must be inside a @trigger block"`

### 4. @event Deprecated

**Erro**: Uso de @event (deprecated)

**Exemplo:**
```junon
@event PlayerJoined  // Erro: @event deprecated
```

**Mensagem**: `"@event is deprecated. Specify events in @trigger (e.g., @trigger onPlayerJoin)"`

### 5. elseif Deprecated

**Erro**: Uso de elseif (deprecated)

**Exemplo:**
```junon
@if player.health == 100
    then /chat Full
    elseif player.health != 100  // Erro: elseif deprecated
```

**Mensagem**: `"elseif is deprecated. Use \"else @if condition\" instead"`

## Estrutura da Validação

### Função Principal

```rust
pub fn validate_junon_code(code: &str) -> Vec<ValidationError>
```

### Estrutura de Erro

```rust
pub struct ValidationError {
    pub line: usize,        // Linha do erro (0-indexed)
    pub column: usize,      // Coluna do erro (0-indexed)
    pub length: usize,      // Comprimento do erro
    pub message: String,    // Mensagem de erro
}
```

### Conversão para Diagnostics

```rust
pub fn validation_errors_to_diagnostics(
    errors: Vec<ValidationError>
) -> Vec<Diagnostic>
```

Converte erros de validação para o formato `Diagnostic` usado pelo sistema LSP, permitindo integração com decorações do editor.

## Algoritmo de Validação

### 1. Validação de Parênteses

1. **Extrair funções**: Identifica todas as chamadas de função `$func(...)`
2. **Mapear parênteses**: Marca parênteses que pertencem a funções
3. **Verificar correspondência**: Verifica se todos os parênteses têm correspondente
4. **Verificar função**: Verifica se parênteses de abertura estão associados a funções

### 2. Validação de Estrutura de Blocos

1. **Rastrear contexto**: Mantém estado de `in_trigger` e indentação
2. **Validar @trigger**: Verifica se ações estão dentro de @trigger
3. **Validar indentação**: Verifica se blocos estão corretamente indentados
4. **Validar deprecated**: Detecta uso de @event e elseif

### 3. Extração de Funções

A função `extract_functions` identifica recursivamente todas as chamadas de função, incluindo funções aninhadas:

```rust
fn extract_functions(text: &str) -> Vec<ExtractedFunction>
```

**Algoritmo:**
1. Procura por `$` seguido de identificador
2. Verifica se é seguido por `(`
3. Encontra parêntese de fechamento correspondente
4. Recursivamente processa argumentos da função

## Exemplos de Validação

### Exemplo 1: Código Válido

```junon
@trigger PlayerJoined
    @commands
        /chat Welcome $player!
        /give sword 1
    @if player.health == 100
        then /chat Player is at full health
        else /heal player
```

**Resultado**: Nenhum erro

### Exemplo 2: Parêntese Não Fechado

```junon
@trigger Test
    /chat $func(hello
```

**Erros**:
- Linha 1, coluna 20: `"Unmatched opening parenthesis"`

### Exemplo 3: Ação Fora de @trigger

```junon
@commands
    /chat Hello
```

**Erros**:
- Linha 0, coluna 0: `"Actions must be inside a @trigger block"`

### Exemplo 4: @event Deprecated

```junon
@event PlayerJoined
    @commands
        /chat Hello
```

**Erros**:
- Linha 0, coluna 0: `"@event is deprecated. Specify events in @trigger (e.g., @trigger onPlayerJoin)"`
- Linha 1, coluna 0: `"Actions must be inside a @trigger block"`

## Integração com Editor

### Sistema de Decorações

Os erros são convertidos para `Diagnostic` e integrados com o sistema de decorações do editor:

```rust
let errors = validate_junon_code(code);
let diagnostics = validation_errors_to_diagnostics(errors);
// Integrar diagnostics com sistema de decorações
```

### Exibição Visual

- **Sublinhado vermelho**: Indica erro na linha
- **Tooltip**: Mostra mensagem de erro ao passar o mouse
- **Gutter**: Indicador de erro na margem esquerda

### Logs

Apenas erros são exibidos nos logs:
- **Severidade**: `Error` apenas
- **Filtro**: Avisos e informações são ignorados

## Performance

A validação é otimizada para:
- **Validação incremental**: Apenas re-valida linhas modificadas (futuro)
- **Processamento eficiente**: Usa regex apenas quando necessário
- **Cache de resultados**: Mantém resultados de validação por linha (futuro)

## Extensibilidade

A validação pode ser estendida para:
- **Validação de variáveis**: Verificar se variáveis foram declaradas
- **Validação de funções**: Verificar se funções existem
- **Validação de comandos**: Verificar se comandos são válidos
- **Validação de triggers**: Verificar se triggers são válidos

## Testes

Exemplos de código para testar a validação:

```rust
#[test]
fn test_validate_simple_code() {
    let code = "@trigger PlayerJoined\n    @commands\n        /chat Welcome";
    let errors = validate_junon_code(code);
    assert_eq!(errors.len(), 0);
}

#[test]
fn test_validate_unmatched_parenthesis() {
    let code = "@trigger Test\n    /chat $func(hello";
    let errors = validate_junon_code(code);
    assert!(errors.iter().any(|e| e.message.contains("Unmatched")));
}
```

## Referências

- [PROPOSTA_INTEGRACAO.md](./PROPOSTA_INTEGRACAO.md) - Visão geral da integração
- [PROPOSTA_JUNON_TOKENIZER.md](./PROPOSTA_JUNON_TOKENIZER.md) - Especificação do tokenizer

