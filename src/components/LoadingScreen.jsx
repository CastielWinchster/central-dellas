import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// SVG do Carro visto de lado (inalterado)
const CarSVG = () => (
  <svg width="90" height="44" viewBox="0 0 90 44" fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="45" cy="42" rx="32" ry="3" fill="#F22998" opacity="0.15" />
    <rect x="8" y="20" width="74" height="16" rx="5" fill="url(#carBody)" />
    <path d="M22 20 C24 10, 30 8, 38 8 L58 8 C66 8, 70 10, 72 20Z" fill="url(#carRoof)" />
    <path d="M40 9 C43 9, 56 9, 58 9 L68 20 L38 20Z" fill="#b3eaff" opacity="0.55" />
    <path d="M24 9 L36 20 L22 20Z" fill="#b3eaff" opacity="0.4" />
    <circle cx="22" cy="36" r="8" fill="#1a1a2e" />
    <circle cx="22" cy="36" r="5" fill="#2a2a3e" />
    <circle cx="22" cy="36" r="2.5" fill="#F22998" />
    <circle cx="66" cy="36" r="8" fill="#1a1a2e" />
    <circle cx="66" cy="36" r="5" fill="#2a2a3e" />
    <circle cx="66" cy="36" r="2.5" fill="#F22998" />
    <rect x="78" y="23" width="7" height="5" rx="2" fill="#fffde7" opacity="0.9" />
    <rect x="5" y="23" width="5" height="5" rx="2" fill="#ff6b6b" opacity="0.8" />
    <rect x="8" y="20" width="74" height="3" rx="2" fill="#fff" opacity="0.12" />
    <defs>
      <linearGradient id="carBody" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#BF3B79" />
        <stop offset="100%" stopColor="#8C0D60" />
      </linearGradient>
      <linearGradient id="carRoof" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#F22998" />
        <stop offset="100%" stopColor="#BF3B79" />
      </linearGradient>
    </defs>
  </svg>
);

// SVG da Moto — naked bike esportiva vista de lado
const MotoSVG = () => (
  <svg width="80" height="48" viewBox="0 0 80 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="motoBody" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#F22998" />
        <stop offset="100%" stopColor="#8C0D60" />
      </linearGradient>
    </defs>

    {/* Roda traseira */}
    <circle cx="16" cy="36" r="10" fill="#1a1a2e" stroke="#F22998" strokeWidth="2.5" />
    <circle cx="16" cy="36" r="4" fill="#2a2a3e" />
    <line x1="16" y1="26" x2="16" y2="46" stroke="#F22998" strokeWidth="1" />
    <line x1="6"  y1="36" x2="26" y2="36" stroke="#F22998" strokeWidth="1" />
    <line x1="9"  y1="29" x2="23" y2="43" stroke="#F22998" strokeWidth="1" />
    <line x1="23" y1="29" x2="9"  y2="43" stroke="#F22998" strokeWidth="1" />

    {/* Roda dianteira */}
    <circle cx="64" cy="36" r="10" fill="#1a1a2e" stroke="#F22998" strokeWidth="2.5" />
    <circle cx="64" cy="36" r="4" fill="#2a2a3e" />
    <line x1="64" y1="26" x2="64" y2="46" stroke="#F22998" strokeWidth="1" />
    <line x1="54" y1="36" x2="74" y2="36" stroke="#F22998" strokeWidth="1" />
    <line x1="57" y1="29" x2="71" y2="43" stroke="#F22998" strokeWidth="1" />
    <line x1="71" y1="29" x2="57" y2="43" stroke="#F22998" strokeWidth="1" />

    {/* Chassi */}
    <line x1="16" y1="36" x2="40" y2="20" stroke="#BF3B79" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="40" y1="20" x2="58" y2="20" stroke="#BF3B79" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="58" y1="20" x2="64" y2="36" stroke="#BF3B79" strokeWidth="2"   strokeLinecap="round" />
    <line x1="40" y1="20" x2="32" y2="36" stroke="#BF3B79" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="32" y1="36" x2="16" y2="36" stroke="#BF3B79" strokeWidth="1.5" strokeLinecap="round" />

    {/* Motor */}
    <rect x="28" y="24" width="18" height="12" rx="3" fill="url(#motoBody)" opacity="0.9" />

    {/* Tanque */}
    <ellipse cx="44" cy="18" rx="10" ry="5" fill="url(#motoBody)" />

    {/* Assento */}
    <rect x="26" y="15" width="16" height="4" rx="2" fill="#8C0D60" />

    {/* Carenagem / farol dianteiro */}
    <polygon points="62,20 72,24 70,30 60,28" fill="url(#motoBody)" opacity="0.85" />
    <ellipse cx="70" cy="25" rx="3" ry="4" fill="#fffde7" opacity="0.9" />

    {/* Guidão */}
    <line x1="60" y1="18" x2="68" y2="14" stroke="#BF3B79" strokeWidth="2" strokeLinecap="round" />

    {/* Escapamento */}
    <path d="M16 38 Q10 42 8 44" stroke="#BF3B79" strokeWidth="2.5" strokeLinecap="round" fill="none" />

    {/* Piloto — capacete + corpo agachado */}
    <ellipse cx="42" cy="12" rx="8" ry="5" fill="#BF3B79" transform="rotate(-10,42,12)" />
    <circle cx="46" cy="8" r="5" fill="#1A1A1A" />
    <path d="M42 7 Q46 4 50 7" fill="#F22998" opacity="0.9" />
    <path d="M43 8 Q46 6 49 8" stroke="#b3eaff" strokeWidth="1.2" fill="none" opacity="0.65" />
    <line x1="42" y1="12" x2="60" y2="19" stroke="#8C0D60" strokeWidth="2" strokeLinecap="round" />
    <line x1="38" y1="14" x2="32" y2="24" stroke="#8C0D60" strokeWidth="2" strokeLinecap="round" />

    {/* Lanterna traseira */}
    <rect x="5" y="30" width="4" height="3" rx="1" fill="#ff3030" opacity="0.85" />
  </svg>
);

