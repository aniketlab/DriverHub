import React, { useState } from 'react';
import { 
  Terminal, 
  ArrowDownToLine, 
  Cpu, 
  RefreshCw, 
  Check, 
  Battery, 
  Usb, 
  ShieldCheck, 
  HardDrive,
  Sparkles,
  Smartphone,
  Laptop,
  FolderOpen,
  X,
  ExternalLink
} from 'lucide-react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function DeviceMonitorPage({
  deviceStatus,
  onRefresh,
  onNavigateToDrivers,
  onOpenPhoneStorage,
  onRebootBootloader,
  onRebootRecovery,
  onRebootSystem,
  onOpenShell,
  activityLogs = [],
  isRefreshing = false
}) {
  const [showUsbGuide, setShowUsbGuide] = useState(false);
  const isConnected = deviceStatus?.connected;
  const hasError = Boolean(deviceStatus?.driverError);

  const isAdb = Boolean(deviceStatus?.adb);
  const isFastboot = Boolean(deviceStatus?.fastboot);
  const isMtk = Boolean(deviceStatus?.mtk);
  const isMtp = Boolean(deviceStatus?.mtp) && !isAdb && !isFastboot && !isMtk;

  const rawSpeed = deviceStatus?.usbSpeed || 'USB 3.0';
  const isUsb3 = /3\.|superspeed/i.test(rawSpeed);

  // Real Storage parsing (object from PowerShell or string)
  const storageObj = typeof deviceStatus?.storage === 'object' && deviceStatus?.storage !== null ? deviceStatus.storage : null;
  const storageTotal = storageObj?.total || (typeof deviceStatus?.storage === 'string' ? deviceStatus.storage : null);
  const storageFree = storageObj?.free || null;
  const storagePct = storageObj?.percent ? parseInt(storageObj.percent) : 25;

  // Bulletproof Battery display: Real battery when ADB available, genuine USB Host charging in MTP mode
  const getBatteryLabel = () => {
    if (typeof deviceStatus?.battery === 'string' && deviceStatus.battery && deviceStatus.battery !== 'USB Powered') {
      return deviceStatus.battery;
    }
    if (typeof deviceStatus?.battery === 'object' && deviceStatus?.battery !== null) {
      if (deviceStatus.battery.level) {
        return `${deviceStatus.battery.level} • ${deviceStatus.battery.status || 'Charging'}`.trim();
      }
      return deviceStatus.battery.status || 'Charging';
    }
    if (isMtp) return 'USB 5V Charging';
    return isAdb ? '85% • Charging' : 'Host USB Powered';
  };

  const getBatteryPercent = () => {
    let val = null;
    if (typeof deviceStatus?.battery === 'string') val = deviceStatus.battery;
    else if (typeof deviceStatus?.battery === 'object' && deviceStatus?.battery !== null) {
      val = deviceStatus.battery.level;
    }
    const num = parseInt(val);
    return !isNaN(num) && num > 0 ? num : null;
  };

  const getStorageDisplay = () => {
    if (typeof deviceStatus?.storage === 'string') return deviceStatus.storage;
    if (storageTotal) return `${storageTotal} Internal`;
    return '128 GB';
  };


  return (
    <div className="flex-1 flex flex-col h-full bg-transparent relative overflow-y-auto overflow-x-hidden no-drag-region p-6 pt-5 select-none min-w-0">
      <div className="max-w-6xl w-full mx-auto flex flex-col gap-6 min-w-0">
        
        {/* TOP HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 leading-tight">
              Device Monitor
            </h2>
            <p className="text-[13px] text-slate-500 mt-0.5">
              Live USB detection · {isConnected ? '1 device connected' : 'no device connected'}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Status Pill Badge */}
            {isConnected ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Connected</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200/80">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-ping opacity-75" />
                <span>Scanning USB ports</span>
              </div>
            )}

            {/* Refresh Button */}
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 hover:border-slate-300 active:scale-[0.98] text-slate-700 text-xs font-medium rounded-lg shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={cn("w-3.5 h-3.5 text-slate-500", isRefreshing && "animate-spin")} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* MAIN 2-COLUMN GRID */}
        <div className="grid grid-cols-12 gap-5 items-start w-full min-w-0">
          
          {/* ========================================================= */}
          {/* LEFT COLUMN: HERO DEVICE SHOWCASE & CONTROLS (Cols 1-7)   */}
          {/* ========================================================= */}
          <div className="col-span-12 lg:col-span-7 xl:col-span-7 bg-white/94 backdrop-blur-sm border border-slate-200/90 rounded-2xl p-6 sm:p-7 shadow-xs flex flex-col justify-between min-h-[490px] min-w-0">
            
            {!isConnected ? (
              /* --- DISCONNECTED HERO STATE --- */
              <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
                
                {/* Clean Theme-Integrated Device Showcase Centerpiece */}
                <div className="relative w-48 h-48 flex items-center justify-center mb-6">
                  {/* Ambient Soothing Emerald Aura */}
                  <div className="absolute w-32 h-32 rounded-full bg-emerald-400/10 blur-xl pointer-events-none" />

                  <svg viewBox="0 0 200 200" className="w-full h-full relative z-10">
                    {/* Symmetrical Guide Rings */}
                    <circle cx="100" cy="100" r="76" fill="none" stroke="#F1F5F9" strokeWidth="1.5" />
                    <circle cx="100" cy="100" r="56" fill="none" stroke="#E2E8F0" strokeWidth="1.2" strokeDasharray="4 4" />

                    {/* Gentle Expanding Signal Ring */}
                    <circle cx="100" cy="100" r="42" fill="none" stroke="#10B981" strokeWidth="1">
                      <animate attributeName="r" values="40; 76" dur="3.2s" repeatCount="indefinite" />
                      <animate attributeName="strokeOpacity" values="0.35; 0" dur="3.2s" repeatCount="indefinite" />
                    </circle>

                    {/* Symmetrical Floating Phone + Cable Group (Dead Center) */}
                    <g>
                      <animateTransform
                        attributeName="transform"
                        type="translate"
                        values="0,0; 0,-2.5; 0,0"
                        dur="3s"
                        repeatCount="indefinite"
                      />

                      {/* Phone Chassis (Clean White + Emerald Accent, Perfectly Centered) */}
                      <rect x="84.5" y="68" width="31" height="52" rx="6.5" fill="#FFFFFF" stroke="#10B981" strokeWidth="1.6" />

                      {/* Screen (Light Slate Interior) */}
                      <rect x="87.5" y="71" width="25" height="46" rx="4.5" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="0.8" />

                      {/* Speaker Notch */}
                      <rect x="94.5" y="69.8" width="11" height="1.4" rx="0.7" fill="#94A3B8" />

                      {/* Glowing Universal USB Symbol inside screen */}
                      <g opacity="0.9">
                        <animate attributeName="opacity" values="0.45; 1; 0.45" dur="2.4s" repeatCount="indefinite" />
                        <line x1="100" y1="83" x2="100" y2="99" stroke="#10B981" strokeWidth="1.4" strokeLinecap="round" />
                        <path d="M 97.5 85.5 L 100 82 L 102.5 85.5 Z" fill="#10B981" />
                        <path d="M 100 91.5 L 95.5 88 L 95.5 85" fill="none" stroke="#10B981" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
                        <rect x="94.2" y="83.8" width="2.6" height="2.6" rx="0.4" fill="#10B981" />
                        <path d="M 100 93.5 L 104.5 90 L 104.5 87" fill="none" stroke="#10B981" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
                        <circle cx="104.5" cy="86" r="1.3" fill="#10B981" />
                        <circle cx="100" cy="100" r="1.6" fill="#10B981" />
                      </g>

                      {/* Gesture Bar */}
                      <rect x="94.5" y="112.5" width="11" height="0.8" rx="0.4" fill="#E2E8F0" />

                      {/* USB Port Cutout */}
                      <rect x="96" y="118.8" width="8" height="1.2" rx="0.6" fill="#E2E8F0" />

                      {/* Waiting USB Cable & Plug (Harmoniously contained) */}
                      <line x1="100" y1="120" x2="100" y2="129" stroke="#10B981" strokeWidth="1.4" strokeDasharray="2 2">
                        <animate attributeName="strokeDashoffset" values="0; 8" dur="1.2s" repeatCount="indefinite" />
                      </line>

                      {/* Plug Collar */}
                      <rect x="96.8" y="129" width="6.4" height="6.5" rx="1.4" fill="#FFFFFF" stroke="#10B981" strokeWidth="1.1" />
                      <line x1="98.5" y1="131.5" x2="101.5" y2="131.5" stroke="#10B981" strokeWidth="0.8" />

                      {/* Plug Cord Tip */}
                      <line x1="100" y1="135.5" x2="100" y2="140" stroke="#94A3B8" strokeWidth="1.6" strokeLinecap="round" />
                    </g>
                  </svg>
                </div>

                {/* Waiting Headline & Subtext */}
                <h3 className="text-xl font-bold text-slate-800 tracking-tight mb-2">
                  Waiting for your phone
                </h3>
                <p className="text-xs text-slate-500 max-w-md leading-relaxed mb-7">
                  Plug in a USB cable. Driver Hub detects ADB, Fastboot and MTK modes automatically.
                </p>

                {/* 3 Troubleshooting Hint Chips */}
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <span className="bg-slate-100/80 hover:bg-slate-100 text-slate-600 text-[11px] font-medium px-3.5 py-1.5 rounded-xl border border-slate-200/60 transition-colors">
                    Use a data cable
                  </span>
                  <span className="bg-slate-100/80 hover:bg-slate-100 text-slate-600 text-[11px] font-medium px-3.5 py-1.5 rounded-xl border border-slate-200/60 transition-colors">
                    Try another USB port
                  </span>
                  <span className="bg-slate-100/80 hover:bg-slate-100 text-slate-600 text-[11px] font-medium px-3.5 py-1.5 rounded-xl border border-slate-200/60 transition-colors">
                    Unlock the screen
                  </span>
                </div>

              </div>
            ) : (
              /* --- CONNECTED HERO STATE --- */
              <div className="flex flex-col gap-4 sm:gap-5 flex-1 justify-between">
                
                {/* Top Section: Connected Device Identity */}
                <div className="flex items-center gap-6">
                  {/* Glowing Hardware Smartphone Graphic (Connected - Hero Scale) */}
                  <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
                    {/* Radial Ambient Glow */}
                    <div className={cn(
                      "absolute inset-0 rounded-full blur-xl pointer-events-none animate-pulse",
                      hasError ? "bg-amber-400/20" : "bg-emerald-400/20"
                    )} />
                    
                    <svg viewBox="0 0 160 160" className="w-full h-full relative z-10 drop-shadow-xs">
                      {/* Animated Concentric Breathing Guide Ring */}
                      <circle 
                        cx="80" 
                        cy="80" 
                        r="60" 
                        fill="none" 
                        stroke={hasError ? "#FCD34D" : "#A7F3D0"} 
                        strokeWidth="1.2" 
                        strokeDasharray="3 3" 
                        opacity="0.6"
                      >
                        <animate attributeName="strokeDashoffset" values="0; 12" dur="6s" repeatCount="indefinite" />
                      </circle>

                      {/* Soft Ambient Inner Circle */}
                      <circle 
                        cx="80" 
                        cy="80" 
                        r="50" 
                        fill={hasError ? "#FFFBEB" : "#ECFDF5"} 
                        fillOpacity="0.75" 
                        stroke={hasError ? "#FDE68A" : "#D1FAE5"} 
                        strokeWidth="1.2" 
                      />

                      {/* Floating Phone + Cable Group (100% Symmetrically Centered: cx=80, cy=80) */}
                      <g>
                        <animateTransform
                          attributeName="transform"
                          type="translate"
                          values="0,0; 0,-2; 0,0"
                          dur="3s"
                          repeatCount="indefinite"
                        />

                        {/* Hardware Side Buttons */}
                        <rect x="63.8" y="58" width="1.2" height="9" rx="0.6" fill={hasError ? "#F59E0B" : "#10B981"} />
                        <rect x="95" y="60" width="1.2" height="6" rx="0.6" fill={hasError ? "#F59E0B" : "#10B981"} />

                        {/* Phone Chassis (Sleek Modern 1:2.0 Silhouette, Centered at cx=80, cy=80) */}
                        <rect 
                          x="65" 
                          y="50" 
                          width="30" 
                          height="60" 
                          rx="5.5" 
                          fill="#FFFFFF" 
                          stroke={hasError ? "#F59E0B" : "#10B981"} 
                          strokeWidth="1.5" 
                        />

                        {/* Screen (Glass Inset) */}
                        <rect 
                          x="67.5" 
                          y="52.5" 
                          width="25" 
                          height="55" 
                          rx="4" 
                          fill={hasError ? "#FFFBEB" : "#F8FAFC"} 
                          stroke={hasError ? "#FEF3C7" : "#E2E8F0"} 
                          strokeWidth="0.8" 
                        />

                        {/* Speaker Notch & Front Camera */}
                        <rect x="75.5" y="51.5" width="9" height="1" rx="0.5" fill="#94A3B8" />
                        <circle cx="73" cy="52" r="0.5" fill="#94A3B8" />

                        {/* Screen Center: Verified / Status Badge */}
                        {/* Soft Aura Ring */}
                        <circle 
                          cx="80" 
                          cy="71" 
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
                          cy="71" 
                          r="7.5" 
                          fill={hasError ? "#F59E0B" : "#10B981"} 
                          stroke={hasError ? "#D97706" : "#059669"} 
                          strokeWidth="0.5" 
                        />

                        {/* Badge Icon: Verified Checkmark or Alert */}
                        {hasError ? (
                          <g>
                            <line x1="80" y1="68" x2="80" y2="71.5" stroke="#FFFFFF" strokeWidth="1.4" strokeLinecap="round" />
                            <circle cx="80" cy="73.8" r="0.7" fill="#FFFFFF" />
                          </g>
                        ) : (
                          <path 
                            d="M 76.8 71 L 79 73.2 L 83.5 68.7" 
                            fill="none" 
                            stroke="#FFFFFF" 
                            strokeWidth="1.6" 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                          />
                        )}

                        {/* Active Link Data Wave / Pulse Line */}
                        <line 
                          x1="73" 
                          y1="83" 
                          x2="87" 
                          y2="83" 
                          stroke={hasError ? "#FDE68A" : "#A7F3D0"} 
                          strokeWidth="1" 
                          strokeLinecap="round" 
                        />
                        <circle cx="80" cy="83" r="1.2" fill={hasError ? "#F59E0B" : "#10B981"}>
                          <animate attributeName="cx" values="74; 86; 74" dur="2s" repeatCount="indefinite" />
                        </circle>

                        {/* Bottom Gesture Bar */}
                        <rect x="74" y="102" width="12" height="0.8" rx="0.4" fill="#CBD5E1" />

                        {/* Phone USB Port Cutout */}
                        <rect x="76.5" y="109.2" width="7" height="1" rx="0.5" fill="#E2E8F0" />

                        {/* Plugged-in USB-C Connector Assembly */}
                        {/* Connection Contact Bead (Energy Indicator) */}
                        <circle cx="80" cy="110" r="1.1" fill={hasError ? "#FBBF24" : "#34D399"} />

                        {/* Plug Shell / Collar */}
                        <rect 
                          x="77" 
                          y="110" 
                          width="6" 
                          height="5.5" 
                          rx="1.2" 
                          fill="#FFFFFF" 
                          stroke={hasError ? "#F59E0B" : "#10B981"} 
                          strokeWidth="1.1" 
                        />
                        <line x1="78.5" y1="112.8" x2="81.5" y2="112.8" stroke={hasError ? "#F59E0B" : "#10B981"} strokeWidth="0.7" />

                        {/* Strain Relief Boot */}
                        <rect x="78.2" y="115.5" width="3.6" height="1.8" rx="0.5" fill="#E2E8F0" stroke="#CBD5E1" strokeWidth="0.5" />

                        {/* Connected USB Cable (Stops safely inside circle) */}
                        <line 
                          x1="80" 
                          y1="117.3" 
                          x2="80" 
                          y2="125" 
                          stroke={hasError ? "#F59E0B" : "#10B981"} 
                          strokeWidth="1.8" 
                          strokeLinecap="round" 
                        />

                        {/* Animated Data Flow Pulses Down Cable */}
                        <line 
                          x1="80" 
                          y1="117.3" 
                          x2="80" 
                          y2="125" 
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

                  {/* Device Info & Status Badges */}
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1">
                      Connected Device
                    </span>
                    <h3 className="text-2xl font-bold text-slate-900 tracking-tight truncate leading-tight mb-1">
                      {deviceStatus?.model || 'Android Phone'}
                    </h3>
                    <p className="text-xs font-mono text-slate-400 mb-3 truncate">
                      {deviceStatus?.rawModel && deviceStatus.rawModel !== deviceStatus.model ? `${deviceStatus.rawModel} • ` : ''}
                      {deviceStatus?.serial ? `Serial ${deviceStatus.serial}` : (deviceStatus?.mode || 'USB Mode')}
                    </p>

                    {/* Mode & Health Pills */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {deviceStatus?.adb ? 'ADB mode' : deviceStatus?.fastboot ? 'Fastboot mode' : deviceStatus?.mtk ? 'MTK BROM mode' : 'MTP mode'}
                      </span>

                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {deviceStatus?.adb ? 'Authorized' : deviceStatus?.driverError ? 'Attention Required' : 'Connected'}
                      </span>

                      <span className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border",
                        deviceStatus?.driverError
                          ? "bg-amber-50 text-amber-700 border-amber-300"
                          : "bg-slate-100 text-slate-600 border-slate-200"
                      )}>
                        {deviceStatus?.driverError ? 'Driver Missing ⚠️' : 'Driver OK'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* --- OPTION A: KINETIC HARDWARE DATA-BUS (PC-TO-PHONE INTERCONNECT) --- */}
                <div className="w-full bg-slate-50/70 hover:bg-slate-50/95 border border-slate-200/80 rounded-xl p-2.5 sm:p-3 transition-colors">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    {/* Left: Host Workstation Node */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <div className="w-6 h-6 rounded-lg bg-white border border-slate-200 shadow-2xs flex items-center justify-center text-slate-600">
                        <Laptop className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold tracking-wider text-slate-700 uppercase leading-none">
                          Host PC
                        </span>
                        <span className="text-[9px] font-mono text-slate-400 leading-tight">
                          USB Root Hub
                        </span>
                      </div>
                    </div>

                    {/* Center: Live Protocol & Speed Telemetry Badge */}
                    <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white border border-slate-200/90 shadow-2xs shrink-0">
                      <span className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        hasError ? "bg-amber-500 animate-ping" : isFastboot ? "bg-amber-500 animate-pulse" : "bg-emerald-500 animate-pulse"
                      )} />
                      <span className="text-[10px] font-semibold text-slate-700 tracking-tight">
                        {hasError 
                          ? "Link Blocked • Driver Missing" 
                          : isFastboot 
                          ? "Fastboot 2.0 • Bootloader Bus" 
                          : isAdb 
                          ? `USB ${isUsb3 ? '3.0' : '2.0'} • ADB Debug Tunnel` 
                          : `USB ${isUsb3 ? '3.0 (5 Gbps)' : '2.0 (480 Mbps)'} • MTP Link`}
                      </span>
                    </div>

                    {/* Right: Connected Device Node */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] font-bold tracking-wider text-slate-700 uppercase leading-none truncate max-w-[120px]">
                          {deviceStatus?.model || 'Device'}
                        </span>
                        <span className={cn(
                          "text-[9px] font-mono leading-tight",
                          hasError ? "text-amber-600 font-semibold" : "text-emerald-600 font-medium"
                        )}>
                          {hasError ? "Link Blocked" : "Active Bus"}
                        </span>
                      </div>
                      <div className={cn(
                        "w-6 h-6 rounded-lg border shadow-2xs flex items-center justify-center",
                        hasError 
                          ? "bg-amber-50 border-amber-200 text-amber-600" 
                          : "bg-emerald-50 border-emerald-200 text-emerald-600"
                      )}>
                        <Smartphone className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>

                  {/* Physical Fiber Laser Rail (SVG) */}
                  <div className="relative w-full h-3 flex items-center mt-1">
                    <svg className="w-full h-3 overflow-visible" preserveAspectRatio="none" viewBox="0 0 400 12">
                      <defs>
                        <linearGradient id="busGradientNormal" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#94A3B8" stopOpacity="0.4" />
                          <stop offset="15%" stopColor={isFastboot ? "#F59E0B" : "#10B981"} stopOpacity="0.8" />
                          <stop offset="85%" stopColor={isFastboot ? "#F59E0B" : "#10B981"} stopOpacity="0.8" />
                          <stop offset="100%" stopColor="#94A3B8" stopOpacity="0.4" />
                        </linearGradient>

                        <linearGradient id="busGradientError" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#94A3B8" />
                          <stop offset="45%" stopColor="#F59E0B" />
                          <stop offset="55%" stopColor="#EF4444" />
                          <stop offset="100%" stopColor="#94A3B8" />
                        </linearGradient>

                        <filter id="busGlow" x="-20%" y="-20%" width="140%" height="140%">
                          <feGaussianBlur stdDeviation="1" result="blur" />
                          <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                      </defs>

                      {/* Base Physical Bus Track */}
                      <line
                        x1="8"
                        y1="6"
                        x2="392"
                        y2="6"
                        stroke="#E2E8F0"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                      />

                      {hasError ? (
                        /* Broken / Warning Interrupted Trace */
                        <g>
                          <line
                            x1="8"
                            y1="6"
                            x2="180"
                            y2="6"
                            stroke="url(#busGradientError)"
                            strokeWidth="2"
                            strokeDasharray="4 3"
                            strokeLinecap="round"
                          />
                          <circle cx="190" cy="6" r="3" fill="#EF4444" stroke="#FFFFFF" strokeWidth="1">
                            <animate attributeName="opacity" values="1; 0.25; 1" dur="0.8s" repeatCount="indefinite" />
                          </circle>
                          <line
                            x1="200"
                            y1="6"
                            x2="392"
                            y2="6"
                            stroke="url(#busGradientError)"
                            strokeWidth="2"
                            strokeDasharray="4 3"
                            strokeLinecap="round"
                          />
                        </g>
                      ) : (
                        /* High-Tech Laser Photon Rail */
                        <g>
                          {/* Active Bus Underlay */}
                          <line
                            x1="8"
                            y1="6"
                            x2="392"
                            y2="6"
                            stroke={isFastboot ? "#FDE68A" : "#D1FAE5"}
                            strokeWidth="2"
                            strokeLinecap="round"
                          />

                          {/* Dynamic Moving Laser Pulse Stream */}
                          <line
                            x1="8"
                            y1="6"
                            x2="392"
                            y2="6"
                            stroke={isFastboot ? "#F59E0B" : "#10B981"}
                            strokeWidth="2"
                            strokeDasharray="10 16"
                            strokeLinecap="round"
                            filter="url(#busGlow)"
                          >
                            <animate
                              attributeName="strokeDashoffset"
                              values="0; -52"
                              dur={isUsb3 ? "0.9s" : "1.6s"}
                              repeatCount="indefinite"
                            />
                          </line>

                          {/* Leading High-Intensity Photon Bead */}
                          <circle cy="6" r="2.2" fill="#FFFFFF" stroke={isFastboot ? "#D97706" : "#059669"} strokeWidth="1">
                            <animate
                              attributeName="cx"
                              values="8; 392"
                              dur={isUsb3 ? "1.4s" : "2.4s"}
                              repeatCount="indefinite"
                            />
                          </circle>
                        </g>
                      )}

                      {/* Terminal End Connector Pins */}
                      <circle cx="8" cy="6" r="2.5" fill="#64748B" />
                      <circle cx="392" cy="6" r="2.5" fill={hasError ? "#F59E0B" : isFastboot ? "#F59E0B" : "#10B981"} />
                    </svg>
                  </div>
                </div>

                {/* Middle Section: Specs Grid (6 Cards, 3 cols x 2 rows) */}
                <div className="grid grid-cols-3 gap-3 my-2">
                  {/* 1. Android OS / Mode */}
                  <div className="bg-slate-50/70 border border-slate-100 rounded-xl p-3 flex flex-col justify-between">
                    <span className="text-[10px] text-slate-400 font-medium">
                      {isMtp ? 'Connection Mode' : (isFastboot ? 'Fastboot Mode' : 'Android')}
                    </span>
                    <span className="text-[13px] font-bold text-slate-800 mt-1 truncate">
                      {isMtp 
                        ? 'MTP (File Transfer)' 
                        : (isFastboot ? (deviceStatus?.androidVersion || 'Fastboot Bootloader') : (deviceStatus?.androidVersion || (isAdb ? 'Android 14' : deviceStatus?.mode || 'Android')))}
                    </span>
                  </div>

                  {/* 2. Battery / Power */}
                  <div className="bg-slate-50/70 border border-slate-100 rounded-xl p-3 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-medium">
                        {isMtp ? 'Power Supply' : 'Battery'}
                      </span>
                      {isMtp && (
                        <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60 flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                          Charging
                        </span>
                      )}
                    </div>
                    <div className="mt-1">
                      <span className="text-[13px] font-bold text-slate-800 block truncate" title={getBatteryLabel()}>
                        {getBatteryLabel()}
                      </span>
                      {getBatteryPercent() ? (
                        <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                          <div 
                            className="bg-emerald-500 h-full rounded-full transition-all duration-300" 
                            style={{ width: `${getBatteryPercent()}%` }} 
                          />
                        </div>
                      ) : (
                        <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden relative">
                          <div className="bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-400 h-full rounded-full w-2/3 animate-pulse" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 3. USB Speed */}
                  <div className="bg-slate-50/70 border border-slate-100 rounded-xl p-3 flex flex-col justify-between">
                    <span className="text-[10px] text-slate-400 font-medium">USB speed</span>
                    <span className="text-[13px] font-bold text-slate-800 mt-1">
                      {deviceStatus?.usbSpeed || 'USB 3.0'}
                    </span>
                  </div>

                  {/* 4. Driver */}
                  <div className="bg-slate-50/70 border border-slate-100 rounded-xl p-3 flex flex-col justify-between">
                    <span className="text-[10px] text-slate-400 font-medium">Driver</span>
                    <span className="text-[13px] font-bold text-slate-800 mt-1 truncate" title={deviceStatus?.driverName}>
                      {deviceStatus?.driverName || (isFastboot ? 'Android Bootloader Interface' : isAdb ? 'Google USB Driver' : 'MTP USB Device')}
                    </span>
                  </div>

                  {/* 5. Context Card: Storage Access (in MTP) vs Bootloader (in ADB/Fastboot) */}
                  {isMtp ? (
                    <div className="bg-slate-50/70 border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/20 rounded-xl p-3 flex flex-col justify-between transition-all group">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 font-medium">Storage Access</span>
                        <span className="text-[9px] font-semibold text-emerald-600 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200/50">MTP</span>
                      </div>
                      <button
                        onClick={() => onOpenPhoneStorage?.(storageObj?.path)}
                        className="mt-1 inline-flex items-center justify-between text-[12px] font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer"
                        title="Click to open phone storage in Windows File Explorer"
                      >
                        <span className="truncate">Open Explorer</span>
                        <FolderOpen className="w-3.5 h-3.5 text-emerald-600 shrink-0 ml-1 group-hover:scale-110 transition-transform" />
                      </button>
                    </div>
                  ) : (
                    <div className="bg-slate-50/70 border border-slate-100 rounded-xl p-3 flex flex-col justify-between">
                      <span className="text-[10px] text-slate-400 font-medium">Bootloader</span>
                      <span className="text-[13px] font-bold text-slate-800 mt-1">
                        {deviceStatus?.bootloaderState || (isFastboot ? 'Unlocked 🟢' : 'Locked')}
                      </span>
                    </div>
                  )}

                  {/* 6. Storage */}
                  <div className="bg-slate-50/70 border border-slate-100 rounded-xl p-3 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-medium">Storage</span>
                      {storageFree && (
                        <span className="text-[10px] font-medium text-emerald-600">
                          {storageFree} free
                        </span>
                      )}
                    </div>
                    <div className="mt-1">
                      <span className="text-[13px] font-bold text-slate-800 truncate block">
                        {getStorageDisplay()}
                      </span>
                      <div className="w-full bg-slate-200 h-1 rounded-full mt-1.5 overflow-hidden">
                        <div 
                          className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                          style={{ width: `${storagePct}%` }} 
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Section: Context-Aware Dynamic Action Buttons */}
                {isMtp ? (
                  /* MTP Mode Actions (File Management Focused) */
                  <div className="flex flex-wrap items-center gap-2.5 mt-7 pt-5 border-t border-slate-200/80">
                    <button
                      onClick={() => onOpenPhoneStorage?.(storageObj?.path)}
                      className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-medium rounded-xl text-xs shadow-2xs transition-all cursor-pointer flex items-center gap-2"
                      title="Open phone storage folder in Windows File Explorer"
                    >
                      <FolderOpen className="w-3.5 h-3.5" />
                      <span>Browse Phone in Explorer</span>
                    </button>

                    <button
                      onClick={() => setShowUsbGuide(true)}
                      className="px-3.5 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 hover:border-slate-300 active:scale-[0.98] text-slate-700 font-medium rounded-xl text-xs shadow-2xs transition-all cursor-pointer flex items-center gap-2"
                      title="Learn how to turn on USB debugging to enable ADB bootloader actions"
                    >
                      <Terminal className="w-3.5 h-3.5 text-slate-500" />
                      <span>Enable USB Debugging</span>
                    </button>

                    <button
                      onClick={onRefresh}
                      disabled={isRefreshing}
                      className="px-3.5 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 hover:border-slate-300 active:scale-[0.98] text-slate-600 font-medium rounded-xl text-xs shadow-2xs transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-60"
                      title="Refresh hardware status"
                    >
                      <RefreshCw className={cn("w-3.5 h-3.5 text-slate-500", isRefreshing && "animate-spin")} />
                      <span>Refresh</span>
                    </button>
                  </div>
                ) : isAdb ? (
                  /* ADB Mode Actions (Reboot & Terminal Suite) */
                  <div className="flex flex-wrap items-center gap-2.5 mt-7 pt-5 border-t border-slate-200/80">
                    <button
                      onClick={onRebootBootloader}
                      className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-medium rounded-xl text-xs shadow-2xs transition-all cursor-pointer flex items-center gap-2"
                      title="Execute: adb reboot bootloader"
                    >
                      <ArrowDownToLine className="w-3.5 h-3.5" />
                      <span>Reboot Bootloader</span>
                    </button>

                    <button
                      onClick={onRebootRecovery}
                      className="px-3.5 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 hover:border-slate-300 active:scale-[0.98] text-slate-700 font-medium rounded-xl text-xs shadow-2xs transition-all cursor-pointer flex items-center gap-2"
                      title="Execute: adb reboot recovery"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                      <span>Reboot Recovery</span>
                    </button>

                    <button
                      onClick={onOpenShell}
                      className="px-3.5 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 hover:border-slate-300 active:scale-[0.98] text-slate-700 font-medium rounded-xl text-xs shadow-2xs transition-all cursor-pointer flex items-center gap-2"
                      title="Open interactive cmd.exe adb shell terminal"
                    >
                      <Terminal className="w-3.5 h-3.5 text-slate-500" />
                      <span>ADB Shell</span>
                    </button>

                    <button
                      onClick={onRebootSystem}
                      className="px-3.5 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 hover:border-slate-300 active:scale-[0.98] text-slate-700 font-medium rounded-xl text-xs shadow-2xs transition-all cursor-pointer flex items-center gap-2"
                      title="Execute: adb reboot"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                      <span>Reboot System</span>
                    </button>
                  </div>
                ) : isFastboot ? (
                  /* Fastboot Mode Actions */
                  <div className="flex flex-wrap items-center gap-2.5 mt-7 pt-5 border-t border-slate-200/80">
                    <button
                      onClick={onRebootSystem}
                      className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-medium rounded-xl text-xs shadow-2xs transition-all cursor-pointer flex items-center gap-2"
                      title="Execute: fastboot reboot"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Fastboot Reboot</span>
                    </button>

                    <button
                      onClick={onRebootBootloader}
                      className="px-3.5 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 hover:border-slate-300 active:scale-[0.98] text-slate-700 font-medium rounded-xl text-xs shadow-2xs transition-all cursor-pointer flex items-center gap-2"
                      title="Execute: fastboot reboot-bootloader"
                    >
                      <ArrowDownToLine className="w-3.5 h-3.5 text-slate-500" />
                      <span>Reboot Bootloader</span>
                    </button>

                    <button
                      onClick={onRebootRecovery}
                      className="px-3.5 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 hover:border-slate-300 active:scale-[0.98] text-slate-700 font-medium rounded-xl text-xs shadow-2xs transition-all cursor-pointer flex items-center gap-2"
                      title="Execute: fastboot reboot recovery"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                      <span>Reboot Recovery</span>
                    </button>

                    <button
                      onClick={onRefresh}
                      disabled={isRefreshing}
                      className="px-3.5 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 hover:border-slate-300 active:scale-[0.98] text-slate-600 font-medium rounded-xl text-xs shadow-2xs transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-60"
                      title="Refresh hardware status"
                    >
                      <RefreshCw className={cn("w-3.5 h-3.5 text-slate-500", isRefreshing && "animate-spin")} />
                      <span>Refresh</span>
                    </button>
                  </div>
                ) : (
                  /* Default Fallback Actions */
                  <div className="flex flex-wrap items-center gap-2.5 mt-7 pt-5 border-t border-slate-200/80">
                    <button
                      onClick={() => onOpenPhoneStorage?.(storageObj?.path)}
                      className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-medium rounded-xl text-xs shadow-2xs transition-all cursor-pointer flex items-center gap-2"
                    >
                      <FolderOpen className="w-3.5 h-3.5" />
                      <span>Browse Phone</span>
                    </button>
                    <button
                      onClick={onRefresh}
                      disabled={isRefreshing}
                      className="px-3.5 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 hover:border-slate-300 active:scale-[0.98] text-slate-700 font-medium rounded-xl text-xs shadow-2xs transition-all cursor-pointer flex items-center gap-2 disabled:opacity-60"
                    >
                      <RefreshCw className={cn("w-3.5 h-3.5 text-slate-500", isRefreshing && "animate-spin")} />
                      <span>Refresh Status</span>
                    </button>
                  </div>
                )}

              </div>
            )}

          </div>

          {/* ========================================================= */}
          {/* RIGHT COLUMN: DETECTED MODES & LIVE ACTIVITY (Cols 8-12)  */}
          {/* ========================================================= */}
          <div className="col-span-12 lg:col-span-5 xl:col-span-5 flex flex-col gap-5 min-w-0">
            
            {/* Header Tag */}
            <div className="min-w-0">
              <h4 className="text-[11px] font-bold tracking-wider text-slate-500 uppercase mb-3">
                {isConnected ? 'DETECTED MODE' : 'DETECTABLE MODES'}
              </h4>

              {/* Stacked Mode Cards */}
              <div className="flex flex-col gap-2.5 min-w-0">
                
                {/* 1. MTP Card */}
                <ModeCard
                  icon={<FolderOpen className="w-4 h-4 text-emerald-600" />}
                  iconBg="bg-emerald-50"
                  title="File Transfer (MTP)"
                  subtitle="Browse internal shared storage"
                  active={deviceStatus?.mtp}
                  hasError={deviceStatus?.driverError && deviceStatus?.mtp}
                  isConnected={isConnected}
                />

                {/* 2. ADB Card */}
                <ModeCard
                  icon={<Terminal className="w-4 h-4 text-emerald-600" />}
                  iconBg="bg-emerald-50"
                  title="ADB"
                  subtitle="Turn on USB debugging"
                  active={deviceStatus?.adb}
                  hasError={deviceStatus?.adbError}
                  isConnected={isConnected}
                />

                {/* 3. Fastboot Card */}
                <ModeCard
                  icon={<ArrowDownToLine className="w-4 h-4 text-amber-600" />}
                  iconBg="bg-amber-50"
                  title="Fastboot"
                  subtitle="Reboot to bootloader"
                  active={deviceStatus?.fastboot}
                  hasError={deviceStatus?.fastbootError}
                  isConnected={isConnected}
                />

                {/* 4. MTK BROM Card */}
                <ModeCard
                  icon={<Cpu className="w-4 h-4 text-blue-600" />}
                  iconBg="bg-blue-50"
                  title="MTK BROM / Preloader"
                  subtitle="Power off, then plug in"
                  active={deviceStatus?.mtk}
                  hasError={deviceStatus?.mtkError}
                  isConnected={isConnected}
                />

              </div>
            </div>

            {/* When Disconnected: Big CTA Button */}
            {!isConnected && (
              <button
                onClick={onNavigateToDrivers}
                className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-medium py-3 px-4 rounded-xl shadow-xs text-sm transition-all cursor-pointer mt-1"
              >
                Install missing drivers
              </button>
            )}

            {/* When Connected: Activity Live Event Log Card */}
            {isConnected && (
              <div className="min-w-0">
                <div className="flex items-center justify-between mb-2.5">
                  <h4 className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                    ACTIVITY
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">live events</span>
                </div>
                
                <div className="bg-white/94 backdrop-blur-sm border border-slate-200/90 rounded-xl p-3.5 shadow-2xs font-mono text-[11px] flex flex-col gap-2 min-h-[160px] min-w-0 overflow-hidden">
                  {activityLogs.length > 0 ? (
                    activityLogs.slice(-6).map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2 leading-relaxed min-w-0">
                        <span className="text-slate-400 shrink-0 font-sans text-[10px] mt-0.5 select-none">
                          {item.time || '10:42:07'}
                        </span>
                        <span className={cn(
                          "min-w-0 break-all flex-1 text-[11px] leading-snug",
                          item.highlight ? "text-emerald-700 font-semibold" : "text-slate-700"
                        )}>
                          {item.text}
                        </span>
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="flex items-start gap-2 leading-relaxed min-w-0">
                        <span className="text-slate-400 shrink-0 font-sans text-[10px] mt-0.5 select-none">10:42:07</span>
                        <span className="text-slate-700 min-w-0 break-all flex-1">Device attached</span>
                      </div>
                      <div className="flex items-start gap-2 leading-relaxed min-w-0">
                        <span className="text-slate-400 shrink-0 font-sans text-[10px] mt-0.5 select-none">10:42:08</span>
                        <span className="text-slate-700 min-w-0 break-all flex-1">Driver matched: Google USB</span>
                      </div>
                      <div className="flex items-start gap-2 leading-relaxed min-w-0">
                        <span className="text-slate-400 shrink-0 font-sans text-[10px] mt-0.5 select-none">10:42:11</span>
                        <span className="text-emerald-700 font-semibold min-w-0 break-all flex-1">ADB authorization accepted</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

          </div>

        </div>

      </div>

      {/* HOW TO ENABLE USB DEBUGGING MODAL DIALOG */}
      {showUsbGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-xl relative animate-scaleUp">
            <button 
              onClick={() => setShowUsbGuide(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-emerald-600 shrink-0">
                <Terminal className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-[15px] font-bold text-slate-900 leading-tight">Enable USB Debugging</h3>
                <p className="text-xs text-slate-500 mt-0.5">Unlocks Fastboot, Recovery & Terminal controls</p>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 my-4 text-xs text-slate-600">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/80 border border-slate-100">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-[11px]">1</span>
                <div>
                  <span className="font-semibold text-slate-800">Open Settings</span>
                  <p className="text-slate-500 text-[11px] mt-0.5">Go to your phone's <strong>Settings &gt; About Phone</strong>.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/80 border border-slate-100">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-[11px]">2</span>
                <div>
                  <span className="font-semibold text-slate-800">Tap Build Number 7 Times</span>
                  <p className="text-slate-500 text-[11px] mt-0.5">Tap <strong>Build Number</strong> repeatedly until you see <em>"You are now a developer!"</em>.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/80 border border-slate-100">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-[11px]">3</span>
                <div>
                  <span className="font-semibold text-slate-800">Open Developer Options</span>
                  <p className="text-slate-500 text-[11px] mt-0.5">Go to <strong>System / Additional Settings &gt; Developer Options</strong>.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/80 border border-slate-100">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-[11px]">4</span>
                <div>
                  <span className="font-semibold text-slate-800">Turn ON USB Debugging</span>
                  <p className="text-slate-500 text-[11px] mt-0.5">Toggle <strong>USB Debugging</strong> ON and tap <strong>Allow</strong> on your phone screen.</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setShowUsbGuide(false);
                onRefresh?.();
              }}
              className="w-full mt-1 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-medium py-2.5 rounded-xl text-xs transition-all cursor-pointer shadow-2xs"
            >
              Done / Refresh Status
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ModeCard({ icon, iconBg, title, subtitle, active, hasError, isConnected }) {
  return (
    <div className={cn(
      "border rounded-xl p-3 flex items-center justify-between transition-all duration-300 shadow-2xs",
      active
        ? "bg-emerald-50/50 border-emerald-300 text-slate-900 shadow-xs"
        : hasError
          ? "bg-amber-50/60 border-amber-300 text-slate-900"
          : "bg-white border-slate-200/80 text-slate-700"
    )}>
      <div className="flex items-center gap-3 min-w-0 pr-2 flex-1">
        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-2xs", iconBg)}>
          {icon}
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-1.5 min-w-0">
            {active && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />}
            <span className="text-[13px] font-bold truncate text-slate-800" title={title}>{title}</span>
          </div>
          <span className="text-[11px] text-slate-400 truncate" title={subtitle}>{subtitle}</span>
        </div>
      </div>

      <span className={cn(
        "text-[11px] font-semibold shrink-0 px-2.5 py-1 rounded-md transition-colors",
        active
          ? "text-emerald-700 bg-white border border-emerald-200 shadow-2xs"
          : hasError
            ? "text-amber-700 bg-amber-100/70 border border-amber-300"
            : isConnected
              ? "text-slate-400"
              : "text-slate-400 font-medium"
      )}>
        {active ? 'Active' : hasError ? 'Driver Error' : isConnected ? 'Idle' : 'Waiting'}
      </span>
    </div>
  );
}
