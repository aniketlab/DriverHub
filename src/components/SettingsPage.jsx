import React, { useState, useEffect, useRef } from 'react';
import { 
  Check, 
  RefreshCw, 
  FolderOpen, 
  ShieldCheck, 
  ShieldAlert,
  CheckCircle2,
  AlertCircle, 
  ExternalLink, 
  ChevronRight, 
  ChevronDown, 
  FileText, 
  Bug, 
  ArrowLeft, 
  RotateCcw, 
  Smartphone, 
  Loader2,
  X,
  Sparkles,
  Download,
  ArrowDownToLine,
  Rocket,
  Sun,
  Moon,
  Monitor
} from 'lucide-react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useLanguage } from '../utils/i18n.jsx';
import { haptic } from '../utils/soundEffects';

function GithubIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

const SETTINGS_CACHE_KEY = 'driverhub_settings_cache';

const getDefaultSettings = (currentTheme) => ({
  theme: currentTheme || 'light',
  language: 'English',
  startWithWindows: false,
  minimizeToTray: true,
  autoDetectDevices: true,
  connectionNotifications: true,
  createRestorePoint: true,
  checkForDriverUpdates: true,
  downloadFolder: 'C:\\Android\\drivers',
  isAdmin: false,
  version: '1.0.0',
  platform: 'Windows 10 / 11, 64-bit'
});

const getCachedSettings = (currentTheme) => {
  const defaults = getDefaultSettings(currentTheme);
  try {
    const cached = localStorage.getItem(SETTINGS_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      return {
        ...defaults,
        ...parsed,
        theme: currentTheme || parsed.theme || defaults.theme
      };
    }
  } catch (err) {
    console.warn('Failed to parse cached settings:', err);
  }
  return defaults;
};