// Linhas de velocidade
const SPEED_LINES = [
  { top: '30%', width: 60, duration: 0.80, delay: 0.00 },
  { top: '42%', width: 120, duration: 0.95, delay: 0.12 },
  { top: '54%', width: 80, duration: 1.10, delay: 0.24 },
  { top: '66%', width: 100, duration: 1.25, delay: 0.36 },
  { top: '78%', width: 70, duration: 1.40, delay: 0.48 },
];

const SpeedLines = ({ count = 5, opacity = 0.4 }) => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden">
    {SPEED_LINES.slice(0, count).map((line, i) => (
      <motion.div
        key={i}
        className="absolute h-[2px] rounded-full"
        style={{
          top: line.top,
          background: 'linear-gradient(90deg, transparent, #F22998, transparent)',
          width: `${line.width}px`,
          opacity,
        }}
        animate={{ x: ['-100vw', '100vw'] }}
        transition={{
          duration: line.duration,
          repeat: Infinity,
          ease: 'linear',
          delay: line.delay,
        }}
      />
    ))}
  </div>
);

export default function LoadingScreen({ isLoading = true, onFinish, onComplete }) {
  const [exiting, setExiting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Iniciando sistema...');

  // Sistema de progresso — garante mínimo de 3s
  useEffect(() => {
    const steps = [
      { pct: 15, text: 'Carregando mapa...',         delay: 400  },
      { pct: 35, text: 'Verificando localização...', delay: 900  },
      { pct: 55, text: 'Conectando ao servidor...',  delay: 1500 },
      { pct: 75, text: 'Carregando perfil...',        delay: 2100 },
      { pct: 90, text: 'Quase pronto...',             delay: 2600 },
      { pct: 100, text: 'Tudo pronto! ✓',            delay: 3000 },
    ];

    const timers = steps.map(({ pct, text, delay }) =>
      setTimeout(() => {
        setProgress(pct);
        setStatusText(text);
      }, delay)
    );

    const done = setTimeout(() => {
      setExiting(true);
      setTimeout(() => {
        if (onComplete) onComplete();
        if (onFinish) onFinish();
      }, 500);
    }, 3300);

    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(done);
    };
  }, []);

  return (
    <AnimatePresence>
      {!exiting && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center overflow-hidden"
          style={{ background: '#000000' }}
        >
          {/* Brilho central difuso */}
          <div
            className="absolute w-[400px] h-[200px] rounded-full pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse, rgba(242,41,152,0.12) 0%, transparent 70%)',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          />

          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-12 z-10"
          >
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6966ea008a15739746d55f4e/50cfce50f_central2.png"
              alt="Central Dellas"
              className="h-16 w-auto"
            />
          </motion.div>

          {/* Pista de corrida */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '384px',
              height: '70px',
              overflow: 'hidden',
              zIndex: 10,
            }}
          >
            {/* Linha sólida da pista — na base */}
            <div
              style={{
                position: 'absolute',
                bottom: '0px',
                left: 0,
                right: 0,
                height: '3px',
                borderRadius: '9999px',
                background: 'linear-gradient(90deg, transparent, rgba(242,41,152,0.3), rgba(242,41,152,0.5), rgba(242,41,152,0.3), transparent)',
              }}
            />

            {/* Tracejado animado — logo acima da linha sólida */}
            <motion.div
              style={{
                position: 'absolute',
                bottom: '4px',
                left: 0,
                right: 0,
                height: '2px',
                backgroundImage: 'repeating-linear-gradient(90deg, rgba(242,41,152,0.25) 0px, rgba(242,41,152,0.25) 20px, transparent 20px, transparent 40px)',
              }}
              animate={{ backgroundPosition: ['0px', '40px'] }}
              transition={{ duration: 0.5, repeat: Infinity, ease: 'linear' }}
            />

            {/* Linhas de velocidade de fundo */}
            <SpeedLines count={4} opacity={0.25} />

            {/* CARRO — rodas tocam a base (bottom: 3px = cima da linha da pista) */}
            <div
              style={{
                position: 'absolute',
                bottom: '3px',
                left: 0,
                animation: 'cd-car 2.8s linear infinite',
                willChange: 'transform',
                filter: 'drop-shadow(0 0 8px rgba(242,41,152,0.6))',
              }}
            >
              <CarSVG />
            </div>

            {/* MOTO — rodas tocam a base */}
            <div
              style={{
                position: 'absolute',
                bottom: '3px',
                left: 0,
                animation: 'cd-moto 2.8s linear infinite',
                animationDelay: '0.8s',
                willChange: 'transform',
                filter: 'drop-shadow(0 0 6px rgba(242,41,152,0.5))',
              }}
            >
              <MotoSVG />
            </div>
          </div>

          {/* Texto de status e barra de progresso */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-10 flex flex-col items-center gap-3 z-10"
          >
            <p className="text-sm font-medium" style={{ color: 'rgba(242,242,242,0.5)' }}>
              {statusText}
            </p>

            {/* Barra de progresso */}
            <div style={{
              width: '55%', maxWidth: 220, height: 3,
              borderRadius: 2, margin: '0 auto',
              background: 'rgba(220,30,140,0.2)',
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #d4006e, #ff4fa0)',
                borderRadius: 2,
                transition: 'width 0.5s ease',
                boxShadow: '0 0 8px rgba(220,30,140,0.5)',
              }} />
            </div>

            <div className="flex gap-2">
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full"
                  style={{ background: '#F22998' }}
                  animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}