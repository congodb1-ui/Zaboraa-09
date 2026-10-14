/**
 * Automated Test Suite: Stage 1 Architecture Calculations & CIDR Utilities
 * Validates deterministic math, heterogeneous cluster sizing, N+1 multi-domain failures,
 * integer IPv4 bitwise intervals, cloud-reserved IP deductions, and platform CIDR checks.
 */

import {
  calculateClusterCapacity,
  calculateTotalInfrastructureCapacity,
  evaluateFailureScenario,
  calculateCompoundWorkloadGrowth,
  calculateReplicationBandwidthMbps,
  convertStorageUnits,
  ClusterNodeClass,
  EngineeringAssumptions,
  DEFAULT_ENGINEERING_ASSUMPTIONS
} from '../src/utils/architectureCalculator';

import {
  ipToInteger,
  integerToIp,
  getReservedAddressCount,
  parseAndValidateCidr,
  checkSubnetOverlap,
  validateSddcPlatformCidr
} from '../src/utils/cidrUtils';

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    passedCount++;
    console.log(`  [PASS] ${testName}`);
  } else {
    failedCount++;
    console.error(`  [FAIL] ${testName}: ${detail || 'Assertion failed'}`);
  }
}

console.log('\n================================================================');
console.log(' RUNNING STAGE 1 AUTOMATED CALCULATION & CIDR VERIFICATION SUITE');
console.log('================================================================\n');

// -----------------------------------------------------------------------------
// Group 1: Physical Cores vs Logical Processors (No False Inflation)
// -----------------------------------------------------------------------------
console.log('Test Group 1: Physical Cores vs. Logical Threads');

const standardNode: ClusterNodeClass = {
  id: 'cluster-prod-1',
  name: 'Production vSphere Cluster',
  hostCount: 8,
  sockets: 2,
  coresPerSocket: 32, // 64 physical cores per host
  hyperthreading: true,
  ramPerHostGB: 768,
  rawStoragePerHostTB: 19.2
};

const cap1 = calculateClusterCapacity(standardNode);
assert(cap1.physicalCores === 512, 'Calculates exact physical cores (8 hosts * 2 sockets * 32 cores = 512)');
assert(cap1.logicalProcessors === 1024, 'Calculates logical threads separately (512 * 2 = 1024)');
assert(cap1.totalRamGB === 6144, 'Calculates gross installed RAM (8 * 768 = 6144 GB)');
assert(
  cap1.usableRamGB === Number((6144 * (1 - DEFAULT_ENGINEERING_ASSUMPTIONS.hypervisorRamOverheadPct)).toFixed(1)),
  'Deducts hypervisor RAM overhead (8%) exactly once'
);

// -----------------------------------------------------------------------------
// Group 2: Heterogeneous Cluster Independent Arithmetic
// -----------------------------------------------------------------------------
console.log('\nTest Group 2: Heterogeneous Multi-Cluster Sizing');

const denseComputeCluster: ClusterNodeClass = {
  id: 'cluster-compute-dense',
  name: 'Compute Optimized Cluster',
  hostCount: 4,
  sockets: 2,
  coresPerSocket: 48, // 96 physical cores per host
  hyperthreading: true,
  ramPerHostGB: 1024,
  rawStoragePerHostTB: 7.68
};

const storageDenseCluster: ClusterNodeClass = {
  id: 'cluster-storage-dense',
  name: 'Storage Heavy Analytics Cluster',
  hostCount: 6,
  sockets: 2,
  coresPerSocket: 24, // 48 physical cores per host
  hyperthreading: true,
  ramPerHostGB: 512,
  rawStoragePerHostTB: 30.0
};

