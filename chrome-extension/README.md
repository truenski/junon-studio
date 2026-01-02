# Junon.io Chrome Extension

Chrome extension para importar e exportar código do Junon Code Editor para command blocks no junon.io.

> **Nota**: Esta é uma solução temporária. Em breve, a extensão estará disponível na Chrome Web Store para instalação com um clique.

## Instalação

### Passo 1: Preparar a Extensão

1. Extraia todos os arquivos desta pasta `chrome-extension/` para um local de fácil acesso no seu computador
2. Certifique-se de que todos os arquivos estão presentes:
   - `manifest.json`
   - `popup.html`
   - `popup.js`
   - `content.js`
   - `background.js`
   - `junon_automation.js`
   - Pasta `icons/` com os ícones

### Passo 2: Instalar no Chrome

1. Abra o Google Chrome
2. Vá para `chrome://extensions/` (ou Menu → Mais ferramentas → Extensões)
3. Ative o **"Modo do desenvolvedor"** (Developer mode) no canto superior direito
4. Clique em **"Carregar sem compactação"** (Load unpacked)
5. Selecione a pasta `chrome-extension/` que você extraiu
6. A extensão deve aparecer na lista de extensões instaladas

### Passo 3: Verificar Instalação

- Você deve ver o ícone da extensão na barra de ferramentas do Chrome
- Clique no ícone para abrir o popup da extensão
- Se o popup abrir corretamente, a instalação foi bem-sucedida!

## Como Usar

### Importar Código para Junon.io

1. **Prepare seu código no Junon Code Editor**:
   - Escreva ou edite seu código no editor
   - Use o botão "Copy as JSON" para copiar o código no formato JSON

2. **Abra o junon.io**:
   - Navegue até `https://junon.io` em uma nova aba
   - Faça login na sua conta (se necessário)

3. **Use a extensão**:
   - Clique no ícone da extensão na barra de ferramentas
   - Cole o JSON no campo de texto
   - Clique em "Execute Automation"
   - A extensão automatizará a criação dos command blocks no junon.io

### Exportar Código do Junon.io

1. **Abra o junon.io**:
   - Navegue até `https://junon.io`
   - Abra o menu de command blocks (pressione 'K' ou clique no botão)

2. **Use a extensão**:
   - Clique no ícone da extensão
   - Clique em "Extract Triggers"
   - A extensão extrairá todos os triggers e ações
   - Use "Download JSON" ou "Copy to Clipboard" para salvar

## Funcionalidades

- ✅ **Importação Automática**: Converte código JSON em command blocks no junon.io
- ✅ **Extração Automática**: Extrai triggers e ações existentes do junon.io
- ✅ **Suporte Completo**: Comandos, timers, condições if/then/else
- ✅ **Barra de Progresso**: Acompanhe o progresso da importação
- ✅ **Validação**: Verifica se você está no site correto antes de executar

## Estrutura de Arquivos

- `manifest.json` - Configuração da extensão (permissões, scripts, etc.)
- `popup.html` - Interface do popup da extensão
- `popup.js` - Lógica do popup (UI, comunicação)
- `content.js` - Script injetado no junon.io (comunicação)
- `background.js` - Service worker (gerenciamento de extensão)
- `junon_automation.js` - Lógica de automação e extração
- `icons/` - Ícones da extensão (16x16, 48x48, 128x128)

## Solução de Problemas

### A extensão não aparece
- Verifique se o "Modo do desenvolvedor" está ativado
- Recarregue a página de extensões (`chrome://extensions/`)
- Verifique se todos os arquivos estão na pasta correta

### "Receiving end does not exist" erro
- Recarregue a página do junon.io (F5 ou Ctrl+R)
- Certifique-se de estar na página `junon.io` (não localhost)
- Verifique se a extensão está habilitada

### A automação não funciona
- Certifique-se de que o código JSON está no formato correto
- Verifique se o menu de command blocks está aberto no junon.io
- Tente recarregar a página do junon.io

### Os ícones não aparecem
- Verifique se os arquivos de ícone estão na pasta `icons/`
- Os ícones devem ser `.png` (16x16, 48x48, 128x128 pixels)

## Desenvolvimento

Esta extensão foi desenvolvida para automatizar a criação de command blocks no junon.io a partir do código escrito no Junon Code Editor.

### Tecnologias Utilizadas

- Chrome Extension Manifest V3
- JavaScript (ES6+)
- DOM Manipulation para automação
- Chrome Storage API para comunicação

## Nota Importante

**Esta é uma solução temporária**. A extensão será publicada na Chrome Web Store em breve, permitindo instalação com um clique sem necessidade de modo desenvolvedor.

Para atualizações e suporte, visite o repositório do projeto.
