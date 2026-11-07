package navinha;

import java.awt.*;
import java.awt.event.KeyEvent;
import java.util.ArrayList;
import java.util.List;
import javax.swing.JPanel;
import javax.swing.Timer;

/**
 * Painel principal: loop a 60 quadros por segundo, máquina de estados das
 * telas, regras da partida, colisões e desenho.
 */
public class Jogo extends JPanel {

    public static final int LARGURA = 1024, ALTURA = 768;
    private static final double PASSO = 1_000_000_000.0 / 60.0;

    public enum Estado {
        MENU, SELECAO, COMO_JOGAR, RECORDES,
        INTRO_FASE, JOGANDO, ALERTA_CHEFE, CHEFE, FASE_CONCLUIDA, MORRENDO,
        VITORIA, NOME, GAME_OVER
    }

    // ----- estado geral
    Estado estado = Estado.MENU;
    boolean pausado = false;
    int timer = 0;                       // quadros no estado atual
    long quadro = 0;
    final Input input = new Input();
    final Fundo fundo = new Fundo();
    final Efeitos efeitos = new Efeitos();

    // ----- menus
    int opcaoMenu = 0;
    int naveSelecionada = 0;
    int opcaoPausa = 0;
    String nomeDigitado = "";
    int posicaoRecorde = -1;

    // ----- partida
    Player player;
    final List<Tiro> tiros = new ArrayList<>();
    final List<Inimigo> inimigos = new ArrayList<>();
    private final List<Inimigo> novosInimigos = new ArrayList<>();
    final List<PowerUp> powerUps = new ArrayList<>();
    Chefe chefe;
    int faseIdx = 0, ciclo = 1;
    Fase fase = Fase.FASES[0];
    long pontos = 0;
    int combo = 0, comboTimer = 0, maiorCombo = 0;
    int abatesTotal = 0, abatesFase = 0;
    long acertos = 0;
    int estatEspeciais = 0;
    private int spawnTimer = 60;
    boolean venceu = false;
    String faseRecorde = "1";

    // ----- desafio da fase
    int desafioStatus = 0;               // 0 = em andamento, 1 = concluído, -1 = falhou
    int maxComboFase = 0, asteroidesFase = 0;
    boolean danoNaFase = false, bombaNaFase = false;
    final List<String[]> resumoFase = new ArrayList<>();
    private boolean bonusAplicado = false;
    private int chefeMorrendo = 0;

    // ----- efeitos de tela
    private double tremor = 0;
    private int flashTela = 0;
    String aviso = null;
    Color corAviso = Color.WHITE;
    int avisoTimer = 0;
    private final List<Object[]> filaAvisos = new ArrayList<>();

    private long ultimo;
    private double acumulado = 0;

    public Jogo() {
        setPreferredSize(new Dimension(LARGURA, ALTURA));
        setBackground(Color.BLACK);
        setFocusable(true);
        setDoubleBuffered(true);
        addKeyListener(input);
        addFocusListener(input.foco);
        setFocusTraversalKeysEnabled(false);
        Dados.carregar();
        nomeDigitado = Dados.ultimoNome();
    }

    public void iniciar() {
        Som.carregarTudo();
        Som.iniciarMusica();
        requestFocusInWindow();
        ultimo = System.nanoTime();
        Timer t = new Timer(15, e -> tick());
        t.setCoalesce(true);
        t.start();
    }

    /** Lógica em passo fixo (independe da velocidade do computador). */
    private void tick() {
        long agora = System.nanoTime();
        acumulado += agora - ultimo;
        ultimo = agora;
        if (acumulado > PASSO * 5) acumulado = PASSO * 5;   // evita "espiral da morte" após travadas
        boolean atualizou = false;
        while (acumulado >= PASSO) {
            try {
                atualizar();
            } catch (RuntimeException e) {
                // um erro num quadro não deve congelar o jogo inteiro
                e.printStackTrace();
            }
            input.fimDoQuadro();
            acumulado -= PASSO;
            atualizou = true;
        }
        if (atualizou) repaint();
    }

    // =================================================================== ATUALIZAÇÃO

