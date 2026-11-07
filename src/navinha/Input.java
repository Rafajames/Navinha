package navinha;

import java.awt.event.FocusAdapter;
import java.awt.event.FocusEvent;
import java.awt.event.KeyAdapter;
import java.awt.event.KeyEvent;
import java.util.Arrays;

/**
 * Guarda o estado do teclado. Resolve o problema antigo de a nave parar
 * quando se soltava uma seta enquanto outra ainda estava pressionada.
 */
public class Input extends KeyAdapter {

    private final boolean[] baixo = new boolean[1024];
    private final boolean[] apertou = new boolean[1024];
    private final StringBuilder digitado = new StringBuilder();

    public final FocusAdapter foco = new FocusAdapter() {
        @Override
        public void focusLost(FocusEvent e) {
            Arrays.fill(baixo, false);
        }
    };

    @Override
    public void keyPressed(KeyEvent e) {
        int c = e.getKeyCode();
        if (c >= 0 && c < baixo.length) {
            if (!baixo[c]) apertou[c] = true;
            baixo[c] = true;
        }
    }

    @Override
    public void keyReleased(KeyEvent e) {
        int c = e.getKeyCode();
        if (c >= 0 && c < baixo.length) baixo[c] = false;
    }

    @Override
    public void keyTyped(KeyEvent e) {
        char ch = e.getKeyChar();
        if (ch != KeyEvent.CHAR_UNDEFINED) digitado.append(ch);
    }

    /** Alguma das teclas está sendo segurada? */
    public boolean segurando(int... codigos) {
        for (int c : codigos) if (baixo[c]) return true;
        return false;
    }

    /** Alguma das teclas foi apertada neste quadro? */
    public boolean apertou(int... codigos) {
        for (int c : codigos) if (apertou[c]) return true;
        return false;
    }

    public boolean confirmar() {
        return apertou(KeyEvent.VK_ENTER, KeyEvent.VK_SPACE);
    }

    public boolean voltar() {
        return apertou(KeyEvent.VK_ESCAPE, KeyEvent.VK_BACK_SPACE);
    }

    public String consumirDigitado() {
        String s = digitado.toString();
        digitado.setLength(0);
        return s;
    }

    /** Chamado ao fim de cada atualização da lógica. */
    public void fimDoQuadro() {
        Arrays.fill(apertou, false);
    }

    public void limpar() {
        Arrays.fill(apertou, false);
        digitado.setLength(0);
    }
}
