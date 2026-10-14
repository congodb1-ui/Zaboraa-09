/**
 * Architecture & Capacity Calculation Engine
 * Pure, deterministic TypeScript utilities for enterprise cloud infrastructure sizing.
 * Distinguishes physical cores from logical threads, implements heterogeneous cluster sizing,
 * multi-domain failure scenario analysis, explicit storage efficiency, and replication bandwidth.
 */

export interface ClusterNodeClass {
  id: string;
  name: string;
  hostCount: number;
  sockets: number;
  coresPerSocket: number;
  hyperthreading: boolean;
  ramPerHostGB: number;
  rawStoragePerHostTB: number;
}

export interface EngineeringAssumptions {
  /** Target maximum vCPU to physical core ratio (e.g. 2.5 for general, 1.5 for mission-critical DB) */
  maxOversubscriptionRatio: number;
  /** Percentage of RAM reserved for hypervisor, agents, and CVM (e.g. 0.08 for 8%) */
  hypervisorRamOverheadPct: number;
  /** Percentage of CPU capacity reserved for hypervisor/ESXi/system daemons (e.g. 0.10 for 10%) */
  hypervisorCpuReservationPct: number;
  /** Storage protection factor: RAID-1 / Mirror = 2.0, RAID-5 / EC = 1.33, RAID-6 / EC = 1.50 */
  storageProtectionFactor: number;
  /** Slack space reserved to prevent storage lockup during rebuilds/snapshots (e.g. 0.20 for 20%) */
  storageSlackSpacePct: number;
  /** Deduplication & compression efficiency factor (default 1.0 = unassumed; >1.0 only with proven workload data) */
  storageEfficiencyRatio: number;
}

export const DEFAULT_ENGINEERING_ASSUMPTIONS: EngineeringAssumptions = {
  maxOversubscriptionRatio: 2.5,
  hypervisorRamOverheadPct: 0.08,
  hypervisorCpuReservationPct: 0.10,
  storageProtectionFactor: 1.33, // RAID-5 default
  storageSlackSpacePct: 0.20,
  storageEfficiencyRatio: 1.0 // Unassumed baseline
};

export interface ClusterCapacityResult {
  clusterId: string;
  clusterName: string;
  hostCount: number;
  physicalCores: number;
  logicalProcessors: number;
  totalRamGB: number;
  usableRamGB: number;
  rawStorageTB: number;
  usableStorageTB: number;
  maxRecommendedWorkloadVcpu: number;
}

export interface TotalCapacityResult {
  totalHosts: number;
  totalPhysicalCores: number;
  totalLogicalProcessors: number;
  totalRamGB: number;
  totalUsableRamGB: number;
  totalRawStorageTB: number;
  totalUsableStorageTB: number;
  maxRecommendedWorkloadVcpu: number;
  clusterBreakdowns: ClusterCapacityResult[];
}

export interface FailureScenarioConfig {
  name: string;
  /** Map of clusterId to count of failed hosts in that failure domain */
  failedHostsPerCluster: Record<string, number>;
}

export interface SurvivingCapacityHeadroom {
  clusterId: string;
  clusterName: string;
  survivingHosts: number;
  survivingPhysicalCores: number;
  survivingUsableRamGB: number;
  survivingUsableStorageTB: number;
  workloadVcpuCapacity: number;
  isViable: boolean;
  shortfallReasons: string[];
}

export interface FailureScenarioResult {
  scenarioName: string;
  totalSurvivingHosts: number;
  totalSurvivingCores: number;
  totalSurvivingUsableRamGB: number;
  totalSurvivingUsableStorageTB: number;
  isAllViable: boolean;
  clusterHeadrooms: SurvivingCapacityHeadroom[];
}

/**
 * Computes deterministic cluster capacity metrics for a single host class / cluster.
 */
