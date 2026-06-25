import React, { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Car, MapPin, RefreshCw, Radio } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { MAPBOX_CONFIG, loadMapboxToken } from '@/components/utils/mapboxConfig';

const ORLANDIA = [-47.8867, -20.7197]; // [lng, lat]

function driverMarkerEl(busy) {
  const el = document.createElement('div');
  el.style.cssText = `
    width: 36px; height: 36px; border-radius: 50%;
    background: ${busy ? 'linear-gradient(135deg,#10b981,#059669)' : 'linear-gradient(135deg,#BF3B79,#F22998)'};
    border: 3px solid #fff; display:flex; align-items:center; justify-content:center;
    box-shadow: 0 2px 12px ${busy ? 'rgba(16,185,129,0.6)' : 'rgba(242,41,152,0.5)'};
    ${busy ? 'animation: glow-pulse 1.8s infinite;' : ''}
  `;
  el.innerHTML = `<svg width="17" height="17" fill="white" viewBox="0 0 24 24"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>`;
  return el;
}

export default function LiveMap() {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const [drivers, setDrivers] = useState([]);
  const [rides, setRides] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      // A localização real das motoristas vive em DriverPresence, não em User.
      const presences = await base44.entities.DriverPresence.list('-last_seen_at', 200);
      // Considerar online quem está marcado como online E tem coordenadas válidas
      const onlinePresences = presences.filter(p => {
        const lat = p.lat ?? p.current_lat;
        const lng = p.lng ?? p.current_lng;
        return (p.is_online || p.is_available) && lat != null && lng != null;
      });

      // Cruzar com os dados do usuário (nome, veículo, telefone)
      const driverIds = [...new Set(onlinePresences.map(p => p.driver_id).filter(Boolean))];
      const userById = {};
      await Promise.all(driverIds.map(async (id) => {
        try {
          const us = await base44.entities.User.filter({ id });
          if (us[0]) userById[id] = us[0];
        } catch (_) {}
      }));

      const online = onlinePresences.map(p => {
        const u = userById[p.driver_id] || {};
        return {
          id: p.driver_id,
          current_lat: p.lat ?? p.current_lat,
          current_lng: p.lng ?? p.current_lng,
          full_name: u.full_name,
          phone: u.phone,
          vehicle_model: u.vehicle_model,
          vehicle_plate: u.vehicle_plate,
        };
      });
      setDrivers(online);

      const allRides = await base44.entities.Ride.list('-created_date', 100);
      const active = allRides.filter(r =>
        ['requested', 'assigned', 'accepted', 'arrived', 'in_progress', 'picked_up', 'in_transit'].includes(r.status)
      );
      setRides(active);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error loading live map:', error);
    } finally {
      setLoading(false);
    }
  };

  // Init Mapbox map
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = MAPBOX_CONFIG.ACCESS_TOKEN || await loadMapboxToken(base44);
        if (cancelled || !mapContainer.current || mapRef.current) return;
        mapboxgl.accessToken = token;
        mapRef.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/dark-v11',
          center: ORLANDIA,
          zoom: 13,
        });
        mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
      } catch (e) {
        console.error('Erro ao inicializar Mapbox:', e);
      }
    })();
    return () => {
      cancelled = true;
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
  }, []);

  // Poll data
  useEffect(() => {
    load();
    const interval = setInterval(load, 8000);
    return () => clearInterval(interval);
  }, []);

  const busyDriverIds = new Set(rides.map(r => r.assigned_driver_id).filter(Boolean));

  // Render markers
  useEffect(() => {
    if (!mapRef.current) return;
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    drivers.forEach((driver) => {
      const busy = busyDriverIds.has(driver.id);
      const popup = new mapboxgl.Popup({ offset: 24 }).setHTML(`
        <div style="min-width:150px;font-family:sans-serif">
          <strong>${driver.full_name || 'Motorista'}</strong>
          <div style="font-size:12px;color:#666;margin-top:2px">${busy ? '🟢 Em corrida' : '🩷 Disponível'}</div>
          ${driver.vehicle_model ? `<div style="font-size:12px;color:#666">🚗 ${driver.vehicle_model}${driver.vehicle_plate ? ' - ' + driver.vehicle_plate : ''}</div>` : ''}
          ${driver.phone ? `<div style="font-size:12px;color:#666">📞 ${driver.phone}</div>` : ''}
        </div>
      `);
      const marker = new mapboxgl.Marker(driverMarkerEl(busy))
        .setLngLat([driver.current_lng, driver.current_lat])
        .setPopup(popup)
        .addTo(mapRef.current);
      markersRef.current.push(marker);
    });
  }, [drivers, rides]);

  const idleCount = drivers.filter(d => !busyDriverIds.has(d.id)).length;
  const busyCount = drivers.length - idleCount;

  const summary = [
    { icon: Radio, label: 'Motoristas Online', value: drivers.length, color: 'text-green-500', bg: 'bg-green-500/20' },
    { icon: Car, label: 'Disponíveis', value: idleCount, color: 'text-[#F22998]', bg: 'bg-[#F22998]/20' },
    { icon: MapPin, label: 'Em Corrida', value: busyCount, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {summary.map((s, i) => (
          <Card key={i} className="bg-[#F2F2F2]/5 border-[#F22998]/10 p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-[#F2F2F2]/60 text-xs">{s.label}</p>
                <p className="text-2xl font-bold text-[#F2F2F2]">{s.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[#F2F2F2]/60 text-sm">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          Atualizado às {lastUpdate.toLocaleTimeString('pt-BR')}
        </div>
        <Button
          onClick={load}
          size="sm"
          variant="outline"
          className="border-[#F22998]/30 text-[#F22998] hover:bg-[#F22998]/10"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      <Card className="overflow-hidden rounded-2xl border-[#F22998]/10">
        <div ref={mapContainer} style={{ height: '360px', width: '100%' }} />
      </Card>

      {!loading && drivers.length === 0 && (
        <Card className="bg-[#F2F2F2]/5 border-[#F22998]/10 p-6 text-center">
          <Radio className="w-10 h-10 text-[#F22998]/40 mx-auto mb-2" />
          <p className="text-[#F2F2F2]/60">Nenhuma motorista online no momento.</p>
        </Card>
      )}
    </div>
  );
}