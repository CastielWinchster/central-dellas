import React, { useEffect, useState, useRef, useCallback } from 'react';
import Map, { Marker, Source, Layer, NavigationControl } from 'react-map-gl';
import { loadGoogleMapsKey } from '@/components/utils/googlePlaces';
import mapboxgl from 'mapbox-gl';
import { Car, MapPin, Target, Navigation, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { MAPBOX_CONFIG, loadMapboxToken } from '@/components/utils/mapboxConfig';
import { reverseGeocode } from '@/components/utils/geocoding';
import { base44 } from '@/api/base44Client';
import 'mapbox-gl/dist/mapbox-gl.css';

function calculateHeading(fromLat, fromLng, toLat, toLng) {
  const dLng = (toLng - fromLng) * Math.PI / 180;
  const lat1 = fromLat * Math.PI / 180;
  const lat2 = toLat * Math.PI / 180;
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

// Decodificador de Google Encoded Polyline
function decodePolyline(str) {
  const result = [];
  let i = 0, lat = 0, lng = 0;
  while (i < str.length) {
    let b, s = 0, r = 0;
    do { b = str.charCodeAt(i++) - 63; r |= (b & 0x1f) << s; s += 5; } while (b >= 0x20);
    lat += (r & 1) ? ~(r >> 1) : (r >> 1);
    s = 0; r = 0;
    do { b = str.charCodeAt(i++) - 63; r |= (b & 0x1f) << s; s += 5; } while (b >= 0x20);
    lng += (r & 1) ? ~(r >> 1) : (r >> 1);
    result.push([lng / 1e5, lat / 1e5]);
  }
  return result;
}

const UserMarker = ({ heading = 0 }) => (
  <div style={{
    width: 44, height: 44, borderRadius: '50%',
    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    border: '3px solid white',
    boxShadow: '0 4px 12px rgba(59,130,246,0.4), 0 0 0 8px rgba(59,130,246,0.1)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transform: `translate(-50%,-50%) rotate(${heading}deg)`,
    transition: 'transform 0.5s ease-out'
  }}>
    <Navigation className="w-6 h-6 text-white" />
  </div>
);

// Marcador animado de origem
const PickupMarker = ({ animate }) => (
  <div>
    <style>{`
      @keyframes markerIn {
        0% { opacity: 0; transform: scale(0.3) translateY(10px); }
        60% { transform: scale(1.2) translateY(-4px); }
        100% { opacity: 1; transform: scale(1) translateY(0); }
      }
      @keyframes markerPulse {
        0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.5), 0 4px 20px rgba(34,197,94,0.4); }
        50% { box-shadow: 0 0 0 12px rgba(34,197,94,0), 0 4px 20px rgba(34,197,94,0.4); }
      }
      .pickup-marker {
        animation: markerIn 0.45s cubic-bezier(0.34,1.56,0.64,1) both, markerPulse 2s 0.5s ease-in-out infinite;
      }
    `}</style>
    <div className="pickup-marker" style={{
      background: 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)',
      borderRadius: '50% 50% 50% 0',
      padding: 10,
      border: '2.5px solid white',
      transform: 'rotate(-45deg)',
      width: 42, height: 42,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <MapPin className="w-5 h-5 text-white" style={{ transform: 'rotate(45deg)' }} />
    </div>
    <div style={{
      width: 8, height: 8,
      borderRadius: '50%',
      background: '#22c55e',
      margin: '2px auto 0',
      opacity: 0.7
    }} />
  </div>
);

// Marcador animado de destino
const DestinationMarker = () => (
  <div>
    <style>{`
      @keyframes destIn {
        0% { opacity: 0; transform: scale(0.3) translateY(10px); }
        60% { transform: scale(1.2) translateY(-4px); }
        100% { opacity: 1; transform: scale(1) translateY(0); }
      }
      @keyframes destGlow {
        0%, 100% { box-shadow: 0 0 0 0 rgba(242,41,152,0.5), 0 4px 20px rgba(242,41,152,0.4); }
        50% { box-shadow: 0 0 0 12px rgba(242,41,152,0), 0 4px 20px rgba(242,41,152,0.4); }
      }
      .dest-marker {
        animation: destIn 0.45s cubic-bezier(0.34,1.56,0.64,1) both, destGlow 2s 0.5s ease-in-out infinite;
      }
    `}</style>
    <div className="dest-marker" style={{
      background: 'linear-gradient(135deg, #8C0D60 0%, #F22998 100%)',
      borderRadius: '50% 50% 50% 0',
      padding: 10,
      border: '2.5px solid white',
      transform: 'rotate(-45deg)',
      width: 42, height: 42,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <MapPin className="w-5 h-5 text-white" style={{ transform: 'rotate(45deg)' }} />
    </div>
    <div style={{
      width: 8, height: 8,
      borderRadius: '50%',
      background: '#F22998',
      margin: '2px auto 0',
      opacity: 0.7
    }} />
  </div>
);

const CarMarker3D = ({ tags = [], heading = 0 }) => {
  let color = '#F22998';
  let glow = '242,41,152';
  if (tags.includes('aceita_pet')) { color = '#a855f7'; glow = '168,85,247'; }
  else if (tags.includes('frete')) { color = '#3b82f6'; glow = '59,130,246'; }

  return (
    <div style={{
      transform: `translate(-50%,-50%) rotate(${heading}deg)`,
      transition: 'transform 0.8s ease-out',
      filter: `drop-shadow(0 0 8px rgba(${glow},0.9))`,
    }}>
      <svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id={`car-top-${glow}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.35"/>
            <stop offset="100%" stopColor={color} stopOpacity="0"/>
          </linearGradient>
          <linearGradient id={`car-body-${glow}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color}/>
            <stop offset="100%" stopColor={color} stopOpacity="0.7"/>
          </linearGradient>
          <filter id={`car-shadow-${glow}`} x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor={color} floodOpacity="0.5"/>
          </filter>
        </defs>
        {/* Sombra no chão */}
        <ellipse cx="24" cy="43" rx="10" ry="3" fill={color} opacity="0.3"/>
        {/* Corpo do carro */}
        <rect x="8" y="22" width="32" height="14" rx="4" fill={`url(#car-body-${glow})`} filter={`url(#car-shadow-${glow})`}/>
        {/* Teto / cabine */}
        <rect x="13" y="14" width="22" height="12" rx="5" fill={color}/>
        {/* Reflexo no teto */}
        <rect x="13" y="14" width="22" height="12" rx="5" fill={`url(#car-top-${glow})`}/>
        {/* Para-brisa */}
        <rect x="14" y="15" width="20" height="8" rx="3" fill="#b3eaff" opacity="0.55"/>
        {/* Rodas */}
        <circle cx="14" cy="36" r="4.5" fill="#111" stroke="#444" strokeWidth="1"/>
        <circle cx="14" cy="36" r="2" fill="#888"/>
        <circle cx="34" cy="36" r="4.5" fill="#111" stroke="#444" strokeWidth="1"/>
        <circle cx="34" cy="36" r="2" fill="#888"/>
        {/* Faróis */}
        <rect x="8" y="25" width="4" height="3" rx="1" fill="#fffde7" opacity="0.9"/>
        <rect x="36" y="25" width="4" height="3" rx="1" fill="#ffcdd2" opacity="0.8"/>
        {/* Linha lateral brilho 3D */}
        <rect x="8" y="22" width="32" height="3" rx="2" fill="#fff" opacity="0.18"/>
      </svg>
    </div>
  );
};

export default function MapView({
  pickupLocation,
  destinationLocation,
  nearbyDrivers = [],
  center = MAPBOX_CONFIG.DEFAULT_CENTER,
  showRoute = false,
  className = '',
  onPickupDragEnd = null,
  onDestinationDragEnd = null,
  pickupDraggable = false,
  destinationDraggable = false,
  onMapClick = null,
  onDestinationSelected = null,
  showRealTimeDrivers = false,
  filterPets = false,
  passengerMarker = null,
  driverLocation = null,
}) {
  const [tokenLoaded, setTokenLoaded] = useState(!!MAPBOX_CONFIG.ACCESS_TOKEN);

  useEffect(() => {
    if (MAPBOX_CONFIG.ACCESS_TOKEN) { setTokenLoaded(true); return; }
    loadMapboxToken(base44).then(() => setTokenLoaded(true)).catch(e => {
      console.error('Erro ao carregar token Mapbox:', e);
    });
  }, []);

  const [viewState, setViewState] = useState({
    longitude: center[0], latitude: center[1],
    zoom: MAPBOX_CONFIG.DEFAULT_ZOOM,
    pitch: 0,
    bearing: 0
  });

  const [userLocation, setUserLocation] = useState(null);
  const [userHeading, setUserHeading] = useState(0);
  const [routeData, setRouteData] = useState(null);
  const [routeProgress, setRouteProgress] = useState(null);
  const [routeAnimOffset, setRouteAnimOffset] = useState(0);
  const [followMode, setFollowMode] = useState(true);
  const [driversWithHeading, setDriversWithHeading] = useState([]);
  const [realTimeDrivers, setRealTimeDrivers] = useState([]);
  const realTimeIntervalRef = useRef(null);

  const mapRef = useRef();
  const watchIdRef = useRef(null);
  const lastUserPosRef = useRef(null);
  const followTimeoutRef = useRef(null);
  const routeAnimationRef = useRef(null);
  const dashAnimRef = useRef(null);
  const driverAnimationsRef = useRef({});
  const [currentStreet, setCurrentStreet] = useState('');
  const googleKeyRef = useRef(null);
  const streetIntervalRef = useRef(null);
  const driverLocationRef = useRef(driverLocation);

  // Polling de motoristas em tempo real
  useEffect(() => {
    if (!showRealTimeDrivers) return;

    const fetchDrivers = async () => {
      try {
        const thirtySecondsAgo = new Date(Date.now() - 30000).toISOString();
        const online = await base44.entities.DriverPresence.filter({
          is_online: true,
          last_seen_at: { $gte: thirtySecondsAgo }
        });
        const mapped = online
          .filter(d => d.lat && d.lng)
          .map(d => ({
            id: d.driver_id,
            lat: d.lat,
            lng: d.lng,
            tags: d.tags || [],
            heading: d.heading || 0,
          }));
        setRealTimeDrivers(filterPets ? mapped.filter(d => d.tags.includes('aceita_pet')) : mapped);
      } catch (e) {
        console.error('[MapView] Erro ao buscar motoristas:', e);
      }
    };

    fetchDrivers();
    realTimeIntervalRef.current = setInterval(fetchDrivers, 4000);
    return () => clearInterval(realTimeIntervalRef.current);
  }, [showRealTimeDrivers, filterPets]);

  // Sync driverLocation ref
  useEffect(() => { driverLocationRef.current = driverLocation; }, [driverLocation]);

  // Street name via Google Reverse Geocoding (15s)
  useEffect(() => {
    if (!driverLocation?.lat) {
      clearInterval(streetIntervalRef.current);
      streetIntervalRef.current = null;
      return;
    }
    const fetchStreet = async () => {
      const loc = driverLocationRef.current;
      if (!loc?.lat) return;
      try {
        if (!googleKeyRef.current) googleKeyRef.current = await loadGoogleMapsKey();
        const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${loc.lat},${loc.lng}&key=${googleKeyRef.current}&result_type=route`);
        const data = await res.json();
        const street = data.results?.[0]?.address_components?.find(c => c.types.includes('route'))?.long_name;
        if (street) setCurrentStreet(street);
      } catch (e) {}
    };
    fetchStreet();
    if (!streetIntervalRef.current) {
      streetIntervalRef.current = setInterval(fetchStreet, 15000);
    }
    return () => { clearInterval(streetIntervalRef.current); streetIntervalRef.current = null; };
  }, [!!driverLocation]);

  // Track user location
  useEffect(() => {
    if (!navigator.geolocation) return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newPos = [longitude, latitude];
        if (lastUserPosRef.current) {
          const heading = calculateHeading(lastUserPosRef.current[1], lastUserPosRef.current[0], latitude, longitude);
          setUserHeading(heading);
        }
        setUserLocation(newPos);
        lastUserPosRef.current = newPos;
        if (followMode && mapRef.current) {
          mapRef.current.easeTo({
            center: newPos, zoom: Math.max(viewState.zoom, 16),
            pitch: 0, bearing: 0,
            duration: MAPBOX_CONFIG.ANIMATION_DURATION
          });
        }
      },
      (error) => { if (error.code === 1) toast.error('📍 Permissão de localização negada'); },
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
    );

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const pos = [position.coords.longitude, position.coords.latitude];
        setUserLocation(pos);
        lastUserPosRef.current = pos;
      },
      () => {}
    );

    return () => {
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, [followMode, userHeading, viewState.zoom]);

  // Animar motoristas
  useEffect(() => {
    nearbyDrivers.forEach(driver => {
      const driverId = driver.id || `${driver.lat}-${driver.lng}`;
      const prevDriver = driversWithHeading.find(d => d.id === driverId);
      if (prevDriver && (prevDriver.lat !== driver.lat || prevDriver.lng !== driver.lng)) {
        const heading = calculateHeading(prevDriver.lat, prevDriver.lng, driver.lat, driver.lng);
        if (driverAnimationsRef.current[driverId]) clearTimeout(driverAnimationsRef.current[driverId]);
        driverAnimationsRef.current[driverId] = setTimeout(() => {
          setDriversWithHeading(prev =>
            prev.map(d => d.id === driverId ? { ...driver, id: driverId, heading, lat: driver.lat, lng: driver.lng } : d)
          );
        }, 100);
      } else if (!prevDriver) {
        setDriversWithHeading(prev => [...prev, { ...driver, id: driverId, heading: 0 }]);
      }
    });
  }, [nearbyDrivers]);

  // Animação contínua do dasharray (fluxo na linha)
  useEffect(() => {
    if (!routeData) {
      if (dashAnimRef.current) cancelAnimationFrame(dashAnimRef.current);
      return;
    }
    const animate = () => {
      setRouteAnimOffset(prev => (prev + 0.5) % 30);
      dashAnimRef.current = requestAnimationFrame(animate);
    };
    dashAnimRef.current = requestAnimationFrame(animate);
    return () => { if (dashAnimRef.current) cancelAnimationFrame(dashAnimRef.current); };
  }, [routeData]);

  // Calcular rota via Google Directions API
  useEffect(() => {
    if (showRoute && pickupLocation && destinationLocation) {
      const getRoute = async () => {
        try {
          const oLat = pickupLocation.lat, oLng = pickupLocation.lng;
          const dLat = destinationLocation.lat, dLng = destinationLocation.lng;

          if (!googleKeyRef.current) googleKeyRef.current = await loadGoogleMapsKey();
          const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${oLat},${oLng}&destination=${dLat},${dLng}&mode=driving&region=BR&language=pt-BR&key=${googleKeyRef.current}`;
          const response = await fetch(url);
          const data = await response.json();

          if (data.status !== 'OK' || !data.routes?.length) {
            console.warn('[MapView] Google Directions falhou:', data.status, '— tentando OSRM fallback');
            // Fallback: OSRM
            const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${oLng},${oLat};${dLng},${dLat}?geometries=geojson&overview=full`;
            const osrmRes = await fetch(osrmUrl);
            const osrmData = await osrmRes.json();
            if (osrmData.routes?.[0]?.geometry?.coordinates) {
              const coords = osrmData.routes[0].geometry.coordinates;
              setRouteData({ type: 'Feature', geometry: { type: 'LineString', coordinates: coords } });
              setRouteProgress(null);
              animateRoute(coords);
              if (mapRef.current && coords.length > 1) {
                const bounds = coords.reduce((b, c) => b.extend(c), new mapboxgl.LngLatBounds(coords[0], coords[0]));
                mapRef.current.fitBounds(bounds, { padding: 80, duration: 1200, pitch: 0 });
              }
            }
            return;
          }

          const coords = decodePolyline(data.routes[0].overview_polyline.points);
          console.log(`[MapView] Google Directions: ${coords.length} pontos`);

          const route = { type: 'Feature', geometry: { type: 'LineString', coordinates: coords } };
          setRouteData(route);
          setRouteProgress(null);
          animateRoute(coords);

          if (mapRef.current && coords.length > 1) {
            const bounds = coords.reduce((b, c) => b.extend(c), new mapboxgl.LngLatBounds(coords[0], coords[0]));
            mapRef.current.fitBounds(bounds, { padding: 80, duration: 1200, pitch: 0 });
          }
        } catch (error) {
          console.error('[MapView] Erro ao calcular rota:', error);
        }
      };
      getRoute();
    } else {
      setRouteData(null);
      setRouteProgress(null);
      if (routeAnimationRef.current) cancelAnimationFrame(routeAnimationRef.current);
    }
  }, [showRoute, pickupLocation, destinationLocation]);

  // Animação de entrada da rota (desenha progressivamente)
  const animateRoute = useCallback((coordinates) => {
    if (routeAnimationRef.current) cancelAnimationFrame(routeAnimationRef.current);
    const totalPoints = coordinates.length;
    const startTime = Date.now();
    const animationDuration = 1800;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / animationDuration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentIndex = Math.max(2, Math.floor(eased * totalPoints));
      setRouteProgress({
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: coordinates.slice(0, currentIndex) }
      });
      if (progress < 1) routeAnimationRef.current = requestAnimationFrame(animate);
    };
    animate();
  }, []);

  // Imperative route drawing — mais confiável que Source/Layer declarativo
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const LAYERS = ['route-main', 'route-outline', 'route-glow'];
    const SOURCE = 'route-imp';

    const clearRoute = () => {
      LAYERS.forEach(id => { try { if (map.getLayer(id)) map.removeLayer(id); } catch(e) {} });
      try { if (map.getSource(SOURCE)) map.removeSource(SOURCE); } catch(e) {}
    };

    const drawRoute = () => {
      if (!routeProgress?.geometry?.coordinates?.length) { clearRoute(); return; }
      try {
        if (map.getSource(SOURCE)) {
          map.getSource(SOURCE).setData(routeProgress);
        } else {
          clearRoute();
          map.addSource(SOURCE, { type: 'geojson', data: routeProgress });
          map.addLayer({ id: 'route-glow', type: 'line', source: SOURCE, layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#F22998', 'line-width': 14, 'line-opacity': 0.18, 'line-blur': 8 } });
          map.addLayer({ id: 'route-outline', type: 'line', source: SOURCE, layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#0a5fd8', 'line-width': 8, 'line-opacity': 0.4 } });
          map.addLayer({ id: 'route-main', type: 'line', source: SOURCE, layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#1A73E8', 'line-width': 5, 'line-opacity': 1 } });
        }
      } catch(e) { console.warn('[MapView] Route draw:', e.message); }
    };

    if (map.isStyleLoaded()) { drawRoute(); }
    else { map.once('styledata', drawRoute); return () => map.off('styledata', drawRoute); }
  }, [routeProgress]);

  const handleMoveStart = useCallback(() => {
    if (followMode) {
      setFollowMode(false);
      if (followTimeoutRef.current) clearTimeout(followTimeoutRef.current);
      followTimeoutRef.current = setTimeout(() => {
        setFollowMode(true);
      }, MAPBOX_CONFIG.FOLLOW_MODE_TIMEOUT);
    }
  }, [followMode]);

  const handleToggleFollow = () => {
    const newFollowMode = !followMode;
    setFollowMode(newFollowMode);
    if (followTimeoutRef.current) clearTimeout(followTimeoutRef.current);
    if (newFollowMode && userLocation && mapRef.current) {
      mapRef.current.easeTo({
        center: userLocation, zoom: 16,
        pitch: 0, bearing: 0,
        duration: MAPBOX_CONFIG.ANIMATION_DURATION
      });
    }
  };



  const handleMapClick = useCallback(async (event) => {
    if (onMapClick) onMapClick(event.lngLat.lat, event.lngLat.lng);
    if (onDestinationSelected) {
      try {
        const result = await reverseGeocode(event.lngLat.lat, event.lngLat.lng);
        if (result) {
          const address = `${result.street || ''}${result.housenumber ? ', ' + result.housenumber : ''}${result.city ? ' - ' + result.city : ''}`;
          onDestinationSelected({
            lat: event.lngLat.lat, lng: event.lngLat.lng,
            address: address.trim() || 'Local selecionado'
          });
        }
      } catch (error) {
        console.error('Erro no reverse geocoding:', error);
      }
    }
  }, [onMapClick, onDestinationSelected]);

  const onMarkerDragEnd = useCallback((event, type) => {
    const { lngLat } = event;
    if (type === 'pickup' && onPickupDragEnd) onPickupDragEnd(lngLat.lat, lngLat.lng);
    else if (type === 'destination' && onDestinationDragEnd) onDestinationDragEnd(lngLat.lat, lngLat.lng);
  }, [onPickupDragEnd, onDestinationDragEnd]);

  if (!tokenLoaded) {
    return (
      <div className={`relative rounded-2xl overflow-hidden h-[360px] w-full flex items-center justify-center bg-[#1a1a1a] ${className}`}>
        <div className="flex flex-col items-center gap-3 text-[#F22998]">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="text-sm opacity-70">Carregando mapa...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative rounded-2xl overflow-hidden h-[360px] w-full ${className}`}>
      <style>{`
        .mapboxgl-ctrl-logo { display: none !important; }
        .mapboxgl-ctrl-attrib { display: none !important; }
        .follow-btn {
          position: absolute; bottom: 20px; right: 20px; z-index: 10;
          width: 48px; height: 48px; border-radius: 50%;
          background: rgba(13,13,13,0.9); border: 2px solid rgba(242,41,152,0.5);
          backdrop-filter: blur(10px);
          box-shadow: 0 4px 20px rgba(0,0,0,0.3);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.2s;
        }
        .follow-btn:hover { transform: scale(1.1); border-color: #F22998; }
        .follow-btn.active {
          background: linear-gradient(135deg, #BF3B79 0%, #F22998 100%);
          border-color: #F22998;
          box-shadow: 0 4px 20px rgba(242,41,152,0.4);
        }
      `}</style>

      {driverLocation?.lat && (
        <button
          onClick={() => mapRef.current?.flyTo({ center: [driverLocation.lng, driverLocation.lat], zoom: 17, speed: 1.5 })}
          style={{ position: 'absolute', bottom: 76, right: 20, zIndex: 10, width: 48, height: 48, borderRadius: '50%', background: 'rgba(13,13,13,0.9)', border: '2px solid rgba(242,41,152,0.5)', backdropFilter: 'blur(10px)', boxShadow: '0 4px 20px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
          title="Centralizar na minha posição"
        >
          <Navigation className="w-5 h-5" style={{ color: 'white' }} />
        </button>
      )}

      <button
        onClick={handleToggleFollow}
        className={`follow-btn ${followMode ? 'active' : ''}`}
        title={followMode ? 'Modo seguir ativo' : 'Ativar modo seguir'}
      >
        <Target className="w-5 h-5" style={{ color: 'white' }} />
      </button>

      {currentStreet ? (
        <div style={{ position: 'absolute', bottom: 80, left: 12, zIndex: 10, background: 'rgba(0,0,0,0.6)', color: 'white', fontSize: 11, padding: '4px 10px', borderRadius: 999, backdropFilter: 'blur(6px)', maxWidth: '60%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          📍 {currentStreet}
        </div>
      ) : null}

      <Map
        ref={mapRef}
        {...viewState}
        onMove={evt => setViewState({...evt.viewState, pitch: 0})}
        onDragStart={handleMoveStart}
        onClick={handleMapClick}
        mapStyle={MAPBOX_CONFIG.MAP_STYLE}
        mapboxAccessToken={MAPBOX_CONFIG.ACCESS_TOKEN}
        style={{ width: '100%', height: '100%' }}
        attributionControl={false}
        antialias={true}
      >
        <NavigationControl position="top-left" showCompass={true} />

        {/* User location */}
        {userLocation && (
          <Marker longitude={userLocation[0]} latitude={userLocation[1]} anchor="center">
            <UserMarker heading={userHeading} />
          </Marker>
        )}

        {/* Pickup */}
        {pickupLocation && (
          <Marker
            key={`pickup-${pickupLocation.lat}-${pickupLocation.lng}`}
            longitude={pickupLocation.lng}
            latitude={pickupLocation.lat}
            anchor="bottom"
            draggable={pickupDraggable}
            onDragEnd={(e) => onMarkerDragEnd(e, 'pickup')}
          >
            <PickupMarker />
          </Marker>
        )}

        {/* Destination */}
        {destinationLocation && (
          <Marker
            key={`dest-${destinationLocation.lat}-${destinationLocation.lng}`}
            longitude={destinationLocation.lng}
            latitude={destinationLocation.lat}
            anchor="bottom"
            draggable={destinationDraggable}
            onDragEnd={(e) => onMarkerDragEnd(e, 'destination')}
          >
            <DestinationMarker />
          </Marker>
        )}

        {/* Motoristas passados como prop */}
        {driversWithHeading.map((driver) => (
          <Marker key={driver.id} longitude={driver.lng} latitude={driver.lat} anchor="center">
            <CarMarker3D tags={driver.tags || []} heading={driver.heading || 0} />
          </Marker>
        ))}

        {/* Motoristas em tempo real do banco */}
        {realTimeDrivers.map((driver) => (
          <Marker key={`rt-${driver.id}`} longitude={driver.lng} latitude={driver.lat} anchor="center">
            <CarMarker3D tags={driver.tags || []} heading={driver.heading || 0} />
          </Marker>
        ))}

        {/* Marcador do passageiro (visível para o motorista) */}
        {passengerMarker && (
          <Marker longitude={passengerMarker.lng} latitude={passengerMarker.lat} anchor="bottom">
            <div>
              <div style={{
                background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
                borderRadius: '50% 50% 50% 0',
                padding: 10,
                border: '2.5px solid white',
                transform: 'rotate(-45deg)',
                width: 42, height: 42,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 14px rgba(251,191,36,0.7)'
              }}>
                <MapPin className="w-5 h-5 text-white" style={{ transform: 'rotate(45deg)' }} />
              </div>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fbbf24', margin: '2px auto 0', opacity: 0.7 }} />
            </div>
          </Marker>
        )}
      </Map>
    </div>
  );
}