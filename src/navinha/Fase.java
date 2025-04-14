package navinha;

import java.awt.*;
import java.awt.event.*;
import java.io.*;
import java.util.*;
import javax.swing.*;
import javax.swing.Timer;


import java.util.List;
import java.awt.Rectangle;

public class Fase extends JPanel implements ActionListener, KeyListener {

    private Image fundo;
    private Player player;
    private Timer timer;
    private List<Enemy1> enemy1;
    private List<Stars> stars;
    private boolean emJogo = false;
    private boolean gameOver = false;
    private boolean telaInicial = true;
    private int pontuacao = 0;
    private int vidas = 3;
    private List<String> records;
    private String nomeJogador = "";

    private static final String RECORDS_FILE = "records.txt";

    public Fase() {
        setFocusable(true);
        setDoubleBuffered(true);
        addKeyListener(this);
        addMouseListener(new MouseAdapter() {
            @Override
            public void mouseClicked(MouseEvent e) {
                iniciarJogoSeNecessario();
            }
        });

        ImageIcon referencia = new ImageIcon(getClass().getResource("/res/background.png"));
        fundo = referencia.getImage();

        player = new Player();
        player.load();

        inicializaInimigos();
        inicializaEstrelas();
        Som.tocarLoop("/res/musica_fundo.wav");
   
        timer = new Timer(5, this);
        timer.start();

        loadRecords();
    }

    private void iniciarJogoSeNecessario() {
        if (telaInicial && !emJogo) {
            nomeJogador = JOptionPane.showInputDialog("Digite seu nome:");
            if (nomeJogador == null || nomeJogador.trim().isEmpty()) {
                nomeJogador = "Anônimo";
            }
            telaInicial = false;
            emJogo = true;
            requestFocusInWindow();
        }
    }

    public void inicializaInimigos() {
        enemy1 = new ArrayList<>();
        for (int i = 0; i < 40; i++) {
            int x = (int) (Math.random() * 800 + 1024);
            int y = (int) (Math.random() * 600);
            enemy1.add(new Enemy1(x, y));
        }
    }

    public void inicializaEstrelas() {
        stars = new ArrayList<>();
        for (int i = 0; i < 50; i++) {
            int x = (int) (Math.random() * 1024);
            int y = (int) (Math.random() * 768);
            stars.add(new Stars(x, y));
        }
    }

    @Override
    public void paint(Graphics g) {
        super.paint(g);
        Graphics2D graficos = (Graphics2D) g;
        graficos.drawImage(fundo, 0, 0, null);

        if (telaInicial) {
            graficos.setColor(Color.WHITE);
            graficos.setFont(new Font("Arial", Font.BOLD, 40));
            graficos.drawString("SPACE WAR", 360, 300);
            graficos.setFont(new Font("Arial", Font.PLAIN, 20));
            graficos.drawString("Clique com o mouse ou pressione qualquer tecla para começar", 250, 340);
        } else if (emJogo) {
            graficos.drawImage(player.getImage(), player.getX(), player.getY(), this);

            for (Tiro tiro : player.getTiros()) {
                graficos.drawImage(tiro.getImage(), tiro.getX(), tiro.getY(), this);
            }

            for (Enemy1 in : enemy1) {
                graficos.drawImage(in.getImage(), in.getX(), in.getY(), this);
            }

            for (Stars star : stars) {
                graficos.setColor(Color.WHITE);
                graficos.fillOval(star.getX(), star.getY(), 2, 2);
            }

            graficos.setColor(Color.YELLOW);
            graficos.setFont(new Font("Arial", Font.BOLD, 20));
            graficos.drawString("PONTOS: " + pontuacao, 10, 20);
            graficos.drawString("VIDAS: " + vidas, 10, 45);

        } else if (gameOver) {
            graficos.setColor(Color.RED);
            graficos.setFont(new Font("Arial", Font.BOLD, 30));
            graficos.drawString("FIM DE JOGO", 350, 300);

            graficos.setColor(Color.YELLOW);
            graficos.setFont(new Font("Arial", Font.PLAIN, 20));
            graficos.drawString("Jogador: " + nomeJogador, 360, 330);
            graficos.drawString("Sua pontuação: " + pontuacao, 360, 360);

            graficos.drawString("Recordes:", 400, 390);
            int y = 420;
            for (int i = 0; i < Math.min(10, records.size()); i++) {
                if (i == 0) {
                    graficos.setColor(Color.ORANGE);
                    graficos.setFont(new Font("Arial", Font.BOLD, 22));
                    graficos.drawString("🥇 " + (i + 1) + "º - " + records.get(i), 360, y);
                } else {
                    graficos.setColor(Color.WHITE);
                    graficos.setFont(new Font("Arial", Font.PLAIN, 18));
                    graficos.drawString((i + 1) + "º - " + records.get(i), 370, y);
                }
                y += 25;
            }
        }

        Toolkit.getDefaultToolkit().sync();
        g.dispose();
    }

