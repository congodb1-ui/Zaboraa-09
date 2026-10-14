/**
 * Types & Safe Adapters for Multi-Cloud & Nutanix Architecture Blueprints
 * Fully backward-compatible with legacy Zaboraa localStorage schemas.
 */

export type ArchitectureTemplateId =
  | 'nutanix-onprem'
  | 'nutanix-to-nc2'
  | 'vmware-to-nc2'
  | 'avs'
  | 'vmc-aws'
  | 'gcve'
  | 'aws-native'
  | 'gcp-native'
  | 'multi-cloud';

export type CloudPlatformType =
  | 'Nutanix AHV'
  | 'VMware vSphere'
  | 'Nutanix NC2 on Azure'
  | 'Azure VMware Solution'
  | 'VMware Cloud on AWS'
  | 'AWS Native'
  | 'Google Cloud VMware Engine'
  | 'GCP Native'
  | 'Co-Location Datacenter';

export type EnvironmentRole =
  | 'Production'
  | 'Disaster Recovery'
  | 'Secondary Active'
  | 'Dev/Test'
  | 'Shared Services';

export interface EnvironmentNode {
  id: string;
  name: string;
  platform: CloudPlatformType;
  role: EnvironmentRole;
  region: string;
  hostCount: number;
  nodeSku: string;
  totalVcpu: number;
  totalRamGB: number;
  storageTB: number;
  cidrBlock: string;
  connectedEnvironmentIds: string[];
  replicationTargetId?: string;
  replicationEngine?: string;
  notes?: string;
  // Milestone 2 Canvas & Data Integrity extensions:
  vmCount?: number;
  tier?: 'source' | 'transit' | 'target' | 'edge';
  x?: number;
  y?: number;
}

export interface InterconnectLink {
  id: string;
  sourceId: string;
  targetId: string;
  protocol:
    | 'ExpressRoute FastPath'
    | 'AWS Direct Connect'
    | 'Google Cloud Interconnect'
    | 'IPsec VPN'
    | 'VMware HCX L2 Extension'
    | 'Nutanix Move'
    | 'Nutanix Protection Domain / Leap'
    | 'VNet / VPC Peering'
    | 'Transit Gateway Route';
  bandwidthGbps: number;
  status: 'active' | 'standby' | 'provisioning';
  latencyMs?: number;
  redundant?: boolean;
  notes?: string;
}

export interface ResilienceConfig {
  drTopology: 'Active-Active' | 'Active-Passive' | 'Warm Standby' | 'Pilot Light' | 'Backup & Restore';
  targetRpoMinutes: number;
  targetRtoMinutes: number;
  replicationMode: 'Synchronous' | 'Asynchronous' | 'Continuous Snapshot';
  replicationEngine: string;
  failoverMode: 'Orchestrated Runbook' | 'Semi-Automated' | 'Manual DNS/BGP Switch';
  failbackApproach: 'Reverse Delta Sync' | 'Cold Restore' | 'Manual Cutover';
  wanBandwidthMbps?: number;
  journalOverheadTB?: number;
}

export interface NativeServiceItem {
  id: string;
  name: string;
  provider: 'azure' | 'aws' | 'gcp' | 'nutanix' | 'vmware' | 'third-party';
  category: 'compute' | 'storage' | 'networking' | 'security' | 'operations';
  officialIconKey: string;
  enabled: boolean;
  isThirdPartyNVA: boolean;
  description: string;
}

export interface MigrationAssessmentConfig {
  sourceHypervisor: 'VMware ESXi' | 'Nutanix AHV' | 'Physical BareMetal' | 'Hyper-V';
  targetPlatform: 'Nutanix NC2 on Azure' | 'Azure VMware Solution' | 'AWS VMC' | 'Google Cloud GCVE';
  totalVMs: number;
  totalVcpu: number;
  totalRamGB: number;
  totalStorageTB: number;
  migrationMethod: 'Nutanix Move (Non-Disruptive)' | 'VMware HCX (Bulk / RAV)' | 'Azure Migrate' | 'Native Cloud Backup';
  estimatedWaves: number;
  virtIoPrerequisiteChecked: boolean;
  networkCutoverStrategy: 'L2 Stretched Extension' | 'DNS Re-IP Switch' | 'BGP Route Injection';
}

export interface ImportedLegacyContext {
  limitingDriver?: string;
  hcxNePairs?: number;
  storagePolicy?: string;
  fileName?: string;
  failoverNetwork?: string;
  requiredBandwidthMbps?: number;
  journalTB?: number;
  wanMbps?: number;
  rawBlueprintState?: any;
  rawDrExport?: any;
  rawSizingExport?: any;
  preservedExtraFields?: Record<string, unknown>;
}

export interface DynamicTopologyModel {
  templateId: ArchitectureTemplateId;
  customerName: string;
  architectName: string;
  projectDate: string;
  environments: EnvironmentNode[];
  interconnectLinks?: InterconnectLink[];
  resilience: ResilienceConfig;
  migrationAssessment?: MigrationAssessmentConfig;
  activeServiceIds?: string[];
  importedLegacyContext: ImportedLegacyContext;
}

// =========================================================================
// Legacy localStorage Schemas (Raw Interfaces)
// =========================================================================

export interface LegacyBlueprintState {
  fileName?: string;
  targetCloud?: string;
  nodeSku?: string;
  cloudNodes?: number;
  totalVMs?: number;
  totalVCPUs?: number;
  totalRAMGB?: number;
  totalStorageTB?: number;
  decoupledStorageTB?: number;
  storagePolicy?: string;
  limitingDriver?: string;
  vlans?: Array<{ vlanId: number; portGroup: string; vmCount?: number; totalProvisionedGiB?: number }>;
  hcxNePairs?: number;
  timestamp?: string;
  [key: string]: any;
}

export interface LegacyDrExport {
  engine?: string;
  strategy?: string;
  vms?: number;
  storageTB?: number;
  rpoMin?: number;
  wanMbps?: number;
  requiredBandwidthMbps?: number;
  rtoMin?: number;
  failoverNetwork?: string;
  journalTB?: number;
  timestamp?: string;
  [key: string]: any;
}

export interface LegacySizingExport {
  cloud?: string;
  provider?: string;
  vms?: number;
  storageTB?: number;
  nodes?: number;
  decoupledStorageTB?: number;
  storagePolicy?: string;
  timestamp?: string;
  [key: string]: any;
}

