require('./test-helpers');
const { createTiles, DominoGame, defaultShuffle, pips } = require('../src');

const identity = (a) => a.slice(); // sem embaralhar: J0 = [0,0..0,6]; J1 = [1,1..1,6],[2,2]

describe('Peças e distribuição', () => {
  test('CT01 - existem 28 peças únicas', () => {
    const t = createTiles();
    expect(t).toHaveLength(28);
    expect(new Set(t.map((x) => x.join('-'))).size).toBe(28);
  });
  test('CT02 - cada jogador recebe 7 peças e o monte fica com 14', () => {
    const g = new DominoGame();
    expect(g.hands[0]).toHaveLength(7);
    expect(g.hands[1]).toHaveLength(7);
    expect(g.stock).toHaveLength(14);
  });
  test('CT03 - nenhuma peça é repetida entre mãos e monte', () => {
    const g = new DominoGame();
    const all = [...g.hands[0], ...g.hands[1], ...g.stock].map((t) => t.join('-'));
    expect(new Set(all).size).toBe(28);
  });
  test('CT04 - embaralhamento muda a ordem mas preserva as peças', () => {
    const original = createTiles();
    [() => 0, () => 0.3, () => 0.999999].forEach((rng) => {
      const s = defaultShuffle(original, rng);
      expect(s).toHaveLength(28);
      expect(new Set(s.map((x) => x.join('-'))).size).toBe(28);
    });
    expect(defaultShuffle(original, () => 0.3)).not.toEqual(original);
    expect(original).toEqual(createTiles()); // não altera o vetor original
  });
});

describe('Início', () => {
  test('CT05 - começa quem tem a maior carroça', () => {
    const g = new DominoGame({ shuffle: identity });
    expect(g.turn).toBe(1); // [2,2] contra [0,0]
    expect(g.startTile.tile).toEqual([2, 2]);
  });
  test('CT06 - sem carroças, começa a peça de maior soma', () => {
    const g = new DominoGame({ hands: [[[1, 2]], [[3, 5]]], stock: [] });
    expect(g.turn).toBe(1);
  });
  test('CT07 - a primeira jogada precisa ser a peça inicial', () => {
    const g = new DominoGame({ shuffle: identity });
    expect(() => g.play(1, [1, 1])).toThrow('inicial');
    g.play(1, [2, 2]);
    expect(g.board).toEqual([[2, 2]]);
  });
  test('CT08 - jogador errado não pode abrir', () => {
    const g = new DominoGame({ shuffle: identity });
    expect(() => g.play(0, [0, 0])).toThrow('vez');
  });
});

describe('Jogadas', () => {
  let g;
  beforeEach(() => { g = new DominoGame({ shuffle: identity }); g.play(1, [2, 2]); });

  test('CT09 - peça encaixa à esquerda e vira corretamente', () => {
    g.play(0, [0, 2], 'left');
    expect(g.board).toEqual([[0, 2], [2, 2]]);
    expect(g.ends).toEqual([0, 2]);
  });
  test('CT10 - peça encaixa à direita e vira corretamente', () => {
    g.play(0, [0, 2], 'right');
    expect(g.board).toEqual([[2, 2], [2, 0]]);
    expect(g.ends).toEqual([2, 0]);
  });
  test('CT11 - peça que não encaixa é rejeitada', () => {
    expect(() => g.play(0, [0, 3], 'left')).toThrow('encaixa');
  });
  test('CT12 - peça que o jogador não possui é rejeitada', () => {
    expect(() => g.play(0, [1, 2], 'left')).toThrow('não possui');
  });
  test('CT13 - lado inválido é rejeitado', () => {
    expect(() => g.play(0, [0, 2], 'meio')).toThrow('Lado');
  });
  test('CT14 - turno alterna após a jogada', () => {
    g.play(0, [0, 2], 'left');
    expect(g.turn).toBe(1);
    expect(g.hands[0]).toHaveLength(6);
  });
  test('CT15 - playableTiles lista só as peças que encaixam', () => {
    expect(g.playableTiles(0)).toEqual([[0, 2]]);
  });
});

