/**
 * OLIVÍCOLA LUJÁN · Módulo de Control de Calidad y Muestreo
 * Permite al perfil de Calidad autorizar o retener lotes de tambores,
 * registrar parámetros físico-químicos de laboratorio (pH, salinidad, acidez)
 * y registrar los movimientos oficiales de inspección en el historial inalterable.
 */

import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  FlaskConical,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
  Layers,
  ArrowRight,
  ClipboardList,
  Check,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import { loadDatabase, authorizeQualityLot } from '../api/repository.js';
import { resolveCatalogName } from '../lib/domain.js';
import { useAuth, PERMISOS } from '../components/Auth.jsx';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card.jsx';
import { Button } from '../components/ui/button.jsx';
import { Input } from '../components/ui/input.jsx';
import { Badge } from '../components/ui/badge.jsx';
import { formatDateTime } from '../lib/utils.js';

export function QualityPage() {
  const { user, can } = useAuth();
  const [db, setDb] = useState(loadDatabase());
  const { tambores = [], catalogos = [] } = db || {};

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('PENDIENTES'); // 'ALL' | 'PENDIENTES' | 'APROBADOS' | 'RETENIDOS'
  const [selectedDrumIds, setSelectedDrumIds] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const handleUpdate = () => setDb(loadDatabase());
    window.addEventListener('olivicola-db-updated', handleUpdate);
    return () => window.removeEventListener('olivicola-db-updated', handleUpdate);
  }, []);

  // Formulario de inspección de calidad
  const [inspectionForm, setInspectionForm] = useState({
    targetStatus: 'cat-est-5', // Aprobado calidad
    observaciones: '',
    ph: '3.85',
    salinidad: '8.2',
    acidez: '0.45',
    textura: 'Firme, sin defectos perceptibles',
  });

  // Clasificación de tambores
  const drumsWithNames = useMemo(() => {
    const cats = catalogos || [];
    return (tambores || []).map((t) => {
      const estadoObj = cats.find((c) => c.id === t.estado && c.tipo === 'estado');
      const ubiObj = cats.find((c) => c.id === t.ubicacion && c.tipo === 'ubicacion');
      const prodObj = cats.find((c) => c.id === t.producto && c.tipo === 'producto');
      const varObj = cats.find((c) => c.id === t.variedad && c.tipo === 'variedad');

      return {
        ...t,
        estado_nombre: estadoObj?.nombre || t.estado,
        estado_codigo: estadoObj?.codigo || '',
        ubicacion_nombre: ubiObj?.nombre || t.ubicacion,
        producto_nombre: prodObj?.nombre || t.producto,
        variedad_nombre: varObj?.nombre || t.variedad,
      };
    });
  }, [tambores, catalogos]);

  // Contadores para métricas
  const stats = useMemo(() => {
    const pendientes = drumsWithNames.filter((d) => d.estado_codigo !== 'APRO' && d.estado_codigo !== 'RETE');
    const aprobados = drumsWithNames.filter((d) => d.estado_codigo === 'APRO' || d.estado_codigo === 'LIST');
    const retenidos = drumsWithNames.filter((d) => d.estado_codigo === 'RETE');
    return {
      pendientes: pendientes.length,
      aprobados: aprobados.length,
      retenidos: retenidos.length,
      total: drumsWithNames.length,
    };
  }, [drumsWithNames]);

  // Filtrado de la lista
  const filteredDrums = useMemo(() => {
    return drumsWithNames.filter((drum) => {
      if (statusFilter === 'PENDIENTES') {
        if (drum.estado_codigo === 'APRO' || drum.estado_codigo === 'LIST') return false;
      } else if (statusFilter === 'APROBADOS') {
        if (drum.estado_codigo !== 'APRO' && drum.estado_codigo !== 'LIST') return false;
      } else if (statusFilter === 'RETENIDOS') {
        if (drum.estado_codigo !== 'RETE') return false;
      }

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        drum.tambor_id?.toLowerCase().includes(q) ||
        drum.lote?.toLowerCase().includes(q) ||
        drum.codigo_descriptivo?.toLowerCase().includes(q) ||
        drum.producto_nombre?.toLowerCase().includes(q) ||
        drum.variedad_nombre?.toLowerCase().includes(q)
      );
    });
  }, [drumsWithNames, statusFilter, searchQuery]);

  // Selección individual o en masa
  const handleToggleSelectDrum = (id) => {
    setSelectedDrumIds((prev) =>
      prev.includes(id) ? prev.filter((dId) => dId !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = () => {
    if (selectedDrumIds.length === filteredDrums.length) {
      setSelectedDrumIds([]);
    } else {
      setSelectedDrumIds(filteredDrums.map((d) => d.id));
    }
  };

  const handleSelectByLot = (lote) => {
    const lotDrums = filteredDrums.filter((d) => d.lote === lote).map((d) => d.id);
    setSelectedDrumIds((prev) => Array.from(new Set([...prev, ...lotDrums])));
  };

  const canAuthorize = can(PERMISOS.AUTORIZAR_CALIDAD);

  // Enviar autorización / muestreo
  const handleExecuteInspection = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!canAuthorize) {
      setErrorMessage('Permiso denegado: Se requiere perfil de Control de Calidad o Administrador para autorizar o retener lotes.');
      return;
    }

    if (selectedDrumIds.length === 0) {
      setErrorMessage('Selecciona al menos un tambor de la lista para autorizar.');
      return;
    }

    try {
      const result = await authorizeQualityLot(
        {
          drumIds: selectedDrumIds,
          estadoNuevo: inspectionForm.targetStatus,
          observaciones: `${inspectionForm.observaciones ? `${inspectionForm.observaciones}. ` : ''}Textura: ${inspectionForm.textura}`,
          muestreoData: {
            ph: inspectionForm.ph,
            salinidad: inspectionForm.salinidad,
            acidez: inspectionForm.acidez,
          },
        },
        user
      );

      setDb(loadDatabase());
      setSelectedDrumIds([]);
      setSuccessMessage(
        `Inspección de calidad registrada: ${result.authorizedCount} tambores actualizados a "${result.estado}".`
      );
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      setErrorMessage(err.message || 'Error al autorizar lote de calidad');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-7xl mx-auto">
      {/* ---------------- CABECERA ---------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-bone-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase tracking-[0.2em] font-mono text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full font-semibold">
              Departamento de Calidad
            </span>
            <span className="text-bone-400 text-xs font-mono">· Autorización de Lotes y Muestreos</span>
          </div>
          <h2 className="font-serif text-3xl font-bold tracking-tight text-obsidian">
            Control de Calidad y Muestreo
          </h2>
          <p className="text-sm text-bone-600 mt-0.5">
            Inspección analítica, registro de parámetros físico-químicos y liberación de tambores para fraccionamiento o despacho.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/inventario">
            <Button variant="outline" size="sm" className="text-xs">
              <Layers className="w-3.5 h-3.5 mr-1.5" />
              Ver Inventario Completo
            </Button>
          </Link>
        </div>
      </div>

      {/* ---------------- TARJETAS DE MÉTRICAS ---------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          onClick={() => setStatusFilter('PENDIENTES')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            statusFilter === 'PENDIENTES'
              ? 'bg-amber-50/80 border-amber-300 shadow-soft-sm ring-2 ring-amber-400/30'
              : 'bg-white border-bone-200 hover:border-amber-200'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-amber-800">Pendientes de Muestreo</span>
            <FlaskConical className="w-4 h-4 text-amber-600" />
          </div>
          <div className="font-serif text-3xl font-black text-amber-950">{stats.pendientes}</div>
          <span className="text-[11px] text-amber-700">En fermentación, reposo o salmuera</span>
        </div>

        <div
          onClick={() => setStatusFilter('APROBADOS')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            statusFilter === 'APROBADOS'
              ? 'bg-emerald-50/80 border-emerald-300 shadow-soft-sm ring-2 ring-emerald-400/30'
              : 'bg-white border-bone-200 hover:border-emerald-200'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-emerald-800">Aprobados por Calidad</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="font-serif text-3xl font-black text-emerald-950">{stats.aprobados}</div>
          <span className="text-[11px] text-emerald-700">Listos para envasado o exportación</span>
        </div>

        <div
          onClick={() => setStatusFilter('RETENIDOS')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            statusFilter === 'RETENIDOS'
              ? 'bg-red-50/80 border-red-300 shadow-soft-sm ring-2 ring-red-400/30'
              : 'bg-white border-bone-200 hover:border-red-200'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-red-800">Retenidos para Análisis</span>
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
          <div className="font-serif text-3xl font-black text-red-950">{stats.retenidos}</div>
          <span className="text-[11px] text-red-700">Bloqueados por desvío de parámetros</span>
        </div>
      </div>

      {/* Alertas */}
      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-red-50 text-red-900 border border-red-200 text-xs font-semibold flex items-center gap-2">
          <X className="w-4 h-4 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ---------------- FILTROS DE BÚSQUEDA ---------------- */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-bone-400" />
          <input
            type="text"
            placeholder="Buscar por lote (ej: LOTE-2026), tambor ID, producto o variedad..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-bone-300 bg-white text-obsidian placeholder:text-bone-400 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {[
            { id: 'PENDIENTES', label: 'Pendientes' },
            { id: 'APROBADOS', label: 'Aprobados' },
            { id: 'RETENIDOS', label: 'Retenidos' },
            { id: 'ALL', label: 'Todos' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                statusFilter === tab.id
                  ? 'bg-obsidian text-bone-50 font-semibold'
                  : 'bg-white border border-bone-300 text-bone-700 hover:bg-bone-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ---------------- PANEL PRINCIPAL EN 2 COLUMNAS ---------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Izquierda: Tabla de Selección de Tambores */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="py-3 px-4 border-b border-bone-200 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-obsidian">
                  Tambores para Inspección ({filteredDrums.length})
                </CardTitle>
                <span className="text-xs text-bone-500 font-mono">
                  {selectedDrumIds.length} seleccionados
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAllFiltered}
                  className="text-xs h-7"
                >
                  {selectedDrumIds.length === filteredDrums.length ? 'Deseleccionar todos' : 'Seleccionar visibles'}
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-0 overflow-x-auto">
              {filteredDrums.length === 0 ? (
                <div className="text-center py-12 text-bone-500 text-xs">
                  No hay tambores que coincidan con el filtro seleccionado.
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-bone-50/80 border-b border-bone-200 text-bone-600 font-mono text-[10px] uppercase">
                      <th className="py-2.5 px-3 w-8 text-center">✓</th>
                      <th className="py-2.5 px-3">Identificador</th>
                      <th className="py-2.5 px-3">Lote</th>
                      <th className="py-2.5 px-3">Producto & Variedad</th>
                      <th className="py-2.5 px-3">Estado Actual</th>
                      <th className="py-2.5 px-3">Ubicación</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-bone-100">
                    {filteredDrums.map((drum) => {
                      const isSelected = selectedDrumIds.includes(drum.id);
                      return (
                        <tr
                          key={drum.id}
                          onClick={() => handleToggleSelectDrum(drum.id)}
                          className={`cursor-pointer transition-colors ${
                            isSelected ? 'bg-emerald-50/60 font-medium' : 'hover:bg-bone-50/80'
                          }`}
                        >
                          <td className="py-2.5 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="rounded border-bone-300 text-emerald-700 focus:ring-emerald-600"
                            />
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="font-mono font-bold text-obsidian bg-bone-100 px-1.5 py-0.5 rounded">
                              {drum.tambor_id}
                            </span>
                            <span className="block text-[10px] font-mono text-bone-500 truncate max-w-[150px]">
                              {drum.codigo_descriptivo}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectByLot(drum.lote);
                              }}
                              title="Seleccionar todo el lote"
                              className="font-mono text-emerald-800 hover:underline font-semibold"
                            >
                              {drum.lote}
                            </button>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="font-semibold text-obsidian block">
                              {drum.producto_nombre}
                            </span>
                            <span className="text-[11px] text-bone-500">
                              {drum.variedad_nombre} · {drum.calibre}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <Badge
                              variant={
                                drum.estado_codigo === 'APRO' || drum.estado_codigo === 'LIST'
                                  ? 'paleGreen'
                                  : drum.estado_codigo === 'RETE'
                                  ? 'paleRed'
                                  : 'paleBlue'
                              }
                              className="text-[10px]"
                            >
                              {drum.estado_nombre}
                            </Badge>
                          </td>
                          <td className="py-2.5 px-3 text-bone-600">
                            {drum.ubicacion_nombre}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Columna Derecha: Panel de Acción y Parámetros de Calidad */}
        <div className="space-y-4">
          <Card className="sticky top-6">
            <CardHeader className="py-3 px-4 border-b border-bone-200 bg-bone-50/60">
              <CardTitle className="text-sm font-bold text-obsidian flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-emerald-700" />
                <span>Dictamen y Muestreo de Lote</span>
              </CardTitle>
              <p className="text-[11px] text-bone-600">
                Aplica la resolución a los {selectedDrumIds.length} tambor(es) marcados.
              </p>
            </CardHeader>

            <CardContent className="p-4 space-y-4 text-xs">
              <form onSubmit={handleExecuteInspection} className="space-y-4">
                {/* Dictamen / Estado Final */}
                <div>
                  <label className="font-semibold text-bone-800 block mb-1">
                    Dictamen de Calidad *
                  </label>
                  <select
                    value={inspectionForm.targetStatus}
                    onChange={(e) => setInspectionForm({ ...inspectionForm, targetStatus: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-bone-300 bg-white font-medium text-obsidian focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
                  >
                    <option value="cat-est-5">✓ Aprobado Calidad (Liberado)</option>
                    <option value="cat-est-6">✗ Retenido para Análisis (Observado)</option>
                    <option value="cat-est-7">✓ Listo para Despacho Comercial</option>
                  </select>
                </div>

                {/* Parámetros Físico-Químicos de Laboratorio */}
                <div className="p-3 bg-bone-100/50 rounded-xl space-y-3 border border-bone-200">
                  <span className="font-mono text-[10px] uppercase font-bold tracking-wider text-bone-600 block">
                    Parámetros de Laboratorio
                  </span>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[11px] text-bone-600 block mb-0.5">pH</label>
                      <Input
                        value={inspectionForm.ph}
                        onChange={(e) => setInspectionForm({ ...inspectionForm, ph: e.target.value })}
                        placeholder="3.8"
                        className="text-center px-1.5 font-mono text-sm tracking-normal"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-bone-600 block mb-0.5">Salinidad (%)</label>
                      <Input
                        value={inspectionForm.salinidad}
                        onChange={(e) => setInspectionForm({ ...inspectionForm, salinidad: e.target.value })}
                        placeholder="8.5"
                        className="text-center px-1.5 font-mono text-sm tracking-normal"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-bone-600 block mb-0.5">Acidez (%)</label>
                      <Input
                        value={inspectionForm.acidez}
                        onChange={(e) => setInspectionForm({ ...inspectionForm, acidez: e.target.value })}
                        placeholder="0.4"
                        className="text-center px-1.5 font-mono text-sm tracking-normal"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-bone-600 block mb-0.5">Textura & Aspecto</label>
                    <Input
                      value={inspectionForm.textura}
                      onChange={(e) => setInspectionForm({ ...inspectionForm, textura: e.target.value })}
                      placeholder="Firme, sin defectos..."
                    />
                  </div>
                </div>

                {/* Observaciones */}
                <div>
                  <label className="font-semibold text-bone-800 block mb-1">
                    Observaciones y Acta de Muestreo
                  </label>
                  <textarea
                    rows={2}
                    value={inspectionForm.observaciones}
                    onChange={(e) => setInspectionForm({ ...inspectionForm, observaciones: e.target.value })}
                    placeholder="Detalles de la muestra, toma de tanque o indicaciones de almacenamiento..."
                    className="w-full p-2.5 rounded-xl border border-bone-300 bg-white text-obsidian text-xs focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
                  />
                </div>

                {/* Responsable */}
                <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-100 flex items-center justify-between text-[11px] text-emerald-900">
                  <span className="font-medium">Responsable:</span>
                  <span className="font-semibold">{user?.nombre} ({user?.cargo || user?.rol})</span>
                </div>

                {!canAuthorize && (
                  <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>Perfil actual ({user?.rol}) en modo consulta. Se requiere Calidad o Administrador para dictaminar.</span>
                  </div>
                )}

                {/* Botón de Ejecución */}
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full bg-emerald-800 hover:bg-emerald-900 text-bone-50 text-xs py-2.5"
                  disabled={selectedDrumIds.length === 0 || !canAuthorize}
                >
                  <ShieldCheck className="w-4 h-4 mr-1.5" />
                  {canAuthorize ? `Autorizar ${selectedDrumIds.length} Tambor(es)` : 'Requiere Perfil de Calidad'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
