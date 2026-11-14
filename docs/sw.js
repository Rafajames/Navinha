/* Service worker do Navinha: guarda o jogo para funcionar offline e permite atualizar.
 * Para publicar uma nova versão, basta mudar o número abaixo (e o VERSAO em js/jogo.js). */
const VERSAO = 'navinha-3.7.2';
const ARQUIVOS = [
  './',
  'index.html',
  'js/arte.js',
  'js/dados.js',
  'js/historia.js',
  'js/jogo.js',
  'js/fx.js',
  'manifest.webmanifest',
  'icons/apple-touch-icon.png',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'assets/retratos.png',
  'assets/fontes/tiny5-latin-400-normal.woff2',
  'assets/fontes/press-start-2p-latin-400-normal.woff2',
  'assets/acerto.mp3',
  'assets/alerta.mp3',
  'assets/bomba.mp3',
  'assets/compra.mp3',
  'assets/dano.mp3',
  'assets/erro.mp3',
  'assets/especial.mp3',
  'assets/menu.mp3',
  'assets/moeda.mp3',
  'assets/musica_chefe.mp3',
  'assets/fx/LICENSE-pixelfx.txt',
  'assets/fx/choque.png',
  'assets/fx/coleta.png',
  'assets/fx/faisca.png',
  'assets/fx/implosao.png',
  'assets/fx/plasma.png',
  'assets/fx/teleporte.png',
  'assets/musica_fase1.mp3',
  'assets/musica_fase2.mp3',
  'assets/musica_fase3.mp3',
  'assets/musica_fase4.mp3',
  'assets/musica_fase5.mp3',
  'assets/musica_menu.mp3',
  'assets/powerup.mp3',
  'assets/raio.mp3',
  'assets/som_explosao.mp3',
  'assets/som_tiro.mp3',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSAO).then(c => c.addAll(ARQUIVOS)));
  // não ativa sozinho: espera o jogador tocar em "Atualizar" (para não trocar a versão no meio da partida)
});

self.addEventListener('message', e => { if (e.data === 'atualizar') self.skipWaiting(); });

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(chaves => Promise.all(chaves.filter(k => k.startsWith('navinha-') && k !== VERSAO).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(r => r || fetch(e.request)));
});