export function calculateClusterCapacity(
  cluster: ClusterNodeClass,
  assumptions: EngineeringAssumptions = DEFAULT_ENGINEERING_ASSUMPTIONS
): ClusterCapacityResult {
  if (cluster.hostCount <= 0) {
    return {
      clusterId: cluster.id,
      clusterName: cluster.name,
      hostCount: 0,
      physicalCores: 0,
      logicalProcessors: 0,
      totalRamGB: 0,
      usableRamGB: 0,
      rawStorageTB: 0,
      usableStorageTB: 0,
      maxRecommendedWorkloadVcpu: 0
    };
  }

  const physicalCores = cluster.hostCount * cluster.sockets * cluster.coresPerSocket;
  const logicalProcessors = cluster.hyperthreading ? physicalCores * 2 : physicalCores;
  const totalRamGB = cluster.hostCount * cluster.ramPerHostGB;

  // Hypervisor RAM overhead deducted exactly once
  const usableRamGB = Math.max(0, totalRamGB * (1 - assumptions.hypervisorRamOverheadPct));

  const rawStorageTB = cluster.hostCount * cluster.rawStoragePerHostTB;

  // Usable storage calculation: Raw * (1 - slack) * efficiency / protectionFactor
  const usableStorageTB = Math.max(
    0,
    (rawStorageTB * (1 - assumptions.storageSlackSpacePct) * assumptions.storageEfficiencyRatio) /
      assumptions.storageProtectionFactor
  );

  // Maximum recommended vCPU workload based on surviving physical cores and oversubscription
  const effectivePhysicalCores = physicalCores * (1 - assumptions.hypervisorCpuReservationPct);
  const maxRecommendedWorkloadVcpu = Math.floor(
    effectivePhysicalCores * assumptions.maxOversubscriptionRatio
  );

  return {
    clusterId: cluster.id,
    clusterName: cluster.name,
    hostCount: cluster.hostCount,
    physicalCores,
    logicalProcessors,
    totalRamGB,
    usableRamGB: Number(usableRamGB.toFixed(1)),
    rawStorageTB,
    usableStorageTB: Number(usableStorageTB.toFixed(1)),
    maxRecommendedWorkloadVcpu
  };
}

/**
 * Calculates aggregate capacity across multiple heterogeneous or homogeneous clusters.
 */
export function calculateTotalInfrastructureCapacity(
  clusters: ClusterNodeClass[],
  assumptions: EngineeringAssumptions = DEFAULT_ENGINEERING_ASSUMPTIONS
): TotalCapacityResult {
  const clusterBreakdowns = clusters.map(c => calculateClusterCapacity(c, assumptions));

  return {
    totalHosts: clusterBreakdowns.reduce((acc, c) => acc + c.hostCount, 0),
    totalPhysicalCores: clusterBreakdowns.reduce((acc, c) => acc + c.physicalCores, 0),
    totalLogicalProcessors: clusterBreakdowns.reduce((acc, c) => acc + c.logicalProcessors, 0),
    totalRamGB: clusterBreakdowns.reduce((acc, c) => acc + c.totalRamGB, 0),
    totalUsableRamGB: Number(
      clusterBreakdowns.reduce((acc, c) => acc + c.usableRamGB, 0).toFixed(1)
    ),
    totalRawStorageTB: clusterBreakdowns.reduce((acc, c) => acc + c.rawStorageTB, 0),
    totalUsableStorageTB: Number(
      clusterBreakdowns.reduce((acc, c) => acc + c.usableStorageTB, 0).toFixed(1)
    ),
    maxRecommendedWorkloadVcpu: clusterBreakdowns.reduce(
      (acc, c) => acc + c.maxRecommendedWorkloadVcpu,
      0
    ),
    clusterBreakdowns
  };
}

/**
 * Validates surviving capacity during an explicit failure scenario (e.g. N+1 host failure, rack failure).
 */
