package navinha;

import java.awt.*;
import java.awt.image.BufferedImage;

/**
 * Chefe de fim de fase. Alterna entre padrões de ataque e fica mais agressivo
 * (modo fúria) quando perde metade da vida.
 */
public class Chefe {

    public static final int LEQUE = 0, ESPIRAL = 1, RAJADA = 2, INVOCAR = 3, ANEL = 4, MURO = 5;
    private static final String[] NOMES_ATAQUE = {"Leque", "Espiral", "Rajada", "Invocação", "Anel", "Muralha"};

    public final String nome;
    public double x, y;
    public double vida, vidaMax;
    public boolean vivo = true;
    public boolean entrando = true;
    public int flash = 0;
    public final int tamanho;
    public int tempoLuta = 0;            // quadros desde que a luta começou

    private final int[] padroes;
    private final InimigoTipo invoca;
    private final double dif;
    private final BufferedImage img;
    private int idx = 0, timerPadrao = 0, t = 0;
    private double anguloEspiral = 0;
    private boolean furiaAnunciada = false;

    public Chefe(Fase.ChefeInfo info, double dif, double multVida) {
        this.nome = info.nome;
        this.vidaMax = info.vida * multVida;
        this.vida = vidaMax;
        this.padroes = info.padroes;
        this.invoca = info.invoca;
        this.dif = dif;
        this.tamanho = info.tamanho;
        this.x = Jogo.LARGURA + tamanho;
        this.y = Jogo.ALTURA / 2.0;
        if (info.matiz == 0f) this.img = Sprites.escalada("/res/Nave_Inimiga.png", tamanho, tamanho);
        else this.img = Sprites.recolorida("/res/Nave_Inimiga.png", tamanho, tamanho, 0.40f, 0.60f, info.matiz, info.sat, info.bri);
    }

    public boolean furia() {
        return vida < vidaMax / 2;
    }

    public void update(Jogo jogo) {
        t++;
        if (flash > 0) flash--;

        double alvoX = Jogo.LARGURA - tamanho * 0.75;
        if (entrando) {
            x += (alvoX - x) * 0.025;
            if (Math.abs(x - alvoX) < 3) entrando = false;
            return;
        }
        tempoLuta++;

        // movimento: sobe e desce, e de vez em quando avança um pouco
        y = Jogo.ALTURA / 2.0 + 30 + Math.sin(t * 0.012 * (furia() ? 1.5 : 1)) * (Jogo.ALTURA / 2.0 - tamanho / 2.0 - 70);
        x = alvoX + Math.sin(t * 0.007) * 40;

        if (furia() && !furiaAnunciada) {
            furiaAnunciada = true;
            jogo.mostrarAviso(nome.toUpperCase() + " ESTÁ FURIOSO!", new Color(255, 80, 80));
            jogo.efeitos.anel(x, y, new Color(255, 60, 60), 160);
            jogo.tremer(14);
        }

        double ritmo = furia() ? 0.65 : 1.0;   // em fúria ataca mais rápido
        int duracao = 260;
        timerPadrao++;
        if (timerPadrao > duracao) {
            timerPadrao = 0;
            idx = (idx + 1) % padroes.length;
        }
        if (timerPadrao < 30) return;           // pequena pausa entre os padrões (respiro para o jogador)
        int f = timerPadrao;
        Player p = jogo.player;
        double bocaX = x - tamanho * 0.35, bocaY = y + tamanho * 0.1;
        double mira = Math.atan2(p.y - bocaY, p.x - bocaX);
        double v = 3.4 * dif;

        switch (padroes[idx]) {
            case LEQUE:
                if (f % (int) (55 * ritmo) == 0) {
                    int n = furia() ? 9 : 7;
                    for (int i = 0; i < n; i++)
                        jogo.tiroInimigo(bocaX, bocaY, mira + (i - (n - 1) / 2.0) * 0.16, v);
                }
                break;
            case ESPIRAL:
                if (f % (furia() ? 4 : 6) == 0) {
                    anguloEspiral += 0.27;
                    jogo.tiroInimigo(x, y, anguloEspiral, v * 0.85);
                    jogo.tiroInimigo(x, y, anguloEspiral + Math.PI, v * 0.85);
                    if (furia()) jogo.tiroInimigo(x, y, -anguloEspiral, v * 0.7);
                }
                break;
            case RAJADA:
                if ((f % 100) < 55 && f % (int) Math.max(4, 9 * ritmo) == 0)
                    jogo.tiroInimigo(bocaX, bocaY, mira + (Math.random() - 0.5) * 0.12, v * 1.5);
                break;
            case INVOCAR:
                if (f == 40 || (furia() && f == 150)) {
                    for (int i = 0; i < 3; i++) {
                        double yy = 120 + Math.random() * (Jogo.ALTURA - 220);
                        jogo.adicionarInimigo(new Inimigo(invoca, x - 40, yy, dif));
                    }
                    jogo.efeitos.anel(x, y, new Color(255, 220, 120), 120);
                }
                if (f % (int) (80 * ritmo) == 0) jogo.tiroMirado(bocaX, bocaY, v);
                break;
            case ANEL:
                if (f % (int) (50 * ritmo) == 0) {
                    int n = furia() ? 22 : 16;
                    double desloc = (f / 50) * 0.1;
                    for (int i = 0; i < n; i++) jogo.tiroInimigo(x, y, desloc + i * Math.PI * 2 / n, v * 0.8);
                }
                break;
            case MURO:
                // parede de tiros com uma brecha para o jogador passar
                if (f % (int) (75 * ritmo) == 0) {
                    double brecha = 110 + Math.random() * (Jogo.ALTURA - 260);
                    for (double yy = 60; yy < Jogo.ALTURA; yy += 30) {
                        if (Math.abs(yy - brecha) < 75) continue;
                        Tiro tiro = new Tiro(Jogo.LARGURA + 10, yy, -v * 0.9, 0, 1, true, Tiro.Tipo.ESFERA);
                        tiro.cor = new Color(255, 170, 60);
                        jogo.tiros.add(tiro);
                    }
                }
                break;
        }
    }

    public boolean danificar(double d) {
        if (entrando) return false;
        vida -= d;
        flash = 3;
        if (vida <= 0) {
            vida = 0;
            vivo = false;
            return true;
        }
        return false;
    }

    public String ataqueAtual() {
        return NOMES_ATAQUE[padroes[idx]];
    }

    public Rectangle getBounds() {
        int w = (int) (tamanho * 0.8), h = (int) (tamanho * 0.55);
        return new Rectangle((int) x - w / 2, (int) y - h / 2, w, h);
    }

    public void desenhar(Graphics2D g) {
        BufferedImage i = flash > 0 ? Sprites.branco(img) : img;
        if (furia()) {
            // aura vermelha pulsando
            int r = (int) (tamanho * 0.62 + Math.sin(t * 0.2) * 6);
            BufferedImage aura = Sprites.brilho(new Color(255, 40, 40), r);
            Composite c = g.getComposite();
            g.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, 0.45f));
            g.drawImage(aura, (int) x - r, (int) y - r, null);
            g.setComposite(c);
        }
        g.drawImage(i, (int) x - tamanho / 2, (int) y - tamanho / 2, null);
    }
}
