# Guia de Desenvolvimento do EasyBlox

## 1. Visão do projeto

O EasyBlox será um software gratuito de programação em blocos desenvolvido pela EasyMaker Robótica Educacional.

### Produtos

- **EasyBlox:** software desktop para Windows, baseado no Scratch Editor.
- **EasyConect:** aplicativo Android de controle e monitoramento por Bluetooth.
- **Placas iniciais:** Arduino UNO e ESP32.
- **Perfis de hardware: EasyMaker e EasyDuino.**

## 2. Objetivos iniciais

O EasyBlox deverá permitir:

- programação visual em blocos;
- geração de código Arduino C/C++;
- compilação e gravação no Arduino UNO e ESP32;
- seleção dos perfis das placas EasyMaker;
- comunicação com o aplicativo EasyConect;
- funcionamento gratuito para os usuários.

O EasyConect será um controle remoto semelhante em funcionalidade ao Dabble, mas com interface, protocolo e implementação próprios da EasyMaker.

## 3. Comunicação Bluetooth

Nas placas EasyMaker, o módulo HC-06 utiliza:

| Arduino | Função | HC-06 |
|---|---|---|
| D2 | RX do Arduino | TX do HC-06 |
| D3 | TX do Arduino | RX do HC-06 |

Velocidade inicial planejada:

```text
9600 baud
```

O aplicativo utilizará Bluetooth Classic com comunicação serial SPP/RFCOMM.

## 4. Ambiente validado

- Windows 11 — 64 bits
- Visual Studio Code em inglês
- Node.js 24.19.0 — 64 bits
- npm 11.17.0
- Git 2.55.0
- Arduino IDE instalado
- Memória RAM: 16 GB ou mais

## 5. Repositório

Repositório oficial do projeto:

```text
https://github.com/easymakerbrasil/easyblox
```

Pasta local:

```text
C:\Users\EasyMaker\source\EasyMakerDev\easyblox
```

Remotos configurados:

```text
origin   https://github.com/easymakerbrasil/easyblox.git
upstream https://github.com/scratchfoundation/scratch-editor.git
```

Branch principal de desenvolvimento:

```text
easyblox-dev
```
A easyblox-dev deve permanecer estável e receber apenas alterações previamente desenvolvidas, testadas e aprovadas.

Novos recursos e alterações isoláveis devem ser desenvolvidos em branches próprias, como feat/whiz-default-sprite.

A integração dessas branches em easyblox-dev somente deve ocorrer após os testes técnicos e funcionais e a aprovação do recurso.

Tag da base original funcional:

```text
easyblox-baseline-v0.0.0
```

## 6. Instalação das dependências no Windows

No Windows, a instalação comum apresentou conflito entre instalações simultâneas do pacote `canvas`.

O comando validado foi:

```cmd
npm ci --foreground-scripts --cache "%LOCALAPPDATA%\EasyBloxNpmCacheSerial"
```

Não executar automaticamente:

```cmd
npm audit fix
npm audit fix --force
npm approve-scripts
npm install -g npm@12.0.2
```

Esses comandos podem alterar dependências importantes e quebrar a base do projeto.

## 7. Executando o ambiente de desenvolvimento

Abrir o terminal na raiz do projeto e executar:

```cmd
set NODE_OPTIONS=--max-old-space-size=8192
npm start
```

O terminal precisa permanecer aberto enquanto o EasyBlox estiver funcionando.

Para encerrar o servidor:

```text
Ctrl + C
```

## 8. Situação atual

- Repositório clonado: concluído
- Branch principal `easyblox-dev` criada: concluído
- Fluxo com branches exclusivas para novos recursos: definido
- Dependências instaladas: concluído
- Scratch Editor executado no navegador: concluído
- Base funcional protegida com tag: concluído
- Documentação inicial: concluído
- Compatibilidade da compilação com Windows: concluído
- Identidade visual do EasyBlox: concluída
- Logo EasyBlox integrada à barra do editor: concluído
- Identidade da aba do navegador e favicon EasyBlox: concluído
- Whiz configurado como ator inicial padrão: concluído e validado
- Whiz com duas fantasias (`parado` e `passada`): concluído e validado
- Whiz disponível na biblioteca de atores: concluído e validado
- Remoção e reinserção do Whiz pela biblioteca: concluído e validado
- Salvamento e reabertura de projetos `.sb3` com o Whiz: validado
- Personalização visual da interface — marco v0.3.0 Interface Branding: concluída, integrada e validada
- Refinamento de localização e terminologia pt-BR — ciclo `feat/easyblox-ptbr-ux-refinement`: implementado, integrado em `easyblox-dev` e validado
- Correção do Action Menu herdado da base Scratch: implementada e validada no ciclo `feat/easyblox-ptbr-ux-refinement`

## 9. Compatibilidade de compilação no Windows

O script original do `scratch-gui` utilizava:

```text
BUILD_TYPE=dev webpack
```

Essa sintaxe funciona em Linux e macOS, mas não diretamente no Prompt de Comando do Windows.

O script foi corrigido para:

```text
cross-env BUILD_TYPE=dev webpack
```

A dependência `cross-env@7.0.3` já fazia parte do projeto, portanto nenhuma nova dependência precisou ser instalada.

Testes realizados:

```cmd
npm run build:dev --workspace @scratch/scratch-gui
npm run build
```

Resultado: compilação do `scratch-gui` e compilação completa do repositório concluídas com sucesso. Foram exibidos apenas avisos de tamanho de arquivos, sem erros.

## 10. Estrutura principal do projeto

- `packages/scratch-gui`: interface visual do editor;
- `packages/scratch-vm`: execução dos blocos e extensões;
- `packages/scratch-blocks`: aparência e funcionamento dos blocos;
- `packages/scratch-storage`: gerenciamento de arquivos e recursos;
- `scripts`: automações do projeto;
- `node_modules`: dependências instaladas — não editar manualmente;
- `docs`: documentação própria do EasyBlox.

## 11. Etapas planejadas

1. Preparar e documentar o ambiente.
2. Corrigir a compatibilidade da compilação no Windows.
3. Aplicar a identidade visual EasyMaker.
4. Criar os perfis EasyMaker, EasyDuino.
5. Adicionar suporte ao Arduino UNO.
6. Adicionar suporte ao ESP32.
7. Integrar o Arduino CLI.
8. Gerar código Arduino C/C++ a partir dos blocos.
9. Criar o protocolo de comunicação EasyConect.
10. Transformar o EasyBlox em aplicativo desktop instalável.
11. Desenvolver o aplicativo EasyConect para Android.
12. Testar, documentar e publicar as primeiras versões.

## 12. Identidade visual prevista

- Cor amarela: `#ffc800`
- Cor escura: `#282828`
- Marca: EasyMaker Robótica Educacional
- Nome do editor: EasyBlox
- Nome do aplicativo: EasyConect
- Slogan institucional: Mais que Robótica. Transformação Educacional.
- Fonte oficial do logotipo: BubbleGum
- Personagem principal: Whiz
- Slogan do EasyBlox: Aprender • Criar • Programar

## 13. Controle das alterações

Antes de qualquer alteração:

```cmd
git status
```

Depois de uma alteração, verificar:

```cmd
git diff
```

As alterações deverão ser registradas com mensagens claras. Recursos isoláveis devem ser desenvolvidos e enviados primeiro para sua branch própria. A integração em easyblox-dev somente deve ocorrer após testes e aprovação.

Antes de um commit importante, executar `git diff --check`.

Para alterações no `scratch-gui`, executar o lint localizado nos arquivos modificados com `npm --prefix packages\scratch-gui run test:lint -- <arquivos-alterados>`.

Depois, validar a compilação com `npm --prefix packages\scratch-gui run build:dev`.

O build deve concluir sem erros antes da integração em `easyblox-dev`.

## 14. Assets proprietários do EasyBlox

Recursos visuais próprios da EasyMaker não devem depender do CDN oficial do Scratch.

Os assets utilizados pelo projeto inicial ficam em `packages/scratch-gui/src/lib/default-project/`.

A biblioteca de atores é definida principalmente em `packages/scratch-gui/src/lib/libraries/sprites.json`.

Cadastrar um ator proprietário em `sprites.json` não garante sozinho que sua miniatura seja exibida corretamente, pois o componente padrão da biblioteca procura os assets no CDN do Scratch.

No caso do Whiz, os PNGs locais do `default-project` são importados por `packages/scratch-gui/src/containers/sprite-library.jsx` e utilizados como `rawURL` somente para a visualização da biblioteca.

Antes de enviar o Whiz ao Scratch VM, o campo `rawURL` deve ser removido. Assim, uma informação exclusiva da interface não é incorporada ao ator nem ao arquivo `.sb3`.

Não alterar globalmente o mecanismo de carregamento dos atores originais do Scratch apenas para suportar assets próprios da EasyMaker.

## 15. Validação de atores padrão e biblioteca

Ao alterar o ator inicial padrão do EasyBlox ou adicionar um ator próprio à biblioteca, validar antes da integração:

- projeto novo abre sem erros;
- nome, posição, tamanho e direção inicial estão corretos;
- todas as fantasias carregam corretamente;
- escala e centro de rotação permanecem consistentes;
- alternar fantasias não provoca saltos visuais;
- orientação `90` funciona corretamente;
- orientação `-90` funciona corretamente quando utilizado `left-right`;
- o ator pode ser removido do projeto;
- o ator pode ser adicionado novamente pela biblioteca;
- a miniatura é exibida corretamente na biblioteca;
- todas as fantasias permanecem disponíveis após a reinserção;
- atores originais do Scratch continuam disponíveis;
- o projeto pode ser salvo em `.sb3`;
- o arquivo `.sb3` pode ser reaberto mantendo ator, fantasias e programação;
- `git diff --check` não apresenta erros;
- lint dos arquivos modificados não apresenta erros relacionados à implementação;
- `build:dev` conclui com sucesso.

A integração em `easyblox-dev` somente deve acontecer depois dessa validação funcional e da aprovação do recurso.

## 16. Identidade visual da interface — marco v0.3.0

A etapa de identidade visual da interface do EasyBlox foi desenvolvida na branch:

`feat/easyblox-interface-branding`

O objetivo desta etapa foi aproximar visualmente a interface da identidade EasyMaker/EasyBlox sem alterar a arquitetura técnica do Scratch, o funcionamento dos blocos, a comunicação com hardware ou os identificadores internos necessários ao projeto.

### 16.1. Paleta adotada

A interface EasyBlox utiliza como cores institucionais principais:

- amarelo EasyBlox: `#ffc800`;
- grafite EasyBlox: `#282828`;
- branco: `#ffffff`.

No `scratch-gui`, as cores próprias da interface ficam centralizadas em:

`packages/scratch-gui/src/css/easyblox-colors.css`

Sempre que possível, novos componentes visuais do `scratch-gui` devem utilizar essas variáveis em vez de repetir códigos hexadecimais.

### 16.2. Linguagem visual adotada

Como regra geral:

- amarelo é utilizado em ações primárias de criação e confirmação;
- grafite é utilizado em controles secundários, menus, estados selecionados, destaques e ações utilitárias;
- branco é utilizado sobre fundos grafite quando necessário para contraste;
- cores semânticas, como estados destrutivos ou de alerta, não devem ser substituídas apenas por motivo de identidade visual;
- cores originais do Scratch que fazem parte de categorias, blocos ou significados funcionais não devem ser alteradas indiscriminadamente.

A identidade visual deve ser aplicada de forma seletiva, evitando substituições globais de `$looks-secondary` ou `#855CD6` sem antes identificar a função real do componente.

### 16.3. Componentes personalizados nesta etapa

O marco v0.3.0 inclui a personalização visual dos seguintes pontos da interface:

- identidade e favicon EasyBlox;
- logo e identificação visual do editor;
- botões de criação de ator e cenário;
- estados de seleção dos atores;
- menus de contexto;
- botão de extensões;
- botão "Mais" da mochila;
- pré-visualização durante arraste;
- cabeçalho, categorias, filtros, pesquisa e hover das bibliotecas;
- menus superiores;
- seletor e ícones de direção;
- botões de alternância;
- campos de entrada em foco;
- editor de áudio;
- confirmações e prompts;
- controles de tamanho do palco;
- controles de visibilidade do ator;
- abas Código, Trajes e Sons;
- cabeçalhos dos modais;
- confirmação do modal "Criar um Bloco";
- botão de conversão Bitmap/Vectorial do editor de Trajes;
- estado selecionado das ferramentas do editor de Trajes.

### 16.4. Particularidade do scratch-paint

O editor de Trajes pertence ao pacote:

`packages/scratch-paint`

O `scratch-gui` consome a versão compilada desse pacote por meio de:

`@scratch/scratch-paint`

O ponto de resolução utilizado durante o desenvolvimento é o arquivo compilado:

`packages/scratch-paint/dist/web/scratch-paint.js`

Por esse motivo, alterações realizadas em:

`packages/scratch-paint/src/`

não aparecem automaticamente na interface do EasyBlox.

Depois de modificar arquivos do `scratch-paint`, executar:

```cmd
npm --prefix packages\scratch-paint run build
```

Depois da recompilação do `scratch-paint`, validar novamente o `scratch-gui`:

```cmd
npm --prefix packages\scratch-gui run build:dev
```

Alterações em `scratch-paint` não devem ser consideradas concluídas apenas porque o código-fonte foi modificado. A versão compilada deve ser regenerada e o EasyBlox deve ser novamente testado antes de commit, integração ou tag.

### 16.5. Integração e validação final do marco v0.3.0

A feature de identidade visual foi concluída em:

```text
feat/easyblox-interface-branding
```

HEAD final aprovado da feature:

```text
81f9a9da37
```

A integração em `easyblox-dev` foi realizada por fast-forward, preservando exatamente o histórico já aprovado da feature.

Após a integração foram executadas novamente as validações técnicas:

```cmd
git diff --check origin/easyblox-dev..HEAD
npm --prefix packages\scratch-paint run build
npm --prefix packages\scratch-gui run build:dev
```

Resultados:

- `git diff --check`: aprovado;
- `scratch-paint`: compilado com sucesso com webpack 5.109.2;
- `scratch-gui build:dev`: compilado com sucesso com webpack 5.109.2;
- working tree permaneceu limpo após os builds;
- aviso de `Browserslist/caniuse-lite` permaneceu apenas informativo;
- nenhuma atualização de dependências foi realizada.

A aplicação integrada também foi executada em:

```text
http://localhost:8601/
```

A validação funcional manual confirmou:

- carregamento da tela principal;
- funcionamento das abas Código, Trajes e Sons;
- diálogo de confirmação de exclusão de ator;
- biblioteca de atores;
- biblioteca de cenários;
- biblioteca de extensões;
- menus Arquivo, Editar e Configurações;
- submenus de idioma, tema e modo de cor;
- modos de tamanho do palco;
- tela cheia;
- seletor de direção;
- modos de rotação;
- controles de mostrar e ocultar ator;
- preservação do Whiz como ator inicial.

Após os testes, `easyblox-dev` foi publicada em `origin/easyblox-dev` e a sincronização local/remota foi confirmada.

### 16.6. Pendências identificadas durante a validação

As pendências abaixo não bloqueiam o marco v0.3.0 e devem ser tratadas em ciclo posterior.

#### Localização e terminologia pt-BR

Revisar:

- `Trajes` → `Fantasias`;
- `Escolher um Actor` → `Escolher um Ator`;
- `Load from your computer` → tradução adequada em português do Brasil;
- `Descarregar para o seu computador` → avaliar `Baixar para o seu computador`;
- `Theme` → `Tema`;
- `Color Mode` → `Modo de cor`;
- `Língua` → avaliar `Idioma`;
- `Recuperar Som` → avaliar `Restaurar som`;
- `Ligar o Modo Turbo` → avaliar `Ativar modo turbo`;
- nomenclatura `Blocos de Gato`.

#### Action Menu

Ao retornar da biblioteca de atores ou cenários, o menu associado ao botão de criação permanece expandido/focado e exige um novo clique para fechar.

A análise confirmou que esse comportamento já existia antes da feature `feat/easyblox-interface-branding`. Portanto, não é regressão introduzida pelo marco v0.3.0.

A correção deverá ser desenvolvida e validada separadamente.

#### Mochila

A Mochila ainda apresenta apenas:

```text
Em Breve...
```

Esse comportamento também é anterior ao marco v0.3.0 e não representa regressão do branding.

A ativação funcional da Mochila deverá ser planejada em ciclo posterior.

### 16.7. Regra para fechamento do marco v0.3.0

A tag `v0.3.0` somente deve ser criada depois de:

1. atualizar `CONTINUIDADE-EASYBLOX.md` e `GUIA-DE-DESENVOLVIMENTO.md`;
2. revisar integralmente o diff documental;
3. executar `git diff --check`;
4. confirmar que somente os documentos previstos foram alterados;
5. criar e publicar o commit documental de fechamento em `easyblox-dev`;
6. confirmar que `easyblox-dev` e `origin/easyblox-dev` estão sincronizadas;
7. confirmar working tree limpo.

Somente depois dessas verificações a tag `v0.3.0` deverá ser criada e publicada no remoto.

## 17. Refinamento pt-BR e UX — ciclo pós-v0.3.0

Após o fechamento e publicação da tag `v0.3.0`, foi iniciado um novo ciclo de desenvolvimento na branch:

`feat/easyblox-ptbr-ux-refinement`

A feature foi criada exatamente a partir do checkpoint `v0.3.0`, commit `894799ac29`, sem modificar o histórico do marco aprovado.

### 17.1. Escopo do ciclo

Este ciclo trata exclusivamente de:

- refinamentos de localização e terminologia para português do Brasil;
- correções pontuais de UX identificadas durante a validação da v0.3.0;
- remoção da opção Cat Blocks da seleção de temas;
- correção do comportamento herdado do Action Menu.

Ficam explicitamente fora deste ciclo:

- implementação da Mochila;
- Arduino;
- ESP32;
- Arduino CLI;
- geração de Arduino C/C++;
- comunicação com hardware;
- EasyConect;
- desenvolvimento de novos temas visuais EasyBlox.

### 17.2. Localização automática para português do Brasil

O navegador utilizado durante a validação reportava:

```text
navigator.language = pt-PT
navigator.languages = ['pt-PT', 'pt', 'en-US', 'en']

```

Como o mecanismo original utilizava o idioma-base `pt` quando `pt-PT` não estava disponível diretamente, a interface era carregada em português europeu.

O EasyBlox passou a tratar especificamente esse cenário:

- quando o navegador reporta `pt-PT`;
- e `pt-br` está disponível entre os idiomas suportados;
- o locale automático utilizado passa a ser `pt-br`.

A seleção explícita de outros locales continua preservada.

Foi criado teste de regressão específico para garantir o comportamento `pt-PT` → `pt-br`.

### 17.3. Refinamentos locais pt-BR

Além da seleção correta de `pt-br`, o EasyBlox mantém overrides locais para textos específicos da interface que não possuíam a terminologia desejada no pacote de localização utilizado.

Foram definidos:

- `Carregar do seu computador`;
- `Modo de cor`;
- `Ativar modo turbo`;
- `Desativar modo turbo`.

Com a seleção correta do locale `pt-br`, também foram validados textos como:

- `Fantasias`;
- `Ator`;
- `Baixar para o seu computador`;
- `Idioma`.

Esses overrides ficam na camada do `scratch-gui`, sem edição direta de `node_modules` ou do pacote `scratch-l10n`.

### 17.4. Tema Cat Blocks

A opção Cat Blocks não foi renomeada.

Como o EasyBlox oferece atualmente apenas o tema padrão de blocos, a decisão do projeto foi remover o seletor de tema da interface quando não há mais de uma opção disponível.

O `themeMap` expõe somente o tema padrão ao usuário.

Preferências antigas contendo `cat-blocks` são consideradas inválidas pela persistência e fazem fallback para o tema padrão.

A compatibilidade interna necessária ao código histórico do Scratch permanece preservada onde ainda é utilizada.

### 17.5. Correção do Action Menu

O comportamento registrado durante a validação da v0.3.0 era herdado da base Scratch:

- o usuário abria a biblioteca de atores ou cenários pelo botão principal do Action Menu;
- ao retornar ao editor, o botão principal recuperava o foco;
- o evento de foco expandia novamente o Action Menu;
- o menu permanecia visualmente aberto e exigia um clique adicional para fechar.

A correção foi implementada sem remover a expansão por foco necessária à navegação por teclado.

Para a ação principal:

1. o estado expandido é encerrado;
2. o foco é removido do botão principal;
3. a ação original é executada.

As ações secundárias também fecham explicitamente o menu antes de executar sua ação.

Foram adicionados testes de regressão para:

- fechamento após ação secundária;
- fechamento após ação principal;
- remoção do foco do botão principal.

Os testes existentes de navegação por teclado continuam preservados.

### 17.6. Validação do ciclo

Checkpoint de implementação atual:

```text
84bf28568d — feat: refine pt-BR localization and theme settings
dac597eafa — fix: close action menu after selecting actions
```

Validações concluídas:

- fluxo real da biblioteca de atores testado manualmente;
- Action Menu permanece fechado ao retornar ao editor;
- navegação por teclado preservada;
- 4 suites de testes aprovadas;
- 23 testes aprovados;
- `git diff --check` aprovado;
- `scratch-gui build:dev` compilado com webpack 5.109.2 sem erros;
- nenhum arquivo gerado adicional ficou rastreado;
- nenhuma dependência foi atualizada.

O aviso de Browserslist permanece apenas informativo e não deve motivar atualização de dependências neste ciclo.

### 17.7. Mochila

A Mochila permanece exibindo:

```text
Em Breve...
```

Sua implementação funcional continua fora do escopo deste ciclo e deverá ser planejada separadamente.

### 17.8. Integração em easyblox-dev

Após a publicação e validação da branch `feat/easyblox-ptbr-ux-refinement`, a feature foi integrada em `easyblox-dev` por fast-forward.

Estado da integração:

```text
Base anterior de easyblox-dev: 894799ac29 — v0.3.0
HEAD integrado: b70a3bf7d7
Método de integração: fast-forward
Merge commit adicional: não
```

Os três commits integrados foram:

```text
84bf28568d — feat: refine pt-BR localization and theme settings
dac597eafa — fix: close action menu after selecting actions
b70a3bf7d7 — docs: document pt-BR UX refinement cycle
```

Após a integração, as validações foram repetidas diretamente em `easyblox-dev`.

Resultados:

- 4 suites de testes aprovadas;
- 23 testes aprovados;
- `scratch-gui build:dev` compilado com webpack 5.109.2 sem erros;
- nenhum arquivo gerado adicional ficou rastreado;
- working tree permaneceu limpo após testes e build;
- fluxo real da biblioteca de atores validado novamente;
- Action Menu permanece fechado ao retornar da biblioteca ao editor;
- navegação por teclado permanece preservada;
- interface em português do Brasil validada;
- menu Configurações validado com apenas `Idioma` e `Modo de cor`.

Antes deste checkpoint documental pós-integração, `easyblox-dev` local encontrava-se em `b70a3bf7d7`, enquanto `origin/easyblox-dev` permanecia em `894799ac29`.

A tag `v0.3.0` permanece inalterada em `894799ac29`. Nenhuma nova tag deve ser criada automaticamente como consequência desta integração.

O aviso de Browserslist continua sendo apenas informativo. Nenhuma dependência foi atualizada neste ciclo.

