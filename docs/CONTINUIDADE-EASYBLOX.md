# Continuidade do Projeto EasyBlox

Atualizado em: 11 de agosto de 2026

## 1. Finalidade deste documento

Este arquivo é a memória operacional resumida do projeto EasyBlox.

Ele deve permitir que o desenvolvimento seja retomado em outra conversa ou por outro ambiente de desenvolvimento sem perder:

- decisões já aprovadas;
- comandos validados;
- situação atual;
- problemas encontrados e soluções;
- próximos passos;
- regras de segurança do projeto.

Antes de qualquer nova alteração, ler também:

```text
docs/GUIA-DE-DESENVOLVIMENTO.md
```

## 2. Visão geral

### EasyBlox

Software desktop gratuito de programação em blocos desenvolvido pela EasyMaker Robótica Educacional.

Características planejadas:

- baseado no Scratch Editor de código aberto;
- versão inicial para Windows 11 — 64 bits;
- suporte ao Arduino UNO e ESP32;
- geração de código Arduino C/C++;
- compilação e gravação usando Arduino CLI;
- perfis EasyMaker e EasyDuino;
- futura comunicação com o aplicativo EasyConect.

### EasyConect

Aplicativo Android gratuito destinado a controle e monitoramento.

Características planejadas:

- não será um editor de programação;
- funcionará como controle remoto semelhante ao Dabble;
- terá interface e protocolo próprios da EasyMaker;
- utilizará Bluetooth Classic SPP/RFCOMM;
- comunicação inicial pelo módulo HC-06.

### Comunicação HC-06

| Arduino | Função | HC-06 |
|---|---|---|
| D2 | RX do Arduino | TX do HC-06 |
| D3 | TX do Arduino | RX do HC-06 |

Velocidade inicial:

```text
9600 baud
```

## 3. Repositório

Repositório:

```text
https://github.com/easymakerbrasil/easyblox
```

Pasta local:

```text
C:\Users\EasyMaker\source\EasyMakerDev\easyblox
```

Branch principal de desenvolvimento:

```text
easyblox-dev
```

Branch ativa após a integração do marco v0.3.0:

```text
easyblox-dev
```

Feature de origem do marco v0.3.0:

```text
feat/easyblox-interface-branding
```

HEAD final aprovado da feature:

```text
81f9a9da37
```

Remotos:

```text
origin   https://github.com/easymakerbrasil/easyblox.git
upstream https://github.com/scratchfoundation/scratch-editor.git
```

Tag da base original funcional:

```text
easyblox-baseline-v0.0.0
```

Checkpoint protegido anterior à implementação do Whiz:

```text
easyblox-branding-v0.1.0
```

Commits relevantes da branch atual:

```text
df4d53bc02 — docs: update EasyBlox development status
971c622b3e — feat: apply EasyBlox interface branding
d92c329db1 — feat: brand EasyBlox context menu
f2e3c5ae4c — feat: brand EasyBlox extension button
05990f5c6d — feat: brand EasyBlox backpack more button
c2dfc28765 — feat: brand EasyBlox drag preview
bf8590d1e3 — feat: brand EasyBlox library header
73e9d24299 — feat: brand EasyBlox library category buttons
2a50ebce4b — feat: brand EasyBlox library filter bar
93d1a1e4a4 — feat: brand EasyBlox library search
7ef092bfc2 — feat: brand EasyBlox library item hover
eee2a1bfa4 — feat: brand EasyBlox top menus
c9a117b569 — feat: brand EasyBlox direction dial
bf9acefc68 — feat: brand EasyBlox direction icons
56b4255757 — feat: brand EasyBlox toggle buttons
eb12432b3a — feat: brand EasyBlox input focus states
2377129ca5 — feat: brand EasyBlox audio trimmer
2595264d8c — feat: brand EasyBlox question prompt
3654063acb — feat: brand EasyBlox prompt confirmation
7428181234 — feat: brand EasyBlox stage size icons
0418d85b44 — feat: brand EasyBlox visibility icons
8242935903 — feat: brand EasyBlox code tab icon
77f852e288 — feat: brand EasyBlox editor tabs
96a0a2cb9d — feat: brand EasyBlox modal headers and custom procedure confirmation
35172aa240 — feat: brand EasyBlox paint editor controls
```

Situação no momento desta atualização:

```text
Branch ativa: feat/easyblox-ptbr-ux-refinement
Base do ciclo atual: v0.3.0 — commit 894799ac29
easyblox-dev e origin/easyblox-dev permanecem sincronizadas em 894799ac29
Tag v0.3.0 criada e publicada sobre 894799ac29
Feature atual criada exatamente a partir do marco v0.3.0
origin/feat/easyblox-ptbr-ux-refinement permanece em 894799ac29
Branch local feat/easyblox-ptbr-ux-refinement está 2 commits à frente do remoto
Commit 84bf28568d — feat: refine pt-BR localization and theme settings
Commit dac597eafa — fix: close action menu after selecting actions
Localização automática pt-PT → pt-br implementada e coberta por teste
Overrides locais pt-BR implementados para textos específicos da interface EasyBlox
Opção de tema Cat Blocks removida da interface; somente o tema padrão permanece disponível
Preferências antigas de cat-blocks fazem fallback para o tema padrão
Action Menu corrigido para fechar após ações principal e secundárias
A ação principal remove o foco antes de abrir a biblioteca, evitando reabertura ao retornar ao editor
Fluxo real da biblioteca de atores validado manualmente com sucesso
Suíte consolidada: 4 test suites aprovadas, 23 testes aprovados
scratch-gui build:dev compilado com webpack 5.109.2 sem erros
git diff --check aprovado antes do commit do Action Menu
Working tree limpo após os dois commits do ciclo atual
Aviso de Browserslist permanece apenas informativo; dependências não foram atualizadas
Mochila permanece como "Em Breve..." e está fora do escopo deste ciclo
Nenhuma alteração de Arduino, ESP32, Arduino CLI, geração C/C++ ou hardware foi realizada
```

## 4. Ambiente validado

- Windows 11 — 64 bits
- Memória RAM: 16 GB ou mais
- Visual Studio Code em inglês
- Node.js 24.19.0 — 64 bits
- npm 11.17.0
- Git 2.55.0
- Arduino IDE instalado
- Terminal padrão do VS Code: Command Prompt

Identidade Git configurada no repositório:

```text
Leandro da Costa Dias
easymakerbrasil@gmail.com
```

## 5. Instalação validada

A instalação comum das dependências apresentou conflito entre instalações simultâneas do pacote `canvas`.

Comando validado para Windows:

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

Esses comandos podem alterar dependências da base e quebrar o projeto.

## 6. Execução validada

Antes de iniciar:

```cmd
set NODE_OPTIONS=--max-old-space-size=8192
```

Executar o servidor:

```cmd
npm start
```

Endereço:

```text
http://localhost:8601
```

Encerrar:

```text
Ctrl + C
```

## 7. Compilação no Windows

O script original utilizava:

```text
BUILD_TYPE=dev webpack
```

Essa sintaxe não funcionava diretamente no Prompt de Comando do Windows.

Foi corrigido em:

```text
packages/scratch-gui/package.json
```

Script atual:

```text
cross-env BUILD_TYPE=dev webpack
```

Testes concluídos com sucesso:

```cmd
npm run build:dev --workspace @scratch/scratch-gui
npm run build
```

A compilação completa apresenta apenas avisos sobre tamanho de arquivos, sem erros.

Commit da correção:

```text
ee00ff8b84 — fix: support scratch-gui build on Windows
```

## 8. Identidade visual aprovada

### Marca

```text
EasyBlox
```

### Elementos

- fonte oficial do logotipo: BubbleGum;
- personagem principal: Whiz;
- amarelo EasyMaker: `#ffc800`;
- grafite institucional: `#282828`;
- slogan do EasyBlox: `Aprender • Criar • Programar`;
- slogan institucional: `Mais que Robótica. Transformação Educacional.`

### Composição aprovada

- símbolo quadrado com o rosto do Whiz;
- moldura externa grafite;
- área interna amarela;
- escrita `EasyBlox`;
- `Blox` dentro do bloco amarelo;
- bloco terminando próximo ao final da palavra;
- slogan alinhado ao comprimento do logotipo.

### Pacote de identidade

O pacote final foi entregue como:

```text
EasyBlox-Identidade-Final.zip
```

Ele contém:

- versões SVG;
- versões PNG transparentes;
- versão compacta para a barra;
- versão para fundo escuro;
- ícone de 1024 pixels;
- arquivo ICO multirresolução para Windows;
- guia de utilização.

## 9. Integração visual já realizada

Arquivos adicionados:

```text
packages/scratch-gui/src/components/menu-bar/easyblox-logo.svg
packages/scratch-gui/src/components/menu-bar/easyblox-logo-android.svg
```

Arquivos modificados:

```text
packages/scratch-gui/src/components/menu-bar/menu-bar.jsx
packages/scratch-gui/src/components/stage-header/stage-header.jsx
```

Resultado validado:

- EasyBlox aparece no canto superior esquerdo;
- compilação Webpack concluída com sucesso;
- interface abriu em `localhost:8601`;
- versão desktop usa a logo horizontal compacta;
- versão Android está preparada para usar o ícone quadrado;
- arquivos originais da logo Scratch foram mantidos por enquanto.

Commit:

```text
5bf4c04135 — feat: add EasyBlox visual identity
```

## 10. Histórico dos principais checkpoints

```text
easyblox-baseline-v0.0.0
Base original do Scratch Editor 15.0.1 funcionando no Windows.

df5d057e2b
docs: add EasyBlox development guide

ee00ff8b84
fix: support scratch-gui build on Windows

5bf4c04135
feat: add EasyBlox visual identity
```

## 11. Situação atual

Concluído:

- preparação do ambiente;
- criação do fork;
- configuração dos remotos;
- criação da branch `easyblox-dev`;
- instalação das dependências;
- execução do Scratch Editor;
- compilação completa no Windows;
- criação da documentação de desenvolvimento e continuidade;
- criação da identidade visual do EasyBlox;
- integração da logo EasyBlox;
- identidade da aba e favicon EasyBlox;
- Whiz configurado como ator inicial padrão;
- Whiz com duas fantasias aprovadas: `parado` e `passada`;
- animação entre as duas fantasias validada;
- comportamento `left-right` validado nas direções `90` e `-90`;
- salvamento e reabertura de projeto `.sb3` com o Whiz validados;
- gato original do Scratch preservado na biblioteca;
- Whiz adicionado à biblioteca de atores;
- miniatura local do Whiz na biblioteca validada;
- remoção e reinserção do Whiz pela biblioteca validadas;
- marco v0.2.0 do Whiz preservado durante o ciclo seguinte;
- ciclo v0.3.0 Interface Branding concluído e aprovado;
- feature `feat/easyblox-interface-branding` finalizada no commit `81f9a9da37`;
- feature integrada em `easyblox-dev` por fast-forward;
- integração publicada em `origin/easyblox-dev`;
- `easyblox-dev` e `origin/easyblox-dev` sincronizadas após a integração;
- paleta principal da interface adequada à identidade EasyBlox;
- diálogos, menus, bibliotecas, controles, abas, campos e componentes visuais revisados no ciclo de branding;
- diálogo de confirmação de exclusão de ator adequado à identidade EasyBlox;
- `scratch-paint` recompilado com sucesso após a integração;
- `scratch-gui build:dev` compilado com sucesso após a integração;
- teste funcional em `localhost:8601` concluído com sucesso;
- tela principal do EasyBlox validada;
- editor de Código validado;
- editor de Trajes validado funcionalmente;
- editor de Sons validado;
- biblioteca de atores validada;
- biblioteca de cenários validada;
- biblioteca de extensões validada;
- menus Arquivo, Editar e Configurações validados;
- submenus de idioma, tema e modo de cor validados;
- modos de tamanho do palco e tela cheia validados;
- seletor de direção e modos de rotação validados;
- controles de mostrar e ocultar ator validados;
- `git diff --check` aprovado antes e depois da integração;
- working tree permaneceu limpo após builds e testes;
- aviso de `Browserslist/caniuse-lite` mantido apenas como informativo, sem atualização de dependências.

Pendências conhecidas registradas durante a validação da v0.3.0:

- o Action Menu dos botões de adicionar ator e cenário permanece expandido/focado ao retornar das respectivas bibliotecas e exige novo clique para fechar;
- a análise confirmou que o comportamento do Action Menu já existia antes da feature v0.3.0 e, portanto, não é regressão do ciclo de branding;
- a Mochila ainda não possui funcionalidade ativa e apresenta `Em Breve...`, comportamento também anterior à v0.3.0;
- revisar a localização e a terminologia da interface para português do Brasil;
- alterar futuramente `Trajes` para `Fantasias`;
- alterar `Escolher um Actor` para `Escolher um Ator`;
- traduzir `Load from your computer`;
- revisar `Descarregar para o seu computador` para uma formulação natural em português do Brasil, como `Baixar para o seu computador`;
- traduzir `Theme` para `Tema`;
- traduzir `Color Mode` para `Modo de cor`;
- avaliar `Língua` para `Idioma`;
- avaliar `Recuperar Som` para `Restaurar som`;
- avaliar `Ligar o Modo Turbo` para `Ativar modo turbo`;
- revisar a nomenclatura `Blocos de Gato`;
- ativar futuramente a funcionalidade real da Mochila.

Ainda não realizado:

- checkpoint documental pós-integração da v0.3.0;
- criação e publicação da tag `v0.3.0`;
- revisão residual de localização e terminologia pt-BR;
- correção do comportamento herdado do Action Menu;
- personalização adicional da tela inicial, quando definida;
- inclusão das placas Arduino UNO e ESP32;
- criação dos perfis EasyMaker e EasyDuino;
- integração do Arduino CLI;
- geração de Arduino C/C++;
- empacotamento desktop;
- desenvolvimento do EasyConect.

## 12. Próximo passo imediato

O marco v0.3.0 Interface Branding está encerrado, integrado em `easyblox-dev`, publicado no GitHub e protegido pela tag `v0.3.0` sobre o commit `894799ac29`.

O ciclo de refinamento pt-BR e UX foi desenvolvido na branch:

`feat/easyblox-ptbr-ux-refinement`

A feature foi publicada no remoto e posteriormente integrada por fast-forward em `easyblox-dev`.

Estado técnico confirmado neste checkpoint pós-integração:

- base original do ciclo: `v0.3.0` — commit `894799ac29`;
- branch da feature publicada e sincronizada com `origin/feat/easyblox-ptbr-ux-refinement`;
- HEAD final publicado da feature: `b70a3bf7d7`;
- integração em `easyblox-dev` realizada por fast-forward de `894799ac29` para `b70a3bf7d7`;
- nenhum merge commit adicional foi criado;
- - HEAD de implementação integrado em `easyblox-dev` antes deste checkpoint documental: `b70a3bf7d7`;
- `origin/easyblox-dev` permanecia em `894799ac29` antes da publicação deste checkpoint documental;
- antes deste checkpoint documental, `easyblox-dev` estava 3 commits à frente de `origin/easyblox-dev`;
- `84bf28568d` — `feat: refine pt-BR localization and theme settings`;
- `dac597eafa` — `fix: close action menu after selecting actions`;
- `b70a3bf7d7` — `docs: document pt-BR UX refinement cycle`;
- localização automática de `pt-PT` para `pt-br` implementada e validada;
- refinamentos locais de terminologia pt-BR implementados;
- opção Cat Blocks removida da seleção de temas;
- somente o tema padrão permanece disponível ao usuário;
- preferências antigas de Cat Blocks fazem fallback seguro para o tema padrão;
- Action Menu corrigido para fechar após ações principal e secundárias;
- foco do botão principal removido antes da abertura da biblioteca, impedindo a reabertura indevida do menu ao retornar ao editor;
- integração pós-feature validada novamente com 4 suites e 23 testes aprovados;
- `scratch-gui build:dev` recompilado após a integração com webpack 5.109.2 sem erros;
- nenhum arquivo gerado adicional ficou rastreado após o build;
- validação funcional final realizada diretamente na `easyblox-dev`;
- fluxo da biblioteca de atores validado com o Action Menu permanecendo fechado ao retornar;
- interface pt-BR validada;
- menu Configurações validado exibindo apenas `Idioma` e `Modo de cor`;
- working tree estava limpo antes deste checkpoint documental pós-integração;
- aviso de Browserslist permanece apenas informativo e não deve provocar atualização de dependências neste ciclo.

Decisões de escopo preservadas:

- a Mochila permanece exibindo `Em Breve...` e não foi implementada;
- Cat Blocks não foi renomeado; a opção foi removida da interface;
- nenhuma alteração de Arduino, ESP32, Arduino CLI, geração Arduino C/C++, comunicação com hardware ou EasyConect foi realizada;
- nenhum novo tema visual EasyBlox foi desenvolvido neste ciclo;
- o histórico e a tag `v0.3.0` permanecem intactos em `894799ac29`.

Próxima ação operacional:

1. atualizar `docs/GUIA-DE-DESENVOLVIMENTO.md` para registrar a integração e validação final deste ciclo;
2. revisar integralmente o diff documental pós-integração;
3. executar `git diff --check`;
4. confirmar que somente os dois documentos previstos foram modificados;
5. criar um commit documental pós-integração separado em `easyblox-dev`;
6. publicar `easyblox-dev` em `origin/easyblox-dev`;
7. confirmar sincronização entre local e remoto;
8. confirmar working tree limpo antes de considerar o ciclo integrado e publicado.

Nenhuma nova tag deverá ser criada automaticamente neste ponto. O versionamento do próximo marco deverá ser definido separadamente antes de qualquer nova tag.

## 13. Regras permanentes de trabalho

- Orientar uma etapa por vez.
- Explicar cada comando antes da execução.
- Aguardar confirmação ou imagem após cada etapa.
- Executar `git status` antes de alterações importantes.
- Não apagar arquivos originais sem necessidade confirmada.
- Não misturar correções técnicas com grandes alterações visuais.
- Testar depois de cada grupo pequeno de mudanças.
- Atualizar a documentação após cada marco.
- Usar mensagens de commit convencionais.
- Desenvolver recursos isoláveis em branches próprias; usar `easyblox-dev` como branch principal de integração após testes e aprovação.
- Não executar comandos destrutivos.
- Não usar `npm audit fix --force`.
- Não atualizar dependências sem análise específica.
- Manter atribuições e licenças exigidas pelo projeto Scratch.
- Não apresentar o EasyBlox como produto oficial do Scratch.

## 14. Como retomar em uma conversa nova

Usar esta mensagem:

```text
Quero continuar o desenvolvimento do EasyBlox.

Repositório:
https://github.com/easymakerbrasil/easyblox

Branch principal de integração:
easyblox-dev

Antes de continuar, verifique em docs/CONTINUIDADE-EASYBLOX.md qual é a branch ativa da implementação em andamento.
Não trocar de branch nem realizar merge sem antes confirmar o estado atual do repositório.

Antes de orientar qualquer alteração, leia integralmente:
docs/GUIA-DE-DESENVOLVIMENTO.md
docs/CONTINUIDADE-EASYBLOX.md

O desenvolvimento deve continuar exatamente do próximo passo registrado.

Mantenha o método atual:
- uma etapa por vez;
- explique cada comando;
- aguarde minha imagem ou confirmação;
- teste antes de criar commits;
- atualize a documentação após cada marco;
- preserve as decisões já aprovadas.
```

## 15. Critério de continuidade

Este arquivo deverá ser atualizado sempre que ocorrer:

- decisão importante;
- mudança de arquitetura;
- novo recurso concluído;
- erro relevante e sua solução;
- alteração de ambiente;
- commit de marco;
- mudança no próximo passo.

O GitHub e os documentos do repositório são a fonte oficial da continuidade do EasyBlox.

## 16. Checkpoint — Fundação Arduino UNO e conexão física Web Serial

Data do checkpoint: 14/08/2026.

Branch ativa:

`feat/easyblox-arduino-uno-foundation`

Base do ciclo:

`79988efd0f` — checkpoint final do ciclo pt-BR / UX integrado em `easyblox-dev`.

### 16.1. Prioridade e escopo atual

A prioridade prática do EasyBlox é concluir primeiro o fluxo Arduino UNO de ponta a ponta.

Ordem de implementação aprovada:

1. infraestrutura Serial compartilhada;
2. Arduino UNO como extensão nativa;
3. conexão física com a placa;
4. Modo Palco;
5. blocos Arduino;
6. geração de C++;
7. compilação;
8. Carregar/Upload para a placa;
9. validação das placas da família EasyMaker sobre essa base.

As placas da família EasyMaker atendidas inicialmente sobre a arquitetura Arduino são:

- EasyMaker;
- EasyDuino;

ESP32 e EasyMaker Conect ficam explicitamente para uma etapa posterior, somente depois de Arduino UNO, Modo Palco e Upload funcionarem de ponta a ponta na prática.

Micro:bit não faz parte do roadmap de hardware do EasyBlox. Código herdado relacionado a micro:bit pode ser consultado apenas como referência arquitetural pontual do Scratch VM quando necessário.

A partir deste ciclo, investigações arquiteturais extensas devem ser evitadas. Fazer apenas verificações objetivas quando forem necessárias para desbloquear uma implementação concreta.

### 16.2. Infraestrutura Serial compartilhada

Foi criada a infraestrutura Serial em:

`packages/scratch-vm/src/io/serial.js`

Responsabilidades atuais:

- descoberta ou seleção de periféricos seriais;
- conexão;
- desconexão;
- estado lógico de conexão;
- escrita binária;
- recebimento de `Uint8Array`;
- classificação de desconexão deliberada versus perda inesperada;
- emissão dos eventos de periféricos já usados pelo Scratch VM.

Foi adicionada ao Runtime a capacidade de receber uma factory de transportes Serial:

- `getSerialTransport()`;
- `configureSerialTransportFactory(factory)`.

A API também foi exposta por `VirtualMachine` através de:

`configureSerialTransportFactory(factory)`.

O `scratch-vm` permanece independente de Web Serial, Electron, Node Serial ou qualquer implementação física específica.

### 16.3. Arduino UNO no Scratch VM

Foi criada a extensão:

`packages/scratch-vm/src/extensions/scratch3_arduino_uno/`

Estrutura atual:

- `index.js` — classe da extensão `Scratch3ArduinoUnoBlocks`;
- `peripheral.js` — `ArduinoUnoPeripheral`.

O `ArduinoUnoPeripheral`:

- registra-se no Runtime com `extensionId: 'arduinoUno'`;
- utiliza a infraestrutura compartilhada `Serial`;
- usa atualmente `115200 baud`;
- implementa `scan()`;
- implementa `connect(peripheralId)`;
- implementa `disconnect()`;
- implementa `isConnected()`;
- já possui pontos reservados para inicialização, parser e reset do futuro Modo Palco.

A extensão foi registrada como built-in em:

`packages/scratch-vm/src/extension-support/extension-manager.js`

Validação direta pelo próprio VM aprovada:

