package navinha;

import java.io.BufferedInputStream;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;
import javax.sound.sampled.*;

/**
 * Sistema de som. Cada efeito é carregado uma vez em algumas "vozes" (clips)
 * reaproveitadas — antes um Clip novo era criado a cada explosão e nunca
 * fechado, o que ia consumindo memória e travando o áudio.
 */
public final class Som {

    private static final Map<String, Clip[]> efeitos = new HashMap<>();
    private static final Map<String, Integer> proxima = new HashMap<>();
    private static Clip musica;
    private static boolean mudo = false;
    private static boolean disponivel = true;

    private Som() {}

    public static void carregarTudo() {
        carregar("tiro", "/res/som_tiro.wav", 6, -14f);
        carregar("explosao", "/res/som_explosao.wav", 6, -12f);
        carregar("powerup", "/res/powerup.wav", 2, -6f);
        carregar("dano", "/res/dano.wav", 2, -4f);
        carregar("alerta", "/res/alerta.wav", 1, -8f);
        carregar("especial", "/res/especial.wav", 2, -6f);
        carregar("bomba", "/res/bomba.wav", 2, -3f);
        carregar("acerto", "/res/acerto.wav", 4, -16f);
        carregar("menu", "/res/menu.wav", 2, -10f);
    }

    private static Clip abrir(String caminho, float ganho) throws Exception {
        InputStream in = Som.class.getResourceAsStream(caminho);
        if (in == null) throw new IllegalArgumentException("Som não encontrado: " + caminho);
        AudioInputStream audio = AudioSystem.getAudioInputStream(new BufferedInputStream(in));
        Clip clip = AudioSystem.getClip();
        clip.open(audio);
        if (clip.isControlSupported(FloatControl.Type.MASTER_GAIN)) {
            FloatControl vol = (FloatControl) clip.getControl(FloatControl.Type.MASTER_GAIN);
            vol.setValue(Math.max(vol.getMinimum(), Math.min(vol.getMaximum(), ganho)));
        }
        return clip;
    }

    private static void carregar(String nome, String caminho, int vozes, float ganho) {
        if (!disponivel) return;
        try {
            Clip[] clips = new Clip[vozes];
            for (int i = 0; i < vozes; i++) clips[i] = abrir(caminho, ganho);
            efeitos.put(nome, clips);
            proxima.put(nome, 0);
        } catch (Exception e) {
            System.err.println("Som indisponível (" + nome + "): " + e.getMessage());
            if (e instanceof LineUnavailableException || e instanceof IllegalArgumentException
                    && e.getMessage() != null && e.getMessage().contains("line")) {
                disponivel = false;
            }
        }
    }

    public static void tocar(String nome) {
        if (mudo || !disponivel) return;
        Clip[] clips = efeitos.get(nome);
        if (clips == null) return;
        int i = proxima.get(nome);
        proxima.put(nome, (i + 1) % clips.length);
        Clip c = clips[i];
        c.stop();
        c.setFramePosition(0);
        c.start();
    }

    public static void iniciarMusica() {
        if (!disponivel) return;
        try {
            if (musica == null) musica = abrir("/res/musica_fundo.wav", -24f);
            if (!mudo) musica.loop(Clip.LOOP_CONTINUOUSLY);
        } catch (Exception e) {
            System.err.println("Música indisponível: " + e.getMessage());
        }
    }

    public static boolean alternarMudo() {
        mudo = !mudo;
        if (musica != null) {
            if (mudo) musica.stop();
            else musica.loop(Clip.LOOP_CONTINUOUSLY);
        }
        return mudo;
    }

    public static boolean isMudo() {
        return mudo;
    }
}