export interface HydrationResult {
  model: DynamicTopologyModel;
  notice: string | null;
  conflictsResolved: string[];
  importedSources: string[];
}

/**
 * Creates default initial environments based on the selected template with multi-tier grid coordinates.
 */
export function getDefaultEnvironmentsForTemplate(templateId: ArchitectureTemplateId): EnvironmentNode[] {
  switch (templateId) {
    case 'nutanix-onprem':
      return [
        {
          id: 'env-nutanix-prod',
          name: 'Primary Nutanix Datacenter (HQ)',
          platform: 'Nutanix AHV',
          role: 'Production',
          region: 'On-Premises Equinix DC1',
          hostCount: 12,
          nodeSku: 'NX-8170-G9 (Dual Intel Xeon, NVMe)',
          totalVcpu: 384,
          totalRamGB: 1536,
          storageTB: 160,
          cidrBlock: '10.100.0.0/16',
          connectedEnvironmentIds: ['env-nutanix-dr'],
          replicationTargetId: 'env-nutanix-dr',
          replicationEngine: 'Nutanix Protection Domains (Async / NearSync)',
          notes: 'AOS Distributed Storage Fabric, Prism Central Cluster',
          tier: 'source',
          x: 80,
          y: 120
        },
        {
          id: 'env-nutanix-dr',
          name: 'Secondary Disaster Recovery Site',
          platform: 'Nutanix AHV',
          role: 'Disaster Recovery',
          region: 'On-Premises Secondary DC2',
          hostCount: 6,
          nodeSku: 'NX-3170-G9 (Intel Xeon, All-Flash)',
          totalVcpu: 192,
          totalRamGB: 768,
          storageTB: 90,
          cidrBlock: '10.102.0.0/16',
          connectedEnvironmentIds: ['env-nutanix-prod'],
          notes: 'Warm Standby Cluster, Flow Microseg mirrored',
          tier: 'target',
          x: 780,
          y: 120
        }
      ];

    case 'nutanix-to-nc2':
      return [
        {
          id: 'env-onprem-nutanix',
          name: 'On-Premises Nutanix Private Cloud',
          platform: 'Nutanix AHV',
          role: 'Production',
          region: 'On-Premises Core DC',
          hostCount: 16,
          nodeSku: 'NX-8170-G9 All-NVMe',
          totalVcpu: 512,
          totalRamGB: 2048,
          storageTB: 220,
          cidrBlock: '10.10.0.0/16',
          connectedEnvironmentIds: ['env-nc2-azure'],
          replicationTargetId: 'env-nc2-azure',
          replicationEngine: 'Nutanix Move / Prism Pairing',
          notes: 'Prism Central managed, Flow VPC',
          tier: 'source',
          x: 80,
          y: 120
        },
        {
          id: 'env-azure-transit',
          name: 'Azure Virtual WAN & Security Hub',
          platform: 'Azure VMware Solution',
          role: 'Shared Services',
          region: 'Azure East US 2',
          hostCount: 0,
          nodeSku: 'Azure vWAN Hub with ExpressRoute',
          totalVcpu: 32,
          totalRamGB: 128,
          storageTB: 20,
          cidrBlock: '10.250.0.0/24',
          connectedEnvironmentIds: ['env-onprem-nutanix', 'env-nc2-azure'],
          notes: 'ExpressRoute Gateway, Palo Alto VM-Series NVA, Entra ID',
          tier: 'transit',
          x: 430,
          y: 120
        },
        {
          id: 'env-nc2-azure',
          name: 'Nutanix Cloud Clusters (NC2) on Azure',
          platform: 'Nutanix NC2 on Azure',
          role: 'Disaster Recovery',
          region: 'Azure East US 2 (BareMetal)',
          hostCount: 4,
          nodeSku: 'AN36P (36 cores, 768GB RAM, 19.2TB NVMe)',
          totalVcpu: 144,
          totalRamGB: 3072,
          storageTB: 76,
          cidrBlock: '10.240.0.0/22',
          connectedEnvironmentIds: ['env-onprem-nutanix', 'env-azure-transit'],
          notes: 'Direct delegated Azure vNet integration, Flow VPC',
          tier: 'target',
          x: 780,
          y: 120
        }
      ];

    case 'vmware-to-nc2':
      return [
        {
          id: 'env-source-vmware',
          name: 'Source VMware vSphere / VCF Cluster',
          platform: 'VMware vSphere',
          role: 'Production',
          region: 'On-Premises Enterprise DC',
          hostCount: 20,
          nodeSku: 'Dell PowerEdge R750 (ESXi 8.0u2)',
          totalVcpu: 640,
          totalRamGB: 2560,
          storageTB: 280,
          cidrBlock: '10.20.0.0/16',
          connectedEnvironmentIds: ['env-target-nc2'],
          replicationTargetId: 'env-target-nc2',
          replicationEngine: 'Nutanix Move Cross-Hypervisor',
          notes: 'vCenter Server Appliance, NSX-T Tier-0, vSAN',
          tier: 'source',
          x: 80,
          y: 120
        },
        {
          id: 'env-azure-transit-hub',
          name: 'Azure ExpressRoute & Security Hub',
          platform: 'Azure VMware Solution',
          role: 'Shared Services',
          region: 'Azure East US',
          hostCount: 0,
          nodeSku: 'ExpressRoute FastPath Gateway',
          totalVcpu: 32,
          totalRamGB: 128,
          storageTB: 20,
          cidrBlock: '10.250.0.0/24',
          connectedEnvironmentIds: ['env-source-vmware', 'env-target-nc2'],
          notes: '10 Gbps ExpressRoute Direct connection',
          tier: 'transit',
          x: 430,
          y: 120
        },
        {
          id: 'env-target-nc2',
          name: 'Target Nutanix NC2 on Azure Cluster',
          platform: 'Nutanix NC2 on Azure',
          role: 'Disaster Recovery',
          region: 'Azure East US (Dedicated BareMetal)',
          hostCount: 6,
          nodeSku: 'AN36P BareMetal Nodes',
          totalVcpu: 216,
          totalRamGB: 4608,
          storageTB: 115,
          cidrBlock: '10.240.0.0/22',
          connectedEnvironmentIds: ['env-source-vmware', 'env-azure-transit-hub'],
          notes: 'Target for Nutanix Move non-disruptive seeding with VirtIO injection',
          tier: 'target',
          x: 780,
          y: 120
        }
      ];

    case 'avs':
      return [
        {
          id: 'env-onprem-vmware',
          name: 'On-Premises VMware Private Cloud',
          platform: 'VMware vSphere',
          role: 'Production',
          region: 'On-Premises Primary DC',
          hostCount: 24,
          nodeSku: 'Cisco UCS B200 M5 (ESXi 8.0)',
          totalVcpu: 768,
          totalRamGB: 3072,
          storageTB: 350,
          cidrBlock: '10.30.0.0/16',
          connectedEnvironmentIds: ['env-avs-sddc'],
          replicationTargetId: 'env-avs-sddc',
          replicationEngine: 'VMware HCX / vSphere Replication',
          notes: 'vCenter 8.0, NSX-T 4.1, Tier-0 Active-Active',
          tier: 'source',
          x: 80,
          y: 120
        },
        {
          id: 'env-avs-native-hub',
          name: 'Azure Transit Hub & Native Services',
          platform: 'Azure VMware Solution',
          role: 'Shared Services',
          region: 'Azure East US 2',
          hostCount: 0,
          nodeSku: 'Hub vNet with ExpressRoute Gateway',
          totalVcpu: 32,
          totalRamGB: 128,
          storageTB: 60,
          cidrBlock: '10.244.0.0/20',
          connectedEnvironmentIds: ['env-avs-sddc', 'env-onprem-vmware'],
          notes: 'Azure Virtual Desktop (AVD), Azure NetApp Files, Azure Firewall',
          tier: 'transit',
          x: 430,
          y: 120
        },
        {
          id: 'env-avs-sddc',
          name: 'Azure VMware Solution (AVS) SDDC',
          platform: 'Azure VMware Solution',
          role: 'Disaster Recovery',
          region: 'Azure East US 2 (Dedicated Host Cluster)',
          hostCount: 6,
          nodeSku: 'AV36P (36 cores, 576GB RAM, 11.5TB SSD)',
          totalVcpu: 216,
          totalRamGB: 3456,
          storageTB: 120,
          cidrBlock: '10.240.0.0/22',
          connectedEnvironmentIds: ['env-onprem-vmware', 'env-avs-native-hub'],
          notes: 'NSX-T Edge Cluster, Decoupled Azure NetApp Files (ANF)',
          tier: 'target',
          x: 780,
          y: 120
        }
      ];

    case 'vmc-aws':
      return [
        {
          id: 'env-onprem-vmware-aws',
          name: 'On-Premises VMware Datacenter',
          platform: 'VMware vSphere',
          role: 'Production',
          region: 'On-Premises US-East DC',
          hostCount: 16,
          nodeSku: 'HPE ProLiant DL380 Gen10',
          totalVcpu: 512,
          totalRamGB: 2048,
          storageTB: 260,
          cidrBlock: '10.40.0.0/16',
          connectedEnvironmentIds: ['env-aws-vmc'],
          replicationTargetId: 'env-aws-vmc',
          replicationEngine: 'VMware HCX Bulk / Replication',
          notes: 'vSphere 8.0 Enterprise Plus, vSAN cluster',
          tier: 'source',
          x: 80,
          y: 120
        },
        {
          id: 'env-aws-transit-hub',
          name: 'AWS Transit Gateway & Security Hub',
          platform: 'AWS Native',
          role: 'Shared Services',
          region: 'AWS us-east-1 (N. Virginia)',
          hostCount: 0,
          nodeSku: 'Transit Gateway + Direct Connect',
          totalVcpu: 32,
          totalRamGB: 128,
          storageTB: 30,
          cidrBlock: '10.155.0.0/20',
          connectedEnvironmentIds: ['env-onprem-vmware-aws', 'env-aws-vmc'],
          notes: 'AWS Network Firewall, Route53 Resolver, S3 VPC Endpoints',
          tier: 'transit',
          x: 430,
          y: 120
        },
        {
          id: 'env-aws-vmc',
          name: 'VMware Cloud on AWS (VMC) SDDC',
          platform: 'VMware Cloud on AWS',
          role: 'Disaster Recovery',
          region: 'AWS us-east-1 (Dedicated Metal)',
          hostCount: 4,
          nodeSku: 'i4i.metal (64 cores, 1024GB RAM, NVMe)',
          totalVcpu: 256,
          totalRamGB: 4096,
          storageTB: 100,
          cidrBlock: '10.150.0.0/20',
          connectedEnvironmentIds: ['env-onprem-vmware-aws', 'env-aws-transit-hub'],
          notes: 'NSX-T Connected VPC via High-Speed ENI, Amazon FSx for NetApp ONTAP',
          tier: 'target',
          x: 780,
          y: 120
        }
      ];

    case 'gcve':
      return [
        {
          id: 'env-onprem-source-gcve',
          name: 'On-Premises Hybrid Datacenter',
          platform: 'VMware vSphere',
          role: 'Production',
          region: 'On-Premises Chicago DC',
          hostCount: 16,
          nodeSku: 'Dell PowerEdge R750 (ESXi 8.0)',
          totalVcpu: 512,
          totalRamGB: 2048,
          storageTB: 240,
          cidrBlock: '10.50.0.0/16',
          connectedEnvironmentIds: ['env-gcve-sddc'],
          replicationTargetId: 'env-gcve-sddc',
          replicationEngine: 'VMware HCX / Google Cloud Interconnect',
          notes: 'Core ERP and transactional systems',
          tier: 'source',
          x: 80,
          y: 120
        },
        {
          id: 'env-gcp-interconnect-hub',
          name: 'Google Cloud VPC & Interconnect Hub',
          platform: 'GCP Native',
          role: 'Shared Services',
          region: 'GCP us-central1 (Iowa)',
          hostCount: 0,
          nodeSku: 'Cloud Router + Dedicated Interconnect',
          totalVcpu: 32,
          totalRamGB: 128,
          storageTB: 25,
          cidrBlock: '10.164.0.0/20',
          connectedEnvironmentIds: ['env-onprem-source-gcve', 'env-gcve-sddc'],
          notes: 'Cloud Armor, Cloud NAT, Cloud DNS, Private Service Connect',
          tier: 'transit',
          x: 430,
          y: 120
        },
        {
          id: 'env-gcve-sddc',
          name: 'Google Cloud VMware Engine (GCVE) SDDC',
          platform: 'Google Cloud VMware Engine',
          role: 'Disaster Recovery',
          region: 'GCP us-central1 (Dedicated BareMetal)',
          hostCount: 3,
          nodeSku: 've1-standard-72 (72 cores, 768GB RAM, 19.2TB NVMe)',
          totalVcpu: 216,
          totalRamGB: 2304,
          storageTB: 57,
          cidrBlock: '10.160.0.0/22',
          connectedEnvironmentIds: ['env-onprem-source-gcve', 'env-gcp-interconnect-hub'],
          notes: 'Dedicated 100 Gbps network pipe to Google Cloud VPC, NetApp Volumes (GCNV)',
          tier: 'target',
          x: 780,
          y: 120
        }
      ];

    case 'aws-native':
      return [
        {
          id: 'env-onprem-branch',
          name: 'On-Premises Edge Datacenter',
          platform: 'Co-Location Datacenter',
          role: 'Production',
          region: 'Equinix NY5 Co-Lo',
          hostCount: 8,
          nodeSku: 'Cisco HyperFlex All-Flash',
          totalVcpu: 256,
          totalRamGB: 1024,
          storageTB: 120,
          cidrBlock: '10.60.0.0/16',
          connectedEnvironmentIds: ['env-aws-tgw-hub'],
          replicationTargetId: 'env-aws-app-vpc',
          replicationEngine: 'AWS Direct Connect + AWS DMS',
          notes: 'Legacy manufacturing and local SCADA controllers',
          tier: 'source',
          x: 80,
          y: 120
        },
        {
          id: 'env-aws-tgw-hub',
          name: 'AWS Transit Gateway & Inspection Hub',
          platform: 'AWS Native',
          role: 'Shared Services',
          region: 'AWS us-east-1',
          hostCount: 0,
          nodeSku: 'AWS Transit Gateway Hub',
          totalVcpu: 32,
          totalRamGB: 128,
          storageTB: 20,
          cidrBlock: '10.100.0.0/20',
          connectedEnvironmentIds: ['env-onprem-branch', 'env-aws-app-vpc'],
          notes: 'AWS Network Firewall inspection, Direct Connect Gateway',
          tier: 'transit',
          x: 430,
          y: 120
        },
        {
          id: 'env-aws-app-vpc',
          name: 'AWS Application VPC (EKS & Aurora)',
          platform: 'AWS Native',
          role: 'Production',
          region: 'AWS us-east-1',
          hostCount: 0,
          nodeSku: 'AWS Cloud Native Services',
          totalVcpu: 192,
          totalRamGB: 768,
          storageTB: 80,
          cidrBlock: '10.101.0.0/20',
          connectedEnvironmentIds: ['env-aws-tgw-hub'],
          notes: 'Amazon EKS cluster, Aurora PostgreSQL Multi-AZ, S3 Intelligent-Tiering',
          tier: 'target',
          x: 780,
          y: 120
        }
      ];

    case 'gcp-native':
      return [
        {
          id: 'env-onprem-corp',
          name: 'On-Premises Corporate Headquarters',
          platform: 'Co-Location Datacenter',
          role: 'Production',
          region: 'Dallas DC3 Co-Lo',
          hostCount: 8,
          nodeSku: 'HPE Synergy Composable Nodes',
          totalVcpu: 256,
          totalRamGB: 1024,
          storageTB: 140,
          cidrBlock: '10.70.0.0/16',
          connectedEnvironmentIds: ['env-gcp-shared-vpc'],
          replicationTargetId: 'env-gcp-app-landing',
          replicationEngine: 'Google Cloud Partner Interconnect',
          notes: 'Active Directory, File clusters, internal business apps',
          tier: 'source',
          x: 80,
          y: 120
        },
        {
          id: 'env-gcp-shared-vpc',
          name: 'GCP Shared VPC & Security Hub',
          platform: 'GCP Native',
          role: 'Shared Services',
          region: 'GCP us-central1',
          hostCount: 0,
          nodeSku: 'Shared VPC Host Project',
          totalVcpu: 32,
          totalRamGB: 128,
          storageTB: 25,
          cidrBlock: '10.110.0.0/20',
          connectedEnvironmentIds: ['env-onprem-corp', 'env-gcp-app-landing'],
          notes: 'Cloud Armor, Cloud NAT, Cloud Interconnect attachment',
          tier: 'transit',
          x: 430,
          y: 120
        },
        {
          id: 'env-gcp-app-landing',
          name: 'GCP GKE & BigQuery Production Landing',
          platform: 'GCP Native',
          role: 'Production',
          region: 'GCP us-central1',
          hostCount: 0,
          nodeSku: 'GCP Cloud Native Services',
          totalVcpu: 192,
          totalRamGB: 768,
          storageTB: 110,
          cidrBlock: '10.112.0.0/20',
          connectedEnvironmentIds: ['env-gcp-shared-vpc'],
          notes: 'Google Kubernetes Engine (GKE), Cloud Spanner, BigQuery data analytics',
          tier: 'target',
          x: 780,
          y: 120
        }
      ];

    case 'multi-cloud':
    default:
      return [
        {
          id: 'env-onprem-core',
          name: 'Core Enterprise Datacenter (On-Prem)',
          platform: 'Nutanix AHV',
          role: 'Production',
          region: 'Chicago Primary DC',
          hostCount: 24,
          nodeSku: 'Nutanix NX-8170 + VMware VCF Mesh',
          totalVcpu: 768,
          totalRamGB: 3072,
          storageTB: 380,
          cidrBlock: '10.0.0.0/16',
          connectedEnvironmentIds: ['env-transit-mesh', 'env-azure-prod', 'env-aws-dr'],
          replicationTargetId: 'env-aws-dr',
          replicationEngine: 'Multi-Cloud Cross-Replication',
          notes: 'Primary production workloads, Oracle RAC, SAP HANA',
          tier: 'source',
          x: 80,
          y: 120
        },
        {
          id: 'env-transit-mesh',
          name: 'Global Multi-Cloud SD-WAN & Transit Backbone',
          platform: 'Azure VMware Solution',
          role: 'Shared Services',
          region: 'Global Backbone / Equinix Fabric',
          hostCount: 0,
          nodeSku: 'Multi-Cloud Interconnect Mesh',
          totalVcpu: 48,
          totalRamGB: 192,
          storageTB: 40,
          cidrBlock: '10.254.0.0/20',
          connectedEnvironmentIds: ['env-onprem-core', 'env-azure-prod', 'env-aws-dr', 'env-gcp-analytics'],
          notes: 'Equinix Fabric + Megaport Cloud Router mesh interconnect',
          tier: 'transit',
          x: 430,
          y: 120
        },
        {
          id: 'env-azure-prod',
          name: 'Azure Production & NC2 Enclave',
          platform: 'Nutanix NC2 on Azure',
          role: 'Secondary Active',
          region: 'Azure East US',
          hostCount: 8,
          nodeSku: 'NC2 BareMetal AN36P + AVS AV36P',
          totalVcpu: 288,
          totalRamGB: 4608,
          storageTB: 140,
          cidrBlock: '10.240.0.0/22',
          connectedEnvironmentIds: ['env-transit-mesh'],
          notes: 'Active-Active Bursting, Azure Virtual Desktop (AVD), ANF storage',
          tier: 'target',
          x: 780,
          y: 60
        },
        {
          id: 'env-aws-dr',
          name: 'AWS Disaster Recovery SDDC',
          platform: 'VMware Cloud on AWS',
          role: 'Disaster Recovery',
          region: 'AWS us-west-2 (Oregon)',
          hostCount: 4,
          nodeSku: 'i4i.metal (64 cores, 1024GB RAM)',
          totalVcpu: 256,
          totalRamGB: 4096,
          storageTB: 100,
          cidrBlock: '10.150.0.0/20',
          connectedEnvironmentIds: ['env-transit-mesh'],
          notes: 'Warm Standby DR Site, AWS Transit Gateway, FSx ONTAP',
          tier: 'target',
          x: 780,
          y: 260
        },
        {
          id: 'env-gcp-analytics',
          name: 'Google Cloud Data & AI Landing Zone',
          platform: 'Google Cloud VMware Engine',
          role: 'Dev/Test',
          region: 'GCP us-central1 (Iowa)',
          hostCount: 3,
          nodeSku: 've1-standard-72 (72 cores, 768GB RAM)',
          totalVcpu: 216,
          totalRamGB: 2304,
          storageTB: 57,
          cidrBlock: '10.180.0.0/22',
          connectedEnvironmentIds: ['env-transit-mesh'],
          notes: 'BigQuery streaming ingestion, Google Cloud NetApp Volumes (GCNV)',
          tier: 'target',
          x: 780,
          y: 460
        }
      ];
  }
}

