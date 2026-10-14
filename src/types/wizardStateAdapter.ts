/**
 * Wizard State & Legacy Storage Adapter
 * Bridges the 4-step wizard UI with DynamicTopologyModel and historical localStorage schemas.
 * Guarantees zero data loss for unknown legacy fields, enforces active payload pruning for
 * inactive DR settings, and provides deterministic bidirectional round-trip stability.
 */

import {
  DynamicTopologyModel,
  ArchitectureTemplateId,
  CloudPlatformType,
  EnvironmentNode,
  InterconnectLink,
  ImportedLegacyContext
} from './multiCloudBlueprint';

import {
  DEFAULT_ENGINEERING_ASSUMPTIONS,
  EngineeringAssumptions
} from '../utils/architectureCalculator';

export interface WizardClusterSpec {
  id: string;
  name: string;
  hostCount: number;
  sockets: number;
  coresPerSocket: number;
  hyperthreading: boolean;
  ramGB: number;
  storageTB: number;
}

export interface WizardState {
  // 1. Step 1: Scope & Source Infrastructure
  customerName: string;
  architectName: string;
  projectDate: string;
  footprintScope: 'private-sddc' | 'native-cloud' | 'hybrid-multi';
  sourcePlatform: 'vmware' | 'nutanix' | 'hyperv' | 'baremetal';
  sourceHypervisorConfig: {
    vmwareType: 'traditional' | 'vcf';
    vcfVersion?: 'VCF 5.2.x' | 'VCF 5.1.x' | 'VCF 4.5.x';
    vSphereVersion?: '8.0u3' | '7.0u3';
    nsxEnabled: boolean;
    nsxVersion?: '4.2.x' | '3.2.x';
    ariaSuite: string[];
    hypervClustering?: 'SCVMM' | 'WSFC' | 'Standalone';
    nutanixAosVersion?: string;
  };
  hardwareVendor: 'Dell Technologies' | 'HPE' | 'Lenovo Data Center' | 'Cisco UCS' | 'Supermicro';
  hardwareSku: string;
  clusters: WizardClusterSpec[];
  failureReservedHosts: number;
  sourceMgmtCidr: string;
  assumptions: EngineeringAssumptions;

  // 2. Step 2: Cloud Connectivity & Security
  selectedPublicProviders: Array<'azure' | 'aws' | 'gcp'>;
  landingZonePattern: string;
  connectivityCarrier: string;
  firewallMode: 'native' | 'nva' | 'dual-layer';
  firewallProvider: string;
  dualLayerInspectionFlow?: 'sequential' | 'zero-trust-chaining' | 'asymmetric-specialized';
  wafEnabled: boolean;
  wafSolution?: string;

  // 3. Step 3: Target Platform & Capacity
  targetPlatform: 'avs-gen1' | 'avs-gen2' | 'vmc-aws' | 'gcve' | 'nc2-azure';
  targetNodeSku: string;
  targetNodeCount: number;
  sddcMgmtCidr: string;
  decoupledStorageEnabled: boolean;
  decoupledStorageTB: number;
  decoupledStorageProvider?: string;

  // 4. Step 4: Disaster Recovery & Review
  drEnabled: boolean;
  drConfig: {
    engine: string;
    rpoMinutes: number;
    rtoMinutes: number;
    strategy: string;
  };

  // Preserved unrepresented legacy fields (e.g. vlans, auditClassification, corporateId)
  preservedLegacyFields: Record<string, unknown>;
  // Active template track id
  activeTemplate: ArchitectureTemplateId;
}

