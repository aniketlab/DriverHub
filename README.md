<p align="center">
  <img src="assets/logo/driverhub_logo_with_tagline.png" alt="Driver Hub Logo" width="560" />
</p>

<p align="center">
  <strong>The Ultimate All-in-One Android Driver Installer, Live Device Monitor & Platform-Tools Environment Manager for Windows.</strong>
</p>

<p align="center">
  <a href="https://github.com/aniketlab/DriverHub/releases"><img src="https://img.shields.io/badge/version-1.0.0-emerald?style=flat-square" alt="Version 1.0.0" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="MIT License" /></a>
  <a href="https://github.com/aniketlab/DriverHub"><img src="https://img.shields.io/badge/platform-Windows%2010%20%7C%2011%20(x64)-slate?style=flat-square&logo=windows" alt="Platform" /></a>
  <a href="https://electronjs.org"><img src="https://img.shields.io/badge/Electron-30.0-47848F?style=flat-square&logo=electron" alt="Electron" /></a>
  <a href="https://react.dev"><img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react" alt="React 19" /></a>
  <a href="https://tailwindcss.com"><img src="https://img.shields.io/badge/TailwindCSS-v4-38B2AC?style=flat-square&logo=tailwind-css" alt="Tailwind CSS v4" /></a>
  <a href="https://github.com/aniketlab/DriverHub/pulls"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat-square" alt="PRs Welcome" /></a>
</p>

---

## 🌟 Overview

**Driver Hub** is an open-source, modern desktop application engineered for developers, technicians, and Android enthusiasts. It completely eliminates the frustration of searching for outdated, broken, or suspicious driver packages on the internet.

With Driver Hub, you can detect missing device drivers, install signed OEM drivers directly into the **Windows DriverStore** using native `pnputil`, inspect live USB hardware telemetry across different connection modes (ADB, Fastboot, MediaTek BROM/Preloader, MTP), and manage the Google Platform-Tools (ADB & Fastboot) environment—all from a sleek, glassmorphic desktop interface.

---

## 📸 Interface Walkthrough & 4K Previews

<div align="center">

### 1. Dashboard & Live Hardware Telemetry
*Real-time hardware bus polling, driver installation status, live terminal logging, and device mode monitoring.*
<p align="center">
  <img src="assets/screenshots/driverhub_dashboard_4k.png" alt="Driver Hub Dashboard" width="950" />
</p>

<br />

### 2. Driver Packages & Automated Store Management
*Categorized OEM driver packages (Google USB, MediaTek VCOM/BROM, Motorola) with automatic System Restore Point protection.*
<p align="center">
  <img src="assets/screenshots/driverhub_drivers_4k.png" alt="Driver Packages Management" width="950" />
</p>

<br />

### 3. Android Platform-Tools (SDK) Environment
*Built-in ADB and Fastboot binaries, one-click Windows System PATH integration, ADB server daemon controls, and live interactive console.*
<p align="center">
  <img src="assets/screenshots/driverhub_platform_tools_4k.png" alt="Platform Tools & ADB Terminal" width="950" />
</p>

<br />

### 4. Real-Time Hardware Diagnostic Hub
*Deep USB connection pipeline analysis, battery power delivery, driver state inspection, and phone internal storage exploration.*
<p align="center">
  <img src="assets/screenshots/driverhub_device_monitor_4k.png" alt="Live Device Monitor" width="950" />
</p>

<br />

### 5. Settings, Theming & System Controls
*Customizable light/dark themes with circular ripple view transitions, background device polling, and Windows UAC administrator elevation.*
<p align="center">
  <img src="assets/screenshots/driverhub_settings_4k.png" alt="Settings & Preferences" width="950" />
</p>

</div>

---

## ✨ Key Features

### ⚡ 1. One-Click Driver Installation & Windows DriverStore Integration
- **Direct INF Injection**: Injects digitally signed driver packages (`.inf`, `.sys`, `.cat`) into the Windows DriverStore via native `pnputil.exe` without messy third-party installers.
- **Supported Driver Ecosystem**:
  - **Google USB Drivers**: Universal ADB & Bootloader/Fastboot support for Pixel, Nexus, and standard AOSP devices.
  - **MediaTek (MTK) Drivers**: Full support for BROM mode, Preloader mode, and MTK USB VCOM port flashing.
  - **Motorola & Universal Android USB Drivers**: Extended compatibility for legacy and modern hardware.
- **Silent & Reliable**: Zero reboot requirements for modern Plug-and-Play drivers.

