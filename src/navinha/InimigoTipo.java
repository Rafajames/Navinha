package navinha;

/**
 * Tipos de inimigo comum.
 */
public enum InimigoTipo {
    //          nome           vida  pontos tamanho chanceDrop
    BASICO     ("Disco",         1,   100,   48,    0.06),
    ZIGUE      ("Zigue-Zague",   1,   150,   44,    0.08),
    ATIRADOR   ("Atirador",      4,   250,   54,    0.20),
    KAMIKAZE   ("Kamikaze",      1,   200,   36,    0.07),
    TANQUE     ("Encouraçado",  14,   600,   82,    0.65),
    ASTEROIDE  ("Asteroide",     5,    80,   58,    0.05),
    FRAGMENTO  ("Fragmento",     1,    40,   28,    0.02);

    public final String nome;
    public final double vida;
    public final int pontos, tamanho;
    public final double chanceDrop;

    InimigoTipo(String nome, double vida, int pontos, int tamanho, double chanceDrop) {
        this.nome = nome;
        this.vida = vida;
        this.pontos = pontos;
        this.tamanho = tamanho;
        this.chanceDrop = chanceDrop;
    }
}