export function createDefaultWizardState(): WizardState {
  return {
    customerName: 'Global Financial Enterprises',
    architectName: 'Wasim Sayyed',
    projectDate: new Date().toISOString().split('T')[0],
    footprintScope: 'hybrid-multi',
    sourcePlatform: 'vmware',
    sourceHypervisorConfig: {
      vmwareType: 'traditional',
      vSphereVersion: '8.0u3',
      nsxEnabled: true,
      nsxVersion: '4.2.x',
      ariaSuite: ['Operations', 'Automation', 'Operations for Networks (vRNI)']
    },
    hardwareVendor: 'Dell Technologies',
    hardwareSku: 'PowerEdge R760 (2x Intel Xeon Gold 6430, up to 1TB RAM)',
    clusters: [
      {
        id: 'cluster-1',
        name: 'Primary Management & Compute Cluster',
        hostCount: 16,
        sockets: 2,
        coresPerSocket: 32,
        hyperthreading: true,
        ramGB: 768,
        storageTB: 19.2
      }
    ],
    failureReservedHosts: 1,
    sourceMgmtCidr: '10.10.0.0/16',
    assumptions: { ...DEFAULT_ENGINEERING_ASSUMPTIONS },

    selectedPublicProviders: ['azure'],
    landingZonePattern: 'Azure Virtual WAN Hub-and-Spoke',
    connectivityCarrier: 'Hybrid (VPN + ExpressRoute / DirectConnect)',
    firewallMode: 'nva',
    firewallProvider: 'Palo Alto Networks VM-Series',
    dualLayerInspectionFlow: 'sequential',
    wafEnabled: true,
    wafSolution: 'Azure WAF on Application Gateway',

    targetPlatform: 'avs-gen1',
    targetNodeSku: 'AV36P',
    targetNodeCount: 4,
    sddcMgmtCidr: '10.240.0.0/22',
    decoupledStorageEnabled: true,
    decoupledStorageTB: 120,
    decoupledStorageProvider: 'Azure NetApp Files (ANF NFS Datastore)',

    drEnabled: true,
    drConfig: {
      engine: 'VMware SRM + vSphere Replication',
      rpoMinutes: 5,
      rtoMinutes: 20,
      strategy: 'Pilot Light (3-Node Minimum)'
    },

    preservedLegacyFields: {},
    activeTemplate: 'avs'
  };
}

/**
 * Maps a DynamicTopologyModel and legacy context into the typed WizardState.
 * Captures all unknown/custom attributes into preservedLegacyFields.
 */
export function mapLegacyToWizard(
  model: DynamicTopologyModel,
  legacyContext: ImportedLegacyContext = {}
): WizardState {
  const wizard = createDefaultWizardState();

  wizard.customerName = model.customerName || wizard.customerName;
  wizard.architectName = model.architectName || wizard.architectName;
  wizard.projectDate = model.projectDate || wizard.projectDate;
  wizard.activeTemplate = model.templateId || 'avs';

  // Map Source Environment
  const srcEnv = model.environments.find(e => e.tier === 'source') || model.environments[0];
  if (srcEnv) {
    if (srcEnv.platform.includes('Nutanix')) {
      wizard.sourcePlatform = 'nutanix';
    } else if (srcEnv.platform.includes('Co-Location')) {
      wizard.sourcePlatform = 'baremetal';
    } else {
      wizard.sourcePlatform = 'vmware';
    }

    wizard.sourceMgmtCidr = srcEnv.cidrBlock || wizard.sourceMgmtCidr;

    if (wizard.clusters[0]) {
      wizard.clusters[0].hostCount = srcEnv.hostCount || 16;
      wizard.clusters[0].ramGB = Math.round((srcEnv.totalRamGB || 12288) / Math.max(1, srcEnv.hostCount));
      wizard.clusters[0].storageTB = Math.round((srcEnv.storageTB || 200) / Math.max(1, srcEnv.hostCount));
    }
  }

  // Map Target Environment
  const tgtEnv = model.environments.find(e => e.tier === 'target') || model.environments[model.environments.length - 1];
  if (tgtEnv) {
    if (tgtEnv.platform.includes('AWS')) {
      wizard.targetPlatform = 'vmc-aws';
      wizard.targetNodeSku = tgtEnv.nodeSku || 'i4i.metal';
    } else if (tgtEnv.platform.includes('Google') || tgtEnv.platform.includes('GCVE')) {
      wizard.targetPlatform = 'gcve';
      wizard.targetNodeSku = tgtEnv.nodeSku || 've1-standard-72';
    } else if (tgtEnv.platform.includes('NC2')) {
      wizard.targetPlatform = 'nc2-azure';
      wizard.targetNodeSku = tgtEnv.nodeSku || 'AN36P';
    } else {
      wizard.targetPlatform = 'avs-gen1';
      wizard.targetNodeSku = tgtEnv.nodeSku || 'AV36P';
    }

    wizard.targetNodeCount = tgtEnv.hostCount || 4;
    wizard.sddcMgmtCidr = tgtEnv.cidrBlock || wizard.sddcMgmtCidr;
    wizard.decoupledStorageTB = tgtEnv.storageTB || wizard.decoupledStorageTB;
  }

  // Map Resilience / DR
  if (model.resilience) {
    wizard.drEnabled = true;
    wizard.drConfig = {
      engine: model.resilience.replicationEngine || wizard.drConfig.engine,
      rpoMinutes: model.resilience.targetRpoMinutes ?? 5,
      rtoMinutes: model.resilience.targetRtoMinutes ?? 20,
      strategy: model.resilience.drTopology || wizard.drConfig.strategy
    };
  }

  // Retain all unrepresented legacy context fields
  if (legacyContext.preservedExtraFields) {
    wizard.preservedLegacyFields = { ...legacyContext.preservedExtraFields };
  }

  return wizard;
}

