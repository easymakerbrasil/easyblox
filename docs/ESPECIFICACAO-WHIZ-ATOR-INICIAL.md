# Especificação — Whiz como ator inicial do EasyBlox

## 1. Estado deste trabalho

- Branch exclusiva: `feat/whiz-default-sprite`
- Branch principal de desenvolvimento preservada: `easyblox-dev`
- Ponto de restauração: `easyblox-branding-v0.1.0`
- Commit-base: `a972bca5a3`
- Status: planejamento e produção dos recursos visuais
- Nenhuma imagem rejeitada deverá entrar no repositório

## 2. Objetivo

Substituir somente o gato exibido no projeto inicial por Whiz, mantendo:

- o gato disponível na biblioteca de atores;
- compatibilidade com projetos `.sb3`;
- estrutura do Scratch VM;
- atribuições legais ao Scratch;
- funcionamento dos blocos, fantasias e sons.

## 3. Justificativa pedagógica

O ator inicial precisa permitir que uma criança aprenda naturalmente:

- mover alguns passos;
- mudar de direção;
- tocar na borda e voltar;
- alternar fantasias;
- criar animação de caminhada;
- utilizar estruturas de repetição;
- controlar velocidade com blocos de espera.

Por isso, uma única pose frontal do Whiz não é suficiente.

## 4. Fantasias obrigatórias

O Whiz deverá possuir três fantasias iniciais.

### 4.1. Whiz parado

- corpo voltado para a direita;
- enquadramento lateral ou em três quartos;
- duas pernas alinhadas e sem movimento;
- pés apoiados na mesma linha;
- braços em posição natural de repouso;
- expressão amigável.

### 4.2. Whiz — passo direito

- corpo voltado para a direita;
- perna direita à frente;
- perna esquerda atrás;
- braço esquerdo à frente;
- braço direito atrás;
- cabeça e tronco na mesma orientação da pose parada.

### 4.3. Whiz — passo esquerdo

- corpo voltado para a direita;
- perna esquerda à frente;
- perna direita atrás;
- braço direito à frente;
- braço esquerdo atrás;
- cabeça e tronco na mesma orientação das outras poses.

## 5. Regras de consistência visual

As três imagens deverão possuir:

- exatamente o mesmo personagem;
- mesma orientação para a direita;
- mesma escala;
- mesma altura;
- mesma posição da cabeça;
- mesmo eixo do tronco;
- mesmo enquadramento;
- mesma iluminação;
- mesmas cores;
- mesmo símbolo no peito;
- mesmo centro de rotação;
- fundo transparente;
- nenhuma sombra projetada;
- nenhum texto;
- nenhuma marca-d'água.

Nenhuma fantasia poderá parecer espelhada ou mostrar o Whiz virando para o lado oposto.

## 6. Especificação dos arquivos

- Formato: PNG com transparência
- Dimensão: `256 × 256`
- Espaço de cor: sRGB
- `bitmapResolution`: `2`
- Centro de rotação inicial previsto:
  - `rotationCenterX: 128`
  - `rotationCenterY: 128`

Os nomes definitivos dos arquivos deverão ser seus hashes MD5, conforme o padrão dos recursos `.sb3`.

## 7. Configuração prevista do ator

```text
Nome: Whiz
Posição X: 0
Posição Y: 0
Tamanho: 100
Direção: 90
Estilo de rotação: left-right
Visível: sim
Fantasia inicial: Whiz parado
```

O estilo `left-right` permitirá que o Whiz seja invertido ao mudar de direção sem ficar de cabeça para baixo.

## 8. Sons

O som `meow` não deverá permanecer associado ao Whiz.

Para a primeira implementação:

- reutilizar o som `pop`; ou
- manter o ator sem som, caso os testes indiquem ser mais adequado.

Nenhum novo som será incluído sem aprovação.

## 9. Arquivos técnicos previstos

```text
packages/scratch-gui/src/lib/default-project/index.ts
packages/scratch-gui/src/lib/default-project/project-data.ts
packages/scratch-gui/src/lib/default-project/messages.js
packages/scratch-gui/src/lib/default-project/<md5-whiz-parado>.png
packages/scratch-gui/src/lib/default-project/<md5-whiz-passo-direito>.png
packages/scratch-gui/src/lib/default-project/<md5-whiz-passo-esquerdo>.png
```

## 10. Critérios obrigatórios de aprovação

Antes de qualquer integração ao `easyblox-dev`, deverá ser confirmado que:

- [ ] as três fantasias apontam para a direita;
- [ ] a primeira fantasia mostra o Whiz parado;
- [ ] a segunda tem perna direita e braço esquerdo à frente;
- [ ] a terceira tem perna esquerda e braço direito à frente;
- [ ] a alternância não faz o personagem virar;
- [ ] a alternância não muda bruscamente o tamanho;
- [ ] o centro do corpo não salta entre as fantasias;
- [ ] o Whiz caminha visualmente ao alternar as fantasias;
- [ ] a direção `-90` espelha corretamente o ator;
- [ ] o gato continua disponível na biblioteca;
- [ ] novos projetos abrem corretamente;
- [ ] projetos `.sb3` salvam e reabrem corretamente;
- [ ] o Webpack compila sem erros;
- [ ] o usuário aprovou visualmente o resultado.

## 11. Regra de segurança

Nenhum recurso visual será integrado somente por parecer aceitável isoladamente.

As três fantasias deverão ser avaliadas juntas, preferencialmente por meio de uma prévia animada.

Se o ciclo não estiver correto, os arquivos serão descartados sem alterar `easyblox-dev`.

## 12. Continuidade em uma nova conversa

Mensagem sugerida:

```text
Quero continuar a criação do Whiz como ator inicial do EasyBlox.

Repositório:
https://github.com/easymakerbrasil/easyblox

Branch exclusiva:
feat/whiz-default-sprite

Antes de orientar ou alterar qualquer arquivo, leia:
docs/GUIA-DE-DESENVOLVIMENTO.md
docs/CONTINUIDADE-EASYBLOX.md
docs/ESPECIFICACAO-WHIZ-ATOR-INICIAL.md

O EasyBlox principal está protegido pela tag:
easyblox-branding-v0.1.0

Vou anexar novamente a referência visual oficial do Whiz.

Precisamos criar um rig ou ciclo consistente com três fantasias:
1. parado;
2. perna direita e braço esquerdo à frente;
3. perna esquerda e braço direito à frente.

As três imagens devem apontar para a direita, manter exatamente a mesma escala, eixo, centro de rotação e identidade visual.

Não altere nem faça merge em easyblox-dev sem testes e aprovação.
```