import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart2, TrendingUp, Activity } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, Legend
} from 'recharts';
import { ScreenHeader } from '../components/ScreenHeader';
import { GlassCard } from '../components/GlassCard';
import { useRegistros } from '../lib/registrosState';

interface ChartDataPoint {
  fecha: string;
  plato: number;
  temp: number;
  ph: number;
}

export function Analisis() {
  const { registrosProduccion, registrosFermentacion } = useRegistros();
  const [selectedBatchId, setSelectedBatchId] = useState(registrosProduccion[0]?.id || '26001');

  const batch = registrosProduccion.find(r => r.id === selectedBatchId) || registrosProduccion[0];
  const fermentation = registrosFermentacion[selectedBatchId] || { lecturas: [] };

  const chartData: ChartDataPoint[] = useMemo(() => {
    if (!fermentation.lecturas || fermentation.lecturas.length === 0) return [];
    return fermentation.lecturas.map((l: any) => ({
      fecha: l.fecha.split(' ')[0], // solo la fecha, sin hora
      plato: Number(l.plato),
      temp: Number(l.temp),
      ph: Number(l.ph),
    }));
  }, [fermentation.lecturas]);

  const stats = useMemo(() => {
    if (chartData.length === 0) return null;
    const platos = chartData.map(d => d.plato);
    const temps = chartData.map(d => d.temp);
    return {
      platoInicial: platos[0],
      platoActual: platos[platos.length - 1],
      platoDelta: platos[0] - platos[platos.length - 1],
      tempPromedio: (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1),
      tempMin: Math.min(...temps),
      tempMax: Math.max(...temps),
      dias: chartData.length,
    };
  }, [chartData]);

  return (
    <div className="flex min-h-full flex-col pb-32 px-4 space-y-6">
      <ScreenHeader
        title="Análisis y Curvas de Fermentación"
        subtitle="Métricas avanzadas conectadas a RegistrosProvider"
      />

      {/* Selector de Lotes */}
      <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
        {registrosProduccion.map((b) => {
          const isSelected = b.id === selectedBatchId;
          return (
            <button
              key={b.id}
              onClick={() => setSelectedBatchId(b.id)}
              className={`flex shrink-0 items-center gap-2 rounded-2xl px-4 py-2.5 transition-all cursor-pointer ${
                isSelected
                  ? 'bg-[#00e1ff]/15 border border-[#00e1ff]/40 text-[#00e1ff]'
                  : 'bg-slate-900/40 border border-white/5 text-gray-400 hover:text-white'
              }`}
            >
              <BarChart2 size={14} />
              <span className="font-display text-xs font-bold">Lote {b.batch}</span>
              <span className="font-mono text-[10px] opacity-75">({b.recipe})</span>
            </button>
          );
        })}
      </div>

      {batch && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 text-center"
            >
              <p className="font-mono text-[10px] text-gray-400 uppercase">Temperatura Actual</p>
              <p className="font-display text-xl font-bold text-[#FFAA00] mt-1">{batch.currentTemp} °C</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 text-center"
            >
              <p className="font-mono text-[10px] text-gray-400 uppercase">Grados Plato</p>
              <p className="font-display text-xl font-bold text-[#FFD060] mt-1">{batch.plato} °P</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 text-center"
            >
              <p className="font-mono text-[10px] text-gray-400 uppercase">pH</p>
              <p className="font-display text-xl font-bold text-[#00e1ff] mt-1">{batch.ph}</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 text-center"
            >
              <p className="font-mono text-[10px] text-gray-400 uppercase">ABV</p>
              <p className="font-display text-xl font-bold text-[#34d399] mt-1">{batch.abv}%</p>
            </motion.div>
          </div>

          {/* Curva de Fermentación */}
          <GlassCard className="p-5 space-y-4" corners delay={0.1}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-[#00e1ff]" />
                <h3 className="font-display text-sm font-bold text-white">Curva de Fermentación</h3>
              </div>
              {stats && (
                <span className="font-mono text-[10px] text-gray-400">
                  ΔPlato: <span className="text-[#FFD060]">-{stats.platoDelta.toFixed(2)}°P</span> · {stats.dias} lecturas
                </span>
              )}
            </div>

            {chartData.length > 0 ? (
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorPlato" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FFD060" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#FFD060" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                      dataKey="fecha"
                      stroke="rgba(74,96,112,0.6)"
                      tick={{ fill: 'rgba(74,96,112,0.8)', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                      tickLine={false}
                    />
                    <YAxis
                      stroke="rgba(74,96,112,0.6)"
                      tick={{ fill: 'rgba(74,96,112,0.8)', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                      tickLine={false}
                      domain={['auto', 'auto']}
                    />
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(2,4,8,0.95)',
                        border: '1px solid rgba(0,225,255,0.2)',
                        borderRadius: '12px',
                        fontFamily: 'JetBrains Mono',
                        fontSize: '11px',
                        color: '#e8f0f8',
                      }}
                      itemStyle={{ color: '#FFD060' }}
                      labelStyle={{ color: 'rgba(74,96,112,0.8)' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="plato"
                      stroke="#FFD060"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorPlato)"
                      dot={{ r: 3, stroke: '#FFD060', strokeWidth: 2, fill: '#020408' }}
                      activeDot={{ r: 5, stroke: '#FFD060', strokeWidth: 2, fill: '#FFD060' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center">
                <p className="font-mono text-xs text-gray-500 text-center">
                  No hay lecturas registradas para este lote.
                </p>
              </div>
            )}
          </GlassCard>

          {/* Temperatura vs Tiempo */}
          {chartData.length > 0 && (
            <GlassCard className="p-5 space-y-4" corners delay={0.15}>
              <div className="flex items-center gap-2">
                <Activity size={16} className="text-[#FFAA00]" />
                <h3 className="font-display text-sm font-bold text-white">Temperatura durante la Fermentación</h3>
              </div>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                      dataKey="fecha"
                      stroke="rgba(74,96,112,0.6)"
                      tick={{ fill: 'rgba(74,96,112,0.8)', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                      tickLine={false}
                    />
                    <YAxis
                      stroke="rgba(74,96,112,0.6)"
                      tick={{ fill: 'rgba(74,96,112,0.8)', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                      tickLine={false}
                      domain={['auto', 'auto']}
                    />
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(2,4,8,0.95)',
                        border: '1px solid rgba(255,170,0,0.2)',
                        borderRadius: '12px',
                        fontFamily: 'JetBrains Mono',
                        fontSize: '11px',
                        color: '#e8f0f8',
                      }}
                      itemStyle={{ color: '#FFAA00' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="temp"
                      stroke="#FFAA00"
                      strokeWidth={2}
                      dot={{ r: 3, stroke: '#FFAA00', strokeWidth: 2, fill: '#020408' }}
                      activeDot={{ r: 5, fill: '#FFAA00' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              {stats && (
                <div className="flex gap-4 font-mono text-[10px] text-gray-400">
                  <span>Temp. promedio: <span className="text-[#FFAA00]">{stats.tempPromedio}°C</span></span>
                  <span>Min: <span className="text-[#00e1ff]">{stats.tempMin}°C</span></span>
                  <span>Max: <span className="text-[#FA6A00]">{stats.tempMax}°C</span></span>
                </div>
              )}
            </GlassCard>
          )}

          {/* Tabla de lecturas */}
          <GlassCard className="p-5 space-y-3" corners delay={0.2}>
            <p className="font-mono text-[10px] uppercase tracking-wider text-gray-400">Historial de Lecturas:</p>
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {fermentation.lecturas?.length > 0 ? (
                fermentation.lecturas.map((lec: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-white/5 font-mono text-xs">
                    <span className="text-gray-400">{lec.fecha || `Control ${idx + 1}`}</span>
                    <span className="text-[#FFD060]">{lec.plato}°P</span>
                    <span className="text-[#FFAA00]">{lec.temp}°C</span>
                    <span className="text-[#00e1ff]">{lec.ph} pH</span>
                  </div>
                ))
              ) : (
                <p className="font-mono text-xs text-gray-500 text-center py-6 bg-slate-950/40 rounded-xl">
                  No hay lecturas registradas para este lote.
                </p>
              )}
            </div>
          </GlassCard>
        </>
      )}
    </div>
  );
}
