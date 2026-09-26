import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  QrCode,
  Layers,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Copy,
  RotateCcw,
  Printer,
  FileText,
  UploadCloud,
  Check,
  Building2,
  Boxes,
  HelpCircle,
} from 'lucide-react';
import { loadDatabase, applyInventoryAudit } from '../api/repository.js';
import { parseInventoryScanStream, resolveCatalogName } from '../lib/domain.js';
import { formatKg } from '../lib/utils.js';
import { useAuth } from '../components/Auth.jsx';
import { Button } from '../components/ui/button.jsx';
import { Badge } from '../components/ui/badge.jsx';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card.jsx';

export function InventoryAuditPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [db, setDb] = useState(loadDatabase());
  const { tambores, catalogos } = db;

  const [activeTab, setActiveTab] = useState('batch'); // 'batch' | 'live'
  const [batchText, setBatchText] = useState(
    location.state?.initialSector ? `${location.state.initialSector}\n` : ''
  );
  const [liveScans, setLiveScans] = useState([]);
  const [liveInput, setLiveInput] = useState('');
  const [currentLiveSector, setCurrentLiveSector] = useState(null);

  const [auditResult, setAuditResult] = useState(null);
  const [appliedSummary, setAppliedSummary] = useState(null);
  const [isApplying, setIsApplying] = useState(false);

  const liveInputRef = useRef(null);

  // Mantener foco en modo en vivo
  useEffect(() => {
    if (activeTab === 'live') {
      liveInputRef.current?.focus();
    }
  }, [activeTab]);

  // Datos de ejemplo para demostración de planta
  const handleLoadDemoBatch = () => {
    const exampleDrums = tambores.slice(0, 11);
    const demoLines = [
      '// --- SECTOR 1: Nave A - Fila 1 ---',
      'NAV-A1',
      // Generar lote de tambores con mismo contenido descriptivo y distinto ID
      ...exampleDrums.map((d) => d.codigo || `${d.codigo_descriptivo}-${d.tambor_id}`),
      // Agregar un duplicado intencional para demostrar prevención de doble conteo
      exampleDrums[0]?.codigo || 'ENT-VDE-ALOR-121/140-PRI-T000001',
      '// --- SECTOR 2: Nave A - Fila 2 ---',
      'NAV-A2',
      'ENT-VDE-ARA-121/140-PRI-T000012',
      'ENT-VDE-ARA-121/140-PRI-T000013',
    ];
    setBatchText(demoLines.join('\n'));
    setAuditResult(null);
    setAppliedSummary(null);
  };

  const handleProcessBatch = () => {
    if (!batchText.trim()) return;
    // Filtrar líneas de comentarios si el operador pegó notas
    const cleaned = batchText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('//') && !l.startsWith('#'))
      .join('\n');

    const result = parseInventoryScanStream(cleaned, { catalogos, tambores });
    setAuditResult(result);
    setAppliedSummary(null);
  };

  const handleLiveSubmit = (e) => {
    e.preventDefault();
    const token = liveInput.trim();
    if (!token) return;

    // Detectar si es cambio de sector
    const parsedLine = parseInventoryScanStream(token, { catalogos, tambores });
    if (parsedLine.sectorsCount > 0 && parsedLine.sectors[0]?.sector.id !== 'unassigned') {
      setCurrentLiveSector(parsedLine.sectors[0].sector);
    }

    setLiveScans((prev) => [...prev, token]);
    setLiveInput('');
    liveInputRef.current?.focus();
  };

  const handleProcessLiveScans = () => {
    if (liveScans.length === 0) return;
    const result = parseInventoryScanStream(liveScans, { catalogos, tambores });
    setAuditResult(result);
    setAppliedSummary(null);
  };

  const handleApplyAudit = async () => {
    if (!auditResult || isApplying) return;
    setIsApplying(true);
    try {
      const summary = await applyInventoryAudit(auditResult, user);
      setAppliedSummary(summary);
      setDb(loadDatabase()); // Recargar base de datos local
    } catch (err) {
      console.error('Error al aplicar inventario:', err);
    } finally {
      setIsApplying(false);
    }
  };

  const handleClearAll = () => {
    setBatchText('');
    setLiveScans([]);
    setLiveInput('');
    setCurrentLiveSector(null);
    setAuditResult(null);
    setAppliedSummary(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-6xl mx-auto pb-16">
      {/* ---------------- CABECERA PRINCIPAL ---------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-bone-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase tracking-widest font-mono text-olive-800 bg-olive-100/70 px-2.5 py-0.5 rounded-full font-semibold">
              Gestión de Planta · Modelo Gerencial
            </span>
            <span className="text-bone-400 text-xs font-mono">· Inventario por Sectores</span>
          </div>
          <h2 className="font-serif text-3xl font-bold tracking-tight text-obsidian">
            Toma de Inventario por Sectores
          </h2>
          <p className="text-sm text-bone-600 mt-0.5">
            Escanea el sector y sus tambores; la app asocia la ubicación, agrupa por código alfanumérico y previene duplicados por ID único.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/etiquetas" state={{ mode: 'sectores' }}>
            <Button variant="outline" size="sm" className="text-xs">
              <Printer className="w-3.5 h-3.5 mr-1.5" />
              Imprimir Códigos de Sectores
            </Button>
          </Link>
          <Link to="/inventario">
            <Button variant="secondary" size="sm" className="text-xs">
              Ver Inventario Activo
            </Button>
          </Link>
        </div>
      </div>

      {/* ---------------- TARJETA EXPLICATIVA DEL PROCEDIMIENTO ---------------- */}
      <div className="bezel-shell">
        <div className="bezel-core p-4 sm:p-5 bg-olive-50/40 border border-olive-200/70">
          <div className="flex items-start gap-3.5">
            <div className="p-2 rounded-xl bg-olive-900 text-bone-50 shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="space-y-1 text-xs">
              <h4 className="font-serif font-bold text-obsidian text-sm">
                Procedimiento Operativo de Planta
              </h4>
              <p className="text-bone-700 leading-relaxed">
                <strong>1. Código de Sector:</strong> Cada sector de la planta (ej: <code>NAV-A1</code>, <code>NAV-A2</code>) tiene su código de barra en columna/poste.{' '}
                <strong>2. Lectura secuencial:</strong> El operario lee primero el código del sector y luego todos los tambores de dicho sector.{' '}
                <strong>3. Volcado y deduplicación:</strong> Los datos se almacenan en la memoria interna del escáner y se vuelcan aquí. La app identifica el sector, contabiliza tambores con igual contenido agrupándolos y desambigua con el ID único para evitar duplicaciones.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ---------------- PESTAÑAS: VOLCADO DE MEMORIA vs ESCANEO EN VIVO ---------------- */}
      <div className="bezel-shell">
        <div className="bezel-core p-6 bg-white space-y-5">
          <div className="flex items-center justify-between border-b border-bone-200 pb-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('batch')}
                className={`px-4 py-2 rounded-xl text-xs font-mono font-semibold transition-all ${
                  activeTab === 'batch'
                    ? 'bg-obsidian text-bone-50 shadow-soft-sm'
                    : 'bg-bone-100 text-bone-700 hover:bg-bone-200'
                }`}
              >
                1. Volcado Masivo (Memoria de Escáner / Tabla)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('live')}
                className={`px-4 py-2 rounded-xl text-xs font-mono font-semibold transition-all ${
                  activeTab === 'live'
                    ? 'bg-obsidian text-bone-50 shadow-soft-sm'
                    : 'bg-bone-100 text-bone-700 hover:bg-bone-200'
                }`}
              >
                2. Escaneo en Vivo (Pistola USB Continua)
              </button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="text-xs text-bone-500 hover:text-red-700"
              >
                Limpiar Todo
              </Button>
            </div>
          </div>

          {/* TAB 1: VOLCADO MASIVO */}
          {activeTab === 'batch' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono uppercase tracking-wider text-bone-600 font-bold">
                  Pega o descarga la memoria del escáner (un código por línea):
                </label>
                <button
                  type="button"
                  onClick={handleLoadDemoBatch}
                  className="text-xs font-mono text-olive-800 hover:text-olive-950 underline cursor-pointer"
                >
                  + Cargar Lote de Ejemplo (11 tambores con mismo código y distinto ID)
                </button>
              </div>

              <textarea
                value={batchText}
                onChange={(e) => setBatchText(e.target.value)}
                placeholder="NAV-A1&#10;ENT-VDE-ALOR-121/140-PRI-T000001&#10;ENT-VDE-ALOR-121/140-PRI-T000002&#10;ENT-VDE-ALOR-121/140-PRI-T000003&#10;NAV-A2&#10;ENT-VDE-ARA-121/140-PRI-T000004"
                rows={8}
                className="w-full p-4 font-mono text-xs rounded-xl border border-bone-300 focus:border-olive-700 focus:ring-2 focus:ring-olive-700/10 bg-bone-50/50 text-obsidian placeholder:text-bone-400"
              />

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs font-mono text-bone-500">
                  {batchText.trim() ? `${batchText.trim().split('\n').length} líneas cargadas` : 'Sin datos'}
                </span>
                <Button
                  type="button"
                  variant="primary"
                  size="default"
                  onClick={handleProcessBatch}
                  disabled={!batchText.trim()}
                  className="text-xs font-mono"
                >
                  <FileText className="w-4 h-4 mr-1.5" />
                  Procesar Lecturas del Escáner
                </Button>
              </div>
            </div>
          )}

          {/* TAB 2: ESCANEO EN VIVO */}
          {activeTab === 'live' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between bg-bone-50 p-3 rounded-xl border border-bone-200">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-mono font-bold text-obsidian">
                    Sector Activo:{' '}
                    <span className="text-olive-900 bg-olive-100 px-2 py-0.5 rounded">
                      {currentLiveSector ? `${currentLiveSector.codigo} (${currentLiveSector.nombre})` : 'Ninguno (escanea código de sector)'}
                    </span>
                  </span>
                </div>
                <span className="text-xs font-mono text-bone-500">
                  {liveScans.length} lecturas acumuladas
                </span>
              </div>

              <form onSubmit={handleLiveSubmit} className="flex gap-2">
                <input
                  ref={liveInputRef}
                  type="text"
                  value={liveInput}
                  onChange={(e) => setLiveInput(e.target.value)}
                  placeholder="Apunta la pistola y lee sector o tambor (Enter automático)..."
                  className="flex-1 px-4 py-3 text-sm font-mono rounded-xl border border-bone-300 focus:border-olive-700 bg-white"
                />
                <Button type="submit" variant="secondary" className="text-xs font-mono">
                  Registrar
                </Button>
              </form>

              {liveScans.length > 0 && (
                <div className="space-y-2">
                  <div className="max-h-40 overflow-y-auto p-3 bg-bone-50 rounded-xl border border-bone-200 font-mono text-xs space-y-1">
                    {liveScans.map((s, idx) => (
                      <div key={idx} className="flex items-center justify-between text-bone-700">
                        <span>
                          {idx + 1}. {s}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end pt-2">
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={handleProcessLiveScans}
                      className="text-xs font-mono"
                    >
                      Procesar {liveScans.length} Lecturas Acumuladas
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ---------------- MENSAJE DE ÉXITO AL APLICAR ---------------- */}
      {appliedSummary && (
        <div className="bezel-shell animate-in slide-in-from-top-4 duration-300">
          <div className="bezel-core p-6 bg-emerald-50 border border-emerald-200 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <Check className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-emerald-950">
                  Inventario Aplicado y Trazabilidad Actualizada
                </h3>
                <p className="text-xs text-emerald-800">
                  Se auditaron {appliedSummary.auditedCount || auditResult?.validDrumsCount || 0} tambores en planta ({appliedSummary.relocationsApplied} reubicados),
                  creando {appliedSummary.movementsCreated} movimientos de trazabilidad y eventos de auditoría inalterables en el historial.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              <Link to="/inventario">
                <Button variant="outline" size="sm" className="text-xs bg-white border-emerald-300 text-emerald-900">
                  Ver Inventario Actualizado →
                </Button>
              </Link>
              <Link to="/historial">
                <Button variant="outline" size="sm" className="text-xs bg-white border-emerald-300 text-emerald-900">
                  Consultar Historial de Movimientos →
                </Button>
              </Link>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleClearAll}
                className="text-xs"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                Nueva Toma de Inventario
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- PANEL DE RESULTADOS INTELIGENTE ---------------- */}
      {auditResult && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
          {/* Alerta si hay tambores huérfanos sin sector */}
          {auditResult.sectors.some((s) => s.sector.id === 'unassigned') && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-900 flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold">Tambores leídos sin sector previo:</span>
                <p className="text-amber-800">
                  Se detectaron lecturas de tambores antes de escanear el código de un sector. Estos tambores figuran en "Sin Sector Asignado" y no se reubicarán en el sistema hasta que se indique su sector.
                </p>
              </div>
            </div>
          )}
          {/* Métricas KPI Globales */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-4 rounded-2xl bg-white border border-bone-200 space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-bone-500 block">
                Tambores Únicos
              </span>
              <span className="font-serif text-2xl font-bold text-obsidian block">
                {auditResult.validDrumsCount}
              </span>
              <span className="text-[10px] font-mono text-bone-500">
                {formatKg(auditResult.totalKg)}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-bone-200 space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-bone-500 block">
                Sectores Leídos
              </span>
              <span className="font-serif text-2xl font-bold text-olive-900 block">
                {auditResult.sectorsCount}
              </span>
              <span className="text-[10px] font-mono text-bone-500">Ubicaciones activas</span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-bone-200 space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-bone-500 block">
                Grupos Alfanuméricos
              </span>
              <span className="font-serif text-2xl font-bold text-obsidian block">
                {auditResult.sectors.reduce((acc, s) => acc + s.groups.length, 0)}
              </span>
              <span className="text-[10px] font-mono text-bone-500">Por tipo de producto</span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-bone-200 space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-bone-500 block">
                Duplicados Omitidos
              </span>
              <span className="font-serif text-2xl font-bold text-emerald-700 block">
                {auditResult.duplicatesCount}
              </span>
              <span className="text-[10px] font-mono text-emerald-600">Sin doble cómputo</span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-bone-200 space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-bone-500 block">
                Reubicaciones
              </span>
              <span className={`font-serif text-2xl font-bold block ${auditResult.relocationsCount > 0 ? 'text-amber-700' : 'text-bone-600'}`}>
                {auditResult.relocationsCount}
              </span>
              <span className="text-[10px] font-mono text-bone-500">Cambio de sector</span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-bone-200 space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-bone-500 block">
                Faltantes en Sector
              </span>
              <span className={`font-serif text-2xl font-bold block ${auditResult.missingCount > 0 ? 'text-rose-700' : 'text-bone-600'}`}>
                {auditResult.missingCount}
              </span>
              <span className="text-[10px] font-mono text-bone-500">Registrados no leídos</span>
            </div>
          </div>

          {/* Botón de acción destacado para aplicar */}
          <div className="bezel-shell">
            <div className="bezel-core p-4 sm:p-5 bg-white flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="font-serif font-bold text-obsidian text-base">
                  Conciliación de Inventario Lista
                </h4>
                <p className="text-xs text-bone-600">
                  {auditResult.relocationsCount > 0
                    ? `Se detectaron ${auditResult.relocationsCount} tambores en sectores diferentes a los registrados. Al confirmar, el sistema registrará los movimientos de trazabilidad y actualizará las ubicaciones.`
                    : 'Todos los tambores coinciden con sus sectores asignados en el sistema.'}
                </p>
              </div>

              <Button
                variant="primary"
                size="default"
                disabled={isApplying || appliedSummary !== null}
                onClick={handleApplyAudit}
                className="text-xs font-mono shrink-0"
              >
                <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-400" />
                {isApplying
                  ? 'Aplicando Cambios...'
                  : appliedSummary
                  ? 'Inventario Aplicado ✓'
                  : 'Confirmar y Aplicar Inventario a Trazabilidad'}
              </Button>
            </div>
          </div>

          {/* DESGLOSE DETALLADO POR SECTOR */}
          <div className="space-y-4">
            <h3 className="font-serif text-xl font-bold text-obsidian">
              Detalle y Agrupaciones por Sector
            </h3>

            {auditResult.sectors.map((sec) => (
              <div key={sec.sector.id} className="bezel-shell">
                <div className="bezel-core p-5 sm:p-6 bg-white space-y-4">
                  {/* Encabezado del Sector */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-bone-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-olive-900 text-bone-50 flex items-center justify-center font-mono font-bold text-xs">
                        {sec.sector.codigo || 'SEC'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-serif text-lg font-bold text-obsidian">
                            {sec.sector.nombre || sec.sector.codigo}
                          </h4>
                          <Badge variant="outline" className="font-mono text-xs">
                            Código: {sec.sector.codigo}
                          </Badge>
                        </div>
                        <p className="text-xs text-bone-500 font-mono">
                          {sec.totalDrums} {sec.totalDrums === 1 ? 'tambor' : 'tambores'} · Total: {formatKg(sec.totalKg)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {sec.duplicatesCount > 0 && (
                        <span className="text-[11px] font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-lg font-semibold">
                          {sec.duplicatesCount} duplicado{sec.duplicatesCount === 1 ? '' : 's'} prevenido{sec.duplicatesCount === 1 ? '' : 's'}
                        </span>
                      )}
                      {sec.relocationsCount > 0 && (
                        <span className="text-[11px] font-mono bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-lg font-semibold">
                          {sec.relocationsCount} reubicado{sec.relocationsCount === 1 ? '' : 's'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Agrupaciones Alfanuméricas (ej: 11 tambores de ENT-VDE-ALOR-121/140-PRI) */}
                  <div className="space-y-3">
                    <span className="text-xs font-mono uppercase tracking-wider text-bone-600 font-bold block">
                      Agrupación por Código Alfanumérico:
                    </span>

                    {sec.groups.map((group, gIdx) => (
                      <div
                        key={gIdx}
                        className="p-4 rounded-xl border border-bone-200 bg-bone-50/50 space-y-2.5"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-base font-black font-mono text-obsidian">
                              {group.count} {group.count === 1 ? 'tambor' : 'tambores'} de
                            </span>
                            <span className="font-mono font-bold text-sm bg-white border border-bone-300 px-2 py-0.5 rounded text-olive-950">
                              {group.codigo_descriptivo}
                            </span>
                          </div>
                          <span className="font-mono text-xs text-bone-600 font-bold">
                            Peso acumulado: {formatKg(group.totalKg)}
                          </span>
                        </div>

                        {/* Chips con los IDs individuales únicos */}
                        <div className="space-y-1">
                          <span className="text-[10px] font-mono uppercase text-bone-500 block">
                            Identificadores individuales únicos (Control de duplicados e inventario):
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {group.drums.map((d, dIdx) => (
                              <Link
                                key={dIdx}
                                to={d.tambor_id ? `/tambores/${d.tambor_id}` : '#'}
                                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border transition-colors flex items-center gap-1.5 ${
                                  d.isRelocated
                                    ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                                    : d.isUnregistered
                                    ? 'bg-rose-50 text-rose-900 border-rose-300 hover:bg-rose-100'
                                    : 'bg-white text-obsidian border-bone-300 hover:border-olive-600'
                                }`}
                                title={
                                  d.isRelocated
                                    ? `Reubicado (estaba registrado en otra ubicación)`
                                    : d.isUnregistered
                                    ? 'No registrado en base de datos'
                                    : 'Verificado en este sector'
                                }
                              >
                                <span>{d.tambor_id || d.raw}</span>
                                {d.isRelocated && (
                                  <span className="text-[9px] bg-amber-200 text-amber-900 px-1 rounded uppercase">
                                    Movido
                                  </span>
                                )}
                                {d.isUnregistered && (
                                  <span className="text-[9px] bg-rose-200 text-rose-900 px-1 rounded uppercase">
                                    Nuevo
                                  </span>
                                )}
                              </Link>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Alerta de Discrepancias / Faltantes si existen */}
                  {sec.missingDrums && sec.missingDrums.length > 0 && (
                    <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs space-y-2">
                      <div className="flex items-center gap-2 text-rose-900 font-bold">
                        <AlertTriangle className="w-4 h-4 text-rose-600" />
                        <span>
                          {sec.missingDrums.length} tambores figuraban en este sector en el sistema pero no fueron leídos en este escaneo:
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 font-mono">
                        {sec.missingDrums.map((m) => (
                          <Link
                            key={m.id}
                            to={`/tambores/${m.tambor_id}`}
                            className="bg-white text-rose-900 border border-rose-300 px-2 py-0.5 rounded text-[11px] hover:bg-rose-100"
                          >
                            {m.tambor_id} ({m.codigo_descriptivo})
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Alerta de Duplicados Omitidos */}
                  {sec.duplicates && sec.duplicates.length > 0 && (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>
                          Se omitieron {sec.duplicates.length} lecturas redundantes del escáner ({sec.duplicates.map((d) => d.tamborId).join(', ')}) protegiendo la exactitud del conteo.
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default InventoryAuditPage;
