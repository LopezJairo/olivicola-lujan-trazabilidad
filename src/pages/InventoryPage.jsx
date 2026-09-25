import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  X,
  Printer,
  PlusCircle,
  ArrowUpDown,
  Download,
  Eye,
  SlidersHorizontal,
} from 'lucide-react';
import { loadDatabase } from '../api/repository.js';
import { searchDrums, calculateInventoryTotals, resolveCatalogName } from '../lib/domain.js';
import { formatKg, formatDate } from '../lib/utils.js';
import { Button } from '../components/ui/button.jsx';
import { Input } from '../components/ui/input.jsx';
import { Badge } from '../components/ui/badge.jsx';
import { Card } from '../components/ui/card.jsx';
import { PhysicalLabel } from '../components/Barcode.jsx';

export function InventoryPage() {
  const navigate = useNavigate();
  const db = loadDatabase();
  const { tambores, catalogos } = db;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedPresentation, setSelectedPresentation] = useState('');
  const [selectedVariety, setSelectedVariety] = useState('');
  const [selectedCaliber, setSelectedCaliber] = useState('');
  const [selectedQuality, setSelectedQuality] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Selección múltiple para impresión
  const [selectedDrumIds, setSelectedDrumIds] = useState(new Set());
  const [singleDrumToPrint, setSingleDrumToPrint] = useState(null);

  const handlePrintSingleDrum = (drum) => {
    setSingleDrumToPrint(drum);
  };

  useEffect(() => {
    if (!singleDrumToPrint) return;
    const timer = setTimeout(() => {
      window.print();
      // Limpieza de seguridad post-impresión
      setTimeout(() => {
        setSingleDrumToPrint(null);
      }, 500);
    }, 60);
    return () => clearTimeout(timer);
  }, [singleDrumToPrint]);

  useEffect(() => {
    const handleAfterPrint = () => {
      setSingleDrumToPrint(null);
    };
    window.addEventListener('afterprint', handleAfterPrint);
    return () => window.removeEventListener('afterprint', handleAfterPrint);
  }, []);

  // Catálogos filtrados por tipo
  const productCats = useMemo(() => catalogos.filter((c) => c.tipo === 'producto'), [catalogos]);
  const presentationCats = useMemo(() => catalogos.filter((c) => c.tipo === 'presentacion'), [catalogos]);
  const varietyCats = useMemo(() => catalogos.filter((c) => c.tipo === 'variedad'), [catalogos]);
  const caliberCats = useMemo(() => catalogos.filter((c) => c.tipo === 'calibre'), [catalogos]);
  const qualityCats = useMemo(() => catalogos.filter((c) => c.tipo === 'calidad'), [catalogos]);
  const locationCats = useMemo(() => catalogos.filter((c) => c.tipo === 'ubicacion'), [catalogos]);
  const statusCats = useMemo(() => catalogos.filter((c) => c.tipo === 'estado'), [catalogos]);

  // Aplicar filtros y búsqueda
  const filteredDrums = useMemo(() => {
    const filters = {
      producto: selectedProduct || undefined,
      presentacion: selectedPresentation || undefined,
      variedad: selectedVariety || undefined,
      calibre: selectedCaliber || undefined,
      calidad: selectedQuality || undefined,
      ubicacion: selectedLocation || undefined,
      estado: selectedStatus || undefined,
    };
    return searchDrums(tambores, searchQuery, filters, catalogos);
  }, [
    tambores,
    searchQuery,
    selectedProduct,
    selectedPresentation,
    selectedVariety,
    selectedCaliber,
    selectedQuality,
    selectedLocation,
    selectedStatus,
    catalogos,
  ]);

  const totals = useMemo(() => calculateInventoryTotals(filteredDrums), [filteredDrums]);

  const hasActiveFilters = Boolean(
    searchQuery ||
    selectedProduct ||
    selectedPresentation ||
    selectedVariety ||
    selectedCaliber ||
    selectedQuality ||
    selectedLocation ||
    selectedStatus
  );

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedProduct('');
    setSelectedPresentation('');
    setSelectedVariety('');
    setSelectedCaliber('');
    setSelectedQuality('');
    setSelectedLocation('');
    setSelectedStatus('');
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedDrumIds(new Set(filteredDrums.map((d) => d.tambor_id)));
    } else {
      setSelectedDrumIds(new Set());
    }
  };

  const handleToggleSelectDrum = (id, e) => {
    e.stopPropagation();
    const updated = new Set(selectedDrumIds);
    if (updated.has(id)) {
      updated.delete(id);
    } else {
      updated.add(id);
    }
    setSelectedDrumIds(updated);
  };

  const handleBatchPrint = () => {
    const idsToPrint = selectedDrumIds.size > 0
      ? Array.from(selectedDrumIds)
      : filteredDrums.map((d) => d.tambor_id);

    navigate('/etiquetas', { state: { drumIds: idsToPrint } });
  };

  return (
    <>
      <div className="no-print space-y-6 animate-in fade-in duration-300">
      {/* ---------------- CABECERA ---------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-bone-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase tracking-[0.2em] font-mono text-olive-800 bg-olive-100/70 px-2.5 py-0.5 rounded-full font-semibold">
              Inventario Activo
            </span>
            <span className="text-bone-400 text-xs font-mono">· Planta Luján</span>
          </div>
          <h2 className="font-serif text-3xl font-bold tracking-tight text-obsidian">
            Listado de Tambores
          </h2>
          <p className="text-sm text-bone-600 mt-0.5">
            Consulta rápida, filtros por características y selección para impresión de etiquetas.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="default"
            onClick={handleBatchPrint}
            className="text-xs"
          >
            <Printer className="w-4 h-4 mr-1.5" />
            {selectedDrumIds.size > 0
              ? `Imprimir selección (${selectedDrumIds.size})`
              : 'Imprimir listado'}
          </Button>

          <Link to="/tambores/nuevo">
            <Button variant="primary" size="default">
              <PlusCircle className="w-4 h-4 mr-1.5" />
              Nuevo Tambor
            </Button>
          </Link>
        </div>
      </div>

      {/* ---------------- BARRA DE BÚSQUEDA Y CONTROL DE FILTROS ---------------- */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-bone-400" />
            <input
              type="text"
              placeholder="Buscar por tambor (ej: T000001), código, lote, variedad, calibre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-bone-300 bg-white text-obsidian placeholder:text-bone-400 focus:outline-none focus:ring-2 focus:ring-olive-700/20 focus:border-olive-700 shadow-soft-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-bone-400 hover:text-obsidian p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <Button
            variant={showFilters ? 'secondary' : 'outline'}
            size="default"
            onClick={() => setShowFilters(!showFilters)}
            className="w-full sm:w-auto text-xs font-medium"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 mr-1.5" />
            <span>Filtros avanzados</span>
            {hasActiveFilters && (
              <span className="ml-1.5 w-2 h-2 rounded-full bg-olive-700" />
            )}
          </Button>

          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-xs text-olive-800 hover:underline font-mono px-2 py-1"
            >
              Limpiar filtros
            </button>
          )}
        </div>

        {/* Panel Desplegable de Filtros por Catálogo */}
        {showFilters && (
          <div className="bezel-shell animate-in slide-in-from-top-2 duration-200">
            <div className="bezel-core p-4 bg-bone-50/50 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-xs">
              <div>
                <label className="font-mono text-bone-500 block mb-1">Producto</label>
                <select
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className="w-full p-2 rounded-lg border border-bone-300 bg-white text-obsidian"
                >
                  <option value="">Todos</option>
                  {productCats.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-mono text-bone-500 block mb-1">Presentación</label>
                <select
                  value={selectedPresentation}
                  onChange={(e) => setSelectedPresentation(e.target.value)}
                  className="w-full p-2 rounded-lg border border-bone-300 bg-white text-obsidian"
                >
                  <option value="">Todas</option>
                  {presentationCats.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-mono text-bone-500 block mb-1">Variedad</label>
                <select
                  value={selectedVariety}
                  onChange={(e) => setSelectedVariety(e.target.value)}
                  className="w-full p-2 rounded-lg border border-bone-300 bg-white text-obsidian"
                >
                  <option value="">Todas</option>
                  {varietyCats.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-mono text-bone-500 block mb-1">Calibre</label>
                <select
                  value={selectedCaliber}
                  onChange={(e) => setSelectedCaliber(e.target.value)}
                  className="w-full p-2 rounded-lg border border-bone-300 bg-white text-obsidian"
                >
                  <option value="">Todos</option>
                  {caliberCats.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-mono text-bone-500 block mb-1">Calidad</label>
                <select
                  value={selectedQuality}
                  onChange={(e) => setSelectedQuality(e.target.value)}
                  className="w-full p-2 rounded-lg border border-bone-300 bg-white text-obsidian"
                >
                  <option value="">Todas</option>
                  {qualityCats.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-mono text-bone-500 block mb-1">Ubicación</label>
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full p-2 rounded-lg border border-bone-300 bg-white text-obsidian"
                >
                  <option value="">Todas</option>
                  {locationCats.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-mono text-bone-500 block mb-1">Estado</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full p-2 rounded-lg border border-bone-300 bg-white text-obsidian"
                >
                  <option value="">Todos</option>
                  {statusCats.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ---------------- RESUMEN ESTADÍSTICO DINÁMICO ---------------- */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-3.5 bg-bone-100/70 rounded-xl border border-bone-200 text-xs">
        <div className="flex items-center gap-4">
          <span className="font-semibold text-obsidian">
            {totals.totalDrums} {totals.totalDrums === 1 ? 'tambor encontrado' : 'tambores encontrados'}
          </span>
          <span className="text-bone-400">|</span>
          <span className="font-semibold text-obsidian font-serif text-sm">
            {formatKg(totals.totalKg)}
          </span>
          <span className="text-bone-400">|</span>
          <span className="text-bone-600">
            {totals.totalLocations} {totals.totalLocations === 1 ? 'ubicación ocupada' : 'ubicaciones ocupadas'}
          </span>
        </div>

        {selectedDrumIds.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="font-semibold text-olive-900 bg-olive-100 px-2 py-0.5 rounded font-mono">
              {selectedDrumIds.size} seleccionados
            </span>
            <button
              onClick={() => setSelectedDrumIds(new Set())}
              className="text-bone-500 hover:text-obsidian underline"
            >
              Deseleccionar
            </button>
          </div>
        )}
      </div>

      {/* ---------------- TABLA DE TAMBORES ---------------- */}
      <div className="bezel-shell">
        <div className="bezel-core p-0 overflow-x-auto bg-white">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-bone-200 bg-bone-50/80 font-mono text-[11px] text-bone-600 uppercase tracking-wider">
                <th className="p-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={
                      filteredDrums.length > 0 &&
                      selectedDrumIds.size === filteredDrums.length
                    }
                    onChange={handleSelectAll}
                    className="rounded text-olive-700 focus:ring-olive-700 cursor-pointer"
                  />
                </th>
                <th className="p-3 font-semibold">Identificación</th>
                <th className="p-3 font-semibold">Producto y Variedad</th>
                <th className="p-3 font-semibold">Calibre / Calidad</th>
                <th className="p-3 font-semibold">Lote</th>
                <th className="p-3 font-semibold text-right">Peso Neto</th>
                <th className="p-3 font-semibold">Ubicación</th>
                <th className="p-3 font-semibold">Estado</th>
                <th className="p-3 font-semibold">Ingreso</th>
                <th className="p-3 font-semibold text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bone-100">
              {filteredDrums.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-bone-500">
                    No se encontraron tambores con los criterios especificados.
                  </td>
                </tr>
              ) : (
                filteredDrums.map((drum) => {
                  const isChecked = selectedDrumIds.has(drum.tambor_id);
                  return (
                    <tr
                      key={drum.id}
                      onClick={() => navigate(`/tambores/${drum.tambor_id}`)}
                      className={`hover:bg-olive-50/40 cursor-pointer transition-colors ${
                        isChecked ? 'bg-olive-50/70' : ''
                      }`}
                    >
                      <td
                        className="p-3 text-center"
                        onClick={(e) => handleToggleSelectDrum(drum.tambor_id, e)}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="rounded text-olive-700 focus:ring-olive-700 cursor-pointer"
                        />
                      </td>

                      {/* ID y Código Completo */}
                      <td className="p-3">
                        <span className="font-mono font-bold text-xs text-obsidian bg-bone-100 px-2 py-0.5 rounded">
                          {drum.tambor_id}
                        </span>
                        <span className="block font-mono text-[10px] text-bone-500 mt-0.5 truncate max-w-[140px]">
                          {drum.codigo_descriptivo}
                        </span>
                      </td>

                      {/* Producto & Variedad */}
                      <td className="p-3">
                        <span className="font-semibold text-obsidian block">
                          {resolveCatalogName(catalogos, drum.variedad, 'variedad')}
                        </span>
                        <span className="text-bone-500 text-[11px] block">
                          {resolveCatalogName(catalogos, drum.producto, 'producto')} ·{' '}
                          {resolveCatalogName(catalogos, drum.presentacion, 'presentacion')}
                        </span>
                      </td>

                      {/* Calibre & Calidad */}
                      <td className="p-3">
                        <span className="font-mono font-medium text-bone-800">
                          {resolveCatalogName(catalogos, drum.calibre, 'calibre')}
                        </span>
                        <span className="text-bone-500 text-[11px] block">
                          {resolveCatalogName(catalogos, drum.calidad, 'calidad')}
                        </span>
                      </td>

                      {/* Lote */}
                      <td className="p-3 font-mono text-bone-700">
                        {drum.lote}
                      </td>

                      {/* Peso Neto */}
                      <td className="p-3 font-mono font-bold text-obsidian text-right whitespace-nowrap">
                        {drum.peso} kg
                      </td>

                      {/* Ubicación */}
                      <td className="p-3">
                        <Badge variant="outline" className="font-medium text-bone-800">
                          {resolveCatalogName(catalogos, drum.ubicacion, 'ubicacion')}
                        </Badge>
                      </td>

                      {/* Estado */}
                      <td className="p-3">
                        <Badge variant="paleGreen" dot className="text-[11px]">
                          {resolveCatalogName(catalogos, drum.estado, 'estado')}
                        </Badge>
                      </td>

                      {/* Fecha de Ingreso */}
                      <td className="p-3 font-mono text-bone-500 text-[11px] whitespace-nowrap">
                        {formatDate(drum.fecha_ingreso)}
                      </td>

                      {/* Acciones */}
                      <td
                        className="p-3 text-center whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handlePrintSingleDrum(drum)}
                            className="p-1.5 rounded-lg text-bone-600 hover:text-obsidian hover:bg-bone-100 transition-colors cursor-pointer"
                            title="Imprimir etiqueta"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <Link
                            to={`/tambores/${drum.tambor_id}`}
                            className="p-1.5 rounded-lg text-olive-800 hover:text-olive-950 hover:bg-olive-100"
                            title="Abrir ficha"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    {/* Impresión directa de tambor individual (oculto en pantalla, activo al imprimir) */}
    {singleDrumToPrint && (
      <div className="print-only">
        <PhysicalLabel
          drum={{
            ...singleDrumToPrint,
            ubicacion_nombre: resolveCatalogName(catalogos, singleDrumToPrint.ubicacion, 'ubicacion'),
          }}
          widthMm={50}
          heightMm={100}
          showBorder={false}
        />
      </div>
    )}
  </>
  );
}
