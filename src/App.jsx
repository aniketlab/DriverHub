import { useState, useEffect, useRef } from 'react';
import { 
  Download, 
  MonitorSmartphone, 
  Settings, 
  LayoutDashboard, 
  Database, 
  ChevronRight, 
  Loader2, 
  FolderOpen,
  Smartphone,
  RefreshCw,
  Terminal,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';
import { DeviceMonitorPage } from './components/DeviceMonitorPage';
import { DriversPage } from './components/DriversPage';
import { PlatformToolsPage } from './components/PlatformToolsPage';
import { SettingsPage } from './components/SettingsPage';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

function App() {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [isScanning, setIsScanning] = useState(false);
  const [installingTarget, setInstallingTarget] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isElevating, setIsElevating] = useState(false);

  // Theme Management (Light / Dark / System)
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('driverhub_theme') || 'light';
    } catch {
      return 'light';
    }
  });

  const applyTheme = (targetTheme) => {
    let isDark = false;
    if (targetTheme === 'dark') {
      isDark = true;
    } else if (targetTheme === 'system') {
      isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } else {
      isDark = false;
    }

    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    setTheme(targetTheme);
    try {
      localStorage.setItem('driverhub_theme', targetTheme);
    } catch {}

    if (window.electronAPI?.setWindowTheme) {
      window.electronAPI.setWindowTheme(isDark ? 'dark' : 'light');
    }
  };

  useEffect(() => {
    const initTheme = async () => {
      try {
        if (window.electronAPI?.getSettings) {
          const s = await window.electronAPI.getSettings();
          if (s && s.theme) {
            applyTheme(s.theme);
            return;
          }
        }
      } catch {}
      const saved = localStorage.getItem('driverhub_theme') || 'light';
      applyTheme(saved);
    };
    initTheme();
  }, []);

  useEffect(() => {
    if (theme !== 'system') return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyTheme('system');
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [theme]);

  // Initial and reactive check for Windows Administrator elevation
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        if (window.electronAPI?.checkAdmin) {
          const elevated = await window.electronAPI.checkAdmin();
          setIsAdmin(Boolean(elevated));
        } else if (window.electronAPI?.getSettings) {
          const s = await window.electronAPI.getSettings();
          if (s && typeof s.isAdmin === 'boolean') {
            setIsAdmin(s.isAdmin);
          }
        }
      } catch (err) {
        console.warn('Could not check admin status:', err);
      }
    };
    checkAdminStatus();
  }, []);

  // Individual driver scan states (legacy dashboard)
  const [driverStates, setDriverStates] = useState({
    adb: { scanning: false, scanned: false, installed: false, path: null },
    google: { scanning: false, scanned: false, installed: false },
    mtk: { scanning: false, scanned: false, installed: false, name: null }
  });

  // Granular driver packages state for dedicated Drivers page
  const [packageStates, setPackageStates] = useState({
    adb: { installed: false, version: null, updateAvailable: false, isScanning: false },
    google_usb: { installed: false, version: null, updateAvailable: false, isScanning: false },
    google_bootloader: { installed: false, version: null, updateAvailable: false, isScanning: false },
    mtk_vcom: { installed: false, version: null, updateAvailable: false, isScanning: false },
    mtk_brom: { installed: false, version: null, updateAvailable: false, isScanning: false }
  });

  // Real-time live connected device state (with Brand & Model)
  const [deviceStatus, setDeviceStatus] = useState({
    connected: false,
    adb: false,
    fastboot: false,
    mtk: false,
    mtp: false,
    fastbootError: false,
    adbError: false,
    mtkError: false,
    driverError: false,
    brand: null,
    model: null,
    rawModel: null,
    mode: null
  });

  const [selectedDrivers, setSelectedDrivers] = useState({
    adb: true,
    google: false,
    mtk: false
  });

  const [isInstalling, setIsInstalling] = useState(false);
  const [installProgress, setInstallProgress] = useState({
    adb: { percent: 0, message: '' },
    google: { percent: 0, message: '' },
    mtk: { percent: 0, message: '' }
  });

  const prevDeviceRef = useRef({ 
    connected: false, 
    adb: false, 
    fastboot: false, 
    mtk: false, 
    mtp: false,
    fastbootError: false,
    driverError: false 
  });

  // Dynamic live terminal logs
  const [logs, setLogs] = useState([
    { type: 'info', text: 'DriverHub v1.0 initialized. Live Device Monitor active.' }
  ]);

  const addLog = (type, text) => {
    setLogs(prev => [...prev, { type, text, time: new Date().toLocaleTimeString() }]);
  };

  useEffect(() => {
    // 1. Listen for progressive scan events from Electron backend
    if (window.electronAPI?.onScanStep) {
      window.electronAPI.onScanStep((event) => {
        const { target, state, data } = event;

        if (state === 'scanning') {
          if (['adb', 'google', 'mtk'].includes(target)) {
            setDriverStates(prev => ({
              ...prev,
              [target]: { ...prev[target], scanning: true }
            }));
          }

          setPackageStates(prev => ({
            ...prev,
            [target]: { ...prev[target], isScanning: true }
          }));

          if (target === 'adb') addLog('pending', 'Searching system PATH & LocalAppData for ADB Platform-Tools...');
          if (target === 'google') addLog('pending', 'Querying Windows DriverStore for Google USB Bootloader Driver...');
          if (target === 'mtk') addLog('pending', 'Scanning DriverStore for MediaTek VCOM & Preloader Drivers...');
        } 
        else if (state === 'done') {
          if (['adb', 'google', 'mtk'].includes(target)) {
            setDriverStates(prev => ({
              ...prev,
              [target]: { 
                scanning: false, 
                scanned: true, 
                installed: data.installed, 
                path: data.path || null,
                name: data.name || null
              }
            }));
          }

          setPackageStates(prev => ({
            ...prev,
            [target]: {
              ...prev[target],
              isScanning: false,
              installed: Boolean(data?.installed),
              version: data?.version || prev[target]?.version || null,
              updateAvailable: Boolean(data?.updateAvailable)
            }
          }));

          if (target === 'adb') {
            if (data.installed) addLog('success', `ADB Platform-Tools detected at: ${data.path}`);
            else addLog('warning', 'ADB Platform-Tools not found on this PC.');
          }
          if (target === 'google') {
            if (data.installed) addLog('success', `Bootloader Driver detected (${data.name || 'Android WinUSB'}).`);
            else addLog('warning', 'Android Bootloader Driver missing from DriverStore.');
          }
          if (target === 'mtk') {
            if (data.installed) addLog('success', `MediaTek Drivers detected (${data.name || 'VCOM'}).`);
            else addLog('warning', 'MediaTek BROM/Preloader drivers not found.');
          }
        }
      });
    }

    // 2. Listen for real-time Device Monitor events (with Brand & Model)
    if (window.electronAPI?.onDeviceMonitorUpdate) {
      window.electronAPI.onDeviceMonitorUpdate((status) => {
        setDeviceStatus(status);

        const wasConnected = prevDeviceRef.current.connected;
        const isNowConnected = status.connected;

        if (!wasConnected && isNowConnected) {
          const deviceLabel = status.model ? `${status.brand || ''} ${status.model}` : (status.brand || 'Android Device');
          if (status.driverError) {
            addLog('warning', `USB Plugged: ${deviceLabel} detected (${status.mode || 'Device'}). Driver missing in Windows Device Manager.`);
          } else {
            addLog('success', `USB Plugged: ${deviceLabel} connected (${status.mode || 'USB'}).`);
          }
        } else if (wasConnected && !isNowConnected) {
          addLog('info', 'USB Unplugged: Device disconnected.');
        } else if (wasConnected && isNowConnected) {
          if (!prevDeviceRef.current.adb && status.adb) {
            addLog('success', 'ADB Debugging mode activated.');
          } else if (!prevDeviceRef.current.fastboot && status.fastboot) {
            addLog('success', 'Fastboot Bootloader mode connected.');
          } else if (status.fastbootError && !prevDeviceRef.current.fastbootError) {
            addLog('warning', 'Fastboot device detected, but Windows driver is missing (Code 28 / Yellow mark).');
          } else if (!prevDeviceRef.current.mtp && status.mtp) {
            addLog('info', 'File Transfer (MTP) mode active.');
          }
        }

        prevDeviceRef.current = status;
      });
    }

    // 3. Listen for 1-Click driver installer progress
    if (window.electronAPI?.onInstallStep) {
      window.electronAPI.onInstallStep((step) => {
        setInstallProgress(prev => ({
          ...prev,
          [step.target]: {
            percent: step.percent,
            message: step.message
          }
        }));

        if (step.error) {
          addLog('error', step.message);
        } else if (step.percent === 100) {
          addLog('success', step.message);
        } else if (step.percent === 5 || step.percent === 10 || step.percent === 30 || step.percent === 60 || step.percent === 72 || step.percent === 75 || step.percent === 88 || step.percent === 95) {
          addLog('info', step.message);
        }
      });
    }

    // Initial driver scan on app startup
    const initTimer = setTimeout(() => {
      handleScan();
    }, 600);

    return () => {
      clearTimeout(initTimer);
      if (window.electronAPI?.removeScanStepListener) {
        window.electronAPI.removeScanStepListener();
      }
      if (window.electronAPI?.removeDeviceMonitorListener) {
        window.electronAPI.removeDeviceMonitorListener();
      }
      if (window.electronAPI?.removeInstallStepListener) {
        window.electronAPI.removeInstallStepListener();
      }
    };
  }, []);

  const handleScan = async () => {
    setIsScanning(true);
    addLog('info', '--- Initiating Comprehensive System Driver Scan ---');

    try {
      await window.electronAPI.scanPc();
      addLog('success', 'Full system scan completed successfully. Review packages above.');
    } catch (err) {
      console.error("Scan error:", err);
      addLog('error', `Scan process interrupted: ${err.message || 'Unknown error'}`);
    } finally {
      setIsScanning(false);
    }
  };

  const handleInstall = async () => {
    const toInstall = Object.keys(selectedDrivers).filter(k => selectedDrivers[k]);
    if (toInstall.length === 0) return;

    setIsInstalling(true);
    addLog('info', `--- Initiating 1-Click Installation for: ${toInstall.map(t => t.toUpperCase()).join(', ')} ---`);

    try {
      const results = await window.electronAPI.installDrivers(toInstall);
      if (results.adb && results.adb.success) {
        setDriverStates(prev => ({
          ...prev,
          adb: {
            ...prev.adb,
            scanned: true,
            installed: true,
            path: results.adb.path
          }
        }));
        addLog('success', `ADB Platform-Tools ready at: ${results.adb.path}`);
        addLog('success', 'Windows User PATH updated. ADB & Fastboot commands are globally available.');
      }
      if (results.google && results.google.success) {
        setDriverStates(prev => ({
          ...prev,
          google: {
            ...prev.google,
            scanned: true,
            installed: true,
            name: results.google.name || 'Google USB Bootloader Driver'
          }
        }));
        addLog('success', `${results.google.name || 'Google USB Bootloader Driver'} installed into Windows DriverStore.`);
      }
      if (results.mtk && results.mtk.success) {
        setDriverStates(prev => ({
          ...prev,
          mtk: {
            ...prev.mtk,
            scanned: true,
            installed: true,
            name: results.mtk.name || 'MediaTek USB VCOM / Preloader Driver'
          }
        }));
        addLog('success', `${results.mtk.name || 'MediaTek Drivers'} installed into Windows DriverStore.`);
      }
      // Hold 100% completion state for a smooth visual transition
      await new Promise(r => setTimeout(r, 600));
    } catch (err) {
      console.error('Installation error:', err);
      addLog('error', `Installation interrupted: ${err.message || 'Unknown error'}`);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleInstallDrivers = async (targets = ['adb'], options = { createRestorePoint: true }) => {
    if (!targets || targets.length === 0) return;
    setIsInstalling(true);
    setInstallingTarget(targets.length === 1 ? targets[0] : targets);
    addLog('info', `--- Initiating Installation for: ${targets.map(t => t.toUpperCase()).join(', ')} ---`);
    if (options.createRestorePoint) {
      addLog('info', 'Creating Windows System Restore Point backup first...');
    }

    try {
      if (window.electronAPI?.installDrivers) {
        const results = await window.electronAPI.installDrivers({
          targets,
          createRestorePoint: options.createRestorePoint
        });

        setPackageStates(prev => {
          const next = { ...prev };
          targets.forEach(t => {
            next[t] = {
              ...next[t],
              installed: true,
              updateAvailable: false
            };
          });
          return next;
        });

        addLog('success', `Installation completed successfully for: ${targets.join(', ')}.`);
      } else {
        addLog('warning', `Driver install simulated for: ${targets.join(', ')} (Mock mode).`);
      }
      await new Promise(r => setTimeout(r, 600));
    } catch (err) {
      console.error('Driver installation error:', err);
      addLog('error', `Installation interrupted: ${err.message || 'Unknown error'}`);
    } finally {
      setIsInstalling(false);
      setInstallingTarget(null);
      handleScan();
    }
  };

  const handleRebootDevice = async (mode) => {
    try {
      addLog('info', `Sending reboot command: ${mode}...`);
      if (window.electronAPI?.rebootDevice) {
        const res = await window.electronAPI.rebootDevice(mode);
        addLog('success', res.message || `Rebooting to ${mode}...`);
      } else {
        addLog('warning', `Reboot to ${mode} (Mock - Electron API unavailable)`);
      }
    } catch (err) {
      addLog('error', `Reboot failed: ${err.message}`);
    }
  };

  const handleOpenAdbShell = async () => {
    try {
      addLog('info', 'Opening ADB shell terminal...');
      if (window.electronAPI?.openAdbShell) {
        const res = await window.electronAPI.openAdbShell();
        addLog('success', res.message || 'ADB shell launched in terminal window.');
      } else {
        addLog('warning', 'ADB Shell (Mock - Electron API unavailable)');
      }
    } catch (err) {
      addLog('error', `Failed to open ADB shell: ${err.message}`);
    }
  };

  const handleOpenPhoneStorage = async (path) => {
    try {
      addLog('info', 'Opening phone internal storage in File Explorer...');
      if (window.electronAPI?.openPhoneStorage) {
        const res = await window.electronAPI.openPhoneStorage(path);
        addLog('success', res.message || 'Phone storage opened in Windows File Explorer.');
      } else {
        addLog('warning', 'Phone Storage (Mock - Electron API unavailable)');
      }
    } catch (err) {
      addLog('error', `Failed to open phone storage: ${err.message}`);
    }
  };

  const handleElevateAdmin = async () => {
    if (isAdmin) {
      addLog('info', 'Driver Hub is already running with full Administrator privileges 🛡️');
      return;
    }

    setIsElevating(true);
    addLog('warning', 'Requesting Administrator permissions via Windows UAC prompt...');

    try {
      if (window.electronAPI?.relaunchAsAdmin) {
        const res = await window.electronAPI.relaunchAsAdmin();
        if (!res || !res.success) {
          setIsElevating(false);
          addLog('warning', 'Administrator relaunch was cancelled or denied by user.');
        }
      } else {
        setTimeout(() => {
          setIsElevating(false);
          setIsAdmin(true);
          addLog('success', 'Driver Hub elevated to Administrator mode (Simulated).');
        }, 1200);
      }
    } catch (err) {
      setIsElevating(false);
      addLog('error', `Elevation error: ${err.message || 'Unknown error'}`);
    }
  };

  const selectedCount = Object.values(selectedDrivers).filter(Boolean).length;

  const isAnyDeviceConnected = deviceStatus.connected;

  return (
    <div className="flex flex-col h-screen w-full bg-slate-50/80 dark:bg-[#0a0f1d] text-slate-800 dark:text-slate-100 overflow-hidden font-sans relative transition-colors duration-200">
      {/* Responsive Ambient Green/Emerald Glow (12-14% on compact screens, 15-17% on large screens) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Top-Left Soft Emerald Glow */}
        <div className="absolute -top-[12%] -left-[6%] w-[320px] h-[320px] xl:w-[440px] xl:h-[440px] rounded-full bg-emerald-400/[0.12] dark:bg-emerald-500/[0.08] xl:bg-emerald-400/[0.17] dark:xl:bg-emerald-500/[0.11] blur-[80px] xl:blur-[100px]" />
        {/* Top-Right Soft Teal Glow */}
        <div className="absolute top-[8%] -right-[8%] w-[300px] h-[300px] xl:w-[420px] xl:h-[420px] rounded-full bg-teal-300/[0.10] dark:bg-teal-500/[0.07] xl:bg-teal-300/[0.15] dark:xl:bg-teal-500/[0.10] blur-[80px] xl:blur-[100px]" />
        {/* Center-Right Ambient Flow (Only on large screens to prevent small-screen glow concentration) */}
        <div className="hidden xl:block absolute top-[45%] right-[10%] w-[440px] h-[440px] rounded-full bg-emerald-400/[0.15] dark:bg-emerald-500/[0.08] blur-[120px]" />
        {/* Bottom-Right Soft Mint Glow */}
        <div className="absolute -bottom-[12%] -right-[6%] w-[340px] h-[340px] xl:w-[480px] xl:h-[480px] rounded-full bg-emerald-300/[0.13] dark:bg-emerald-500/[0.08] xl:bg-emerald-300/[0.17] dark:xl:bg-emerald-500/[0.11] blur-[90px] xl:blur-[110px]" />
      </div>

      {/* 1. TOP UNIFIED TITLE BAR (Full window width, frosted translucent glass) */}
      <header className="h-[38px] w-full bg-white/85 dark:bg-[#0b1222]/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between px-4 select-none drag-region shrink-0 z-40 transition-colors">
        <div className="flex items-center gap-2 no-drag-region">
          <MonitorSmartphone className="w-4 h-4 text-green-600 dark:text-emerald-400 shrink-0" />
          <div className="flex items-baseline gap-2">
            <span className="font-bold text-[13px] tracking-tight uppercase leading-none text-slate-900 dark:text-white">
              <span className="text-green-600 dark:text-emerald-400">DRIVER</span> HUB
            </span>
            <span className="text-[11.5px] text-slate-400 dark:text-slate-500 font-normal leading-none">
              All-in-one Android driver installer
            </span>
          </div>
        </div>
        {/* Windows Titlebar Controls Placement Area */}
        <div className="w-28 h-full" />
      </header>

      {/* 2. BODY CONTAINER BELOW TITLE BAR */}
      <div className="flex flex-1 overflow-hidden h-[calc(100vh-38px)] w-full relative z-10">
        {/* LEFT SIDEBAR (Frosted Acrylic) */}
        <div className="w-[220px] bg-white/85 dark:bg-[#0d1527]/90 backdrop-blur-md border-r border-slate-200/80 dark:border-slate-800/80 flex flex-col justify-between p-4 pt-5 pb-4 h-full relative z-10 shadow-xs no-drag-region shrink-0 transition-colors">
          <nav className="flex flex-col gap-1">
            <NavItem icon={LayoutDashboard} label="Dashboard" active={activeTab === 'Dashboard'} onClick={() => setActiveTab('Dashboard')} />
            <NavItem icon={Download} label="Drivers" active={activeTab === 'Drivers'} onClick={() => setActiveTab('Drivers')} />
            <NavItem icon={Terminal} label="Platform Tools" active={activeTab === 'Platform Tools'} onClick={() => setActiveTab('Platform Tools')} />
            <NavItem icon={MonitorSmartphone} label="Device Monitor" active={activeTab === 'Device Monitor'} onClick={() => setActiveTab('Device Monitor')} />
            <NavItem icon={Settings} label="Settings" active={activeTab === 'Settings'} onClick={() => setActiveTab('Settings')} />
          </nav>

          <div className="pt-2">
            {isAdmin ? (
              <div 
                className="w-full bg-emerald-500/10 dark:bg-emerald-950/25 border border-emerald-500/30 dark:border-emerald-600/35 rounded-xl p-3 text-[11px] shadow-2xs relative overflow-hidden transition-all duration-300"
                title="Driver Hub is running with Administrator privileges"
              >
                <div className="flex items-center justify-between gap-1.5 mb-1">
                  <div className="flex items-center gap-1.5 font-semibold text-emerald-900 dark:text-emerald-300">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Windows 10 / 11</span>
                  </div>
                  <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Admin
                  </span>
                </div>
                <div className="text-emerald-700/90 dark:text-emerald-400/90 text-[10.5px] leading-snug">
                  Active · Full DriverStore write access granted.
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleElevateAdmin}
                disabled={isElevating}
                className="w-full text-left group bg-slate-50 hover:bg-amber-500/10 dark:bg-slate-900/90 dark:hover:bg-amber-500/15 border border-slate-200/90 hover:border-amber-400/80 dark:border-slate-800 dark:hover:border-amber-500/60 rounded-xl p-3 text-[11px] transition-all duration-200 cursor-pointer shadow-2xs relative overflow-hidden active:scale-[0.98] disabled:opacity-70"
                title="Click to relaunch Driver Hub as Administrator"
              >
                <div className="flex items-center justify-between gap-1.5 mb-1">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300 group-hover:text-amber-800 dark:group-hover:text-amber-400 transition-colors">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>Windows 10 / 11</span>
                  </div>
                  <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/25 group-hover:bg-amber-500 group-hover:text-white transition-all shrink-0">
                    {isElevating ? (
                      <>
                        <Loader2 className="w-2.5 h-2.5 animate-spin" />
                        <span>Relaunching</span>
                      </>
                    ) : (
                      <span>Elevate ⚡</span>
                    )}
                  </span>
                </div>
                <div className="text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300 text-[10.5px] leading-snug transition-colors">
                  {isElevating ? 'Accept Windows UAC prompt to continue...' : 'Click to run as Administrator for full driver access.'}
                </div>
              </button>
            )}
          </div>
        </div>

        {activeTab === 'Device Monitor' ? (
          <DeviceMonitorPage
            deviceStatus={deviceStatus}
            onRefresh={handleScan}
            onNavigateToDrivers={() => setActiveTab('Drivers')}
            onOpenPhoneStorage={handleOpenPhoneStorage}
            onRebootBootloader={() => handleRebootDevice('bootloader')}
            onRebootRecovery={() => handleRebootDevice('recovery')}
            onRebootSystem={() => handleRebootDevice('system')}
            onOpenShell={handleOpenAdbShell}
            activityLogs={logs.map(l => ({
              time: l.time,
              text: l.text,
              highlight: l.type === 'success'
            }))}
            isRefreshing={isScanning}
          />
        ) : activeTab === 'Drivers' ? (
          <DriversPage
            packageStates={packageStates}
            isScanning={isScanning}
            isInstalling={isInstalling}
            installingTarget={installingTarget}
            installProgress={installProgress}
            onScan={handleScan}
            onInstallDrivers={handleInstallDrivers}
          />
        ) : activeTab === 'Platform Tools' ? (
          <PlatformToolsPage 
            deviceStatus={deviceStatus}
            isInstalling={isInstalling}
            installingTarget={installingTarget}
            installProgress={installProgress}
            onInstallDrivers={handleInstallDrivers}
            onScan={handleScan}
            onNavigateToDashboard={() => setActiveTab('Dashboard')}
            onNavigateToDeviceMonitor={() => setActiveTab('Device Monitor')}
            addLog={addLog}
          />
        ) : activeTab === 'Settings' ? (
          <SettingsPage 
            theme={theme}
            onThemeChange={applyTheme}
            isAdmin={isAdmin}
            onElevateAdmin={handleElevateAdmin}
            addLog={addLog}
          />
        ) : (
          <>
            {/* MAIN CONTENT AREA */}
            <div className="flex-1 flex flex-col h-full bg-transparent relative p-6 pt-5 no-drag-region overflow-y-auto min-w-[500px]">
              <div className="max-w-4xl w-full mx-auto flex-1 flex flex-col gap-5">
          
          {/* Header Row */}
          <div className="flex items-center justify-between gap-4 pb-0.5">
            <div className="min-w-0">
              <div className="flex items-baseline flex-wrap gap-x-2 gap-y-0.5">
                <h2 className="text-[22px] font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                  Every Android driver.
                </h2>
                <span className="text-[22px] font-bold tracking-tight text-green-600 dark:text-emerald-400 leading-tight">
                  One installer.
                </span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-[13px] mt-1 font-normal">
                Pick what you need, then install in a single click.
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button 
                onClick={handleScan}
                disabled={isScanning || isInstalling}
                className="h-10 px-4 bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-800 active:scale-[0.98] backdrop-blur-sm border border-slate-200/90 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 font-semibold rounded-xl shadow-xs transition-all duration-150 text-[13px] whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
                title="Scan PC for installed drivers"
              >
                {isScanning ? (
                  <Loader2 className="w-4 h-4 animate-spin text-green-600 dark:text-emerald-400" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                )}
                <span>{isScanning ? 'Scanning PC...' : 'Scan PC'}</span>
              </button>

              <button 
                onClick={handleInstall}
                disabled={isInstalling || isScanning || selectedCount === 0}
                className="h-10 px-5 bg-green-600 dark:bg-emerald-600 hover:bg-green-700 dark:hover:bg-emerald-700 active:scale-[0.98] text-white font-semibold rounded-xl shadow-sm shadow-green-700/20 transition-all duration-150 text-[13px] whitespace-nowrap cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none flex items-center gap-2"
                title={selectedCount === 0 ? "Select at least one driver to install" : "Install selected drivers"}
              >
                {isInstalling ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <Download className="w-4 h-4 text-white" />
                )}
                <span>{isInstalling ? 'Installing...' : 'Install selected'}</span>
                {selectedCount > 0 && !isInstalling && (
                  <span className="ml-0.5 px-2 py-0.5 bg-white/20 rounded-full text-[11px] font-bold text-white leading-none">
                    {selectedCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Cards List */}
          <div className="flex flex-col gap-3 flex-1">
            
            {/* 1. ADB Card */}
            <DriverCard 
              icon={<ChevronRight className="w-4 h-4 text-green-600 dark:text-emerald-400" />}
              title="ADB Platform-Tools"
              desc="adb + fastboot binaries, added to PATH automatically"
              tags={['adb', 'fastboot', 'PATH setup']}
              isScanning={driverStates.adb.scanning}
              progress={isInstalling && selectedDrivers.adb ? installProgress.adb?.percent : 0}
              progressMessage={installProgress.adb?.message}
              status={
                driverStates.adb.scanning
                  ? 'Scanning...'
                  : isInstalling && selectedDrivers.adb && installProgress.adb?.percent > 0 && installProgress.adb?.percent < 100
                    ? `Installing ${installProgress.adb.percent}%`
                    : driverStates.adb.scanned
                      ? (driverStates.adb.installed ? 'Installed' : 'Not installed')
                      : 'Not Scanned'
              }
              statusColor={
                driverStates.adb.scanning || (isInstalling && selectedDrivers.adb)
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/60'
                  : driverStates.adb.scanned
                    ? (driverStates.adb.installed ? 'text-green-700 dark:text-emerald-400 bg-green-50 dark:bg-emerald-950/60 border border-green-200 dark:border-emerald-800/60' : 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/60')
                    : 'text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800'
              }
              checkboxLabel={driverStates.adb.installed ? 'Reinstall' : 'Selected'}
              checked={selectedDrivers.adb}
              onToggle={() => setSelectedDrivers(prev => ({ ...prev, adb: !prev.adb }))}
              borderColor={driverStates.adb.installed ? 'border-green-200 dark:border-emerald-800/60' : 'border-slate-200 dark:border-slate-800/80'}
              onExplore={driverStates.adb.installed && driverStates.adb.path ? () => window.electronAPI.openFolder(driverStates.adb.path) : null}
            />

            {/* 2. Google USB Card */}
            <DriverCard 
              icon={<Download className="w-4 h-4 text-amber-500 dark:text-amber-400" />}
              title="Google USB & Bootloader"
              desc="Detects your phone in ADB and Fastboot mode"
              tags={['android_winusb', 'Fastboot']}
              isScanning={driverStates.google.scanning}
              progress={isInstalling && selectedDrivers.google ? installProgress.google?.percent : 0}
              progressMessage={installProgress.google?.message}
              status={
                driverStates.google.scanning
                  ? 'Scanning...'
                  : isInstalling && selectedDrivers.google && installProgress.google?.percent > 0 && installProgress.google?.percent < 100
                    ? `Installing ${installProgress.google.percent}%`
                    : driverStates.google.scanned
                      ? (driverStates.google.installed ? 'Installed' : 'Not installed')
                      : 'Not Scanned'
              }
              statusColor={
                driverStates.google.scanning || (isInstalling && selectedDrivers.google)
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/60'
                  : driverStates.google.scanned
                    ? (driverStates.google.installed ? 'text-green-700 dark:text-emerald-400 bg-green-50 dark:bg-emerald-950/60 border border-green-200 dark:border-emerald-800/60' : 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/60')
                    : 'text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800'
              }
              checkboxLabel={driverStates.google.installed ? 'Reinstall' : 'Selected'}
              checked={selectedDrivers.google}
              onToggle={() => setSelectedDrivers(prev => ({ ...prev, google: !prev.google }))}
              borderColor={driverStates.google.installed ? 'border-green-200 dark:border-emerald-800/60' : 'border-slate-200 dark:border-slate-800/80'}
            />

            {/* 3. MediaTek MTK Card */}
            <DriverCard 
              icon={<Database className="w-4 h-4 text-blue-500 dark:text-blue-400" />}
              title="MediaTek (MTK) Drivers"
              desc="For flashing and unbricking MTK devices"
              tags={['BROM mode', 'Preloader mode', 'VCOM']}
              isScanning={driverStates.mtk.scanning}
              progress={isInstalling && selectedDrivers.mtk ? installProgress.mtk?.percent : 0}
              progressMessage={installProgress.mtk?.message}
              status={
                driverStates.mtk.scanning
                  ? 'Scanning...'
                  : isInstalling && selectedDrivers.mtk && installProgress.mtk?.percent > 0 && installProgress.mtk?.percent < 100
                    ? `Installing ${installProgress.mtk.percent}%`
                    : driverStates.mtk.scanned
                      ? (driverStates.mtk.installed ? 'Installed' : 'Not installed')
                      : 'Not Scanned'
              }
              statusColor={
                driverStates.mtk.scanning || (isInstalling && selectedDrivers.mtk)
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/60'
                  : driverStates.mtk.scanned
                    ? (driverStates.mtk.installed ? 'text-green-700 dark:text-emerald-400 bg-green-50 dark:bg-emerald-950/60 border border-green-200 dark:border-emerald-800/60' : 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/60')
                    : 'text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800'
              }
              checkboxLabel={driverStates.mtk.installed ? 'Reinstall' : 'Selected'}
              checked={selectedDrivers.mtk}
              onToggle={() => setSelectedDrivers(prev => ({ ...prev, mtk: !prev.mtk }))}
              borderColor={driverStates.mtk.installed ? 'border-green-200 dark:border-emerald-800/60' : 'border-slate-200 dark:border-slate-800/80'}
            />

          </div>

          {/* Terminal / Install Log */}
          <div className="bg-white/92 dark:bg-slate-900/90 backdrop-blur-sm border border-slate-200/85 dark:border-slate-800/80 rounded-2xl p-4 h-32 font-mono text-[11px] text-slate-600 dark:text-slate-300 overflow-y-auto mt-1 shadow-xs shrink-0 flex flex-col justify-between transition-colors">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-slate-800 dark:text-slate-200 font-sans text-[10px] uppercase tracking-wider">Install Log</h4>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-sans">Live Console</span>
              </div>
              <div className="flex flex-col gap-1">
                {logs.map((log, index) => (
                  <p key={index} className="leading-relaxed">
                    {log.type === 'success' && <span className="text-green-600 dark:text-emerald-400 font-bold mr-1.5">[ok]</span>}
                    {log.type === 'pending' && <span className="text-blue-500 dark:text-blue-400 font-bold mr-1.5">[..]</span>}
                    {log.type === 'warning' && <span className="text-amber-500 dark:text-amber-400 font-bold mr-1.5">[!]</span>}
                    {log.type === 'error' && <span className="text-rose-500 dark:text-rose-400 font-bold mr-1.5">[err]</span>}
                    {log.type === 'info' && <span className="text-slate-400 dark:text-slate-500 font-bold mr-1.5">[--]</span>}
                    <span>{log.text}</span>
                  </p>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* RIGHT SIDEBAR: DEVICE MONITOR (Frosted Translucent) */}
      <div className="w-[250px] bg-white/85 dark:bg-[#0d1527]/90 backdrop-blur-md border-l border-slate-200/80 dark:border-slate-800/80 p-5 pt-5 h-full flex flex-col relative z-10 shadow-xs no-drag-region shrink-0 transition-colors">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-[11px] uppercase tracking-wider">Device Monitor</h4>
          <span className="flex h-2 w-2 relative">
            <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", isAnyDeviceConnected ? "bg-emerald-400" : "bg-slate-300 dark:bg-slate-600")} />
            <span className={cn("relative inline-flex rounded-full h-2 w-2", isAnyDeviceConnected ? "bg-emerald-500" : "bg-slate-400 dark:bg-slate-500")} />
          </span>
        </div>
        
        {/* Next-Level Vector-Aligned Device Centerpiece */}
        <DeviceMonitorVisual 
          connected={isAnyDeviceConnected}
          mode={deviceStatus.mode}
          brand={deviceStatus.brand}
          model={deviceStatus.model}
          hasError={deviceStatus.driverError}
        />

        {/* Live Device Status Tagline & Name Display */}
        <div className="text-center mb-4 min-h-[50px] flex flex-col items-center justify-center">
          {isAnyDeviceConnected ? (
            <div className="flex flex-col items-center animate-fadeIn w-full px-1">
              <div className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border mb-1",
                deviceStatus.driverError 
                  ? "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800/70"
                  : "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200/70 dark:border-emerald-800/70"
              )}>
                <span className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  deviceStatus.driverError ? "bg-amber-500 animate-pulse" : "bg-emerald-500 animate-pulse"
                )} />
                <span>{deviceStatus.driverError ? "Driver Missing ⚠️" : "Connected"}</span>
              </div>
              <h5 className="text-[13px] font-semibold text-slate-800 dark:text-white leading-tight truncate max-w-full">
                {deviceStatus.model || 'Android Phone'}
              </h5>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-normal mt-0.5 truncate max-w-full">
                {deviceStatus.rawModel && deviceStatus.model !== deviceStatus.rawModel ? `${deviceStatus.rawModel} • ` : ''}
                {deviceStatus.mode || 'USB Mode'}
              </p>
            </div>
          ) : (
            <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed font-normal">
              Connect your phone via USB.<br />The mode is detected live.
            </p>
          )}
        </div>

        {/* Individual Status Badges */}
        <div className="flex flex-col gap-2">
          <MonitorStatus 
            label="File Transfer (MTP)" 
            connected={deviceStatus.mtp} 
          />
          <MonitorStatus 
            label="ADB" 
            connected={deviceStatus.adb} 
            hasError={deviceStatus.adbError}
          />
          <MonitorStatus 
            label="Fastboot" 
            connected={deviceStatus.fastboot} 
            hasError={deviceStatus.fastbootError}
          />
          <MonitorStatus 
            label="MTK BROM / Preloader" 
            connected={deviceStatus.mtk} 
            hasError={deviceStatus.mtkError}
          />
        </div>
      </div>
        </>
      )}

      </div>
    </div>
  );
}

function NavItem({ icon: Icon, label, active, onClick }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "group flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] transition-all duration-150 whitespace-nowrap cursor-pointer border text-left active:scale-[0.98]",
        active 
          ? "bg-green-50 dark:bg-emerald-950/60 text-green-800 dark:text-emerald-300 font-semibold border-green-200/90 dark:border-emerald-800/70 shadow-2xs" 
          : "border-transparent text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200 hover:border-slate-200/70 dark:hover:border-slate-700/60 hover:shadow-2xs"
      )}
    >
      <Icon className={cn("w-4 h-4 shrink-0 transition-colors", active ? "text-green-600 dark:text-emerald-400" : "text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300")} />
      {label}
    </button>
  );
}

