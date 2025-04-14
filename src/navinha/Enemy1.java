package navinha;

import java.awt.Image;
import java.awt.Rectangle;
import javax.swing.ImageIcon;

public class Enemy1 {

    private Image imagem;
    private int x, y;
    private int largura, altura;
    private boolean visivel;

    private static final int VELOCIDADE = 2;

    public Enemy1(int x, int y) {
        this.x = x;
        this.y = y;
        this.visivel = true;
        load();
    }

    private void load() {
        try {
            ImageIcon referencia = new ImageIcon(getClass().getResource("/res/Nave_Inimiga.png"));
            imagem = referencia.getImage().getScaledInstance(50, 50, Image.SCALE_SMOOTH);

            // Como estamos escalando a imagem para 50x50, já definimos diretamente
            largura = 50;
            altura = 50;

        } catch (Exception e) {
            System.err.println("Erro ao carregar imagem do inimigo: " + e.getMessage());
            imagem = null;

            // Valores padrão
            largura = 50;
            altura = 50;
        }
    }

    public void update() {
        this.x -= VELOCIDADE;
        if (this.x + largura < 0) {
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

    public Image getImage() {
        return imagem;
    }
}