    private void atualizar() {
        quadro++;
        if (input.apertou(KeyEvent.VK_M) && estado != Estado.NOME) {
            boolean mudo = Som.alternarMudo();
            mostrarAviso(mudo ? "SOM DESLIGADO" : "SOM LIGADO", Color.LIGHT_GRAY);
        }
        if (avisoTimer > 0) avisoTimer--;
        else if (!filaAvisos.isEmpty()) {
            Object[] a = filaAvisos.remove(0);
            aviso = (String) a[0];
            corAviso = (Color) a[1];
            avisoTimer = 120;
        }

        if (emPartida() && pausado) {
            atualizarPausa();
            return;
        }
        timer++;

        switch (estado) {
            case MENU:        atualizarMenu(); break;
            case SELECAO:     atualizarSelecao(); break;
            case COMO_JOGAR:
            case RECORDES:
                fundo.update();
                if (input.voltar() || input.confirmar()) { Som.tocar("menu"); trocar(Estado.MENU); }
                break;
            case NOME:        atualizarNome(); break;
            case GAME_OVER:   atualizarGameOver(); break;
            case VITORIA:     atualizarVitoria(); break;
            default:          atualizarPartida(); break;
        }
    }

    boolean emPartida() {
        switch (estado) {
            case INTRO_FASE: case JOGANDO: case ALERTA_CHEFE: case CHEFE: case FASE_CONCLUIDA: case MORRENDO:
                return true;
            default:
                return false;
        }
    }

    private void trocar(Estado e) {
        estado = e;
        timer = 0;
        input.limpar();
    }

    private void atualizarMenu() {
        fundo.update();
        String[] opcoes = Hud.OPCOES_MENU;
        if (input.apertou(KeyEvent.VK_UP, KeyEvent.VK_W)) { opcaoMenu = (opcaoMenu + opcoes.length - 1) % opcoes.length; Som.tocar("menu"); }
        if (input.apertou(KeyEvent.VK_DOWN, KeyEvent.VK_S)) { opcaoMenu = (opcaoMenu + 1) % opcoes.length; Som.tocar("menu"); }
        if (input.confirmar()) {
            Som.tocar("menu");
            switch (opcaoMenu) {
                case 0: trocar(Estado.SELECAO); break;
                case 1: trocar(Estado.COMO_JOGAR); break;
                case 2: trocar(Estado.RECORDES); break;
                case 3: System.exit(0); break;
            }
        }
    }

    private void atualizarSelecao() {
        fundo.update();
        int n = NaveTipo.values().length;
        if (input.apertou(KeyEvent.VK_LEFT, KeyEvent.VK_A)) { naveSelecionada = (naveSelecionada + n - 1) % n; Som.tocar("menu"); }
        if (input.apertou(KeyEvent.VK_RIGHT, KeyEvent.VK_D)) { naveSelecionada = (naveSelecionada + 1) % n; Som.tocar("menu"); }
        if (input.voltar()) { Som.tocar("menu"); trocar(Estado.MENU); return; }
        if (input.confirmar()) {
            NaveTipo t = NaveTipo.values()[naveSelecionada];
            if (Dados.desbloqueada(t)) novaPartida(t);
            else mostrarAviso("BLOQUEADA: " + t.condicao, new Color(255, 120, 120));
        }
    }

    private void atualizarPausa() {
        if (input.apertou(KeyEvent.VK_UP, KeyEvent.VK_W)) { opcaoPausa = (opcaoPausa + 2) % 3; Som.tocar("menu"); }
        if (input.apertou(KeyEvent.VK_DOWN, KeyEvent.VK_S)) { opcaoPausa = (opcaoPausa + 1) % 3; Som.tocar("menu"); }
        if (input.apertou(KeyEvent.VK_P, KeyEvent.VK_ESCAPE)) { pausado = false; return; }
        if (input.apertou(KeyEvent.VK_ENTER)) {
            Som.tocar("menu");
            if (opcaoPausa == 0) pausado = false;
            else if (opcaoPausa == 1) { pausado = false; novaPartida(player.tipo); }
            else { pausado = false; trocar(Estado.MENU); }
        }
    }

