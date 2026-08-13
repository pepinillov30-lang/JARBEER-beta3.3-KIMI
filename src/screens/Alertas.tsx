import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Bell, CheckCircle2, Clock, Key, Save, Thermometer, FlaskConical } from 'lucide-react';
import { ScreenHeader } from '../components/ScreenHeader';
import { GlassCard } from '../components/GlassCard';
import { haptics } from '../lib/haptics';
import { useRegistros } from '../lib/registrosState';

type AlertLevel = 'warning' | 'info' | 'success' | 'critical';

interface AlertItem {
  id: string;
  level: AlertLevel;
  title: string;
  desc: string;
  time: string;
}

const STYLES: Record<AlertLevel, { color: string; bg: string; border: string; icon: typeof AlertTriangle }> = {
  critical: { color: '#ff3333', bg: 'rgba(255,51,51,0.08)', border: 'rgba(255,51,51,0.25)', icon: AlertTriangle },
  warning: { color: '#FA6A00', bg: 'rgba(250,106,0,0.06)', border: 'rgba(250,106,0,0.18)', icon: AlertTriangle },
  info: { color: '#00e1ff', bg: 'rgba(0,225,255,0.04)', border: 'rgba(0,225,255,0.12)', icon: Bell },
  success: { color: '#34d399', bg: 'rgba(52,211,153,0.04)', border: 'rgba(52,211,153,0.12)', icon: CheckCircle2 },
};

function generateDynamicAlerts(): AlertItem[] {
  const { registrosProduccion, registrosFermentacion } = (() => {
    // Hack para acceder a los datos sin hook (se llama dentro de componente)
    try {
      const mod = require('../lib/registrosState');
      return { registrosProduccion: mod.useRegistros?.().registrosProduccion ?? [], registrosFermentacion: mod.useRegistros?.().registrosFermentacion ?? {} };
    } catch {
      return { registrosProduccion: [], registrosFermentacion: {} };
    }
  })();

  const alerts: AlertItem[] = [];

  registrosProduccion.forEach((batch: any) => {
    const temp = parseFloat(batch.currentTemp);
    const ph = parseFloat(batch.ph);
    const plato = parseFloat(batch.plato);
    const stage = String(batch.stage).toLowerCase();

    // Alerta crítica: temperatura muy alta
    if (temp > 25) {
      alerts.push({
        id: `temp-high-${batch.id}`,
        level: 'critical',
        title: `${batch.fermentadorNum} · Temperatura crítica`,
        desc: `${batch.recipe} a ${temp}°C — posible estrés de levadura. Revisar refrigeración inmediatamente.`,
        time: 'En tiempo real',
      });
    }
    // Alerta warning: temperatura elevada
    else if (temp > 22 && stage.includes('ferment')) {
      alerts.push({
        id: `temp-warn-${batch.id}`,
        level: 'warning',
        title: `${batch.fermentadorNum} · Temperatura elevada`,
        desc: `${batch.recipe} a ${temp}°C — rango recomendado 18-22°C para esta etapa.`,
        time: 'En tiempo real',
      });
    }
    // Alerta warning: temperatura muy baja
    else if (temp < 1 && !stage.includes('finaliz')) {
      alerts.push({
        id: `temp-low-${batch.id}`,
        level: 'warning',
        title: `${batch.fermentadorNum} · Temperatura baja`,
        desc: `${batch.recipe} a ${temp}°C — riesgo de parada de fermentación.`,
        time: 'En tiempo real',
      });
    }

    // pH anómalo
    if (ph < 3.8 || ph > 5.8) {
      alerts.push({
        id: `ph-${batch.id}`,
        level: 'critical',
        title: `${batch.fermentadorNum} · pH fuera de rango`,
        desc: `${batch.recipe} pH ${ph} — rango seguro 4.0-5.5. Verificar medición y posible contaminación.`,
        time: 'En tiempo real',
      });
    } else if (ph > 5.4 && stage.includes('ferment')) {
      alerts.push({
        id: `ph-warn-${batch.id}`,
        level: 'warning',
        title: `${batch.fermentadorNum} · pH ligeramente alto`,
        desc: `${batch.recipe} pH ${ph} — revisar en próximo control.`,
        time: 'En tiempo real',
      });
    }

    // Plato cercano a densidad final (buena señal)
    if (plato < 3.5 && stage.includes('ferment')) {
      alerts.push({
        id: `plato-near-${batch.id}`,
        level: 'success',
        title: `${batch.fermentadorNum} · Fermentación avanzada`,
        desc: `${batch.recipe} a ${plato}°P — próximo a densidad final. Preparar para trasegado.`,
        time: 'En tiempo real',
      });
    }

    // Lecturas estables (historial)
    const hist = registrosFermentacion[batch.id];
    if (hist?.lecturas?.length >= 2) {
      const last = hist.lecturas[hist.lecturas.length - 1];
      const prev = hist.lecturas[hist.lecturas.length - 2];
      if (Math.abs(last.plato - prev.plato) < 0.1 && stage.includes('ferment')) {
        alerts.push({
          id: `stable-${batch.id}`,
          level: 'info',
          title: `${batch.fermentadorNum} · °Plato estable`,
          desc: `${batch.recipe} sin cambio de densidad en últimas lecturas. Posible fin de fermentación.`,
          time: 'Últimas lecturas',
        });
      }
    }
  });

  // Si no hay alertas reales, mostrar al menos una info del sistema
  if (alerts.length === 0) {
    alerts.push({
      id: 'sys-ok',
      level: 'success',
      title: 'Sistema · Parámetros dentro de rango',
      desc: 'Todos los fermentadores operan en condiciones normales. Sin alertas activas.',
      time: 'En tiempo real',
    });
  }

  return alerts.sort((a, b) => {
    const order: Record<AlertLevel, number> = { critical: 0, warning: 1, info: 2, success: 3 };
    return order[a.level] - order[b.level];
  });
}

