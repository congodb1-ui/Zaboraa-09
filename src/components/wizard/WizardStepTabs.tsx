import React from 'react';
import {
  Layers,
  Network,
  Cloud,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Zap,
  Columns,
  Maximize2
} from 'lucide-react';
import { WizardState } from '../../types/wizardStateAdapter';

export interface IndustryTemplatePreset {
  id: string;
  title: string;
  subtitle: string;
  tag: string;
  tagColor: string;
  apply: (prevState: WizardState) => WizardState;
}

interface WizardStepTabsProps {
  currentStep: number;
  onSelectStep: (step: number) => void;
  wizardState: WizardState;
  onApplyTemplate: (template: IndustryTemplatePreset) => void;
  layoutMode: 'split' | 'form-only' | 'canvas-only';
  onToggleLayoutMode: (mode: 'split' | 'form-only' | 'canvas-only') => void;
  isCidrValid: boolean;
  isCompatibilityValid: boolean;
}

export const INDUSTRY_PRESETS: IndustryTemplatePreset[] = [
  {
    id: 'vcf-avs-gen2',
    title: 'VCF 5.2 to AVS Gen 2',
    subtitle: 'AV64 + Direct vNet + ANF + SRM',
    tag: 'Flagship Gen 2',
    tagColor: 'bg-cyan-950 text-cyan-300 border-cyan-800',
    apply: (prev) => ({
      ...prev,
      footprintScope: 'hybrid-multi',
      sourcePlatform: 'vmware',
      sourceHypervisorConfig: {
        vmwareType: 'vcf',
        vcfVersion: 'VCF 5.2.x',
        vSphereVersion: '8.0u3',
        nsxEnabled: true,
        nsxVersion: '4.2.x',
        ariaSuite: ['Operations', 'Automation', 'Operations for Networks (vRNI)']
      },
      hardwareVendor: 'Dell Technologies',
      hardwareSku: 'PowerEdge R760 (2x Intel Xeon Gold 6430, up to 1TB RAM)',
      selectedPublicProviders: ['azure'],
      connectivityCarrier: 'Direct Circuits with FastPath / Global Reach',
      landingZonePattern: 'Azure Virtual WAN Hub-and-Spoke',
      firewallMode: 'dual-layer',
      firewallProvider: 'Palo Alto Networks VM-Series',
      dualLayerInspectionFlow: 'sequential',
      wafEnabled: true,
      wafSolution: 'Azure WAF on Application Gateway',
      targetPlatform: 'avs-gen2',
      targetNodeSku: 'AV64',
      targetNodeCount: 4,
      sddcMgmtCidr: '10.240.0.0/22',
      decoupledStorageEnabled: true,
      decoupledStorageTB: 120,
      decoupledStorageProvider: 'Azure NetApp Files (ANF NFS Datastore)',
      drEnabled: true,
      drConfig: {
        engine: 'VMware Site Recovery Manager (SRM) + vSphere Replication',
        rpoMinutes: 5,
        rtoMinutes: 20,
        strategy: 'Pilot Light (3-Node Minimum)'
      },
      activeTemplate: 'avs'
    })
  },
  {
    id: 'nutanix-nc2-azure',
    title: 'Nutanix AHV to NC2 on Azure',
    subtitle: 'AOS 6.8 + AN36P + Metro Protection',
    tag: 'Nutanix Hybrid',
    tagColor: 'bg-emerald-950 text-emerald-300 border-emerald-800',
    apply: (prev) => ({
      ...prev,
      footprintScope: 'hybrid-multi',
      sourcePlatform: 'nutanix',
      sourceHypervisorConfig: {
        vmwareType: 'traditional',
        nsxEnabled: false,
        ariaSuite: [],
        nutanixAosVersion: 'AOS 6.8 LTS (Prism Central)'
      },
      hardwareVendor: 'Dell Technologies',
      hardwareSku: 'VxRail E660F (All-Flash NVMe Hyperconverged Node)',
      selectedPublicProviders: ['azure'],
      connectivityCarrier: 'Hybrid (VPN + ExpressRoute / DirectConnect)',
      landingZonePattern: 'Azure Virtual WAN Hub-and-Spoke',
      firewallMode: 'native',
      firewallProvider: 'Azure Firewall Premium / Native',
      wafEnabled: true,
      wafSolution: 'Azure WAF on Application Gateway',
      targetPlatform: 'nc2-azure',
      targetNodeSku: 'AN36P',
      targetNodeCount: 4,
      sddcMgmtCidr: '10.240.0.0/22',
      decoupledStorageEnabled: false,
      decoupledStorageTB: 0,
      drEnabled: true,
      drConfig: {
        engine: 'Nutanix Protection Domains (NearSync & Metro Availability)',
        rpoMinutes: 0,
        rtoMinutes: 15,
        strategy: 'Warm Standby (Full Cluster)'
      },
      activeTemplate: 'nutanix-to-nc2'
    })
  },
  {
    id: 'vsphere-vmc-aws',
    title: 'vSphere 8 to AWS VMC + FSx',
    subtitle: 'i4i.metal + Amazon FSx ONTAP + SRM',
    tag: 'AWS SDDC',
    tagColor: 'bg-amber-950 text-amber-300 border-amber-800',
    apply: (prev) => ({
      ...prev,
      footprintScope: 'hybrid-multi',
      sourcePlatform: 'vmware',
      sourceHypervisorConfig: {
        vmwareType: 'traditional',
        vSphereVersion: '8.0u3',
        nsxEnabled: true,
        nsxVersion: '4.2.x',
        ariaSuite: ['Operations']
      },
      hardwareVendor: 'HPE',
      hardwareSku: 'ProLiant DL380 Gen11 (2x Intel Xeon Platinum, up to 1TB RAM)',
      selectedPublicProviders: ['aws'],
      connectivityCarrier: 'Hybrid (VPN + ExpressRoute / DirectConnect)',
      landingZonePattern: 'AWS Transit Gateway (TGW) Hub',
      firewallMode: 'nva',
      firewallProvider: 'Fortinet FortiGate-VM',
      wafEnabled: true,
      wafSolution: 'AWS WAF',
      targetPlatform: 'vmc-aws',
      targetNodeSku: 'i4i.metal',
      targetNodeCount: 3,
      sddcMgmtCidr: '10.240.0.0/20',
      decoupledStorageEnabled: true,
      decoupledStorageTB: 150,
      decoupledStorageProvider: 'Amazon FSx for NetApp ONTAP (NFS Datastore)',
      drEnabled: true,
      drConfig: {
        engine: 'VMware Site Recovery Manager (SRM) + vSphere Replication',
        rpoMinutes: 5,
        rtoMinutes: 30,
        strategy: 'Pilot Light (3-Node Minimum)'
      },
      activeTemplate: 'vmc-aws'
    })
  },
  {
    id: 'vsphere-gcve-zerto',
    title: 'vSphere to Google Cloud GCVE',
    subtitle: 've1-standard-72 + GCNV + Zerto CDP',
    tag: 'Google Cloud',
    tagColor: 'bg-blue-950 text-blue-300 border-blue-800',
    apply: (prev) => ({
      ...prev,
      footprintScope: 'hybrid-multi',
      sourcePlatform: 'vmware',
      sourceHypervisorConfig: {
        vmwareType: 'traditional',
        vSphereVersion: '8.0u3',
        nsxEnabled: false,
        ariaSuite: ['Operations']
      },
      hardwareVendor: 'Cisco UCS',
      hardwareSku: 'UCS B200 M6 Blade Server (Dual Intel Xeon, up to 768GB RAM)',
      selectedPublicProviders: ['gcp'],
      connectivityCarrier: 'Hybrid (VPN + ExpressRoute / DirectConnect)',
      landingZonePattern: 'Google Cloud Shared VPC + Cloud NCC',
      firewallMode: 'nva',
      firewallProvider: 'Palo Alto Networks VM-Series',
      wafEnabled: false,
      targetPlatform: 'gcve',
      targetNodeSku: 've1-standard-72',
      targetNodeCount: 4,
      sddcMgmtCidr: '10.100.0.0/22',
      decoupledStorageEnabled: true,
      decoupledStorageTB: 100,
      decoupledStorageProvider: 'Google Cloud NetApp Volumes (GCNV NFS Datastore)',
      drEnabled: true,
      drConfig: {
        engine: 'Zerto Continuous Data Protection (CDP)',
        rpoMinutes: 1,
        rtoMinutes: 15,
        strategy: 'Warm Standby (Full Cluster)'
      },
      activeTemplate: 'gcve'
    })
  }
];

