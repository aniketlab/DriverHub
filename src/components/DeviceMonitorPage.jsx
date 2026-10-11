import React from 'react';
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
  Smartphone
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
  onRebootBootloader,
  onRebootRecovery,
  onOpenShell,
  activityLogs = [],
  isRefreshing = false
}) {
  const isConnected = deviceStatus?.connected;

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-y-auto no-drag-region p-6 pt-5 select-none">
      <div className="max-w-6xl w-full mx-auto flex flex-col gap-6">
        
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
              className="px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 active:scale-[0.98] text-slate-700 text-xs font-medium rounded-lg shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={cn("w-3.5 h-3.5 text-slate-500", isRefreshing && "animate-spin")} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* MAIN 2-COLUMN GRID */}
        <div className="grid grid-cols-12 gap-5 items-start">
          
          {/* ========================================================= */}
          {/* LEFT COLUMN: HERO DEVICE SHOWCASE & CONTROLS (Cols 1-8)   */}
          {/* ========================================================= */}
          <div className="col-span-12 lg:col-span-8 bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 shadow-xs flex flex-col justify-between min-h-[490px]">
            
            {!isConnected ? (
              /* --- DISCONNECTED HERO STATE --- */
              <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
                
                {/* Visual Centerpiece (Heartbeat / Sonic Wave Pulse + Phone) */}
                <div className="relative w-52 h-52 flex items-center justify-center mb-6">
                  <svg viewBox="0 0 200 200" className="w-full h-full">
                    <defs>
                      {/* Organic Heartbeat Radial Mesh Glow */}
                      <radialGradient id="dharkanGlow" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#10B981" stopOpacity="0.35" />
                        <stop offset="45%" stopColor="#10B981" stopOpacity="0.12" />
                        <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                      </radialGradient>
                    </defs>

                    {/* Outer Boundary Ring */}
                    <circle cx="100" cy="95" r="82" fill="none" stroke="#F1F5F9" strokeWidth="1.5" />
                    
                    {/* Middle Subtle Dashed Ring */}
                    <circle cx="100" cy="95" r="62" fill="none" stroke="#E2E8F0" strokeWidth="1.2" strokeDasharray="4 4" />

                    {/* 1. Organic Heartbeat Core Halo (Lub-Dub Rhythmic Breathing) */}
                    <circle cx="100" cy="95" r="44" fill="url(#dharkanGlow)">
                      <animate 
                        attributeName="r" 
                        values="36; 52; 40; 56; 36" 
                        keyTimes="0; 0.22; 0.38; 0.58; 1" 
                        dur="2.4s" 
                        repeatCount="indefinite" 
                      />
                      <animate 
                        attributeName="opacity" 
                        values="0.35; 0.9; 0.45; 1; 0.35" 
                        keyTimes="0; 0.22; 0.38; 0.58; 1" 
                        dur="2.4s" 
                        repeatCount="indefinite" 
                      />
                    </circle>

                    {/* 2. Expanding Heartbeat Ripple Waves ("Dheere dheere bada hota hai") */}
                    {/* Ripple Wave 1 */}
                    <circle cx="100" cy="95" r="30" fill="none" stroke="#10B981">
                      <animate attributeName="r" values="30; 82" dur="3s" repeatCount="indefinite" />
                      <animate attributeName="strokeOpacity" values="0.7; 0" dur="3s" repeatCount="indefinite" />
                      <animate attributeName="strokeWidth" values="1.8; 0.6" dur="3s" repeatCount="indefinite" />
                    </circle>

                    {/* Ripple Wave 2 (Staggered 1s) */}
                    <circle cx="100" cy="95" r="30" fill="none" stroke="#10B981">
                      <animate attributeName="r" values="30; 82" begin="1s" dur="3s" repeatCount="indefinite" />
                      <animate attributeName="strokeOpacity" values="0.7; 0" begin="1s" dur="3s" repeatCount="indefinite" />
                      <animate attributeName="strokeWidth" values="1.8; 0.6" dur="3s" repeatCount="indefinite" />
                    </circle>

                    {/* Ripple Wave 3 (Staggered 2s) */}
                    <circle cx="100" cy="95" r="30" fill="none" stroke="#10B981">
                      <animate attributeName="r" values="30; 82" begin="2s" dur="3s" repeatCount="indefinite" />
                      <animate attributeName="strokeOpacity" values="0.7; 0" begin="2s" dur="3s" repeatCount="indefinite" />
                      <animate attributeName="strokeWidth" values="1.8; 0.6" dur="3s" repeatCount="indefinite" />
                    </circle>

                    {/* 3. Phone Chassis (Elevated, centered at 100, 95) */}
                    <rect x="83" y="60" width="34" height="66" rx="8" fill="#FFFFFF" stroke="#10B981" strokeWidth="1.8" />
                    
                    {/* OLED Screen with gentle green ambient tint */}
                    <rect x="86.5" y="64" width="27" height="58" rx="5" fill="#F0FDF4" />

                    {/* Speaker Notch */}
                    <rect x="94" y="62" width="12" height="1.8" rx="0.9" fill="#059669" />

                    {/* Heartbeat EKG Pulse Wave inside screen ("Dharkan" ECG line) */}
                    <path
                      d="M 90 94 L 94 94 L 96 87 L 98 100 L 101 90 L 103 95 L 110 94"
                      fill="none"
                      stroke="#10B981"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <animate 
                        attributeName="strokeOpacity" 
                        values="0.3; 1; 0.45; 1; 0.3" 
                        keyTimes="0; 0.22; 0.38; 0.58; 1" 
                        dur="2.4s" 
                        repeatCount="indefinite" 
                      />
                    </path>

                    {/* Tiny Breathing Heartbeat Indicator Dot inside screen */}
                    <circle cx="100" cy="74" r="2" fill="#10B981">
                      <animate 
                        attributeName="opacity" 
                        values="0.4; 1; 0.5; 1; 0.4" 
                        keyTimes="0; 0.22; 0.38; 0.58; 1" 
                        dur="2.4s" 
                        repeatCount="indefinite" 
                      />
                    </circle>

                    {/* 4. Waiting USB Cable (Flowing dashed pulse into connector) */}
                    <line x1="100" y1="126" x2="100" y2="142" stroke="#10B981" strokeWidth="1.8" strokeDasharray="3 3">
                      <animate attributeName="strokeDashoffset" values="0; 12" dur="1.2s" repeatCount="indefinite" />
                    </line>
                    <rect x="97" y="142" width="6" height="7" rx="1.5" fill="#059669" />
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
              <div className="flex flex-col gap-6 flex-1 justify-between">
                
                {/* Top Section: Connected Device Identity */}
                <div className="flex items-center gap-6">
                  {/* Glowing Smartphone Mockup with Checkmark */}
                  <div className="relative w-28 h-36 shrink-0 flex items-center justify-center">
                    {/* Radial Ambient Glow */}
                    <div className="absolute inset-0 bg-emerald-400/20 rounded-full blur-xl pointer-events-none animate-pulse" />
                    
                    <svg viewBox="0 0 100 130" className="w-full h-full relative z-10 drop-shadow-xs">
                      {/* Outer Ring */}
                      <circle cx="50" cy="55" r="42" fill="#ECFDF5" fillOpacity="0.6" stroke="#A7F3D0" strokeWidth="1.2" />

                      {/* Phone Chassis */}
                      <rect x="34" y="22" width="32" height="62" rx="7" fill="#FFFFFF" stroke="#10B981" strokeWidth="2" />
                      {/* Screen */}
                      <rect x="37" y="26" width="26" height="54" rx="4.5" fill="#F0FDF4" />
                      {/* Notch */}
                      <rect x="45" y="24" width="10" height="1.8" rx="0.9" fill="#059669" />

                      {/* Success Checkmark */}
                      <path 
                        d="M 44 54 L 48 58 L 56 48" 
                        fill="none" 
                        stroke="#10B981" 
                        strokeWidth="2.5" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                      />

                      {/* USB-C Cable */}
                      <line x1="50" y1="84" x2="50" y2="102" stroke="#10B981" strokeWidth="2" strokeLinecap="round" />
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

                {/* Middle Section: Specs Grid (6 Cards, 3 cols x 2 rows) */}
                <div className="grid grid-cols-3 gap-3 my-2">
                  {/* 1. Android OS */}
                  <div className="bg-slate-50/70 border border-slate-100 rounded-xl p-3 flex flex-col justify-between">
                    <span className="text-[10px] text-slate-400 font-medium">Android</span>
                    <span className="text-[13px] font-bold text-slate-800 mt-1">
                      {deviceStatus?.androidVersion || (deviceStatus?.adb ? 'Android 14' : deviceStatus?.mode || 'Android')}
                    </span>
                  </div>

                  {/* 2. Battery */}
                  <div className="bg-slate-50/70 border border-slate-100 rounded-xl p-3 flex flex-col justify-between">
                    <span className="text-[10px] text-slate-400 font-medium">Battery</span>
                    <div className="mt-1">
                      <span className="text-[13px] font-bold text-slate-800">
                        {deviceStatus?.battery || (deviceStatus?.adb ? '82%' : 'Charging')}
                      </span>
                      <div className="w-full bg-slate-200 h-1 rounded-full mt-1.5 overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: '82%' }} />
                      </div>
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
                    <span className="text-[13px] font-bold text-slate-800 mt-1 truncate">
                      {deviceStatus?.driverName || (deviceStatus?.fastboot ? 'Fastboot WinUSB' : 'Google USB')}
                    </span>
                  </div>

                  {/* 5. Bootloader */}
                  <div className="bg-slate-50/70 border border-slate-100 rounded-xl p-3 flex flex-col justify-between">
                    <span className="text-[10px] text-slate-400 font-medium">Bootloader</span>
                    <span className="text-[13px] font-bold text-slate-800 mt-1">
                      {deviceStatus?.bootloaderState || (deviceStatus?.fastboot ? 'Unlocked' : 'Locked')}
                    </span>
                  </div>

                  {/* 6. Storage */}
                  <div className="bg-slate-50/70 border border-slate-100 rounded-xl p-3 flex flex-col justify-between">
                    <span className="text-[10px] text-slate-400 font-medium">Storage</span>
                    <span className="text-[13px] font-bold text-slate-800 mt-1">
                      {deviceStatus?.storage || '128 GB'}
                    </span>
                  </div>
                </div>

                {/* Bottom Section: Action Buttons */}
                <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-100">
                  <button
                    onClick={onRebootBootloader}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-medium rounded-xl text-xs shadow-2xs transition-all cursor-pointer"
                  >
                    Reboot to bootloader
                  </button>

                  <button
                    onClick={onRebootRecovery}
                    className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 active:scale-[0.98] text-slate-700 font-medium rounded-xl text-xs shadow-2xs transition-all cursor-pointer"
                  >
                    Reboot to recovery
                  </button>

                  <button
                    onClick={onOpenShell}
                    className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 active:scale-[0.98] text-slate-700 font-medium rounded-xl text-xs shadow-2xs transition-all cursor-pointer"
                  >
                    Open ADB shell
                  </button>
                </div>

              </div>
            )}

          </div>

          {/* ========================================================= */}
          {/* RIGHT COLUMN: DETECTED MODES & LIVE ACTIVITY (Cols 9-12)  */}
          {/* ========================================================= */}
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-5">
            
            {/* Header Tag */}
            <div>
              <h4 className="text-[11px] font-bold tracking-wider text-slate-500 uppercase mb-3">
                {isConnected ? 'DETECTED MODE' : 'DETECTABLE MODES'}
              </h4>

              {/* Stacked Mode Cards */}
              <div className="flex flex-col gap-2.5">
                
                {/* 1. ADB Card */}
                <ModeCard
                  icon={<Terminal className="w-4 h-4 text-emerald-600" />}
                  iconBg="bg-emerald-50"
                  title="ADB"
                  subtitle="Turn on USB debugging"
                  active={deviceStatus?.adb}
                  hasError={deviceStatus?.adbError}
                  isConnected={isConnected}
                />

                {/* 2. Fastboot Card */}
                <ModeCard
                  icon={<ArrowDownToLine className="w-4 h-4 text-amber-600" />}
                  iconBg="bg-amber-50"
                  title="Fastboot"
                  subtitle="Reboot to bootloader"
                  active={deviceStatus?.fastboot}
                  hasError={deviceStatus?.fastbootError}
                  isConnected={isConnected}
                />

                {/* 3. MTK BROM Card */}
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
              <div>
                <h4 className="text-[11px] font-bold tracking-wider text-slate-500 uppercase mb-3">
                  ACTIVITY
                </h4>
                
                <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs font-mono text-[11px] flex flex-col gap-2 min-h-[160px]">
                  {activityLogs.length > 0 ? (
                    activityLogs.slice(-6).map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 leading-relaxed">
                        <span className="text-slate-400 shrink-0 font-sans text-[10px] mt-0.5">
                          {item.time || '10:42:07'}
                        </span>
                        <span className={cn(
                          item.highlight ? "text-emerald-700 font-semibold" : "text-slate-700"
                        )}>
                          {item.text}
                        </span>
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="flex items-start gap-2.5 leading-relaxed">
                        <span className="text-slate-400 shrink-0 font-sans text-[10px] mt-0.5">10:42:07</span>
                        <span className="text-slate-700">Device attached</span>
                      </div>
                      <div className="flex items-start gap-2.5 leading-relaxed">
                        <span className="text-slate-400 shrink-0 font-sans text-[10px] mt-0.5">10:42:08</span>
                        <span className="text-slate-700">Driver matched: Google USB</span>
                      </div>
                      <div className="flex items-start gap-2.5 leading-relaxed">
                        <span className="text-slate-400 shrink-0 font-sans text-[10px] mt-0.5">10:42:11</span>
                        <span className="text-emerald-700 font-semibold">ADB authorization accepted</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
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
      <div className="flex items-center gap-3 min-w-0 pr-2">
        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-2xs", iconBg)}>
          {icon}
        </div>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            {active && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
            <span className="text-[13px] font-bold truncate text-slate-800">{title}</span>
          </div>
          <span className="text-[11px] text-slate-400 truncate">{subtitle}</span>
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
