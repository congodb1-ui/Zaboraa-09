import React, { useState } from 'react';
import {
  Server,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Database,
  Cpu,
  HardDrive,
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { WizardState, WizardClusterSpec } from '../../types/wizardStateAdapter';
import {
  calculateClusterCapacity,
  calculateTotalInfrastructureCapacity,
  evaluateFailureScenario,
  DEFAULT_ENGINEERING_ASSUMPTIONS
} from '../../utils/architectureCalculator';
import { parseAndValidateCidr } from '../../utils/cidrUtils';
import { HARDWARE_VENDOR_CATALOGUE } from '../../data/cloudCompatibilityCatalogue';

interface Step1ScopeAndSourceProps {
  wizardState: WizardState;
  onChange: (updater: (prev: WizardState) => WizardState) => void;
  onNext: () => void;
}

export const Step1ScopeAndSource: React.FC<Step1ScopeAndSourceProps> = ({
  wizardState,
  onChange,
  onNext
}) => {
  const [showAssumptionsDrawer, setShowAssumptionsDrawer] = useState<boolean>(false);

  // Compute live capacity
  const totalCapacity = calculateTotalInfrastructureCapacity(
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

  // Evaluate N+1 failure scenario across clusters
  const failureScenarioResult = evaluateFailureScenario(
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
        acc[c.id] = wizardState.failureReservedHosts > 0 ? 1 : 0;
        return acc;
      }, {} as Record<string, number>)
    },
    wizardState.clusters.reduce((acc, c) => {
      // Estimated workload demand based on 70% cluster utilization
      acc[c.id] = {
        vcpu: Math.round(c.hostCount * c.sockets * c.coresPerSocket * 1.5),
        ramGB: Math.round(c.hostCount * c.ramGB * 0.75),
        storageTB: Math.round(c.hostCount * c.storageTB * 0.65)
      };
      return acc;
    }, {} as Record<string, { vcpu: number; ramGB: number; storageTB: number }>)
  );

  // Validate Source CIDR
  const cidrValidation = parseAndValidateCidr(wizardState.sourceMgmtCidr, 'on-premise');

  // Vendor hardware models
  const selectedVendorCatalogue =
    HARDWARE_VENDOR_CATALOGUE.find((v) => v.vendor === wizardState.hardwareVendor) ||
    HARDWARE_VENDOR_CATALOGUE[0];

  // Cluster management handlers
  const handleAddCluster = () => {
    const newId = `cluster-${Date.now()}`;
    const newCluster: WizardClusterSpec = {
      id: newId,
      name: `Dedicated Cluster ${wizardState.clusters.length + 1}`,
      hostCount: 4,
      sockets: 2,
      coresPerSocket: 32,
      hyperthreading: true,
      ramGB: 768,
      storageTB: 19.2
    };
    onChange((prev) => ({
      ...prev,
      clusters: [...prev.clusters, newCluster]
    }));
  };

  const handleUpdateCluster = (id: string, patch: Partial<WizardClusterSpec>) => {
    onChange((prev) => ({
      ...prev,
      clusters: prev.clusters.map((c) => (c.id === id ? { ...c, ...patch } : c))
    }));
  };

  const handleRemoveCluster = (id: string) => {
    if (wizardState.clusters.length <= 1) return;
    onChange((prev) => ({
      ...prev,
      clusters: prev.clusters.filter((c) => c.id !== id)
    }));
  };

  return (
    <div className="space-y-6">
      {/* 1. Project Information & Footprint Scope */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <Server className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-sm font-bold text-white">Project Scope & Customer Metadata</h3>
              <p className="text-xs text-slate-400">Define customer engagement parameters and target architectural tier.</p>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
            Step 1 of 4
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Customer Enterprise Name</label>
            <input
              type="text"
              value={wizardState.customerName}
              onChange={(e) => onChange((prev) => ({ ...prev, customerName: e.target.value }))}
              placeholder="e.g. Acme Global Logistics"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-white focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Lead Cloud Architect</label>
            <input
              type="text"
              value={wizardState.architectName}
              onChange={(e) => onChange((prev) => ({ ...prev, architectName: e.target.value }))}
              placeholder="e.g. Wasim Sayyed"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-white focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Architecture Project Date</label>
            <input
              type="date"
              value={wizardState.projectDate}
              onChange={(e) => onChange((prev) => ({ ...prev, projectDate: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-white focus:border-cyan-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Footprint Scope Selector */}
        <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
          <label className="text-xs font-semibold text-slate-300">Target Footprint Deployment Scope</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {[
              { id: 'hybrid-multi', title: 'Hybrid & Multi-Cloud', desc: 'On-prem to Hyperscaler SDDC with Direct ExpressRoute/Interconnect' },
              { id: 'private-sddc', title: 'Private Cloud Datacenter', desc: 'On-premises VCF / Nutanix SDDC modernization' },
              { id: 'native-cloud', title: 'Hyperscaler Native Fabric', desc: 'AWS/Azure/GCP native VPC mesh & containers' }
            ].map((scope) => (
              <button
                key={scope.id}
                type="button"
                onClick={() => onChange((prev) => ({ ...prev, footprintScope: scope.id as any }))}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  wizardState.footprintScope === scope.id
                    ? 'bg-cyan-950/60 border-cyan-500 text-white shadow-md'
                    : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-bold text-white">{scope.title}</div>
                <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">{scope.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Source Hypervisor & Hardware Infrastructure */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <Cpu className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="text-sm font-bold text-white">Source Hypervisor & Physical Compute</h3>
              <p className="text-xs text-slate-400">Configure current on-premises virtualization platform and OEM hardware SKU.</p>
            </div>
          </div>
        </div>

        {/* Source Platform Selector */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {[
            { id: 'vmware', label: 'VMware vSphere / VCF', badge: 'vSphere 8 / VCF 5.2' },
            { id: 'nutanix', label: 'Nutanix Cloud Platform', badge: 'AHV / AOS 6.8' },
            { id: 'hyperv', label: 'Microsoft Hyper-V', badge: 'WSFC / SCVMM' },
            { id: 'baremetal', label: 'Physical Bare Metal', badge: 'Co-Location / Linux' }
          ].map((platform) => (
            <button
              key={platform.id}
              type="button"
              onClick={() => {
                const newPlatform = platform.id as any;
                onChange((prev) => {
                  let updatedState = { ...prev, sourcePlatform: newPlatform };
                  // Check if current DR engine is compatible with new source platform
                  if (newPlatform === 'nutanix' && prev.drConfig.engine.includes('SRM')) {
                    updatedState.drConfig = {
                      ...updatedState.drConfig,
                      engine: 'Nutanix Protection Domains (NearSync & Metro Availability)',
                      rpoMinutes: 0
                    };
                  }
                  return updatedState;
                });
              }}
              className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                wizardState.sourcePlatform === platform.id
                  ? 'bg-indigo-950/70 border-indigo-500 text-white shadow-md ring-1 ring-indigo-500/30'
                  : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="text-xs font-bold text-white">{platform.label}</div>
              <span className="text-[10px] font-mono text-indigo-300 block mt-1">{platform.badge}</span>
            </button>
          ))}
        </div>

        {/* VMware Specific Config */}
        {wizardState.sourcePlatform === 'vmware' && (
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">VMware Architecture Profile</span>
              <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() =>
                    onChange((prev) => ({
                      ...prev,
                      sourceHypervisorConfig: { ...prev.sourceHypervisorConfig, vmwareType: 'traditional' }
                    }))
                  }
                  className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer ${
                    wizardState.sourceHypervisorConfig.vmwareType === 'traditional'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Traditional vSphere
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onChange((prev) => ({
                      ...prev,
                      sourceHypervisorConfig: { ...prev.sourceHypervisorConfig, vmwareType: 'vcf' }
                    }))
                  }
                  className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer ${
                    wizardState.sourceHypervisorConfig.vmwareType === 'vcf'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  VMware Cloud Foundation (VCF)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {wizardState.sourceHypervisorConfig.vmwareType === 'vcf' ? (
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-400">VCF Release Version</label>
                  <select
                    value={wizardState.sourceHypervisorConfig.vcfVersion || 'VCF 5.2.x'}
                    onChange={(e) =>
                      onChange((prev) => ({
                        ...prev,
                        sourceHypervisorConfig: {
                          ...prev.sourceHypervisorConfig,
                          vcfVersion: e.target.value as any
                        }
                      }))
                    }
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                  >
                    <option value="VCF 5.2.x">VCF 5.2.x (Latest Enterprise SDDC)</option>
                    <option value="VCF 5.1.x">VCF 5.1.x (Stable)</option>
                    <option value="VCF 4.5.x">VCF 4.5.x (Legacy vSphere 7)</option>
                  </select>
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-400">vSphere Hypervisor Version</label>
                  <select
                    value={wizardState.sourceHypervisorConfig.vSphereVersion || '8.0u3'}
                    onChange={(e) =>
                      onChange((prev) => ({
                        ...prev,
                        sourceHypervisorConfig: {
                          ...prev.sourceHypervisorConfig,
                          vSphereVersion: e.target.value as any
                        }
                      }))
                    }
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                  >
                    <option value="8.0u3">ESXi / vCenter 8.0 Update 3</option>
                    <option value="7.0u3">ESXi / vCenter 7.0 Update 3</option>
                  </select>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-400">NSX Overlay Networking</label>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="nsxToggle"
                    checked={wizardState.sourceHypervisorConfig.nsxEnabled}
                    onChange={(e) =>
                      onChange((prev) => ({
                        ...prev,
                        sourceHypervisorConfig: {
                          ...prev.sourceHypervisorConfig,
                          nsxEnabled: e.target.checked
                        }
                      }))
                    }
                    className="w-4 h-4 accent-indigo-500 rounded cursor-pointer"
                  />
                  <label htmlFor="nsxToggle" className="text-xs text-slate-200 cursor-pointer">
                    Enable NSX Microsegmentation
                  </label>
                </div>
              </div>

              {wizardState.sourceHypervisorConfig.nsxEnabled && (
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-400">NSX Version</label>
                  <select
                    value={wizardState.sourceHypervisorConfig.nsxVersion || '4.2.x'}
                    onChange={(e) =>
                      onChange((prev) => ({
                        ...prev,
                        sourceHypervisorConfig: {
                          ...prev.sourceHypervisorConfig,
                          nsxVersion: e.target.value as any
                        }
                      }))
                    }
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                  >
                    <option value="4.2.x">NSX 4.2.x (Project Antrea & VPC)</option>
                    <option value="3.2.x">NSX-T 3.2.x (Security Core)</option>
                  </select>
                </div>
              )}
            </div>

            {/* Aria Suite Multi-Select */}
            <div className="space-y-1.5 pt-2 border-t border-slate-900">
              <label className="text-[11px] font-medium text-slate-400">Aria Suite Enterprise Management</label>
              <div className="flex flex-wrap gap-2">
                {['Operations', 'Automation', 'Operations for Networks (vRNI)', 'Log Insight'].map((suite) => {
                  const isChecked = wizardState.sourceHypervisorConfig.ariaSuite.includes(suite);
                  return (
                    <button
                      key={suite}
                      type="button"
                      onClick={() => {
                        const updated = isChecked
                          ? wizardState.sourceHypervisorConfig.ariaSuite.filter((s) => s !== suite)
                          : [...wizardState.sourceHypervisorConfig.ariaSuite, suite];
                        onChange((prev) => ({
                          ...prev,
                          sourceHypervisorConfig: {
                            ...prev.sourceHypervisorConfig,
                            ariaSuite: updated
                          }
                        }));
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs border transition cursor-pointer ${
                        isChecked
                          ? 'bg-indigo-950 border-indigo-600 text-indigo-300 font-semibold'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {isChecked ? '✓ ' : '+ '}
                      {suite}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Nutanix Specific Config */}
        {wizardState.sourcePlatform === 'nutanix' && (
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <span className="text-xs font-bold text-white">Nutanix AOS Stack Version</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <select
                value={wizardState.sourceHypervisorConfig.nutanixAosVersion || 'AOS 6.8 LTS (Prism Central)'}
                onChange={(e) =>
                  onChange((prev) => ({
                    ...prev,
                    sourceHypervisorConfig: {
                      ...prev.sourceHypervisorConfig,
                      nutanixAosVersion: e.target.value
                    }
                  }))
                }
                className="px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white"
              >
                <option value="AOS 6.8 LTS (Prism Central)">AOS 6.8 LTS (Prism Central + Flow Security)</option>
                <option value="AOS 6.5.x LTS">AOS 6.5.x LTS (Enterprise Cluster)</option>
                <option value="AOS 7.0 STS">AOS 7.0 STS (Early Access)</option>
              </select>
              <div className="p-2 rounded bg-slate-900 text-[11px] text-slate-400 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Nutanix Prism Central handles multi-cluster orchestration, Flow Microsegmentation, and Leap DR.</span>
              </div>
            </div>
          </div>
        )}

        {/* Hardware Vendor & Model Catalogue */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Server OEM Hardware Vendor</label>
            <select
              value={wizardState.hardwareVendor}
              onChange={(e) => {
                const newVendor = e.target.value as any;
                const cat = HARDWARE_VENDOR_CATALOGUE.find((v) => v.vendor === newVendor);
                onChange((prev) => ({
                  ...prev,
                  hardwareVendor: newVendor,
                  hardwareSku: cat?.models[0] || prev.hardwareSku
                }));
              }}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-white focus:border-cyan-500 focus:outline-none"
            >
              {HARDWARE_VENDOR_CATALOGUE.map((v) => (
                <option key={v.vendor} value={v.vendor}>
                  {v.vendor}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">Server Chassis / Node SKU</label>
              <span className="text-[10px] text-emerald-400 font-mono">VCG Certified</span>
            </div>
            <select
              value={wizardState.hardwareSku}
              onChange={(e) => onChange((prev) => ({ ...prev, hardwareSku: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-cyan-300 focus:border-cyan-500 focus:outline-none"
            >
              {selectedVendorCatalogue.models.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 3. Heterogeneous Cluster Sizing Manager */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-sm font-bold text-white">
                Heterogeneous Cluster Capacity Sizing ({wizardState.clusters.length} Clusters)
              </h3>
              <p className="text-xs text-slate-400">
                Independent sizing for compute-dense, storage-heavy, and management clusters without false averaging.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAssumptionsDrawer(!showAssumptionsDrawer)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              <span>Assumptions</span>
              {showAssumptionsDrawer ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            <button
              type="button"
              onClick={handleAddCluster}
              className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Cluster</span>
            </button>
          </div>
        </div>

        {/* Engineering Assumptions Config Drawer */}
        {showAssumptionsDrawer && (
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider font-mono">
                Engineering Calculation Assumptions
              </span>
              <button
                type="button"
                onClick={() =>
                  onChange((prev) => ({
                    ...prev,
                    assumptions: { ...DEFAULT_ENGINEERING_ASSUMPTIONS }
                  }))
                }
                className="text-[11px] text-slate-400 hover:text-white underline cursor-pointer"
              >
                Reset Defaults
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-mono">vCPU:pCore Ratio</label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="5"
                  value={wizardState.assumptions.maxOversubscriptionRatio}
                  onChange={(e) =>
                    onChange((prev) => ({
                      ...prev,
                      assumptions: {
                        ...prev.assumptions,
                        maxOversubscriptionRatio: Number(e.target.value)
                      }
                    }))
                  }
                  className="w-full px-2 py-1 bg-slate-900 border border-slate-800 rounded text-cyan-300 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-mono">RAM Overhead</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="0.25"
                  value={wizardState.assumptions.hypervisorRamOverheadPct}
                  onChange={(e) =>
                    onChange((prev) => ({
                      ...prev,
                      assumptions: {
                        ...prev.assumptions,
                        hypervisorRamOverheadPct: Number(e.target.value)
                      }
                    }))
                  }
                  className="w-full px-2 py-1 bg-slate-900 border border-slate-800 rounded text-cyan-300 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-mono">CPU Reservation</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="0.30"
                  value={wizardState.assumptions.hypervisorCpuReservationPct}
                  onChange={(e) =>
                    onChange((prev) => ({
                      ...prev,
                      assumptions: {
                        ...prev.assumptions,
                        hypervisorCpuReservationPct: Number(e.target.value)
                      }
                    }))
                  }
                  className="w-full px-2 py-1 bg-slate-900 border border-slate-800 rounded text-cyan-300 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-mono">Storage Protection</label>
                <select
                  value={wizardState.assumptions.storageProtectionFactor}
                  onChange={(e) =>
                    onChange((prev) => ({
                      ...prev,
                      assumptions: {
                        ...prev.assumptions,
                        storageProtectionFactor: Number(e.target.value)
                      }
                    }))
                  }
                  className="w-full px-2 py-1 bg-slate-900 border border-slate-800 rounded text-cyan-300 font-mono text-[11px]"
                >
                  <option value={1.33}>RAID-5 (1.33x)</option>
                  <option value={1.5}>RAID-6 (1.50x)</option>
                  <option value={2.0}>RAID-1 Mirror (2.0x)</option>
                  <option value={1.0}>Raw (1.0x)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-mono">Slack Space</label>
                <input
                  type="number"
                  step="0.05"
                  min="0.10"
                  max="0.35"
                  value={wizardState.assumptions.storageSlackSpacePct}
                  onChange={(e) =>
                    onChange((prev) => ({
                      ...prev,
                      assumptions: {
                        ...prev.assumptions,
                        storageSlackSpacePct: Number(e.target.value)
                      }
                    }))
                  }
                  className="w-full px-2 py-1 bg-slate-900 border border-slate-800 rounded text-cyan-300 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-mono">Dedup & Comp</label>
                <input
                  type="number"
                  step="0.1"
                  min="1.0"
                  max="3.0"
                  value={wizardState.assumptions.storageEfficiencyRatio}
                  onChange={(e) =>
                    onChange((prev) => ({
                      ...prev,
                      assumptions: {
                        ...prev.assumptions,
                        storageEfficiencyRatio: Number(e.target.value)
                      }
                    }))
                  }
                  className="w-full px-2 py-1 bg-slate-900 border border-slate-800 rounded text-cyan-300 font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {/* Cluster Cards Grid */}
        <div className="space-y-3">
          {wizardState.clusters.map((cluster, idx) => {
            const clusterCap = calculateClusterCapacity(
              {
                id: cluster.id,
                name: cluster.name,
                hostCount: cluster.hostCount,
                sockets: cluster.sockets,
                coresPerSocket: cluster.coresPerSocket,
                hyperthreading: cluster.hyperthreading,
                ramPerHostGB: cluster.ramGB,
                rawStoragePerHostTB: cluster.storageTB
              },
              wizardState.assumptions
            );

            return (
              <div
                key={cluster.id}
                className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3 hover:border-slate-700 transition"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                      0{idx + 1}
                    </span>
                    <input
                      type="text"
                      value={cluster.name}
                      onChange={(e) => handleUpdateCluster(cluster.id, { name: e.target.value })}
                      className="px-2 py-1 bg-transparent border-b border-transparent hover:border-slate-700 focus:border-cyan-500 text-xs font-bold text-white focus:outline-none flex-1 max-w-sm"
                    />
                  </div>

                  {wizardState.clusters.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveCluster(cluster.id)}
                      className="text-slate-500 hover:text-rose-400 p-1 transition cursor-pointer"
                      title="Remove Cluster"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5 text-xs">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-mono">Hosts</label>
                    <input
                      type="number"
                      min="2"
                      max="128"
                      value={cluster.hostCount}
                      onChange={(e) =>
                        handleUpdateCluster(cluster.id, { hostCount: Math.max(1, Number(e.target.value)) })
                      }
                      className="w-full px-2 py-1 bg-slate-900 border border-slate-800 rounded text-white font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-mono">Sockets</label>
                    <select
                      value={cluster.sockets}
                      onChange={(e) => handleUpdateCluster(cluster.id, { sockets: Number(e.target.value) })}
                      className="w-full px-2 py-1 bg-slate-900 border border-slate-800 rounded text-white font-mono"
                    >
                      <option value={1}>1 Socket</option>
                      <option value={2}>2 Sockets</option>
                      <option value={4}>4 Sockets</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-mono">Cores / Socket</label>
                    <input
                      type="number"
                      min="4"
                      max="128"
                      value={cluster.coresPerSocket}
                      onChange={(e) =>
                        handleUpdateCluster(cluster.id, { coresPerSocket: Math.max(1, Number(e.target.value)) })
                      }
                      className="w-full px-2 py-1 bg-slate-900 border border-slate-800 rounded text-white font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-mono">RAM / Host (GB)</label>
                    <input
                      type="number"
                      min="64"
                      max="8192"
                      step="64"
                      value={cluster.ramGB}
                      onChange={(e) =>
                        handleUpdateCluster(cluster.id, { ramGB: Math.max(64, Number(e.target.value)) })
                      }
                      className="w-full px-2 py-1 bg-slate-900 border border-slate-800 rounded text-white font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-mono">Storage / Host (TB)</label>
                    <input
                      type="number"
                      min="1"
                      max="200"
                      step="0.5"
                      value={cluster.storageTB}
                      onChange={(e) =>
                        handleUpdateCluster(cluster.id, { storageTB: Math.max(0.5, Number(e.target.value)) })
                      }
                      className="w-full px-2 py-1 bg-slate-900 border border-slate-800 rounded text-white font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-mono">Hyperthreading</label>
                    <button
                      type="button"
                      onClick={() => handleUpdateCluster(cluster.id, { hyperthreading: !cluster.hyperthreading })}
                      className={`w-full px-2 py-1 rounded font-mono text-[11px] font-semibold border transition cursor-pointer ${
                        cluster.hyperthreading
                          ? 'bg-emerald-950 border-emerald-700 text-emerald-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      {cluster.hyperthreading ? 'Enabled (2x)' : 'Disabled (1x)'}
                    </button>
                  </div>

                  <div className="space-y-1 bg-slate-900/90 p-1.5 rounded border border-slate-800/80">
                    <span className="text-[9px] text-slate-400 font-mono block">CAPACITY YIELD</span>
                    <span className="text-[11px] font-bold text-cyan-300 block font-mono">
                      {clusterCap.physicalCores} Cores · {clusterCap.usableRamGB} GB
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Aggregated Sizing KPI Banner */}
        <div className="p-4 rounded-xl bg-slate-950 border border-cyan-500/30 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 text-center">
          <div>
            <span className="text-[10px] text-slate-400 font-mono uppercase block">Total Physical Hosts</span>
            <span className="text-base font-bold text-white font-mono">{totalCapacity.totalHosts}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-mono uppercase block">Physical Cores</span>
            <span className="text-base font-bold text-cyan-300 font-mono">{totalCapacity.totalPhysicalCores}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-mono uppercase block">Logical Processors</span>
            <span className="text-base font-bold text-indigo-300 font-mono">{totalCapacity.totalLogicalProcessors}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-mono uppercase block">Usable RAM (Net)</span>
            <span className="text-base font-bold text-emerald-300 font-mono">{totalCapacity.totalUsableRamGB} GB</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-mono uppercase block">Usable Storage</span>
            <span className="text-base font-bold text-amber-300 font-mono">{totalCapacity.totalUsableStorageTB} TB</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-mono uppercase block">Max vCPU Budget</span>
            <span className="text-base font-bold text-white font-mono">{totalCapacity.maxRecommendedWorkloadVcpu}</span>
          </div>
        </div>

        {/* N+1 Failure Headroom Verification Badge */}
        <div
          className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs ${
            failureScenarioResult.isAllViable
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {failureScenarioResult.isAllViable ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <div>
              <span className="font-bold">
                {failureScenarioResult.isAllViable
                  ? 'N+1 Multi-Cluster Failure Viability Confirmed'
                  : 'N+1 Capacity Deficit Detected During Failure Simulation'}
              </span>
              <p className="text-[11px] opacity-80">
                Surviving hosts across all clusters: {failureScenarioResult.totalSurvivingHosts} / {totalCapacity.totalHosts}.
              </p>
            </div>
          </div>

          <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase border bg-slate-950">
            {failureScenarioResult.isAllViable ? 'VIABLE' : 'ACTION REQUIRED'}
          </span>
        </div>
      </div>

      {/* 4. Source Management Network & CIDR Validation */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <HardDrive className="w-5 h-5 text-sky-400" />
            <div>
              <h3 className="text-sm font-bold text-white">Source Management CIDR Block</h3>
              <p className="text-xs text-slate-400">
                Validated integer IPv4 network boundary with reserved IP deductions and collision checks.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Management Network CIDR Block</label>
            <input
              type="text"
              value={wizardState.sourceMgmtCidr}
              onChange={(e) => onChange((prev) => ({ ...prev, sourceMgmtCidr: e.target.value.trim() }))}
              placeholder="10.10.0.0/16"
              className={`w-full px-3 py-2 bg-slate-950 border rounded-xl text-xs font-mono font-bold focus:outline-none ${
                cidrValidation.isValid
                  ? 'border-slate-800 text-cyan-300 focus:border-cyan-500'
                  : 'border-rose-500 text-rose-300 focus:border-rose-400'
              }`}
            />
            {cidrValidation.error && (
              <p className="text-[11px] text-rose-400 mt-1 font-mono">{cidrValidation.error}</p>
            )}
            {cidrValidation.warnings && cidrValidation.warnings.length > 0 && (
              <p className="text-[11px] text-amber-400 mt-1 font-mono">{cidrValidation.warnings[0]}</p>
            )}
          </div>

          {cidrValidation.isValid && (
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <span className="text-[10px] text-slate-500 font-mono block">TOTAL IPS</span>
                <span className="font-bold text-white font-mono">{cidrValidation.totalAddresses.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-mono block">USABLE IPS</span>
                <span className="font-bold text-emerald-400 font-mono">{cidrValidation.usableAddresses.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-mono block">RANGE</span>
                <span className="font-bold text-cyan-300 font-mono text-[10px]">
                  {cidrValidation.firstUsableIp} - {cidrValidation.lastUsableIp.split('.').slice(2).join('.')}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Step 1 Completion Navigation Footer */}
      <div className="flex items-center justify-between pt-2">
        <span className="text-xs text-slate-400 font-mono">
          ✓ Source environment configured with {totalCapacity.totalHosts} physical hosts and {totalCapacity.totalPhysicalCores} cores.
        </span>
        <button
          type="button"
          onClick={onNext}
          className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 cursor-pointer transition-all hover:scale-[1.02]"
        >
          <span>Continue to Step 2: Transit & Security</span>
        </button>
      </div>
    </div>
  );
};
