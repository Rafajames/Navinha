package navinha;

import java.awt.Image;
import java.awt.Rectangle;
import javax.swing.ImageIcon;

public class Tiro {

    private Image imagem;
    private int x, y;
    private int largura, altura;
    private boolean visivel;

    private static final int LARGURA_TELA = 938;
    private static int VELOCIDADE = 4;

    public Tiro(int x, int y) {
        this.x = x;
        this.y = y;
        this.visivel = true;
        load();
    }

    private void load() {
        try {
            ImageIcon referencia = new ImageIcon(getClass().getResource("/res/tiro_frame_01.png"));
            imagem = referencia.getImage();
            this.largura = imagem.getWidth(null);
            this.altura = imagem.getHeight(null);
        } catch (Exception e) {
            System.err.println("Erro ao carregar imagem do tiro: " + e.getMessage());
            imagem = null;
            largura = 10;
            altura = 10;
        }
    }

    public void update() {
        this.x += VELOCIDADE;
        if (this.x > LARGURA_TELA) {
            visivel = false;
        }
    }

    public Rectangle getBounds() {
        return new Rectangle(x, y, largura, altura);
    }

    public boolean isVisivel() {
        return visivel;
    }

    public void setVisivel(boolean visivel) {
        this.visivel = visivel;
    }

    public int getX() {
        return x;
    }

    public int getY() {
        return y;
    }

    public static int getVelocidade() {
        return VELOCIDADE;
    }

    public static void setVelocidade(int velocidade) {
        VELOCIDADE = velocidade;
    }

    public Image getImage() {
        return imagem;
    }
}
