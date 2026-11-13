# 🗺️ Roadmap — Navinha Espacial

Lista viva de melhorias. Cada pedido novo entra aqui antes de ser programado.

## Como trabalhamos

1. **Estruturar** — o pedido vira pacotes nesta lista, sem programar.
2. **Escolher** — o James decide quais pacotes entram primeiro.
3. **Programar** — só o que foi escolhido.
4. **Testar** — teste automático no celular simulado (todas as telas, chefes e naves) e depois o James joga no celular de verdade.
5. **Publicar** — nova versão numerada no GitHub Pages; o app instalado mostra "Nova versão disponível".

A versão Java (`src/`) está **congelada** na 2.0. Tudo novo é feito na versão web (`docs/`).

---

## ✅ Versão 3.5.0 (entregue)

**História "Crônicas do Cerne Umbralis" (pacotes 1 e 2)** — cenas com retratos e 4 expressões antes e depois do chefe das 10 fases (só na 1ª vez; botão Pular; dá para rever pelo Diário); carta nova da Lirrin a cada dia; diário de bordo com 30 páginas (1 por estrela); menu "📖 Diário" com bolinha de aviso
**Voltar todo dia (pacote 8b, 8c e 8d)** — 3 missões do dia sorteadas pela data (prêmio em ¢ ou 💎); 8 conquistas com prêmio; ao perder todas as vidas dá para continuar de onde parou por 💎3 (1 vez por partida)
- Arquivos novos: `docs/js/historia.js` (dados e regras), `docs/assets/retratos.png` (12 personagens × 4 expressões)
- Ficou para depois: cenas do Setor 3 e escolhas/finais (dependem do mapa de 15 fases), cenas dos chefes com os nomes novos, Syrelith sem retrato

## ✅ Versão 3.4.0 (entregue)

**Recompensa diária (pacote 8a)** — uma recompensa por dia de calendário (hora do aparelho): ¢100 no dia 1, subindo até ¢500 + 💎1 no dia 7; a sequência continua no dia seguinte e volta ao dia 1 se pular um dia; caixa "Recompensa diária" ao abrir o jogo e botão "🎁 Diária" no menu; relógio voltado não dá prêmio nem zera a sequência

## ✅ Versão 3.3.1 (entregue)

**Correção do modo offline** — o service worker listava 3 imagens que não existem mais (`nave.png`, `inimigo.png`, `tiro.png`) e por isso não instalava: sem offline e sem aviso de "Nova versão disponível"

## ✅ Versão 3.3 (entregue)

**Letras e cards maiores (pacote 7)** — letra mínima maior em todas as telas; HUD com ícones grandes (vidas ×N, bombas ×N, arma, ★ especial); botões de 48 a 58 px; Hangar com botão verde "Melhorar" e "falta ¢X"; fim de jogo com cards de resumo
**Mapa e dificuldade (pacote 9)** — mapa com 10 fases (Setor 1 e Setor 2), 3 estrelas por fase (concluir, cumprir o desafio, não perder vida), Fácil/Normal/Difícil, "Tentar o chefe de novo"
**Sensação de jogo (pacote 10)** — borda vermelha ao levar dano e com 1 vida, barra de tempo do combo, aviso (anel + nome) antes dos ataques do chefe

## ✅ Versão 3.2 (entregue)

**Efeitos pixelfx** (pacotes A e B, escolhidos pelo Claude)
- Chefe: implosão e explosão de plasma ao morrer; bomba com onda de plasma
- Faíscas de acerto, choque nos raios (Elétrico/Relâmpago), coleta de itens e feixe de teletransporte ao entrar na fase
- Imagens em `docs/assets/fx/` (créditos: pixelfx, MIT). Descartados: explosões de chão com fumaça e domos de campo de força (não combinam com o espaço)

## ✅ Versão 3.1 (entregue)

**Ajudas e tiros**
- Itens com tempo: Bolha (8s sem dano), Invencível (6s, encostar destrói), Canhão pesado (10s de tiros grandes que atravessam), Ímã (12s puxando tudo), Câmera lenta (6s)
- Reparo: recupera 1 vida perdida (ou dá escudo se estiver com tudo cheio)
- 5 tipos de tiro com 5 níveis: Laser, Onda, Leque, Teleguiado, Elétrico — item em losango; mesmo tipo sobe nível, outro troca mantendo o nível
- HUD mostra a arma atual e os itens ativos com contagem; "Como jogar" com abas

## ✅ Versão 3.0 (entregue)

**Arte nova** (pixel art gerada por código em `docs/js/arte.js` — prancha em `docs/dev/prancha.html`)
- 8 naves: Falcão, Cometa, Vespa, Titã, Martelo, Fantasma, Aurora, Relâmpago
- 12 inimigos: Disco, Arraia, Atirador, Kamikaze, Encouraçado, Asteroide, Mina, Escudeiro, Teleportador, Enxame, Torre, Lança-laser
- 5 chefes com peças destrutíveis e 3 formas; núcleo blindado até as peças caírem
- Explosões animadas, planetas no fundo, ícone novo
- Músicas chiptune: menu, 5 fases e chefe

**Garagem e peças** (Hangar)
- Moedas (¢) dos inimigos e cristais (💎) das peças de chefes e dos desafios
- 5 peças por nave, níveis 1 a 5: Canhão, Motor, Blindagem, Núcleo, Módulo — aparecem no desenho da nave
- Loja de naves com moedas do jogo (sem dinheiro real)

**Ajustes de celular**
- Tutorial interativo na 1ª partida (pode pular e rever)
- Controle por deslize ou joystick virtual, sensibilidade, volumes separados, vibração, modo leve

---

## 📋 Próximos pacotes (a escolher)

### 4 · Mapa de 15 fases (história)
- Setor 3 · Reacender (fases 11 a 15), cenas, escolhas e finais (dois principais e um secreto com as 45 estrelas), chefe Ulthar-Vey
- Diário com 45 páginas

### 5 · Câmaras (dungeons)
- 9 câmaras de 5 salas com Guardião, baús, relíquias, selos e poderes ativos; Chaves de Câmara

### 3 · Arte dos personagens
- Retrato da Syrelith (Rainha Carmim); nomes novos dos chefes no jogo

### 6 · Publicação na Google Play
- Empacotar como app Android (TWA/AAB a partir do GitHub Pages)
- Conta de desenvolvedor (US$ 25), política de privacidade, classificação etária
- Ficha da loja: ícone 512, banner 1024×500, prints

### Ideias soltas
- Salvar progresso na nuvem (trocar de celular sem perder)
- Ranking online
- App Store (iPhone) — exige Mac e US$ 99/ano
