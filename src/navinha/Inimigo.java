package navinha;

import java.awt.*;
import java.awt.geom.AffineTransform;
import java.awt.image.BufferedImage;
import java.util.HashMap;
import java.util.Map;

/**
 * Inimigo comum. O comportamento muda conforme o {@link InimigoTipo}.
 * As coordenadas x,y são o CENTRO do inimigo.
 */
public class Inimigo {

    public final InimigoTipo tipo;
    public double x, y, vx, vy;
    public double vida;
    public boolean vivo = true;
    public int flash = 0;
    private final double baseY;
    private final double dif;
    private int idade = 0;
    private int recarga;
    private double rot, vrot;
    private final double alvoX;
    private final double fase;     // defasagem do zigue-zague
    private final BufferedImage img;

    public Inimigo(InimigoTipo tipo, double x, double y, double dif) {
        this.tipo = tipo;
        this.x = x;
        this.y = y;
        this.baseY = y;
        this.dif = dif;
        this.vida = tipo.vida * (tipo == InimigoTipo.FRAGMENTO ? 1 : (0.75 + dif * 0.25));
        this.recarga = 60 + (int) (Math.random() * 60);
        this.alvoX = 680 + Math.random() * 230;
        this.fase = Math.random() * Math.PI * 2;
        this.vrot = (Math.random() - 0.5) * 0.06;
        switch (tipo) {
            case BASICO:    vx = -(2.0 + Math.random() * 0.8) * dif; break;
            case ZIGUE:     vx = -2.6 * dif; break;
            case ATIRADOR:  vx = -3.0; break;
            case KAMIKAZE:  vx = -1.6; break;
            case TANQUE:    vx = -1.1; break;
            case ASTEROIDE: vx = -(1.3 + Math.random() * 1.4) * dif; vy = (Math.random() - 0.5) * 1.2; break;
            default: break;
        }
        this.img = imagemDo(tipo, (int) (Math.random() * 3));
    }

    /** Fragmento de asteroide, já com velocidade definida. */
    public Inimigo(double x, double y, double vx, double vy, double dif) {
        this(InimigoTipo.FRAGMENTO, x, y, dif);
        this.vx = vx;
        this.vy = vy;
    }

    public void update(Jogo jogo) {
        idade++;
        if (flash > 0) flash--;
        Player p = jogo.player;

        switch (tipo) {
            case BASICO:
                x += vx;
                break;

            case ZIGUE:
                x += vx;
                y = baseY + Math.sin(idade * 0.05 + fase) * 80;
                break;

            case ATIRADOR:
                // entra, para numa posição, atira por um tempo e depois vai embora
                if (idade < 600) {
                    x += (alvoX - x) * 0.03;
                    y = baseY + Math.sin(idade * 0.02 + fase) * 40;
                } else {
                    x -= 4.5;
                }
                if (--recarga <= 0 && x < Jogo.LARGURA - 30 && p.vivo) {
                    jogo.tiroMirado(x - 20, y, 3.6 * dif);
                    recarga = (int) (100 / dif);
                }
                break;

            case KAMIKAZE:
                if (idade < 45) {
                    x += vx;
                } else {
                    // persegue o jogador enquanto ainda não passou dele
                    if (p.vivo && x > p.x - 40) {
                        double ang = Math.atan2(p.y - y, p.x - x);
                        vx += Math.cos(ang) * 0.32 * dif;
                        vy += Math.sin(ang) * 0.32 * dif;
                    }
                    double v = Math.hypot(vx, vy), max = 6.2 * dif;
                    if (v > max) { vx = vx / v * max; vy = vy / v * max; }
                    x += vx;
                    y += vy;
                    if (idade % 3 == 0) jogo.efeitos.faisca(x + 16, y, new Color(255, 150, 60));
                }
                break;

            case TANQUE:
                if (x > Jogo.LARGURA - 170) x += vx;
                else x -= 0.25;
                y = baseY + Math.sin(idade * 0.015 + fase) * 60;
                if (--recarga <= 0 && x < Jogo.LARGURA - 40 && p.vivo) {
                    double base = Math.atan2(p.y - y, p.x - x);
                    for (int i = -2; i <= 2; i++) jogo.tiroInimigo(x - 30, y, base + i * 0.22, 3.2 * dif);
                    recarga = (int) (130 / dif);
                }
                break;

            case ASTEROIDE:
            case FRAGMENTO:
                x += vx;
                y += vy;
                rot += vrot;
                if (y < 60 || y > Jogo.ALTURA - 20) vy = -vy;
                break;
        }

        if (x < -120 || x > Jogo.LARGURA + 900 || y < -150 || y > Jogo.ALTURA + 150) vivo = false;
    }

