package navinha;

import java.awt.*;
import java.awt.image.BufferedImage;
import java.util.List;

/**
 * Desenho do HUD (placar, vidas, energia...) e de todas as telas: menu,
 * seleção de nave, instruções, recordes, pausa, fim de fase e fim de jogo.
 */
public final class Hud {

    public static final String[] OPCOES_MENU = {"JOGAR", "COMO JOGAR", "RECORDES", "SAIR"};

    private static final Font F_TITULO = new Font("SansSerif", Font.BOLD, 76);
    private static final Font F_GRANDE = new Font("SansSerif", Font.BOLD, 44);
    private static final Font F_MEDIA = new Font("SansSerif", Font.BOLD, 26);
    private static final Font F_NORMAL = new Font("SansSerif", Font.BOLD, 18);
    private static final Font F_TEXTO = new Font("SansSerif", Font.PLAIN, 16);
    private static final Font F_PEQUENA = new Font("SansSerif", Font.BOLD, 12);
    private static final Font F_MONO = new Font("Monospaced", Font.BOLD, 26);

    private static final Color AMARELO = new Color(255, 214, 80);
    private static final Color CIANO = new Color(110, 220, 255);
    private static final Color CINZA = new Color(170, 175, 195);
    private static final Color PAINEL = new Color(8, 10, 24, 200);

    private Hud() {}

    // ------------------------------------------------------------------ utilidades

    static void centro(Graphics2D g, String s, int y, Font f, Color c) {
        texto(g, s, Jogo.LARGURA / 2 - largura(g, s, f) / 2, y, f, c);
    }

    static void centroEm(Graphics2D g, String s, int cx, int y, Font f, Color c) {
        texto(g, s, cx - largura(g, s, f) / 2, y, f, c);
    }

    static void texto(Graphics2D g, String s, int x, int y, Font f, Color c) {
        g.setFont(f);
        g.setColor(new Color(0, 0, 0, Math.min(200, c.getAlpha())));
        g.drawString(s, x + 2, y + 2);
        g.setColor(c);
        g.drawString(s, x, y);
    }

    static int largura(Graphics2D g, String s, Font f) {
        return g.getFontMetrics(f).stringWidth(s);
    }

    static void painel(Graphics2D g, int x, int y, int w, int h) {
        g.setColor(PAINEL);
        g.fillRoundRect(x, y, w, h, 18, 18);
        g.setColor(new Color(120, 150, 255, 70));
        g.setStroke(new BasicStroke(2f));
        g.drawRoundRect(x, y, w, h, 18, 18);
        g.setStroke(new BasicStroke(1f));
    }

    static void barra(Graphics2D g, int x, int y, int w, int h, double pct, Color cor) {
        g.setColor(new Color(0, 0, 0, 160));
        g.fillRect(x, y, w, h);
        g.setColor(cor);
        g.fillRect(x, y, (int) (w * Math.max(0, Math.min(1, pct))), h);
        g.setColor(new Color(255, 255, 255, 60));
        g.drawRect(x, y, w, h);
    }

    private static void titulo(Graphics2D g, String s, int y, long quadro) {
        g.setFont(F_TITULO);
        int w = g.getFontMetrics().stringWidth(s);
        int x = Jogo.LARGURA / 2 - w / 2;
        g.setColor(new Color(255, 80, 60, 90));
        for (int i = 4; i >= 1; i--) g.drawString(s, x + i * 2, y + i * 2);
        float desloc = (quadro % 240) / 240f * 300;
        g.setPaint(new GradientPaint(x + desloc - 300, 0, new Color(255, 230, 120), x + desloc, 0, new Color(255, 110, 70), true));
        g.drawString(s, x, y);
        g.setPaint(null);
    }

    private static boolean pisca(long quadro, int periodo) {
        return (quadro / periodo) % 2 == 0;
    }

    // ------------------------------------------------------------------ HUD da partida

