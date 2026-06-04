import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Car, MapPin, Clock, User, RefreshCw, Radio } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import L from 'leaflet';

const ORLANDIA = [-20.7197, -47.8867];

function makeIcon(gradient, glow, pulse = false) {
  return new L.DivIcon({
    html: `<div style="background: ${gradient}; width: 38px; height: 38px; border-radius: 50%; display:flex; align-items:center; justify-content:center; border: 3px solid white; box-shadow: 0 2px 12px ${glow};${pulse ? ' animation: glow-pulse 1.8s infinite;' : ''}">
      <svg width="18" height="18" fill="white" viewBox="0 0 24 24"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/></svg>
    </div>`,
    className: 'custom-driver-icon',
    iconSize: [38, 38],
    iconAnchor: [19, 19],
  });
}

const idleIcon = makeIcon('linear-gradient(135deg, #BF3B79, #F22998)', 'rgba(242,41,152,0.5)');
const busyIcon = makeIcon('linear-gradient(135deg, #10b981, #059669)', 'rgba(16,185,129,0.6)', true);

export default function LiveMap() {
  const [drivers, setDrivers] = useState([]);
  const [rides, setRides] = useState([]);
  const [center, setCenter] = useState(ORLANDIA);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const didCenter = useRef(false);

  const load = async () => {
    try {
      const allDrivers = await base44.entities.User.filter({ user_type: 'driver' });
      const online = allDrivers.filter(d => d.is_online && d.current_lat && d.current_lng);
      setDrivers(online);

      const allRides = await base44.entities.Ride.list('-created_date', 100);
      const active = allRides.filter(r =>
        ['requested', 'assigned', 'accepted', 'arrived', 'in_progress', 'picked_up', 'in_transit'].includes(r.status)
      );
      setRides(active);

      if (!didCenter.current && online.length > 0) {
        setCenter([online[0].current_lat, online[0].current_lng]);
        didCenter.current = true;
      }
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error loading live map:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 8000);
    return () => clearInterval(interval);
  }, []);

  const busyDriverIds = new Set(rides.map(r => r.assigned_driver_id).filter(Boolean));
  const idleCount = drivers.filter(d => !busyDriverIds.has(d.id)).length;
  const busyCount = drivers.length - idleCount;

  const summary = [
    { icon: Radio, label: 'Motoristas Online', value: drivers.length, color: 'text-green-500', bg: 'bg-green-500/20' },
    { icon: Car, label: 'Disponíveis', value: idleCount, color: 'text-[#F22998]', bg: 'bg-[#F22998]/20' },
    { icon: MapPin, label: 'Em Corrida', value: busyCount, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
    { icon: Clock, label: 'Corridas Ativas', value: rides.length, color: 'text-blue-400', bg: 'bg-blue-500/20' },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
        <MapContainer center={center} zoom={13} style={{ height: '560px', width: '100%' }}>
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; OpenStreetMap &copy; CARTO'
          />

          {drivers.map((driver) => {
            const busy = busyDriverIds.has(driver.id);
            return (
              <React.Fragment key={driver.id}>
                <Marker
                  position={[driver.current_lat, driver.current_lng]}
                  icon={busy ? busyIcon : idleIcon}
                >
                  <Popup>
                    <div className="p-1 min-w-[160px]">
                      <div className="flex items-center gap-2 mb-2">
                        {driver.photo_url ? (
                          <img src={driver.photo_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-[#F22998] flex items-center justify-center">
                            <User className="w-5 h-5 text-white" />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-sm">{driver.full_name}</p>
                          <Badge className={busy ? 'bg-emerald-500' : 'bg-[#F22998]'}>
                            {busy ? 'Em corrida' : 'Disponível'}
                          </Badge>
                        </div>
                      </div>
                      {driver.vehicle_model && (
                        <p className="text-xs text-gray-600">🚗 {driver.vehicle_model} {driver.vehicle_plate ? `- ${driver.vehicle_plate}` : ''}</p>
                      )}
                      {driver.phone && <p className="text-xs text-gray-600">📞 {driver.phone}</p>}
                    </div>
                  </Popup>
                </Marker>
                <Circle
                  center={[driver.current_lat, driver.current_lng]}
                  radius={1500}
                  pathOptions={{
                    color: busy ? '#10b981' : '#F22998',
                    fillColor: busy ? '#10b981' : '#F22998',
                    fillOpacity: 0.08,
                    weight: 1,
                  }}
                />
              </React.Fragment>
            );
          })}
        </MapContainer>
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