export const WizardStepTabs: React.FC<WizardStepTabsProps> = ({
  currentStep,
  onSelectStep,
  wizardState,
  onApplyTemplate,
  layoutMode,
  onToggleLayoutMode,
  isCidrValid,
  isCompatibilityValid
}) => {
  const steps = [
    {
      step: 1,
      title: 'Scope & Source',
      subtitle: `${wizardState.sourcePlatform.toUpperCase()} · ${wizardState.clusters.reduce((acc, c) => acc + c.hostCount, 0)} Hosts`,
      icon: Layers,
      isComplete: wizardState.customerName.trim().length > 0 && wizardState.clusters.length > 0
    },
    {
      step: 2,
      title: 'Transit & Security',
      subtitle: `${wizardState.firewallMode.toUpperCase()} · ${wizardState.connectivityCarrier.split(' ')[0]}`,
      icon: Network,
      isComplete: wizardState.selectedPublicProviders.length > 0
    },
    {
      step: 3,
      title: 'Target Platform',
      subtitle: `${wizardState.targetPlatform.toUpperCase()} (${wizardState.targetNodeCount}x ${wizardState.targetNodeSku})`,
      icon: Cloud,
      isComplete: isCidrValid && isCompatibilityValid
    },
    {
      step: 4,
      title: 'DR & Generation',
      subtitle: wizardState.drEnabled ? `${wizardState.drConfig.engine.split(' ')[0]} (${wizardState.drConfig.rpoMinutes}m)` : 'Single Site (DR Off)',
      icon: ShieldCheck,
      isComplete: true
    }
  ];

  return (
    <div className="space-y-4">
      {/* 1-Click Industry Templates Bar */}
      <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              1-Click Enterprise Architecture Templates
            </span>
            <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
              Instant pre-configured matrix baselines
            </span>
          </div>

          {/* Viewport Split Mode Switcher */}
          <div className="flex items-center gap-1.5 self-end sm:self-auto bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => onToggleLayoutMode('split')}
              title="Responsive Split View: Form on Left, Live Canvas on Right"
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                layoutMode === 'split'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Split View</span>
            </button>
            <button
              type="button"
              onClick={() => onToggleLayoutMode('form-only')}
              title="Maximize Configuration Form"
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                layoutMode === 'form-only'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Form Only</span>
            </button>
            <button
              type="button"
              onClick={() => onToggleLayoutMode('canvas-only')}
              title="Maximize Architecture Canvas"
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                layoutMode === 'canvas-only'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Canvas Only</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {INDUSTRY_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => onApplyTemplate(preset)}
              className="p-2.5 rounded-xl bg-slate-950/70 hover:bg-slate-950 border border-slate-800 hover:border-cyan-500/50 transition-all text-left group cursor-pointer relative overflow-hidden"
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${preset.tagColor}`}>
                  {preset.tag}
                </span>
                <Sparkles className="w-3 h-3 text-slate-600 group-hover:text-cyan-400 transition" />
              </div>
              <div className="text-xs font-bold text-white group-hover:text-cyan-300 transition line-clamp-1">
                {preset.title}
              </div>
              <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5 font-mono">
                {preset.subtitle}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 4-Step Navigation Tabs with Badges */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
        {steps.map((s) => {
          const Icon = s.icon;
          const isActive = currentStep === s.step;
          const isPassed = currentStep > s.step;

          return (
            <button
              key={s.step}
              type="button"
              onClick={() => onSelectStep(s.step)}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                isActive
                  ? 'bg-slate-900 border-cyan-500 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500/50'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90'
              }`}
            >
              {/* Active Step Indicator Pill */}
              {isActive && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-indigo-500 to-cyan-400" />
              )}

              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`p-1.5 rounded-lg border ${
                      isActive
                        ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400'
                        : isPassed
                        ? 'bg-emerald-950/50 border-emerald-700/50 text-emerald-400'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider block text-slate-400 font-semibold">
                      Step 0{s.step}
                    </span>
                    <h3 className={`text-xs font-bold leading-tight ${isActive ? 'text-white' : 'text-slate-300'}`}>
                      {s.title}
                    </h3>
                  </div>
                </div>

                {/* Status Badge */}
                <span
                  className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border shrink-0 ${
                    s.isComplete
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                      : 'bg-amber-950/80 text-amber-300 border-amber-800'
                  }`}
                >
                  {s.isComplete ? 'READY' : 'REQUIRED'}
                </span>
              </div>

              <div className="text-[11px] text-slate-400 font-mono line-clamp-1 border-t border-slate-800/80 pt-1.5">
                {s.subtitle}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