const multiClusterCap = calculateTotalInfrastructureCapacity([denseComputeCluster, storageDenseCluster]);
assert(multiClusterCap.totalHosts === 10, 'Calculates total physical hosts across heterogeneous clusters (4 + 6 = 10)');
// Cluster 1: 4 * 2 * 48 = 384 cores. Cluster 2: 6 * 2 * 24 = 288 cores. Total = 672 cores.
assert(multiClusterCap.totalPhysicalCores === 672, 'Aggregates physical cores independently (384 + 288 = 672 cores)');
// Cluster 1: 4 * 1024 = 4096 GB. Cluster 2: 6 * 512 = 3072 GB. Total = 7168 GB.
assert(multiClusterCap.totalRamGB === 7168, 'Aggregates installed RAM across clusters (4096 + 3072 = 7168 GB)');
// Cluster 1: 4 * 7.68 = 30.72 TB. Cluster 2: 6 * 30 = 180 TB. Total = 210.72 TB.
assert(multiClusterCap.totalRawStorageTB === 210.72, 'Aggregates raw storage independently without cross-averaging');

// -----------------------------------------------------------------------------
// Group 3: Multi-Domain Failure Scenarios & N+1 Headroom
// -----------------------------------------------------------------------------
console.log('\nTest Group 3: Configurable N+1 & Failure Scenarios');

// Scenario A: 1 node failure in compute cluster, 1 node failure in storage cluster
const failureScenarioA = {
  name: 'Simultaneous N+1 Failure across both clusters',
  failedHostsPerCluster: {
    'cluster-compute-dense': 1,
    'cluster-storage-dense': 1
  }
};

const workloadDemand = {
  'cluster-compute-dense': { vcpu: 500, ramGB: 2500, storageTB: 12 },
  'cluster-storage-dense': { vcpu: 300, ramGB: 2000, storageTB: 70 }
};

const scenarioResultA = evaluateFailureScenario(
  [denseComputeCluster, storageDenseCluster],
  failureScenarioA,
  workloadDemand
);

assert(scenarioResultA.totalSurvivingHosts === 8, 'Accurately computes surviving host count (10 - 2 = 8)');
assert(scenarioResultA.isAllViable === true, 'Validates that surviving capacity satisfies workload demand');

// Scenario B: Overload test where demand exceeds surviving memory
const excessiveDemand = {
  'cluster-compute-dense': { vcpu: 500, ramGB: 3500, storageTB: 12 }, // Surviving RAM for 3 nodes: 3 * 1024 * 0.92 = 2826.24 GB < 3500 GB
  'cluster-storage-dense': { vcpu: 300, ramGB: 2000, storageTB: 70 }
};

const scenarioResultB = evaluateFailureScenario(
  [denseComputeCluster, storageDenseCluster],
  failureScenarioA,
  excessiveDemand
);

assert(scenarioResultB.isAllViable === false, 'Detects capacity deficit during failure scenario');
const computeHeadroom = scenarioResultB.clusterHeadrooms.find(c => c.clusterId === 'cluster-compute-dense');
assert(
  computeHeadroom?.shortfallReasons.some(s => s.includes('RAM deficit')) === true,
  'Provides explicit actionable RAM deficit shortfall explanation'
);

// -----------------------------------------------------------------------------
// Group 4: Compound Growth, Bandwidth, and Unit Conversions
// -----------------------------------------------------------------------------
console.log('\nTest Group 4: Growth Forecasting & Unit Conversions');

// 100 VMs growing at 15% annually over 3 years: 100 * (1.15)^3 = 152.0875 -> 152.1
const futureVms = calculateCompoundWorkloadGrowth(100, 15, 3);
assert(futureVms === 152.1, 'Calculates compound growth: 100 VMs * (1.15)^3 = 152.1 VMs');

// 500 GB delta sync in 60 minutes with 25% protocol overhead:
// (500 * 8 * 1024) / 3600 = 1137.77 Mbps * 1.25 = 1422.2 Mbps
const replicationMbps = calculateReplicationBandwidthMbps(500, 60, 1.25);
assert(replicationMbps === 1422.2, 'Calculates continuous replication throughput with overhead (1422.2 Mbps)');