    private void atualizarNome() {
        fundo.update();
        efeitos.update();
        for (char c : input.consumirDigitado().toCharArray()) {
            if (c == '\b') {
                if (!nomeDigitado.isEmpty()) nomeDigitado = nomeDigitado.substring(0, nomeDigitado.length() - 1);
            } else if (c == '\n' || c == '\r') {
                confirmarNome();
                return;
            } else if ((Character.isLetterOrDigit(c) || c == ' ' || c == '-' || c == '_') && nomeDigitado.length() < 12) {
                nomeDigitado += c;
            }
        }
    }

    private void confirmarNome() {
        String nome = nomeDigitado.trim().isEmpty() ? "Piloto" : nomeDigitado.trim();
        Dados.salvarNome(nome);
        posicaoRecorde = Dados.adicionarRecorde(nome, (int) Math.min(Integer.MAX_VALUE, pontos), faseRecorde, player.tipo.nome);
        Som.tocar("powerup");
        trocar(Estado.GAME_OVER);
    }

    private void atualizarGameOver() {
        fundo.update();
        efeitos.update();
        if (timer < 40) return;
        if (input.apertou(KeyEvent.VK_R)) novaPartida(player.tipo);
        else if (input.apertou(KeyEvent.VK_ENTER, KeyEvent.VK_ESCAPE)) { Som.tocar("menu"); trocar(Estado.MENU); }
    }

    // =================================================================== PARTIDA

    private void novaPartida(NaveTipo tipo) {
        player = new Player(tipo);
        tiros.clear();
        inimigos.clear();
        novosInimigos.clear();
        powerUps.clear();
        efeitos.limpar();
        filaAvisos.clear();
        avisoTimer = 0;
        pontos = 0;
        combo = comboTimer = maiorCombo = 0;
        abatesTotal = 0;
        acertos = 0;
        estatEspeciais = 0;
        ciclo = 1;
        faseIdx = 0;
        venceu = false;
        posicaoRecorde = -1;
        pausado = false;
        iniciarFase();
    }

    private void iniciarFase() {
        fase = Fase.FASES[faseIdx];
        fundo.definirFase(fase);
        chefe = null;
        abatesFase = 0;
        desafioStatus = 0;
        maxComboFase = 0;
        asteroidesFase = 0;
        danoNaFase = false;
        bombaNaFase = false;
        bonusAplicado = false;
        chefeMorrendo = 0;
        spawnTimer = 90;
        trocar(Estado.INTRO_FASE);
    }

    double dificuldade() {
        return fase.velocidade * (1 + (ciclo - 1) * 0.25);
    }

    private void atualizarPartida() {
        // hiperespaço no começo de cada fase
        if (estado == Estado.INTRO_FASE) fundo.setHiperespaco(Math.max(0, 1 - timer / 90.0));
        else if (estado == Estado.FASE_CONCLUIDA) fundo.setHiperespaco(Math.min(1, Math.max(0, (timer - 200) / 80.0)));
        else fundo.setHiperespaco(0);
        fundo.update();

        if (input.apertou(KeyEvent.VK_P, KeyEvent.VK_ESCAPE) && estado != Estado.MORRENDO) {
            pausado = true;
            opcaoPausa = 0;
            return;
        }

        boolean podeAtirar = estado == Estado.JOGANDO || estado == Estado.ALERTA_CHEFE || estado == Estado.CHEFE;
        player.update(this, input, podeAtirar);

        if (comboTimer > 0 && --comboTimer == 0) combo = 0;

        switch (estado) {
            case INTRO_FASE:
                if (timer > 200) trocar(Estado.JOGANDO);
                break;
            case JOGANDO:
                if (abatesFase < fase.meta) gerarInimigos();
                else if (inimigos.isEmpty() || timer > 400) {
                    trocar(Estado.ALERTA_CHEFE);
                    Som.tocar("alerta");
                }
                break;
            case ALERTA_CHEFE:
                if (timer > 170) {
                    chefe = new Chefe(fase.chefe, dificuldade(), 1 + (ciclo - 1) * 0.6);
                    trocar(Estado.CHEFE);
                }
                break;
            case CHEFE:
                if (chefe.vivo) {
                    chefe.update(this);
                    if (fase.desafio == Fase.Desafio.CHEFE_RAPIDO && desafioStatus == 0
                            && chefe.tempoLuta > fase.desafio.meta * 60) falharDesafio();
                } else if (++chefeMorrendo % 6 == 0 && chefeMorrendo < 120) {
                    double ox = (Math.random() - 0.5) * chefe.tamanho, oy = (Math.random() - 0.5) * chefe.tamanho * 0.6;
                    efeitos.explosao(chefe.x + ox, chefe.y + oy, 60);
                    Som.tocar("explosao");
                    tremer(8);
                } else if (chefeMorrendo == 120) {
                    efeitos.explosao(chefe.x, chefe.y, 250);
                    flashTela = 25;
                    tremer(30);
                    Som.tocar("bomba");
                } else if (chefeMorrendo > 170) {
                    concluirFase();
                }
                break;
            case FASE_CONCLUIDA:
                if (timer > 280 || (timer > 60 && input.apertou(KeyEvent.VK_ENTER))) {
                    if (faseIdx == Fase.FASES.length - 1 && ciclo == 1 && !venceu) {
                        venceu = true;
                        powerUps.clear();
                        tiros.clear();
                        trocar(Estado.VITORIA);
                    } else {
                        avancarFase();
                    }
                }
                break;
            case MORRENDO:
                if (timer > 150) finalizarPartida();
                break;
            default:
                break;
        }

        atualizarObjetos();
        colisoes();
        efeitos.update();
        if (tremor > 0) tremor *= 0.88;
        if (flashTela > 0) flashTela--;
    }