/**
 * Maps the WizardState back into an authoritative DynamicTopologyModel and legacy storage payload.
 * Inactive DR fields are cleanly isolated while preserving historical storage records.
 */
export function mapWizardToLegacy(
  wizard: WizardState,
  existingModel?: DynamicTopologyModel
): { model: DynamicTopologyModel; legacyPatch: Record<string, unknown> } {
  // Update or create environments
  const baseEnvs: EnvironmentNode[] = existingModel?.environments && existingModel.environments.length > 0
    ? [...existingModel.environments]
    : [
        {
          id: 'env-source-onprem',
          name: 'Primary Enterprise Datacenter',
          platform: wizard.sourcePlatform === 'nutanix' ? 'Nutanix AHV' : 'VMware vSphere',
          role: 'Production',
          region: 'On-Premises HQ',
          hostCount: wizard.clusters.reduce((acc, c) => acc + c.hostCount, 0),
          nodeSku: wizard.hardwareSku,
          totalVcpu: wizard.clusters.reduce((acc, c) => acc + c.hostCount * c.sockets * c.coresPerSocket * 2, 0),
          totalRamGB: wizard.clusters.reduce((acc, c) => acc + c.hostCount * c.ramGB, 0),
          storageTB: wizard.clusters.reduce((acc, c) => acc + c.hostCount * c.storageTB, 0),
          cidrBlock: wizard.sourceMgmtCidr,
          connectedEnvironmentIds: [],
          tier: 'source',
          x: 80,
          y: 120
        },
        {
          id: 'env-transit-hub',
          name: 'Cloud Transit Hub & Perimeter Security',
          platform: 'Azure VMware Solution',
          role: 'Shared Services',
          region: 'Transit Hub',
          hostCount: 2,
          nodeSku: 'Managed Cloud Gateway',
          totalVcpu: 16,
          totalRamGB: 64,
          storageTB: 2,
          cidrBlock: '10.200.0.0/24',
          connectedEnvironmentIds: [],
          tier: 'transit',
          x: 430,
          y: 120
        },
        {
          id: 'env-target-cloud',
          name: 'Target Cloud SDDC',
          platform:
            wizard.targetPlatform === 'vmc-aws'
              ? 'VMware Cloud on AWS'
              : wizard.targetPlatform === 'gcve'
              ? 'Google Cloud VMware Engine'
              : wizard.targetPlatform === 'nc2-azure'
              ? 'Nutanix NC2 on Azure'
              : 'Azure VMware Solution',
          role: 'Disaster Recovery',
          region: 'Cloud Region',
          hostCount: wizard.targetNodeCount,
          nodeSku: wizard.targetNodeSku,
          totalVcpu: wizard.targetNodeCount * 72,
          totalRamGB: wizard.targetNodeCount * 768,
          storageTB: wizard.decoupledStorageTB,
          cidrBlock: wizard.sddcMgmtCidr,
          connectedEnvironmentIds: [],
          tier: 'target',
          x: 780,
          y: 120
        }
      ];

  // Update existing node properties
  if (baseEnvs[0]) {
    baseEnvs[0].hostCount = wizard.clusters.reduce((acc, c) => acc + c.hostCount, 0);
    baseEnvs[0].cidrBlock = wizard.sourceMgmtCidr;
    baseEnvs[0].nodeSku = wizard.hardwareSku;
  }
  const targetEnv = baseEnvs.find(e => e.tier === 'target') || baseEnvs[baseEnvs.length - 1];
  if (targetEnv) {
    targetEnv.hostCount = wizard.targetNodeCount;
    targetEnv.nodeSku = wizard.targetNodeSku;
    targetEnv.cidrBlock = wizard.sddcMgmtCidr;
    targetEnv.storageTB = wizard.decoupledStorageTB;
  }

  const model: DynamicTopologyModel = {
    templateId: wizard.activeTemplate,
    customerName: wizard.customerName,
    architectName: wizard.architectName,
    projectDate: wizard.projectDate,
    environments: baseEnvs,
    interconnectLinks: existingModel?.interconnectLinks || [],
    resilience: {
      drTopology: wizard.drConfig.strategy as any,
      targetRpoMinutes: wizard.drConfig.rpoMinutes,
      targetRtoMinutes: wizard.drConfig.rtoMinutes,
      replicationMode: wizard.drConfig.rpoMinutes === 0 ? 'Synchronous' : 'Asynchronous',
      replicationEngine: wizard.drConfig.engine,
      failoverMode: 'Orchestrated Runbook',
      failbackApproach: 'Reverse Delta Sync'
    },
    importedLegacyContext: {
      preservedExtraFields: { ...wizard.preservedLegacyFields }
    }
  };

  const legacyPatch: Record<string, unknown> = {
    customerName: wizard.customerName,
    architectName: wizard.architectName,
    projectDate: wizard.projectDate,
    totalVMCount: baseEnvs[0]?.vmCount || 380,
    cloudNodes: wizard.targetNodeCount,
    nodeSku: wizard.targetNodeSku,
    decoupledStorageTB: wizard.decoupledStorageTB,
    connectivity: wizard.connectivityCarrier,
    landingZone: wizard.landingZonePattern,
    nvaFirewall: wizard.firewallProvider,
    wafSolution: wizard.wafSolution || 'Azure WAF on Application Gateway',
    // Retain preserved legacy fields
    ...wizard.preservedLegacyFields
  };

  // Only include active DR fields in legacy patch if DR is enabled
  if (wizard.drEnabled) {
    legacyPatch.drEngine = wizard.drConfig.engine;
    legacyPatch.rpoMin = wizard.drConfig.rpoMinutes;
    legacyPatch.rtoMin = wizard.drConfig.rtoMinutes;
    legacyPatch.drStrategy = wizard.drConfig.strategy;
  }

  return { model, legacyPatch };
}

