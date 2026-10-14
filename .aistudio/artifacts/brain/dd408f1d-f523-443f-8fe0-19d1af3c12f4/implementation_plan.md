# Master UI Refactoring Plan: Enterprise Cloud Architecture Design Generator

Streamline `DesignGeneratorPage.tsx` and its wizard components into an intuitive 4-step sequential wizard, eliminate the interactive canvas in favor of an enhanced, parameter-rich static 4K vector blueprint engine, provide inline environment modification controls, and unify the final action center.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural and UX decisions were confirmed in Phase 1 clarification:
> - **Environment Modification**: Inline expander directly inside each environment card in Step 2, providing immediate, contextual editing of environment names, node counts, regions, CIDRs, and storage capacities without modal interruption.
> - **Wizard Navigation**: Clean top stepper tab bar showing numbered stages and progress states, paired with sticky bottom/top "Next" and "Previous" action buttons.
> - **4K Vector Blueprint Preview**: Dedicated high-fidelity blueprint tab/view accessible at any stage and prominently featured at the conclusion of Step 4.
> - **Strict Guardrails**: Zero changes to backend routes (`api/generate-blueprint.js`), calculation utilities, schemas, data keys, or persistence services.

---

## 1. Overview & Core Concept

- **What It Does**: Refactors the visual presentation layer of the Cloud Architecture Design Generator into a focused, production-grade 4-step wizard. Eliminates complex canvas drag-and-drop mechanics in favor of a crisp, publication-ready 4K static vector blueprint that captures all architectural parameters across on-premises, transit, security, and target hyperscaler tiers.
- **Target Audience**: Cloud Architects, Solutions Engineers, and Infrastructure Directors designing migration and modern SDDC topologies across VMware, Nutanix, AWS, Azure, and Google Cloud.
- **Key Value**: Drastically reduces cognitive load by separating Transit & Routing from Security & WAF, allows rapid in-place environment adjustments, and produces 4K vector blueprints and Excel BOMs with 100% parameter fidelity.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Step 1: Scope & Source Infrastructure**:
   - Customer metadata (Customer, Architect, Project Date).
   - Footprint scope (Private SDDC, Native Cloud, Hybrid Multi-Cloud).
   - Source hypervisor configuration (VMware Traditional vSphere vs. VCF 5.x/4.5, NSX versions, Aria Operations/vRNI/Automation suite, Nutanix AOS, Hyper-V).
   - Hardware vendor and server SKU selections.
   - Cluster sizing specifications with N+1 failure scenario buffer.

2. **Step 2: Transit & Routing**:
   - Landing zone patterns (Azure vWAN, AWS TGW, Google Cloud Shared VPC, Nutanix Flow Mesh).
   - Interconnect connectivity carrier (ExpressRoute, Direct Connect, Cloud Interconnect, IPsec VPN).
   - Dynamic Environments Manager: Active environment cards list displaying role, platform, region, CIDR, and host counts.
   - **New Modify Action**: Clicking "Modify" expands an inline editor within the card, allowing updates to name, region, host count, RAM, storage, and CIDR block, with real-time validation and instant recalculation.

3. **Step 3: Security & WAF**:
   - Dedicated security architecture view.
   - Firewall mode (Native Cloud Firewall, Third-Party NVA, Dual-Layer Inspection).
   - Firewall provider selection (Palo Alto Networks VM-Series, Fortinet FortiGate, Check Point CloudGuard, Cisco Secure).
   - Dual-layer inspection flow (Sequential, Zero-Trust Chaining, Asymmetric Specialized).
   - Web Application Firewall (WAF) enablement and solution selection (Cloud Native WAF, Cloudflare Magic WAN, F5 BIG-IP).

4. **Step 4: Target SDDC & Disaster Recovery**:
   - Hyperscaler target platform (Azure VMware Solution Gen 1/Gen 2, VMware Cloud on AWS, Google Cloud VMware Engine, Nutanix NC2 on Azure).
   - Certified target node SKUs and cluster capacity calculations.
   - Decoupled external storage tier attachment (ANF, FSx ONTAP, GCNV).
   - Progressive disclosure DR configuration (VMware SRM, Nutanix Leap, Zerto, Veeam, AWS Elastic Disaster Recovery) with RPO/RTO sliders.