### 🛡️ 2. Fail-Safe Windows System Restore Protection
- **Automatic Restore Points**: Before any driver package is installed or modified, Driver Hub can automatically trigger a native Windows System Restore Point.
- **Zero Risk**: Experiment with flashing and development tools knowing your operating system state is preserved.

### 📱 3. Real-Time Live Device Telemetry
- **Hardware Bus Polling**: High-speed, non-blocking hardware polling detects devices the moment they are plugged in.
- **Connection Mode Recognition**:
  - `MTP` (Media Transfer Protocol / File Transfer)
  - `ADB` (Android Debug Bridge with Authorization check)
  - `Fastboot / Bootloader` (Unlocked/Locked status ready)
  - `MediaTek BROM / Preloader` (Flash mode detection)
- **Offline Device Intelligence**: Integrated with a comprehensive device database (`devices_db.json`) to resolve hardware Vendor IDs (VID) and Product IDs (PID) into friendly brand and model names (Samsung, Xiaomi, OnePlus, Google, Realme, Vivo, etc.).
- **Missing Driver Diagnostics**: Instant visual alert (`Driver Missing ⚠️`) when a connected device fails Windows driver enumeration.

### 🕹️ 4. Quick Hardware Actions
- **Instant Reboot Shortcuts**: Reboot device directly into **Bootloader/Fastboot**, **Recovery**, or **System** with one click.
- **Direct ADB Shell Access**: Launch interactive ADB shell terminal session instantly.
- **Storage Explorer**: Open phone internal storage directly in Windows Explorer without manual navigation.

### 🛠️ 5. Android Platform-Tools (SDK) Manager
- **Pre-Bundled Binaries**: Official Google `adb.exe`, `fastboot.exe`, and companion binaries included out-of-the-box.
- **One-Click System PATH**: Toggle adding Platform-Tools to your Windows System environment variable `PATH` permanently with automatic registry broadcast.
- **ADB Daemon Control**: Easily start, stop, or restart the background ADB server on port `5037`.
- **Interactive Command Console**: Run adb and fastboot commands directly inside Driver Hub with real-time output and syntax highlighting.
- **OTA Updates**: Background checking for Google repository platform-tools updates.

### 🎨 6. Next-Level Modern Design & Physics
- **Glassmorphic UI**: Translucent acrylic/mica surfaces, frosted glass headers, and responsive ambient emerald glow.
- **Circular Ripple Theme Transition**: Next-generation View Transition API ripple effect expanding from the theme toggle icon and retracting back smoothly.
- **Ultra-Sleek Custom Scrollbars**: Zero Windows 98-style retro arrow buttons, 100% transparent tracks, and floating rounded pill thumbs (macOS / Windows 11 Fluent aesthetic).
- **Persistent Memory System**: Dual-layer state persistence (Electron configuration storage + localStorage cache) guarantees your toggle states and preferences are remembered across app restarts.
- **Universal Scroll Reset**: When switching across tabs, each view automatically starts clean from the top.
- **Multi-Language Support**: Fully localized into English and Hindi with dynamic runtime switching.

---

## 🖥️ System Requirements

| Requirement | Specification |
| :--- | :--- |
| **Operating System** | Windows 10 (Build 1809+) / Windows 11 (64-bit recommended) |
| **Privileges** | Administrator rights (required for Windows DriverStore & System PATH management) |
| **Hardware** | 1 GHz processor, 2 GB RAM, 250 MB free disk space |
| **USB Connectivity** | Standard USB 2.0 / 3.0 / USB-C port with data transfer capability |

---

## 🚀 Installation (For End Users)

