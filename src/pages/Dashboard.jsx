import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  QrCode,
  PlusCircle,
  Layers,
  ArrowRight,
  TrendingUp,
  MapPin,
  Clock,
  Sparkles,
  ChevronRight,
  Package,
} from 'lucide-react';
import { loadDatabase } from '../api/repository.js';
import { calculateInventoryTotals, resolveCatalogName } from '../lib/domain.js';
import { formatKg, formatDateTime } from '../lib/utils.js';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card.jsx';
import { Badge } from '../components/ui/badge.jsx';
import { Button } from '../components/ui/button.jsx';

export function Dashboard() {
  const navigate = useNavigate();
  const db = loadDatabase();
  const { tambores, catalogos, movimientos, historial } = db;

  const totals = calculateInventoryTotals(tambores);

  // Variedades más comunes
  const varietyCounts = {};
  for (const t of tambores) {
    const varName = resolveCatalogName(catalogos, t.variedad, 'variedad');
    varietyCounts[varName] = (varietyCounts[varName] || 0) + 1;
  }

  // Estados más comunes
  const statusCounts = {};
  for (const t of tambores) {
    const estName = resolveCatalogName(catalogos, t.estado, 'estado');
    statusCounts[estName] = (statusCounts[estName] || 0) + 1;
  }

  // Últimos 4 eventos del historial
  const recentEvents = (historial || []).slice(0, 4);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* ---------------- CABECERA PRINCIPAL ---------------- */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-bone-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase tracking-[0.2em] font-mono text-olive-800 bg-olive-100/70 px-2.5 py-0.5 rounded-full font-semibold">
              Panel Operativo
            </span>
            <span className="text-bone-400 text-xs font-mono">· Luján de Cuyo</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-obsidian">
            Trazabilidad de Tambores
          </h2>
          <p className="text-sm text-bone-600 mt-1 max-w-xl">
            Control de inventario, pesaje, movimientos físicos y etiquetado con código de barras en planta.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/etiquetas">
            <Button variant="outline" size="default" className="text-xs">
              Imprimir etiquetas
            </Button>
          </Link>
          <Link to="/tambores/nuevo">
            <Button variant="primary" size="default" trailingIcon={<ArrowRight className="w-3.5 h-3.5" />}>
              Nuevo tambor
            </Button>
          </Link>
        </div>
      </div>

      {/* ---------------- ACCIONES PRINCIPALES DE OPERARIO (HERO BENTO) ---------------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Tarjeta 1: Escanear con lector USB */}
        <div
          onClick={() => navigate('/escanear')}
          className="bezel-shell group cursor-pointer hover:border-olive-500/40 transition-all duration-300"
        >
          <div className="bezel-core p-6 bg-gradient-to-br from-white via-white to-olive-50/40 flex flex-col justify-between h-full min-h-[190px]">
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl bg-olive-900 text-bone-50 flex items-center justify-center shadow-soft-sm group-hover:scale-110 transition-transform duration-300">
                <QrCode className="w-6 h-6" />
              </div>
              <kbd className="text-xs">Atajo: 2</kbd>
            </div>

            <div className="mt-4">
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-obsidian group-hover:text-olive-900 transition-colors">
                  Escanear Tambor
                </h3>
                <span className="btn-trailing-icon bg-olive-900 text-bone-50 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
              <p className="text-xs sm:text-sm text-bone-600 mt-1">
                Apunta el lector USB al código de barras o escribe el número para abrir la ficha de inmediato.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-bone-100 flex items-center justify-between text-xs text-olive-800 font-medium">
              <span>Modo escáner activo</span>
              <span className="font-mono text-[11px] underline">Abrir escáner →</span>
            </div>
          </div>
        </div>

        {/* Tarjeta 2: Registrar Nuevo Tambor */}
        <div
          onClick={() => navigate('/tambores/nuevo')}
          className="bezel-shell group cursor-pointer hover:border-olive-500/40 transition-all duration-300"
        >
          <div className="bezel-core p-6 bg-gradient-to-br from-white via-white to-bone-100/50 flex flex-col justify-between h-full min-h-[190px]">
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl bg-obsidian text-bone-50 flex items-center justify-center shadow-soft-sm group-hover:scale-110 transition-transform duration-300">
                <PlusCircle className="w-6 h-6" />
              </div>
              <kbd className="text-xs">Atajo: 4</kbd>
            </div>

            <div className="mt-4">
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-obsidian group-hover:text-olive-900 transition-colors">
                  Registrar Nuevo Tambor
                </h3>
                <span className="btn-trailing-icon bg-obsidian text-bone-50 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
              <p className="text-xs sm:text-sm text-bone-600 mt-1">
                Genera automáticamente el siguiente ID (<span className="font-mono font-semibold">T000...</span>), calcula el código de barras y guarda el pesaje.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-bone-100 flex items-center justify-between text-xs text-bone-700 font-medium">
              <span>Ingreso de cosecha o proceso</span>
              <span className="font-mono text-[11px] underline">Iniciar registro →</span>
            </div>
          </div>
        </div>
      </div>

      {/* ---------------- MÉTRICAS PRINCIPALES ---------------- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Tambores Totales */}
        <div className="bezel-shell">
          <div className="bezel-core p-4 sm:p-5">
            <span className="text-[11px] uppercase tracking-wider text-bone-500 font-mono font-semibold block">
              Tambores en Planta
            </span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="font-serif text-3xl sm:text-4xl font-black text-obsidian">
                {totals.totalDrums}
              </span>
              <Badge variant="paleGreen" className="text-[10px]">
                Activos
              </Badge>
            </div>
            <p className="text-[11px] text-bone-500 mt-2">
              Unidades físicas registradas
            </p>
          </div>
        </div>

        {/* Kilos Netos */}
        <div className="bezel-shell">
          <div className="bezel-core p-4 sm:p-5">
            <span className="text-[11px] uppercase tracking-wider text-bone-500 font-mono font-semibold block">
              Kilogramos Netos
            </span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="font-serif text-2xl sm:text-3xl font-black text-obsidian">
                {formatKg(totals.totalKg)}
              </span>
            </div>
            <p className="text-[11px] text-bone-500 mt-2">
              Suma total de pesajes
            </p>
          </div>
        </div>

        {/* Ubicaciones Ocupadas */}
        <div className="bezel-shell">
          <div className="bezel-core p-4 sm:p-5">
            <span className="text-[11px] uppercase tracking-wider text-bone-500 font-mono font-semibold block">
              Ubicaciones Ocupadas
            </span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="font-serif text-3xl sm:text-4xl font-black text-obsidian">
                {totals.totalLocations}
              </span>
              <span className="text-xs text-bone-400 font-mono">naves/sectores</span>
            </div>
            <p className="text-[11px] text-bone-500 mt-2">
              Sectores con tambores activos
            </p>
          </div>
        </div>

        {/* Movimientos */}
        <div className="bezel-shell">
          <div className="bezel-core p-4 sm:p-5">
            <span className="text-[11px] uppercase tracking-wider text-bone-500 font-mono font-semibold block">
              Movimientos Físicos
            </span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="font-serif text-3xl sm:text-4xl font-black text-obsidian">
                {movimientos?.length || 0}
              </span>
              <span className="text-xs text-bone-400 font-mono">trazados</span>
            </div>
            <p className="text-[11px] text-bone-500 mt-2">
              Eventos de traslado en planta
            </p>
          </div>
        </div>
      </div>

      {/* ---------------- RESUMEN DE PROCESO & ACTIVIDAD RECIENTE ---------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Distribución por Estado y Variedad */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center justify-between">
                <span>Estado de Procesos</span>
                <Link to="/inventario" className="text-xs text-olive-800 font-normal hover:underline font-mono">
                  Ver todo
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(statusCounts).map(([statusName, count]) => (
                  <div key={statusName} className="flex items-center justify-between text-xs">
                    <span className="text-bone-700 truncate max-w-[180px]">{statusName}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-bone-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-olive-800 h-full rounded-full"
                          style={{
                            width: `${Math.min(100, Math.round((count / (totals.totalDrums || 1)) * 100))}%`,
                          }}
                        />
                      </div>
                      <span className="font-mono font-bold text-obsidian w-6 text-right">
                        {count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold">Variedades en Stock</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2.5">
                {Object.entries(varietyCounts).map(([varName, count]) => (
                  <div key={varName} className="flex items-center justify-between text-xs py-1 border-b border-bone-100 last:border-0">
                    <span className="font-medium text-bone-800">{varName}</span>
                    <Badge variant="outline" className="font-mono">
                      {count} {count === 1 ? 'tambor' : 'tambores'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Última Actividad de Historial */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold">Actividad Reciente en Planta</CardTitle>
                <CardDescription>Eventos registrados de alta, traslado y edición</CardDescription>
              </div>
              <Link to="/historial">
                <Button variant="outline" size="sm" className="text-xs">
                  Historial completo →
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {recentEvents.length === 0 ? (
                <div className="text-center py-12 text-bone-500 text-sm">
                  No hay actividad registrada en este espacio de trabajo.
                </div>
              ) : (
                <div className="space-y-4">
                  {recentEvents.map((evt) => (
                    <div
                      key={evt.id}
                      className="p-3.5 rounded-xl border border-bone-200 bg-bone-50/50 hover:bg-bone-100/60 transition-colors flex items-start justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/tambores/${evt.tambor_id}`}
                            className="font-mono font-bold text-xs text-olive-900 bg-olive-100/80 px-2 py-0.5 rounded hover:bg-olive-200 transition-colors"
                          >
                            {evt.tambor_id}
                          </Link>
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
                        </div>
                        <p className="text-xs text-obsidian font-medium leading-snug">
                          {evt.descripcion}
                        </p>
                        {evt.observaciones && (
                          <p className="text-[11px] text-bone-600 italic">
                            «{evt.observaciones}»
                          </p>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[11px] font-mono text-bone-500 block">
                          {formatDateTime(evt.created_date)}
                        </span>
                        <span className="text-[10px] text-bone-600 font-medium">
                          {evt.actor || 'Operario'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
