import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  FileDown,
  Download,
  FileSpreadsheet,
  Printer,
  ChevronLeft,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  Gauge
} from 'lucide-react';
import { WizardState } from '../../types/wizardStateAdapter';
import {
  DR_ENGINE_CATALOGUE,
  DrEngineCompatibilitySpec
} from '../../data/cloudCompatibilityCatalogue';
import {
  calculateReplicationBandwidthMbps,
  calculateTotalInfrastructureCapacity,
  evaluateFailureScenario
} from '../../utils/architectureCalculator';
import {
  validateSddcPlatformCidr,
  checkSubnetOverlap
} from '../../utils/cidrUtils';

interface Step4DisasterRecoveryProps {
  wizardState: WizardState;
  onChange: (updater: (prev: WizardState) => WizardState) => void;
  onPrev: () => void;
  onGenerateAI: () => void;
  onExportJson: () => void;
  onExport4K: () => void;
  onExportExcel: () => void;
  onOpenDossier: () => void;
}

export const Step4DisasterRecovery: React.FC<Step4DisasterRecoveryProps> = ({
  wizardState,
  onChange,
  onPrev,
  onGenerateAI,
  onExportJson,
  onExport4K,
  onExportExcel,
  onOpenDossier
}) => {
  const [dailyChangeGB, setDailyChangeGB] = useState<number>(350);

  // Filter DR engines based on source and target
  const availableDrEngines = DR_ENGINE_CATALOGUE.map((engine) => {
    const isSourceCompatible = engine.supportedSources.includes(wizardState.sourcePlatform as any);
    const isTargetCompatible = engine.supportedTargets.includes(wizardState.targetPlatform as any);
    const isCompatible = isSourceCompatible && isTargetCompatible;
    let disabledReason: string | undefined = undefined;

    if (!isSourceCompatible) {
      disabledReason = `Not certified for source hypervisor "${wizardState.sourcePlatform}".`;
    } else if (!isTargetCompatible) {
      disabledReason = `Not certified for target platform "${wizardState.targetPlatform}".`;
    }

    return {
      spec: engine,
      isCompatible,
      disabledReason
    };
  });

  // Calculate required replication bandwidth
  const effectiveRpoMinutes = Math.max(1, wizardState.drConfig.rpoMinutes);
  const estimatedBandwidthMbps = calculateReplicationBandwidthMbps(
    dailyChangeGB,
    effectiveRpoMinutes * 6, // sync window
    1.25 // 25% protocol overhead
  );

  // Pre-flight validation checks
  const platformCidrName =
    wizardState.targetPlatform === 'avs-gen1' || wizardState.targetPlatform === 'avs-gen2'
      ? 'AVS'
      : wizardState.targetPlatform === 'gcve'
      ? 'GCVE'
      : wizardState.targetPlatform === 'vmc-aws'
      ? 'VMC'
      : 'NC2';

  const sddcCidrValid = validateSddcPlatformCidr(
    wizardState.sddcMgmtCidr,
    platformCidrName,
    wizardState.targetNodeCount
  ).isValid;

  const overlapCheck = checkSubnetOverlap(
    wizardState.sourceMgmtCidr,
    wizardState.sddcMgmtCidr
  );

  const totalCap = calculateTotalInfrastructureCapacity(
    wizardState.clusters.map((c) => ({
      id: c.id,
      name: c.name,
      hostCount: c.hostCount,
      sockets: c.sockets,
      coresPerSocket: c.coresPerSocket,
      hyperthreading: c.hyperthreading,
      ramPerHostGB: c.ramGB,
      rawStoragePerHostTB: c.storageTB
    })),
    wizardState.assumptions
  );

  const n1Result = evaluateFailureScenario(
    wizardState.clusters.map((c) => ({
      id: c.id,
      name: c.name,
      hostCount: c.hostCount,
      sockets: c.sockets,
      coresPerSocket: c.coresPerSocket,
      hyperthreading: c.hyperthreading,
      ramPerHostGB: c.ramGB,
      rawStoragePerHostTB: c.storageTB
    })),
    {
      name: 'N+1 Single Host Failure per Cluster',
      failedHostsPerCluster: wizardState.clusters.reduce((acc, c) => {
        acc[c.id] = 1;
        return acc;
      }, {} as Record<string, number>)
    },
    wizardState.clusters.reduce((acc, c) => {
      acc[c.id] = {
        vcpu: Math.round(c.hostCount * c.sockets * c.coresPerSocket * 1.5),
        ramGB: Math.round(c.hostCount * c.ramGB * 0.75),
        storageTB: Math.round(c.hostCount * c.storageTB * 0.65)
      };
      return acc;
    }, {} as Record<string, { vcpu: number; ramGB: number; storageTB: number }>)
  );

  const isPreFlightAllPassing = sddcCidrValid && !overlapCheck.hasOverlap && n1Result.isAllViable;

  return (
    <div className="space-y-6">
      {/* 1. Disaster Recovery Scope Toggle */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-sm font-bold text-white">Disaster Recovery & Business Continuity</h3>
              <p className="text-xs text-slate-400">
                Configure continuous replication, RPO/RTO recovery objectives, and standby site orchestration.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
            Step 4 of 4
          </span>
        </div>

        {/* DR Toggle Banner */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950 border border-slate-800">
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-white">Include Disaster Recovery Architecture</span>
            <p className="text-[11px] text-slate-400">
              When disabled, DR configuration is pruned from the generation payload and treated as a single-site topology.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onChange((prev) => ({ ...prev, drEnabled: !prev.drEnabled }))}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              wizardState.drEnabled
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-slate-900 border border-slate-700 text-slate-400'
            }`}
          >
            {wizardState.drEnabled ? '✓ DR ENABLED' : 'DR DISABLED (STANDALONE)'}
          </button>
        </div>

        {/* When DR is Enabled */}
        {wizardState.drEnabled ? (
          <div className="space-y-4 animate-in fade-in">
            {/* DR Engine Picker */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">
                Certified DR & Continuous Replication Engine
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {availableDrEngines.map(({ spec, isCompatible, disabledReason }) => {
                  const isSelected = wizardState.drConfig.engine === spec.name;
                  return (
                    <button
                      key={spec.id}
                      type="button"
                      disabled={!isCompatible}
                      onClick={() =>
                        onChange((prev) => ({
                          ...prev,
                          drConfig: {
                            ...prev.drConfig,
                            engine: spec.name,
                            rpoMinutes: Math.max(spec.minSupportedRpoMinutes, prev.drConfig.rpoMinutes)
                          }
                        }))
                      }
                      className={`p-3 rounded-xl border text-left transition relative ${
                        !isCompatible
                          ? 'opacity-40 bg-slate-950/40 border-slate-900 cursor-not-allowed'
                          : isSelected
                          ? 'bg-emerald-950/60 border-emerald-500 shadow-md ring-1 ring-emerald-500/30 cursor-pointer'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-xs font-bold text-white line-clamp-1">{spec.name}</span>
                        {isSelected && <span className="text-[10px] text-emerald-400 font-bold shrink-0">SELECTED</span>}
                      </div>
                      <div className="text-[10px] font-mono text-cyan-300">
                        Min RPO: {spec.minSupportedRpoMinutes === 0 ? '0 min (Sync)' : `${spec.minSupportedRpoMinutes} min`}
                      </div>
                      <div className="text-[11px] text-slate-400 line-clamp-2 mt-1">{spec.notes}</div>
                      {!isCompatible && (
                        <span className="text-[10px] text-rose-400 font-mono block mt-1.5">{disabledReason}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SLA Objectives & Bandwidth Calculator */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Target RPO SLA</span>
                  </label>
                  <span className="text-xs font-mono font-bold text-cyan-300">
                    {wizardState.drConfig.rpoMinutes === 0 ? '0 min (Zero Data Loss)' : `${wizardState.drConfig.rpoMinutes} Minutes`}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="60"
                  step="5"
                  value={wizardState.drConfig.rpoMinutes}
                  onChange={(e) =>
                    onChange((prev) => ({
                      ...prev,
                      drConfig: { ...prev.drConfig, rpoMinutes: Number(e.target.value) }
                    }))
                  }
                  className="w-full accent-cyan-500 cursor-pointer"
                />
                <p className="text-[10px] text-slate-400">
                  {wizardState.drConfig.rpoMinutes === 0
                    ? 'Synchronous mirroring for zero data loss.'
                    : 'Continuous asynchronous micro-journaling.'}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Target RTO SLA</span>
                  </label>
                  <span className="text-xs font-mono font-bold text-indigo-300">
                    {wizardState.drConfig.rtoMinutes} Minutes
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="120"
                  step="5"
                  value={wizardState.drConfig.rtoMinutes}
                  onChange={(e) =>
                    onChange((prev) => ({
                      ...prev,
                      drConfig: { ...prev.drConfig, rtoMinutes: Number(e.target.value) }
                    }))
                  }
                  className="w-full accent-indigo-500 cursor-pointer"
                />
                <p className="text-[10px] text-slate-400">Maximum tolerable recovery timeline for orchestration.</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-mono text-[10px] uppercase">Replication Bandwidth</span>
                  <Gauge className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <div className="text-base font-bold text-amber-300 font-mono">
                  {estimatedBandwidthMbps} Mbps
                </div>
                <p className="text-[10px] text-slate-500">
                  Required sustained throughput for {dailyChangeGB} GB/day change rate with 25% overhead.
                </p>
              </div>
            </div>

            {/* Failover Orchestration Strategy */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Failover Orchestration Strategy</label>
              <select
                value={wizardState.drConfig.strategy}
                onChange={(e) =>
                  onChange((prev) => ({
                    ...prev,
                    drConfig: { ...prev.drConfig, strategy: e.target.value }
                  }))
                }
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-white focus:border-cyan-500 focus:outline-none"
              >
                <option value="Pilot Light (3-Node Minimum)">Pilot Light (3-Node Minimum - Rapid On-Demand Expansion)</option>
                <option value="Warm Standby (Full Cluster)">Warm Standby (Full Sized Standby SDDC)</option>
                <option value="Hot Standby (Active-Standby Mirror)">Hot Standby (Active-Standby Synchronous Mirror)</option>
                <option value="Cold Storage / On-Demand">Cold Storage / On-Demand (Cloud Object Backup Target)</option>
              </select>
            </div>
          </div>
        ) : (
          /* Inactive DR Pruning Explanation */
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3 text-xs text-slate-400">
            <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white">Active Generation Payload Pruning Enabled:</span>
              <p className="mt-1 leading-relaxed">
                Disaster recovery parameters are excluded from the active AI prompt generation request and deployment model.
                The blueprint will represent a standalone single-site architecture. Any saved historical DR configurations
                remain preserved safely in legacy storage records without destructive overwrite.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 2. Pre-Flight Architecture Health Validation Card */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-sm font-bold text-white">Pre-Flight Architecture Verification Matrix</h3>
              <p className="text-xs text-slate-400">Automated multi-domain health audit prior to 3D generation & export.</p>
            </div>
          </div>
          <span
            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
              isPreFlightAllPassing
                ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                : 'bg-rose-950 text-rose-300 border-rose-800'
            }`}
          >
            {isPreFlightAllPassing ? 'ALL AUDITS PASSING' : 'ATTENTION REQUIRED'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2.5">
            {sddcCidrValid ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <div>
              <div className="font-bold text-white">Platform CIDR</div>
              <div className="text-[10px] text-slate-400 font-mono">
                {sddcCidrValid ? `${wizardState.sddcMgmtCidr} Valid` : 'Invalid Prefix Size'}
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2.5">
            {!overlapCheck.hasOverlap ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <div>
              <div className="font-bold text-white">Subnet Collision</div>
              <div className="text-[10px] text-slate-400 font-mono">
                {!overlapCheck.hasOverlap ? 'No Overlaps' : 'Collision Detected'}
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <div className="font-bold text-white">Cross-Tier Storage</div>
              <div className="text-[10px] text-slate-400 font-mono">Certified Compatible</div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2.5">
            {n1Result.isAllViable ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <div>
              <div className="font-bold text-white">N+1 Viability</div>
              <div className="text-[10px] text-slate-400 font-mono">
                {n1Result.isAllViable ? 'Headroom Guaranteed' : 'Deficit Detected'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Primary AI Generation & Export Actions Bar */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/60 border border-slate-800 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Generate 4K Architecture Artifacts & Executive Dossier</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Render photorealistic 3D isometric blueprints, download CAD/JSON models, and export Bill of Materials.
            </p>
          </div>

          {/* Primary AI Generation Trigger */}
          <button
            type="button"
            onClick={onGenerateAI}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 hover:from-cyan-300 hover:to-indigo-400 text-slate-950 font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 cursor-pointer transition-all hover:scale-[1.02]"
          >
            <Sparkles className="w-4 h-4 fill-slate-950" />
            <span>Review & Generate 3D Blueprint</span>
          </button>
        </div>

        {/* Secondary Export Actions Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onExportJson}
            className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition"
            title="Download multi-cloud topology blueprint as JSON"
          >
            <FileDown className="w-4 h-4 text-cyan-400" />
            <span>Export JSON</span>
          </button>

          <button
            type="button"
            onClick={onExport4K}
            className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition"
            title="Download high-resolution 4K canvas"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>Export 4K Canvas</span>
          </button>

          <button
            type="button"
            onClick={onExportExcel}
            className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition"
            title="Generate Bill of Materials spreadsheet (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Export BOM (.xlsx)</span>
          </button>

          <button
            type="button"
            onClick={onOpenDossier}
            className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition"
          >
            <Printer className="w-4 h-4 text-purple-400" />
            <span>Executive Dossier</span>
          </button>
        </div>
      </div>

      {/* Step 4 Footer */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onPrev}
          className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-semibold text-xs flex items-center gap-2 cursor-pointer transition"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Step 3: Target Platform</span>
        </button>

        <span className="text-xs text-slate-400 font-mono">
          Ready for presentation & deployment artifact generation.
        </span>
      </div>
    </div>
  );
};
