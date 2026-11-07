package navinha;

import java.awt.Color;

/**
 * Definição das 5 fases: inimigos que aparecem, meta de abates, desafio opcional e chefe.
 */
public class Fase {

    public enum Desafio {
        COMBO("Faça um combo de %d", 15),
        ASTEROIDES("Destrua %d asteroides", 12),
        SEM_DANO("Não leve nenhum dano", 0),
        SEM_BOMBA("Não use bombas", 0),
        CHEFE_RAPIDO("Derrote o chefe em até %ds", 75);

        public final String texto;
        public final int meta;

        Desafio(String texto, int meta) {
            this.texto = texto;
            this.meta = meta;
        }

        public String descricao() {
            return meta > 0 ? String.format(texto, meta) : texto;
        }
    }

    public static class ChefeInfo {
        public final String nome;
        public final double vida;
        public final int[] padroes;
        public final InimigoTipo invoca;
        public final int tamanho;
        public final float matiz, sat, bri;

        ChefeInfo(String nome, double vida, int tamanho, InimigoTipo invoca, float matiz, float sat, float bri, int... padroes) {
            this.nome = nome;
            this.vida = vida;
            this.tamanho = tamanho;
            this.invoca = invoca;
            this.matiz = matiz;
            this.sat = sat;
            this.bri = bri;
            this.padroes = padroes;
        }
    }

    public final int numero;
    public final String nome;
    public final InimigoTipo[] tipos;
    public final int[] pesos;
    public final int meta;               // abates para chamar o chefe
    public final int intervalo;          // quadros entre surgimentos
    public final double velocidade;      // multiplicador de dificuldade base
    public final Desafio desafio;
    public final ChefeInfo chefe;
    public final Color ceuTopo, ceuBase, nebulosa1, nebulosa2;

    private Fase(int numero, String nome, InimigoTipo[] tipos, int[] pesos, int meta, int intervalo, double velocidade,
                 Desafio desafio, ChefeInfo chefe, Color ceuTopo, Color ceuBase, Color nebulosa1, Color nebulosa2) {
        this.numero = numero;
        this.nome = nome;
        this.tipos = tipos;
        this.pesos = pesos;
        this.meta = meta;
        this.intervalo = intervalo;
        this.velocidade = velocidade;
        this.desafio = desafio;
        this.chefe = chefe;
        this.ceuTopo = ceuTopo;
        this.ceuBase = ceuBase;
        this.nebulosa1 = nebulosa1;
        this.nebulosa2 = nebulosa2;
    }

    public InimigoTipo sortearTipo() {
        int total = 0;
        for (int p : pesos) total += p;
        int r = (int) (Math.random() * total);
        for (int i = 0; i < tipos.length; i++) {
            r -= pesos[i];
            if (r < 0) return tipos[i];
        }
        return tipos[0];
    }

    private static InimigoTipo[] t(InimigoTipo... t) { return t; }
    private static int[] p(int... p) { return p; }

    public static final Fase[] FASES = {
            new Fase(1, "Cinturão de Órion",
                    t(InimigoTipo.BASICO, InimigoTipo.ZIGUE), p(7, 3),
                    25, 55, 1.0, Desafio.COMBO,
                    new ChefeInfo("Nave-Mãe Ômega", 240, 170, InimigoTipo.BASICO, 0f, 1f, 1f,
                            Chefe.LEQUE, Chefe.INVOCAR, Chefe.ANEL),
                    new Color(4, 6, 22), new Color(10, 16, 40), new Color(40, 70, 160), new Color(90, 40, 140)),

            new Fase(2, "Campo de Asteroides",
                    t(InimigoTipo.ASTEROIDE, InimigoTipo.BASICO, InimigoTipo.KAMIKAZE), p(5, 3, 2),
                    30, 48, 1.08, Desafio.ASTEROIDES,
                    new ChefeInfo("Devorador de Rochas", 380, 180, InimigoTipo.ASTEROIDE, -0.42f, 0.8f, 0.9f,
                            Chefe.LEQUE, Chefe.ESPIRAL, Chefe.INVOCAR, Chefe.ANEL),
                    new Color(14, 10, 8), new Color(30, 22, 16), new Color(140, 90, 40), new Color(80, 60, 60)),

            new Fase(3, "Nebulosa Carmesim",
                    t(InimigoTipo.ATIRADOR, InimigoTipo.ZIGUE, InimigoTipo.KAMIKAZE, InimigoTipo.BASICO), p(3, 3, 3, 2),
                    35, 44, 1.15, Desafio.SEM_DANO,
                    new ChefeInfo("Rainha Carmesim", 520, 185, InimigoTipo.KAMIKAZE, 0.48f, 1.2f, 1f,
                            Chefe.ESPIRAL, Chefe.RAJADA, Chefe.INVOCAR, Chefe.ANEL),
                    new Color(20, 4, 12), new Color(40, 8, 20), new Color(180, 30, 70), new Color(120, 20, 120)),

            new Fase(4, "Fronteira Sombria",
                    t(InimigoTipo.TANQUE, InimigoTipo.ATIRADOR, InimigoTipo.KAMIKAZE, InimigoTipo.ASTEROIDE, InimigoTipo.ZIGUE),
                    p(1, 3, 3, 2, 2),
                    40, 42, 1.22, Desafio.SEM_BOMBA,
                    new ChefeInfo("Sentinela Sombria", 680, 195, InimigoTipo.ATIRADOR, 0.30f, 0.9f, 0.7f,
                            Chefe.LEQUE, Chefe.RAJADA, Chefe.MURO, Chefe.ANEL),
                    new Color(6, 4, 14), new Color(16, 10, 28), new Color(80, 40, 140), new Color(30, 90, 110)),

            new Fase(5, "Núcleo Alienígena",
                    t(InimigoTipo.BASICO, InimigoTipo.ZIGUE, InimigoTipo.ATIRADOR, InimigoTipo.KAMIKAZE, InimigoTipo.TANQUE, InimigoTipo.ASTEROIDE),
                    p(2, 3, 3, 3, 1, 1),
                    45, 38, 1.3, Desafio.CHEFE_RAPIDO,
                    new ChefeInfo("Imperador Zorg", 1000, 230, InimigoTipo.KAMIKAZE, -0.33f, 1.3f, 1.15f,
                            Chefe.LEQUE, Chefe.ESPIRAL, Chefe.RAJADA, Chefe.INVOCAR, Chefe.ANEL, Chefe.MURO),
                    new Color(2, 14, 10), new Color(6, 30, 22), new Color(30, 160, 100), new Color(160, 140, 30)),
    };
}
