import fs from 'fs';
import path from 'path';

const filePath = path.resolve('src/pages/tools/DesignGeneratorPage.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const startMarker = '{/* Architecture Design Track Selector (9 Enterprise Tracks with Category Filters) */}';
const endMarker = '{/* Google Drive Workspace Bridge */}';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
  console.error('Markers not found! startIndex:', startIndex, 'endIndex:', endIndex);
  process.exit(1);
}

// Find the indentation before startMarker
const lineStart = content.lastIndexOf('\n', startIndex) + 1;

const replacement = `      {/* Streamlined 4-Step Architecture Navigation Stepper & 1-Click Templates */}
      <WizardStepTabs
        currentStep={currentStep}
        onSelectStep={(s) => {
          setCurrentStep(s);
          setLayoutMode('form-only');
        }}
        wizardState={wizardState}
        onApplyTemplate={handleApplyIndustryTemplate}
        layoutMode={layoutMode}
        onToggleLayoutMode={(m) => setLayoutMode(m)}
        isCidrValid={sddcCidrValid}
        isCompatibilityValid={isCrossTierCompatible}
      />

      {/* Main Wizard & Blueprint Viewport Layer */}
      {layoutMode === 'preview' ? (
        <Static4KBlueprintPreview
          spec={vectorSpec}
          architectName={architectName}
          projectDate={projectDate}
          activeTemplate={activeTemplate}
          drEngine={drEngine}
          drRpoMinutes={drRpoMinutes}
          onExport4K={handleExport4K}
        />
      ) : (
        <div className="space-y-6">
          {currentStep === 1 && (
            <Step1ScopeAndSource
              wizardState={wizardState}
              onChange={handleWizardStateChange}
              onNext={() => setCurrentStep(2)}
            />
          )}

          {currentStep === 2 && (
            <Step2TransitAndRouting
              wizardState={wizardState}
              onChange={handleWizardStateChange}
              environments={topologyEnvironments}
              onUpdateEnvironment={handleUpdateNodeSpec}
              onRemoveEnvironment={promptRemoveEnvironment}
              onOpenAddEnvModal={() => setShowAddEnvModal(true)}
              onNext={() => setCurrentStep(3)}
              onPrev={() => setCurrentStep(1)}
            />
          )}

          {currentStep === 3 && (
            <Step3SecurityAndWAF
              wizardState={wizardState}
              onChange={handleWizardStateChange}
              onNext={() => setCurrentStep(4)}
              onPrev={() => setCurrentStep(2)}
            />
          )}

          {currentStep === 4 && (
            <Step4TargetAndDR
              wizardState={wizardState}
              onChange={handleWizardStateChange}
              onPrev={() => setCurrentStep(3)}
              onGenerateAI={() => setShowPreFlightModal(true)}
              onSaveBlueprint={handlePersistLegacyState}
              onExportJson={handleExportBlueprintJSON}
              onExportExcel={handleExportBOMExcel}
              onExport4K={() => handleExport4K('png')}
              onOpenDossier={() => setShowDossierModal(true)}
              blueprintPreviewNode={
                <Static4KBlueprintPreview
                  spec={vectorSpec}
                  architectName={architectName}
                  projectDate={projectDate}
                  activeTemplate={activeTemplate}
                  drEngine={drEngine}
                  drRpoMinutes={drRpoMinutes}
                  onExport4K={handleExport4K}
                  showControls={false}
                />
              }
            />
          )}
        </div>
      )}

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
                  className={\`w-full px-3 py-2 bg-slate-950 border rounded-lg text-slate-200 text-xs focus:outline-none transition \${
                    isEnvNameDuplicate
                      ? 'border-rose-500 focus:border-rose-400'
                      : isEnvNameEmpty
                      ? 'border-slate-800 focus:border-cyan-500'
                      : 'border-emerald-500/60 focus:border-emerald-400'
                  }\`}
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
                    <label className="text-slate-300 font-medium">Node / Host Count</label>
                    <span className="text-[10px] font-mono text-cyan-400">
                      {newEnvHosts === 0 ? 'Serverless' : \`\${newEnvHosts} Nodes\`}
                    </span>
                  </div>
                  <input
                    type="number"
                    min={newEnvPlatform === 'AWS Native' || newEnvPlatform === 'GCP Native' ? 0 : 1}
                    max={128}
                    value={newEnvHosts}
                    onChange={e => setNewEnvHosts(Number(e.target.value))}
                    className={\`w-full px-3 py-2 bg-slate-950 border rounded-lg text-slate-200 text-xs font-mono \${
                      isHostCountValid ? 'border-slate-800' : 'border-rose-500'
                    }\`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">Storage Capacity (TB)</label>
                  <input
                    type="number"
                    min={1}
                    max={2000}
                    value={newEnvStorageTB}
                    onChange={e => setNewEnvStorageTB(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">Management CIDR Block</label>
                  <input
                    type="text"
                    placeholder="10.240.0.0/22"
                    value={newEnvCidr}
                    onChange={e => setNewEnvCidr(e.target.value)}
                    className={\`w-full px-3 py-2 bg-slate-950 border rounded-lg text-slate-200 text-xs font-mono \${
                      isCidrFormatInvalid ? 'border-rose-500' : 'border-slate-800'
                    }\`}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddEnvModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!isAddEnvFormValid}
                onClick={handleAddEnvironment}
                className={\`px-5 py-2 rounded-xl text-slate-950 text-xs font-bold transition flex items-center gap-1.5 shadow-md \${
                  isAddEnvFormValid
                    ? 'bg-cyan-500 hover:bg-cyan-400 cursor-pointer shadow-cyan-500/20'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }\`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Environment</span>
              </button>
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

`;

content = content.slice(0, lineStart) + replacement + content.slice(endIndex);
fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully refactored DesignGeneratorPage.tsx with 4-Step Wizard!');
