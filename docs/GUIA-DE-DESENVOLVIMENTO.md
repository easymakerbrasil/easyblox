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
- Refinamento de localização e terminologia pt-BR — branch `feat/easyblox-ptbr-ux-refinement`: implementado e validado, aguardando fechamento documental e publicação da feature
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