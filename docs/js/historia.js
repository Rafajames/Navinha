/* História "Crônicas do Cerne Umbralis": elenco, cenas, cartas da Lirrin, diário de bordo, missões do dia e conquistas.
 * Só dados e regras (sem desenho). As telas ficam em jogo.js. O progresso fica em Dados.prog.hist. */

// l = linha do personagem em assets/retratos.png (4 colunas: 0 neutro, 1 feliz, 2 bravo, 3 triste)
const ELENCO = {
  dren: { n: 'Dren', l: 0, cor: '#ff8a50', lado: 0 }, lirrin: { n: 'Lirrin', l: 1, cor: '#ffd650', lado: 0 },
  seraphel: { n: 'Seraphel', l: 2, cor: '#6edcff', lado: 1 }, gorvan: { n: 'Gorvan', l: 3, cor: '#ffc040', lado: 1 },
  zephrael: { n: 'Zephrael "Vexx"', l: 4, cor: '#6a9bff', lado: 1 }, ioleth: { n: 'Dra. Ioleth', l: 5, cor: '#5ee8d0', lado: 1 },
  tzalenka: { n: 'Madre Tzalenka', l: 6, cor: '#7ae07a', lado: 1 }, ilvane: { n: 'Ilvane', l: 7, cor: '#b48cff', lado: 1 },
  caldrus: { n: 'Capitão Caldrus', l: 8, cor: '#e8e8f0', lado: 1 }, eskarion: { n: 'Almirante Eskarion', l: 9, cor: '#ff6a5a', lado: 1 },
  zarkoth: { n: 'Soberano Ul-Zarkoth', l: 10, cor: '#ff4a3a', lado: 1 }, meridiel: { n: 'Dra. Meridiel', l: 11, cor: '#ff8aa0', lado: 1 },
};

