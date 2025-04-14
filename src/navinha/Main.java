package navinha;

import javax.swing.JFrame;

public class Main extends JFrame {

    public Main() {
        add(new Fase());
        setTitle("Navinha Espacial");
        setSize(1024, 768);
        setDefaultCloseOperation(EXIT_ON_CLOSE);
        setLocationRelativeTo(null);
        setResizable(false);
        setVisible(true);
    }

    public static void main(String[] args) {
        new Main();
    }
}
