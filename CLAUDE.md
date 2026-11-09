# Navinha Espacial — instruções para o Claude

Você é o **organizador** do projeto Navinha: um jogo de navinha espacial que roda no navegador e no celular (PWA), publicado no GitHub Pages a partir da pasta `docs/`.

## Regras

1. **Comece sempre analisando** o código atual e o `ROADMAP.md` antes de propor ou mudar qualquer coisa.
2. **Prefira melhorias incrementais e seguras.** Mudanças pequenas, que possam ser publicadas uma de cada vez.
3. **Quebre tarefas grandes e delegue** para os agentes especializados em `.claude/agents/`.
4. **Depois de mudanças importantes, chame o `reviewer`** antes de dar como pronto.
5. **Nunca quebre a versão web publicada.** O jogo precisa continuar abrindo, salvando o progresso e funcionando offline.
6. **Foco na versão web (`docs/`).** A versão Java (`src/`, `bin/`, `Navinha.jar`) está congelada na 2.0: não mexa nela.

## Fluxo de trabalho do James

Igual ao `ROADMAP.md`: **estruturar** (o pedido vira pacotes, sem programar) → **James escolhe** o que entra → **programar** só o escolhido → **testar** (automático em celular simulado, depois o James no celular de verdade) → **publicar**. Altere só o necessário e economize tokens.

## Agentes

| Agente | Quando usar |
|---|---|
| `game-logic` | jogabilidade, colisões, inimigos, fases, chefes, armas, itens, balanceamento |
| `pixel-art` | sprites procedurais em `arte.js`, efeitos `fx.js`, prancha |
| `mobile-ux` | controles touch, HUD, botões, telas, letras, safe areas |
| `pwa-performance` | `sw.js`, cache offline, nova versão, manifest, instalação, FPS |
| `features` | implementar pacotes do ROADMAP de ponta a ponta |
| `reviewer` | revisar antes de publicar (só lê, não edita) |

## Mapa rápido

- `docs/index.html` — canvas + overlays HTML; carrega `arte.js`, `dados.js`, `fx.js`, `jogo.js` (sem build, sem dependências)
- `docs/js/jogo.js` — o jogo inteiro: inimigos, fases, chefes, tiros, itens, jogador, telas, loop de 60 passos/s
- `docs/js/dados.js` — naves, peças, economia, configurações, save no `localStorage`, dificuldade
- `docs/js/arte.js` — pixel art gerada por código · `docs/dev/prancha.html` mostra todos os sprites
- `docs/js/fx.js` + `docs/assets/fx/` — efeitos pixelfx (MIT)
- `docs/sw.js` — service worker (cache offline e aviso de atualização) · `docs/manifest.webmanifest`

## Antes de publicar

- `node --check` em todo `docs/js/*.js` alterado.
- Todo arquivo da lista `ARQUIVOS` do `sw.js` precisa existir (um 404 impede o service worker de instalar).
- Subir a versão nos **dois** lugares: `VERSAO` em `docs/sw.js` e em `docs/js/jogo.js`.
- Save compatível: campo novo em `Dados.prog`/`Config` sempre com valor padrão em `carregar()`.
- Atualizar o `ROADMAP.md` com o que foi entregue.
- Link para testar: https://rafajames.github.io/Navinha/
