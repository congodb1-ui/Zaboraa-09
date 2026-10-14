# Enterprise Cloud Infrastructure Architecture Designer — Production-Grade UI Refactor & Calculation Engine

**Definitive Architectural Specification (Revision 5 — Pre-Execution Approval)**  
Incorporates all Revision 4 approval conditions: official documentation source citations, explicit clearing of invalid selections without silent substitution, AVS Gen 2 Direct vNet vs. ExpressRoute distinction, legacy DR data preservation, heterogeneous host classes with multi-domain failure scenarios, edge-case test suites, and Stage 1 isolated execution protocol.

---

## 1. Verified Repository Inventory & Runtime Verification

### 1.1 Verified File Inventory & Script Commands

| Repository File / Command | Verified Status | Architectural Role & Boundaries |
| :--- | :--- | :--- |
| `src/pages/tools/DesignGeneratorPage.tsx` | 4,576 lines | **UI Refactor Target**: Transform into 4-step wizard while keeping 9 visual track renderers, live interactive canvas split, and export triggers intact. |
| `src/types/multiCloudBlueprint.ts` | 1,337 lines | **Authoritative State Schema**: Houses `DynamicTopologyModel`, `EnvironmentNode`, `InterconnectLink`, `hydrateFromLegacyStorage`, `writebackLegacyStorage`. |
| `src/components/icons/CloudArchitectureIcons.tsx` | 372 lines | **Official Vector SVGs**: Verified official vector assets. `VendorTextFallback` is explicitly labeled as an unmapped text emblem. |
| `src/utils/storageCalculator.ts` | 64 lines | Existing storage calculator for binary TiB vs decimal TB storage conversions. |
| `src/utils/migrationCalculator.ts` | 89 lines | Existing migration bandwidth and wave planning utility. |
| `scripts/verify-data-integrity.ts` | 305 lines | **Active Test Suite (18/18 Passing)**: Run via `npx tsx scripts/verify-data-integrity.ts`. |
| `scripts/verify-workflow-integration.ts` | 338 lines | **Active Test Suite (54/54 Passing)**: Run via `npx tsx scripts/verify-workflow-integration.ts`. |
| `scripts/test-hydration.js` | 92 lines | Legacy Node test script: Run via `node scripts/test-hydration.js`. |
| `package.json` | 44 lines | Verified scripts: `"dev"`, `"build"`, `"preview"`, `"clean"`, `"lint"` (`tsc --noEmit`). Tests execute via `npx tsx <script>`. |
| `api/generate-blueprint.js` | 113 lines | **PROTECTED BACKEND**: Serverless Gemini Imagen 3 handler. Do not modify. |
| `server.js` | 131 lines | **PROTECTED BACKEND**: Backend proxy route. Do not modify. |
| `src/services/firebaseAuth.ts` | 384 lines | **PROTECTED AUTH**: Firebase & Supabase authentication. Do not modify. |
| `src/services/supabaseClient.ts` | 28 lines | **PROTECTED DATA**: Supabase client initialization. Do not modify. |
| `src/services/storageService.ts` | 150 lines | **PROTECTED STORAGE**: Asset storage and cloud upload handlers. Do not modify. |

---

## 2. Official Documentation Citations & Verified Platform Catalogue

All parameters are grounded in official vendor documentation. Unverified values are tagged as `requires-verification`.