```text
Arduino UNO extension loaded successfully
Peripheral registered: ArduinoUnoPeripheral
Connected: false

### 16.4. Arduino UNO na biblioteca da GUI

A Arduino UNO foi adicionada à biblioteca visual de extensões em:

packages/scratch-gui/src/lib/libraries/extensions/index.jsx

Metadados principais:

extensionId: 'arduinoUno';
launchPeripheralConnectionFlow: true;
useAutoScan: false;
connectionTransport: 'serial'.

O comportamento platform-aware implementado anteriormente permanece:

WEB → fluxo AutoScanningStep, permitindo seleção explícita através do seletor da plataforma;
DESKTOP → fluxo ScanningStep, preparado para futura enumeração de portas;
demais plataformas → comportamento declarado pela extensão.

Foi criado temporariamente o asset:

packages/scratch-gui/src/lib/libraries/extensions/arduinoUno/arduino-uno.svg

Esse asset é provisório e serve apenas para permitir a implementação funcional. A identidade visual definitiva da extensão poderá ser refinada posteriormente sem alterar a arquitetura.

### 16.5. Web Serial Transport

Foi criado:

packages/scratch-gui/src/lib/serial/web-serial-transport.js

Contrato implementado:

requestPort();
open(peripheralId, options);
close();
write(data);
setOnData(callback);
setOnClose(callback);
setOnError(callback).

A implementação utiliza Web Serial somente na camada GUI e não introduz navigator.serial dentro do scratch-vm.

O transporte foi conectado à criação padrão do VM em:

packages/scratch-gui/src/reducers/vm.ts

através de:

vm.configureSerialTransportFactory(...).

Durante os testes foi identificado e corrigido um loop infinito no _readLoop() quando reader.read() retornava done: true. O problema causava crescimento contínuo de memória até JavaScript heap out of memory.

Após a correção, o término do stream encerra corretamente o loop externo e pode ser classificado como perda inesperada quando apropriado.

### 16.6. Testes automatizados aprovados

Infraestrutura Serial:

packages/scratch-vm/test/unit/serial.js

Resultado:

23 asserts
23 pass
0 fail

Arduino UNO Peripheral:

packages/scratch-vm/test/unit/arduino-uno.js

Resultado:

13 asserts
13 pass
0 fail

Web Serial Transport:

packages/scratch-gui/test/unit/util/web-serial-transport.test.js

Resultado:

Test Suites: 1 passed
Tests:       7 passed
Snapshots:   0

Os testes Web Serial validam:

seleção de porta;
identificação USB VID/PID;
estabilidade do peripheralId;
cancelamento do seletor;
Web Serial indisponível;
listener de desconexão física;
open();
write();
close();
recebimento de Uint8Array.

Avisos não bloqueantes conhecidos durante os testes da GUI:

duplicate manual mock index entre os modos de cor dark/default;
Browserslist/caniuse-lite desatualizado.

Não atualizar dependências apenas por causa desses avisos.

### 16.7. Build e validação física

O scratch-vm foi recompilado após a introdução da nova API Serial.

Resultado:

webpack 5.109.2 compiled successfully

Foi necessário reiniciar o dev-server depois do rebuild do scratch-vm, pois o processo anterior mantinha um bundle/HMR que ainda não possuía configureSerialTransportFactory() e provocava tela branca na inicialização.

Após reinicialização limpa:

EasyBlox carregou normalmente;
Arduino UNO apareceu na biblioteca de extensões;
a extensão foi adicionada ao projeto;
o diálogo de conexão Serial foi aberto;
o Chrome apresentou o seletor nativo Web Serial;
uma placa física foi detectada como USB Serial (COM11);
a porta foi selecionada e aberta;
o EasyBlox exibiu estado Conectado;
o botão Desconectar foi disponibilizado.

Portanto, está validado na prática:

Arduino UNO física
→ USB
→ Chrome Web Serial
→ WebSerialTransport
→ Serial
→ ArduinoUnoPeripheral
→ Runtime
→ GUI EasyBlox
→ estado Conectado

Este é o primeiro marco de comunicação física Arduino UNO funcional no EasyBlox.

### 16.8. Estado Git deste checkpoint

Os arquivos Arduino/Serial deste marco estão preparados no stage para validação e commit.

Existe uma modificação local conhecida e não relacionada em:

packages/scratch-gui/src/components/action-menu/icon--sprite.svg

Essa alteração NÃO deve ser incluída em commits Arduino/Serial.

git diff --cached --check foi executado e aprovado após a remoção de um trailing whitespace no teste Web Serial.

### 16.9. Próximo passo exato

Depois de documentar, validar e criar o checkpoint Git deste marco, iniciar a implementação prática do Modo Palco da Arduino UNO.

O próximo bloco técnico deve concentrar-se em:

definir o protocolo mínimo necessário entre EasyBlox e Arduino UNO;
implementar framing/parser no ArduinoUnoPeripheral;
implementar inicialização da conexão Stage;
introduzir os primeiros blocos Arduino, começando por operações digitais simples;
testar comunicação real EasyBlox → Arduino UNO;
somente depois expandir para leitura analógica, PWM, tone e demais recursos.

Não iniciar ESP32, EasyMaker Conect, Arduino CLI ou geração C++ antes de estabilizar o Modo Palco Arduino UNO na prática.

### 16.10. Backlog registrado, fora do ciclo atual

Foi registrado para um ciclo futuro de UX:

permitir remover do projeto uma extensão previamente adicionada, comportamento inexistente atualmente no Scratch herdado e desejado para o EasyBlox com referência conceitual no PictoBlox.

Esse item não deve desviar o ciclo atual Arduino UNO.

## 17. Checkpoint — Modo Palco Arduino UNO: protocolo e handshake físico

Data: 14/08/2026

### 17.1. Objetivo deste marco

Após a conclusão da fundação Arduino UNO + Web Serial registrada na seção 16, foi iniciada a implementação prática do Modo Palco.

O primeiro objetivo foi estabelecer uma comunicação binária própria entre EasyBlox e Arduino UNO, independente da simples abertura da porta Serial.

Neste marco, conexão física e conexão de protocolo passaram a ser tratadas separadamente:

- `isConnected()` indica que a porta Serial está fisicamente aberta;
- `isStageConnected()` indica que o firmware EasyBlox respondeu corretamente ao handshake do Modo Palco.

### 17.2. Protocolo Stage inicial

Foi criado:

`packages/scratch-vm/src/extensions/scratch3_arduino_uno/protocol.js`

Formato inicial do frame:

`FF 55 | VERSION | SEQ | COMMAND | LENGTH | PAYLOAD | CHECKSUM`

Definições atuais:

- assinatura: `0xFF 0x55`;
- versão inicial: `0x01`;
- sequence de 8 bits;
- payload máximo: 32 bytes;
- checksum por XOR;
- parser incremental preparado para dados Serial fragmentados.

Comandos iniciais:

- `0x01` — `PING`;
- `0x10` — `DIGITAL_WRITE`.

Respostas iniciais:

- `0x80` — `ACK`;
- `0x81` — `PONG`;
- `0xFF` — `ERROR`.

O parser possui recuperação diante de:

- ruído antes do frame;
- frame recebido em múltiplos chunks;
- múltiplos frames no mesmo chunk;
- checksum inválido;
- payload inválido;
- reset de estado parcial.

### 17.3. Testes do protocolo

Foi criado:

`packages/scratch-vm/test/unit/arduino-uno-protocol.js`

Resultado:

- 33 asserts;
- 33 pass;
- 0 fail;
- 1 suíte aprovada.

Foram validados:

- cálculo de checksum;
- codificação de `PING`;
- codificação de `DIGITAL_WRITE`;
- parsing de frame completo;
- parsing em chunks;
- frames consecutivos;
- recuperação após ruído;
- rejeição de checksum inválido;
- reset de frame incompleto.

### 17.4. Firmware Stage Arduino UNO

Foi criada a estrutura:

`packages/scratch-vm/firmware/arduino-uno/stage/stage.ino`

O firmware inicial utiliza:

- `Serial` a 115200 baud;
- parser incremental byte a byte;
- buffer fixo de 32 bytes;
- nenhuma `String`;
- nenhuma alocação dinâmica;
- protocolo compatível com `protocol.js`.

O primeiro comportamento implementado é:

`PING → PONG`

A resposta `PONG` preserva a mesma sequence recebida no `PING`.

### 17.5. Compilação física do firmware

O Arduino CLI disponível na instalação local do Arduino IDE foi localizado em:

`C:\Program Files\Arduino IDE\resources\app\lib\backend\resources\arduino-cli.exe`

Versão utilizada:

`arduino-cli 1.5.1`

O firmware foi compilado para:

`arduino:avr:uno`

Resultado:

- programa: 1814 bytes de 32256 bytes — 5%;
- variáveis globais: 191 bytes de 2048 bytes — 9%;
- aproximadamente 1857 bytes de RAM restantes.

O Arduino CLI foi utilizado neste marco somente como ferramenta externa de compilação e gravação para validar o firmware Stage.

A integração de Arduino CLI ao fluxo interno do EasyBlox para geração C++, compilação e Upload continua fora deste checkpoint.

### 17.6. Upload e validação física

A placa física foi identificada em:

`COM11`

O primeiro upload falhou com:

`Acesso negado`

A causa foi confirmada: a COM11 ainda estava aberta pelo EasyBlox através do Web Serial.

Após usar `Desconectar` no EasyBlox, o firmware Stage foi gravado com sucesso na placa.

### 17.7. Primeiro handshake físico

O `ArduinoUnoPeripheral` foi ampliado para:

- criar o parser Stage;
- enviar `PING`;
- receber frames;
- reconhecer `PONG`;
- expor `isStageConnected()`.

Durante a primeira validação física foi confirmado:

- `isConnected() === true`;
- `isStageConnected() === false`.

Foi diagnosticado que o primeiro `PING` estava sendo enviado cedo demais após a abertura da porta Serial.

A Arduino UNO sofre auto-reset quando a conexão Serial é aberta e pode ainda estar no bootloader quando o primeiro comando chega.

Um `PING` enviado manualmente após a estabilização da placa confirmou fisicamente:

- PING transmitido;
- PONG retornado;
- mesma sequence preservada;
- parser funcionando;
- `isStageConnected() === true`.

Portanto, protocolo, firmware, Web Serial e parser foram comprovados fisicamente de ponta a ponta.

### 17.8. Tratamento do auto-reset

O handshake automático foi alterado para ser tolerante ao reset da Arduino UNO.

Configuração atual:

- atraso inicial: 500 ms;
- intervalo entre tentativas: 500 ms;
- máximo: 6 tentativas.

Fluxo:

`Serial aberta`
→ `aguarda reset`
→ `PING`
→ `retry se necessário`
→ `PONG válido`
→ `Stage conectado`
→ `retries cancelados`

O estado do handshake também é resetado corretamente em desconexões.

### 17.9. Testes do ArduinoUnoPeripheral

O teste:

`packages/scratch-vm/test/unit/arduino-uno.js`

foi ampliado para validar:

- conexão Serial;
- estado Stage inicialmente falso;
- envio de PING após atraso;
- recebimento de PONG;
- ativação de `isStageConnected()`;
- retry quando o primeiro PING não responde;
- cancelamento dos retries após PONG válido.

Resultado atual:

- 26 asserts;
- 26 pass;
- 0 fail;
- 1 suíte aprovada.

Cobertura observada de `peripheral.js`:

- 97,43% das linhas;
- 100% das funções.

### 17.10. Validação física final do handshake automático

Após rebuild do `scratch-vm` e reinicialização limpa do dev-server, a Arduino UNO foi conectada normalmente pelo EasyBlox.

Nenhum PING manual foi executado.

Após o handshake automático, o estado real observado foi:

- `hasPeripheral: true`;
- `isConnected: true`;
- `isStageConnected: true`.

Portanto, está validado fisicamente:

EasyBlox
→ ArduinoUnoPeripheral
→ protocolo Stage
→ Serial
→ WebSerialTransport
→ Chrome Web Serial
→ COM11
→ Arduino UNO
→ firmware Stage
→ PONG
→ parser EasyBlox
→ `isStageConnected() === true`

Este é o primeiro marco funcional do Modo Palco Arduino UNO no EasyBlox.

### 17.11. Instrumentação temporária

Durante a validação física, a VM foi temporariamente exposta no navegador como:

`window.easyBloxVM`

Isso foi utilizado somente para diagnóstico do estado interno de `ArduinoUnoPeripheral`.

A instrumentação foi removida após a validação.

`packages/scratch-gui/src/reducers/vm.ts` voltou ao estado funcional anterior e passou no ESLint sem erros ou warnings.

### 17.12. Próximo passo exato

O próximo passo do ciclo Arduino UNO é implementar o primeiro comando físico do Modo Palco:

`DIGITAL_WRITE`

Objetivo imediato:

EasyBlox
→ comando digital
→ protocolo Stage
→ Arduino UNO
→ alterar fisicamente um pino digital.

A implementação deverá avançar nesta ordem:

1. executar `DIGITAL_WRITE` no firmware;
2. expor o comando em `ArduinoUnoPeripheral`;
3. validar protocolo e testes;
4. testar fisicamente ligar/desligar um pino da UNO;
5. somente depois criar e validar o primeiro bloco visível Arduino UNO no editor.

Após `DIGITAL_WRITE`, seguir progressivamente para:

- leitura digital;
- leitura analógica;
- PWM;
- tone;
- demais recursos Arduino UNO.

ESP32 e EasyMaker Conect continuam fora deste ciclo.

Geração C++, compilação e Upload integrados ao EasyBlox continuam posteriores à estabilização do Modo Palco básico.

## 18. Checkpoint — Arduino UNO DIGITAL_WRITE funcional no Modo Palco

Data: 14/08/2026

### 18.1. Objetivo deste marco

Foi concluído o primeiro primitive físico completo do Modo Palco Arduino UNO:

`DIGITAL_WRITE = 0x10`

Este marco é a primeira validação completa do fluxo:

EasyBlox
→ bloco visual Arduino UNO
→ Scratch VM
→ `ArduinoUnoPeripheral`
→ protocolo Stage
→ Web Serial
→ Arduino UNO
→ firmware Stage
→ alteração física real de um pino.

### 18.2. Formato do comando

Comando:

`DIGITAL_WRITE = 0x10`

Payload:

`[PIN, VALUE]`

Valores:

- `VALUE = 1` → nível lógico ALTO;
- `VALUE = 0` → nível lógico BAIXO.

Respostas utilizadas:

- `ACK = 0x80`;
- `ERROR = 0xFF`.

O firmware responde `ACK` após uma escrita digital válida e `ERROR` quando o payload, pino ou valor recebido é inválido.

### 18.3. Pinos digitais suportados

A faixa inicialmente planejada como D2–D13 foi ampliada durante a validação para aproveitar também os pinos analógicos da Arduino UNO como GPIO digital.

Pinos disponíveis no bloco:

- D2 até D13;
- A0 até A5.

Mapeamento interno utilizado pela Arduino:

- A0 → 14;
- A1 → 15;
- A2 → 16;
- A3 → 17;
- A4 → 18;
- A5 → 19.

Portanto, a faixa interna válida para `DIGITAL_WRITE` é:

`2–19`

D0 e D1 permanecem protegidos porque são utilizados pela UART/Serial.

Valores acima de 19 são rejeitados.

### 18.4. Firmware Stage

Arquivo:

`packages/scratch-vm/firmware/arduino-uno/stage/stage.ino`

Foi implementado:

- `COMMAND_DIGITAL_WRITE = 0x10`;
- `RESPONSE_ACK = 0x80`;
- `RESPONSE_ERROR = 0xFF`;
- validação obrigatória de payload com exatamente 2 bytes;
- validação do pino entre 2 e 19;
- validação do valor como somente 0 ou 1;
- configuração automática com `pinMode(pin, OUTPUT)`;
- escrita com `digitalWrite()`;
- resposta `ACK` após execução válida;
- resposta `ERROR` para parâmetros inválidos.

O comportamento anterior de `PING → PONG` foi preservado.

### 18.5. Compilação do firmware

O firmware Stage atualizado foi compilado com:

`arduino-cli 1.5.1`

FQBN:

`arduino:avr:uno`

Resultado:

- programa: 2166 bytes de 32256 bytes — 6%;
- variáveis globais: 223 bytes de 2048 bytes — 10%;
- 1825 bytes disponíveis para variáveis locais.

O firmware foi gravado fisicamente na Arduino UNO pela COM11.

Permanece válida a regra:

antes de usar Arduino CLI para upload, a COM11 deve ser liberada usando `Desconectar` no EasyBlox.

### 18.6. ArduinoUnoPeripheral

Arquivo:

`packages/scratch-vm/src/extensions/scratch3_arduino_uno/peripheral.js`

Foi criado:

`digitalWrite(pin, value)`

O método:

- exige `isStageConnected() === true`;
- aceita somente pinos inteiros entre 2 e 19;
- rejeita D0 e D1;
- rejeita valores diferentes de 0 e 1;
- envia `COMMANDS.DIGITAL_WRITE`;
- utiliza payload `[pin, value]`;
- reutiliza `_sendCommand()` e a infraestrutura Stage existente.

Nenhuma nova camada Serial foi criada.

### 18.7. Primeiro bloco visual Arduino UNO

Arquivo:

`packages/scratch-vm/src/extensions/scratch3_arduino_uno/index.js`

Foi criado o primeiro bloco físico da extensão Arduino UNO:

`definir pino [PIN] como [VALUE]`

Menus atuais:

PIN:

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

VALUE:

- `ALTO` → valor interno `1`;
- `BAIXO` → valor interno `0`.

A terminologia visual aprovada para o EasyBlox é:

- ALTO;
- BAIXO.

Os termos técnicos HIGH/LOW podem continuar sendo utilizados internamente em código e documentação técnica quando necessário.

### 18.8. Validação física D13

O primeiro teste físico do bloco visual utilizou o LED integrado da Arduino UNO em D13.

Foi validado:

`definir pino [D13] como [ALTO]`

Resultado:

- LED L integrado acendeu.

Em seguida:

`definir pino [D13] como [BAIXO]`

Resultado:

- LED L integrado apagou.

Portanto, o primeiro fluxo completo executado pelo próprio bloco visual foi confirmado fisicamente.

### 18.9. Validação física A0 como GPIO digital

Também foi validado o uso de um pino analógico como saída digital.

Com multímetro entre A0 e GND:

`definir pino [A0] como [ALTO]`

Resultado observado:

`4,92 V`

Depois:

`definir pino [A0] como [BAIXO]`

Resultado observado:

`0 V`

Isso confirma fisicamente o mapeamento:

`A0 → pino digital interno 14`

e valida a ampliação da faixa para A0–A5.

### 18.10. Testes unitários

Teste:

`packages/scratch-vm/test/unit/arduino-uno.js`

Resultado final deste marco:

- 49 asserts;
- 49 pass;
- 0 fail;
- 1 suíte aprovada.

Foram adicionadas validações para:

- envio de `DIGITAL_WRITE` após handshake;
- frame correto com payload `[13, 1]`;
- bloqueio antes do Stage estar conectado;
- proteção de D0 e D1;
- rejeição de pinos acima de A5;
- rejeição de valores digitais inválidos;
- existência do bloco visual;
- menu D2–D13;
- menu A0–A5;
- terminologia ALTO/BAIXO;
- conversão dos valores do Blockly para números;
- delegação correta para `ArduinoUnoPeripheral`.

Teste do protocolo:

`packages/scratch-vm/test/unit/arduino-uno-protocol.js`

Resultado:

- 33 asserts;
- 33 pass;
- 0 fail;
- 1 suíte aprovada.

### 18.11. Build e verificações

`scratch-vm` foi recompilado com sucesso após as alterações.

Warnings conhecidos e não bloqueantes permaneceram:

- TypeDoc de Runtime/VirtualMachine/ExtensionManager;
- Browserslist/caniuse-lite;
- canvas/jsdom;
- warnings JSDoc já conhecidos.

Nenhuma dependência foi atualizada por causa desses warnings.

`git diff --check` dos arquivos Arduino deste marco foi aprovado.

O warning de conversão:

`LF will be replaced by CRLF`

em `stage.ino` permanece conhecido e não bloqueante no Windows.

### 18.12. Instrumentação temporária de validação

Durante a primeira validação de `DIGITAL_WRITE`, a VM foi temporariamente exposta no navegador para permitir chamada direta de:

`ArduinoUnoPeripheral.digitalWrite(13, 1)`

e:

`ArduinoUnoPeripheral.digitalWrite(13, 0)`

Essa instrumentação foi utilizada somente antes da criação do bloco visual.

Após a validação, a alteração temporária foi completamente removida.

Nenhuma exposição de `window.easyBloxVM` permanece no código atual.

### 18.13. Estado funcional atual

Neste checkpoint, o Arduino UNO já possui no Modo Palco:

- Web Serial funcional;
- conexão física;
- protocolo Stage;
- handshake automático;
- PING/PONG;
- tratamento do auto-reset;
- `isConnected()`;
- `isStageConnected()`;
- `DIGITAL_WRITE`;
- D2–D13 como saídas digitais;
- A0–A5 como saídas digitais;
- primeiro bloco visual funcional;
- ALTO/BAIXO;
- validação física real pelo editor.

Este é o primeiro primitive físico completo do EasyBlox executado diretamente por um bloco visual no Arduino UNO.

### 18.14. Próximo passo exato

O próximo primitive do ciclo Arduino UNO será a leitura digital.

A sequência permanece incremental:

1. definir o comando de leitura digital no protocolo Stage;
2. implementar no firmware;
3. implementar no `ArduinoUnoPeripheral`;
4. criar testes;
5. validar fisicamente;
6. somente depois criar o bloco visual correspondente.

Não iniciar ESP32, EasyMaker Conect ou outras placas antes da conclusão da base Arduino UNO.

## 19. Checkpoint — Arduino UNO DIGITAL_READ funcional no Modo Palco

Data: 14/08/2026.

### 19.1. Objetivo concluído

O segundo primitive físico do Arduino UNO no Modo Palco foi concluído:

`DIGITAL_READ`

O fluxo completo validado é:

`bloco reporter EasyBlox → Scratch VM → ArduinoUnoPeripheral → protocolo Stage → firmware Arduino UNO → digitalRead() → resposta serial → reporter EasyBlox`

A leitura digital foi validada tanto diretamente pela camada JavaScript quanto pelo bloco visual da extensão.

### 19.2. Contrato do protocolo

Novo comando:

`DIGITAL_READ = 0x11`

Payload da requisição:

`[PIN]`

Nova resposta:

`DIGITAL_READ = 0x91`

Payload da resposta:

`[PIN, VALUE]`

Onde:

- `PIN` identifica o pino solicitado;
- `VALUE = 0` representa nível BAIXO;
- `VALUE = 1` representa nível ALTO.

A resposta utiliza a mesma `SEQ` da requisição para permitir correlação entre comando e resposta.

Exemplo:

`DIGITAL_READ D2`

Requisição:

`COMMAND = 0x11`
`PAYLOAD = [2]`

Resposta em nível ALTO:

`COMMAND = 0x91`
`PAYLOAD = [2, 1]`

### 19.3. Faixa de pinos digitais

A leitura digital segue a mesma faixa adotada no `DIGITAL_WRITE`:

- D2–D13;
- A0–A5 utilizados como GPIO digital.

Mapeamento interno:

- A0 = 14;
- A1 = 15;
- A2 = 16;
- A3 = 17;
- A4 = 18;
- A5 = 19.

Faixa numérica aceita:

`2..19`

D0 e D1 permanecem protegidos porque são utilizados pela UART/Serial.

A validação existe tanto no EasyBlox/JavaScript quanto no firmware Arduino.

### 19.4. Firmware Arduino UNO

Arquivo:

`packages/scratch-vm/firmware/arduino-uno/stage/stage.ino`

Foi implementado:

`COMMAND_DIGITAL_READ = 0x11`

e:

`RESPONSE_DIGITAL_READ = 0x91`

O firmware:

1. valida payload com exatamente 1 byte;
2. valida o pino na faixa 2–19;
3. configura o pino como `INPUT`;
4. executa `digitalRead(pin)`;
5. converte o resultado para `0` ou `1`;
6. responde com `[PIN, VALUE]`;
7. preserva a `SEQ` da requisição.

Payload ou pino inválido continuam produzindo:

`RESPONSE_ERROR = 0xFF`

### 19.5. Uso de memória do firmware

Compilação para:

`arduino:avr:uno`

Resultado após inclusão do `DIGITAL_READ`:

- Flash: 2468 bytes de 32256 bytes — 7%;
- SRAM global: 223 bytes de 2048 bytes — 10%;
- SRAM restante para variáveis locais: 1825 bytes.

A SRAM permaneceu no mesmo consumo observado no marco anterior.

### 19.6. ArduinoUnoPeripheral

Arquivo:

`packages/scratch-vm/src/extensions/scratch3_arduino_uno/peripheral.js`

Foi implementado:

`digitalRead(pin)`

A leitura é assíncrona e retorna uma `Promise`.

Cada leitura pendente é registrada em:

`_pendingDigitalReads`

utilizando a `SEQ` como chave.

Uma resposta somente é aceita quando:

- o comando é `RESPONSES.DIGITAL_READ`;
- existe uma leitura pendente com a mesma `SEQ`;
- o payload possui exatamente 2 bytes;
- o pino recebido corresponde ao pino solicitado;
- o valor recebido é `0` ou `1`.

Após uma resposta válida, a leitura pendente é removida e a Promise é resolvida com o valor recebido.

Em reset ou desconexão, leituras ainda pendentes são resolvidas com `null` e removidas, evitando Promises abandonadas.

### 19.7. Testes do protocolo

Arquivo:

`packages/scratch-vm/test/unit/arduino-uno-protocol.js`

Foram acrescentados testes para:

- codificação da requisição `DIGITAL_READ`;
- payload `[PIN]`;
- comando `0x11`;
- parsing da resposta `0x91`;
- payload `[PIN, VALUE]`;
- preservação da `SEQ`.

Resultado:

- 45 asserts;
- 45 pass;
- 0 fail;
- 1 suíte aprovada.

### 19.8. Testes da extensão Arduino UNO

Arquivo:

`packages/scratch-vm/test/unit/arduino-uno.js`

Foram acrescentados testes para:

- envio de `DIGITAL_READ` após handshake;
- retorno de uma Promise pelo peripheral;
- frame correto com payload `[PIN]`;
- correlação da resposta pela `SEQ`;
- resolução da leitura física com `0` ou `1`;
- bloqueio antes do handshake;
- proteção de D0 e D1;
- rejeição de pinos acima de A5;
- rejeição de pinos não inteiros;
- existência do bloco visual de leitura digital;
- `BlockType.BOOLEAN`;
- reutilização do menu `digitalPins`;
- conversão do valor do menu para número;
- delegação correta para `ArduinoUnoPeripheral.digitalRead()`;
- conversão visual de `1` para `true`;
- conversão visual de `0` para `false`.

Resultado final:

- 69 asserts;
- 69 pass;
- 0 fail;
- 1 suíte aprovada.

### 19.9. Build

Após as alterações em `packages/scratch-vm/src`, foi executado:

`npm --workspace @scratch/scratch-vm run build`

O build foi concluído com sucesso.

Permaneceram apenas os warnings conhecidos e não bloqueantes:

- TypeDoc;
- Browserslist/caniuse-lite;
- canvas/jsdom.

Nenhuma dependência foi atualizada por causa desses warnings.

### 19.10. Validação física direta

O firmware foi gravado fisicamente no Arduino UNO pela COM11.

Foi necessário liberar a COM11 antes do upload porque o Web Serial mantinha a porta ocupada.

A leitura direta pelo `ArduinoUnoPeripheral.digitalRead()` foi validada fisicamente.

D2:

- D2 conectado ao GND → `digitalRead(2)` retornou `0`;
- D2 conectado ao 5V → `digitalRead(2)` retornou `1`.

Também foi validado um pino analógico utilizado como GPIO digital.

A2 corresponde internamente ao pino digital 16:

- A2 conectado ao GND → `digitalRead(16)` retornou `0`;
- A2 conectado ao 5V → `digitalRead(16)` retornou `1`.

### 19.11. Bloco booleano de leitura digital

Novo bloco:

`ler pino digital [PIN]`

Tipo:

`BlockType.BOOLEAN`

Opcode:

`digitalRead`

O formato booleano faz o bloco ser apresentado visualmente em formato hexagonal, adequado para uso direto em condições lógicas.

Exemplo:

`se <ler pino digital [D2]> então`

O bloco reutiliza o menu:

`digitalPins`

portanto disponibiliza:

- D2–D13;
- A0–A5.

A0–A5 permanecem corretamente disponíveis para leitura digital porque também correspondem aos GPIO digitais internos 14–19:

- A0 = 14;
- A1 = 15;
- A2 = 16;
- A3 = 17;
- A4 = 18;
- A5 = 19.

O firmware e o `ArduinoUnoPeripheral` continuam trabalhando com o nível lógico bruto:

- `0` para BAIXO;
- `1` para ALTO.

Na camada visual do bloco booleano, o EasyBlox converte:

- `0` → `false`;
- `1` → `true`.

A terminologia visual ALTO/BAIXO permanece utilizada nos blocos que apresentam seleção textual de estado.

### 19.12. Validação física pelo bloco visual

O bloco booleano foi validado diretamente no editor EasyBlox.

Com A2 selecionado:

- nível ALTO → `ler pino digital [A2]` retornou `true`;
- nível BAIXO → `ler pino digital [A2]` retornou `false`.

A validação confirmou também o formato visual booleano/hexagonal do bloco.

A camada física permanece baseada em:

- `0` para BAIXO;
- `1` para ALTO.

A conversão para `false/true` ocorre somente na camada do bloco da extensão.

Isso confirma o fluxo completo:

`bloco booleano → Scratch VM → peripheral → protocolo → firmware → Arduino UNO → resposta 0/1 → conversão false/true → bloco visual`

### 19.13. Instrumentação temporária

Durante a validação física antes da criação do reporter, a VM foi temporariamente exposta como:

`window.easyBloxVM`

em:

`packages/scratch-gui/src/lib/app-state-provider-hoc.jsx`

A instrumentação foi completamente removida após os testes.

O arquivo voltou exatamente ao estado original e não possui diff pendente.

Nenhuma exposição de `window.easyBloxVM` deverá entrar no commit.

### 19.14. Separação entre leitura digital e analógica

Foi definida a separação conceitual e visual entre os dois tipos de leitura:

`ler pino digital [PIN]`

e futuramente:

`ler pino analógico [PIN]`

A leitura digital no firmware e no peripheral representa nível lógico como:

`0 ou 1`

No bloco visual booleano, esses valores são apresentados como:

- `false` para nível BAIXO;
- `true` para nível ALTO.

A leitura analógica utilizará o ADC do Arduino UNO e retornará:

`0..1023`

O futuro bloco de leitura analógica deverá possuir menu específico:

`A0–A5`

A existência do bloco analógico não remove a possibilidade de utilizar A0–A5 como GPIO digital.

Portanto, A0–A5 podem participar do bloco digital quando utilizados como GPIO e também do futuro bloco analógico quando utilizados pelo ADC.

### 19.15. Estado funcional atual

O Arduino UNO no Modo Palco possui agora:

- Web Serial;
- conexão física;
- handshake automático;
- protocolo Stage;
- PING/PONG;
- tratamento do auto-reset;
- `DIGITAL_WRITE`;
- `DIGITAL_READ`;
- D2–D13 como GPIO digital;
- A0–A5 como GPIO digital;
- bloco `definir pino [PIN] como [VALUE]`;
- reporter `ler pino digital [PIN]`;
- escrita física validada;
- leitura física validada;
- leitura assíncrona correlacionada por `SEQ`.

Os dois primeiros primitives físicos completos do Modo Palco Arduino UNO estão, portanto, funcionais:

1. escrita digital;
2. leitura digital.

### 19.16. Próximo passo exato

Após concluir o commit e o push deste checkpoint, o próximo primitive será:

`ANALOG_READ`

Bloco visual previsto:

`ler pino analógico [PIN]`

Menu:

`A0–A5`

Faixa esperada no Arduino UNO:

`0..1023`

O desenvolvimento deverá continuar incrementalmente:

1. definir contrato do protocolo;
2. criar testes do protocolo;
3. implementar firmware;
4. compilar;
5. implementar peripheral;
6. criar testes;
7. validar fisicamente;
8. somente depois criar e validar o reporter visual.

Não iniciar ESP32, EasyMaker Conect ou outras placas antes da conclusão da base Arduino UNO.

## 20. Checkpoint — Arduino UNO ANALOG_READ funcional no Modo Palco

O terceiro primitive físico da base Arduino UNO foi concluído e validado de ponta a ponta:

`ANALOG_READ`

O fluxo completo está funcional:

`bloco visual → Scratch VM → ArduinoUnoPeripheral → protocolo Stage → firmware → ADC do Arduino UNO → resposta serial → valor 0..1023`

### 20.1. Contrato do protocolo

Foi definido o comando:

`ANALOG_READ = 0x12`

E a resposta:

`ANALOG_READ = 0x92`

A requisição utiliza payload:

`[PIN]`

Os pinos analógicos são representados internamente como:

- A0 = 14;
- A1 = 15;
- A2 = 16;
- A3 = 17;
- A4 = 18;
- A5 = 19.

A resposta utiliza payload:

`[PIN, VALUE_MSB, VALUE_LSB]`

A ordem dos bytes é MSB-first.

Exemplo para A0 retornando 1023:

`[14, 0x03, 0xFF]`

No host, o valor é reconstruído por:

`(VALUE_MSB << 8) | VALUE_LSB`

A faixa válida é:

`0..1023`

A resposta é correlacionada à requisição pelo mesmo `SEQ`.

### 20.2. Testes do protocolo

Foram adicionados testes para:

- codificação da requisição `ANALOG_READ`;
- parsing da resposta `ANALOG_READ`;
- preservação do `SEQ`;
- payload com PIN + MSB + LSB.

Resultado:

`57 pass / 0 fail`

Arquivo:

`packages/scratch-vm/test/unit/arduino-uno-protocol.js`

### 20.3. Firmware Arduino UNO

Arquivo:

`packages/scratch-vm/firmware/arduino-uno/stage/stage.ino`

Foram adicionados:

`COMMAND_ANALOG_READ = 0x12`

`RESPONSE_ANALOG_READ = 0x92`

O firmware aceita somente os pinos internos:

`14..19`

correspondentes a:

`A0..A5`

Antes da leitura, o pino é configurado como entrada e o pull-up interno é desabilitado.

A leitura utiliza:

`analogRead(pin)`

O resultado de 10 bits é dividido em:

- byte alto;
- byte baixo.

A resposta é enviada no formato:

`[PIN, VALUE_MSB, VALUE_LSB]`

### 20.4. Footprint do firmware

Compilação para:

`arduino:avr:uno`

Resultado:

- Flash: `2616 bytes (8%)`;
- SRAM global: `223 bytes (10%)`;
- SRAM livre: `1825 bytes`.

Comparação com o marco anterior `DIGITAL_READ`:

- Flash: `2468 → 2616 bytes`;
- aumento: `148 bytes`;
- SRAM: permaneceu em `223 bytes`.

### 20.5. ArduinoUnoPeripheral

Arquivo:

`packages/scratch-vm/src/extensions/scratch3_arduino_uno/peripheral.js`

Foi implementado:

`analogRead(pin)`

O método:

- exige handshake Stage concluído;
- aceita somente inteiros de 14 a 19;
- envia `COMMANDS.ANALOG_READ`;
- mantém a leitura pendente correlacionada por `SEQ`;
- aguarda `RESPONSES.ANALOG_READ`;
- valida o PIN retornado;
- valida payload de três bytes;
- reconstrói MSB/LSB;
- rejeita valores maiores que 1023;
- resolve uma `Promise<number>` com o resultado.

Foi criado:

`_pendingAnalogReads`

No `_reset()`, todas as leituras analógicas pendentes são resolvidas com `null` e o mapa é limpo.

O mecanismo de `DIGITAL_READ` permaneceu independente e preservado.

### 20.6. Testes da extensão Arduino UNO

Foram adicionados testes para:

- envio de `ANALOG_READ` após handshake;
- pino A0 codificado como 14;
- correlação pelo mesmo `SEQ`;
- reconstrução de `[0x03, 0xFF]` como `1023`;
- rejeição de leitura antes do handshake;
- rejeição de pinos fora de A0–A5;
- rejeição de pino não inteiro;
- metadata do bloco visual;
- menu analógico;
- conversão do valor do menu para número;
- delegação ao `ArduinoUnoPeripheral`.

Resultado final:

`89 pass / 0 fail`

Arquivo:

`packages/scratch-vm/test/unit/arduino-uno.js`

### 20.7. Bloco visual

Foi adicionado o reporter:

`ler pino analógico [PIN]`

Tipo:

`BlockType.REPORTER`

O menu é exclusivo:

- A0;
- A1;
- A2;
- A3;
- A4;
- A5.

Internamente:

- A0 = 14;
- A1 = 15;
- A2 = 16;
- A3 = 17;
- A4 = 18;
- A5 = 19.

O método da extensão converte o valor recebido pelo menu com `Number(args.PIN)` e delega a leitura ao peripheral.

O reporter retorna diretamente um valor numérico na faixa:

`0..1023`

A inclusão deste menu não modifica os blocos digitais.

A0–A5 continuam disponíveis também em:

`digitalPins`

quando utilizados como GPIO digital.

### 20.8. Validação física

O firmware foi gravado fisicamente no Arduino UNO pela porta:

`COM11`

A leitura analógica foi validada diretamente no A2, representado internamente pelo pino 16.

Teste inferior:

`A2 → GND`

Resultado:

`0`

Teste superior:

`A2 → 5 V`

Resultado:

`1023`

Isso confirmou fisicamente:

- protocolo;
- firmware;
- ADC;
- serial;
- correlação por `SEQ`;
- reconstrução MSB/LSB;
- `ArduinoUnoPeripheral.analogRead()`.

O bloco visual também foi validado no EasyBlox após rebuild do Scratch VM e reinicialização do dev-server.

### 20.9. Build do Scratch VM

Após as alterações em:

`packages/scratch-vm/src`

foi executado:

`npm --workspace @scratch/scratch-vm run build`

O build foi concluído com sucesso.

Warnings conhecidos e não bloqueantes permaneceram:

- TypeDoc Runtime/VirtualMachine/ExtensionManager;
- Browserslist/caniuse-lite;
- canvas/jsdom.

Nenhuma dependência foi atualizada por causa desses warnings.

Foi novamente confirmado que alterações no Scratch VM exigem:

1. build do `@scratch/scratch-vm`;
2. reinicialização do dev-server do Scratch GUI;
3. recarga da interface.

Apenas recarregar o navegador pode manter bundle ou instância anterior.

### 20.10. Instrumentação temporária

Para a validação física antes do bloco visual, a VM foi temporariamente exposta como:

`window.easyBloxVM`

A instrumentação foi realizada em:

`packages/scratch-gui/src/reducers/vm.ts`

Ela foi completamente removida após os testes.

O arquivo voltou ao estado original e não possui diff pendente.

Nenhuma instrumentação temporária deverá entrar no commit.

### 20.11. Estado funcional atual do Arduino UNO

O Modo Palco Arduino UNO possui agora três primitives físicos completos:

1. `DIGITAL_WRITE`;
2. `DIGITAL_READ`;
3. `ANALOG_READ`.

Estão funcionais:

- Web Serial;
- conexão e seleção da porta;
- handshake automático;
- retry após auto-reset;
- protocolo binário Stage;
- `PING/PONG`;
- escrita digital;
- leitura digital;
- leitura analógica;
- D2–D13 como GPIO digital;
- A0–A5 como GPIO digital;
- A0–A5 como entradas ADC;
- bloco `definir pino [PIN] como [VALUE]`;
- bloco booleano `ler pino digital [PIN]`;
- reporter `ler pino analógico [PIN]`;
- correlação assíncrona por `SEQ`;
- hardware real validado.

### 20.12. Próximo passo exato

Antes de iniciar outro primitive:

1. atualizar `docs/GUIA-DE-DESENVOLVIMENTO.md`;
2. executar `git diff --check`;
3. revisar todos os diffs do ciclo;
4. manter fora do commit a alteração não relacionada em `packages/scratch-gui/src/components/action-menu/icon--sprite.svg`;
5. adicionar explicitamente somente os arquivos do `ANALOG_READ` e os documentos;
6. executar `git diff --cached --check`;
7. criar o commit do checkpoint;
8. fazer push da branch `feat/easyblox-arduino-uno-foundation`;
9. confirmar branch sincronizada e working tree contendo apenas alterações deliberadamente externas ao ciclo.

Depois desse checkpoint, continuar a evolução incremental da base Arduino UNO antes de iniciar ESP32, EasyMaker Conect ou outras placas.

O próximo primitive da base deverá ser definido mantendo a mesma disciplina:

`protocolo → testes → firmware → compile → peripheral → testes → build → hardware → bloco visual → documentação → commit`

## 21. Checkpoint — Arduino UNO PWM_WRITE funcional no Modo Palco

O quarto primitive físico da base Arduino UNO foi concluído e validado de ponta a ponta:

`PWM_WRITE`

O fluxo completo está funcional:

`bloco visual → Scratch VM → ArduinoUnoPeripheral → protocolo Stage → firmware → analogWrite() → saída PWM real`

### 21.1. Contrato do protocolo

Foi definido o comando:

`PWM_WRITE = 0x13`

A requisição utiliza payload:

`[PIN, VALUE]`

A resposta reutiliza:

`ACK = 0x80`

A resposta utiliza o mesmo `SEQ` da requisição.

Pinos PWM válidos no Arduino UNO:

- D3 = 3;
- D5 = 5;
- D6 = 6;
- D9 = 9;
- D10 = 10;
- D11 = 11.

Faixa válida:

`0..255`

Semântica:

- `0` → 0% de duty cycle;
- `1..254` → PWM;
- `255` → 100% de duty cycle.

Pinos que não possuem PWM por hardware são rejeitados pelo primitive.

### 21.2. Testes do protocolo

Arquivo:

`packages/scratch-vm/test/unit/arduino-uno-protocol.js`

Foi acrescentado teste para a codificação de:

`PWM_WRITE`

Exemplo protegido:

`[3, 128]`

representando:

`D3 com PWM 128`

Resultado final da suíte de protocolo:

`66 pass / 0 fail`

### 21.3. Firmware Arduino UNO

Arquivo:

`packages/scratch-vm/firmware/arduino-uno/stage/stage.ino`

Foi definido:

`COMMAND_PWM_WRITE = 0x13`

Foi criado o helper:

`isPwmPin(pin)`

Somente os seguintes pinos são aceitos:

`3, 5, 6, 9, 10, 11`

O handler:

`handlePwmWrite()`

exige payload de dois bytes:

`[PIN, VALUE]`

Depois executa:

`pinMode(pin, OUTPUT)`

e:

`analogWrite(pin, value)`

Em caso de sucesso, responde:

`ACK = 0x80`

Pino não-PWM ou payload inválido gera:

`ERROR = 0xFF`

O campo VALUE já é transportado como `uint8_t`, portanto representa naturalmente:

`0..255`

### 21.4. Footprint do firmware

Compilação para:

`arduino:avr:uno`

Resultado:

- Flash: `2870 bytes (8%)`;
- SRAM global: `223 bytes (10%)`;
- SRAM livre: `1825 bytes`.

Comparação com o checkpoint `ANALOG_READ`:

- Flash: `2616 → 2870 bytes`;
- aumento: `254 bytes`;
- SRAM: permaneceu em `223 bytes`.

### 21.5. ArduinoUnoPeripheral

Arquivo:

`packages/scratch-vm/src/extensions/scratch3_arduino_uno/peripheral.js`

Foi implementado:

`pwmWrite(pin, value)`

O método:

- exige handshake Stage concluído;
- exige PIN inteiro;
- exige VALUE inteiro;
- aceita somente D3, D5, D6, D9, D10 e D11;
- aceita somente valores entre 0 e 255;
- envia `COMMANDS.PWM_WRITE`;
- envia payload `[pin, value]`;
- retorna o `SEQ` do comando;
- retorna `null` quando indisponível ou inválido.

Assim como `digitalWrite()`, não mantém Promise pendente para o ACK.

### 21.6. Testes da extensão Arduino UNO

Arquivo:

`packages/scratch-vm/test/unit/arduino-uno.js`

Foram adicionados testes para:

- envio de `PWM_WRITE` após handshake;
- D3 com valor 0;
- D11 com valor 255;
- preservação e progressão do `SEQ`;
- payload `[PIN, VALUE]`;
- rejeição antes do handshake;
- rejeição dos pinos sem PWM;
- rejeição de pino não inteiro;
- rejeição de valores abaixo de 0;
- rejeição de valores acima de 255;
- rejeição de valor não inteiro;
- metadata do bloco visual;
- menu exclusivo de pinos PWM;
- conversão de PIN e VALUE para número;
- delegação ao peripheral.

Resultado final:

`131 pass / 0 fail`

Os primitives anteriores permaneceram preservados.

### 21.7. Bloco visual

Foi criado o bloco:

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

O valor PWM utiliza entrada numérica.

O valor padrão do bloco foi definido como:

`255`

O método visual converte:

`Number(args.PIN)`

e:

`Number(args.VALUE)`

O valor PWM é então limitado no próprio bloco para a faixa válida:

`0..255`

A normalização utiliza clamp:

- valor menor que `0` → `0`;
- valor entre `0` e `255` → preservado;
- valor maior que `255` → `255`.

Exemplos validados:

- `-20` → `0`;
- `128` → `128`;
- `600` → `255`.

Essa normalização ocorre antes da delegação para:

`this._peripheral.pwmWrite(...)`

A validação existente no `ArduinoUnoPeripheral` continua mantida como segunda camada defensiva.

### 21.8. Validação física direta

O firmware foi gravado fisicamente no Arduino UNO pela porta:

`COM11`

Inicialmente foi utilizado D3.

Resultados observados:

- PWM 0 → `0 V`;
- PWM 128 → `1,96 V`;
- PWM 255 → `3,96 V`.

A alimentação da placa foi medida em:

`4,93 V`

Foi então executado `digitalWrite(HIGH)` no mesmo D3, que também resultou em:

`3,96 V`

Portanto, a redução de tensão observada no D3 não é específica do primitive PWM.

Para eliminar essa interferência, a validação foi repetida em D5.

Com `digitalWrite(HIGH)` em D5:

`4,92 V`

Com PWM em D5:

- PWM 0 → `0,00 V`;
- PWM 128 → `2,46 V`;
- PWM 255 → `4,92 V`.

Os valores confirmam corretamente:

- 0% de duty cycle;
- aproximadamente 50% de duty cycle;
- 100% de duty cycle.

O D5 passou a ser a referência física limpa para este checkpoint.

### 21.9. Validação pelo bloco visual

Depois da implementação do bloco e rebuild do Scratch VM, o bloco foi confirmado visualmente no EasyBlox:

`definir PWM no pino [D3] como [255]`

Foram confirmados:

- formato COMMAND;
- seletor de pino;
- valor padrão `255`;
- manutenção dos blocos anteriores.

Depois de reconectar o Arduino UNO e restabelecer o handshake Stage, foi executado diretamente pelo editor:

`definir PWM no pino [D5] como [128]`

Resultado físico:

`2,46 V`

Isso confirmou o fluxo completo pelo bloco visual:

`bloco → Scratch VM → ArduinoUnoPeripheral → PWM_WRITE → firmware → analogWrite() → D5`

### 21.10. Reconexão e retorno null

Após reinicialização/reload do ambiente, uma tentativa de executar o bloco antes de restabelecer o handshake Stage retornou:

`null`

Esse comportamento é esperado porque `pwmWrite()` exige:

`isStageConnected()`

Após reconectar o Arduino UNO pela COM11, o bloco voltou a funcionar normalmente.

Portanto, `null` neste cenário representa ausência de conexão Stage válida, e não falha do PWM.

### 21.11. Build do Scratch VM

Após alterações em:

`packages/scratch-vm/src`

foi executado:

`npm --workspace @scratch/scratch-vm run build`

O build foi concluído com sucesso.

Warnings conhecidos e não bloqueantes permaneceram:

- TypeDoc Runtime/VirtualMachine/ExtensionManager;
- Browserslist/caniuse-lite;
- canvas/jsdom.

Nenhuma dependência foi alterada devido a esses warnings.

Permanece obrigatória a sequência:

`build do Scratch VM → restart do dev-server → reload da interface`

### 21.12. Instrumentação temporária

Durante o teste físico direto do peripheral, a VM foi temporariamente exposta como:

`window.easyBloxVM`

em:

`packages/scratch-gui/src/reducers/vm.ts`

A instrumentação foi completamente removida após os testes.

O arquivo voltou ao estado original e não possui diff pendente.

Nenhum código temporário de depuração deverá entrar no commit.

### 21.13. Estado funcional atual do Arduino UNO

O Modo Palco Arduino UNO possui agora quatro primitives físicos completos:

1. `DIGITAL_WRITE`;
2. `DIGITAL_READ`;
3. `ANALOG_READ`;
4. `PWM_WRITE`.

Estão funcionalmente validados:

- Web Serial;
- seleção de porta;
- conexão física;
- handshake Stage;
- retry após auto-reset;
- protocolo binário;
- `PING/PONG`;
- escrita digital;
- leitura digital;
- leitura analógica;
- saída PWM;
- D2–D13 e A0–A5 como GPIO digital quando aplicável;
- A0–A5 como entradas ADC;
- D3, D5, D6, D9, D10 e D11 como saídas PWM;
- bloco de escrita digital;
- bloco booleano de leitura digital;
- reporter de leitura analógica;
- bloco de escrita PWM;
- hardware real.

Resultados consolidados deste checkpoint:

- protocolo: `66/66`;
- extensão Arduino UNO: `131/131`;
- firmware: `2870 bytes Flash`;
- SRAM: `223 bytes`;
- PWM D5: `0 → 0 V`, `128 → 2,46 V`, `255 → 4,92 V`.

### 21.14. Slider PWM — backlog de UX

Foi avaliada a possibilidade de utilizar um controle deslizante para selecionar visualmente valores PWM entre:

`0..255`

O próprio Scratch já possui interface de slider em outros contextos, como na manipulação de variáveis.

A decisão deste checkpoint é não implementar um slider exclusivo para PWM.

O recurso será estudado em um ciclo futuro como solução reutilizável para outros campos numéricos do EasyBlox que também possam se beneficiar de:

- faixa mínima e máxima;
- entrada manual;
- controle deslizante;
- feedback visual imediato.

A implementação futura deverá preferencialmente reutilizar a infraestrutura já existente no ecossistema Scratch, evitando criar um componente específico apenas para `PWM_WRITE`.

### 21.15. Próximo passo exato

Antes de iniciar outro primitive:

1. atualizar `docs/GUIA-DE-DESENVOLVIMENTO.md`;
2. executar `git diff --check`;
3. revisar os diffs do ciclo;
4. manter fora do commit `packages/scratch-gui/src/components/action-menu/icon--sprite.svg`;
5. fazer staging explícito somente dos arquivos do PWM e dos documentos;
6. executar `git diff --cached --check`;
7. criar o commit;
8. fazer push da branch `feat/easyblox-arduino-uno-foundation`;
9. confirmar sincronização local/remota;
10. atualizar este checkpoint se houver qualquer diferença no commit final.

A evolução da base Arduino UNO continua antes de ESP32, EasyMaker Conect e outras placas.

Manter a disciplina:

`protocolo → testes → firmware → compile → peripheral → testes → build → hardware → bloco visual → documentação → commit`

### 21.16. Fechamento oficial do checkpoint PWM_WRITE

O checkpoint `PWM_WRITE` foi concluído, commitado e enviado ao repositório remoto.

Branch:

`feat/easyblox-arduino-uno-foundation`

Commit final:

`67fbcb0f8c`

Mensagem:

`feat: add Arduino UNO Stage PWM write`

Push concluído:

`417610dfc8 → 67fbcb0f8c`

Estado confirmado após o push:

`Your branch is up to date with 'origin/feat/easyblox-arduino-uno-foundation'.`

Validações finais deste checkpoint:

- protocolo: `66/66`;
- extensão Arduino UNO: `131/131`;
- build do Scratch VM concluído com sucesso;
- firmware compilado para Arduino UNO;
- firmware validado em hardware real;
- bloco visual PWM validado em hardware real;
- clamp de VALUE para `0..255` implementado e protegido por testes;
- documentação técnica atualizada;
- slider numérico registrado como melhoria futura reutilizável.

Apenas a alteração local já existente em:

`packages/scratch-gui/src/components/action-menu/icon--sprite.svg`

permanece fora deste checkpoint e não foi incluída no commit.

Estado funcional consolidado da base Arduino UNO no Modo Palco:

1. `DIGITAL_WRITE`;
2. `DIGITAL_READ`;
3. `ANALOG_READ`;
4. `PWM_WRITE`.

Este é o ponto oficial de retomada para o próximo primitive físico da base Arduino UNO.

## 22. Checkpoint — Arduino UNO TONE_START / TONE_STOP funcional no Modo Palco

O próximo primitive físico da base Arduino UNO foi concluído funcionalmente como um par de comandos:

`TONE_START`

e:

`TONE_STOP`

O fluxo validado é:

`bloco visual → Scratch VM → ArduinoUnoPeripheral → protocolo Stage → firmware → tone()/noTone() → buzzer real`

Este checkpoint foi desenvolvido na branch:

`feat/easyblox-arduino-uno-foundation`

Neste momento a implementação, os testes automatizados, o build e a validação em hardware real estão concluídos.

O commit e o push ainda devem ser executados após a revisão final dos diffs e da documentação.

### 22.1. Contrato do protocolo

Foram reservados:

`TONE_START = 0x14`

`TONE_STOP = 0x15`

O `TONE_START` utiliza:

`[PIN, FREQ_LSB, FREQ_MSB]`

A frequência é transmitida como inteiro de 16 bits em little-endian.

Exemplo:

`440 Hz = 0x01B8`

Para D6:

`[6, 0xB8, 0x01]`

Faixa válida:

`1..65535 Hz`

O `TONE_STOP` utiliza:

`[PIN]`

Ambos reutilizam:

`RESPONSES.ACK = 0x80`

Não foi criado novo tipo de resposta específico para tone.

### 22.2. Pinos permitidos

Por decisão do contrato EasyBlox, tone utiliza somente os pinos PWM do Arduino UNO:

- D3 = 3;
- D5 = 5;
- D6 = 6;
- D9 = 9;
- D10 = 10;
- D11 = 11.

O firmware e o peripheral reutilizam a mesma lista já estabelecida para:

`PWM_WRITE`

No firmware é reutilizado:

`isPwmPin(pin)`

Essa limitação é uma decisão de produto do EasyBlox para manter a interface física consistente para o aluno.

### 22.3. Semântica aprovada

O primitive atual trabalha diretamente com frequência.

Bloco:

`tocar tom no pino [PIN] com frequência [FREQUENCY] Hz`

Exemplo padrão:

`tocar tom no pino [D6] com frequência [440] Hz`

O `TONE_START` inicia um som contínuo.

Ele permanece ativo até o recebimento explícito de:

`TONE_STOP`

Bloco:

`parar tom no pino [PIN]`

Portanto, o contrato físico atual não possui duração embutida.

Não fazem parte deste primitive:

- nomes de notas musicais;
- BPM;
- figuras rítmicas;
- duração de nota;
- pausa musical.

Essas abstrações serão implementadas futuramente em uma camada musical que reutilizará `TONE_START/TONE_STOP`.

Exemplo conceitual futuro:

`Lá4 → 440 Hz`

e:

`tocar nota [Lá4] por [1/4]`

A camada musical deverá fazer internamente a conversão para frequência e tempo sem exigir alteração no protocolo Stage atual.

### 22.4. Protocolo e testes

Arquivo:

`packages/scratch-vm/src/extensions/scratch3_arduino_uno/protocol.js`

Foram adicionados:

`TONE_START: 0x14`

`TONE_STOP: 0x15`

Arquivo de testes:

`packages/scratch-vm/test/unit/arduino-uno-protocol.js`

Foram protegidos:

- comando `TONE_START`;
- comando `TONE_STOP`;
- SEQ;
- comprimento dos payloads;
- PIN;
- frequência em little-endian;
- checksum.

Payload de referência de `TONE_START`:

`[6, 0xB8, 0x01]`

Payload de referência de `TONE_STOP`:

`[6]`

Resultado:

`84 pass / 0 fail`

### 22.5. Firmware

Arquivo:

`packages/scratch-vm/firmware/arduino-uno/stage/stage.ino`

Foram definidos:

`COMMAND_TONE_START = 0x14`

`COMMAND_TONE_STOP = 0x15`

Foi adicionado controle do pino atualmente utilizado por tone:

`activeTonePin`

com estado sem tone representado por:

`NO_TONE_PIN = 0xFF`

Foi implementado:

`handleToneStart()`

O handler:

1. exige payload de três bytes;
2. recupera PIN;
3. reconstrói a frequência de 16 bits;
4. exige pino pertencente à lista PWM;
5. rejeita frequência igual a zero;
6. encerra o tone anterior se houver mudança de pino;
7. executa `tone(pin, frequency)`;
8. registra o novo `activeTonePin`;
9. retorna `RESPONSE_ACK`.

Foi implementado:

`handleToneStop()`

O handler:

1. exige payload de um byte;
2. valida o pino PWM;
3. executa `noTone(pin)` caso seja o tone atualmente ativo;
4. limpa `activeTonePin`;
5. retorna `RESPONSE_ACK`.

O `TONE_STOP` é idempotente para pinos válidos.

O firmware mantém somente um tone ativo por vez.

### 22.6. Compilação e footprint do firmware

Firmware compilado para:

`arduino:avr:uno`

Resultado:

- Flash: `4454 bytes (13%)`;
- SRAM global: `242 bytes (11%)`;
- SRAM livre: `1806 bytes`.

Marco anterior com `PWM_WRITE`:

- Flash: `2870 bytes`;
- SRAM: `223 bytes`.

Variação:

- Flash: `+1584 bytes`;
- SRAM: `+19 bytes`.

Apesar do aumento causado pela infraestrutura de tone do core AVR, permanece ampla margem de Flash e SRAM no Arduino UNO.

### 22.7. ArduinoUnoPeripheral

Arquivo:

`packages/scratch-vm/src/extensions/scratch3_arduino_uno/peripheral.js`

Foram implementados:

`toneStart(pin, frequency)`

e:

`toneStop(pin)`

`toneStart()` valida:

- conexão Stage;
- PIN inteiro;
- pino PWM;
- frequência inteira;
- frequência entre `1..65535`.

Depois envia:

`COMMANDS.TONE_START`

com:

`[PIN, FREQ_LSB, FREQ_MSB]`

`toneStop()` valida:

- conexão Stage;
- PIN inteiro;
- pino PWM.

Depois envia:

`COMMANDS.TONE_STOP`

com:

`[PIN]`

### 22.8. Blocos visuais

Arquivo:

`packages/scratch-vm/src/extensions/scratch3_arduino_uno/index.js`

Foram adicionados:

`tocar tom no pino [PIN] com frequência [FREQUENCY] Hz`

e:

`parar tom no pino [PIN]`

Os dois reutilizam:

`menu: 'pwmPins'`

Valores padrão:

- PIN: `D6`;
- frequência: `440 Hz`.

A camada visual faz clamp da frequência para:

`1..65535`

O peripheral continua responsável pela validação final.

### 22.9. Testes da extensão Arduino UNO

Arquivo:

`packages/scratch-vm/test/unit/arduino-uno.js`

Foram adicionados testes para:

- envio de `TONE_START` após handshake;
- envio de `TONE_STOP` após handshake;
- payload little-endian para `440 Hz`;
- rejeição antes da conexão Stage;
- rejeição de pinos não-PWM;
- rejeição de frequências inválidas;
- exposição dos blocos em `getInfo()`;
- uso de `pwmPins`;
- valores padrão;
- delegação para o peripheral;
- conversão de argumentos para número;
- clamp visual de frequência para `1..65535`.

Resultado final:

`196 pass / 0 fail`

### 22.10. Build do Scratch VM

Foi executado:

`npm run build`

Resultado:

- TypeDoc: `0 errors`;
- webpack concluído com sucesso;
- build do Scratch VM aprovado.

Permaneceram apenas warnings já conhecidos relacionados a:

- referências de documentação;
- Browserslist/caniuse-lite;
- dependência opcional `canvas` utilizada pelo jsdom.

Nenhum deles impediu a compilação.

### 22.11. Upload e hardware real

O Arduino conectado foi identificado em:

`COM11`

Dispositivo:

`USB-SERIAL CH340`

Firmware Stage carregado com sucesso para:

`arduino:avr:uno`

A validação física foi realizada utilizando uma EasyDuino.

A EasyDuino utilizada possui buzzer integrado no:

`D6`

Foi inicialmente enviado diretamente pelo protocolo:

`TONE_START(D6, 440 Hz)`

Resultado:

- buzzer iniciou corretamente;
- som permaneceu contínuo enquanto nenhum `TONE_STOP` foi recebido.

Depois foi enviado:

`TONE_STOP(D6)`

Resultado:

- buzzer interrompido corretamente.

Validação física direta do protocolo:

`TONE_START ✅`

`TONE_STOP ✅`

### 22.12. Validação no EasyBlox

Depois do build do Scratch VM:

1. o dev-server antigo foi encerrado;
2. uma nova instância do dev-server foi iniciada;
3. webpack recompilou corretamente;
4. a interface foi recarregada em `localhost:8601`;
5. a extensão Arduino UNO foi aberta;
6. os dois novos blocos apareceram corretamente;
7. os blocos foram executados com hardware real.

Blocos confirmados:

`tocar tom no pino [D6] com frequência [440] Hz`

`parar tom no pino [D6]`

Resultado informado após os testes em hardware real:

`funcionando perfeitamente`

Portanto, está validado o fluxo completo:

`bloco visual → Scratch VM → ArduinoUnoPeripheral → protocolo Stage → firmware → EasyDuino D6`

### 22.13. Backlog musical

A base atual deverá ser reutilizada futuramente para uma camada musical mais amigável.

Possíveis recursos:

- nota musical por nome;
- oitava;
- frequência automática;
- BPM;
- semibreve;
- mínima;
- semínima;
- colcheia;
- outras divisões rítmicas;
- pausas;
- sequências musicais.

A implementação futura deverá manter a separação:

`camada musical → TONE_START/TONE_STOP → protocolo físico`

evitando duplicar ou substituir a primitive física já validada.

### 22.14. PWM_WRITE — correção futura do campo visual

Durante a validação do tone foi observado novamente que o campo visual do bloco:

`definir PWM no pino [PIN] como [VALUE]`

continua permitindo a digitação de valores superiores a:

`255`

O comportamento interno está correto.

A camada do bloco já faz clamp para:

`0..255`

e o peripheral também protege o contrato.

Portanto, esta não é uma falha funcional de `PWM_WRITE`.

A melhoria futura deve atuar na experiência de entrada visual, impedindo ou normalizando de forma mais clara valores fora da faixa permitida.

Essa correção deverá preferencialmente ser tratada junto da infraestrutura reutilizável de campos numéricos e slider já registrada no backlog.

### 22.15. Estado consolidado da base Arduino UNO

O Modo Palco Arduino UNO possui agora cinco grupos de primitives físicos completos:

1. `DIGITAL_WRITE`;
2. `DIGITAL_READ`;
3. `ANALOG_READ`;
4. `PWM_WRITE`;
5. `TONE_START / TONE_STOP`.

Estão funcionalmente validados:

- Web Serial;
- seleção de porta;
- conexão física;
- handshake Stage;
- protocolo binário;
- `PING/PONG`;
- escrita digital;
- leitura digital;
- leitura analógica;
- PWM;
- tone por frequência;
- interrupção de tone;
- hardware real;
- blocos visuais correspondentes.

Resultados deste checkpoint:

- protocolo tone: `84/84`;
- extensão Arduino UNO: `196/196`;
- firmware: `4454 bytes Flash`;
- SRAM: `242 bytes`;
- Scratch VM build: aprovado;
- firmware real: aprovado;
- EasyDuino D6: aprovado;
- bloco `toneStart`: aprovado;
- bloco `toneStop`: aprovado.

### 22.16. Arquivos do checkpoint

Arquivos de implementação:

`packages/scratch-vm/firmware/arduino-uno/stage/stage.ino`

`packages/scratch-vm/src/extensions/scratch3_arduino_uno/index.js`

`packages/scratch-vm/src/extensions/scratch3_arduino_uno/peripheral.js`

`packages/scratch-vm/src/extensions/scratch3_arduino_uno/protocol.js`

Arquivos de testes:

`packages/scratch-vm/test/unit/arduino-uno-protocol.js`

`packages/scratch-vm/test/unit/arduino-uno.js`

Documentação:

`docs/GUIA-DE-DESENVOLVIMENTO.md`

`docs/CONTINUIDADE-EASYBLOX.md`

A alteração local já existente em:

`packages/scratch-gui/src/components/action-menu/icon--sprite.svg`

não pertence ao primitive `TONE_START/TONE_STOP` e deve permanecer fora do commit.

### 22.17. Próximo passo exato

O primitive `TONE_START/TONE_STOP` está funcionalmente concluído.

Antes de considerar este checkpoint oficialmente fechado:

1. executar `git diff --check`;
2. revisar o diff dos oito arquivos pertencentes ao checkpoint;
3. manter `icon--sprite.svg` fora do staging;
4. fazer staging explícito somente dos seis arquivos de implementação/testes e dos dois documentos;
5. executar `git diff --cached --check`;
6. revisar `git diff --cached --stat`;
7. criar o commit do checkpoint;
8. fazer push para `origin/feat/easyblox-arduino-uno-foundation`;
9. confirmar que a branch local está sincronizada com o remoto;
10. registrar nesta seção o hash e a mensagem final do commit.

Manter a disciplina:

`protocolo → testes → firmware → compile → peripheral → testes → build → hardware → bloco visual → documentação → commit`

Somente após o fechamento deste checkpoint deve ser iniciado o próximo primitive físico da base Arduino UNO.

### 22.18. Fechamento oficial do checkpoint TONE_START / TONE_STOP

O checkpoint `TONE_START / TONE_STOP` foi concluído, commitado e enviado ao repositório remoto.

Branch:

`feat/easyblox-arduino-uno-foundation`

Commit funcional final:

`9a1f78671`

Mensagem:

`feat: add Arduino UNO Stage tone control`

Push concluído:

`fde069cd9f → 9a1f786710`

Estado confirmado após o push:

`Your branch is up to date with 'origin/feat/easyblox-arduino-uno-foundation'.`

Validações finais deste checkpoint:

- protocolo: `84/84`;
- extensão Arduino UNO: `196/196`;
- `git diff --check` aprovado;
- `git diff --cached --check` aprovado;
- firmware compilado para `arduino:avr:uno`;
- Flash: `4454 bytes (13%)`;
- SRAM: `242 bytes (11%)`;
- Scratch VM build aprovado;
- firmware Stage carregado em hardware real;
- EasyDuino com buzzer integrado em D6 validada;
- `TONE_START(D6, 440 Hz)` validado;
- `TONE_STOP(D6)` validado;
- blocos visuais validados no EasyBlox;
- contrato de frequência sem duração aprovado;
- camada musical com nota, BPM, duração e pausas mantida para ciclo futuro;
- correção futura do campo visual de `PWM_WRITE` acima de `255` registrada no backlog.

A alteração local já existente em:

`packages/scratch-gui/src/components/action-menu/icon--sprite.svg`

permanece fora deste checkpoint e não foi incluída no commit.

Estado funcional consolidado da base Arduino UNO no Modo Palco:

1. `DIGITAL_WRITE`;
2. `DIGITAL_READ`;
3. `ANALOG_READ`;
4. `PWM_WRITE`;
5. `TONE_START / TONE_STOP`.

Este é o novo ponto oficial de retomada para o próximo primitive físico da base Arduino UNO.

### 22.19. Checkpoint atual — Atuadores + SERVO_WRITE

O desenvolvimento da base Arduino UNO avançou para o primeiro primitive da nova categoria visual:

`Atuadores`

Primitive atual:

`SERVO_WRITE`

Status funcional:

`CONCLUÍDO`

O checkpoint ainda não está oficialmente fechado porque falta concluir a revisão final, staging, commit e push.

Branch:

`feat/easyblox-arduino-uno-foundation`

A alteração local independente em:

`packages/scratch-gui/src/components/action-menu/icon--sprite.svg`

continua fora deste trabalho e não deve ser incluída no commit de Servo.

### 22.20. Arquitetura da categoria Atuadores

Foi criada a extensão interna:

`actuators`

Nome visual:

`Atuadores`

Ela é carregada automaticamente como extensão companheira quando:

`arduinoUno`

é carregada.

Também existe dependência:

`actuators → arduinoUno`

para garantir que o peripheral Arduino UNO esteja disponível caso a extensão Atuadores seja carregada diretamente em testes ou internamente.

A arquitetura consolidada é:

`Arduino UNO → proprietário da conexão Serial e do peripheral`

`Atuadores → camada visual reutilizando o peripheral Arduino UNO`

Não existe segunda conexão Serial, segundo handshake ou firmware independente para Atuadores.

O Runtime recebeu:

`getPeripheralExtension(extensionId)`

para permitir que extensões companheiras reutilizem peripherals já registrados.

A extensão `actuators` permanece fora da biblioteca normal de extensões e é carregada automaticamente junto ao Arduino UNO.

### 22.21. Contrato SERVO_WRITE

Novo comando:

`SERVO_WRITE = 0x16`

Payload:

`[PIN, ANGLE]`

Regras:

- `PIN`: inteiro;
- `ANGLE`: inteiro;
- faixa de ângulo: `0..180`;
- resposta de sucesso: `ACK = 0x80`.

Pinos permitidos pelo contrato EasyBlox:

`D3, D5, D6, D9, D10, D11`

A restrição aos pinos PWM é uma decisão de produto/UX do EasyBlox.

Não existe `SERVO_ATTACH` separado nesta primeira versão.

O attach ocorre automaticamente no primeiro `SERVO_WRITE` realizado no pino.

### 22.22. Firmware Servo

Biblioteca utilizada:

`Servo 1.3.0`

Firmware:

`packages/scratch-vm/firmware/arduino-uno/stage/stage.ino`

O firmware mantém slots de Servo para:

`D3, D5, D6, D9, D10, D11`

O handler de `SERVO_WRITE`:

1. valida o payload;
2. valida o pino;
3. valida o ângulo;
4. verifica conflito com tone;
5. executa attach automático quando necessário;
6. executa `servo.write(angle)`;
7. responde com `ACK`.

Compilação final do firmware:

- Flash: `5664 bytes`;
- SRAM: `298 bytes`.

### 22.23. Arbitragem de recursos

Após um Servo ser anexado em determinado pino, esse mesmo pino rejeita:

- `DIGITAL_WRITE`;
- `DIGITAL_READ`;
- `PWM_WRITE`;
- `TONE_START`.

`TONE_STOP` permanece idempotente.

`SERVO_WRITE` é rejeitado quando existe tone ativo no mesmo pino.

A leitura analógica permanece independente.

A biblioteca Servo AVR utiliza:

`Timer1`

Por isso, enquanto existir qualquer Servo anexado, o firmware rejeita:

`PWM_WRITE(D9)`

e:

`PWM_WRITE(D10)`

Os pinos D9 e D10 continuam permitidos como pinos de Servo.

A política definida é rejeitar conflitos explicitamente em vez de destacar silenciosamente um Servo ou alterar a propriedade do recurso sem conhecimento do usuário.

### 22.24. Bloco visual Servo

Categoria:

`Atuadores`

Bloco:

`mover servo no pino [PIN] para [ANGLE] graus`

Defaults:

- pino: `D5`;
- ângulo: `90`.

Menu de pinos:

`D3, D5, D6, D9, D10, D11`

O método visual mantém clamp interno:

`0..180`

como camada adicional de proteção.

### 22.25. Campo numérico reutilizável EasyBlox

Durante o checkpoint foi criada a infraestrutura:

`EasyBloxRangeNumberField`

Arquivo:

`packages/scratch-gui/src/lib/easyblox-range-number-field.js`

Base:

`ScratchBlocks.FieldNumber`

Recursos:

- digitação direta;
- slider;
- mínimo rígido;
- máximo rígido;
- precisão configurável.

Para Servo foi criado:

`easyblox_servo_angle`

Configuração:

- min: `0`;
- max: `180`;
- precision: `1`;
- default: `90`.

Novo tipo interno:

`ArgumentType.SERVO_ANGLE`

Mapeamento:

`ArgumentType.SERVO_ANGLE → easyblox_servo_angle`

O campo foi criado de forma reutilizável.

Uso futuro previsto:

`PWM_WRITE → 0..255`

eliminando o backlog atual em que o campo visual PWM ainda permite digitação acima de 255.

### 22.26. Correção de ephemeral focus

No primeiro teste visual, o editor numérico inline e o slider baseado em `DropDownDiv` tentaram gerenciar simultaneamente o foco efêmero do Blockly.

Isso gerou erro de:

`ephemeral focus`

A API do `FieldInput` permite desabilitar essa administração no editor base.

A chamada foi ajustada para:

`super.showEditor_(event, false, false)`

Após a correção:

- editor numérico funcionando;
- slider funcionando;
- ausência do erro;
- campo validado visualmente.

### 22.27. Validações realizadas

Testes específicos já aprovados no checkpoint:

- `test/unit/arduino-uno-protocol.js`: `93/93`;
- `test/unit/arduino-uno.js`: `222/222`;
- `test/unit/actuators.js`: `14/14`;
- `test/integration/internal-extension.js`: `32/32`.

O teste:

`test/unit/engine_runtime.js`

apresenta uma anomalia de teardown já reproduzida com o arquivo original no ambiente atual:

`Node.js 24.19.0`

Erro observado:

`Error: Should not already be working.`

Origem do stack:

`react-reconciler`

As assertions executadas são concluídas antes do teardown.

Esse comportamento não deve ser atribuído ao Servo e não justifica alteração da versão do Node.

Também foi observado que:

`npm test`

e:

`npm run tap -- test/unit/actuators.js`

não são adequados para executar somente esse teste no workspace atual, pois os scripts acrescentam lint e/ou toda a suíte.

O comando isolado validado foi:

`npx tap test/unit/actuators.js`

Resultado:

`14 pass / 0 fail`

Builds finais aprovados após a integração do campo visual:

- Scratch VM: aprovado;
- Scratch GUI: aprovado.

Scratch GUI:

`webpack 5.109.2 compiled successfully`

Scratch VM:

`webpack 5.109.2 compiled successfully`

### 22.28. Validação em hardware real

O firmware completo com Servo foi carregado no Arduino UNO.

O bloco Servo da categoria Atuadores foi executado através do fluxo completo:

`GUI → scratch-vm → SERVO_WRITE → Serial → firmware → Servo`

Posições físicas validadas:

`0°`

`90°`

`180°`

Resultado:

`FUNCIONANDO CORRETAMENTE`

Também foram validados:

- slider mínimo `0`;
- slider máximo `180`;
- digitação fora da faixa;
- precisão inteira;
- edição direta;
- ausência de erro de foco.

Assim, o primitive:

`SERVO_WRITE`

está funcionalmente concluído.

### 22.29. Regressão transitória investigada

Durante o desenvolvimento ocorreu temporariamente um estado em que comandos executados pelo GUI retornavam `null`.

A ocorrência chegou a afetar também um teste de:

`DIGITAL_WRITE`

enquanto o firmware respondia corretamente em acesso Serial direto.

Foi realizada uma reconstrução incremental das alterações de Servo.

Ao final, o firmware completo voltou a funcionar sem que a falha pudesse ser reproduzida.

Não existe causa única comprovada.

Portanto:

- não atribuir a falha ao CH340;
- não atribuir a falha à biblioteca Servo;
- não atribuir a falha ao protocolo;
- não alterar o driver CH340 enquanto o fluxo permanecer funcional.

Durante ciclos de hardware, manter sincronização explícita:

`firmware correto → VM recompilado → GUI recompilado/reiniciado → navegador atualizado`

### 22.30. Arquivos do checkpoint Servo

Scratch GUI:

`packages/scratch-gui/src/lib/blocks.js`

`packages/scratch-gui/src/lib/easyblox-range-number-field.js`

Scratch VM — infraestrutura:

`packages/scratch-vm/src/engine/runtime.js`

`packages/scratch-vm/src/extension-support/argument-type.js`

`packages/scratch-vm/src/extension-support/extension-manager.js`

Scratch VM — Arduino UNO:

`packages/scratch-vm/src/extensions/scratch3_arduino_uno/peripheral.js`

`packages/scratch-vm/src/extensions/scratch3_arduino_uno/protocol.js`

Scratch VM — Atuadores:

`packages/scratch-vm/src/extensions/scratch3_actuators/index.js`

Firmware:

`packages/scratch-vm/firmware/arduino-uno/stage/stage.ino`

Testes:

`packages/scratch-vm/test/unit/arduino-uno-protocol.js`

`packages/scratch-vm/test/unit/arduino-uno.js`

`packages/scratch-vm/test/unit/actuators.js`

`packages/scratch-vm/test/unit/engine_runtime.js`

`packages/scratch-vm/test/integration/internal-extension.js`

Documentação:

`docs/GUIA-DE-DESENVOLVIMENTO.md`

`docs/CONTINUIDADE-EASYBLOX.md`

Arquivo que NÃO pertence ao checkpoint:

`packages/scratch-gui/src/components/action-menu/icon--sprite.svg`

### 22.31. Proteção temporária do trabalho

Durante a investigação da regressão foi criado o stash:

`stash@{0}: wip-servo-actuators-baseline-test`

Esse stash contém uma proteção intermediária do trabalho de Servo/Atuadores.

Ele deve permanecer disponível até o checkpoint atual estar seguramente:

- commitado;
- enviado ao remoto;
- confirmado como sincronizado.

Somente depois poderá ser removido com segurança.

### 22.32. Estado funcional da base Arduino UNO

Primitives completos no Modo Palco:

1. `DIGITAL_WRITE`;
2. `DIGITAL_READ`;
3. `ANALOG_READ`;
4. `PWM_WRITE`;
5. `TONE_START / TONE_STOP`;
6. `SERVO_WRITE`.

Nova categoria estabelecida:

`Atuadores`

Primeiro atuador concluído:

`SERVO`

Próximo primitive oficial:

`MOTOR`

Sequência aprovada:

1. SERVO — concluído funcionalmente;
2. MOTOR — próximo;
3. RELÉ;
4. ULTRASSÔNICO;
5. DHT;
6. MATRIZ DE LED;
7. DISPLAY 7 SEGMENTOS;
8. DISPLAY LCD 16x2 I2C;
9. JOYSTICK X/Y.

### 22.33. Próximo passo exato

Antes de iniciar MOTOR:

1. executar `git diff --check`;
2. revisar integralmente o diff do checkpoint Servo/Atuadores;
3. confirmar ausência de logs temporários de diagnóstico;
4. manter `icon--sprite.svg` fora do staging;
5. fazer staging explícito somente dos arquivos do checkpoint;
6. executar `git diff --cached --check`;
7. revisar `git diff --cached --stat`;
8. revisar a lista exata de arquivos staged;
9. criar o commit funcional de Servo/Atuadores;
10. fazer push para `origin/feat/easyblox-arduino-uno-foundation`;
11. confirmar sincronização local/remota;
12. registrar hash e mensagem do commit neste documento;
13. somente então remover o stash temporário, se não houver mais necessidade dele;
14. iniciar MOTOR.

Manter a disciplina:

`protocolo → testes → firmware → compile → peripheral → testes → build → hardware → bloco visual → documentação → commit`

### 22.34. Fechamento oficial do checkpoint SERVO

O checkpoint `SERVO_WRITE` foi concluído, commitado e enviado ao repositório remoto.

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

Sincronização confirmada:

`HEAD = dcbfc724170a2ee3144335aa212e7d040088a615`

`origin/feat/easyblox-arduino-uno-foundation = dcbfc724170a2ee3144335aa212e7d040088a615`

Estado confirmado após o push:

`Your branch is up to date with 'origin/feat/easyblox-arduino-uno-foundation'.`

Validações consolidadas deste checkpoint:

- `SERVO_WRITE = 0x16`;
- payload `[PIN, ANGLE]`;
- pinos `D3, D5, D6, D9, D10, D11`;
- ângulo `0..180`;
- attach automático no primeiro comando;
- biblioteca `Servo 1.3.0`;
- arbitragem com Digital, PWM e Tone implementada;
- conflito Timer1 com PWM em D9/D10 tratado explicitamente;
- protocolo Arduino UNO: `93/93`;
- peripheral Arduino UNO: `222/222`;
- extensão Atuadores: `14/14`;
- integração de extensões internas: `32/32`;
- Scratch VM build aprovado;
- Scratch GUI build aprovado;
- firmware Arduino UNO compilado;
- Flash: `5664 bytes`;
- SRAM: `298 bytes`;
- `git diff --check` aprovado;
- `git diff --cached --check` aprovado;
- slider `0..180` validado;
- digitação direta validada;
- limites e precisão inteira validados;
- correção de `ephemeral focus` validada;
- Servo físico validado em `0°`, `90°` e `180°`;
- fluxo completo `GUI → VM → Serial → firmware → Servo` aprovado.

Também foi consolidada a nova categoria visual:

`Atuadores`

A categoria reutiliza o peripheral do Arduino UNO e não cria uma segunda conexão Serial.

A infraestrutura reutilizável:

`EasyBloxRangeNumberField`

também está aprovada e poderá futuramente ser reutilizada para corrigir o campo visual de PWM para a faixa:

`0..255`

A regressão transitória de comandos retornando `null` durante o desenvolvimento não foi reproduzida no estado final e não possui causa única comprovada.

Não atribuir essa ocorrência ao:

- CH340;
- protocolo;
- firmware Servo;
- biblioteca Servo.

Manter como prática de validação:

`firmware correto → VM recompilado → GUI recompilado/reiniciado → navegador atualizado`

A alteração independente:

`packages/scratch-gui/src/components/action-menu/icon--sprite.svg`

permaneceu fora do commit funcional de Servo.

O stash de proteção:

`stash@{0}: wip-servo-actuators-baseline-test`

deve permanecer temporariamente até o commit documental deste fechamento também estar seguro no remoto.

Estado funcional consolidado da base Arduino UNO no Modo Palco:

1. `DIGITAL_WRITE`;
2. `DIGITAL_READ`;
3. `ANALOG_READ`;
4. `PWM_WRITE`;
5. `TONE_START / TONE_STOP`;
6. `SERVO_WRITE`.

Primeiro atuador concluído:

`SERVO`

Próximo primitive oficial:

`MOTOR`

O desenvolvimento de MOTOR somente deve começar após:

1. commit deste fechamento documental;
2. push do commit documental;
3. confirmação da sincronização com o remoto;
4. avaliação e remoção segura do stash temporário de Servo.

### 22.35. Checkpoint complementar — PWM Range 0..255

Após o fechamento oficial do SERVO, foi retomado o backlog visual do primitive:

`PWM_WRITE`

O primitive já estava funcionalmente concluído anteriormente.

Contrato existente:

`PWM_WRITE = 0x13`

Faixa funcional:

`0..255`

Pinos:

`D3, D5, D6, D9, D10, D11`

O problema pendente era exclusivamente de UX.

O bloco:

`definir PWM no pino [PIN] como [VALUE]`

ainda utilizava:

`ArgumentType.NUMBER`

permitindo ao usuário digitar visualmente valores acima de `255`, embora o método funcional e o peripheral já protegessem a faixa válida.

Status deste backlog:

`RESOLVIDO`

### 22.36. Reutilização do EasyBloxRangeNumberField no PWM

A infraestrutura criada no checkpoint de Servo:

`EasyBloxRangeNumberField`

foi reutilizada para o PWM.

Foi criado no Scratch GUI o shadow:

`easyblox_pwm_value`

Configuração:

- default: `255`;
- min: `0`;
- max: `255`;
- precision: `1`.

A arquitetura visual passa a ser:

`ArgumentType.PWM_VALUE`

↓

`easyblox_pwm_value`

↓

`field_easyblox_range_number`

↓

`0..255`

O novo tipo foi registrado em:

`packages/scratch-vm/src/extension-support/argument-type.js`

como:

`PWM_VALUE: 'pwm_value'`

O Runtime passou a mapear:

`ArgumentType.PWM_VALUE → easyblox_pwm_value`

O argumento:

`VALUE`

do bloco `pwmWrite` passou de:

`ArgumentType.NUMBER`

para:

`ArgumentType.PWM_VALUE`

O método:

`pwmWrite(args)`

não foi alterado e continua mantendo o clamp interno:

`0..255`

como segunda camada de proteção.

### 22.37. Arquivos alterados no checkpoint PWM Range

Scratch GUI:

`packages/scratch-gui/src/lib/blocks.js`

Scratch VM:

`packages/scratch-vm/src/engine/runtime.js`

`packages/scratch-vm/src/extension-support/argument-type.js`

`packages/scratch-vm/src/extensions/scratch3_arduino_uno/index.js`

Teste:

`packages/scratch-vm/test/unit/arduino-uno.js`

Documentação:

`docs/GUIA-DE-DESENVOLVIMENTO.md`

`docs/CONTINUIDADE-EASYBLOX.md`

Arquivo independente que NÃO pertence ao checkpoint:

`packages/scratch-gui/src/components/action-menu/icon--sprite.svg`

Nenhuma alteração foi necessária em:

- `protocol.js`;
- `peripheral.js`;
- firmware `stage.ino`.

### 22.38. Validações do PWM Range

Foi adicionada uma assertion garantindo que:

`pwmWriteBlock.arguments.VALUE.type`

permaneça igual a:

`ArgumentType.PWM_VALUE`

Teste isolado executado:

`npx tap packages/scratch-vm/test/unit/arduino-uno.js`

Resultado:

`223 pass / 0 fail`

O número anterior era:

`222/222`

A assertion adicional corresponde à proteção do novo tipo visual do PWM.

Scratch VM build:

`APROVADO`

Resultado:

`webpack 5.109.2 compiled successfully`

Scratch GUI build:

`APROVADO`

Resultado:

`webpack 5.109.2 compiled successfully`

Validação visual realizada no EasyBlox:

- slider em `0`: aprovado;
- valor `128`: aprovado;
- slider em `255`: aprovado;
- valor digitado abaixo de `0`: limitado corretamente;
- valor digitado acima de `255`: limitado corretamente;
- precisão inteira: aprovada;
- digitação direta: aprovada;
- slider: aprovado;
- ausência de erro de `ephemeral focus`: aprovada.

Resultado final:

`PWM RANGE 0..255 ✅`

### 22.39. Estado do EasyBloxRangeNumberField

A infraestrutura numérica reutilizável passa oficialmente a atender dois casos:

`SERVO → 0..180`

`PWM → 0..255`

Portanto, o componente não deve ser tratado como implementação exclusiva do Servo.

Estrutura consolidada:

`EasyBloxRangeNumberField`

↓

constraints configuráveis:

- `min`;
- `max`;
- `precision`;

↓

editor numérico + slider.

Essa infraestrutura poderá ser reutilizada em futuros blocos que necessitem entrada numérica visualmente limitada.

### 22.40. Estado atual antes do MOTOR

Último commit funcional remoto do SERVO:

`dcbfc724170a2ee3144335aa212e7d040088a615`

Mensagem:

`feat: add Arduino UNO Stage servo control`

Último commit documental remoto:

`6bfe11591`

Mensagem:

`docs: close Arduino UNO servo checkpoint`

Branch antes do início deste pequeno checkpoint:

`feat/easyblox-arduino-uno-foundation`

sincronizada com:

`origin/feat/easyblox-arduino-uno-foundation`

O stash temporário criado durante a investigação de Servo foi completamente inspecionado e removido com segurança.

Não existem mais stashes pendentes desse checkpoint.

Alteração local independente preservada:

`packages/scratch-gui/src/components/action-menu/icon--sprite.svg`

Ela continua fora do escopo Arduino UNO.

Primitives consolidados no Modo Palco:

1. `DIGITAL_WRITE`;
2. `DIGITAL_READ`;
3. `ANALOG_READ`;
4. `PWM_WRITE`;
5. `TONE_START / TONE_STOP`;
6. `SERVO_WRITE`.

Backlog visual de PWM:

`ENCERRADO`

Próximo primitive oficial:

`MOTOR`

Antes de iniciar MOTOR, falta apenas fechar este checkpoint complementar:

1. `git diff --check`;
2. revisar o diff;
3. manter `icon--sprite.svg` fora do staging;
4. staging explícito dos arquivos PWM Range + documentação;
5. `git diff --cached --check`;
6. revisar staged files;
7. commit;
8. push;
9. confirmar sincronização com o remoto.

### 22.41. Checkpoint MOTOR v1

O primitive `MOTOR` foi implementado e validado sobre a base Arduino UNO Stage.

O contrato aprovado mantém separadas:

- a abstração genérica do primitive;
- a pinagem física específica de cada placa/shield.

O protocolo genérico não conhece `Motor A`, `Motor B`, `Motor 1` ou `Motor 2`.

Cada motor é representado por:

`IN1 + IN2 + PWM`

Isso permite que futuras extensões específicas de EasyMaker e EasyDuino façam o mapeamento lógico dos motores sem alterar o protocolo Stage.

### 22.42. Contrato MOTOR v1

Comandos:

`MOTOR_WRITE = 0x17`

`MOTOR_STOP = 0x18`

`MOTOR_WRITE` controla exatamente um motor por comando.

Payload:

`[IN1, IN2, PWM_PIN, DIRECTION, SPEED]`

Campos:

- `IN1`: pino digital;
- `IN2`: pino digital;
- `PWM_PIN`: pino PWM;
- `DIRECTION`: `0 = FORWARD`, `1 = REVERSE`;
- `SPEED`: `0..255`.

Na interface EasyBlox, a velocidade é apresentada em:

`0..100%`

A primitive da categoria Atuadores converte para o protocolo usando:

`Math.round(percent * 255 / 100)`

Portanto:

- `0% → 0`;
- `50% → 128`;
- `100% → 255`.

`MOTOR_WRITE` com velocidade `0` equivale semanticamente a parada livre (`COAST`).

`MOTOR_STOP` possui payload:

`[IN1, IN2, PWM_PIN, STOP_MODE]`

Modos:

- `0 = COAST`;
- `1 = BRAKE`.

Respostas permanecem utilizando o contrato já existente:

- `ACK = 0x80`;
- `ERROR = 0xFF`.

Nenhuma nova response foi criada.

### 22.43. Validação de pinos e arbitragem

Para Arduino UNO:

`IN1` e `IN2`:

`D2..D19`

onde `14..19` correspondem a:

`A0..A5`

O pino PWM deve ser um dos seguintes:

- D3;
- D5;
- D6;
- D9;
- D10;
- D11.

`IN1`, `IN2` e `PWM_PIN` devem ser três pinos distintos.

O MOTOR respeita a arbitragem já consolidada de Servo e Tone.

O firmware rejeita MOTOR quando:

- existe Servo anexado em `IN1`;
- existe Servo anexado em `IN2`;
- existe Servo anexado em `PWM_PIN`;
- qualquer um dos três pinos corresponde ao tone ativo;
- existe qualquer Servo anexado e o PWM solicitado é D9 ou D10.

Não existe detach automático de Servo para resolver conflito.

A política permanece:

`conflito de recurso → ERROR explícito`

### 22.44. Firmware MOTOR

Firmware:

`packages/scratch-vm/firmware/arduino-uno/stage/stage.ino`

Foram adicionados:

- `COMMAND_MOTOR_WRITE = 0x17`;
- `COMMAND_MOTOR_STOP = 0x18`;
- `handleMotorWrite()`;
- `handleMotorStop()`;
- dispatch dos dois comandos em `handleFrame()`.

`handleMotorWrite()`:

1. valida payload de 5 bytes;
2. valida pinos;
3. valida direção;
4. valida conflitos de Servo/Tone;
5. desabilita momentaneamente o PWM antes de alterar a direção;
6. configura `IN1` e `IN2`;
7. aplica o valor PWM;
8. envia `ACK`.

Semântica:

FORWARD:

`IN1 = HIGH`

`IN2 = LOW`

REVERSE:

`IN1 = LOW`

`IN2 = HIGH`

Para `SPEED = 0`:

- PWM desabilitado;
- IN1 LOW;
- IN2 LOW.

`handleMotorStop()`:

COAST:

- IN1 LOW;
- IN2 LOW;
- PWM/ENABLE 0.

BRAKE:

- IN1 LOW;
- IN2 LOW;
- PWM/ENABLE 255.

Compilação Arduino UNO aprovada:

`arduino:avr:uno`

Resultado:

- programa: `6216 bytes / 32256 bytes` — 19%;
- variáveis globais: `298 bytes / 2048 bytes` — 14%;
- RAM disponível: `1750 bytes`.

Upload físico realizado com sucesso pela:

`COM11`

### 22.45. Peripheral e protocolo Scratch VM

Protocolo:

`packages/scratch-vm/src/extensions/scratch3_arduino_uno/protocol.js`

Foram adicionados:

- `MOTOR_WRITE: 0x17`;
- `MOTOR_STOP: 0x18`.

Peripheral:

`packages/scratch-vm/src/extensions/scratch3_arduino_uno/peripheral.js`

Métodos adicionados:

`motorWrite(in1Pin, in2Pin, pwmPin, direction, speed)`

`motorStop(in1Pin, in2Pin, pwmPin, stopMode)`

O peripheral trabalha com valores já normalizados para o wire protocol.

Portanto:

`motorWrite()` recebe `speed` em `0..255`.

A conversão de percentual não pertence ao peripheral.

Os conflitos dinâmicos de Servo e Tone continuam sendo arbitrados no firmware, que possui o estado real dos recursos físicos.

### 22.46. Blocos MOTOR na categoria Atuadores

A extensão interna:

`actuators`

continua reutilizando exatamente a mesma instância de:

`ArduinoUnoPeripheral`

Nenhuma nova conexão Serial, handshake ou transporte foi criado.

Foram adicionados dois blocos:

`girar motor IN1 [IN1] IN2 [IN2] PWM [PWM] direção [DIRECTION] velocidade [SPEED] %`

e:

`parar motor IN1 [IN1] IN2 [IN2] PWM [PWM] modo [STOP_MODE]`

Menus de direção:

- `frente → 0`;
- `trás → 1`.

Menus de parada:

- `livre → 0`;
- `frear → 1`.

Para velocidade foi criado:

`ArgumentType.MOTOR_SPEED`

com mapeamento:

`ArgumentType.MOTOR_SPEED → easyblox_motor_speed`

Shadow visual:

`easyblox_motor_speed`

Configuração:

- valor padrão: `100`;
- mínimo: `0`;
- máximo: `100`;
- precisão: `1`.

O campo reutiliza:

`EasyBloxRangeNumberField`

A infraestrutura passa oficialmente a atender:

`Servo → 0..180`

`PWM → 0..255`

`Motor → 0..100%`

### 22.47. Testes e builds do MOTOR

Teste de protocolo:

`packages/scratch-vm/test/unit/arduino-uno-protocol.js`

Resultado:

`116 pass / 0 fail`

Teste Arduino UNO/peripheral:

`packages/scratch-vm/test/unit/arduino-uno.js`

Resultado:

`259 pass / 0 fail`

Teste da categoria Atuadores:

`packages/scratch-vm/test/unit/actuators.js`

Resultado:

`30 pass / 0 fail`

Scratch VM build:

`APROVADO`

Resultado final:

`webpack 5.109.2 compiled successfully`

Scratch GUI build:

`APROVADO`

Foram aprovados:

- `build:dev`;
- `build:dist`;
- `build:dist-standalone`.

Os warnings de Browserslist e tamanho de assets/entrypoints não impediram a compilação e não exigiram alteração de dependências.

### 22.48. Validação física MOTOR

A validação física foi realizada utilizando a EasyDuino sobre Arduino UNO.

Mapeamento físico confirmado:

Motor 1:

- IN1 = D2;
- IN2 = D4;
- PWM = D3.

Motor 2:

- IN1 = D7;
- IN2 = D8;
- PWM = D5.

Motor 1 — FORWARD:

`MOTOR_WRITE`

PWM:

`255`

Resultado:

- ACK correto;
- motor girou normalmente;
- funcionamento por aproximadamente 1,5 segundo;
- `MOTOR_STOP` em COAST recebeu ACK;
- motor parou normalmente.

Também foi testado PWM `128`.

Nesse conjunto físico específico, o canal foi energizado corretamente e o comando recebeu ACK, mas o motor não venceu a inércia de partida.

Isso não foi interpretado como falha do protocolo.

Motor 1 — REVERSE:

- direction = `1`;
- PWM = `255`;
- ACK correto;
- sentido físico invertido corretamente;
- parada em COAST normal.

Motor 1 — BRAKE:

O comando foi aceito e executado.

Neste motor/conjunto específico, não foi percebida diferença visual significativa entre BRAKE e COAST.

Não interpretar isso como falha do protocolo.

Motor 2:

- IN1 = D7;
- IN2 = D8;
- PWM = D5;
- MOTOR_WRITE com PWM 255 aprovado;
- ACK correto;
- motor girou normalmente;
- MOTOR_STOP em COAST aprovado.

Após o novo firmware, também foi confirmada regressão física básica do Stage:

- conexão pela COM11 aprovada;
- `DIGITAL_WRITE` no D13 continuou funcionando normalmente.

### 22.49. Validação visual MOTOR

Os novos blocos apareceram corretamente na categoria:

`Atuadores`

A validação prática no EasyBlox foi aprovada.

Foram confirmados:

- bloco de acionamento do motor;
- seleção de pinos;
- seleção de direção;
- velocidade em percentual;
- campo de velocidade limitado visualmente a `0..100`;
- slider funcional;
- bloco de parada;
- modos livre e frear;
- execução física pelo EasyBlox funcionando corretamente.

Resultado:

`MOTOR v1 ✅`

### 22.50. Backlog futuro — instanciação lógica de motores

Foi registrada uma melhoria futura de UX para permitir configurar/instanciar motores antes do uso.

Conceito desejado:

`Conectar motor [1] direção 1 [D2] direção 2 [D4] & PWM [D3]`

Depois da configuração, os blocos operacionais utilizariam apenas o identificador lógico:

`Acionar motor [1] no sentido [frente] com velocidade [100] %`

e:

`[livre/frear] do motor [1]`

Exemplo de associação:

`Motor 1 → IN1 D2 / IN2 D4 / PWM D3`

`Motor 2 → IN1 D7 / IN2 D8 / PWM D5`

Essa melhoria deve ficar em uma camada superior de UX/perfil de placa.

Ela NÃO altera o contrato MOTOR v1 atual.

O protocolo genérico permanece baseado em:

`IN1 + IN2 + PWM`

Não implementar essa abstração agora nem reabrir o primitive MOTOR v1 por causa deste backlog.

### 22.51. Estado após implementação do MOTOR

Primitives consolidados no Modo Palco:

1. `DIGITAL_WRITE`;
2. `DIGITAL_READ`;
3. `ANALOG_READ`;
4. `PWM_WRITE`;
5. `TONE_START / TONE_STOP`;
6. `SERVO_WRITE`;
7. `MOTOR_WRITE / MOTOR_STOP`.

Próximo primitive oficial:

`RELÉ`

Antes de iniciar RELÉ, fechar o checkpoint MOTOR com:

1. atualizar `docs/GUIA-DE-DESENVOLVIMENTO.md`;
2. `git diff --check`;
3. revisar todos os arquivos alterados;
4. manter `packages/scratch-gui/src/components/action-menu/icon--sprite.svg` fora do staging;
5. staging explícito dos arquivos do MOTOR e documentação;
6. `git diff --cached --check`;
7. revisar staged files;
8. commit;
9. push;
10. confirmar sincronização local/remoto.

### 22.52. Checkpoint RELÉ v1

O primitive de RELÉ foi implementado sobre a base Arduino UNO Stage e integrado à categoria interna:

`Atuadores`

O RELÉ reutiliza exatamente a arquitetura já consolidada:

`Atuadores`

↓

`ArduinoUnoPeripheral`

↓

`Protocolo Stage`

↓

`Firmware Arduino UNO`

Não foi criada:

- nova conexão Serial;
- novo handshake;
- novo transporte;
- firmware independente para Atuadores.

O primitive representa semanticamente o estado de um relé, em vez de expor `HIGH` e `LOW` ao usuário.

### 22.53. Contrato RELAY_WRITE

Comando:

`RELAY_WRITE = 0x19`

Payload:

`[PIN, STATE]`

Onde:

- `PIN` ocupa 1 byte;
- `STATE` ocupa 1 byte;
- `STATE = 0` significa `OFF / desligado`;
- `STATE = 1` significa `ON / ligado`.

Resposta de sucesso:

`ACK = 0x80`

Resposta de erro:

`ERROR = 0xFF`

Nenhuma nova response específica de RELÉ foi criada.

Pinos genéricos permitidos:

`D2..D13`

e:

`A0..A5`

representados internamente como:

`14..19`

Semântica elétrica genérica:

`desligado → LOW`

`ligado → HIGH`

Essa relação pertence à implementação Arduino UNO genérica.

Caso uma placa ou módulo específico utilize relé ativo em LOW, a inversão deverá ser tratada futuramente pelo perfil específico do hardware.

A interface educacional deve continuar trabalhando com:

`ligado / desligado`

e não expor `HIGH / LOW` ao aluno.

### 22.54. Firmware RELÉ

Firmware:

`packages/scratch-vm/firmware/arduino-uno/stage/stage.ino`

Foi adicionado:

`COMMAND_RELAY_WRITE = 0x19`

Handler:

`handleRelayWrite()`

O handler:

1. exige payload de exatamente 2 bytes;
2. lê `PIN`;
3. lê `STATE`;
4. valida pino entre `2..19`;
5. valida estado `0` ou `1`;
6. verifica conflito com Servo;
7. verifica conflito com Tone;
8. configura o pino como OUTPUT;
9. aplica LOW ou HIGH;
10. responde com ACK.

O comando é rejeitado quando:

- `PIN < 2`;
- `PIN > 19`;
- `STATE > 1`;
- existe Servo anexado no mesmo pino;
- existe Tone ativo no mesmo pino.

Política de arbitragem:

`recurso ocupado → ERROR`

Não existe detach automático de Servo.

Não existe interrupção automática de Tone.

O RELÉ também não introduz ownership persistente de pinos utilizados pelo MOTOR.

O contrato MOTOR v1 permanece inalterado.

### 22.55. Compilação e upload do firmware RELÉ

Compilação realizada com:

`arduino:avr:uno`

Resultado:

- programa: `6284 bytes / 32256 bytes` — 19%;
- variáveis globais: `298 bytes / 2048 bytes` — 14%;
- RAM disponível: `1750 bytes`.

Em relação ao checkpoint MOTOR:

- Flash anterior: `6216 bytes`;
- Flash atual: `6284 bytes`;
- aumento: `68 bytes`;
- SRAM permaneceu em `298 bytes`.

Upload físico realizado com sucesso pela:

`COM11`

Resultado:

`New upload port: COM11 (serial)`

### 22.56. Protocolo e peripheral RELÉ

Protocolo:

`packages/scratch-vm/src/extensions/scratch3_arduino_uno/protocol.js`

Adicionado:

`RELAY_WRITE: 0x19`

Peripheral:

`packages/scratch-vm/src/extensions/scratch3_arduino_uno/peripheral.js`

Método adicionado:

`relayWrite(pin, state)`

Responsabilidade do peripheral:

- exigir conexão Stage ativa;
- validar `pin` inteiro;
- validar `state` inteiro;
- validar pino `2..19`;
- validar estado `0..1`;
- enviar `[PIN, STATE]`.

Conflitos dinâmicos com Servo e Tone permanecem sob responsabilidade do firmware, que possui o estado real dos recursos físicos.

### 22.57. Bloco visual RELÉ

A categoria:

`Atuadores`

passou a possuir quatro blocos:

1. Servo;
2. acionar motor;
3. parar motor;
4. relé.

Bloco implementado:

`definir relé no pino [PIN] como [STATE]`

Default atual:

`PIN = D12`

Estado padrão:

`ligado`

Menu de estados:

- `ligado → 1`;
- `desligado → 0`.

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

Foi utilizado um menu próprio:

`relayPins`

mesmo que sua faixa atualmente coincida com a faixa digital utilizada pelo MOTOR.

Isso mantém separadas as responsabilidades semânticas dos dois atuadores.

Não foi necessário criar:

- novo `ArgumentType`;
- novo shadow block;
- novo campo customizado;
- alteração em `EasyBloxRangeNumberField`.

### 22.58. Testes automatizados RELÉ

Teste de protocolo:

`packages/scratch-vm/test/unit/arduino-uno-protocol.js`

Foi acrescentada cobertura para:

`RELAY_WRITE`

incluindo:

- opcode;
- payload `[PIN, STATE]`;
- comprimento;
- checksum.

Resultado final:

`125 pass / 0 fail`

Teste Arduino UNO / peripheral:

`packages/scratch-vm/test/unit/arduino-uno.js`

Foram acrescentadas coberturas para:

- envio de RELAY_WRITE após handshake;
- estado OFF;
- estado ON;
- frame gerado;
- bloqueio antes do handshake;
- pino abaixo da faixa;
- pino acima da faixa;
- pino não inteiro;
- estado abaixo da faixa;
- estado acima da faixa;
- estado não inteiro.

Resultado final:

`272 pass / 0 fail`

Teste da categoria Atuadores:

`packages/scratch-vm/test/unit/actuators.js`

Foram acrescentadas coberturas para:

- quarto bloco da categoria;
- opcode `relayWrite`;
- texto visual;
- default D12;
- default ligado;
- menu ligado/desligado;
- lista completa de pinos;
- conversão de argumentos para número;
- delegação ao peripheral compartilhado.

Resultado final:

`38 pass / 0 fail`

### 22.59. Builds RELÉ

Scratch VM:

`APROVADO`

Resultado:

`webpack 5.109.2 compiled successfully`

Scratch GUI:

`APROVADO`

Foram executados:

- `build:dev`;
- `build:dist`;
- `build:dist-standalone`.

`build:dev`:

`webpack 5.109.2 compiled successfully`

`build:dist`:

`webpack 5.109.2 compiled with 2 warnings`

`build:dist-standalone`:

`webpack 5.109.2 compiled with 2 warnings`

Os warnings correspondem aos limites de tamanho de assets/entrypoints já conhecidos.

Também apareceu o aviso informativo de Browserslist/caniuse-lite desatualizado.

Nenhuma dependência foi atualizada por causa desses warnings.

### 22.60. Validação de protocolo em hardware

Após o upload do novo firmware, foi realizado teste direto pela COM11 enviando frames de:

`RELAY_WRITE`

Foi utilizado:

`PIN = D13`

Comando ON recebeu exatamente:

`FF 55 01 01 80 00 80`

Comando OFF recebeu exatamente:

`FF 55 01 02 80 00 83`

Isso confirmou:

- recepção do frame;
- parsing;
- execução do handler;
- resposta ACK;
- funcionamento dos estados ON/OFF no protocolo.

Esse teste direto foi utilizado como validação do protocolo e dos ACKs.

A confirmação física visual end-to-end foi realizada posteriormente pelo bloco EasyBlox utilizando o LED RGB integrado da EasyDuino.

### 22.61. Validação visual e física end-to-end

O novo bloco apareceu corretamente na categoria:

`Atuadores`

Bloco:

`definir relé no pino [PIN] como [STATE]`

Menus visualmente aprovados:

- seleção de pino;
- ligado;
- desligado.

A validação física end-to-end foi realizada com:

`EasyDuino`

Porta:

`COM11`

Foi utilizado o canal:

`D11`

correspondente a um dos canais do LED RGB integrado da EasyDuino, permitindo observação visual direta.

Foram executados pelo próprio bloco EasyBlox:

`definir relé no pino [D11] como [ligado]`

e:

`definir relé no pino [D11] como [desligado]`

Resultado:

`APROVADO`

A mudança física esperada foi observada.

Portanto, foi validada a cadeia completa:

`bloco visual`

↓

`primitive relayWrite`

↓

`ArduinoUnoPeripheral`

↓

`RELAY_WRITE 0x19`

↓

`firmware Stage`

↓

`hardware físico`

Resultado final:

`RELÉ v1 ✅`

### 22.62. Diretriz para testes físicos visuais na EasyDuino

Durante os testes com a EasyDuino conectada pela COM11, quando for necessário observar visualmente uma saída digital, preferir:

- D9;
- D10;
- D11.

Esses pinos correspondem aos canais do LED RGB integrado e facilitam a validação física.

Quando não houver conflito específico de recursos, utilizar preferencialmente:

`D11`

Essa preferência é apenas de laboratório/teste e não altera os contratos genéricos dos primitives.

Continuam válidas as regras de arbitragem com:

- Servo;
- Tone;
- demais recursos já definidos.

### 22.63. Estado após implementação do RELÉ

Primitives consolidados no Modo Palco:

1. `DIGITAL_WRITE`;
2. `DIGITAL_READ`;
3. `ANALOG_READ`;
4. `PWM_WRITE`;
5. `TONE_START / TONE_STOP`;
6. `SERVO_WRITE`;
7. `MOTOR_WRITE / MOTOR_STOP`;
8. `RELAY_WRITE`.

Checkpoint RELÉ v1 fechado oficialmente:

- branch: `feat/easyblox-arduino-uno-foundation`;
- commit: `049289c13e1be7a7fd4ef415e9c2ad856a215ce1`;
- mensagem: `feat: add Arduino UNO Stage relay control`;
- branch local e remoto sincronizados;
- `packages/scratch-gui/src/components/action-menu/icon--sprite.svg` permanece como alteração local independente e fora do checkpoint.

Antes de iniciar o próximo primitive, foi decidido consolidar a identidade visual das categorias de hardware do EasyBlox.

O próximo primitive funcional continua sendo:

`ULTRASSÔNICO`

### 22.64. Contrato visual das categorias de hardware

Antes da implementação do ULTRASSÔNICO, foi consolidada a arquitetura visual das categorias de hardware do EasyBlox.

A finalidade é evitar que novas categorias sejam criadas utilizando automaticamente a paleta padrão das extensões Scratch:

- `color1: #0FBD8C`;
- `color2: #0DA57A`;
- `color3: #0B8E69`.