/**
 * Creates default interconnect links for a given template.
 */
export function getDefaultInterconnectLinksForTemplate(templateId: ArchitectureTemplateId): InterconnectLink[] {
  switch (templateId) {
    case 'nutanix-onprem':
      return [
        {
          id: 'link-nutanix-rep',
          sourceId: 'env-nutanix-prod',
          targetId: 'env-nutanix-dr',
          protocol: 'Nutanix Protection Domain / Leap',
          bandwidthGbps: 10,
          status: 'active',
          latencyMs: 4,
          redundant: true,
          notes: 'Direct dark-fiber metro interconnect with NearSync replication'
        }
      ];

    case 'nutanix-to-nc2':
      return [
        {
          id: 'link-nutanix-er',
          sourceId: 'env-onprem-nutanix',
          targetId: 'env-azure-transit',
          protocol: 'ExpressRoute FastPath',
          bandwidthGbps: 10,
          status: 'active',
          latencyMs: 8,
          redundant: true,
          notes: 'ExpressRoute Direct to Azure Transit Hub'
        },
        {
          id: 'link-transit-nc2',
          sourceId: 'env-azure-transit',
          targetId: 'env-nc2-azure',
          protocol: 'VNet / VPC Peering',
          bandwidthGbps: 40,
          status: 'active',
          latencyMs: 1,
          redundant: true,
          notes: 'High-speed Azure Virtual WAN Hub connection'
        }
      ];

    case 'vmware-to-nc2':
      return [
        {
          id: 'link-vmw-er',
          sourceId: 'env-source-vmware',
          targetId: 'env-azure-transit-hub',
          protocol: 'ExpressRoute FastPath',
          bandwidthGbps: 10,
          status: 'active',
          latencyMs: 9,
          redundant: true,
          notes: 'Dedicated 10G link for Nutanix Move cross-hypervisor migration cutover'
        },
        {
          id: 'link-transit-target-nc2',
          sourceId: 'env-azure-transit-hub',
          targetId: 'env-target-nc2',
          protocol: 'Nutanix Move',
          bandwidthGbps: 20,
          status: 'active',
          latencyMs: 1,
          redundant: true,
          notes: 'In-VNet BareMetal attachment for NC2 cluster'
        }
      ];

    case 'avs':
      return [
        {
          id: 'link-avs-er',
          sourceId: 'env-onprem-vmware',
          targetId: 'env-avs-native-hub',
          protocol: 'ExpressRoute FastPath',
          bandwidthGbps: 10,
          status: 'active',
          latencyMs: 7,
          redundant: true,
          notes: 'ExpressRoute Circuit with Global Reach enabled'
        },
        {
          id: 'link-hub-avs-sddc',
          sourceId: 'env-avs-native-hub',
          targetId: 'env-avs-sddc',
          protocol: 'VMware HCX L2 Extension',
          bandwidthGbps: 40,
          status: 'active',
          latencyMs: 1,
          redundant: true,
          notes: 'Dedicated ExpressRoute Gateway connection to AVS private cloud'
        }
      ];

    case 'vmc-aws':
      return [
        {
          id: 'link-vmc-dx',
          sourceId: 'env-onprem-vmware-aws',
          targetId: 'env-aws-transit-hub',
          protocol: 'AWS Direct Connect',
          bandwidthGbps: 10,
          status: 'active',
          latencyMs: 6,
          redundant: true,
          notes: '10G Direct Connect via AWS Direct Connect Gateway'
        },
        {
          id: 'link-hub-vmc-eni',
          sourceId: 'env-aws-transit-hub',
          targetId: 'env-aws-vmc',
          protocol: 'VMware HCX L2 Extension',
          bandwidthGbps: 25,
          status: 'active',
          latencyMs: 1,
          redundant: true,
          notes: 'Connected VPC Elastic Network Interface (ENI) 25 Gbps interconnect'
        }
      ];

    case 'gcve':
      return [
        {
          id: 'link-gcve-interconnect',
          sourceId: 'env-onprem-source-gcve',
          targetId: 'env-gcp-interconnect-hub',
          protocol: 'Google Cloud Interconnect',
          bandwidthGbps: 10,
          status: 'active',
          latencyMs: 8,
          redundant: true,
          notes: 'Dedicated Interconnect with 99.99% SLA'
        },
        {
          id: 'link-hub-gcve-sddc',
          sourceId: 'env-gcp-interconnect-hub',
          targetId: 'env-gcve-sddc',
          protocol: 'VMware HCX L2 Extension',
          bandwidthGbps: 100,
          status: 'active',
          latencyMs: 1,
          redundant: true,
          notes: 'Private Service Access peering (100 Gbps)'
        }
      ];

    case 'aws-native':
      return [
        {
          id: 'link-aws-native-dx',
          sourceId: 'env-onprem-branch',
          targetId: 'env-aws-tgw-hub',
          protocol: 'AWS Direct Connect',
          bandwidthGbps: 10,
          status: 'active',
          latencyMs: 12,
          redundant: true,
          notes: 'Direct Connect Virtual Interface into AWS Transit Gateway'
        },
        {
          id: 'link-tgw-to-app-vpc',
          sourceId: 'env-aws-tgw-hub',
          targetId: 'env-aws-app-vpc',
          protocol: 'Transit Gateway Route',
          bandwidthGbps: 50,
          status: 'active',
          latencyMs: 1,
          redundant: true,
          notes: 'Transit Gateway VPC attachment with appliance mode'
        }
      ];

    case 'gcp-native':
      return [
        {
          id: 'link-gcp-native-ic',
          sourceId: 'env-onprem-corp',
          targetId: 'env-gcp-shared-vpc',
          protocol: 'Google Cloud Interconnect',
          bandwidthGbps: 10,
          status: 'active',
          latencyMs: 10,
          redundant: true,
          notes: 'Partner Interconnect with redundant VLAN attachments'
        },
        {
          id: 'link-shared-vpc-to-app',
          sourceId: 'env-gcp-shared-vpc',
          targetId: 'env-gcp-app-landing',
          protocol: 'VNet / VPC Peering',
          bandwidthGbps: 40,
          status: 'active',
          latencyMs: 1,
          redundant: true,
          notes: 'Shared VPC Service Project binding with Cloud DNS peering'
        }
      ];

    case 'multi-cloud':
    default:
      return [
        {
          id: 'link-mesh-onprem',
          sourceId: 'env-onprem-core',
          targetId: 'env-transit-mesh',
          protocol: 'ExpressRoute FastPath',
          bandwidthGbps: 10,
          status: 'active',
          latencyMs: 5,
          redundant: true,
          notes: 'Equinix Fabric Virtual Connection'
        },
        {
          id: 'link-mesh-azure',
          sourceId: 'env-transit-mesh',
          targetId: 'env-azure-prod',
          protocol: 'ExpressRoute FastPath',
          bandwidthGbps: 10,
          status: 'active',
          latencyMs: 7,
          redundant: true,
          notes: 'ExpressRoute circuit to Azure vWAN'
        },
        {
          id: 'link-mesh-aws',
          sourceId: 'env-transit-mesh',
          targetId: 'env-aws-dr',
          protocol: 'AWS Direct Connect',
          bandwidthGbps: 10,
          status: 'active',
          latencyMs: 11,
          redundant: true,
          notes: 'Direct Connect Gateway into AWS VMC SDDC'
        },
        {
          id: 'link-mesh-gcp',
          sourceId: 'env-transit-mesh',
          targetId: 'env-gcp-analytics',
          protocol: 'Google Cloud Interconnect',
          bandwidthGbps: 10,
          status: 'active',
          latencyMs: 9,
          redundant: true,
          notes: 'Cloud Interconnect attachment into Google Cloud'
        }
      ];
  }
}

