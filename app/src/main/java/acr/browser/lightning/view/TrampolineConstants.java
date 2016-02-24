package acr.browser.lightning.view;

/**
 * @author Stefano Pacifici
 * @date 2016/02/25
 */
public class TrampolineConstants {
    private TrampolineConstants() {} // No instances

    public static final String CLIQZ_SCHEME = "cliqz";
    public static final String CLIQZ_TRAMPOLINE_AUTHORITY = "trampoline";
    public static final String CLIQZ_TRAMPOLINE_FORWARD = "/goto.html";
    public static final String CLIQZ_TRAMPOLINE_SEARCH = "/search.html";
    public static final String CLIQZ_TRAMPOLINE_CLOSE = "/close.html";
    public static final String CLIQZ_TRAMPOLINE_HISTORY = "/history.html";

    public static final String CLIQZ_TRAMPOLINE_PREFIX = String.format("%s://%s", CLIQZ_SCHEME, CLIQZ_TRAMPOLINE_AUTHORITY);
}