    private void atualizarVitoria() {
        fundo.update();
        efeitos.update();
        if (timer % 25 == 0) {
            efeitos.explosao(150 + Math.random() * (LARGURA - 300), 120 + Math.random() * 300, 40);
        }
        if (timer < 60) return;
        if (input.apertou(KeyEvent.VK_ENTER)) {
            avancarFase();
        } else if (input.apertou(KeyEvent.VK_ESCAPE)) {
            faseRecorde = "Venceu!";
            finalizarPartida();
        }
    }

    private void avancarFase() {
        faseIdx++;
        if (faseIdx >= Fase.FASES.length) {
            faseIdx = 0;
            ciclo++;
            mostrarAviso("CICLO " + ciclo + " — OS INIMIGOS ESTÃO MAIS FORTES!", new Color(255, 160, 80));
        }
        tiros.removeIf(t -> t.inimigo);
        iniciarFase();
    }

    private void finalizarPartida() {
        if (!"Venceu!".equals(faseRecorde)) faseRecorde = ciclo == 1 ? String.valueOf(fase.numero) : ciclo + "-" + fase.numero;
        if (Dados.entraNoRanking((int) Math.min(Integer.MAX_VALUE, pontos))) {
            if (nomeDigitado.isEmpty()) nomeDigitado = Dados.ultimoNome();
            trocar(Estado.NOME);
        } else {
            posicaoRecorde = -1;
            trocar(Estado.GAME_OVER);
        }
    }

    private void gerarInimigos() {
        if (--spawnTimer > 0) return;
        double prog = abatesFase / (double) fase.meta;
        spawnTimer = (int) (fase.intervalo * (1 - 0.3 * prog) / (1 + (ciclo - 1) * 0.2));
        if (inimigos.size() >= 18) return;

        InimigoTipo tipo = fase.sortearTipo();
        if (tipo == InimigoTipo.TANQUE && contar(InimigoTipo.TANQUE) >= (fase.numero >= 5 ? 2 : 1)) tipo = InimigoTipo.ZIGUE;
        if (tipo == InimigoTipo.ATIRADOR && contar(InimigoTipo.ATIRADOR) >= 3) tipo = InimigoTipo.BASICO;

        double y = 100 + Math.random() * (ALTURA - 170);
        double dif = dificuldade();
        if ((tipo == InimigoTipo.BASICO || tipo == InimigoTipo.ZIGUE) && Math.random() < 0.3) {
            // formação: fila (zigue-zague, parece uma cobra) ou V (discos)
            int n = 4 + (int) (Math.random() * 2);
            for (int i = 0; i < n; i++) {
                double yy = tipo == InimigoTipo.ZIGUE ? y : y + (i % 2 == 0 ? 1 : -1) * ((i + 1) / 2) * 38;
                yy = Math.max(80, Math.min(ALTURA - 50, yy));
                inimigos.add(new Inimigo(tipo, LARGURA + 50 + i * 55, yy, dif));
            }
            spawnTimer += 50;
        } else {
            inimigos.add(new Inimigo(tipo, LARGURA + 60, y, dif));
        }
    }

