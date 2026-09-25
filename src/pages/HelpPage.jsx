import React from 'react';
import { Link } from 'react-router-dom';
import {
  HelpCircle,
  QrCode,
  PlusCircle,
  Truck,
  Printer,
  AlertTriangle,
  ArrowRight,
  Keyboard,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card.jsx';
import { Button } from '../components/ui/button.jsx';
import { Badge } from '../components/ui/badge.jsx';

export function HelpPage() {
  const steps = [
    {
      title: '1. Consultar o Escanear Tambor',
      icon: QrCode,
      desc: 'Ve a "Escanear Tambor". Apunta el lector USB a la etiqueta del tambor. Al leer el código, el sistema abrirá automáticamente la ficha técnica con su ubicación y peso.',
      tip: 'Si no tienes lector, escribe el número (ej: T000001) y presiona Enter.',
      path: '/escanear',
      btnText: 'Abrir Escáner',
    },
    {
      title: '2. Registrar Nuevo Tambor',
      icon: PlusCircle,
      desc: 'Ve a "Registrar Tambor". El sistema asignará el siguiente número único (ej: T000013) sin duplicar. Selecciona producto, variedad, calibre, escribe el lote y el peso neto en kg.',
      tip: 'Al guardar, se guardará el evento de creación y podrás imprimir su etiqueta.',
      path: '/tambores/nuevo',
      btnText: 'Registrar Tambor',
    },
    {
      title: '3. Registrar Movimiento Físico',
      icon: Truck,
      desc: 'Abre la ficha del tambor. Presiona "Registrar Movimiento". Elige qué ocurrió (ej: Traslado de nave) y la nueva ubicación física. Puedes cambiar el estado si es necesario.',
      tip: 'La ubicación previa y nueva quedan registradas en el historial con fecha y hora.',
      path: '/inventario',
      btnText: 'Buscar en Inventario',
    },
    {
      title: '4. Imprimir Etiquetas Físicas',
      icon: Printer,
      desc: 'Desde la ficha del tambor pulsa "Ver Etiqueta" o ve a "Imprimir Etiquetas" para seleccionar varios tambores. El formato está diseñado para impresoras térmicas de 50 × 100 mm.',
      tip: 'Cada etiqueta se imprime en una hoja independiente con el código de barras CODE 128.',
      path: '/etiquetas',
      btnText: 'Impresión de Etiquetas',
    },
  ];

  const troubleshooting = [
    {
      problem: 'El lector USB no escribe en el campo',
      cause: 'El cursor perdió el foco o el lector no está conectado por USB.',
      solution: 'Haz clic dentro del recuadro de escaneo para devolver el foco y comprueba la conexión del cable.',
    },
    {
      problem: 'El lector escribe pero no abre la ficha',
      cause: 'El lector no está configurado para enviar la tecla "Enter" (retorno de carro) al terminar la lectura.',
      solution: 'Presiona el botón "Buscar" manualmente o escanea el código de barras de configuración de tu pistola USB para habilitar el sufijo Enter.',
    },
    {
      problem: 'Código desconocido',
      cause: 'La etiqueta no coincide con ningún tambor activo o el código fue alterado.',
      solution: 'Busca el número de tambor (ej: T000001) directamente en el Inventario para verificar si fue dado de baja.',
    },
    {
      problem: 'Falta una variedad o ubicación en las listas',
      cause: 'La opción aún no fue dada de alta o fue desactivada en Configuración.',
      solution: 'Pide al responsable o administrador que ingrese a Configuración > Catálogos y agregue la opción correspondiente.',
    },
    {
      problem: 'Eliminación accidental',
      cause: 'Un tambor fue eliminado de la planta.',
      solution: 'La eliminación borra la ficha del inventario activo pero todo su historial se conserva intacto como constancia de su existencia previa.',
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-5xl mx-auto">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-bone-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase tracking-[0.2em] font-mono text-olive-800 bg-olive-100/70 px-2.5 py-0.5 rounded-full font-semibold">
              Manual de Planta
            </span>
            <span className="text-bone-400 text-xs font-mono">· Instrucciones de Operación</span>
          </div>
          <h2 className="font-serif text-3xl font-bold tracking-tight text-obsidian">
            Guía de Uso para Operarios y Administración
          </h2>
          <p className="text-sm text-bone-600 mt-0.5">
            Procedimientos paso a paso, atajos de teclado y resolución de problemas comunes.
          </p>
        </div>
      </div>

      {/* ---------------- ATAJOS DE TECLADO ---------------- */}
      <div className="bezel-shell">
        <div className="bezel-core p-4 sm:p-5 bg-white flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-bone-100 flex items-center justify-center text-obsidian">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-obsidian block">
                Navegación Rápida por Teclado
              </span>
              <p className="text-[11px] text-bone-600">
                Presiona estas teclas en cualquier momento para ir a las pantallas principales:
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs flex items-center gap-1 font-mono">
              <kbd>1</kbd> Inicio
            </span>
            <span className="text-xs flex items-center gap-1 font-mono">
              <kbd>2</kbd> Escanear
            </span>
            <span className="text-xs flex items-center gap-1 font-mono">
              <kbd>3</kbd> Inventario
            </span>
            <span className="text-xs flex items-center gap-1 font-mono">
              <kbd>4</kbd> Nuevo Tambor
            </span>
            <span className="text-xs flex items-center gap-1 font-mono">
              <kbd>5</kbd> Historial
            </span>
            <span className="text-xs flex items-center gap-1 font-mono">
              <kbd>6</kbd> Configuración
            </span>
          </div>
        </div>
      </div>

      {/* ---------------- 4 PASOS PRINCIPALES (BENTO) ---------------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <Card key={idx} className="flex flex-col justify-between">
              <div>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-olive-900 text-bone-50 flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <Badge variant="outline" className="font-mono text-[10px]">
                      Paso {idx + 1}
                    </Badge>
                  </div>
                  <CardTitle className="text-base font-bold mt-3">
                    {step.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  <p className="text-bone-700 leading-relaxed">
                    {step.desc}
                  </p>
                  <div className="p-2.5 rounded-lg bg-olive-50/70 border border-olive-200/60 text-olive-950 font-medium">
                    Tip: {step.tip}
                  </div>
                </CardContent>
              </div>

              <div className="p-5 pt-0">
                <Link to={step.path}>
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    {step.btnText} →
                  </Button>
                </Link>
              </div>
            </Card>
          );
        })}
      </div>

      {/* ---------------- TABLA DE RESOLUCIÓN DE PROBLEMAS ---------------- */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Resolución de Problemas Frecuentes en Planta</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-bone-200 bg-bone-50 font-mono text-[11px] text-bone-600 uppercase tracking-wider">
                <th className="p-3.5 font-semibold">Situación / Problema</th>
                <th className="p-3.5 font-semibold">Causa Probable</th>
                <th className="p-3.5 font-semibold">Solución Inmediata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bone-100">
              {troubleshooting.map((item, idx) => (
                <tr key={idx} className="hover:bg-bone-50/50">
                  <td className="p-3.5 font-semibold text-obsidian align-top">
                    {item.problem}
                  </td>
                  <td className="p-3.5 text-bone-600 align-top">
                    {item.cause}
                  </td>
                  <td className="p-3.5 text-olive-900 font-medium bg-olive-50/20 align-top">
                    {item.solution}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
