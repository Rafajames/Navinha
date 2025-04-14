package navinha;

import javax.sound.sampled.*;
import java.net.URL;

public class SomTiro {

    private Clip clip;

    public SomTiro() {
        try {
            URL url = getClass().getResource("/res/som_tiro.wav");
            if (url == null) {
                System.out.println("Som do tiro não encontrado!");
                return;
            }

            AudioInputStream audioIn = AudioSystem.getAudioInputStream(url);
            clip = AudioSystem.getClip();
            clip.open(audioIn);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public void tocar(float ganhoDB) {
        if (clip != null) {
            // Resetar o áudio para começar do início
            clip.setFramePosition(1);
            ajustarVolume(clip, ganhoDB -1.0f);
            clip.start();
        }
    }

    private void ajustarVolume(Clip clip, float ganhoDB) {
        if (clip.isControlSupported(FloatControl.Type.MASTER_GAIN)) {
            FloatControl volume = (FloatControl) clip.getControl(FloatControl.Type.MASTER_GAIN);
            volume.setValue(ganhoDB);
        }
    }
}