// Storage unit conversion: 100 TB (decimal) to TiB (binary)
// 100 * 10^12 / 2^40 = 90.95 TiB
const convertedTiB = convertStorageUnits(100, 'TB', 'TiB');
assert(convertedTiB === 90.95, 'Converts 100 TB decimal to 90.95 TiB binary accurately');

// -----------------------------------------------------------------------------
// Group 5: Integer IPv4 CIDR Calculations & Cloud Reserved IPs
// -----------------------------------------------------------------------------
console.log('\nTest Group 5: Integer-Based IPv4 CIDR Math & Cloud Deductions');

assert(ipToInteger('10.240.0.0') === 183500800, 'Converts IPv4 string to correct 32-bit integer');
assert(integerToIp(183500800) === '10.240.0.0', 'Converts 32-bit integer back to dotted-quad string');

// Cloud reservations
assert(getReservedAddressCount('azure', 24) === 5, 'Azure vNet reserves 5 IPs per subnet');
assert(getReservedAddressCount('aws', 24) === 5, 'AWS VPC reserves 5 IPs per subnet');
assert(getReservedAddressCount('gcp', 24) === 4, 'Google Cloud VPC reserves 4 IPs per subnet');
assert(getReservedAddressCount('on-premise', 24) === 2, 'On-premises traditional subnet reserves 2 IPs (.0 and .255)');

// AVS /22 block
const avsCidr = parseAndValidateCidr('10.240.0.0/22', 'avs');
assert(avsCidr.isValid === true, 'Parses valid AVS /22 CIDR');
assert(avsCidr.totalAddresses === 1024, 'AVS /22 contains 1,024 total addresses');
assert(avsCidr.usableAddresses === 1019, 'AVS /22 provides 1,019 usable addresses after 5 cloud reservations');

// Host bits warning
const unalignedCidr = parseAndValidateCidr('10.240.0.15/24', 'azure');
assert(unalignedCidr.isValid === true, 'Parses unaligned CIDR gracefully');
assert(
  unalignedCidr.warnings !== undefined && unalignedCidr.warnings[0].includes('host bits'),
  'Flags warning when active host bits are present in network address'
);

// -----------------------------------------------------------------------------
// Group 6: Subnet Overlap & Collision Detection
// -----------------------------------------------------------------------------
console.log('\nTest Group 6: Subnet Overlap & Collision Detection');

// Colliding subnets: 10.0.0.0/16 contains 10.0.1.0/24
const overlap1 = checkSubnetOverlap('10.0.0.0/16', '10.0.1.0/24');
assert(overlap1.hasOverlap === true, 'Detects collision between supernet 10.0.0.0/16 and subnet 10.0.1.0/24');

// Non-colliding subnets: 10.0.0.0/24 and 10.0.1.0/24
const overlap2 = checkSubnetOverlap('10.0.0.0/24', '10.0.1.0/24');
assert(overlap2.hasOverlap === false, 'Validates non-intersecting adjacent subnets as non-overlapping');

// -----------------------------------------------------------------------------
// Group 7: Platform-Specific SDDC CIDR Validators
// -----------------------------------------------------------------------------
console.log('\nTest Group 7: Platform-Specific SDDC CIDR Rules');

// AVS requires exact /22
const avsValid = validateSddcPlatformCidr('10.240.0.0/22', 'AVS');
assert(avsValid.isValid === true, 'AVS accepts exact /22 CIDR block');

const avsInvalid = validateSddcPlatformCidr('10.240.0.0/24', 'AVS');
assert(avsInvalid.isValid === false, 'AVS rejects /24 CIDR block with explicit /22 requirement');

// GCVE node-dependent sizing
const gcveValid = validateSddcPlatformCidr('10.100.0.0/22', 'GCVE', 8);
assert(gcveValid.isValid === true, 'GCVE accepts /22 for 8-node cluster');

const gcveTooSmall = validateSddcPlatformCidr('10.100.0.0/24', 'GCVE', 16);
assert(gcveTooSmall.isValid === false, 'GCVE rejects /24 for 16 nodes (requires at least /21)');