| Platform / SKU | Hardware & Compute Specs | Documented Cluster Node Limits & SLAs | Management CIDR Requirements | Official Documentation Citation & Verification Date |
| :--- | :--- | :--- | :--- | :--- |
| **Azure VMware Solution (AVS Gen 1)**: `AV36P` | Dual Intel Xeon Gold 6330 (36 Cores / 72 Threads), 768 GB RAM, 19.2 TB NVMe Raw | Min 3 nodes for 99.9% SLA (up to 16/cluster, 96/private cloud) | Strict `/22` non-overlapping RFC 1918 block | Microsoft Learn: *Azure VMware Solution Planning & Sizing* (`https://learn.microsoft.com/en-us/azure/azure-vmware/`) — Verified Oct 2026 |
| **Azure VMware Solution (AVS Gen 2)**: `AV64` | Dual Intel Xeon Platinum 8470C (64 Cores / 128 Threads), 1,024 GB RAM, 15.36 TB NVMe Raw | Min 3 nodes for production SLA; native Direct vNet routing | Strict `/22` non-overlapping RFC 1918 block | Microsoft Learn: *AVS AV64 Node Architecture & Direct vNet* (`https://learn.microsoft.com/en-us/azure/azure-vmware/architecture-av64`) — Verified Oct 2026 |
| **VMware Cloud on AWS (VMC)**: `i4i.metal` | Dual Intel Xeon Ice Lake 8375C (64 Cores / 128 Threads), 1,024 GB RAM, 30.0 TB NVMe Raw | Min 2 nodes for production 99.9% SLA; 1-node eval (30-day, non-SLA) | `/16` to `/26` supported (default `/20` or `/23`) | AWS Docs: *VMware Cloud on AWS Sizing & i4i Instances* (`https://docs.aws.amazon.com/vmware-cloud-on-aws/`) — Verified Oct 2026 |
| **Google Cloud VMware Engine (GCVE)**: `ve1-standard-72` | Dual Intel Xeon Gold 6240 (36 Cores / 72 Threads), 768 GB RAM, 19.2 TB NVMe Raw | Min 3 nodes for 99.99% multi-zone SLA (up to 32/cluster) | Dynamic: `/20` (64 nodes), `/21` (32 nodes), `/22` (16 nodes), `/23` (8 nodes) | Google Cloud: *GCVE IP Planning & Node Sizing* (`https://cloud.google.com/vmware-engine/docs/quickstart-networking-prerequisites`) — Verified Oct 2026 |
| **Google Cloud VMware Engine (GCVE)**: `ve2-standard-128` | Dual Intel Xeon Platinum 8470 (64 Cores / 128 Threads), 2,048 GB RAM, 32.0 TB NVMe Raw | Min 3 nodes for production SLA | Dynamic sizing matching cluster capacity | Google Cloud Release Notes: *GCVE ve2 Instances* (`https://cloud.google.com/vmware-engine/docs/release-notes`) — Verified Oct 2026 |
| **Nutanix NC2 on Azure**: `AN36P` | Dual Intel Xeon (36 Cores / 72 Threads), 768 GB RAM, 19.2 TB NVMe (Azure BareMetal) | Min 3 nodes for AHV cluster high availability | Native Azure vNet CIDR delegation (no overlay tax) | Nutanix Bible & Azure Marketplace: *NC2 on Azure Deployment Guide* (`https://portal.nutanix.com/page/documents/details?targetId=Nutanix-Cloud-Clusters-Azure:Nutanix-Cloud-Clusters-Azure`) — Verified Oct 2026 |

---

## 3. Centralized Compatibility Matrix & Explicit Incompatibility Policy

### 3.1 Network Architecture Distinction: AVS Gen 2 Direct vNet Routing vs. ExpressRoute Hybrid
* **Target Cloud Routing**: AVS Gen 2 employs **Direct vNet Routing**, placing the SDDC Tier-0 gateway directly into the customer Azure Virtual Network address space, eliminating ExpressRoute Gateway transit hops and hairpin latency for cloud-to-cloud traffic.
* **On-Premises Hybrid Connectivity**: ExpressRoute circuits with FastPath / Global Reach remain fully supported for connecting on-premises datacenters to Azure.
* **The UI Model**: Specifically models **Cloud Landing Zone Transit** (`Direct vNet Routing` for Gen 2 vs. `Hub-and-Spoke via ER Gateway` for Gen 1) separately from **On-Premises Interconnect** (`ExpressRoute FastPath`, `IPsec VPN`).