C:\Users\EasyMaker\source\EasyMakerDev\easyblox>node -e "const fs=require('fs');const p='docs/GUIA-DE-DESENVOLVIMENTO.md';const a=fs.readFileSync(p,'utf8').split(/\r?\n/);a.forEach((l,i)=>{if(/^#{1,3} /.test(l)||/Arduino|Serial|hardware/i.test(l))console.log(String(i+1).padStart(4,' ')+': '+l);});"
   1: # Guia de Desenvolvimento do EasyBlox
   3: ## 1. Visão do projeto
   7: ### Produtos
  11: - **Placas iniciais:** Arduino UNO e ESP32.
  12: - **Perfis de hardware:** EasyMaker, EasyDuino.
  14: ## 2. Objetivos iniciais
  19: - geração de código Arduino C/C++;
  20: - compilação e gravação no Arduino UNO e ESP32;
  27: ## 3. Comunicação Bluetooth
  31: | Arduino | Função | HC-06 |
  33: | D2 | RX do Arduino | TX do HC-06 |
  34: | D3 | TX do Arduino | RX do HC-06 |
  42: O aplicativo utilizará Bluetooth Classic com comunicação serial SPP/RFCOMM.
  44: ## 4. Ambiente validado
  51: - Arduino IDE instalado
  54: ## 5. Repositório
  92: ## 6. Instalação das dependências no Windows
  99: npm ci --foreground-scripts --cache "%LOCALAPPDATA%\EasyBloxNpmCacheSerial"
 113: ## 7. Executando o ambiente de desenvolvimento
 130: ## 8. Situação atual
 152: ## 9. Compatibilidade de compilação no Windows
 179: ## 10. Estrutura principal do projeto
 189: ## 11. Etapas planejadas
 195: 5. Adicionar suporte ao Arduino UNO.
 197: 7. Integrar o Arduino CLI.
 198: 8. Gerar código Arduino C/C++ a partir dos blocos.
 204: ## 12. Identidade visual prevista
 216: ## 13. Controle das alterações
 240: ## 14. Assets proprietários do EasyBlox
 256: ## 15. Validação de atores padrão e biblioteca
 280: ## 16. Identidade visual da interface — marco v0.3.0
 286: O objetivo desta etapa foi aproximar visualmente a interface da identidade EasyMaker/EasyBlox sem alterar a arquitetura técnica do Scratch, o funcionamento dos blocos, a comunicação com hardware ou os identificadores internos necessários ao projeto.
 288: ### 16.1. Paleta adotada
 302: ### 16.2. Linguagem visual adotada
 314: ### 16.3. Componentes personalizados nesta etapa
 341: ### 16.4. Particularidade do scratch-paint
 375: ### 16.5. Integração e validação final do marco v0.3.0
 433: ### 16.6. Pendências identificadas durante a validação
 472: ### 16.7. Regra para fechamento do marco v0.3.0
 486: ## 17. Refinamento pt-BR e UX — ciclo pós-v0.3.0
 494: ### 17.1. Escopo do ciclo
 506: - Arduino;
 508: - Arduino CLI;
 509: - geração de Arduino C/C++;
 510: - comunicação com hardware;
 514: ### 17.2. Localização automática para português do Brasil
 536: ### 17.3. Refinamentos locais pt-BR
 556: ### 17.4. Tema Cat Blocks
 568: ### 17.5. Correção do Action Menu
 595: ### 17.6. Validação do ciclo
 618: ### 17.7. Mochila
 628: ### 17.8. Integração em easyblox-dev

C:\Users\EasyMaker\source\EasyMakerDev\easyblox>node -e "const fs=require('fs');const p='docs/GUIA-DE-DESENVOLVIMENTO.md';const a=fs.readFileSync(p,'utf8').split(/\r?\n/);a.forEach((l,i)=>{if(/^#{1,3} /.test(l)||/Arduino|Serial|hardware/i.test(l))console.log(String(i+1).padStart(4,' ')+': '+l);});"
   1: # Guia de Desenvolvimento do EasyBlox
   3: ## 1. Visão do projeto
   7: ### Produtos
  11: - **Placas iniciais:** Arduino UNO e ESP32.
  12: - **Perfis de hardware:** EasyMaker e EasyDuino.
  14: ## 2. Objetivos iniciais
  19: - geração de código Arduino C/C++;
  20: - compilação e gravação no Arduino UNO e ESP32;
  27: ## 3. Comunicação Bluetooth
  31: | Arduino | Função | HC-06 |
  33: | D2 | RX do Arduino | TX do HC-06 |
  34: | D3 | TX do Arduino | RX do HC-06 |
  42: O aplicativo utilizará Bluetooth Classic com comunicação serial SPP/RFCOMM.
  44: ## 4. Ambiente validado
  51: - Arduino IDE instalado
  54: ## 5. Repositório
  92: ## 6. Instalação das dependências no Windows
  99: npm ci --foreground-scripts --cache "%LOCALAPPDATA%\EasyBloxNpmCacheSerial"
 113: ## 7. Executando o ambiente de desenvolvimento
 130: ## 8. Situação atual
 152: ## 9. Compatibilidade de compilação no Windows
 179: ## 10. Estrutura principal do projeto
 189: ## 11. Etapas planejadas
 195: 5. Adicionar suporte ao Arduino UNO.
 197: 7. Integrar o Arduino CLI.
 198: 8. Gerar código Arduino C/C++ a partir dos blocos.
 204: ## 12. Identidade visual prevista
 216: ## 13. Controle das alterações
 240: ## 14. Assets proprietários do EasyBlox
 256: ## 15. Validação de atores padrão e biblioteca
 280: ## 16. Identidade visual da interface — marco v0.3.0
 286: O objetivo desta etapa foi aproximar visualmente a interface da identidade EasyMaker/EasyBlox sem alterar a arquitetura técnica do Scratch, o funcionamento dos blocos, a comunicação com hardware ou os identificadores internos necessários ao projeto.
 288: ### 16.1. Paleta adotada
 302: ### 16.2. Linguagem visual adotada
 314: ### 16.3. Componentes personalizados nesta etapa
 341: ### 16.4. Particularidade do scratch-paint
 375: ### 16.5. Integração e validação final do marco v0.3.0
 433: ### 16.6. Pendências identificadas durante a validação
 472: ### 16.7. Regra para fechamento do marco v0.3.0
 486: ## 17. Refinamento pt-BR e UX — ciclo pós-v0.3.0
 494: ### 17.1. Escopo do ciclo
 506: - Arduino;
 508: - Arduino CLI;
 509: - geração de Arduino C/C++;
 510: - comunicação com hardware;
 514: ### 17.2. Localização automática para português do Brasil
 536: ### 17.3. Refinamentos locais pt-BR
 556: ### 17.4. Tema Cat Blocks
 568: ### 17.5. Correção do Action Menu
 595: ### 17.6. Validação do ciclo
 618: ### 17.7. Mochila
 628: ### 17.8. Integração em easyblox-dev

## 18. Fundação Arduino UNO e comunicação Serial

Início da implementação prática: agosto de 2026.

Branch de desenvolvimento:

`feat/easyblox-arduino-uno-foundation`

A prioridade deste ciclo é concluir o Arduino UNO de ponta a ponta antes de iniciar ESP32.

Ordem de trabalho atual:

1. comunicação Serial;
2. Arduino UNO como extensão nativa;
3. conexão física;
4. Modo Palco;
5. blocos Arduino;
6. geração de C++;
7. compilação;
8. Carregar/Upload;
9. validação da família EasyMaker.

As placas EasyMaker e EasyDuino deverão utilizar a base Arduino UNO. ESP32/EasyMaker Conect será tratado somente em ciclo posterior.

### 18.1. Arquitetura Serial

A infraestrutura Serial compartilhada está em:

`packages/scratch-vm/src/io/serial.js`

Regra arquitetural:

