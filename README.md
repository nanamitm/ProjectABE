# ProjectABE
ArduBoyEmulator and IDE in HTML5

ProjectABE is an Arduboy emulator and IDE that runs in the browser, on Windows (Electron), and on Android.

## Development setup

```powershell
git clone https://github.com/nanamitm/ProjectABE.git
cd ProjectABE
npm install
```

Node.js 20 or later is recommended. For local builds with Arduino IDE 2.x, install Arduino AVR Boards and the required libraries in Arduino IDE first.

## Optional tools

    npm install -g gulp-cli
    npm install -g serve
    npm install -g cordova   # optional, for android build only
To preview the local web build:

```powershell
npm run build:web
npx serve build
```

### Windows (Electron)

    npm run build:electron

The generated desktop files are placed in `build`. Desktop-only values such as
the command-line arguments and user-data directory are exposed to the renderer
through a small preload/IPC bridge.

To run the Electron checks:

    npm run test:electron

The desktop IDE uses the local compiler when Arduino IDE 2.x is installed. The
bundled `arduino-cli` is detected automatically; Arduino AVR Boards must be
installed in Arduino IDE for local builds.

To create an unpacked Windows distribution:

    npm run package:electron

The result is written to `dist-electron/win-unpacked`.

To create the Windows installer:

    npm run package:electron:installer

The installer is written to `dist-electron`.

The generated installer is unsigned unless electron-builder signing
environment variables are configured. For a signed release, provide
`CSC_LINK` and `CSC_KEY_PASSWORD` before running the installer build.

The unsigned installer may trigger a Windows SmartScreen warning. For testing, you can copy the unpacked build from `dist-electron/win-unpacked` to an installation directory and run it directly.

Web and mobile bundles can be built without Gulp:

    npm run build:web
    npm run build:mobile

### Android

The Android build is available with:

    npm run build:android

It requires Android SDK, JDK 17 or later, and Gradle or Android Studio. The
Cordova Android platform is managed at version 15.x.

Check that the target device is connected, then build the debug APK.

```powershell
adb devices
npm run build:android
```

The debug APK is normally generated at:

```text
build/platforms/android/app/build/outputs/apk/debug/app-debug.apk
```

To install it on a connected device:

```powershell
adb install -r build/platforms/android/app/build/outputs/apk/debug/app-debug.apk
```

### Web deployment

Build the static files into `build`:

```powershell
npm run build:web
```

For the first deployment to Cloudflare Pages:

```powershell
npx wrangler login
npx wrangler pages project create projectabe --production-branch master
npx wrangler pages deploy build --project-name projectabe
```

For subsequent deployments, build and deploy the output:

```powershell
npm run build:web
npx wrangler pages deploy build --project-name projectabe
```