    private int contar(InimigoTipo t) {
        int n = 0;
        for (Inimigo i : inimigos) if (i.tipo == t && i.vivo) n++;
        return n;
    }

    public void adicionarInimigo(Inimigo i) {
        novosInimigos.add(i);
    }

    private void atualizarObjetos() {
        for (int i = 0; i < tiros.size(); i++) tiros.get(i).update(this);
        for (int i = 0; i < inimigos.size(); i++) inimigos.get(i).update(this);
        for (PowerUp p : powerUps) p.update(player);
    }

    private void colisoes() {
        Rectangle rp = player.getBounds();
        boolean temChefe = chefe != null && chefe.vivo && estado == Estado.CHEFE;
        Rectangle rc = temChefe ? chefe.getBounds() : null;

        // tiros do jogador -> inimigos e chefe
        for (Tiro t : tiros) {
            if (!t.vivo || t.inimigo) continue;
            Rectangle rt = t.getBounds();
            for (Inimigo in : inimigos) {
                if (!in.vivo || t.atingidos.contains(in) || !rt.intersects(in.getBounds())) continue;
                acertar(t, in);
                if (!t.vivo) break;
            }
            if (t.vivo && temChefe && !t.atingidos.contains(chefe) && rt.intersects(rc)) {
                t.atingidos.add(chefe);
                acertos++;
                efeitos.acerto(t.x, t.y, Color.YELLOW);
                if (t.perfuracoes > 0) t.perfuracoes--; else t.vivo = false;
                danificarChefe(t.dano);
            }
        }

        // poderes especiais
        if (player.laser()) {
            Rectangle rl = player.getBoundsLaser();
            for (Inimigo in : inimigos)
                if (in.vivo && rl.intersects(in.getBounds()) && in.danificar(0.35)) matar(in);
            if (temChefe && rl.intersects(rc)) danificarChefe(0.3);
            if (quadro % 3 == 0) efeitos.faisca(player.x + 40, player.y + (Math.random() - 0.5) * 20, new Color(230, 180, 255));
        }
        if (player.escudoPlasma()) {
            int r = player.raioEscudoPlasma();
            for (Tiro t : tiros)
                if (t.vivo && t.inimigo && Math.hypot(t.x - player.x, t.y - player.y) < r + 4) {
                    t.vivo = false;
                    efeitos.faisca(t.x, t.y, new Color(160, 255, 170));
                }
            for (Inimigo in : inimigos)
                if (in.vivo && Math.hypot(in.x - player.x, in.y - player.y) < r + in.tipo.tamanho / 2.0 && in.danificar(1.2)) matar(in);
        }

        // inimigos e tiros inimigos -> jogador
        if (player.vivo) {
            for (Tiro t : tiros) {
                if (t.vivo && t.inimigo && t.getBounds().intersects(rp)) {
                    if (player.vulneravel()) { t.vivo = false; levarDano(); }
                    else if (player.turbo()) t.vivo = false;
                }
            }
            for (Inimigo in : inimigos) {
                if (!in.vivo || !in.getBounds().intersects(rp)) continue;
                if (player.turbo()) {
                    if (in.danificar(6)) matar(in);
                } else if (player.vulneravel()) {
                    levarDano();
                    if (in.danificar(in.tipo == InimigoTipo.TANQUE ? 3 : 50)) matar(in);
                }
            }
            if (temChefe && rc.intersects(rp) && player.vulneravel()) levarDano();

            for (PowerUp p : powerUps) {
                if (p.vivo && p.getBounds().intersects(rp)) {
                    p.vivo = false;
                    aplicarPowerUp(p.tipo);
                }
            }
        }

        tiros.removeIf(t -> !t.vivo);
        inimigos.removeIf(i -> !i.vivo);
        powerUps.removeIf(p -> !p.vivo);
        inimigos.addAll(novosInimigos);
        novosInimigos.clear();
    }