```text
ArduinoUnoPeripheral
        ↓
Serial
        ↓
Serial Transport
        ↓
implementação da plataforma

O scratch-vm não deve importar diretamente:

Web Serial;
navigator.serial;
Electron;
bibliotecas Node de porta serial;
implementações específicas da plataforma.

A plataforma injeta uma factory através de:

vm.configureSerialTransportFactory(factory);

O Runtime disponibiliza:

runtime.getSerialTransport();
runtime.configureSerialTransportFactory(factory);

Cada periférico pode possuir sua própria instância de transporte.

### 18.2. Arduino UNO Peripheral

A implementação está em:

packages/scratch-vm/src/extensions/scratch3_arduino_uno/
├── index.js
└── peripheral.js

Responsabilidades:

index.js

classe da extensão Scratch;
metadata;
futuros blocos Arduino;
semântica Stage/Upload.

peripheral.js

conexão com a placa;
lifecycle;
futuro protocolo do Modo Palco;
parser;
estado da placa;
watchdog/reset.

O ArduinoUnoPeripheral utiliza atualmente:

baudRate: 115200

e implementa o contrato esperado pelo Runtime:

scan()
connect(peripheralId)
disconnect()
isConnected()

A extensão utiliza:

extensionId: arduinoUno

e está registrada como built-in no ExtensionManager.

### 18.3. Web Serial

A implementação Web está em:

packages/scratch-gui/src/lib/serial/web-serial-transport.js

Contrato atual:

requestPort()
open()
close()
write()
setOnData()
setOnClose()
setOnError()

O transporte trabalha com dados binários através de Uint8Array.

No Web:

usuário
→ Inicie a Busca
→ seletor Web Serial do navegador
→ porta selecionada
→ ArduinoUnoPeripheral
→ conexão

A implementação Web Serial é configurada durante a criação do VM em:

packages/scratch-gui/src/reducers/vm.ts

A implementação Desktop deverá utilizar posteriormente o mesmo contrato, mas com seu próprio adapter de porta Serial.

### 18.4. GUI e fluxo de conexão

A extensão Arduino UNO está registrada na biblioteca em:

packages/scratch-gui/src/lib/libraries/extensions/index.jsx

Configuração relevante:

extensionId: 'arduinoUno',
launchPeripheralConnectionFlow: true,
useAutoScan: false,
connectionTransport: 'serial'

A resolução platform-aware determina:

WEB
→ AutoScanningStep
→ seleção externa da porta


DESKTOP
→ ScanningStep
→ futura enumeração de portas

Não criar IDs separados como arduinoUnoWeb ou arduinoUnoDesktop.

A extensão lógica é única; somente o transporte físico depende da plataforma.

### 18.5. Validação física já aprovada

Foi realizada conexão real em navegador Chrome com uma placa compatível com Arduino UNO.

Fluxo validado:

Arduino UNO física
→ USB Serial
→ Chrome Web Serial
→ WebSerialTransport
→ Serial
→ ArduinoUnoPeripheral
→ Runtime
→ GUI EasyBlox

A porta foi apresentada pelo navegador como:

USB Serial (COM11)

Após seleção da porta, o EasyBlox apresentou corretamente o estado:

Conectado

e disponibilizou o comando:

Desconectar

Portanto, a base de conexão física Web Serial está funcional.

### 18.6. Testes da fundação

Testes atuais:

scratch-vm Serial:
23 asserts aprovados


ArduinoUnoPeripheral:
13 asserts aprovados


WebSerialTransport:
7 testes aprovados

Durante o desenvolvimento foi identificado um loop infinito no _readLoop() do Web Serial quando reader.read() retornava done: true.

O problema foi corrigido antes da integração com hardware real.

### 18.7. Regra de rebuild do scratch-vm

Quando uma API pública do scratch-vm for alterada, por exemplo:

VirtualMachine
Runtime
ExtensionManager

pode ser necessário recompilar o workspace:

npm --workspace @scratch/scratch-vm run build

Após alterações desse tipo, se o dev-server estiver mantendo bundle/HMR anterior, reiniciá-lo antes da validação manual.

Esse comportamento foi confirmado quando a GUI inicialmente apresentou:

defaultVM.configureSerialTransportFactory is not a function

apesar de o código-fonte já possuir o método.

Após rebuild do scratch-vm e reinicialização limpa do dev-server, a GUI carregou corretamente.

### 18.8. Próximo desenvolvimento

O próximo objetivo é o Modo Palco da Arduino UNO.

A implementação deverá avançar nesta ordem:

protocolo mínimo EasyBlox ↔ Arduino UNO;
framing e parser;
inicialização do protocolo após conexão;
primeiro comando digital;
primeiro bloco Arduino funcional;
teste real do comando na placa;
leitura digital e analógica;
PWM;
tone e demais recursos.

Não iniciar Arduino CLI, geração de C++ ou ESP32 enquanto o fluxo básico do Modo Palco ainda não estiver validado com hardware real.

## 19. Protocolo Stage Arduino UNO

O Modo Palco da Arduino UNO utiliza um protocolo binário próprio do EasyBlox sobre a infraestrutura Serial compartilhada.

Esta seção complementa a seção 18 e registra as decisões arquiteturais permanentes estabelecidas após a validação física do primeiro handshake.

### 19.1. Separação entre conexão física e conexão Stage

Não considerar uma porta Serial aberta como prova de que a placa está executando um firmware compatível com o EasyBlox.

O `ArduinoUnoPeripheral` distingue:

`isConnected()`

Indica somente que o transporte Serial está fisicamente conectado.

`isStageConnected()`

Indica que o firmware Stage respondeu corretamente ao protocolo EasyBlox.

Portanto:

porta Serial aberta
≠
Modo Palco validado.

O estado Stage somente deve ser considerado ativo após handshake válido.

### 19.2. Formato do protocolo

A implementação de referência está em:

`packages/scratch-vm/src/extensions/scratch3_arduino_uno/protocol.js`

Formato:

`FF 55 | VERSION | SEQ | COMMAND | LENGTH | PAYLOAD | CHECKSUM`

Campos:

- `0xFF 0x55`: assinatura do protocolo;
- `VERSION`: versão do protocolo;
- `SEQ`: sequence da requisição;
- `COMMAND`: comando ou resposta;
- `LENGTH`: tamanho do payload;
- `PAYLOAD`: dados específicos do comando;
- `CHECKSUM`: XOR entre `VERSION` e o último byte do payload.

Configuração inicial:

- versão: `0x01`;
- payload máximo: 32 bytes;
- sequence: 8 bits.

O protocolo trabalha exclusivamente com bytes.

Não utilizar JSON, texto delimitado, `String` Arduino ou JSONRPC para a comunicação Stage da Arduino UNO.

### 19.3. Parser incremental

O parser deve aceitar dados Serial independentemente de como o transporte divide os bytes.

Portanto, ele deve funcionar corretamente quando:

- um frame chega inteiro;
- um frame chega dividido entre vários reads;
- vários frames chegam no mesmo read;
- existem bytes de ruído antes de um frame;
- ocorre frame inválido;
- ocorre checksum inválido.

O parser deve recuperar sincronização procurando novamente a assinatura:

`0xFF 0x55`

Não assumir que cada chamada de `onData` corresponde exatamente a um frame.

### 19.4. Handshake

O handshake inicial utiliza:

`PING = 0x01`

e:

`PONG = 0x81`

O `PONG` deve preservar a mesma sequence do `PING`.

Fluxo esperado:

conexão Serial
→ estabilização da placa
→ PING
→ PONG
→ validação da sequence
→ `isStageConnected() = true`

Um PONG com sequence diferente não deve validar o handshake atual.

### 19.5. Auto-reset da Arduino UNO

Ao abrir a porta Serial, placas Arduino UNO podem reiniciar automaticamente.

Portanto, não enviar apenas um único PING imediatamente após `open()` e assumir que ele será recebido.

A configuração atualmente validada é:

- atraso inicial: 500 ms;
- intervalo de retry: 500 ms;
- máximo: 6 tentativas.

O retry deve parar imediatamente quando um PONG válido for recebido.

Ao desconectar ou resetar o estado do peripheral:

- cancelar timers pendentes;
- limpar sequence de handshake;
- limpar contador de tentativas;
- definir `isStageConnected()` novamente como falso;
- resetar o parser.

### 19.6. Firmware Stage

O firmware de referência da Arduino UNO fica em:

`packages/scratch-vm/firmware/arduino-uno/stage/stage.ino`

Manter o firmware separado do código JavaScript de `src`.

Diretrizes para o ATmega328P:

- usar buffers de tamanho fixo;
- evitar alocação dinâmica;
- evitar `String`;
- processar Serial incrementalmente;
- manter baixo consumo de SRAM;
- não bloquear o `loop()` desnecessariamente.

A compilação inicial validada para `arduino:avr:uno` utilizou aproximadamente:

- 1814 bytes de Flash;
- 191 bytes de SRAM global.

Esses números são apenas referência do firmware inicial PING/PONG e mudarão conforme novos comandos forem adicionados.

### 19.7. Comandos iniciais

IDs reservados atualmente:

Comandos:

- `0x01` — `PING`;
- `0x10` — `DIGITAL_WRITE`.

Respostas:

- `0x80` — `ACK`;
- `0x81` — `PONG`;
- `0xFF` — `ERROR`.

Ao adicionar comandos:

1. registrar o ID em `protocol.js`;
2. implementar o comportamento no firmware;
3. implementar a operação correspondente no peripheral;
4. criar ou ampliar testes;
5. validar em hardware real antes de considerar o primitive estável.

Evitar reutilizar IDs já publicados.

### 19.8. Testes mínimos do protocolo

Os testes de referência ficam em:

`packages/scratch-vm/test/unit/arduino-uno-protocol.js`

e:

`packages/scratch-vm/test/unit/arduino-uno.js`

No checkpoint inicial do Modo Palco foram aprovados:

- protocolo: 33 asserts;
- ArduinoUnoPeripheral: 26 asserts.

Os testes devem continuar cobrindo, no mínimo:

- framing;
- checksum;
- parser incremental;
- recuperação após dados inválidos;
- handshake;
- sequence;
- atraso inicial;
- retry;
- cancelamento de retry após PONG;
- reset de estado.

### 19.9. Validação física já concluída

O handshake automático foi validado em hardware real com Arduino UNO conectada por Web Serial.

Resultado observado:

`isConnected() === true`

e:

`isStageConnected() === true`

sem envio manual de PING.

Portanto, já está validado:

EasyBlox
→ ArduinoUnoPeripheral
→ protocolo Stage
→ Serial
→ WebSerialTransport
→ Web Serial
→ Arduino UNO
→ firmware Stage
→ PONG
→ parser
→ estado Stage conectado.

A seção 18.8 registra o próximo passo existente antes dessa validação e deve ser tratada como histórico.

### 19.10. Regra de rebuild durante o desenvolvimento

Alterações realizadas dentro de:

`packages/scratch-vm/src`

podem exigir rebuild antes de serem refletidas pelo `scratch-gui`.

Executar quando necessário:

`npm --workspace @scratch/scratch-vm run build`

Se o dev-server continuar utilizando bundle antigo, reiniciá-lo.

Durante a implementação do handshake, essa necessidade foi confirmada quando a GUI ainda utilizava uma versão anterior de `ArduinoUnoPeripheral`.

Não diagnosticar comportamento de hardware utilizando um bundle antigo do `scratch-vm`.

### 19.11. Arduino CLI neste estágio

O Arduino CLI já foi utilizado externamente durante o desenvolvimento para:

- compilar o firmware Stage;
- gravar o firmware na placa física;
- validar o protocolo em hardware real.

Isso não significa que o fluxo de compilação e Upload já esteja integrado ao EasyBlox.

A integração interna de:

geração C++
→ compilação
→ Upload

continua pertencendo a uma etapa posterior do ciclo Arduino UNO.

### 19.12. DIGITAL_WRITE consolidado

O primeiro primitive físico completo do Modo Palco Arduino UNO é:

`DIGITAL_WRITE = 0x10`

Formato:

`payload [PIN, VALUE]`

onde:

- `PIN` identifica o GPIO da Arduino UNO;
- `VALUE = 1` representa nível lógico ALTO;
- `VALUE = 0` representa nível lógico BAIXO.

A implementação completa passa por:

bloco EasyBlox
→ `Scratch3ArduinoUnoBlocks.digitalWrite()`
→ `ArduinoUnoPeripheral.digitalWrite()`
→ `_sendCommand()`
→ frame `DIGITAL_WRITE`
→ Serial
→ firmware Stage
→ `pinMode(pin, OUTPUT)`
→ `digitalWrite()`
→ alteração física do pino.

Arquivos principais:

`packages/scratch-vm/src/extensions/scratch3_arduino_uno/index.js`

`packages/scratch-vm/src/extensions/scratch3_arduino_uno/peripheral.js`

`packages/scratch-vm/firmware/arduino-uno/stage/stage.ino`

### 19.13. Faixa de GPIO digital da Arduino UNO

Para `DIGITAL_WRITE`, são suportados:

- D2 até D13;
- A0 até A5 usados como GPIO digital.

Mapeamento interno:

- D2–D13 → 2–13;
- A0 → 14;
- A1 → 15;
- A2 → 16;
- A3 → 17;
- A4 → 18;
- A5 → 19.

A faixa interna válida é, portanto:

`2–19`

D0 e D1 não devem ser disponibilizados para primitives comuns do Modo Palco porque são utilizados pela UART/Serial.

Pinos inferiores a 2 ou superiores a 19 devem ser rejeitados pelo peripheral e pelo firmware.

A validação deve existir nas duas camadas:

- EasyBlox/JavaScript;
- firmware Arduino.

Não confiar apenas na validação feita pelo host.

### 19.14. Terminologia de nível lógico

Na interface visual do EasyBlox utilizar:

- `ALTO`;
- `BAIXO`.

Mapeamento:

- `ALTO` → `1`;
- `BAIXO` → `0`.

Os termos técnicos `HIGH` e `LOW` continuam válidos internamente no firmware, código-fonte e documentação técnica quando necessário.

O menu visual do bloco deve apresentar a terminologia em português.

Exemplo:

`definir pino [D13] como [ALTO]`

### 19.15. Menus de pinos de extensão

Menus declarados em `getInfo()` não devem utilizar números diretamente como itens.

A infraestrutura atual do Scratch VM interpreta itens de menu como:

- strings; ou
- objetos com `text` e `value`.

Portanto, utilizar o padrão:

`{text: 'D13', value: '13'}`

e:

`{text: 'A0', value: '14'}`

Os valores do menu podem chegar ao primitive como strings.

Antes de delegar ao peripheral, converter explicitamente:

`Number(args.PIN)`

e:

`Number(args.VALUE)`

Isso mantém o peripheral trabalhando com números e permite validação rígida com `Number.isInteger()`.

### 19.16. Validação física do DIGITAL_WRITE

O primitive foi validado em hardware real pela COM11.

D13:

`definir pino [D13] como [ALTO]`

→ LED L integrado acendeu.

`definir pino [D13] como [BAIXO]`

→ LED L integrado apagou.

A0 utilizado como GPIO digital:

`definir pino [A0] como [ALTO]`

→ aproximadamente `4,92 V` medidos entre A0 e GND.

`definir pino [A0] como [BAIXO]`

→ `0 V`.

Portanto, está validado fisicamente:

bloco visual
→ Scratch VM
→ peripheral
→ protocolo Stage
→ firmware
→ GPIO real.

### 19.17. Estado atual dos testes Arduino UNO

Teste do protocolo:

`packages/scratch-vm/test/unit/arduino-uno-protocol.js`

Estado atual validado:

- 45 asserts;
- 45 pass;
- 0 fail.

Os testes do protocolo cobrem atualmente:

- cálculo de checksum XOR;
- codificação de `PING`;
- codificação de `DIGITAL_WRITE`;
- codificação de `DIGITAL_READ`;
- parsing de frames completos;
- parsing de frames recebidos em partes;
- frames consecutivos;
- recuperação após ruído;
- rejeição e recuperação após checksum inválido;
- reset do parser;
- parsing da resposta de leitura digital;
- preservação da `SEQ`;
- payload `[PIN, VALUE]`.

Teste da extensão/peripheral:

`packages/scratch-vm/test/unit/arduino-uno.js`

Estado atual validado:

- 69 asserts;
- 69 pass;
- 0 fail.

Os testes atuais cobrem também:

- registro da extensão como peripheral;
- conexão Serial em 115200 baud;
- conexão e desconexão;
- handshake `PING/PONG`;
- retry automático após auto-reset do Arduino UNO;
- envio de `DIGITAL_WRITE`;
- envio de `DIGITAL_READ`;
- bloqueio de comandos antes do handshake Stage;
- proteção de D0/D1;
- rejeição de pino acima de A5;
- rejeição de pinos digitais não inteiros;
- rejeição de valores digitais diferentes de 0/1;
- criação de leitura assíncrona;
- resolução de leitura pela resposta correspondente;
- correlação pela `SEQ`;
- bloco visual de escrita;
- bloco booleano de leitura digital;
- `BlockType.BOOLEAN`;
- conversão visual de `1` para `true`;
- conversão visual de `0` para `false`;
- menus D2–D13;
- menus A0–A5;
- terminologia ALTO/BAIXO;
- conversão de argumentos do Blockly para números;
- delegação para `ArduinoUnoPeripheral`.

### 19.18. Footprint atual do firmware Stage

Com:

- `PING/PONG`;
- `DIGITAL_WRITE`;
- `DIGITAL_READ`;

o firmware Stage foi validado para:

`arduino:avr:uno`

com:

- 2468 bytes de Flash — 7%;
- 223 bytes de SRAM global — 10%;
- 1825 bytes restantes para variáveis locais.

A inclusão do `DIGITAL_READ` aumentou o uso de Flash, mas não aumentou o consumo global de SRAM em relação ao marco anterior.

Continuar acompanhando Flash e SRAM durante toda a evolução do firmware para ATmega328P.

### 19.19. DIGITAL_READ no protocolo Stage

O segundo primitive físico completo do Arduino UNO é:

`DIGITAL_READ`

Comando:

`0x11`

Payload da requisição:

`[PIN]`

Resposta:

`0x91`

Payload da resposta:

`[PIN, VALUE]`

Onde:

- `VALUE = 0` representa nível BAIXO;
- `VALUE = 1` representa nível ALTO.

A resposta deve preservar a mesma `SEQ` da requisição.

A `SEQ` é utilizada pelo host para correlacionar uma resposta de leitura com a requisição que a originou.

Pinos digitais válidos:

- D2–D13;
- A0–A5 utilizados como GPIO digital.

Mapeamento de A0–A5:

- A0 → 14;
- A1 → 15;
- A2 → 16;
- A3 → 17;
- A4 → 18;
- A5 → 19.

Faixa interna:

`2–19`

D0 e D1 permanecem reservados para UART/Serial.

### 19.20. Leitura assíncrona no ArduinoUnoPeripheral

Arquivo:

`packages/scratch-vm/src/extensions/scratch3_arduino_uno/peripheral.js`

O método:

`digitalRead(pin)`

é assíncrono.

Ele:

1. valida se o Stage está conectado;
2. valida o pino;
3. envia `COMMANDS.DIGITAL_READ`;
4. recebe a `SEQ` utilizada pelo protocolo;
5. cria uma `Promise`;
6. armazena a leitura pendente em `_pendingDigitalReads`;
7. aguarda a resposta `RESPONSES.DIGITAL_READ`.

As leituras pendentes são associadas pela `SEQ`.

Uma resposta somente deve resolver a leitura quando:

- houver requisição pendente com a mesma `SEQ`;
- o payload tiver exatamente 2 bytes;
- o pino da resposta for igual ao pino solicitado;
- o valor for `0` ou `1`.

Depois de uma resposta válida:

- a entrada é removida de `_pendingDigitalReads`;
- a Promise é resolvida com `0` ou `1`.

Em reset ou desconexão:

- Promises pendentes devem ser resolvidas com `null`;
- `_pendingDigitalReads` deve ser limpo.

Isso evita requisições de leitura permanentemente penduradas.

### 19.21. Bloco booleano de leitura digital

A extensão Arduino UNO possui agora o bloco:

`ler pino digital [PIN]`

Opcode:

`digitalRead`

Tipo:

`BlockType.BOOLEAN`

O tipo booleano faz o bloco ser apresentado visualmente em formato hexagonal, permitindo uso direto em condições lógicas.

Exemplo:

`se <ler pino digital [D2]> então`

O bloco reutiliza:

`digitalPins`

e disponibiliza:

- D2–D13;
- A0–A5.

A0–A5 permanecem no menu digital porque também correspondem aos GPIO digitais internos 14–19:

- A0 → 14;
- A1 → 15;
- A2 → 16;
- A3 → 17;
- A4 → 18;
- A5 → 19.

Os valores de menu continuam sendo armazenados como strings para compatibilidade com a infraestrutura do Scratch VM.

Antes da delegação ao peripheral utilizar:

`Number(args.PIN)`

O firmware e o `ArduinoUnoPeripheral` trabalham com:

- `0` para nível BAIXO;
- `1` para nível ALTO.

Na camada do bloco booleano, converter:

- `0` → `false`;
- `1` → `true`.

A conversão deve ocorrer no método da extensão, preservando o protocolo e o peripheral em sua representação numérica original.

### 19.22. Validação física do DIGITAL_READ

O primitive foi validado em hardware real pela COM11.

Validação direta pelo `ArduinoUnoPeripheral`:

D2:

- D2 → GND → `digitalRead(2)` retornou `0`;
- D2 → 5V → `digitalRead(2)` retornou `1`.

A2 utilizado como GPIO digital:

- A2 → GND → `digitalRead(16)` retornou `0`;
- A2 → 5V → `digitalRead(16)` retornou `1`.

Após a conversão do bloco para `BlockType.BOOLEAN`, ele também foi validado diretamente na interface EasyBlox:

`ler pino digital [A2]`

Resultado visual:

- nível ALTO → `true`;
- nível BAIXO → `false`.

Também foi confirmado o formato booleano/hexagonal do bloco.

Portanto está validado fisicamente o fluxo completo:

bloco booleano
→ Scratch VM
→ ArduinoUnoPeripheral
→ protocolo Stage
→ firmware
→ `digitalRead()`
→ resposta serial `0/1`
→ conversão `false/true`
→ bloco visual.

### 19.23. Build após alterações do Scratch VM

Sempre que houver alteração em:

`packages/scratch-vm/src`

executar:

`npm --workspace @scratch/scratch-vm run build`

Depois reiniciar o dev-server do Scratch GUI antes de validar a alteração na interface.

Não confiar somente no HMR para alterações do Scratch VM, pois o navegador pode continuar utilizando uma instância ou bundle anterior.

No marco `DIGITAL_READ`, o build foi concluído com sucesso.

Warnings conhecidos e não bloqueantes:

- TypeDoc de Runtime/VirtualMachine/ExtensionManager;
- Browserslist/caniuse-lite;
- canvas/jsdom;
- warnings JSDoc já conhecidos.

Não atualizar dependências somente por causa desses warnings.

### 19.24. Instrumentação temporária de depuração

Durante validações físicas pode ser necessário expor temporariamente a VM no navegador.

No marco `DIGITAL_READ` foi utilizado temporariamente:

`window.easyBloxVM`

Essa instrumentação foi removida integralmente após os testes.

Não deixar acessos temporários de depuração em commits de produção.

O arquivo:

`packages/scratch-gui/src/lib/app-state-provider-hoc.jsx`

deve permanecer sem alteração decorrente dessa instrumentação.

### 19.25. Separação entre leitura digital e leitura analógica

A extensão deve manter dois primitives conceitualmente distintos:

`ler pino digital [PIN]`

e:

`ler pino analógico [PIN]`

A leitura digital no firmware e no peripheral representa nível lógico como:

`0 ou 1`

No bloco visual booleano:

- `0` → `false`;
- `1` → `true`.

A leitura analógica utiliza o ADC do ATmega328P e deverá retornar:

`0–1023`

O menu do bloco digital permanece:

- D2–D13;
- A0–A5.

O futuro menu de leitura analógica deverá conter somente:

- A0;
- A1;
- A2;
- A3;
- A4;
- A5.

A existência de leitura analógica não modifica a capacidade de A0–A5 funcionarem como GPIO digital.

O comportamento depende do primitive utilizado.

### 19.26. Estado funcional atual do Modo Palco Arduino UNO

Neste ponto estão funcionais e fisicamente validados:

1. conexão Web Serial;
2. seleção da porta serial;
3. conexão física;
4. handshake automático;
5. retry após auto-reset;
6. protocolo binário Stage;
7. `PING/PONG`;
8. `DIGITAL_WRITE`;
9. `DIGITAL_READ`;
10. bloco visual de escrita digital;
11. bloco booleano de leitura digital;
12. D2–D13 como GPIO digital;
13. A0–A5 como GPIO digital.

Os dois primeiros primitives físicos completos são:

1. escrita digital;
2. leitura digital.

### 19.27. Próximo primitive Stage

O próximo primitive do ciclo Arduino UNO é:

`ANALOG_READ`

Bloco visual previsto:

`ler pino analógico [PIN]`

Menu previsto:

`A0–A5`

Faixa esperada no Arduino UNO:

`0–1023`

A implementação deverá continuar seguindo a disciplina incremental:

1. definir o comando e a resposta no protocolo;
2. criar testes do protocolo;
3. implementar o firmware;
4. compilar para `arduino:avr:uno`;
5. implementar no `ArduinoUnoPeripheral`;
6. criar ou ampliar os testes;
7. executar o build do Scratch VM;
8. gravar e validar em hardware real;
9. somente depois criar o reporter visual;
10. validar o reporter fisicamente pelo editor.

Depois de `ANALOG_READ`, avançar progressivamente para primitives como:

- PWM;
- tone;
- demais recursos Arduino necessários à base.

ESP32, EasyMaker Conect e outras placas permanecem fora deste ciclo.

A base Arduino UNO deve ser estabilizada antes da expansão para outras famílias.

### 19.28. ANALOG_READ — contrato do protocolo

O terceiro primitive físico completo do Modo Palco Arduino UNO é:

`ANALOG_READ`

Comando:

`COMMANDS.ANALOG_READ = 0x12`

Resposta:

`RESPONSES.ANALOG_READ = 0x92`

A requisição utiliza:

`[PIN]`

Os pinos analógicos são codificados internamente como:

- A0 = 14;
- A1 = 15;
- A2 = 16;
- A3 = 17;
- A4 = 18;
- A5 = 19.

A resposta utiliza:

`[PIN, VALUE_MSB, VALUE_LSB]`

A ordem dos bytes é MSB-first.

Exemplo para valor ADC máximo:

`[14, 0x03, 0xFF]`

Reconstrução no host:

`(payload[1] << 8) | payload[2]`

Resultado:

`1023`

A faixa válida é:

`0..1023`

A requisição e a resposta devem utilizar o mesmo `SEQ`.

### 19.29. Testes do protocolo ANALOG_READ

Arquivo:

`packages/scratch-vm/test/unit/arduino-uno-protocol.js`

Foram adicionados testes para:

- codificação de `COMMANDS.ANALOG_READ`;
- payload contendo o pino analógico;
- parsing de `RESPONSES.ANALOG_READ`;
- preservação do `SEQ`;
- payload contendo PIN, MSB e LSB.

Resultado:

`57 pass / 0 fail`

Os testes anteriores do protocolo permanecem preservados.

### 19.30. Firmware ANALOG_READ

Arquivo:

`packages/scratch-vm/firmware/arduino-uno/stage/stage.ino`

Foram definidos:

`COMMAND_ANALOG_READ = 0x12`

`RESPONSE_ANALOG_READ = 0x92`

O firmware aceita somente:

`14..19`

correspondentes a:

`A0..A5`

Antes da leitura:

1. o pino é configurado como `INPUT`;
2. o pull-up interno é desabilitado;
3. `analogRead(pin)` realiza a conversão ADC.

O valor retornado pelo ADC é um inteiro de 10 bits.

A resposta divide o resultado em:

- `VALUE_MSB`;
- `VALUE_LSB`.

Formato:

`[PIN, VALUE_MSB, VALUE_LSB]`

### 19.31. Footprint do firmware com ANALOG_READ

Compilação:

`arduino:avr:uno`

Resultado:

- Flash: `2616 bytes (8%)`;
- SRAM global: `223 bytes (10%)`;
- SRAM livre: `1825 bytes`.

No marco anterior `DIGITAL_READ`:

- Flash: `2468 bytes`;
- SRAM: `223 bytes`.

Portanto, `ANALOG_READ` adicionou:

`148 bytes`

de Flash e não aumentou o uso global de SRAM.

### 19.32. ArduinoUnoPeripheral.analogRead()

Arquivo:

`packages/scratch-vm/src/extensions/scratch3_arduino_uno/peripheral.js`

Foi implementado:

`analogRead(pin)`

Regras:

- exige `isStageConnected()`;
- aceita somente pino inteiro;
- aceita somente `14..19`;
- envia `COMMANDS.ANALOG_READ`;
- registra a operação em `_pendingAnalogReads`;
- correlaciona a resposta pelo `SEQ`;
- exige payload de três bytes;
- valida o pino retornado;
- reconstrói MSB/LSB;
- rejeita valores maiores que `1023`;
- resolve `Promise<number>`.

No `_reset()`:

- leituras digitais pendentes continuam sendo resolvidas com `null`;
- leituras analógicas pendentes também são resolvidas com `null`;
- `_pendingDigitalReads` e `_pendingAnalogReads` são limpos independentemente.

Não substituir a arquitetura de leitura digital ao acrescentar novos tipos de leitura.

### 19.33. Bloco visual de leitura analógica

Arquivo:

`packages/scratch-vm/src/extensions/scratch3_arduino_uno/index.js`

Foi criado:

`ler pino analógico [PIN]`

Tipo:

`BlockType.REPORTER`

O bloco retorna valor numérico diretamente.

Menu:

`analogPins`

Itens:

- A0 = 14;
- A1 = 15;
- A2 = 16;
- A3 = 17;
- A4 = 18;
- A5 = 19.

O menu analógico é separado de:

`digitalPins`

A0–A5 permanecem também no menu digital porque esses pinos podem ser utilizados como GPIO digital no Arduino UNO.

Portanto:

- `digitalRead` pode utilizar D2–D13 e A0–A5;
- `analogRead` utiliza somente A0–A5.

O método do bloco converte:

`Number(args.PIN)`

e delega diretamente para:

`this._peripheral.analogRead(...)`

### 19.34. Formato visual dos primitives de leitura

A leitura digital utiliza:

`BlockType.BOOLEAN`

Bloco:

`ler pino digital [PIN]`

Retorno visual:

`false / true`

A leitura analógica utiliza:

`BlockType.REPORTER`

Bloco:

`ler pino analógico [PIN]`

Retorno visual:

`0..1023`

Esses formatos devem permanecer diferentes porque representam semânticas diferentes:

- nível lógico digital;
- grandeza numérica ADC.

### 19.35. Testes da extensão com ANALOG_READ

Arquivo:

`packages/scratch-vm/test/unit/arduino-uno.js`

Após a implementação completa de `ANALOG_READ`, a suíte passou para:

`89 pass / 0 fail`

Os testes cobrem:

- handshake;
- envio da requisição;
- payload;
- `SEQ`;
- reconstrução de 1023;
- rejeição antes do handshake;
- rejeição de pinos inválidos;
- metadata do reporter;
- `BlockType.REPORTER`;
- texto do bloco;
- menu `analogPins`;
- conversão do pino para número;
- delegação ao peripheral;
- preservação dos primitives digitais anteriores.

### 19.36. Validação física ANALOG_READ

O firmware foi gravado no Arduino UNO pela:

`COM11`

Foi utilizado:

`A2`

Representação interna:

`16`

Teste com:

`A2 → GND`

Resultado:

`0`

Teste com:

`A2 → 5 V`

Resultado:

`1023`

Isso validou fisicamente:

`ADC → firmware → protocolo Stage → serial → ArduinoUnoPeripheral → Scratch VM`

Também foi validado posteriormente o reporter visual no EasyBlox.

### 19.37. Instrumentação temporária durante testes físicos

Durante a validação direta do peripheral, a VM foi temporariamente exposta como:

`window.easyBloxVM`

Neste marco, o ponto utilizado foi:

`packages/scratch-gui/src/reducers/vm.ts`

A instrumentação foi removida integralmente após os testes.

O arquivo:

`packages/scratch-gui/src/reducers/vm.ts`

deve permanecer sem diff decorrente dessa depuração.

Nunca incluir esse tipo de instrumentação temporária no commit final.

### 19.38. Build e reinicialização após alterações do Scratch VM

Após modificar:

`packages/scratch-vm/src`

foi necessário executar:

`npm --workspace @scratch/scratch-vm run build`

Depois:

1. parar o dev-server do Scratch GUI;
2. iniciar novamente o dev-server;
3. recarregar a interface.

Durante a validação do `ANALOG_READ`, apenas executar `Ctrl+F5` não foi suficiente enquanto o servidor ainda mantinha o bundle anterior.

Portanto, após mudanças no Scratch VM, considerar obrigatório:

`build → restart do dev-server → reload da interface`

Warnings conhecidos e não bloqueantes continuam sendo:

- TypeDoc Runtime/VirtualMachine/ExtensionManager;
- Browserslist/caniuse-lite;
- canvas/jsdom.

Não atualizar dependências somente para eliminar esses warnings.

### 19.39. Estado atual da base Arduino UNO

O Modo Palco Arduino UNO possui agora três primitives físicos completos:

1. `DIGITAL_WRITE`;
2. `DIGITAL_READ`;
3. `ANALOG_READ`.

Estão validados:

- Web Serial;
- conexão física;
- seleção da porta;
- handshake;
- retry após auto-reset;
- protocolo Stage;
- `PING/PONG`;
- escrita digital;
- leitura digital;
- leitura analógica;
- D2–D13 como GPIO digital;
- A0–A5 como GPIO digital;
- A0–A5 como entradas ADC;
- bloco de escrita digital;
- bloco booleano de leitura digital;
- reporter numérico de leitura analógica;
- correlação assíncrona por `SEQ`;
- hardware real.

Antes de iniciar qualquer outro primitive, concluir:

1. revisão dos diffs;
2. `git diff --check`;
3. staging explícito;
4. `git diff --cached --check`;
5. commit;
6. push;
7. confirmação da sincronização da branch.

A alteração externa em:

`packages/scratch-gui/src/components/action-menu/icon--sprite.svg`

não pertence ao ciclo Arduino UNO e não deve ser incluída neste commit.

Após o checkpoint, continuar evoluindo incrementalmente a base Arduino UNO.

Não iniciar ESP32, EasyMaker Conect ou outras placas antes da estabilização dessa base.

### 19.40. PWM_WRITE — contrato do protocolo

O quarto primitive físico completo do Modo Palco Arduino UNO é:

`PWM_WRITE`

Comando:

`COMMANDS.PWM_WRITE = 0x13`

A requisição utiliza:

`[PIN, VALUE]`

A resposta reutiliza:

`RESPONSES.ACK = 0x80`

Não foi criado um novo tipo de resposta específico para PWM.

O mesmo `SEQ` identifica a requisição e o ACK correspondente.

Pinos PWM válidos no Arduino UNO:

- D3 = 3;
- D5 = 5;
- D6 = 6;
- D9 = 9;
- D10 = 10;
- D11 = 11.

Faixa do valor PWM:

`0..255`

Semântica:

- `0` → saída em 0% de duty cycle;
- `1..254` → modulação PWM;
- `255` → saída em 100% de duty cycle.

Pinos que não possuem PWM por hardware não devem ser aceitos pelo primitive.

### 19.41. Testes do protocolo PWM_WRITE

Arquivo:

`packages/scratch-vm/test/unit/arduino-uno-protocol.js`

Foi adicionado teste para:

`COMMANDS.PWM_WRITE`

Payload protegido:

`[3, 128]`

O teste confirma:

- versão do protocolo;
- `SEQ`;
- comando `0x13`;
- comprimento igual a 2;
- PIN;
- VALUE;
- checksum.

Resultado da suíte:

`66 pass / 0 fail`

### 19.42. Firmware PWM_WRITE

Arquivo:

`packages/scratch-vm/firmware/arduino-uno/stage/stage.ino`

Foi definido:

`COMMAND_PWM_WRITE = 0x13`

Foi criado:

`isPwmPin(pin)`

Esse helper aceita somente:

`3, 5, 6, 9, 10, 11`

Foi implementado:

`handlePwmWrite()`

Contrato:

`[PIN, VALUE]`

O handler:

1. exige payload de dois bytes;
2. verifica se o PIN possui PWM;
3. configura o pino como `OUTPUT`;
4. executa `analogWrite(pin, value)`;
5. retorna `RESPONSE_ACK`.

Em caso de payload inválido ou pino não-PWM:

`RESPONSE_ERROR = 0xFF`

O VALUE é recebido como `uint8_t`, portanto o protocolo transporta naturalmente valores entre:

`0..255`

### 19.43. Footprint do firmware com PWM_WRITE

Compilação para:

`arduino:avr:uno`

Resultado:

- Flash: `2870 bytes (8%)`;
- SRAM global: `223 bytes (10%)`;
- SRAM livre: `1825 bytes`.

Comparação com o marco `ANALOG_READ`:

- Flash anterior: `2616 bytes`;
- Flash atual: `2870 bytes`;
- aumento: `254 bytes`;
- SRAM permaneceu em `223 bytes`.

### 19.44. ArduinoUnoPeripheral.pwmWrite()

Arquivo:

`packages/scratch-vm/src/extensions/scratch3_arduino_uno/peripheral.js`

Foi implementado:

`pwmWrite(pin, value)`

Regras:

- exige handshake Stage concluído;
- PIN deve ser inteiro;
- VALUE deve ser inteiro;
- PIN deve pertencer a `[3, 5, 6, 9, 10, 11]`;
- VALUE deve estar entre `0` e `255`.

Em caso válido:

`COMMANDS.PWM_WRITE`

é enviado com:

`[pin, value]`

O método retorna o `SEQ` do comando.

Em caso de indisponibilidade ou argumento inválido:

`null`

Assim como `digitalWrite()`, o primitive não mantém uma Promise pendente aguardando ACK.

### 19.45. Testes da extensão com PWM_WRITE

Arquivo:

`packages/scratch-vm/test/unit/arduino-uno.js`

Após a implementação completa do PWM, a suíte passou para:

`131 pass / 0 fail`

Os testes cobrem:

- handshake obrigatório;
- envio de `PWM_WRITE`;
- D3 com valor 0;
- D11 com valor 255;
- progressão do `SEQ`;
- payload correto;
- rejeição de todos os pinos não-PWM relevantes;
- rejeição de pino não inteiro;
- rejeição de VALUE negativo;
- rejeição de VALUE acima de 255;
- rejeição de VALUE não inteiro;
- metadata do bloco visual;
- `BlockType.COMMAND`;
- menu `pwmPins`;
- valor padrão;
- conversão de argumentos para número;
- delegação ao peripheral.

Os primitives anteriores permanecem cobertos pela mesma suíte.

### 19.46. Bloco visual PWM

Arquivo:

`packages/scratch-vm/src/extensions/scratch3_arduino_uno/index.js`

Foi criado:

`definir PWM no pino [PIN] como [VALUE]`

Tipo:

`BlockType.COMMAND`

Menu:

`pwmPins`

Itens:

- D3;
- D5;
- D6;
- D9;
- D10;
- D11.

O VALUE utiliza entrada numérica.

O valor padrão aprovado é:

`255`

Não usar `128` como valor padrão do bloco.

O valor `128` continua sendo válido e útil para testes de aproximadamente 50% de duty cycle.

O método visual executa:

`Number(args.PIN)`

e:

`Number(args.VALUE)`

O VALUE é então limitado à faixa válida do PWM:

`0..255`

A normalização ocorre por clamp antes da chamada ao peripheral:

- valor abaixo de `0` → `0`;
- valor entre `0` e `255` → preservado;
- valor acima de `255` → `255`.

Casos protegidos por teste:

- `-20` → `0`;
- `128` → `128`;
- `600` → `255`.

Depois da normalização, o valor é delegado para:

`this._peripheral.pwmWrite(...)`

A validação de faixa existente no `ArduinoUnoPeripheral` permanece como segunda camada defensiva.

Dessa forma, um valor digitado pelo usuário como `600` não é simplesmente rejeitado: o bloco o normaliza para o maior valor PWM permitido, `255`.

### 19.47. Validação elétrica do PWM

A primeira validação foi realizada em D3.

Foram observados:

- PWM 0 → `0 V`;
- PWM 128 → `1,96 V`;
- PWM 255 → `3,96 V`.

A alimentação da placa foi medida em:

`4,93 V`

Para verificar se a queda era causada pelo PWM, foi executado:

`digitalWrite(3, 1)`

Resultado em D3:

`3,96 V`

Portanto, a tensão reduzida no D3 não é causada especificamente por `analogWrite()` ou pelo primitive `PWM_WRITE`.

A validação foi repetida em D5.

Com saída digital HIGH:

`D5 → 4,92 V`

Com PWM:

- `0` → `0,00 V`;
- `128` → `2,46 V`;
- `255` → `4,92 V`.

D5 é, portanto, a referência física validada para este checkpoint.

Os resultados correspondem corretamente a:

- 0%;
- aproximadamente 50%;
- 100% de duty cycle.

### 19.48. Validação pelo próprio bloco PWM

Após o build do Scratch VM e restart do dev-server, o bloco apareceu corretamente no EasyBlox.

Estado visual inicial:

`definir PWM no pino [D3] como [255]`

Foram confirmados:

- formato COMMAND;
- menu de pinos;
- valor padrão `255`;
- permanência dos blocos anteriores.

Para validação física pelo editor foi utilizado:

`definir PWM no pino [D5] como [128]`

Resultado:

`2,46 V`

Portanto foi validado o fluxo completo:

`bloco visual → Scratch VM → ArduinoUnoPeripheral → PWM_WRITE → firmware → analogWrite() → saída física D5`

### 19.49. Retorno null após restart ou reload

Depois de reinicializar o ambiente, executar um primitive físico antes de restabelecer o handshake Stage pode retornar:

`null`

Esse comportamento é esperado.

No caso do PWM, ocorreu após restart/reload enquanto o Arduino ainda não havia sido reconectado à nova instância da VM.

Após reconectar pela:

`COM11`

o bloco PWM voltou a funcionar normalmente.

Portanto, ao investigar `null` em primitives de hardware, verificar primeiro:

1. conexão serial;
2. handshake Stage;
3. `isStageConnected()`.

Não interpretar automaticamente `null` como erro do primitive.

### 19.50. Instrumentação temporária de hardware

Para a validação direta do peripheral foi temporariamente utilizado:

`window.easyBloxVM`

O gancho foi inserido em:

`packages/scratch-gui/src/reducers/vm.ts`

e removido após o teste.

O arquivo voltou ao estado original e deve permanecer sem diff relacionado à depuração.

Nenhuma instrumentação temporária pode entrar em commits de produção.

### 19.51. Estado atual da base Arduino UNO

O Modo Palco Arduino UNO possui agora quatro primitives físicos completos:

1. `DIGITAL_WRITE`;
2. `DIGITAL_READ`;
3. `ANALOG_READ`;
4. `PWM_WRITE`.

Resultados consolidados:

- protocolo: `66/66`;
- extensão: `131/131`;
- Flash: `2870 bytes`;
- SRAM: `223 bytes`;
- PWM D5 em 0: `0 V`;
- PWM D5 em 128: `2,46 V`;
- PWM D5 em 255: `4,92 V`.

Pinos e funções atualmente estabelecidos:

- D2–D13 e A0–A5 como GPIO digital quando aplicável;
- A0–A5 como entradas ADC;
- D3, D5, D6, D9, D10 e D11 como PWM.

Blocos disponíveis:

`definir pino [PIN] como [VALUE]`

`ler pino digital [PIN]`

`ler pino analógico [PIN]`

`definir PWM no pino [PIN] como [VALUE]`

### 19.52. Procedimento após alterações no Scratch VM

Sempre que houver alteração em:

`packages/scratch-vm/src`

executar:

`npm --workspace @scratch/scratch-vm run build`

Depois:

1. parar o dev-server;
2. iniciar novamente;
3. recarregar o EasyBlox;
4. reconectar o Arduino UNO;
5. aguardar o handshake Stage;
6. somente então testar os primitives físicos.

Essa sequência evita testes contra bundles ou instâncias anteriores.

### 19.53. Slider para campos numéricos — backlog de UX

Foi considerada a inclusão de um controle deslizante para o VALUE do bloco PWM, com faixa:

`0..255`

O Scratch já utiliza sliders em outros contextos da interface, como na alteração interativa de valores de variáveis.

A decisão atual é não implementar um slider específico somente para `PWM_WRITE`.

Esse recurso deverá ser estudado em um ciclo futuro como uma capacidade reutilizável do EasyBlox para argumentos numéricos que possuam faixa bem definida.

Possíveis aplicações futuras incluem:

- PWM;
- intensidade;
- velocidade;
- brilho;
- potência;
- ângulos ou outras faixas limitadas, quando tecnicamente apropriado.

A solução futura deverá buscar reutilizar a infraestrutura existente do ecossistema Scratch, permitindo preferencialmente:

- valor mínimo;
- valor máximo;
- entrada manual;
- controle deslizante;
- atualização visual imediata.

Evitar criar uma implementação exclusiva de slider para apenas um bloco.

### 19.54. Próximo checkpoint

Antes de iniciar outro primitive:

1. executar `git diff --check`;
2. revisar os arquivos do ciclo;
3. manter fora do commit a alteração externa em `packages/scratch-gui/src/components/action-menu/icon--sprite.svg`;
4. fazer staging explícito;
5. executar `git diff --cached --check`;
6. criar commit;
7. fazer push;
8. confirmar sincronização local/remota.

Depois do checkpoint, continuar evoluindo a base Arduino UNO incrementalmente.

ESP32, EasyMaker Conect e demais placas permanecem fora deste ciclo até a estabilização da base UNO.

### 19.55. TONE_START / TONE_STOP — contrato do protocolo

O quinto primitive físico completo do Modo Palco Arduino UNO é composto pelo par:

`TONE_START`

e:

`TONE_STOP`

Comandos:

`COMMANDS.TONE_START = 0x14`

`COMMANDS.TONE_STOP = 0x15`

O `TONE_START` utiliza o payload:

`[PIN, FREQ_LSB, FREQ_MSB]`

A frequência é transportada como inteiro sem sinal de 16 bits em little-endian.

Exemplo para `440 Hz`:

`440 = 0x01B8`

Payload para D6:

`[6, 0xB8, 0x01]`

Faixa de frequência aceita:

`1..65535 Hz`

O `TONE_STOP` utiliza:

`[PIN]`

Ambos reutilizam:

`RESPONSES.ACK = 0x80`

Não foram criados novos tipos de resposta específicos para tone.

Por decisão do projeto EasyBlox, os primitives de tone aceitam somente os pinos PWM do Arduino UNO:

- D3 = 3;
- D5 = 5;
- D6 = 6;
- D9 = 9;
- D10 = 10;
- D11 = 11.

Embora a API `tone()` do Arduino não exija tecnicamente pino PWM, o contrato do EasyBlox restringe essa funcionalidade aos mesmos pinos definidos no menu `pwmPins`, mantendo uma interface consistente para o aluno.

### 19.56. Semântica de TONE_START / TONE_STOP

O primitive físico atual trabalha diretamente com frequência.

Bloco:

`tocar tom no pino [PIN] com frequência [FREQUENCY] Hz`

Semântica:

`TONE_START(pin, frequency)`

O som permanece ativo continuamente até que seja recebido:

`TONE_STOP(pin)`

Bloco:

`parar tom no pino [PIN]`

O contrato atual não inclui:

- nota musical;
- duração;
- figura rítmica;
- BPM;
- pausa musical.

Essas abstrações pertencem a uma camada musical futura do EasyBlox e deverão reutilizar os primitives físicos já estabelecidos.

Exemplo futuro:

`Lá4 → 440 Hz`

A camada musical poderá converter internamente nota, andamento e duração em operações sobre `TONE_START` e `TONE_STOP`, sem exigir alteração deste protocolo.

### 19.57. Testes do protocolo TONE_START / TONE_STOP

Arquivo:

`packages/scratch-vm/test/unit/arduino-uno-protocol.js`

Foram adicionados testes de codificação para:

`COMMANDS.TONE_START`

com payload protegido:

`[6, 0xB8, 0x01]`

e:

`COMMANDS.TONE_STOP`

com payload:

`[6]`

Os testes confirmam:

- versão do protocolo;
- SEQ;
- comandos `0x14` e `0x15`;
- comprimento dos payloads;
- PIN;
- bytes LSB/MSB da frequência;
- checksum.

Resultado da suíte específica do protocolo após a inclusão:

`84 pass / 0 fail`

### 19.58. Firmware TONE_START / TONE_STOP

Arquivo:

`packages/scratch-vm/firmware/arduino-uno/stage/stage.ino`

Foram definidos:

`COMMAND_TONE_START = 0x14`

`COMMAND_TONE_STOP = 0x15`

Foi reutilizado:

`isPwmPin(pin)`

portanto somente:

`3, 5, 6, 9, 10, 11`

são aceitos.

Foi implementado:

`handleToneStart()`

Contrato:

`[PIN, FREQ_LSB, FREQ_MSB]`

O handler:

1. exige payload de três bytes;
2. verifica se o PIN pertence à lista PWM;
3. reconstrói a frequência de 16 bits;
4. rejeita frequência igual a zero;
5. encerra um tone anterior caso esteja ativo em outro pino;
6. executa `tone(pin, frequency)`;
7. registra o pino atualmente ativo;
8. retorna `RESPONSE_ACK`.

Também foi implementado:

`handleToneStop()`

Contrato:

`[PIN]`

O handler:

1. exige payload de um byte;
2. verifica se o PIN pertence à lista PWM;
3. executa `noTone(pin)` quando esse pino é o tone atualmente ativo;
4. limpa o estado de tone ativo;
5. retorna `RESPONSE_ACK`.

O `TONE_STOP` é idempotente para pinos válidos: solicitar a parada de um tone que já não está ativo continua retornando ACK.

O firmware mantém somente um tone ativo por vez.

### 19.59. Footprint do firmware com TONE_START / TONE_STOP

Compilação validada para:

`arduino:avr:uno`

Resultado:

- Flash: `4454 bytes (13%)`;
- SRAM global: `242 bytes (11%)`;
- SRAM livre: `1806 bytes`.

Comparação com o marco `PWM_WRITE`:

- Flash anterior: `2870 bytes`;
- Flash atual: `4454 bytes`;
- aumento: `1584 bytes`;
- SRAM anterior: `223 bytes`;
- SRAM atual: `242 bytes`;
- aumento: `19 bytes`.

Mesmo com o aumento causado pela infraestrutura de `tone()` do core AVR, o firmware permanece com ampla margem de Flash e SRAM no Arduino UNO.

### 19.60. ArduinoUnoPeripheral.toneStart() / toneStop()

Arquivo:

`packages/scratch-vm/src/extensions/scratch3_arduino_uno/peripheral.js`

Foi implementado:

`toneStart(pin, frequency)`

Validações:

- Stage conectado;
- PIN inteiro;
- PIN pertencente a `3, 5, 6, 9, 10, 11`;
- frequência inteira;
- frequência entre `1..65535`.

Envio:

`COMMANDS.TONE_START`

Payload:

`[PIN, FREQ_LSB, FREQ_MSB]`

Também foi implementado:

`toneStop(pin)`

Validações:

- Stage conectado;
- PIN inteiro;
- PIN pertencente a `3, 5, 6, 9, 10, 11`.

Envio:

`COMMANDS.TONE_STOP`

Payload:

`[PIN]`

### 19.61. Blocos visuais de tone

Arquivo:

`packages/scratch-vm/src/extensions/scratch3_arduino_uno/index.js`

Foram adicionados os blocos:

`tocar tom no pino [PIN] com frequência [FREQUENCY] Hz`

e:

`parar tom no pino [PIN]`

Ambos reutilizam:

`menu: 'pwmPins'`

Pino padrão:

`D6`

Frequência padrão:

`440 Hz`

A camada visual faz clamp da frequência para:

`1..65535`

O peripheral continua sendo a camada responsável pela validação final de inteiros e pinos permitidos.

### 19.62. Testes da extensão Arduino UNO com tone

Arquivo:

`packages/scratch-vm/test/unit/arduino-uno.js`

Foram protegidos:

- envio de `TONE_START` após handshake Stage;
- envio de `TONE_STOP` após handshake Stage;
- payload little-endian de `440 Hz`;
- rejeição de pinos não-PWM;
- rejeição de frequências inválidas;
- rejeição antes do handshake;
- exposição dos dois blocos em `getInfo()`;
- menu `pwmPins`;
- valores padrão;
- conversão de argumentos numéricos;
- clamp visual de frequência para `1..65535`;
- delegação para `ArduinoUnoPeripheral`.

Resultado final da suíte específica:

`196 pass / 0 fail`

### 19.63. Build e validação em hardware real

O Scratch VM foi recompilado após as alterações.

Resultado:

- TypeDoc: `0 errors`;
- webpack: compilação concluída com sucesso;
- warnings existentes de documentação, Browserslist e dependência opcional `canvas` não impediram o build.

O firmware Stage foi carregado em Arduino UNO compatível conectado por:

`USB-SERIAL CH340 (COM11)`

A validação física utilizou uma EasyDuino com buzzer integrado no:

`D6`

Foi validado diretamente no protocolo:

`TONE_START(D6, 440 Hz)`

Resultado:

- buzzer iniciou o tone corretamente;
- tone permaneceu contínuo enquanto nenhum `TONE_STOP` foi recebido.

Depois foi validado:

`TONE_STOP(D6)`

Resultado:

- tone interrompido corretamente.

Após rebuild do Scratch VM e reinicialização limpa do dev-server, os dois blocos apareceram corretamente no EasyBlox e foram validados pelo usuário em hardware real.

Resultado:

`TONE_START ✅`

`TONE_STOP ✅`

### 19.64. Backlog musical sobre a base TONE

A camada física de tone está deliberadamente separada da futura camada musical.

Futuramente poderão ser implementados recursos como:

- seleção de notas musicais, por exemplo `Lá4`;
- conversão automática de nota para frequência;
- definição de andamento em BPM;
- figuras rítmicas;
- duração de notas;
- pausas;
- sequências musicais.

Exemplo conceitual futuro:

`definir andamento para [120] BPM`

`tocar nota [Lá4] por [1/4]`

`pausa por [1/8]`

Essa camada deverá utilizar internamente os primitives já consolidados:

`TONE_START`

e:

`TONE_STOP`

sem alterar o protocolo físico existente.

### 19.65. PWM_WRITE — correção futura do campo visual

Durante a validação dos blocos de tone foi novamente observado que o campo visual do bloco:

`definir PWM no pino [PIN] como [VALUE]`

continua permitindo ao usuário digitar valores acima de:

`255`

O primitive `PWM_WRITE` já faz clamp interno para:

`0..255`

e esse comportamento está protegido por testes.

Portanto, não existe erro funcional no primitive.

A correção futura pertence à camada de UX/entrada visual e deverá impedir ou normalizar de forma mais clara valores fora da faixa visível permitida.

Essa melhoria pode ser tratada junto ao backlog já registrado de campos numéricos reutilizáveis e slider, evitando criar uma solução exclusiva para PWM.

### 19.66. Estado atual da base Arduino UNO

O Modo Palco Arduino UNO possui agora cinco grupos de primitives físicos completos:

1. `DIGITAL_WRITE`;
2. `DIGITAL_READ`;
3. `ANALOG_READ`;
4. `PWM_WRITE`;
5. `TONE_START / TONE_STOP`.

Resultados consolidados do checkpoint de tone:

- protocolo tone: `84/84`;
- extensão Arduino UNO: `196/196`;
- firmware compilado para `arduino:avr:uno`;
- Flash: `4454 bytes (13%)`;
- SRAM: `242 bytes (11%)`;
- hardware real validado;
- blocos visuais validados;
- `TONE_START` funcional;
- `TONE_STOP` funcional.

Pinos de tone definidos pelo EasyBlox:

`D3, D5, D6, D9, D10, D11`

O contrato permanece incremental e deve continuar sendo evoluído sem iniciar outras placas antes da estabilização da base Arduino UNO.

### 19.67. Categoria visual Atuadores

A implementação de Servo inaugurou uma nova categoria visual genérica no EasyBlox:

`Atuadores`

ID técnico:

`actuators`

A categoria não representa uma nova conexão de hardware.

Quando o Arduino UNO é carregado, a extensão `actuators` é carregada automaticamente como extensão companheira.

A arquitetura definida é:

`Arduino UNO → proprietário da conexão Serial`

`Atuadores → camada visual que reutiliza o peripheral Arduino UNO`

Portanto, não deve existir:

- segunda conexão Serial;
- segundo handshake;
- segundo objeto de transporte;
- firmware independente para Atuadores.

A extensão `actuators` obtém o peripheral registrado do Arduino UNO através do Runtime e reutiliza a mesma sessão Stage.

Também foi implementada a dependência inversa necessária para desenvolvimento:

`actuators → arduinoUno`

Assim, se `actuators` for carregada diretamente internamente, o Arduino UNO é carregado antes dela.

A extensão Atuadores permanece oculta da biblioteca normal de extensões e aparece automaticamente quando Arduino UNO está ativo.

Essa arquitetura deverá ser reutilizada pelos próximos atuadores, inicialmente:

1. Servo;
2. Motor;
3. Relé.

### 19.68. SERVO_WRITE — contrato do protocolo

O comando Stage definido para controle de Servo é:

`SERVO_WRITE = 0x16`

Payload:

`[PIN, ANGLE]`

onde:

- `PIN` ocupa 1 byte;
- `ANGLE` ocupa 1 byte;
- `ANGLE` aceita somente valores inteiros entre `0` e `180`.

Resposta de sucesso:

`ACK = 0x80`

Pinos permitidos pelo contrato EasyBlox:

`D3, D5, D6, D9, D10, D11`

A restrição aos pinos PWM é uma decisão de produto e UX do EasyBlox.

Embora a biblioteca Servo do Arduino permita outros pinos digitais, a primeira versão do EasyBlox mantém uma lista única e previsível de pinos compatíveis com atuadores controlados por temporização.

Não foi criado um primitive separado de `SERVO_ATTACH`.

O primeiro:

`SERVO_WRITE`

realizado em determinado pino executa o attach automaticamente.

### 19.69. Biblioteca Servo e firmware Arduino UNO

Foi instalada e utilizada a biblioteca oficial:

`Servo 1.3.0`

O firmware Stage passou a incluir:

`#include <Servo.h>`