Essa paleta permanece associada ao Arduino UNO.

Contrato visual aprovado:

#### Arduino UNO

- `color1: #0FBD8C`;
- `color2: #0DA57A`;
- `color3: #0B8E69`.

Identidade:

`verde turquesa`

#### Atuadores

- `color1: #2E7D32`;
- `color2: #1B5E20`;
- `color3: #124116`.

Identidade:

`verde escuro`

A categoria `Atuadores` passou a declarar explicitamente essas propriedades em:

`packages/scratch-vm/src/extensions/scratch3_actuators/index.js`

A alteração foi validada automaticamente em:

`packages/scratch-vm/test/unit/actuators.js`

Resultado:

`9 testes / 41 assertions / 41 aprovadas`

A validação visual no EasyBlox também foi aprovada.

Os blocos de Atuadores ficaram claramente distintos:

- do verde turquesa do Arduino UNO;
- da categoria nativa Operadores;
- das demais categorias Scratch.

#### Sensores Arduino

Paleta reservada:

- `color1: #29B6F6`;
- `color2: #039BE5`;
- `color3: #0277BD`.

Identidade:

`azul claro vivo`

Essa paleta foi escolhida deliberadamente para diferenciar os sensores Arduino da categoria nativa `Sensores` do Scratch/EasyBlox, que utiliza um azul mais suave.

