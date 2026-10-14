# Contributing to Driver Hub

First off, thank you for considering contributing to **Driver Hub**! Open-source projects thrive because of community members like you.

Whether you're fixing a bug, adding OEM drivers for new chipsets, improving translations, or enhancing the UI, your efforts are warmly welcomed.

---

## 🧭 Code of Conduct

By participating in this project, you agree to uphold our [Code of Conduct](CODE_OF_CONDUCT.md). Please treat all contributors with kindness and respect.

---

## 🛠️ Getting Started

### 1. Prerequisites
- **Node.js**: v18.x, v20.x, or v22.x+
- **npm**: v9.x+
- **Git**: Installed and configured
- **Windows OS**: Windows 10 (1809+) or Windows 11 with PowerShell 5.1+

### 2. Fork & Clone
1. Fork the repository on GitHub: `https://github.com/aniketlab/DriverHub`
2. Clone your fork locally:
   ```bash
   git clone https://github.com/<your-username>/DriverHub.git
   cd DriverHub
   ```
3. Set upstream remote:
   ```bash
   git remote add upstream https://github.com/aniketlab/DriverHub.git
   ```

### 3. Install Dependencies
```bash
npm install
```

### 4. Running Locally
Run the development environment with Hot Module Replacement (HMR):
```bash
npm run dev
```

---

## 🧪 Testing Your Changes

Before submitting a Pull Request, please ensure that:
1. **Frontend Builds Cleanly**:
   ```bash
   npm run build:vite
   ```
2. **Device Detection Pipeline**:
   Ensure `electron/services/detectDevices.ps1` runs quickly (< 1.5s) and outputs valid JSON.
3. **No Unused Packages**: Do not introduce unnecessary heavy dependencies.

---

## 📦 Adding New OEM Driver Packages

If you are adding support for a new chipset (e.g. Unisoc/Spreadtrum, Qualcomm EDL, Samsung Odin USB):
1. Place certified driver files in `electron/bin/drivers/<vendor>/`.
2. Ensure `.inf`, `.cat`, and `.sys` signatures are intact.
3. Update `electron/services/installerService.js` to handle silent `pnputil.exe /add-driver` installation.
4. Add the driver metadata to `src/data/driversData.js`.

---

## 🚀 Submitting a Pull Request

1. Create a feature branch:
   ```bash
   git checkout -b feat/my-awesome-feature
   ```
2. Commit your changes following [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat(...)`: New feature
   - `fix(...)`: Bug fix
   - `docs(...)`: Documentation changes
   - `style(...)`: Formatting/styling changes
   - `refactor(...)`: Code refactoring
   - `perf(...)`: Performance improvement
3. Push to your fork:
   ```bash
   git push origin feat/my-awesome-feature
   ```
4. Open a Pull Request against the `master` branch on the official repository.

---

## 💬 Community & Questions

Feel free to open a [GitHub Discussion](https://github.com/aniketlab/DriverHub/discussions) or create an issue if you have questions or need guidance!
