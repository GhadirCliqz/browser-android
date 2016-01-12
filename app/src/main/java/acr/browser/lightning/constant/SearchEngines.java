package acr.browser.lightning.constant;

/**
 * @author Stefano Pacifici
 * @date 2016/01/11
 */
public enum SearchEngines {

    custom(new SearchEngine() {
        @Override
        public String getName() {
            return "Custom";
        }

        @Override
        public String getSearchUrl() {
            return null;
        }
    }),

    google("Google", Constants.GOOGLE_SEARCH),
    ask("Ask", Constants.ASK_SEARCH),
    bing("Bing", Constants.BING_SEARCH),
    yahoo("Yahoo", Constants.YAHOO_SEARCH),
    startpage("Startpage", Constants.STARTPAGE_SEARCH),
    startpageMobile("Startpage Mobile", Constants.STARTPAGE_MOBILE_SEARCH),
    duckDuckGo("DuckDuckGo", Constants.DUCK_SEARCH),
    duckDuckGoLite("DuckDuckGoLite", Constants.DUCK_LITE_SEARCH),
    baidu("Baidu", Constants.BAIDU_SEARCH),
    yandex("Yandex", Constants.YANDEX_SEARCH);

    interface SearchEngine {
        String getName();
        String getSearchUrl();
    }

    private final SearchEngine engine;

    SearchEngines(SearchEngine engine) {
        this.engine = engine;
    }

    SearchEngines(final String name, final String url) {
        this.engine = new SearchEngine() {
            @Override
            public String getName() {
                return name;
            }

            @Override
            public String getSearchUrl() {
                return url;
            }
        };
    }

    public String getName() { return engine.getName(); }

    public String getSearchUrl() { return engine.getSearchUrl(); }

}
