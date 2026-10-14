import React from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Globe,
  Sliders,
  ChevronLeft,
  ChevronRight,
  Info,
  CheckCircle2
} from 'lucide-react';
import { WizardState } from '../../types/wizardStateAdapter';

interface Step3SecurityAndWAFProps {
  wizardState: WizardState;
  onChange: (updater: (prev: WizardState) => WizardState) => void;
  onNext: () => void;
  onPrev: () => void;
}

export const Step3SecurityAndWAF: React.FC<Step3SecurityAndWAFProps> = ({
  wizardState,
  onChange,
  onNext,
  onPrev
}) => {
  return (
    <div className="space-y-6">
      {/* 1. Perimeter & Deep Inspection Security Architecture */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-5 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <Shield className="w-5 h-5 text-rose-400" />
            <div>
              <h3 className="text-sm font-bold text-white">Firewall & Perimeter Security Architecture</h3>
              <p className="text-xs text-slate-400">
                Configure next-generation firewall appliances, cloud-native inspection, and dual-tier routing chains.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
            Step 3: Security & WAF
          </span>
        </div>

        {/* Firewall Architecture Mode */}
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
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
            <label className="text-xs font-semibold text-rose-300 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>Dual-Layer Traffic Flow & Inspection Strategy</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {[
                {
                  id: 'sequential',
                  title: 'Sequential In-Line Flow',
                  desc: 'Ingress traffic traverses Cloud Native FW for fast L4 DDoS/SYN filtering, then NVA for L7 App-ID.'
                },
                {
                  id: 'zero-trust-chaining',
                  title: 'Zero-Trust Chaining',
                  desc: 'Every east-west packet between SDDC and Cloud Native subnets is inspected by internal NVA clusters.'
                },
                {
                  id: 'asymmetric-specialized',
                  title: 'Asymmetric Specialized',
                  desc: 'Internet ingress filtered by Native FW; SDDC-to-On-Prem filtered exclusively by corporate NVA.'
                }
              ].map((flow) => (
                <button
                  key={flow.id}
                  type="button"
                  onClick={() => onChange((prev) => ({ ...prev, dualLayerInspectionFlow: flow.id as any }))}
                  className={`p-3 rounded-lg border text-left transition cursor-pointer ${
                    wizardState.dualLayerInspectionFlow === flow.id
                      ? 'bg-rose-900/40 border-rose-400 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs font-bold text-white">{flow.title}</div>
                  <div className="text-[10px] text-slate-400 mt-1 line-clamp-2">{flow.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* OEM NVA Vendor Selection */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300">Enterprise Firewall Appliance / NVA Provider</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              {
                id: 'Palo Alto Networks VM-Series',
                name: 'Palo Alto Networks VM-Series',
                desc: 'Industry-standard PAN-OS with WildFire, Advanced Threat Prevention, and Panorama central management.'
              },
              {
                id: 'Fortinet FortiGate-VM',
                name: 'Fortinet FortiGate-VM',
                desc: 'High-throughput FortiOS with unified SASE, SD-WAN, and Security Fabric orchestration.'
              },
              {
                id: 'Check Point CloudGuard Network',
                name: 'Check Point CloudGuard',
                desc: 'Advanced threat prevention with Infinity architecture and unified multi-cloud security policies.'
              },
              {
                id: 'Azure Firewall Premium / Native',
                name: 'Azure Firewall Premium',
                desc: 'Cloud-native stateful firewall with built-in TLS inspection, IDPS, URL filtering, and web categories.'
              }
            ].map((fw) => (
              <button
                key={fw.id}
                type="button"
                onClick={() => onChange((prev) => ({ ...prev, firewallProvider: fw.id }))}
                className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
                  wizardState.firewallProvider === fw.id
                    ? 'bg-rose-950/60 border-rose-500 shadow-md ring-1 ring-rose-500/30'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-bold text-white">{fw.name}</div>
                <div className="text-[11px] text-slate-400 mt-1 line-clamp-2">{fw.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Web Application Firewall (WAF) Architecture */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <Lock className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="text-sm font-bold text-white">Web Application Firewall (WAF) Protection</h3>
              <p className="text-xs text-slate-400">Protect HTTP/S web workloads and APIs against OWASP Top 10 vulnerabilities.</p>
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
            <input
              type="checkbox"
              checked={wizardState.wafEnabled}
              onChange={(e) => onChange((prev) => ({ ...prev, wafEnabled: e.target.checked }))}
              className="rounded bg-slate-900 border-slate-700 text-indigo-500"
            />
            <span className="text-xs font-semibold text-slate-200">Enable WAF</span>
          </label>
        </div>

        {wizardState.wafEnabled ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 animate-in fade-in">
            {[
              {
                id: 'Azure WAF on Application Gateway',
                title: 'Azure WAF (App Gateway v2)',
                desc: 'Native Layer 7 load balancer with managed Core Rule Set (CRS 3.2), bot management, and SSL offload.'
              },
              {
                id: 'AWS WAF',
                title: 'AWS WAF on ALB / CloudFront',
                desc: 'Highly scalable web ACLs with AWS Managed Rules, rate limiting, and bot control.'
              },
              {
                id: 'Cloudflare Magic Transit',
                title: 'Cloudflare Magic WAN / WAF',
                desc: 'Global Anycast edge WAF with automated DDoS mitigation, origin cloaking, and smart routing.'
              },
              {
                id: 'F5 Distributed Cloud WAF',
                title: 'F5 Distributed Cloud WAF',
                desc: 'SaaS-based AI-powered application security with behavioral analysis and API discovery.'
              }
            ].map((waf) => (
              <button
                key={waf.id}
                type="button"
                onClick={() => onChange((prev) => ({ ...prev, wafSolution: waf.id }))}
                className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
                  wizardState.wafSolution === waf.id
                    ? 'bg-indigo-950/60 border-indigo-500 shadow-md ring-1 ring-indigo-500/30'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-bold text-white">{waf.title}</div>
                <div className="text-[11px] text-slate-400 mt-1 line-clamp-2">{waf.desc}</div>
              </button>
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
            <Info className="w-4 h-4 text-slate-500 shrink-0" />
            <span>Web Application Firewall is currently disabled. Ingress web traffic will route directly through Layer 4 gateways.</span>
          </div>
        )}
      </div>

      {/* Security Summary Strip */}
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span className="text-slate-300">Active Security Posture:</span>
          <span className="font-bold text-rose-300 uppercase">{wizardState.firewallMode} Mode</span>
          <span className="text-slate-500">·</span>
          <span className="text-white">{wizardState.firewallProvider}</span>
        </div>
        <div className="flex items-center gap-2 text-indigo-300">
          <Lock className="w-3.5 h-3.5 text-indigo-400" />
          <span>WAF: {wizardState.wafEnabled ? (wizardState.wafSolution || 'Active') : 'Disabled'}</span>
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
          <span>Previous: Transit & Routing</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 cursor-pointer transition"
        >
          <span>Next: Step 4 (Target SDDC & DR)</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
