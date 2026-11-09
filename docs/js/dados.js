/* Navinha Espacial — naves, peças, economia, configurações e dados salvos no aparelho. */
'use strict';

const armaz = {
  ler(k) { try { return localStorage.getItem(k); } catch (_) { return null; } },
  gravar(k, v) { try { localStorage.setItem(k, v); } catch (_) {} },
};

// ============================================================ naves
// preco em créditos (¢) e cristais (💎). condicao = jeito alternativo de liberar jogando.
const NAVES = [
  { id: 'FALCAO', nome: 'Falcão', desc: 'Equilibrada e confiável.', especial: 'Enxame de Mísseis', descEsp: '12 mísseis teleguiados.',
    vel: 4.6, vidas: 3, cadencia: 10, dano: 1, tam: 46, cor: [255, 120, 80], preco: 0 },
  { id: 'COMETA', nome: 'Cometa', desc: 'Rápida, mas frágil.', especial: 'Turbo', descEsp: '4s invencível, veloz e atirando sem parar.',
    vel: 6.3, vidas: 2, cadencia: 7, dano: 0.8, tam: 40, cor: [90, 170, 255], preco: 0 },
  { id: 'VESPA', nome: 'Vespa', desc: 'Lança drones que atiram junto.', especial: 'Colmeia', descEsp: '4 drones extras por 8s.',
    vel: 5.2, vidas: 3, cadencia: 9, dano: 0.9, tam: 44, cor: [242, 194, 48], preco: 3500 },
  { id: 'TITA', nome: 'Titã', desc: 'Lenta, blindada e de tiro pesado.', especial: 'Escudo de Plasma', descEsp: '5s de escudo que destrói tiros e inimigos.',
    vel: 3.3, vidas: 5, cadencia: 15, dano: 2, tam: 54, cor: [120, 220, 120], preco: 6000, condicao: 'ou derrote o chefe da Fase 2' },
  { id: 'MARTELO', nome: 'Martelo', desc: 'Tiros enormes e lentos.', especial: 'Megacanhão', descEsp: '6 obuses que explodem em área.',
    vel: 3.8, vidas: 4, cadencia: 18, dano: 2.6, tam: 50, cor: [255, 150, 60], preco: 7500, tiroGrande: true },
  { id: 'FANTASMA', nome: 'Fantasma', desc: 'Tiros perfurantes atravessam inimigos.', especial: 'Raio Fantasma', descEsp: 'Laser contínuo por 3s.',
    vel: 5, vidas: 3, cadencia: 11, dano: 1, tam: 46, cor: [210, 120, 255], perfurante: true, preco: 9000, condicao: 'ou complete 3 desafios de fase' },
  { id: 'AURORA', nome: 'Aurora', desc: 'O escudo se recarrega sozinho.', especial: 'Pulso Restaurador', descEsp: 'Limpa tiros por perto, recarrega o escudo e dá 3s invencível.',
    vel: 4.8, vidas: 3, cadencia: 10, dano: 1, tam: 46, cor: [80, 230, 200], preco: 11000, cristais: 4 },
  { id: 'RELAMPAGO', nome: 'Relâmpago', desc: 'Cada tiro dá choque num inimigo próximo.', especial: 'Tempestade', descEsp: 'Raios em até 5 alvos por 3s.',
    vel: 5.8, vidas: 2, cadencia: 12, dano: 1.1, tam: 44, cor: [110, 230, 255], preco: 15000, cristais: 10, encadeia: true },
];
const naveDe = id => NAVES.find(n => n.id === id);

// ============================================================ peças
const PECAS = [
  { id: 'canhao', nome: 'Canhão', niveis: ['Padrão', '+15% dano e canhão na asa', '+30% dano, tiro maior', '+45% dano, cano duplo', '+60% dano, cano pesado'] },
  { id: 'motor', nome: 'Motor', niveis: ['Padrão', '+7% velocidade', '+14% velocidade', '+21% velocidade', '+28% velocidade'] },
  { id: 'blindagem', nome: 'Blindagem', niveis: ['Padrão', 'Começa com escudo', '+1 vida', 'Escudo se recarrega a cada 30s', '+2 vidas'] },
  { id: 'nucleo', nome: 'Núcleo', niveis: ['Padrão', 'Especial enche 15% mais rápido', '+30% e especial dura +20%', '+45% e especial dura +30%', '+60% e especial dura +40%'] },
  { id: 'modulo', nome: 'Módulo', niveis: ['Nenhum', 'Ímã: puxa itens de mais longe', 'Drone ajudante', '+1 bomba no início', '2 drones ajudantes'] },
];
// custo para SUBIR para o nível indicado (índice = nível de destino)
const CUSTO_NIVEL = [null, null, { c: 250 }, { c: 600 }, { c: 1300, d: 2 }, { c: 2800, d: 5 }];

