/* Navinha Espacial 3.0 — versão web.
 * Arquivos: arte.js (sprites), dados.js (naves, peças, progresso), jogo.js (este: regras, telas e loop).
 * Celular: deslize (ou joystick) para mover; a nave atira enquanto o dedo está na tela; ★ especial, 💣 bomba, ❚❚ pausa.
 * PC: setas/WASD, Espaço, X, C, P/Esc, M. */
'use strict';

const VERSAO = '3.3.1';
const H = 540;
let W = 960;
const PASSO = 1000 / 60;
const cv = document.getElementById('jogo');
const ctx = cv.getContext('2d');
let escala = 1, offX = 0, offY = 0, dpr = 1;

// ============================================================ utilidades
const rnd = (a = 1, b) => b === undefined ? Math.random() * a : a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const hyp = Math.hypot;
const intersecta = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
const fmt = n => Math.floor(n).toLocaleString('pt-BR');
const isTouch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
let usouToque = isTouch;
const cache = new Map();
function brilho(cor, raio) {
  const k = `glow${cor}@${raio}`;
  if (cache.has(k)) return cache.get(k);
  const c = document.createElement('canvas'); c.width = c.height = raio * 2;
  const g = c.getContext('2d'), gr = g.createRadialGradient(raio, raio, 0, raio, raio, raio);
  gr.addColorStop(0, '#fff'); gr.addColorStop(0.35, rgba(cor, 1)); gr.addColorStop(0.6, rgba(cor, 0.43)); gr.addColorStop(1, rgba(cor, 0));
  g.fillStyle = gr; g.fillRect(0, 0, raio * 2, raio * 2);
  cache.set(k, c); return c;
}
function vibrar(ms) { if (usouToque && Config.vibrar && navigator.vibrate) try { navigator.vibrate(ms); } catch (_) {} }
function desenharCentro(g, img, x, y, rot) {
  if (rot) { g.save(); g.translate(x, y); g.rotate(rot); g.drawImage(img, -img.width / 2, -img.height / 2); g.restore(); }
  else g.drawImage(img, Math.round(x - img.width / 2), Math.round(y - img.height / 2));
}

// ============================================================ som
const Som = {
  ac: null, buf: {}, mestre: null, musica: null, faixa: null, ultimo: {}, mudo: armaz.ler('navinha.mudo') === '1',
  arquivos: { tiro: ['som_tiro', 0.16], explosao: ['som_explosao', 0.32], powerup: ['powerup', 0.45], dano: ['dano', 0.6], alerta: ['alerta', 0.4],
    especial: ['especial', 0.5], bomba: ['bomba', 0.65], acerto: ['acerto', 0.13], menu: ['menu', 0.3], moeda: ['moeda', 0.22], raio: ['raio', 0.25],
    compra: ['compra', 0.5], erro: ['erro', 0.4] },
  iniciar() {
    if (this.ac) { if (this.ac.state === 'suspended') this.ac.resume(); if (this.faixa && this.musica && this.musica.paused && !this.mudo) this.musica.play().catch(() => {}); return; }
    try {
      this.ac = new (window.AudioContext || window.webkitAudioContext)();
      this.mestre = this.ac.createGain(); this.mestre.gain.value = Config.efeitos; this.mestre.connect(this.ac.destination);
      for (const [nome, [arq]] of Object.entries(this.arquivos))
        fetch(`assets/${arq}.mp3`).then(r => r.arrayBuffer()).then(b => this.ac.decodeAudioData(b)).then(a => { this.buf[nome] = a; }).catch(() => {});
    } catch (e) { this.ac = null; }
    this.tocarMusica(this.faixa || 'musica_menu');
  },
  tocar(nome) {
    if (this.mudo || !this.ac || !this.buf[nome]) return;
    const t = performance.now(), min = nome === 'tiro' ? 70 : nome === 'acerto' || nome === 'moeda' ? 40 : 25;
    if (t - (this.ultimo[nome] || 0) < min) return;
    this.ultimo[nome] = t;
    const s = this.ac.createBufferSource(), g = this.ac.createGain();
    s.buffer = this.buf[nome]; g.gain.value = this.arquivos[nome][1];
    s.connect(g).connect(this.mestre); s.start();
  },
  tocarMusica(faixa) {
    if (this.faixa === faixa && this.musica) { if (!this.mudo && this.musica.paused && this.ac) this.musica.play().catch(() => {}); return; }
    this.faixa = faixa;
    if (!this.ac) return;                       // ainda sem interação: começa no primeiro toque
    if (this.musica) this.musica.pause();
    this.musica = new Audio(`assets/${faixa}.mp3`);
    this.musica.loop = true; this.musica.volume = 0.55 * Config.musica; this.musica.playbackRate = this.ritmo || 1; this.musica.preservesPitch = false;
    if (!this.mudo) this.musica.play().catch(() => {});
  },
  velocidadeMusica(v) { this.ritmo = v; if (this.musica) { this.musica.playbackRate = v; this.musica.preservesPitch = false; } },
  aplicarVolumes() { if (this.mestre) this.mestre.gain.value = Config.efeitos; if (this.musica) this.musica.volume = 0.55 * Config.musica; },
  alternar() {
    this.mudo = !this.mudo; armaz.gravar('navinha.mudo', this.mudo ? '1' : '0');
    if (this.musica) { if (this.mudo) this.musica.pause(); else this.musica.play().catch(() => {}); }
    return this.mudo;
  },
  pausarMusica(p) { if (this.musica && !this.mudo) { if (p) this.musica.pause(); else this.musica.play().catch(() => {}); } },
};

// ============================================================ inimigos
const TIPOS = {
  BASICO:    { nome: 'Disco', vida: 1, pontos: 100, tam: 38, drop: 0.07, moeda: 0.3 },
  ZIGUE:     { nome: 'Arraia', vida: 1, pontos: 150, tam: 36, drop: 0.08, moeda: 0.35 },
  ATIRADOR:  { nome: 'Atirador', vida: 4, pontos: 250, tam: 42, drop: 0.2, moeda: 0.6 },
  KAMIKAZE:  { nome: 'Kamikaze', vida: 1, pontos: 200, tam: 32, drop: 0.07, moeda: 0.4 },
  TANQUE:    { nome: 'Encouraçado', vida: 14, pontos: 600, tam: 64, drop: 0.65, moeda: 1 },
  ASTEROIDE: { nome: 'Asteroide', vida: 5, pontos: 80, tam: 50, drop: 0.05, moeda: 0.25 },
  FRAGMENTO: { nome: 'Fragmento', vida: 1, pontos: 40, tam: 24, drop: 0.02, moeda: 0.1 },
  MINA:      { nome: 'Mina', vida: 3, pontos: 120, tam: 30, drop: 0.06, moeda: 0.3 },
  ESCUDEIRO: { nome: 'Escudeiro', vida: 6, pontos: 300, tam: 42, drop: 0.25, moeda: 0.7 },
  TELEPORTE: { nome: 'Teleportador', vida: 4, pontos: 280, tam: 34, drop: 0.15, moeda: 0.6 },
  ENXAME:    { nome: 'Enxame', vida: 1, pontos: 50, tam: 22, drop: 0.03, moeda: 0.15 },
  TORRE:     { nome: 'Torre', vida: 6, pontos: 220, tam: 38, drop: 0.15, moeda: 0.6 },
  LASER:     { nome: 'Lança-laser', vida: 5, pontos: 350, tam: 52, drop: 0.25, moeda: 0.8 },
};
for (const k in TIPOS) TIPOS[k].id = k;
const T = TIPOS;
function imagemInimigo(t, variante = 0) {
  if (t.id === 'ASTEROIDE') return Arte.asteroide(variante, t.tam);
  if (t.id === 'FRAGMENTO') return Arte.asteroide(variante + 3, t.tam);
  return Arte.inimigo(t.id === 'TELEPORTE' ? 'TELEPORTE' : t.id);
}

