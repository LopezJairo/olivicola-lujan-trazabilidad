import React, { useMemo, useState } from 'react';
import {
  Printer,
  Download,
  X,
  FileText,
  Building2,
  CheckCircle2,
  Layers,
  Scale,
  Calendar,
  Clock,
  Sparkles,
  Shield,
} from 'lucide-react';
import { Button } from './ui/button.jsx';
import { Badge } from './ui/badge.jsx';
import { generateExecutiveReportData, printExecutiveReport } from '../lib/reportGenerator.js';

export function ExecutiveReportModal({ isOpen, onClose, db, user }) {
  const [printing, setPrinting] = useState(false);

  const reportData = useMemo(() => {
    if (!isOpen) return null;
    const { tambores = [], catalogos = [], movimientos = [], historial = [] } = db || {};
    return generateExecutiveReportData({
      tambores,
      catalogos,
      movimientos,
      historial,
      user,
    });
  }, [isOpen, db, user]);

  if (!isOpen || !reportData) return null;

  const { metadata, kpis, productBreakdown, varietyBreakdown, caliberBreakdown, locationBreakdown, recentDrums } =
    reportData;

  const handlePrint = () => {
    setPrinting(true);
    const ok = printExecutiveReport(reportData);
    setTimeout(() => {
      setPrinting(false);
    }, 1500);
  };

  const formatNumber = (num) => new Intl.NumberFormat('es-AR').format(num);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-obsidian/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-bone-300 shadow-2xl max-w-5xl w-full max-h-[94vh] flex flex-col overflow-hidden">
        {/* ---------------- CABECERA DE LA VENTANA MODAL ---------------- */}
        <div className="px-5 py-3.5 sm:px-6 sm:py-4 border-b border-bone-200 bg-bone-50/80 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-olive-900 text-bone-50 flex items-center justify-center shrink-0 shadow-soft-xs">
              <FileText className="w-5 h-5 text-olive-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-lg sm:text-xl font-bold text-obsidian">
                  Informe Ejecutivo de Planta & Trazabilidad
                </h3>
                <Badge variant="paleGreen" className="text-[10px] uppercase font-mono tracking-wider">
                  En Vivo
                </Badge>
              </div>
              <p className="text-xs text-bone-600">
                Consolidado en tiempo real · Formato estándar A4 vertical · Listo para imprimir o guardar como PDF
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handlePrint}
              disabled={printing}
              className="text-xs font-semibold flex items-center gap-1.5 shadow-soft-sm"
            >
              <Printer className="w-4 h-4" />
              <span>{printing ? 'Generando...' : 'Imprimir / Guardar como PDF'}</span>
            </Button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-bone-500 hover:text-obsidian hover:bg-bone-200/70 transition-colors ml-1"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ---------------- VISTA PREVIA DEL DOCUMENTO A4 (SCROLLABLE) ---------------- */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-bone-100/60">
          <div className="max-w-[210mm] mx-auto bg-white rounded-xl shadow-soft-md border border-bone-200 p-6 sm:p-9 space-y-6 text-obsidian text-xs leading-relaxed">
            {/* Encabezado Corporativo */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b-2 border-olive-900">
              <div>
                <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-olive-950 tracking-tight">
                  OLIVÍCOLA LUJÁN S.A.
                </h1>
                <div className="text-[11px] font-bold text-olive-700 tracking-wider mt-0.5">
                  EST. 1968 · PLANTA INDUSTRIAL MENDOZA
                </div>
              </div>
              <div className="text-right text-[11px] text-bone-600 space-y-0.5">
                <div className="font-bold text-obsidian uppercase tracking-wide">
                  Documento Ejecutivo de Planta
                </div>
                <div>
                  <span className="font-semibold text-bone-700">Fecha:</span> {metadata.dateFormatted} ({metadata.timeFormatted})
                </div>
                <div>
                  <span className="font-semibold text-bone-700">Código de Informe:</span>{' '}
                  <span className="font-mono font-bold text-olive-900">{metadata.reportCode}</span>
                </div>
                <div>
                  <span className="font-semibold text-bone-700">Emisor:</span> {metadata.emitter}
                </div>
              </div>
            </div>

            {/* Título y Subtítulo */}
            <div>
              <h2 className="font-serif text-base sm:text-lg font-bold text-olive-950 uppercase tracking-wide">
                Informe de Gestión Operativa, Stock y Trazabilidad Industrial
              </h2>
              <p className="text-xs text-bone-600 mt-1">
                Balance consolidado en tiempo real de tambores de aceitunas en salmuera, rendimientos por producto, clasificación varietal, calibres y ocupación espacial.
              </p>
            </div>

            {/* 1. KPIs Clave */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-lg bg-olive-50/70 border border-olive-200/80 text-center">
                <div className="text-[10px] font-bold uppercase tracking-wider text-bone-600 font-mono">
                  Volumen Neto Total
                </div>
                <div className="text-lg sm:text-xl font-bold font-serif text-olive-950 mt-1">
                  {formatNumber(kpis.totalKg)} kg
                </div>
                <div className="text-[11px] text-olive-800 font-semibold mt-0.5">
                  {kpis.totalTonnes} Tn en Salmuera
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-bone-50 border border-bone-200 text-center">
                <div className="text-[10px] font-bold uppercase tracking-wider text-bone-600 font-mono">
                  Tambores en Planta
                </div>
                <div className="text-lg sm:text-xl font-bold font-serif text-obsidian mt-1">
                  {formatNumber(kpis.totalDrums)}
                </div>
                <div className="text-[11px] text-bone-600 font-semibold mt-0.5">
                  100% con Tambor ID
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-bone-50 border border-bone-200 text-center">
                <div className="text-[10px] font-bold uppercase tracking-wider text-bone-600 font-mono">
                  Calidad Primera (PRI)
                </div>
                <div className="text-lg sm:text-xl font-bold font-serif text-obsidian mt-1">
                  {kpis.primeraPercent} %
                </div>
                <div className="text-[11px] text-bone-600 font-semibold mt-0.5">
                  {formatNumber(kpis.primeraCount)} Tambores
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-olive-50/70 border border-olive-200/80 text-center">
                <div className="text-[10px] font-bold uppercase tracking-wider text-bone-600 font-mono">
                  Lotes Liberados
                </div>
                <div className="text-lg sm:text-xl font-bold font-serif text-olive-950 mt-1">
                  {kpis.liberadosPercent} %
                </div>
                <div className="text-[11px] text-olive-800 font-semibold mt-0.5">
                  {formatNumber(kpis.liberadosCount)} Tambores Aptos
                </div>
              </div>
            </div>

            {/* 2. Tabla de Productos */}
            <div className="space-y-2">
              <h3 className="font-serif text-sm font-bold text-olive-950 border-l-2 border-olive-800 pl-2">
                1. Balance de Existencias y Rendimiento por Tipo de Producto
              </h3>
              <div className="overflow-x-auto rounded-lg border border-bone-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-olive-800 text-bone-50">
                    <tr className="text-[10px] uppercase font-mono">
                      <th className="py-2 px-3">Producto</th>
                      <th className="py-2 px-3 text-center">Código</th>
                      <th className="py-2 px-3 text-right">Peso Sugerido</th>
                      <th className="py-2 px-3 text-right">Tambores</th>
                      <th className="py-2 px-3 text-right">Kilos Netos</th>
                      <th className="py-2 px-3 text-right">% Volumen</th>
                      <th className="py-2 px-3">Estado Operacional</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-bone-100 font-sans">
                    {productBreakdown.map((p) => (
                      <tr key={p.codigo} className="hover:bg-bone-50/50">
                        <td className="py-2 px-3 font-semibold text-obsidian">{p.nombre}</td>
                        <td className="py-2 px-3 text-center font-mono font-bold text-bone-600">{p.codigo}</td>
                        <td className="py-2 px-3 text-right font-mono text-bone-600">{p.suggestedWeight}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-obsidian">{formatNumber(p.drums)}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-obsidian">{formatNumber(p.kg)} kg</td>
                        <td className="py-2 px-3 text-right font-mono text-bone-700">{p.percent} %</td>
                        <td className="py-2 px-3 text-emerald-700 font-medium text-[11px]">{p.statusDesc}</td>
                      </tr>
                    ))}
                    <tr className="bg-olive-100/70 font-bold border-t-2 border-olive-800 text-obsidian">
                      <td className="py-2.5 px-3">TOTALES PLANTA</td>
                      <td className="py-2.5 px-3 text-center font-mono">—</td>
                      <td className="py-2.5 px-3 text-right font-mono">—</td>
                      <td className="py-2.5 px-3 text-right font-mono text-sm">{formatNumber(kpis.totalDrums)}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-sm">{formatNumber(kpis.totalKg)} kg</td>
                      <td className="py-2.5 px-3 text-right font-mono">100,0 %</td>
                      <td className="py-2.5 px-3 text-olive-950 font-serif">{kpis.totalTonnes} Toneladas Métricas</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 3. Variedades y Calibres */}
            <div className="space-y-2">
              <h3 className="font-serif text-sm font-bold text-olive-950 border-l-2 border-olive-800 pl-2">
                2. Clasificación Varietal y Distribución de Calibres
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-bone-200 bg-bone-50/50 space-y-2.5">
                  <h4 className="text-xs font-bold font-mono uppercase text-olive-900 tracking-wider">
                    Distribución por Variedad Insignia
                  </h4>
                  <ul className="space-y-2 text-xs">
                    {varietyBreakdown.map((v) => (
                      <li key={v.codigo} className="border-b border-bone-100 last:border-0 pb-1.5 last:pb-0">
                        <div className="flex items-center justify-between font-semibold">
                          <span>{v.nombre} ({v.codigo})</span>
                          <span className="font-mono text-olive-900">{v.percent}% · {formatNumber(v.kg)} kg</span>
                        </div>
                        <p className="text-[11px] text-bone-600 mt-0.5">{v.desc}</p>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-xl border border-bone-200 bg-bone-50/50 space-y-2.5">
                  <h4 className="text-xs font-bold font-mono uppercase text-olive-900 tracking-wider">
                    Matriz de Calibres (Frutos / kg)
                  </h4>
                  <ul className="space-y-2 text-xs">
                    <li className="border-b border-bone-100 pb-1.5">
                      <div className="flex items-center justify-between font-semibold">
                        <span>{caliberBreakdown.grandes.label}</span>
                        <span className="font-mono text-olive-900">{caliberBreakdown.grandes.percent}% · {formatNumber(caliberBreakdown.grandes.kg)} kg</span>
                      </div>
                      <p className="text-[11px] text-bone-600 mt-0.5">{caliberBreakdown.grandes.desc}</p>
                    </li>
                    <li className="border-b border-bone-100 pb-1.5">
                      <div className="flex items-center justify-between font-semibold">
                        <span>{caliberBreakdown.medios.label}</span>
                        <span className="font-mono text-olive-900">{caliberBreakdown.medios.percent}% · {formatNumber(caliberBreakdown.medios.kg)} kg</span>
                      </div>
                      <p className="text-[11px] text-bone-600 mt-0.5">{caliberBreakdown.medios.desc}</p>
                    </li>
                    <li className="border-b border-bone-100 pb-1.5">
                      <div className="flex items-center justify-between font-semibold">
                        <span>{caliberBreakdown.chicos.label}</span>
                        <span className="font-mono text-olive-900">{caliberBreakdown.chicos.percent}% · {formatNumber(caliberBreakdown.chicos.kg)} kg</span>
                      </div>
                      <p className="text-[11px] text-bone-600 mt-0.5">{caliberBreakdown.chicos.desc}</p>
                    </li>
                    <li>
                      <div className="flex items-center justify-between font-semibold">
                        <span>{caliberBreakdown.sinCalibre.label}</span>
                        <span className="font-mono text-olive-900">{caliberBreakdown.sinCalibre.percent}% · {formatNumber(caliberBreakdown.sinCalibre.kg)} kg</span>
                      </div>
                      <p className="text-[11px] text-bone-600 mt-0.5">{caliberBreakdown.sinCalibre.desc}</p>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 4. Sectores y Ubicaciones */}
            <div className="space-y-2">
              <h3 className="font-serif text-sm font-bold text-olive-950 border-l-2 border-olive-800 pl-2">
                3. Ocupación Espacial y Auditoría por Sectores de Planta
              </h3>
              <div className="overflow-x-auto rounded-lg border border-bone-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-olive-800 text-bone-50">
                    <tr className="text-[10px] uppercase font-mono">
                      <th className="py-2 px-3">Sector de Planta</th>
                      <th className="py-2 px-3 text-center">Código</th>
                      <th className="py-2 px-3 text-right">Tambores</th>
                      <th className="py-2 px-3 text-right">Kilogramos Netos</th>
                      <th className="py-2 px-3 text-right">% del Total</th>
                      <th className="py-2 px-3">Estado Operativo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-bone-100 font-sans">
                    {locationBreakdown.map((loc) => (
                      <tr key={loc.id || loc.codigo} className="hover:bg-bone-50/50">
                        <td className="py-2 px-3 font-semibold text-obsidian">{loc.nombre}</td>
                        <td className="py-2 px-3 text-center font-mono font-bold text-bone-600">{loc.codigo}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-obsidian">{formatNumber(loc.drums)}</td>
                        <td className="py-2 px-3 text-right font-mono text-bone-700">{formatNumber(loc.kg)} kg</td>
                        <td className="py-2 px-3 text-right font-mono">{loc.percent} %</td>
                        <td className="py-2 px-3 text-emerald-700 font-medium text-[11px]">Sector Auditado Activo</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 5. Muestreo de Tambores Registrados */}
            {recentDrums && recentDrums.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-serif text-sm font-bold text-olive-950 border-l-2 border-olive-800 pl-2">
                  4. Muestreo de Tambores Registrados en Planta
                </h3>
                <div className="overflow-x-auto rounded-lg border border-bone-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-bone-100 text-bone-700">
                      <tr className="text-[10px] uppercase font-mono">
                        <th className="py-1.5 px-3">Tambor ID</th>
                        <th className="py-1.5 px-3">Código Descriptivo</th>
                        <th className="py-1.5 px-3">Lote</th>
                        <th className="py-1.5 px-3 text-right">Peso Neto</th>
                        <th className="py-1.5 px-3">Ubicación</th>
                        <th className="py-1.5 px-3 text-center">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-bone-100 font-mono text-[11px]">
                      {recentDrums.slice(0, 5).map((d) => (
                        <tr key={d.id} className="hover:bg-bone-50/50">
                          <td className="py-1.5 px-3 font-bold text-obsidian">{d.tambor_id}</td>
                          <td className="py-1.5 px-3 text-bone-700">{d.codigo_descriptivo || d.codigo || '—'}</td>
                          <td className="py-1.5 px-3 text-bone-600">{d.lote || '—'}</td>
                          <td className="py-1.5 px-3 text-right font-bold text-obsidian">{d.peso} kg</td>
                          <td className="py-1.5 px-3 text-bone-600">{d.ubicacion_nombre || d.ubicacion || '—'}</td>
                          <td className="py-1.5 px-3 text-center text-emerald-700 font-sans font-semibold">
                            {d.estado || 'Activo'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Bloque de Firmas Institucionales */}
            <div className="pt-6 border-t border-bone-200 space-y-6">
              <p className="text-[11px] text-bone-500 text-center italic">
                Se certifica la veracidad de los pesajes, calidades y volúmenes asentados en el presente informe conforme al corte del sistema de trazabilidad de Olivícola Luján S.A.
              </p>

              <div className="grid grid-cols-3 gap-6 pt-6 text-center">
                <div className="space-y-1">
                  <div className="border-t border-obsidian w-3/4 mx-auto mb-2"></div>
                  <div className="font-bold text-xs text-obsidian">GERENCIA GENERAL</div>
                  <div className="text-[10px] text-bone-500">Dirección Ejecutiva · Olivícola Luján S.A.</div>
                </div>

                <div className="space-y-1">
                  <div className="border-t border-obsidian w-3/4 mx-auto mb-2"></div>
                  <div className="font-bold text-xs text-obsidian">JEFATURA DE PLANTA</div>
                  <div className="text-[10px] text-bone-500">Operaciones y Logística Industrial</div>
                </div>

                <div className="space-y-1">
                  <div className="border-t border-obsidian w-3/4 mx-auto mb-2"></div>
                  <div className="font-bold text-xs text-obsidian">CONTROL DE CALIDAD</div>
                  <div className="text-[10px] text-bone-500">Laboratorio e Inocuidad Alimentaria</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ---------------- PIE DEL MODAL ---------------- */}
        <div className="px-5 py-3 sm:px-6 sm:py-3.5 border-t border-bone-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-bone-500 font-mono">
            Documento listo para impresión A4 · {formatNumber(kpis.totalDrums)} tambores · {formatNumber(kpis.totalKg)} kg auditados
          </div>

          <div className="flex items-center gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
              Cerrar
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handlePrint}
              disabled={printing}
              className="text-xs flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>{printing ? 'Generando...' : 'Imprimir / Guardar como PDF'}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
export default ExecutiveReportModal;
