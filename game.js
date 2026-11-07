/* Navinha Espacial — versão web (Canvas + JavaScript puro).
 * Porte da versão Java: 4 naves, poderes, 6 inimigos, 5 fases com chefes, desafios e modo infinito.
 * No celular: deslize o dedo para mover (a nave atira enquanto o dedo está na tela);
 * botões na tela para o especial, a bomba e a pausa. No PC: setas/WASD, Espaço, X, C, P, M. */
'use strict';

const VERSAO = '2.0.0';
const H = 540;
let W = 960;
const PASSO = 1000 / 60;

const cv = document.getElementById('jogo');
const ctx = cv.getContext('2d');
let escala = 1, offX = 0, offY = 0, dpr = 1;

// ============================================================ utilidades
// armazenamento local protegido (pode falhar em aba anônima ou com dados bloqueados)
const armaz = { ler(k) { try { return localStorage.getItem(k); } catch (_) { return null; } }, gravar(k, v) { try { localStorage.setItem(k, v); } catch (_) {} } };
const rnd = (a = 1, b) => b === undefined ? Math.random() * a : a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const hyp = Math.hypot;
function intersecta(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }
function mulberry(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function rgba(c, a) { return `rgba(${c[0]},${c[1]},${c[2]},${a})`; }
const fmt = n => Math.floor(n).toLocaleString('pt-BR');
const isTouch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
let usouToque = isTouch;

// ============================================================ sprites
const IMG = {};
function carregarImagem(nome, src) {
  return new Promise(res => { const i = new Image(); i.onload = () => { IMG[nome] = i; res(); }; i.onerror = () => res(); i.src = src; });
}
const cache = new Map();
function novaTela(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

function escalada(nome, w, h) {
  const k = `${nome}@${w}x${h}`;
  if (cache.has(k)) return cache.get(k);
  const c = novaTela(w, h), g = c.getContext('2d');
  g.imageSmoothingQuality = 'high';
  if (IMG[nome]) g.drawImage(IMG[nome], 0, 0, w, h); else { g.fillStyle = '#f0f'; g.fillRect(0, 0, w, h); }
  cache.set(k, c);
  return c;
}

function rgbParaHsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  let h = 0;
  if (d) { if (mx === r) h = ((g - b) / d) % 6; else if (mx === g) h = (b - r) / d + 2; else h = (r - g) / d + 4; h /= 6; if (h < 0) h += 1; }
  return [h, mx ? d / mx : 0, mx];
}
function hsvParaRgb(h, s, v) {
  const i = Math.floor(h * 6), f = h * 6 - i, p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s);
  const m = [[v, t, p], [q, v, p], [p, v, t], [p, q, v], [t, p, v], [v, p, q]][i % 6];
  return [m[0] * 255, m[1] * 255, m[2] * 255];
}
/** Gira o matiz só dos pixels dentro da faixa hMin..hMax (a faixa pode "dar a volta" no vermelho). */
function recolorida(nome, w, h, hMin, hMax, desloc, sat = 1, bri = 1) {
  const k = `${nome}@${w}x${h}#${hMin},${hMax},${desloc},${sat},${bri}`;
  if (cache.has(k)) return cache.get(k);
  const base = escalada(nome, w, h);
  const c = novaTela(w, h), g = c.getContext('2d');
  g.drawImage(base, 0, 0);
  const d = g.getImageData(0, 0, w, h), p = d.data;
  for (let i = 0; i < p.length; i += 4) {
    if (!p[i + 3]) continue;
    const [hh, s, v] = rgbParaHsv(p[i], p[i + 1], p[i + 2]);
    const dentro = hMin <= hMax ? (hh >= hMin && hh <= hMax) : (hh >= hMin || hh <= hMax);
    if (dentro && s > 0.15) {
      let nh = hh + desloc; nh -= Math.floor(nh);
      const [r, gg, b] = hsvParaRgb(nh, Math.min(1, s * sat), Math.min(1, v * bri));
      p[i] = r; p[i + 1] = gg; p[i + 2] = b;
    }
  }
  g.putImageData(d, 0, 0);
  cache.set(k, c);
  return c;
}
function cinza(src) {
  const k = src; const kk = 'cinza'; if (src[kk]) return src[kk];
  const c = novaTela(src.width, src.height), g = c.getContext('2d');
  g.filter = 'grayscale(1) brightness(0.3)'; g.drawImage(src, 0, 0);
  if (g.filter === 'none' || g.filter === undefined) { g.globalAlpha = 0.25; g.drawImage(src, 0, 0); }
  src[kk] = c; return c;
}
const brancos = new WeakMap();
function branco(src) {
  if (brancos.has(src)) return brancos.get(src);
  const c = novaTela(src.width, src.height), g = c.getContext('2d');
  g.drawImage(src, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
  brancos.set(src, c); return c;
}
function brilho(cor, raio) {
  const k = `glow${cor}@${raio}`;
  if (cache.has(k)) return cache.get(k);
  const c = novaTela(raio * 2, raio * 2), g = c.getContext('2d');
  const gr = g.createRadialGradient(raio, raio, 0, raio, raio, raio);
  gr.addColorStop(0, '#fff'); gr.addColorStop(0.35, rgba(cor, 1)); gr.addColorStop(0.6, rgba(cor, 0.43)); gr.addColorStop(1, rgba(cor, 0));
  g.fillStyle = gr; g.fillRect(0, 0, raio * 2, raio * 2);
  cache.set(k, c); return c;
}
function asteroide(variante, tam) {
  const k = `ast${variante}@${tam}`;
  if (cache.has(k)) return cache.get(k);
  const peq = novaTela(16, 16), g = peq.getContext('2d');
  const r = mulberry(variante * 7919 + 13);
  const pts = [];
  for (let i = 0; i < 9; i++) { const a = i * Math.PI * 2 / 9, rr = 5.5 + r() * 2.2; pts.push([Math.round(8 + Math.cos(a) * rr), Math.round(8 + Math.sin(a) * rr)]); }
  const poli = (dx, dy, cor) => { g.fillStyle = cor; g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x + dx, y + dy) : g.moveTo(x + dx, y + dy)); g.fill(); };
  poli(0, 0, '#3a3340'); poli(-1, -1, '#6d6470');
  g.fillStyle = '#8f8592'; g.fillRect(5, 4, 4, 3);
  g.fillStyle = '#4a424f'; for (let i = 0; i < 3; i++) g.fillRect(4 + Math.floor(r() * 7), 4 + Math.floor(r() * 7), 2, 2);
  const c = novaTela(tam, tam), g2 = c.getContext('2d');
  g2.imageSmoothingEnabled = false; g2.drawImage(peq, 0, 0, tam, tam);
  cache.set(k, c); return c;
}
function kamikaze() {
  if (cache.has('kamikaze')) return cache.get('kamikaze');
  const px = ['........kk....', '......kkrrk...', '....kkrrrrrkF.', '..kkrrrwwrrrFF', 'kkrrrrwwwwrrFf', '..kkrrrwwrrrFF', '....kkrrrrrkF.', '......kkrrk...', '........kk....'];
  const pal = { k: '#3a1a14', r: '#ff7a2a', w: '#ffe066', F: '#ff4040', f: '#ffd040' };
  const e = 3, c = novaTela(14 * e, 9 * e), g = c.getContext('2d');
  px.forEach((l, y) => [...l].forEach((ch, x) => { if (pal[ch]) { g.fillStyle = pal[ch]; g.fillRect(x * e, y * e, e, e); } }));
  cache.set('kamikaze', c); return c;
}

// ============================================================ som (Web Audio)
const Som = {
  ac: null, buf: {}, ganho: {}, mudo: armaz.ler('navinha.mudo') === '1', musica: null, ultimoTiro: 0,
  arquivos: { tiro: ['som_tiro', 0.18], explosao: ['som_explosao', 0.35], powerup: ['powerup', 0.5], dano: ['dano', 0.6], alerta: ['alerta', 0.4],
    especial: ['especial', 0.5], bomba: ['bomba', 0.7], acerto: ['acerto', 0.15], menu: ['menu', 0.3] },
  iniciar() {
    if (this.ac) { if (this.ac.state === 'suspended') this.ac.resume(); return; }
    try {
      this.ac = new (window.AudioContext || window.webkitAudioContext)();
      for (const [nome, [arq, vol]] of Object.entries(this.arquivos)) {
        this.ganho[nome] = vol;
        fetch(`assets/${arq}.mp3`).then(r => r.arrayBuffer()).then(b => this.ac.decodeAudioData(b)).then(a => { this.buf[nome] = a; }).catch(() => {});
      }
    } catch (e) { this.ac = null; }
    this.musica = new Audio('assets/musica.mp3');
    this.musica.loop = true; this.musica.volume = 0.32;
    if (!this.mudo) this.musica.play().catch(() => {});
  },
  tocar(nome) {
    if (this.mudo || !this.ac || !this.buf[nome]) return;
    if (nome === 'tiro') { const t = performance.now(); if (t - this.ultimoTiro < 70) return; this.ultimoTiro = t; }
    const s = this.ac.createBufferSource(), g = this.ac.createGain();
    s.buffer = this.buf[nome]; g.gain.value = this.ganho[nome];
    s.connect(g).connect(this.ac.destination); s.start();
  },
  alternar() {
    this.mudo = !this.mudo;
    armaz.gravar('navinha.mudo', this.mudo ? '1' : '0');
    if (this.musica) { if (this.mudo) this.musica.pause(); else this.musica.play().catch(() => {}); }
    return this.mudo;
  },
  pausarMusica(p) { if (this.musica && !this.mudo) { if (p) this.musica.pause(); else this.musica.play().catch(() => {}); } }
};

// ============================================================ dados salvos (no navegador)
const Dados = {
  recordes: [], prog: {},
  carregar() {
    try { this.recordes = JSON.parse(armaz.ler('navinha.recordes')) || []; } catch (e) { this.recordes = []; }
    try { this.prog = JSON.parse(armaz.ler('navinha.progresso')) || {}; } catch (e) { this.prog = {}; }
  },
  salvar() {
    armaz.gravar('navinha.recordes', JSON.stringify(this.recordes));
    armaz.gravar('navinha.progresso', JSON.stringify(this.prog));
  },
  entraNoRanking(p) { return p > 0 && (this.recordes.length < 10 || p > this.recordes[this.recordes.length - 1].pontos); },
  adicionar(nome, pontos, fase, nave) {
    const r = { nome, pontos, fase, nave, id: Date.now() };
    this.recordes.push(r); this.recordes.sort((a, b) => b.pontos - a.pontos); this.recordes = this.recordes.slice(0, 10);
    this.salvar(); return this.recordes.indexOf(r);
  },
  desbloqueada(n) { return n.id === 'TITA' ? !!this.prog.tita : n.id === 'FANTASMA' ? (this.prog.desafios || 0) >= 3 : true; },
  desbloquearTita() { this.prog.tita = 1; this.salvar(); },
  somarDesafio() { this.prog.desafios = (this.prog.desafios || 0) + 1; this.salvar(); },
};

// ============================================================ naves
const NAVES = [
  { id: 'FALCAO', nome: 'Falcão', desc: 'Equilibrada e confiável.', especial: 'Enxame de Mísseis', descEsp: 'Dispara 12 mísseis teleguiados.',
    vel: 4.6, vidas: 3, cadencia: 10, dano: 1, perfurante: false, tam: 46, matiz: 0, bri: 1, cor: [255, 120, 80] },
  { id: 'COMETA', nome: 'Cometa', desc: 'Rápida, mas frágil.', especial: 'Turbo', descEsp: '4s invencível, mais veloz e atirando sem parar.',
    vel: 6.3, vidas: 2, cadencia: 7, dano: 0.8, perfurante: false, tam: 40, matiz: 0.62, bri: 1.05, cor: [90, 200, 255] },
  { id: 'TITA', nome: 'Titã', desc: 'Lenta, blindada e de tiro pesado.', especial: 'Escudo de Plasma', descEsp: '5s de escudo que destrói tiros e inimigos.',
    vel: 3.3, vidas: 5, cadencia: 15, dano: 2, perfurante: false, tam: 56, matiz: 0.33, bri: 0.85, cor: [120, 255, 120], condicao: 'Derrote o chefe da Fase 2' },
  { id: 'FANTASMA', nome: 'Fantasma', desc: 'Tiros perfurantes atravessam inimigos.', especial: 'Raio Fantasma', descEsp: 'Laser contínuo que corta tudo por 3s.',
    vel: 5, vidas: 3, cadencia: 11, dano: 1, perfurante: true, tam: 46, matiz: 0.78, bri: 1.1, cor: [220, 120, 255], condicao: 'Complete 3 desafios de fase' },
];
function imagemNave(n, tam = n.tam) {
  return n.matiz === 0 ? escalada('nave', tam, tam) : recolorida('nave', tam, tam, 0.9, 0.04, n.matiz, 1, n.bri);
}

