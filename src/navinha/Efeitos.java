package navinha;

import java.awt.*;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

/**
 * Partículas, ondas de choque e textos flutuantes ("+250", "COMBO x3"...).
 */
public class Efeitos {

    private static class Particula {
        double x, y, vx, vy, tamanho;
        int vida, vidaMax;
        Color cor;
        boolean anel;
        double raioMax;
    }

    private static class Texto {
        double x, y;
        String s;
        Color cor;
        int vida;
        float tamanho;
    }

    private final List<Particula> parts = new ArrayList<>();
    private final List<Texto> textos = new ArrayList<>();
    private static final int MAX = 1600;

    public void explosao(double x, double y, int tamanho) {
        int n = Math.min(70, 14 + tamanho / 2);
        Color[] cores = {new Color(255, 240, 160), new Color(255, 180, 60), new Color(255, 100, 40), new Color(200, 60, 60)};
        for (int i = 0; i < n; i++) {
            double a = Math.random() * Math.PI * 2, v = Math.random() * (2 + tamanho / 18.0);
            add(x, y, Math.cos(a) * v, Math.sin(a) * v, 2 + Math.random() * 4, 25 + (int) (Math.random() * 30),
                    cores[(int) (Math.random() * cores.length)]);
        }
        anel(x, y, new Color(255, 200, 120), tamanho);
    }

    public void anel(double x, double y, Color cor, double raioMax) {
        if (parts.size() > MAX) return;
        Particula p = new Particula();
        p.x = x;
        p.y = y;
        p.anel = true;
        p.raioMax = raioMax;
        p.vida = p.vidaMax = 22;
        p.cor = cor;
        parts.add(p);
    }

    public void faisca(double x, double y, Color cor) {
        add(x, y, 1 + Math.random() * 1.5, (Math.random() - 0.5) * 1.5, 2 + Math.random() * 2, 12 + (int) (Math.random() * 10), cor);
    }

    public void fumaca(double x, double y) {
        add(x, y, (Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.4, 3, 18, new Color(200, 200, 210, 160));
    }

    public void acerto(double x, double y, Color cor) {
        for (int i = 0; i < 4; i++) {
            double a = Math.PI + (Math.random() - 0.5) * 1.6, v = 1 + Math.random() * 3;
            add(x, y, Math.cos(a) * v, Math.sin(a) * v, 2, 10, cor);
        }
    }

    public void texto(double x, double y, String s, Color cor, float tamanho) {
        Texto t = new Texto();
        t.x = x;
        t.y = y;
        t.s = s;
        t.cor = cor;
        t.vida = 55;
        t.tamanho = tamanho;
        textos.add(t);
    }

    private void add(double x, double y, double vx, double vy, double tam, int vida, Color cor) {
        if (parts.size() > MAX) return;
        Particula p = new Particula();
        p.x = x;
        p.y = y;
        p.vx = vx;
        p.vy = vy;
        p.tamanho = tam;
        p.vida = p.vidaMax = vida;
        p.cor = cor;
        parts.add(p);
    }

    public void update() {
        Iterator<Particula> it = parts.iterator();
        while (it.hasNext()) {
            Particula p = it.next();
            p.x += p.vx;
            p.y += p.vy;
            p.vx *= 0.96;
            p.vy *= 0.96;
            if (--p.vida <= 0) it.remove();
        }
        Iterator<Texto> it2 = textos.iterator();
        while (it2.hasNext()) {
            Texto t = it2.next();
            t.y -= 0.7;
            if (--t.vida <= 0) it2.remove();
        }
    }

    public void desenhar(Graphics2D g) {
        Composite orig = g.getComposite();
        for (Particula p : parts) {
            float a = Math.max(0, Math.min(1, p.vida / (float) p.vidaMax));
            g.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, a));
            g.setColor(p.cor);
            if (p.anel) {
                double r = p.raioMax * (1 - a);
                g.setStroke(new BasicStroke(1 + 4 * a));
                g.drawOval((int) (p.x - r), (int) (p.y - r), (int) (r * 2), (int) (r * 2));
            } else {
                int s = (int) Math.max(1, p.tamanho * (0.5 + a * 0.5));
                g.fillRect((int) p.x - s / 2, (int) p.y - s / 2, s, s);
            }
        }
        g.setStroke(new BasicStroke(1f));
        for (Texto t : textos) {
            float a = Math.min(1, t.vida / 20f);
            g.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, a));
            g.setFont(new Font("SansSerif", Font.BOLD, (int) t.tamanho));
            int w = g.getFontMetrics().stringWidth(t.s);
            g.setColor(Color.BLACK);
            g.drawString(t.s, (int) t.x - w / 2 + 2, (int) t.y + 2);
            g.setColor(t.cor);
            g.drawString(t.s, (int) t.x - w / 2, (int) t.y);
        }
        g.setComposite(orig);
    }

    public void limpar() {
        parts.clear();
        textos.clear();
    }
}