Foi criada uma instância de `Servo` para cada pino permitido pelo contrato:

`D3, D5, D6, D9, D10, D11`

O firmware mantém controle sobre quais Servos estão efetivamente anexados.

O handler de:

`SERVO_WRITE`

executa:

1. validação do tamanho do payload;
2. validação do pino;
3. validação de `ANGLE <= 180`;
4. verificação de conflito com tone no mesmo pino;
5. attach automático caso necessário;
6. `servo.write(angle)`;
7. envio de `ACK`.

Resultado da compilação final do firmware com Servo:

- Flash: `5664 bytes`;
- SRAM: `298 bytes`.

### 19.70. Arbitragem entre Servo, PWM, Digital e Tone

A introdução de Servo exige arbitragem explícita de recursos.

Quando um Servo está anexado a um pino, o EasyBlox rejeita naquele mesmo pino:

- `DIGITAL_WRITE`;
- `DIGITAL_READ`;
- `PWM_WRITE`;
- `TONE_START`.

`TONE_STOP` permanece idempotente.

`SERVO_WRITE` também é rejeitado caso exista um tone ativo no mesmo pino.

A leitura analógica permanece independente.

Existe ainda uma particularidade do Arduino UNO relacionada ao Timer1.

A biblioteca Servo AVR utiliza o:

`Timer1`

Consequentemente, depois que qualquer Servo é anexado, o PWM de hardware nos pinos:

`D9`

e:

`D10`

fica indisponível.

Por isso, o firmware rejeita:

`PWM_WRITE(D9)`

e:

`PWM_WRITE(D10)`

enquanto existir qualquer Servo anexado.

Os pinos D9 e D10 continuam válidos como pinos de Servo.

A política adotada é rejeitar conflitos explicitamente, e não destacar silenciosamente um Servo ou alterar a propriedade do pino sem conhecimento do usuário.

### 19.71. Bloco visual Servo

O primeiro bloco da categoria Atuadores é:

`mover servo no pino [PIN] para [ANGLE] graus`

Configuração inicial:

- pino padrão: `D5`;
- ângulo padrão: `90`;
- pinos disponíveis: `D3, D5, D6, D9, D10, D11`.

O método visual mantém também clamp interno entre:

`0..180`

como segunda camada de proteção.

A validação visual não substitui a validação existente no peripheral nem no firmware.

### 19.72. EasyBloxRangeNumberField

Durante o desenvolvimento de Servo foi concluída uma infraestrutura visual numérica reutilizável:

`EasyBloxRangeNumberField`

Arquivo:

`packages/scratch-gui/src/lib/easyblox-range-number-field.js`

A implementação utiliza como base:

`ScratchBlocks.FieldNumber`

e preserva os constraints nativos de:

- mínimo;
- máximo;
- precisão.

Foi acrescentado um controle:

`<input type="range">`

ao editor do campo.

Para Servo foi criado o shadow:

`easyblox_servo_angle`

com:

- mínimo: `0`;
- máximo: `180`;
- precisão: `1`;
- valor padrão: `90`.

O novo tipo de argumento interno é:

`ArgumentType.SERVO_ANGLE`

mapeado pelo Runtime para:

`easyblox_servo_angle`

A experiência final permite:

- digitação direta;
- slider;
- limite inferior rígido;
- limite superior rígido;
- valores inteiros.

O campo foi deliberadamente implementado como infraestrutura reutilizável, e não como lógica específica do Servo.

Uma aplicação futura natural é corrigir também o campo visual do:

`PWM_WRITE`

usando a mesma base com faixa:

`0..255`.

### 19.73. Ajuste de foco do editor numérico e slider

Durante o primeiro teste visual do `EasyBloxRangeNumberField`, o editor numérico inline e o `DropDownDiv` utilizado pelo slider tentaram assumir simultaneamente o controle de foco efêmero do Blockly.

O resultado foi um erro de runtime relacionado a:

`ephemeral focus`

A API do `FieldInput` já prevê esse cenário através do parâmetro:

`manageEphemeralFocus`

A chamada do editor base foi ajustada para:

`super.showEditor_(event, false, false)`

Com isso:

- o editor numérico permanece funcional;
- o slider permanece funcional;
- apenas o mecanismo apropriado administra o foco;
- o erro desapareceu.

Após o ajuste, o campo foi validado visualmente no EasyBlox.

### 19.74. Validação automática e física do Servo

Testes específicos concluídos durante o checkpoint:

- protocolo Arduino UNO: `93/93`;
- peripheral Arduino UNO: `222/222`;
- extensão Atuadores: `14/14`;
- integração de extensões internas: `32/32`.

