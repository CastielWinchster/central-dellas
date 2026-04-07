import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { searchPlaces } from '@/components/utils/geocoding';
import { initGoogleMaps, initPlacesAutocomplete, placeToLocation } from '@/components/utils/googlePlaces';

// Dropdown renderizado via Portal no body — nunca é cortado por overflow/isolation dos pais
function SuggestionDropdown({ anchorRef, show, searching, suggestions, value, onSelect }) {
  const [rect, setRect] = useState(null);

  useEffect(() => {
    if (!show || !anchorRef.current) return;

    const update = () => {
      const r = anchorRef.current?.getBoundingClientRect();
      if (r) setRect(r);
    };
    update();

    // Atualizar ao rolar/redimensionar
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [show, anchorRef]);

  if (!show || !rect) return null;

  const style = {
    position: 'fixed',
    top: rect.bottom + 4,
    left: rect.left,
    width: rect.width,
    zIndex: 999999,
  };

  return createPortal(
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.12 }}
          style={style}
          className="bg-[#141414] border border-[#F22998]/30 rounded-xl shadow-[0_8px_40px_rgba(0,0,0,0.85)] overflow-hidden"
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
                onMouseDown={(e) => { e.preventDefault(); onSelect(s); }}
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
    </AnimatePresence>,
    document.body
  );
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
  const wrapperRef = useRef(null); // ancora para o portal
  const timerRef = useRef(null);
  const googleCleanupRef = useRef(null);
  const googleReadyRef = useRef(false);

  // Refs estáveis para evitar stale closures no debounce
  const userLocationRef = useRef(userLocation);
  const favoritesRef = useRef(favoritesAndRecents);
  useEffect(() => { userLocationRef.current = userLocation; }, [userLocation]);
  useEffect(() => { favoritesRef.current = favoritesAndRecents; }, [favoritesAndRecents]);

  // Inicializar Google Places Autocomplete no input
  useEffect(() => {
    let cancelled = false;
    initGoogleMaps().then(() => {
      if (cancelled || !inputRef.current || googleReadyRef.current) return;
      googleReadyRef.current = true;

      // Bias para região de Orlândia/SP
      const bounds = new window.google.maps.LatLngBounds(
        new window.google.maps.LatLng(-21.5, -48.8),
        new window.google.maps.LatLng(-19.8, -46.5)
      );

      const cleanup = initPlacesAutocomplete(
        inputRef.current,
        { bounds, strictBounds: false },
        (place) => {
          const loc = placeToLocation(place);
          onChange(loc.text);
          if (onSelect) onSelect({ ...loc, lon: loc.lng, name: loc.text, id: `google-${Date.now()}` });
          setShowSuggestions(false);
        }
      );
      googleCleanupRef.current = cleanup;
    }).catch(e => console.warn('[AddressSearchField] Google Places não carregou:', e));

    return () => {
      cancelled = true;
      if (googleCleanupRef.current) googleCleanupRef.current();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const triggerSearch = useCallback((text) => {
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
      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();

      const loc = userLocationRef.current;
      console.log(`[AddressSearch] query="${text}" | proximity=${loc ? `${loc.lat},${loc.lng}` : 'none'}`);

      try {
        const results = await searchPlaces(text, loc, abortRef.current.signal);
        console.log(`[AddressSearch] ${results.length} resultados para "${text}":`, results.map(r => `${r.name} (${Math.round(r.distance)}km)`));
        setSuggestions(results);
        setShowSuggestions(true);
      } catch (e) {
        if (e.name !== 'AbortError') {
          console.error('[AddressSearch] Erro na busca:', e);
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } finally {
        setSearching(false);
      }
    }, 350);
  }, []);

  const handleChange = (e) => {
    const text = e.target.value;
    onChange(text);
    triggerSearch(text);
  };

  const handleFocus = () => {
    if (onFocus) onFocus();
    if ((!value || value.length < 3) && favoritesRef.current.length > 0) {
      setSuggestions(favoritesRef.current);
      setShowSuggestions(true);
    } else if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleBlur = () => {
    setTimeout(() => setShowSuggestions(false), 200);
  };

  const handleSelect = (s) => {
    console.log('[AddressSearch] Selecionado:', s.name, `lat=${s.lat} lon=${s.lon || s.lng}`);
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
    <div ref={wrapperRef}>
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
        {/* Dot colorido */}
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

        {/* Ícones à direita */}
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

      {/* Portal: dropdown renderizado no body, nunca cortado por overflow dos pais */}
      <SuggestionDropdown
        anchorRef={wrapperRef}
        show={showSuggestions}
        searching={searching}
        suggestions={suggestions}
        value={value}
        onSelect={handleSelect}
      />
    </div>
  );
}