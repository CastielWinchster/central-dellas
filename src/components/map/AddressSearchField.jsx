import React, { useState, useRef, useCallback } from 'react';
import { Loader2, MapPin, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { searchPlaces } from '@/components/utils/geocoding';

function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

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

  const doSearch = useCallback(
    debounce(async (text) => {
      if (!text || text.length < 3) {
        setSuggestions(favoritesAndRecents);
        setShowSuggestions(favoritesAndRecents.length > 0);
        setSearching(false);
        return;
      }
      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();
      setSearching(true);
      try {
        const results = await searchPlaces(text, userLocation, abortRef.current.signal);
        const combined = value.length < 3 ? [...favoritesAndRecents, ...results] : results;
        setSuggestions(combined);
        setShowSuggestions(combined.length > 0);
      } catch (e) {
        if (e.name !== 'AbortError') setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 350),
    [userLocation, favoritesAndRecents, value]
  );

  const handleChange = (e) => {
    onChange(e.target.value);
    doSearch(e.target.value);
  };

  const handleFocus = () => {
    if (onFocus) onFocus();
    if (value.length < 3 && favoritesAndRecents.length > 0) {
      setSuggestions(favoritesAndRecents);
      setShowSuggestions(true);
    } else if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleBlur = () => {
    setTimeout(() => setShowSuggestions(false), 200);
  };

  const handleSelect = (s) => {
    setShowSuggestions(false);
    setSuggestions([]);
    if (onSelect) onSelect(s);
  };

  const handleClear = () => {
    onChange('');
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  return (
    <div className="relative">
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
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: dotColor, flexShrink: 0,
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
            <button onClick={handleClear} className="p-1 rounded-full hover:bg-[#F22998]/10 transition-colors">
              <X className="w-3.5 h-3.5 text-[#F2F2F2]/40 hover:text-[#F2F2F2]/70" />
            </button>
          )}
          {icon && !searching && <span className="ml-1">{icon}</span>}
        </div>
      </div>

      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}

      {/* Dropdown */}
      <AnimatePresence>
        {showSuggestions && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6, scaleY: 0.95 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -6, scaleY: 0.95 }}
            transition={{ duration: 0.15 }}
            style={{ transformOrigin: 'top' }}
            className="absolute z-[100] w-full mt-1.5 bg-[#141414] border border-[#F22998]/25 rounded-xl shadow-[0_8px_40px_rgba(0,0,0,0.5)] overflow-hidden max-h-72 overflow-y-auto"
          >
            {suggestions.map((s, i) => (
              <button
                key={s.id || i}
                onMouseDown={() => handleSelect(s)}
                className="w-full px-4 py-3 text-left flex items-start gap-3 hover:bg-[#F22998]/10 transition-colors border-b border-[#F22998]/8 last:border-0"
              >
                <span className="text-lg leading-none mt-0.5 flex-shrink-0">{s.icon || '📍'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm text-[#F2F2F2] font-medium truncate">
                      {s.name || s.street}
                      {s.housenumber && <span className="text-[#F22998]">, {s.housenumber}</span>}
                      {s.userProvidedNumber && <span className="text-[#F22998]">, nº {s.userProvidedNumber}</span>}
                    </p>
                    {(s.isFavorite || s.isRecent) && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#F22998]/20 text-[#F22998] font-medium">
                        {s.categoryLabel}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#F2F2F2]/45 truncate mt-0.5">
                    {[s.street && s.street !== s.name && s.street, s.city].filter(Boolean).join(' • ')}
                    {s.categoryLabel && !s.isFavorite && !s.isRecent && (
                      <span className="text-[#F22998]/70"> • {s.categoryLabel}</span>
                    )}
                  </p>
                  {s.isFaraway && (
                    <p className="text-[10px] text-yellow-400 mt-0.5">⚠️ ~{Math.round(s.distance)} km de você</p>
                  )}
                </div>
              </button>
            ))}

            {searching && (
              <div className="px-4 py-3 flex items-center gap-2 text-[#F2F2F2]/40 text-sm">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#F22998]" />
                Buscando...
              </div>
            )}
          </motion.div>
        )}

        {showSuggestions && !searching && suggestions.length === 0 && value.length >= 3 && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute z-[100] w-full mt-1.5 bg-[#141414] border border-[#F22998]/25 rounded-xl shadow-lg px-4 py-3"
          >
            <p className="text-sm text-[#F2F2F2]/40 text-center">Nenhum resultado encontrado</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}