/* Navinha Espacial — efeitos em pixel art (sprite sheets gerados com pixelfx, MIT, github.com/patch-gg/pixelfx).
 * Veja assets/fx/LICENSE-pixelfx.txt. Cada efeito é uma imagem com os quadros em grade; o jogo só reproduz. */
'use strict';
const Fx = {
  lista: {
  faisca: { w: 105, h: 63, n: 14, cols: 8, fps: 30 },
  choque: { w: 112, h: 70, n: 27, cols: 8, fps: 30 },
  coleta: { w: 70, h: 78, n: 33, cols: 8, fps: 30 },
  plasma: { w: 202, h: 183, n: 44, cols: 8, fps: 30 },
  implosao: { w: 165, h: 165, n: 46, cols: 8, fps: 30 },
  teleporte: { w: 184, h: 162, n: 45, cols: 8, fps: 15 },
  },
  img: {},
  carregar() {
    for (const nome in this.lista) { const i = new Image(); i.src = 'assets/fx/' + nome + '.png'; this.img[nome] = i; }
  },
  /** Desenha o quadro do efeito `e` ({nome, x, y, esc, t}) centralizado em x,y. */
  desenhar(g, e) {
    const d = this.lista[e.nome], img = this.img[e.nome];
    if (!d || !img || !img.complete || !img.naturalWidth) return;
    const q = Math.min(d.n - 1, Math.floor(e.t)), sw = d.w * e.esc, sh = d.h * e.esc;
    g.drawImage(img, (q % d.cols) * d.w, Math.floor(q / d.cols) * d.h, d.w, d.h, Math.round(e.x - sw / 2), Math.round(e.y - sh / 2), Math.round(sw), Math.round(sh));
  },
};
Fx.carregar();
