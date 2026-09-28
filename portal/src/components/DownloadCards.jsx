import React, { useState } from 'react';
import { Download, Laptop, Monitor, Check, Copy, ArrowUpRight, HardDrive, Shield, FileText, Sparkles } from 'lucide-react';

export default function DownloadCards({ release }) {
  const [copiedLink, setCopiedLink] = useState(null);

  const windows = release?.downloads?.windows || {};
  const mac = release?.downloads?.mac || {};

  const handleCopy = (url, key) => {
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopiedLink(key);
    setTimeout(() => setCopiedLink(null), 2500);
  };

  return (
    <section id="descargas" className="py-8 px-4 max-w-6xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* ===================== CARD WINDOWS ===================== */}
        <div className="relative group p-2 rounded-[2.5rem] bg-white/[0.03] border border-white/[0.08] hover:border-emerald-500/30 transition-all duration-500 shadow-2xl">
          <div className="p-7 sm:p-8 rounded-[calc(2.5rem-0.5rem)] bg-[#0e160e] flex flex-col justify-between h-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)] relative overflow-hidden">
            
            {/* Top ambient glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

            <div>
              {/* Header Badges */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/[0.05] border border-white/[0.1] flex items-center justify-center text-emerald-400 shadow-inner">
                    <Monitor className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                      Windows
                      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
                        {windows.arch || 'x64'}
                      </span>
                    </h2>
                    <p className="text-xs text-zinc-400">{windows.os_req || 'Windows 10 / 11'}</p>
                  </div>
                </div>

                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-zinc-800/80 text-zinc-300 border border-zinc-700/50">
                  {windows.size || '81 MB'}
                </span>
              </div>

              {/* Tag / Role badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium mb-6">
                <Shield className="w-3.5 h-3.5" />
                <span>{windows.role_badge || 'Apto Servidor Host LAN y Terminal'}</span>
              </div>

              {/* Technical summary */}
              <p className="text-sm text-zinc-300 mb-8 leading-relaxed">
                Versión recomendada para la PC fija de planta (Servidor Host de base de datos) o laptops operativas. Incluye servidor Express embebido y conexión a red local.
              </p>
            </div>

            {/* Actions & Buttons */}
            <div className="space-y-3 pt-4 border-t border-white/[0.06]">
              {/* Primary: Portable .exe */}
              <a
                href={windows.portable_url || '#'}
                download={windows.portable_name || 'Olivicola Lujan Trazabilidad 1.0.0.exe'}
                className="group/btn relative w-full flex items-center justify-between px-6 py-4 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-sm transition-all duration-300 active:scale-[0.98] shadow-lg shadow-emerald-500/20"
              >
                <div className="flex flex-col text-left">
                  <span>Descargar Versión Portable (.exe)</span>
                  <span className="text-[11px] font-normal text-emerald-950 opacity-80">Sin instalación previa · Doble clic y listo</span>
                </div>
                <div className="w-9 h-9 rounded-full bg-black/10 flex items-center justify-center group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform">
                  <Download className="w-4 h-4 text-black" />
                </div>
              </a>

              {/* Secondary: Installer Setup */}
              <div className="flex items-center justify-between pt-1 text-xs">
                <a
                  href={windows.setup_url || '#'}
                  download={windows.setup_name || 'Olivicola Lujan Trazabilidad Setup 1.0.0.exe'}
                  className="text-zinc-400 hover:text-emerald-400 flex items-center gap-1.5 transition-colors py-1 px-2 rounded-lg hover:bg-white/[0.03]"
                >
                  <HardDrive className="w-3.5 h-3.5 text-zinc-500" />
                  <span>O descargar Instalador Setup (.exe)</span>
                  <ArrowUpRight className="w-3 h-3 text-zinc-500" />
                </a>

                <button
                  onClick={() => handleCopy(windows.portable_url, 'win')}
                  className="text-zinc-500 hover:text-zinc-300 flex items-center gap-1 transition-colors px-2 py-1"
                  title="Copiar link de descarga directa"
                >
                  {copiedLink === 'win' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">¡Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar link</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* ===================== CARD MAC ===================== */}
        <div className="relative group p-2 rounded-[2.5rem] bg-white/[0.03] border border-white/[0.08] hover:border-emerald-500/30 transition-all duration-500 shadow-2xl">
          <div className="p-7 sm:p-8 rounded-[calc(2.5rem-0.5rem)] bg-[#0e160e] flex flex-col justify-between h-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)] relative overflow-hidden">
            
            {/* Top ambient glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

            <div>
              {/* Header Badges */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/[0.05] border border-white/[0.1] flex items-center justify-center text-emerald-400 shadow-inner">
                    <Laptop className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                      macOS
                      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
                        {mac.arch || 'Apple Silicon'}
                      </span>
                    </h2>
                    <p className="text-xs text-zinc-400">{mac.os_req || 'macOS 12.0 o superior'}</p>
                  </div>
                </div>

                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-zinc-800/80 text-zinc-300 border border-zinc-700/50">
                  {mac.size || '98 MB'}
                </span>
              </div>

              {/* Tag / Role badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-medium mb-6">
                <Shield className="w-3.5 h-3.5" />
                <span>{mac.role_badge || 'Terminal Cliente LAN & Auditoría'}</span>
              </div>

              {/* Technical summary */}
              <p className="text-sm text-zinc-300 mb-8 leading-relaxed">
                Diseñado para MacBooks de gerencia, inspectores de calidad y supervisores. Se conecta por Wi-Fi a la IP del Servidor Windows para sincronizar tambores e inventario.
              </p>
            </div>

            {/* Actions & Buttons */}
            <div className="space-y-3 pt-4 border-t border-white/[0.06]">
              {/* Primary: .dmg */}
              <a
                href={mac.dmg_url || '#'}
                download={mac.dmg_name || 'Olivicola Lujan Trazabilidad-1.0.0-arm64.dmg'}
                className="group/btn relative w-full flex items-center justify-between px-6 py-4 rounded-full bg-zinc-100 hover:bg-white text-black font-semibold text-sm transition-all duration-300 active:scale-[0.98] shadow-lg shadow-white/5"
              >
                <div className="flex flex-col text-left">
                  <span>Descargar Instalador (.dmg)</span>
                  <span className="text-[11px] font-normal text-zinc-600">Para MacBook Air, Pro, Mac Studio y Mac mini</span>
                </div>
                <div className="w-9 h-9 rounded-full bg-black/10 flex items-center justify-center group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform">
                  <Download className="w-4 h-4 text-black" />
                </div>
              </a>

              {/* Secondary: Zip package */}
              <div className="flex items-center justify-between pt-1 text-xs">
                <a
                  href={mac.zip_url || '#'}
                  download={mac.zip_name || 'Olivicola Lujan Trazabilidad-1.0.0-arm64-mac.zip'}
                  className="text-zinc-400 hover:text-white flex items-center gap-1.5 transition-colors py-1 px-2 rounded-lg hover:bg-white/[0.03]"
                >
                  <HardDrive className="w-3.5 h-3.5 text-zinc-500" />
                  <span>O descargar paquete .zip directo</span>
                  <ArrowUpRight className="w-3 h-3 text-zinc-500" />
                </a>

                <button
                  onClick={() => handleCopy(mac.dmg_url, 'mac')}
                  className="text-zinc-500 hover:text-zinc-300 flex items-center gap-1 transition-colors px-2 py-1"
                  title="Copiar link de descarga directa"
                >
                  {copiedLink === 'mac' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">¡Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar link</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* ===================== BANNER DE ARCHIVOS DE PRUEBA ===================== */}
      <div className="mt-8 p-1.5 rounded-3xl bg-white/[0.02] border border-white/[0.06]">
        <div className="p-6 rounded-[calc(1.5rem-0.25rem)] bg-[#0c120c] flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">Archivos Oficiales de Prueba y Evaluación</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-semibold">
                  15 Tambores Demo
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
                Descarga el conjunto de datos de prueba para importar en el software (Configuración → Restaurar Copia JSON) o el archivo de ráfaga para simular escaneos masivos del lector HPRT.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <a
              href="/datos-prueba-olivicola-lujan.json"
              download="datos-prueba-olivicola-lujan.json"
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-xs font-medium text-white transition-all active:scale-95 w-full sm:w-auto"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span>Descargar datos-prueba.json</span>
            </a>

            <a
              href="/lote-escaneo-prueba-hprt.txt"
              download="lote-escaneo-prueba-hprt.txt"
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-xs font-medium text-white transition-all active:scale-95 w-full sm:w-auto"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Descargar escaneo-hprt.txt</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
