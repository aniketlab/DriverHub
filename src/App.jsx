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
    brand: null,
    model: null,
    rawModel: null,
    mode: null
  });

  const prevDeviceRef = useRef({ adb: false, fastboot: false, mtk: false });

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

        const wasConnected = prevDeviceRef.current.adb || prevDeviceRef.current.fastboot || prevDeviceRef.current.mtk;
        const isNowConnected = status.connected;

        if (!wasConnected && isNowConnected) {
          const deviceLabel = status.model ? `${status.brand || ''} ${status.model}` : (status.brand || 'Android Device');
          addLog('success', `USB Plugged: ${deviceLabel} connected in ${status.mode || 'USB'} mode!`);
        } else if (wasConnected && !isNowConnected) {
          addLog('info', 'USB Unplugged: Device disconnected.');
        }

        prevDeviceRef.current = status;
      });
    }

    return () => {
      if (window.electronAPI?.removeScanStepListener) {
        window.electronAPI.removeScanStepListener();
      }
      if (window.electronAPI?.removeDeviceMonitorListener) {
        window.electronAPI.removeDeviceMonitorListener();
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

  const isAnyDeviceConnected = deviceStatus.connected;

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-800 overflow-hidden font-sans">
      {/* Electron Title Bar Drag Area */}
      <div className="fixed top-0 left-0 right-0 h-[35px] drag-region z-50 pointer-events-none" />

      {/* LEFT SIDEBAR */}
      <div className="w-[220px] bg-white border-r border-slate-200 flex flex-col pt-10 pb-4 justify-between h-full relative z-10 shadow-sm no-drag-region shrink-0">
        <div className="px-5 flex flex-col gap-5">
          <div className="flex items-center gap-2 text-green-600">
            <MonitorSmartphone className="w-5 h-5" />
            <h1 className="font-bold text-[14px] tracking-tight uppercase text-slate-900">
              <span className="text-green-600">Driver</span> Hub
            </h1>
          </div>

          <nav className="flex flex-col gap-1 mt-1">
            <NavItem icon={LayoutDashboard} label="Dashboard" active={activeTab === 'Dashboard'} onClick={() => setActiveTab('Dashboard')} />
            <NavItem icon={Download} label="Drivers" active={activeTab === 'Drivers'} onClick={() => setActiveTab('Drivers')} />
            <NavItem icon={ChevronRight} label="Platform Tools" active={activeTab === 'Platform Tools'} onClick={() => setActiveTab('Platform Tools')} />
            <NavItem icon={MonitorSmartphone} label="Device Monitor" active={activeTab === 'Device Monitor'} onClick={() => setActiveTab('Device Monitor')} />
            <NavItem icon={Settings} label="Settings" active={activeTab === 'Settings'} onClick={() => setActiveTab('Settings')} />
          </nav>
        </div>

        <div className="px-5">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] text-slate-500 leading-relaxed">
            <div className="font-semibold text-slate-700 mb-0.5">Windows 10 / 11</div>
            Run as Administrator to install drivers.
          </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-full bg-slate-50 relative pt-9 no-drag-region overflow-y-auto min-w-[500px]">
        <div className="max-w-4xl w-full mx-auto px-6 py-4 flex-1 flex flex-col gap-5">
          
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
                disabled={isScanning}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg shadow-sm hover:bg-slate-50 transition-all text-[13px] whitespace-nowrap disabled:opacity-50 flex items-center gap-1.5 cursor-pointer">
                {isScanning && <Loader2 className="w-3.5 h-3.5 animate-spin text-green-600" />}
                {isScanning ? 'Scanning System...' : 'Scan PC'}
              </button>
              <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg shadow-sm transition-all text-[13px] whitespace-nowrap cursor-pointer">
                Install selected (1)
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
              status={
                driverStates.adb.scanning
                  ? 'Scanning...'
                  : driverStates.adb.scanned
                    ? (driverStates.adb.installed ? 'Installed' : 'Not installed')
                    : 'Not Scanned'
              }
              statusColor={
                driverStates.adb.scanning
                  ? 'text-blue-600 bg-blue-50 border border-blue-200'
                  : driverStates.adb.scanned
                    ? (driverStates.adb.installed ? 'text-green-700 bg-green-50 border border-green-200' : 'text-amber-700 bg-amber-50 border border-amber-200')
                    : 'text-slate-500 bg-slate-100'
              }
              checkboxLabel={driverStates.adb.installed ? 'Reinstall' : 'Selected'}
              checked={true}
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
              status={
                driverStates.google.scanning
                  ? 'Scanning...'
                  : driverStates.google.scanned
                    ? (driverStates.google.installed ? 'Installed' : 'Not installed')
                    : 'Not Scanned'
              }
              statusColor={
                driverStates.google.scanning
                  ? 'text-blue-600 bg-blue-50 border border-blue-200'
                  : driverStates.google.scanned
                    ? (driverStates.google.installed ? 'text-green-700 bg-green-50 border border-green-200' : 'text-amber-700 bg-amber-50 border border-amber-200')
                    : 'text-slate-500 bg-slate-100'
              }
              checkboxLabel={driverStates.google.installed ? 'Reinstall' : 'Selected'}
              checked={!driverStates.google.installed}
              borderColor={driverStates.google.installed ? 'border-green-200' : 'border-slate-200'}
            />

            {/* 3. MediaTek MTK Card */}
            <DriverCard 
              icon={<Database className="w-4 h-4 text-blue-500" />}
              title="MediaTek (MTK) Drivers"
              desc="For flashing and unbricking MTK devices"
              tags={['BROM mode', 'Preloader mode', 'VCOM']}
              isScanning={driverStates.mtk.scanning}
              status={
                driverStates.mtk.scanning
                  ? 'Scanning...'
                  : driverStates.mtk.scanned
                    ? (driverStates.mtk.installed ? 'Installed' : 'Not installed')
                    : 'Not Scanned'
              }
              statusColor={
                driverStates.mtk.scanning
                  ? 'text-blue-600 bg-blue-50 border border-blue-200'
                  : driverStates.mtk.scanned
                    ? (driverStates.mtk.installed ? 'text-green-700 bg-green-50 border border-green-200' : 'text-amber-700 bg-amber-50 border border-amber-200')
                    : 'text-slate-500 bg-slate-100'
              }
              checkboxLabel={driverStates.mtk.installed ? 'Reinstall' : 'Selected'}
              checked={!driverStates.mtk.installed}
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
      <div className="w-[250px] bg-white border-l border-slate-200 p-5 pt-10 h-full flex flex-col relative z-10 shadow-sm no-drag-region shrink-0">
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
        />

        {/* Live Device Status Tagline & Name Display */}
        <div className="text-center mb-4 min-h-[50px] flex flex-col items-center justify-center">
          {isAnyDeviceConnected ? (
            <div className="flex flex-col items-center animate-fadeIn w-full px-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/70 mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Connected</span>
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
            label="ADB" 
            connected={deviceStatus.adb} 
          />
          <MonitorStatus 
            label="Fastboot" 
            connected={deviceStatus.fastboot} 
          />
          <MonitorStatus 
            label="MTK BROM / Preloader" 
            connected={deviceStatus.mtk} 
          />
        </div>
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

function DriverCard({ icon, title, desc, tags, status, statusColor, checkboxLabel, checked, borderColor, onExplore, isScanning }) {
  return (
    <div className={cn("bg-white border rounded-xl p-4 relative overflow-hidden transition-all", borderColor)}>
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
        </div>

        <div className="flex flex-col items-end justify-between shrink-0 ml-2">
          <div className="flex gap-2 items-center">
            {onExplore && (
              <button 
                onClick={onExplore}
                title="Open folder in File Explorer"
                className="text-[10px] font-bold text-slate-600 hover:text-green-600 uppercase tracking-wide underline decoration-slate-300 underline-offset-2 transition-colors flex items-center gap-1 cursor-pointer">
                <FolderOpen className="w-3 h-3 text-slate-400" />
                Explore
              </button>
            )}
            <div className={cn("px-2 py-1 rounded text-[10px] font-bold tracking-wide uppercase flex items-center gap-1", statusColor)}>
              {isScanning && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
              {status}
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 mb-0.5 mt-2">
            <input type="checkbox" checked={checked} readOnly className="w-3.5 h-3.5 text-green-600 rounded border-slate-300 accent-green-600" />
            <span className="text-[12px] font-medium text-slate-700">{checkboxLabel}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function MonitorStatus({ label, connected }) {
  return (
    <div className={cn(
      "flex items-center justify-between px-3 py-2 rounded-lg border transition-all duration-300 shadow-2xs",
      connected 
        ? "bg-emerald-50/50 border-emerald-200/80 text-emerald-950" 
        : "bg-white border-slate-200/70 text-slate-600"
    )}>
      <div className="flex items-center gap-2 min-w-0 pr-2">
        <span className={cn(
          "w-1.5 h-1.5 rounded-full shrink-0 transition-colors",
          connected ? "bg-emerald-500 shadow-2xs shadow-emerald-400 animate-pulse" : "bg-slate-300"
        )} />
        <span className="text-[12px] font-medium truncate">{label}</span>
      </div>
      <span className={cn(
        "text-[10px] font-medium tracking-wide uppercase shrink-0 px-2 py-0.5 rounded-md transition-colors",
        connected 
          ? "text-emerald-700 bg-white border border-emerald-200/60 shadow-2xs" 
          : "text-slate-400 bg-slate-50"
      )}>
        {connected ? 'CONNECTED' : 'WAITING'}
      </span>
    </div>
  );
}

function DeviceMonitorVisual({ connected, mode, brand, model }) {
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
    <div className="rounded-2xl aspect-square w-full flex items-center justify-center relative mb-3.5 transition-all duration-500 overflow-hidden border border-emerald-200/90 bg-gradient-to-b from-emerald-50/50 via-white to-emerald-50/30 shadow-xs">
      {/* Ambient Radial Green Halo */}
      <div className="absolute w-28 h-28 bg-emerald-400/20 rounded-full blur-xl pointer-events-none animate-pulse" />

      {/* 100% Mathematically Symmetrical Vector Display */}
      <svg viewBox="0 0 160 160" className="w-full h-full max-w-[170px] relative z-10 drop-shadow-xs">
        {/* Animated Concentric Radar Halo */}
        <circle cx="80" cy="75" r="62" fill="none" stroke="#A7F3D0" strokeWidth="1.5" opacity="0.6">
          <animate attributeName="r" values="52;66;52" dur="3s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.7;0.15;0.7" dur="3s" repeatCount="indefinite" />
        </circle>
        
        {/* Middle Pulse Circle */}
        <circle cx="80" cy="75" r="48" fill="#ECFDF5" fillOpacity="0.5" stroke="#6EE7B7" strokeWidth="1.5" />

        {/* High-Tech Smartphone Mockup (Center: x=80, y=75) */}
        {/* Chassis */}
        <rect x="64" y="46" width="32" height="58" rx="6.5" fill="#0F172A" stroke="#10B981" strokeWidth="1.5" />
        {/* OLED Glass Screen */}
        <rect x="66.5" y="49" width="27" height="52" rx="4.5" fill="#022C22" />

        {/* Camera Notch / Speaker */}
        <rect x="76" y="50.5" width="8" height="1.5" rx="0.75" fill="#064E3B" />

        {/* Clean Minimalist Gesture Bar */}
        <rect x="76" y="94" width="8" height="1.2" rx="0.6" fill="#10B981" opacity="0.7" />

        {/* Connected USB-C Port & Cable */}
        <line x1="80" y1="104" x2="80" y2="114" stroke="#10B981" strokeWidth="2" strokeLinecap="round" />
        <rect x="78" y="112" width="4" height="5" rx="1" fill="#059669" />
        <line x1="80" y1="117" x2="80" y2="126" stroke="#10B981" strokeWidth="1.5" strokeDasharray="2 2" strokeLinecap="round" />
      </svg>
    </div>
  );
}

export default App;