    private void acertar(Tiro t, Inimigo in) {
        t.atingidos.add(in);
        acertos++;
        efeitos.acerto(t.x, t.y, Color.YELLOW);
        if (t.perfuracoes > 0) t.perfuracoes--; else t.vivo = false;
        if (in.danificar(t.dano)) matar(in);
        else Som.tocar("acerto");
    }

    private void danificarChefe(double d) {
        player.ganharEnergia(d * 0.25);
        if (chefe.danificar(d)) derrotarChefe();
    }

    private void matar(Inimigo in) {
        in.vivo = false;
        abatesTotal++;
        if (in.tipo != InimigoTipo.FRAGMENTO && estado == Estado.JOGANDO) abatesFase++;
        combo++;
        comboTimer = 150;
        maiorCombo = Math.max(maiorCombo, combo);
        maxComboFase = Math.max(maxComboFase, combo);
        if (combo > 0 && combo % 10 == 0) mostrarAviso("COMBO " + combo + "!  x" + multiplicador(), new Color(255, 220, 90));
        long ganho = (long) in.tipo.pontos * multiplicador() * ciclo;
        pontos += ganho;
        efeitos.texto(in.x, in.y - 20, "+" + ganho, multiplicador() > 1 ? new Color(255, 220, 90) : Color.WHITE, 15);
        efeitos.explosao(in.x, in.y, in.tipo.tamanho);
        Som.tocar("explosao");
        player.ganharEnergia(in.tipo == InimigoTipo.FRAGMENTO ? 2 : 6);
        if (in.tipo == InimigoTipo.TANQUE) tremer(10);

        if (in.tipo == InimigoTipo.ASTEROIDE) {
            asteroidesFase++;
            for (int s = -1; s <= 1; s += 2)
                adicionarInimigo(new Inimigo(in.x, in.y, in.vx * 0.8 - 0.5, s * (1 + Math.random()), dificuldade()));
        }
        // a cada 15 abates sempre cai um item, para ninguém ficar sem evoluir a arma por azar
        if (Math.random() < in.tipo.chanceDrop || abatesTotal % 15 == 0)
            powerUps.add(new PowerUp(abatesTotal % 30 == 15 ? PowerUp.Tipo.ARMA : PowerUp.Tipo.sortear(), in.x, in.y));
        verificarDesafio();
    }

    int multiplicador() {
        return 1 + Math.min(4, combo / 10);
    }

    private void derrotarChefe() {
        long bonus = 5000L * fase.numero * ciclo;
        pontos += bonus;
        efeitos.texto(chefe.x, chefe.y - chefe.tamanho / 2.0, "+" + bonus, new Color(255, 220, 90), 28);
        for (Tiro t : tiros) if (t.inimigo) t.vivo = false;   // não remove aqui: a lista pode estar sendo percorrida
        for (Inimigo i : inimigos) { i.vivo = false; efeitos.explosao(i.x, i.y, 30); }
        for (int i = 0; i < 3; i++) powerUps.add(new PowerUp(i == 0 ? PowerUp.Tipo.ARMA : PowerUp.Tipo.sortear(), chefe.x - 60, chefe.y - 60 + i * 60));
        chefeMorrendo = 0;
        if (fase.desafio == Fase.Desafio.CHEFE_RAPIDO && desafioStatus == 0) concluirDesafio();
        if (fase.numero == 2 && !Dados.desbloqueada(NaveTipo.TITA)) {
            Dados.desbloquearTita();
            mostrarAviso("NOVA NAVE DESBLOQUEADA: TITÃ!", new Color(120, 255, 120));
        }
    }

