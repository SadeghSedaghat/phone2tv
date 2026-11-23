import React from 'react';
import { Tv, Smartphone, Laptop, CheckCircle2, Circle } from 'lucide-react';

export function DeviceBadge({ devices = [], currentDeviceType = 'mobile', isTvMode = false }) {
  const tvCount = devices.filter(d => d.deviceType === 'tv').length;
  const mobileCount = devices.filter(d => d.deviceType === 'mobile').length;
  const otherCount = devices.filter(d => d.deviceType !== 'tv' && d.deviceType !== 'mobile').length;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* TV status */}
      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
        tvCount > 0 
          ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400' 
          : 'bg-zinc-900 border-zinc-800 text-zinc-500'
      }`}>
        <Tv className="w-3.5 h-3.5" />
        <span>{tvCount > 0 ? (tvCount > 1 ? `${tvCount} TVs` : 'TV Online') : 'TV Offline'}</span>
        <span className={`w-2 h-2 rounded-full ${tvCount > 0 ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'}`} />
      </div>

      {/* Mobile status */}
      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
        mobileCount > 0 
          ? 'bg-indigo-950/40 border-indigo-500/30 text-indigo-400' 
          : 'bg-zinc-900 border-zinc-800 text-zinc-500'
      }`}>
        <Smartphone className="w-3.5 h-3.5" />
        <span>{mobileCount > 0 ? (mobileCount > 1 ? `${mobileCount} Phones` : 'Phone Online') : 'No Phone'}</span>
        <span className={`w-2 h-2 rounded-full ${mobileCount > 0 ? 'bg-indigo-400' : 'bg-zinc-600'}`} />
      </div>

      {/* Other devices (Desktop, tablet) if any */}
      {otherCount > 0 && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-zinc-800 bg-zinc-900 text-xs font-medium text-zinc-400">
          <Laptop className="w-3.5 h-3.5" />
          <span>{otherCount} Other</span>
        </div>
      )}
    </div>
  );
}