O teste de `engine_runtime.js` apresenta uma anomalia de teardown já observada no ambiente com Node.js `24.19.0`, relacionada ao `react-reconciler`.

As assertions executadas antes do teardown são concluídas, e o mesmo comportamento foi reproduzido com o teste original, portanto não foi atribuído ao código de Servo.

Não alterar a versão do Node por causa dessa anomalia.

Builds aprovados:

- Scratch VM;
- Scratch GUI.

O firmware foi carregado no Arduino UNO e o bloco Servo foi validado em hardware real.

Posições testadas:

`0°`

`90°`

`180°`

Resultado:

`SERVO_WRITE ✅`

O slider e a digitação direta também foram validados na interface final.

### 19.75. Observação sobre a regressão transitória durante o desenvolvimento

Durante a implementação foi observado temporariamente um estado em que comandos enviados pelo GUI retornavam `null`, incluindo Servo e posteriormente um teste de `DIGITAL_WRITE`.

O firmware respondia corretamente quando testado diretamente pela porta Serial.

Foi realizada uma investigação incremental e uma reconstrução controlada das alterações de Servo.

Ao final, o firmware completo, o Scratch VM e o Scratch GUI voltaram a operar corretamente sem que fosse possível reproduzir a falha.

Não foi identificada uma causa única comprovada.

Portanto, não registrar essa ocorrência como defeito do CH340, da biblioteca Servo ou do protocolo.

A conclusão segura é manter disciplina rigorosa de sincronização durante testes de hardware:

`firmware correto → VM recompilado → GUI recompilado/reiniciado → navegador atualizado`

O driver CH340 não necessita alteração enquanto o fluxo permanecer funcional.

### 19.76. Estado atual após SERVO_WRITE

A base Arduino UNO no Modo Palco possui agora:

1. `DIGITAL_WRITE`;
2. `DIGITAL_READ`;
3. `ANALOG_READ`;
4. `PWM_WRITE`;
5. `TONE_START / TONE_STOP`;
6. `SERVO_WRITE`.

A categoria genérica:

`Atuadores`

também está estabelecida e pronta para receber os próximos primitives sem duplicar a infraestrutura Serial.

O primeiro atuador completo é:

`SERVO`

Próximo primitive aprovado:

`MOTOR`

A ordem de desenvolvimento permanece:

1. SERVO — concluído funcionalmente;
2. MOTOR — próximo;
3. RELÉ;
4. ULTRASSÔNICO;
5. DHT;
6. MATRIZ DE LED;
7. DISPLAY 7 SEGMENTOS;
8. DISPLAY LCD 16x2 I2C;
9. JOYSTICK X/Y.

O checkpoint SERVO somente será considerado oficialmente encerrado após:

- documentação final;
- `git diff --check`;
- revisão do diff;
- staging explícito;
- validação do staged diff;
- commit;
- push;
- confirmação da sincronização com o remoto.

### 19.77. Fechamento oficial do checkpoint SERVO

O checkpoint de Servo da base Arduino UNO foi oficialmente concluído.

Primitive:

`SERVO_WRITE = 0x16`

Branch:

`feat/easyblox-arduino-uno-foundation`

Commit funcional:

`dcbfc724170a2ee3144335aa212e7d040088a615`

Hash abreviado:

`dcbfc7241`

Mensagem:

`feat: add Arduino UNO Stage servo control`

Push concluído:

`819b35432e → dcbfc72417`

Sincronização confirmada entre:

`HEAD`

e:

`origin/feat/easyblox-arduino-uno-foundation`

ambos em:

`dcbfc724170a2ee3144335aa212e7d040088a615`

O checkpoint consolidou:

- categoria visual `Atuadores`;
- compartilhamento do peripheral Arduino UNO;
- `SERVO_WRITE`;
- biblioteca `Servo 1.3.0`;
- attach automático;
- arbitragem entre Servo, Digital, PWM e Tone;
- tratamento explícito do conflito Timer1 em D9/D10;
- campo numérico reutilizável `EasyBloxRangeNumberField`;
- slider e digitação limitada a `0..180`;
- `ArgumentType.SERVO_ANGLE`;
- shadow `easyblox_servo_angle`;
- testes automatizados;
- builds do Scratch VM e Scratch GUI;
- compilação do firmware;
- validação em hardware real.

Resultados finais relevantes:

- protocolo Arduino UNO: `93/93`;
- peripheral Arduino UNO: `222/222`;
- extensão Atuadores: `14/14`;
- integração de extensões internas: `32/32`;
- Flash: `5664 bytes`;
- SRAM: `298 bytes`;
- Servo físico validado em `0°`, `90°` e `180°`.

A alteração local independente:

`packages/scratch-gui/src/components/action-menu/icon--sprite.svg`

não pertence ao checkpoint e permaneceu fora do commit.

Estado atual dos primitives Arduino UNO no Modo Palco:

1. `DIGITAL_WRITE`;
2. `DIGITAL_READ`;
3. `ANALOG_READ`;
4. `PWM_WRITE`;
5. `TONE_START / TONE_STOP`;
6. `SERVO_WRITE`.

O próximo primitive oficial da sequência é:

`MOTOR`

Antes de iniciar MOTOR, concluir apenas o commit documental deste fechamento e confirmar seu push no remoto.

### 19.78. PWM_WRITE — fechamento do range visual 0..255

O backlog visual do bloco:

`definir PWM no pino [PIN] como [VALUE]`

foi concluído.

Antes desta correção, o primitive já possuía proteção funcional:

- clamp interno no bloco;
- validação no peripheral;
- faixa aceita pelo protocolo de `0..255`.

Porém, o campo visual ainda utilizava:

`ArgumentType.NUMBER`

e permitia ao usuário digitar valores fora da faixa esperada.

A infraestrutura reutilizável criada durante o checkpoint de Servo:

`EasyBloxRangeNumberField`

passou a ser reutilizada também pelo PWM.

Foi criado o shadow:

`easyblox_pwm_value`

com a seguinte configuração:

- valor padrão: `255`;
- mínimo: `0`;
- máximo: `255`;
- precisão: `1`.

Também foi criado o tipo interno:

`ArgumentType.PWM_VALUE`

com o mapeamento:

`ArgumentType.PWM_VALUE → easyblox_pwm_value`

O argumento:

`VALUE`

do bloco `pwmWrite` deixou de utilizar:

`ArgumentType.NUMBER`

e passou a utilizar:

`ArgumentType.PWM_VALUE`.

O método funcional:

`pwmWrite(args)`

permaneceu com o clamp interno existente em:

`0..255`

como segunda camada de proteção.

A arquitetura final do campo reutilizável passa a atender:

`Servo → EasyBloxRangeNumberField → 0..180`

`PWM → EasyBloxRangeNumberField → 0..255`

### 19.79. Validação do range visual PWM

Foi adicionada proteção automatizada para garantir que o bloco PWM continue utilizando:

`ArgumentType.PWM_VALUE`

Resultado do teste isolado:

`packages/scratch-vm/test/unit/arduino-uno.js`

Resultado:

`223 pass / 0 fail`

O aumento de `222` para `223` assertions corresponde à nova verificação do tipo visual do argumento `VALUE`.

Builds aprovados após a alteração:

- Scratch VM;
- Scratch GUI.

Scratch VM:

`webpack 5.109.2 compiled successfully`

Scratch GUI:

`webpack 5.109.2 compiled successfully`

Validação visual realizada no EasyBlox:

- slider mínimo: `0`;
- valor intermediário: `128`;
- slider máximo: `255`;
- digitação abaixo de `0` limitada corretamente;
- digitação acima de `255` limitada corretamente;
- precisão inteira;
- digitação direta funcional;
- slider funcional;
- ausência de erro de `ephemeral focus`.

Resultado:

`PWM RANGE 0..255 ✅`

Nenhuma alteração foi necessária em:

- protocolo Stage;
- peripheral Arduino UNO;
- firmware Arduino UNO.

O backlog registrado anteriormente para o campo visual de `PWM_WRITE` está, portanto, encerrado.

A alteração local independente:

`packages/scratch-gui/src/components/action-menu/icon--sprite.svg`

não pertence a este ajuste e deve permanecer fora do commit.

Após o fechamento documental e commit deste pequeno checkpoint, o próximo primitive oficial continua sendo:

`MOTOR`

### 19.80. MOTOR v1 — princípio arquitetural

O primitive `MOTOR` foi implementado na base Arduino UNO Stage seguindo a mesma arquitetura já consolidada para a categoria `Atuadores`.

A regra principal é manter separado:

`primitive conceitual genérico`

de:

`mapeamento físico específico da placa`

O protocolo Stage não conhece conceitos como:

- Motor A;
- Motor B;
- Motor 1;
- Motor 2.

Um motor é representado genericamente por três pinos:

`IN1 + IN2 + PWM`

Essa decisão permite que EasyMaker e EasyDuino utilizem futuramente os mesmos primitives e o mesmo protocolo, mesmo possuindo mapeamentos físicos diferentes.

Camadas:

`Atuadores`

↓

`ArduinoUnoPeripheral`

↓

`Protocolo Stage`

↓

`Firmware Arduino UNO`

Não criar conexão Serial, handshake, transporte ou firmware separado para MOTOR.

### 19.81. Contrato MOTOR_WRITE e MOTOR_STOP

Foram definidos dois comandos:

`MOTOR_WRITE = 0x17`

`MOTOR_STOP = 0x18`

#### MOTOR_WRITE

Controla exatamente um motor por comando.

Payload:

`[IN1, IN2, PWM_PIN, DIRECTION, SPEED]`

Onde:

- `IN1` = primeiro pino de direção;
- `IN2` = segundo pino de direção;
- `PWM_PIN` = enable/PWM;
- `DIRECTION = 0` → FORWARD;
- `DIRECTION = 1` → REVERSE;
- `SPEED` = `0..255`.

Semântica elétrica:

FORWARD:

`IN1 = HIGH`

`IN2 = LOW`

REVERSE:

`IN1 = LOW`

`IN2 = HIGH`

Antes de alterar a direção, o firmware desabilita momentaneamente o PWM.

Isso evita modificar as entradas da ponte H enquanto o motor permanece energizado.

`SPEED = 0` corresponde a parada livre:

- PWM desabilitado;
- IN1 LOW;
- IN2 LOW.

#### MOTOR_STOP

Payload:

`[IN1, IN2, PWM_PIN, STOP_MODE]`

Modos:

`0 = COAST`

`1 = BRAKE`

COAST:

- IN1 LOW;
- IN2 LOW;
- PWM/ENABLE 0.

BRAKE:

- IN1 LOW;
- IN2 LOW;
- PWM/ENABLE 255.

O protocolo continua utilizando as respostas existentes:

`ACK = 0x80`

`ERROR = 0xFF`

Nenhuma response específica de MOTOR foi criada.

### 19.82. Pinos e arbitragem de recursos

No Arduino UNO, `IN1` e `IN2` utilizam a mesma faixa já aceita para saída digital:

`2..19`

Isso representa:

- D2..D13;
- A0..A5 como digitais 14..19.

O pino PWM deve ser um dos seguintes:

- D3;
- D5;
- D6;
- D9;
- D10;
- D11.

Os três pinos devem ser distintos.

Portanto, são inválidos:

`IN1 == IN2`

`IN1 == PWM`

`IN2 == PWM`

MOTOR também participa da arbitragem já consolidada de Servo e Tone.

O firmware rejeita o comando quando:

- existe Servo anexado em IN1;
- existe Servo anexado em IN2;
- existe Servo anexado no PWM;
- IN1 corresponde ao tone ativo;
- IN2 corresponde ao tone ativo;
- PWM corresponde ao tone ativo;
- existe qualquer Servo anexado e o PWM solicitado é D9 ou D10.

A regra permanece:

`conflito de recurso → ERROR`

Não destacar Servo automaticamente e não roubar silenciosamente recursos ocupados.

### 19.83. Peripheral MOTOR

Arquivo:

`packages/scratch-vm/src/extensions/scratch3_arduino_uno/peripheral.js`

Foram adicionados:

`motorWrite(in1Pin, in2Pin, pwmPin, direction, speed)`

e:

`motorStop(in1Pin, in2Pin, pwmPin, stopMode)`

O peripheral recebe dados já preparados para o wire protocol.

Portanto:

`speed = 0..255`

A conversão de percentual da interface não deve acontecer no peripheral.

O peripheral realiza validação estrutural:

- conexão Stage ativa;
- tipos inteiros;
- faixa de IN1/IN2;
- PWM válido;
- pinos distintos;
- direção válida;
- velocidade válida;
- stop mode válido.

Conflitos dinâmicos de Servo e Tone permanecem no firmware, porque o firmware possui o estado real dos recursos físicos.

### 19.84. Blocos MOTOR na categoria Atuadores

A categoria interna:

`actuators`

passou a possuir três blocos:

1. Servo;
2. acionar motor;
3. parar motor.

Bloco de movimento:

`girar motor IN1 [IN1] IN2 [IN2] PWM [PWM] direção [DIRECTION] velocidade [SPEED] %`

Bloco de parada:

`parar motor IN1 [IN1] IN2 [IN2] PWM [PWM] modo [STOP_MODE]`

Menus de direção:

`frente → 0`

`trás → 1`

Menus de parada:

`livre → 0`

`frear → 1`

Os menus de IN1 e IN2 apresentam:

- D2..D13;
- A0..A5.

O menu PWM apresenta:

- D3;
- D5;
- D6;
- D9;
- D10;
- D11.

Os defaults atuais correspondem ao primeiro motor utilizado na validação EasyDuino:

`IN1 = D2`

`IN2 = D4`

`PWM = D3`

Esses defaults não alteram a genericidade do protocolo.

### 19.85. Velocidade MOTOR 0..100%

A interface apresenta velocidade de motor em percentual:

`0..100%`

Foi criado:

`ArgumentType.MOTOR_SPEED`

com o mapeamento:

`ArgumentType.MOTOR_SPEED → easyblox_motor_speed`

O shadow:

`easyblox_motor_speed`

reutiliza:

`EasyBloxRangeNumberField`

Configuração:

- default: `100`;
- min: `0`;
- max: `100`;
- precision: `1`.

A primitive `motorWrite(args)` converte o percentual para o wire protocol:

`Math.round(percent * 255 / 100)`

Exemplos:

`0% → 0`

`50% → 128`

`100% → 255`

O clamp interno da primitive permanece como segunda camada de proteção, mesmo com a limitação visual do campo.

A infraestrutura reutilizável passa oficialmente a atender:

`Servo → 0..180`

`PWM → 0..255`

`Motor → 0..100%`

### 19.86. Validação MOTOR v1

Testes automatizados aprovados:

Protocolo:

`packages/scratch-vm/test/unit/arduino-uno-protocol.js`

Resultado:

`116 pass / 0 fail`

Arduino UNO / peripheral:

`packages/scratch-vm/test/unit/arduino-uno.js`

Resultado:

`259 pass / 0 fail`

Atuadores:

`packages/scratch-vm/test/unit/actuators.js`

Resultado:

`30 pass / 0 fail`

Firmware Arduino UNO:

- FQBN: `arduino:avr:uno`;
- programa: `6216 bytes`;
- SRAM global: `298 bytes`;
- RAM disponível: `1750 bytes`.

Scratch VM build:

`APROVADO`

Scratch GUI:

- build dev aprovado;
- build dist aprovado;
- build dist standalone aprovado.

Validação física EasyDuino:

Motor 1:

`IN1 = D2`

`IN2 = D4`

`PWM = D3`

Foram validados:

- FORWARD;
- REVERSE;
- PWM 255;
- MOTOR_STOP COAST;
- MOTOR_STOP BRAKE.

Com PWM 128, o comando foi aceito e o canal foi energizado, porém o motor utilizado não venceu a inércia de partida.

Isso não representa falha do primitive.

Neste conjunto específico, BRAKE não apresentou diferença visual significativa em relação a COAST.

Motor 2:

`IN1 = D7`

`IN2 = D8`

`PWM = D5`

MOTOR_WRITE com PWM 255 e MOTOR_STOP em COAST foram fisicamente aprovados.

Também foi confirmada ausência de regressão básica do firmware:

- handshake Stage funcional;
- DIGITAL_WRITE D13 funcional.

Validação visual:

`MOTOR v1 ✅`

Os blocos aparecem corretamente na categoria Atuadores, o campo de velocidade `0..100%` funciona com slider e a execução física pelo EasyBlox foi aprovada.

### 19.87. Evolução futura — motores lógicos

Como melhoria futura de UX, poderá existir uma camada de configuração/instanciação lógica de motores.

Exemplo conceitual:

`Conectar motor [1] direção 1 [D2] direção 2 [D4] & PWM [D3]`

Depois disso, os blocos operacionais poderiam trabalhar somente com o identificador:

`Acionar motor [1] no sentido [frente] com velocidade [100] %`

e:

`parar motor [1]`

A associação poderia manter internamente:

`Motor 1 → D2 / D4 / D3`

`Motor 2 → D7 / D8 / D5`

Essa funcionalidade pertence a uma camada superior de UX ou perfil de placa.

Ela não altera o contrato MOTOR v1.

O primitive genérico permanece baseado em:

`IN1 + IN2 + PWM`

Não implementar a instanciação lógica durante o checkpoint MOTOR v1.

### 19.88. Próximo primitive

Com MOTOR v1 concluído, a sequência Stage passa a ser:

1. `DIGITAL_WRITE`;
2. `DIGITAL_READ`;
3. `ANALOG_READ`;
4. `PWM_WRITE`;
5. `TONE_START / TONE_STOP`;
6. `SERVO_WRITE`;
7. `MOTOR_WRITE / MOTOR_STOP`.

O próximo primitive oficial é:

`RELÉ`

### 19.89. RELÉ v1 — princípio arquitetural

O primitive de RELÉ foi implementado na base Arduino UNO Stage como o terceiro atuador da categoria interna:

`Atuadores`

A arquitetura permanece:

`Atuadores`

↓

`ArduinoUnoPeripheral`

↓

`Protocolo Stage`

↓

`Firmware Arduino UNO`

A extensão `actuators` não possui:

- conexão Serial própria;
- handshake próprio;
- transporte próprio;
- firmware próprio.

Ela continua reutilizando exatamente o peripheral registrado pelo Arduino UNO.

O bloco de RELÉ representa semanticamente:

`ligado / desligado`

e não deve expor diretamente:

`HIGH / LOW`

ao usuário.

### 19.90. Contrato RELAY_WRITE

Comando Stage:

`RELAY_WRITE = 0x19`

Payload:

`[PIN, STATE]`

Onde:

- `PIN` ocupa 1 byte;
- `STATE` ocupa 1 byte;
- `STATE = 0` → OFF / desligado;
- `STATE = 1` → ON / ligado.

Respostas:

`ACK = 0x80`

`ERROR = 0xFF`

Nenhuma nova response específica foi criada.

Pinos permitidos:

`D2..D13`

e:

`A0..A5`

representados internamente como:

`14..19`

Semântica elétrica genérica Arduino UNO:

`desligado → LOW`

`ligado → HIGH`

Essa relação não deve ser confundida com a semântica educacional do bloco.

Caso um perfil de hardware futuro utilize relé ativo em LOW, a inversão deverá ficar no perfil específico da placa/módulo.

A interface deve continuar mostrando somente:

`ligado`

e:

`desligado`

### 19.91. Arbitragem de recursos do RELÉ

O firmware rejeita `RELAY_WRITE` quando:

- `PIN < 2`;
- `PIN > 19`;
- `STATE > 1`;
- existe Servo anexado no mesmo pino;
- existe Tone ativo no mesmo pino.

A política permanece:

`conflito de recurso → ERROR`

Não realizar:

- detach automático de Servo;
- interrupção automática de Tone;
- apropriação silenciosa de recursos.

O RELÉ não introduz ownership persistente dos pinos utilizados pelo MOTOR.

O contrato MOTOR v1 permanece inalterado.

### 19.92. Peripheral RELÉ

Arquivo:

`packages/scratch-vm/src/extensions/scratch3_arduino_uno/peripheral.js`

Método:

`relayWrite(pin, state)`

Responsabilidades do peripheral:

- exigir Stage conectado;
- exigir `pin` inteiro;
- exigir `state` inteiro;
- limitar `pin` a `2..19`;
- limitar `state` a `0..1`;
- enviar `RELAY_WRITE` com `[PIN, STATE]`.

A arbitragem dinâmica com Servo e Tone permanece no firmware.

Essa separação deve ser preservada porque o firmware é a camada que possui o estado real dos recursos físicos.

### 19.93. Bloco RELÉ em Atuadores

A categoria `Atuadores` passa a possuir quatro blocos:

1. Servo;
2. acionar motor;
3. parar motor;
4. relé.

Bloco:

`definir relé no pino [PIN] como [STATE]`

Default:

`PIN = D12`

Estado padrão:

`ligado`

Menu:

`ligado → 1`

`desligado → 0`

Menu de pinos:

- D2;
- D3;
- D4;
- D5;
- D6;
- D7;
- D8;
- D9;
- D10;
- D11;
- D12;
- D13;
- A0;
- A1;
- A2;
- A3;
- A4;
- A5.

O menu próprio:

`relayPins`

deve ser mantido semanticamente separado de:

`motorDigitalPins`

mesmo que atualmente ambos apresentem a mesma faixa de pinos digitais.

Não foi necessário criar:

- `ArgumentType` específico;
- shadow block específico;
- campo numérico customizado;
- alteração no `EasyBloxRangeNumberField`.

### 19.94. Firmware RELÉ

Arquivo:

`packages/scratch-vm/firmware/arduino-uno/stage/stage.ino`

Foram adicionados:

`COMMAND_RELAY_WRITE = 0x19`

e:

`handleRelayWrite()`

Fluxo do handler:

1. valida payload de 2 bytes;
2. lê PIN;
3. lê STATE;
4. valida PIN;
5. valida STATE;
6. verifica Servo no mesmo pino;
7. verifica Tone no mesmo pino;
8. configura o pino como OUTPUT;
9. aplica LOW ou HIGH;
10. responde ACK.

Compilação:

`arduino:avr:uno`

Resultado:

- programa: `6284 bytes / 32256 bytes` — 19%;
- SRAM global: `298 bytes / 2048 bytes` — 14%;
- RAM disponível: `1750 bytes`.

Comparação com MOTOR:

`6216 → 6284 bytes`

Aumento:

`68 bytes`

SRAM:

`298 → 298 bytes`

Nenhum aumento.

Upload aprovado pela:

`COM11`

### 19.95. Validação automatizada RELÉ

Protocolo:

`packages/scratch-vm/test/unit/arduino-uno-protocol.js`

Resultado:

`125 pass / 0 fail`

Cobertura adicionada para:

- opcode `RELAY_WRITE`;
- payload `[PIN, STATE]`;
- comprimento;
- checksum.

Arduino UNO / peripheral:

`packages/scratch-vm/test/unit/arduino-uno.js`

Resultado:

`272 pass / 0 fail`

Cobertura adicionada para:

- envio após handshake;
- OFF;
- ON;
- frames gerados;
- operação antes do handshake;
- limites de PIN;
- PIN não inteiro;
- limites de STATE;
- STATE não inteiro.

Atuadores:

`packages/scratch-vm/test/unit/actuators.js`

Resultado:

`38 pass / 0 fail`

Cobertura adicionada para:

- total de quatro blocos;
- opcode;
- texto visual;
- default D12;
- default ligado;
- menu de estados;
- lista completa de pinos;
- conversão STRING → NUMBER;
- delegação ao peripheral compartilhado.

Scratch VM:

`webpack 5.109.2 compiled successfully`

Scratch GUI:

- `build:dev` aprovado;
- `build:dist` aprovado com 2 warnings;
- `build:dist-standalone` aprovado com 2 warnings.

Os warnings de tamanho de assets/entrypoints e o aviso do Browserslist/caniuse-lite não são bloqueantes e não justificam atualização de dependências neste checkpoint.

### 19.96. Validação física RELÉ

Após upload do firmware, foi realizado teste direto do protocolo pela COM11.

Foram enviados:

`RELAY_WRITE D13 ON`

e:

`RELAY_WRITE D13 OFF`

ACK de ON:

`FF 55 01 01 80 00 80`

ACK de OFF:

`FF 55 01 02 80 00 83`

Esse teste confirmou o transporte, parsing, execução do comando e respostas ACK.

A validação física visual end-to-end foi realizada posteriormente pelo próprio EasyBlox.

Hardware:

`EasyDuino`

Porta:

`COM11`

Canal utilizado:

`D11`

O D11 corresponde a um dos canais do LED RGB integrado da EasyDuino e permite observação visual imediata.

Blocos executados:

`definir relé no pino [D11] como [ligado]`

e:

`definir relé no pino [D11] como [desligado]`

Resultado:

`APROVADO`

Foi confirmada a cadeia completa:

`bloco visual`

↓

`relayWrite(args)`

↓

`ArduinoUnoPeripheral.relayWrite()`

↓

`RELAY_WRITE 0x19`

↓

`firmware Stage`

↓

`hardware`

Resultado:

`RELÉ v1 ✅`

Para futuras validações visuais de saídas digitais na EasyDuino, preferir:

- D9;
- D10;
- D11.

Quando não existir conflito de recurso, utilizar preferencialmente:

`D11`

Essa diretriz é exclusiva de teste/laboratório e não altera o contrato genérico do Arduino UNO.

### 19.97. Estado após RELÉ v1

Primitives consolidados no Modo Palco:

1. `DIGITAL_WRITE`;
2. `DIGITAL_READ`;
3. `ANALOG_READ`;
4. `PWM_WRITE`;
5. `TONE_START / TONE_STOP`;
6. `SERVO_WRITE`;
7. `MOTOR_WRITE / MOTOR_STOP`;
8. `RELAY_WRITE`.

O checkpoint RELÉ v1 foi fechado oficialmente em:

- branch: `feat/easyblox-arduino-uno-foundation`;
- commit: `049289c13e1be7a7fd4ef415e9c2ad856a215ce1`;
- mensagem: `feat: add Arduino UNO Stage relay control`.

A branch local e `origin/feat/easyblox-arduino-uno-foundation` foram confirmadas no mesmo commit.

A alteração local independente:

`packages/scratch-gui/src/components/action-menu/icon--sprite.svg`

permaneceu corretamente fora desse checkpoint.

Antes de iniciar o próximo primitive funcional, foi decidido consolidar o contrato visual das categorias de hardware.

O próximo primitive continua sendo:

`ULTRASSÔNICO`

### 19.98. Contrato visual das categorias de hardware

As categorias de hardware do EasyBlox devem possuir identidades visuais próprias e previsíveis.

Extensões que não declaram cores utilizam atualmente o fallback do Runtime:

- `color1: #0FBD8C`;
- `color2: #0DA57A`;
- `color3: #0B8E69`.

Esse comportamento foi identificado em:

`packages/scratch-vm/src/engine/runtime.js`

O Runtime já é responsável por transferir `color1`, `color2` e `color3` declarados pelo `getInfo()` para a categoria apresentada pela interface.

Portanto:

**não implementar regras especiais de cor na Scratch GUI.**

Cada extensão de categoria deve declarar explicitamente sua própria paleta no objeto retornado por:

`getInfo()`

#### Arduino UNO

Paleta:

- `color1: #0FBD8C`;
- `color2: #0DA57A`;
- `color3: #0B8E69`.

Identidade visual:

`verde turquesa`

Essa é também a paleta padrão atualmente utilizada pelo Runtime para extensões sem cores explícitas.

#### Atuadores

Paleta oficial:

- `color1: #2E7D32`;
- `color2: #1B5E20`;
- `color3: #124116`.

Identidade visual:

`verde escuro`

Implementação:

`packages/scratch-vm/src/extensions/scratch3_actuators/index.js`

O `getInfo()` de Atuadores passou a declarar explicitamente:

- `color1`;
- `color2`;
- `color3`.

Teste automatizado:

`packages/scratch-vm/test/unit/actuators.js`

O teste também valida os três valores da paleta.

Resultado após a alteração:

`9 testes / 41 assertions / 41 aprovadas`

Validação visual:

`APROVADA`

Foi confirmado no EasyBlox que:

- Arduino UNO permanece em verde turquesa;
- Atuadores aparece em verde escuro;
- blocos, menus e campos mantêm contraste adequado;
- as duas categorias ficam claramente distinguíveis;
- a categoria Atuadores também permanece visualmente diferenciada da categoria nativa Operadores.

#### Sensores Arduino

Paleta oficial reservada:

- `color1: #29B6F6`;
- `color2: #039BE5`;
- `color3: #0277BD`.

Identidade visual:

`azul claro vivo`

A escolha deve permanecer visualmente distinta da categoria nativa `Sensores` do Scratch/EasyBlox, que utiliza uma tonalidade azul mais suave.

Nesta fase do projeto, a categoria é denominada:

`Sensores Arduino`

A nomenclatura acompanha a plataforma Arduino UNO e não vincula o software à marca EasyMaker.

A nomenclatura poderá ser reorganizada futuramente com a incorporação das placas EasyMaker e EasyDuino, caso a arquitetura de categorias passe a ser organizada por plataforma ou família de hardware.

Consequentemente, o próximo primitive:

`ULTRASSÔNICO`

deverá nascer dentro desse contrato visual de Sensores Arduino.

#### Displays / Matriz

Paleta oficial reservada:

- `color1: #E53935`;
- `color2: #C62828`;
- `color3: #8E0000`.

Identidade visual:

`vermelho`

Essa categoria deverá concentrar dispositivos cuja responsabilidade principal seja apresentação visual de informações, incluindo inicialmente:

- matriz 8×8;
- display de 7 segmentos;
- LCD 16×2 I2C.

#### Regra para os próximos contratos

A partir deste checkpoint, qualquer novo primitive deve definir primeiro a categoria conceitual à qual pertence.

As famílias visuais oficiais são:

`Arduino UNO → verde turquesa`

`Atuadores → verde escuro`

`Sensores Arduino → azul claro vivo`

`Displays / Matriz → vermelho`

Essa decisão faz parte da arquitetura do EasyBlox e não deve ser redefinida individualmente por primitive.

Se uma nova família conceitual surgir no futuro, sua identidade visual deverá ser definida no nível da categoria antes da implementação dos respectivos blocos.

### 19.99. ULTRASSÔNICO e DHT — estado atual de Sensores Arduino

A categoria `Sensores Arduino` utiliza a paleta oficial:

- `color1: #29B6F6`;
- `color2: #039BE5`;
- `color3: #0277BD`.

Os primeiros primitives consolidados nessa categoria são:

1. `ULTRASONIC_READ`;
2. `DHT_READ`.

O ULTRASSÔNICO utiliza:

- comando `0x1A`;
- resposta `0x93`;
- payload de requisição `[TRIG, ECHO]`;
- resposta `[TRIG, ECHO, DIST_HI, DIST_LO]`;
- distância transportada em milímetros;
- conversão para centímetros realizada pela extensão `Sensores Arduino`;
- pinos genéricos `D2..D13` e `A0..A5`;
- padrão visual A2 como TRIG e A3 como ECHO.

O DHT utiliza:

- comando `DHT_READ = 0x1B`;
- resposta `DHT_READ = 0x94`;
- payload de requisição `[PIN, TYPE]`;
- `TYPE = 0` para temperatura;
- `TYPE = 1` para umidade;
- resposta `[PIN, TEMP_H, TEMP_L, HUM_H, HUM_L]`;
- temperatura e umidade transportadas como `uint16` big-endian em centésimos.

O bloco visual aprovado é um único reporter:

`[temperatura/umidade] do DHT no pino [D12]`

O menu de pinos do DHT é restrito a:

`D2..D13`

O padrão da EasyDuino é:

`D12`

A extensão JavaScript converte:

- temperatura bruta `/ 100` para graus Celsius;
- umidade bruta `/ 100` para percentual.

### 19.100. DHT11 — leitura física no firmware Stage

A leitura DHT11 é realizada diretamente pelo firmware:

`packages/scratch-vm/firmware/arduino-uno/stage/stage.ino`

Não foi adicionada biblioteca externa para o DHT.

Durante o desenvolvimento, abordagens baseadas em `digitalRead() + micros()` e chamadas sequenciais de `pulseIn()` não se mostraram adequadas para a temporização contínua do protocolo DHT11.

A implementação final utiliza:

- `digitalPinToPort()`;
- `digitalPinToBitMask()`;
- `portInputRegister()`;
- leitura direta do registrador AVR;
- contagem dos períodos LOW e HIGH;
- interrupções desabilitadas somente durante a janela crítica da captura dos 40 bits;
- comparação entre a duração HIGH e o período LOW anterior;
- validação do checksum do DHT11.

O firmware mantém a linha LOW por aproximadamente 20 ms para iniciar a comunicação e libera posteriormente o barramento com `INPUT_PULLUP`.

Falhas de temporização ou checksum resultam em:

`RESPONSE_ERROR`

### 19.101. Cache DHT por pino

Como reporters Scratch podem ser avaliados muitas vezes por segundo, o firmware não deve realizar uma nova transação física DHT a cada consulta.

Foi adotado:

`DHT_CACHE_INTERVAL_MS = 2000`

O cache é independente por pino para todos os pinos suportados:

`D2..D13`

Cada entrada armazena:

- umidade;
- temperatura;
- timestamp;
- estado válido/inválido.

Consequentemente:

```text
D12 → leitura física → cache D12
D11 → leitura física → cache D11
D12 → reutiliza cache D12 quando ainda válido
```

Um DHT conectado a um pino não invalida o cache de outro pino.

Após a implementação do cache independente por pino, a compilação Arduino UNO apresentou:

Flash: 7734 / 32256 bytes — 23%;
SRAM global: 382 / 2048 bytes — 18%;
SRAM restante: 1666 bytes.

### 19.102. Arbitragem de recursos do DHT

O DHT aceita apenas pinos digitais:

D2..D13

Uma requisição é rejeitada quando:

o payload não possui exatamente 2 bytes;
o pino está fora de D2..D13;
TYPE não é 0 ou 1;
existe Servo anexado ao mesmo pino;
existe Tone ativo no mesmo pino.

Em qualquer uma dessas situações, o firmware responde:

RESPONSE_ERROR

### 19.103. Peripheral DHT

O ArduinoUnoPeripheral mantém leituras pendentes em:

_pendingDhtReads

Cada requisição é associada à sequence do protocolo Stage.

O método:

dhtRead(pin, type)

valida:

conexão Stage ativa;
pino inteiro em D2..D13;
TYPE inteiro igual a 0 ou 1.

Quando chega RESPONSE_DHT_READ, o peripheral reconstrói:

temperature = TEMP_H << 8 | TEMP_L
humidity    = HUM_H  << 8 | HUM_L

e resolve a Promise com:

{
    temperature,
    humidity
}

Em RESPONSE_ERROR ou reset da conexão, a leitura pendente é resolvida com:

null

### 19.104. Validação automatizada do DHT

Após a implementação completa do DHT, foram executadas regressões nas três camadas JavaScript.

Resultados:

Protocolo Arduino UNO

packages/scratch-vm/test/unit/arduino-uno-protocol.js

22 suites;
143 assertions;
143 aprovadas;
0 falhas.
ArduinoUnoPeripheral

packages/scratch-vm/test/unit/arduino-uno.js

35 suites;
317 assertions;
317 aprovadas;
0 falhas.
Sensores Arduino

packages/scratch-vm/test/unit/sensors.js

10 suites;
38 assertions;
38 aprovadas;
0 falhas.

Total do checkpoint:

498 assertions / 498 aprovadas

Também foi aprovado:

git diff --check

### 19.105. Validação física e visual do DHT

A validação física foi realizada com:

EasyDuino;
porta COM11;
DHT11 integrado;
sinal no pino D12;
baud rate 115200.

Uma resposta física validada foi:

FF 55 01 01 94 05 0C 09 60 14 B4 54

correspondendo a:

temperatura: 24,00 °C;
umidade: 53,00 %.

Após a implementação final do cache por pino, uma nova validação retornou:

DHT TEMP: FF 55 01 01 94 05 0C 0A 8C 22 60 59
DHT HUM:  FF 55 01 02 94 05 0C 0A 8C 22 60 5A

correspondendo a:

temperatura: 27,00 °C;
umidade: 88,00 %.

As duas consultas foram realizadas no mesmo pino em intervalo inferior a 2 segundos, validando também o reaproveitamento do cache.

Na interface EasyBlox foi confirmado:

bloco DHT visível em Sensores Arduino;
dropdown temperatura / umidade;
pino padrão D12;
leitura física de temperatura funcionando;
leitura física de umidade funcionando.

Resultado:

DHT v1 APROVADO END-TO-END

### 19.106. Estado atual dos primitives Stage Arduino UNO

Primitives consolidados:

DIGITAL_WRITE;
DIGITAL_READ;
ANALOG_READ;
PWM_WRITE;
TONE_START / TONE_STOP;
SERVO_WRITE;
MOTOR_WRITE / MOTOR_STOP;
RELAY_WRITE;
ULTRASONIC_READ;
DHT_READ.

### 19.107. Diretriz de Displays — Stage e Upload

Durante a evolução da base Arduino UNO foi avaliado o uso da matriz de LED 8×8 com controlador MAX7219 no Modo Palco.

Embora operações isoladas tenham funcionado, a integração completa não atingiu o nível de estabilidade exigido para uso contínuo no Stage. Por decisão arquitetural, o EasyBlox não manterá suporte Stage ao MAX7219 nesta fase.

A divisão funcional adotada passa a ser:

Modo Palco:

- LCD 16×2 I2C.

Modo Upload:

- LCD 16×2 I2C;
- display de 7 segmentos TM1637;
- matriz de LED 8×8 MAX7219.

O TM1637 também fica reservado ao Modo Upload e não deve ser implementado como primitive Stage neste ciclo.

Essa decisão não significa que MAX7219 ou TM1637 sejam incompatíveis com Arduino UNO. Trata-se de uma definição de arquitetura do EasyBlox para manter o Modo Palco previsível e estável.

### 19.108. Editor visual reutilizável da matriz 8×8

A infraestrutura visual desenvolvida para a matriz 8×8 deve ser preservada para o futuro Modo Upload.

Foram mantidos:

- `ArgumentType.MATRIX_8X8`;
- shadow `easyblox_matrix_8x8`;
- campo reutilizável `field_easyblox_matrix_8x8`;
- serialização da matriz em 8 bytes representados por 16 caracteres hexadecimais;
- editor gráfico 8×8;
- persistência do valor no projeto;
- padrão inicial visual em forma de coração;
- ações Limpar, Preencher e Inverter;
- padrões visuais pré-definidos.

Também permanece a infraestrutura genérica:

- `ArgumentType.PERCENTAGE`;
- shadow `easyblox_percentage`.

Esses elementos estão desacoplados do protocolo Stage e poderão ser reutilizados posteriormente pelos blocos do Modo Upload.

### 19.109. Próximo primitive Stage — LCD 16×2 I2C

O próximo primitive oficial do ciclo Arduino UNO passa a ser:

LCD 16×2 I2C

A implementação utilizará exclusivamente a interface I2C.

No Arduino UNO:

- SDA utiliza A4;
- SCL utiliza A5.

Esses pinos pertencem ao barramento I2C e não devem ser expostos como configuração cotidiana do bloco LCD.

Da mesma forma, endereços comuns como `0x27` e `0x3F` são endereços de dispositivos I2C, e não pinos.

A experiência desejada é permitir ao usuário configurar o LCD sem precisar conhecer previamente o endereço do módulo.

A arquitetura deverá preparar uma camada reutilizável de gerenciamento do barramento I2C, capaz de servir futuramente a outros dispositivos.

Diretriz inicial:

`I2C Bus Manager`

Responsabilidades previstas:

- varrer o barramento I2C;
- verificar se um endereço responde;
- registrar dispositivos detectados;
- permitir que extensões reutilizem o mesmo mecanismo de descoberta.

A detecção de um endereço ocupado não deve ser tratada automaticamente como identificação inequívoca do tipo de dispositivo.

O desenvolvimento do LCD deverá continuar no próximo checkpoint, mantendo a disciplina:

protocolo → testes → firmware → compile → peripheral → testes → build → hardware → bloco visual → documentação → commit.

A revisão da cor visual da categoria Displays / Matriz permanece pendente e deverá ser tratada separadamente desta decisão arquitetural.

### 19.110. LCD 16×2 I2C — implementação Stage concluída

O primitive oficial de LCD 16×2 I2C foi concluído no Modo Palco do Arduino UNO.

A implementação utiliza o barramento I2C padrão da placa:

- SDA: A4;
- SCL: A5.

Esses pinos não são expostos ao usuário nos blocos.

Também não é necessário informar manualmente o endereço I2C do módulo.

A versão atual realiza detecção automática dos endereços mais comuns:

- `0x27`;
- `0x3F`.

A implementação não depende de biblioteca externa `LiquidCrystal_I2C`.

O firmware utiliza diretamente:

`Wire.h`

e implementa a comunicação necessária com o expansor PCF8574 e o controlador compatível com HD44780.

O mapeamento adotado nesta versão é:

- P0 → RS;
- P1 → RW;
- P2 → EN;
- P3 → backlight;
- P4–P7 → D4–D7.

O backlight permanece ligado nesta primeira versão.

### 19.111. Contrato Stage do LCD 16×2 I2C

Foram definidos os seguintes comandos:

`LCD_INIT = 0x1C`

`LCD_WRITE = 0x1D`

`LCD_CLEAR = 0x1E`

`LCD_MODE = 0x1F`

O bloco de inicialização não expõe endereço, SDA ou SCL.

Blocos visuais implementados:

`iniciar LCD 16x2 I2C`

`escrever [texto] no LCD linha [1] coluna [1]`

`limpar LCD`

`definir LCD [modo]`

A interface utiliza linha e coluna iniciando em 1.

O protocolo utiliza índices iniciando em 0.

Portanto:

- linha visual 1 → protocolo 0;
- linha visual 2 → protocolo 1;
- coluna visual 1 → protocolo 0;
- coluna visual 16 → protocolo 15.

O payload de `LCD_WRITE` é:

`[ROW, COL, ...TEXT_BYTES]`

Não existe byte adicional de tamanho de texto.

O firmware utiliza o tamanho do próprio payload recebido.

Não há quebra automática de linha.

Textos maiores que o espaço restante na linha são truncados.

### 19.112. Normalização de texto do LCD

Antes do envio ao firmware, o `ArduinoUnoPeripheral` normaliza o texto destinado ao LCD.

A estratégia atual utiliza normalização Unicode NFD e remoção de marcas diacríticas.

Exemplo validado fisicamente:

`Olá!`

é enviado e exibido como:

`Ola!`

Caracteres imprimíveis não representáveis na política ASCII atual podem ser convertidos para:

`?`

Essa decisão evita depender de variações de tabela de caracteres existentes entre diferentes controladores LCD compatíveis.

O comportamento físico observado está de acordo com o contrato definido.

### 19.113. Proteção do barramento I2C após inicialização do LCD

Após a inicialização bem-sucedida do LCD, os pinos A4 e A5 passam a ser protegidos no firmware contra uso conflitante por primitives comuns.

Internamente:

- A4 corresponde ao pino digital 18;
- A5 corresponde ao pino digital 19.

A proteção é aplicada às operações Stage que poderiam reutilizar esses pinos de forma incompatível.

A intenção é preservar a integridade do barramento I2C enquanto o LCD estiver ativo.

A arquitetura continua preparada para futura evolução de gerenciamento compartilhado do barramento I2C, porém neste checkpoint a descoberta do LCD é realizada diretamente pelo firmware através da sondagem dos endereços `0x27` e `0x3F`.

### 19.114. Categoria visual Displays

Foi criada a extensão interna:

`packages/scratch-vm/src/extensions/scratch3_displays/`

ID técnico:

`displays`

Nome visual:

`Displays`

A extensão reutiliza o mesmo `ArduinoUnoPeripheral` já pertencente à extensão Arduino UNO.

Portanto:

`Arduino UNO → proprietário da conexão Serial e do peripheral`

`Displays → camada visual que reutiliza o peripheral Arduino UNO`

Não existe:

- segunda conexão Serial;
- segundo handshake;
- segundo transporte;
- firmware independente para Displays.

O `ExtensionManager` passou a tratar `displays` como companion do Arduino UNO, juntamente com as categorias já existentes.

A cor atualmente utilizada pela categoria Displays permanece provisória e deverá ser revista em checkpoint visual separado.

### 19.115. Correção global de concorrência nas escritas Serial

Durante a validação física do LCD foi identificado um problema que não era específico do display.

Sequências de comandos Stage executadas sem blocos `esperar` podiam provocar:

`Scratch perdeu a conexão com Arduino UNO`

O mesmo comportamento foi reproduzido utilizando vários comandos consecutivos de Relé, demonstrando que a causa era global.

A investigação mostrou que:

`ArduinoUnoPeripheral._sendCommand()`

executava:

`Serial.write(frame)`

e retornava imediatamente a sequence do protocolo.

A camada `Serial`, por sua vez, encaminhava cada chamada diretamente para:

`transport.write(data)`

Sem serialização, vários comandos executados no mesmo ciclo da Scratch VM podiam produzir múltiplas escritas simultâneas no transporte.

A reprodução automatizada confirmou:

`3 chamadas consecutivas → 3 transport.write() ativos simultaneamente`

Esse comportamento não é permitido na nova arquitetura.

Foi adicionada uma fila global de escrita em:

`packages/scratch-vm/src/io/serial.js`

A regra agora é:

`FRAME 1 → transport.write() → conclusão → FRAME 2 → conclusão → FRAME 3`

Somente uma escrita física pode permanecer ativa por vez.

A ordem original dos frames deve ser preservada.

Se uma escrita falhar e a conexão for considerada perdida, comandos que ainda estavam aguardando na fila não devem continuar sendo enviados para o transporte desconectado.

Essa regra é global e beneficia todos os primitives Stage que utilizam a infraestrutura compartilhada `Serial`.

### 19.116. Testes de regressão da fila Serial

Foram adicionados testes específicos em:

`packages/scratch-vm/test/unit/serial.js`

Eles validam:

- apenas um `transport.write()` ativo por vez;
- preservação da ordem das escritas;
- interrupção de comandos enfileirados após falha de transporte;
- manutenção do fluxo de desconexão e reset já existente.

Resultado:

`29 pass`

`0 fail`

Os testes antigos do Arduino UNO também foram adaptados para considerar que o despacho físico da escrita agora é assíncrono.

A API dos primitives não foi alterada para exigir espera do usuário.

`_sendCommand()` continua fornecendo imediatamente a sequence necessária ao protocolo.

Resultado da suíte Arduino UNO:

`363 pass`

`0 fail`

### 19.117. Validação física da correção Serial

A falha foi reproduzida originalmente com vários blocos de Relé consecutivos sem qualquer bloco `esperar`.

Antes da correção:

`comandos consecutivos → perda da conexão`

Após a implementação da fila Serial, a mesma sequência foi executada novamente.

Resultado:

- todos os comandos foram processados;
- nenhum bloco `esperar` foi necessário;
- o Arduino UNO permaneceu conectado;
- nenhuma mensagem de perda de conexão foi apresentada.