5. **Final Action Center & 4K Blueprint Review**:
   - Featured at the bottom of Step 4 and accessible in the top header.
   - Actions: **Generate 3D Blueprint** (AI modal), **Save Design** (local/cloud), **Export JSON**, **Export BOM (.xlsx)**, and **Download 4K Blueprint (PNG/SVG)**.
   - High-fidelity 4K Vector Blueprint preview displaying 3-panel architecture layout with complete parameter coverage.

### Visual Identity & Theme Tokens
- **Backgrounds**: Slate-950 (`#020617`) canvas with Slate-900 (`#0f172a`) container panels and Slate-800 (`#1e293b`) hairline borders.
- **Accents**: Neon Cyan (`#06b6d4`), Emerald (`#10b981`), Sky (`#38bdf8`), and Indigo (`#6366f1`).
- **Typography**: Display headings in Plus Jakarta Sans, technical specifications and metrics in JetBrains Mono (`tabular-nums`).

---

## 3. Key Product Decisions & Architectural Changes

```
┌────────────────────────────────────────────────────────────────────────┐
│                   NEW 4-STEP WIZARD ARCHITECTURE                       │
├────────────────────┬────────────────────┬────────────────────┬─────────┴──────────┐
│  Step 1: Scope &   │  Step 2: Transit   │  Step 3: Security  │   Step 4: Target   │
│       Source       │     & Routing      │       & WAF        │     SDDC & DR      │
├────────────────────┼────────────────────┼────────────────────┼────────────────────┤
│ • Metadata         │ • Landing Zone     │ • Firewall Mode    │ • Hyperscaler SDDC │
│ • Footprint Scope  │ • Interconnect     │ • NVA Provider     │ • Node SKUs        │
│ • Hypervisor & VCF │ • Environments     │ • Dual-Layer Flow  │ • Decoupled Storage│
│ • Aria Suite       │   (Inline Edit     │ • WAF Engine       │ • DR Engine & SLAs │
│ • Hardware SKUs    │    & Remove)       │                    │ • Final Action Ctr │
└────────────────────┴────────────────────┴────────────────────┴────────────────────┘
                                   │
                                   ▼
         ┌─────────────────────────────────────────────────────┐
         │     DEDICATED 4K VECTOR BLUEPRINT VIEWPORT & EXPORT │
         ├─────────────────────────────────────────────────────┤
         │ • Panel 1: Source Hypervisor, VCF, Aria, Hardware   │
         │ • Panel 2: Transit Carrier, Dual FW, WAF, Landing   │
         │ • Panel 3: Target Platform, Node SKU, External NFS  │
         │ • Header: Architect, Customer, Track, DR RPO/RTO    │
         └─────────────────────────────────────────────────────┘
```

### A. Removal of Interactive Canvas
- **Action**: Completely eliminate the SVG coordinate grid, interactive drag-and-drop node boxes, connection pin handles, and mouse-drag event listeners (`handleCanvasMouseMove`, `handleCanvasMouseUp`, `canvasMode === 'interactive'`).
- **Benefit**: Removes ~800 lines of brittle canvas interaction code, eliminates layout recalculation lag, and removes viewport clipping bugs while retaining 100% of underlying topology state and data fidelity.

### B. Inline Environment Modifier in Step 2
- **Action**: Add an inline edit drawer/row within each active environment card (`EnvironmentNode`).
- **Fields Editable**: Name, Region, Node Count, Node SKU, Management CIDR Block, RAM allocation, and Storage capacity.
- **State Integrity**: Reuses existing `handleUpdateNodeSpec` handler. Ensures cascade link severing safety and CIDR validation remain intact.

### C. Splitting Step 2 into Transit & Routing (Step 2) and Security & WAF (Step 3)
- **Action**: Refactor the wizard steps into four distinct, logical stages:
  1. `Step1ScopeAndSource`: Preserved and enhanced.
  2. `Step2TransitAndRouting`: Focused on carrier connectivity, landing zones, and dynamic environment nodes with inline modification.
  3. `Step3SecurityAndWAF`: Dedicated security posture (Firewall mode, NVA vendor, dual-layer inspection pipeline, WAF).
  4. `Step4TargetAndDR`: Hyperscaler target selection, node SKUs, external datastores, and disaster recovery SLA planning.
- **Stepper Navigation**: Update `WizardStepTabs.tsx` to display the four distinct steps with progress checkmarks and active states.