/**
 * Safe backward-compatible hydration adapter.
 * Inspects all 3 legacy localStorage keys with domain-based conflict resolution.
 */
export function hydrateFromLegacyStorage(
  rawBlueprintState?: string | null,
  rawDrExport?: string | null,
  rawSizingExport?: string | null
): HydrationResult {
  const conflictsResolved: string[] = [];
  const importedSources: string[] = [];

  let blueprint: LegacyBlueprintState | null = null;
  let dr: LegacyDrExport | null = null;
  let sizing: LegacySizingExport | null = null;

  try {
    if (rawBlueprintState) {
      const parsed = JSON.parse(rawBlueprintState);
      if (typeof parsed === 'object' && parsed !== null) {
        blueprint = parsed;
        importedSources.push('RVTools Ingestion (zaboraa_4k_blueprint_state)');
      }
    }
  } catch (err) {
    console.warn('Failed to parse zaboraa_4k_blueprint_state:', err);
  }

  try {
    if (rawDrExport) {
      const parsed = JSON.parse(rawDrExport);
      if (typeof parsed === 'object' && parsed !== null) {
        dr = parsed;
        importedSources.push('DR Planner (zaboraa_dr_export)');
      }
    }
  } catch (err) {
    console.warn('Failed to parse zaboraa_dr_export:', err);
  }

  try {
    if (rawSizingExport) {
      const parsed = JSON.parse(rawSizingExport);
      if (typeof parsed === 'object' && parsed !== null) {
        sizing = parsed;
        importedSources.push('Node Sizing (zaboraa_sizing_export)');
      }
    }
  } catch (err) {
    console.warn('Failed to parse zaboraa_sizing_export:', err);
  }

  // Determine initial template based on target cloud
  let templateId: ArchitectureTemplateId = 'avs';
  if (blueprint?.targetCloud) {
    const tc = blueprint.targetCloud.toLowerCase();
    if (tc.includes('nutanix') || tc.includes('nc2')) {
      templateId = 'nutanix-to-nc2';
    } else if (tc.includes('aws') || tc.includes('vmc')) {
      templateId = 'vmc-aws';
    } else if (tc.includes('google') || tc.includes('gcve')) {
      templateId = 'gcve';
    } else if (tc.includes('mesh') || tc.includes('multi')) {
      templateId = 'multi-cloud';
    } else {
      templateId = 'avs';
    }
  }

  const environments = getDefaultEnvironmentsForTemplate(templateId);
  const interconnectLinks = getDefaultInterconnectLinksForTemplate(templateId);

  // 1. Resolve Total VMs (Conflict Resolution Rule 1: RVTools > Sizing > DR)
  let resolvedVMs = 380;
  if (blueprint?.totalVMs !== undefined && typeof blueprint.totalVMs === 'number' && !isNaN(blueprint.totalVMs)) {
    resolvedVMs = blueprint.totalVMs;
    if (sizing?.vms !== undefined && sizing.vms !== blueprint.totalVMs) {
      conflictsResolved.push(`VM Count: Prioritized RVTools inventory (${blueprint.totalVMs} VMs) over Sizing Estimator (${sizing.vms} VMs)`);
    }
  } else if (sizing?.vms !== undefined && typeof sizing.vms === 'number' && !isNaN(sizing.vms)) {
    resolvedVMs = sizing.vms;
    if (dr?.vms !== undefined && dr.vms !== sizing.vms) {
      conflictsResolved.push(`VM Count: Used Sizing Estimator (${sizing.vms} VMs) over DR protected scope (${dr.vms} VMs)`);
    }
  } else if (dr?.vms !== undefined && typeof dr.vms === 'number' && !isNaN(dr.vms)) {
    resolvedVMs = dr.vms;
  }

  // 2. Resolve Storage TB
  let resolvedStorageTB = 240;
  if (blueprint?.totalStorageTB !== undefined && typeof blueprint.totalStorageTB === 'number' && !isNaN(blueprint.totalStorageTB)) {
    resolvedStorageTB = blueprint.totalStorageTB;
  } else if (sizing?.storageTB !== undefined && typeof sizing.storageTB === 'number' && !isNaN(sizing.storageTB)) {
    resolvedStorageTB = sizing.storageTB;
  } else if (dr?.storageTB !== undefined && typeof dr.storageTB === 'number' && !isNaN(dr.storageTB)) {
    resolvedStorageTB = dr.storageTB;
  }

  // 3. Resolve Decoupled Storage TB (Safely preserve valid 0 if configured)
  let resolvedDecoupledStorageTB = 120;
  if (blueprint?.decoupledStorageTB !== undefined && typeof blueprint.decoupledStorageTB === 'number' && !isNaN(blueprint.decoupledStorageTB) && blueprint.decoupledStorageTB >= 0) {
    resolvedDecoupledStorageTB = blueprint.decoupledStorageTB;
  } else if (sizing?.decoupledStorageTB !== undefined && typeof sizing.decoupledStorageTB === 'number' && !isNaN(sizing.decoupledStorageTB) && sizing.decoupledStorageTB >= 0) {
    resolvedDecoupledStorageTB = sizing.decoupledStorageTB;
  }

  // 4. Resolve Target Node Sku & Node Count
  let resolvedNodeSku = 'AV36P';
  let resolvedNodeCount = 4;
  if (blueprint?.nodeSku && typeof blueprint.nodeSku === 'string') {
    resolvedNodeSku = blueprint.nodeSku.replace(/^AVS-/, '').replace(/^VMC-/, '').replace(/^GCVE-/, '');
  }
  if (sizing?.nodes && typeof sizing.nodes === 'number') {
    resolvedNodeCount = sizing.nodes;
    if (blueprint?.cloudNodes && blueprint.cloudNodes !== sizing.nodes) {
      conflictsResolved.push(`Cloud Nodes: Prioritized Sizing Estimator calculated node count (${sizing.nodes} nodes) over RVTools estimate (${blueprint.cloudNodes} nodes)`);
    }
  } else if (blueprint?.cloudNodes && typeof blueprint.cloudNodes === 'number') {
    resolvedNodeCount = blueprint.cloudNodes;
  }

  // Apply resolved values to environments[0] (Source) and environments[1] (Target)
  if (environments[0]) {
    environments[0].totalVcpu = blueprint?.totalVCPUs || Math.round(resolvedVMs * 2.5);
    environments[0].totalRamGB = blueprint?.totalRAMGB || Math.round(resolvedVMs * 10);
    environments[0].storageTB = resolvedStorageTB;
    // CRITICAL: Preserve explicit VM count directly in the environment node
    environments[0].vmCount = resolvedVMs;
  }
  if (environments[1]) {
    environments[1].nodeSku = resolvedNodeSku;
    environments[1].hostCount = resolvedNodeCount;
    environments[1].storageTB = resolvedDecoupledStorageTB;
  }

  // 5. Resolve Resilience / DR SLAs (DR Planner is strictly authoritative)
  const resilience: ResilienceConfig = {
    drTopology: 'Pilot Light',
    targetRpoMinutes: 15,
    targetRtoMinutes: 60,
    replicationMode: 'Asynchronous',
    replicationEngine: 'VMware SRM + vSphere Replication',
    failoverMode: 'Orchestrated Runbook',
    failbackApproach: 'Reverse Delta Sync'
  };

  if (dr) {
    if (dr.engine && typeof dr.engine === 'string') {
      resilience.replicationEngine = dr.engine;
    }
    // Guard 0 RPO (Synchronous zero-data-loss DR)
    if (typeof dr.rpoMin === 'number' && !isNaN(dr.rpoMin) && dr.rpoMin >= 0) {
      resilience.targetRpoMinutes = dr.rpoMin;
      resilience.replicationMode = dr.rpoMin <= 1 ? 'Synchronous' : 'Asynchronous';
    }
    // Guard 0 RTO (Instant automated failover)
    if (typeof dr.rtoMin === 'number' && !isNaN(dr.rtoMin) && dr.rtoMin >= 0) {
      resilience.targetRtoMinutes = dr.rtoMin;
    }
    if (dr.strategy && typeof dr.strategy === 'string') {
      if (dr.strategy === 'coldStorage') resilience.drTopology = 'Backup & Restore';
      else if (dr.strategy === 'pilotLight') resilience.drTopology = 'Pilot Light';
      else if (dr.strategy === 'hotStandby') resilience.drTopology = 'Warm Standby';
    }
    if (typeof dr.wanMbps === 'number') resilience.wanBandwidthMbps = dr.wanMbps;
    if (typeof dr.journalTB === 'number') resilience.journalOverheadTB = dr.journalTB;
  }

  const importedLegacyContext: ImportedLegacyContext = {
    limitingDriver: blueprint?.limitingDriver,
    hcxNePairs: blueprint?.hcxNePairs,
    storagePolicy: blueprint?.storagePolicy || sizing?.storagePolicy,
    fileName: blueprint?.fileName,
    failoverNetwork: dr?.failoverNetwork,
    requiredBandwidthMbps: dr?.requiredBandwidthMbps,
    journalTB: dr?.journalTB,
    wanMbps: dr?.wanMbps,
    rawBlueprintState: blueprint || undefined,
    rawDrExport: dr || undefined,
    rawSizingExport: sizing || undefined
  };

  let notice: string | null = null;
  if (importedSources.length > 0) {
    notice = `Hydrated ${resolvedVMs} VMs & ${resolvedStorageTB} TB from ${importedSources.join(' + ')}.`;
  }

  return {
    model: {
      templateId,
      customerName: 'Global Financial Enterprises',
      architectName: 'Wasim Sayyed',
      projectDate: new Date().toISOString().split('T')[0],
      environments,
      interconnectLinks,
      resilience,
      activeServiceIds: [
        'azure-avd',
        'azure-firewall',
        'azure-anf',
        'azure-vwan',
        'nutanix-prism',
        'nutanix-move',
        'aws-tgw',
        'aws-fsx-ontap'
      ],
      importedLegacyContext
    },
    notice,
    conflictsResolved,
    importedSources
  };
}