    /** Aplica dano. Retorna true se o inimigo morreu. */
    public boolean danificar(double d) {
        vida -= d;
        flash = 4;
        if (vida <= 0) {
            vivo = false;
            return true;
        }
        return false;
    }

    public Rectangle getBounds() {
        int t = (int) (tipo.tamanho * 0.78);
        int h = (tipo == InimigoTipo.BASICO || tipo == InimigoTipo.ZIGUE || tipo == InimigoTipo.ATIRADOR
                || tipo == InimigoTipo.TANQUE) ? (int) (t * 0.75) : t;
        return new Rectangle((int) x - t / 2, (int) y - h / 2, t, h);
    }

    public void desenhar(Graphics2D g) {
        BufferedImage i = flash > 0 ? Sprites.branco(img) : img;
        int w = i.getWidth(), h = i.getHeight();
        if (tipo == InimigoTipo.ASTEROIDE || tipo == InimigoTipo.FRAGMENTO) {
            AffineTransform t = g.getTransform();
            g.translate(x, y);
            g.rotate(rot);
            g.drawImage(i, -w / 2, -h / 2, null);
            g.setTransform(t);
        } else if (tipo == InimigoTipo.KAMIKAZE && idade >= 45) {
            AffineTransform t = g.getTransform();
            g.translate(x, y);
            g.rotate(Math.atan2(vy, vx) + Math.PI);
            g.drawImage(i, -w / 2, -h / 2, null);
            g.setTransform(t);
        } else {
            g.drawImage(i, (int) x - w / 2, (int) y - h / 2, null);
        }
        // barrinha de vida para os inimigos resistentes
        if ((tipo == InimigoTipo.TANQUE || tipo == InimigoTipo.ATIRADOR) && vida < tipo.vida) {
            int bw = tipo.tamanho - 10;
            double pct = Math.max(0, vida / (tipo.vida * (0.75 + dif * 0.25)));
            g.setColor(new Color(0, 0, 0, 150));
            g.fillRect((int) x - bw / 2, (int) y - h / 2 - 8, bw, 4);
            g.setColor(new Color(255, 80, 80));
            g.fillRect((int) x - bw / 2, (int) y - h / 2 - 8, (int) (bw * pct), 4);
        }
    }

    // ------------------------------------------------------------------ imagens

    private static final String UFO = "/res/Nave_Inimiga.png";

    private static BufferedImage imagemDo(InimigoTipo tipo, int variante) {
        int t = tipo.tamanho;
        switch (tipo) {
            case BASICO:    return Sprites.escalada(UFO, t, t);
            case ZIGUE:     return Sprites.recolorida(UFO, t, t, 0.40f, 0.60f, -0.35f, 1.1f, 1.1f);
            case ATIRADOR:  return Sprites.recolorida(UFO, t, t, 0.40f, 0.60f, 0.48f, 1.1f, 1.0f);
            case TANQUE:    return Sprites.recolorida(UFO, t, t, 0.40f, 0.60f, 0.30f, 0.9f, 0.8f);
            case ASTEROIDE: return Sprites.asteroide(variante, t);
            case FRAGMENTO: return Sprites.asteroide(variante + 3, t);
            case KAMIKAZE:  return kamikaze();
            default:        return Sprites.escalada(UFO, t, t);
        }
    }

    private static BufferedImage kamikaze() {
        String[] px = {
                "........kk....",
                "......kkrrk...",
                "....kkrrrrrkF.",
                "..kkrrrwwrrrFF",
                "kkrrrrwwwwrrFf",
                "..kkrrrwwrrrFF",
                "....kkrrrrrkF.",
                "......kkrrk...",
                "........kk....",
        };
        Map<Character, Integer> pal = new HashMap<>();
        pal.put('k', 0xFF3a1a14);
        pal.put('r', 0xFFff7a2a);
        pal.put('w', 0xFFffe066);
        pal.put('F', 0xFFff4040);
        pal.put('f', 0xFFffd040);
        return Sprites.pixelArt("kamikaze", px, pal, 3);
    }
}