// -----------------------------------------------------------------------------
// Group 8: Compatibility Matrix Dynamic Filtering & Explicit Clearing
// -----------------------------------------------------------------------------
console.log('\nTest Group 8: Centralized Compatibility Matrix & Explicit Clearing');

import { evaluateCrossTierCompatibility } from '../src/data/cloudCompatibilityCatalogue';

// Incompatible storage: ANF on VMC
const compatCheck1 = evaluateCrossTierCompatibility({
  sourcePlatform: 'vmware',
  targetPlatform: 'vmc-aws',
  storageTierId: 'azure-anf'
});
assert(compatCheck1.isCompatible === false, 'Detects incompatibility: Azure NetApp Files cannot attach to VMC on AWS');
assert(compatCheck1.clearedFields.includes('storageTierId'), 'Explicitly flags storageTierId for clearing without silent substitution');
assert(compatCheck1.disabledReason !== undefined && compatCheck1.disabledReason.includes('incompatible with target platform'), 'Provides detailed disabled explanation message');

// Compatible storage: Elastic SAN on AVS Gen 2
const compatCheck2 = evaluateCrossTierCompatibility({
  sourcePlatform: 'vmware',
  targetPlatform: 'avs-gen2',
  storageTierId: 'azure-elastic-san'
});
assert(compatCheck2.isCompatible === true, 'Validates Azure Elastic SAN as certified for AVS Gen 2');

// Incompatible DR: Nutanix source to VMware SRM
const compatCheck3 = evaluateCrossTierCompatibility({
  sourcePlatform: 'nutanix',
  targetPlatform: 'nc2-azure',
  drEngineId: 'vmware-srm'
});
assert(compatCheck3.isCompatible === false, 'Detects incompatibility: VMware SRM is not certified for Nutanix source hypervisors');
assert(compatCheck3.clearedFields.includes('drEngineId'), 'Explicitly flags drEngineId for clearing');

// -----------------------------------------------------------------------------
// Group 9: Wizard State Adapter & Legacy Round-Trip Idempotence
// -----------------------------------------------------------------------------
console.log('\nTest Group 9: State Adapter & Legacy Field Preservation');

import {
  createDefaultWizardState,
  mapLegacyToWizard,
  mapWizardToLegacy,
  buildActivePromptString
} from '../src/types/wizardStateAdapter';

import { DynamicTopologyModel } from '../src/types/multiCloudBlueprint';

const sampleLegacyModel: DynamicTopologyModel = {
  templateId: 'avs',
  customerName: 'Acme Global Conglomerate',
  architectName: 'Lead Architect Jane',
  projectDate: '2026-10-13',
  environments: [
    {
      id: 'env-1',
      name: 'On-Premises HQ',
      platform: 'VMware vSphere',
      role: 'Production',
      region: 'Chicago DC',
      hostCount: 20,
      nodeSku: 'Dell R760',
      totalVcpu: 1280,
      totalRamGB: 15360,
      storageTB: 250,
      cidrBlock: '10.50.0.0/16',
      connectedEnvironmentIds: [],
      tier: 'source'
    },
    {
      id: 'env-2',
      name: 'Azure VMware Solution',
      platform: 'Azure VMware Solution',
      role: 'Disaster Recovery',
      region: 'East US',
      hostCount: 6,
      nodeSku: 'AV36P',
      totalVcpu: 432,
      totalRamGB: 4608,
      storageTB: 150,
      cidrBlock: '10.240.0.0/22',
      connectedEnvironmentIds: [],
      tier: 'target'
    }
  ],
  interconnectLinks: [],
  resilience: {
    drTopology: 'Warm Standby',
    targetRpoMinutes: 0,
    targetRtoMinutes: 15,
    replicationMode: 'Synchronous',
    replicationEngine: 'Zerto CDP',
    failoverMode: 'Orchestrated Runbook',
    failbackApproach: 'Reverse Delta Sync'
  },
  importedLegacyContext: {
    preservedExtraFields: {
      customCorporateId: 'CORP-SEC-9981',
      auditClassification: 'FedRAMP-High',
      vlans: [{ vlanId: 100, portGroup: 'Prod-DB' }]
    }
  }
};