/** Atributos finais da nave com as peças instaladas. */
function atributos(nave, pc) {
  const b = pc.blindagem, n = pc.nucleo, m = pc.modulo;
  return {
    vel: nave.vel * (1 + 0.07 * (pc.motor - 1)),
    dano: nave.dano * (1 + 0.15 * (pc.canhao - 1)),
    tamTiro: (nave.tiroGrande ? 1.7 : 1) * (1 + 0.12 * (pc.canhao - 1)),
    cadencia: nave.cadencia,
    vidas: nave.vidas + (b >= 3 ? 1 : 0) + (b >= 5 ? 1 : 0),
    escudoInicial: b >= 2 || nave.id === 'TITA',
    regenEscudo: nave.id === 'AURORA' ? 1500 : b >= 4 ? 1800 : 0,
    ganhoEnergia: 1 + 0.15 * (n - 1),
    duracaoEsp: 1 + [0, 0, 0.2, 0.3, 0.4][n - 1],
    ima: m >= 2 ? 230 : 130,
    drones: m >= 5 ? 2 : m >= 3 ? 1 : 0,
    bombas: 2 + (m >= 4 ? 1 : 0),
  };
}

// ============================================================ configurações
const Config = {
  controle: 'deslizar', sens: 1.35, musica: 0.6, efeitos: 0.8, vibrar: true, visual: 'completo', dificuldade: 'normal',
  carregar() { try { Object.assign(this, JSON.parse(armaz.ler('navinha.config')) || {}); } catch (_) {} },
  salvar() { const { controle, sens, musica, efeitos, vibrar, visual, dificuldade } = this; armaz.gravar('navinha.config', JSON.stringify({ controle, sens, musica, efeitos, vibrar, visual, dificuldade })); },
};

// ============================================================ progresso e recordes
const Dados = {
  recordes: [], prog: {},
  carregar() {
    try { this.recordes = JSON.parse(armaz.ler('navinha.recordes')) || []; } catch (_) { this.recordes = []; }
    try { this.prog = JSON.parse(armaz.ler('navinha.progresso')) || {}; } catch (_) { this.prog = {}; }
    const p = this.prog;
    p.creditos = p.creditos || 0; p.cristais = p.cristais || 0; p.desafios = p.desafios || 0;
    p.naves = p.naves || {}; p.mapa = p.mapa || {};
    for (const n of NAVES) {
      p.naves[n.id] = p.naves[n.id] || { dono: n.preco === 0, pecas: { canhao: 1, motor: 1, blindagem: 1, nucleo: 1, modulo: 1 } };
    }
    if (p.tita) p.naves.TITA.dono = true;                         // progresso da versão 2.0
    if (p.desafios >= 3) p.naves.FANTASMA.dono = true;
    p.naveAtual = p.naveAtual || 'FALCAO';
    // recompensa diária (versão 3.4): último dia coletado (AAAA-MM-DD) e dia do ciclo (1 a 7; 0 = nenhum)
    if (!p.diaria || typeof p.diaria !== 'object') p.diaria = {};
    if (!/^\d{4}-\d{2}-\d{2}$/.test(p.diaria.ultimoDia || '')) p.diaria.ultimoDia = '';
    p.diaria.sequencia = Number.isInteger(p.diaria.sequencia) && p.diaria.sequencia >= 0 && p.diaria.sequencia <= 7 ? p.diaria.sequencia : 0;
    this.salvar();
  },
  salvar() {
    armaz.gravar('navinha.recordes', JSON.stringify(this.recordes));
    this.reconciliarDiaria();
    armaz.gravar('navinha.progresso', JSON.stringify(this.prog));
  },
  /** Outra aba pode ter pego a recompensa diária depois que esta carregou: fica a mais recente gravada (ultimoDia e sequência juntos). */
  reconciliarDiaria() {
    let salvo;
    try { salvo = (JSON.parse(armaz.ler('navinha.progresso')) || {}).diaria; } catch (_) { return; }
    if (!salvo || typeof salvo !== 'object' || !/^\d{4}-\d{2}-\d{2}$/.test(salvo.ultimoDia || '')) return;
    if (!this.prog.diaria || salvo.ultimoDia > (this.prog.diaria.ultimoDia || '')) {
      this.prog.diaria = { ultimoDia: salvo.ultimoDia, sequencia: Number.isInteger(salvo.sequencia) && salvo.sequencia >= 0 && salvo.sequencia <= 7 ? salvo.sequencia : 0 };
    }
  },
  estado(id) { return this.prog.naves[id]; },
  dono(id) { return this.prog.naves[id].dono; },
  pecas(id) { return this.prog.naves[id].pecas; },
  podePagar(c, d = 0) { return this.prog.creditos >= c && this.prog.cristais >= d; },
  pagar(c, d = 0) { if (!this.podePagar(c, d)) return false; this.prog.creditos -= c; this.prog.cristais -= d; this.salvar(); return true; },
  comprarNave(id) { const n = naveDe(id); if (this.dono(id) || !this.pagar(n.preco, n.cristais || 0)) return false; this.prog.naves[id].dono = true; this.salvar(); return true; },
  custoMelhoria(id, peca) { const lv = this.pecas(id)[peca]; return lv >= 5 ? null : CUSTO_NIVEL[lv + 1]; },
  melhorar(id, peca) {
    const c = this.custoMelhoria(id, peca);
    if (!c || !this.pagar(c.c, c.d || 0)) return false;
    this.prog.naves[id].pecas[peca]++; this.salvar(); return true;
  },
  ganhar(c, d) { this.prog.creditos += c; this.prog.cristais += d; this.salvar(); },
  liberar(id) { if (this.dono(id)) return false; this.prog.naves[id].dono = true; this.salvar(); return true; },
  estrelas(n) { return this.prog.mapa[n] || 0; },
  liberada(n) { return n === 1 || this.estrelas(n - 1) >= 1; },
  registrarEstrelas(n, e) { const novo = e > this.estrelas(n); if (novo) { this.prog.mapa[n] = e; this.salvar(); } return novo; },
  somarDesafio() { this.prog.desafios++; this.salvar(); },
  entraNoRanking(p) { return p > 0 && (this.recordes.length < 10 || p > this.recordes[this.recordes.length - 1].pontos); },
  adicionar(nome, pontos, fase, nave) {
    const r = { nome, pontos, fase, nave, id: Date.now() };
    this.recordes.push(r); this.recordes.sort((a, b) => b.pontos - a.pontos); this.recordes = this.recordes.slice(0, 10);
    this.prog.nome = nome; this.salvar(); return this.recordes.indexOf(r);
  },
};

