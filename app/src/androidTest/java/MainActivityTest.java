import android.support.test.espresso.web.webdriver.Locator;
import android.support.test.rule.ActivityTestRule;
import android.support.test.runner.AndroidJUnit4;
import android.test.suitebuilder.annotation.LargeTest;

import com.cliqz.browser.main.MainActivity;

import org.hamcrest.Matchers;
import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;

import acr.browser.lightning.R;

import static android.support.test.espresso.Espresso.onView;
import static android.support.test.espresso.Espresso.pressBack;
import static android.support.test.espresso.action.ViewActions.click;
import static android.support.test.espresso.action.ViewActions.swipeLeft;
import static android.support.test.espresso.action.ViewActions.swipeRight;
import static android.support.test.espresso.action.ViewActions.typeText;
import static android.support.test.espresso.action.ViewActions.typeTextIntoFocusedView;
import static android.support.test.espresso.matcher.ViewMatchers.withClassName;
import static android.support.test.espresso.matcher.ViewMatchers.withId;
import static android.support.test.espresso.web.assertion.WebViewAssertions.webContent;
import static android.support.test.espresso.web.matcher.DomMatchers.hasElementWithId;
import static android.support.test.espresso.web.sugar.Web.onWebView;
import static android.support.test.espresso.web.webdriver.DriverAtoms.findElement;
import static android.support.test.espresso.web.webdriver.DriverAtoms.webClick;

/**
 * Created by Ravjit on 21/12/15.
 */
@RunWith(AndroidJUnit4.class)
@LargeTest
public class MainActivityTest {

    @Rule
    public ActivityTestRule<MainActivity> mActivityRule = new ActivityTestRule<MainActivity>(MainActivity.class);

    //delays added to wait for the results/page to load
    @Test
    public void testSearch() throws InterruptedException {
        onView(withId(R.id.search_edit_text)).perform(typeText("rafael nadal wiki"));
        Thread.sleep(3000);
        onWebView(withClassName(Matchers.containsString("SearchWebView"))).check(webContent(hasElementWithId("ez-0")));
        Thread.sleep(1500);
        onView(withClassName(Matchers.containsString("SearchWebView"))).perform(swipeLeft());
        Thread.sleep(1500);
        onView(withClassName(Matchers.containsString("SearchWebView"))).perform(swipeRight());
        Thread.sleep(1500);
        onView(withClassName(Matchers.containsString("SearchWebView"))).perform(swipeLeft());
        Thread.sleep(1500);
        onWebView(withClassName(Matchers.containsString("SearchWebView"))).withElement(findElement(Locator.ID, "ez-0")).perform(webClick());
        Thread.sleep(10000);
        onView(withId(R.id.title_bar)).perform(click());
        Thread.sleep(1500);
        onView(withId(R.id.search_edit_text)).perform(typeTextIntoFocusedView("roger federer wiki"));
        Thread.sleep(2500);
        onWebView(withClassName(Matchers.containsString("SearchWebView"))).withElement(findElement(Locator.ID, "ez-0")).perform(webClick());
        Thread.sleep(10000);
    }

    /*
    @Test
    public void testLayerChange() {
        onView(withId(R.id.menu_history)).perform(click());
        pressBack();
        onView(withId(R.id.menu_suggestions)).perform(click());
        pressBack();
    }

    @Test
    public void testFreshTab() throws InterruptedException {
        onView(withId(R.id.menu_suggestions)).perform(click());
        Thread.sleep(5000);
        onWebView(withClassName(Matchers.containsString("FreshTabWebView"))).check(webContent(hasElementWithId("startingpoint")));
    }
    */

}
