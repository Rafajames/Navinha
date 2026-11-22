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
  syrelith: { n: 'Syrelith', l: 12, cor: '#ff3a6a', lado: 1 }, fome: { n: 'Ulthar-Vey', l: -1, cor: '#c08cff', lado: 1 },
};

// Chave = número da fase + 'a' (antes) ou 'd' (depois do chefe). Falas: [personagem, expressão, texto, escolha?]; 'narr' = narrador.
// escolha: 'D' (só se destruiu o Cerne) ou 'L' (só se libertou a memória de Eskarion).
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
    ['meridiel', 3, 'Dren, não é ele quem comanda a Fome. Tem algo mais antigo no fundo: Ulthar-Vey.'],
    ['meridiel', 0, 'O Cerne guarda a memória da família dele. Destrua o Cerne e a Fome perde a âncora... mas tudo lá dentro se perde.'],
    ['seraphel', 3, 'Ou liberte a memória de Eskarion. Ele volta a ser quem era, mas o Cerne fica aberto. A decisão é sua, piloto.']],
  '11a': [['narr', 0, 'Setor 3 · Reacender. A colônia Oruvai está ficando escura.'],
    ['lirrin', 1, 'DREN! Você veio mesmo! Eu sabia! Eu disse pro gato que você vinha!'],
    ['dren', 3, 'Lirrin... a voz no Cerne era só um eco. Você está aqui. Você está bem.'],
    ['lirrin', 2, 'Bem nada, a estrela da colônia está apagando! Vai lá e dá um jeito, piloto!']],
  '11d': [['lirrin', 1, 'A luz voltou! Toma, leva a minha lanterna. Ela nunca apagou, nem quando tudo apagou.'],
    ['dren', 1, 'Vou trazer de volta. Prometo.'],
    ['eskarion', 3, 'Oruvai... eu morava na terceira rua. A casa ainda está lá?', 'L'],
    ['seraphel', 3, 'A colônia que o Almirante perdeu. Ele daria tudo para ver isto.', 'D']],
  '12a': [['gorvan', 1, 'Estaleiros de Pharsis! Foi aqui que eu aprendi a apertar parafuso. E a perder dedo.'],
    ['ioleth', 1, 'Com as peças daqui montamos a Lança Reacender. Ela abre o Véu onde a Fome se esconde.'],
    ['caldrus', 0, 'Eu conheço as rotas de guarda. Deixem que eu pague a minha dívida.']],
  '12d': [['gorvan', 1, 'A Lança está pronta! Feia como eu, mas funciona como eu também!'],
    ['zephrael', 1, 'Eu pilotei a escolta e não bati em nada. Anotem isso no diário de vocês.'],
    ['caldrus', 3, 'Obrigado por me deixarem lutar ao lado de vocês. Eu não merecia.']],
  '13a': [['ilvane', 0, 'O Mar de Cinzas de Ghelm. Minha casa. Aqui eu sumi pela primeira vez.'],
    ['syrelith', 2, 'Vocês voltaram ao meu reino. Eu sou o que restou do Cerne em mim.'],
    ['meridiel', 3, 'Syrelith ainda me prende, Dren. Se você vencer, talvez eu consiga sair.']],
  '13d': [['syrelith', 3, 'Por que... eu sinto frio agora? Eu nunca senti nada.'],
    ['meridiel', 1, 'Porque eu voltei. Obrigada, Dren. Sou só eu de novo: Meridiel Sarn.'],
    ['ilvane', 1, 'E eu senti a minha mão inteira, pela primeira vez em anos.']],
  '14a': [['seraphel', 0, 'O Véu Fendido. Do outro lado está Ulthar-Vey, a Fome.'],
    ['eskarion', 0, 'Eu lutei ao lado da Fome por anos. Agora vou lutar contra ela. Ao seu lado, Seraphel.', 'L'],
    ['seraphel', 1, 'Bem-vindo de volta, Almirante.', 'L'],
    ['seraphel', 3, 'O Almirante se foi junto com o Cerne. Eu fico com o relógio dele. Vamos terminar isso por ele.', 'D'],
    ['dren', 2, 'Último guardião. Depois dele, mais ninguém apaga estrela nenhuma.']],
  '14d': [['narr', 0, 'O Véu se rasga. Do outro lado não há estrelas: só uma fome do tamanho do céu.'],
    ['fome', 0, 'PEQUENA LUZ. EU COMI SÓIS MAIS ANTIGOS QUE O SEU NOME.'],
    ['dren', 1, 'Então você nunca comeu nada que viesse com a lanterna da minha irmã.']],
  '15a': [['fome', 0, 'VENHA. TODA LUZ TERMINA EM MIM.'],
    ['tzalenka', 1, 'Os cristais de Mornhek estão cantando todos juntos, menino! Para você!'],
    ['zephrael', 1, 'Vai lá, Dren. Eu fico com o segundo lugar... só desta vez.'],
    ['dren', 2, 'Vigília de Asterra, comigo! Vamos reacender o céu!']],
  '15d': [['fome', 0, 'ISSO... É... CALOR?'],
    ['narr', 0, 'Ulthar-Vey se desfaz como cinza no vento. Uma a uma, as estrelas voltam a piscar.']],
  'fimD': [['narr', 0, 'FINAL DA CHAMA'],
    ['seraphel', 3, 'O Cerne se foi, e com ele as memórias do Almirante. Mas o céu está aceso.'],
    ['lirrin', 1, 'Dren, contei as estrelas: são 4.000 e lá vai bolinha. Desisti de contar!'],
    ['dren', 1, 'Então vamos contar juntos. Uma por noite.'],
    ['narr', 0, 'Ganhe todas as estrelas do mapa para ver o final secreto.']],
  'fimL': [['narr', 0, 'FINAL DA MEMÓRIA'],
    ['eskarion', 3, 'Eu prendo o que restou da Fome dentro de mim. É o meu jeito de voltar para casa.'],
    ['eskarion', 1, 'Diga à pequena Lirrin que a terceira rua de Oruvai tem a melhor vista do céu.'],
    ['seraphel', 3, 'Descanse, Almirante. A Vigília vigia por você agora.'],
    ['narr', 0, 'Ganhe todas as estrelas do mapa para ver o final secreto.']],
  'fimS': [['narr', 0, 'FINAL SECRETO · REACENDER'],
    ['lirrin', 1, 'A lanterna! Ela está brilhando sozinha, mais forte que tudo!'],
    ['ioleth', 1, 'Ela guardou a luz de Oruvai por cem anos. É a fagulha que faltava para fechar a Fome de vez!'],
    ['eskarion', 1, 'E sem ninguém precisar ficar para trás. Nem eu.'],
    ['gorvan', 1, 'Festa no Hangar! Quem quebrar alguma coisa, conserta!'],
    ['dren', 1, 'Fim da jornada? Que nada. É só o primeiro céu aceso.']],
  // gancho para a continuação: aparece depois de qualquer final
  'gancho': [['narr', 0, 'Semanas depois. Cidadela Irrynth, madrugada.'],
    ['ilvane', 3, 'Dren, acorda. Eu ainda ouço o eco... e não é a voz de Ulthar-Vey.'],
    ['ioleth', 0, 'Os sensores captaram um sinal vindo de além do Véu. Mesma assinatura do Cerne. Só que mil vezes maior.'],
    ['ilvane', 3, 'A Fome não veio atrás das estrelas. Ela estava fugindo de alguma coisa.'],
    ['dren', 2, 'Então a gente vai lá descobrir do quê.'],
    ['narr', 0, 'Crônicas do Cerne Umbralis · continua...']],
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
  'Oruvai. Abracei a Lirrin tão forte que a mochila dela fez barulho de adesivo descolando.',
  'Desafio na colônia cumprido. A Lirrin cronometrou e disse que eu fui "bem mais ou menos rápido".',
  'Sem dano em Oruvai. Ela me deu a lanterna. Prometi devolver acesa.',
  'Pharsis cheira a solda e a saudade. O Gorvan chorou um pouquinho e culpou a fumaça.',
  'Desafio feito nos estaleiros. A Ioleth batizou cada parafuso da Lança com um nome.',
  'Sem dano em Pharsis. O Caldrus pegou o primeiro turno de guarda sem ninguém pedir.',
  'Ghelm é um mar de cinza que sussurra. O Ilvane andava nele como quem anda em casa.',
  'Cumpri o desafio no Mar de Cinzas. Ouvi a Syrelith chorar. Não sabia que rainhas choravam.',
  'Sem dano em Ghelm. A Dra. Meridiel tomou o primeiro chá de verdade em anos. Disse que estava quente demais. Sorriu mesmo assim.',
  'O Véu Fendido parece uma ferida no céu. Segurei a lanterna da Lirrin com força.',
  'Desafio feito diante do Véu. A Seraphel não disse nada, só apertou o meu ombro.',
  'Sem dano no Véu. Os amigos estão todos aqui. Acho que é isso que faz a gente ser corajoso.',
  'Ulthar-Vey. Não tem rosto. Tem só fome. Eu tenho uma irmã, um mecânico, uma comandante e um rival chato. Ganhei.',
  'Desafio cumprido contra a Fome. Uma estrela acendeu bem em cima da Cidadela.',
  'Sem dano na última batalha. Fim do diário de bordo. Começo do resto da vida.',
];
const NOMES_FASE = ['Anel de Kessarin', 'Jazida de Mornhek', 'Nebulosa Ruvanti', 'Limiar de Nox', 'O Cerne Umbralis',
  'Anel Partido', 'Jazida Eterna', 'Ruvanti Invertida', 'Limiar Ardente', 'Coração do Cerne',
  'Colônia Oruvai', 'Estaleiros de Pharsis', 'Mar de Cinzas de Ghelm', 'O Véu Fendido', 'Ulthar-Vey'];
