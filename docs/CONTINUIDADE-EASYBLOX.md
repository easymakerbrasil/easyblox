# Continuidade do Projeto EasyBlox

Atualizado em: 10 de agosto de 2026

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

Branch de desenvolvimento:

```text
easyblox-dev
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

Commit mais recente deste documento:

```text
5bf4c04135 — feat: add EasyBlox visual identity
```

Situação no momento desta atualização:

```text
Branch sincronizada com origin/easyblox-dev
Working tree clean
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
- criação da documentação;
- criação da identidade do EasyBlox;
- integração inicial da logo;
- envio de todos os commits ao GitHub.

Ainda não realizado:

- substituição da paleta roxa pela paleta EasyMaker;
- substituição dos textos e nomes Scratch por EasyBlox;
- personalização da tela inicial;
- inclusão das placas Arduino UNO e ESP32;
- criação dos perfis EasyMaker, EasyDuino e MakerDuino;
- integração do Arduino CLI;
- geração de Arduino C/C++;
- empacotamento desktop;
- desenvolvimento do EasyConect.

## 12. Próximo passo imediato

A personalização principal da barra superior do EasyBlox foi concluída e validada no Windows.

Resultado atual:

- barra superior em grafite EasyMaker (`#282828`);
- botão `Partilhar` em amarelo EasyMaker (`#ffc800`);
- texto do botão em grafite;
- campo do nome do projeto discreto quando inativo;
- campo branco, texto grafite e borda amarela quando recebe foco;
- contraste visual preservado;
- Webpack compilado;
- interface validada em `localhost:8601`.

Arquivos envolvidos nesta etapa:

```text
packages/scratch-gui/src/css/easyblox-colors.css
packages/scratch-gui/src/components/menu-bar/menu-bar.css
packages/scratch-gui/src/components/menu-bar/share-button.css
packages/scratch-gui/src/components/menu-bar/project-title-input.css

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
- Trabalhar sempre na branch `easyblox-dev`.
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

Branch:
easyblox-dev

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