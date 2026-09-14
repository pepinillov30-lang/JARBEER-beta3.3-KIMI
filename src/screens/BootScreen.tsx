import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Power } from 'lucide-react';
import { bootSequence } from '../data/mockData';
import { USER_NAME, APP_VERSION, APP_FULL_NAME, APP_TAGLINE } from '../lib/config';
import { playSound, unlockAudio } from '../lib/sound';
import { unlockSpeechSynthesis } from '../lib/voice';

interface BootScreenProps { onComplete: () => void; soundEnabled: boolean; }
type Phase = 'unlock' | 'logo' | 'init' | 'greeting';

export function BootScreen({ onComplete, soundEnabled }: BootScreenProps) {
  const [phase, setPhase] = useState<Phase>('unlock');
  const [step, setStep]   = useState(0);
  const [exit, setExit]   = useState(false);

  const handleUnlock = () => {
    // Interacción real del usuario: aquí se desbloquean MIS COJONES CON audio y voz
    // en navegadores con política anti-autoplay estricta.
    unlockAudio();
    unlockSpeechSynthesis();
    setPhase('logo');
  };

  useEffect(() => {
    if (phase !== 'logo') return;
    const t = setTimeout(() => { playSound('boot', soundEnabled); setPhase('init'); }, 1800);
    return () => clearTimeout(t);
  }, [phase, soundEnabled]);

  useEffect(() => {
    if (phase !== 'init') return;
    let i = 0;
    const run = () => {
      if (i >= bootSequence.length) { setTimeout(() => setPhase('greeting'), 500); return; }
      setTimeout(() => { playSound('checkmark', soundEnabled); setStep(i + 1); i++; run(); }, bootSequence[i].delay);
    };
    const t = setTimeout(run, 350);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  useEffect(() => {
    if (phase !== 'greeting') return;
    const t = setTimeout(() => { setExit(true); setTimeout(onComplete, 900); }, 3000);
    return () => clearTimeout(t);
  }, [phase, onComplete]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 20 ? 'Buenas tardes' : 'Buenas noches';

  return (
    <motion.div
    animate={exit ? { opacity:0, scale:1.05, filter:'blur(12px)' } : {}}
    transition={{ duration:0.9, ease:[0.4,0,0.2,1] }}
    className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
    style={{ background:'#020408' }}
    >
      {/* Cinematic blurred background of the brewery control room */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <img 
          src="/fondo_pc.png" 
          alt="" 
          className="absolute inset-0 h-full w-full object-cover blur-md opacity-35" 
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#020408] via-transparent to-[#020408]" />
      </div>

      <div className="pointer-events-none absolute inset-0"
        style={{ background:'radial-gradient(ellipse 65% 55% at 50% 50%, rgba(0,135,255,0.08) 0%, transparent 68%)' }}
      />

      {/* HUD corners */}
      {(['tl','tr','bl','br'] as const).map(c => (
        <motion.div key={c} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.5 }}
          className={`pointer-events-none absolute ${c.includes('t')?'top-5':'bottom-5'} ${c.includes('l')?'left-5':'right-5'}`}
        >
          <svg width="20" height="20" fill="none">
            {c==='tl'&&<><line x1="0" y1="0" x2="0" y2="20" stroke="rgba(0,225,255,0.2)" strokeWidth="1.5"/><line x1="0" y1="0" x2="20" y2="0" stroke="rgba(0,225,255,0.2)" strokeWidth="1.5"/></>}
            {c==='tr'&&<><line x1="20" y1="0" x2="20" y2="20" stroke="rgba(0,225,255,0.2)" strokeWidth="1.5"/><line x1="0" y1="0" x2="20" y2="0" stroke="rgba(0,225,255,0.2)" strokeWidth="1.5"/></>}
            {c==='bl'&&<><line x1="0" y1="0" x2="0" y2="20" stroke="rgba(0,225,255,0.2)" strokeWidth="1.5"/><line x1="0" y1="20" x2="20" y2="20" stroke="rgba(0,225,255,0.2)" strokeWidth="1.5"/></>}
            {c==='br'&&<><line x1="20" y1="0" x2="20" y2="20" stroke="rgba(0,225,255,0.2)" strokeWidth="1.5"/><line x1="0" y1="20" x2="20" y2="20" stroke="rgba(0,225,255,0.2)" strokeWidth="1.5"/></>}
          </svg>
        </motion.div>
      ))}

      <AnimatePresence mode="wait">
        {phase === 'unlock' && (
          <motion.button key="unlock"
            onClick={handleUnlock}
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0, scale:1.05 }}
            transition={{ duration:0.5 }}
            className="flex flex-col items-center gap-6 px-8 text-center"
          >
            <motion.div
              className="flex h-20 w-20 items-center justify-center rounded-full"
              style={{ border:'1.5px solid rgba(0,225,255,0.35)', background:'rgba(0,225,255,0.05)' }}
              animate={{ boxShadow:['0 0 0px rgba(0,225,255,0.2)','0 0 24px rgba(0,225,255,0.35)','0 0 0px rgba(0,225,255,0.2)'] }}
              transition={{ duration:2.2, repeat:Infinity, ease:'easeInOut' }}
            >
              <Power size={26} style={{ color:'#00e1ff' }} strokeWidth={1.6} />
            </motion.div>
            <div>
              <p className="font-display text-base font-bold tracking-[0.1em] text-white">TOCA PARA INICIAR</p>
              <p className="mt-2 font-mono text-[10px] tracking-[0.25em] uppercase" style={{ color:'rgba(74,96,112,0.7)' }}>Activa audio y voz de J.A.R.B.E.E.R.</p>
            </div>
          </motion.button>
        )}

        {phase === 'logo' && (
          <motion.div key="logo"
            initial={{ opacity:0, scale:0.88 }} animate={{ opacity:1, scale:1 }}
            exit={{ opacity:0, scale:1.1, filter:'blur(8px)' }}
            transition={{ duration:0.8, ease:[0.22,1,0.36,1] }}
            className="flex flex-col items-center"
          >
            {/* Avatar as boot logo */}
            <div className="relative mb-10 flex h-32 w-32 items-center justify-center">
              <motion.div className="absolute inset-0 rounded-full overflow-hidden"
                style={{ border:'2px solid rgba(0,225,255,0.3)' }}
                animate={{ scale:[1,1.04,1] }} transition={{ duration:3, repeat:Infinity, ease:'easeInOut' }}
              >
                <img src="/avatar.png" alt="J.A.R.B.E.E.R." className="h-full w-full object-cover" />
                <div className="absolute inset-0 rounded-full" style={{ background:'radial-gradient(circle, transparent 55%, rgba(2,4,8,0.7) 100%)' }} />
              </motion.div>
              {[0,0.4,0.8].map(d=>(
                <motion.div key={d} className="absolute inset-0 rounded-full"
                  style={{ border:'1px solid rgba(0,225,255,0.25)' }}
                  animate={{ scale:[1,1.55], opacity:[0.5,0] }}
                  transition={{ duration:2, repeat:Infinity, ease:'easeOut', delay:d }}
                />
              ))}
            </div>
            <h1 className="font-display text-4xl font-black tracking-[0.18em] text-white glow-white">J.A.R.B.E.E.R.</h1>
            <p className="mt-3 font-mono text-[9px] tracking-[0.22em] uppercase text-center" style={{ color:'rgba(0,225,255,0.55)' }}>{APP_FULL_NAME}</p>
            <p className="mt-1.5 font-display text-sm italic" style={{ color:'rgba(255,170,0,0.7)' }}>{APP_TAGLINE}</p>
          </motion.div>
        )}

        {phase === 'init' && (
          <motion.div key="init"
            initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
            exit={{ opacity:0, y:-16, filter:'blur(5px)' }} transition={{ duration:0.45 }}
            className="flex w-full max-w-xs flex-col items-center px-6"
          >
            <div className="mb-2 font-display text-lg font-bold tracking-[0.15em] text-white">J.A.R.B.E.E.R.</div>
            <p className="mb-7 font-mono text-[9px] tracking-[0.35em] uppercase" style={{ color:'rgba(74,96,112,0.6)' }}>Inicializando sistema</p>
            <div className="w-full space-y-3">
              {bootSequence.map((item, idx) => {
                const checked = step > idx;
                const active  = step === idx;
                return (
                  <motion.div key={item.label}
                    initial={{ opacity:0, x:-16 }} animate={{ opacity: step >= idx ? 1 : 0.18, x:0 }}
                    transition={{ duration:0.3, delay:idx*0.03 }}
                    className="flex items-center gap-3"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-300"
                      style={{
                        background: checked?'rgba(0,225,255,0.09)':active?'rgba(255,170,0,0.09)':'rgba(13,24,36,0.6)',
                        border: checked?'1px solid rgba(0,225,255,0.28)':active?'1px solid rgba(255,170,0,0.38)':'1px solid rgba(255,255,255,0.06)',
                      }}
                    >
                      {checked
                        ? <motion.div initial={{ scale:0 }} animate={{ scale:1 }} transition={{ type:'spring', stiffness:500, damping:20 }}><Check size={12} style={{ color:'#00e1ff' }} strokeWidth={3}/></motion.div>
                        : active
                        ? <motion.div className="h-3 w-3 rounded-full border-2" style={{ borderColor:'#FFAA00', borderTopColor:'transparent' }} animate={{ rotate:360 }} transition={{ duration:0.6, repeat:Infinity, ease:'linear' }} />
                        : <span className="font-mono text-xs" style={{ color:'rgba(74,96,112,0.45)' }}>{item.icon}</span>
                      }
                    </div>
                    <span className="flex-1 font-mono text-sm tracking-wider transition-colors duration-300"
                      style={{ color: checked?'#e8f0f8':active?'#ffffff':'rgba(74,96,112,0.55)' }}
                    >{item.label}</span>
                    {checked && <span className="font-mono text-[9px] tracking-widest" style={{ color:item.color, opacity:0.7 }}>OK</span>}
                  </motion.div>
                );
              })}
            </div>
            <div className="mt-7 h-px w-full overflow-hidden" style={{ background:'rgba(255,255,255,0.05)' }}>
              <motion.div className="h-full" style={{ background:'linear-gradient(90deg, #0087ff, #00e1ff)' }}
                initial={{ width:'0%' }} animate={{ width:`${(step/bootSequence.length)*100}%` }}
                transition={{ duration:0.35, ease:'easeOut' }}
              />
            </div>
          </motion.div>
        )}

        {phase === 'greeting' && (
          <motion.div key="greeting"
            initial={{ opacity:0, scale:0.96 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0 }}
            transition={{ duration:0.65, ease:[0.22,1,0.36,1] }}
            className="relative flex flex-col items-center px-8 text-center"
          >
            <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.38em]" style={{ color:'#34d399' }}>Sistema preparado · {APP_VERSION}</p>
            <motion.h2 initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.25 }} className="font-display text-5xl font-black text-white glow-white">{greeting},</motion.h2>
            <motion.h2 initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.45 }} className="font-display text-5xl font-black glow-amber" style={{ color:'#FFAA00' }}>{USER_NAME}.</motion.h2>
            <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.8 }} className="mt-6 font-mono text-sm" style={{ color:'rgba(0,225,255,0.75)' }}>
              Lote activo: <span style={{ color:'#00e1ff', fontWeight:500 }}>Golden Ale 26-017</span>
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 font-mono text-[9px] tracking-[0.3em] uppercase" style={{ color:'rgba(42,61,82,0.7)' }}>
        {APP_VERSION} · PROTOTYPE ONE B
      </div>
    </motion.div>
  );
}
