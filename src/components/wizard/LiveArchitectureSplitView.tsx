import React from 'react';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  Server,
  Cpu,
  Database,
  ShieldCheck
} from 'lucide-react';

interface LiveArchitectureMetrics {
  totalHosts: number;
  totalCores: number;
  totalLogicalThreads: number;
  totalUsableRamGB: number;
  totalUsableStorageTB: number;
  targetSku: string;
  targetNodes: number;
  drSla: string;
  n1Viable: boolean;
  platformName: string;
}

interface LiveArchitectureSplitViewProps {
  layoutMode: 'split' | 'form-only' | 'canvas-only';
  leftPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  metrics: LiveArchitectureMetrics;
}

export const LiveArchitectureSplitView: React.FC<LiveArchitectureSplitViewProps> = ({
  layoutMode,
  leftPanel,
  rightPanel,
  metrics
}) => {
  return (
    <div className="space-y-4">
      {/* Real-Time Live Architecture Metrics Header Strip */}
      <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl overflow-x-auto">
        <div className="flex items-center justify-between min-w-[760px] gap-4">
          <div className="flex items-center gap-2 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Live Architecture Model
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
              {metrics.platformName}
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-400">Total Hosts:</span>
              <span className="font-bold text-white">{metrics.totalHosts}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-slate-400">Cores / Threads:</span>
              <span className="font-bold text-cyan-300">
                {metrics.totalCores}p / {metrics.totalLogicalThreads}t
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-slate-400">Net RAM:</span>
              <span className="font-bold text-emerald-300">{metrics.totalUsableRamGB} GB</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Storage:</span>
              <span className="font-bold text-amber-300">{metrics.totalUsableStorageTB} TB</span>
            </div>

            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-slate-400">DR SLA:</span>
              <span className="font-bold text-indigo-300">{metrics.drSla}</span>
            </div>

            <div className="flex items-center gap-1">
              {metrics.n1Viable ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                  <CheckCircle2 className="w-3 h-3" />
                  N+1 READY
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800">
                  <AlertTriangle className="w-3 h-3" />
                  N+1 DEFICIT
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Responsive Split Layout */}
      {layoutMode === 'form-only' ? (
        <div className="w-full">{leftPanel}</div>
      ) : layoutMode === 'canvas-only' ? (
        <div className="w-full">{rightPanel}</div>
      ) : (
        /* Split View: Form on Left, Live Canvas on Right */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column: Active Step Form */}
          <div className="lg:col-span-7 xl:col-span-7 space-y-4">{leftPanel}</div>

          {/* Right Column: Live Architecture Canvas & Topology Viewport */}
          <div className="lg:col-span-5 xl:col-span-5 lg:sticky lg:top-4 space-y-4">
            {rightPanel}
          </div>
        </div>
      )}
    </div>
  );
};