/**
 * Writes back model values to the 3 legacy localStorage keys
 * without dropping existing fields, preserving full compatibility for existing tools.
 * NON-DESTRUCTIVE: reads and merges with current localStorage objects and preserves explicit VM counts.
 */
export function writebackLegacyStorage(model: DynamicTopologyModel): void {
  try {
    const env0 = model.environments[0];
    const env1 = model.environments[1] || env0;

    // Direct read of existing localStorage items to guarantee custom/unknown fields are never dropped
    let existingBlueprint: Record<string, any> = {};
    let existingDr: Record<string, any> = {};
    let existingSizing: Record<string, any> = {};

    try {
      const bRaw = typeof localStorage !== 'undefined' ? localStorage.getItem('zaboraa_4k_blueprint_state') : null;
      if (bRaw) existingBlueprint = JSON.parse(bRaw) || {};
    } catch {}

    try {
      const dRaw = typeof localStorage !== 'undefined' ? localStorage.getItem('zaboraa_dr_export') : null;
      if (dRaw) existingDr = JSON.parse(dRaw) || {};
    } catch {}

    try {
      const sRaw = typeof localStorage !== 'undefined' ? localStorage.getItem('zaboraa_sizing_export') : null;
      if (sRaw) existingSizing = JSON.parse(sRaw) || {};
    } catch {}

    // Resolve accurate VM count:
    // Prioritize explicit env0.vmCount, then imported raw values, falling back to ratio only as last resort
    const preservedVMs: number =
      (typeof env0?.vmCount === 'number' && !isNaN(env0.vmCount) && env0.vmCount > 0)
        ? env0.vmCount
        : (typeof model.importedLegacyContext?.rawBlueprintState?.totalVMs === 'number' && model.importedLegacyContext.rawBlueprintState.totalVMs > 0)
        ? model.importedLegacyContext.rawBlueprintState.totalVMs
        : (typeof model.importedLegacyContext?.rawSizingExport?.vms === 'number' && model.importedLegacyContext.rawSizingExport.vms > 0)
        ? model.importedLegacyContext.rawSizingExport.vms
        : (typeof model.importedLegacyContext?.rawDrExport?.vms === 'number' && model.importedLegacyContext.rawDrExport.vms > 0)
        ? model.importedLegacyContext.rawDrExport.vms
        : Math.round((env0?.totalVcpu || 760) / 2.5);

    // Decoupled storage TB preservation (handles valid 0)
    const decoupledStorageTB =
      (typeof env1?.storageTB === 'number' && !isNaN(env1.storageTB) && env1.storageTB >= 0)
        ? env1.storageTB
        : (typeof model.importedLegacyContext?.rawBlueprintState?.decoupledStorageTB === 'number')
        ? model.importedLegacyContext.rawBlueprintState.decoupledStorageTB
        : 120;

    // 1. zaboraa_4k_blueprint_state
    const legacyBlueprint: Record<string, any> = {
      ...existingBlueprint,
      ...(model.importedLegacyContext?.rawBlueprintState || {}),
      customerName: model.customerName,
      targetCloud: env1?.platform || 'Azure VMware Solution',
      nodeSku: env1?.nodeSku || 'AV36P',
      cloudNodes: env1?.hostCount || 4,
      totalVMs: preservedVMs,
      totalVCPUs: env0?.totalVcpu ?? 760,
      totalRAMGB: env0?.totalRamGB ?? 3072,
      totalStorageTB: env0?.storageTB ?? 240,
      decoupledStorageTB,
      timestamp: new Date().toISOString()
    };
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('zaboraa_4k_blueprint_state', JSON.stringify(legacyBlueprint));
    }

    // 2. zaboraa_dr_export
    const legacyDr: Record<string, any> = {
      ...existingDr,
      ...(model.importedLegacyContext?.rawDrExport || {}),
      engine: model.resilience.replicationEngine,
      strategy: model.resilience.drTopology === 'Backup & Restore' ? 'coldStorage' : model.resilience.drTopology === 'Warm Standby' ? 'hotStandby' : 'pilotLight',
      vms: preservedVMs,
      storageTB: env0?.storageTB ?? 240,
      rpoMin: (typeof model.resilience.targetRpoMinutes === 'number' && !isNaN(model.resilience.targetRpoMinutes)) ? model.resilience.targetRpoMinutes : 15,
      rtoMin: (typeof model.resilience.targetRtoMinutes === 'number' && !isNaN(model.resilience.targetRtoMinutes)) ? model.resilience.targetRtoMinutes : 60,
      wanMbps: model.resilience.wanBandwidthMbps || 1000,
      timestamp: new Date().toISOString()
    };
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('zaboraa_dr_export', JSON.stringify(legacyDr));
    }

    // 3. zaboraa_sizing_export
    const legacySizing: Record<string, any> = {
      ...existingSizing,
      ...(model.importedLegacyContext?.rawSizingExport || {}),
      cloud: env1?.platform.toLowerCase().includes('aws') ? 'vmc' : env1?.platform.toLowerCase().includes('google') ? 'gcve' : 'avs',
      provider: env1?.platform || 'Azure VMware Solution',
      vms: preservedVMs,
      storageTB: env0?.storageTB ?? 240,
      nodes: env1?.hostCount || 4,
      decoupledStorageTB,
      timestamp: new Date().toISOString()
    };
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('zaboraa_sizing_export', JSON.stringify(legacySizing));
    }
  } catch (err) {
    console.warn('Unable to write back to legacy storage keys:', err);
  }
}
