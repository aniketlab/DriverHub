import React, { useState, useEffect, useMemo, useRef, useLayoutEffect } from 'react';
import { 
  Terminal, 
  ArrowDownToLine, 
  Cpu, 
  Search, 
  Check, 
  RefreshCw, 
  Loader2, 
  X, 
  ShieldCheck, 
  Download,
  AlertCircle,
  Volume2,
  VolumeX
} from 'lucide-react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';
import { haptic } from '../utils/soundEffects';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const DRIVER_DEFS = [
  {
    id: 'adb',
    category: 'PLATFORM TOOLS',
    title: 'ADB Platform-Tools',
    desc: 'adb and fastboot binaries, PATH set up automatically',
    modeTag: 'ADB',
    modeColor: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/80',
    iconType: 'terminal',
    iconBg: 'bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200/60 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 dark:shadow-[0_0_12px_rgba(16,185,129,0.2)]',
  },
  {
    id: 'google_usb',
    category: 'GOOGLE',
    title: 'Google USB Driver',
    desc: 'Detects your phone in ADB mode',
    modeTag: 'ADB',
    modeColor: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/80',
    iconType: 'download',
    iconBg: 'bg-amber-50 dark:bg-amber-500/15 border border-amber-200/60 dark:border-amber-500/30 text-amber-600 dark:text-amber-400 dark:shadow-[0_0_12px_rgba(245,158,11,0.2)]',
  },
  {
    id: 'google_bootloader',
    category: 'GOOGLE',
    title: 'Google Bootloader Interface',
    desc: 'Detects your phone in Fastboot mode',
    modeTag: 'Fastboot',
    modeColor: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200/60 dark:border-amber-800/80',
    iconType: 'download',
    iconBg: 'bg-amber-50 dark:bg-amber-500/15 border border-amber-200/60 dark:border-amber-500/30 text-amber-600 dark:text-amber-400 dark:shadow-[0_0_12px_rgba(245,158,11,0.2)]',
  },
  {
    id: 'mtk_vcom',
    category: 'MEDIATEK (MTK)',
    title: 'MTK VCOM Preloader',
    desc: 'Preloader mode for flashing MTK phones',
    modeTag: 'Preloader',
    modeColor: 'bg-blue-50 dark:bg-sky-950/60 text-blue-700 dark:text-sky-300 border-blue-200/60 dark:border-sky-800/80',
    iconType: 'chip',
    iconBg: 'bg-blue-50 dark:bg-sky-500/15 border border-blue-200/60 dark:border-sky-500/30 text-blue-600 dark:text-sky-400 dark:shadow-[0_0_12px_rgba(14,165,233,0.2)]',
  },
  {
    id: 'mtk_brom',
    category: 'MEDIATEK (MTK)',
    title: 'MTK BROM Driver',
    desc: 'BROM mode for unbricking MTK phones',
    modeTag: 'BROM',
    modeColor: 'bg-blue-50 dark:bg-sky-950/60 text-blue-700 dark:text-sky-300 border-blue-200/60 dark:border-sky-800/80',
    iconType: 'chip',
    iconBg: 'bg-blue-50 dark:bg-sky-500/15 border border-blue-200/60 dark:border-sky-500/30 text-blue-600 dark:text-sky-400 dark:shadow-[0_0_12px_rgba(14,165,233,0.2)]',
  }
];

