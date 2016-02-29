![Android Browser Icon][icon]

[icon]: ic_launcher_small.png

# CLIQZ Browser for Android

The CLIQZ Browser for Android. Originally a fork of [Anthony Restaino](https://github.com/anthonycr)'s [Lightning Browser](https://github.com/anthonycr/Lightning-Browser).

## How to clone and start hacking

Run these commands in a shell:

```bash
$> git clone git@github.com:cliqz/android-browser.git
$> cd android-browser
$> git submodule init
$> git submodule update
```

You can compile the project using the the gradle wrapper on the command line:

```bash
$> ./gradlew assembleStandardDebug
```

Please notice you have to have the [Android SDK](http://developer.android.com/sdk/index.html). On Mac OSX, the latter can be installed using brew:

```bash
$> brew install android
```

Then, some Android submodule must be installed by using the __Android SDK Manager__:

```bash
$> android
```

The minimal set of packets to build the project is:

* Android SDK Tools (24.4.1+)
* Android SDK Platform-tools (23.1+)
* Android SDK Build-tools (23.0.2+)
* SDK Platform (23+, Android 6.0)
* Android Support Repository (25+)
* Android Support Library (23.1.1+)

You need also to set an environment variable:

```bash
$> export ANDROID_HOME=<path_to_android>
```

Replace *path_to_android* with the correct Android installation path (i.e. `usr/local/Cellar/android-sdk/24.4.1_1`). Alternately, a file called `local.properties` can be created in the project root. It should contain a single line containing the *sdk.dir* variable declaration. Below, an example of the file content:

```java
sdk.dir=/usr/local/Cellar/android-sdk/24.4.1_1
```

## Flavors

The project has two flavors:

* Standard
* XWalk

### Standard

Compile the standard version that uses the phone WebView to render the navigation extension. It supports only devices from Android 5.0 (21) up. The flavor produce a small APK (almost 6MB).

Command examples
* Build standard debug APK: `$> ./gradlew assembleStandardDebug`
* Build standard release APK: `$> ./gradlew assembleStandardRelease`
* Install the debug version on a single device connect using USB cable: `$> ./gradlew installStandardDebug`

### XWalk

Compile a version that uses the [Crosswalk Project](https://crosswalk-project.org/) WebView to render the navigation extension. It supports devices starting from Android 4.0 (14) up. Due to the external WebView used, the generated APK is pretty big (more than 23MB) and architecture dependent (only ARM devices, no X86, no MIPS).

Command examples
* Build XWalk debug APK: `$> ./gradlew assembleXwalkDebug`
* Build XWalk release APK: `$> ./gradlew assembleXwalkRelease`
* Install the debug version on a single device connect using USB cable: `$> ./gradlew installXwalkDebug`