    static void hud(Graphics2D g, Jogo j) {
        Player p = j.player;
        g.setColor(new Color(4, 6, 18, 185));
        g.fillRect(0, 0, Jogo.LARGURA, 48);
        g.setColor(new Color(120, 150, 255, 60));
        g.drawLine(0, 48, Jogo.LARGURA, 48);

        // pontos
        texto(g, "PONTOS", 14, 16, F_PEQUENA, CINZA);
        texto(g, String.format("%08d", j.pontos), 14, 40, F_MONO, AMARELO);

        // vidas
        texto(g, "VIDAS", 186, 16, F_PEQUENA, CINZA);
        BufferedImage mini = p.tipo.imagem(24);
        int nv = Math.min(p.vidas, 5);
        for (int i = 0; i < nv; i++) g.drawImage(mini, 186 + i * 22, 20, null);
        if (p.vidas > 5) texto(g, "+" + (p.vidas - 5), 186 + 5 * 22, 38, F_NORMAL, Color.WHITE);

        // bombas
        texto(g, "BOMBAS [C]", 330, 16, F_PEQUENA, CINZA);
        for (int i = 0; i < p.bombas; i++) {
            g.setColor(new Color(255, 80, 70));
            g.fillOval(330 + i * 18, 23, 14, 14);
            g.setColor(new Color(255, 200, 180));
            g.fillOval(333 + i * 18, 26, 4, 4);
        }

        // arma
        texto(g, "ARMA", 440, 16, F_PEQUENA, CINZA);
        for (int i = 0; i < Player.ARMA_MAX; i++) {
            g.setColor(i < p.arma ? AMARELO : new Color(60, 60, 80));
            g.fillRect(440 + i * 13, 24, 10, 14);
        }
        if (p.tiroRapido > 0) {
            texto(g, "RÁPIDO", 510, 16, F_PEQUENA, new Color(255, 140, 60));
            barra(g, 510, 26, 50, 8, p.tiroRapido / 480.0, new Color(255, 140, 60));
        }

        // energia do especial
        boolean pronto = p.energia >= 100;
        texto(g, p.tipo.especial.toUpperCase() + " [X]", 580, 16, F_PEQUENA, pronto ? p.tipo.cor : CINZA);
        Color corEn = pronto ? (pisca(j.quadro, 8) ? Color.WHITE : p.tipo.cor) : p.tipo.cor.darker();
        barra(g, 580, 24, 170, 14, p.energia / 100.0, corEn);
        if (p.especialAtivo > 0) texto(g, "ATIVO!", 760, 37, F_PEQUENA, p.tipo.cor);

        // fase e progresso
        String f = "FASE " + j.fase.numero + (j.ciclo > 1 ? "  ·  CICLO " + j.ciclo : "");
        texto(g, f, 820, 16, F_PEQUENA, CINZA);
        if (j.estado == Jogo.Estado.CHEFE || j.estado == Jogo.Estado.ALERTA_CHEFE) {
            texto(g, "CHEFE!", 820, 40, F_NORMAL, new Color(255, 90, 90));
        } else {
            barra(g, 820, 24, 190, 14, j.abatesFase / (double) j.fase.meta, CIANO);
            centroEm(g, Math.min(j.abatesFase, j.fase.meta) + " / " + j.fase.meta, 915, 36, F_PEQUENA, Color.WHITE);
        }

        // combo
        if (j.combo >= 3) {
            Color c = j.multiplicador() > 1 ? AMARELO : Color.WHITE;
            texto(g, "COMBO " + j.combo, 14, 76, F_NORMAL, c);
            if (j.multiplicador() > 1) texto(g, "x" + j.multiplicador(), 130, 76, F_MEDIA, new Color(255, 130, 60));
        }

        // desafio
        String d = "DESAFIO: " + j.fase.desafio.descricao();
        if (j.fase.desafio == Fase.Desafio.COMBO) d += "  (" + Math.min(j.maxComboFase, j.fase.desafio.meta) + "/" + j.fase.desafio.meta + ")";
        if (j.fase.desafio == Fase.Desafio.ASTEROIDES) d += "  (" + Math.min(j.asteroidesFase, j.fase.desafio.meta) + "/" + j.fase.desafio.meta + ")";
        if (j.fase.desafio == Fase.Desafio.CHEFE_RAPIDO && j.chefe != null && j.chefe.vivo)
            d += "  (" + Math.max(0, j.fase.desafio.meta - j.chefe.tempoLuta / 60) + "s)";
        Color cd = j.desafioStatus == 1 ? new Color(120, 255, 150) : j.desafioStatus == -1 ? new Color(255, 110, 110, 170) : new Color(220, 220, 240, 200);
        if (j.desafioStatus == 1) d += "  ✔";
        if (j.desafioStatus == -1) d += "  ✘";
        texto(g, d, 14, Jogo.ALTURA - 12, F_PEQUENA, cd);

        // vida do chefe
        Chefe c = j.chefe;
        if (c != null && c.vivo && j.estado == Jogo.Estado.CHEFE) {
            int w = 560, x = Jogo.LARGURA / 2 - w / 2, y = Jogo.ALTURA - 44;
            centro(g, c.nome.toUpperCase() + (c.entrando ? "" : "  ·  " + c.ataqueAtual()), y - 6, F_NORMAL,
                    c.furia() ? new Color(255, 110, 110) : Color.WHITE);
            barra(g, x, y, w, 14, c.vida / c.vidaMax, c.furia() ? new Color(255, 50, 50) : new Color(255, 120, 60));
        }
    }