Portanto, a serialização das escritas foi validada também em hardware real.

Não adicionar temporizações artificiais aos projetos como solução para esse problema.

### 19.118. Validação física do LCD 16×2 I2C

Após a correção da fila Serial, o LCD foi novamente validado com comandos encadeados diretamente.

Fluxo utilizado:

`iniciar LCD 16x2 I2C`

→

`escrever [Olá!] no LCD linha [1] coluna [1]`

→

`limpar LCD`

sem blocos intermediários de espera.

Resultado físico:

- LCD inicializado;
- texto exibido;
- normalização `Olá! → Ola!` confirmada;
- limpeza executada;
- conexão Stage permaneceu estável.

Portanto:

`LCD 16×2 I2C — STAGE MODE VALIDADO EM HARDWARE`

A validação física principal deste checkpoint cobre inicialização, escrita, normalização textual, limpeza e estabilidade de comandos consecutivos.

Os modos adicionais de `LCD_MODE` possuem cobertura automatizada e permanecem disponíveis pela implementação atual.

### 19.119. Testes finais do checkpoint LCD / Displays

Resultados finais:

`packages/scratch-vm/test/unit/serial.js`

- 29 pass;
- 0 fail.

`packages/scratch-vm/test/unit/arduino-uno.js`

- 363 pass;
- 0 fail.

`packages/scratch-vm/test/unit/arduino-uno-protocol.js`

- 192 pass;
- 0 fail.

`packages/scratch-vm/test/unit/displays.js`

- 18 pass;
- 0 fail.

`packages/scratch-vm/test/integration/internal-extension.js`

- 44 pass;
- 0 fail.

Build final da GUI:

`webpack 5.109.2 compiled successfully`

Compilação final do firmware para:

`arduino:avr:uno`

Resultado:

- Flash: `10426 bytes (32%)`;
- SRAM global: `605 bytes (29%)`;
- SRAM restante para variáveis locais: `1443 bytes`.

### 19.120. UX global para blocos longos no flyout

Durante a validação visual da categoria Displays foi retomado um problema de UX já identificado anteriormente.

Blocos maiores que a largura normal do flyout devem permanecer recortados enquanto não estão em interação, preservando a largura da paleta.

Ao posicionar o mouse sobre um bloco longo, porém, o bloco completo deve poder avançar visualmente sobre a área de scripts.

Foi implementada em:

`packages/scratch-gui/src/components/blocks/blocks.css`

uma regra de hover que libera temporariamente o `overflow` do flyout quando um bloco arrastável está sob o ponteiro.

Resultado validado visualmente:

- largura normal da paleta preservada;
- blocos longos não aumentam permanentemente o flyout;
- hover revela o bloco completo;
- comportamento aplicado globalmente, não apenas à categoria Displays.

### 19.121. Revisão da decisão sobre MAX7219 em Stage Mode

A seção 19.107 registrou a decisão anterior de reservar a matriz de LED 8×8 MAX7219 ao Modo Upload.

Essa decisão foi baseada na instabilidade observada durante os testes Stage realizados naquele momento.

Após a descoberta e correção da concorrência nas escritas do transporte Serial, essa conclusão deixa de ser considerada definitiva.

O novo status é:

`MAX7219 — STAGE MODE PENDENTE DE REVALIDAÇÃO`

Isso não significa que o suporte Stage já esteja aprovado.

Também não significa que a implementação anterior estava necessariamente correta.

Significa apenas que existe agora uma causa global comprovada que pode ter interferido nos testes anteriores e, portanto, a matriz deve ser novamente avaliada utilizando a camada Serial corrigida.

A referência ao comportamento do PictoBlox permanece útil como comparação de produto, porém não deve ser tratada como limitação técnica automática do EasyBlox.

O EasyBlox utiliza protocolo Stage e firmware próprios e pode oferecer recursos diferentes quando tecnicamente estáveis.

A infraestrutura visual já desenvolvida para a matriz 8×8 deve permanecer preservada.

### 19.122. Próximo passo após o checkpoint LCD

Após documentação, revisão do diff, staging explícito, commit e push deste checkpoint, o próximo trabalho deverá ser:

`revalidar a matriz de LED 8×8 MAX7219 no Modo Palco com a fila Serial corrigida`

A revalidação deverá ser incremental:

1. inicialização da matriz;
2. desenho estático único;
3. alteração isolada de brilho;
4. múltiplos desenhos consecutivos sem `esperar`;
5. sequência rápida de frames;
6. observação da estabilidade da conexão Stage;
7. somente então decidir definitivamente entre Stage + Upload ou Upload apenas.

Não alterar a decisão do TM1637 neste checkpoint.

O display de 7 segmentos TM1637 continua reservado ao Modo Upload até investigação específica futura.

### 19.123. Revalidação da matriz de LED 8×8 MAX7219 no Modo Palco

A revalidação da matriz MAX7219 prevista nas seções 19.121 e 19.122 foi concluída.

O suporte Stage foi restaurado sobre a infraestrutura Serial corrigida e validado novamente desde o protocolo até o hardware real.

Contrato Stage atual:

- `MATRIX_WRITE = 0x20`;
- `MATRIX_BRIGHTNESS = 0x21`.

Os valores `0x1C` e `0x1D` não foram reutilizados porque atualmente pertencem aos comandos do LCD 16×2 I2C.

`MATRIX_WRITE` utiliza o payload:

`[DIN, CS, CLK, ROW0, ROW1, ROW2, ROW3, ROW4, ROW5, ROW6, ROW7]`

`MATRIX_BRIGHTNESS` utiliza:

`[DIN, CS, CLK, BRIGHTNESS]`

A implementação do firmware utiliza diretamente:

- `shiftOut`;
- protocolo MAX7219;
- registradores de decode;
- intensidade;
- scan limit;
- shutdown;
- display test.

Nenhuma biblioteca externa para MAX7219 é necessária no firmware Stage.

O bloco de configuração continua sendo apenas uma configuração lógica da extensão Displays:

`configurar matriz 8×8 DIN [DIN] CS [CS] CLK [CLK]`

Ele armazena localmente os pinos utilizados pelos comandos seguintes.

Configuração padrão EasyMaker:

- DIN = A4;
- CS = A5;
- CLK = D13.

Os blocos Stage atuais são:

- `configurar matriz 8×8 DIN [DIN] CS [CS] CLK [CLK]`;
- `mostrar na matriz [MATRIX]`;
- `limpar matriz`;
- `definir brilho da matriz para [BRIGHTNESS] %`.

O editor visual 8×8 anteriormente desenvolvido foi preservado.

O desenho padrão aprovado continua sendo:

`0066FFFF7E3C1800`

correspondente ao coração utilizado como imagem inicial do campo da matriz.

Status atualizado:

`MAX7219 — STAGE MODE VALIDADO`

A decisão provisória anterior de reservar a MAX7219 exclusivamente ao Modo Upload fica superada por esta revalidação.

O objetivo futuro passa a ser:

`MAX7219 — Stage + Upload`

quando o gerador de código do Modo Upload for implementado para esse dispositivo.

### 19.124. Controle de fluxo por ACK para comandos da MAX7219

A fila global de transmissão Serial resolveu a concorrência de escritas no transporte, porém os testes físicos com grande quantidade de frames consecutivos revelaram uma segunda limitação.

Sem pausas explícitas, sequências maiores de comandos da matriz podiam ultrapassar a capacidade de processamento do firmware, mesmo sem provocar desconexão do Arduino.

Foi adicionada uma camada de pacing baseada em ACK especificamente para:

- `MATRIX_WRITE`;
- `MATRIX_BRIGHTNESS`.

O `ArduinoUnoPeripheral` mantém:

`_pendingCommandAcks`

e os comandos da matriz utilizam:

`_sendCommandWithAck()`

O fluxo passa a ser:

`bloco → envio do frame → firmware processa → ACK correspondente → Promise resolvida → próximo bloco`

O restante das primitives Stage continua utilizando o comportamento síncrono anterior.

O mecanismo também trata:

- `ERROR`;
- timeout de 1000 ms;
- reset/desconexão;
- limpeza de Promises pendentes.

Validação física de estresse:

- 20 comandos consecutivos sem `esperar`: aprovado;
- repetição do mesmo teste: aprovado;
- aproximadamente 100 atualizações consecutivas de matriz, sem esperas explícitas: aprovado;
- repetição do teste de aproximadamente 100 frames: aprovado;
- frame final exibido corretamente;
- conexão Stage permaneceu estável.

Portanto:

`ACK PACING DA MAX7219 — VALIDADO EM HARDWARE`

### 19.125. Arbitragem entre MAX7219 e LCD nos pinos A4/A5

A configuração padrão da matriz utiliza:

- DIN = A4;
- CS = A5;
- CLK = D13.

Entretanto, A4 e A5 também formam o barramento I2C padrão do Arduino UNO utilizado pelo LCD.

Foi implementada proteção bidirecional no firmware.

Quando o LCD já está inicializado:

- a matriz não pode ser inicializada utilizando A4 ou A5.

Quando a matriz já está inicializada utilizando A4 ou A5:

- `LCD_INIT` responde `ERROR`;
- o firmware não inicializa o barramento Wire;
- a matriz permanece operacional;
- a conexão Stage permanece estável.

Validação física realizada com:

- MAX7219 ativa em A4/A5/D13;
- coração exibido;
- tentativa de `LCD_INIT`;
- novo frame da matriz;
- retorno ao coração.

Resultado:

`ARBITRAGEM MAX7219 ↔ LCD — VALIDADA EM HARDWARE`

Essa proteção evita que dois dispositivos tentem assumir simultaneamente recursos incompatíveis do Arduino UNO.

### 19.126. Organização interna da categoria Displays

A categoria `Displays` permanece única, utilizando a identidade visual:

- principal: `#E53935`;
- secundária: `#C62828`;
- terciária: `#8E0000`.

Para reduzir erros de seleção entre dispositivos diferentes, foi adicionada infraestrutura genérica de rótulos visuais no flyout.

Novo tipo:

`BlockType.LABEL`

O Runtime converte esse item para o elemento nativo:

`<label>`

Labels não possuem:

- opcode;
- primitive;
- execução.

A organização atual da categoria é:

`Matriz de LED 8x8`

seguida pelos quatro blocos da MAX7219.

Depois existe um separador visual real:

`---`

e a subseção:

`Display LCD`

seguida pelos quatro blocos do LCD 16×2.

Essa organização foi validada visualmente na GUI.

O preview/shadow do editor da matriz também utiliza agora o vermelho secundário:

`#C62828`

preservando os pixels ativos em branco.

A infraestrutura de labels deverá ser reutilizada futuramente para:

`Display 7 SEG`

quando os blocos TM1637 forem implementados.

Não exibir uma subseção vazia antes da existência dos respectivos blocos.

### 19.127. Testes finais do checkpoint MAX7219 / ACK / Displays

Resultados finais automatizados:

`packages/scratch-vm/test/unit/arduino-uno-protocol.js`

- 223 pass;
- 0 fail.

`packages/scratch-vm/test/unit/arduino-uno.js`

- 413 pass;
- 0 fail.

`packages/scratch-vm/test/unit/displays.js`

- 45 pass;
- 0 fail.

Execução conjunta:

- 681 pass;
- 0 fail.

Infraestrutura de labels e conversão:

`packages/scratch-vm/test/unit/extension_conversion.js`

- 97 pass;
- 0 fail.

Execução conjunta de `extension_conversion.js` e `displays.js`:

- 142 pass;
- 0 fail.

Integração de extensões internas:

`packages/scratch-vm/test/integration/internal-extension.js`

- 44 pass;
- 0 fail.

Fila global Serial:

`packages/scratch-vm/test/unit/serial.js`

- 29 pass;
- 0 fail.

Compilação final do firmware Arduino UNO:

- Flash: `11348 bytes (35%)`;
- SRAM global: `610 bytes (29%)`;
- SRAM restante: `1438 bytes`.

Build final da GUI:

`npm run build:dev`

Resultado:

`SUCESSO`

Status técnico do checkpoint:

- protocolo MAX7219: aprovado;
- firmware MAX7219: aprovado;
- ACK pacing: aprovado;
- testes automatizados: aprovados;
- build GUI: aprovado;
- compilação Arduino UNO: aprovada;
- editor visual: aprovado;
- organização da categoria Displays: aprovada;
- arbitragem LCD/MAX7219: aprovada;
- validação física MAX7219: aprovada.

### 19.128. Situação dos displays após a revalidação

Estado atual:

`LCD 16×2 I2C — Stage aprovado`

`MAX7219 8×8 — Stage aprovado`

`TM1637 / Display 7 segmentos — Upload Mode`

A revalidação bem-sucedida da MAX7219 não altera automaticamente a decisão sobre o TM1637.

Qualquer eventual suporte Stage ao TM1637 deverá ser investigado em checkpoint específico.

O trabalho deverá continuar preservando a prioridade de concluir a base Arduino UNO antes de avançar para ESP32.

### 19.129. Revalidação específica do TM1637 para Modo Palco

Após o fechamento do checkpoint MAX7219 no commit:

`46212de015`

foi realizada uma investigação técnica específica para o display de 7 segmentos TM1637.

A decisão anterior:

`TM1637 / Display 7 segmentos — Upload Mode`

não foi alterada automaticamente em consequência da aprovação da MAX7219.

O dispositivo passou por contrato próprio, implementação de protocolo, testes automatizados, compilação do firmware, validação elétrica, validação física e teste end-to-end pelos blocos do EasyBlox.

Resultado final:

`TM1637 / Display 7 segmentos — Stage aprovado`

### 19.130. Contrato Stage TM1637 v1

O TM1637 utiliza um único comando Stage:

`TM1637_WRITE = 0x22`

Payload:

`[CLK, DIO, SEG0, SEG1, SEG2, SEG3]`

Os quatro bytes `SEG0..SEG3` representam diretamente os segmentos físicos das quatro posições do display.

A interpretação de:

- valor numérico;
- quantidade de dígitos;
- posição;
- ponto/separador;
- zeros à esquerda;

é responsabilidade da extensão:

`packages/scratch-vm/src/extensions/scratch3_displays/index.js`

O firmware recebe somente o frame final.

A escrita utiliza:

`_sendCommandWithAck()`

preservando o mecanismo de backpressure utilizado nos comandos Stage que dependem de processamento do firmware.

Não existem opcodes separados para:

- inicialização;
- limpeza;
- brilho.

A limpeza reutiliza:

`TM1637_WRITE`

com quatro bytes:

`00 00 00 00`

Não existe bloco nem comando de brilho no contrato TM1637 v1.

### 19.131. Blocos TM1637

A categoria única:

`Displays`

passa a utilizar a seguinte ordem interna:

1. `Matriz de LED 8x8`;
2. `Display LCD`;
3. `Display 7 SEG`.

A subseção:

`Display 7 SEG`

possui somente três blocos:

`inicializar display 7 segmentos CLK [CLK] DIO [DIO]`

`mostrar [VALUE] com [LENGTH] dígitos na posição [POSITION] [POINT] e [LEADING_ZEROS]`

`limpar display 7 segmentos`

Não existe bloco de brilho.

O bloco de inicialização/configuração apenas armazena localmente os pinos utilizados pelos comandos seguintes.

Defaults aprovados e validados fisicamente:

- CLK = `A5` / pino lógico `19`;
- DIO = `A4` / pino lógico `18`.

O bloco de exibição suporta:

- 1 a 4 dígitos;
- posição inicial de 1 a 4;
- ponto/separador;
- zeros à esquerda.

Exemplo validado:

`1234`

é convertido para:

`06 5B 4F 66`

### 19.132. Driver TM1637 no firmware Stage

O firmware Arduino UNO implementa diretamente o protocolo do TM1637.

Não foi adicionada biblioteca externa.

O driver inclui:

- condição START;
- condição STOP;
- transmissão LSB-first;
- leitura do ACK elétrico do TM1637;
- comando de dados;
- seleção do endereço inicial;
- escrita sequencial dos quatro segmentos;
- controle interno do display.

O firmware somente envia:

`RESPONSE_ACK`

ao EasyBlox depois de concluir corretamente a comunicação com o TM1637.

Se o dispositivo não responder ao ACK elétrico esperado, o firmware envia:

`RESPONSE_ERROR`

Essa validação foi confirmada fisicamente durante o checkpoint.

### 19.133. Arbitragem TM1637 e LCD

O mapeamento fisicamente validado do TM1637 utiliza:

- CLK = A5;
- DIO = A4.

Esses pinos também constituem o barramento I2C padrão do Arduino UNO utilizado pelo LCD 16x2.

Foi implementada proteção bidirecional.

Se o LCD estiver inicializado:

- o TM1637 não pode assumir A4/A5.

Se o TM1637 estiver utilizando A4/A5:

- `LCD_INIT` responde `ERROR`.

A configuração interna do TM1637 existe somente para controle de recursos do firmware.

Ela não cria um comando adicional de inicialização no protocolo Stage.

### 19.134. Validação física TM1637

Validação realizada com Arduino UNO/EasyDuino na:

`COM11`

Mapeamento correto:

- CLK = A5 / 19;
- DIO = A4 / 18.

Um primeiro teste com os sinais invertidos retornou:

`RESPONSE_ERROR`

confirmando que o firmware detectava ausência do ACK elétrico esperado.

Com o mapeamento correto, o frame correspondente a:

`1234`

utilizando:

`06 5B 4F 66`

foi aceito.

Resultado físico:

`1234`

exibido corretamente.

Resposta Stage:

`RESPONSE_ACK`

Também foi testada a limpeza usando:

`00 00 00 00`

Resultado:

- display apagado;
- `RESPONSE_ACK`.

Posteriormente, escrita e limpeza também foram validadas utilizando diretamente os novos blocos da categoria Displays.

Resultado:

`TM1637 STAGE — VALIDADO EM HARDWARE`

### 19.135. Correção de UX dos blocos de configuração

Durante a validação visual foi observado que blocos de configuração local que retornavam explicitamente:

`null`

produziam uma bolha visual:

`null`

quando clicados diretamente.

O comportamento foi corrigido em:

- `configurar matriz 8x8`;
- `inicializar display 7 segmentos`.

Esses comandos agora encerram silenciosamente sem reportar valor.

Regra:

blocos de comando destinados apenas a configurar estado local não devem gerar valor visual na interface.

### 19.136. Testes finais do checkpoint TM1637

Resultados automatizados:

`packages/scratch-vm/test/unit/arduino-uno-protocol.js`

- 237 pass;
- 0 fail.

`packages/scratch-vm/test/unit/arduino-uno.js`

- 426 pass;
- 0 fail.

`packages/scratch-vm/test/unit/displays.js`

- 77 pass;
- 0 fail.

Execução conjunta:

- 740 pass;
- 0 fail;
- 3 suites aprovadas.

Cobertura conjunta:

- statements: 95,89%;
- branches: 89,77%;
- functions: 97,26%;
- lines: 95,89%.

Compilação do firmware Arduino UNO:

- Flash: `12014 bytes (37%)`;
- SRAM global: `613 bytes (29%)`;
- SRAM restante: `1435 bytes`.

Build final da GUI:

`npm --prefix packages\scratch-gui run build:dev`

Resultado:

`SUCESSO`

### 19.137. Estado dos displays após o checkpoint TM1637

Estado aprovado:

`LCD 16x2 I2C — Stage aprovado`

`MAX7219 8x8 — Stage aprovado`

`TM1637 / Display 7 segmentos — Stage aprovado`

O TM1637 deixa de estar restrito ao Upload Mode.

A mudança foi aprovada somente após investigação própria e validação no hardware real.

O próximo desenvolvimento planejado da base Arduino UNO é:

`Joystick`

Manter a prioridade de concluir a base Arduino UNO antes de avançar para ESP32.

### 19.138. Joystick Stage v1

O módulo Joystick do Arduino UNO deve ser tratado como um periférico de três sinais:

- eixo X;
- eixo Y;
- Click.

Defaults EasyMaker:

- X = A4 / 18;
- Y = A5 / 19;
- Click = D13 / 13.

Esse mapeamento corresponde ao mesmo conector físico utilizado pela matriz MAX7219.

### 19.139. Protocolo Joystick

Comando:

`JOYSTICK_READ = 0x23`

Resposta:

`JOYSTICK_READ = 0x95`

Requisição:

`[X_PIN, Y_PIN, CLICK_PIN]`

Resposta:

`[X_PIN, Y_PIN, CLICK_PIN, X_H, X_L, Y_H, Y_L, CLICK]`

X e Y devem permanecer na faixa:

`0..1023`

O Click deve ser entregue ao cliente já normalizado:

`0 = solto`

`1 = pressionado`

### 19.140. Click do Joystick

O firmware deve configurar o sinal Click com:

`INPUT_PULLUP`

A interpretação elétrica é:

`LOW = pressionado`

O usuário e os blocos Scratch não devem precisar conhecer essa inversão.

Não alterar o comportamento genérico de `DIGITAL_READ` para atender ao Joystick.

A configuração pull-up pertence exclusivamente ao primitive do Joystick.

### 19.141. Blocos Sensores Arduino

O Joystick utiliza três blocos:

`inicializar joystick X [X] Y [Y] CLICK [CLICK]`

`valor do joystick [X/Y]`

`joystick clicado?`

O bloco de configuração apenas armazena estado local e deve encerrar silenciosamente com `undefined`.

O bloco de Click deve utilizar:

`BlockType.BOOLEAN`

### 19.142. Peripheral Joystick

O peripheral deve utilizar:

`_pendingJoystickReads`

e expor:

`joystickRead(xPin, yPin, clickPin)`

A resposta validada deve ser convertida para:

`{x, y, clicked}`

Frames inválidos não devem resolver uma leitura como válida.

`RESPONSE_ERROR` e reset/desconexão devem resolver leituras pendentes com:

`null`

### 19.143. Arbitragem

O Joystick é um dispositivo de leitura instantânea.

Ele não deve manter reserva persistente de A4/A5/D13 depois de uma leitura.

Antes de ler, o firmware deve rejeitar conflitos com periféricos Stage stateful já utilizando os mesmos recursos.

Essa regra é particularmente importante para:

- MAX7219;
- LCD I2C;
- TM1637.

### 19.144. Validação

Validação física aprovada em:

`COM11`

com:

`X=A4`

`Y=A5`

`Click=D13`

Os eixos alcançaram praticamente toda a faixa:

`0..1023`

O Click alternou corretamente entre:

`false / true`

A integração pelos próprios blocos também foi aprovada controlando o ator Whiz.

Testes finais:

- protocolo: 241 pass;
- Arduino UNO: 449 pass;
- Sensores: 73 pass;
- conjunto: 763 pass / 0 fail.

Firmware:

- Flash: `12374 bytes (38%)`;
- SRAM: `613 bytes (29%)`;
- livre: `1435 bytes`.

Build GUI:

`SUCESSO`

### 19.145. Estado aprovado

`Joystick Arduino UNO — Stage aprovado`

A interface oficial inclui X, Y e Click.

O texto completo do bloco de configuração pode ser preservado mesmo quando exceder visualmente o flyout, pois o comportamento global de hover do EasyBlox permite sua visualização integral.

### 19.146. Contrato oficial de Motor por instância lógica

A categoria `Atuadores` deve utilizar motores lógicos:

`Motor 1`

`Motor 2`

O usuário configura os pinos uma vez por meio de:

`configurar motor [MOTOR] IN1 [IN1] IN2 [IN2] PWM [PWM]`

e utiliza posteriormente:

`girar motor [MOTOR] sentido [DIRECTION] velocidade [SPEED] %`

`parar motor [MOTOR]`

Defaults oficiais:

`Motor 1`

- IN1 D2;
- IN2 D4;
- PWM D3.

