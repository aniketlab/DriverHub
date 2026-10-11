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
  Smartphone
} from 'lucide-react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';
import { DeviceMonitorPage } from './components/DeviceMonitorPage';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

function App() {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [isScanning, setIsScanning] = useState(false);

  // Individual driver scan states
  const [driverStates, setDriverStates] = useState({
    adb: { scanning: false, scanned: false, installed: false, path: null },
    google: { scanning: false, scanned: false, installed: false },
    mtk: { scanning: false, scanned: false, installed: false, name: null }
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
          setDriverStates(prev => ({
            ...prev,
            [target]: { ...prev[target], scanning: true }
          }));

          if (target === 'adb') addLog('pending', 'Searching system PATH & LocalAppData for ADB Platform-Tools...');
          if (target === 'google') addLog('pending', 'Querying Windows DriverStore for Google USB Bootloader Driver...');
          if (target === 'mtk') addLog('pending', 'Scanning DriverStore for MediaTek VCOM & Preloader Drivers...');
        } 
        else if (state === 'done') {
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

    return () => {
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

  const selectedCount = Object.values(selectedDrivers).filter(Boolean).length;

  const isAnyDeviceConnected = deviceStatus.connected;

  return (
    <div className="flex flex-col h-screen w-full bg-slate-50 text-slate-800 overflow-hidden font-sans">
      {/* 1. TOP UNIFIED TITLE BAR (Full window width, matching reference design) */}
      <header className="h-[38px] w-full bg-white border-b border-slate-200/90 flex items-center justify-between px-4 select-none drag-region shrink-0 z-40">
        <div className="flex items-center gap-2.5 no-drag-region">
          <div className="w-5 h-5 rounded-md border border-emerald-500/80 flex items-center justify-center text-emerald-600 bg-emerald-50/50">
            <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <span className="font-bold text-[13px] tracking-wide text-slate-900 uppercase">
            Driver <span className="text-emerald-600">Hub</span>
          </span>
          <span className="text-slate-300 font-light">|</span>
          <span className="text-[12px] text-slate-500 font-normal">
            All-in-one Android driver installer
          </span>
        </div>
        {/* Windows Titlebar Controls Placement Area */}
        <div className="w-28 h-full" />
      </header>

      {/* 2. BODY CONTAINER BELOW TITLE BAR */}
      <div className="flex flex-1 overflow-hidden h-[calc(100vh-38px)] w-full">
        {/* LEFT SIDEBAR */}
        <div className="w-[220px] bg-white border-r border-slate-200 flex flex-col justify-between p-4 pt-5 pb-4 h-full relative z-10 shadow-sm no-drag-region shrink-0">
          <nav className="flex flex-col gap-1">
            <NavItem icon={LayoutDashboard} label="Dashboard" active={activeTab === 'Dashboard'} onClick={() => setActiveTab('Dashboard')} />
            <NavItem icon={Download} label="Drivers" active={activeTab === 'Drivers'} onClick={() => setActiveTab('Drivers')} />
            <NavItem icon={ChevronRight} label="Platform Tools" active={activeTab === 'Platform Tools'} onClick={() => setActiveTab('Platform Tools')} />
            <NavItem icon={MonitorSmartphone} label="Device Monitor" active={activeTab === 'Device Monitor'} onClick={() => setActiveTab('Device Monitor')} />
            <NavItem icon={Settings} label="Settings" active={activeTab === 'Settings'} onClick={() => setActiveTab('Settings')} />
          </nav>

          <div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] text-slate-500 leading-relaxed">
              <div className="font-semibold text-slate-700 mb-0.5">Windows 10 / 11</div>
              Run as Administrator to install drivers.
            </div>
          </div>
        </div>

        {activeTab === 'Device Monitor' ? (
          <DeviceMonitorPage
            deviceStatus={deviceStatus}
            onRefresh={handleScan}
            onNavigateToDrivers={() => setActiveTab('Dashboard')}
            onRebootBootloader={() => {
              addLog('info', 'Command triggered: adb reboot bootloader');
            }}
            onRebootRecovery={() => {
              addLog('info', 'Command triggered: adb reboot recovery');
            }}
            onOpenShell={() => {
              addLog('info', 'Command triggered: adb shell');
            }}
            activityLogs={logs.map(l => ({
              time: l.time,
              text: l.text,
              highlight: l.type === 'success'
            }))}
            isRefreshing={isScanning}
          />
        ) : (
          <>
            {/* MAIN CONTENT AREA */}
            <div className="flex-1 flex flex-col h-full bg-slate-50 relative p-6 pt-5 no-drag-region overflow-y-auto min-w-[500px]">
              <div className="max-w-4xl w-full mx-auto flex-1 flex flex-col gap-5">
          
          {/* Header Row */}
          <div className="flex justify-between items-end mb-1">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-800 leading-tight">Every Android driver.</h2>
              <h2 className="text-2xl font-bold tracking-tight text-green-600 mb-1 leading-tight">One installer.</h2>
              <p className="text-slate-500 text-[13px]">Pick what you need, then install in a single click.</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button 
                onClick={handleScan}
                disabled={isScanning || isInstalling}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg shadow-sm hover:bg-slate-50 active:scale-[0.97] transition-all duration-200 text-[13px] whitespace-nowrap disabled:opacity-50 flex items-center gap-1.5 cursor-pointer">
                {isScanning && <Loader2 className="w-3.5 h-3.5 animate-spin text-green-600" />}
                {isScanning ? 'Scanning System...' : 'Scan PC'}
              </button>
              <button 
                onClick={handleInstall}
                disabled={isInstalling || isScanning || selectedCount === 0}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 active:scale-[0.97] text-white font-medium rounded-lg shadow-sm transition-all duration-200 text-[13px] whitespace-nowrap cursor-pointer disabled:opacity-50 flex items-center gap-1.5">
                {isInstalling && <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />}
                {isInstalling 
                  ? 'Installing...' 
                  : `Install selected (${selectedCount})`}
              </button>
            </div>
          </div>

          {/* Cards List */}
          <div className="flex flex-col gap-3 flex-1">
            
            {/* 1. ADB Card */}
            <DriverCard 
              icon={<ChevronRight className="w-4 h-4 text-green-600" />}
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
                  ? 'text-blue-600 bg-blue-50 border border-blue-200'
                  : driverStates.adb.scanned
                    ? (driverStates.adb.installed ? 'text-green-700 bg-green-50 border border-green-200' : 'text-amber-700 bg-amber-50 border border-amber-200')
                    : 'text-slate-500 bg-slate-100'
              }
              checkboxLabel={driverStates.adb.installed ? 'Reinstall' : 'Selected'}
              checked={selectedDrivers.adb}
              onToggle={() => setSelectedDrivers(prev => ({ ...prev, adb: !prev.adb }))}
              borderColor={driverStates.adb.installed ? 'border-green-200' : 'border-slate-200'}
              onExplore={driverStates.adb.installed && driverStates.adb.path ? () => window.electronAPI.openFolder(driverStates.adb.path) : null}
            />

            {/* 2. Google USB Card */}
            <DriverCard 
              icon={<Download className="w-4 h-4 text-amber-500" />}
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
                  ? 'text-blue-600 bg-blue-50 border border-blue-200'
                  : driverStates.google.scanned
                    ? (driverStates.google.installed ? 'text-green-700 bg-green-50 border border-green-200' : 'text-amber-700 bg-amber-50 border border-amber-200')
                    : 'text-slate-500 bg-slate-100'
              }
              checkboxLabel={driverStates.google.installed ? 'Reinstall' : 'Selected'}
              checked={selectedDrivers.google}
              onToggle={() => setSelectedDrivers(prev => ({ ...prev, google: !prev.google }))}
              borderColor={driverStates.google.installed ? 'border-green-200' : 'border-slate-200'}
            />

            {/* 3. MediaTek MTK Card */}
            <DriverCard 
              icon={<Database className="w-4 h-4 text-blue-500" />}
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
                  ? 'text-blue-600 bg-blue-50 border border-blue-200'
                  : driverStates.mtk.scanned
                    ? (driverStates.mtk.installed ? 'text-green-700 bg-green-50 border border-green-200' : 'text-amber-700 bg-amber-50 border border-amber-200')
                    : 'text-slate-500 bg-slate-100'
              }
              checkboxLabel={driverStates.mtk.installed ? 'Reinstall' : 'Selected'}
              checked={selectedDrivers.mtk}
              onToggle={() => setSelectedDrivers(prev => ({ ...prev, mtk: !prev.mtk }))}
              borderColor={driverStates.mtk.installed ? 'border-green-200' : 'border-slate-200'}
            />

          </div>

          {/* Terminal / Install Log */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 h-32 font-mono text-[11px] text-slate-600 overflow-y-auto mt-1 shadow-sm shrink-0 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-slate-800 font-sans text-[10px] uppercase tracking-wider">Install Log</h4>
                <span className="text-[10px] text-slate-400 font-sans">Live Console</span>
              </div>
              <div className="flex flex-col gap-1">
                {logs.map((log, index) => (
                  <p key={index} className="leading-relaxed">
                    {log.type === 'success' && <span className="text-green-600 font-bold mr-1.5">[ok]</span>}
                    {log.type === 'pending' && <span className="text-blue-500 font-bold mr-1.5">[..]</span>}
                    {log.type === 'warning' && <span className="text-amber-500 font-bold mr-1.5">[!]</span>}
                    {log.type === 'error' && <span className="text-rose-500 font-bold mr-1.5">[err]</span>}
                    {log.type === 'info' && <span className="text-slate-400 font-bold mr-1.5">[--]</span>}
                    <span>{log.text}</span>
                  </p>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* RIGHT SIDEBAR: DEVICE MONITOR (Restored Halo Rings, USB Cable, and Perfect Alignment) */}
      <div className="w-[250px] bg-white border-l border-slate-200 p-5 pt-5 h-full flex flex-col relative z-10 shadow-sm no-drag-region shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-slate-800 text-[11px] uppercase tracking-wider">Device Monitor</h4>
          <span className="flex h-2 w-2 relative">
            <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", isAnyDeviceConnected ? "bg-emerald-400" : "bg-slate-300")} />
            <span className={cn("relative inline-flex rounded-full h-2 w-2", isAnyDeviceConnected ? "bg-emerald-500" : "bg-slate-400")} />
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
                  ? "bg-amber-50 text-amber-700 border-amber-300"
                  : "bg-emerald-50 text-emerald-700 border-emerald-200/70"
              )}>
                <span className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  deviceStatus.driverError ? "bg-amber-500 animate-pulse" : "bg-emerald-500 animate-pulse"
                )} />
                <span>{deviceStatus.driverError ? "Driver Missing ⚠️" : "Connected"}</span>
              </div>
              <h5 className="text-[13px] font-semibold text-slate-800 leading-tight truncate max-w-full">
                {deviceStatus.model || 'Android Phone'}
              </h5>
              <p className="text-[11px] text-slate-400 font-normal mt-0.5 truncate max-w-full">
                {deviceStatus.rawModel && deviceStatus.model !== deviceStatus.rawModel ? `${deviceStatus.rawModel} • ` : ''}
                {deviceStatus.mode || 'USB Mode'}
              </p>
            </div>
          ) : (
            <p className="text-[11px] text-slate-400 leading-relaxed font-normal">
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
        "flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all whitespace-nowrap cursor-pointer",
        active 
          ? "bg-green-50 text-green-700" 
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
      )}
    >
      <Icon className={cn("w-4 h-4 shrink-0", active ? "text-green-600" : "text-slate-400")} />
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
      "bg-white border rounded-xl p-4 relative overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] shadow-2xs",
      borderColor
    )}>
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
          {icon}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-800 text-[14px] truncate">{title}</h3>
          <p className="text-slate-500 text-[12px] mt-0.5 truncate">{desc}</p>
          
          {tags && tags.length > 0 && (
            <div className="flex gap-1.5 mt-2.5 flex-wrap">
              {tags.map(tag => (
                <span key={tag} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap">
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
                <span className="text-slate-600 font-medium truncate max-w-[80%]">
                  {progressMessage || 'Installing...'}
                </span>
                <span className="text-emerald-700 font-bold tabular-nums text-[12px] shrink-0">{progress}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 border border-slate-200/70 rounded-full overflow-hidden p-0.5 shadow-inner">
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
                className="text-[10px] font-bold text-slate-600 hover:text-green-600 uppercase tracking-wide underline decoration-slate-300 underline-offset-2 transition-colors flex items-center gap-1 cursor-pointer active:scale-95">
                <FolderOpen className="w-3 h-3 text-slate-400" />
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
              className="w-3.5 h-3.5 text-green-600 rounded border-slate-300 accent-green-600 cursor-pointer" 
            />
            <span className="text-[12px] font-medium text-slate-700">{checkboxLabel}</span>
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
        ? "bg-emerald-50/50 border-emerald-200/80 text-emerald-950" 
        : isMissingDriver
          ? "bg-amber-50/60 border-amber-300/80 text-amber-950"
          : "bg-white border-slate-200/70 text-slate-600"
    )}>
      <div className="flex items-center gap-2 min-w-0 pr-2">
        <span className={cn(
          "w-1.5 h-1.5 rounded-full shrink-0 transition-colors",
          connected 
            ? "bg-emerald-500 shadow-2xs shadow-emerald-400 animate-pulse" 
            : isMissingDriver 
              ? "bg-amber-500 shadow-2xs shadow-amber-400 animate-pulse" 
              : "bg-slate-300"
        )} />
        <span className="text-[12px] font-medium truncate">{label}</span>
      </div>
      <span className={cn(
        "text-[10px] font-medium tracking-wide uppercase shrink-0 px-2 py-0.5 rounded-md transition-colors",
        connected 
          ? "text-emerald-700 bg-white border border-emerald-200/60 shadow-2xs" 
          : isMissingDriver
            ? "text-amber-800 bg-amber-100/80 border border-amber-300 shadow-2xs"
            : "text-slate-400 bg-slate-50"
      )}>
        {connected ? 'CONNECTED' : isMissingDriver ? 'DRIVER MISSING' : 'WAITING'}
      </span>
    </div>
  );
}

function DeviceMonitorVisual({ connected, mode, brand, model, hasError }) {
  if (!connected) {
    return (
      <div className="rounded-2xl aspect-square w-full flex items-center justify-center relative mb-3.5 transition-all duration-500 overflow-hidden border border-slate-200/80 bg-white">
        <svg viewBox="0 0 160 160" className="w-full h-full max-w-[170px]">
          {/* Symmetrical Inactive Guide Rings */}
          <circle cx="80" cy="75" r="56" fill="none" stroke="#F1F5F9" strokeWidth="1.5" />
          <circle cx="80" cy="75" r="42" fill="none" stroke="#E2E8F0" strokeWidth="1.5" strokeDasharray="3 3" />

          {/* Symmetrical Disconnected Phone Wireframe */}
          <rect x="66" y="49" width="28" height="52" rx="6" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1.5" />
          <rect x="69" y="53" width="22" height="44" rx="3.5" fill="#F1F5F9" stroke="#E2E8F0" strokeWidth="1" />
          
          {/* Speaker Slit */}
          <rect x="76" y="51" width="8" height="1.2" rx="0.6" fill="#94A3B8" />

          {/* Waiting USB Cable */}
          <line x1="80" y1="101" x2="80" y2="114" stroke="#CBD5E1" strokeWidth="1.5" strokeDasharray="2 2" />
          <circle cx="80" cy="116" r="2" fill="#CBD5E1" />
        </svg>
      </div>
    );
  }

  return (
    <div className={cn(
      "rounded-2xl aspect-square w-full flex items-center justify-center relative mb-3.5 transition-all duration-500 overflow-hidden shadow-xs",
      hasError 
        ? "border border-amber-300 bg-gradient-to-b from-amber-50/60 via-white to-amber-50/30"
        : "border border-emerald-200/90 bg-gradient-to-b from-emerald-50/50 via-white to-emerald-50/30"
    )}>
      {/* Ambient Radial Halo */}
      <div className={cn(
        "absolute w-28 h-28 rounded-full blur-xl pointer-events-none animate-pulse",
        hasError ? "bg-amber-400/20" : "bg-emerald-400/20"
      )} />

      {/* 100% Mathematically Symmetrical Vector Display */}
      <svg viewBox="0 0 160 160" className="w-full h-full max-w-[170px] relative z-10 drop-shadow-xs">
        {/* Animated Concentric Radar Halo */}
        <circle cx="80" cy="75" r="62" fill="none" stroke={hasError ? "#FCD34D" : "#A7F3D0"} strokeWidth="1.5" opacity="0.6">
          <animate attributeName="r" values="52;66;52" dur="3s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.7;0.15;0.7" dur="3s" repeatCount="indefinite" />
        </circle>
        
        {/* Middle Pulse Circle */}
        <circle cx="80" cy="75" r="48" fill={hasError ? "#FFFBEB" : "#ECFDF5"} fillOpacity="0.5" stroke={hasError ? "#FBBF24" : "#6EE7B7"} strokeWidth="1.5" />

        {/* High-Tech Smartphone Mockup (Center: x=80, y=75) */}
        {/* Chassis */}
        <rect x="64" y="46" width="32" height="58" rx="6.5" fill="#0F172A" stroke={hasError ? "#F59E0B" : "#10B981"} strokeWidth="1.5" />
        {/* OLED Glass Screen */}
        <rect x="66.5" y="49" width="27" height="52" rx="4.5" fill={hasError ? "#451A03" : "#022C22"} />

        {/* Camera Notch / Speaker */}
        <rect x="76" y="50.5" width="8" height="1.5" rx="0.75" fill={hasError ? "#78350F" : "#064E3B"} />

        {/* Clean Minimalist Gesture Bar */}
        <rect x="76" y="94" width="8" height="1.2" rx="0.6" fill={hasError ? "#F59E0B" : "#10B981"} opacity="0.7" />

        {/* Connected USB-C Port & Cable */}
        <line x1="80" y1="104" x2="80" y2="114" stroke={hasError ? "#F59E0B" : "#10B981"} strokeWidth="2" strokeLinecap="round" />
        <rect x="78" y="112" width="4" height="5" rx="1" fill={hasError ? "#D97706" : "#059669"} />
        <line x1="80" y1="117" x2="80" y2="126" stroke={hasError ? "#F59E0B" : "#10B981"} strokeWidth="1.5" strokeDasharray="2 2" strokeLinecap="round" />
      </svg>
    </div>
  );
}

export default App;