    static void aviso(Graphics2D g, String s, Color c, int t) {
        int a = Math.min(255, t * 10);
        float escala = t > 110 ? 1 + (t - 110) * 0.04f : 1f;
        Font f = F_MEDIA.deriveFont(26f * escala);
        centro(g, s, 150, f, new Color(c.getRed(), c.getGreen(), c.getBlue(), a));
    }

    static void introFase(Graphics2D g, Jogo j) {
        int t = j.timer;
        int a = t < 20 ? t * 12 : t > 170 ? Math.max(0, (200 - t) * 8) : 240;
        Color branco = new Color(255, 255, 255, a);
        centro(g, "FASE " + j.fase.numero + (j.ciclo > 1 ? "  ·  CICLO " + j.ciclo : ""), 300, F_GRANDE, new Color(255, 214, 80, a));
        centro(g, j.fase.nome, 345, F_MEDIA, branco);
        centro(g, "Destrua " + j.fase.meta + " inimigos para enfrentar o chefe", 395, F_TEXTO, new Color(200, 210, 240, a));
        centro(g, "Desafio bônus: " + j.fase.desafio.descricao(), 425, F_NORMAL, new Color(120, 255, 170, a));
    }

    static void alertaChefe(Graphics2D g, Jogo j) {
        if (pisca(j.timer, 15)) {
            g.setColor(new Color(255, 0, 0, 40));
            g.fillRect(0, 0, Jogo.LARGURA, Jogo.ALTURA);
            centro(g, "⚠  ALERTA  ⚠", 330, F_GRANDE, new Color(255, 70, 70));
        }
        centro(g, j.fase.chefe.nome.toUpperCase() + " SE APROXIMA", 380, F_MEDIA, Color.WHITE);
    }

