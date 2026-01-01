# Junon.io Chrome Extension

Chrome extension para importar código do Junon Code Editor para command blocks no junon.io.

## Instalação

1. Abra o Chrome e vá para `chrome://extensions/`
2. Ative o "Modo do desenvolvedor" (Developer mode)
3. Clique em "Carregar sem compactação" (Load unpacked)
4. Selecione a pasta `chrome-extension/`

## Uso

1. Abra o Junon Code Editor (localhost:8080)
2. Abra o junon.io em outra aba
3. Clique no ícone da extensão
4. Clique em "Sync from Editor" para sincronizar seus arquivos e snippets
5. Selecione um arquivo ou snippet da lista
6. Clique em "Import to Junon.io"
7. A extensão automatizará a criação dos command blocks

## Estrutura

- `manifest.json` - Configuração da extensão
- `popup.html/js/css` - Interface do popup
- `content.js` - Script de automação no junon.io
- `editor-sync.js` - Script de sincronização do editor local
- `background.js` - Service worker
- `parser.js` - Parser de código Junon

## Desenvolvimento

A extensão precisa de ícones. Crie ícones de 16x16, 48x48 e 128x128 pixels na pasta `icons/`.

