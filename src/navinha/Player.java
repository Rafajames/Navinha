package navinha;

import java.awt.*;
import java.awt.event.KeyEvent;
import java.awt.image.BufferedImage;

/**
 * A nave do jogador. As coordenadas x,y são o CENTRO da nave.
 */
public class Player {

    public static final int ARMA_MAX = 5;
    public static final int INVENCIVEL_APOS_DANO = 150;   // 2,5 s

    public final NaveTipo tipo;
    public double x, y;
    public int vidas;
    public int arma = 1;
    public int bombas = 2;
    public double energia = 0;           // 0 a 100: enche o poder especial
    public boolean escudo = false;       // power-up de escudo (aguenta 1 golpe)
    public int invencivel = 0;
    public int tiroRapido = 0;           // quadros restantes do power-up
    public int especialAtivo = 0;        // quadros restantes do especial
    public boolean vivo = true;
    public int tirosDisparados = 0;

    private int recarga = 0;
    private int missilFila = 0;
    private int quadro = 0;
    private final BufferedImage img;

    public Player(NaveTipo tipo) {
        this.tipo = tipo;
        this.vidas = tipo.vidas;
        this.x = 140;
        this.y = Jogo.ALTURA / 2.0;
        this.img = tipo.imagem();
        if (tipo == NaveTipo.TITA) escudo = true;   // a Titã já começa blindada
    }

    public void update(Jogo jogo, Input in, boolean podeAtirar) {
        quadro++;
        if (!vivo) return;

        double dx = 0, dy = 0;
        if (in.segurando(KeyEvent.VK_LEFT, KeyEvent.VK_A)) dx -= 1;
        if (in.segurando(KeyEvent.VK_RIGHT, KeyEvent.VK_D)) dx += 1;
        if (in.segurando(KeyEvent.VK_UP, KeyEvent.VK_W)) dy -= 1;
        if (in.segurando(KeyEvent.VK_DOWN, KeyEvent.VK_S)) dy += 1;
        if (dx != 0 && dy != 0) { dx *= 0.7071; dy *= 0.7071; }   // diagonal sem ficar mais rápida
        double vel = tipo.velocidade * (turbo() ? 1.7 : 1.0);
        x += dx * vel;
        y += dy * vel;
        int meio = tipo.tamanho / 2;
        x = Math.max(meio, Math.min(Jogo.LARGURA - meio, x));
        y = Math.max(52 + meio * 0.5, Math.min(Jogo.ALTURA - meio, y));

        if (invencivel > 0) invencivel--;
        if (tiroRapido > 0) tiroRapido--;
        if (especialAtivo > 0) especialAtivo--;
        if (recarga > 0) recarga--;

        if (!podeAtirar) return;

        // tiro: segure ESPAÇO (ou Z / J)
        boolean atirando = in.segurando(KeyEvent.VK_SPACE, KeyEvent.VK_Z, KeyEvent.VK_J) || turbo();
        if (atirando && recarga <= 0) {
            atirar(jogo);
            int cad = tipo.cadencia;
            if (tiroRapido > 0) cad = Math.max(3, cad / 2);
            if (turbo()) cad = Math.max(3, cad / 2);
            recarga = cad;
        }

        // especial: X (ou K / SHIFT)
        if (in.apertou(KeyEvent.VK_X, KeyEvent.VK_K, KeyEvent.VK_SHIFT) && energia >= 100) {
            ativarEspecial(jogo);
        }

        // bomba: C (ou L / B)
        if (in.apertou(KeyEvent.VK_C, KeyEvent.VK_L, KeyEvent.VK_B) && bombas > 0) {
            bombas--;
            jogo.detonarBomba();
        }

        if (missilFila > 0 && quadro % 5 == 0) {
            missilFila--;
            double ang = (missilFila % 2 == 0 ? -1 : 1) * (0.6 + Math.random() * 0.6);
            jogo.tiros.add(new Tiro(x, y, Math.cos(ang) * 4, Math.sin(ang) * 4, 3 * tipo.dano, false, Tiro.Tipo.MISSIL));
        }
    }

