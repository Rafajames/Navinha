package navinha;

import java.awt.Image;
import java.awt.Rectangle;
import java.util.Random;
import javax.swing.ImageIcon;

public class Stars {

    private Image imagem;
    private int x, y;
    private int largura, altura;
    private boolean visivel;

    private static final int VELOCIDADE = 2;
    private static final int LARGURA_TELA = 1024;
    private static final int ALTURA_TELA = 768;
    private static final Random random = new Random();

    public Stars(int x, int y) {
        this.x = x;
        this.y = y;
        this.visivel = true;
        load();
    }

    private void load() {
        try {
            ImageIcon referencia = new ImageIcon(getClass().getResource("/res/Estrela.png"));
            imagem = referencia.getImage().getScaledInstance(5, 5, Image.SCALE_SMOOTH);
            largura = 5;
            altura = 5;
        } catch (Exception e) {
            System.err.println("Erro ao carregar imagem da estrela: " + e.getMessage());
            largura = 5;
            altura = 5;
        }
    }
    

    public void update() {
        if (this.x < 0) {
            this.x = random.nextInt(500) + LARGURA_TELA;
            this.y = random.nextInt(ALTURA_TELA);
        } else {
            this.x -= VELOCIDADE;
        }
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

    public Rectangle getBounds() {
        return new Rectangle(x, y, largura, altura);
    }
}