const FASES_DIARIO = NOMES_FASE;
const NOMES_CHEFE = ['Vharaxis, a Nave-Ninho', 'Kraxul, o Moedor de Mundos', 'Syrelith, a Rainha Carmim', 'Nox-Aranth, o Vigia do Limiar', 'Soberano Ul-Zarkoth',
  'Eco de Vharaxis', 'Eco de Kraxul', 'Eco de Syrelith', 'Nox-Aranth Ardente', 'Ul-Zarkoth, Coração do Cerne',
  'Ceifadora de Oruvai', 'Kraxul Forjado', 'Syrelith das Cinzas', 'Nox-Aranth, o Último Vigia', 'Ulthar-Vey, a Fome'];
const NOMES_SETOR = ['SETOR 1 · A Queda das Luzes', 'SETOR 2 · Ecos', 'SETOR 3 · Reacender'];
const N_FASES = 15;

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
  { id: 'camara1', texto: 'Conclua 1 câmara', chave: 'camara', meta: 1, c: 0, d: 1 },
];

const CONQUISTAS = [
  { id: 'chefe1', nome: 'Primeiro chefe', texto: 'Derrote 1 chefe', meta: 1, val: h => h.stat.chefes, d: 1 },
  { id: 'chefe10', nome: 'Caçador de chefes', texto: 'Derrote 10 chefes', meta: 10, val: h => h.stat.chefes, d: 2 },
  { id: 'abates500', nome: 'Faxina espacial', texto: 'Destrua 500 inimigos', meta: 500, val: h => h.stat.abates, c: 500 },
  { id: 'est10', nome: 'Dez estrelas', texto: 'Ganhe 10 estrelas no mapa', meta: 10, val: () => Hist.estrelas(), d: 1 },
  { id: 'est20', nome: 'Vinte estrelas', texto: 'Ganhe 20 estrelas no mapa', meta: 20, val: () => Hist.estrelas(), d: 2 },
  { id: 'est30', nome: 'Trinta estrelas', texto: 'Ganhe 30 estrelas no mapa', meta: 30, val: () => Hist.estrelas(), d: 3 },
  { id: 'est45', nome: 'Constelação completa', texto: 'Ganhe as 45 estrelas', meta: 45, val: () => Hist.estrelas(), d: 6 },
  { id: 'fim', nome: 'Céu aceso', texto: 'Derrote Ulthar-Vey', meta: 1, val: h => Object.keys(h.finais).length ? 1 : 0, d: 3 },
  { id: 'cam1', nome: 'Explorador', texto: 'Conclua 1 câmara', meta: 1, val: () => Object.keys(Dados.prog.cam.feitas).length, c: 300 },
  { id: 'cam9', nome: 'Senhor das Câmaras', texto: 'Conclua as 9 câmaras', meta: 9, val: () => Object.keys(Dados.prog.cam.feitas).length, d: 5 },
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
  estrelas() { let s = 0; for (let n = 1; n <= N_FASES; n++) s += Dados.estrelas(n); return s; },
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
      const pool = MISSOES.filter(m => m.id !== 'camara1' || this.liberadaCam(0)), esc = [];
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

// ============================================================ Câmaras (dungeons)
// k = fase usada (inimigos e chefe), ciclo = força; req = fase que precisa ter ao menos 1 estrela
const CAMARAS = [
  { nome: 'Ossuária de Ghelm', k: 0, ciclo: 1, req: 1, cor: '#c8c0b0' },
  { nome: 'Coral de Mornhek', k: 1, ciclo: 1, req: 2, cor: '#7ae07a' },
  { nome: 'Lentes de Ruvanti', k: 2, ciclo: 1, req: 3, cor: '#5ee8d0' },
  { nome: 'Relicário de Orsa', k: 3, ciclo: 1, req: 5, cor: '#ffd650' },
  { nome: 'Ferro Adormecido', k: 1, ciclo: 2, req: 7, cor: '#a0a8c0' },
  { nome: 'Sinos de Vael', k: 4, ciclo: 2, req: 9, cor: '#6edcff' },
  { nome: 'Maré Cinzenta', k: 2, ciclo: 2, req: 11, cor: '#9aa0b8' },
  { nome: 'Vazio de Thuun', k: 3, ciclo: 3, req: 13, cor: '#b48cff' },
  { nome: 'Última Brasa', k: 4, ciclo: 3, req: 15, cor: '#ff7a3a' },
];
const RARIDADES = [null, { n: 'Comum', cor: '#c8d0e0' }, { n: 'Rara', cor: '#5aa8ff' }, { n: 'Épica', cor: '#c070ff' }, { n: 'Lendária', cor: '#ffb02e' }];
// tipo: reliquia / selo (passivos) ou poder (botão ✦ na partida). nv = raridade 1 a 4.
const ITENS_CAM = {
  coracao: { tipo: 'reliquia', n: 'Coração de Mornhek', ic: '❤', d: nv => `+${nv >= 3 ? 2 : 1} vida` },
  lente: { tipo: 'reliquia', n: 'Lente de Ruvanti', ic: '🔍', d: nv => `atrai itens de ${60 * nv} px mais longe` },
  relogio: { tipo: 'reliquia', n: 'Relógio Partido', ic: '⏱', d: nv => `começa com ${20 * nv}% de especial` },
  veu: { tipo: 'reliquia', n: 'Véu de Ilvane', ic: '👻', d: nv => `+${(nv * 0.5).toFixed(1).replace('.', ',')} s invencível após dano` },
  chama: { tipo: 'selo', n: 'Selo da Chama', ic: '🔥', d: nv => `+${8 * nv}% de dano` },
  fortuna: { tipo: 'selo', n: 'Selo da Fortuna', ic: '¢', d: nv => `+${15 * nv}% de moedas` },
  trovao: { tipo: 'selo', n: 'Selo do Trovão', ic: '💣', d: nv => `+${nv >= 3 ? 2 : 1} bomba` },
  argenteo: { tipo: 'selo', n: 'Selo Argênteo', ic: '🛡', d: nv => nv >= 3 ? 'escudo no início e escudo que volta' : 'começa com escudo' },
  salto: { tipo: 'poder', n: 'Salto Fendido', ic: '↯', d: nv => `teletransporta à frente, invencível por ${(0.5 + nv * 0.25).toFixed(2).replace('.', ',')} s` },
  cortina: { tipo: 'poder', n: 'Cortina Argêntea', ic: '◎', d: nv => `bolha protetora por ${3 + nv} s` },
  chuva: { tipo: 'poder', n: 'Chuva de Estilhaços', ic: '✶', d: nv => `${8 + nv * 4} estilhaços caem do céu` },
  ancora: { tipo: 'poder', n: 'Âncora Gravítica', ic: '⚓', d: nv => `inimigos lentos por ${3 + nv} s` },
  pulso: { tipo: 'poder', n: 'Pulso Sereno', ic: '✺', d: nv => `apaga os tiros inimigos e dá ${10 * nv}% de especial` },
};
const RECARGA_PODER = [0, 40, 34, 28, 22];   // segundos por raridade

Object.assign(Hist, {
  cam() { return Dados.prog.cam; },
  liberadaCam(i) { return Dados.estrelas(CAMARAS[i].req) >= 1; },
  ganharChave() { const c = this.cam(); if (c.chaves >= 5) return false; c.chaves++; Dados.salvar(); return true; },
  usarChave() { const c = this.cam(); if (c.chaves < 1) return false; c.chaves--; Dados.salvar(); return true; },
  comprarChave() { if (this.cam().chaves >= 5 || !Dados.pagar(0, 2)) return false; this.cam().chaves++; Dados.salvar(); return true; },
  /** Sorteia a raridade de um baú; sorte = portas arriscadas escolhidas. */
  raridade(sorte, minimo = 1) {
    const r = Math.random() * 100, l = 2 + sorte * 3, e = 10 + sorte * 6, ra = 30 + sorte * 4;
    return Math.max(minimo, r < l ? 4 : r < l + e ? 3 : r < l + e + ra ? 2 : 1);
  },
  /** Três baús: raridade e item (o jogador vê a raridade, não o item). */
  baus(sorte, primeira) {
    const ids = Object.keys(ITENS_CAM), out = [];
    while (out.length < 3) { const id = ids[Math.floor(Math.random() * ids.length)]; if (!out.some(b => b.id === id)) out.push({ id, nv: this.raridade(sorte, primeira && !out.length ? 2 : 1) }); }
    return out;
  },
  /** Guarda o item; se já tiver igual ou melhor, vira moedas. */
  receber(b) {
    const c = this.cam(), atual = c.itens[b.id] || 0;
    if (b.nv > atual) {
      c.itens[b.id] = b.nv;
      const t = ITENS_CAM[b.id].tipo; if (!c.equip[t]) c.equip[t] = b.id;   // equipa sozinho se o espaço estava vazio
      Dados.salvar(); return { novo: true, moedas: 0 };
    }
    const moedas = 80 * b.nv; Dados.ganhar(moedas, 0); return { novo: false, moedas };
  },
  equipar(id) { const c = this.cam(), t = ITENS_CAM[id].tipo; c.equip[t] = c.equip[t] === id ? '' : id; Dados.salvar(); },
  /** Equipamento em uso: { reliquia: {id, nv}, selo: {...}, poder: {...} } (só o que estiver equipado e possuído). */
  equipado() {
    const c = this.cam(), o = {};
    for (const t of ['reliquia', 'selo', 'poder']) { const id = c.equip[t]; if (id && c.itens[id]) o[t] = { id, nv: c.itens[id] }; }
    return o;
  },
  concluirCamara(i) { const c = this.cam(), primeira = !c.feitas[i]; c.feitas[i] = (c.feitas[i] || 0) + 1; Dados.salvar(); return primeira; },
});

// pilotos de cada nave na história (aparecem no "Ver de perto" do Hangar)
const PILOTO_NAVE = {
  FALCAO: ['dren', 1, 'Minha primeira nave da Vigília. O Gorvan jura que ela tem ciúme das outras.'],
  COMETA: ['zephrael', 1, 'A mais rápida do Hangar. Eu sei porque eu sou o mais rápido do Hangar.'],
  TITA: ['tzalenka', 1, 'Blindada como as paredes de Mornhek. Aguenta pancada e ainda canta.'],
  VESPA: ['gorvan', 1, 'Montei cada drone com estes três dedos. Não me faça montar de novo!'],
  MARTELO: ['caldrus', 0, 'Artilharia pesada. Uso para consertar o que eu mesmo quebrei.'],
  FANTASMA: ['ilvane', 0, 'Ela atravessa as coisas. Como eu, às vezes.'],
  AURORA: ['ioleth', 1, 'O escudo se reconstrói sozinho. Fiz as contas três vezes. Quatro.'],
  RELAMPAGO: ['seraphel', 0, 'A nave de comando da Vigília. Rápida, precisa e sem desculpas.'],
  LANCA: ['lirrin', 1, 'O núcleo tem a luz da minha lanterna! Ela nunca apaga, Dren.'],
};

// veículos bônus: a cápsula 📡 chama um aliado da história. req = fase já liberada no mapa; esc = só com essa escolha
const ALIADOS = [
  { id: 'CARGUEIRO', nome: 'Cargueiro do Gorvan', quem: 'gorvan', ex: 1, req: 1, fala: 'Entrega expressa! Pegue antes que caia no vácuo!' },
  { id: 'BROCA', nome: 'Broca da Madre', quem: 'tzalenka', ex: 1, req: 2, fala: 'Abram caminho, que a mina vai passar!' },
  { id: 'VEXX', nome: 'Ala do Vexx', quem: 'zephrael', ex: 1, req: 4, fala: 'Segura essa, Dren. Eu cuido da sua asa.' },
  { id: 'ASA', nome: 'Asa de Asterra', quem: 'seraphel', ex: 0, req: 6, fala: 'Vigília, mísseis no alvo. Agora!' },
  { id: 'CAPITANIA', nome: 'Capitânia de Eskarion', quem: 'eskarion', ex: 0, req: 11, esc: 'libertar', fala: 'Seraphel ensinou bem você. Fogo!' },
];
function aliadosDisponiveis() {
  let max = 1; for (let n = 1; n <= N_FASES; n++) if (Dados.liberada(n)) max = n;
  return ALIADOS.filter(a => a.req <= max && (!a.esc || Hist.h().escolha === a.esc));
}