describe('Pontas diferentes', () => {
  // J1 abre com [2,2]; J1 tem [1,2] na mão (encaixa em qualquer ponta que valha 2)
  let g;
  beforeEach(() => { g = new DominoGame({ shuffle: identity }); g.play(1, [2, 2]); });

  test('CT25 - peça que só encaixa na ponta esquerda é jogável e só vale à esquerda', () => {
    g.play(0, [0, 2], 'right');                       // pontas: [2, 0]
    expect(g.ends).toEqual([2, 0]);
    expect(g.playableTiles(1)).toEqual([[1, 2]]);     // [1,2] encaixa só na esquerda (2)
    expect(() => g.play(1, [1, 2], 'right')).toThrow('encaixa');
    g.play(1, [1, 2], 'left');
    expect(g.ends).toEqual([1, 0]);
  });
  test('CT26 - peça que só encaixa na ponta direita é jogável e só vale à direita', () => {
    g.play(0, [0, 2], 'left');                        // pontas: [0, 2]
    expect(g.ends).toEqual([0, 2]);
    expect(g.playableTiles(1)).toEqual([[1, 2]]);     // [1,2] encaixa só na direita (2)
    expect(() => g.play(1, [1, 2], 'left')).toThrow('encaixa');
    g.play(1, [1, 2], 'right');
    expect(g.ends).toEqual([0, 1]);
  });
});

describe('Monte e passe', () => {
  const setup = () => {
    const g = new DominoGame({ hands: [[[3, 4]], [[2, 2], [5, 6]]], stock: [[0, 0], [2, 6]] });
    g.play(1, [2, 2]);
    return g;
  };
  test('CT16 - sem peça jogável o jogador compra do monte', () => {
    const g = setup();
    expect(g.draw(0)).toEqual([0, 0]);
    expect(g.hands[0]).toHaveLength(2);
    expect(g.stock).toHaveLength(1);
  });
  test('CT17 - não pode passar enquanto houver monte', () => {
    expect(() => setup().pass(0)).toThrow('monte');
  });
  test('CT18 - continua comprando até achar peça e então joga', () => {
    const g = setup();
    g.draw(0); g.draw(0);
    expect(g.playableTiles(0)).toEqual([[2, 6]]);
    g.play(0, [2, 6], 'left');
    expect(g.board[0]).toEqual([6, 2]);
  });
  test('CT19 - não pode comprar tendo peça jogável', () => {
    const g = new DominoGame({ shuffle: identity });
    g.play(1, [2, 2]);
    expect(() => g.draw(0)).toThrow('jogável');
  });
  test('CT20 - não pode comprar com monte vazio', () => {
    const g = new DominoGame({ hands: [[[3, 4], [1, 1]], [[2, 2], [2, 5]]], stock: [] });
    g.play(1, [2, 2]);
    expect(() => g.draw(0)).toThrow('Monte vazio');
  });
  test('CT21 - com monte vazio e sem jogada, o jogador passa a vez', () => {
    const g = new DominoGame({ hands: [[[3, 4], [1, 1]], [[2, 2], [2, 5], [2, 6]]], stock: [] });
    g.play(1, [2, 2]);
    g.pass(0);
    expect(g.turn).toBe(1);
  });
});

