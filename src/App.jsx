import { useState } from 'react';
import { Download, MonitorSmartphone, Settings, LayoutDashboard, Database, ChevronRight, CheckCircle2, Play, AlertCircle } from 'lucide-react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

// Helper for tailwind classes
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

function App() {
  const [activeTab, setActiveTab] = useState('Dashboard');

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-800 overflow-hidden font-sans">
      {/* Electron Title Bar Drag Area (invisible) */}
      <div className="fixed top-0 left-0 right-0 h-[35px] drag-region z-50 pointer-events-none" />

      {/* LEFT SIDEBAR */}
      <div className="w-[240px] bg-white border-r border-slate-200 flex flex-col pt-10 pb-4 justify-between h-full relative z-10 shadow-sm no-drag-region">
        
        <div className="px-6 flex flex-col gap-6">
          <div className="flex items-center gap-2 text-green-600">
            <MonitorSmartphone className="w-6 h-6" />
            <h1 className="font-bold text-[15px] tracking-tight uppercase text-slate-900">
              <span className="text-green-600">Driver</span> Hub
            </h1>
          </div>

          <nav className="flex flex-col gap-1 mt-2">
            <NavItem icon={LayoutDashboard} label="Dashboard" active={activeTab === 'Dashboard'} onClick={() => setActiveTab('Dashboard')} />
            <NavItem icon={Download} label="Drivers" active={activeTab === 'Drivers'} onClick={() => setActiveTab('Drivers')} />
            <NavItem icon={ChevronRight} label="Platform Tools" active={activeTab === 'Platform Tools'} onClick={() => setActiveTab('Platform Tools')} />
            <NavItem icon={MonitorSmartphone} label="Device Monitor" active={activeTab === 'Device Monitor'} onClick={() => setActiveTab('Device Monitor')} />
            <NavItem icon={Settings} label="Settings" active={activeTab === 'Settings'} onClick={() => setActiveTab('Settings')} />
          </nav>
        </div>

        <div className="px-6">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-500">
            <div className="font-semibold text-slate-700 mb-1">Windows 10 / 11</div>
            Run as Administrator to install drivers.
          </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-full bg-slate-50 relative pt-10 no-drag-region overflow-y-auto">
        <div className="max-w-4xl w-full mx-auto p-8 flex-1 flex flex-col gap-6">
          
          {/* Header Row */}
          <div className="flex justify-between items-end mb-4">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-slate-800 mb-1">Every Android driver.</h2>
              <h2 className="text-3xl font-bold tracking-tight text-green-600 mb-2">One installer.</h2>
              <p className="text-slate-500 text-sm">Pick what you need, then install in a single click.</p>
            </div>
            <div className="flex gap-3">
              <button className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg shadow-sm hover:bg-slate-50 transition-all text-sm">
                Scan PC
              </button>
              <button className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg shadow-sm transition-all text-sm">
                Install selected (3)
              </button>
            </div>
          </div>

          {/* Cards List */}
          <div className="flex flex-col gap-4 flex-1">
            
            {/* ADB Card */}
            <DriverCard 
              icon={<ChevronRight className="w-5 h-5 text-green-600" />}
              title="ADB Platform-Tools"
              desc="adb + fastboot binaries, added to PATH automatically"
              tags={['adb', 'fastboot', 'PATH setup']}
              status="Installed"
              statusColor="text-green-600 bg-green-50"
              checkboxLabel="Reinstall"
              checked={true}
              borderColor="border-green-200"
            />

            {/* Google USB Card */}
            <DriverCard 
              icon={<Download className="w-5 h-5 text-amber-500" />}
              title="Google USB & Bootloader Driver"
              desc="Detects your phone in ADB and Fastboot mode"
              tags={[]}
              status="Installing..."
              statusColor="text-amber-600 bg-amber-50"
              checkboxLabel="Selected"
              checked={true}
              borderColor="border-amber-300 shadow-sm"
              progress={64}
            />

            {/* MTK Card */}
            <DriverCard 
              icon={<Database className="w-5 h-5 text-blue-500" />}
              title="MediaTek (MTK) USB Drivers"
              desc="For flashing and unbricking MTK devices"
              tags={['BROM mode', 'Preloader mode', 'VCOM']}
              status="Not installed"
              statusColor="text-slate-500 bg-slate-100"
              checkboxLabel="Selected"
              checked={true}
              borderColor="border-slate-200"
            />

          </div>

          {/* Terminal / Install Log */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 h-40 font-mono text-xs text-slate-600 overflow-y-auto mt-4 shadow-sm">
            <h4 className="font-semibold text-slate-800 font-sans text-xs uppercase tracking-wider mb-3">Install Log</h4>
            <div className="flex flex-col gap-1.5">
              <p><span className="text-green-500">[ok]</span> ADB Platform-Tools extracted and added to PATH</p>
              <p><span className="text-amber-500">[..]</span> Installing Google USB driver package</p>
              <p><span className="text-slate-400">[--]</span> MTK drivers queued</p>
            </div>
          </div>

        </div>
      </div>

      {/* RIGHT SIDEBAR: DEVICE MONITOR */}
      <div className="w-[300px] bg-white border-l border-slate-200 p-6 pt-10 h-full flex flex-col relative z-10 shadow-sm no-drag-region">
        <h4 className="font-semibold text-slate-800 text-xs uppercase tracking-wider mb-4">Device Monitor</h4>
        
        <div className="border border-slate-200 rounded-2xl aspect-square flex items-center justify-center relative mb-6 shadow-sm">
          <div className="absolute inset-0 m-auto w-32 h-32 border-2 border-green-100 rounded-full animate-ping opacity-20" />
          <div className="absolute inset-0 m-auto w-24 h-24 border-2 border-green-200 rounded-full" />
          <MonitorSmartphone className="w-10 h-10 text-green-500 relative z-10" />
        </div>

        <p className="text-xs text-slate-500 mb-6 leading-relaxed">
          Connect your phone with a USB cable.<br/>The mode is detected live.
        </p>

        <div className="flex flex-col gap-3">
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
        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
        active 
          ? "bg-green-50 text-green-700" 
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
      )}
    >
      <Icon className={cn("w-4 h-4", active ? "text-green-600" : "text-slate-400")} />
      {label}
    </button>
  );
}

