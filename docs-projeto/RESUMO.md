# Navinha — resumo completo (referência para as próximas conversas)

Dono: James (Jamerson Rafael da Silva Viana, GitHub `Rafajames`). Escreve em português.
Repositório: https://github.com/Rafajames/Navinha · Jogo online: https://rafajames.github.io/Navinha/

## Como trabalhar com o James (regras dele)
1. Estruturar tudo primeiro, sem programar.
2. Perguntar quais melhorias implementar primeiro.
3. Programar só o que foi escolhido.
4. Testar só no fim.
- Alterar só o que for necessário no código e economizar tokens.
- Sempre terminar respostas de implementação com o link para testar: https://rafajames.github.io/Navinha/

## Estado técnico (versão 3.3.0)
- Versão web principal em `docs/` (JS puro + canvas, PWA instalável, funciona offline). Versão Java em `src/` está **congelada na 2.0**.
- Arquivos: `docs/js/arte.js` (pixel art gerada por código), `docs/js/dados.js` (naves, peças, dificuldade, progresso), `docs/js/jogo.js` (regras e telas), `docs/js/fx.js` (efeitos pixelfx, MIT), `docs/sw.js` (cache e atualização).
- Para lançar: aumentar `VERSAO` em `docs/sw.js` e em `docs/js/jogo.js`, commit e `git push origin HEAD:main`. GitHub Pages publica sozinho.
- Teste automático: Playwright em celular simulado (scripts na pasta de trabalho).
- Entregue: 8 naves, 12 inimigos, 5 chefes com peças, Hangar com 5 peças por nave (níveis 1–5), moedas e cristais, itens de ajuda e 5 armas, mapa de 10 fases com 3 estrelas, 3 dificuldades, "tentar o chefe de novo", HUD e telas com letras maiores, borda de dano, aviso de ataque do chefe, efeitos pixelfx (plasma, implosão, faíscas, teletransporte).

## O que ainda falta (roadmap)
- **Pacote 8 · Voltar todo dia:** recompensa diária, 3 missões do dia, conquistas, continuar com cristais.
- **Modo retrato** (jogar em pé): exige refazer o layout.
- **História** (esta conversa): telas de cena entre fases, diário de bordo, cartas diárias, laços com personagens, escolhas e finais.
- **Câmaras (dungeons)** com equipamentos e poderes.
- **Mapa de 15 fases** (hoje são 10).
- Publicação na Google Play (conta US$ 25, política de privacidade, ficha da loja); nuvem; ranking online.

## A história: "Crônicas do Cerne Umbralis"
Ano 9.214 da Era Lumínica. A humanidade vive em cinco Arcos de colônias. Há quase um século as estrelas morrem, um fenômeno chamado **a Fome**. A **Vigília de Asterra** (ordem de pilotos) protege as colônias. A causa está no **Cerne Umbralis**, máquina antiga no centro do Arco de Ulthar.
Tom: aventura com humor e coração, estilo anime. Cenas de 3 a 5 falas, toque para avançar, botão de pular.

### Elenco (cada um é piloto de uma nave existente quando aplicável)
- **Dren Ysolvane "Ixion"** (19, protagonista; nome editável pelo jogador) — nave Falcão, cor laranja-vermelho.
- **Lirrin Ysolvane** (12, irmã, Colônia Oruvai) — manda uma carta por dia.
- **Seraphel Orun-Katha** (47, comandante da Cidadela Irrynth) — azul-petróleo.
- **Gorvan Pellumbra** (62, mecânico do Hangar) — nave Vespa, amarelo.
- **Zephrael Korvant "Vexx"** (21, rival que vira amigo) — nave Cometa, azul.
- **Dra. Ioleth Quarrane** (34, cientista) — nave Aurora, turquesa.
- **Madre Tzalenka Brogh** (71, líder da Jazida de Mornhek) — nave Titã, verde.
- **Ilvane Torr** (29, piloto desaparecido) — nave Fantasma, roxo.
- **Almirante Eskarion Morvane / Soberano Ul-Zarkoth** (grande vilão; ex-herói, mentor de Seraphel; perdeu a esposa e a filha quando a colônia Oruvai escureceu).
- **Capitão Caldrus Venn-Ahrel** (traidor que se redime).
- **Dra. Meridiel Sarn / Syrelith, a Rainha Carmim** (cientista fundida ao Cerne).
- Vilão verdadeiro: **Ulthar-Vey, a Fome** (entidade antiga, revelada no Setor 3).

### Chefes (nome novo → nome antigo no jogo)
Vharaxis, a Nave-Ninho (Nave-Mãe Ômega) · Kraxul, o Moedor de Mundos (Devorador de Rochas) · Syrelith, a Rainha Carmim (Rainha Carmesim) · Nox-Aranth, o Vigia do Limiar (Sentinela Sombria) · Soberano Ul-Zarkoth (Imperador Zorg) · Ulthar-Vey, a Fome (novo).

### Campanha: 15 fases em 3 setores
- **Setor 1 · A Queda das Luzes:** 1 Anel de Kessarin, 2 Jazida de Mornhek, 3 Nebulosa Ruvanti, 4 Limiar de Nox, 5 O Cerne Umbralis. Termina com a voz de Lirrin ecoando do Cerne.
- **Setor 2 · Ecos** (mundos corrompidos, cada fase revela uma verdade): 6 Anel Partido, 7 Jazida Eterna, 8 Ruvanti Invertida, 9 Limiar Ardente, 10 Coração do Cerne. Escolha final: destruir o Cerne ou libertar a memória de Eskarion.
- **Setor 3 · Reacender:** 11 Colônia Oruvai, 12 Estaleiros de Pharsis, 13 Mar de Cinzas de Ghelm, 14 O Véu Fendido, 15 Ulthar-Vey. Finais: dois principais e um secreto com as 45 estrelas.

