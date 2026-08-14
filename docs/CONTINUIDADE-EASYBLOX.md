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
- perfis EasyMaker, EasyDuino e MakerDuino;
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
- criação dos perfis EasyMaker, EasyDuino e MakerDuino;
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
- MakerDuino.

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
