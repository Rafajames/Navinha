package navinha;

import java.awt.*;
import java.awt.image.BufferedImage;
import java.util.Random;

/**
 * Fundo espacial: céu com nebulosas na cor de cada fase e três camadas de
 * estrelas em paralaxe (as mais próximas passam mais rápido).
 */
public class Fundo {

    private static final int N = 140;
    private final double[] ex = new double[N], ey = new double[N];
    private final int[] camada = new int[N];
    private BufferedImage ceu;
    private double desloc = 0;
    private double hiper = 0;          // efeito de hiperespaço entre as fases (0 a 1)

    public Fundo() {
        Random r = new Random();
        for (int i = 0; i < N; i++) {
            ex[i] = r.nextDouble() * Jogo.LARGURA;
            ey[i] = r.nextDouble() * Jogo.ALTURA;
            camada[i] = i < 70 ? 0 : (i < 115 ? 1 : 2);
        }
        definirFase(Fase.FASES[0]);
    }

    public void definirFase(Fase f) {
        int w = Jogo.LARGURA, h = Jogo.ALTURA;
        ceu = new BufferedImage(w, h, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = ceu.createGraphics();
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g.setPaint(new GradientPaint(0, 0, f.ceuTopo, 0, h, f.ceuBase));
        g.fillRect(0, 0, w, h);
        Random r = new Random(f.numero * 31L);
        for (int i = 0; i < 9; i++) {
            Color c = i % 2 == 0 ? f.nebulosa1 : f.nebulosa2;
            int raio = 120 + r.nextInt(220);
            int cx = r.nextInt(w), cy = r.nextInt(h);
            Color forte = new Color(c.getRed(), c.getGreen(), c.getBlue(), 40 + r.nextInt(30));
            Color nada = new Color(c.getRed(), c.getGreen(), c.getBlue(), 0);
            // desenha também deslocado em ±largura para o fundo emendar sem costura ao rolar
            for (int k = -1; k <= 1; k++) {
                g.setPaint(new RadialGradientPaint(cx + k * w, cy, raio, new float[]{0f, 1f}, new Color[]{forte, nada}));
                g.fillOval(cx + k * w - raio, cy - raio, raio * 2, raio * 2);
            }
        }
        // estrelas fixas bem distantes
        for (int i = 0; i < 160; i++) {
            int a = 40 + r.nextInt(90);
            g.setColor(new Color(255, 255, 255, a));
            g.fillRect(r.nextInt(w), r.nextInt(h), 1, 1);
        }
        g.dispose();
    }

    public void setHiperespaco(double v) {
        hiper = v;
    }

    public void update() {
        desloc = (desloc + 0.25 + hiper * 6) % Jogo.LARGURA;
        for (int i = 0; i < N; i++) {
            double v = (camada[i] == 0 ? 0.6 : camada[i] == 1 ? 1.4 : 2.8) * (1 + hiper * 12);
            ex[i] -= v;
            if (ex[i] < -60) {
                ex[i] = Jogo.LARGURA + Math.random() * 40;
                ey[i] = Math.random() * Jogo.ALTURA;
            }
        }
    }

    public void desenhar(Graphics2D g) {
        int d = (int) desloc;
        g.drawImage(ceu, -d, 0, null);
        g.drawImage(ceu, Jogo.LARGURA - d, 0, null);
        for (int i = 0; i < N; i++) {
            int c = camada[i];
            int brilho = c == 0 ? 110 : c == 1 ? 180 : 255;
            g.setColor(new Color(brilho, brilho, Math.min(255, brilho + 20)));
            int s = c + 1;
            if (hiper > 0.05) {
                int len = (int) (hiper * 18 * (c + 1) * 3);
                g.fillRect((int) ex[i], (int) ey[i], len, Math.max(1, s - 1));
            } else {
                g.fillRect((int) ex[i], (int) ey[i], s, s);
            }
        }
    }
}
