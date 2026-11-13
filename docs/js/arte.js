/* Navinha Espacial — arte em pixel art gerada por código.
 * Cada sprite é desenhado com formas simples numa tela pequena; depois o sistema
 * espelha (naves simétricas), recorta a transparência, aplica luz/sombra e contorno.
 * Assim todo o jogo tem o mesmo estilo e as peças da garagem aparecem na nave. */
'use strict';

const Arte = (() => {
  const cache = new Map();
  const tela = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

  // ---------------------------------------------------------------- cores
  function hexRgb(h) { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  function mistura(c, f) {   // f > 0 clareia, f < 0 escurece
    return c.map(v => Math.round(f > 0 ? v + (255 - v) * f : v * (1 + f)));
  }

  // ---------------------------------------------------------------- pincel de pixel art
  function pincel(g) {
    g.imageSmoothingEnabled = false;
    return {
      g,
      ret(x, y, w, h, cor) { g.fillStyle = cor; g.fillRect(x, y, w, h); },
      pix(x, y, cor) { g.fillStyle = cor; g.fillRect(x, y, 1, 1); },
      elipse(cx, cy, rx, ry, cor) { g.fillStyle = cor; g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); g.fill(); },
      poli(pts, cor) { g.fillStyle = cor; g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.fill(); },
      linha(x1, y1, x2, y2, cor, l = 1) { g.strokeStyle = cor; g.lineWidth = l; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); },
    };
  }

  /**
   * Cria um sprite: desenha(p) recebe o pincel. Com espelhar, desenhe só a metade de cima
   * (y < h/2) e ela é refletida para baixo. Depois: recorte do alfa, luz em cima, sombra
   * embaixo e contorno escuro em volta.
   */
  function pixelar(w, h, desenha, { espelhar = true, contorno = '#120a1a', luz = 0.28, sombra = -0.32, escala = 2, volume = 0 } = {}) {
    const c = tela(w, h), g = c.getContext('2d');
    desenha(pincel(g));
    if (espelhar) {
      const meio = Math.floor(h / 2);
      g.save(); g.translate(0, h); g.scale(1, -1);
      g.drawImage(c, 0, 0, w, meio, 0, 0, w, meio);
      g.restore();
    }
    const d = g.getImageData(0, 0, w, h), p = d.data, cheio = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) { if (p[i * 4 + 3] >= 110) { cheio[i] = 1; p[i * 4 + 3] = 255; } else p[i * 4 + 3] = 0; }
    const original = new Uint8ClampedArray(p);
    const vazio = (x, y) => x < 0 || y < 0 || x >= w || y >= h || !cheio[y * w + x];
    const ct = hexRgb(contorno);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x, o = i * 4;
      if (cheio[i]) {
        const cor = [original[o], original[o + 1], original[o + 2]];
        let f = volume ? volume * (h / 2 - y - 0.5) / (h / 2) : 0;       // volume: claro em cima, escuro embaixo
        if (vazio(x, y - 1)) f += luz; else if (vazio(x, y + 1)) f += sombra;
        else if (volume && vazio(x, y - 2)) f += luz * 0.4;
        if (f) { const m = mistura(cor, f); p[o] = m[0]; p[o + 1] = m[1]; p[o + 2] = m[2]; }
      } else if (contorno && (!vazio(x - 1, y) || !vazio(x + 1, y) || !vazio(x, y - 1) || !vazio(x, y + 1))) {
        p[o] = ct[0]; p[o + 1] = ct[1]; p[o + 2] = ct[2]; p[o + 3] = 255;
      }
    }
    g.putImageData(d, 0, 0);
    if (escala === 1) return c;
    const s = tela(w * escala, h * escala), gs = s.getContext('2d');
    gs.imageSmoothingEnabled = false; gs.drawImage(c, 0, 0, w * escala, h * escala);
    return s;
  }
  function memo(chave, f) { if (!cache.has(chave)) cache.set(chave, f()); return cache.get(chave); }
  /** Amplia um sprite sem suavizar (para telas como a garagem). */
  function ampliar(src, fator) {
    return memo(`amp:${src.__id || (src.__id = Math.random())}:${fator}`, () => {
      const c = tela(Math.round(src.width * fator), Math.round(src.height * fator)), g = c.getContext('2d');
      g.imageSmoothingEnabled = false; g.drawImage(src, 0, 0, c.width, c.height); return c;
    });
  }
  function branco(src) {
    return memo(`branco:${src.__id || (src.__id = Math.random())}`, () => {
      const c = tela(src.width, src.height), g = c.getContext('2d');
      g.drawImage(src, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); return c;
    });
  }
  function apagado(src) {
    return memo(`apagado:${src.__id || (src.__id = Math.random())}`, () => {
      const c = tela(src.width, src.height), g = c.getContext('2d');
      g.drawImage(src, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = 'rgba(30,32,48,.92)'; g.fillRect(0, 0, c.width, c.height); return c;
    });
  }

  // ================================================================ NAVES DO JOGADOR
  // Vista de cima, bico para a direita. Grade de 44 x 22 (escala 2 = 88 x 44); desenhe só as linhas 0 a 10 (o resto é espelhado).
  // Cada nave define: casco (desenho), pontos de canhão, pontos de blindagem, núcleo e motores.
  const NW = 44, NH = 22, CY = 11;
  const tom = (hex, f) => { const m = mistura(hexRgb(hex), f); return `rgb(${m[0]},${m[1]},${m[2]})`; };
  const cabine = (p, x, rx, ry, cor) => { p.elipse(x, CY, rx, ry, tom(cor, -0.45)); p.elipse(x, CY, rx - 0.8, ry - 0.6, cor); p.ret(Math.round(x - rx * 0.4), Math.round(CY - ry * 0.75), Math.max(2, Math.round(rx * 0.6)), 1, '#ffffff'); };
  const rebites = (p, x1, x2, y, passo, cor) => { for (let x = x1; x <= x2; x += passo) p.pix(x, y, cor); };
  const NAVES_ARTE = {
    FALCAO: {
      cor: '#e8483a', cor2: '#f0a03a', vidro: '#59e3e0', metal: '#8b93a6',
      casco(p, c) {
        const esc = tom(c.cor, -0.4);
        p.ret(3, 7, 7, 3, c.metal); p.ret(3, 7, 1, 3, '#20182a');                                 // motores
        p.poli([[9, 8], [5, 3], [3, 3], [4, 8]], c.cor); p.ret(3, 3, 3, 1, c.cor2);                 // leme
        p.poli([[6, 11], [6, 8], [11, 7], [30, 7], [38, 9], [43, 11]], c.cor);                       // fuselagem
        p.poli([[37, 9], [43, 11], [37, 11]], esc);                                                 // bico
        p.poli([[28, 8], [17, 1], [12, 1], [13, 3], [11, 8]], c.cor);                               // asa enflechada
        p.poli([[13, 2], [17, 2], [20, 4], [15, 4]], c.cor2); p.ret(12, 1, 3, 1, '#ffe36a');       // faixa e luz da ponta
        p.poli([[34, 9], [31, 5], [29, 5], [30, 9]], c.cor2);                                       // canard
        p.ret(24, 8, 3, 2, '#2a2030'); p.ret(15, 8, 1, 3, esc); p.ret(21, 8, 1, 2, esc);           // entrada de ar e painéis
        rebites(p, 14, 26, 6, 4, tom(c.cor, 0.35));
        cabine(p, 32, 4.8, 2.4, c.vidro);
      },
      canhoes: [[40, 11], [22, 4]], motores: [[3, 8]], placas: [[16, 4, 6, 2], [17, 8, 6, 1]], nucleo: [21, 10],
    },
    COMETA: {
      cor: '#3a8ef0', cor2: '#d6efff', vidro: '#ffe36a', metal: '#7d8aa8',
      casco(p, c) {
        const esc = tom(c.cor, -0.45);
        p.ret(2, 8, 6, 2, c.metal); p.ret(2, 8, 1, 2, '#20182a');
        p.poli([[8, 9], [5, 5], [4, 5], [5, 9]], c.cor2);
        p.poli([[4, 11], [5, 9], [12, 8], [32, 8], [41, 10], [43, 11]], c.cor);
        p.poli([[24, 9], [12, 2], [9, 2], [10, 9]], c.cor);                                         // asa delta
        p.poli([[10, 3], [12, 3], [18, 7], [13, 7]], c.cor2);
        p.ret(9, 2, 2, 1, '#ff5a5a');
        p.ret(33, 9, 7, 1, c.cor2); p.ret(16, 9, 1, 2, esc); p.ret(26, 9, 1, 2, esc);
        cabine(p, 29, 5, 1.9, c.vidro);
      },
      canhoes: [[41, 11], [13, 3]], motores: [[2, 9]], placas: [[14, 6, 4, 1], [20, 9, 5, 1]], nucleo: [21, 10],
    },
    TITA: {
      cor: '#4aa84a', cor2: '#2e6b33', vidro: '#9ff2ff', metal: '#a0a8b0',
      casco(p, c) {
        const esc = tom(c.cor, -0.45);
        p.ret(1, 5, 6, 3, c.metal); p.ret(1, 8, 5, 2, c.metal); p.ret(1, 5, 1, 5, '#20182a');     // motores duplos
        p.poli([[4, 11], [4, 5], [9, 4], [30, 4], [36, 7], [39, 11]], c.cor);
        p.ret(11, 0, 12, 4, c.cor2); p.ret(12, 1, 10, 1, c.cor); p.ret(11, 0, 2, 1, '#ffd24a');   // blindagem lateral
        rebites(p, 13, 21, 3, 4, '#c8ced9'); rebites(p, 10, 30, 6, 5, tom(c.cor, 0.35));
        p.ret(36, 8, 3, 3, c.metal); p.ret(9, 8, 10, 1, c.cor2);
        p.ret(20, 5, 1, 6, esc); p.ret(27, 5, 1, 6, esc);
        cabine(p, 32, 3.8, 2.4, c.vidro);
      },
      canhoes: [[37, 11], [22, 2]], motores: [[1, 6], [1, 9]], placas: [[10, 6, 8, 2], [23, 6, 3, 2]], nucleo: [25, 10],
    },
    FANTASMA: {
      cor: '#9a4ee0', cor2: '#d9b3ff', vidro: '#ff7ad9', metal: '#5c4f78',
      casco(p, c) {
        p.ret(3, 8, 4, 2, c.metal);
        p.poli([[4, 11], [12, 1], [16, 1], [24, 7], [40, 10], [42, 11]], c.cor);                    // asa voadora
        p.poli([[13, 3], [16, 3], [20, 7], [14, 7]], c.cor2);
        for (let x = 6; x <= 10; x += 2) p.pix(x, 8 - Math.floor((x - 4) / 2), tom(c.cor, -0.45)); // bordas serrilhadas
        p.ret(18, 9, 15, 1, '#ff7ad9'); p.ret(12, 1, 2, 1, '#ff7ad9');                               // linhas de luz
        cabine(p, 31, 4.6, 1.7, c.vidro);
      },
      canhoes: [[40, 11], [15, 3]], motores: [[3, 9]], placas: [[14, 4, 3, 2], [22, 8, 5, 1]], nucleo: [19, 10],
    },
    VESPA: {
      cor: '#f2c230', cor2: '#2a2230', vidro: '#7af5ff', metal: '#8c8c99',
      casco(p, c) {
        p.elipse(13, 11, 9, 5, c.cor);                                                              // abdômen
        for (const x of [8, 12, 16]) p.ret(x, 6, 2, 5, c.cor2);
        p.poli([[22, 8], [17, 0], [28, 0], [26, 8]], 'rgba(205,240,255,.95)'); p.ret(20, 2, 6, 1, '#9fdcef'); p.ret(21, 5, 4, 1, '#9fdcef');  // asas
        p.elipse(27, 11, 6, 3.8, c.cor); p.ret(25, 8, 1, 3, c.cor2);                                // tórax
        p.elipse(35, 11, 4, 3, c.cor2);                                                             // cabeça
        p.elipse(14, 3, 3, 1.8, c.cor); p.ret(12, 3, 1, 1, c.cor2);                                // casulo de drone
        cabine(p, 36, 2.6, 2.2, c.vidro);
      },
      canhoes: [[39, 11], [14, 3]], motores: [[4, 9]], placas: [[24, 8, 4, 1], [10, 4, 3, 1]], nucleo: [29, 10],
    },
    MARTELO: {
      cor: '#7e8797', cor2: '#ff8a2a', vidro: '#ffd25a', metal: '#4d5463',
      casco(p, c) {
        p.ret(1, 6, 6, 5, c.metal); p.ret(1, 6, 1, 5, '#20182a');
        p.ret(5, 7, 24, 4, c.cor);
        p.poli([[14, 7], [10, 2], [8, 2], [9, 7]], c.cor); p.ret(8, 2, 2, 1, c.cor2);
        p.poli([[28, 11], [28, 2], [33, 1], [39, 3], [39, 11]], c.cor);                              // cabeça de martelo
        p.ret(30, 2, 7, 2, c.cor2); for (let x = 30; x < 37; x += 2) p.pix(x, 3, '#2a2030');        // faixa de aviso
        for (const x of [9, 15, 21]) { p.ret(x, 6, 2, 5, c.metal); p.ret(x, 8, 2, 1, c.cor2); }
        rebites(p, 29, 38, 6, 3, '#c8ced9');
        cabine(p, 25, 2.8, 1.7, c.vidro);
      },
      canhoes: [[39, 10], [39, 4]], motores: [[1, 8]], placas: [[30, 5, 7, 1], [6, 7, 2, 1]], nucleo: [19, 10],
    },
    AURORA: {
      cor: '#e9f4ff', cor2: '#2ed1b5', vidro: '#1b8f7c', metal: '#9fb2c8',
      casco(p, c) {
        p.ret(4, 8, 5, 2, c.metal);
        p.elipse(22, 11, 16, 4.6, c.cor);
        p.poli([[14, 7], [18, 1], [27, 1], [29, 7]], c.cor2); p.poli([[19, 3], [25, 3], [26, 5], [18, 5]], tom(c.cor2, 0.55));  // anel
        p.ret(8, 9, 26, 1, c.cor2); p.ret(17, 1, 2, 1, '#ffffff');
        rebites(p, 11, 33, 8, 4, tom(c.cor2, -0.2));
        cabine(p, 33, 4, 2.1, c.vidro);
      },
      canhoes: [[38, 11], [26, 2]], motores: [[4, 8]], placas: [[18, 6, 6, 1], [21, 4, 3, 1]], nucleo: [23, 10],
    },
    RELAMPAGO: {
      cor: '#3d3dbf', cor2: '#5ff0ff', vidro: '#fff36a', metal: '#6a6aa0',
      casco(p, c) {
        p.ret(3, 8, 4, 2, c.metal);
        p.poli([[6, 8], [4, 3], [6, 3], [9, 8]], c.cor2);
        p.poli([[4, 11], [6, 8], [16, 7], [34, 8], [42, 11]], c.cor);
        p.poli([[14, 8], [26, 0], [29, 0], [22, 8]], c.cor);                                        // asa para a frente
        p.poli([[24, 2], [27, 1], [25, 4], [27, 4], [22, 7], [23, 5], [21, 5]], c.cor2);            // raio na asa
        p.ret(26, 0, 2, 1, '#fff36a'); p.ret(13, 9, 1, 2, tom(c.cor, -0.45)); p.ret(28, 9, 1, 2, tom(c.cor, -0.45));
        cabine(p, 33, 4.2, 1.7, c.vidro);
      },
      canhoes: [[41, 11], [27, 1]], motores: [[3, 9]], placas: [[10, 7, 5, 1], [24, 5, 2, 1]], nucleo: [19, 10],
    },
    LANCA: {   // Lança Reacender: montada nos Estaleiros de Pharsis, com a luz de Oruvai no núcleo
      cor: '#ece4cc', cor2: '#ffcf5a', vidro: '#ff9a4a', metal: '#8b93a6',
      casco(p, c) {
        p.ret(1, 8, 5, 3, c.metal); p.ret(1, 8, 1, 3, '#20182a');
        p.poli([[3, 11], [4, 9], [20, 8], [36, 9], [43, 11]], c.cor);                               // espinha da lança
        p.poli([[33, 9], [43, 11], [33, 11]], c.cor2);                                              // ponta dourada
        p.poli([[18, 8], [11, 1], [9, 1], [12, 8]], c.cor); p.poli([[11, 2], [12, 2], [15, 6], [13, 6]], c.cor2);
        p.poli([[27, 8], [23, 4], [21, 4], [23, 8]], c.cor2);
        p.elipse(16, 11, 3.2, 2.6, '#2a6a8a'); p.elipse(16, 11, 2.3, 1.8, '#7af5ff'); p.pix(15, 9, '#ffffff');  // núcleo com a luz de Oruvai
        rebites(p, 22, 34, 9, 4, tom(c.cor2, -0.3));
        cabine(p, 29, 3.6, 1.6, c.vidro);
      },
      canhoes: [[42, 11], [12, 3]], motores: [[1, 9]], placas: [[20, 6, 4, 1], [13, 4, 2, 1]], nucleo: [22, 10],
    },
  };

  /**
   * Nave com as peças equipadas. pecas = { canhao, motor, blindagem, nucleo, modulo } de 1 a 5.
   * quadro anima a chama do motor (3 quadros). Retorna { img, cx, cy } (cx/cy = centro do casco no sprite).
   */
  function nave(id, pecas = {}, quadro = 0) {
    const pc = Object.assign({ canhao: 1, motor: 1, blindagem: 1, nucleo: 1, modulo: 1 }, pecas);
    const chave = `nave:${id}:${pc.canhao}${pc.motor}${pc.blindagem}${pc.nucleo}${pc.modulo}:${quadro % 3}`;
    return memo(chave, () => {
      const a = NAVES_ARTE[id] || NAVES_ARTE.FALCAO;
      const motorCor = ['#ffd24a', '#ffb02e', '#ff7b2e', '#7ad7ff', '#c08bff'][pc.motor - 1];
      const nucleoCor = ['#7a7f99', '#59e3e0', '#7aff9e', '#ffd24a', '#ff5ad1'][pc.nucleo - 1];
      const img = pixelar(NW, NH, p => {
        a.casco(p, a);
        // canhões: crescem com o nível
        const comp = 2 + pc.canhao, esp = pc.canhao >= 4 ? 2 : 1;
        a.canhoes.forEach(([x, y], i) => {
          const len = i === 0 ? comp : Math.max(2, comp - 1);
          if (i > 0 && pc.canhao < 2) return;                         // canhão da asa aparece no nível 2
          const yy = Math.min(y, CY - esp);
          p.ret(x - 2, yy, len + 2, esp, a.metal); p.ret(x - 2, yy, 2, esp, '#3a3f50');
          if (pc.canhao >= 3) p.ret(x + len - 1, yy, 1, esp, '#ffcf5a');   // boca do canhão
        });
        if (pc.blindagem >= 2) a.placas.slice(0, pc.blindagem >= 4 ? 2 : 1).forEach(([x, y, w, h]) => { p.ret(x, y, w, h, '#c8ced9'); p.ret(x, y + h - 1, w, 1, '#8a92a6'); });
        if (pc.nucleo >= 2) { p.ret(a.nucleo[0], a.nucleo[1], pc.nucleo >= 4 ? 3 : 2, 1, nucleoCor); p.pix(a.nucleo[0], a.nucleo[1] - 1, nucleoCor); }
        if (pc.modulo >= 2) { p.ret(a.nucleo[0] - 4, 4, 1, 4, a.metal); p.ret(a.nucleo[0] - 5, 3, 3, 1, '#ff5050'); }
        if (pc.modulo >= 4) p.ret(a.nucleo[0] - 8, 6, 3, 2, '#5ff0ff');
      }, { escala: 1, volume: 0.22 });
      // chamas do motor (fora do contorno): 3 quadros, ficam maiores e mais quentes com o motor
      const g = img.getContext('2d'), q = quadro % 3, tam = 3 + pc.motor + [0, 2, 1][q];
      a.motores.forEach(([x, y]) => {
        for (const yy of [y, NH - 1 - y]) {
          if (yy === NH - 1 - y && y === CY - 1) continue;
          g.fillStyle = motorCor; g.fillRect(x - tam, yy, tam, 1);
          g.fillStyle = '#fff6c8'; g.fillRect(x - Math.ceil(tam / 2), yy, Math.ceil(tam / 2), 1);
          g.fillStyle = motorCor; g.globalAlpha = 0.6; g.fillRect(x - tam + 3, yy + (yy < CY ? -1 : 1), Math.max(1, tam - 4), 1); g.globalAlpha = 1;
          if (q === 1) { g.fillStyle = '#ffffff'; g.fillRect(x - tam - 2, yy, 1, 1); }
        }
      });
      const s = tela(NW * 2, NH * 2), gs = s.getContext('2d');
      gs.imageSmoothingEnabled = false; gs.drawImage(img, 0, 0, NW * 2, NH * 2);
      return { img: s, cx: 23 * 2, cy: CY * 2 };
    });
  }

  // ================================================================ VEÍCULOS BÔNUS (aliados da história)
  const VEICULOS_ARTE = {
    CARGUEIRO: [40, 20, (p, q) => {   // cargueiro do Gorvan: caixas de carga, cabine e faixa amarela
      p.ret(2, 4, 4, 6, '#6b7385'); p.ret(1, 5, 1, 4, '#20182a');
      p.ret(5, 3, 26, 7, '#f2c230'); p.ret(5, 9, 26, 1, '#2a2230');
      for (let x = 7; x < 29; x += 7) { p.ret(x, 4, 5, 4, '#b07a20'); p.ret(x + 1, 5, 3, 1, '#d8a040'); }
      p.poli([[30, 3], [36, 6], [38, 10], [30, 10]], '#f2c230'); p.elipse(34, 9, 2.6, 1.6, '#7af5ff'); p.ret(33, 8, 2, 1, '#ffffff');
      p.ret(10, 1, 14, 2, '#8c8c99'); p.ret(16, 0, 2, 1, '#ff5050');
    }],
    BROCA: [42, 18, (p, q) => {     // broca da Madre Tzalenka: máquina de mineração com broca giratória
      p.ret(2, 3, 6, 6, '#6b7385'); p.ret(1, 4, 1, 4, '#20182a');
      p.ret(7, 2, 18, 7, '#2e6b33'); p.ret(8, 3, 16, 1, '#4aa84a'); p.ret(12, 5, 6, 3, '#9ff2ff');
      p.ret(10, 0, 4, 2, '#ffd24a');
      p.poli([[25, 1], [41, 9], [25, 9]], '#a0a8b0');
      for (let x = 26 + (q % 2) * 2; x < 39; x += 4) p.poli([[x, 2 + (x - 25) * 0.45], [x + 2, 3 + (x - 25) * 0.45], [x + 1, 9], [x - 1, 9]], '#5c6270');
    }],
    CAPITANIA: [56, 26, (p, q) => {  // capitânia do Almirante Eskarion: preta e carmesim com borda dourada
      p.ret(3, 6, 7, 7, '#4d5463'); p.ret(2, 7, 1, 5, '#20182a');
      p.poli([[8, 13], [8, 6], [16, 3], [40, 3], [50, 8], [55, 13]], '#2a1a22');
      p.poli([[14, 6], [20, 0], [34, 0], [38, 6]], '#8a1a2a'); p.ret(20, 0, 14, 1, '#ffcf5a');
      p.ret(10, 9, 38, 1, '#ffcf5a'); for (let x = 14; x < 46; x += 6) p.ret(x, 6, 3, 2, '#ff5a3a');
      p.elipse(45, 12, 4, 2, '#ffcf5a'); p.ret(44, 11, 2, 1, '#ffffff');
    }],
  };
  function veiculo(id, quadro = 0) { return memo(`veic:${id}:${quadro % 2}`, () => { const [w, h, f] = VEICULOS_ARTE[id]; return pixelar(w, h, p => f(p, quadro % 2), { escala: 2, volume: 0.2 }); }); }

  // ================================================================ INIMIGOS (olham para a esquerda)
  const INIMIGOS_ARTE = {
    BASICO: [20, 14, p => {   // disco voador
      p.elipse(10, 7, 9, 3, '#3fbfa8'); p.elipse(10, 4.5, 4, 3, '#a8f0ff'); p.ret(3, 6, 14, 1, '#1d7f73');
      p.pix(5, 6, '#ffe36a'); p.pix(10, 6, '#ffe36a'); p.pix(15, 6, '#ffe36a');
    }, false],
    ZIGUE: [20, 14, p => {    // arraia
      p.poli([[1, 7], [9, 2], [12, 0], [12, 3], [19, 7]], '#f2c230'); p.ret(6, 5, 8, 2, '#c4881a'); p.elipse(6, 6, 2, 1, '#ff5a5a');
    }],
    ATIRADOR: [22, 14, p => { // nave de canhão
      p.poli([[4, 7], [8, 3], [18, 3], [21, 7]], '#d8424a'); p.ret(0, 6, 6, 1, '#8b93a6'); p.ret(12, 0, 5, 3, '#9a2a32');
      p.elipse(9, 6, 2.5, 1.2, '#ffd24a');
    }],
    KAMIKAZE: [18, 12, p => {
      p.poli([[0, 6], [8, 1], [12, 2], [17, 6]], '#ff7a2a'); p.poli([[4, 6], [8, 3], [10, 6]], '#ffe066'); p.ret(15, 5, 3, 1, '#ff4040');
    }],
    TANQUE: [34, 24, p => {   // encouraçado
      p.poli([[2, 12], [6, 6], [28, 5], [33, 12]], '#7a4ec0'); p.ret(10, 1, 14, 5, '#5a3596'); p.ret(12, 2, 10, 2, '#9b78e0');
      p.ret(0, 10, 7, 2, '#8b93a6'); p.ret(13, 8, 8, 2, '#2a1f45'); p.elipse(8, 9, 2.4, 1.4, '#ffd24a');
    }],
    MINA: [16, 16, p => {
      p.elipse(8, 8, 5, 5, '#c0303a'); p.ret(7, 0, 2, 4, '#8b93a6'); p.ret(0, 7, 4, 2, '#8b93a6'); p.ret(12, 7, 4, 2, '#8b93a6');
      p.pix(2, 2, '#8b93a6'); p.pix(13, 2, '#8b93a6'); p.ret(7, 6, 2, 2, '#ffe36a');
    }],
    ESCUDEIRO: [22, 18, p => {
      p.poli([[3, 9], [7, 2], [15, 2], [19, 9]], '#3a7ae0'); p.ret(8, 4, 6, 3, '#9fd0ff'); p.ret(0, 8, 4, 1, '#7af5ff'); p.elipse(11, 8, 2, 1.2, '#ffffff');
    }],
    TELEPORTE: [18, 18, p => {
      p.poli([[9, 0], [17, 9], [1, 9]], '#c43ad8'); p.elipse(9, 8, 3.5, 2.2, '#ffe9ff'); p.elipse(8, 8, 1.4, 1.4, '#3a0a40');
    }],
    ENXAME: [12, 10, p => {
      p.elipse(6, 5, 5, 2.5, '#5ad85a'); p.ret(4, 1, 4, 3, 'rgba(220,255,220,.95)'); p.pix(2, 4, '#ff3a3a');
    }],
    TORRE: [20, 18, p => {    // torre (fica presa na borda)
      p.ret(2, 12, 16, 6, '#6b7385'); p.ret(4, 7, 12, 6, '#8b93a6'); p.elipse(10, 7, 4, 3, '#a8b0c0'); p.ret(0, 6, 8, 2, '#4d5463'); p.pix(10, 6, '#ff5050');
    }, false],
    LASER: [28, 14, p => {
      p.poli([[5, 7], [10, 3], [24, 3], [27, 7]], '#e9eef7'); p.ret(0, 6, 7, 1, '#5ff0ff'); p.ret(14, 0, 6, 3, '#8b93a6'); p.elipse(12, 6, 2.4, 1.2, '#5ff0ff');
    }],
  };
  function inimigo(id, escala = 2) {
    return memo(`ini:${id}:${escala}`, () => {
      const [w, h, f, esp] = INIMIGOS_ARTE[id];
      return pixelar(w, h, f, { escala, espelhar: esp !== false });
    });
  }
  function asteroide(variante, tam) {
    return memo(`ast:${variante}:${tam}`, () => {
      let s = variante * 7919 + 13;
      const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
      const n = 18, img = pixelar(n, n, p => {
        const pts = [];
        for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2, rr = 6 + r() * 2.6; pts.push([9 + Math.cos(a) * rr, 9 + Math.sin(a) * rr]); }
        p.poli(pts, '#6d6470');
        for (let i = 0; i < 3; i++) p.elipse(5 + r() * 8, 5 + r() * 8, 1.5, 1.2, '#4a424f');
        p.elipse(7, 6, 2, 1.2, '#8f8592');
      }, { espelhar: false, escala: 1 });
      const c = tela(tam, tam), g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(img, 0, 0, tam, tam); return c;
    });
  }

  // ================================================================ CHEFES
  // Cada chefe: corpo grande (escala 3) + partes destrutíveis desenhadas à parte.
  // forma 1, 2, 3 = mudanças conforme perde vida (rachaduras, núcleo exposto).
  function racha(p, w, h, forma) {
    if (forma < 2) return;
    let s = 99;
    const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    for (let i = 0; i < 4 + forma * 2; i++) {
      let x = 6 + r() * (w - 12), y = 3 + r() * (h / 2 - 5);
      for (let k = 0; k < 4; k++) { p.pix(Math.floor(x), Math.floor(y), '#1a0e14'); x += r() > 0.5 ? 1 : -1; y += 1; }
    }
  }
  const nucleoForma = f => ['#59e3e0', '#ffb02e', '#ff3a3a'][f - 1];
  const CHEFES_ARTE = {
    OMEGA: { w: 52, h: 34, desenha(p, f) {
      p.elipse(26, 17, 25, 8, '#3fbfa8'); p.elipse(26, 12, 13, 8, '#a8f0ff'); p.ret(4, 15, 44, 2, '#1d7f73');
      for (let x = 8; x < 46; x += 6) p.ret(x, 15, 2, 2, '#ffe36a');
      p.elipse(26, 12, 5, 4, nucleoForma(f)); racha(p, 52, 34, f);
    } },
    DEVORADOR: { w: 54, h: 38, desenha(p, f) {
      p.poli([[2, 19], [10, 5], [30, 1], [50, 6], [53, 19]], '#7a6450'); p.poli([[2, 19], [12, 12], [20, 19]], '#2a1410');
      for (let x = 6; x < 18; x += 3) p.poli([[x, 15], [x + 1, 19], [x + 2, 15]], '#f0e6d0');
      p.elipse(30, 10, 4, 3, nucleoForma(f)); p.elipse(40, 9, 5, 3, '#5a4a3c'); p.elipse(22, 6, 4, 2, '#9a8470'); racha(p, 54, 38, f);
    } },
    RAINHA: { w: 54, h: 40, desenha(p, f) {
      p.elipse(30, 20, 18, 7, '#c8304a'); p.elipse(14, 19, 9, 5, '#e04a64'); p.poli([[22, 14], [34, 1], [44, 3], [36, 14]], 'rgba(255,190,210,.95)');
      p.ret(0, 18, 7, 2, '#ffd24a'); p.elipse(12, 17, 2.5, 2, nucleoForma(f)); for (let x = 22; x < 44; x += 5) p.ret(x, 16, 2, 4, '#7a1428'); racha(p, 54, 40, f);
    } },
    SENTINELA: { w: 56, h: 42, desenha(p, f) {
      p.ret(6, 6, 46, 15, '#5a4a8a'); p.ret(2, 12, 8, 9, '#3a2f60'); p.ret(46, 2, 10, 19, '#3a2f60');
      p.ret(10, 9, 34, 3, '#8a7ac0'); p.ret(14, 15, 26, 6, '#241c40'); p.elipse(26, 18, 4, 3, nucleoForma(f));
      for (let x = 12; x < 44; x += 8) p.ret(x, 6, 4, 2, '#ff5050'); racha(p, 56, 42, f);
    } },
    ZORG: { w: 64, h: 46, desenha(p, f) {
      p.poli([[2, 23], [12, 10], [40, 4], [60, 8], [63, 23]], '#d4a62a'); p.poli([[16, 10], [30, 0], [44, 0], [40, 6]], '#a07a14');
      p.ret(8, 17, 50, 3, '#6a4a10'); p.ret(0, 21, 10, 2, '#ff5050'); p.elipse(24, 16, 6, 4, nucleoForma(f));
      for (let x = 32; x < 58; x += 6) p.ret(x, 12, 3, 2, '#fff3a0'); racha(p, 64, 46, f);
    } },
    ULTHAR: { w: 70, h: 50, desenha(p, f) {   // Ulthar-Vey, a Fome: um olho no meio de uma massa de vazio com tentáculos
      p.elipse(40, 25, 29, 15, '#2a1240'); p.elipse(44, 22, 20, 9, '#3e1a5e');
      for (let x = 22; x < 64; x += 7) p.poli([[x, 14], [x + 3, 1 + (x % 3)], [x + 6, 13]], '#5a2a80');
      p.poli([[14, 22], [2, 12], [8, 19], [0, 24]], '#4a1e6a'); p.poli([[18, 16], [8, 4], [14, 13]], '#4a1e6a');
      for (let x = 36; x < 64; x += 9) p.ret(x, 18, 6, 1, '#ffcf5a');
      p.elipse(28, 25, 10, 7, '#efe2ff'); p.elipse(27, 25, 5, 6, nucleoForma(f)); p.elipse(26, 25, 1.6, 4, '#0a0012');
      racha(p, 70, 50, f);
    } },
  };
  function chefe(id, forma = 1) {
    return memo(`chefe:${id}:${forma}`, () => { const a = CHEFES_ARTE[id]; return pixelar(a.w, a.h, p => a.desenha(p, forma), { escala: 3 }); });
  }
  // partes destrutíveis dos chefes
  const PARTES_ARTE = {
    canhao: [16, 12, p => { p.elipse(9, 6, 5, 4, '#8b93a6'); p.ret(0, 5, 7, 2, '#4d5463'); p.pix(9, 5, '#ff5050'); }, false],
    missil: [14, 14, p => { p.ret(2, 2, 10, 10, '#6b7385'); p.ret(3, 3, 3, 3, '#ff5050'); p.ret(8, 3, 3, 3, '#ff5050'); p.ret(3, 8, 3, 3, '#ff5050'); p.ret(8, 8, 3, 3, '#ff5050'); }, false],
    hangar: [18, 12, p => { p.ret(1, 1, 16, 10, '#4d5463'); p.ret(0, 3, 5, 6, '#141020'); p.ret(6, 2, 10, 2, '#ffd24a'); }, false],
    garra: [18, 14, p => { p.poli([[17, 7], [8, 1], [0, 3], [5, 7], [0, 11], [8, 13]], '#9a8470'); p.ret(9, 6, 3, 2, '#ff5050'); }, false],
    ferrao: [20, 10, p => { p.poli([[0, 5], [10, 1], [19, 3], [19, 7], [10, 9]], '#ffd24a'); p.ret(12, 4, 4, 2, '#7a1428'); }, false],
  };
  function parte(tipo, destruida = false) {
    return memo(`parte:${tipo}:${destruida}`, () => {
      const [w, h, f] = PARTES_ARTE[tipo];
      const img = pixelar(w, h, f, { espelhar: false, escala: 3 });
      return destruida ? apagado(img) : img;
    });
  }

  // ================================================================ efeitos e cenário
  /** Explosão animada em pixel art: quadro 0..7. */
  function explosao(quadro, tam = 16) {
    return memo(`exp:${quadro}:${tam}`, () => {
      const n = tam, c = tela(n, n), g = c.getContext('2d'), m = n / 2, t = quadro / 7;
      const anel = (r, cor) => { g.fillStyle = cor; g.beginPath(); g.arc(m, m, r, 0, Math.PI * 2); g.fill(); };
      anel(m * (0.35 + t * 0.65), t < 0.6 ? '#ff6a2a' : '#7a3a3a');
      anel(m * (0.28 + t * 0.5) * (1 - t * 0.3), t < 0.5 ? '#ffc23a' : '#b0502a');
      if (t < 0.55) anel(m * (0.25 + t * 0.3) * (1 - t), '#fff6c8');
      if (t > 0.45) { g.globalCompositeOperation = 'destination-out'; anel(m * (t - 0.35) * 1.3, '#000'); }
      const d = g.getImageData(0, 0, n, n), p = d.data;
      for (let i = 3; i < p.length; i += 4) p[i] = p[i] > 100 ? 255 : 0;
      g.putImageData(d, 0, 0);
      const s = tela(n * 3, n * 3), gs = s.getContext('2d'); gs.imageSmoothingEnabled = false; gs.drawImage(c, 0, 0, n * 3, n * 3); return s;
    });
  }
  /** Planeta em pixel art para a camada do meio do fundo. */
  function planeta(semente, raio, cor1, cor2, anel) {
    return memo(`planeta:${semente}:${raio}:${cor1}`, () => {
      const n = raio * 2 + (anel ? raio : 2), c = tela(n, n), g = c.getContext('2d'), m = n / 2;
      let s = semente * 9301 + 49297;
      const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
      g.fillStyle = cor1; g.beginPath(); g.arc(m, m, raio, 0, Math.PI * 2); g.fill();
      g.save(); g.clip();
      g.fillStyle = cor2;
      for (let i = 0; i < 6; i++) g.fillRect(0, m - raio + r() * raio * 2, n, 1 + r() * raio * 0.25);
      g.fillStyle = 'rgba(0,0,0,.45)'; g.beginPath(); g.arc(m + raio * 0.45, m + raio * 0.3, raio, 0, Math.PI * 2); g.fill();
      g.restore();
      if (anel) { g.strokeStyle = cor2; g.lineWidth = 1.5; g.beginPath(); g.ellipse(m, m, raio * 1.45, raio * 0.35, -0.3, 0, Math.PI * 2); g.stroke(); }
      const d = g.getImageData(0, 0, n, n), p = d.data;
      for (let i = 3; i < p.length; i += 4) p[i] = p[i] > 90 ? 255 : 0;
      g.putImageData(d, 0, 0);
      const k = 3, o = tela(n * k, n * k), go = o.getContext('2d'); go.imageSmoothingEnabled = false; go.drawImage(c, 0, 0, n * k, n * k); return o;
    });
  }
  /** Ícones das peças (para a garagem). */
  function iconePeca(tipo) {
    return memo(`icone:${tipo}`, () => pixelar(12, 12, p => {
      switch (tipo) {
        case 'canhao': p.ret(1, 4, 7, 4, '#8b93a6'); p.ret(8, 5, 3, 2, '#ffcf5a'); break;
        case 'motor': p.ret(4, 3, 6, 6, '#8b93a6'); p.ret(0, 4, 4, 4, '#ff8a2a'); p.ret(1, 5, 2, 2, '#fff6c8'); break;
        case 'blindagem': p.poli([[6, 1], [11, 3], [10, 8], [6, 11], [2, 8], [1, 3]], '#c8ced9'); p.ret(5, 4, 2, 4, '#5a6478'); break;
        case 'nucleo': p.poli([[6, 0], [10, 6], [6, 11], [2, 6]], '#ff5ad1'); p.ret(5, 4, 2, 3, '#ffd6f4'); break;
        case 'modulo': p.elipse(6, 6, 4, 4, '#59e3e0'); p.ret(5, 0, 2, 3, '#8b93a6'); p.ret(5, 5, 2, 2, '#ffffff'); break;
      }
    }, { espelhar: false, escala: 3 }));
  }
  /** Drone ajudante. */
  function drone() {
    return memo('drone', () => pixelar(10, 8, p => { p.elipse(5, 4, 4, 2.5, '#9fb2c8'); p.ret(6, 3, 4, 1, '#59e3e0'); p.pix(4, 3, '#ffe36a'); }, { escala: 2 }));
  }
  function moeda(q) {
    return memo(`moeda:${q % 4}`, () => pixelar(8, 8, p => {
      const w = [3.5, 2.5, 1, 2.5][q % 4]; p.elipse(4, 4, w, 3.5, '#ffd24a'); if (w > 1.5) p.ret(4, 2, 1, 4, '#c4881a');
    }, { espelhar: false, escala: 2 }));
  }
  function cristal() { return memo('cristal', () => pixelar(10, 12, p => { p.poli([[5, 0], [9, 4], [5, 11], [1, 4]], '#ff5ad1'); p.poli([[5, 1], [7, 4], [5, 8], [4, 4]], '#ffd6f4'); }, { espelhar: false, escala: 2 })); }

  return { nave, veiculo, inimigo, asteroide, chefe, parte, explosao, planeta, iconePeca, drone, moeda, cristal, ampliar, branco, apagado, NAVES_ARTE };
})();
