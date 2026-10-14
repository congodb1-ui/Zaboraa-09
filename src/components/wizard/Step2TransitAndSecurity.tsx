import React from 'react';
import {
  Network,
  Shield,
  ShieldAlert,
  Globe,
  Radio,
  Lock,
  ChevronLeft,
  ChevronRight,
  Info
} from 'lucide-react';
import { WizardState } from '../../types/wizardStateAdapter';

interface Step2TransitAndSecurityProps {
  wizardState: WizardState;
  onChange: (updater: (prev: WizardState) => WizardState) => void;
  onNext: () => void;
  onPrev: () => void;
}

export const Step2TransitAndSecurity: React.FC<Step2TransitAndSecurityProps> = ({
  wizardState,
  onChange,
  onNext,
  onPrev
}) => {
  const isAvsGen2 = wizardState.targetPlatform === 'avs-gen2';

  const handleToggleProvider = (provider: 'azure' | 'aws' | 'gcp') => {
    const isSelected = wizardState.selectedPublicProviders.includes(provider);
    const updated = isSelected
      ? wizardState.selectedPublicProviders.filter((p) => p !== provider)
      : [...wizardState.selectedPublicProviders, provider];
    
    // Prevent deselecting all providers
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
            Step 2 of 4
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
              <h3 className="text-sm font-bold text-white">Hybrid Cloud Connectivity Backbone</h3>
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
                    Requires AVS Gen 2 target in Step 3
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

      {/* 4. Perimeter & Deep Inspection Security */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <Shield className="w-5 h-5 text-rose-400" />
            <div>
              <h3 className="text-sm font-bold text-white">Perimeter & Deep Inspection Security Architecture</h3>
              <p className="text-xs text-slate-400">Configure firewall topologies, OEM NVA appliances, and dual-layer inspection chains.</p>
            </div>
          </div>
        </div>

        {/* Firewall Mode */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300">Firewall Architecture Mode</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                id: 'nva',
                title: 'Third-Party NVA',
                badge: 'Palo Alto / Fortinet / Check Point',
                desc: 'Dedicated enterprise Next-Gen Firewall cluster with L7 App-ID, Threat Prevention, and SSL Decryption.'
              },
              {
                id: 'native',
                title: 'Cloud Native Firewall',
                badge: 'Azure FW / AWS NFW / GCP Cloud IDS',
                desc: 'Managed cloud-native stateful firewall with built-in autoscaling and native policy management.'
              },
              {
                id: 'dual-layer',
                title: 'Dual-Layer Defense-in-Depth',
                badge: 'Native L4 Edge + NVA L7 Core',
                desc: 'High-security layered security combining cloud edge filtering with deep enterprise inspection.'
              }
            ].map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => onChange((prev) => ({ ...prev, firewallMode: mode.id as any }))}
                className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
                  wizardState.firewallMode === mode.id
                    ? 'bg-rose-950/60 border-rose-500 shadow-md ring-1 ring-rose-500/30'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-bold text-white">{mode.title}</div>
                <div className="text-[10px] font-mono text-rose-300 my-0.5">{mode.badge}</div>
                <div className="text-[11px] text-slate-400 line-clamp-2">{mode.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Dual-Layer Flow Option */}
        {wizardState.firewallMode === 'dual-layer' && (
          <div className="p-4 rounded-xl bg-slate-950 border border-rose-900/60 space-y-2 animate-in fade-in">
            <span className="text-xs font-bold text-rose-300">Dual-Layer Inspection Flow Architecture</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              {[
                { id: 'sequential', name: 'Sequential Perimeter', desc: 'Native L4 Edge -> NVA L7 NGFW in series' },
                { id: 'zero-trust-chaining', name: 'Zero-Trust Chaining', desc: 'Host NSX Distributed FW + NVA Perimeter' },
                { id: 'asymmetric-specialized', name: 'Asymmetric Split', desc: 'Inbound through WAF/NVA, egress via Native' }
              ].map((flow) => (
                <button
                  key={flow.id}
                  type="button"
                  onClick={() => onChange((prev) => ({ ...prev, dualLayerInspectionFlow: flow.id as any }))}
                  className={`p-2.5 rounded-lg border text-left transition cursor-pointer ${
                    wizardState.dualLayerInspectionFlow === flow.id
                      ? 'bg-rose-900/40 border-rose-500 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="font-semibold text-xs text-white">{flow.name}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{flow.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Firewall Provider Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Primary Firewall Provider / Appliance</label>
            <select
              value={wizardState.firewallProvider}
              onChange={(e) => onChange((prev) => ({ ...prev, firewallProvider: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-white focus:border-cyan-500 focus:outline-none"
            >
              <option value="Palo Alto Networks VM-Series">Palo Alto Networks VM-Series (Panorama Orchestrated)</option>
              <option value="Fortinet FortiGate-VM">Fortinet FortiGate-VM (Security Fabric)</option>
              <option value="Check Point CloudGuard">Check Point CloudGuard Network Security</option>
              <option value="Cisco Secure Firewall">Cisco Secure Firewall (Threat Defense)</option>
              <option value="Azure Firewall Premium / Native">Azure Firewall Premium (IDPS & URL Filtering)</option>
            </select>
          </div>

          {/* Web Application Firewall (WAF) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">Web Application Firewall (WAF)</label>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="wafToggle"
                  checked={wizardState.wafEnabled}
                  onChange={(e) => onChange((prev) => ({ ...prev, wafEnabled: e.target.checked }))}
                  className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
                />
                <label htmlFor="wafToggle" className="text-xs text-slate-200 cursor-pointer font-medium">
                  Enable WAF Inspection
                </label>
              </div>
            </div>

            {wizardState.wafEnabled && (
              <select
                value={wizardState.wafSolution || 'Azure WAF on Application Gateway'}
                onChange={(e) => onChange((prev) => ({ ...prev, wafSolution: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-cyan-300 focus:border-cyan-500 focus:outline-none"
              >
                <option value="Azure WAF on Application Gateway">Azure WAF on Application Gateway (OWASP 3.2)</option>
                <option value="AWS WAF">AWS WAF with Managed Rulesets</option>
                <option value="Cloudflare Magic Transit">Cloudflare Magic Transit & Distributed WAF</option>
                <option value="F5 Distributed Cloud WAF">F5 Distributed Cloud WAF / BIG-IP VE</option>
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Step 2 Completion Navigation Footer */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onPrev}
          className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-semibold text-xs flex items-center gap-2 cursor-pointer transition"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Step 1: Scope & Source</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 cursor-pointer transition-all hover:scale-[1.02]"
        >
          <span>Continue to Step 3: Target Platform</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