class Inimigo {
  constructor(tipo, x, y, dif, vx, vy) {
    this.tipo = tipo; this.x = x; this.y = y; this.baseY = y; this.dif = dif;
    this.vidaMax = tipo.vida * (tipo.id === 'FRAGMENTO' || tipo.id === 'ENXAME' ? 1 : 0.75 + dif * 0.25); this.vida = this.vidaMax;
    this.vivo = true; this.flash = 0; this.idade = 0; this.recarga = 60 + rnd(60);
    this.alvoX = W - 300 + rnd(220); this.fase = rnd(Math.PI * 2); this.rot = 0; this.vrot = (Math.random() - 0.5) * 0.06;
    this.vx = 0; this.vy = 0; this.protegido = false; this.alpha = 1; this.estadoLaser = 0; this.timerLaser = 90;
    switch (tipo.id) {
      case 'BASICO': this.vx = -rnd(1.8, 2.5) * dif; break;
      case 'ZIGUE': this.vx = -2.3 * dif; break;
      case 'ATIRADOR': case 'ESCUDEIRO': case 'TELEPORTE': case 'LASER': this.vx = -3; break;
      case 'KAMIKAZE': this.vx = -1.5; break;
      case 'TANQUE': this.vx = -1; break;
      case 'MINA': this.vx = -rnd(0.9, 1.4); break;
      case 'ENXAME': this.vx = -rnd(2.6, 3.2) * dif; break;
      case 'TORRE': this.vx = -1.2; this.teto = y < H / 2; break;
      case 'ASTEROIDE': this.vx = -rnd(1.2, 2.4) * dif; this.vy = (Math.random() - 0.5) * 1.1; break;
    }
    if (vx !== undefined) { this.vx = vx; this.vy = vy; }
    this.img = imagemInimigo(tipo, Math.floor(rnd(3)));
  }
  update(j) {
    this.idade++; if (this.flash > 0) this.flash--;
    const p = j.player, dif = this.dif, id = this.tipo.id;
    const pairar = (amp) => {
      if (this.idade < 600) { this.x += (this.alvoX - this.x) * 0.03; this.y = this.baseY + Math.sin(this.idade * 0.02 + this.fase) * amp; }
      else this.x -= 4.2;
    };
    switch (id) {
      case 'BASICO': case 'ENXAME':
        this.x += this.vx;
        if (id === 'ENXAME') { this.y += Math.sin(this.idade * 0.12 + this.fase) * 1.6 + clamp(p.y - this.y, -1, 1) * 0.6; }
        break;
      case 'ZIGUE': this.x += this.vx; this.y = this.baseY + Math.sin(this.idade * 0.05 + this.fase) * 60; break;
      case 'ATIRADOR':
        pairar(32);
        if (--this.recarga <= 0 && this.x < W - 25 && p.vivo) { j.tiroMirado(this.x - 18, this.y, 3.2 * dif); this.recarga = 100 / dif; }
        break;
      case 'ESCUDEIRO': pairar(50); break;
      case 'TELEPORTE':
        pairar(20);
        if (--this.recarga <= 0 && this.idade < 600) {
          this.recarga = 130 / dif;
          j.efeitos.anel(this.x, this.y, [196, 58, 216], 30);
          let nx, ny, t = 0;
          do { nx = rnd(W * 0.45, W - 60); ny = rnd(80, H - 50); t++; } while (hyp(nx - p.x, ny - p.y) < 220 && t < 10);
          this.x = this.alvoX = nx; this.baseY = this.y = ny; this.alpha = 0;
          j.efeitos.anel(nx, ny, [196, 58, 216], 30);
          const a = Math.atan2(p.y - ny, p.x - nx);
          for (let i = -1; i <= 1; i++) j.tiroInimigo(nx - 10, ny, a + i * 0.2, 3 * dif, [220, 90, 255]);
        }
        this.alpha = Math.min(1, this.alpha + 0.08);
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
      case 'MINA':
        this.x += this.vx; this.y = this.baseY + Math.sin(this.idade * 0.04 + this.fase) * 12;
        if (p.vivo && hyp(p.x - this.x, p.y - this.y) < 80 && !this.armada) { this.armada = 40; }
        if (this.armada && --this.armada <= 0) { this.vivo = false; j.explodirMina(this, false); }
        break;
      case 'TORRE':
        this.x += this.vx;
        if (--this.recarga <= 0 && this.x < W - 20 && this.x > 40 && p.vivo) { j.tiroMirado(this.x, this.y + (this.teto ? 10 : -10), 3 * dif); this.recarga = 95 / dif; }
        break;
      case 'LASER':
        if (this.idade < 700) {
          this.x += (this.alvoX - this.x) * 0.03;
          if (this.estadoLaser === 0) { this.y += clamp(p.y - this.y, -1.4, 1.4); if (--this.timerLaser <= 0) { this.estadoLaser = 1; this.timerLaser = 60; } }
          else if (this.estadoLaser === 1) { if (--this.timerLaser <= 0) { this.estadoLaser = 2; this.timerLaser = 40; Som.tocar('raio'); } }
          else if (--this.timerLaser <= 0) { this.estadoLaser = 0; this.timerLaser = 110 / dif; }
        } else { this.x -= 4.2; this.estadoLaser = 0; }
        break;
      default:
        this.x += this.vx; this.y += this.vy; this.rot += this.vrot;
        if (this.y < 55 || this.y > H - 16) this.vy = -this.vy;
    }
    if (this.x < -120 || this.x > W + 900 || this.y < -150 || this.y > H + 150) this.vivo = false;
  }
  danificar(d) { if (this.protegido) d *= 0.3; this.vida -= d; this.flash = 4; if (this.vida <= 0) { this.vivo = false; return true; } return false; }
  bounds() {
    const t = this.tipo.tam * 0.8, achatado = ['BASICO', 'ZIGUE', 'ATIRADOR', 'TANQUE', 'LASER'].includes(this.tipo.id), h = achatado ? t * 0.65 : t;
    return { x: this.x - t / 2, y: this.y - h / 2, w: t, h };
  }
  boundsLaser() { return this.estadoLaser === 2 ? { x: 0, y: this.y - 8, w: this.x - 20, h: 16 } : null; }
  desenhar(g) {
    const i = this.flash > 0 ? Arte.branco(this.img) : this.img, id = this.tipo.id;
    if (id === 'LASER' && this.estadoLaser > 0) {
      if (this.estadoLaser === 1) { g.fillStyle = `rgba(255,60,60,${0.3 + 0.3 * Math.sin(this.idade * 0.6)})`; g.fillRect(0, this.y - 1, this.x - 20, 2); }
      else {
        g.fillStyle = 'rgba(95,240,255,.35)'; g.fillRect(0, this.y - 10, this.x - 20, 20);
        g.fillStyle = '#e8ffff'; g.fillRect(0, this.y - 4, this.x - 20, 8);
      }
    }
    g.globalAlpha = this.alpha;
    const girar = id === 'ASTEROIDE' || id === 'FRAGMENTO' ? this.rot : id === 'KAMIKAZE' && this.idade >= 45 ? Math.atan2(this.vy, this.vx) + Math.PI : 0;
    if (id === 'TORRE' && this.teto) { g.save(); g.translate(this.x, this.y); g.scale(1, -1); g.drawImage(i, -i.width / 2, -i.height / 2); g.restore(); }
    else desenharCentro(g, i, this.x, this.y, girar);
    if (id === 'MINA' && this.armada && this.armada % 8 < 4) { g.globalAlpha = 0.8; desenharCentro(g, Arte.branco(this.img), this.x, this.y); }
    g.globalAlpha = 1;
    if (this.protegido) { g.strokeStyle = 'rgba(110,190,255,.7)'; g.lineWidth = 2; g.beginPath(); g.arc(this.x, this.y, this.tipo.tam * 0.6, 0, Math.PI * 2); g.stroke(); }
    if (['TANQUE', 'ATIRADOR', 'ESCUDEIRO', 'LASER', 'TORRE'].includes(id) && this.vida < this.vidaMax) {
      const bw = this.tipo.tam - 10;
      g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(this.x - bw / 2, this.y - i.height / 2 - 7, bw, 4);
      g.fillStyle = '#ff5050'; g.fillRect(this.x - bw / 2, this.y - i.height / 2 - 7, bw * Math.max(0, this.vida / this.vidaMax), 4);
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
  CHEFE_RAPIDO: { texto: m => `Derrote o chefe em até ${m}s`, meta: 90 },
};
for (const k in DESAFIOS) { DESAFIOS[k].id = k; DESAFIOS[k].descricao = DESAFIOS[k].texto(DESAFIOS[k].meta); }
const FASES = [
  { n: 1, nome: 'Cinturão de Órion', tipos: [[T.BASICO, 6], [T.ZIGUE, 3], [T.ENXAME, 2]], meta: 25, intervalo: 55, vel: 1.0, desafio: DESAFIOS.COMBO,
    chefe: { arte: 'OMEGA', nome: 'Nave-Mãe Ômega', vida: 220, invoca: T.BASICO,
      partes: [['canhao', -64, -22, 30], ['canhao', -64, 22, 30], ['hangar', 20, -38, 40]],
      formas: [[ATQ.LEQUE], [ATQ.LEQUE, ATQ.ANEL], [ATQ.ANEL, ATQ.ESPIRAL, ATQ.INVOCAR]] },
    ceu: ['#04061a', '#0a1028'], neb: [[40, 70, 160], [90, 40, 140]], planeta: ['#5a7ad0', '#9ab8f0', false] },
  { n: 2, nome: 'Campo de Asteroides', tipos: [[T.ASTEROIDE, 5], [T.BASICO, 2], [T.KAMIKAZE, 2], [T.MINA, 2]], meta: 30, intervalo: 48, vel: 1.08, desafio: DESAFIOS.ASTEROIDES,
    chefe: { arte: 'DEVORADOR', nome: 'Devorador de Rochas', vida: 340, invoca: T.ASTEROIDE,
      partes: [['garra', -70, -36, 45], ['garra', -70, 36, 45]],
      formas: [[ATQ.LEQUE, ATQ.INVOCAR], [ATQ.ESPIRAL, ATQ.INVOCAR], [ATQ.ANEL, ATQ.ESPIRAL, ATQ.RAJADA]] },
    ceu: ['#0e0a08', '#1e1610'], neb: [[140, 90, 40], [80, 60, 60]], planeta: ['#c86a3a', '#f0a060', true] },
  { n: 3, nome: 'Nebulosa Carmesim', tipos: [[T.ATIRADOR, 3], [T.ZIGUE, 2], [T.KAMIKAZE, 2], [T.TELEPORTE, 2], [T.TORRE, 2]], meta: 35, intervalo: 44, vel: 1.15, desafio: DESAFIOS.SEM_DANO,
    chefe: { arte: 'RAINHA', nome: 'Rainha Carmesim', vida: 460, invoca: T.KAMIKAZE,
      partes: [['ferrao', -86, 0, 50], ['missil', 26, -44, 40], ['missil', 26, 44, 40]],
      formas: [[ATQ.ESPIRAL, ATQ.RAJADA], [ATQ.RAJADA, ATQ.INVOCAR], [ATQ.ANEL, ATQ.ESPIRAL, ATQ.RAJADA]] },
    ceu: ['#14040c', '#280814'], neb: [[180, 30, 70], [120, 20, 120]], planeta: ['#a02a5a', '#e06a9a', false] },
  { n: 4, nome: 'Fronteira Sombria', tipos: [[T.TANQUE, 1], [T.ATIRADOR, 2], [T.ESCUDEIRO, 2], [T.LASER, 2], [T.MINA, 2], [T.KAMIKAZE, 2]], meta: 40, intervalo: 42, vel: 1.22, desafio: DESAFIOS.SEM_BOMBA,
    chefe: { arte: 'SENTINELA', nome: 'Sentinela Sombria', vida: 600, invoca: T.ATIRADOR,
      partes: [['canhao', -76, -44, 45], ['canhao', -76, 44, 45], ['missil', 62, -50, 45], ['hangar', 50, 50, 50]],
      formas: [[ATQ.LEQUE, ATQ.MURO], [ATQ.RAJADA, ATQ.MURO], [ATQ.ANEL, ATQ.MURO, ATQ.RAJADA]] },
    ceu: ['#06040e', '#100a1c'], neb: [[80, 40, 140], [30, 90, 110]], planeta: ['#3a3a6a', '#6a6aa0', true] },
  { n: 5, nome: 'Núcleo Alienígena', tipos: [[T.BASICO, 1], [T.ZIGUE, 2], [T.ATIRADOR, 2], [T.KAMIKAZE, 2], [T.TANQUE, 1], [T.TELEPORTE, 2], [T.LASER, 2], [T.ESCUDEIRO, 1], [T.ENXAME, 2]], meta: 45, intervalo: 38, vel: 1.3, desafio: DESAFIOS.CHEFE_RAPIDO,
    chefe: { arte: 'ZORG', nome: 'Imperador Zorg', vida: 900, invoca: T.KAMIKAZE,
      partes: [['canhao', -84, -34, 60], ['canhao', -84, 34, 60], ['missil', 14, -60, 55], ['missil', 14, 60, 55], ['ferrao', -104, 0, 60]],
      formas: [[ATQ.LEQUE, ATQ.ESPIRAL], [ATQ.RAJADA, ATQ.INVOCAR, ATQ.MURO], [ATQ.ANEL, ATQ.ESPIRAL, ATQ.MURO, ATQ.RAJADA]] },
    ceu: ['#020e0a', '#061e16'], neb: [[30, 160, 100], [160, 140, 30]], planeta: ['#2a9a6a', '#8af0b0', false] },
];
function sortearTipo(f) {
  const tot = f.tipos.reduce((s, t) => s + t[1], 0);
  let r = rnd(tot);
  for (const [t, p] of f.tipos) { r -= p; if (r < 0) return t; }
  return f.tipos[0][0];
}

class ParteChefe {
  constructor(tipo, dx, dy, vida) { Object.assign(this, { tipo, dx, dy, vidaMax: vida, vida, vivo: true, flash: 0, recarga: 60 + rnd(60), rajada: 0 }); this.img = Arte.parte(tipo); }
  bounds(c) { const w = this.img.width * 0.85, h = this.img.height * 0.85; return { x: c.x + this.dx - w / 2, y: c.y + this.dy - h / 2, w, h }; }
}

class Chefe {
  constructor(info, dif, mult) {
    Object.assign(this, { info, nome: info.nome, vidaMax: info.vida * mult, dif });
    this.vida = this.vidaMax; this.vivo = true; this.entrando = true; this.flash = 0; this.tempoLuta = 0; this.forma = 1;
    this.partes = info.partes.map(([t, dx, dy, v]) => new ParteChefe(t, dx, dy, v * mult));
    this.img = Arte.chefe(info.arte, 1); this.w = this.img.width; this.h = this.img.height;
    this.x = W + this.w; this.y = H / 2; this.idx = 0; this.timerPadrao = 0; this.t = 0; this.ang = 0;
    // quanto o chefe (com as peças) ocupa para a direita, para cima e para baixo: mantém tudo dentro da tela
    this.dir = Math.max(this.w / 2, ...this.partes.map(p => p.dx + p.img.width / 2)) + 14;
    this.cima = Math.max(this.h / 2, ...this.partes.map(p => -p.dy + p.img.height / 2));
    this.baixo = Math.max(this.h / 2, ...this.partes.map(p => p.dy + p.img.height / 2));
  }
  blindado() { return this.partes.some(p => p.vivo); }
  update(j) {
    this.t++; if (this.flash > 0) this.flash--;
    for (const p of this.partes) if (p.flash > 0) p.flash--;
    const alvoX = W - this.dir - 30;
    if (this.entrando) { this.x += (alvoX - this.x) * 0.025; if (Math.abs(this.x - alvoX) < 3) this.entrando = false; return; }
    this.tempoLuta++;
    const furia = this.forma === 3;
    const topo = 54 + this.cima, fundo = H - 10 - this.baixo;
    this.y = (topo + fundo) / 2 + Math.sin(this.t * 0.012 * (furia ? 1.5 : 1)) * Math.max(0, (fundo - topo) / 2);
    this.x = alvoX + (Math.sin(this.t * 0.007) - 1) * 15;
    // forma muda com a vida
    const nova = this.vida > this.vidaMax * 0.66 ? 1 : this.vida > this.vidaMax * 0.33 ? 2 : 3;
    if (nova !== this.forma) {
      this.forma = nova; this.img = Arte.chefe(this.info.arte, nova); this.idx = 0; this.timerPadrao = 0;
      j.aviso(nova === 3 ? this.nome.toUpperCase() + ' ESTÁ FURIOSO!' : 'FORMA ' + nova + '!', nova === 3 ? [255, 80, 80] : [255, 190, 80]);
      j.efeitos.anel(this.x, this.y, [255, 60, 60], 150); j.tremer(16); vibrar(80);
    }
    const ritmo = furia ? 0.65 : this.forma === 2 ? 0.85 : 1, p = j.player, v = 3.1 * this.dif;
    // ataques das partes
    for (const pt of this.partes) {
      if (!pt.vivo) continue;
      const px = this.x + pt.dx, py = this.y + pt.dy, mira = Math.atan2(p.y - py, p.x - px);
      if (pt.rajada > 0) { if (pt.rajada % 6 === 0) j.tiroInimigo(px - 20, py, mira, v * 1.2); pt.rajada--; }
      if (--pt.recarga > 0) continue;
      switch (pt.tipo) {
        case 'canhao': pt.rajada = 18; pt.recarga = 80 * ritmo; break;
        case 'garra': for (let i = -2; i <= 2; i++) j.tiroInimigo(px - 20, py, mira + i * 0.2, v); pt.recarga = 110 * ritmo; break;
        case 'ferrao': { const t = new Tiro(px - 30, py, Math.cos(mira) * v * 1.9, Math.sin(mira) * v * 1.9, 1, true, 'ESFERA'); t.raio = 10; t.cor = [255, 210, 70]; j.tiros.push(t); pt.recarga = 85 * ritmo; break; }
        case 'missil': for (const s of [-1, 1]) { const t = new Tiro(px, py, -1.5, s * 2.5, 1, true, 'MISSIL_INI'); j.tiros.push(t); } pt.recarga = 170 * ritmo; break;
        case 'hangar': for (let i = 0; i < 3; i++) j.adicionarInimigo(new Inimigo(T.ENXAME, px - 10, py + (i - 1) * 24, this.dif)); pt.recarga = 260 * ritmo; break;
      }
    }
    // ataques do núcleo
    const ataques = this.info.formas[this.forma - 1];
    if (++this.timerPadrao > 260) { this.timerPadrao = 0; this.idx = (this.idx + 1) % ataques.length; }
    if (this.timerPadrao < 30) return;
    const f = this.timerPadrao, bx = this.x - this.w * 0.35, by = this.y, mira = Math.atan2(p.y - by, p.x - bx);
    const cada = n => f % Math.max(1, Math.round(n)) === 0;
    switch (ataques[this.idx % ataques.length]) {
      case ATQ.LEQUE: if (cada(60 * ritmo)) { const n = furia ? 9 : 7; for (let i = 0; i < n; i++) j.tiroInimigo(bx, by, mira + (i - (n - 1) / 2) * 0.16, v); } break;
      case ATQ.ESPIRAL:
        if (cada(furia ? 4 : 6)) { this.ang += 0.27; j.tiroInimigo(this.x, this.y, this.ang, v * 0.85); j.tiroInimigo(this.x, this.y, this.ang + Math.PI, v * 0.85); if (furia) j.tiroInimigo(this.x, this.y, -this.ang, v * 0.7); }
        break;
      case ATQ.RAJADA: if (f % 100 < 55 && cada(Math.max(4, 9 * ritmo))) j.tiroInimigo(bx, by, mira + (Math.random() - 0.5) * 0.12, v * 1.5); break;
      case ATQ.INVOCAR:
        if (f === 40 || (furia && f === 150)) { for (let i = 0; i < 3; i++) j.adicionarInimigo(new Inimigo(this.info.invoca, this.x - 40, 100 + rnd(H - 170), this.dif)); j.efeitos.anel(this.x, this.y, [255, 220, 120], 110); }
        if (cada(80 * ritmo)) j.tiroMirado(bx, by, v);
        break;
      case ATQ.ANEL: if (cada(55 * ritmo)) { const n = furia ? 22 : 16, d = Math.floor(f / 50) * 0.1; for (let i = 0; i < n; i++) j.tiroInimigo(this.x, this.y, d + i * Math.PI * 2 / n, v * 0.8); } break;
      case ATQ.MURO:
        if (cada(80 * ritmo)) {
          const brecha = 100 + rnd(H - 200);
          for (let yy = 56; yy < H; yy += 28) if (Math.abs(yy - brecha) >= 64) { const t = new Tiro(W + 10, yy, -v * 0.9, 0, 1, true, 'ESFERA'); t.cor = [255, 170, 60]; j.tiros.push(t); }
        }
        break;
    }
  }
  danificar(d) {
    if (this.entrando) return false;
    this.vida -= this.blindado() ? d * 0.5 : d; this.flash = 3;
    if (this.vida <= 0) { this.vida = 0; this.vivo = false; return true; }
    return false;
  }
  ataqueAtual() { const a = this.info.formas[this.forma - 1]; return NOMES_ATAQUE[a[this.idx % a.length]]; }
  bounds() { const w = this.w * 0.62, h = this.h * 0.45; return { x: this.x - w / 2, y: this.y - h / 2, w, h }; }
  desenhar(g) {
    if (this.forma === 3) { const r = Math.round(this.w * 0.55 + Math.sin(this.t * 0.2) * 6); g.globalAlpha = 0.4; g.drawImage(brilho([255, 40, 40], r), this.x - r, this.y - r); g.globalAlpha = 1; }
    desenharCentro(g, this.flash > 0 ? Arte.branco(this.img) : this.img, this.x, this.y);
    for (const p of this.partes) {
      let img = p.vivo ? (p.flash > 0 ? Arte.branco(p.img) : p.img) : Arte.parte(p.tipo, true);
      if (p.tipo === 'garra' && p.dy > 0) { g.save(); g.translate(this.x + p.dx, this.y + p.dy); g.scale(1, -1); g.drawImage(img, -img.width / 2, -img.height / 2); g.restore(); }
      else desenharCentro(g, img, this.x + p.dx, this.y + p.dy);
      if (p.vivo && p.vida < p.vidaMax) {
        const bw = 34, x = this.x + p.dx - bw / 2, y = this.y + p.dy - img.height / 2 - 7;
        g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(x, y, bw, 4); g.fillStyle = '#ffb04a'; g.fillRect(x, y, bw * p.vida / p.vidaMax, 4);
      }
    }
  }
}

// ============================================================ tiros
class Tiro {
  constructor(x, y, vx, vy, dano, inimigo, tipo = 'NORMAL') {
    Object.assign(this, { x, y, vx, vy, dano, inimigo, tipo });
    this.perfuracoes = 0; this.atingidos = new Set(); this.vivo = true; this.idade = 0; this.tam = 1;
    this.raio = inimigo ? 6 : tipo === 'MISSIL' ? 5 : tipo === 'OBUS' ? 12 : tipo === 'ONDA' ? 6 : 4;
    this.cor = inimigo ? [255, 70, 160] : [255, 230, 80];
  }
  update(j) {
    this.idade++;
    if (this.tipo === 'MISSIL' || this.tipo === 'MISSIL_INI') {
      const ini = this.tipo === 'MISSIL_INI';
      const alvo = ini ? (j.player.vivo && this.idade < 150 ? j.player : null) : j.alvoMaisProximo(this.x, this.y);
      const vel = ini ? Math.min(3.6, 1.5 + this.idade * 0.04) : Math.min(10, 4 + this.idade * 0.25);
      let atual = Math.atan2(this.vy, this.vx);
      if (alvo) { const a = Math.atan2(alvo.y - this.y, alvo.x - this.x); atual += clamp(Math.atan2(Math.sin(a - atual), Math.cos(a - atual)), ini ? -0.05 : -0.14, ini ? 0.05 : 0.14); }
      this.vx = Math.cos(atual) * vel; this.vy = Math.sin(atual) * vel;
      if (this.idade % 3 === 0) j.efeitos.fumaca(this.x - this.vx, this.y - this.vy);
      if (this.idade > (ini ? 360 : 240)) this.vivo = false;
    }
    if (this.tipo === 'OBUS' && this.x > W - 10) { this.vivo = false; j.explodirObus(this); }
    if (this.tipo === 'ONDA') { this.x += this.vx; this.y = this.baseY + Math.sin(this.idade * 0.16 + this.fase) * this.amp; return this.foraDaTela(); }
    this.x += this.vx; this.y += this.vy;
    this.foraDaTela();
  }
  foraDaTela() {
    if (this.x < -40 || this.x > W + 40 || this.y < -40 || this.y > H + 40) this.vivo = false;
  }
  bounds() {
    if (this.tipo === 'LASER') { const w = 40, h = 3 + this.tam * 2; return { x: this.x - w / 2, y: this.y - h / 2, w, h }; }
    if (this.tipo === 'NORMAL' && !this.inimigo) { const w = 18 * this.tam, h = 6 * this.tam; return { x: this.x - w / 2, y: this.y - h / 2, w, h }; }
    const r = this.inimigo ? this.raio - 2 : this.raio;
    return { x: this.x - r, y: this.y - r, w: r * 2, h: r * 2 };
  }
  desenhar(g) {
    if (this.tipo === 'MISSIL_INI') {
      g.save(); g.translate(this.x, this.y); g.rotate(Math.atan2(this.vy, this.vx));
      g.fillStyle = '#ff5050'; g.fillRect(-7, -3, 12, 6); g.fillStyle = '#ffd24a'; g.fillRect(4, -2, 4, 4); g.fillStyle = '#fff'; g.fillRect(-10, -1, 3, 2); g.restore(); return;
    }
    if (this.inimigo) { const b = brilho(this.cor, this.raio + 4); g.drawImage(b, this.x - b.width / 2, this.y - b.height / 2); return; }
    if (this.tipo === 'OBUS') { const b = brilho([255, 150, 60], 16); g.drawImage(b, this.x - 16, this.y - 16); g.fillStyle = '#fff3c0'; g.fillRect(this.x - 5, this.y - 5, 10, 10); return; }
    g.save(); g.translate(this.x, this.y); g.rotate(Math.atan2(this.vy, this.vx));
    if (this.tipo === 'MISSIL') { g.fillStyle = '#e6e6f0'; g.fillRect(-8, -2, 14, 4); g.fillStyle = '#ff503c'; g.fillRect(4, -2, 4, 4); g.fillStyle = '#ffc850'; g.fillRect(-11, -1, 3, 2); }
    else if (this.tipo === 'DRONE') { g.fillStyle = '#7af5ff'; g.fillRect(-6, -1.5, 12, 3); }
    else if (this.tipo === 'LASER') {
      const h = 3 + this.tam * 2;
      g.fillStyle = rgba(this.cor, 0.35); g.fillRect(-22, -h / 2 - 2, 44, h + 4);
      g.fillStyle = rgba(this.cor, 1); g.fillRect(-20, -h / 2, 40, h);
      g.fillStyle = '#ffffff'; g.fillRect(-18, -Math.max(1, h / 4), 36, Math.max(1, h / 2));
    }
    else if (this.tipo === 'ONDA') {
      g.fillStyle = rgba(this.cor, 0.4); g.fillRect(-7, -7, 14, 14);
      g.fillStyle = rgba(this.cor, 1); g.fillRect(-5, -5, 10, 10); g.fillStyle = '#efffef'; g.fillRect(-2, -2, 4, 4);
    }
    else {
      const w = 18 * this.tam, h = 6 * this.tam;
      g.fillStyle = rgba(this.cor, 0.45); g.fillRect(-w / 2 - 3, -h / 2, w + 3, h);
      g.fillStyle = rgba(this.cor, 1); g.fillRect(-w / 2, -h / 2 + 1, w, h - 2);
      g.fillStyle = '#fffbe0'; g.fillRect(-w / 2 + 3, -1, w - 4, 2);
    }
    g.restore();
  }
}

// ============================================================ itens
// tipos de tiro: o item tem formato de losango; pegar o mesmo tipo sobe o nível, outro tipo troca e mantém o nível
const ARMAS = {
  PADRAO:     { id: 'PADRAO', nome: 'Vulcão', cor: [255, 230, 80], desc: 'Tiro padrão da nave' },
  LASER:      { id: 'LASER', nome: 'Laser', letra: 'L', cor: [95, 240, 255], desc: 'Raio rápido que atravessa tudo' },
  ONDA:       { id: 'ONDA', nome: 'Onda', letra: 'O', cor: [120, 255, 140], desc: 'Tiros em zigue-zague que cobrem a tela' },
  LEQUE:      { id: 'LEQUE', nome: 'Leque', letra: 'F', cor: [255, 150, 60], desc: 'Espalha em até 7 direções' },
  TELEGUIADO: { id: 'TELEGUIADO', nome: 'Teleguiado', letra: 'T', cor: [255, 110, 200], desc: 'Mísseis que perseguem o alvo' },
  ELETRICO:   { id: 'ELETRICO', nome: 'Elétrico', letra: 'Z', cor: [170, 200, 255], desc: 'Raio que pula entre inimigos próximos' },
};
const POWERUPS = [
  { id: 'ARMA', nome: 'ARMA+', letra: 'P', cor: [255, 200, 40], peso: 20, desc: 'Sobe o nível da arma atual (até 5)' },
  { id: 'RAPIDO', nome: 'TIRO RÁPIDO', letra: 'R', cor: [255, 110, 40], peso: 11, desc: 'Dobra a cadência por 8s', tempo: 480 },
  { id: 'ESCUDO', nome: 'ESCUDO', letra: 'E', cor: [80, 190, 255], peso: 10, desc: 'Aguenta 1 golpe' },
  { id: 'BOLHA', nome: 'BOLHA 8s', letra: '◎', cor: [130, 220, 255], peso: 6, desc: 'Nada te atinge por 8s', tempo: 480 },
  { id: 'ESTRELA', nome: 'INVENCÍVEL', letra: '★', cor: [255, 240, 120], peso: 4, desc: '6s invencível; encostar destrói', tempo: 360 },
  { id: 'CANHAO', nome: 'CANHÃO PESADO', letra: 'C', cor: [255, 120, 70], peso: 6, desc: 'Tiros grandes que atravessam por 10s', tempo: 600 },
  { id: 'IMA', nome: 'ÍMÃ', letra: 'M', cor: [255, 90, 120], peso: 5, desc: 'Puxa todos os itens por 12s', tempo: 720 },
  { id: 'LENTO', nome: 'CÂMERA LENTA', letra: '◔', cor: [150, 160, 255], peso: 4, desc: 'Inimigos pela metade da velocidade por 6s', tempo: 360 },
  { id: 'ENERGIA', nome: 'ENERGIA', letra: 'S', cor: [200, 110, 255], peso: 9, desc: '+50% de energia do especial' },
  { id: 'BOMBA', nome: 'BOMBA', letra: 'B', cor: [255, 70, 70], peso: 6, desc: '+1 bomba' },
  { id: 'CURA', nome: 'REPARO', letra: '✚', cor: [90, 255, 160], peso: 5, desc: 'Recupera 1 vida perdida' },
  { id: 'VIDA', nome: 'VIDA EXTRA', letra: '♥', cor: [90, 255, 120], peso: 3, desc: '+1 vida, mesmo com tudo cheio' },
];
const ITENS_ARMA = Object.values(ARMAS).filter(a => a.letra).map(a => ({ id: 'TIPO_ARMA', arma: a.id, nome: a.nome.toUpperCase(), letra: a.letra, cor: a.cor, peso: 3.4, desc: a.desc }));
const TODOS_ITENS = POWERUPS.concat(ITENS_ARMA);
const ITEM_DE = id => POWERUPS.find(p => p.id === id);
const MOEDA = { id: 'MOEDA', cor: [255, 210, 74] }, CRISTAL = { id: 'CRISTAL', cor: [255, 90, 209] };
function sortearPowerUp() {
  const total = TODOS_ITENS.reduce((s, p) => s + p.peso, 0);
  let r = rnd(total);
  for (const p of TODOS_ITENS) { r -= p.peso; if (r < 0) return p; }
  return POWERUPS[0];
}
const sortearArma = () => ITENS_ARMA[Math.floor(rnd(ITENS_ARMA.length))];
class Item {
  constructor(tipo, x, y, valor = 0) {
    Object.assign(this, { tipo, x, y, valor }); this.vivo = true; this.idade = 0;
    if (tipo === MOEDA || tipo === CRISTAL) { const a = rnd(Math.PI * 2), v = rnd(1, 3); this.vx = Math.cos(a) * v; this.vy = Math.sin(a) * v; }
  }
  update(p, ima) {
    this.idade++;
    const dx = p.x - this.x, dy = p.y - this.y, d = hyp(dx, dy);
    if (this.vx !== undefined && this.idade < 25) { this.x += this.vx; this.y += this.vy; this.vx *= 0.9; this.vy *= 0.9; return; }
    if (p.vivo && d < 2) return;
    if (p.vivo && d < ima) { const v = this.tipo === MOEDA || this.tipo === CRISTAL ? 7 : 5; this.x += dx / d * v; this.y += dy / d * v; }
    else { this.x -= 1.3; this.y += Math.sin(this.idade * 0.06) * 0.55; }
    if (this.x < -30) this.vivo = false;
  }
  bounds() { return { x: this.x - 16, y: this.y - 16, w: 32, h: 32 }; }
  desenhar(g) {
    if (this.tipo === MOEDA) { desenharCentro(g, Arte.moeda(Math.floor(this.idade / 6)), this.x, this.y); return; }
    if (this.tipo === CRISTAL) { g.drawImage(brilho(CRISTAL.cor, 16), this.x - 16, this.y - 16); desenharCentro(g, Arte.cristal(), this.x, this.y); return; }
    desenharItem(g, this.tipo, this.x, this.y);
  }
}

/** Ícone de item: quadrado para power-ups, losango para tipos de arma. */
function desenharItem(g, t, x, y, piscar = 0) {
  g.drawImage(brilho(t.cor, 24), x - 24, y - 24);
  if (t.arma) {
    g.save(); g.translate(x, y); g.rotate(Math.PI / 4);
    caixa(g, -11, -11, 22, 22, 4, 'rgba(20,20,30,.9)', rgba(t.cor, 1), 2.5); g.restore();
  } else caixa(g, x - 12, y - 12, 24, 24, 6, 'rgba(20,20,30,.88)', rgba(t.cor, 1), 2);
  texto(g, t.letra, x, y + 5, 14, rgba(t.cor, 1), 'center', false);
}

// ============================================================ efeitos
class Efeitos {
  constructor() { this.p = []; this.t = []; this.anim = []; this.raios = []; this.fxs = []; }
  get max() { return Config.visual === 'leve' ? 350 : 1300; }
  add(x, y, vx, vy, tam, vida, cor) { if (this.p.length < this.max) this.p.push({ x, y, vx, vy, tam, vida, vidaMax: vida, cor }); }
  explosao(x, y, tam) {
    const leve = Config.visual === 'leve', n = Math.min(40, 6 + tam / 3) * (leve ? 0.35 : 1), cores = [[255, 240, 160], [255, 180, 60], [255, 100, 40]];
    for (let i = 0; i < n; i++) { const a = rnd(Math.PI * 2), v = rnd(1, 2 + tam / 20); this.add(x, y, Math.cos(a) * v, Math.sin(a) * v, rnd(2, 4), 20 + rnd(20), cores[Math.floor(rnd(3))]); }
    this.anim.push({ x, y, q: 0, esc: clamp(tam / 30, 0.6, 4) });
    if (tam > 50) this.anel(x, y, [255, 200, 120], tam);
    if (tam >= 150) this.fx('plasma', x, y, tam / 150);
  }
  /** Efeito em pixel art (assets/fx). Em modo leve só os grandes. */
  fx(nome, x, y, esc = 1) { if (Config.visual === 'leve' && this.fxs.length > 3) return; if (this.fxs.length < 24) this.fxs.push({ nome, x, y, esc, t: 0 }); }
  anel(x, y, cor, raio) { this.p.push({ x, y, anel: true, raio, vida: 22, vidaMax: 22, cor }); }
  faisca(x, y, cor) { this.add(x, y, rnd(1, 2.5), (Math.random() - 0.5) * 1.5, rnd(2, 4), 12 + rnd(10), cor); }
  fumaca(x, y) { this.add(x, y, (Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.4, 3, 18, [200, 200, 210]); }
  acerto(x, y) { if (Math.random() < 0.5) this.fx('faisca', x - 10, y, 0.4); for (let i = 0; i < 2; i++) { const a = Math.PI + (Math.random() - 0.5) * 1.6, v = rnd(1, 4); this.add(x, y, Math.cos(a) * v, Math.sin(a) * v, 2, 10, [255, 230, 80]); } }
  raio(x1, y1, x2, y2) {
    const pts = [[x1, y1]], n = Math.max(3, Math.floor(hyp(x2 - x1, y2 - y1) / 18));
    for (let i = 1; i < n; i++) pts.push([x1 + (x2 - x1) * i / n + rnd(-8, 8), y1 + (y2 - y1) * i / n + rnd(-8, 8)]);
    pts.push([x2, y2]); this.raios.push({ pts, vida: 8 }); this.fx('choque', x2, y2, 0.45);
  }
  texto(x, y, s, cor, tam) { this.t.push({ x, y, s, cor, tam, vida: 55 }); }
  update() {
    for (const p of this.p) { if (!p.anel) { p.x += p.vx; p.y += p.vy; p.vx *= 0.95; p.vy *= 0.95; } p.vida--; }
    this.p = this.p.filter(p => p.vida > 0);
    for (const t of this.t) { t.y -= 0.7; t.vida--; }
    this.t = this.t.filter(t => t.vida > 0);
    for (const a of this.anim) a.q += 0.34;
    for (const e of this.fxs) e.t += Fx.lista[e.nome].fps / 60;
    this.fxs = this.fxs.filter(e => e.t < Fx.lista[e.nome].n);
    this.anim = this.anim.filter(a => a.q < 8);
    for (const r of this.raios) r.vida--;
    this.raios = this.raios.filter(r => r.vida > 0);
  }
  desenhar(g) {
    for (const a of this.anim) {
      const img = Arte.explosao(Math.floor(a.q)), s = a.esc;
      g.drawImage(img, a.x - img.width * s / 2, a.y - img.height * s / 2, img.width * s, img.height * s);
    }
    g.imageSmoothingEnabled = false; for (const e of this.fxs) Fx.desenhar(g, e);
    for (const p of this.p) {
      const a = clamp(p.vida / p.vidaMax, 0, 1);
      if (p.anel) { const r = p.raio * (1 - a); g.strokeStyle = rgba(p.cor, a); g.lineWidth = 1 + 4 * a; g.beginPath(); g.arc(p.x, p.y, r, 0, Math.PI * 2); g.stroke(); }
      else { const s = Math.max(1, Math.round(p.tam * (0.5 + a * 0.5))); g.fillStyle = rgba(p.cor, a); g.fillRect(Math.round(p.x - s / 2), Math.round(p.y - s / 2), s, s); }
    }
    for (const r of this.raios) {
      for (const [l, c] of [[5, 'rgba(110,230,255,.35)'], [2, '#e8ffff']]) {
        g.strokeStyle = c; g.lineWidth = l; g.beginPath(); r.pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke();
      }
    }
    for (const t of this.t) { g.globalAlpha = Math.min(1, t.vida / 20); texto(g, t.s, t.x, t.y, t.tam, rgba(t.cor, 1), 'center'); g.globalAlpha = 1; }
  }
  limpar() { this.p = []; this.t = []; this.anim = []; this.raios = []; this.fxs = []; }
}

// ============================================================ fundo
class Fundo {
  constructor() {
    this.estrelas = []; for (let i = 0; i < 120; i++) this.estrelas.push({ x: rnd(1400), y: rnd(H), c: i < 60 ? 0 : i < 98 ? 1 : 2 });
    this.desloc = 0; this.hiper = 0; this.definir(FASES[0]);
  }
  definir(f) {
    const w = 1200, c = document.createElement('canvas'); c.width = w; c.height = H;
    const g = c.getContext('2d');
    let s = f.n * 31; const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, f.ceu[0]); gr.addColorStop(1, f.ceu[1]); g.fillStyle = gr; g.fillRect(0, 0, w, H);
    for (let i = 0; i < 9; i++) {
      const cor = f.neb[i % 2], raio = 100 + r() * 190, cx = r() * w, cy = r() * H, a = (40 + r() * 30) / 255;
      for (let k = -1; k <= 1; k++) { const rg = g.createRadialGradient(cx + k * w, cy, 0, cx + k * w, cy, raio); rg.addColorStop(0, rgba(cor, a)); rg.addColorStop(1, rgba(cor, 0)); g.fillStyle = rg; g.fillRect(cx + k * w - raio, cy - raio, raio * 2, raio * 2); }
    }
    for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(255,255,255,${(40 + r() * 90) / 255})`; g.fillRect(Math.floor(r() * w), Math.floor(r() * H), 1, 1); }
    this.ceu = c;
    const [c1, c2, anel] = f.planeta;
    this.planetas = [{ img: Arte.planeta(f.n, 26, c1, c2, anel), x: W * 0.6, y: 90 + r() * 120, v: 0.12 }, { img: Arte.planeta(f.n + 9, 9, c2, c1, false), x: W * 0.15, y: 330 + r() * 120, v: 0.2 }];
  }
  update() {
    this.desloc = (this.desloc + 0.25 + this.hiper * 6) % this.ceu.width;
    for (const p of this.planetas) { p.x -= p.v * (1 + this.hiper * 10); if (p.x < -p.img.width) p.x = W + rnd(200, 600); }
    for (const e of this.estrelas) { e.x -= [0.55, 1.3, 2.6][e.c] * (1 + this.hiper * 12); if (e.x < -60) { e.x = W + rnd(40); e.y = rnd(H); } }
  }
  desenhar(g) {
    const cw = this.ceu.width, d = Math.floor(this.desloc);
    for (let x = -d; x < W; x += cw) g.drawImage(this.ceu, x, 0);
    for (const p of this.planetas) g.drawImage(p.img, Math.round(p.x), Math.round(p.y - p.img.height / 2));
    for (const e of this.estrelas) {
      const b = [110, 180, 255][e.c], s = e.c + 1;
      g.fillStyle = `rgb(${b},${b},${Math.min(255, b + 20)})`;
      if (this.hiper > 0.05) g.fillRect(e.x, e.y, this.hiper * 54 * (e.c + 1), Math.max(1, s - 1)); else g.fillRect(Math.round(e.x), Math.round(e.y), s, s);
    }
  }
}

// ============================================================ entrada
const Input = {
  baixo: new Set(), apertou: new Set(),
  arrastoId: null, ultX: 0, ultY: 0, dx: 0, dy: 0, tocando: false,
  joy: null,                      // { ox, oy, x, y } quando o joystick está ativo
  seg(...c) { return c.some(k => this.baixo.has(k)); },
  ap(...c) { return c.some(k => this.apertou.has(k)); },
  fimQuadro() { this.apertou.clear(); },
  soltarTudo() { this.arrastoId = null; this.tocando = false; this.joy = null; this.dx = this.dy = 0; },
};
const TECLAS_JOGO = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'KeyW', 'KeyA', 'KeyS', 'KeyD'];
addEventListener('keydown', e => {
  if (document.activeElement && document.activeElement.tagName === 'INPUT') return;
  if (!Input.baixo.has(e.code)) Input.apertou.add(e.code);
  Input.baixo.add(e.code);
  if (TECLAS_JOGO.includes(e.code)) e.preventDefault();
  usouToque = false; Som.iniciar();
});
addEventListener('keyup', e => Input.baixo.delete(e.code));
addEventListener('blur', () => { Input.baixo.clear(); if (jogo && jogo.emPartida() && !jogo.pausado) jogo.pausar(); });
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { Input.baixo.clear(); if (jogo && jogo.emPartida() && !jogo.pausado) jogo.pausar(); Som.pausarMusica(true); }
  else Som.pausarMusica(false);
});
const paraLogico = e => ({ x: (e.clientX - offX) / escala, y: (e.clientY - offY) / escala });
let botoes = [];
function botaoEm(p) { for (let i = botoes.length - 1; i >= 0; i--) { const b = botoes[i]; if (p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h) return b; } return null; }

cv.addEventListener('pointerdown', e => {
  e.preventDefault(); Som.iniciar();
  if (!jogo) return;
  if (e.pointerType !== 'mouse') usouToque = true;
  const p = paraLogico(e), b = botaoEm(p);
  if (b) { b.acao(); return; }
  if (jogo.emPartida() && !jogo.pausado && Input.arrastoId === null) {
    Input.arrastoId = e.pointerId; Input.ultX = p.x; Input.ultY = p.y; Input.tocando = true;
    if (Config.controle === 'joystick') Input.joy = { ox: p.x, oy: p.y, x: p.x, y: p.y };
    try { cv.setPointerCapture(e.pointerId); } catch (_) {}
  }
}, { passive: false });
cv.addEventListener('pointermove', e => {
  if (e.pointerId !== Input.arrastoId) return;
  const p = paraLogico(e);
  if (Input.joy) { Input.joy.x = p.x; Input.joy.y = p.y; }
  else { Input.dx += (p.x - Input.ultX) * Config.sens; Input.dy += (p.y - Input.ultY) * Config.sens; }
  Input.ultX = p.x; Input.ultY = p.y;
});
const soltar = e => { if (e.pointerId === Input.arrastoId) Input.soltarTudo(); };
cv.addEventListener('pointerup', soltar);
cv.addEventListener('pointercancel', soltar);
cv.addEventListener('contextmenu', e => e.preventDefault());

// ============================================================ jogador
class Player {
  constructor(tipo) {
    this.tipo = tipo; this.pecas = Object.assign({}, Dados.pecas(tipo.id)); this.at = atributos(tipo, this.pecas);
    this.x = 120; this.y = H / 2; this.vidas = this.at.vidas; this.arma = 1; this.bombas = this.at.bombas; this.energia = 0;
    this.escudo = this.at.escudoInicial; this.timerEscudo = 0; this.invencivel = 0; this.tiroRapido = 0; this.especialAtivo = 0; this.vivo = true;
    this.tirosDisparados = 0; this.recarga = 0; this.missilFila = 0; this.obusFila = 0; this.quadro = 0;
    this.querEspecial = false; this.querBomba = false; this.distMovida = 0;
    this.tipoArma = 'PADRAO';
    this.efeitos = { BOLHA: 0, ESTRELA: 0, CANHAO: 0, IMA: 0 };   // itens com tempo (quadros restantes)
    this.drones = []; for (let i = 0; i < this.at.drones; i++) this.drones.push({ a: i * Math.PI, rec: i * 10, temp: false });
  }
  get tam() { return this.tipo.tam; }
  update(j, podeAtirar) {
    this.quadro++;
    if (!this.vivo) { Input.dx = Input.dy = 0; return; }
    const x0 = this.x, y0 = this.y;
    let dx = 0, dy = 0;
    if (Input.seg('ArrowLeft', 'KeyA')) dx--; if (Input.seg('ArrowRight', 'KeyD')) dx++;
    if (Input.seg('ArrowUp', 'KeyW')) dy--; if (Input.seg('ArrowDown', 'KeyS')) dy++;
    if (dx && dy) { dx *= 0.7071; dy *= 0.7071; }
    if (Input.joy) {
      const jx = Input.joy.x - Input.joy.ox, jy = Input.joy.y - Input.joy.oy, d = hyp(jx, jy), r = 55;
      if (d > 6) { const f = Math.min(1, d / r) * Config.sens / 1.35; dx += jx / d * f; dy += jy / d * f; }
    }
    const vel = this.at.vel * (this.turbo() ? 1.7 : 1);
    this.x += dx * vel; this.y += dy * vel;
    const lim = 34 * (this.turbo() ? 1.4 : 1);
    this.x += clamp(Input.dx, -lim, lim); this.y += clamp(Input.dy, -lim, lim);
    Input.dx = 0; Input.dy = 0;
    const m = this.tam / 2;
    this.x = clamp(this.x, m, W - m); this.y = clamp(this.y, 50 + m * 0.5, H - m * 0.7);
    this.distMovida += hyp(this.x - x0, this.y - y0);

    if (this.invencivel > 0) this.invencivel--; if (this.tiroRapido > 0) this.tiroRapido--;
    for (const k in this.efeitos) if (this.efeitos[k] > 0) this.efeitos[k]--;
    if (this.especialAtivo > 0) { this.especialAtivo--; if (this.especialAtivo === 0) this.drones = this.drones.filter(d => !d.temp); }
    if (this.recarga > 0) this.recarga--;
    if (this.at.regenEscudo && !this.escudo && ++this.timerEscudo >= this.at.regenEscudo) { this.escudo = true; this.timerEscudo = 0; j.efeitos.anel(this.x, this.y, [100, 200, 255], 50); }
    for (const d of this.drones) d.a += 0.05;
    const qe = this.querEspecial, qb = this.querBomba; this.querEspecial = this.querBomba = false;
    if (!podeAtirar) return;

    const atirando = Input.seg('Space', 'KeyZ', 'KeyJ') || Input.tocando || this.turbo();
    if (atirando && this.recarga <= 0) {
      this.atirar(j);
      let cad = this.at.cadencia * ({ LASER: 0.6, ONDA: 1.1, LEQUE: 1.25, TELEGUIADO: 1.7, ELETRICO: 1.4 }[this.tipoArma] || 1);
      if (this.tiroRapido > 0) cad = Math.max(3, cad / 2); if (this.turbo()) cad = Math.max(3, cad / 2);
      this.recarga = cad;
    }
    if (atirando) for (const d of this.drones) {
      if (--d.rec > 0) continue;
      d.rec = d.temp ? 12 : 22;
      const t = new Tiro(this.x + Math.cos(d.a) * 40, this.y + Math.sin(d.a) * 30, 10, 0, this.at.dano * 0.5, false, 'DRONE'); j.tiros.push(t);
    }
    if ((Input.ap('KeyX', 'KeyK', 'ShiftLeft', 'ShiftRight') || qe) && this.energia >= 100) this.ativarEspecial(j);
    if ((Input.ap('KeyC', 'KeyL', 'KeyB') || qb) && this.bombas > 0) { this.bombas--; j.detonarBomba(); }
    if (this.missilFila > 0 && this.quadro % 5 === 0) {
      this.missilFila--;
      const a = (this.missilFila % 2 === 0 ? -1 : 1) * rnd(0.6, 1.2);
      j.tiros.push(new Tiro(this.x, this.y, Math.cos(a) * 4, Math.sin(a) * 4, 3 * this.at.dano, false, 'MISSIL'));
    }
    if (this.obusFila > 0 && this.quadro % 10 === 0) {
      this.obusFila--;
      j.tiros.push(new Tiro(this.x + 30, this.y + (this.obusFila % 2 ? -8 : 8), 7, 0, 10 * this.at.dano / 2.6, false, 'OBUS'));
      j.tremer(4);
    }
    if (this.tipo.id === 'RELAMPAGO' && this.especialAtivo > 0 && this.quadro % 8 === 0) j.tempestade(this);
  }
  atirar(j) {
    const bx = this.x + this.tam / 2, by = this.y, lv = this.arma, arma = ARMAS[this.tipoArma];
    const pesado = this.efeitos.CANHAO > 0;
    const dano = this.at.dano * (pesado ? 1.5 : 1), tam = this.at.tamTiro * (pesado ? 1.8 : 1);
    const novo = (x, y, vx, vy, d, tipo = 'NORMAL') => {
      const t = new Tiro(x, y, vx, vy, d, false, tipo);
      t.tam = tam; t.cor = this.tipoArma === 'PADRAO' ? this.tipo.cor : arma.cor;
      if (this.tipo.perfurante) t.perfuracoes += 2;
      if (pesado) t.perfuracoes += 2;
      if (this.tipo.encadeia) t.encadeia = true;
      j.tiros.push(t); this.tirosDisparados++; return t;
    };
    const leque = (angs, v, d, oys = []) => angs.forEach((ang, i) => { const a = ang * Math.PI / 180; novo(bx, by + (oys[i] || 0) * tam, Math.cos(a) * v, Math.sin(a) * v, d); });
    switch (this.tipoArma) {
      case 'LASER': {
        const linhas = [[0], [0], [-6, 6], [-8, 0, 8], [-12, -4, 4, 12]][lv - 1];
        for (const oy of linhas) { const t = novo(bx + 10, by + oy, 18, 0, dano * 0.55, 'LASER'); t.perfuracoes = 99; t.tam = tam * (lv >= 2 ? 1.5 : 1); }
        break;
      }
      case 'ONDA': {
        const n = [1, 2, 2, 3, 4][lv - 1], amp = 22 + lv * 8;
        for (let i = 0; i < n; i++) { const t = novo(bx, by, 7.5, 0, dano * 0.9, 'ONDA'); t.baseY = by; t.amp = amp * (i % 2 ? -1 : 1) * (i >= 2 ? 0.55 : 1); t.fase = 0; t.perfuracoes += 1; }
        break;
      }
      case 'LEQUE': {
        const n = lv + 2, abertura = 16 + lv * 6;
        leque(Array.from({ length: n }, (_, i) => -abertura + i * 2 * abertura / (n - 1)), 10, dano * 0.8);
        break;
      }
      case 'TELEGUIADO': {
        const n = [1, 2, 2, 3, 4][lv - 1];
        for (let i = 0; i < n; i++) { const a = (i - (n - 1) / 2) * 0.5; const t = novo(bx, by, Math.cos(a) * 5, Math.sin(a) * 5, dano * 1.3, 'MISSIL'); t.raio = 4 * (pesado ? 1.5 : 1); }
        break;
      }
      case 'ELETRICO':
        if (!j.arcoEletrico(this, lv, dano)) leque([0], 13, dano * 0.6);
        break;
      default:
        leque(...[[[0], 11, dano], [[0, 0], 11, dano, [-6, 6]], [[0, -8, 8], 11, dano, [0, -4, 4]], [[0, 0, -11, 11], 11, dano, [-6, 6, -6, 6]], [[0, -5, 5, -15, 15], 11, dano, [0, -6, 6, -8, 8]]][lv - 1]);
    }
    Som.tocar(this.tipoArma === 'ELETRICO' ? 'raio' : 'tiro');
  }
  ativarEspecial(j) {
    this.energia = 0; Som.tocar('especial');
    const base = { FALCAO: 60, COMETA: 240, TITA: 300, FANTASMA: 180, VESPA: 480, MARTELO: 60, AURORA: 180, RELAMPAGO: 180 }[this.tipo.id];
    this.especialAtivo = Math.round(base * this.at.duracaoEsp);
    switch (this.tipo.id) {
      case 'FALCAO': this.missilFila = Math.round(12 * this.at.duracaoEsp); break;
      case 'MARTELO': this.obusFila = 6; break;
      case 'VESPA': for (let i = 0; i < 4; i++) this.drones.push({ a: i * Math.PI / 2, rec: i * 3, temp: true }); break;
      case 'AURORA': j.pulsoAurora(this); break;
    }
    j.efeitos.anel(this.x, this.y, this.tipo.cor, 90);
    j.aviso(this.tipo.especial.toUpperCase() + '!', this.tipo.cor);
    j.estatEspeciais++; vibrar(40);
  }
  turbo() { return this.tipo.id === 'COMETA' && this.especialAtivo > 0; }
  plasma() { return this.tipo.id === 'TITA' && this.especialAtivo > 0; }
  laser() { return this.tipo.id === 'FANTASMA' && this.especialAtivo > 0; }
  vulneravel() { return this.vivo && this.invencivel <= 0 && !this.turbo() && !this.plasma() && !this.protegidoItem(); }
  protegidoItem() { return this.efeitos.BOLHA > 0 || this.efeitos.ESTRELA > 0; }
  destroiNoContato() { return this.turbo() || this.efeitos.ESTRELA > 0; }
  ganharEnergia(v) { this.energia = Math.min(100, this.energia + v * this.at.ganhoEnergia); }
  bounds() { const w = this.tam * 0.55, h = this.tam * 0.38; return { x: this.x - w / 2, y: this.y - h / 2, w, h }; }
  boundsLaser() { return { x: this.x, y: this.y - 13, w: W, h: 26 }; }
  desenhar(g) {
    if (this.semPiscar > 0) this.semPiscar--;
    if (!this.vivo || (this.invencivel > 0 && Math.floor(this.invencivel / 4) % 2 === 0 && !(this.semPiscar > 0))) return;
    const s = Arte.nave(this.tipo.id, this.pecas, Math.floor(this.quadro / 4)), m = this.tam / 2;
    if (this.laser()) {
      const alt = 20 + Math.sin(this.quadro * 0.6) * 4, gr = g.createLinearGradient(0, this.y - alt, 0, this.y + alt);
      gr.addColorStop(0, 'rgba(220,120,255,0)'); gr.addColorStop(0.5, 'rgba(240,200,255,.9)'); gr.addColorStop(1, 'rgba(220,120,255,0)');
      g.fillStyle = gr; g.fillRect(this.x + m - 6, this.y - alt, W, alt * 2); g.fillStyle = '#fff'; g.fillRect(this.x + m - 6, this.y - 4, W, 8);
    }
    const dx = Math.round(this.x - s.cx), dy = Math.round(this.y - s.cy);
    if (this.turbo()) for (let i = 1; i <= 3; i++) { g.globalAlpha = 0.25 / i; g.drawImage(s.img, dx - i * 14, dy); }
    g.globalAlpha = 1;
    const est = this.efeitos.ESTRELA;
    if (est > 0) {                       // aura de arco-íris da invencibilidade
      const cor = `hsl(${(this.quadro * 12) % 360},100%,65%)`, r = m + 14 + Math.sin(this.quadro * 0.4) * 3;
      g.fillStyle = cor; g.globalAlpha = est < 90 && est % 10 < 5 ? 0.15 : 0.35; g.beginPath(); g.arc(this.x, this.y, r, 0, Math.PI * 2); g.fill(); g.globalAlpha = 1;
    }
    g.drawImage(est > 0 && this.quadro % 6 < 2 ? Arte.branco(s.img) : s.img, dx, dy);
    for (const d of this.drones) desenharCentro(g, Arte.drone(), this.x + Math.cos(d.a) * 40, this.y + Math.sin(d.a) * 30);
    const bolha = this.efeitos.BOLHA;
    if (bolha > 0 && !(bolha < 90 && bolha % 10 < 5)) {
      g.fillStyle = 'rgba(130,220,255,.16)'; g.strokeStyle = 'rgba(170,235,255,.9)'; g.lineWidth = 2.5;
      g.beginPath(); g.arc(this.x, this.y, m + 16, 0, Math.PI * 2); g.fill(); g.stroke();
      g.fillStyle = 'rgba(255,255,255,.7)'; g.fillRect(this.x - m * 0.5, this.y - m - 8, 6, 3);
    }
    if (this.escudo) { g.strokeStyle = `rgba(102,204,255,${0.4 + 0.15 * Math.sin(this.quadro * 0.1)})`; g.lineWidth = 3; g.beginPath(); g.arc(this.x, this.y, m + 8, 0, Math.PI * 2); g.stroke(); }
    if (this.plasma()) {
      const r = this.tam;
      g.fillStyle = 'rgba(120,255,140,.22)'; g.beginPath(); g.arc(this.x, this.y, r, 0, Math.PI * 2); g.fill();
      g.strokeStyle = 'rgba(160,255,170,.8)'; g.lineWidth = 3; g.stroke();
    }
  }
}

// ============================================================ desenho: utilidades
const FONTE = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
const AMARELO = '#ffd650', CIANO = '#6edcff', CINZA = '#aab0c8', ROSA = '#ff7ad9';
const MINF = 15, T_ = t => Math.max(MINF, t);
function texto(g, s, x, y, tam, cor, al = 'left', sombra = true, peso = 800) {
  tam = T_(tam);
  g.font = `${peso} ${tam}px ${FONTE}`; g.textAlign = al; g.textBaseline = 'alphabetic';
  if (sombra) { g.fillStyle = 'rgba(0,0,0,.75)'; g.fillText(s, x + 2, y + 2); }
  g.fillStyle = cor; g.fillText(s, x, y);
}
function largura(g, s, tam, peso = 800) { tam = T_(tam); g.font = `${peso} ${tam}px ${FONTE}`; return g.measureText(s).width; }
function caixa(g, x, y, w, h, r, fill, stroke, lw = 2) {
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
  if (fill) { g.fillStyle = fill; g.fill(); }
  if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw; g.stroke(); }
}
const painel = (g, x, y, w, h) => caixa(g, x, y, w, h, 14, 'rgba(8,10,24,.84)', 'rgba(120,150,255,.3)');
function barra(g, x, y, w, h, pct, cor) {
  g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(x, y, w, h);
  g.fillStyle = cor; g.fillRect(x, y, w * clamp(pct, 0, 1), h);
  g.strokeStyle = 'rgba(255,255,255,.25)'; g.lineWidth = 1; g.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
}
function quebrar(g, s, x, y, w, tam, cor, peso = 600, al = 'left') {
  tam = T_(tam);
  const pal = s.split(' '); let l = '', yy = y;
  for (const p of pal) { const t = l ? l + ' ' + p : p; if (largura(g, t, tam, peso) > w && l) { texto(g, l, x, yy, tam, cor, al, true, peso); yy += tam + 4; l = p; } else l = t; }
  if (l) texto(g, l, x, yy, tam, cor, al, true, peso);
  return yy;
}
function botao(g, rotulo, cx, cy, w, h, acao, o = {}) {
  const x = cx - w / 2, y = cy - h / 2, off = o.desligado;
  caixa(g, x, y, w, h, 12, off ? 'rgba(30,30,44,.7)' : o.sel ? 'rgba(255,214,80,.16)' : o.fundo || 'rgba(10,14,34,.82)', off ? 'rgba(255,255,255,.12)' : o.sel ? AMARELO : o.borda || 'rgba(120,150,255,.4)', o.sel ? 3 : 2);
  texto(g, rotulo, cx, cy + (o.tam || 20) * 0.36, o.tam || 20, off ? '#6a6e84' : o.cor || (o.sel ? AMARELO : '#fff'), 'center');
  botoes.push({ x, y, w, h, acao: () => { if (off) { Som.tocar('erro'); if (o.aoDesligado) o.aoDesligado(); return; } Som.tocar('menu'); acao(); } });
}
function titulo(g, s, y, q, tam = 70) {
  g.font = `900 ${tam}px ${FONTE}`; g.textAlign = 'center';
  g.fillStyle = 'rgba(255,80,60,.35)'; for (let i = 4; i >= 1; i--) g.fillText(s, W / 2 + i * 2, y + i * 2);
  const w = g.measureText(s).width, d = (q % 240) / 240 * 300, gr = g.createLinearGradient(W / 2 - w / 2 + d - 300, 0, W / 2 - w / 2 + d + 300, 0);
  gr.addColorStop(0, '#ffe678'); gr.addColorStop(0.5, '#ff6e46'); gr.addColorStop(1, '#ffe678');
  g.fillStyle = gr; g.fillText(s, W / 2, y);
}
const pisca = (q, p) => Math.floor(q / p) % 2 === 0;
function moedas(g, x, y, c, d, tam = 16, al = 'left') {
  const s = `¢ ${fmt(c)}`, s2 = `💎 ${d}`;
  if (al === 'right') { texto(g, s2, x, y, tam, ROSA, 'right'); texto(g, s, x - largura(g, s2, tam) - 16, y, tam, AMARELO, 'right'); }
  else { texto(g, s, x, y, tam, AMARELO); texto(g, s2, x + largura(g, s, tam) + 14, y, tam, ROSA); }
}

// ============================================================ o jogo
const TUTORIAL = [
  { toque: 'Deslize o dedo pela tela para mover a nave', pc: 'Use as setas ou WASD para mover a nave' },
  { toque: 'Mantenha o dedo na tela para atirar. Destrua os 3 alvos!', pc: 'Segure ESPAÇO para atirar. Destrua os 3 alvos!' },
  { toque: 'A barra encheu! Toque em ★ para usar o especial', pc: 'A barra encheu! Aperte X para usar o especial' },
  { toque: 'Toque em 💣 para limpar a tela com uma bomba', pc: 'Aperte C para soltar uma bomba' },
  { toque: 'Pronto! Junte ¢ moedas e 💎 cristais para melhorar a nave no Hangar', pc: 'Pronto! Junte ¢ moedas e 💎 cristais para melhorar a nave no Hangar' },
];

class Jogo {
  constructor() {
    this.estado = 'MENU'; this.pausado = false; this.timer = 0; this.quadro = 0;
    this.fundo = new Fundo(); this.efeitos = new Efeitos();
    this.opcaoMenu = 0; this.opcaoPausa = 0; this.posRecorde = -1;
    this.naveHangar = Math.max(0, NAVES.findIndex(n => n.id === Dados.prog.naveAtual));
    this.tiros = []; this.inimigos = []; this.novos = []; this.itens = [];
    this.tremor = 0; this.flash = 0; this.avisoTxt = null; this.avisoCor = [255, 255, 255]; this.avisoTimer = 0; this.filaAvisos = [];
    this.player = new Player(NAVES[0]); this.fase = FASES[0]; this.ciclo = 1; this.faseIdx = 0;
    this.pontos = 0; this.combo = 0; this.comboTimer = 0; this.maiorCombo = 0; this.abatesTotal = 0; this.abatesFase = 0; this.acertos = 0;
    this.desafioStatus = 0; this.maxComboFase = 0; this.asteroidesFase = 0; this.danoNaFase = false; this.bombaNaFase = false;
    this.resumo = []; this.faseRecorde = '1'; this.venceu = false; this.chefe = null; this.chefeMorrendo = 0;
    this.creditosRun = 0; this.cristaisRun = 0; this.ganhoFinal = null; this.tutorial = null; this.estatEspeciais = 0;
  }
  emPartida() { return ['INTRO_FASE', 'JOGANDO', 'ALERTA_CHEFE', 'CHEFE', 'FASE_CONCLUIDA', 'MORRENDO'].includes(this.estado); }
  trocar(e) {
    this.estado = e; this.timer = 0; Input.apertou.clear();
    if (!this.emPartida()) this.fundo.hiper = 0;
    if (['MENU', 'HANGAR', 'MAPA', 'CONFIG', 'COMO_JOGAR', 'RECORDES'].includes(e)) Som.tocarMusica('musica_menu');
  }
  pausar() { if (this.estado !== 'MORRENDO') { this.pausado = true; this.opcaoPausa = 0; Input.soltarTudo(); } }

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
      case 'HANGAR': this.fundo.update(); this.efeitos.update(); this.teclasHangar(); break;
      case 'MAPA': this.fundo.update(); this.teclasMapa(); break;
      case 'CONFIG': case 'COMO_JOGAR': case 'RECORDES': this.fundo.update(); if (Input.ap('Escape', 'Backspace')) this.trocar('MENU'); break;
      case 'NOME': this.fundo.update(); this.efeitos.update(); break;
      case 'GAME_OVER': this.fundo.update(); this.efeitos.update();
        if (this.timer > 40) { if (Input.ap('KeyR')) this.novaPartida(this.player.tipo, this.nodoInicio); else if (Input.ap('Enter')) this.trocar('HANGAR'); else if (Input.ap('Escape')) this.trocar('MENU'); }
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
  acaoMenu(i) { this.opcaoMenu = i; this.trocar(['HANGAR', 'CONFIG', 'COMO_JOGAR', 'RECORDES'][i]); }
  teclasHangar() {
    const n = NAVES.length;
    if (Input.ap('ArrowLeft', 'KeyA')) { this.naveHangar = (this.naveHangar + n - 1) % n; Som.tocar('menu'); }
    if (Input.ap('ArrowRight', 'KeyD')) { this.naveHangar = (this.naveHangar + 1) % n; Som.tocar('menu'); }
    if (Input.ap('Escape', 'Backspace')) this.trocar('MENU');
    if (Input.ap('Enter', 'Space')) this.decolar();
  }
  decolar() {
    const n = NAVES[this.naveHangar];
    if (!Dados.dono(n.id)) { Som.tocar('erro'); this.aviso('Compre esta nave primeiro', [255, 120, 120]); return; }
    Dados.prog.naveAtual = n.id; Dados.salvar(); this.naveEscolhida = n; this.noMapa = Math.max(1, ...[...Array(10).keys()].map(i => i + 1).filter(k => Dados.liberada(k))); this.trocar('MAPA');
  }
  teclasMapa() {
    if (Input.ap('ArrowLeft', 'KeyA')) this.noMapa = Math.max(1, this.noMapa - 1);
    if (Input.ap('ArrowRight', 'KeyD')) this.noMapa = Math.min(10, this.noMapa + 1);
    if (Input.ap('ArrowUp', 'KeyW')) this.noMapa = Math.max(1, this.noMapa - 5);
    if (Input.ap('ArrowDown', 'KeyS')) this.noMapa = Math.min(10, this.noMapa + 5);
    if (Input.ap('Escape', 'Backspace')) this.trocar('HANGAR');
    if (Input.ap('Enter', 'Space') && Dados.liberada(this.noMapa)) this.iniciarDoMapa(this.noMapa);
  }
  iniciarDoMapa(n, chefe = false) { telaCheia(); this.novaPartida(this.naveEscolhida || this.player.tipo, n, chefe); }
  atualizarPausa() {
    if (Input.ap('ArrowUp', 'KeyW')) this.opcaoPausa = (this.opcaoPausa + 2) % 3;
    if (Input.ap('ArrowDown', 'KeyS')) this.opcaoPausa = (this.opcaoPausa + 1) % 3;
    if (Input.ap('KeyP', 'Escape')) { this.pausado = false; return; }
    if (Input.ap('Enter')) this.acaoPausa(this.opcaoPausa);
  }
  acaoPausa(i) {
    this.pausado = false;
    if (i === 1) this.novaPartida(this.player.tipo, this.nodoInicio);
    else if (i === 2) { this.guardarGanhos(); this.trocar('HANGAR'); }
  }
  /** Moedas e cristais coletados ficam com o jogador mesmo se ele sair no meio. */
  guardarGanhos(bonusPontos = false) {
    const bonus = bonusPontos ? Math.floor(this.pontos / 100) : 0;
    const pr = dm().premio, mo = Math.round(this.creditosRun * pr), bo = Math.round(bonus * pr);
    this.ganhoFinal = { moedas: mo, bonus: bo, cristais: this.cristaisRun };
    Dados.ganhar(mo + bo, this.cristaisRun);
    this.creditosRun = 0; this.cristaisRun = 0;
  }

  novaPartida(tipo, nodo = 1, chefe = false) {
    this.player = new Player(tipo); this.player.vidas += dm().vidas;
    this.tiros = []; this.inimigos = []; this.novos = []; this.itens = []; this.efeitos.limpar(); this.filaAvisos = []; this.avisoTimer = 0;
    Object.assign(this, { pontos: 0, combo: 0, comboTimer: 0, maiorCombo: 0, abatesTotal: 0, acertos: 0, ciclo: Math.floor((nodo - 1) / 5) + 1, faseIdx: (nodo - 1) % 5, venceu: false, nodoInicio: nodo, irParaChefe: chefe, podeChefe: false,
      posRecorde: -1, pausado: false, faseRecorde: '1', creditosRun: 0, cristaisRun: 0, ganhoFinal: null, estatEspeciais: 0 });
    this.tutorial = (Dados.prog.tutorial || nodo > 1 || chefe) ? null : { passo: 0, t: 0 };
    this.lento = 0; Som.velocidadeMusica(1);
    this.iniciarFase();
  }
  iniciarFase() {
    this.fase = FASES[this.faseIdx]; this.fundo.definir(this.fase); this.chefe = null;
    Object.assign(this, { abatesFase: 0, desafioStatus: 0, maxComboFase: 0, asteroidesFase: 0, danoNaFase: false, bombaNaFase: false, bonusAplicado: false, chefeMorrendo: 0, spawn: 90, chegouChefe: false });
    if (this.irParaChefe) { this.abatesFase = this.fase.meta; this.irParaChefe = false; }
    Som.tocarMusica('musica_fase' + this.fase.n);
    this.trocar('INTRO_FASE');
  }
  dif() { return this.fase.vel * (1 + (this.ciclo - 1) * 0.25) * dm().vel; }

  atualizarPartida() {
    const t = this.timer;
    this.fundo.hiper = this.estado === 'INTRO_FASE' ? Math.max(0, 1 - t / 90) : this.estado === 'FASE_CONCLUIDA' ? clamp((t - 200) / 80, 0, 1) : 0;
    this.fundo.update();
    if (Input.ap('KeyP', 'Escape') && this.estado !== 'MORRENDO') return this.pausar();
    const podeAtirar = ['JOGANDO', 'ALERTA_CHEFE', 'CHEFE'].includes(this.estado);
    this.player.update(this, podeAtirar);
    if (this.comboTimer > 0 && --this.comboTimer === 0) this.combo = 0;

    switch (this.estado) {
      case 'INTRO_FASE': if (t === 25) this.efeitos.fx('teleporte', this.player.x, this.player.y + 20, 0.9); if (t > (this.tutorial ? 120 : 200)) this.trocar('JOGANDO'); break;
      case 'JOGANDO':
        if (this.tutorial) this.atualizarTutorial();
        else if (this.abatesFase < this.fase.meta) this.gerarInimigos();
        else if (!this.inimigos.length || t > 400) { this.trocar('ALERTA_CHEFE'); Som.tocar('alerta'); vibrar([80, 60, 80]); }
        break;
      case 'ALERTA_CHEFE':
        if (t > 170) { this.chefe = new Chefe(this.fase.chefe, this.dif(), (1 + (this.ciclo - 1) * 0.6) * dm().vida); this.chegouChefe = true; Som.tocarMusica('musica_chefe'); this.trocar('CHEFE'); }
        break;
      case 'CHEFE': {
        const c = this.chefe;
        if (c.vivo) {
          if (!(this.lento > 0) || this.quadro % 2 === 0) c.update(this);
          if (this.fase.desafio.id === 'CHEFE_RAPIDO' && this.desafioStatus === 0 && c.tempoLuta > this.fase.desafio.meta * 60) this.falharDesafio();
        } else {
          this.chefeMorrendo++;
          if (this.chefeMorrendo % 6 === 0 && this.chefeMorrendo < 120) {
            this.efeitos.explosao(c.x + (Math.random() - 0.5) * c.w * 0.8, c.y + (Math.random() - 0.5) * c.h * 0.6, 55); Som.tocar('explosao'); this.tremer(8);
          } else if (this.chefeMorrendo === 120) { this.efeitos.explosao(c.x, c.y, 220); this.efeitos.fx('implosao', c.x, c.y, 2.6); this.flash = 25; this.tremer(30); Som.tocar('bomba'); vibrar(200); }
          else if (this.chefeMorrendo > 170) this.concluirFase();
        }
        break;
      }
      case 'FASE_CONCLUIDA':
        if (t > 300 || (t > 60 && (Input.ap('Enter') || this.toqueContinuar))) {
          this.toqueContinuar = false;
          if (this.faseIdx === FASES.length - 1 && this.ciclo === 1 && !this.venceu) { this.venceu = true; this.itens = []; this.tiros = []; this.trocar('VITORIA'); }
          else this.avancarFase();
        }
        break;
      case 'MORRENDO': if (t > 150) this.finalizarPartida(); break;
    }
    if (this.lento > 0 && --this.lento === 0) { Som.velocidadeMusica(1); this.aviso('Velocidade normal', [180, 190, 255]); }
    const inimigosAndam = !(this.lento > 0) || this.quadro % 2 === 0;
    for (const x of this.tiros) if (!x.inimigo || inimigosAndam) x.update(this);
    if (inimigosAndam) for (const x of this.inimigos) x.update(this);
    const ima = this.player.efeitos.IMA > 0 ? 3000 : this.player.at.ima;
    for (const x of this.itens) x.update(this.player, ima);
    this.escudeiros();
    this.colisoes();
    this.efeitos.update();
    if (this.tremor > 0) this.tremor *= 0.88;
    if (this.flash > 0) this.flash--;
    if (this.bordaDano > 0) this.bordaDano--;
  }
  atualizarTutorial() {
    const tu = this.tutorial, p = this.player; tu.t++;
    switch (tu.passo) {
      case 0: if (p.distMovida > 260 && tu.t > 60) this.proximoPasso(); break;
      case 1:
        if (!tu.alvos) { tu.alvos = [0, 1, 2].map(i => { const e = new Inimigo(T.BASICO, W + 40 + i * 60, 150 + i * 120, 1, -0.9, 0); this.inimigos.push(e); return e; }); }
        tu.alvos.forEach((e, i) => { if (e.vivo === false && e.x < -60) { const n = new Inimigo(T.BASICO, W + 40, 150 + i * 120, 1, -0.9, 0); tu.alvos[i] = n; this.inimigos.push(n); } });
        if (tu.alvos.every(e => !e.vivo && e.x >= -60)) this.proximoPasso();
        break;
      case 2: if (p.energia < 100 && p.especialAtivo === 0 && !tu.deu) { p.energia = 100; tu.deu = true; } if (p.especialAtivo > 0) this.proximoPasso(); break;
      case 3:
        if (!tu.deu) { tu.deu = true; for (let i = 0; i < 4; i++) this.inimigos.push(new Inimigo(T.ENXAME, W + 30 + i * 30, 200 + i * 40, 1)); }
        if (this.bombaNaFase) { p.bombas++; this.bombaNaFase = false; this.proximoPasso(); }
        break;
      case 4: if (tu.t > 240) { Dados.prog.tutorial = true; Dados.salvar(); this.tutorial = null; this.abatesFase = 0; this.combo = 0; this.maxComboFase = 0; } break;
    }
  }
  proximoPasso() { this.tutorial.passo++; this.tutorial.t = 0; this.tutorial.deu = false; Som.tocar('powerup'); }
  atualizarVitoria() {
    this.fundo.update(); this.efeitos.update();
    if (this.timer % 25 === 0) this.efeitos.explosao(rnd(150, W - 150), rnd(100, 340), 40);
    if (this.timer < 60) return;
    if (Input.ap('Enter')) this.avancarFase(); else if (Input.ap('Escape')) this.encerrarVitoria();
  }
  encerrarVitoria() { this.faseRecorde = 'Venceu!'; this.finalizarPartida(); }
  avancarFase() {
    if (++this.faseIdx >= FASES.length) { this.faseIdx = 0; this.ciclo++; this.aviso(`CICLO ${this.ciclo} — OS INIMIGOS ESTÃO MAIS FORTES!`, [255, 160, 80]); }
    this.tiros = this.tiros.filter(t => !t.inimigo);
    this.iniciarFase();
  }
  finalizarPartida() {
    if (this.faseRecorde !== 'Venceu!') this.faseRecorde = this.ciclo === 1 ? String(this.fase.n) : `${this.ciclo}-${this.fase.n}`;
    this.guardarGanhos(true);
    if (Dados.entraNoRanking(this.pontos)) { this.trocar('NOME'); abrirNome(this.pontos); }
    else { this.posRecorde = -1; this.trocar('GAME_OVER'); }
  }
  confirmarNome(nome) {
    nome = (nome || '').trim().slice(0, 12) || 'Piloto';
    this.posRecorde = Dados.adicionar(nome, this.pontos, this.faseRecorde, this.player.tipo.nome);
    Som.tocar('powerup'); this.trocar('GAME_OVER');
  }

  gerarInimigos() {
    if (--this.spawn > 0) return;
    const prog = this.abatesFase / this.fase.meta;
    this.spawn = this.fase.intervalo * (1 - 0.3 * prog) / (1 + (this.ciclo - 1) * 0.2) * dm().intervalo;
    if (this.inimigos.length >= 16) return;
    let tipo = sortearTipo(this.fase);
    const conta = id => this.inimigos.filter(i => i.tipo.id === id && i.vivo).length;
    const limites = { TANQUE: this.fase.n >= 5 ? 2 : 1, ATIRADOR: 3, ESCUDEIRO: 1, LASER: 2, TELEPORTE: 2, TORRE: 2 };
    if (limites[tipo.id] !== undefined && conta(tipo.id) >= limites[tipo.id]) tipo = T.ZIGUE;
    const y = 90 + rnd(H - 150), dif = this.dif();
    if (tipo === T.ENXAME) {
      for (let i = 0; i < 6; i++) this.inimigos.push(new Inimigo(T.ENXAME, W + 30 + i * 26, clamp(y + rnd(-30, 30), 70, H - 40), dif));
      this.spawn += 40;
    } else if (tipo === T.TORRE) {
      const teto = Math.random() < 0.5; this.inimigos.push(new Inimigo(T.TORRE, W + 30, teto ? 64 : H - 18, dif));
    } else if ((tipo === T.BASICO || tipo === T.ZIGUE) && Math.random() < 0.3) {
      const n = 4 + Math.floor(rnd(2));
      for (let i = 0; i < n; i++) {
        const yy = tipo === T.ZIGUE ? y : y + (i % 2 === 0 ? 1 : -1) * Math.floor((i + 1) / 2) * 32;
        this.inimigos.push(new Inimigo(tipo, W + 50 + i * 50, clamp(yy, 75, H - 45), dif));
      }
      this.spawn += 50;
    } else this.inimigos.push(new Inimigo(tipo, W + 60, y, dif));
  }
  adicionarInimigo(i) { this.novos.push(i); }
  escudeiros() {
    const esc = this.inimigos.filter(i => i.vivo && i.tipo.id === 'ESCUDEIRO');
    for (const i of this.inimigos) i.protegido = i.tipo.id !== 'ESCUDEIRO' && esc.some(e => hyp(e.x - i.x, e.y - i.y) < 150);
  }

  colisoes() {
    const p = this.player, rp = p.bounds(), c = this.chefe;
    const temChefe = c && c.vivo && this.estado === 'CHEFE';
    const rc = temChefe ? c.bounds() : null;
    for (const t of this.tiros) {
      if (!t.vivo || t.inimigo) continue;
      const rt = t.bounds();
      for (const i of this.inimigos) {
        if (!i.vivo || t.atingidos.has(i) || !intersecta(rt, i.bounds())) continue;
        if (t.tipo === 'OBUS') { t.vivo = false; this.explodirObus(t); break; }
        t.atingidos.add(i); this.acertos++; this.efeitos.acerto(t.x, t.y);
        if (t.perfuracoes > 0) t.perfuracoes--; else t.vivo = false;
        if (i.danificar(t.dano)) this.matar(i); else Som.tocar('acerto');
        if (t.encadeia) this.encadear(i, t.dano * 0.5);
        if (!t.vivo) break;
      }
      if (!t.vivo || !temChefe) continue;
      for (const pt of c.partes) {
        if (!pt.vivo || t.atingidos.has(pt) || !intersecta(rt, pt.bounds(c))) continue;
        if (t.tipo === 'OBUS') { t.vivo = false; this.explodirObus(t); break; }
        t.atingidos.add(pt); this.acertos++; this.efeitos.acerto(t.x, t.y);
        if (t.perfuracoes > 0) t.perfuracoes--; else t.vivo = false;
        this.danificarParte(pt, t.dano);
        if (!t.vivo) break;
      }
      if (t.vivo && c.vivo && !t.atingidos.has(c) && intersecta(rt, rc)) {
        if (t.tipo === 'OBUS') { t.vivo = false; this.explodirObus(t); continue; }
        t.atingidos.add(c); this.acertos++; this.efeitos.acerto(t.x, t.y);
        if (t.perfuracoes > 0) t.perfuracoes--; else t.vivo = false;
        this.danificarChefe(t.dano);
      }
    }
    if (p.laser()) {
      const rl = p.boundsLaser();
      for (const i of this.inimigos) if (i.vivo && intersecta(rl, i.bounds()) && i.danificar(0.35)) this.matar(i);
      if (temChefe) { for (const pt of c.partes) if (pt.vivo && intersecta(rl, pt.bounds(c))) this.danificarParte(pt, 0.3); if (c.vivo && intersecta(rl, rc)) this.danificarChefe(0.3); }
      if (this.quadro % 3 === 0) this.efeitos.faisca(p.x + 40, p.y + (Math.random() - 0.5) * 20, [230, 180, 255]);
    }
    if (p.plasma()) {
      const r = p.tam;
      for (const t of this.tiros) if (t.vivo && t.inimigo && hyp(t.x - p.x, t.y - p.y) < r + 4) { t.vivo = false; this.efeitos.faisca(t.x, t.y, [160, 255, 170]); }
      for (const i of this.inimigos) if (i.vivo && hyp(i.x - p.x, i.y - p.y) < r + i.tipo.tam / 2 && i.danificar(1.2)) this.matar(i);
    }
    if (p.vivo) {
      for (const t of this.tiros) if (t.vivo && t.inimigo && intersecta(t.bounds(), rp)) {
        if (p.vulneravel()) { t.vivo = false; this.levarDano(); } else if (p.turbo() || p.protegidoItem()) { t.vivo = false; this.efeitos.faisca(t.x, t.y, [170, 235, 255]); }
      }
      for (const i of this.inimigos) {
        if (!i.vivo) continue;
        const rl = i.boundsLaser && i.boundsLaser();
        if (rl && intersecta(rl, rp) && p.vulneravel()) this.levarDano();
        if (!intersecta(i.bounds(), rp)) continue;
        if (p.destroiNoContato()) { if (i.danificar(6)) this.matar(i); }
        else if (p.efeitos.BOLHA > 0) { if (i.danificar(0.15)) this.matar(i); }
        else if (p.vulneravel()) { this.levarDano(); if (i.danificar(i.tipo.id === 'TANQUE' ? 3 : 50)) this.matar(i); }
      }
      if (temChefe && c.vivo && intersecta(rc, rp) && p.vulneravel()) this.levarDano();
      for (const u of this.itens) if (u.vivo && intersecta(u.bounds(), rp)) { u.vivo = false; this.coletar(u); }
    }
    this.tiros = this.tiros.filter(t => t.vivo);
    this.inimigos = this.inimigos.filter(i => i.vivo).concat(this.novos); this.novos = [];
    this.itens = this.itens.filter(u => u.vivo);
  }
  encadear(origem, dano) {
    let melhor = null, md = 160;
    for (const i of this.inimigos) { if (!i.vivo || i === origem) continue; const d = hyp(i.x - origem.x, i.y - origem.y); if (d < md) { md = d; melhor = i; } }
    if (!melhor) return;
    this.efeitos.raio(origem.x, origem.y, melhor.x, melhor.y);
    if (melhor.danificar(dano)) this.matar(melhor);
  }
  tempestade(p) {
    const alvos = this.inimigos.filter(i => i.vivo && i.x < W).sort((a, b) => hyp(a.x - p.x, a.y - p.y) - hyp(b.x - p.x, b.y - p.y)).slice(0, 5);
    for (const i of alvos) { this.efeitos.raio(p.x + 20, p.y, i.x, i.y); if (i.danificar(1.6 * p.at.dano)) this.matar(i); }
    const c = this.chefe;
    if (c && c.vivo && this.estado === 'CHEFE' && !c.entrando) {
      const pt = c.partes.find(x => x.vivo);
      if (pt) { this.efeitos.raio(p.x + 20, p.y, c.x + pt.dx, c.y + pt.dy); this.danificarParte(pt, 1.6 * p.at.dano); }
      else { this.efeitos.raio(p.x + 20, p.y, c.x, c.y); this.danificarChefe(1.6 * p.at.dano); }
    }
    if (alvos.length) Som.tocar('raio');
  }
  /** Arma elétrica: raio do bico da nave até os inimigos mais próximos ao alcance, pulando de um para outro. */
  arcoEletrico(p, lv, dano) {
    const alcance = 230 + lv * 30, saltos = 1 + Math.floor(lv / 2), x0 = p.x + p.tam / 2, y0 = p.y;
    const cand = this.inimigos.filter(i => i.vivo && i.x > p.x - 20 && i.x < W && hyp(i.x - x0, i.y - y0) < alcance)
      .sort((a, b) => hyp(a.x - x0, a.y - y0) - hyp(b.x - x0, b.y - y0));
    const c = this.chefe, alvos = [];
    if (cand.length) {
      let atual = cand[0]; alvos.push(atual);
      while (alvos.length < saltos) {
        const prox = cand.filter(i => !alvos.includes(i)).sort((a, b) => hyp(a.x - atual.x, a.y - atual.y) - hyp(b.x - atual.x, b.y - atual.y))[0];
        if (!prox || hyp(prox.x - atual.x, prox.y - atual.y) > 170) break;
        alvos.push(prox); atual = prox;
      }
    }
    let ox = x0, oy = y0;
    for (const i of alvos) { this.efeitos.raio(ox, oy, i.x, i.y); ox = i.x; oy = i.y; if (i.danificar(dano * 1.1)) this.matar(i); this.acertos++; }
    if (!alvos.length && c && c.vivo && this.estado === 'CHEFE' && !c.entrando) {
      const pt = c.partes.find(x => x.vivo && hyp(c.x + x.dx - x0, c.y + x.dy - y0) < alcance + 60);
      if (pt) { this.efeitos.raio(x0, y0, c.x + pt.dx, c.y + pt.dy); this.danificarParte(pt, dano * 1.1); return true; }
      if (hyp(c.x - x0, c.y - y0) < alcance + c.w * 0.4) { this.efeitos.raio(x0, y0, c.x - c.w * 0.25, c.y); this.danificarChefe(dano * 1.1); return true; }
    }
    return alvos.length > 0;
  }
  explodirObus(t) {
    const r = 95;
    this.efeitos.explosao(t.x, t.y, 90); this.efeitos.anel(t.x, t.y, [255, 170, 80], r); Som.tocar('explosao'); this.tremer(6);
    for (const i of this.inimigos) if (i.vivo && hyp(i.x - t.x, i.y - t.y) < r + i.tipo.tam / 2 && i.danificar(t.dano)) this.matar(i);
    const c = this.chefe;
    if (c && c.vivo && this.estado === 'CHEFE') {
      for (const pt of c.partes) if (pt.vivo && hyp(c.x + pt.dx - t.x, c.y + pt.dy - t.y) < r + 20) this.danificarParte(pt, t.dano);
      if (c.vivo && hyp(c.x - t.x, c.y - t.y) < r + c.w * 0.3) this.danificarChefe(t.dano);
    }
  }
  explodirMina(m, porTiro) {
    this.efeitos.explosao(m.x, m.y, 60); Som.tocar('explosao');
    const n = porTiro ? 6 : 10;
    for (let k = 0; k < n; k++) this.tiroInimigo(m.x, m.y, k * Math.PI * 2 / n + (porTiro ? 0.3 : 0), 2.6 * m.dif, [255, 120, 90]);
  }
  pulsoAurora(p) {
    const r = 260;
    this.efeitos.anel(p.x, p.y, [80, 230, 200], r); this.flash = 8;
    for (const t of this.tiros) if (t.inimigo && hyp(t.x - p.x, t.y - p.y) < r) t.vivo = false;
    for (const i of this.inimigos) if (i.vivo && hyp(i.x - p.x, i.y - p.y) < r && i.danificar(8)) this.matar(i);
    p.escudo = true; p.invencivel = Math.max(p.invencivel, 180); p.semPiscar = 180;
  }
  danificarParte(pt, d) {
    const c = this.chefe; if (c.entrando) return;
    pt.vida -= d; pt.flash = 3; this.player.ganharEnergia(d * 0.25);
    if (pt.vida <= 0 && pt.vivo) {
      pt.vivo = false;
      const x = c.x + pt.dx, y = c.y + pt.dy, b = 800 * this.fase.n * this.ciclo;
      this.pontos += b; this.efeitos.texto(x, y - 20, '+' + fmt(b), [255, 220, 90], 18);
      this.efeitos.explosao(x, y, 80); this.tremer(12); Som.tocar('bomba'); vibrar(60);
      this.itens.push(new Item(CRISTAL, x, y, 1));
      for (let k = 0; k < 6; k++) this.itens.push(new Item(MOEDA, x, y, 10));
      if (!c.blindado()) this.aviso('NÚCLEO EXPOSTO! DANO DOBRADO', [255, 220, 90]);
    }
  }
  danificarChefe(d) { this.player.ganharEnergia(d * 0.25); if (this.chefe.danificar(d)) this.derrotarChefe(); }
  mult() { return 1 + Math.min(4, Math.floor(this.combo / 10)); }
  matar(i) {
    i.vivo = false; this.abatesTotal++;
    if (i.tipo.id !== 'FRAGMENTO' && i.tipo.id !== 'ENXAME' && this.estado === 'JOGANDO') this.abatesFase++;
    if (i.tipo.id === 'ENXAME' && this.estado === 'JOGANDO' && Math.random() < 0.34) this.abatesFase++;
    this.combo++; this.comboTimer = 150; this.maiorCombo = Math.max(this.maiorCombo, this.combo); this.maxComboFase = Math.max(this.maxComboFase, this.combo);
    if (this.combo % 10 === 0) this.aviso(`COMBO ${this.combo}!  x${this.mult()}`, [255, 220, 90]);
    const ganho = i.tipo.pontos * this.mult() * this.ciclo;
    this.pontos += ganho;
    this.efeitos.texto(i.x, i.y - 18, '+' + ganho, this.mult() > 1 ? [255, 220, 90] : [255, 255, 255], 14);
    this.efeitos.explosao(i.x, i.y, i.tipo.tam); Som.tocar('explosao');
    this.player.ganharEnergia(i.tipo.id === 'FRAGMENTO' || i.tipo.id === 'ENXAME' ? 2 : 6);
    if (i.tipo.id === 'TANQUE') this.tremer(10);
    if (i.tipo.id === 'MINA') this.explodirMina(i, true);
    if (i.tipo.id === 'ASTEROIDE') {
      this.asteroidesFase++;
      for (const s of [-1, 1]) this.adicionarInimigo(new Inimigo(T.FRAGMENTO, i.x, i.y, this.dif(), i.vx * 0.8 - 0.5, s * rnd(1, 2)));
    }
    if (Math.random() < i.tipo.moeda) { const n = i.tipo.id === 'TANQUE' ? 5 : 1; for (let k = 0; k < n; k++) this.itens.push(new Item(MOEDA, i.x, i.y, 5)); }
    if (Math.random() < i.tipo.drop || this.abatesTotal % 15 === 0) {
      const garantido = this.abatesTotal % 45 === 15 ? POWERUPS[0] : this.abatesTotal % 45 === 30 ? sortearArma() : null;
      this.itens.push(new Item(garantido || sortearPowerUp(), i.x, i.y));
    }
    this.verificarDesafio();
  }
  derrotarChefe() {
    const c = this.chefe, bonus = 5000 * this.fase.n * this.ciclo;
    this.pontos += bonus;
    this.efeitos.texto(c.x, c.y - c.h / 2, '+' + fmt(bonus), [255, 220, 90], 26);
    for (const t of this.tiros) if (t.inimigo) t.vivo = false;
    for (const i of this.inimigos) { i.vivo = false; this.efeitos.explosao(i.x, i.y, 30); }
    for (let k = 0; k < 3; k++) this.itens.push(new Item(k === 0 ? POWERUPS[0] : k === 1 ? sortearArma() : sortearPowerUp(), c.x - 70, c.y - 55 + k * 55));
    for (let k = 0; k < 2; k++) this.itens.push(new Item(CRISTAL, c.x, c.y, 1));
    for (let k = 0; k < 15; k++) this.itens.push(new Item(MOEDA, c.x, c.y, 10));
    this.chefeMorrendo = 0;
    if (this.fase.desafio.id === 'CHEFE_RAPIDO' && this.desafioStatus === 0) this.concluirDesafio();
    if (this.fase.n === 2 && Dados.liberar('TITA')) this.aviso('NOVA NAVE LIBERADA: TITÃ!', [120, 255, 120]);
  }
  concluirFase() {
    if (this.bonusAplicado) return;
    this.bonusAplicado = true;
    const d = this.fase.desafio;
    if (this.desafioStatus === 0) {
      if ((d.id === 'SEM_DANO' && !this.danoNaFase) || (d.id === 'SEM_BOMBA' && !this.bombaNaFase)) this.concluirDesafio(); else this.falharDesafio();
    }
    const nodo = (this.ciclo - 1) * 5 + this.fase.n, est = 1 + (this.desafioStatus === 1 ? 1 : 0) + (this.danoNaFase ? 0 : 1);
    const novoRec = nodo <= 10 ? Dados.registrarEstrelas(nodo, est) : false;
    const bd = 2500 * this.fase.n * this.ciclo, bv = 1000 * this.player.vidas * this.ciclo;
    this.resumo = [['Chefe derrotado', '+' + fmt(5000 * this.fase.n * this.ciclo)]];
    if (this.desafioStatus === 1) { this.pontos += bd; this.resumo.push(['Desafio: ' + d.descricao, '+' + fmt(bd)]); }
    else this.resumo.push(['Desafio: ' + d.descricao, 'falhou']);
    this.pontos += bv;
    this.resumo.push([`Vidas restantes (${this.player.vidas})`, '+' + fmt(bv)], ['Estrelas' + (novoRec ? ' (novo!)' : ''), '★'.repeat(est) + '☆'.repeat(3 - est)], ['Coletado até agora', `¢ ${this.creditosRun} · 💎 ${this.cristaisRun}`]);
    this.trocar('FASE_CONCLUIDA');
  }
  verificarDesafio() {
    if (this.desafioStatus !== 0) return;
    const d = this.fase.desafio;
    if ((d.id === 'COMBO' && this.maxComboFase >= d.meta) || (d.id === 'ASTEROIDES' && this.asteroidesFase >= d.meta)) this.concluirDesafio();
  }
  concluirDesafio() {
    this.desafioStatus = 1;
    Dados.somarDesafio();
    this.aviso('DESAFIO CONCLUÍDO!', [120, 255, 160]); Som.tocar('powerup');
    this.cristaisRun++;
    if (Dados.prog.desafios >= 3 && Dados.liberar('FANTASMA')) this.aviso('NOVA NAVE LIBERADA: FANTASMA!', [220, 140, 255]);
  }
  falharDesafio() { if (this.desafioStatus !== 0) return; this.desafioStatus = -1; this.aviso('Desafio falhou', [255, 120, 120]); }
  levarDano() {
    const p = this.player;
    if (p.escudo) { p.escudo = false; p.timerEscudo = 0; p.invencivel = 90; this.efeitos.anel(p.x, p.y, [100, 200, 255], 80); Som.tocar('acerto'); this.tremer(6); vibrar(30); return; }
    p.vidas--; p.arma = Math.max(1, p.arma - 1); p.invencivel = 150; this.danoNaFase = true; this.bordaDano = 40;
    if (this.fase.desafio.id === 'SEM_DANO') this.falharDesafio();
    this.combo = 0; this.tremer(18); Som.tocar('dano'); vibrar(120); this.efeitos.explosao(p.x, p.y, 40);
    if (p.vidas <= 0) { p.vivo = false; this.efeitos.explosao(p.x, p.y, 150); this.flash = 15; this.tremer(30); Som.tocar('bomba'); vibrar([100, 50, 250]); this.trocar('MORRENDO'); }
  }
  coletar(u) {
    const p = this.player;
    if (u.tipo === MOEDA) { this.creditosRun += u.valor; Som.tocar('moeda'); return; }
    if (u.tipo === CRISTAL) { this.cristaisRun += u.valor; Som.tocar('powerup'); this.efeitos.texto(p.x, p.y - 32, '+1 💎', CRISTAL.cor, 16); return; }
    const t = u.tipo; Som.tocar('powerup'); this.efeitos.fx('coleta', p.x, p.y, 0.9);
    let txt = t.nome;
    switch (t.id) {
      case 'ARMA': if (p.arma < 5) p.arma++; else { this.pontos += 1000; txt = 'ARMA MÁXIMA +1000'; } break;
      case 'TIPO_ARMA':
        if (p.tipoArma === t.arma) { if (p.arma < 5) { p.arma++; txt = `${t.nome} NÍVEL ${p.arma}`; } else { this.pontos += 1000; txt = `${t.nome} MÁXIMO +1000`; } }
        else { p.tipoArma = t.arma; txt = `${t.nome} NÍVEL ${p.arma}`; }
        break;
      case 'RAPIDO': p.tiroRapido = 480; break;
      case 'BOLHA': case 'ESTRELA': case 'CANHAO': case 'IMA': p.efeitos[t.id] = t.tempo; break;
      case 'LENTO': this.lento = t.tempo; Som.velocidadeMusica(0.8); break;
      case 'CURA':
        if (p.vidas < p.at.vidas) { p.vidas++; txt = 'REPARO +1 VIDA'; }
        else { p.escudo = true; txt = 'REPARO: ESCUDO'; }
        break;
      case 'ESCUDO': p.escudo = true; break;
      case 'ENERGIA': p.ganharEnergia(50); break;
      case 'BOMBA': p.bombas = Math.min(5, p.bombas + 1); break;
      case 'VIDA': p.vidas = Math.min(9, p.vidas + 1); break;
    }
    this.efeitos.texto(p.x, p.y - 32, txt, t.cor, 15); this.efeitos.anel(p.x, p.y, t.cor, 50);
  }
  detonarBomba() {
    this.bombaNaFase = true;
    if (this.fase.desafio.id === 'SEM_BOMBA' && !this.tutorial) this.falharDesafio();
    Som.tocar('bomba'); this.flash = 20; this.tremer(25); vibrar(150);
    this.efeitos.anel(this.player.x, this.player.y, [255, 255, 255], 900); this.efeitos.fx('plasma', this.player.x + 160, this.player.y, 3.4);
    for (const t of this.tiros) if (t.inimigo) t.vivo = false;
    for (const i of this.inimigos) if (i.vivo && i.danificar(25)) this.matar(i);
    const c = this.chefe;
    if (c && c.vivo && this.estado === 'CHEFE') { for (const pt of c.partes) if (pt.vivo) this.danificarParte(pt, pt.vidaMax * 0.25); this.danificarChefe(c.vidaMax * 0.05 + 15); }
    this.player.invencivel = Math.max(this.player.invencivel, 60);
    this.aviso('BOMBA!', [255, 120, 90]);
  }
  tiroInimigo(x, y, a, v, cor) { const t = new Tiro(x, y, Math.cos(a) * v, Math.sin(a) * v, 1, true, 'ESFERA'); if (cor) t.cor = cor; this.tiros.push(t); }
  tiroMirado(x, y, v) { this.tiroInimigo(x, y, Math.atan2(this.player.y - y, this.player.x - x), v); }
  alvoMaisProximo(x, y) {
    let m = null, md = Infinity;
    for (const i of this.inimigos) { if (!i.vivo || i.x > W + 10) continue; const d = hyp(i.x - x, i.y - y); if (d < md) { md = d; m = i; } }
    const c = this.chefe;
    if (c && c.vivo && !c.entrando) {
      for (const pt of c.partes) if (pt.vivo) { const d = hyp(c.x + pt.dx - x, c.y + pt.dy - y) - 40; if (d < md) { md = d; m = { x: c.x + pt.dx, y: c.y + pt.dy }; } }
      if (hyp(c.x - x, c.y - y) - 80 < md) m = c;
    }
    return m;
  }
  tremer(v) { this.tremor = Math.max(this.tremor, v); }
  aviso(s, c) { if (this.avisoTimer > 0) this.filaAvisos.push([s, c]); else { this.avisoTxt = s; this.avisoCor = c; this.avisoTimer = 110; } }

  // ---------------------------------------------------------- desenho
  desenhar(g) {
    botoes = [];
    g.imageSmoothingEnabled = false;
    this.fundo.desenhar(g);
    switch (this.estado) {
      case 'MENU': this.telaMenu(g); break;
      case 'HANGAR': this.telaHangar(g); break;
      case 'MAPA': this.telaMapa(g); break;
      case 'CONFIG': this.telaConfig(g); break;
      case 'COMO_JOGAR': this.telaComoJogar(g); break;
      case 'RECORDES': this.telaRecordes(g); break;
      case 'NOME': this.efeitos.desenhar(g); break;
      case 'GAME_OVER': this.efeitos.desenhar(g); this.telaGameOver(g); break;
      default: this.desenharPartida(g);
    }
    if (this.avisoTimer > 0 && this.avisoTxt && !this.pausado) {
      const t = this.avisoTimer, a = Math.min(1, t / 25), s = t > 100 ? 1 + (t - 100) * 0.04 : 1;
      g.globalAlpha = a; texto(g, this.avisoTxt, W / 2, 124, Math.round(24 * s), rgba(this.avisoCor, 1), 'center'); g.globalAlpha = 1;
    }
  }
  desenharPartida(g) {
    let sx = 0, sy = 0;
    if (this.tremor > 0.5 && !this.pausado) { sx = (Math.random() - 0.5) * this.tremor; sy = (Math.random() - 0.5) * this.tremor; }
    g.save(); g.translate(Math.round(sx), Math.round(sy));
    for (const u of this.itens) u.desenhar(g);
    for (const i of this.inimigos) i.desenhar(g);
    const esc = this.inimigos.filter(i => i.tipo.id === 'ESCUDEIRO');
    for (const e of esc) for (const i of this.inimigos) if (i.protegido && hyp(e.x - i.x, e.y - i.y) < 150) { g.strokeStyle = 'rgba(110,190,255,.35)'; g.lineWidth = 1; g.beginPath(); g.moveTo(e.x, e.y); g.lineTo(i.x, i.y); g.stroke(); }
    if (this.chefe && (this.chefe.vivo || this.chefeMorrendo < 120)) this.chefe.desenhar(g);
    for (const t of this.tiros) if (!t.inimigo) t.desenhar(g);
    this.player.desenhar(g);
    for (const t of this.tiros) if (t.inimigo) t.desenhar(g);
    this.efeitos.desenhar(g);
    g.restore();
    if (this.flash > 0) { g.fillStyle = `rgba(255,255,255,${Math.min(1, this.flash / 25)})`; g.fillRect(0, 0, W, H); }
    if (this.lento > 0) { g.fillStyle = `rgba(90,110,255,${this.lento < 60 ? this.lento / 600 : 0.1})`; g.fillRect(0, 0, W, H); }
    const baixa = this.player.vivo && this.player.vidas <= 1 && this.estado !== 'FASE_CONCLUIDA' && this.estado !== 'VITORIA';
    const aBorda = Math.max((this.bordaDano || 0) / 40 * 0.7, baixa ? 0.14 + 0.1 * Math.sin(this.quadro * 0.12) : 0);
    if (aBorda > 0.01) { const gr = g.createRadialGradient(W / 2, H / 2, H * 0.4, W / 2, H / 2, W * 0.62); gr.addColorStop(0, 'rgba(255,0,0,0)'); gr.addColorStop(1, `rgba(255,20,20,${aBorda})`); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
    if (this.estado !== 'VITORIA') this.hud(g);
    if (this.estado === 'INTRO_FASE') this.telaIntro(g);
    if (this.estado === 'ALERTA_CHEFE') this.telaAlerta(g);
    if (this.estado === 'FASE_CONCLUIDA') this.telaFaseConcluida(g);
    if (this.estado === 'VITORIA') this.telaVitoria(g);
    if (this.tutorial && this.estado === 'JOGANDO') this.telaTutorial(g);
    if (this.pausado) this.telaPausa(g);
  }

  hud(g) {
    const p = this.player, q = this.quadro;
    g.fillStyle = 'rgba(4,6,18,.78)'; g.fillRect(0, 0, W, 58);
    g.fillStyle = 'rgba(120,150,255,.25)'; g.fillRect(0, 58, W, 1);
    g.font = '800 28px ui-monospace, Menlo, Consolas, monospace'; g.textAlign = 'left';
    const pts = String(this.pontos).padStart(8, '0');
    g.fillStyle = 'rgba(0,0,0,.7)'; g.fillText(pts, 14, 40); g.fillStyle = AMARELO; g.fillText(pts, 12, 38);
    let x = 12 + g.measureText(pts).width + 16;
    // vidas, bombas, arma e especial: ícones grandes em vez de rótulos pequenos
    const mini = Arte.nave(p.tipo.id, p.pecas, 0).img, vs = '×' + p.vidas, baixa = p.vidas <= 1;
    g.drawImage(mini, x, 17, 42, 22); texto(g, vs, x + 48, 40, 24, baixa && pisca(q, 12) ? '#ff5a5a' : '#fff'); x += 48 + largura(g, vs, 24) + 16;
    const bs = '×' + p.bombas;
    texto(g, '💣', x, 40, 24, '#fff', 'left', false); texto(g, bs, x + 32, 40, 24, p.bombas ? '#fff' : '#777'); x += 32 + largura(g, bs, 24) + 16;
    const arma = ARMAS[p.tipoArma], corArma = p.tipoArma === 'PADRAO' ? AMARELO : rgba(arma.cor, 1);
    for (let i = 0; i < 5; i++) { g.fillStyle = i < p.arma ? corArma : '#3c3c50'; g.fillRect(x + i * 15, 17, 11, 24); }
    x += 5 * 15 + 12;
    const pronto = p.energia >= 100;
    texto(g, '★', x, 40, 26, pronto ? '#fff' : rgba(p.tipo.cor, 1), 'left', false);
    barra(g, x + 30, 20, 84, 20, p.energia / 100, pronto ? (pisca(q, 8) ? '#fff' : rgba(p.tipo.cor, 1)) : rgba(p.tipo.cor, 0.55));
    const fx = W - 246;
    texto(g, `FASE ${this.fase.n}${this.ciclo > 1 ? ' · C' + this.ciclo : ''}`, fx, 24, 16, CINZA);
    if (this.estado === 'CHEFE' || this.estado === 'ALERTA_CHEFE') texto(g, 'CHEFE!', fx, 50, 24, '#ff5a5a');
    else { barra(g, fx, 30, 168, 22, this.abatesFase / this.fase.meta, CIANO); texto(g, `${Math.min(this.abatesFase, this.fase.meta)} / ${this.fase.meta}`, fx + 84, 47, 16, '#fff', 'center'); }
    caixa(g, W - 62, 6, 54, 46, 10, 'rgba(255,255,255,.08)', 'rgba(255,255,255,.3)', 1.5);
    g.fillStyle = '#fff'; g.fillRect(W - 45, 16, 6, 26); g.fillRect(W - 31, 16, 6, 26);
    botoes.push({ x: W - 70, y: 0, w: 70, h: 60, acao: () => this.pausar() });
    // moedas da partida e combo
    moedas(g, 12, 86, this.creditosRun, this.cristaisRun, 18);
    if (this.combo >= 3) {
      texto(g, 'COMBO ' + this.combo, 12, 116, 22, this.mult() > 1 ? AMARELO : '#fff');
      if (this.mult() > 1) texto(g, 'x' + this.mult(), 12 + largura(g, 'COMBO ' + this.combo, 22) + 10, 118, 30, '#ff823c');
      barra(g, 12, 124, 130, 7, this.comboTimer / 150, this.mult() > 1 ? '#ff823c' : '#fff');
    }
    // itens com tempo ativos: ícone + barra regressiva
    const ativos = [['RAPIDO', p.tiroRapido]].concat(Object.entries(p.efeitos)).concat([['LENTO', this.lento || 0]]).filter(([, v]) => v > 0);
    ativos.forEach(([id, v], k) => {
      const it = ITEM_DE(id), y = 158 + k * 36;
      g.save(); g.translate(26, y); g.scale(0.9, 0.9); desenharItem(g, it, 0, 0); g.restore();
      barra(g, 48, y - 5, 70, 10, v / it.tempo, rgba(it.cor, v < 90 && pisca(this.quadro, 5) ? 0.4 : 1));
      texto(g, Math.ceil(v / 60) + 's', 124, y + 6, 17, '#fff');
    });
    if (!this.tutorial) {
      const d = this.fase.desafio;
      let s = 'DESAFIO: ' + d.descricao;
      if (d.id === 'COMBO') s += `  (${Math.min(this.maxComboFase, d.meta)}/${d.meta})`;
      if (d.id === 'ASTEROIDES') s += `  (${Math.min(this.asteroidesFase, d.meta)}/${d.meta})`;
      if (d.id === 'CHEFE_RAPIDO' && this.chefe && this.chefe.vivo) s += `  (${Math.max(0, d.meta - Math.floor(this.chefe.tempoLuta / 60))}s)`;
      if (this.desafioStatus === 1) s += '  ✔'; if (this.desafioStatus === -1) s += '  ✘';
      const lw = largura(g, s, 16, 700);
      caixa(g, W / 2 - lw / 2 - 12, 66, lw + 24, 28, 8, 'rgba(0,0,0,.55)', null);
      texto(g, s, W / 2, 86, 16, this.desafioStatus === 1 ? '#78ff96' : this.desafioStatus === -1 ? 'rgba(255,110,110,.8)' : '#fff', 'center', false, 700);
    }
    const c = this.chefe;
    if (c && c.vivo && this.estado === 'CHEFE') {
      const w = Math.min(460, W - 470), x2 = W / 2 - w / 2, y = H - 36;
      const info = c.entrando ? '' : c.blindado() ? ' · BLINDADO — destrua as peças' : '';
      texto(g, `${c.nome.toUpperCase()} · FORMA ${c.forma}${info}`, W / 2, y - 8, 17, c.forma === 3 ? '#ff6e6e' : '#fff', 'center');
      barra(g, x2, y, w, 18, c.vida / c.vidaMax, c.forma === 3 ? '#ff3232' : c.forma === 2 ? '#ff9a3c' : '#ffc23c');
      for (const k of [0.33, 0.66]) { g.fillStyle = 'rgba(0,0,0,.7)'; g.fillRect(x2 + w * k, y, 2, 18); }
      // aviso de ataque: anel que fecha no núcleo + nome do ataque antes de disparar
      if (!c.entrando && c.timerPadrao < 36) {
        const k = c.timerPadrao / 36, cx = c.x - c.w * 0.35, r = 110 - 80 * k;
        g.strokeStyle = `rgba(255,70,70,${0.3 + 0.6 * k})`; g.lineWidth = 4; g.beginPath(); g.arc(cx, c.y, r, 0, Math.PI * 2); g.stroke();
        texto(g, '⚠ ' + c.ataqueAtual().toUpperCase(), clamp(c.x, 150, W - 150), clamp(c.y - c.h / 2 - 8, 110, H - 80), 20, '#ff6a6a', 'center');
      }
    }
    if (usouToque && ['JOGANDO', 'ALERTA_CHEFE', 'CHEFE', 'INTRO_FASE'].includes(this.estado) && !this.pausado) this.botoesToque(g);
    if (Input.joy) {
      const j = Input.joy, jx = j.x - j.ox, jy = j.y - j.oy, d = hyp(jx, jy), k = d > 55 ? 55 / d : 1;
      g.fillStyle = 'rgba(255,255,255,.08)'; g.strokeStyle = 'rgba(255,255,255,.3)'; g.lineWidth = 2;
      g.beginPath(); g.arc(j.ox, j.oy, 55, 0, Math.PI * 2); g.fill(); g.stroke();
      g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.arc(j.ox + jx * k, j.oy + jy * k, 22, 0, Math.PI * 2); g.fill();
    }
  }
  botoesToque(g) {
    const p = this.player, pronto = p.energia >= 100, destaque = this.tutorial && this.tutorial.passo;
    const ex = W - 88, ey = H - 94, er = 56;
    g.fillStyle = pronto ? rgba(p.tipo.cor, 0.3) : 'rgba(10,14,34,.55)'; g.beginPath(); g.arc(ex, ey, er, 0, Math.PI * 2); g.fill();
    g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = 6; g.beginPath(); g.arc(ex, ey, er - 4, 0, Math.PI * 2); g.stroke();
    g.strokeStyle = pronto && pisca(this.quadro, 10) ? '#fff' : rgba(p.tipo.cor, 1); g.lineCap = 'round';
    g.beginPath(); g.arc(ex, ey, er - 4, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * p.energia / 100); g.stroke(); g.lineCap = 'butt';
    texto(g, '★', ex, ey + 6, 38, pronto ? '#fff' : 'rgba(255,255,255,.45)', 'center');
    texto(g, pronto ? 'ESPECIAL' : Math.floor(p.energia) + '%', ex, ey + 30, 16, pronto ? '#fff' : CINZA, 'center');
    botoes.push({ x: ex - er - 8, y: ey - er - 8, w: er * 2 + 16, h: er * 2 + 16, acao: () => { if (pronto) p.querEspecial = true; else vibrar(15); } });
    const bx = W - 214, by = H - 68, br = 44, tem = p.bombas > 0;
    g.fillStyle = tem ? 'rgba(255,70,70,.28)' : 'rgba(10,14,34,.5)'; g.beginPath(); g.arc(bx, by, br, 0, Math.PI * 2); g.fill();
    g.strokeStyle = tem ? 'rgba(255,120,110,.9)' : 'rgba(255,255,255,.2)'; g.lineWidth = 3; g.stroke();
    texto(g, '💣', bx, by + 9, 34, '#fff', 'center', false);
    caixa(g, bx + 18, by - br - 4, 30, 26, 10, tem ? '#ff4b46' : '#444', null);
    texto(g, String(p.bombas), bx + 33, by - br + 15, 18, '#fff', 'center', false);
    botoes.push({ x: bx - br - 8, y: by - br - 8, w: br * 2 + 16, h: br * 2 + 16, acao: () => { if (tem) p.querBomba = true; else vibrar(15); } });
    if (destaque === 2 || destaque === 3) {
      const [x, y, r] = destaque === 2 ? [ex, ey, er] : [bx, by, br], k = 1 + 0.12 * Math.sin(this.quadro * 0.2);
      g.strokeStyle = AMARELO; g.lineWidth = 3; g.beginPath(); g.arc(x, y, (r + 10) * k, 0, Math.PI * 2); g.stroke();
    }
  }
  telaTutorial(g) {
    const tu = this.tutorial, d = TUTORIAL[tu.passo], s = usouToque ? d.toque : d.pc;
    const w = Math.min(560, W - 260), x = W / 2 - w / 2, y = 150;
    const linhas = largura(g, s, 16, 700) > w - 32 ? 2 : 1;
    caixa(g, x, y, w, 36 + linhas * 20, 14, 'rgba(8,10,24,.88)', AMARELO, 2);
    texto(g, `TUTORIAL ${tu.passo + 1}/5`, x + 16, y + 20, 11, AMARELO);
    quebrar(g, s, x + 16, y + 42, w - 32, 16, '#fff', 700);
    if (tu.passo === 0) {
      const k = (this.quadro % 90) / 90, hx = W * 0.35 + Math.sin(k * Math.PI * 2) * 60, hy = H * 0.62 + Math.cos(k * Math.PI * 2) * 30;
      texto(g, '👆', hx, hy, 34, '#fff', 'center', false);
    }
    botao(g, 'Pular tutorial', W - 90, 70, 150, 34, () => { Dados.prog.tutorial = true; Dados.salvar(); this.tutorial = null; this.abatesFase = 0; }, { tam: 13 });
  }
  telaIntro(g) {
    const t = this.timer, fim = this.tutorial ? 120 : 200, a = t < 20 ? t / 20 : t > fim - 30 ? Math.max(0, (fim - t) / 30) : 1;
    g.globalAlpha = a;
    texto(g, `FASE ${this.fase.n}${this.ciclo > 1 ? '  ·  CICLO ' + this.ciclo : ''}`, W / 2, 210, 42, AMARELO, 'center');
    texto(g, this.fase.nome, W / 2, 250, 24, '#fff', 'center');
    if (!this.tutorial) {
      texto(g, `Destrua ${this.fase.meta} inimigos para enfrentar o chefe`, W / 2, 292, 15, '#c8d2f0', 'center', true, 600);
      texto(g, 'Desafio bônus: ' + this.fase.desafio.descricao, W / 2, 320, 17, '#78ffaa', 'center');
    }
    g.globalAlpha = 1;
  }
  telaAlerta(g) {
    if (pisca(this.timer, 15)) { g.fillStyle = 'rgba(255,0,0,.16)'; g.fillRect(0, 0, W, H); texto(g, '⚠  ALERTA  ⚠', W / 2, 240, 42, '#ff4646', 'center'); }
    texto(g, this.fase.chefe.nome.toUpperCase() + ' SE APROXIMA', W / 2, 284, 22, '#fff', 'center');
    texto(g, 'Destrua as peças do chefe para expor o núcleo', W / 2, 312, 14, CINZA, 'center', true, 600);
  }
  telaFaseConcluida(g) {
    const w = Math.min(560, W - 40), h = 340, x = W / 2 - w / 2, y = 150;
    painel(g, x, y, w, h);
    texto(g, `FASE ${this.fase.n} CONCLUÍDA!`, W / 2, y + 50, 36, AMARELO, 'center');
    let yy = y + 98;
    this.resumo.forEach((l, i) => {
      if (this.timer < 30 + i * 25) return;
      texto(g, l[0], x + 30, yy, 18, '#fff', 'left', true, 600);
      texto(g, l[1], x + w - 30, yy, 20, l[1] === 'falhou' ? '#ff6e6e' : i === 3 ? AMARELO : '#78ff96', 'right');
      yy += 40;
    });
    if (this.timer > 60) {
      texto(g, 'Total: ' + fmt(this.pontos), x + 30, y + h - 22, 17, AMARELO);
      texto(g, usouToque ? 'toque para continuar' : 'ENTER para continuar', x + w - 30, y + h - 22, 12, CINZA, 'right');
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
    texto(g, 'PAUSADO', W / 2, 110, 40, '#fff', 'center');
    ['Continuar', 'Recomeçar', 'Sair para o Hangar'].forEach((s, i) => botao(g, s, W / 2, 168 + i * 68, 340, 58, () => this.acaoPausa(i), { sel: i === this.opcaoPausa, tam: 22 }));
    texto(g, `Coletado: ¢ ${this.creditosRun} · 💎 ${this.cristaisRun} (fica com você)`, W / 2, 384, 17, CINZA, 'center', true, 600);
    botao(g, Som.mudo ? '🔇 Som desligado' : '🔊 Som ligado', W / 2 - 120, 436, 230, 52, () => this.alternarSom(), { tam: 18 });
    botao(g, Config.controle === 'joystick' ? '🕹 Joystick' : '👆 Deslizar', W / 2 + 120, 436, 230, 52, () => { Config.controle = Config.controle === 'joystick' ? 'deslizar' : 'joystick'; Config.salvar(); }, { tam: 18 });
    texto(g, usouToque ? 'Deslize para mover · toque para atirar · ★ especial · 💣 bomba' : 'Setas/WASD mover · Espaço atirar · X especial · C bomba · P pausar · M som', W / 2, 510, 15, CINZA, 'center', true, 600);
  }

  // ---------------------------------------------------------- telas de menu
  telaMenu(g) {
    const q = this.quadro, n = NAVES[this.naveHangar];
    const nv = Arte.ampliar(Arte.nave(n.id, Dados.pecas(n.id), Math.floor(q / 4)).img, 2);
    g.drawImage(nv, W * 0.08, 240 + Math.sin(q * 0.03) * 18);
    const ufo = Arte.inimigo('BASICO');
    for (let i = 0; i < 3; i++) desenharCentro(g, Arte.ampliar(ufo, 1.4), W * 0.84 + (i % 2) * 44, 220 + i * 62 + Math.sin(q * 0.04 + i) * 14);
    titulo(g, 'NAVINHA', 106, q, 72);
    texto(g, 'E S P A C I A L', W / 2, 142, 22, CIANO, 'center');
    ['JOGAR', 'CONFIGURAÇÕES', 'COMO JOGAR', 'RECORDES'].forEach((s, i) =>
      botao(g, s, W / 2, 218 + i * 68, 360, 58, () => this.acaoMenu(i), { sel: i === this.opcaoMenu && !usouToque, tam: i === 0 ? 28 : 22, cor: i === 0 ? AMARELO : undefined }));
    moedas(g, W - 16, 32, Dados.prog.creditos, Dados.prog.cristais, 20, 'right');
    botao(g, Som.mudo ? '🔇' : '🔊', W - 44, H - 40, 64, 56, () => this.alternarSom(), { tam: 26 });
    if (document.fullscreenEnabled) botao(g, '⛶', W - 116, H - 40, 64, 56, () => alternarTelaCheia(), { tam: 26 });
    if (!instalado()) botao(g, '📲 Instalar', W - 250, H - 40, 170, 56, () => instalar(), { tam: 19 });
    if (Dados.recordes.length) { const r = Dados.recordes[0]; texto(g, `RECORDE: ${r.nome} — ${fmt(r.pontos)}`, W / 2, 490, 18, '#ffaa50', 'center'); }
    if (!usouToque) texto(g, '↑ ↓ escolher · ENTER confirmar · M som', W / 2, 516, 15, CINZA, 'center', true, 600);
    texto(g, 'v' + VERSAO, 14, H - 12, 15, '#787d96', 'left', true, 600);
  }

  telaHangar(g) {
    const nave = NAVES[this.naveHangar], dono = Dados.dono(nave.id), pc = Dados.pecas(nave.id), at = atributos(nave, pc);
    texto(g, 'HANGAR', 20, 40, 32, '#fff');
    moedas(g, W - 20, 40, Dados.prog.creditos, Dados.prog.cristais, 22, 'right');
    // --- nave
    const lw = Math.min(400, W * 0.44), lx = 14;
    painel(g, lx, 56, lw, 418);
    const s = Arte.nave(nave.id, pc, Math.floor(this.quadro / 4)), big = Arte.ampliar(s.img, 3);
    g.globalAlpha = dono ? 1 : 0.35;
    g.drawImage(big, lx + lw / 2 - big.width / 2, 74 + Math.sin(this.quadro * 0.05) * 4);
    g.globalAlpha = 1;
    botao(g, '‹', lx + 32, 128, 54, 76, () => { this.naveHangar = (this.naveHangar + NAVES.length - 1) % NAVES.length; }, { tam: 36 });
    botao(g, '›', lx + lw - 32, 128, 54, 76, () => { this.naveHangar = (this.naveHangar + 1) % NAVES.length; }, { tam: 36 });
    texto(g, nave.nome.toUpperCase(), lx + lw / 2, 212, 30, rgba(nave.cor, 1), 'center');
    texto(g, nave.desc, lx + lw / 2, 236, 15, '#fff', 'center', true, 600);
    NAVES.forEach((n, i) => { g.fillStyle = i === this.naveHangar ? '#fff' : Dados.dono(n.id) ? 'rgba(255,255,255,.4)' : 'rgba(255,255,255,.15)'; g.fillRect(lx + lw / 2 - NAVES.length * 8 + i * 16, 246, 9, 5); });
    const vals = [['Velocidade', at.vel / 7], ['Resistência', at.vidas / 7], ['Poder de fogo', Math.min(1, at.dano * 60 / at.cadencia / 10 + (nave.perfurante || nave.encadeia ? 0.15 : 0))]];
    vals.forEach(([r, v], k) => { texto(g, r, lx + 18, 276 + k * 32, 15, CINZA); barra(g, lx + 18, 282 + k * 32, lw - 36, 11, v, rgba(nave.cor, 1)); });
    texto(g, 'ESPECIAL: ' + nave.especial, lx + 18, 384, 16, AMARELO);
    quebrar(g, nave.descEsp, lx + 18, 404, lw - 36, 15, '#fff');
    texto(g, `${at.vidas} vidas · ${at.bombas} bombas${at.drones ? ' · ' + at.drones + ' drone' + (at.drones > 1 ? 's' : '') : ''}${at.escudoInicial ? ' · escudo' : ''}`, lx + 18, 464, 15, CIANO);
    // --- peças ou compra
    const rx = lx + lw + 12, rw = W - rx - 14;
    painel(g, rx, 56, rw, 418);
    if (dono) {
      texto(g, 'PEÇAS', rx + 16, 82, 18, AMARELO);
      PECAS.forEach((pe, k) => {
        const y = 92 + k * 76, lv = pc[pe.id], custo = Dados.custoMelhoria(nave.id, pe.id);
        g.drawImage(Arte.iconePeca(pe.id), rx + 14, y + 8);
        texto(g, pe.nome, rx + 58, y + 24, 20, '#fff');
        for (let i = 0; i < 5; i++) { g.fillStyle = i < lv ? AMARELO : '#3c3c50'; g.fillRect(rx + 58 + i * 20, y + 32, 16, 9); }
        const bw = 150, bxx = rx + rw - bw / 2 - 12;
        const prox = lv < 5 ? pe.niveis[lv] : 'Nível máximo';
        texto(g, (lv < 5 ? '▲ ' : '✔ ') + prox, rx + 16, y + 64, 15, lv < 5 ? '#d4daf5' : '#78ff96', 'left', true, 600);
        if (custo) {
          const pode = Dados.podePagar(custo.c, custo.d || 0), falta = Math.max(0, custo.c - Dados.prog.creditos);
          const rot = pode ? `¢${fmt(custo.c)}${custo.d ? ' 💎' + custo.d : ''}` : (falta > 0 ? `falta ¢${fmt(falta)}` : `falta 💎${custo.d - Dados.prog.cristais}`);
          botao(g, rot, bxx, y + 28, bw, 48, () => {
            if (Dados.melhorar(nave.id, pe.id)) { Som.tocar('compra'); this.efeitos.texto(bxx, y + 10, 'MELHORADO!', [120, 255, 160], 18); vibrar(30); }
          }, { tam: 18, desligado: !pode, cor: pode ? '#fff' : AMARELO, fundo: pode ? 'rgba(40,170,90,.55)' : undefined, borda: pode ? '#6dff9e' : undefined, aoDesligado: () => this.aviso('Jogue mais partidas para juntar moedas e cristais', [255, 160, 120]) });
        } else texto(g, 'MÁX', bxx, y + 36, 22, '#78ff96', 'center');
        if (k < 4) { g.fillStyle = 'rgba(120,150,255,.15)'; g.fillRect(rx + 14, y + 72, rw - 28, 1); }
      });
    } else {
      texto(g, '🔒 NAVE BLOQUEADA', rx + rw / 2, 150, 26, '#ff8a8a', 'center');
      const preco = `¢ ${fmt(nave.preco)}${nave.cristais ? '  +  💎 ' + nave.cristais : ''}`;
      texto(g, preco, rx + rw / 2, 204, 32, AMARELO, 'center');
      if (nave.condicao) texto(g, nave.condicao, rx + rw / 2, 236, 17, CINZA, 'center', true, 600);
      const pode = Dados.podePagar(nave.preco, nave.cristais || 0);
      botao(g, 'Comprar nave', rx + rw / 2, 296, 280, 64, () => {
        if (Dados.comprarNave(nave.id)) { Som.tocar('compra'); this.aviso(`${nave.nome.toUpperCase()} É SUA!`, nave.cor); vibrar([40, 40, 80]); }
      }, { tam: 24, desligado: !pode, cor: pode ? '#fff' : AMARELO, fundo: pode ? 'rgba(40,170,90,.55)' : undefined, borda: pode ? '#6dff9e' : undefined, aoDesligado: () => this.aviso('Moedas insuficientes — jogue mais partidas', [255, 160, 120]) });
      quebrar(g, 'Junte moedas destruindo inimigos e cristais derrotando peças de chefes.', rx + 24, 372, rw - 48, 16, CINZA);
    }
    botao(g, '← Menu', 90, H - 32, 150, 52, () => this.trocar('MENU'), { tam: 19 });
    botao(g, dono ? `🚀 JOGAR com ${nave.nome}` : 'Escolha uma nave sua', W / 2 + 70, H - 32, 360, 56, () => this.decolar(), { tam: 22, cor: AMARELO, desligado: !dono });
    this.efeitos.desenhar(g);
  }

  telaMapa(g) {
    texto(g, 'ESCOLHA A FASE', W / 2, 42, 32, '#fff', 'center');
    const d = Config.dificuldade, ids = ['facil', 'normal', 'dificil'];
    ids.forEach((id, i) => botao(g, DIFS[id].nome, W / 2 + (i - 1) * 170, 86, 160, 50, () => { Config.dificuldade = id; Config.salvar(); },
      { sel: d === id, tam: 21, cor: d === id ? AMARELO : '#fff' }));
    texto(g, DIFS[d].nota, W / 2, 128, 17, CINZA, 'center', true, 600);
    const cw = Math.min(150, (W - 40 - 4 * 12) / 5), x0 = W / 2 - (5 * cw + 4 * 12) / 2;
    for (let n = 1; n <= 10; n++) {
      const k = (n - 1) % 5, row = Math.floor((n - 1) / 5), x = x0 + k * (cw + 12), y = 172 + row * 150, h = 130;
      if (k === 0) texto(g, row === 0 ? 'SETOR 1' : 'SETOR 2 · mais difícil', x, y - 8, 16, AMARELO);
      const lib = Dados.liberada(n), est = Dados.estrelas(n), sel = this.noMapa === n && !usouToque;
      caixa(g, x, y, cw, h, 14, lib ? 'rgba(10,16,40,.9)' : 'rgba(20,20,30,.8)', sel ? AMARELO : est >= 3 ? '#ffd650' : lib ? 'rgba(120,150,255,.55)' : 'rgba(255,255,255,.12)', sel ? 4 : 2);
      texto(g, lib ? String(n) : '🔒', x + cw / 2, y + 50, 40, lib ? '#fff' : '#6a6e84', 'center', lib);
      texto(g, FASES[k].nome, x + cw / 2, y + 78, 15, lib ? CINZA : '#555a70', 'center', false, 600);
      for (let i = 0; i < 3; i++) texto(g, '★', x + cw / 2 + (i - 1) * 34, y + 114, 30, i < est ? AMARELO : '#3c3c50', 'center', false);
      botoes.push({ x, y, w: cw, h, acao: () => { this.noMapa = n; if (lib) { Som.tocar('menu'); this.iniciarDoMapa(n); } else { Som.tocar('erro'); this.aviso(`Complete a fase ${n - 1} para liberar`, [255, 160, 120]); } } });
    }
    texto(g, '★ concluir   ★★ cumprir o desafio   ★★★ sem perder vida', W / 2, 486, 16, CINZA, 'center', true, 600);
    botao(g, '← Hangar', 100, H - 28, 160, 48, () => this.trocar('HANGAR'), { tam: 19 });
  }

  telaConfig(g) {
    texto(g, 'CONFIGURAÇÕES', W / 2, 46, 30, '#fff', 'center');
    const w = Math.min(620, W - 40), x = W / 2 - w / 2;
    painel(g, x, 62, w, 412);
    const linha = (i, rotulo, valor, menos, mais) => {
      const y = 100 + i * 56;
      texto(g, rotulo, x + 24, y + 7, 18, '#fff', 'left', true, 700);
      if (menos) botao(g, '−', x + w - 214, y, 58, 46, menos, { tam: 28 });
      texto(g, valor, x + w - 124, y + 7, 17, AMARELO, 'center');
      if (mais) botao(g, '+', x + w - 42, y, 58, 46, mais, { tam: 28 });
      g.fillStyle = 'rgba(120,150,255,.12)'; g.fillRect(x + 16, y + 27, w - 32, 1);
    };
    const alternarControle = () => { Config.controle = Config.controle === 'joystick' ? 'deslizar' : 'joystick'; Config.salvar(); };
    linha(0, 'Controle no celular', Config.controle === 'joystick' ? 'Joystick' : 'Deslizar', alternarControle, alternarControle);
    linha(1, 'Sensibilidade do toque', Config.sens.toFixed(2).replace('.', ','), () => { Config.sens = Math.max(0.6, +(Config.sens - 0.15).toFixed(2)); Config.salvar(); }, () => { Config.sens = Math.min(2.4, +(Config.sens + 0.15).toFixed(2)); Config.salvar(); });
    linha(2, 'Volume da música', Math.round(Config.musica * 100) + '%', () => { Config.musica = Math.max(0, +(Config.musica - 0.1).toFixed(1)); Config.salvar(); Som.aplicarVolumes(); }, () => { Config.musica = Math.min(1, +(Config.musica + 0.1).toFixed(1)); Config.salvar(); Som.aplicarVolumes(); });
    linha(3, 'Volume dos efeitos', Math.round(Config.efeitos * 100) + '%', () => { Config.efeitos = Math.max(0, +(Config.efeitos - 0.1).toFixed(1)); Config.salvar(); Som.aplicarVolumes(); Som.tocar('moeda'); }, () => { Config.efeitos = Math.min(1, +(Config.efeitos + 0.1).toFixed(1)); Config.salvar(); Som.aplicarVolumes(); Som.tocar('moeda'); });
    const alternarVib = () => { Config.vibrar = !Config.vibrar; Config.salvar(); vibrar(40); };
    linha(4, 'Vibração', Config.vibrar ? 'Ligada' : 'Desligada', alternarVib, alternarVib);
    const alternarVis = () => { Config.visual = Config.visual === 'leve' ? 'completo' : 'leve'; Config.salvar(); };
    linha(5, 'Efeitos visuais', Config.visual === 'leve' ? 'Leve' : 'Completo', alternarVis, alternarVis);
    botao(g, '🎓 Rever tutorial na próxima partida', W / 2, 440, 420, 48, () => { Dados.prog.tutorial = false; Dados.salvar(); this.aviso('O tutorial vai aparecer na próxima partida', [120, 255, 160]); }, { tam: 17 });
    botao(g, '← Voltar', W / 2, H - 34, 200, 52, () => this.trocar('MENU'), { tam: 19 });
  }

  telaComoJogar(g) {
    texto(g, 'COMO JOGAR', W / 2, 42, 30, '#fff', 'center');
    const abas = ['Controles', 'Itens', 'Armas', 'Inimigos'], aba = this.abaAjuda || 0;
    abas.forEach((nome, i) => botao(g, nome, W / 2 + (i - 1.5) * 150, 76, 140, 36, () => { this.abaAjuda = i; }, { sel: i === aba, tam: 15 }));
    const w = Math.min(860, W - 40), x = W / 2 - w / 2, y = 100;
    painel(g, x, y, w, 380);
    if (aba === 0) {
      const c = usouToque
        ? [['Deslizar o dedo', 'mover (ou joystick, nas Configurações)'], ['Dedo na tela', 'atira sem parar'], ['Botão ★', 'poder especial quando a barra enche'], ['Botão 💣', 'bomba: limpa a tela'], ['Botão ❚❚', 'pausar']]
        : [['Setas / WASD', 'mover'], ['Espaço', 'atirar (segure)'], ['X', 'poder especial quando a barra enche'], ['C', 'bomba: limpa a tela'], ['P / Esc', 'pausar'], ['M', 'liga e desliga o som']];
      texto(g, 'CONTROLES', x + 24, y + 32, 15, AMARELO);
      c.forEach(([a, b], i) => { texto(g, a, x + 24, y + 62 + i * 26, 15, CIANO); texto(g, b, x + 200, y + 62 + i * 26, 15, '#fff', 'left', true, 600); });
      texto(g, 'REGRAS', x + 24, y + 238, 15, AMARELO);
      ['Cumpra a meta de abates e o chefe aparece. Destrua as peças dele para expor o núcleo.', 'Abates seguidos fazem COMBO e multiplicam os pontos (até x5).',
        'Levar dano tira 1 vida e 1 nível de arma.', 'Junte ¢ moedas e 💎 cristais para melhorar as peças das naves no Hangar.']
        .forEach((t, i) => texto(g, '• ' + t, x + 24, y + 266 + i * 24, 13, '#fff', 'left', true, 600));
    } else if (aba === 1) {
      texto(g, 'POWER-UPS (caem dos inimigos; ímã puxa quando você chega perto)', x + 24, y + 30, 14, AMARELO);
      const col = Math.ceil(POWERUPS.length / 2);
      POWERUPS.forEach((t, i) => {
        const cx = x + 40 + Math.floor(i / col) * (w / 2), cy = y + 66 + (i % col) * 50;
        desenharItem(g, t, cx, cy);
        texto(g, t.nome, cx + 28, cy - 2, 14, rgba(t.cor, 1)); texto(g, t.desc, cx + 28, cy + 14, 12, CINZA, 'left', true, 600);
      });
    } else if (aba === 2) {
      texto(g, 'TIPOS DE TIRO — item em losango', x + 24, y + 30, 14, AMARELO);
      texto(g, 'Pegar o mesmo tipo sobe o nível (até 5). Pegar outro tipo troca de arma e mantém o nível.', x + 24, y + 52, 13, '#fff', 'left', true, 600);
      ITENS_ARMA.forEach((t, i) => {
        const cy = y + 92 + i * 52, cx = x + 44;
        desenharItem(g, t, cx, cy);
        texto(g, ARMAS[t.arma].nome, cx + 30, cy - 2, 15, rgba(t.cor, 1)); texto(g, t.desc, cx + 30, cy + 15, 12, CINZA, 'left', true, 600);
      });
      texto(g, 'O item P (ARMA+) sobe o nível da arma que você está usando.', x + 24, y + 362, 12, CINZA, 'left', true, 600);
    } else {
      texto(g, 'INIMIGOS', x + 24, y + 30, 14, AMARELO);
      ['BASICO', 'ZIGUE', 'ATIRADOR', 'KAMIKAZE', 'TANQUE', 'MINA', 'ESCUDEIRO', 'TELEPORTE', 'ENXAME', 'TORRE', 'LASER', 'ASTEROIDE'].forEach((id, i) => {
        const cxx = x + 50 + (i % 3) * (w / 3), cy = y + 72 + Math.floor(i / 3) * 76;
        const im = imagemInimigo(T[id]), k = Math.min(1.2, 46 / Math.max(im.width, im.height));
        g.drawImage(im, cxx - im.width * k / 2, cy - im.height * k / 2, im.width * k, im.height * k);
        texto(g, T[id].nome, cxx + 36, cy + 5, 14, '#fff');
      });
    }
    botao(g, '← Voltar', W / 2, H - 28, 180, 42, () => this.trocar('MENU'), { tam: 16 });
  }
  tabelaRecordes(g, y, destaque, h = 372) {
    const w = Math.min(620, W - 40), x = W / 2 - w / 2;
    painel(g, x, y, w, h);
    [['#', 24], ['PILOTO', 70], ['NAVE', w * 0.5], ['FASE', w * 0.68]].forEach(([s, dx]) => texto(g, s, x + dx, y + 28, 15, CINZA));
    texto(g, 'PONTOS', x + w - 24, y + 28, 15, CINZA, 'right');
    if (!Dados.recordes.length) texto(g, 'Nenhum recorde ainda. Seja o primeiro!', W / 2, y + 110, 17, CINZA, 'center');
    const med = ['#ffcd3c', '#c8d2e1', '#d78c50'];
    Dados.recordes.forEach((r, i) => {
      if (y + 62 + i * 31 > y + h - 8) return;
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
    const v = this.faseRecorde === 'Venceu!', p = this.player, gf = this.ganhoFinal || { moedas: 0, bonus: 0, cristais: 0 };
    texto(g, v ? 'MISSÃO CUMPRIDA' : 'FIM DE JOGO', W / 2, 46, 36, v ? AMARELO : '#ff5050', 'center');
    const prec = Math.min(100, Math.round(this.acertos * 100 / Math.max(1, p.tirosDisparados)));
    const cards = [['PONTOS', fmt(this.pontos)], ['FASE', this.faseRecorde], ['ABATES', this.abatesTotal], ['PRECISÃO', prec + '%'], ['COMBO MÁX.', this.maiorCombo]];
    const cw = Math.min(150, (W - 40 - 40) / 5), tx = W / 2 - (5 * cw + 40) / 2;
    cards.forEach(([r, val], i) => {
      const x = tx + i * (cw + 10), sv = String(val);
      caixa(g, x, 66, cw, 76, 12, 'rgba(8,10,24,.84)', 'rgba(120,150,255,.3)');
      texto(g, r, x + cw / 2, 88, 15, CINZA, 'center');
      texto(g, sv, x + cw / 2, 126, largura(g, sv, 28) > cw - 12 ? 21 : 28, i === 0 ? AMARELO : '#fff', 'center');
    });
    texto(g, `Ganhou ¢ ${fmt(gf.moedas + gf.bonus)}${gf.cristais ? ' · 💎 ' + gf.cristais : ''}   ·   Total ¢ ${fmt(Dados.prog.creditos)} · 💎 ${Dados.prog.cristais}`, W / 2, 172, 20, AMARELO, 'center', true, 700);
    this.tabelaRecordes(g, 190, this.posRecorde, 176);
    if (this.timer > 40) {
      if (this.chegouChefe && !v) botao(g, '↺ Tentar o chefe de novo', W / 2, 400, 440, 58, () => this.iniciarDoMapa((this.ciclo - 1) * 5 + this.fase.n, true), { tam: 23, cor: '#fff', fundo: 'rgba(200,60,50,.55)', borda: '#ff8a7a' });
      botao(g, 'Menu', W / 2 - 250, H - 36, 150, 56, () => this.trocar('MENU'), { tam: 20 });
      botao(g, '🔧 Hangar', W / 2 - 60, H - 36, 190, 56, () => this.trocar('HANGAR'), { tam: 20, cor: AMARELO });
      botao(g, '↻ Jogar de novo', W / 2 + 190, H - 36, 240, 56, () => this.iniciarDoMapa(this.nodoInicio), { tam: 20 });
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
  W = Math.round(clamp(H * vw / vh, 820, 1200));
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
addEventListener('appinstalled', () => { pedidoInstalacao = null; if (jogo) jogo.aviso('APP INSTALADO! 🎉', [120, 255, 160]); });
const instalado = () => matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches || navigator.standalone === true;
function instalar() {
  if (pedidoInstalacao) { pedidoInstalacao.prompt(); pedidoInstalacao.userChoice.finally(() => { pedidoInstalacao = null; }); }
  else if (/iphone|ipad|ipod/i.test(navigator.userAgent)) document.getElementById('tela-ios').classList.add('ativo');
  else jogo.aviso('Use o menu do navegador → "Instalar app" ou "Adicionar à tela inicial"', [255, 214, 80]);
}
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  navigator.serviceWorker.register('sw.js').then(reg => {
    const avisar = sw => {
      document.getElementById('aviso-atualizacao').classList.add('ativo');
      document.getElementById('botao-atualizar').onclick = () => sw.postMessage('atualizar');
    };
    if (reg.waiting && navigator.serviceWorker.controller) avisar(reg.waiting);
    reg.addEventListener('updatefound', () => {
      const sw = reg.installing;
      sw.addEventListener('statechange', () => { if (sw.state === 'installed' && navigator.serviceWorker.controller) avisar(sw); });
    });
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

Config.carregar();
Dados.carregar();
redimensionar();
jogo = new Jogo();
window.__jogo = jogo;   // facilita testes pelo console
requestAnimationFrame(t => { ultimo = t; quadro(t); });
