import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Loader2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { searchPlaces } from '@/components/utils/geocoding';

export default function AddressSearchField({
  label,
  value,
  onChange,
  onSelect,
  placeholder,
  dotColor = '#F22998',
  icon = null,
  userLocation = null,
  favoritesAndRecents = [],
  isActive = false,
  onFocus,
  error = ''
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searching, setSearching] = useState(false);
  const abortRef = useRef(null);
  const inputRef = useRef(null);
  const timerRef = useRef(null);

  // Função de busca estável — usa refs para evitar stale closures
  const userLocationRef = useRef(userLocation);
  const favoritesRef = useRef(favoritesAndRecents);
  useEffect(() => { userLocationRef.current = userLocation; }, [userLocation]);
  useEffect(() => { favoritesRef.current = favoritesAndRecents; }, [favoritesAndRecents]);

  const triggerSearch = useCallback((text) => {
    // Cancela timer anterior
    if (timerRef.current) clearTimeout(timerRef.current);

    if (!text || text.length < 3) {
      const favRec = favoritesRef.current;
      setSuggestions(favRec);
      setShowSuggestions(favRec.length > 0);
      setSearching(false);
      return;
    }

    setSearching(true);

    timerRef.current = setTimeout(async () => {
      // Cancela request anterior
      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();

      console.log('[AddressSearchField] Buscando:', text, '| userLocation:', userLocationRef.current);

      try {
        const results = await searchPlaces(text, userLocationRef.current, abortRef.current.signal);
        console.log('[AddressSearchField] Resultados recebidos:', results.length, results);

        setSuggestions(results);
        setShowSuggestions(true); // Sempre mostrar (inclusive "nenhum resultado")
      } catch (e) {
        if (e.name !== 'AbortError') {
          console.error('[AddressSearchField] Erro na busca:', e);
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } finally {
        setSearching(false);
      }
    }, 350);
  }, []); // sem dependências — usa refs

  const handleChange = (e) => {
    const text = e.target.value;
    onChange(text);
    triggerSearch(text);
  };

  const handleFocus = () => {
    if (onFocus) onFocus();
    // Ao focar, mostrar favoritos/recentes se input vazio ou curto
    if ((!value || value.length < 3) && favoritesAndRecents.length > 0) {
      setSuggestions(favoritesAndRecents);
      setShowSuggestions(true);
    } else if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleBlur = () => {
    // Delay para permitir click na sugestão antes de fechar
    setTimeout(() => setShowSuggestions(false), 250);
  };

  const handleSelect = (s) => {
    console.log('[AddressSearchField] Sugestão selecionada:', s);
    setShowSuggestions(false);
    setSuggestions([]);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (abortRef.current) abortRef.current.abort();
    if (onSelect) onSelect(s);
  };

  const handleClear = () => {
    onChange('');
    setSuggestions([]);
    setShowSuggestions(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    inputRef.current?.focus();
  };

  return (
    <div className="relative" style={{ isolation: 'isolate' }}>
      {label && (
        <label className="text-xs font-semibold tracking-wide text-[#F2F2F2]/60 mb-2 block uppercase">
          {label}
        </label>
      )}
      <div className={`relative flex items-center transition-all duration-200 rounded-xl border ${
        isActive
          ? 'border-[#F22998] shadow-[0_0_0_3px_rgba(242,41,152,0.15)]'
          : error
          ? 'border-red-500'
          : 'border-[#F22998]/20 hover:border-[#F22998]/40'
      } bg-[#0D0D0D]`}>
        {/* Dot */}
        <div className="pl-4 pr-3 flex items-center flex-shrink-0">
          <div style={{
            width: 12, height: 12, borderRadius: '50%', background: dotColor, flexShrink: 0,
            boxShadow: isActive ? `0 0 8px ${dotColor}` : 'none',
            transition: 'box-shadow 0.2s'
          }} />
        </div>

        <input
          ref={inputRef}
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className="flex-1 py-4 bg-transparent text-[#F2F2F2] placeholder:text-[#F2F2F2]/35 text-sm outline-none"
        />

        {/* Right icons */}
        <div className="pr-3 flex items-center gap-1">
          {searching && <Loader2 className="w-4 h-4 text-[#F22998] animate-spin" />}
          {!searching && value && (
            <button
              onMouseDown={(e) => { e.preventDefault(); handleClear(); }}
              className="p-1 rounded-full hover:bg-[#F22998]/10 transition-colors"
            >
              <X className="w-3.5 h-3.5 text-[#F2F2F2]/40 hover:text-[#F2F2F2]/70" />
            </button>
          )}
          {icon && !searching && <span className="ml-1">{icon}</span>}
        </div>
      </div>

      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}

      {/* Dropdown — z-index alto e position absolute para não ser cortado */}
      <AnimatePresence>
        {showSuggestions && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 9999, marginTop: 4 }}
            className="bg-[#141414] border border-[#F22998]/30 rounded-xl shadow-[0_8px_40px_rgba(0,0,0,0.7)] overflow-hidden"
          >
            {searching && suggestions.length === 0 && (
              <div className="px-4 py-3 flex items-center gap-2 text-[#F2F2F2]/50 text-sm">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#F22998]" />
                Buscando...
              </div>
            )}

            {!searching && suggestions.length === 0 && value?.length >= 3 && (
              <div className="px-4 py-3 text-sm text-[#F2F2F2]/40 text-center">
                Nenhum resultado encontrado
              </div>
            )}

            <div className="max-h-72 overflow-y-auto">
              {suggestions.map((s, i) => (
                <button
                  key={s.id || i}
                  onMouseDown={(e) => { e.preventDefault(); handleSelect(s); }}
                  className="w-full px-4 py-3 text-left flex items-start gap-3 hover:bg-[#F22998]/10 transition-colors border-b border-white/5 last:border-0"
                >
                  <span className="text-lg leading-none mt-0.5 flex-shrink-0">{s.icon || '📍'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm text-[#F2F2F2] font-medium truncate">
                        {s.name || s.street}
                        {s.housenumber && <span className="text-[#F22998]">, {s.housenumber}</span>}
                      </p>
                      {(s.isFavorite || s.isRecent) && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#F22998]/20 text-[#F22998] font-medium flex-shrink-0">
                          {s.categoryLabel}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#F2F2F2]/40 truncate mt-0.5">
                      {[s.street && s.street !== s.name && s.street, s.city].filter(Boolean).join(' • ')}
                      {s.categoryLabel && !s.isFavorite && !s.isRecent && (
                        <span className="text-[#F22998]/60"> • {s.categoryLabel}</span>
                      )}
                    </p>
                    {s.isFaraway && (
                      <p className="text-[10px] text-yellow-400 mt-0.5">⚠️ ~{Math.round(s.distance)} km de você</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}