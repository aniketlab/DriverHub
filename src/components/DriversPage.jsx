import React, { useState, useMemo } from 'react';
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
  AlertCircle
} from 'lucide-react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

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
    modeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
    iconType: 'terminal',
    iconBg: 'bg-emerald-50 text-emerald-600',
  },
  {
    id: 'google_usb',
    category: 'GOOGLE',
    title: 'Google USB Driver',
    desc: 'Detects your phone in ADB mode',
    modeTag: 'ADB',
    modeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
    iconType: 'download',
    iconBg: 'bg-amber-50 text-amber-600',
  },
  {
    id: 'google_bootloader',
    category: 'GOOGLE',
    title: 'Google Bootloader Interface',
    desc: 'Detects your phone in Fastboot mode',
    modeTag: 'Fastboot',
    modeColor: 'bg-amber-50 text-amber-700 border-amber-200/60',
    iconType: 'download',
    iconBg: 'bg-amber-50 text-amber-600',
  },
  {
    id: 'mtk_vcom',
    category: 'MEDIATEK (MTK)',
    title: 'MTK VCOM Preloader',
    desc: 'Preloader mode for flashing MTK phones',
    modeTag: 'Preloader',
    modeColor: 'bg-blue-50 text-blue-700 border-blue-200/60',
    iconType: 'chip',
    iconBg: 'bg-blue-50 text-blue-600',
  },
  {
    id: 'mtk_brom',
    category: 'MEDIATEK (MTK)',
    title: 'MTK BROM Driver',
    desc: 'BROM mode for unbricking MTK phones',
    modeTag: 'BROM',
    modeColor: 'bg-blue-50 text-blue-700 border-blue-200/60',
    iconType: 'chip',
    iconBg: 'bg-blue-50 text-blue-600',
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
  const [createRestorePoint, setCreateRestorePoint] = useState(() => {
    try {
      const saved = localStorage.getItem('driverhub_restore_point');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const handleToggleRestorePoint = () => {
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

  // Selection actions
  const handleToggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const isAllVisibleSelected = filteredPackages.length > 0 && filteredPackages.every(p => selectedIds.has(p.id));

  const handleToggleSelectAll = () => {
    if (isAllVisibleSelected) {
      // Deselect visible
      setSelectedIds(prev => {
        const next = new Set(prev);
        filteredPackages.forEach(p => next.delete(p.id));
        return next;
      });
    } else {
      // Select all visible
      setSelectedIds(prev => {
        const next = new Set(prev);
        filteredPackages.forEach(p => next.add(p.id));
        return next;
      });
    }
  };

  // Execution Handlers
  const handleInstallSingle = (id) => {
    if (isInstalling) return;
    onInstallDrivers?.([id], { createRestorePoint });
  };

  const handleInstallSelected = () => {
    if (isInstalling || selectedIds.size === 0) return;
    onInstallDrivers?.(Array.from(selectedIds), { createRestorePoint });
  };

  const renderIcon = (type) => {
    switch (type) {
      case 'terminal':
        return <Terminal className="w-4 h-4" />;
      case 'chip':
        return <Cpu className="w-4 h-4" />;
      case 'download':
      default:
        return <Download className="w-4 h-4" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-y-auto no-drag-region p-6 pt-5 select-none min-w-0">
      <div className="max-w-4xl w-full mx-auto flex flex-col gap-6 flex-1 min-w-0">
        
        {/* ========================================================= */}
        {/* TOP HEADER & SEARCH                                       */}
        {/* ========================================================= */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 leading-tight">
              Drivers
            </h1>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              {counts.all} packages · {counts.installed} installed · {counts.needAttention} need attention
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Search Input Box */}
            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search drivers"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-7 py-2 bg-white border border-slate-200/90 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-2xs transition-all"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Quick Refresh Status Button */}
            <button
              onClick={onScan}
              disabled={isScanning || isInstalling}
              title="Re-scan DriverStore"
              className="p-2 bg-white border border-slate-200/90 hover:bg-slate-50 active:scale-[0.98] rounded-xl text-slate-600 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={cn("w-3.5 h-3.5 text-slate-500", isScanning && "animate-spin text-emerald-600")} />
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* FILTER TABS / PILLS                                       */}
        {/* ========================================================= */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-200/60 rounded-xl w-fit">
          <button
            onClick={() => setActiveFilter('all')}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
              activeFilter === 'all'
                ? "bg-white text-slate-800 shadow-2xs"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            All · {counts.all}
          </button>
          
          <button
            onClick={() => setActiveFilter('installed')}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
              activeFilter === 'installed'
                ? "bg-white text-slate-800 shadow-2xs"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            Installed · {counts.installed}
          </button>

          <button
            onClick={() => setActiveFilter('updates')}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
              activeFilter === 'updates'
                ? "bg-white text-slate-800 shadow-2xs"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            Updates · {counts.updates}
          </button>

          <button
            onClick={() => setActiveFilter('not_installed')}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
              activeFilter === 'not_installed'
                ? "bg-white text-slate-800 shadow-2xs"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            Not installed · {counts.not_installed}
          </button>
        </div>

        {/* ========================================================= */}
        {/* DRIVERS LIST GROUPED BY CATEGORY                          */}
        {/* ========================================================= */}
        <div className="flex flex-col gap-5 flex-1 pb-16">
          {groupedCategories.length === 0 ? (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-10 text-center flex flex-col items-center justify-center gap-2 shadow-2xs my-4">
              <AlertCircle className="w-7 h-7 text-slate-400" />
              <h4 className="text-sm font-semibold text-slate-700">No matching driver packages found</h4>
              <p className="text-xs text-slate-400 max-w-sm">
                Try adjusting your search query or switching the filter tab.
              </p>
            </div>
          ) : (
            groupedCategories.map(([category, items]) => (
              <div key={category} className="flex flex-col gap-2.5">
                {/* Category Header */}
                <h3 className="text-[11px] font-bold tracking-wider text-slate-500 uppercase px-1">
                  {category}
                </h3>

                {/* Category Cards */}
                <div className="flex flex-col gap-2.5">
                  {items.map((item) => {
                    const isChecked = selectedIds.has(item.id);
                    const isCardInstalling = item.isThisInstalling;

                    return (
                      <div
                        key={item.id}
                        className={cn(
                          "bg-white rounded-2xl p-4 transition-all duration-150 shadow-2xs flex flex-col gap-3 relative",
                          isChecked 
                            ? "border-2 border-emerald-500 ring-1 ring-emerald-500/20" 
                            : "border border-slate-200/80 hover:border-slate-300"
                        )}
                      >
                        <div className="flex items-center justify-between gap-4">
                          
                          {/* Left: Checkbox + Icon + Details */}
                          <div className="flex items-center gap-3.5 min-w-0">
                            {/* Checkbox */}
                            <button
                              type="button"
                              onClick={() => handleToggleSelect(item.id)}
                              className={cn(
                                "w-5 h-5 rounded-md border flex items-center justify-center transition-all cursor-pointer shrink-0",
                                isChecked
                                  ? "bg-emerald-600 border-emerald-600 text-white shadow-2xs"
                                  : "border-slate-300 hover:border-slate-400 bg-white"
                              )}
                            >
                              {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </button>

                            {/* Icon Squircle */}
                            <div className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs",
                              item.iconBg
                            )}>
                              {renderIcon(item.iconType)}
                            </div>

                            {/* Title & Description */}
                            <div className="flex flex-col min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="text-[13px] font-bold text-slate-800 truncate">
                                  {item.title}
                                </h4>
                                {item.version && (
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    v{item.version}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 truncate">
                                {item.desc}
                              </p>
                            </div>
                          </div>

                          {/* Right: Mode Badge + Status Badge + Action Button */}
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
                              "text-xs font-medium px-3.5 py-1 rounded-full select-none",
                              item.status === 'installed' && "bg-emerald-100/80 text-emerald-800",
                              item.status === 'updates' && "bg-amber-100/80 text-amber-800",
                              item.status === 'not_installed' && "bg-slate-100 text-slate-600"
                            )}>
                              {item.statusLabel}
                            </span>

                            {/* Action Button */}
                            <button
                              onClick={() => handleInstallSingle(item.id)}
                              disabled={isInstalling}
                              className={cn(
                                "min-w-[84px] px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all active:scale-[0.98] cursor-pointer shadow-2xs flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed",
                                item.status === 'installed'
                                  ? "bg-white border border-slate-200/90 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                                  : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-700/20"
                              )}
                            >
                              {isCardInstalling ? (
                                <>
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                  <span>{item.progress > 0 ? `${item.progress}%` : 'Working...'}</span>
                                </>
                              ) : (
                                <span>{item.actionLabel}</span>
                              )}
                            </button>

                          </div>

                        </div>

                        {/* Inline progress bar when installing this specific driver */}
                        {isCardInstalling && (
                          <div className="mt-1 pt-2 border-t border-slate-100 flex flex-col gap-1.5 animate-fadeIn">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-500 font-mono truncate max-w-md">
                                {item.progressMessage || 'Installing package via Windows DriverStore...'}
                              </span>
                              <span className="text-emerald-600 font-bold font-mono">
                                {item.progress}%
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                                style={{ width: `${Math.max(item.progress, 5)}%` }}
                              />
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
      <div className="sticky bottom-0 left-0 right-0 mt-auto pt-2 pb-1 bg-gradient-to-t from-slate-50 via-slate-50/90 to-transparent">
        <div className="max-w-4xl mx-auto bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-3.5 px-5 shadow-lg flex items-center justify-between gap-4">
          
          {/* Left: Restore Point Toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={createRestorePoint}
              onClick={handleToggleRestorePoint}
              className={cn(
                "w-11 h-6 rounded-full transition-colors relative cursor-pointer focus:outline-none shrink-0",
                createRestorePoint ? "bg-emerald-600" : "bg-slate-300"
              )}
            >
              <span
                className={cn(
                  "w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform shadow-2xs",
                  createRestorePoint ? "left-[22px]" : "left-0.5"
                )}
              />
            </button>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-800 leading-tight">
                Create a restore point first
              </span>
              <span className="text-[11px] text-slate-400 leading-tight">
                You can roll back if a driver causes trouble
              </span>
            </div>
          </div>

          {/* Right: Selection Counter + Select All + Install Selected */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-slate-500 font-sans">
              {selectedIds.size} selected
            </span>

            <button
              onClick={handleToggleSelectAll}
              className="px-4 py-2 bg-white border border-slate-200/90 hover:bg-slate-50 active:scale-[0.98] text-slate-700 font-semibold rounded-xl text-xs shadow-2xs transition-all cursor-pointer"
            >
              {isAllVisibleSelected ? "Deselect all" : "Select all"}
            </button>

            <button
              onClick={handleInstallSelected}
              disabled={selectedIds.size === 0 || isInstalling}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-semibold rounded-xl text-xs shadow-sm shadow-emerald-700/20 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {isInstalling ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
              ) : null}
              <span>Install selected ({selectedIds.size})</span>
            </button>
          </div>

        </div>
      </div>

    </div>
  );
}
