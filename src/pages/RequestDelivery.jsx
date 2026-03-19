import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  MapPin, Clock, CreditCard, Package, ChevronRight,
  ChevronLeft, Check, Loader2, Crosshair, AlertTriangle, User, Phone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import MapView from '../components/map/MapView';
import AddressSearchField from '../components/map/AddressSearchField';
import { toast } from 'sonner';
import {
  reverseGeocode,
  formatAddressDisplay,
  loadFavoritesAndRecents
} from '@/components/utils/geocoding';
import { loadMapboxToken } from '@/components/utils/mapboxConfig';

const PACKAGE_SIZES = [
  {
    id: 'small',
    label: 'Pequeno',
    emoji: '📦',
    description: 'Documentos, remédios, acessórios',
    weight: 'Até 5kg',
    basePrice: 8.99,
    pricePerKm: 3.00,
  },
  {
    id: 'medium',
    label: 'Médio',
    emoji: '📦',
    description: 'Roupas, calçados, eletrônicos',
    weight: 'Até 15kg',
    basePrice: 12.99,
    pricePerKm: 3.50,
  },
  {
    id: 'large',
    label: 'Grande',
    emoji: '📦',
    description: 'Eletrodomésticos, móveis peq., caixas grandes',
    weight: 'Até 30kg',
    basePrice: 18.99,
    pricePerKm: 4.00,
  },
];

const PAYMENT_METHODS = [
  { id: 'pix', name: 'PIX', icon: '💜' },
  { id: 'credit_card', name: 'Cartão de Crédito', icon: '💳' },
  { id: 'wallet', name: 'Carteira Digital', icon: '👛' },
];

