import React, { useState, useMemo } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Printer,
  CheckSquare,
  Square,
  Building2,
  Layers,
  Barcode as BarcodeIcon,
  Download,
  Copy,
  Check,
  FileCode,
} from 'lucide-react';
import { loadDatabase } from '../api/repository.js';
import { resolveCatalogName } from '../lib/domain.js';
import { PhysicalLabel, SectorLabel, BarcodeSvg } from '../components/Barcode.jsx';
import { generateBatchZPL, downloadZplFile, copyZplToClipboard } from '../lib/zpl.js';
import { Button } from '../components/ui/button.jsx';
import { Badge } from '../components/ui/badge.jsx';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../components/ui/dialog.jsx';

export function BatchLabelsPage() {
  const location = useLocation();
  const db = loadDatabase();
  const { tambores = [], catalogos = [] } = db || {};

  // Modo: 'tambores' | 'sectores'
  const [printMode, setPrintMode] = useState(
    location.state?.mode === 'sectores' ? 'sectores' : 'tambores'
  );

  // Sectores de planta activos (catálogo ubicacion)
  const sectorList = useMemo(() => {
    return (catalogos || []).filter((c) => c && c.tipo === 'ubicacion' && c.activo);
  }, [catalogos]);

  // Selección de tambores
  const initialSelectedDrums = useMemo(() => {
    if (location.state?.drumIds && Array.isArray(location.state.drumIds)) {
      return new Set(location.state.drumIds);
    }
    return new Set(tambores.map((d) => d.tambor_id));
  }, [location.state, tambores]);

  // Selección de sectores
  const initialSelectedSectors = useMemo(() => {
    return new Set(sectorList.map((s) => s.id));
  }, [sectorList]);

  const [selectedDrumIds, setSelectedDrumIds] = useState(initialSelectedDrums);
  const [selectedSectorIds, setSelectedSectorIds] = useState(initialSelectedSectors);

  // Medidas predeterminadas de etiqueta térmica apaisada (100mm × 50mm según foto de planta)
  const [widthMm, setWidthMm] = useState(100);
  const [heightMm, setHeightMm] = useState(50);

  // Manejo selección tambores
  const toggleSelectDrum = (id) => {
    const updated = new Set(selectedDrumIds);
    if (updated.has(id)) updated.delete(id);
    else updated.add(id);
    setSelectedDrumIds(updated);
  };

  const selectAllDrums = () => setSelectedDrumIds(new Set(tambores.map((d) => d.tambor_id)));
  const deselectAllDrums = () => setSelectedDrumIds(new Set());

  // Manejo selección sectores
  const toggleSelectSector = (id) => {
    const updated = new Set(selectedSectorIds);
    if (updated.has(id)) updated.delete(id);
    else updated.add(id);
    setSelectedSectorIds(updated);
  };

  const selectAllSectors = () => setSelectedSectorIds(new Set(sectorList.map((s) => s.id)));
  const deselectAllSectors = () => setSelectedSectorIds(new Set());

  const selectedDrums = useMemo(() => {
    return tambores
      .filter((d) => selectedDrumIds.has(d.tambor_id))
      .map((d) => ({
        ...d,
        ubicacion_nombre: resolveCatalogName(catalogos, d.ubicacion, 'ubicacion'),
      }));
  }, [tambores, selectedDrumIds, catalogos]);

  const selectedSectors = useMemo(() => {
    return sectorList.filter((s) => selectedSectorIds.has(s.id));
  }, [sectorList, selectedSectorIds]);

  const handlePrint = () => {
    window.print();
  };

  // Generación de comandos ZPL II para Zebra GC420t
  const [copiedZpl, setCopiedZpl] = useState(false);
  const [zplModalOpen, setZplModalOpen] = useState(false);

  const currentBatchZpl = useMemo(() => {
    const options = {
      widthDots: Math.round(widthMm * 8),
      heightDots: Math.round(heightMm * 8),
    };
    return printMode === 'tambores'
      ? generateBatchZPL(selectedDrums, 'drum', options)
      : generateBatchZPL(selectedSectors, 'sector', options);
  }, [printMode, selectedDrums, selectedSectors, widthMm, heightMm]);

  const handleDownloadZpl = () => {
    if (!currentBatchZpl) return;
    const filename =
      printMode === 'tambores'
        ? `lote-${selectedDrums.length}-tambores-zebra-gc420t.zpl`
        : `lote-${selectedSectors.length}-sectores-zebra-gc420t.zpl`;
    downloadZplFile(currentBatchZpl, filename);
  };

  const handleCopyZpl = async () => {
    if (!currentBatchZpl) return;
    const ok = await copyZplToClipboard(currentBatchZpl);
    if (ok) {
      setCopiedZpl(true);
      setTimeout(() => setCopiedZpl(false), 2000);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ---------------- BARRA DE CONTROLES NO IMPRIMIBLE ---------------- */}
      <div className="no-print bezel-shell">
        <div className="bezel-core p-4 sm:p-6 bg-white space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-bone-200">
            <div className="flex items-center gap-3">
              <Link
                to="/inventario"
                className="p-2 rounded-xl text-bone-600 hover:text-obsidian hover:bg-bone-100 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h2 className="font-serif text-2xl font-bold text-obsidian">
                  Centro de Impresión de Etiquetas Térmicas
                </h2>
                <p className="text-xs text-bone-600 mt-0.5">
                  Calibrado para Zebra GC420t (203 dpi · 100 × 50 mm apaisada · ZPL II).
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="primary"
                size="default"
                disabled={printMode === 'tambores' ? selectedDrums.length === 0 : selectedSectors.length === 0}
                onClick={handlePrint}
                className="text-xs font-mono"
              >
                <Printer className="w-4 h-4 mr-1.5" />
                {printMode === 'tambores'
                  ? `Imprimir ${selectedDrums.length} Etiquetas`
                  : `Imprimir ${selectedSectors.length} Etiquetas`}
              </Button>

              <Button
                variant="secondary"
                size="default"
                disabled={printMode === 'tambores' ? selectedDrums.length === 0 : selectedSectors.length === 0}
                onClick={handleDownloadZpl}
                className="text-xs font-mono"
                title="Descargar archivo .zpl para Zebra GC420t"
              >
                <Download className="w-4 h-4 mr-1.5" />
                Descargar .ZPL
              </Button>

              <Button
                variant="outline"
                size="default"
                disabled={printMode === 'tambores' ? selectedDrums.length === 0 : selectedSectors.length === 0}
                onClick={handleCopyZpl}
                className="text-xs font-mono"
                title="Copiar comandos ZPL II"
              >
                {copiedZpl ? (
                  <>
                    <Check className="w-4 h-4 mr-1.5 text-emerald-600" />
                    <span className="text-emerald-700">¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-1.5" />
                    Copiar ZPL
                  </>
                )}
              </Button>

              <Button
                variant="ghost"
                size="default"
                disabled={printMode === 'tambores' ? selectedDrums.length === 0 : selectedSectors.length === 0}
                onClick={() => setZplModalOpen(true)}
                className="text-xs font-mono text-bone-600 hover:text-obsidian"
                title="Ver comandos ZPL II"
              >
                <FileCode className="w-4 h-4 mr-1.5" />
                Ver Código
              </Button>
            </div>
          </div>

          {/* Selector de Modo: Tambores vs Sectores */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPrintMode('tambores')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all ${
                  printMode === 'tambores'
                    ? 'bg-obsidian text-bone-50 shadow-soft-sm'
                    : 'bg-bone-100 text-bone-700 hover:bg-bone-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Etiquetas de Tambores ({tambores.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setPrintMode('sectores')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all ${
                  printMode === 'sectores'
                    ? 'bg-obsidian text-bone-50 shadow-soft-sm'
                    : 'bg-bone-100 text-bone-700 hover:bg-bone-200'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Etiquetas de Sectores / Columnas ({sectorList.length})</span>
              </button>
            </div>

            {/* Configuración de medidas y selección */}
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-bone-600">Medida:</span>
                <input
                  type="number"
                  value={widthMm}
                  onChange={(e) => setWidthMm(Number(e.target.value))}
                  className="w-12 h-7 px-1 text-center rounded border border-bone-300 font-mono"
                />
                <span>×</span>
                <input
                  type="number"
                  value={heightMm}
                  onChange={(e) => setHeightMm(Number(e.target.value))}
                  className="w-12 h-7 px-1 text-center rounded border border-bone-300 font-mono"
                />
                <span className="font-mono text-bone-500">mm</span>
              </div>

              <div className="flex items-center gap-2 font-mono">
                <button
                  type="button"
                  onClick={printMode === 'tambores' ? selectAllDrums : selectAllSectors}
                  className="text-olive-800 hover:underline cursor-pointer"
                >
                  Todos
                </button>
                <span className="text-bone-300">|</span>
                <button
                  type="button"
                  onClick={printMode === 'tambores' ? deselectAllDrums : deselectAllSectors}
                  className="text-bone-600 hover:text-obsidian underline cursor-pointer"
                >
                  Ninguno
                </button>
              </div>
            </div>
          </div>

          {/* Selector de Chips de Tambores */}
          {printMode === 'tambores' && (
            <div className="pt-2 border-t border-bone-100 flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
              {tambores.map((d) => {
                const isSelected = selectedDrumIds.has(d.tambor_id);
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => toggleSelectDrum(d.tambor_id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors border ${
                      isSelected
                        ? 'bg-olive-900 text-bone-50 border-olive-900 font-bold'
                        : 'bg-bone-50 text-bone-700 border-bone-200 hover:bg-bone-100'
                    }`}
                  >
                    {d.tambor_id}
                  </button>
                );
              })}
            </div>
          )}

          {/* Selector de Chips de Sectores */}
          {printMode === 'sectores' && (
            <div className="pt-2 border-t border-bone-100 flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {sectorList.map((s) => {
                const isSelected = selectedSectorIds.has(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleSelectSector(s.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors border flex items-center gap-2 ${
                      isSelected
                        ? 'bg-olive-900 text-bone-50 border-olive-900 font-bold'
                        : 'bg-bone-50 text-bone-700 border-bone-200 hover:bg-bone-100'
                    }`}
                  >
                    <span>{s.codigo}</span>
                    <span className="text-[10px] font-sans opacity-80">({s.nombre})</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ---------------- RESUMEN DE LOTE PARA IMPRESIÓN (SIN PREVIEW) ---------------- */}
      <div className="no-print bezel-shell">
        <div className="bezel-core p-4 sm:p-6 bg-white space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-bone-200">
            <div>
              <h3 className="font-serif text-lg font-bold text-obsidian">
                {printMode === 'tambores'
                  ? 'Tambores preparados para impresión'
                  : 'Sectores preparados para impresión en columnas/postes'}
              </h3>
              <p className="text-xs text-bone-600">
                {printMode === 'tambores'
                  ? `${selectedDrums.length} tambores seleccionados · Formato térmico (${widthMm} × ${heightMm} mm)`
                  : `${selectedSectors.length} sectores seleccionados para identificación física de planta`}
              </p>
            </div>
            <div className="text-xs font-mono text-bone-500">
              Impresión directa por hoja sin previsualización en pantalla
            </div>
          </div>

          {printMode === 'tambores' ? (
            selectedDrums.length === 0 ? (
              <div className="text-center py-10 bg-bone-50 rounded-xl border border-bone-200 text-bone-500 text-sm">
                No has seleccionado ningún tambor para imprimir.
              </div>
            ) : (
              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-left text-xs">
                  <thead className="bg-bone-50 sticky top-0 border-b border-bone-200">
                    <tr className="text-[10px] uppercase font-mono text-bone-500">
                      <th className="py-2.5 px-3">Tambor ID</th>
                      <th className="py-2.5 px-3">Código Descriptivo</th>
                      <th className="py-2.5 px-3">Lote</th>
                      <th className="py-2.5 px-3 text-right">Peso</th>
                      <th className="py-2.5 px-3">Ubicación</th>
                      <th className="py-2.5 px-3 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-bone-100 font-mono">
                    {selectedDrums.map((drum) => (
                      <tr key={drum.id} className="hover:bg-bone-50/60 transition-colors">
                        <td className="py-2 px-3 font-bold text-obsidian">{drum.tambor_id}</td>
                        <td className="py-2 px-3 text-bone-700">{drum.codigo_descriptivo || '—'}</td>
                        <td className="py-2 px-3 text-bone-600">{drum.lote || '—'}</td>
                        <td className="py-2 px-3 text-right text-bone-800 font-bold">{drum.peso} kg</td>
                        <td className="py-2 px-3 text-bone-600">{drum.ubicacion_nombre || drum.ubicacion || '—'}</td>
                        <td className="py-2 px-3 text-center">
                          <span className="text-[10px] bg-olive-100 text-olive-900 px-2 py-0.5 rounded font-semibold font-sans">
                            Listo
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : selectedSectors.length === 0 ? (
            <div className="text-center py-10 bg-bone-50 rounded-xl border border-bone-200 text-bone-500 text-sm">
              No has seleccionado ningún sector para imprimir.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {selectedSectors.map((sector) => (
                <div
                  key={sector.id}
                  className="p-4 rounded-xl border border-bone-200 bg-bone-50/50 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <span className="font-mono font-bold text-sm text-obsidian">
                      {sector.codigo}
                    </span>
                    <p className="text-bone-600 font-sans">{sector.nombre}</p>
                    <span className="text-[10px] font-mono text-bone-400 block">
                      CODE 128: * {sector.codigo} *
                    </span>
                  </div>
                  <div className="w-16 h-8 bg-white p-1 rounded border border-bone-200 flex items-center justify-center shrink-0">
                    <BarcodeSvg
                      value={sector.codigo}
                      width={1}
                      height={24}
                      displayValue={false}
                      className="max-w-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ---------------- CONTENEDOR DE IMPRESIÓN (SOLO AL IMPRIMIR) ---------------- */}
      <div className="print-only">
        {printMode === 'tambores'
          ? selectedDrums.map((drum) => (
              <PhysicalLabel
                key={drum.id}
                drum={drum}
                widthMm={widthMm}
                heightMm={heightMm}
                showBorder={false}
              />
            ))
          : selectedSectors.map((sector) => (
              <SectorLabel
                key={sector.id}
                sector={sector}
                widthMm={widthMm}
                heightMm={heightMm}
                showBorder={false}
              />
            ))}
      </div>

      {/* Modal para previsualizar y exportar comandos nativos ZPL II */}
      <Dialog open={zplModalOpen} onOpenChange={setZplModalOpen}>
        <DialogContent className="max-w-2xl bg-white max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg font-bold flex items-center gap-2">
              <FileCode className="w-5 h-5 text-olive-800" />
              <span>Código ZPL II - Zebra GC420t (203 dpi)</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-bone-600">
              Formato de etiqueta: 100mm × 50mm (800 × 400 dots con sensor de gap).
              Compatible con Zebra Setup Utilities, Zebra Browser Print o socket RAW (puerto 9100 / USB).
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 my-3 overflow-hidden rounded-xl border border-bone-300 bg-obsidian text-emerald-400 p-4 font-mono text-xs overflow-y-auto max-h-72 select-all">
            <pre className="whitespace-pre-wrap">{currentBatchZpl}</pre>
          </div>

          <DialogFooter className="flex items-center justify-between sm:justify-between w-full pt-2">
            <span className="text-[11px] font-mono text-bone-500">
              {printMode === 'tambores' ? selectedDrums.length : selectedSectors.length} etiquetas preparadas
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleCopyZpl}
                className="text-xs font-mono"
              >
                {copiedZpl ? <Check className="w-4 h-4 mr-1 text-emerald-600" /> : <Copy className="w-4 h-4 mr-1" />}
                {copiedZpl ? 'Copiado' : 'Copiar ZPL'}
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleDownloadZpl}
                className="text-xs font-mono"
              >
                <Download className="w-4 h-4 mr-1" />
                Descargar .zpl
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default BatchLabelsPage;