describe('Fim de partida', () => {
  test('CT22 - vence quem bate (esvazia a mão)', () => {
    const g = new DominoGame({ hands: [[[0, 1]], [[2, 3]]], stock: [] });
    expect(g.play(1, [2, 3])).toBe('won');
    expect(g.winner).toBe(1);
    expect(() => g.play(0, [0, 1])).toThrow('terminou');
  });
  test('CT23 - jogo fechado: vence quem tem menos pontos', () => {
    const g = new DominoGame({ hands: [[[1, 1], [3, 4]], [[2, 2], [5, 6]]], stock: [] });
    g.play(1, [2, 2]);
    expect(g.status).toBe('blocked');
    expect(g.winner).toBe(0); // 9 pontos contra 11
  });
  test('CT24 - jogo fechado com mesma soma é empate', () => {
    const g = new DominoGame({ hands: [[[1, 1], [3, 5]], [[2, 2], [4, 6]]], stock: [] });
    g.play(1, [2, 2]);
    expect(g.status).toBe('blocked');
    expect(g.winner).toBeNull();
    expect(pips([3, 5])).toBe(8);
  });
});


describe('Validações adicionais e orientações', () => {
  test('CT27 - valida distribuição, embaralhador e jogador', () => {
    expect(() => new DominoGame({ hands: [] })).toThrow('duas mãos');
    expect(() => new DominoGame({ hands: [[], []], stock: [] })).toThrow('vazias');
    expect(() => new DominoGame({ shuffle: 3 })).toThrow('shuffle');
    expect(() => new DominoGame({ shuffle: () => [] })).toThrow('28 peças');
    const g = new DominoGame({ shuffle: identity });
    expect(() => g.playableTiles(2)).toThrow('Jogador inválido');
    expect(() => g.draw(2)).toThrow('Jogador inválido');
  });
  test('CT28 - encaixa peças invertidas nos dois lados', () => {
    const left = new DominoGame({ hands: [[[2, 0], [3, 4]], [[2, 2], [0, 0]]], stock: [[6, 6]] });
    left.play(1, [2, 2]);
    left.play(0, [2, 0], 'left');
    expect(left.board[0]).toEqual([0, 2]);
    const right = new DominoGame({ hands: [[[2, 0], [3, 4]], [[2, 2], [0, 0]]], stock: [[6, 6]] });
    right.play(1, [2, 2]);
    right.play(0, [2, 0], 'right');
    expect(right.board[1]).toEqual([2, 0]);
  });
  test('CT29 - no bloqueio vence o jogador com menor pontuação, inclusive J1', () => {
    const g = new DominoGame({ hands: [[[5, 6]], [[2, 2], [0, 0]]], stock: [] });
    g.play(1, [2, 2]);
    expect(g.status).toBe('blocked');
    expect(g.winner).toBe(1);
  });
});


describe('Cobertura de ramos restantes', () => {
  test('CT30 - getters e encaixe antes da abertura', () => {
    const g = new DominoGame({ shuffle: identity });
    expect(g.ends).toBeNull();
    expect(g.playableTiles(g.turn)).toEqual([g.startTile.tile]);
  });
  test('CT31 - rejeita monte e peças malformados', () => {
    expect(() => new DominoGame({ hands: [[[1, 8]], [[2, 2]]], stock: [] })).toThrow('Peça inválida');
    expect(() => new DominoGame({ hands: [[[1, 2]], [[2, 2]]], stock: 'inválido' })).toThrow('stock');
    expect(new DominoGame({ hands: [[[1, 2]], [[2, 2]]], stock: null }).stock).toEqual([]);
    expect(() => new DominoGame({ hands: [[[1, 2]], [[2, 2]]], stock: [[1, 9]] })).toThrow('Peça inválida');
  });
  test('CT32 - mesma peça é reconhecida mesmo invertida', () => {
    const g = new DominoGame({ hands: [[[0, 2], [3, 4]], [[2, 2], [5, 6]]], stock: [[6, 6]] });
    g.play(1, [2, 2]);
    expect(g.playableTiles(0)).toEqual([[0, 2]]);
    g.play(0, [2, 0], 'left');
    expect(g.board[0]).toEqual([0, 2]);
  });
  test('CT33 - não permite passar quando existe peça jogável', () => {
    const g = new DominoGame({ shuffle: identity });
    g.play(1, [2, 2]);
    expect(() => g.pass(0)).toThrow('peça jogável');
  });
});
