import React, { useState, useEffect } from 'react';
import {
  Cloud,
  HardDrive,
  Cpu,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Info
} from 'lucide-react';
import { WizardState } from '../../types/wizardStateAdapter';
import {
  TARGET_NODE_SKU_CATALOGUE,
  STORAGE_ATTACHMENT_CATALOGUE,
  evaluateCrossTierCompatibility,
  PlatformNodeSkuSpec
} from '../../data/cloudCompatibilityCatalogue';
import {
  validateSddcPlatformCidr,
  checkSubnetOverlap
} from '../../utils/cidrUtils';

interface Step3TargetPlatformProps {
  wizardState: WizardState;
  onChange: (updater: (prev: WizardState) => WizardState) => void;
  onNext: () => void;
  onPrev: () => void;
}

export const Step3TargetPlatform: React.FC<Step3TargetPlatformProps> = ({
  wizardState,
  onChange,
  onNext,
  onPrev
}) => {
  const [incompatibilityNotice, setIncompatibilityNotice] = useState<string | null>(null);

  // Filter available SKUs for current target platform
  const availableSkus = TARGET_NODE_SKU_CATALOGUE.filter(
    (sku) => sku.platform === wizardState.targetPlatform
  );

  const selectedSkuSpec: PlatformNodeSkuSpec =
    availableSkus.find((s) => s.sku === wizardState.targetNodeSku) ||
    availableSkus[0] ||
    TARGET_NODE_SKU_CATALOGUE[0];

  // Filter available storage attachments for current target platform
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

  // Check overlap between source CIDR and target CIDR
  const overlapCheck = checkSubnetOverlap(
    wizardState.sourceMgmtCidr,
    wizardState.sddcMgmtCidr
  );

  // Minimum node count enforcement
  const minRequiredNodes = selectedSkuSpec.minNodesCluster;

  const handleTargetPlatformChange = (newPlatform: WizardState['targetPlatform']) => {
    // Check compatibility before updating
    const newAvailableSkus = TARGET_NODE_SKU_CATALOGUE.filter((s) => s.platform === newPlatform);
    const defaultSku = newAvailableSkus[0]?.sku || 'AV36P';

    // Check if current decoupled storage is compatible with new platform
    let updatedStorageProvider = wizardState.decoupledStorageProvider;
    let notice: string | null = null;

    if (wizardState.decoupledStorageEnabled && wizardState.decoupledStorageProvider) {
      const storageMatch = STORAGE_ATTACHMENT_CATALOGUE.find(
        (s) => s.name === wizardState.decoupledStorageProvider
      );
      if (storageMatch && !storageMatch.supportedTargetPlatforms.includes(newPlatform as any)) {
        updatedStorageProvider = undefined; // Explicit clearing
        notice = `Storage tier "${storageMatch.name}" is incompatible with "${newPlatform}" and has been cleared. Please select an authorized storage tier.`;
      }
    }

    setIncompatibilityNotice(notice);

    onChange((prev) => ({
      ...prev,
      targetPlatform: newPlatform,
      targetNodeSku: defaultSku,
      targetNodeCount: Math.max(newAvailableSkus[0]?.minNodesCluster || 3, prev.targetNodeCount),
      decoupledStorageProvider: updatedStorageProvider,
      activeTemplate:
        newPlatform === 'avs-gen1' || newPlatform === 'avs-gen2'
          ? 'avs'
          : newPlatform === 'vmc-aws'
          ? 'vmc-aws'
          : newPlatform === 'gcve'
          ? 'gcve'
          : 'nutanix-to-nc2'
    }));
  };

  return (
    <div className="space-y-6">
      {/* Dynamic Incompatibility Clearing Banner */}
      {incompatibilityNotice && (
        <div className="p-4 rounded-xl bg-amber-950/50 border border-amber-500/50 flex items-start justify-between gap-3 text-xs text-amber-200 animate-in fade-in">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Dynamic Compatibility Revalidation:</span>
              <p className="mt-0.5 leading-relaxed">{incompatibilityNotice}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIncompatibilityNotice(null)}
            className="text-amber-400 hover:text-white underline text-xs cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 1. Target Hyperscaler Platform Selection */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <Cloud className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-sm font-bold text-white">Target Cloud SDDC Platform</h3>
              <p className="text-xs text-slate-400">Select certified hyperscaler bare-metal infrastructure tier.</p>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
            Step 3 of 4
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            {
              id: 'avs-gen2',
              name: 'AVS Gen 2',
              sub: 'Direct vNet + AV64',
              badge: 'Next-Gen Azure',
              badgeColor: 'bg-purple-950 text-purple-300 border-purple-800'
            },
            {
              id: 'avs-gen1',
              name: 'AVS Gen 1',
              sub: 'AV36P / AV52 Clusters',
              badge: 'Azure SDDC',
              badgeColor: 'bg-sky-950 text-sky-300 border-sky-800'
            },
            {
              id: 'vmc-aws',
              name: 'VMware Cloud on AWS',
              sub: 'i4i.metal + FSx ONTAP',
              badge: 'AWS SDDC',
              badgeColor: 'bg-amber-950 text-amber-300 border-amber-800'
            },
            {
              id: 'gcve',
              name: 'Google Cloud GCVE',
              sub: 've1 / ve2 + GCNV',
              badge: 'GCP SDDC',
              badgeColor: 'bg-blue-950 text-blue-300 border-blue-800'
            },
            {
              id: 'nc2-azure',
              name: 'Nutanix NC2 on Azure',
              sub: 'AN36P BareMetal + DSF',
              badge: 'Nutanix Cloud',
              badgeColor: 'bg-emerald-950 text-emerald-300 border-emerald-800'
            }
          ].map((platform) => {
            const isSelected = wizardState.targetPlatform === platform.id;
            return (
              <button
                key={platform.id}
                type="button"
                onClick={() => handleTargetPlatformChange(platform.id as any)}
                className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-950/60 border-cyan-500 shadow-md ring-1 ring-cyan-500/30'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${platform.badgeColor}`}>
                    {platform.badge}
                  </span>
                  {isSelected && <span className="text-[10px] text-cyan-400 font-bold">ACTIVE</span>}
                </div>
                <div className="text-xs font-bold text-white">{platform.name}</div>
                <div className="text-[10px] text-slate-400 mt-0.5 font-mono">{platform.sub}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Target Node SKU & Minimum Node Constraints */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <Cpu className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="text-sm font-bold text-white">Target Node SKU & Cluster Capacity</h3>
              <p className="text-xs text-slate-400">Official vendor hardware specifications and production SLA limits.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Node SKU Picker */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Certified Bare-Metal Host SKU</label>
            <select
              value={wizardState.targetNodeSku}
              onChange={(e) => onChange((prev) => ({ ...prev, targetNodeSku: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-cyan-300 focus:border-cyan-500 focus:outline-none"
            >
              {availableSkus.map((sku) => (
                <option key={sku.sku} value={sku.sku}>
                  {sku.displayName}
                </option>
              ))}
            </select>

            {/* Official Citation Badge */}
            {selectedSkuSpec.citation && (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-cyan-400 font-bold">
                    OFFICIAL VENDOR SPECIFICATION
                  </span>
                  <a
                    href={selectedSkuSpec.citation.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 underline"
                  >
                    <span>View Official Docs</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="font-semibold text-slate-200 text-xs">{selectedSkuSpec.citation.documentTitle}</div>
                <div className="text-[10px] text-slate-500 font-mono">
                  Verified: {selectedSkuSpec.citation.verificationDate} · {selectedSkuSpec.citation.applicableVersions}
                </div>
              </div>
            )}
          </div>

          {/* Node Count & Limits */}
          <div className="space-y-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300">Production Cluster Node Count</label>
                <span className="text-[11px] font-mono text-emerald-400 font-bold">
                  Min SLA: {minRequiredNodes} Nodes
                </span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={minRequiredNodes}
                  max={selectedSkuSpec.maxNodesCluster}
                  value={wizardState.targetNodeCount}
                  onChange={(e) =>
                    onChange((prev) => ({ ...prev, targetNodeCount: Number(e.target.value) }))
                  }
                  className="flex-1 accent-cyan-500 cursor-pointer"
                />
                <input
                  type="number"
                  min={minRequiredNodes}
                  max={selectedSkuSpec.maxNodesCluster}
                  value={wizardState.targetNodeCount}
                  onChange={(e) =>
                    onChange((prev) => ({
                      ...prev,
                      targetNodeCount: Math.max(minRequiredNodes, Number(e.target.value))
                    }))
                  }
                  className="w-16 px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-center text-xs font-bold text-cyan-300 font-mono"
                />
              </div>
            </div>

            {/* Target Capacity Breakdown */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 grid grid-cols-4 gap-2 text-center text-xs">
              <div>
                <span className="text-[10px] text-slate-500 font-mono block">PHYSICAL CORES</span>
                <span className="font-bold text-cyan-300 font-mono">
                  {wizardState.targetNodeCount * selectedSkuSpec.physicalCores}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-mono block">LOGICAL THREADS</span>
                <span className="font-bold text-indigo-300 font-mono">
                  {wizardState.targetNodeCount * selectedSkuSpec.logicalThreads}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-mono block">TOTAL RAM</span>
                <span className="font-bold text-emerald-300 font-mono">
                  {wizardState.targetNodeCount * selectedSkuSpec.ramGB} GB
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-mono block">NVME POOL</span>
                <span className="font-bold text-amber-300 font-mono">
                  {(wizardState.targetNodeCount * selectedSkuSpec.rawStorageTB).toFixed(1)} TB
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. SDDC Management CIDR & Collision Check */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <HardDrive className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-sm font-bold text-white">SDDC Management CIDR Block Validation</h3>
              <p className="text-xs text-slate-400">
                Enforces platform-specific prefix sizes (AVS exact /22, GCVE node-dependent) and collision avoidance.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">SDDC Private Management CIDR</label>
            <input
              type="text"
              value={wizardState.sddcMgmtCidr}
              onChange={(e) => onChange((prev) => ({ ...prev, sddcMgmtCidr: e.target.value.trim() }))}
              placeholder="10.240.0.0/22"
              className={`w-full px-3 py-2 bg-slate-950 border rounded-xl text-xs font-mono font-bold focus:outline-none ${
                sddcCidrValidation.isValid
                  ? 'border-slate-800 text-cyan-300 focus:border-cyan-500'
                  : 'border-rose-500 text-rose-300 focus:border-rose-400'
              }`}
            />
            {!sddcCidrValidation.isValid && sddcCidrValidation.message && (
              <p className="text-[11px] text-rose-400 mt-1 font-mono">{sddcCidrValidation.message}</p>
            )}
          </div>

          <div className="space-y-2">
            {/* Overlap Check Warning */}
            {overlapCheck.hasOverlap ? (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/50 flex items-start gap-2.5 text-xs text-rose-200">
                <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">CRITICAL: Subnet Overlap Detected!</span>
                  <p className="text-[11px] mt-0.5">{overlapCheck.overlapDescription}</p>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-center gap-2.5 text-xs text-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <span className="font-bold">Subnet Separation Validated</span>
                  <p className="text-[11px] opacity-80">
                    Source ({wizardState.sourceMgmtCidr}) and Target ({wizardState.sddcMgmtCidr}) are mutually non-overlapping.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. External Decoupled Storage Tier */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <HardDrive className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-sm font-bold text-white">External Decoupled Storage Tier</h3>
              <p className="text-xs text-slate-400">Mount external enterprise datastores to decouple compute from storage sprawl.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="decoupledStorageToggle"
              checked={wizardState.decoupledStorageEnabled}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  decoupledStorageEnabled: e.target.checked,
                  decoupledStorageProvider: e.target.checked
                    ? compatibleStorageTiers[0]?.name || prev.decoupledStorageProvider
                    : undefined
                }))
              }
              className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
            />
            <label htmlFor="decoupledStorageToggle" className="text-xs text-white font-medium cursor-pointer">
              Enable External Datastores
            </label>
          </div>
        </div>

        {wizardState.decoupledStorageEnabled ? (
          <div className="space-y-4 animate-in fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Authorized Storage Provider / Protocol</label>
                <select
                  value={wizardState.decoupledStorageProvider || compatibleStorageTiers[0]?.name}
                  onChange={(e) =>
                    onChange((prev) => ({ ...prev, decoupledStorageProvider: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-emerald-300 focus:border-cyan-500 focus:outline-none"
                >
                  {compatibleStorageTiers.map((storage) => (
                    <option key={storage.id} value={storage.name}>
                      {storage.name} ({storage.storageProtocol})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Decoupled Storage Allocation (TB)</label>
                <input
                  type="number"
                  min="0"
                  max="2000"
                  step="10"
                  value={wizardState.decoupledStorageTB}
                  onChange={(e) =>
                    onChange((prev) => ({
                      ...prev,
                      decoupledStorageTB: Math.max(0, Number(e.target.value))
                    }))
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold font-mono text-emerald-300 focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">
                Offloaded Host Capacity: <strong className="text-white font-mono">{wizardState.decoupledStorageTB} TB</strong> offloaded from internal cluster NVMe drives.
              </span>
              <span className="text-[10px] font-mono text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800">
                NO COMPUTE STRANDING
              </span>
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs text-slate-400">
            Storage will rely strictly on hyperconverged local NVMe drives ({wizardState.targetNodeCount * selectedSkuSpec.rawStorageTB} TB gross).
          </div>
        )}
      </div>

      {/* Step 3 Completion Navigation Footer */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onPrev}
          className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-semibold text-xs flex items-center gap-2 cursor-pointer transition"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Step 2: Transit & Security</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          disabled={!sddcCidrValidation.isValid || overlapCheck.hasOverlap}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg transition-all ${
            !sddcCidrValidation.isValid || overlapCheck.hasOverlap
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
              : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/20 cursor-pointer hover:scale-[1.02]'
          }`}
        >
          <span>Continue to Step 4: DR & Generation</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
