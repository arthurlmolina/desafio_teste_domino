const pips = (t) => t[0] + t[1];

function createTiles() {
  const tiles = [];
  for (let a = 0; a <= 6; a++) for (let b = a; b <= 6; b++) tiles.push([a, b]);
  return tiles; // 28 peças
}

function defaultShuffle(arr, rng = Math.random) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const same = (x, y) => (x[0] === y[0] && x[1] === y[1]) || (x[0] === y[1] && x[1] === y[0]);

class DominoGame {
  /**
   * 2 jogadores (0 e 1), 7 peças cada, 14 no monte.
   * shuffle: função de embaralhamento injetável; hands/stock: distribuição fixa (testes).
   */
  constructor({ shuffle = defaultShuffle, hands, stock } = {}) {
    if (typeof shuffle !== 'function') throw new TypeError('shuffle deve ser uma função');
    if (hands !== undefined) {
      if (!Array.isArray(hands) || hands.length !== 2 || hands.some((h) => !Array.isArray(h))) throw new TypeError('hands deve conter duas mãos');
      this.hands = hands.map((h) => h.map((t) => { if (!Array.isArray(t) || t.length !== 2 || t.some((v) => !Number.isInteger(v) || v < 0 || v > 6)) throw new TypeError('Peça inválida'); return t.slice(); }));
      if (stock != null && !Array.isArray(stock)) throw new TypeError('stock deve ser uma lista');
      this.stock = (stock || []).map((t) => { if (!Array.isArray(t) || t.length !== 2 || t.some((v) => !Number.isInteger(v) || v < 0 || v > 6)) throw new TypeError('Peça inválida'); return t.slice(); });
    } else {
      const t = shuffle(createTiles());
      if (!Array.isArray(t) || t.length !== 28) throw new Error('shuffle deve retornar as 28 peças');
      this.hands = [t.slice(0, 7), t.slice(7, 14)];
      this.stock = t.slice(14);
    }
    this.board = [];
    this.status = 'playing'; // playing | won | blocked
    this.winner = null;      // 0, 1 ou null (empate/ainda jogando)
    this.startTile = this._pickStarter();
    if (!this.startTile) throw new Error('As mãos não podem estar vazias');
    this.turn = this.startTile.player;
  }

  _pickStarter() {
    let best = null;
    this.hands.forEach((h, player) =>
      h.forEach((tile) => {
        const score = tile[0] === tile[1] ? 100 + tile[0] : pips(tile) * 2 + Math.max(...tile) / 10;
        if (!best || score > best.score) best = { player, tile, score };
      })
    );
    return best;
  }

  get ends() {
    if (!this.board.length) return null;
    return [this.board[0][0], this.board[this.board.length - 1][1]];
  }

  _fits(tile) {
    if (!this.board.length) return same(tile, this.startTile.tile);
    return tile.includes(this.ends[0]) || tile.includes(this.ends[1]);
  }

  playableTiles(player) {
    if (player !== 0 && player !== 1) throw new RangeError('Jogador inválido');
    return this.hands[player].filter((t) => this._fits(t));
  }

  _assertTurn(player) {
    if (player !== 0 && player !== 1) throw new RangeError('Jogador inválido');
    if (this.status !== 'playing') throw new Error('A partida já terminou');
    if (player !== this.turn) throw new Error('Não é a vez do jogador ' + player);
  }

  play(player, tile, side = 'right') {
    this._assertTurn(player);
    const idx = this.hands[player].findIndex((t) => same(t, tile));
    if (idx < 0) throw new Error('Jogador não possui essa peça');
    const own = this.hands[player][idx];
    if (!this.board.length) {
      if (!same(own, this.startTile.tile)) throw new Error('A primeira jogada deve ser a peça inicial');
      this.board.push(own.slice());
    } else {
      if (side !== 'left' && side !== 'right') throw new Error('Lado deve ser left ou right');
      const end = side === 'left' ? this.ends[0] : this.ends[1];
      if (!own.includes(end)) throw new Error('Peça não encaixa nesse lado');
      if (side === 'left') this.board.unshift(own[1] === end ? own.slice() : [own[1], own[0]]);
      else this.board.push(own[0] === end ? own.slice() : [own[1], own[0]]);
    }
    this.hands[player].splice(idx, 1);
    if (this.hands[player].length === 0) {
      this.status = 'won';
      this.winner = player;
      return this.status;
    }
    this.turn = 1 - player;
    this._checkBlocked();
    return this.status;
  }

  draw(player) {
    this._assertTurn(player);
    if (this.playableTiles(player).length) throw new Error('Jogador possui peça jogável');
    if (!this.stock.length) throw new Error('Monte vazio');
    const t = this.stock.shift();
    this.hands[player].push(t);
    return t;
  }

  pass(player) {
    this._assertTurn(player);
    if (this.playableTiles(player).length) throw new Error('Jogador possui peça jogável');
    if (this.stock.length) throw new Error('Só pode passar com o monte vazio');
    this.turn = 1 - player;
    this._checkBlocked();
    return this.status;
  }

  _checkBlocked() {
    if (this.stock.length) return;
    if (this.playableTiles(0).length || this.playableTiles(1).length) return;
    this.status = 'blocked';
    const p = this.hands.map((h) => h.reduce((s, t) => s + pips(t), 0));
    this.winner = p[0] === p[1] ? null : p[0] < p[1] ? 0 : 1;
  }
}

module.exports = { createTiles, defaultShuffle, DominoGame, pips };
