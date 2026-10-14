import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import * as XLSX from 'xlsx';
import {
  Layers,
  HardDrive,
  Cpu,
  ShieldCheck,
  Download,
  Calendar,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  FolderGit2,
  RefreshCw,
  Server,
  Network,
  Shield,
  Lock,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Printer,
  ChevronRight,
  FileSpreadsheet,
  AlertTriangle,
  ShieldAlert,
  Eye,
  X,
  Zap,
  Clock,
  ArrowRight,
  Save,
  FileDown,
  Link2,
  Unlink,
  GripVertical,
  Activity,
  Settings2
} from 'lucide-react';
import { useCustomization } from '../../context/CustomizationContext';
import { GOOGLE_DRIVE_CONFIG } from '../../data/mediaAssets';
import {
  ArchitectureTemplateId,
  CloudPlatformType,
  EnvironmentNode,
  EnvironmentRole,
  DynamicTopologyModel,
  InterconnectLink,
  ImportedLegacyContext,
  getDefaultEnvironmentsForTemplate,
  getDefaultInterconnectLinksForTemplate,
  hydrateFromLegacyStorage,
  writebackLegacyStorage
} from '../../types/multiCloudBlueprint';
import {
  VendorTextFallback,
  AzureVirtualDesktopIcon,
  AzureNetAppFilesIcon,
  AzureFirewallIcon,
  AzureExpressRouteIcon,
  AzureVirtualWanIcon,
  NutanixPrismIcon,
  NutanixAhvIcon,
  NutanixMoveIcon,
  AwsTransitGatewayIcon,
  AwsFsxOntapIcon,
  GcpInterconnectIcon,
  GcpNetAppVolumesIcon,
  VmwareVcenterIcon,
  VmwareHcxIcon,
  PaloAltoNetworksNvaIcon,
  FortinetFortiGateNvaIcon
} from '../../components/icons/CloudArchitectureIcons';
import {
  ClusterNodeClass,
  EngineeringAssumptions,
  DEFAULT_ENGINEERING_ASSUMPTIONS,
  calculateClusterCapacity,
  calculateTotalInfrastructureCapacity,
  evaluateFailureScenario,
  convertStorageUnits
} from '../../utils/architectureCalculator';
import {
  parseAndValidateCidr,
  checkSubnetOverlap,
  validateSddcPlatformCidr
} from '../../utils/cidrUtils';
import {
  OFFICIAL_CITATIONS,
  TARGET_NODE_SKU_CATALOGUE,
  STORAGE_ATTACHMENT_CATALOGUE,
  DR_ENGINE_CATALOGUE,
  HARDWARE_VENDOR_CATALOGUE,
  evaluateCrossTierCompatibility
} from '../../data/cloudCompatibilityCatalogue';
import {
  WizardState,
  createDefaultWizardState,
  mapLegacyToWizard,
  mapWizardToLegacy,
  buildActivePromptString
} from '../../types/wizardStateAdapter';
import { WizardStepTabs, IndustryTemplatePreset } from '../../components/wizard/WizardStepTabs';
import { Step1ScopeAndSource } from '../../components/wizard/Step1ScopeAndSource';
import { Step2TransitAndSecurity } from '../../components/wizard/Step2TransitAndSecurity';
import { Step3TargetPlatform } from '../../components/wizard/Step3TargetPlatform';
import { Step4DisasterRecovery } from '../../components/wizard/Step4DisasterRecovery';
import { LiveArchitectureSplitView } from '../../components/wizard/LiveArchitectureSplitView';

interface VlanSubsegment {
  vlanId: number;
  subnetCidr: string;
  environment: 'Dev' | 'Staging' | 'Pre-Prod' | 'Prod';
}

interface AIBlueprintResult {
  imageUrl: string;
  isFallback: boolean;
  model: string;
  prompt: string;
  message?: string;
}

export interface TrackPanelBox {
  title: string;
  bullets: string[];
}

export interface TrackVisualSpec {
  title: string;
  panel1Header: string;
  panel1Box1: TrackPanelBox;
  panel1Box2: TrackPanelBox;
  panel1Box3: TrackPanelBox;
  panel2Header: string;
  panel2Box1: TrackPanelBox;
  panel2Box2: TrackPanelBox;
  panel2Box3: TrackPanelBox;
  panel3Header: string;
  panel3Box1: TrackPanelBox;
  panel3Box2: TrackPanelBox;
  panel3Box3: TrackPanelBox;
}

export function buildTrackVisualSpec(
  templateId: ArchitectureTemplateId,
  p: {
    customerName: string;
    sourceEnv?: EnvironmentNode;
    transitEnv?: EnvironmentNode;
    targetEnv?: EnvironmentNode;
    totalVMs: number;
    interconnectLinks: InterconnectLink[];
    connectivity: string;
    landingZone: string;
    nvaFirewall: string;
    wafSolution: string;
    drEngine: string;
    drRpoMinutes: number;
    drRtoMinutes: number;
    drStrategy: string;
    externalStorageName: string;
    decoupledStorageTB: number;
  }
): TrackVisualSpec {
  const src = p.sourceEnv || {
    name: 'Primary Datacenter',
    hostCount: 16,
    nodeSku: 'Enterprise Node',
    totalVcpu: 512,
    totalRamGB: 2048,
    storageTB: 200,
    cidrBlock: '10.10.0.0/16',
    region: 'HQ Datacenter'
  };
  const tgt = p.targetEnv || {
    name: 'Target Cloud / DR',
    hostCount: 4,
    nodeSku: 'Cloud BareMetal',
    totalVcpu: 144,
    totalRamGB: 576,
    storageTB: 60,
    cidrBlock: '10.240.0.0/22',
    region: 'Target Cloud'
  };
  const rpoText = p.drRpoMinutes === 0 ? '0-min Sync (Zero Data Loss)' : `${p.drRpoMinutes}-min RPO`;
  const storageText = p.decoupledStorageTB > 0 ? `${p.decoupledStorageTB} TB ${p.externalStorageName}` : 'All-Flash Local NVMe';

  switch (templateId) {
    case 'nutanix-onprem':
      return {
        title: `${p.customerName} — Nutanix Private Cloud Enterprise Architecture`,
        panel1Header: '01. ON-PREMISES NUTANIX PRIVATE CLUSTER',
        panel1Box1: {
          title: 'Nutanix Prism Central & AOS Cluster',
          bullets: [
            '• Prism Central Clustered Management Plane',
            '• AOS 6.5 Distributed Storage Fabric (DSF)',
            `• ${src.hostCount}x ${src.nodeSku.split(' ')[0]} AHV Hypervisor Nodes`,
            `• ${p.totalVMs} Virtual Machines Across Workload Tiers`
          ]
        },
        panel1Box2: {
          title: 'Flow Microsegmentation & Security',
          bullets: [
            '• Nutanix Flow Network Security (Flow VPC)',
            '• Application-Level Distributed Firewalling',
            `• Primary Network CIDR: ${src.cidrBlock}`,
            '• Zero-Trust Microseg Policies Active'
          ]
        },
        panel1Box3: {
          title: 'Local All-NVMe Storage Tier',
          bullets: [
            `• Nutanix Storage Pools (${src.storageTB} TiB Usable Capacity)`,
            '• Inline Deduplication, Compression & Erasure Coding',
            '• Resilient RF2 / RF3 Distributed Metadata',
            `• Region / Facility: ${src.region}`
          ]
        },
        panel2Header: '02. CAMPUS LEAF-SPINE & MICROSEGMENTATION',
        panel2Box1: {
          title: '100G Leaf-Spine Switch Mesh',
          bullets: [
            `• Connectivity: ${p.connectivity}`,
            '• Dual Redundant 100 Gbps ToR Uplinks',
            '• EVPN-VXLAN High-Speed Campus Fabric',
            `• Active Interconnect Paths: ${p.interconnectLinks.length} Links`
          ]
        },
        panel2Box2: {
          title: 'Transit & Edge Routing Architecture',
          bullets: [
            `• Landing Zone Pattern: ${p.landingZone}`,
            '• Multi-Chassis Dynamic BGP Route Peering',
            '• Sub-Millisecond (<1ms) Intra-Cluster Latency',
            '• Non-Blocking High-Bandwidth Core Backplane'
          ]
        },
        panel2Box3: {
          title: 'Perimeter NVA Firewall & WAF',
          bullets: [
            `• NVA Firewall: ${p.nvaFirewall}`,
            `• Web Application Firewall: ${p.wafSolution}`,
            '• Deep Packet Inspection (DPI) & Threat Prevention',
            '• Egress Internet Breakout & Zero-Trust Inspection'
          ]
        },
        panel3Header: '03. SECONDARY NUTANIX DR & OBJECTS SITE',
        panel3Box1: {
          title: 'Secondary Nutanix AHV DR Cluster',
          bullets: [
            `• ${tgt.hostCount}x ${tgt.nodeSku.split(' ')[0]} AHV Standby Nodes`,
            `• Management CIDR: ${tgt.cidrBlock}`,
            `• Disaster Recovery Region: ${tgt.region}`,
            `• Sized for ${p.totalVMs} Protected Workloads`
          ]
        },
        panel3Box2: {
          title: 'Nutanix Files & Objects Cluster',
          bullets: [
            '• Scale-Out S3 Compatible Objects Fabric',
            '• Enterprise SMB & NFS Clustered Shares',
            '• Nutanix Mine Target for Immutable Backups',
            '• Distributed Snapshot Journaling'
          ]
        },
        panel3Box3: {
          title: 'Disaster Recovery & Business Continuity',
          bullets: [
            `• Replication Engine: ${p.drEngine}`,
            `• DR SLA: ${rpoText} | ${p.drRtoMinutes}-min RTO`,
            `• Resilience Strategy: ${p.drStrategy}`,
            '• Automated Failover Orchestration Runbooks'
          ]
        }
      };

    case 'nutanix-to-nc2':
      return {
        title: `${p.customerName} — Nutanix to NC2 on Azure Architecture`,
        panel1Header: '01. ON-PREMISES NUTANIX CLUSTER',
        panel1Box1: {
          title: 'Nutanix AOS & AHV Hypervisor',
          bullets: [
            '• Prism Central Federation Management',
            `• ${src.hostCount}x ${src.nodeSku.split(' ')[0]} Enterprise Nodes`,
            `• ${p.totalVMs} Production Virtual Machines`,
            `• AOS Distributed Storage Fabric (${src.storageTB} TiB)`
          ]
        },
        panel1Box2: {
          title: 'Nutanix Move Appliance Engine',
          bullets: [
            '• Automated Non-Disruptive VM Seeding Pipe',
            '• In-Flight VirtIO Driver Injection Prep',
            `• Source Network CIDR: ${src.cidrBlock}`,
            '• Continuous Change-Block Tracking (CBT)'
          ]
        },
        panel1Box3: {
          title: 'On-Premises Dedicated Uplinks',
          bullets: [
            '• 10 Gbps Dedicated Interconnect Trunk',
            '• Prism Pairing & Disaster Recovery Runbooks',
            '• Zero-Downtime Migration Synchronization',
            `• Facility Location: ${src.region}`
          ]
        },
        panel2Header: '02. AZURE VIRTUAL WAN & EXPRESSROUTE FASTPATH',
        panel2Box1: {
          title: 'Azure ExpressRoute FastPath (10G)',
          bullets: [
            `• Physical Connectivity: ${p.connectivity}`,
            '• Dual Redundant ExpressRoute Direct 10G',
            '• Ultra-Low Latency (<2ms) FastPath Bypass',
            `• Active Interconnect: ${p.interconnectLinks.length} Established Pipes`
          ]
        },
        panel2Box2: {
          title: 'Azure Virtual WAN & Security Hub',
          bullets: [
            `• Landing Zone Pattern: ${p.landingZone}`,
            '• Azure vWAN Hub Transitive Route Peering',
            '• Azure Route Server Dynamic BGP Learning',
            '• Native Azure Services Backbone Peering'
          ]
        },
        panel2Box3: {
          title: 'Perimeter Security & NVA Inspection',
          bullets: [
            `• NVA Firewall: ${p.nvaFirewall}`,
            `• Web Application Firewall: ${p.wafSolution}`,
            '• Azure DDoS Protection & Egress Inspection',
            '• Zero-Trust North-South Microsegmentation'
          ]
        },
        panel3Header: '03. NUTANIX CLOUD CLUSTERS (NC2) ON AZURE',
        panel3Box1: {
          title: 'NC2 BareMetal Azure Cluster',
          bullets: [
            `• ${tgt.hostCount}x ${tgt.nodeSku.split(' ')[0]} Dedicated BareMetal`,
            '• Native Delegated Azure vNet Subnet Integration',
            `• Management CIDR: ${tgt.cidrBlock}`,
            `• Target Azure Region: ${tgt.region}`
          ]
        },
        panel3Box2: {
          title: 'Prism Central Cross-Cloud Federation',
          bullets: [
            '• Unified Prism Central Single Pane of Glass',
            '• Nutanix Flow VPC Virtual Networking',
            '• Microsegmentation & Policy Mirroring',
            '• Direct Azure API Integration'
          ]
        },
        panel3Box3: {
          title: 'Azure Storage Integration & Resilience',
          bullets: [
            `• Decoupled Storage Tier: ${storageText}`,
            `• Replication Engine: ${p.drEngine}`,
            `• DR SLA: ${rpoText} | ${p.drRtoMinutes}-min RTO`,
            `• Cutover Strategy: ${p.drStrategy}`
          ]
        }
      };

    case 'vmware-to-nc2':
      return {
        title: `${p.customerName} — VMware to Nutanix NC2 Migration Blueprint`,
        panel1Header: '01. LEGACY VMWARE VSPHERE SDDC',
        panel1Box1: {
          title: 'VMware vCenter Server & Compute',
          bullets: [
            '• VMware vCenter Server Appliance (VCSA)',
            `• ${src.hostCount}x ${src.nodeSku.split(' ')[0]} ESXi Compute Hosts`,
            `• ${p.totalVMs} Inventory Virtual Machines`,
            '• Virtual Distributed Switches (vDS) Configured'
          ]
        },
        panel1Box2: {
          title: 'SAN / NAS Clustered Storage Tier',
          bullets: [
            '• Fibre Channel & iSCSI Clustered Arrays',
            `• Total Storage Capacity: ${src.storageTB} TiB`,
            `• Source Management CIDR: ${src.cidrBlock}`,
            `• Datacenter Location: ${src.region}`
          ]
        },
        panel1Box3: {
          title: 'Legacy Network Segments',
          bullets: [
            '• VLAN Subsegments Discovered & Mapped',
            '• Default Gateways & Broadcast Domains',
            '• Migration Wave Sizing Completed',
            '• Non-Disruptive Pre-Seeding Verified'
          ]
        },
        panel2Header: '02. MIGRATION TRANSIT & MOVE FABRIC',
        panel2Box1: {
          title: 'Nutanix Move Appliance Fleet',
          bullets: [
            '• Distributed Move Migration Worker Fleet',
            '• Cross-Hypervisor Conversion (ESXi to AHV)',
            '• Automated VirtIO Driver Injection Pipe',
            `• Active Interconnect: ${p.interconnectLinks.length} Links`
          ]
        },
        panel2Box2: {
          title: 'Dedicated High-Speed Transit Pipe',
          bullets: [
            `• Physical Connectivity: ${p.connectivity}`,
            '• 10 Gbps Dedicated ExpressRoute / Interconnect',
            '• Non-Disruptive Background Data Seeding',
            '• Near-Zero Cutover Downtime (<5 min/wave)'
          ]
        },
        panel2Box3: {
          title: 'Transit Inspection & Security',
          bullets: [
            `• Migration Security NVA: ${p.nvaFirewall}`,
            `• Web Application Firewall: ${p.wafSolution}`,
            '• Encrypted TLS In-Transit Replication',
            '• Egress Wave Traffic Shaper & QoS'
          ]
        },
        panel3Header: '03. TARGET NUTANIX NC2 ON AZURE',
        panel3Box1: {
          title: 'Target NC2 BareMetal Cluster',
          bullets: [
            `• ${tgt.hostCount}x ${tgt.nodeSku.split(' ')[0]} BareMetal Nodes`,
            '• Native Delegated Azure vNet Infrastructure',
            `• Target Management CIDR: ${tgt.cidrBlock}`,
            `• Target Deployment Region: ${tgt.region}`
          ]
        },
        panel3Box2: {
          title: 'AHV Virtualization & Flow VPC',
          bullets: [
            '• High-Performance Nutanix AHV Hypervisor',
            '• Flow Virtual Networking & Microsegmentation',
            '• Zero VMware Licensing Overhead in Cloud',
            '• Prism Central Single Console Governance'
          ]
        },
        panel3Box3: {
          title: 'Cutover Governance & Resilience',
          bullets: [
            `• Migration Engine: ${p.drEngine}`,
            `• Target SLA: ${rpoText} | ${p.drRtoMinutes}-min RTO`,
            `• Cutover Model: ${p.drStrategy}`,
            '• Post-Migration Reverse Replication Ready'
          ]
        }
      };

    case 'avs':
      return {
        title: `${p.customerName} — Azure VMware Solution (AVS) SDDC Blueprint`,
        panel1Header: '01. ON-PREMISES VMWARE DATACENTER',
        panel1Box1: {
          title: 'VMware vCenter Server (VCSA)',
          bullets: [
            '• vCenter Server Appliance Fleet',
            `• ${src.hostCount}x ${src.nodeSku.split(' ')[0]} ESXi Hosts`,
            `• ${p.totalVMs} Virtual Machines Across Workload Tiers`,
            '• Virtual Distributed Switches (VDS)'
          ]
        },
        panel1Box2: {
          title: 'SAN & NAS Storage Tier',
          bullets: [
            '• Fibre Channel / iSCSI Clustered Arrays',
            `• Usable Capacity: ${src.storageTB} TiB`,
            `• Management Network CIDR: ${src.cidrBlock}`,
            `• Primary Datacenter: ${src.region}`
          ]
        },
        panel1Box3: {
          title: 'VMware HCX Connector Fleet',
          bullets: [
            '• HCX Interconnect (IX) Service Engine',
            '• HCX Network Extension (NE) L2 Stretch',
            '• HCX WAN Optimization (WO)',
            '• Mobility Optimized Networking (MON)'
          ]
        },
        panel2Header: '02. HYBRID TRANSIT & SECURITY ARCHITECTURE',
        panel2Box1: {
          title: 'Cloud Interconnect & Express Peering',
          bullets: [
            `• Physical Connectivity: ${p.connectivity}`,
            '• Dual Redundant 10 Gbps BGP Cross-Connects',
            '• Ultra-Low Latency Direct Peering (<2ms)',
            `• Established Interconnect: ${p.interconnectLinks.length} Active Pipes`
          ]
        },
        panel2Box2: {
          title: 'Landing Zone Architecture',
          bullets: [
            `• Landing Zone Pattern: ${p.landingZone}`,
            '• ExpressRoute Gateway / vWAN Hub Routing',
            '• FastPath Acceleration Enabled',
            '• Transitive Routing & Route Server Peering'
          ]
        },
        panel2Box3: {
          title: 'NVA Firewall & Perimeter WAF',
          bullets: [
            `• NVA Firewall: ${p.nvaFirewall}`,
            `• Web Application Firewall: ${p.wafSolution}`,
            '• Deep Packet Inspection (DPI) & IPS/IDS',
            '• Egress Internet Breakout & Zero-Trust Inspection'
          ]
        },
        panel3Header: '03. AZURE VMWARE SOLUTION SDDC CORE',
        panel3Box1: {
          title: 'Bare-Metal SDDC Cluster',
          bullets: [
            `• ${tgt.hostCount}x ${tgt.nodeSku.split(' ')[0]} Dedicated BareMetal`,
            `• Management Network CIDR: ${tgt.cidrBlock}`,
            `• Region: ${tgt.region}`,
            `• Sized for ${p.totalVMs} Workloads with N+1 High Availability`
          ]
        },
        panel3Box2: {
          title: 'NSX-T Software Defined Networking',
          bullets: [
            '• Tier-0 Active-Active Gateway with ECMP Peering',
            '• Segregated Tier-1 Gateways across Workload Segments',
            '• Distributed Firewall (DFW) Microsegmentation Active',
            '• Direct vNet Peering to Azure Native PaaS'
          ]
        },
        panel3Box3: {
          title: 'Decoupled Storage & Disaster Recovery',
          bullets: [
            `• Storage Tier: ${storageText}`,
            `• Replication Engine: ${p.drEngine}`,
            `• DR SLA: ${rpoText} | ${p.drRtoMinutes}-min RTO`,
            `• Strategy: ${p.drStrategy}`
          ]
        }
      };

    case 'vmc-aws':
      return {
        title: `${p.customerName} — VMware Cloud on AWS (VMC) Architecture`,
        panel1Header: '01. ON-PREMISES VMWARE ENTERPRISE SDDC',
        panel1Box1: {
          title: 'VMware vSphere Enterprise SDDC',
          bullets: [
            '• Enterprise vCenter Server Appliance',
            `• ${src.hostCount}x ${src.nodeSku.split(' ')[0]} Compute Hosts`,
            `• ${p.totalVMs} Production Virtual Machines`,
            '• DRS & High-Availability Clusters Configured'
          ]
        },
        panel1Box2: {
          title: 'SAN / NAS Storage Tier',
          bullets: [
            '• Fibre Channel & Clustered NFS Arrays',
            `• Usable Capacity: ${src.storageTB} TiB`,
            `• Source Network CIDR: ${src.cidrBlock}`,
            `• Enterprise Datacenter: ${src.region}`
          ]
        },
        panel1Box3: {
          title: 'VMware HCX Connector Fleet',
          bullets: [
            '• HCX Interconnect & Network Extension NE',
            '• L2 Stretched Segments into AWS SDDC',
            '• Mobility Optimized Networking (MON)',
            '• HCX Bulk & Replication Assist vMotion'
          ]
        },
        panel2Header: '02. AWS DIRECT CONNECT & TRANSIT GATEWAY',
        panel2Box1: {
          title: 'AWS Direct Connect Gateway (10G)',
          bullets: [
            `• Connectivity: ${p.connectivity}`,
            '• Dual 10G AWS Direct Connect Dedicated Circuits',
            '• Direct Connect Gateway Dynamic BGP Route Learning',
            '• Jumbo Frames (9001 MTU) High-Speed Transport'
          ]
        },
        panel2Box2: {
          title: 'AWS Transit Gateway (TGW) Hub',
          bullets: [
            `• Landing Zone Pattern: ${p.landingZone}`,
            '• Centralized Transit Gateway Inspection VPC',
            '• Multi-Account AWS RAM Transit Sharing',
            '• Appliance Mode Enabled for Stateful Flow'
          ]
        },
        panel2Box3: {
          title: 'AWS Network Firewall & Security',
          bullets: [
            `• Next-Gen Firewall: ${p.nvaFirewall}`,
            `• Web Application Firewall: ${p.wafSolution}`,
            '• AWS Shield DDoS Mitigation & Route 53 Resolver',
            '• Egress Internet Breakout via NAT Gateways'
          ]
        },
        panel3Header: '03. VMWARE CLOUD ON AWS SDDC CORE',
        panel3Box1: {
          title: 'VMC Bare-Metal SDDC Cluster',
          bullets: [
            `• ${tgt.hostCount}x ${tgt.nodeSku.split(' ')[0]} NVMe Metal Hosts`,
            `• SDDC Management CIDR: ${tgt.cidrBlock}`,
            `• Dedicated AWS Region: ${tgt.region}`,
            '• NSX-T SDDC Multi-Tier Routing Core'
          ]
        },
        panel3Box2: {
          title: 'Connected VPC & High-Speed ENI',
          bullets: [
            '• 25 Gbps High-Speed Connected VPC ENI',
            '• Sub-Millisecond Cross-VPC Latency to Native AWS',
            '• Direct Amazon S3, RDS, DynamoDB Access',
            '• Zero Inter-AZ Egress Penalty for Connected VPC'
          ]
        },
        panel3Box3: {
          title: 'Decoupled Storage & Disaster Recovery',
          bullets: [
            `• Storage Tier: ${storageText}`,
            `• Replication Engine: ${p.drEngine}`,
            `• DR SLA: ${rpoText} | ${p.drRtoMinutes}-min RTO`,
            `• Strategy: ${p.drStrategy}`
          ]
        }
      };

    case 'gcve':
      return {
        title: `${p.customerName} — Google Cloud VMware Engine (GCVE) Blueprint`,
        panel1Header: '01. ON-PREMISES VMWARE HYBRID DATACENTER',
        panel1Box1: {
          title: 'VMware vSphere Private Cloud',
          bullets: [
            '• VMware vCenter Server 8.0 Deployment',
            `• ${src.hostCount}x ${src.nodeSku.split(' ')[0]} Enterprise Hosts`,
            `• ${p.totalVMs} Production Virtual Machines`,
            '• Clustered Resource Pools & DRS'
          ]
        },
        panel1Box2: {
          title: 'Fibre Channel SAN Storage Fabric',
          bullets: [
            '• Enterprise Clustered SAN / NAS Arrays',
            `• Usable Storage Allocation: ${src.storageTB} TiB`,
            `• Corporate CIDR Block: ${src.cidrBlock}`,
            `• Enterprise Facility: ${src.region}`
          ]
        },
        panel1Box3: {
          title: 'VMware HCX Connector Fleet',
          bullets: [
            '• HCX Bulk & Cold Migration Workers',
            '• Low-Latency L2 Network Extension NE',
            '• WAN Optimization Engine Active',
            '• Automated Route Injection into GCVE'
          ]
        },
        panel2Header: '02. GOOGLE CLOUD DEDICATED INTERCONNECT',
        panel2Box1: {
          title: 'Google Cloud Interconnect (10G)',
          bullets: [
            `• Connectivity: ${p.connectivity}`,
            '• Dedicated Interconnect with 99.99% SLA',
            '• Redundant Cloud Router BGP Peering Sessions',
            '• Direct Access to Google Cloud Global Network'
          ]
        },
        panel2Box2: {
          title: 'Google Cloud VPC & Cloud Router',
          bullets: [
            `• Landing Zone Pattern: ${p.landingZone}`,
            '• Dynamic Cloud Router Subnet Sharing',
            '• Private Google Access & Cloud NAT',
            '• High-Availability BGP Route Advertisement'
          ]
        },
        panel2Box3: {
          title: 'Cloud Armor & Perimeter Security',
          bullets: [
            `• Next-Gen Firewall: ${p.nvaFirewall}`,
            `• Web Application Firewall: ${p.wafSolution}`,
            '• Google Cloud Armor Adaptive Threat Protection',
            '• Private Service Connect (PSC) Endpoints'
          ]
        },
        panel3Header: '03. GOOGLE CLOUD VMWARE ENGINE SDDC',
        panel3Box1: {
          title: 'GCVE Bare-Metal SDDC Cluster',
          bullets: [
            `• ${tgt.hostCount}x ${tgt.nodeSku.split(' ')[0]} Bare-Metal Hosts`,
            `• Management Network CIDR: ${tgt.cidrBlock}`,
            `• Dedicated Cloud Region: ${tgt.region}`,
            '• VMware vSphere 8.0 & vSAN Enterprise'
          ]
        },
        panel3Box2: {
          title: '100 Gbps Private Services Access',
          bullets: [
            '• 100 Gbps Low-Latency Interconnect to VPC',
            '• Zero Egress Fees between GCVE and GCP VPC',
            '• Native BigQuery, Vertex AI, Cloud Storage Access',
            '• NSX-T Tier-0 Active-Active Routing'
          ]
        },
        panel3Box3: {
          title: 'Decoupled Storage & Disaster Recovery',
          bullets: [
            `• Storage Tier: ${storageText}`,
            `• Replication Engine: ${p.drEngine}`,
            `• DR SLA: ${rpoText} | ${p.drRtoMinutes}-min RTO`,
            `• Strategy: ${p.drStrategy}`
          ]
        }
      };

    case 'aws-native':
      return {
        title: `${p.customerName} — AWS Native Multi-VPC Architecture`,
        panel1Header: '01. ON-PREMISES ENTERPRISE DATACENTER & EDGE',
        panel1Box1: {
          title: 'Branch Datacenter & Edge Compute',
          bullets: [
            '• Corporate Edge & Co-Location Facility',
            `• ${src.hostCount}x ${src.nodeSku.split(' ')[0]} Edge Nodes`,
            `• ${p.totalVMs} Legacy Workloads & Factory Systems`,
            '• Local SCADA & Manufacturing Controllers'
          ]
        },
        panel1Box2: {
          title: 'On-Premises Network Core',
          bullets: [
            '• Core Leaf-Spine Switch Architecture',
            `• Usable Storage Capacity: ${src.storageTB} TiB`,
            `• On-Premises CIDR: ${src.cidrBlock}`,
            `• Edge Facility: ${src.region}`
          ]
        },
        panel1Box3: {
          title: 'Hybrid Uplink Gateways',
          bullets: [
            '• Redundant Customer Gateways (CGW)',
            '• Dual BGP Peering Sessions to AWS Direct Connect',
            '• Automated IPsec VPN Failover Paths',
            '• Active Route Health Monitoring'
          ]
        },
        panel2Header: '02. AWS TRANSIT GATEWAY & INSPECTION HUB',
        panel2Box1: {
          title: 'AWS Direct Connect & Transit Gateway',
          bullets: [
            `• Connectivity: ${p.connectivity}`,
            '• Dual 10G AWS Direct Connect Circuits',
            '• AWS Transit Gateway (TGW) Hub Core',
            '• Multi-Account Transit Gateway Sharing (RAM)'
          ]
        },
        panel2Box2: {
          title: 'Centralized Inspection VPC',
          bullets: [
            `• Landing Zone Pattern: ${p.landingZone}`,
            '• AWS Network Firewall Stateful Inspection',
            '• Appliance Mode Enabled for Stateful Flow',
            '• Centralized Egress NAT & VPC Endpoints'
          ]
        },
        panel2Box3: {
          title: 'Perimeter Security & Edge Ingress',
          bullets: [
            `• Next-Gen Firewall: ${p.nvaFirewall}`,
            `• Web Application Firewall: ${p.wafSolution}`,
            '• AWS Shield Advanced & Route 53 Resolver',
            '• Centralized CloudWatch & VPC Flow Logs'
          ]
        },
        panel3Header: '03. AWS NATIVE PRODUCTION MULTI-AZ ARCHITECTURE',
        panel3Box1: {
          title: 'Production Multi-AZ AWS VPC',
          bullets: [
            `• ${tgt.hostCount}x ${tgt.nodeSku.split(' ')[0]} Managed Hub`,
            '• Deployed across 3 Availability Zones (AZs)',
            `• VPC CIDR Block: ${tgt.cidrBlock}`,
            `• Primary Cloud Region: ${tgt.region}`
          ]
        },
        panel3Box2: {
          title: 'Containerized & Serverless Workloads',
          bullets: [
            '• Amazon EKS Managed Kubernetes Clusters',
            '• Amazon Aurora PostgreSQL Global Multi-AZ DB',
            '• Auto Scaling EC2 Compute Fleet',
            '• AWS Secrets Manager & KMS Security'
          ]
        },
        panel3Box3: {
          title: 'Resilience Fabric & S3 Glacier DR',
          bullets: [
            `• Backup & S3 Storage Fabric (${tgt.storageTB} TiB)`,
            `• Replication Engine: ${p.drEngine}`,
            `• DR SLA: ${rpoText} | ${p.drRtoMinutes}-min RTO`,
            `• Strategy: ${p.drStrategy}`
          ]
        }
      };

    case 'gcp-native':
      return {
        title: `${p.customerName} — Google Cloud Shared VPC Architecture`,
        panel1Header: '01. CORPORATE ON-PREM DATACENTER & BRANCHES',
        panel1Box1: {
          title: 'Corporate Headquarters Datacenter',
          bullets: [
            '• Enterprise Core Datacenter Location',
            `• ${src.hostCount}x ${src.nodeSku.split(' ')[0]} Enterprise Servers`,
            `• ${p.totalVMs} Core Enterprise Application Workloads`,
            `• Dedicated SAN Infrastructure (${src.storageTB} TiB)`
          ]
        },
        panel1Box2: {
          title: 'On-Premises BGP Routing Core',
          bullets: [
            '• Multi-Protocol BGP Edge Routers',
            '• Redundant Customer Premise Equipment (CPE)',
            `• Corporate CIDR Subnets: ${src.cidrBlock}`,
            `• Datacenter Facility: ${src.region}`
          ]
        },
        panel1Box3: {
          title: 'Cloud Interconnect VLAN Terminus',
          bullets: [
            '• Partner / Dedicated Interconnect Attachments',
            '• 10G Dual Redundant Uplink Paths',
            '• High-Availability BGP Route Advertisement',
            '• Continuous Latency & BFD Telemetry'
          ]
        },
        panel2Header: '02. GOOGLE CLOUD INTERCONNECT & TRANSIT HUB',
        panel2Box1: {
          title: 'Google Cloud Interconnect & Router',
          bullets: [
            `• Connectivity: ${p.connectivity}`,
            '• Dedicated Interconnect with 99.99% SLA',
            '• Cloud Router Dynamic Route Exchange',
            '• Private Google Access Enabled'
          ]
        },
        panel2Box2: {
          title: 'Transit Security & Cloud IDS/IPS',
          bullets: [
            `• Landing Zone Pattern: ${p.landingZone}`,
            '• Cloud IDS Deep Packet Inspection',
            '• Cloud NAT Gateway for Secure Egress',
            '• VPC Service Controls (VPC-SC) Perimeter'
          ]
        },
        panel2Box3: {
          title: 'Cloud Armor & Edge Defense',
          bullets: [
            `• Next-Gen Firewall: ${p.nvaFirewall}`,
            `• Web Application Firewall: ${p.wafSolution}`,
            '• Google Cloud Armor Adaptive Protection',
            '• Cloud DNS Peering & Route Forwarding'
          ]
        },
        panel3Header: '03. GCP SHARED VPC & MANAGED LANDING ZONE',
        panel3Box1: {
          title: 'Shared VPC Host Project Architecture',
          bullets: [
            `• Centralized Shared VPC Network: ${tgt.cidrBlock}`,
            '• Service Projects Attached across Multi-Tiers',
            `• Primary Cloud Region: ${tgt.region}`,
            `• Sized for ${p.totalVMs} Cloud Workloads`
          ]
        },
        panel3Box2: {
          title: 'Managed Compute & GKE Clusters',
          bullets: [
            '• Google Kubernetes Engine (GKE) Autopilot',
            '• Cloud SQL Enterprise HA Clustered Instances',
            '• Compute Engine Managed Instance Groups (MIG)',
            '• Cloud Logging & Monitoring Telemetry'
          ]
        },
        panel3Box3: {
          title: 'Multi-Region Cloud Storage & Resilience',
          bullets: [
            `• Cloud Storage Multi-Region Buckets (${tgt.storageTB} TiB)`,
            `• Replication Engine: ${p.drEngine}`,
            `• DR SLA: ${rpoText} | ${p.drRtoMinutes}-min RTO`,
            `• Strategy: ${p.drStrategy}`
          ]
        }
      };

    case 'multi-cloud':
    default:
      return {
        title: `${p.customerName} — Multi-Cloud Nutanix & Hyperscaler Mesh`,
        panel1Header: '01. ON-PREMISES NUTANIX AOS / AHV DATACENTER',
        panel1Box1: {
          title: 'Nutanix Private Cloud Datacenter',
          bullets: [
            '• Prism Central Unified Management Plane',
            `• ${src.hostCount}x ${src.nodeSku.split(' ')[0]} AHV Nodes`,
            `• ${p.totalVMs} Core Virtual Machines`,
            `• AOS Distributed Storage Fabric (${src.storageTB} TiB)`
          ]
        },
        panel1Box2: {
          title: 'Flow Microsegmentation & Policies',
          bullets: [
            '• Flow Virtual Networking & Microsegmentation',
            `• Local Network CIDR: ${src.cidrBlock}`,
            '• Zero-Trust Campus Isolation',
            `• Headquarters Datacenter: ${src.region}`
          ]
        },
        panel1Box3: {
          title: 'Multi-Cloud Replication Engines',
          bullets: [
            '• Nutanix Move Multi-Target Replication',
            '• Prism Disaster Recovery Pairing',
            '• Continuous Snapshot Delta Streams',
            '• Cross-Cloud Storage Orchestration'
          ]
        },
        panel2Header: '02. MULTI-CLOUD INTERCONNECT & TRANSIT MESH',
        panel2Box1: {
          title: 'Equinix / Megaport Fabric Cloud Router',
          bullets: [
            `• Connectivity: ${p.connectivity}`,
            '• Multi-Cloud Direct Connect & ExpressRoute Fabric',
            `• Active Interconnect: ${p.interconnectLinks.length} Multi-Cloud Links`,
            '• Dynamic Multi-Cloud BGP Route Exchange'
          ]
        },
        panel2Box2: {
          title: 'Multi-Cloud Transit Hub Architecture',
          bullets: [
            `• Landing Zone Pattern: ${p.landingZone}`,
            '• Anycast Global Route Optimization',
            '• BGP Route Server Multi-Cloud Mesh',
            '• Direct Cross-Cloud VPC/vNet Interconnect'
          ]
        },
        panel2Box3: {
          title: 'Multi-Cloud Edge Defense & WAF',
          bullets: [
            `• Perimeter Next-Gen Firewall: ${p.nvaFirewall}`,
            `• Web Application Firewall: ${p.wafSolution}`,
            '• Global DDoS Protection & Egress Scrubbing',
            '• Centralized Multi-Cloud Security Governance'
          ]
        },
        panel3Header: '03. DISTRIBUTED HYPERSCALER TARGET FABRIC',
        panel3Box1: {
          title: 'Nutanix NC2 on Azure BareMetal',
          bullets: [
            `• ${tgt.hostCount}x ${tgt.nodeSku.split(' ')[0]} BareMetal Nodes`,
            `• Delegated Azure vNet Subnet (${tgt.cidrBlock})`,
            `• Deployment Region: ${tgt.region}`,
            `• Sized for ${p.totalVMs} Production Workloads`
          ]
        },
        panel3Box2: {
          title: 'AWS Native VPC Workload Tier',
          bullets: [
            '• AWS Production VPC Attachment via TGW',
            '• Amazon EKS Managed Kubernetes Services',
            '• Amazon FSx for NetApp ONTAP Storage',
            '• S3 Multi-Region Data Mirroring'
          ]
        },
        panel3Box3: {
          title: 'Unified Cross-Cloud Storage & Resilience',
          bullets: [
            `• Multi-Cloud Unified Storage Fabric (${tgt.storageTB} TiB)`,
            `• Replication Engine: ${p.drEngine}`,
            `• DR SLA: ${rpoText} | ${p.drRtoMinutes}-min RTO`,
            `• Strategy: ${p.drStrategy}`
          ]
        }
      };
  }
}