    private void atirar(Jogo jogo) {
        double bx = x + tipo.tamanho / 2.0 - 4, by = y;
        double v = 12;
        double[][] padrao;   // {deslocamento y, ângulo em graus}
        switch (arma) {
            case 1:  padrao = new double[][]{{0, 0}}; break;
            case 2:  padrao = new double[][]{{-7, 0}, {7, 0}}; break;
            case 3:  padrao = new double[][]{{0, 0}, {-4, -8}, {4, 8}}; break;
            case 4:  padrao = new double[][]{{-6, 0}, {6, 0}, {-6, -11}, {6, 11}}; break;
            default: padrao = new double[][]{{0, 0}, {-6, -5}, {6, 5}, {-8, -15}, {8, 15}}; break;
        }
        for (double[] p : padrao) {
            double a = Math.toRadians(p[1]);
            Tiro t = new Tiro(bx, by + p[0], Math.cos(a) * v, Math.sin(a) * v, tipo.dano, false, Tiro.Tipo.NORMAL);
            if (tipo.perfurante) t.perfuracoes = 2;
            jogo.tiros.add(t);
            tirosDisparados++;
        }
        if (quadro % 2 == 0 || tipo.cadencia > 9) Som.tocar("tiro");
    }

    private void ativarEspecial(Jogo jogo) {
        energia = 0;
        jogo.estatEspeciais++;
        Som.tocar("especial");
        switch (tipo) {
            case FALCAO:   missilFila = 12; especialAtivo = 60; break;
            case COMETA:   especialAtivo = 240; break;
            case TITA:     especialAtivo = 300; break;
            case FANTASMA: especialAtivo = 180; break;
        }
        jogo.efeitos.anel(x, y, tipo.cor, 90);
        jogo.mostrarAviso(tipo.especial.toUpperCase() + "!", tipo.cor);
    }

    public boolean turbo() { return tipo == NaveTipo.COMETA && especialAtivo > 0; }
    public boolean escudoPlasma() { return tipo == NaveTipo.TITA && especialAtivo > 0; }
    public boolean laser() { return tipo == NaveTipo.FANTASMA && especialAtivo > 0; }

    /** Pode levar dano agora? */
    public boolean vulneravel() {
        return vivo && invencivel <= 0 && !turbo() && !escudoPlasma();
    }

    public void ganharEnergia(double v) {
        energia = Math.min(100, energia + v);
    }

    /** Hitbox menor que o desenho, como nos jogos de navinha clássicos. */
    public Rectangle getBounds() {
        int w = (int) (tipo.tamanho * 0.55), h = (int) (tipo.tamanho * 0.4);
        return new Rectangle((int) x - w / 2, (int) y - h / 2, w, h);
    }

    public Rectangle getBoundsLaser() {
        return new Rectangle((int) x, (int) y - 14, Jogo.LARGURA, 28);
    }

    public int raioEscudoPlasma() {
        return tipo.tamanho;
    }

    public void desenhar(Graphics2D g) {
        if (!vivo) return;
        // pisca enquanto está invencível depois de levar dano
        if (invencivel > 0 && (invencivel / 4) % 2 == 0) return;

        int meio = tipo.tamanho / 2;

        if (laser()) {
            int alt = 22 + (int) (Math.sin(quadro * 0.6) * 4);
            g.setPaint(new GradientPaint(0, (float) y - alt, new Color(220, 120, 255, 0),
                    0, (float) y, new Color(240, 200, 255, 230), true));
            g.fillRect((int) x + meio - 6, (int) y - alt, Jogo.LARGURA, alt * 2);
            g.setColor(Color.WHITE);
            g.fillRect((int) x + meio - 6, (int) y - 4, Jogo.LARGURA, 8);
        }

        if (turbo()) {
            for (int i = 1; i <= 3; i++) {
                Composite c = g.getComposite();
                g.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, 0.25f / i));
                g.drawImage(img, (int) x - meio - i * 14, (int) y - meio, null);
                g.setComposite(c);
            }
        }

        g.drawImage(img, (int) x - meio, (int) y - meio, null);

        if (escudo) {
            float a = 0.35f + 0.15f * (float) Math.sin(quadro * 0.1);
            g.setColor(new Color(0.4f, 0.8f, 1f, a));
            g.setStroke(new BasicStroke(3f));
            g.drawOval((int) x - meio - 6, (int) y - meio - 6, tipo.tamanho + 12, tipo.tamanho + 12);
        }

        if (escudoPlasma()) {
            int r = raioEscudoPlasma();
            g.setColor(new Color(120, 255, 140, 60));
            g.fillOval((int) x - r, (int) y - r, r * 2, r * 2);
            g.setColor(new Color(160, 255, 170, 200));
            g.setStroke(new BasicStroke(3f));
            g.drawOval((int) x - r, (int) y - r, r * 2, r * 2);
            for (int i = 0; i < 6; i++) {
                double a = quadro * 0.05 + i * Math.PI / 3;
                g.fillOval((int) (x + Math.cos(a) * r) - 4, (int) (y + Math.sin(a) * r) - 4, 8, 8);
            }
        }
        g.setStroke(new BasicStroke(1f));
    }

    public BufferedImage getImagem() {
        return img;
    }
}