// ============================================================ inimigos
const TIPOS = {
  BASICO:    { nome: 'Disco', vida: 1, pontos: 100, tam: 42, drop: 0.07 },
  ZIGUE:     { nome: 'Zigue-Zague', vida: 1, pontos: 150, tam: 38, drop: 0.08 },
  ATIRADOR:  { nome: 'Atirador', vida: 4, pontos: 250, tam: 46, drop: 0.2 },
  KAMIKAZE:  { nome: 'Kamikaze', vida: 1, pontos: 200, tam: 36, drop: 0.07 },
  TANQUE:    { nome: 'Encouraçado', vida: 14, pontos: 600, tam: 70, drop: 0.65 },
  ASTEROIDE: { nome: 'Asteroide', vida: 5, pontos: 80, tam: 50, drop: 0.05 },
  FRAGMENTO: { nome: 'Fragmento', vida: 1, pontos: 40, tam: 24, drop: 0.02 },
};
for (const k in TIPOS) TIPOS[k].id = k;
function imagemInimigo(t, variante) {
  const s = t.tam;
  switch (t.id) {
    case 'BASICO': return escalada('inimigo', s, s);
    case 'ZIGUE': return recolorida('inimigo', s, s, 0.4, 0.6, -0.35, 1.1, 1.1);
    case 'ATIRADOR': return recolorida('inimigo', s, s, 0.4, 0.6, 0.48, 1.1, 1);
    case 'TANQUE': return recolorida('inimigo', s, s, 0.4, 0.6, 0.3, 0.9, 0.8);
    case 'ASTEROIDE': return asteroide(variante, s);
    case 'FRAGMENTO': return asteroide(variante + 3, s);
    case 'KAMIKAZE': return kamikaze();
  }
}

class Inimigo {
  constructor(tipo, x, y, dif, vx, vy) {
    this.tipo = tipo; this.x = x; this.y = y; this.baseY = y; this.dif = dif;
    this.vidaMax = tipo.vida * (tipo.id === 'FRAGMENTO' ? 1 : 0.75 + dif * 0.25); this.vida = this.vidaMax;
    this.vivo = true; this.flash = 0; this.idade = 0; this.recarga = 60 + rnd(60);
    this.alvoX = W - 300 + rnd(220); this.fase = rnd(Math.PI * 2); this.rot = 0; this.vrot = (Math.random() - 0.5) * 0.06;
    this.vx = 0; this.vy = 0;
    switch (tipo.id) {
      case 'BASICO': this.vx = -rnd(1.8, 2.5) * dif; break;
      case 'ZIGUE': this.vx = -2.3 * dif; break;
      case 'ATIRADOR': this.vx = -3; break;
      case 'KAMIKAZE': this.vx = -1.5; break;
      case 'TANQUE': this.vx = -1; break;
      case 'ASTEROIDE': this.vx = -rnd(1.2, 2.4) * dif; this.vy = (Math.random() - 0.5) * 1.1; break;
    }
    if (vx !== undefined) { this.vx = vx; this.vy = vy; }
    this.img = imagemInimigo(tipo, Math.floor(rnd(3)));
  }
  update(j) {
    this.idade++; if (this.flash > 0) this.flash--;
    const p = j.player, dif = this.dif;
    switch (this.tipo.id) {
      case 'BASICO': this.x += this.vx; break;
      case 'ZIGUE': this.x += this.vx; this.y = this.baseY + Math.sin(this.idade * 0.05 + this.fase) * 60; break;
      case 'ATIRADOR':
        if (this.idade < 600) { this.x += (this.alvoX - this.x) * 0.03; this.y = this.baseY + Math.sin(this.idade * 0.02 + this.fase) * 32; }
        else this.x -= 4.2;
        if (--this.recarga <= 0 && this.x < W - 25 && p.vivo) { j.tiroMirado(this.x - 18, this.y, 3.2 * dif); this.recarga = 100 / dif; }
        break;
      case 'KAMIKAZE':
        if (this.idade < 45) this.x += this.vx;
        else {
          if (p.vivo && this.x > p.x - 40) { const a = Math.atan2(p.y - this.y, p.x - this.x); this.vx += Math.cos(a) * 0.3 * dif; this.vy += Math.sin(a) * 0.3 * dif; }
          const v = hyp(this.vx, this.vy), max = 5.6 * dif;
          if (v > max) { this.vx = this.vx / v * max; this.vy = this.vy / v * max; }
          this.x += this.vx; this.y += this.vy;
          if (this.idade % 3 === 0) j.efeitos.faisca(this.x + 14, this.y, [255, 150, 60]);
        }
        break;
      case 'TANQUE':
        if (this.x > W - 150) this.x += this.vx; else this.x -= 0.25;
        this.y = this.baseY + Math.sin(this.idade * 0.015 + this.fase) * 45;
        if (--this.recarga <= 0 && this.x < W - 35 && p.vivo) {
          const b = Math.atan2(p.y - this.y, p.x - this.x);
          for (let i = -2; i <= 2; i++) j.tiroInimigo(this.x - 26, this.y, b + i * 0.22, 2.9 * dif);
          this.recarga = 130 / dif;
        }
        break;
      default:
        this.x += this.vx; this.y += this.vy; this.rot += this.vrot;
        if (this.y < 55 || this.y > H - 16) this.vy = -this.vy;
    }
    if (this.x < -120 || this.x > W + 900 || this.y < -150 || this.y > H + 150) this.vivo = false;
  }
  danificar(d) { this.vida -= d; this.flash = 4; if (this.vida <= 0) { this.vivo = false; return true; } return false; }
  bounds() {
    const t = this.tipo.tam * 0.78, disco = ['BASICO', 'ZIGUE', 'ATIRADOR', 'TANQUE'].includes(this.tipo.id), h = disco ? t * 0.75 : t;
    return { x: this.x - t / 2, y: this.y - h / 2, w: t, h };
  }
  desenhar(g) {
    const i = this.flash > 0 ? branco(this.img) : this.img, w = i.width, h = i.height;
    const girar = this.tipo.id === 'ASTEROIDE' || this.tipo.id === 'FRAGMENTO' ? this.rot
      : this.tipo.id === 'KAMIKAZE' && this.idade >= 45 ? Math.atan2(this.vy, this.vx) + Math.PI : null;
    if (girar !== null) { g.save(); g.translate(this.x, this.y); g.rotate(girar); g.drawImage(i, -w / 2, -h / 2); g.restore(); }
    else g.drawImage(i, this.x - w / 2, this.y - h / 2);
    if ((this.tipo.id === 'TANQUE' || this.tipo.id === 'ATIRADOR') && this.vida < this.vidaMax) {
      const bw = this.tipo.tam - 10;
      g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(this.x - bw / 2, this.y - h / 2 - 8, bw, 4);
      g.fillStyle = '#ff5050'; g.fillRect(this.x - bw / 2, this.y - h / 2 - 8, bw * Math.max(0, this.vida / this.vidaMax), 4);
    }
  }
}

// ============================================================ fases e chefes
const ATQ = { LEQUE: 0, ESPIRAL: 1, RAJADA: 2, INVOCAR: 3, ANEL: 4, MURO: 5 };
const NOMES_ATAQUE = ['Leque', 'Espiral', 'Rajada', 'Invocação', 'Anel', 'Muralha'];
const DESAFIOS = {
  COMBO: { texto: m => `Faça um combo de ${m}`, meta: 15 },
  ASTEROIDES: { texto: m => `Destrua ${m} asteroides`, meta: 12 },
  SEM_DANO: { texto: () => 'Não leve nenhum dano', meta: 0 },
  SEM_BOMBA: { texto: () => 'Não use bombas', meta: 0 },
  CHEFE_RAPIDO: { texto: m => `Derrote o chefe em até ${m}s`, meta: 75 },
};
for (const k in DESAFIOS) { DESAFIOS[k].id = k; DESAFIOS[k].descricao = DESAFIOS[k].texto(DESAFIOS[k].meta); }
const T = TIPOS;
const FASES = [
  { n: 1, nome: 'Cinturão de Órion', tipos: [[T.BASICO, 7], [T.ZIGUE, 3]], meta: 25, intervalo: 55, vel: 1.0, desafio: DESAFIOS.COMBO,
    chefe: { nome: 'Nave-Mãe Ômega', vida: 240, tam: 140, invoca: T.BASICO, matiz: 0, sat: 1, bri: 1, ataques: [ATQ.LEQUE, ATQ.INVOCAR, ATQ.ANEL] },
    ceu: ['#04061a', '#0a1028'], neb: [[40, 70, 160], [90, 40, 140]] },
  { n: 2, nome: 'Campo de Asteroides', tipos: [[T.ASTEROIDE, 5], [T.BASICO, 3], [T.KAMIKAZE, 2]], meta: 30, intervalo: 48, vel: 1.08, desafio: DESAFIOS.ASTEROIDES,
    chefe: { nome: 'Devorador de Rochas', vida: 380, tam: 150, invoca: T.ASTEROIDE, matiz: -0.42, sat: 0.8, bri: 0.9, ataques: [ATQ.LEQUE, ATQ.ESPIRAL, ATQ.INVOCAR, ATQ.ANEL] },
    ceu: ['#0e0a08', '#1e1610'], neb: [[140, 90, 40], [80, 60, 60]] },
  { n: 3, nome: 'Nebulosa Carmesim', tipos: [[T.ATIRADOR, 3], [T.ZIGUE, 3], [T.KAMIKAZE, 3], [T.BASICO, 2]], meta: 35, intervalo: 44, vel: 1.15, desafio: DESAFIOS.SEM_DANO,
    chefe: { nome: 'Rainha Carmesim', vida: 520, tam: 152, invoca: T.KAMIKAZE, matiz: 0.48, sat: 1.2, bri: 1, ataques: [ATQ.ESPIRAL, ATQ.RAJADA, ATQ.INVOCAR, ATQ.ANEL] },
    ceu: ['#14040c', '#280814'], neb: [[180, 30, 70], [120, 20, 120]] },
  { n: 4, nome: 'Fronteira Sombria', tipos: [[T.TANQUE, 1], [T.ATIRADOR, 3], [T.KAMIKAZE, 3], [T.ASTEROIDE, 2], [T.ZIGUE, 2]], meta: 40, intervalo: 42, vel: 1.22, desafio: DESAFIOS.SEM_BOMBA,
    chefe: { nome: 'Sentinela Sombria', vida: 680, tam: 158, invoca: T.ATIRADOR, matiz: 0.3, sat: 0.9, bri: 0.7, ataques: [ATQ.LEQUE, ATQ.RAJADA, ATQ.MURO, ATQ.ANEL] },
    ceu: ['#06040e', '#100a1c'], neb: [[80, 40, 140], [30, 90, 110]] },
  { n: 5, nome: 'Núcleo Alienígena', tipos: [[T.BASICO, 2], [T.ZIGUE, 3], [T.ATIRADOR, 3], [T.KAMIKAZE, 3], [T.TANQUE, 1], [T.ASTEROIDE, 1]], meta: 45, intervalo: 38, vel: 1.3, desafio: DESAFIOS.CHEFE_RAPIDO,
    chefe: { nome: 'Imperador Zorg', vida: 1000, tam: 180, invoca: T.KAMIKAZE, matiz: -0.33, sat: 1.3, bri: 1.15, ataques: [0, 1, 2, 3, 4, 5] },
    ceu: ['#020e0a', '#061e16'], neb: [[30, 160, 100], [160, 140, 30]] },
];
function sortearTipo(f) {
  const tot = f.tipos.reduce((s, t) => s + t[1], 0);
  let r = rnd(tot);
  for (const [t, p] of f.tipos) { r -= p; if (r < 0) return t; }
  return f.tipos[0][0];
}