    private void concluirFase() {
        if (bonusAplicado) return;
        bonusAplicado = true;
        if (desafioStatus == 0) {
            if ((fase.desafio == Fase.Desafio.SEM_DANO && !danoNaFase)
                    || (fase.desafio == Fase.Desafio.SEM_BOMBA && !bombaNaFase)) concluirDesafio();
            else falharDesafio();
        }
        resumoFase.clear();
        resumoFase.add(new String[]{"Chefe derrotado", "+" + (5000L * fase.numero * ciclo)});
        long bonusDesafio = 2500L * fase.numero * ciclo;
        if (desafioStatus == 1) {
            pontos += bonusDesafio;
            resumoFase.add(new String[]{"Desafio: " + fase.desafio.descricao(), "+" + bonusDesafio});
        } else {
            resumoFase.add(new String[]{"Desafio: " + fase.desafio.descricao(), "falhou"});
        }
        long bonusVidas = 1000L * player.vidas * ciclo;
        pontos += bonusVidas;
        resumoFase.add(new String[]{"Vidas restantes (" + player.vidas + ")", "+" + bonusVidas});
        resumoFase.add(new String[]{"Maior combo", String.valueOf(maiorCombo)});
        trocar(Estado.FASE_CONCLUIDA);
    }

    private void verificarDesafio() {
        if (desafioStatus != 0) return;
        if (fase.desafio == Fase.Desafio.COMBO && maxComboFase >= fase.desafio.meta) concluirDesafio();
        if (fase.desafio == Fase.Desafio.ASTEROIDES && asteroidesFase >= fase.desafio.meta) concluirDesafio();
    }

    private void concluirDesafio() {
        desafioStatus = 1;
        boolean faltava = !Dados.desbloqueada(NaveTipo.FANTASMA);
        Dados.somarDesafio();
        mostrarAviso("DESAFIO CONCLUÍDO!", new Color(120, 255, 160));
        Som.tocar("powerup");
        if (faltava && Dados.desbloqueada(NaveTipo.FANTASMA))
            mostrarAviso("NOVA NAVE DESBLOQUEADA: FANTASMA!", new Color(220, 140, 255));
    }

    private void falharDesafio() {
        if (desafioStatus != 0) return;
        desafioStatus = -1;
        mostrarAviso("Desafio falhou", new Color(255, 120, 120));
    }

    private void levarDano() {
        if (player.escudo) {
            player.escudo = false;
            player.invencivel = 90;
            efeitos.anel(player.x, player.y, new Color(100, 200, 255), 80);
            Som.tocar("acerto");
            tremer(6);
            return;
        }
        player.vidas--;
        player.arma = Math.max(1, player.arma - 1);
        player.invencivel = Player.INVENCIVEL_APOS_DANO;
        danoNaFase = true;
        if (fase.desafio == Fase.Desafio.SEM_DANO) falharDesafio();
        combo = 0;
        tremer(18);
        Som.tocar("dano");
        efeitos.explosao(player.x, player.y, 40);
        if (player.vidas <= 0) {
            player.vivo = false;
            efeitos.explosao(player.x, player.y, 160);
            flashTela = 15;
            tremer(30);
            Som.tocar("bomba");
            trocar(Estado.MORRENDO);
        }
    }

    private void aplicarPowerUp(PowerUp.Tipo t) {
        Som.tocar("powerup");
        String txt = t.nome;
        switch (t) {
            case ARMA:
                if (player.arma < Player.ARMA_MAX) player.arma++;
                else { pontos += 1000; txt = "ARMA MÁXIMA +1000"; }
                break;
            case RAPIDO:  player.tiroRapido = 60 * 8; break;
            case ESCUDO:  player.escudo = true; break;
            case ENERGIA: player.ganharEnergia(50); break;
            case BOMBA:   player.bombas = Math.min(5, player.bombas + 1); break;
            case VIDA:    player.vidas = Math.min(9, player.vidas + 1); break;
        }
        efeitos.texto(player.x, player.y - 34, txt, t.cor, 16);
        efeitos.anel(player.x, player.y, t.cor, 50);
    }

    public void detonarBomba() {
        bombaNaFase = true;
        if (fase.desafio == Fase.Desafio.SEM_BOMBA) falharDesafio();
        Som.tocar("bomba");
        flashTela = 20;
        tremer(25);
        efeitos.anel(player.x, player.y, Color.WHITE, 900);
        for (Tiro t : tiros) if (t.inimigo) t.vivo = false;
        for (Inimigo in : inimigos) if (in.vivo && in.danificar(25)) matar(in);
        if (chefe != null && chefe.vivo && estado == Estado.CHEFE) danificarChefe(chefe.vidaMax * 0.05 + 15);
        player.invencivel = Math.max(player.invencivel, 60);
        mostrarAviso("BOMBA!", new Color(255, 120, 90));
    }