// Chave = número da fase + 'a' (antes) ou 'd' (depois do chefe). Falas: [personagem, expressão, texto]; 'narr' = narrador.
const CENAS = {
  '1a': [['narr', 0, 'Ano 9.214 da Era Lumínica. Faz quase cem anos que as estrelas morrem. Chamam isso de a Fome.'],
    ['seraphel', 0, 'Piloto Ysolvane, o Anel de Kessarin está infestado. Sua primeira missão: abrir caminho.'],
    ['dren', 1, 'Primeira missão e já é a mais importante da galáxia, comandante? Eu adoro pressão.'],
    ['gorvan', 2, 'Pressão boa é a do meu pneu! Traga a nave inteira, garoto. Da última vez voltou sem uma asa!']],
  '1d': [['dren', 1, 'Anel limpo! Viu, Gorvan? Nenhum arranhão... bom, um arranhãozinho.'],
    ['gorvan', 2, 'Arranhãozinho! Eu ouvi o barulho daqui!'],
    ['seraphel', 0, 'Bom trabalho. Mas o Anel era só a porta. O que apaga as estrelas está no centro de Ulthar.']],
  '2a': [['tzalenka', 1, 'Então você é o menino da Vigília! Pise leve: a Jazida treme desde que os cristais pararam de cantar.'],
    ['dren', 0, 'Os cristais cantam?'],
    ['tzalenka', 3, 'Cantavam. Eles sabem quando uma estrela vai se apagar. Agora só choram baixinho.']],
  '2d': [['tzalenka', 1, 'Ouviu isso? Um cristal voltou a cantar. Você tem jeito, menino.'],
    ['dren', 1, 'Acho que ele gostou de mim.'],
    ['tzalenka', 0, 'Todo mundo gosta de quem salva a casa dele. Leve esses cristais, são seus.']],
  '3a': [['ioleth', 1, 'Dren! Ainda bem. Esta nebulosa lê a luz da sua nave. Se você brilhar demais, o enxame te acha!'],
    ['dren', 0, 'Então eu... brilho menos?'],
    ['ioleth', 2, 'Você pilota menos espalhafatoso. Eu sei que é difícil.']],
  '3d': [['ioleth', 1, 'Dados incríveis! A Fome não é doença: tem padrão, como se alguém a comandasse.'],
    ['dren', 0, 'Alguém?'],
    ['ioleth', 3, 'Ou algo. Preciso de mais amostras... e de um café.']],
  '4a': [['zephrael', 2, 'Olha só, o garoto do cachecol. Cheguei aqui primeiro, Ysolvane. Tente não atrapalhar.'],
    ['dren', 2, 'Vexx! Você nem tem o escudo direito!'],
    ['zephrael', 1, 'Eu tenho estilo. É mais importante.']],
  '4d': [['zephrael', 3, '...Você me tirou daquela. Eu odeio dever favor.'],
    ['dren', 1, 'Então me paga com uma corrida depois.'],
    ['zephrael', 1, 'Fechado. E eu vou ganhar.']],
  '5a': [['seraphel', 0, 'Esse é o Cerne Umbralis. Uma máquina mais antiga que a Vigília.'],
    ['dren', 0, 'Parece que está... respirando.'],
    ['narr', 0, 'Do fundo do Cerne, vem um sussurro quase humano.']],
  '5d': [['lirrin', 3, 'Dren...? É você? Está escuro aqui.'],
    ['dren', 3, 'Lirrin?! É a minha irmã! Ela está lá dentro!'],
    ['seraphel', 0, 'Então isso deixou de ser só uma missão. Vamos mais fundo, piloto.']],
  '6a': [['narr', 0, 'Setor 2 · Ecos. Os mundos que você salvou voltaram... diferentes.'],
    ['ilvane', 0, 'Eu sou o piloto que sumiu. Não estou morto. Estou entre.'],
    ['dren', 0, 'Ilvane? Você é real?'],
    ['ilvane', 3, 'Metade. A outra metade está presa no eco.']],
  '6d': [['ilvane', 0, 'O Cerne guarda memórias. Cada eco mostra uma verdade.'],
    ['dren', 0, 'E qual verdade vimos aqui?'],
    ['ilvane', 3, 'Que alguém ainda manda nele. Alguém que já foi herói.']],
  '7a': [['tzalenka', 3, 'Estes cristais não choram mais. Eles gritam.'],
    ['dren', 2, 'Vamos calar o que está fazendo isso.'],
    ['tzalenka', 1, 'Essa é a atitude! Mas cuidado: o eco desta mina tem a minha voz.']],
  '7d': [['tzalenka', 0, 'A voz era minha mesmo, de quando perdi meu marido na mina.'],
    ['dren', 3, 'Madre...'],
    ['tzalenka', 1, 'Passou, menino. A mina me ensinou: o que a gente cava, enterra de novo e segue.']],
  '8a': [['ioleth', 0, 'Dren, este enxame lembra uma assinatura militar. Reconheço a ordem de ataque.'],
    ['dren', 0, 'Da Vigília?'],
    ['ioleth', 3, 'Do Almirante Eskarion Morvane, o mentor da comandante Seraphel.']],
  '8d': [['ioleth', 2, 'A família dele sumiu quando a colônia Oruvai escureceu. Ele quer o Cerne para trazê-las de volta.'],
    ['dren', 3, 'Oruvai... é lá que a minha irmã mora.'],
    ['ioleth', 3, 'Eu sei. Sinto muito.']],
  '9a': [['caldrus', 1, 'Piloto Ysolvane! Que prazer. Capitão Caldrus Venn-Ahrel, ao seu serviço.'],
    ['zephrael', 2, 'Esse bigode me dá calafrios, Dren.'],
    ['caldrus', 1, 'Ofendido... mas vou perdoar. Por ora.']],
  '9d': [['caldrus', 0, 'Pois bem. Eu avisei o Soberano de cada passo de vocês.'],
    ['dren', 2, 'Você é um traidor!'],
    ['caldrus', 3, 'Era. Hoje vi o que ele faz com o Cerne, e não consigo mais.']],
  '10a': [['zarkoth', 0, 'Cheguei à fonte de toda dor, Ysolvane. Por que insiste em me impedir?'],
    ['dren', 2, 'Porque o que você chama de salvar destrói todo mundo!'],
    ['zarkoth', 3, 'Eu perdi duas pessoas. E juro que as trago de volta.']],
  '10d': [['zarkoth', 3, 'Você venceu hoje, garoto. Mas o Cerne não é o fim.'],
    ['meridiel', 3, 'Dren, não é ele quem comanda a Fome. Tem algo mais antigo no fundo.'],
    ['narr', 0, 'O Cerne se abre. Setor 3 · Reacender: em breve.']],
};

