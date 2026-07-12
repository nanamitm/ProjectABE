# ProjectABE
ArduBoyEmulator and IDE in HTML5

ProjectABEは、ブラウザ・Windows（Electron）・Androidで動作するArduboyエミュレーター兼IDEです。

## 開発環境の準備

```powershell
git clone https://github.com/nanamitm/ProjectABE.git
cd ProjectABE
npm install
```

Node.js 20以降を推奨します。Arduino IDE 2.xを使ったローカルビルドでは、Arduino AVR Boardsと必要なライブラリもArduino IDE側にインストールしてください。

## 補助ツール

    npm install -g gulp-cli
    npm install -g serve
    npm install -g cordova   # optional, for android build only
ローカルWeb版を確認する場合:

```powershell
npm run build:web
npx serve build
```

### Windows版（Electron）

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

署名なしのインストーラーはWindows SmartScreenの警告が表示されることがあります。動作確認だけなら、アンパック版の `dist-electron/win-unpacked` をインストール先へコピーして起動できます。

Web and mobile bundles can be built without Gulp:

    npm run build:web
    npm run build:mobile

### Android版

The Android build is available with:

    npm run build:android

It requires Android SDK, JDK 17 or later, and Gradle or Android Studio. The
Cordova Android platform is managed at version 15.x.

接続した実機を確認してから、デバッグAPKを作成します。

```powershell
adb devices
npm run build:android
```

デバッグAPKは通常、次に生成されます。

```text
build/platforms/android/app/build/outputs/apk/debug/app-debug.apk
```

実機へインストールする場合:

```powershell
adb install -r build/platforms/android/app/build/outputs/apk/debug/app-debug.apk
```

### Web版の公開

静的ファイルを `build` に生成します。

```powershell
npm run build:web
```

Cloudflare Pagesへ初回公開する場合:

```powershell
npx wrangler login
npx wrangler pages project create projectabe --production-branch master
npx wrangler pages deploy build --project-name projectabe
```

2回目以降はビルド後にデプロイだけ実行します。

```powershell
npm run build:web
npx wrangler pages deploy build --project-name projectabe
```

現在の公開URLは [https://projectabe.pages.dev/](https://projectabe.pages.dev/) です。`functions/api/cors.js` もPages Functionsとして同時に公開され、外部リポジトリ取得時のCORSプロキシとして使用されます。

## 配布前チェック

1. 起動してエミュレーター画面が表示される
2. `New Game` でプロジェクト名ダイアログが表示される
3. ソース編集後に保存される
4. HEXファイルの読み込みとダウンロードができる
5. WindowsではBuild、AndroidではAPK起動、Webでは外部リポジトリ読み込みを確認する
6. 配布物に不要な過去プロジェクトのソースが含まれていない


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
