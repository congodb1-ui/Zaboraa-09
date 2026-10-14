import React, { useState } from 'react';
import {
  Globe,
  Radio,
  Network,
  Server,
  Plus,
  Trash2,
  Edit3,
  Check,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Info,
  CheckCircle2,
  AlertTriangle,
  X
} from 'lucide-react';
import { WizardState } from '../../types/wizardStateAdapter';
import { EnvironmentNode, CloudPlatformType, EnvironmentRole } from '../../types/multiCloudBlueprint';
import {
  AzureVirtualWanIcon,
  AwsTransitGatewayIcon,
  GcpInterconnectIcon,
  NutanixAhvIcon,
  VmwareVcenterIcon
} from '../icons/CloudArchitectureIcons';

interface Step2TransitAndRoutingProps {
  wizardState: WizardState;
  onChange: (updater: (prev: WizardState) => WizardState) => void;
  environments: EnvironmentNode[];
  onUpdateEnvironment: (id: string, updates: Partial<EnvironmentNode>) => void;
  onRemoveEnvironment: (id: string) => void;
  onOpenAddEnvModal: () => void;
  onNext: () => void;
  onPrev: () => void;
}

export const Step2TransitAndRouting: React.FC<Step2TransitAndRoutingProps> = ({
  wizardState,
  onChange,
  environments,
  onUpdateEnvironment,
  onRemoveEnvironment,
  onOpenAddEnvModal,
  onNext,
  onPrev
}) => {
  const isAvsGen2 = wizardState.targetPlatform === 'avs-gen2';
  const [editingEnvId, setEditingEnvId] = useState<string | null>(null);

  const handleToggleProvider = (provider: 'azure' | 'aws' | 'gcp') => {
    const isSelected = wizardState.selectedPublicProviders.includes(provider);
    const updated = isSelected
      ? wizardState.selectedPublicProviders.filter((p) => p !== provider)
      : [...wizardState.selectedPublicProviders, provider];

    if (updated.length === 0) return;

    onChange((prev) => ({
      ...prev,
      selectedPublicProviders: updated
    }));
  };

  return (
    <div className="space-y-6">
      {/* 1. Public Cloud Providers Multi-Select */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <Globe className="w-5 h-5 text-sky-400" />
            <div>
              <h3 className="text-sm font-bold text-white">Target Hyperscaler Cloud Providers</h3>
              <p className="text-xs text-slate-400">Select one or more hyperscaler fabrics participating in the transit backbone.</p>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800">
            Step 2: Transit & Routing
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { id: 'azure', name: 'Microsoft Azure', badge: 'vWAN / ExpressRoute', desc: 'Azure VMware Solution, Azure Native VNets, Azure NetApp Files' },
            { id: 'aws', name: 'Amazon Web Services', badge: 'TGW / Direct Connect', desc: 'VMware Cloud on AWS, VPC Transit Gateway, Amazon FSx' },
            { id: 'gcp', name: 'Google Cloud Platform', badge: 'Cloud NCC / Interconnect', desc: 'Google Cloud VMware Engine, Shared VPC, GCNV Volumes' }
          ].map((cloud) => {
            const isSelected = wizardState.selectedPublicProviders.includes(cloud.id as any);
            return (
              <button
                key={cloud.id}
                type="button"
                onClick={() => handleToggleProvider(cloud.id as any)}
                className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
                  isSelected
                    ? 'bg-sky-950/60 border-sky-500 shadow-md ring-1 ring-sky-500/30'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-xs font-bold text-white">{cloud.name}</span>
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                    isSelected ? 'bg-sky-900 text-sky-200 border-sky-700' : 'bg-slate-900 text-slate-500 border-slate-800'
                  }`}>
                    {isSelected ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </div>
                <div className="text-[10px] font-mono text-cyan-300">{cloud.badge}</div>
                <div className="text-[11px] text-slate-400 mt-1 line-clamp-2">{cloud.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Hybrid Connectivity Carrier & Direct vNet Routing */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <Radio className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-sm font-bold text-white">Hybrid Cloud Connectivity Carrier</h3>
              <p className="text-xs text-slate-400">
                Preserve strict distinction between ExpressRoute-based circuits and AVS Gen 2 Direct vNet Routing.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              id: 'Direct Circuits with FastPath / Global Reach',
              title: 'Direct Dedicated Circuits',
              subtitle: 'ExpressRoute / Direct Connect / Interconnect',
              tag: 'Sub-3ms SLA',
              badgeColor: 'bg-emerald-950 text-emerald-300 border-emerald-800'
            },
            {
              id: 'Hybrid (VPN + ExpressRoute / DirectConnect)',
              title: 'Hybrid Dual-Path',
              subtitle: 'Primary Dedicated + IPsec VPN Backup',
              tag: 'High Availability',
              badgeColor: 'bg-cyan-950 text-cyan-300 border-cyan-800'
            },
            {
              id: 'VPN Only',
              title: 'Site-to-Site IPsec VPN',
              subtitle: 'Encrypted Multi-Tunnel BGP SD-WAN',
              tag: 'Standard Internet',
              badgeColor: 'bg-amber-950 text-amber-300 border-amber-800'
            },
            {
              id: 'Direct vNet Routing (AVS Gen 2)',
              title: 'Direct vNet Routing',
              subtitle: 'Ultra-low latency Gen 2 Bypass Routing',
              tag: 'AVS Gen 2 Exclusive',
              badgeColor: isAvsGen2
                ? 'bg-purple-950 text-purple-300 border-purple-800'
                : 'bg-slate-900 text-slate-500 border-slate-800'
            }
          ].map((conn) => {
            const isSelected = wizardState.connectivityCarrier === conn.id;
            const isGen2Only = conn.id === 'Direct vNet Routing (AVS Gen 2)';
            const isDisabled = isGen2Only && !isAvsGen2;

            return (
              <button
                key={conn.id}
                type="button"
                disabled={isDisabled}
                onClick={() => onChange((prev) => ({ ...prev, connectivityCarrier: conn.id as any }))}
                className={`p-3.5 rounded-xl border text-left transition relative ${
                  isDisabled
                    ? 'opacity-40 bg-slate-950/40 border-slate-900 cursor-not-allowed'
                    : isSelected
                    ? 'bg-amber-950/50 border-amber-500 shadow-md ring-1 ring-amber-500/30 cursor-pointer'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 cursor-pointer'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${conn.badgeColor}`}>
                    {conn.tag}
                  </span>
                  {isSelected && <span className="text-[10px] text-amber-400 font-bold">SELECTED</span>}
                </div>
                <div className="text-xs font-bold text-white">{conn.title}</div>
                <div className="text-[11px] text-slate-400 mt-0.5 font-mono">{conn.subtitle}</div>
                {isDisabled && (
                  <span className="text-[10px] text-rose-400 font-mono block mt-1.5">
                    Requires AVS Gen 2 target in Step 4
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Informational Callout for Direct vNet Routing */}
        {wizardState.connectivityCarrier.includes('Direct vNet') && (
          <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/40 text-xs text-purple-200 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">AVS Gen 2 Direct vNet Routing Architecture:</span>
              <p className="text-[11px] text-purple-300 mt-0.5">
                Traffic bypasses the virtual network gateway completely, establishing direct NVMe-oF datastore connectivity
                with Azure Elastic SAN and native Azure IaaS workloads at line-rate 100 Gbps.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 3. Enterprise Landing Zone Architecture */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <Network className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-sm font-bold text-white">Enterprise Landing Zone Topology</h3>
              <p className="text-xs text-slate-400">Architectural routing mesh, routing intent, and multi-tenant isolation pattern.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              id: 'Azure Virtual WAN Hub-and-Spoke',
              name: 'Azure Virtual WAN',
              desc: 'Any-to-any global transit hub with integrated routing intent, Azure Firewall, and VPN/ER termination.'
            },
            {
              id: 'Hub-Spoke VNet / VPC',
              name: 'Hub-and-Spoke VNet / VPC',
              desc: 'Traditional managed transit hub with user-defined routes (UDR), dedicated NVA subnets, and peering.'
            },
            {
              id: 'AWS Transit Gateway (TGW) Hub',
              name: 'AWS Transit Gateway',
              desc: 'High-scale regional transit hub interconnecting thousands of VPCs and SDDC Direct Connect circuits.'
            },
            {
              id: 'Google Cloud Shared VPC + Cloud NCC',
              name: 'Google Cloud NCC Shared VPC',
              desc: 'Centralized network governance using Network Connectivity Center and Shared VPC host projects.'
            }
          ].map((lz) => (
            <button
              key={lz.id}
              type="button"
              onClick={() => onChange((prev) => ({ ...prev, landingZonePattern: lz.id }))}
              className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
                wizardState.landingZonePattern === lz.id
                  ? 'bg-cyan-950/60 border-cyan-500 shadow-md ring-1 ring-cyan-500/30'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="text-xs font-bold text-white">{lz.name}</div>
              <div className="text-[11px] text-slate-400 mt-1 line-clamp-3 leading-relaxed">{lz.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 4. Dynamic Multi-Environment Builder with Inline Modifiers */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <Server className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-sm font-bold text-white">
                Active Infrastructure Environments ({environments.length} Tiers)
              </h3>
              <p className="text-xs text-slate-400">
                Manage on-premises datacenters, cloud transit zones, and disaster recovery environments.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenAddEnvModal}
            className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Environment</span>
          </button>
        </div>

        {/* Environments Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {environments.map((env) => {
            const isEditing = editingEnvId === env.id;
            const isProd = env.role === 'Production';
            const isDR = env.role === 'Disaster Recovery';
            const isShared = env.role === 'Shared Services';

            return (
              <div
                key={env.id}
                className={`p-4 rounded-xl border transition space-y-3 bg-slate-950/90 ${
                  isEditing
                    ? 'border-cyan-500 ring-1 ring-cyan-500/40 shadow-lg'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Header Row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 shrink-0">
                      {env.platform.includes('Nutanix') ? (
                        <NutanixAhvIcon className="w-5 h-5 text-emerald-400" />
                      ) : env.platform.includes('Azure') ? (
                        <AzureVirtualWanIcon className="w-5 h-5 text-sky-400" />
                      ) : env.platform.includes('AWS') ? (
                        <AwsTransitGatewayIcon className="w-5 h-5 text-amber-400" />
                      ) : env.platform.includes('Google') || env.platform.includes('GCP') ? (
                        <GcpInterconnectIcon className="w-5 h-5 text-blue-400" />
                      ) : (
                        <VmwareVcenterIcon className="w-5 h-5 text-indigo-400" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white line-clamp-1">{env.name}</h4>
                      <p className="text-[11px] text-slate-400 font-mono">{env.region}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border ${
                        isProd
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                          : isDR
                          ? 'bg-amber-950 text-amber-300 border-amber-700'
                          : isShared
                          ? 'bg-slate-900 text-slate-300 border-slate-700'
                          : 'bg-purple-950 text-purple-300 border-purple-700'
                      }`}
                    >
                      {env.role}
                    </span>
                  </div>
                </div>

                {/* Sizing Summary Grid */}
                <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-900 text-[11px] font-mono text-slate-300">
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase block">Hosts / SKU</span>
                    <span className="font-semibold text-white truncate block">
                      {env.hostCount > 0 ? `${env.hostCount}x ${env.nodeSku.split(' ')[0]}` : 'Serverless'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase block">Compute</span>
                    <span className="font-semibold text-cyan-300">
                      {env.totalVcpu} vCPU
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase block">Storage</span>
                    <span className="font-semibold text-emerald-300">
                      {env.storageTB} TiB
                    </span>
                  </div>
                </div>

                {/* CIDR and Action Bar */}
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-mono text-[10px] text-slate-400">
                    CIDR: <span className="text-slate-300 font-semibold">{env.cidrBlock || 'N/A'}</span>
                  </span>

                  <div className="flex items-center gap-2">
                    {/* Modify Button toggles inline editor */}
                    <button
                      type="button"
                      onClick={() => setEditingEnvId(isEditing ? null : env.id)}
                      className={`px-2.5 py-1 rounded text-xs font-medium transition cursor-pointer flex items-center gap-1 ${
                        isEditing
                          ? 'bg-cyan-500 text-slate-950 font-bold'
                          : 'bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-cyan-800/60'
                      }`}
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>{isEditing ? 'Close' : 'Modify'}</span>
                    </button>

                    {/* Remove Action */}
                    {environments.length > 1 && (
                      <button
                        type="button"
                        onClick={() => onRemoveEnvironment(env.id)}
                        className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-950/50 transition cursor-pointer"
                        title="Remove Environment"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* ========================================================================= */}
                {/* INLINE EXPANDER: Live Environment Attribute Modifier                      */}
                {/* ========================================================================= */}
                {isEditing && (
                  <div className="pt-3 border-t border-slate-800 space-y-3 animate-in fade-in duration-150">
                    <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider font-bold">
                      Inline Environment Editor
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 uppercase font-mono">Environment Name</label>
                        <input
                          type="text"
                          value={env.name}
                          onChange={(e) => onUpdateEnvironment(env.id, { name: e.target.value })}
                          className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded text-slate-200 text-xs focus:border-cyan-500 focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 uppercase font-mono">Region / Facility</label>
                        <input
                          type="text"
                          value={env.region}
                          onChange={(e) => onUpdateEnvironment(env.id, { region: e.target.value })}
                          className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded text-slate-200 text-xs focus:border-cyan-500 focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 uppercase font-mono">Platform</label>
                        <select
                          value={env.platform}
                          onChange={(e) => onUpdateEnvironment(env.id, { platform: e.target.value as CloudPlatformType })}
                          className="w-full px-2 py-1.5 bg-slate-900 border border-slate-800 rounded text-slate-200 text-xs focus:border-cyan-500 focus:outline-none"
                        >
                          <option value="Nutanix AHV">Nutanix AHV (On-Premises)</option>
                          <option value="Nutanix NC2 on Azure">Nutanix NC2 on Azure</option>
                          <option value="Azure VMware Solution">Azure VMware Solution (AVS)</option>
                          <option value="VMware vSphere">VMware vSphere (On-Premises)</option>
                          <option value="VMware Cloud on AWS">VMware Cloud on AWS</option>
                          <option value="Google Cloud VMware Engine">Google Cloud VMware Engine (GCVE)</option>
                          <option value="AWS Native VPC">AWS Native VPC</option>
                          <option value="Azure Native VNet">Azure Native VNet</option>
                          <option value="Google Cloud Shared VPC">Google Cloud Shared VPC</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 uppercase font-mono">Tier Role</label>
                        <select
                          value={env.role}
                          onChange={(e) => onUpdateEnvironment(env.id, { role: e.target.value as EnvironmentRole })}
                          className="w-full px-2 py-1.5 bg-slate-900 border border-slate-800 rounded text-slate-200 text-xs focus:border-cyan-500 focus:outline-none"
                        >
                          <option value="Production">Production</option>
                          <option value="Disaster Recovery">Disaster Recovery</option>
                          <option value="Secondary Active">Secondary Active</option>
                          <option value="Shared Services">Shared Services</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 uppercase font-mono">Host Count</label>
                        <input
                          type="number"
                          min={0}
                          max={64}
                          value={env.hostCount}
                          onChange={(e) => {
                            const count = Math.max(0, Number(e.target.value));
                            onUpdateEnvironment(env.id, {
                              hostCount: count,
                              totalVcpu: count * 36,
                              totalRamGB: count * 576
                            });
                          }}
                          className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded text-slate-200 text-xs font-mono focus:border-cyan-500 focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 uppercase font-mono">Storage Footprint (TB)</label>
                        <input
                          type="number"
                          min={0}
                          max={2000}
                          value={env.storageTB}
                          onChange={(e) => onUpdateEnvironment(env.id, { storageTB: Math.max(0, Number(e.target.value)) })}
                          className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded text-slate-200 text-xs font-mono focus:border-cyan-500 focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1 sm:col-span-2">
                        <label className="text-[10px] text-slate-400 uppercase font-mono">Management CIDR Block</label>
                        <input
                          type="text"
                          value={env.cidrBlock}
                          onChange={(e) => onUpdateEnvironment(env.id, { cidrBlock: e.target.value })}
                          className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded text-slate-200 text-xs font-mono focus:border-cyan-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-2 border-t border-slate-900">
                      <button
                        type="button"
                        onClick={() => setEditingEnvId(null)}
                        className="px-3 py-1 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1 cursor-pointer transition"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Save & Collapse</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-800">
        <button
          type="button"
          onClick={onPrev}
          className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold text-xs flex items-center gap-2 cursor-pointer transition"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous: Scope & Source</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 cursor-pointer transition"
        >
          <span>Next: Step 3 (Security & WAF)</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
