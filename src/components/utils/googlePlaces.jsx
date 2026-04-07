/**
 * Google Maps / Places / Geocoding / Distance Matrix utilities
 * A key é carregada uma única vez via backend e cacheada em memória.
 */

import { base44 } from '@/api/base44Client';

let _apiKey = null;
let _scriptLoaded = false;
let _scriptLoadPromise = null;

// ─── 1. Carregar API key do backend ───────────────────────────────────────────
export async function loadGoogleMapsKey() {
  if (_apiKey) return _apiKey;
  const res = await base44.functions.invoke('getGoogleMapsKey');
  _apiKey = res.data.key;
  return _apiKey;
}

// ─── 2. Injetar script do Google Maps + Places ────────────────────────────────
export function loadGoogleMapsScript(apiKey) {
  if (_scriptLoaded) return Promise.resolve();
  if (_scriptLoadPromise) return _scriptLoadPromise;

  _scriptLoadPromise = new Promise((resolve, reject) => {
    if (window.google?.maps?.places) {
      _scriptLoaded = true;
      return resolve();
    }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=pt-BR`;
    script.async = true;
    script.defer = true;
    script.onload = () => { _scriptLoaded = true; resolve(); };
    script.onerror = () => reject(new Error('Falha ao carregar Google Maps'));
    document.head.appendChild(script);
  });

  return _scriptLoadPromise;
}

// ─── 3. Inicializar e carregar tudo de uma vez ────────────────────────────────
export async function initGoogleMaps() {
  const key = await loadGoogleMapsKey();
  await loadGoogleMapsScript(key);
  return key;
}

// ─── 4. Autocomplete em um <input> ────────────────────────────────────────────
/**
 * @param {HTMLInputElement} inputElement
 * @param {object} options - opções do google.maps.places.Autocomplete
 * @param {function} onPlaceSelected - callback com o objeto place
 * @returns cleanup function
 */
export function initPlacesAutocomplete(inputElement, options = {}, onPlaceSelected) {
  if (!window.google?.maps?.places) {
    console.warn('[googlePlaces] Script ainda não carregado');
    return () => {};
  }

  const defaultOptions = {
    componentRestrictions: { country: 'br' },
    fields: ['geometry', 'formatted_address', 'name', 'address_components'],
    ...options,
  };

  const autocomplete = new window.google.maps.places.Autocomplete(inputElement, defaultOptions);

  const listener = autocomplete.addListener('place_changed', () => {
    const place = autocomplete.getPlace();
    if (place?.geometry?.location) {
      onPlaceSelected(place);
    }
  });

  return () => {
    window.google.maps.event.removeListener(listener);
  };
}

// ─── 5. Geocodificar um endereço → { lat, lng, formattedAddress } ─────────────
export async function geocodeAddress(address) {
  await initGoogleMaps();
  return new Promise((resolve, reject) => {
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode(
      { address, componentRestrictions: { country: 'br' } },
      (results, status) => {
        if (status === 'OK' && results[0]) {
          const loc = results[0].geometry.location;
          resolve({
            lat: loc.lat(),
            lng: loc.lng(),
            formattedAddress: results[0].formatted_address,
          });
        } else {
          reject(new Error(`Geocoding falhou: ${status}`));
        }
      }
    );
  });
}

// ─── 6. Distance Matrix → { distanceKm, durationMin } ────────────────────────
export async function getDistanceMatrix(origin, destination) {
  await initGoogleMaps();
  return new Promise((resolve, reject) => {
    const service = new window.google.maps.DistanceMatrixService();
    service.getDistanceMatrix(
      {
        origins: [new window.google.maps.LatLng(origin.lat, origin.lng)],
        destinations: [new window.google.maps.LatLng(destination.lat, destination.lng)],
        travelMode: window.google.maps.TravelMode.DRIVING,
        language: 'pt-BR',
      },
      (response, status) => {
        if (status === 'OK') {
          const element = response.rows[0]?.elements[0];
          if (element?.status === 'OK') {
            resolve({
              distanceKm: parseFloat((element.distance.value / 1000).toFixed(1)),
              durationMin: Math.ceil(element.duration.value / 60),
              distanceText: element.distance.text,
              durationText: element.duration.text,
            });
          } else {
            reject(new Error('Rota não encontrada'));
          }
        } else {
          reject(new Error(`Distance Matrix falhou: ${status}`));
        }
      }
    );
  });
}

// ─── 7. Helper ETA com Google (usado onde app calcula tempo/distância) ─────────
export async function calculateEtaWithGoogle(origin, destination) {
  try {
    return await getDistanceMatrix(origin, destination);
  } catch (e) {
    console.error('[googlePlaces] calculateEtaWithGoogle erro:', e);
    return null;
  }
}

// ─── 8. Converter place do Google para o formato interno do app ───────────────
export function placeToLocation(place) {
  const lat = place.geometry.location.lat();
  const lng = place.geometry.location.lng();
  const text = place.formatted_address || place.name || '';

  // Extrair número do endereço dos address_components
  const components = place.address_components || [];
  const streetNumber = components.find(c => c.types.includes('street_number'))?.long_name || null;

  return {
    lat,
    lng,
    text,
    userProvidedNumber: streetNumber,
    hasHouseNumber: !!streetNumber,
  };
}