const hydratedWizard = mapLegacyToWizard(sampleLegacyModel, sampleLegacyModel.importedLegacyContext);
assert(hydratedWizard.customerName === 'Acme Global Conglomerate', 'Hydrates customer name from legacy model');
assert(hydratedWizard.clusters[0]?.hostCount === 20, 'Hydrates source cluster host count (20 nodes)');
assert(hydratedWizard.targetNodeCount === 6, 'Hydrates target host count (6 nodes)');
assert(
  (hydratedWizard.preservedLegacyFields as any)?.customCorporateId === 'CORP-SEC-9981',
  'Preserves unrepresented customCorporateId in preservedLegacyFields'
);
assert(
  (hydratedWizard.preservedLegacyFields as any)?.auditClassification === 'FedRAMP-High',
  'Preserves unrepresented auditClassification in preservedLegacyFields'
);

// Mutate a field in wizard state and write back
hydratedWizard.customerName = 'Acme Global Conglomerate (Updated)';
const { model: writtenBackModel, legacyPatch } = mapWizardToLegacy(hydratedWizard, sampleLegacyModel);

assert(writtenBackModel.customerName === 'Acme Global Conglomerate (Updated)', 'Writes back updated customer name');
assert(
  (writtenBackModel.importedLegacyContext?.preservedExtraFields as any)?.customCorporateId === 'CORP-SEC-9981',
  'Round-trip preserves customCorporateId in updated model without deletion'
);
assert(
  legacyPatch.customCorporateId === 'CORP-SEC-9981',
  'Legacy storage patch retains customCorporateId'
);

// -----------------------------------------------------------------------------
// Group 10: Inactive DR Payload Pruning
// -----------------------------------------------------------------------------
console.log('\nTest Group 10: Active Payload Pruning for Inactive DR Settings');

// 1. DR Enabled
const promptWithDr = buildActivePromptString({
  trackTitle: 'Azure VMware Solution SDDC',
  customerName: 'Test Corp',
  architectName: 'Architect Dave',
  projectDate: '2026-10-13',
  envDescriptions: 'Prod Cluster',
  linkDescriptions: '10 Gbps ExpressRoute',
  connectivity: 'Hybrid ExpressRoute',
  landingZone: 'Virtual WAN',
  nvaFirewall: 'Palo Alto VM-Series',
  wafSolution: 'Azure WAF',
  storageNote: '120 TB ANF',
  drEnabled: true,
  drEngine: 'VMware SRM',
  drRpoMinutes: 5,
  drRtoMinutes: 20,
  drStrategy: 'Pilot Light'
});

assert(promptWithDr.includes('Replicated via VMware SRM with 5-minute RPO'), 'Includes DR SLA and engine when DR is enabled');

// 2. DR Disabled
const promptWithoutDr = buildActivePromptString({
  trackTitle: 'Azure VMware Solution SDDC',
  customerName: 'Test Corp',
  architectName: 'Architect Dave',
  projectDate: '2026-10-13',
  envDescriptions: 'Prod Cluster',
  linkDescriptions: '10 Gbps ExpressRoute',
  connectivity: 'Hybrid ExpressRoute',
  landingZone: 'Virtual WAN',
  nvaFirewall: 'Palo Alto VM-Series',
  wafSolution: 'Azure WAF',
  storageNote: '120 TB ANF',
  drEnabled: false
});

assert(
  promptWithoutDr.includes('Disaster recovery not in scope for current architecture tier'),
  'Prunes inactive DR metrics and outputs single-site statement when DR is disabled'
);
assert(
  !promptWithoutDr.includes('VMware SRM') && !promptWithoutDr.includes('5-minute RPO'),
  'Excludes phantom DR numbers from prompt when DR is disabled'
);

console.log('\n================================================================');
console.log(` RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`);
console.log('================================================================\n');

if (failedCount > 0) {
  process.exit(1);
}

