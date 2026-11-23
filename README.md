# desafio_teste_domino

Desafio: **Dominó para 2 jogadores**. Implementação e casos de teste automatizados escritos em **JavaScript** para testar **JavaScript** usando o executor nativo `node:test`.

## Especificação

- **Conjunto e distribuição:** **28 peças** únicas (`[0,0]` a `[6,6]`). Cada jogador recebe **7 peças** e **14 peças** permanecem no monte (`stock`).
- **Abertura:** Inicia quem possui a maior carroça (dupla); caso ninguém possua carroça, inicia quem detém a peça de maior soma. A primeira jogada deve obrigatoriamente utilizar essa peça inicial.
- **Jogadas, compra e passe:** Peças encaixam na ponta esquerda (`'left'`) ou direita (`'right'`), sendo rotacionadas automaticamente quando necessário. Sem peça jogável, o jogador compra do monte (`draw`); com monte vazio e sem jogada, passa a vez (`pass`).
- **Fim de partida:** Vence quem esvaziar a mão (`status = 'won'`). Se o jogo travar (monte vazio e nenhum jogador possui jogada), vence quem somar menos pontos nas mãos; empate na soma define `winner = null` (`status = 'blocked'`).

## Como rodar

```bash
npm install
npm test            # executa os 33 casos de teste
npm run coverage    # executa os testes com relatório de cobertura (100% em linhas, branches e funções do código-fonte)
```

Estrutura do repositório: `src/domino.js` (implementação) e `tests/domino.test.js` (suíte de testes).

## Funcionamento dos casos de teste

A suíte contém **33 testes automatizados** executados com `node:test` e asserções locais. Os CT01–CT26 cobrem criação e distribuição das peças, abertura, jogadas, pontas, compra, passe e encerramento; os CT27–CT33 ampliam a validação de mãos, monte, jogadores, orientações e jogo bloqueado. O embaralhamento e a distribuição podem ser injetados por `shuffle`, `hands` e `stock` para reproduzir os cenários.

### Especificação Detalhada dos Casos de Teste

---

#### Caso de Teste 1 — Criação de Peças, Distribuição e Embaralhamento (`CT01` a `CT04`)
- **Descrição:** Validar o conjunto completo de 28 peças, a distribuição 7/7/14 sem duplicatas e a integridade do algoritmo Fisher-Yates (`defaultShuffle`).
- **Pré-condições:** Funções `createTiles`, `defaultShuffle` e classe `DominoGame` importadas.
- **Passos:**
  1. Executar `createTiles()` e contar peças únicas.
  2. Instanciar `new DominoGame()` e verificar tamanhos de `hands[0]`, `hands[1]` e `stock`, além da unicidade da união das 28 peças.
  3. Executar `defaultShuffle(original, rng)` com geradores `() => 0`, `() => 0.3` e `() => 0.999999`, verificando preservação dos elementos e imutabilidade do array `original`.
- **Cenários:**
  - **CT01 — Conjunto de 28 peças:** Resultado Esperado: 28 peças únicas de `0-0` a `6-6`.
  - **CT02 — Distribuição inicial:** Resultado Esperado: `hands[0]` com 7, `hands[1]` com 7 e `stock` com 14 peças.
  - **CT03 — Ausência de repetição:** Resultado Esperado: união de mãos e monte contém 28 peças distintas.
  - **CT04 — Embaralhamento determinístico e imutável:** Dados: `rng` fixos (`0`, `0.3`, `0.999999`) | Resultado Esperado: altera ordem sem perder/duplicar peças e mantém `original` intacto.

---

#### Caso de Teste 2 — Definição de Jogador Inicial e Abertura (`CT05` a `CT08`)
- **Descrição:** Verificar a regra de escolha da peça inicial (maior carroça ou maior soma) e o bloqueio de abertura por jogador ou peça incorreta.
- **Pré-condições:** Partida criada com distribuição conhecida (`shuffle: identity` ou `hands` explícitas).
- **Passos:**
  1. Instanciar partida com `identity` (J0 tem `[0,0..0,6]`, J1 tem `[1,1..1,6],[2,2]`) e verificar `turn` e `startTile`.
  2. Instanciar partida sem carroças (`hands: [[[1, 2]], [[3, 5]]]`).
  3. Tentar abrir com peça diferente de `[2, 2]` e com jogador `0`.