export function Alertas() {
  const { registrosProduccion, registrosFermentacion } = useRegistros();
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);
  const [resolvedAlerts, setResolvedAlerts] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('jarbeer_resolved_alerts');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Generar alertas dinámicas basadas en datos reales
  const dynamicAlerts = useMemo(() => {
    const alerts: AlertItem[] = [];

    registrosProduccion.forEach((batch) => {
      const temp = parseFloat(batch.currentTemp);
      const ph = parseFloat(batch.ph);
      const plato = parseFloat(batch.plato);
      const stage = String(batch.stage).toLowerCase();

      if (temp > 25) {
        alerts.push({
          id: `temp-high-${batch.id}`,
          level: 'critical',
          title: `${batch.fermentadorNum} · Temperatura crítica`,
          desc: `${batch.recipe} a ${temp}°C — posible estrés de levadura. Revisar refrigeración.`,
          time: 'En tiempo real',
        });
      } else if (temp > 22 && stage.includes('ferment')) {
        alerts.push({
          id: `temp-warn-${batch.id}`,
          level: 'warning',
          title: `${batch.fermentadorNum} · Temperatura elevada`,
          desc: `${batch.recipe} a ${temp}°C — rango recomendado 18-22°C.`,
          time: 'En tiempo real',
        });
      } else if (temp < 1 && !stage.includes('finaliz')) {
        alerts.push({
          id: `temp-low-${batch.id}`,
          level: 'warning',
          title: `${batch.fermentadorNum} · Temperatura baja`,
          desc: `${batch.recipe} a ${temp}°C — riesgo de parada de fermentación.`,
          time: 'En tiempo real',
        });
      }

      if (ph < 3.8 || ph > 5.8) {
        alerts.push({
          id: `ph-${batch.id}`,
          level: 'critical',
          title: `${batch.fermentadorNum} · pH fuera de rango`,
          desc: `${batch.recipe} pH ${ph} — rango seguro 4.0-5.5. Verificar medición.`,
          time: 'En tiempo real',
        });
      } else if (ph > 5.4 && stage.includes('ferment')) {
        alerts.push({
          id: `ph-warn-${batch.id}`,
          level: 'warning',
          title: `${batch.fermentadorNum} · pH ligeramente alto`,
          desc: `${batch.recipe} pH ${ph} — revisar en próximo control.`,
          time: 'En tiempo real',
        });
      }

      if (plato < 3.5 && stage.includes('ferment')) {
        alerts.push({
          id: `plato-near-${batch.id}`,
          level: 'success',
          title: `${batch.fermentadorNum} · Fermentación avanzada`,
          desc: `${batch.recipe} a ${plato}°P — próximo a densidad final.`,
          time: 'En tiempo real',
        });
      }

      const hist = registrosFermentacion[batch.id];
      if (hist?.lecturas?.length >= 2) {
        const last = hist.lecturas[hist.lecturas.length - 1];
        const prev = hist.lecturas[hist.lecturas.length - 2];
        if (Math.abs(last.plato - prev.plato) < 0.1 && stage.includes('ferment')) {
          alerts.push({
            id: `stable-${batch.id}`,
            level: 'info',
            title: `${batch.fermentadorNum} · °Plato estable`,
            desc: `${batch.recipe} sin cambio de densidad en últimas lecturas.`,
            time: 'Últimas lecturas',
          });
        }
      }
    });

    if (alerts.length === 0) {
      alerts.push({
        id: 'sys-ok',
        level: 'success',
        title: 'Sistema · Parámetros dentro de rango',
        desc: 'Todos los fermentadores operan en condiciones normales.',
        time: 'En tiempo real',
      });
    }

    return alerts.sort((a, b) => {
      const order: Record<AlertLevel, number> = { critical: 0, warning: 1, info: 2, success: 3 };
      return order[a.level] - order[b.level];
    });
  }, [registrosProduccion, registrosFermentacion]);

  useEffect(() => {
    const stored = localStorage.getItem('GEMINI_API_KEY');
    if (stored) setApiKey(stored);
  }, []);

  const handleSave = () => {
    localStorage.setItem('GEMINI_API_KEY', apiKey);
    setSaved(true);
    haptics.success();
    setTimeout(() => setSaved(false), 2000);
  };

  const handleResolve = (id: string) => {
    setResolvedAlerts((prev) => {
      const next = [...prev, id];
      try { localStorage.setItem('jarbeer_resolved_alerts', JSON.stringify(next)); } catch {}
      return next;
    });
    haptics.light();
  };

  const activeAlerts = dynamicAlerts.filter((a) => !resolvedAlerts.includes(a.id));
  const resolvedCount = dynamicAlerts.filter((a) => resolvedAlerts.includes(a.id)).length;

  return (
    <div className="flex min-h-full flex-col pb-32">
      <ScreenHeader
        title="Ajustes y Alertas"
        subtitle={`${activeAlerts.length} alertas activas · ${resolvedCount} resueltas`}
      />

      <div className="space-y-6 px-4">
        {/* API Key Settings */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <GlassCard className="p-5" corners>
            <div className="flex items-center gap-3 mb-4">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                style={{ background: 'rgba(255,170,0,0.06)', border: '1px solid rgba(255,170,0,0.18)', color: '#FFAA00' }}
              >
                <Key size={18} />
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-white">Núcleo de Inteligencia (Gemini)</h3>
                <p className="font-sans text-xs text-gray-400 mt-0.5">Configura la clave API para el modo ONLINE.</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Introduce tu GEMINI_API_KEY"
                className="w-full flex-1 rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-sm text-white font-mono placeholder:text-gray-600 focus:outline-none focus:border-[#FFAA00]/50 transition-colors"
              />
              <button
                onClick={handleSave}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl px-6 py-3 font-mono text-xs font-bold uppercase tracking-wider transition-all"
                style={{
                  background: saved ? 'rgba(52,211,153,0.1)' : 'rgba(255,170,0,0.1)',
                  border: saved ? '1px solid rgba(52,211,153,0.3)' : '1px solid rgba(255,170,0,0.3)',
                  color: saved ? '#34d399' : '#FFAA00',
                }}
              >
                {saved ? <CheckCircle2 size={16} /> : <Save size={16} />}
                {saved ? 'Guardada' : 'Guardar'}
              </button>
            </div>
            <div className="font-sans text-[10px] text-gray-500 mt-3 flex items-center gap-1.5">
              <AlertTriangle size={10} /> Esta clave se guarda localmente en tu navegador.
            </div>
          </GlassCard>
        </motion.div>

        {/* Separator */}
        <div className="flex items-center gap-3 pt-2 pb-1">
          <div className="flex-1 h-px bg-white/5" />
          <span className="font-mono text-[10px] text-gray-500 uppercase tracking-widest">Alertas del Sistema</span>
          <div className="flex-1 h-px bg-white/5" />
        </div>

        {/* Alerts List */}
        <div className="space-y-3">
          {activeAlerts.map((a, i) => {
            const s = STYLES[a.level];
            const Icon = s.icon;
            return (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.06 }}
              >
                <GlassCard
                  className="p-4"
                  corners
                  delay={0.1 + i * 0.06}
                  style={{
                    borderColor: s.border,
                  }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                        style={{
                          background: s.bg,
                          border: `1px solid ${s.border}`,
                          color: s.color,
                        }}
                      >
                        <Icon size={16} />
                      </div>
                      <div className="flex-1">
                        <p className="font-display text-sm font-bold text-white">{a.title}</p>
                        <p className="mt-0.5 font-sans text-xs leading-relaxed" style={{ color: 'rgba(180,200,216,0.8)' }}>
                          {a.desc}
                        </p>
                        <div className="mt-2 flex items-center gap-1.5">
                          <Clock size={10} style={{ color: 'rgba(74,96,112,0.5)' }} />
                          <span className="font-mono text-[9px]" style={{ color: 'rgba(74,96,112,0.6)' }}>
                            {a.time}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleResolve(a.id)}
                      className="rounded-xl p-2 transition-all duration-200 hover:bg-white/5 border border-transparent hover:border-white/10 text-gray-500 hover:text-[#34d399]"
                      title="Marcar como resuelto"
                    >
                      <CheckCircle2 size={16} />
                    </button>
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}

          {activeAlerts.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
              <CheckCircle2 size={32} className="mx-auto text-[#34d399] mb-3" />
              <p className="font-display text-sm text-white">Todas las alertas han sido resueltas</p>
              <p className="font-mono text-[10px] text-gray-500 mt-1">Sistema operativo sin incidencias</p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
