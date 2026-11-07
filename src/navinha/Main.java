package navinha;

import javax.swing.JFrame;
import javax.swing.SwingUtilities;

/**
 * Ponto de entrada do jogo Navinha Espacial.
 */
public class Main extends JFrame {

    public Main() {
        Jogo jogo = new Jogo();
        add(jogo);
        setTitle("Navinha Espacial");
        setDefaultCloseOperation(EXIT_ON_CLOSE);
        setResizable(false);
        pack();                       // ajusta a janela exatamente ao tamanho do painel (1024x768)
        setLocationRelativeTo(null);
        setVisible(true);
        jogo.iniciar();
    }

    public static void main(String[] args) {
        System.setProperty("sun.java2d.opengl", "true");
        SwingUtilities.invokeLater(Main::new);
    }
}