function DriverCard({ 
  icon, 
  title, 
  desc, 
  tags, 
  status, 
  statusColor, 
  checkboxLabel, 
  checked, 
  onToggle, 
  borderColor, 
  onExplore, 
  isScanning,
  progress = 0,
  progressMessage = ''
}) {
  const showProgress = progress > 0 && progress <= 100;

  return (
    <div className={cn(
      "bg-white/94 dark:bg-slate-900/90 backdrop-blur-sm border rounded-2xl p-4.5 relative overflow-hidden transition-all duration-300 shadow-xs hover:bg-white dark:hover:bg-slate-900 hover:border-emerald-300/80 dark:hover:border-emerald-700/80 hover:shadow-sm",
      borderColor
    )}>
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-xl bg-slate-50/90 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/60 flex items-center justify-center shrink-0">
          {icon}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-[14px] truncate">{title}</h3>
          <p className="text-slate-500 dark:text-slate-400 text-[12px] mt-0.5 truncate">{desc}</p>
          
          {tags && tags.length > 0 && (
            <div className="flex gap-1.5 mt-2.5 flex-wrap">
              {tags.map(tag => (
                <span key={tag} className="px-2 py-0.5 bg-slate-100/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-transparent dark:border-slate-700/60 rounded text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Butter-Smooth Apple-Style Accordion Expansion (Zero Layout Snap) */}
          <div 
            className={cn(
              "grid transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden",
              showProgress 
                ? "grid-rows-[1fr] opacity-100 mt-3.5" 
                : "grid-rows-[0fr] opacity-0 mt-0 pointer-events-none"
            )}
          >
            <div className="overflow-hidden min-h-0">
              <div className="flex justify-between items-center text-[11px] mb-1.5">
                <span className="text-slate-600 dark:text-slate-300 font-medium truncate max-w-[80%]">
                  {progressMessage || 'Installing...'}
                </span>
                <span className="text-emerald-700 dark:text-emerald-400 font-bold tabular-nums text-[12px] shrink-0">{progress}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700/60 rounded-full overflow-hidden p-0.5 shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 rounded-full transition-all duration-500 ease-out shadow-xs relative"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end justify-between shrink-0 ml-2">
          <div className="flex gap-2 items-center">
            {onExplore && (
              <button 
                onClick={onExplore}
                title="Open folder in File Explorer"
                className="text-[10px] font-bold text-slate-600 dark:text-slate-400 hover:text-green-600 dark:hover:text-emerald-400 uppercase tracking-wide underline decoration-slate-300 dark:decoration-slate-600 underline-offset-2 transition-colors flex items-center gap-1 cursor-pointer active:scale-95">
                <FolderOpen className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                Explore
              </button>
            )}
            <div className={cn("px-2 py-1 rounded text-[10px] font-bold tracking-wide uppercase flex items-center gap-1 transition-all duration-300", statusColor)}>
              {isScanning && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
              {status}
            </div>
          </div>
          
          <label className="flex items-center gap-1.5 mb-0.5 mt-2 cursor-pointer select-none">
            <input 
              type="checkbox" 
              checked={checked} 
              onChange={onToggle} 
              className="w-3.5 h-3.5 text-green-600 dark:text-emerald-500 rounded border-slate-300 dark:border-slate-600 accent-green-600 cursor-pointer" 
            />
            <span className="text-[12px] font-medium text-slate-700 dark:text-slate-300">{checkboxLabel}</span>
          </label>
        </div>
      </div>
    </div>
  );
}

function MonitorStatus({ label, connected, hasError }) {
  const isMissingDriver = hasError && !connected;

  return (
    <div className={cn(
      "flex items-center justify-between px-3 py-2 rounded-lg border transition-all duration-300 shadow-2xs",
      connected 
        ? "bg-emerald-50/50 dark:bg-emerald-950/40 border-emerald-200/80 dark:border-emerald-800/60 text-emerald-950 dark:text-emerald-200" 
        : isMissingDriver
          ? "bg-amber-50/60 dark:bg-amber-950/40 border-amber-300/80 dark:border-amber-800/60 text-amber-950 dark:text-amber-200"
          : "bg-white dark:bg-slate-800/80 border-slate-200/70 dark:border-slate-700/60 text-slate-600 dark:text-slate-300"
    )}>
      <div className="flex items-center gap-2 min-w-0 pr-2">
        <span className={cn(
          "w-1.5 h-1.5 rounded-full shrink-0 transition-colors",
          connected 
            ? "bg-emerald-500 shadow-2xs shadow-emerald-400 animate-pulse" 
            : isMissingDriver 
              ? "bg-amber-500 shadow-2xs shadow-amber-400 animate-pulse" 
              : "bg-slate-300 dark:bg-slate-600"
        )} />
        <span className="text-[12px] font-medium truncate">{label}</span>
      </div>
      <span className={cn(
        "text-[10px] font-medium tracking-wide uppercase shrink-0 px-2 py-0.5 rounded-md transition-colors",
        connected 
          ? "text-emerald-700 dark:text-emerald-300 bg-white dark:bg-slate-900 border border-emerald-200/60 dark:border-emerald-800/60 shadow-2xs" 
          : isMissingDriver
            ? "text-amber-800 dark:text-amber-300 bg-amber-100/80 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-700 shadow-2xs"
            : "text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-900/60 border border-transparent dark:border-slate-700/40"
      )}>
        {connected ? 'CONNECTED' : isMissingDriver ? 'DRIVER MISSING' : 'WAITING'}
      </span>
    </div>
  );
}

function DeviceMonitorVisual({ connected, mode, brand, model, hasError }) {
  if (!connected) {
    return (
      <div className="rounded-2xl aspect-square w-full flex items-center justify-center relative mb-3.5 transition-all duration-500 overflow-hidden border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/90">
        <svg viewBox="0 0 160 160" className="w-full h-full max-w-[170px] relative z-10">
          {/* Symmetrical Theme Guide Rings */}
          <circle cx="80" cy="80" r="60" fill="none" stroke="#F1F5F9" className="stroke-slate-100 dark:stroke-slate-800" strokeWidth="1.5" />
          <circle cx="80" cy="80" r="44" fill="none" stroke="#E2E8F0" className="stroke-slate-200 dark:stroke-slate-700" strokeWidth="1.2" strokeDasharray="3 3" />

          {/* Gentle Expanding Signal Ring */}
          <circle cx="80" cy="80" r="32" fill="none" stroke="#10B981" strokeWidth="1">
            <animate attributeName="r" values="30; 60" dur="3.2s" repeatCount="indefinite" />
            <animate attributeName="strokeOpacity" values="0.35; 0" dur="3.2s" repeatCount="indefinite" />
          </circle>

          {/* Symmetrical Floating Phone + Cable Group (Dead Center) */}
          <g>
            <animateTransform
              attributeName="transform"
              type="translate"
              values="0,0; 0,-2; 0,0"
              dur="3s"
              repeatCount="indefinite"
            />

            {/* Phone Chassis (White Body + Emerald Outline, Dead Center) */}
            <rect x="67.5" y="55" width="25" height="44" rx="5.5" fill="#FFFFFF" className="fill-white dark:fill-slate-800" stroke="#10B981" strokeWidth="1.5" />

            {/* Screen (Light Slate Interior) */}
            <rect x="70" y="57.5" width="20" height="39" rx="3.5" fill="#F8FAFC" stroke="#E2E8F0" className="fill-slate-50 dark:fill-slate-950 stroke-slate-200 dark:stroke-slate-700" strokeWidth="0.8" />

            {/* Speaker Notch */}
            <rect x="76" y="56.5" width="8" height="1" rx="0.5" fill="#94A3B8" />

            {/* Glowing Universal USB Symbol inside screen */}
            <g opacity="0.9">
              <animate attributeName="opacity" values="0.45; 1; 0.45" dur="2.4s" repeatCount="indefinite" />
              <line x1="80" y1="67" x2="80" y2="82" stroke="#10B981" strokeWidth="1.2" strokeLinecap="round" />
              <path d="M 78 69.5 L 80 66 L 82 69.5 Z" fill="#10B981" />
              <path d="M 80 75 L 76 72 L 76 69" stroke="#10B981" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <rect x="75" y="68" width="2" height="2" fill="#10B981" rx="0.4" />
              <path d="M 80 77 L 84 74 L 84 71" stroke="#10B981" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <circle cx="84" cy="70" r="1.1" fill="#10B981" />
              <circle cx="80" cy="83" r="1.3" fill="#10B981" />
            </g>

            {/* Gesture Bar */}
            <rect x="76" y="93.5" width="8" height="0.7" rx="0.35" fill="#E2E8F0" className="fill-slate-200 dark:fill-slate-700" />

            {/* USB Port Cutout */}
            <rect x="77" y="98" width="6" height="1" rx="0.5" fill="#E2E8F0" className="fill-slate-200 dark:fill-slate-700" />

            {/* Waiting USB Cable & Plug (Dead Center) */}
            <line x1="80" y1="99" x2="80" y2="106.5" stroke="#10B981" strokeWidth="1.3" strokeDasharray="1.8 1.8">
              <animate attributeName="strokeDashoffset" values="0; 7.2" dur="1.2s" repeatCount="indefinite" />
            </line>

            {/* Plug Collar */}
            <rect x="77.5" y="106.5" width="5" height="5.5" rx="1.1" fill="#FFFFFF" className="fill-white dark:fill-slate-800" stroke="#10B981" strokeWidth="1" />
            <line x1="79" y1="108.5" x2="81" y2="108.5" stroke="#10B981" strokeWidth="0.7" />

            {/* Cable Cord Tip */}
            <line x1="80" y1="112" x2="80" y2="116" stroke="#94A3B8" strokeWidth="1.4" strokeLinecap="round" />
          </g>
        </svg>
      </div>
    );
  }

  return (
    <div className={cn(
      "rounded-2xl aspect-square w-full flex items-center justify-center relative mb-3.5 transition-all duration-500 overflow-hidden shadow-xs",
      hasError 
        ? "border border-amber-300 dark:border-amber-700/80 bg-gradient-to-b from-amber-50/60 dark:from-amber-950/40 via-white dark:via-slate-900 to-amber-50/30 dark:to-amber-950/20"
        : "border border-emerald-200/90 dark:border-emerald-800/70 bg-gradient-to-b from-emerald-50/50 dark:from-emerald-950/40 via-white dark:via-slate-900 to-emerald-50/30 dark:to-emerald-950/20"
    )}>
      {/* Ambient Radial Halo */}
      <div className={cn(
        "absolute w-28 h-28 rounded-full blur-xl pointer-events-none animate-pulse",
        hasError ? "bg-amber-400/20 dark:bg-amber-500/15" : "bg-emerald-400/20 dark:bg-emerald-500/15"
      )} />

      {/* 100% Mathematically Symmetrical Vector Display */}
      <svg viewBox="0 0 160 160" className="w-full h-full max-w-[170px] relative z-10 drop-shadow-xs">
        {/* Animated Concentric Breathing Guide Ring */}
        <circle 
          cx="80" 
          cy="80" 
          r="52" 
          fill="none" 
          stroke={hasError ? "#FCD34D" : "#A7F3D0"} 
          className={hasError ? "stroke-amber-400 dark:stroke-amber-500/30" : "stroke-emerald-400 dark:stroke-emerald-500/25"}
          strokeWidth="1.2" 
          strokeDasharray="3 3" 
          opacity="0.6"
        >
          <animate attributeName="strokeDashoffset" values="0; 12" dur="6s" repeatCount="indefinite" />
        </circle>
        
        {/* Ambient Soft Inner Circle */}
        <circle 
          cx="80" 
          cy="80" 
          r="44" 
          fill={hasError ? "#FFFBEB" : "#ECFDF5"} 
          className={hasError ? "fill-amber-50/80 dark:fill-amber-500/10 stroke-amber-200/80 dark:stroke-amber-500/20" : "fill-emerald-50/80 dark:fill-emerald-500/10 stroke-emerald-200/80 dark:stroke-emerald-500/20"}
          strokeWidth="1.2" 
        />

        {/* Floating Phone + Cable Group (100% Symmetrically Centered at cx=80, cy=80) */}
        <g>
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0,0; 0,-2; 0,0"
            dur="3s"
            repeatCount="indefinite"
          />

          {/* Hardware Side Buttons */}
          <rect x="65.3" y="60" width="1.2" height="8" rx="0.6" fill={hasError ? "#F59E0B" : "#10B981"} />
          <rect x="93.5" y="62" width="1.2" height="5.5" rx="0.6" fill={hasError ? "#F59E0B" : "#10B981"} />

          {/* Phone Chassis (Sleek Modern 1:2.0 Ratio, Perfectly Centered at cx=80, cy=80) */}
          <rect 
            x="66.5" 
            y="53" 
            width="27" 
            height="54" 
            rx="5" 
            fill="#FFFFFF" 
            className="fill-white dark:fill-slate-900"
            stroke={hasError ? "#F59E0B" : "#10B981"} 
            strokeWidth="1.5" 
          />

          {/* Screen (Glass Inset) */}
          <rect 
            x="68.8" 
            y="55.3" 
            width="22.4" 
            height="49.4" 
            rx="3.6" 
            fill={hasError ? "#FFFBEB" : "#F8FAFC"} 
            className={hasError ? "fill-amber-50 dark:fill-amber-950/70 stroke-amber-200 dark:stroke-amber-800/60" : "fill-slate-50 dark:fill-[#0b1329] stroke-slate-200 dark:stroke-slate-800"}
            stroke={hasError ? "#FEF3C7" : "#E2E8F0"} 
            strokeWidth="0.8" 
          />

          {/* Speaker Notch & Front Camera */}
          <rect x="76" y="54.4" width="8" height="0.9" rx="0.45" fill="#94A3B8" />
          <circle cx="73.8" cy="54.8" r="0.45" fill="#94A3B8" />

          {/* Screen Center: Verified / Status Badge */}
          {/* Soft Aura Ring */}
          <circle 
            cx="80" 
            cy="74" 
            r="9.5" 
            fill={hasError ? "#F59E0B" : "#10B981"} 
            fillOpacity="0.12"
          >
            <animate attributeName="r" values="8.5; 11.5; 8.5" dur="2.4s" repeatCount="indefinite" />
            <animate attributeName="fillOpacity" values="0.16; 0.05; 0.16" dur="2.4s" repeatCount="indefinite" />
          </circle>

          {/* Badge Body */}
          <circle 
            cx="80" 
            cy="74" 
            r="7.5" 
            fill={hasError ? "#F59E0B" : "#10B981"} 
            stroke={hasError ? "#D97706" : "#059669"} 
            strokeWidth="0.5" 
          />

          {/* Badge Icon */}
          {hasError ? (
            <g>
              <line x1="80" y1="71" x2="80" y2="74.5" stroke="#FFFFFF" strokeWidth="1.4" strokeLinecap="round" />
              <circle cx="80" cy="76.8" r="0.7" fill="#FFFFFF" />
            </g>
          ) : (
            <path 
              d="M 76.8 74 L 79 76.2 L 83.2 72" 
              fill="none" 
              stroke="#FFFFFF" 
              strokeWidth="1.5" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
            />
          )}

          {/* Bottom Gesture Bar */}
          <rect x="75" y="99.5" width="10" height="0.7" rx="0.35" fill="#CBD5E1" className="fill-slate-300 dark:fill-slate-700" />

          {/* Phone USB Port Cutout */}
          <rect x="77" y="106.2" width="6" height="1" rx="0.5" fill="#E2E8F0" className="fill-slate-200 dark:fill-slate-800" />

          {/* Plugged-in USB-C Connector Assembly */}
          {/* Connection Contact Bead (Energy Indicator) */}
          <circle cx="80" cy="107" r="1.1" fill={hasError ? "#FBBF24" : "#34D399"} />

          {/* Plug Shell / Collar */}
          <rect 
            x="77.5" 
            y="107" 
            width="5" 
            height="5.5" 
            rx="1.2" 
            fill="#FFFFFF" 
            className="fill-white dark:fill-slate-800"
            stroke={hasError ? "#F59E0B" : "#10B981"} 
            strokeWidth="1.1" 
          />
          <line x1="78.8" y1="109.8" x2="81.2" y2="109.8" stroke={hasError ? "#F59E0B" : "#10B981"} strokeWidth="0.7" />

          {/* Strain Relief Boot */}
          <rect x="78.5" y="112.5" width="3" height="1.6" rx="0.5" fill="#E2E8F0" stroke="#CBD5E1" strokeWidth="0.5" />

          {/* Connected USB Cable (Stops safely inside circle) */}
          <line 
            x1="80" 
            y1="114.1" 
            x2="80" 
            y2="120" 
            stroke={hasError ? "#F59E0B" : "#10B981"} 
            strokeWidth="1.8" 
            strokeLinecap="round" 
          />

          {/* Animated Data Flow Pulses Down Cable */}
          <line 
            x1="80" 
            y1="114.1" 
            x2="80" 
            y2="120" 
            stroke="#FFFFFF" 
            strokeWidth="1" 
            strokeDasharray="1.8 2.5" 
            strokeLinecap="round"
          >
            <animate attributeName="strokeDashoffset" values="0; -8.6" dur="1s" repeatCount="indefinite" />
          </line>
        </g>
      </svg>
    </div>
  );
}

import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught UI error:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen w-screen bg-slate-50 p-6 text-center select-none font-sans">
          <div className="max-w-md w-full bg-white p-6 rounded-2xl border border-slate-200 shadow-lg flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-lg mb-3">!</div>
            <h2 className="text-base font-bold text-slate-800 mb-1">Renderer Error Caught</h2>
            <p className="text-xs text-slate-500 mb-4 font-mono">{this.state.error?.message || 'Unknown render exception'}</p>
            <button
              onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-xl cursor-pointer transition-all shadow-2xs"
            >
              Reload Dashboard
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function SafeApp() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}