### Câmaras (9 dungeons)
5 salas, porta segura ou arriscada, Guardião menor e Sala do Tesouro com 3 baús (escolhe 1). Entrada com Chave de Câmara. Raridades: Comum, Rara, Épica, Lendária. Recompensas: **Relíquia** e **Selo** (equipamentos) e **Poderes** ativos (Salto Fendido, Cortina Argêntea, Chuva de Estilhaços, Âncora Gravítica, Pulso Sereno).
Câmaras: Ossuária de Ghelm, Coral de Mornhek, Lentes de Ruvanti, Relicário de Orsa, Ferro Adormecido, Sinos de Vael, Maré Cinzenta, Vazio de Thuun, Última Brasa.

### Ganchos para o jogador voltar
Cartas de Lirrin por dia · diário de bordo com 45 páginas (1 por estrela) · laços com os personagens · missões do dia contadas por eles · Chaves de Câmara · temporadas a cada 2 semanas · escolhas que mudam cenas e final · naves ligadas a pessoas · eventos de fim de semana (Noite do Eclipse) · coleção de relíquias de história.

## Imagem de referência dos personagens
Arquivo: `docs-projeto/personagens-referencia.png` (1536×1024, fundo verde #00FF00, pixel art). Gerada pelo ChatGPT a partir das fichas. **Os desenhos devem seguir exatamente esta imagem.**
- Linha de cima, da esquerda para a direita: Dren, Lirrin, Seraphel, Gorvan, Zephrael, Dra. Ioleth.
- Linha de baixo, da esquerda para a direita: Madre Tzalenka, Ilvane, Eskarion (antes), Soberano Ul-Zarkoth (agora), Caldrus, Syrelith (Rainha Carmim).

### Fichas visuais resumidas
- **Dren:** magro, pele morena clara, cabelo castanho-escuro rebelde com uma mecha na testa, olhos âmbar, pinta sob o olho esquerdo. Jaqueta curta vermelho-alaranjada com estrela de quatro pontas na manga, cachecol ferrugem comprido, calça cinza-chumbo, botas grandes.
- **Lirrin:** pequena, sardas, dente da frente lascado, duas tranças com fitas amarelas, macacão verde-musgo remendado, mochila com adesivos de estrela, lanterna no pescoço.
- **Seraphel:** alta, pele marrom-escura, cabelo raspado nas laterais com tranças para trás e mechas grisalhas, cicatriz na sobrancelha direita, olho esquerdo biônico (anel azul), casaco longo azul-petróleo com três divisas douradas e capa curta com broche de estrela.
- **Gorvan:** baixo e largo, careca com anel de cabelo branco, bigode branco enorme, óculos de solda na testa, macacão amarelo com graxa, cinto de ferramentas, mão direita de latão com três dedos.
- **Zephrael:** esguio, loiro-platinado com topete e cacho solto, olhos azul-gelo, brinco de argola, roupa azul-elétrico com detalhes brancos, lenço azul-claro, luvas e botas prateadas, relógio de pulso.
- **Dra. Ioleth:** cabelo preto ondulado em coque com dois lápis, óculos redondos com lentes turquesa, jaleco aqua sobre macacão branco, tablet no antebraço, pingente de cristal turquesa, amostras luminosas.
- **Madre Tzalenka:** baixa e forte, pele cobre-escura, olhos verdes, sorriso com um dente de ouro, cabelo branco em trança enrolada como coroa, colete de couro verde-escuro, picareta nas costas, capacete de mina.
- **Ilvane:** magríssimo e pálido, olheiras, olhos lilás, cabelo preto-azulado até o ombro, traje roxo-escuro, capa curta translúcida, máscara de meia face pendurada no pescoço (ainda não aparece na imagem), dedos da mão esquerda semitransparentes como névoa.
- **Eskarion (antes):** muito alto, pele marrom, barba grisalha curta, cabelo grisalho em rabo baixo, manto preto e carmesim com borda dourada, armadura com núcleo de luz, relógio de bolso da filha na mão direita.
- **Ul-Zarkoth (agora):** o mesmo homem com metade do rosto coberta por máscara de metal escuro com fenda dourada no lugar do olho.
- **Caldrus:** alto e elegante, bigode fino, olhos verdes frios, cabelo castanho-claro com gel, farda branca com dourado, capa curta azul-marinho, anel com pedra vermelha.
- **Syrelith:** pele rosada-carmim com veios de luz, cabelo vermelho-rubi flutuando como fumaça, coroa de cristais, olhos totalmente brancos, vestido-armadura de cristais vermelho-escuros.
- **Dra. Meridiel Sarn (humana, ainda sem desenho):** 38 anos, olhos castanhos, sorriso cansado, cabelo castanho-escuro caindo sobre o rosto, uniforme de cientista vermelho-escuro.

## O que ainda falta de imagens
1. Meridiel humana (pedido ao ChatGPT, sem resultado ainda).
2. Retratos com 4 expressões (neutro, feliz, bravo ou preocupado, triste) para os 12 personagens, em 4 imagens de 3 personagens cada.
3. Quando as imagens chegarem: remover o fundo verde, cortar cada personagem e converter por código para pixel art de 64×64 e 128×128, no estilo das naves.

## Próximo passo sugerido
Escolher quais partes da história entram primeiro (sugestão: cartas de Lirrin, cenas entre as fases e diário de bordo, juntos com o pacote 8 de recompensas e missões do dia), estruturar e só então programar.