class Chefe {
  constructor(info, dif, mult) {
    Object.assign(this, { nome: info.nome, vidaMax: info.vida * mult, ataques: info.ataques, invoca: info.invoca, dif, tam: info.tam });
    this.vida = this.vidaMax; this.vivo = true; this.entrando = true; this.flash = 0; this.tempoLuta = 0;
    this.x = W + this.tam; this.y = H / 2; this.idx = 0; this.timerPadrao = 0; this.t = 0; this.ang = 0; this.furiaAnunciada = false;
    this.img = info.matiz === 0 ? escalada('inimigo', this.tam, this.tam) : recolorida('inimigo', this.tam, this.tam, 0.4, 0.6, info.matiz, info.sat, info.bri);
  }
  furia() { return this.vida < this.vidaMax / 2; }
  update(j) {
    this.t++; if (this.flash > 0) this.flash--;
    const alvoX = W - this.tam * 0.75;
    if (this.entrando) { this.x += (alvoX - this.x) * 0.025; if (Math.abs(this.x - alvoX) < 3) this.entrando = false; return; }
    this.tempoLuta++;
    this.y = H / 2 + 24 + Math.sin(this.t * 0.012 * (this.furia() ? 1.5 : 1)) * (H / 2 - this.tam / 2 - 50);
    this.x = alvoX + Math.sin(this.t * 0.007) * 34;
    if (this.furia() && !this.furiaAnunciada) {
      this.furiaAnunciada = true; j.aviso(this.nome.toUpperCase() + ' ESTÁ FURIOSO!', [255, 80, 80]);
      j.efeitos.anel(this.x, this.y, [255, 60, 60], 140); j.tremer(14);
    }
    const ritmo = this.furia() ? 0.65 : 1;
    if (++this.timerPadrao > 260) { this.timerPadrao = 0; this.idx = (this.idx + 1) % this.ataques.length; }
    if (this.timerPadrao < 30) return;
    const f = this.timerPadrao, p = j.player;
    const bx = this.x - this.tam * 0.35, by = this.y + this.tam * 0.1, mira = Math.atan2(p.y - by, p.x - bx), v = 3.1 * this.dif;
    const cada = n => f % Math.max(1, Math.round(n)) === 0;
    switch (this.ataques[this.idx]) {
      case ATQ.LEQUE:
        if (cada(55 * ritmo)) { const n = this.furia() ? 9 : 7; for (let i = 0; i < n; i++) j.tiroInimigo(bx, by, mira + (i - (n - 1) / 2) * 0.16, v); }
        break;
      case ATQ.ESPIRAL:
        if (cada(this.furia() ? 4 : 6)) {
          this.ang += 0.27;
          j.tiroInimigo(this.x, this.y, this.ang, v * 0.85); j.tiroInimigo(this.x, this.y, this.ang + Math.PI, v * 0.85);
          if (this.furia()) j.tiroInimigo(this.x, this.y, -this.ang, v * 0.7);
        }
        break;
      case ATQ.RAJADA:
        if (f % 100 < 55 && cada(Math.max(4, 9 * ritmo))) j.tiroInimigo(bx, by, mira + (Math.random() - 0.5) * 0.12, v * 1.5);
        break;
      case ATQ.INVOCAR:
        if (f === 40 || (this.furia() && f === 150)) {
          for (let i = 0; i < 3; i++) j.adicionarInimigo(new Inimigo(this.invoca, this.x - 40, 100 + rnd(H - 170), this.dif));
          j.efeitos.anel(this.x, this.y, [255, 220, 120], 110);
        }
        if (cada(80 * ritmo)) j.tiroMirado(bx, by, v);
        break;
      case ATQ.ANEL:
        if (cada(50 * ritmo)) { const n = this.furia() ? 22 : 16, d = Math.floor(f / 50) * 0.1; for (let i = 0; i < n; i++) j.tiroInimigo(this.x, this.y, d + i * Math.PI * 2 / n, v * 0.8); }
        break;
      case ATQ.MURO:
        if (cada(75 * ritmo)) {
          const brecha = 100 + rnd(H - 200);
          for (let yy = 56; yy < H; yy += 28) if (Math.abs(yy - brecha) >= 62) {
            const t = new Tiro(W + 10, yy, -v * 0.9, 0, 1, true, 'ESFERA'); t.cor = [255, 170, 60]; j.tiros.push(t);
          }
        }
        break;
    }
  }
  danificar(d) { if (this.entrando) return false; this.vida -= d; this.flash = 3; if (this.vida <= 0) { this.vida = 0; this.vivo = false; return true; } return false; }
  ataqueAtual() { return NOMES_ATAQUE[this.ataques[this.idx]]; }
  bounds() { const w = this.tam * 0.8, h = this.tam * 0.55; return { x: this.x - w / 2, y: this.y - h / 2, w, h }; }
  desenhar(g) {
    if (this.furia()) {
      const r = Math.round(this.tam * 0.62 + Math.sin(this.t * 0.2) * 6);
      g.globalAlpha = 0.45; g.drawImage(brilho([255, 40, 40], r), this.x - r, this.y - r); g.globalAlpha = 1;
    }
    g.drawImage(this.flash > 0 ? branco(this.img) : this.img, this.x - this.tam / 2, this.y - this.tam / 2);
  }
}

// ============================================================ tiros
class Tiro {
  constructor(x, y, vx, vy, dano, inimigo, tipo = 'NORMAL') {
    Object.assign(this, { x, y, vx, vy, dano, inimigo, tipo });
    this.perfuracoes = 0; this.atingidos = new Set(); this.vivo = true; this.idade = 0;
    this.raio = inimigo ? 6 : tipo === 'MISSIL' ? 5 : 4; this.cor = inimigo ? [255, 70, 160] : [255, 230, 80];
  }
  update(j) {
    this.idade++;
    if (this.tipo === 'MISSIL') {
      const alvo = j.alvoMaisProximo(this.x, this.y), vel = Math.min(10, 4 + this.idade * 0.25);
      let atual = Math.atan2(this.vy, this.vx);
      if (alvo) { const a = Math.atan2(alvo.y - this.y, alvo.x - this.x); atual += clamp(Math.atan2(Math.sin(a - atual), Math.cos(a - atual)), -0.14, 0.14); }
      this.vx = Math.cos(atual) * vel; this.vy = Math.sin(atual) * vel;
      if (this.idade % 2 === 0) j.efeitos.fumaca(this.x - this.vx, this.y - this.vy);
      if (this.idade > 240) this.vivo = false;
    }
    this.x += this.vx; this.y += this.vy;
    if (this.x < -40 || this.x > W + 40 || this.y < -40 || this.y > H + 40) this.vivo = false;
  }
  bounds() {
    if (this.tipo === 'NORMAL' && !this.inimigo) return { x: this.x - 10, y: this.y - 4, w: 20, h: 8 };
    const r = this.inimigo ? this.raio - 2 : this.raio;
    return { x: this.x - r, y: this.y - r, w: r * 2, h: r * 2 };
  }
  desenhar(g) {
    if (this.inimigo) { const b = brilho(this.cor, this.raio + 4); g.drawImage(b, this.x - b.width / 2, this.y - b.height / 2); return; }
    g.save(); g.translate(this.x, this.y); g.rotate(Math.atan2(this.vy, this.vx));
    if (this.tipo === 'MISSIL') {
      g.fillStyle = '#e6e6f0'; g.fillRect(-8, -2, 14, 4); g.fillStyle = '#ff503c'; g.fillRect(4, -2, 4, 4); g.fillStyle = '#ffc850'; g.fillRect(-11, -1, 3, 2);
    } else if (IMG.tiro) { g.imageSmoothingEnabled = false; g.drawImage(IMG.tiro, -10, -4, 20, 8); }
    else { g.fillStyle = '#ffe650'; g.fillRect(-10, -3, 20, 6); }
    g.restore();
  }
}

// ============================================================ power-ups
const POWERUPS = [
  { id: 'ARMA', nome: 'ARMA+', letra: 'P', cor: [255, 200, 40], peso: 30, desc: 'Aumenta o nível da arma (até 5)' },
  { id: 'RAPIDO', nome: 'TIRO RÁPIDO', letra: 'R', cor: [255, 110, 40], peso: 18, desc: 'Dobra a cadência por 8s' },
  { id: 'ESCUDO', nome: 'ESCUDO', letra: 'E', cor: [80, 190, 255], peso: 16, desc: 'Aguenta 1 golpe' },
  { id: 'ENERGIA', nome: 'ENERGIA', letra: 'S', cor: [200, 110, 255], peso: 16, desc: '+50% de energia do especial' },
  { id: 'BOMBA', nome: 'BOMBA', letra: 'B', cor: [255, 70, 70], peso: 10, desc: '+1 bomba' },
  { id: 'VIDA', nome: 'VIDA EXTRA', letra: '+', cor: [90, 255, 120], peso: 5, desc: '+1 vida' },
];
function sortearPowerUp() { let r = rnd(95); for (const p of POWERUPS) { r -= p.peso; if (r < 0) return p; } return POWERUPS[0]; }
class PowerUp {
  constructor(tipo, x, y) { Object.assign(this, { tipo, x, y }); this.vivo = true; this.idade = 0; }
  update(p) {
    this.idade++;
    const dx = p.x - this.x, dy = p.y - this.y, d = hyp(dx, dy);
    if (p.vivo && d < 130) { this.x += dx / d * 5; this.y += dy / d * 5; }
    else { this.x -= 1.3; this.y += Math.sin(this.idade * 0.06) * 0.55; }
    if (this.x < -30) this.vivo = false;
  }
  bounds() { return { x: this.x - 16, y: this.y - 16, w: 32, h: 32 }; }
  desenhar(g) {
    g.drawImage(brilho(this.tipo.cor, 24), this.x - 24, this.y - 24);
    caixaArredondada(g, this.x - 12, this.y - 12, 24, 24, 6, 'rgba(20,20,30,.88)', rgba(this.tipo.cor, 1), 2);
    texto(g, this.tipo.letra, this.x, this.y + 5, 14, rgba(this.tipo.cor, 1), 'center', false);
  }
}