### 3.2 Non-Destructive Incompatibility Policy: Explicit Clearing & Reselection
* **Strict Rule**: When an upstream parameter change causes a downstream selection to become unsupported, the system will **NEVER silently substitute** an unselected alternative.
* **Mechanism**:
  1. The incompatible dependent selection is cleared (`null` / `requires-selection`).
  2. An actionable alert banner is displayed:  
     *e.g. "Azure Elastic SAN is incompatible with VMware Cloud on AWS and has been cleared. Please choose an authorized storage tier (e.g. Amazon FSx for NetApp ONTAP or Native All-Flash NVMe)."*
  3. Wizard progression to the next step is blocked until the architect explicitly confirms a valid replacement.
  4. The cleared/invalid value is immediately pruned from the active generation payload.

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 COMPATIBILITY MATRIX SPECIFICATION                                     │
├──────────────────────┬──────────────────────┬────────────────────────┬─────────────────────────────────┤
│ Source Hypervisor    │ Target Platform      │ Valid Storage Tiers    │ Valid DR / Replication Engines  │
├──────────────────────┼──────────────────────┼────────────────────────┼─────────────────────────────────┤
│ VMware vSphere       │ AVS Generation 1     │ • All-Flash NVMe Local │ • VMware SRM + vSphere Repl.   │
│ (vSphere 7.0u3 /     │ (ExpressRoute)       │ • Azure NetApp Files   │ • Zerto CDP                     │
│ 8.0u3, NSX 3.2/4.2)  │                      │   (ANF NFS Datastore)  │ • Veeam Backup & Replication    │
│                      │                      │                        │ • Cohesity CloudProtect         │
│                      │                      │                        │ • JetStream DR                  │
│                      │                      │                        │ • VMware HCX DR                 │
├──────────────────────┼──────────────────────┼────────────────────────┼─────────────────────────────────┤
│ VMware vSphere       │ AVS Generation 2     │ • All-Flash NVMe Local │ • VMware SRM + vSphere Repl.   │
│ (vSphere 8.0u3)      │ (Direct vNet Routing)│ • Azure NetApp Files   │ • Zerto CDP                     │
│                      │                      │ • Azure Elastic SAN    │ • Veeam Backup & Replication    │
├──────────────────────┼──────────────────────┼────────────────────────┼─────────────────────────────────┤
│ VMware vSphere / VCF │ VMware Cloud on AWS  │ • All-Flash NVMe Local │ • VMware SRM + vSphere Repl.   │
│ (VCF 4.5 / 5.1 / 5.2)│ (VMC on AWS)         │ • Amazon FSx for       │ • Zerto CDP                     │
│                      │                      │   NetApp ONTAP         │ • Veeam Backup & Replication    │
│                      │                      │                        │ • VMware HCX DR                 │
├──────────────────────┼──────────────────────┼────────────────────────┼─────────────────────────────────┤
│ VMware vSphere / VCF │ Google Cloud VMware  │ • All-Flash NVMe Local │ • VMware SRM + vSphere Repl.   │
│                      │ Engine (GCVE)        │ • Google Cloud NetApp  │ • Zerto CDP                     │
│                      │                      │   Volumes (GCNV)       │ • Veeam Backup & Replication    │
│                      │                      │                        │ • VMware HCX DR                 │
├──────────────────────┼──────────────────────┼────────────────────────┼─────────────────────────────────┤
│ Nutanix AOS / AHV    │ Nutanix NC2 on Azure │ • Nutanix DSF NVMe     │ • Nutanix Protection Domains    │
│ (AOS 6.5 / 6.8)      │                      │   Storage Pool         │   (NearSync & Metro)            │
│                      │                      │                        │ • Nutanix Leap Runbooks         │
│                      │                      │                        │ • Veeam for Nutanix AHV         │
├──────────────────────┼──────────────────────┼────────────────────────┼─────────────────────────────────┤
│ Microsoft Hyper-V    │ Native Azure / AWS / │ • Storage Spaces Direct│ • Azure Site Recovery (ASR)     │
│ (2019 / 2022 WSFC)   │ GCP IaaS VMs         │ • SMB 3.0 / iSCSI SAN  │ • Veeam Backup & Replication    │
│                      │                      │                        │ • Zerto for Hyper-V             │
├──────────────────────┼──────────────────────┼────────────────────────┼─────────────────────────────────┤
│ Bare-Metal Co-Lo     │ Any Cloud SDDC or    │ • Enterprise FC SAN    │ • Agent-based replication       │
│                      │ Native Cloud         │ • iSCSI SAN            │ • Veeam Agent                   │
└──────────────────────┴──────────────────────┴────────────────────────┴─────────────────────────────────┘
```

---

## 4. Heterogeneous Sizing & Multi-Domain N+1 Calculations

All calculation routines will be implemented in `src/utils/architectureCalculator.ts` and `src/utils/cidrUtils.ts`.

### 4.1 Heterogeneous Host Classes & Clusters
Each cluster $k$ is calculated independently without cross-cluster averaging:
$$\text{Installed Physical Cores}_k = \text{Hosts}_k \times \text{Sockets}_k \times \text{CoresPerSocket}_k$$
$$\text{Installed Logical Processors}_k = \text{Installed Physical Cores}_k \times (\text{Hyperthreading}_k \mathbin{?} 2 : 1)$$
$$\text{Installed RAM}_k = \text{Hosts}_k \times \text{RAM per Host}_k$$
$$\text{Installed Raw Storage}_k = \text{Hosts}_k \times \text{Raw Storage per Host}_k$$

### 4.2 Configurable Engineering Assumptions (Zero Hidden Defaults)
* **Max vCPU:pCore Oversubscription**: Configurable (Default: `2.5:1`, Range: `1.0:1` to `6.0:1`).
* **Hypervisor RAM Overhead**: Configurable (Default: `8.0%`, Range: `5.0%` to `15.0%`). Deducted once from host RAM.
* **Hypervisor CPU Reservation**: Configurable (Default: `10.0%`, Range: `5.0%` to `20.0%`).
* **Storage Protection Factor**: Configurable (`RAID-1/Mirror = 2.0x`, `RAID-5/EC = 1.33x`, `RAID-6/EC = 1.50x`).
* **Storage Slack Space**: Configurable (Default: `20.0%`).
* **Storage Efficiency Factor**: Configurable (Default: `1.0x` unassumed; values $> 1.0x$ require explicit user confirmation).
* **Double-Counting Protection**: Overhead, failure reserves, growth headroom, and storage slack space are modeled as independent deductions.

### 4.3 Explicit Multi-Domain Failure Scenarios
The architect can simulate explicit failure events:
* **Scenario A**: $N+1$ single host failure per cluster.
* **Scenario B**: $N+2$ dual host failure in primary mission-critical cluster.
* **Scenario C**: Rack / Failure domain failure (e.g. 4 nodes lost simultaneously).

$$\text{Surviving Hosts}_k = \text{Hosts}_k - \text{FailedHosts}_k$$
$$\text{Surviving Cores}_k = \text{Surviving Hosts}_k \times \text{Sockets}_k \times \text{CoresPerSocket}_k$$
$$\text{Surviving Usable RAM}_k = \left(\text{Surviving Hosts}_k \times \text{RAM per Host}_k\right) \times (1 - \text{HypervisorRamOverhead})$$
$$\text{Surviving Usable Storage}_k = \frac{\left(\text{Surviving Hosts}_k \times \text{Raw Storage}_k\right) \times (1 - \text{SlackSpace}) \times \text{EfficiencyRatio}}{\text{ProtectionFactor}}$$

**Headroom Verification**:
$$\Delta \text{CPU}_k = (\text{Surviving Cores}_k \times \text{MaxOversubscription}) - \text{Workload vCPU}_k$$
$$\Delta \text{RAM}_k = \text{Surviving Usable RAM}_k - \text{Workload RAM}_k$$
$$\Delta \text{Storage}_k = \text{Surviving Usable Storage}_k - \text{Workload Storage}_k$$

---

## 5. Legacy Storage Round-Trip & Inactive DR Payload Pruning

### 5.1 Legacy Storage Round-Trip Protection
* **Hydration**: When `hydrateFromLegacyStorage()` executes on page load, all custom and unrepresented fields in `zaboraa_4k_blueprint_state`, `zaboraa_dr_export`, and `zaboraa_sizing_export` are stored in `preservedLegacyFields`.
* **Writeback**: When the user explicitly clicks **Save Blueprint** or triggers an export, `writebackLegacyStorage()` merges the active wizard parameters back into the legacy storage keys while preserving untouched fields.
* **DR Inactive Handling**: When the user sets `drEnabled: false`:
  1. The legacy DR data is preserved in storage so re-enabling DR restores the previous settings.
  2. The active generation payload passed to `buildIsometricDiagramPrompt()` excludes all DR metrics, replacing them with `"Business Continuity: DR not in scope for current architecture tier"`, preserving the prompt builder string contract without emitting phantom DR numbers.

---

## 6. Official Icon Provenance & Fallback Attribution

* **Official Azure Assets**: `AzureVirtualDesktopIcon`, `AzureNetAppFilesIcon`, `AzureFirewallIcon`, `AzureExpressRouteIcon`, `AzureVirtualWanIcon` — Vector SVG assets matching Microsoft Azure architecture icon specs.
* **Official AWS Assets**: `AwsTransitGatewayIcon`, `AwsFsxOntapIcon` — Vector SVG assets matching AWS architecture icon specs.
* **Official Google Cloud Assets**: `GcpInterconnectIcon`, `GcpNetAppVolumesIcon` — Vector SVG assets matching Google Cloud product icon specs.
* **Official VMware Assets**: `VmwareVcenterIcon`, `VmwareHcxIcon` — Vector SVG assets matching VMware Cloud Foundation brand specs.
* **Official Nutanix Assets**: `NutanixPrismIcon`, `NutanixAhvIcon`, `NutanixMoveIcon` — Vector SVG assets matching Nutanix brand portal specs.
* **Third-Party NVAs**: `PaloAltoNetworksNvaIcon`, `FortinetFortiGateNvaIcon` — Vector SVG assets featuring high-contrast `NVA` text badges.
* **Fallback Asset Attribution**: For unmapped products, `VendorTextFallback` renders an official-colored typographic emblem labeled explicitly as:  
  `Text Emblem Fallback (Unmapped Asset)` — never presented as an official vector logo.

---

## 7. Staged Implementation Sequence & Verification Checkpoints

```
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ STAGE 1: Pure Calculation & CIDR Utilities (ISOLATED FIRST STEP)                            │
│ Files to create:                                                                             │
│ • src/utils/architectureCalculator.ts (heterogeneous cluster math, N+1, storage, bandwidth) │
│ • src/utils/cidrUtils.ts (integer IPv4 bitwise, cloud reserved IPs, collision detection)     │
│ Test suite to create:                                                                        │
│ • scripts/verify-wizard-calculations.ts                                                      │
│ Verification Checkpoint: Run `npx tsx scripts/verify-wizard-calculations.ts`                 │
│ STOP & REPORT: Report files changed, test results, and verified formulas before Stage 2.     │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
                                               │
                                               ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ STAGE 2: Compatibility Catalogue & State Adapter                                             │
