import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Printer,
  Edit3,
  Truck,
  Trash2,
  CheckCircle2,
  Clock,
  Layers,
  MapPin,
  Scale,
  Calendar,
  AlertTriangle,
  QrCode,
  Tag,
  Copy,
  Check,
  Download,
  FileCode,
} from 'lucide-react';
import {
  loadDatabase,
  recordDrumMovement,
  deleteDrum,
} from '../api/repository.js';
import { resolveCatalogName } from '../lib/domain.js';
import { formatDate, formatDateTime } from '../lib/utils.js';
import { generateDrumZPL, downloadZplFile, copyZplToClipboard } from '../lib/zpl.js';
import { useAuth } from '../components/Auth.jsx';
import { Button } from '../components/ui/button.jsx';
import { Badge } from '../components/ui/badge.jsx';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card.jsx';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../components/ui/dialog.jsx';
import { Input, Textarea } from '../components/ui/input.jsx';
import { BarcodeSvg, PhysicalLabel } from '../components/Barcode.jsx';

export function DrumDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [db, setDb] = useState(loadDatabase());
  const { tambores, catalogos, historial, movimientos } = db;

  // Buscar el tambor por id técnico o tambor_id
  const drum = tambores.find((d) => d.id === id || d.tambor_id?.toUpperCase() === id?.toUpperCase());

  // Diálogos modales
  const [movementDialogOpen, setMovementDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Formulario de Movimiento
  const [movementForm, setMovementForm] = useState({
    tipo: '',
    ubicacion_nueva: '',
    estado_nuevo: '',
    observaciones: '',
  });
  const [movementError, setMovementError] = useState('');
  const [isSubmittingMove, setIsSubmittingMove] = useState(false);

  // Confirmación de eliminación
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Copiado al portapapeles
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    if (!drum) return;
    navigator.clipboard.writeText(drum.codigo);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDirectPrint = () => {
    window.print();
  };

  const [copiedZpl, setCopiedZpl] = useState(false);

  const handleCopyZpl = async () => {
    if (!drum) return;
    const enrichedDrum = {
      ...drum,
      ubicacion_nombre: resolveCatalogName(catalogos, drum.ubicacion, 'ubicacion'),
    };
    const zpl = generateDrumZPL(enrichedDrum);
    const ok = await copyZplToClipboard(zpl);
    if (ok) {
      setCopiedZpl(true);
      setTimeout(() => setCopiedZpl(false), 2000);
    }
  };

  const handleDownloadZpl = () => {
    if (!drum) return;
    const enrichedDrum = {
      ...drum,
      ubicacion_nombre: resolveCatalogName(catalogos, drum.ubicacion, 'ubicacion'),
    };
    const zpl = generateDrumZPL(enrichedDrum);
    downloadZplFile(zpl, `tambor-${drum.tambor_id}-zebra-gc420t.zpl`);
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('print') === '1' || params.get('print') === 'true' || location.state?.autoPrint) {
      window.history.replaceState(null, '', location.pathname);
      const timer = setTimeout(() => {
        window.print();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [location.search, location.state, location.pathname]);

  const deletedHistory = (historial || []).filter(
    (h) => h.tambor_id?.toUpperCase() === id?.toUpperCase() || h.tambor_ref === id
  );

  if (!drum) {
    if (deletedHistory.length > 0) {
      return (
        <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl mx-auto">
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-serif text-lg font-bold text-obsidian">
                    Tambor {id} (Dado de Baja)
                  </h3>
                  <Badge variant="paleRed" className="text-[10px]">
                    Eliminado del inventario activo
                  </Badge>
                </div>
                <p className="text-xs text-amber-800 mt-1">
                  Este tambor fue retirado de planta o dado de baja. Su historial se conserva inalterable como constancia de su trazabilidad.
                </p>
              </div>
            </div>
            <Link to="/inventario">
              <Button variant="outline" size="sm" className="text-xs shrink-0">
                Volver al inventario
              </Button>
            </Link>
          </div>

          {/* Historial preservado */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Clock className="w-4 h-4 text-olive-800" />
                  <span>Historial de Auditoría Preservado</span>
                </CardTitle>
                <p className="text-xs text-bone-500 mt-0.5">
                  Registro inalterable de los eventos que ocurrieron durante la vida de este tambor.
                </p>
              </div>
              <span className="font-mono text-xs text-bone-500">
                {deletedHistory.length} {deletedHistory.length === 1 ? 'evento' : 'eventos'}
              </span>
            </CardHeader>
            <CardContent>
              <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-bone-200">
                {deletedHistory.map((evt) => (
                  <div key={evt.id} className="relative">
                    <div className="absolute -left-6 top-1 w-3 h-3 rounded-full border-2 border-white bg-olive-800 shadow-sm" />
                    <div className="p-4 rounded-xl border border-bone-200 bg-bone-50/50 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              evt.tipo === 'Creación'
                                ? 'paleGreen'
                                : evt.tipo === 'Movimiento'
                                ? 'paleBlue'
                                : evt.tipo === 'Eliminación'
                                ? 'paleRed'
                                : 'default'
                            }
                            className="text-[10px]"
                          >
                            {evt.tipo}
                          </Badge>
                          {evt.campo && (
                            <span className="font-mono text-bone-500 font-semibold">
                              [{evt.campo}]
                            </span>
                          )}
                        </div>
                        <span className="font-mono text-bone-500 text-[11px]">
                          {formatDateTime(evt.created_date)}
                        </span>
                      </div>
                      <p className="text-obsidian font-semibold">{evt.descripcion}</p>
                      {evt.campo && (
                        <div className="bg-white p-2 rounded-lg border border-bone-200 font-mono text-[11px] grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-red-700 block">Antes:</span>
                            <span className="text-bone-700">{evt.valor_anterior || '(vacío)'}</span>
                          </div>
                          <div>
                            <span className="text-emerald-700 block">Ahora:</span>
                            <span className="text-obsidian font-bold">{evt.valor_nuevo || '(vacío)'}</span>
                          </div>
                        </div>
                      )}
                      {evt.observaciones && (
                        <p className="text-bone-600 italic text-[11px]">
                          Nota: {evt.observaciones}
                        </p>
                      )}
                      <div className="text-[10px] text-bone-400 pt-1 border-t border-bone-100">
                        <span>Responsable: {evt.actor || 'Operario Planta'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="text-center py-16 space-y-4 max-w-md mx-auto">
        <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 mx-auto flex items-center justify-center">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-obsidian">
          Tambor No Encontrado
        </h2>
        <p className="text-sm text-bone-600">
          No se encontró ningún tambor activo con el identificador «{id}». Puede haber sido eliminado o el número es incorrecto.
        </p>
        <Link to="/inventario">
          <Button variant="primary">Volver al Inventario</Button>
        </Link>
      </div>
    );
  }

  // Filtrar eventos de historial para este tambor
  const drumHistory = (historial || []).filter(
    (h) => h.tambor_id === drum.tambor_id || h.tambor_ref === drum.id
  );

  // Filtrar movimientos de este tambor
  const drumMovements = (movimientos || []).filter(
    (m) => m.tambor_id === drum.tambor_id || m.tambor_ref === drum.id
  );

  // Opciones de catálogo activas (incluyendo la actual del tambor si está inactiva)
  const activeMovementTypes = catalogos.filter((c) => c.tipo === 'tipo_movimiento' && c.activo);
  const activeLocations = catalogos.filter(
    (c) => c.tipo === 'ubicacion' && (c.activo || (drum && c.id === drum.ubicacion))
  );
  const activeStatuses = catalogos.filter(
    (c) => c.tipo === 'estado' && (c.activo || (drum && c.id === drum.estado))
  );

  const handleOpenMovementDialog = () => {
    setMovementForm({
      tipo: activeMovementTypes[0]?.id || '',
      ubicacion_nueva: drum.ubicacion,
      estado_nuevo: drum.estado,
      observaciones: '',
    });
    setMovementError('');
    setMovementDialogOpen(true);
  };

  const handleSaveMovement = async (e) => {
    e.preventDefault();
    setIsSubmittingMove(true);
    setMovementError('');

    try {
      await recordDrumMovement(drum.id, movementForm, user);
      setDb(loadDatabase());
      setMovementDialogOpen(false);
    } catch (err) {
      setMovementError(err.message);
    } finally {
      setIsSubmittingMove(false);
    }
  };

  const handleDeleteDrum = async (e) => {
    e.preventDefault();
    setIsDeleting(true);
    setDeleteError('');

    try {
      await deleteDrum(drum.id, deleteConfirmation, user);
      navigate('/inventario', {
        state: { message: `Tambor ${drum.tambor_id} eliminado exitosamente. El historial fue preservado.` },
      });
    } catch (err) {
      setDeleteError(err.message);
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="no-print space-y-8 animate-in fade-in duration-300 max-w-5xl mx-auto">
      {/* Mensaje temporal si viene de una redirección */}
      {location.state?.message && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{location.state.message}</span>
        </div>
      )}

      {/* ---------------- CABECERA PRINCIPAL DE LA FICHA ---------------- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-bone-200">
        <div className="flex items-start gap-4">
          <Link
            to="/inventario"
            className="p-2.5 rounded-xl border border-bone-300 hover:bg-bone-100 text-bone-700 transition-colors mt-1"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-olive-800 bg-olive-100/70 px-2 py-0.5 rounded font-semibold">
                Ficha de Trazabilidad
              </span>
              <Badge variant="paleGreen" dot>
                {resolveCatalogName(catalogos, drum.estado, 'estado')}
              </Badge>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-black text-obsidian tracking-tight flex items-center gap-3">
              <span>Tambor {drum.tambor_id}</span>
              <button
                onClick={handleCopyCode}
                title="Copiar código al portapapeles"
                className="text-bone-400 hover:text-obsidian p-1 rounded transition-colors text-sm font-sans flex items-center gap-1"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                {copied && <span className="text-[10px] text-emerald-600">Copiado</span>}
              </button>
            </h2>
            <p className="font-mono text-xs sm:text-sm text-bone-600 mt-1 break-all">
              {drum.codigo}
            </p>
          </div>
        </div>

        {/* Botones de Acción Operativa */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="olive"
            size="default"
            onClick={handleOpenMovementDialog}
            className="text-xs"
          >
            <Truck className="w-4 h-4 mr-1.5" />
            Registrar Movimiento
          </Button>

          <div className="flex items-center gap-1.5 flex-wrap">
            <Button
              variant="outline"
              size="default"
              onClick={handleDirectPrint}
              className="text-xs"
              title="Imprimir directamente en Zebra GC420t (100×50 mm)"
            >
              <Printer className="w-4 h-4 mr-1.5" />
              Imprimir Etiqueta
            </Button>

            <Button
              variant="secondary"
              size="default"
              onClick={handleDownloadZpl}
              className="text-xs font-mono"
              title="Descargar archivo .zpl para envío directo a Zebra GC420t"
            >
              <Download className="w-4 h-4 mr-1.5" />
              Descargar .ZPL
            </Button>

            <Button
              variant="ghost"
              size="default"
              onClick={handleCopyZpl}
              className="text-xs font-mono text-bone-600 hover:text-obsidian"
              title="Copiar comando nativo ZPL II al portapapeles"
            >
              {copiedZpl ? (
                <>
                  <Check className="w-4 h-4 mr-1 text-emerald-600" />
                  <span className="text-emerald-700">¡ZPL Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-1" />
                  Copiar ZPL
                </>
              )}
            </Button>
          </div>

          <Link to={`/tambores/${drum.tambor_id}/editar`}>
            <Button variant="secondary" size="default" className="text-xs">
              <Edit3 className="w-4 h-4 mr-1.5" />
              Editar
            </Button>
          </Link>

          <Button
            variant="softDestructive"
            size="default"
            onClick={() => {
              setDeleteConfirmation('');
              setDeleteError('');
              setDeleteDialogOpen(true);
            }}
            className="text-xs"
          >
            <Trash2 className="w-4 h-4 mr-1.5" />
            Eliminar
          </Button>
        </div>
      </div>

      {/* ---------------- RESUMEN RÁPIDO & BARRAS ---------------- */}
      <div className="bezel-shell">
        <div className="bezel-core p-6 bg-white flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-bone-500">
                Código de Barras CODE 128
              </span>
              <span className="text-[10px] font-mono text-olive-800 bg-olive-100 px-2 py-0.5 rounded font-semibold">
                Base: {drum.codigo_compacto || drum.codigo}
              </span>
            </div>
            <div className="bg-bone-50 p-3 rounded-xl border border-bone-200 inline-block max-w-full overflow-hidden">
              <BarcodeSvg
                value={drum.codigo_compacto || drum.codigo}
                width={1.4}
                height={50}
                displayValue={false}
              />
              <div className="text-[10px] font-mono text-center text-bone-600 font-bold mt-1">
                {drum.codigo_compacto || drum.codigo}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full md:w-auto text-left text-xs border-t md:border-t-0 md:border-l border-bone-200 pt-4 md:pt-0 md:pl-6">
            <div>
              <span className="text-bone-500 font-mono block">Ubicación Actual:</span>
              <span className="font-semibold text-sm text-olive-900 bg-olive-100/70 px-2 py-0.5 rounded inline-block mt-0.5">
                {resolveCatalogName(catalogos, drum.ubicacion, 'ubicacion')}
              </span>
            </div>
            <div>
              <span className="text-bone-500 font-mono block">Peso Neto:</span>
              <span className="font-serif text-xl font-bold text-obsidian block mt-0.5">
                {drum.peso} kg
              </span>
            </div>
            <div>
              <span className="text-bone-500 font-mono block">Lote:</span>
              <span className="font-mono font-bold text-sm text-obsidian block mt-0.5">
                {drum.lote}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ---------------- ESPECIFICACIONES COMPLETAS (BENTO) ---------------- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Tarjeta 1: Producto */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Layers className="w-4 h-4 text-olive-800" />
              <span>Producto & Variedad</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div>
              <span className="text-bone-500 font-mono block">Producto:</span>
              <span className="font-semibold text-obsidian text-sm">
                {resolveCatalogName(catalogos, drum.producto, 'producto')}
              </span>
            </div>
            <div>
              <span className="text-bone-500 font-mono block">Presentación:</span>
              <span className="font-medium text-obsidian">
                {resolveCatalogName(catalogos, drum.presentacion, 'presentacion')}
              </span>
            </div>
            <div>
              <span className="text-bone-500 font-mono block">Variedad:</span>
              <span className="font-medium text-obsidian">
                {resolveCatalogName(catalogos, drum.variedad, 'variedad')}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-bone-100">
              <div>
                <span className="text-bone-500 font-mono block">Calibre:</span>
                <span className="font-mono font-bold text-obsidian">
                  {resolveCatalogName(catalogos, drum.calibre, 'calibre')}
                </span>
              </div>
              <div>
                <span className="text-bone-500 font-mono block">Calidad:</span>
                <span className="font-medium text-obsidian">
                  {resolveCatalogName(catalogos, drum.calidad, 'calidad')}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tarjeta 2: Ingreso y Proceso */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Calendar className="w-4 h-4 text-olive-800" />
              <span>Fechas & Proceso</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div>
              <span className="text-bone-500 font-mono block">Fecha de Ingreso:</span>
              <span className="font-mono font-bold text-obsidian text-sm">
                {formatDate(drum.fecha_ingreso)}
              </span>
            </div>
            <div>
              <span className="text-bone-500 font-mono block">Fecha de Elaboración:</span>
              <span className="font-mono text-obsidian">
                {formatDate(drum.fecha_elaboracion)}
              </span>
            </div>
            <div>
              <span className="text-bone-500 font-mono block">Alta en Sistema:</span>
              <span className="font-mono text-bone-600">
                {formatDateTime(drum.created_date)}
              </span>
            </div>
            {drum.updated_date && (
              <div>
                <span className="text-bone-500 font-mono block">Última Modificación:</span>
                <span className="font-mono text-bone-600">
                  {formatDateTime(drum.updated_date)}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tarjeta 3: Observaciones y Notas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Tag className="w-4 h-4 text-olive-800" />
              <span>Notas Operativas</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs">
            {drum.observaciones ? (
              <p className="text-bone-800 bg-bone-50 p-3 rounded-xl border border-bone-200 leading-relaxed italic">
                «{drum.observaciones}»
              </p>
            ) : (
              <p className="text-bone-400 italic">
                Sin notas ni observaciones adicionales registradas.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ---------------- HISTORIAL DEL TAMBOR ---------------- */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Clock className="w-4 h-4 text-olive-800" />
              <span>Línea de Tiempo del Tambor</span>
            </CardTitle>
            <p className="text-xs text-bone-500 mt-0.5">
              Registro inalterable de creación, modificaciones de datos y movimientos de ubicación.
            </p>
          </div>
          <span className="font-mono text-xs text-bone-500">
            {drumHistory.length} {drumHistory.length === 1 ? 'evento' : 'eventos'}
          </span>
        </CardHeader>
        <CardContent>
          {drumHistory.length === 0 ? (
            <p className="text-sm text-bone-500 text-center py-6">
              No hay eventos en el historial de este tambor.
            </p>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-bone-200">
              {drumHistory.map((evt) => (
                <div key={evt.id} className="relative">
                  {/* Punto en la línea de tiempo */}
                  <div className="absolute -left-6 top-1 w-3 h-3 rounded-full border-2 border-white bg-olive-800 shadow-sm" />

                  <div className="p-4 rounded-xl border border-bone-200 bg-bone-50/50 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            evt.tipo === 'Creación'
                              ? 'paleGreen'
                              : evt.tipo === 'Movimiento'
                              ? 'paleBlue'
                              : evt.tipo === 'Eliminación'
                              ? 'paleRed'
                              : 'default'
                          }
                          className="text-[10px]"
                        >
                          {evt.tipo}
                        </Badge>
                        {evt.campo && (
                          <span className="font-mono text-bone-500 font-semibold">
                            [{evt.campo}]
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-bone-500 text-[11px]">
                        {formatDateTime(evt.created_date)}
                      </span>
                    </div>

                    <p className="text-obsidian font-semibold">
                      {evt.descripcion}
                    </p>

                    {evt.campo && (
                      <div className="bg-white p-2 rounded-lg border border-bone-200 font-mono text-[11px] grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-red-700 block">Antes:</span>
                          <span className="text-bone-700">{evt.valor_anterior || '(vacío)'}</span>
                        </div>
                        <div>
                          <span className="text-emerald-700 block">Ahora:</span>
                          <span className="text-obsidian font-bold">{evt.valor_nuevo || '(vacío)'}</span>
                        </div>
                      </div>
                    )}

                    {evt.observaciones && (
                      <p className="text-bone-600 italic text-[11px]">
                        Nota: {evt.observaciones}
                      </p>
                    )}

                    <div className="text-[10px] text-bone-400 pt-1 border-t border-bone-100 flex items-center justify-between">
                      <span>Responsable: {evt.actor || 'Operario Planta'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ---------------- MODAL DE MOVIMIENTO ---------------- */}
      <Dialog open={movementDialogOpen} onOpenChange={setMovementDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Movimiento de Tambor</DialogTitle>
            <DialogDescription>
              Asigna una nueva ubicación física en planta o cambia el estado de proceso para el tambor{' '}
              <span className="font-mono font-bold text-obsidian">{drum.tambor_id}</span>.
            </DialogDescription>
          </DialogHeader>

          {movementError && (
            <div className="p-3 rounded-lg bg-red-50 text-red-800 text-xs mb-3">
              {movementError}
            </div>
          )}

          <form onSubmit={handleSaveMovement} className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-bone-800 block mb-1">
                Tipo de Movimiento *
              </label>
              <select
                value={movementForm.tipo}
                onChange={(e) => setMovementForm({ ...movementForm, tipo: e.target.value })}
                className="w-full h-10 px-3 text-xs rounded-xl border border-bone-300 bg-white"
                required
              >
                {activeMovementTypes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-bone-800 block mb-1">
                Nueva Ubicación en Planta *
              </label>
              <select
                value={movementForm.ubicacion_nueva}
                onChange={(e) => setMovementForm({ ...movementForm, ubicacion_nueva: e.target.value })}
                className="w-full h-10 px-3 text-xs rounded-xl border border-bone-300 bg-white"
                required
              >
                {activeLocations.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-bone-800 block mb-1">
                Cambiar Estado (Opcional)
              </label>
              <select
                value={movementForm.estado_nuevo}
                onChange={(e) => setMovementForm({ ...movementForm, estado_nuevo: e.target.value })}
                className="w-full h-10 px-3 text-xs rounded-xl border border-bone-300 bg-white"
              >
                {activeStatuses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-bone-800 block mb-1">
                Observaciones del Movimiento
              </label>
              <Textarea
                placeholder="Motivo del traslado, estiba, pallet..."
                value={movementForm.observaciones}
                onChange={(e) => setMovementForm({ ...movementForm, observaciones: e.target.value })}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setMovementDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="olive"
                size="sm"
                disabled={isSubmittingMove}
              >
                {isSubmittingMove ? 'Guardando...' : 'Confirmar y Guardar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ---------------- MODAL DE ELIMINACIÓN SEGURA ---------------- */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="border-red-200">
          <DialogHeader>
            <DialogTitle className="text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              ¿Eliminar tambor definitivamente?
            </DialogTitle>
            <DialogDescription>
              Esta acción dará de baja el tambor del inventario activo. El historial y sus movimientos
              permanecerán registrados como comprobante histórico inalterable.
            </DialogDescription>
          </DialogHeader>

          {deleteError && (
            <div className="p-3 rounded-lg bg-red-50 text-red-800 text-xs mb-3">
              {deleteError}
            </div>
          )}

          <form onSubmit={handleDeleteDrum} className="space-y-4 text-xs">
            <p className="text-bone-700">
              Para confirmar que no es un error accidental, escribe exactamente{' '}
              <span className="font-mono font-bold text-obsidian bg-bone-200 px-1 py-0.5 rounded">
                {drum.tambor_id}
              </span>{' '}
              en el siguiente campo:
            </p>

            <Input
              placeholder={`Escribe ${drum.tambor_id} para confirmar`}
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              mono
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDeleteDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="destructive"
                size="sm"
                disabled={deleteConfirmation.trim().toUpperCase() !== drum.tambor_id.toUpperCase() || isDeleting}
              >
                {isDeleting ? 'Eliminando...' : 'Eliminar Tambor'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>

    {/* Impresión directa de etiqueta (oculto en pantalla, activo al imprimir) */}
    <div className="print-only">
      <PhysicalLabel
        drum={{
          ...drum,
          ubicacion_nombre: resolveCatalogName(catalogos, drum.ubicacion, 'ubicacion'),
        }}
        widthMm={100}
        heightMm={50}
        showBorder={false}
      />
    </div>
  </>
  );
}