O próximo primitive:

`ULTRASSÔNICO`

deverá ser implementado dentro dessa identidade visual de Sensores Arduino.

#### Displays / Matriz

Paleta reservada:

- `color1: #E53935`;
- `color2: #C62828`;
- `color3: #8E0000`.

Identidade:

`vermelho`

Essa identidade deverá ser utilizada posteriormente pelos blocos relacionados a:

- matriz 8×8;
- display de 7 segmentos;
- LCD 16×2 I2C;
- demais dispositivos de visualização que pertençam à mesma família conceitual.

#### Regra arquitetural

Cada categoria de hardware deve declarar sua própria paleta através de:

- `color1`;
- `color2`;
- `color3`;

no objeto retornado por `getInfo()` da respectiva extensão.

Não criar lógica específica na GUI apenas para alterar cores.

O `Runtime` já propaga essas propriedades para a interface e deve continuar sendo o mecanismo oficial.

Portanto, os próximos contratos devem respeitar desde sua criação:

`Arduino UNO → verde turquesa`

`Atuadores → verde escuro`

`Sensores Arduino → azul claro vivo`

`Displays / Matriz → vermelho`

### 22.65. DHT v1 — contrato fechado

O DHT foi implementado na categoria:

`Sensores Arduino`

Contrato Stage:

- `COMMAND_DHT_READ = 0x1B`;
- `RESPONSE_DHT_READ = 0x94`;
- request `[PIN, TYPE]`;
- `TYPE=0` temperatura;
- `TYPE=1` umidade;
- response `[PIN, TEMP_H, TEMP_L, HUM_H, HUM_L]`;
- valores transportados em centésimos, `uint16` big-endian.

Pinos:

`D2..D13`

Default EasyDuino:

`D12`

Bloco:

`[temperatura/umidade] do DHT no pino [D12]`

### 22.66. Implementação física DHT11

O firmware Stage realiza a leitura sem biblioteca externa.

A implementação final utiliza acesso direto ao registrador AVR através de:

- `digitalPinToPort()`;
- `digitalPinToBitMask()`;
- `portInputRegister()`.

São capturados:

- resposta inicial LOW/HIGH do sensor;
- 40 bits de dados;
- períodos LOW/HIGH de cada bit;
- checksum DHT11.

Essa implementação substituiu tentativas intermediárias com `digitalRead()/micros()` e `pulseIn()` sequencial.

### 22.67. Cache DHT

Intervalo:

`2000 ms`

O cache é independente por pino em:

`D2..D13`

Estrutura lógica:

```text
DhtCacheEntry
├─ humidity
├─ temperature
├─ timestamp
└─ valid
```

A compilação final do firmware apresentou:

Flash: 7734 / 32256 bytes — 23%;
SRAM global: 382 / 2048 bytes — 18%;
SRAM restante: 1666 bytes.

### 22.68. Validação automatizada

Resultados finais:

protocolo Arduino UNO: 143 / 143;
ArduinoUnoPeripheral: 317 / 317;
Sensores Arduino: 38 / 38.

Total:

498 / 498

git diff --check aprovado.

### 22.69. Validação física final

Bancada:

EasyDuino;
COM11;
DHT11 integrado em D12.

Resposta final:

DHT TEMP: FF 55 01 01 94 05 0C 0A 8C 22 60 59
DHT HUM:  FF 55 01 02 94 05 0C 0A 8C 22 60 5A

Decodificação:

temperatura: 27,00 °C;
umidade: 88,00 %.

Os checksums foram confirmados.

As duas leituras ocorreram em sequência com intervalo inferior a 2 segundos, validando também o cache.

### 22.70. Validação visual end-to-end

O bloco DHT apareceu corretamente no EasyBlox em:

Sensores Arduino

Foram aprovados fisicamente e visualmente:

temperatura;
umidade;
dropdown de tipo;
pino D12 padrão;
comunicação Stage;
leitura real do hardware.

Resultado final:

DHT v1 ✅

### 22.71. Estado após DHT v1

Primitives Stage consolidados:

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

Branch:

feat/easyblox-arduino-uno-foundation

A alteração local abaixo continua independente e não pertence ao checkpoint Arduino/DHT:

packages/scratch-gui/src/components/action-menu/icon--sprite.svg

### 22.72. Decisão arquitetural — Displays no Stage e no Upload

Durante a implementação da matriz de LED 8×8 com controlador MAX7219 foi realizada validação prática no Modo Palco.

Operações isoladas funcionaram, porém a integração completa não apresentou a estabilidade necessária para uso contínuo no Stage.

Por decisão arquitetural, o EasyBlox não manterá suporte Stage ao MAX7219 neste ciclo.

A divisão funcional passa a ser:

Modo Palco:

- LCD 16×2 I2C.

Modo Upload:

- LCD 16×2 I2C;
- display de 7 segmentos TM1637;
- matriz de LED 8×8 MAX7219.

O TM1637 também fica reservado ao Modo Upload e não deverá ser implementado como primitive Stage neste ciclo.

Essa decisão não classifica MAX7219 ou TM1637 como incompatíveis com Arduino UNO. Ela define apenas a arquitetura adotada pelo EasyBlox para preservar a previsibilidade e a estabilidade do Modo Palco.

### 22.73. Limpeza do protótipo Stage da matriz 8×8

Todo o código específico da matriz 8×8 que havia sido acrescentado ao protocolo Stage foi removido antes deste checkpoint.

Foram restaurados ao estado anterior ao experimento:

- protocolo Arduino UNO;
- testes do protocolo;
- firmware Stage;
- `ArduinoUnoPeripheral`;
- extensão Stage de Displays;
- registro da extensão Stage de Displays;
- testes relacionados à extensão Stage de Displays.

O firmware Stage voltou exatamente ao estado consolidado após DHT v1.

Compilação Arduino UNO após a limpeza:

- Flash: 7734 bytes;
- SRAM global: 382 bytes;
- SRAM livre estimada: 1666 bytes.

### 22.74. Infraestrutura visual da matriz 8×8 preservada

O editor visual desenvolvido para a matriz 8×8 foi mantido porque é independente do protocolo Stage e será reutilizado futuramente no Modo Upload.

Arquivos e contratos preservados:

- `packages/scratch-gui/src/lib/easyblox-matrix-8x8-field.js`;
- registro do campo em `packages/scratch-gui/src/lib/blocks.js`;
- `ArgumentType.MATRIX_8X8`;
- shadow `easyblox_matrix_8x8`;
- `ArgumentType.PERCENTAGE`;
- shadow `easyblox_percentage`.

O campo da matriz mantém:

- editor gráfico 8×8;
- serialização em 8 bytes / 16 caracteres hexadecimais;
- persistência no projeto;
- padrão inicial em forma de coração;
- ações Limpar, Preencher e Inverter;
- padrões gráficos pré-definidos.

Valor visual inicial aprovado:

`0066FFFF7E3C1800`

Essa infraestrutura está desacoplada de Arduino, Serial, peripheral e protocolo Stage.

### 22.75. Validação técnica após a limpeza

ESLint da GUI:

- 0 erros;
- apenas warnings já conhecidos de estilo/JSDoc.

ESLint da Scratch VM:

- 0 erros;
- warnings preexistentes de JSDoc em `runtime.js`.

Regressão consolidada da Scratch VM:

- 571 / 571 asserts aprovados;
- 5 / 5 suites aprovadas;
- 0 falhas.

Build da Scratch VM:

`webpack 5.109.2 compiled successfully`

Build da Scratch GUI:

`webpack 5.109.2 compiled with 2 warnings`

Os dois warnings da GUI são referentes ao tamanho de assets/entrypoint e não representam falha de compilação.

### 22.76. Estado do working tree antes do checkpoint

Alterações intencionais deste ciclo:

`packages/scratch-gui/src/lib/blocks.js`

`packages/scratch-gui/src/lib/easyblox-matrix-8x8-field.js`

`packages/scratch-vm/src/engine/runtime.js`

`packages/scratch-vm/src/extension-support/argument-type.js`

Documentação:

`docs/GUIA-DE-DESENVOLVIMENTO.md`

`docs/CONTINUIDADE-EASYBLOX.md`

A alteração local abaixo continua independente e não deve ser incluída neste checkpoint:

`packages/scratch-gui/src/components/action-menu/icon--sprite.svg`

### 22.77. Próximo ponto oficial de retomada

O próximo primitive oficial do Modo Palco Arduino UNO passa a ser:

LCD 16×2 I2C

Diretrizes já definidas:

- utilizar somente comunicação I2C;
- SDA = A4;
- SCL = A5;
- não expor A4/A5 como configuração cotidiana do bloco;
- não exigir que o usuário informe manualmente endereços como `0x27` ou `0x3F`;
- preparar descoberta automática do dispositivo;
- estruturar a solução para reutilização futura por outros dispositivos I2C.

A arquitetura deverá evoluir para uma camada reutilizável de gerenciamento do barramento:

`I2C Bus Manager`

Responsabilidades previstas:

- varrer o barramento I2C;
- verificar presença de dispositivos;
- registrar endereços encontrados;
- disponibilizar a descoberta para outras extensões.

Importante:

a presença de um endereço no barramento não identifica, por si só, de forma inequívoca o tipo do dispositivo.

A revisão da cor visual da categoria Displays / Matriz permanece pendente e deverá ser tratada separadamente da implementação funcional.

### 22.78. Disciplina para o próximo ciclo

Retomar o desenvolvimento mantendo a sequência:

protocolo → testes → firmware → compile → peripheral → testes → build → hardware → bloco visual → documentação → commit

Não iniciar TM1637 ou MAX7219 Stage.

Não iniciar ESP32 antes da estabilização completa da base Arduino UNO.

Próximo trabalho:

LCD 16×2 I2C — Modo Palco Arduino UNO

### 22.79. Retomada do ciclo — LCD 16×2 I2C Stage

O trabalho previsto na seção 22.78 foi executado.

Primitive retomado:

`LCD 16×2 I2C — Modo Palco Arduino UNO`

Branch:

`feat/easyblox-arduino-uno-foundation`

A implementação manteve a arquitetura já consolidada:

`Arduino UNO → proprietário da conexão Serial e do peripheral`

`Displays → camada visual reutilizando o ArduinoUnoPeripheral`

Não foi criada segunda conexão Serial, segundo handshake ou firmware independente para Displays.

Foi criada a extensão interna:

`packages/scratch-vm/src/extensions/scratch3_displays/`

ID técnico:

`displays`

A extensão é carregada como companion do Arduino UNO.

### 22.80. Contrato Stage do LCD

Foram reservados e implementados os comandos:

`LCD_INIT = 0x1C`

`LCD_WRITE = 0x1D`

`LCD_CLEAR = 0x1E`

`LCD_MODE = 0x1F`

Blocos visuais implementados:

`iniciar LCD 16x2 I2C`

`escrever [texto] no LCD linha [1] coluna [1]`

`limpar LCD`

`definir LCD [modo]`

Modos disponíveis:

- piscar;
- sem piscar;
- cursor;
- sem cursor;
- display ligado;
- display desligado;
- auto-rolagem;
- sem auto-rolagem;
- deslocar display para a esquerda;
- deslocar display para a direita.

A interface utiliza linha e coluna em base 1.

O protocolo utiliza linha e coluna em base 0.

Exemplo:

`linha 1 / coluna 1`

é enviado como:

`ROW = 0 / COL = 0`

Payload de `LCD_WRITE`:

`[ROW, COL, ...TEXT_BYTES]`

Não existe byte separado de comprimento do texto.

O texto é limitado ao espaço restante da linha e não existe quebra automática para a linha seguinte.

### 22.81. Implementação I2C do LCD

No Arduino UNO:

- SDA = A4;
- SCL = A5.

Esses pinos não são apresentados ao usuário como configuração do bloco LCD.

O endereço I2C também não é solicitado ao usuário.

O firmware realiza descoberta automática inicialmente nos endereços:

`0x27`

`0x3F`

A implementação atual utiliza:

`Wire.h`

Não foi adicionada dependência externa de:

`LiquidCrystal_I2C`

O firmware controla diretamente módulos comuns baseados em PCF8574 utilizando o mapeamento:

- P0 → RS;
- P1 → RW;
- P2 → EN;
- P3 → backlight;
- P4 → D4;
- P5 → D5;
- P6 → D6;
- P7 → D7.

O backlight permanece ligado na versão atual.

A ideia de uma camada genérica futura:

`I2C Bus Manager`

continua válida como evolução arquitetural, porém não foi necessária para concluir este primitive.

Neste checkpoint, a descoberta do LCD é executada diretamente pelo firmware.