    static void faseConcluida(Graphics2D g, Jogo j) {
        int w = 560, h = 320, x = Jogo.LARGURA / 2 - w / 2, y = 190;
        painel(g, x, y, w, h);
        centro(g, "FASE " + j.fase.numero + " CONCLUÍDA!", y + 55, F_GRANDE, AMARELO);
        int yy = y + 110;
        List<String[]> r = j.resumoFase;
        for (int i = 0; i < r.size(); i++) {
            if (j.timer < 30 + i * 25) break;
            String[] l = r.get(i);
            texto(g, l[0], x + 40, yy, F_TEXTO, Color.WHITE);
            Color cv = "falhou".equals(l[1]) ? new Color(255, 110, 110) : new Color(120, 255, 150);
            texto(g, l[1], x + w - 40 - largura(g, l[1], F_NORMAL), yy, F_NORMAL, cv);
            yy += 34;
        }
        if (j.timer > 60) {
            texto(g, "Total: " + String.format("%,d", j.pontos), x + 40, y + h - 30, F_NORMAL, AMARELO);
            String prox = "ENTER para continuar";
            texto(g, prox, x + w - 40 - largura(g, prox, F_PEQUENA), y + h - 30, F_PEQUENA, CINZA);
        }
    }

    static void vitoria(Graphics2D g, Jogo j) {
        g.setColor(new Color(0, 0, 0, 120));
        g.fillRect(0, 0, Jogo.LARGURA, Jogo.ALTURA);
        titulo(g, "VITÓRIA!", 260, j.quadro);
        centro(g, "Você derrotou o Imperador Zorg e salvou a galáxia!", 320, F_NORMAL, Color.WHITE);
        centro(g, "Pontuação: " + String.format("%,d", j.pontos), 370, F_MEDIA, AMARELO);
        if (j.timer > 60) {
            painel(g, 262, 420, 500, 120);
            centro(g, "ENTER  —  Continuar no Modo Infinito", 465, F_NORMAL, new Color(120, 255, 170));
            centro(g, "(as fases recomeçam, mais difíceis e valendo mais pontos)", 490, F_PEQUENA, CINZA);
            centro(g, "ESC  —  Encerrar e salvar recorde", 522, F_NORMAL, Color.WHITE);
        }
    }

    static void pausa(Graphics2D g, Jogo j) {
        g.setColor(new Color(0, 0, 0, 170));
        g.fillRect(0, 0, Jogo.LARGURA, Jogo.ALTURA);
        centro(g, "PAUSADO", 230, F_GRANDE, Color.WHITE);
        String[] op = {"Continuar", "Recomeçar", "Menu principal"};
        for (int i = 0; i < op.length; i++) {
            boolean sel = i == j.opcaoPausa;
            centro(g, (sel ? "▶  " : "") + op[i] + (sel ? "  ◀" : ""), 300 + i * 42, F_MEDIA, sel ? AMARELO : CINZA);
        }
        controles(g, 450);
    }

    private static void controles(Graphics2D g, int y) {
        String[][] c = {
                {"Setas / WASD", "mover"},
                {"ESPAÇO (segure)", "atirar"},
                {"X", "poder especial (quando a barra encher)"},
                {"C", "bomba: limpa a tela"},
                {"P / ESC", "pausar"},
                {"M", "liga/desliga o som"},
        };
        for (int i = 0; i < c.length; i++) {
            texto(g, c[i][0], 320, y + i * 26, F_NORMAL, CIANO);
            texto(g, c[i][1], 520, y + i * 26, F_TEXTO, Color.WHITE);
        }
    }

    // ------------------------------------------------------------------ telas

