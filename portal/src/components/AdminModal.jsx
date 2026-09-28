import React, { useState } from 'react';
import { X, Plus, Save, Copy, Download, Sparkles, Check, HelpCircle, FileText, ArrowRight } from 'lucide-react';

export default function AdminModal({ isOpen, onClose, versionsData, onSaveVersions }) {
  if (!isOpen) return null;

  const currentLatest = versionsData?.releases?.[0] || {};
  
  const [version, setVersion] = useState(currentLatest.version || '1.0.1');
  const [date, setDate] = useState(new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }));
  const [tag, setTag] = useState('Estable · Recomendada');
  const [summary, setSummary] = useState(currentLatest.summary || '');
  
  // Windows links
  const [winPortableUrl, setWinPortableUrl] = useState(currentLatest.downloads?.windows?.portable_url || '');
  const [winSetupUrl, setWinSetupUrl] = useState(currentLatest.downloads?.windows?.setup_url || '');
  const [winSize, setWinSize] = useState(currentLatest.downloads?.windows?.size || '81 MB');
  
  // Mac links
  const [macDmgUrl, setMacDmgUrl] = useState(currentLatest.downloads?.mac?.dmg_url || '');
  const [macZipUrl, setMacZipUrl] = useState(currentLatest.downloads?.mac?.zip_url || '');
  const [macSize, setMacSize] = useState(currentLatest.downloads?.mac?.size || '98 MB');
  
  // Changelog lines
  const [changelogRaw, setChangelogRaw] = useState(
    currentLatest.changelog
      ? currentLatest.changelog.map(c => `${c.category}: ${c.text}`).join('\n')
      : 'General: Actualización y corrección de errores.'
  );

  const [copiedJson, setCopiedJson] = useState(false);
  const [successSaved, setSuccessSaved] = useState(false);

  const buildNewCatalog = () => {
    const changelog = changelogRaw
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean)
      .map(line => {
        const parts = line.split(':');
        if (parts.length > 1) {
          return { category: parts[0].trim(), text: parts.slice(1).join(':').trim() };
        }
        return { category: 'Mejora', text: line };
      });

    const newRelease = {
      version: version.trim(),
      date: date.trim(),
      tag: tag.trim(),
      status: 'latest',
      summary: summary.trim(),
      downloads: {
        windows: {
          available: true,
          name: 'Windows x64',
          arch: '64-bit (x86_64)',
          os_req: 'Windows 10 / 11',
          size: winSize.trim() || '81 MB',
          portable_name: `Olivicola Lujan Trazabilidad ${version.trim()}.exe`,
          portable_url: winPortableUrl.trim(),
          setup_name: `Olivicola Lujan Trazabilidad Setup ${version.trim()}.exe`,
          setup_url: winSetupUrl.trim(),
          role_badge: 'Recomendado para Servidor Host o Cliente'
        },
        mac: {
          available: true,
          name: 'macOS',
          arch: 'Apple Silicon (ARM64)',
          os_req: 'macOS 12.0+',
          size: macSize.trim() || '98 MB',
          dmg_name: `Olivicola Lujan Trazabilidad-${version.trim()}-arm64.dmg`,
          dmg_url: macDmgUrl.trim(),
          zip_name: `Olivicola Lujan Trazabilidad-${version.trim()}-arm64-mac.zip`,
          zip_url: macZipUrl.trim(),
          role_badge: 'Terminal Cliente LAN o Administración'
        }
      },
      changelog
    };

    // Filter out previous latest flag and append
    const oldReleases = (versionsData?.releases || []).map(r => ({ ...r, status: 'previous' }));
    
    return {
      ...versionsData,
      latest_version: version.trim(),
      updated_at: new Date().toISOString().split('T')[0],
      releases: [newRelease, ...oldReleases]
    };
  };

  const handleApplyLocally = () => {
    const updated = buildNewCatalog();
    onSaveVersions(updated);
    setSuccessSaved(true);
    setTimeout(() => setSuccessSaved(false), 3000);
  };

  const handleCopyJson = () => {
    const updated = buildNewCatalog();
    navigator.clipboard.writeText(JSON.stringify(updated, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 3000);
  };

  const handleDownloadJson = () => {
    const updated = buildNewCatalog();
    const blob = new Blob([JSON.stringify(updated, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'versions.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[#0e160e] border border-white/10 shadow-2xl p-6 sm:p-8">
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-zinc-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Gestor de Nuevas Versiones</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">Publicar o Modificar Versión</h2>
          <p className="text-xs text-zinc-400 mt-1">
            Modifica los enlaces y la información que verá la empresa. Puedes copiar el archivo generado para que el asistente lo actualice en Vercel, o guardar los cambios para probarlos al instante.
          </p>
        </div>

        {/* Form Grid */}
        <div className="space-y-5 text-xs text-zinc-300">
          
          {/* Version & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-medium text-zinc-300 mb-1">Número de Versión</label>
              <input
                type="text"
                value={version}
                onChange={e => setVersion(e.target.value)}
                placeholder="Ej: 1.0.1"
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-medium text-zinc-300 mb-1">Fecha de Lanzamiento</label>
              <input
                type="text"
                value={date}
                onChange={e => setDate(e.target.value)}
                placeholder="Ej: 29 de Septiembre, 2026"
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-medium text-zinc-300 mb-1">Etiqueta de Estado</label>
              <input
                type="text"
                value={tag}
                onChange={e => setTag(e.target.value)}
                placeholder="Estable · Recomendada"
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Summary */}
          <div>
            <label className="block font-medium text-zinc-300 mb-1">Resumen del Lanzamiento</label>
            <textarea
              rows={2}
              value={summary}
              onChange={e => setSummary(e.target.value)}
              placeholder="Breve descripción para los operarios y gerencia..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Section: Windows Links */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-white flex items-center gap-2">
                <span>Enlaces para Windows</span>
                <span className="text-[10px] text-zinc-400 font-normal">(Google Drive, GitHub Releases, OneDrive, etc.)</span>
              </h4>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-zinc-400">Peso:</span>
                <input
                  type="text"
                  value={winSize}
                  onChange={e => setWinSize(e.target.value)}
                  className="w-16 px-2 py-1 rounded bg-black/40 border border-white/10 text-center text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-zinc-400 mb-1 text-[11px]">Enlace de Descarga: Versión Portable (.exe)</label>
              <input
                type="text"
                value={winPortableUrl}
                onChange={e => setWinPortableUrl(e.target.value)}
                placeholder="https://.../Olivicola Lujan Trazabilidad 1.0.0.exe"
                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white font-mono text-[11px] focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-zinc-400 mb-1 text-[11px]">Enlace de Descarga: Instalador Setup (.exe) (Opcional)</label>
              <input
                type="text"
                value={winSetupUrl}
                onChange={e => setWinSetupUrl(e.target.value)}
                placeholder="https://.../Olivicola Lujan Trazabilidad Setup 1.0.0.exe"
                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white font-mono text-[11px] focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Section: Mac Links */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-white flex items-center gap-2">
                <span>Enlaces para macOS</span>
                <span className="text-[10px] text-zinc-400 font-normal">(Apple Silicon / Intel)</span>
              </h4>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-zinc-400">Peso:</span>
                <input
                  type="text"
                  value={macSize}
                  onChange={e => setMacSize(e.target.value)}
                  className="w-16 px-2 py-1 rounded bg-black/40 border border-white/10 text-center text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-zinc-400 mb-1 text-[11px]">Enlace de Descarga: Imagen (.dmg)</label>
              <input
                type="text"
                value={macDmgUrl}
                onChange={e => setMacDmgUrl(e.target.value)}
                placeholder="https://.../Olivicola Lujan Trazabilidad-1.0.0-arm64.dmg"
                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white font-mono text-[11px] focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-zinc-400 mb-1 text-[11px]">Enlace de Descarga: Paquete .zip (Opcional)</label>
              <input
                type="text"
                value={macZipUrl}
                onChange={e => setMacZipUrl(e.target.value)}
                placeholder="https://.../Olivicola Lujan Trazabilidad-1.0.0-arm64-mac.zip"
                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white font-mono text-[11px] focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Changelog raw */}
          <div>
            <label className="block font-medium text-zinc-300 mb-1">
              Lista de Mejoras y Novedades (Formato: Categoria: Descripción)
            </label>
            <textarea
              rows={4}
              value={changelogRaw}
              onChange={e => setChangelogRaw(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/10 text-white font-mono text-[11px] focus:border-emerald-500 focus:outline-none"
            />
          </div>

        </div>

        {/* Modal Actions */}
        <div className="mt-6 pt-5 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyJson}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 text-xs font-medium transition-colors"
            >
              {copiedJson ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">¡JSON Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar JSON</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownloadJson}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 text-xs font-medium transition-colors"
              title="Descargar versions.json listo para reemplazar en el portal"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar versions.json</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-full text-xs font-medium text-zinc-400 hover:text-white transition-colors"
            >
              Cerrar
            </button>

            <button
              onClick={handleApplyLocally}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
            >
              {successSaved ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>¡Aplicado con Éxito!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Aplicar en la Web Ahora</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