│ Files to create:                                                                             │
│ • src/data/cloudCompatibilityCatalogue.ts (official SKUs, CIDR rules, disabled explanations) │
│ • src/types/wizardStateAdapter.ts (bidirectional mapping, unrepresented field retention)     │
│ Verification Checkpoint: Expand verify-wizard-calculations.ts to test round-trip retention  │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
                                               │
                                               ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ STAGE 3: Four-Step Wizard UI Refactor in DesignGeneratorPage.tsx                            │
│ Modifications:                                                                               │
│ • Refactor form layout into 4 steps: Scope & Source, Transit & Security, Target, DR & Review │
│ • Implement progressive disclosure and dynamic option filtering with disabled explanations   │
│ • Connect configurable assumptions drawer (oversubscription, overhead, storage slack space)  │
│ • Preserve right-column split view with 9-track renderers and live interactive canvas        │
│ Verification Checkpoint: Run verify-data-integrity.ts & verify-workflow-integration.ts       │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
                                               │
                                               ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ STAGE 4: Automated Verification, Build & Export Regression Audit                             │
│ Final verification commands:                                                                 │
│ 1. `npx tsx scripts/verify-wizard-calculations.ts` (All new calculation/adapter tests pass) │
│ 2. `npx tsx scripts/verify-data-integrity.ts` (All 18 regression tests pass)                 │
│ 3. `npx tsx scripts/verify-workflow-integration.ts` (All 54 visual track tests pass)         │
│ 4. `npm run lint` (`tsc --noEmit`) (Zero TypeScript errors)                                  │
│ 5. `npm run build` (`vite build`) (Clean production compilation)                             │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 8. Test Strategy & Acceptance Criteria

