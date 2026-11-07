package navinha;

import java.awt.Color;
import java.awt.image.BufferedImage;

/**
 * As naves que o jogador pode escolher. Cada uma tem atributos e um poder especial próprio.
 */
public enum NaveTipo {

    FALCAO("Falcão", "Equilibrada e confiável.",
            "Enxame de Mísseis", "Dispara 12 mísseis teleguiados.",
            5.0, 3, 10, 1.0, false, 52, 0f, 1f, new Color(255, 120, 80), null),

    COMETA("Cometa", "Rápida, mas frágil.",
            "Turbo", "4s invencível, mais veloz e atirando sem parar.",
            7.0, 2, 7, 0.8, false, 46, 0.62f, 1.05f, new Color(90, 200, 255), null),

    TITA("Titã", "Lenta, blindada e de tiro pesado.",
            "Escudo de Plasma", "5s de escudo que destrói tiros e inimigos.",
            3.6, 5, 15, 2.0, false, 64, 0.33f, 0.85f, new Color(120, 255, 120),
            "Derrote o chefe da Fase 2"),

    FANTASMA("Fantasma", "Tiros perfurantes atravessam inimigos.",
            "Raio Fantasma", "Laser contínuo que corta tudo por 3s.",
            5.5, 3, 11, 1.0, true, 52, 0.78f, 1.1f, new Color(220, 120, 255),
            "Complete 3 desafios de fase");

    public final String nome, descricao, especial, descEspecial, condicao;
    public final double velocidade, dano;
    public final int vidas, cadencia, tamanho;
    public final boolean perfurante;
    public final float matiz, brilho;
    public final Color cor;

    NaveTipo(String nome, String descricao, String especial, String descEspecial,
             double velocidade, int vidas, int cadencia, double dano, boolean perfurante,
             int tamanho, float matiz, float brilho, Color cor, String condicao) {
        this.nome = nome;
        this.descricao = descricao;
        this.especial = especial;
        this.descEspecial = descEspecial;
        this.velocidade = velocidade;
        this.vidas = vidas;
        this.cadencia = cadencia;
        this.dano = dano;
        this.perfurante = perfurante;
        this.tamanho = tamanho;
        this.matiz = matiz;
        this.brilho = brilho;
        this.cor = cor;
        this.condicao = condicao;
    }

    public BufferedImage imagem() {
        return imagem(tamanho);
    }

    public BufferedImage imagem(int tam) {
        if (matiz == 0f) return Sprites.escalada("/res/Minha_Nave.png", tam, tam);
        // gira só as partes vermelhas da nave original (as chamas e a cabine ficam iguais)
        return Sprites.recolorida("/res/Minha_Nave.png", tam, tam, 0.9f, 0.04f, matiz, 1f, brilho);
    }

    /** Valores de 0 a 1 para as barrinhas da tela de seleção. */
    public double barraVelocidade() { return velocidade / 7.0; }
    public double barraResistencia() { return vidas / 5.0; }
    public double barraPoder() { return Math.min(1, (dano * 60.0 / cadencia) / 8.0 + (perfurante ? 0.2 : 0)); }
}
