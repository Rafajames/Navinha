package navinha;

import java.awt.*;
import java.awt.image.BufferedImage;
import java.util.HashMap;
import java.util.IdentityHashMap;
import java.util.Map;
import java.util.Random;
import javax.imageio.ImageIO;

/**
 * Carrega, escala e recolore as imagens do jogo, guardando tudo em cache.
 * As naves novas são variações de cor das artes originais, então o visual
 * continua no mesmo estilo pixel art.
 */
public final class Sprites {

    private static final Map<String, BufferedImage> cache = new HashMap<>();
    private static final Map<BufferedImage, BufferedImage> brancos = new IdentityHashMap<>();

    private Sprites() {}

    public static BufferedImage original(String caminho) {
        BufferedImage img = cache.get(caminho);
        if (img != null) return img;
        try {
            img = ImageIO.read(Sprites.class.getResource(caminho));
        } catch (Exception e) {
            System.err.println("Imagem não encontrada: " + caminho);
            img = new BufferedImage(32, 32, BufferedImage.TYPE_INT_ARGB);
            Graphics2D g = img.createGraphics();
            g.setColor(Color.MAGENTA);
            g.fillRect(0, 0, 32, 32);
            g.dispose();
        }
        cache.put(caminho, img);
        return img;
    }

    public static BufferedImage escalada(String caminho, int w, int h) {
        String chave = caminho + "@" + w + "x" + h;
        BufferedImage img = cache.get(chave);
        if (img == null) {
            img = escalar(original(caminho), w, h);
            cache.put(chave, img);
        }
        return img;
    }

    /**
     * Imagem escalada e recolorida: os pixels cujo matiz está entre hMin e hMax
     * (pode "dar a volta" no vermelho, ex.: 0.9 a 0.05) são girados por desloc.
     */
    public static BufferedImage recolorida(String caminho, int w, int h,
                                           float hMin, float hMax, float desloc, float sat, float bri) {
        String chave = caminho + "@" + w + "x" + h + "#" + hMin + "," + hMax + "," + desloc + "," + sat + "," + bri;
        BufferedImage img = cache.get(chave);
        if (img == null) {
            img = recolorir(escalada(caminho, w, h), hMin, hMax, desloc, sat, bri);
            cache.put(chave, img);
        }
        return img;
    }

    public static BufferedImage escalar(BufferedImage src, int w, int h) {
        BufferedImage out = new BufferedImage(w, h, BufferedImage.TYPE_INT_ARGB);
        Image tmp = src.getScaledInstance(w, h, Image.SCALE_AREA_AVERAGING);
        Graphics2D g = out.createGraphics();
        g.drawImage(tmp, 0, 0, null);
        g.dispose();
        return out;
    }

    public static BufferedImage recolorir(BufferedImage src, float hMin, float hMax, float desloc, float sat, float bri) {
        int w = src.getWidth(), h = src.getHeight();
        BufferedImage out = new BufferedImage(w, h, BufferedImage.TYPE_INT_ARGB);
        float[] hsb = new float[3];
        for (int y = 0; y < h; y++) {
            for (int x = 0; x < w; x++) {
                int argb = src.getRGB(x, y);
                int a = argb >>> 24;
                if (a == 0) continue;
                int r = (argb >> 16) & 255, gg = (argb >> 8) & 255, b = argb & 255;
                Color.RGBtoHSB(r, gg, b, hsb);
                boolean dentro = hMin <= hMax ? (hsb[0] >= hMin && hsb[0] <= hMax)
                                              : (hsb[0] >= hMin || hsb[0] <= hMax);
                if (dentro && hsb[1] > 0.15f) {
                    float nh = hsb[0] + desloc;
                    nh -= (float) Math.floor(nh);
                    int rgb = Color.HSBtoRGB(nh, Math.min(1f, hsb[1] * sat), Math.min(1f, hsb[2] * bri));
                    out.setRGB(x, y, (a << 24) | (rgb & 0xFFFFFF));
                } else {
                    out.setRGB(x, y, argb);
                }
            }
        }
        return out;
    }

