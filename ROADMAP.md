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

### 2 · Ajudas e tiros
- Escudo por tempo (8s), invencibilidade (6s), canhão maior temporário
- Tipos de tiro trocáveis com 5 níveis: laser, onda, leque, teleguiado, elétrico
- Ímã temporário, câmera lenta, cura

### 4 · Fases e desafios
- Mapa de setores com 10 fases e 3 estrelas por fase
- Missões diárias e conquistas
- Dificuldade Fácil / Normal / Difícil; checkpoint antes do chefe

### 6 · Publicação na Google Play
- Empacotar como app Android (TWA/AAB a partir do GitHub Pages)
- Conta de desenvolvedor (US$ 25), política de privacidade, classificação etária
- Ficha da loja: ícone 512, banner 1024×500, prints

### Ideias soltas
- Salvar progresso na nuvem (trocar de celular sem perder)
- Ranking online
- App Store (iPhone) — exige Mac e US$ 99/ano