    static void menu(Graphics2D g, Jogo j) {
        // naves desfilando ao fundo
        BufferedImage nave = NaveTipo.FALCAO.imagem(90);
        double ny = 330 + Math.sin(j.quadro * 0.03) * 20;
        g.drawImage(nave, 140, (int) ny, null);
        BufferedImage ufo = Sprites.escalada("/res/Nave_Inimiga.png", 70, 70);
        for (int i = 0; i < 3; i++) {
            double uy = 280 + i * 70 + Math.sin(j.quadro * 0.04 + i) * 15;
            g.drawImage(ufo, 790 + (i % 2) * 50, (int) uy, null);
        }

        titulo(g, "NAVINHA", 170, j.quadro);
        centro(g, "E S P A C I A L", 215, F_MEDIA, CIANO);

        for (int i = 0; i < OPCOES_MENU.length; i++) {
            boolean sel = i == j.opcaoMenu;
            String s = sel ? "▶  " + OPCOES_MENU[i] + "  ◀" : OPCOES_MENU[i];
            centro(g, s, 340 + i * 54, sel ? F_MEDIA.deriveFont(30f) : F_MEDIA, sel ? AMARELO : CINZA);
        }
        if (!Dados.getRecordes().isEmpty()) {
            Dados.Recorde r = Dados.getRecordes().get(0);
            centro(g, "RECORDE: " + r.nome + "  —  " + String.format("%,d", r.pontos), 600, F_NORMAL, new Color(255, 170, 80));
        }
        centro(g, "↑ ↓ para escolher  ·  ENTER para confirmar  ·  M: som", 700, F_PEQUENA, CINZA);
        centro(g, "Jamerson Rafael · 2025–2026", 740, F_PEQUENA, new Color(120, 125, 150));
    }

    static void selecao(Graphics2D g, Jogo j) {
        centro(g, "ESCOLHA SUA NAVE", 90, F_GRANDE, Color.WHITE);
        NaveTipo[] naves = NaveTipo.values();
        int cw = 224, ch = 470, gap = 14;
        int x0 = Jogo.LARGURA / 2 - (naves.length * cw + (naves.length - 1) * gap) / 2;
        for (int i = 0; i < naves.length; i++) {
            NaveTipo n = naves[i];
            boolean sel = i == j.naveSelecionada;
            boolean livre = Dados.desbloqueada(n);
            int x = x0 + i * (cw + gap), y = sel ? 130 : 145;
            painel(g, x, y, cw, ch);
            if (sel) {
                g.setColor(n.cor);
                g.setStroke(new BasicStroke(3f));
                g.drawRoundRect(x, y, cw, ch, 18, 18);
                g.setStroke(new BasicStroke(1f));
            }
            int cx = x + cw / 2;
            BufferedImage img = n.imagem(110);
            if (!livre) img = Sprites.recolorir(img, 0f, 1f, 0f, 0f, 0.25f);
            double bob = sel ? Math.sin(j.quadro * 0.06) * 6 : 0;
            g.drawImage(img, cx - 55, y + 24 + (int) bob, null);

            centroEm(g, n.nome.toUpperCase(), cx, y + 170, F_MEDIA, livre ? n.cor : CINZA);
            if (!livre) {
                centroEm(g, "BLOQUEADA", cx, y + 220, F_NORMAL, new Color(255, 120, 120));
                quebrar(g, "Para liberar: " + n.condicao, x + 18, y + 255, cw - 36, F_TEXTO, CINZA);
                if (n == NaveTipo.FANTASMA)
                    centroEm(g, "Concluídos: " + Dados.desafiosConcluidos() + "/3", cx, y + 330, F_NORMAL, AMARELO);
                continue;
            }
            quebrar(g, n.descricao, x + 18, y + 200, cw - 36, F_TEXTO, Color.WHITE);
            int by = y + 258;
            String[] rot = {"Velocidade", "Resistência", "Poder de fogo"};
            double[] val = {n.barraVelocidade(), n.barraResistencia(), n.barraPoder()};
            for (int k = 0; k < 3; k++) {
                texto(g, rot[k], x + 18, by + k * 38, F_PEQUENA, CINZA);
                barra(g, x + 18, by + 6 + k * 38, cw - 36, 10, val[k], n.cor);
            }
            texto(g, "ESPECIAL: " + n.especial, x + 18, y + 386, F_PEQUENA, AMARELO);
            quebrar(g, n.descEspecial, x + 18, y + 408, cw - 36, F_PEQUENA, Color.WHITE);
        }
        centro(g, "← → escolher  ·  ENTER decolar  ·  ESC voltar", 680, F_NORMAL, CINZA);
    }