const CARTAS = [
  'Oi, Dren! Hoje a luz da colônia piscou duas vezes. Eu contei. A tia diz que é normal, mas desenhei o piscar pra você.',
  'Dren, o gato da vizinha aprendeu a abrir a porta. Agora ele entra pra ouvir minhas histórias de você. É um ótimo ouvinte.',
  'Treinei o discurso de piloto pra quando eu crescer. Começa com "Atenção, tripulação". A tia riu tanto que derramou o chá.',
  'Fiz um mapa das estrelas que ainda acendem daqui. São 11. Ontem eram 12. Mas não fique triste: desenhei mais uma, de enfeite.',
  'O Gorvan mandou uma ferramenta pra mim pelo correio! É uma chave que faz clique. Já consertei a porta, o rádio e o meu sapato.',
  'Hoje choveu poeira de cristal. Guardei um pouquinho num pote pra você. Brilha no escuro. Eu também brilho quando penso em você.',
  'Dren, sonhei que você voava com um cachecol de cometa. Quando acordei tinha uma faixa vermelha no céu. Foi você, né?',
  'A professora perguntou o que eu quero ser. Eu disse: irmã do Dren. Ela disse que não é profissão. Eu disse que é a melhor.',
  'Perdi o dente da frente de vez! Agora assobio quando falo "s". Sssssou uma piloto de assobio. Ssssaudade.',
  'Aprendi a fazer sopa de nuvem (é sopa quente que a gente finge ser nuvem). Reservei uma tigela. Volta logo pra tomar.',
  'A lanterna que você me deu ainda funciona! Quando falta luz, faço sombra de dragão na parede. O dragão se chama Dren Jr.',
  'Um menino da escola disse que você não existe. Mostrei sua foto. Ele pediu desculpas e um autógrafo. Cobrei dois doces.',
  'Dren, à noite a colônia fica quieta demais. Eu falo com as estrelas baixinho, caso alguma ainda ouça. Se ouvir, manda lembranças.',
  'Faltam seis meses pra eu fazer 13. Já pedi o desejo: que você volte. O resto eu resolvo sozinha. Beijo, Lirrin.',
];

