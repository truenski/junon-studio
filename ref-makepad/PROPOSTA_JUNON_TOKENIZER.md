# Proposta: Tokenizer para Linguagem .junon

## Visão Geral

Este documento descreve a especificação do tokenizer para a linguagem `.junon` implementado em Rust no editor Makepad.

## Linguagem .junon

### Estrutura da Linguagem

A linguagem `.junon` é uma linguagem de script baseada em blocos com indentação (4 espaços) que define triggers e ações para eventos de jogo.

### Tokens Suportados

#### 1. Keywords (Palavras-chave)

- `@trigger` - Define um trigger de evento
- `@commands` - Bloco de comandos
- `@if` - Condição condicional
- `@timer` - Timer com nome, duração e tick
- `@event` - Deprecated, deve usar `@trigger`

**Mapeamento**: `TokenKind::OtherKeyword`

#### 2. Control Words (Palavras de Controle)

- `then` - Cláusula then para @if
- `else` - Cláusula else para @if
- `elseif` - Deprecated, deve usar `else @if`

**Mapeamento**: `TokenKind::BranchKeyword`

#### 3. Commands (Comandos)

Comandos começam com `/` seguido de um identificador:
- `/chat` - Enviar mensagem no chat
- `/give` - Dar item ao jogador
- `/heal` - Curar jogador
- `/variable set` - Definir variável

**Mapeamento**: `TokenKind::Function`

#### 4. Functions (Funções)

Funções começam com `$` seguido de identificador e parênteses:
- `$getHealth()` - Obter saúde do jogador
- `$getScore()` - Obter pontuação
- `$getGold()` - Obter ouro

**Mapeamento**: `TokenKind::Function`

#### 5. Variables (Variáveis)

Variáveis começam com `$` seguido de identificador (sem parênteses):
- `$player` - Variável do jogador
- `$health` - Variável de saúde
- `$score` - Variável de pontuação

**Mapeamento**: `TokenKind::Identifier`

#### 6. Operators (Operadores)

- `==` - Igualdade
- `!=` - Desigualdade
- `<=` - Menor ou igual
- `>=` - Maior ou igual
- `<` - Menor que
- `>` - Maior que

**Mapeamento**: `TokenKind::Punctuator`

#### 7. Conditions (Condições)

Padrão: `identifier.identifier`
- `player.health` - Saúde do jogador
- `player.score` - Pontuação do jogador
- `player.team` - Time do jogador

**Mapeamento**: `TokenKind::Constant`

#### 8. Numbers (Números)

Números inteiros e decimais:
- `100` - Inteiro
- `5000` - Inteiro
- `3.14` - Decimal

**Mapeamento**: `TokenKind::Number`

#### 9. Strings (Strings)

Strings delimitadas por aspas duplas:
- `"Welcome to the game!"` - String simples
- `"Hello \"world\""` - String com escape

**Mapeamento**: `TokenKind::String`

#### 10. Comments (Comentários)

Comentários de linha começam com `//`:
- `// This is a comment` - Comentário de linha

**Mapeamento**: `TokenKind::Comment`

#### 11. Whitespace (Espaços em Branco)

Espaços, tabs e quebras de linha:
- Espaços e tabs são agrupados
- Quebras de linha são tratadas separadamente

**Mapeamento**: `TokenKind::Whitespace`

## Implementação

### Estrutura do Tokenizer

O tokenizer `JunonTokenizer` segue o mesmo padrão do `Tokenizer` existente:

```rust
pub struct JunonTokenizer {
    state: Vec<Option<(State, State)>>,
}
```

### Estados do Tokenizer

1. **InitialState**: Estado inicial, processa todos os tipos de tokens
2. **DoubleQuotedStringTailState**: Processa strings delimitadas por aspas duplas

### Algoritmo de Tokenização

1. **Início**: Começa no `InitialState`
2. **Reconhecimento**: Identifica o primeiro caractere e decide o tipo de token
3. **Extração**: Extrai o token completo baseado nas regras
4. **Transição**: Move para o próximo estado (geralmente volta para `InitialState`)
5. **Repetição**: Continua até o fim da linha

### Exemplo de Tokenização

**Código:**
```junon
@trigger PlayerJoined
    @commands
        /chat Welcome $player!
```

**Tokens gerados:**
1. `@trigger` - `OtherKeyword`
2. ` ` - `Whitespace`
3. `PlayerJoined` - `Identifier`
4. `\n` - `Whitespace`
5. `    ` - `Whitespace` (indentação)
6. `@commands` - `OtherKeyword`
7. `\n` - `Whitespace`
8. `        ` - `Whitespace` (indentação)
9. `/chat` - `Function` (command)
10. ` ` - `Whitespace`
11. `Welcome` - `Identifier`
12. ` ` - `Whitespace`
13. `$player` - `Identifier` (variable)
14. `!` - `Punctuator`

## Diferenciação entre Functions e Variables

A diferenciação é feita verificando se após o identificador há um `(`:

```rust
fn function_or_variable(self, cursor: &mut Cursor) -> (State, TokenKind) {
    cursor.skip(1); // Skip $
    while cursor.skip_if(|ch| ch.is_identifier_continue() || ch == '_') {}
    
    if cursor.peek(0) == '(' {
        TokenKind::Function  // É uma função
    } else {
        TokenKind::Identifier  // É uma variável
    }
}
```

## Diferenciação entre Identifiers e Conditions

Conditions seguem o padrão `identifier.identifier`:

```rust
fn identifier_or_condition(self, cursor: &mut Cursor) -> (State, TokenKind) {
    // Lê primeiro identificador
    while cursor.skip_if(|ch| ch.is_identifier_continue() || ch == '_') {}
    
    // Verifica se é seguido por .identifier
    if cursor.peek(0) == '.' {
        cursor.skip(1); // Skip .
        if cursor.peek(0).is_identifier_start() {
            // Lê segundo identificador
            while cursor.skip_if(|ch| ch.is_identifier_continue() || ch == '_') {}
            TokenKind::Constant  // É uma condição
        } else {
            TokenKind::Identifier
        }
    } else {
        TokenKind::Identifier
    }
}
```

## Cores de Syntax Highlighting

As cores são mapeadas através do `TokenColors` no editor:

- **Keywords**: `#C485BE` (roxo)
- **Commands**: `#5B9BD3` (azul)
- **Functions**: `#fffcc9` (amarelo claro)
- **Variables**: `#D4D4D4` (cinza claro)
- **Operators**: `#D4D4D4` (cinza claro)
- **Numbers**: `#B6CEAA` (verde claro)
- **Conditions**: `#56C9B1` (ciano)
- **Strings**: `#CC917B` (laranja)
- **Comments**: `#638D54` (verde escuro)

## Performance

O tokenizer é otimizado para:
- **Tokenização incremental**: Apenas re-tokeniza linhas modificadas
- **Cache de estados**: Mantém estado de tokenização por linha
- **Processamento eficiente**: Usa cursor para evitar alocações desnecessárias

## Testes

Exemplos de código para testar o tokenizer:

```junon
@trigger PlayerJoined
    @commands
        /chat Welcome to the game!
        /give sword 1
    @if player.health == 100
        then /chat Player is at full health
        elseif player.health != 100
        then /heal player
    @timer GameTimer 5000 1000
        /chat 5 seconds passed
```

## Referências

- [PROPOSTA_INTEGRACAO.md](./PROPOSTA_INTEGRACAO.md) - Visão geral da integração
- [PROPOSTA_VALIDACAO.md](./PROPOSTA_VALIDACAO.md) - Especificação da validação