The current public URL is [https://projectabe.pages.dev/](https://projectabe.pages.dev/). `functions/api/cors.js` is deployed as a Pages Function and provides the CORS proxy used when loading external repositories.

## Distribution checklist

1. Launch the app and verify that the emulator screen is displayed.
2. Verify that `New Game` opens the project name dialog.
3. Edit source code and verify that it is saved.
4. Verify HEX file loading and downloading.
5. Verify Windows builds, Android APK startup, and external repository loading on the web.
6. Verify that distribution packages do not include source files from unrelated previous projects.


# Running the emulator

The emulator can be used in one of the following ways:
- Go to https://projectabe.pages.dev/, pick a game and play.
- Download one of the offline builds [here](https://github.com/felipemanga/ProjectABE/releases) and run it.

If you want to use the online emulator, you can run a HEX/Arduboy directly by adding it to the URL like this:
https://projectabe.pages.dev/?url=https://site/file.hex

Offline is similar, if you have the executable in your PATH:

    ProjectABE /path/to/file.hex

You can also drag-and-drop a hex/arduboy file into the game list to play it.

### Build comparison


| Feature | Browser | Windows | Linux | OS X  | Android |
| ------- | :-----: | :-----: | :---: | :---: | :---: |
| Emulator | Yes | Yes | Yes | Yes | Yes |
| IDE | Yes | Yes | Yes | Yes | Yes |
| Compiler | Cloud | Local | Local | Local | Cloud |
| Uploader | No | Yes | Yes | Yes | No |


# Emulator interface

You can play by touching the buttons, if you have a touchscreen. If your device has a keyboard, use the **arrow keys** and <kbd>Ctrl</kbd>/<kbd>**A**</kbd>/<kbd>Z</kbd> for button A and <kbd>Alt</kbd>/<kbd>**B**</kbd>/<kbd>S</kbd>/<kbd>X</kbd> for button B. Joysticks/pads are also supported, if your browser supports the gamepad API.

Press <kbd>**F**</kbd> to toggle fullscreen mode.

You can start/stop recording a GIF of the game by pressing <kbd>**R**</kbd>. If you want a PNG screenshot, press <kbd>**P**</kbd>.

To exit a game and go back to the list, press <kbd>**Esc**</kbd> or click on the **power button** above the screen.

Some games look/play better on a vertical screen, like [1943](https://felipemanga.github.io/ProjectABE/?url=https://raw.githubusercontent.com/eried/ArduboyCollection/master/Arcade%2F1943%2F1943.hex) or [Breakout-V](https://felipemanga.github.io/ProjectABE/?url=http://www.crait.net/arduboy/breakoutv/app.hex). The emulator can be put in vertical mode by clicking on the **chip in the lower-right** of the Arduboy's screen.

Aside from the standard Arduboy and Microcard, other skins are available. Press <kbd>**F3**</kbd> to cycle through them. You can specify which skin to load by adding a parameter to the URL (`?hex=game.hex&skin=Tama`) or the commandline (`ProjectABE --skin=Tama game.hex`).

If you want to debug the game you're currently playing, click on the **USB port** (bottom-center).
To upload the game to your Arduboy, press <kbd>**U**</kbd> (offline version only).

### Keyboard bindings:

| Key | Function |
| :---: | -------- |
| Arrow keys | Arrow keys |
| <kbd>Ctrl</kbd>/<kbd>A</kbd>/<kbd>Z</kbd> | Button A |
| <kbd>Alt</kbd>/<kbd>B</kbd>/<kbd>S</kbd>/<kbd>X</kbd> | Button B |
| <kbd>F</kbd> | Fullscreen |
| <kbd>R</kbd> | Record GIF |
| <kbd>P</kbd> | PNG screenshot |
| <kbd>Esc</kbd> | Exit game |
| <kbd>F3</kbd> | Change skin |
| <kbd>U</kbd> | Upload to physical device |
| <kbd>F6</kbd> | Reset game |

# IDE / Debugger

ProjectABE includes an IDE (based on the awesome [Ace](https://ace.c9.io) editor). It allows you to write, build and debug Arduboy games in your browser, without installing anything on your computer. Since it's a work-in-progress, the edges are still rough, but it's already possible to make entire games in it (see [Hello, Commander](https://felipemanga.github.io/ProjectABE/?url=https://github.com/felipemanga/HelloCommander)).

If you have an existing project, you can drag-and-drop code (or a zip file containing code) into the editor. If your project is on github or bitbucket, the IDE can load your code from there by pointing ProjectABE to your repository like this:
https://felipemanga.github.io/ProjectABE/?url=https://github.com/felipemanga/HelloCommander

To use the IDE in the Windows, Linux, and OS X builds, you need to have the Arduino IDE installed. You will also need to install the necessary libraries. Projects will be loaded from the Arduino Sketchbook folder.

You can also drag-and-drop images to have them converted into source code, ready to be used with the Arduboy2 library, with an ascii-art preview (dashes are transparent, spaces are black, and sharps white):

<img src="https://cdn.rawgit.com/felipemanga/9eaa3e96f4776aa36a0420c29d745b5d/raw/c27b632c6bcdc4cde50ab68d2671158068da54af/Walk.svg">

Simply ignore the arrays you do not need and GCC will not add them to the final build.

### IDE Keyboard shortcuts:

| Key | Function |
| :---: | --- |
| <kbd>Ctrl</kbd>-<kbd>Enter</kbd> | Build and run |
| <kbd>Ctrl</kbd>-<kbd>P</kbd> | Jump to file |
| <kbd>F6</kbd> | Reset |
| <kbd>F7</kbd> | Step-In |
| <kbd>F8</kbd> | Resume |
