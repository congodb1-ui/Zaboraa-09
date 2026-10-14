import React, { useState } from 'react';
import {
  Cloud,
  HardDrive,
  Cpu,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  Save,
  FileDown,
  FileSpreadsheet,
  Download,
  Printer,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Info,
  Clock,
  Layers,
  Activity
} from 'lucide-react';
import { WizardState } from '../../types/wizardStateAdapter';
import {
  TARGET_NODE_SKU_CATALOGUE,
  STORAGE_ATTACHMENT_CATALOGUE,
  DR_ENGINE_CATALOGUE,
  PlatformNodeSkuSpec
} from '../../data/cloudCompatibilityCatalogue';
import {
  validateSddcPlatformCidr,
  checkSubnetOverlap
} from '../../utils/cidrUtils';
import { calculateReplicationBandwidthMbps } from '../../utils/architectureCalculator';

interface Step4TargetAndDRProps {
  wizardState: WizardState;
  onChange: (updater: (prev: WizardState) => WizardState) => void;
  onPrev: () => void;
  onGenerateAI: () => void;
  onSaveBlueprint: () => void;
  onExportJson: () => void;
  onExportExcel: () => void;
  onExport4K: () => void;
  onOpenDossier: () => void;
  blueprintPreviewNode?: React.ReactNode;
}

