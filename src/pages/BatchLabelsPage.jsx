import React, { useState, useMemo } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ArrowLeft, Printer, CheckSquare, Square, Sliders } from 'lucide-react';
import { loadDatabase } from '../api/repository.js';
import { resolveCatalogName } from '../lib/domain.js';
import { PhysicalLabel } from '../components/Barcode.jsx';
import { Button } from '../components/ui/button.jsx';

export function BatchLabelsPage() {
  const location = useLocation();
  const db = loadDatabase();
  const { tambores, catalogos } = db;

  // Si se pasaron tambores específicos desde inventario
  const initialSelected = useMemo(() => {
    if (location.state?.drumIds && Array.isArray(location.state.drumIds)) {
      return new Set(location.state.drumIds);
    }
    // Por defecto, preseleccionar todos los tambores
    return new Set(tambores.map((d) => d.tambor_id));
  }, [location.state, tambores]);

  const [selectedIds, setSelectedIds] = useState(initialSelected);
  const [widthMm, setWidthMm] = useState(50);
  const [heightMm, setHeightMm] = useState(100);

  const toggleSelect = (id) => {
    const updated = new Set(selectedIds);
    if (updated.has(id)) {
      updated.delete(id);
    } else {
      updated.add(id);
    }
    setSelectedIds(updated);
  };

  const selectAll = () => {
    setSelectedIds(new Set(tambores.map((d) => d.tambor_id)));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const selectedDrums = useMemo(() => {
    return tambores
      .filter((d) => selectedIds.has(d.tambor_id))
      .map((d) => ({
        ...d,
        ubicacion_nombre: resolveCatalogName(catalogos, d.ubicacion, 'ubicacion'),
      }));
  }, [tambores, selectedIds, catalogos]);

  const handlePrint = () => {
    window.print();
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
                  Impresión Masiva de Etiquetas
                </h2>
                <p className="text-xs text-bone-600 mt-0.5">
                  Cada etiqueta se imprimirá en una página térmica independiente (50 × 100 mm).
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="primary"
                size="default"
                disabled={selectedDrums.length === 0}
                onClick={handlePrint}
                className="text-xs"
              >
                <Printer className="w-4 h-4 mr-1.5" />
                Imprimir {selectedDrums.length} {selectedDrums.length === 1 ? 'Etiqueta' : 'Etiquetas'}
              </Button>
            </div>
          </div>

          {/* Configuración de medidas y selección */}
          <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-mono text-bone-600">Medida de papel:</span>
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
              <span className="font-mono text-bone-500">mm (predeterminado 50×100)</span>
            </div>

            <div className="flex items-center gap-3 font-mono">
              <button
                type="button"
                onClick={selectAll}
                className="text-olive-800 hover:underline cursor-pointer"
              >
                Seleccionar todos ({tambores.length})
              </button>
              <span className="text-bone-300">|</span>
              <button
                type="button"
                onClick={deselectAll}
                className="text-bone-600 hover:text-obsidian underline cursor-pointer"
              >
                Deseleccionar
              </button>
            </div>
          </div>

          {/* Selector de Chips de Tambores */}
          <div className="pt-2 border-t border-bone-100 flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
            {tambores.map((d) => {
              const isSelected = selectedIds.has(d.tambor_id);
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => toggleSelect(d.tambor_id)}
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
        </div>
      </div>

      {/* ---------------- VISTA PREVIA Y CONTENEDOR DE IMPRESIÓN ---------------- */}
      <div className="space-y-4">
        <div className="no-print text-center text-xs text-bone-500 font-mono">
          Vista previa del lote a imprimir ({selectedDrums.length} etiquetas):
        </div>

        {selectedDrums.length === 0 ? (
          <div className="no-print text-center py-12 bg-white rounded-2xl border border-bone-200 text-bone-500 text-sm">
            No has seleccionado ningún tambor para imprimir.
          </div>
        ) : (
          <div className="flex flex-wrap justify-center gap-6 p-6 bg-bone-100/50 rounded-2xl border border-bone-200">
            {selectedDrums.map((drum) => (
              <div
                key={drum.id}
                className="shadow-md bg-white printable-label-page"
              >
                <PhysicalLabel
                  drum={drum}
                  widthMm={widthMm}
                  heightMm={heightMm}
                  showBorder={true}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