export default function RequestDelivery() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [step, setStep] = useState(1); // 1-4
  const [favoritesAndRecents, setFavoritesAndRecents] = useState([]);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [activeField, setActiveField] = useState(null);
  const [mapTopView, setMapTopView] = useState(false);

  // Etapa 1: Endereços
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');
  const [pickupLocation, setPickupLocation] = useState(null);
  const [destinationLocation, setDestinationLocation] = useState(null);
  const [routeDistance, setRouteDistance] = useState(null);
  const [routeDuration, setRouteDuration] = useState(null);

  // Etapa 2: Tamanho
  const [selectedSize, setSelectedSize] = useState(null);

  // Etapa 3: Detalhes
  const [details, setDetails] = useState({
    contents: '',
    recipientName: '',
    recipientPhone: '',
    instructions: '',
    fragile: false,
  });

  // Etapa 4: Pagamento
  const [selectedPayment, setSelectedPayment] = useState('pix');
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        await loadMapboxToken(base44);
        const userData = await base44.auth.me();
        setUser(userData);
        const favRec = await loadFavoritesAndRecents(userData.id, base44);
        setFavoritesAndRecents(favRec);
      } catch (e) {
        if (e.message?.includes('401') || e.message?.includes('Unauthorized')) {
          base44.auth.redirectToLogin();
        }
      }
    };
    init();
    getCurrentLocation();
  }, []);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) return;
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const reverseData = await reverseGeocode(latitude, longitude);
          if (reverseData) {
            const addr = formatAddressDisplay(reverseData);
            setPickup(addr);
            setPickupLocation({ lat: latitude, lng: longitude, text: addr });
          }
        } catch (_) {}
        setGettingLocation(false);
      },
      () => setGettingLocation(false)
    );
  };

  const calculateRoute = async (origin, dest) => {
    try {
      const res = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${dest.lng},${dest.lat}?overview=false`
      );
      const data = await res.json();
      if (data.routes?.[0]) {
        setRouteDistance((data.routes[0].distance / 1000).toFixed(1));
        setRouteDuration(Math.ceil(data.routes[0].duration / 60));
      }
    } catch (_) {}
  };

  const handlePickupSelect = async (suggestion) => {
    const lat = parseFloat(suggestion.lat);
    const lng = parseFloat(suggestion.lon || suggestion.lng);
    try {
      const rev = await reverseGeocode(lat, lng);
      const addr = rev ? formatAddressDisplay(rev) : suggestion.name || '';
      setPickup(addr);
      setPickupLocation({ lat, lng, text: addr });
      if (destinationLocation) calculateRoute({ lat, lng }, destinationLocation);
    } catch (_) {
      setPickup(suggestion.name || '');
      setPickupLocation({ lat, lng, text: suggestion.name || '' });
    }
    setActiveField(null);
  };

  const handleDestinationSelect = async (suggestion) => {
    const lat = parseFloat(suggestion.lat);
    const lng = parseFloat(suggestion.lon || suggestion.lng);
    try {
      const rev = await reverseGeocode(lat, lng);
      const addr = rev ? formatAddressDisplay(rev) : suggestion.name || '';
      setDestination(addr);
      setDestinationLocation({ lat, lng, text: addr });
      if (pickupLocation) calculateRoute(pickupLocation, { lat, lng });
    } catch (_) {
      setDestination(suggestion.name || '');
      setDestinationLocation({ lat, lng, text: suggestion.name || '' });
    }
    setActiveField(null);
  };

  const getEstimatedPrice = () => {
    if (!selectedSize || !routeDistance) return null;
    const size = PACKAGE_SIZES.find(s => s.id === selectedSize);
    if (!size) return null;
    return (size.basePrice + parseFloat(routeDistance) * size.pricePerKm).toFixed(2);
  };

  const handleConfirm = async () => {
    setConfirming(true);
    await new Promise(r => setTimeout(r, 1500));
    toast.success('📦 Entrega solicitada com sucesso!');
    setConfirming(false);
    navigate('/RequestRide');
  };

  const canProceedStep1 = pickupLocation?.lat && destinationLocation?.lat;
  const canProceedStep2 = !!selectedSize;
  const canProceedStep3 = details.recipientName.trim() && details.recipientPhone.trim();

  const STEPS = ['Endereços', 'Tamanho', 'Detalhes', 'Pagamento'];

  const selectedSizeObj = PACKAGE_SIZES.find(s => s.id === selectedSize);
  const estimatedPrice = getEstimatedPrice();

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-[#F2F2F2] pb-24 md:pb-10">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[#0D0D0D]/95 backdrop-blur-xl border-b border-[#F22998]/20 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => step === 1 ? navigate('/RequestRide') : setStep(s => s - 1)}
          className="p-2 rounded-xl hover:bg-[#F22998]/10 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-[#F22998]" />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xl">📦</span>
          <h1 className="text-lg font-bold text-[#F2F2F2]">Della Entrega</h1>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between gap-1">
          {STEPS.map((label, i) => {
            const num = i + 1;
            const isActive = step === num;
            const isDone = step > num;
            return (
              <React.Fragment key={label}>
                <div className="flex flex-col items-center gap-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    isDone ? 'bg-[#F22998] text-white' :
                    isActive ? 'bg-[#F22998]/20 border-2 border-[#F22998] text-[#F22998]' :
                    'bg-[#F2F2F2]/10 text-[#F2F2F2]/40'
                  }`}>
                    {isDone ? <Check className="w-4 h-4" /> : num}
                  </div>
                  <span className={`text-[10px] font-medium ${isActive ? 'text-[#F22998]' : isDone ? 'text-[#F2F2F2]/60' : 'text-[#F2F2F2]/30'}`}>
                    {label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mb-4 transition-all ${step > num ? 'bg-[#F22998]' : 'bg-[#F2F2F2]/10'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Mapa */}
          <div className="h-[260px] lg:h-[560px] rounded-3xl overflow-hidden relative">
            <MapView
              pickupLocation={pickupLocation}
              destinationLocation={destinationLocation}
              showRoute={!!pickupLocation && !!destinationLocation}
              className="h-full"
              forcePitch={mapTopView ? 0 : undefined}
            />
            <button
              onClick={() => setMapTopView(v => !v)}
              className={`absolute top-3 right-3 z-10 px-3 py-1.5 rounded-xl text-xs font-semibold backdrop-blur-md border transition-all ${
                mapTopView ? 'bg-[#F22998] border-[#F22998] text-white' : 'bg-[#0D0D0D]/80 border-[#F22998]/40 text-[#F22998]'
              }`}
            >
              {mapTopView ? '🗺️ Vista 3D' : '🛰️ Vista Aérea'}
            </button>

            {/* Card resumo no mapa */}
            {routeDistance && routeDuration && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-3 left-1/2 -translate-x-1/2 z-10"
                style={{ whiteSpace: 'nowrap' }}
              >
                <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl flex items-center gap-4 px-4 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-[#F22998]" />
                    <div>
                      <p className="text-[10px] text-gray-500">Distância</p>
                      <p className="font-bold text-gray-900 text-sm">{routeDistance} km</p>
                    </div>
                  </div>
                  <div className="w-px h-6 bg-gray-200" />
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-[#F22998]" />
                    <div>
                      <p className="text-[10px] text-gray-500">Tempo</p>
                      <p className="font-bold text-gray-900 text-sm">{routeDuration} min</p>
                    </div>
                  </div>
                  {estimatedPrice && (
                    <>
                      <div className="w-px h-6 bg-gray-200" />
                      <div className="flex items-center gap-1.5">
                        <CreditCard className="w-4 h-4 text-[#F22998]" />
                        <div>
                          <p className="text-[10px] text-gray-500">Estimado</p>
                          <p className="font-bold text-[#F22998] text-sm">R$ {estimatedPrice}</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </div>

          {/* Conteúdo das etapas */}
          <div>
            <AnimatePresence mode="wait">

              {/* ETAPA 1: Endereços */}
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <Card className="p-6 bg-[#F2F2F2]/5 border-[#F22998]/10 rounded-3xl overflow-visible">
                    <h2 className="text-lg font-bold text-[#F2F2F2] mb-4">Endereços de Coleta e Entrega</h2>
                    <div className="space-y-1" style={{ overflow: 'visible' }}>
                      <AddressSearchField
                        label="Coletar em"
                        value={pickup}
                        onChange={(v) => setPickup(v)}
                        onSelect={handlePickupSelect}
                        placeholder="Endereço de origem do pacote"
                        dotColor="#22c55e"
                        userLocation={pickupLocation}
                        favoritesAndRecents={favoritesAndRecents}
                        isActive={activeField === 'pickup'}
                        onFocus={() => setActiveField('pickup')}
                        icon={
                          <button onClick={getCurrentLocation} className="p-1 rounded-full hover:bg-[#F22998]/10 transition-colors">
                            {gettingLocation ? <Loader2 className="w-4 h-4 text-[#F22998] animate-spin" /> : <Crosshair className="w-4 h-4 text-[#F22998]" />}
                          </button>
                        }
                      />
                      <div className="py-1 pl-3">
                        <div className="w-px h-4 bg-[#F22998]/30 ml-[5px]" />
                      </div>
                      <AddressSearchField
                        label="Entregar em"
                        value={destination}
                        onChange={(v) => setDestination(v)}
                        onSelect={handleDestinationSelect}
                        placeholder="Endereço do destinatário"
                        dotColor="#F22998"
                        userLocation={pickupLocation}
                        favoritesAndRecents={favoritesAndRecents}
                        isActive={activeField === 'destination'}
                        onFocus={() => setActiveField('destination')}
                      />
                    </div>
                    <Button
                      onClick={() => setStep(2)}
                      disabled={!canProceedStep1}
                      className="w-full mt-6 btn-gradient py-5 rounded-2xl text-base font-semibold disabled:opacity-40"
                    >
                      Próximo — Tamanho do Pacote
                      <ChevronRight className="w-5 h-5 ml-2" />
                    </Button>
                  </Card>
                </motion.div>
              )}

              {/* ETAPA 2: Tamanho */}
              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <Card className="p-6 bg-[#F2F2F2]/5 border-[#F22998]/10 rounded-3xl">
                    <h2 className="text-lg font-bold text-[#F2F2F2] mb-4">Qual o tamanho do pacote?</h2>
                    <div className="grid grid-cols-3 gap-3">
                      {PACKAGE_SIZES.map((size) => (
                        <motion.button
                          key={size.id}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => setSelectedSize(size.id)}
                          className={`p-4 rounded-2xl border-2 text-center transition-all flex flex-col gap-2 ${
                            selectedSize === size.id
                              ? 'border-[#F22998] bg-[#F22998]/10'
                              : 'border-[#F2F2F2]/10 bg-[#0D0D0D] hover:border-[#F22998]/40'
                          }`}
                        >
                          <span className="text-3xl">{size.emoji}</span>
                          <p className="font-bold text-[#F2F2F2] text-sm">{size.label.toUpperCase()}</p>
                          <p className="text-[10px] text-[#F2F2F2]/50 leading-tight">{size.description}</p>
                          <p className="text-xs text-[#F22998] font-semibold">{size.weight}</p>
                          <div className="mt-1 pt-2 border-t border-[#F2F2F2]/10">
                            <p className="text-xs font-bold text-[#F2F2F2]">R$ {size.basePrice.toFixed(2)}</p>
                            <p className="text-[10px] text-[#F2F2F2]/40">+ R$ {size.pricePerKm.toFixed(2)}/km</p>
                          </div>
                        </motion.button>
                      ))}
                    </div>

                    {selectedSize && routeDistance && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 p-4 rounded-2xl bg-[#F22998]/10 border border-[#F22998]/20">
                        <p className="text-sm text-[#F2F2F2]/70">Estimativa para {selectedSizeObj?.label}:</p>
                        <p className="text-2xl font-bold text-[#F22998] mt-1">R$ {estimatedPrice}</p>
                        <p className="text-xs text-[#F2F2F2]/40 mt-0.5">
                          R$ {selectedSizeObj?.basePrice.toFixed(2)} + ({routeDistance} km × R$ {selectedSizeObj?.pricePerKm.toFixed(2)})
                        </p>
                      </motion.div>
                    )}

                    <Button
                      onClick={() => setStep(3)}
                      disabled={!canProceedStep2}
                      className="w-full mt-4 btn-gradient py-5 rounded-2xl text-base font-semibold disabled:opacity-40"
                    >
                      Próximo — Detalhes do Pacote
                      <ChevronRight className="w-5 h-5 ml-2" />
                    </Button>
                  </Card>
                </motion.div>
              )}

              {/* ETAPA 3: Detalhes */}
              {step === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <Card className="p-6 bg-[#F2F2F2]/5 border-[#F22998]/10 rounded-3xl">
                    <h2 className="text-lg font-bold text-[#F2F2F2] mb-4">Detalhes do Pacote</h2>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm text-[#F2F2F2]/60 mb-1 block">O que está sendo entregue? <span className="text-[#F2F2F2]/30">(opcional)</span></label>
                        <input
                          value={details.contents}
                          onChange={e => setDetails(d => ({ ...d, contents: e.target.value }))}
                          placeholder="Ex: Roupas, documentos..."
                          className="w-full bg-[#0D0D0D] border border-[#F2F2F2]/10 rounded-xl px-4 py-3 text-[#F2F2F2] placeholder-[#F2F2F2]/30 focus:outline-none focus:border-[#F22998]/50 text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-[#F2F2F2]/60 mb-1 block">Nome do destinatário <span className="text-[#F22998]">*</span></label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#F22998]/50" />
                          <input
                            value={details.recipientName}
                            onChange={e => setDetails(d => ({ ...d, recipientName: e.target.value }))}
                            placeholder="Nome completo"
                            className="w-full bg-[#0D0D0D] border border-[#F2F2F2]/10 rounded-xl pl-10 pr-4 py-3 text-[#F2F2F2] placeholder-[#F2F2F2]/30 focus:outline-none focus:border-[#F22998]/50 text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-sm text-[#F2F2F2]/60 mb-1 block">Telefone do destinatário <span className="text-[#F22998]">*</span></label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#F22998]/50" />
                          <input
                            value={details.recipientPhone}
                            onChange={e => setDetails(d => ({ ...d, recipientPhone: e.target.value }))}
                            placeholder="(16) 99999-9999"
                            type="tel"
                            className="w-full bg-[#0D0D0D] border border-[#F2F2F2]/10 rounded-xl pl-10 pr-4 py-3 text-[#F2F2F2] placeholder-[#F2F2F2]/30 focus:outline-none focus:border-[#F22998]/50 text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-sm text-[#F2F2F2]/60 mb-1 block">Instruções para o entregador <span className="text-[#F2F2F2]/30">(opcional)</span></label>
                        <textarea
                          value={details.instructions}
                          onChange={e => setDetails(d => ({ ...d, instructions: e.target.value }))}
                          placeholder="Ex: Entregar no portão lateral..."
                          rows={3}
                          className="w-full bg-[#0D0D0D] border border-[#F2F2F2]/10 rounded-xl px-4 py-3 text-[#F2F2F2] placeholder-[#F2F2F2]/30 focus:outline-none focus:border-[#F22998]/50 text-sm resize-none"
                        />
                      </div>
                      <button
                        onClick={() => setDetails(d => ({ ...d, fragile: !d.fragile }))}
                        className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                          details.fragile ? 'border-amber-500 bg-amber-500/10' : 'border-[#F2F2F2]/10 bg-[#0D0D0D]'
                        }`}
                      >
                        <AlertTriangle className={`w-5 h-5 ${details.fragile ? 'text-amber-400' : 'text-[#F2F2F2]/40'}`} />
                        <span className={`font-medium text-sm ${details.fragile ? 'text-amber-400' : 'text-[#F2F2F2]/60'}`}>
                          ⚠️ Pacote frágil? {details.fragile ? '(Sim — motorista será alertada)' : '(Clique para marcar)'}
                        </span>
                        <div className={`ml-auto w-5 h-5 rounded-md border-2 flex items-center justify-center ${details.fragile ? 'bg-amber-500 border-amber-500' : 'border-[#F2F2F2]/20'}`}>
                          {details.fragile && <Check className="w-3 h-3 text-white" />}
                        </div>
                      </button>
                    </div>
                    <Button
                      onClick={() => setStep(4)}
                      disabled={!canProceedStep3}
                      className="w-full mt-5 btn-gradient py-5 rounded-2xl text-base font-semibold disabled:opacity-40"
                    >
                      Próximo — Pagamento
                      <ChevronRight className="w-5 h-5 ml-2" />
                    </Button>
                  </Card>
                </motion.div>
              )}

              {/* ETAPA 4: Pagamento */}
              {step === 4 && (
                <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  {/* Resumo */}
                  <Card className="p-5 bg-[#F2F2F2]/5 border-[#F22998]/10 rounded-3xl">
                    <h2 className="text-lg font-bold text-[#F2F2F2] mb-4">Resumo da Entrega</h2>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-[#F2F2F2]/50">Coleta</p>
                          <p className="text-sm text-[#F2F2F2]">{pickup}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#F22998] mt-1.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-[#F2F2F2]/50">Entrega</p>
                          <p className="text-sm text-[#F2F2F2]">{destination}</p>
                        </div>
                      </div>
                      <div className="border-t border-[#F2F2F2]/10 pt-3 grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-[#F2F2F2]/50 text-xs">Tamanho</p>
                          <p className="text-[#F2F2F2] font-medium">{selectedSizeObj?.label} ({selectedSizeObj?.weight})</p>
                        </div>
                        <div>
                          <p className="text-[#F2F2F2]/50 text-xs">Distância</p>
                          <p className="text-[#F2F2F2] font-medium">{routeDistance} km</p>
                        </div>
                        {details.recipientName && (
                          <div>
                            <p className="text-[#F2F2F2]/50 text-xs">Destinatário</p>
                            <p className="text-[#F2F2F2] font-medium">{details.recipientName}</p>
                          </div>
                        )}
                        {details.fragile && (
                          <div className="col-span-2">
                            <p className="text-amber-400 text-xs font-medium">⚠️ Pacote frágil</p>
                          </div>
                        )}
                      </div>
                      <div className="border-t border-[#F2F2F2]/10 pt-3">
                        <p className="text-xs text-[#F2F2F2]/50">Cálculo do preço</p>
                        <p className="text-xs text-[#F2F2F2]/40">
                          R$ {selectedSizeObj?.basePrice.toFixed(2)} + ({routeDistance} km × R$ {selectedSizeObj?.pricePerKm.toFixed(2)})
                        </p>
                        <p className="text-2xl font-bold text-[#F22998] mt-1">R$ {estimatedPrice}</p>
                      </div>
                    </div>
                  </Card>

                  {/* Pagamento */}
                  <Card className="p-5 bg-[#F2F2F2]/5 border-[#F22998]/10 rounded-3xl">
                    <h3 className="text-base font-bold text-[#F2F2F2] mb-3">Forma de Pagamento</h3>
                    <div className="grid grid-cols-3 gap-3">
                      {PAYMENT_METHODS.map(m => (
                        <button
                          key={m.id}
                          onClick={() => setSelectedPayment(m.id)}
                          className={`p-3 rounded-xl border-2 transition-all text-center ${
                            selectedPayment === m.id ? 'border-[#F22998] bg-[#F22998]/10' : 'border-transparent bg-[#0D0D0D] hover:border-[#F22998]/30'
                          }`}
                        >
                          <span className="text-2xl block mb-1">{m.icon}</span>
                          <p className="text-xs font-medium text-[#F2F2F2]">{m.name}</p>
                        </button>
                      ))}
                    </div>
                  </Card>

                  <Button
                    onClick={handleConfirm}
                    disabled={confirming}
                    className="w-full btn-gradient py-6 rounded-2xl text-lg font-semibold"
                  >
                    {confirming ? (
                      <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Confirmando...</>
                    ) : (
                      <>Confirmar Entrega 📦</>
                    )}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}