    // ----- utilidades usadas pelos inimigos, chefes e mísseis

    public void tiroInimigo(double x, double y, double ang, double v) {
        tiros.add(new Tiro(x, y, Math.cos(ang) * v, Math.sin(ang) * v, 1, true, Tiro.Tipo.ESFERA));
    }

    public void tiroMirado(double x, double y, double v) {
        tiroInimigo(x, y, Math.atan2(player.y - y, player.x - x), v);
    }

    public Object alvoMaisProximo(double x, double y) {
        Object melhor = null;
        double md = Double.MAX_VALUE;
        for (Inimigo i : inimigos) {
            if (!i.vivo || i.x > LARGURA + 10) continue;
            double d = Math.hypot(i.x - x, i.y - y);
            if (d < md) { md = d; melhor = i; }
        }
        if (chefe != null && chefe.vivo && !chefe.entrando) {
            double d = Math.hypot(chefe.x - x, chefe.y - y) - 80;
            if (d < md) melhor = chefe;
        }
        return melhor;
    }

    public double[] posicaoDe(Object o) {
        if (o instanceof Inimigo) return new double[]{((Inimigo) o).x, ((Inimigo) o).y};
        Chefe c = (Chefe) o;
        return new double[]{c.x, c.y};
    }

    public void tremer(double v) {
        tremor = Math.max(tremor, v);
    }

    public void mostrarAviso(String s, Color c) {
        if (avisoTimer > 0) filaAvisos.add(new Object[]{s, c});
        else {
            aviso = s;
            corAviso = c;
            avisoTimer = 120;
        }
    }

    // =================================================================== DESENHO

    @Override
    protected void paintComponent(Graphics g0) {
        super.paintComponent(g0);
        Graphics2D g = (Graphics2D) g0;
        g.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);
        g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
        fundo.desenhar(g);

        switch (estado) {
            case MENU:       Hud.menu(g, this); break;
            case SELECAO:    Hud.selecao(g, this); break;
            case COMO_JOGAR: Hud.comoJogar(g, this); break;
            case RECORDES:   Hud.recordes(g, this, -1); break;
            case NOME:       efeitos.desenhar(g); Hud.nome(g, this); break;
            case GAME_OVER:  efeitos.desenhar(g); Hud.gameOver(g, this); break;
            default:         desenharPartida(g); break;
        }

        if (avisoTimer > 0 && aviso != null) Hud.aviso(g, aviso, corAviso, avisoTimer);
        Toolkit.getDefaultToolkit().sync();
    }

    private void desenharPartida(Graphics2D g) {
        int sx = 0, sy = 0;
        if (tremor > 0.5 && !pausado) {
            sx = (int) ((Math.random() - 0.5) * tremor);
            sy = (int) ((Math.random() - 0.5) * tremor);
        }
        g.translate(sx, sy);
        for (PowerUp p : powerUps) p.desenhar(g);
        for (Inimigo i : inimigos) i.desenhar(g);
        if (chefe != null && (chefe.vivo || chefeMorrendo < 120)) chefe.desenhar(g);
        for (Tiro t : tiros) if (!t.inimigo) t.desenhar(g);
        player.desenhar(g);
        for (Tiro t : tiros) if (t.inimigo) t.desenhar(g);
        efeitos.desenhar(g);
        g.translate(-sx, -sy);

        if (flashTela > 0) {
            g.setColor(new Color(255, 255, 255, Math.min(255, flashTela * 10)));
            g.fillRect(0, 0, LARGURA, ALTURA);
        }

        if (estado != Estado.VITORIA) Hud.hud(g, this);

        switch (estado) {
            case INTRO_FASE:     Hud.introFase(g, this); break;
            case ALERTA_CHEFE:   Hud.alertaChefe(g, this); break;
            case FASE_CONCLUIDA: Hud.faseConcluida(g, this); break;
            case VITORIA:        Hud.vitoria(g, this); break;
            default: break;
        }
        if (pausado) Hud.pausa(g, this);
    }
}
