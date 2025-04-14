package navinha;

import java.awt.Image;
import java.awt.Rectangle;
import java.awt.event.KeyEvent;
import javax.swing.ImageIcon;
import java.util.ArrayList;
import java.util.List;

public class Player {

    private int x, y;
    private int dx, dy;
    private Image imagem;
    private int altura, largura;
    private List<Tiro> tiros;
    private boolean visivel;

    private static final int LARGURA_TELA = 1024;
    private static final int ALTURA_TELA = 768;

    public Player() {
        this.x = 100;
        this.y = 100;
        this.visivel = true;
        this.tiros = new ArrayList<>();
        load();
    }

    public void load() {
        try {
            ImageIcon referencia = new ImageIcon(getClass().getResource("/res/Minha_Nave.png"));
            imagem = referencia.getImage().getScaledInstance(50, 50, Image.SCALE_SMOOTH);
    
            // A imagem foi escalada para 50x50, então já sabemos as dimensões
            largura = 50;
            altura = 50;
    
        } catch (Exception e) {
            System.err.println("Erro ao carregar imagem da nave: " + e.getMessage());
            largura = 50;
            altura = 50;
        }
    }
    

    public void update() {
        x += dx;
        y += dy;

        // Limites da tela
        if (x < 0) x = 0;
        if (x > LARGURA_TELA - largura) x = LARGURA_TELA - largura;
        if (y < 0) y = 0;
        if (y > ALTURA_TELA - altura) y = ALTURA_TELA - altura;
    }

    public void tiroSimples() {
        tiros.add(new Tiro(x + largura, y + (altura / 2)));
    }

    private SomTiro somTiro = new SomTiro();

    public void atirar() {
        this.tiros.add(new Tiro(x + largura, y + altura / 2));
        somTiro.tocar(10.0f); // volume normal (0 dB), pode usar -5.0f se quiser mais baixo
    }
    
    
    

    public Rectangle getBounds() {
        return new Rectangle(x, y, largura, altura);
    }

    public void keyPressed(KeyEvent tecla) {
        int codigo = tecla.getKeyCode();

        if (codigo == KeyEvent.VK_A) {
            tiroSimples();
        }
        if (codigo == KeyEvent.VK_UP) {
            dy = -3;
        }
        if (codigo == KeyEvent.VK_DOWN) {
            dy = 3;
        }
        if (codigo == KeyEvent.VK_LEFT) {
            dx = -3;
        }
        if (codigo == KeyEvent.VK_RIGHT) {
            dx = 3;
        }
    }

    public void keyReleased(KeyEvent tecla) {
        int codigo = tecla.getKeyCode();

        if (codigo == KeyEvent.VK_UP || codigo == KeyEvent.VK_DOWN) {
            dy = 0;
        }
        if (codigo == KeyEvent.VK_LEFT || codigo == KeyEvent.VK_RIGHT) {
            dx = 0;
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

    public List<Tiro> getTiros() {
        return tiros;
    }
}