Após inicialização bem-sucedida do LCD, A4 e A5 são protegidos contra uso conflitante por primitives comuns do Stage.

### 22.82. Normalização de texto

A camada JavaScript normaliza o conteúdo antes de transmiti-lo ao LCD.

A política atual utiliza normalização Unicode NFD e remoção de marcas diacríticas.

Exemplo físico confirmado:

`Olá!`

é exibido como:

`Ola!`

Portanto, o comportamento observado em hardware está de acordo com o contrato implementado.

Caracteres fora da política ASCII imprimível atual podem ser substituídos por:

`?`

Essa estratégia evita assumir que todos os displays compatíveis utilizem exatamente a mesma tabela estendida de caracteres.

### 22.83. Descoberta de falha global em comandos Stage consecutivos

Durante a validação física do LCD foi observado que comandos executados individualmente funcionavam, porém sequências de blocos sem intervalo podiam provocar:

`Scratch perdeu a conexão com Arduino UNO`

Inicialmente a suspeita estava relacionada ao LCD.

Para separar o problema do dispositivo específico, foi montado um teste utilizando somente Relé.

Sequência utilizada:

`RELÉ ON`

`RELÉ OFF`

`RELÉ ON`

`RELÉ OFF`

repetidos várias vezes sem qualquer bloco:

`esperar`

O mesmo problema de desconexão foi reproduzido.

Isso demonstrou que a falha não era específica do LCD.

### 22.84. Diagnóstico da camada Serial

Foi analisado:

`packages/scratch-vm/src/extensions/scratch3_arduino_uno/peripheral.js`

O método:

`_sendCommand()`

gera o frame, executa:

`this._serial.write(frame)`

e retorna imediatamente a sequence do protocolo.

Esse comportamento é intencional e deve ser preservado, pois os primitives dependem do retorno síncrono da sequence.

A investigação então avançou para:

`packages/scratch-vm/src/io/serial.js`

Antes da correção, cada chamada a:

`Serial.write(data)`

encaminhava imediatamente:

`transport.write(data)`

Não existia fila entre chamadas consecutivas.

Um teste de regressão criado especificamente para reproduzir a situação confirmou que três escritas consecutivas podiam resultar em:

`3 transport.write() ativos simultaneamente`

Portanto, foi identificada concorrência de escrita na camada de transporte.

### 22.85. Fila global de transmissão Serial

A correção foi implementada em:

`packages/scratch-vm/src/io/serial.js`

Foi adicionada uma fila baseada em Promise:

`_writeQueue`

Regra atual:

`write 1`

→ aguardar conclusão

→ `write 2`

→ aguardar conclusão

→ `write 3`

Apenas uma chamada física a:

`transport.write()`

pode estar ativa por vez para a mesma instância Serial.

A ordem de transmissão é preservada.

Antes de despachar cada item da fila, a conexão é verificada novamente.

Se uma escrita falhar e a conexão for encerrada, comandos que ainda estavam aguardando não são enviados para um transporte já desconectado.

A mudança é global e não específica do Arduino UNO, LCD ou Relé.

Não foi alterada a API síncrona de:

`ArduinoUnoPeripheral._sendCommand()`

A sequence continua sendo retornada imediatamente.

### 22.86. Testes da nova fila Serial

Foram acrescentados testes em:

`packages/scratch-vm/test/unit/serial.js`

Os novos casos validam:

1. serialização de escritas consecutivas;
2. no máximo um `transport.write()` ativo simultaneamente;
3. preservação da ordem original;
4. interrupção da fila após falha do transporte;
5. manutenção dos eventos de desconexão;
6. execução do reset já previsto pela infraestrutura.

Resultado final:

`29 pass`

`0 fail`

Antes da implementação da fila, o teste de concorrência falhou conforme esperado:

`expected 1`

`actual 3`

Após a correção:

`29 / 29`

Essa sequência comprova que o teste realmente reproduzia o comportamento que se pretendia corrigir.

### 22.87. Adaptação dos testes Arduino UNO à fila assíncrona

Com a serialização das escritas, o envio físico ao mock de transporte deixa de ocorrer no mesmo stack síncrono da chamada ao primitive.

Os testes antigos do Arduino UNO assumiam que:

`peripheral.command()`

era imediatamente seguido pela presença do frame em:

`writtenFrames`

A API do peripheral não foi modificada.

Em vez disso, os testes que inspecionam frames enviados passaram a aguardar somente o despacho da fila por meio de uma pequena sincronização do event loop.

Essa espera existe apenas nos testes.

Não existe atraso artificial nos blocos do EasyBlox.

Também não foi adicionada exigência de:

`esperar`

a projetos do usuário.

Resultado final:

`packages/scratch-vm/test/unit/arduino-uno.js`

`363 pass`

`0 fail`

### 22.88. Validação física da correção global

Após reiniciar o ambiente com a nova implementação de `serial.js`, foi repetido exatamente o cenário que provocava desconexão.

Teste:

vários blocos consecutivos de Relé no pino D12 alternando:

`ligado`

e:

`desligado`

sem qualquer bloco `esperar`.

Resultado:

- script executado;
- Arduino UNO permaneceu conectado;
- nenhuma mensagem de perda de conexão;
- nenhum atraso artificial necessário.

Portanto:

`FILA SERIAL — VALIDADA EM HARDWARE`

Esse resultado confirma que comandos Stage consecutivos devem ser suportados pela infraestrutura e não tratados através da introdução de delays nos projetos.

### 22.89. Validação física do LCD

Com a fila Serial corrigida, foi realizado o teste físico do LCD com comandos consecutivos.

Fluxo:

`iniciar LCD 16x2 I2C`

→

`escrever [Olá!] no LCD linha [1] coluna [1]`

→

`limpar LCD`

sem blocos `esperar`.

Resultado:

- inicialização funcionando;
- escrita funcionando;
- texto exibido como `Ola!`, conforme contrato de normalização;
- limpeza funcionando;
- conexão Stage permaneceu ativa durante toda a sequência.

Portanto:

`LCD 16×2 I2C — STAGE MODE VALIDADO EM HARDWARE`

O checkpoint físico valida:

- inicialização;
- descoberta automática do LCD;
- comunicação I2C;
- escrita;
- posicionamento;
- normalização textual;
- limpeza;
- estabilidade de comandos consecutivos.

### 22.90. Testes automatizados finais do checkpoint

Suíte Serial:

`packages/scratch-vm/test/unit/serial.js`

Resultado:

`29 pass`

`0 fail`

Suíte Arduino UNO:

`packages/scratch-vm/test/unit/arduino-uno.js`

Resultado:

`363 pass`

`0 fail`

Protocolo Arduino UNO:

`packages/scratch-vm/test/unit/arduino-uno-protocol.js`

Resultado:

`192 pass`

`0 fail`

Extensão Displays:

`packages/scratch-vm/test/unit/displays.js`

Resultado:

`18 pass`

`0 fail`

Execução conjunta de protocolo + Displays:

`210 pass`

`0 fail`

Integração de extensões internas:

`packages/scratch-vm/test/integration/internal-extension.js`

Resultado:

`44 pass`

`0 fail`

Os warnings apresentados pelo `central-dispatch` durante o teste de integração são conhecidos e não produziram falhas na suíte.

### 22.91. Compilação final do firmware

Firmware:

`packages/scratch-vm/firmware/arduino-uno/stage/stage.ino`

FQBN:

`arduino:avr:uno`

Compilação final:

- Flash: `10426 bytes (32%)`;
- SRAM global: `605 bytes (29%)`;
- memória restante para variáveis locais: `1443 bytes`.

Resultado:

`COMPILAÇÃO APROVADA`

O crescimento em relação ao firmware anterior decorre principalmente da inclusão da implementação do LCD/I2C.

O consumo continua dentro dos limites do ATmega328P e deverá continuar sendo acompanhado nos próximos primitives.

### 22.92. Build final da Scratch GUI

Foi executado:

`npm run build:dev`

em:

`packages/scratch-gui`

Resultado:

`webpack 5.109.2 compiled successfully`

O aviso de base Browserslist/caniuse-lite desatualizada permaneceu apenas informativo e nenhuma dependência foi atualizada neste checkpoint.

Resultado:

`BUILD GUI APROVADO`

### 22.93. UX de blocos longos no flyout

Durante a implementação da categoria Displays foi tratada uma limitação visual da paleta.

Blocos longos permanecem normalmente recortados pela largura do flyout, evitando aumentar permanentemente a largura da categoria.

Quando o usuário posiciona o mouse sobre o bloco, o conteúdo completo pode temporariamente ultrapassar o limite da paleta e permanecer visível sobre a área de scripts.

Arquivo:

`packages/scratch-gui/src/components/blocks/blocks.css`

A solução é global e não específica da categoria Displays.

Resultado visual confirmado:

- flyout mantém largura normal;
- blocos longos não alteram permanentemente o layout;
- bloco sob hover fica integralmente visível.

### 22.94. Revisão da decisão anterior sobre MAX7219

As seções 22.72 e 22.73 registram corretamente o estado conhecido no momento em que foram escritas.

Naquele checkpoint, a matriz 8×8 MAX7219 apresentou instabilidade no Stage e seu protótipo Stage foi retirado.

Essa informação deve permanecer no histórico.

Entretanto, a descoberta posterior da concorrência global em:

`Serial.write()`

introduz uma nova variável técnica relevante para interpretar aqueles testes.

Foi comprovado agora que comandos Stage consecutivos de um dispositivo independente, como Relé, eram suficientes para reproduzir perda de conexão.

Após serialização das escritas, o mesmo teste passou a funcionar sem falhas.

Por isso, a decisão:

`MAX7219 = Upload Mode apenas`

não deve mais ser tratada como conclusão técnica definitiva.

Novo status oficial:

`MAX7219 — STAGE MODE PENDENTE DE REVALIDAÇÃO`

Isso não representa aprovação antecipada do Stage.

A matriz deverá ser novamente testada do zero com a infraestrutura Serial atual antes de qualquer decisão.

### 22.95. Relação com a referência PictoBlox

O comportamento do PictoBlox continuará sendo utilizado como referência arquitetural e de produto.

Entretanto:

`PictoBlox não oferecer determinado dispositivo no Stage`

não deve ser interpretado automaticamente como:

`o dispositivo é tecnicamente incapaz de operar no Stage`

O EasyBlox utiliza protocolo próprio, firmware próprio e infraestrutura Serial própria.

Portanto, a decisão final deverá ser baseada na estabilidade técnica efetivamente observada no EasyBlox.

Essa revisão se aplica especificamente à MAX7219 após a descoberta da falha global de escrita Serial.

Não generalizar essa conclusão automaticamente para outros dispositivos sem teste.

### 22.96. Situação do TM1637

A decisão relacionada ao display de 7 segmentos TM1637 não foi reaberta neste checkpoint.

Status atual:

`TM1637 — Upload Mode`

Não iniciar sua implementação Stage como consequência automática da revisão da MAX7219.

Caso exista interesse futuro em Stage para TM1637, deverá ser realizado um checkpoint técnico específico.

### 22.97. Estado funcional do LCD / Displays

Neste checkpoint estão funcionais:

- categoria `Displays`;
- reutilização do `ArduinoUnoPeripheral`;
- `LCD_INIT`;
- `LCD_WRITE`;
- `LCD_CLEAR`;
- `LCD_MODE`;
- descoberta I2C em `0x27` e `0x3F`;
- barramento A4/A5;
- proteção de A4/A5 após inicialização;
- normalização de texto;
- execução consecutiva sem `esperar`;
- fila global de transmissão Serial;
- UX de hover para blocos longos;
- testes automatizados;
- build da GUI;
- compilação do firmware;
- validação física do LCD.

Status:

`LCD 16×2 I2C Stage — APROVADO`

### 22.98. Arquivos principais deste checkpoint

Implementação LCD / Displays:

`packages/scratch-vm/firmware/arduino-uno/stage/stage.ino`

`packages/scratch-vm/src/extension-support/extension-manager.js`

`packages/scratch-vm/src/extensions/scratch3_arduino_uno/peripheral.js`

`packages/scratch-vm/src/extensions/scratch3_arduino_uno/protocol.js`

`packages/scratch-vm/src/extensions/scratch3_displays/`

Correção global Serial:

`packages/scratch-vm/src/io/serial.js`

Testes:

`packages/scratch-vm/test/integration/internal-extension.js`

`packages/scratch-vm/test/unit/arduino-uno-protocol.js`

`packages/scratch-vm/test/unit/arduino-uno.js`

`packages/scratch-vm/test/unit/displays.js`

`packages/scratch-vm/test/unit/serial.js`

UX:

`packages/scratch-gui/src/components/blocks/blocks.css`

Documentação:

`docs/GUIA-DE-DESENVOLVIMENTO.md`

`docs/CONTINUIDADE-EASYBLOX.md`

### 22.99. Alteração local independente

Permanece uma modificação local não relacionada ao checkpoint:

`packages/scratch-gui/src/components/action-menu/icon--sprite.svg`

Essa alteração:

`NÃO DEVE SER INCLUÍDA NO COMMIT LCD / DISPLAYS / SERIAL`

O staging deverá continuar sendo explícito e seletivo.

### 22.100. Próximo ponto oficial de retomada

Depois de concluir:

- revisão final do diff;
- staging explícito;
- `git diff --cached --check`;
- revisão do staged diff;
- commit;
- push;
- confirmação de sincronização com o remoto;

o próximo trabalho oficial será:

`REVALIDAÇÃO DA MATRIZ DE LED 8×8 MAX7219 NO MODO PALCO`

A revalidação deverá começar da infraestrutura atualmente consolidada, sem assumir que o protótipo Stage anterior continua correto.

Sequência sugerida:

1. revisar o contrato anterior da matriz;
2. restaurar somente o mínimo necessário para o Stage;
3. compilar e testar protocolo;
4. validar inicialização física;
5. executar um desenho estático;
6. validar brilho;
7. executar múltiplos desenhos consecutivos sem `esperar`;
8. executar uma pequena animação por frames;
9. observar estabilidade da conexão;
10. somente então decidir entre:
   - Stage + Upload;
   - Upload apenas.

A decisão anterior deverá permanecer registrada como histórico, mas a conclusão final da MAX7219 será tomada somente após essa nova validação.

Não iniciar TM1637 neste checkpoint.

Não iniciar ESP32 antes de concluir a base Arduino UNO planejada.

### 22.101. Revalidação concluída da MAX7219 no Stage Mode

A revalidação prevista na seção 22.100 foi concluída com sucesso.

A matriz de LED 8×8 MAX7219 foi restaurada no Stage Mode e validada novamente desde o protocolo até o hardware real.

Status oficial atualizado:

`MAX7219 8×8 — STAGE MODE APROVADO`

A decisão provisória anterior de tratar a MAX7219 como Upload Mode apenas fica superada por esta validação.

Quando o gerador de código do Modo Upload for implementado para a matriz, o objetivo passa a ser:

`MAX7219 8×8 — Stage + Upload`

O TM1637 não foi reaberto neste checkpoint.

Status mantido:

`TM1637 / Display 7 segmentos — Upload Mode`

### 22.102. Contrato Stage atual da MAX7219

Comandos:

- `MATRIX_WRITE = 0x20`;
- `MATRIX_BRIGHTNESS = 0x21`.

Payload de `MATRIX_WRITE`:

`[DIN, CS, CLK, ROW0, ROW1, ROW2, ROW3, ROW4, ROW5, ROW6, ROW7]`

Payload de `MATRIX_BRIGHTNESS`:

`[DIN, CS, CLK, BRIGHTNESS]`

Configuração visual atual:

`configurar matriz 8×8 DIN [DIN] CS [CS] CLK [CLK]`

Defaults:

- DIN = A4;
- CS = A5;
- CLK = D13.

Blocos disponíveis:

- configurar matriz;
- mostrar desenho;
- limpar matriz;
- definir brilho.

O coração padrão do editor permanece:

`0066FFFF7E3C1800`

### 22.103. ACK pacing da MAX7219

A fila global Serial continua responsável por serializar as escritas no transporte.

Além disso, os comandos:

- `MATRIX_WRITE`;
- `MATRIX_BRIGHTNESS`;

agora aguardam ACK do firmware antes da conclusão da primitive.

Infraestrutura principal:

`ArduinoUnoPeripheral._pendingCommandAcks`

`ArduinoUnoPeripheral._sendCommandWithAck()`

Tratamentos implementados:

- ACK correspondente;
- ERROR;
- timeout de 1000 ms;
- reset/desconexão.

Validação física:

- 20 comandos consecutivos sem `esperar`: aprovado;
- aproximadamente 100 frames consecutivos sem `esperar`: aprovado;
- repetição dos testes: aprovada;
- frame final correto;
- conexão Stage estável.

Status:

`ACK PACING MAX7219 — VALIDADO EM HARDWARE`

### 22.104. Arbitragem de A4/A5 entre MAX7219 e LCD

A MAX7219 pode utilizar A4/A5 na configuração padrão.

O LCD 16×2 I2C também utiliza A4/A5 como barramento I2C do Arduino UNO.

O firmware agora protege os dois sentidos do conflito:

- LCD ativo → matriz não assume A4/A5;
- matriz ativa em A4/A5 → `LCD_INIT` responde ERROR.

No segundo caso:

- Wire não é inicializado;
- a matriz permanece operacional;
- a conexão Stage permanece estável.

Validação física concluída.

Status:

`ARBITRAGEM MAX7219 ↔ LCD — APROVADA`

### 22.105. Organização atual da categoria Displays

A categoria continua única:

`Displays`

Paleta atual:

- `#E53935`;
- `#C62828`;
- `#8E0000`.

Foi adicionada infraestrutura genérica:

`BlockType.LABEL`

Ela é convertida pelo Runtime em:

`<label>`

e permite criar subseções visuais reais no flyout sem criar blocos executáveis falsos.

Organização atual:

`Matriz de LED 8x8`

- configurar matriz;
- mostrar matriz;
- limpar matriz;
- definir brilho.

Separador visual.

`Display LCD`

- iniciar LCD;
- escrever no LCD;
- limpar LCD;
- definir modo do LCD.

O preview/shadow da matriz utiliza agora:

`#C62828`

com os pixels ativos em branco.

A subseção:

`Display 7 SEG`

deverá ser adicionada quando os blocos TM1637 existirem.

Não criar uma subseção vazia antes disso.

### 22.106. Validações finais deste checkpoint

Testes principais:

`arduino-uno-protocol.js`

- 223 pass;
- 0 fail.

`arduino-uno.js`

- 413 pass;
- 0 fail.

`displays.js`

- 45 pass;
- 0 fail.

Execução conjunta:

- 681 pass;
- 0 fail.

`extension_conversion.js + displays.js`

- 142 pass;
- 0 fail.

`internal-extension.js`

- 44 pass;
- 0 fail.

`serial.js`

- 29 pass;
- 0 fail.

Firmware Arduino UNO:

- Flash: `11348 bytes (35%)`;
- SRAM global: `610 bytes (29%)`;
- SRAM livre: `1438 bytes`.

Build GUI:

`npm run build:dev`

Resultado:

`SUCESSO`

Validação física:

- MAX7219 Stage: aprovada;
- brilho: aprovado;
- múltiplos frames: aprovados;
- stress sem waits: aprovado;
- ACK pacing: aprovado;
- arbitragem LCD/MAX7219: aprovada.

### 22.107. Arquivos principais do checkpoint MAX7219 / ACK / Displays

Firmware:

`packages/scratch-vm/firmware/arduino-uno/stage/stage.ino`

Protocolo e peripheral:

`packages/scratch-vm/src/extensions/scratch3_arduino_uno/protocol.js`

`packages/scratch-vm/src/extensions/scratch3_arduino_uno/peripheral.js`

Displays:

`packages/scratch-vm/src/extensions/scratch3_displays/index.js`

Infraestrutura de flyout:

`packages/scratch-vm/src/extension-support/block-type.js`

`packages/scratch-vm/src/extension-support/extension-manager.js`

`packages/scratch-vm/src/engine/runtime.js`

GUI:

`packages/scratch-gui/src/lib/blocks.js`

Testes:

`packages/scratch-vm/test/unit/arduino-uno-protocol.js`

`packages/scratch-vm/test/unit/arduino-uno.js`

`packages/scratch-vm/test/unit/displays.js`

`packages/scratch-vm/test/unit/extension_conversion.js`

Documentação:

`docs/GUIA-DE-DESENVOLVIMENTO.md`

`docs/CONTINUIDADE-EASYBLOX.md`

### 22.108. Alteração local independente

Permanece fora deste checkpoint:

`packages/scratch-gui/src/components/action-menu/icon--sprite.svg`

Essa modificação é independente e:

`NÃO DEVE SER INCLUÍDA NO COMMIT MAX7219 / ACK / DISPLAYS`

O staging deverá ser explícito.

### 22.109. Próximo ponto oficial de retomada

Depois de concluir:

- revisão final do diff;
- `git diff --check`;
- staging explícito;
- `git diff --cached --check`;
- revisão do staged diff;
- commit;
- push;
- confirmação de sincronização com o remoto;

o checkpoint MAX7219 / ACK / Displays estará encerrado.

Estado dos displays após este checkpoint:

`LCD 16×2 I2C — Stage aprovado`

`MAX7219 8×8 — Stage aprovado`

`TM1637 / Display 7 segmentos — Upload Mode`

Não iniciar TM1637 Stage automaticamente.

Não iniciar ESP32 antes de concluir a base Arduino UNO planejada.

### 22.110. Revalidação específica do TM1637 para Modo Palco

Após o fechamento do checkpoint MAX7219 no commit:

`46212de015`

foi iniciado um checkpoint técnico específico para reavaliar o display de 7 segmentos TM1637 no Modo Palco.

A investigação foi realizada separadamente da MAX7219, conforme previsto anteriormente na documentação.

A conclusão anterior:

`TM1637 — Upload Mode`

não foi simplesmente revertida por analogia com a MAX7219.

O TM1637 passou por:

- definição de contrato próprio;
- implementação de protocolo;
- testes automatizados;
- implementação de firmware;
- compilação para Arduino UNO;
- validação elétrica do ACK do controlador;
- validação física;
- validação pelos blocos do EasyBlox.

Resultado:

`TM1637 / Display 7 segmentos — Stage aprovado`

### 22.111. Contrato Stage TM1637 v1

Foi aprovado um contrato deliberadamente enxuto.

Novo comando:

`TM1637_WRITE = 0x22`

Payload:

`[CLK, DIO, SEG0, SEG1, SEG2, SEG3]`

Cada `SEGx` corresponde ao byte bruto dos segmentos de uma das quatro posições do display.

O firmware não interpreta:

- número;
- quantidade de dígitos;
- posição;
- zeros à esquerda;
- ponto/separador.

Essa transformação é realizada pela extensão `Displays` antes do envio ao Arduino UNO.

Toda escrita utiliza o mecanismo:

`_sendCommandWithAck()`

preservando o backpressure já validado no Modo Palco.

Não foram criados comandos separados para:

- inicialização;
- limpeza;
- brilho.

A limpeza reutiliza:

`TM1637_WRITE`

com:

`[0x00, 0x00, 0x00, 0x00]`

Não existe controle de brilho exposto ao usuário no contrato TM1637 v1.

### 22.112. Blocos TM1637 aprovados

A subseção:

`Display 7 SEG`

foi adicionada à categoria única:

`Displays`

Ordem visual da categoria:

1. `Matriz de LED 8x8`;
2. `Display LCD`;
3. `Display 7 SEG`.

Foram implementados somente três blocos TM1637:

`inicializar display 7 segmentos CLK [CLK] DIO [DIO]`

`mostrar [VALUE] com [LENGTH] dígitos na posição [POSITION] [POINT] e [LEADING_ZEROS]`

`limpar display 7 segmentos`

Não existe bloco de brilho.

O bloco de inicialização/configuração apenas armazena os pinos localmente na extensão.

Ele não envia comando Serial.

Defaults validados:

- CLK = `A5` / pino lógico `19`;
- DIO = `A4` / pino lógico `18`.

O bloco de exibição suporta:

- valor numérico;
- 1 a 4 dígitos;
- posição inicial de 1 a 4;
- ponto/separador;
- zeros à esquerda.

### 22.113. Driver firmware TM1637

O firmware Stage implementa diretamente a comunicação com o TM1637.

Não foi adicionada biblioteca externa.

Foram implementados internamente:

- START;
- STOP;
- escrita LSB-first;
- leitura do ACK elétrico do TM1637;
- comando de dados;
- endereço inicial;
- escrita dos quatro segmentos;
- controle interno do display.

Sequência utilizada:

`0x40`

seguida por:

`0xC0 + SEG0 + SEG1 + SEG2 + SEG3`

e controle interno do display.

O EasyBlox somente responde:

`RESPONSE_ACK`

depois que a transação física com o TM1637 foi concluída com sucesso.

Falha no ACK elétrico do TM1637 resulta em:

`RESPONSE_ERROR`

### 22.114. Arbitragem TM1637 e LCD em A4/A5

O mapeamento fisicamente validado do TM1637 utiliza:

- CLK = A5;
- DIO = A4.

Esses pinos também formam o barramento I2C padrão utilizado pelo LCD 16x2.

Foi implementada proteção bidirecional.

Quando o LCD já está inicializado:

- TM1637 não pode assumir A4/A5.

Quando o TM1637 já está utilizando A4/A5:

- `LCD_INIT` responde `ERROR`.

O estado interno do TM1637 é usado apenas para arbitragem de recursos e não cria um comando adicional de inicialização no protocolo.

### 22.115. Validação física TM1637

Teste físico realizado com Arduino UNO/EasyDuino na:

`COM11`

Mapeamento validado:

- CLK = `A5` / `19`;
- DIO = `A4` / `18`.

Primeiro teste:

`1234`

Frame de segmentos:

`06 5B 4F 66`

Resultado físico:

`1234`

exibido corretamente no display.

Resposta Stage:

`RESPONSE_ACK`

Um teste inicial com CLK/DIO invertidos retornou:

`RESPONSE_ERROR`

confirmando também a validação do ACK elétrico do TM1637.

Teste de limpeza:

`00 00 00 00`

Resultado:

- display apagado;
- `RESPONSE_ACK`.

A escrita e a limpeza foram posteriormente exercitadas também pelos próprios blocos do EasyBlox.

Resultado:

`TM1637 STAGE — VALIDADO EM HARDWARE`

### 22.116. Correção de UX em blocos de configuração

Durante a validação visual foi identificado que blocos de configuração local que retornavam explicitamente:

`null`

produziam uma bolha visual:

`null`

quando clicados diretamente.

A correção foi aplicada a:

- `configurar matriz 8x8`;
- `inicializar display 7 segmentos`.

Esses blocos agora encerram silenciosamente com retorno JavaScript:

`undefined`

quando não há valor a reportar.

Regra adotada:

blocos de comando usados apenas para armazenar configuração local não devem produzir valores visuais na interface.

### 22.117. Validações automatizadas TM1637

Resultados finais:

`arduino-uno-protocol.js`

- 237 pass;
- 0 fail.

`arduino-uno.js`

- 426 pass;
- 0 fail.

`displays.js`

- 77 pass;
- 0 fail.

Execução conjunta:

- 740 pass;
- 0 fail;
- 3 suites aprovadas.

Cobertura conjunta principal:

- statements: 95,89%;
- branches: 89,77%;
- functions: 97,26%;
- lines: 95,89%.

Compilação do firmware Arduino UNO:

- Flash: `12014 bytes (37%)`;
- SRAM global: `613 bytes (29%)`;
- SRAM livre: `1435 bytes`.

### 22.118. Arquivos principais do checkpoint TM1637

Firmware:

`packages/scratch-vm/firmware/arduino-uno/stage/stage.ino`

Protocolo e peripheral:

`packages/scratch-vm/src/extensions/scratch3_arduino_uno/protocol.js`

`packages/scratch-vm/src/extensions/scratch3_arduino_uno/peripheral.js`

Displays:

`packages/scratch-vm/src/extensions/scratch3_displays/index.js`

Testes:

`packages/scratch-vm/test/unit/arduino-uno-protocol.js`

`packages/scratch-vm/test/unit/arduino-uno.js`

`packages/scratch-vm/test/unit/displays.js`

Documentação:

`docs/GUIA-DE-DESENVOLVIMENTO.md`

`docs/CONTINUIDADE-EASYBLOX.md`

### 22.119. Alteração local independente

Permanece fora deste checkpoint:

`packages/scratch-gui/src/components/action-menu/icon--sprite.svg`

Essa alteração continua independente e não deverá ser incluída no commit TM1637.

O staging deverá permanecer explícito.

### 22.120. Próximo ponto oficial de retomada

Estado dos displays após a revalidação:

`LCD 16x2 I2C — Stage aprovado`

`MAX7219 8x8 — Stage aprovado`

`TM1637 / Display 7 segmentos — Stage aprovado`

Após revisão final, commit e push deste checkpoint, o próximo desenvolvimento planejado é:

`Joystick`

Manter a prioridade de concluir a base Arduino UNO antes de avançar para ESP32.

### 22.121. Checkpoint Joystick Stage v1

Após o fechamento do TM1637 no commit:

`60bad78fa4`

foi iniciado o checkpoint específico do módulo Joystick para Arduino UNO.

O escopo inicial registrado anteriormente como:

`JOYSTICK X/Y`

foi ampliado por decisão de produto para representar corretamente o módulo físico completo:

- eixo X;
- eixo Y;
- Click.

Para a EasyMaker, o conector utiliza os mesmos três sinais empregados pela matriz MAX7219:

