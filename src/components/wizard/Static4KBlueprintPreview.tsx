import React, { useState } from 'react';
import {
  Download,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Layers,
  Sparkles,
  FileDown
} from 'lucide-react';
import { TrackVisualSpec } from '../../pages/tools/DesignGeneratorPage';

interface Static4KBlueprintPreviewProps {
  spec: TrackVisualSpec;
  architectName: string;
  projectDate: string;
  activeTemplate: string;
  drEngine: string;
  drRpoMinutes: number;
  onExport4K: (format: 'png' | 'jpeg') => void;
  className?: string;
  showControls?: boolean;
}

export const Static4KBlueprintPreview: React.FC<Static4KBlueprintPreviewProps> = ({
  spec,
  architectName,
  projectDate,
  activeTemplate,
  drEngine,
  drRpoMinutes,
  onExport4K,
  className = '',
  showControls = true
}) => {
  const [zoomScale, setZoomScale] = useState<number>(1.0);

  const rpoSummary = drRpoMinutes === 0 ? '0-min Sync (Zero Data Loss)' : `${drRpoMinutes}-min RPO`;

  return (
    <div className={`space-y-4 ${className}`}>
      {showControls && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="flex items-center gap-2.5">
            <Layers className="w-5 h-5 text-cyan-400" />
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Static 4K Vector Architecture Blueprint
              </h4>
              <p className="text-[11px] text-slate-400 font-mono">
                3840×2160 Ultra-HD Vector Layout · Full Parameter Capture
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Zoom Controls */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => setZoomScale((prev) => Math.max(0.6, Math.round((prev - 0.1) * 10) / 10))}
                className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 text-[11px] font-mono text-cyan-300 w-12 text-center">
                {Math.round(zoomScale * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoomScale((prev) => Math.min(1.8, Math.round((prev + 0.1) * 10) / 10))}
                className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setZoomScale(1.0)}
                className="px-1.5 py-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white text-[10px] font-mono cursor-pointer"
                title="Reset Zoom"
              >
                Reset
              </button>
            </div>

            {/* Export 4K PNG */}
            <button
              type="button"
              onClick={() => onExport4K('png')}
              className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow transition"
              title="Download full 3840x2160 resolution PNG"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export 4K PNG</span>
            </button>
          </div>
        </div>
      )}

      {/* Viewport Canvas Wrapper */}
      <div className="overflow-x-auto overflow-y-hidden border border-slate-800 rounded-xl bg-slate-950 p-2 sm:p-4 shadow-2xl">
        <div
          style={{
            transform: `scale(${zoomScale})`,
            transformOrigin: 'top left',
            transition: 'transform 0.15s ease-out',
            width: '1280px',
            height: '720px'
          }}
          className="relative bg-slate-950 border border-slate-800 rounded-lg overflow-hidden shadow-2xl select-none"
        >
          <svg viewBox="0 0 1280 720" className="w-full h-full select-none" xmlns="http://www.w3.org/2000/svg">
            {/* Grid Background */}
            <defs>
              <pattern id="diagGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.5" />
              </pattern>
              <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0f172a" />
                <stop offset="100%" stopColor="#1e293b" />
              </linearGradient>
            </defs>
            <rect width="1280" height="720" fill="#020617" />
            <rect width="1280" height="720" fill="url(#diagGrid)" opacity="0.6" />

            {/* Header Box */}
            <rect x="30" y="22" width="1220" height="68" rx="8" fill="url(#headerGrad)" stroke="#06b6d4" strokeWidth="1.5" />
            <text x="50" y="50" fill="#ffffff" fontSize="15" fontWeight="bold" fontFamily="Plus Jakarta Sans, sans-serif">
              {spec.title.toUpperCase()}
            </text>
            <text x="50" y="73" fill="#94a3b8" fontSize="11" fontFamily="JetBrains Mono, monospace">
              ARCHITECT: {architectName} · DATE: {projectDate} · TRACK: {activeTemplate.toUpperCase()} · DR ENGINE: {drEngine} ({rpoSummary})
            </text>

            {/* Panel 1 (Left: Source & On-Premises) */}
            <rect x="30" y="105" width="370" height="585" rx="10" fill="#0b1120" stroke="#334155" strokeWidth="1" />
            <rect x="30" y="105" width="370" height="36" rx="10" fill="#0f172a" stroke="#334155" strokeWidth="1" />
            <text x="50" y="128" fill="#06b6d4" fontSize="12" fontWeight="bold" fontFamily="Plus Jakarta Sans, sans-serif">
              {spec.panel1Header}
            </text>

            {/* Panel 1 Box 1 */}
            <rect x="45" y="152" width="340" height="155" rx="6" fill="#1e293b" stroke="#475569" strokeWidth="1" />
            <text x="60" y="177" fill="#ffffff" fontSize="11" fontWeight="bold" fontFamily="Plus Jakarta Sans, sans-serif">
              {spec.panel1Box1.title}
            </text>
            {spec.panel1Box1.bullets.map((b, i) => (
              <text key={i} x="60" y={202 + i * 21} fill="#cbd5e1" fontSize="10" fontFamily="JetBrains Mono, monospace">
                {b}
              </text>
            ))}

            {/* Panel 1 Box 2 */}
            <rect x="45" y="318" width="340" height="155" rx="6" fill="#1e293b" stroke="#475569" strokeWidth="1" />
            <text x="60" y="343" fill="#ffffff" fontSize="11" fontWeight="bold" fontFamily="Plus Jakarta Sans, sans-serif">
              {spec.panel1Box2.title}
            </text>
            {spec.panel1Box2.bullets.map((b, i) => (
              <text key={i} x="60" y={368 + i * 21} fill="#cbd5e1" fontSize="10" fontFamily="JetBrains Mono, monospace">
                {b}
              </text>
            ))}

            {/* Panel 1 Box 3 */}
            <rect x="45" y="484" width="340" height="190" rx="6" fill="#064e3b" fillOpacity="0.85" stroke="#10b981" strokeWidth="1" />
            <text x="60" y="509" fill="#34d399" fontSize="11" fontWeight="bold" fontFamily="Plus Jakarta Sans, sans-serif">
              {spec.panel1Box3.title}
            </text>
            {spec.panel1Box3.bullets.map((b, i) => (
              <text key={i} x="60" y={534 + i * 21} fill="#ffffff" fontSize="10" fontFamily="JetBrains Mono, monospace">
                {b}
              </text>
            ))}

            {/* Panel 2 (Center: Transit & Security) */}
            <rect x="425" y="105" width="375" height="585" rx="10" fill="#0b1120" stroke="#334155" strokeWidth="1" />
            <rect x="425" y="105" width="375" height="36" rx="10" fill="#0f172a" stroke="#334155" strokeWidth="1" />
            <text x="445" y="128" fill="#38bdf8" fontSize="12" fontWeight="bold" fontFamily="Plus Jakarta Sans, sans-serif">
              {spec.panel2Header}
            </text>

            {/* Panel 2 Box 1 */}
            <rect x="440" y="152" width="345" height="155" rx="6" fill="#1e293b" stroke="#475569" strokeWidth="1" />
            <text x="455" y="177" fill="#ffffff" fontSize="11" fontWeight="bold" fontFamily="Plus Jakarta Sans, sans-serif">
              {spec.panel2Box1.title}
            </text>
            {spec.panel2Box1.bullets.map((b, i) => (
              <text key={i} x="455" y={202 + i * 21} fill="#cbd5e1" fontSize="10" fontFamily="JetBrains Mono, monospace">
                {b}
              </text>
            ))}

            {/* Panel 2 Box 2 */}
            <rect x="440" y="318" width="345" height="155" rx="6" fill="#1e293b" stroke="#475569" strokeWidth="1" />
            <text x="455" y="343" fill="#ffffff" fontSize="11" fontWeight="bold" fontFamily="Plus Jakarta Sans, sans-serif">
              {spec.panel2Box2.title}
            </text>
            {spec.panel2Box2.bullets.map((b, i) => (
              <text key={i} x="455" y={368 + i * 21} fill="#cbd5e1" fontSize="10" fontFamily="JetBrains Mono, monospace">
                {b}
              </text>
            ))}

            {/* Panel 2 Box 3 */}
            <rect x="440" y="484" width="345" height="190" rx="6" fill="#581c87" fillOpacity="0.85" stroke="#a855f7" strokeWidth="1" />
            <text x="455" y="509" fill="#d8b4fe" fontSize="11" fontWeight="bold" fontFamily="Plus Jakarta Sans, sans-serif">
              {spec.panel2Box3.title}
            </text>
            {spec.panel2Box3.bullets.map((b, i) => (
              <text key={i} x="455" y={534 + i * 21} fill="#ffffff" fontSize="10" fontFamily="JetBrains Mono, monospace">
                {b}
              </text>
            ))}

            {/* Panel 3 (Right: Target SDDC & DR) */}
            <rect x="825" y="105" width="425" height="585" rx="10" fill="#0b1120" stroke="#334155" strokeWidth="1" />
            <rect x="825" y="105" width="425" height="36" rx="10" fill="#0f172a" stroke="#334155" strokeWidth="1" />
            <text x="845" y="128" fill="#10b981" fontSize="12" fontWeight="bold" fontFamily="Plus Jakarta Sans, sans-serif">
              {spec.panel3Header}
            </text>

            {/* Panel 3 Box 1 */}
            <rect x="840" y="152" width="395" height="155" rx="6" fill="#1e293b" stroke="#475569" strokeWidth="1" />
            <text x="855" y="177" fill="#ffffff" fontSize="11" fontWeight="bold" fontFamily="Plus Jakarta Sans, sans-serif">
              {spec.panel3Box1.title}
            </text>
            {spec.panel3Box1.bullets.map((b, i) => (
              <text key={i} x="855" y={202 + i * 21} fill="#cbd5e1" fontSize="10" fontFamily="JetBrains Mono, monospace">
                {b}
              </text>
            ))}

            {/* Panel 3 Box 2 */}
            <rect x="840" y="318" width="395" height="155" rx="6" fill="#1e293b" stroke="#475569" strokeWidth="1" />
            <text x="855" y="343" fill="#ffffff" fontSize="11" fontWeight="bold" fontFamily="Plus Jakarta Sans, sans-serif">
              {spec.panel3Box2.title}
            </text>
            {spec.panel3Box2.bullets.map((b, i) => (
              <text key={i} x="855" y={368 + i * 21} fill="#cbd5e1" fontSize="10" fontFamily="JetBrains Mono, monospace">
                {b}
              </text>
            ))}

            {/* Panel 3 Box 3 */}
            <rect x="840" y="484" width="395" height="190" rx="6" fill="#0c4a6e" fillOpacity="0.85" stroke="#0284c7" strokeWidth="1" />
            <text x="855" y="509" fill="#38bdf8" fontSize="11" fontWeight="bold" fontFamily="Plus Jakarta Sans, sans-serif">
              {spec.panel3Box3.title}
            </text>
            {spec.panel3Box3.bullets.map((b, i) => (
              <text key={i} x="855" y={534 + i * 21} fill="#ffffff" fontSize="10" fontFamily="JetBrains Mono, monospace">
                {b}
              </text>
            ))}

            {/* Interconnect Transit Arcs */}
            <path d="M 385 570 C 405 570, 415 230, 440 230" stroke="#06b6d4" strokeWidth="2.5" strokeDasharray="6,4" fill="none" opacity="0.85" />
            <path d="M 785 390 C 805 390, 815 390, 840 390" stroke="#10b981" strokeWidth="2.5" strokeDasharray="6,4" fill="none" opacity="0.85" />
          </svg>
        </div>
      </div>
    </div>
  );
};