    /** Silhueta branca usada para o "piscar" quando algo leva dano. */
    public static BufferedImage branco(BufferedImage src) {
        BufferedImage b = brancos.get(src);
        if (b != null) return b;
        int w = src.getWidth(), h = src.getHeight();
        b = new BufferedImage(w, h, BufferedImage.TYPE_INT_ARGB);
        for (int y = 0; y < h; y++)
            for (int x = 0; x < w; x++) {
                int a = src.getRGB(x, y) >>> 24;
                if (a > 0) b.setRGB(x, y, (a << 24) | 0xFFFFFF);
            }
        brancos.put(src, b);
        return b;
    }

    /** Monta um sprite pixel art a partir de linhas de texto. '.' é transparente. */
    public static BufferedImage pixelArt(String chave, String[] linhas, Map<Character, Integer> paleta, int escala) {
        BufferedImage img = cache.get("px:" + chave);
        if (img != null) return img;
        int h = linhas.length, w = 0;
        for (String l : linhas) w = Math.max(w, l.length());
        img = new BufferedImage(w * escala, h * escala, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g = img.createGraphics();
        for (int y = 0; y < h; y++)
            for (int x = 0; x < linhas[y].length(); x++) {
                Integer cor = paleta.get(linhas[y].charAt(x));
                if (cor == null) continue;
                g.setColor(new Color(cor, true));
                g.fillRect(x * escala, y * escala, escala, escala);
            }
        g.dispose();
        cache.put("px:" + chave, img);
        return img;
    }

    /** Asteroide pixel art gerado por código (desenhado pequeno e ampliado sem suavizar). */
    public static BufferedImage asteroide(int variante, int tamanho) {
        String chave = "ast" + variante + "@" + tamanho;
        BufferedImage img = cache.get(chave);
        if (img != null) return img;
        int base = 16;
        BufferedImage peq = new BufferedImage(base, base, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g = peq.createGraphics();
        Random r = new Random(variante * 7919L + 13);
        int n = 9;
        int[] xs = new int[n], ys = new int[n];
        for (int i = 0; i < n; i++) {
            double ang = i * Math.PI * 2 / n;
            double raio = 5.5 + r.nextDouble() * 2.2;
            xs[i] = (int) Math.round(8 + Math.cos(ang) * raio);
            ys[i] = (int) Math.round(8 + Math.sin(ang) * raio);
        }
        g.setColor(new Color(0x3a3340));
        g.fillPolygon(xs, ys, n);
        g.setColor(new Color(0x6d6470));
        g.translate(-1, -1);
        g.fillPolygon(xs, ys, n);
        g.translate(1, 1);
        g.setColor(new Color(0x8f8592));
        g.fillOval(5, 4, 4, 3);
        g.setColor(new Color(0x4a424f));
        for (int i = 0; i < 3; i++) {
            int cx = 4 + r.nextInt(7), cy = 4 + r.nextInt(7);
            g.fillRect(cx, cy, 2, 2);
        }
        g.dispose();
        img = new BufferedImage(tamanho, tamanho, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g2 = img.createGraphics();
        g2.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_NEAREST_NEIGHBOR);
        g2.drawImage(peq, 0, 0, tamanho, tamanho, null);
        g2.dispose();
        cache.put(chave, img);
        return img;
    }

    /** Bolinha com brilho, usada nos tiros dos inimigos e nos power-ups. */
    public static BufferedImage brilho(Color cor, int raio) {
        String chave = "glow" + cor.getRGB() + "@" + raio;
        BufferedImage img = cache.get(chave);
        if (img != null) return img;
        int d = raio * 2;
        img = new BufferedImage(d, d, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g = img.createGraphics();
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        RadialGradientPaint p = new RadialGradientPaint(raio, raio, raio,
                new float[]{0f, 0.35f, 0.6f, 1f},
                new Color[]{Color.WHITE, cor, new Color(cor.getRed(), cor.getGreen(), cor.getBlue(), 110),
                        new Color(cor.getRed(), cor.getGreen(), cor.getBlue(), 0)});
        g.setPaint(p);
        g.fillOval(0, 0, d, d);
        g.dispose();
        cache.put(chave, img);
        return img;
    }
}