- X = A4;
- Y = A5;
- Click = D13.

Resultado final:

`JOYSTICK STAGE v1 — APROVADO`

### 22.122. Contrato Stage do Joystick

Foi criado um único comando:

`JOYSTICK_READ = 0x23`

Resposta:

`JOYSTICK_READ = 0x95`

Payload da requisição:

`[X_PIN, Y_PIN, CLICK_PIN]`

Payload da resposta:

`[X_PIN, Y_PIN, CLICK_PIN, X_H, X_L, Y_H, Y_L, CLICK]`

Os eixos X e Y utilizam valores de:

`0..1023`

O Click é normalizado pelo firmware:

`0 = solto`

`1 = pressionado`

O firmware utiliza:

`INPUT_PULLUP`

exclusivamente para o sinal Click.

A lógica elétrica:

`LOW = pressionado`

não é exposta ao usuário.

### 22.123. Blocos Joystick em Sensores Arduino

A categoria:

`Sensores Arduino`

passa a incluir três blocos do Joystick:

`inicializar joystick X [A4] Y [A5] CLICK [D13]`

`valor do joystick [X/Y]`

`joystick clicado?`

O primeiro bloco é um comando de configuração local.

Ele apenas armazena os pinos na extensão e não produz valor visual.

Regra preservada:

`bloco de configuração local → undefined`

O bloco:

`joystick clicado?`

utiliza `BlockType.BOOLEAN`, permitindo seu uso diretamente em condições Scratch.

Defaults EasyMaker:

- X = A4 / 18;
- Y = A5 / 19;
- Click = D13 / 13.

### 22.124. Arquitetura da leitura

O `ArduinoUnoPeripheral` implementa:

`joystickRead(xPin, yPin, clickPin)`

A leitura cria uma Promise associada à sequência Stage em:

`_pendingJoystickReads`

Ao receber `RESPONSE_JOYSTICK_READ`, o peripheral valida:

- sequência;
- os três pinos;
- payload de 8 bytes;
- X entre 0 e 1023;
- Y entre 0 e 1023;
- Click igual a 0 ou 1.

A extensão recebe:

`{x, y, clicked}`

O estado Click já é convertido para boolean JavaScript.

Leituras pendentes também são resolvidas como `null` em caso de:

`RESPONSE_ERROR`

ou reset/desconexão.

### 22.125. Arbitragem de recursos

O Joystick da EasyMaker utiliza:

`A4 / A5 / D13`

Esses mesmos sinais são utilizados pelo conector da matriz MAX7219.

Além disso, A4 e A5 podem ser utilizados pelo:

- LCD I2C;
- TM1637;
- MAX7219.

O Joystick foi tratado como dispositivo de leitura instantânea.

Ele não mantém reserva persistente dos pinos no firmware após uma leitura.

Antes de executar `JOYSTICK_READ`, o firmware verifica conflitos com periféricos Stage stateful já ativos.

Dessa forma, uma leitura de Joystick não cria uma reserva fantasma que impediria posteriormente o uso de outro módulo no mesmo conector.

### 22.126. Validação física

Firmware testado no Arduino UNO/EasyMaker utilizando:

`COM11`

Mapeamento:

- X = A4;
- Y = A5;
- Click = D13.

Leitura central observada aproximadamente:

`X = 538`

`Y = 508`

`CLICK = 0`

Durante movimentação física foram observados extremos:

`X = 0`

`X = 1023`

`Y ≈ 0`

`Y = 1022`

O Click alternou corretamente:

`0 → solto`

`1 → pressionado`

Uma amostra do script PowerShell de teste bruto foi exibida como:

`Resposta invalida`

durante 50 leituras.

O teste utilizava drenagem simplificada da porta Serial e não o parser por estados do EasyBlox.

As demais leituras foram corretas e a validação end-to-end posterior pelos próprios blocos funcionou normalmente.

### 22.127. Validação end-to-end no EasyBlox

Os blocos foram testados em bancada controlando o ator Whiz.

O programa utilizou:

`valor do joystick X`

para decidir direção e movimento.

O bloco booleano:

`joystick clicado?`

foi utilizado diretamente dentro de uma condição:

`se <joystick clicado?> então`

Resultado:

- leitura X funcional;
- leitura Y funcional;
- Click funcional;
- condição booleana funcional;
- comunicação Stage estável;
- bloco de configuração sem bolha `null`.

O bloco de inicialização permanece com o texto completo.

Não é necessário encurtá-lo devido ao recorte normal do flyout, pois o EasyBlox já possui comportamento global de hover que faz o bloco sobressair e ficar integralmente visível.

### 22.128. Validações finais do checkpoint Joystick

Resultados automatizados:

`arduino-uno-protocol.js`

- 241 pass;
- 0 fail.

`arduino-uno.js`

- 449 pass;
- 0 fail.

`sensors.js`

- 73 pass;
- 0 fail.

Execução conjunta:

- 763 pass;
- 0 fail;
- 3 suites aprovadas.

Cobertura conjunta:

- statements: 95,27%;
- branches: 89,65%;
- functions: 96,87%;
- lines: 95,27%.

Firmware Arduino UNO:

- Flash: `12374 bytes (38%)`;
- SRAM global: `613 bytes (29%)`;
- SRAM livre: `1435 bytes`.

Build final da GUI:

`npm --prefix packages\scratch-gui run build:dev`

Resultado:

`SUCESSO`

### 22.129. Próximo ponto oficial de retomada

O checkpoint:

`Joystick Stage v1`

está funcionalmente aprovado.

Permanece fora deste checkpoint a alteração local independente:

`packages/scratch-gui/src/components/action-menu/icon--sprite.svg`

O staging deverá continuar explícito.

Após documentação, revisão, commit e push, prosseguir com o próximo item da base Arduino UNO, sem iniciar ESP32 antes da conclusão da fundação planejada.

### 22.130. Correção do contrato de Motor e organização visual

Após o fechamento do Joystick Stage v1, foi realizada uma revisão do contrato visual da categoria:

`Atuadores`

O contrato anterior exigia informar:

`IN1 / IN2 / PWM`

em cada comando de movimentação e parada.

Essa abordagem foi substituída por uma abstração baseada em motores lógicos:

`Motor 1`

`Motor 2`

O novo contrato visual é:

`configurar motor [1/2] IN1 [...] IN2 [...] PWM [...]`

`girar motor [1/2] sentido [frente/trás] velocidade [0..100] %`

`parar motor [1/2]`

Os perfis padrão definidos são:

`Motor 1`

- IN1 = D2;
- IN2 = D4;
- PWM = D3.

`Motor 2`

- IN1 = D7;
- IN2 = D8;
- PWM = D5.

O bloco de configuração mantém estado local na extensão `Atuadores`.

Configurações inválidas não devem sobrescrever um perfil anteriormente válido.

O bloco de configuração retorna:

`undefined`

evitando bolha visual `null`.

Os comandos existentes do protocolo foram preservados:

`MOTOR_WRITE = 0x17`

`MOTOR_STOP = 0x18`

Não foi necessária alteração no contrato do firmware ou do peripheral para a nova abstração.

A parada simplificada utiliza internamente:

`COAST = 0`

A categoria `Atuadores` passa a seguir a ordem oficial:

`Motor → Servo → Relé`

### 22.131. Separadores visuais entre grupos de hardware

Foi aprovado um padrão visual de agrupamento por pequenos espaços verticais, sem texto e sem marcadores.

O mecanismo utilizado no `getInfo()` é:

`'---'`

Na categoria `Atuadores`, a organização passa a ser:

- configurar motor;
- girar motor;
- parar motor;
- separador;
- mover servo;
- separador;
- definir relé.

Na categoria `Sensores Arduino`, foi inserido um separador entre:

`DHT`

e:

`Joystick`

A organização passa a ser:

- Ultrassônico;
- DHT;
- separador;
- inicializar Joystick;
- valor do Joystick;
- Joystick clicado?.

Esse padrão poderá ser reutilizado em outras categorias quando houver grupos funcionais distintos.

### 22.132. Reorganização da categoria Arduino UNO

A categoria:

`Arduino UNO`

foi reorganizada para melhorar a sequência pedagógica dos blocos.

A ordem oficial passa a ser:

- definir pino digital;
- ler pino digital;
- ler pino analógico;
- definir PWM;
- separador;
- tocar tom;
- parar tom;
- separador;
- obter temporizador;
- zerar temporizador.

As leituras digital e analógica passam, portanto, a aparecer antes dos blocos de Tom.

Os separadores utilizam o mesmo mecanismo:

`'---'`

já validado em `Atuadores` e `Sensores Arduino`.

### 22.133. Temporizador Arduino UNO — contrato Stage v1

Foram adicionados ao protocolo Stage:

`TIMER_READ = 0x24`

`TIMER_RESET = 0x25`

e a resposta:

`RESPONSE_TIMER_READ = 0x96`

`TIMER_RESET` utiliza a resposta genérica:

`ACK = 0x80`

`TIMER_READ` não possui payload de requisição.

A resposta contém quatro bytes:

`[MS3, MS2, MS1, MS0]`

representando um valor:

`uint32_t`

de milissegundos em ordem big-endian.

No firmware, o estado do temporizador é mantido em:

`uint32_t timerResetAt`

A leitura utiliza:

`millis() - timerResetAt`

e o reset utiliza:

`timerResetAt = millis()`

A subtração em `uint32_t` preserva o comportamento correto mesmo no overflow natural de `millis()`.

Antes do primeiro reset explícito, o temporizador representa aproximadamente o tempo decorrido desde a inicialização do firmware.

### 22.134. Peripheral e primitive do Temporizador

O peripheral Arduino UNO passa a manter:

`_pendingTimerReads`

e expõe:

`timerRead()`

`timerReset()`

`timerRead()`:

- exige conexão Stage;
- envia `TIMER_READ`;
- aguarda `RESPONSE_TIMER_READ`;
- valida payload de quatro bytes;
- reconstrói o valor sem operadores bitwise assinados do JavaScript;
- resolve a Promise com milissegundos;
- resolve `null` em `RESPONSE_ERROR`;
- resolve `null` em reset/desconexão.

`timerReset()` utiliza o mecanismo genérico:

`_sendCommandWithAck()`

e aguarda `ACK`.

Na extensão visual Arduino UNO:

`obter temporizador`

é um bloco `REPORTER`.

O peripheral trabalha em milissegundos, mas o bloco retorna:

`segundos`

por meio da conversão:

`milliseconds / 1000`

Valores `null` são preservados e não devem ser convertidos falsamente para zero.

O bloco:

`zerar temporizador`

é um bloco `COMMAND`.

### 22.135. Validação física do Temporizador

Firmware Arduino UNO compilado com sucesso:

- Flash: `12532 bytes (38%)`;
- SRAM global: `617 bytes (30%)`;
- SRAM livre: `1431 bytes`.

O firmware foi gravado e validado fisicamente em:

`COM11`

Sequência de teste:

`PING → PONG`

`TIMER_RESET → ACK`

espera aproximada de:

`2 segundos`

seguida de:

`TIMER_READ`

Resultado real:

`2020 ms`

equivalente a:

`2.02 s`

Portanto, foram aprovados fisicamente:

- handshake;
- reset;
- ACK;
- contagem de tempo;
- resposta de 32 bits;
- conversão para segundos.

Os testes físicos realizados posteriormente pelos próprios blocos do EasyBlox também foram aprovados.

### 22.136. Validações automatizadas e integração

Resultados finais individuais:

`arduino-uno-protocol.js`

- 246 pass;
- 0 fail.

`arduino-uno.js`

- 490 pass;
- 0 fail.

Execução conjunta:

- `arduino-uno-protocol.js`;
- `arduino-uno.js`;
- `actuators.js`;
- `sensors.js`.

Resultado:

- 865 pass;
- 0 fail;
- 4 suites aprovadas.

Cobertura conjunta:

- statements: 95,94%;
- branches: 90,14%;
- functions: 97,33%;
- lines: 95,94%.

Extensão Arduino UNO:

- statements: 96,86%;
- branches: 91,17%;
- functions: 100%;
- lines: 96,86%.

Build final da GUI:

`npm --prefix packages\scratch-gui run build:dev`

Resultado:

`SUCESSO`

Validação física final dos novos blocos de Motor e Temporizador:

`APROVADA`

### 22.137. Estado aprovado e próximo marco

Estão aprovados neste checkpoint:

- nova abstração Motor 1/2;
- ordem `Motor → Servo → Relé`;
- separadores visuais em Atuadores;
- separador DHT → Joystick em Sensores Arduino;
- reorganização da categoria Arduino UNO;
- Temporizador Stage v1;
- blocos `obter temporizador` e `zerar temporizador`;
- protocolo, peripheral, firmware e hardware real;
- regressão automatizada e build da GUI.

Permanece fora deste checkpoint a alteração local independente:

`packages/scratch-gui/src/components/action-menu/icon--sprite.svg`

Ela não deverá ser adicionada ao staging deste checkpoint.

O próximo marco oficial, antes da implementação profunda do Modo Carregar do Arduino UNO, será uma auditoria técnica dirigida do ecossistema OpenBlock.

**Atualização — 20/08/2026:** esse próximo marco foi concluído. A auditoria de OpenBlock, Arduino CLI, Scratch VM, Blockly, arquitetura de validação, recursos, toolchain e UX Palco/Carregar foi realizada, e o contrato técnico e pedagógico do Arduino UNO Modo Carregar v1 foi fechado em 19/08/2026.

A implementação já foi iniciada na branch:

`feat/easyblox-arduino-uno-upload-mode`

Checkpoint A1 publicado:

`034f250b79 feat: add Arduino UNO Upload core`

Não repetir essa auditoria salvo se surgir evidência técnica concreta que obrigue revisão do contrato.

O EasyBlox continuará sendo a plataforma principal e autônoma.

O OpenBlock será estudado como fonte de soluções que poderão ser:

`REUTILIZADAS`

`ADAPTADAS`

`USADAS COMO REFERÊNCIA`

ou:

`DESCARTADAS`

O objetivo será validar e complementar a arquitetura existente do EasyBlox, especialmente em:

- geração de código;
- definição de placas;
- compilação;
- Arduino CLI;
- upload;
- toolchain;
- futura expansão para ESP32.

A diretriz é:

`trazer para o EasyBlox, não migrar o EasyBlox para o OpenBlock`.

## 23. Arduino UNO — implementação do Modo Carregar v1

### 23.1. Estado da implementação em 20/08/2026

Branch:

`feat/easyblox-arduino-uno-upload-mode`

Checkpoint A1 publicado e sincronizado:

`034f250b79 feat: add Arduino UNO Upload core`

O A1 implementou:

- `quando Arduino Uno iniciar`;
- comportamento inerte desse hat no Stage;
- `UploadProgramExtractor`;
- EasyBlox IR inicial;
- `DigitalWrite`;
- `ArduinoUnoGenerator`;
- `pinMode OUTPUT` automático e deduplicado;
- geração determinística;
- regras iniciais de grafo alcançável;
- testes de entry point, scripts soltos, scripts Stage independentes e clones.

A alteração local independente continua fora de qualquer commit Arduino UNO:

`packages/scratch-gui/src/components/action-menu/icon--sprite.svg`

### 23.2. A2 — primeiro `sempre` e Context Validator

Foi implementada a semântica do primeiro `control_forever` da cadeia principal:

```text
quando Arduino Uno iniciar
    comandos A/B
    sempre
        comandos C/D
        →

setup = A/B
loop  = C/D

Um sempre vazio é válido.

A infraestrutura necessária por comandos presentes em loop() continua sendo inferida e inicializada em setup().

Código conectado após o primeiro loop infinito é preservado semanticamente na IR através de:

UnreachableCode
AfterInfiniteLoop

Foi criado:

packages/scratch-vm/src/upload/upload-context-validator.js

Responsabilidade atual:

IR alcançável
→ aceita


IR com AfterInfiniteLoop
→ erro de contexto
→ Upload deve ser bloqueado

O gerador não repete essa validação. A arquitetura continua obedecendo:

Scratch VM
↓
UploadProgramExtractor
↓
EasyBlox IR
↓
UploadContextValidator
↓
ArduinoUnoGenerator

Validação automatizada atual:

Upload:
22 pass
0 fail


Stage + Upload:
519 pass
0 fail
2 suites

O A2 encontra-se tecnicamente validado e pronto para revisão final, staging explícito, commit e push.

### 23.3. Próxima retomada

Após fechar o checkpoint A2:

continuar a implementação incremental de Controle;
preservar a separação Extractor → IR → Validators → Generator;
introduzir operadores e tipagem conforme o contrato fechado;
criar allocator seguro de identificadores internos quando surgir o primeiro recurso que realmente gere nomes internos, como repita N vezes;
não iniciar Arduino CLI, Hardware Service ou upload físico antes de consolidar o núcleo de IR/controle/validação previsto para esta fase.

O checklist integral do primeiro vertical slice permanece vigente; o commit A1 foi deliberadamente um checkpoint intermediário e não uma declaração de conclusão integral desse checklist.

### 23.4. A3 — `repita N vezes` e identificadores internos seguros

O A3 implementou o primeiro controle estruturado aninhável além do `sempre` principal.

Opcode Scratch suportado nesta etapa:

`control_repeat`

Representação na EasyBlox IR:

```text
Repeat
├── times
└── body[]
O corpo é extraído a partir de SUBSTACK e pode conter statements estruturados recursivamente.

A semântica inicial de TIMES aceita somente literal inteiro não negativo.

Não ocorre Math.round() ou outra correção silenciosa no Modo Carregar.

Foram validados:

0    → válido
1    → válido
3    → válido
2.5  → inválido
-1   → inválido

O ArduinoUnoGenerator passou a:

gerar Repeat como for;
gerar statements recursivamente;
preservar indentação determinística;
descobrir recursos dentro de estruturas aninhadas;
deduplicar pinMode mesmo quando o recurso só aparece dentro de Repeat.

Foi criado:

packages/scratch-vm/src/upload/internal-identifier-allocator.js

Primeiro uso real:

easyblox_repeat_index_0
easyblox_repeat_index_1

O allocator:

é determinístico;
evita colisões com nomes previamente reservados;
impede bases de identificador iniciadas por _;
aceita futuramente nomes derivados de variáveis e Meus Blocos como conjunto reservado.

Com isso, a pendência registrada anteriormente de criar um allocator seguro somente quando surgisse uso real foi atendida pelo A3.

Também foi validado Repeat aninhado e Repeat dentro do loop() criado pelo primeiro control_forever.

Estado automatizado:

Stage + Upload
531 pass
0 fail
2 suites

Arquivos principais do A3:

packages/scratch-vm/src/upload/internal-identifier-allocator.js
packages/scratch-vm/src/upload/arduino-uno-generator.js
packages/scratch-vm/src/upload/upload-program-extractor.js
packages/scratch-vm/test/unit/arduino-uno-upload.js

A alteração local:

packages/scratch-gui/src/components/action-menu/icon--sprite.svg

continua independente e não deve ser incluída no staging.

O A3 resolve a pendência do allocator prevista no checklist inicial, mas ainda não deve ser usado sozinho para declarar todo o contrato de Upload v1 concluído. Controle adicional, operadores, tipagem, classificação formal de compatibilidade por opcode e demais fases permanecem incrementais.

### 23.5. Marco oficial — primeiro vertical slice concluído

Em 20/08/2026, após o checkpoint A3, foi feita a conferência integral do checklist oficial do primeiro vertical slice do Arduino UNO Modo Carregar v1.

Resultado:

`13 de 13 critérios atendidos`

Commits que compõem o marco:

```text
034f250b79 — Upload core
99887d2ae5 — loop/context validation
1b6af7735d — repeat support + allocator seguro

Validação final:

Stage + Upload
531 pass
0 fail
2 suites

A alteração independente:

packages/scratch-gui/src/components/action-menu/icon--sprite.svg

permanece fora dos commits.

O primeiro vertical slice:

quando Arduino Uno iniciar + digitalWrite → sketch.ino determinístico

está oficialmente concluído.

Isso não fecha o Modo Carregar v1 completo.

Próxima fase contratual:

controle / operadores / tipagem

antes de Arduino CLI, BuildService, UploadService ou upload físico.

### 23.6. A4 — expressões e tipagem aritmética

Em 20/08/2026 foi concluído o A4 do Arduino UNO Modo Carregar v1.

O objetivo desta etapa foi introduzir expressões aritméticas tipadas sem romper a separação arquitetural já consolidada.

Pipeline mantido:

```text
Scratch VM
→ UploadProgramExtractor
→ EasyBlox IR
→ UploadContextValidator
→ UploadTypeValidator
→ ArduinoUnoGenerator
→ C++

Foi criada a primeira Expression IR:

IntegerLiteral
DecimalLiteral
BinaryExpression

Operadores incorporados:

operator_add       → Add
operator_subtract  → Subtract
operator_multiply  → Multiply
operator_divide    → Divide

O extractor passou a percorrer expressões recursivamente.

Exemplo:

repita (1 + 2) vezes

passa a produzir:

Repeat
└── times
    └── BinaryExpression
        ├── Add
        ├── IntegerLiteral(1)
        └── IntegerLiteral(2)

Foi criado:

packages/scratch-vm/src/upload/upload-type-validator.js

Tipos pedagógicos formalizados:

INTEGER
DECIMAL
TEXT
BOOLEAN

No A4, a validação efetiva utiliza inicialmente INTEGER e DECIMAL.

Promoção para Add, Subtract e Multiply:

INTEGER + INTEGER → INTEGER
INTEGER + DECIMAL → DECIMAL
DECIMAL + INTEGER → DECIMAL
DECIMAL + DECIMAL → DECIMAL

A mesma regra de promoção aplica-se a subtração e multiplicação.

Não ocorre conversão silenciosa de DECIMAL para INTEGER.

Repeat.times exige:

INTEGER

Assim:

repita (1 + 2) vezes

é válido.

repita (1 + 2.5) vezes

é inválido.

A divisão possui semântica especial:

Divide → DECIMAL

sempre que os operandos forem numéricos.

Portanto:

5 / 2

é semanticamente decimal e não pode assumir a divisão inteira nativa do C++.

O generator preserva essa regra por promoção explícita:

(static_cast<double>(5) / static_cast<double>(2))

A proteção também foi validada com expressões compostas nos operandos.

Exemplo:

(1 + 4) / (1 + 1)

não pode degenerar em divisão inteira.

O UploadTypeValidator mantém compatibilidade transitória com os valores numéricos diretos de Repeat.times introduzidos no A3.

Estado automatizado ao fechamento:

Upload
55 pass
0 fail


Stage + Upload
552 pass
0 fail
2 suites

Arquivos principais:

packages/scratch-vm/src/upload/upload-program-extractor.js
packages/scratch-vm/src/upload/upload-type-validator.js
packages/scratch-vm/src/upload/arduino-uno-generator.js
packages/scratch-vm/test/unit/arduino-uno-upload.js

A alteração local independente:

packages/scratch-gui/src/components/action-menu/icon--sprite.svg

continua fora do staging.

O A4 fecha a primeira fase de expressões e tipagem aritmética.

O Arduino UNO Modo Carregar v1 como um todo continua em implementação incremental.

Próximo checkpoint previsto:

A5 — comparações e booleanos

com base inicial em:

operator_lt
operator_equals
operator_gt
operator_and
operator_or
operator_not

### 23.7. A5 — comparações e operadores booleanos

Em 20/08/2026 foi concluído o A5 do Arduino UNO Modo Carregar v1.

A etapa expandiu a Expression IR e o sistema de tipos implementados no A4.

Foram incorporadas as comparações:

```text
operator_lt      → LessThan
operator_equals  → Equals
operator_gt      → GreaterThan

Todas produzem:

BOOLEAN

LessThan e GreaterThan aceitam operandos numéricos INTEGER e DECIMAL.

Equals, nesta etapa, está implementado para igualdade numérica:

INTEGER == INTEGER
INTEGER == DECIMAL
DECIMAL == INTEGER
DECIMAL == DECIMAL

A igualdade entre TEXT ou entre BOOLEAN permanece para uma fase posterior, quando esses tipos possuírem representação literal efetiva na Expression IR.

Não deve existir coerção silenciosa entre categorias pedagógicas diferentes.

Também foram implementados:

operator_and → And
operator_or  → Or

com regras:

BOOLEAN AND BOOLEAN → BOOLEAN
BOOLEAN OR BOOLEAN  → BOOLEAN

Operandos numéricos são rejeitados nesses operadores.

Geração C++:

And → &&
Or  → ||

O A5 também introduziu:

UnaryExpression

Primeiro uso:

operator_not → Not

Representação:

UnaryExpression
├── operator: Not
└── operand

Regra de tipo:

NOT BOOLEAN → BOOLEAN

INTEGER e DECIMAL não são convertidos implicitamente para booleanos.

Geração:

Not → !

Exemplo:

não (1 < 2)

gera:

(!(1 < 2))

Conjunto concluído no A5:

operator_lt      → LessThan    → BOOLEAN → <
operator_equals  → Equals      → BOOLEAN → ==
operator_gt      → GreaterThan → BOOLEAN → >
operator_and     → And         → BOOLEAN → &&
operator_or      → Or          → BOOLEAN → ||
operator_not     → Not         → BOOLEAN → !

Expression IR atual:

IntegerLiteral
DecimalLiteral
BinaryExpression
UnaryExpression

Estado automatizado:

Upload
88 pass
0 fail


Stage + Upload
585 pass
0 fail
2 suites

Arquivos principais:

packages/scratch-vm/src/upload/upload-program-extractor.js
packages/scratch-vm/src/upload/upload-type-validator.js
packages/scratch-vm/src/upload/arduino-uno-generator.js
packages/scratch-vm/test/unit/arduino-uno-upload.js

A alteração independente:

packages/scratch-gui/src/components/action-menu/icon--sprite.svg

continua fora do staging.

O A5 fecha o núcleo básico de comparações e operadores booleanos do Modo Carregar.

O Arduino UNO Upload v1 completo continua em implementação incremental.

### 23.8. A6.1 — `control_if`

Em 20/08/2026 foi concluído o A6.1 do Arduino UNO Modo Carregar v1.

O checkpoint introduz o primeiro statement condicional estruturado na EasyBlox IR:

```text
control_if
→ If

Representação:

If
├── condition: Expression
└── body: Statement[]

O UploadProgramExtractor permanece como única camada que conhece diretamente o opcode Scratch control_if.

A condição reutiliza a Expression IR já consolidada:

IntegerLiteral
DecimalLiteral
BinaryExpression
UnaryExpression

O corpo é extraído recursivamente.

Regra de tipo:

If.condition → BOOLEAN

Não existe coerção numérica implícita para booleano.

Assim:

BOOLEAN → válido
INTEGER → rejeitado
DECIMAL → rejeitado

O UploadTypeValidator também percorre If.body recursivamente.

O ArduinoUnoGenerator passa a gerar:

if (<condition>) {
    ...
}

com indentação determinística e geração recursiva dos statements internos.

A inferência de recursos também passa a atravessar If.body.

Exemplo:

If
└── DigitalWrite D13

faz com que o sketch contenha:

pinMode(13, OUTPUT);

mesmo que o DigitalWrite exista somente dentro da condição.

A coleta recursiva de recursos reconhece atualmente:

Repeat.body
If.body

Estado automatizado:

Upload
92 pass
0 fail
1 suite


Stage + Upload
589 pass
0 fail
2 suites

Testes adicionados no A6.1:

Arduino UNO Upload extracts control_if into If semantic IR
Arduino UNO Upload rejects INTEGER used directly as If condition
Arduino UNO generator emits If statement from semantic IR
Arduino UNO generator infers OUTPUT pinMode inside If body

Arquivos principais:

packages/scratch-vm/src/upload/upload-program-extractor.js
packages/scratch-vm/src/upload/upload-type-validator.js
packages/scratch-vm/src/upload/arduino-uno-generator.js
packages/scratch-vm/test/unit/arduino-uno-upload.js

A alteração independente:

packages/scratch-gui/src/components/action-menu/icon--sprite.svg

continua fora do staging.

O A6.1 está funcionalmente concluído.

Próximo incremento:

A6.2 — control_if_else

O A6.2 deverá reutilizar as mesmas regras de condição BOOLEAN, validação recursiva, inferência de recursos e geração determinística estabelecidas no A6.1.

### 23.9. A6.2 — `control_if_else`

Em 20/08/2026 foi concluído o A6.2 do Arduino UNO Modo Carregar v1.

O checkpoint complementa o `control_if` do A6.1 com o segundo controle condicional estruturado:

