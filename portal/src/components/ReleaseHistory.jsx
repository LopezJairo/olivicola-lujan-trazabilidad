import React, { useState } from 'react';
import { Tag, Calendar, ChevronDown, ChevronUp, CheckCircle, Package } from 'lucide-react';

export default function ReleaseHistory({ releases = [] }) {
  const [expandedIndex, setExpandedIndex] = useState(0);

  const toggleExpand = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <section id="novedades" className="py-16 px-4 max-w-5xl mx-auto">
      <div className="mb-10 text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-zinc-300 text-xs font-medium mb-3">
          <Tag className="w-3.5 h-3.5 text-emerald-400" />
          <span>Historial de Actualizaciones</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Registro de Cambios y Versiones
        </h2>
        <p className="text-sm text-zinc-400 mt-2 max-w-xl mx-auto">
          Consulta las mejoras, correcciones y nuevas funcionalidades añadidas a cada versión del software.
        </p>
      </div>

      <div className="space-y-4">
        {releases.map((release, idx) => {
          const isExpanded = expandedIndex === idx;
          const isLatest = idx === 0;

          return (
            <div
              key={release.version || idx}
              className={`rounded-2xl border transition-all duration-300 ${
                isLatest
                  ? 'bg-[#0f1710]/90 border-emerald-500/30 shadow-lg shadow-emerald-950/20'
                  : 'bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12]'
              }`}
            >
              {/* Header row */}
              <button
                onClick={() => toggleExpand(idx)}
                className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-white">v{release.version}</span>
                    {isLatest && (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold">
                        Última versión
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-zinc-400 ml-2">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{release.date}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-zinc-400">
                  <span className="hidden sm:inline text-xs font-medium text-zinc-400">
                    {release.changelog?.length || 0} cambios
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-zinc-300" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-zinc-500" />
                  )}
                </div>
              </button>

              {/* Collapsible Content */}
              {isExpanded && (
                <div className="px-6 pb-6 pt-2 border-t border-white/[0.05] animate-fade-in">
                  <p className="text-sm text-zinc-300 mb-6 leading-relaxed">
                    {release.summary}
                  </p>

                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-4 flex items-center gap-2">
                    <Package className="w-3.5 h-3.5 text-emerald-400" />
                    Detalle de mejoras incluidas:
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                    {release.changelog?.map((item, cIdx) => (
                      <div
                        key={cIdx}
                        className="p-3.5 rounded-xl bg-black/20 border border-white/[0.04] flex items-start gap-3"
                      >
                        <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-xs font-semibold text-emerald-300 mr-2">
                            [{item.category || 'Mejora'}]
                          </span>
                          <span className="text-xs text-zinc-300 leading-normal">
                            {item.text}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Direct links footer for this version */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-white/[0.04] text-xs text-zinc-400">
                    <div>
                      Archivos verificados: <span className="text-zinc-200">Windows (.exe)</span> &bull; <span className="text-zinc-200">macOS (.dmg)</span>
                    </div>
                    <div className="flex items-center gap-4">
                      {release.downloads?.windows?.portable_url && (
                        <a
                          href={release.downloads.windows.portable_url}
                          download
                          className="text-emerald-400 hover:underline font-medium"
                        >
                          Descargar Windows v{release.version}
                        </a>
                      )}
                      {release.downloads?.mac?.dmg_url && (
                        <a
                          href={release.downloads.mac.dmg_url}
                          download
                          className="text-emerald-400 hover:underline font-medium"
                        >
                          Descargar Mac v{release.version}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