// ============================================================ efeitos
class Efeitos {
  constructor() { this.p = []; this.t = []; }
  add(x, y, vx, vy, tam, vida, cor) { if (this.p.length < 1400) this.p.push({ x, y, vx, vy, tam, vida, vidaMax: vida, cor }); }
  explosao(x, y, tam) {
    const n = Math.min(60, 12 + tam / 2), cores = [[255, 240, 160], [255, 180, 60], [255, 100, 40], [200, 60, 60]];
    for (let i = 0; i < n; i++) { const a = rnd(Math.PI * 2), v = rnd(2 + tam / 18); this.add(x, y, Math.cos(a) * v, Math.sin(a) * v, rnd(2, 6), 25 + rnd(30), cores[Math.floor(rnd(4))]); }
    this.anel(x, y, [255, 200, 120], tam);
  }
  anel(x, y, cor, raio) { if (this.p.length < 1400) this.p.push({ x, y, anel: true, raio, vida: 22, vidaMax: 22, cor }); }
  faisca(x, y, cor) { this.add(x, y, rnd(1, 2.5), (Math.random() - 0.5) * 1.5, rnd(2, 4), 12 + rnd(10), cor); }
  fumaca(x, y) { this.add(x, y, (Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.4, 3, 18, [200, 200, 210]); }
  acerto(x, y) { for (let i = 0; i < 3; i++) { const a = Math.PI + (Math.random() - 0.5) * 1.6, v = rnd(1, 4); this.add(x, y, Math.cos(a) * v, Math.sin(a) * v, 2, 10, [255, 230, 80]); } }
  texto(x, y, s, cor, tam) { this.t.push({ x, y, s, cor, tam, vida: 55 }); }
  update() {
    for (const p of this.p) { if (!p.anel) { p.x += p.vx; p.y += p.vy; p.vx *= 0.96; p.vy *= 0.96; } p.vida--; }
    this.p = this.p.filter(p => p.vida > 0);
    for (const t of this.t) { t.y -= 0.7; t.vida--; }
    this.t = this.t.filter(t => t.vida > 0);
  }
  desenhar(g) {
    for (const p of this.p) {
      const a = clamp(p.vida / p.vidaMax, 0, 1);
      if (p.anel) { const r = p.raio * (1 - a); g.strokeStyle = rgba(p.cor, a); g.lineWidth = 1 + 4 * a; g.beginPath(); g.arc(p.x, p.y, r, 0, Math.PI * 2); g.stroke(); }
      else { const s = Math.max(1, p.tam * (0.5 + a * 0.5)); g.fillStyle = rgba(p.cor, a); g.fillRect(p.x - s / 2, p.y - s / 2, s, s); }
    }
    for (const t of this.t) { g.globalAlpha = Math.min(1, t.vida / 20); texto(g, t.s, t.x, t.y, t.tam, rgba(t.cor, 1), 'center'); g.globalAlpha = 1; }
  }
  limpar() { this.p = []; this.t = []; }
}

// ============================================================ fundo
class Fundo {
  constructor() {
    this.estrelas = []; for (let i = 0; i < 120; i++) this.estrelas.push({ x: rnd(1400), y: rnd(H), c: i < 60 ? 0 : i < 98 ? 1 : 2 });
    this.desloc = 0; this.hiper = 0; this.definir(FASES[0]);
  }
  definir(f) {
    this.fase = f;
    const w = 1200, c = novaTela(w, H), g = c.getContext('2d'), r = mulberry(f.n * 31);
    const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, f.ceu[0]); gr.addColorStop(1, f.ceu[1]); g.fillStyle = gr; g.fillRect(0, 0, w, H);
    for (let i = 0; i < 9; i++) {
      const cor = f.neb[i % 2], raio = 100 + r() * 190, cx = r() * w, cy = r() * H, a = (40 + r() * 30) / 255;
      for (let k = -1; k <= 1; k++) {
        const rg = g.createRadialGradient(cx + k * w, cy, 0, cx + k * w, cy, raio); rg.addColorStop(0, rgba(cor, a)); rg.addColorStop(1, rgba(cor, 0));
        g.fillStyle = rg; g.fillRect(cx + k * w - raio, cy - raio, raio * 2, raio * 2);
      }
    }
    for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(255,255,255,${(40 + r() * 90) / 255})`; g.fillRect(Math.floor(r() * w), Math.floor(r() * H), 1, 1); }
    this.ceu = c;
  }
  update() {
    this.desloc = (this.desloc + 0.25 + this.hiper * 6) % this.ceu.width;
    for (const e of this.estrelas) {
      e.x -= [0.55, 1.3, 2.6][e.c] * (1 + this.hiper * 12);
      if (e.x < -60) { e.x = W + rnd(40); e.y = rnd(H); }
    }
  }
  desenhar(g) {
    const cw = this.ceu.width, d = Math.floor(this.desloc);
    for (let x = -d; x < W; x += cw) g.drawImage(this.ceu, x, 0);
    for (const e of this.estrelas) {
      const b = [110, 180, 255][e.c], s = e.c + 1;
      g.fillStyle = `rgb(${b},${b},${Math.min(255, b + 20)})`;
      if (this.hiper > 0.05) g.fillRect(e.x, e.y, this.hiper * 54 * (e.c + 1), Math.max(1, s - 1)); else g.fillRect(e.x, e.y, s, s);
    }
  }
}

// ============================================================ entrada (teclado e toque)
const Input = {
  baixo: new Set(), apertou: new Set(),
  arrastoId: null, ultX: 0, ultY: 0, dx: 0, dy: 0, tocando: false,
  seg(...c) { return c.some(k => this.baixo.has(k)); },
  ap(...c) { return c.some(k => this.apertou.has(k)); },
  fimQuadro() { this.apertou.clear(); },
};
const TECLAS_JOGO = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'KeyW', 'KeyA', 'KeyS', 'KeyD'];
addEventListener('keydown', e => {
  if (document.activeElement && document.activeElement.tagName === 'INPUT') return;
  if (!Input.baixo.has(e.code)) Input.apertou.add(e.code);
  Input.baixo.add(e.code);
  if (TECLAS_JOGO.includes(e.code)) e.preventDefault();
  usouToque = false;
  Som.iniciar();
});
addEventListener('keyup', e => Input.baixo.delete(e.code));
addEventListener('blur', () => { Input.baixo.clear(); if (jogo && jogo.emPartida() && !jogo.pausado) jogo.pausar(); });
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { Input.baixo.clear(); if (jogo && jogo.emPartida() && !jogo.pausado) jogo.pausar(); Som.pausarMusica(true); }
  else Som.pausarMusica(false);
});

function paraLogico(e) { return { x: (e.clientX - offX) / escala, y: (e.clientY - offY) / escala }; }
let botoes = [];   // botões clicáveis desenhados no quadro atual
function botaoEm(p) { for (let i = botoes.length - 1; i >= 0; i--) { const b = botoes[i]; if (p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h) return b; } return null; }
const SENS_TOQUE = 1.35;   // quanto a nave anda para cada pixel que o dedo desliza

cv.addEventListener('pointerdown', e => {
  e.preventDefault();
  Som.iniciar();
  if (e.pointerType !== 'mouse') usouToque = true;
  const p = paraLogico(e), b = botaoEm(p);
  if (b) { b.acao(); return; }
  if (jogo.emPartida() && !jogo.pausado && Input.arrastoId === null) {
    Input.arrastoId = e.pointerId; Input.ultX = p.x; Input.ultY = p.y; Input.tocando = true;
    try { cv.setPointerCapture(e.pointerId); } catch (_) {}
  }
}, { passive: false });
cv.addEventListener('pointermove', e => {
  if (e.pointerId !== Input.arrastoId) return;
  const p = paraLogico(e);
  Input.dx += (p.x - Input.ultX) * SENS_TOQUE; Input.dy += (p.y - Input.ultY) * SENS_TOQUE;
  Input.ultX = p.x; Input.ultY = p.y;
});
function soltar(e) { if (e.pointerId === Input.arrastoId) { Input.arrastoId = null; Input.tocando = false; } }
cv.addEventListener('pointerup', soltar);
cv.addEventListener('pointercancel', soltar);
cv.addEventListener('contextmenu', e => e.preventDefault());

// ============================================================ jogador
class Player {
  constructor(tipo) {
    this.tipo = tipo; this.x = 120; this.y = H / 2; this.vidas = tipo.vidas; this.arma = 1; this.bombas = 2; this.energia = 0;
    this.escudo = tipo.id === 'TITA'; this.invencivel = 0; this.tiroRapido = 0; this.especialAtivo = 0; this.vivo = true;
    this.tirosDisparados = 0; this.recarga = 0; this.missilFila = 0; this.quadro = 0; this.img = imagemNave(tipo);
    this.querEspecial = false; this.querBomba = false;
  }
  update(j, podeAtirar) {
    this.quadro++;
    if (!this.vivo) { Input.dx = Input.dy = 0; return; }
    let dx = 0, dy = 0;
    if (Input.seg('ArrowLeft', 'KeyA')) dx--; if (Input.seg('ArrowRight', 'KeyD')) dx++;
    if (Input.seg('ArrowUp', 'KeyW')) dy--; if (Input.seg('ArrowDown', 'KeyS')) dy++;
    if (dx && dy) { dx *= 0.7071; dy *= 0.7071; }
    const vel = this.tipo.vel * (this.turbo() ? 1.7 : 1);
    this.x += dx * vel; this.y += dy * vel;
    // toque: a nave acompanha o deslize do dedo (com limite de velocidade, para não "teleportar")
    const lim = 34 * (this.turbo() ? 1.4 : 1);
    this.x += clamp(Input.dx, -lim, lim); this.y += clamp(Input.dy, -lim, lim);
    Input.dx = 0; Input.dy = 0;
    const m = this.tipo.tam / 2;
    this.x = clamp(this.x, m, W - m); this.y = clamp(this.y, 50 + m * 0.5, H - m);

    if (this.invencivel > 0) this.invencivel--; if (this.tiroRapido > 0) this.tiroRapido--;
    if (this.especialAtivo > 0) this.especialAtivo--; if (this.recarga > 0) this.recarga--;
    const qe = this.querEspecial, qb = this.querBomba; this.querEspecial = this.querBomba = false;
    if (!podeAtirar) return;

    const atirando = Input.seg('Space', 'KeyZ', 'KeyJ') || Input.tocando || this.turbo();
    if (atirando && this.recarga <= 0) {
      this.atirar(j);
      let cad = this.tipo.cadencia;
      if (this.tiroRapido > 0) cad = Math.max(3, cad / 2); if (this.turbo()) cad = Math.max(3, cad / 2);
      this.recarga = cad;
    }
    if ((Input.ap('KeyX', 'KeyK', 'ShiftLeft', 'ShiftRight') || qe) && this.energia >= 100) this.ativarEspecial(j);
    if ((Input.ap('KeyC', 'KeyL', 'KeyB') || qb) && this.bombas > 0) { this.bombas--; j.detonarBomba(); }
    if (this.missilFila > 0 && this.quadro % 5 === 0) {
      this.missilFila--;
      const a = (this.missilFila % 2 === 0 ? -1 : 1) * rnd(0.6, 1.2);
      j.tiros.push(new Tiro(this.x, this.y, Math.cos(a) * 4, Math.sin(a) * 4, 3 * this.tipo.dano, false, 'MISSIL'));
    }
  }
  atirar(j) {
    const bx = this.x + this.tipo.tam / 2 - 4, by = this.y, v = 11;
    const pad = [[[0, 0]], [[-6, 0], [6, 0]], [[0, 0], [-4, -8], [4, 8]], [[-6, 0], [6, 0], [-6, -11], [6, 11]], [[0, 0], [-6, -5], [6, 5], [-8, -15], [8, 15]]][this.arma - 1];
    for (const [oy, ang] of pad) {
      const a = ang * Math.PI / 180, t = new Tiro(bx, by + oy, Math.cos(a) * v, Math.sin(a) * v, this.tipo.dano, false);
      if (this.tipo.perfurante) t.perfuracoes = 2;
      j.tiros.push(t); this.tirosDisparados++;
    }
    Som.tocar('tiro');
  }
  ativarEspecial(j) {
    this.energia = 0; Som.tocar('especial');
    this.especialAtivo = { FALCAO: 60, COMETA: 240, TITA: 300, FANTASMA: 180 }[this.tipo.id];
    if (this.tipo.id === 'FALCAO') this.missilFila = 12;
    j.efeitos.anel(this.x, this.y, this.tipo.cor, 90);
    j.aviso(this.tipo.especial.toUpperCase() + '!', this.tipo.cor);
    vibrar(40);
  }
  turbo() { return this.tipo.id === 'COMETA' && this.especialAtivo > 0; }
  plasma() { return this.tipo.id === 'TITA' && this.especialAtivo > 0; }
  laser() { return this.tipo.id === 'FANTASMA' && this.especialAtivo > 0; }
  vulneravel() { return this.vivo && this.invencivel <= 0 && !this.turbo() && !this.plasma(); }
  ganharEnergia(v) { this.energia = Math.min(100, this.energia + v); }
  bounds() { const w = this.tipo.tam * 0.55, h = this.tipo.tam * 0.4; return { x: this.x - w / 2, y: this.y - h / 2, w, h }; }
  boundsLaser() { return { x: this.x, y: this.y - 13, w: W, h: 26 }; }
  desenhar(g) {
    if (!this.vivo || (this.invencivel > 0 && Math.floor(this.invencivel / 4) % 2 === 0)) return;
    const m = this.tipo.tam / 2;
    if (this.laser()) {
      const alt = 20 + Math.sin(this.quadro * 0.6) * 4, gr = g.createLinearGradient(0, this.y - alt, 0, this.y + alt);
      gr.addColorStop(0, 'rgba(220,120,255,0)'); gr.addColorStop(0.5, 'rgba(240,200,255,.9)'); gr.addColorStop(1, 'rgba(220,120,255,0)');
      g.fillStyle = gr; g.fillRect(this.x + m - 6, this.y - alt, W, alt * 2); g.fillStyle = '#fff'; g.fillRect(this.x + m - 6, this.y - 4, W, 8);
    }
    if (this.turbo()) for (let i = 1; i <= 3; i++) { g.globalAlpha = 0.25 / i; g.drawImage(this.img, this.x - m - i * 14, this.y - m); }
    g.globalAlpha = 1;
    g.drawImage(this.img, this.x - m, this.y - m);
    if (this.escudo) {
      g.strokeStyle = `rgba(102,204,255,${0.35 + 0.15 * Math.sin(this.quadro * 0.1)})`; g.lineWidth = 3;
      g.beginPath(); g.arc(this.x, this.y, m + 6, 0, Math.PI * 2); g.stroke();
    }
    if (this.plasma()) {
      const r = this.tipo.tam;
      g.fillStyle = 'rgba(120,255,140,.24)'; g.beginPath(); g.arc(this.x, this.y, r, 0, Math.PI * 2); g.fill();
      g.strokeStyle = 'rgba(160,255,170,.8)'; g.lineWidth = 3; g.stroke();
      g.fillStyle = 'rgba(160,255,170,.9)';
      for (let i = 0; i < 6; i++) { const a = this.quadro * 0.05 + i * Math.PI / 3; g.beginPath(); g.arc(this.x + Math.cos(a) * r, this.y + Math.sin(a) * r, 4, 0, Math.PI * 2); g.fill(); }
    }
  }
}
function vibrar(ms) { if (usouToque && navigator.vibrate) try { navigator.vibrate(ms); } catch (_) {} }

// ============================================================ desenho: utilidades
const FONTE = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
const AMARELO = '#ffd650', CIANO = '#6edcff', CINZA = '#aab0c8';
function texto(g, s, x, y, tam, cor, al = 'left', sombra = true, peso = 800) {
  g.font = `${peso} ${tam}px ${FONTE}`; g.textAlign = al; g.textBaseline = 'alphabetic';
  if (sombra) { g.fillStyle = 'rgba(0,0,0,.75)'; g.fillText(s, x + 2, y + 2); }
  g.fillStyle = cor; g.fillText(s, x, y);
}
function largura(g, s, tam, peso = 800) { g.font = `${peso} ${tam}px ${FONTE}`; return g.measureText(s).width; }
function caixaArredondada(g, x, y, w, h, r, fill, stroke, lw = 2) {
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
  if (fill) { g.fillStyle = fill; g.fill(); }
  if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw; g.stroke(); }
}
function painel(g, x, y, w, h) { caixaArredondada(g, x, y, w, h, 14, 'rgba(8,10,24,.82)', 'rgba(120,150,255,.3)'); }
function barra(g, x, y, w, h, pct, cor) {
  g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(x, y, w, h);
  g.fillStyle = cor; g.fillRect(x, y, w * clamp(pct, 0, 1), h);
  g.strokeStyle = 'rgba(255,255,255,.25)'; g.lineWidth = 1; g.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
}
function quebrar(g, s, x, y, w, tam, cor, peso = 600) {
  const pal = s.split(' '); let l = '', yy = y;
  for (const p of pal) { const t = l ? l + ' ' + p : p; if (largura(g, t, tam, peso) > w && l) { texto(g, l, x, yy, tam, cor, 'left', true, peso); yy += tam + 4; l = p; } else l = t; }
  if (l) texto(g, l, x, yy, tam, cor, 'left', true, peso);
}
/** Botão clicável (toque ou mouse) desenhado no canvas. */
function botao(g, rotulo, cx, cy, w, h, acao, opts = {}) {
  const x = cx - w / 2, y = cy - h / 2;
  const sel = opts.sel;
  caixaArredondada(g, x, y, w, h, 12, sel ? 'rgba(255,214,80,.16)' : 'rgba(10,14,34,.8)', sel ? AMARELO : 'rgba(120,150,255,.4)', sel ? 3 : 2);
  texto(g, rotulo, cx, cy + (opts.tam || 20) * 0.36, opts.tam || 20, opts.cor || (sel ? AMARELO : '#fff'), 'center');
  botoes.push({ x, y, w, h, acao: () => { Som.tocar('menu'); acao(); } });
}
function titulo(g, s, y, q, tam = 70) {
  g.font = `900 ${tam}px ${FONTE}`; g.textAlign = 'center';
  g.fillStyle = 'rgba(255,80,60,.35)'; for (let i = 4; i >= 1; i--) g.fillText(s, W / 2 + i * 2, y + i * 2);
  const w = g.measureText(s).width, d = (q % 240) / 240 * 300, gr = g.createLinearGradient(W / 2 - w / 2 + d - 300, 0, W / 2 - w / 2 + d + 300, 0);
  gr.addColorStop(0, '#ffe678'); gr.addColorStop(0.5, '#ff6e46'); gr.addColorStop(1, '#ffe678');
  g.fillStyle = gr; g.fillText(s, W / 2, y);
}
const pisca = (q, p) => Math.floor(q / p) % 2 === 0;

// ============================================================ o jogo
class Jogo {
  constructor() {
    this.estado = 'MENU'; this.pausado = false; this.timer = 0; this.quadro = 0;
    this.fundo = new Fundo(); this.efeitos = new Efeitos();
    this.opcaoMenu = 0; this.naveSel = 0; this.opcaoPausa = 0; this.posRecorde = -1;
    this.tiros = []; this.inimigos = []; this.novos = []; this.powerUps = [];
    this.tremor = 0; this.flash = 0; this.avisoTxt = null; this.avisoCor = [255, 255, 255]; this.avisoTimer = 0; this.filaAvisos = [];
    this.player = new Player(NAVES[0]); this.fase = FASES[0]; this.ciclo = 1; this.faseIdx = 0;
    this.pontos = 0; this.combo = 0; this.comboTimer = 0; this.maiorCombo = 0; this.abatesTotal = 0; this.abatesFase = 0; this.acertos = 0;
    this.desafioStatus = 0; this.maxComboFase = 0; this.asteroidesFase = 0; this.danoNaFase = false; this.bombaNaFase = false;
    this.resumo = []; this.faseRecorde = '1'; this.venceu = false; this.chefe = null; this.chefeMorrendo = 0;
  }
  emPartida() { return ['INTRO_FASE', 'JOGANDO', 'ALERTA_CHEFE', 'CHEFE', 'FASE_CONCLUIDA', 'MORRENDO'].includes(this.estado); }
  trocar(e) { this.estado = e; this.timer = 0; Input.apertou.clear(); if (!this.emPartida()) this.fundo.hiper = 0; }
  pausar() { if (this.estado !== 'MORRENDO') { this.pausado = true; this.opcaoPausa = 0; Input.arrastoId = null; Input.tocando = false; } }

  // ---------------------------------------------------------- atualização
  atualizar() {
    this.quadro++;
    if (Input.ap('KeyM')) this.alternarSom();
    if (this.avisoTimer > 0) this.avisoTimer--;
    else if (this.filaAvisos.length) { const [s, c] = this.filaAvisos.shift(); this.avisoTxt = s; this.avisoCor = c; this.avisoTimer = 110; }
    if (this.emPartida() && this.pausado) return this.atualizarPausa();
    this.timer++;
    switch (this.estado) {
      case 'MENU': this.fundo.update(); this.teclasMenu(); break;
      case 'SELECAO': this.fundo.update(); this.teclasSelecao(); break;
      case 'COMO_JOGAR': case 'RECORDES': this.fundo.update(); if (Input.ap('Escape', 'Enter', 'Backspace')) this.trocar('MENU'); break;
      case 'NOME': this.fundo.update(); this.efeitos.update(); break;
      case 'GAME_OVER': this.fundo.update(); this.efeitos.update();
        if (this.timer > 40) { if (Input.ap('KeyR')) this.novaPartida(this.player.tipo); else if (Input.ap('Enter', 'Escape')) this.trocar('MENU'); }
        break;
      case 'VITORIA': this.atualizarVitoria(); break;
      default: this.atualizarPartida();
    }
  }
  alternarSom() { const m = Som.alternar(); this.aviso(m ? 'SOM DESLIGADO' : 'SOM LIGADO', [200, 200, 200]); }
  teclasMenu() {
    if (Input.ap('ArrowUp', 'KeyW')) { this.opcaoMenu = (this.opcaoMenu + 3) % 4; Som.tocar('menu'); }
    if (Input.ap('ArrowDown', 'KeyS')) { this.opcaoMenu = (this.opcaoMenu + 1) % 4; Som.tocar('menu'); }
    if (Input.ap('Enter', 'Space')) { Som.tocar('menu'); this.acaoMenu(this.opcaoMenu); }
  }
  acaoMenu(i) { this.opcaoMenu = i; [() => this.trocar('SELECAO'), () => this.trocar('COMO_JOGAR'), () => this.trocar('RECORDES'), () => instalar()][i](); }
  teclasSelecao() {
    const n = NAVES.length;
    if (Input.ap('ArrowLeft', 'KeyA')) { this.naveSel = (this.naveSel + n - 1) % n; Som.tocar('menu'); }
    if (Input.ap('ArrowRight', 'KeyD')) { this.naveSel = (this.naveSel + 1) % n; Som.tocar('menu'); }
    if (Input.ap('Escape', 'Backspace')) this.trocar('MENU');
    if (Input.ap('Enter', 'Space')) this.escolherNave(this.naveSel);
  }
  escolherNave(i) {
    if (this.naveSel !== i) { this.naveSel = i; if (usouToque) return; }   // no celular: 1º toque escolhe, 2º decola
    const t = NAVES[i];
    if (Dados.desbloqueada(t)) { telaCheia(); this.novaPartida(t); }
    else this.aviso('BLOQUEADA: ' + t.condicao, [255, 120, 120]);
  }
  atualizarPausa() {
    if (Input.ap('ArrowUp', 'KeyW')) this.opcaoPausa = (this.opcaoPausa + 2) % 3;
    if (Input.ap('ArrowDown', 'KeyS')) this.opcaoPausa = (this.opcaoPausa + 1) % 3;
    if (Input.ap('KeyP', 'Escape')) { this.pausado = false; return; }
    if (Input.ap('Enter')) this.acaoPausa(this.opcaoPausa);
  }
  acaoPausa(i) {
    this.pausado = false;
    if (i === 1) this.novaPartida(this.player.tipo); else if (i === 2) this.trocar('MENU');
  }

  novaPartida(tipo) {
    this.player = new Player(tipo);
    this.tiros = []; this.inimigos = []; this.novos = []; this.powerUps = []; this.efeitos.limpar(); this.filaAvisos = []; this.avisoTimer = 0;
    Object.assign(this, { pontos: 0, combo: 0, comboTimer: 0, maiorCombo: 0, abatesTotal: 0, acertos: 0, ciclo: 1, faseIdx: 0, venceu: false, posRecorde: -1, pausado: false, faseRecorde: '1' });
    this.iniciarFase();
  }
  iniciarFase() {
    this.fase = FASES[this.faseIdx]; this.fundo.definir(this.fase); this.chefe = null;
    Object.assign(this, { abatesFase: 0, desafioStatus: 0, maxComboFase: 0, asteroidesFase: 0, danoNaFase: false, bombaNaFase: false, bonusAplicado: false, chefeMorrendo: 0, spawn: 90 });
    this.trocar('INTRO_FASE');
  }
  dif() { return this.fase.vel * (1 + (this.ciclo - 1) * 0.25); }

  atualizarPartida() {
    const t = this.timer;
    this.fundo.hiper = this.estado === 'INTRO_FASE' ? Math.max(0, 1 - t / 90) : this.estado === 'FASE_CONCLUIDA' ? clamp((t - 200) / 80, 0, 1) : 0;
    this.fundo.update();
    if (Input.ap('KeyP', 'Escape') && this.estado !== 'MORRENDO') return this.pausar();
    const podeAtirar = ['JOGANDO', 'ALERTA_CHEFE', 'CHEFE'].includes(this.estado);
    this.player.update(this, podeAtirar);
    if (this.comboTimer > 0 && --this.comboTimer === 0) this.combo = 0;

    switch (this.estado) {
      case 'INTRO_FASE': if (t > 200) this.trocar('JOGANDO'); break;
      case 'JOGANDO':
        if (this.abatesFase < this.fase.meta) this.gerarInimigos();
        else if (!this.inimigos.length || t > 400) { this.trocar('ALERTA_CHEFE'); Som.tocar('alerta'); vibrar([80, 60, 80]); }
        break;
      case 'ALERTA_CHEFE':
        if (t > 170) { this.chefe = new Chefe(this.fase.chefe, this.dif(), 1 + (this.ciclo - 1) * 0.6); this.trocar('CHEFE'); }
        break;
      case 'CHEFE': {
        const c = this.chefe;
        if (c.vivo) {
          c.update(this);
          if (this.fase.desafio.id === 'CHEFE_RAPIDO' && this.desafioStatus === 0 && c.tempoLuta > this.fase.desafio.meta * 60) this.falharDesafio();
        } else {
          this.chefeMorrendo++;
          if (this.chefeMorrendo % 6 === 0 && this.chefeMorrendo < 120) {
            this.efeitos.explosao(c.x + (Math.random() - 0.5) * c.tam, c.y + (Math.random() - 0.5) * c.tam * 0.6, 55); Som.tocar('explosao'); this.tremer(8);
          } else if (this.chefeMorrendo === 120) { this.efeitos.explosao(c.x, c.y, 220); this.flash = 25; this.tremer(30); Som.tocar('bomba'); vibrar(200); }
          else if (this.chefeMorrendo > 170) this.concluirFase();
        }
        break;
      }
      case 'FASE_CONCLUIDA':
        if (t > 280 || (t > 60 && (Input.ap('Enter') || this.toqueContinuar))) {
          this.toqueContinuar = false;
          if (this.faseIdx === FASES.length - 1 && this.ciclo === 1 && !this.venceu) { this.venceu = true; this.powerUps = []; this.tiros = []; this.trocar('VITORIA'); }
          else this.avancarFase();
        }
        break;
      case 'MORRENDO': if (t > 150) this.finalizarPartida(); break;
    }
    for (const x of this.tiros) x.update(this);
    for (const x of this.inimigos) x.update(this);
    for (const x of this.powerUps) x.update(this.player);
    this.colisoes();
    this.efeitos.update();
    if (this.tremor > 0) this.tremor *= 0.88;
    if (this.flash > 0) this.flash--;
  }
  atualizarVitoria() {
    this.fundo.update(); this.efeitos.update();
    if (this.timer % 25 === 0) this.efeitos.explosao(rnd(150, W - 150), rnd(100, 340), 40);
    if (this.timer < 60) return;
    if (Input.ap('Enter')) this.avancarFase();
    else if (Input.ap('Escape')) this.encerrarVitoria();
  }
  encerrarVitoria() { this.faseRecorde = 'Venceu!'; this.finalizarPartida(); }
  avancarFase() {
    if (++this.faseIdx >= FASES.length) { this.faseIdx = 0; this.ciclo++; this.aviso(`CICLO ${this.ciclo} — OS INIMIGOS ESTÃO MAIS FORTES!`, [255, 160, 80]); }
    this.tiros = this.tiros.filter(t => !t.inimigo);
    this.iniciarFase();
  }
  finalizarPartida() {
    if (this.faseRecorde !== 'Venceu!') this.faseRecorde = this.ciclo === 1 ? String(this.fase.n) : `${this.ciclo}-${this.fase.n}`;
    if (Dados.entraNoRanking(this.pontos)) { this.trocar('NOME'); abrirNome(this.pontos); }
    else { this.posRecorde = -1; this.trocar('GAME_OVER'); }
  }
  confirmarNome(nome) {
    nome = (nome || '').trim().slice(0, 12) || 'Piloto';
    Dados.prog.nome = nome;
    this.posRecorde = Dados.adicionar(nome, this.pontos, this.faseRecorde, this.player.tipo.nome);
    Som.tocar('powerup'); this.trocar('GAME_OVER');
  }

  gerarInimigos() {
    if (--this.spawn > 0) return;
    const prog = this.abatesFase / this.fase.meta;
    this.spawn = this.fase.intervalo * (1 - 0.3 * prog) / (1 + (this.ciclo - 1) * 0.2);
    if (this.inimigos.length >= 16) return;
    let tipo = sortearTipo(this.fase);
    const conta = id => this.inimigos.filter(i => i.tipo.id === id && i.vivo).length;
    if (tipo === T.TANQUE && conta('TANQUE') >= (this.fase.n >= 5 ? 2 : 1)) tipo = T.ZIGUE;
    if (tipo === T.ATIRADOR && conta('ATIRADOR') >= 3) tipo = T.BASICO;
    const y = 90 + rnd(H - 150), dif = this.dif();
    if ((tipo === T.BASICO || tipo === T.ZIGUE) && Math.random() < 0.3) {
      const n = 4 + Math.floor(rnd(2));
      for (let i = 0; i < n; i++) {
        let yy = tipo === T.ZIGUE ? y : y + (i % 2 === 0 ? 1 : -1) * Math.floor((i + 1) / 2) * 32;
        this.inimigos.push(new Inimigo(tipo, W + 50 + i * 50, clamp(yy, 75, H - 45), dif));
      }
      this.spawn += 50;
    } else this.inimigos.push(new Inimigo(tipo, W + 60, y, dif));
  }
  adicionarInimigo(i) { this.novos.push(i); }

  colisoes() {
    const p = this.player, rp = p.bounds();
    const temChefe = this.chefe && this.chefe.vivo && this.estado === 'CHEFE', rc = temChefe ? this.chefe.bounds() : null;
    for (const t of this.tiros) {
      if (!t.vivo || t.inimigo) continue;
      const rt = t.bounds();
      for (const i of this.inimigos) {
        if (!i.vivo || t.atingidos.has(i) || !intersecta(rt, i.bounds())) continue;
        t.atingidos.add(i); this.acertos++; this.efeitos.acerto(t.x, t.y);
        if (t.perfuracoes > 0) t.perfuracoes--; else t.vivo = false;
        if (i.danificar(t.dano)) this.matar(i); else Som.tocar('acerto');
        if (!t.vivo) break;
      }
      if (t.vivo && temChefe && !t.atingidos.has(this.chefe) && intersecta(rt, rc)) {
        t.atingidos.add(this.chefe); this.acertos++; this.efeitos.acerto(t.x, t.y);
        if (t.perfuracoes > 0) t.perfuracoes--; else t.vivo = false;
        this.danificarChefe(t.dano);
      }
    }
    if (p.laser()) {
      const rl = p.boundsLaser();
      for (const i of this.inimigos) if (i.vivo && intersecta(rl, i.bounds()) && i.danificar(0.35)) this.matar(i);
      if (temChefe && this.chefe.vivo && intersecta(rl, rc)) this.danificarChefe(0.3);
      if (this.quadro % 3 === 0) this.efeitos.faisca(p.x + 40, p.y + (Math.random() - 0.5) * 20, [230, 180, 255]);
    }
    if (p.plasma()) {
      const r = p.tipo.tam;
      for (const t of this.tiros) if (t.vivo && t.inimigo && hyp(t.x - p.x, t.y - p.y) < r + 4) { t.vivo = false; this.efeitos.faisca(t.x, t.y, [160, 255, 170]); }
      for (const i of this.inimigos) if (i.vivo && hyp(i.x - p.x, i.y - p.y) < r + i.tipo.tam / 2 && i.danificar(1.2)) this.matar(i);
    }
    if (p.vivo) {
      for (const t of this.tiros) if (t.vivo && t.inimigo && intersecta(t.bounds(), rp)) {
        if (p.vulneravel()) { t.vivo = false; this.levarDano(); } else if (p.turbo()) t.vivo = false;
      }
      for (const i of this.inimigos) {
        if (!i.vivo || !intersecta(i.bounds(), rp)) continue;
        if (p.turbo()) { if (i.danificar(6)) this.matar(i); }
        else if (p.vulneravel()) { this.levarDano(); if (i.danificar(i.tipo.id === 'TANQUE' ? 3 : 50)) this.matar(i); }
      }
      if (temChefe && this.chefe.vivo && intersecta(rc, rp) && p.vulneravel()) this.levarDano();
      for (const u of this.powerUps) if (u.vivo && intersecta(u.bounds(), rp)) { u.vivo = false; this.aplicarPowerUp(u.tipo); }
    }
    this.tiros = this.tiros.filter(t => t.vivo);
    this.inimigos = this.inimigos.filter(i => i.vivo).concat(this.novos); this.novos = [];
    this.powerUps = this.powerUps.filter(u => u.vivo);
  }
  danificarChefe(d) { this.player.ganharEnergia(d * 0.25); if (this.chefe.danificar(d)) this.derrotarChefe(); }
  mult() { return 1 + Math.min(4, Math.floor(this.combo / 10)); }
  matar(i) {
    i.vivo = false; this.abatesTotal++;
    if (i.tipo.id !== 'FRAGMENTO' && this.estado === 'JOGANDO') this.abatesFase++;
    this.combo++; this.comboTimer = 150; this.maiorCombo = Math.max(this.maiorCombo, this.combo); this.maxComboFase = Math.max(this.maxComboFase, this.combo);
    if (this.combo % 10 === 0) this.aviso(`COMBO ${this.combo}!  x${this.mult()}`, [255, 220, 90]);
    const ganho = i.tipo.pontos * this.mult() * this.ciclo;
    this.pontos += ganho;
    this.efeitos.texto(i.x, i.y - 18, '+' + ganho, this.mult() > 1 ? [255, 220, 90] : [255, 255, 255], 14);
    this.efeitos.explosao(i.x, i.y, i.tipo.tam); Som.tocar('explosao');
    this.player.ganharEnergia(i.tipo.id === 'FRAGMENTO' ? 2 : 6);
    if (i.tipo.id === 'TANQUE') this.tremer(10);
    if (i.tipo.id === 'ASTEROIDE') {
      this.asteroidesFase++;
      for (const s of [-1, 1]) this.adicionarInimigo(new Inimigo(T.FRAGMENTO, i.x, i.y, this.dif(), i.vx * 0.8 - 0.5, s * rnd(1, 2)));
    }
    if (Math.random() < i.tipo.drop || this.abatesTotal % 15 === 0)
      this.powerUps.push(new PowerUp(this.abatesTotal % 30 === 15 ? POWERUPS[0] : sortearPowerUp(), i.x, i.y));
    this.verificarDesafio();
  }
  derrotarChefe() {
    const c = this.chefe, bonus = 5000 * this.fase.n * this.ciclo;
    this.pontos += bonus;
    this.efeitos.texto(c.x, c.y - c.tam / 2, '+' + fmt(bonus), [255, 220, 90], 26);
    for (const t of this.tiros) if (t.inimigo) t.vivo = false;
    for (const i of this.inimigos) { i.vivo = false; this.efeitos.explosao(i.x, i.y, 30); }
    for (let k = 0; k < 3; k++) this.powerUps.push(new PowerUp(k === 0 ? POWERUPS[0] : sortearPowerUp(), c.x - 60, c.y - 55 + k * 55));
    this.chefeMorrendo = 0;
    if (this.fase.desafio.id === 'CHEFE_RAPIDO' && this.desafioStatus === 0) this.concluirDesafio();
    if (this.fase.n === 2 && !Dados.desbloqueada(NAVES[2])) { Dados.desbloquearTita(); this.aviso('NOVA NAVE DESBLOQUEADA: TITÃ!', [120, 255, 120]); }
  }
  concluirFase() {
    if (this.bonusAplicado) return;
    this.bonusAplicado = true;
    const d = this.fase.desafio;
    if (this.desafioStatus === 0) {
      if ((d.id === 'SEM_DANO' && !this.danoNaFase) || (d.id === 'SEM_BOMBA' && !this.bombaNaFase)) this.concluirDesafio(); else this.falharDesafio();
    }
    const bd = 2500 * this.fase.n * this.ciclo, bv = 1000 * this.player.vidas * this.ciclo;
    this.resumo = [['Chefe derrotado', '+' + fmt(5000 * this.fase.n * this.ciclo)]];
    if (this.desafioStatus === 1) { this.pontos += bd; this.resumo.push(['Desafio: ' + d.descricao, '+' + fmt(bd)]); }
    else this.resumo.push(['Desafio: ' + d.descricao, 'falhou']);
    this.pontos += bv;
    this.resumo.push([`Vidas restantes (${this.player.vidas})`, '+' + fmt(bv)], ['Maior combo', String(this.maiorCombo)]);
    this.trocar('FASE_CONCLUIDA');
  }
  verificarDesafio() {
    if (this.desafioStatus !== 0) return;
    const d = this.fase.desafio;
    if ((d.id === 'COMBO' && this.maxComboFase >= d.meta) || (d.id === 'ASTEROIDES' && this.asteroidesFase >= d.meta)) this.concluirDesafio();
  }
  concluirDesafio() {
    this.desafioStatus = 1;
    const faltava = !Dados.desbloqueada(NAVES[3]);
    Dados.somarDesafio();
    this.aviso('DESAFIO CONCLUÍDO!', [120, 255, 160]); Som.tocar('powerup');
    if (faltava && Dados.desbloqueada(NAVES[3])) this.aviso('NOVA NAVE DESBLOQUEADA: FANTASMA!', [220, 140, 255]);
  }
  falharDesafio() { if (this.desafioStatus !== 0) return; this.desafioStatus = -1; this.aviso('Desafio falhou', [255, 120, 120]); }
  levarDano() {
    const p = this.player;
    if (p.escudo) { p.escudo = false; p.invencivel = 90; this.efeitos.anel(p.x, p.y, [100, 200, 255], 80); Som.tocar('acerto'); this.tremer(6); vibrar(30); return; }
    p.vidas--; p.arma = Math.max(1, p.arma - 1); p.invencivel = 150; this.danoNaFase = true;
    if (this.fase.desafio.id === 'SEM_DANO') this.falharDesafio();
    this.combo = 0; this.tremer(18); Som.tocar('dano'); vibrar(120); this.efeitos.explosao(p.x, p.y, 40);
    if (p.vidas <= 0) { p.vivo = false; this.efeitos.explosao(p.x, p.y, 150); this.flash = 15; this.tremer(30); Som.tocar('bomba'); vibrar([100, 50, 250]); this.trocar('MORRENDO'); }
  }
  aplicarPowerUp(t) {
    const p = this.player; Som.tocar('powerup');
    let txt = t.nome;
    switch (t.id) {
      case 'ARMA': if (p.arma < 5) p.arma++; else { this.pontos += 1000; txt = 'ARMA MÁXIMA +1000'; } break;
      case 'RAPIDO': p.tiroRapido = 480; break;
      case 'ESCUDO': p.escudo = true; break;
      case 'ENERGIA': p.ganharEnergia(50); break;
      case 'BOMBA': p.bombas = Math.min(5, p.bombas + 1); break;
      case 'VIDA': p.vidas = Math.min(9, p.vidas + 1); break;
    }
    this.efeitos.texto(p.x, p.y - 32, txt, t.cor, 15); this.efeitos.anel(p.x, p.y, t.cor, 50);
  }
  detonarBomba() {
    this.bombaNaFase = true;
    if (this.fase.desafio.id === 'SEM_BOMBA') this.falharDesafio();
    Som.tocar('bomba'); this.flash = 20; this.tremer(25); vibrar(150);
    this.efeitos.anel(this.player.x, this.player.y, [255, 255, 255], 900);
    for (const t of this.tiros) if (t.inimigo) t.vivo = false;
    for (const i of this.inimigos) if (i.vivo && i.danificar(25)) this.matar(i);
    if (this.chefe && this.chefe.vivo && this.estado === 'CHEFE') this.danificarChefe(this.chefe.vidaMax * 0.05 + 15);
    this.player.invencivel = Math.max(this.player.invencivel, 60);
    this.aviso('BOMBA!', [255, 120, 90]);
  }
  tiroInimigo(x, y, a, v) { this.tiros.push(new Tiro(x, y, Math.cos(a) * v, Math.sin(a) * v, 1, true, 'ESFERA')); }
  tiroMirado(x, y, v) { this.tiroInimigo(x, y, Math.atan2(this.player.y - y, this.player.x - x), v); }
  alvoMaisProximo(x, y) {
    let m = null, md = Infinity;
    for (const i of this.inimigos) { if (!i.vivo || i.x > W + 10) continue; const d = hyp(i.x - x, i.y - y); if (d < md) { md = d; m = i; } }
    if (this.chefe && this.chefe.vivo && !this.chefe.entrando && hyp(this.chefe.x - x, this.chefe.y - y) - 80 < md) m = this.chefe;
    return m;
  }
  tremer(v) { this.tremor = Math.max(this.tremor, v); }
  aviso(s, c) { if (this.avisoTimer > 0) this.filaAvisos.push([s, c]); else { this.avisoTxt = s; this.avisoCor = c; this.avisoTimer = 110; } }

  // ---------------------------------------------------------- desenho
  desenhar(g) {
    botoes = [];
    this.fundo.desenhar(g);
    switch (this.estado) {
      case 'MENU': this.telaMenu(g); break;
      case 'SELECAO': this.telaSelecao(g); break;
      case 'COMO_JOGAR': this.telaComoJogar(g); break;
      case 'RECORDES': this.telaRecordes(g); break;
      case 'NOME': this.efeitos.desenhar(g); break;
      case 'GAME_OVER': this.efeitos.desenhar(g); this.telaGameOver(g); break;
      default: this.desenharPartida(g);
    }
    if (this.avisoTimer > 0 && this.avisoTxt && !this.pausado) {
      const t = this.avisoTimer, a = Math.min(1, t / 25), s = t > 100 ? 1 + (t - 100) * 0.04 : 1;
      g.globalAlpha = a; texto(g, this.avisoTxt, W / 2, 128, Math.round(24 * s), rgba(this.avisoCor, 1), 'center'); g.globalAlpha = 1;
    }
  }
  desenharPartida(g) {
    let sx = 0, sy = 0;
    if (this.tremor > 0.5 && !this.pausado) { sx = (Math.random() - 0.5) * this.tremor; sy = (Math.random() - 0.5) * this.tremor; }
    g.save(); g.translate(sx, sy);
    for (const u of this.powerUps) u.desenhar(g);
    for (const i of this.inimigos) i.desenhar(g);
    if (this.chefe && (this.chefe.vivo || this.chefeMorrendo < 120)) this.chefe.desenhar(g);
    for (const t of this.tiros) if (!t.inimigo) t.desenhar(g);
    this.player.desenhar(g);
    for (const t of this.tiros) if (t.inimigo) t.desenhar(g);
    this.efeitos.desenhar(g);
    g.restore();
    if (this.flash > 0) { g.fillStyle = `rgba(255,255,255,${Math.min(1, this.flash / 25)})`; g.fillRect(0, 0, W, H); }
    if (this.estado !== 'VITORIA') this.hud(g);
    if (this.estado === 'INTRO_FASE') this.telaIntro(g);
    if (this.estado === 'ALERTA_CHEFE') this.telaAlerta(g);
    if (this.estado === 'FASE_CONCLUIDA') this.telaFaseConcluida(g);
    if (this.estado === 'VITORIA') this.telaVitoria(g);
    if (this.pausado) this.telaPausa(g);
  }

  hud(g) {
    const p = this.player, q = this.quadro;
    g.fillStyle = 'rgba(4,6,18,.75)'; g.fillRect(0, 0, W, 44);
    g.fillStyle = 'rgba(120,150,255,.25)'; g.fillRect(0, 44, W, 1);
    texto(g, 'PONTOS', 12, 15, 11, CINZA);
    g.font = `800 22px ui-monospace, Menlo, Consolas, monospace`; g.textAlign = 'left'; g.fillStyle = 'rgba(0,0,0,.7)'; g.fillText(String(this.pontos).padStart(8, '0'), 14, 39); g.fillStyle = AMARELO; g.fillText(String(this.pontos).padStart(8, '0'), 12, 37);
    texto(g, 'VIDAS', 140, 15, 11, CINZA);
    const mini = imagemNave(p.tipo, 22);
    for (let i = 0; i < Math.min(5, p.vidas); i++) g.drawImage(mini, 140 + i * 20, 19);
    if (p.vidas > 5) texto(g, '+' + (p.vidas - 5), 242, 36, 15, '#fff');
    texto(g, usouToque ? 'BOMBAS' : 'BOMBAS [C]', 262, 15, 11, CINZA);
    for (let i = 0; i < p.bombas; i++) { g.fillStyle = '#ff5046'; g.beginPath(); g.arc(269 + i * 16, 29, 6, 0, Math.PI * 2); g.fill(); }
    texto(g, 'ARMA', 360, 15, 11, CINZA);
    for (let i = 0; i < 5; i++) { g.fillStyle = i < p.arma ? AMARELO : '#3c3c50'; g.fillRect(360 + i * 11, 22, 8, 13); }
    if (p.tiroRapido > 0) { texto(g, 'RÁPIDO', 422, 15, 11, '#ff8c3c'); barra(g, 422, 24, 44, 7, p.tiroRapido / 480, '#ff8c3c'); }
    const pronto = p.energia >= 100;
    texto(g, p.tipo.especial.toUpperCase() + (usouToque ? '' : ' [X]'), 482, 15, 11, pronto ? rgba(p.tipo.cor, 1) : CINZA);
    barra(g, 482, 22, 150, 13, p.energia / 100, pronto ? (pisca(q, 8) ? '#fff' : rgba(p.tipo.cor, 1)) : rgba(p.tipo.cor, 0.55));
    // fase (à direita, antes do botão de pausa)
    const fx = W - 250;
    texto(g, `FASE ${this.fase.n}${this.ciclo > 1 ? ' · CICLO ' + this.ciclo : ''}`, fx, 15, 11, CINZA);
    if (this.estado === 'CHEFE' || this.estado === 'ALERTA_CHEFE') texto(g, 'CHEFE!', fx, 37, 17, '#ff5a5a');
    else { barra(g, fx, 22, 180, 13, this.abatesFase / this.fase.meta, CIANO); texto(g, `${Math.min(this.abatesFase, this.fase.meta)} / ${this.fase.meta}`, fx + 90, 33, 11, '#fff', 'center'); }
    // botão de pausa
    caixaArredondada(g, W - 54, 5, 46, 34, 9, 'rgba(255,255,255,.08)', 'rgba(255,255,255,.3)', 1.5);
    g.fillStyle = '#fff'; g.fillRect(W - 37, 14, 4, 16); g.fillRect(W - 29, 14, 4, 16);
    botoes.push({ x: W - 62, y: 0, w: 62, h: 46, acao: () => this.pausar() });

    if (this.combo >= 3) {
      texto(g, 'COMBO ' + this.combo, 12, 70, 17, this.mult() > 1 ? AMARELO : '#fff');
      if (this.mult() > 1) texto(g, 'x' + this.mult(), 12 + largura(g, 'COMBO ' + this.combo, 17) + 10, 72, 24, '#ff823c');
    }
    // desafio
    const d = this.fase.desafio;
    let s = 'DESAFIO: ' + d.descricao;
    if (d.id === 'COMBO') s += `  (${Math.min(this.maxComboFase, d.meta)}/${d.meta})`;
    if (d.id === 'ASTEROIDES') s += `  (${Math.min(this.asteroidesFase, d.meta)}/${d.meta})`;
    if (d.id === 'CHEFE_RAPIDO' && this.chefe && this.chefe.vivo) s += `  (${Math.max(0, d.meta - Math.floor(this.chefe.tempoLuta / 60))}s)`;
    if (this.desafioStatus === 1) s += '  ✔'; if (this.desafioStatus === -1) s += '  ✘';
    texto(g, s, 12, H - 10, 11, this.desafioStatus === 1 ? '#78ff96' : this.desafioStatus === -1 ? 'rgba(255,110,110,.7)' : 'rgba(220,220,240,.8)');
    // vida do chefe
    const c = this.chefe;
    if (c && c.vivo && this.estado === 'CHEFE') {
      const w = Math.min(460, W - 420), x = W / 2 - w / 2, y = H - 36;
      texto(g, c.nome.toUpperCase() + (c.entrando ? '' : ' · ' + c.ataqueAtual()), W / 2, y - 6, 15, c.furia() ? '#ff6e6e' : '#fff', 'center');
      barra(g, x, y, w, 12, c.vida / c.vidaMax, c.furia() ? '#ff3232' : '#ff783c');
    }
    if (usouToque && ['JOGANDO', 'ALERTA_CHEFE', 'CHEFE', 'INTRO_FASE'].includes(this.estado) && !this.pausado) this.botoesToque(g);
  }
  /** Botões de poder para o celular (canto inferior direito). */
  botoesToque(g) {
    const p = this.player, pronto = p.energia >= 100;
    // ESPECIAL
    const ex = W - 78, ey = H - 82, er = 46;
    g.fillStyle = pronto ? rgba(p.tipo.cor, 0.3) : 'rgba(10,14,34,.55)'; g.beginPath(); g.arc(ex, ey, er, 0, Math.PI * 2); g.fill();
    g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = 6; g.beginPath(); g.arc(ex, ey, er - 4, 0, Math.PI * 2); g.stroke();
    g.strokeStyle = pronto && pisca(this.quadro, 10) ? '#fff' : rgba(p.tipo.cor, 1); g.lineCap = 'round';
    g.beginPath(); g.arc(ex, ey, er - 4, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * p.energia / 100); g.stroke(); g.lineCap = 'butt';
    texto(g, '★', ex, ey + 4, 30, pronto ? '#fff' : 'rgba(255,255,255,.45)', 'center');
    texto(g, pronto ? 'ESPECIAL' : Math.floor(p.energia) + '%', ex, ey + 24, 11, pronto ? '#fff' : CINZA, 'center');
    botoes.push({ x: ex - er - 8, y: ey - er - 8, w: er * 2 + 16, h: er * 2 + 16, acao: () => { if (pronto) p.querEspecial = true; else vibrar(15); } });
    // BOMBA
    const bx = W - 182, by = H - 58, br = 34, tem = p.bombas > 0;
    g.fillStyle = tem ? 'rgba(255,70,70,.28)' : 'rgba(10,14,34,.5)'; g.beginPath(); g.arc(bx, by, br, 0, Math.PI * 2); g.fill();
    g.strokeStyle = tem ? 'rgba(255,120,110,.9)' : 'rgba(255,255,255,.2)'; g.lineWidth = 3; g.stroke();
    texto(g, '💣', bx, by + 6, 24, '#fff', 'center', false);
    caixaArredondada(g, bx + 14, by - br - 2, 24, 20, 8, tem ? '#ff4b46' : '#444', null);
    texto(g, String(p.bombas), bx + 26, by - br + 13, 13, '#fff', 'center', false);
    botoes.push({ x: bx - br - 8, y: by - br - 8, w: br * 2 + 16, h: br * 2 + 16, acao: () => { if (tem) p.querBomba = true; else vibrar(15); } });
    // dica no começo
    if (this.estado === 'INTRO_FASE') texto(g, 'Deslize o dedo para mover · a nave atira enquanto você toca na tela', W / 2, H - 60, 14, 'rgba(255,255,255,.75)', 'center');
  }

  telaIntro(g) {
    const t = this.timer, a = t < 20 ? t / 20 : t > 170 ? Math.max(0, (200 - t) / 30) : 1;
    g.globalAlpha = a;
    texto(g, `FASE ${this.fase.n}${this.ciclo > 1 ? '  ·  CICLO ' + this.ciclo : ''}`, W / 2, 210, 42, AMARELO, 'center');
    texto(g, this.fase.nome, W / 2, 250, 24, '#fff', 'center');
    texto(g, `Destrua ${this.fase.meta} inimigos para enfrentar o chefe`, W / 2, 292, 15, '#c8d2f0', 'center', true, 600);
    texto(g, 'Desafio bônus: ' + this.fase.desafio.descricao, W / 2, 320, 17, '#78ffaa', 'center');
    g.globalAlpha = 1;
  }
  telaAlerta(g) {
    if (pisca(this.timer, 15)) { g.fillStyle = 'rgba(255,0,0,.16)'; g.fillRect(0, 0, W, H); texto(g, '⚠  ALERTA  ⚠', W / 2, 240, 42, '#ff4646', 'center'); }
    texto(g, this.fase.chefe.nome.toUpperCase() + ' SE APROXIMA', W / 2, 284, 22, '#fff', 'center');
  }
  telaFaseConcluida(g) {
    const w = Math.min(520, W - 40), h = 290, x = W / 2 - w / 2, y = 125;
    painel(g, x, y, w, h);
    texto(g, `FASE ${this.fase.n} CONCLUÍDA!`, W / 2, y + 50, 36, AMARELO, 'center');
    let yy = y + 98;
    this.resumo.forEach((l, i) => {
      if (this.timer < 30 + i * 25) return;
      texto(g, l[0], x + 30, yy, 15, '#fff', 'left', true, 600);
      texto(g, l[1], x + w - 30, yy, 17, l[1] === 'falhou' ? '#ff6e6e' : '#78ff96', 'right');
      yy += 32;
    });
    if (this.timer > 60) {
      texto(g, 'Total: ' + fmt(this.pontos), x + 30, y + h - 24, 17, AMARELO);
      texto(g, usouToque ? 'toque para continuar' : 'ENTER para continuar', x + w - 30, y + h - 24, 12, CINZA, 'right');
      botoes.push({ x: 0, y: 0, w: W, h: H, acao: () => { this.toqueContinuar = true; } });
    }
  }
  telaVitoria(g) {
    g.fillStyle = 'rgba(0,0,0,.45)'; g.fillRect(0, 0, W, H);
    titulo(g, 'VITÓRIA!', 165, this.quadro);
    texto(g, 'Você derrotou o Imperador Zorg e salvou a galáxia!', W / 2, 215, 18, '#fff', 'center');
    texto(g, 'Pontuação: ' + fmt(this.pontos), W / 2, 258, 26, AMARELO, 'center');
    if (this.timer > 60) {
      botao(g, '♾  Continuar no Modo Infinito', W / 2, 330, 380, 54, () => this.avancarFase(), { cor: '#78ffaa', tam: 19 });
      texto(g, 'as fases recomeçam mais difíceis e valendo mais pontos', W / 2, 372, 12, CINZA, 'center', true, 600);
      botao(g, 'Encerrar e salvar recorde', W / 2, 420, 380, 48, () => this.encerrarVitoria(), { tam: 17 });
    }
  }
  telaPausa(g) {
    g.fillStyle = 'rgba(0,0,0,.72)'; g.fillRect(0, 0, W, H);
    texto(g, 'PAUSADO', W / 2, 120, 40, '#fff', 'center');
    ['Continuar', 'Recomeçar', 'Menu principal'].forEach((s, i) => botao(g, s, W / 2, 180 + i * 62, 300, 50, () => this.acaoPausa(i), { sel: i === this.opcaoPausa, tam: 20 }));
    botao(g, Som.mudo ? '🔇  Som desligado' : '🔊  Som ligado', W / 2, 372, 300, 44, () => this.alternarSom(), { tam: 16 });
    if (!usouToque) texto(g, 'Setas/WASD mover · Espaço atirar · X especial · C bomba · P pausar · M som', W / 2, 440, 14, CINZA, 'center', true, 600);
    else texto(g, 'Deslize para mover · toque para atirar · ★ especial · 💣 bomba', W / 2, 440, 14, CINZA, 'center', true, 600);
  }

  telaMenu(g) {
    const q = this.quadro;
    g.drawImage(imagemNave(NAVES[0], 80), W * 0.14, 250 + Math.sin(q * 0.03) * 18);
    const ufo = escalada('inimigo', 60, 60);
    for (let i = 0; i < 3; i++) g.drawImage(ufo, W * 0.78 + (i % 2) * 44, 200 + i * 62 + Math.sin(q * 0.04 + i) * 14);
    titulo(g, 'NAVINHA', 112, q, 72);
    texto(g, 'E S P A C I A L', W / 2, 150, 22, CIANO, 'center');
    const ops = ['JOGAR', 'COMO JOGAR', 'RECORDES', podeInstalar() ? '📲  BAIXAR APP' : (instalado() ? '✔ APP INSTALADO' : '📲  INSTALAR')];
    ops.forEach((s, i) => botao(g, s, W / 2, 215 + i * 62, 300, 50, () => this.acaoMenu(i), { sel: i === this.opcaoMenu && !usouToque, tam: i === 0 ? 24 : 19, cor: i === 0 ? AMARELO : undefined }));
    // som e tela cheia
    botao(g, Som.mudo ? '🔇' : '🔊', W - 40, H - 36, 52, 44, () => this.alternarSom(), { tam: 20 });
    if (document.fullscreenEnabled) botao(g, '⛶', W - 100, H - 36, 52, 44, () => alternarTelaCheia(), { tam: 22 });
    if (Dados.recordes.length) { const r = Dados.recordes[0]; texto(g, `RECORDE: ${r.nome} — ${fmt(r.pontos)}`, W / 2, 480, 16, '#ffaa50', 'center'); }
    texto(g, usouToque ? 'Toque para escolher' : '↑ ↓ escolher · ENTER confirmar · M som', W / 2, 512, 12, CINZA, 'center', true, 600);
    texto(g, 'Jamerson Rafael · v' + VERSAO, 14, H - 12, 11, '#787d96', 'left', true, 600);
  }
  telaSelecao(g) {
    texto(g, 'ESCOLHA SUA NAVE', W / 2, 52, 34, '#fff', 'center');
    const n = NAVES.length, gap = 12, cw = Math.min(210, (W - 40 - gap * (n - 1)) / n), ch = 372;
    const x0 = W / 2 - (n * cw + (n - 1) * gap) / 2;
    NAVES.forEach((nv, i) => {
      const sel = i === this.naveSel, livre = Dados.desbloqueada(nv), x = x0 + i * (cw + gap), y = sel ? 76 : 86, cx = x + cw / 2;
      painel(g, x, y, cw, ch);
      if (sel) caixaArredondada(g, x, y, cw, ch, 14, null, rgba(nv.cor, 1), 3);
      let img = imagemNave(nv, 92); if (!livre) img = cinza(img);
      g.drawImage(img, cx - 46, y + 16 + (sel ? Math.sin(this.quadro * 0.06) * 5 : 0));
      texto(g, nv.nome.toUpperCase(), cx, y + 140, 22, livre ? rgba(nv.cor, 1) : CINZA, 'center');
      if (!livre) {
        texto(g, '🔒 BLOQUEADA', cx, y + 180, 15, '#ff7878', 'center');
        quebrar(g, 'Para liberar: ' + nv.condicao, x + 14, y + 212, cw - 28, 13, CINZA);
        if (nv.id === 'FANTASMA') texto(g, `Concluídos: ${Dados.prog.desafios || 0}/3`, cx, y + 280, 15, AMARELO, 'center');
      } else {
        quebrar(g, nv.desc, x + 14, y + 166, cw - 28, 13, '#fff');
        const vals = [['Velocidade', nv.vel / 6.3], ['Resistência', nv.vidas / 5], ['Poder de fogo', Math.min(1, nv.dano * 60 / nv.cadencia / 8 + (nv.perfurante ? 0.2 : 0))]];
        vals.forEach(([r, v], k) => { texto(g, r, x + 14, y + 216 + k * 32, 11, CINZA); barra(g, x + 14, y + 221 + k * 32, cw - 28, 8, v, rgba(nv.cor, 1)); });
        texto(g, 'ESPECIAL: ' + nv.especial, x + 14, y + 324, 11, AMARELO);
        quebrar(g, nv.descEsp, x + 14, y + 342, cw - 28, 11, '#fff');
      }
      botoes.push({ x, y, w: cw, h: ch, acao: () => { Som.tocar('menu'); this.escolherNave(i); } });
    });
    const nv = NAVES[this.naveSel];
    if (usouToque) {
      botao(g, '← Voltar', 90, H - 34, 140, 44, () => this.trocar('MENU'), { tam: 16 });
      if (Dados.desbloqueada(nv)) botao(g, `🚀 Decolar com ${nv.nome}`, W / 2, H - 34, 300, 48, () => { this.naveSel = this.naveSel; telaCheia(); this.novaPartida(nv); }, { cor: AMARELO, tam: 18 });
    } else texto(g, '← → escolher  ·  ENTER decolar  ·  ESC voltar  ·  (ou clique)', W / 2, H - 26, 15, CINZA, 'center');
  }
  telaComoJogar(g) {
    texto(g, 'COMO JOGAR', W / 2, 46, 32, '#fff', 'center');
    const cw = Math.min(450, (W - 50) / 2), x1 = W / 2 - cw - 6, x2 = W / 2 + 6;
    painel(g, x1, 64, cw, 420); painel(g, x2, 64, cw, 420);
    texto(g, 'CONTROLES', x1 + 18, 92, 15, AMARELO);
    const c = usouToque
      ? [['Deslizar o dedo', 'mover a nave'], ['Dedo na tela', 'atira sem parar'], ['Botão ★', 'poder especial'], ['Botão 💣', 'bomba'], ['Botão ❚❚', 'pausar']]
      : [['Setas / WASD', 'mover'], ['Espaço', 'atirar (segure)'], ['X', 'poder especial'], ['C', 'bomba'], ['P / Esc', 'pausar'], ['M', 'som']];
    c.forEach(([a, b], i) => { texto(g, a, x1 + 18, 118 + i * 24, 14, CIANO); texto(g, b, x1 + 170, 118 + i * 24, 14, '#fff', 'left', true, 600); });
    texto(g, 'REGRAS', x1 + 18, 270, 15, AMARELO);
    ['Cumpra a meta de abates e o chefe aparece.', 'Abates seguidos fazem COMBO (até x5).', 'Destruir inimigos enche o ESPECIAL.', 'Levar dano tira 1 vida e 1 nível de arma.', 'Cumpra o DESAFIO da fase: ganha bônus', 'e desbloqueia naves novas.']
      .forEach((s, i) => texto(g, '• ' + s, x1 + 18, 296 + i * 22, 13, '#fff', 'left', true, 600));
    texto(g, 'POWER-UPS', x2 + 18, 92, 15, AMARELO);
    POWERUPS.forEach((t, i) => {
      new PowerUp(t, x2 + 34, 116 + i * 34).desenhar(g);
      texto(g, t.nome, x2 + 60, 114 + i * 34, 14, rgba(t.cor, 1)); texto(g, t.desc, x2 + 60, 128 + i * 34, 11, CINZA, 'left', true, 600);
    });
    texto(g, 'INIMIGOS', x2 + 18, 334, 15, AMARELO);
    ['BASICO', 'ZIGUE', 'ATIRADOR', 'KAMIKAZE', 'TANQUE', 'ASTEROIDE'].forEach((id, i) => {
      const col = i % 2, lin = Math.floor(i / 3 * 1.5), xx = x2 + 40 + col * (cw / 2), yy = 368 + Math.floor(i / 2) * 40;
      const im = imagemInimigo(T[id], 0), s = Math.min(34, im.width);
      g.drawImage(im, xx - s / 2, yy - s * im.height / im.width / 2, s, s * im.height / im.width);
      texto(g, T[id].nome, xx + 26, yy + 5, 12, '#fff');
    });
    botao(g, '← Voltar', W / 2, H - 28, 180, 42, () => this.trocar('MENU'), { tam: 16 });
  }
  tabelaRecordes(g, y, destaque) {
    const w = Math.min(620, W - 40), x = W / 2 - w / 2;
    painel(g, x, y, w, 372);
    [['#', 24], ['PILOTO', 70], ['NAVE', w * 0.5], ['FASE', w * 0.68]].forEach(([s, dx]) => texto(g, s, x + dx, y + 28, 11, CINZA));
    texto(g, 'PONTOS', x + w - 24, y + 28, 11, CINZA, 'right');
    if (!Dados.recordes.length) texto(g, 'Nenhum recorde ainda. Seja o primeiro!', W / 2, y + 110, 17, CINZA, 'center');
    const med = ['#ffcd3c', '#c8d2e1', '#d78c50'];
    Dados.recordes.forEach((r, i) => {
      const yy = y + 62 + i * 31, c = med[i] || '#fff';
      if (i === destaque) { g.fillStyle = `rgba(255,214,80,${pisca(this.quadro, 20) ? 0.2 : 0.1})`; g.fillRect(x + 8, yy - 21, w - 16, 29); }
      texto(g, (i + 1) + 'º', x + 22, yy, 16, c); texto(g, r.nome, x + 70, yy, 16, i === destaque ? AMARELO : '#fff');
      texto(g, r.nave, x + w * 0.5, yy, 14, CINZA, 'left', true, 600); texto(g, String(r.fase), x + w * 0.68, yy, 14, CINZA, 'left', true, 600);
      texto(g, fmt(r.pontos), x + w - 24, yy, 16, c, 'right');
    });
  }
  telaRecordes(g) {
    texto(g, 'RECORDES', W / 2, 54, 34, '#fff', 'center');
    this.tabelaRecordes(g, 80, -1);
    botao(g, '← Voltar', W / 2, H - 34, 180, 44, () => this.trocar('MENU'), { tam: 16 });
  }
  telaGameOver(g) {
    const v = this.faseRecorde === 'Venceu!', p = this.player;
    texto(g, v ? 'MISSÃO CUMPRIDA' : 'FIM DE JOGO', W / 2, 46, 34, v ? AMARELO : '#ff5050', 'center');
    const prec = Math.min(100, Math.round(this.acertos * 100 / Math.max(1, p.tirosDisparados)));
    texto(g, `${fmt(this.pontos)} pts · Fase ${this.faseRecorde} · ${this.abatesTotal} abates · Precisão ${prec}% · Combo máx. ${this.maiorCombo}`, W / 2, 76, 15, '#fff', 'center', true, 700);
    this.tabelaRecordes(g, 92, this.posRecorde);
    if (this.timer > 40) {
      botao(g, 'Menu', W / 2 - 130, H - 34, 200, 46, () => this.trocar('MENU'), { tam: 17 });
      botao(g, '↻ Jogar de novo', W / 2 + 110, H - 34, 220, 46, () => this.novaPartida(p.tipo), { tam: 17, cor: AMARELO });
    }
  }
}

// ============================================================ nome do recorde (input HTML)
const telaNome = document.getElementById('tela-nome'), campoNome = document.getElementById('campo-nome');
function abrirNome(pontos) {
  document.getElementById('nome-pontos').textContent = fmt(pontos) + ' pontos';
  campoNome.value = Dados.prog.nome || '';
  telaNome.classList.add('ativo');
  setTimeout(() => { campoNome.focus(); campoNome.select(); }, 250);
}
document.getElementById('form-nome').addEventListener('submit', e => {
  e.preventDefault(); campoNome.blur(); telaNome.classList.remove('ativo'); jogo.confirmarNome(campoNome.value);
});

// ============================================================ tela, orientação e tela cheia
let jogarRetrato = false;
function redimensionar() {
  const vw = innerWidth, vh = innerHeight;
  dpr = Math.min(2, window.devicePixelRatio || 1);
  W = Math.round(clamp(H * vw / vh, 800, 1200));
  escala = Math.min(vw / W, vh / H);
  offX = (vw - W * escala) / 2; offY = (vh - H * escala) / 2;
  cv.width = Math.round(vw * dpr); cv.height = Math.round(vh * dpr);
  document.getElementById('girar').classList.toggle('ativo', isTouch && vh > vw && !jogarRetrato);
}
addEventListener('resize', redimensionar);
addEventListener('orientationchange', () => setTimeout(redimensionar, 200));
document.getElementById('jogar-assim').addEventListener('click', () => { jogarRetrato = true; redimensionar(); });
function telaCheia() {
  if (!isTouch || document.fullscreenElement || !document.documentElement.requestFullscreen) return;
  document.documentElement.requestFullscreen({ navigationUI: 'hide' }).then(() => {
    if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(() => {});
  }).catch(() => {});
}
function alternarTelaCheia() {
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  else document.documentElement.requestFullscreen().catch(() => {});
}

// ============================================================ PWA: instalar e atualizar
let pedidoInstalacao = null;
addEventListener('beforeinstallprompt', e => { e.preventDefault(); pedidoInstalacao = e; });
addEventListener('appinstalled', () => { pedidoInstalacao = null; jogo.aviso('APP INSTALADO! 🎉', [120, 255, 160]); });
const instalado = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const podeInstalar = () => !!pedidoInstalacao;
function instalar() {
  if (pedidoInstalacao) { pedidoInstalacao.prompt(); pedidoInstalacao.userChoice.finally(() => { pedidoInstalacao = null; }); }
  else if (instalado()) jogo.aviso('O jogo já está instalado neste aparelho', [120, 255, 160]);
  else if (/iphone|ipad|ipod/i.test(navigator.userAgent)) document.getElementById('tela-ios').classList.add('ativo');
  else jogo.aviso('Use o menu do navegador → "Instalar app" ou "Adicionar à tela inicial"', [255, 214, 80]);
}
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  navigator.serviceWorker.register('sw.js').then(reg => {
    const avisar = sw => {
      const el = document.getElementById('aviso-atualizacao'); el.classList.add('ativo');
      document.getElementById('botao-atualizar').onclick = () => sw.postMessage('atualizar');
    };
    if (reg.waiting && navigator.serviceWorker.controller) avisar(reg.waiting);
    reg.addEventListener('updatefound', () => {
      const sw = reg.installing;
      sw.addEventListener('statechange', () => { if (sw.state === 'installed' && navigator.serviceWorker.controller) avisar(sw); });
    });
    // procura atualização sempre que o app volta para a tela
    document.addEventListener('visibilitychange', () => { if (!document.hidden) reg.update().catch(() => {}); });
  }).catch(() => {});
  let recarregou = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (!recarregou) { recarregou = true; location.reload(); } });
}

// ============================================================ loop principal
let jogo;
let ultimo = performance.now(), acumulado = 0;
function quadro(agora) {
  acumulado += agora - ultimo; ultimo = agora;
  if (acumulado > PASSO * 5) acumulado = PASSO * 5;
  while (acumulado >= PASSO) {
    try { jogo.atualizar(); } catch (e) { console.error(e); }
    Input.fimQuadro();
    acumulado -= PASSO;
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, cv.width, cv.height);
  ctx.setTransform(escala * dpr, 0, 0, escala * dpr, offX * dpr, offY * dpr);
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip();
  try { jogo.desenhar(ctx); } catch (e) { console.error(e); }
  ctx.restore();
  requestAnimationFrame(quadro);
}

Dados.carregar();
redimensionar();
Promise.all([carregarImagem('nave', 'assets/nave.png'), carregarImagem('inimigo', 'assets/inimigo.png'), carregarImagem('tiro', 'assets/tiro.png')]).then(() => {
  jogo = new Jogo();
  window.__jogo = jogo;   // facilita testes pelo console
  requestAnimationFrame(t => { ultimo = t; quadro(t); });
});
