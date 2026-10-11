import { useState, useEffect } from 'react';
import { 
  Download, 
  MonitorSmartphone, 
  Settings, 
  LayoutDashboard, 
  Database, 
  ChevronRight, 
  Loader2, 
  FolderOpen 
} from 'lucide-react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

function App() {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [isScanning, setIsScanning] = useState(false);

  // Individual driver states
  const [driverStates, setDriverStates] = useState({
    adb: { scanning: false, scanned: false, installed: false, path: null },
    google: { scanning: false, scanned: false, installed: false },
    mtk: { scanning: false, scanned: false, installed: false, name: null }
  });

  // Dynamic live terminal logs
  const [logs, setLogs] = useState([
    { type: 'info', text: 'DriverHub v1.0 initialized. System ready.' }
  ]);

  const addLog = (type, text) => {
    setLogs(prev => [...prev, { type, text, time: new Date().toLocaleTimeString() }]);
  };

  useEffect(() => {
    // Listen for progressive scan events from Electron backend
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
            if (data.installed) addLog('success', 'Google USB Bootloader Driver is active in DriverStore.');
            else addLog('warning', 'Google USB Driver missing from Windows DriverStore.');
          }
          if (target === 'mtk') {
            if (data.installed) addLog('success', `MediaTek Drivers detected (${data.name || 'VCOM'}).`);
            else addLog('warning', 'MediaTek BROM/Preloader drivers not found.');
          }
        }
      });
    }

    return () => {
      if (window.electronAPI?.removeScanStepListener) {
        window.electronAPI.removeScanStepListener();
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
                Install selected (3)
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
              checked={true}
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
              checked={true}
              borderColor={driverStates.mtk.installed ? 'border-green-200' : 'border-slate-200'}
            />

          </div>

          {/* Terminal / Install Log (Live progressive updates) */}
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

      {/* RIGHT SIDEBAR: DEVICE MONITOR */}
      <div className="w-[250px] bg-white border-l border-slate-200 p-5 pt-10 h-full flex flex-col relative z-10 shadow-sm no-drag-region shrink-0">
        <h4 className="font-semibold text-slate-800 text-[11px] uppercase tracking-wider mb-4">Device Monitor</h4>
        
        <div className="border border-slate-200 rounded-2xl aspect-square flex items-center justify-center relative mb-5 shadow-sm">
          <div className="absolute inset-0 m-auto w-24 h-24 border-2 border-green-100 rounded-full animate-ping opacity-20" />
          <div className="absolute inset-0 m-auto w-16 h-16 border-2 border-green-200 rounded-full" />
          <MonitorSmartphone className="w-8 h-8 text-green-500 relative z-10" />
        </div>

        <p className="text-[11px] text-slate-500 mb-5 leading-relaxed text-center">
          Connect your phone with a USB cable.<br/>The mode is detected live.
        </p>

        <div className="flex flex-col gap-2.5">
          <MonitorStatus label="ADB" status="Waiting" />
          <MonitorStatus label="Fastboot" status="Waiting" />
          <MonitorStatus label="MTK BROM / Preloader" status="Waiting" />
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

function MonitorStatus({ label, status }) {
  return (
    <div className="flex items-center justify-between px-3 py-2.5 bg-white border border-slate-200 rounded-lg shadow-sm">
      <div className="flex items-center gap-2 min-w-0 pr-2">
        <div className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
        <span className="text-[12px] font-medium text-slate-700 truncate">{label}</span>
      </div>
      <span className="text-[10px] font-medium text-slate-400 uppercase shrink-0">{status}</span>
    </div>
  );
}

export default App;
