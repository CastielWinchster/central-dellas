import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, Navigation, Search, Clock, CreditCard, 
  Car, Shield, Users, ChevronRight, Loader2, Star,
  Wallet, X, Check, Phone, Dog, Crosshair
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import MapView from '../components/map/MapView';
import { toast } from 'sonner';
import { searchAddress, formatAddressForRide } from '@/components/utils/addressParser';

export default function RequestRide() {
  const [user, setUser] = useState(null);
  const [step, setStep] = useState('address');
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');
  const [pickupLocation, setPickupLocation] = useState(null); // { lat, lng, text, userProvidedNumber }
  const [destinationLocation, setDestinationLocation] = useState(null); // { lat, lng, text, userProvidedNumber }
  const [pickupMarkerDraggable, setPickupMarkerDraggable] = useState(false);
  const [destinationMarkerDraggable, setDestinationMarkerDraggable] = useState(false);
  const [selectedRideType, setSelectedRideType] = useState('standard');
  const [selectedPayment, setSelectedPayment] = useState('pix');
  const [acceptsPets, setAcceptsPets] = useState(false);
  const [estimatedPrice, setEstimatedPrice] = useState(null);
  const [estimatedTime, setEstimatedTime] = useState(null);
  const [driver, setDriver] = useState(null);
  const [nearbyDrivers, setNearbyDrivers] = useState([]);
  const [pickupError, setPickupError] = useState('');
  const [destinationError, setDestinationError] = useState('');
  const [loadingPickup, setLoadingPickup] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [userCity, setUserCity] = useState('Orlândia');
  const [locationPermissionAsked, setLocationPermissionAsked] = useState(false);
  const [searchingAddress, setSearchingAddress] = useState(false);
  const [routeDistance, setRouteDistance] = useState(null);
  const [routeDuration, setRouteDuration] = useState(null);
  const abortControllerRef = React.useRef(null);
  const mapRef = React.useRef(null);

  // Handlers para arrastar pins
  const handlePickupDragEnd = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`
      );
      const data = await response.json();

      if (data.address) {
        const addr = data.address;
        const road = addr.road || '';
        const number = pickupLocation?.userProvidedNumber || addr.house_number || 's/n';
        const neighborhood = addr.suburb || addr.neighbourhood || '';
        const city = addr.city || addr.town || addr.village || 'Orlândia';
        const address = `${road}, ${number}${neighborhood ? ', ' + neighborhood : ''}, ${city}`;

        setPickup(address);
        setPickupLocation({
          lat,
          lng,
          text: address,
          userProvidedNumber: pickupLocation?.userProvidedNumber || addr.house_number,
          hasHouseNumber: !!(pickupLocation?.userProvidedNumber || addr.house_number)
        });

        toast.success('📍 Localização de origem ajustada');
      }
    } catch (error) {
      console.error('Erro no reverse geocode:', error);
      toast.error('Erro ao atualizar endereço');
    }
  };

  const handleDestinationDragEnd = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`
      );
      const data = await response.json();

      if (data.address) {
        const addr = data.address;
        const road = addr.road || '';
        const number = destinationLocation?.userProvidedNumber || addr.house_number || 's/n';
        const neighborhood = addr.suburb || addr.neighbourhood || '';
        const city = addr.city || addr.town || addr.village || 'Orlândia';
        const address = `${road}, ${number}${neighborhood ? ', ' + neighborhood : ''}, ${city}`;

        setDestination(address);
        setDestinationLocation({
          lat,
          lng,
          text: address,
          userProvidedNumber: destinationLocation?.userProvidedNumber || addr.house_number,
          hasHouseNumber: !!(destinationLocation?.userProvidedNumber || addr.house_number)
        });

        toast.success('📍 Localização de destino ajustada');

        // Recalcular rota se origem já existe
        if (pickupLocation) {
          calculateRouteAndPrice(pickupLocation, { lat, lng });
        }
      }
    } catch (error) {
      console.error('Erro no reverse geocode:', error);
      toast.error('Erro ao atualizar endereço');
    }
  };

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
        if (userData.preferred_payment) {
          setSelectedPayment(userData.preferred_payment);
        }
      } catch (e) {
        base44.auth.redirectToLogin();
      }
    };
    loadUser();
    
    // Não precisamos mais de motoristas fictícios
    setNearbyDrivers([]);
    
    // Pedir permissão de localização imediatamente ao carregar
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    if (locationPermissionAsked) return;
    setLocationPermissionAsked(true);
    
    if (navigator.geolocation) {
      setGettingLocation(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setPickupLocation({ lat: latitude, lng: longitude });
          
          // Geocodificação reversa
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`
            );
            const data = await response.json();
            if (data.address) {
              const city = data.address.city || data.address.town || data.address.village || 'Orlândia';
              setUserCity(city);
              
              const address = `${data.address.road || ''}, ${data.address.house_number || 's/n'}, ${data.address.suburb || data.address.neighbourhood || ''}, ${city}`.trim();
              setPickup(address);
              toast.success('📍 Localização detectada automaticamente!');
            }
          } catch (error) {
            console.error('Erro na geocodificação reversa:', error);
          }
          setGettingLocation(false);
        },
        (error) => {
          console.error('Erro ao obter localização:', error);
          setGettingLocation(false);
          toast.info('💡 Ative a localização para preencher seu endereço automaticamente', {
            duration: 5000
          });
        }
      );
    } else {
      toast.info('💡 Seu navegador não suporta geolocalização. Digite seu endereço manualmente.');
    }
  };

  const getCurrentLocation = async () => {
    setGettingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`
            );
            const data = await response.json();
            if (data.address) {
              const city = data.address.city || data.address.town || data.address.village || 'Orlândia';
              setUserCity(city);

              const addr = data.address;
              const road = addr.road || '';
              const number = addr.house_number || 's/n';
              const neighborhood = addr.suburb || addr.neighbourhood || '';
              const address = `${road}, ${number}${neighborhood ? ', ' + neighborhood : ''}, ${city}`;

              const locationData = {
                lat: latitude,
                lng: longitude,
                text: address,
                userProvidedNumber: addr.house_number || null,
                hasHouseNumber: !!addr.house_number
              };

              setPickup(address);
              setPickupLocation(locationData);

              if (!addr.house_number) {
                setPickupMarkerDraggable(true);
                toast.info('📍 Arraste o pin para ajustar se necessário', { duration: 3000 });
              } else {
                toast.success('📍 Localização atualizada');
              }
            }
          } catch (error) {
            console.error('Erro na geocodificação reversa:', error);
            setPickupLocation({ lat: latitude, lng: longitude, text: '' });
          }
          setGettingLocation(false);
        },
        (error) => {
          console.error('Erro ao obter localização:', error);
          setGettingLocation(false);
          toast.error('Não foi possível obter sua localização');
        }
      );
    } else {
      setGettingLocation(false);
      toast.error('Geolocalização não suportada');
    }
  };

  // Autocomplete inteligente com parser robusto (400ms debounce)
  const handleDestinationInput = React.useCallback(
    debounce(async (value) => {
      if (value.length < 3) {
        setSuggestions([]);
        setShowSuggestions(false);
        setSearchingAddress(false);
        return;
      }
      
      // Cancelar requisição anterior
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();
      
      try {
        setSearchingAddress(true);
        
        // Usar parser inteligente com localização do usuário
        const userLoc = pickupLocation ? {
          lat: pickupLocation.lat,
          lng: pickupLocation.lng
        } : null;
        
        const results = await searchAddress(
          value,
          userLoc,
          abortControllerRef.current.signal
        );
        
        if (results.length > 0) {
          const formatted = results.map(item => ({
            display_name: item.formattedAddress,
            lat: parseFloat(item.lat),
            lon: parseFloat(item.lon),
            address: item.address,
            userProvidedNumber: item.userProvidedNumber,
            rawResult: item
          }));
          
          setSuggestions(formatted);
          setShowSuggestions(true);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Erro ao buscar endereços:', error);
          toast.error('Erro ao buscar endereço. Tente novamente.');
        }
      } finally {
        setSearchingAddress(false);
      }
    }, 400),
    [pickupLocation]
  );

  // Função debounce
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  const selectSuggestion = async (suggestion) => {
    const lat = parseFloat(suggestion.lat);
    const lng = parseFloat(suggestion.lon);

    // Confirmar endereço com reverse geocode
    try {
      const reverseResponse = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`
      );
      const reverseData = await reverseResponse.json();

      // Formatar endereço final
      let finalAddress = '';
      const addr = reverseData.address;

      if (addr) {
        const road = addr.road || addr.street || '';
        const number = suggestion.userProvidedNumber || addr.house_number || '';
        const neighborhood = addr.suburb || addr.neighbourhood || '';
        const city = addr.city || addr.town || addr.village || 'Orlândia';

        if (number) {
          finalAddress = `${road}, ${number}${neighborhood ? ', ' + neighborhood : ''}, ${city}`;
        } else {
          finalAddress = `${road}${neighborhood ? ', ' + neighborhood : ''}, ${city}`;
        }
      } else {
        finalAddress = suggestion.display_name;
      }

      // Salvar estado completo
      const locationData = {
        lat,
        lng,
        text: finalAddress,
        userProvidedNumber: suggestion.userProvidedNumber || addr?.house_number || null,
        hasHouseNumber: !!(suggestion.userProvidedNumber || addr?.house_number)
      };

      setDestination(finalAddress);
      setDestinationLocation(locationData);
      setSuggestions([]);
      setShowSuggestions(false);
      setDestinationError('');
      setSearchingAddress(false);

      // Ativar pin ajustável se não tiver número
      if (!locationData.hasHouseNumber) {
        setDestinationMarkerDraggable(true);
        toast.info('📍 Arraste o pin para ajustar a localização exata', { duration: 4000 });
      }

      // Feedback visual
      if (suggestion.userProvidedNumber && !addr?.house_number) {
        toast.success(`✅ Endereço com nº ${suggestion.userProvidedNumber}`, { duration: 3000 });
      }

      // Recalcular preços
      if (pickupLocation) {
        calculateRouteAndPrice(pickupLocation, { lat, lng });
      }
    } catch (error) {
      console.error('Erro no reverse geocode:', error);
      // Fallback: usar o endereço sugerido
      const fullAddress = suggestion.userProvidedNumber 
        ? formatAddressForRide(suggestion.rawResult, suggestion.userProvidedNumber)
        : suggestion.display_name;

      setDestination(fullAddress);
      setDestinationLocation({ 
        lat, 
        lng,
        text: fullAddress,
        userProvidedNumber: suggestion.userProvidedNumber
      });
      setSuggestions([]);
      setShowSuggestions(false);
      setDestinationError('');
      setSearchingAddress(false);
    }
  };

  // Calcular distância e preço da rota
  const calculateRouteAndPrice = async (origin, destination) => {
    try {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=false`
      );
      const data = await response.json();
      
      if (data.routes && data.routes[0]) {
        const distanceKm = (data.routes[0].distance / 1000).toFixed(1);
        const durationMin = Math.ceil(data.routes[0].duration / 60);
        
        setRouteDistance(distanceKm);
        setRouteDuration(durationMin);
        
        // Atualizar preços dos tipos de corrida dinamicamente
        setRideTypes(prevTypes => 
          prevTypes.map(type => {
            let basePrice = 5;
            let pricePerKm = 2.5;
            
            if (type.id === 'shared') {
              basePrice = 3;
              pricePerKm = 1.8;
            } else if (type.id === 'premium') {
              basePrice = 10;
              pricePerKm = 3.5;
            }
            
            const calculatedPrice = Math.ceil(basePrice + (distanceKm * pricePerKm));
            return { ...type, price: calculatedPrice, time: `${durationMin} min` };
          })
        );
        
        // Atualizar preço estimado do tipo selecionado
        const basePrice = selectedRideType === 'shared' ? 3 : selectedRideType === 'premium' ? 10 : 5;
        const pricePerKm = selectedRideType === 'shared' ? 1.8 : selectedRideType === 'premium' ? 3.5 : 2.5;
        const calculatedPrice = Math.ceil(basePrice + (distanceKm * pricePerKm));
        
        setEstimatedPrice(calculatedPrice);
        setEstimatedTime(`${durationMin} min`);
      }
    } catch (error) {
      console.error('Erro ao calcular rota:', error);
    }
  };

  const [rideTypes, setRideTypes] = useState([
    { id: 'standard', name: 'Della Standard', icon: Car, price: 15, time: '5 min', description: 'Econômico e confortável' },
    { id: 'shared', name: 'Carona Segura', icon: Users, price: 10, time: '8 min', description: 'Compartilhe com outras' },
    { id: 'premium', name: 'Della Premium', icon: Star, price: 25, time: '3 min', description: 'Carros top e prioridade' },
  ]);

  const paymentMethods = [
    { id: 'pix', name: 'Pix', icon: '💜' },
    { id: 'credit_card', name: 'Cartão de Crédito', icon: '💳' },
    { id: 'debit_card', name: 'Cartão de Débito', icon: '💳' },
    { id: 'wallet', name: 'Carteira Digital', icon: '👛' },
  ];

  const validateAddress = async (address, isPickup = true) => {
    if (!address || address.trim().length < 5) return false;
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`
      );
      const data = await response.json();
      
      if (data.length === 0) {
        if (isPickup) {
          setPickupError('Por favor, insira um local válido existente na cidade');
        } else {
          setDestinationError('Por favor, insira um local válido existente na cidade');
        }
        return false;
      }
      
      if (isPickup) {
        setPickupError('');
        setPickupLocation({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
      } else {
        setDestinationError('');
        setDestinationLocation({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
      }
      
      return true;
    } catch (error) {
      console.error('Erro na validação:', error);
      return false;
    }
  };

  const handleSearch = async () => {
    if (!pickupLocation?.lat || !pickupLocation?.lng || !destinationLocation?.lat || !destinationLocation?.lng) {
      toast.error('Selecione endereços válidos com localização no mapa');
      return;
    }

    setLoadingPickup(true);

    try {
      // Calcular rota e preços
      await calculateRouteAndPrice(pickupLocation, destinationLocation);
      setStep('options');
    } catch (error) {
      toast.error('Erro ao calcular rota');
    } finally {
      setLoadingPickup(false);
    }
  };

  const [currentRide, setCurrentRide] = useState(null);
  const [searchingDrivers, setSearchingDrivers] = useState(false);
  
  const handleConfirmRide = async () => {
    setStep('searching');
    setSearchingDrivers(true);
    
    try {
      const response = await base44.functions.invoke('dispatchRide', {
        pickupLat: pickupLocation.lat,
        pickupLng: pickupLocation.lng,
        pickupText: pickup,
        dropoffLat: destinationLocation.lat,
        dropoffLng: destinationLocation.lng,
        dropoffText: destination,
        estimatedPrice,
        estimatedDuration: parseInt(estimatedTime),
        rideType: selectedRideType,
        hasPet: acceptsPets
      });
      
      if (response.data.success) {
        setCurrentRide(response.data.ride);
        // Polling para verificar se foi aceita
        startRidePolling(response.data.ride.id);
      } else if (response.data.noDrivers) {
        toast.error(response.data.error);
        setStep('options');
      }
    } catch (error) {
      console.error('Erro ao buscar motorista:', error);
      toast.error('Erro ao buscar motoristas. Tente novamente.');
      setStep('options');
    } finally {
      setSearchingDrivers(false);
    }
  };
  
  const startRidePolling = (rideId) => {
    const pollInterval = setInterval(async () => {
      try {
        const rides = await base44.entities.Ride.filter({ id: rideId });
        if (rides.length === 0) return;
        
        const ride = rides[0];
        
        if (ride.status === 'accepted') {
          clearInterval(pollInterval);
          // Buscar dados da motorista
          const driverData = await base44.entities.User.filter({ id: ride.assigned_driver_id });
          const vehicles = await base44.entities.Vehicle.filter({ driver_id: ride.assigned_driver_id });
          
          if (driverData.length > 0) {
            setDriver({
              name: driverData[0].full_name,
              photo: driverData[0].photo_url || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
              rating: 4.9,
              totalRides: 234,
              vehicle: vehicles[0] ? {
                model: `${vehicles[0].brand} ${vehicles[0].model}`,
                color: vehicles[0].color,
                plate: vehicles[0].plate
              } : {
                model: 'Veículo',
                color: 'N/A',
                plate: 'N/A'
              },
              eta: 4
            });
            setStep('driver_found');
          }
        } else if (ride.status === 'expired' || ride.status === 'cancelled') {
          clearInterval(pollInterval);
          toast.error('Nenhuma motorista aceitou sua corrida');
          setStep('options');
        }
      } catch (error) {
        console.error('Erro no polling:', error);
      }
    }, 2000);
    
    // Timeout de 20 segundos
    setTimeout(() => {
      clearInterval(pollInterval);
      if (step === 'searching') {
        toast.error('Nenhuma motorista aceitou sua corrida');
        setStep('options');
      }
    }, 20000);
  };

  const simulatedDriver = {
    name: 'Maria Silva',
    photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
    rating: 4.9,
    totalRides: 234,
    vehicle: {
      model: 'Honda Fit',
      color: 'Prata',
      plate: 'ABC-1234'
    },
    eta: 4
  };

  return (
    <div className="min-h-screen pb-24 md:pb-10">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Map */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="h-[300px] lg:h-[600px] rounded-3xl overflow-hidden relative"
          >
            <MapView
              pickupLocation={pickupLocation}
              destinationLocation={destinationLocation}
              nearbyDrivers={[]}
              showRoute={!!pickupLocation && !!destinationLocation}
              className="h-full"
              showRealTimeDrivers={true}
              filterPets={acceptsPets}
              onPickupDragEnd={handlePickupDragEnd}
              onDestinationDragEnd={handleDestinationDragEnd}
              pickupDraggable={pickupMarkerDraggable}
              destinationDraggable={destinationMarkerDraggable}
            />
            
            {/* Card flutuante com informações da rota */}
            {routeDistance && routeDuration && step === 'options' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl px-6 py-3 flex items-center gap-6 z-10"
              >
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#F22998]" />
                  <div>
                    <p className="text-xs text-gray-500">Distância</p>
                    <p className="font-bold text-gray-900">{routeDistance} km</p>
                  </div>
                </div>
                <div className="w-px h-8 bg-gray-200" />
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[#F22998]" />
                  <div>
                    <p className="text-xs text-gray-500">Tempo</p>
                    <p className="font-bold text-gray-900">{routeDuration} min</p>
                  </div>
                </div>
                <div className="w-px h-8 bg-gray-200" />
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-[#F22998]" />
                  <div>
                    <p className="text-xs text-gray-500">Estimado</p>
                    <p className="font-bold text-[#F22998]">R$ {estimatedPrice}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Controls */}
          <div className="space-y-4">
            <AnimatePresence mode="wait">
              {/* Address Input Step */}
              {step === 'address' && (
                <motion.div
                  key="address"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  <Card className="p-6 bg-[#F2F2F2]/5 border-[#F22998]/10 rounded-3xl">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm text-[#F2F2F2]/70 mb-2 block font-medium">
                          De onde você está
                        </label>
                        <div className="relative">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2">
                            <div className="w-3 h-3 rounded-full bg-green-500" />
                          </div>
                          <Input
                            placeholder="Digite seu endereço"
                            value={pickup}
                            onChange={(e) => {
                              setPickup(e.target.value);
                              setPickupError('');
                            }}
                            onBlur={() => pickup && validateAddress(pickup, true)}
                            className={`pl-10 py-6 bg-[#0D0D0D] border-[#F22998]/20 rounded-xl text-[#F2F2F2] placeholder:text-[#F2F2F2]/40 ${
                              pickupError ? 'border-red-500' : ''
                            }`}
                          />
                          {gettingLocation && (
                            <button
                              onClick={getCurrentLocation}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#F22998] hover:text-[#BF3B79]"
                            >
                              <Loader2 className="w-5 h-5 animate-spin" />
                            </button>
                          )}
                          {!gettingLocation && (
                            <button
                              onClick={getCurrentLocation}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#F22998] hover:text-[#BF3B79]"
                              title="Usar localização atual"
                            >
                              <Crosshair className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                        {pickupError && (
                          <p className="text-xs text-red-500 mt-1">{pickupError}</p>
                        )}
                      </div>
                      
                      <div className="relative">
                        <label className="text-sm text-[#F2F2F2]/70 mb-2 block font-medium">
                          Para onde vai
                        </label>
                        <div className="relative">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                            <div className="w-3 h-3 rounded-full bg-[#F22998]" />
                          </div>
                          <Input
                            placeholder="Digite o destino"
                            value={destination}
                            onChange={(e) => {
                              setDestination(e.target.value);
                              setDestinationError('');
                              setSearchingAddress(true);
                              handleDestinationInput(e.target.value);
                            }}
                            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                            onBlur={() => {
                              setTimeout(() => setShowSuggestions(false), 200);
                            }}
                            className={`pl-10 py-6 bg-[#0D0D0D] border-[#F22998]/20 rounded-xl text-[#F2F2F2] placeholder:text-[#F2F2F2]/40 ${
                              destinationError ? 'border-red-500' : ''
                            }`}
                          />
                          {searchingAddress && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              <Loader2 className="w-4 h-4 text-[#F22998] animate-spin" />
                            </div>
                          )}
                        </div>
                        
                        {/* Dropdown de sugestões */}
                        <AnimatePresence>
                          {showSuggestions && suggestions.length > 0 && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              transition={{ duration: 0.15 }}
                              className="absolute z-50 w-full mt-1 bg-[#1a1a1a] border border-[#F22998]/30 rounded-xl shadow-2xl overflow-hidden max-h-[300px] overflow-y-auto"
                            >
                              {suggestions.map((suggestion, index) => (
                                <button
                                  key={index}
                                  onClick={() => selectSuggestion(suggestion)}
                                  className="w-full px-4 py-3 text-left hover:bg-[#F22998]/10 transition-colors border-b border-[#F22998]/10 last:border-b-0"
                                >
                                  <div className="flex items-start gap-3">
                                    <MapPin className="w-4 h-4 text-[#F22998] mt-1 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm text-[#F2F2F2] font-medium">
                                        {suggestion.address?.road || suggestion.display_name.split(',')[0]}
                                        {suggestion.userProvidedNumber && (
                                          <span className="text-[#F22998] ml-1">
                                            nº {suggestion.userProvidedNumber}
                                          </span>
                                        )}
                                      </p>
                                      <p className="text-xs text-[#F2F2F2]/50 truncate">
                                        {suggestion.address?.suburb || suggestion.address?.neighbourhood ? 
                                          `${suggestion.address.suburb || suggestion.address.neighbourhood} - ` : ''}
                                        {suggestion.address?.city || suggestion.address?.town || suggestion.address?.village || 'Orlândia'}
                                      </p>
                                      {suggestion.userProvidedNumber && !suggestion.address?.house_number && (
                                        <p className="text-xs text-yellow-400 mt-0.5">
                                          📍 Número informado por você
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                        
                        {destinationError && (
                          <p className="text-xs text-red-500 mt-1">{destinationError}</p>
                        )}
                      </div>
                    </div>

                    <Button 
                      onClick={handleSearch}
                      disabled={!pickupLocation?.lat || !destinationLocation?.lat || loadingPickup}
                      className="w-full mt-6 btn-gradient py-6 rounded-2xl text-lg font-semibold disabled:opacity-50"
                    >
                      {loadingPickup ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Validando...
                        </>
                      ) : (
                        <>
                          <Search className="w-5 h-5 mr-2" />
                          Buscar Motoristas
                        </>
                      )}
                    </Button>

                    {/* Status dos endereços */}
                    <div className="flex items-center justify-center gap-4 mt-3 text-xs">
                      <div className={`flex items-center gap-1 ${pickupLocation?.lat ? 'text-green-400' : 'text-[#F2F2F2]/40'}`}>
                        <div className={`w-2 h-2 rounded-full ${pickupLocation?.lat ? 'bg-green-400' : 'bg-[#F2F2F2]/40'}`} />
                        Origem
                      </div>
                      <div className={`flex items-center gap-1 ${destinationLocation?.lat ? 'text-green-400' : 'text-[#F2F2F2]/40'}`}>
                        <div className={`w-2 h-2 rounded-full ${destinationLocation?.lat ? 'bg-green-400' : 'bg-[#F2F2F2]/40'}`} />
                        Destino
                      </div>
                    </div>
                  </Card>

                  {/* Recent Destinations */}
                  <Card className="p-6 bg-[#F2F2F2]/5 border-[#F22998]/10 rounded-3xl">
                    <h3 className="text-sm font-medium text-[#F2F2F2]/60 mb-4">Destinos Recentes</h3>
                    <div className="space-y-3">
                      {[
                        { name: 'Shopping Ibirapuera', address: 'Av. Ibirapuera, 3103' },
                        { name: 'Aeroporto Congonhas', address: 'Av. Washington Luís' },
                        { name: 'Parque Villa-Lobos', address: 'Av. Prof. Fonseca Rodrigues, 1025' },
                      ].map((place, index) => (
                        <button
                          key={index}
                          onClick={() => setDestination(place.address)}
                          className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-[#F22998]/10 transition-colors text-left"
                        >
                          <div className="w-10 h-10 rounded-full bg-[#F22998]/10 flex items-center justify-center">
                            <Clock className="w-5 h-5 text-[#F22998]" />
                          </div>
                          <div>
                            <p className="text-[#F2F2F2] font-medium">{place.name}</p>
                            <p className="text-[#F2F2F2]/50 text-sm">{place.address}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* Options Step */}
              {step === 'options' && (
                <motion.div
                  key="options"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  {/* Ride Types */}
                  <Card className="p-6 bg-[#F2F2F2]/5 border-[#F22998]/10 rounded-3xl">
                    <h3 className="text-lg font-semibold text-[#F2F2F2] mb-4">Escolha seu tipo de corrida</h3>
                    <div className="space-y-3">
                      {rideTypes.map((type) => (
                        <motion.button
                          key={type.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setSelectedRideType(type.id);
                            setEstimatedPrice(type.price);
                            setEstimatedTime(type.time);
                          }}
                          className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                            selectedRideType === type.id
                              ? 'border-[#F22998] bg-[#F22998]/10'
                              : 'border-transparent bg-[#0D0D0D] hover:border-[#F22998]/30'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                              selectedRideType === type.id
                                ? 'bg-gradient-to-br from-[#BF3B79] to-[#F22998]'
                                : 'bg-[#F22998]/20'
                            }`}>
                              <type.icon className={`w-6 h-6 ${selectedRideType === type.id ? 'text-white' : 'text-[#F22998]'}`} />
                            </div>
                            <div className="text-left">
                              <p className="font-semibold text-[#F2F2F2]">{type.name}</p>
                              <p className="text-sm text-[#F2F2F2]/50">{type.description}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-[#F22998]">R$ {type.price},00</p>
                            <p className="text-sm text-[#F2F2F2]/50">{type.time}</p>
                          </div>
                        </motion.button>
                      ))}
                    </div>

                    {/* Filtro Aceita Pets */}
                    <div className="mt-4 pt-4 border-t border-[#F22998]/10">
                      <div className="flex items-center justify-between p-4 rounded-xl bg-[#0D0D0D]">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                            <Dog className="w-5 h-5 text-purple-400" />
                          </div>
                          <span className="font-medium text-[#F2F2F2]">Aceita Pets</span>
                        </div>
                        <Switch
                          checked={acceptsPets}
                          onCheckedChange={setAcceptsPets}
                        />
                      </div>
                      {acceptsPets && (
                        <p className="text-xs text-purple-400 mt-2 ml-1">
                          Mostrando apenas motoristas que aceitam pets no mapa
                        </p>
                      )}
                    </div>
                  </Card>

                  {/* Payment Methods */}
                  <Card className="p-6 bg-[#F2F2F2]/5 border-[#F22998]/10 rounded-3xl">
                    <h3 className="text-lg font-semibold text-[#F2F2F2] mb-4">Forma de Pagamento</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {paymentMethods.map((method) => (
                        <button
                          key={method.id}
                          onClick={() => setSelectedPayment(method.id)}
                          className={`p-4 rounded-xl border-2 transition-all ${
                            selectedPayment === method.id
                              ? 'border-[#F22998] bg-[#F22998]/10'
                              : 'border-transparent bg-[#0D0D0D] hover:border-[#F22998]/30'
                          }`}
                        >
                          <span className="text-2xl mb-2 block">{method.icon}</span>
                          <p className="text-sm font-medium text-[#F2F2F2]">{method.name}</p>
                        </button>
                      ))}
                    </div>
                  </Card>

                  {/* Summary and Confirm */}
                  <Card className="p-6 bg-gradient-to-br from-[#BF3B79]/20 to-[#F22998]/20 border-[#F22998]/30 rounded-3xl">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-[#F2F2F2]/60 text-sm">Valor estimado</p>
                        <p className="text-3xl font-bold text-[#F2F2F2]">R$ {estimatedPrice},00</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[#F2F2F2]/60 text-sm">Tempo estimado</p>
                        <p className="text-xl font-semibold text-[#F22998]">{estimatedTime}</p>
                      </div>
                    </div>
                    
                    <Button 
                      onClick={handleConfirmRide}
                      className="w-full btn-gradient py-6 rounded-2xl text-lg font-semibold"
                    >
                      <Check className="w-5 h-5 mr-2" />
                      Confirmar Corrida
                    </Button>
                    
                    <button 
                      onClick={() => setStep('address')}
                      className="w-full mt-3 text-[#F2F2F2]/50 hover:text-[#F2F2F2] transition-colors"
                    >
                      Voltar
                    </button>
                  </Card>
                </motion.div>
              )}

              {/* Searching Step */}
              {step === 'searching' && (
                <motion.div
                  key="searching"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex flex-col items-center justify-center py-12"
                >
                  <Card className="p-10 bg-[#F2F2F2]/5 border-[#F22998]/10 rounded-3xl text-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="w-20 h-20 mx-auto mb-6 rounded-full border-4 border-[#F22998]/20 border-t-[#F22998]"
                    />
                    <h2 className="text-2xl font-bold text-[#F2F2F2] mb-2">Buscando motorista...</h2>
                    <p className="text-[#F2F2F2]/60">Aguarde enquanto encontramos a melhor opção para você</p>
                    
                    <div className="mt-8 flex items-center justify-center gap-2">
                      <Shield className="w-5 h-5 text-[#F22998]" />
                      <span className="text-sm text-[#F2F2F2]/60">Motoristas verificadas</span>
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* Driver Found Step */}
              {step === 'driver_found' && driver && (
                <motion.div
                  key="driver_found"
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -50 }}
                  className="space-y-4"
                >
                  <Card className="p-6 bg-[#F2F2F2]/5 border-[#F22998]/10 rounded-3xl">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm">
                        <Check className="w-4 h-4" />
                        Motorista encontrada!
                      </div>
                      <p className="text-[#F22998] font-semibold">
                        {driver.eta} min até você
                      </p>
                    </div>

                    <div className="flex items-center gap-4 mb-6">
                      <div className="relative">
                        <img 
                          src={driver.photo}
                          alt={driver.name}
                          className="w-20 h-20 rounded-full object-cover border-3 border-[#F22998]"
                        />
                        <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-gradient-to-br from-[#BF3B79] to-[#F22998] flex items-center justify-center text-white text-xs font-bold">
                          {driver.rating}
                        </div>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-[#F2F2F2]">{driver.name}</h3>
                        <div className="flex items-center gap-2 text-[#F2F2F2]/60">
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                          <span>{driver.rating} • {driver.totalRides} corridas</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#0D0D0D] mb-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Car className="w-8 h-8 text-[#F22998]" />
                          <div>
                            <p className="font-medium text-[#F2F2F2]">{driver.vehicle.model}</p>
                            <p className="text-sm text-[#F2F2F2]/50">{driver.vehicle.color} • {driver.vehicle.plate}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Button 
                        variant="outline"
                        className="py-6 rounded-2xl border-[#F22998]/30 text-[#F22998] hover:bg-[#F22998]/10"
                      >
                        <Phone className="w-5 h-5 mr-2" />
                        Ligar
                      </Button>
                      <Button 
                        variant="outline"
                        className="py-6 rounded-2xl border-[#F22998]/30 text-[#F22998] hover:bg-[#F22998]/10"
                      >
                        <MessageCircle className="w-5 h-5 mr-2" />
                        Mensagem
                      </Button>
                    </div>
                  </Card>

                  {/* Emergency Button */}
                  <Card className="p-4 bg-red-500/10 border-red-500/30 rounded-3xl">
                    <button className="w-full flex items-center justify-center gap-3 text-red-400 font-medium">
                      <Shield className="w-5 h-5" />
                      Botão de Emergência
                    </button>
                  </Card>

                  {/* Share Route */}
                  <button className="w-full p-4 rounded-2xl border border-[#F22998]/20 text-[#F22998] hover:bg-[#F22998]/10 transition-colors flex items-center justify-center gap-2">
                    <Navigation className="w-5 h-5" />
                    Compartilhar minha rota
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageCircle(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>
    </svg>
  );
}