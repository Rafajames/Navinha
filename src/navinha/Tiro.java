package navinha;

import java.awt.*;
import java.awt.geom.AffineTransform;
import java.awt.image.BufferedImage;
import java.util.HashSet;
import java.util.Set;

/**
 * Projétil do jogador ou dos inimigos. Pode ser normal, míssil teleguiado ou esfera inimiga.
 */
public class Tiro {

    public enum Tipo { NORMAL, MISSIL, ESFERA }

    public double x, y, vx, vy;
    public final double dano;
    public final boolean inimigo;
    public final Tipo tipo;
    public int perfuracoes;          // quantos inimigos ainda pode atravessar
    public final Set<Object> atingidos = new HashSet<>();
    public boolean vivo = true;
    public int raio;
    public Color cor;
    private int idade = 0;
    private final BufferedImage imgNormal;

    public Tiro(double x, double y, double vx, double vy, double dano, boolean inimigo, Tipo tipo) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.dano = dano;
        this.inimigo = inimigo;
        this.tipo = tipo;
        this.raio = inimigo ? 7 : (tipo == Tipo.MISSIL ? 6 : 5);
        this.cor = inimigo ? new Color(255, 70, 160) : Color.YELLOW;
        this.imgNormal = Sprites.escalada("/res/tiro_frame_01.png", 22, 9);
    }

    public void update(Jogo jogo) {
        idade++;
        if (tipo == Tipo.MISSIL) {
            Object alvo = jogo.alvoMaisProximo(x, y);
            double velocidade = Math.min(11, 4 + idade * 0.25);
            if (alvo != null) {
                double[] p = jogo.posicaoDe(alvo);
                double ang = Math.atan2(p[1] - y, p[0] - x);
                double atual = Math.atan2(vy, vx);
                double dif = Math.atan2(Math.sin(ang - atual), Math.cos(ang - atual));
                atual += Math.max(-0.14, Math.min(0.14, dif));
                vx = Math.cos(atual) * velocidade;
                vy = Math.sin(atual) * velocidade;
            } else {
                double n = Math.hypot(vx, vy);
                vx = vx / n * velocidade;
                vy = vy / n * velocidade;
            }
            if (idade % 2 == 0) jogo.efeitos.fumaca(x - vx, y - vy);
            if (idade > 240) vivo = false;
        }
        x += vx;
        y += vy;
        if (x < -40 || x > Jogo.LARGURA + 40 || y < -40 || y > Jogo.ALTURA + 40) vivo = false;
    }

    public Rectangle getBounds() {
        if (tipo == Tipo.NORMAL && !inimigo) return new Rectangle((int) x - 11, (int) y - 4, 22, 9);
        int r = inimigo ? raio - 2 : raio;   // hitbox dos tiros inimigos um pouco menor: mais justo
        return new Rectangle((int) (x - r), (int) (y - r), r * 2, r * 2);
    }

    public void desenhar(Graphics2D g) {
        if (inimigo) {
            BufferedImage b = Sprites.brilho(cor, raio + 4);
            g.drawImage(b, (int) x - b.getWidth() / 2, (int) y - b.getHeight() / 2, null);
            return;
        }
        if (tipo == Tipo.MISSIL) {
            AffineTransform t = g.getTransform();
            g.translate(x, y);
            g.rotate(Math.atan2(vy, vx));
            g.setColor(new Color(230, 230, 240));
            g.fillRect(-8, -2, 14, 4);
            g.setColor(new Color(255, 80, 60));
            g.fillRect(4, -2, 4, 4);
            g.setColor(new Color(255, 200, 80));
            g.fillRect(-11, -1, 3, 2);
            g.setTransform(t);
            return;
        }
        double ang = Math.atan2(vy, vx);
        if (Math.abs(ang) < 0.01) {
            g.drawImage(imgNormal, (int) x - 11, (int) y - 4, null);
        } else {
            AffineTransform t = g.getTransform();
            g.translate(x, y);
            g.rotate(ang);
            g.drawImage(imgNormal, -11, -4, null);
            g.setTransform(t);
        }
    }
}