1. Head over to the **[Releases](https://github.com/aniketlab/DriverHub/releases)** page.
2. Download the latest installer (`Driver-Hub-Setup-1.0.0.exe`) or portable executable (`Driver-Hub-1.0.0-portable.exe`).
3. Run the installer and grant Windows UAC permissions when prompted.
4. Plug in your Android device via USB, open **Driver Hub**, and click **Scan PC**!

---

## 🛠️ Building From Source (For Developers & Contributors)

Follow these steps to set up the development environment and build Driver Hub locally.

### 1. Prerequisites
- **Node.js**: `v18.x`, `v20.x`, or `v22.x+` (Download from [nodejs.org](https://nodejs.org/))
- **npm**: Comes bundled with Node.js
- **Git**: Installed and configured on your system
- **Windows PowerShell**: PowerShell 5.1 or PowerShell 7+

### 2. Clone the Repository
```bash
git clone https://github.com/aniketlab/DriverHub.git
cd DriverHub
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Run in Development Mode
Launches Vite development server alongside Electron with Hot Module Replacement (HMR):
```bash
npm run dev
```

### 5. Build Web Assets (Vite)
Compiles React 19 frontend into optimized production bundles in `dist/`:
```bash
npm run build:vite
```

### 6. Package Desktop Application (Electron)
Creates the Windows NSIS installer and portable executable in `dist-electron/`:
```bash
npm run build:electron
```

Or execute the complete end-to-end build pipeline with:
```bash
npm run build
```

---

## 📁 Repository Architecture

```text
DriverHub/
├── assets/
│   └── logo/                 # Brand logos, icons, and banners (vector & raster)
├── electron/
│   ├── bin/
│   │   ├── drivers/          # Certified OEM driver packages (Google, MTK, Motorola)
│   │   └── platform-tools/   # Google ADB, Fastboot binaries & companion tools
│   ├── data/
│   │   ├── deviceDatabase.js # Hardware VID/PID parser and brand resolver
│   │   └── devices_db.json   # 4.7MB database of known Android hardware signatures
│   ├── services/
│   │   ├── detectDevices.ps1 # Hardware bus polling script
│   │   ├── deviceActionService.js # Device reboots, shell commands, storage
│   │   ├── installerService.js    # PnPUtil DriverStore injection & Restore Points
│   │   ├── monitorService.js      # Real-time USB polling & status management
│   │   ├── platformToolsService.js# Windows PATH manipulation & ADB daemon control
│   │   ├── scannerService.js      # Windows DriverStore inspection
│   │   ├── settingsService.js     # User preferences & persistent storage
│   │   └── updateService.js       # In-app OTA update verification
│   ├── main.js               # Electron main process entry point
│   └── preload.js            # Secure IPC bridge (Context Isolation enabled)
├── public/                   # Static web assets & icons
├── src/
│   ├── components/
│   │   ├── DeviceMonitorPage.jsx # Full-page hardware diagnostics & device actions
│   │   ├── DriversPage.jsx       # Categorized driver packages & installation
│   │   ├── PlatformToolsPage.jsx # ADB/Fastboot manager, PATH toggle & console
│   │   └── SettingsPage.jsx      # Preferences, UAC elevation, theme & about page
│   ├── utils/
│   │   ├── i18n.jsx              # Multi-language translation engine
│   │   └── soundEffects.js       # Haptic audio feedback system
│   ├── App.jsx               # Root layout, navigation sidebar, and Dashboard
│   ├── index.css             # Tailwind v4 configuration, animations & scrollbars
│   └── main.jsx              # React application bootstrap
├── package.json              # Project dependencies, build targets & metadata
├── vite.config.js            # Vite bundler configuration
└── README.md                 # Project documentation
```

---

## 🔒 Security & Safe Hardware Practices

- **Strict Context Isolation**: The renderer process runs with `nodeIntegration: false` and `contextIsolation: true`. All OS-level operations are strictly handled through validated IPC channels in `electron/preload.js`.
- **System Integrity**: Driver Hub never overwrites critical Windows system DLLs. All drivers are registered using Windows' official `pnputil.exe` utility inside `%WINDIR%\System32\DriverStore`.
- **Administrative Privileges**: Elevated privileges are exclusively requested when performing driver registration or system environment variable modifications.

---

## 🤝 Contributing

Contributions are welcome! If you want to contribute to Driver Hub:

1. **Fork** the repository on GitHub.
2. Create a descriptive feature branch (`git checkout -b feature/amazing-feature`).
3. Commit your changes with clear, structured messages (`git commit -m "feat: add support for Qualcomm 9008 EDL driver"`).
4. Run code quality checks:
   ```bash
   npm run lint
   npm run build:vite
   ```
5. **Push** your branch (`git push origin feature/amazing-feature`).
6. Open a **Pull Request** and describe the problem you're solving or feature you've added.

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author & Maintainer

Designed, developed, and maintained with ❤️ by **Aniket Sharma**:

- **GitHub**: [@aniketlab](https://github.com/aniketlab)
- **Repository**: [https://github.com/aniketlab/DriverHub](https://github.com/aniketlab/DriverHub)

<p align="center">
  <sub>Driver Hub © 2026 Aniket Sharma. Open-source software released under the MIT License.</sub>
</p>
