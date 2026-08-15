# Guia de Desenvolvimento do EasyBlox

## 1. Visão do projeto

O EasyBlox será um software gratuito de programação em blocos desenvolvido pela EasyMaker Robótica Educacional.

### Produtos

- **EasyBlox:** software desktop para Windows, baseado no Scratch Editor.
- **EasyConect:** aplicativo Android de controle e monitoramento por Bluetooth.
- **Placas iniciais:** Arduino UNO e ESP32.
- **Perfis de hardware:** EasyMaker, EasyDuino e MakerDuino.

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

Nas placas EasyMaker e MakerDuino, o módulo HC-06 utiliza:

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
4. Criar os perfis EasyMaker, EasyDuino e MakerDuino.
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
  12: - **Perfis de hardware:** EasyMaker, EasyDuino e MakerDuino.
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
  12: - **Perfis de hardware:** EasyMaker, EasyDuino e MakerDuino.
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

As placas EasyMaker, EasyDuino e MakerDuino deverão utilizar a base Arduino UNO. ESP32/EasyMaker Conect será tratado somente em ciclo posterior.

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