export function DriversPage({
  packageStates = {},
  isScanning = false,
  isInstalling = false,
  installingTarget = null,
  installProgress = {},
  onScan,
  onInstallDrivers,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'installed' | 'updates' | 'not_installed'
  const [soundEnabled, setSoundEnabled] = useState(() => haptic.isEnabled());
  const [createRestorePoint, setCreateRestorePoint] = useState(() => {
    try {
      const saved = localStorage.getItem('driverhub_restore_point');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  // Track installation transitions for "Vault Lock" SVG checkmark & Shockwave bursts
  const prevInstallingRef = useRef(isInstalling);
  const [recentlyInstalled, setRecentlyInstalled] = useState({});

  useEffect(() => {
    if (prevInstallingRef.current && !isInstalling) {
      const newRecent = {};
      const now = Date.now();
      DRIVER_DEFS.forEach(def => {
        if (packageStates[def.id]?.installed) {
          newRecent[def.id] = now;
        }
      });
      setRecentlyInstalled(newRecent);
      haptic.success();

      const timer = setTimeout(() => {
        setRecentlyInstalled({});
      }, 3200);
      return () => clearTimeout(timer);
    }
    prevInstallingRef.current = isInstalling;
  }, [isInstalling, packageStates]);

  // Dynamic Magnetic Sliding Indicator Refs & State
  const tabRefs = useRef({});
  const tabsContainerRef = useRef(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 4, width: 60, ready: false });

  const handleToggleRestorePoint = () => {
    haptic.pop(!createRestorePoint);
    setCreateRestorePoint(prev => {
      const next = !prev;
      try { localStorage.setItem('driverhub_restore_point', String(next)); } catch {}
      return next;
    });
  };

  // Derive package full state (installed, version, updateAvailable)
  const packagesData = useMemo(() => {
    return DRIVER_DEFS.map(def => {
      const state = packageStates[def.id] || {};
      const installed = Boolean(state.installed);
      const updateAvailable = Boolean(state.updateAvailable);

      let status = 'not_installed';
      let statusLabel = 'Not installed';
      let actionLabel = 'Install';

      if (updateAvailable) {
        status = 'updates';
        statusLabel = 'Update available';
        actionLabel = 'Update';
      } else if (installed) {
        status = 'installed';
        statusLabel = 'Installed';
        actionLabel = 'Reinstall';
      }

      return {
        ...def,
        installed,
        updateAvailable,
        version: state.version || null,
        status,
        statusLabel,
        actionLabel,
        isItemScanning: Boolean(state.isScanning),
        progress: installProgress[def.id]?.percent || 0,
        progressMessage: installProgress[def.id]?.message || null,
        isThisInstalling: isInstalling && (installingTarget === def.id || (Array.isArray(installingTarget) && installingTarget.includes(def.id)))
      };
    });
  }, [packageStates, isInstalling, installingTarget, installProgress]);

  // Initial selection: auto-select drivers needing attention (updates or not installed)
  const [selectedIds, setSelectedIds] = useState(() => {
    return new Set(
      packagesData
        .filter(p => p.status === 'not_installed' || p.status === 'updates')
        .map(p => p.id)
    );
  });

  // Calculate summary counts
  const counts = useMemo(() => {
    let installed = 0;
    let updates = 0;
    let notInstalled = 0;

    packagesData.forEach(p => {
      if (p.status === 'updates') updates++;
      else if (p.status === 'installed') installed++;
      else notInstalled++;
    });

    return {
      all: packagesData.length,
      installed,
      updates,
      not_installed: notInstalled,
      needAttention: updates + notInstalled
    };
  }, [packagesData]);

  // Measure and align sliding indicator pill
  useLayoutEffect(() => {
    const activeEl = tabRefs.current[activeFilter];
    const container = tabsContainerRef.current;
    if (activeEl && container) {
      const containerRect = container.getBoundingClientRect();
      const tabRect = activeEl.getBoundingClientRect();
      setIndicatorStyle({
        left: tabRect.left - containerRect.left,
        width: tabRect.width,
        ready: true
      });
    }
  }, [activeFilter, counts]);

  // Filter and search
  const filteredPackages = useMemo(() => {
    return packagesData.filter(p => {
      // Filter by tab
      if (activeFilter !== 'all' && p.status !== activeFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = p.title.toLowerCase().includes(q);
        const matchesDesc = p.desc.toLowerCase().includes(q);
        const matchesCategory = p.category.toLowerCase().includes(q);
        const matchesTag = p.modeTag.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesCategory && !matchesTag) {
          return false;
        }
      }
      return true;
    });
  }, [packagesData, activeFilter, searchQuery]);

  // Group by category
  const groupedCategories = useMemo(() => {
    const map = new Map();
    filteredPackages.forEach(p => {
      if (!map.has(p.category)) {
        map.set(p.category, []);
      }
      map.get(p.category).push(p);
    });
    return Array.from(map.entries());
  }, [filteredPackages]);

  // Selection actions with Haptics
  const handleToggleSelect = (id) => {
    const willBeChecked = !selectedIds.has(id);
    haptic.pop(willBeChecked);
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const isAllVisibleSelected = filteredPackages.length > 0 && filteredPackages.every(p => selectedIds.has(p.id));

  const handleToggleSelectAll = () => {
    haptic.tick();
    if (isAllVisibleSelected) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        filteredPackages.forEach(p => next.delete(p.id));
        return next;
      });
    } else {
      setSelectedIds(prev => {
        const next = new Set(prev);
        filteredPackages.forEach(p => next.add(p.id));
        return next;
      });
    }
  };

  // Execution Handlers with Haptic Audio
  const handleInstallSingle = (id) => {
    if (isInstalling) return;
    haptic.tick();
    onInstallDrivers?.([id], { createRestorePoint });
  };

  const handleInstallSelected = () => {
    if (isInstalling || selectedIds.size === 0) return;
    haptic.tick();
    onInstallDrivers?.(Array.from(selectedIds), { createRestorePoint });
  };

  const renderIcon = (type) => {
    switch (type) {
      case 'terminal':
        return <Terminal className="w-5 h-5 stroke-[2.2] transition-transform duration-200 group-hover:scale-110" />;
      case 'chip':
        return <Cpu className="w-5 h-5 stroke-[2.2] transition-transform duration-200 group-hover:scale-110" />;
      case 'download':
      default:
        return <Download className="w-5 h-5 stroke-[2.2] transition-transform duration-200 group-hover:scale-110" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-transparent relative overflow-y-auto no-drag-region p-6 pt-5 select-none min-w-0">
      <div className="max-w-4xl w-full mx-auto flex flex-col gap-6 flex-1 min-w-0">
        
        {/* ========================================================= */}
        {/* TOP HEADER & SEARCH                                       */}
        {/* ========================================================= */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
              Drivers
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium transition-all duration-300">
              {counts.all} packages · {counts.installed} installed · {counts.needAttention} need attention
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Search Input Box with Focus Glow */}
            <div className="relative w-64 group">
              <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-200 group-focus-within:text-emerald-600 dark:group-focus-within:text-emerald-400" />
              <input
                type="text"
                placeholder="Search drivers"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-7 py-2 bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700/90 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-500 shadow-2xs transition-all duration-200"
              />
              {searchQuery && (
                <button 
                  onClick={() => {
                    haptic.tick();
                    setSearchQuery('');
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 active:scale-75 transition-all cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Quick Refresh Status Button with Haptic */}
            <button
              onClick={() => {
                haptic.tick();
                onScan?.();
              }}
              disabled={isScanning || isInstalling}
              title="Re-scan DriverStore"
              className="p-2 bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700/90 hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-[0.96] rounded-xl text-slate-600 dark:text-slate-300 shadow-2xs transition-all duration-150 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={cn("w-3.5 h-3.5 text-slate-500 dark:text-slate-400", isScanning && "animate-spin text-emerald-600 dark:text-emerald-400")} />
            </button>

            {/* Tactile Audio Mute / Unmute Toggle */}
            <button
              onClick={() => {
                const next = haptic.toggle();
                setSoundEnabled(next);
              }}
              title={soundEnabled ? "Tactile Audio: Enabled (Click to mute)" : "Tactile Audio: Muted (Click to unmute)"}
              className={cn(
                "p-2 border rounded-xl shadow-2xs transition-all duration-150 cursor-pointer active:scale-[0.96] flex items-center justify-center",
                soundEnabled 
                  ? "bg-white dark:bg-slate-800 border-slate-200/90 dark:border-slate-700/90 text-emerald-600 dark:text-emerald-400 hover:bg-slate-50 dark:hover:bg-slate-700" 
                  : "bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:bg-slate-200/70 dark:hover:bg-slate-700/60"
              )}
            >
              {soundEnabled ? (
                <Volume2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <VolumeX className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              )}
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* FILTER TABS / PILLS (MAGNETIC SLIDING INDICATOR)          */}
        {/* ========================================================= */}
        <div 
          ref={tabsContainerRef} 
          className="relative flex items-center p-1 bg-slate-200/50 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl w-fit border border-slate-200/70 dark:border-slate-700/60 shadow-2xs select-none transition-colors"
        >
          {/* Smooth Sliding Magnetic Background Pill */}
          <div
            className="absolute left-0 top-1 bottom-1 bg-white dark:bg-slate-700 rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.07),0_1px_2px_rgba(0,0,0,0.03)] border border-slate-900/[0.04] dark:border-slate-600/50 pointer-events-none transition-colors"
            style={{
              transform: `translateX(${indicatorStyle.left}px)`,
              width: `${indicatorStyle.width}px`,
              transition: 'transform 220ms cubic-bezier(0.16, 1, 0.3, 1), width 220ms cubic-bezier(0.16, 1, 0.3, 1)',
              opacity: indicatorStyle.ready ? 1 : 0,
            }}
          />

          {[
            { id: 'all', label: 'All', count: counts.all },
            { id: 'installed', label: 'Installed', count: counts.installed },
            { id: 'updates', label: 'Updates', count: counts.updates },
            { id: 'not_installed', label: 'Not installed', count: counts.not_installed }
          ].map(tab => {
            const isActive = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                ref={el => { if (el) tabRefs.current[tab.id] = el; }}
                onClick={() => {
                  if (activeFilter !== tab.id) haptic.tab();
                  setActiveFilter(tab.id);
                }}
                className={cn(
                  "relative z-10 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors duration-200 cursor-pointer flex items-center gap-1.5 active:scale-[0.98]",
                  isActive
                    ? "text-slate-900 dark:text-white font-semibold"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                )}
              >
                <span>{tab.label}</span>
                <span className={cn(
                  "text-[10px] px-1.5 py-0.2 rounded-full font-mono transition-colors",
                  isActive
                    ? "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold"
                    : "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300"
                )}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ========================================================= */}
        {/* DRIVERS LIST GROUPED BY CATEGORY (CASCADE ANIMATION)      */}
        {/* ========================================================= */}
        <div className="flex flex-col gap-5 flex-1 pb-16">
          {groupedCategories.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-10 text-center flex flex-col items-center justify-center gap-2 shadow-2xs my-4 animate-card-in">
              <AlertCircle className="w-7 h-7 text-slate-400 dark:text-slate-500" />
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">No matching driver packages found</h4>
              <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm">
                Try adjusting your search query or switching the filter tab.
              </p>
            </div>
          ) : (
            groupedCategories.map(([category, items], catIdx) => (
              <div key={category} className="flex flex-col gap-2.5">
                {/* Category Header */}
                <h3 className="text-[11px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase px-1 transition-opacity duration-300">
                  {category}
                </h3>

                {/* Category Cards */}
                <div className="flex flex-col gap-2.5">
                  {items.map((item) => {
                    const isChecked = selectedIds.has(item.id);
                    const isCardInstalling = item.isThisInstalling;
                    const isRecentlyInstalled = Boolean(recentlyInstalled[item.id]);

                    return (
                      <div
                        key={item.id}
                        className={cn(
                          "group bg-white dark:bg-slate-900/95 rounded-2xl p-4 transition-all duration-300 shadow-2xs flex flex-col gap-3 relative overflow-hidden",
                          isCardInstalling && "animate-card-installing border-emerald-500/80 ring-2 ring-emerald-500/20",
                          isRecentlyInstalled && "animate-shockwave-burst border-emerald-500 ring-4 ring-emerald-500/25",
                          !isCardInstalling && !isRecentlyInstalled && (
                            isChecked 
                              ? "border-2 border-emerald-500 ring-4 ring-emerald-500/10 shadow-xs" 
                              : "border border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs"
                          )
                        )}
                      >
                        <div className="flex items-center justify-between gap-4">
                          
                          {/* Left: Checkbox + Icon + Details */}
                          <div className="flex items-center gap-3.5 min-w-0">
                            {/* Checkbox with Smooth Pop */}
                            <button
                              type="button"
                              onClick={() => handleToggleSelect(item.id)}
                              className={cn(
                                "w-5 h-5 rounded-md border flex items-center justify-center transition-all duration-150 cursor-pointer shrink-0 active:scale-90",
                                isChecked
                                  ? "bg-emerald-600 border-emerald-600 text-white shadow-2xs"
                                  : "border-slate-300 dark:border-slate-600 hover:border-slate-400 bg-white dark:bg-slate-800"
                              )}
                            >
                              {isChecked && <Check className="w-3.5 h-3.5 stroke-[3] animate-check-pop" />}
                            </button>

                            {/* Icon Squircle */}
                            <div className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs transition-transform duration-200 group-hover:scale-[1.03]",
                              item.iconBg
                            )}>
                              {renderIcon(item.iconType)}
                            </div>

                            {/* Title & Description */}
                            <div className="flex flex-col min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="text-[13px] font-bold text-slate-800 dark:text-white truncate">
                                  {item.title}
                                </h4>
                                {item.version && (
                                  <span className="text-[10px] text-slate-400 dark:text-slate-400 font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md">
                                    v{item.version}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                {item.desc}
                              </p>
                            </div>
                          </div>

                          {/* Right: Mode Badge + Status Badge + Morphing Action Capsule */}
                          <div className="flex items-center gap-3 shrink-0">
                            
                            {/* Mode Tag */}
                            <span className={cn(
                              "text-[11px] font-semibold px-3 py-1 rounded-full border border-transparent select-none",
                              item.modeColor
                            )}>
                              {item.modeTag}
                            </span>

                            {/* Status Badge */}
                            <span className={cn(
                              "text-xs font-medium px-3.5 py-1 rounded-full select-none transition-all duration-200",
                              item.status === 'installed' && "bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300",
                              item.status === 'updates' && "bg-amber-100/80 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 animate-pulse",
                              item.status === 'not_installed' && "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                            )}>
                              {item.statusLabel}
                            </span>

                            {/* Morphing Action Engine: Idle -> Cyber-Capsule -> SVG Locked */}
                            {isCardInstalling ? (
                              <div className="relative min-w-[145px] h-8 bg-slate-950 border border-emerald-500/50 rounded-xl overflow-hidden flex items-center justify-between px-3 shadow-inner animate-luxury-in">
                                {/* Staging Fill Level */}
                                <div 
                                  className="absolute inset-y-0 left-0 bg-emerald-600/35 transition-all duration-300 pointer-events-none"
                                  style={{ width: `${Math.max(item.progress, 12)}%` }}
                                />
                                {/* Laser Shimmer Sweep */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-400/25 to-transparent w-full pointer-events-none animate-laser-sweep" />
                                
                                {/* Left Telemetry Tag */}
                                <div className="relative z-10 flex items-center gap-1.5 text-emerald-400 text-[10px] font-mono tracking-wider font-semibold">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                                  <span>STAGING</span>
                                </div>

                                {/* Right Percentage */}
                                <span className="relative z-10 text-emerald-300 font-mono font-bold text-xs tracking-tight">
                                  {item.progress}%
                                </span>
                              </div>
                            ) : isRecentlyInstalled ? (
                              <div className="min-w-[105px] h-8 px-2.5 bg-emerald-500/10 dark:bg-emerald-950/60 border border-emerald-500/40 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 rounded-xl flex items-center justify-center gap-1.5 shadow-2xs animate-luxury-in font-medium text-xs select-none">
                                <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                                  <circle className="animate-draw-circle" cx="12" cy="12" r="10" />
                                  <path className="animate-draw-check" d="M8 12.5l2.5 2.5 5.5-5.5" />
                                </svg>
                                <span className="font-mono text-[11px] font-bold tracking-tight text-emerald-800 dark:text-emerald-300">SIGNED</span>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleInstallSingle(item.id)}
                                disabled={isInstalling}
                                className={cn(
                                  "min-w-[84px] px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all duration-200 active:scale-[0.98] cursor-pointer shadow-2xs flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed",
                                  item.status === 'installed'
                                    ? "bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300"
                                    : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-700/20 hover:shadow-xs"
                                )}
                              >
                                <span>{item.actionLabel}</span>
                              </button>
                            )}

                          </div>

                        </div>

                        {/* Inline Cyber-Clean Progress Bar & Live Kernel Telemetry */}
                        {isCardInstalling && (
                          <div className="mt-1 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2 animate-luxury-in">
                            <div className="flex items-center justify-between text-[11px] font-mono">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
                                <span className="text-slate-600 dark:text-slate-300 font-mono text-[10px] truncate max-w-md">
                                  {item.progressMessage || 'Injecting INF package into Windows DriverStore...'}
                                </span>
                                <span className="text-emerald-500 font-bold animate-cursor-blink text-[10px]">█</span>
                              </div>
                              <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono text-xs shrink-0">
                                {item.progress}%
                              </span>
                            </div>
                            <div className="relative w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className="bg-gradient-to-r from-emerald-600 to-emerald-400 h-full rounded-full transition-all duration-300 relative overflow-hidden"
                                style={{ width: `${Math.max(item.progress, 5)}%` }}
                              >
                                <div className="absolute inset-0 bg-white/40 animate-laser-sweep pointer-events-none" />
                              </div>
                            </div>
                          </div>
                        )}

                      </div>
                    );
                  })}
                </div>

              </div>
            ))
          )}
        </div>

      </div>

      {/* ========================================================= */}
      {/* FLOATING STICKY ACTION BAR AT BOTTOM                      */}
      {/* ========================================================= */}
      <div className="sticky bottom-0 left-0 right-0 mt-auto pt-2 pb-1 bg-gradient-to-t from-slate-50 dark:from-[#0a0f1d] via-slate-50/90 dark:via-[#0a0f1d]/90 to-transparent">
        <div className="max-w-4xl mx-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-3.5 px-5 shadow-lg flex items-center justify-between gap-4 transition-colors">
          
          {/* Left: Spring Toggle Switch for Restore Point */}
          <div className="flex items-center gap-3 select-none">
            <button
              type="button"
              role="switch"
              aria-checked={createRestorePoint}
              onClick={handleToggleRestorePoint}
              className={cn(
                "w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer focus:outline-none shrink-0 p-0.5 shadow-inner flex items-center active:scale-[0.96]",
                createRestorePoint ? "bg-emerald-600 dark:bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"
              )}
            >
              <span
                className={cn(
                  "w-5 h-5 bg-white rounded-full shadow-xs transition-transform duration-200 ease-out pointer-events-none",
                  createRestorePoint ? "translate-x-5" : "translate-x-0"
                )}
              />
            </button>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight">
                Create a restore point first
              </span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 leading-tight">
                You can roll back if a driver causes trouble
              </span>
            </div>
          </div>

          {/* Right: Selection Counter + Select All + Install Selected */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 font-sans transition-all duration-200">
              {selectedIds.size} selected
            </span>

            <button
              onClick={handleToggleSelectAll}
              className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700/80 hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-[0.98] text-slate-700 dark:text-slate-200 font-semibold rounded-xl text-xs shadow-2xs transition-all duration-150 cursor-pointer"
            >
              {isAllVisibleSelected ? "Deselect all" : "Select all"}
            </button>

            <button
              onClick={handleInstallSelected}
              disabled={selectedIds.size === 0 || isInstalling}
              className={cn(
                "relative overflow-hidden px-5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-300 cursor-pointer flex items-center gap-2",
                isInstalling
                  ? "bg-slate-950 border border-emerald-500/50 text-emerald-400 shadow-inner min-w-[215px] justify-between"
                  : "bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white shadow-sm shadow-emerald-700/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              )}
            >
              {isInstalling ? (
                <>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-400/20 to-transparent animate-laser-sweep pointer-events-none" />
                  <div className="relative z-10 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span className="font-mono text-emerald-300 text-[11px] tracking-wide">STAGING DRIVERS...</span>
                  </div>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400 relative z-10" />
                </>
              ) : (
                <span>Install selected ({selectedIds.size})</span>
              )}
            </button>
          </div>

        </div>
      </div>

    </div>
  );
}