    private static void quebrar(Graphics2D g, String s, int x, int y, int w, Font f, Color c) {
        String[] palavras = s.split(" ");
        StringBuilder linha = new StringBuilder();
        int yy = y;
        for (String p : palavras) {
            String teste = linha.length() == 0 ? p : linha + " " + p;
            if (largura(g, teste, f) > w && linha.length() > 0) {
                texto(g, linha.toString(), x, yy, f, c);
                yy += f.getSize() + 5;
                linha = new StringBuilder(p);
            } else {
                linha = new StringBuilder(teste);
            }
        }
        if (linha.length() > 0) texto(g, linha.toString(), x, yy, f, c);
    }

    static void comoJogar(Graphics2D g, Jogo j) {
        centro(g, "COMO JOGAR", 80, F_GRANDE, Color.WHITE);
        painel(g, 60, 110, 440, 560);
        painel(g, 524, 110, 440, 560);

        texto(g, "CONTROLES", 86, 148, F_NORMAL, AMARELO);
        String[][] c = {{"Setas / WASD", "mover"}, {"ESPAÇO", "atirar (segure)"}, {"X", "poder especial"},
                {"C", "bomba"}, {"P / ESC", "pausar"}, {"M", "som"}};
        for (int i = 0; i < c.length; i++) {
            texto(g, c[i][0], 86, 182 + i * 28, F_NORMAL, CIANO);
            texto(g, c[i][1], 250, 182 + i * 28, F_TEXTO, Color.WHITE);
        }
        texto(g, "REGRAS", 86, 380, F_NORMAL, AMARELO);
        String[] regras = {
                "• Cada fase tem uma meta de abates; ao",
                "  cumprir, o chefe aparece.",
                "• Abates seguidos formam COMBO e",
                "  multiplicam os pontos (até x5).",
                "• Destruir inimigos enche a barra do",
                "  ESPECIAL da sua nave.",
                "• Levar dano tira 1 vida e 1 nível de arma.",
                "• Cumpra o DESAFIO da fase para ganhar",
                "  bônus e desbloquear naves.",
        };
        for (int i = 0; i < regras.length; i++) texto(g, regras[i], 86, 412 + i * 24, F_TEXTO, Color.WHITE);

        texto(g, "POWER-UPS", 550, 148, F_NORMAL, AMARELO);
        String[] desc = {"Aumenta o nível da arma (até 5)", "Dobra a cadência por 8s", "Aguenta 1 golpe",
                "+50% de energia do especial", "+1 bomba", "+1 vida"};
        PowerUp.Tipo[] tipos = PowerUp.Tipo.values();
        for (int i = 0; i < tipos.length; i++) {
            PowerUp p = new PowerUp(tipos[i], 570, 178 + i * 40);
            p.desenhar(g);
            texto(g, tipos[i].nome, 600, 176 + i * 40, F_NORMAL, tipos[i].cor);
            texto(g, desc[i], 600, 194 + i * 40, F_PEQUENA, CINZA);
        }
        texto(g, "INIMIGOS", 550, 440, F_NORMAL, AMARELO);
        InimigoTipo[] it = {InimigoTipo.BASICO, InimigoTipo.ZIGUE, InimigoTipo.ATIRADOR,
                InimigoTipo.KAMIKAZE, InimigoTipo.TANQUE, InimigoTipo.ASTEROIDE};
        for (int i = 0; i < it.length; i++) {
            int col = i % 2, lin = i / 2;
            Inimigo in = new Inimigo(it[i], 575 + col * 200, 480 + lin * 62, 1);
            in.desenhar(g);
            texto(g, it[i].nome, 610 + col * 200, 486 + lin * 62, F_PEQUENA, Color.WHITE);
        }
        centro(g, "ESC para voltar", 720, F_NORMAL, CINZA);
    }

    static void recordes(Graphics2D g, Jogo j, int destaque) {
        centro(g, "RECORDES", 90, F_GRANDE, Color.WHITE);
        tabelaRecordes(g, 140, destaque, j.quadro);
        centro(g, "ESC para voltar", 720, F_NORMAL, CINZA);
    }