function DriverCard({ icon, title, desc, tags, status, statusColor, checkboxLabel, checked, borderColor, progress }) {
  return (
    <div className={cn("bg-white border rounded-xl p-5 relative overflow-hidden transition-all", borderColor)}>
      {progress !== undefined && (
        <div className="absolute bottom-0 left-0 h-1 bg-amber-100 w-full">
          <div className="h-full bg-amber-400 transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      )}
      
      <div className="flex gap-4">
        <div className="w-12 h-12 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
          {icon}
        </div>
        
        <div className="flex-1">
          <h3 className="font-semibold text-slate-800 text-base">{title}</h3>
          <p className="text-slate-500 text-sm mt-0.5">{desc}</p>
          
          {tags && tags.length > 0 && (
            <div className="flex gap-2 mt-3">
              {tags.map(tag => (
                <span key={tag} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[11px] font-medium uppercase tracking-wide">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col items-end justify-between shrink-0">
          <div className={cn("px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide uppercase", statusColor)}>
            {status}
          </div>
          <div className="flex items-center gap-2 mb-1">
            <input type="checkbox" checked={checked} readOnly className="w-4 h-4 text-green-600 rounded border-slate-300 accent-green-600" />
            <span className="text-sm font-medium text-slate-700">{checkboxLabel}</span>
          </div>
          {progress !== undefined && <div className="text-xs font-bold text-amber-600 mt-1">{progress}%</div>}
        </div>
      </div>
    </div>
  );
}

function MonitorStatus({ label, status }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border border-slate-200 rounded-lg shadow-sm">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-slate-300" />
        <span className="text-sm font-medium text-slate-700">{label}</span>
      </div>
      <span className="text-xs font-medium text-slate-400">{status}</span>
    </div>
  );
}

export default App;
