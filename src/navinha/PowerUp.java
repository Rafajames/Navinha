package navinha;

import java.awt.*;
import java.awt.image.BufferedImage;

/**
 * Item que cai dos inimigos. Se o jogador chegar perto, ele é atraído.
 */
public class PowerUp {

    public enum Tipo {
        ARMA("ARMA+", "P", new Color(255, 200, 40), 30),
        RAPIDO("TIRO RÁPIDO", "R", new Color(255, 110, 40), 18),
        ESCUDO("ESCUDO", "E", new Color(80, 190, 255), 16),
        ENERGIA("ENERGIA", "S", new Color(200, 110, 255), 16),
        BOMBA("BOMBA", "B", new Color(255, 70, 70), 10),
        VIDA("VIDA EXTRA", "+", new Color(90, 255, 120), 5);

        public final String nome, letra;
        public final Color cor;
        public final int peso;

        Tipo(String nome, String letra, Color cor, int peso) {
            this.nome = nome;
            this.letra = letra;
            this.cor = cor;
            this.peso = peso;
        }

        public static Tipo sortear() {
            int total = 0;
            for (Tipo t : values()) total += t.peso;
            int r = (int) (Math.random() * total);
            for (Tipo t : values()) {
                r -= t.peso;
                if (r < 0) return t;
            }
            return ARMA;
        }
    }

    public final Tipo tipo;
    public double x, y;
    public boolean vivo = true;
    private int idade = 0;
    private static final Font FONTE = new Font("SansSerif", Font.BOLD, 15);

    public PowerUp(Tipo tipo, double x, double y) {
        this.tipo = tipo;
        this.x = x;
        this.y = y;
    }

    public void update(Player p) {
        idade++;
        double dx = p.x - x, dy = p.y - y, d = Math.hypot(dx, dy);
        if (p.vivo && d < 140) {      // ímã
            x += dx / d * 5;
            y += dy / d * 5;
        } else {
            x -= 1.4;
            y += Math.sin(idade * 0.06) * 0.6;
        }
        if (x < -30) vivo = false;
    }

    public Rectangle getBounds() {
        return new Rectangle((int) x - 15, (int) y - 15, 30, 30);
    }

    public void desenhar(Graphics2D g) {
        BufferedImage brilho = Sprites.brilho(tipo.cor, 26);
        g.drawImage(brilho, (int) x - 26, (int) y - 26, null);
        int s = 24;
        g.setColor(new Color(20, 20, 30, 220));
        g.fillRoundRect((int) x - s / 2, (int) y - s / 2, s, s, 8, 8);
        g.setColor(tipo.cor);
        g.setStroke(new BasicStroke(2f));
        g.drawRoundRect((int) x - s / 2, (int) y - s / 2, s, s, 8, 8);
        g.setStroke(new BasicStroke(1f));
        g.setFont(FONTE);
        FontMetrics fm = g.getFontMetrics();
        g.drawString(tipo.letra, (int) x - fm.stringWidth(tipo.letra) / 2, (int) y + 6);
    }
}