### Automated Test Specifications (`scripts/verify-wizard-calculations.ts`)
1. **Dynamic Option Filtering & Explanations**: Verifies that selecting `AVS Gen 2` disables legacy ExpressRoute options and presents the correct explanation.
2. **Cascading Clearing Without Silent Substitution**: Verifies that changing target from `AVS` to `VMC` clears incompatible storage (`ANF`), renders the explanation banner, and blocks progression until a supported storage tier (`FSx ONTAP` or `NVMe`) is chosen.
3. **Payload Exclusion on Inactive Fields**: Verifies that when `drEnabled: false`, zero DR numbers appear in the active generation payload or prompt builder string.
4. **Physical Cores vs. Threads**: Verifies that hyperthreading does not inflate physical core capacity.
5. **Heterogeneous Cluster Calculations**: Verifies independent calculations across multiple distinct host classes.
6. **Configurable N+1 Failure Validation**: Verifies surviving CPU, RAM, and Storage headroom across multi-domain failure scenarios.
7. **Cloud Reserved IP Deductions**: Verifies Azure/AWS 5-IP and GCP 4-IP deductions across various prefix lengths.
8. **CIDR Overlap Detection**: Verifies bitwise interval intersection detection for overlapping ranges.
9. **Round-Trip Legacy Blueprint Stability**: Verifies that loading, mutating, and writing back a legacy JSON blueprint retains all custom and unrepresented legacy fields.
10. **Regression Gate**: Existing regression test suites (`verify-data-integrity.ts` and `verify-workflow-integration.ts`) must continue to achieve 100% pass rates.
