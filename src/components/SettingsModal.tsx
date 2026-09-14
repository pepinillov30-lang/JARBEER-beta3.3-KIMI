import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, CheckCircle2, Palette, Save, X, HardDrive, Speaker } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { haptics } from '../lib/haptics';
import { listAvailableSpanishVoices, speak } from '../lib/voice';

type ThemeMode = 'dark' | 'light' | 'neon';

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedVoice: string;
  onVoiceChange: (v: string) => void;
  theme: ThemeMode;
  onThemeChange: (t: ThemeMode) => void;
  onTestVoice?: () => void;
}

const THEMES: { id: ThemeMode; label: string; desc: string; colors: string[] }[] = [
  { id: 'dark',  label: 'Oscuro',   desc: 'Modo nocturno, friendly con la vista', colors: ['#020408', '#0a1525', '#141e30'] },
  { id: 'light', label: 'Claro',    desc: 'Modo oficina, fondo blanco', colors: ['#f8f4ee', '#ffffff', '#e8e0d5'] },
  { id: 'neon',  label: 'Neón',     desc: 'Tecnológico, colores vibrantes', colors: ['#020408', '#00e1ff', '#FFAA00'] },
];

export function SettingsModal({ isOpen, onClose, selectedVoice, onVoiceChange, theme, onThemeChange, onTestVoice }: SettingsModalProps) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      haptics.warning();
      setVoices(listAvailableSpanishVoices());
      setSaved(false);
    }
  }, [isOpen]);

  const handleTestVoice = useCallback(() => {
    const voz = selectedVoice || localStorage.getItem('jarbeer-voice');
    if (voz) {
      speak('Voz de prueba. ¿Cómo suena Elena?', true, voz);
    } else if (voices.length > 0) {
      const auto = voices.find(v => v.lang?.toLowerCase().startsWith('es-es')) || voices[0];
      if (auto) speak('Voz de prueba. ¿Cómo suena Elena?', true, auto.name);
    } else {
      speak('Voz de prueba.', true);
    }
    haptics.light();
    onTestVoice?.();
  }, [selectedVoice, voices, onTestVoice]);

  const handleSave = useCallback(() => {
    setSaved(true);
    haptics.success();
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1200);
  }, [onClose]);

  const currentTheme = THEMES.find(t => t.id === theme) || THEMES[0];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-lg"
          >
            <GlassCard className="p-6 shadow-2xl" corners>
              <button
                onClick={onClose}
                className="absolute right-4 top-4 text-gray-500 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: 'rgba(255,170,0,0.06)', border: '1px solid rgba(255,170,0,0.2)', color: '#FFAA00' }}
                >
                  <Palette size={20} />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-white">Personalización</h3>
                  <p className="font-sans text-xs text-gray-400 mt-0.5">Voz, tema y preferencias</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Selector de voz */}
                <div>
                  <label className="flex items-center gap-2 mb-2">
                    <Volume2 size={14} style={{ color: '#00e1ff' }} />
                    <span className="font-mono text-xs uppercase tracking-wider text-gray-300">Voz del asistente</span>
                  </label>
                  <select
                    value={selectedVoice}
                    onChange={(e) => onVoiceChange(e.target.value)}
                    className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-sm text-white font-mono placeholder:text-gray-600 focus:outline-none focus:border-[#FFAA00]/50 transition-colors"
                  >
                    <option value="">— Voz automática (mejor disponible) —</option>
                    {voices.map(v => (
                      <option key={v.name} value={v.name}>
                        {v.name} ({v.lang})
                      </option>
                    ))}
                  </select>
                  {voices.length === 0 && (
                    <p className="mt-1 font-sans text-[10px] text-gray-500">No hay voces disponibles en este navegador.</p>
                  )}
                  {/* Botón de preescucha */}
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={handleTestVoice}
                      className="flex items-center gap-2 rounded-lg px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-wider transition-all"
                      style={{
                        background: 'rgba(0,225,255,0.08)',
                        border: '1px solid rgba(0,225,255,0.25)',
                        color: '#00e1ff',
                      }}
                    >
                      <Speaker size={12}/> Probar voz
                    </button>
                    <button
                      onClick={onClose}
                      className="px-4 py-2 rounded-lg font-mono text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-white transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>

                {/* Selector de tema */}
                <div>
                  <label className="flex items-center gap-2 mb-2">
                    <Palette size={14} style={{ color: '#FFAA00' }} />
                    <span className="font-mono text-xs uppercase tracking-wider text-gray-300">Tema visual</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {THEMES.map(t => (
                      <button
                        key={t.id}
                        onClick={() => onThemeChange(t.id)}
                        className={`rounded-xl p-3 border transition-all text-left cursor-pointer ${
                          theme === t.id
                            ? 'border-[#FFAA00]/50'
                            : 'border-white/5 hover:border-white/10'
                        }`}
                        style={{
                          background: `linear-gradient(135deg, ${t.colors[0]}, ${t.colors[1]})`,
                          color: theme === t.id ? '#FFAA00' : 'rgba(255,255,255,0.7)',
                        }}
                      >
                        <p className="font-display text-xs font-bold">{t.label}</p>
                        <p className="font-mono text-[9px] mt-0.5 opacity-60">{t.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Drive (pendiente) */}
                <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                    style={{ background: 'rgba(0,225,255,0.06)', border: '1px solid rgba(0,225,255,0.15)', color: '#00e1ff' }}
                  >
                    <HardDrive size={16} />
                  </div>
                  <div className="flex-1">
                    <p className="font-display text-sm font-bold text-white">Google Drive</p>
                    <p className="font-sans text-[10px] text-gray-500 mt-0.5">Conectar carpeta compartida — próximamente</p>
                  </div>
                  <button
                    className="rounded-lg px-3 py-1.5 font-mono text-[10px] text-gray-500 border border-white/5 hover:border-white/10 transition-colors"
                    disabled
                  >
                    Desconectado
                  </button>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-2 rounded-lg px-6 py-2 font-mono text-xs font-bold uppercase tracking-wider transition-all"
                    style={{
                      background: saved ? 'rgba(52,211,153,0.1)' : 'rgba(255,170,0,0.1)',
                      border: saved ? '1px solid rgba(52,211,153,0.3)' : '1px solid rgba(255,170,0,0.3)',
                      color: saved ? '#34d399' : '#FFAA00',
                    }}
                  >
                    {saved ? <CheckCircle2 size={16} /> : <Save size={16} />}
                    {saved ? 'Guardado' : 'Guardar'}
                  </button>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
