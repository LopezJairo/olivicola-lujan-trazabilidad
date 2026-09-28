import React from 'react';
import { Server, Wifi, PlayCircle, ShieldAlert, ArrowRight, Laptop } from 'lucide-react';

export default function InstallationGuide() {
  const steps = [
    {
      number: '01',
      title: 'Configurar Servidor en Windows',
      badge: 'PC de Planta (Ethernet)',
      icon: Server,
      color: 'emerald',
      description:
        'Descarga la versión para Windows en la computadora principal. Al abrirla, ve a Configuración y haz clic en "Iniciar Servidor Embebido".',
      tip: 'Si Windows Defender Firewall muestra un aviso, tilda ambas casillas (Redes privadas y públicas) y haz clic en "Permitir acceso".'
    },
    {
      number: '02',
      title: 'Conectar Laptops o Mac en Red',
      badge: 'Wi-Fi o Red Local',
      icon: Laptop,
      color: 'blue',
      description:
        'Abre el software en la Mac o laptop cliente. Ingresa en Configuración, activa el modo "Terminal Cliente (LAN)" e ingresa la dirección IP de la PC Windows.',
      tip: 'Ejemplo de dirección: http://192.168.1.41:4000 (el puerto 4000 se auto-completa).'
    },
    {
      number: '03',
      title: 'Validar con Autodiagnóstico',
      badge: 'Sincronización Total',
      icon: PlayCircle,
      color: 'purple',
      description:
        'Presiona "Ejecutar Autodiagnóstico" en la consola de logs inferior. El sistema medirá la latencia y confirmará la comunicación inmediata.',
      tip: 'A partir de este momento, todos los pesajes, tambores e inventarios quedan sincronizados en tiempo real.'
    }
  ];

  return (
    <section id="instalacion" className="py-16 px-4 max-w-6xl mx-auto border-t border-white/[0.06]">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-zinc-300 text-xs font-medium mb-3">
          <Wifi className="w-3.5 h-3.5 text-emerald-400" />
          <span>Despliegue Rápido en Planta</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Puesta en Marcha en 3 Pasos
        </h2>
        <p className="text-sm text-zinc-400 mt-2 max-w-xl mx-auto">
          Cómo conectar la PC central de Windows con las computadoras Mac o laptops de operarios en la misma red.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div
              key={idx}
              className="p-1 rounded-[2rem] bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] transition-all flex flex-col justify-between"
            >
              <div className="p-6 rounded-[calc(2rem-0.25rem)] bg-[#0b110b] flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <span className="text-2xl font-black text-white/20">{step.number}</span>
                    <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-emerald-400">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/[0.05] text-[11px] font-medium text-emerald-400 mb-3 border border-white/[0.06]">
                    {step.badge}
                  </span>

                  <h3 className="text-base font-bold text-white mb-2">{step.title}</h3>
                  <p className="text-xs text-zinc-300 leading-relaxed mb-4">
                    {step.description}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-black/40 border border-white/[0.05] text-[11px] text-zinc-400 flex items-start gap-2">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>{step.tip}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
