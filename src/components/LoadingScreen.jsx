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

// SVG da Moto — estilo naked/esportiva vista de lado
const MotoSVG = () => (
  <svg width="72" height="48" viewBox="0 0 72 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="motoTank" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#F22998" />
        <stop offset="100%" stopColor="#8C0D60" />
      </linearGradient>
      <linearGradient id="motoFairing" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#BF3B79" />
        <stop offset="100%" stopColor="#F22998" />
      </linearGradient>
    </defs>

    {/* Sombra */}
    <ellipse cx="36" cy="46" rx="26" ry="2.5" fill="#F22998" opacity="0.15" />

    {/* Roda traseira — grande */}
    <circle cx="14" cy="36" r="11" fill="#111" />
    <circle cx="14" cy="36" r="8" fill="#1e1e2e" />
    <circle cx="14" cy="36" r="4" fill="#2a2a3e" />
    <circle cx="14" cy="36" r="2" fill="#F22998" />
    {/* Raios roda traseira */}
    <line x1="14" y1="25" x2="14" y2="47" stroke="#F22998" strokeWidth="0.8" opacity="0.4" />
    <line x1="3" y1="36" x2="25" y2="36" stroke="#F22998" strokeWidth="0.8" opacity="0.4" />
    <line x1="6" y1="28" x2="22" y2="44" stroke="#F22998" strokeWidth="0.8" opacity="0.4" />
    <line x1="22" y1="28" x2="6" y2="44" stroke="#F22998" strokeWidth="0.8" opacity="0.4" />

    {/* Roda dianteira — grande */}
    <circle cx="58" cy="36" r="11" fill="#111" />
    <circle cx="58" cy="36" r="8" fill="#1e1e2e" />
    <circle cx="58" cy="36" r="4" fill="#2a2a3e" />
    <circle cx="58" cy="36" r="2" fill="#F22998" />
    {/* Raios roda dianteira */}
    <line x1="58" y1="25" x2="58" y2="47" stroke="#F22998" strokeWidth="0.8" opacity="0.4" />
    <line x1="47" y1="36" x2="69" y2="36" stroke="#F22998" strokeWidth="0.8" opacity="0.4" />
    <line x1="50" y1="28" x2="66" y2="44" stroke="#F22998" strokeWidth="0.8" opacity="0.4" />
    <line x1="66" y1="28" x2="50" y2="44" stroke="#F22998" strokeWidth="0.8" opacity="0.4" />

    {/* Suspensão dianteira (garfo) */}
    <line x1="54" y1="25" x2="58" y2="36" stroke="#888" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="57" y1="25" x2="61" y2="36" stroke="#666" strokeWidth="1.5" strokeLinecap="round" />

    {/* Suspensão traseira */}
    <line x1="14" y1="28" x2="22" y2="22" stroke="#777" strokeWidth="2" strokeLinecap="round" />

    {/* Chassi principal — linha do quadro */}
    <path d="M14 28 L22 22 L36 18 L54 22 L58 28" stroke="#BF3B79" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    {/* Tubo inferior do chassi */}
    <path d="M22 22 L30 30 L14 30" stroke="#8C0D60" strokeWidth="1.5" strokeLinecap="round" fill="none" />

    {/* Tanque — forma oval esportiva */}
    <path d="M28 14 C30 10, 42 10, 46 14 L48 20 L26 22 Z" fill="url(#motoTank)" />
    {/* Brilho do tanque */}
    <path d="M30 12 C33 10, 40 10, 43 12 L44 15 L30 15 Z" fill="white" opacity="0.15" />

    {/* Carenagem lateral / motor */}
    <path d="M26 22 L48 20 L50 28 L22 28 Z" fill="url(#motoFairing)" opacity="0.85" />
    {/* Detalhe motor */}
    <rect x="30" y="23" width="12" height="6" rx="1.5" fill="#0D0D0D" opacity="0.5" />

    {/* Escapamento */}
    <path d="M22 28 L16 30 L14 33" stroke="#888" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    <ellipse cx="14" cy="33" rx="2" ry="1.2" fill="#555" />

    {/* Assento */}
    <path d="M28 14 L44 14 L46 16 L26 16 Z" fill="#1A1A1A" rx="2" />
    <path d="M28 14 L44 14 L44 15 L28 15 Z" fill="#fff" opacity="0.08" />

    {/* Piloto agachado */}
    {/* Corpo inclinado */}
    <ellipse cx="35" cy="10" rx="7" ry="5" fill="#BF3B79" transform="rotate(-15, 35, 10)" />
    {/* Capacete aerodinâmico */}
    <ellipse cx="38" cy="6" rx="5" ry="4.5" fill="#1A1A1A" />
    <path d="M34 5 Q38 2 42 5" fill="#F22998" opacity="0.9" />
    {/* Visor capacete */}
    <path d="M35 6 Q38 4 41 6" stroke="#b3eaff" strokeWidth="1.5" fill="none" opacity="0.7" />
    {/* Braços sobre guidão */}
    <path d="M35 10 L50 18" stroke="#8C0D60" strokeWidth="2" strokeLinecap="round" />
    {/* Pernas */}
    <path d="M30 13 L26 22" stroke="#8C0D60" strokeWidth="2" strokeLinecap="round" />

    {/* Guidão — baixo e esportivo */}
    <path d="M50 16 L56 14" stroke="#ccc" strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="56" cy="13.5" r="1.5" fill="#888" />

    {/* Farol dianteiro aerodinâmico */}
    <path d="M63 30 L68 28 L68 34 L63 33 Z" fill="#fffde7" opacity="0.95" />
    <path d="M63 30 L68 28 L68 31 L63 31 Z" fill="white" opacity="0.4" />

    {/* Lanterna traseira */}
    <rect x="4" y="30" width="4" height="3" rx="1" fill="#ff3030" opacity="0.85" />
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
          <div className="relative w-full max-w-sm h-[120px] z-10">
            {/* Linha da pista */}
            <div
              className="absolute bottom-8 left-0 right-0 h-[3px] rounded-full"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(242,41,152,0.3), rgba(242,41,152,0.5), rgba(242,41,152,0.3), transparent)' }}
            />

            {/* Tracejado central animado */}
            <motion.div
              className="absolute bottom-[26px] left-0 right-0 h-[2px]"
              style={{
                backgroundImage: 'repeating-linear-gradient(90deg, rgba(242,41,152,0.25) 0px, rgba(242,41,152,0.25) 20px, transparent 20px, transparent 40px)',
              }}
              animate={{ backgroundPosition: ['0px', '40px'] }}
              transition={{ duration: 0.5, repeat: Infinity, ease: 'linear' }}
            />

            {/* Linhas de velocidade de fundo */}
            <SpeedLines count={4} opacity={0.25} />

            {/* CARRO — na frente, parte de 25vw */}
            <div
              className="absolute"
              style={{
                bottom: '28px',
                animation: 'cd-car 2.8s linear infinite',
                willChange: 'transform',
                filter: 'drop-shadow(0 0 8px rgba(242,41,152,0.6))',
              }}
            >
              <CarSVG />
            </div>

            {/* MOTO — atrás do carro, parte de 10vw com delay 0.8s */}
            <div
              className="absolute"
              style={{
                bottom: '26px',
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