```text
control_if_else
→ IfElse

Representação:

IfElse
├── condition: Expression
├── thenBody: Statement[]
└── elseBody: Statement[]

Mapeamento dos branches Scratch:

SUBSTACK  → thenBody
SUBSTACK2 → elseBody

Regra de tipo:

IfElse.condition → BOOLEAN

Não existe coerção implícita de INTEGER ou DECIMAL para booleano.

O UploadTypeValidator percorre recursivamente:

thenBody
elseBody

O ArduinoUnoGenerator gera:

if (<condition>) {
    ...
} else {
    ...
}

com geração e indentação recursivas dos dois branches.

A inferência de recursos também percorre ambos os caminhos.

A coleta estrutural reconhece atualmente:

Repeat.body
If.body
IfElse.thenBody
IfElse.elseBody

Recursos encontrados em qualquer branch são inicializados no setup().

Estado automatizado:

Upload
96 pass
0 fail
1 suite


Stage + Upload
593 pass
0 fail
2 suites

Testes adicionados no A6.2:

Arduino UNO Upload extracts control_if_else into IfElse semantic IR
Arduino UNO Upload rejects INTEGER used directly as IfElse condition
Arduino UNO generator emits IfElse statement from semantic IR
Arduino UNO generator infers OUTPUT pinMode inside both IfElse branches

Arquivos principais:

packages/scratch-vm/src/upload/upload-program-extractor.js
packages/scratch-vm/src/upload/upload-type-validator.js
packages/scratch-vm/src/upload/arduino-uno-generator.js
packages/scratch-vm/test/unit/arduino-uno-upload.js

A alteração independente:

packages/scratch-gui/src/components/action-menu/icon--sprite.svg

continua fora do staging.

Com:

A6.1 → control_if
A6.2 → control_if_else

o A6 fecha o núcleo inicial de controles condicionais do Arduino UNO Modo Carregar v1.

O projeto permanece na implementação incremental do contrato de Upload. A próxima etapa deverá ser definida a partir da sequência contratual consolidada, sem antecipar funcionalidades fora do próximo checkpoint.

### 23.10. A7.1/A7.2 — API Upload e UX Palco ↔ Carregar

Em 22/08/2026 foi concluído e validado o checkpoint A7.1/A7.2 do Arduino UNO Modo Carregar v1.

O trabalho integra a primeira API pública de geração Upload da Scratch VM à nova experiência de seleção de modo, placas e extensões do EasyBlox.

A etapa A7.3 — preview C++ somente leitura — permanece para o próximo incremento.

#### A7.1 — API pública da Scratch VM

A VirtualMachine passou a disponibilizar a geração Arduino UNO Upload através de API pública.

A GUI não acessa diretamente:

UploadProgramExtractor
EasyBlox IR
Upload validators
ArduinoUnoGenerator

O fluxo permanece encapsulado na VM:

Scratch VM
→ UploadProgramExtractor
→ EasyBlox IR
→ validação
→ ArduinoUnoGenerator
→ C++

Isso mantém a Scratch VM como fonte canônica do programa.

#### A7.2 — seletor Palco ↔ Carregar

Foi implementado o seletor superior:

Palco
Carregar

Palco permanece como modo padrão.

A entrada em Carregar verifica a existência de placa compatível.

Quando necessário, o seletor de placas é aberto antes da mudança efetiva de modo.

#### Seleção de placas

O catálogo de extensões passou a diferenciar explicitamente:

board
extension

As placas utilizam metadados próprios, incluindo:

boardId
extensionId
modes
visible

O fluxo genérico foi validado com:

Arduino UNO
micro:bit

O seletor permite também:

Remover placa selecionada

Ao remover uma placa:

- a conexão é encerrada quando necessário;
- selectedBoard é limpo;
- connectionState retorna para disconnected;
- programMode retorna para stage;
- as categorias associadas à placa deixam a paleta.

#### Companions de hardware

A relação entre uma placa e suas categorias auxiliares permanece definida na Scratch VM.

Para Arduino UNO:

arduinoUno
├── actuators
├── sensors
└── displays

A ExtensionManager passou a expor:

getExtensionDependencies(extensionId)
getExtensionCompanions(extensionId)

Os valores retornados são cópias defensivas.

A GUI consulta essas APIs e não replica a relação Arduino → companions.

Com Arduino UNO ativo, a paleta apresenta:

Arduino UNO
Atuadores
Sensores Arduino
Displays

Ao remover Arduino UNO, as quatro categorias desaparecem juntas.

#### Extensões normais

Extensões normais são independentes da placa selecionada.

O modelo atual permite:

0 ou 1 placa selecionada
0 ou N extensões normais ativas

O estado das extensões normais é mantido em:

activeExtensionIds

Cards de extensões ativas apresentam um botão:

×

Esse botão remove somente aquela extensão do contexto visível da paleta.

A remoção:

- não dispara a ação principal do card;
- não remove outras extensões;
- não apaga blocos já existentes nos scripts;
- não exige descarregar tecnicamente a extensão da VM.

A biblioteca pode permanecer aberta após a remoção.

#### Proteção contra reativação

Foi distinguido o comportamento de:

EXTENSION_ADDED
BLOCKSINFO_UPDATE

Uma extensão efetivamente adicionada pode entrar em activeExtensionIds.

Uma atualização de informações dos blocos não pode reativar automaticamente uma extensão removida pelo usuário.

handleExtensionAdded passou a aceitar:

shouldActivate = true

e handleBlocksInfoUpdate utiliza:

shouldActivate = false

#### Filtro geral do toolbox

O filtro anterior específico para placa foi generalizado para:

filterBlocksXMLForProjectContext(...)

O filtro considera:

activeBoardId
activeExtensionIds
activeBoardCompanionIds
allBoardCompanionIds

Regras:

- somente a placa ativa permanece entre categorias classificadas como board;
- companions aparecem somente com a placa correspondente;
- extensões normais aparecem somente quando estão ativas;
- categorias dinâmicas desconhecidas continuam preservadas.

O toolbox é reconstruído quando muda:

activeBoardId
activeExtensionIds

#### Validação automatizada da GUI

Regressão integrada:

46 pass
0 fail
7 suites

Cobertura funcional desta regressão:

Blocks
ExtensionLibrary
Library
LibraryItem
catálogo/filtro de extensões
BoardSelectionModal

A relação de companions na Scratch VM também foi validada:

50 pass
0 fail
1 suite

#### Validação visual

Validado manualmente em 22/08/2026:

Arduino UNO selecionado
→ Arduino UNO + Atuadores + Sensores Arduino + Displays visíveis

Arduino UNO removido
→ categorias de hardware removidas da paleta

micro:bit selecionado
→ categoria micro:bit disponível normalmente

extensões normais
→ ativação e remoção independentes funcionando

blocos já utilizados de uma extensão removida
→ permanecem no workspace

#### Scratch VM `src` versus `dist`

Durante a validação foi identificado um ponto operacional importante.

A implementação de:

getExtensionCompanions()

estava presente em:

packages/scratch-vm/src/

e os testes da VM estavam GREEN.

Entretanto, o scratch-gui em execução ainda consumia bundles anteriores de:

packages/scratch-vm/dist/

Isso provocava falha no getToolboxXML quando qualquer placa era selecionada, impedindo temporariamente o carregamento das categorias Arduino UNO e micro:bit.

A correção operacional foi recompilar a VM:

cd packages\scratch-vm
npm run build

Após o build, getExtensionCompanions foi confirmado em:

dist\node\scratch-vm.js
dist\web\scratch-vm.js

e o comportamento visual voltou ao normal.

Diretriz:

após mudanças de API da Scratch VM consumidas pelo scratch-gui, verificar e recompilar o dist antes da validação visual quando necessário.

#### Alteração local independente

O arquivo:

packages/scratch-gui/src/components/action-menu/icon--sprite.svg

permanece fora do staging e não pertence ao checkpoint A7.1/A7.2.

Estado do checkpoint:

A7.1 — concluído
A7.2 — concluído e validado
A7.3 — próximo incremento: preview C++ somente leitura

### 23.11. A7.3 em implementação — UploadWorkspace, BoardProfile e Resource Validator

Em 23/08/2026 foi consolidado um checkpoint intermediário da etapa A7.3 do Arduino UNO Modo Carregar v1.

Branch atual:

`feat/easyblox-arduino-uno-upload-mode`

Base publicada anterior:

`86d21a617a feat: add Stage Upload hardware and extension UX`

Este checkpoint ainda não foi publicado.

#### Estado da A7.3

A7.3 está:

`EM IMPLEMENTAÇÃO`

Não considerar a etapa concluída ainda.

A parte funcional já implementada inclui:

- substituição da região Palco/atores por `UploadWorkspace` quando `programMode === 'upload'`;
- preview C++ somente leitura;
- atualização do preview através da API pública da Scratch VM;
- estrutura visual inferior para Monitor Serial;
- Monitor Serial colapsável;
- testes unitários do preview;
- testes unitários do `UploadWorkspace`.

A GUI continua chamando somente:

`vm.generateArduinoUnoUploadCode()`

e não conhece diretamente:

- `UploadProgramExtractor`;
- validadores;
- `ArduinoUnoGenerator`.

#### Arquivos novos da GUI

Foram introduzidos:

`packages/scratch-gui/src/components/upload-workspace/upload-workspace.jsx`

`packages/scratch-gui/src/lib/upload-code-preview.js`

Testes:

`packages/scratch-gui/test/unit/components/upload-workspace.test.jsx`

`packages/scratch-gui/test/unit/lib/upload-code-preview.test.js`

Integração:

`packages/scratch-gui/src/components/gui/gui.jsx`

Validação específica:

```text
8 pass
0 fail
2 suites

ESLint dos arquivos da A7.3:

0 errors
14 warnings

Os 14 warnings são exclusivamente da regra arrow-parens já conhecida.

Não utilizar eslint --fix de forma ampla.

BoardProfile

Foi criado:

packages/scratch-vm/src/upload/board-profiles/arduino-uno-board-profile.js

O ArduinoUnoBoardProfile concentra atualmente:

digitalPins
pwmPins
analogPins
tonePins
toneFrequencyRange
servoPins
servoAngleRange
servoPwmConflictPins
motors

Capacidades atuais relevantes:

digitalPins = 2..19
pwmPins = 3, 5, 6, 9, 10, 11
analogPins = 14..19
tonePins = 3, 5, 6, 9, 10, 11
servoPins = 3, 5, 6, 9, 10, 11

Tone frequency = 1..65535
Servo angle = 0..180
Servo/PWM Timer1 conflict = D9 e D10

Motores padrão:

Motor 1:
IN1 = D2
IN2 = D4
PWM = D3

Motor 2:
IN1 = D7
IN2 = D8
PWM = D5

Os pinos A0..A5 são representados na IR como:

A0 = 14
A1 = 15
A2 = 16
A3 = 17
A4 = 18
A5 = 19
UploadResourceValidator

Foi criado:

packages/scratch-vm/src/upload/upload-resource-validator.js

O validator é construído com um BoardProfile.

Responsabilidade:

validar capacidade física da placa;
reservar recursos utilizados pelo programa;
detectar conflitos de pinos;
detectar conflitos específicos do hardware;
permanecer independente dos detalhes internos dos blocos Scratch.

Pipeline público atual:

Scratch VM
→ UploadProgramExtractor
→ EasyBlox IR
→ UploadContextValidator
→ UploadTypeValidator
→ UploadResourceValidator
→ ArduinoUnoGenerator
→ C++

Na API pública Arduino UNO:

UploadResourceValidator
+
ArduinoUnoBoardProfile

são executados antes do gerador.

Arquivo integrado:

packages/scratch-vm/src/virtual-machine.js

API:

generateArduinoUnoUploadCode()

Um conflito de recurso agora interrompe a geração pública antes da produção do C++.

Recursos já cobertos pelo validator

Motores:

validação dos motores lógicos suportados;
IN1/IN2 digitais válidos;
PWM válido;
três pinos distintos;
configuração declarativa única;
reserva dos defaults do BoardProfile;
MotorWrite;
MotorStop;
colisões entre motores;
conflitos com Servo;
conflitos com Tone;
conflitos com Relay;
conflitos com PWM.

Servo:

pino válido;
ângulo 0..180;
conflito com Tone;
conflito com Relay;
conflito com Motor;
conflito com PWM no mesmo pino;
conflito Timer1 com PWM D9/D10.

Tone:

pino válido;
frequência 1..65535;
ToneStart;
capacidade do pino em ToneStop;
ToneStop não reserva um Tone ativo;
conflitos com Servo;
conflitos com Relay;
conflitos com Motor.

Relay:

pino digital válido;
conflitos com Servo;
Tone;
Motor;
PWM.

PWM:

pino PWM válido;
conflito com Motor;
Servo;
Relay;
Timer1 quando existe Servo.

DigitalWrite:

pino digital válido;
conflito com Servo.

DigitalReadExpression:

pino digital válido;
conflito com Servo.

AnalogReadExpression:

somente pinos analógicos A0..A5.
Expressions no Resource Validator

O validator passou a possuir travessia própria para expressions.

Métodos introduzidos:

_validateStatementExpressions(...)

_validateExpression(...)

Isso permite alcançar hardware dentro de árvores como:

If
└── condition
    └── DigitalReadExpression

e:

BinaryExpression
├── AnalogReadExpression
└── IntegerLiteral

sem misturar expressions com statements.

A travessia de expressions é recursiva e deve ser reutilizada pelos próximos reporters de hardware.

Regra importante sobre contrato Stage

Não criar conflitos no Upload por suposição.

Durante este checkpoint o firmware Stage foi consultado para conferir várias regras.

Foi confirmado, entre outros pontos:

DigitalWrite × Servo no mesmo pino → inválido

DigitalRead × Servo no mesmo pino → inválido

Servo × PWM no mesmo pino → inválido

Servo ativo + PWM D9/D10 → inválido por Timer1

Tone × PWM → NÃO é bloqueado pelo Stage atual

Consequentemente:

Tone × PWM

não foi inventado como conflito no Upload.

Usar o contrato físico conhecido da placa e o comportamento Stage como referências sempre que necessário.

Regressão do checkpoint

Scratch VM:

arduino-uno-protocol.js       246 pass
arduino-uno-upload.js         210 pass
virtual-machine-upload.js       3 pass
arduino-uno.js                497 pass

956 pass
0 fail
4 suites

Scratch GUI A7.3:

8 pass
0 fail
2 suites

Validações adicionais:

node --check

aprovado para:

upload-resource-validator.js;
arduino-uno-board-profile.js;
virtual-machine.js.

git diff --check:

sem erros reais de whitespace;
apenas warnings informativos CRLF → LF.
Estado do working tree antes do fechamento deste checkpoint

Arquivos de Upload em alteração incluem:

packages/scratch-vm/src/upload/arduino-uno-generator.js
packages/scratch-vm/src/upload/upload-context-validator.js
packages/scratch-vm/src/upload/upload-program-extractor.js
packages/scratch-vm/src/upload/upload-type-validator.js
packages/scratch-vm/src/upload/board-profiles/arduino-uno-board-profile.js
packages/scratch-vm/src/upload/upload-resource-validator.js
packages/scratch-vm/src/virtual-machine.js
packages/scratch-vm/test/unit/arduino-uno-upload.js
packages/scratch-vm/test/unit/virtual-machine-upload.js

Arquivos A7.3 da GUI em alteração incluem:

packages/scratch-gui/src/components/gui/gui.jsx
packages/scratch-gui/src/components/upload-workspace/upload-workspace.jsx
packages/scratch-gui/src/lib/upload-code-preview.js
packages/scratch-gui/test/unit/components/upload-workspace.test.jsx
packages/scratch-gui/test/unit/lib/upload-code-preview.test.js

A alteração local independente:

packages/scratch-gui/src/components/action-menu/icon--sprite.svg

continua fora do checkpoint.

Nunca adicioná-la ao staging sem autorização explícita.

Durante a revisão do working tree foram encontrados quatro arquivos acidentais vazios:

a.motor
code
npx
{

Todos tinham 0 bytes, eram untracked e foram removidos antes do checkpoint.

Próximos passos da A7.3

Ainda permanecem pendentes:

categoria Serial;
classificação UPLOAD_ONLY;
iniciar Serial com baud rate;
escrever Serial;
escrever Serial com quebra de linha;
ligação funcional do Monitor Serial;
tradução pedagógica dos erros do pipeline;
acabamento visual do UploadWorkspace;
filtro definitivo das categorias/blocos Palco versus Carregar.

O aluno não deverá precisar interpretar mensagens brutas do compilador para descobrir o erro nos blocos.

Princípio mantido:

erro técnico interno → orientação pedagógica na interface

Próxima continuidade do UploadResourceValidator

Após o fechamento deste checkpoint, continuar incrementalmente a matriz de recursos.

Não fazer refactor amplo antes da cobertura funcional necessária.

Pontos que ainda merecem revisão conforme novos blocos forem incorporados:

conflitos adicionais envolvendo DigitalWrite/DigitalRead;
sensores;
Ultrassônico;
DHT;
Joystick;
MAX7219;
LCD I2C;
TM1637;
reservas I2C;
recursos específicos de timers;
recursos compartilhados pelos Displays.

Depois deverão entrar no pipeline Upload:

Sensores;
Displays;
Serial;
demais Control/Operators;
Variáveis;
Meus Blocos;
BuildService;
UploadService;
ToolchainProvider.

Não iniciar ESP32 antes de concluir a base Arduino UNO planejada.

Estado oficial após este checkpoint intermediário
A7.1 — concluído
A7.2 — concluído e validado
A7.3 — em implementação

UploadWorkspace — funcional inicial
Preview C++ — funcional
Monitor Serial visual — estrutura inicial
Serial funcional — pendente
Erro pedagógico — pendente
BoardProfile Arduino UNO — implementado
UploadResourceValidator — implementado e integrado à API pública

Não considerar A7.3 fechado até conclusão dos itens pendentes acima.

### 23.12. A7.3 — executionMode, Serial e bloqueio de conexões incompatíveis

Branch atual:

`feat/easyblox-arduino-uno-upload-mode`

Base deste ciclo:

`4830457032 feat: add Arduino UNO Upload workspace and resource validation`

#### Contrato de execução por opcode

Foi consolidada na Scratch VM a classificação:

`STAGE_ONLY = 'stage'`

`UPLOAD_ONLY = 'upload'`

`BOTH = 'both'`

O comportamento padrão continua sendo `BOTH` quando não existe declaração explícita.

A classificação representa o contrato funcional aprovado do bloco e não apenas o que o gerador Upload já consegue compilar hoje.

Categorias nativas `STAGE_ONLY`:

- Movimento;
- Aparência;
- Som;
- Eventos;
- Sensores nativos Scratch.

Operadores:

`BOTH`

Procedimentos / Meus Blocos:

`BOTH`

Variáveis escalares:

`BOTH`

Listas:

`STAGE_ONLY` na v1.

Controle é uma categoria mista.

Somente estes quatro blocos são `STAGE_ONLY`:

- `pare [todos]`;
- `quando eu começar como um clone`;
- `crie clone de [este ator]`;
- `apague este clone`.

Todos os demais blocos de Controle permanecem `BOTH`.

#### Arduino UNO

Na categoria Arduino UNO, somente:

`quando Arduino Uno iniciar`

é `UPLOAD_ONLY`.

Todos os demais blocos Arduino UNO permanecem:

`BOTH`

mesmo que alguma primitive ainda esteja temporariamente ausente do gerador.

#### Serial

Foi adicionada a base da extensão/categoria Serial.

Contrato:

`UPLOAD_ONLY`

Blocos iniciais:

- iniciar Serial;
- escrever Serial;
- escrever Serial com quebra de linha.

Baud rate usa opções fechadas.

Serial deve ficar oculto da paleta no Palco.

#### Toolbox e workspace são contratos diferentes

A troca de modo não pode apagar blocos existentes.

Um bloco incompatível que já está no workspace deve:

- continuar visível;
- manter suas conexões existentes;
- ficar desabilitado;
- não iniciar novas conexões;
- não aceitar novas conexões;
- voltar a ser habilitado quando o modo compatível retornar.

A razão canônica é:

`EASYBLOX_EXECUTION_MODE`

O container aplica esse estado através de:

`Blocks.updateWorkspaceExecutionMode()`

com:

`block.setDisabledReason(...)`

Eventos produzidos somente pela mudança de modo não devem ser persistidos como alteração estrutural do projeto.

Para a paleta existem dois comportamentos:

`HIDE`

e:

`SHOW_DISABLED`

O padrão é:

`HIDE`

Exceção aprovada:

`quando Arduino Uno iniciar`

permanece visível-desabilitado no Palco e habilitado em Carregar.

Serial permanece oculto no Palco.

#### Bug de conexão identificado

Durante os testes visuais foi observado que um bloco incompatível, embora visualmente desabilitado, ainda conseguia receber conexão.

Casos reproduzidos:

- no Palco, `quando Arduino Uno iniciar` aceitava bloco conectado abaixo;
- em Carregar, um hat Stage, como bandeira verde, ainda aceitava conexão.

Esse comportamento violava o contrato do `executionMode`.

#### EasyBloxConnectionChecker

Foi criado:

`packages/scratch-gui/src/lib/easyblox-connection-checker.js`

O checker estende o comportamento padrão do Scratch Blocks.

Fluxo:

1. consulta primeiro o checker original;
2. preserva qualquer rejeição original;
3. verifica os blocos envolvidos na conexão;
4. se algum possui `EASYBLOX_EXECUTION_MODE`, rejeita a conexão com `REASON_CHECKS_FAILED`.

Outras razões de disabled não são confundidas automaticamente com incompatibilidade Palco/Carregar.

#### Investigação de integração

Os testes unitários do checker já estavam verdes, mas o comportamento visual continuava incorreto.

Foi criado um teste de integração utilizando `WorkspaceSvg` real.

A investigação mostrou que o problema não estava em:

`canConnectWithReason(...)`

A causa-raiz estava em:

`ScratchBlocks.inject(...)`

A implementação Scratch Blocks 12.5.1 sobrescreve o objeto `plugins` informado pelo chamador.

Foi confirmado no código efetivo comportamento equivalente a:

`Object.assign(options, {renderer: ..., plugins: {toolbox: ..., flyoutsVerticalToolbox: ..., metricsManager: ...}})`

Com isso:

`plugins.connectionChecker`

fornecido pelo EasyBlox era descartado antes da criação efetiva do workspace.

O RED conclusivo do teste de integração produziu:

`Expected: "EasyBloxConnectionChecker"`

`Received: ""`

#### Solução

Foi introduzido:

`registerEasyBloxConnectionChecker(...)`

O checker EasyBlox passa a ser registrado no registry do Scratch Blocks como implementação:

`DEFAULT`

do tipo:

`CONNECTION_CHECKER`

O registro é idempotente.

Isso evita cadeias sucessivas de subclasses caso `VMScratchBlocks()` seja executado repetidamente.

O registro ocorre em:

`packages/scratch-gui/src/lib/blocks.js`

antes da criação do workspace.

Assim, mesmo com o wrapper de `inject()` substituindo `plugins`, o checker correto é recuperado do registry padrão.

#### Teste de integração

Novo arquivo:

`packages/scratch-gui/test/unit/lib/easyblox-connection-checker-integration.test.js`

Cobertura:

- instalação em `WorkspaceSvg` real;
- blocos renderizados reais;
- conexão durante drag;
- rejeição quando existe `EASYBLOX_EXECUTION_MODE`;
- passagem por `VMScratchBlocks(...)`;
- passagem pelo `ScratchBlocks.inject(...)` real.

Depois da correção:

`3 pass`

`0 fail`

O teste visual também foi aprovado.

Os blocos incompatíveis agora permanecem visíveis quando já existem no script, porém não permitem novas conexões.

#### ESLint

Foi realizada uma revisão específica dos seis arquivos envolvidos no checker/container.

Resultado final:

`0 errors`

`63 warnings`

Os warnings não foram tratados automaticamente.

Existe conflito confirmado entre:

`arrow-parens: [1]`

e:

`@stylistic/arrow-parens: [2, "as-needed"]`

Sem parênteses:

- a regra antiga gera warning.

Com parênteses:

- a regra `@stylistic` gera error.

Consequentemente, a forma sem parênteses foi mantida.

Também permanecem warnings JSDoc e warnings antigos não bloqueantes do container.

Arquivos novos tiveram line endings normalizados para:

`LF`

quando necessário.

#### Regressão GUI

Modo + checker:

`37 pass`

`0 fail`

`6 suites`

Suítes:

- `easyblox-connection-checker.test.js`;
- `easyblox-connection-checker-integration.test.js`;
- `make-toolbox-xml-program-mode.test.js`;
- `variable-category-program-mode.test.js`;
- `gui-program-mode.test.jsx`;
- `blocks.test.js`.

Também foi validado separadamente o grupo checker/container:

`31 pass`

`0 fail`

`3 suites`

#### Regressões Scratch VM

`extension_conversion.js`

`142 pass`

`0 fail`

`arduino-uno.js`

`500 pass`

`0 fail`

`arduino-uno-upload.js`

`240 pass`

`0 fail`

Infraestrutura:

`extension-manager-easyblox.js`

`4 pass`

`serial-extension.js`

`30 pass`

`virtual-machine-upload.js`

`4 pass`

A execução conjunta das três suítes de infraestrutura sofreu `SIGKILL` em `virtual-machine-upload.js` após aproximadamente 35 segundos.

Executada isoladamente, `virtual-machine-upload.js` passou:

`4/4`

Portanto, não foi caracterizada regressão funcional.

#### Validação de whitespace

`git diff --check`

aprovado.

Não existem erros reais de whitespace.

Os avisos:

`CRLF will be replaced by LF`

são apenas informativos em arquivos já modificados da Scratch VM.

#### Problema arquitetural descoberto no UploadWorkspace

Durante a validação visual desta etapa foi identificado um problema independente do checker.

Hoje, ao alternar:

`Palco → Carregar`

o fluxo utiliza o script do:

`editingTarget`

selecionado como fonte para a geração Arduino.

Esse comportamento está correto e corresponde ao contrato definitivo aprovado para a transição entre Modo Palco e Modo Carregar.

Contrato aprovado:

- Palco e Carregar utilizam o mesmo workspace e os mesmos scripts do target selecionado;
- não existe workspace, programa de blocos ou armazenamento de blocos independente para o Modo Carregar;
- entrar no Modo Carregar não cria um workspace vazio;
- alternar entre Palco e Carregar não apaga, desconecta, move nem reorganiza blocos existentes;
- a mudança de modo altera a disponibilidade da toolbox e o estado de compatibilidade dos blocos já presentes no workspace;
- blocos incompatíveis com o modo atual permanecem visíveis no script, mas ficam desabilitados e não podem receber novas conexões incompatíveis;
- blocos `STAGE_ONLY` ficam ocultos da paleta no Modo Carregar;
- blocos `UPLOAD_ONLY` ficam ocultos da paleta no Modo Palco;
- blocos `BOTH` permanecem disponíveis nos dois modos;
- toolbox e estado dos blocos existentes no workspace são contratos distintos;
- a fonte editável permanece sendo os blocos;
- C++ / `.ino` continua sendo artefato gerado;
- pipeline permanece `Blocks → EasyBlox IR → validação → C++`.

Contrato pedagógico do C++ gerado:

- o preview C++ faz parte da experiência educacional e deve apresentar código Arduino reconhecível pelo aluno;
- priorizar a API oficial do Arduino sempre que ela representar diretamente a operação;
- quando houver biblioteca adotada, priorizar a API pública e convencional dessa biblioteca;
- quando não houver API Arduino específica, utilizar construções padrão de C/C++;
- helpers proprietários EasyBlox só devem ser introduzidos quando forem tecnicamente necessários e não houver representação Arduino/C++ adequada;
- não criar wrappers `easyblox_*` apenas por conveniência quando a API Arduino já oferece a operação;
- exemplos já validados incluem `delay()`, `while`, `pinMode()`, `digitalWrite()` e `digitalRead()`;
- a geração deve permanecer determinística, compilável e semanticamente equivalente aos blocos.

Contrato de campos numéricos:

- entradas literais com domínio conhecido devem aplicar esse domínio diretamente na interface;
- `espere [segundos]` aceita valores literais não negativos, incluindo decimais;
- expressões matemáticas continuam podendo produzir valores negativos quando semanticamente permitido;
- valores legados ou programáticos fora do domínio devem continuar sendo tratados defensivamente pelo pipeline;
- campos reutilizáveis com limites devem ser preferidos para contratos como Servo `0–180`, PWM `0–255` e demais domínios explícitos.

#### Estado atual

A7.1 — concluído

A7.2 — concluído e validado

A7.3 — em implementação

Implementado/validado:

- contrato `executionMode`;
- classificação Stage/Upload/Both;
- toolbox dependente de modo;
- workspace único compartilhado entre Palco e Carregar;
- preservação de blocos incompatíveis existentes;
- disabled reason EasyBlox;
- bloqueio de novas conexões incompatíveis;
- `EasyBloxConnectionChecker`;
- integração real do checker com Scratch Blocks;
- Serial Upload-only;
- preview C++ em tempo real;
- geração C++ canônica para as operações já integradas;
- `control_wait` com geração por `delay()`;
- `control_wait_until` com geração por `while (!condição)`;
- `control_repeat_until` com geração por `while (!condição)` e corpo recursivo;
- coleta e validação de recursos utilizados em condições e corpos estruturados;
- campos numéricos EasyBlox com domínio explícito;
- regressões GUI e VM desta etapa.

Próxima prioridade:

- concluir os Operadores compatíveis com Upload;
- depois Variáveis;
- depois Meus Blocos / Procedures;
- depois Sensores Arduino;
- depois Displays;
- Monitor Serial funcional;
- tradução pedagógica dos erros;
- acabamento visual definitivo da A7.3.

Implementado/validado:

- contrato `executionMode`;
- classificação Stage/Upload/Both;
- toolbox dependente de modo;
- preservação de blocos incompatíveis existentes;
- disabled reason EasyBlox;
- bloqueio de novas conexões incompatíveis;
- `EasyBloxConnectionChecker`;
- integração real do checker com Scratch Blocks;
- Serial Upload-only;
- regressões GUI e VM desta etapa.

Próxima prioridade:

`workspace/programa Upload independente do editingTarget Stage`

Depois:

- persistência do programa Upload;
- Monitor Serial funcional;
- tradução pedagógica dos erros;
- acabamento visual definitivo da A7.3.

A alteração local:

`packages/scratch-gui/src/components/action-menu/icon--sprite.svg`

continua independente.

Nunca adicioná-la ao staging sem autorização explícita.
