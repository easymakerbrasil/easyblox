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

Branch ativa desta implementação:

```text
feat/whiz-default-sprite
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
655a803b14 — docs: specify Whiz default sprite animation
4487e3964e — docs: simplify Whiz default sprite to two costumes
7a830d8644 — feat: add Whiz as default sprite
0b17023db — feat: add Whiz to sprite library
```

Situação no momento desta atualização:

```text
Branch ativa: feat/whiz-default-sprite
Branch sincronizada anteriormente com origin/feat/whiz-default-sprite
Whiz como ator inicial já implementado, testado e enviado ao origin
Disponibilidade do Whiz na biblioteca implementada, validada e commitada
Documentação de continuidade ainda não commitada
Não realizar merge em easyblox-dev antes da conclusão dos testes, documentação e aprovação final
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
- commits anteriores da implementação do ator inicial enviados ao GitHub;
- biblioteca do Whiz registrada no commit `0b17023db`;
- documentação de continuidade ainda aguardando commit.

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

A implementação do Whiz como ator inicial está concluída e validada.

O Whiz também foi incorporado à biblioteca de atores para que possa ser recuperado caso seja removido do projeto.

Configuração aprovada:

- nome do ator: `Whiz`;
- fantasia inicial: `parado`;
- segunda fantasia: `passada`;
- formato dos assets: PNG transparente;
- arquivos físicos: 256 × 256 px;
- `bitmapResolution: 2`;
- centro de rotação: `128, 128`;
- tamanho inicial: `100`;
- direção inicial: `90`;
- estilo de rotação: `left-right`;
- sem sons próprios nesta versão.

Assets:

```text
5848ed4b455e55aa97cb56404a22ef4a.png — parado
027345af81f9af923d045f52b1e63ae0.png — passada
```

Arquivos principais da implementação:

```text
packages/scratch-gui/src/lib/default-project/index.ts
packages/scratch-gui/src/lib/default-project/project-data.ts
packages/scratch-gui/src/lib/default-project/5848ed4b455e55aa97cb56404a22ef4a.png
packages/scratch-gui/src/lib/default-project/027345af81f9af923d045f52b1e63ae0.png
packages/scratch-gui/src/lib/libraries/sprites.json
packages/scratch-gui/src/containers/sprite-library.jsx
```

A biblioteca padrão tenta carregar previews pelo CDN do Scratch. Como os assets do Whiz pertencem ao EasyBlox e não existem nesse CDN, `sprite-library.jsx` fornece os PNGs locais como `rawURL` apenas para a interface. O `rawURL` é removido antes de o ator ser enviado ao Scratch VM.

Validações já concluídas:

- projeto novo abre com Whiz;
- fantasias `parado` e `passada` carregam corretamente;
- animação entre fantasias sem salto visual;
- orientação `90` validada;
- espelhamento em `-90` validado;
- salvamento e reabertura de `.sb3` validados;
- gato original permanece disponível na biblioteca;
- Whiz aparece corretamente na biblioteca;
- Whiz pode ser removido e reinserido pela biblioteca;
- reinserção preserva as duas fantasias;
- `git diff --check` aprovado;
- lint localizado sem erros de implementação;
- `build:dev` compilado com sucesso.

Próxima ação operacional:

```text
1. concluir e revisar esta documentação de continuidade;
2. criar o commit da documentação;
3. enviar os novos commits para origin/feat/whiz-default-sprite;
4. realizar a auditoria final da branch;
5. confirmar que o working tree está limpo e sincronizado;
6. somente após aprovação final, integrar a feature em easyblox-dev.
```

Não realizar merge em `easyblox-dev` antes desse checkpoint final.


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