`Motor 2`

- IN1 D7;
- IN2 D8;
- PWM D5.

A configuração deve permanecer local à extensão.

Configurações inválidas não devem destruir uma configuração válida anterior.

O bloco de configuração deve retornar:

`undefined`

O protocolo Stage continua utilizando:

`MOTOR_WRITE = 0x17`

`MOTOR_STOP = 0x18`

A parada simplificada utiliza:

`COAST = 0`

### 19.147. Ordem e separação visual de Atuadores

A ordem oficial da categoria é:

`Motor → Servo → Relé`

A sequência deve ser:

- configurar motor;
- girar motor;
- parar motor;
- `'---'`;
- mover servo;
- `'---'`;
- definir relé.

O separador `'---'` deve ser utilizado como espaço visual sem texto quando houver grupos funcionalmente distintos.

### 19.148. Separação visual em Sensores Arduino

Entre os blocos DHT e Joystick deve existir um separador:

`'---'`

A ordem é:

- Ultrassônico;
- DHT;
- separador;
- Joystick.

Não criar rótulo textual apenas para produzir espaçamento.

### 19.149. Ordem oficial dos blocos Arduino UNO

A categoria `Arduino UNO` deve seguir a ordem:

- definir pino digital;
- ler pino digital;
- ler pino analógico;
- definir PWM;
- `'---'`;
- tocar tom;
- parar tom;
- `'---'`;
- obter temporizador;
- zerar temporizador.

As operações básicas de leitura devem aparecer antes do grupo de Tom.

### 19.150. Protocolo oficial do Temporizador Stage

Comandos:

`TIMER_READ = 0x24`

`TIMER_RESET = 0x25`

Resposta:

`TIMER_READ = 0x96`

Reset:

`ACK = 0x80`

`TIMER_READ` deve possuir payload de requisição vazio.

Sua resposta deve possuir quatro bytes:

`[MS3, MS2, MS1, MS0]`

em ordem big-endian, representando milissegundos em:

`uint32_t`

O peripheral não deve reconstruir o byte mais significativo usando operadores bitwise assinados do JavaScript.

Utilizar aritmética numérica para preservar todo o intervalo unsigned de 32 bits.

### 19.151. Semântica oficial do Temporizador

Firmware:

`elapsed = millis() - timerResetAt`

Reset:

`timerResetAt = millis()`

O bloco:

`obter temporizador`

é `REPORTER` e deve expor o resultado em:

`segundos`

O bloco:

`zerar temporizador`

é `COMMAND`.

Falhas, desconexões e respostas `ERROR` devem preservar:

`null`

e nunca transformar uma falha em:

`0 segundos`

### 19.152. Estado validado do Temporizador

Validação física aprovada em Arduino UNO real.

Firmware:

- Flash: `12532 bytes (38%)`;
- SRAM: `617 bytes (30%)`;
- livre: `1431 bytes`.

Teste físico:

- PING/PONG aprovado;
- TIMER_RESET/ACK aprovado;
- espera aproximada de 2 segundos;
- TIMER_READ retornou `2020 ms`;
- resultado convertido: `2.02 s`.

Testes automatizados finais:

- protocolo: 246 pass;
- Arduino UNO: 490 pass;
- conjunto com Atuadores e Sensores: 865 pass / 0 fail;
- 4 suites aprovadas.

Build GUI:

`SUCESSO`

Testes físicos dos novos blocos de Motor e Temporizador:

`APROVADOS`

### 19.153. Diretriz arquitetural para Modo Carregar e OpenBlock

Antes da implementação profunda do Modo Carregar, deve ser realizada auditoria técnica do ecossistema OpenBlock.

O EasyBlox não deverá migrar para OpenBlock.

O EasyBlox permanece:

`plataforma principal e autônoma`

Componentes ou soluções do OpenBlock poderão ser trazidos seletivamente para o EasyBlox quando oferecerem vantagem técnica.

Cada elemento analisado deverá ser classificado como:

`REUTILIZAR`

`ADAPTAR`

`USAR COMO REFERÊNCIA`

`DESCARTAR`

A auditoria deve priorizar:

- geração de código;
- compilação;
- Arduino CLI;
- upload;
- definição de placas;
- toolchain;
- arquitetura extensível para Arduino UNO e futura ESP32.

A regra arquitetural é:

`trazer, adaptar e integrar — não migrar`.

### 19.154. Arduino UNO Modo Carregar — início da implementação

A auditoria arquitetural prevista na seção anterior foi concluída em 19/08/2026 e o contrato técnico e pedagógico do Arduino UNO Modo Carregar v1 foi oficialmente fechado.

A implementação prática é realizada na branch:

`feat/easyblox-arduino-uno-upload-mode`

Primeiro commit estrutural:

`034f250b79 feat: add Arduino UNO Upload core`

A fonte canônica do programa permanece a Scratch VM.

Pipeline implementado até este ponto:

```text
Scratch VM
↓
UploadProgramExtractor
↓
EasyBlox IR
↓
UploadContextValidator
↓
ArduinoUnoGenerator

O UploadProgramExtractor é a única camada deste núcleo que conhece diretamente targets, IDs de blocos, Blocks e opcodes Scratch.

A IR e o gerador não devem depender do workspace Blockly/ScratchBlocks.

O primeiro núcleo implementado cobre:

quando Arduino Uno iniciar como entry point estrutural do firmware;
hat inerte no Modo Palco;
exatamente um entry point Upload por projeto;
entry point vazio válido;
arduinoUno_digitalWrite;
leitura de literais numéricos da VM;
estado digital aceito apenas como 0 ou 1, sem coerção silenciosa;
geração determinística de setup() e loop();
inferência automática de pinMode(..., OUTPUT);
deduplicação de pinMode;
scripts Upload soltos fora do grafo alcançável ignorados;
scripts Stage independentes ignorados;
blocos Stage/Upload não suportados dentro do grafo alcançável rejeitados;
clones não considerados entry points independentes.

O commit 034f250b79 corresponde ao checkpoint intermediário A1 — núcleo estrutural do Upload.

Esse checkpoint não deve ser confundido com o aceite completo do primeiro vertical slice definido no contrato, pois itens posteriores do checklist, incluindo o allocator seguro de identificadores internos quando houver uso real para ele, ainda serão implementados.

### 19.155. Arduino UNO Upload — semântica do primeiro sempre

O primeiro control_forever encontrado na cadeia principal do entry point possui semântica especial no Modo Carregar.

Exemplo:

quando Arduino Uno iniciar
    definir D13 ALTO
    sempre
        definir D13 BAIXO

produz semanticamente:

setup:
    DigitalWrite(D13, HIGH)


loop:
    DigitalWrite(D13, LOW)

e o gerador produz:

void setup() {
    pinMode(13, OUTPUT);
    digitalWrite(13, HIGH);
}


void loop() {
    digitalWrite(13, LOW);
}

Recursos utilizados dentro de loop() continuam tendo sua infraestrutura global deduzida e inicializada uma única vez em setup().

Um sempre vazio é válido e resulta em loop() vazio.

Código conectado na cadeia principal depois do primeiro sempre não pode desaparecer silenciosamente.

O extractor preserva essa condição semanticamente na IR como:

UnreachableCode
reason: AfterInfiniteLoop

A decisão de validade não pertence ao gerador.

Foi introduzido:

packages/scratch-vm/src/upload/upload-context-validator.js

O UploadContextValidator rejeita IR contendo código inalcançável após loop infinito.

A separação de responsabilidades permanece:

UploadProgramExtractor
→ traduz Scratch VM para IR


UploadContextValidator
→ valida regras de contexto


ArduinoUnoGenerator
→ gera C++ a partir de IR previamente validada

Não duplicar regras do Context Validator dentro do gerador.

Estado automatizado validado em 20/08/2026:

arduino-uno-upload.js
22 pass
0 fail


arduino-uno.js + arduino-uno-upload.js
519 pass
0 fail
2 suites

### 19.156. Arduino UNO Upload — `repita N vezes` e allocator de identificadores internos

O A3 do Arduino UNO Modo Carregar introduziu suporte estrutural inicial ao bloco Scratch:

`control_repeat`

No EasyBlox IR, o bloco é representado semanticamente como:

```text
Repeat
├── times
└── body

Exemplo:

quando Arduino Uno iniciar
    repita 3 vezes
        definir D13 ALTO

é extraído como:

{
    setup: [{
        type: 'Repeat',
        times: 3,
        body: [{
            type: 'DigitalWrite',
            pin: 13,
            value: true
        }]
    }],
    loop: []
}

A implementação mantém a separação entre Scratch VM, IR e C++.

O UploadProgramExtractor conhece control_repeat, TIMES e SUBSTACK, mas não produz C++.

O ArduinoUnoGenerator passou a gerar statements estruturados recursivamente.

Exemplo gerado:

void setup() {
    pinMode(13, OUTPUT);
    for (int easyblox_repeat_index_0 = 0; easyblox_repeat_index_0 < 3; ++easyblox_repeat_index_0) {
        digitalWrite(13, HIGH);
    }
}


void loop() {
}

A inferência de recursos também passou a percorrer a IR recursivamente.

Portanto, um DigitalWrite localizado dentro de um ou mais Repeat continua fazendo com que o respectivo:

pinMode(..., OUTPUT);

seja emitido uma única vez em setup().

Semântica inicial de TIMES

Na fase atual, TIMES aceita literal numérico inteiro não negativo.

Casos válidos:

repita 0 vezes
repita 1 vez
repita 3 vezes

Casos inválidos:

repita 2.5 vezes
repita -1 vez

O Modo Carregar não reproduz silenciosamente o Math.round() usado pelo runtime Scratch em Stage.

Não deve haver correção ou arredondamento silencioso de valores inválidos.

Expressões, variáveis e operadores em TIMES serão incorporados posteriormente pela camada de expressões e tipagem prevista no contrato.

InternalIdentifierAllocator

O A3 introduziu:

packages/scratch-vm/src/upload/internal-identifier-allocator.js

Essa implementação resolve a primeira necessidade real de geração de identificadores internos do C++.

Características atuais:

geração determinística;
controle de nomes já utilizados;
contador independente por nome-base;
prevenção de colisão com identificadores previamente reservados;
identificadores internos não podem começar com _;
nomes internos utilizam apenas letras, números e _;
uma nova instância é criada para cada geração completa do sketch.

Exemplo:

easyblox_repeat_index_0
easyblox_repeat_index_1

Em Repeat aninhado, cada laço recebe identificador distinto.

O allocator foi projetado para futuramente receber como reservados os identificadores derivados de variáveis, Meus Blocos e outros símbolos do programa.

Não usar prefixos C/C++ reservados como:

__
_identificador
Estruturas aninhadas

O gerador já percorre recursivamente:

Repeat
└── Repeat
    └── DigitalWrite

produzindo identificadores distintos e mantendo a deduplicação de recursos.

Também foi validado:

quando Arduino Uno iniciar
    sempre
        repita 2 vezes
            definir D13 ALTO

Nesse caso:

Repeat pertence ao loop();
pinMode(13, OUTPUT) permanece em setup();
o for é emitido dentro de loop().

Validação automatizada ao fechamento técnico do A3:

Stage + Upload:
531 pass
0 fail
2 suites

### 19.157. Primeiro vertical slice do Arduino UNO Modo Carregar — concluído

Em 20/08/2026 foi concluído formalmente o primeiro vertical slice definido pelo contrato técnico e pedagógico do Arduino UNO Modo Carregar v1.

Checkpoint técnico consolidado:

```text
A1 — 034f250b79 feat: add Arduino UNO Upload core
A2 — 99887d2ae5 feat: add Arduino UNO Upload loop context validation
A3 — 1b6af7735d feat: add Arduino UNO Upload repeat support

### 19.158. A4 — expressões e tipagem aritmética no Arduino UNO Modo Carregar

Em 20/08/2026 foi concluído o A4 da implementação incremental do Arduino UNO Modo Carregar v1.

Esta etapa introduziu a primeira camada semântica de expressões aritméticas da EasyBlox IR e o primeiro validador dedicado aos tipos pedagógicos do Modo Carregar.

O A4 não altera a arquitetura consolidada anteriormente.

O fluxo permanece:

```text
Scratch VM
    ↓
UploadProgramExtractor
    ↓
EasyBlox IR
    ↓
UploadContextValidator
    ↓
UploadTypeValidator
    ↓
ArduinoUnoGenerator
    ↓
C++

O UploadProgramExtractor continua sendo a única camada deste fluxo que conhece diretamente os opcodes e a estrutura dos blocos Scratch.

O UploadTypeValidator e o ArduinoUnoGenerator operam sobre EasyBlox IR e não dependem da estrutura interna dos blocos Scratch.

Expression IR

Foram introduzidas as representações:

IntegerLiteral
DecimalLiteral
BinaryExpression

Exemplos:

1
↓
IntegerLiteral(1)


2.5
↓
DecimalLiteral(2.5)


1 + 2
↓
BinaryExpression
├── operator: Add
├── left: IntegerLiteral(1)
└── right: IntegerLiteral(2)

Os operadores aritméticos suportados nesta etapa são:

operator_add       → Add
operator_subtract  → Subtract
operator_multiply  → Multiply
operator_divide    → Divide

O extractor percorre os inputs das expressões recursivamente e produz a IR antes de qualquer geração de C++.

Exemplo Scratch:

repita (1 + 2) vezes

Representação semântica:

Repeat
├── times
│   └── BinaryExpression
│       ├── operator: Add
│       ├── left: IntegerLiteral(1)
│       └── right: IntegerLiteral(2)
└── body[]
UploadTypeValidator

Foi criado:

packages/scratch-vm/src/upload/upload-type-validator.js

A camada introduz os tipos pedagógicos previstos pelo contrato:

INTEGER
DECIMAL
TEXT
BOOLEAN

Nesta etapa, INTEGER e DECIMAL já participam efetivamente da validação aritmética.

TEXT e BOOLEAN ficam formalmente definidos para as próximas fases de expressões e tipagem.

A promoção numérica para:

Add
Subtract
Multiply

segue:

INTEGER op INTEGER
→ INTEGER


INTEGER op DECIMAL
→ DECIMAL


DECIMAL op INTEGER
→ DECIMAL


DECIMAL op DECIMAL
→ DECIMAL

Não há conversão silenciosa de DECIMAL para INTEGER.

Tipagem de Repeat

O campo times de:

Repeat

continua exigindo semanticamente:

Número inteiro

Portanto:

repita (1 + 2) vezes

é válido porque:

INTEGER + INTEGER
→ INTEGER

Por outro lado:

repita (1 + 2.5) vezes

é rejeitado porque:

INTEGER + DECIMAL
→ DECIMAL

O mesmo princípio vale para outras expressões aritméticas.

Essa validação substitui qualquer tentativa de corrigir, truncar ou arredondar silenciosamente o valor.

Semântica de divisão

Divide possui regra própria.

Independentemente dos tipos numéricos dos operandos:

INTEGER / INTEGER
INTEGER / DECIMAL
DECIMAL / INTEGER
DECIMAL / DECIMAL

o resultado semântico é sempre:

DECIMAL

Portanto:

5 / 2

deve representar semanticamente:

2.5

e nunca a divisão inteira do C++:

2

Por consequência:

repita (5 / 2) vezes

é inválido no Modo Carregar porque o resultado da expressão é DECIMAL e Repeat.times exige INTEGER.

Preservação da divisão decimal no C++

O ArduinoUnoGenerator foi adaptado para preservar explicitamente a semântica decimal da EasyBlox IR.

A geração não utiliza:

(5 / 2)

porque essa expressão realizaria divisão inteira em C++.

A geração utiliza promoção explícita:

(static_cast<double>(5) / static_cast<double>(2))

A mesma estratégia é aplicada quando os operandos são expressões compostas.

Exemplo:

(1 + 4) / (1 + 1)

gera semanticamente uma divisão equivalente a:

(static_cast<double>((1 + 4)) / static_cast<double>((1 + 1)))

evitando divisão inteira acidental.

A geração das expressões continua recursiva e parentizada de forma determinística.

Compatibilidade com A3

A representação numérica direta usada pelo A3 para Repeat.times permanece temporariamente aceita pelo UploadTypeValidator.

Isso preserva compatibilidade incremental enquanto a camada de expressões é incorporada ao restante do Modo Carregar.

Não se trata de um segundo modelo semântico definitivo.

A tendência arquitetural permanece concentrar valores e expressões na EasyBlox IR tipada.

Estado automatizado ao fechamento do A4

Testes específicos do Upload:

55 pass
0 fail
1 suite

Regressão Arduino UNO Stage + Upload:

552 pass
0 fail
2 suites

Foram validados, entre outros:

IntegerLiteral
DecimalLiteral
Add
Subtract
Multiply
Divide
expressões aninhadas
promoção INTEGER/DECIMAL
Repeat com expressão INTEGER
rejeição de Repeat com expressão DECIMAL
divisão INTEGER/INTEGER como DECIMAL
divisão decimal em C++ com operandos literais
divisão decimal em C++ com expressões compostas

Arquivos principais alterados no A4:

packages/scratch-vm/src/upload/upload-program-extractor.js
packages/scratch-vm/src/upload/upload-type-validator.js
packages/scratch-vm/src/upload/arduino-uno-generator.js
packages/scratch-vm/test/unit/arduino-uno-upload.js

O arquivo local independente:

packages/scratch-gui/src/components/action-menu/icon--sprite.svg

permanece fora deste checkpoint.

O A4 fecha o núcleo aritmético inicial da camada de expressões e tipagem.

Isso não representa a conclusão integral do Arduino UNO Modo Carregar v1.

Próxima etapa incremental prevista:

A5 — comparações e operadores booleanos

incluindo inicialmente:

<
=
>
e
ou
não

sobre a infraestrutura de Expression IR e UploadTypeValidator consolidada no A4.

### 19.159. A5 — comparações e operadores booleanos no Arduino UNO Modo Carregar

Em 20/08/2026 foi concluído o A5 da implementação incremental do Arduino UNO Modo Carregar v1.

Esta etapa amplia a Expression IR introduzida no A4 e adiciona comparações numéricas, operadores booleanos e a primeira expressão unária do Modo Carregar.

A arquitetura permanece:

```text
Scratch VM
    ↓
UploadProgramExtractor
    ↓
EasyBlox IR
    ↓
UploadContextValidator
    ↓
UploadTypeValidator
    ↓
ArduinoUnoGenerator
    ↓
C++

O UploadProgramExtractor continua sendo a camada responsável por conhecer os opcodes Scratch e convertê-los para EasyBlox IR.

O UploadTypeValidator valida a semântica pedagógica dos tipos.

O ArduinoUnoGenerator recebe IR já estruturada e gera C++ determinístico.

Comparações

Foram adicionados:

operator_lt      → LessThan
operator_equals  → Equals
operator_gt      → GreaterThan

Representação:

BinaryExpression
├── operator
├── left
└── right

Exemplo:

1 < 2

é representado como:

BinaryExpression
├── operator: LessThan
├── left: IntegerLiteral(1)
└── right: IntegerLiteral(2)

As comparações numéricas retornam:

BOOLEAN

Para LessThan e GreaterThan, são aceitas todas as combinações numéricas:

INTEGER / INTEGER
INTEGER / DECIMAL
DECIMAL / INTEGER
DECIMAL / DECIMAL

sempre produzindo:

BOOLEAN

Não ocorre coerção de tipos não numéricos.

Igualdade

Nesta etapa, Equals está implementado para operandos numéricos.

São válidas:

INTEGER == INTEGER
INTEGER == DECIMAL
DECIMAL == INTEGER
DECIMAL == DECIMAL

com resultado:

BOOLEAN

A ampliação futura de Equals para:

TEXT == TEXT
BOOLEAN == BOOLEAN

permanece deliberadamente pendente até a incorporação efetiva de TextLiteral e BooleanLiteral à Expression IR.

O Modo Carregar não deve reproduzir coerções permissivas entre categorias diferentes.

Por exemplo, não deve assumir silenciosamente equivalência entre:

Número
Texto
Verdadeiro/Falso
Geração C++ das comparações

O generator produz:

LessThan    → <
Equals      → ==
GreaterThan → >

Exemplos:

(1 < 2)
(1 == 1)
(2 > 1)

As expressões permanecem parentizadas para preservar a estrutura semântica da IR e a precedência de forma determinística.

Operadores booleanos binários

Foram incorporados:

operator_and → And
operator_or  → Or

Ambos usam:

BinaryExpression

A regra pedagógica é estrita:

BOOLEAN AND BOOLEAN → BOOLEAN
BOOLEAN OR BOOLEAN  → BOOLEAN

Operandos INTEGER ou DECIMAL não são convertidos silenciosamente para booleanos.

O UploadTypeValidator introduziu validação específica para operandos booleanos.

Exemplos semânticos:

(1 < 2) e (3 > 2)
(1 < 2) ou (3 > 2)

Geração C++:

((1 < 2) && (3 > 2))
((1 < 2) || (3 > 2))

Mapeamento:

And → &&
Or  → ||
UnaryExpression

O A5 introduziu a primeira expressão unária da EasyBlox IR:

UnaryExpression
├── operator
└── operand

Primeiro operador:

operator_not → Not

Exemplo:

não (1 < 2)

é representado como:

UnaryExpression
├── operator: Not
└── operand
    └── BinaryExpression
        ├── operator: LessThan
        ├── left: IntegerLiteral(1)
        └── right: IntegerLiteral(2)

A regra de tipo é:

NOT BOOLEAN → BOOLEAN

Valores INTEGER ou DECIMAL como operando direto de Not são rejeitados.

Não ocorre conversão implícita para verdadeiro/falso.

Geração C++ de Not

O generator reconhece UnaryExpression.

Mapeamento:

Not → !

Exemplo:

não (1 < 2)

gera:

(!(1 < 2))
Operadores fechados no A5

Ao final desta etapa, estão implementados nas três camadas — extractor, Type Validator e generator:

operator_lt      → LessThan    → BOOLEAN → <
operator_equals  → Equals      → BOOLEAN → ==
operator_gt      → GreaterThan → BOOLEAN → >
operator_and     → And         → BOOLEAN → &&
operator_or      → Or          → BOOLEAN → ||
operator_not     → Not         → BOOLEAN → !

A Expression IR passa a suportar:

IntegerLiteral
DecimalLiteral
BinaryExpression
UnaryExpression
Estado automatizado ao fechamento do A5

Testes específicos do Upload:

88 pass
0 fail
1 suite

Regressão Arduino UNO Stage + Upload:

585 pass
0 fail
2 suites

Foram validados, entre outros:

LessThan com INTEGER e DECIMAL
GreaterThan com INTEGER e DECIMAL
Equals numérico
And com operandos BOOLEAN
rejeição de operandos numéricos em And
Or com operandos BOOLEAN
rejeição de operandos numéricos em Or
UnaryExpression
Not com operando BOOLEAN
rejeição de INTEGER em Not
rejeição de DECIMAL em Not
geração C++ de <, ==, >, &&, || e !

Arquivos principais alterados no A5:

packages/scratch-vm/src/upload/upload-program-extractor.js
packages/scratch-vm/src/upload/upload-type-validator.js
packages/scratch-vm/src/upload/arduino-uno-generator.js
packages/scratch-vm/test/unit/arduino-uno-upload.js

A alteração local independente:

packages/scratch-gui/src/components/action-menu/icon--sprite.svg

permanece fora deste checkpoint.

O A5 fecha o núcleo inicial de comparações e operadores booleanos previsto para esta fase.

Isso não representa a conclusão integral do Arduino UNO Modo Carregar v1.

As próximas fases continuam incrementais e devem preservar a tipagem pedagógica explícita e a regra de ausência de coerções silenciosas.