- **Cenários:**
  - **CT05 — Maior carroça abre:** Dados: `[2, 2]` (J1) vs. `[0, 0]` (J0) | Resultado Esperado: `turn === 1` e `startTile.tile` igual a `[2, 2]`.
  - **CT06 — Desempate sem carroças:** Dados: `[1, 2]` (J0) vs. `[3, 5]` (J1) | Resultado Esperado: `turn === 1`.
  - **CT07 — Obrigatoriedade da peça inicial:** Dados: J1 tenta jogar `[1, 1]` antes de `[2, 2]` | Resultado Esperado: lança erro `'inicial'`; ao jogar `[2, 2]`, `board` recebe `[[2, 2]]`.
  - **CT08 — Bloqueio de jogador errado na abertura:** Dados: J0 tenta jogar `[0, 0]` na vez de J1 | Resultado Esperado: lança erro `'vez'`.

---

#### Caso de Teste 3 — Encaixe nas Pontas, Orientação e Regras de Jogada (`CT09` a `CT15`, `CT25`, `CT26`)
- **Descrição:** Validar encaixe à esquerda e à direita, inversão automática de peças, validação de posse/lado, alternância de turno e filtragem de peças jogáveis quando as pontas possuem valores distintos.
- **Pré-condições:** Partida aberta com `[2, 2]` na mesa.
- **Passos:**
  1. Jogar `[0, 2]` na ponta `'left'` e em outro cenário na ponta `'right'`, inspecionando `board` e `ends`.
  2. Tentar jogar peça incompatível (`[0, 3]`), peça ausente da mão (`[1, 2]`) e lado inválido (`'meio'`).
  3. Verificar alternância de turno e retorno de `playableTiles(0)`.
  4. Configurar mesa com pontas diferentes (`[2, 0]` e `[0, 2]`) e testar a peça `[1, 2]` de J1 em ambos os lados.
- **Cenários:**
  - **CT09 — Encaixe à esquerda:** Dados: `play(0, [0, 2], 'left')` | Resultado Esperado: `board` igual a `[[0, 2], [2, 2]]` e `ends` igual a `[0, 2]`.
  - **CT10 — Encaixe à direita com inversão:** Dados: `play(0, [0, 2], 'right')` | Resultado Esperado: `board` igual a `[[2, 2], [2, 0]]` e `ends` igual a `[2, 0]`.
  - **CT11 — Peça incompatível:** Dados: `play(0, [0, 3], 'left')` | Resultado Esperado: lança erro `'encaixa'`.
  - **CT12 — Peça não possuída:** Dados: `play(0, [1, 2], 'left')` | Resultado Esperado: lança erro `'não possui'`.
  - **CT13 — Lado inexistente:** Dados: `play(0, [0, 2], 'meio')` | Resultado Esperado: lança erro `'Lado'`.
  - **CT14 — Alternância de turno:** Dados: após jogada válida de J0 | Resultado Esperado: `turn === 1` e `hands[0]` reduzida para 6 peças.
  - **CT15 — Listagem `playableTiles`:** Dados: mesa `[[2, 2]]` | Resultado Esperado: `playableTiles(0)` retorna apenas `[[0, 2]]`.
  - **CT25 — Encaixe exclusivo na ponta esquerda:** Dados: `ends` `[2, 0]`, J1 com `[1, 2]` | Resultado Esperado: `playableTiles(1)` inclui `[1, 2]`; jogar em `'right'` falha (`'encaixa'`) e jogar em `'left'` atualiza `ends` para `[1, 0]`.
  - **CT26 — Encaixe exclusivo na ponta direita:** Dados: `ends` `[0, 2]`, J1 com `[1, 2]` | Resultado Esperado: `playableTiles(1)` inclui `[1, 2]`; jogar em `'left'` falha (`'encaixa'`) e jogar em `'right'` atualiza `ends` para `[0, 1]`.

---

