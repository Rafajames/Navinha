package navinha;

import javax.sound.sampled.*;
import java.io.IOException;
import java.net.URL;

public class Som {

    public static void tocar(String caminho) {
        try {
            URL url = Som.class.getResource(caminho);
            AudioInputStream audioIn = AudioSystem.getAudioInputStream(url);
            Clip clip = AudioSystem.getClip();
            clip.open(audioIn);
            ajustarVolume(clip, -15.0f); // volume entre 0.0 (máximo) e -80.0 (mínimo)
            clip.start();
        } catch (UnsupportedAudioFileException | IOException | LineUnavailableException e) {
            e.printStackTrace();
        }
    }

    public static void tocarLoop(String caminho) {
        try {
            URL url = Som.class.getResource(caminho);
            AudioInputStream audioIn = AudioSystem.getAudioInputStream(url);
            Clip clip = AudioSystem.getClip();
            clip.open(audioIn);
            ajustarVolume(clip, -30.0f); // música de fundo mais baixa
            clip.loop(Clip.LOOP_CONTINUOUSLY);
        } catch (UnsupportedAudioFileException | IOException | LineUnavailableException e) {
            e.printStackTrace();
        }
    }

    private static void ajustarVolume(Clip clip, float ganhoDB) {
        if (clip.isControlSupported(FloatControl.Type.MASTER_GAIN)) {
            FloatControl volume = (FloatControl) clip.getControl(FloatControl.Type.MASTER_GAIN);
            volume.setValue(ganhoDB); // Ex: -10.0f deixa o som mais baixo
        }
    }

    public static void tocarComVolume(String caminho, float ganhoDB) {
        try {
            URL url = Som.class.getResource(caminho);
            if (url == null) {
                System.out.println("Arquivo de som não encontrado: " + caminho);
                return;
            }
            AudioInputStream audioIn = AudioSystem.getAudioInputStream(url);
            Clip clip = AudioSystem.getClip();
            clip.open(audioIn);
            ajustarVolume(clip, ganhoDB);
            clip.start();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
    
    
}
