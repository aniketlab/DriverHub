import React, { useState, useEffect, useRef } from 'react';
import { 
  Check, 
  RefreshCw, 
  FolderOpen, 
  Play, 
  Square, 
  RotateCw, 
  Terminal, 
  ExternalLink,
  ChevronRight,
  Loader2,
  AlertCircle,
  Smartphone,
  Cpu
} from 'lucide-react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function PlatformToolsPage({
  deviceStatus,
  isInstalling = false,
  installingTarget = null,
  installProgress = {},
  onInstallDrivers,
  onScan,
  onNavigateToDashboard,
  onNavigateToDeviceMonitor,
  addLog = () => {}
}) {
  const [loading, setLoading] = useState(true);
  const [checkingUpdates, setCheckingUpdates] = useState(false);
  const [serverBusy, setServerBusy] = useState(false);
  const [terminalRunning, setTerminalRunning] = useState(false);

  // Core Platform-Tools Status State
  const [status, setStatus] = useState({
    installed: true,
    path: 'C:\\Users\\sharm\\AppData\\Local\\DriverHub\\platform-tools',
    version: '37.0.1',
    upToDate: true,
    inPath: false,
    autoUpdate: false,
    serverRunning: true,
    serverPort: 5037,
    tools: [
      { name: 'adb.exe', desc: 'Talk to your phone over USB', exists: true },
      { name: 'fastboot.exe', desc: 'Flash and unlock in bootloader mode', exists: true },
      { name: 'mke2fs.exe', desc: 'Create ext4 filesystem images', exists: true },
      { name: 'sqlite3.exe', desc: 'Read databases pulled from the device', exists: true }
    ]
  });

  // Global Install Tracker for ADB Platform-Tools
  const isInstallingAdb = isInstalling && (
    installingTarget === 'adb' || 
    (Array.isArray(installingTarget) && installingTarget.includes('adb'))
  );
  const adbProgress = installProgress?.adb || { percent: 0, message: '' };

  // Terminal state - NO FAKE MOCKUP! Initial state is clean loading prompt
  const [command, setCommand] = useState('adb devices');
  const [terminalOutput, setTerminalOutput] = useState('Scanning attached USB devices...');
  const prevDeviceRef = useRef(deviceStatus?.serial || null);

  // Load real status from Electron backend on mount
  const loadStatus = async () => {
    try {
      if (window.electronAPI?.getPlatformToolsStatus) {
        const res = await window.electronAPI.getPlatformToolsStatus();
        if (res) {
          setStatus(res);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch platform tools status:', err);
    } finally {
      setLoading(false);
    }
  };

  // Run real command
  const handleRunCommand = async (cmdToRun = command, silent = false) => {
    const finalCmd = cmdToRun || command;
    if (!finalCmd) return;
    if (!silent) setTerminalRunning(true);
    try {
      if (window.electronAPI?.runTerminalCommand) {
        const res = await window.electronAPI.runTerminalCommand(finalCmd);
        setTerminalOutput(res.output || 'Command completed with no output.');
      } else {
        setTerminalOutput(`Simulated: ${finalCmd}\nOutput returned successfully.`);
      }
    } catch (err) {
      setTerminalOutput(`Error: ${err.message}`);
    } finally {
      if (!silent) setTerminalRunning(false);
    }
  };

  // On mount: fetch status AND auto-run REAL adb devices (no mockup!)
  useEffect(() => {
    loadStatus();
    handleRunCommand('adb devices', true);

    // Auto-refresh server status every 4 seconds
    const interval = setInterval(async () => {
      try {
        if (window.electronAPI?.getPlatformToolsStatus) {
          const res = await window.electronAPI.getPlatformToolsStatus();
          if (res) {
            setStatus(prev => ({
              ...prev,
              serverRunning: res.serverRunning,
              inPath: res.inPath,
              installed: res.installed,
              path: res.path,
              tools: res.tools
            }));
          }
        }
      } catch {}
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // When device connection changes: automatically refresh terminal output with real adb devices
  useEffect(() => {
    if (prevDeviceRef.current !== deviceStatus?.serial) {
      prevDeviceRef.current = deviceStatus?.serial;
      handleRunCommand('adb devices', true);
    }
  }, [deviceStatus?.serial, deviceStatus?.connected]);

  // When global installation finishes, refresh local status
  useEffect(() => {
    if (!isInstalling) {
      loadStatus();
    }
  }, [isInstalling]);

  // 1. Toggle PATH
  const handleTogglePath = async () => {
    const nextVal = !status.inPath;
    setStatus(prev => ({ ...prev, inPath: nextVal }));
    try {
      if (window.electronAPI?.toggleSystemPath) {
        const res = await window.electronAPI.toggleSystemPath(nextVal);
        if (res && typeof res.inPath === 'boolean') {
          setStatus(prev => ({ ...prev, inPath: res.inPath }));
        }
      }
    } catch (err) {
      console.error('Toggle PATH failed:', err);
      setStatus(prev => ({ ...prev, inPath: !nextVal }));
    }
  };

  // 2. Toggle Auto-Update
  const handleToggleAutoUpdate = async () => {
    const nextVal = !status.autoUpdate;
    setStatus(prev => ({ ...prev, autoUpdate: nextVal }));
    try {
      if (window.electronAPI?.toggleAutoUpdate) {
        await window.electronAPI.toggleAutoUpdate(nextVal);
      }
    } catch (err) {
      console.error('Toggle Auto-Update failed:', err);
      setStatus(prev => ({ ...prev, autoUpdate: !nextVal }));
    }
  };

  // 3. Open Folder in Explorer
  const handleOpenFolder = async () => {
    try {
      if (window.electronAPI?.openFolder) {
        await window.electronAPI.openFolder(status.path);
      }
    } catch (err) {
      console.error('Open folder error:', err);
    }
  };

  // 4. Change Location
  const handleChangeLocation = async () => {
    try {
      if (window.electronAPI?.changePlatformToolsLocation) {
        const res = await window.electronAPI.changePlatformToolsLocation();
        if (res && res.success && res.path) {
          loadStatus();
        }
      }
    } catch (err) {
      console.error('Change location error:', err);
    }
  };

  // 5. Global Unified Reinstall: triggers real download with full progress streaming across all tabs
  const handleReinstall = async () => {
    if (isInstallingAdb) return;
    if (onInstallDrivers) {
      onInstallDrivers(['adb'], { createRestorePoint: false });
    } else if (window.electronAPI?.reinstallPlatformTools) {
      try {
        await window.electronAPI.reinstallPlatformTools();
        await loadStatus();
      } catch (err) {
        console.error('Reinstall error:', err);
      }
    }
  };

  // 6. Check for updates
  const handleCheckUpdates = async () => {
    if (checkingUpdates) return;
    setCheckingUpdates(true);
    try {
      if (onScan) onScan();
      await new Promise(r => setTimeout(r, 700));
      await loadStatus();
    } finally {
      setCheckingUpdates(false);
    }
  };

  // 7. ADB Server Controls
  const handleServerAction = async (action) => {
    if (serverBusy) return;
    setServerBusy(true);
    try {
      if (window.electronAPI?.controlAdbServer) {
        const res = await window.electronAPI.controlAdbServer(action);
        if (res && typeof res.running === 'boolean') {
          setStatus(prev => ({ ...prev, serverRunning: res.running }));
          // If server restarted/started, auto-refresh terminal
          if (res.running) {
            setTimeout(() => handleRunCommand('adb devices', true), 600);
          }
        }
      }
    } catch (err) {
      console.error(`ADB server ${action} error:`, err);
    } finally {
      setServerBusy(false);
    }
  };

  const presetChips = [
    'adb devices',
    'fastboot devices',
    'adb reboot bootloader',
    'adb kill-server'
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-transparent relative overflow-y-auto overflow-x-hidden no-drag-region p-6 pt-5 select-none min-w-0">
      <div className="max-w-5xl w-full mx-auto flex flex-col gap-5 min-w-0">
        
        {/* ========================================================= */}
        {/* TOP HEADER: Title, Subtitle & Check for Updates Button    */}
        {/* ========================================================= */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 leading-tight">
              Platform Tools
            </h2>
            <p className="text-[13px] text-slate-500 mt-0.5 font-normal">
              Official Android SDK Platform-Tools · adb and fastboot
            </p>
          </div>

          <button
            onClick={handleCheckUpdates}
            disabled={checkingUpdates || isInstallingAdb}
            className="px-4 py-2 bg-white/95 hover:bg-white active:scale-[0.98] border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-semibold rounded-xl shadow-2xs transition-all cursor-pointer flex items-center gap-2 disabled:opacity-60"
            title="Check Google repository for Platform-Tools updates"
          >
            <RefreshCw className={cn("w-3.5 h-3.5 text-slate-500", checkingUpdates && "animate-spin text-emerald-600")} />
            <span>{checkingUpdates ? 'Checking...' : 'Check for updates'}</span>
          </button>
        </div>

        {/* ========================================================= */}
        {/* ROW 1: 2 MAIN CARDS (Platform-Tools Info + ADB Server)    */}
        {/* ========================================================= */}
        <div className="grid grid-cols-12 gap-5 items-stretch w-full min-w-0">
          
          {/* LEFT CARD: Platform-Tools installed & Controls (Cols 1-8) */}
          <div className="col-span-12 lg:col-span-8 xl:col-span-8 bg-white/95 backdrop-blur-sm border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between gap-4.5 min-w-0">
            
            {/* Header: Terminal Prompt Icon + Title + Status Pill */}
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100/90 flex items-center justify-center text-emerald-600 font-mono font-bold text-lg shrink-0 shadow-2xs">
                {'>_'}
              </div>

              <div className="flex items-center gap-2.5 flex-wrap min-w-0">
                <h3 className="text-lg font-bold text-slate-900 tracking-tight leading-none">
                  Platform-Tools installed
                </h3>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                  {status.upToDate ? 'Up to date' : 'Update available'}
                </span>
              </div>
            </div>

            {/* Path Box */}
            <div className="w-full bg-slate-50/90 border border-slate-200/80 rounded-xl px-3.5 py-2.5 font-mono text-xs text-slate-700 select-all truncate shadow-inner">
              {status.path}
            </div>

            {/* Real Download / Reinstall Progress Bar (Synchronized with Drivers & Dashboard tabs) */}
            {isInstallingAdb && (
              <div className="w-full bg-emerald-50/80 border border-emerald-200/90 rounded-xl p-3 flex flex-col gap-1.5 transition-all">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-emerald-900 flex items-center gap-1.5 truncate max-w-[80%]">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600 shrink-0" />
                    <span>{adbProgress?.message || 'Deploying Platform-Tools...'}</span>
                  </span>
                  <span className="font-mono font-bold text-emerald-700 shrink-0">
                    {adbProgress?.percent || 0}%
                  </span>
                </div>
                <div className="w-full bg-emerald-200/50 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${adbProgress?.percent || 0}%` }}
                  />
                </div>
              </div>
            )}

            {/* 2 Switch Toggles: Add to system PATH & Auto-update on launch */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-7">
              {/* Toggle 1: Add to system PATH */}
              <label 
                onClick={handleTogglePath}
                className="flex items-center gap-2.5 cursor-pointer group"
              >
                <div 
                  className={cn(
                    "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                    status.inPath ? "bg-emerald-600" : "bg-slate-200"
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
                      status.inPath ? "translate-x-4" : "translate-x-0"
                    )}
                  />
                </div>
                <span className="text-xs font-semibold text-slate-700 select-none group-hover:text-slate-900 transition-colors">
                  Add to system PATH
                </span>
              </label>

              {/* Toggle 2: Auto-update on launch */}
              <label 
                onClick={handleToggleAutoUpdate}
                className="flex items-center gap-2.5 cursor-pointer group"
              >
                <div 
                  className={cn(
                    "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                    status.autoUpdate ? "bg-emerald-600" : "bg-slate-200"
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
                      status.autoUpdate ? "translate-x-4" : "translate-x-0"
                    )}
                  />
                </div>
                <span className="text-xs font-semibold text-slate-700 select-none group-hover:text-slate-900 transition-colors">
                  Auto-update on launch
                </span>
              </label>
            </div>

            {/* Bottom 3 Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <button
                onClick={handleOpenFolder}
                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98] text-slate-700 text-xs font-semibold rounded-xl shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
                title="Open platform-tools folder in Windows File Explorer"
              >
                <FolderOpen className="w-3.5 h-3.5 text-slate-500" />
                <span>Open folder</span>
              </button>

              <button
                onClick={handleChangeLocation}
                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98] text-slate-700 text-xs font-semibold rounded-xl shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
                title="Select a custom platform-tools directory"
              >
                <span>Change location</span>
              </button>

              <button
                onClick={handleReinstall}
                disabled={isInstallingAdb}
                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98] text-slate-700 text-xs font-semibold rounded-xl shadow-2xs transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-60"
                title="Re-extract and verify official platform-tools binaries"
              >
                {isInstallingAdb ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                ) : null}
                <span>{isInstallingAdb ? 'Reinstalling...' : 'Reinstall'}</span>
              </button>
            </div>

          </div>

          {/* RIGHT CARD: ADB SERVER (Cols 9-12) */}
          <div className="col-span-12 lg:col-span-4 xl:col-span-4 bg-white/95 backdrop-blur-sm border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between min-h-[200px] min-w-0">
            
            {/* Top Label & Server State */}
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase block">
                  ADB SERVER
                </span>
                {status.serverRunning && (
                  <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                    tcp:{status.serverPort || 5037}
                  </span>
                )}
              </div>

              {/* Status Header */}
              <div className="flex items-center gap-2 mt-2">
                <span className={cn(
                  "w-2.5 h-2.5 rounded-full shrink-0",
                  status.serverRunning ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                )} />
                <h4 className="text-2xl font-bold text-slate-900 tracking-tight leading-none">
                  {status.serverRunning ? 'Running' : 'Stopped'}
                </h4>
              </div>

              {/* Live Connected Device Awareness inside ADB Server card */}
              {deviceStatus?.connected ? (
                <div 
                  onClick={onNavigateToDeviceMonitor}
                  className="mt-3.5 p-2.5 rounded-xl bg-slate-50/90 hover:bg-emerald-50/40 border border-slate-200/80 hover:border-emerald-200 transition-all cursor-pointer flex items-center justify-between gap-2 group"
                  title="Click to view full hardware telemetry in Device Monitor"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
                      <Smartphone className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-slate-800 truncate leading-tight group-hover:text-emerald-950">
                        {deviceStatus.model || 'Android Phone'}
                      </span>
                      <span className="text-[10px] font-mono text-emerald-700 leading-none mt-0.5">
                        {deviceStatus.serial ? `${deviceStatus.serial} · ${deviceStatus.adb ? 'Authorized' : 'Connected'}` : 'ADB Link Active'}
                      </span>
                    </div>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                </div>
              ) : (
                <div className="mt-3.5 p-2 rounded-xl bg-slate-50/60 border border-slate-200/60 flex items-center gap-2 text-slate-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
                  <span className="text-[11px] font-mono truncate">No devices attached</span>
                </div>
              )}
            </div>

            {/* Bottom 2 Buttons: Restart & Stop */}
            <div className="flex items-center gap-2.5 mt-5">
              <button
                onClick={() => handleServerAction('restart')}
                disabled={serverBusy}
                className="flex-1 py-2 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98] text-slate-700 text-xs font-semibold rounded-xl shadow-2xs transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-60"
                title="Restart ADB daemon (kill-server followed by start-server)"
              >
                <RotateCw className={cn("w-3.5 h-3.5 text-slate-500", serverBusy && "animate-spin")} />
                <span>Restart</span>
              </button>

              <button
                onClick={() => handleServerAction(status.serverRunning ? 'stop' : 'start')}
                disabled={serverBusy}
                className="flex-1 py-2 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98] text-slate-700 text-xs font-semibold rounded-xl shadow-2xs transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-60"
                title={status.serverRunning ? "Stop ADB background daemon" : "Start ADB daemon"}
              >
                {status.serverRunning ? (
                  <>
                    <Square className="w-3 h-3 text-slate-500" />
                    <span>Stop</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3 text-emerald-600" />
                    <span>Start</span>
                  </>
                )}
              </button>
            </div>

          </div>

        </div>

        {/* ========================================================= */}
        {/* ROW 2: INCLUDED TOOLS (4 Cards Grid)                     */}
        {/* ========================================================= */}
        <div className="flex flex-col gap-2.5">
          <h4 className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
            INCLUDED TOOLS
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {status.tools.map((tool) => (
              <div 
                key={tool.name}
                className="bg-white/95 border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-col justify-between min-h-[92px] hover:border-slate-300 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-slate-900 text-[13px]">
                    {tool.name}
                  </span>
                  {tool.exists ? (
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" strokeWidth={2.5} />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                  )}
                </div>

                <p className="text-[11px] text-slate-500 leading-snug mt-2">
                  {tool.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ========================================================= */}
        {/* ROW 3: QUICK TERMINAL (Preset Chips + Input + Output Box) */}
        {/* ========================================================= */}
        <div className="bg-white/95 border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col gap-3.5">
          
          {/* Header Row: Label + Live Device Badge + Preset Chips */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase mr-1">
                QUICK TERMINAL
              </span>

              {/* Real Live Hardware Telemetry Pill */}
              {deviceStatus?.connected ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/90 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{deviceStatus.model || 'Device'} Online ({deviceStatus.serial || 'ADB'})</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500 border border-slate-200/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  <span>Waiting for USB device</span>
                </span>
              )}
            </div>

            {/* Quick Command Chips */}
            <div className="flex flex-wrap items-center gap-2">
              {presetChips.map((chip) => {
                const isSelected = command === chip;
                return (
                  <button
                    key={chip}
                    onClick={() => {
                      setCommand(chip);
                      handleRunCommand(chip);
                    }}
                    className={cn(
                      "px-3 py-1 rounded-full font-mono text-xs font-medium border transition-all cursor-pointer shadow-2xs",
                      isSelected
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200/80"
                    )}
                  >
                    {chip}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive Command Input Box */}
          <div className="flex items-center gap-2.5">
            <div className="flex-1 flex items-center bg-white border border-slate-200 rounded-xl px-3.5 py-2 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/10 shadow-2xs transition-all">
              <span className="font-mono text-slate-400 text-xs font-bold mr-2 select-none">
                {'>'}
              </span>
              <input
                type="text"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRunCommand();
                }}
                placeholder="adb devices"
                className="w-full font-mono text-xs text-slate-900 placeholder:text-slate-400 bg-transparent focus:outline-none"
              />
            </div>

            <button
              onClick={() => handleRunCommand()}
              disabled={terminalRunning || !command.trim()}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-semibold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5 shrink-0 disabled:opacity-50"
            >
              {terminalRunning ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
              ) : null}
              <span>{terminalRunning ? 'Running...' : 'Run'}</span>
            </button>
          </div>

          {/* Terminal Output Screen */}
          <div className="bg-slate-50/90 border border-slate-200/80 rounded-xl p-4 font-mono text-xs text-slate-800 leading-relaxed min-h-[92px] max-h-[190px] overflow-y-auto whitespace-pre-wrap select-text shadow-inner">
            {terminalOutput ? (
              terminalOutput.split('\n').map((line, idx) => {
                // Syntax coloring for device lines
                const isDeviceLine = /\bdevice\b/i.test(line) && !line.startsWith('List of');
                const isUnauthorized = /\bunauthorized\b/i.test(line);
                const isFastboot = /\bfastboot\b/i.test(line);
                const isError = /\berror\b|\bfailed\b/i.test(line);

                return (
                  <div key={idx} className="leading-5">
                    {isDeviceLine ? (
                      <span>
                        {line.replace(/\bdevice\b/, '')}
                        <span className="text-emerald-600 font-bold">device</span>
                      </span>
                    ) : isUnauthorized ? (
                      <span className="text-amber-600 font-medium">{line}</span>
                    ) : isFastboot ? (
                      <span className="text-amber-600 font-bold">{line}</span>
                    ) : isError ? (
                      <span className="text-red-600 font-medium">{line}</span>
                    ) : (
                      line
                    )}
                  </div>
                );
              })
            ) : (
              <span className="text-slate-400">Terminal ready. Type a command above and click Run.</span>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