export function evaluateFailureScenario(
  clusters: ClusterNodeClass[],
  scenario: FailureScenarioConfig,
  workloadDemandPerCluster: Record<string, { vcpu: number; ramGB: number; storageTB: number }>,
  assumptions: EngineeringAssumptions = DEFAULT_ENGINEERING_ASSUMPTIONS
): FailureScenarioResult {
  const clusterHeadrooms: SurvivingCapacityHeadroom[] = [];

  for (const cluster of clusters) {
    const failedCount = scenario.failedHostsPerCluster[cluster.id] ?? 0;
    const survivingHosts = Math.max(0, cluster.hostCount - failedCount);

    const survivingCluster: ClusterNodeClass = {
      ...cluster,
      hostCount: survivingHosts
    };

    const capacity = calculateClusterCapacity(survivingCluster, assumptions);
    const demand = workloadDemandPerCluster[cluster.id] ?? { vcpu: 0, ramGB: 0, storageTB: 0 };

    const shortfalls: string[] = [];
    if (demand.vcpu > capacity.maxRecommendedWorkloadVcpu) {
      shortfalls.push(
        `vCPU deficit: Required ${demand.vcpu} vCPUs exceeds surviving capacity of ${capacity.maxRecommendedWorkloadVcpu} vCPUs (ratio ${assumptions.maxOversubscriptionRatio}:1)`
      );
    }
    if (demand.ramGB > capacity.usableRamGB) {
      shortfalls.push(
        `RAM deficit: Required ${demand.ramGB} GB RAM exceeds surviving usable RAM of ${capacity.usableRamGB} GB`
      );
    }
    if (demand.storageTB > capacity.usableStorageTB) {
      shortfalls.push(
        `Storage deficit: Required ${demand.storageTB} TB exceeds surviving usable storage of ${capacity.usableStorageTB} TB`
      );
    }

    clusterHeadrooms.push({
      clusterId: cluster.id,
      clusterName: cluster.name,
      survivingHosts,
      survivingPhysicalCores: capacity.physicalCores,
      survivingUsableRamGB: capacity.usableRamGB,
      survivingUsableStorageTB: capacity.usableStorageTB,
      workloadVcpuCapacity: capacity.maxRecommendedWorkloadVcpu,
      isViable: shortfalls.length === 0,
      shortfallReasons: shortfalls
    });
  }

  const isAllViable = clusterHeadrooms.every(c => c.isViable);
  const totalSurvivingHosts = clusterHeadrooms.reduce((acc, c) => acc + c.survivingHosts, 0);
  const totalSurvivingCores = clusterHeadrooms.reduce((acc, c) => acc + c.survivingPhysicalCores, 0);
  const totalSurvivingUsableRamGB = Number(
    clusterHeadrooms.reduce((acc, c) => acc + c.survivingUsableRamGB, 0).toFixed(1)
  );
  const totalSurvivingUsableStorageTB = Number(
    clusterHeadrooms.reduce((acc, c) => acc + c.survivingUsableStorageTB, 0).toFixed(1)
  );

  return {
    scenarioName: scenario.name,
    totalSurvivingHosts,
    totalSurvivingCores,
    totalSurvivingUsableRamGB,
    totalSurvivingUsableStorageTB,
    isAllViable,
    clusterHeadrooms
  };
}

/**
 * Calculates compound demand forecast: Future = Current * (1 + annualGrowthRate)^years
 */
export function calculateCompoundWorkloadGrowth(
  currentDemand: number,
  annualGrowthRatePct: number,
  planningHorizonYears: number
): number {
  if (currentDemand <= 0) return 0;
  if (planningHorizonYears <= 0) return currentDemand;
  const rate = Math.max(0, annualGrowthRatePct / 100);
  const future = currentDemand * Math.pow(1 + rate, planningHorizonYears);
  return Math.round(future * 10) / 10;
}

/**
 * Continuous replication bandwidth estimate in Mbps.
 * Throughput (Mbps) = (changedDataGB * 8 * 1024) / (intervalMinutes * 60)
 */
export function calculateReplicationBandwidthMbps(
  changedDataGB: number,
  intervalMinutes: number,
  networkOverheadMultiplier: number = 1.25
): number {
  if (changedDataGB <= 0 || intervalMinutes <= 0) return 0;
  const totalBits = changedDataGB * 8 * 1024; // Megabits
  const totalSeconds = intervalMinutes * 60;
  const rawThroughputMbps = totalBits / totalSeconds;
  return Math.round(rawThroughputMbps * networkOverheadMultiplier * 10) / 10;
}

/**
 * Storage unit converter between decimal TB (10^12 bytes) and binary TiB (2^40 bytes)
 */
export function convertStorageUnits(
  value: number,
  from: 'TB' | 'TiB',
  to: 'TB' | 'TiB'
): number {
  if (value <= 0) return 0;
  if (from === to) return value;
  const BYTES_PER_TB = 1_000_000_000_000;
  const BYTES_PER_TIB = 1_099_511_627_776;

  if (from === 'TB' && to === 'TiB') {
    return Number(((value * BYTES_PER_TB) / BYTES_PER_TIB).toFixed(2));
  } else {
    return Number(((value * BYTES_PER_TIB) / BYTES_PER_TB).toFixed(2));
  }
}
