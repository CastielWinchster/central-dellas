import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// SVG do Carro visto de lado
const CarSVG = () => (
  <svg width="90" height="44" viewBox="0 0 90 44" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Sombra */}
    <ellipse cx="45" cy="42" rx="32" ry="3" fill="#F22998" opacity="0.15" />
    {/* Corpo principal */}
    <rect x="8" y="20" width="74" height="16" rx="5" fill="url(#carBody)" />
    {/* Teto/Cabine */}
    <path d="M22 20 C24 10, 30 8, 38 8 L58 8 C66 8, 70 10, 72 20Z" fill="url(#carRoof)" />
    {/* Para-brisa */}
    <path d="M40 9 C43 9, 56 9, 58 9 L68 20 L38 20Z" fill="#b3eaff" opacity="0.55" />
    {/* Janela traseira */}
    <path d="M24 9 L36 20 L22 20Z" fill="#b3eaff" opacity="0.4" />
    {/* Roda traseira */}
    <circle cx="22" cy="36" r="8" fill="#1a1a2e" />
    <circle cx="22" cy="36" r="5" fill="#2a2a3e" />
    <circle cx="22" cy="36" r="2.5" fill="#F22998" />
    {/* Roda dianteira */}
    <circle cx="66" cy="36" r="8" fill="#1a1a2e" />
    <circle cx="66" cy="36" r="5" fill="#2a2a3e" />
    <circle cx="66" cy="36" r="2.5" fill="#F22998" />
    {/* Farol */}
    <rect x="78" y="23" width="7" height="5" rx="2" fill="#fffde7" opacity="0.9" />
    {/* Lanterna */}
    <rect x="5" y="23" width="5" height="5" rx="2" fill="#ff6b6b" opacity="0.8" />
    {/* Detalhe lateral */}
    <rect x="8" y="20" width="74" height="3" rx="2" fill="#fff" opacity="0.12" />
    {/* Gradientes */}
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

// SVG da Moto vista de lado
const MotoSVG = () => (
  <svg width="64" height="44" viewBox="0 0 64 44" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Sombra */}
    <ellipse cx="32" cy="42" rx="22" ry="3" fill="#F22998" opacity="0.15" />
    {/* Roda traseira */}
    <circle cx="12" cy="34" r="9" fill="#1a1a2e" />
    <circle cx="12" cy="34" r="6" fill="#2a2a3e" />
    <circle cx="12" cy="34" r="3" fill="#F22998" />
    {/* Roda dianteira */}
    <circle cx="52" cy="34" r="9" fill="#1a1a2e" />
    <circle cx="52" cy="34" r="6" fill="#2a2a3e" />
    <circle cx="52" cy="34" r="3" fill="#F22998" />
    {/* Chassi */}
    <path d="M12 34 L20 18 L36 16 L52 34" stroke="#BF3B79" strokeWidth="3" strokeLinecap="round" fill="none" />
    {/* Tanque/motor */}
    <path d="M20 18 L36 16 L40 22 L24 24Z" fill="url(#motoBody)" />
    {/* Guidão */}
    <path d="M46 20 L54 16" stroke="#F22998" strokeWidth="3" strokeLinecap="round" />
    <circle cx="54" cy="15" r="2" fill="#fffde7" opacity="0.9" />
    {/* Piloto (silhueta simples) */}
    <ellipse cx="30" cy="14" rx="5" ry="6" fill="#F22998" opacity="0.8" />
    <circle cx="30" cy="9" r="4" fill="#BF3B79" />
    {/* Capacete visor */}
    <path d="M27 8 Q30 5 33 8" stroke="#fffde7" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.6" />
    {/* Farol */}
    <rect x="57" y="30" width="5" height="4" rx="1.5" fill="#fffde7" opacity="0.9" />
    <defs>
      <linearGradient id="motoBody" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#F22998" />
        <stop offset="100%" stopColor="#8C0D60" />
      </linearGradient>
    </defs>
  </svg>
);

// Linhas de velocidade — array estático para evitar problemas com framer-motion
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

export default function LoadingScreen({ isLoading = true, onFinish }) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (!isLoading && !exiting) {
      setExiting(true);
      // Pequeno delay para a animação de saída completar
      const t = setTimeout(() => {
        if (onFinish) onFinish();
      }, 600);
      return () => clearTimeout(t);
    }
  }, [isLoading]);

  return (
    <AnimatePresence>
      {(isLoading || exiting) && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #0D0D0D 0%, #1a0a1a 50%, #0D0D0D 100%)',
          }}
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

            {/* MOTO — vai na frente, mais rápida */}
            <motion.div
              className="absolute"
              style={{ bottom: '28px' }}
              animate={exiting
                ? { x: ['20%', '150%'] }
                : { x: ['-10%', '110%', '-10%'] }
              }
              transition={exiting
                ? { duration: 0.5, ease: 'easeIn' }
                : {
                    duration: 2.2,
                    repeat: Infinity,
                    ease: [0.4, 0, 0.6, 1],
                    times: [0, 0.5, 1],
                  }
              }
            >
              {/* Linhas de velocidade da moto */}
              <motion.div
                className="absolute right-full top-1/2 -translate-y-1/2 flex gap-1 pr-1"
                animate={{ opacity: [0.3, 0.8, 0.3] }}
                transition={{ duration: 0.3, repeat: Infinity }}
              >
                {[16, 10, 6].map((w, i) => (
                  <div key={i} className="h-[2px] rounded-full" style={{ width: w, background: 'rgba(242,41,152,0.6)' }} />
                ))}
              </motion.div>
              <motion.div
                animate={{ rotate: [-1, 1, -1] }}
                transition={{ duration: 0.3, repeat: Infinity }}
              >
                <MotoSVG />
              </motion.div>
            </motion.div>

            {/* CARRO — vem atrás, levemente atrasado */}
            <motion.div
              className="absolute"
              style={{ bottom: '28px' }}
              animate={exiting
                ? { x: ['-5%', '130%'] }
                : { x: ['-30%', '90%', '-30%'] }
              }
              transition={exiting
                ? { duration: 0.55, ease: 'easeIn', delay: 0.05 }
                : {
                    duration: 2.2,
                    repeat: Infinity,
                    ease: [0.4, 0, 0.6, 1],
                    times: [0, 0.5, 1],
                    delay: 0.18,
                  }
              }
            >
              {/* Linhas de velocidade do carro */}
              <motion.div
                className="absolute right-full top-1/2 -translate-y-1/2 flex gap-1 pr-1"
                animate={{ opacity: [0.3, 0.7, 0.3] }}
                transition={{ duration: 0.35, repeat: Infinity }}
              >
                {[22, 14, 8].map((w, i) => (
                  <div key={i} className="h-[2px] rounded-full" style={{ width: w, background: 'rgba(191,59,121,0.6)' }} />
                ))}
              </motion.div>
              <motion.div
                animate={{ rotate: [-0.5, 0.5, -0.5] }}
                transition={{ duration: 0.35, repeat: Infinity }}
              >
                <CarSVG />
              </motion.div>
            </motion.div>
          </div>

          {/* Texto e pontos de loading */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-10 flex flex-col items-center gap-3 z-10"
          >
            <p className="text-sm font-medium" style={{ color: 'rgba(242,242,242,0.5)' }}>
              Carregando...
            </p>
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