// 3 páginas por fase (uma por estrela ganhada no total)
const DIARIO = [
  'Dia 1. Saí do hangar com a nave cheirando a graxa nova. Gorvan jura que não esqueceu nenhuma chave dentro do motor.',
  'Cumpri o desafio do Anel. A Seraphel assentiu com a cabeça. Pelo que sei, isso equivale a um abraço.',
  'Voltei sem um arranhão. Gorvan fingiu não ficar aliviado e mandou polir a nave "por precaução".',
  'Mornhek: os cristais cantam! Gravei o som para a Lirrin. Ela vai dizer que é a música mais bonita do universo.',
  'A Madre Tzalenka me deu um capacete de mina. Não serve, mas eu uso mesmo assim.',
  'Zero dano na Jazida. A Madre disse que eu dou sorte. Eu disse que dou treino.',
  'A Dra. Ioleth fala tão rápido que perco três palavras por minuto. Entendi: pilotar com menos brilho.',
  'Desafio feito na Ruvanti. Anotei: a nebulosa cheira a chuva, mesmo no vácuo (não pergunte).',
  'Nebulosa limpa e nave intacta. Ioleth quer me estudar. Eu quero almoçar.',
  'Vexx apareceu no Limiar de Nox só para me provocar. Detesto admitir: voa muito bem.',
  'Cumpri o desafio antes dele. Vou lembrar disso toda vez que ele disser "eu cheguei primeiro".',
  'Sem dano no Limiar, e ainda salvei o Vexx. Ele disse "obrigado" tão baixo que quase não ouvi.',
  'O Cerne Umbralis respira. Não é figura de linguagem: vi o casco subir e descer.',
  'Passei pelo desafio do Cerne. Ouvi uma voz. Juro que era a da Lirrin.',
  'Sem dano no Cerne. Seraphel diz que preciso dormir. Eu digo que durmo depois de trazer minha irmã.',
  'O Anel de Kessarin voltou partido, como um espelho quebrado. E tem um piloto nele: Ilvane. Existe mesmo.',
  'Desafio do eco cumprido. Ilvane atravessou minha mão com a dele. Fria, mas gentil.',
  'Sem dano no Anel Partido. Ilvane sorriu pela primeira vez, acho. Foi rápido.',
  'A Jazida Eterna grita. A Tzalenka tampou os ouvidos e foi na frente mesmo assim.',
  'Cumpri o desafio. A Madre me contou do marido dela. Fiquei calado, e acho que foi a melhor resposta.',
  'Sem dano e sem lágrimas. Quase.',
  'Ruvanti Invertida: tudo ao contrário, até o enxame. A Ioleth reconheceu a assinatura do Almirante Eskarion.',
  'Desafio feito. Descobri que o vilão já foi herói e mentor da Seraphel. Ela não quis falar disso.',
  'Sem dano. Ioleth me deu um chá turquesa de agradecimento. Tem gosto de ciência.',
  'Limiar Ardente. Conheci o Capitão Caldrus: bigode impecável, sorriso suspeito demais.',
  'Cumpri o desafio sob o fogo do Limiar. Vexx disse que o bigode do Caldrus é prova de crime.',
  'Sem dano. Caldrus hesitou antes de me atacar. Eu vi. Anotado para depois.',
  'Cheguei ao Coração do Cerne. O Soberano Ul-Zarkoth tem um relógio de bolso que não para de tiquetaquear.',
  'Cumpri o desafio no Coração. Percebi que ele aperta o relógio sempre que fala da filha.',
  'Sem dano no Coração do Cerne. Vitória de hoje, mas a Fome ainda tem um dono mais antigo. O Setor 3 me espera.',
];
const FASES_DIARIO = ['Anel de Kessarin', 'Jazida de Mornhek', 'Nebulosa Ruvanti', 'Limiar de Nox', 'O Cerne Umbralis',
  'Anel Partido', 'Jazida Eterna', 'Ruvanti Invertida', 'Limiar Ardente', 'Coração do Cerne'];

// missões do dia: chave = evento contado; max = guarda o maior valor em vez de somar
const MISSOES = [
  { id: 'abates80', texto: 'Destrua 80 inimigos', chave: 'abates', meta: 80, c: 150 },
  { id: 'abates150', texto: 'Destrua 150 inimigos', chave: 'abates', meta: 150, c: 250 },
  { id: 'moedas80', texto: 'Colete 80 moedas', chave: 'moedas', meta: 80, c: 120 },
  { id: 'especial3', texto: 'Use o especial 3 vezes', chave: 'especial', meta: 3, c: 150 },
  { id: 'bomba2', texto: 'Solte 2 bombas', chave: 'bomba', meta: 2, c: 120 },
  { id: 'chefe1', texto: 'Derrote 1 chefe', chave: 'chefes', meta: 1, c: 300 },
  { id: 'fase2', texto: 'Conclua 2 fases', chave: 'fases', meta: 2, c: 250 },
  { id: 'combo20', texto: 'Chegue a um combo de 20', chave: 'combo', meta: 20, max: true, c: 200 },
  { id: 'itens5', texto: 'Colete 5 itens de ajuda', chave: 'itens', meta: 5, c: 150 },
  { id: 'semdano', texto: 'Conclua uma fase sem perder vida', chave: 'semdano', meta: 1, c: 0, d: 1 },
];

const CONQUISTAS = [
  { id: 'chefe1', nome: 'Primeiro chefe', texto: 'Derrote 1 chefe', meta: 1, val: h => h.stat.chefes, d: 1 },
  { id: 'chefe10', nome: 'Caçador de chefes', texto: 'Derrote 10 chefes', meta: 10, val: h => h.stat.chefes, d: 2 },
  { id: 'abates500', nome: 'Faxina espacial', texto: 'Destrua 500 inimigos', meta: 500, val: h => h.stat.abates, c: 500 },
  { id: 'est10', nome: 'Dez estrelas', texto: 'Ganhe 10 estrelas no mapa', meta: 10, val: () => Hist.estrelas(), d: 1 },
  { id: 'est20', nome: 'Vinte estrelas', texto: 'Ganhe 20 estrelas no mapa', meta: 20, val: () => Hist.estrelas(), d: 2 },
  { id: 'est30', nome: 'Constelação completa', texto: 'Ganhe as 30 estrelas', meta: 30, val: () => Hist.estrelas(), d: 5 },
  { id: 'fases10', nome: 'Veterano', texto: 'Conclua 10 fases', meta: 10, val: h => h.stat.fases, c: 400 },
  { id: 'moedas2000', nome: 'Cofrinho cheio', texto: 'Colete 2000 moedas', meta: 2000, val: h => h.stat.moedas, d: 1 },
];