#### Caso de Teste 4 — Compra do Monte e Passe de Vez (`CT16` a `CT21`)
- **Descrição:** Verificar compras sucessivas quando não há jogada disponível, proibição de passar com monte disponível, proibição de comprar tendo peça jogável e passe com monte vazio.
- **Pré-condições:** Cenários configurados com `hands` e `stock` controlados.
- **Passos:**
  1. Com J0 sem jogada e monte `[[0, 0], [2, 6]]`, chamar `draw(0)` uma vez e depois duas vezes até comprar `[2, 6]` e jogar.
  2. Tentar chamar `pass(0)` enquanto `stock` não está vazio.
  3. Tentar chamar `draw(0)` quando J0 possui peça jogável e quando `stock` está vazio.
  4. Chamar `pass(0)` com `stock` vazio e sem jogada disponível.
- **Cenários:**
  - **CT16 — Compra unitária do monte:** Dados: `draw(0)` | Resultado Esperado: retorna `[0, 0]`, `hands[0]` passa a ter 2 peças e `stock` 1 peça.
  - **CT17 — Proibição de passar com monte:** Dados: `pass(0)` com `stock` não vazio | Resultado Esperado: lança erro `'monte'`.
  - **CT18 — Compra até encontrar jogada:** Dados: dois `draw(0)` seguidos de `play(0, [2, 6], 'left')` | Resultado Esperado: `playableTiles(0)` identifica `[2, 6]` e encaixa virando para `[6, 2]`.
  - **CT19 — Proibição de comprar com jogada:** Dados: `draw(0)` tendo `[0, 2]` | Resultado Esperado: lança erro `'jogável'`.
  - **CT20 — Compra em monte vazio:** Dados: `draw(0)` com `stock: []` | Resultado Esperado: lança erro `'Monte vazio'`.
  - **CT21 — Passe com monte vazio:** Dados: `pass(0)` sem jogada e `stock: []` | Resultado Esperado: turno passa para `1`.

---

#### Caso de Teste 5 — Encerramento por Batida ou Jogo Fechado (`CT22` a `CT24`)
- **Descrição:** Validar vitória imediata ao esvaziar a mão, contagem de pontos em jogo trancado e empate.
- **Pré-condições:** Mãos reduzidas configuradas para simular final de partida.
- **Passos:**
  1. Jogar última peça de J1 e tentar nova jogada com J0.
  2. Configurar mãos sem jogadas possíveis e monte vazio com pontuações diferentes (`9` vs. `11`) e pontuações iguais (`8` vs. `8`).
- **Cenários:**
  - **CT22 — Vitória por batida:** Dados: J1 joga sua única peça `[2, 3]` | Resultado Esperado: retorna `'won'`, `winner === 1` e nova tentativa de jogada lança erro `'terminou'`.
  - **CT23 — Jogo fechado com vencedor por pontos:** Dados: J0 soma 9 pontos (`[1,1],[3,4]`) e J1 soma 11 (`[5,6]`) | Resultado Esperado: `status === 'blocked'` e `winner === 0`.
  - **CT24 — Jogo fechado empatado:** Dados: J0 soma 8 pontos (`[1,1],[3,5]`) e J1 soma 8 (`[4,6]`) | Resultado Esperado: `status === 'blocked'` e `winner === null`.

## Execução e cobertura de código

Os testes usam o executor nativo `node:test`, incluído no Node.js, sem dependências externas. Execute `npm test` para rodar a suíte e `npm run coverage` para medir o código-fonte em `src/`. O comando de cobertura exige 100% de linhas, decisões (branches) e funções; se algum desses limites não for atingido, o comando termina com falha. Os arquivos auxiliares de teste não entram no cálculo, pois a métrica solicitada é a cobertura da implementação do desafio.

A suíte contém **34 testes automatizados**. Além dos cenários CT numerados, foram acrescentadas verificações de entradas inválidas, limites e fluxos alternativos.

### Testes complementares de robustez

Além dos cenários detalhados acima, foram adicionados: CT27–CT33: distribuição inválida, mãos vazias, peças e monte malformados, jogador inválido, encaixe invertido nas duas pontas, bloqueio com vitória do jogador 1 e proibição de passar quando há peça jogável.

A cobertura é calculada somente sobre os arquivos de implementação em `src/`, não sobre o próprio código auxiliar usado pelos testes. O comando de cobertura exige simultaneamente **100% de linhas, 100% de branches e 100% de funções**; qualquer percentual abaixo disso faz o comando falhar.

## Colaboradores

| Nome | RA |
|---|---|
| Arthur Lavagnolli Molina | 24031565-2 |
| Gustavo dos Santos Guimarães | 24000191-2 |