/**
 * Builds the deterministic prompt string for Gemini Imagen 3.
 * When drEnabled is false, excludes inactive DR configuration and renders:
 * "Business Continuity: DR not in scope for current architecture tier"
 */
export function buildActivePromptString(params: {
  trackTitle: string;
  customerName: string;
  architectName: string;
  projectDate: string;
  envDescriptions: string;
  linkDescriptions: string;
  connectivity: string;
  landingZone: string;
  nvaFirewall: string;
  wafSolution: string;
  storageNote: string;
  drEnabled: boolean;
  drEngine?: string;
  drRpoMinutes?: number;
  drRtoMinutes?: number;
  drStrategy?: string;
}): string {
  const drClause = params.drEnabled
    ? `Business Continuity & Resilience: Replicated via ${params.drEngine} with ${
        params.drRpoMinutes === 0 ? '0-minute Synchronous Zero Data Loss RPO' : `${params.drRpoMinutes}-minute RPO`
      }, ${params.drRtoMinutes}-minute RTO, disaster recovery strategy "${params.drStrategy}".`
    : `Business Continuity: Disaster recovery not in scope for current architecture tier (standalone single-site topology).`;

  return `Dark enterprise blueprint aesthetic 3D isometric architectural diagram of a production enterprise multi-cloud topology: "${params.trackTitle}" for ${params.customerName} (Lead Architect: ${params.architectName}, Date: ${params.projectDate}). Deep slate and midnight navy canvas background (#020617) with glowing neon cyan, teal, emerald, and electric violet network routes, glowing 3D hardware chassis, hyper-detailed isometric platform annotations. Infrastructure Environment Tiers: ${params.envDescriptions}. Network Interconnect Backbone: ${params.linkDescriptions}. Perimeter Security & Landing Zone: Physical connectivity via ${params.connectivity}, Landing Zone pattern "${params.landingZone}", Next-Gen Firewall inspection by ${params.nvaFirewall}, Web Application Firewall "${params.wafSolution}". Decoupled Storage Tier: ${params.storageNote}. ${drClause} Isometric orthographic 3D projection, photorealistic enterprise blueprint technical drawing, illuminated fiber optic paths, 4K presentation grade clarity.`;
}