// ============================================================ recompensa diária
/** Data local do aparelho em AAAA-MM-DD. */
function hojeLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
/** Dias de calendário de a até b (b - a); negativo se o relógio voltou. Usa UTC para não sofrer com horário de verão. */
function diasEntre(a, b) {
  const ms = s => { const [y, m, d] = s.split('-').map(Number); return Date.UTC(y, m - 1, d); };
  return Math.round((ms(b) - ms(a)) / 86400000);
}
const DIARIA = {
  PREMIOS: [100, 150, 200, 250, 300, 400, 500],          // ¢ do dia 1 ao 7; o dia 7 também dá 1 cristal
  /** 'pegar' (prêmio de hoje disponível), 'pegou' (já pegou hoje) ou 'relogio' (data voltou no tempo). dia = dia do ciclo. */
  situacao(hoje = hojeLocal()) {
    const { ultimoDia, sequencia } = Dados.prog.diaria;
    if (!ultimoDia) return { status: 'pegar', dia: 1 };
    const d = diasEntre(ultimoDia, hoje);
    if (d === 0) return { status: 'pegou', dia: sequencia || 1 };
    if (d < 0) return { status: 'relogio', dia: sequencia || 1 };
    // dia seguinte ao último: continua a sequência (dia 7 vira dia 1); pulou um dia ou mais: volta ao dia 1
    return { status: 'pegar', dia: d === 1 && sequencia >= 1 ? (sequencia % 7) + 1 : 1 };
  },
  /** Entrega o prêmio de hoje, uma vez por dia. Retorna o que foi dado ou null. */
  pegar() {
    const s = this.situacao();
    if (s.status !== 'pegar') return null;
    const creditos = this.PREMIOS[s.dia - 1], cristais = s.dia === 7 ? 1 : 0;
    Dados.prog.diaria = { ultimoDia: hojeLocal(), sequencia: s.dia };
    Dados.ganhar(creditos, cristais);
    return { dia: s.dia, creditos, cristais };
  },
};

// dificuldade: multiplicadores de velocidade/frequência/vida dos inimigos e chefes, prêmio em moedas e vidas extras
const DIFS = {
  facil: { nome: 'Fácil', vel: 0.85, intervalo: 1.25, vida: 0.75, premio: 0.75, vidas: 1, nota: '+1 vida · inimigos mais fracos · moedas ×0,75' },
  normal: { nome: 'Normal', vel: 1, intervalo: 1, vida: 1, premio: 1, vidas: 0, nota: 'a experiência padrão' },
  dificil: { nome: 'Difícil', vel: 1.15, intervalo: 0.8, vida: 1.4, premio: 1.5, vidas: 0, nota: 'mais inimigos e chefes mais fortes · moedas ×1,5' },
};
const dm = () => DIFS[Config.dificuldade] || DIFS.normal;