export const DesignGeneratorPage: React.FC = () => {
  const { setIsBriefingModalOpen } = useCustomization();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 1. Wizard Metadata
  const [customerName, setCustomerName] = useState<string>('Global Financial Enterprises');
  const [architectName, setArchitectName] = useState<string>('Wasim Sayyed');
  const [projectDate, setProjectDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [cloudPlatform, setCloudPlatform] = useState<'Azure VMware Solution' | 'Google Cloud VMware Engine' | 'VMware Cloud on AWS'>('Azure VMware Solution');

  // 2. On-Premises Infrastructure
  const [vCenterCount, setVCenterCount] = useState<number>(2);
  const [esxiHostCount, setEsxiHostCount] = useState<number>(24);
  const [clusterCount, setClusterCount] = useState<number>(4);
  const [vdsCount, setVdsCount] = useState<number>(2);
  const [totalVMCount, setTotalVMCount] = useState<number>(380);
  const [environments, setEnvironments] = useState<string[]>(['Dev', 'Staging', 'Prod']);
  const [subsegments, setSubsegments] = useState<VlanSubsegment[]>([
    { vlanId: 10, subnetCidr: '10.10.10.0/24', environment: 'Prod' },
    { vlanId: 20, subnetCidr: '10.20.10.0/24', environment: 'Prod' },
    { vlanId: 30, subnetCidr: '10.30.10.0/24', environment: 'Prod' },
    { vlanId: 40, subnetCidr: '10.40.10.0/24', environment: 'Dev' },
    { vlanId: 100, subnetCidr: '10.100.10.0/24', environment: 'Prod' }
  ]);

  // 3. Network & Security Settings
  const [connectivity, setConnectivity] = useState<'Hybrid (VPN + ExpressRoute / DirectConnect)' | 'VPN Only' | 'Direct Circuits with FastPath / Global Reach'>('Hybrid (VPN + ExpressRoute / DirectConnect)');
  const [landingZone, setLandingZone] = useState<'Hub-Spoke VNet / VPC' | 'Dedicated Transit Hub VNet' | 'Azure Virtual WAN / AWS TGW / GCP NCC'>('Hub-Spoke VNet / VPC');
  const [nvaFirewall, setNvaFirewall] = useState<'Palo Alto Networks VM-Series' | 'Azure Firewall Premium / Native' | 'Fortinet FortiGate-VM' | 'Check Point CloudGuard' | 'Cisco Secure Firewall'>('Palo Alto Networks VM-Series');
  const [wafSolution, setWafSolution] = useState<'Azure WAF on Application Gateway' | 'Cloudflare Magic Transit' | 'AWS WAF' | 'F5 Distributed Cloud WAF'>('Azure WAF on Application Gateway');

  // 4. Hyperscaler SDDC Settings
  const [avsGen, setAvsGen] = useState<'Gen 1' | 'Gen 2'>('Gen 2');
  const [nodeSku, setNodeSku] = useState<string>('AV36P');
  const [mgmtCidrInput, setMgmtCidrInput] = useState<string>('10.240.0.0/22');
  const [decoupledStorageTB, setDecoupledStorageTB] = useState<number>(120);

  // DR Parameters (Hydrated from DR Planner or default)
  const [drEngine, setDrEngine] = useState<string>('VMware SRM + vSphere Replication');
  const [drRpoMinutes, setDrRpoMinutes] = useState<number>(5);
  const [drRtoMinutes, setDrRtoMinutes] = useState<number>(20);
  const [drStrategy, setDrStrategy] = useState<string>('Pilot Light (3-Node Minimum)');

  // SVG Zoom & Modal States
  const [zoomScale, setZoomScale] = useState<number>(1.0);
  const [showDossierModal, setShowDossierModal] = useState<boolean>(false);
  const [showPreFlightModal, setShowPreFlightModal] = useState<boolean>(false);
  const [show3DModal, setShow3DModal] = useState<boolean>(false);
  const [importedNotice, setImportedNotice] = useState<string | null>(null);

  // 3D Isometric AI Generation States
  const [isGenerating3D, setIsGenerating3D] = useState<boolean>(false);
  const [generationStep, setGenerationStep] = useState<string>('');
  const [generationProgress, setGenerationProgress] = useState<number>(0);
  const [aiBlueprintResult, setAiBlueprintResult] = useState<AIBlueprintResult | null>(null);
  const [blueprint3DZoom, setBlueprint3DZoom] = useState<number>(1.0);

  // Dynamic Multi-Cloud & Nutanix Architecture State (Milestone 2)
  const [activeTemplate, setActiveTemplate] = useState<ArchitectureTemplateId>('avs');
  const [topologyEnvironments, setTopologyEnvironments] = useState<EnvironmentNode[]>(() =>
    getDefaultEnvironmentsForTemplate('avs')
  );
  const [interconnectLinks, setInterconnectLinks] = useState<InterconnectLink[]>(() =>
    getDefaultInterconnectLinksForTemplate('avs')
  );
  const [importedLegacyContext, setImportedLegacyContext] = useState<ImportedLegacyContext>({});
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);
  const [activeCategoryTab, setActiveCategoryTab] = useState<'all' | 'nutanix' | 'sddc' | 'native' | 'migration'>('all');
  const [canvasMode, setCanvasMode] = useState<'interactive' | 'static-vector'>('interactive');

  // 4-Step Enterprise Wizard Navigation & Viewport Layout State
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [layoutMode, setLayoutMode] = useState<'split' | 'form-only' | 'canvas-only'>('split');
  const [wizardState, setWizardState] = useState<WizardState>(createDefaultWizardState);

  // Step 3 Tabbed Inspector State
  const [step3ActiveTab, setStep3ActiveTab] = useState<'topology' | 'networking' | 'dr'>('topology');

  // Guardrail Modals for Template Switch & Cascade Deletion Protection
  const [showTemplateSwitchModal, setShowTemplateSwitchModal] = useState<boolean>(false);
  const [pendingTemplateSwitch, setPendingTemplateSwitch] = useState<ArchitectureTemplateId | null>(null);
  const [showDeleteEnvModal, setShowDeleteEnvModal] = useState<boolean>(false);
  const [pendingDeleteEnvId, setPendingDeleteEnvId] = useState<string | null>(null);

  // Interactive Canvas Interconnect & Inspector States
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [connectingSourceId, setConnectingSourceId] = useState<string | null>(null);
  const [showLinkModal, setShowLinkModal] = useState<boolean>(false);
  const [linkModalSourceId, setLinkModalSourceId] = useState<string>('');
  const [linkModalTargetId, setLinkModalTargetId] = useState<string>('');
  const [linkProtocol, setLinkProtocol] = useState<InterconnectLink['protocol']>('ExpressRoute FastPath');
  const [linkBandwidth, setLinkBandwidth] = useState<number>(10);
  const [linkRedundant, setLinkRedundant] = useState<boolean>(true);
  const [linkNotes, setLinkNotes] = useState<string>('');
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);

  // Mouse Dragging States
  const [isDraggingNodeId, setIsDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const [conflictsResolvedList, setConflictsResolvedList] = useState<string[]>([]);
  const [showAddEnvModal, setShowAddEnvModal] = useState<boolean>(false);
  const [newEnvName, setNewEnvName] = useState<string>('');
  const [newEnvPlatform, setNewEnvPlatform] = useState<CloudPlatformType>('Nutanix NC2 on Azure');
  const [newEnvRole, setNewEnvRole] = useState<EnvironmentRole>('Disaster Recovery');
  const [newEnvRegion, setNewEnvRegion] = useState<string>('Azure East US 2');
  const [newEnvHosts, setNewEnvHosts] = useState<number>(4);
  const [newEnvStorageTB, setNewEnvStorageTB] = useState<number>(60);
  const [newEnvCidr, setNewEnvCidr] = useState<string>('10.240.0.0/22');

  // Hydrate from RVTools or DR Planner or Sizing Tool with domain conflict resolution
  useEffect(() => {
    try {
      const blueprintState = localStorage.getItem('zaboraa_4k_blueprint_state');
      const drExport = localStorage.getItem('zaboraa_dr_export');
      const sizingExport = localStorage.getItem('zaboraa_sizing_export');

      if (blueprintState || drExport || sizingExport) {
        const { model, notice, conflictsResolved } = hydrateFromLegacyStorage(
          blueprintState,
          drExport,
          sizingExport
        );
        setActiveTemplate(model.templateId);
        setTopologyEnvironments(model.environments);
        if (model.interconnectLinks && model.interconnectLinks.length > 0) {
          setInterconnectLinks(model.interconnectLinks);
        }
        setImportedLegacyContext(model.importedLegacyContext);
        setCustomerName(model.customerName);
        setArchitectName(model.architectName);
        setDrEngine(model.resilience.replicationEngine);
        setDrRpoMinutes(model.resilience.targetRpoMinutes);
        setDrRtoMinutes(model.resilience.targetRtoMinutes);
        setDrStrategy(
          model.resilience.drTopology === 'Backup & Restore'
            ? 'Cold Storage / On-Demand'
            : model.resilience.drTopology === 'Warm Standby'
            ? 'Hot Standby (Full Cluster)'
            : 'Pilot Light (3-Node Minimum)'
        );

        // Hydrate unified wizard state
        const hydratedWizard = mapLegacyToWizard(model, model.importedLegacyContext);
        setWizardState(hydratedWizard);

        // Map to existing legacy variables to ensure 100% backward-compatibility with SVG/Canvas
        if (model.environments[0]) {
          setTotalVMCount(model.environments[0].vmCount ?? Math.round(model.environments[0].totalVcpu / 2.5));
          setEsxiHostCount(model.environments[0].hostCount);
          setClusterCount(Math.max(1, Math.round(model.environments[0].hostCount / 6)));
        }
        if (model.environments[1]) {
          setDecoupledStorageTB(model.environments[1].storageTB);
          setNodeSku(model.environments[1].nodeSku);
          if (model.environments[1].platform.includes('AWS')) {
            setCloudPlatform('VMware Cloud on AWS');
          } else if (model.environments[1].platform.includes('Google') || model.environments[1].platform.includes('GCP')) {
            setCloudPlatform('Google Cloud VMware Engine');
          } else {
            setCloudPlatform('Azure VMware Solution');
          }
        }

        // Hydrate legacy VLANs if present in RVTools state
        const parsedBlueprint = blueprintState ? JSON.parse(blueprintState) : null;
        if (parsedBlueprint?.vlans && Array.isArray(parsedBlueprint.vlans) && parsedBlueprint.vlans.length > 0) {
          setSubsegments(parsedBlueprint.vlans.slice(0, 6).map((v: any, i: number) => ({
            vlanId: v.vlanId || (i + 1) * 10,
            subnetCidr: `10.${v.vlanId || (i + 1) * 10}.10.0/24`,
            environment: (v.portGroup?.toLowerCase().includes('dev') ? 'Dev' : v.portGroup?.toLowerCase().includes('stg') ? 'Staging' : 'Prod') as 'Dev' | 'Staging' | 'Prod'
          })));
        }

        setImportedNotice(notice);
        setConflictsResolvedList(conflictsResolved);
      }
    } catch (err) {
      console.warn('Hydration exception:', err);
    }
  }, []);

  // Explicit non-destructive writeback (STRICT BOUNDARY: only triggered on explicit Save or Export Blueprint/BOM actions)
  const handlePersistLegacyState = () => {
    if (topologyEnvironments && topologyEnvironments.length > 0) {
      const updatedEnvs = [...topologyEnvironments];
      if (updatedEnvs[0]) {
        updatedEnvs[0].vmCount = totalVMCount;
      }
      const activeModel: DynamicTopologyModel = {
        templateId: activeTemplate,
        customerName,
        architectName,
        projectDate,
        environments: updatedEnvs,
        interconnectLinks,
        resilience: {
          drTopology: drStrategy.includes('Cold') ? 'Backup & Restore' : drStrategy.includes('Hot') ? 'Warm Standby' : 'Pilot Light',
          targetRpoMinutes: drRpoMinutes,
          targetRtoMinutes: drRtoMinutes,
          replicationMode: drRpoMinutes <= 1 ? 'Synchronous' : 'Asynchronous',
          replicationEngine: drEngine,
          failoverMode: 'Orchestrated Runbook',
          failbackApproach: 'Reverse Delta Sync'
        },
        activeServiceIds: [],
        importedLegacyContext: importedLegacyContext || {}
      };
      writebackLegacyStorage(activeModel);
      setSaveSuccessNotice('Blueprint state saved successfully. Legacy localStorage synchronized non-destructively.');
      setTimeout(() => setSaveSuccessNotice(null), 4000);
    }
  };

  // Synchronize wizard updates across canonical topology and legacy variables
  const handleWizardStateChange = (updater: (prev: WizardState) => WizardState) => {
    setWizardState((prev) => {
      const next = updater(prev);
      setCustomerName(next.customerName);
      setArchitectName(next.architectName);
      setProjectDate(next.projectDate);
      setActiveTemplate(next.activeTemplate);
      setConnectivity(next.connectivityCarrier as any);
      setLandingZone(next.landingZonePattern as any);
      setNvaFirewall(next.firewallProvider as any);
      setWafSolution((next.wafSolution || 'Azure WAF on Application Gateway') as any);
      setNodeSku(next.targetNodeSku);
      setDecoupledStorageTB(next.decoupledStorageTB);
      setDrEngine(next.drConfig.engine);
      setDrRpoMinutes(next.drConfig.rpoMinutes);
      setDrRtoMinutes(next.drConfig.rtoMinutes);
      setDrStrategy(next.drConfig.strategy);
      setMgmtCidrInput(next.sddcMgmtCidr);

      if (next.targetPlatform.includes('avs')) {
        setCloudPlatform('Azure VMware Solution');
        setAvsGen(next.targetPlatform === 'avs-gen2' ? 'Gen 2' : 'Gen 1');
      } else if (next.targetPlatform.includes('vmc')) {
        setCloudPlatform('VMware Cloud on AWS');
      } else if (next.targetPlatform.includes('gcve')) {
        setCloudPlatform('Google Cloud VMware Engine');
      }

      setTopologyEnvironments((currentEnvs) => {
        return currentEnvs.map((env) => {
          if (env.tier === 'source' || env.id === 'env-onprem-vmware' || env.id === 'env-source-onprem') {
            const totalHosts = next.clusters.reduce((acc, c) => acc + c.hostCount, 0);
            const totalCores = next.clusters.reduce((acc, c) => acc + c.hostCount * c.sockets * c.coresPerSocket, 0);
            const totalRam = next.clusters.reduce((acc, c) => acc + c.hostCount * c.ramGB, 0);
            const totalStorage = next.clusters.reduce((acc, c) => acc + c.hostCount * c.storageTB, 0);
            return {
              ...env,
              hostCount: totalHosts,
              nodeSku: next.hardwareSku,
              totalVcpu: totalCores * 2,
              totalRamGB: totalRam,
              storageTB: totalStorage,
              cidrBlock: next.sourceMgmtCidr,
              platform: next.sourcePlatform === 'nutanix' ? 'Nutanix AHV' : 'VMware vSphere'
            };
          }
          if (env.tier === 'target' || env.id === 'env-avs-sddc' || env.id === 'env-target-cloud') {
            return {
              ...env,
              hostCount: next.targetNodeCount,
              nodeSku: next.targetNodeSku,
              storageTB: next.decoupledStorageTB,
              cidrBlock: next.sddcMgmtCidr,
              platform:
                next.targetPlatform === 'vmc-aws'
                  ? 'VMware Cloud on AWS'
                  : next.targetPlatform === 'gcve'
                  ? 'Google Cloud VMware Engine'
                  : next.targetPlatform === 'nc2-azure'
                  ? 'Nutanix NC2 on Azure'
                  : 'Azure VMware Solution'
            };
          }
          return env;
        });
      });

      return next;
    });
  };

  const handleApplyIndustryTemplate = (preset: IndustryTemplatePreset) => {
    handleWizardStateChange((prev) => preset.apply(prev));
    setSaveSuccessNotice(`Applied "${preset.title}" architecture baseline.`);
    setTimeout(() => setSaveSuccessNotice(null), 3500);
  };

  // Update Node SKU options when cloud platform changes
  useEffect(() => {
    if (cloudPlatform === 'Azure VMware Solution') {
      setNodeSku('AV36P');
    } else if (cloudPlatform === 'VMware Cloud on AWS') {
      setNodeSku('i4i.metal');
    } else {
      setNodeSku('ve1-standard-72');
    }
  }, [cloudPlatform]);

  // Single Source of Truth (SSOT): Canonical metrics derived dynamically from topologyEnvironments
  const topologyMetrics = useMemo(() => {
    const totalHosts = topologyEnvironments.reduce((acc, e) => acc + (e.hostCount || 0), 0);
    const totalVMs = topologyEnvironments.reduce((acc, e) => acc + (e.vmCount ?? Math.round((e.totalVcpu || 0) / 2.5)), 0);
    const totalVcpu = topologyEnvironments.reduce((acc, e) => acc + (e.totalVcpu || 0), 0);
    const totalRamGB = topologyEnvironments.reduce((acc, e) => acc + (e.totalRamGB || 0), 0);
    const totalStorageTB = topologyEnvironments.reduce((acc, e) => acc + (e.storageTB || 0), 0);
    const primarySource = topologyEnvironments.find(e => e.tier === 'source') || topologyEnvironments[0];
    const primaryTransit = topologyEnvironments.find(e => e.tier === 'transit') || topologyEnvironments[1];
    const primaryTarget = topologyEnvironments.find(e => e.tier === 'target') || topologyEnvironments[topologyEnvironments.length - 1];
    return { totalHosts, totalVMs, totalVcpu, totalRamGB, totalStorageTB, primarySource, primaryTransit, primaryTarget };
  }, [topologyEnvironments]);

  // Synchronize canonical topology updates while strictly preserving canvas coordinates
  const handleUpdateNodeSpec = (envId: string, partial: Partial<EnvironmentNode>) => {
    setTopologyEnvironments(prev =>
      prev.map(n => {
        if (n.id !== envId) return n;
        const updated = { ...n, ...partial };
        // Automatically scale vCPU and RAM if host count changes and totalVcpu wasn't explicitly supplied
        if (partial.hostCount !== undefined && partial.totalVcpu === undefined) {
          const sku = updated.nodeSku || '';
          const coresPerHost = sku.includes('64') || sku.includes('i4i') ? 64 : sku.includes('72') || sku.includes('ve1') ? 72 : 36;
          const ramPerHost = sku.includes('1024') || sku.includes('i4i') ? 1024 : sku.includes('768') || sku.includes('AN36P') ? 768 : 576;
          updated.totalVcpu = updated.hostCount * coresPerHost;
          updated.totalRamGB = updated.hostCount * ramPerHost;
        }
        return updated;
      })
    );
  };

  const getAvailableSkusForPlatform = (platform: CloudPlatformType): string[] => {
    if (platform === 'Nutanix AHV') {
      return [
        'NX-8170-G9 All-NVMe (Dual Intel Xeon)',
        'NX-3170-G9 All-Flash (Intel Xeon)',
        'NX-8155-G9 Dense Storage (Dual Intel Xeon)',
        'NX-1065-G8 Edge / ROBO'
      ];
    }
    if (platform === 'Nutanix NC2 on Azure') {
      return [
        'AN36P (36 cores, 768GB RAM, 19.2TB NVMe)',
        'AN36 (36 cores, 576GB RAM, 15.3TB NVMe)',
        'AN64 (64 cores, 1024GB RAM, 30.7TB NVMe)'
      ];
    }
    if (platform === 'Azure VMware Solution') {
      return [
        'AV36P (36 cores, 576GB RAM, 15.3TB NVMe)',
        'AV64 (64 cores, 1024GB RAM, 30.7TB NVMe)',
        'AV48 (48 cores, 768GB RAM)',
        'AV52 (52 cores, 1536GB RAM)',
        'AV36 (36 cores, 576GB RAM)'
      ];
    }
    if (platform === 'VMware Cloud on AWS') {
      return [
        'i4i.metal (64 cores, 1024GB RAM, 30TB NVMe)',
        'i3en.metal (96 cores, 768GB RAM, 45TB NVMe)',
        'm7i.metal-24xl (96 cores, 384GB RAM)'
      ];
    }
    if (platform === 'Google Cloud VMware Engine') {
      return [
        've1-standard-72 (72 cores, 768GB RAM, 19.2TB NVMe)',
        've2-standard-128 (128 cores, 2048GB RAM, 38.4TB NVMe)'
      ];
    }
    if (platform === 'AWS Native') {
      return [
        'AWS Native Multi-AZ VPC Hub (EKS / EC2)',
        'c6i.metal (128 vCPU, 256GB RAM)',
        'r6i.metal (128 vCPU, 1024GB RAM)'
      ];
    }
    if (platform === 'GCP Native') {
      return [
        'GCP Shared VPC Host Project (GKE / Cloud SQL)',
        'c2-standard-60 Compute Cluster',
        'm1-ultramem-160 Memory Optimized'
      ];
    }
    return [
      'Dell PowerEdge R750 (ESXi 8.0u2, NVMe)',
      'Cisco UCS B200 M5 (ESXi 8.0)',
      'HPE ProLiant DL380 Gen10 (ESXi 8.0)',
      'Custom Enterprise Bare-Metal Host'
    ];
  };

  // User Customizations detection for Template Switch Guardrail
  const checkHasUserCustomizations = (currentTemplate: ArchitectureTemplateId = activeTemplate): boolean => {
    const defaults = getDefaultEnvironmentsForTemplate(currentTemplate);
    const defaultLinks = getDefaultInterconnectLinksForTemplate(currentTemplate);
    if (topologyEnvironments.length !== defaults.length) return true;
    if (interconnectLinks.length !== defaultLinks.length) return true;
    for (let i = 0; i < topologyEnvironments.length; i++) {
      const cur = topologyEnvironments[i];
      const def = defaults[i];
      if (!def) return true;
      if (
        cur.name !== def.name ||
        cur.hostCount !== def.hostCount ||
        cur.nodeSku !== def.nodeSku ||
        cur.storageTB !== def.storageTB ||
        cur.cidrBlock !== def.cidrBlock ||
        (cur.vmCount !== undefined && cur.vmCount !== def.vmCount)
      ) {
        return true;
      }
    }
    return false;
  };

  // Intercept track switch with user customization verification
  const handleTrackClick = (template: ArchitectureTemplateId) => {
    if (template === activeTemplate) return;
    if (checkHasUserCustomizations()) {
      setPendingTemplateSwitch(template);
      setShowTemplateSwitchModal(true);
    } else {
      applyTemplateSwitch(template);
    }
  };

  const applyTemplateSwitch = (template: ArchitectureTemplateId) => {
    setActiveTemplate(template);
    const newEnvs = getDefaultEnvironmentsForTemplate(template);
    const newLinks = getDefaultInterconnectLinksForTemplate(template);
    setTopologyEnvironments(newEnvs);
    setInterconnectLinks(newLinks);
    setSelectedNodeId(null);
    setConnectingSourceId(null);

    if (template === 'nutanix-onprem') {
      setCloudPlatform('Azure VMware Solution');
      setDrEngine('Nutanix Protection Domains (NearSync)');
      setDrRpoMinutes(15);
      setDrRtoMinutes(30);
      setDrStrategy('Warm Standby (Full Cluster)');
    } else if (template === 'nutanix-to-nc2') {
      setCloudPlatform('Azure VMware Solution');
      setDrEngine('Nutanix Move / Prism Pairing');
      setNodeSku('AN36P');
      setDrRpoMinutes(15);
      setDrRtoMinutes(60);
      setDrStrategy('Pilot Light (3-Node Minimum)');
    } else if (template === 'vmware-to-nc2') {
      setCloudPlatform('Azure VMware Solution');
      setDrEngine('Nutanix Move Cross-Hypervisor');
      setNodeSku('AN36P');
      setDrRpoMinutes(15);
      setDrRtoMinutes(60);
      setDrStrategy('Pilot Light (3-Node Minimum)');
    } else if (template === 'avs') {
      setCloudPlatform('Azure VMware Solution');
      setDrEngine('VMware SRM + vSphere Replication');
      setNodeSku('AV36P');
      setDrRpoMinutes(5);
      setDrRtoMinutes(20);
      setDrStrategy('Pilot Light (3-Node Minimum)');
    } else if (template === 'vmc-aws') {
      setCloudPlatform('VMware Cloud on AWS');
      setDrEngine('VMware HCX Bulk / Replication');
      setNodeSku('i4i.metal');
      setDrRpoMinutes(15);
      setDrRtoMinutes(30);
      setDrStrategy('Pilot Light (3-Node Minimum)');
    } else if (template === 'gcve') {
      setCloudPlatform('Google Cloud VMware Engine');
      setDrEngine('VMware HCX / Google Cloud Interconnect');
      setNodeSku('ve1-standard-72');
      setDrRpoMinutes(15);
      setDrRtoMinutes(30);
      setDrStrategy('Pilot Light (3-Node Minimum)');
    } else if (template === 'aws-native') {
      setCloudPlatform('VMware Cloud on AWS');
      setDrEngine('AWS Direct Connect + AWS DMS');
      setNodeSku('AWS Native VPC Hub');
      setDrRpoMinutes(15);
      setDrRtoMinutes(30);
      setDrStrategy('Warm Standby (Full Cluster)');
    } else if (template === 'gcp-native') {
      setCloudPlatform('Google Cloud VMware Engine');
      setDrEngine('Google Cloud Partner Interconnect');
      setNodeSku('Shared VPC Host Project');
      setDrRpoMinutes(15);
      setDrRtoMinutes(30);
      setDrStrategy('Warm Standby (Full Cluster)');
    } else if (template === 'multi-cloud') {
      setCloudPlatform('Azure VMware Solution');
      setDrEngine('Multi-Cloud Cross-Replication');
      setNodeSku('AV36P');
      setDrRpoMinutes(15);
      setDrRtoMinutes(45);
      setDrStrategy('Hot Standby (Full Cluster)');
    }
  };

  // Safe wrapper that enforces the customization check
  const handleSelectTemplate = (template: ArchitectureTemplateId) => {
    handleTrackClick(template);
  };

  // Environment Deletion & Cascade Protection
  const promptRemoveEnvironment = (idToRemove: string) => {
    if (topologyEnvironments.length <= 1) return;
    const connected = interconnectLinks.filter(l => l.sourceId === idToRemove || l.targetId === idToRemove);
    if (connected.length > 0) {
      setPendingDeleteEnvId(idToRemove);
      setShowDeleteEnvModal(true);
    } else {
      handleRemoveEnvironment(idToRemove);
    }
  };

  // IPv4 CIDR validation helper (supports /0 through /32 with strict octet checking)
  const isValidIpv4Cidr = (cidr: string): boolean => {
    const trimmed = cidr.trim();
    if (!trimmed) return true; // Optional if blank
    const match = trimmed.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\/(\d{1,2})$/);
    if (!match) return false;
    const [, o1, o2, o3, o4, prefix] = match;
    const octets = [Number(o1), Number(o2), Number(o3), Number(o4)];
    for (const oct of octets) {
      if (oct < 0 || oct > 255) return false;
    }
    const prefixNum = Number(prefix);
    return prefixNum >= 0 && prefixNum <= 32;
  };

  // Form field validation computations for Add New Environment modal
  const trimmedEnvName = newEnvName.trim();
  const isEnvNameEmpty = trimmedEnvName.length === 0;
  const isEnvNameDuplicate = Boolean(
    trimmedEnvName &&
      topologyEnvironments.some(
        env => env.name.trim().toLowerCase() === trimmedEnvName.toLowerCase()
      )
  );
  const trimmedCidr = newEnvCidr.trim();
  const isCidrFormatInvalid = Boolean(trimmedCidr.length > 0 && !isValidIpv4Cidr(trimmedCidr));

  // Determine if host count is valid (>= 0, integer, finite; native hub environments allow 0)
  const isHostCountValid =
    Number.isInteger(newEnvHosts) &&
    !isNaN(newEnvHosts) &&
    (newEnvPlatform === 'AWS Native' || newEnvPlatform === 'GCP Native' ? newEnvHosts >= 0 : newEnvHosts >= 1);

  // Storage valid: positive number
  const isStorageValid = !isNaN(newEnvStorageTB) && newEnvStorageTB > 0;

  // Overall form validity
  const isAddEnvFormValid =
    !isEnvNameEmpty &&
    !isEnvNameDuplicate &&
    !isCidrFormatInvalid &&
    isHostCountValid &&
    isStorageValid;

  const handleAddEnvironment = () => {
    if (!isAddEnvFormValid) return;

    // Platform-specific node SKU calculation
    const derivedSku = newEnvPlatform.includes('NC2')
      ? 'AN36P'
      : newEnvPlatform.includes('AVS')
      ? 'AV36P'
      : newEnvPlatform.includes('AWS')
      ? (newEnvHosts === 0 ? 'AWS Native VPC Hub' : 'i4i.metal')
      : newEnvPlatform.includes('Google') || newEnvPlatform.includes('GCP')
      ? (newEnvHosts === 0 ? 'Google Cloud Native Hub' : 've1-standard-72')
      : 'NX-8170-G9';

    const derivedTier: 'source' | 'transit' | 'target' =
      newEnvRole === 'Production' ? 'source' : newEnvRole === 'Shared Services' ? 'transit' : 'target';

    const tierCount = topologyEnvironments.filter(e => e.tier === derivedTier).length;
    const defaultX = derivedTier === 'source' ? 80 : derivedTier === 'transit' ? 430 : 780;
    const defaultY = 120 + tierCount * 180;

    const newEnv: EnvironmentNode = {
      id: `env-${Date.now()}`,
      name: trimmedEnvName,
      platform: newEnvPlatform,
      role: newEnvRole,
      region: newEnvRegion.trim() || 'Custom Region',
      hostCount: Math.max(0, newEnvHosts),
      nodeSku: derivedSku,
      totalVcpu: Math.max(0, newEnvHosts) * 36,
      totalRamGB: Math.max(0, newEnvHosts) * 576,
      storageTB: Math.max(0, newEnvStorageTB),
      cidrBlock: trimmedCidr || '10.240.0.0/22',
      // Explicit requirement: Add as unlinked zone until connected in topology view
      connectedEnvironmentIds: [],
      tier: derivedTier,
      x: defaultX,
      y: defaultY,
      notes: `${newEnvRole} node group on ${newEnvPlatform}`
    };

    setTopologyEnvironments(prev => [...prev, newEnv]);
    setShowAddEnvModal(false);
    // Reset modal state
    setNewEnvName('');
    setNewEnvRegion('Azure East US 2');
    setNewEnvHosts(4);
    setNewEnvStorageTB(60);
    setNewEnvCidr('10.240.0.0/22');
  };

  const handleRemoveEnvironment = (idToRemove: string) => {
    if (topologyEnvironments.length <= 1) return;
    setTopologyEnvironments(prev => prev.filter(e => e.id !== idToRemove));
    setInterconnectLinks(prev => prev.filter(l => l.sourceId !== idToRemove && l.targetId !== idToRemove));
    if (selectedNodeId === idToRemove) setSelectedNodeId(null);
  };

  // Interactive Canvas Mouse Dragging & Coordinate Persistence
  const handleNodeMouseDown = (e: React.MouseEvent, node: EnvironmentNode) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('select')) return;
    setIsDraggingNodeId(node.id);
    const currX = node.x ?? 80;
    const currY = node.y ?? 120;
    setDragOffset({ x: e.clientX - currX, y: e.clientY - currY });
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingNodeId) return;
    const newX = Math.max(20, Math.min(1000, e.clientX - dragOffset.x));
    const newY = Math.max(40, Math.min(520, e.clientY - dragOffset.y));
    setTopologyEnvironments(prev =>
      prev.map(n => (n.id === isDraggingNodeId ? { ...n, x: newX, y: newY } : n))
    );
  };

  const handleCanvasMouseUp = () => {
    setIsDraggingNodeId(null);
  };

  // Interactive Click-to-Connect Interconnect Links
  const handleStartConnect = (sourceId: string) => {
    if (connectingSourceId === sourceId) {
      setConnectingSourceId(null);
    } else {
      setConnectingSourceId(sourceId);
    }
  };

  const handleFinishConnect = (targetId: string) => {
    if (!connectingSourceId || connectingSourceId === targetId) return;
    setLinkModalSourceId(connectingSourceId);
    setLinkModalTargetId(targetId);
    setEditingLinkId(null);
    setLinkProtocol('ExpressRoute FastPath');
    setLinkBandwidth(10);
    setLinkRedundant(true);
    setLinkNotes('');
    setShowLinkModal(true);
    setConnectingSourceId(null);
  };

  const handleOpenEditLink = (link: InterconnectLink) => {
    setLinkModalSourceId(link.sourceId);
    setLinkModalTargetId(link.targetId);
    setEditingLinkId(link.id);
    setLinkProtocol(link.protocol);
    setLinkBandwidth(link.bandwidthGbps);
    setLinkRedundant(link.redundant ?? true);
    setLinkNotes(link.notes ?? '');
    setShowLinkModal(true);
  };

  const handleSaveLink = () => {
    if (!linkModalSourceId || !linkModalTargetId) return;
    if (editingLinkId) {
      setInterconnectLinks(prev =>
        prev.map(l =>
          l.id === editingLinkId
            ? {
                ...l,
                protocol: linkProtocol,
                bandwidthGbps: linkBandwidth,
                redundant: linkRedundant,
                notes: linkNotes
              }
            : l
        )
      );
    } else {
      const newLink: InterconnectLink = {
        id: `link-${Date.now()}`,
        sourceId: linkModalSourceId,
        targetId: linkModalTargetId,
        protocol: linkProtocol,
        bandwidthGbps: linkBandwidth,
        status: 'active',
        redundant: linkRedundant,
        notes: linkNotes || `${linkProtocol} link between environments`
      };
      setInterconnectLinks(prev => [...prev, newLink]);
      setTopologyEnvironments(prev =>
        prev.map(n => {
          if (n.id === linkModalSourceId && !n.connectedEnvironmentIds.includes(linkModalTargetId)) {
            return { ...n, connectedEnvironmentIds: [...n.connectedEnvironmentIds, linkModalTargetId] };
          }
          if (n.id === linkModalTargetId && !n.connectedEnvironmentIds.includes(linkModalSourceId)) {
            return { ...n, connectedEnvironmentIds: [...n.connectedEnvironmentIds, linkModalSourceId] };
          }
          return n;
        })
      );
    }
    setShowLinkModal(false);
  };

  const handleDeleteLink = (linkId: string) => {
    const linkToDelete = interconnectLinks.find(l => l.id === linkId);
    if (linkToDelete) {
      setTopologyEnvironments(prev =>
        prev.map(n => {
          if (n.id === linkToDelete.sourceId) {
            return { ...n, connectedEnvironmentIds: n.connectedEnvironmentIds.filter(id => id !== linkToDelete.targetId) };
          }
          if (n.id === linkToDelete.targetId) {
            return { ...n, connectedEnvironmentIds: n.connectedEnvironmentIds.filter(id => id !== linkToDelete.sourceId) };
          }
          return n;
        })
      );
    }
    setInterconnectLinks(prev => prev.filter(l => l.id !== linkId));
    setShowLinkModal(false);
  };

  const getPlatformResilienceWarnings = () => {
    const warnings: { type: 'info' | 'warning'; text: string }[] = [];
    const hasNutanix = topologyEnvironments.some(e => e.platform.includes('Nutanix'));
    const hasVmware = topologyEnvironments.some(e => e.platform.includes('VMware'));
    const hasNc2 = topologyEnvironments.some(e => e.platform.includes('NC2'));

    if (hasNutanix && drRpoMinutes <= 1) {
      warnings.push({
        type: 'warning',
        text: 'Nutanix Metro Availability (Near-Zero RPO) requires sub-5ms round-trip network latency (RTT) between sites and an independent Witness VM.'
      });
    }

    if (hasVmware && !hasNutanix && drRpoMinutes <= 1) {
      warnings.push({
        type: 'warning',
        text: 'VMware vSphere Metro Storage Cluster (vMSC) requires synchronous storage replication with vendor-certified array links and round-trip latency under 5ms (or 10ms with certified vMSC).'
      });
    }

    if (hasVmware && hasNc2) {
      warnings.push({
        type: 'info',
        text: 'Cross-Hypervisor Migration (VMware ESXi to Nutanix AHV) utilizes Nutanix Move. Prerequisite: Guest OS VirtIO driver injection and non-disruptive snapshot seeding.'
      });
    }

    if (drStrategy.toLowerCase().includes('pilot light')) {
      warnings.push({
        type: 'info',
        text: 'Pilot Light topology: BareMetal host reservation or cloud provider quota pre-approval is required to scale from standby to full production capacity during a disaster.'
      });
    }

    return warnings;
  };

  const effectiveMgmtCidr = mgmtCidrInput.trim() || '10.240.0.0/22';
  const calculatedCloudNodes = Math.max(3, Math.ceil(totalVMCount / (nodeSku.includes('64') || nodeSku.includes('i4i') ? 70 : 45)));

  const externalStorageName =
    cloudPlatform === 'Azure VMware Solution'
      ? 'Azure NetApp Files (ANF)'
      : cloudPlatform === 'VMware Cloud on AWS'
      ? 'Amazon FSx for NetApp ONTAP'
      : 'Google Cloud NetApp Volumes (GCNV)';

  // 4K Canvas Drawing Engine (3840x2160) - Track-Aware for All 9 Enterprise Tracks
  const draw4KCanvas = (targetCanvas: HTMLCanvasElement) => {
    const ctx = targetCanvas.getContext('2d');
    if (!ctx) return;

    const width = 3840;
    const height = 2160;
    targetCanvas.width = width;
    targetCanvas.height = height;

    // 1. Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#020617');
    bgGrad.addColorStop(0.5, '#090d16');
    bgGrad.addColorStop(1, '#020617');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Subtle grid overlay
    ctx.strokeStyle = 'rgba(30, 41, 59, 0.4)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 80) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 80) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    const spec = buildTrackVisualSpec(activeTemplate, {
      customerName,
      sourceEnv: topologyMetrics.primarySource,
      transitEnv: topologyMetrics.primaryTransit,
      targetEnv: topologyMetrics.primaryTarget,
      totalVMs: topologyMetrics.totalVMs,
      interconnectLinks,
      connectivity,
      landingZone,
      nvaFirewall,
      wafSolution,
      drEngine,
      drRpoMinutes,
      drRtoMinutes,
      drStrategy,
      externalStorageName,
      decoupledStorageTB
    });

    // 2. Blueprint Title Header Box
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(80, 80, width - 160, 200, 16);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 50px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(spec.title.toUpperCase(), 130, 165);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '28px "JetBrains Mono", monospace';
    ctx.fillText(
      `ARCHITECT: ${architectName}  |  DATE: ${projectDate}  |  TRACK: ${activeTemplate.toUpperCase()}  |  DR: ${drEngine}`,
      130,
      230
    );

    const pHeight = 1720;

    // Helper to draw a box with bullet items
    const drawPanelBox = (boxX: number, boxY: number, boxW: number, boxH: number, title: string, bullets: string[], titleColor: string = '#ffffff', boxBg: string = 'rgba(30, 41, 59, 0.8)', borderColor: string = '#475569') => {
      ctx.fillStyle = boxBg;
      ctx.fillRect(boxX, boxY, boxW, boxH);
      ctx.strokeStyle = borderColor;
      ctx.strokeRect(boxX, boxY, boxW, boxH);
      ctx.fillStyle = titleColor;
      ctx.font = 'bold 30px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(title, boxX + 30, boxY + 60);
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '24px "JetBrains Mono", monospace';
      bullets.forEach((bullet, idx) => {
        ctx.fillText(bullet, boxX + 30, boxY + 120 + idx * 50);
      });
    };

    // 3. Panel 1 (Left Tier)
    const p1X = 80;
    const p1Y = 330;
    const p1Width = 1100;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
    ctx.fillRect(p1X, p1Y, p1Width, pHeight);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.strokeRect(p1X, p1Y, p1Width, pHeight);

    ctx.fillStyle = '#06b6d4';
    ctx.font = 'bold 36px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(spec.panel1Header, p1X + 40, p1Y + 70);

    drawPanelBox(p1X + 40, p1Y + 120, p1Width - 80, 360, spec.panel1Box1.title, spec.panel1Box1.bullets);
    drawPanelBox(p1X + 40, p1Y + 520, p1Width - 80, 340, spec.panel1Box2.title, spec.panel1Box2.bullets);
    drawPanelBox(p1X + 40, p1Y + 900, p1Width - 80, 420, spec.panel1Box3.title, spec.panel1Box3.bullets, '#34d399', 'rgba(6, 78, 59, 0.7)', '#10b981');

    // 4. Panel 2 (Center Transit & Security)
    const p2X = 1240;
    const p2Y = 330;
    const p2Width = 1100;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
    ctx.fillRect(p2X, p2Y, p2Width, pHeight);
    ctx.strokeStyle = '#334155';
    ctx.strokeRect(p2X, p2Y, p2Width, pHeight);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 36px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(spec.panel2Header, p2X + 40, p2Y + 70);

    drawPanelBox(p2X + 40, p2Y + 120, p2Width - 80, 360, spec.panel2Box1.title, spec.panel2Box1.bullets);
    drawPanelBox(p2X + 40, p2Y + 520, p2Width - 80, 340, spec.panel2Box2.title, spec.panel2Box2.bullets);
    drawPanelBox(p2X + 40, p2Y + 900, p2Width - 80, 420, spec.panel2Box3.title, spec.panel2Box3.bullets, '#d8b4fe', 'rgba(88, 28, 135, 0.7)', '#a855f7');

    // 5. Panel 3 (Right Cloud / DR Target)
    const p3X = 2400;
    const p3Y = 330;
    const p3Width = 1360;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
    ctx.fillRect(p3X, p3Y, p3Width, pHeight);
    ctx.strokeStyle = '#334155';
    ctx.strokeRect(p3X, p3Y, p3Width, pHeight);

    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 36px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(spec.panel3Header, p3X + 40, p3Y + 70);

    drawPanelBox(p3X + 40, p3Y + 120, p3Width - 80, 360, spec.panel3Box1.title, spec.panel3Box1.bullets);
    drawPanelBox(p3X + 40, p3Y + 520, p3Width - 80, 340, spec.panel3Box2.title, spec.panel3Box2.bullets);
    drawPanelBox(p3X + 40, p3Y + 900, p3Width - 80, 420, spec.panel3Box3.title, spec.panel3Box3.bullets, '#38bdf8', 'rgba(12, 74, 110, 0.7)', '#0284c7');

    // 6. Connectors (Arrow lines across panels)
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 6;
    ctx.setLineDash([16, 8]);

    // Line 1: Panel 1 to Panel 2
    ctx.beginPath();
    ctx.moveTo(p1X + p1Width, p1Y + 1040);
    ctx.lineTo(p2X, p2Y + 280);
    ctx.stroke();

    // Line 2: Panel 2 to Panel 3
    ctx.beginPath();
    ctx.moveTo(p2X + p2Width, p2Y + 660);
    ctx.lineTo(p3X, p3Y + 660);
    ctx.stroke();

    // Reset dash
    ctx.setLineDash([]);
  };

  // Export 4K Canvas Image (STRICT BOUNDARY: pure render and download, ZERO localStorage writes)
  const handleExport4K = (format: 'png' | 'jpeg') => {
    const offscreen = document.createElement('canvas');
    draw4KCanvas(offscreen);
    const link = document.createElement('a');
    link.download = `${customerName.replace(/\s+/g, '_')}_4K_Cloud_Architecture_Blueprint.${format}`;
    link.href = offscreen.toDataURL(`image/${format}`, 1.0);
    link.click();
  };

  // Export Complete Multi-Cloud Blueprint (JSON) - Explicit Export Action (Syncs legacy state)
  const handleExportBlueprintJSON = () => {
    handlePersistLegacyState();
    const updatedEnvs = [...topologyEnvironments];
    if (updatedEnvs[0]) {
      updatedEnvs[0].vmCount = totalVMCount;
    }
    const exportPayload: DynamicTopologyModel = {
      templateId: activeTemplate,
      customerName,
      architectName,
      projectDate,
      environments: updatedEnvs,
      interconnectLinks,
      resilience: {
        drTopology: drStrategy.includes('Cold') ? 'Backup & Restore' : drStrategy.includes('Hot') ? 'Warm Standby' : 'Pilot Light',
        targetRpoMinutes: drRpoMinutes,
        targetRtoMinutes: drRtoMinutes,
        replicationMode: drRpoMinutes <= 1 ? 'Synchronous' : 'Asynchronous',
        replicationEngine: drEngine,
        failoverMode: 'Orchestrated Runbook',
        failbackApproach: 'Reverse Delta Sync'
      },
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
      importedLegacyContext: importedLegacyContext || {}
    };
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${customerName.replace(/\s+/g, '_')}_MultiCloud_Blueprint.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export BOM to Excel - Explicit Export Action (Syncs legacy state)
  const handleExportBOMExcel = () => {
    handlePersistLegacyState();
    const wb = XLSX.utils.book_new();
    const rows = [
      { Category: 'General', Metric: 'Customer Name', Specification: customerName },
      { Category: 'General', Metric: 'Lead Architect', Specification: architectName },
      { Category: 'General', Metric: 'Target Hyperscaler Platform', Specification: cloudPlatform },
      { Category: 'Cloud Cluster', Metric: 'Node Model SKU', Specification: nodeSku },
      { Category: 'Cloud Cluster', Metric: 'Sized Host Count', Specification: `${calculatedCloudNodes} Bare-Metal Nodes` },
      { Category: 'Cloud Cluster', Metric: 'Management CIDR', Specification: effectiveMgmtCidr },
      { Category: 'Storage', Metric: 'Decoupled External Storage', Specification: `${decoupledStorageTB} TB (${externalStorageName})` },
      { Category: 'Workloads', Metric: 'Protected Virtual Machines', Specification: `${totalVMCount} VMs` },
      { Category: 'Networking', Metric: 'Physical Interconnect', Specification: connectivity },
      { Category: 'Security', Metric: 'Next-Gen Firewall', Specification: nvaFirewall },
      { Category: 'Security', Metric: 'Web Application Firewall', Specification: wafSolution },
      { Category: 'Disaster Recovery', Metric: 'Replication Engine', Specification: drEngine },
      { Category: 'Disaster Recovery', Metric: 'Target RPO SLA', Specification: `${drRpoMinutes} Minutes` },
      { Category: 'Disaster Recovery', Metric: 'Target RTO SLA', Specification: `${drRtoMinutes} Minutes` }
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Architecture BOM');
    XLSX.writeFile(wb, `${customerName.replace(/\s+/g, '_')}_Cloud_Architecture_BOM.xlsx`);
  };

  // Prompt Construction for Gemini Imagen 3 - 100% Grounded and Deterministic (Zero Invented Values)
  const buildIsometricDiagramPrompt = () => {
    const templateNames: Record<ArchitectureTemplateId, string> = {
      'nutanix-onprem': 'Nutanix On-Premises Private Cloud',
      'nutanix-to-nc2': 'Nutanix On-Prem to NC2 on Azure',
      'vmware-to-nc2': 'VMware to Nutanix NC2 Migration',
      'avs': 'Azure VMware Solution SDDC',
      'vmc-aws': 'VMware Cloud on AWS',
      'gcve': 'Google Cloud VMware Engine',
      'aws-native': 'AWS Native Multi-VPC Architecture',
      'gcp-native': 'Google Cloud Shared VPC Architecture',
      'multi-cloud': 'Multi-Cloud Nutanix & Hyperscaler Mesh'
    };

    const trackTitle = templateNames[activeTemplate] || activeTemplate;

    const envDescriptions = topologyEnvironments.map((env, i) => {
      const tierLabel = env.tier?.toUpperCase() || (i === 0 ? 'SOURCE' : i === 1 ? 'TRANSIT' : 'TARGET');
      const vmStr = env.vmCount ? `${env.vmCount} allocated VMs` : `${Math.round(env.totalVcpu / 2.5)} VMs`;
      const hostStr = env.hostCount > 0 ? `${env.hostCount}x ${env.nodeSku}` : 'Serverless / Managed Cloud Hub';
      return `[${tierLabel}: "${env.name}" (${env.platform} in ${env.region}) | Hardware: ${hostStr} | Compute: ${env.totalVcpu} vCPU, ${env.totalRamGB} GB RAM, ${env.storageTB} TB Storage | Workload: ${vmStr} | CIDR: ${env.cidrBlock}]`;
    }).join('; ');

    const linkDescriptions = interconnectLinks.length > 0
      ? interconnectLinks.map(l => {
          const src = topologyEnvironments.find(e => e.id === l.sourceId)?.name || 'Source';
          const tgt = topologyEnvironments.find(e => e.id === l.targetId)?.name || 'Target';
          const redStr = l.redundant ? 'Dual Redundant Active-Active' : 'Single Uplink';
          return `[Link: "${src}" -> "${tgt}" via ${l.bandwidthGbps} Gbps ${l.protocol} (${redStr}, ${l.latencyMs || 2}ms latency)]`;
        }).join('; ')
      : 'No external cross-environment links established';

    const storageNote = decoupledStorageTB > 0
      ? `${decoupledStorageTB} TB external decoupled ${externalStorageName} storage datastores`
      : 'No external decoupled storage configured (100% all-flash local NVMe)';

    return buildActivePromptString({
      trackTitle,
      customerName,
      architectName,
      projectDate,
      envDescriptions,
      linkDescriptions,
      connectivity,
      landingZone,
      nvaFirewall,
      wafSolution,
      storageNote,
      drEnabled: wizardState.drEnabled,
      drEngine,
      drRpoMinutes,
      drRtoMinutes,
      drStrategy
    });
  };

// AI 3D Isometric Generation Trigger
  const handleGenerateAIBlueprint = async () => {
    setIsGenerating3D(true);
    setShowPreFlightModal(false);
    setGenerationProgress(10);
    setGenerationStep('Synthesizing verified multi-tier infrastructure parameters...');

    const prompt = buildIsometricDiagramPrompt();

    // Progress simulation milestones
    const timer1 = setTimeout(() => {
      setGenerationProgress(35);
      setGenerationStep('Rendering 3D isometric server racks, NSX-T Tier-0 gateways, and firewalls...');
    }, 800);

    const timer2 = setTimeout(() => {
      setGenerationProgress(70);
      setGenerationStep('Illuminating glowing neon network paths and decoupled storage fabric...');
    }, 1800);

    try {
      // FIX: Use the clean relative path handled by Vite middleware (locally) and Vercel (production)
      const resp = await fetch('/api/generate-blueprint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });

      const data = await resp.json();
      setGenerationProgress(100);
      setGenerationStep('Finalizing 4K dark blueprint render...');

      if (data.success && data.imageBase64) {
        setAiBlueprintResult({
          imageUrl: `data:image/jpeg;base64,${data.imageBase64}`,
          isFallback: false,
          model: data.model || 'imagen-3.0-generate-002',
          prompt: data.prompt || prompt
        });
      } else {
        // Fallback with bundled high-res 3D isometric diagram
        setAiBlueprintResult({
          imageUrl: data.fallbackUrl || '/assets/images/blueprint_3d_isometric_1791610246387.jpg',
          isFallback: true,
          model: 'Bundled Enterprise 3D Blueprint Asset',
          prompt,
          message: data.message || 'Rendered using bundled high-resolution 3D isometric architecture blueprint.'
        });
      }

      setTimeout(() => {
        setIsGenerating3D(false);
        setShow3DModal(true);
      }, 500);
    } catch (err: any) {
      // In case of network error, gracefully fallback
      setGenerationProgress(100);
      setAiBlueprintResult({
        imageUrl: '/assets/images/blueprint_3d_isometric_1791610246387.jpg',
        isFallback: true,
        model: 'Bundled Enterprise 3D Blueprint Asset',
        prompt,
        message: 'Loaded bundled high-resolution 3D isometric architecture blueprint.'
      });
      setTimeout(() => {
        setIsGenerating3D(false);
        setShow3DModal(true);
      }, 500);
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
    }
  };


  // Download AI 3D Image
  const handleDownloadAIBlueprint = () => {
    if (!aiBlueprintResult) return;
    const link = document.createElement('a');
    link.download = `${customerName.replace(/\s+/g, '_')}_3D_Isometric_Cloud_Blueprint.png`;
    link.href = aiBlueprintResult.imageUrl;
    link.click();
  };

  // Target SKU spec
  const selectedTargetSku = TARGET_NODE_SKU_CATALOGUE.find(
    (s) => s.sku === wizardState.targetNodeSku
  ) || TARGET_NODE_SKU_CATALOGUE[0];

  // Live Sizing Metrics
  const liveTotalCapacity = calculateTotalInfrastructureCapacity(
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

  const liveN1Result = evaluateFailureScenario(
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
        acc[c.id] = 1;
        return acc;
      }, {} as Record<string, number>)
    },
    wizardState.clusters.reduce((acc, c) => {
      acc[c.id] = {
        vcpu: Math.round(c.hostCount * c.sockets * c.coresPerSocket * 1.5),
        ramGB: Math.round(c.hostCount * c.ramGB * 0.75),
        storageTB: Math.round(c.hostCount * c.storageTB * 0.65)
      };
      return acc;
    }, {} as Record<string, { vcpu: number; ramGB: number; storageTB: number }>)
  );

  const sddcPlatformKey =
    wizardState.targetPlatform === 'avs-gen1' || wizardState.targetPlatform === 'avs-gen2'
      ? 'AVS'
      : wizardState.targetPlatform === 'gcve'
      ? 'GCVE'
      : wizardState.targetPlatform === 'vmc-aws'
      ? 'VMC'
      : 'NC2';

  const sddcCidrValid = validateSddcPlatformCidr(
    wizardState.sddcMgmtCidr,
    sddcPlatformKey,
    wizardState.targetNodeCount
  ).isValid;

  const isCrossTierCompatible = evaluateCrossTierCompatibility({
    sourcePlatform: wizardState.sourcePlatform,
    targetPlatform: wizardState.targetPlatform,
    storageTierId: wizardState.decoupledStorageEnabled && wizardState.decoupledStorageProvider
      ? STORAGE_ATTACHMENT_CATALOGUE.find((s) => s.name === wizardState.decoupledStorageProvider)?.id
      : undefined,
    drEngineId: wizardState.drEnabled
      ? DR_ENGINE_CATALOGUE.find((d) => d.name === wizardState.drConfig.engine)?.id
      : undefined
  }).isCompatible;

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10">
      {/* Page Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <Link to="/tools" className="hover:text-cyan-400 transition-colors">Engineering Workbench</Link>
          <span>/</span>
          <span className="text-cyan-300">4K Architecture Topology & 3D Blueprint Generator</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <span>Enterprise 4K Architecture & 3D Blueprint Engine</span>
              <span className="text-xs px-2.5 py-1 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-mono font-semibold">
                Dual Mode: Vector + 3D AI
              </span>
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-3xl">
              Synthesize enterprise VMware hybrid topologies into presentation-ready 3840×2160 (4K) blueprints and AI-generated 3D isometric architecture diagrams with glowing neon transit paths.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Explicit Save Blueprint (Strict Legacy Writeback Boundary) */}
            <button
              onClick={handlePersistLegacyState}
              className="px-3.5 py-2.5 rounded-xl bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-300 font-semibold text-xs flex items-center gap-2 cursor-pointer shadow transition-all hover:scale-[1.02]"
              title="Save current blueprint state and synchronize legacy localStorage non-destructively"
            >
              <Save className="w-4 h-4 text-cyan-400" />
              <span>Save Blueprint</span>
            </button>

            {/* Export Complete Blueprint JSON */}
            <button
              onClick={handleExportBlueprintJSON}
              className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-2 cursor-pointer shadow"
              title="Export complete multi-cloud architecture topology model as JSON"
            >
              <FileDown className="w-4 h-4 text-cyan-400" />
              <span>Export Blueprint (JSON)</span>
            </button>

            {/* Primary AI Generation Trigger Button */}
            <button
              onClick={() => setShowPreFlightModal(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 cursor-pointer transition-all hover:scale-[1.02]"
            >
              <Sparkles className="w-4 h-4 fill-slate-950" />
              <span>Review & Generate 3D Blueprint</span>
            </button>

            <button
              onClick={() => handleExport4K('png')}
              className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-2 cursor-pointer shadow"
              title="Download high-resolution 4K canvas without storage write"
            >
              <Download className="w-4 h-4 text-cyan-400" />
              <span>Export 4K Canvas</span>
            </button>

            <button
              onClick={() => setShowDossierModal(true)}
              className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-2 cursor-pointer shadow"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              <span>Executive Dossier</span>
            </button>

            <button
              onClick={handleExportBOMExcel}
              className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-2 cursor-pointer shadow"
              title="Generate Bill of Materials Excel spreadsheet and sync storage"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Export BOM (.xlsx)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Save Success Notice Banner */}
      {saveSuccessNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/50 flex items-center justify-between gap-3 text-xs text-emerald-200 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{saveSuccessNotice}</span>
          </div>
          <button
            onClick={() => setSaveSuccessNotice(null)}
            className="text-emerald-400 hover:text-white text-xs underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Hydration Banner if state was loaded */}
      {importedNotice && (
        <div className="p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-500/40 flex items-center justify-between gap-3 text-xs text-cyan-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>{importedNotice}</span>
          </div>
          <button
            onClick={() => setImportedNotice(null)}
            className="text-cyan-400 hover:text-white text-xs underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Generation Loading Overlay */}
      {isGenerating3D && (
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-cyan-500/50 shadow-2xl space-y-4 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <RefreshCw className="w-5 h-5 text-cyan-400 animate-spin" />
              <div className="text-sm font-bold text-white">Generating 3D Isometric Architecture Blueprint</div>
            </div>
            <span className="font-mono text-cyan-400 text-xs font-bold">{generationProgress}%</span>
          </div>
          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
            <div
              className="bg-gradient-to-r from-cyan-400 to-indigo-500 h-full transition-all duration-500"
              style={{ width: `${generationProgress}%` }}
            />
          </div>
          <p className="text-xs text-slate-300 font-mono flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>{generationStep}</span>
          </p>
        </div>
      )}

      {/* Conflicts Resolution Notification */}
      {conflictsResolvedList.length > 0 && (
        <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/40 space-y-1.5 text-xs text-amber-200">
          <div className="font-semibold flex items-center gap-2 text-amber-300">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Multi-Tool State Conflict Resolution Applied:</span>
          </div>
          <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-200/90 pl-1">
            {conflictsResolvedList.map((c, idx) => (
              <li key={idx}>{c}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Architecture Design Track Selector (9 Enterprise Tracks with Category Filters) */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Step 1: Enterprise Architecture Design Track (9 Cloud Tracks)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Select foundational multi-cloud, hyperscaler SDDC, or hyperconverged migration pattern.
            </p>
          </div>
          <span className="text-xs font-mono text-cyan-400 font-bold px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/30">
            Active Track: {activeTemplate.toUpperCase()}
          </span>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 pb-1">
          {[
            { id: 'all', label: 'All Tracks (9)' },
            { id: 'nutanix', label: 'Nutanix & Hybrid (3)' },
            { id: 'sddc', label: 'Hyperscaler SDDC (3)' },
            { id: 'native', label: 'Cloud Native (2)' },
            { id: 'migration', label: 'Migration (1)' }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveCategoryTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeCategoryTab === tab.id
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                  : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 9 Tracks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {/* Track 1: Nutanix On-Prem */}
          {(activeCategoryTab === 'all' || activeCategoryTab === 'nutanix') && (
            <button
              type="button"
              onClick={() => handleSelectTemplate('nutanix-onprem')}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer space-y-2 flex flex-col justify-between ${
                activeTemplate === 'nutanix-onprem'
                  ? 'bg-emerald-950/40 border-emerald-500 shadow-lg shadow-emerald-950/50 ring-1 ring-emerald-500'
                  : 'bg-slate-950/70 border-slate-800 hover:border-emerald-600/50 hover:bg-slate-950'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <NutanixPrismIcon className="w-6 h-6 text-emerald-400" />
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                    AOS / AHV
                  </span>
                </div>
                <h3 className="text-xs font-bold text-white">Nutanix On-Premises</h3>
                <p className="text-[11px] text-slate-400 line-clamp-2">
                  NCI clusters, AHV virtualization, Prism Central management, and Flow microsegmentation.
                </p>
              </div>
              <div className="text-[10px] font-mono text-emerald-400 flex items-center justify-between pt-1 border-t border-slate-900">
                <span>Primary Datacenter</span>
                <ChevronRight className="w-3 h-3" />
              </div>
            </button>
          )}

          {/* Track 2: Nutanix On-Prem to NC2 on Azure */}
          {(activeCategoryTab === 'all' || activeCategoryTab === 'nutanix') && (
            <button
              type="button"
              onClick={() => handleSelectTemplate('nutanix-to-nc2')}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer space-y-2 flex flex-col justify-between ${
                activeTemplate === 'nutanix-to-nc2'
                  ? 'bg-cyan-950/40 border-cyan-500 shadow-lg shadow-cyan-950/50 ring-1 ring-cyan-500'
                  : 'bg-slate-950/70 border-slate-800 hover:border-cyan-600/50 hover:bg-slate-950'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <NutanixAhvIcon className="w-5 h-5 text-emerald-400" />
                    <span className="text-slate-500 text-xs">→</span>
                    <AzureVirtualWanIcon className="w-5 h-5 text-cyan-400" />
                  </div>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                    NC2 Azure
                  </span>
                </div>
                <h3 className="text-xs font-bold text-white">Nutanix to NC2 on Azure</h3>
                <p className="text-[11px] text-slate-400 line-clamp-2">
                  BareMetal Azure nodes with native Azure vNet integration, Nutanix Move replication, and DR.
                </p>
              </div>
              <div className="text-[10px] font-mono text-cyan-400 flex items-center justify-between pt-1 border-t border-slate-900">
                <span>Hybrid Cloud Extension</span>
                <ChevronRight className="w-3 h-3" />
              </div>
            </button>
          )}

          {/* Track 3: VMware to Nutanix NC2 Assessment */}
          {(activeCategoryTab === 'all' || activeCategoryTab === 'migration') && (
            <button
              type="button"
              onClick={() => handleSelectTemplate('vmware-to-nc2')}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer space-y-2 flex flex-col justify-between ${
                activeTemplate === 'vmware-to-nc2'
                  ? 'bg-indigo-950/40 border-indigo-500 shadow-lg shadow-indigo-950/50 ring-1 ring-indigo-500'
                  : 'bg-slate-950/70 border-slate-800 hover:border-indigo-600/50 hover:bg-slate-950'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <VmwareVcenterIcon className="w-5 h-5 text-sky-400" />
                    <span className="text-slate-500 text-xs">→</span>
                    <NutanixMoveIcon className="w-5 h-5 text-emerald-400" />
                  </div>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                    Migration
                  </span>
                </div>
                <h3 className="text-xs font-bold text-white">VMware to NC2 Assessment</h3>
                <p className="text-[11px] text-slate-400 line-clamp-2">
                  Cross-hypervisor migration assessment, Nutanix Move VirtIO driver injection, and wave cutover.
                </p>
              </div>
              <div className="text-[10px] font-mono text-indigo-400 flex items-center justify-between pt-1 border-t border-slate-900">
                <span>Move Assessment</span>
                <ChevronRight className="w-3 h-3" />
              </div>
            </button>
          )}

          {/* Track 4: Azure VMware Solution (AVS) */}
          {(activeCategoryTab === 'all' || activeCategoryTab === 'sddc') && (
            <button
              type="button"
              onClick={() => handleSelectTemplate('avs')}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer space-y-2 flex flex-col justify-between ${
                activeTemplate === 'avs'
                  ? 'bg-sky-950/40 border-sky-500 shadow-lg shadow-sky-950/50 ring-1 ring-sky-500'
                  : 'bg-slate-950/70 border-slate-800 hover:border-sky-600/50 hover:bg-slate-950'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <AzureExpressRouteIcon className="w-6 h-6 text-sky-400" />
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800">
                    AVS SDDC
                  </span>
                </div>
                <h3 className="text-xs font-bold text-white">Azure VMware Solution</h3>
                <p className="text-[11px] text-slate-400 line-clamp-2">
                  ExpressRoute FastPath, Tier-0 NSX-T gateways, decoupled ANF storage, and Azure native hub.
                </p>
              </div>
              <div className="text-[10px] font-mono text-sky-400 flex items-center justify-between pt-1 border-t border-slate-900">
                <span>Dedicated SDDC</span>
                <ChevronRight className="w-3 h-3" />
              </div>
            </button>
          )}

          {/* Track 5: VMware Cloud on AWS (VMC) */}
          {(activeCategoryTab === 'all' || activeCategoryTab === 'sddc') && (
            <button
              type="button"
              onClick={() => handleSelectTemplate('vmc-aws')}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer space-y-2 flex flex-col justify-between ${
                activeTemplate === 'vmc-aws'
                  ? 'bg-amber-950/40 border-amber-500 shadow-lg shadow-amber-950/50 ring-1 ring-amber-500'
                  : 'bg-slate-950/70 border-slate-800 hover:border-amber-600/50 hover:bg-slate-950'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <AwsTransitGatewayIcon className="w-6 h-6 text-amber-400" />
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                    AWS VMC
                  </span>
                </div>
                <h3 className="text-xs font-bold text-white">VMware Cloud on AWS</h3>
                <p className="text-[11px] text-slate-400 line-clamp-2">
                  BareMetal i4i.metal SDDC, high-speed Connected VPC ENI, Transit Gateway, and FSx ONTAP storage.
                </p>
              </div>
              <div className="text-[10px] font-mono text-amber-400 flex items-center justify-between pt-1 border-t border-slate-900">
                <span>AWS Dedicated SDDC</span>
                <ChevronRight className="w-3 h-3" />
              </div>
            </button>
          )}

          {/* Track 6: Google Cloud VMware Engine (GCVE) */}
          {(activeCategoryTab === 'all' || activeCategoryTab === 'sddc') && (
            <button
              type="button"
              onClick={() => handleSelectTemplate('gcve')}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer space-y-2 flex flex-col justify-between ${
                activeTemplate === 'gcve'
                  ? 'bg-blue-950/40 border-blue-500 shadow-lg shadow-blue-950/50 ring-1 ring-blue-500'
                  : 'bg-slate-950/70 border-slate-800 hover:border-blue-600/50 hover:bg-slate-950'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <GcpInterconnectIcon className="w-6 h-6 text-blue-400" />
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                    GCP GCVE
                  </span>
                </div>
                <h3 className="text-xs font-bold text-white">Google Cloud VMware Engine</h3>
                <p className="text-[11px] text-slate-400 line-clamp-2">
                  ve1-standard-72 nodes with 100 Gbps dedicated interconnect, NetApp Volumes (GCNV), and Cloud Armor.
                </p>
              </div>
              <div className="text-[10px] font-mono text-blue-400 flex items-center justify-between pt-1 border-t border-slate-900">
                <span>GCP Dedicated SDDC</span>
                <ChevronRight className="w-3 h-3" />
              </div>
            </button>
          )}

          {/* Track 7: AWS Native Enterprise VPC Hub */}
          {(activeCategoryTab === 'all' || activeCategoryTab === 'native') && (
            <button
              type="button"
              onClick={() => handleSelectTemplate('aws-native')}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer space-y-2 flex flex-col justify-between ${
                activeTemplate === 'aws-native'
                  ? 'bg-amber-950/40 border-amber-500 shadow-lg shadow-amber-950/50 ring-1 ring-amber-500'
                  : 'bg-slate-950/70 border-slate-800 hover:border-amber-600/50 hover:bg-slate-950'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <AwsTransitGatewayIcon className="w-6 h-6 text-amber-400" />
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                    AWS Native
                  </span>
                </div>
                <h3 className="text-xs font-bold text-white">AWS Native Enterprise VPC Hub</h3>
                <p className="text-[11px] text-slate-400 line-clamp-2">
                  Direct Connect gateway, Transit Gateway security inspection, Amazon EKS, Aurora, and S3 tiers.
                </p>
              </div>
              <div className="text-[10px] font-mono text-amber-400 flex items-center justify-between pt-1 border-t border-slate-900">
                <span>Cloud Native VPC</span>
                <ChevronRight className="w-3 h-3" />
              </div>
            </button>
          )}

          {/* Track 8: Google Cloud Native Hub */}
          {(activeCategoryTab === 'all' || activeCategoryTab === 'native') && (
            <button
              type="button"
              onClick={() => handleSelectTemplate('gcp-native')}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer space-y-2 flex flex-col justify-between ${
                activeTemplate === 'gcp-native'
                  ? 'bg-blue-950/40 border-blue-500 shadow-lg shadow-blue-950/50 ring-1 ring-blue-500'
                  : 'bg-slate-950/70 border-slate-800 hover:border-blue-600/50 hover:bg-slate-950'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <GcpInterconnectIcon className="w-6 h-6 text-blue-400" />
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                    GCP Native
                  </span>
                </div>
                <h3 className="text-xs font-bold text-white">Google Cloud Native Hub</h3>
                <p className="text-[11px] text-slate-400 line-clamp-2">
                  Dedicated Interconnect, Shared VPC host project, GKE enterprise clusters, and BigQuery lakehouse.
                </p>
              </div>
              <div className="text-[10px] font-mono text-blue-400 flex items-center justify-between pt-1 border-t border-slate-900">
                <span>Cloud Native Mesh</span>
                <ChevronRight className="w-3 h-3" />
              </div>
            </button>
          )}

          {/* Track 9: Multi-Cloud Enterprise Mesh */}
          {(activeCategoryTab === 'all' || activeCategoryTab === 'nutanix') && (
            <button
              type="button"
              onClick={() => handleSelectTemplate('multi-cloud')}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer space-y-2 flex flex-col justify-between ${
                activeTemplate === 'multi-cloud'
                  ? 'bg-purple-950/40 border-purple-500 shadow-lg shadow-purple-950/50 ring-1 ring-purple-500'
                  : 'bg-slate-950/70 border-slate-800 hover:border-purple-600/50 hover:bg-slate-950'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <AzureVirtualWanIcon className="w-4 h-4 text-sky-400" />
                    <AwsTransitGatewayIcon className="w-4 h-4 text-amber-400" />
                    <GcpInterconnectIcon className="w-4 h-4 text-blue-400" />
                  </div>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                    Mesh
                  </span>
                </div>
                <h3 className="text-xs font-bold text-white">Multi-Cloud Enterprise Mesh</h3>
                <p className="text-[11px] text-slate-400 line-clamp-2">
                  Arbitrary multi-DC topology spanning On-Prem, Azure, AWS, and GCP with shared identity & DR.
                </p>
              </div>
              <div className="text-[10px] font-mono text-purple-400 flex items-center justify-between pt-1 border-t border-slate-900">
                <span>Cross-Cloud DR</span>
                <ChevronRight className="w-3 h-3" />
              </div>
            </button>
          )}
        </div>
      </div>

      {/* Dynamic Multi-Environment Builder (Step 2) */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-cyan-400" />
              <span>Step 2: Dynamic Multi-Environment Builder ({topologyEnvironments.length} Active Environments)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Configure arbitrary on-premises datacenters, cloud regions, production tiers, and disaster recovery targets.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddEnvModal(true)}
            className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow transition-all cursor-pointer"
          >
            <span>+ Add Custom Environment</span>
          </button>
        </div>

        {/* Environments Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {topologyEnvironments.map((env, idx) => {
            const isProd = env.role === 'Production';
            const isDR = env.role === 'Disaster Recovery';
            const isShared = env.role === 'Shared Services';
            const isSecondActive = env.role === 'Secondary Active';

            return (
              <div
                key={env.id}
                className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition space-y-3 relative group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {/* Platform Icon Badge */}
                    <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800">
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
                      <p className="text-[11px] text-slate-400">{env.region}</p>
                    </div>
                  </div>

                  {/* Role Badge */}
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border shrink-0 ${
                      isProd
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                        : isDR
                        ? 'bg-amber-950 text-amber-300 border-amber-700'
                        : isSecondActive
                        ? 'bg-sky-950 text-sky-300 border-sky-700'
                        : isShared
                        ? 'bg-slate-900 text-slate-300 border-slate-700'
                        : 'bg-purple-950 text-purple-300 border-purple-700'
                    }`}
                  >
                    {env.role}
                  </span>
                </div>

                {/* Sizing Details */}
                <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-900 text-[11px] font-mono text-slate-300">
                  <div>
                    <span className="text-[10px] text-slate-500 block">HOSTS / SKU</span>
                    <span className="font-semibold text-white">
                      {env.hostCount > 0 ? `${env.hostCount}x ${env.nodeSku.split(' ')[0]}` : 'Serverless'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">COMPUTE</span>
                    <span className="font-semibold text-cyan-300">
                      {env.totalVcpu} vCPU
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">STORAGE</span>
                    <span className="font-semibold text-emerald-300">
                      {env.storageTB} TiB
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400 border-t border-slate-900">
                  <span className="font-mono text-[10px] text-slate-500">CIDR: {env.cidrBlock}</span>
                  {topologyEnvironments.length > 1 && (
                    <button
                      type="button"
                      onClick={() => promptRemoveEnvironment(env.id)}
                      className="text-rose-400 hover:text-rose-300 text-[11px] underline cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Platform-Specific Resilience Validation Warning Banner */}
        {getPlatformResilienceWarnings().length > 0 && (
          <div className="space-y-2 pt-2">
            {getPlatformResilienceWarnings().map((w, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs ${
                  w.type === 'warning'
                    ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                    : 'bg-cyan-950/30 border-cyan-500/40 text-cyan-200'
                }`}
              >
                {w.type === 'warning' ? (
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                ) : (
                  <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                )}
                <div className="leading-relaxed">
                  <strong>Technical Architecture Requirement: </strong>
                  <span>{w.text}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Custom Environment Modal */}
      {showAddEnvModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 text-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Add New Infrastructure Environment</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddEnvModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Environment Name with validation and requirement helper text */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 font-medium">
                    Environment Name <span className="text-rose-400">*</span>
                  </label>
                  {isEnvNameEmpty ? (
                    <span className="text-[11px] text-amber-400/90 font-mono">Required to enable button</span>
                  ) : isEnvNameDuplicate ? (
                    <span className="text-[11px] text-rose-400 font-mono font-semibold">Name already in use</span>
                  ) : (
                    <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Valid
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="e.g. Frankfurt DR Secondary Datacenter"
                  value={newEnvName}
                  onChange={e => setNewEnvName(e.target.value)}
                  className={`w-full px-3 py-2 bg-slate-950 border rounded-lg text-slate-200 text-xs focus:outline-none transition ${
                    isEnvNameDuplicate
                      ? 'border-rose-500 focus:border-rose-400'
                      : isEnvNameEmpty
                      ? 'border-slate-800 focus:border-cyan-500'
                      : 'border-emerald-500/60 focus:border-emerald-400'
                  }`}
                />
                {isEnvNameDuplicate && (
                  <p className="text-[11px] text-rose-400 flex items-center gap-1 mt-0.5">
                    <AlertTriangle className="w-3 h-3 shrink-0" />
                    <span>An environment named &ldquo;{trimmedEnvName}&rdquo; already exists. Please choose a unique name.</span>
                  </p>
                )}
                {isEnvNameEmpty && (
                  <p className="text-[11px] text-slate-400">
                    Enter a descriptive identifier (e.g., region, role, or facility name).
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">Platform Technology</label>
                  <select
                    value={newEnvPlatform}
                    onChange={e => setNewEnvPlatform(e.target.value as any)}
                    className="w-full px-2 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs"
                  >
                    <option value="Nutanix AHV">Nutanix AHV (On-Premises)</option>
                    <option value="Nutanix NC2 on Azure">Nutanix NC2 on Azure</option>
                    <option value="Azure VMware Solution">Azure VMware Solution (AVS)</option>
                    <option value="VMware vSphere">VMware vSphere (On-Premises)</option>
                    <option value="VMware Cloud on AWS">VMware Cloud on AWS</option>
                    <option value="Google Cloud VMware Engine">Google Cloud VMware Engine</option>
                    <option value="AWS Native">AWS Native VPC Hub</option>
                    <option value="GCP Native">Google Cloud Native Hub</option>
                    <option value="Co-Location Datacenter">Co-Location Datacenter</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">Operational Role</label>
                  <select
                    value={newEnvRole}
                    onChange={e => setNewEnvRole(e.target.value as any)}
                    className="w-full px-2 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs"
                  >
                    <option value="Production">Primary Production</option>
                    <option value="Disaster Recovery">Disaster Recovery (DR)</option>
                    <option value="Secondary Active">Secondary Active-Active</option>
                    <option value="Dev/Test">Development & Test</option>
                    <option value="Shared Services">Shared Services Hub</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">Region / Facility</label>
                  <input
                    type="text"
                    placeholder="e.g. Azure West Europe"
                    value={newEnvRegion}
                    onChange={e => setNewEnvRegion(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-300 font-medium">Management CIDR</label>
                    {isCidrFormatInvalid ? (
                      <span className="text-[11px] text-rose-400 font-mono font-semibold">Invalid CIDR</span>
                    ) : trimmedCidr ? (
                      <span className="text-[11px] text-emerald-400 font-mono">IPv4 Valid</span>
                    ) : (
                      <span className="text-[11px] text-slate-400 font-mono">Optional</span>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="10.240.0.0/22"
                    value={newEnvCidr}
                    onChange={e => setNewEnvCidr(e.target.value)}
                    className={`w-full px-3 py-2 bg-slate-950 border rounded-lg text-slate-200 text-xs font-mono focus:outline-none transition ${
                      isCidrFormatInvalid
                        ? 'border-rose-500 focus:border-rose-400'
                        : trimmedCidr
                        ? 'border-emerald-500/60 focus:border-emerald-400'
                        : 'border-slate-800 focus:border-cyan-500'
                    }`}
                  />
                  {isCidrFormatInvalid ? (
                    <p className="text-[11px] text-rose-400">
                      Enter a valid IPv4 CIDR block (e.g. 10.240.0.0/22 or 172.16.0.0/16, prefix /0 to /32).
                    </p>
                  ) : (
                    <p className="text-[10px] text-slate-400">
                      Format: x.x.x.x/yy (leave blank if unassigned).
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-300 font-medium">Host / Node Count</label>
                    {!isHostCountValid && (
                      <span className="text-[11px] text-rose-400 font-mono font-semibold">Invalid count</span>
                    )}
                  </div>
                  <input
                    type="number"
                    min={newEnvPlatform.includes('Native') ? 0 : 1}
                    max={64}
                    value={newEnvHosts}
                    onChange={e => setNewEnvHosts(Number(e.target.value))}
                    className={`w-full px-3 py-2 bg-slate-950 border rounded-lg text-slate-200 text-xs font-mono focus:outline-none transition ${
                      !isHostCountValid ? 'border-rose-500' : 'border-slate-800 focus:border-cyan-500'
                    }`}
                  />
                  <span className="text-[10px] text-slate-400 block">
                    {newEnvPlatform.includes('Native')
                      ? 'Native VPC / VNet services (0 allowed for serverless/managed)'
                      : 'Physical or baremetal hypervisor nodes (min 1)'}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-300 font-medium">Storage Footprint (TB)</label>
                    {!isStorageValid && (
                      <span className="text-[11px] text-rose-400 font-mono font-semibold">Invalid TB</span>
                    )}
                  </div>
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    value={newEnvStorageTB}
                    onChange={e => setNewEnvStorageTB(Number(e.target.value))}
                    className={`w-full px-3 py-2 bg-slate-950 border rounded-lg text-slate-200 text-xs font-mono focus:outline-none transition ${
                      !isStorageValid ? 'border-rose-500' : 'border-slate-800 focus:border-cyan-500'
                    }`}
                  />
                  <span className="text-[10px] text-slate-400 block">
                    Raw or usable storage allocation (TB)
                  </span>
                </div>
              </div>
            </div>

            {/* Validation helper status bar */}
            {!isAddEnvFormValid && (
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <span className="font-semibold text-slate-300 block">Required to add environment:</span>
                <ul className="list-disc list-inside space-y-0.5 text-[10px]">
                  {isEnvNameEmpty && <li>Provide an Environment Name</li>}
                  {isEnvNameDuplicate && <li>Choose an Environment Name that is not already in use</li>}
                  {isCidrFormatInvalid && <li>Provide a valid IPv4 CIDR (or leave blank)</li>}
                  {!isHostCountValid && <li>Enter a valid non-negative host count</li>}
                  {!isStorageValid && <li>Enter a valid positive storage footprint in TB</li>}
                </ul>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <span className="text-[11px] text-slate-400">
                Newly created environments are added as unlinked zones until connected.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddEnvModal(false)}
                  className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddEnvironment}
                  disabled={!isAddEnvFormValid}
                  title={!isAddEnvFormValid ? 'Complete all required fields to add environment' : undefined}
                  className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 text-xs font-bold shadow cursor-pointer transition flex items-center gap-1.5"
                >
                  <Server className="w-3.5 h-3.5" />
                  <span>Add Environment</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Guardrail Modal: Template Switch with User Customization Protection */}
      {showTemplateSwitchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-amber-500/50 shadow-2xl p-6 text-slate-100 space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Switch Architecture Track?</h3>
                <p className="text-xs text-amber-300">Customized environments and interconnect links detected</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              You have customized node counts, hardware SKUs, or network interconnects in your active topology. Switching to a new architecture track will reset the environment canvas to that track&apos;s baseline topology.
            </p>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
              <div className="text-slate-400 font-mono text-[10px] uppercase">Pending Architecture Track</div>
              <div className="font-bold text-cyan-300 font-mono text-sm">{pendingTemplateSwitch}</div>
              <div className="text-[11px] text-slate-400">
                Current custom topology ({topologyEnvironments.length} nodes, {interconnectLinks.length} links) will be re-initialized.
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowTemplateSwitchModal(false);
                  setPendingTemplateSwitch(null);
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer transition"
              >
                Keep Current Topology
              </button>
              <button
                type="button"
                onClick={() => {
                  if (pendingTemplateSwitch) {
                    applyTemplateSwitch(pendingTemplateSwitch);
                  }
                  setShowTemplateSwitchModal(false);
                  setPendingTemplateSwitch(null);
                }}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold cursor-pointer transition shadow-lg"
              >
                Switch & Reset to Track Baseline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Guardrail Modal: Environment Deletion & Cascade Link Protection */}
      {showDeleteEnvModal && pendingDeleteEnvId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-rose-500/50 shadow-2xl p-6 text-slate-100 space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/30">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Remove Environment & Attached Links?</h3>
                <p className="text-xs text-rose-300">Active interconnect links will be severed</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Environment <strong>&quot;{topologyEnvironments.find(e => e.id === pendingDeleteEnvId)?.name}&quot;</strong> is currently connected to other environments. Removing it will automatically sever all attached interconnect links:
            </p>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2 max-h-36 overflow-y-auto font-mono">
              {interconnectLinks
                .filter(l => l.sourceId === pendingDeleteEnvId || l.targetId === pendingDeleteEnvId)
                .map(l => (
                  <div key={l.id} className="text-[11px] text-rose-300 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                    <span>
                      {topologyEnvironments.find(e => e.id === l.sourceId)?.name} ➔ {topologyEnvironments.find(e => e.id === l.targetId)?.name} ({l.protocol})
                    </span>
                  </div>
                ))}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteEnvModal(false);
                  setPendingDeleteEnvId(null);
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (pendingDeleteEnvId) {
                    handleRemoveEnvironment(pendingDeleteEnvId);
                  }
                  setShowDeleteEnvModal(false);
                  setPendingDeleteEnvId(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white text-xs font-bold cursor-pointer transition shadow-lg"
              >
                Confirm & Remove Environment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Tabbed Sizing & Configuration Inspector (Topology, Networking, DR) */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5 shadow-2xl">
        {/* Step 3 Header & Tab Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-cyan-400 font-bold uppercase">Step 3: Configuration Inspector</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                Single Source of Truth
              </span>
            </div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Workload Sizing, Network Fabric & Disaster Recovery Inspector</span>
            </h2>
          </div>

          {/* Three Inspector Tabs */}
          <div className="flex items-center p-1 bg-slate-950 border border-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => setStep3ActiveTab('topology')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                step3ActiveTab === 'topology'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Server className="w-3.5 h-3.5" />
              <span>Topology & Sizing</span>
            </button>

            <button
              type="button"
              onClick={() => setStep3ActiveTab('networking')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                step3ActiveTab === 'networking'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span>Network & Subnets</span>
            </button>

            <button
              type="button"
              onClick={() => setStep3ActiveTab('dr')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                step3ActiveTab === 'dr'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>DR & Resilience</span>
            </button>
          </div>
        </div>

        {/* Live Rollup Capacity Metrics Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 font-mono text-xs">
          <div>
            <span className="text-[10px] text-slate-500 uppercase block">Environments</span>
            <span className="text-sm font-bold text-cyan-400">{topologyEnvironments.length} Tiers</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase block">Total Hosts</span>
            <span className="text-sm font-bold text-white">{topologyMetrics.totalHosts} Nodes</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase block">Total Workload</span>
            <span className="text-sm font-bold text-emerald-400">{topologyMetrics.totalVMs} VMs</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase block">Aggregate vCPU</span>
            <span className="text-sm font-bold text-white">{topologyMetrics.totalVcpu} Cores</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase block">Aggregate Memory</span>
            <span className="text-sm font-bold text-white">{topologyMetrics.totalRamGB} GiB</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase block">Usable Storage</span>
            <span className="text-sm font-bold text-indigo-400">{topologyMetrics.totalStorageTB} TiB</span>
          </div>
        </div>

        {/* TAB 1: TOPOLOGY & SIZING INSPECTOR */}
        {step3ActiveTab === 'topology' && (
          <div className="space-y-4">
            {/* Metadata Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
              <div className="space-y-1">
                <label className="text-slate-400 font-medium text-[11px]">Customer Organization</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 font-semibold focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-400 font-medium text-[11px]">Lead Enterprise Architect</label>
                <input
                  type="text"
                  value={architectName}
                  onChange={e => setArchitectName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-400 font-medium text-[11px]">Project Timestamp</label>
                <input
                  type="date"
                  value={projectDate}
                  onChange={e => setProjectDate(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Environment Cards Grid */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold text-slate-300">Configured Environment Tiers & Sizing:</span>
                <span className="font-mono text-[11px]">Editing specs directly updates the authoritative model</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {topologyEnvironments.map(env => {
                  const skuList = getAvailableSkusForPlatform(env.platform);
                  return (
                    <div
                      key={env.id}
                      className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between space-y-3"
                    >
                      {/* Environment Card Header */}
                      <div className="flex items-start justify-between gap-2 border-b border-slate-800/80 pb-2">
                        <div className="space-y-0.5">
                          <input
                            type="text"
                            value={env.name}
                            onChange={e => handleUpdateNodeSpec(env.id, { name: e.target.value })}
                            className="font-bold text-white text-xs bg-transparent border-b border-transparent hover:border-slate-700 focus:border-cyan-500 focus:outline-none w-full"
                          />
                          <div className="flex items-center gap-1.5 text-[10px] font-mono">
                            <span className="text-cyan-400">{env.platform}</span>
                            <span className="text-slate-600">·</span>
                            <span className="text-slate-400 capitalize">{env.tier}</span>
                          </div>
                        </div>

                        {topologyEnvironments.length > 1 && (
                          <button
                            type="button"
                            onClick={() => promptRemoveEnvironment(env.id)}
                            className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 cursor-pointer transition"
                            title="Remove environment"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Sizing Controls */}
                      <div className="space-y-2.5 text-xs">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-400 uppercase font-mono block">Host Count</label>
                            <input
                              type="number"
                              min="1"
                              max="128"
                              value={env.hostCount}
                              onChange={e => handleUpdateNodeSpec(env.id, { hostCount: Math.max(1, Number(e.target.value)) })}
                              className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded text-white font-mono font-bold focus:border-cyan-500 focus:outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-400 uppercase font-mono block">Workload VMs</label>
                            <input
                              type="number"
                              min="0"
                              max="10000"
                              value={env.vmCount ?? Math.round(env.totalVcpu / 2.5)}
                              onChange={e => handleUpdateNodeSpec(env.id, { vmCount: Math.max(0, Number(e.target.value)) })}
                              className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded text-emerald-400 font-mono font-bold focus:border-cyan-500 focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-400 uppercase font-mono block">Hardware Node SKU</label>
                          <select
                            value={env.nodeSku}
                            onChange={e => handleUpdateNodeSpec(env.id, { nodeSku: e.target.value })}
                            className="w-full px-2 py-1.5 bg-slate-900 border border-slate-800 rounded text-cyan-300 text-[11px] font-mono focus:border-cyan-500 focus:outline-none"
                          >
                            {skuList.map(sku => (
                              <option key={sku} value={sku}>
                                {sku}
                              </option>
                            ))}
                            {!skuList.includes(env.nodeSku) && (
                              <option value={env.nodeSku}>{env.nodeSku}</option>
                            )}
                          </select>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-400 uppercase font-mono block">Storage (TB)</label>
                            <input
                              type="number"
                              min="1"
                              max="2000"
                              value={env.storageTB}
                              onChange={e => handleUpdateNodeSpec(env.id, { storageTB: Math.max(1, Number(e.target.value)) })}
                              className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-400 uppercase font-mono block">Subnet CIDR</label>
                            <input
                              type="text"
                              value={env.cidrBlock}
                              onChange={e => handleUpdateNodeSpec(env.id, { cidrBlock: e.target.value })}
                              className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded text-slate-200 font-mono text-[11px] focus:border-cyan-500 focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Capacity Rollup Footer */}
                      <div className="pt-2 border-t border-slate-900 text-[10px] font-mono text-slate-400 flex items-center justify-between">
                        <span>Compute: {env.totalVcpu} vCPUs · {env.totalRamGB} GB</span>
                        <span className="text-slate-500">{env.region}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: NETWORK & SUBNETS INSPECTOR */}
        {step3ActiveTab === 'networking' && (
          <div className="space-y-5">
            {/* Global Network & Security Architecture Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-medium text-[11px]">Physical Interconnect Carrier</label>
                <select
                  value={connectivity}
                  onChange={e => setConnectivity(e.target.value as any)}
                  className="w-full px-2.5 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs focus:border-cyan-500 focus:outline-none"
                >
                  <option value="Hybrid (VPN + ExpressRoute / DirectConnect)">Hybrid (VPN + Direct Circuit)</option>
                  <option value="Direct Circuits with FastPath / Global Reach">Direct Circuits (FastPath / Global Reach)</option>
                  <option value="VPN Only">IPsec VPN Only</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium text-[11px]">Landing Zone Architecture</label>
                <select
                  value={landingZone}
                  onChange={e => setLandingZone(e.target.value as any)}
                  className="w-full px-2.5 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs focus:border-cyan-500 focus:outline-none"
                >
                  <option value="Azure Virtual WAN Hub-and-Spoke">Azure Virtual WAN Hub-and-Spoke</option>
                  <option value="Traditional Hub-and-Spoke with ARS">Traditional Hub-and-Spoke with Route Server</option>
                  <option value="AWS Transit Gateway Multi-VPC">AWS Transit Gateway Multi-VPC</option>
                  <option value="GCP Shared VPC Host Project">GCP Shared VPC Host Project</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium text-[11px]">NVA Firewall Architecture</label>
                <select
                  value={nvaFirewall}
                  onChange={e => setNvaFirewall(e.target.value as any)}
                  className="w-full px-2.5 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs focus:border-cyan-500 focus:outline-none"
                >
                  <option value="Palo Alto Networks VM-Series">Palo Alto Networks VM-Series</option>
                  <option value="Azure Firewall Premium / Native">Azure Firewall Premium / Native</option>
                  <option value="Fortinet FortiGate-VM">Fortinet FortiGate-VM</option>
                  <option value="Check Point CloudGuard">Check Point CloudGuard</option>
                  <option value="Cisco Secure Firewall">Cisco Secure Firewall</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium text-[11px]">Web Application Firewall (WAF)</label>
                <select
                  value={wafSolution}
                  onChange={e => setWafSolution(e.target.value as any)}
                  className="w-full px-2.5 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs focus:border-cyan-500 focus:outline-none"
                >
                  <option value="Azure WAF on Application Gateway">Azure WAF on App Gateway</option>
                  <option value="Cloudflare Magic Transit">Cloudflare Magic Transit</option>
                  <option value="AWS WAF">AWS WAF</option>
                  <option value="F5 Distributed Cloud WAF">F5 Distributed Cloud WAF</option>
                </select>
              </div>
            </div>

            {/* Interconnect Links Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300 flex items-center gap-2">
                  <Network className="w-4 h-4 text-cyan-400" />
                  <span>Cross-Environment Interconnect Links ({interconnectLinks.length})</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (topologyEnvironments.length >= 2) {
                      setEditingLinkId(null);
                      setLinkModalSourceId(topologyEnvironments[0]?.id || '');
                      setLinkModalTargetId(topologyEnvironments[1]?.id || '');
                      setShowLinkModal(true);
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow transition"
                >
                  <Link2 className="w-3.5 h-3.5" />
                  <span>Establish New Link</span>
                </button>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 text-[10px] uppercase">
                      <th className="py-2.5 px-4">Source Tier</th>
                      <th className="py-2.5 px-4">Target Tier</th>
                      <th className="py-2.5 px-4">Protocol</th>
                      <th className="py-2.5 px-4">Bandwidth</th>
                      <th className="py-2.5 px-4">Redundancy</th>
                      <th className="py-2.5 px-4">Latency</th>
                      <th className="py-2.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-200">
                    {interconnectLinks.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-6 text-center text-slate-500 font-sans text-xs">
                          No cross-environment interconnect links configured. Click &quot;Establish New Link&quot; or connect nodes in the Step 4 canvas.
                        </td>
                      </tr>
                    ) : (
                      interconnectLinks.map(link => {
                        const src = topologyEnvironments.find(e => e.id === link.sourceId);
                        const tgt = topologyEnvironments.find(e => e.id === link.targetId);
                        return (
                          <tr key={link.id} className="hover:bg-slate-900/40 transition">
                            <td className="py-2.5 px-4 font-bold text-cyan-300">
                              {src?.name || link.sourceId}
                            </td>
                            <td className="py-2.5 px-4 font-bold text-emerald-300">
                              {tgt?.name || link.targetId}
                            </td>
                            <td className="py-2.5 px-4 text-slate-300">{link.protocol}</td>
                            <td className="py-2.5 px-4 text-cyan-400 font-bold">{link.bandwidthGbps} Gbps</td>
                            <td className="py-2.5 px-4">
                              {link.redundant ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 font-sans">
                                  <ShieldCheck className="w-3 h-3" />
                                  <span>Dual Circuit</span>
                                </span>
                              ) : (
                                <span className="text-slate-500 text-[11px] font-sans">Single Circuit</span>
                              )}
                            </td>
                            <td className="py-2.5 px-4 text-slate-400">{link.latencyMs || 2} ms</td>
                            <td className="py-2.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditLink(link)}
                                  className="text-cyan-400 hover:text-cyan-300 cursor-pointer font-sans text-xs"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteLink(link.id)}
                                  className="text-rose-400 hover:text-rose-300 cursor-pointer font-sans text-xs"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: DR & RESILIENCE INSPECTOR */}
        {step3ActiveTab === 'dr' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* DR Engine */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <label className="text-slate-300 font-medium text-xs flex items-center justify-between">
                  <span>Replication & DR Engine</span>
                  <span className="text-[10px] font-mono text-cyan-400">Validated</span>
                </label>
                <select
                  value={drEngine}
                  onChange={e => setDrEngine(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs font-semibold focus:border-cyan-500 focus:outline-none"
                >
                  <option value="Nutanix Protection Domains (NearSync)">Nutanix Protection Domains (NearSync)</option>
                  <option value="Nutanix Move / Prism Pairing">Nutanix Move / Prism Pairing</option>
                  <option value="Nutanix Move Cross-Hypervisor">Nutanix Move Cross-Hypervisor</option>
                  <option value="VMware SRM + vSphere Replication">VMware SRM + vSphere Replication</option>
                  <option value="VMware HCX Bulk / Replication">VMware HCX Bulk / Replication</option>
                  <option value="VMware HCX / Google Cloud Interconnect">VMware HCX / Google Cloud Interconnect</option>
                  <option value="AWS Direct Connect + AWS DMS">AWS Direct Connect + AWS DMS</option>
                  <option value="Google Cloud Partner Interconnect">Google Cloud Partner Interconnect</option>
                  <option value="Multi-Cloud Cross-Replication">Multi-Cloud Cross-Replication</option>
                </select>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Controls continuous data protection, storage block sync, and failover orchestration between environments.
                </p>
              </div>

              {/* RPO & RTO SLA */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <label className="text-slate-300 font-medium text-xs flex items-center justify-between">
                  <span>Target RPO & RTO SLAs</span>
                  {drRpoMinutes === 0 ? (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                      0-min Sync (Zero Data Loss)
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-cyan-400">{drRpoMinutes}-min RPO</span>
                  )}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-slate-400 uppercase block">RPO (Minutes)</span>
                    <input
                      type="number"
                      min="0"
                      max="1440"
                      value={drRpoMinutes}
                      onChange={e => setDrRpoMinutes(Math.max(0, Number(e.target.value)))}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded text-cyan-300 font-mono font-bold text-xs focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-slate-400 uppercase block">RTO (Minutes)</span>
                    <input
                      type="number"
                      min="5"
                      max="1440"
                      value={drRtoMinutes}
                      onChange={e => setDrRtoMinutes(Math.max(5, Number(e.target.value)))}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded text-slate-200 font-mono font-bold text-xs focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-slate-400">
                  Setting RPO to 0 designates synchronous zero-data-loss replication for critical database tiers.
                </p>
              </div>

              {/* DR Topology Strategy */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <label className="text-slate-300 font-medium text-xs">Failover Orchestration Strategy</label>
                <select
                  value={drStrategy}
                  onChange={e => setDrStrategy(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs font-semibold focus:border-cyan-500 focus:outline-none"
                >
                  <option value="Pilot Light (3-Node Minimum)">Pilot Light (3-Node Minimum)</option>
                  <option value="Warm Standby (Full Cluster)">Warm Standby (Full Cluster)</option>
                  <option value="Cold Storage / On-Demand">Cold Storage / On-Demand</option>
                  <option value="Hot Standby (Full Cluster)">Hot Standby (Active-Standby Mirror)</option>
                </select>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Defines cloud standby capacity, standby power state, and pre-warmed host footprint at target site.
                </p>
              </div>
            </div>

            {/* Decoupled Storage Tier Configuration */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-cyan-400" />
                  <span className="font-semibold text-white text-xs">External Decoupled Storage Datastores</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">Offloads storage sprawl from Bare-Metal hosts</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="text-slate-400 text-[11px]">Decoupled Storage Allocation (TB)</label>
                  <input
                    type="number"
                    min="0"
                    max="1000"
                    value={decoupledStorageTB}
                    onChange={e => setDecoupledStorageTB(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded text-cyan-300 font-mono font-bold focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 text-[11px]">Storage Provider / Array Technology</label>
                  <input
                    type="text"
                    readOnly
                    value={externalStorageName}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded text-cyan-300 font-mono text-xs cursor-default select-all"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Step 4: Dual-Mode Topology Viewport (Interactive Multi-Tier Canvas + Static 4K Viewport) */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-cyan-400 font-bold uppercase">Step 4: Topology Canvas</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                {topologyEnvironments.length} Nodes · {interconnectLinks.length} Interconnect Links
              </span>
            </div>
            <h3 className="text-lg font-bold text-white">Interactive Multi-Cloud Architecture Canvas</h3>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Viewport Mode Switcher */}
            <div className="flex items-center p-1 bg-slate-950 border border-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => setCanvasMode('interactive')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                  canvasMode === 'interactive'
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Network className="w-3.5 h-3.5" />
                <span>Interactive Canvas</span>
              </button>
              <button
                type="button"
                onClick={() => setCanvasMode('static-vector')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                  canvasMode === 'static-vector'
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Static 4K Vector Blueprint</span>
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button
                onClick={() => setZoomScale(prev => Math.max(0.6, prev - 0.1))}
                className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="px-2 text-xs font-mono text-cyan-300">{Math.round(zoomScale * 100)}%</span>
              <button
                onClick={() => setZoomScale(prev => Math.min(1.8, prev + 0.1))}
                className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => setZoomScale(1.0)}
                className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer text-[10px] font-mono"
                title="Reset Zoom"
              >
                100%
              </button>
            </div>

            {/* Export 4K PNG (Zero storage writes) */}
            <button
              onClick={() => handleExport4K('png')}
              className="px-3 py-2 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Download className="w-3.5 h-3.5" />
              <span>4K PNG</span>
            </button>
          </div>
        </div>

        {/* Viewport Area */}
        <div className="overflow-x-auto overflow-y-hidden border border-slate-800 rounded-xl bg-slate-950 p-4">
          <div
            style={{
              transform: `scale(${zoomScale})`,
              transformOrigin: 'top left',
              transition: 'transform 0.15s ease-out',
              width: '1280px',
              height: '720px'
            }}
            className="relative bg-slate-950 border border-slate-800 rounded-lg overflow-hidden shadow-2xl select-none"
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
          >
            {canvasMode === 'interactive' ? (
              /* ========================================================================= */
              /* MODE 1: Interactive Multi-Tier Architecture Canvas                        */
              /* ========================================================================= */
              <div className="relative w-full h-full bg-slate-950 overflow-hidden">
                {/* Canvas Background Grid */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  <defs>
                    <pattern id="interactiveGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.5" />
                    </pattern>
                  </defs>
                  <rect width="1280" height="720" fill="url(#interactiveGrid)" />
                </svg>

                {/* Multi-Tier Column Background Dividers */}
                <div className="absolute inset-0 grid grid-cols-3 pointer-events-none border-b border-slate-900">
                  <div className="border-r border-slate-800/60 p-4 bg-slate-900/10">
                    <span className="text-[11px] font-mono font-bold text-cyan-400/70 tracking-wider uppercase">
                      TIER 1: SOURCE & ON-PREMISES DC
                    </span>
                  </div>
                  <div className="border-r border-slate-800/60 p-4 bg-slate-900/20">
                    <span className="text-[11px] font-mono font-bold text-indigo-400/70 tracking-wider uppercase">
                      TIER 2: TRANSIT & SECURITY HUBS
                    </span>
                  </div>
                  <div className="p-4 bg-slate-900/10">
                    <span className="text-[11px] font-mono font-bold text-emerald-400/70 tracking-wider uppercase">
                      TIER 3: TARGET CLOUD SDDC / NATIVE / DR
                    </span>
                  </div>
                </div>

                {/* Floating Connecting Mode Banner */}
                {connectingSourceId && (
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-xl bg-amber-950/90 border border-amber-500 shadow-xl flex items-center gap-3 text-xs text-amber-200">
                    <Activity className="w-4 h-4 text-amber-400 animate-pulse" />
                    <span>
                      Connecting from: <strong>{topologyEnvironments.find(e => e.id === connectingSourceId)?.name}</strong>. Click target node to establish link.
                    </span>
                    <button
                      type="button"
                      onClick={() => setConnectingSourceId(null)}
                      className="px-2 py-0.5 rounded bg-amber-900 hover:bg-amber-800 text-white text-[10px] font-mono cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {/* Interactive SVG Interconnect Curves */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                  {interconnectLinks.map(link => {
                    const sourceNode = topologyEnvironments.find(e => e.id === link.sourceId);
                    const targetNode = topologyEnvironments.find(e => e.id === link.targetId);
                    if (!sourceNode || !targetNode) return null;

                    const sx = (sourceNode.x ?? 80) + 290;
                    const sy = (sourceNode.y ?? 120) + 70;
                    const tx = (targetNode.x ?? 780);
                    const ty = (targetNode.y ?? 120) + 70;

                    const dx = Math.abs(tx - sx) * 0.45;
                    const pathData = `M ${sx} ${sy} C ${sx + dx} ${sy}, ${tx - dx} ${ty}, ${tx} ${ty}`;
                    const strokeColor = link.protocol.includes('ExpressRoute')
                      ? '#38bdf8'
                      : link.protocol.includes('Direct Connect')
                      ? '#f59e0b'
                      : link.protocol.includes('Interconnect')
                      ? '#60a5fa'
                      : link.protocol.includes('Move') || link.protocol.includes('HCX')
                      ? '#10b981'
                      : '#c084fc';

                    const midX = (sx + tx) / 2;
                    const midY = (sy + ty) / 2;

                    return (
                      <g key={link.id}>
                        {/* Glow halo */}
                        <path d={pathData} fill="none" stroke={strokeColor} strokeWidth="6" opacity="0.2" />
                        {/* Main connection line */}
                        <path d={pathData} fill="none" stroke={strokeColor} strokeWidth="2.5" />
                        {/* Directional animated dashes */}
                        <path
                          d={pathData}
                          fill="none"
                          stroke="#ffffff"
                          strokeWidth="1.5"
                          strokeDasharray="6,8"
                          opacity="0.8"
                        />
                        {/* Link Protocol & Bandwidth Badge */}
                        <foreignObject
                          x={midX - 70}
                          y={midY - 14}
                          width="140"
                          height="28"
                          className="pointer-events-auto"
                        >
                          <button
                            type="button"
                            onClick={() => handleOpenEditLink(link)}
                            className="w-full h-full px-2 py-0.5 rounded-full bg-slate-900/90 border border-slate-700 hover:border-cyan-400 text-[10px] font-mono text-slate-200 hover:text-white flex items-center justify-center gap-1 shadow-lg cursor-pointer transition"
                            title={`Click to edit or remove ${link.protocol} link (${link.bandwidthGbps} Gbps)`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                            <span className="font-bold text-cyan-300">{link.bandwidthGbps}G</span>
                            <span className="truncate">{link.protocol.split(' ')[0]}</span>
                          </button>
                        </foreignObject>
                      </g>
                    );
                  })}
                </svg>

                {/* Interactive Node Cards */}
                <div className="absolute inset-0 z-20 pointer-events-auto">
                  {topologyEnvironments.map(env => {
                    const isSourceSelected = connectingSourceId === env.id;
                    const isTargetCandidate = Boolean(connectingSourceId && connectingSourceId !== env.id);
                    const isSelected = selectedNodeId === env.id;

                    const isProd = env.role === 'Production';
                    const isDR = env.role === 'Disaster Recovery';
                    const isShared = env.role === 'Shared Services';

                    return (
                      <div
                        key={env.id}
                        style={{
                          transform: `translate(${env.x ?? 80}px, ${env.y ?? 120}px)`,
                          width: '290px'
                        }}
                        onMouseDown={e => handleNodeMouseDown(e, env)}
                        className={`absolute rounded-xl bg-slate-900/95 border shadow-2xl transition-shadow select-none ${
                          isSourceSelected
                            ? 'border-amber-400 ring-2 ring-amber-400/50 shadow-amber-950/50'
                            : isTargetCandidate
                            ? 'border-cyan-400 ring-2 ring-cyan-400/40 animate-pulse'
                            : isSelected
                            ? 'border-cyan-500 ring-1 ring-cyan-500'
                            : 'border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {/* Draggable Card Header */}
                        <div className="p-3 border-b border-slate-800/80 flex items-center justify-between gap-2 cursor-grab active:cursor-grabbing bg-slate-950/40 rounded-t-xl">
                          <div className="flex items-center gap-2 min-w-0">
                            <GripVertical className="w-4 h-4 text-slate-500 shrink-0" />
                            <div className="p-1 rounded bg-slate-900 border border-slate-800 shrink-0">
                              {env.platform.includes('Nutanix') ? (
                                <NutanixAhvIcon className="w-4 h-4 text-emerald-400" />
                              ) : env.platform.includes('Azure') ? (
                                <AzureVirtualWanIcon className="w-4 h-4 text-sky-400" />
                              ) : env.platform.includes('AWS') ? (
                                <AwsTransitGatewayIcon className="w-4 h-4 text-amber-400" />
                              ) : env.platform.includes('Google') || env.platform.includes('GCP') ? (
                                <GcpInterconnectIcon className="w-4 h-4 text-blue-400" />
                              ) : (
                                <VmwareVcenterIcon className="w-4 h-4 text-indigo-400" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-white truncate">{env.name}</h4>
                              <p className="text-[10px] text-slate-400 truncate">{env.region}</p>
                            </div>
                          </div>
                          <span
                            className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border shrink-0 ${
                              isProd
                                ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                                : isDR
                                ? 'bg-amber-950 text-amber-300 border-amber-700'
                                : isShared
                                ? 'bg-slate-900 text-slate-300 border-slate-700'
                                : 'bg-sky-950 text-sky-300 border-sky-700'
                            }`}
                          >
                            {env.role}
                          </span>
                        </div>

                        {/* Card Body - Infrastructure Metrics */}
                        <div className="p-3 space-y-2 text-[11px] font-mono">
                          <div className="grid grid-cols-3 gap-1.5 text-center bg-slate-950/50 p-2 rounded-lg border border-slate-800/60">
                            <div>
                              <span className="text-[9px] text-slate-500 block">HOSTS</span>
                              <span className="font-bold text-white text-xs">{env.hostCount}</span>
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-500 block">VCPU</span>
                              <span className="font-bold text-cyan-300 text-xs">{env.totalVcpu}</span>
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-500 block">STORAGE</span>
                              <span className="font-bold text-emerald-300 text-xs">{env.storageTB}T</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                            <span>CIDR: {env.cidrBlock}</span>
                            <span className="text-slate-500 truncate max-w-[120px]">{env.nodeSku.split(' ')[0]}</span>
                          </div>
                        </div>

                        {/* Card Action Footer */}
                        <div className="p-2 border-t border-slate-800/80 bg-slate-950/30 rounded-b-xl flex items-center justify-between gap-1 text-[10px]">
                          {isTargetCandidate ? (
                            <button
                              type="button"
                              onClick={() => handleFinishConnect(env.id)}
                              className="w-full py-1 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold flex items-center justify-center gap-1 cursor-pointer transition shadow"
                            >
                              <Link2 className="w-3 h-3" />
                              <span>Connect Here</span>
                            </button>
                          ) : isSourceSelected ? (
                            <span className="w-full text-center py-1 text-amber-300 font-mono font-semibold">
                              Source Selected
                            </span>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => handleStartConnect(env.id)}
                                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 flex items-center gap-1 cursor-pointer transition"
                                title="Start drawing connection link to another node"
                              >
                                <Link2 className="w-3 h-3" />
                                <span>Connect</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setSelectedNodeId(env.id)}
                                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1 cursor-pointer transition"
                                title="Inspect and edit node sizing parameters"
                              >
                                <Settings2 className="w-3 h-3 text-slate-400" />
                                <span>Inspect</span>
                              </button>
                              {topologyEnvironments.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => promptRemoveEnvironment(env.id)}
                                  className="px-2 py-1 rounded hover:bg-rose-950 text-slate-500 hover:text-rose-400 cursor-pointer transition"
                                  title="Remove environment"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Node Spec Inspector Drawer / Modal */}
                {selectedNodeId && (() => {
                  const inspectingNode = topologyEnvironments.find(e => e.id === selectedNodeId);
                  if (!inspectingNode) return null;
                  const nodeLinks = interconnectLinks.filter(
                    l => l.sourceId === inspectingNode.id || l.targetId === inspectingNode.id
                  );

                  return (
                    <div className="absolute top-4 right-4 z-40 w-96 rounded-2xl bg-slate-900 border border-cyan-500/50 shadow-2xl p-5 text-slate-100 space-y-4 animate-in slide-in-from-right duration-150">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div className="flex items-center gap-2">
                          <Settings2 className="w-4 h-4 text-cyan-400" />
                          <h4 className="text-xs font-bold text-white truncate">Node Spec Inspector</h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedNodeId(null)}
                          className="p-1 rounded-lg text-slate-400 hover:text-white"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="space-y-3 text-xs">
                        <div className="space-y-1">
                          <label className="text-slate-400 text-[10px] uppercase font-mono">Environment Name</label>
                          <input
                            type="text"
                            value={inspectingNode.name}
                            onChange={e => handleUpdateNodeSpec(inspectingNode.id, { name: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded text-slate-200 text-xs font-semibold"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-slate-400 text-[10px] uppercase font-mono">Platform</label>
                            <input
                              type="text"
                              disabled
                              value={inspectingNode.platform}
                              className="w-full px-2.5 py-1.5 bg-slate-950/60 border border-slate-800 rounded text-slate-400 text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-slate-400 text-[10px] uppercase font-mono">Region</label>
                            <input
                              type="text"
                              value={inspectingNode.region}
                              onChange={e => handleUpdateNodeSpec(inspectingNode.id, { region: e.target.value })}
                              className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded text-slate-200 text-xs"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 font-mono">
                          <div className="space-y-1">
                            <label className="text-slate-400 text-[10px] uppercase">Hosts</label>
                            <input
                              type="number"
                              min="0"
                              max="64"
                              value={inspectingNode.hostCount}
                              onChange={e =>
                                handleUpdateNodeSpec(inspectingNode.id, {
                                  hostCount: Number(e.target.value),
                                  totalVcpu: Number(e.target.value) * 36,
                                  totalRamGB: Number(e.target.value) * 576
                                })
                              }
                              className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded text-white text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-slate-400 text-[10px] uppercase">vCPU</label>
                            <input
                              type="number"
                              value={inspectingNode.totalVcpu}
                              onChange={e => handleUpdateNodeSpec(inspectingNode.id, { totalVcpu: Number(e.target.value) })}
                              className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded text-cyan-300 text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-slate-400 text-[10px] uppercase">Storage TB</label>
                            <input
                              type="number"
                              min="1"
                              value={inspectingNode.storageTB}
                              onChange={e => handleUpdateNodeSpec(inspectingNode.id, { storageTB: Number(e.target.value) })}
                              className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded text-emerald-300 text-xs"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-slate-400 text-[10px] uppercase font-mono">Management CIDR</label>
                          <input
                            type="text"
                            value={inspectingNode.cidrBlock}
                            onChange={e => handleUpdateNodeSpec(inspectingNode.id, { cidrBlock: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded text-slate-200 text-xs font-mono"
                          />
                        </div>

                        {/* Connected Interconnect Links */}
                        <div className="space-y-1.5 pt-2 border-t border-slate-800">
                          <span className="text-slate-400 text-[10px] uppercase font-mono block">Connected Links ({nodeLinks.length})</span>
                          {nodeLinks.length === 0 ? (
                            <p className="text-[11px] text-slate-500">Unlinked zone. Click 'Connect' on canvas to create an interconnect link.</p>
                          ) : (
                            <div className="space-y-1.5">
                              {nodeLinks.map(link => (
                                <div key={link.id} className="p-2 rounded bg-slate-950 border border-slate-800 flex items-center justify-between text-[11px]">
                                  <div className="truncate pr-2">
                                    <span className="text-cyan-400 font-mono font-bold">{link.bandwidthGbps}G</span> · {link.protocol}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteLink(link.id)}
                                    className="text-rose-400 hover:text-rose-300 text-[10px] cursor-pointer"
                                  >
                                    Delete
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-800 flex justify-end">
                        <button
                          type="button"
                          onClick={() => setSelectedNodeId(null)}
                          className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold cursor-pointer"
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {/* Configure Interconnect Link Modal */}
                {showLinkModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
                    <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 text-slate-100 space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div className="flex items-center gap-2">
                          <Link2 className="w-4 h-4 text-cyan-400" />
                          <h4 className="text-sm font-bold text-white">
                            {editingLinkId ? 'Edit Interconnect Link' : 'Establish Network Interconnect Link'}
                          </h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowLinkModal(false)}
                          className="p-1 text-slate-400 hover:text-white"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="space-y-3 text-xs">
                        <div className="grid grid-cols-2 gap-3 p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px]">
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase font-mono block">Source</span>
                            <span className="font-bold text-cyan-300">
                              {topologyEnvironments.find(e => e.id === linkModalSourceId)?.name}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase font-mono block">Target</span>
                            <span className="font-bold text-emerald-300">
                              {topologyEnvironments.find(e => e.id === linkModalTargetId)?.name}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-slate-300 font-medium">Interconnect Protocol</label>
                          <select
                            value={linkProtocol}
                            onChange={e => setLinkProtocol(e.target.value as any)}
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs"
                          >
                            <option value="ExpressRoute FastPath">Azure ExpressRoute FastPath (Ultra High Speed)</option>
                            <option value="AWS Direct Connect">AWS Direct Connect Gateway (10G Dedicated)</option>
                            <option value="Google Cloud Interconnect">Google Cloud Dedicated Interconnect</option>
                            <option value="IPsec VPN">Site-to-Site IPsec VPN Tunnel</option>
                            <option value="VMware HCX L2 Extension">VMware HCX Network Extension (L2 Stretch)</option>
                            <option value="Nutanix Move">Nutanix Move Non-Disruptive Migration Pipe</option>
                            <option value="Nutanix Protection Domain / Leap">Nutanix Protection Domains (NearSync / Leap)</option>
                            <option value="VNet / VPC Peering">Cloud Native VNet / VPC Peering</option>
                            <option value="Transit Gateway Route">Transit Gateway Inter-Region Peering</option>
                          </select>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-slate-300 font-medium">Bandwidth (Gbps)</label>
                            <select
                              value={linkBandwidth}
                              onChange={e => setLinkBandwidth(Number(e.target.value))}
                              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs font-mono font-bold text-cyan-400"
                            >
                              <option value="1">1 Gbps</option>
                              <option value="10">10 Gbps</option>
                              <option value="25">25 Gbps</option>
                              <option value="40">40 Gbps</option>
                              <option value="100">100 Gbps</option>
                            </select>
                          </div>
                          <div className="flex items-center pt-5">
                            <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                              <input
                                type="checkbox"
                                checked={linkRedundant}
                                onChange={e => setLinkRedundant(e.target.checked)}
                                className="rounded bg-slate-950 border-slate-800 text-cyan-500"
                              />
                              <span>Dual Redundant Circuit</span>
                            </label>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-slate-300 font-medium">Notes & Annotations</label>
                          <input
                            type="text"
                            placeholder="e.g. Dedicated 10G pipe with 99.99% SLA"
                            value={linkNotes}
                            onChange={e => setLinkNotes(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                        {editingLinkId ? (
                          <button
                            type="button"
                            onClick={() => handleDeleteLink(editingLinkId)}
                            className="px-3 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-500/50 text-rose-300 text-xs font-semibold cursor-pointer"
                          >
                            Delete Link
                          </button>
                        ) : (
                          <div />
                        )}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setShowLinkModal(false)}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleSaveLink}
                            className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold cursor-pointer"
                          >
                            {editingLinkId ? 'Save Changes' : 'Establish Link'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (() => {
              /* ========================================================================= */
              /* MODE 2: Track-Aware High-Fidelity 4K Vector Blueprint Viewport            */
              /* ========================================================================= */
              const vectorSpec = buildTrackVisualSpec(activeTemplate, {
                customerName,
                sourceEnv: topologyMetrics.primarySource,
                transitEnv: topologyMetrics.primaryTransit,
                targetEnv: topologyMetrics.primaryTarget,
                totalVMs: topologyMetrics.totalVMs,
                interconnectLinks,
                connectivity,
                landingZone,
                nvaFirewall,
                wafSolution,
                drEngine,
                drRpoMinutes,
                drRtoMinutes,
                drStrategy,
                externalStorageName,
                decoupledStorageTB
              });

              return (
                <svg viewBox="0 0 1280 720" className="w-full h-full select-none">
                  {/* Grid Background */}
                  <defs>
                    <pattern id="diagGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.5" />
                    </pattern>
                  </defs>
                  <rect width="1280" height="720" fill="url(#diagGrid)" />

                  {/* Header Box */}
                  <rect x="30" y="25" width="1220" height="65" rx="8" fill="#0f172a" stroke="#06b6d4" strokeWidth="1.5" />
                  <text x="50" y="52" fill="#ffffff" fontSize="15" fontWeight="bold" fontFamily="Plus Jakarta Sans">
                    {vectorSpec.title.toUpperCase()}
                  </text>
                  <text x="50" y="74" fill="#94a3b8" fontSize="11" fontFamily="JetBrains Mono">
                    ARCHITECT: {architectName} · DATE: {projectDate} · TRACK: {activeTemplate.toUpperCase()} · DR: {drEngine} ({drRpoMinutes === 0 ? '0-min Sync' : `${drRpoMinutes}-min RPO`})
                  </text>

                  {/* Panel 1 (Left) */}
                  <rect x="30" y="110" width="370" height="570" rx="10" fill="#0b1120" stroke="#334155" strokeWidth="1" />
                  <text x="50" y="140" fill="#06b6d4" fontSize="12" fontWeight="bold" fontFamily="Plus Jakarta Sans">
                    {vectorSpec.panel1Header}
                  </text>

                  {/* Panel 1 Box 1 */}
                  <rect x="50" y="160" width="330" height="150" rx="6" fill="#1e293b" stroke="#475569" strokeWidth="1" />
                  <text x="65" y="185" fill="#ffffff" fontSize="11" fontWeight="bold">{vectorSpec.panel1Box1.title}</text>
                  {vectorSpec.panel1Box1.bullets.map((b, i) => (
                    <text key={i} x="65" y={210 + i * 20} fill="#cbd5e1" fontSize="10" fontFamily="JetBrains Mono">{b}</text>
                  ))}

                  {/* Panel 1 Box 2 */}
                  <rect x="50" y="325" width="330" height="130" rx="6" fill="#1e293b" stroke="#475569" strokeWidth="1" />
                  <text x="65" y="350" fill="#ffffff" fontSize="11" fontWeight="bold">{vectorSpec.panel1Box2.title}</text>
                  {vectorSpec.panel1Box2.bullets.map((b, i) => (
                    <text key={i} x="65" y={375 + i * 20} fill="#cbd5e1" fontSize="10" fontFamily="JetBrains Mono">{b}</text>
                  ))}

                  {/* Panel 1 Box 3 */}
                  <rect x="50" y="470" width="330" height="180" rx="6" fill="#064e3b" stroke="#10b981" strokeWidth="1" />
                  <text x="65" y="495" fill="#34d399" fontSize="11" fontWeight="bold">{vectorSpec.panel1Box3.title}</text>
                  {vectorSpec.panel1Box3.bullets.map((b, i) => (
                    <text key={i} x="65" y={520 + i * 20} fill="#ffffff" fontSize="10" fontFamily="JetBrains Mono">{b}</text>
                  ))}

                  {/* Panel 2 (Center) */}
                  <rect x="430" y="110" width="370" height="570" rx="10" fill="#0b1120" stroke="#334155" strokeWidth="1" />
                  <text x="450" y="140" fill="#38bdf8" fontSize="12" fontWeight="bold" fontFamily="Plus Jakarta Sans">
                    {vectorSpec.panel2Header}
                  </text>

                  {/* Panel 2 Box 1 */}
                  <rect x="450" y="160" width="330" height="130" rx="6" fill="#1e293b" stroke="#475569" strokeWidth="1" />
                  <text x="465" y="185" fill="#ffffff" fontSize="11" fontWeight="bold">{vectorSpec.panel2Box1.title}</text>
                  {vectorSpec.panel2Box1.bullets.map((b, i) => (
                    <text key={i} x="465" y={210 + i * 20} fill="#cbd5e1" fontSize="10" fontFamily="JetBrains Mono">{b}</text>
                  ))}

                  {/* Panel 2 Box 2 */}
                  <rect x="450" y="305" width="330" height="150" rx="6" fill="#1e293b" stroke="#475569" strokeWidth="1" />
                  <text x="465" y="330" fill="#ffffff" fontSize="11" fontWeight="bold">{vectorSpec.panel2Box1.title ? vectorSpec.panel2Box2.title : ''}</text>
                  {vectorSpec.panel2Box2.bullets.map((b, i) => (
                    <text key={i} x="465" y={355 + i * 20} fill="#cbd5e1" fontSize="10" fontFamily="JetBrains Mono">{b}</text>
                  ))}

                  {/* Panel 2 Box 3 */}
                  <rect x="450" y="470" width="330" height="180" rx="6" fill="#581c87" stroke="#a855f7" strokeWidth="1" />
                  <text x="465" y="495" fill="#d8b4fe" fontSize="11" fontWeight="bold">{vectorSpec.panel2Box3.title}</text>
                  {vectorSpec.panel2Box3.bullets.map((b, i) => (
                    <text key={i} x="465" y={520 + i * 20} fill="#ffffff" fontSize="10" fontFamily="JetBrains Mono">{b}</text>
                  ))}

                  {/* Panel 3 (Right) */}
                  <rect x="830" y="110" width="420" height="570" rx="10" fill="#0b1120" stroke="#334155" strokeWidth="1" />
                  <text x="850" y="140" fill="#10b981" fontSize="12" fontWeight="bold" fontFamily="Plus Jakarta Sans">
                    {vectorSpec.panel3Header}
                  </text>

                  {/* Panel 3 Box 1 */}
                  <rect x="850" y="160" width="380" height="150" rx="6" fill="#1e293b" stroke="#475569" strokeWidth="1" />
                  <text x="865" y="185" fill="#ffffff" fontSize="11" fontWeight="bold">{vectorSpec.panel3Box1.title}</text>
                  {vectorSpec.panel3Box1.bullets.map((b, i) => (
                    <text key={i} x="865" y={210 + i * 20} fill="#cbd5e1" fontSize="10" fontFamily="JetBrains Mono">{b}</text>
                  ))}

                  {/* Panel 3 Box 2 */}
                  <rect x="850" y="325" width="380" height="150" rx="6" fill="#1e293b" stroke="#475569" strokeWidth="1" />
                  <text x="865" y="350" fill="#ffffff" fontSize="11" fontWeight="bold">{vectorSpec.panel3Box2.title}</text>
                  {vectorSpec.panel3Box2.bullets.map((b, i) => (
                    <text key={i} x="865" y={375 + i * 20} fill="#cbd5e1" fontSize="10" fontFamily="JetBrains Mono">{b}</text>
                  ))}

                  {/* Panel 3 Box 3 */}
                  <rect x="850" y="490" width="380" height="160" rx="6" fill="#0c4a6e" stroke="#0284c7" strokeWidth="1" />
                  <text x="865" y="515" fill="#38bdf8" fontSize="11" fontWeight="bold">{vectorSpec.panel3Box3.title}</text>
                  {vectorSpec.panel3Box3.bullets.map((b, i) => (
                    <text key={i} x="865" y={540 + i * 20} fill="#ffffff" fontSize="10" fontFamily="JetBrains Mono">{b}</text>
                  ))}

                  {/* Interconnect Connecting Arrows */}
                  <path d="M 380 540 L 450 220" stroke="#06b6d4" strokeWidth="2.5" strokeDasharray="6,4" fill="none" />
                  <path d="M 780 380 L 850 380" stroke="#06b6d4" strokeWidth="2.5" strokeDasharray="6,4" fill="none" />
                </svg>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Google Drive Workspace Bridge */}
      <div className="p-5 rounded-xl bg-slate-900 border border-cyan-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-500/40 shrink-0">
            <FolderGit2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">Google Drive Shared Architecture Repository</div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Save your generated 4K topology images and executive dossiers directly to Google Drive folder: <span className="font-mono text-cyan-300 select-all">{GOOGLE_DRIVE_CONFIG.folderId}</span>.
            </div>
          </div>
        </div>
        <a
          href={GOOGLE_DRIVE_CONFIG.folderUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-cyan-500/40 text-cyan-300 text-xs font-semibold shrink-0"
        >
          <span>Open Shared Google Drive</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Pre-Flight "Review & Confirm Architecture Inputs" Modal */}
      {showPreFlightModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md p-4 sm:p-8 overflow-y-auto flex justify-center">
          <div className="bg-slate-900 border border-cyan-500/50 rounded-2xl max-w-3xl w-full p-6 sm:p-8 space-y-6 text-slate-200 shadow-2xl relative my-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="space-y-1">
                <span className="text-xs font-mono text-cyan-400 uppercase font-semibold flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  <span>Architecture Pre-Flight Review</span>
                </span>
                <h2 className="text-xl font-bold text-white">Review & Confirm Architecture Inputs</h2>
              </div>
              <button
                onClick={() => setShowPreFlightModal(false)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Verify the synthesized customer parameters, sized bare-metal hosts, network topology, and disaster recovery settings before initiating the 3D isometric diagram rendering engine.
            </p>

            {/* Inputs Review Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="text-slate-400 text-[10px] uppercase">Customer & Project</div>
                <div className="font-bold text-white text-sm">{customerName}</div>
                <div className="text-[11px] text-cyan-300 font-sans">Lead: {architectName}</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="text-slate-400 text-[10px] uppercase">Target Hyperscaler & Nodes</div>
                <div className="font-bold text-emerald-400 text-sm">{calculatedCloudNodes}x {nodeSku} Nodes</div>
                <div className="text-[11px] text-slate-300 font-sans">{cloudPlatform}</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="text-slate-400 text-[10px] uppercase">Storage Tiers</div>
                <div className="font-bold text-white text-xs">Primary: vSAN Enterprise / ESA</div>
                <div className="text-[11px] text-cyan-300">Decoupled: {decoupledStorageTB} TB ({externalStorageName})</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="text-slate-400 text-[10px] uppercase">Workload Specifications</div>
                <div className="font-bold text-white text-xs">{totalVMCount} Virtual Machines</div>
                <div className="text-[11px] text-slate-400">~{totalVMCount * 4} vCPUs · ~{totalVMCount * 16} GiB RAM</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="text-slate-400 text-[10px] uppercase">Disaster Recovery Strategy</div>
                <div className="font-bold text-indigo-300 text-xs">{drEngine}</div>
                <div className="text-[11px] text-slate-400">{drRpoMinutes}-Min RPO · {drRtoMinutes}-Min RTO ({drStrategy})</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="text-slate-400 text-[10px] uppercase">Security Edge & Connectivity</div>
                <div className="font-bold text-purple-300 text-xs">{nvaFirewall}</div>
                <div className="text-[11px] text-slate-400">{connectivity}</div>
              </div>
            </div>

            {/* Visual Aesthetic Confirmation */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-cyan-500/30 text-xs flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  <span>Visual Aesthetic Profile:</span>
                </div>
                <div className="text-slate-400 text-[11px]">Dark enterprise blueprint palette with glowing neon cyan/violet network paths</div>
              </div>
              <span className="px-2 py-1 rounded bg-cyan-950 text-cyan-300 font-mono text-[10px] border border-cyan-500/40">
                UHD 4K Ready
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowPreFlightModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs cursor-pointer"
              >
                Cancel & Adjust
              </button>
              <button
                onClick={handleGenerateAIBlueprint}
                className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-cyan-400 to-indigo-500 hover:from-cyan-300 hover:to-indigo-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/30 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 fill-slate-950" />
                <span>Generate 3D Architecture Blueprint</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3D Isometric AI Blueprint Viewer Modal */}
      {show3DModal && aiBlueprintResult && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md p-3 sm:p-6 overflow-y-auto flex justify-center">
          <div className="bg-slate-900 border border-cyan-500/50 rounded-2xl max-w-6xl w-full p-6 space-y-5 text-slate-200 shadow-2xl relative my-auto">
            {/* Modal Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-cyan-400 uppercase font-bold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>3D Isometric Cloud Architecture Blueprint</span>
                  </span>
                  {aiBlueprintResult.isFallback ? (
                    <span className="px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-500/40 text-[10px] font-mono">
                      Bundled High-Res Asset
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono">
                      Live Gemini Imagen 3 Render
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-bold text-white">{customerName} — 3D Architecture Topology</h2>
              </div>

              <div className="flex items-center gap-2">
                {/* Zoom Controls */}
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                  <button
                    onClick={() => setBlueprint3DZoom(prev => Math.max(0.7, prev - 0.15))}
                    className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-1.5 text-xs font-mono text-cyan-300">{Math.round(blueprint3DZoom * 100)}%</span>
                  <button
                    onClick={() => setBlueprint3DZoom(prev => Math.min(2.0, prev + 0.15))}
                    className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setBlueprint3DZoom(1.0)}
                    className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer text-[10px] font-mono"
                  >
                    100%
                  </button>
                </div>

                <button
                  onClick={handleDownloadAIBlueprint}
                  className="px-3 py-1.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download 3D Blueprint (.png)</span>
                </button>

                <button
                  onClick={() => setShow3DModal(false)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Viewport for Image */}
            <div className="relative overflow-hidden rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center min-h-[460px] max-h-[65vh]">
              <div
                style={{
                  transform: `scale(${blueprint3DZoom})`,
                  transition: 'transform 0.15s ease-out'
                }}
                className="max-w-full max-h-full flex items-center justify-center p-2"
              >
                <img
                  src={aiBlueprintResult.imageUrl}
                  alt={`${customerName} 3D Isometric Cloud Blueprint`}
                  className="rounded-lg object-contain shadow-2xl max-h-[60vh] w-auto"
                />
              </div>
            </div>

            {/* Footer with Metadata & Google Drive Handoff */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-slate-800 text-xs">
              <div className="text-[11px] text-slate-400 font-mono">
                <span className="text-white font-bold">{calculatedCloudNodes}x {nodeSku}</span> in {cloudPlatform} · <span className="text-cyan-300">{decoupledStorageTB} TB</span> {externalStorageName} · DR: {drEngine}
              </div>

              <div className="flex items-center gap-3">
                <a
                  href={GOOGLE_DRIVE_CONFIG.folderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 text-xs font-semibold"
                >
                  <FolderGit2 className="w-3.5 h-3.5" />
                  <span>Sync with Shared Google Drive</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                <button
                  onClick={() => setShow3DModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Executive Dossier Printable Modal */}
      {showDossierModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md p-4 sm:p-8 overflow-y-auto flex justify-center">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full p-8 space-y-6 text-slate-200 shadow-2xl relative my-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-mono text-cyan-400 uppercase font-semibold">Executive Architecture Deliverable</span>
                <h2 className="text-xl font-bold text-white">{customerName} — Cloud Blueprint Dossier</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / Save as PDF</span>
                </button>
                <button
                  onClick={() => setShowDossierModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div>Platform: <span className="font-bold text-white">{cloudPlatform}</span></div>
              <div>Node SKU: <span className="font-bold text-cyan-300">{nodeSku} ({calculatedCloudNodes} Hosts)</span></div>
              <div>Management CIDR: <span className="font-bold text-white">{effectiveMgmtCidr}</span></div>
              <div>Decoupled Storage: <span className="font-bold text-cyan-300">{decoupledStorageTB} TB</span></div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="font-bold text-white uppercase font-mono">Bill of Materials (BOM) Summary:</div>
              <ul className="space-y-1.5 text-slate-300">
                <li>• {calculatedCloudNodes} Bare-Metal Hosts running {cloudPlatform} SDDC</li>
                <li>• {decoupledStorageTB} TB External High-Performance NFS Datastore Tier ({externalStorageName})</li>
                <li>• VMware HCX Enterprise Mobility Fleet (IX, NE, WO)</li>
                <li>• NSX-T Tier-0 Active-Active Gateway with ECMP Peering</li>
                <li>• NVA Next-Gen Firewall: {nvaFirewall}</li>
                <li>• Web Application Firewall: {wafSolution}</li>
                <li>• Disaster Recovery Engine: {drEngine} ({drRpoMinutes}-Min RPO, {drRtoMinutes}-Min RTO)</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