export function SettingsPage({
  theme,
  onThemeChange,
  isAdmin: propIsAdmin,
  onElevateAdmin,
  addLog = () => {}
}) {
  const { language, setLanguage, t, supportedLanguages } = useLanguage();
  const [currentView, setCurrentView] = useState('settings'); // 'settings' | 'about'
  const [viewTransition, setViewTransition] = useState('forward'); // 'forward' | 'backward'
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isElevating, setIsElevating] = useState(false);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [lastCheckedTime, setLastCheckedTime] = useState('Today, 10:40 AM');
  const [showChangelogModal, setShowChangelogModal] = useState(false);

  const navigateToAbout = () => {
    haptic.tick();
    setViewTransition('forward');
    setCurrentView('about');
  };

  const navigateToSettings = () => {
    haptic.tick();
    setViewTransition('backward');
    setCurrentView('settings');
  };

  // GitHub Releases OTA Update State
  const [updateStatus, setUpdateStatus] = useState('idle'); // 'idle' | 'checking' | 'up_to_date' | 'update_available' | 'downloading' | 'downloaded' | 'error'
  const [updateInfo, setUpdateInfo] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadSpeed, setDownloadSpeed] = useState(0);
  const [downloadedFilePath, setDownloadedFilePath] = useState(null);
  const [updateError, setUpdateError] = useState(null);

  useEffect(() => {
    if (window.electronAPI?.onUpdateDownloadProgress) {
      window.electronAPI.onUpdateDownloadProgress((progress) => {
        setDownloadProgress(progress.percent || 0);
        if (progress.speed) setDownloadSpeed(progress.speed);
      });
    }
    if (window.electronAPI?.onUpdateDownloaded) {
      window.electronAPI.onUpdateDownloaded((data) => {
        setDownloadedFilePath(data.filePath);
        setUpdateStatus('downloaded');
      });
    }
    return () => {
      if (window.electronAPI?.removeUpdateListeners) {
        window.electronAPI.removeUpdateListeners();
      }
    };
  }, []);

  // Settings State - initialized synchronously from persistent cache to prevent toggle flash/glitch
  const [settings, setSettings] = useState(() => getCachedSettings(theme));

  const handleElevate = async () => {
    if (onElevateAdmin) {
      return onElevateAdmin();
    }
    setIsElevating(true);
    addLog('warning', 'Requesting Administrator permissions via Windows UAC prompt...');
    try {
      if (window.electronAPI?.relaunchAsAdmin) {
        const res = await window.electronAPI.relaunchAsAdmin();
        if (!res?.success) {
          setIsElevating(false);
          addLog('warning', 'Administrator elevation was cancelled or denied by user.');
        }
      }
    } catch (err) {
      setIsElevating(false);
      addLog('error', `Elevation error: ${err.message || 'Unknown error'}`);
    }
  };

  // Load real settings from backend on mount
  const pageContainerRef = useRef(null);

  // Auto-reset scroll to top when switching between settings and about views
  useEffect(() => {
    if (pageContainerRef.current) {
      pageContainerRef.current.scrollTop = 0;
    }
  }, [currentView]);

  // Load real settings from backend on mount only (prevents switch flipping glitch)
  useEffect(() => {
    let isMounted = true;
    const loadRealSettings = async () => {
      try {
        if (window.electronAPI?.getSettings) {
          const res = await window.electronAPI.getSettings();
          if (res && isMounted) {
            setSettings(prev => {
              const merged = {
                ...prev,
                ...res,
                theme: theme || res.theme || prev.theme || 'light'
              };
              try {
                localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(merged));
              } catch {}
              return merged;
            });
          }
        }
      } catch (err) {
        console.warn('Could not load settings:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadRealSettings();
    return () => { isMounted = false; };
  }, []);

  // Sync theme changes from parent without re-fetching all settings from backend
  useEffect(() => {
    if (theme) {
      setSettings(prev => prev.theme === theme ? prev : { ...prev, theme });
    }
  }, [theme]);

  // Handle setting toggle or value change with dual persistence (localStorage + Electron file)
  const updateSetting = async (key, val, event = null) => {
    const updated = { ...settings, [key]: val };
    setSettings(updated);
    try {
      localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(updated));
      if (key === 'createRestorePoint') {
        localStorage.setItem('driverhub_restore_point', String(val));
      }
    } catch {}

    if (key === 'theme' && onThemeChange) {
      onThemeChange(val, event);
    }

    try {
      if (window.electronAPI?.saveSettings) {
        await window.electronAPI.saveSettings({ [key]: val });
      }
    } catch (err) {
      console.error('Failed to save setting:', err);
    }
  };

  // Reset all to defaults
  const handleResetToDefaults = async () => {
    try {
      if (window.electronAPI?.resetSettings) {
        const res = await window.electronAPI.resetSettings();
        setSettings(prev => {
          const merged = { ...prev, ...res };
          try {
            localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(merged));
          } catch {}
          return merged;
        });
        if (onThemeChange) onThemeChange(res.theme || 'light');
      }
    } catch (err) {
      console.error('Reset settings error:', err);
    }
  };

  // Browse download folder
  const handleChangeDownloadFolder = async () => {
    try {
      if (window.electronAPI?.changeDownloadFolder) {
        const res = await window.electronAPI.changeDownloadFolder();
        if (res && res.success && res.path) {
          setSettings(prev => {
            const merged = { ...prev, downloadFolder: res.path };
            try {
              localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(merged));
            } catch {}
            return merged;
          });
        }
      }
    } catch (err) {
      console.error('Change folder error:', err);
    }
  };

  // Open logs folder
  const handleOpenLogs = async () => {
    try {
      if (window.electronAPI?.openLogsFolder) {
        await window.electronAPI.openLogsFolder();
      }
    } catch (err) {
      console.error('Open logs error:', err);
    }
  };

  // Open external URL
  const handleOpenUrl = async (url) => {
    try {
      if (window.electronAPI?.openExternalUrl) {
        await window.electronAPI.openExternalUrl(url);
      } else {
        window.open(url, '_blank');
      }
    } catch (err) {
      console.error('Open URL error:', err);
    }
  };

  // Real GitHub Releases Update Checker
  const handleCheckForUpdates = async () => {
    if (checkingUpdate || updateStatus === 'downloading') return;
    setCheckingUpdate(true);
    setUpdateError(null);
    addLog('info', 'Checking for updates on GitHub (aniketlab/DriverHub)...');

    try {
      if (window.electronAPI?.checkForUpdates) {
        const res = await window.electronAPI.checkForUpdates();
        const now = new Date();
        setLastCheckedTime(`Today, ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);

        if (res.updateAvailable) {
          setUpdateStatus('update_available');
          setUpdateInfo(res);
          addLog('success', `New update found on GitHub: ${res.latestVersion}!`);
        } else {
          setUpdateStatus('up_to_date');
          setUpdateInfo(res);
          addLog('info', res.message || 'Driver Hub is up to date.');
        }
      } else {
        // Fallback for non-electron environment
        await new Promise(r => setTimeout(r, 800));
        const now = new Date();
        setLastCheckedTime(`Today, ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
        setUpdateStatus('up_to_date');
      }
    } catch (err) {
      console.error('Update check failed:', err);
      setUpdateError(err.message || 'Failed to check GitHub releases');
      setUpdateStatus('error');
      addLog('error', `Update check failed: ${err.message}`);
    } finally {
      setCheckingUpdate(false);
    }
  };

  // Download Over-The-Air Update Installer
  const handleDownloadUpdate = async () => {
    if (!updateInfo) return;
    
    if (!updateInfo.downloadUrl || !updateInfo.hasInstaller) {
      if (updateInfo.htmlUrl) {
        handleOpenUrl(updateInfo.htmlUrl);
      }
      return;
    }

    setUpdateStatus('downloading');
    setDownloadProgress(0);
    setDownloadSpeed(0);
    addLog('info', `Starting OTA download: ${updateInfo.assetName}...`);

    try {
      if (window.electronAPI?.downloadUpdate) {
        const res = await window.electronAPI.downloadUpdate({
          downloadUrl: updateInfo.downloadUrl,
          assetName: updateInfo.assetName
        });
        if (res && res.filePath) {
          setDownloadedFilePath(res.filePath);
          setUpdateStatus('downloaded');
          addLog('success', 'Update downloaded successfully. Ready to install!');
        }
      }
    } catch (err) {
      setUpdateStatus('error');
      setUpdateError(err.message || 'Failed to download update');
      addLog('error', `OTA download failed: ${err.message}`);
    }
  };

  // Launch Installer and Restart Driver Hub
  const handleInstallUpdate = async () => {
    if (!downloadedFilePath) return;
    addLog('warning', 'Launching installer with Administrator permissions...');
    try {
      if (window.electronAPI?.installUpdate) {
        await window.electronAPI.installUpdate(downloadedFilePath);
      }
    } catch (err) {
      addLog('error', `Installer launch failed: ${err.message}`);
    }
  };

  // Clean, Smooth Physics Switch Toggle (Zero external glow, pure silky GPU slide)
  const Switch = ({ checked, onChange, disabled = false }) => (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => {
        if (!disabled) {
          haptic.tick();
          onChange(!checked);
        }
      }}
      className={cn(
        "clean-switch",
        checked && "is-checked",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <span className="clean-switch-thumb" />
    </button>
  );

  return (
    <div ref={pageContainerRef} className="flex-1 flex flex-col h-full bg-transparent relative overflow-y-auto overflow-x-hidden no-drag-region p-6 pt-5 select-none min-w-0">
      <div className="max-w-5xl w-full mx-auto flex flex-col gap-5 min-w-0">
        
        {/* ========================================================= */}
        {/* VIEW 1: SETTINGS OVERVIEW PAGE                            */}
        {/* ========================================================= */}
        {currentView === 'settings' ? (
          <div className={cn("flex flex-col gap-5 min-w-0", viewTransition === 'backward' ? "animate-motion-slide-backward" : "animate-motion-tab-enter")}>
            {/* Header */}
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                {t('settings.title')}
              </h2>
              <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5 font-normal">
                {t('settings.subtitle')}
              </p>
            </div>

            {/* Top 2 Cards: GENERAL & INSTALLATION */}
            <div className="grid grid-cols-12 gap-5 items-stretch w-full min-w-0">
              
              {/* 1. GENERAL CARD (Cols 1-6) */}
              <div className="col-span-12 lg:col-span-6 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-5 shadow-xs flex flex-col gap-4 transition-colors">
                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase block">
                  {t('settings.general')}
                </span>

                <div className="flex flex-col gap-4">
                  {/* Row 1: Theme Selector (Light, Dark, System) */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                        {t('settings.theme')}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                        {t('settings.themeDesc')}
                      </span>
                    </div>

                    <div className="inline-flex items-center bg-slate-100 dark:bg-slate-800/90 p-1 rounded-xl border border-slate-200/70 dark:border-slate-700/60 shadow-2xs gap-0.5">
                      {[
                        { id: 'light', label: t('settings.themeLight'), icon: Sun },
                        { id: 'dark', label: t('settings.themeDark'), icon: Moon },
                        { id: 'system', label: t('settings.themeSystem'), icon: Monitor }
                      ].map((m) => {
                        const isCurrent = settings.theme === m.id;
                        const Icon = m.icon;
                        return (
                          <button
                            key={m.id}
                            data-theme-btn={m.id}
                            onClick={(e) => {
                              haptic.tick();
                              updateSetting('theme', m.id, e);
                            }}
                            className={cn(
                              "px-2.5 py-1 text-xs font-semibold rounded-lg capitalize transition-all duration-200 cursor-pointer active:scale-95 flex items-center gap-1.5",
                              isCurrent
                                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs"
                                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                            )}
                          >
                            <Icon className={cn("w-3.5 h-3.5", isCurrent ? "text-emerald-500" : "opacity-70")} />
                            <span>{m.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Row 2: Language */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                        {t('settings.language')}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                        {t('settings.languageDesc')}
                      </span>
                    </div>

                    <div className="relative">
                      <select
                        value={language}
                        onChange={(e) => {
                          const newLang = e.target.value;
                          setLanguage(newLang);
                          updateSetting('language', newLang);
                        }}
                        className="appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl pl-3 pr-8 py-1.5 shadow-2xs focus:outline-none focus:border-emerald-500 cursor-pointer"
                      >
                        {supportedLanguages.map(l => (
                          <option key={l.code} value={l.code}>
                            {l.native} ({l.label})
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  {/* Row 3: Start with Windows */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                        {t('settings.startWithWindows')}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                        {t('settings.startWithWindowsDesc')}
                      </span>
                    </div>
                    <Switch
                      checked={settings.startWithWindows}
                      onChange={(v) => updateSetting('startWithWindows', v)}
                    />
                  </div>

                  {/* Row 4: Minimize to tray */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                        {t('settings.minimizeToTray')}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                        {t('settings.minimizeToTrayDesc')}
                      </span>
                    </div>
                    <Switch
                      checked={settings.minimizeToTray}
                      onChange={(v) => updateSetting('minimizeToTray', v)}
                    />
                  </div>
                </div>
              </div>

              {/* 2. INSTALLATION CARD (Cols 7-12) */}
              <div className="col-span-12 lg:col-span-6 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-5 shadow-xs flex flex-col gap-4 transition-colors">
                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase block">
                  {t('settings.installation')}
                </span>

                <div className="flex flex-col gap-4">
                  {/* Row 1: Create restore point */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                        {t('settings.restorePoint')}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                        {t('settings.restorePointDesc')}
                      </span>
                    </div>
                    <Switch
                      checked={settings.createRestorePoint}
                      onChange={(v) => updateSetting('createRestorePoint', v)}
                    />
                  </div>

                  {/* Row 2: Check for driver updates */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                        {t('settings.checkUpdates')}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                        {t('settings.checkUpdatesDesc')}
                      </span>
                    </div>
                    <Switch
                      checked={settings.checkForDriverUpdates}
                      onChange={(v) => updateSetting('checkForDriverUpdates', v)}
                    />
                  </div>

                  {/* Row 3: Download folder */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                        {t('settings.downloadFolder')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug shrink-0">
                        {t('settings.downloadFolderDesc')}
                      </span>
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span 
                          className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 rounded-lg px-2.5 py-1 text-[11px] font-mono text-slate-600 dark:text-slate-300 truncate max-w-[150px]"
                          title={settings.downloadFolder}
                        >
                          {settings.downloadFolder}
                        </span>
                        <button
                          onClick={handleChangeDownloadFolder}
                          className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg shadow-2xs transition-all cursor-pointer"
                        >
                          {t('settings.change')}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Row 4: Run as Administrator */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                        {t('settings.runAsAdmin')}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                        {t('settings.runAsAdminDesc')}
                      </span>
                    </div>
                    {Boolean(propIsAdmin ?? settings.isAdmin) ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 rounded-xl shadow-2xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        {t('settings.adminElevated')}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleElevate}
                        disabled={isElevating}
                        className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 rounded-xl transition-all cursor-pointer shadow-2xs active:scale-95 disabled:opacity-60"
                        title="Click to relaunch Driver Hub as Administrator"
                      >
                        {isElevating ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600 dark:text-amber-400" />
                            <span>Requesting...</span>
                          </>
                        ) : (
                          <>
                            <ShieldAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                            <span>{t('settings.restartAsAdmin')}</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>

            </div>

            {/* Bottom 2 Cards: DEVICE DETECTION & ABOUT APP TILE */}
            <div className="grid grid-cols-12 gap-5 items-stretch w-full min-w-0">
              
              {/* 3. DEVICE DETECTION (Cols 1-6) */}
              <div className="col-span-12 lg:col-span-6 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-5 shadow-xs flex flex-col gap-4 transition-colors">
                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase block">
                  {t('settings.deviceDetection')}
                </span>

                <div className="flex flex-col gap-4">
                  {/* Row 1: Auto-detect devices */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                        {t('settings.autoDetect')}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                        {t('settings.autoDetectDesc')}
                      </span>
                    </div>
                    <Switch
                      checked={settings.autoDetectDevices}
                      onChange={(v) => updateSetting('autoDetectDevices', v)}
                    />
                  </div>

                  {/* Row 2: Connection notifications */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                        {t('settings.notifications')}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                        {t('settings.notificationsDesc')}
                      </span>
                    </div>
                    <Switch
                      checked={settings.connectionNotifications}
                      onChange={(v) => updateSetting('connectionNotifications', v)}
                    />
                  </div>
                </div>
              </div>

              {/* 4. DRIVER HUB APP TILE (Cols 7-12) */}
              <div className="col-span-12 lg:col-span-6 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-5 shadow-xs flex items-center justify-between gap-4 transition-colors">
                
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Real Original Driver Hub App Icon from /logo/ */}
                  <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 shadow-2xs border border-emerald-200/80 dark:border-emerald-800/80 bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center p-1">
                    <img 
                      src="./logo/driverhub_app_icon_squircle.png" 
                      alt="Driver Hub" 
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/logo/driverhub_app_icon_squircle.png';
                      }}
                    />
                  </div>

                  <div className="flex flex-col min-w-0">
                    <h4 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                      Driver Hub
                    </h4>
                    <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Version 1.0.0 · {t('about.upToDate')}
                    </span>
                  </div>
                </div>

                <button
                  onClick={navigateToAbout}
                  className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-[0.95] text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl shadow-2xs hover:shadow-xs transition-all duration-200 cursor-pointer shrink-0"
                >
                  {t('settings.aboutUpdates')}
                </button>
              </div>

            </div>

            {/* Footer Row: Changes saved automatically & Reset to defaults */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-400 dark:text-slate-500">
                {t('settings.savedAuto')}
              </span>

              <button
                onClick={handleResetToDefaults}
                className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-[0.98] text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl shadow-2xs transition-all cursor-pointer"
              >
                {t('settings.resetDefaults')}
              </button>
            </div>
          </div>
        ) : (
          /* ========================================================= */
          /* VIEW 2: ABOUT & UPDATES SUB-PAGE                          */
          /* ========================================================= */
          <div className="flex flex-col gap-5 min-w-0 animate-motion-slide-forward">
            {/* Header & Breadcrumb Nav */}
            <div className="flex flex-col gap-1">
              <button
                type="button"
                onClick={navigateToSettings}
                className="group inline-flex items-center gap-2 py-1 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer w-fit"
              >
                <ArrowLeft className="w-4 h-4 shrink-0 transition-transform duration-150 group-hover:-translate-x-1 text-slate-500 dark:text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400" />
                <span>{t('nav.settings')}</span>
                <span className="text-slate-300 dark:text-slate-600 font-normal">/</span>
                <span className="text-slate-800 dark:text-slate-200 font-semibold">{t('settings.aboutUpdates')}</span>
              </button>

              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight mt-1">
                {t('about.title')}
              </h2>
            </div>

            {/* Top 2 Cards: Hero Info + Update Status */}
            <div className="grid grid-cols-12 gap-5 items-stretch w-full min-w-0">
              
              {/* Left Hero Card (Cols 1-8) */}
              <div className="col-span-12 lg:col-span-8 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-6 shadow-xs flex items-center gap-5 transition-colors">
                {/* Real Original Driver Hub App Icon from /logo/ */}
                <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 shadow-xs border border-emerald-200/80 dark:border-emerald-800/80 bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center p-1.5">
                  <img 
                    src="./logo/driverhub_app_icon_squircle.png" 
                    alt="Driver Hub" 
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/logo/driverhub_app_icon_squircle.png';
                    }}
                  />
                </div>

                <div className="flex flex-col min-w-0">
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight tracking-tight">
                    Driver Hub
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                    {t('about.subtitle')}
                  </p>
                  
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700">
                      Version 1.0.0
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700">
                      Windows 10 / 11
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Update Card (Cols 9-12) */}
              <div className="col-span-12 lg:col-span-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between gap-4 transition-colors">
                <div>
                  {updateStatus === 'update_available' ? (
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                          <Sparkles className="w-3 h-3" />
                        </div>
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          {t('about.updateAvailable')} ({updateInfo?.latestVersion})
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block font-medium">
                        {updateInfo?.assetSize ? formatBytes(updateInfo.assetSize) : 'New Release'} · GitHub OTA
                      </span>
                      {updateInfo?.releaseNotes && (
                        <div className="mt-2.5 p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 rounded-xl text-[10.5px] text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                          {updateInfo.releaseNotes}
                        </div>
                      )}
                    </div>
                  ) : updateStatus === 'downloading' ? (
                    <div>
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 text-emerald-500 animate-spin shrink-0" />
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          Downloading OTA Update...
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 mt-2.5 overflow-hidden">
                        <div 
                          className="bg-emerald-500 h-full rounded-full transition-all duration-150"
                          style={{ width: `${downloadProgress}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10.5px] text-slate-500 dark:text-slate-400 mt-1 font-mono">
                        <span>{downloadProgress}%</span>
                        {downloadSpeed > 0 && <span>{formatBytes(downloadSpeed)}/s</span>}
                      </div>
                    </div>
                  ) : updateStatus === 'downloaded' ? (
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                          <Check className="w-3 h-3" strokeWidth={3} />
                        </div>
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          {t('about.restartInstall')}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block font-medium">
                        Package downloaded. Click below to restart & update.
                      </span>
                    </div>
                  ) : updateStatus === 'error' ? (
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                          <AlertCircle className="w-3 h-3" />
                        </div>
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          Check Failed
                        </span>
                      </div>
                      <span className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 block font-medium truncate" title={updateError}>
                        {updateError || 'Could not connect to GitHub'}
                      </span>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                          <Check className="w-3 h-3" strokeWidth={3} />
                        </div>
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          {t('about.upToDate')}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 block font-medium">
                        {updateInfo?.status === 'no_releases'
                          ? 'GitHub repo active · ' + t('about.lastChecked') + ' ' + lastCheckedTime
                          : t('about.lastChecked') + ' ' + lastCheckedTime}
                      </span>
                    </div>
                  )}
                </div>

                {/* Bottom Action Button */}
                {updateStatus === 'update_available' ? (
                  <div className="flex flex-col gap-1.5">
                    <button
                      onClick={handleDownloadUpdate}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-semibold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <ArrowDownToLine className="w-3.5 h-3.5" />
                      <span>{t('about.downloadOTA')}</span>
                    </button>
                    {updateInfo?.htmlUrl && (
                      <button
                        onClick={() => handleOpenUrl(updateInfo.htmlUrl)}
                        className="w-full py-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white text-[11px] font-medium flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <span>View Release Notes</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ) : updateStatus === 'downloading' ? (
                  <button
                    disabled
                    className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-semibold text-xs rounded-xl flex items-center justify-center gap-2 cursor-not-allowed"
                  >
                    <span>Downloading in background...</span>
                  </button>
                ) : updateStatus === 'downloaded' ? (
                  <button
                    onClick={handleInstallUpdate}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-semibold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Rocket className="w-3.5 h-3.5" />
                    <span>{t('about.restartInstall')}</span>
                  </button>
                ) : (
                  <button
                    onClick={handleCheckForUpdates}
                    disabled={checkingUpdate}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-semibold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    <RefreshCw className={cn("w-3.5 h-3.5", checkingUpdate && "animate-spin")} />
                    <span>{checkingUpdate ? t('about.checkingUpdates') : t('about.checkForUpdates')}</span>
                  </button>
                )}
              </div>

            </div>

            {/* Middle 2 Cards: APP DETAILS & LINKS */}
            <div className="grid grid-cols-12 gap-5 items-stretch w-full min-w-0">
              
              {/* APP DETAILS (Cols 1-6) */}
              <div className="col-span-12 lg:col-span-6 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-5 shadow-xs flex flex-col gap-3 transition-colors">
                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase block">
                  {t('about.appDetails')}
                </span>

                <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  <div className="flex items-center justify-between py-2.5 text-xs">
                    <span className="text-slate-500 dark:text-slate-400">{t('about.version')}</span>
                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">1.0.0</span>
                  </div>

                  <div className="flex items-center justify-between py-2.5 text-xs">
                    <span className="text-slate-500 dark:text-slate-400">{t('about.platform')}</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">Windows 10 / 11, 64-bit</span>
                  </div>

                  <div className="flex items-center justify-between py-2.5 text-xs">
                    <span className="text-slate-500 dark:text-slate-400">{t('about.bundledTools')}</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">ADB, Fastboot</span>
                  </div>

                  <div className="flex items-center justify-between py-2.5 text-xs">
                    <span className="text-slate-500 dark:text-slate-400">{t('about.driverPacks')}</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">Google USB, MediaTek</span>
                  </div>
                </div>
              </div>

              {/* LINKS (Cols 7-12) */}
              <div className="col-span-12 lg:col-span-6 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-5 shadow-xs flex flex-col gap-3 transition-colors">
                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase block">
                  {t('about.links')}
                </span>

                <div className="flex flex-col gap-1">
                  {/* What is new (changelog) */}
                  <button
                    onClick={() => setShowChangelogModal(true)}
                    className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors text-left cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <FileText className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-emerald-600 transition-colors" />
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white">
                        {t('about.changelog')}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:translate-x-0.5 transition-transform" />
                  </button>

                  {/* Report an issue */}
                  <button
                    onClick={() => handleOpenUrl('https://github.com/aniketlab/DriverHub/issues')}
                    className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors text-left cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <Bug className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-emerald-600 transition-colors" />
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white">
                        {t('about.reportIssue')}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:translate-x-0.5 transition-transform" />
                  </button>

                  {/* Open source on GitHub */}
                  <button
                    onClick={() => handleOpenUrl('https://github.com/aniketlab/DriverHub')}
                    className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors text-left cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <GithubIcon className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-emerald-600 transition-colors" />
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white">
                        {t('about.github')}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:translate-x-0.5 transition-transform" />
                  </button>

                  {/* View logs folder */}
                  <button
                    onClick={handleOpenLogs}
                    className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors text-left cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <FolderOpen className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-emerald-600 transition-colors" />
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white">
                        {t('about.logs')}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>

            </div>

            {/* Bottom Card: MADE BY & CREDITS */}
            <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6 transition-colors">
              <div className="flex flex-col min-w-[160px]">
                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase block">
                  {t('about.madeBy')}
                </span>
                <span className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                  Aniket Sharma
                </span>
                <button
                  onClick={() => handleOpenUrl('https://github.com/aniketlab')}
                  className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-mono text-left cursor-pointer mt-0.5"
                >
                  github.com/aniketlab
                </button>
              </div>

              <div className="flex flex-col md:max-w-md">
                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase block">
                  {t('about.credits')}
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
                  {t('about.creditsDesc')}
                </p>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* CHANGELOG MODAL */}
      {showChangelogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-xl flex flex-col gap-4 animate-motion-modal">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {t('changelog.title')} · v1.0.0
              </h3>
              <button
                onClick={() => setShowChangelogModal(false)}
                className="w-7 h-7 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-300 space-y-2.5 max-h-[60vh] overflow-y-auto pr-2 leading-relaxed custom-scrollbar-slim">
              {updateInfo?.releaseNotes && updateInfo.latestVersion && (
                <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/80 rounded-xl">
                  <span className="font-bold text-indigo-800 dark:text-indigo-300 block mb-1">
                    🚀 Latest Release on GitHub: {updateInfo.latestVersion}
                  </span>
                  <div className="text-[11px] text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {updateInfo.releaseNotes}
                  </div>
                </div>
              )}

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/80 rounded-xl">
                <span className="font-bold text-emerald-800 dark:text-emerald-300 block mb-1">
                  🎉 {t('changelog.launchTitle')}
                </span>
                <span>{t('changelog.launchDesc')}</span>
              </div>

              <ul className="list-disc pl-5 space-y-1.5 text-slate-700 dark:text-slate-300">
                <li><strong>All-in-one Driver Installer:</strong> Google USB Driver, Android Bootloader Interface, MediaTek VCOM & Preloader BROM.</li>
                <li><strong>Live Device Monitor:</strong> Real-time USB hardware bus telemetry, MTP/ADB/Fastboot auto-detection, and live battery/specs reading.</li>
                <li><strong>Platform Tools Hub:</strong> Bundled ADB & Fastboot with interactive quick terminal, PATH management, and TCP socket server controls.</li>
                <li><strong>System Restore Protection:</strong> Automatic Windows Restore Point creation prior to any DriverStore modifications.</li>
                <li><strong>Dark & Light Themes:</strong> Polished high-contrast dark theme with calibrated responsive ambient glows.</li>
              </ul>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowChangelogModal(false)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs cursor-pointer"
              >
                {t('changelog.close')}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