const Hist = {
  CUSTO_CONTINUAR: 3,
  h() { return Dados.prog.hist; },
  // ---- cenas
  cena(nodo, t) { return CENAS[nodo + t] || null; },
  vista(nodo, t) { return !!this.h().cenas[nodo + t]; },
  marcar(nodo, t) { if (!this.h().cenas[nodo + t]) { this.h().cenas[nodo + t] = 1; Dados.salvar(); } },
  estrelas() { let s = 0; for (let n = 1; n <= 10; n++) s += Dados.estrelas(n); return s; },
  // ---- carta diária da Lirrin
  cartaNova() { return this.h().cartaDia !== hojeLocal(); },
  abrirCarta() {
    const h = this.h(), hoje = hojeLocal();
    if (h.cartaDia !== hoje) { h.cartaDia = hoje; h.cartaN++; Dados.salvar(); }
    return { n: h.cartaN, texto: CARTAS[(Math.max(1, h.cartaN) - 1) % CARTAS.length] };
  },
  // ---- missões do dia (3 por dia, sorteadas pela data)
  missoes() {
    const h = this.h(), hoje = hojeLocal();
    if (h.missaoDia !== hoje || h.missoes.length !== 3) {
      let s = 7; for (const ch of hoje) s = (s * 31 + ch.charCodeAt(0)) >>> 0;
      const pool = MISSOES.slice(), esc = [];
      while (esc.length < 3) { s = (Math.imul(s, 1103515245) + 12345) >>> 0; esc.push(pool.splice(Math.floor(s / 65536) % pool.length, 1)[0]); }
      h.missaoDia = hoje; h.missoes = esc.map(m => ({ id: m.id, prog: 0, pego: false }));
      Dados.salvar();
    }
    return h.missoes.map(m => Object.assign({}, MISSOES.find(x => x.id === m.id), m));
  },
  /** Conta um acontecimento do jogo. Devolve os textos das missões que acabaram de ser cumpridas. */
  evento(chave, n = 1, max = false) {
    const h = this.h(), feitas = [];
    this.missoes();
    if (chave in h.stat) h.stat[chave] += n;
    for (const m of h.missoes) {
      const d = MISSOES.find(x => x.id === m.id);
      if (!d || d.chave !== chave || m.pego || m.prog >= d.meta) continue;
      m.prog = Math.min(d.meta, max ? Math.max(m.prog, n) : m.prog + n);
      if (m.prog >= d.meta) feitas.push(d.texto);
    }
    return feitas;
  },
  pegarMissao(i) {
    const m = this.missoes()[i];
    if (!m || m.pego || m.prog < m.meta) return null;
    this.h().missoes[i].pego = true;
    Dados.ganhar(m.c || 0, m.d || 0);
    return { c: m.c || 0, d: m.d || 0 };
  },
  // ---- conquistas
  conquistas() { const h = this.h(); return CONQUISTAS.map(c => Object.assign({}, c, { atual: Math.min(c.meta, c.val(h)), pego: !!h.conq[c.id] })); },
  pegarConquista(id) {
    const c = this.conquistas().find(x => x.id === id);
    if (!c || c.pego || c.atual < c.meta) return null;
    this.h().conq[id] = true; Dados.ganhar(c.c || 0, c.d || 0);
    return { c: c.c || 0, d: c.d || 0 };
  },
  /** Quantas coisas esperam o jogador (carta nova, prêmios para pegar): vira a bolinha de aviso no menu. */
  pendentes() {
    return (this.cartaNova() ? 1 : 0) + this.missoes().filter(m => !m.pego && m.prog >= m.meta).length + this.conquistas().filter(c => !c.pego && c.atual >= c.meta).length;
  },
};