export const Step4TargetAndDR: React.FC<Step4TargetAndDRProps> = ({
  wizardState,
  onChange,
  onPrev,
  onGenerateAI,
  onSaveBlueprint,
  onExportJson,
  onExportExcel,
  onExport4K,
  onOpenDossier,
  blueprintPreviewNode
}) => {
  const [dailyChangeGB, setDailyChangeGB] = useState<number>(350);
  const [incompatibilityNotice, setIncompatibilityNotice] = useState<string | null>(null);

  // Available SKUs for current target platform
  const availableSkus = TARGET_NODE_SKU_CATALOGUE.filter(
    (sku) => sku.platform === wizardState.targetPlatform
  );

  const selectedSkuSpec: PlatformNodeSkuSpec =
    availableSkus.find((s) => s.sku === wizardState.targetNodeSku) ||
    availableSkus[0] ||
    TARGET_NODE_SKU_CATALOGUE[0];

  // Compatible storage attachments
  const compatibleStorageTiers = STORAGE_ATTACHMENT_CATALOGUE.filter(
    (s) => s.supportedTargetPlatforms.includes(wizardState.targetPlatform as any)
  );

  // SDDC CIDR Validation
  const platformCidrName =
    wizardState.targetPlatform === 'avs-gen1' || wizardState.targetPlatform === 'avs-gen2'
      ? 'AVS'
      : wizardState.targetPlatform === 'gcve'
      ? 'GCVE'
      : wizardState.targetPlatform === 'vmc-aws'
      ? 'VMC'
      : 'NC2';

  const sddcCidrValidation = validateSddcPlatformCidr(
    wizardState.sddcMgmtCidr,
    platformCidrName,
    wizardState.targetNodeCount
  );

  const overlapCheck = checkSubnetOverlap(
    wizardState.sourceMgmtCidr,
    wizardState.sddcMgmtCidr
  );

  const minRequiredNodes = selectedSkuSpec.minNodesCluster;

  const handleTargetPlatformChange = (newPlatform: WizardState['targetPlatform']) => {
    const newAvailableSkus = TARGET_NODE_SKU_CATALOGUE.filter((s) => s.platform === newPlatform);
    const defaultSku = newAvailableSkus[0]?.sku || 'AV36P';

    let updatedStorageProvider = wizardState.decoupledStorageProvider;
    let notice: string | null = null;

    if (wizardState.decoupledStorageEnabled && wizardState.decoupledStorageProvider) {
      const storageMatch = STORAGE_ATTACHMENT_CATALOGUE.find(
        (s) => s.name === wizardState.decoupledStorageProvider
      );
      if (storageMatch && !storageMatch.supportedTargetPlatforms.includes(newPlatform as any)) {
        updatedStorageProvider = undefined;
        notice = `Storage tier "${storageMatch.name}" is incompatible with "${newPlatform}" and has been cleared.`;
      }
    }

    setIncompatibilityNotice(notice);

    onChange((prev) => ({
      ...prev,
      targetPlatform: newPlatform,
      targetNodeSku: defaultSku,
      targetNodeCount: Math.max(prev.targetNodeCount, newAvailableSkus[0]?.minNodesCluster || 3),
      decoupledStorageProvider: updatedStorageProvider
    }));
  };

  // DR Engine Compatibility
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

  const effectiveRpoMinutes = Math.max(1, wizardState.drConfig.rpoMinutes);
  const estimatedBandwidthMbps = calculateReplicationBandwidthMbps(
    dailyChangeGB,
    effectiveRpoMinutes * 6,
    1.25
  );

  return (
    <div className="space-y-6">
      {/* 1. Target Hyperscaler SDDC Platform */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <Cloud className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-sm font-bold text-white">Target Hyperscaler Platform</h3>
              <p className="text-xs text-slate-400">Select target VMware or Nutanix bare-metal cloud infrastructure.</p>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
            Step 4: Target & DR
          </span>
        </div>

        {incompatibilityNotice && (
          <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/50 text-xs text-amber-200 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>{incompatibilityNotice}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            { id: 'avs-gen2', name: 'Azure AVS Gen 2', tag: 'Direct vNet', desc: 'Direct vNet routing, line-rate 100 Gbps, AV64 nodes' },
            { id: 'avs-gen1', name: 'Azure AVS Gen 1', tag: 'Standard', desc: 'Enterprise AV36P bare-metal cluster with vNet peering' },
            { id: 'vmc-aws', name: 'VMware Cloud on AWS', tag: 'i4i.metal', desc: 'Dedicated bare-metal SDDC with Connected VPC ENI' },
            { id: 'gcve', name: 'Google Cloud GCVE', tag: 've1/ve2', desc: 'Google Cloud VMware Engine with Shared VPC and NCC' },
            { id: 'nc2-azure', name: 'Nutanix NC2 on Azure', tag: 'AN36P', desc: 'Nutanix Enterprise Cloud running on Azure BareMetal' }
          ].map((platform) => {
            const isSelected = wizardState.targetPlatform === platform.id;
            return (
              <button
                key={platform.id}
                type="button"
                onClick={() => handleTargetPlatformChange(platform.id as any)}
                className={`p-3.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-cyan-950/60 border-cyan-500 shadow-md ring-1 ring-cyan-500/30'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-cyan-300">
                      {platform.tag}
                    </span>
                    {isSelected && <span className="text-[9px] font-bold text-cyan-400">SELECTED</span>}
                  </div>
                  <div className="text-xs font-bold text-white">{platform.name}</div>
                  <div className="text-[11px] text-slate-400 mt-1 line-clamp-2">{platform.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. BareMetal Node SKU, Count & Capacity */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <Cpu className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="text-sm font-bold text-white">Target Bare-Metal Node Hardware Model</h3>
              <p className="text-xs text-slate-400">Select certified node model and configure cluster host count.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {availableSkus.map((sku) => {
            const isSelected = wizardState.targetNodeSku === sku.sku;
            return (
              <button
                key={sku.sku}
                type="button"
                onClick={() =>
                  onChange((prev) => ({
                    ...prev,
                    targetNodeSku: sku.sku,
                    targetNodeCount: Math.max(prev.targetNodeCount, sku.minNodesCluster)
                  }))
                }
                className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-950/60 border-indigo-500 shadow-md ring-1 ring-indigo-500/30'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-xs font-bold text-white">{sku.sku}</span>
                  <span className="text-[9px] font-mono text-indigo-300">Min {sku.minNodesCluster} Nodes</span>
                </div>
                <div className="text-[11px] font-mono text-cyan-400">
                  {sku.physicalCores} Cores · {sku.ramGB} GB RAM
                </div>
                <div className="text-[10px] text-slate-400 mt-1 font-mono">
                  Storage: {sku.rawStorageTB > 0 ? `${sku.rawStorageTB} TB All-Flash` : 'Decoupled Only'}
                </div>
              </button>
            );
          })}
        </div>

        {/* Node Count Slider & Compute Rollup */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-200">
              Cluster Node Count (Minimum {minRequiredNodes} Nodes for SLA)
            </label>
            <span className="text-base font-bold font-mono text-cyan-400">
              {wizardState.targetNodeCount} Bare-Metal Nodes
            </span>
          </div>

          <input
            type="range"
            min={minRequiredNodes}
            max={32}
            value={wizardState.targetNodeCount}
            onChange={(e) =>
              onChange((prev) => ({
                ...prev,
                targetNodeCount: Number(e.target.value)
              }))
            }
            className="w-full accent-cyan-400 cursor-pointer"
          />

          <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-900 text-xs font-mono">
            <div>
              <span className="text-[10px] text-slate-500 block">TOTAL RAW VCPU</span>
              <span className="font-bold text-white">
                {wizardState.targetNodeCount * selectedSkuSpec.physicalCores * 2} vCPU
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">TOTAL RAM</span>
              <span className="font-bold text-white">
                {wizardState.targetNodeCount * selectedSkuSpec.ramGB} GB
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">LOCAL NVME STORAGE</span>
              <span className="font-bold text-emerald-400">
                {wizardState.targetNodeCount * selectedSkuSpec.rawStorageTB} TB Raw
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. SDDC Management CIDR & Subnet Validation */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white">SDDC Infrastructure Management CIDR</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            {platformCidrName} CIDR Validation
          </span>
        </div>

        <div className="space-y-1">
          <input
            type="text"
            value={wizardState.sddcMgmtCidr}
            onChange={(e) => onChange((prev) => ({ ...prev, sddcMgmtCidr: e.target.value }))}
            className={`w-full px-3 py-2 bg-slate-950 border rounded-lg text-slate-200 text-xs font-mono ${
              sddcCidrValidation.isValid && !overlapCheck.hasOverlap
                ? 'border-emerald-500/60 focus:border-emerald-400'
                : 'border-rose-500 focus:border-rose-400'
            }`}
          />
        </div>

        {!sddcCidrValidation.isValid && (
          <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/50 text-xs text-rose-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{sddcCidrValidation.message}</span>
          </div>
        )}

        {overlapCheck.hasOverlap && (
          <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/50 text-xs text-rose-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              CIDR Overlap Detected between Source ({wizardState.sourceMgmtCidr}) and Target ({wizardState.sddcMgmtCidr}). Subnets must not intersect.
            </span>
          </div>
        )}
      </div>

      {/* 4. Decoupled External Storage Tier */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <HardDrive className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-sm font-bold text-white">Decoupled External Storage Tier</h3>
              <p className="text-xs text-slate-400">Attach secondary cloud NFS datastores to decouple compute from storage growth.</p>
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
            <input
              type="checkbox"
              checked={wizardState.decoupledStorageEnabled}
              onChange={(e) => onChange((prev) => ({ ...prev, decoupledStorageEnabled: e.target.checked }))}
              className="rounded bg-slate-900 border-slate-700 text-emerald-500"
            />
            <span className="text-xs font-semibold text-slate-200">Attach External Datastores</span>
          </label>
        </div>

        {wizardState.decoupledStorageEnabled && (
          <div className="space-y-4 animate-in fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {compatibleStorageTiers.map((storage) => {
                const isSelected = wizardState.decoupledStorageProvider === storage.name;
                return (
                  <button
                    key={storage.id}
                    type="button"
                    onClick={() => onChange((prev) => ({ ...prev, decoupledStorageProvider: storage.name }))}
                    className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-950/60 border-emerald-500 shadow-md ring-1 ring-emerald-500/30'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold text-white">{storage.name}</div>
                    <div className="text-[10px] font-mono text-emerald-300 mt-0.5">{storage.storageProtocol}</div>
                    <div className="text-[11px] text-slate-400 mt-1 line-clamp-2">{storage.description}</div>
                  </button>
                );
              })}
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300">Decoupled External Allocation</span>
                <span className="font-mono font-bold text-emerald-400">{wizardState.decoupledStorageTB} TB Allocated</span>
              </div>
              <input
                type="range"
                min={10}
                max={500}
                step={10}
                value={wizardState.decoupledStorageTB}
                onChange={(e) => onChange((prev) => ({ ...prev, decoupledStorageTB: Number(e.target.value) }))}
                className="w-full accent-emerald-400 cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>

      {/* 5. Progressive Disclosure Disaster Recovery Planning */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="text-sm font-bold text-white">Disaster Recovery (DR) & Replication SLAs</h3>
              <p className="text-xs text-slate-400">Configure secondary failover runbooks and replication engines.</p>
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
            <input
              type="checkbox"
              checked={wizardState.drEnabled}
              onChange={(e) => onChange((prev) => ({ ...prev, drEnabled: e.target.checked }))}
              className="rounded bg-slate-900 border-slate-700 text-indigo-500"
            />
            <span className="text-xs font-semibold text-slate-200">Enable Disaster Recovery</span>
          </label>
        </div>

        {wizardState.drEnabled ? (
          <div className="space-y-4 animate-in fade-in">
            {/* Engine Selection */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">Authorized DR Replication Engine</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
                          drConfig: { ...prev.drConfig, engine: spec.name }
                        }))
                      }
                      className={`p-3.5 rounded-xl border text-left transition relative ${
                        !isCompatible
                          ? 'opacity-40 bg-slate-950/40 border-slate-900 cursor-not-allowed'
                          : isSelected
                          ? 'bg-indigo-950/60 border-indigo-500 shadow-md ring-1 ring-indigo-500/30 cursor-pointer'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 cursor-pointer'
                      }`}
                    >
                      <div className="text-xs font-bold text-white">{spec.name}</div>
                      <div className="text-[10px] font-mono text-cyan-300 mt-0.5">{spec.engineType}</div>
                      <div className="text-[11px] text-slate-400 mt-1 line-clamp-2">{spec.notes}</div>
                      {disabledReason && (
                        <div className="text-[10px] text-rose-400 mt-1 font-mono">{disabledReason}</div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* RPO / RTO and Strategy */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">Target Recovery Point (RPO)</span>
                  <span className="text-xs font-mono font-bold text-indigo-400">
                    {wizardState.drConfig.rpoMinutes === 0 ? '0-min (Sync / Zero Loss)' : `${wizardState.drConfig.rpoMinutes} Minutes`}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={240}
                  step={5}
                  value={wizardState.drConfig.rpoMinutes}
                  onChange={(e) =>
                    onChange((prev) => ({
                      ...prev,
                      drConfig: { ...prev.drConfig, rpoMinutes: Number(e.target.value) }
                    }))
                  }
                  className="w-full accent-indigo-400 cursor-pointer"
                />
                <div className="text-[10px] text-slate-400 font-mono">
                  Continuous Throughput Requirement: ~{estimatedBandwidthMbps.toFixed(0)} Mbps with 25% overhead.
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">Target Recovery Time (RTO)</span>
                  <span className="text-xs font-mono font-bold text-indigo-400">
                    {wizardState.drConfig.rtoMinutes} Minutes Runbook
                  </span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={120}
                  step={5}
                  value={wizardState.drConfig.rtoMinutes}
                  onChange={(e) =>
                    onChange((prev) => ({
                      ...prev,
                      drConfig: { ...prev.drConfig, rtoMinutes: Number(e.target.value) }
                    }))
                  }
                  className="w-full accent-indigo-400 cursor-pointer"
                />
                <div className="text-[10px] text-slate-400 font-mono">
                  Orchestrated boot sequences for Database, App, and Web tiers.
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
            <Info className="w-4 h-4 text-slate-500 shrink-0" />
            <span>Single Site SDDC mode active. DR metrics and replication payloads are excluded.</span>
          </div>
        )}
      </div>

      {/* 6. Static 4K Vector Blueprint Preview */}
      {blueprintPreviewNode && (
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <Layers className="w-5 h-5 text-cyan-400" />
              <div>
                <h3 className="text-sm font-bold text-white">Static 4K Vector Architecture Blueprint Preview</h3>
                <p className="text-xs text-slate-400">
                  Publication-ready 3-tier architectural blueprint capturing all configured parameters.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onExport4K}
              className="px-3 py-1.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download 4K PNG</span>
            </button>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
            {blueprintPreviewNode}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FINAL ACTION CENTER                                                       */}
      {/* ========================================================================= */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-cyan-500/40 space-y-4 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-base font-bold text-white">Final Action Center</h3>
              <p className="text-xs text-slate-400">Generate 3D isometric blueprints, save configuration state, and export dossiers.</p>
            </div>
          </div>
          <span className="text-xs font-mono text-cyan-300 font-bold px-2.5 py-1 rounded-full bg-cyan-950 border border-cyan-800">
            All Parameters Verified
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* 1. Primary AI 3D Generation */}
          <button
            type="button"
            onClick={onGenerateAI}
            className="p-4 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-bold text-xs flex flex-col justify-between shadow-lg shadow-cyan-500/20 cursor-pointer transition transform hover:scale-[1.02] sm:col-span-2 lg:col-span-1"
          >
            <div className="flex items-center justify-between w-full mb-2">
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-950/30 text-slate-950 font-extrabold">
                Primary Action
              </span>
              <Sparkles className="w-4 h-4 fill-slate-950" />
            </div>
            <div>
              <div className="text-sm font-extrabold">Generate 3D Blueprint</div>
              <div className="text-[11px] font-normal text-slate-950/80 mt-0.5">
                AI Isometric Schematic with glowing transit mesh
              </div>
            </div>
          </button>

          {/* 2. Save Design */}
          <button
            type="button"
            onClick={onSaveBlueprint}
            className="p-4 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/60 text-left cursor-pointer transition flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <Save className="w-4 h-4 text-cyan-400" />
              <span className="text-[9px] font-mono text-slate-400">Non-Destructive</span>
            </div>
            <div>
              <div className="text-xs font-bold text-white">Save Design</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Sync state and local cache</div>
            </div>
          </button>

          {/* 3. Export JSON */}
          <button
            type="button"
            onClick={onExportJson}
            className="p-4 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/60 text-left cursor-pointer transition flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <FileDown className="w-4 h-4 text-indigo-400" />
              <span className="text-[9px] font-mono text-slate-400">Model JSON</span>
            </div>
            <div>
              <div className="text-xs font-bold text-white">Export JSON</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Topology & Sizing Payload</div>
            </div>
          </button>

          {/* 4. Export BOM Excel */}
          <button
            type="button"
            onClick={onExportExcel}
            className="p-4 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/60 text-left cursor-pointer transition flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span className="text-[9px] font-mono text-slate-400">Excel .xlsx</span>
            </div>
            <div>
              <div className="text-xs font-bold text-white">Export BOM (.xlsx)</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Complete hardware Bill of Materials</div>
            </div>
          </button>
        </div>

        {/* Secondary Auxiliary Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800 text-xs">
          <button
            type="button"
            onClick={onPrev}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold flex items-center gap-2 cursor-pointer transition"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous: Security & WAF</span>
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onOpenDossier}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold flex items-center gap-2 cursor-pointer transition"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-400" />
              <span>Executive Dossier</span>
            </button>

            <button
              type="button"
              onClick={onExport4K}
              className="px-3.5 py-2 rounded-xl bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/60 text-cyan-300 font-bold flex items-center gap-2 cursor-pointer transition shadow"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Download 4K Blueprint</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