    @Override
    public void actionPerformed(ActionEvent e) {
        if (!emJogo) {
            repaint();
            return;
        }

        if (enemy1.size() < 20) {
            int x = (int) (Math.random() * 800 + 1024);
            int y = (int) (Math.random() * 600);
            enemy1.add(new Enemy1(x, y));
        }

        List<Tiro> tiros = player.getTiros();
        Iterator<Tiro> itTiros = tiros.iterator();
        while (itTiros.hasNext()) {
            Tiro tiro = itTiros.next();
            if (tiro.isVisivel()) {
                tiro.update();
            } else {
                itTiros.remove();
            }
        }

        Iterator<Enemy1> itInimigos = enemy1.iterator();
        while (itInimigos.hasNext()) {
            Enemy1 inimigo = itInimigos.next();
            if (inimigo.isVisivel()) {
                inimigo.update();
            } else {
                itInimigos.remove();
                pontuacao += 10;
            }
        }

        for (Stars star : stars) {
            star.update();
        }

        player.update();

        Rectangle rPlayer = player.getBounds();
        List<Enemy1> inimigosParaRemover = new ArrayList<>();
        List<Tiro> tirosParaRemover = new ArrayList<>();

        for (Tiro tiro : tiros) {
            Rectangle rTiro = tiro.getBounds();
            for (Enemy1 inimigo : enemy1) {
                Rectangle rInimigo = inimigo.getBounds();
                if (rTiro.intersects(rInimigo)) {
                    Som.tocar("/res/som_explosao.wav");
                    tirosParaRemover.add(tiro);
                    inimigosParaRemover.add(inimigo);
                    pontuacao += 10;
                }
            }
        }

        tiros.removeAll(tirosParaRemover);
        enemy1.removeAll(inimigosParaRemover);

        for (Enemy1 inimigo : enemy1) {
            if (rPlayer.intersects(inimigo.getBounds())) {
                inimigo.setVisivel(false);
                vidas--;
                if (vidas <= 0) {
                    player.setVisivel(false);
                    emJogo = false;
                    gameOver = true;
                    atualizarRecordes();
                }
            }
        }

        repaint();
    }

    @Override
    public void keyPressed(KeyEvent e) {
        if (telaInicial && !emJogo) {
            iniciarJogoSeNecessario();
        } else if (gameOver && e.getKeyCode() == KeyEvent.VK_ENTER) {
            reiniciarJogo();
        } else if (emJogo) {
            player.keyPressed(e);
        }
    }

    @Override
    public void keyReleased(KeyEvent e) {
        if (emJogo) {
            player.keyReleased(e);
        }
    }

    @Override
    public void keyTyped(KeyEvent e) {}

    private void loadRecords() {
        records = new ArrayList<>();
        File file = new File(RECORDS_FILE);
        if (file.exists()) {
            try (BufferedReader reader = new BufferedReader(new FileReader(file))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    records.add(line);
                }
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
    }

    private void atualizarRecordes() {
        records.add(nomeJogador + " - " + pontuacao);
        records.sort((a, b) -> {
            try {
                int pontosA = Integer.parseInt(a.substring(a.lastIndexOf('-') + 1).trim());
                int pontosB = Integer.parseInt(b.substring(b.lastIndexOf('-') + 1).trim());
                return Integer.compare(pontosB, pontosA);
            } catch (NumberFormatException ex) {
                return 0;
            }
        });

        try (BufferedWriter writer = new BufferedWriter(new FileWriter(RECORDS_FILE))) {
            for (int i = 0; i < Math.min(10, records.size()); i++) {
                writer.write(records.get(i));
                writer.newLine();
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    private void reiniciarJogo() {
        player = new Player();
        player.load();
        inicializaInimigos();
        inicializaEstrelas();
        vidas = 3;
        pontuacao = 0;
        emJogo = true;
        gameOver = false;
    }
}