    private static void tabelaRecordes(Graphics2D g, int y, int destaque, long quadro) {
        int w = 640, x = Jogo.LARGURA / 2 - w / 2;
        painel(g, x, y, w, 470);
        texto(g, "#", x + 30, y + 40, F_PEQUENA, CINZA);
        texto(g, "PILOTO", x + 80, y + 40, F_PEQUENA, CINZA);
        texto(g, "NAVE", x + 300, y + 40, F_PEQUENA, CINZA);
        texto(g, "FASE", x + 410, y + 40, F_PEQUENA, CINZA);
        texto(g, "PONTOS", x + w - 30 - largura(g, "PONTOS", F_PEQUENA), y + 40, F_PEQUENA, CINZA);
        List<Dados.Recorde> rs = Dados.getRecordes();
        if (rs.isEmpty()) centroEm(g, "Nenhum recorde ainda. Seja o primeiro!", Jogo.LARGURA / 2, y + 120, F_NORMAL, CINZA);
        Color[] medalhas = {new Color(255, 205, 60), new Color(200, 210, 225), new Color(215, 140, 80)};
        for (int i = 0; i < rs.size(); i++) {
            Dados.Recorde r = rs.get(i);
            int yy = y + 80 + i * 38;
            boolean dest = i == destaque;
            if (dest) {
                g.setColor(new Color(255, 214, 80, pisca(quadro, 20) ? 50 : 25));
                g.fillRect(x + 10, yy - 24, w - 20, 34);
            }
            Color c = i < 3 ? medalhas[i] : Color.WHITE;
            texto(g, (i + 1) + "º", x + 26, yy, F_NORMAL, c);
            texto(g, r.nome, x + 80, yy, F_NORMAL, dest ? AMARELO : Color.WHITE);
            texto(g, r.nave, x + 300, yy, F_TEXTO, CINZA);
            texto(g, r.fase, x + 410, yy, F_TEXTO, CINZA);
            String pts = String.format("%,d", r.pontos);
            texto(g, pts, x + w - 30 - largura(g, pts, F_NORMAL), yy, F_NORMAL, c);
        }
    }

    static void nome(Graphics2D g, Jogo j) {
        centro(g, "NOVO RECORDE!", 230, F_GRANDE, AMARELO);
        centro(g, String.format("%,d pontos", j.pontos), 280, F_MEDIA, Color.WHITE);
        centro(g, "Digite seu nome:", 360, F_NORMAL, CINZA);
        painel(g, 312, 380, 400, 64);
        String cursor = pisca(j.quadro, 20) ? "_" : " ";
        centro(g, j.nomeDigitado + cursor, 424, F_MEDIA.deriveFont(30f), Color.WHITE);
        centro(g, "ENTER para confirmar", 490, F_PEQUENA, CINZA);
    }

    static void gameOver(Graphics2D g, Jogo j) {
        boolean venceu = "Venceu!".equals(j.faseRecorde);
        centro(g, venceu ? "MISSÃO CUMPRIDA" : "FIM DE JOGO", 70, F_GRANDE, venceu ? AMARELO : new Color(255, 80, 80));
        Player p = j.player;
        long tiros = Math.max(1, p.tirosDisparados);
        String linha = String.format("%,d pts   ·   Fase %s   ·   %d abates   ·   Precisão %d%%   ·   Combo máx. %d",
                j.pontos, j.faseRecorde, j.abatesTotal, Math.min(100, j.acertos * 100 / tiros), j.maiorCombo);
        centro(g, linha, 110, F_NORMAL, Color.WHITE);
        tabelaRecordes(g, 135, j.posicaoRecorde, j.quadro);
        if (j.timer > 40) centro(g, "ENTER  menu      ·      R  jogar de novo com " + p.tipo.nome, 660, F_NORMAL, CINZA);
    }
}
