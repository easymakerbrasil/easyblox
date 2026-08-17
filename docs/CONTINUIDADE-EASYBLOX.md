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

Isso permite que futuras extensões específicas de EasyMaker, EasyDuino e MakerDuino façam o mapeamento lógico dos motores sem alterar o protocolo Stage.

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