### D. Enhanced Static 4K Vector Blueprint & Canvas Export
- **Action**: Expand `buildTrackVisualSpec` and `draw4KCanvas` to explicitly render all configured parameters:
  - Source Tier: Hypervisor platform, VCF version, vSphere release, Aria Suite modules, hardware vendor, and node SKU.
  - Transit Tier: Landing zone pattern, interconnect bandwidth/carrier, dual-firewall pipeline, and WAF solution.
  - Target Tier: Exact cloud platform, node SKU, host count, usable vCPU/RAM, external storage tier with TB capacity, and DR engine with RPO/RTO commitments.

---

## 4. Technical Implementation & Component Mapping

```
src/pages/tools/DesignGeneratorPage.tsx
 ├── WizardStepTabs (Step 1-4 Stepper & Track Selector)
 ├── Step 1: Step1ScopeAndSource
 ├── Step 2: Step2TransitAndRouting (Environments List + Inline Modifier)
 ├── Step 3: Step3SecurityAndWAF (Firewall Mode, NVA, Dual Chaining, WAF)
 ├── Step 4: Step4TargetAndDR (Hyperscaler SDDC, Node SKU, Decoupled Storage, DR)
 ├── Static4KBlueprintPreview (Dedicated 1280x720 vector SVG viewport with 4K export)
 └── FinalActionCenter (Generate 3D, Save Design, Export JSON, Export BOM)
```

### File Changes Checklist

1. **`src/components/wizard/WizardStepTabs.tsx`**:
   - Update step definitions to:
     - `1: Scope & Source`
     - `2: Transit & Routing`
     - `3: Security & WAF`
     - `4: Target SDDC & DR`
   - Add step preview tab toggle (`"Blueprint Preview"`).

2. **`src/components/wizard/Step2TransitAndRouting.tsx`** (Refactored from `Step2TransitAndSecurity.tsx`):
   - House Landing Zone patterns and Interconnect Carrier selection.
   - Render the active environments list.
   - For each environment: Render "Modify" button opening an inline expander card with live inputs for name, region, host count, RAM, storage, and CIDR.
   - Render "Remove" button with confirmation.
   - Provide "Add New Environment" action.

3. **`src/components/wizard/Step3SecurityAndWAF.tsx`** (Extracted dedicated security step):
   - House Firewall Architecture Mode (Native, NVA, Dual-Layer).
   - House NVA provider selection and Dual-Layer Inspection flow.
   - House WAF solution toggle and selection.

4. **`src/components/wizard/Step4TargetAndDR.tsx`** (Consolidated target SDDC & progressive DR):
   - House Hyperscaler Target Platform, Node SKU, Node Count, and Management CIDR.
   - House Decoupled external storage tier configuration.
   - House Disaster Recovery engine, RPO, RTO, and strategy.
   - Feature the prominent Final Action Center at the bottom.

5. **`src/pages/tools/DesignGeneratorPage.tsx`**:
   - Remove interactive canvas JSX, state variables, and mouse event listeners (`handleCanvasMouseMove`, `handleCanvasMouseUp`, `canvasMode`).
   - Wire the 4-step wizard state and step navigation buttons ("Previous", "Next", "Jump to Step").
   - Upgrade `buildTrackVisualSpec` and `draw4KCanvas` to include all enterprise parameters (Aria suite, hardware SKU, dual-firewall, WAF, external storage).
   - Retain all test-verified data models, Excel BOM exporter, AI blueprint modal triggers, and storage sync mechanisms.

---

## 5. Verification & Acceptance Criteria

- **Compilation & Type Safety**: Run `lint_applet` (`tsc --noEmit`) and `compile_applet` to confirm 0 build errors.
- **Regression Test Suites**: Execute existing test scripts:
  - `scripts/verify-data-integrity.ts` (18/18 tests pass).
  - `scripts/verify-wizard-calculations.ts` (49/49 tests pass).
  - `scripts/verify-workflow-integration.ts` (54/54 tests pass).
- **Functional Verification**:
  - Step navigation smoothly progresses across all 4 steps without clearing values.
  - Inline environment modify updates environment attributes in real-time.
  - Static 4K vector blueprint renders all configured parameters across all 9 enterprise tracks.
  - Final Action Center successfully triggers 3D Blueprint AI generation, Save Design, Export JSON, and Export Excel BOM (.xlsx).
