package navinha;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Properties;

/**
 * Salva os recordes (records.txt) e o progresso do jogador (progresso.properties):
 * naves desbloqueadas, desafios concluídos e último nome usado.
 */
public final class Dados {

    public static class Recorde {
        public final String nome, fase, nave;
        public final int pontos;

        Recorde(String nome, int pontos, String fase, String nave) {
            this.nome = nome;
            this.pontos = pontos;
            this.fase = fase;
            this.nave = nave;
        }
    }

    private static final String ARQ_RECORDES = "records.txt";
    private static final String ARQ_PROGRESSO = "progresso.properties";
    private static final List<Recorde> recordes = new ArrayList<>();
    private static final Properties prog = new Properties();

    private Dados() {}

    public static void carregar() {
        recordes.clear();
        File f = new File(ARQ_RECORDES);
        if (f.exists()) {
            try (BufferedReader r = new BufferedReader(new InputStreamReader(new FileInputStream(f), StandardCharsets.UTF_8))) {
                String linha;
                while ((linha = r.readLine()) != null) {
                    linha = linha.trim();
                    if (linha.isEmpty()) continue;
                    try {
                        if (linha.contains(";")) {
                            String[] p = linha.split(";");
                            recordes.add(new Recorde(p[0], Integer.parseInt(p[1].trim()), p.length > 2 ? p[2] : "-", p.length > 3 ? p[3] : "-"));
                        } else {
                            // formato antigo: "Nome - 1234"
                            int i = linha.lastIndexOf('-');
                            recordes.add(new Recorde(linha.substring(0, i).trim(), Integer.parseInt(linha.substring(i + 1).trim()), "-", "-"));
                        }
                    } catch (Exception ignorada) {
                        // linha inválida: pula
                    }
                }
            } catch (IOException e) {
                System.err.println("Não foi possível ler os recordes: " + e.getMessage());
            }
        }
        ordenar();
        File fp = new File(ARQ_PROGRESSO);
        if (fp.exists()) {
            try (InputStream in = new FileInputStream(fp)) {
                prog.load(in);
            } catch (IOException e) {
                System.err.println("Não foi possível ler o progresso: " + e.getMessage());
            }
        }
    }

    private static void ordenar() {
        recordes.sort((a, b) -> Integer.compare(b.pontos, a.pontos));
        while (recordes.size() > 10) recordes.remove(recordes.size() - 1);
    }

    public static List<Recorde> getRecordes() {
        return recordes;
    }

    public static boolean entraNoRanking(int pontos) {
        return pontos > 0 && (recordes.size() < 10 || pontos > recordes.get(recordes.size() - 1).pontos);
    }

    /** Adiciona e retorna a posição (0 a 9), ou -1 se não entrou. */
    public static int adicionarRecorde(String nome, int pontos, String fase, String nave) {
        Recorde novo = new Recorde(nome.replace(";", ""), pontos, fase, nave);
        recordes.add(novo);
        ordenar();
        try (Writer w = new OutputStreamWriter(new FileOutputStream(ARQ_RECORDES), StandardCharsets.UTF_8)) {
            for (Recorde r : recordes) w.write(r.nome + ";" + r.pontos + ";" + r.fase + ";" + r.nave + "\n");
        } catch (IOException e) {
            System.err.println("Não foi possível salvar os recordes: " + e.getMessage());
        }
        return recordes.indexOf(novo);
    }

    // ------------------------------------------------------------------ progresso

    public static boolean desbloqueada(NaveTipo n) {
        switch (n) {
            case TITA:     return "1".equals(prog.getProperty("tita"));
            case FANTASMA: return desafiosConcluidos() >= 3;
            default:       return true;
        }
    }

    public static void desbloquearTita() {
        prog.setProperty("tita", "1");
        salvarProgresso();
    }

    public static int desafiosConcluidos() {
        try {
            return Integer.parseInt(prog.getProperty("desafios", "0"));
        } catch (NumberFormatException e) {
            return 0;
        }
    }

    public static void somarDesafio() {
        prog.setProperty("desafios", String.valueOf(desafiosConcluidos() + 1));
        salvarProgresso();
    }

    public static String ultimoNome() {
        return prog.getProperty("nome", "");
    }

    public static void salvarNome(String nome) {
        prog.setProperty("nome", nome);
        salvarProgresso();
    }

    private static void salvarProgresso() {
        try (OutputStream out = new FileOutputStream(ARQ_PROGRESSO)) {
            prog.store(out, "Progresso do Navinha Espacial");
        } catch (IOException e) {
            System.err.println("Não foi possível salvar o progresso: " + e.getMessage());
        }
    }
}
