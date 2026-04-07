import React, { useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { initGoogleMaps, initPlacesAutocomplete, placeToLocation } from '@/components/utils/googlePlaces';

export default function AddressSearchField({
  label,
  value,
  onChange,
  onSelect,
  placeholder,
  dotColor = '#F22998',
  icon = null,
  isActive = false,
  onFocus,
  error = ''
}) {
  const inputRef = useRef(null);
  const googleReadyRef = useRef(false);
  const googleCleanupRef = useRef(null);

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
        }
      );
      googleCleanupRef.current = cleanup;
    }).catch(e => console.warn('[AddressSearchField] Google Places não carregou:', e));

    return () => {
      cancelled = true;
      if (googleCleanupRef.current) googleCleanupRef.current();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClear = () => {
    onChange('');
    inputRef.current?.focus();
  };

  return (
    <div>
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
          onChange={(e) => onChange(e.target.value)}
          onFocus={onFocus}
          placeholder={placeholder}
          className="flex-1 py-4 bg-transparent text-[#F2F2F2] placeholder:text-[#F2F2F2]/35 text-sm outline-none"
        />

        {/* Ícones à direita */}
        <div className="pr-3 flex items-center gap-1">
          {value && (
            <button
              onMouseDown={(e) => { e.preventDefault(); handleClear(); }}
              className="p-1 rounded-full hover:bg-[#F22998]/10 transition-colors"
            >
              <X className="w-3.5 h-3.5 text-[#F2F2F2]/40 hover:text-[#F2F2F2]/70" />
            </button>
          )}
          {icon && <span className="ml-1">{icon}</span>}
        </div>
      </div>

      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}